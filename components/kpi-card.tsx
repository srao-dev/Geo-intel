interface KPICardProps {
  label: string
  value: string
  delta: string
  trend: "up" | "down" | "neutral"
  loading?: boolean
}

export function KPICard({ label, value, delta, trend, loading }: KPICardProps) {
  const trendColors = { up: "text-emerald-600", down: "text-red-500", neutral: "text-muted-foreground" }
  const trendIcon = { up: "↑", down: "↓", neutral: "→" }
  if (loading) return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <div className="h-3 w-16 rounded bg-muted animate-pulse" />
      <div className="h-7 w-20 rounded bg-muted animate-pulse" />
      <div className="h-3 w-24 rounded bg-muted animate-pulse" />
    </div>
  )
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-2xl font-bold tabular-nums text-card-foreground leading-tight">{value}</span>
      <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted ${trendColors[trend]}`}>
        {trendIcon[trend]} {delta}
      </span>
    </div>
  )
}
