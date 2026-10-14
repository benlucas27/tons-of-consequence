# What people will ask the connector, and what it can't answer yet

On 14 Oct 2026 I wrote 61 questions a cricket fan is likely to ask about Test hundreds and ran them through the connector's
`ask` tool. This is what came back, and what data or capability is missing. Rerun the list after any change to `ask`.

## Works well
- Rankings with filters: "Best centuries by India since 2010", "Best hundreds by Australians in England", "Top 10", "Most clutch
  hundreds", "Most divisive", "Best centuries in a lost Test", a ground ("Hundreds at Lord's"), a decade.
- One innings or two compared: "Tell me about Brian Lara 400", "Ponting or Smith?".
- Presets: "Rank the top 5 as a Romantic would".
- **New, counting questions** (the `batter_records` tool, also reached through `ask`): "Who has the most tons of consequence?",
  "Who has the most hundreds against Australia / strong opposition / away from home?", "How many of Smith's hundreds were tons
  of consequence?", "When Smith scores a hundred how often does Australia win?", "Which batter's hundreds win the most Tests?".

## Answered, but only partly
- "How many hundreds has X scored?" now gives the count; before it listed their best innings.
- Home/away and tons of consequence are known only for hundreds with a match record (mostly 2006 on, and Bradman), so those
  leaderboards under-count older batters. The answer says so.
- "Hundreds in the current Ashes", "in the last year": no live or "latest" notion beyond the data's last update.

## Missing data fields (what to add to answer more questions)
| Question type | Field we don't have |
|---|---|
| "Best hundreds by openers / keepers / captains" | batting position, wicketkeeper, captain flag, per innings |
| "Left-handers", "players over 35", "youngest", "on debut" | handedness, date of birth, debut Test |
| "Hundreds in day-night Tests" | day/night flag |
| "Most hundreds in a calendar year", "fastest hundred" | balls to reach 100 (we have balls for the whole innings, not the milestone) |
| "Fourth-innings hundreds" | innings number on every row (we have it only where there is a match record) |
| "Best hundreds in a dead rubber" | series state on every row (same limit) |
| "Hundreds in Pakistan by visiting players" | host country per ground, for every row |
| Home/away and tons of consequence before 2006 | a lawful scorecard source (see below) |

## Things to decide
- **Older innings.** Ball-by-ball data does not exist before about 2001 (Cricsheet). ESPNcricinfo's terms (Disney's terms of use)
  forbid collecting content "using a robot, spider, script, or other automated means", so we do not bulk-collect scorecards
  from it. Options: hand-collect the few hundred most important innings from open sources (Wikipedia match and series pages,
  club and board reports), as with Bradman; or license a dataset.
- Should `ask` route "best X" counting questions to leaderboards by default? It now does for questions that start with who,
  most or how many and mention hundreds, ton(s) of consequence, win rate, away, home or an opposition.
