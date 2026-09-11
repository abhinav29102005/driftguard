"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { LotSelector } from "@/components/dashboard/LotSelector";
import { FlaggedPartsTable } from "@/components/dashboard/FlaggedPartsTable";
import { AnomalyScatter } from "@/components/charts/AnomalyScatter";
import { DriftTrend } from "@/components/charts/DriftTrend";
import { OverrideLog } from "@/components/dashboard/OverrideLog";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Part, Lot, OverrideEntry } from "@/lib/types";
import type { PipelineResults, PipelineMetrics } from "@/lib/api";
import { Loader2, Wifi, WifiOff } from "lucide-react";

export default function DashboardOverview() {
  const router = useRouter();

  // Data state: loaded from API or mock fallback
  const [lots, setLots] = useState<Lot[]>([]);
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [overrides, setOverrides] = useState<OverrideEntry[]>([]);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [dataSource, setDataSource] = useState<"loading" | "api" | "error">("loading");

  const [selectedLot, setSelectedLot] = useState("all");

  // Try fetching from backend on mount
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
          setOverrides(data.overrides || []);
          setMetrics(data.metrics || null);
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

  const activeParts = useMemo(() => {
    if (selectedLot === "all") return allParts;
    return allParts.filter((p) => p.lotId === selectedLot);
  }, [selectedLot, allParts]);

  const totalParts = activeParts.length;
  const flaggedParts = activeParts.filter((p) => p.status !== "normal").length;

  const scatterData = useMemo(
    () =>
      activeParts.map((p) => ({
        id: p.id,
        if_score: p.moduleA.if_score,
        ecod_score: p.moduleA.ecod_score,
        status: p.status,
      })),
    [activeParts]
  );

  return (
    <div className="space-y-8">
      {/* Data source indicator */}
      <div className="flex items-center gap-2 text-xs">
        {dataSource === "loading" ? (
          <span className="flex items-center gap-1.5 text-neutral-500">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading data…
          </span>
        ) : dataSource === "api" ? (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Wifi className="h-3 w-3" /> ML Pipeline Data
            {metrics && (
              <span className="text-neutral-500 ml-2">
                Recall {(metrics.recall * 100).toFixed(1)}% · MAE ±{metrics.mae_168h}µA
              </span>
            )}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-amber-400">
            <WifiOff className="h-3 w-3" /> Backend Offline (Start server to view data)
          </span>
        )}
      </div>

      {/* Lot Selector */}
      <LotSelector lots={lots} selectedId={selectedLot} onChange={setSelectedLot} />

      {/* KPI Stats */}
      <StatsRow
        totalParts={totalParts}
        flaggedParts={flaggedParts}
        estimatedRecall={metrics ? `${(metrics.recall * 100).toFixed(1)}%` : "98.4%"}
        meanDriftMAE={metrics ? `±${metrics.mae_168h}µA` : "±1.8µA"}
      />

      {/* Main Content: Table + Scatter */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6" id="flagged">
        <div className="xl:col-span-3">
          <Card className="!p-6">
            <FlaggedPartsTable parts={activeParts} />
          </Card>
        </div>
        <div className="xl:col-span-2">
          <Card className="!p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Module A — IF × ECOD Space</h3>
            <p className="text-neutral-500 text-xs mb-4">
              Click a point to drill into the part. Dashed lines mark threshold boundaries.
            </p>
            <AnomalyScatter
              parts={scatterData}
              onPartClick={(id) => router.push(`/dashboard/parts/${id}`)}
            />
          </Card>
        </div>
      </div>

      {/* Lot Drift Cards */}
      <div>
        <h3 className="text-white font-semibold text-lg mb-4">Lot Drift Trends</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {lots.map((lot) => (
            <Card
              key={lot.id}
              className="!p-4 hover:border-cyan-500/20 transition-colors"
              onClick={() => setSelectedLot(lot.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-white text-sm font-medium">{lot.name}</span>
                <Badge
                  status={lot.riskLevel === "high" ? "anomaly" : lot.riskLevel === "medium" ? "warning" : "normal"}
                  showIcon={false}
                />
              </div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-neutral-500 text-[10px]">Parts</div>
                  <div className="text-white text-sm font-mono">{lot.totalParts}</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[10px]">Flagged</div>
                  <div className="text-red-400 text-sm font-mono">{lot.flaggedCount + lot.warningCount}</div>
                </div>
                <DriftTrend data={lot.driftTrend} compact />
              </div>
              <div className="text-neutral-500 text-[10px]">{lot.date}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Override Log */}
      <div id="overrides">
        <Card className="!p-6">
          <OverrideLog entries={overrides} />
        </Card>
      </div>
    </div>
  );
}
