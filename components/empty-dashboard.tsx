"use client"

import { Button } from "@/components/ui/button"
import { Radar, ArrowRight } from "lucide-react"

interface EmptyDashboardProps {
  onCreateNew: () => void
}

export function EmptyDashboard({ onCreateNew }: EmptyDashboardProps) {
  return (
    <div className="flex min-h-[calc(100vh-48px)] flex-col items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        {/* Icon */}
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Radar className="h-10 w-10 text-primary" />
        </div>

        {/* Heading */}
        <h1 className="mb-3 text-2xl font-semibold text-card-foreground">
          Track your brand across AI engines
        </h1>

        {/* Subheading */}
        <p className="mb-8 text-base leading-relaxed text-muted-foreground">
          Monitor how AI models like GPT, Claude, and Perplexity mention, rank, and recommend your brand compared to competitors.
        </p>

        {/* CTA Button */}
        <Button
          onClick={onCreateNew}
          size="lg"
          className="gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-[#2D47B0]"
        >
          Create new tracking
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
