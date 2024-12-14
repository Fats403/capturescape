"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/trpc/react";

export function AppBar() {
  const router = useRouter();
  const logout = api.auth.logout.useMutation();

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-card/90 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="CaptureScape"
            width={48}
            height={48}
            className="rounded-full border-2 border-white"
          />
          <h1 className="text-xl font-semibold">CaptureScape</h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={async () => {
                await signOut(auth);
                void logout.mutateAsync();
                router.push("/login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
