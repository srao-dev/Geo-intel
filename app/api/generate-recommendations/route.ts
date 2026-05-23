import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function classifyUrl(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('g2.com') || u.includes('capterra') || u.includes('trustradius')) return 'Review'
  if (u.includes('gartner') || u.includes('forrester') || u.includes('idc.com')) return 'Analyst Report'
  if (u.includes('reddit.com')) return 'Community'
  if (u.includes('youtube') || u.includes('youtu.be')) return 'Video'
  if (/top[\s\-]?\d|best[\s\-]/.test(u)) return 'Listicle'
  if (u.includes('vs') || u.includes('compar') || u.includes('alternativ')) return 'Comparison'
  if (u.includes('docs.') || u.includes('/docs/') || u.includes('/documentation/')) return 'Documentation'
  if (u.includes('/blog/') || u.includes('blog.') || u.includes('/blogs/')) return 'Blog'
  if (u.includes('techcrunch') || u.includes('forbes') || u.includes('venturebeat') || u.includes('zdnet') || u.includes('wired')) return 'News'
  return 'Web Article'
}

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await req.json()
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

    const db = getServiceClient()
    const client = new Anthropic()

    // Fetch all context data
    const [companyRes, competitorsRes, promptsRes] = await Promise.all([
      db.from('companies').select('name, url').eq('id', companyId).single(),
      db.from('competitors').select('name').eq('company_id', companyId),
      db.from('prompts').select('id, text').eq('company_id', companyId).eq('is_active', true),
    ])

    const companyName = companyRes.data?.name || ''
    const competitorNames = competitorsRes.data?.map((c: any) => c.name) || []
    const allBrands = [{ name: companyName, isOurBrand: true }, ...competitorNames.map((n: string) => ({ name: n, isOurBrand: false }))]

    const { data: responses } = await db
      .from('raw_responses')
      .select('response_text, requested_model, raw_response, prompt_id')
      .eq('company_id', companyId)
      .eq('status', 'success')
      .not('response_text', 'is', null)
      .limit(300)

    if (!responses?.length) return NextResponse.json({ error: 'Not enough data yet. Run tracking first.' }, { status: 400 })

    // Build competitor insights per model
    const byModel = new Map<string, any[]>()
    for (const r of responses) {
      if (!byModel.has(r.requested_model)) byModel.set(r.requested_model, [])
      byModel.get(r.requested_model)!.push(r)
    }

    const modelInsights: string[] = []
    for (const [model, modelResponses] of byModel.entries()) {
      const total = modelResponses.length
      const brandVis = allBrands.map(b => ({
        name: b.name,
        isOurBrand: b.isOurBrand,
        visibility: Math.round((modelResponses.filter(r => r.response_text?.toLowerCase().includes(b.name.toLowerCase())).length / total) * 100)
      }))
      const topComp = brandVis.filter(b => !b.isOurBrand).sort((a, b) => b.visibility - a.visibility)[0]
      const ours = brandVis.find(b => b.isOurBrand)

      // Citations for top competitor on this model
      const compResponses = modelResponses.filter(r => r.response_text?.toLowerCase().includes(topComp?.name?.toLowerCase() || ''))
      const urls: string[] = []
      for (const r of compResponses) {
        if (Array.isArray(r.raw_response?.citations)) urls.push(...r.raw_response.citations)
        else { const m = r.response_text?.match(/https?:\/\/[^\s\)\]>,"']+/g) || []; urls.push(...m) }
      }
      const typeCounts: Record<string, number> = {}
      for (const url of urls) { try { const t = classifyUrl(url); typeCounts[t] = (typeCounts[t] || 0) + 1 } catch {} }
      const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, c]) => `${t} (${c})`).join(', ')

      if (topComp) {
        modelInsights.push(`${model}: ${topComp.name} has ${topComp.visibility}% visibility vs ${ours?.visibility || 0}% for ${companyName}${topTypes ? `. Competitor citations: ${topTypes}` : ''}`)
      }
    }

    // Top cited domains overall
    const domainCounts: Record<string, number> = {}
    for (const r of responses) {
      const urls: string[] = []
      if (Array.isArray(r.raw_response?.citations)) urls.push(...r.raw_response.citations)
      else { const m = r.response_text?.match(/https?:\/\/[^\s\)\]>,"']+/g) || []; urls.push(...m) }
      for (const url of urls) {
        try { const d = new URL(url).hostname.replace('www.', ''); domainCounts[d] = (domainCounts[d] || 0) + 1 } catch {}
      }
    }
    const topDomains = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([d, c]) => `${d} (${c})`).join(', ')

    // Calculate prompt stats with mention rates
    const promptStats = (promptsRes.data || []).map(p => {
      const pr = responses.filter(r => r.prompt_id === p.id)
      const mentions = pr.filter(r => r.response_text?.toLowerCase().includes(companyName.toLowerCase())).length
      const mentionRate = pr.length > 0 ? Math.round((mentions / pr.length) * 100) : 0

      // Calculate top competitor for this prompt
      const brandVis = allBrands.map(b => ({
        name: b.name,
        isOurBrand: b.isOurBrand,
        visibility: Math.round((pr.filter(r => r.response_text?.toLowerCase().includes(b.name.toLowerCase())).length / pr.length) * 100) || 0
      }))
      const topComp = brandVis.filter(b => !b.isOurBrand).sort((a, b) => b.visibility - a.visibility)[0]

      return { id: p.id, text: p.text, mentionRate, mentions, total: pr.length, topCompetitor: topComp?.name, topCompetitorRate: topComp?.visibility || 0 }
    })

    // Categorize prompts
    const strongPrompts = promptStats.filter(p => p.mentionRate >= 60).sort((a, b) => b.mentionRate - a.mentionRate)
    const criticalPrompts = promptStats.filter(p => p.mentionRate < 20 && p.total > 0).sort((a, b) => a.mentionRate - b.mentionRate)
    const importantPrompts = promptStats.filter(p => p.mentionRate >= 20 && p.mentionRate < 50 && p.total > 0).sort((a, b) => a.mentionRate - b.mentionRate)
    const allWeakPrompts = [...criticalPrompts, ...importantPrompts]

    const competitorDomains = competitorNames.map((n: string) => n.toLowerCase().replace(/\s+/g, '') + '.com').join(', ')

    // Format prompts for Haiku context
    const formatPromptList = (prompts: any[]) => prompts
      .map(p => `"${p.text}" — you: ${p.mentionRate}%, ${p.topCompetitor}: ${p.topCompetitorRate}%`)
      .join('\n')

    // Build Haiku prompt for content plan
    const prompt = `You are a content strategist for ${companyName}. Generate a content plan based on AI visibility gaps.

CONTEXT:
- Company: ${companyName}
- Top cited sources: ${topDomains || 'General web'}
- Total tracked prompts: ${promptStats.length}

STRONG PROMPTS TO DEFEND & EXPAND (60%+ mention rate):
${formatPromptList(strongPrompts) || 'None yet'}

CRITICAL GAPS TO FILL (under 20% mention rate):
${formatPromptList(criticalPrompts) || 'None'}

IMPORTANT GAPS (20-50% mention rate):
${formatPromptList(importantPrompts) || 'None'}

Generate content recommendations in JSON format. For each gap, suggest a specific piece of content.
For strong prompts, suggest how to expand/defend the position.

RULES:
- Never suggest ${competitorDomains} or any competitor domains
- Output only valid JSON, no markdown

Return ONLY this JSON structure with no other text:
{
  "summary": {
    "headline": "brief summary of the content strategy",
    "total_gaps": number,
    "critical_gaps": number,
    "top_competitor": "name",
    "estimated_improvement": "e.g. +15-20 visibility points"
  },
  "sections": {
    "defend": [
      {
        "prompt": "the original prompt",
        "title": "exact content title",
        "format": "long-form|comparison|faq|guide|case-study",
        "channels": ["blog", "G2", "Reddit"],
        "why": "one sentence evidence",
        "effort": "low|medium|high",
        "impact": "low|medium|high"
      }
    ],
    "critical": [
      { "prompt": "", "title": "", "format": "", "channels": [], "why": "", "effort": "", "impact": "" }
    ],
    "important": [
      { "prompt": "", "title": "", "format": "", "channels": [], "why": "", "effort": "", "impact": "" }
    ]
  }
}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Failed to parse content plan' }, { status: 500 })

    const contentPlan = JSON.parse(jsonMatch[0])
    return NextResponse.json({ recommendations: contentPlan.sections, summary: contentPlan.summary })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
