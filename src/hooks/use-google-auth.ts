import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  type UserCredential,
  AuthError,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { api } from "@/trpc/react";

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

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

  const handleAuthResult = async (result: UserCredential | null) => {
    try {
      if (!result) {
        setLoading(false);
        return; // User closed popup
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
    setLoading(true); // Set loading immediately
    const provider = new GoogleAuthProvider();

    try {
      if (isMobile()) {
        await signInWithRedirect(auth, provider);
        // Loading state will be handled by checkRedirectResult
      } else {
        // For popup, we need to handle the loading state differently
        const result = await signInWithPopup(auth, provider).catch(
          (error: AuthError) => {
            // Handle popup closed by user
            if (error.code === "auth/popup-closed-by-user") {
              setLoading(false);
              return null;
            }
            throw error;
          },
        );

        await handleAuthResult(result);
      }
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

  const checkRedirectResult = async () => {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        setLoading(true);
        await handleAuthResult(result);
      }
    } catch (error) {
      console.error("Redirect error:", error);
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

  return {
    signIn,
    checkRedirectResult,
    loading,
  };
}
