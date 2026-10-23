import { loadDirectory } from "@/lib/admin-data";
import { readBoard } from "@/lib/admin-store";

export default async function AuditPage() {
  const [board, people] = await Promise.all([readBoard(), loadDirectory()]);
  const nameOf = (id: string | null) => people.find((person) => person.id === id)?.email ?? id ?? "—";
  return (
    <div>
      <h1 className="text-xl">Auditoria</h1>
      <ul className="mt-3">
        {board.audits.slice(0, 100).map((item) => (
          <li key={item.id} className="border-t border-line py-3 text-sm">
            <b>{item.action}</b>
            <span className="mt-1 block text-xs text-muted">{nameOf(item.adminId)} · {item.createdAt} · {nameOf(item.targetUserId)} · {JSON.stringify(item.payload)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
