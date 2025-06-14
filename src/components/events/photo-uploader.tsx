"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  RefreshCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { ref, uploadString } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { api } from "@/trpc/react";
import { Skeleton } from "../ui/skeleton";

interface PhotoUploaderProps {
  eventId: string;
  className?: string;
}

type FilterType =
  | "none"
  | "grayscale"
  | "sepia"
  | "contrast"
  | "brightness"
  | "saturate"
  | "hue-rotate"
  | "invert";

const FILTERS: Record<FilterType, string> = {
  none: "none",
  grayscale: "grayscale(1)",
  sepia: "sepia(1)",
  contrast: "contrast(1.5)",
  brightness: "brightness(1.2)",
  saturate: "saturate(2)",
  "hue-rotate": "hue-rotate(90deg)",
  invert: "invert(0.8)",
};

const PhotoUploader = ({ eventId, className = "" }: PhotoUploaderProps) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("none");
  const { user } = useAuth();
  const { isUploading, progress, uploadEventPhoto } = useImageUpload();
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isLoadingLastPhoto, setIsLoadingLastPhoto] = useState(true);

  const { mutateAsync: clearLastPhoto } =
    api.photo.clearUserLastUploadedPhoto.useMutation();
  const utils = api.useUtils();

  const optimizeImage = async (base64Image: string): Promise<string> => {
    try {
      const img = new window.Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = base64Image;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const maxDimension = 1600;
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      const optimizedImage = canvas.toDataURL("image/jpeg", 0.87);
      return optimizedImage;
    } catch (error) {
      return base64Image;
    }
  };

  const saveLastUploadedPhoto = async (imageData: string): Promise<void> => {
    if (!user?.uid) {
      return;
    }

    try {
      const storagePath = `users/${user.uid}/last-uploaded/photo.jpg`;
      const storageRef = ref(storage, storagePath);
      await uploadString(storageRef, imageData, "data_url");
    } catch (error) {
      console.error("Error saving last uploaded photo:", error);
    }
  };

  const clearLastUploadedPhoto = async (): Promise<void> => {
    try {
      await clearLastPhoto();
    } catch (error) {
      console.error("Error clearing last uploaded photo:", error);
    }
  };

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImageLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const originalImage = e.target?.result as string;

        const optimizedImage = await optimizeImage(originalImage);
        await saveLastUploadedPhoto(optimizedImage);

        setCapturedImage(optimizedImage);
      } catch (error) {
        toast({
          title: "Failed to process photo",
          description: "Please try again",
          variant: "destructive",
        });
      } finally {
        setIsImageLoading(false);
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      setIsImageLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!capturedImage) return;

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const img = new window.Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = capturedImage;
      });

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
      }

      ctx?.drawImage(img, 0, 0);

      if (selectedFilter !== "none" && ctx) {
        ctx.filter = FILTERS[selectedFilter];
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = "none";
      }

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.87),
      );

      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      await uploadEventPhoto(file, eventId, user?.uid);

      await clearLastUploadedPhoto();

      void utils.photo.getUserLastUploadedPhoto.invalidate();

      setCapturedImage(null);
      setSelectedFilter("none");

      toast({
        position: "top",
        title: "Photo uploaded!",
        description: "Your photo will show up in the gallery feed!",
        variant: "success",
      });
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const resetCapture = async () => {
    setIsLoadingLastPhoto(true);

    try {
      if (user?.uid) {
        await clearLastUploadedPhoto();

        await utils.photo.getUserLastUploadedPhoto.invalidate();

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setCapturedImage(null);
      setSelectedFilter("none");
    } catch (error) {
      console.error("Error resetting capture:", error);
    } finally {
      setIsLoadingLastPhoto(false);
    }
  };

  const scrollFilters = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = 200; // Scroll by roughly 3 items

    if (direction === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const fetchLastPhoto = async () => {
      if (!capturedImage) {
        setIsLoadingLastPhoto(true);
        try {
          const result = await utils.photo.getUserLastUploadedPhoto.fetch(
            undefined,
            { staleTime: 0 },
          );

          if (result.imageData) {
            setCapturedImage(result.imageData);
          }
        } catch (error) {
          console.error("Error fetching last photo:", error);
        } finally {
          setIsLoadingLastPhoto(false);
        }
      } else {
        setIsLoadingLastPhoto(false);
      }
    };

    void fetchLastPhoto();
  }, [capturedImage, utils.photo.getUserLastUploadedPhoto]);

  useEffect(() => {
    void utils.photo.getUserLastUploadedPhoto.invalidate();
  }, [utils.photo.getUserLastUploadedPhoto]);

  if (isLoadingLastPhoto) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  } else if (isImageLoading || capturedImage) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-between px-2 py-6 sm:py-8">
        <div className="relative max-h-[60vh] w-full max-w-md overflow-hidden rounded-xl bg-muted/70 shadow-lg sm:max-w-lg md:max-w-xl">
          <div className="relative aspect-[4/3] w-full">
            {isImageLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <LoaderCircle className="h-10 w-10 animate-spin text-primary/70" />
                  <p className="mt-2 text-sm font-medium text-primary/70">
                    Processing photo...
                  </p>
                </div>
              </div>
            ) : (
              <Image
                src={capturedImage!}
                alt="Captured"
                fill
                className="object-contain"
                style={{ filter: FILTERS[selectedFilter] }}
                unoptimized
              />
            )}
          </div>
        </div>

        <div className="my-6 w-full max-w-md sm:max-w-lg md:max-w-xl">
          <div className="relative flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -left-1 z-10 h-8 w-8 rounded-full bg-background/80 shadow-sm"
              onClick={() => scrollFilters("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="w-full overflow-hidden px-8">
              <div
                ref={scrollContainerRef}
                className="scrollbar-hide flex gap-3 overflow-x-auto py-2 pl-3 pr-3"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {(Object.keys(FILTERS) as FilterType[]).map((filter) =>
                  isImageLoading ? (
                    <div
                      key={filter}
                      className="flex flex-col items-center space-y-1"
                    >
                      <Skeleton className="h-16 w-16 rounded-md" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ) : (
                    <FilterPreview
                      key={filter}
                      filter={filter}
                      isSelected={selectedFilter === filter}
                      onClick={() => setSelectedFilter(filter)}
                      image={capturedImage!}
                    />
                  ),
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-1 z-10 h-8 w-8 rounded-full bg-background/80 shadow-sm"
              onClick={() => scrollFilters("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex w-full max-w-md gap-4 px-2 sm:max-w-lg md:max-w-xl">
          <Button
            variant="outline"
            onClick={resetCapture}
            className="h-12 flex-1 text-base font-medium"
            disabled={isUploading || isImageLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4 sm:mr-2.5 sm:h-5 sm:w-5" />
            Retake
          </Button>
          <Button
            onClick={handleUpload}
            className="h-12 flex-1 bg-primary text-base font-medium hover:bg-primary/90"
            disabled={isUploading || isImageLoading || !capturedImage}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin sm:mr-2.5 sm:h-5 sm:w-5" />
                {Math.round(progress)}%
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4 sm:mr-2.5 sm:h-5 sm:w-5" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Take a Photo</h2>
        </div>

        <div className="mt-10 flex flex-col items-center">
          <label
            className={cn(
              "relative flex aspect-square w-36 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-primary/30 bg-primary/5 text-primary transition-all hover:bg-primary/10 sm:w-44 md:w-48",
              className,
            )}
          >
            <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10"></div>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCapture}
              className="hidden"
              disabled={isLoadingLastPhoto}
            />
            <Camera className="relative z-10 mb-2 h-10 w-10 text-primary sm:h-12 sm:w-12" />
            <span className="relative z-10 text-sm font-medium text-primary sm:text-base">
              Tap to capture
            </span>
          </label>

          <p className="mt-6 max-w-xs text-center text-sm text-muted-foreground">
            Your photos will be shared with everyone attending this event
          </p>
        </div>
      </div>
    );
  }
};

interface FilterPreviewProps {
  filter: FilterType;
  isSelected: boolean;
  onClick: () => void;
  image: string;
}

const FilterPreview = ({
  filter,
  isSelected,
  onClick,
  image,
}: FilterPreviewProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center space-y-1",
        isSelected ? "scale-110 transition-transform" : "",
      )}
    >
      <button
        onClick={onClick}
        className={cn(
          "relative h-16 w-16 overflow-hidden rounded-md border",
          isSelected
            ? "border-primary ring-2 ring-primary ring-offset-2"
            : "border-border",
        )}
        style={{ margin: isSelected ? "0px 4px" : "0px" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: image ? `url(${image})` : "none",
            filter: FILTERS[filter],
          }}
        />
      </button>
      <span className="text-xs font-medium">
        {filter === "hue-rotate"
          ? "Hue"
          : filter.charAt(0).toUpperCase() + filter.slice(1)}
      </span>
    </div>
  );
};

export default PhotoUploader;
