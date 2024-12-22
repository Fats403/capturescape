import { type Metadata } from "next";
import { api } from "@/trpc/server";
import JoinEventPage from "./client";
import { TRPCError } from "@trpc/server";

interface PageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const event = await api.event.getById({ id: resolvedParams.eventId });

    if (!event) {
      return {
        title: "Join Event | CaptureScape",
        description: "Join the event on CaptureScape",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    return {
      title: `Join ${event.name} | CaptureScape`,
      description: `You have been invited to join ${event.name}. Click here to accept the invitation.`,
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title: `Join ${event.name} | CaptureScape`,
        description: `You have been invited to join ${event.name}`,
        type: "website",
        images: event.coverImage
          ? [
              {
                url: event.coverImage,
                width: 1200,
                height: 630,
                alt: event.name,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `Join ${event.name} | CaptureScape`,
        description: `You have been invited to join ${event.name}`,
        images: event.coverImage ? [event.coverImage] : undefined,
      },
    };
  } catch (error) {
    if (error instanceof TRPCError) {
      console.error("TRPC Error:", error.message);
    } else {
      console.error("Failed to fetch event:", error);
    }

    return {
      title: "Join Event",
      description: "Join the event on CaptureScape!",
    };
  }
}

export default function Page({ params }: PageProps) {
  return <JoinEventPage />;
}
