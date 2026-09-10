"use client";

import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Cell,
} from "recharts";

interface ScatterPoint {
  id: string;
  if_score: number;
  ecod_score: number;
  status: "normal" | "warning" | "anomaly";
}

interface AnomalyScatterProps {
  parts: ScatterPoint[];
  onPartClick?: (partId: string) => void;
}

const statusColors = {
  normal: "#22c55e",
  warning: "#f59e0b",
  anomaly: "#ef4444",
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-xl bg-neutral-900/95 border border-white/10 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <p className="text-white text-xs font-bold mb-1">Part #{d.id}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-neutral-400">IF Score:</span>
          <span className="text-white font-mono">{d.if_score.toFixed(3)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-neutral-400">ECOD Score:</span>
          <span className="text-white font-mono">{d.ecod_score.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export function AnomalyScatter({ parts, onPartClick }: AnomalyScatterProps) {
  return (
    <div className="w-full h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="if_score"
            type="number"
            name="IF Score"
            domain={[0, 1]}
            stroke="#525252"
            tick={{ fill: "#a3a3a3", fontSize: 11 }}
            label={{ value: "IF Score (O_IF)", position: "insideBottom", offset: -5, fill: "#737373", fontSize: 11 }}
          />
          <YAxis
            dataKey="ecod_score"
            type="number"
            name="ECOD Score"
            stroke="#525252"
            tick={{ fill: "#a3a3a3", fontSize: 11 }}
            label={{ value: "ECOD Score (O_ECOD)", angle: -90, position: "insideLeft", fill: "#737373", fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0.6} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Scatter
            data={parts}
            onClick={(data: any) => onPartClick?.(data.id)}
            cursor="pointer"
          >
            {parts.map((p, i) => (
              <Cell key={i} fill={statusColors[p.status]} fillOpacity={0.8} r={5} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
