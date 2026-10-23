import { NoticeForm } from "@/components/AdminForms";
import { readBoard } from "@/lib/admin-store";

export default async function AdminNoticesPage() {
  const board = await readBoard();
  return (
    <div>
      <h1 className="text-xl">Avisos</h1>
      <NoticeForm segments={board.segments} />
      <ul className="mt-4">
        {board.notices.map((notice) => (
          <li key={notice.id} className="border-t border-line py-3 text-sm">
            <b>{notice.title}</b>
            <span className="mt-1 block text-xs text-muted">{notice.recipients.length} enviados · {notice.reads.length} lidos</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
