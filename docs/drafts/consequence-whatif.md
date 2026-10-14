# What would the total look like? Stricter and looser rules (analysis only)

Nothing here changes the site. It re-runs the Consequence Test on every hundred with a match record, varying one rule at a time,
and projects the answer onto the hundreds we cannot measure yet. Regenerate with `node scripts/consequence-whatif.mjs <cricsheet folder>`.

## Where we are

- 4,628 hundreds in the ranking; **1,768 measured** (38%). Measured ones: 336 are tons of consequence on the live rules plus Ben's rulings (19.0%).
- 2,860 are unmeasured, almost all before 2006 (Cricsheet has no ball-by-ball record) and Afghanistan men's Tests.

## Counts under each rule (measured hundreds only, the written rules without individual rulings)

| Rule | Tons of consequence | Share of measured | Change |
|---|---|---|---|
| Rules as written (before Ben's individual rulings) | 311 | 17.9% | +0 |
| Carry must come in under 100 (the old rule) | 311 | 17.9% | +0 |
| Carry needs half the team's runs | 242 | 13.9% | -69 |
| Rescue needs 4 down (not 3) | 274 | 15.8% | -37 |
| Rescue needs 4 down and a collapse of 5 | 263 | 15.1% | -48 |
| Already-safe lead 150 (not 200) | 295 | 17.0% | -16 |
| No other hundred in the same innings | 194 | 11.2% | -117 |
| No other hundred anywhere in the match | 71 | 4.1% | -240 |
| Drawn Tests never count | 231 | 13.3% | -80 |
| Strict: 4 down, collapse 5, carry 50%, safe lead 150, no other hundred in the innings | 103 | 5.9% | -208 |

(1739 hundreds in the ball-by-ball archive were matched to the ranking; Bradman's 29 are judged separately from the scorecards and are not in this table.)

## Projection to every hundred

Assumes an unmeasured hundred is a ton of consequence at the same rate as measured hundreds from the same decade (or the overall rate where a decade has none).

| Decade | Hundreds | Measured | Tons (live) | Rate | Projected tons |
|---|---|---|---|---|---|
| 1870s | 1 | 0 | 0 | none | 0 |
| 1880s | 19 | 0 | 0 | none | 4 |
| 1890s | 39 | 0 | 0 | none | 7 |
| 1900s | 42 | 0 | 0 | none | 8 |
| 1910s | 35 | 0 | 0 | none | 7 |
| 1920s | 99 | 2 | 0 | 0% | 0 |
| 1930s | 161 | 19 | 9 | 47% | 76 |
| 1940s | 105 | 8 | 3 | 38% | 39 |
| 1950s | 237 | 0 | 0 | none | 45 |
| 1960s | 298 | 0 | 0 | none | 57 |
| 1970s | 359 | 0 | 0 | none | 68 |
| 1980s | 444 | 0 | 0 | none | 84 |
| 1990s | 547 | 0 | 0 | none | 104 |
| 2000s | 945 | 466 | 79 | 17% | 160 |
| 2010s | 866 | 862 | 152 | 18% | 153 |
| 2020s | 431 | 411 | 93 | 23% | 98 |

**Projected total on today's rules: about 910** of 4,628 (20%). A flat overall rate would give 880.

How far to trust it: the measured set is mostly 2006 on. Earlier decades have only Bradman and a handful of hand-checked innings, so their projection is the weakest. The overnight older-innings report (branch `older-innings`) tests the top-ranked early hundreds one by one and will show whether the early rate is higher or lower.

## Stricter rules, projected

Applying each rule's measured change in percentage terms to the projected total:

| Rule | Measured share | Projected total |
|---|---|---|
| Rules as written (before Ben's individual rulings) | 17.9% | 910 |
| Carry must come in under 100 (the old rule) | 17.9% | 910 |
| Carry needs half the team's runs | 13.9% | 708 |
| Rescue needs 4 down (not 3) | 15.8% | 802 |
| Rescue needs 4 down and a collapse of 5 | 15.1% | 770 |
| Already-safe lead 150 (not 200) | 17.0% | 863 |
| No other hundred in the same innings | 11.2% | 568 |
| No other hundred anywhere in the match | 4.1% | 208 |
| Drawn Tests never count | 13.3% | 676 |
| Strict: 4 down, collapse 5, carry 50%, safe lead 150, no other hundred in the innings | 5.9% | 301 |

## The big career totals, if the unmeasured hundreds count at the same rate as the measured ones

Only a guide: it treats a batter's unmeasured hundreds like his measured ones. Sangakkara, for example, has 38 Test hundreds, and only those with a match record can be tested so far.

| Batter | Hundreds | Measured | Tons so far | If the rest match | 
|---|---|---|---|---|
| Sachin Tendulkar | 51 | 18 | 3 | 9 |
| Jacques Kallis | 45 | 28 | 2 | 3 |
| Joe Root | 41 | 41 | 6 | 6 |
| Ricky Ponting | 41 | 17 | 3 | 7 |
| Kumar Sangakkara | 38 | 29 | 7 | 9 |
| Steve Smith | 37 | 37 | 9 | 9 |
| Rahul Dravid | 36 | 16 | 2 | 5 |
| Brian Lara | 34 | 7 | 1 | 5 |
| Mahela Jayawardene | 34 | 21 | 4 | 6 |
| Younis Khan | 34 | 24 | 3 | 4 |
| Sunil Gavaskar | 34 | 0 | 0 | - |
| Alastair Cook | 33 | 33 | 6 | 6 |
| Kane Williamson | 33 | 33 | 5 | 5 |
| Steve Waugh | 32 | 2 | 0 | 0 |
| Matthew Hayden | 30 | 14 | 4 | 9 |
| Virat Kohli | 30 | 30 | 3 | 3 |
| Shivnarine Chanderpaul | 30 | 17 | 2 | 4 |
| Don Bradman | 29 | 29 | 12 | 12 |
| Michael Clarke | 28 | 27 | 4 | 4 |
| Hashim Amla | 28 | 28 | 4 | 4 |
| Graeme Smith | 27 | 23 | 3 | 4 |
| Allan Border | 27 | 0 | 0 | - |
| David Warner | 26 | 26 | 4 | 4 |
| Inzamam-ul-Haq | 25 | 4 | 1 | 6 |
| Garry Sobers | 25 | 0 | 0 | - |
