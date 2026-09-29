"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Radar, LayoutDashboard, AlertTriangle, BarChart3,
  ClipboardList, PanelLeftClose, PanelLeft, FlaskConical,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/pipeline", icon: FlaskConical, label: "Live Pipeline" },
  { href: "/dashboard#flagged", icon: AlertTriangle, label: "Flagged Parts" },
  { href: "/dashboard/lots", icon: BarChart3, label: "Lot Analytics" },
  { href: "/dashboard#overrides", icon: ClipboardList, label: "Override Log" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-slate-200 bg-white transition-all duration-300 flex flex-col shadow-[4px_0_24px_rgba(32,76,105,0.04)]",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Brand */}
      <Link href="/" className="flex items-center gap-3 px-5 py-6 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-700">
          <Radar className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="text-slate-800 font-bold text-lg tracking-tight">DriftGuard</span>
        )}
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const cleanHref = item.href.split("#")[0];
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(cleanHref) && cleanHref !== "/dashboard";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-cyan-50 text-slate-800"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-cyan-700" />
              )}
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-cyan-400")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center gap-2 px-3 py-4 border-t border-slate-100 text-slate-400 hover:text-slate-700 transition"
      >
        {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        {!collapsed && <span className="text-xs">Collapse</span>}
      </button>
    </aside>
  );
}
