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

    if (joinMatch) {
      return NextResponse.next();
    }
  }

  // Only verify token for non-join pages
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await fetch(new URL("/api/verify-token", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      body: JSON.stringify({ token }),
    });

    return NextResponse.next();
  } catch (error) {
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
