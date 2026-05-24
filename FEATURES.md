# GeoIntel / CiteIQ — Feature Status

## Core Setup
- ✅ Company creation wizard (4-step: company details, competitors, prompts, models)
- ✅ Model gating: Beta users restricted to Haiku, Sonar, Gemini Flash (GPT, Sonnet, Opus marked "Coming Soon")
- ✅ Prompts tab: Auto-add on typed input, Continue button enabled without clicking Add button

## Dashboard — Prompts Tab
- ✅ Prompt list with generated + manually added prompts
- ✅ Per-prompt mention rate (% of responses mentioning company)
- ✅ Model breakdown: Click + button to expand model-wise mention counts
- ✅ Citations per model (sources citing your brand on each model)
- ✅ Reprocess button to re-run tracking and update counts

## Dashboard — Citations Tab
- ✅ Top cited domains (blogs, G2, TechCrunch, etc.) with frequency
- ✅ Citation type distribution (Blog, Video, Comparison, Community, etc.)
- ❌ Removed: Was cluttering dashboard; integrated into other tabs

## Dashboard — Recommendations Tab (Content Plan System)
- ✅ Summary card: visibility gaps, critical gaps count, top competitor, estimated improvement potential
- ✅ **Defend & Replicate section**: Strong prompts (60%+) with expansion recommendations
- ✅ **Critical Gaps section**: Weak prompts (<20%) with content recommendations
- ✅ **Important Gaps section**: Prompts (20-50%) with content recommendations
- ✅ Structured recommendations: title, format (long-form, comparison, FAQ, guide, case-study), publish channels, evidence-backed "why", effort/impact
- ✅ Color-coded sections (green/red/orange) for quick scanning
- ✅ localStorage persistence (survives page refresh)
- ✅ Haiku-powered generation via `/api/generate-recommendations`

## Dashboard — Competitor Insights by Model
- ✅ Per-model visibility: Your % vs top competitor %
- ✅ Gap indicator: Critical/High/Watch/You Lead badges
- ✅ Citation breakdown: Content types driving competitor visibility (Blog 45%, Video 25%, etc.)
- ✅ Model badges (Claude, GPT, Perplexity, Gemini with brand colors)

## Tracking & Data
- ✅ Setup wizard triggers `/api/track` to run first scan
- ✅ Multi-model tracking: Haiku, Sonar, Gemini Flash (+ placeholders for future models)
- ✅ Response processing: Extract mention rates, track positions (numbered lists, tables, honorary mentions)
- ✅ Citation extraction: URLs from responses classified by type (Blog, Review, Video, Analyst, etc.)
- ✅ Demo data seeding: 7 days of 20-response runs per company for testing

## Deployment
- ✅ Vercel integration: geo-intel-tau.vercel.app
- ✅ Supabase RLS: Service role key for server-side company/competitor/prompt/model creation
- ✅ Environment variables: SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY

## Not Yet Implemented
- ❌ User management / Plan tiers (Free vs Paid)
- ❌ Authentication beyond Supabase auth
- ❌ Export to PDF / CSV
- ❌ Prompt clustering (grouped by semantic similarity)
- ❌ Geo Audit tab / technical audit
- ❌ Citation type visualization in content plan
- ❌ Success metrics tracking (did a recommendation actually move the needle?)

---

**Branch:** `geo-intel-duplicate` on srao-dev/Geo-intel  
**Last Updated:** 2026-05-23
