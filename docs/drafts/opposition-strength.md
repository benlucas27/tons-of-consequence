# Opposition strength: Root vs Smith and the others (captured 2026-10-14)

Status: **analysis only. Nothing here touches a score, a page or the connector.** Captured because the Hello Sport hosts
argued Root's runs came against weak opposition, and Ben wanted the facts kept.

## Method

- A simple Elo rating for every team, built from Test results in the Cricsheet archive (win moves a team up, draw counts
  half, K = 20, everyone starts at 1500). Each hundred is tagged with the opposition's rating **at the start of that
  match**, not their final rating (so no hindsight).
- Hundreds from 2008 on only: the archive is close to complete from about 2006, patchy 2001-05, absent before.
- Cut-offs (Ben agreed): **strong = 1520 or more, weak = under 1480.**
- Limits: crude (results only), no home advantage, no account of the attack on the day. "ICC World XI" in the archive
  gets a rating but means nothing. Ratings are only a way to sort opposition into strong / middling / weak.
- Original script: scratchpad `elo.mjs` (not in the repo yet).

## All hundreds since 2008

| Batter | Hundreds | Avg opposition rating | vs strong | vs weak |
|---|---|---|---|---|
| Joe Root | 41 | 1559 | 27 | 11 |
| Steve Smith | 37 | 1556 | 27 | 4 |
| Virat Kohli | 30 | 1534 | 16 | 7 |
| Kane Williamson | 33 | 1511 | 18 | 10 |
| Ricky Ponting | 8 (of 41; archive gaps) | 1528 | 6 | 2 |

Root and Smith have the same number against strong sides (27). Root has significantly more against weak sides (11 v 4).

## Tons of consequence (v2 test) by opposition

Root 11 of 41: 7 strong, 1 middling, 3 weak. Smith 8 of 37: 6 strong, 1 middling, 1 weak.

- Root: 104 v NZ 2013 (weak), 180 v Aus 2013, 134 v Aus 2015, 254 v Pak 2016, 190 v SA 2017, 228 v SL 2021 (middling/weak),
  186 v SL 2021 (weak), 109 v Ind 2021, 109 v WI 2022 (weak), 115* v NZ 2022, 142* v Ind 2022.
- Smith: 111 v Eng 2013, 100 v SA 2014, 199 v WI 2015 (weak), 138 v NZ 2015 (middling), 109 v Ind 2017, 141* v Eng 2017,
  144 v Eng 2019, 211 v Eng 2019.

## Open

- **Home v away.** Ben's point: away is harder, and Smith probably has more away hundreds than Root. Not yet measured.
  Needs each match's venue country compared with the batting team's country (Cricsheet has venue and city).
- **How to show it.** A raw rating ("1,622") means nothing to a reader. Better: a plain rank and words, e.g.
  "Opposition at the time: South Africa, 2nd of 10 sides". Not decided; wait for the agreed definition.
- **The connector can't answer this yet.** The data has no opposition-strength or home/away field per innings.
