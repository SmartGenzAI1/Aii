# backend/app/services/web_search.py

import requests
from bs4 import BeautifulSoup
from typing import List, Dict

HEADERS = {
    "User-Agent": "Mozilla/5.0 GenZAI Bot"
}


def web_search_scrape(query: str, limit: int = 5) -> List[Dict]:
    """
    Scrape DuckDuckGo HTML results.
    """
    url = f"https://duckduckgo.com/html/?q={query}"
    res = requests.get(url, headers=HEADERS, timeout=10)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")
    results: List[Dict] = []

    for r in soup.select(".result__a")[:limit]:
        results.append({
            "title": r.get_text(strip=True),
            "url": r.get("href")
        })

    return results


def web_search_fallback(query: str) -> List[Dict]:
    """
    Safe fallback if scraping fails.
    Never raises.
    """
    return [
        {
            "title": "Search unavailable",
            "url": None,
            "snippet": "Fallback search provider not configured."
        }
    ]
