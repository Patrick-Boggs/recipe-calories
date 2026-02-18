"""
Vercel Python serverless function for cook mode recipe scraping.

POST /api/cook
Body: { "url": "https://example.com/recipe" }
Returns: JSON with recipe title, ingredients, instructions, and timing.
"""

import json
import traceback
from http.server import BaseHTTPRequestHandler

import os
import pathlib

import requests
import cloudscraper
from recipe_scrapers import scrape_html

# Point NLTK to bundled data before importing recipe_logic
# (recipe_logic imports ingredient-parser-nlp which needs NLTK data)
os.environ["NLTK_DATA"] = str(pathlib.Path(__file__).parent / "nltk_data")
from api.recipe_logic import _fallback_scrape_html


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self._send_json(200, {})

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
        except (json.JSONDecodeError, ValueError):
            self._send_json(400, {"error": 'Invalid JSON body. Expected: {"url": "..."}'})
            return

        url = data.get("url", "").strip()
        if not url:
            self._send_json(400, {"error": "Missing 'url' field in request body."})
            return

        if not url.startswith(("http://", "https://")):
            self._send_json(400, {"error": "URL must start with http:// or https://"})
            return

        try:
            result = scrape_cook_data(url)
            self._send_json(200, result)
        except ValueError as e:
            self._send_json(400, {"error": str(e)})
        except Exception:
            self._send_json(500, {"error": f"Failed to scrape recipe: {traceback.format_exc()}"})


def scrape_cook_data(url):
    """Scrape a recipe URL for cook mode data (no calorie lookup)."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }
    resp = requests.get(url, headers=headers, timeout=15)
    if resp.status_code in (403, 500):
        scraper_session = cloudscraper.create_scraper()
        resp = scraper_session.get(url, timeout=15)
    # Some sites return 500 but still send full HTML with recipe data
    if resp.status_code != 500 or len(resp.text) < 1000:
        resp.raise_for_status()

    try:
        scraper = scrape_html(resp.text, org_url=url)
    except Exception:
        try:
            scraper = scrape_html(resp.text, org_url=url, supported_only=False)
        except Exception:
            scraper = None

    result = {"title": None, "ingredients": [], "instructions": [], "prep_time": None, "cook_time": None, "total_time": None}

    if scraper is not None:
        try:
            result["title"] = scraper.title()
        except Exception:
            pass

        try:
            result["ingredients"] = scraper.ingredients()
        except Exception:
            pass

        try:
            raw = scraper.instructions()
            if isinstance(raw, str):
                result["instructions"] = [s.strip() for s in raw.split("\n") if s.strip()]
            elif isinstance(raw, list):
                result["instructions"] = raw
        except Exception:
            pass

        try:
            result["prep_time"] = scraper.prep_time()
        except Exception:
            pass

        try:
            result["cook_time"] = scraper.cook_time()
        except Exception:
            pass

        try:
            result["total_time"] = scraper.total_time()
        except Exception:
            pass

    # Fall back to plain HTML extraction if scraper missed ingredients OR instructions
    if not result["ingredients"] or not result["instructions"]:
        title, _servings, ingredients, instructions = _fallback_scrape_html(resp.text)
        result["title"] = result["title"] or title
        if not result["ingredients"]:
            result["ingredients"] = ingredients
        if not result["instructions"]:
            result["instructions"] = instructions

    if not result["ingredients"] and not result["instructions"]:
        raise ValueError("No ingredients or instructions found for this recipe.")

    return result
