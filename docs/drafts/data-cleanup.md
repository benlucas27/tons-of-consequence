# Data cleanup list

From `node scripts/audit-archive.mjs <folder>`, which compares the ranking dataset with Cricsheet's ball-by-ball archive
(895 men's Tests, 2001 to September 2026). It reads files only and changes nothing. Do this before the Consequence Test
is run on the whole database, because the test joins the two sources by player, runs, year and opponent.

## 1. Names that do not match (23 hundreds)
The archive spells some names differently from the dataset, so the join misses them. All are the same people:

| Archive | Dataset |
|---|---|
| Liton Das | Litton Das |
| Nazmul Hossain Shanto | Najmul Hossain Shanto |
| Mehedi Hasan Miraz | Mehidy Hasan Miraz |
| Agha Salman | Salman Agha |
| Sarfraz Ahmed | Sarfaraz Ahmed |
| L Tucker | LJ Tucker |
| Dhruv Jurel | DC Jurel |
| Nithish Kumar Reddy | K Nitish Kumar Reddy |

**Fix:** match players on Cricsheet's stable player ID (as the career figures already do), not on the spelling of a name.
Store that ID on every row, then one rename can never break a join again.

## 2. A century missing from the dataset (at least 1)
Ross Taylor's **154\*** v England, Napier, March 2008 is in the archive but not in the dataset (the dataset has his 120 at
Hamilton in the same series). The original list is therefore not guaranteed complete.
**Fix:** run the same comparison for the whole archive period and add what is missing. Pre-2001 needs a second source.

## 3. Results that disagree (4 of 1,715)
Dataset against archive, same innings:

- Mahela Jayawardene 374 (2006): dataset says draw, archive says win
- Virender Sehwag 109 (2010): dataset says loss, archive says win
- Kumar Sangakkara 319 (2014): dataset says win, archive says draw
- David Warner 253 (2015): dataset says win, archive says draw

**Fix:** a person checks each against a scorecard. The other 1,711 agree, which is a good sign for both sources.

## 4. Hundreds in the dataset that the archive lacks (73 of 1,649 from 2006)
Mostly 2024 to 2025 (Afghanistan and Zimbabwe series among them) and 2006. These can't be tested until the match is
available from another source.

**Why some are missing:** Cricsheet withholds all matches involving the Afghanistan men's team (13 Tests) under its own
policy (https://cricsheet.org/withheld-matches). So **the monthly refresh can never add a new Afghan century**. Those need
a manual source, and anything the Consequence Test needs from the match record can't be measured for them.

## 5. One person under more than one name (17 people)
For example Brian Lara ("Brian Lara" and "BC Lara"), Don Bradman ("Don Bradman" and "DG Bradman"), Mark Taylor, Michael
Clarke, Matthew Hayden. Anything that counts per player has to treat them as one. Same fix as 1.

## 6. Names still in initials (760 hundreds, 432 players)
Only the 294 most prolific players have a full name. A leaderboard of batters would show "MT Renshaw"-style names for the rest.

## 7. How the archive describes series
- 8 matches have no series information and 17 have no match number.
- The first Test of a series often carries the trophy's name and the rest carry the tour's name.
- The season is stored as text for some matches and as a number for others.

The Consequence Test already copes (it finds a series from the two teams and the dates), but it should be checked by hand
against a few well-known series.

## 8. Licence
Cricsheet's data is under the ODC Attribution licence: it can be used freely provided it is credited. The site credits
Cricsheet in the footer and on the how-it-works page; keep it that way, and repeat it on the privacy page and in any listing.

## 9. Coverage of the archive
Close to complete from about 2006, patchy for 2001 to 2005 (about half the Tests), and absent before 2001. Any measure
that needs the match record can only be run on roughly 1,700 of the 4,627 hundreds today.

## Suggested order
1. Add Cricsheet's player ID to every row (fixes 1, 5 and makes 6 safer).
2. Resolve the four result disagreements and add the missing century.
3. Re-run the audit until sections 1 to 3 are empty.
4. Only then run the Consequence Test on the whole database.
