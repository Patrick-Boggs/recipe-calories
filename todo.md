# RecipeApp_React — Todo

## Immediate
1. **Fix instruction extraction for more SK recipes** — e.g., https://smittenkitchen.com/2016/09/homemade-merguez-with-herby-yogurt/ fails. Options: extend regex patterns, or Claude API fallback (accurate but adds cost/latency/dependency).
2. **Add density table entry for white beans** — fix 2x overcounting from water density fallback (~184g/cup for cooked beans).

## Near-term
3. **Error recovery UX** — retry button on failed requests without re-pasting URL; clear/reset button
4. **Checkable preparation steps in Cook mode** — tap to strikethrough steps like ingredients
5. **Screen Wake Lock for Cook mode** — keep screen on while cooking, toggle in AppBar or Identity card
6. **Ingredient scaling in Cook mode** — scale selector for quantities (double/halve while cooking)
7. **Unit conversion toggle** — metric/imperial switch for ingredient quantities
8. **Wire up Favorites persistence** — localStorage or backend storage, connect to FavoritesView
9. **Test on more recipe sites** — verify Cook + Nutrition across sites
10. **Replace placeholder PWA icons** — current ones are red circles on dark blue
11. **Fix vercel dev** — or document a local dev workflow that works
12. **Normalize raw ingredient strings in Cook mode** — apply broken-hyphen fix to Cook mode output
13. **Create `/update` custom skill** — skill that updates CLAUDE.md and todo.md with session context, so it can be run before `/clear`

## Future
13. **Visual polish** — typography, spacing, transitions, empty states
14. **Selectable color themes + light/dark mode**
15. **Offline recipe cache** — localStorage for viewing without network
16. **Recipe history** — auto-remember recently analyzed URLs
17. **Share recipe** — Web Share API for mobile
18. **Print-friendly view** — clean layout for printing ingredients + steps
19. **React Router** — replace state-based view switching with URL routing
20. **Desktop-specific layouts** — current layout is mobile-first only
21. **Remove DevLabel badges and debug toggle** — before production release
22. **Connect Vercel to GitHub** — auto-deploy on push
23. **Custom domain**
24. **Camera recipe capture** — Claude Vision API to extract recipes from photos
25. **Android APK** — TWA (thin wrapper) or Capacitor (native APIs)
