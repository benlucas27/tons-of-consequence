# Presets are distinct points of view, and the Patriot carries a visible bonus

The original presets (Purist, Analyst, Patriot, Romantic) were only reorderings of the six criteria, and two of
them shared all of their top 20 with Default. Testing every possible order showed why: five of the six criteria
are scored in a narrow, correlated band, so only History and Narrative move the ranking much, and no reordering
can make a preset "Australia first". The Pub Test had the same problem: half of all answer combinations produced
the Romantic, and the Patriot's "Australia first" copy did not match what it measured.

Decided:

- Five presets, each a clearly different point of view (Default, Purist, Analyst, Patriot, Romantic). A test fails if
  any two share more than 18 of their top 20.
- The Patriot is the Default order plus a bonus: +5 for any Australian innings, +3 more for 1989 to 2007 (the Border
  to Ponting years). A History-led order was rejected because it pushes recent innings, such as Renshaw's 190, down.
- The bonus is never silent: a note on every page says it is on, the innings page shows it as a line in the score,
  verdicts name it when it matters, and links carry `bonus=au`. Scores are capped at 100.
- Rows show how far each innings has moved from its Default rank, so a preset's effect is visible.
- The Pub Test is eight questions with four answers each, one per persona, and a persona hands the reader into the
  matching preset. Simulation: random answers give each persona about 19 per cent and Balanced 25 per cent.

**Consequences**: a weighting is now an order plus an optional bonus, so links and saved preferences carry two
things, and every page that shows a score must pass both. The claude-plugin keeps its own free-weight presets
(ADR-0003) and does not yet match these; bring them across if the plugin should speak the same language.
