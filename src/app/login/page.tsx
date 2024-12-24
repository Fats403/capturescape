"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { GoogleButton } from "@/components/auth/google-button";

export default function LoginPage() {
  const router = useRouter();

  const { signIn, loading } = useGoogleAuth({
    onSuccess: useCallback(() => {
      router.push("/dashboard");
    }, [router]),
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <GoogleButton onClick={signIn} disabled={loading} loading={loading} />
    </div>
  );
}
