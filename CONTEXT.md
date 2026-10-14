# Tons of Consequence

Ranks every Test cricket century ever scored by how much it actually mattered, not just how many runs it was. The reader sets their own values; the model reflects them back as a ranking.

## Language

**Innings** (as a noun, singular and plural: "one innings", "many innings"):
A single century-scoring batting performance by one player in one Test match. The unit everything else is computed on.
_Avoid_: century (a stat about the innings, not the innings itself), hundred, knock.

**Lever**:
One of the six named dimensions an innings is scored on: Match Impact, Conditions & Opposition, Clutchness, Narrative, Historical Weight, Perceived Greatness. A lever's *value* (0-100) reflects how strongly that dimension applies to a specific innings; it does not vary by reader.
_Avoid_: factor, category, dimension, criterion.

**Weighting Profile**:
A reader's personal judgement of what matters, expressed as an order of the six levers: first place carries 30%, then 22, 18, 14, 10 and 6. Two readers looking at the same innings' lever values can reach different ToC Scores because their orders differ. A profile can also carry a Bonus (see below), which is always shown.
_Avoid_: weights (fine in code; in domain language, name the whole order).

**ToC Score**:
The single number produced by combining an innings' lever values with a weighting profile: the weighted average, 0-100. Not intrinsic to the innings — it only exists in combination with a weighting profile.
_Avoid_: score (too generic on its own), rank (rank is the ToC Score's position in a list, not the score itself).

**Preset**:
A named, pre-built Weighting Profile representing a recognizable point of view. There are five: Default, Purist (how hard it was), Analyst (what it changed), Patriot (Australia first) and Romantic (the story). A starting point a reader can adjust from, not a fixed category readers belong to. A test keeps the presets clearly different from each other.
_Avoid_: persona (see below — related but distinct), profile (ambiguous with Weighting Profile in general).

**Bonus**:
Points added to a score after the weighting, for presets that favour a team. Today only the Patriot has one: the Australian bonus, +5 for any Australian innings and +3 more for 1989 to 2007 (the Border to Ponting years). It is always shown on screen and carried in links (`bonus=au`), so a score never moves without saying why. Scores are capped at 100.
_Avoid_: boost, handicap.

**Persona**:
The result of the Pub Test: a label and description assigned to a reader based on the answers they chose most. Distinct from a Preset — a Persona is diagnosed from a reader's answers, a Preset is chosen off a shelf.
_Avoid_: preset, type, result.

**Pub Test**:
The eight-question quiz (at `/quiz`), four answers each, one per persona. The persona a reader chose most (at least three times, and strictly ahead) is their result, otherwise the Balanced Observer. Each persona hands the reader into the matching preset before the rankings.
_Avoid_: quiz alone (fine informally, but "Pub Test" is the proper name used in the product).

**Divisiveness**:
How much an innings' ToC Score swings across different Weighting Profiles (measured today as the spread across the named Presets). High divisiveness means the innings' standing depends heavily on what the reader values; low divisiveness means most readers would rank it similarly regardless.
_Avoid_: volatility (used in code identifiers; in domain language, say divisiveness).

**Review Status**:
Whether an innings' lever values and story were set by a person or estimated automatically from the scorecard. An automatic estimate is a placeholder until someone scores the innings properly.
_Avoid_: score_status (the old database field name).

**Featured Innings**:
The one innings shown in the Latest-century card at the top of the rankings, chosen by hand. It is usually the most newsworthy recent century.
_Avoid_: spotlight (fine in code), highlight.

**In Progress**:
The label on an innings whose Test has not finished, so its match result is not yet known. The innings itself (runs, balls) is final.
_Avoid_: live (fine in code), ongoing.

**Story**:
The two-to-four sentence account of what made a specific innings remarkable — what was at stake and what happened. Written or approved by a human reviewer; distinct from the lever values, which are numeric.
_Avoid_: description, narrative (Narrative is already a Lever name — reusing it for the prose would collide).

**Ask**:
Answering a plain-English question about the innings (at `/search`) by typing or speaking. The answer says how the question was understood, so a wrong guess is visible. Distinct from the filter box on the rankings page, which only narrows the list.
_Avoid_: search (the tab is named Search, but the thing it does is answer questions).

**Movement**:
How many places an innings has moved from its rank on the Default weighting, shown as ▲ or ▼ on rows whenever the weighting is not Default and the move is three places or more.
