"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarPlus, CalendarX, PlusCircle } from "lucide-react";
import { EventCard } from "@/components/dashboard/event-card";
import { CreateEventDialog } from "@/components/dashboard/create-event-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const { data: events, isLoading } = api.event.getAll.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const handleShare = async (eventId: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/events/${eventId}/join`,
      );
      toast({
        title: "Link copied!",
        description: "Share this link with your guests",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <div className="z-10 flex h-full flex-col bg-background">
      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <main className="flex-1 overflow-auto py-4">
        <div className="container relative mx-auto max-w-md space-y-4 px-4">
          <Button
            className="w-full"
            size="lg"
            onClick={() => setShowCreateDialog(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Event
          </Button>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Upcoming Events</TabsTrigger>
              <TabsTrigger value="past">Past Events</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4 space-y-4">
              {isLoading ? (
                <EventCardSkeleton />
              ) : events?.upcoming.length === 0 ? (
                <EmptyState
                  title="No upcoming events"
                  description="Start by creating an event to collect and share photos with your guests."
                  action={() => setShowCreateDialog(true)}
                  actionText="Create Your First Event"
                  icon={CalendarPlus}
                />
              ) : (
                events?.upcoming.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onShare={() => handleShare(event.id)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-4 space-y-4">
              {isLoading ? (
                <EventCardSkeleton />
              ) : events?.past.length === 0 ? (
                <EmptyState
                  title="No past events"
                  description="Your completed events will appear here after their date has passed."
                  icon={CalendarX}
                />
              ) : (
                events?.past.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onShare={() => handleShare(event.id)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Skeleton className="aspect-[2/1] w-full" />
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-10" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
