# QA — Custom Worksheets Coordinate Stage 2 / v1.20

Date: 10 September 2026

## Automated checks

PASS:

- `node --check` for `generator.js`, `custom-app.js`, `custom-graphs.js`, `custom-coordinates.js`;
- existing base `tests/smoke.js`;
- new `tests/custom-visual-smoke.js`;
- blank Custom Worksheet normalises to zero selected families and safely returns zero internal questions;
- no Year/Core quick-select controls remain in `custom-app.js`;
- Clear-all and per-category clear controls are present;
- selected categories no longer auto-open themselves;
- the graph module contains no `MutationObserver` and no longer rewrites host UI copy;
- Graphical Statistics pool counts remain unchanged: Y3 bar 68/17 types; Y4 bar 116/29; Y4 time 44/11; Y5 line 80/20; Y6 line 104/26;
- coordinate pools: Y4 72/12 types; Y5 54/9; Y6 108/18; Extension 24/4;
- every coordinate visual model passes bounds validation;
- 1,000 generated seeds per coordinate family complete without short generation; deterministic repeat checks pass;
- 100 mixed 60-question generation runs using text + graph + all coordinate families complete successfully;
- visual preview generation and visual PDF document construction complete in portrait and landscape for all four coordinate families;
- fixed-seed comparison against the supplied stable pre-visual baseline: 150 Classic/alternative/post-99 cases, 0 differences.

## Manual deployment checks still recommended

After GitHub Pages deployment:

1. Open `/tools/99-club/custom/` with a hard refresh.
2. Confirm it opens with no topics selected on a fresh setup.
3. Open Geometry, select several topics, and verify Geometry remains open.
4. Close Geometry and verify it stays closed after selections elsewhere.
5. Use `Clear selected in Geometry` and then `Clear all selections`.
6. Generate mixed text + chart + coordinate questions in portrait and landscape.
7. Check pupil and answer PDFs on the browser/printer normally used by the school.
