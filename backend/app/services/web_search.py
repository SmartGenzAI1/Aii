# backend/app/services/web_search.py

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 GenZAI Bot"
}

def web_search_scrape(query: str, limit: int = 5):
    url = f"https://duckduckgo.com/html/?q={query}"
    res = requests.get(url, headers=HEADERS, timeout=10)

    soup = BeautifulSoup(res.text, "html.parser")
    results = []

    for r in soup.select(".result__a")[:limit]:
        results.append({
            "title": r.get_text(),
            "url": r["href"]
        })

    return results
    
 def web_search_fallback(query: str) -> list[dict]:
    """
    Lightweight fallback when scraping fails.
    Returns minimal structured results.
    """
    try:
        return [
            {
                "title": "Search unavailable",
                "url": None,
                "snippet": "Fallback search provider not configured."
            }
        ]
    except Exception:
        return []
