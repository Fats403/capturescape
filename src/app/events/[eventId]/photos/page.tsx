"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Upload,
  Plus,
  CheckCircle,
  AlertCircle,
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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Photo } from "@/lib/types/event";
import { useAuth } from "@/providers/auth-provider";
import { useImageUpload } from "@/hooks/use-image-upload";
import Image from "next/image";
import { saveAs } from "file-saver";
import { formatRelative } from "date-fns";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";

// Define the navigation directions more clearly
type Direction = "next" | "prev";

// Use a more explicit naming to avoid confusion
type NavigateDirection = "next" | "prev";

// Upload file interface
interface UploadFile {
  file: File;
  id: string;
  preview: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export default function EventPhotosPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const eventId = params.eventId as string;

  // Use your existing upload hook
  const {
    uploadEventPhoto,
    progress,
    isUploading: isSingleUploading,
  } = useImageUpload();

  // Read photo ID from URL query parameter
  const photoIdFromUrl = searchParams.get("id");

  const [isDownloading, setIsDownloading] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  // Upload-related state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [showArchiveButton, setShowArchiveButton] = useState(false);
  const [isRegeneratingArchive, setIsRegeneratingArchive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const utils = api.useUtils();

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

  // Archive regeneration mutation
  const regenerateArchiveMutation = api.event.regenerateArchive.useMutation({
    onSuccess: () => {
      toast({
        title: "Archive updated!",
        description: "All photos have been added to the downloadable archive.",
        variant: "success",
      });
      setShowArchiveButton(false);
      setUploadComplete(false);
      setUploadFiles([]);
      setShowUploadDialog(false);
      setIsRegeneratingArchive(false);
      // Refresh the photos
      void utils.event.getEventPhotos.invalidate({ eventId });
    },
    onError: (error) => {
      toast({
        title: "Archive update failed",
        description: error.message || "Failed to update archive",
        variant: "destructive",
      });
      setIsRegeneratingArchive(false);
    },
  });

  // Handle delete photo
  const handleDeletePhoto = async () => {
    if (!photoToDelete || !user?.uid) return;

    deletePhotoMutation.mutate({
      photoId: photoToDelete.id,
      eventId,
    });
  };

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      const newUploadFiles: UploadFile[] = files.map((file, index) => ({
        file,
        id: `${Date.now()}-${index}`,
        preview: URL.createObjectURL(file),
        status: "pending",
      }));

      setUploadFiles((prev) => [...prev, ...newUploadFiles]);
      setUploadComplete(false);
      setShowArchiveButton(false);

      // Clear the input so same files can be selected again
      if (event.target) {
        event.target.value = "";
      }
    },
    [],
  );

  // Remove a file from upload queue
  const removeFile = useCallback((fileId: string) => {
    setUploadFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId);
      // Clean up object URL
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
  }, []);

  // Upload all files sequentially using your hook
  const handleUploadAll = async () => {
    if (uploadFiles.length === 0 || !user?.uid) return;

    setIsUploading(true);
    let successCount = 0;
    let failureCount = 0;

    try {
      // Upload files one by one to show individual progress
      for (let i = 0; i < uploadFiles.length; i++) {
        const uploadFile = uploadFiles[i];

        if (uploadFile?.status === "success") {
          successCount++;
          continue;
        }

        setCurrentUploadIndex(i);

        // Update status to uploading
        setUploadFiles((prev) =>
          prev.map((f, index) =>
            index === i ? { ...f, status: "uploading" } : f,
          ),
        );

        try {
          if (!uploadFile) {
            throw new Error("Upload file is undefined");
          }

          await uploadEventPhoto(uploadFile.file, eventId, user.uid);

          // Update status to success
          setUploadFiles((prev) =>
            prev.map((f, index) =>
              index === i ? { ...f, status: "success" } : f,
            ),
          );

          successCount++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Upload failed";

          // Update status to error
          setUploadFiles((prev) =>
            prev.map((f, index) =>
              index === i ? { ...f, status: "error", error: errorMessage } : f,
            ),
          );

          failureCount++;
        }
      }

      setCurrentUploadIndex(-1);

      // Show results
      if (successCount > 0) {
        toast({
          title: "Upload complete!",
          description: `${successCount} photos uploaded successfully${failureCount > 0 ? `, ${failureCount} failed` : ""}.`,
          variant: successCount === uploadFiles.length ? "success" : "default",
        });

        setUploadComplete(true);

        // Automatically regenerate archive if event has ended
        if (event && new Date(event.endDate) <= new Date()) {
          // Wait for image processing before triggering archive regeneration
          const delaySeconds = successCount * 5;

          setTimeout(() => {
            setIsRegeneratingArchive(true);
            regenerateArchiveMutation.mutate({ eventId });
          }, delaySeconds * 1000);
        }
      } else {
        toast({
          title: "Upload failed",
          description: "No photos were uploaded successfully.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload error",
        description: "An unexpected error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle archive regeneration
  const handleRegenerateArchive = async () => {
    setIsRegeneratingArchive(true);
    regenerateArchiveMutation.mutate({ eventId });
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      uploadFiles.forEach((file) => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, [uploadFiles]);

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
        {user && (
          <Button className="mt-4" onClick={() => setShowUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Photos
          </Button>
        )}
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
          <div className="flex gap-3">
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

            {/* Add upload button - only show if user is authenticated */}
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadDialog(true)}
                className="flex h-10 items-center justify-center gap-1.5"
              >
                <Upload className="mr-1 h-4 w-4" />
                <span className="text-sm">Upload Photos</span>
              </Button>
            )}
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
              src={photo.urls.medium}
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

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Upload Photos to {event?.name}</DialogTitle>
            <DialogDescription>
              Select multiple photos to upload to this event. They will be
              processed and added to the gallery.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 overflow-hidden">
            {/* File selection area */}
            {uploadFiles.length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                <Camera className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="mb-2 text-lg font-medium">
                  Select photos to upload
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Choose multiple photos from your device
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Choose Photos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Photo preview grid */}
            {uploadFiles.length > 0 && (
              <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {uploadFiles.length} photo
                      {uploadFiles.length !== 1 ? "s" : ""} selected
                    </p>
                  </div>

                  {/* More prominent Add More button */}
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full justify-center gap-2 border-2 border-dashed border-muted-foreground bg-muted/50 hover:bg-muted"
                  >
                    <Plus className="h-4 w-4" />
                    Add More Photos
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Overall progress */}
                {isUploading && (
                  <div className="rounded-lg bg-muted p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Uploading photos... (
                        {uploadFiles.filter((f) => f.status === "success")
                          .length + 1}
                        /{uploadFiles.length})
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {uploadFiles.map((uploadFile, index) => (
                    <div key={uploadFile.id} className="group relative">
                      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={uploadFile.preview}
                          alt="Upload preview"
                          className="h-full w-full object-cover"
                          width={200}
                          height={200}
                        />
                      </div>

                      {/* Status overlay */}
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                        {uploadFile.status === "pending" && (
                          <div className="text-center text-white">
                            <Camera className="mx-auto mb-1 h-6 w-6" />
                            <p className="text-xs">Ready</p>
                          </div>
                        )}

                        {uploadFile.status === "uploading" && (
                          <div className="w-full px-2 text-center text-white">
                            <Loader2 className="mx-auto mb-1 h-6 w-6 animate-spin" />
                            <p className="text-xs">Uploading...</p>
                          </div>
                        )}

                        {uploadFile.status === "success" && (
                          <div className="text-center text-green-400">
                            <CheckCircle className="mx-auto mb-1 h-6 w-6" />
                            <p className="text-xs">Done</p>
                          </div>
                        )}

                        {uploadFile.status === "error" && (
                          <div className="px-2 text-center text-red-400">
                            <AlertCircle className="mx-auto mb-1 h-6 w-6" />
                            <p className="text-xs">Error</p>
                            {uploadFile.error && (
                              <p className="mt-1 text-xs opacity-75">
                                {uploadFile.error}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Remove button */}
                      {!isUploading && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => removeFile(uploadFile.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}

                      {/* Current upload indicator */}
                      {isUploading && index === currentUploadIndex && (
                        <div className="absolute -left-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-blue-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col gap-3">
            {/* Upload progress and controls */}
            {uploadFiles.length > 0 && (
              <div className="flex w-full flex-col gap-3">
                {!uploadComplete && !isRegeneratingArchive && (
                  <Button
                    onClick={handleUploadAll}
                    disabled={isUploading || uploadFiles.length === 0}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading Photos...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload {uploadFiles.length} Photo
                        {uploadFiles.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                )}

                {/* Show processing delay after upload completes but before archive starts */}
                {uploadComplete &&
                  !isRegeneratingArchive &&
                  event &&
                  new Date(event.endDate) <= new Date() && (
                    <div className="flex flex-col gap-3">
                      <div className="text-center text-sm text-muted-foreground">
                        Processing photos before updating archive...
                      </div>
                      <div className="w-full">
                        <Progress value={undefined} className="h-2" />
                      </div>
                    </div>
                  )}

                {/* Archive regeneration status */}
                {isRegeneratingArchive && (
                  <div className="flex flex-col gap-3">
                    <div className="text-center text-sm text-muted-foreground">
                      Uploading to download archive...
                    </div>
                    <div className="w-full">
                      <Progress value={undefined} className="h-2" />
                    </div>
                    <Button disabled className="w-full" variant="default">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Archive...
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadDialog(false);
                      setUploadFiles([]);
                      setUploadComplete(false);
                      setShowArchiveButton(false);
                      setCurrentUploadIndex(-1);
                      setIsRegeneratingArchive(false);
                    }}
                    className="flex-1"
                  >
                    {uploadComplete || isRegeneratingArchive
                      ? "Close"
                      : "Cancel"}
                  </Button>
                </div>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
