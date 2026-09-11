"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, Play, CheckCircle2, AlertTriangle, Loader2,
  Database, Cpu, Brain, Radar, TrendingUp, Zap, BarChart3,
  ArrowRight, Sigma, ShieldCheck, Eye, Target, Activity,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { AnomalyScatter } from "@/components/charts/AnomalyScatter";
import { DriftTrend } from "@/components/charts/DriftTrend";
import { FlaggedPartsTable } from "@/components/dashboard/FlaggedPartsTable";
import type { PipelineResults, PipelineMetrics } from "@/lib/api";
import type { Part, Lot } from "@/lib/types";

/* ──── Pipeline stage definitions ──── */
const STAGES = [
  { key: "idle",     label: "Ready",                icon: FlaskConical, color: "text-neutral-400" },
  { key: "data",     label: "Generating ESS Data",  icon: Database,     color: "text-cyan-400" },
  { key: "features", label: "Feature Engineering",   icon: Sigma,        color: "text-indigo-400" },
  { key: "module_a", label: "Module A: IF + ECOD",  icon: Radar,        color: "text-purple-400" },
  { key: "module_b", label: "Module B: XGBoost",    icon: TrendingUp,   color: "text-amber-400" },
  { key: "shap",     label: "SHAP Explainability",  icon: Eye,          color: "text-emerald-400" },
  { key: "done",     label: "Complete",              icon: CheckCircle2, color: "text-emerald-400" },
];

export default function PipelinePage() {
  const router = useRouter();
  const [stage, setStage] = useState("idle");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PipelineResults | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Config
  const [seed, setSeed] = useState(42);
  const [anomalyRate, setAnomalyRate] = useState(0.06);

  const currentStageIdx = STAGES.findIndex((s) => s.key === stage);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResults(null);
    setStage("data");
    const t0 = Date.now();

    // Simulate visual stage progression while backend runs
    const stageTimers = [
      setTimeout(() => setStage("features"), 500),
      setTimeout(() => setStage("module_a"), 1200),
      setTimeout(() => setStage("module_b"), 2200),
      setTimeout(() => setStage("shap"), 3200),
    ];

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed, anomaly_rate: anomalyRate }),
      });

      stageTimers.forEach(clearTimeout);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data: PipelineResults = await res.json();
      setResults(data);
      setStage("done");
      setElapsed(Math.round((Date.now() - t0) / 100) / 10);
    } catch (e) {
      stageTimers.forEach(clearTimeout);
      setError(e instanceof Error ? e.message : "Pipeline failed");
      setStage("idle");
    } finally {
      setRunning(false);
    }
  }

  const metrics = results?.metrics;
  const flaggedParts = useMemo(
    () => (results?.parts ?? []).filter((p) => p.status !== "normal"),
    [results],
  );

  const scatterData = useMemo(
    () =>
      (results?.parts ?? []).map((p) => ({
        id: p.id,
        if_score: p.moduleA.if_score,
        ecod_score: p.moduleA.ecod_score,
        status: p.status,
      })),
    [results],
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FlaskConical className="h-6 w-6 text-cyan-400" />
          Live ML Pipeline
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Execute the full DriftGuard pipeline on-the-spot — data generation → Module A (IF+ECOD) → Module B (Arrhenius+XGBoost) → SHAP
        </p>
      </div>

      {/* Control Panel + Stage Progress */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Config & Run */}
        <Card className="!p-6">
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-cyan-400" />
            Pipeline Configuration
          </h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-neutral-400 text-xs block mb-1.5">Random Seed</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/40 transition"
                disabled={running}
              />
            </div>
            <div>
              <label className="text-neutral-400 text-xs block mb-1.5">Anomaly Rate</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="0.3"
                value={anomalyRate}
                onChange={(e) => setAnomalyRate(Number(e.target.value))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/40 transition"
                disabled={running}
              />
              <p className="text-neutral-600 text-[10px] mt-1">
                Fraction of parts with injected latent defects (default 6%)
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleRun}
            disabled={running}
            loading={running}
            className="w-full !py-3 !text-base"
          >
            {running ? "Running Pipeline..." : "Run Pipeline"}
            {!running && <Play className="h-4 w-4 ml-1" />}
          </Button>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              {error}
            </div>
          )}
        </Card>

        {/* Stage Progress */}
        <Card className="!p-6 xl:col-span-2">
          <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            Pipeline Stages
          </h3>

          <div className="space-y-3">
            {STAGES.filter((s) => s.key !== "idle").map((s, idx) => {
              const stageIdx = idx + 1; // skip "idle"
              const isActive = s.key === stage;
              const isComplete = currentStageIdx > stageIdx;
              const isPending = currentStageIdx < stageIdx;

              return (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-300 ${
                    isActive
                      ? "bg-white/10 border border-white/20 shadow-lg shadow-cyan-500/5"
                      : isComplete
                      ? "bg-emerald-500/5 border border-emerald-500/10"
                      : "bg-white/[0.02] border border-white/5"
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isActive ? "bg-cyan-500/20" : isComplete ? "bg-emerald-500/20" : "bg-white/5"
                  }`}>
                    {isActive && running ? (
                      <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
                    ) : isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <s.icon className={`h-5 w-5 ${isPending ? "text-neutral-600" : s.color}`} />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      isActive ? "text-white" : isComplete ? "text-emerald-400" : "text-neutral-500"
                    }`}>
                      {s.label}
                    </div>
                  </div>

                  {isActive && running && (
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {stage === "done" && metrics && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
            >
              <p className="text-emerald-400 text-sm font-medium">
                ✓ Pipeline completed in {metrics.execution_time_seconds ?? elapsed}s
              </p>
            </motion.div>
          )}
        </Card>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {results && metrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Metrics Cards */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-cyan-400" />
                Pipeline Metrics
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: "Total Parts", value: metrics.total_parts, icon: Cpu, color: "text-cyan-400" },
                  { label: "Injected Defects", value: metrics.total_anomalies_injected, icon: AlertTriangle, color: "text-amber-400" },
                  { label: "Flagged", value: metrics.total_flagged, icon: Radar, color: "text-red-400" },
                  { label: "Recall", value: `${(metrics.recall * 100).toFixed(1)}%`, icon: ShieldCheck, color: "text-emerald-400" },
                  { label: "Precision", value: `${(metrics.precision * 100).toFixed(1)}%`, icon: Target, color: "text-indigo-400" },
                  { label: "MAE (168h)", value: `±${metrics.mae_168h} µA`, icon: Sigma, color: "text-purple-400" },
                ].map((m) => (
                  <Card key={m.label} className="!p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <m.icon className={`h-4 w-4 ${m.color}`} />
                      <span className="text-neutral-500 text-[10px] uppercase tracking-wider">{m.label}</span>
                    </div>
                    <div className={`text-xl font-bold font-mono ${m.color}`}>{m.value}</div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Detection Confusion Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="!p-5 bg-emerald-500/5 border-emerald-500/10">
                <div className="text-neutral-400 text-xs mb-1">True Positives (defects caught)</div>
                <div className="text-emerald-400 text-3xl font-bold font-mono">{metrics.true_positives}</div>
              </Card>
              <Card className="!p-5 bg-red-500/5 border-red-500/10">
                <div className="text-neutral-400 text-xs mb-1">False Negatives (missed defects)</div>
                <div className="text-red-400 text-3xl font-bold font-mono">{metrics.false_negatives}</div>
              </Card>
              <Card className="!p-5 bg-amber-500/5 border-amber-500/10">
                <div className="text-neutral-400 text-xs mb-1">False Positives (false alarms)</div>
                <div className="text-amber-400 text-3xl font-bold font-mono">{metrics.false_positives}</div>
              </Card>
            </div>

            {/* Scatter + Table */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <div className="xl:col-span-3">
                <Card className="!p-6">
                  <h3 className="text-white font-semibold text-lg mb-2">Flagged Parts</h3>
                  <p className="text-neutral-500 text-xs mb-4">
                    {flaggedParts.length} parts flagged out of {results.parts.length} — click to drill down
                  </p>
                  <FlaggedPartsTable parts={results.parts} />
                </Card>
              </div>
              <div className="xl:col-span-2">
                <Card className="!p-6">
                  <h3 className="text-white font-semibold text-lg mb-2">IF × ECOD Anomaly Space</h3>
                  <p className="text-neutral-500 text-xs mb-4">
                    Fused anomaly detection scores from Module A
                  </p>
                  <AnomalyScatter
                    parts={scatterData}
                    onPartClick={(id) => router.push(`/dashboard/part?id=${id}`)}
                  />
                </Card>
              </div>
            </div>

            {/* Lot summaries */}
            <div>
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                Lot Drift Trends
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {results.lots.map((lot) => (
                  <Card key={lot.id} className="!p-4">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
