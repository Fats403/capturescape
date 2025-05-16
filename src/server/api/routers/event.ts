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
import { endOfDay, startOfDay } from "date-fns";
import * as admin from "firebase-admin";
import mailjet from "@/lib/mailjet";

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

  sendPhotoEmails: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { eventId } = input;

      try {
        // 1. Get the event details
        const eventDoc = await db.collection("events").doc(eventId).get();

        if (!eventDoc.exists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found",
          });
        }

        const eventData = eventDoc.data() as Event;

        // Verify user is the organizer
        if (eventData.organizerId !== user.uid) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the event organizer can send emails",
          });
        }

        // 2. Get all participants with their emails
        const participantsSnapshot = await db
          .collection("events")
          .doc(eventId)
          .collection("participants")
          .get();

        if (participantsSnapshot.empty) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No participants found for this event",
          });
        }

        const participants = participantsSnapshot.docs.map((doc) => ({
          ...doc.data(),
        })) as EventParticipant[];

        // 3. Get user data for each participant to enhance email content
        const userIds = participants.map((p) => p.userId);
        const userDocs = await Promise.all(
          userIds.map((uid) => db.collection("users").doc(uid).get()),
        );

        const usersData = userDocs.reduce(
          (acc, doc) => {
            if (doc.exists) {
              acc[doc.id] = doc.data() as User;
            }
            return acc;
          },
          {} as Record<string, User>,
        );

        // 4. Create download link - this can be customized based on your app's structure
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const downloadUrl = `${baseUrl}/events/${eventId}/photos`;

        // 5. Send emails to all participants
        const emailPromises = participants
          .filter((p) => p.email) // Only send to participants with emails
          .map(async (participant) => {
            const userData = usersData[participant.userId] ?? null;
            const displayName =
              userData?.displayName ??
              participant.email?.split("@")[0] ??
              "Guest";

            // Prepare stats for the template
            const photoCount = participant.photoCount ?? 0;

            // Get total likes for this participant's photos
            const photosSnapshot = await db
              .collection("events")
              .doc(eventId)
              .collection("photos")
              .where("uploaderId", "==", participant.userId)
              .get();

            const totalLikes = photosSnapshot.docs.reduce((sum, doc) => {
              const photoData = doc.data() as Photo;
              return sum + (photoData?.likes?.count ?? 0);
            }, 0);

            return mailjet.post("send", { version: "v3.1" }).request({
              Messages: [
                {
                  From: {
                    Email: "admin@capturescape.com",
                    Name: "CaptureScape",
                  },
                  To: [
                    {
                      Email: participant.email,
                      Name: displayName,
                    },
                  ],
                  Subject: `Download Photos from ${eventData.name}`,
                  TemplateID: 6984638,
                  TemplateLanguage: true,
                  Variables: {
                    eventName: eventData.name,
                    participantName: displayName,
                    downloadUrl,
                    photoCount,
                    totalLikes,
                    eventDate: new Date(eventData.date).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    ),
                  },
                },
              ],
            });
          });

        await Promise.all(emailPromises);

        // 6. Record that emails were sent
        await db.collection("events").doc(eventId).update({
          emailsSentAt: Date.now(),
        });

        return { success: true, emailsSent: emailPromises.length };
      } catch (error) {
        console.error("Failed to send event photo emails:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send emails",
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
});
