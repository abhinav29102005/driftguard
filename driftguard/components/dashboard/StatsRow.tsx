"use client";

import { Card } from "@/components/ui/Card";
import { Cpu, AlertTriangle, ShieldCheck, Sigma } from "lucide-react";

interface StatsRowProps {
  totalParts: number;
  flaggedParts: number;
  estimatedRecall: string;
  meanDriftMAE: string;
}

const stats = [
  { key: "total", icon: Cpu, label: "Total Screened", gradient: "from-cyan-500/20 to-cyan-500/5" },
  { key: "flagged", icon: AlertTriangle, label: "Flagged Parts", gradient: "from-red-500/20 to-red-500/5" },
  { key: "recall", icon: ShieldCheck, label: "Est. Recall", gradient: "from-emerald-500/20 to-emerald-500/5" },
  { key: "mae", icon: Sigma, label: "Mean Drift MAE", gradient: "from-purple-500/20 to-purple-500/5" },
];

export function StatsRow({ totalParts, flaggedParts, estimatedRecall, meanDriftMAE }: StatsRowProps) {
  const values: Record<string, string> = {
    total: totalParts.toLocaleString(),
    flagged: `${flaggedParts} (${((flaggedParts / totalParts) * 100).toFixed(1)}%)`,
    recall: estimatedRecall,
    mae: meanDriftMAE,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.key} className="!p-5">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient}`}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-2xl leading-none">{values[s.key]}</div>
              <div className="text-neutral-500 text-xs mt-1">{s.label}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
