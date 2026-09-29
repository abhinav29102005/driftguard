"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Database,
  FlaskConical,
  LayoutDashboard,
  Radar,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { useData } from "@/lib/DataContext";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PhysicsCurve } from "@/components/charts/PhysicsCurve";
import { FeatureAttribution } from "@/components/charts/FeatureAttribution";

type Workspace = "overview" | "detection" | "pipeline";

const navItems: { id: Workspace; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "detection", label: "Live detection", icon: Radar },
  { id: "pipeline", label: "Pipeline status", icon: Activity },
];

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "cyan",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  tone?: "cyan" | "red" | "green" | "slate";
}) {
  const tones = {
    cyan: "bg-cyan-50 text-cyan-700",
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <Card className="!p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function Overview({
  totalParts,
  flaggedParts,
  lots,
  recall,
  mae,
  onNavigate,
}: {
  totalParts: number;
  flaggedParts: number;
  lots: { id: string; name: string; riskLevel: "low" | "medium" | "high"; totalParts: number; flaggedCount: number; date: string }[];
  recall: number;
  mae: number;
  onNavigate: (workspace: Workspace) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-cyan-700">Screening workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Good morning, Dr. Krishnan</h1>
          <p className="mt-2 text-sm text-slate-500">Review the latest ESS screening activity and investigate exceptions.</p>
        </div>
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800">
          Open full console <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Parts screened" value={totalParts.toLocaleString()} detail="Across active lots" icon={Database} />
        <StatCard label="Needs review" value={flaggedParts.toString()} detail={`${((flaggedParts / Math.max(totalParts, 1)) * 100).toFixed(1)}% of screened parts`} icon={AlertTriangle} tone="red" />
        <StatCard label="Estimated recall" value={`${(recall * 100).toFixed(1)}%`} detail="Synthetic evaluation" icon={ShieldCheck} tone="green" />
        <StatCard label="Drift MAE" value={`±${mae} µA`} detail="168-hour prediction" icon={TrendingUp} tone="slate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="!p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Active screening lots</h2>
              <p className="mt-1 text-xs text-slate-500">Select a lot to inspect its risk profile.</p>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="divide-y divide-slate-100">
            {lots.map((lot) => (
              <Link key={lot.id} href={`/dashboard?lot=${lot.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${lot.riskLevel === "high" ? "bg-red-500" : lot.riskLevel === "medium" ? "bg-amber-500" : "bg-emerald-500"}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{lot.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{lot.totalParts} parts · {lot.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{lot.flaggedCount} flagged</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div>
            <div>
              <h2 className="font-semibold text-slate-900">System is ready</h2>
              <p className="text-xs text-slate-500">Static demo data is available</p>
            </div>
          </div>
          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
            <button onClick={() => onNavigate("detection")} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-3 text-left hover:bg-slate-50">
              <span className="flex items-center gap-2 text-slate-700"><Radar className="h-4 w-4 text-cyan-700" /> Inspect flagged parts</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
            <button onClick={() => onNavigate("pipeline")} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-3 text-left hover:bg-slate-50">
              <span className="flex items-center gap-2 text-slate-700"><FlaskConical className="h-4 w-4 text-cyan-700" /> Run a pipeline check</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Detection({ part }: { part: NonNullable<ReturnType<typeof useData>["parts"]>[number] | undefined }) {
  if (!part) return <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">No flagged parts are available.</div>;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-cyan-700">Live detection</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Part investigation</h1>
        <p className="mt-2 text-sm text-slate-500">A focused view of the highest-priority flagged component.</p>
      </div>
      <Card className="!p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Detection result</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Part #{part.id} <span className="font-normal text-slate-400">· {part.lotId}</span></h2>
          </div>
          <Badge status={part.status} />
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-4">
          {[
            ["IF score", part.moduleA.if_score.toFixed(3)],
            ["ECOD score", part.moduleA.ecod_score.toFixed(2)],
            ["Fused risk", part.moduleA.fused_score.toFixed(3)],
            ["Lot percentile", `${part.lotPercentile}th`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-2 font-mono text-lg font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 px-6 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Feature attribution</p>
          <FeatureAttribution data={part.shapValues} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-6 pt-4">
          <p className="text-sm text-slate-500">Review the full physics curve and audit history for this part.</p>
          <Link href={`/dashboard/part?id=${part.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-800">Open part details <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </Card>
    </div>
  );
}

function Pipeline() {
  const stages = ["Ingest ESS data", "Engineer lot features", "Run IF + ECOD detection", "Forecast drift with XGBoost", "Generate QA explanation"];
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-cyan-700">Pipeline status</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Screening pipeline</h1>
        <p className="mt-2 text-sm text-slate-500">Monitor each stage of the DriftGuard analysis workflow.</p>
      </div>
      <Card className="!p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div><h2 className="font-semibold text-slate-900">Latest run</h2><p className="mt-1 text-xs text-slate-500">Static results loaded · ready for review</p></div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><CircleDot className="h-3.5 w-3.5" /> Ready</span>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {stages.map((stage, index) => (
            <div key={stage} className="relative rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-bold text-cyan-700">0{index + 1}</span>
              <p className="mt-3 text-sm font-medium leading-snug text-slate-800">{stage}</p>
              {index < stages.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 bg-white text-slate-400 md:block" />}
            </div>
          ))}
        </div>
        <Link href="/dashboard/pipeline" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800">Open pipeline controls <ArrowRight className="h-4 w-4" /></Link>
      </Card>
    </div>
  );
}

export default function DriftGuardWorkspace() {
  const { parts, lots, metrics } = useData();
  const [workspace, setWorkspace] = useState<Workspace>("overview");
  const flaggedParts = useMemo(() => parts.filter((part) => part.status !== "normal"), [parts]);
  const selectedPart = flaggedParts[0] || parts[0];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-700"><Radar className="h-5 w-5 text-white" /></span>
          <span className="text-lg font-bold tracking-tight text-slate-900">DriftGuard</span>
        </Link>
        <div className="px-4 py-5">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Workspace</p>
          <nav className="mt-3 space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setWorkspace(id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${workspace === id ? "bg-cyan-50 text-cyan-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
                <Icon className="h-4.5 w-4.5" />{label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-slate-100 p-4">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><SlidersHorizontal className="h-4 w-4" /> Full QA console</Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500"><Search className="h-4 w-4" /> <span className="hidden sm:inline">DriftGuard workspace</span></div>
          <div className="flex items-center gap-3"><span className="hidden text-xs text-slate-500 sm:inline">Operator session</span><span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">MK</span></div>
        </header>
        <div className="border-b border-slate-200 bg-white px-5 py-3 lg:hidden">
          <div className="flex gap-2 overflow-x-auto">
            {navItems.map(({ id, label }) => <button key={id} onClick={() => setWorkspace(id)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${workspace === id ? "bg-cyan-50 text-cyan-800" : "text-slate-500"}`}>{label}</button>)}
          </div>
        </div>
        <section className="mx-auto max-w-7xl p-5 sm:p-8">
          {workspace === "overview" && <Overview totalParts={parts.length} flaggedParts={flaggedParts.length} lots={lots} recall={metrics?.recall ?? 0.984} mae={metrics?.mae_168h ?? 1.8} onNavigate={setWorkspace} />}
          {workspace === "detection" && <Detection part={selectedPart} />}
          {workspace === "pipeline" && <Pipeline />}
        </section>
      </div>
    </main>
  );
}
