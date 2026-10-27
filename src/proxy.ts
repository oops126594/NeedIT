import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0] === "en" ? "en" : "ar";
  const routeSegments = segments[0] === "en" || segments[0] === "ar" ? segments.slice(1) : segments;
  const route = `/${routeSegments.join("/")}`;
  const isPublic = route === "/account" || route === "/reset-password";
  if (!isPublic && !request.cookies.has("needit_session")) {
    const login = request.nextUrl.clone();
    login.pathname = `/${locale}/account`;
    login.search = "";
    login.searchParams.set("next", route || "/");
    return NextResponse.redirect(login);
  }
  return handleI18nRouting(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
