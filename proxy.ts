import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

// A fast first check on every request: is there a validly signed session
// cookie? Pages and API routes still verify the session against the database.

const PUBLIC_API_ROUTES = ["/api/auth/login", "/api/auth/logout"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/")) {
    if (session || PUBLIC_API_ROUTES.includes(pathname)) return NextResponse.next();
    return NextResponse.json({ error: { message: "Please log in to continue." } }, { status: 401 });
  }

  // The login page decides for itself whether to send a logged-in admin onwards.
  if (pathname === "/login") return NextResponse.next();

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next.js internals and static files.
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
