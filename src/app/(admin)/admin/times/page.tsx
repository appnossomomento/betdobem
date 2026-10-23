import { Suspense } from "react";
import { TeamsBoard } from "@/components/TeamsBoard";
import { loadDirectory } from "@/lib/admin-data";
import { TEAMS } from "@/lib/profile-fields";
import { teamColor } from "@/lib/team-colors";

export default function TeamsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando…</p>}>
      <TeamsBody />
    </Suspense>
  );
}

async function TeamsBody() {
  const people = await loadDirectory();
  const counts = new Map<string, number>();
  for (const person of people) counts.set(person.team || "Sem time", (counts.get(person.team || "Sem time") ?? 0) + 1);
  const names = new Set<string>([...TEAMS, ...counts.keys()]);
  const rows = [...names].map((team) => ({ team, fans: counts.get(team) ?? 0, color: teamColor(team) }));
  rows.sort((a, b) => b.fans - a.fans || a.team.localeCompare(b.team, "pt-BR"));
  return <TeamsBoard rows={rows} />;
}
