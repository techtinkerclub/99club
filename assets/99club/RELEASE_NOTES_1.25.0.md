# 99 Club Studio v1.25.0 — Magic Squares & richer worked examples

Release date: 11 September 2026

## Maths Games & Puzzles

Adds a fourth reusable game engine: **Magic Squares**.

Teacher options:
- difficulty: Easy / Standard / Challenge;
- size: Auto / 3×3 / 4×4;
- puzzle style: Mixed variants / Fill missing values / Find the magic total / Spot & fix the error / Transform the square;
- number pattern: Auto / classic / shifted consecutive / scaled arithmetic sequence / decimal sequence (Y4+);
- clue density: More / Balanced / Fewer.

Generated variants are deterministic and validated. Missing-value puzzles use line-equation rank checks so the hidden values are uniquely determined by the shown clues and magic-total constraints. The transform variant applies the same addition or multiplication to every entry and asks pupils to complete the transformed square and determine its new magic total.

## Vocabulary clue enumeration

Crossword clues now show answer lengths automatically, for example `(5, 5)` for a two-word answer. Definitions-only Word Searches show the same pattern when the hidden term contains multiple words or a hyphen. Enumeration is derived from the term at render time rather than stored in the definition database.

## Worked examples

Worked examples are expanded into pupil-facing mini tutorials with:
- a clear goal;
- rules;
- worked steps;
- a practical tip;
- a common mistake / watch-out.

Examples are now laid out at up to two games per introductory page, so larger game libraries can add several worked-example pages at the start of a pupil pack without shrinking every example into an unreadable tile.

## Compatibility

No changes to the public 99 Club maths engine, Custom Worksheet question families, coordinate/pie/angle generators, or the 591-entry curated vocabulary database.
