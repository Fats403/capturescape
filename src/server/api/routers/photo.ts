import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/lib/firebase-admin";
import { TRPCError } from "@trpc/server";
import { type Photo } from "@/lib/types/event";
import { FieldValue } from "firebase-admin/firestore";
import { adminStorage } from "@/lib/firebase-admin";

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

  getPhotoById: protectedProcedure
    .input(
      z.object({
        photoId: z.string(),
        eventId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { photoId, eventId } = input;

      try {
        const photoDoc = await db
          .collection("events")
          .doc(eventId)
          .collection("photos")
          .doc(photoId)
          .get();

        if (!photoDoc.exists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Photo not found",
          });
        }

        return photoDoc.data() as Photo;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch photo",
          cause: error,
        });
      }
    }),

  // Add this endpoint to your photo router
  getPhotoLikes: protectedProcedure
    .input(
      z.object({
        photoId: z.string(),
        eventId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { photoId, eventId } = input;
      const userId = ctx.user.uid;

      try {
        const photoDoc = await db
          .collection("events")
          .doc(eventId)
          .collection("photos")
          .doc(photoId)
          .get();

        if (!photoDoc.exists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Photo not found",
          });
        }

        const photo = photoDoc.data() as Photo;
        const likesData = photo.likes || { count: 0, userIds: [] };

        return {
          count: likesData.count,
          userLiked: likesData.userIds.includes(userId),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch photo likes",
          cause: error,
        });
      }
    }),

  deletePhoto: protectedProcedure
    .input(
      z.object({
        photoId: z.string(),
        eventId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { photoId, eventId } = input;
      const userId = ctx.user.uid;

      // Check if user is organizer
      const eventRef = db.collection("events").doc(eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      const event = eventDoc.data();
      if (event?.organizerId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only event organizers can delete photos",
        });
      }

      const photoRef = eventRef.collection("photos").doc(photoId);
      const photoDoc = await photoRef.get();

      if (!photoDoc.exists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Photo not found",
        });
      }

      const photo = photoDoc.data() as Photo;

      // Delete the photo document and counts from the event and participant
      if (photo.uploaderId) {
        await eventRef
          .collection("participants")
          .doc(photo.uploaderId)
          .update({
            photoCount: FieldValue.increment(-1),
          });
      }
      await eventRef.update({ photoCount: FieldValue.increment(-1) });
      await eventRef.collection("photos").doc(photoId).delete();

      return { success: true };
    }),

  getUserLastUploadedPhoto: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.uid;

    try {
      // Define the storage path
      const storagePath = `users/${userId}/last-uploaded/photo.jpg`;

      // Check if the file exists
      try {
        const [fileExists] = await adminStorage
          .bucket()
          .file(storagePath)
          .exists();

        if (!fileExists) {
          return { imageData: null };
        }

        // Get the file content
        const [fileContents] = await adminStorage
          .bucket()
          .file(storagePath)
          .download();

        // Convert to base64
        const base64 = `data:image/jpeg;base64,${fileContents.toString("base64")}`;

        return { imageData: base64 };
      } catch (error) {
        // File doesn't exist or can't be accessed
        return { imageData: null };
      }
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch last uploaded photo",
        cause: error,
      });
    }
  }),

  clearUserLastUploadedPhoto: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.uid;

    try {
      const storagePath = `users/${userId}/last-uploaded/photo.jpg`;

      // Check if file exists before attempting to delete
      const [fileExists] = await adminStorage
        .bucket()
        .file(storagePath)
        .exists();

      if (fileExists) {
        await adminStorage.bucket().file(storagePath).delete();
      }

      return { success: true };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to clear last uploaded photo",
        cause: error,
      });
    }
  }),
});
