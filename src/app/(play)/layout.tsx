import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getAccount } from "@/lib/account";

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppShell account={null}>{null}</AppShell>}>
      <PlayFrame>{children}</PlayFrame>
    </Suspense>
  );
}

async function PlayFrame({ children }: { children: React.ReactNode }) {
  const account = await getAccount();
  if (account?.banned) redirect("/");
  return <AppShell account={account}>{children}</AppShell>;
}
