import { Button } from "@/components/ui/button";
import { CalendarDays, ImagePlus, Settings } from "lucide-react";

export function NavigationTabs() {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4">
      <div className="mx-auto flex max-w-md justify-around">
        <Button variant="ghost" className="flex-1">
          <div className="flex flex-col items-center">
            <CalendarDays className="h-4 w-4" />
            <span className="mt-1 text-xs">Events</span>
          </div>
        </Button>
        <Button variant="ghost" className="flex-1">
          <div className="flex flex-col items-center">
            <ImagePlus className="h-4 w-4" />
            <span className="mt-1 text-xs">Photos</span>
          </div>
        </Button>
        <Button variant="ghost" className="flex-1">
          <div className="flex flex-col items-center">
            <Settings className="h-4 w-4" />
            <span className="mt-1 text-xs">Settings</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
