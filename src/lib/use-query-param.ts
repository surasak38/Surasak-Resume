"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Reads and writes one ?key=value in the address bar without a navigation, so UI state
 * (open modal, selected tab, photo index…) can be shared as a link and restored on load.
 * `push: true` adds a history entry, letting the Back button undo it (e.g. close a modal).
 */
const EVENT = "query-param-change";

function subscribe(onChange: () => void) {
  addEventListener("popstate", onChange);
  addEventListener(EVENT, onChange);
  return () => {
    removeEventListener("popstate", onChange);
    removeEventListener(EVENT, onChange);
  };
}

export function setQueryParams(patch: Record<string, string | null>, { push = false } = {}) {
  const url = new URL(location.href);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  if (url.href === location.href) return;
  history[push ? "pushState" : "replaceState"](history.state, "", url);
  dispatchEvent(new Event(EVENT));
}

export function useQueryParam(key: string): [string | null, (value: string | null, opts?: { push?: boolean }) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(location.search).get(key),
    () => null,
  );
  const set = useCallback((next: string | null, opts?: { push?: boolean }) => setQueryParams({ [key]: next }, opts), [key]);
  return [value, set];
}
