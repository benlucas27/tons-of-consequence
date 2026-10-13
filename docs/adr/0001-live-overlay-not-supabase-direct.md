---
status: superseded by ADR-0004
---

# Merge a live Supabase overlay over the static dataset, rather than reading Supabase directly or regenerating the static file in CI

The site's static dataset (`src/data/sample.js`) and its Supabase `centuries` table had drifted apart: the table existed only for editorial review and was never known to be complete or trustworthy as a standalone source. Two more direct options were available — switch the homepage to query Supabase as its only source, or add a build step that regenerates `sample.js` from Supabase — but both assume the table is safe to depend on wholesale, which was never verified.

Decided instead to keep the static dataset as the reader's baseline and merge the live table over it client-side, matched by natural key (player/year/runs/opponent): a row present in Supabase overrides its static counterpart, and a row absent from the static set is appended. If Supabase is empty, misconfigured, or unreachable, the merge is a no-op and the static baseline stands untouched.

**Consequences**: the live overlay can never make the site worse than the static baseline alone, at the cost of the site depending on two data sources instead of one. Revisit this once the Supabase table's contents and write path are fully trusted — at that point a single source of truth (most likely Supabase, feeding a build-time regeneration of the static file as a CDN-fast fallback) is the more honest architecture.

**Update (Oct 2026)**: a live row now replaces its static counterpart only when a human has reviewed it (`score_status` of `editorial`). Machine-generated (`heuristic` / `pipeline`) rows never overwrite a static entry, so hand-written static entries, such as the Matt Renshaw 190, can't be clobbered by an automatic refresh. New live rows with no static match are still appended.

**Update (13 Oct 2026)**: the Supabase project no longer exists (its address returns NXDOMAIN), so the overlay silently does nothing and the October automatic run had nowhere to write. The site is unaffected, which is the point of the fail-soft design. New centuries are now appended to the static dataset by `scripts/add-new-centuries.mjs` and published by a normal deploy. Whether to recreate a database or keep data in git is an open decision.

