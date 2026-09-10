"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getLots, getAllParts, getPartsForLot, getOverrideLog } from "@/lib/mockData";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { LotSelector } from "@/components/dashboard/LotSelector";
import { FlaggedPartsTable } from "@/components/dashboard/FlaggedPartsTable";
import { AnomalyScatter } from "@/components/charts/AnomalyScatter";
import { DriftTrend } from "@/components/charts/DriftTrend";
import { OverrideLog } from "@/components/dashboard/OverrideLog";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function DashboardOverview() {
  const router = useRouter();
  const lots = getLots();
  const allParts = getAllParts();
  const overrides = getOverrideLog();
  const [selectedLot, setSelectedLot] = useState("all");

  const activeParts = useMemo(() => {
    if (selectedLot === "all") return allParts;
    return getPartsForLot(selectedLot);
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
      {/* Lot Selector */}
      <LotSelector lots={lots} selectedId={selectedLot} onChange={setSelectedLot} />

      {/* KPI Stats */}
      <StatsRow
        totalParts={totalParts}
        flaggedParts={flaggedParts}
        estimatedRecall="98.4%"
        meanDriftMAE="±1.8µA"
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
