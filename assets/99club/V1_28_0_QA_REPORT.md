# QA report - Games & Puzzles v1.28.0

Date: 11 September 2026

## Automated regression suite

PASS:

- Main 99 Club smoke: 105 base families + Year 1-6 profiles + progression/PDF invariants.
- Custom visual smoke: 258 coordinate entries / 43 subtypes; 592 pie entries / 37 subtypes; 416 angle entries / 104 active subtypes; mixed visual generation and marking contract.
- Custom entrypoint regression.
- Angle smoke: 24,000 deterministic questions across the 104 active angle subtypes.
- Angle visual-integrity audit: all 416 active rendered-data variants.
- Games smoke: 23 engine definitions, 22 selectable one-player engines, 591 curated vocabulary entries, hidden-Domino boundary, empty-selection behaviour and personalisation normalisation.
- Arithmetic expansion stress: 23,400 deterministic activities + 5,360 topic-routing activities + engine-specific invariants across the 13 v1.27 arithmetic/algebra engines.
- Numeric-logic stress: 918 deterministic activities plus uniqueness/invariant checks across Kakuro, Futoshiki, Arithmetic Cages, Nonograms and Number Paths.

## Numeric-logic validation

- Kakuro: run sums match, digits do not repeat within runs, and the published puzzle has one solution under its clue/starter-digit set.
- Futoshiki: Latin-row/column constraints and inequalities are validated; solution count = 1.
- Arithmetic Cages: cage arithmetic is validated; row/column constraints hold; solution count = 1.
- Nonogram: generated row/column clues exactly reproduce the solution; solution count = 1.
- Number Path: every consecutive pair is edge-adjacent; clue set yields one path solution.

## UI / personalisation contract

Static/runtime contract checks cover:

- five accordion categories;
- selected-category visual state and counts;
- category select/clear and global Clear all;
- selected-games tray;
- Configure/Done collapse without deleting saved engine settings;
- optional pack title, school name, class/year, date and local logo;
- pupil / answers / combined PDF actions retained;
- Arithmetic Domino Chain excluded from the selectable one-player catalogue.

## PDF render verification

A personalised fixed-seed numeric-logic pack was generated as pupil, answer and combined PDFs and rendered to PNG for inspection. Checked:

- personalised school/title/date header;
- logo placement path;
- Kakuro clue cells and starter digits;
- Futoshiki grids and inequalities;
- Arithmetic Cage outlines/targets;
- Nonogram run clues and grid legibility;
- Number Path anchors;
- worked-example page layout;
- no clipping/overflow in the inspected pupil pages.

## Known design note

The current Kakuro engine is intentionally a primary-friendly **Cross Sums derivative**. Some generated boards require a small number of starter digits to guarantee one solution. This is stated in the engine options/notes rather than claiming every generated board is a traditional clue-only newspaper Kakuro.
