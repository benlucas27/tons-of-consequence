# Tons of Consequence

The definitive ranking of every Test cricket century — scored by a weighted model
across six levers (Match Impact, Clutchness, Narrative, Conditions & Opposition,
Historical Weight, Perceived Greatness) that you control. Set your own weightings,
find your own truth.

Live at [tons-of-consequence.vercel.app](https://tons-of-consequence.vercel.app).

## How it's built

Next.js 14 app router, deployed on Vercel, auto-deploying from `main`.

**Data layers** (this is the part worth understanding before changing anything):

1. `src/data/sample.js` — a static, git-committed baseline of ~4,600 centuries
   scraped from ESPNcricinfo Statsguru. This is what renders instantly on page load.
2. A Supabase `centuries` table — the live/editable layer. The homepage fetches it
   on load and merges it over the static baseline (matched by player/year/runs/
   opponent): edited stories and lever scores from editorial review show up
   automatically, and brand-new centuries get appended. If Supabase is unreachable
   or unconfigured, the site just falls back to the static baseline — this overlay
   is always a soft enhancement, never a hard dependency.
3. `/admin/score` — an internal editorial tool. It queues up any century with
   `score_status` of `heuristic` or `pipeline` (i.e. not yet human-reviewed), shows
   Wikipedia source material, and lets a reviewer set real lever scores and write
   the story text.

**Monthly refresh pipeline** (`src/app/api/cron/refresh-centuries/route.js`,
scheduled in `vercel.json`): pulls newly played Test centuries from
[Cricsheet](https://cricsheet.org)'s open ball-by-ball archive, scores them with a
rough heuristic (`src/lib/heuristics.js`), and inserts them into Supabase with
`score_status: 'pipeline'` — landing them straight in the `/admin/score` queue.
Scoped to a rolling 70-day window no earlier than the static dataset's own
generation date, and deduped by natural key, so it can never collide with or
duplicate the curated historical set.

**One manual step required:** the cron route is protected by a `CRON_SECRET` env
var (Vercel sends it automatically as a bearer token to your own cron jobs) — add
one in Vercel's project settings → Environment Variables. Without it, the endpoint
still works but is unauthenticated.

## Local development

```
npm install
cp .env.local.example .env.local   # fill in Supabase creds, or leave blank
npm run dev
```

Leaving the Supabase env vars blank is fine — the site just runs on the static
dataset only, which is the same graceful-degradation path production uses if
Supabase is ever unreachable.

## The Claude plugin

[`claude-plugin/`](./claude-plugin) is a self-contained Claude Code plugin that
bundles its own copy of the dataset and scoring model, exposing tools to rank,
compare, and explore centuries from chat. This repo also serves as its own plugin
marketplace (`.claude-plugin/marketplace.json`):

```
/plugin marketplace add benlucas27/tons-of-consequence
/plugin install tons-of-consequence@tons-of-consequence-marketplace
```

See [`claude-plugin/README.md`](./claude-plugin/README.md) for details.

## Known follow-ups

- No custom domain is connected yet (`tonsofconsequence.com` was referenced in
  metadata but was never actually added in Vercel) — that's a purchase/DNS decision
  for a human, not something to automate.
- Next.js is pinned to the latest `14.2.x` patch (`14.2.35`) to close a batch of
  CVEs npm audit flagged; a Next 15/16 major upgrade is a good next step but is a
  bigger, breaking change worth doing deliberately rather than unattended.
- The plugin's dataset is a point-in-time export, not live-synced to Supabase.
