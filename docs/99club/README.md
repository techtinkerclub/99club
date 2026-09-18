# 99 Club Studio — current maintainer guide

This document describes the current application structure. Historical release notes and patch instructions are archived separately and should not be treated as current implementation guidance.

## Applications

99 Club Studio currently has three closely related tools:

1. **99 Club** — timed arithmetic sheets.
2. **Custom Worksheets** — curriculum-driven worksheet generation with numerical and graphical question engines.
3. **Maths Games & Puzzles** — printable puzzle packs with independent game engines, preview, answer sheets and PDF export.

The live Games page is `_pages/99-club-games.md`. The Custom Worksheet public entry page is `99-club-custom.md`, with its implementation under `assets/99club/`.

## Games architecture

The Games implementation is deliberately modular:

- `games-engine.js` coordinates settings, compatibility and pack generation.
- `games-arithmetic.js` contains many arithmetic/number-structure puzzle generators.
- `games-number-logic.js`, `games-number-path-v2.js`, `games-sumplete.js`, `games-property-maze.js` and related modules contain specialist engines.
- `games-app.js` renders the browser UI and preview.
- `games-pdf.js` is the core PDF exporter.
- Later layout/redesign modules are loaded explicitly by `_pages/99-club-games.md`; keep the asset chain there in sync when adding or replacing a module.
- `tests/` contains current regression tests. Historical tests that encode superseded versions/layouts belong in `tests/archive/` and must not gate current releases.

See [`GAMES.md`](GAMES.md) for the engine catalogue and active roadmap.

## Release discipline

For changes to Games & Puzzles:

- Work on a branch and keep the generator, browser preview, answer preview and PDF renderer aligned.
- A visual redesign is not complete until it is visible in generated PDFs as well as browser preview.
- Do not change working generation logic merely to satisfy a stale version-specific test.
- Prefer invariant tests (valid solution, unique solution, no overflow, correct number of blanks/code slots) over exact internal version or cache-string assertions.
- Test Easy, Standard and Challenge plus relevant manual variants and maximum-size layouts.
- For graphical engines, include pupil preview, answer preview and PDF in QA.
- Remove temporary one-shot QA workflows before merge.

## Known next work

The current queued Games fixes and next engine are maintained in [`GAMES.md`](GAMES.md). Do not reconstruct the roadmap from old release notes.

## Documentation rule

Current maintainership information belongs under `docs/`. Root Markdown should be limited to intentional live Jekyll pages plus the repository `README.md`.
