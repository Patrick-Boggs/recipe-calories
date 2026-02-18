# RecipeApp_React — Todo

## Completed
- ~~**Fix instruction extraction for more SK recipes**~~ — Changed fallback trigger from `and` to `or` in cook.py so HTML fallback fires when instructions are missing even if ingredients were found by tier 2.
- ~~**Add density table entry for white beans**~~ — Added white beans (184), cannellini beans (184), black beans (172), kidney beans (177), pinto beans (171), chickpeas (164), lentils (198) to `DENSITY_G_PER_CUP`.
- ~~**Handle sites returning 500 with valid HTML**~~ — cloudscraper retry on 403/500, accept 500 responses with >1000 chars of content (e.g., cleobuttera.com).
- ~~**Graceful blocked-site error message**~~ — Backend catches `HTTPError` and returns `{"blocked": true}`. Frontend shows amber warning: "This website blocked our request. Please try a different URL."
- ~~**Checkable preparation steps in Cook mode**~~ — Tap to strikethrough steps like ingredients. Checkbox + opacity fade + transition in `CookContent.jsx`.
- ~~**Normalize raw ingredient strings in Cook mode**~~ — Imported `_normalize_raw_ingredient` into `cook.py` and applied to all ingredients before returning.

## Near-term
- **Error recovery UX** — retry button on failed requests without re-pasting URL; clear/reset button
- **Screen Wake Lock for Cook mode** — keep screen on while cooking, toggle in AppBar or Identity card
- **Ingredient scaling in Cook mode** — scale selector for quantities (double/halve while cooking)
- **Unit conversion toggle** — metric/imperial switch for ingredient quantities
- **Wire up Favorites persistence** — localStorage or backend storage, connect to FavoritesView
- **Test on more recipe sites** — verify Cook + Nutrition across sites
- **Replace placeholder PWA icons** — current ones are red circles on dark blue
- **Fix vercel dev** — or document a local dev workflow that works
- **Create `/update` custom skill** — skill that updates CLAUDE.md and todo.md with session context, so it can be run before `/clear`

## Future
- **Visual polish** — typography, spacing, transitions, empty states
- **Selectable color themes + light/dark mode**
- **Offline recipe cache** — localStorage for viewing without network
- **Recipe history** — auto-remember recently analyzed URLs
- **Share recipe** — Web Share API for mobile
- **Print-friendly view** — clean layout for printing ingredients + steps
- **React Router** — replace state-based view switching with URL routing
- **Desktop-specific layouts** — current layout is mobile-first only
- **Remove DevLabel badges and debug toggle** — before production release
- **Connect Vercel to GitHub** — auto-deploy on push
- **Custom domain**
- **Camera recipe capture** — Claude Vision API to extract recipes from photos
- **Android APK** — TWA (thin wrapper) or Capacitor (native APIs)
