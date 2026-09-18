# Custom Worksheets — Coordinate Geometry Stage 2

Version: 0.2.0  
Date: 10 September 2026

## What changed

Stage 2 keeps the Stage 1 coordinate IDs stable and extends the same deterministic visual engine after reviewing additional Corbettmaths, MathSphere and historical KS2 coordinate material.

### Normal curriculum-facing families

- `coordinates_y4` — 12 stable subtypes / 72 pool entries
- `transformations_y5` — 9 stable subtypes / 54 pool entries
- `coordinates_y6` — 18 stable subtypes / 108 pool entries

New structures include labelled-point lookup, same-displacement endpoint reasoning, reflected coordinate sets about offset axis-parallel mirror lines, four-quadrant plotting-error diagnosis, plot/join/name construction, kite completion, reflection sign reasoning and four-quadrant reflection-pattern completion.

### Explicit extension family

`coordinates_extension` — 4 stable subtypes / 24 pool entries:

- midpoint from two endpoints;
- centre of a rectangle;
- equally spaced points on a coordinate line;
- 90° point rotation about a centre.

These are deliberately separated from the normal Year 4–6 families. Their presence in historical/booster material is useful for worksheet variety but is not treated as authority to widen the normal statutory coordinate selection.

## Custom Worksheet workflow change

The Custom Worksheet now starts with **zero topics selected**. The former Year 1–6 and Core 4 quick-select row is removed. Teachers can select any combination of curriculum families manually, clear one category, or clear all selections. The optional Year generation profile adjusts age-sensitive number/range behaviour only and never chooses content.

Accordion state is explicit: selecting/deselecting a topic does not collapse its category, and selected categories do not auto-open after a teacher closes them.

## Architecture

- Coordinate maths and SVG/PDF drawing remain isolated in `assets/99club/custom-coordinates.js`.
- Shared visual page packing remains in `assets/99club/custom-graphs.js`.
- `custom-graphs.js` no longer observes or rewrites the Custom Worksheet DOM; UI copy is owned by `custom-app.js`.
- Blank family-mix rules are now a valid editing state in `generator.js`; public 99 Club fixed-seed generation remains unchanged.

## Source policy

The source sheets are used to identify mathematical structures and pupil actions. Wording, artwork and page layouts are not copied. Statutory/project curriculum mapping remains the authority for normal year-facing families. Historical/booster-only structures are kept separate where appropriate.
