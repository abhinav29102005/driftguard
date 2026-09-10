"use client";

import { useEffect, useState } from "react";

interface RiskGaugeProps {
  score: number; // 0–1
  size?: number;
}

export function RiskGauge({ score, size = 180 }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - 24) / 2;
  const strokeWidth = 10;
  const startAngle = 135;
  const sweepAngle = 270;

  const circumference = (sweepAngle / 360) * 2 * Math.PI * r;
  const progress = circumference * (1 - animatedScore);

  // Color based on score
  const getColor = (s: number) => {
    if (s < 0.4) return "#22c55e";
    if (s < 0.7) return "#f59e0b";
    return "#ef4444";
  };

  const color = getColor(score);

  // Arc path
  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => ({
    x: cx + r * Math.cos((angle * Math.PI) / 180),
    y: cy + r * Math.sin((angle * Math.PI) / 180),
  });

  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, startAngle + sweepAngle);
  const largeArc = sweepAngle > 180 ? 1 : 0;

  const bgPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <path
          d={bgPath}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={bgPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease",
            filter: `drop-shadow(0 0 8px ${color}40)`,
          }}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-white text-3xl font-bold"
          style={{ fontSize: size * 0.18 }}
        >
          {score.toFixed(2)}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          className="fill-neutral-500"
          style={{ fontSize: size * 0.07 }}
        >
          Fused Risk
        </text>
      </svg>
    </div>
  );
}
