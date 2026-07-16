// proxy.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getCountryFromIP } from "./Lib/location";

// Extract and export your token and payment verification logic
export async function verifyTokenAndAuthorization(req, allowedRoles = []) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return false;
  }

  // In middleware running on the Edge runtime we can't connect to the
  // database. Rely on the presence of a valid NextAuth token as proof
  // that the user is authenticated. Additional checks should be
  // performed in API routes.
  // If needed, you can call an API endpoint to validate the user.

  return allowedRoles.length === 0 || allowedRoles.includes(token.role);
}

function getProtectedArea(pathname) {
  if (
    pathname === "/student-dashboard" ||
    pathname.startsWith("/student-dashboard/")
  ) {
    return { roles: ["student"], loginPath: "/student-auth/login" };
  }
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return { roles: ["coach"], loginPath: "/auth/login" };
  }
  if (pathname.startsWith("/bmpadmin/")) {
    return { roles: ["admin"], loginPath: "/bmpadmin" };
  }
  return null;
}

export default async function proxy(req) {
  let countryCode = req.cookies.get("user-country")?.value;

  // Only perform the expensive IP lookup if the cookie is not present.
  if (!countryCode) {
    countryCode = await getCountryFromIP(req);
  }

  // Always create a response object to modify headers and cookies.
  // Decide the response based on the path.
  let response;
  const protectedArea = getProtectedArea(req.nextUrl.pathname);
  if (protectedArea) {
    // Guard against stale prefetch/cache requests to non-existent dynamic paths like /dashboard/undefined
    const dashboardSegment = req.nextUrl.pathname.startsWith("/dashboard")
      ? req.nextUrl.pathname.split("/")[2]
      : null;
    const invalidSegments = ["undefined", "null", "NaN"];
    if (dashboardSegment && invalidSegments.includes(dashboardSegment)) {
      response = NextResponse.redirect(new URL("/dashboard", req.url));
    } else {
      const isAuthorized = await verifyTokenAndAuthorization(
        req,
        protectedArea.roles,
      );
      response = isAuthorized
        ? NextResponse.next()
        : NextResponse.redirect(new URL(protectedArea.loginPath, req.url));
    }
  } else {
    response = NextResponse.next();
  }

  // Attach headers and cookies to the response.
  response.headers.set("x-user-country", countryCode);
  response.cookies.set("user-country", countryCode, {
    path: "/", // Apply cookie to all paths
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}

// Apply proxy to all page routes for country detection and role-based dashboard protection.
export const config = {
  matcher: [
    // Match all routes except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
