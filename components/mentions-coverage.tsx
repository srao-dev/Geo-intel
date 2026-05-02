import { cn } from "@/lib/utils"

interface MentionsCoverageProps {
  mentionCount: number
  totalResponses: number
  models: string[]
}

function getModelShortName(model: string) {
  if (model.toLowerCase().includes("gpt")) return "GPT"
  if (model.toLowerCase().includes("claude")) return "C"
  if (model.toLowerCase().includes("gemini")) return "G"
  if (model.toLowerCase().includes("sonar") || model.toLowerCase().includes("perplexity")) return "P"
  return model.substring(0, 2).toUpperCase()
}

function getModelColor(model: string) {
  if (model.toLowerCase().includes("gpt")) return "bg-emerald-100 text-emerald-700"
  if (model.toLowerCase().includes("claude")) return "bg-orange-100 text-orange-700"
  if (model.toLowerCase().includes("gemini")) return "bg-blue-100 text-blue-700"
  if (model.toLowerCase().includes("sonar") || model.toLowerCase().includes("perplexity")) return "bg-purple-100 text-purple-700"
  return "bg-muted text-muted-foreground"
}

export function MentionsCoverage({ mentionCount, totalResponses, models }: MentionsCoverageProps) {
  const pct = totalResponses > 0 ? Math.round((mentionCount / totalResponses) * 100) : 0
  const circumference = 2 * Math.PI * 28
  const filled = (pct / 100) * circumference

  return (
    <div className="flex flex-shrink-0 flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div>
        <p className="text-xs font-semibold text-card-foreground">Mentions Coverage</p>
        <p className="text-xs text-muted-foreground">% of AI answers mentioning your brand</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="relative flex-shrink-0">
          <svg width="68" height="68" viewBox="0 0 68 68">
            <circle cx="34" cy="34" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="34" cy="34" r="28"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeDasharray={`${filled} ${circumference - filled}`}
              strokeLinecap="round"
              transform="rotate(-90 34 34)"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-card-foreground">
            {pct}%
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-xs text-card-foreground">
            <span className="font-semibold">{mentionCount}</span> of <span className="font-semibold">{totalResponses}</span> answers
          </p>
          {models.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {models.map((m) => (
                <span key={m} title={m} className={cn("rounded-full px-1.5 py-0.5 text-xs font-medium", getModelColor(m))}>
                  {getModelShortName(m)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
