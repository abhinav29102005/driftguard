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
        "relative rounded-xl border bg-white p-6 shadow-[0_6px_18px_rgba(32,76,105,0.05)] transition-colors",
        variant === "default" && "border-slate-200 hover:border-cyan-200",
        variant === "glow" && "border-cyan-500/30 glow-border",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
