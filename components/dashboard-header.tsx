"use client"

import { ChevronDown, Play, Loader2, CheckCircle2 } from "lucide-react"
import { useState } from "react"

const timeRanges = ["Last 7 days", "Last 14 days", "Last 30 days", "Last 90 days"]
const timeRangeToDays: Record<string, number> = {
  "Last 7 days": 7, "Last 14 days": 14, "Last 30 days": 30, "Last 90 days": 90,
}

interface DashboardHeaderProps {
  models: string[]
  selectedModel: string
  selectedRange: string
  lastTracked: string
  onModelChange: (model: string) => void
  onRangeChange: (range: string, days: number) => void
  onRunNow: () => Promise<void>
}

function Dropdown({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string; onChange: (val: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-muted"
      >
        {selected || label}
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-10 mt-1 min-w-full rounded-lg border border-border bg-card py-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false) }}
              className={`block w-full whitespace-nowrap px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted ${
                selected === opt ? "bg-muted font-medium text-primary" : "text-card-foreground"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function DashboardHeader({ models, selectedModel, selectedRange, lastTracked, onModelChange, onRangeChange, onRunNow }: DashboardHeaderProps) {
  const [isRunning, setIsRunning] = useState(false)

  const handleRunNow = async () => {
    setIsRunning(true)
    await onRunNow()
    setIsRunning(false)
  }

  const modelOptions = ["All models", ...models]

  return (
    <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-card px-5 py-3">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-card-foreground">AI Visibility Dashboard</h1>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          <span>Last run: {lastTracked}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Dropdown
          label="Last 30 days"
          options={timeRanges}
          selected={selectedRange}
          onChange={(val) => onRangeChange(val, timeRangeToDays[val])}
        />
        <Dropdown
          label="All models"
          options={modelOptions}
          selected={selectedModel === "all" ? "All models" : selectedModel}
          onChange={(val) => onModelChange(val === "All models" ? "all" : val)}
        />
        <button
          onClick={handleRunNow}
          disabled={isRunning}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          {isRunning ? "Running..." : "Run now"}
        </button>
      </div>
    </header>
  )
}
