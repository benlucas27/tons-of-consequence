# Tons of Consequence

The unofficial ranking of every Test cricket century, scored by a weighted model across six
criteria (Match Impact, Clutchness, Narrative, Conditions & Opposition, Historical Weight,
Perceived Greatness). Readers put the six in order of importance; every innings is re-ranked
their way.

Live at [tonsofconsequence.com](https://tonsofconsequence.com).

## How it's built

Next.js 14 (app router), deployed on Vercel from `main`. There is no database: the data lives in
the repo and a deploy publishes it.

- `src/data/sample.js` is the dataset, one row per innings (4,600+). The original rows came from
  public cricket records; newer rows come from Cricsheet or are written by hand.
- `src/data/player-names.js` maps the dataset's initials-style names ("JE Root") to the names
  fans use ("Joe Root"). Add a player there and all their innings update.
- `src/lib/scoring.js` is the scoring model. A weighting is an *order* of the six criteria
  (30, 22, 18, 14, 10, 6 percent), which is why it fits in a link (`?o=na,hi,mi,...`). The five presets
  (Default, Purist, Analyst, Patriot, Romantic) live there too. The Patriot is the Default order plus the
  Australian bonus (+5 for any Australian innings, +3 more for 1989 to 2007), carried in links as
  `&bonus=au` and always shown on screen. A test keeps every pair of presets clearly different.
- `src/lib/dataset.js` prepares the data: display names, permalinks, rankings, filters.
- `src/lib/ask.js` answers plain-English questions ("who has the better hundred, Ponting or Smith?",
  "best centuries by India since 2010") with no server or AI service: a small parser turns the question
  into a comparison or a filtered ranking and always reports how it understood it.
- `src/lib/ball.js` draws the cricket-ball mark once, for the header, favicon and share images.
- Pages: `/` rankings (and the front door for first-time readers), `/search` ask a question by typing or
  speaking (the browser's own speech recognition; the microphone hides itself where unsupported),
  `/compare` pick any two innings for a verdict, or switch to Career presets to compare whole careers (The Big Four to start), `/innings/<id>-<name>-<runs>-<year>` one innings with its
  own link and social preview image, `/quiz` the Pub Test (eight questions, four answers each, one per persona; each persona hands you into a
  preset), `/about`. When the weighting is not Default, rows show ▲ and ▼ for how far each innings has
  moved from its Default rank.

### Featuring an innings

The "Latest century" card shows the row with `featured: true` (at most one; a test enforces it).
Its `spotlight` field holds the card text. An innings that is still being played carries
`matchResult: "live"`, shown as "In progress".

### Career comparisons

`src/data/compare-sets.js` lists the preset career comparisons on the Compare page (so far The Big Four: Smith,
Kohli, Root, Williamson). The dataset holds only centuries, so the figures that need every innings (average, strike
rate, fifties, how often a fifty becomes a hundred) are worked out from Cricsheet's ball-by-ball archive by
`node scripts/build-careers.mjs` and saved to `src/data/careers.js`. The script refuses to save if a player's
hundreds in the archive disagree with the centuries in the dataset, and the monthly update re-runs it. To add a
comparison, add an entry (players are matched by name and team code, and by their Cricsheet ID) and run the script.

### Videos

`src/data/videos.js` links an innings to a video, keyed by innings id. Each link was checked against YouTube
(it exists; whether the uploader allows embedding). `kind` is `innings` (about this innings) or `match`
(highlights of the whole Test). The player is click-to-play and uses the no-cookie embed, so nothing from
YouTube loads until a reader presses play; a video that cannot be embedded links out instead. The top 50
innings were done first, and no innings gets a video unless one was found and checked. Many from before the
1950s have no footage. Check for dead links with `node scripts/check-videos.mjs`.

### Share cards and the ToCs leaderboard (added 20 Oct 2026)
- `/card/compare?a=ID&b=ID[&o=..&bonus=au]`, `/card/batter/<slug>` and `/card/leaders?sort=tons|share|peak|wins&min=8` return designed PNG cards (`format=portrait` 1080x1350 by default, `format=wide` 1200x630 for link previews, `download=1` to save). Shared look in `src/lib/cards.js`; the Share buttons are `src/components/CardButtons.js` (shares the image itself where the phone allows it). `/compare?a=&b=` and batter pages set these as their link-preview image.
- The ToCs page lists every batter (`src/components/TocBoard.js`, rows from `src/lib/batterBoard.js`, sorting in `src/lib/boardSort.js`), shows the latest hundreds, and each batter page says why a hundred is not measured (`notMeasuredReason` in `src/lib/consequence.js`).
- `docs/drafts/season-update.yml` is a draft daily workflow (Oct to Mar) that is NOT switched on: move it to `.github/workflows/` when Ben agrees. `docs/MOBILE-APP-SCOPE.md` scopes a mobile app.

## Keeping the data up to date

New centuries come from [Cricsheet](https://cricsheet.org)'s open ball-by-ball data.

- **Automatically:** `.github/workflows/monthly-update.yml` runs on the 2nd of each month, adds new
  centuries, settles any finished "live" matches, runs the tests and the build, and commits the
  result. A deploy follows. It can also be run by hand from the GitHub Actions tab.
- **By hand:**
  ```
  node scripts/add-new-centuries.mjs            # preview
  node scripts/add-new-centuries.mjs --write    # add them
  ```
- Cricsheet publishes a match a few days after it finishes, so a very recent innings (like one from
  a Test still under way) has to be added by hand, with its match notes checked against reports.
- `scripts/backfill-results.mjs` fills in match results for older rows where Cricsheet can match them.

- **Monthly cleanup:** the same workflow compares the dataset with the ball-by-ball archive
  (`scripts/audit-archive.mjs`) and files or refreshes one GitHub issue labelled `data-audit` listing what needs a
  person: names spelled differently in the two sources, centuries that look missing, and match results that disagree.
  It closes the issue when the list is empty. It never blocks the update. A scheduled Claude task works through the issue
  on a branch each month (it never pushes). Cricsheet withholds Afghanistan men's Tests by policy, so new Afghan
  centuries have to be added by hand. See `docs/drafts/data-cleanup.md`.

**A refresh only ever covers new games.** It looks back over the last couple of months, adds
centuries from games the site does not have yet, and settles the result of any game that was still
being played. It never reworks historical innings. (`add-new-centuries.mjs` refuses a start date
before the original data ends.) Cleaning up older rows, such as `backfill-results.mjs`, is a
separate one-off job and is not part of a refresh.

New rows get automatic estimates for the six criteria (`src/lib/heuristics.js`). They are
placeholders until someone scores them properly.

## Development

```
npm install
npm run dev
npm test        # scoring, links, and data integrity (duplicates, ranges, names)
npm run lint
```

## Claude connector and plugin

The site serves a read-only connector for Claude at `/mcp` (tools in `src/lib/mcp.js`, route in
`src/app/mcp/route.js`), built on the same data, scoring and question engine as the pages. Anyone with a
Claude account can add it by URL; the `/connect` page has the steps. The Claude Code plugin in
[`claude-plugin/`](./claude-plugin) is a thin wrapper that points at it. This repo is also its own plugin
marketplace (`.claude-plugin/marketplace.json`):

```
/plugin marketplace add benlucas27/tons-of-consequence
/plugin install tons-of-consequence@tons-of-consequence-marketplace
```

Check a running copy with `node scripts/test-mcp.mjs [url]`. See [`claude-plugin/README.md`](./claude-plugin/README.md)
and ADR-0006.

## Decisions

Architecture decisions are recorded in [`docs/adr/`](./docs/adr), and the project's vocabulary in
[`CONTEXT.md`](./CONTEXT.md).

## Known follow-ups

- No custom domain yet (`tonsofconsequence.com` was never connected in Vercel).
- Next.js is on the last 14.2 patch. A move to a newer major version is worth doing deliberately.
- Vercel still holds three unused environment variables (`CRON_SECRET` and the two `NEXT_PUBLIC_SUPABASE_*`
  ones) from the retired database setup. They can be deleted.
- Full names cover the 294 most prolific players. Others still show initials.
