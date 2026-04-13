import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const i18nMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const isAuthPage = req.nextUrl.pathname.includes("/login");

  const session =
    req.cookies.get("next-auth.session-token") ||
    req.cookies.get("__Secure-next-auth.session-token");

  const isLoggedIn = !!session;

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(
      new URL(`/${req.nextUrl.locale || "fr"}/dashboard`, req.url)
    );
  }

  if (!isLoggedIn && req.nextUrl.pathname.includes("/dashboard")) {
    return NextResponse.redirect(
      new URL(`/${req.nextUrl.locale || "fr"}/login`, req.url)
    );
  }

  return i18nMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|static|_vercel|.*\\..*).*)"],
};