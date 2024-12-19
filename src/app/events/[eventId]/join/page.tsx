"use client";

import { JoinEventDialog } from "@/components/events/join-event-dialog";
import { useParams } from "next/navigation";

export default function JoinEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  return (
    <div className="z-10 flex min-h-screen flex-col bg-background">
      <main className="z-20 flex flex-1 items-center justify-center">
        <JoinEventDialog
          eventId={eventId}
          open={true}
          onOpenChange={() => console.log("cant close")} // Dialog cannot be closed on this page
        />
      </main>
    </div>
  );
}
