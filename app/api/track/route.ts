import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRun, updateRunStatus, saveResponse } from '@/lib/queries'

const MODEL_SLUGS: Record<string, string> = {
  'GPT-5.3': 'openai/gpt-5.3-chat',
  'GPT-5.5': 'openai/gpt-5.5',
  'Claude Sonnet 4.6': 'anthropic/claude-sonnet-4.6',
  'Claude Opus 4.6': 'anthropic/claude-opus-4.6',
  'Claude Haiku 4.5': 'anthropic/claude-haiku-4.5',
  'Sonar': 'perplexity/sonar',
  'Gemini 3 Flash': 'google/gemini-3-flash-preview',
}

async function queryOpenRouter(prompt: string, modelSlug: string) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured')

  const start = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000)

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://geointel.app',
        'X-Title': 'GeoIntel',
      },
      body: JSON.stringify({ model: modelSlug, messages: [{ role: 'user', content: prompt }] }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    const latencyMs = Date.now() - start
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { ok: false, error: err?.error?.message || `HTTP ${res.status}`, latencyMs }
    }

    const data = await res.json()
    return {
      ok: true,
      text: data.choices[0].message.content,
      resolvedModel: data.model,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      latencyMs,
      raw: data,
    }
  } catch (err: any) {
    clearTimeout(timeout)
    return { ok: false, error: err.message, latencyMs: Date.now() - start }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await req.json()
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

    // Use service role to bypass RLS for server-side writes
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch company prompts and models
    const [promptsRes, modelsRes] = await Promise.all([
      supabase.from('prompts').select('id, text').eq('company_id', companyId).eq('is_active', true),
      supabase.from('tracked_models').select('id, provider, model_slug').eq('company_id', companyId).eq('is_active', true),
    ])

    const prompts = promptsRes.data || []
    const models = modelsRes.data || []

    if (prompts.length === 0 || models.length === 0) {
      return NextResponse.json({ error: 'No prompts or models configured' }, { status: 400 })
    }

    // Create run
    const runId = await createRun(companyId)
    await updateRunStatus(runId, 'in_progress')

    // Build task queue
    const tasks: { prompt: typeof prompts[0]; model: typeof models[0] }[] = []
    for (const prompt of prompts) {
      for (const model of models) {
        tasks.push({ prompt, model })
      }
    }

    // Process with concurrency limit of 5
    const CONCURRENCY = 5
    for (let i = 0; i < tasks.length; i += CONCURRENCY) {
      const chunk = tasks.slice(i, i + CONCURRENCY)
      await Promise.all(chunk.map(async ({ prompt, model }) => {
        const slug = MODEL_SLUGS[model.model_slug] || model.model_slug
        const result = await queryOpenRouter(prompt.text, slug)

        await saveResponse({
          runId,
          companyId,
          promptId: prompt.id,
          trackedModelId: model.id,
          provider: model.provider,
          requestedModel: model.model_slug,
          resolvedModel: result.ok ? (result as any).resolvedModel : model.model_slug,
          responseText: result.ok ? (result as any).text : `Error: ${(result as any).error}`,
          rawResponse: result.ok ? (result as any).raw : { error: (result as any).error },
          status: result.ok ? 'success' : 'error',
          inputTokens: result.ok ? (result as any).inputTokens : 0,
          outputTokens: result.ok ? (result as any).outputTokens : 0,
          latencyMs: (result as any).latencyMs || 0,
        })
      }))
    }

    await updateRunStatus(runId, 'completed')
    return NextResponse.json({ success: true, runId })

  } catch (err: any) {
    console.error('Track error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
