import { SegmentForm } from "@/components/AdminForms";
import { readBoard } from "@/lib/admin-store";

export default async function SegmentsPage() {
  const board = await readBoard();
  return (
    <div>
      <h1 className="text-xl">Segmentos</h1>
      <SegmentForm />
      <ul className="mt-4">
        {board.segments.map((segment) => (
          <li key={segment.id} className="border-t border-line py-3 text-sm">
            <b>{segment.name}</b>
            <span className="mt-1 block text-xs text-muted">{JSON.stringify(segment.filter)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
