# Tons of Consequence mobile app: scope (written 20 Oct 2026)

The boys said "it's not a mobile app yet". This is what it would take. Nothing here is built.

## What the site already gives a phone user
Responsive pages, search (typed or voice), Compare with shareable links, designed share cards (PNG, made for phones), the Claude connector. The data (about 2 MB, 270 KB compressed) and the scoring are plain JavaScript, so they can run inside an app with no server.

## Three routes, cheapest first

| | What it is | Effort (estimate) | Store listing | Cost |
|---|---|---|---|---|
| **A. Installable web app (PWA)** | The site with an icon on the home screen, full-screen, works offline once loaded | 1 to 2 days | No (installed from the browser: Share > Add to Home Screen) | Free |
| **B. Wrapped site (Capacitor)** | The live site in a native shell, submitted to the App Store and Google Play | 1 week, plus review time | Yes | Apple US$99 a year, Google US$25 once |
| **C. Real native app (Expo / React Native)** | A new app that reuses the data and scoring code, native screens, offline, push notifications | 4 to 8 weeks | Yes | Same as B |

## Risks to know about
- **Apple can reject route B.** Their rules (guideline 4.2, "minimum functionality") turn away apps that are only a website in a frame. Adding real native features (push notifications for new ToCs, share-sheet cards, offline) helps, but there is no guarantee.
- **Two codebases (route C).** Every change to the rules or pages would have to be made twice, unless the shared logic is moved into a package both use. That is a real refactor of `src/lib`.
- **Maintenance.** Store apps need yearly renewal, OS-update fixes and a privacy declaration. The privacy page already covers anonymous page counts; an app adds its own data-safety forms.
- **Ben does the account steps.** Creating the Apple and Google developer accounts (identity checks and payment) can't be done by Claude.

## What the app would do that the site can't
1. Push notification when a new ToC is added during the summer (needs the season update running, see `docs/drafts/season-update.yml`).
2. Offline use at the ground or on the plane.
3. One-tap share of a card into the group chat (the site already does this on phones that support sharing images).
4. Lock-screen or home-screen widget of a batter's ToC count (route C only).

## Recommendation
1. **Do A now.** A manifest, icons and a small offline cache. It gets an icon on the boys' phones this summer for almost no cost, and it tells us whether anyone uses it.
2. **Decide on B or C after a month of real use.** If people install the PWA and ask for notifications, do C properly. B is only worth it if a store listing matters more than quality.
3. Park NRL. It is a separate product with its own data and rules, not a feature of this app.

## Decisions for Ben
- Do you want route A built now? (Recommended.)
- If a store app is wanted: route B (fast, some rejection risk) or C (slow, proper)?
- Are you happy to create and pay for the Apple and Google developer accounts when we get there?
