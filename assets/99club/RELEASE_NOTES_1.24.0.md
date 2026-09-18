# 99 Club Studio v1.24.0 — vocabulary games, worked examples and selective review

Release date: 11 September 2026

## Games & Puzzles

- Replaces the small inline vocabulary bank with the curated UK-primary database: **591 term/definition records** mapped by year/topic/subtopic.
- Adds **Maths Crossword** as the third printable game engine. Crossword and Word Search share the same vocabulary provider, including teacher-local custom vocabulary.
- Adds a common **Worked examples** pack option: none, or a front page containing one worked example for each selected game engine.
- Adds preview review controls modelled on Custom Worksheets:
  - ↻ on a whole activity replaces only that game item with another of the same engine/settings;
  - ↻ beside a Word Search clue replaces only that term + definition pair, keeps the other selected terms, and rebuilds the grid to fit the replacement.
- Manual review controls are preview-only and never print.

## Word Search directions

Word direction is now independently configurable rather than being hidden inside difficulty:

- **Auto for difficulty** — Easy uses left→right/top→bottom; Standard adds diagonals; Challenge permits all eight directions including backwards/upwards.
- **Left→right + top→bottom**
- **Straight + diagonals**
- **Any direction including backwards**

This keeps difficulty and direction related by sensible defaults while still letting a teacher override the puzzle mechanics.

## Vocabulary

- Built-in vocabulary is externalised to `assets/99club/games-vocabulary.js` rather than being buried in `games-engine.js`.
- Ratio & proportion is exposed as a Games topic for Year 6.
- Extension vocabulary is excluded from normal automatic Easy/Standard selection and becomes available in Challenge.
- Teacher-added vocabulary remains local/private and is still importable/exportable.

## Regression boundary

Public 99 Club maths generation, Custom Worksheet maths, graph/coordinate/pie/angle generators and the 104 active graphical-angle subtypes are unchanged by this release.
