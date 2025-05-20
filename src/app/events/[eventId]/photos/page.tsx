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
import { motion, AnimatePresence } from "framer-motion";

// Define the navigation directions more clearly
type Direction = "next" | "prev";

// Use a more explicit naming to avoid confusion
type NavigateDirection = "next" | "prev";

export default function EventPhotosPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const eventId = params.eventId as string;

  // Read photo ID from URL query parameter
  const photoIdFromUrl = searchParams.get("id");

  const [isDownloading, setIsDownloading] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  // First, add a ref to track if we've shown the hint
  const shownSwipeHintRef = useRef(false);

  // Track only the essential state
  const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

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

  // Update when selectedPhoto changes
  useEffect(() => {
    setCurrentPhoto(selectedPhoto);
  }, [selectedPhoto]);

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

  // For all photos download
  const handleDownloadAll = async () => {
    if (!photos || photos.length === 0 || !event) return;

    setIsDownloading(true);
    try {
      // Check if event is completed
      if (event.status !== "completed") {
        toast({
          title: "Download not available",
          description:
            "Photos can only be downloaded after the event is completed.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Preparing download",
        description: `Getting all ${photos.length} photos...`,
      });

      // Request the pre-generated zip file
      const response = await fetch(`/api/download-photos?eventId=${eventId}`);

      if (!response.ok) {
        toast({
          title: "Download not available",
          description:
            "Photos can only be downloaded after the event is completed.",
          variant: "destructive",
        });
        return;
      }

      // Get the zip as a blob
      const blob = await response.blob();

      // Use saveAs to download it
      saveAs(blob, `${event.name ?? "event"}-photos.zip`);

      toast({
        title: "Download complete",
        description: `All photos have been downloaded.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to download photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Very simple navigation functions
  const goNext = () => {
    if (!photos || !currentPhoto) return;

    const currentIndex = photos.findIndex((p) => p.id === currentPhoto.id);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % photos.length;
    const nextPhoto = photos[nextIndex];

    // Always move left when going next
    setDirection("left");
    setCurrentPhoto(nextPhoto!);
    openPhoto(nextPhoto!);
  };

  const goPrev = () => {
    if (!photos || !currentPhoto) return;

    const currentIndex = photos.findIndex((p) => p.id === currentPhoto.id);
    if (currentIndex === -1) return;

    const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
    const prevPhoto = photos[prevIndex];

    // Always move right when going prev
    setDirection("right");
    setCurrentPhoto(prevPhoto!);
    openPhoto(prevPhoto!);
  };

  // Update swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: goNext,
    onSwipedRight: goPrev,
    preventScrollOnSwipe: true,
    trackMouse: false,
    delta: 10,
  });

  // Update keyboard navigation
  useEffect(() => {
    if (!currentPhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        goNext();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "Escape") {
        closePhoto();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPhoto, closePhoto]);

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
          <div className="max-w-sm">
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadAll}
              disabled={isDownloading}
              className="flex h-10 items-center justify-center gap-1.5"
            >
              {isDownloading ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1 h-4 w-4" />
              )}
              <span className="text-sm">Download All</span>
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
        open={currentPhoto !== null}
        onOpenChange={(open) => {
          if (!open) {
            closePhoto();
            setCurrentPhoto(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl overflow-hidden border-none bg-black/90 p-0 sm:max-w-[90vw]">
          <div className="relative flex h-[90vh] w-full flex-col">
            {/* Top Bar */}
            <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4">
              <DialogTitle className="text-white">{event?.name}</DialogTitle>
              <div className="flex gap-2">
                {isOrganizer && currentPhoto && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                    onClick={() => setPhotoToDelete(currentPhoto)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                  onClick={() =>
                    currentPhoto && void handleDownloadSingle(currentPhoto)
                  }
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                  onClick={() => currentPhoto && sharePhoto(currentPhoto)}
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

            {/* Main Image with proper navigation */}
            <div className="flex h-full items-center justify-center overflow-hidden">
              <div className="relative h-full max-h-[calc(90vh-120px)] w-full">
                <div
                  {...swipeHandlers}
                  className="absolute inset-0 overflow-hidden"
                >
                  {currentPhoto && (
                    <>
                      <motion.div
                        key={currentPhoto.id}
                        initial={
                          direction
                            ? {
                                x: direction === "left" ? "100%" : "-100%",
                              }
                            : { opacity: 1 }
                        }
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="absolute inset-0 flex items-center justify-center p-6"
                      >
                        <Image
                          src={currentPhoto.urls.medium}
                          alt={`Photo`}
                          className="max-h-full max-w-full rounded-md object-contain"
                          width={1200}
                          height={900}
                          unoptimized
                          priority
                        />
                      </motion.div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white">
                  {currentPhoto && photos && (
                    <>
                      {photos.findIndex((p) => p.id === currentPhoto.id) + 1} of{" "}
                      {photos.length}
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={goPrev}
                  >
                    Previous
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={goNext}
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
