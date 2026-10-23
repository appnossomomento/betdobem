import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getAccount } from "@/lib/account";

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <PrivateFrame>{children}</PrivateFrame>
    </Suspense>
  );
}

async function PrivateFrame({ children }: { children: React.ReactNode }) {
  const account = await getAccount();
  if (!account || account.banned) redirect("/");
  return <AppShell account={account}>{children}</AppShell>;
}
