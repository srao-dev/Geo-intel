"use client"

import { cn } from "@/lib/utils"
import { Plus, AlertCircle } from "lucide-react"

interface Model {
  id: string
  name: string
  hasError?: boolean
}

interface ModelSelectorProps {
  models: Model[]
  selectedModel: string | null
  onSelectModel: (modelId: string | null) => void
  onAddModel?: () => void
}

export function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
  onAddModel,
}: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {/* All Models pill */}
      <button
        onClick={() => onSelectModel(null)}
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
          selectedModel === null
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-card-foreground hover:bg-muted/80"
        )}
      >
        All Models
        {selectedModel === null && (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      {/* Model pills */}
      {models.map((model) => (
        <button
          key={model.id}
          onClick={() => onSelectModel(model.id)}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
            selectedModel === model.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-card-foreground hover:bg-muted/80"
          )}
        >
          {model.hasError && (
            <span className="flex h-2 w-2 rounded-full bg-destructive" />
          )}
          {model.name}
        </button>
      ))}

      {/* Add model button */}
      {onAddModel && (
        <button
          onClick={onAddModel}
          className="flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
