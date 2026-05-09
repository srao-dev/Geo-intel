import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Extract brand positions from AI response text.
// Handles: numbered lists, markdown tables, fallback to mention order.
function extractPositionsByMention(responseText: string, brands: string[]): Record<string, number | null> {
  const normalized = responseText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.toLowerCase().split('\n')
  const result: Record<string, number | null> = {}
  brands.forEach(b => { result[b] = null })

  // Strategy 1: numbered list ("1. Brand", "**1. Brand**", "### 1. Brand")
  let foundNumbered = false
  for (const brand of brands) {
    const bl = brand.toLowerCase()
    for (const line of lines) {
      if (!line.includes(bl)) continue
      const numMatch = line.match(/^[ \t*#_>]{0,8}(\d+)[.):\-]/)
      if (numMatch) {
        result[brand] = parseInt(numMatch[1], 10)
        foundNumbered = true
        break
      }
    }
  }
  if (foundNumbered) return result

  // Strategy 2: markdown table rows
  const isSeparator = (l: string) => /^\|[\-:\|\s]+\|$/.test(l.trim())
  const tableRows = lines.filter(l => l.trim().startsWith('|') && !isSeparator(l))
  if (tableRows.length > 1) {
    const dataRows = tableRows.slice(1) // skip header row
    for (const brand of brands) {
      const bl = brand.toLowerCase()
      const idx = dataRows.findIndex(row => row.includes(bl))
      if (idx !== -1) result[brand] = idx + 1
    }
    if (brands.some(b => result[b] !== null)) return result
  }

  // Strategy 3: bullet list ("- Brand", "* Brand", "• Brand")
  const bulletRows = lines.filter(l => /^[ \t]*[-•→][ \t]+\S/.test(l) || /^[ \t]*\*[ \t]+\S/.test(l))
  if (bulletRows.length > 0) {
    for (const brand of brands) {
      const bl = brand.toLowerCase()
      const idx = bulletRows.findIndex(row => row.includes(bl))
      if (idx !== -1) result[brand] = idx + 1
    }
    if (brands.some(b => result[b] !== null)) return result
  }

  // Fallback: rank by order of first mention among tracked brands
  const text = normalized.toLowerCase()
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
