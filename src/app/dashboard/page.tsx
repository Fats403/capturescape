"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, PlusCircle } from "lucide-react";
import { EventCard } from "@/components/dashboard/event-card";
import { AppBar } from "@/components/dashboard/app-bar";
import { NavigationTabs } from "@/components/dashboard/navigation-tabs";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CreateEventDialog } from "@/components/events/create-event-dialog";

export default function DashboardPage() {
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div
          className="absolute inset-0 z-0 flex"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='16' viewBox='0 0 12 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 .99C4 .445 4.444 0 5 0c.552 0 1 .45 1 .99v4.02C6 5.555 5.556 6 5 6c-.552 0-1-.45-1-.99V.99zm6 8c0-.546.444-.99 1-.99.552 0 1 .45 1 .99v4.02c0 .546-.444.99-1 .99-.552 0-1-.45-1-.99V8.99z' fill='%230c2c47' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* Top App Bar */}
        <AppBar />

        {/* Main Content */}
        <div className="container relative z-10 mx-auto max-w-md space-y-4 p-4">
          {/* Create Event Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={() => setShowCreateDialog(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Event
          </Button>

          {/* Events Tabs */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Upcoming Events</TabsTrigger>
              <TabsTrigger value="past">Past Events</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4 space-y-4">
              {/* Active Event Card */}
              <EventCard />
            </TabsContent>

            <TabsContent value="past">
              {/* Past Events List */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Birthday Party</h3>
                        <p className="text-sm text-muted-foreground">
                          Nov 15, 2024 • 64 photos
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <CalendarDays className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <NavigationTabs />
      </div>
      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </ProtectedRoute>
  );
}
