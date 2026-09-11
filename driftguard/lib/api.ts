/**
 * DriftGuard — API Client
 * 
 * Fetch helpers that call the Python ML backend through Next.js rewrites.
 * Falls back to mock data if the backend is unavailable.
 */

import type { Part, Lot, OverrideEntry } from "./types";

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface PipelineMetrics {
  recall: number;
  precision: number;
  mae_168h: number;
  total_parts: number;
  total_anomalies_injected: number;
  total_flagged: number;
  true_positives: number;
  false_negatives: number;
  false_positives: number;
  execution_time_seconds: number;
}

export interface PipelineResults {
  parts: Part[];
  lots: Lot[];
  overrides: OverrideEntry[];
  metrics: PipelineMetrics;
}

/**
 * Check if the Python backend is healthy.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_BASE}/health`, { 
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Get pre-computed pipeline results for instant dashboard loading.
 */
export async function getPrecomputedResults(): Promise<PipelineResults | null> {
  try {
    const res = await fetch(`${BACKEND_BASE}/results`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Trigger a live pipeline run. Returns the full results.
 */
export async function runPipeline(
  seed: number = 42,
  anomalyRate: number = 0.06,
): Promise<PipelineResults> {
  const res = await fetch(`${BACKEND_BASE}/run-pipeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seed, anomaly_rate: anomalyRate }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pipeline failed: ${err}`);
  }

  return await res.json();
}
