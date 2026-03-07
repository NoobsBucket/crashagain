export const runtime = 'experimental-edge';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ADMIN_EMAILS = ["nbdotwork@gmail.com", "msdotxd1@gmail.com", "halayjan18@gmail.com"];

const PUBLIC_ROUTES = [
  /^\/$/, 
  /^\/products/,
  /^\/api\/products/,
  /^\/api\/categories/,
  /^\/api\/banners/,
  /^\/api\/reviews/,
  /^\/login/,
  /^\/checkout/,
  /^\/orders/,
  /^\/register/,
  /^\/search/,
  /^\/api\/search/,
  /^\/auth/,
  /^\/api\/auth/,
];

const ADMIN_ROUTES = [
  /^\/admin/,
  /^\/api\/admin/,
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(r => r.test(pathname));
}
function isAdminRoute(pathname: string) {
  return ADMIN_ROUTES.some(r => r.test(pathname));
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Key fix: response must be mutable so setAll can write cookies onto it ──
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write onto request first (so server components see it)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Re-create response with updated request, then write cookies onto it
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This both validates AND refreshes the session cookie automatically
  const { data: { user } } = await supabase.auth.getUser();

  if (isAdminRoute(pathname)) {
    if (!user) return NextResponse.redirect(new URL('/', request.url));
    if (!ADMIN_EMAILS.includes(user.email ?? '')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  if (!isPublicRoute(pathname) && !user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};