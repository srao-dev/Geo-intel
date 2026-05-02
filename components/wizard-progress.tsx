"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface WizardProgressProps {
  currentStep: number
  totalSteps: number
  steps: string[]
}

export function WizardProgress({ currentStep, totalSteps, steps }: WizardProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                index < currentStep
                  ? "bg-primary text-primary-foreground"
                  : index === currentStep
                    ? "border-2 border-primary bg-primary/10 text-primary"
                    : "border border-border bg-card text-muted-foreground"
              )}
            >
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < totalSteps - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-8 transition-colors",
                  index < currentStep ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Step {currentStep + 1} of {totalSteps}: {steps[currentStep]}
      </p>
    </div>
  )
}
