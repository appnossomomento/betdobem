import { Suspense } from "react";
import { ClosePoll, PollForm } from "@/components/AdminForms";
import { readBoard } from "@/lib/admin-store";

export default function PollsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando…</p>}>
      <PollsBody />
    </Suspense>
  );
}

async function PollsBody() {
  const board = await readBoard();
  return (
    <div>
      <h1 className="text-xl">Enquetes</h1>
      <PollForm segments={board.segments} />
      <ul className="mt-4">
        {board.polls.map((poll) => {
          const total = poll.votes.length || 1;
          return (
            <li key={poll.id} className="border-t border-line py-3">
              <div className="flex items-center justify-between gap-3">
                <b className="text-sm">{poll.question}</b>
                {poll.closed ? <span className="text-xs text-muted">Encerrada</span> : <ClosePoll id={poll.id} />}
              </div>
              <ul className="mt-2">
                {poll.options.map((option) => {
                  const count = poll.votes.filter((vote) => vote.optionId === option.id).length;
                  return <li key={option.id} className="text-xs text-muted">{option.label} · {count} · {Math.round((count / total) * 100)}%</li>;
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
