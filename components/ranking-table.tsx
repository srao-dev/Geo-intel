"use client"

import { cn } from "@/lib/utils"
import { ArrowUpDown } from "lucide-react"
import { useState } from "react"

interface RankingRow {
  rank: number
  name: string
  isOurBrand: boolean
  visibility: number
  avgPosition: number | null
  sentiment: "positive" | "negative" | "neutral"
  mentionCount: number
  totalResponses: number
  models: string[]
}

interface RankingTableProps {
  data: RankingRow[]
}

type SortKey = "rank" | "visibility" | "avgPosition"
type SortOrder = "asc" | "desc"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

const BRAND_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-yellow-500",
  "bg-red-500",
]

function getBrandColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return BRAND_COLORS[Math.abs(hash) % BRAND_COLORS.length]
}

function getModelShortName(model: string) {
  if (model.toLowerCase().includes("gpt")) return "GPT"
  if (model.toLowerCase().includes("claude")) return "C"
  if (model.toLowerCase().includes("gemini")) return "G"
  if (model.toLowerCase().includes("sonar") || model.toLowerCase().includes("perplexity")) return "P"
  return model.substring(0, 3).toUpperCase()
}

function getModelColor(model: string) {
  if (model.toLowerCase().includes("gpt")) return "bg-emerald-100 text-emerald-700"
  if (model.toLowerCase().includes("claude")) return "bg-orange-100 text-orange-700"
  if (model.toLowerCase().includes("gemini")) return "bg-blue-100 text-blue-700"
  if (model.toLowerCase().includes("sonar") || model.toLowerCase().includes("perplexity")) return "bg-purple-100 text-purple-700"
  return "bg-muted text-muted-foreground"
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const styles = {
    positive: "bg-emerald-100 text-emerald-700",
    negative: "bg-red-100 text-red-700",
    neutral: "bg-muted text-muted-foreground",
  }
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", styles[sentiment as keyof typeof styles])}>
      {sentiment}
    </span>
  )
}

export function RankingTable({ data }: RankingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("rank")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder(key === "avgPosition" ? "asc" : key === "rank" ? "asc" : "desc")
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (sortKey === "avgPosition") {
      if (a.avgPosition === null && b.avgPosition === null) return 0
      if (a.avgPosition === null) return 1
      if (b.avgPosition === null) return -1
      return sortOrder === "asc" ? a.avgPosition - b.avgPosition : b.avgPosition - a.avgPosition
    }
    const aVal = a[sortKey] as number
    const bVal = b[sortKey] as number
    return sortOrder === "asc" ? aVal - bVal : bVal - aVal
  })

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-border bg-card shadow-sm">
        <p className="text-sm text-muted-foreground">No ranking data yet. Run a tracking job to see results.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex-shrink-0 border-b border-border px-4 py-3">
        <h3 className="text-xs font-semibold text-card-foreground">Brand Rankings</h3>
        <p className="text-xs text-muted-foreground">Your brand vs competitors across all AI responses</p>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-2 text-left">
                <button
                  onClick={() => handleSort("rank")}
                  className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-card-foreground"
                >
                  Rank <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-2 text-left">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Brand</span>
              </th>
              <th className="px-4 py-2 text-right">
                <button
                  onClick={() => handleSort("visibility")}
                  className="flex items-center justify-end gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-card-foreground"
                >
                  Visibility <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-2 text-right">
                <button
                  onClick={() => handleSort("avgPosition")}
                  className="flex items-center justify-end gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-card-foreground"
                >
                  Avg Position <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-2 text-center">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sentiment</span>
              </th>
              <th className="px-4 py-2 text-left">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mentioned by</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.name}
                className={cn(
                  "border-b border-border last:border-0 transition-colors hover:bg-muted/40",
                  row.isOurBrand && "bg-primary/5"
                )}
              >
                {/* Rank */}
                <td className="px-4 py-2.5">
                  <span className={cn(
                    "text-lg font-bold tabular-nums",
                    row.rank === 1 ? "text-amber-500" : "text-muted-foreground"
                  )}>
                    #{row.rank}
                  </span>
                </td>

                {/* Brand name */}
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                      getBrandColor(row.name)
                    )}>
                      {getInitials(row.name)}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-card-foreground">{row.name}</span>
                      {row.isOurBrand && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          You
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {row.mentionCount} of {row.totalResponses} responses
                      </p>
                    </div>
                  </div>
                </td>

                {/* Visibility */}
                <td className="px-4 py-2.5 text-right">
                  <span className={cn(
                    "text-sm font-semibold tabular-nums",
                    row.visibility >= 70 ? "text-emerald-600" : row.visibility >= 40 ? "text-amber-600" : "text-red-500"
                  )}>
                    {row.visibility}%
                  </span>
                </td>

                {/* Avg Position */}
                <td className="px-4 py-2.5 text-right">
                  {row.avgPosition !== null ? (
                    <span className={cn(
                      "text-sm font-semibold tabular-nums",
                      row.avgPosition <= 2 ? "text-emerald-600" : row.avgPosition <= 4 ? "text-amber-600" : "text-muted-foreground"
                    )}>
                      #{row.avgPosition.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>

                {/* Sentiment */}
                <td className="px-4 py-2.5 text-center">
                  <SentimentBadge sentiment={row.sentiment} />
                </td>

                {/* Models */}
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {row.models.length > 0 ? row.models.map((model) => (
                      <span
                        key={model}
                        title={model}
                        className={cn("rounded-full px-2 py-0.5 text-xs font-medium", getModelColor(model))}
                      >
                        {getModelShortName(model)}
                      </span>
                    )) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
