"use client";

import { useEffect } from "react";
import { listenForInstall } from "@/lib/pwa-install";

export function PwaRegister() {
  useEffect(() => {
    listenForInstall();
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);
  return null;
}
