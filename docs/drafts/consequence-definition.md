# What is a ton of consequence? A draft definition, for discussion

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

## The idea

Consequence is **how much the result depended on the innings**. So the test asks four questions of every hundred, and
each gets points. All four come straight off the ball-by-ball record, so anyone can check them.

| Part | Points | The question | How it is read |
|---|---|---|---|
| **Outcome** | 40 | What happened to the team? | Won a chase 40. Won 32 (+4 if tight: 50 runs or fewer, or 3 wickets or fewer). Saved a draw 32. Tied 36. Comfortable draw 8. Lost 5. |
| **Pressure** | 30 | What did he walk into? | Wickets down on entry (0 to 16 points), a collapse (+6), wickets that fell around him while the team was under 200 (+5 or +8). From the third innings on, being behind adds up to 14 and a small lead adds 8. If the team was already more than 250 ahead, pressure is capped at 6. |
| **Carry** | 15 | How much of the innings was his? | 50% or more of the team's runs 15, 40% 12, 30% 9, 20% 5, less 2. |
| **Stakes** | 15 | What rode on the match? | Decider or last match with the series on the line 15. A live series 9. A dead rubber 0. |

Two rules sit on top:

1. **A hundred in a loss can never be a ton of consequence.** Its score is capped below the bar.
2. A **dead rubber** scores nothing for stakes, so it can pass only on the strength of the match situation.

The total is out of 100: the **Consequence Index**. A hundred whose index clears the **bar** gets the stamp.

## What it can and can't see

- It needs the ball-by-ball record. Cricsheet's archive is close to complete from about **2006**, patchy for 2001 to 2005,
  and absent before 2001. So today it can measure roughly **1,700 of the 4,627 hundreds**. For older innings (Bradman,
  Hutton, Sobers and the rest) we'd need scorecards from another source.
- It does not know the pitch, the weather, the quality of the attack or the occasion. Those are in the existing ToC score.
  The Consequence Index is deliberately about the match situation only.

## The test run

Run on every hundred in the archive (1,739 of them; 1,715 matched to a ranking entry).

**Calibration: innings where we already know the story**

| Innings | Index | Stamp | Why |
|---|---|---|---|
| Stokes 135* v Australia, Headingley 2019 | 84 | yes | Won a chase, in at 3-141, 217 behind |
| Smith 144 v England, Edgbaston 2019 | 68 | yes | Won it; carried 51% while the team collapsed around him |
| McCullum 302 v India, Wellington 2014 | 87 | yes | Saved the Test after the follow-on |
| Sangakkara 192 v Australia, Hobart 2007 | 46 | no | Lost (capped) |
| Smith 138 v England, SCG 2026 | 45 | no | Dead rubber |
| Head 163 v England, SCG 2026 | 37 | no | Dead rubber, opened with no pressure |

Not testable yet: Renshaw's 190 (the Cricsheet archive stops at 12 September 2026), Gilchrist 2002 and Ponting at Old
Trafford 2005 (the archive is thin before 2006).

**How the bar changes things.** Share of all measured hundreds that would pass:

| Bar | 55 | 60 | 65 | 70 | 75 | 80 |
|---|---|---|---|---|---|---|
| Share | 46% | 30% | 16% | 9% | 5% | 3% |

**The five people argue about** (hundreds that are in the archive):

| Batter | Measured | Bar 60 | Bar 65 | Bar 70 | Bar 75 |
|---|---|---|---|---|---|
| Joe Root | 41 of 41 | 13 | 6 | 2 | 2 |
| Steve Smith | 37 of 37 | 6 | 1 | 0 | 0 |
| Virat Kohli | 30 of 30 | 5 | 3 | 2 | 1 |
| Kane Williamson | 33 of 33 | 10 | 10 | 10 | 8 |
| Ricky Ponting | **17 of 41** | 2 | 2 | 2 | 2 |

Ponting is only partly measured, so his count is not comparable yet.

## Open questions

1. **Where is the bar?** My starting suggestion is 65 (about 1 hundred in 6). At 60 it is a third; at 70 it is under one in ten.
2. **Should a hundred in a loss ever count?** The hosts treated it as a negative. But Astle 222 or Sangakkara's 192
   chasing 500 are the opposite of meaningless. Option: a separate "heroic loss" label, not the stamp.
3. **Is a dead rubber ever consequential?** The hosts said Smith's and Head's were, because 4-1 mattered to them. The test
   says no. Option: a small stakes score for chasing a series margin, or the Patriot preset adds it.
4. **Two-Test series.** The second Test is always a decider or "on the line", so New Zealand's batters get full stakes
   points more often than anyone. That is probably right, but it is why Williamson scores so well.
5. **Smith looks weak.** Few of his hundreds pass at a high bar. Many are first-innings hundreds in strong Australian sides
   with little pressure. That may be the honest answer, or it may mean the pressure part under-rewards a big first innings.
6. **Carry and pressure for openers.** An opener always "walks in at 0-0". Is 6 points of pressure fair?
7. **Weights.** Are 40/30/15/15 the right split? These are my first numbers.
8. **Before 2001.** Do we leave older innings unstamped, stamp them by the ranking's score as a fallback, or go and collect
   scorecards for the top few hundred?

## Next steps

1. You react to the definition and the open questions. We adjust and re-run on the same sample.
2. Run it on all 1,700 measured hundreds and look at the whole table.
3. Only then: add the stamp, a "why" line on each innings, and the batters table, labelled as measured from 2006.
