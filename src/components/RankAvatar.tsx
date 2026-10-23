import type { RankRow } from "@/data/home";

export function RankAvatar({ row }: { row: RankRow }) {
  if (row.avatarUrl) {
    return <img src={row.avatarUrl} alt="" className="size-[26px] shrink-0 rounded-full object-cover" />;
  }
  return (
    <svg viewBox="0 0 32 32" className="size-[26px] shrink-0" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill={row.color} />
      <text x="16" y="21" textAnchor="middle" fontSize="12" fontWeight="700" fill={row.ink} fontFamily="Outfit, sans-serif">{row.initials}</text>
    </svg>
  );
}
