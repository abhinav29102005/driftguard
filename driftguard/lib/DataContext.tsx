"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Part, Lot, OverrideEntry } from "./types";
import type { PipelineResults, PipelineMetrics } from "./api";
import { runPipeline } from "./api";
import { toast } from "sonner";

export type DataSourceMode = "loading" | "static" | "live_results" | "live_pipeline" | "error";

interface DataContextState {
  mode: DataSourceMode;
  setMode: (mode: DataSourceMode) => void;
  lots: Lot[];
  parts: Part[];
  overrides: OverrideEntry[];
  metrics: PipelineMetrics | null;
  refreshData: (newMode?: DataSourceMode) => Promise<void>;
  updatePart: (id: string, updates: Partial<Part>) => void;
  addOverride: (entry: OverrideEntry) => void;
}

const DataContext = createContext<DataContextState | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DataSourceMode>("loading");
  const [lots, setLots] = useState<Lot[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [overrides, setOverrides] = useState<OverrideEntry[]>([]);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);

  const fetchResults = async (sourceMode: DataSourceMode) => {
    try {
      let data: PipelineResults;
      if (sourceMode === "live_pipeline") {
        toast.loading("Running ML pipeline...", { id: "pipeline" });
        data = await runPipeline();
        toast.success(`Pipeline finished in ${data.metrics?.execution_time_seconds.toFixed(1)}s`, { id: "pipeline" });
      } else if (sourceMode === "live_results") {
        const res = await fetch("/api/results");
        if (!res.ok) throw new Error("API error");
        data = await res.json();
      } else {
        // static
        const res = await fetch("/results.json");
        if (!res.ok) throw new Error("Static JSON not found");
        data = await res.json();
      }
      
      setLots(data.lots || []);
      setParts(data.parts || []);
      setOverrides(data.overrides || []);
      setMetrics(data.metrics || null);
      setMode(sourceMode);
    } catch (e) {
      console.error(e);
      if (sourceMode === "live_pipeline") toast.error("Pipeline failed", { id: "pipeline" });
      
      // Fallback to static if live API fails
      if (sourceMode !== "static") {
        toast.error("Backend offline. Falling back to static data.");
        fetchResults("static");
      } else {
        setMode("error");
      }
    }
  };

  useEffect(() => {
    fetchResults("static");
  }, []);

  const refreshData = async (newMode?: DataSourceMode) => {
    const targetMode = newMode || (mode === "error" || mode === "loading" ? "static" : mode);
    setMode("loading");
    await fetchResults(targetMode);
  };

  const updatePart = (id: string, updates: Partial<Part>) => {
    setParts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addOverride = (entry: OverrideEntry) => {
    setOverrides(prev => [...prev, entry]);
  };

  return (
    <DataContext.Provider value={{ mode, setMode: refreshData, lots, parts, overrides, metrics, refreshData, updatePart, addOverride }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
