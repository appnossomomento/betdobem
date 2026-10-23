import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { LoginScreen } from "@/components/LoginScreen";
import { getAccount } from "@/lib/account";

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<NeutralShell />}>
      <PlayFrame>{children}</PlayFrame>
    </Suspense>
  );
}

async function PlayFrame({ children }: { children: React.ReactNode }) {
  const account = await getAccount();
  if (account?.banned) return <LoginScreen banned />;
  return <AppShell account={account}>{children}</AppShell>;
}

function NeutralShell() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-20 border-b border-line bg-bg pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center px-4 min-[880px]:px-6">
          <img src="/logo-bet-do-bem/LogoPrincipal-completo.png" alt="BETdoBEM" className="h-12 w-auto max-w-[52vw]" />
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1120px] px-4 pt-[calc(56px+env(safe-area-inset-top)+16px)] min-[880px]:px-6">
        <p className="text-sm text-muted">Carregando…</p>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-nav pb-[env(safe-area-inset-bottom)]" style={{ height: "calc(64px + env(safe-area-inset-bottom))" }} aria-label="Menu principal" />
    </>
  );
}
