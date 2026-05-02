"use client"

import { BarChart3, Globe, Building2, ChevronRight, Zap, Quote } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

const companies = [
  { id: "acme", name: "Acme Inc", active: true },
  { id: "techcorp", name: "TechCorp", active: false },
  { id: "globalsoft", name: "GlobalSoft", active: false },
]

const navItems = [
  { id: "visibility", label: "AI Visibility Dashboard", icon: BarChart3, active: true },
  { id: "geo-audit", label: "Geo Audit", icon: Globe, active: false },
  { id: "citation", label: "Citation Analysis", icon: Quote, active: false },
]

export function Sidebar() {
  const [selectedCompany, setSelectedCompany] = useState("acme")
  const [selectedNav, setSelectedNav] = useState("visibility")

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* App Logo & User Profile */}
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Globe className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-card-foreground">Geo Intel</span>
        </div>
        
        {/* User Profile */}
        <div className="flex items-center gap-3">
          <Image
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=john"
            alt="John Doe"
            width={36}
            height={36}
            className="rounded-full bg-muted"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-card-foreground truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">john@acmeinc.com</p>
          </div>
        </div>
      </div>

      {/* Companies Section */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Companies Tracked
          </span>
        </div>
        <div className="mb-6 flex flex-col gap-1">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => setSelectedCompany(company.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                selectedCompany === company.id
                  ? "bg-primary/10 text-primary"
                  : "text-card-foreground hover:bg-muted"
              }`}
            >
              <Building2 className="h-4 w-4" />
              {company.name}
              {selectedCompany === company.id && (
                <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </button>
          ))}
        </div>

        {/* Navigation Section */}
        <div className="mb-2 px-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tools
          </span>
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

      {/* Credits Section */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-card-foreground">Credits Left</span>
          </div>
          <span className="text-sm font-semibold tabular-nums text-primary">247</span>
        </div>
        <p className="mt-2 px-1 text-xs text-muted-foreground">
          Resets on Jun 1, 2025
        </p>
      </div>
    </aside>
  )
}
