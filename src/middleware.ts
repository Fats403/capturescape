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
  try {
    // Verify the token by calling an API route
    const response = await fetch(new URL("/api/verify-token", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error("Invalid Token");
    }

    const data = (await response.json()) as TokenResponse;

    if (!data.valid) {
      throw new Error("Invalid token");
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Token verification failed:", error);
    // Redirect to the login if token verification fails
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/events/:path*", // Add events paths to the matcher
  ],
};
