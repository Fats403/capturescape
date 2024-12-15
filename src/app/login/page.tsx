"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GoogleButton } from "@/components/auth/google-button";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { api } from "@/trpc/react";
import { auth } from "@/lib/firebase";

const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const utils = api.useUtils();
  const loginMutation = api.auth.login.useMutation({
    onSuccess: () => {
      form.reset();
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

  const handleSignInSuccess = useCallback(
    async (userCredential: UserCredential) => {
      const idToken = await userCredential.user.getIdToken();

      await loginMutation.mutateAsync({
        idToken,
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
        },
      });
    },
    [loginMutation],
  );

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await handleSignInSuccess(result);
  }, [handleSignInSuccess]);

  async function onSubmit(data: LoginValues) {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );
      await handleSignInSuccess(result);
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
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-1/2 border-t border-black/50 border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <GoogleButton onClick={handleGoogleSignIn} disabled={loading} />
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button variant="link" asChild className="text-sm">
            <Link href="/register">Don&apos;t have an account? Sign up</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
