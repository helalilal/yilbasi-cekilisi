import { getLocale } from "@/lib/locale";
import { getMessages } from "@/lib/i18n";
import { findReceiverByIdeaToken } from "@/lib/repo";
import IdeasForm from "@/components/IdeasForm";

export const dynamic = "force-dynamic";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; t?: string }>;
}) {
  const { e, t: token } = await searchParams;
  const t = getMessages(await getLocale());
  const receiver = await findReceiverByIdeaToken(e, token);

  return (
    <div className="space-y-6 pt-4">
      <section>
        <h1 className="text-3xl font-bold leading-tight">{t.ideas.title}</h1>
        <p className="mt-2 text-muted">{t.ideas.intro}</p>
      </section>
      <IdeasForm
        slug={receiver ? e : undefined}
        token={receiver ? token : undefined}
        receiver={receiver}
        t={t}
      />
    </div>
  );
}
