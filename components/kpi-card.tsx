interface KPICardProps {
  label: string
  value: string
  delta: string
  trend: "up" | "down" | "neutral"
}

export function KPICard({ label, value, delta, trend }: KPICardProps) {
  const trendColors = {
    up: "bg-green-50 text-green-700",
    down: "bg-red-50 text-red-700",
    neutral: "bg-gray-100 text-gray-600",
  }
  const trendIcon = { up: "↑", down: "↓", neutral: "→" }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-3xl font-semibold tabular-nums text-card-foreground">{value}</span>
      <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trendColors[trend]}`}>
        {trendIcon[trend]} {delta}
      </span>
    </div>
  )
}
