import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const db = getServiceClient()
  const companyId = req.nextUrl.searchParams.get('companyId')
  if (!companyId) return NextResponse.json({ error: 'companyId required' })

  const { data: responses } = await db
    .from('raw_responses')
    .select('id, response_text, positions_json, requested_model')
    .eq('company_id', companyId)
    .eq('status', 'success')
    .not('response_text', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5)

  const result = (responses || []).map(r => ({
    id: r.id,
    model: r.requested_model,
    positions_json: r.positions_json,
    first_300_chars: r.response_text?.slice(0, 300),
  }))

  return NextResponse.json(result, { headers: { 'Content-Type': 'application/json' } })
}
