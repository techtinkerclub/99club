# 99 Club Studio — v1.21 release notes

Date: 10 September 2026

## Custom Worksheets — Year 6 Pie Charts

v1.21 adds a dedicated generated Pie Charts subsystem to `/tools/99-club/custom/`. The normal Year 6 curriculum family remains separate from opt-in reasoning and 11+/cross-topic Extension material.

Teacher-facing families:

- **pie charts — interpret & construct** — 21 stable subtypes / 84 deterministic pool entries;
- **pie charts — reasoning & problem solving** — 11 / 44;
- **pie-chart reasoning (extension)** — 5 / 20.

Total: **37 stable pie-chart subtypes / 148 deterministic pool entries**.

The generated questions include qualitative sector comparison, fraction/percentage/angle interpretation, counts from totals, totals from known sectors, missing information, combined/all-other categories, differences, linked frequency/angle tables, mixed true/false statements, estimation, two-chart comparison, changed totals, merged-chart reasoning and accurate construction from frequency/percentage data.

The Extension family contains cross-representation and cross-topic structures such as pie-to-bar conversion, percentage/money contexts, external scoring rules and fraction arithmetic. These are deliberately not presented as ordinary statutory Year 6 Pie Charts content.

## Dedicated pie renderer

`custom-piecharts.js` owns the mathematical model and SVG/PDF renderer for pie questions. It supports:

- exact sectors generated from one canonical count/proportion model;
- direct sector labels plus a legend;
- fraction, percentage and central-angle annotations;
- linked tables and answer tables;
- two-pie comparison layouts;
- exact and estimate marking modes;
- pupil-state and answer-state rendering from the same data;
- large blank/partially-started circles for construction questions.

## Restrained visual colour

Custom graphical questions now use a shared six-colour palette (teal, amber, blue, coral, purple and green). The change is intentionally restrained:

- single-series bar charts may distinguish categories by colour;
- multi-series charts keep a stable series colour;
- pie sectors use the same palette;
- coordinate original/image/target/mirror cues are easier to distinguish.

Colour is supplemental. Labels, axes, geometry, relative position and chart structure still carry the mathematical meaning.

## Compatibility

The older direct `pie_chart_angles` family remains readable for saved setups/recreation, but is moved to Extension and labelled as text-only angle practice. New curriculum-facing Pie Charts work uses the visual families.

The public `/tools/99-club/` page, `app.js`, `generator.js`, `pdf-layout.js`, `simple-pdf.js`, QR implementation and public CSS are unchanged from v1.20. The new scripts continue to load only on the Custom Worksheets route.
