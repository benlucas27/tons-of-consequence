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
A reader's personal judgement of how much each lever should count, expressed as six percentages that sum to 100. Two readers looking at the same innings' lever values can reach different ToC Scores because their weighting profiles differ.
_Avoid_: weights (fine in code; in domain language, name the whole set).

**ToC Score**:
The single number produced by combining an innings' lever values with a weighting profile: the weighted average, 0-100. Not intrinsic to the innings — it only exists in combination with a weighting profile.
_Avoid_: score (too generic on its own), rank (rank is the ToC Score's position in a list, not the score itself).

**Preset**:
A named, pre-built Weighting Profile representing a recognizable point of view (e.g. "The Purist" favours Conditions and Match Impact; "The Romantic" favours Narrative). A starting point a reader can adjust from, not a fixed category readers belong to.
_Avoid_: persona (see below — related but distinct), profile (ambiguous with Weighting Profile in general).

**Persona**:
The result of the Pub Test: a label and description assigned to a reader based on the Weighting Profile their quiz answers produced. Distinct from a Preset — a Persona is diagnosed from a reader's answers, a Preset is chosen off a shelf.
_Avoid_: preset, type, result.

**Pub Test**:
The six-question either/or quiz (at `/quiz`) that derives a reader's Weighting Profile from their answers to concrete dilemmas, then reveals their Persona before handing them into the rankings.
_Avoid_: quiz alone (fine informally, but "Pub Test" is the proper name used in the product).

**Divisiveness**:
How much an innings' ToC Score swings across different Weighting Profiles (measured today as the spread across the named Presets). High divisiveness means the innings' standing depends heavily on what the reader values; low divisiveness means most readers would rank it similarly regardless.
_Avoid_: volatility (used in code identifiers; in domain language, say divisiveness).

**Review Status**:
Where an innings sits in the path from first entering the dataset to being fully human-considered: freshly computed and untouched, awaiting a human reviewer, or reviewed and finalized by one. An innings' lever values and story are provisional until it reaches the reviewed state.
_Avoid_: score_status (the field name; the domain concept is Review Status regardless of what a column is called).

**Story**:
The two-to-four sentence account of what made a specific innings remarkable — what was at stake and what happened. Written or approved by a human reviewer; distinct from the lever values, which are numeric.
_Avoid_: description, narrative (Narrative is already a Lever name — reusing it for the prose would collide).
