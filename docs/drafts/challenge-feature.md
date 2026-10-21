# Challenge: the review list

Decided with Ben, 22 Oct 2026 (revised the same day). Nothing here changes any law or any verdict by itself. Ben's decision is the only thing that does. Audience is Australians; commentary from other countries is a signal, not a to-do list. AI-written copy is fine. This is NOT voting: there is no agree or disagree counter, because a fan vote would undercut a hard ruling.

## What people see
**Button** on every innings page: **Challenge this ruling** (lime, `#c6ff3a`, opens a pop-up). It opens a small box:
- *What should we look at?* One of: Facts look wrong / Situation missed (a follow-on, a collapse, series stakes) / Not enough data on this match / Other.
- A box to write a note, 280 characters, optional. The note is for Ben only and is never shown anywhere public.
- Send. Then: "Added. N people have challenged this ruling."
- No lines about which laws can or can't be challenged.

**Under review list `/reviews`**, pretty basic:
- A counter at the top: how many innings are under review, and how many challenges in total.
- A plain list of the innings under review, most challenged first. Each row: innings, today's verdict, how many challenges, and why it is under review (the reason categories people picked, as chips, plus an evidence badge such as "not a lot of data on this match").
- Innings pages show "Under review, N challenges" when an innings is on the list. After Ben decides, the row moves to Decided with his short public note (stands / changed / no call).
- Nothing written by visitors appears on the page, only counts and reason categories.

## Ben's side
Once a month, Claude pulls the challenges and notes from the database, runs each challenged innings through the model to show points per law, checks the facts, and drafts a recommended ruling and public note on a tick page. Ben ticks stand or change; decisions go into the repo (final rulings file and `src/data/reviews.js` for what is under review, plus decided notes) and are deployed. A monthly scheduled task prepares the pack. Putting an innings on the visible list is Ben's call too (for example once it has a few challenges).

## Build
- Storage: a small Neon Postgres database. More features are likely to need a database later (accounts, for example), so the schema should be tidy and expandable. Ben creates it from Vercel (Storage > Create Database > Neon) so the connection string goes straight into the project's environment variables and Claude never handles it. Claude then creates the tables through the Neon tools. The app reads `DATABASE_URL` server-side only.
- Table: `challenges` (id, innings_id, reason_code, note, ip_hash, created_at). Under-review status and decided notes live in the repo file `src/data/reviews.js`, not the database.
- API routes (Next route handlers): POST /api/challenge and GET /api/review-counts (cached about 60 seconds).
- Pages and components: `/reviews`, a `ChallengeButton` on innings pages, a status chip when under review.
- Guards: hash IPs with a server secret, 3 challenges an hour per person, one challenge per innings per person per day, a hidden honeypot field, the 280 character cap, notes stored but never rendered.
- Evidence badge uses the existing evidence letters (b = ball-by-ball, s = scorecard, h = hand-checked from reports, p / r = result only).
- Spelling rule: always "ToC".
- Not in the first version: accounts, email, public comments, voting, anything that auto-changes a verdict.
