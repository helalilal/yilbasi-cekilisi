"use client";

import { useActionState, useState } from "react";
import { createEvent, type CreateState } from "@/app/actions/event";
import type { Messages } from "@/lib/i18n";
import CopyField from "./CopyField";
import Honeypot from "./Honeypot";

export default function CreateForm({ t }: { t: Messages }) {
  const [state, action, pending] = useActionState<CreateState, FormData>(createEvent, { ok: false });
  const [joinToo, setJoinToo] = useState(true);

  if (state.ok) {
    return (
      <section className="card space-y-5">
        <h2 className="text-xl font-bold">{t.created.title}</h2>
        <div>
          <p className="label">{t.created.joinLink}</p>
          <CopyField value={state.joinUrl} copy={t.created.copy} copied={t.created.copied} />
          <p className="mt-1 text-sm text-muted">{t.created.joinHint}</p>
        </div>
        <div>
          <p className="label">{t.created.adminLink} 🔒</p>
          <CopyField value={state.adminUrl} copy={t.created.copy} copied={t.created.copied} />
          <p className="mt-1 text-sm text-muted">{t.created.adminHint}</p>
        </div>
        <a href={state.adminUrl} className="btn w-full">
          {t.created.goAdmin}
        </a>
      </section>
    );
  }

  return (
    <form action={action} className="card relative space-y-4">
      <h2 className="text-xl font-bold">{t.home.formTitle}</h2>
      <Honeypot />
      <div>
        <label className="label" htmlFor="eventName">{t.home.eventName}</label>
        <input id="eventName" name="eventName" required maxLength={80} placeholder={t.home.eventNamePh} className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="ownerName">{t.home.ownerName}</label>
          <input id="ownerName" name="ownerName" required maxLength={60} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="ownerEmail">{t.home.ownerEmail}</label>
          <input id="ownerEmail" name="ownerEmail" type="email" required maxLength={200} className="input" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="joinToo"
          checked={joinToo}
          onChange={(e) => setJoinToo(e.target.checked)}
          className="h-4 w-4 accent-[var(--green)]"
        />
        {t.home.joinToo}
      </label>
      {joinToo && (
        <div>
          <label className="label" htmlFor="wishlist">{t.home.wishlist}</label>
          <textarea id="wishlist" name="wishlist" rows={3} maxLength={2000} placeholder={t.home.wishlistPh} className="input" />
        </div>
      )}
      {state.error && <p className="alert-error">{t.errors[state.error]}</p>}
      <button type="submit" disabled={pending} className="btn w-full">
        {pending ? t.home.creating : t.home.create}
      </button>
    </form>
  );
}
