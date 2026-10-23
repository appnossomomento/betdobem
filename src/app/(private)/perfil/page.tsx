import type { Metadata } from "next";
import { Suspense } from "react";
import { PerfilScreen } from "@/components/PerfilScreen";
import { getAccount } from "@/lib/account";

export const metadata: Metadata = { title: "BETdoBEM — Perfil", description: "Perfil do BETdoBEM" };

export default function PerfilPage() {
  return (
    <Suspense fallback={null}>
      <PerfilRoute />
    </Suspense>
  );
}

async function PerfilRoute() {
  const account = await getAccount();
  if (!account) return null;
  return <PerfilScreen account={account} />;
}
