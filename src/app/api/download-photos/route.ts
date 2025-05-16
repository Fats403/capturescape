import { db, adminStorage } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { Event } from "@/lib/types/event";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");
  const photoIdsParam = request.nextUrl.searchParams.get("photoIds");

  if (!eventId) {
    return NextResponse.json(
      { error: "Event ID is required" },
      { status: 400 },
    );
  }

  try {
    // Parse photoIds if provided
    const photoIds = photoIdsParam ? photoIdsParam.split(",") : null;

    // Get event details for naming
    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get photos based on criteria
    const photosQuery = db
      .collection("events")
      .doc(eventId)
      .collection("photos");
    let photos = [];

    if (photoIds && photoIds.length > 0) {
      // Get specific photos
      photos = await Promise.all(
        photoIds.map(async (id) => {
          const doc = await photosQuery.doc(id).get();
          return doc.exists ? { id: doc.id, ...doc.data() } : null;
        }),
      );
      photos = photos.filter(Boolean);
    } else {
      // Get all photos
      const snapshot = await photosQuery.get();
      photos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    if (photos.length === 0) {
      return NextResponse.json({ error: "No photos found" }, { status: 404 });
    }

    // Create a zip file
    const zip = new JSZip();

    // Download and add each photo
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      if (!photo) continue;
      try {
        const filePath = `events/${eventId}/photos/${photo.id}/original.jpg`;
        const file = adminStorage.bucket().file(filePath);

        // Download the file
        const [buffer] = await file.download();

        // Add to zip
        zip.file(`photo-${i + 1}.jpg`, buffer);
      } catch (error) {
        console.warn(`Error adding photo ${photo.id} to zip:`, error);
        // Continue with other photos
      }
    }

    // Generate the zip content
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    const event = eventDoc.data() as Event;
    const eventName = event.name ?? "event";

    // Return the zip file directly as a download
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${eventName}-photos.zip"`,
      },
    });
  } catch (error) {
    console.error("Error creating zip file:", error);
    return NextResponse.json(
      { error: "Failed to create zip file" },
      { status: 500 },
    );
  }
}
