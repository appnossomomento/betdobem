import { Suspense } from "react";
import { HomeScreen } from "@/components/HomeScreen";
import { LoginScreen } from "@/components/LoginScreen";
import { PollCard } from "@/components/PollCard";
import { AppShell } from "@/components/AppShell";
import { readBoard } from "@/lib/admin-store";
import { loadDirectory, matches } from "@/lib/admin-data";
import { getAccount } from "@/lib/account";
import { getRound } from "@/lib/round";
import { loadSocial } from "@/lib/social";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeGate />
    </Suspense>
  );
}

async function HomeGate() {
  const account = await getAccount();
  if (!account || account.banned) return <LoginScreen banned={Boolean(account?.banned)} />;
  const [round, social, board] = await Promise.all([getRound(), loadSocial(account.id), readBoard()]);
  const needsPeople = board.polls.some((item) => item.segmentId && !item.closed);
  const person = needsPeople ? (await loadDirectory()).find((item) => item.id === account.id) : null;
  const poll = board.polls.find((item) => {
    if (item.closed || Date.parse(item.endsAt) < Date.now() || item.votes.some((vote) => vote.userId === account.id)) return false;
    if (!item.segmentId) return true;
    const segment = board.segments.find((entry) => entry.id === item.segmentId);
    return Boolean(person && segment && matches(person, segment.filter));
  });
  return (
    <AppShell account={account}>
      <HomeScreen games={round.games} cards={round.cards} weeklyRows={social.weekly} monthlyRows={social.monthly} leagueRows={social.mine} poll={<PollCard poll={poll ? { id: poll.id, question: poll.question, options: poll.options } : null} />} />
    </AppShell>
  );
}
