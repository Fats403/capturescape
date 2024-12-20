import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/lib/firebase-admin";
import { TRPCError } from "@trpc/server";
import { type Photo } from "@/lib/types/event";

const PHOTOS_PER_PAGE = 8;

export const photoRouter = createTRPCRouter({
  getEventPhotos: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(PHOTOS_PER_PAGE),
      }),
    )
    .query(async ({ input }) => {
      const { eventId, cursor, limit } = input;

      try {
        let query = db
          .collection("events")
          .doc(eventId)
          .collection("photos")
          .orderBy("createdAt", "desc")
          .limit(limit);

        if (cursor) {
          const cursorDoc = await db
            .collection("events")
            .doc(eventId)
            .collection("photos")
            .doc(cursor)
            .get();

          if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
          }
        }

        const snapshot = await query.get();
        const photos = snapshot.docs.map((doc) => doc.data()) as Photo[];

        let nextCursor: string | undefined;
        if (photos.length === limit) {
          nextCursor = photos[photos.length - 1]?.id;
        }

        return {
          photos,
          nextCursor,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch photos",
          cause: error,
        });
      }
    }),
});
