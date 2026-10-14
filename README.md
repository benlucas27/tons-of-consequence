# Tons of Consequence

The unofficial ranking of every Test cricket century, scored by a weighted model across six
criteria (Match Impact, Clutchness, Narrative, Conditions & Opposition, Historical Weight,
Perceived Greatness). Readers put the six in order of importance; every innings is re-ranked
their way.

Live at [tons-of-consequence.vercel.app](https://tons-of-consequence.vercel.app).

## How it's built

Next.js 14 (app router), deployed on Vercel from `main`. There is no database: the data lives in
the repo and a deploy publishes it.

- `src/data/sample.js` is the dataset, one row per innings (4,600+). The original rows came from
  ESPNcricinfo Statsguru; newer rows come from Cricsheet or are written by hand.
- `src/data/player-names.js` maps the dataset's initials-style names ("JE Root") to the names
  fans use ("Joe Root"). Add a player there and all their innings update.
- `src/lib/scoring.js` is the scoring model. A weighting is an *order* of the six criteria
  (30, 22, 18, 14, 10, 6 percent), which is why it fits in a link (`?o=na,hi,mi,...`).
- `src/lib/dataset.js` prepares the data: display names, permalinks, rankings, filters.
- `src/lib/ask.js` answers plain-English questions ("who has the better hundred, Ponting or Smith?",
  "best centuries by India since 2010") with no server or AI service: a small parser turns the question
  into a comparison or a filtered ranking and always reports how it understood it.
- `src/lib/ball.js` draws the cricket-ball mark once, for the header, favicon and share images.
- Pages: `/` rankings (and the front door for first-time readers), `/search` ask a question by typing or
  speaking (the browser's own speech recognition; the microphone hides itself where unsupported),
  `/compare` pick any two innings for a verdict, `/innings/<id>-<name>-<runs>-<year>` one innings with its
  own link and social preview image, `/quiz` the Pub Test, `/about`.

### Featuring an innings

The "Latest century" card shows the row with `featured: true` (at most one; a test enforces it).
Its `spotlight` field holds the card text. An innings that is still being played carries
`matchResult: "live"`, shown as "In progress".

### Videos

`src/data/videos.js` links an innings to a video, keyed by innings id. Each link was checked against YouTube
(it exists; whether the uploader allows embedding). `kind` is `innings` (about this innings) or `match`
(highlights of the whole Test). The player is click-to-play and uses the no-cookie embed, so nothing from
YouTube loads until a reader presses play; a video that cannot be embedded links out instead. The top 50
innings were done first, and no innings gets a video unless one was found and checked. Many from before the
1950s have no footage. Check for dead links with `node scripts/check-videos.mjs`.

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
- `scripts/export-plugin-data.mjs` refreshes the Claude plugin's bundled copy of the data.

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

## The Claude plugin

[`claude-plugin/`](./claude-plugin) is a self-contained Claude Code plugin with its own copy of the
data and scoring model, exposing tools to rank, compare and explore centuries from chat. This repo
is also its own plugin marketplace (`.claude-plugin/marketplace.json`):

```
/plugin marketplace add benlucas27/tons-of-consequence
/plugin install tons-of-consequence@tons-of-consequence-marketplace
```

See [`claude-plugin/README.md`](./claude-plugin/README.md).

## Decisions

Architecture decisions are recorded in [`docs/adr/`](./docs/adr), and the project's vocabulary in
[`CONTEXT.md`](./CONTEXT.md).

## Known follow-ups

- No custom domain yet (`tonsofconsequence.com` was never connected in Vercel).
- Next.js is on the last 14.2 patch. A move to a newer major version is worth doing deliberately.
- Vercel still holds three unused environment variables (`CRON_SECRET` and the two `NEXT_PUBLIC_SUPABASE_*`
  ones) from the retired database setup. They can be deleted.
- Full names cover the 294 most prolific players. Others still show initials.
