import type { Metadata } from "next";
import { RankingScreen } from "@/components/RankingScreen";

export const metadata: Metadata = {
  title: "BETdoBEM — Ranking",
  description: "Ranking geral e ligas do BETdoBEM",
};

export default function RankingPage() {
  return <RankingScreen />;
}
