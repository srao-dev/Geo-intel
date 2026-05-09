import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Extract brand positions from AI response text.
// Priority: numbered list position ("5. Salesforce" → 5).
// Fallback: rank by order of first mention among tracked brands only.
function extractPositionsByMention(responseText: string, brands: string[]): Record<string, number | null> {
  const text = responseText.toLowerCase()
  const result: Record<string, number | null> = {}
  brands.forEach(b => { result[b] = null })

  // Try to extract numbered-list position: "1. Brand", "1) Brand", "1: Brand"
  // Allows optional markdown formatting between number and brand name
  let foundNumbered = false
  for (const brand of brands) {
    const escaped = escapeRegex(brand.toLowerCase())
    const m = text.match(new RegExp(`(?:^|\\n)[ \\t]*(\\d+)[.):][ \\t]*(?:[*_#]{0,3}[ \\t]*)?${escaped}`, 'm'))
    if (m) {
      result[brand] = parseInt(m[1], 10)
      foundNumbered = true
    }
  }

  if (foundNumbered) return result

  // Fallback: rank by order of first mention among tracked brands
  const indices: { brand: string; idx: number }[] = []
  for (const brand of brands) {
    const idx = text.indexOf(brand.toLowerCase())
    if (idx !== -1) indices.push({ brand, idx })
  }
  indices.sort((a, b) => a.idx - b.idx)
  indices.forEach((item, i) => { result[item.brand] = i + 1 })

  return result
}

export async function POST(req: NextRequest) {
  const db = getServiceClient()

  try {
    const { runId, companyId } = await req.json()
    if (!runId || !companyId) return NextResponse.json({ error: 'runId and companyId required' }, { status: 400 })

    const [companyRes, competitorsRes] = await Promise.all([
      db.from('companies').select('name').eq('id', companyId).single(),
      db.from('competitors').select('name').eq('company_id', companyId),
    ])

    const companyName = companyRes.data?.name || ''
    const competitorNames = competitorsRes.data?.map(c => c.name) || []
    const allBrands = [companyName, ...competitorNames]

    const { data: responses } = await db
      .from('raw_responses')
      .select('id, response_text')
      .eq('run_id', runId)
      .eq('status', 'success')
      .is('positions_json', null)
      .not('response_text', 'is', null)

    if (!responses?.length) return NextResponse.json({ success: true, processed: 0 })

    const CONCURRENCY = 10
    let processed = 0

    for (let i = 0; i < responses.length; i += CONCURRENCY) {
      const chunk = responses.slice(i, i + CONCURRENCY)
      await Promise.all(chunk.map(async (r) => {
        const positions = extractPositionsByMention(r.response_text!, allBrands)
        await db.from('raw_responses').update({ positions_json: positions }).eq('id', r.id)
        processed++
      }))
    }

    return NextResponse.json({ success: true, processed, brands: allBrands })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
