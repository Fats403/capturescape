import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

interface VerifyTokenRequest {
  token: string;
}

export async function POST(request: Request) {
  const { token } = (await request.json()) as VerifyTokenRequest;

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    await adminAuth.verifySessionCookie(token, true);
    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("Token verification failed:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
