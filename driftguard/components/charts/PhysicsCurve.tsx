"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Area, ReferenceLine,
} from "recharts";
import type { TimeSeriesPoint } from "@/lib/types";

interface PhysicsCurveProps {
  data: TimeSeriesPoint[];
  unit?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const actual = payload.find((p: any) => p.dataKey === "actual")?.value;
  const predicted = payload.find((p: any) => p.dataKey === "predicted")?.value;
  const residual = actual && predicted ? (actual - predicted).toFixed(2) : "–";
  const pctDiv = actual && predicted ? (((actual - predicted) / predicted) * 100).toFixed(1) : "–";

  return (
    <div className="rounded-xl bg-neutral-900/95 border border-white/10 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <p className="text-neutral-400 text-xs mb-2 font-medium">{label}</p>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span className="text-neutral-300">Actual:</span>
          <span className="text-white font-mono font-bold">{actual?.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-400" />
          <span className="text-neutral-300">Arrhenius:</span>
          <span className="text-white font-mono font-bold">{predicted?.toFixed(2)}</span>
        </div>
        <div className="border-t border-white/10 mt-2 pt-2 flex items-center gap-2">
          <span className="text-neutral-400">Residual:</span>
          <span className={`font-mono font-bold ${Number(residual) > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {Number(residual) > 0 ? "+" : ""}{residual} ({pctDiv}%)
          </span>
        </div>
      </div>
    </div>
  );
}

export function PhysicsCurve({ data, unit = "µA" }: PhysicsCurveProps) {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="t"
            stroke="#525252"
            tick={{ fill: "#a3a3a3", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <YAxis
            stroke="#525252"
            tick={{ fill: "#a3a3a3", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            label={{ value: unit, angle: -90, position: "insideLeft", fill: "#737373", fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#a855f7"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ fill: "#a855f7", r: 3 }}
            name="Arrhenius Predicted"
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#22d3ee"
            strokeWidth={2.5}
            dot={{ fill: "#22d3ee", r: 4, strokeWidth: 2, stroke: "#0e7490" }}
            name="Actual"
            activeDot={{ r: 6, fill: "#22d3ee", stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
