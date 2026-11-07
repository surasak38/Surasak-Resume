import { createHash, randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { HANDLE_PATTERN } from "@/lib/profiles";
import { createPublicClient } from "@/lib/supabase/public";
import { currentUser } from "@/lib/supabase/server";

const COOKIE = "rv";
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|curl|wget|python|axios|node-fetch/i;

/**
 * Records one profile view. The database counts each visitor once per profile per day,
 * skips the owner, and caps how many visitors one network can add per day.
 */
export async function POST(request: NextRequest) {
  const key = process.env.VIEW_KEY;
  const body = (await request.json().catch(() => null)) as { handle?: unknown } | null;
  const handle = typeof body?.handle === "string" ? body.handle.toLowerCase() : "";
  if (!key || !HANDLE_PATTERN.test(handle) || BOT.test(request.headers.get("user-agent") ?? "")) {
    return new NextResponse(null, { status: 204 });
  }

  const existing = request.cookies.get(COOKIE)?.value;
  const visitor = existing && /^[0-9a-f-]{36}$/.test(existing) ? existing : randomUUID();
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // Only a keyed hash of the address is stored, never the address itself.
  const ipHash = createHash("sha256").update(`${key}:${ip}`).digest("hex");
  const viewer = await currentUser().catch(() => null);

  await createPublicClient().rpc("record_profile_view", {
    p_key: key,
    p_handle: handle,
    p_visitor: visitor,
    p_ip_hash: ipHash,
    p_viewer: viewer?.id ?? null,
  });

  const res = new NextResponse(null, { status: 204 });
  if (visitor !== existing) {
    res.cookies.set(COOKIE, visitor, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/api/view", maxAge: 60 * 60 * 24 * 365 });
  }
  return res;
}
