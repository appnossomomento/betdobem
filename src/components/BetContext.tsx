"use client";

import { createContext, useContext, useMemo, useReducer, useState } from "react";

export type Selection = { key: string; odd: number; phrase: string };

type State = { picks: Record<string, Selection>; order: string[] };

type BetContextValue = State & {
  balance: number;
  choose: (gameId: string, selection: Selection) => void;
  place: (stake: number) => number | null;
  slip: { text: string; odd: string; multi: boolean; idle: boolean };
};

const BetContext = createContext<BetContextValue | null>(null);

function reducer(state: State, action: { type: "choose"; gameId: string; selection: Selection } | { type: "clear" }): State {
  if (action.type === "clear") return { picks: {}, order: [] };
  const current = state.picks[action.gameId];
  if (current?.key === action.selection.key) {
    const picks = { ...state.picks };
    delete picks[action.gameId];
    return { picks, order: state.order.filter((id) => id !== action.gameId) };
  }
  return {
    picks: { ...state.picks, [action.gameId]: action.selection },
    order: [...state.order.filter((id) => id !== action.gameId), action.gameId],
  };
}

export function BetProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { picks: {}, order: [] });
  const [balance, setBalance] = useState(186);

  function place(stake: number) {
    const cents = Math.round(stake * 100);
    if (cents < 100 || state.order.length === 0) return null;
    let left: number | null = null;
    setBalance((current) => {
      const have = Math.round(current * 100);
      if (cents > have) return current;
      left = (have - cents) / 100;
      return left;
    });
    if (left == null) return null;
    dispatch({ type: "clear" });
    return left;
  }

  const slip = useMemo(() => {
    const last = state.order.length ? state.picks[state.order[state.order.length - 1]] : undefined;
    if (!last) return { text: "Nenhuma aposta selecionada", odd: "–", multi: false, idle: true };
    const combined = state.order.reduce((total, id) => total * state.picks[id].odd, 1);
    const multi = state.order.length > 1;
    const text = multi ? `Múltipla de ${state.order.length}` : last.phrase;
    return { text, odd: combined.toFixed(2), multi, idle: false };
  }, [state]);

  const value = useMemo<BetContextValue>(
    () => ({
      ...state,
      balance,
      slip,
      choose: (gameId, selection) => dispatch({ type: "choose", gameId, selection }),
      place,
    }),
    [state, slip, balance],
  );

  return <BetContext.Provider value={value}>{children}</BetContext.Provider>;
}

export function useBet() {
  const value = useContext(BetContext);
  if (!value) throw new Error("useBet precisa do BetProvider");
  return value;
}
