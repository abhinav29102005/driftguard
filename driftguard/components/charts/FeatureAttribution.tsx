"use client";

import { memo, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import type { ShapAttribution } from "@/lib/types";

interface FeatureAttributionProps {
  data: ShapAttribution[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;

  if (d.isTotal) {
    return (
      <div className="rounded-xl bg-neutral-900/95 border border-white/10 backdrop-blur-xl px-4 py-3 shadow-2xl">
        <p className="text-white text-xs font-bold mb-1">{d.feature}</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-400">Final Score:</span>
          <span className="font-mono font-bold text-white">{d.end.toFixed(3)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-neutral-900/95 border border-white/10 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <p className="text-white text-xs font-bold mb-1">{d.feature}</p>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-neutral-400">Impact:</span>
        <span className={`font-mono font-bold ${d.value > 0 ? "text-red-400" : "text-blue-400"}`}>
          {d.value > 0 ? "+" : ""}{d.value.toFixed(3)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs mt-1">
        <span className="text-neutral-500">Cumulative:</span>
        <span className="font-mono text-neutral-300">{d.end.toFixed(3)}</span>
      </div>
    </div>
  );
}

export const FeatureAttribution = memo(function FeatureAttribution({ data }: FeatureAttributionProps) {
  // Turn shap values into a waterfall dataset
  const waterfallData = useMemo(() => {
    // Sort by absolute impact descending
    const sorted = [...data].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    
    let current = 0.5; // Assume a base risk score of 0.5 for the waterfall start
    const result = [
      {
        feature: "Base Risk",
        isTotal: true,
        start: 0,
        end: current,
        value: current,
      }
    ];

    sorted.forEach(d => {
      const next = current + d.value;
      result.push({
        feature: d.feature,
        isTotal: false,
        start: Math.min(current, next),
        end: Math.max(current, next),
        value: d.value,
        
        
      });
      current = next;
    });

    result.push({
      feature: "Final Score",
      isTotal: true,
      start: 0,
      end: current,
      value: current,
    });

    return result;
  }, [data]);

  // We use a bar chart with a custom shape to draw the waterfall bar exactly where it needs to be
  const CustomBar = (props: any) => {
    const { x, y, width, height, payload, background } = props;
    if (payload.isTotal) {
      return <rect x={x} y={y} width={width} height={height} fill="#713f12" rx="4" ry="4" />;
    }
    // For midgle bars, they are either positive or negative
    const color = payload.value > 0 ? "#ef4444" : "#3b82f6";
    return <rect x={x} y={y} width={width} height={height} fill={color} rx="4" ry="4" />;
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={waterfallData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis
            type="number"
            hide
            domain={['minData', 'maxData']}
          />
          <YAxis
            type="category"
            dataKey="feature"
            stroke="#525252"
            tick={{ fill: "#d4d4d4", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="[start, end]" shape={<CustomBar />} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
 });
