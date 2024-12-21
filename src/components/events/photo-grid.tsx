import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { api } from "@/trpc/react";
import Image from "next/image";
import { useRealtimePhotos } from "@/hooks/use-realtime-photos";
import { Skeleton } from "@/components/ui/skeleton";
import { type Photo } from "@/lib/types/event";
import { AnimatePresence, motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageIcon } from "lucide-react";
import { PhotoModal } from "@/components/events/photo-modal";

interface PhotoGridProps {
  eventId: string;
}

export function PhotoGrid({ eventId }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const { ref, inView } = useInView({
    threshold: 0.1,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    api.photo.getEventPhotos.useInfiniteQuery(
      {
        eventId,
        limit: 8,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
    );

  useRealtimePhotos(eventId);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <PhotoGridSkeleton />;
  }

  const hasPhotos = Boolean(data?.pages?.[0]?.photos?.length);

  return (
    <>
      <PhotoModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
      <ScrollArea className="h-[calc(100dvh-80px)]">
        <div className="grid h-full px-4 py-4">
          {!hasPhotos ? (
            <div className="flex h-[calc(100dvh-112px)] flex-col items-center justify-center space-y-1 text-center">
              <ImageIcon className="mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-xl font-medium text-muted-foreground">
                Nothing in the gallery yet
              </p>
              <p className="text-sm text-muted-foreground">
                Be the first one to post a picture!
              </p>
            </div>
          ) : (
            <div className="grid min-h-full select-none grid-cols-2 gap-1 md:grid-cols-4">
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
                      className="group relative aspect-square cursor-pointer overflow-hidden rounded-md"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <Image
                        src={photo.urls.medium}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw"
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL={photo.urls.thumbnail}
                      />
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
          )}
        </div>
      </ScrollArea>
    </>
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
    <ScrollArea className="h-[calc(100%-80px)] flex-1 [&_[data-radix-scroll-area-viewport]]:pb-20">
      <div className="h-full px-4 py-4">
        <div className="grid select-none grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
