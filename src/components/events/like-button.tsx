import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";

interface LikeButtonProps {
  photoId: string;
  eventId: string;
  isLiked: boolean;
  likesCount: number;
  onToggle: (liked: boolean) => void;
}

export function LikeButton({
  photoId,
  eventId,
  isLiked,
  likesCount,
  onToggle,
}: LikeButtonProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const utils = api.useUtils();

  const toggleLike = api.photo.toggleLike.useMutation({
    onSuccess: () => {
      // Invalidate queries to keep data fresh for future views
      utils.photo.getPhotoById.invalidate({ photoId, eventId });
      setIsSubmitting(false);
    },
    onError: () => {
      // Revert on error
      onToggle(isLiked);
      setIsSubmitting(false);
    },
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!user || isSubmitting) return;

    // Set submitting flag
    setIsSubmitting(true);

    // Update UI immediately
    const newLiked = !isLiked;
    onToggle(newLiked);

    // Perform server mutation
    toggleLike.mutate({ photoId, eventId });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("gap-2 transition-all", isLiked && "bg-white text-black")}
      onClick={handleClick}
      disabled={isSubmitting}
    >
      <Heart
        className={cn("h-4 w-4", isLiked && "fill-red-500 text-red-500")}
      />
      {likesCount}
    </Button>
  );
}
