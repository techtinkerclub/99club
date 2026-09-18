# 99 Club Studio curriculum mapping

This document is the current maintainer guide for curriculum mapping. Older coverage snapshots remain archived for traceability.

## Principle

A worksheet or puzzle should only advertise curriculum compatibility that it genuinely practises. Do not map a game to a topic merely because it uses numbers.

Mappings should distinguish between:

- **Direct content practice** — the pupil is explicitly practising the curriculum objective.
- **Supporting reasoning** — the puzzle develops mathematical reasoning, comparison, elimination or spatial thinking but is not a direct exercise of a named objective.

The UI may use broader curriculum areas for discovery, but engine-level compatibility should remain conservative.

## Current curriculum areas used by 99 Club Studio

- Number & place value
- Calculation
- Fractions
- Decimals & percentages
- Ratio & proportion
- Measurement
- Geometry
- Statistics
- Algebra & sequences

The catalogue is expected to grow. UI components should therefore support additional topics without relying on a fixed nine-item layout.

## Year ranges

Year compatibility is enforced at engine/question level where practical. New engines should define their minimum year honestly and should not generate operations, representations or terminology beyond the selected range simply to increase difficulty.

Difficulty and year are separate concepts: Challenge for a Year 3-compatible game should mean deeper reasoning within suitable mathematics, not silent use of Year 5/6 content.

## Games & Puzzles

For the current game inventory and per-engine roadmap, see [`GAMES.md`](GAMES.md).

The planned Number Towers / Skyscrapers engine should primarily be described as number-ordering/comparison plus mathematical reasoning, rather than being presented as if Skyscrapers itself were a National Curriculum objective.

## Custom Worksheets

Custom Worksheet generation uses a much finer curriculum-driven topic catalogue. When adding a new graphical or numerical question family:

1. identify the exact curriculum topic(s) it addresses;
2. constrain values/representations by year;
3. generate multiple examples and validate mathematical correctness;
4. check graphical readability in preview and PDF;
5. add regression coverage for boundary cases.

## Reference material

The repository includes `_curriculum/`, curriculum data used by the site, and historical curriculum coverage/reference documents under `docs/archive/`. Those historical files are useful evidence but are not the current roadmap.
