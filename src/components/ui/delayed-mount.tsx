import { useState, useEffect, type ReactNode } from "react";

interface DelayedMountProps {
  children: ReactNode;
  delay?: number;
}

export function DelayedMount({ children, delay = 100 }: DelayedMountProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!mounted) return null;
  return <>{children}</>;
}
