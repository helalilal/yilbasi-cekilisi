import { notFound } from "next/navigation";
import { getBaseUrl, getLocale } from "@/lib/locale";
import { getMessages } from "@/lib/i18n";
import { findEvent, listAssignments, listExclusions, listParticipants } from "@/lib/repo";
import { tokenMatches } from "@/lib/tokens";
import AdminPanel from "@/components/AdminPanel";
import CopyField from "@/components/CopyField";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { slug } = await params;
  const { key } = await searchParams;
  const event = await findEvent(slug);
  if (!event) notFound();
  const t = getMessages(await getLocale());

  if (!tokenMatches(key, event.admin_token_hash)) {
    return <p className="alert-error mt-6">{t.errors.badLink}</p>;
  }

  const [participants, exclusions, assignments] = await Promise.all([
    listParticipants(event.id),
    listExclusions(event.id),
    listAssignments(event.id),
  ]);
  const status = Object.fromEntries(assignments.map((a) => [a.giver_id, a.email_status]));

  return (
    <div className="space-y-6 pt-4">
      <div>
        <p className="text-sm font-medium text-muted">{t.admin.title}</p>
        <h1 className="text-3xl font-bold">🎁 {event.name}</h1>
      </div>
      <section className="card">
        <p className="label">{t.admin.shareTitle}</p>
        <CopyField value={`${await getBaseUrl()}/e/${slug}`} copy={t.created.copy} copied={t.created.copied} />
      </section>
      <AdminPanel
        slug={slug}
        adminKey={key!}
        drawn={event.status === "drawn"}
        participants={participants.map((p) => ({ id: p.id, name: p.name, email: p.email, status: status[p.id] }))}
        exclusions={exclusions.map((e) => ({ id: e.id, a: e.participant_a_id, b: e.participant_b_id }))}
        t={t}
      />
    </div>
  );
}
