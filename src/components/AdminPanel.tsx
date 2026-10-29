"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addExclusion,
  removeExclusion,
  removeParticipant,
  resendDrawMail,
  runDraw,
  type AdminState,
} from "@/app/actions/admin";
import type { Messages } from "@/lib/i18n";

type Participant = { id: string; name: string; email: string; status?: "pending" | "sent" | "failed" };
type Exclusion = { id: string; a: string; b: string };

type Props = {
  slug: string;
  adminKey: string;
  drawn: boolean;
  participants: Participant[];
  exclusions: Exclusion[];
  t: Messages;
};

const MIN_PARTICIPANTS = 3;

export default function AdminPanel({ slug, adminKey, drawn, participants, exclusions, t }: Props) {
  const [result, setResult] = useState<AdminState | null>(null);
  const [pending, start] = useTransition();
  const [exState, exAction, exPending] = useActionState<AdminState, FormData>(
    addExclusion.bind(null, slug, adminKey),
    { ok: false },
  );
  const nameOf = new Map(participants.map((p) => [p.id, p.name]));

  const run = (fn: () => Promise<AdminState>) => start(async () => setResult(await fn()));

  const statusBadge = (s: Participant["status"]) => {
    if (!s) return null;
    const label = s === "sent" ? t.admin.statusSent : s === "failed" ? t.admin.statusFailed : t.admin.statusPending;
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs ${s === "sent" ? "bg-green-soft text-green" : "bg-danger-soft text-red"}`}>
        {label}
      </span>
    );
  };

  return (
    <>
      <section className="card">
        <h2 className="mb-3 font-bold">
          {t.admin.participants} <span className="text-muted">({participants.length})</span>
        </h2>
        {participants.length === 0 ? (
          <p className="text-sm text-muted">{t.admin.nobody}</p>
        ) : (
          <ul className="divide-y divide-line">
            {participants.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="font-medium">{p.name}</p>
                  <p className="truncate text-sm text-muted">{p.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(p.status)}
                  {drawn ? (
                    p.status !== "sent" && (
                      <button
                        type="button"
                        disabled={pending}
                        className="btn-ghost"
                        onClick={() => run(() => resendDrawMail(slug, adminKey, p.id))}
                      >
                        {t.admin.resend}
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      className="btn-ghost text-red"
                      onClick={() => confirm(t.admin.removeConfirm) && run(() => removeParticipant(slug, adminKey, p.id))}
                    >
                      {t.admin.remove}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!drawn && (
        <section className="card space-y-3">
          <div>
            <h2 className="font-bold">🚫 {t.admin.exclusionsTitle}</h2>
            <p className="text-sm text-muted">{t.admin.exclusionsHint}</p>
          </div>
          {exclusions.length === 0 ? (
            <p className="text-sm text-muted">{t.admin.exclusionNone}</p>
          ) : (
            <ul className="space-y-2">
              {exclusions.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 rounded-xl bg-bg px-3 py-2 text-sm">
                  <span>
                    <b>{nameOf.get(e.a)}</b> ⇄ <b>{nameOf.get(e.b)}</b>
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    className="btn-ghost"
                    aria-label="remove"
                    onClick={() => run(() => removeExclusion(slug, adminKey, e.id))}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          {participants.length >= 2 && (
            <form action={exAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <PersonSelect name="a" participants={participants} placeholder={t.admin.choose} />
              <span className="text-center text-sm text-muted">{t.admin.and}</span>
              <PersonSelect name="b" participants={participants} placeholder={t.admin.choose} />
              <button type="submit" disabled={exPending} className="btn-ghost shrink-0 py-2.5">
                {t.admin.exclusionAdd}
              </button>
            </form>
          )}
          {exState.error && <p className="alert-error">{t.errors[exState.error]}</p>}
        </section>
      )}

      <section className="card space-y-3">
        <h2 className="font-bold">🎲 {t.admin.drawTitle}</h2>
        {drawn ? (
          <p className="alert-ok">{t.admin.drawnText}</p>
        ) : participants.length < MIN_PARTICIPANTS ? (
          <p className="text-sm text-muted">{t.admin.minPeople}</p>
        ) : (
          <button
            type="button"
            disabled={pending}
            className="btn w-full"
            onClick={() => confirm(t.admin.drawConfirm) && run(() => runDraw(slug, adminKey))}
          >
            {pending ? t.admin.drawing : t.admin.draw}
          </button>
        )}
        {result?.error && <p className="alert-error">{t.errors[result.error]}</p>}
      </section>
    </>
  );
}

function PersonSelect({ name, participants, placeholder }: { name: string; participants: Participant[]; placeholder: string }) {
  return (
    <select name={name} required defaultValue="" className="input sm:flex-1">
      <option value="" disabled>
        {placeholder}
      </option>
      {participants.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
