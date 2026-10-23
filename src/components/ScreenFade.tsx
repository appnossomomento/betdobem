"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export function ScreenFade({ children }: { children: ReactNode }) {
  const [cycle, setCycle] = useState(0);
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setCycle((current) => current + 1);
  }, [children]);
  return (
    <div key={cycle} className="soft-in">
      {children}
    </div>
  );
}
