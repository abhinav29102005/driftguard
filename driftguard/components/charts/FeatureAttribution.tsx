"use client";

import { memo, useMemo } from "react";
import type { ShapAttribution } from "@/lib/types";

interface FeatureAttributionProps {
  data: ShapAttribution[];
}

export const FeatureAttribution = memo(function FeatureAttribution({ data }: FeatureAttributionProps) {
  const ranked = useMemo(
    () => [...data].filter((item) => Number.isFinite(item.value)).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)),
    [data],
  );

  if (ranked.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        Attribution data is not available for this part.
      </div>
    );
  }

  const maxImpact = Math.max(...ranked.map((item) => Math.abs(item.value)), 1);

  return (
    <div className="space-y-3">
      {ranked.map((item) => {
        const positive = item.value >= 0;
        const width = Math.max((Math.abs(item.value) / maxImpact) * 100, 4);

        return (
          <div key={item.feature} className="grid grid-cols-[minmax(110px,1fr)_minmax(120px,2fr)_64px] items-center gap-3">
            <span className="truncate text-xs font-medium text-slate-600" title={item.feature}>
              {item.feature}
            </span>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${positive ? "bg-red-500" : "bg-blue-500"}`}
                style={{ width: `${width}%` }}
              />
            </div>
            <span className={`text-right font-mono text-xs font-semibold ${positive ? "text-red-700" : "text-blue-700"}`}>
              {positive ? "+" : ""}{item.value.toFixed(3)}
            </span>
          </div>
        );
      })}
      <div className="flex items-center gap-4 pt-2 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Increases risk</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Reduces risk</span>
      </div>
    </div>
  );
});
