interface ComparisonItem {
  label: string
  value: string
  trend: "up" | "down" | "neutral"
}

interface ComparisonBarProps {
  items: ComparisonItem[]
}

export function ComparisonBar({ items }: ComparisonBarProps) {
  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-500",
  }

  const trendIcon = {
    up: "↑",
    down: "↓",
    neutral: "→",
  }

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
      <span className="text-muted-foreground">Compared to last assessment:</span>
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-1">
          <span className={trendColors[item.trend]}>
            {trendIcon[item.trend]}
          </span>
          <span className="text-card-foreground">{item.label}</span>
          <span className={`font-medium tabular-nums ${trendColors[item.trend]}`}>
            {item.value}
          </span>
          {index < items.length - 1 && (
            <span className="ml-2 text-border">|</span>
          )}
        </span>
      ))}
    </div>
  )
}
