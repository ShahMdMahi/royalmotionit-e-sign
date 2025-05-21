import authConfig from "@/auth.config";
import NextAuth from "next-auth";
import { privateRoutes, adminOnlyRoutes } from "@/routes";
import { NextResponse } from "next/server";
import { get } from "@vercel/edge-config";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // Get configuration from edge config
  const isRegistrationActive = await get("REGISTRATION_ACTIVE");
  const isMaintenanceMode = await get("MAINTENANCE_MODE_ACTIVE");

  // Path detection
  const isPrivateRoute = privateRoutes.includes(nextUrl.pathname);
  const isAdminOnlyRoute = adminOnlyRoutes.some(route => nextUrl.pathname.startsWith(route));
  // Check for document edit routes that might have dynamic IDs
  const isDocumentEditRoute = /\/documents\/[^\/]+\/edit/.test(nextUrl.pathname);
  const isAuthRoute = nextUrl.pathname.includes("/auth");
  const isApiRoute = nextUrl.pathname.includes("/api");
  const isRegistrationRoute = nextUrl.pathname.includes("/auth/register");
  const isMaintenanceRoute = nextUrl.pathname.includes("/maintenance");

  // Don't redirect API routes
  if (isApiRoute) {
    return;
  }

  // Strict maintenance mode enforcement - redirect everyone to maintenance page
  if (isMaintenanceMode) {
    // If already on maintenance page, allow access
    if (isMaintenanceRoute) {
      return;
    }

    // Redirect everyone to maintenance page regardless of role
    const url = req.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.redirect(url);
  }

  // The code below will only execute if NOT in maintenance mode

  // If user is logged in and tries to access auth pages, redirect to home
  if (isLoggedIn && isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // If registration is disabled and user tries to register, redirect to login
  if (!isRegistrationActive && isRegistrationRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Non-logged in users can access auth routes
  if (isAuthRoute && !isLoggedIn) {
    return;
  }

  // Redirect non-logged in users to login if they try to access private routes
  if (!isLoggedIn && isPrivateRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  // Restrict admin-only routes to admin users
  if (isLoggedIn && (isAdminOnlyRoute || isDocumentEditRoute) && req.auth?.user?.role !== 'ADMIN') {
    // Redirect non-admin users attempting to access admin routes to dashboard
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Allow all other routes
  return;
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
