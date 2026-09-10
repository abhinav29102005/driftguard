"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";

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
  const pathname = usePathname();
  const crumbs = getBreadcrumb(pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-neutral-950/80 backdrop-blur-xl px-8 py-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-neutral-600">/</span>}
            <span className={i === crumbs.length - 1 ? "text-white font-medium" : "text-neutral-500"}>
              {c}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search parts..."
            className="h-9 w-52 rounded-lg bg-white/5 border border-white/10 pl-9 pr-3 text-sm text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500/40 transition"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-white/5 transition">
          <Bell className="h-5 w-5 text-neutral-400" />
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
