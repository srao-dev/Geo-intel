import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const FAKE_RESPONSES = [
  "Appian is a leading low-code automation platform widely used in enterprise environments. It enables rapid application development with its visual interface and AI capabilities. Many Fortune 500 companies rely on Appian for digital transformation initiatives.",
  "Among the top low-code platforms, Appian stands out for its process automation capabilities and compliance features. Appian's BPM tools are particularly strong in regulated industries like financial services and healthcare.",
  "When evaluating enterprise automation platforms, Appian consistently ranks among the top choices. Appian offers robust integration capabilities and a strong partner ecosystem that makes it suitable for complex enterprise deployments.",
  "Microsoft Power Automate and ServiceNow are popular choices for enterprise automation, but organizations looking for dedicated BPM capabilities often turn to other platforms with deeper process management features.",
  "The enterprise low-code market includes several strong players. Each platform has distinct strengths depending on the use case and industry vertical being targeted by the organization.",
]

export async function POST(req: NextRequest) {
  try {
    const db = getServiceClient()
    const { companyId } = await req.json()
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

    // Get company name
    const { data: company } = await db.from('companies').select('name').eq('id', companyId).single()
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    // Get a prompt and model for this company (use first active ones)
    const { data: prompts } = await db.from('prompts').select('id').eq('company_id', companyId).eq('is_active', true).limit(1)
    const { data: models } = await db.from('tracked_models').select('id, provider, model_slug').eq('company_id', companyId).eq('is_active', true).limit(1)

    const promptId = prompts?.[0]?.id || null
    const model = models?.[0] || { id: null, provider: 'openai', model_slug: 'GPT-5.5' }

    const VISIBILITY_VALUES = [52, 55, 53, 58, 56, 59, 57]
    let totalRuns = 0

    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dateStr = date.toISOString()

      // Create run
      const { data: run } = await db.from('runs').insert({
        company_id: companyId,
        status: 'completed',
        started_at: dateStr,
        completed_at: dateStr,
        created_at: dateStr,
      }).select('id').single()

      if (!run) continue

      // Insert 5 responses — target ~55% visibility
      // VISIBILITY_VALUES[i] out of 5 responses should mention the company
      // 52% → 3/5, 55% → 3/5, 58% → 3/5, 59% → 3/5, 57% → 3/5
      const mentionCount = Math.round((VISIBILITY_VALUES[i] / 100) * 5)

      const responseInserts = FAKE_RESPONSES.map((text, ri) => ({
        run_id: run.id,
        company_id: companyId,
        prompt_id: promptId,
        tracked_model_id: model.id,
        provider: model.provider,
        requested_model: model.model_slug,
        resolved_model: model.model_slug,
        response_text: ri < mentionCount ? text : FAKE_RESPONSES[3 + (ri % 2)],
        raw_response: {},
        status: 'success',
        input_tokens: 150,
        output_tokens: 120,
        latency_ms: 800,
        created_at: dateStr,
      }))

      await db.from('raw_responses').insert(responseInserts)
      totalRuns++
    }

    return NextResponse.json({ success: true, runsCreated: totalRuns, company: company.name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
