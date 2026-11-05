import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // "/" → the visitor's language. Thai if their browser prefers it, otherwise English.
  if (pathname === "/") {
    const accept = request.headers.get("accept-language") ?? "";
    const lang = /^\s*th\b/i.test(accept) ? "th" : "en";
    return NextResponse.redirect(new URL(`/${lang}`, request.url));
  }

  // Admin: optimistic check only. The page and every action verify the session properly.
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !request.cookies.has("resume_admin")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/admin/:path*"] };
