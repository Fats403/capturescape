import Image from "next/image";
import { formatDistance } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlus, Users, Share2, Mail } from "lucide-react";
import { type Event } from "@/lib/types/event";
import Link from "next/link";

interface EventCardProps {
  event: Event;
  onShare?: () => void;
  onSendPhotos?: (eventId: string) => void;
}

export function EventCard({ event, onShare, onSendPhotos }: EventCardProps) {
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
              <p className="text-sm text-white/60">
                {formatDistance(new Date(event.date), Date.now(), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" asChild>
                <Link href={`/events/${event.id}`}>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  View Gallery
                </Link>
              </Button>
              <Button size="sm" variant="secondary" className="flex-1" asChild>
                <Link href={`/events/${event.id}`}>
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
                className="flex-1"
                onClick={() => onSendPhotos?.(event.id)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Photos
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="px-3"
                onClick={onShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
