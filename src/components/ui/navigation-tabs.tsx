"use client";

import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ImagePlus,
  Settings,
  Users,
  Image,
  Info,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  matchPattern?: RegExp;
}

const dashboardNavigationItems: NavItem[] = [
  {
    icon: CalendarDays,
    label: "Events",
    href: "/dashboard",
    matchPattern: /^\/dashboard$/,
  },
  {
    icon: ImagePlus,
    label: "Photos",
    href: "/dashboard/photos",
    matchPattern: /^\/dashboard\/photos/,
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/dashboard/settings",
    matchPattern: /^\/dashboard\/settings/,
  },
];

const eventNavigationItems: NavItem[] = [
  {
    icon: Info,
    label: "Details",
    href: "/events/{id}",
    matchPattern: /^\/events\/[^/]+$/,
  },
  {
    icon: Image,
    label: "Gallery",
    href: "/events/{id}/gallery",
    matchPattern: /^\/events\/[^/]+\/gallery/,
  },
  {
    icon: Users,
    label: "Guests",
    href: "/events/{id}/guests",
    matchPattern: /^\/events\/[^/]+\/guests/,
  },
];

interface NavigationTabsProps {
  type?: "dashboard" | "event";
  eventId?: string;
}

export function NavigationTabs({
  type = "dashboard",
  eventId,
}: NavigationTabsProps) {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.matchPattern) {
      return item.matchPattern.test(pathname);
    }
    return pathname.startsWith(item.href);
  };

  const navigationItems =
    type === "dashboard"
      ? dashboardNavigationItems
      : eventNavigationItems.map((item) => ({
          ...item,
          href: item.href.replace("{id}", eventId ?? ""),
        }));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/90 p-2 backdrop-blur-sm">
      <div className="mx-auto flex max-w-md justify-around space-x-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.href}
              variant={isActive(item) ? "default" : "ghost"}
              className="h-16 flex-1 hover:py-0"
              asChild
            >
              <Link href={item.href}>
                <div className="flex flex-col items-center">
                  <Icon className="h-4 w-4" />
                  <span className="mt-1 text-xs">{item.label}</span>
                </div>
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
