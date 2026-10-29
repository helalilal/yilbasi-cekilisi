import { getLocale } from "@/lib/locale";
import { getMessages } from "@/lib/i18n";
import CreateForm from "@/components/CreateForm";

export default async function Home() {
  const t = getMessages(await getLocale());
  const steps = [t.home.step1, t.home.step2, t.home.step3];
  return (
    <div className="space-y-6">
      <section className="pt-4">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{t.home.heroTitle}</h1>
        <p className="mt-3 text-muted">{t.home.heroText}</p>
        <ol className="mt-5 grid gap-2 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5 text-sm">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green text-sm font-bold text-bg">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </section>
      <CreateForm t={t} />
    </div>
  );
}
