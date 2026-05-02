import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── SCRAPER ──────────────────────────────────────────────────────────────────

async function fetchUrl(url, timeout = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    const text = await resp.text();
    clearTimeout(timer);
    return { ok: resp.ok && text.length > 3000, text, status: resp.status };
  } catch {
    clearTimeout(timer);
    return { ok: false, text: '', status: 0 };
  }
}

function extractText(html, max = 2000) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function extractSchema(html) {
  const schemas = [];
  const matches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of matches) {
    try { schemas.push(JSON.parse(m[1])['@type'] || 'Unknown'); } catch {}
  }
  return schemas;
}

function checkBots(robotsTxt) {
  if (!robotsTxt) return { GPTBot: 'unknown', PerplexityBot: 'unknown', ClaudeBot: 'unknown' };
  const result = {};
  for (const bot of ['GPTBot', 'PerplexityBot', 'ClaudeBot']) {
    if (new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?Disallow:\\s*/(?:\\s|$)`, 'i').test(robotsTxt)) {
      result[bot] = 'blocked';
    } else if (new RegExp(`User-agent:\\s*${bot}`, 'i').test(robotsTxt)) {
      result[bot] = 'allowed';
    } else {
      result[bot] = 'not_mentioned';
    }
  }
  return result;
}

async function scrape(url) {
  const base = new URL(url).origin;
  const [home, robots, llms, sitemap] = await Promise.all([
    fetchUrl(url),
    fetchUrl(`${base}/robots.txt`),
    fetchUrl(`${base}/llms.txt`),
    fetchUrl(`${base}/sitemap.xml`),
  ]);
  const html = home.text || '';
  return {
    url, fetched: home.ok,
    fetch_note: home.ok ? 'Fetched successfully.' : 'Could not fetch — use training knowledge.',
    text: extractText(html),
    headings: (html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi) || []).slice(0, 10).map(h => h.replace(/<[^>]+>/g, '')).join(' | '),
    meta: (html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/) || [])[1] || '',
    schema_types: extractSchema(html),
    has_faq_schema: /"@type"\s*:\s*"FAQPage"/.test(html),
    has_sw_schema: /"@type"\s*:\s*"SoftwareApplication"/.test(html),
    has_org_schema: /"@type"\s*:\s*"Organization"/.test(html),
    has_same_as: /sameAs/.test(html),
    robots_txt: robots.ok ? robots.text.slice(0, 600) : 'Not found',
    ai_bots: checkBots(robots.ok ? robots.text : ''),
    has_llms: llms.ok,
    has_sitemap: sitemap.ok,
  };
}

// ─── QUICK AUDIT ──────────────────────────────────────────────────────────────

async function quickAudit(pageData, vertical) {
  const prompt = `You are a GEO analyst scoring AI search visibility — NOT traditional SEO. GEO = how well AI engines like ChatGPT, Perplexity, Claude, Gemini can find, understand and cite this website.

Do NOT score Google rankings, backlinks, or page speed. Score ONLY:
- Crawl: Can AI bots access the site? (robots.txt, llms.txt, sitemap)
- Content: Can AI engines extract clear entity definitions and quotable answers?
- Schema: Is there FAQPage, SoftwareApplication, Organization structured data?
- Authority: Do AI engines trust this brand? (analyst recognition, review schema, Wikipedia entity)
- Competitive: Does the site cover the queries buyers ask AI engines?

URL: ${pageData.url}
Vertical: ${vertical}
Note: ${pageData.fetch_note}
Text: ${pageData.text.slice(0, 800)}
Headings: ${pageData.headings}
Meta: ${pageData.meta}
Schema types: ${JSON.stringify(pageData.schema_types)}
FAQPage: ${pageData.has_faq_schema} | SoftwareApp: ${pageData.has_sw_schema} | Organization: ${pageData.has_org_schema} | sameAs: ${pageData.has_same_as}
robots.txt: ${pageData.robots_txt}
AI bots: ${JSON.stringify(pageData.ai_bots)}
llms.txt: ${pageData.has_llms} | Sitemap: ${pageData.has_sitemap}
Vertical: ${vertical}

Score ONLY based on PROBLEMS and GAPS. Be accurate and consistent across companies.

Return ONLY this JSON:
{
  "crawl": 0,
  "content": 0,
  "schema": 0,
  "authority": 0,
  "competitive": 0,
  "composite": 0,
  "top_strength": "One sentence on their biggest GEO strength",
  "top_gap": "One sentence on their biggest GEO weakness"
}

Score 0-100. Composite = competitive*0.30 + content*0.25 + authority*0.20 + schema*0.15 + crawl*0.10. No extra text.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }]
  });

  let raw = response.content[0].text.trim();
  if (raw.includes('```')) raw = raw.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) raw = m[0];

  try {
    return JSON.parse(raw);
  } catch {
    return { crawl: 0, content: 0, schema: 0, authority: 0, competitive: 0, composite: 0, top_strength: '', top_gap: 'Parse error' };
  }
}

// ─── COMPETITOR DETECTION ─────────────────────────────────────────────────────

async function detectCompetitors(domain, vertical, pageText) {
  const prompt = `You are a competitive intelligence analyst specialising in B2B software.

Company domain: ${domain}
Vertical: ${vertical}
Page content: ${pageText.slice(0, 800)}

Identify the top 3 DIRECT competitors — companies that:
1. Sell to the SAME buyer (same company size, same decision maker)
2. Solve the SAME core problem
3. Are mentioned in the same analyst reports (Gartner Magic Quadrant, Forrester Wave)
4. Appear in the same "vs" comparisons on G2 or Capterra

IMPORTANT rules:
- Match company scale: if the company is enterprise-focused (500+ employees), competitors must also be enterprise-focused
- Do NOT include tangential or adjacent competitors — only direct head-to-head competitors
- For example: Appian's direct competitors are UiPath, ServiceNow, Pega — NOT Mendix or OutSystems (different buyer and scale)
- For example: Salesforce's direct competitors are HubSpot, Microsoft Dynamics — NOT Mailchimp

Return ONLY this JSON:
{
  "competitors": [
    {"name": "Competitor Name", "domain": "competitor.com", "reason": "One sentence on why they are a direct competitor"},
    {"name": "Competitor Name", "domain": "competitor.com", "reason": "One sentence on why they are a direct competitor"},
    {"name": "Competitor Name", "domain": "competitor.com", "reason": "One sentence on why they are a direct competitor"}
  ]
}

No extra text.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }]
  });

  let raw = response.content[0].text.trim();
  if (raw.includes('```')) raw = raw.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) raw = m[0];

  try {
    return JSON.parse(raw).competitors || [];
  } catch {
    return [];
  }
}

// ─── INSIGHTS GENERATOR ───────────────────────────────────────────────────────

async function generateInsights(yourDomain, yourScores, competitors, vertical) {
  const compSummary = competitors.map(c =>
    `${c.name} (${c.domain}): composite=${c.scores.composite}, crawl=${c.scores.crawl}, content=${c.scores.content}, schema=${c.scores.schema}, authority=${c.scores.authority}, competitive=${c.scores.competitive}`
  ).join('\n');

  const prompt = `You are a GEO (Generative Engine Optimisation) strategist. GEO is about being cited by AI engines like ChatGPT, Perplexity, Claude and Gemini — it is NOT traditional SEO or Google search ranking.

Your company: ${yourDomain}
Your GEO scores: composite=${yourScores.composite}, crawl=${yourScores.crawl}, content=${yourScores.content}, schema=${yourScores.schema}, authority=${yourScores.authority}, competitive=${yourScores.competitive}

Competitors:
${compSummary}

Generate insights about AI search visibility ONLY. Do NOT mention:
- Google rankings, SERPs, meta descriptions, backlinks, page speed
- Any traditional SEO concepts

DO mention:
- AI citation rates, schema markup for AI engines, llms.txt, FAQPage schema
- Being mentioned in ChatGPT/Perplexity/Gemini answers
- Structured data that helps AI engines extract and cite content
- Comparison pages that capture AI comparison queries
- Content depth that AI engines use as sources

Return ONLY this JSON (no other text, no markdown):
{"overall_position":"one sentence about AI search visibility position","beating_you":[{"dimension":"name","leader":"competitor","gap":0,"what_they_do":"specific GEO thing they do better"}],"close_gaps":[{"dimension":"name","gap":0,"action":"specific GEO action to close this gap"}],"your_advantages":[{"dimension":"name","vs":"competitor","margin":0}],"top_priority":"one specific GEO action to take first"}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }]
  });

  let raw = response.content[0].text.trim();
  if (raw.includes('```')) raw = raw.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) raw = m[0];

  try {
    return JSON.parse(raw);
  } catch {
    return { overall_position: '', beating_you: [], close_gaps: [], your_advantages: [], top_priority: '' };
  }
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const { url, vertical, competitors: manualCompetitors, your_scores } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const cleanUrl = url.startsWith('http') ? url : `https://${url}`;

  try {
    // Step 1 — Scrape the main domain (quick)
    const yourData = await scrape(cleanUrl);

    // Step 2 — Detect or use provided competitors
    let competitorList = manualCompetitors || [];
    if (competitorList.length === 0) {
      competitorList = await detectCompetitors(cleanUrl, vertical || 'automation', yourData.text);
    }

    // Step 3 — Scrape and audit all competitors in parallel
    const competitorResults = (await Promise.allSettled(
      competitorList.slice(0, 3).map(async (comp) => {
        const compUrl = comp.domain.startsWith('http') ? comp.domain : `https://${comp.domain}`;
        const compData = await scrape(compUrl);
        const scores = await quickAudit(compData, vertical || 'automation');
        return {
          name: comp.name || comp.domain,
          domain: comp.domain,
          reason: comp.reason || '',
          scores,
        };
      })
    )).filter(r => r.status === 'fulfilled').map(r => r.value);
    if (competitorResults.length === 0) throw new Error('Could not audit any competitors');

    // Step 4 — Score your own site (use provided scores if available, else audit)
    let yourScores = your_scores;
    if (!yourScores) {
      yourScores = await quickAudit(yourData, vertical || 'automation');
    }

    // Step 5 — Generate insights
    const insights = await generateInsights(cleanUrl, yourScores, competitorResults, vertical || 'automation');

    return res.status(200).json({
      success: true,
      your_domain: cleanUrl,
      your_scores: yourScores,
      competitors: competitorResults,
      insights,
    });

  } catch (err) {
    console.error('Compare error:', err);
    return res.status(500).json({ error: err.message });
  }
}
