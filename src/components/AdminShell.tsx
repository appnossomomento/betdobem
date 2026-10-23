import Link from "next/link";

const links = [
  ["Visão", "/admin"],
  ["Usuários", "/admin/usuarios"],
  ["Times", "/admin/times"],
  ["Segmentos", "/admin/segmentos"],
  ["Enquetes", "/admin/enquetes"],
  ["Avisos", "/admin/avisos"],
  ["Auditoria", "/admin/auditoria"],
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div className="mx-auto grid max-w-[1120px] gap-4 px-4 py-4 min-[880px]:grid-cols-[180px_1fr]">
        <aside className="flex flex-wrap gap-2 min-[880px]:flex-col">
          <img src="/logo-bet-do-bem/LogoPrincipal-completo.png" alt="BETdoBEM" className="h-10 w-auto" />
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-lg px-2 py-1.5 text-sm font-semibold text-muted hover:text-ink">{label}</Link>
          ))}
          <Link href="/" className="rounded-lg px-2 py-1.5 text-sm font-semibold text-accent">Voltar ao app</Link>
        </aside>
        <main className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
