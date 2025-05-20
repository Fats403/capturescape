import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    FIREBASE_CLIENT_EMAIL: z.string().email(),
    FIREBASE_PRIVATE_KEY: z.string(),
    FIREBASE_STORAGE_BUCKET: z.string(),
  },

  client: {
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string(),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string(),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string(),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string(),
    NEXT_PUBLIC_BASE_URL: z.string(),
  },

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
