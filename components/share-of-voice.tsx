import { cn } from "@/lib/utils"

interface SoVEntry { name: string; visibility: number; isOurBrand: boolean }
interface ShareOfVoiceProps { data: SoVEntry[]; loading?: boolean }

const COLORS = ["bg-blue-500","bg-purple-500","bg-emerald-500","bg-orange-500","bg-pink-500","bg-cyan-500"]

function getColor(name: string, isOurBrand: boolean) {
  if (isOurBrand) return "bg-primary"
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()
}

export function ShareOfVoice({ data, loading }: ShareOfVoiceProps) {
  const sorted = [...data].sort((a, b) => b.visibility - a.visibility)
  const max = sorted[0]?.visibility || 100

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div>
        <p className="text-xs font-semibold text-card-foreground">Share of Voice</p>
        <p className="text-xs text-muted-foreground">Your brand vs competitors</p>
      </div>
      {sorted.length === 0
        ? <p className="text-xs text-muted-foreground">No data yet — run tracking to see results.</p>
        : <div className="flex flex-col gap-2">
            {sorted.map(entry => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className={cn("flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white", getColor(entry.name, entry.isOurBrand))}>
                  {getInitials(entry.name)}
                </div>
                <span className={cn("w-20 flex-shrink-0 truncate text-xs", entry.isOurBrand ? "font-semibold text-card-foreground" : "text-muted-foreground")}>
                  {entry.name}{entry.isOurBrand && <span className="ml-0.5 text-primary">★</span>}
                </span>
                <div className="flex flex-1 items-center gap-1.5">
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full transition-all duration-500", getColor(entry.name, entry.isOurBrand))} style={{ width: `${max > 0 ? (entry.visibility / max) * 100 : 0}%` }} />
                  </div>
                  <span className={cn("w-8 flex-shrink-0 text-right text-xs font-semibold tabular-nums",
                    entry.visibility >= 70 ? "text-emerald-600" : entry.visibility >= 40 ? "text-amber-600" : "text-muted-foreground"
                  )}>{entry.visibility}%</span>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}
