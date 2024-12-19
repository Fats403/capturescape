import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { api } from "@/trpc/react";
import Image from "next/image";
import { useRealtimePhotos } from "@/hooks/use-realtime-photos";
import { Skeleton } from "@/components/ui/skeleton";
import { type Photo } from "@/lib/types/event";
import { AnimatePresence, motion } from "framer-motion";

interface PhotoGridProps {
  eventId: string;
}

export function PhotoGrid({ eventId }: PhotoGridProps) {
  const { ref, inView } = useInView();

  useRealtimePhotos(eventId);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    api.photo.getEventPhotos.useInfiniteQuery(
      {
        eventId,
        limit: 20,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 2000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
      },
    );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <PhotoGridSkeleton />;
  }

  return (
    <div className="h-[calc(100dvh-80px)] overflow-y-auto px-4 py-4">
      <div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {data?.pages.map((page) =>
            page.photos.map((photo: Photo) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="group relative aspect-square overflow-hidden rounded-md"
              >
                <Image
                  src={photo.urls.medium}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={photo.urls.thumbnail}
                />
                {photo.status === "pending" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                  >
                    <p className="text-sm text-white">Processing...</p>
                  </motion.div>
                )}
              </motion.div>
            )),
          )}
        </AnimatePresence>
        {hasNextPage && (
          <div ref={ref} className="col-span-full h-8">
            {isFetchingNextPage && <LoadingSpinner />}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center p-4">
      <motion.div
        className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

function PhotoGridSkeleton() {
  return (
    <div className="h-[calc(100dvh-80px)] overflow-y-auto px-4 py-4">
      <div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-md" />
        ))}
      </div>
    </div>
  );
}
