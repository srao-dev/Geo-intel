# Vertical Context: Enterprise Automation & AI Platforms

This file provides the domain context that calibrates all GEO audit subagents for the enterprise automation vertical. Load this before running any analysis.

---

## Vertical definition

**Target companies:** Software vendors selling intelligent automation, AI, RPA, BPM, or low-code platforms to large enterprises (1,000+ employees).

**Primary product categories:**
- Intelligent Process Automation (IPA)
- Robotic Process Automation (RPA)
- Business Process Management (BPM)
- AI Platform / Enterprise AI
- Low-code / No-code development platforms
- Agentic AI platforms

**Not in scope for this vertical:** Consumer automation tools (Zapier, Make for SMBs), developer tools (GitHub Actions, Jenkins), or vertical-specific automation software (insurance policy management systems, etc.)

---

## Enterprise buyer personas

Understanding who buys these platforms is critical for assessing content relevance.

### Primary buyer: Technology leadership
- **CIO** (Chief Information Officer) — ultimate technology decision authority
- **CTO** — technology architecture and strategy decisions
- **VP/Director of IT** — execution and procurement
- **What they ask AI:** High-level comparisons, analyst recognition, implementation risk, integration complexity

### Secondary buyer: Business leadership
- **COO** (Chief Operating Officer) — operational transformation
- **CFO** — ROI justification, cost reduction
- **Business unit heads** (Head of Banking Operations, VP Claims, etc.)
- **What they ask AI:** Business outcomes, ROI evidence, industry-specific use cases, compliance

### Evaluator: Technical team
- **Enterprise architect** — platform selection, integration design
- **IT manager** — day-to-day deployment and management
- **Developer / citizen developer** — build and configure automations
- **What they ask AI:** Technical capabilities, integration APIs, developer experience, pricing tiers

### Research team (does the AI searching)
- **Marketing analyst / research analyst** — builds initial vendor longlist
- **Procurement / vendor management** — does due diligence
- **What they ask AI:** Vendor comparisons, G2 scores, analyst recognition, pricing guidance

---

## Competitive landscape

### Tier 1 — Category leaders (high AI search authority)
These companies already have strong GEO presence due to brand strength and content investment:
- **UiPath** — RPA market leader, strong AI visibility
- **ServiceNow** — workflow automation, very strong AI presence
- **Salesforce** — CRM + automation, dominates many queries
- **Microsoft** (Power Automate) — bundled advantage, very high AI citations

### Tier 2 — Strong challengers (moderate AI search authority)
- **Automation Anywhere** — RPA, strong in financial services
- **Blue Prism** — RPA, particularly in UK/Europe
- **Appian** — BPM + low-code + AI, increasing AI presence
- **Pega** — BPM + CRM, strong in financial services

### Tier 3 — Specialists (growing AI search authority)
- **EdgeVerve (AI Next)** — AI platform, Infosys subsidiary
- **C3.ai** — enterprise AI platform
- **DataRobot** — AutoML / enterprise AI
- **NICE** — automation for customer service

### Emerging players (limited current AI search authority)
Hundreds of companies in this category. Most are largely invisible to AI engines today.

---

## Key industries for enterprise automation

These are the industries where buyers most frequently use AI to research automation platforms. Companies in this vertical should have content specifically targeting these industries.

### Financial Services (Highest priority)
- **Banking:** KYC/AML, loan processing, fraud detection, reconciliation
- **Insurance:** Claims processing, underwriting, policy management
- **Capital markets:** Trade processing, compliance reporting, risk management
- **Key compliance signals:** SOC 2, ISO 27001, GDPR, Basel III, Solvency II

### Healthcare (High priority)
- **Use cases:** Patient onboarding, prior authorisation, clinical documentation, billing
- **Key compliance signals:** HIPAA, HL7, FHIR integration, FDA compliance

### Manufacturing (Growing priority)
- **Use cases:** Supply chain automation, quality assurance, production planning, ERP integration
- **Key compliance signals:** ISO 9001, ISO 45001

### Retail & Consumer Goods (Moderate priority)
- **Use cases:** Order management, inventory automation, customer service, returns processing
- **Key signals:** Scalability, SAP/Oracle integration

### Public Sector / Government (Moderate priority)
- **Use cases:** Citizen services, benefits processing, compliance reporting
- **Key signals:** FedRAMP, FISMA, accessibility compliance

---

## GEO query intent framework

Enterprise automation queries fall into these intent categories. Understanding intent helps calibrate content quality assessment.

| Intent type | Example | Buyer stage | What content they want |
|---|---|---|---|
| Category ownership | "best intelligent automation platform" | Early research | Comprehensive platform overview, G2 scores, analyst recognition |
| Comparison | "UiPath vs Automation Anywhere" | Shortlisting | Honest feature comparison, differentiated positioning |
| Problem-led | "how to automate KYC banking" | Problem identified | Specific process guidance, customer evidence |
| Industry-specific | "automation platform for insurance" | Vertical fit | Industry-specific use cases, compliance credentials |
| Compliance | "SOC 2 certified automation platform" | Due diligence | Certifications clearly stated, compliance documentation |
| Implementation | "how long to implement RPA" | Evaluation | Specific timelines, implementation approach |
| ROI | "ROI of intelligent automation" | Business case | Customer data, ROI calculators, case studies |

---

## What "good GEO" looks like in this vertical

A top-performing enterprise automation company for GEO would have:

1. **Clear entity definition** — "X is an intelligent automation platform that [specific capability] for [specific industries]" — on homepage, in schema, in meta description

2. **Category leadership content** — comprehensive pages establishing expertise in their primary category, with statistics and analyst citations

3. **Deep industry pages** — one page per primary industry served, with specific named use cases, compliance credentials, and at least one customer story

4. **FAQ ecosystem** — FAQs on every major page, structured for direct AI citation, with FAQPage schema

5. **Competitor comparison pages** — dedicated pages for each major competitor matchup, honest but well-positioned

6. **Complete schema stack** — SoftwareApplication, Organization (with sameAs), FAQPage, AggregateRating, Article on all content

7. **Strong authority footprint** — G2 presence with 100+ reviews, Gartner/Forrester recognition, Wikipedia article, active press coverage

8. **Compliance visibility** — certifications in HTML (not just PDFs), specific compliance pages per regulated industry

9. **AI crawler access** — all major AI bots explicitly allowed, sitemap present, SSR rendering, llms.txt configured

10. **Content freshness** — blog/content published within last 60 days, "last updated" dates on product pages

---

## Scoring calibration for this vertical

The scoring thresholds in `scoring.md` are calibrated against the current state of this market. As of 2025:

- Most enterprise automation vendors score 25–45 out of 100 on GEO
- Category leaders (UiPath, ServiceNow) score approximately 65–75
- The practical ceiling for a well-optimised company today is approximately 85–90
- A score of 60+ should be considered genuinely competitive in this vertical

This means: even a relatively modest GEO investment can produce significant competitive advantage in AI search visibility.
