import { useCallback } from "react";
import { useCoverImageUpload } from "@/hooks/use-cover-image-upload";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IMAGE_CONFIG, validateImageDimensions } from "@/lib/image-utils";
import Image from "next/image";

interface CoverImageUploadProps {
  eventId: string;
  onUploadComplete: (imageUrl: string) => void;
  onError: (error: string) => void;
  value?: string;
}

export function CoverImageUpload({
  eventId,
  onUploadComplete,
  onError,
  value,
}: CoverImageUploadProps) {
  const {
    progress,
    isUploading,
    previewUrl,
    uploadCoverImage,
    handlePreview,
    setPreviewUrl,
  } = useCoverImageUpload();

  const validateAndUpload = async (file: File) => {
    try {
      // Check file size
      if (file.size > IMAGE_CONFIG.maxSizeMB * 1024 * 1024) {
        throw new Error(
          `File too large. Maximum size is ${IMAGE_CONFIG.maxSizeMB}MB.`,
        );
      }

      // Check dimensions
      const validDimensions = await validateImageDimensions(file);
      if (!validDimensions) {
        throw new Error(
          `Image dimensions must be between ${IMAGE_CONFIG.minWidth}x${IMAGE_CONFIG.minHeight} ` +
            `and ${IMAGE_CONFIG.maxWidth}x${IMAGE_CONFIG.maxHeight} pixels.`,
        );
      }

      handlePreview(file);
      const imageUrl = await uploadCoverImage(file, eventId);
      onUploadComplete(imageUrl);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      void validateAndUpload(file);
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void validateAndUpload(file);
    }
  };

  return (
    <div
      className="relative"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <label
        className={cn(
          "flex h-48 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed",
          "transition-colors duration-200",
          !isUploading && "cursor-pointer hover:bg-muted/50",
          isUploading && "pointer-events-none",
          previewUrl || value ? "border-none" : "border-muted-foreground/25",
        )}
      >
        {previewUrl || value ? (
          <div className="relative h-full w-full">
            <Image
              src={previewUrl ?? value ?? ""}
              alt="Cover preview"
              fill
              className="rounded-lg object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.preventDefault();
                setPreviewUrl(null);
                onUploadComplete("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            {isUploading ? (
              <div className="w-full space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground">
                  Uploading... {Math.round(progress)}%
                </p>
              </div>
            ) : (
              <>
                <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="mb-1 text-sm text-muted-foreground">
                  Drop your image here or click to choose
                </p>
              </>
            )}
          </div>
        )}
        <input
          type="file"
          className="hidden"
          accept={IMAGE_CONFIG.acceptedTypes.join(",")}
          onChange={handleFileSelect}
          disabled={isUploading}
        />
      </label>
    </div>
  );
}
