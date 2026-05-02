"""
Page scraper — fetches and extracts structured content from any URL.
Used by the orchestrator before launching subagents.
"""
import httpx
from bs4 import BeautifulSoup
from typing import Optional
import json


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; GEOIntelBot/1.0; "
        "+https://geointel.app/bot)"
    )
}


async def fetch_page(url: str) -> dict:
    """
    Fetches a URL and returns structured page data.
    Returns a dict with text, headings, schema, meta, etc.
    """
    async with httpx.AsyncClient(
        headers=HEADERS,
        follow_redirects=True,
        timeout=20.0,
    ) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            html = response.text
        except httpx.HTTPStatusError as e:
            return {"error": f"HTTP {e.response.status_code}", "url": url}
        except Exception as e:
            return {"error": str(e), "url": url}

    soup = BeautifulSoup(html, "html.parser")

    return {
        "url": url,
        "title": _get_title(soup),
        "meta_description": _get_meta(soup, "description"),
        "h1": _get_headings(soup, "h1"),
        "h2": _get_headings(soup, "h2"),
        "h3": _get_headings(soup, "h3"),
        "schema_blocks": _get_schema(soup),
        "text_sample": _get_text(soup, max_chars=8000),
        "html_size_kb": round(len(html) / 1024, 1),
        "has_react_root": _has_react_root(html),
        "has_gtm": "googletagmanager" in html,
    }


async def fetch_robots(base_url: str) -> Optional[str]:
    """Fetches robots.txt for a domain."""
    robots_url = base_url.rstrip("/") + "/robots.txt"
    async with httpx.AsyncClient(headers=HEADERS, timeout=10.0) as client:
        try:
            r = await client.get(robots_url)
            return r.text if r.status_code == 200 else None
        except Exception:
            return None


async def fetch_llms_txt(base_url: str) -> Optional[str]:
    """Fetches llms.txt if present."""
    llms_url = base_url.rstrip("/") + "/llms.txt"
    async with httpx.AsyncClient(headers=HEADERS, timeout=10.0) as client:
        try:
            r = await client.get(llms_url)
            return r.text if r.status_code == 200 else None
        except Exception:
            return None


async def fetch_sitemap(base_url: str) -> Optional[str]:
    """Checks for sitemap.xml."""
    for path in ["/sitemap.xml", "/sitemap_index.xml"]:
        sitemap_url = base_url.rstrip("/") + path
        async with httpx.AsyncClient(headers=HEADERS, timeout=10.0) as client:
            try:
                r = await client.get(sitemap_url)
                if r.status_code == 200:
                    return sitemap_url
            except Exception:
                continue
    return None


# --- Helpers ---

def _get_title(soup: BeautifulSoup) -> str:
    tag = soup.find("title")
    return tag.get_text(strip=True) if tag else ""


def _get_meta(soup: BeautifulSoup, name: str) -> str:
    tag = soup.find("meta", attrs={"name": name})
    if tag:
        return tag.get("content", "")
    tag = soup.find("meta", attrs={"property": f"og:{name}"})
    return tag.get("content", "") if tag else ""


def _get_headings(soup: BeautifulSoup, tag: str) -> list[str]:
    return [h.get_text(strip=True) for h in soup.find_all(tag)][:10]


def _get_schema(soup: BeautifulSoup) -> list[dict]:
    blocks = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            blocks.append(data)
        except Exception:
            pass
    return blocks


def _get_text(soup: BeautifulSoup, max_chars: int = 8000) -> str:
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    return text[:max_chars]


def _has_react_root(html: str) -> bool:
    return 'id="root"' in html or 'id="app"' in html or "__NEXT_DATA__" in html
