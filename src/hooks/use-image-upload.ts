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
            reject(error);
          },
          () => {
            void getDownloadURL(storageRef).then((downloadURL) => {
              setIsUploading(false);
              resolve(downloadURL);
            });
          },
        );
      });
    } catch (error) {
      setIsUploading(false);
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

      // Generate a unique filename using timestamp
      const timestamp = Date.now();
      const filename = `photo-${timestamp}${getFileExtension(file.name)}`;

      const storageRef = ref(storage, `events/${eventId}/uploads/${filename}`);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        customMetadata: {
          uploaderId: uploaderId ?? "",
        },
      });

      return new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(progress);
          },
          (error) => {
            setIsUploading(false);
            reject(error);
          },
          () => {
            setIsUploading(false);
            resolve();
          },
        );
      });
    } catch (error) {
      setIsUploading(false);
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
