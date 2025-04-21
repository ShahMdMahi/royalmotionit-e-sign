import authConfig from "@/auth.config";
import NextAuth from "next-auth";
import { privateRoutes } from "@/routes";
import { NextResponse } from "next/server";
import { get } from "@vercel/edge-config";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const isRegistrationActive = await get("REGISTRATION_ACTIVE");

  const isPrivateRoute = privateRoutes.includes(nextUrl.pathname);
  const isAuthRoute = nextUrl.pathname.includes("/auth");
  const isApiRoute = nextUrl.pathname.includes("/api");
  const isRegistrationRoute = nextUrl.pathname.includes("/auth/register");

  if (isApiRoute) {
    return;
  }

  if (isLoggedIn && isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (!isRegistrationActive && isRegistrationRoute) {
    console.log("Registration is not active");
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && !isLoggedIn) {
    return;
  }

  if (!isLoggedIn && isPrivateRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
