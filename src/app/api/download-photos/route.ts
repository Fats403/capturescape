import { db, adminStorage } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { Event } from "@/lib/types/event";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json(
      { error: "Event ID is required" },
      { status: 400 },
    );
  }

  try {
    // Get event details
    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = eventDoc.data() as Event;

    // Check if we have a pre-generated archive
    const bucket = adminStorage.bucket();
    const archivePath = `events/${eventId}/archive/photos.zip`;
    const archiveFile = bucket.file(archivePath);
    const [archiveExists] = await archiveFile.exists();

    if (!archiveExists) {
      return NextResponse.json(
        { error: "Photos archive not yet available for this event" },
        { status: 404 },
      );
    }

    // Fetch the archive
    const [archiveBuffer] = await archiveFile.download();

    // Return the zip file directly
    return new NextResponse(archiveBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${event.name ?? "event"}-photos.zip"`,
      },
    });
  } catch (error) {
    console.error("Error fetching zip file:", error);
    return NextResponse.json(
      { error: "Failed to retrieve photos archive" },
      { status: 500 },
    );
  }
}
