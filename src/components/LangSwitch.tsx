"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/app/actions/event";
import { locales, type Locale } from "@/lib/i18n";

export default function LangSwitch({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex rounded-lg border border-line text-sm" aria-busy={pending}>
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          aria-pressed={l === locale}
          onClick={() =>
            start(async () => {
              await setLocale(l);
              router.refresh();
            })
          }
          className={`px-2.5 py-1 uppercase first:rounded-l-lg last:rounded-r-lg ${
            l === locale ? "bg-ink text-bg" : "text-muted hover:text-ink"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
