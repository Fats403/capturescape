import { type Metadata } from "next";
import { api } from "@/trpc/server";
import JoinEventPage from "./client";
import { TRPCError } from "@trpc/server";

interface PageProps {
  params: {
    eventId: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const event = await api.event.getById({ id: params.eventId });

    if (!event) {
      return {
        title: "Join Event",
        description: "Join the event",
      };
    }

    return {
      title: `Join ${event.name}`,
      description: `You have been invited to join ${event.name}. Click here to accept the invitation.`,
      openGraph: event.coverImage
        ? {
            images: [
              {
                url: event.coverImage,
                width: 1200,
                height: 630,
                alt: event.name,
              },
            ],
          }
        : undefined,
    };
  } catch (error) {
    if (error instanceof TRPCError) {
      console.error("TRPC Error:", error.message);
    } else {
      console.error("Failed to fetch event:", error);
    }

    return {
      title: "Join Event",
      description: "Join the event",
    };
  }
}

export default function Page({ params }: PageProps) {
  return <JoinEventPage />;
}
