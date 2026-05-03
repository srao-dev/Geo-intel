import { cn } from "@/lib/utils"

interface MentionsCoverageProps {
  mentionCount: number
  totalResponses: number
  models: string[]
  loading?: boolean
}

function getModelStyle(model: string) {
  if (model.toLowerCase().includes("gpt")) return "bg-emerald-100 text-emerald-700"
  if (model.toLowerCase().includes("claude")) return "bg-orange-100 text-orange-700"
  if (model.toLowerCase().includes("gemini")) return "bg-blue-100 text-blue-700"
  if (model.toLowerCase().includes("sonar") || model.toLowerCase().includes("perplexity")) return "bg-purple-100 text-purple-700"
  return "bg-muted text-muted-foreground"
}

function getModelShort(model: string) {
  if (model.toLowerCase().includes("gpt")) return "GPT"
  if (model.toLowerCase().includes("claude")) return "C"
  if (model.toLowerCase().includes("gemini")) return "G"
  if (model.toLowerCase().includes("sonar") || model.toLowerCase().includes("perplexity")) return "P"
  return model.substring(0, 2).toUpperCase()
}

export function MentionsCoverage({ mentionCount, totalResponses, models, loading }: MentionsCoverageProps) {
  const pct = totalResponses > 0 ? Math.round((mentionCount / totalResponses) * 100) : 0
  const circumference = 2 * Math.PI * 26
  const filled = (pct / 100) * circumference

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div>
        <p className="text-xs font-semibold text-card-foreground">Mentions Coverage</p>
        <p className="text-xs text-muted-foreground">AI answers mentioning your brand</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <svg width="60" height="60" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="26" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
            <circle cx="30" cy="30" r="26" fill="none" stroke="hsl(var(--primary))" strokeWidth="7"
              strokeDasharray={`${filled} ${circumference - filled}`}
              strokeLinecap="round" transform="rotate(-90 30 30)" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-card-foreground">{pct}%</span>
        </div>
        <div>
          <p className="text-xs text-card-foreground"><span className="font-semibold">{mentionCount}</span> of <span className="font-semibold">{totalResponses}</span> answers</p>
          {models.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {models.map(m => (
                <span key={m} title={m} className={cn("rounded-full px-1.5 py-0.5 text-xs font-medium", getModelStyle(m))}>{getModelShort(m)}</span>
              ))}
            </div>
          )}
          {models.length === 0 && <p className="text-xs text-muted-foreground mt-1">No mentions yet</p>}
        </div>
      </div>
    </div>
  )
}
