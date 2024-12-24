"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { GoogleButton } from "@/components/auth/google-button";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") ?? "/dashboard";

  const { signIn, loading } = useGoogleAuth({
    onSuccess: useCallback(() => {
      router.push(redirectPath);
    }, [router, redirectPath]),
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <GoogleButton onClick={signIn} disabled={loading} loading={loading} />
    </div>
  );
}
