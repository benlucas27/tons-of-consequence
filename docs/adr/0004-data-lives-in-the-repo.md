---
status: accepted
---

# Keep the dataset in the repo and publish it with a deploy, with no database

The site's Supabase project (used for an editorial queue and, briefly, a live overlay on the static data) was found to no longer exist on 13 Oct 2026. The site kept working because the overlay failed soft, but the monthly update had nowhere to write. Recreating a database would add an account, credentials and an extra moving part to a dataset of about 4,600 small rows that changes monthly.

Decided that the data stays in `src/data/sample.js` and a normal deploy publishes it. New centuries are appended by `scripts/add-new-centuries.mjs`, run monthly by a GitHub Action that only commits if the data tests and the build pass. The Supabase client, admin scoring page, cron endpoint and overlay were removed.

**Considered and rejected**: recreating Supabase (more infrastructure for a dataset this small); a Vercel cron writing to a database (same).

**Consequences**: every change to the data is a reviewable commit and the history is the audit trail. Editorial scoring now means editing the data file (or asking for it), since the admin page is gone. If someone later needs non-developers to edit scores in a browser, that is the moment to reintroduce a database, and this ADR should be revisited.
