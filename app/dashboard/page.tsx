"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, RefreshCw, Play, ChevronDown, ChevronUp, Zap, TrendingUp, AlertCircle, ExternalLink } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { SetupWizard } from "@/components/setup-wizard"
import { useAuth } from "@/lib/auth-context"
import { getCompanies, getDashboardStats, getRankings, getResponses, getVisibilityPerRun } from "@/lib/queries"
import { ResponseFeed } from "@/components/response-feed"
import { VisibilityWidget } from "@/components/visibility-chart"
import { cn } from "@/lib/utils"

function formatLastRun(iso: string | null) {
  if (!iso) return "Never"
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function GaugeArc({ pct, color }: { pct: number; color: string }) {
  const r = 54, cx = 64, cy = 64
  const startAngle = -200, totalAngle = 220
  const angle = startAngle + (pct / 100) * totalAngle
  const toRad = (d: number) => (d * Math.PI) / 180
  const arcX = (a: number) => cx + r * Math.cos(toRad(a))
  const arcY = (a: number) => cy + r * Math.sin(toRad(a))
  const largeArc = (pct / 100) * totalAngle > 180 ? 1 : 0
  const trackPath = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 1 1 ${arcX(startAngle + totalAngle)} ${arcY(startAngle + totalAngle)}`
  const fillPath = pct > 0 ? `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 ${largeArc} 1 ${arcX(angle)} ${arcY(angle)}` : ""
  return (
    <svg width="128" height="96" viewBox="0 0 128 96">
      <path d={trackPath} fill="none" stroke="#f3f4f6" strokeWidth="10" strokeLinecap="round"/>
      {fillPath && <path d={fillPath} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"/>}
    </svg>
  )
}

function ModelBadge({ model }: { model: string }) {
  const m = model.toLowerCase()
  if (m.includes("gpt")) return <span className="rounded-full bg-emerald-100 text-emerald-700 px-1.5 py-0.5 text-[10px] font-semibold">GPT</span>
  if (m.includes("claude")) return <span className="rounded-full bg-orange-100 text-orange-700 px-1.5 py-0.5 text-[10px] font-semibold">C</span>
  if (m.includes("gemini")) return <span className="rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[10px] font-semibold">G</span>
  if (m.includes("sonar") || m.includes("perplexity")) return <span className="rounded-full bg-purple-100 text-purple-700 px-1.5 py-0.5 text-[10px] font-semibold">P</span>
  return <span className="rounded-full bg-muted text-muted-foreground px-1.5 py-0.5 text-[10px] font-semibold">{model.substring(0,2).toUpperCase()}</span>
}

function getRecommendations(visibility: number, totalResponses: number, topCompetitor: any, sentiment: string | undefined) {
  const recs: { icon: any; title: string; detail: string; action: string; href: string; priority: "critical" | "high" | "quick" }[] = []
  if (totalResponses === 0) {
    recs.push({ icon: AlertCircle, title: "No tracking data yet", detail: "Run your first tracking job to see how AI engines mention your brand.", action: "Run now", href: "#run", priority: "critical" })
  } else if (visibility === 0) {
    recs.push({ icon: AlertCircle, title: "Not appearing in AI answers", detail: `Mentioned in 0 of ${totalResponses} responses. Run a GEO audit to find out why.`, action: "Run GEO audit", href: "/dashboard/geo-audit", priority: "critical" })
  } else if (visibility < 30) {
    recs.push({ icon: AlertCircle, title: `Only ${visibility}% AI visibility`, detail: "Appearing in fewer than 1 in 3 responses. Content structure likely needs improvement.", action: "Run GEO audit", href: "/dashboard/geo-audit", priority: "critical" })
  }
  if (topCompetitor && topCompetitor.visibility > visibility + 20) {
    recs.push({ icon: TrendingUp, title: `${topCompetitor.name} leads by ${topCompetitor.visibility - visibility}%`, detail: "They likely have FAQPage schema, stronger authority signals, and better entity definition.", action: "Compare now", href: "/dashboard/geo-audit", priority: "high" })
  }
  if (sentiment === "negative") {
    recs.push({ icon: AlertCircle, title: "Negative sentiment detected", detail: "AI engines are describing your brand negatively. Messaging needs attention.", action: "Fix positioning", href: "/dashboard/geo-audit", priority: "high" })
  }
  if (recs.length < 3) recs.push({ icon: Zap, title: "Add FAQPage schema", detail: "Increases AI citation probability by 3.2×. Highest-ROI GEO fix available.", action: "Get fix", href: "/dashboard/geo-audit", priority: "quick" })
  if (recs.length < 3) recs.push({ icon: Zap, title: "Allow AI crawler bots", detail: "Add GPTBot, PerplexityBot and ClaudeBot to robots.txt. 15 minutes.", action: "Get fix", href: "/dashboard/geo-audit", priority: "quick" })
  if (recs.length < 3) recs.push({ icon: TrendingUp, title: "Add sameAs links", detail: "Link Wikipedia, G2, LinkedIn in Organization schema. Helps AI engines verify you.", action: "Get fix", href: "/dashboard/geo-audit", priority: "quick" })
  return recs.slice(0, 3)
}

const PBADGE = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  quick: "bg-blue-100 text-blue-700",
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [selectedModel, setSelectedModel] = useState("all")
  const [days, setDays] = useState(30)
  const [showSetup, setShowSetup] = useState(false)
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [rankings, setRankings] = useState<any[]>([])
  const [responses, setResponses] = useState<any[]>([])
  const [visibilityRuns, setVisibilityRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (!authLoading && !user) router.push("/auth") }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    getCompanies(user.id).then(data => {
      setCompanies(data)
      if (data.length > 0) setSelectedCompanyId(data[0].id)
    })
  }, [user])

  const fetchData = useCallback(async () => {
    if (!selectedCompanyId) return
    setLoading(true)
    try {
      const [s, r, resp, runs] = await Promise.all([
        getDashboardStats(selectedCompanyId, days, selectedModel),
        getRankings(selectedCompanyId),
        getResponses(selectedCompanyId, 10),
        getVisibilityPerRun(selectedCompanyId),
      ])
      setStats(s); setRankings(r); setResponses(resp); setVisibilityRuns(runs)
    } catch {}
    setLoading(false)
  }, [selectedCompanyId, days, selectedModel])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRunNow = async () => {
    if (!selectedCompanyId) return
    await fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyId: selectedCompanyId }) })
    setTimeout(fetchData, 3000)
  }

  if (authLoading || !user) return null

  const ourBrand = rankings.find(r => r.isOurBrand)
  const topCompetitor = rankings.filter(r => !r.isOurBrand).sort((a, b) => b.visibility - a.visibility)[0]
  const visibility = stats?.visibility || 0
  const gaugeColor = visibility >= 60 ? "#16a34a" : visibility >= 30 ? "#d97706" : "#dc2626"
  const recs = getRecommendations(visibility, stats?.totalResponses || 0, topCompetitor, ourBrand?.sentiment)
  const sorted = [...rankings].sort((a, b) => b.visibility - a.visibility)
  const maxVis = sorted[0]?.visibility || 100

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {showSetup && <SetupWizard onComplete={() => { setShowSetup(false); fetchData() }} onSaveExit={() => setShowSetup(false)} />}
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border bg-card px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-semibold text-card-foreground">AI Visibility Dashboard</h1>
              {stats?.lastRunAt && <p className="text-xs text-muted-foreground">Last run: {formatLastRun(stats.lastRunAt)}</p>}
            </div>
            {companies.length > 1 && (
              <select value={selectedCompanyId || ""} onChange={e => setSelectedCompanyId(e.target.value)} className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-card-foreground outline-none">
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSetup(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add company
            </button>
            <button onClick={fetchData} className="p-1.5 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleRunNow} className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:bg-primary/90 transition-colors">
              <Play className="h-3.5 w-3.5" /> Run now
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-card-foreground mb-1">No companies tracked yet</h2>
                <p className="text-sm text-muted-foreground mb-4">Add your first company to start tracking AI visibility</p>
                <button onClick={() => setShowSetup(true)} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors mx-auto">
                  <Plus className="h-4 w-4" /> Add company
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Row 1 — Hero visibility + status strip */}
              <div className="grid grid-cols-12 gap-4">
                {/* Hero visibility gauge */}
                <div className="col-span-3 rounded-2xl border border-border bg-card p-5 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 50% 80%, ${gaugeColor}, transparent 70%)` }} />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">AI Visibility</p>
                  <div className="relative">
                    <GaugeArc pct={visibility} color={gaugeColor} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center mt-4">
                      <span className="text-3xl font-black tabular-nums" style={{ color: gaugeColor }}>{visibility}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {stats?.mentionCount || 0} of {stats?.totalResponses || 0} answers
                  </p>
                  <div className="mt-3 w-full">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${visibility}%`, background: gaugeColor }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">0%</span>
                      <span className="text-[10px] text-muted-foreground">100%</span>
                    </div>
                  </div>
                </div>

                {/* Status strip — rank, sentiment, GEO */}
                <div className="col-span-3 flex flex-col gap-3">
                  <div className="flex-1 rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-1">Your Rank</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-card-foreground tabular-nums">
                        {stats?.rank ? `#${stats.rank}` : "—"}
                      </span>
                      {stats?.shareOfVoice?.length > 0 && <span className="text-xs text-muted-foreground">of {stats.shareOfVoice.length}</span>}
                    </div>
                  </div>
                  <div className="flex-1 rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-1">Avg Position</p>
                    <span className="text-3xl font-black text-card-foreground tabular-nums">
                      {ourBrand?.avgPosition ? `#${ourBrand.avgPosition.toFixed(1)}` : "—"}
                    </span>
                  </div>
                </div>

                {/* Visibility trend */}
                <div className="col-span-3 rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Visibility trend</p>
                  <div className="w-72 flex-shrink-0">
                    <VisibilityWidget runs={visibilityRuns} />
                  </div>
                </div>

                {/* Sentiment + models */}
                <div className="col-span-3 rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
                    <div className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
                      ourBrand?.sentiment === "positive" ? "bg-emerald-100 text-emerald-700" :
                      ourBrand?.sentiment === "negative" ? "bg-red-100 text-red-700" :
                      "bg-muted text-muted-foreground"
                    )}>
                      <span className={cn("h-2 w-2 rounded-full",
                        ourBrand?.sentiment === "positive" ? "bg-emerald-500" :
                        ourBrand?.sentiment === "negative" ? "bg-red-500" : "bg-gray-400"
                      )} />
                      {ourBrand?.sentiment ? ourBrand.sentiment.charAt(0).toUpperCase() + ourBrand.sentiment.slice(1) : "No data"}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Tracked engines</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {(ourBrand?.models || []).map((m: string) => <ModelBadge key={m} model={m} />)}
                      {(!ourBrand?.models || ourBrand.models.length === 0) && <span className="text-xs text-muted-foreground">No data yet</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2 — Share of voice + Recommendations + Responses */}
              <div className="grid grid-cols-12 gap-4">
                {/* Share of voice — visual bars */}
                <div className="col-span-3 rounded-xl border border-violet-200 border-t-4 border-t-violet-400 bg-violet-50 p-4">
                  <p className="text-sm font-semibold text-violet-900 mb-1">Share of Voice</p>
                  <p className="text-xs text-violet-600 mb-4">Your brand vs competitors</p>
                  {sorted.length === 0
                    ? <p className="text-xs text-violet-500">Run tracking to see data</p>
                    : <div className="flex flex-col gap-3">
                        {sorted.map((entry, i) => (
                          <div key={entry.name}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={cn("text-xs truncate max-w-24", entry.isOurBrand ? "font-semibold text-violet-900" : "text-violet-700")}>
                                {entry.name}{entry.isOurBrand && " ★"}
                              </span>
                              <span className={cn("text-xs font-bold tabular-nums ml-2",
                                entry.visibility >= 60 ? "text-emerald-600" :
                                entry.visibility >= 30 ? "text-amber-600" : "text-red-500"
                              )}>{entry.visibility}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-violet-200 overflow-hidden">
                              <div className={cn("h-full rounded-full transition-all duration-700", entry.isOurBrand ? "bg-violet-600" : i === 0 ? "bg-blue-500" : i === 1 ? "bg-purple-500" : "bg-indigo-400")}
                                style={{ width: `${maxVis > 0 ? (entry.visibility / maxVis) * 100 : 0}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                </div>

                {/* Recommendations — action-oriented */}
                <div className="col-span-5 rounded-xl border border-amber-200 border-t-4 border-t-amber-400 bg-amber-50 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Recommended Actions</p>
                      <p className="text-xs text-amber-700">Based on your visibility data</p>
                    </div>
                    <button onClick={() => router.push("/dashboard/geo-audit")} className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                      Full audit <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {recs.map((rec, i) => {
                      const Icon = rec.icon
                      return (
                        <div key={i} onClick={() => rec.href !== "#run" && router.push(rec.href)}
                          className={cn("rounded-lg border border-border bg-white/70 p-3 flex gap-2.5 cursor-pointer hover:bg-white transition-colors",
                            rec.priority === "critical" ? "border-l-4 border-l-red-500" :
                            rec.priority === "high" ? "border-l-4 border-l-orange-400" : "border-l-4 border-l-blue-400"
                          )}>
                          <Icon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", PBADGE[rec.priority])}>
                                {rec.priority === "quick" ? "Quick win" : rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-card-foreground">{rec.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{rec.detail}</p>
                          </div>
                          <span className="text-xs text-primary font-medium flex-shrink-0 self-center">{rec.action} →</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* LLM Responses feed */}
                <div className="col-span-4 rounded-xl border border-indigo-200 border-t-4 border-t-indigo-400 bg-indigo-50 p-4 flex flex-col gap-2 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-indigo-900">LLM Responses</p>
                    <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{responses.length} total</span>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <ResponseFeed responses={responses} />
                  </div>
                </div>
              </div>

              {/* Row 3 — Brand rankings table */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">Brand Rankings</p>
                    <p className="text-xs text-muted-foreground">Your brand vs competitors across all AI responses</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {["Rank", "Brand", "Visibility", "Avg Position", "Sentiment", "Mentioned by"].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No data yet — run tracking to see rankings</td></tr>
                      ) : rankings.map((r, i) => (
                        <tr key={r.name} className={cn("border-b border-border last:border-0 transition-colors", r.isOurBrand ? "bg-primary/5" : "hover:bg-muted/20")}>
                          <td className="px-4 py-3">
                            <span className={cn("text-sm font-bold tabular-nums", i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-muted-foreground")}>#{r.rank}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
                                r.isOurBrand ? "bg-primary" : ["bg-blue-500","bg-purple-500","bg-emerald-500","bg-orange-500","bg-pink-500"][i % 5]
                              )}>{r.name.charAt(0).toUpperCase()}</div>
                              <div>
                                <p className={cn("text-sm", r.isOurBrand ? "font-semibold text-primary" : "font-medium text-card-foreground")}>{r.name}</p>
                                <p className="text-xs text-muted-foreground">{r.mentionCount} of {r.totalResponses} responses</p>
                              </div>
                              {r.isOurBrand && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">You</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className={cn("h-full rounded-full", r.visibility >= 60 ? "bg-emerald-500" : r.visibility >= 30 ? "bg-amber-400" : "bg-red-500")}
                                  style={{ width: `${r.visibility}%` }} />
                              </div>
                              <span className={cn("text-sm font-bold tabular-nums", r.visibility >= 60 ? "text-emerald-600" : r.visibility >= 30 ? "text-amber-600" : "text-red-500")}>{r.visibility}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-card-foreground tabular-nums">{r.avgPosition ? `#${r.avgPosition.toFixed(1)}` : "—"}</td>
                          <td className="px-4 py-3">
                            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                              r.sentiment === "positive" ? "bg-emerald-100 text-emerald-700" :
                              r.sentiment === "negative" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
                            )}>{r.sentiment ? r.sentiment.charAt(0).toUpperCase() + r.sentiment.slice(1) : "Neutral"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {(r.models || []).map((m: string) => <ModelBadge key={m} model={m} />)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
