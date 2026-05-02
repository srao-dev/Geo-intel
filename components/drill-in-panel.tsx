"use client"

import { useEffect } from "react"
import { X, ExternalLink, TrendingUp, Hash, ThumbsUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Citation {
  url: string
  title: string
}

interface DrillInData {
  prompt: string
  model: string
  visibility: number
  ranking: number
  sentiment: "positive" | "neutral" | "negative"
  response: string
  brandMentions: string[]
  competitorMentions: string[]
  citations: Citation[]
  stance: string
  position: number
}

interface DrillInPanelProps {
  isOpen: boolean
  onClose: () => void
  data: DrillInData | null
}

function highlightText(
  text: string,
  brandMentions: string[],
  competitorMentions: string[]
): React.ReactNode[] {
  let result = text
  const highlights: { start: number; end: number; type: "brand" | "competitor" }[] = []

  // Find brand mentions
  brandMentions.forEach((brand) => {
    const regex = new RegExp(brand, "gi")
    let match
    while ((match = regex.exec(text)) !== null) {
      highlights.push({ start: match.index, end: match.index + brand.length, type: "brand" })
    }
  })

  // Find competitor mentions
  competitorMentions.forEach((competitor) => {
    const regex = new RegExp(competitor, "gi")
    let match
    while ((match = regex.exec(text)) !== null) {
      highlights.push({ start: match.index, end: match.index + competitor.length, type: "competitor" })
    }
  })

  // Sort highlights by start position
  highlights.sort((a, b) => a.start - b.start)

  // Build result with highlights
  const elements: React.ReactNode[] = []
  let lastIndex = 0

  highlights.forEach((highlight, i) => {
    if (highlight.start > lastIndex) {
      elements.push(text.slice(lastIndex, highlight.start))
    }
    elements.push(
      <span
        key={i}
        className={cn(
          "rounded px-0.5",
          highlight.type === "brand"
            ? "bg-amber-100 text-amber-900"
            : "underline decoration-muted-foreground/50"
        )}
      >
        {text.slice(highlight.start, highlight.end)}
      </span>
    )
    lastIndex = highlight.end
  })

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex))
  }

  return elements.length > 0 ? elements : [text]
}

export function DrillInPanel({ isOpen, onClose, data }: DrillInPanelProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!isOpen || !data) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-border bg-card shadow-xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-5">
          <div className="flex-1 pr-4">
            <p className="text-sm text-muted-foreground">{data.model}</p>
            <h3 className="mt-1 text-lg font-medium text-card-foreground">
              &quot;{data.prompt}&quot;
            </h3>

            {/* Metrics */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Visibility:</span>
                <span className="font-medium tabular-nums text-card-foreground">
                  {data.visibility}%
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Ranking:</span>
                <span className="font-medium tabular-nums text-card-foreground">
                  #{data.ranking}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Sentiment:</span>
                <span
                  className={cn(
                    "font-medium capitalize",
                    data.sentiment === "positive" && "text-emerald-600",
                    data.sentiment === "negative" && "text-red-600",
                    data.sentiment === "neutral" && "text-muted-foreground"
                  )}
                >
                  {data.sentiment}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-5">
            <Tabs defaultValue="latest">
              <TabsList className="mb-4">
                <TabsTrigger value="latest">Latest Response</TabsTrigger>
                <TabsTrigger value="all">All Runs</TabsTrigger>
              </TabsList>

              <TabsContent value="latest" className="mt-0">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">
                    {highlightText(data.response, data.brandMentions, data.competitorMentions)}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="all" className="mt-0">
                <p className="text-sm text-muted-foreground">
                  Historical responses will appear here after multiple runs.
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Citations sidebar */}
          <div className="w-64 shrink-0 border-l border-border bg-muted/30 p-4">
            <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Citations
            </h4>
            <div className="flex flex-col gap-2">
              {data.citations.length > 0 ? (
                data.citations.map((citation, i) => (
                  <a
                    key={i}
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 rounded-md p-2 text-sm text-card-foreground transition-colors hover:bg-muted"
                  >
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="line-clamp-2">{citation.title}</span>
                  </a>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No citations found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Stance:{" "}
              <span className="font-medium text-card-foreground">{data.stance}</span>
            </span>
            <span className="text-muted-foreground">
              Position:{" "}
              <span className="font-medium tabular-nums text-card-foreground">
                #{data.position}
              </span>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
