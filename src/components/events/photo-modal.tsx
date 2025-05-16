import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Photo } from "@/lib/types/event";
import { useEffect, useState } from "react";
import { LikeButton } from "@/components/events/like-button";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/trpc/react";

interface PhotoModalProps {
  photo: Photo | null;
  onClose: () => void;
}

export function PhotoModal({ photo, onClose }: PhotoModalProps) {
  const { user } = useAuth();

  // Fetch fresh photo data when modal opens
  const { data: freshPhoto } = api.photo.getPhotoById.useQuery(
    { photoId: photo?.id || "", eventId: photo?.eventId || "" },
    {
      enabled: !!photo,
      refetchOnWindowFocus: false,
    },
  );

  // Use the most up-to-date photo data
  const currentPhoto = freshPhoto || photo;

  // Track like state internally for smooth transitions
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Update internal state when fresh data arrives
  useEffect(() => {
    if (currentPhoto && user) {
      setLiked(currentPhoto.likes?.userIds.includes(user.uid) || false);
      setLikeCount(currentPhoto.likes?.count || 0);
    }
  }, [currentPhoto, user]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (photo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [photo]);

  // Handle like toggle within the modal
  const handleLikeToggle = (newLiked: boolean) => {
    setLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));
  };

  if (!photo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-8"
        onClick={onClose}
      >
        <Button
          variant="outline"
          size="icon"
          className="fixed right-4 top-4 z-50 h-8 w-8 rounded-full bg-background md:right-8 md:top-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative h-full w-full"
        >
          <div className="relative flex h-full w-full items-center justify-center">
            <div className="relative max-h-[85vh] w-auto">
              <Image
                src={currentPhoto?.urls.medium || ""}
                alt=""
                className="rounded-lg object-contain"
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "100%",
                  maxHeight: "85vh",
                }}
                width={1200}
                height={800}
                priority
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute bottom-4 left-4 z-50">
                <LikeButton
                  photoId={currentPhoto?.id || ""}
                  eventId={currentPhoto?.eventId || ""}
                  isLiked={liked}
                  likesCount={likeCount}
                  onToggle={handleLikeToggle}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
