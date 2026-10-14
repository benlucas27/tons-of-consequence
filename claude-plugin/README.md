# Tons of Consequence: Claude plugin

Ask Claude about every Test cricket century and have it answer from the [Tons of Consequence](https://tons-of-consequence.vercel.app) ranking, on your own weighting.

This plugin is a thin wrapper. It adds the site's live, read-only connector (`https://tons-of-consequence.vercel.app/mcp`) and a short guide that tells Claude when and how to use it. The scoring and the data live on the site, so the plugin is always current and can never disagree with the website.

## Install (Claude Code)

```
/plugin marketplace add benlucas27/tons-of-consequence
/plugin install tons-of-consequence@tons-of-consequence-marketplace
```

Or add just the connector:

```
claude mcp add --transport http tons-of-consequence https://tons-of-consequence.vercel.app/mcp
```

## Not using Claude Code?

The same connector works in the Claude app and on claude.ai (Free, Pro, Max, Team and Enterprise). Instructions are at [tons-of-consequence.vercel.app/connect](https://tons-of-consequence.vercel.app/connect).

## Try it

- "Who has the better Test hundred, Ricky Ponting or Steve Smith?"
- "Rank the top 10 as a Romantic would, then as an Analyst. What changed?"
- "Show me the most clutch centuries by Indian batters since 2010."

## Tools

| Tool | What it does |
|---|---|
| `ask` | Answers a plain-English question and says how it understood it |
| `rank_centuries` | Ranks innings under a preset or your own order, with filters |
| `get_century` | One innings in full: story, scores, rank under every preset, video |
| `compare_centuries` | Head to head, with a verdict and whether it holds under every preset |
| `most_divisive` | The innings people disagree about most |
| `list_options` | How the model works: criteria, presets, the Australian bonus |

All of them only read. They can't change a score, the data or the site.

## For maintainers

The connector's code is in the repo, not here: `src/lib/mcp.js` (the tools) and `src/app/mcp/route.js` (the address). Its tests are `tests/mcp.test.mjs`. `node scripts/test-mcp.mjs [url]` checks a running copy, local or live. See `docs/adr/0006-the-connector-lives-on-the-site.md`.
