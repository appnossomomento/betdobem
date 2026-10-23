import type { Metadata } from "next";
import { Suspense } from "react";
import { AvisosScreen } from "@/components/AvisosScreen";
import { readBoard } from "@/lib/admin-store";
import { getAccount } from "@/lib/account";

export const metadata: Metadata = { title: "BETdoBEM — Avisos", description: "Avisos do BETdoBEM" };

export default function AvisosPage() {
  return (
    <Suspense fallback={null}>
      <AvisosRoute />
    </Suspense>
  );
}

async function AvisosRoute() {
  const account = await getAccount();
  const board = await readBoard();
  const notices = board.notices.filter((notice) => account && notice.recipients.includes(account.id));
  return <AvisosScreen notices={notices.map((notice) => ({ id: notice.id, title: notice.title, body: notice.body, createdAt: notice.createdAt, read: notice.reads.some((item) => item.userId === account?.id) }))} />;
}
