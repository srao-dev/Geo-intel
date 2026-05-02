"use client"

import { BarChart3, Globe, Building2, ChevronRight, Quote, LogOut, Plus } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"

const navItems = [
  { id: "visibility", label: "AI Visibility Dashboard", icon: BarChart3 },
  { id: "geo-audit", label: "Geo Audit", icon: Globe },
  { id: "citation", label: "Citation Analysis", icon: Quote },
]

interface SidebarProps {
  companies?: { id: string; name: string }[]
  selectedCompanyId?: string
  onSelectCompany?: (id: string) => void
  onCreateNew?: () => void
}

export function Sidebar({ companies = [], selectedCompanyId, onSelectCompany, onCreateNew }: SidebarProps) {
  const [selectedNav, setSelectedNav] = useState("visibility")
  const { user, logout } = useAuth()

  const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "User"
  const email = user?.email || ""
  const avatarSeed = encodeURIComponent(name)

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Globe className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-card-foreground">Geo Intel</span>
        </div>

        {/* User profile */}
        <div className="flex items-center gap-3">
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}`}
            alt={name}
            width={36}
            height={36}
            className="rounded-full bg-muted"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-card-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </div>
      </div>

      {/* Companies */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Companies Tracked</span>
          {onCreateNew && (
            <button onClick={onCreateNew} className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors" title="Add company">
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="mb-6 flex flex-col gap-1">
          {companies.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No companies yet</p>
          ) : companies.length > 0 && (
            companies.map((company) => (
              <button
                key={company.id}
                onClick={() => onSelectCompany?.(company.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  selectedCompanyId === company.id
                    ? "bg-primary/10 text-primary"
                    : "text-card-foreground hover:bg-muted"
                }`}
              >
                <Building2 className="h-4 w-4" />
                {company.name}
                {selectedCompanyId === company.id && <ChevronRight className="ml-auto h-4 w-4" />}
              </button>
            ))
          )}
        </div>

        {/* Navigation */}
        <div className="mb-2 px-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tools</span>
        </div>
        <div className="flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedNav(item.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                selectedNav === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-card-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="border-t border-border px-4 py-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-card-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
