import { NextResponse, type NextRequest } from "next/server";

// Fast redirect for visitors without a session cookie. Real checks happen in
// every page and server action (requireRole), not here.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("academy_session")) {
    // the bare address shows the public welcome page; anything deeper asks to sign in
    const to = request.nextUrl.pathname === "/" ? "/welcome" : "/login";
    return NextResponse.redirect(new URL(to, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|welcome|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon|fonts).*)"],
};
