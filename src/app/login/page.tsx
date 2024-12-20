"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/google-button";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { api } from "@/trpc/react";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const utils = api.useUtils();
  const loginMutation = api.auth.login.useMutation({
    onSuccess: () => {
      void utils.invalidate();
      router.push("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      await loginMutation.mutateAsync({
        idToken,
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        },
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#165985] to-[#0c2c47] text-white">
      <div className="justify-centers mb-12 flex flex-col items-center gap-8">
        <Image
          src="/logo.png"
          alt="CaptureScape"
          width={100}
          height={100}
          className="rounded-full border-2 border-white"
        />
        <h1 className="text-5xl font-extrabold tracking-tight">
          Capture Scape
        </h1>
      </div>
      <Card className="w-[350px] border-border bg-background md:w-[400px]">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h2 className="text-xl font-semibold">Welcome Back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in with your Google account to continue
            </p>
          </div>
          <div className="mt-4">
            <GoogleButton onClick={handleGoogleSignIn} disabled={loading} />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
