// src/lib/image-utils.ts
export const IMAGE_CONFIG = {
  maxWidth: 2048,
  maxHeight: 2048,
  minWidth: 200,
  minHeight: 200,
  maxSizeMB: 5,
  quality: 0.85,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
} as const;

export async function validateImageDimensions(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const valid =
        img.width >= IMAGE_CONFIG.minWidth &&
        img.height >= IMAGE_CONFIG.minHeight &&
        img.width <= IMAGE_CONFIG.maxWidth &&
        img.height <= IMAGE_CONFIG.maxHeight;

      URL.revokeObjectURL(img.src); // Cleanup
      resolve(valid);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(file);
  });
}
