# 99 Club Studio v1.23.0 — Maths Games & Puzzles foundation

Release date: 11 September 2026

## Maths Games & Puzzles

Adds a new public route at `/tools/99-club/games/` and a **Games & puzzles** button in the main 99 Club Studio hero.

The first public release is deliberately built around reusable engines rather than hard-wiring game formats to individual curriculum objectives:

- **Game engine** — creates the printable puzzle structure.
- **Maths content provider** — supplies suitable content for the selected year range/topic.
- **Applicability rules** — decide which engines are sensible for the chosen maths.

Teachers can choose:

- Year 1–6 range;
- one or more broad maths topics;
- Easy / Standard / Challenge difficulty;
- 1–6 sheets;
- 1–3 activities per sheet;
- a mixed pack of suitable engines or repeated copies of one game type;
- pupil pages only or pupil + teacher answer pages.

The first two engines are:

1. **Maths Word Search** — 128 built-in maths-vocabulary entries across the broad primary strands. Easy/Standard can show a word bank; Challenge can use mathematical definitions as clues so pupils must identify the term before finding it.
2. **Number Pyramid** — curriculum-scaled integer addition/inverse-reasoning pyramids. Missing-cell masks are checked so the remaining clues uniquely determine the completed pyramid.

Printing uses the browser's native **Print / Save PDF** route and has A4-specific layout rules, including density safeguards for several activities on one sheet.

## Personal vocabulary

Word Search supports **My vocabulary** alongside the curated built-in catalogue.

- personal term + definition pairs are stored only in the teacher's browser;
- built-in and personal counts are displayed separately by topic;
- personal entries can be added/deleted without modifying the shared public catalogue;
- teachers can export/import their personal vocabulary as a JSON file;
- the Games UI contains no upload/network code for personal vocabulary.

## Custom Worksheets — angle taxonomy

The eight reliability-reviewed graphical angle families remain unchanged mathematically (**104 active subtypes / 416 deterministic variants**) but now belong to the existing **Geometry** accordion instead of appearing as a separate `Angles & turns` curriculum category.

The old text-only angle fallbacks remain in Extension to avoid confusing duplicate mainstream choices.

## Regression protection

Adds a Games smoke test covering:

- deterministic Word Search generation across every supported topic/year/difficulty;
- word placement integrity;
- deterministic Number Pyramids and sum invariants;
- mixed/same-game pack behaviour;
- applicability filtering;
- local vocabulary sanitising/source distinction;
- public Games route and main-page link;
- Geometry-only graphical angle taxonomy.

Existing 99 Club, Custom visual, Angles, visual-integrity and Custom-entrypoint regression tests continue to pass.
