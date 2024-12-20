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

  return (
    <div>
      {children}
      {!isJoinPage && <NavigationTabs type="event" eventId={eventId} />}
    </div>
  );
}
