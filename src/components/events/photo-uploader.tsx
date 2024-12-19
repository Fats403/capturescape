"use client";

import { useState } from "react";
import { Camera, Upload, RefreshCcw, Loader2 } from "lucide-react";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PhotoUploaderProps {
  eventId: string;
  className?: string;
}

type FilterType = "none" | "grayscale" | "sepia" | "blur";

const FILTERS: Record<FilterType, string> = {
  none: "none",
  grayscale: "grayscale(1)",
  sepia: "sepia(1)",
  blur: "blur(4px)",
};

const PhotoUploader = ({ eventId, className = "" }: PhotoUploaderProps) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("none");
  const { isUploading, progress, uploadEventPhoto } = useImageUpload();
  const { toast } = useToast();

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
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 1.0),
      );

      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      await uploadEventPhoto(file, eventId);

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

  if (capturedImage) {
    return (
      <div className="flex flex-col items-center space-y-6 px-4">
        <div className="relative w-full max-w-md overflow-hidden rounded-lg">
          <Image
            src={capturedImage}
            alt="Captured"
            width={800}
            height={600}
            className="w-full"
            style={{ filter: FILTERS[selectedFilter] }}
            unoptimized
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {(Object.keys(FILTERS) as FilterType[]).map((filter) => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? "default" : "outline"}
              onClick={() => setSelectedFilter(filter)}
              className="min-w-[80px]"
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </div>

        <div className="flex w-full max-w-md gap-2">
          <Button
            variant="outline"
            onClick={resetCapture}
            className="flex-1"
            disabled={isUploading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retake
          </Button>
          <Button
            onClick={handleUpload}
            className="flex-1"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {Math.round(progress)}%
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 px-4">
      <h2 className="text-center text-2xl font-semibold">Take a Photo</h2>
      <p className="text-center text-muted-foreground">
        Capture a moment to share with your event guests
      </p>
      <label
        className={cn(
          "animate-pulse-subtle flex aspect-square !h-[144px] !min-h-[144px] !w-[144px] !min-w-[144px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/25 bg-muted/50 text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
          className,
        )}
        style={{ aspectRatio: "1 / 1" }}
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          className="hidden"
        />
        <Camera className="mb-2 h-10 w-10" />
        <span className="text-sm">Tap to capture</span>
      </label>
    </div>
  );
};

export default PhotoUploader;
