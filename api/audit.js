import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── SCRAPER ──────────────────────────────────────────────────────────────────

async function fetchUrl(url, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      }
    });
    const text = await resp.text();
    clearTimeout(timer);
    return { ok: resp.ok, text, status: resp.status };
  } catch {
    clearTimeout(timer);
    return { ok: false, text: '', status: 0 };
  }
}

function extractText(html, maxChars = 3000) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars);
}

function extractHeadings(html) {
  const headings = [];
  const matches = html.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi);
  for (const m of matches) {
    headings.push(m[1].replace(/<[^>]+>/g, '').trim());
  }
  return headings.slice(0, 20).join(' | ');
}

function extractSchema(html) {
  const schemas = [];
  const matches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of matches) {
    try {
      const parsed = JSON.parse(m[1]);
      schemas.push(parsed['@type'] || 'Unknown');
    } catch { /* skip */ }
  }
  return schemas;
}

function extractMeta(html, name) {
  const m = html.match(new RegExp(`<meta[^>]*name="${name}"[^>]*content="([^"]*)"`, 'i'))
    || html.match(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*name="${name}"`, 'i'));
  return m ? m[1] : '';
}

function checkAiBots(robotsTxt) {
  if (!robotsTxt) return { GPTBot: 'unknown', PerplexityBot: 'unknown', ClaudeBot: 'unknown' };
  const result = {};
  for (const bot of ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended']) {
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

async function scrapePageData(url) {
  const base = new URL(url).origin;

  const [homePage, robotsPage, llmsPage, sitemapPage] = await Promise.all([
    fetchUrl(url),
    fetchUrl(`${base}/robots.txt`),
    fetchUrl(`${base}/llms.txt`),
    fetchUrl(`${base}/sitemap.xml`),
  ]);

  const html = homePage.text || '';
  const fetchedSuccessfully = homePage.ok && html.length > 5000;

  // If fetch failed, note it clearly so agents fall back to training knowledge
  const fetchNote = fetchedSuccessfully
    ? `Page fetched successfully (${Math.round(html.length/1024)}KB). Analysis based on real page content.`
    : `IMPORTANT: Page could not be fetched (likely bot protection or JS-only rendering). You MUST use your training knowledge about this company (${url}) to score accurately. Do NOT give low scores just because data is unavailable — score based on what you know about this company.`;

  return {
    url,
    fetched: fetchedSuccessfully,
    fetch_note: fetchNote,
    html_size_kb: Math.round(html.length / 1024),
    has_js_spa: /<div[^>]*id="(root|app)"/.test(html) && html.length < 50000,
    text_content: extractText(html),
    headings: extractHeadings(html),
    meta_description: extractMeta(html, 'description'),
    schema_types: extractSchema(html),
    has_faq_schema: /"@type"\s*:\s*"FAQPage"/.test(html),
    has_software_schema: /"@type"\s*:\s*"SoftwareApplication"/.test(html),
    has_org_schema: /"@type"\s*:\s*"Organization"/.test(html),
    has_same_as: /sameAs/.test(html),
    robots_txt: robotsPage.ok ? robotsPage.text.slice(0, 1000) : 'Not found',
    ai_bot_status: checkAiBots(robotsPage.ok ? robotsPage.text : ''),
    has_llms_txt: llmsPage.ok && llmsPage.status === 200,
    has_sitemap: sitemapPage.ok && sitemapPage.status === 200,
  };
}

// ─── AGENTS ───────────────────────────────────────────────────────────────────

const AGENT_PROMPTS = {

  'geo-crawl': (data) => `You are a GEO crawlability expert scoring how accessible this site is to AI search bots.

URL: ${data.url}
${data.fetch_note}
HTML size: ${data.html_size_kb}KB | JS SPA: ${data.has_js_spa}
robots.txt: ${data.robots_txt.slice(0,400)}
AI bot access: ${JSON.stringify(data.ai_bot_status)}
llms.txt: ${data.has_llms_txt} | Sitemap: ${data.has_sitemap}

SCORING GUIDE (be accurate, not harsh):
- 85-100: Clean robots.txt, AI bots allowed, has sitemap, has llms.txt
- 65-84: Most bots allowed, sitemap present, minor gaps
- 45-64: Some bots blocked or missing sitemap or no llms.txt
- 25-44: Multiple bots blocked, JS rendering issues, no sitemap
- 0-24: All AI bots blocked or completely inaccessible

Only report ACTUAL problems found in the data above. Max 2 findings.

Return ONLY valid JSON:
{"dimension":"geo-crawl","score":0,"grade":"","findings":[{"id":"crawl_001","title":"Problem title","severity":"Critical|High|Medium","detail":"Specific detail","recommendation":"Specific action","effort":"Hours|Days|Weeks"}],"summary":"One sentence summary"}`,

  'geo-content': (data) => `You are a GEO content expert scoring how well this site's content is structured for AI citation.

URL: ${data.url}
Vertical: ${data.vertical || 'B2B software'}
${data.fetch_note}
Meta: ${data.meta_description || 'Not found'}
Headings: ${data.headings || 'Not found'}
Content: ${data.text_content.slice(0, 2000) || 'Not available'}

SCORING GUIDE (be accurate and fair):
- 85-100: Clear entity definition, FAQ content, specific value props with numbers, industry-specific pages
- 65-84: Good content structure, clear positioning, some FAQ depth
- 45-64: Basic content present but generic positioning or missing FAQ/use case depth  
- 25-44: Vague messaging, no clear entity definition, no FAQ content
- 0-24: Minimal readable content or completely blocked

If page couldn't be fetched, use your knowledge of this company to score accurately — major enterprise companies often score 55-75 even with gaps.
Only report REAL problems. Max 2 findings.

Return ONLY valid JSON:
{"dimension":"geo-content","score":0,"grade":"","findings":[{"id":"content_001","title":"Problem title","severity":"Critical|High|Medium","detail":"Specific detail","recommendation":"Specific action","effort":"Hours|Days|Weeks"}],"summary":"One sentence summary"}`,

  'geo-schema': (data) => `You are a GEO schema expert scoring structured data implementation.

URL: ${data.url}
${data.fetch_note}
Schema types found: ${JSON.stringify(data.schema_types)}
FAQPage: ${data.has_faq_schema} | SoftwareApp: ${data.has_software_schema} | Organization: ${data.has_org_schema} | sameAs: ${data.has_same_as}

SCORING GUIDE:
- 85-100: Has FAQPage + SoftwareApplication + Organization + sameAs links
- 65-84: Has Organization + sameAs, missing FAQPage or SoftwareApp
- 45-64: Has basic schema (Organization) but missing key GEO schemas
- 25-44: Minimal or no schema markup
- 0-24: No schema whatsoever

Base score ONLY on the actual schema data above. If fetch failed, use knowledge of this company.
Only report schemas that are genuinely missing. Max 2 findings.

Return ONLY valid JSON:
{"dimension":"geo-schema","score":0,"grade":"","findings":[{"id":"schema_001","title":"Missing X schema","severity":"Critical|High|Medium","detail":"Specific impact","recommendation":"Specific action","effort":"Hours|Days|Weeks"}],"summary":"One sentence summary"}`,

  'geo-authority': (data) => `You are a GEO authority expert scoring how credible AI engines perceive this brand.

URL: ${data.url}
Vertical: ${data.vertical || 'B2B software'}
${data.fetch_note}
Page content: ${data.text_content.slice(0, 800) || 'Use training knowledge'}

SCORING GUIDE (use your knowledge of this company if page unavailable):
- 85-100: Strong analyst recognition (Gartner/Forrester), G2 presence, Wikipedia entity, visible certifications, customer logos
- 65-84: Known brand, some analyst recognition, has review presence but limited schema
- 45-64: Growing brand, G2 presence but no analyst recognition structured data
- 25-44: Limited brand authority signals visible to AI
- 0-24: Unknown brand, no authority signals

IMPORTANT: Well-known companies like Appian, UiPath, Salesforce, ServiceNow should score 55-80 minimum based on their real-world authority — even if their homepage doesn't display it prominently.
Only report real, fixable gaps. Max 2 findings.

Return ONLY valid JSON:
{"dimension":"geo-authority","score":0,"grade":"","findings":[{"id":"authority_001","title":"Missing X","severity":"High|Medium","detail":"Specific gap","recommendation":"Specific action","effort":"Hours|Days|Weeks"}],"summary":"One sentence summary"}`,

  'geo-competitive': (data) => `You are a GEO competitive positioning expert scoring how well this company captures buyer queries in AI search.

URL: ${data.url}
Vertical: ${data.vertical || 'B2B software'}
${data.fetch_note}
Page content: ${data.text_content.slice(0, 1200)}
Headings: ${data.headings}

SCORING GUIDE:
- 85-100: Has dedicated comparison pages, industry vertical pages, problem-led content, use case depth
- 65-84: Good category positioning, some comparison content, decent use case coverage
- 45-64: Basic positioning, limited comparison content, some vertical pages
- 25-44: Generic positioning, no comparison pages, limited use case content
- 0-24: Extremely vague or no competitive content

Only report REAL missing content gaps you can verify from the page data or your knowledge of this company. Max 2 findings.
Finding titles must name specific missing content: "No [Competitor] vs [Company] Comparison Page"

Return ONLY valid JSON:
{"dimension":"geo-competitive","score":0,"grade":"","findings":[{"id":"competitive_001","title":"Missing specific content","severity":"Critical|High|Medium","detail":"Specific gap","recommendation":"Specific page to create","effort":"Hours|Days|Weeks"}],"summary":"One sentence summary"}`,

};

async function runAgent(name, pageData) {
  const prompt = AGENT_PROMPTS[name](pageData);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    temperature: 0,  // deterministic — same input = same score every time
    messages: [{ role: 'user', content: prompt }]
  });

  let raw = response.content[0].text.trim();
  if (raw.includes('```')) raw = raw.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) raw = jsonMatch[0];

  try {
    return JSON.parse(raw);
  } catch {
    return { dimension: name, score: 0, grade: 'F', findings: [], summary: 'Parse error — could not analyse page' };
  }
}

// ─── SYNTHESISER ──────────────────────────────────────────────────────────────

function synthesise(url, results) {
  const weights = {
    'geo-competitive': 0.30,
    'geo-content':     0.25,
    'geo-authority':   0.20,
    'geo-schema':      0.15,
    'geo-crawl':       0.10,
  };
  const agentKeys = Object.keys(weights);
  let composite = 0;
  const dimensionScores = {};
  const allFindings = [];
  const seen = new Set();

  for (const [agent, weight] of Object.entries(weights)) {
    const r = results[agent] || {};
    const score = r.score || 0;
    composite += score * weight;
    dimensionScores[agent] = { score, grade: r.grade || 'F', summary: r.summary || '' };
    for (const f of r.findings || []) {
      // Deduplicate findings by title
      if (!seen.has(f.title)) {
        seen.add(f.title);
        allFindings.push({ ...f, dimension: agent });
      }
    }
  }

  composite = Math.round(composite);
  const grade = composite >= 85 ? 'A' : composite >= 70 ? 'B' : composite >= 55 ? 'C' : composite >= 40 ? 'D' : 'F';
  const sev = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  allFindings.sort((a, b) => (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3));

  const criticalAndHighTitles = new Set([
    ...allFindings.filter(f => f.severity === 'Critical').map(f => f.title),
    ...allFindings.filter(f => f.severity === 'High').map(f => f.title),
  ]);

  return {
    url, composite_score: composite, grade,
    dimension_scores: dimensionScores,
    critical_findings: allFindings.filter(f => f.severity === 'Critical').slice(0, 3),
    high_findings:     allFindings.filter(f => f.severity === 'High').slice(0, 4),
    quick_wins:        allFindings.filter(f => f.effort === 'Hours' && !criticalAndHighTitles.has(f.title)).slice(0, 3),
    all_findings:      allFindings,
    agent_summaries:   Object.fromEntries(agentKeys.map(k => [k, results[k]?.summary || ''])),
    page_data_summary: {
      fetched: results._pageData?.fetched,
      schema_found: results._pageData?.schema_types,
      has_faq_schema: results._pageData?.has_faq_schema,
      has_sitemap: results._pageData?.has_sitemap,
    }
  };
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const { url, vertical } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const cleanUrl = url.startsWith('http') ? url : `https://${url}`;

  // Smart vertical inference — override if domain clearly belongs to a different vertical
  function inferVertical(domain, requestedVertical) {
    const d = domain.toLowerCase();
    if (/appian|uipath|pega|servicenow|automation|workflow|bpm|rpa|nintex|camunda|bizagi|celonis|signavio/.test(d)) return 'automation';
    if (/agency|wpromote|dentsu|ogilvy|tbwa|bbdo|saatchi|grey\.com|mccann/.test(d)) return 'agency';
    return requestedVertical || 'automation';
  }

  try {
    const pageData = await scrapePageData(cleanUrl);
    const domain = cleanUrl.replace('https://','').replace('www.','').split('/')[0];
    pageData.vertical = inferVertical(domain, vertical);

    // Step 2 — Run all 6 agents with real data
    const [crawl, content, schema, authority, competitive] = await Promise.all([
      runAgent('geo-crawl',       pageData),
      runAgent('geo-content',     pageData),
      runAgent('geo-schema',      pageData),
      runAgent('geo-authority',   pageData),
      runAgent('geo-competitive', pageData),
    ]);

    const results = {
      'geo-crawl': crawl, 'geo-content': content,
      'geo-schema': schema, 'geo-authority': authority,
      'geo-competitive': competitive,
      _pageData: pageData,
    };

    const report = synthesise(cleanUrl, results);
    return res.status(200).json({ success: true, report });

  } catch (err) {
    console.error('Audit error:', err);
    return res.status(500).json({ error: err.message });
  }
}
