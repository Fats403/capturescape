import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/lib/firebase-admin";
import { TRPCError } from "@trpc/server";
import { type Photo } from "@/lib/types/event";
import { FieldValue } from "firebase-admin/firestore";

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

  toggleLike: protectedProcedure
    .input(
      z.object({
        photoId: z.string(),
        eventId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { photoId, eventId } = input;
      const userId = ctx.user.uid;

      const photoRef = db
        .collection("events")
        .doc(eventId)
        .collection("photos")
        .doc(photoId);

      const photoDoc = await photoRef.get();

      if (!photoDoc.exists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Photo not found",
        });
      }

      const photo = photoDoc.data() as Photo | undefined;
      const userLiked = photo?.likes?.userIds?.includes(userId);

      await photoRef.update({
        "likes.userIds": userLiked
          ? FieldValue.arrayRemove(userId)
          : FieldValue.arrayUnion(userId),
        "likes.count": FieldValue.increment(userLiked ? -1 : 1),
      });

      return { success: true };
    }),
});
