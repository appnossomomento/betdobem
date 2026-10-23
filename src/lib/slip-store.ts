export const SLIP_KEY = "betdobem.slip";

export type StoredSlip = {
  picks: Record<string, { key: string; odd: number; phrase: string; competition?: string; when?: string }>;
  order: string[];
};

export function saveSlip(value: StoredSlip) {
  sessionStorage.setItem(SLIP_KEY, JSON.stringify(value));
}

export function readSlip(): StoredSlip | null {
  try {
    const raw = sessionStorage.getItem(SLIP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSlip;
    if (!parsed || !Array.isArray(parsed.order) || typeof parsed.picks !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSlip() {
  sessionStorage.removeItem(SLIP_KEY);
}
