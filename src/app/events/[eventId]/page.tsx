"use client";

import PhotoUploader from "@/components/events/photo-uploader";
import { useParams } from "next/navigation";

export default function EventPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  return (
    <div className="mx-auto flex h-[calc(100dvh-80px)] w-full">
      <div className="relative z-20 w-full">
        <PhotoUploader eventId={eventId} />
      </div>
    </div>
  );
}
