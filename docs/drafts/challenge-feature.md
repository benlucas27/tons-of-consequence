# Challenge this call: the review list

Decided with Ben, 22 Oct 2026. Nothing here changes any law or any verdict by itself. Law 1 (a ToC must win or save the match) is fixed and is not up for challenge. Audience is Australians; commentary from other countries is a signal, not a to-do list. AI-written copy is fine.

## What people see
**Button** on every innings page, under the verdict: **Challenge this call**. It opens a small box:
- *What should we look at?* One of: Facts look wrong / Situation missed (follow-on, collapse, series stakes) / Law applied wrongly / Not enough data on this match / Other.
- Optional note, 280 characters.
- Line above the submit: "Law 1 isn't up for challenge. This is about the facts and how the laws were applied."
- After submit: "Added. N people have challenged this call."
- Beside it, a one-tap **I disagree** counter that needs no reason. It shows a live "N people disagree" under every verdict.

**Review list page `/reviews`**, the live part:
- Counters across the top: innings under review, challenges this week, calls reviewed.
- Tabs: Most challenged, Under review, Decided.
- Each row: innings, today's verdict, evidence badge (full ball-by-ball / scorecard only / "not a lot of data on this match"), challenge count, disagree count, top reason categories as chips, status.
- Written notes are NEVER shown publicly (Ben's choice): the public sees counts and reason categories only.
- Statuses: Challenged, then In the queue (5 or more people), Under review, then Decided: stands / changed / no call. A decided row shows Ben's short public note.
- Innings pages show the status chip: "Under review, 23 challenges" or "Reviewed 22 Oct: stands".

## Ben's side
Only Ben's decision changes a verdict. Weekly, Claude pulls the challenges and written notes (database, read with the Neon tools), runs each challenged innings through the model to show points per law, checks the facts, and drafts a recommended ruling and public note on a tick page. Ben ticks stand or change; decisions go into the repo (final rulings file and `src/data/reviews.js` for statuses and notes) and are deployed. A monthly or weekly scheduled task can prepare the pack.

## Build
- Storage: a small Neon Postgres database. Ben creates it from Vercel (Storage > Create Database > Neon) so the connection string goes straight into the project's environment variables and Claude never handles it. Claude then creates the tables through the Neon tools. The app reads `DATABASE_URL` server-side only.
- Tables: `challenges` (id, innings_id, reason_code, note, ip_hash, created_at), `disagrees` (innings_id, ip_hash, day), and decided statuses in the repo file, not the database.
- API routes (Next route handlers): POST /api/challenge, POST /api/disagree, GET /api/review-counts (cached about 60 seconds).
- Pages: `/reviews`, a `ChallengeButton` component and a status chip on innings pages.
- Guards: hash IPs with a server secret, 3 requests an hour per person, one challenge and one disagree per innings per person per day, hidden honeypot field, 280 character cap, notes stored but never rendered publicly.
- Evidence badge uses the existing evidence letters (b = ball-by-ball, s = scorecard, h = hand-checked from reports, p/r = result only, "not a lot of data").
- Spelling rule: always "ToC".
- Not in the first version: accounts, email, public comments, anything that auto-changes a verdict.
