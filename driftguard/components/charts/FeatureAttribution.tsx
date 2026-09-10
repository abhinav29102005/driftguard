"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from "recharts";
import type { ShapAttribution } from "@/lib/types";

interface FeatureAttributionProps {
  data: ShapAttribution[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-xl bg-neutral-900/95 border border-white/10 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <p className="text-white text-xs font-bold mb-1">{d.feature}</p>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-neutral-400">Contribution:</span>
        <span className={`font-mono font-bold ${d.value > 0 ? "text-red-400" : "text-blue-400"}`}>
          {d.value > 0 ? "+" : ""}{d.value.toFixed(3)}
        </span>
      </div>
      <p className="text-neutral-500 text-[10px] mt-1">
        {d.value > 0 ? "Pushes toward anomaly" : "Pushes toward normal"}
      </p>
    </div>
  );
}

export function FeatureAttribution({ data }: FeatureAttributionProps) {
  const sorted = [...data].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis
            type="number"
            stroke="#525252"
            tick={{ fill: "#a3a3a3", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <YAxis
            type="category"
            dataKey="feature"
            stroke="#525252"
            tick={{ fill: "#d4d4d4", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {sorted.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.value > 0 ? "#ef4444" : "#3b82f6"}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
