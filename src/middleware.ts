import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface TokenResponse {
  valid: boolean;
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Check if we're on an event route
  const eventMatch = /^\/events\/([^\/]+)$/.exec(pathname);
  const joinMatch = /^\/events\/([^\/]+)\/join$/.exec(pathname);

  if (eventMatch || joinMatch) {
    const eventId = (eventMatch ?? joinMatch)?.[1];

    if (!token && eventMatch) {
      // If not authenticated and on main event page, redirect to join page
      return NextResponse.redirect(
        new URL(`/events/${eventId}/join`, request.url),
      );
    }

    if (token && joinMatch) {
      // If authenticated and on join page, redirect to main event page
      return NextResponse.redirect(new URL(`/events/${eventId}`, request.url));
    }

    // Allow access to join page without authentication
    if (joinMatch) {
      return NextResponse.next();
    }
  }

  // Only verify token for non-join pages
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Use headers to pass token to API route
    const response = await fetch(new URL("/api/verify-token", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add cache control headers
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error("Invalid Token");
    }

    return NextResponse.next();
  } catch (error) {
    // Only redirect to login for non-join pages
    if (!joinMatch) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/events/:path*", // Add events paths to the matcher
  ],
};
