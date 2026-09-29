"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-cyan-700 text-white hover:bg-cyan-800 shadow-sm shadow-cyan-900/10",
        variant === "ghost" &&
          "border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 bg-white",
        variant === "danger" &&
          "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}
