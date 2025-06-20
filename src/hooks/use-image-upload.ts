import { useState, useCallback } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function convertToWebP(file: File): Promise<Blob> {
  // Create a canvas to draw and convert the image
  const img = new Image();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Create a promise to handle image loading
  return new Promise((resolve, reject) => {
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image on canvas
      ctx.drawImage(img, 0, 0);

      // Convert to WebP
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("WebP conversion failed"));
          }
        },
        "image/webp",
        0.85, // Quality setting (0-1)
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Load image from file
    img.src = URL.createObjectURL(file);
  });
}

export function useImageUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploadCoverImage = async (file: File, eventId: string) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error("Please upload a JPEG, PNG, or WebP image.");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("Image too large. Maximum size is 5MB.");
    }

    try {
      setIsUploading(true);
      setProgress(0);

      // Convert image to WebP
      const webpBlob = await convertToWebP(file);

      // Create a new File from the Blob
      const webpFile = new File([webpBlob], `cover.webp`, {
        type: "image/webp",
      });

      const storageRef = ref(storage, `events/${eventId}/cover.webp`);
      const uploadTask = uploadBytesResumable(storageRef, webpFile);

      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(progress);
          },
          (error) => {
            setIsUploading(false);
            setProgress(0);
            reject(error);
          },
          () => {
            void getDownloadURL(storageRef).then((downloadURL) => {
              setIsUploading(false);
              setProgress(0);
              resolve(downloadURL);
            });
          },
        );
      });
    } catch (error) {
      setIsUploading(false);
      setProgress(0);
      throw error;
    }
  };

  const uploadEventPhoto = async (
    file: File,
    eventId: string,
    uploaderId: string | undefined,
  ) => {
    try {
      setIsUploading(true);
      setProgress(0);

      // Validate file before upload
      if (!file) {
        throw new Error("No file provided");
      }

      // Check file size (allow up to 10MB for processed files)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("File too large. Maximum size is 10MB.");
      }

      console.log(
        `Starting upload: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Type: ${file.type}`,
      );

      // Generate a unique filename using timestamp
      const timestamp = Date.now();
      const filename = `photo-${timestamp}${getFileExtension(file.name)}`;

      const storageRef = ref(storage, `events/${eventId}/uploads/${filename}`);

      // Create upload task with metadata
      const uploadTask = uploadBytesResumable(storageRef, file, {
        customMetadata: {
          uploaderId: uploaderId ?? "",
          originalName: file.name,
          processedAt: new Date().toISOString(),
        },
      });

      return new Promise<void>((resolve, reject) => {
        // Shorter timeout for mobile (2 minutes)
        const timeoutId = setTimeout(
          () => {
            console.log("Upload timeout reached");
            uploadTask.cancel();
            reject(
              new Error(
                "Upload timeout - please check your connection and try again",
              ),
            );
          },
          2 * 60 * 1000, // 2 minute timeout for mobile
        );

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(progress);

            // More detailed logging
            console.log(
              `Upload progress: ${progress.toFixed(1)}% (${snapshot.bytesTransferred}/${snapshot.totalBytes} bytes)`,
            );

            // Check if upload is actually progressing
            if (progress > 0) {
              console.log("Upload is progressing normally");
            }
          },
          (error) => {
            clearTimeout(timeoutId);
            setIsUploading(false);
            setProgress(0);
            console.error("Upload error:", error);

            // Provide more specific error messages
            let errorMessage = "Upload failed";
            if (error.code === "storage/canceled") {
              errorMessage = "Upload was cancelled";
            } else if (error.code === "storage/unknown") {
              errorMessage = "Network error - please check your connection";
            } else if (error.code === "storage/quota-exceeded") {
              errorMessage = "Storage quota exceeded";
            } else if (error.code === "storage/unauthenticated") {
              errorMessage =
                "Authentication error - please refresh and try again";
            }

            reject(new Error(errorMessage));
          },
          () => {
            clearTimeout(timeoutId);
            setIsUploading(false);
            setProgress(0);
            console.log("Upload completed successfully");
            resolve();
          },
        );
      });
    } catch (error) {
      setIsUploading(false);
      setProgress(0);
      console.error("Upload preparation error:", error);
      throw error;
    }
  };

  const getFileExtension = (filename: string): string => {
    const ext = filename.split(".").pop();
    return ext ? `.${ext}` : "";
  };

  const handlePreview = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  return {
    progress,
    isUploading,
    previewUrl,
    uploadCoverImage,
    uploadEventPhoto,
    handlePreview,
    setPreviewUrl,
  };
}
