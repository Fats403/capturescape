"use client";

import { PhotoGrid } from "@/components/events/photo-grid";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Download, Camera } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";

export default function GalleryPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  // Fetch event details to if its completed
  const { data: event, isLoading } = api.event.getById.useQuery(
    { id: eventId },
    { enabled: Boolean(eventId) },
  );

  // Navigate to photos download page
  const goToPhotosPage = () => {
    router.push(`/events/${eventId}/photos`);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (event?.status === "completed") {
    return (
      <div className="relative z-50 flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="relative mx-auto mb-4 h-48 w-48 overflow-hidden rounded-full border-4 border-background shadow-md">
            {event?.coverImage ? (
              <Image
                src={event.coverImage}
                alt={`${event?.name} Photo`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 6rem, 8rem"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold">{event?.name} Has Ended</h1>

          <p className="mt-2 text-muted-foreground">
            This event took place on{" "}
            {event?.date
              ? format(new Date(event.date), "MMMM d, yyyy")
              : "a recent date"}
            .
          </p>

          <p className="mt-4 text-muted-foreground">
            The live gallery is no longer active, but you can still view and
            download all photos from the event.
          </p>

          <Button onClick={goToPhotosPage} className="mt-6 gap-2" size="lg">
            <Download className="h-4 w-4" />
            View & Download Photos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="container mx-auto flex-1 overflow-hidden">
        <PhotoGrid eventId={eventId} />
      </div>
    </div>
  );
}
