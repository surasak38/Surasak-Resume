/** Product name shown on the landing page and auth screens. */
export const SITE_NAME = "Folio";

/** Only allow same-site relative redirects (blocks //evil.com and absolute URLs). */
export function safeNext(next: unknown, fallback = "/"): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
