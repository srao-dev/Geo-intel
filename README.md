> Product name: **CiteIQ**. Internally built and tracked under the repo name "Geo-intel".

# GEO Intel

**The only GEO intelligence tool built specifically for enterprise automation and AI platform companies.**

GEO (Generative Engine Optimisation) is the practice of ensuring your company is cited — accurately, positively, and consistently — when enterprise buyers ask AI engines questions like:

- *"What is the best intelligent automation platform for banking?"*
- *"UiPath vs Appian vs ServiceNow — which should we choose?"*
- *"Which automation platforms are SOC 2 certified?"*
- *"How do I automate KYC in financial services?"*

Unlike traditional SEO which optimises for Google rankings, GEO optimises for AI citations. When a CIO's team asks ChatGPT to build a vendor shortlist — you either show up or you don't. GEO Intel tells you why, and fixes it.

---

## What it does

GEO Intel runs a full AI visibility audit on any enterprise automation or AI platform company's website. It analyses the site across **6 dimensions** using specialist AI agents, produces a scored GEO report, and generates specific ready-to-implement fixes — content rewrites, schema markup, FAQ sets, comparison page frameworks, and more.

**It doesn't just tell you what to fix. It fixes it.**

---

## Why enterprise automation specifically?

Enterprise automation buyers (CIOs, COOs, IT directors) and their research teams increasingly use AI engines to build vendor shortlists before ever speaking to sales. A single ChatGPT response recommending "the top 5 BPM platforms for insurance" can determine whether a $2M deal gets to a demo stage.

The stakes are high. The gap between well-optimised and poorly-optimised companies is enormous — most enterprise automation vendors score 25–45 out of 100 on GEO readiness. Category leaders like UiPath and ServiceNow score 65–75. A score above 60 is genuinely competitive in this market today.

GEO Intel is calibrated for this specific vertical — the buyer personas, competitor set, critical queries, and scoring benchmarks are all tuned for enterprise automation.

---

## The 6 GEO dimensions

| # | Dimension | Weight | What it measures |
|---|---|---|---|
| 1 | **Competitive Query Coverage** | 30% | Does the company have content that would be cited for the 40 most important enterprise automation buyer queries? |
| 2 | **Content Structure & AI Readiness** | 25% | Is the content structured so AI engines can extract, understand, and cite it? Entity definition, FAQ quality, industry depth, freshness. |
| 3 | **Authority Signals** | 20% | External trust signals — G2 reviews, Gartner/Forrester recognition, Wikipedia presence, compliance certifications, press coverage. |
| 4 | **Schema & Structured Data** | 15% | Is the technical structured data in place? SoftwareApplication, FAQPage, Organization with sameAs, AggregateRating. |
| 5 | **Crawl & Access** | 10% | Can AI bots actually access and read the site? GPTBot, PerplexityBot, ClaudeBot permissions, JavaScript rendering, sitemap. |
| 6 | **Brand Sentiment** | Supplementary | How are AI engines likely to describe the company? Positioning clarity, claim credibility, consistency, narrative accuracy. |

**Composite GEO Score = (Competitive × 0.30) + (Content × 0.25) + (Authority × 0.20) + (Schema × 0.15) + (Crawl × 0.10)**

---

## Architecture

GEO Intel is a multi-agent system. When you submit a URL, six specialist AI agents analyse different dimensions simultaneously, then an orchestrator synthesises their findings into a scored report.

```
User submits URL
        ↓
Orchestrator (SKILL.md)
├── Loads vertical context (enterprise-automation.md)
├── Loads scoring methodology (scoring.md)
├── Loads query bank (queries.md)
        ↓
Runs 6 agents in parallel:
├── geo-crawl.md        → Crawlability & technical access
├── geo-content.md      → Content structure & AI readiness
├── geo-schema.md       → Schema markup & structured data
├── geo-authority.md    → Authority signals & external validation
├── geo-competitive.md  → Competitive query coverage
└── geo-sentiment.md    → Brand sentiment & narrative quality
        ↓
Synthesiser
├── Calculates weighted composite score (0–100)
├── Assigns grade (A–F)
├── Prioritises findings by severity (Critical / High / Medium / Low)
└── Identifies quick wins (effort < 1 day)
        ↓
Fix Generator (geo-fix.md)
└── On demand: generates specific ready-to-implement fixes
```

### File structure

```
geo-intel/
├── README.md
├── install.sh                          ← Claude Code installer
├── package.json                        ← Vercel dependencies
├── vercel.json                         ← Vercel serverless config
├── index.html                          ← Frontend (full marketing page + audit tool)
│
├── api/
│   └── audit.js                        ← Vercel serverless function
│                                          Reads skill files → calls Claude API → returns report
│
├── skills/
│   └── geo-audit/
│       ├── SKILL.md                    ← Orchestrator skill
│       ├── scoring.md                  ← Weighted scoring methodology
│       └── queries.md                  ← 40 enterprise automation GEO queries
│
├── .claude/
│   └── agents/
│       ├── geo-crawl.md                ← Crawlability & access agent
│       ├── geo-content.md              ← Content structure agent
│       ├── geo-schema.md               ← Schema & structured data agent
│       ├── geo-authority.md            ← Authority signals agent
│       ├── geo-competitive.md          ← Competitive query coverage agent
│       ├── geo-sentiment.md            ← Brand sentiment agent
│       └── geo-fix.md                  ← Fix generator agent
│
└── verticals/
    └── enterprise-automation.md        ← Vertical context, buyer personas,
                                           competitor tiers, industry map
```

---

## How the skills work

Each skill file (`.md`) is a complete AI agent brief. It contains:

1. **YAML frontmatter** — name, description, allowed tools (used by Claude Code)
2. **Role definition** — what this agent is responsible for
3. **Analysis tasks** — step-by-step what to check, in what order
4. **Scoring methodology** — how to calculate the dimension score
5. **Output schema** — exact JSON structure to return
6. **Gotchas** — common mistakes and edge cases to avoid

When a URL is submitted, `api/audit.js` reads each skill file from the repo and passes it as the `system` prompt to Claude Sonnet via the Anthropic API. Each agent runs as a separate API call — all 6 run in parallel using `Promise.all()`.

The skill files are the intelligence. Changing a skill file changes the audit behaviour — no code changes needed.

---

## The fix generator

The `geo-fix.md` agent is what separates GEO Intel from every other GEO tool on the market.

Monitoring tools (Otterly, Profound, AthenaHQ) tell you *if* you show up and *where* you're missing. GEO Intel tells you that too — but then it **generates the actual fix**.

For any finding, the fix generator can produce:

| Fix type | What it generates |
|---|---|
| **Entity definition rewrite** | 3 alternative homepage H1/opening statement options, structured for AI citation |
| **FAQ generation** | Complete FAQ section (8–12 questions) with buyer-language questions and self-contained answers, plus FAQPage JSON-LD schema ready to paste |
| **Schema markup** | Complete, populated JSON-LD blocks for SoftwareApplication, Organization, FAQPage, AggregateRating — filled with real company data, not placeholders |
| **robots.txt fix** | Exact robots.txt additions to allow all AI crawlers |
| **llms.txt generation** | Complete llms.txt file guiding AI engines to the most important content |
| **Industry page framework** | Full content framework for a missing industry page — structure, use cases, compliance angle, customer evidence format |
| **Comparison page framework** | "[Company] vs [Competitor]" page framework with honest positioning guidance |

---

## The vertical context system

All 6 agents receive the `verticals/enterprise-automation.md` file alongside their skill brief. This file contains:

- **Buyer personas** — CIO, COO, IT Director, enterprise architect, procurement team — what each one asks AI engines and why
- **Competitor tiers** — Category leaders (UiPath, ServiceNow), strong challengers (Appian, Pega), specialists (EdgeVerve, C3.ai)
- **Key industries** — Financial services, healthcare, manufacturing, retail, public sector — with specific use cases and compliance frameworks for each
- **GEO query intent framework** — How to interpret buyer intent from query type (category, comparison, problem-led, compliance, ROI)
- **Scoring calibration** — What good GEO looks like in this vertical, with benchmark scores for different company tiers
- **40 critical GEO queries** — The exact questions enterprise automation buyers ask AI engines, used by the competitive coverage agent

The vertical context is what makes GEO Intel's findings relevant rather than generic. A crawlability finding for an enterprise automation company targeting regulated industries means something different than the same finding for a consumer app.

---

## Scoring benchmarks

| Company tier | Typical GEO Score | What it means |
|---|---|---|
| Category leaders (UiPath, ServiceNow) | 65–75 | Good authority, but most still lack content structure and schema |
| Strong challengers (Appian, Pega) | 45–60 | Moderate presence, limited FAQ/schema investment |
| Mid-market vendors | 25–45 | Poor structure, limited authority signals, weak query coverage |
| Emerging players | 10–30 | Largely invisible to AI engines today |

**A score above 60 is genuinely competitive in this vertical as of 2025.**

This means even a modest GEO investment — implementing FAQPage schema, clarifying entity definition, building 3–4 comparison pages — can move a company from invisible to competitive relatively quickly.

---

## Deployment

### Option A — Web app (Vercel, recommended)

The web app deploys to Vercel in one click. Users enter a URL in a browser — no API key required, no setup.

```
index.html          → Vercel (static frontend)
api/audit.js        → Vercel serverless function (reads skills, calls Claude API)
ANTHROPIC_API_KEY   → Vercel environment variable (secret, never exposed to users)
```

**Deploy steps:**
1. Push this repo to GitHub
2. Connect to Vercel → Import repo → Add `ANTHROPIC_API_KEY` environment variable
3. Deploy — live in 60 seconds

See `docs/deployment.md` for full guide.

### Option B — Claude Code CLI

The skill files are also designed for Claude Code. Install with:

```bash
chmod +x install.sh
./install.sh
```

Then run audits in the terminal:

```bash
/geo-audit appian.com
/geo-audit uipath.com
/geo-fix appian.com --finding content_001
```

### Local development

```bash
# Install dependencies
cd api && npm install

# Add your API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# Serve locally (requires Node.js)
npx vercel dev

# Open http://localhost:3000
```

---

## AI engines supported

The audit analyses content readiness factors that improve visibility across all major AI engines:

| AI Engine | Crawler | Key factors |
|---|---|---|
| **ChatGPT** (OpenAI) | GPTBot | Schema markup, content structure, authority signals |
| **Perplexity** | PerplexityBot | Content freshness, citation-worthy data points, structured answers |
| **Google AI Overviews** | Googlebot + Google-Extended | FAQPage schema, E-E-A-T signals, structured data |
| **Claude** (Anthropic) | ClaudeBot | Entity clarity, content structure, authority signals |
| **Gemini** (Google) | Googlebot | Same as Google AI Overviews |
| **Copilot** (Microsoft) | BingBot | Bing indexing signals, structured data |

The audit checks whether each crawler is explicitly allowed in `robots.txt`, and whether the site's content structure and schema markup meet the requirements for citation across all of them.

**Important note:** GEO Intel analyses content readiness as a proxy for AI visibility — it does not make live queries to each AI engine. Content readiness scoring is based on established GEO research and is calibrated against observed citation patterns for enterprise automation companies.

---

## Tech stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML, CSS, vanilla JS | Full marketing page + audit tool UI |
| Serverless | Node.js (Vercel functions) | Reads skill files, orchestrates API calls |
| AI | Claude Sonnet 4 (Anthropic API) | Runs all 6 specialist agents |
| Deployment | Vercel | Hosting, serverless functions, environment variables |
| Skills | Markdown (SKILL.md files) | Agent intelligence — readable, editable, version-controlled |

---

## Contributing

The skill files are the heart of the product. To improve the audit:

1. Edit the relevant `.md` file in `.claude/agents/`
2. Test by running an audit on a known domain
3. Compare results before and after
4. Submit a PR with the improvement and your test results

Common improvement areas:
- Adding new GEO queries to `queries.md`
- Refining scoring weights in `scoring.md`
- Expanding the vertical context in `enterprise-automation.md`
- Adding a new vertical (MarTech, Cybersecurity) as a new file in `verticals/`

---

## Roadmap

- [ ] Brand sentiment scoring (geo-sentiment.md) — in progress
- [ ] Live AI query testing via Perplexity API
- [ ] PDF report export
- [ ] MarTech vertical
- [ ] Competitive comparison mode (two URLs side by side)
- [ ] Saved audit history
- [ ] Email report delivery

---

## License

MIT — free to use, fork, and build on.

---

*Built by a marketer who got tired of not showing up in AI search. Powered by Claude Sonnet.*
