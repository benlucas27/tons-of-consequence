# Tons of Consequence iPhone app: plan (21 Oct 2026)

Branch `mobile-app`. Nothing here touches the live site's pages, scoring or verdict totals.

## 1. Layout (one repo, no big refactor)

```
toc-work/
  src/ ...            the website, unchanged (Vercel keeps building it)
  mobile/             NEW: the Expo / React Native app (its own package.json)
    metro.config.js   lets the app import the site's pure code straight from ../src/lib
    app/ components/  native screens (expo-router)
    shims/            "data doors": where the app gets its data from (see 3)
  src/app/api/feed/   NEW: the data feed (the only change to the site)
  scripts/            + notify-new-tons.mjs (push, stage 5)
```

**Why not a shared package / npm workspace?** `src/lib` is already plain JavaScript with relative imports and no
website-only code in the rule files (scoring, consequence, consequenceModel, boardSort, batterBoard, ask, records,
volatility, matchFacts). The app can import those files exactly where they are, so the rules live in ONE place with
no moving of files and no change to site behaviour. A workspace would mean moving files and changing the site's
install on Vercel, which is risk for no gain. (If a file turns out to need a website-only import, I split that one
file; I will list each such change for you.)

Not shared (rewritten natively): pages, CSS, the PNG share cards (the app shares the site's `/card/...` images).

## 2. The data feed (stage b)

`GET /api/feed` returns one versioned JSON file: `{ schema: 1, version, generatedAt, counts, data: { ... } }` where
`data` holds the same data files the site uses (innings, verdicts, facts, sources, names, women's, Hello Cricket).
- Built at deploy time (static, served from Vercel's CDN, gzip/brotli: about 0.4 MB over the wire for 3.3 MB raw).
- `GET /api/feed/version` is a tiny file with only the version, so the app checks cheaply and downloads only when new.
- `schema` number lets old app versions keep working: I only ever add fields; a breaking change bumps `schema` and
  the app shows "please update".
- The daily season update rebuilds the site anyway, so the feed updates itself with no extra step.

## 3. How the app reuses the rules and still gets fresh data

The shared code imports data files directly (`../data/sample.js`). In the app, Metro (the bundler) redirects those
imports to "data doors" that read the feed. Launch order: load cached feed from the phone (instant, works offline),
then check `/api/feed/version` in the background, download if newer, show it from the next open (or pull-to-refresh).
A copy of the feed from build day is bundled in the app so the very first launch works with no signal.
Result: same code as the site, verdict updates arrive without App Store review.

## 4. Native screens (stages c and d)
Rankings (presets, filters), ToCs leaderboard (search + 4 sorts), batter page (every hundred + "Not measured: why"),
innings page, Compare (innings and career presets), Ask the rankings, Pub Test, Women's Tests, Hello Cricket moments,
About / the 13 laws, Share (native share sheet with the site's PNG cards). Look: dark green #0b1c13, ball logo,
Barlow Condensed / Barlow / Newsreader. This is real native navigation (tabs, gestures, offline, haptics, push), so it is not a "website in a frame".

## 5. Push notifications (stage e): recommendation = OneSignal (free tier)
Because the old database is gone, OneSignal keeps the list of phones for us. The daily GitHub workflow compares
today's ToC list with yesterday's; if a NEW ToC appears it calls OneSignal's send API ("New ToC: Matt Renshaw 190 v SA").
- Ben creates: a free OneSignal account, an Apple APNs key (.p8, from his Apple Developer account), and puts
  OneSignal's app ID + API key into GitHub secrets himself. I never see or handle keys; I write exact click-by-click steps.
- Alternative (Expo push) would need us to store every phone's token somewhere (a new database). OneSignal avoids that.
- Cost: US$0 at this size. Privacy page and App Store privacy answers must mention it (OneSignal device ID).
- Needs a real build (not Expo Go) from EAS.

## 6. Builds and release (stage f), no Xcode, no simulator
- Early testing: **Expo Go** on Ben's iPhone (scan a QR code from my dev server on his Mac) for stages c and d.
- Push, App Store: **EAS cloud builds** -> TestFlight on his iPhone -> EAS Submit -> App Store review.
- Ben signs in himself to Expo (free account), Apple Developer and App Store Connect. EAS will ask him for Apple
  sign-in in his own terminal/browser; I never type or store passwords.

## 7. Decisions I need from you (see the message)
1. OK with `mobile/` inside the same repo (recommended) rather than a new repo.
2. App ID (permanent after first upload): suggest `xyz.haveaplan.tonsofconsequence`.
3. Push: OneSignal (recommended) or Expo push + a new database.

## 8. Timeline (matches the 3 to 5 weeks)
Week 1: feed + skeleton in Expo Go. Week 2: all screens. Week 3: push + TestFlight. Week 4: App Store paperwork,
fixes from his testing, submit. Week 5: review buffer.

## 9. Risks
- Apple 4.2 (thin wrapper): mitigated by native screens, offline, share sheet and push.
- App Store review needs a privacy policy URL (`/privacy`, to be updated for OneSignal) and a support email (ben@haveaplan.xyz).
- Another session is changing verdict totals on branch `unmeasured-research`; the feed simply reflects whatever is on main.
- `eas-cli` on this Mac is 18.0.5 (old); I will use `npx eas-cli@latest` so nothing global changes. Expo CLI global is the legacy one; the app uses the local one.
