# GEO Audit Scoring Methodology

## Dimension weights

Each of the five dimensions contributes to the composite GEO Score with these weights, calibrated for enterprise automation and AI platform companies:

| Dimension | Weight | Rationale |
|---|---|---|
| Competitive Query Coverage | 30% | Highest weight — if you're not showing up for buyer queries, nothing else matters |
| Content Structure & AI Readiness | 25% | Content is what AI engines actually cite |
| Authority Signals | 20% | Trust signals that AI engines use to decide what to cite |
| Schema & Structured Data | 15% | Technical foundation for structured AI extraction |
| Crawl & Access | 10% | Baseline — most enterprise sites pass; failures are Critical |

**Composite score = (Competitive × 0.30) + (Content × 0.25) + (Authority × 0.20) + (Schema × 0.15) + (Crawl × 0.10)**

---

## Severity levels for findings

Each finding is classified by severity:

| Severity | Definition | Typical fix time |
|---|---|---|
| **Critical** | Actively blocking AI citation. Fix immediately. | Hours to days |
| **High** | Significantly reducing citation rate. Fix this sprint. | 1–2 weeks |
| **Medium** | Moderate improvement opportunity. Plan in next quarter. | 2–4 weeks |
| **Low** | Nice to have. Backlog. | Flexible |

---

## Scoring per dimension

### Crawl & Access (0–100)

Start at 100. Deduct for each issue found:

| Finding | Severity | Deduction |
|---|---|---|
| GPTBot blocked in robots.txt | Critical | −30 |
| PerplexityBot blocked | Critical | −25 |
| ClaudeBot blocked | High | −20 |
| No robots.txt present | Medium | −10 |
| JavaScript-only rendering (no SSR/SSG) | Critical | −30 |
| Sitemap missing | Critical | −20 |
| llms.txt absent (opportunity, not failure) | Low | −5 |
| Page load > 5 seconds | Medium | −10 |

Maximum deduction capped at 100 (minimum score 0).

---

### Content Structure & AI Readiness (0–100)

Score each signal present (+points):

| Signal present | Points |
|---|---|
| Clear H1 that states the company's primary value proposition | +10 |
| H2/H3 hierarchy logical and scannable | +8 |
| FAQ section present (5+ questions) | +15 |
| FAQ structured as question + direct answer paragraphs | +10 |
| Statistics and specific data points cited with sources | +10 |
| TL;DR or summary section on key pages | +8 |
| "Last updated" dates on content pages | +5 |
| Short paragraphs (avg <4 sentences) | +8 |
| Use case pages per industry (banking, insurance, healthcare) | +10 |
| Expert quotes with attribution | +8 |
| Clear entity definition ("X is a [category] platform that...") | +8 |

Maximum score: 100

---

### Schema & Structured Data (0–100)

Score each schema type present and correctly implemented:

| Schema type | Points | Notes |
|---|---|---|
| `SoftwareApplication` on product pages | +20 | Critical for enterprise software GEO |
| `FAQPage` on FAQ sections | +18 | FAQPage schema increases AI Overview citation rate 3.2× |
| `Organization` with sameAs links | +15 | Links to Wikipedia, LinkedIn, Crunchbase |
| `AggregateRating` (G2/Gartner scores) | +15 | Trust signal for AI engines |
| `BreadcrumbList` site-wide | +8 | Navigation clarity |
| `HowTo` on implementation/use case pages | +10 | AI engines love How-To structured content |
| `Article` on blog/thought leadership | +8 | Authorship and date signals |
| JSON-LD implementation (vs Microdata) | +6 | Preferred by AI engines |

Maximum score: 100

---

### Authority Signals (0–100)

Score each authority signal present:

| Signal | Points | Notes |
|---|---|---|
| G2 profile with 50+ reviews | +15 | G2 is a top-cited source by LLMs for software comparisons |
| Gartner Peer Insights presence | +12 | Analyst recognition matters for enterprise buyers |
| Gartner Magic Quadrant or Forrester Wave mention | +15 | Highest-authority analyst recognition |
| Wikipedia article for the company | +12 | Strong entity signal for all AI engines |
| LinkedIn company page with 10k+ followers | +8 | LinkedIn is among top-cited sources by LLMs |
| Press coverage in major tech publications (last 12 months) | +10 | Recency of press = authority signal |
| Reddit/community mentions (organic) | +8 | Authentic third-party validation |
| Compliance certifications mentioned (SOC 2, ISO 27001) | +10 | Critical for regulated industry queries |
| Named in industry association content | +5 | Ecosystem recognition |
| Partner/integration mentions by partners | +5 | Ecosystem breadth |

Maximum score: 100

---

### Competitive Query Coverage (0–100)

Test 10 queries from `queries.md` (the orchestrator selects the most relevant 10 for the target company). Score based on estimated visibility:

For each query tested:
- Company appears as primary recommendation → +10
- Company mentioned but not primary → +6
- Company not mentioned → +0

**Bonus scoring:**
- Has dedicated "vs competitor" pages → +5 per page (max +15)
- Has industry-specific landing pages (banking, insurance, healthcare) → +5 per page (max +15)
- Has a "migration from [competitor]" guide → +5 per guide (max +10)

Maximum score: 100 (queries 0–70 + bonuses 0–40, capped at 100)

---

## Grade thresholds

| Score | Grade | Interpretation |
|---|---|---|
| 85–100 | A | Strong GEO presence. Maintain and expand. |
| 70–84 | B | Good foundation with clear gaps. Prioritise High findings. |
| 55–69 | C | Moderate visibility. Significant improvement opportunity. |
| 40–54 | D | Weak GEO presence. Buyers likely can't find you via AI. |
| 0–39 | F | Invisible to AI engines. Critical issues to resolve immediately. |

---

## Benchmark scores (enterprise automation vertical)

Based on analysis of leading enterprise automation platforms:

| Company tier | Typical GEO Score | Notes |
|---|---|---|
| Category leaders (UiPath, ServiceNow) | 65–75 | Good authority, weak content structure |
| Strong challengers (Appian, Pega) | 45–60 | Moderate presence, limited FAQ/schema |
| Mid-market (most vendors) | 25–45 | Poor structure, limited authority signals |
| Emerging players | 10–30 | Largely invisible to AI engines |

A score above 60 is genuinely competitive in this vertical as of 2025.
