"use client";

import { NavigationTabs } from "@/components/ui/navigation-tabs";
import { usePathname } from "next/navigation";

interface ClientLayoutProps {
  children: React.ReactNode;
  eventId: string;
}

export function ClientLayout({ children, eventId }: ClientLayoutProps) {
  const pathname = usePathname();
  const isJoinPage = pathname?.includes("/join");
  const isPhotosPage = pathname?.includes("/photos");

  return (
    <div>
      {children}
      {!isJoinPage && !isPhotosPage && (
        <NavigationTabs type="event" eventId={eventId} />
      )}
    </div>
  );
}
