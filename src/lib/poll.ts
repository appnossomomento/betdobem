import "server-only";
import { loadDirectory, matches } from "@/lib/admin-data";
import { readBoard } from "@/lib/admin-store";

export async function activePoll(userId: string) {
  const board = await readBoard();
  const needsPeople = board.polls.some((item) => item.segmentId && !item.closed && Date.parse(item.endsAt) >= Date.now());
  const person = needsPeople ? (await loadDirectory()).find((item) => item.id === userId) : null;
  const poll = board.polls.find((item) => {
    if (item.closed || Date.parse(item.endsAt) < Date.now() || item.votes.some((vote) => vote.userId === userId)) return false;
    if (!item.segmentId) return true;
    const segment = board.segments.find((entry) => entry.id === item.segmentId);
    return Boolean(person && segment && matches(person, segment.filter));
  });
  if (!poll) return null;
  return { id: poll.id, question: poll.question, options: poll.options };
}
