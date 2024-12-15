import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/firebaseAdmin";
import { type Event } from "@/lib/types/event";
import { eventCreationSchema } from "@/lib/validations/event";
import { z } from "zod";
import { endOfDay, startOfDay } from "date-fns";

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
          date: startOfDay(input.date).getTime(),
          organizerId: user.uid,
          createdAt: Date.now(),
          photoCount: 0,
          participantCount: 1,
        });

        // Add organizer as first participant
        batch.set(participantRef, {
          userId: user.uid,
          eventId: input.id,
          joinedAt: Date.now(),
          role: "organizer",
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

        const events = eventsSnapshot.docs
          .map((doc) => {
            const data = doc.data() as Event;
            if (!data) return null;

            return {
              ...data,
              id: doc.id,
              date: data.date ?? 0,
              name: data.name ?? "",
              organizerId: data.organizerId ?? "",
              coverImage: data.coverImage ?? "",
              createdAt: data.createdAt ?? 0,
              photoCount: data.photoCount ?? 0,
              participantCount: data.participantCount ?? 0,
            } as Event;
          })
          .filter((event): event is Event => event !== null);

        const now = Date.now();
        return events.reduce<{ upcoming: Event[]; past: Event[] }>(
          (acc, event) => {
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
        console.error("Error fetching events:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch event",
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
});
