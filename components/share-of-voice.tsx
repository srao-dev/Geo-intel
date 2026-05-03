import { cn } from "@/lib/utils"

interface SoVEntry { name: string; visibility: number; isOurBrand: boolean }
interface ShareOfVoiceProps { data: SoVEntry[]; loading?: boolean }

const COLORS = ["bg-blue-500","bg-purple-500","bg-emerald-500","bg-orange-500","bg-pink-500","bg-cyan-500"]

function getColor(name: string, isOurBrand: boolean) {
  if (isOurBrand) return "bg-violet-600"
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

function getInitials(name: string) {
  return name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase()
}

export function ShareOfVoice({ data, loading }: ShareOfVoiceProps) {
  const sorted = [...data].sort((a, b) => b.visibility - a.visibility)
  const max = sorted[0]?.visibility || 100

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-violet-200 border-t-4 border-t-violet-400 bg-violet-50 p-4 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-violet-900">Share of Voice</p>
        <p className="text-xs text-violet-600">Your brand vs competitors</p>
      </div>
      {sorted.length === 0
        ? <p className="text-xs text-violet-500">No data yet — run tracking to see results.</p>
        : <div className="flex flex-col gap-2.5">
            {sorted.map(entry => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className={cn("flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-sm", getColor(entry.name, entry.isOurBrand))}>
                  {getInitials(entry.name)}
                </div>
                <span className={cn("w-20 flex-shrink-0 truncate text-xs", entry.isOurBrand ? "font-semibold text-violet-900" : "text-violet-700")}>
                  {entry.name}{entry.isOurBrand && <span className="ml-0.5 text-violet-500">★</span>}
                </span>
                <div className="flex flex-1 items-center gap-1.5">
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-violet-200">
                    <div className={cn("h-full rounded-full transition-all duration-700", getColor(entry.name, entry.isOurBrand))} style={{ width: `${max > 0 ? (entry.visibility / max) * 100 : 0}%` }} />
                  </div>
                  <span className={cn("w-9 flex-shrink-0 text-right text-xs font-bold tabular-nums",
                    entry.visibility >= 70 ? "text-emerald-600" : entry.visibility >= 40 ? "text-amber-600" : "text-violet-500"
                  )}>{entry.visibility}%</span>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}
