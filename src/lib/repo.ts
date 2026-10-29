import "server-only";
import { getDb, type Db } from "@/db";
import { hashToken, tokenMatches } from "./tokens";
import type { Locale } from "./i18n";

export type EventRow = {
  id: string;
  slug: string;
  name: string;
  owner_name: string;
  owner_email: string;
  admin_token_hash: string;
  locale: Locale;
  status: "open" | "drawn";
};

export type ParticipantRow = {
  id: string;
  event_id: string;
  name: string;
  email: string;
  wishlist: string;
  locale: Locale;
  edit_token_hash: string;
};

export type ExclusionRow = { id: string; participant_a_id: string; participant_b_id: string };

export type AssignmentRow = {
  giver_id: string;
  receiver_id: string;
  email_status: "pending" | "sent" | "failed";
};

export async function findEvent(slug: string, db?: Db): Promise<EventRow | null> {
  const d = db ?? (await getDb());
  const [row] = await d.query<EventRow>("SELECT * FROM events WHERE slug = $1", [slug]);
  return row ?? null;
}

/** Returns the event only if the admin key is valid. */
export async function findEventAsAdmin(slug: string, key: string | undefined): Promise<EventRow | null> {
  const event = await findEvent(slug);
  return event && tokenMatches(key, event.admin_token_hash) ? event : null;
}

export async function findParticipantByToken(
  eventId: string,
  token: string | undefined,
): Promise<ParticipantRow | null> {
  if (!token) return null;
  const rows = await listParticipants(eventId);
  return rows.find((p) => tokenMatches(token, p.edit_token_hash)) ?? null;
}

export async function listParticipants(eventId: string, db?: Db): Promise<ParticipantRow[]> {
  const d = db ?? (await getDb());
  return d.query<ParticipantRow>(
    "SELECT * FROM participants WHERE event_id = $1 ORDER BY created_at",
    [eventId],
  );
}

export async function listExclusions(eventId: string, db?: Db): Promise<ExclusionRow[]> {
  const d = db ?? (await getDb());
  return d.query<ExclusionRow>(
    "SELECT id, participant_a_id, participant_b_id FROM exclusions WHERE event_id = $1",
    [eventId],
  );
}

/** Resolves the gift-idea link from a draw mail to the receiver it was drawn for. */
export async function findReceiverByIdeaToken(
  slug: string | undefined,
  token: string | undefined,
): Promise<{ name: string; wishlist: string } | null> {
  if (!slug || !token) return null;
  const d = await getDb();
  const [row] = await d.query<{ name: string; wishlist: string }>(
    `SELECT p.name, p.wishlist FROM assignments a
       JOIN events e ON e.id = a.event_id
       JOIN participants p ON p.id = a.receiver_id
      WHERE e.slug = $1 AND a.idea_token_hash = $2`,
    [slug, hashToken(token)],
  );
  return row ?? null;
}

export async function listAssignments(eventId: string): Promise<AssignmentRow[]> {
  const d = await getDb();
  return d.query<AssignmentRow>(
    "SELECT giver_id, receiver_id, email_status FROM assignments WHERE event_id = $1",
    [eventId],
  );
}
