import { useState, useCallback } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Mobile-specific optimizations
const MOBILE_MAX_DIMENSION = 1920; // Max width/height for mobile
const MOBILE_QUALITY = 0.8; // Slightly lower quality for mobile

function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

async function resizeImageForMobile(file: File): Promise<Blob> {
  const img = new Image();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  return new Promise((resolve, reject) => {
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions if image is too large
      if (width > MOBILE_MAX_DIMENSION || height > MOBILE_MAX_DIMENSION) {
        const ratio = Math.min(
          MOBILE_MAX_DIMENSION / width,
          MOBILE_MAX_DIMENSION / height,
        );
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image on canvas with new dimensions
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with compression for mobile
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Image compression failed"));
          }
        },
        "image/jpeg",
        MOBILE_QUALITY,
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Load image from file
    img.src = URL.createObjectURL(file);
  });
}

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

      // Process file for mobile if needed
      let processedFile: File | Blob = file;

      if (isMobile() && file.size > 1024 * 1024) {
        // 1MB threshold for mobile processing
        console.log("Processing image for mobile upload...");
        processedFile = await resizeImageForMobile(file);
        console.log(
          `Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Processed size: ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`,
        );
      }

      // Generate a unique filename using timestamp
      const timestamp = Date.now();
      const filename = `photo-${timestamp}${getFileExtension(file.name)}`;

      const storageRef = ref(storage, `events/${eventId}/uploads/${filename}`);

      // Add timeout and retry logic for mobile
      const uploadTask = uploadBytesResumable(storageRef, processedFile, {
        customMetadata: {
          uploaderId: uploaderId ?? "",
        },
      });

      return new Promise<void>((resolve, reject) => {
        // Set a timeout for mobile uploads
        const timeoutId = setTimeout(
          () => {
            uploadTask.cancel();
            reject(
              new Error(
                "Upload timeout - please check your connection and try again",
              ),
            );
          },
          5 * 60 * 1000,
        ); // 5 minute timeout

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(progress);

            // Log progress for debugging
            if (progress === 0) {
              console.log("Upload starting...");
            } else if (progress > 0) {
              console.log(`Upload progress: ${progress.toFixed(1)}%`);
            }
          },
          (error) => {
            clearTimeout(timeoutId);
            setIsUploading(false);
            setProgress(0);
            console.error("Upload error:", error);
            reject(error);
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
