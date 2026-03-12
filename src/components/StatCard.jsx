// ─────────────────────────────────────────────────
//  snip.link — Stat Card
// ─────────────────────────────────────────────────

import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ label, value, icon: Icon, color = "#f97316", trend, delay = 0 }) {
  return (
    <div
      className="glass-card p-5 relative overflow-hidden animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glow */}
      <div
        className="stat-glow"
        style={{ background: `radial-gradient(circle, ${color}22, transparent)` }}
      />

      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} style={{ color }} />
        <span className="text-xs text-zinc-500 font-medium">{label}</span>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-bold font-mono tracking-tight">{value}</span>
        {trend !== undefined && trend !== null && (
          <span
            className={`flex items-center gap-1 text-xs font-mono font-medium mb-1
            ${trend >= 0 ? "text-green-500" : "text-red-400"}`}
          >
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
