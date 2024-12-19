"use client";

import { PhotoGrid } from "@/components/events/photo-grid";
import { useParams } from "next/navigation";
import { NavigationTabs } from "@/components/ui/navigation-tabs";

export default function GalleryPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <div className="container mx-auto flex-1 overflow-hidden pb-20">
        <PhotoGrid eventId={eventId} />
      </div>
      <NavigationTabs type="event" eventId={eventId} />
    </div>
  );
}
