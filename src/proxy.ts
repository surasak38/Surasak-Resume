import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Owner of the original single-person site; its old links keep working.
const LEGACY_HANDLE = process.env.LEGACY_HANDLE || "surasak.jrs";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Old URLs from before accounts existed.
  if (pathname === "/en" || pathname === "/th") {
    const url = new URL(`/${LEGACY_HANDLE}/profile`, request.url);
    url.search = search;
    url.searchParams.set("lang", pathname.slice(1));
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL(`/${LEGACY_HANDLE}/admin`, request.url), 308);
  }

  // /<handle> on its own goes to the profile.
  const bare = pathname.match(/^\/([a-z0-9._-]+)\/?$/);
  if (bare && !["login", "signup", "auth"].includes(bare[1])) {
    const url = new URL(`/${bare[1]}/profile`, request.url);
    url.search = search;
    return NextResponse.redirect(url);
  }

  const { response, userId } = await updateSession(request);

  // Optimistic gate for editors; the page itself checks ownership.
  if (!userId && /^\/[^/]+\/admin\/?$/.test(pathname)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
