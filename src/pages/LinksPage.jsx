// ─────────────────────────────────────────────────
//  snip.link — Links Page
// ─────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Copy, Check, Trash2, ChevronRight, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { links as linksApi } from "../lib/api";
import ShortenInput from "../components/ShortenInput";

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

export default function LinksPage() {
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [copiedCode, setCopiedCode] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadLinks = (p = 1) => {
    setLoading(true);
    linksApi
      .list({ page: p, limit: 20, search })
      .then((data) => {
        setLinks(data.links);
        setPagination(data.pagination);
      })
      .catch(() => toast.error("Failed to load links"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadLinks(page); }, [page]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadLinks(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const copyLink = (code) => {
    navigator.clipboard?.writeText(`${window.location.origin}/${code}`);
    setCopiedCode(code);
    toast.success("Copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const deleteLink = async (code) => {
    if (!confirm(`Delete /${code}? This cannot be undone.`)) return;
    try {
      await linksApi.delete(code);
      toast.success("Link deleted");
      loadLinks(page);
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="max-w-5xl">
      <ShortenInput onCreated={() => loadLinks(1)} />

      {/* Search */}
      <div className="relative mt-6">
        <Search size={16} className="absolute left-4 top-3.5 text-zinc-600" />
        <input
          className="input-styled pl-11 w-full"
          placeholder="Search links..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Links List */}
      <div className="mt-4 space-y-2">
        {loading && links.length === 0 ? (
          <div className="text-center py-16 text-zinc-600">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading links...
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 text-sm">
            {search ? "No links match your search." : "No links yet. Create your first one above!"}
          </div>
        ) : (
          links.map((link, i) => (
            <div
              key={link.shortCode}
              className="glass-card-hover p-4 flex items-center justify-between gap-4 cursor-pointer animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
              onClick={() => navigate(`/links/${link.shortCode}`)}
            >
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-brand-500 font-mono">
                    /{link.shortCode}
                  </span>
                  {link.title && (
                    <span className="text-xs text-zinc-500">— {link.title}</span>
                  )}
                  <button
                    className="btn-ghost !p-1"
                    onClick={(e) => { e.stopPropagation(); copyLink(link.shortCode); }}
                  >
                    {copiedCode === link.shortCode ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <ExternalLink size={10} className="text-zinc-600" />
                  <span className="text-xs text-zinc-600 font-mono truncate">{link.originalUrl}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="tag bg-cyan-400/10 text-cyan-400">{link.totalClicks} clicks</span>
                {link.tags?.length > 0 && (
                  <span className="tag bg-purple-400/10 text-purple-400">{link.tags[0]}</span>
                )}
                <span className="text-[11px] text-zinc-600 font-mono w-16 text-right">
                  {timeAgo(link.createdAt)}
                </span>
                <button
                  className="btn-ghost"
                  onClick={(e) => { e.stopPropagation(); deleteLink(link.shortCode); }}
                >
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={16} className="text-zinc-600" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`w-8 h-8 rounded-lg text-xs font-mono font-medium transition-all
                ${p === page ? "bg-brand-500/20 text-brand-500" : "text-zinc-500 hover:bg-white/5"}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
