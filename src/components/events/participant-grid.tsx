import { type EventParticipant } from "@/lib/types/event";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { api } from "@/trpc/react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ParticipantGridProps {
  eventId: string;
}

export function ParticipantGrid({ eventId }: ParticipantGridProps) {
  const { data: participants, isLoading } = api.event.getParticipants.useQuery({
    eventId,
  });

  if (isLoading) {
    return <ParticipantGridSkeleton />;
  }

  if (!participants?.length) {
    return (
      <div className="flex h-[calc(100dvh-80px)] flex-col items-center justify-center space-y-1 text-center">
        <Users className="mb-2 h-12 w-12 text-muted-foreground" />
        <p className="text-xl font-medium text-muted-foreground">
          No other guests yet
        </p>
        <p className="text-sm text-muted-foreground">Send out some invites!</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-148px)] flex-col">
      <div className="flex-none pb-8">
        <h1 className="text-2xl font-bold">Event Guests</h1>
        <p className="text-muted-foreground">
          {participants.length}{" "}
          {participants.length === 1 ? "person" : "people"} in this event
        </p>
      </div>
      <ScrollArea className="">
        <div className="grid grid-cols-2 gap-4 px-2 md:grid-cols-3">
          {participants.map((participant) => (
            <ParticipantCard
              key={participant.userId}
              participant={participant}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface ParticipantCardProps {
  participant: EventParticipant;
}

function ParticipantCard({ participant }: ParticipantCardProps) {
  return (
    <div className="flex flex-col items-center space-y-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-accent/50">
      <Avatar className="h-16 w-16">
        <AvatarImage src={participant?.photoURL ?? undefined} />
        <AvatarFallback>
          {participant?.displayName
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() ?? "?"}
        </AvatarFallback>
      </Avatar>
      <div className="text-center">
        <p className="font-medium">{participant.displayName ?? "Anonymous"}</p>
        <p className="text-sm text-muted-foreground">
          {participant.photoCount}{" "}
          {participant.photoCount === 1 ? "photo" : "photos"}
        </p>
      </div>
    </div>
  );
}

function ParticipantGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center space-y-3 rounded-lg border bg-card p-4"
        >
          <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
