import { collection, query, orderBy, limit } from "firebase/firestore";
import { useFirestoreQuery } from "./use-firestore-query";
import type { Photo } from "@/lib/types/event";
import { db } from "@/lib/firebase";

export function useEventPhotos(eventId: string, limitCount = 20) {
  return useFirestoreQuery<Photo>(
    () =>
      query(
        collection(db, "events", eventId, "photos"),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      ),
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Photo,
  );
}
