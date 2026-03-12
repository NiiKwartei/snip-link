// ─────────────────────────────────────────────────
//  snip.link — Dashboard Page
// ─────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Link, MousePointerClick, TrendingUp, BarChart3,
  ChevronRight, ArrowUpRight, Copy, Check, ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { analytics, links as linksApi } from "../lib/api";
import ShortenInput from "../components/ShortenInput";
import StatCard from "../components/StatCard";
import ChartTooltip from "../components/ChartTooltip";

const PIE_COLORS = ["#f97316", "#06b6d4", "#8b5cf6", "#10b981", "#f43f5e", "#eab308"];

function formatNumber(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [browsers, setBrowsers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [topLinks, setTopLinks] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);

  const loadData = () => {
    analytics.summary().then(setSummary).catch(() => {});
    analytics.timeseries({ days: 7 }).then(setTimeseries).catch(() => {});
    analytics.breakdown("referer", { days: 30, limit: 6 }).then(setReferrers).catch(() => {});
    analytics.breakdown("device", { days: 30 }).then(setDevices).catch(() => {});
    analytics.breakdown("browser", { days: 30, limit: 5 }).then(setBrowsers).catch(() => {});
    analytics.breakdown("country", { days: 30, limit: 5 }).then(setCountries).catch(() => {});
    analytics.topLinks({ days: 7, limit: 5 }).then(setTopLinks).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const copyLink = (code) => {
    navigator.clipboard?.writeText(`${window.location.origin}/${code}`);
    setCopiedCode(code);
    toast.success("Copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-6xl">
      {/* Shortener */}
      <ShortenInput onCreated={loadData} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
        <StatCard label="Total Links" value={summary?.totalLinks ?? "—"} icon={Link} color="#f97316" delay={0} />
        <StatCard label="Total Clicks" value={formatNumber(summary?.totalClicks ?? 0)} icon={MousePointerClick} color="#06b6d4" delay={60} />
        <StatCard label="Today's Clicks" value={summary?.todayClicks ?? "—"} icon={TrendingUp} color="#8b5cf6" trend={summary?.weeklyGrowth} delay={120} />
        <StatCard label="Avg / Link" value={summary?.avgClicksPerLink ?? "—"} icon={BarChart3} color="#10b981" delay={180} />
      </div>

      {/* Charts: Timeseries + Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-7">
        <div className="glass-card p-6">
          <h3 className="section-title">Clicks — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timeseries}>
              <defs>
                <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#52525b", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="clicks" stroke="#f97316" strokeWidth={2.5} fill="url(#aGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="section-title">Top Referrers</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={referrers} layout="vertical" barCategoryGap={6}>
              <XAxis type="number" tick={{ fill: "#52525b", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#a1a1aa", fontSize: 12, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" fill="#f97316" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdowns: Devices + Browsers + Countries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-7">
        {/* Devices */}
        <div className="glass-card p-6">
          <h3 className="section-title">Devices</h3>
          <div className="flex items-center gap-5">
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={devices} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="count" strokeWidth={0}>
                  {devices.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {devices.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-xs text-zinc-400 font-mono">{d.name}</span>
                  <span className="text-xs font-semibold font-mono">{d.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Browsers */}
        <div className="glass-card p-6">
          <h3 className="section-title">Browsers</h3>
          <div className="flex items-center gap-5">
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={browsers} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="count" strokeWidth={0}>
                  {browsers.map((_, i) => <Cell key={i} fill={PIE_COLORS[(i + 3) % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {browsers.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[(i + 3) % PIE_COLORS.length] }} />
                  <span className="text-xs text-zinc-400 font-mono">{d.name}</span>
                  <span className="text-xs font-semibold font-mono">{d.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Countries */}
        <div className="glass-card p-6">
          <h3 className="section-title">Top Countries</h3>
          <div className="flex flex-col gap-2">
            {countries.map((c, i) => {
              const max = countries[0]?.count || 1;
              return (
                <div key={c.name} className="flex items-center gap-2.5">
                  <span className="w-7 text-xs font-semibold text-zinc-400 font-mono">{c.name}</span>
                  <div className="flex-1 h-5 bg-white/[0.04] rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-700"
                      style={{
                        width: `${(c.count / max) * 100}%`,
                        background: `linear-gradient(90deg, ${PIE_COLORS[i % PIE_COLORS.length]}, ${PIE_COLORS[i % PIE_COLORS.length]}88)`,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-semibold font-mono">{c.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Links */}
      <div className="mt-7">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">Top Links This Week</h3>
          <button
            onClick={() => navigate("/links")}
            className="text-xs text-brand-500 font-medium flex items-center gap-1 hover:underline"
          >
            View all <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="space-y-2">
          {topLinks.map((link, i) => (
            <div
              key={link.shortCode}
              className="glass-card-hover p-4 flex items-center justify-between gap-4 cursor-pointer animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => navigate(`/links/${link.shortCode}`)}
            >
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-brand-500 font-mono">/{link.shortCode}</span>
                  <button
                    className="btn-ghost !p-1"
                    onClick={(e) => { e.stopPropagation(); copyLink(link.shortCode); }}
                  >
                    {copiedCode === link.shortCode ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                </div>
                <span className="text-xs text-zinc-600 font-mono truncate">{link.originalUrl}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="tag bg-cyan-400/10 text-cyan-400">{link.periodClicks} this week</span>
                <span className="text-xs text-zinc-600 font-mono">{link.totalClicks} total</span>
                <ChevronRight size={16} className="text-zinc-600" />
              </div>
            </div>
          ))}
          {topLinks.length === 0 && (
            <div className="text-center py-12 text-zinc-600 text-sm">
              No links yet. Create your first short URL above!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
