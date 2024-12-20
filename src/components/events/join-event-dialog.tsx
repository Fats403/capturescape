import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/auth/google-button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";

interface JoinEventDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinEventDialog({
  eventId,
  open,
  onOpenChange,
}: JoinEventDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const login = api.auth.login.useMutation();
  const { data: event } = api.event.getById.useQuery(
    { id: eventId },
    {
      enabled: open,
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

      // Login and wait for completion
      await login.mutateAsync({
        idToken,
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        },
      });

      // Join event after successful login
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
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen === false && !user) {
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">Join Event</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <h3 className="text-lg font-medium">{event?.name ?? "Loading..."}</h3>
          <p className="text-center text-sm text-muted-foreground">
            Sign in with Google to join this event and start sharing photos
          </p>
          <div className="w-full">
            <GoogleButton onClick={handleGoogleSignIn} disabled={loading} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
