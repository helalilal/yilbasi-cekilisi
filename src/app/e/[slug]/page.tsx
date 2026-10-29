import { notFound } from "next/navigation";
import { getLocale } from "@/lib/locale";
import { getMessages } from "@/lib/i18n";
import { findEvent, listParticipants } from "@/lib/repo";
import JoinForm from "@/components/JoinForm";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await findEvent(slug);
  if (!event) notFound();
  const t = getMessages(await getLocale());
  const participants = await listParticipants(event.id);

  return (
    <div className="space-y-6">
      <section className="pt-4">
        <h1 className="text-3xl font-bold leading-tight">
          🎁 {event.name} <span className="block text-lg font-medium text-muted">{t.join.invited}</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          {t.join.organizer}: <b className="text-ink">{event.owner_name}</b>
        </p>
      </section>

      {event.status === "drawn" ? (
        <section className="card">
          <h2 className="text-xl font-bold">{t.join.drawnTitle}</h2>
          <p className="mt-2 text-muted">{t.join.drawnText}</p>
        </section>
      ) : (
        <JoinForm slug={slug} t={t} />
      )}

      <section className="card">
        <h2 className="mb-3 font-bold">
          {t.join.participants} <span className="text-muted">({participants.length})</span>
        </h2>
        {participants.length === 0 ? (
          <p className="text-sm text-muted">{t.join.nobody}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <li key={p.id} className="rounded-full bg-green-soft px-3 py-1 text-sm text-green">
                {p.name}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
