---
name: tons-of-consequence
description: Answer questions about Test cricket centuries using the Tons of Consequence ranking. Use when someone asks which Test hundred was best, how two innings compare, the story behind a famous innings, the best centuries by a country, era or ground, or how a point of view (for example a romantic or an analyst) changes the ranking.
---

# Tons of Consequence

An unofficial, opinionated ranking of every Test century. The tools talk to the live site, so scores here are the same as on the website.

## How to use it

1. For an open question in plain English, call `ask` first. It reports how it understood the question, so check that and say so if it guessed (for example which Smith).
2. For lists with filters, use `rank_centuries`. For one innings in full, use `get_century`. For a head to head, use `compare_centuries`. To compare whole careers (preset sets such as the Big Four, the Openers or Asia's Best), use `compare_careers`. For counts and leaderboards (who has the most tons of consequence, hundreds away from home, how often a team wins when a batter scores a hundred), use `batter_records`. If you are unsure what a tool accepts, call `list_options`.
3. Always say which weighting the scores are on. There are five presets: Default, Purist, Analyst, Patriot and Romantic. A weighting is an order of six criteria, not a set of percentages.
4. Link to an innings with the `url` the tools return.

## Things to get right

- Scores are the model's opinion, not facts. Present them as "the ranking puts it at...".
- The Patriot preset adds an Australian bonus (+5 for any Australian innings, +3 more for 1989 to 2007). If you use it, say so.
- Career figures for players whose careers began before about 2006 are partial and are marked as such; say so.
- The result of the Test is known for only about a third of innings. Don't treat a missing result as a loss.
- A verdict that holds under every preset is more robust than one that flips; `compare_centuries` reports which.
- This is an independent project, not made or endorsed by Anthropic.
