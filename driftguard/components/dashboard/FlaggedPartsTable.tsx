"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ExportCsvButton } from "./ExportCsvButton";
import { ArrowUpDown, ChevronRight } from "lucide-react";
import type { Part } from "@/lib/types";

interface FlaggedPartsTableProps {
  parts: Part[];
  showAll?: boolean;
}

type SortKey = "id" | "lotId" | "if_score" | "ecod_score" | "fused_score" | "lotPercentile";
type SortDir = "asc" | "desc";

export function FlaggedPartsTable({ parts, showAll = false }: FlaggedPartsTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("fused_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showAllParts, setShowAllParts] = useState(showAll);

  const filtered = useMemo(() => {
    const list = showAllParts ? parts : parts.filter((p) => p.status !== "normal");
    return [...list].sort((a, b) => {
      let va: number | string, vb: number | string;
      switch (sortKey) {
        case "id": va = a.id; vb = b.id; break;
        case "lotId": va = a.lotId; vb = b.lotId; break;
        case "if_score": va = a.moduleA.if_score; vb = b.moduleA.if_score; break;
        case "ecod_score": va = a.moduleA.ecod_score; vb = b.moduleA.ecod_score; break;
        case "fused_score": va = a.moduleA.fused_score; vb = b.moduleA.fused_score; break;
        case "lotPercentile": va = a.lotPercentile; vb = b.lotPercentile; break;
        default: va = 0; vb = 0;
      }
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [parts, sortKey, sortDir, showAllParts]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const columns: { key: SortKey; label: string }[] = [
    { key: "id", label: "Part ID" },
    { key: "lotId", label: "Lot" },
    { key: "if_score", label: "IF Score" },
    { key: "ecod_score", label: "ECOD Score" },
    { key: "fused_score", label: "Fused" },
    { key: "lotPercentile", label: "Lot %ile" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">
          {showAllParts ? "All Parts" : "Flagged Parts"}
          <span className="text-neutral-500 text-sm font-normal ml-2">({filtered.length})</span>
        </h3>
        <div className="flex items-center gap-4">
          <ExportCsvButton parts={filtered} />
          <button
            onClick={() => setShowAllParts(!showAllParts)}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition"
        >
          {showAllParts ? "Show flagged only" : "Show all"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="px-4 py-3 text-left text-neutral-400 font-medium cursor-pointer hover:text-white transition select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-neutral-400 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((part) => (
              <tr
                key={part.id}
                onClick={() => router.push(`/dashboard/part?id=${part.id}`)}
                className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3 text-white font-mono text-xs">#{part.id}</td>
                <td className="px-4 py-3 text-neutral-400 text-xs">{part.lotId}</td>
                <td className="px-4 py-3 text-white font-mono">{part.moduleA.if_score.toFixed(3)}</td>
                <td className="px-4 py-3 text-white font-mono">{part.moduleA.ecod_score.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`font-mono font-bold ${
                    part.moduleA.fused_score >= 0.75 ? "text-red-400" :
                    part.moduleA.fused_score >= 0.45 ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {part.moduleA.fused_score.toFixed(3)}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-300 font-mono text-xs">{part.lotPercentile}th</td>
                <td className="px-4 py-3"><Badge status={part.status} showIcon={false} /></td>
                <td className="px-4 py-3">
                  <ChevronRight className="h-4 w-4 text-neutral-600 group-hover:text-cyan-400 transition" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
