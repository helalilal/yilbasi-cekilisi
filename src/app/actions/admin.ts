"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import type { ErrorKey } from "@/lib/i18n";
import { drawAssignments, DrawImpossibleError, type Pair } from "@/lib/draw";
import { findEventAsAdmin, listExclusions, listParticipants, type EventRow, type ParticipantRow } from "@/lib/repo";
import { newId } from "@/lib/tokens";
import { sendMail } from "@/lib/mail/transport";
import { drawResultMail } from "@/lib/mail/templates";

export type AdminState = { ok: boolean; error?: ErrorKey };

const MIN_PARTICIPANTS = 3;

function refresh(slug: string) {
  revalidatePath(`/e/${slug}/admin`);
  revalidatePath(`/e/${slug}`);
}

export async function removeParticipant(slug: string, key: string, participantId: string): Promise<AdminState> {
  const event = await findEventAsAdmin(slug, key);
  if (!event) return { ok: false, error: "badLink" };
  if (event.status !== "open") return { ok: false, error: "closed" };
  const db = await getDb();
  await db.query("DELETE FROM participants WHERE id = $1 AND event_id = $2", [participantId, event.id]);
  refresh(slug);
  return { ok: true };
}

export async function addExclusion(slug: string, key: string, _prev: AdminState, form: FormData): Promise<AdminState> {
  const event = await findEventAsAdmin(slug, key);
  if (!event) return { ok: false, error: "badLink" };
  if (event.status !== "open") return { ok: false, error: "closed" };
  const a = String(form.get("a") ?? "");
  const b = String(form.get("b") ?? "");
  if (!a || !b || a === b) return { ok: false, error: "sameTwice" };

  const db = await getDb();
  const ids = new Set((await listParticipants(event.id, db)).map((p) => p.id));
  if (!ids.has(a) || !ids.has(b)) return { ok: false, error: "invalid" };
  const existing = await listExclusions(event.id, db);
  const dup = existing.some(
    (e) => (e.participant_a_id === a && e.participant_b_id === b) || (e.participant_a_id === b && e.participant_b_id === a),
  );
  if (!dup) {
    await db.query(
      "INSERT INTO exclusions (id, event_id, participant_a_id, participant_b_id) VALUES ($1, $2, $3, $4)",
      [newId(), event.id, a, b],
    );
  }
  refresh(slug);
  return { ok: true };
}

export async function removeExclusion(slug: string, key: string, exclusionId: string): Promise<AdminState> {
  const event = await findEventAsAdmin(slug, key);
  if (!event) return { ok: false, error: "badLink" };
  const db = await getDb();
  await db.query("DELETE FROM exclusions WHERE id = $1 AND event_id = $2", [exclusionId, event.id]);
  refresh(slug);
  return { ok: true };
}

async function mailAssignment(
  event: EventRow,
  giver: ParticipantRow,
  receiver: ParticipantRow,
): Promise<boolean> {
  const db = await getDb();
  let ok = true;
  try {
    await sendMail(
      drawResultMail({
        locale: giver.locale,
        to: giver.email,
        giverName: giver.name,
        receiverName: receiver.name,
        receiverWishlist: receiver.wishlist,
        eventName: event.name,
      }),
    );
  } catch (err) {
    console.error(err);
    ok = false;
  }
  await db.query(
    "UPDATE assignments SET email_status = $1, emailed_at = now() WHERE event_id = $2 AND giver_id = $3",
    [ok ? "sent" : "failed", event.id, giver.id],
  );
  return ok;
}

export async function runDraw(slug: string, key: string): Promise<AdminState> {
  const event = await findEventAsAdmin(slug, key);
  if (!event) return { ok: false, error: "badLink" };
  if (event.status !== "open") return { ok: false, error: "closed" };

  const db = await getDb();
  let participants: ParticipantRow[] = [];
  let result: Map<string, string>;
  try {
    result = await db.transaction(async (tx) => {
      // Claim the event first so a double click can't draw twice.
      const claimed = await tx.query(
        "UPDATE events SET status = 'drawn', drawn_at = now() WHERE id = $1 AND status = 'open' RETURNING id",
        [event.id],
      );
      if (!claimed.length) throw new Error("already drawn");
      participants = await listParticipants(event.id, tx);
      if (participants.length < MIN_PARTICIPANTS) throw new RangeError("too few");
      const exclusions = await listExclusions(event.id, tx);
      const pairs: Pair[] = exclusions.map((e) => [e.participant_a_id, e.participant_b_id]);
      const map = drawAssignments(participants.map((p) => p.id), pairs);
      for (const [giver, receiver] of map) {
        await tx.query(
          "INSERT INTO assignments (event_id, giver_id, receiver_id) VALUES ($1, $2, $3)",
          [event.id, giver, receiver],
        );
      }
      return map;
    });
  } catch (err) {
    if (err instanceof DrawImpossibleError) return { ok: false, error: "impossible" };
    if (err instanceof RangeError) return { ok: false, error: "tooFew" };
    if (err instanceof Error && err.message === "already drawn") return { ok: false, error: "closed" };
    console.error(err);
    return { ok: false, error: "generic" };
  }

  const byId = new Map(participants.map((p) => [p.id, p]));
  let allSent = true;
  for (const [giverId, receiverId] of result) {
    allSent = (await mailAssignment(event, byId.get(giverId)!, byId.get(receiverId)!)) && allSent;
  }
  refresh(slug);
  return allSent ? { ok: true } : { ok: false, error: "mailFailed" };
}

export async function resendDrawMail(slug: string, key: string, giverId: string): Promise<AdminState> {
  const event = await findEventAsAdmin(slug, key);
  if (!event) return { ok: false, error: "badLink" };
  if (event.status !== "drawn") return { ok: false, error: "invalid" };
  const db = await getDb();
  const [row] = await db.query<{ receiver_id: string }>(
    "SELECT receiver_id FROM assignments WHERE event_id = $1 AND giver_id = $2",
    [event.id, giverId],
  );
  if (!row) return { ok: false, error: "invalid" };
  const byId = new Map((await listParticipants(event.id, db)).map((p) => [p.id, p]));
  const ok = await mailAssignment(event, byId.get(giverId)!, byId.get(row.receiver_id)!);
  refresh(slug);
  return ok ? { ok: true } : { ok: false, error: "mailFailed" };
}
