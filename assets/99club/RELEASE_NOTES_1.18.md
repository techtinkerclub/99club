# 99 Club Studio v1.18 — Stable Club / Custom Worksheets split

## Release intent
This release restores the 99 Club progression interface to a focused, stable workflow and moves the broader curriculum worksheet generator into its own beta workspace.

## 99 Club (stable)
- Custom Worksheet is no longer embedded in the Club challenge picker.
- The familiar scheme/challenge/rule/generate workflow is restored.
- Classic default remains 5 minutes, 3 perfect attempts, not necessarily consecutive.
- Teacher notes remain available and print only on answer sheets.
- Equivalent versions, question review/replacement, QR recreation, backups and setup import/export remain.
- The mixed-family editor exposes the traditional 99 Club families plus a restrained decimal set instead of the full curriculum catalogue.
- Existing v1.17 Custom Worksheet state is copied into the new workspace during migration before the main tool returns to a Club challenge.

## Custom Worksheets (beta)
- New dedicated route: `/tools/99-club/custom/`.
- Separate browser state from the stable Club workflow.
- Full-width curriculum workspace using the existing deterministic generator/PDF engine.
- Year-group starting selections are presented as optional starting points rather than “Quick picks”.
- Curriculum categories stay open while topics are selected/deselected and selected categories are visibly highlighted.
- Story word problems remain excluded pending a dedicated problem engine.
- Graphical/visual topics remain deferred pending dedicated renderers.

## Curriculum cleanup
- Retired `data_table_questions` from the active catalogue and disabled its question pool; its compact ID position is retained only for pre-release recreation compatibility.
- Renamed `pie_chart_angles` to “pie-chart angle calculations”; actual chart interpretation remains deferred.

## Help
- Help page no longer uses the old site banner and is styled as part of the same Studio UI.
- Main help is 99 Club first, with a clear link to the separate Custom Worksheets beta.

## Release QA
- JavaScript syntax checks pass for `app.js`, `custom-app.js`, `generator.js`, `pdf-layout.js`, `simple-pdf.js` and `qr-lite.js`.
- Smoke test passes for all 105 active families, Year 1–6 starting selections, teacher-note separation and PDF-layout invariants.
- Headless browser checks report no page errors on the stable Club or Custom Worksheets routes.
- Built-in 99 Club fixed-seed comparison against v1.17 reports 0 differences.
