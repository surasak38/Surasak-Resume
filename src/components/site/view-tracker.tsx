"use client";

import { useEffect } from "react";

/** Reports a profile view once per tab every 30 minutes; the server decides what counts. */
export function ViewTracker({ handle }: { handle: string }) {
  useEffect(() => {
    const mark = `viewed:${handle}`;
    try {
      const last = Number(sessionStorage.getItem(mark));
      if (last && Date.now() - last < 30 * 60 * 1000) return;
      sessionStorage.setItem(mark, String(Date.now()));
    } catch {
      // Storage blocked: still report; the server dedupes.
    }
    fetch("/api/view", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle }), keepalive: true }).catch(() => {});
  }, [handle]);
  return null;
}
