import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Skip static assets and Next.js internals — never redirect these
  if (
    path.startsWith("/_next/") ||
    path.startsWith("/api/") ||
    path.includes(".") // files with extensions (favicon.ico, images, etc.)
  ) {
    return supabaseResponse;
  }

  // Public routes — everything else is protected
  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/auth/callback",
    "/portal",
    "/pricing",
    "/help",
    "/terms",
    "/privacy",
  ];
  const isPublic = publicPaths.includes(path);
  // /portal/quotes/* are public (token-gated), no session required
  const isPublicQuote = path.startsWith("/portal/quotes/");
  const isPortalInternal = path.startsWith("/portal/") && !isPublicQuote;

  // Portal internal pages require a session; fall back to /portal sign-in
  if (isPortalInternal && !user) {
    const portalUrl = request.nextUrl.clone();
    portalUrl.pathname = "/portal";
    portalUrl.searchParams.set("next", path);
    return NextResponse.redirect(portalUrl);
  }

  // Dashboard and other protected routes: redirect to login if not authenticated
  if (!isPublic && !isPortalInternal && !isPublicQuote && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  // Auth routes: redirect to dashboard if already authenticated
  if ((path === "/login" || path === "/signup") && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
