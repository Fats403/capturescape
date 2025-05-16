import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define paths that don't require authentication
const publicPaths = ["/login", "/register"];

// Define paths with custom logic
const customPaths = {
  // Event pages: redirect to join page if not authenticated
  eventPage: {
    pattern: /^\/events\/([^\/]+)$/,
    handler: (request: NextRequest, matches: RegExpExecArray) => {
      const token = request.cookies.get("token")?.value;
      const eventId = matches[1];

      if (!token) {
        return NextResponse.redirect(
          new URL(`/events/${eventId}/join`, request.url),
        );
      }

      return null; // Continue with normal auth check
    },
  },

  // Join pages: always public
  joinPage: {
    pattern: /^\/events\/([^\/]+)\/join$/,
    handler: () => NextResponse.next(),
  },

  photosPage: {
    pattern: /^\/events\/([^\/]+)\/photos$/,
    handler: () => NextResponse.next(),
  },
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // 1. Check for public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2. Check for paths with custom logic
  for (const [_, customPath] of Object.entries(customPaths)) {
    const matches = customPath.pattern.exec(pathname);
    if (matches) {
      const result = customPath.handler(request, matches);
      if (result) return result;
    }
  }

  // 3. All other paths require authentication
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Verify token is valid
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
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    // Protected paths
    "/dashboard/:path*",
    "/events/:path*",
    "/photos",
    // Public paths (still need to be matched to skip auth checks)
    "/login",
    "/register",
    "/reset-password",
  ],
};
