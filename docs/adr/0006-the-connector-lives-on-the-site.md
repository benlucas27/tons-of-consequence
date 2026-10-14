---
status: accepted (supersedes ADR-0003)
---

# The Claude connector is served by the site, and the plugin just points at it

ADR-0003 made the plugin self-contained: its own copy of the data and a duplicated port of the scoring model. The
reason was real at the time (the alternative meant exposing database credentials or building a public API in front
of Supabase), and so were its two stated costs: the data goes stale, and the scoring can drift from the site. Both
costs happened. By October 2026 the plugin's presets no longer matched the site's, and it knew nothing of the
Australian bonus.

The reason has gone. There is no database any more (ADR-0004): the data is in the repo and a deploy publishes it.
So a public, read-only endpoint exposes nothing that isn't already on the website.

Decided:

- The site serves a connector at `/mcp` (`src/app/mcp/route.js`, tools in `src/lib/mcp.js`) using the same dataset,
  scoring and question engine as the pages. It is stateless, read-only and needs no sign-in.
- Anything with a Claude account can use it by URL (the Claude app and claude.ai as a custom connector; Claude Code
  with `claude mcp add`). The `/connect` page explains how.
- The Claude Code plugin is a thin wrapper: its `plugin.json` declares the remote server, and a short skill tells
  Claude when and how to use it. The old local server and data export were deleted.
- The monthly data refresh reaches Claude automatically, because it is the same deploy.

**Consequences**: the plugin and the site can no longer disagree. The cost is that the connector depends on the site
being up and its address staying stable: the Vercel address must keep working after a custom domain is added (it
does), and `SITE_URL` in `src/lib/site.js` is the one place to change if the canonical address moves. Anyone can call
the endpoint, so keep every tool read-only and bounded (result limits are enforced), and watch Vercel usage.
