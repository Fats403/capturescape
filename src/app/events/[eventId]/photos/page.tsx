"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import {
  Loader2,
  Download,
  X,
  Heart,
  Share2,
  Trash2,
  Camera,
  CalendarIcon,
  InfoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Photo } from "@/lib/types/event";
import { useAuth } from "@/providers/auth-provider";
import Image from "next/image";
import { saveAs } from "file-saver";
import { formatRelative } from "date-fns";
import { useSwipeable } from "react-swipeable";

export default function EventPhotosPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const eventId = params.eventId as string;

  // Read photo ID from URL query parameter
  const photoIdFromUrl = searchParams.get("id");

  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
  const [downloadType, setDownloadType] = useState<"all" | "selected" | null>(
    null,
  );
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  // First, add a ref to track if we've shown the hint
  const shownSwipeHintRef = useRef(false);

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

  // Find the selected photo from the URL parameter
  const selectedPhoto =
    photoIdFromUrl && photos
      ? (photos.find((photo) => photo.id === photoIdFromUrl) ?? null)
      : null;

  // Function to open a photo (updates URL)
  const openPhoto = (photo: Photo) => {
    const url = new URL(window.location.href);
    url.searchParams.set("id", photo.id);
    router.replace(url.pathname + url.search, { scroll: false });
  };

  // Function to close the photo modal (updates URL)
  const closePhoto = () => {
    router.replace(`/events/${eventId}/photos`, { scroll: false });
  };

  // Share photo function
  const sharePhoto = (photo: Photo) => {
    const url = new URL(window.location.origin);
    url.pathname = `/events/${eventId}/photos`;
    url.searchParams.set("id", photo.id);

    navigator.clipboard
      .writeText(url.toString())
      .then(() => {
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard",
          duration: 3000,
        });
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          description: "Could not copy link to clipboard",
          variant: "destructive",
          duration: 3000,
        });
      });
  };

  // Check if current user is the organizer
  const isOrganizer = user?.uid === event?.organizerId;

  const photosArray = photos ?? [];

  // Delete photo mutation
  const deletePhotoMutation = api.photo.deletePhoto.useMutation({
    onSuccess: () => {
      toast({
        title: "Photo deleted",
        description: "The photo has been permanently deleted",
        variant: "success",
      });

      if (photoToDelete) {
        const newSelected = new Set(selectedPhotos);
        newSelected.delete(photoToDelete.id);

        setSelectedPhotos(newSelected);
      }

      setPhotoToDelete(null);
      // Invalidate queries to refetch photos
      void utils.event.getEventPhotos.invalidate({ eventId });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete photo",
        variant: "destructive",
      });
    },
  });

  const utils = api.useUtils();

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

  // Handle delete photo
  const handleDeletePhoto = async () => {
    if (!photoToDelete || !user?.uid) return;

    deletePhotoMutation.mutate({
      photoId: photoToDelete.id,
      eventId,
    });
  };

  // For single photo download
  const handleDownloadSingle = async (photo: Photo) => {
    try {
      toast({
        title: "Downloading photo...",
        description: "Please wait while we prepare your download.",
      });

      // Fetch the photo through our API route
      const response = await fetch(`/api/photo/${photo.id}?eventId=${eventId}`);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get the photo as a blob
      const blob = await response.blob();

      // Use saveAs to download it
      saveAs(blob, `photo-${photo.id}.jpg`);

      toast({
        title: "Download complete",
        description: "Your photo has been downloaded.",
        variant: "success",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to download the photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  // For selected photos download
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
    setDownloadType("selected");
    try {
      const photoIds = Array.from(selectedPhotos).join(",");

      toast({
        title: "Preparing download",
        description: `Downloading ${selectedPhotos.size} photos...`,
      });

      // Fetch the zip file
      const response = await fetch(
        `/api/download-photos?eventId=${eventId}&photoIds=${photoIds}`,
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get file name from Content-Disposition header if available
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${event?.name ?? "event"}-photos.zip`;

      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches?.[1]) {
          filename = matches[1];
        }
      }

      // Get the zip as a blob
      const blob = await response.blob();

      // Use saveAs to download it
      saveAs(blob, filename);

      toast({
        title: "Download complete",
        description: `Your photos have been downloaded.`,
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
      setDownloadType(null);
    }
  };

  // For all photos download
  const handleDownloadAll = async () => {
    if (!photos || photos.length === 0) return;

    setIsDownloading(true);
    setDownloadType("all");
    try {
      toast({
        title: "Preparing download",
        description: `Downloading all ${photos.length} photos...`,
      });

      // Fetch the zip file
      const response = await fetch(`/api/download-photos?eventId=${eventId}`);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get file name from Content-Disposition header if available
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${event?.name ?? "event"}-photos.zip`;

      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches?.[1]) {
          filename = matches[1];
        }
      }

      // Get the zip as a blob
      const blob = await response.blob();

      // Use saveAs to download it
      saveAs(blob, filename);

      toast({
        title: "Download complete",
        description: `All photos have been downloaded.`,
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
      setDownloadType(null);
    }
  };

  // Update the swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!photos || !selectedPhoto) return;
      const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
      const nextIndex = (currentIndex + 1) % photos.length;
      openPhoto(photos[nextIndex]!);
    },
    onSwipedRight: () => {
      if (!photos || !selectedPhoto) return;
      const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
      const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
      openPhoto(photos[prevIndex]!);
    },
    preventScrollOnSwipe: true, // Use this instead of preventDefaultTouchmoveEvent
    trackMouse: false,
    delta: 10,
  });

  // Update the hint effect to only show once
  useEffect(() => {
    if (selectedPhoto && !shownSwipeHintRef.current) {
      // Only show the hint on mobile devices
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setShowSwipeHint(true);
        // Hide after 3 seconds
        const timer = setTimeout(() => {
          setShowSwipeHint(false);
          shownSwipeHintRef.current = true; // Mark as shown
        }, 1500);
        return () => clearTimeout(timer);
      }
    } else if (!selectedPhoto) {
      setShowSwipeHint(false);
    }
  }, [selectedPhoto]);

  if (isEventLoading || isPhotosLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading photos...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <p className="mt-2 text-muted-foreground">
          The event you&apos;re looking for doesn&apos;t exist or has been
          deleted.
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
    <div className="container relative z-20 mx-auto px-4 py-8">
      {/* Redesigned header section */}
      <div className="mb-8">
        {/* Top section with event info and back button */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mt-2 text-3xl font-bold">{event.name} Photos</h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Camera className="h-4 w-4" />
                <span>
                  {photos.length} photo{photos.length !== 1 ? "s" : ""}
                </span>
              </div>

              {event.date && (
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {formatRelative(new Date(event.date), new Date())}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photo controls section with download buttons side-by-side */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadAll}
              disabled={isDownloading}
              className="flex h-10 items-center justify-center gap-1.5"
            >
              {isDownloading && downloadType === "all" ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1 h-4 w-4" />
              )}
              <span className="text-sm">Download All</span>
            </Button>

            <Button
              variant={selectedPhotos.size > 0 ? "default" : "outline"}
              size="sm"
              onClick={handleDownloadSelected}
              disabled={selectedPhotos.size === 0 || isDownloading}
              className="flex h-10 items-center justify-center gap-1.5"
            >
              {isDownloading && downloadType === "selected" ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1 h-4 w-4" />
              )}
              <span className="text-sm">
                {selectedPhotos.size > 0
                  ? `Selected (${selectedPhotos.size})`
                  : "Select to Download"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {photosArray.map((photo) => (
          <div
            key={photo.id}
            onClick={() => openPhoto(photo)}
            className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-md"
          >
            <div className="absolute left-2 top-2 z-10">
              <Checkbox
                checked={selectedPhotos.has(photo.id)}
                onCheckedChange={() => {
                  togglePhotoSelection(photo.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-5 w-5 rounded-sm border-2 border-white bg-black/20 ring-offset-0 focus:ring-0 data-[state=checked]:bg-primary"
              />
            </div>

            <Image
              src={photo.urls.thumbnail}
              alt={`Photo ${photo.id}`}
              className="h-full w-full cursor-pointer rounded-md object-cover transition-transform duration-300 ease-in-out hover:scale-[1.02] group-hover:brightness-90"
              width={500}
              height={500}
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="absolute bottom-2 right-2 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-white/30 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <InfoIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-white/30 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDownloadSingle(photo);
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {photo?.likes?.count > 0 && (
              <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Heart className="h-3 w-3 fill-white" />
                <span>{photo.likes.count}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Photo Viewer Modal */}
      <Dialog
        open={selectedPhoto !== null}
        onOpenChange={(open) => {
          if (!open) closePhoto();
        }}
      >
        <DialogContent className="max-w-5xl overflow-hidden border-none bg-black/90 p-0 sm:max-w-[90vw]">
          <div className="relative flex h-[90vh] w-full flex-col">
            {/* Top Bar */}
            <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4">
              <DialogTitle className="text-white">{event?.name}</DialogTitle>
              <div className="flex gap-2">
                {isOrganizer && selectedPhoto && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                    onClick={() => setPhotoToDelete(selectedPhoto)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                  onClick={() =>
                    selectedPhoto && void handleDownloadSingle(selectedPhoto)
                  }
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                  onClick={() => selectedPhoto && sharePhoto(selectedPhoto)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                  onClick={closePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Main Image with Swipe Support */}
            <div className="flex h-full items-center justify-center">
              {selectedPhoto && (
                <div className="flex h-full max-h-[calc(90vh-120px)] w-full items-center justify-center p-6">
                  <div
                    {...swipeHandlers}
                    className="flex h-full w-full items-center justify-center"
                  >
                    <Image
                      src={selectedPhoto.urls.medium}
                      alt={`Photo ${selectedPhoto.id}`}
                      className="max-h-full max-w-full rounded-md object-contain"
                      width={1200}
                      height={900}
                      unoptimized
                      priority
                    />

                    {/* Swipe hint overlay */}
                    {showSwipeHint && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 md:hidden">
                        <div className="px-6 py-4 text-center text-white">
                          <p>Swipe to navigate between photos</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white">
                  {selectedPhoto && photos && (
                    <>
                      {photos.findIndex((p) => p.id === selectedPhoto.id) + 1}{" "}
                      of {photos.length}
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => {
                      if (!photos || !selectedPhoto) return;
                      const currentIndex = photos.findIndex(
                        (p) => p.id === selectedPhoto.id,
                      );
                      const prevIndex =
                        (currentIndex - 1 + photos.length) % photos.length;
                      openPhoto(photos[prevIndex]!);
                    }}
                  >
                    Previous
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => {
                      if (!photos || !selectedPhoto) return;
                      const currentIndex = photos.findIndex(
                        (p) => p.id === selectedPhoto.id,
                      );
                      const nextIndex = (currentIndex + 1) % photos.length;
                      openPhoto(photos[nextIndex]!);
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={photoToDelete !== null}
        onOpenChange={(open) => !open && setPhotoToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Photo</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this photo? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhotoToDelete(null)}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeletePhoto}
            >
              {deletePhotoMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
