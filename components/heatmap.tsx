"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface HeatmapCell {
  promptId: string
  modelId: string
  value: number | null
  sampleSize: number
}

interface HeatmapProps {
  prompts: { id: string; text: string }[]
  models: { id: string; name: string }[]
  data: HeatmapCell[]
  onCellClick: (promptId: string, modelId: string) => void
}

type MetricType = "recommendation" | "visibility" | "ranking"

const METRICS = [
  { value: "recommendation", label: "Recommendation Rate" },
  { value: "visibility", label: "Visibility" },
  { value: "ranking", label: "Average Ranking" },
]

function getCellColor(value: number | null, metric: MetricType): string {
  if (value === null) return "bg-muted text-muted-foreground"
  
  if (metric === "ranking") {
    // Lower is better for ranking
    if (value <= 2) return "bg-emerald-50 text-emerald-700"
    if (value <= 4) return "bg-amber-50 text-amber-700"
    return "bg-red-50 text-red-700"
  }
  
  // Higher is better for recommendation and visibility
  if (value >= 70) return "bg-emerald-50 text-emerald-700"
  if (value >= 40) return "bg-amber-50 text-amber-700"
  return "bg-red-50 text-red-700"
}

function formatValue(value: number | null, metric: MetricType): string {
  if (value === null) return "Pending"
  if (metric === "ranking") return `#${value.toFixed(1)}`
  return `${value}%`
}

export function Heatmap({ prompts, models, data, onCellClick }: HeatmapProps) {
  const [metric, setMetric] = useState<MetricType>("recommendation")

  const getCellData = (promptId: string, modelId: string): HeatmapCell | undefined => {
    return data.find((d) => d.promptId === promptId && d.modelId === modelId)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Cell value:</span>
          <Select value={metric} onValueChange={(v) => setMetric(v as MetricType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRICS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-50 ring-1 ring-emerald-200" />
            <span className="text-muted-foreground">Strong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-50 ring-1 ring-amber-200" />
            <span className="text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-red-50 ring-1 ring-red-200" />
            <span className="text-muted-foreground">Weak</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="min-w-[200px] p-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Prompt
              </th>
              {models.map((model) => (
                <th
                  key={model.id}
                  className="min-w-[100px] p-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {model.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TooltipProvider>
              {prompts.map((prompt) => (
                <tr key={prompt.id}>
                  <td className="max-w-[250px] truncate p-2 text-sm text-card-foreground">
                    {prompt.text}
                  </td>
                  {models.map((model) => {
                    const cellData = getCellData(prompt.id, model.id)
                    const value = cellData?.value ?? null
                    const sampleSize = cellData?.sampleSize ?? 0

                    return (
                      <td key={model.id} className="p-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => onCellClick(prompt.id, model.id)}
                              className={cn(
                                "flex h-12 w-full items-center justify-center rounded-md text-sm font-medium tabular-nums transition-all hover:ring-2 hover:ring-primary/30",
                                getCellColor(value, metric),
                                value === null && "italic"
                              )}
                            >
                              {formatValue(value, metric)}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">
                              {formatValue(value, metric)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Sample size: n={sampleSize}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </TooltipProvider>
          </tbody>
        </table>
      </div>
    </div>
  )
}
