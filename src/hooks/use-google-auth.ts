import { useState, useCallback } from "react";
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
  eventId?: string;
}

export function useGoogleAuth(options?: UseGoogleAuthOptions) {
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
        eventId: options?.eventId,
      });

      // Invalidate the auth query to refresh user data
      await utils.auth.getUser.invalidate();

      await options?.onSuccess?.(result);
    } catch (error) {
      setLoading(false);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to complete sign in";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      options?.onError?.(
        error instanceof Error ? error : new Error(errorMessage),
      );
    }
  };

  const signIn = useCallback(async () => {
    if (!auth || loading) return;

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
      options?.onError?.(
        error instanceof Error ? error : new Error(errorMessage),
      );
    }
  }, [auth, loading, login, options]);

  return {
    signIn,
    loading,
  };
}
