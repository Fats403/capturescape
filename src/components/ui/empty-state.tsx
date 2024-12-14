import { Button } from "@/components/ui/button";
import { CalendarPlus, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: () => void;
  actionText?: string;
  icon?: LucideIcon;
}

export function EmptyState({
  title,
  description,
  action,
  actionText = "Create Event",
  icon: Icon = CalendarPlus,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center animate-in fade-in-50">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {description}
        </p>
        {action && (
          <Button onClick={action} className="mt-6" size="lg">
            {actionText}
          </Button>
        )}
      </div>
    </div>
  );
}
