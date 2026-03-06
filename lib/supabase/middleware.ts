import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/shared";

const PROTECTED_ROUTES = ["/files", "/profile"];
const GUEST_ROUTES = ["/login", "/register"];

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!hasSupabaseEnv()) {
    if (matchesRoute(pathname, PROTECTED_ROUTES) || matchesRoute(pathname, GUEST_ROUTES)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next({
      request: {
        headers: request.headers
      }
    });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers
          }
        });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user && matchesRoute(pathname, PROTECTED_ROUTES)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && matchesRoute(pathname, GUEST_ROUTES)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/files";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}