import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

const statusConfig = {
  normal: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
    label: "Normal",
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    icon: AlertTriangle,
    label: "Warning",
  },
  anomaly: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
    icon: AlertCircle,
    label: "Anomaly",
    pulse: true,
  },
};

interface BadgeProps {
  status: "normal" | "warning" | "anomaly";
  className?: string;
  showIcon?: boolean;
}

export function Badge({ status, className, showIcon = true }: BadgeProps) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border",
        cfg.bg, cfg.text, cfg.border,
        "pulse" in cfg && cfg.pulse && "animate-pulse",
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {cfg.label}
    </span>
  );
}
