"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/db";
import type { ErrorKey } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { findReceiverByIdeaToken } from "@/lib/repo";
import { closeness, genders, giftStyles, suggestGifts, type GiftIdea } from "@/lib/gifts";

export type IdeasState = { ok: true; ideas: GiftIdea[] } | { ok: false; error?: ErrorKey };

const HOURLY_LIMIT = 10;

const surveySchema = z.object({
  gender: z.enum(genders),
  style: z.enum(giftStyles),
  closeness: z.enum(closeness),
  interests: z.string().trim().max(500).default(""),
  description: z.string().trim().max(300).default(""),
  wishlist: z.string().trim().max(2000).default(""),
});

export async function getGiftIdeas(
  slug: string | undefined,
  token: string | undefined,
  _prev: IdeasState,
  form: FormData,
): Promise<IdeasState> {
  if (form.get("website")) return { ok: false, error: "invalid" }; // honeypot
  const parsed = surveySchema.safeParse({
    gender: form.get("gender"),
    style: form.get("style"),
    closeness: form.get("closeness"),
    interests: form.get("interests") ?? "",
    description: form.get("description") ?? "",
    wishlist: form.get("wishlist") ?? "",
  });
  if (!parsed.success) return { ok: false, error: "invalid" };
  const survey = parsed.data;
  if (!survey.interests && !survey.description && !survey.wishlist) return { ok: false, error: "needMore" };

  // Coming from a draw mail: use the receiver's real wishlist, not what the form sent.
  const receiver = await findReceiverByIdeaToken(slug, token);
  if (receiver) survey.wishlist = receiver.wishlist;

  const db = await getDb();
  const ip = ((await headers()).get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const [{ n }] = await db.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM ai_requests WHERE ip = $1 AND created_at > now() - interval '1 hour'",
    [ip],
  );
  if (n >= HOURLY_LIMIT) return { ok: false, error: "rateLimited" };
  await db.query("INSERT INTO ai_requests (ip) VALUES ($1)", [ip]);

  try {
    return { ok: true, ideas: await suggestGifts(survey, await getLocale()) };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "aiFailed" };
  }
}
