import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const db = getServiceClient()
    const { companyId, monitoringInterval } = await req.json()

    if (!companyId || !monitoringInterval) {
      return NextResponse.json({ error: 'companyId and monitoringInterval are required' }, { status: 400 })
    }

    // Validate interval value
    const validIntervals = ['daily', 'weekly', 'monthly', 'manual']
    if (!validIntervals.includes(monitoringInterval)) {
      return NextResponse.json({ error: 'Invalid monitoring interval' }, { status: 400 })
    }

    // Update company
    const { data, error } = await db
      .from('companies')
      .update({ monitoring_interval: monitoringInterval, updated_at: new Date().toISOString() })
      .eq('id', companyId)
      .select('id, monitoring_interval')
      .single()

    if (error) throw new Error(`Update failed: ${error.message}`)

    return NextResponse.json({ success: true, companyId, monitoringInterval: data.monitoring_interval })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
