"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  variant?: "default" | "glow";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Card({ variant = "default", className, children, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border bg-neutral-900/60 backdrop-blur-xl p-6 shadow-xl transition-colors",
        variant === "default" && "border-white/10 hover:border-white/20",
        variant === "glow" && "border-cyan-500/30 glow-border",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
