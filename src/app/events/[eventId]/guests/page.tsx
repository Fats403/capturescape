"use client";

import { ParticipantGrid } from "@/components/events/participant-grid";
import { useParams } from "next/navigation";

export default function GuestsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <ParticipantGrid eventId={eventId} />
    </div>
  );
}
