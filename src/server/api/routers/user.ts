// src/server/api/routers/user.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/lib/firebaseAdmin";

export const userRouter = createTRPCRouter({
  createProfile: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        displayName: z.string().nullable(),
        photoURL: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      try {
        await db.collection("users").doc(user.uid).set({
          email: input.email,
          displayName: input.displayName,
          photoURL: input.photoURL,
          createdAt: new Date(),
        });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user profile",
          cause: error,
        });
      }
    }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const userDoc = await db.collection("users").doc(ctx.user.uid).get();

    if (!userDoc.exists) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User profile not found",
      });
    }

    return {
      id: userDoc.id,
      ...userDoc.data(),
    };
  }),
});
