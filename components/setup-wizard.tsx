"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Loader2, ArrowRight } from "lucide-react"

const API_BASE = "http://localhost:3000/api"

interface SetupWizardProps {
  onComplete: () => void
  onSaveExit: () => void
}

interface CompanyData {
  name: string
  url: string
  description: string
  industry: string
  icpDescription: string
  competitors: { name: string; url: string }[]
  prompts: string[]
  selectedModels: { provider: string; model: string }[]
}

interface LLMProvider {
  name: string
  models: string[]
}

export function SetupWizard({ onComplete, onSaveExit }: SetupWizardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [llmProviders, setLlmProviders] = useState<LLMProvider[]>([])
  const [data, setData] = useState<CompanyData>({
    name: "",
    url: "",
    description: "",
    industry: "",
    icpDescription: "",
    competitors: [{ name: "", url: "" }],
    prompts: [""],
    selectedModels: [],
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [configRes, companyRes] = await Promise.all([
          fetch(`${API_BASE}/config`).then((r) => r.json()),
          fetch(`${API_BASE}/company`).then((r) => r.json()),
        ])

        // Build provider list from backend config
        if (configRes.availableModels) {
          const providers = Object.entries(configRes.availableModels as Record<string, string[]>).map(
            ([name, models]) => ({ name, models })
          )
          setLlmProviders(providers)
        }

        // Pre-populate form if company data exists
        if (companyRes.company) {
          const c = companyRes.company
          // Convert llms object {ChatGPT: ["GPT-5.3"]} to selectedModels array
          const selectedModels: { provider: string; model: string }[] = []
          if (c.llms) {
            Object.entries(c.llms as Record<string, string[]>).forEach(([provider, models]) => {
              models.forEach((model) => selectedModels.push({ provider, model }))
            })
          }
          setData({
            name: c.name || "",
            url: c.url || "",
            description: c.description || "",
            industry: c.industry || "",
            icpDescription: c.icpDescription || "",
            competitors: c.competitors?.length
              ? c.competitors.map((name: string) => ({ name, url: "" }))
              : [{ name: "", url: "" }],
            prompts: c.prompts?.length ? c.prompts.map((p: { text: string }) => p.text) : [""],
            selectedModels,
          })
        }
      } catch (err) {
        console.error("Failed to load config/company data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const updateData = <K extends keyof CompanyData>(key: K, value: CompanyData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const addCompetitor = () => {
    updateData("competitors", [...data.competitors, { name: "", url: "" }])
  }

  const removeCompetitor = (index: number) => {
    updateData("competitors", data.competitors.filter((_, i) => i !== index))
  }

  const updateCompetitor = (index: number, field: "name" | "url", value: string) => {
    const updated = [...data.competitors]
    updated[index][field] = value
    updateData("competitors", updated)
  }

  const addPrompt = () => {
    updateData("prompts", [...data.prompts, ""])
  }

  const removePrompt = (index: number) => {
    updateData("prompts", data.prompts.filter((_, i) => i !== index))
  }

  const updatePrompt = (index: number, value: string) => {
    const updated = [...data.prompts]
    updated[index] = value
    updateData("prompts", updated)
  }

  const toggleModel = (provider: string, model: string) => {
    const exists = data.selectedModels.some((m) => m.provider === provider && m.model === model)
    if (exists) {
      updateData("selectedModels", data.selectedModels.filter((m) => !(m.provider === provider && m.model === model)))
    } else {
      updateData("selectedModels", [...data.selectedModels, { provider, model }])
    }
  }

  const isModelSelected = (provider: string, model: string) => {
    return data.selectedModels.some((m) => m.provider === provider && m.model === model)
  }

  const canSubmit = () => {
    return (
      data.name.trim() &&
      data.url.trim() &&
      data.prompts.some((p) => p.trim()) &&
      data.selectedModels.length > 0
    )
  }

  const buildPayload = () => {
    // Convert selectedModels array back to llms object the backend expects
    const llms: Record<string, string[]> = {}
    data.selectedModels.forEach(({ provider, model }) => {
      if (!llms[provider]) llms[provider] = []
      llms[provider].push(model)
    })

    return {
      company: {
        name: data.name,
        url: data.url,
        description: data.description,
        industry: data.industry,
        icpDescription: data.icpDescription,
        competitors: data.competitors.filter((c) => c.name.trim()).map((c) => c.name),
        prompts: data.prompts.filter((p) => p.trim()).map((text) => ({ text, source: "user" })),
        llms,
      },
      step: 6,
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit()) return
    setIsSubmitting(true)

    try {
      // Save company profile
      const saveRes = await fetch(`${API_BASE}/company`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })

      if (!saveRes.ok) {
        throw new Error("Failed to save company data")
      }

      // Start tracking job
      const trackRes = await fetch(`${API_BASE}/track/start`, { method: "POST" })
      const trackData = await trackRes.json()

      if (!trackData.success) {
        throw new Error(trackData.error || "Failed to start tracking")
      }

      onComplete()
    } catch (err) {
      console.error("Submit failed:", err)
      setIsSubmitting(false)
    }
  }

  const handleSaveExit = async () => {
    try {
      await fetch(`${API_BASE}/company`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })
    } catch (err) {
      console.error("Save failed:", err)
    }
    onSaveExit()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading configuration...</p>
      </div>
    )
  }

  if (isSubmitting) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-medium text-card-foreground">Setting up your tracking...</p>
        <p className="text-sm text-muted-foreground">
          This may take a moment while we configure your first run.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-card-foreground">Set Up Company Tracking</h1>
        <p className="mt-1 text-muted-foreground">Configure your AI visibility tracking in one place.</p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Section 1: Company Basics */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-card-foreground">1. Company Basics</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                placeholder="Acme Inc"
                value={data.name}
                onChange={(e) => updateData("name", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="company-url">Website URL *</Label>
              <Input
                id="company-url"
                placeholder="https://acme.com"
                value={data.url}
                onChange={(e) => updateData("url", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="company-description">Description</Label>
              <Textarea
                id="company-description"
                placeholder="Brief description of your company..."
                value={data.description}
                onChange={(e) => updateData("description", e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g., SaaS, E-commerce, Healthcare"
                value={data.industry}
                onChange={(e) => updateData("industry", e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Section 2: ICP Description */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-card-foreground">2. Ideal Customer Profile (ICP)</h2>
          <div className="flex flex-col gap-2">
            <Label htmlFor="icp">Describe your target customer</Label>
            <p className="text-sm text-muted-foreground">
              This helps us understand which prompts are most relevant.
            </p>
            <Textarea
              id="icp"
              placeholder="e.g., Marketing managers at mid-sized B2B SaaS companies looking to improve their AI visibility..."
              value={data.icpDescription}
              onChange={(e) => updateData("icpDescription", e.target.value)}
              rows={4}
            />
          </div>
        </section>

        {/* Section 3: Competitors */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-card-foreground">3. Competitors</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Add your main competitors to track how you compare in AI responses.
          </p>
          <div className="flex flex-col gap-3">
            {data.competitors.map((competitor, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="grid flex-1 gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Competitor name"
                    value={competitor.name}
                    onChange={(e) => updateCompetitor(index, "name", e.target.value)}
                  />
                  <Input
                    placeholder="Website URL (optional)"
                    value={competitor.url}
                    onChange={(e) => updateCompetitor(index, "url", e.target.value)}
                  />
                </div>
                {data.competitors.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCompetitor(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={addCompetitor} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Add competitor
          </Button>
        </section>

        {/* Section 4: Prompts to Track */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-card-foreground">4. Prompts to Track *</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Enter the prompts or questions you want to track across AI models.
          </p>
          <div className="flex flex-col gap-3">
            {data.prompts.map((prompt, index) => (
              <div key={index} className="flex items-start gap-3">
                <Textarea
                  placeholder={`e.g., "What are the best ${data.industry || "software"} tools?"`}
                  value={prompt}
                  onChange={(e) => updatePrompt(index, e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                {data.prompts.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePrompt(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={addPrompt} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Add prompt
          </Button>
        </section>

        {/* Section 5: LLM Models */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-card-foreground">5. Select LLM Models *</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Choose which AI models to track your brand across.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {llmProviders.map((provider) => (
              <div key={provider.name} className="rounded-lg border border-border bg-muted/30 p-4">
                <h4 className="mb-3 font-medium text-card-foreground">{provider.name}</h4>
                <div className="flex flex-col gap-2">
                  {provider.models.map((model) => (
                    <label
                      key={model}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
                    >
                      <Checkbox
                        checked={isModelSelected(provider.name, model)}
                        onCheckedChange={() => toggleModel(provider.name, model)}
                      />
                      <span className="text-sm text-card-foreground">{model}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {data.selectedModels.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              {data.selectedModels.length} model{data.selectedModels.length > 1 ? "s" : ""} selected
            </p>
          )}
        </section>

        {/* Section 6: Review Summary */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-card-foreground">6. Review Summary</h2>
          <div className="grid gap-4 rounded-lg bg-muted/50 p-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Company</p>
              <p className="mt-1 font-medium text-card-foreground">{data.name || "—"}</p>
              <p className="text-sm text-muted-foreground">{data.url || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Competitors</p>
              <p className="mt-1 text-sm text-card-foreground">
                {data.competitors.filter((c) => c.name.trim()).map((c) => c.name).join(", ") || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Prompts</p>
              <p className="mt-1 text-sm text-card-foreground">
                {data.prompts.filter((p) => p.trim()).length} prompt
                {data.prompts.filter((p) => p.trim()).length !== 1 ? "s" : ""} configured
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Models</p>
              <p className="mt-1 text-sm text-card-foreground">
                {data.selectedModels.length > 0 ? data.selectedModels.map((m) => m.model).join(", ") : "—"}
              </p>
            </div>
          </div>
        </section>

        {/* Action Bar */}
        <div className="sticky bottom-0 -mx-6 flex items-center justify-between border-t border-border bg-background px-6 py-4">
          <Button variant="ghost" onClick={handleSaveExit}>
            Save & Exit
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="gap-2 bg-primary hover:bg-[#2D47B0]"
          >
            Start Tracking
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
