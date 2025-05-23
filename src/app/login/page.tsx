"use client";

import { motion } from "framer-motion";
import { Camera, ArrowRight } from "lucide-react";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { GoogleButton } from "@/components/auth/google-button";

export default function LoginPage() {
  const router = useRouter();

  const { signIn, loading } = useGoogleAuth({
    onSuccess: useCallback(() => {
      router.push("/dashboard");
    }, [router]),
  });

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white dark:bg-black">
      {/* Background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-20 top-40 h-20 w-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-10"
          animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute right-20 top-60 h-16 w-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 opacity-10"
          animate={{ y: [0, 20, 0], rotate: [360, 180, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      {/* Login container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md rounded-2xl border-2 border-gray-100 bg-white p-8 px-4 shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="relative">
            <Camera className="size-10 text-blue-500" />
            <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
          </div>
          <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
            CaptureScape
          </h1>
        </div>

        <div className="mb-8 text-center">
          <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Welcome!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to continue sharing memories
          </p>
        </div>

        <div className="space-y-4">
          <GoogleButton
            onClick={signIn}
            disabled={loading}
            loading={loading}
            className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3 font-medium text-gray-700 transition-all duration-300 hover:border-blue-500 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          />
        </div>
      </motion.div>
    </div>
  );
}
