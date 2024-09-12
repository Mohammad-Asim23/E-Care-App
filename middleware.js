// middleware.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  // Get the session token from the request
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const { pathname } = req.nextUrl;

  // If the user is accessing the sign-in page or API routes, continue without checking
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/auth/signin" ||
    pathname === "/api/auth/signup"
  ) {
    return NextResponse.next();
  }

  // If the user is accessing protected routes and is not authenticated, redirect them to sign-in
  if (!token) {
    const signInUrl = new URL("/api/auth/signin", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Allow the request to proceed if authenticated
  return NextResponse.next();
}

// Specify paths that require authentication
export const config = {
  matcher: [
    "/dashboard/:path*", // Protects all routes under /dashboard
    "/personal-info/:path*", // Protects all routes under /profile
  ],
};
