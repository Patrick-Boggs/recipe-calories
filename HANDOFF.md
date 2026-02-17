# Recipe Calories PWA — Handoff Document

## What Was Built

Rebuilt a Python desktop recipe calorie calculator into a **React PWA + Python serverless backend** deployed on Vercel. The app now has two modes: **Cook mode** (default) for viewing ingredients and preparation steps, and **Nutrition mode** for calorie breakdown via USDA lookup.

**Live URL:** https://recipe-calories-ten.vercel.app
**GitHub:** https://github.com/Patrick-Boggs/recipe-calories
**Branch:** `master`

## Architecture

```
RecipeApp_React/
├── api/
│   ├── calculate.py          # Nutrition mode endpoint (POST /api/calculate)
│   ├── cook.py               # Cook mode endpoint (POST /api/cook)
│   ├── recipe_logic.py       # Backend logic for nutrition calculations
│   └── nltk_data/            # Bundled NLTK data (required for ingredient parsing)
├── src/
│   ├── App.jsx               # Main app — state, routing, mode switching, API calls
│   ├── App.css               # (empty — styles handled by MUI)
│   ├── main.jsx              # Entry point — ThemeProvider, CssBaseline
│   ├── index.css             # Minimal (safe-area padding only)
│   └── components/
│       ├── AcquisitionCard.jsx   # URL input + Cook/Nutrition toggle
│       ├── CookIdentity.jsx      # Cook mode: title, timing, checkable ingredients
│       ├── CookContent.jsx       # Cook mode: numbered preparation steps
│       ├── RecipeSummary.jsx     # Nutrition mode: title, stats, favorite, scale selector
│       ├── IngredientTable.jsx   # Nutrition mode: ingredient calorie breakdown
│       ├── LoadingIndicator.jsx  # MUI CircularProgress spinner
│       ├── FavoritesView.jsx     # Favorites screen scaffold (placeholder data)
│       └── DevLabel.jsx          # Temporary yellow badges labeling UI regions
├── public/
│   ├── icon-192.png          # Placeholder PWA icons
│   └── icon-512.png
├── MUI_implementation.txt    # Original MUI migration plan (reference)
├── vercel.json               # Minimal config (framework: vite)
├── vite.config.js            # Vite + PWA plugin config
├── requirements.txt          # Python deps for serverless functions
└── .env.example              # Documents required USDA_API_KEY env var
```

## UI Structure (MUI)

The app uses Material UI with a dark theme (`#e94560` primary, `#1a1a2e` background). Components are labeled with yellow **DevLabel** badges during development for easy communication.

- **AppBar** — Sticky top bar with app/recipe title, debug toggle (bug icon), favorites icon
- **Acquisition** — Card with Cook/Nutrition toggle + URL input + Analyze button
- **Identity** — Mode-dependent card:
  - Cook: recipe title, prep/cook/total time, checkable ingredient list, favorite toggle
  - Nutrition: recipe title, servings/kcal stats, favorite toggle, scale selector (½x–4x)
- **Content** — Mode-dependent card:
  - Cook: numbered preparation steps
  - Nutrition: ingredient calorie breakdown with status dots and chips
- **Favorites** — Separate view (placeholder) accessible via AppBar heart icon

## Two Modes

Both endpoints are called **in parallel** when the user hits Analyze. Results are cached in state so switching modes is instant. Each mode has independent loading state — the spinner only shows for the currently active mode.

### Cook Mode (default)
- Calls `POST /api/cook` — scrapes title, ingredients, instructions, timing
- **No USDA lookup** — fast response
- Ingredients shown as checkable list (tap to strikethrough)
- Preparation steps shown as numbered cards

### Nutrition Mode
- Calls `POST /api/calculate` — full ingredient parsing + USDA calorie lookup
- Shows calorie breakdown per ingredient with status dots (ok/skipped/not found)
- Recipe scaling (½x, 1x, 2x, 3x, 4x) — frontend-only multiplication
- Servings scale with multiplier; per-serving kcal stays fixed (calorie density is constant)

## Key Decisions & Gotchas

### Import path
`calculate.py` and `cook.py` both use `from api.recipe_logic import ...` — Vercel runs from the project root, not from inside `api/`.

### NLTK data bundling
`ingredient-parser-nlp` requires NLTK's `averaged_perceptron_tagger_eng` data. Vercel's filesystem is **read-only**, so NLTK can't download it at runtime. The data is pre-downloaded and committed in `api/nltk_data/`. Both `calculate.py` and `cook.py` set `NLTK_DATA` env var to that path before importing `recipe_logic`.

### API key
The USDA API key is stored as a Vercel environment variable (`USDA_API_KEY`), set for production, preview, and development. It is **not** in the source code. The key is: `moiGbWOpJ9Qi9Dfgivf83MIFtB87btfVL4DBcBwL`.

### vercel dev issues
`vercel dev` has a known issue with Vite where the SPA catch-all rewrite causes Vite's HMR module requests to be served as `index.html`. The `vercel.json` was stripped to minimal config to mitigate, but local dev with the Python API still doesn't work reliably. **Current workflow: deploy to Vercel and test via the .app URL.**

### Debug toggle
The AppBar has a bug icon that toggles debug details on/off (on by default). When enabled, API errors show HTTP status, request URL, and full response body. Includes a **Copy** button that copies debug text to clipboard for easy sharing. This should be removed or defaulted to off before production release.

### DevLabel badges
Yellow badges label each UI region (AppBar, Acquisition, Identity, Content, Favorites) for development communication. These are hardcoded on and should be removed before production release.

### USDA API error handling
`recipe_logic.py` line ~688 originally used `resp.raise_for_status()` which crashed the entire recipe if any single USDA API call returned a 500. Now uses a graceful check: `if not resp.ok: return None, f"USDA API error (HTTP {resp.status_code})"` — individual ingredient failures are marked "not found" while the rest of the recipe processes normally.

### Parallel fetch
Both `/api/cook` and `/api/calculate` fire simultaneously in `handleAnalyze()`. Each has independent loading state (`cookLoading`, `nutritionLoading`). The displayed spinner is derived from the current mode: `const loading = mode === 'cook' ? cookLoading : nutritionLoading`. Clearing a previous URL's data happens before both fetches start.

### Deleted files
- `recipe_calculator.py` — Original 1397-line desktop app (customtkinter GUI). Deleted as it's unused by the React app. The backend logic lives in `api/recipe_logic.py`.
- `src/components/UrlInput.jsx` — Replaced by `AcquisitionCard.jsx`
- `src/components/ScaleSelector.jsx` — Absorbed into `RecipeSummary.jsx`

## Recipe Scraping Pipeline

Both endpoints share a **three-tier scraping fallback**:

1. **`recipe-scrapers` library** (supported mode) — uses JSON-LD / Recipe schema. Works for allrecipes.com and most structured recipe sites.
2. **`recipe-scrapers` generic mode** (`supported_only=False`) — reads JSON-LD / microdata from any site.
3. **`_fallback_scrape_html()`** in `recipe_logic.py` — plain HTML extraction for sites with no structured data (e.g., Smitten Kitchen). Extracts:
   - **Title** from `<title>` tag (strips site name suffixes) or `<h1>`/`<h2>`
   - **Ingredients** from `<li>` elements matching ingredient patterns, or `<br>`-separated `<p>` tags
   - **Instructions** from `<ol>` lists, or `<p>` tags matching imperative cooking patterns
   - **Servings** from text matching "N servings/portions"

### Ingredient normalization pipeline (`_normalize_raw_ingredient()`)
Applied before the NLP parser sees the string:
1. Smart quotes → plain apostrophes
2. Broken hyphens from HTML line-breaks: `sodium- free` → `sodium-free`
3. Parenthetical conversion notes stripped: `4 ounces (115 grams or 3/4 cup)` → `4 ounces`
4. Unit typo normalization: `lb's` → `lbs`, `tblsp` → `tbsp`
5. Container multiplication: `1 x 400g can` → `400g`

### Ingredient name cleaning (`_clean_ingredient_name()`)
Applied before USDA lookup:
- Strips "or"/"for" clauses: `butter or margarine` → `butter`
- Removes recipe adjectives: fresh, melted, softened, chopped, diced, etc.
- Removes dietary labels: low-sodium, sodium-free, organic, boneless, skinless, etc.
- Collapses whitespace

### Fallback instruction extraction
Comment sections (`#comments`, `.comments-area`, etc.) are **decomposed from the DOM** before instruction scanning. Instructions are scoped to `.entry-content` or `.post-content` when available. Two strategies:
- **Step prefix patterns**: `"Make lids:"`, `"Assemble:"`, `"For the crust:"` — accepted as instructions directly
- **Imperative verb start**: paragraphs starting with cooking verbs (heat, preheat, combine, etc.) or temporal connectors (once, when, after, meanwhile)

### Built-in lookup tables (`recipe_logic.py`)
- **`DENSITY_G_PER_CUP`** (~117 entries) — volume-to-weight conversion for common cooking ingredients
- **`WEIGHT_PER_ITEM`** (~46 entries) — per-item weights for countable ingredients (eggs, onions, etc.) with size variants
- **`KNOWN_KCAL_PER_100G`** (~125 entries) — pre-computed calories to avoid USDA API mismatches. Includes pancetta, swiss chard, white beans, puff pastry, broths, and a generic "broth" fallback (5 kcal/100g)

## What Works

- **Cook mode**: scraping ingredients + instructions from allrecipes.com and Smitten Kitchen (via HTML fallback)
- **Nutrition mode**: full ingredient parsing, unit conversion, USDA calorie lookup
- **Parallel fetch** — both `/api/cook` and `/api/calculate` fire simultaneously on Analyze; switching modes is instant if data is cached, or shows loading if still in progress
- **Recipe scaling** (Nutrition mode) — servings scale with multiplier, per-serving kcal stays fixed (calorie density doesn't change with batch size)
- **Inline parenthetical stripping** — conversion notes like `(115 grams or 3/4 cup)` are removed before parsing
- **Broken hyphen normalization** — `sodium- free` → `sodium-free` before parsing
- **Comment filtering** — blog comments removed from DOM before instruction extraction
- Cook/Nutrition mode toggle with Cook as default
- Checkable ingredient list in Cook mode
- Favorites toggle button (state only, no persistence)
- Debug toggle in AppBar with copy-to-clipboard button on debug output
- **Graceful USDA error handling** — individual ingredient USDA API failures marked "not found" instead of crashing the entire recipe
- MUI dark theme with mobile-first layout
- PWA manifest and service worker
- Deployed and live on Vercel free tier

## Testing

A `/testrecipe` skill is available in Claude Code to test any recipe URL against both live endpoints. Usage:
```
/testrecipe <url>
```
It checks for known issues (smart quotes, parse failures, USDA mismatches, missing fields) and reports a summary table.

### Tested Sites
- **allrecipes.com** — works via `recipe-scrapers` (tier 1). Cook + Nutrition both pass.
- **smittenkitchen.com** — works via HTML fallback (tier 3). Nutrition mode: all 10 ingredients `status: "ok"`, total kcal reasonable (~2,376). Cook mode: 6 instruction steps extracted correctly.

### Known Remaining Issues (Smitten Kitchen)
- **Some SK recipes still fail instruction extraction** — the regex-based approach struggles with SK's inconsistent formatting between posts. Not all recipes use "Make X:" prefixes or start paragraphs with cooking verbs.
- **Missing ingredients** — SK embeds some ingredients in sub-sections (e.g., separate dough and filling ingredient lists). The `<br>`-separated `<p>` scanner only captures the largest block.
- **White beans volume conversion** — uses water density fallback (912g for 2 cups). Real cooked beans are ~184g/cup. Needs a density table entry.
- **`servings` null** — SK doesn't include structured serving counts.
- **Raw string artifacts in Cook mode** — `all- purpose`, `sodium- free` appear in raw ingredient strings. Normalization only runs in the Nutrition pipeline, not on Cook mode's raw output.

## Deployment

```bash
# From RecipeApp_React/
vercel --prod --yes          # Deploy to production
vercel env ls                # Check env vars
vercel env pull              # Pull env vars for local use
```

GitHub CLI (`gh`) and Vercel CLI (`vercel`) are both installed globally.

## Next Steps

### Immediate (next session)
1. **Fix instruction extraction for more SK recipes** — this SK recipe fails to extract prep steps: https://smittenkitchen.com/2016/09/homemade-merguez-with-herby-yogurt/. Options:
   - Extend regex patterns for SK's formatting variations
   - **Claude API fallback** (under consideration) — use Claude to extract structured recipe data from raw HTML as a third-tier fallback when regex fails. Tradeoffs: accurate but adds cost, latency, and another API dependency
2. **Add density table entry for white beans** — fix the 2x overcounting from water density fallback

### Near-term
1. ~~**Fix Nutrition mode scaling**~~ — ✅ Done.
2. ~~**Fix ingredient parsing for non-standard sites**~~ — ✅ Done (parenthetical stripping, hyphen normalization, dietary adjective cleaning).
3. **Error recovery UX** — retry button on failed requests without re-pasting the URL; clear/reset button to start fresh
4. **Checkable preparation steps in Cook mode** — tap to check off/strikethrough steps like the ingredient list
5. **Screen Wake Lock for Cook mode** — use Screen Wake Lock API to keep screen on while cooking, toggle in AppBar or Identity card
6. **Ingredient scaling in Cook mode** — scale selector for ingredient quantities (double/halve a recipe while cooking)
7. **Unit conversion toggle** — metric/imperial switch for ingredient quantities
8. **Wire up Favorites persistence** — localStorage or backend storage, connect to FavoritesView
9. **Test on more recipe sites** — verify both Cook and Nutrition modes work across sites
10. **Replace placeholder PWA icons** — current ones are simple red circles on dark blue
11. **Fix vercel dev** — or document a local dev workflow that works
12. **Normalize raw ingredient strings in Cook mode** — apply broken-hyphen fix to Cook mode output too

### Future
1. **Visual polish** — typography, spacing, transitions, empty states — beyond MUI defaults
2. **Selectable color themes + light/dark mode** — user-choosable theme palettes with light/dark toggle
3. **Offline recipe cache** — save analyzed recipes to localStorage for viewing without network (crucial for kitchens with spotty wifi)
4. **Recipe history** — auto-remember recently analyzed URLs
5. **Share recipe** — Web Share API to send a recipe to someone from mobile
6. **Print-friendly view** — clean layout for printing ingredient list + prep steps
7. **React Router** — replace state-based view switching with proper URL routing
8. **Desktop-specific layouts** — current layout is mobile-first only
9. **Remove DevLabel badges and debug toggle** — before production release
10. **Connect Vercel to GitHub** — enable auto-deploy on push
11. **Custom domain**
12. **Vercel function timeout** — 10s on free tier; Nutrition mode with many ingredients may be slow
13. **Camera recipe capture** — use phone camera + Claude API vision to extract recipe data from photos of cookbooks/recipe cards
14. **Android APK** — convert to native app via TWA (thin wrapper, easy) or Capacitor (native APIs, more effort). No changes needed now — current React code reuses in both paths
