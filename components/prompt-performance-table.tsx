"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ArrowUpDown, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PromptPerformance {
  id: string
  prompt: string
  visibility: number
  ranking: number
  recommendation: number
}

interface PromptPerformanceTableProps {
  data: PromptPerformance[]
  onViewPrompt: (promptId: string) => void
}

type SortKey = "prompt" | "visibility" | "ranking" | "recommendation"
type SortOrder = "asc" | "desc"

function getValueColor(value: number, type: "percentage" | "ranking"): string {
  if (type === "ranking") {
    if (value <= 2) return "text-emerald-600"
    if (value <= 4) return "text-amber-600"
    return "text-red-600"
  }
  if (value >= 70) return "text-emerald-600"
  if (value >= 40) return "text-amber-600"
  return "text-red-600"
}

export function PromptPerformanceTable({ data, onViewPrompt }: PromptPerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("visibility")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder(key === "ranking" ? "asc" : "desc")
    }
  }

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortOrder === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left">
                <button
                  onClick={() => handleSort("prompt")}
                  className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-card-foreground"
                >
                  Prompt
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-5 py-3 text-right">
                <button
                  onClick={() => handleSort("visibility")}
                  className="flex items-center justify-end gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-card-foreground"
                >
                  Visibility
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-5 py-3 text-right">
                <button
                  onClick={() => handleSort("ranking")}
                  className="flex items-center justify-end gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-card-foreground"
                >
                  Ranking
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-5 py-3 text-right">
                <button
                  onClick={() => handleSort("recommendation")}
                  className="flex items-center justify-end gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-card-foreground"
                >
                  Recommendation
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-5 py-3 text-right">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Action
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
              >
                <td className="px-5 py-4 text-sm text-card-foreground">
                  &quot;{row.prompt}&quot;
                </td>
                <td className={cn(
                  "px-5 py-4 text-right text-sm font-medium tabular-nums",
                  getValueColor(row.visibility, "percentage")
                )}>
                  {row.visibility}%
                </td>
                <td className={cn(
                  "px-5 py-4 text-right text-sm font-medium tabular-nums",
                  getValueColor(row.ranking, "ranking")
                )}>
                  #{row.ranking.toFixed(1)}
                </td>
                <td className={cn(
                  "px-5 py-4 text-right text-sm font-medium tabular-nums",
                  getValueColor(row.recommendation, "percentage")
                )}>
                  {row.recommendation}%
                </td>
                <td className="px-5 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewPrompt(row.id)}
                    className="gap-1 text-primary hover:text-primary"
                  >
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
