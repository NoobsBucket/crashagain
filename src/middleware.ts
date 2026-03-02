import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const ADMIN_EMAILS = ["nbdotwork@gmail.com", "msdotxd1@gmail.com" ,"halayjan18@gmail.com"];

const isPublicRoute = createRouteMatcher([
  "/",
  "/products(.*)",
  "/api/products(.*)",
  "/api/categories(.*)",
  "/api/banners(.*)",
  "/api/reviews(.*)",
  "/login(.*)",
  "/checkout(.*)",
  "/orders(.*)",
  "/register(.*)",
  "/search(.*)",
  "/api/search(.*)",
]);

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
]);

export default clerkMiddleware(async (auth, request) => {

  if (isAdminRoute(request)) {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      const signInUrl = new URL("/", request.url);
      return NextResponse.redirect(signInUrl);
    }
    const email = sessionClaims?.email as string | undefined;
    if (!email || !ADMIN_EMAILS.includes(email)) {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.next();
  }
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};