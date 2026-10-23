"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { placeBet, type PlaceResult } from "@/lib/place";
import { clearSlip, readSlip, saveSlip } from "@/lib/slip-store";

export type Selection = { key: string; odd: number; phrase: string; competition?: string; when?: string };

type State = { picks: Record<string, Selection>; order: string[] };

type BetContextValue = State & {
  balance: number;
  signedIn: boolean;
  choose: (gameId: string, selection: Selection) => void;
  remove: (gameId: string) => void;
  place: (stake: number) => Promise<PlaceResult | null>;
  slip: { text: string; odd: string; multi: boolean; idle: boolean };
};

const BetContext = createContext<BetContextValue | null>(null);

function reducer(state: State, action: { type: "choose"; gameId: string; selection: Selection } | { type: "clear" } | { type: "remove"; gameId: string } | { type: "hydrate"; picks: State["picks"]; order: string[] }): State {
  if (action.type === "hydrate") return { picks: action.picks, order: action.order };
  if (action.type === "clear") return { picks: {}, order: [] };
  if (action.type === "remove") {
    const picks = { ...state.picks };
    delete picks[action.gameId];
    return { picks, order: state.order.filter((id) => id !== action.gameId) };
  }
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

export function BetProvider({ children, initialBalance }: { children: React.ReactNode; initialBalance: number | null }) {
  const [state, dispatch] = useReducer(reducer, { picks: {}, order: [] });
  const [balance, setBalance] = useState(initialBalance ?? 0);
  const signedIn = initialBalance != null;
  const skipSave = useRef(true);

  useEffect(() => {
    const saved = readSlip();
    if (saved?.order.length) dispatch({ type: "hydrate", picks: saved.picks, order: saved.order });
  }, []);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (state.order.length === 0) clearSlip();
    else saveSlip({ picks: state.picks, order: state.order });
  }, [state]);

  async function place(stake: number) {
    if (!signedIn || state.order.length === 0) return null;
    const legs = state.order.map((id) => ({ fixtureId: id, key: state.picks[id].key, odd: state.picks[id].odd }));
    const result = await placeBet(stake, legs);
    if (result.ok) {
      setBalance(result.balance);
      dispatch({ type: "clear" });
      clearSlip();
    }
    return result;
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
      signedIn,
      slip,
      choose: (gameId, selection) => dispatch({ type: "choose", gameId, selection }),
      remove: (gameId) => dispatch({ type: "remove", gameId }),
      place,
    }),
    [state, slip, balance, signedIn],
  );

  return <BetContext.Provider value={value}>{children}</BetContext.Provider>;
}

export function useBet() {
  const value = useContext(BetContext);
  if (!value) throw new Error("useBet precisa do BetProvider");
  return value;
}
