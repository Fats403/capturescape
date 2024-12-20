"use client";

import { PhotoGrid } from "@/components/events/photo-grid";
import { useParams } from "next/navigation";

export default function GalleryPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  return (
    <div className="flex flex-col">
      <div className="container mx-auto flex-1 overflow-hidden">
        <PhotoGrid eventId={eventId} />
      </div>
    </div>
  );
}
