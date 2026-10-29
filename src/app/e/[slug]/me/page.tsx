import { notFound } from "next/navigation";
import { getLocale } from "@/lib/locale";
import { getMessages } from "@/lib/i18n";
import { findEvent, findParticipantByToken } from "@/lib/repo";
import MeForm from "@/components/MeForm";

export const dynamic = "force-dynamic";

export default async function MePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;
  const event = await findEvent(slug);
  if (!event) notFound();
  const t = getMessages(await getLocale());
  const me = await findParticipantByToken(event.id, token);

  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-3xl font-bold">🎁 {event.name}</h1>
      {!me ? (
        <p className="alert-error">{t.errors.badLink}</p>
      ) : (
        <MeForm
          slug={slug}
          token={token!}
          name={me.name}
          email={me.email}
          wishlist={me.wishlist}
          locked={event.status !== "open"}
          t={t}
        />
      )}
    </div>
  );
}
