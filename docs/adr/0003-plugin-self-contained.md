---
status: superseded by ADR-0006
---

# Ship the Claude plugin as fully self-contained, not backed by the live Supabase instance

The plugin's job is to let anyone install it and query the ranking model. Backing it with a live connection to this project's Supabase instance was the more obvious design — always-current data — but it was rejected: it would mean either shipping this project's database credentials inside a publicly distributed plugin, or standing up a public API in front of Supabase purely to serve the plugin, both real infrastructure and security commitments for a v1.

Decided the plugin bundles its own point-in-time export of the dataset (`claude-plugin/mcp-server/data/centuries.json`) and a standalone duplicated port of the scoring model (`claude-plugin/mcp-server/scoring.mjs`, deliberately not imported from `src/lib/`), so it runs entirely locally with no network dependency on this project at all.

**Consequences**: the plugin's dataset silently goes stale relative to the live site and needs a manual re-export; the scoring model can drift from `src/lib/scoring.js` if one is changed without the other. Both are accepted costs of a plugin that anyone can install without trusting it with, or this project with exposing, live credentials.
