import { CheckCircle2 } from "lucide-react"

interface StatusBannerProps {
  lastTracked: string
  nextRun: string
}

export function StatusBanner({ lastTracked, nextRun }: StatusBannerProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <span>
        Last tracked {lastTracked}
      </span>
      <span className="text-border">|</span>
      <span>
        Next run scheduled {nextRun}
      </span>
    </div>
  )
}
