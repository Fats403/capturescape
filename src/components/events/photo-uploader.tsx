"use client";

import { useState } from "react";
import { Camera } from "lucide-react";

interface PhotoUploaderProps {
  onCapture: (imageData: string) => void;
  className?: string;
}

const PhotoUploader = ({ onCapture, className = "" }: PhotoUploaderProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onCapture(result);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing image:", error);
      setIsLoading(false);
    }
  };

  return (
    <label
      className={`flex cursor-pointer items-center justify-center rounded-lg bg-blue-500 p-4 text-white transition-colors hover:bg-blue-600 ${isLoading ? "cursor-wait opacity-50" : ""} ${className} `}
    >
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
        disabled={isLoading}
      />
      <Camera className="mr-2 h-6 w-6" />
      {isLoading ? "Processing..." : "Take Photo"}
    </label>
  );
};

export default PhotoUploader;
