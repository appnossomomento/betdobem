"use client";

import { useRouter } from "next/navigation";
import { markNotice } from "@/lib/engage";

export function AvisosScreen({ notices }: { notices: { id: string; title: string; body: string; createdAt: string; read: boolean }[] }) {
  const router = useRouter();
  return (
    <section className="rounded-[18px] border border-line bg-card px-[18px] py-4">
      <h1 className="text-xl">Avisos</h1>
      <ul>
        {notices.length === 0 ? <li className="border-t border-line py-4 text-sm text-muted">Nenhum aviso</li> : notices.map((notice) => (
          <li key={notice.id} className="border-t border-line py-3">
            <button type="button" className="w-full text-left" onClick={async () => { await markNotice(notice.id); router.refresh(); }}>
              <b className="block text-sm font-semibold">{notice.title}</b>
              <span className="mt-1 block text-sm text-muted">{notice.body}</span>
              <span className="mt-1 block text-xs text-muted">{notice.read ? "Lido" : "Novo"} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(notice.createdAt))}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
