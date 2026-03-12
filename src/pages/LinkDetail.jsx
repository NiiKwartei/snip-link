// ─────────────────────────────────────────────────
//  snip.link — Link Detail + Per-Link Analytics
// ─────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft, Copy, Check, Trash2, ExternalLink, Clock,
  MousePointerClick, Globe, Monitor, QrCode,
} from "lucide-react";
import toast from "react-hot-toast";
import { links as linksApi, analytics } from "../lib/api";
import StatCard from "../components/StatCard";
import ChartTooltip from "../components/ChartTooltip";

const PIE_COLORS = ["#f97316", "#06b6d4", "#8b5cf6", "#10b981", "#f43f5e", "#eab308"];

export default function LinkDetail() {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const [link, setLink] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [countries, setCountries] = useState([]);
  const [recentClicks, setRecentClicks] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      linksApi.get(shortCode).then(setLink),
      analytics.timeseries({ shortCode, days: 7 }).then(setTimeseries),
      analytics.hourly({ shortCode, days: 7 }).then(setHourly),
      analytics.breakdown("referer", { shortCode, days: 30 }).then(setReferrers),
      analytics.breakdown("device", { shortCode, days: 30 }).then(setDevices),
      analytics.breakdown("country", { shortCode, days: 30, limit: 6 }).then(setCountries),
      analytics.recentClicks({ shortCode, limit: 10 }).then(setRecentClicks),
    ])
      .catch(() => toast.error("Failed to load link data"))
      .finally(() => setLoading(false));
  }, [shortCode]);

  const copyLink = () => {
    navigator.clipboard?.writeText(link?.shortUrl || `${window.location.origin}/${shortCode}`);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteLink = async () => {
    if (!confirm(`Delete /${shortCode}? This cannot be undone.`)) return;
    try {
      await linksApi.delete(shortCode);
      toast.success("Link deleted");
      navigate("/links");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!link) {
    return (
      <div className="text-center py-24 text-zinc-500">
        <p className="text-lg mb-4">Link not found</p>
        <button onClick={() => navigate("/links")} className="text-brand-500 text-sm hover:underline">
          ← Back to links
        </button>
      </div>
    );
  }

  const todayClicks = timeseries.length > 0 ? timeseries[timeseries.length - 1]?.clicks || 0 : 0;

  return (
    <div className="max-w-6xl animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Link Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-brand-500 font-mono mb-1">/{link.shortCode}</h1>
            {link.title && <p className="text-sm text-zinc-400 mb-2">{link.title}</p>}
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-mono">
              <ExternalLink size={12} />
              <a href={link.originalUrl} target="_blank" rel="noopener" className="hover:text-zinc-400 break-all">
                {link.originalUrl}
              </a>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-mono mt-1.5">
              <Clock size={12} />
              Created {new Date(link.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={copyLink} className="btn-ghost">
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
            <a
              href={linksApi.qrCode(shortCode, "svg")}
              target="_blank"
              rel="noopener"
              className="btn-ghost"
              title="QR Code"
            >
              <QrCode size={16} />
            </a>
            <button onClick={deleteLink} className="btn-ghost hover:!text-red-400 hover:!bg-red-400/10">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Clicks" value={link.totalClicks} icon={MousePointerClick} color="#f97316" />
        <StatCard label="Today" value={todayClicks} icon={MousePointerClick} color="#06b6d4" delay={60} />
        <StatCard label="Top Referrer" value={referrers[0]?.name || "—"} icon={Globe} color="#8b5cf6" delay={120} />
        <StatCard label="Top Device" value={devices[0]?.name || "—"} icon={Monitor} color="#10b981" delay={180} />
      </div>

      {/* Charts: Timeseries + Hourly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-6">
          <h3 className="section-title">Clicks — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeseries}>
              <defs>
                <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 10, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#52525b", fontSize: 10, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="clicks" stroke="#06b6d4" strokeWidth={2.5} fill="url(#dGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="section-title">Clicks by Hour</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourly}>
              <XAxis dataKey="hour" tick={{ fill: "#52525b", fontSize: 9, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} interval={3}
                tickFormatter={(h) => `${h}:00`} />
              <YAxis tick={{ fill: "#52525b", fontSize: 10, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="clicks" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Referrers */}
        <div className="glass-card p-6">
          <h3 className="section-title">Referrers</h3>
          <div className="space-y-2">
            {referrers.map((r, i) => {
              const max = referrers[0]?.count || 1;
              return (
                <div key={r.name} className="flex items-center gap-2.5">
                  <span className="w-16 text-xs text-zinc-400 font-mono truncate">{r.name}</span>
                  <div className="flex-1 h-4 bg-white/[0.04] rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${(r.count / max) * 100}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  </div>
                  <span className="w-8 text-right text-[11px] font-mono font-semibold">{r.count}</span>
                </div>
              );
            })}
            {referrers.length === 0 && <p className="text-xs text-zinc-600">No data yet</p>}
          </div>
        </div>

        {/* Devices */}
        <div className="glass-card p-6">
          <h3 className="section-title">Devices</h3>
          <div className="flex items-center gap-5">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={devices} cx="50%" cy="50%" innerRadius={32} outerRadius={50} dataKey="count" strokeWidth={0}>
                  {devices.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {devices.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-xs text-zinc-400 font-mono">{d.name}</span>
                  <span className="text-xs font-semibold font-mono">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Countries */}
        <div className="glass-card p-6">
          <h3 className="section-title">Countries</h3>
          <div className="space-y-2">
            {countries.map((c, i) => {
              const max = countries[0]?.count || 1;
              return (
                <div key={c.name} className="flex items-center gap-2.5">
                  <span className="w-7 text-xs font-semibold text-zinc-400 font-mono">{c.name}</span>
                  <div className="flex-1 h-4 bg-white/[0.04] rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${(c.count / max) * 100}%`, background: PIE_COLORS[(i + 2) % PIE_COLORS.length] }} />
                  </div>
                  <span className="w-8 text-right text-[11px] font-mono font-semibold">{c.count}</span>
                </div>
              );
            })}
            {countries.length === 0 && <p className="text-xs text-zinc-600">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Recent Clicks */}
      <div className="glass-card p-6">
        <h3 className="section-title">Recent Clicks</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] text-zinc-600 font-mono uppercase tracking-wider">
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Browser</th>
                <th className="pb-3 font-medium">OS</th>
                <th className="pb-3 font-medium">Device</th>
                <th className="pb-3 font-medium">Country</th>
                <th className="pb-3 font-medium">Referrer</th>
              </tr>
            </thead>
            <tbody className="text-xs font-mono">
              {recentClicks.map((click) => (
                <tr key={click.id} className="border-t border-white/[0.04]">
                  <td className="py-2.5 text-zinc-400">
                    {new Date(click.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="py-2.5 text-zinc-300">{click.browser || "—"}</td>
                  <td className="py-2.5 text-zinc-300">{click.os || "—"}</td>
                  <td className="py-2.5">
                    <span className="tag bg-brand-500/10 text-brand-400">{click.device || "—"}</span>
                  </td>
                  <td className="py-2.5 text-zinc-300">{click.country || "—"}</td>
                  <td className="py-2.5 text-zinc-500 truncate max-w-[160px]">{click.referer || "Direct"}</td>
                </tr>
              ))}
              {recentClicks.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-600">No clicks recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
