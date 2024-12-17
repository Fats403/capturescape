"use client";

import PhotoUploader from "@/components/events/photo-uploader";

export default function EventPage() {
  const handlePhoto = (imageData: string) => {
    // Handle the captured photo
    console.log("Photo captured:", imageData);
  };
  return (
    <div className="z-10 flex min-h-screen flex-col bg-background">
      <main className="z-20 flex-1 overflow-auto pb-[100px] pt-4">
        <PhotoUploader
          onCapture={handlePhoto}
          className="mx-auto w-full max-w-md"
        />
      </main>
    </div>
  );
}
