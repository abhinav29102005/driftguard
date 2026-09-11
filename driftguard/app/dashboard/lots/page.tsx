"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DriftTrend } from "@/components/charts/DriftTrend";
import { BarChart3, Cpu, AlertTriangle, Wifi, WifiOff, Loader2 } from "lucide-react";
import type { Part, Lot } from "@/lib/types";
import type { PipelineResults } from "@/lib/api";

export default function LotAnalytics() {
  const router = useRouter();

  const [lots, setLots] = useState<Lot[]>([]);
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [dataSource, setDataSource] = useState<"loading" | "api" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const res = await fetch("/api/results");
        if (!res.ok) throw new Error("API error");
        const data: PipelineResults = await res.json();
        if (cancelled) return;
        if (data.parts && data.lots) {
          setLots(data.lots);
          setAllParts(data.parts);
          setDataSource("api");
        } else {
          setDataSource("error");
        }
      } catch {
        if (!cancelled) setDataSource("error");
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const totalParts = allParts.length;
  const totalFlagged = allParts.filter((p) => p.status !== "normal").length;
  const flaggedRate = ((totalFlagged / totalParts) * 100).toFixed(1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-cyan-400" />
          Lot Analytics
        </h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-neutral-500 text-sm">
            Overview of all screening lots and their drift characteristics
          </p>
          {dataSource === "loading" ? (
            <span className="flex items-center gap-1 text-neutral-500 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
            </span>
          ) : dataSource === "api" ? (
            <span className="flex items-center gap-1 text-emerald-400 text-xs">
              <Wifi className="h-3 w-3" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 text-xs">
              <WifiOff className="h-3 w-3" /> Demo
            </span>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="!p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-white font-bold text-2xl">{lots.length}</div>
              <div className="text-neutral-500 text-xs">Total Lots</div>
            </div>
          </div>
        </Card>
        <Card className="!p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
              <Cpu className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-white font-bold text-2xl">{totalParts}</div>
              <div className="text-neutral-500 text-xs">Total Parts</div>
            </div>
          </div>
        </Card>
        <Card className="!p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <div className="text-white font-bold text-2xl">{totalFlagged} ({flaggedRate}%)</div>
              <div className="text-neutral-500 text-xs">Flagged Across All Lots</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Lot Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {lots.map((lot) => (
          <Card
            key={lot.id}
            className="!p-6 hover:border-cyan-500/20 transition-colors group"
            onClick={() => router.push(`/dashboard?lot=${lot.id}`)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">{lot.name}</h3>
              <Badge
                status={lot.riskLevel === "high" ? "anomaly" : lot.riskLevel === "medium" ? "warning" : "normal"}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <div className="text-neutral-500 text-[10px]">Parts</div>
                <div className="text-white font-bold text-lg">{lot.totalParts}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <div className="text-neutral-500 text-[10px]">Flagged</div>
                <div className="text-red-400 font-bold text-lg">{lot.flaggedCount}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <div className="text-neutral-500 text-[10px]">Warning</div>
                <div className="text-amber-400 font-bold text-lg">{lot.warningCount}</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-neutral-500 text-xs mb-2">Mean Leakage Drift (0h → 168h)</div>
              <DriftTrend data={lot.driftTrend} />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div>
                <span className="text-neutral-500 text-xs">Mean Fused Score: </span>
                <span className="text-white font-mono text-sm font-bold">{lot.meanFusedScore.toFixed(3)}</span>
              </div>
              <span className="text-neutral-600 text-xs">{lot.date}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
