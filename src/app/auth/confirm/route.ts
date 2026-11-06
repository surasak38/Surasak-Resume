import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/** Landing point for email links: supports both the token_hash template and the PKCE ?code flow. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNext(searchParams.get("next"), "/");
  const supabase = await createClient();

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const { error } = tokenHash && type
    ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("Missing token") };

  if (error) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "That link has expired or was already used. Sign in, or sign up again.");
    return NextResponse.redirect(url);
  }
  return NextResponse.redirect(new URL(next, request.url));
}
