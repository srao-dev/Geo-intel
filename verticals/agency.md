# Vertical Context: Marketing & Digital Agencies

This file calibrates all GEO audit subagents for marketing agencies, digital agencies, SEO agencies, content agencies, and consultancies that are either:

A) Running GEO audits **on behalf of their clients** (agency as user of GEO Intel)
B) Auditing **their own agency website** for GEO visibility

The audit approach differs depending on which mode is active — the orchestrator should determine this from the URL and context.

---

## Mode A: Agency auditing a client's website

This is the most common use case. A marketing agency or consultant is using GEO Intel as a client deliverable tool — running audits, presenting reports, and charging for GEO strategy and implementation.

### What the agency needs from the audit

- A clear, credible score they can present to clients
- Findings framed as business impact, not technical jargon
- Specific fixes they can either implement themselves or brief a developer on
- Competitive context — how does the client compare to their category competitors?
- A prioritised action plan they can turn into a project proposal

### How to calibrate the audit for agency clients

When running in Mode A, apply the vertical context that matches the **client's industry**, not the agency's. If the URL is an enterprise automation company, apply enterprise automation context. If it's a general SaaS company, apply B2B SaaS context.

The agency context file is most relevant for Mode B below.

### Agency-specific output adjustments

When the user has indicated they are an agency running this for a client:
- Frame findings as business outcomes ("This is costing you AI citations for your highest-intent buyer queries") not technical issues ("FAQPage schema is absent")
- Include competitive benchmarking ("Your GEO score of 38 compares to a category average of 45 — you're below the midpoint")
- Structure the report so it can be presented directly to a CMO or CEO
- Include estimated effort in days/weeks — agencies need to scope projects

---

## Mode B: Agency auditing their own website

Agencies have a specific and often neglected GEO problem. They sell digital marketing services but are often invisible in AI search themselves — which is deeply ironic and increasingly a problem as buyers ask AI "which agency should I hire for X?"

### Why agencies struggle with GEO

1. **Service page vagueness** — "Full-service digital marketing agency" tells AI engines nothing specific. AI cannot recommend you for specific queries.

2. **No niche positioning** — Agencies that "do everything" are invisible for everything. Agencies with a clear niche ("SEO for B2B SaaS companies") show up for high-intent queries.

3. **No pricing signals** — Agencies almost never publish pricing. This means AI cannot answer "how much does a digital agency cost?" with their name.

4. **Case studies in PDFs** — Proof is gated behind downloads, invisible to AI.

5. **No FAQPage schema** — Buyers ask AI very specific questions about agencies. Agencies that answer these in structured content get cited.

---

## Agency buyer personas

### CMO / Marketing Director (client side)
- Evaluating agencies to hire
- Asks AI: "best SEO agency for SaaS", "top content marketing agencies for B2B", "[Agency name] reviews"
- Needs: specific proof of results, niche expertise signals, credibility markers

### Founder / CEO of a small business
- Looking for an agency to handle their marketing
- Asks AI: "affordable digital agency for small business", "best agency for [specific service]"
- Needs: pricing signals, clear service definition, accessibility

### In-house marketing team
- Looking for specialist agency support
- Asks AI: "best agency for [specific channel/tactic]"
- Needs: specialisation signals, case studies in their industry

---

## GEO query patterns for agencies

### Service-led queries
- "Best [service type] agency for [industry or company type]"
- "Top [service] agencies for [use case]"
- "[Service] agency that specialises in [niche]"

### Location queries (still relevant for agencies)
- "Best digital agency in [city]"
- "Top SEO agency in [country/region]"
- "[Service] agency near me"

### Comparison/validation queries
- "[Agency name] reviews"
- "Is [Agency] good?"
- "[Agency] vs [Other Agency]"
- "[Agency] results"

### Problem-led queries
- "Agency to help with [specific problem]"
- "How to improve [metric] — agency or in-house?"
- "When should I hire a [service type] agency?"

---

## Key GEO scoring signals for agencies

### 1. Niche clarity (most important)

Generic agencies are invisible. AI engines can only recommend an agency for a specific query if the agency clearly owns a niche.

**Invisible:** "We're a full-service digital marketing agency helping brands grow."
**Citable:** "We're an SEO and content agency exclusively for B2B SaaS companies with 50–500 employees."

The niche should appear in the H1, meta description, and throughout service pages.

### 2. Case study accessibility

Ungated, HTML case studies with specific metrics are the strongest GEO signal for agencies:
- Named client (or named industry if client is anonymous)
- Specific before/after metrics
- Named service delivered
- Timeframe

PDF case studies = invisible to AI engines.

### 3. Results and proof language

AI engines cite specific, verifiable claims. For agencies:
- "Helped 47 SaaS companies increase organic traffic by an average of 312%"
- "Generated $4.2M in attributed pipeline for our clients in 2024"
- "Average client sees ROI within 90 days"

Vague claims ("we get results") are ignored.

### 4. Founder/team authority signals

For small agencies, the founder's personal brand is often a stronger GEO signal than the agency brand:
- Founder LinkedIn presence
- Published articles or thought leadership
- Speaking at industry events
- Author schema on blog posts

### 5. Service page specificity

Each service should have its own dedicated page with:
- Clear definition of what's included
- Who it's for
- Typical outcomes/results
- Process overview
- FAQ section with FAQPage schema

### 6. Review platform presence

- Clutch.co — highest weight for agencies
- G2 — if the agency has a product or specific service offering
- Google Business Profile reviews
- LinkedIn recommendations

---

## Scoring calibration for agencies

| Agency type | Typical GEO Score | Notes |
|---|---|---|
| Large agency networks (WPP, Publicis subsidiaries) | 55–70 | Authority strong, content often generic |
| Well-positioned specialist agencies | 45–65 | Good niche clarity, variable schema |
| Mid-size generalist agencies | 25–45 | Weak niche, limited structured data |
| Small/boutique agencies | 10–30 | Often completely invisible — biggest opportunity |

---

## Common agency GEO mistakes

1. **"We work with brands of all sizes"** — means AI can't recommend you for anyone specifically
2. **No Clutch profile** — the primary trust signal for agency buyers; its absence is a Critical finding
3. **Service pages with no outcomes** — "we do SEO" without "and our clients see X result"
4. **Team bios without author schema** — founder thought leadership exists but isn't structured for AI citation
5. **Awards buried in footers** — industry awards are authority signals; they need structured mentions
6. **Blog content with no author attribution** — anonymous content has lower citation weight than attributed content
7. **No pricing signals at all** — even "projects start from $X" helps AI answer budget questions

---

## Fix priorities for agencies (ordered by impact)

1. **Niche definition** — rewrite homepage H1 to own a specific niche
2. **Clutch profile** — create or claim, get to 10+ verified reviews
3. **HTML case studies** — ungated, specific, with named metrics
4. **FAQPage schema** — on service pages answering real buyer questions
5. **Service page depth** — one detailed page per service with outcomes and process
6. **Author schema** — on all blog/thought leadership content
7. **Organization schema** — with sameAs to Clutch, LinkedIn, Google Business
8. **Results page** — aggregate client outcomes in citable format
9. **Comparison content** — "agency vs in-house" or "why specialist vs generalist"
10. **Location schema** — LocalBusiness schema if serving specific geography
