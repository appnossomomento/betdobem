"use client";

import { useRouter } from "next/navigation";
import { votePoll } from "@/lib/engage";

export function PollCard({ poll }: { poll: { id: string; question: string; options: { id: string; label: string }[] } | null }) {
  const router = useRouter();
  if (!poll) return null;
  return (
    <section className="rounded-[18px] border border-line bg-card p-4">
      <h2 className="text-[15px]">{poll.question}</h2>
      <div className="mt-3 grid gap-2">
        {poll.options.map((option) => (
          <button key={option.id} type="button" onClick={async () => { await votePoll(poll.id, option.id); router.refresh(); }} className="h-10 rounded-xl bg-card-2 text-sm font-semibold">{option.label}</button>
        ))}
      </div>
    </section>
  );
}
