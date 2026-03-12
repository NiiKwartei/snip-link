export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-1/95 border border-brand-500/30 rounded-lg px-3.5 py-2 font-mono text-xs shadow-xl">
      <div className="text-zinc-500 mb-0.5">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="font-semibold" style={{ color: p.color || "#f97316" }}>
          {p.value} {p.name || "clicks"}
        </div>
      ))}
    </div>
  );
}
