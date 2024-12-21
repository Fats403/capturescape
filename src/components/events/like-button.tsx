import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { useAuth } from "@/providers/auth-provider";

interface LikeButtonProps {
  photoId: string;
  eventId: string;
  initialLikes: number;
  initialLikedByUser: boolean;
}

export function LikeButton({
  photoId,
  eventId,
  initialLikes,
  initialLikedByUser,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLikedByUser);
  const [likeCount, setLikeCount] = useState(initialLikes ?? 0);
  const { user } = useAuth();

  const toggleLike = api.photo.toggleLike.useMutation({
    onMutate: () => {
      // Optimistically update UI
      setLiked(!liked);
      setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    },
    onError: () => {
      // Revert on error
      setLiked(liked);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
    },
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!user) return;
    void toggleLike.mutate({ photoId, eventId });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("gap-2 transition-all", liked && "bg-white text-black")}
      onClick={handleClick}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-red-500 text-red-500")} />
      {likeCount}
    </Button>
  );
}
