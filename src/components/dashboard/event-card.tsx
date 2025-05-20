import Image from "next/image";
import { formatDistance, format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlus, Users, Share2, Mail, Calendar } from "lucide-react";
import { type Event } from "@/lib/types/event";
import Link from "next/link";

interface EventCardProps {
  event: Event;
  onShare?: () => void;
}

export function EventCard({ event, onShare }: EventCardProps) {
  // Function to render the event time status
  const renderEventTimeStatus = () => {
    const now = Date.now();
    const startDate = new Date(event.date);
    // Access endDate even though it's not in the type definition
    // The server code shows that endDate is actually saved in the database
    // @ts-ignore - endDate exists in the database but not in the type
    const endDate = event.endDate ? new Date(event.endDate) : null;

    // If the event is currently active (now is between start and end dates)
    if (startDate.getTime() <= now && endDate && endDate.getTime() >= now) {
      return (
        <p className="text-sm text-green-400">
          Active now • Ends {format(endDate, "h:mm a")}
        </p>
      );
    }

    // If the event has ended (now is after the end date)
    if (endDate && endDate.getTime() < now) {
      return (
        <p className="text-sm text-white/60">
          {formatDistance(endDate, now, { addSuffix: true })}
        </p>
      );
    }

    // Default: If the event is in the future (now is before the start date)
    return (
      <p className="text-sm text-white/60">
        {formatDistance(startDate, now, { addSuffix: true })}
      </p>
    );
  };

  return (
    <Card className="group relative aspect-square overflow-hidden">
      <CardContent className="h-full p-0">
        <div className="absolute inset-0">
          <Image
            src={event.coverImage}
            alt={event.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
        </div>
        <div className="absolute inset-0 z-20 flex flex-col justify-end space-y-4">
          <div className="space-y-4 rounded-md bg-black/70 p-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{event.name}</h3>
              {renderEventTimeStatus()}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" asChild>
                <Link href={`/events/${event.id}`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  View Event
                </Link>
              </Button>
              <Button size="sm" variant="secondary" className="flex-1" asChild>
                <Link href={`/events/${event.id}/guests`}>
                  <Users className="mr-2 h-4 w-4" />
                  {event.participantCount} Guest
                  {event.participantCount !== 1 && "s"}
                </Link>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full px-3"
                onClick={onShare}
              >
                <Share2 className="h-4 w-4" />
                Copy Share Link
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
