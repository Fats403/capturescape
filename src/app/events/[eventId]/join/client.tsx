"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { GoogleButton } from "@/components/auth/google-button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { useGoogleAuth } from "@/hooks/use-google-auth";

export default function JoinEventPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const eventId = params.eventId as string;

  const {
    data: event,
    isLoading: isEventLoading,
    error: eventError,
  } = api.event.getById.useQuery(
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

  const {
    signIn,
    checkRedirectResult,
    loading: authLoading,
  } = useGoogleAuth({
    onSuccess: async () => {
      await joinEvent.mutateAsync({ eventId });
    },
  });

  const isLoading =
    isEventLoading || isAuthLoading || authLoading || joinEvent.isPending;

  useEffect(() => {
    void checkRedirectResult();
  }, [checkRedirectResult]);

  if (isEventLoading || isAuthLoading) {
    return (
      <main className="flex h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#165985] to-[#0c2c47]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </main>
    );
  }

  if (eventError || !event) {
    return (
      <main className="flex h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#165985] to-[#0c2c47] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Event Not Found</h1>
          <p className="mt-2 text-white/80">
            This event may have been deleted or the link is invalid.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-20 flex h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#165985] to-[#0c2c47]">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="flex flex-col items-center space-y-6">
          {event.coverImage && (
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

          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {event.name}
            </h1>
            {event.date && (
              <div className="flex items-center justify-center gap-2 text-white/80">
                <Calendar className="h-4 w-4" />
                <time>
                  {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                </time>
              </div>
            )}
          </div>

          {!user ? (
            <GoogleButton
              onClick={signIn}
              disabled={isLoading}
              loading={authLoading}
            />
          ) : (
            <Button
              onClick={() => joinEvent.mutate({ eventId })}
              disabled={isLoading}
              className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining...
                </div>
              ) : (
                "Join Event"
              )}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
