"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";
import {
  CalendarDays,
  Users,
  Camera,
  Share2,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

export default function EventInfoPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const eventId = params.eventId as string;

  // Fetch the event data
  const { data: event, isLoading } = api.event.getById.useQuery(
    { id: eventId },
    { enabled: Boolean(eventId) },
  );

  // Return to gallery
  const handleBackToGallery = () => {
    router.push(`/events/${eventId}/gallery`);
  };

  // Go to dashboard (for organizers)
  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  // Share event
  const handleShareEvent = async () => {
    try {
      const shareUrl = `${window.location.origin}/events/${eventId}/join`;
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share this link with your friends",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading event info...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <p className="mt-2 text-muted-foreground">
          The event you&apos;re looking for doesn&apos;t exist or has been
          deleted.
        </p>
      </div>
    );
  }

  const isOrganizer = user?.uid === event.organizerId;

  return (
    <div className="mx-auto max-w-lg pb-20">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToGallery}
          className="mr-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Gallery
        </Button>

        {isOrganizer && (
          <Button variant="outline" size="sm" onClick={handleGoToDashboard}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Manage in Dashboard
          </Button>
        )}
      </div>

      <div className="mx-auto max-w-lg">
        <Card className="overflow-hidden">
          <div className="relative h-96 w-full">
            <Image
              src={event.coverImage}
              alt={event.name}
              fill
              className="object-cover"
            />
          </div>

          <CardHeader>
            <CardTitle className="text-2xl">{event.name}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Event details */}
            <div className="space-y-4">
              {event.description && (
                <p className="text-muted-foreground">{event.description}</p>
              )}

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {event.photoCount}{" "}
                    {event.photoCount === 1 ? "photo" : "photos"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {event.participantCount}{" "}
                    {event.participantCount === 1 ? "guest" : "guests"}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="font-medium">Actions</h3>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={handleShareEvent}
                  className="w-full justify-start"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Event
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
