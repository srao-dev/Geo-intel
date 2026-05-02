"""
Orchestrator — loads skill files, runs 5 parallel agents, synthesises results.
"""
import asyncio
import json
from pathlib import Path
from typing import AsyncIterator
import anthropic
import os

# Paths to skill files (relative to project root)
SKILLS_DIR = Path(__file__).parent.parent.parent.parent / "skills"
AGENTS_DIR = Path(__file__).parent.parent.parent.parent / ".claude" / "agents"
VERTICALS_DIR = Path(__file__).parent.parent.parent.parent / "verticals"

AGENT_NAMES = ["geo-crawl", "geo-content", "geo-schema", "geo-authority", "geo-competitive"]


def load_skill(path: Path) -> str:
    """Loads a skill file, stripping YAML frontmatter."""
    text = path.read_text()
    if text.startswith("---"):
        # Strip frontmatter
        end = text.find("---", 3)
        if end != -1:
            return text[end + 3:].strip()
    return text


async def run_agent(
    agent_name: str,
    url: str,
    page_data: dict,
    vertical_context: str,
    client: anthropic.AsyncAnthropic,
) -> dict:
    """Runs a single specialist subagent and returns its findings."""
    skill_path = AGENTS_DIR / f"{agent_name}.md"
    skill = load_skill(skill_path)

    system_prompt = f"{skill}\n\n## Vertical Context\n{vertical_context}"

    user_message = f"""
Run your analysis on this website.

**Target URL:** {url}

**Page data:**
```json
{json.dumps(page_data, indent=2)[:6000]}
```

Return your findings as a valid JSON object matching the output schema in your instructions.
"""

    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = response.content[0].text

    # Extract JSON from response
    try:
        # Handle code fences
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
        return json.loads(raw)
    except Exception:
        # Return a minimal valid structure if parsing fails
        return {
            "dimension": agent_name,
            "score": 0,
            "grade": "F",
            "findings": [],
            "summary": f"Parse error — raw response available",
            "_raw": raw[:500],
        }


async def run_audit(url: str) -> AsyncIterator[dict]:
    """
    Main audit runner. Yields progress updates as a stream.
    Called by the WebSocket endpoint in main.py.
    """
    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    # Load vertical context
    vertical_context = (VERTICALS_DIR / "enterprise-automation.md").read_text()

    # Load scoring methodology (passed to synthesiser)
    scoring = (SKILLS_DIR / "geo-audit" / "scoring.md").read_text()

    yield {"status": "fetching", "message": f"Fetching {url}..."}

    from app.scraper.fetch import fetch_page, fetch_robots, fetch_llms_txt, fetch_sitemap

    page_data = await fetch_page(url)
    robots = await fetch_robots(url)
    llms_txt = await fetch_llms_txt(url)
    sitemap = await fetch_sitemap(url)

    page_data["robots_txt"] = robots
    page_data["llms_txt"] = llms_txt
    page_data["sitemap_url"] = sitemap

    if "error" in page_data:
        yield {"status": "error", "message": f"Could not fetch {url}: {page_data['error']}"}
        return

    yield {"status": "agents_launched", "message": "Launching 5 specialist agents in parallel..."}

    # Run all 5 agents simultaneously
    tasks = [
        run_agent(name, url, page_data, vertical_context, client)
        for name in AGENT_NAMES
    ]

    results = {}
    # Use as_completed pattern to stream results as they finish
    agent_tasks = {
        asyncio.create_task(run_agent(name, url, page_data, vertical_context, client)): name
        for name in AGENT_NAMES
    }

    for coro in asyncio.as_completed(agent_tasks.keys()):
        # Note: as_completed doesn't support dict keys directly — use gather instead
        pass

    # Simpler: gather all and stream completion events
    agent_results = await asyncio.gather(*tasks, return_exceptions=True)

    for name, result in zip(AGENT_NAMES, agent_results):
        if isinstance(result, Exception):
            result = {"dimension": name, "score": 0, "grade": "F", "findings": [], "error": str(result)}
        results[name] = result
        yield {
            "status": "agent_complete",
            "agent": name,
            "score": result.get("score", 0),
            "grade": result.get("grade", "F"),
            "summary": result.get("summary", ""),
        }

    # Synthesise into final report
    yield {"status": "synthesising", "message": "Calculating GEO score..."}
    report = synthesise(url, results, scoring)
    yield {"status": "complete", "report": report}


def synthesise(url: str, results: dict, scoring_context: str) -> dict:
    """
    Combines agent results into the final GEO Intelligence Report.
    Applies weighted scoring from scoring.md.
    """
    weights = {
        "geo-competitive": 0.30,
        "geo-content": 0.25,
        "geo-authority": 0.20,
        "geo-schema": 0.15,
        "geo-crawl": 0.10,
    }

    composite = 0
    dimension_scores = {}
    all_findings = []

    for agent, weight in weights.items():
        result = results.get(agent, {})
        score = result.get("score", 0)
        composite += score * weight
        dimension_scores[agent] = {
            "score": score,
            "grade": result.get("grade", "F"),
        }
        for f in result.get("findings", []):
            f["dimension"] = agent
            all_findings.append(f)

    composite = round(composite)

    if composite >= 85:
        grade = "A"
    elif composite >= 70:
        grade = "B"
    elif composite >= 55:
        grade = "C"
    elif composite >= 40:
        grade = "D"
    else:
        grade = "F"

    # Sort findings by severity
    severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    all_findings.sort(key=lambda f: severity_order.get(f.get("severity", "Low"), 3))

    critical = [f for f in all_findings if f.get("severity") == "Critical"]
    high = [f for f in all_findings if f.get("severity") == "High"]
    quick_wins = [f for f in all_findings if f.get("effort") == "Hours"]

    return {
        "url": url,
        "composite_score": composite,
        "grade": grade,
        "dimension_scores": dimension_scores,
        "critical_findings": critical,
        "high_findings": high,
        "quick_wins": quick_wins[:5],
        "all_findings": all_findings,
        "agent_summaries": {
            name: results.get(name, {}).get("summary", "") for name in AGENT_NAMES
        },
    }
