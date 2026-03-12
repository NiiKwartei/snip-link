// ─────────────────────────────────────────────────
//  snip.link — Shorten URL Input
// ─────────────────────────────────────────────────

import { useState } from "react";
import { Plus, Check, Copy, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { links as linksApi } from "../lib/api";

export default function ShortenInput({ onCreated }) {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!url.trim()) return;

    let fullUrl = url.trim();
    if (!/^https?:\/\//.test(fullUrl)) fullUrl = "https://" + fullUrl;

    setLoading(true);
    try {
      const link = await linksApi.create(fullUrl, alias.trim() || undefined);
      setResult(link);
      setUrl("");
      setAlias("");
      toast.success("Link shortened!");
      onCreated?.(link);
    } catch (err) {
      toast.error(err.message || "Failed to shorten URL");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (result?.shortUrl) {
      navigator.clipboard?.writeText(result.shortUrl);
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass-card p-6 animate-fade-in">
      <form onSubmit={handleSubmit} className="flex gap-3 flex-wrap">
        <input
          className="input-styled flex-1 min-w-[280px]"
          placeholder="Paste a long URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className="input-styled w-44"
          placeholder="Custom alias"
          value={alias}
          onChange={(e) => setAlias(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
        />
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Shorten
        </button>
      </form>

      {result && (
        <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-brand-500/5 border border-brand-500/20 animate-fade-in">
          <span className="font-mono text-brand-500 font-semibold text-sm flex-1 truncate">
            {result.shortUrl}
          </span>
          <button onClick={copyResult} className="btn-ghost">
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}
