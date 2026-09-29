/**
 * DriftGuard — API Client
 * 
 * Fetch helpers that call the Python ML backend through Next.js rewrites.
 * Falls back to mock data if the backend is unavailable.
 */

import type { Part, Lot, OverrideEntry } from "./types";

function getBackendCandidates(): string[] {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  const candidates = typeof window !== "undefined" ? ["/backend"] : [];
  if (configured) candidates.push(configured.replace(/\/$/, ""));

  // GitHub Codespaces exposes each forwarded port on the same hostname.
  // Keep browser requests on that host instead of resolving 127.0.0.1 on the user's machine.
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname.replace(
      /-3000(?=\.app\.github\.dev$)/,
      "-8000",
    );
    if (hostname !== window.location.hostname) {
      candidates.push(`${window.location.protocol}//${hostname}`);
    }
  }

  candidates.push("http://127.0.0.1:8000");
  return [...new Set(candidates)];
}

function getBackendBase(): string {
  return getBackendCandidates()[0];
}

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
    const res = await fetch(`${getBackendBase()}/health`, {
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
    const res = await fetch(`${getBackendBase()}/results`, { cache: "no-store" });
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
  const failures: string[] = [];

  for (const backendBase of getBackendCandidates()) {
    try {
      const res = await fetch(`${backendBase}/run-pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed, anomaly_rate: anomalyRate }),
        signal: AbortSignal.timeout(120_000),
      });

      if (res.ok) return await res.json();

      const err = await res.text().catch(() => "");
      failures.push(`${backendBase} (${res.status}${err ? `: ${err.slice(0, 120)}` : ""})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown network error";
      failures.push(`${backendBase} (${message})`);
    }
  }

  throw new Error(`Unable to reach a working ML backend. Tried: ${failures.join("; ")}`);
}
