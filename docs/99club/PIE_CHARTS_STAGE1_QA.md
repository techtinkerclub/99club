# QA — Pie Charts Stage 1 / 99 Club Studio v1.21

Date: 10 September 2026

## Automated checks — PASS

- JavaScript syntax checks for generator, Custom app, graph renderer, coordinate renderer, pie renderer and PDF components.
- Existing base `tests/smoke.js`.
- Expanded `tests/custom-visual-smoke.js`.
- Existing graph pool counts unchanged: Y3 bar 68/17; Y4 bar 116/29; Y4 time 44/11; Y5 line 80/20; Y6 line 104/26.
- Existing coordinate pool counts unchanged: Y4 72/12; Y5 54/9; Y6 108/18; Extension 24/4.
- Pie pools: Core Y6 84/21; Reasoning Y6 44/11; Extension 20/5.
- Every pie pool key is unique and pool-index/key recreation round-trips.
- All 164 rendered pie specifications across the 148 pool questions have positive sectors summing to exactly 360 degrees within numerical tolerance.
- Where an exact total/count model is present, counts, percentages and angles are checked against the same total.
- 1,000 deterministic generation seeds per pie family: 72,000 generated questions checked with no short generation and repeat output identical for the same seed.
- Same-subtype replacement is checked for pie questions.
- Pupil, answer and combined PDF document construction succeeds for all three pie families in portrait and landscape.
- Mixed sheets containing arithmetic + bars + time/line graphs + coordinates + pie charts continue to generate.
- Shared restrained visual palette is registered and preview output contains actual colour fills.
- `pie_chart_angles` remains available but is marked Extension/text fallback.

## Regression boundary — PASS

Compared against the full v1.20 repository. These public/stable files are byte-for-byte unchanged:

- `_pages/99-club.md`
- `assets/99club/app.js`
- `assets/99club/generator.js`
- `assets/99club/pdf-layout.js`
- `assets/99club/simple-pdf.js`
- `assets/99club/qr-lite.js`
- `assets/99club/99club.css`

The new pie script is loaded only by `_pages/99-club-custom.md`.

## Visual inspection

Representative pupil and answer PDFs were rendered and inspected for:

- Core interpretation;
- construction circles;
- two-chart comparison;
- estimation;
- reasoning/explanation;
- Extension money/scoring/fraction questions;
- answer-key legend spacing.

A context-title mismatch found during visual inspection (`Sandwich choices` paired with generic reading-choice labels) was corrected by adding explicit named datasets for context-specific questions.

## Browser environment limitation

The container's Chromium process does not terminate reliably when navigating local `file://` or localhost test pages, so an end-to-end DOM click-through could not be certified here. This is an environment limitation, not a detected JavaScript page error. The module has instead been exercised through the same generator/SVG/PDF functions used by the Custom Worksheet route. A hard-refresh browser deployment check is still recommended.
