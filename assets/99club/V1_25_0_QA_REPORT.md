# 99 Club Studio v1.25.0 QA report

## Automated regression — PASS

- `node assets/99club/tests/smoke.js`
- `node assets/99club/tests/custom-visual-smoke.js`
- `node assets/99club/tests/angles-smoke.js`
- `node assets/99club/tests/angles-visual-integrity.js`
- `node assets/99club/tests/custom-entrypoint-smoke.js`
- `node assets/99club/tests/games-smoke.js`
- JavaScript syntax checks for `games-engine.js`, `games-app.js`, `games-pdf.js`

## Existing generator counts retained

- Base registered families: 105
- Coordinates: 258 entries / 43 subtypes
- Pie Charts: 592 entries / 37 subtypes
- Angles: 416 entries / 104 active subtypes
- Curated maths vocabulary: 591 entries

## Magic Squares validation

The smoke suite exercises Years 1–6, Easy / Standard / Challenge, and each explicit Magic Square derivative:
- fill missing values;
- find magic total;
- spot & fix an error;
- transform the square.

Checks include:
- deterministic output for identical settings + seed;
- 3×3 / 4×4 size validity;
- every generated solution has identical row, column and main-diagonal sums;
- generated `magicSum` matches every line;
- missing-value masks are uniquely determined under the shown magic-total equations (`rank == hidden cell count`);
- repair puzzles are genuinely non-magic before correction and expose correction metadata;
- transform source and result squares are both mathematically valid;
- direct pupil / answer / combined PDF generation draws the Magic Square grids.

A separate stress pass generated 1,800 automatic Magic Square puzzles across all Years 1–6 and all three difficulty bands with zero invalid squares detected.

## Vocabulary enumeration

Regression checks cover:
- `right angle` → `(5, 5)`;
- `right-angled triangle` → `(5-6, 8)`;
- generated Crossword entries carry enumeration derived from their term.

## Worked examples

All four current game engines expose the common worked-example contract. The PDF exporter paginates worked examples at up to two per introductory page.

## Visual inspection

Representative Magic Square pupil/answer PDFs were rasterised and visually inspected, including:
- 3×3 missing values;
- find-the-total;
- spot-and-fix;
- 4×4 transform layout;
- multi-game worked-example pages.
