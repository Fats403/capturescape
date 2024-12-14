import { collection, query, orderBy } from "firebase/firestore";
import { useFirestoreQuery } from "./use-firestore-query";
import type { Participant } from "@/lib/types/event";
import { db } from "@/lib/firebase";

export function useEventParticipants(eventId: string) {
  return useFirestoreQuery<Participant>(
    () =>
      query(
        collection(db, "events", eventId, "participants"),
        orderBy("joinedAt", "desc"),
      ),
    (doc) =>
      ({
        userId: doc.id,
        ...doc.data(),
      }) as Participant,
  );
}
