// src/hooks/useAuth.ts
import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
  type UserCredential,
} from "firebase/auth";
import { api } from "@/trpc/react";

// Add this type for the Google signin result
interface AuthCredential extends UserCredential {
  _tokenResponse?: {
    isNewUser?: boolean;
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const utils = api.useUtils();

  const createProfile = api.user.createProfile.useMutation({
    onSuccess: () => {
      void utils.user.getCurrentUser.invalidate();
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      if (!user) {
        void utils.invalidate();
      }
    });

    return () => unsubscribe();
  }, [utils]);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const result = (await signInWithPopup(auth, provider)) as AuthCredential;

    // Check if new user using _tokenResponse
    if (result._tokenResponse?.isNewUser) {
      await createProfile.mutateAsync({
        email: result.user.email!,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });
    }

    return result.user;
  }, [createProfile]);

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await createProfile.mutateAsync({
        email: result.user.email!,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });

      return result.user;
    },
    [createProfile],
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
  };
}
