"use client";

import { useActionState } from "react";
import { joinEvent, type FormState } from "@/app/actions/participant";
import type { Messages } from "@/lib/i18n";
import Honeypot from "./Honeypot";

export default function JoinForm({ slug, t }: { slug: string; t: Messages }) {
  const [state, action, pending] = useActionState<FormState, FormData>(joinEvent.bind(null, slug), { ok: false });

  if (state.ok) {
    return (
      <section className="card">
        <h2 className="text-xl font-bold">{t.join.joinedTitle}</h2>
        <p className="mt-2 text-muted">{t.join.joinedText}</p>
      </section>
    );
  }

  return (
    <form action={action} className="card relative space-y-4">
      <h2 className="text-xl font-bold">{t.join.formTitle}</h2>
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">{t.join.name}</label>
          <input id="name" name="name" required maxLength={60} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">{t.join.email}</label>
          <input id="email" name="email" type="email" required maxLength={200} className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="wishlist">{t.home.wishlist}</label>
        <textarea id="wishlist" name="wishlist" rows={3} maxLength={2000} placeholder={t.home.wishlistPh} className="input" />
      </div>
      {state.error && <p className="alert-error">{t.errors[state.error]}</p>}
      <button type="submit" disabled={pending} className="btn w-full">
        {pending ? t.join.submitting : t.join.submit}
      </button>
    </form>
  );
}
