import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const { domain, vertical, company_name } = req.body || {};
  if (!domain) return res.status(400).json({ error: 'Domain is required' });

  const verticalContext = {
    automation: 'enterprise automation, RPA, BPM, low-code, AI platforms, digital transformation',
    saas: 'B2B software, SaaS, cloud-based tools, business productivity',
    agency: 'marketing agency, digital agency, SEO, content marketing, paid media'
  }[vertical || 'automation'];

  const prompt = `You are an AI search query researcher. Generate the 20 most important buyer queries that enterprise buyers type into ChatGPT, Perplexity, Claude, and Gemini when researching ${company_name || domain} and their competitors in the ${verticalContext} space.

These are real questions buyers ask AI engines — not Google searches. They tend to be longer, more conversational, and solution-focused.

For each query, assign:
- intent_type: one of "category" | "comparison" | "problem" | "compliance" | "roi" | "implementation"
- priority: "high" | "medium" | "low" based on how likely this query leads to a buying decision
- currently_ranking: true if ${company_name || domain} likely appears in AI answers for this query, false if they're probably invisible

Return ONLY this JSON (no other text):
{
  "company": "${company_name || domain}",
  "vertical": "${vertical || 'automation'}",
  "queries": [
    {
      "id": 1,
      "query": "the full buyer query",
      "intent_type": "category|comparison|problem|compliance|roi|implementation",
      "priority": "high|medium|low",
      "currently_ranking": true|false,
      "why_matters": "one sentence on why this query matters for ${company_name || domain}"
    }
  ]
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }]
    });

    let raw = response.content[0].text.trim();
    if (raw.includes('```')) raw = raw.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) raw = m[0];

    const data = JSON.parse(raw);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    console.error('Prompts error:', err);
    return res.status(500).json({ error: err.message });
  }
}
