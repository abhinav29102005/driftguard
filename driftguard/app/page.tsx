"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import {
  Brain, Radar, TrendingUp, ShieldCheck, GitBranch, LayoutDashboard,
  AlertTriangle, CheckCircle2, Zap, Database, FlaskConical, Sigma,
  ArrowRight, Cpu, Gauge, FileWarning, Eye, Rocket, ChevronRight,
  Activity, BarChart3, Target,
} from "lucide-react";
import type { PipelineResults } from "@/lib/api";
import type { Part, Lot } from "@/lib/types";
import { PhysicsCurve } from "@/components/charts/PhysicsCurve";
import { FeatureAttribution } from "@/components/charts/FeatureAttribution";
import { Badge } from "@/components/ui/Badge";

/* ================================================================ */
/*  Utility sub-components                                          */
/* ================================================================ */

/* ---------- 3D Tilt Card (Aceternity-style) ---------- */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [12, -12]), { stiffness: 150, damping: 15 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-12, 12]), { stiffness: 150, damping: 15 });

  function handleMouse(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }
  function reset() { x.set(0); y.set(0); }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`relative rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-xl p-6 shadow-2xl ${className}`}
    >
      <div style={{ transform: "translateZ(40px)" }}>{children}</div>
    </motion.div>
  );
}

/* ---------- Spotlight background ---------- */
function Spotlight() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 animate-spotlight rounded-full bg-gradient-to-r from-cyan-500/30 via-indigo-500/20 to-purple-500/30 blur-3xl" />
    </div>
  );
}

/* ---------- Animated counter ---------- */
function AnimatedCounter({ target, suffix = "", prefix = "", duration = 2000 }: {
  target: number; suffix?: string; prefix?: string; duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !hasStarted) setHasStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(interval); }
      else setCount(Math.floor(current * 10) / 10);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [hasStarted, target, duration]);

  const display = Number.isInteger(target) ? Math.round(count) : count.toFixed(1);
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

/* ---------- Bento feature card ---------- */
function FeatureCard({
  icon: Icon, title, desc, accent, span = "",
}: { icon: React.ElementType; title: string; desc: string; accent: string; span?: string }) {
  return (
    <TiltCard className={`group hover:border-white/20 transition-colors ${span}`}>
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${accent} mb-4`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-1.5">{title}</h3>
      <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
    </TiltCard>
  );
}

/* ---------- Metric pill with animated counter ---------- */
function Metric({ label, value, numericValue, suffix, prefix, icon: Icon }: {
  label: string; value?: string; numericValue?: number; suffix?: string; prefix?: string; icon: React.ElementType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4"
    >
      <Icon className="h-5 w-5 text-cyan-400 shrink-0" />
      <div>
        <div className="text-white font-bold text-xl leading-none">
          {numericValue !== undefined
            ? <AnimatedCounter target={numericValue} suffix={suffix} prefix={prefix} />
            : value}
        </div>
        <div className="text-neutral-500 text-xs mt-1">{label}</div>
      </div>
    </motion.div>
  );
}

/* ---------- Pipeline step ---------- */
function PipelineStep({ n, title, sub, delay }: { n: number; title: string; sub: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: delay || 0 }}
      className="flex items-start gap-4"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-white text-sm font-bold">
        {n}
      </div>
      <div>
        <p className="text-white font-medium text-sm">{title}</p>
        <p className="text-neutral-500 text-xs mt-0.5">{sub}</p>
      </div>
    </motion.div>
  );
}

/* ---------- Floating particle grid background ---------- */
function GridBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(34,211,238,0.15) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}

/* ================================================================ */
/*  Main Page                                                       */
/* ================================================================ */
export default function DriftGuardLanding() {
  const [tab, setTab] = useState<"A" | "B">("A");
  const router = useRouter();

  // Pull real data from mock
  // State: initially mock, update from API
  const [flaggedParts, setFlaggedParts] = useState<any[]>([]);
  const [allParts, setAllParts] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [apiMetrics, setApiMetrics] = useState<{ recall: number; mae_168h: number } | null>(null);

  // Fetch from API on mount
  useEffect(() => {
    let cancelled = false;
    async function loadApi() {
      try {
        const res = await fetch("/api/results");
        if (!res.ok) return;
        const data: PipelineResults = await res.json();
        if (cancelled || !data.parts) return;
        setAllParts(data.parts);
        setFlaggedParts(data.parts.filter((p) => p.status !== "normal"));
        setLots(data.lots);
        if (data.metrics) setApiMetrics({ recall: data.metrics.recall, mae_168h: data.metrics.mae_168h });
      } catch { /* keep mock */ }
    }
    loadApi();
    return () => { cancelled = true; };
  }, []);

  // Pick a real flagged anomaly part for Module A demo
  const moduleAPart = useMemo(() => {
    return flaggedParts.find((p) => p.status === "anomaly") || flaggedParts[0];
  }, [flaggedParts]);

  // Pick a real warning/slope-exceeds part for Module B demo
  const moduleBPart = useMemo(() => {
    return flaggedParts.find((p) => p.moduleB.slope_exceeds && p.status !== "normal") || flaggedParts[1];
  }, [flaggedParts]);

  const activeDemoPart = tab === "A" ? moduleAPart : moduleBPart;

  // Compute real stats
  const totalScreened = allParts.length;
  const totalFlagged = flaggedParts.length;
  const recallPct = apiMetrics ? apiMetrics.recall * 100 : 98.4;
  const meanMAE = apiMetrics ? apiMetrics.mae_168h : 1.8;

  // Top ECOD feature for Module A part
  const topEcodFeature = moduleAPart
    ? Object.entries(moduleAPart.moduleA.ecod_per_feature)
        .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))[0]
    : null;

  return (
    <main className="min-h-screen bg-black selection:bg-cyan-500/30">
      {/* ──── Navbar ──── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600">
              <Radar className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-white font-bold tracking-tight text-lg">DriftGuard</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
            <a href="#modules" className="hover:text-white transition">Modules</a>
            <a href="#pipeline" className="hover:text-white transition">Pipeline</a>
            <a href="#detection" className="hover:text-white transition">Live Detection</a>
            <a href="#tech" className="hover:text-white transition">Tech Stack</a>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-sm font-medium px-5 py-2 hover:opacity-90 transition shadow-lg shadow-cyan-500/20"
          >
            Launch QA Console
          </Link>
        </div>
      </nav>

      {/* ──── Hero ──── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
        <Spotlight />
        <GridBackground />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-neutral-300"
          >
            <Zap className="h-3.5 w-3.5 text-cyan-400" /> Smart India Hackathon 2026 · PS 26170 · ISRO
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05]"
          >
            Catch defects the
            <span className="block bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              datasheet limit can&apos;t see.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed"
          >
            AI-driven lot-relative anomaly detection and physics-informed drift forecasting
            for ESS burn-in screening — explains every flag to QA engineers with
            per-feature attribution and Arrhenius trajectory overlays.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex items-center justify-center gap-4 flex-wrap"
          >
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-7 py-3.5 text-white font-medium hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
            >
              Open QA Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#modules"
              className="rounded-full border border-white/15 px-7 py-3.5 text-neutral-300 hover:border-white/30 hover:text-white transition"
            >
              Explore Architecture
            </a>
          </motion.div>

          {/* Live counter strip inline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-16 flex items-center justify-center gap-8 md:gap-12 text-center flex-wrap"
          >
            <div>
              <div className="text-white font-bold text-2xl md:text-3xl font-mono">
                <AnimatedCounter target={totalScreened} />
              </div>
              <div className="text-neutral-500 text-xs mt-1">Parts screened</div>
            </div>
            <div className="h-8 w-px bg-white/10 hidden md:block" />
            <div>
              <div className="text-red-400 font-bold text-2xl md:text-3xl font-mono">
                <AnimatedCounter target={totalFlagged} />
              </div>
              <div className="text-neutral-500 text-xs mt-1">Flagged for review</div>
            </div>
            <div className="h-8 w-px bg-white/10 hidden md:block" />
            <div>
              <div className="text-emerald-400 font-bold text-2xl md:text-3xl font-mono">
                <AnimatedCounter target={recallPct} suffix="%" />
              </div>
              <div className="text-neutral-500 text-xs mt-1">Recall (synthetic eval)</div>
            </div>
            <div className="h-8 w-px bg-white/10 hidden md:block" />
            <div>
              <div className="text-purple-400 font-bold text-2xl md:text-3xl font-mono">
                ±<AnimatedCounter target={meanMAE} suffix="µA" />
              </div>
              <div className="text-neutral-500 text-xs mt-1">168h drift MAE</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──── Metrics strip ──── */}
      <section className="border-y border-white/10 bg-neutral-950">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 py-10 md:grid-cols-4">
          <Metric label="Detection latency / lot" value="< 2s" icon={Gauge} />
          <Metric label={`${lots.length} lots screened`} numericValue={totalScreened} suffix=" parts" icon={Cpu} />
          <Metric label="Drift prediction accuracy" prefix="±" numericValue={meanMAE} suffix="µA" icon={Sigma} />
          <Metric label="Screening time saved" value="~40%" icon={TrendingUp} />
        </div>
      </section>

      {/* ──── Feature Bento Grid ──── */}
      <section id="modules" className="mx-auto max-w-7xl px-6 py-28">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-white text-center mb-3"
        >
          Two modules. One explainable risk score.
        </motion.h2>
        <p className="text-neutral-500 text-center mb-14 max-w-xl mx-auto">
          Every part gets a fused, lot-relative score — not an absolute-limit pass/fail.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Brain} title="Module A — Fused Outlier Score"
            desc="Isolation Forest catches multivariate pattern drift; ECOD catches per-parameter tail anomalies — parameter-free, O(n·d log n)."
            accent="bg-gradient-to-br from-cyan-500 to-blue-600" span="md:col-span-2"
          />
          <FeatureCard
            icon={FlaskConical} title="Physics Baseline"
            desc="Arrhenius / log-linear extrapolation grounds every drift forecast in reliability-engineering theory."
            accent="bg-gradient-to-br from-purple-500 to-fuchsia-600"
          />
          <FeatureCard
            icon={GitBranch} title="Per-Lot Normalization"
            desc="MAD-based robust z-scoring per lot per timestamp — the mechanism that makes detection dynamic, not static."
            accent="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <FeatureCard
            icon={TrendingUp} title="Module B — Drift Predictor"
            desc="XGBoost residual correction on top of the physics baseline forecasts val_168h from val_0h + val_24h, MAE-optimized."
            accent="bg-gradient-to-br from-orange-500 to-amber-600" span="md:col-span-2"
          />
          <FeatureCard
            icon={Eye} title="SHAP Explainability"
            desc="Every flag decomposes into per-feature contribution — never a black-box score."
            accent="bg-gradient-to-br from-indigo-500 to-violet-600"
          />
          <FeatureCard
            icon={Target} title="Recall-First Threshold"
            desc="Tuned via PR curve — false negatives (missed defects) cost far more than false positives in mission-critical hardware."
            accent="bg-gradient-to-br from-red-500 to-rose-600"
          />
          <FeatureCard
            icon={Database} title="Synthetic Injection Validation"
            desc="Threshold calibration on synthetically injected drift patterns — detector itself stays unsupervised."
            accent="bg-gradient-to-br from-sky-500 to-cyan-600"
          />
          <FeatureCard
            icon={LayoutDashboard} title="QA Dashboard"
            desc="Flagged parts, physics-curve overlay, lot percentile, accept/reject override log — all in one interactive console."
            accent="bg-gradient-to-br from-pink-500 to-rose-600" span="md:col-span-2"
          />
        </div>
      </section>

      {/* ──── Pipeline ──── */}
      <section id="pipeline" className="border-t border-white/10 bg-neutral-950 py-28">
        <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-white mb-8"
            >
              End-to-end pipeline
            </motion.h2>
            <div className="space-y-7">
              <PipelineStep n={1} title="Ingest & normalize" sub="Raw ESS logs → per-lot MAD z-score + log-transform" delay={0.1} />
              <PipelineStep n={2} title="Feature decorrelation" sub="val_0h, early/mid/late slopes — not raw correlated timestamps" delay={0.2} />
              <PipelineStep n={3} title="Module A ‖ Module B" sub="IF + ECOD fused score, parallel to physics + XGBoost forecast" delay={0.3} />
              <PipelineStep n={4} title="Risk fusion" sub="Weighted combine → single explainable risk flag" delay={0.4} />
              <PipelineStep n={5} title="SHAP + physics overlay" sub="QA-facing justification, not a black-box number" delay={0.5} />
            </div>
          </div>
          <TiltCard>
            <Cpu className="h-8 w-8 text-cyan-400 mb-4" />
            <h3 className="text-white font-semibold mb-2">O(n·d log n) at fab-lot scale</h3>
            <p className="text-neutral-400 text-sm mb-5">
              ECOD and Isolation Forest both scale linearly-ish in features and log-linearly
              in lot size — unlike LOF&apos;s O(n²), this holds up on large ESS datasets.
            </p>
            <div className="rounded-lg bg-black/40 border border-white/10 p-4 font-mono text-xs text-cyan-300 space-y-1">
              <div>O(x) = Σⱼ −log(min(F̂ₗ(xⱼ), F̂ᵣ(xⱼ)))</div>
              <div className="text-neutral-500">{"// ECOD: sum of per-feature tail-probabilities"}</div>
              <div className="mt-2">O_IF(x) = 2^(−E[h(x)] / c(n))</div>
              <div className="text-neutral-500">{"// Isolation Forest: path-length anomaly score"}</div>
              <div className="mt-2 text-amber-300">flag if 0.45·norm(O_IF) + 0.55·norm(O_ECOD) ≥ τ</div>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ──── Live Detection Demo (Real Data) ──── */}
      <section id="detection" className="mx-auto max-w-6xl px-6 py-28">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-white text-center mb-3"
        >
          See it flag a real part
        </motion.h2>
        <p className="text-neutral-500 text-center mb-10 max-w-lg mx-auto">
          Live data from the screening pipeline. Click a module to see its detection output.
        </p>

        {/* Module tabs */}
        <div className="flex justify-center gap-3 mb-8">
          {(["A", "B"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
                tab === t
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20"
                  : "bg-white/5 text-neutral-400 border border-white/10 hover:border-white/20"
              }`}
            >
              Module {t} {t === "A" ? "— Outlier Detection" : "— Drift Prediction"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "A" && moduleAPart && (
            <motion.div
              key="moduleA"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <TiltCard className="mx-auto max-w-4xl">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-300 text-sm font-mono">Part #{moduleAPart.id}</span>
                    <span className="text-neutral-600">·</span>
                    <span className="text-neutral-400 text-sm">{moduleAPart.lotId}</span>
                  </div>
                  <Badge status={moduleAPart.status} />
                </div>

                {/* Score cards */}
                <div className="grid grid-cols-4 gap-3 text-center mb-6">
                  <div className="rounded-lg bg-white/5 p-3">
                    <div className="text-neutral-500 text-xs">O_IF</div>
                    <div className="text-white font-bold font-mono">{moduleAPart.moduleA.if_score.toFixed(3)}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <div className="text-neutral-500 text-xs">O_ECOD</div>
                    <div className="text-white font-bold font-mono">{moduleAPart.moduleA.ecod_score.toFixed(2)}</div>
                  </div>
                  <div className="rounded-lg bg-cyan-500/10 p-3 border border-cyan-500/20">
                    <div className="text-cyan-400 text-xs">Fused Score</div>
                    <div className="text-white font-bold font-mono">{moduleAPart.moduleA.fused_score.toFixed(3)}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <div className="text-neutral-500 text-xs">Lot Percentile</div>
                    <div className="text-white font-bold font-mono">{moduleAPart.lotPercentile}th</div>
                  </div>
                </div>

                {/* SHAP Attribution */}
                <div className="mb-4">
                  <h4 className="text-neutral-400 text-xs font-medium mb-3 uppercase tracking-wider">SHAP / ECOD Feature Attribution</h4>
                  <FeatureAttribution data={moduleAPart.shapValues} />
                </div>

                <p className="text-neutral-400 text-sm leading-relaxed">
                  {topEcodFeature && (
                    <>
                      Driver: <span className="text-white font-medium">{topEcodFeature[0]}</span> contributed{" "}
                      <span className="text-cyan-400 font-mono">{(topEcodFeature[1] as number).toFixed(1)}</span> of{" "}
                      <span className="text-cyan-400 font-mono">{moduleAPart.moduleA.ecod_score.toFixed(1)}</span> total
                      ECOD score — this part sits at the <span className="text-white">{moduleAPart.lotPercentile}th percentile</span> within
                      its lot&apos;s distribution.
                    </>
                  )}
                </p>
              </TiltCard>
            </motion.div>
          )}

          {tab === "B" && moduleBPart && (
            <motion.div
              key="moduleB"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <TiltCard className="mx-auto max-w-4xl">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-300 text-sm font-mono">Part #{moduleBPart.id}</span>
                    <span className="text-neutral-600">·</span>
                    <span className="text-neutral-400 text-sm">{moduleBPart.lotId}</span>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs px-3 py-1 border border-amber-500/20">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {moduleBPart.moduleB.slope_exceeds ? "Slope exceeds safety threshold" : "Warning — elevated drift"}
                  </span>
                </div>

                {/* Physics Curve */}
                <div className="mb-6">
                  <h4 className="text-neutral-400 text-xs font-medium mb-3 uppercase tracking-wider">
                    Leakage Current — Actual vs Arrhenius Prediction
                  </h4>
                  <PhysicsCurve data={moduleBPart.timeSeries} unit="µA" />
                </div>

                {/* Module B metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="rounded-lg bg-white/5 p-3 text-center">
                    <div className="text-neutral-500 text-xs">Predicted 168h</div>
                    <div className="text-white font-bold font-mono">{moduleBPart.moduleB.final_predicted_168h.toFixed(2)}µA</div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3 text-center">
                    <div className="text-neutral-500 text-xs">Physics Baseline</div>
                    <div className="text-white font-bold font-mono">{moduleBPart.moduleB.physics_predicted_168h.toFixed(2)}µA</div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3 text-center">
                    <div className="text-neutral-500 text-xs">XGB Residual</div>
                    <div className="text-white font-bold font-mono">
                      {moduleBPart.moduleB.xgb_residual > 0 ? "+" : ""}{moduleBPart.moduleB.xgb_residual.toFixed(2)}µA
                    </div>
                  </div>
                  <div className={`rounded-lg p-3 text-center ${
                    moduleBPart.moduleB.slope_exceeds
                      ? "bg-red-500/10 border border-red-500/20"
                      : "bg-white/5"
                  }`}>
                    <div className={`text-xs ${moduleBPart.moduleB.slope_exceeds ? "text-red-400" : "text-neutral-500"}`}>
                      Slope Check
                    </div>
                    <div className={`font-bold ${moduleBPart.moduleB.slope_exceeds ? "text-red-400" : "text-emerald-400"}`}>
                      {moduleBPart.moduleB.slope_exceeds ? "EXCEEDS" : "PASS"}
                    </div>
                  </div>
                </div>

                <p className="text-neutral-400 text-sm leading-relaxed">
                  Predicted slope: <span className="text-white font-mono">{moduleBPart.moduleB.predicted_slope.toFixed(4)}</span>{" "}
                  vs. lot threshold (µ + 2σ):{" "}
                  <span className="text-white font-mono">
                    {(moduleBPart.moduleB.lot_mean_slope + 2 * moduleBPart.moduleB.lot_std_slope).toFixed(4)}
                  </span>
                  {moduleBPart.moduleB.slope_exceeds
                    ? " — XGBoost residual correction pushes predicted drift past the safety threshold. Flagged for early rejection."
                    : " — drift within normal lot bounds."
                  }
                </p>
              </TiltCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Link to full dashboard */}
        <div className="flex justify-center mt-8">
          <Link
            href={activeDemoPart ? `/dashboard/part?id=${activeDemoPart.id}` : "/dashboard"}
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition group"
          >
            View full drill-down for this part
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ──── Tech Stack ──── */}
      <section id="tech" className="border-t border-white/10 bg-neutral-950 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Tech Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Python", sub: "Core pipeline" },
              { name: "PyOD", sub: "ECOD + Isolation Forest" },
              { name: "XGBoost", sub: "Residual regression" },
              { name: "SHAP", sub: "Explainability" },
              { name: "scikit-learn", sub: "Preprocessing" },
              { name: "NumPy / Pandas", sub: "Feature engine" },
              { name: "Next.js", sub: "QA Dashboard" },
              { name: "Recharts", sub: "Visualizations" },
            ].map((t) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center hover:border-white/20 transition"
              >
                <div className="text-white font-semibold text-sm">{t.name}</div>
                <div className="text-neutral-500 text-xs mt-1">{t.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Flagged Parts Preview ──── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Recently Flagged</h2>
            <p className="text-neutral-500 text-sm mt-1">
              Top flagged parts across {lots.length} lots — click to drill down
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-4 py-3 text-left text-neutral-400 font-medium">Part ID</th>
                <th className="px-4 py-3 text-left text-neutral-400 font-medium">Lot</th>
                <th className="px-4 py-3 text-left text-neutral-400 font-medium">IF Score</th>
                <th className="px-4 py-3 text-left text-neutral-400 font-medium">ECOD Score</th>
                <th className="px-4 py-3 text-left text-neutral-400 font-medium">Fused</th>
                <th className="px-4 py-3 text-left text-neutral-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {flaggedParts.slice(0, 6).map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/dashboard/part?id=${p.id}`)}
                    className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-white font-mono text-xs">#{p.id}</td>
                    <td className="px-4 py-3 text-neutral-400 text-xs">{p.lotId}</td>
                    <td className="px-4 py-3 text-white font-mono">{p.moduleA.if_score.toFixed(3)}</td>
                    <td className="px-4 py-3 text-white font-mono">{p.moduleA.ecod_score.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold ${
                        p.moduleA.fused_score >= 0.75 ? "text-red-400" :
                        p.moduleA.fused_score >= 0.45 ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        {p.moduleA.fused_score.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-4 py-3"><Badge status={p.status} showIcon={false} /></td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section className="border-t border-white/10 py-24 text-center relative overflow-hidden">
        <GridBackground />
        <div className="relative z-10">
          <Rocket className="h-8 w-8 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-3">Ready for mission assurance.</h2>
          <p className="text-neutral-500 mb-8 max-w-md mx-auto">
            Built for ISRO&apos;s ESS pipelines — extensible to defense, aviation, and medical device screening.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-8 py-3.5 text-white font-medium hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
          >
            <LayoutDashboard className="h-4 w-4" /> Launch QA Console
          </Link>
        </div>
      </section>
    </main>
  );
}
