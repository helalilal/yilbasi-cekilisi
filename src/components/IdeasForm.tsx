"use client";

import { useActionState, useRef, useState } from "react";
import { getGiftIdeas, type IdeasState } from "@/app/actions/ideas";
import type { Messages } from "@/lib/i18n";
import Honeypot from "./Honeypot";

type Props = {
  slug?: string;
  token?: string;
  receiver: { name: string; wishlist: string } | null;
  t: Messages;
};

export default function IdeasForm({ slug, token, receiver, t }: Props) {
  const [state, action, pending] = useActionState<IdeasState, FormData>(
    getGiftIdeas.bind(null, slug, token),
    { ok: false },
  );
  const [editing, setEditing] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const showResults = state.ok && !editing && !pending;

  return (
    <>
      <form
        ref={formRef}
        action={(fd) => {
          setEditing(false);
          action(fd);
        }}
        className={`card relative space-y-5 ${showResults || pending ? "hidden" : ""}`}
      >
        <Honeypot />
        {receiver && (
          <p className="rounded-xl bg-green-soft px-3 py-2 text-green">
            {t.ideas.forPerson}: <b>{receiver.name}</b>
          </p>
        )}

        <Choice name="gender" label={t.ideas.gender} options={t.ideas.genderOptions} defaultValue="unspecified" />
        <Choice name="style" label={t.ideas.style} options={t.ideas.styleOptions} defaultValue="interesting" />
        <Choice name="closeness" label={t.ideas.closeness} options={t.ideas.closenessOptions} defaultValue="friend" />

        <div>
          <label className="label" htmlFor="interests">{t.ideas.interests}</label>
          <textarea id="interests" name="interests" rows={2} maxLength={500} placeholder={t.ideas.interestsPh} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="description">{t.ideas.description}</label>
          <input id="description" name="description" maxLength={300} placeholder={t.ideas.descriptionPh} className="input" />
        </div>
        {receiver ? (
          receiver.wishlist && (
            <div>
              <p className="label">{t.ideas.wishlistFromDraw}</p>
              <p className="whitespace-pre-wrap rounded-xl bg-bg px-3 py-2 text-sm">{receiver.wishlist}</p>
            </div>
          )
        ) : (
          <div>
            <label className="label" htmlFor="wishlist">{t.ideas.wishlist}</label>
            <textarea id="wishlist" name="wishlist" rows={2} maxLength={2000} className="input" />
          </div>
        )}

        {!state.ok && state.error && <p className="alert-error">{t.errors[state.error]}</p>}
        <button type="submit" disabled={pending} className="btn w-full">
          {t.ideas.submit}
        </button>
      </form>

      {pending && (
        <section className="card flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-red" />
          <p className="text-muted">{t.ideas.thinking}</p>
        </section>
      )}

      {showResults && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">{t.ideas.resultsTitle}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {state.ideas.map((idea, i) => (
              <li key={i} className="card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold">{idea.title}</h3>
                  <span className="shrink-0 rounded-full bg-green-soft px-2 py-0.5 text-xs text-green">{idea.price}</span>
                </div>
                <p className="text-sm text-muted">{idea.why}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">{t.ideas.disclaimer}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn" onClick={() => formRef.current?.requestSubmit()}>
              {t.ideas.again}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>
              {t.ideas.edit}
            </button>
          </div>
        </section>
      )}
    </>
  );
}

function Choice({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: Record<string, string>;
  defaultValue: string;
}) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {Object.entries(options).map(([value, text]) => (
          <label key={value} className="cursor-pointer">
            <input type="radio" name={name} value={value} defaultChecked={value === defaultValue} className="peer sr-only" />
            <span className="inline-block rounded-full border border-line px-3 py-1.5 text-sm peer-checked:border-green peer-checked:bg-green-soft peer-checked:text-green peer-focus-visible:ring-2 peer-focus-visible:ring-green/40">
              {text}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
