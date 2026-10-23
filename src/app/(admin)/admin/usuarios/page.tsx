import Link from "next/link";
import { loadDirectory } from "@/lib/admin-data";
import { TEAMS } from "@/lib/profile-fields";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; vip?: string; banned?: string; team?: string; city?: string }> }) {
  const query = await searchParams;
  const people = await loadDirectory();
  const q = (query.q ?? "").toLowerCase();
  const rows = people.filter((person) => {
    if (q && !`${person.nick} ${person.email}`.toLowerCase().includes(q)) return false;
    if (query.vip === "1" && !person.vip) return false;
    if (query.vip === "0" && person.vip) return false;
    if (query.banned === "1" && !person.banned) return false;
    if (query.banned === "0" && person.banned) return false;
    if (query.team && person.team !== query.team) return false;
    if (query.city && !person.city.toLowerCase().includes(query.city.toLowerCase())) return false;
    return true;
  });
  const field = "h-10 rounded-lg bg-card px-3 text-sm outline-none";
  return (
    <div>
      <h1 className="text-xl">Usuários</h1>
      <form className="mt-3 grid grid-cols-2 gap-2 min-[880px]:grid-cols-3">
        <input name="q" defaultValue={query.q ?? ""} aria-label="Busca" placeholder="Apelido ou e-mail" className={field} />
        <input name="city" defaultValue={query.city ?? ""} aria-label="Cidade" placeholder="Cidade" className={field} />
        <select name="team" defaultValue={query.team ?? ""} aria-label="Time" className={field}><option value="">Time</option>{TEAMS.map((team) => <option key={team}>{team}</option>)}</select>
        <select name="vip" defaultValue={query.vip ?? ""} aria-label="VIP" className={field}><option value="">VIP</option><option value="1">VIP</option><option value="0">Sem VIP</option></select>
        <select name="banned" defaultValue={query.banned ?? ""} aria-label="Banido" className={field}><option value="">Banido</option><option value="1">Banido</option><option value="0">Ativo</option></select>
        <button className="rounded-lg bg-accent px-3 text-sm font-bold text-accent-ink">Buscar</button>
      </form>
      <ul className="mt-3">
        {rows.map((person) => (
          <li key={person.id} className="grid grid-cols-[1fr_auto] gap-2 border-t border-line py-3">
            <Link href={`/admin/usuarios/${person.id}`}>
              <b className="text-sm font-semibold">{person.nick}</b>
              <span className="mt-0.5 block text-xs text-muted">{person.email} · {person.age ?? "—"} · {person.team || "sem time"} · {person.city || "sem cidade"} · desde {person.createdAt.slice(0, 10)}</span>
            </Link>
            <span className="text-right text-sm tabular-nums">{person.balance}{person.vip ? " · VIP" : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
