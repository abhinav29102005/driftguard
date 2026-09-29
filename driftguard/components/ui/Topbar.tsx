"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Database, Activity, Play } from "lucide-react";
import { useData } from "@/lib/DataContext";


function getBreadcrumb(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((s, i) => {
    if (s === "dashboard") return "Dashboard";
    if (s === "parts") return "Parts";
    if (s === "lots") return "Lot Analytics";
    if (s.match(/^\d/)) return `Part #${s}`;
    return s.charAt(0).toUpperCase() + s.slice(1);
  });
}

export function Topbar() {
  const { mode, setMode } = useData();
  const pathname = usePathname();
  const crumbs = getBreadcrumb(pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-xl px-8 py-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-slate-300">/</span>}
            <span className={i === crumbs.length - 1 ? "text-slate-800 font-medium" : "text-slate-500"}>
              {c}
            </span>
          </React.Fragment>
        ))}
      </div>

      
      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Data Source Selector */}
        <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1">
          <button 
            onClick={() => setMode("static")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition ${mode === "static" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Database className="w-3 h-3" /> Static
          </button>
          <button 
            onClick={() => setMode("live_results")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition ${mode === "live_results" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Activity className="w-3 h-3" /> API Results
          </button>
          <button 
            onClick={() => setMode("live_pipeline")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition ${mode === "live_pipeline" ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Play className="w-3 h-3" /> Run Pipeline
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search parts..."
            className="h-9 w-52 rounded-lg bg-slate-50 border border-slate-200 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/40 transition"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-white/5 transition">
          <Bell className="h-5 w-5 text-slate-500" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            MK
          </div>
        </div>
      </div>
    </header>
  );
}
