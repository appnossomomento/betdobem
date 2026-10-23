export function Chevron({ dir }: { dir: "left" | "right" | "down" }) {
  const d = dir === "left" ? "M14 6 L8 12 L14 18" : dir === "down" ? "M6 10 L12 16 L18 10" : "M10 6 L16 12 L10 18";
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Bell() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" aria-hidden="true">
      <path d="M6 16 V10.5 A6 6 0 0 1 18 10.5 V16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 16.5 H19.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 16.5 A2 2 0 0 0 14 16.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Coin() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="shrink-0">
      <circle cx="8" cy="8" r="6.2" fill="#d6f25c" />
      <circle cx="8" cy="8" r="4.1" fill="none" stroke="#1a2208" strokeWidth="1" />
    </svg>
  );
}
