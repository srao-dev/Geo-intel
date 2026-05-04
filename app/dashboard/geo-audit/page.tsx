"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/lib/auth-context"
import { Search, Loader2, ChevronDown, ChevronUp, Zap, AlertTriangle, AlertCircle, Info, ArrowRight, X, FileText, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"

const DIMENSION_LABELS: Record<string, string> = {
  "geo-competitive": "Competitive", "geo-content": "Content",
  "geo-authority": "Authority", "geo-schema": "Schema", "geo-crawl": "Crawlability",
}

const GRADE_COLORS: Record<string, string> = {
  A: "text-emerald-600", B: "text-blue-600", C: "text-amber-500", D: "text-orange-500", F: "text-red-600",
}

const GRADE_BG: Record<string, string> = {
  A: "bg-emerald-50 border-emerald-300", B: "bg-blue-50 border-blue-300",
  C: "bg-amber-50 border-amber-300", D: "bg-orange-50 border-orange-300", F: "bg-red-50 border-red-300",
}

const SEVERITY_STYLES: Record<string, { border: string; bg: string; icon: any; label: string; text: string; badge: string }> = {
  Critical: { border: "border-l-red-500", bg: "bg-red-50", icon: AlertCircle, label: "Critical", text: "text-red-700", badge: "bg-red-100 text-red-700" },
  High:     { border: "border-l-orange-400", bg: "bg-orange-50", icon: AlertTriangle, label: "High", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
  Medium:   { border: "border-l-amber-400", bg: "bg-amber-50", icon: Info, label: "Medium", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  strong:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  weak:    { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400"   },
  missing: { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",      dot: "bg-red-500"     },
}

const PRIORITY_STYLES: Record<string, { badge: string }> = {
  critical: { badge: "bg-red-100 text-red-700" },
  high:     { badge: "bg-orange-100 text-orange-700" },
  quick:    { badge: "bg-blue-100 text-blue-700" },
}

function ScoreBar({ score, dimension }: { score: number; dimension: string }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-500"
  const textColor = score >= 70 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-500"
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 flex-shrink-0 text-xs font-medium text-muted-foreground">{DIMENSION_LABELS[dimension]}</span>
      <div className="flex-1 h-2.5 rounded-full bg-white/60 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("w-8 flex-shrink-0 text-right text-sm font-bold tabular-nums", textColor)}>{score}</span>
    </div>
  )
}

function FindingRow({ finding, domain, vertical }: { finding: any; domain: string; vertical: string }) {
  const [open, setOpen] = useState(false)
  const [loadingFix, setLoadingFix] = useState(false)
  const [fix, setFix] = useState<any>(null)
  const style = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.Medium
  const Icon = style.icon

  const getFix = async () => {
    setLoadingFix(true)
    try {
      const res = await fetch("/api/geo-fix", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, finding, vertical }),
      })
      const data = await res.json()
      if (data.fix) setFix(data.fix)
    } catch {}
    setLoadingFix(false)
  }

  return (
    <div className={cn("rounded-xl border border-border border-l-4 overflow-hidden shadow-sm", style.border, style.bg)}>
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-start gap-3 px-4 py-4 text-left hover:brightness-95 transition-all">
        <span className={cn("flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 mt-0.5", style.badge)}>
          <Icon className="h-3 w-3" />{style.label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-card-foreground">{finding.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{DIMENSION_LABELS[finding.dimension]} · {finding.effort} to fix</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />}
      </button>
      {open && (
        <div className="border-t border-border/50 px-5 py-4 flex flex-col gap-4 bg-white/40">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">The Problem</p>
            <p className="text-sm text-card-foreground leading-relaxed">{finding.detail}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Recommendation</p>
            <p className="text-sm text-card-foreground leading-relaxed">{finding.recommendation}</p>
          </div>
          {!fix && (
            <button onClick={getFix} disabled={loadingFix} className="flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-sm">
              {loadingFix ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</> : <><Zap className="h-3.5 w-3.5" /> Get copy-paste fix</>}
            </button>
          )}
          {fix && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Generated Fix</p>
                <span className="text-xs text-muted-foreground">{fix.implementation_time}</span>
              </div>
              <p className="text-sm text-card-foreground leading-relaxed">{fix.summary}</p>
              {fix.code && <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{fix.code}</pre>}
              {fix.instructions && (
                <ol className="flex flex-col gap-1.5">
                  {fix.instructions.map((step: string, i: number) => (
                    <li key={i} className="flex gap-2 text-xs text-card-foreground">
                      <span className="flex-shrink-0 font-bold text-primary">{i + 1}.</span>{step}
                    </li>
                  ))}
                </ol>
              )}
              <p className="text-xs text-muted-foreground border-t border-border pt-2">
                <span className="font-semibold text-card-foreground">Impact: </span>{fix.impact}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PageDrillDown({ contentType, domain, vertical, onClose }: { contentType: string; domain: string; vertical: string; onClose: () => void }) {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [error, setError] = useState("")

  const run = async () => {
    if (!url.trim()) return
    setLoading(true); setError(""); setAnalysis(null)
    try {
      const res = await fetch("/api/content-page-analysis", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), contentType, domain, vertical }),
      })
      const data = await res.json()
      if (data.analysis) setAnalysis(data.analysis)
      else setError(data.error || "Analysis failed")
    } catch { setError("Could not connect to analysis service") }
    setLoading(false)
  }

  const gradeColor = analysis ? GRADE_COLORS[analysis.geo_grade] : ""
  const gradeBg = analysis ? GRADE_BG[analysis.geo_grade] : ""

  return (
    <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">Deep Page Analysis</p>
          <p className="text-xs text-muted-foreground mt-0.5">Paste a specific {contentType} URL to get a detailed rewrite brief</p>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-card-foreground">✕ Close</button>
      </div>

      <div className="flex gap-2">
        <input
          type="text" value={url} onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && run()}
          placeholder={`e.g. ${domain}/blog/your-post-title`}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button onClick={run} disabled={loading || !url.trim()} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analysing...</> : <>Analyse →</>}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {loading && (
        <div className="flex items-center gap-3 py-4 justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Reading page content and generating brief...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="flex flex-col gap-4">
          {/* Score */}
          <div className={cn("rounded-xl border-2 p-4", gradeBg)}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground font-medium truncate max-w-xs">{analysis.page_title}</p>
                <p className="text-xs text-muted-foreground">{analysis.content_type}</p>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black tabular-nums text-card-foreground leading-none">{analysis.geo_score}</span>
                <span className={cn("text-2xl font-black mb-0.5", gradeColor)}>{analysis.geo_grade}</span>
              </div>
            </div>
            <p className="text-xs text-card-foreground leading-relaxed">{analysis.summary}</p>
          </div>

          {/* What works */}
          {analysis.what_works?.length > 0 && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
              <p className="text-xs font-semibold text-emerald-800 mb-2">✅ What works</p>
              {analysis.what_works.map((w: string, i: number) => (
                <p key={i} className="text-xs text-emerald-700 leading-relaxed">• {w}</p>
              ))}
            </div>
          )}

          {/* Critical gaps */}
          {analysis.critical_gaps?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Critical Gaps & Fixes</p>
              <div className="flex flex-col gap-2">
                {analysis.critical_gaps.map((gap: any, i: number) => (
                  <div key={i} className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-semibold text-red-800 mb-1">Gap: {gap.gap}</p>
                    <p className="text-xs text-red-700 mb-1"><span className="font-semibold">Fix:</span> {gap.fix}</p>
                    {gap.example && (
                      <div className="mt-2 bg-white/70 rounded p-2 border border-red-100">
                        <p className="text-xs text-muted-foreground font-medium mb-0.5">Example:</p>
                        <p className="text-xs text-card-foreground italic">"{gap.example}"</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">→ {gap.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schema to add */}
          {analysis.missing_schema?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Schema to Add</p>
              <div className="flex flex-col gap-2">
                {analysis.missing_schema.map((s: any, i: number) => (
                  <div key={i} className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-blue-800">{s.type}</p>
                    </div>
                    <p className="text-xs text-blue-700 mb-2">{s.why}</p>
                    {s.snippet && <pre className="text-xs font-mono bg-white/70 p-2 rounded border border-blue-100 overflow-x-auto whitespace-pre-wrap">{s.snippet}</pre>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rewrite suggestions */}
          {analysis.rewrite_suggestions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Rewrite Suggestions</p>
              <div className="flex flex-col gap-2">
                {analysis.rewrite_suggestions.map((r: any, i: number) => (
                  <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-800 mb-2">{r.element}</p>
                    {r.current && (
                      <div className="mb-2">
                        <p className="text-xs text-muted-foreground font-medium mb-0.5">Current:</p>
                        <p className="text-xs text-card-foreground bg-white/60 rounded p-1.5 border border-amber-100 italic">"{r.current}"</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-0.5">Suggested:</p>
                      <p className="text-xs text-amber-900 bg-white/60 rounded p-1.5 border border-amber-100 font-medium">"{r.suggested}"</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">→ {r.why}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick wins */}
          {analysis.quick_wins?.length > 0 && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
              <p className="text-xs font-semibold text-teal-800 mb-2">⚡ Quick wins for this page</p>
              {analysis.quick_wins.map((w: any, i: number) => (
                <div key={i} className="flex items-start gap-2 mb-1.5">
                  <span className="text-teal-500 font-bold text-xs flex-shrink-0">{i+1}.</span>
                  <div>
                    <p className="text-xs font-medium text-teal-800">{w.action}</p>
                    <p className="text-xs text-teal-600">{w.impact} · ⏱ {w.effort}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ContentTypeCard({ ct, domain, vertical }: { ct: any; domain: string; vertical: string }) {
  const [open, setOpen] = useState(false)
  const [showDrillDown, setShowDrillDown] = useState(false)
  const st = STATUS_STYLES[ct.status] || STATUS_STYLES.weak
  const scoreColor = ct.score >= 70 ? "text-emerald-600" : ct.score >= 50 ? "text-amber-600" : "text-red-500"

  return (
    <div className={cn("rounded-xl border overflow-hidden shadow-sm", st.border, st.bg)}>
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:brightness-95 transition-all">
        <span className="text-2xl flex-shrink-0">{ct.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-card-foreground">{ct.type}</p>
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", st.bg, st.text, "border", st.border)}>
              <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1", st.dot)} />
              {ct.status.charAt(0).toUpperCase() + ct.status.slice(1)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{ct.current_state}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={cn("text-xl font-black tabular-nums", scoreColor)}>{ct.score}</span>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border/50 px-5 py-4 bg-white/50 flex flex-col gap-4">
          {ct.gap && (
            <div className="rounded-lg bg-white/70 border border-border/50 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">GEO Gap</p>
              <p className="text-sm text-card-foreground">{ct.gap}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Specific Recommendations</p>
            <div className="flex flex-col gap-2">
              {ct.recommendations?.map((rec: any, i: number) => {
                const ps = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.quick
                return (
                  <div key={i} className="rounded-lg bg-white/80 border border-border/60 p-3">
                    <div className="flex items-start gap-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded", ps.badge)}>
                            {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">⏱ {rec.effort}</span>
                        </div>
                        <p className="text-xs font-semibold text-card-foreground mb-0.5">
                          <span className="text-primary">{rec.action}:</span> {rec.title}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{rec.why}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            onClick={() => setShowDrillDown(s => !s)}
            className="flex items-center gap-2 text-xs text-primary font-semibold hover:underline mt-1"
          >
            <Search className="h-3.5 w-3.5" />
            {showDrillDown ? "Hide page analyser" : "Analyse a specific page →"}
          </button>

          {showDrillDown && (
            <PageDrillDown
              contentType={ct.type}
              domain={domain}
              vertical={vertical}
              onClose={() => setShowDrillDown(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function ContentAnalysisTab({ domain, vertical }: { domain: string; vertical: string }) {
  const [urls, setUrls] = useState({
    blog: "", compare: "", casestudies: "", solutions: "", faq: "", whitepapers: ""
  })
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [foundPages, setFoundPages] = useState<string[]>([])
  const [error, setError] = useState("")

  const FIELDS = [
    { key: "blog", label: "Blog / Articles / Resources", placeholder: "e.g. uipath.com/blog", icon: "📝" },
    { key: "compare", label: "Comparison Pages", placeholder: "e.g. uipath.com/rpa/rpa-vs-ai", icon: "⚔️" },
    { key: "casestudies", label: "Case Studies", placeholder: "e.g. uipath.com/automation-case-studies", icon: "📈" },
    { key: "solutions", label: "Solutions / Products", placeholder: "e.g. uipath.com/solutions", icon: "🏭" },
    { key: "faq", label: "FAQ / Help", placeholder: "e.g. uipath.com/faq", icon: "❓" },
    { key: "whitepapers", label: "Whitepapers / Thought Leadership", placeholder: "e.g. uipath.com/resources/whitepapers", icon: "📄" },
  ]

  const hasAnyUrl = Object.values(urls).some(v => v.trim())

  const run = async () => {
    if (!hasAnyUrl) return
    setLoading(true); setError(""); setAnalysis(null)
    // Extract domain from first filled URL
    const firstUrl = Object.values(urls).find(v => v.trim()) || ""
    const inferredDomain = firstUrl.replace(/^https?:\/\//, "").split("/")[0]
    try {
      const res = await fetch("/api/content-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: inferredDomain,
          vertical,
          customUrls: urls,
        }),
      })
      const data = await res.json()
      if (data.analysis) { setAnalysis(data.analysis); setFoundPages(data.foundPages || []) }
      else setError(data.error || "Analysis failed")
    } catch { setError("Failed to connect to analysis service") }
    setLoading(false)
  }

  const scoreStatus = (score: number) => {
    if (score >= 75) return { label: "Strong", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300" }
    if (score >= 55) return { label: "Good", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-300" }
    if (score >= 35) return { label: "Needs work", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300" }
    if (score >= 20) return { label: "Weak", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-300" }
    return { label: "Critical", color: "text-red-700", bg: "bg-red-50", border: "border-red-300" }
  }

  const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    strong:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    good:    { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500"    },
    weak:    { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400"   },
    missing: { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500"     },
    unknown: { bg: "bg-muted",      text: "text-muted-foreground", border: "border-border", dot: "bg-gray-400"    },
    blocked: { bg: "bg-muted",      text: "text-muted-foreground", border: "border-border", dot: "bg-gray-400"    },
  }

  return (
    <div className="flex flex-col gap-5">
      {/* URL inputs — primary interface */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-semibold text-card-foreground">Paste your content URLs</p>
          <p className="text-xs text-muted-foreground mt-0.5">Fill in the sections you want analysed — leave blank what you don't have. No guessing, no crawling failures.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {FIELDS.map(({ key, label, placeholder, icon }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <span>{icon}</span>{label}
              </label>
              <input
                type="text"
                value={urls[key as keyof typeof urls]}
                onChange={e => setUrls(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          ))}
        </div>
        <button
          onClick={run}
          disabled={loading || !hasAnyUrl}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing...</> : <>Analyse Content <ArrowRight className="h-4 w-4" /></>}
        </button>
        {!hasAnyUrl && <p className="text-xs text-muted-foreground mt-2">Add at least one URL to run the analysis</p>}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-semibold text-card-foreground">Fetching and analysing your content...</p>
            <p className="text-xs text-muted-foreground mt-1">Reading each URL and checking AI citation readiness · ~30 seconds</p>
          </div>
        </div>
      )}

      {analysis && !loading && (
        <div className="flex flex-col gap-4">
          {/* Score card */}
          {analysis.overall_score != null && (
            <div className={cn("rounded-2xl border-2 p-5 shadow-sm", scoreStatus(analysis.overall_score).bg, scoreStatus(analysis.overall_score).border)}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Content GEO Score</p>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-6xl font-black tabular-nums text-card-foreground leading-none">{analysis.overall_score}</span>
                <span className={cn("text-lg font-bold px-2 py-0.5 rounded-lg mb-1", scoreStatus(analysis.overall_score).color, scoreStatus(analysis.overall_score).bg)}>
                  {scoreStatus(analysis.overall_score).label}
                </span>
              </div>
              <p className="text-sm text-card-foreground leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {analysis.crawl_blocked && !analysis.overall_score && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Site blocked automated access</p>
              <p className="text-xs text-amber-700 leading-relaxed">{analysis.summary}</p>
              <p className="text-xs text-amber-700 mt-2">Try the <strong>Page Analyser</strong> — paste a specific page URL and we'll analyse it directly.</p>
            </div>
          )}

          {/* Missing content */}
          {analysis.missing_content?.length > 0 && analysis.missing_content[0] !== "Unable to identify missing content — no pages were accessible for analysis" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">⚠️ Critical content gaps</p>
              {analysis.missing_content.map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-2 mb-1">
                  <span className="text-red-400 flex-shrink-0">→</span>
                  <p className="text-xs text-red-700">{item}</p>
                </div>
              ))}
            </div>
          )}

          {/* Content type cards */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Analysis by Content Type</p>
            <div className="flex flex-col gap-2">
              {analysis.content_types?.map((ct: any, i: number) => {
                const [open, setOpen] = useState(false)
                const [showDrill, setShowDrill] = useState(false)
                const st = STATUS_STYLES[ct.status] || STATUS_STYLES.unknown
                const sc = scoreStatus(ct.score || 0)
                return (
                  <div key={i} className={cn("rounded-xl border overflow-hidden shadow-sm", st.border, st.bg)}>
                    <button onClick={() => setOpen(o => !o)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:brightness-95 transition-all">
                      <span className="text-xl flex-shrink-0">{ct.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-card-foreground">{ct.type}</p>
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", st.bg, st.text, st.border)}>
                            <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle", st.dot)} />
                            {ct.status === "unknown" || ct.status === "blocked" ? "Not checked" : ct.status.charAt(0).toUpperCase() + ct.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{ct.current_state}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {ct.score > 0 && <span className={cn("text-xl font-black tabular-nums", sc.color)}>{ct.score}</span>}
                        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {open && (
                      <div className="border-t border-border/50 px-5 py-4 bg-white/50 flex flex-col gap-4">
                        {ct.gap && ct.gap !== "Manual review needed" && (
                          <div className="rounded-lg bg-white/70 border border-border/50 px-3 py-2.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">GEO Gap</p>
                            <p className="text-sm text-card-foreground">{ct.gap}</p>
                          </div>
                        )}
                        {ct.recommendations?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recommendations</p>
                            <div className="flex flex-col gap-2">
                              {ct.recommendations.map((rec: any, j: number) => (
                                <div key={j} className="rounded-lg bg-white/80 border border-border/60 p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded",
                                      rec.priority === "critical" ? "bg-red-100 text-red-700" :
                                      rec.priority === "high" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                                    )}>{rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}</span>
                                    <span className="text-xs text-muted-foreground">⏱ {rec.effort}</span>
                                  </div>
                                  <p className="text-xs font-semibold text-card-foreground">
                                    <span className="text-primary">{rec.action}:</span> {rec.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{rec.why}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <button onClick={() => setShowDrill(s => !s)} className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline">
                          <Search className="h-3.5 w-3.5" />
                          {showDrill ? "Hide page analyser" : "Analyse a specific page from this section →"}
                        </button>
                        {showDrill && (
                          <PageDrillDown contentType={ct.type} domain={Object.values(urls).find((v: any) => v)?.split("/")[0] || ""} vertical={vertical} onClose={() => setShowDrill(false)} />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick wins */}
          {analysis.quick_wins?.length > 0 && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
              <p className="text-sm font-semibold text-teal-800 mb-3">⚡ Quick wins — do these this week</p>
              <div className="flex flex-col gap-2">
                {analysis.quick_wins.map((win: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-white/60 rounded-lg p-3 border border-teal-100">
                    <span className="text-teal-500 font-bold text-sm flex-shrink-0">{i + 1}.</span>
                    <div>
                      <p className="text-xs font-semibold text-card-foreground">{win.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{win.impact}</p>
                      <span className="text-xs text-teal-600 font-medium">⏱ {win.effort}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="flex flex-col items-center text-center py-10 gap-5">
          <div>
            <p className="text-base font-semibold text-card-foreground mb-1">Content intelligence across 6 content types</p>
            <p className="text-sm text-muted-foreground max-w-lg">Paste the URLs for your content sections above. We'll fetch each one and give specific recommendations per content type — no guessing, no crawling failures.</p>
          </div>
          <div className="flex items-stretch gap-0 rounded-xl border border-border bg-muted/30 overflow-hidden w-full max-w-3xl">
            {[
              { icon: "📝", label: "Blog & Articles" },
              { icon: "⚔️", label: "Comparison Pages" },
              { icon: "📈", label: "Case Studies" },
              { icon: "🏭", label: "Solution Pages" },
              { icon: "❓", label: "FAQ Coverage" },
              { icon: "📄", label: "Whitepapers" },
            ].map((item, i) => (
              <div key={item.label} className={cn("flex-1 px-3 py-4 flex flex-col items-center text-center gap-1.5", i > 0 ? "border-l border-border" : "")}>
                <span className="text-xl">{item.icon}</span>
                <p className="text-xs font-semibold text-card-foreground leading-tight">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


