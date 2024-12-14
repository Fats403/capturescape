import { useState, useEffect } from "react";
import {
  onSnapshot,
  type Query,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

// Generic type for the hook
export function useFirestoreQuery<T>(
  queryFn: () => Query<DocumentData>,
  transform: (doc: QueryDocumentSnapshot) => T,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = queryFn();

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(transform);
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [queryFn, transform]);

  return { data, loading, error };
}
