# backend/app/api/v1/web_search.py

from fastapi import APIRouter, Query
from app.services.web_search import web_search_scrape, web_search_fallback

router = APIRouter(prefix="/web-search", tags=["Web Search"])

@router.get("")
def search(q: str = Query(...)):
    try:
        return {
            "source": "scrape",
            "results": web_search_scrape(q)
        }
    except Exception:
        return {
            "source": "fallback",
            "results": web_search_fallback(q)
        }
