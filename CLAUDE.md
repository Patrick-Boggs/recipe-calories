# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this project.

**Live:** https://recipe-calories-ten.vercel.app | **GitHub:** https://github.com/Patrick-Boggs/recipe-calories (branch: `master`)

## Tech Stack
- **Frontend:** React 19 + Vite 6, Material UI 7 dark theme (`#e94560` primary, `#1a1a2e` background)
- **Backend:** Vercel Python serverless functions (`api/calculate.py`, `api/cook.py`, `api/recipe_logic.py`)
- **Key libs:** recipe-scrapers, ingredient-parser-nlp, NLTK (bundled in `api/nltk_data/`), Pint, BeautifulSoup4

## Commands
```bash
npm run dev                  # Vite dev server (proxies /api/* to live Vercel)
npm run build                # Production build
vercel --prod --yes          # Deploy to Vercel production
vercel env pull              # Pull env vars for local use
vercel logs                  # View function logs
```

## Architecture

Two modes fire **in parallel** on Analyze — results cached in state so mode switching is instant. Each mode has independent loading state (`cookLoading`, `nutritionLoading`); the displayed spinner is derived from the current mode.

- **Cook mode** (default): `POST /api/cook` — scrapes title, ingredients, instructions, timing. No USDA lookup. Both ingredients and preparation steps support tap-to-strikethrough with checkboxes (`CookIdentity.jsx`, `CookContent.jsx`).
- **Nutrition mode**: `POST /api/calculate` — full ingredient parsing + USDA calorie lookup via `recipe_logic.py`. Recipe scaling (½x–4x) is frontend-only multiplication; per-serving kcal stays fixed.

**HTTP fetch with anti-bot fallback:** Both endpoints first try `requests` with browser-like headers, then retry with `cloudscraper` on 403/500. Some sites (e.g., cleobuttera.com) return 500 with valid HTML — these are accepted if the response body is >1000 chars. Blocked sites return a friendly error message.

**Recipe scraping 3-tier fallback** (shared by both endpoints):
1. `recipe-scrapers` supported mode (JSON-LD/Recipe schema) — allrecipes.com and most structured sites
2. `recipe-scrapers` generic mode (`supported_only=False`) — any site with JSON-LD/microdata
3. `_fallback_scrape_html()` — regex HTML extraction for unstructured sites (e.g., Smitten Kitchen). Comment sections are decomposed from the DOM before instruction scanning. Instructions scoped to `.entry-content` or `.post-content` when available.

**Fallback trigger:** Cook mode runs HTML fallback if **either** ingredients or instructions are missing (not only when both are). Only fills in the missing piece — preserves what tier 2 already found.

**Ingredient normalization pipeline** (`_normalize_raw_ingredient()` in `recipe_logic.py`, used by both Cook and Nutrition modes):
1. Smart quotes → plain apostrophes
2. Broken hyphens from HTML line-breaks: `sodium- free` → `sodium-free`
3. Parenthetical conversion notes stripped: `4 ounces (115 grams or 3/4 cup)` → `4 ounces`
4. Unit typo normalization: `lb's` → `lbs`, `tblsp` → `tbsp`
5. Container multiplication: `1 x 400g can` → `400g`

**Ingredient name cleaning** (`_clean_ingredient_name()`) before USDA lookup:
- Strips "or"/"for" clauses, recipe adjectives (fresh, melted, chopped, etc.), dietary labels (low-sodium, organic, boneless, etc.)

**Built-in lookup tables** in `recipe_logic.py`:
- `DENSITY_G_PER_CUP` (~124 entries) — volume-to-weight conversion (includes beans, chickpeas, lentils)
- `WEIGHT_PER_ITEM` (~46 entries) — per-item weights for countable ingredients with size variants
- `KNOWN_KCAL_PER_100G` (~125 entries) — pre-computed calories to avoid USDA API mismatches

**Non-recipe URL detection** (`validate_recipe_data()` in `recipe_logic.py`): Each scraper attempt tracks its tier (1 = supported, 2 = generic JSON-LD, 3 = fallback HTML). Tier 1/2 results are trusted (page declared Recipe schema). Tier 3 results must have 2+ ingredients matching `_RECIPE_SIGNAL_RE` (food/measurement words) or a `ValueError` is raised with a friendly message.

**Error handling:** All errors return user-friendly messages. Server debug info (tracebacks, HTTP status codes) is sent in a separate `"debug"` field, visible via the frontend debug toggle. Individual USDA ingredient failures are marked "not found" — they don't crash the entire recipe.

## Gotchas
- **Import path:** `calculate.py` and `cook.py` use `from api.recipe_logic import ...` — Vercel runs from project root, not from inside `api/`.
- **NLTK data:** Bundled in `api/nltk_data/` because Vercel's filesystem is read-only. Both endpoints set `NLTK_DATA` env var before importing.
- **Debug toggle:** AppBar bug icon toggles debug details (on by default). Should be removed or defaulted off before production.
- **DevLabel badges:** Yellow badges label UI regions for development. Should be removed before production.
- **Vercel free tier:** 10s function timeout — Nutrition mode with many ingredients may be slow.

## Known Issues
- **SK missing ingredients:** Sub-section ingredient lists (e.g., separate dough/filling) — only the largest block is captured.
- **SK servings null:** No structured serving counts on Smitten Kitchen.
- **Some sites fully blocked:** Sites requiring JavaScript execution (headless browser) can't be scraped — user sees red error to try a different URL.

## Testing
Use `/testrecipe <url>` to test a recipe URL against both live endpoints and check for known issues.

**Tested sites:**
- **allrecipes.com** — tier 1 (`recipe-scrapers`). Cook + Nutrition both pass.
- **smittenkitchen.com** — tier 2 ingredients + tier 3 instruction fallback. Cook + Nutrition both work.
- **cleobuttera.com** — returns 500 with valid HTML; accepted and parsed successfully via tier 1/2.
- **foodnetwork.com** — blocked (403). Shows red error to user.
- **usbank.com** — non-recipe site. Detected by `validate_recipe_data()`, shows friendly error.

## Task Tracking
See `todo.md` for upcoming tasks and roadmap.
