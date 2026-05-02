"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Clock, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface Response {
  id: string
  response_text: string
  requested_model: string
  provider: string
  created_at: string
  latency_ms: number
  prompts: { text: string } | null
}

function getModelStyle(model: string) {
  if (model.toLowerCase().includes("gpt")) return { bg: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" }
  if (model.toLowerCase().includes("claude")) return { bg: "bg-orange-50 text-orange-700 border border-orange-200", dot: "bg-orange-500" }
  if (model.toLowerCase().includes("gemini")) return { bg: "bg-blue-50 text-blue-700 border border-blue-200", dot: "bg-blue-500" }
  if (model.toLowerCase().includes("sonar") || model.toLowerCase().includes("perplexity")) return { bg: "bg-purple-50 text-purple-700 border border-purple-200", dot: "bg-purple-500" }
  return { bg: "bg-muted text-muted-foreground border border-border", dot: "bg-muted-foreground" }
}

function formatDateGroup(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (d.getTime() === today.getTime()) return "Today"
  if (d.getTime() === yesterday.getTime()) return "Yesterday"
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

function groupByDate(responses: Response[]) {
  const groups: Record<string, Response[]> = {}
  responses.forEach(r => {
    const label = formatDateGroup(r.created_at)
    if (!groups[label]) groups[label] = []
    groups[label].push(r)
  })
  return groups
}

function ResponseRow({ response }: { response: Response }) {
  const [open, setOpen] = useState(false)
  const style = getModelStyle(response.requested_model)

  return (
    <div className={cn(
      "rounded-xl border border-border bg-card overflow-hidden transition-all duration-200",
      open ? "shadow-md" : "hover:shadow-sm hover:border-border/80"
    )}>
      {/* Row header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/30"
      >
        {/* Model dot */}
        <div className={cn("h-2 w-2 rounded-full flex-shrink-0 mt-0.5", style.dot)} />

        {/* Prompt */}
        <span className="flex-1 truncate text-sm text-card-foreground font-medium">
          {response.prompts?.text || "—"}
        </span>

        {/* Model badge */}
        <span className={cn("hidden sm:inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0", style.bg)}>
          {response.requested_model}
        </span>

        {/* Time */}
        <span className="flex-shrink-0 text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTime(response.created_at)}
        </span>

        {/* Chevron */}
        <span className="flex-shrink-0 text-muted-foreground ml-1">
          {open
            ? <ChevronUp className="h-4 w-4" />
            : <ChevronDown className="h-4 w-4" />
          }
        </span>
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-border">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 bg-muted/30 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Model</span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium w-fit", style.bg)}>
                {response.requested_model}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Latency</span>
              <span className="flex items-center gap-1 text-xs font-medium text-card-foreground">
                <Zap className="h-3 w-3 text-amber-500" />
                {response.latency_ms ? `${(response.latency_ms / 1000).toFixed(1)}s` : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Time</span>
              <span className="text-xs font-medium text-card-foreground">
                {new Date(response.created_at).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
              </span>
            </div>
          </div>

          {/* Prompt */}
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Prompt</p>
            <p className="text-sm text-card-foreground bg-muted/40 rounded-lg px-3 py-2.5 leading-relaxed">
              {response.prompts?.text || "—"}
            </p>
          </div>

          {/* Response */}
          <div className="px-4 pt-2 pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Response</p>
            <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">
              {response.response_text}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export function ResponseFeed({ responses }: { responses: Response[] }) {
  if (responses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm font-medium text-card-foreground">No responses yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Run a tracking job to see LLM responses here</p>
      </div>
    )
  }

  const groups = groupByDate(responses)

  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">LLM Responses</h3>
        <span className="text-xs text-muted-foreground">{responses.length} total</span>
      </div>

      {/* Groups */}
      {Object.entries(groups).map(([dateLabel, items]) => (
        <div key={dateLabel} className="flex flex-col gap-2 mb-3">
          {/* Date divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground px-1">{dateLabel}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          {/* Responses for this date */}
          {items.map(r => <ResponseRow key={r.id} response={r} />)}
        </div>
      ))}
    </div>
  )
}
