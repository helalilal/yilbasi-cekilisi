"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { getDb } from "@/db";
import { isLocale, LOCALE_COOKIE, type ErrorKey } from "@/lib/i18n";
import { getBaseUrl, getLocale } from "@/lib/locale";
import { hashToken, newId, newSlug, newToken } from "@/lib/tokens";
import { sendMail } from "@/lib/mail/transport";
import { joinedMail, ownerCreatedMail } from "@/lib/mail/templates";

export type CreateState =
  | { ok: true; joinUrl: string; adminUrl: string }
  | { ok: false; error?: ErrorKey };

const createSchema = z.object({
  eventName: z.string().trim().min(1).max(80),
  ownerName: z.string().trim().min(1).max(60),
  ownerEmail: z.string().trim().toLowerCase().pipe(z.email().max(200)),
  joinToo: z.literal("on").optional(),
  wishlist: z.string().trim().max(2000).default(""),
});

export async function createEvent(_prev: CreateState, form: FormData): Promise<CreateState> {
  if (form.get("website")) return { ok: false, error: "invalid" }; // honeypot
  const parsed = createSchema.safeParse({
    eventName: form.get("eventName"),
    ownerName: form.get("ownerName"),
    ownerEmail: form.get("ownerEmail"),
    joinToo: form.get("joinToo") ?? undefined,
    wishlist: form.get("wishlist") ?? "",
  });
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;
  const locale = await getLocale();
  const base = await getBaseUrl();

  const eventId = newId();
  const slug = newSlug();
  const adminToken = newToken();
  const editToken = newToken();

  try {
    const db = await getDb();
    await db.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO events (id, slug, name, owner_name, owner_email, admin_token_hash, locale)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [eventId, slug, data.eventName, data.ownerName, data.ownerEmail, hashToken(adminToken), locale],
      );
      if (data.joinToo) {
        await tx.query(
          `INSERT INTO participants (id, event_id, name, email, wishlist, locale, edit_token_hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [newId(), eventId, data.ownerName, data.ownerEmail, data.wishlist, locale, hashToken(editToken)],
        );
      }
    });
  } catch (err) {
    console.error(err);
    return { ok: false, error: "generic" };
  }

  const joinUrl = `${base}/e/${slug}`;
  const adminUrl = `${base}/e/${slug}/admin?key=${adminToken}`;
  try {
    await sendMail(
      ownerCreatedMail({ locale, to: data.ownerEmail, ownerName: data.ownerName, eventName: data.eventName, joinUrl, adminUrl }),
    );
    if (data.joinToo) {
      await sendMail(
        joinedMail({ locale, to: data.ownerEmail, name: data.ownerName, eventName: data.eventName, editUrl: `${base}/e/${slug}/me?token=${editToken}` }),
      );
    }
  } catch (err) {
    // The links are shown on screen anyway, so a mail failure is not fatal here.
    console.error(err);
  }
  return { ok: true, joinUrl, adminUrl };
}

export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
