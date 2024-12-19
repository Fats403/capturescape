"use client";

import PhotoUploader from "@/components/events/photo-uploader";
import { useParams } from "next/navigation";

export default function EventPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  return (
    <div className="z-10 flex min-h-screen flex-col bg-background">
      <main className="z-20 flex flex-1 items-center justify-center overflow-auto pb-[100px] pt-4">
        <PhotoUploader eventId={eventId} className="mx-auto w-full max-w-md" />
      </main>
    </div>
  );
}
