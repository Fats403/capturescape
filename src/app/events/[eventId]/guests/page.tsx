import { Users } from "lucide-react";

export default function GuestsPage() {
  return (
    <div className="flex h-[calc(100dvh-80px)] flex-col items-center justify-center space-y-1 text-center">
      <Users className="mb-2 h-12 w-12 text-muted-foreground" />
      <p className="text-xl font-medium text-muted-foreground">
        No other guests yet
      </p>
      <p className="text-sm text-muted-foreground">Send out some invites!</p>
    </div>
  );
}
