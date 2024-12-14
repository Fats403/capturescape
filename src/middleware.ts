import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface TokenResponse {
  valid: boolean;
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

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
  matcher: ["/dashboard/:path*"],
};
