# Tons of Consequence — Claude plugin

Query the [Tons of Consequence](https://tons-of-consequence.vercel.app) Test cricket
century ranking model directly from Claude — rank innings with your own weightings,
compare two head-to-head, or find the most divisive centuries in history.

This plugin is fully self-contained: it bundles its own copy of the dataset and the
scoring model, so it works standalone without any connection to the live site or its
database.

## Install

```
/plugin marketplace add benlucas27/tons-of-consequence
/plugin install tons-of-consequence@tons-of-consequence-marketplace
```

(Requires Node.js to be available on your machine — the plugin runs a small local
MCP server over stdio, nothing is sent to any external service.)

## Try it

Once installed, just ask Claude things like:

- "Rank the top 10 Test centuries, weighted heavily toward narrative"
- "What's the most divisive century of all time?"
- "Compare Brian Lara's 153\* against Ben Stokes' 135\* at Headingley"
- "Show me Australia's greatest centuries since 2010, sorted by clutchness"

## Tools

| Tool | What it does |
|---|---|
| `list_options` | Valid countries, eras, lever definitions, and weight presets |
| `rank_centuries` | Rank/filter/search centuries with custom weights or a preset |
| `get_century` | Full detail on one innings — story, levers, divisiveness |
| `compare_centuries` | Head-to-head verdict between 2–3 innings |
| `most_divisive` | Innings whose ranking swings most depending on what you value |

## Local development

```
cd mcp-server
npm install
node test-client.mjs   # exercises every tool against the bundled dataset
```

The dataset (`mcp-server/data/centuries.json`) is a point-in-time export of the site's data. It is
not kept in sync automatically. From the repo root, refresh it with:

```
node scripts/export-plugin-data.mjs
```
