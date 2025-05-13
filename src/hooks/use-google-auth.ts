import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  signInWithPopup,
  GoogleAuthProvider,
  type UserCredential,
  type AuthError,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { api } from "@/trpc/react";

interface UseGoogleAuthOptions {
  onSuccess?: (result: UserCredential) => Promise<void> | void;
  onError?: (error: Error) => void;
}

export function useGoogleAuth({
  onSuccess,
  onError,
}: UseGoogleAuthOptions = {}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const login = api.auth.login.useMutation();
  const utils = api.useUtils();

  const handleAuthResult = async (result: UserCredential | null) => {
    try {
      if (!result) {
        setLoading(false);
        return;
      }

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

      // Invalidate the auth query to refresh user data
      await utils.auth.getUser.invalidate();

      await onSuccess?.(result);
    } catch (error) {
      setLoading(false);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to complete sign in";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  };

  const signIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider).catch(
        (error: AuthError) => {
          if (error.code === "auth/popup-closed-by-user") {
            setLoading(false);
            return null;
          }
          throw error;
        },
      );

      await handleAuthResult(result);
    } catch (error) {
      setLoading(false);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to sign in";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  };

  return {
    signIn,
    loading,
  };
}
