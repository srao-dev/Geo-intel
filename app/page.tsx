"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { EmptyDashboard } from "@/components/empty-dashboard"

export default function HomePage() {
  const router = useRouter()
  // Simulate checking if user has any tracked companies
  // Set to true to show the dashboard instead of empty state
  const [hasCompanies] = useState(false)

  const handleCreateNew = () => {
    router.push("/setup")
  }

  // If user has companies, redirect to dashboard
  if (hasCompanies) {
    router.push("/dashboard")
    return null
  }

  // Show empty state for first-time users
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <EmptyDashboard onCreateNew={handleCreateNew} />
      </main>
    </div>
  )
}
