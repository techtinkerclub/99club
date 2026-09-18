# 99 Club Studio — Custom Worksheets v1.21 patch

Date: 10 September 2026

## Apply this patch when

Apply v1.21 on top of the accepted **v1.20 Custom Worksheets** repository/patch. It adds Year 6 Pie Charts and the restrained shared visual palette. It does not replace or modify the stable public 99 Club generator path.

## Added

- `assets/99club/custom-piecharts.js`
- `assets/99club/RELEASE_NOTES_1.21.md`
- `docs/99club/PIE_CHARTS_STAGE1_README.md`
- `docs/99club/PIE_CHARTS_STAGE1_QA.md`
- `docs/99club/PIE_CHARTS_STAGE1_IMPLEMENTATION.json`

## Updated

- `_pages/99-club-custom.md` — loads Pie Charts before the Custom app.
- `_pages/99-club-help.md` — documents generated Year 6 pie charts.
- `assets/99club/custom-app.js` — v1.21 copy/version only; no return of year preselection.
- `assets/99club/custom-graphs.js` — shared visual palette, pie answer footprint allowance and generic SVG/PDF polygon drawing support.
- `assets/99club/custom-coordinates.js` — consumes the restrained shared palette; coordinate mathematics/subtype catalogue unchanged.
- `assets/99club/CURRICULUM_COVERAGE.md` and `README.md`.
- `assets/99club/tests/custom-visual-smoke.js`.

## Teacher-facing Pie Charts choices

- **pie charts — interpret & construct**
- **pie charts — reasoning & problem solving**
- **pie-chart reasoning (extension)**

Custom Worksheets still starts with no topics selected. Teachers opt into any of these explicitly.

## Deployment check

After replacing the patch files, hard-refresh `/tools/99-club/custom/`. Confirm the page opens blank, open Statistics, select Pie Charts, generate a pupil/answer sheet, and inspect at least one construction question. Then generate a mixed sheet with a bar/line graph and coordinates to confirm the restrained colour palette looks sensible on the browser/printer used by the school.
