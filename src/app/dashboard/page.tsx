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

export default function DashboardPage() {
  const [activeEvent, setActiveEvent] = useState<string | null>(null);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Top App Bar */}
        <AppBar />

        {/* Main Content */}
        <div className="container mx-auto max-w-md space-y-4 p-4">
          {/* Create Event Button */}
          <Button className="w-full" size="lg">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Event
          </Button>

          {/* Events Tabs */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active Events</TabsTrigger>
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
    </ProtectedRoute>
  );
}
