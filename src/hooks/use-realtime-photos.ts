import { useEffect, useRef } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { api } from "@/trpc/react";
import { type Photo } from "@/lib/types/event";
import { type InfiniteData } from "@tanstack/react-query";

type PhotoQueryOutput = InfiniteData<
  {
    photos: Photo[];
    nextCursor: string | undefined;
  },
  string | null
>;

export function useRealtimePhotos(eventId: string): void {
  const utils = api.useUtils();
  const lastKnownPhotoRef = useRef<string | null>(null);

  useEffect(() => {
    const photosQuery = query(
      collection(db, `events/${eventId}/photos`),
      orderBy("createdAt", "desc"),
      limit(1),
    );

    const unsubscribe = onSnapshot(photosQuery, (snapshot) => {
      if (snapshot.empty) return;

      const latestPhoto = snapshot?.docs[0]?.data() as Photo;

      if (latestPhoto.id !== lastKnownPhotoRef.current) {
        lastKnownPhotoRef.current = latestPhoto.id;

        utils.photo.getEventPhotos.setInfiniteData(
          { eventId, limit: 8 },
          (oldData): PhotoQueryOutput | undefined => {
            if (!oldData) return oldData;

            const newPhoto = latestPhoto;
            const existingPhotos = oldData.pages.flatMap((p) => p.photos);

            if (existingPhotos.some((p) => p.id === newPhoto.id)) {
              return oldData;
            }

            return {
              ...oldData,
              pages: [
                {
                  ...oldData.pages[0],
                  photos: [newPhoto, ...(oldData?.pages[0]?.photos ?? [])],
                  nextCursor: oldData?.pages[0]?.nextCursor ?? undefined,
                },
                ...oldData.pages.slice(1),
              ],
            };
          },
        );
      }
    });

    return () => unsubscribe();
  }, [eventId, utils]);
}
