# QA report - Custom Worksheets Coordinate Geometry Stage 1

Date: 10 September 2026

## Automated checks

PASS - JavaScript syntax checks:
- `generator.js`
- `simple-pdf.js`
- `pdf-layout.js`
- `custom-graphs.js`
- `custom-coordinates.js`
- `custom-app.js`

PASS - existing 99 Club smoke suite:
- 105 families;
- Year 1-6 starting selections;
- progression/PDF invariants.

PASS - coordinate pool structure:
- Y4: 60 entries / 10 stable subtypes;
- Y5: 48 entries / 8 stable subtypes;
- Y6: 72 entries / 12 stable subtypes;
- unique stable keys within every pool;
- every coordinate visual passes grid-bound validation.

PASS - deterministic generation:
- repeated generation with identical rules + seed returns identical questions;
- same-subtype replacement remains within the exact coordinate subtype and changes the instance.

PASS - 1,000-seed property pass for each coordinate family:
- exact requested question count;
- correct family/subtype metadata;
- non-empty prompts/answers;
- no duplicate keys within generated sheets;
- all plotted points/polygons remain within the intended grid;
- all stable subtypes are reached.

PASS - graphical Statistics Stage 1 regression:
- Y3 bar charts: 68 entries / 17 subtypes;
- Y4 bar charts: 116 / 29;
- Y4 time graphs: 44 / 11;
- Y5 line graphs: 80 / 20;
- Y6 line graphs: 104 / 26.

PASS - mixed generator stress:
- 100 seeded 60-question mixes containing text arithmetic + bar charts + time graphs + Y4 coordinates;
- all requested families remained represented;
- coordinate visuals remained valid.

PASS - PDF/preview integration:
- coordinate-only pupil + answer sheets use the visual multi-page compositor;
- mixed text + chart + coordinate generation works through the same compositor;
- portrait Y4/Y5/Y6 sample PDFs generated successfully;
- landscape Y6 sample PDF generated successfully.

## Render-first visual QA

Representative PDF pages were rendered to PNG and visually inspected.

Checked:
- first-quadrant axes, ticks and labels;
- four-quadrant axes and negative labels;
- point labels;
- missing rectangle/parallelogram/rhombus structures;
- translation source/image distinction;
- Year 5 vertical/horizontal reflection lines;
- Year 6 x/y-axis reflection;
- pupil working lines;
- teacher answer overlays;
- page headers, footers and page packing;
- portrait and landscape output.

A compact Year 6 answer-grid origin label was adjusted during QA so it no longer crowds the negative x-axis tick labels.

No clipping, broken glyphs or geometry outside the plotted grid was found in the inspected final renders.

## Environment limitation

A full Chromium interaction test of the temporary local page could not be executed because this QA environment blocks Chromium navigation to local/file URLs. The browser-independent generator, registry, preview-SVG and PDF paths were exercised directly, and the existing repository smoke suite passes. The hidden Custom Worksheet page should still receive a normal deployed-browser click-through before public promotion, matching the Stage 1 graphical statistics release process.
