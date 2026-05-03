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
  if (model.toLowerCase().includes("claude")) return "Claude"
  if (model.toLowerCase().includes("gemini")) return "Gemini"
  if (model.toLowerCase().includes("sonar") || model.toLowerCase().includes("perplexity")) return "Perplexity"
  return model.substring(0, 2).toUpperCase()
}

export function MentionsCoverage({ mentionCount, totalResponses, models, loading }: MentionsCoverageProps) {
  const pct = totalResponses > 0 ? Math.round((mentionCount / totalResponses) * 100) : 0
  const circumference = 2 * Math.PI * 26
  const filled = (pct / 100) * circumference
  const ringColor = pct >= 70 ? "stroke-emerald-500" : pct >= 40 ? "stroke-amber-400" : "stroke-blue-500"

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border border-t-4 border-t-blue-400 bg-card p-4 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-card-foreground">Mentions Coverage</p>
        <p className="text-xs text-muted-foreground">% of AI answers mentioning your brand</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <svg width="64" height="64" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="26" fill="none" className="stroke-muted" strokeWidth="7" />
            <circle cx="30" cy="30" r="26" fill="none" className={ringColor} strokeWidth="7"
              strokeDasharray={`${filled} ${circumference - filled}`}
              strokeLinecap="round" transform="rotate(-90 30 30)" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-card-foreground">{pct}%</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-card-foreground">{mentionCount} <span className="text-xs font-normal text-muted-foreground">of {totalResponses} answers</span></p>
          {models.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {models.map(m => (
                <span key={m} className={cn("rounded-full px-2 py-0.5 text-xs font-medium", getModelStyle(m))}>{getModelShort(m)}</span>
              ))}
            </div>
          )}
          {models.length === 0 && <p className="text-xs text-muted-foreground mt-1">No mentions yet</p>}
        </div>
      </div>
    </div>
  )
}
