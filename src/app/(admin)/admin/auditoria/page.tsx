import { Suspense } from "react";
import { loadDirectory } from "@/lib/admin-data";
import { readBoard, type Audit } from "@/lib/admin-store";
import { ZONE } from "@/lib/economy";

export default function AuditPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando…</p>}>
      <AuditBody />
    </Suspense>
  );
}

async function AuditBody() {
  const [board, people] = await Promise.all([readBoard(), loadDirectory()]);
  const audits = Array.isArray(board.audits) ? board.audits : [];
  const nameOf = (id: string | null) => people.find((person) => person.id === id)?.nick || people.find((person) => person.id === id)?.email || "Sistema";
  return (
    <div>
      <h1 className="text-xl">Auditoria</h1>
      {audits.length === 0 ? <p className="mt-3 text-sm text-muted">Nada registrado ainda.</p> : (
        <ul className="mt-3">
          {audits.slice(0, 100).map((item) => (
            <li key={item.id} className="border-t border-line py-3">
              <p className="text-sm">{summary(item, nameOf)}</p>
              <p className="mt-1 text-xs text-muted tabular-nums">{when(item.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function summary(item: Audit, nameOf: (id: string | null) => string) {
  const who = nameOf(item.adminId);
  const target = item.targetUserId ? nameOf(item.targetUserId) : "";
  const payload = item.payload ?? {};
  if (item.action === "vip_on") return `${who} marcou VIP em ${target}`;
  if (item.action === "vip_off") return `${who} retirou o VIP de ${target}`;
  if (item.action === "ban") return `${who} suspendeu ${target}`;
  if (item.action === "unban") return `${who} reativou ${target}`;
  if (item.action === "ajuste") return `${who} ajustou ${payload.amount ?? ""} moedas de ${target}`;
  if (item.action === "poll") return `${who} criou a enquete “${payload.question ?? ""}”`;
  if (item.action === "notice") return `${who} enviou o aviso “${payload.title ?? ""}” para ${payload.sent ?? 0}`;
  if (item.action === "push") return `${who} disparou o push “${payload.kind === "partidas_iniciando" ? "Partidas iniciando" : "Mercado aberto"}” para ${payload.sent ?? 0} aparelhos`;
  return `${who} · ${item.action}`;
}

function when(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: ZONE }).format(time);
}
