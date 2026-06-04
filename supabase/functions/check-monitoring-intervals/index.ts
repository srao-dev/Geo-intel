import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const apiUrl = 'https://geo-intel-tau.vercel.app'

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

interface Company {
  id: string
  monitoring_interval: 'daily' | 'weekly' | 'monthly' | 'manual'
  last_tracked_at: string | null
}

async function shouldRefresh(company: Company): Promise<boolean> {
  if (company.monitoring_interval === 'manual') return false
  const lastTracked = company.last_tracked_at ? new Date(company.last_tracked_at) : null
  if (!lastTracked) return true
  const now = new Date()
  const diffMs = now.getTime() - lastTracked.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  switch (company.monitoring_interval) {
    case 'daily':
      return diffDays >= 1
    case 'weekly':
      return diffDays >= 7
    case 'monthly':
      return diffDays >= 30
    default:
      return false
  }
}

async function triggerTracking(companyId: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    })
    if (!response.ok) {
      console.error(`Failed to trigger tracking for company ${companyId}: HTTP ${response.status}`)
      return false
    }
    console.log(`✓ Triggered tracking for company ${companyId}`)
    return true
  } catch (error) {
    console.error(`Error triggering tracking for company ${companyId}:`, error)
    return false
  }
}

serve(async (req) => {
  try {
    console.log('Checking monitoring intervals...')
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, monitoring_interval, last_tracked_at')
      .neq('monitoring_interval', 'manual')
    if (error) {
      console.error('Error fetching companies:', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
    if (!companies || companies.length === 0) {
      console.log('No companies with monitoring enabled')
      return new Response(JSON.stringify({ message: 'No companies to monitor' }), { status: 200 })
    }
    console.log(`Found ${companies.length} companies to check`)
    const results: Record<string, boolean> = {}
    for (const company of companies as Company[]) {
      const needsRefresh = await shouldRefresh(company)
      if (needsRefresh) {
        const success = await triggerTracking(company.id)
        results[company.id] = success
      } else {
        results[company.id] = false
        console.log(`✗ Company ${company.id} doesn't need refresh yet`)
      }
    }
    const triggered = Object.values(results).filter(v => v).length
    console.log(`Monitoring check complete. Triggered ${triggered} tracking jobs.`)
    return new Response(
      JSON.stringify({ success: true, checked: companies.length, triggered }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
})
