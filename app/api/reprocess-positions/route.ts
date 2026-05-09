import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Position values:
//   positive integer = ranked position in a numbered list or table
//   -1               = mentioned but not ranked (bullet, categorical, honorary, prose)
//   null             = not mentioned at all
function extractPositionsByMention(responseText: string, brands: string[]): Record<string, number | null> {
  const normalized = responseText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.toLowerCase().split('\n')
  const text = normalized.toLowerCase()
  const result: Record<string, number | null> = {}
  brands.forEach(b => { result[b] = null })

  // Strategy 1: numbered list ("1. Brand", "**1. Brand**", "### 1. Brand")
  let foundRanked = false
  for (const brand of brands) {
    const bl = brand.toLowerCase()
    for (const line of lines) {
      if (!line.includes(bl)) continue
      const m = line.match(/^[ \t*#_>]{0,8}(\d+)[.):\-]/)
      if (m) {
        result[brand] = parseInt(m[1], 10)
        foundRanked = true
        break
      }
    }
  }

  // Strategy 2: markdown table rows
  if (!foundRanked) {
    const isSep = (l: string) => /^\|[\-:\|\s]+\|$/.test(l.trim())
    const tableRows = lines.filter(l => l.trim().startsWith('|') && !isSep(l))
    if (tableRows.length > 1) {
      const dataRows = tableRows.slice(1)
      for (const brand of brands) {
        const bl = brand.toLowerCase()
        const idx = dataRows.findIndex(row => row.includes(bl))
        if (idx !== -1) { result[brand] = idx + 1; foundRanked = true }
      }
    }
  }

  // Any brand mentioned in text but not given a ranked position -> -1 (HM)
  for (const brand of brands) {
    if (result[brand] === null && text.includes(brand.toLowerCase())) {
      result[brand] = -1
    }
  }

  return result
}

export async function POST(req: NextRequest) {
  const db = getServiceClient()

  try {
    const { companyId } = await req.json()
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

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
      .eq('company_id', companyId)
      .eq('status', 'success')
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

    const { data: sample } = await db
      .from('raw_responses')
      .select('id, response_text, positions_json')
      .eq('company_id', companyId)
      .eq('status', 'success')
      .not('response_text', 'is', null)
      .limit(3)

    const debug = (sample || []).map(r => ({
      id: r.id,
      positions: r.positions_json,
      preview: r.response_text?.slice(0, 300),
    }))

    return NextResponse.json({ success: true, processed, brands: allBrands, debug })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
