# Handoff: Tons of Consequence (written 14 Oct 2026, late evening)

For a fresh chat. Read this, then the memory file `project_tons_of_consequence.md`. Ben has **zero coding knowledge**: plain language,
click-by-click asks, flag big decisions, say exactly what he must do. **Never merge to main or push without his say-so.**
Repo: `/Users/ben/Downloads/tons-of-consequence`. Live: https://tonsofconsequence.com (also tons-of-consequence.vercel.app; www redirects to the apex).
GitHub: push with `gh auth switch --user benlucas27 && git push` (the active account keeps flipping). Vercel deploys `main`.

## 1. Where things stand

**Live on main (`04f393f` + the domain commit `ec78941`):** rankings with a working filter panel; new menu (Rankings, ToCs, Compare, Search, The Don,
Pub Test, More = Hello Cricket, Connect to Claude, About, Privacy; Most divisive is a tab inside Rankings); `/tons-of-consequence` (page + per-batter
pages `/tons-of-consequence/<batter>`); `/the-don`; Hello Cricket (`/hello-cricket`, old `/hello-sport` redirects); ToC stamp and a why line on every innings page, ToC mark on ranking
rows; opposition tier + home/away facts; connector with eight tools (`batter_records` is new; `ask` now routes counting questions); facts-only stories;
326 full names; data audit at 0 findings; www redirect.

**NOT pushed (branch `career-reference-points`, latest commit is the handoff doc itself, all 94 tests pass):**
- the small edits: footer tagline removed, shorter "Not sure? Take the Pub Test →", Tons of Consequence page trimmed (the judging paragraph, the three
  questions and the "Who against, and where" tiers section are removed);
- Hello Cricket: the "Independent and unofficial…14 moments from 7 episodes" note removed;
- the Big Four career comparison now has a "What their hundreds did" table (team win rate, tons of consequence, share, hundreds vs top tier, vs lower
  tier, away) on /compare and in the connector's `compare_careers`;
- WIP data: `src/data/innings-facts.js` (batting position, innings number, balls to 100, other hundreds in the innings and the match, per measured
  hundred) built by `scripts/build-consequence.mjs`, **not yet shown anywhere**.
**Ben has not yet approved pushing/merging this branch. Ask.**

**Scheduled tasks:** `tons-of-consequence-monthly-check` (3rd of month, branch only); `tons-of-consequence-stories` (Mondays ~9:36, branch
`stories-auto`, never pushes, avoids ESPN); `tons-of-consequence-older-innings-overnight` (one-off, **1:30am 15 Oct 2026**, branch `older-innings`, writes
`docs/drafts/older-innings-overnight.md/.json`, never pushes). They only run while the Claude app is open. Review each branch with Ben; never merge unasked.

## 2. Audit of Ben's feedback (all 33 messages checked against the code)

Done and live: directory submission (in review); Root v Smith opposition analysis (`docs/drafts/opposition-strength.md`); Hello Cricket reframe (grouped by
episode, "tons mentioned"); stories policy (facts-only lines, sourced stories need two https sources via `scripts/set-story.mjs`, `docs/story-guide.md`,
weekly helper); the definition (win/save, alive, changed it; dead rubbers and losses never count; draws count if saved; rescue = 3 down under 100 or four
top-seven wickets falling around him under a 200 lead; carried = 40% share and in under 100; already-safe lead 200); stamp, why line, per-batter breakdown;
opposition tiers (Top: Eng/Aus/Ind; then NZ/SA; then SL/WI/Pak; Other) and home/away as plain facts; "Ben's call" overrides that show only the reason
(`src/data/consequence-overrides.js`, 150+ rulings); the Bradman page and win rates; menu; Hello Cricket title; reason rewrites; data cleanup (Taylor 154*,
results, name aliases); filter CSS bug; domain and www; Cook/Sangakkara/Root/Smith rulings (Cook "0-0 counts" dropped, Sangakkara 119 left as is).

Done but NOT pushed: footer/Pub Test/ToC trims, Hello Cricket note, career-preset reference points (section 1).

**Gaps found in the audit (not applied yet):**
1. **Opposition wording.** Ben asked (14 Oct) for something definitive instead of a raw rating, e.g. "South Africa, second-ranked Test side", and "in games
   where those opposition were ranked as international Test sides" (rank at the time). We show only the tier ("Top tier"). Fix idea: show the team with its
   tier, e.g. "Opposition: South Africa (second tier)". The rank-at-the-time idea needs a lawful ranking source (ICC rankings only run from 2003) or our
   own results rating (the Elo in the old scratchpad `elo.mjs`). Ask Ben which.
2. **Other hundreds in the match.** Ben: "how many people scored hundreds in the innings?" is a consideration, "how many tonnes were scored in the game".
   The data is now in `INNINGS_FACTS` but not on the innings page, batter page or in `batter_records`. Show "Other hundreds: none / N in this innings, M in the match".
3. **Carry rule vs Ben's words.** He said "you don't have to come in under 100 to carry, but it does help"; the code still *requires* entry under 100
   (`CARRY_ENTRY` in `src/lib/consequenceTest.js`). Ben did not object when I proposed keeping it and using rulings for exceptions. Raise it once, plainly.
4. **Two-Test series.** Ben: the second Test is a decider for the leading team; a drawn series could count as a save but not a series win. Not
   specifically implemented (stakes use the series score going in). Low priority; ask if he wants it.
5. **Title.** He said the page should say "Tonnes of Consequences"; I kept the site's brand "Tons of Consequence". Mention if he cares.
6. **MCP questions.** He asked for 50-odd questions to cover/test and to find missing data cuts. The 64 questions are listed below and the gaps are in
   `docs/mcp-questions.md`, but there is **no automated check yet**. Build `scripts/mcp-questions-check.mjs` (run each through `ask`) and a test.
   New cuts now possible from `INNINGS_FACTS`: openers/batting position, innings number (fourth-innings hundreds), fastest hundred (balls to 100).
   Wire them into `batter_records` filters and the `ask` parser (`src/lib/records.js`).

## 3. Waiting on Ben
- Approve push + merge of `career-reference-points`.
- **Leaderboard review**: `docs/drafts/leaders-review.html` (84 tons of consequence: Williamson, Amla, G Smith, Younis Khan, Head, Ponting, de Villiers,
  Pietersen, Elgar, Hayden, Tendulkar, Jayawardene, Bell, Voges). He rules YES/NO by number with a reason; record each as an entry in
  `src/data/consequence-overrides.js` (key `"Display name|runs|year"`, note = the reason, never "Ben's call"), then `node scripts/build-consequence.mjs <cricsheet folder>`.
- The overnight older-innings report (`older-innings` branch) and the weekly `stories-auto` branch, when they exist.
- Ben's own to-dos: try the connector in his own Claude; optionally delete unused Vercel env vars `CRON_SECRET`, `NEXT_PUBLIC_SUPABASE_*`.
- Directory submission is "In review" using the vercel.app URLs; update the listing after review (portal: claude.ai/directory/manage).

## 4. Career preset suggestions (not built yet)
Presets live in `src/data/compare-sets.js`; add an entry and run `node scripts/build-careers.mjs` (also `node scripts/build-consequence.mjs` for the reference
points). Career figures come from Cricsheet ball-by-ball, so a player needs a Cricsheet id and is only fully covered if his career is mostly 2001 on:
1. **The Openers**: Cook, Warner, Rohit Sharma, Graeme Smith.
2. **The Noughties Giants**: Ponting, Dravid, Sangakkara, Kallis (careers partly before 2001; show a coverage note).
3. **Asia's Best**: Kohli, Sangakkara, Jayawardene, Younis Khan (add Babar Azam as a fifth).
4. **South Africa's Greats**: Kallis, Amla, de Villiers, Graeme Smith.
5. **The Next Generation**: Brook, Head, Labuschagne, Jaiswal (short careers; use per-innings rates).
6. **Ashes Heroes**: Cook, Pietersen, Clarke, Smith, Root (Hayden/Ponting partly).
7. **Keeper-Batters**: de Kock, Pant, Gilchrist (partial), Watling, Buttler.
8. **England's Bazball Era**: Root, Brook, Stokes, Duckett, Pope.
9. **The Don v The Big Four**: Bradman has no Cricsheet career, so build this one from `src/data/the-don.js` + reference points (win rate, tons of consequence).
Ask Ben which he wants; he likes win rate, tier split, away split, tons of consequence as the reference rows.

## 5. Data backlog (open)
105 players (231 hundreds) are still shown by initials (nicknames, ambiguous, or no Wikipedia match; list via
`node scripts/resolve-full-names.mjs`, proposals in `docs/drafts/names-proposal.json`); Afghanistan men's Tests are withheld by Cricsheet policy; pre-2001
hundreds have no match record except Bradman's 29 (hand-collected from the Cricinfo archive: Ben knowingly KEPT it despite Disney's terms, which forbid
automated access to ESPNcricinfo. **Do not script-fetch cricinfo/ESPN/statsguru again**); Weatherald is not in the data (a first-innings knock); Khawaja 16
hundreds in the data vs the hosts' 17; 43 hand-written stories are still marked "Not yet sourced".

## 6. The 64 MCP test questions (2026-10-14 coverage run; see `docs/mcp-questions.md` for results and missing fields)
1. What is the best Test hundred ever?
2. Top 10 Test centuries
3. Best centuries by India since 2010
4. Best hundreds by Australians in England
5. Best Test hundreds in the 1990s
6. Most clutch hundreds ever
7. Best centuries in a lost Test
8. Best hundred by a New Zealander
9. Best fourth innings hundreds
10. Greatest double centuries
11. Best centuries by opening batters
12. Best hundreds by wicketkeepers
13. How many Test hundreds has Steve Smith scored?
14. Which of Kohli's hundreds is the best?
15. Tell me about Brian Lara 400
16. What is Joe Root's best Test hundred?
17. Compare Sachin Tendulkar and Ricky Ponting
18. Who has more big hundreds, Kohli or Smith?
19. Best hundred by Sachin Tendulkar
20. How many hundreds did Don Bradman score?
21. Which hundreds were tons of consequence?
22. Who has the most tons of consequence?
23. How many of Steve Smith's hundreds were tons of consequence?
24. Was Matt Renshaw's 190 a ton of consequence?
25. Tons of consequence in a chase
26. Which Bradman hundreds were tons of consequence?
27. Best hundreds that saved a Test
28. Hundreds that won the Ashes
29. Who has the most hundreds against Australia?
30. Who has scored the most hundreds against strong opposition?
31. Most hundreds away from home
32. Best overseas hundreds in Australia by an Indian
33. Hundreds against England in England
34. Best hundreds in South Africa
35. Hundreds at Lord's
36. Best hundred at the MCG
37. When Steve Smith scores a hundred how often does Australia win?
38. Which batter's hundreds win the most Tests?
39. Hundreds in drawn Tests
40. Hundreds in Ashes Tests
41. Best hundreds in a dead rubber
42. Who scored the fastest Test hundred?
43. Highest Test score ever
44. Youngest player to score a Test hundred
45. Hundreds on debut
46. Most Test hundreds in a calendar year
47. Longest Test innings by balls faced
48. Hundreds scored in the last year
49. Hundreds in the current Ashes
50. Rank the top 5 as a Romantic would
51. What changes under the Analyst weighting?
52. Most divisive hundreds
53. Best hundreds as a Purist would see it
54. Top hundreds with the Patriot bias
55. Best captain's hundred
56. Best hundred by a player over 35
57. Hundreds with the most partners
58. Which hundreds have video?
59. What did Hello Sport say about Renshaw?
60. Which hundreds were by left handers
61. How is the ToC score calculated?
62. Hundreds in Pakistan by visiting players
63. Best century by a bowler
64. Hundreds in day-night Tests

## 7. Useful commands
- Tests/lint/build: `npm test`, `npm run lint`, `npm run build`. Local preview: preview server `tons-of-consequence-dev` (port 3000).
- Live connector check: `node scripts/test-mcp.mjs` (defaults to the live site). Data audit: `node scripts/audit-archive.mjs <folder> --markdown`.
- Cricsheet match JSON used locally: `/private/tmp/claude-501/-Users-ben-Downloads/90812a3a-0e7b-43ff-82ed-6333cbd70204/scratchpad/cs/matches` (re-download with `--download` if gone).
- Stories: `node scripts/story-queue.mjs 10`; `node scripts/set-story.mjs <id> --text "…" --source "url|label" --source "url|label"`.
- Vercel sometimes shows a bot "Security Checkpoint" to rapid scripted requests; real browsers pass.
- Working rules: verify `git status` before trusting any sub-agent's work; stamp maths is agreed now; prices in AUD; don't use local Whisper; known harmless hydration warning.
