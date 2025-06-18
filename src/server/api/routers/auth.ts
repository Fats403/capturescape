import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { adminAuth, db } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

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
        eventId: z.string().optional(),
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

        if (input.eventId) {
          try {
            const eventRef = db.collection("events").doc(input.eventId);
            const participantRef = eventRef
              .collection("participants")
              .doc(input.user.uid);

            const [eventDoc, participantDoc] = await Promise.all([
              eventRef.get(),
              participantRef.get(),
            ]);

            if (eventDoc.exists && !participantDoc.exists) {
              const batch = db.batch();

              batch.set(participantRef, {
                userId: input.user.uid,
                email: input.user.email,
                eventId: input.eventId,
                joinedAt: Date.now(),
                role: "participant",
                photoCount: 0,
              });

              batch.update(eventRef, {
                participantCount: admin.firestore.FieldValue.increment(1),
              });

              await batch.commit();
            }
          } catch (eventError) {
            console.error("Failed to auto-join event:", eventError);
          }
        }

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
