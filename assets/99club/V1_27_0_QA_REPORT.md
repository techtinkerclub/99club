# 99 Club Studio v1.27.0 — QA report

Date: 11 September 2026

## Automated regression

PASS:

- Public 99 Club smoke: **105 base families** plus Years 1–6 generation profiles and PDF invariants.
- Custom visual smoke: **258 coordinate entries / 43 subtypes**, **592 pie entries / 37 subtypes**, **416 angle entries / 104 active angle subtypes**.
- Angles deterministic smoke: **24,000 generated questions**.
- Angles visual-integrity audit: **416 rendered-data variants**; six unresolved archetypes remain intentionally held back.
- Custom entrypoint regression.
- Games smoke: **18 engines**, **591 curated vocabulary records**, strict topic-safe vocabulary, Magic Square reasoning and full Sudoku.

## Arithmetic expansion stress

PASS:

- **23,400 deterministic base activities** across all 13 new numerical/arithmetic/algebraic engines, Years 1–6 and Easy / Standard / Challenge profiles.
- **8,080 year/topic-routing activities** to confirm broad wrappers consume only the selected compatible topic.
- Deep invariant checks for:
  - Arithmagon edge rules;
  - Magic Number Shape line totals;
  - Correct-Answer Maze orthogonal route integrity and distractor safety;
  - Maths Crossnumber connectivity and digit agreement;
  - Number Trail sequence rules;
  - Target Number and Broken Calculator solution presence;
  - Symbol Equation unknowns;
  - Domino-chain continuity;
  - Missing Operations unique operator solution;
  - Number Wheel / Factor Flower / Diamond relationships;
  - Function Machine stage and row validity;
  - Balance Equation answer validity.

## PDF stress

PASS: **117 generated PDF documents** covering every new engine at 1, 2 and 3 activities per page, in pupil, answer-key and combined forms.

## Visual QA

The final pupil showcase was raster-rendered and reviewed page-by-page across all 13 new engines and all three difficulty levels. A separate worked-example PDF was raster-rendered and reviewed.

Issues found and corrected during visual QA included:

- Correct-Answer Maze originally resembled a junction list more than a real maze; redesigned as an answer-path grid.
- 9-question Challenge Maze text could overflow a three-activity PDF panel; the question column now scales to its available height.
- Number Wheels / Factor Flowers / Diamonds were redesigned from list-like output into diagram-led layouts.
- Worked-example body text was enlarged after review because the original generic arithmetic examples were unnecessarily small.

## Remaining interpretation note

These games are printable practice formats, not separate statutory curriculum objectives. Year/topic filters constrain the mathematical content; the puzzle mechanic itself should not be described as a statutory topic.
