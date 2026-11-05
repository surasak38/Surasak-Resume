import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: bounce visitors without a session cookie to the login page.
// The real verification happens in the admin page and in every server action.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin/login")) return NextResponse.next();
  if (!request.cookies.has("resume_admin")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
