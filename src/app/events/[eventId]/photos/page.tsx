"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2, Download, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Photo } from "@/lib/types/event";
import Image from "next/image";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function EventPhotosPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const eventId = params.eventId as string;
  const downloadAll = searchParams.get("download") === "all";

  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch event details
  const { data: event, isLoading: isEventLoading } = api.event.getById.useQuery(
    { id: eventId },
    { enabled: Boolean(eventId) },
  );

  // Fetch all photos for this event
  const { data: photos, isLoading: isPhotosLoading } =
    api.event.getEventPhotos.useQuery(
      { eventId },
      { enabled: Boolean(eventId) },
    );

  // Handle automatic download when URL contains ?download=all
  useEffect(() => {
    if (downloadAll && photos && photos.length > 0 && !isDownloading) {
      handleDownloadAll();
    }
  }, [downloadAll, photos, isDownloading]);

  // Toggle photo selection
  const togglePhotoSelection = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  // Select all photos
  const selectAllPhotos = () => {
    if (!photos) return;

    if (selectedPhotos.size === photos.length) {
      // Deselect all if all are already selected
      setSelectedPhotos(new Set());
    } else {
      // Select all
      setSelectedPhotos(new Set(photos.map((photo) => photo.id)));
    }
  };

  // Download a single photo
  const handleDownloadSingle = async (photo: Photo) => {
    try {
      const response = await fetch(photo.urls.original);
      const blob = await response.blob();
      saveAs(blob, `photo-${photo.id}.jpg`);

      toast({
        title: "Download complete",
        description: "Your photo has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Download selected photos as a ZIP
  const handleDownloadSelected = async () => {
    if (selectedPhotos.size === 0) {
      toast({
        title: "No photos selected",
        description: "Please select at least one photo to download.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const selectedPhotosList =
        photos?.filter((photo) => selectedPhotos.has(photo.id)) || [];

      toast({
        title: "Preparing download",
        description: `Preparing ${selectedPhotosList.length} photos for download...`,
      });

      // Download each photo and add to ZIP
      const promises = selectedPhotosList.map(async (photo, index) => {
        const response = await fetch(photo.urls.original);
        const blob = await response.blob();
        zip.file(`photo-${index + 1}.jpg`, blob);
      });

      await Promise.all(promises);

      // Generate and save ZIP file
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${event?.name || "event"}-photos.zip`);

      toast({
        title: "Download complete",
        description: `${selectedPhotosList.length} photos have been downloaded.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to download photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Download all photos
  const handleDownloadAll = async () => {
    if (!photos || photos.length === 0) return;

    setIsDownloading(true);
    try {
      const zip = new JSZip();

      toast({
        title: "Preparing download",
        description: `Preparing ${photos.length} photos for download...`,
      });

      // Download each photo and add to ZIP
      const promises = photos.map(async (photo, index) => {
        const response = await fetch(photo.urls.original);
        const blob = await response.blob();
        zip.file(`photo-${index + 1}.jpg`, blob);
      });

      await Promise.all(promises);

      // Generate and save ZIP file
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${event?.name || "event"}-all-photos.zip`);

      toast({
        title: "Download complete",
        description: `${photos.length} photos have been downloaded.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to download photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isEventLoading || isPhotosLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <p className="mt-2 text-muted-foreground">
          The event you're looking for doesn't exist or has been deleted.
        </p>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">No photos yet</h1>
        <p className="mt-2 text-muted-foreground">
          There are no photos in this event yet.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{event.name} Photos</h1>
          <p className="text-muted-foreground">
            {photos.length} photo{photos.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={selectAllPhotos}
            className="flex items-center gap-2"
          >
            {selectedPhotos.size === photos.length ? (
              <>
                <X className="h-4 w-4" />
                Deselect All
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Select All
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleDownloadSelected}
            disabled={selectedPhotos.size === 0 || isDownloading}
            className="flex items-center gap-2"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Selected ({selectedPhotos.size})
          </Button>

          <Button
            onClick={handleDownloadAll}
            disabled={isDownloading}
            className="flex items-center gap-2"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download All
          </Button>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square">
            <div className="absolute left-2 top-2 z-10">
              <Checkbox
                checked={selectedPhotos.has(photo.id)}
                onCheckedChange={() => togglePhotoSelection(photo.id)}
                className="h-5 w-5 rounded-sm border-2 border-white bg-black/20 ring-offset-0 focus:ring-0 data-[state=checked]:bg-primary"
              />
            </div>

            <Image
              src={photo.urls.original}
              alt={`Photo ${photo.id}`}
              fill
              className="cursor-pointer rounded-md object-cover transition-all hover:brightness-90"
              onClick={() => setSelectedPhoto(photo)}
            />

            <div className="absolute bottom-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => handleDownloadSingle(photo)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Viewer Modal */}
      <Dialog
        open={selectedPhoto !== null}
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
      >
        <DialogContent className="max-w-5xl sm:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Photo Preview</DialogTitle>
          </DialogHeader>

          {selectedPhoto && (
            <div className="flex flex-col items-center justify-center">
              <div className="relative max-h-[70vh] w-full">
                <Image
                  src={selectedPhoto.urls.original}
                  alt={`Photo ${selectedPhoto.id}`}
                  layout="responsive"
                  width={800}
                  height={600}
                  objectFit="contain"
                />
              </div>

              <DialogFooter className="mt-4 sm:justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedPhotos.has(selectedPhoto.id)}
                    onCheckedChange={() =>
                      togglePhotoSelection(selectedPhoto.id)
                    }
                    id="select-photo"
                  />
                  <label htmlFor="select-photo">Select photo</label>
                </div>

                <Button
                  onClick={() => handleDownloadSingle(selectedPhoto)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
