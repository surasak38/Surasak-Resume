import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { DIRECTORY_TAG, HANDLE_PATTERN, profileTag } from "@/lib/profiles";
import { safeNext } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const GMAIL_ONLY = "Only Gmail accounts can sign up. Choose a @gmail.com account.";

/** The handle the database gives a new account before its owner picks one. */
const placeholderHandle = (userId: string) => `user-${userId.replace(/-/g, "").slice(0, 10)}`;

function toLogin(request: NextRequest, message: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

/** Where Google sign-in lands: swaps the code for a session, then claims the chosen link for new accounts. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Supabase reports refused sign-ups (non-Gmail, see handle_new_user) back here as ?error=.
  const failure = searchParams.get("error_description") ?? searchParams.get("error");
  if (failure) return toLogin(request, /gmail|database error/i.test(failure) ? GMAIL_ONLY : "Google sign-in was cancelled or failed. Try again.");

  const code = searchParams.get("code");
  if (!code) return toLogin(request, "That sign-in link is incomplete. Try again.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return toLogin(request, "That sign-in has expired. Try again.");

  const { data: row } = await supabase.from("profiles").select("handle").eq("id", data.user.id).maybeSingle();
  let handle = row?.handle ?? "";
  const isNew = handle === placeholderHandle(data.user.id);

  // Only a brand-new account's placeholder link is ever replaced; existing links are left alone.
  const wanted = (searchParams.get("handle") ?? "").toLowerCase();
  if (isNew && HANDLE_PATTERN.test(wanted)) {
    const { error: renameError } = await supabase.from("profiles").update({ handle: wanted }).eq("id", data.user.id);
    if (!renameError) {
      handle = wanted;
      revalidateTag(profileTag(wanted), { expire: 0 });
      revalidateTag(DIRECTORY_TAG, { expire: 0 });
    }
  }

  const next = safeNext(searchParams.get("next"), "");
  if (next && !isNew) return NextResponse.redirect(new URL(next, request.url));
  if (!handle) return NextResponse.redirect(new URL("/", request.url));
  // A new account still on its placeholder goes straight to choosing a link.
  const dest = handle === placeholderHandle(data.user.id) ? `/${handle}/admin?tab=settings` : `/${handle}/admin`;
  return NextResponse.redirect(new URL(dest, request.url));
}
