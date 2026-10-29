"use client";

import { useActionState, useState, useTransition } from "react";
import { leaveEvent, updateWishlist, type FormState } from "@/app/actions/participant";
import type { Messages } from "@/lib/i18n";

type Props = {
  slug: string;
  token: string;
  name: string;
  email: string;
  wishlist: string;
  locked: boolean;
  t: Messages;
};

export default function MeForm({ slug, token, name, email, wishlist, locked, t }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateWishlist.bind(null, slug, token),
    { ok: false },
  );
  const [left, setLeft] = useState<FormState | null>(null);
  const [leaving, startLeave] = useTransition();

  if (left?.ok) return <p className="alert-ok">{t.me.left}</p>;

  return (
    <form action={action} className="card space-y-4">
      <h2 className="text-xl font-bold">{t.me.title}</h2>
      <p className="text-sm text-muted">
        <b className="text-ink">{name}</b> · {email}
      </p>
      <div>
        <label className="label" htmlFor="wishlist">{t.home.wishlist}</label>
        <textarea
          id="wishlist"
          name="wishlist"
          rows={4}
          maxLength={2000}
          defaultValue={wishlist}
          disabled={locked}
          placeholder={t.home.wishlistPh}
          className="input"
        />
      </div>
      {locked && <p className="alert-ok">{t.me.locked}</p>}
      {state.ok && <p className="alert-ok">{t.me.saved}</p>}
      {(state.error || left?.error) && <p className="alert-error">{t.errors[(state.error ?? left?.error)!]}</p>}
      {!locked && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="submit" disabled={pending} className="btn">
            {t.me.save}
          </button>
          <button
            type="button"
            disabled={leaving}
            className="btn-ghost text-red"
            onClick={() => {
              if (!confirm(t.me.leaveConfirm)) return;
              startLeave(async () => setLeft(await leaveEvent(slug, token)));
            }}
          >
            {t.me.leave}
          </button>
        </div>
      )}
    </form>
  );
}
