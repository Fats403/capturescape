import { useEffect, useRef, useCallback } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { api } from "@/trpc/react";

function debounce<
  T extends (...args: Parameters<T>) => ReturnType<T>,
  P extends Parameters<T>,
>(func: T, wait: number): (...args: P) => void {
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: P) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = undefined;
    }, wait);
  };
}

export function useRealtimePhotos(eventId: string) {
  const utils = api.useUtils();

  const invalidate = useCallback(
    (eventId: string) => {
      void utils.photo.getEventPhotos.invalidate({ eventId });
    },
    [utils],
  );

  const debouncedInvalidate = useRef(debounce(invalidate, 1000)).current;

  useEffect(() => {
    const photosQuery = query(
      collection(db, `events/${eventId}/photos`),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(photosQuery, (snapshot) => {
      const hasNonLikeChanges = snapshot.docChanges().some((change) => {
        const changedFields = Object.keys(change.doc.data());
        return changedFields.some((field) => !field.startsWith("likes"));
      });

      if (!snapshot.metadata.hasPendingWrites && hasNonLikeChanges) {
        debouncedInvalidate(eventId);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [eventId, debouncedInvalidate]);
}
