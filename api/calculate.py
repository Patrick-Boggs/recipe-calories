"""
Vercel Python serverless function for recipe calorie calculation.

POST /api/calculate
Body: { "url": "https://example.com/recipe" }
Returns: JSON with recipe title, servings, calories, and ingredient breakdown.
"""

import json
import os
import traceback
from http.server import BaseHTTPRequestHandler
import requests

# Point NLTK to bundled data before importing recipe_logic
# (ingredient-parser-nlp needs averaged_perceptron_tagger_eng)
import pathlib
os.environ["NLTK_DATA"] = str(pathlib.Path(__file__).parent / "nltk_data")

# Defer the import so we can catch and report errors
_import_error = None
try:
    from api.recipe_logic import calculate_recipe
except Exception:
    _import_error = traceback.format_exc()
    calculate_recipe = None

USDA_API_KEY = os.environ.get("USDA_API_KEY")


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
        if _import_error:
            self._send_json(500, {"error": f"Server import error:\n{_import_error}"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
        except (json.JSONDecodeError, ValueError):
            self._send_json(400, {"error": "Invalid JSON body. Expected: {\"url\": \"...\"}"})
            return

        if not USDA_API_KEY:
            self._send_json(500, {"error": "Server misconfigured: USDA_API_KEY environment variable not set."})
            return

        url = data.get("url", "").strip()
        if not url:
            self._send_json(400, {"error": "Missing 'url' field in request body."})
            return

        if not url.startswith(("http://", "https://")):
            self._send_json(400, {"error": "URL must start with http:// or https://"})
            return

        try:
            result = calculate_recipe(url, USDA_API_KEY)
            # Remove 'amounts' from each ingredient (contains tuples, not JSON-serializable,
            # and not needed by the frontend)
            for ing in result.get("ingredients", []):
                ing.pop("amounts", None)
            self._send_json(200, result)
        except requests.exceptions.HTTPError as e:
            status = e.response.status_code if e.response is not None else 'unknown'
            self._send_json(403, {
                "error": f"This website blocked our request (HTTP {status}). Please try a different URL.",
                "blocked": True,
            })
        except ValueError as e:
            self._send_json(400, {"error": str(e)})
        except Exception:
            self._send_json(500, {"error": f"Failed to process recipe: {traceback.format_exc()}"})
