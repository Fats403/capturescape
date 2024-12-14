"use client";
import * as React from "react";
import Image from "next/image";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageIcon } from "lucide-react";
import { useEventPhotos } from "@/hooks/use-event-photos";

interface GalleryProps {
  eventId: string;
  photoCount: number;
}

export function Gallery({ eventId, photoCount }: GalleryProps) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { data: photos, loading, error } = useEventPhotos(eventId);

  const PhotoGrid = () => (
    <ScrollArea className="mt-4 h-[60vh]">
      <div className="grid grid-cols-2 gap-4 px-4 sm:grid-cols-3">
        {photos?.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square overflow-hidden rounded-lg"
          >
            <Image
              src={photo.urls.medium}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <ImageIcon className="mr-2 h-4 w-4" />
            {photoCount} Photos
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Photo Gallery</DialogTitle>
          </DialogHeader>
          <PhotoGrid />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          <ImageIcon className="mr-2 h-4 w-4" />
          {photoCount} Photos
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Photo Gallery</DrawerTitle>
        </DrawerHeader>
        <PhotoGrid />
      </DrawerContent>
    </Drawer>
  );
}
