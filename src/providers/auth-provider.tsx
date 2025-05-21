"use client";

import React, {
  createContext,
  useContext,
  type ReactNode,
  useEffect,
} from "react";
import { api } from "@/trpc/react";
import { type UserRecord } from "firebase-admin/auth";
import * as Sentry from "@sentry/nextjs";

interface AuthContextType {
  user: UserRecord | null | undefined;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { data: user, isLoading } = api.auth.getUser.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: false,
  });

  // Set Sentry user information when the user changes
  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.uid,
        email: user.email || undefined,
        username: user.displayName || undefined,
      });
    } else if (user === null) {
      // Clear user data when logged out
      Sentry.setUser(null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
