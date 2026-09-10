"use client";

import type { OverrideEntry } from "@/lib/types";
import { CheckCircle2, XCircle } from "lucide-react";

interface OverrideLogProps {
  entries: OverrideEntry[];
}

export function OverrideLog({ entries }: OverrideLogProps) {
  return (
    <div>
      <h3 className="text-white font-semibold text-lg mb-4">
        Override Audit Trail
        <span className="text-neutral-500 text-sm font-normal ml-2">({entries.length})</span>
      </h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-white/10" />

        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="flex gap-4 relative">
              {/* Dot */}
              <div className="relative z-10 shrink-0 mt-1">
                {entry.action === "accept" ? (
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-red-400" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 rounded-xl bg-white/[0.03] border border-white/5 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    entry.action === "accept"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {entry.action.toUpperCase()}
                  </span>
                  <span className="text-neutral-400 text-xs font-mono">#{entry.partId}</span>
                  <span className="text-neutral-600 text-xs">{entry.lotId}</span>
                </div>
                <p className="text-neutral-300 text-sm leading-relaxed mb-2">{entry.reason}</p>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <span>{entry.operator}</span>
                  <span>•</span>
                  <span>{entry.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
