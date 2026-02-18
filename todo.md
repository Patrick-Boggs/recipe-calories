# RecipeApp_React — Todo

## Completed
- ~~**Fix instruction extraction for more SK recipes**~~ — Changed fallback trigger from `and` to `or` in cook.py so HTML fallback fires when instructions are missing even if ingredients were found by tier 2.
- ~~**Add density table entry for white beans**~~ — Added white beans (184), cannellini beans (184), black beans (172), kidney beans (177), pinto beans (171), chickpeas (164), lentils (198) to `DENSITY_G_PER_CUP`.
- ~~**Handle sites returning 500 with valid HTML**~~ — cloudscraper retry on 403/500, accept 500 responses with >1000 chars of content (e.g., cleobuttera.com).
- ~~**Graceful blocked-site error message**~~ — Backend catches `HTTPError` and returns `{"blocked": true}`. Frontend shows amber warning: "This website blocked our request. Please try a different URL."

## Near-term
1. **Error recovery UX** — retry button on failed requests without re-pasting URL; clear/reset button
2. **Checkable preparation steps in Cook mode** — tap to strikethrough steps like ingredients
3. **Screen Wake Lock for Cook mode** — keep screen on while cooking, toggle in AppBar or Identity card
4. **Ingredient scaling in Cook mode** — scale selector for quantities (double/halve while cooking)
5. **Unit conversion toggle** — metric/imperial switch for ingredient quantities
6. **Wire up Favorites persistence** — localStorage or backend storage, connect to FavoritesView
7. **Test on more recipe sites** — verify Cook + Nutrition across sites
8. **Replace placeholder PWA icons** — current ones are red circles on dark blue
9. **Fix vercel dev** — or document a local dev workflow that works
10. **Normalize raw ingredient strings in Cook mode** — apply broken-hyphen fix to Cook mode output
11. **Create `/update` custom skill** — skill that updates CLAUDE.md and todo.md with session context, so it can be run before `/clear`

## Future
12. **Visual polish** — typography, spacing, transitions, empty states
13. **Selectable color themes + light/dark mode**
14. **Offline recipe cache** — localStorage for viewing without network
15. **Recipe history** — auto-remember recently analyzed URLs
16. **Share recipe** — Web Share API for mobile
17. **Print-friendly view** — clean layout for printing ingredients + steps
18. **React Router** — replace state-based view switching with URL routing
19. **Desktop-specific layouts** — current layout is mobile-first only
20. **Remove DevLabel badges and debug toggle** — before production release
21. **Connect Vercel to GitHub** — auto-deploy on push
22. **Custom domain**
23. **Camera recipe capture** — Claude Vision API to extract recipes from photos
24. **Android APK** — TWA (thin wrapper) or Capacitor (native APIs)
