import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { adminAuth, db } from "@/lib/firebase-admin";

export const authRouter = createTRPCRouter({
  getUser: publicProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  login: publicProcedure
    .input(
      z.object({
        idToken: z.string(),
        user: z.object({
          uid: z.string(),
          email: z.string().nullable(),
          displayName: z.string().nullable(),
          photoURL: z.string().nullable(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await adminAuth.createSessionCookie(
          input.idToken,
          {
            expiresIn,
          },
        );

        (await cookies()).set("token", sessionCookie, {
          maxAge: expiresIn,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });

        await db.collection("users").doc(input.user.uid).set(
          {
            email: input.user.email,
            displayName: input.user.displayName,
            photoURL: input.user.photoURL,
            updatedAt: new Date(),
          },
          { merge: true },
        );

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create session",
          cause: error,
        });
      }
    }),

  logout: protectedProcedure.mutation(async () => {
    (await cookies()).delete("token");
    return { success: true };
  }),
});
