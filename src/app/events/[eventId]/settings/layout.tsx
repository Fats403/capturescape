"use client";

import { useParams } from "next/navigation";

export default function EventPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="container relative z-20 mx-auto max-w-4xl px-4 py-8">
      {children}
    </div>
  );
}
