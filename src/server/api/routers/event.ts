import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/firebase-admin";
import {
  type User,
  type Event,
  type EventParticipant,
  Photo,
} from "@/lib/types/event";
import { eventCreationSchema } from "@/lib/validations/event";
import { z } from "zod";
import { endOfDay } from "date-fns";
import * as admin from "firebase-admin";
import { env } from "@/env";

export const eventRouter = createTRPCRouter({
  create: protectedProcedure
    .input(eventCreationSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      try {
        const eventRef = db.collection("events").doc(input.id);
        const participantRef = eventRef
          .collection("participants")
          .doc(user.uid);

        const batch = db.batch();

        batch.set(eventRef, {
          ...input,
          date: input.date.getTime(),
          endDate: input.endDate.getTime(),
          organizerId: user.uid,
          createdAt: Date.now(),
          photoCount: 0,
          participantCount: 1,
          status: "active",
          archiveLastUpdated: null,
        });

        // Add organizer as first participant
        batch.set(participantRef, {
          userId: user.uid,
          email: user.email,
          eventId: input.id,
          joinedAt: Date.now(),
          role: "organizer",
          photoCount: 0,
        });

        await batch.commit();

        return { id: input.id };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create event",
          cause: error,
        });
      }
    }),

  getAll: protectedProcedure.query(
    async ({ ctx }): Promise<{ upcoming: Event[]; past: Event[] }> => {
      const { user } = ctx;
      const emptyResult = { upcoming: [], past: [] };

      try {
        const eventsSnapshot = await db
          .collection("events")
          .where("organizerId", "==", user.uid)
          .orderBy("date", "desc")
          .get();

        if (eventsSnapshot.empty) {
          return emptyResult;
        }

        const events = eventsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Event[];

        const now = Date.now();
        return events.reduce<{ upcoming: Event[]; past: Event[] }>(
          (acc, event) => {
            // Compare with end of day
            if (endOfDay(new Date(event.date)).getTime() >= now) {
              acc.upcoming.push(event);
            } else {
              acc.past.push(event);
            }
            return acc;
          },
          { upcoming: [], past: [] },
        );
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch events",
          cause: error,
        });
      }
    },
  ),

  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const eventDoc = await db.collection("events").doc(input.id).get();

        if (!eventDoc.exists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found",
          });
        }

        return {
          id: eventDoc.id,
          ...eventDoc.data(),
        } as Event;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch event",
          cause: error,
        });
      }
    }),

  join: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      try {
        const eventRef = db.collection("events").doc(input.eventId);
        const participantRef = eventRef
          .collection("participants")
          .doc(user.uid);

        const [eventDoc, participantDoc] = await Promise.all([
          eventRef.get(),
          participantRef.get(),
        ]);

        // Check if event exists
        if (!eventDoc.exists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found",
          });
        }

        // Check if user is already a participant
        if (participantDoc.exists) {
          return { success: true };
        }

        const batch = db.batch();

        // Add participant
        batch.set(participantRef, {
          userId: user.uid,
          email: user.email,
          eventId: input.eventId,
          joinedAt: Date.now(),
          role: "participant",
          photoCount: 0,
        });

        // Increment participant count
        batch.update(eventRef, {
          participantCount: admin.firestore.FieldValue.increment(1),
        });

        await batch.commit();

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to join event",
          cause: error,
        });
      }
    }),

  getParticipants: publicProcedure
    .input(
      z.object({
        eventId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { eventId } = input;

      try {
        const participantsSnapshot = await db
          .collection("events")
          .doc(eventId)
          .collection("participants")
          .get();

        const participants = participantsSnapshot.docs.map((doc) => ({
          userId: doc.id,
          ...doc.data(),
        })) as EventParticipant[];

        // Batch fetch user data
        const userRefs = participants.map((p) =>
          db.collection("users").doc(p.userId),
        );
        const userDocs = await db.getAll(...userRefs);

        // Merge participant and user data
        return participants.map((participant, i) => {
          const userData = userDocs?.[i]?.data() as
            | Pick<User, "displayName" | "photoURL">
            | undefined;
          return {
            ...participant,
            displayName: userData?.displayName ?? null,
            photoURL: userData?.photoURL ?? null,
          };
        }) as EventParticipant[];
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch participants",
          cause: error,
        });
      }
    }),

  getEventPhotos: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const { eventId } = input;

      try {
        const photosSnapshot = await db
          .collection("events")
          .doc(eventId)
          .collection("photos")
          .get();

        if (photosSnapshot.empty) {
          return [];
        }

        const photos = photosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Photo[];

        return photos;
      } catch (error) {
        console.error("Failed to fetch photos:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch photos",
          cause: error,
        });
      }
    }),

  regenerateArchive: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Get your project ID and region from environment or config
      const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const region = "us-central1"; // or your deployed region

      const functionUrl = `https://${region}-${projectId}.cloudfunctions.net/regenerateEventArchiveHTTP`;

      try {
        const response = await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId: input.eventId,
            userId: ctx.user.uid,
          }),
        });

        if (!response.ok) {
          let errorMessage = "Failed to regenerate archive";

          try {
            const errorData = (await response.json()) as { error?: string };
            errorMessage = errorData.error ?? errorMessage;
          } catch {
            // If JSON parsing fails, use default message
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: errorMessage,
          });
        }

        const result = (await response.json()) as {
          success: boolean;
          message?: string;
        };
        return result;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to regenerate archive",
          cause: error,
        });
      }
    }),
});
