import tr, { type Messages } from "@messages/tr";
import en from "@messages/en";

export const locales = ["tr", "en"] as const;
export type Locale = (typeof locales)[number];
export type { Messages };
export type ErrorKey = keyof Messages["errors"];

export const LOCALE_COOKIE = "locale";

export function isLocale(v: unknown): v is Locale {
  return v === "tr" || v === "en";
}

export function getMessages(locale: Locale): Messages {
  return locale === "en" ? en : tr;
}
