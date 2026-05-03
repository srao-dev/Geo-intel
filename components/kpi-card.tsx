interface KPICardProps {
  label: string
  value: string
  delta: string
  trend: "up" | "down" | "neutral"
  loading?: boolean
}

export function KPICard({ label, value, delta, trend, loading }: KPICardProps) {
  const trendColors = { up: "text-emerald-600 bg-emerald-50", down: "text-red-500 bg-red-50", neutral: "text-muted-foreground bg-muted" }
  const trendIcon = { up: "↑", down: "↓", neutral: "→" }
  const borderColors = { up: "border-t-emerald-400", down: "border-t-red-400", neutral: "border-t-blue-300" }
  if (loading) return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border border-t-4 border-t-muted bg-card px-4 py-3 shadow-sm">
      <div className="h-3 w-16 rounded bg-muted animate-pulse" />
      <div className="h-7 w-20 rounded bg-muted animate-pulse" />
      <div className="h-3 w-24 rounded bg-muted animate-pulse" />
    </div>
  )
  return (
    <div className={`flex flex-col gap-1.5 rounded-xl border border-border border-t-4 ${borderColors[trend]} bg-card px-4 py-3 shadow-sm hover:shadow-md transition-shadow`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-2xl font-bold tabular-nums text-card-foreground leading-tight">{value}</span>
      <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trendColors[trend]}`}>
        {trendIcon[trend]} {delta}
      </span>
    </div>
  )
}
