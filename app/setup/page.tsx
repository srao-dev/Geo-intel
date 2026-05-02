"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { SetupWizard } from "@/components/setup-wizard"

export default function SetupPage() {
  const router = useRouter()

  const handleComplete = () => {
    router.push("/dashboard")
  }

  const handleSaveExit = () => {
    router.push("/")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6">
        <SetupWizard onComplete={handleComplete} onSaveExit={handleSaveExit} />
      </main>
    </div>
  )
}
