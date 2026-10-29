"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import type { ErrorKey } from "@/lib/i18n";
import { getBaseUrl, getLocale } from "@/lib/locale";
import { findEvent, findParticipantByToken } from "@/lib/repo";
import { hashToken, newId, newToken } from "@/lib/tokens";
import { sendMail } from "@/lib/mail/transport";
import { joinedMail } from "@/lib/mail/templates";

export type FormState = { ok: boolean; error?: ErrorKey };

const joinSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().pipe(z.email().max(200)),
  wishlist: z.string().trim().max(2000).default(""),
});

export async function joinEvent(slug: string, _prev: FormState, form: FormData): Promise<FormState> {
  if (form.get("website")) return { ok: false, error: "invalid" }; // honeypot
  const parsed = joinSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    wishlist: form.get("wishlist") ?? "",
  });
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { name, email, wishlist } = parsed.data;

  const db = await getDb();
  const event = await findEvent(slug, db);
  if (!event) return { ok: false, error: "notFound" };
  if (event.status !== "open") return { ok: false, error: "closed" };

  const exists = await db.query("SELECT 1 FROM participants WHERE event_id = $1 AND email = $2", [event.id, email]);
  if (exists.length) return { ok: false, error: "emailTaken" };

  const locale = await getLocale();
  const editToken = newToken();
  try {
    await db.query(
      `INSERT INTO participants (id, event_id, name, email, wishlist, locale, edit_token_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [newId(), event.id, name, email, wishlist, locale, hashToken(editToken)],
    );
  } catch (err) {
    console.error(err);
    return { ok: false, error: "emailTaken" }; // unique (event_id, email) race
  }

  const base = await getBaseUrl();
  try {
    await sendMail(
      joinedMail({ locale, to: email, name, eventName: event.name, editUrl: `${base}/e/${slug}/me?token=${editToken}` }),
    );
  } catch (err) {
    console.error(err);
  }
  revalidatePath(`/e/${slug}`);
  return { ok: true };
}

export async function updateWishlist(
  slug: string,
  token: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const wishlist = z.string().trim().max(2000).safeParse(form.get("wishlist") ?? "");
  if (!wishlist.success) return { ok: false, error: "invalid" };
  const event = await findEvent(slug);
  if (!event) return { ok: false, error: "notFound" };
  if (event.status !== "open") return { ok: false, error: "closed" };
  const me = await findParticipantByToken(event.id, token);
  if (!me) return { ok: false, error: "badLink" };
  const db = await getDb();
  await db.query("UPDATE participants SET wishlist = $1 WHERE id = $2", [wishlist.data, me.id]);
  return { ok: true };
}

export async function leaveEvent(slug: string, token: string): Promise<FormState> {
  const event = await findEvent(slug);
  if (!event) return { ok: false, error: "notFound" };
  if (event.status !== "open") return { ok: false, error: "closed" };
  const me = await findParticipantByToken(event.id, token);
  if (!me) return { ok: false, error: "badLink" };
  const db = await getDb();
  await db.query("DELETE FROM participants WHERE id = $1", [me.id]);
  revalidatePath(`/e/${slug}`);
  return { ok: true };
}
