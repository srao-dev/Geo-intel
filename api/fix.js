import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FIX_PROMPTS = {
  schema: (domain, finding, vertical) => `You are a GEO schema expert. Generate a complete, ready-to-implement JSON-LD schema fix for this company.

Company domain: ${domain}
Finding: ${finding.title}
Detail: ${finding.detail}
Vertical: ${vertical}

Based on the domain and vertical, infer the company name, description, and relevant details.

Generate the complete JSON-LD markup. Be specific — use the actual company name and realistic details inferred from the domain. Include implementation instructions.

Return ONLY this JSON:
{
  "fix_type": "schema",
  "title": "Complete schema markup for ${domain}",
  "summary": "One sentence explaining what this fixes and why it matters",
  "implementation_time": "X minutes",
  "where_to_add": "Exact location in the HTML where this should be added",
  "code": "The complete JSON-LD code block ready to copy-paste",
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "impact": "What this will improve in AI search visibility"
}`,

  content: (domain, finding, vertical) => `You are a GEO content strategist. Generate specific, ready-to-use content fixes for this company.

Company domain: ${domain}
Finding: ${finding.title}
Detail: ${finding.detail}
Vertical: ${vertical}

Based on the domain and vertical, infer the company name, product category, and target audience.

Generate specific, usable content — not generic advice. Write actual copy options.

Return ONLY this JSON:
{
  "fix_type": "content",
  "title": "Content fix for ${domain}",
  "summary": "One sentence explaining what this fixes",
  "implementation_time": "X hours",
  "options": [
    {"label": "Option A", "content": "The actual content to use"},
    {"label": "Option B", "content": "Alternative version"},
    {"label": "Option C", "content": "Another alternative"}
  ],
  "where_to_use": "Exactly where on the site this content should go",
  "instructions": ["Step 1", "Step 2"],
  "impact": "What this will improve in AI search visibility"
}`,

  technical: (domain, finding, vertical) => `You are a GEO technical expert. Generate a complete technical fix for this company.

Company domain: ${domain}
Finding: ${finding.title}
Detail: ${finding.detail}
Vertical: ${vertical}

Generate the exact technical implementation — code, config files, or instructions. Be specific and complete.

Return ONLY this JSON:
{
  "fix_type": "technical",
  "title": "Technical fix for ${domain}",
  "summary": "One sentence explaining what this fixes",
  "implementation_time": "X minutes",
  "code": "The complete code or file content ready to implement",
  "where_to_add": "Exactly where/how to implement this",
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "impact": "What this will improve in AI search visibility",
  "verification": "How to verify this fix is working correctly"
}`,

  comparison: (domain, finding, vertical) => `You are a GEO competitive content strategist. Generate a complete comparison page brief for this company.

Company domain: ${domain}
Finding: ${finding.title}
Detail: ${finding.detail}
Vertical: ${vertical}

Based on the domain and vertical, identify the top 3 competitors they should have comparison pages for. Generate a complete page brief for the most important one.

Return ONLY this JSON:
{
  "fix_type": "comparison",
  "title": "Comparison page brief for ${domain}",
  "summary": "One sentence explaining the opportunity",
  "implementation_time": "2-3 days",
  "target_page": "The URL slug to create e.g. /vs-competitor",
  "target_query": "The exact search query this page will capture",
  "page_structure": [
    {"section": "Section name", "content": "What to write in this section"}
  ],
  "key_differentiators": ["Point 1", "Point 2", "Point 3"],
  "seo_title": "The exact page title tag to use",
  "meta_description": "The exact meta description to use",
  "impact": "What this will improve in AI search visibility"
}`,

  sentiment: (domain, finding, vertical) => `You are a GEO brand sentiment strategist. Generate specific, ready-to-use content that improves how AI engines describe this company.

Company domain: ${domain}
Finding: ${finding.title}
Detail: ${finding.detail}
Vertical: ${vertical}

Generate specific, usable content — not generic advice. Write actual copy that AI engines can cite.

Return ONLY this JSON:
{
  "fix_type": "sentiment",
  "title": "Brand sentiment fix for ${domain}",
  "summary": "One sentence explaining what this fixes",
  "implementation_time": "X hours",
  "options": [
    {"label": "Value proposition statement", "content": "The actual ready-to-use copy"},
    {"label": "Social proof block", "content": "Customer proof copy with quantified outcomes"},
    {"label": "Trust signals paragraph", "content": "Awards, certifications, analyst recognition copy"}
  ],
  "where_to_use": "Exactly where on the site this content should go — homepage hero, about page, etc.",
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "impact": "How this improves AI engine confidence when describing your brand"
}`,
};

function detectFixType(finding) {
  const title = (finding.title || '').toLowerCase();
  const detail = (finding.detail || '').toLowerCase();

  if (title.includes('schema') || title.includes('json-ld') || title.includes('structured') ||
      title.includes('faqpage') || title.includes('organization') || title.includes('software') ||
      detail.includes('schema') || detail.includes('json-ld')) {
    return 'schema';
  }
  if (title.includes('comparison') || title.includes('competitor') || title.includes('vs ') ||
      title.includes('versus') || detail.includes('comparison page')) {
    return 'comparison';
  }
  if (title.includes('robots') || title.includes('llms.txt') || title.includes('sitemap') ||
      title.includes('crawl') || title.includes('bot') || title.includes('javascript') ||
      title.includes('rendering')) {
    return 'technical';
  }
  if (title.includes('sentiment') || title.includes('social proof') || title.includes('trust') ||
      title.includes('testimonial') || title.includes('roi') || title.includes('outcome') ||
      title.includes('value proposition') || title.includes('brand definition') ||
      detail.includes('social proof') || detail.includes('trust signal')) {
    return 'sentiment';
  }
  return 'content';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const { domain, finding, vertical } = req.body || {};
  if (!domain || !finding) return res.status(400).json({ error: 'Domain and finding are required' });

  const fixType = detectFixType(finding);
  const promptFn = FIX_PROMPTS[fixType] || FIX_PROMPTS.content;
  const prompt = promptFn(domain, finding, vertical || 'automation');

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    let raw = response.content[0].text.trim();
    if (raw.includes('```')) raw = raw.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) raw = jsonMatch[0];

    const fix = JSON.parse(raw);
    return res.status(200).json({ success: true, fix, fix_type: fixType });
  } catch (err) {
    console.error('Fix generation error:', err);
    return res.status(500).json({ error: err.message });
  }
}
