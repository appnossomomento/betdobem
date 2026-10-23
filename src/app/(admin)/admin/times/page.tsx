import Link from "next/link";
import { loadDirectory, loadTeams } from "@/lib/admin-data";

export default async function TeamsPage() {
  const people = await loadDirectory();
  const teams = await loadTeams(people);
  return (
    <div>
      <h1 className="text-xl">Times</h1>
      <ul className="mt-3">
        {teams.map((team) => (
          <li key={team.team} className="border-t border-line py-3">
            <Link href={`/admin/usuarios?team=${encodeURIComponent(team.team)}`} className="flex items-center justify-between gap-3">
              <b className="text-sm font-semibold">{team.team}</b>
              <span className="text-xs text-muted tabular-nums">{team.fans} torcedores · {team.bets} apostas · média {team.average} · acerto {team.hit}%</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
