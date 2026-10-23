import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { getAccount } from "@/lib/account";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminFrame>{children}</AdminFrame>
    </Suspense>
  );
}

async function AdminFrame({ children }: { children: React.ReactNode }) {
  const account = await getAccount();
  if (!account?.admin || account.banned) redirect("/");
  return <AdminShell>{children}</AdminShell>;
}
