"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { GoogleButton } from "@/components/auth/google-button";
import { useToast } from "@/hooks/use-toast";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, Calendar } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";

export default function JoinEventPage() {
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = params.eventId as string;

  const login = api.auth.login.useMutation();
  const { data: event, isLoading: isEventLoading } = api.event.getById.useQuery(
    { id: eventId },
    {
      retry: false,
    },
  );

  const joinEvent = api.event.join.useMutation({
    onSuccess: () => {
      toast({
        position: "top",
        variant: "success",
        title: "Welcome!",
        description: "You've successfully joined the event.",
      });
      router.push(`/events/${eventId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
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

      await login.mutateAsync({
        idToken,
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        },
      });

      await joinEvent.mutateAsync({ eventId });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to sign in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#165985] to-[#0c2c47]">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="flex flex-col items-center space-y-6">
          {event?.coverImage && (
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl">
              <Image
                src={event.coverImage}
                alt={event.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {isEventLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-white/80" />
          ) : (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  {event?.name}
                </h1>
                {event?.date && (
                  <div className="flex items-center justify-center gap-2 text-white/80">
                    <Calendar className="h-4 w-4" />
                    <time>{format(event.date, "EEEE, MMMM d, yyyy")}</time>
                  </div>
                )}
              </div>
              <GoogleButton onClick={handleGoogleSignIn} disabled={loading} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
