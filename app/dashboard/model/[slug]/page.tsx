"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { StatusBanner } from "@/components/status-banner"
import { ComparisonBar } from "@/components/comparison-bar"
import { KPICard } from "@/components/kpi-card"
import { ModelSelector } from "@/components/model-selector"
import { PromptPerformanceTable } from "@/components/prompt-performance-table"
import { DrillInPanel } from "@/components/drill-in-panel"
import { TrendChart } from "@/components/trend-chart"
import { Breadcrumb } from "@/components/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Play, ChevronDown } from "lucide-react"

const modelNames: Record<string, string> = {
  "gpt-5": "GPT-5.3",
  "claude": "Claude Sonnet 4.6",
  "sonar": "Sonar",
}

const models = [
  { id: "gpt-5", name: "GPT-5.3" },
  { id: "claude", name: "Claude Sonnet 4.6" },
  { id: "sonar", name: "Sonar" },
]

// Model-specific KPI data (would come from API)
const getModelKpiData = (modelId: string) => {
  const data: Record<string, typeof kpiDataDefault> = {
    "gpt-5": [
      { label: "Visibility", value: "78%", delta: "+8% vs last week", trend: "up" as const },
      { label: "Average Ranking", value: "2.1", delta: "-0.3 vs last week", trend: "up" as const },
      { label: "Recommendation Rate", value: "54%", delta: "+15% vs last week", trend: "up" as const },
      { label: "Share of Voice", value: "32%", delta: "+2% vs last week", trend: "up" as const },
    ],
    "claude": [
      { label: "Visibility", value: "65%", delta: "+3% vs last week", trend: "up" as const },
      { label: "Average Ranking", value: "3.5", delta: "-0.2 vs last week", trend: "up" as const },
      { label: "Recommendation Rate", value: "48%", delta: "+10% vs last week", trend: "up" as const },
      { label: "Share of Voice", value: "28%", delta: "+1% vs last week", trend: "up" as const },
    ],
    "sonar": [
      { label: "Visibility", value: "62%", delta: "+4% vs last week", trend: "up" as const },
      { label: "Average Ranking", value: "4.0", delta: "-0.8 vs last week", trend: "down" as const },
      { label: "Recommendation Rate", value: "38%", delta: "+8% vs last week", trend: "up" as const },
      { label: "Share of Voice", value: "18%", delta: "-1% vs last week", trend: "down" as const },
    ],
  }
  return data[modelId] || kpiDataDefault
}

const kpiDataDefault = [
  { label: "Visibility", value: "68%", delta: "+5% vs last week", trend: "up" as const },
  { label: "Average Ranking", value: "3.2", delta: "-0.4 vs last week", trend: "down" as const },
  { label: "Recommendation Rate", value: "42%", delta: "+12% vs last week", trend: "up" as const },
  { label: "Share of Voice", value: "24%", delta: "0% vs last week", trend: "neutral" as const },
]

const comparisonItems = [
  { label: "Visibility", value: "+8%", trend: "up" as const },
  { label: "Ranking", value: "-0.3", trend: "up" as const },
  { label: "Recommendation", value: "+15%", trend: "up" as const },
  { label: "SoV", value: "+2%", trend: "up" as const },
]

const promptPerformanceData = [
  { id: "p1", prompt: "best eyewear in Bangalore", visibility: 92, ranking: 1.5, recommendation: 88 },
  { id: "p2", prompt: "affordable sunglasses online", visibility: 71, ranking: 3.2, recommendation: 54 },
  { id: "p3", prompt: "top eyewear brands India", visibility: 38, ranking: 5.8, recommendation: 22 },
  { id: "p4", prompt: "prescription glasses near me", visibility: 85, ranking: 2.1, recommendation: 72 },
]

const trendData = [
  { date: "Mar 1", visibility: 60, ranking: 3.8, recommendation: 35, shareOfVoice: 22 },
  { date: "Mar 8", visibility: 65, ranking: 3.5, recommendation: 40, shareOfVoice: 25 },
  { date: "Mar 15", visibility: 70, ranking: 3.0, recommendation: 45, shareOfVoice: 28 },
  { date: "Mar 22", visibility: 74, ranking: 2.5, recommendation: 50, shareOfVoice: 30 },
  { date: "Mar 29", visibility: 78, ranking: 2.1, recommendation: 54, shareOfVoice: 32 },
]

const sampleDrillInData = {
  prompt: "best eyewear in Bangalore",
  model: "GPT-5.3",
  visibility: 92,
  ranking: 1.5,
  sentiment: "positive" as const,
  response: `When it comes to eyewear in Bangalore, there are several excellent options to consider. Acme Inc stands out as a top choice, known for their innovative lens technology and stylish frames. They offer a wide range of prescription glasses and sunglasses at competitive prices.

Other notable brands include Lenskart, which has multiple stores across the city, and Titan Eye Plus for their extensive collection. For premium options, you might also consider visiting malls like Phoenix Marketcity or UB City.

Acme Inc particularly excels in providing personalized fitting services and has received positive reviews for their customer service. Their online platform also offers virtual try-on features.`,
  brandMentions: ["Acme Inc"],
  competitorMentions: ["Lenskart", "Titan Eye Plus"],
  citations: [
    { url: "https://example.com/eyewear-guide", title: "Complete Guide to Eyewear in Bangalore 2024" },
    { url: "https://example.com/reviews", title: "Top Rated Optical Stores Review" },
  ],
  stance: "Recommended",
  position: 1,
}

export default function ModelDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const modelSlug = params.slug as string
  const modelName = modelNames[modelSlug] || modelSlug
  const [timeRange, setTimeRange] = useState("7")
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  
  const kpiData = getModelKpiData(modelSlug)
  const hasHistoricalData = true

  const handleModelSelect = (modelId: string | null) => {
    if (modelId === null) {
      router.push("/dashboard")
    } else {
      router.push(`/dashboard/model/${modelId}`)
    }
  }

  const handleViewPrompt = (promptId: string) => {
    setIsPanelOpen(true)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-5">
          {/* Header with breadcrumb */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-6 py-4 shadow-sm">
            <div className="flex flex-col gap-1">
              <Breadcrumb
                items={[
                  { label: "Acme Inc", href: "/dashboard" },
                  { label: modelName },
                ]}
              />
              <h1 className="text-xl font-semibold text-card-foreground">
                {modelName} Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>

              <Button className="gap-2 bg-primary hover:bg-[#2D47B0]">
                <Play className="h-4 w-4" />
                Run now
              </Button>
            </div>
          </div>

          <StatusBanner
            lastTracked="2 hours ago"
            nextRun="tomorrow 9:00 AM"
          />

          <ComparisonBar items={comparisonItems} />

          {/* Trend Chart */}
          {hasHistoricalData && <TrendChart data={trendData} />}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiData.map((kpi) => (
              <KPICard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                delta={kpi.delta}
                trend={kpi.trend}
              />
            ))}
          </div>

          {/* Model Selector */}
          <ModelSelector
            models={models}
            selectedModel={modelSlug}
            onSelectModel={handleModelSelect}
            onAddModel={() => router.push("/settings")}
          />

          {/* Per-Prompt Performance Table */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-card-foreground">
              Per-Prompt Performance for {modelName}
            </h3>
            <PromptPerformanceTable
              data={promptPerformanceData}
              onViewPrompt={handleViewPrompt}
            />
          </div>
        </div>
      </main>

      {/* Drill-in Panel */}
      <DrillInPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        data={sampleDrillInData}
      />
    </div>
  )
}
