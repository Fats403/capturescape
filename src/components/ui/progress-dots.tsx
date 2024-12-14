"use client";

import { motion } from "framer-motion";

interface ProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
  return (
    <div className="mb-4 flex justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <motion.div
          key={i}
          className={`h-2 w-2 rounded-full ${
            i + 1 <= currentStep ? "bg-primary" : "bg-muted"
          }`}
          initial={false}
          animate={{
            scale: i + 1 === currentStep ? 1.4 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      ))}
    </div>
  );
}
