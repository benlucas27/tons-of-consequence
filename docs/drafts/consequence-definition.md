# What is a ton of consequence? draft v2 (Ben's rulings applied)

Status: **draft, not built into the site.** The code (`src/lib/matchContext.js`, `src/lib/consequenceTest.js`) and a sample
runner (`scripts/consequence-sample.mjs`) exist so the thinking can be tested. Nothing here changes a score, a page or
the stamp on the live site.

## What Hello Sport said

From Hello Sport #828 (the clip from about 33:30 to 37:45). In their own terms:

- A hundred in a **lost Test**, or in a **dead rubber**, is a different thing from one that mattered: "where did it sit?"
- If both openers made hundreds and you walk in with **zero pressure**, it is "still a good ton" but not a ton of consequence.
- A keeper who comes in at **five for 750** and makes a hundred has made "a great ton, just not a ton of consequence".
- They want a **formula** that someone else could run, and for it to be **third-party tested**.
- (They also joked that they hold Australians to a different standard: a dead-rubber hundred was a ton of consequence
  because they wanted 4-1. Our test deliberately doesn't do that, see "Open questions".)

And your steer: consequence is **what the hundred did to a match or a series, and the circumstances it was made in**,
not how many runs it was or how it looked. It is scenario-based and outcome-based.

## The idea (v2): circumstances, not a score

A ton of consequence is judged on **what the hundred did to the match**, as three yes/no questions you can answer from the
scorecard. There is no points total and no bar. Yes to all three, and the answer is a named scenario:

1. **Did the team win or save the match?** A win, a tie, or a draw in which the team was behind, following on, or batting to
   survive. A hundred in a **loss never counts**.
2. **Was the match still alive when he came in?** Not a **dead rubber** (series already decided), and not already won
   (team more than 250 ahead on entry).
3. **Did the hundred change it?** One of four scenarios:
   - **Chased it down**: a hundred in a winning fourth-innings chase.
   - **Saved the match**: a hundred in a draw that needed saving.
   - **Rescued the innings**: in at 3 or more down with the team still under 100, or 4 or more wickets fell around him while
     the team was under 200.
   - **Carried the innings**: 40% or more of the team's runs.

Otherwise it is **"a good ton"**, and the first "no" says why (lost, dead rubber, never in danger, no pressure).

## Ben's rulings (14 Oct 2026)

- It is **circumstance-based, not a bar**. A great ton need not be a ton of consequence.
- **Draws:** a ton counts if it saved the match. **Losses:** never.
- **Dead rubbers do not count.** The hosts ruled Head's and Smith's SCG dead-rubber tons consequential (they wanted 4-1, or a
  5-0 whitewash). We disagree, and say so on the What is a TOC? page: the hosts call themselves "the home of unqualified
  opinion and unwavering bias", and the test must be the same for every side. A rubber is dead once the series result is
  settled, whatever the final margin.
- **Label = yes/no plus the scenario**, no number.
- **Older innings (before about 2006, where Cricsheet has no ball-by-ball):** collect scorecards by hand from open sources,
  each with a link, starting with the highest-ranked and the outliers (Bradman first). We do **not** bulk-scrape
  Statsguru. Where we do not have enough data, the page **says so** rather than guessing.
- **A second, simpler stat that works for every era:** *when this batter scores a hundred, how often does his team win?*
  It needs only the match result. Measured so far (hundreds in the archive): Smith 25 wins, 9 draws, 3 losses of 37
  (68% won); Root 26/8/7 of 41 (63%); Williamson 22/8/3 of 33 (67%); Kohli 14/9/7 of 30 (47%).
- **Opposition strength and home/away** are shown as **plain facts** on the innings, not part of the test and not in the
  score. See `opposition-strength.md`. Needs a definitive wording (a rank, not a raw rating).

## Rule changes after the Root / Smith / Kohli review (14 Oct 2026)

- **Already safe:** a lead of **200 or more** on entry means the match was not alive (was 250). Root's 180 at Lord's 2013
  (England 233 ahead) no longer counts.
- **A collapse around him** counts only top-seven batters falling (not tail-enders) and only if the team is under a 200 lead.
- **Carried** also needs him to have come in with the team **under 100** (Kohli's 254* at Pune with 2-163 no longer counts;
  Smith's 211 at Old Trafford, in at 2-28, still does).
- **Ben's call (override):** where common sense disagrees with the scorecard, a hand-written yes or no wins, with a one-line
  reason shown as "Ben's call" (`src/data/consequence-overrides.js`). First entry: Root 109 at Trent Bridge 2021, ended by
  rain with India needing about 50, so the weather saved England, not the hundred. Rain-affected draws have to be
  flagged by hand; Cricsheet does not mark them.
- **Opposition tiers** (plain facts, not part of the test): top = England, Australia, India; next = New Zealand, South Africa;
  then Sri Lanka, West Indies, Pakistan; everyone else below.
- **Planned page:** per batter, a breakdown of every century (match details and why it was or wasn't a ton of
  consequence), with counts, on the Tons of Consequence page.

## How the rulings work (from the 126-entry review, 14 Oct 2026)

- Near-misses were ruled one by one with the scorecard in front of us: 125 of 126 so far, 64 yes and 61 no.
- **Other hundreds in the match are a consideration, not a rule.** A hundred counts for more when it is the only one in
  the match, but a shared hundred can still be a ton of consequence (37 of the yes rulings had a team-mate's hundred).
  A fixed "no if shared" rule agreed with the rulings only 68 times in 121, so it is shown as a fact on each innings and
  weighed by judgement.
- Much of it is feel, and the page says so. Each ruling carries a one-line reason; readers see the reason, not who decided.

## What it can and can't see

- It needs the ball-by-ball record. Cricsheet is close to complete from about **2006**, patchy for 2001 to 2005, absent
  before 2001. Today that measures roughly **1,700 of the 4,627 hundreds**.
- It does not know the pitch, the weather, the attack or the occasion. Those are in the ToC score, not here.

## Still to settle (the numbers inside the rules)

1. **Rescue thresholds** (SETTLED: 3 down under 100; 4 wickets around him under 200). Too loose and every first-innings hundred in
   a wobble counts.
2. **Carry share** (SETTLED at 40%; 30% would pass 32% of all hundreds). Opener or tail-ender, 40% means different things.
3. **A saved draw:** behind on entry, following on, or 3rd/4th innings with under a 150 lead.
4. **Two-Test series:** the second Test is always a decider, so New Zealand hundreds get "live" more often.
5. **Heroic losses** (Astle 222, Sangakkara 192 chasing 500): a separate "heroic loss" label, or nothing?

## Next steps

1. Settle the five numbers above, re-run on the sample, and look at the whole table of the 1,700 measured hundreds.
2. Only then: the stamp, a "why" line on each innings, the batters' table, and a **What is a TOC?** page with the official
   definition. Labelled as measured from 2006 until the older innings are collected.
