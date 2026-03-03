export const runtime = 'experimental-edge';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim());

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
  const response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

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