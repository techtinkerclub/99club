# 99 Club Studio v1.24.2 QA report

## Scope
Printer-friendly Maths Crossword house-style patch only. No new curriculum content or game engine was introduced.

## Crossword rendering checks
- Browser renderer outputs only active answer cells with explicit row/column positions.
- No browser blocked-cell elements are generated.
- Crossword data is trimmed to the exact occupied footprint.
- Direct PDF renderer draws only white answer cells with thin outlines.
- No solid black/grey inactive cells or enclosing crossword square are drawn in the PDF.
- Teacher answer output uses the identical footprint with letters filled in.
- Representative 1-, 2- and 3-crossword pupil pages were generated and raster-inspected.
- Representative teacher-answer page was generated and raster-inspected.

## Regression suite — PASS
- `node assets/99club/tests/smoke.js`
- `node assets/99club/tests/custom-visual-smoke.js`
- `node assets/99club/tests/angles-smoke.js`
- `node assets/99club/tests/angles-visual-integrity.js`
- `node assets/99club/tests/custom-entrypoint-smoke.js`
- `node assets/99club/tests/games-smoke.js`
- JavaScript syntax checks for `games-engine.js`, `games-app.js`, `games-pdf.js`

## Preserved regression counts
- Base registered families: 105
- Coordinates: 258 entries / 43 subtypes
- Pie Charts: 592 entries / 37 subtypes
- Angles: 416 entries / 104 active subtypes
- Curated Games vocabulary: 591 entries

## Deployment
Apply directly over v1.24.1 and hard-refresh `/tools/99-club/games/` after deployment. Cache versions for the changed Games assets are bumped in `_pages/99-club-games.md`.
