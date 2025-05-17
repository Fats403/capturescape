"use client";

import { useState, useRef } from "react";
import {
  Camera,
  Upload,
  RefreshCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

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

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string);
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
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9),
      );

      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      await uploadEventPhoto(file, eventId, user?.uid);

      toast({
        position: "top",
        title: "Photo uploaded!",
        description: "Your photo will show up in the gallery feed!",
        variant: "success",
      });

      setCapturedImage(null);
      setSelectedFilter("none");
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setSelectedFilter("none");
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

  if (capturedImage) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-between px-2 py-6 sm:py-8">
        <div className="relative max-h-[60vh] w-full max-w-md overflow-hidden rounded-xl bg-muted/70 shadow-lg sm:max-w-lg md:max-w-xl">
          <div className="aspect-[4/3] w-full">
            <Image
              src={capturedImage}
              alt="Captured"
              fill
              className="object-contain"
              style={{ filter: FILTERS[selectedFilter] }}
              unoptimized
            />
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
                {(Object.keys(FILTERS) as FilterType[]).map((filter) => (
                  <FilterPreview
                    key={filter}
                    filter={filter}
                    isSelected={selectedFilter === filter}
                    onClick={() => setSelectedFilter(filter)}
                    image={capturedImage}
                  />
                ))}
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
            disabled={isUploading}
          >
            <RefreshCcw className="mr-2 h-4 w-4 sm:mr-2.5 sm:h-5 sm:w-5" />
            Retake
          </Button>
          <Button
            onClick={handleUpload}
            className="h-12 flex-1 bg-primary text-base font-medium hover:bg-primary/90"
            disabled={isUploading}
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
  }

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
            backgroundImage: `url(${image})`,
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
