"use client";

import { useEffect, useState } from "react";
import { votePoll } from "@/lib/engage";

const flag = "betdobem.enquete";

type Poll = { id: string; question: string; options: { id: string; label: string }[] };

export function PollPopup({ signedIn }: { signedIn: boolean }) {
  const [poll, setPoll] = useState<Poll | null>(null);

  useEffect(() => {
    if (!signedIn || sessionStorage.getItem(flag) !== "1") return;
    let cancel = false;
    fetch("/api/poll")
      .then((response) => response.json())
      .then((data: { poll: Poll | null }) => {
        sessionStorage.removeItem(flag);
        if (!cancel && data.poll) setPoll(data.poll);
      })
      .catch(() => sessionStorage.removeItem(flag));
    return () => {
      cancel = true;
    };
  }, [signedIn]);

  if (!poll) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 px-4">
      <section className="w-full max-w-md rounded-[18px] border border-line bg-card p-5 shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg tracking-tight">{poll.question}</h2>
          <button type="button" aria-label="Fechar" onClick={() => setPoll(null)} className="grid size-8 shrink-0 place-items-center rounded-lg bg-card-2 text-muted">×</button>
        </div>
        <div className="mt-4 grid gap-2">
          {poll.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={async () => {
                const result = await votePoll(poll.id, option.id);
                if (result.ok) setPoll(null);
              }}
              className="h-11 rounded-xl bg-card-2 text-sm font-semibold"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
