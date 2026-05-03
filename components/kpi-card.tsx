interface KPICardProps {
  label: string
  value: string
  delta: string
  trend: "up" | "down" | "neutral"
  loading?: boolean
}

export function KPICard({ label, value, delta, trend, loading }: KPICardProps) {
  const styles = {
    up:      { card: "bg-emerald-50 border-emerald-200 border-t-emerald-400", value: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", icon: "↑" },
    down:    { card: "bg-red-50 border-red-200 border-t-red-400", value: "text-red-600", badge: "bg-red-100 text-red-600", icon: "↓" },
    neutral: { card: "bg-blue-50 border-blue-200 border-t-blue-400", value: "text-blue-700", badge: "bg-blue-100 text-blue-700", icon: "→" },
  }
  const s = styles[trend]
  if (loading) return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-t-4 bg-muted/30 px-4 py-3 shadow-sm animate-pulse">
      <div className="h-3 w-16 rounded bg-muted" />
      <div className="h-7 w-20 rounded bg-muted" />
      <div className="h-3 w-24 rounded bg-muted" />
    </div>
  )
  return (
    <div className={`flex flex-col gap-1.5 rounded-xl border border-t-4 ${s.card} px-4 py-3 shadow-sm hover:shadow-md transition-shadow`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-2xl font-bold tabular-nums leading-tight ${s.value}`}>{value}</span>
      <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.badge}`}>
        {s.icon} {delta}
      </span>
    </div>
  )
}
