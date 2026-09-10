"use client";

import { cn } from "@/lib/utils";
import type { Lot } from "@/lib/types";

interface LotSelectorProps {
  lots: Lot[];
  selectedId: string;
  onChange: (lotId: string) => void;
}

const riskColors = {
  low: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-red-400",
};

export function LotSelector({ lots, selectedId, onChange }: LotSelectorProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
      <button
        onClick={() => onChange("all")}
        className={cn(
          "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all border",
          selectedId === "all"
            ? "bg-white/10 text-white border-cyan-500/30"
            : "bg-transparent text-neutral-400 border-white/10 hover:border-white/20 hover:text-white"
        )}
      >
        All Lots
      </button>
      {lots.map((lot) => (
        <button
          key={lot.id}
          onClick={() => onChange(lot.id)}
          className={cn(
            "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all border flex items-center gap-2",
            selectedId === lot.id
              ? "bg-white/10 text-white border-cyan-500/30"
              : "bg-transparent text-neutral-400 border-white/10 hover:border-white/20 hover:text-white"
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", riskColors[lot.riskLevel])} />
          {lot.name}
          <span className="text-neutral-600 text-xs">{lot.date}</span>
        </button>
      ))}
    </div>
  );
}
