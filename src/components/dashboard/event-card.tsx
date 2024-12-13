import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlus, Users } from "lucide-react";

export function EventCard() {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-0">
        <div className="absolute inset-0 z-10 bg-black/20" />
        <div className="relative aspect-[2/1] w-full">
          <Image
            src="https://placehold.co/400x400/png"
            alt="Event cover"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
        </div>
        <div className="relative z-20 space-y-4 p-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Wedding Photos</h3>
            <p className="text-sm text-foreground/70">
              Dec 24, 2024 • 128 photos
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1">
              <ImagePlus className="mr-2 h-4 w-4" />
              View Photos
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Users className="mr-2 h-4 w-4" />
              Participants
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
