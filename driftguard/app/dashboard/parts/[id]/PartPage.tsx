"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { getPart, getOverridesForPart } from "@/lib/mockData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PhysicsCurve } from "@/components/charts/PhysicsCurve";
import { FeatureAttribution } from "@/components/charts/FeatureAttribution";
import { RiskGauge } from "@/components/dashboard/RiskGauge";
import { OverrideLog } from "@/components/dashboard/OverrideLog";
import { ArrowLeft, Zap, Radar, Blend, FlaskConical, TrendingUp } from "lucide-react";
import type { OverrideEntry } from "@/lib/types";

export default function PartDrillDown({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const part = getPart(id);
  const existingOverrides = getOverridesForPart(id);
  const [overrides, setOverrides] = useState<OverrideEntry[]>(existingOverrides);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!part) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-neutral-400 text-lg mb-4">Part #{id} not found</p>
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  function handleOverride(action: "accept" | "reject") {
    if (!reason.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      const entry: OverrideEntry = {
        id: `ov-${Date.now()}`,
        partId: part!.id,
        lotId: part!.lotId,
        action,
        operator: "Dr. Meera Krishnan",
        timestamp: new Date().toLocaleString(),
        reason: reason.trim(),
      };
      setOverrides([entry, ...overrides]);
      setReason("");
      setSubmitting(false);
    }, 600);
  }

  const scoreCards = [
    { label: "IF Score (O_IF)", value: part.moduleA.if_score.toFixed(3), icon: Radar, color: "text-cyan-400" },
    { label: "ECOD Score (O_ECOD)", value: part.moduleA.ecod_score.toFixed(2), icon: Zap, color: "text-indigo-400" },
    { label: "Fused Risk", value: part.moduleA.fused_score.toFixed(3), icon: Blend, color: part.moduleA.fused_score >= 0.75 ? "text-red-400" : part.moduleA.fused_score >= 0.45 ? "text-amber-400" : "text-emerald-400" },
    { label: "Physics Residual", value: `${part.moduleB.xgb_residual > 0 ? "+" : ""}${part.moduleB.xgb_residual.toFixed(2)} µA`, icon: FlaskConical, color: Math.abs(part.moduleB.xgb_residual) > 1 ? "text-red-400" : "text-emerald-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-lg hover:bg-white/5 transition"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-400" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Part #{part.id}</h1>
              <Badge status={part.status} />
            </div>
            <p className="text-neutral-500 text-sm mt-1">
              {part.lotId} · {part.lotPercentile}th percentile in lot
            </p>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {scoreCards.map((sc) => (
          <Card key={sc.label} className="!p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                <sc.icon className={`h-5 w-5 ${sc.color}`} />
              </div>
              <div>
                <div className={`text-xl font-bold font-mono ${sc.color}`}>{sc.value}</div>
                <div className="text-neutral-500 text-xs">{sc.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="!p-6">
          <h3 className="text-white font-semibold text-lg mb-1">Drift Trajectory</h3>
          <p className="text-neutral-500 text-xs mb-4">
            Actual leakage current vs. Arrhenius-predicted baseline
          </p>
          <PhysicsCurve data={part.timeSeries} unit="µA" />
        </Card>

        <Card className="!p-6">
          <h3 className="text-white font-semibold text-lg mb-1">Feature Attribution (SHAP/ECOD)</h3>
          <p className="text-neutral-500 text-xs mb-4">
            Per-feature contribution to the anomaly score
          </p>
          <FeatureAttribution data={part.shapValues} />
        </Card>
      </div>

      {/* Risk Gauge + Module B Detail */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="!p-6 flex items-center justify-center">
          <RiskGauge score={part.moduleA.fused_score} size={200} />
        </Card>

        <Card className="!p-6 xl:col-span-2">
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            Module B — Drift Prediction Detail
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-neutral-500 text-xs mb-1">Predicted 168h</div>
              <div className="text-white font-mono font-bold">{part.moduleB.final_predicted_168h.toFixed(2)} µA</div>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-neutral-500 text-xs mb-1">Physics Baseline 168h</div>
              <div className="text-white font-mono font-bold">{part.moduleB.physics_predicted_168h.toFixed(2)} µA</div>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-neutral-500 text-xs mb-1">XGB Residual</div>
              <div className="text-white font-mono font-bold">{part.moduleB.xgb_residual > 0 ? "+" : ""}{part.moduleB.xgb_residual.toFixed(2)} µA</div>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-neutral-500 text-xs mb-1">Predicted Slope</div>
              <div className="text-white font-mono font-bold">{part.moduleB.predicted_slope.toFixed(4)}</div>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-neutral-500 text-xs mb-1">µ_lot,slope + 2·σ</div>
              <div className="text-white font-mono font-bold">
                {(part.moduleB.lot_mean_slope + 2 * part.moduleB.lot_std_slope).toFixed(4)}
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-neutral-500 text-xs mb-1">Slope Exceeds?</div>
              <div className={`font-bold ${part.moduleB.slope_exceeds ? "text-red-400" : "text-emerald-400"}`}>
                {part.moduleB.slope_exceeds ? "YES — Flagged" : "No"}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Override Section */}
      <Card className="!p-6">
        <h3 className="text-white font-semibold text-lg mb-4">QA Override Decision</h3>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter justification for accept/reject decision..."
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500/40 transition resize-none h-20"
          />
          <div className="flex sm:flex-col gap-2">
            <Button
              variant="primary"
              onClick={() => handleOverride("accept")}
              disabled={!reason.trim()}
              loading={submitting}
            >
              Accept Part
            </Button>
            <Button
              variant="danger"
              onClick={() => handleOverride("reject")}
              disabled={!reason.trim()}
              loading={submitting}
            >
              Reject Part
            </Button>
          </div>
        </div>

        {overrides.length > 0 && <OverrideLog entries={overrides} />}
      </Card>
    </div>
  );
}
