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

### Cook Mode (default)
- Calls `POST /api/cook` — scrapes title, ingredients, instructions, timing
- **No USDA lookup** — fast response
- Ingredients shown as checkable list (tap to strikethrough)
- Preparation steps shown as numbered cards

### Nutrition Mode
- Calls `POST /api/calculate` — full ingredient parsing + USDA calorie lookup
- Shows calorie breakdown per ingredient with status dots (ok/skipped/not found)
- Recipe scaling (½x, 1x, 2x, 3x, 4x) — frontend-only multiplication

## Key Decisions & Gotchas

### Import path
`calculate.py` uses `from api.recipe_logic import calculate_recipe` — Vercel runs from the project root, not from inside `api/`.

### NLTK data bundling
`ingredient-parser-nlp` requires NLTK's `averaged_perceptron_tagger_eng` data. Vercel's filesystem is **read-only**, so NLTK can't download it at runtime. The data is pre-downloaded and committed in `api/nltk_data/`. `calculate.py` sets `NLTK_DATA` env var to that path before importing `recipe_logic`.

### API key
The USDA API key is stored as a Vercel environment variable (`USDA_API_KEY`), set for production, preview, and development. It is **not** in the source code. The key is: `moiGbWOpJ9Qi9Dfgivf83MIFtB87btfVL4DBcBwL`.

### vercel dev issues
`vercel dev` has a known issue with Vite where the SPA catch-all rewrite causes Vite's HMR module requests to be served as `index.html`. The `vercel.json` was stripped to minimal config to mitigate, but local dev with the Python API still doesn't work reliably. **Current workflow: deploy to Vercel and test via the .app URL.**

### Debug toggle
The AppBar has a bug icon that toggles debug details on/off (on by default). When enabled, API errors show HTTP status, request URL, and full response body. This should be removed or defaulted to off before production release.

### DevLabel badges
Yellow badges label each UI region (AppBar, Acquisition, Identity, Content, Favorites) for development communication. These are hardcoded on and should be removed before production release.

### Deleted files
- `recipe_calculator.py` — Original 1397-line desktop app (customtkinter GUI). Deleted as it's unused by the React app. The backend logic lives in `api/recipe_logic.py`.
- `src/components/UrlInput.jsx` — Replaced by `AcquisitionCard.jsx`
- `src/components/ScaleSelector.jsx` — Absorbed into `RecipeSummary.jsx`

## What Works

- **Cook mode**: scraping ingredients + instructions from allrecipes.com
- **Nutrition mode**: full ingredient parsing, unit conversion, USDA calorie lookup
- Recipe scaling (Nutrition mode, frontend-only)
- Cook/Nutrition mode toggle
- Checkable ingredient list in Cook mode
- Favorites toggle button (state only, no persistence)
- Debug toggle in AppBar
- MUI dark theme with mobile-first layout
- PWA manifest and service worker
- Deployed and live on Vercel free tier

## What Hasn't Been Tested Yet

- Other recipe sites beyond allrecipes.com (some may need Cloudflare bypass)
- PWA "Add to Home Screen" install flow on mobile
- Offline behavior (service worker caches app shell, but API calls need network)
- Edge cases: recipes with no servings, no ingredients, no instructions, very long lists
- Cook mode timing display with various time formats from different sites

## Deployment

```bash
# From RecipeApp_React/
vercel --prod --yes          # Deploy to production
vercel env ls                # Check env vars
vercel env pull              # Pull env vars for local use
```

GitHub CLI (`gh`) and Vercel CLI (`vercel`) are both installed globally.

## Next Steps

### Near-term
- **Wire up Favorites persistence** — localStorage or backend storage, connect to FavoritesView
- **Test on more recipe sites** — verify both Cook and Nutrition modes work across sites
- **Replace placeholder PWA icons** — current ones are simple red circles on dark blue
- **Fix Nutrition mode scaling** — scale selector has known issues that need troubleshooting
- **Fix vercel dev** — or document a local dev workflow that works

### Future
- **React Router** — replace state-based view switching with proper URL routing
- **Desktop-specific layouts** — current layout is mobile-first only
- **Visual polish** — beyond MUI defaults
- **Remove DevLabel badges and debug toggle** — before production release
- **Connect Vercel to GitHub** — enable auto-deploy on push
- **Custom domain**
- **Vercel function timeout** — 10s on free tier; Nutrition mode with many ingredients may be slow
