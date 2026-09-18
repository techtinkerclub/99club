# Custom Worksheets - Coordinate Geometry Stage 1

Version: 0.1.0  
Date: 10 September 2026

## Purpose

This stage adds deterministic graphical coordinate questions to the hidden Custom Worksheets workspace while leaving the public 99 Club generator unchanged.

It builds on the Graphical Statistics Stage 1 visual worksheet compositor rather than creating a second page/PDF system. Coordinate mathematics and rendering live in a separate module, `assets/99club/custom-coordinates.js`.

## Curriculum scope

### Year 4 - Coordinates & translation

First-quadrant work only:
- read coordinates;
- distinguish x/y coordinate order;
- plot a point;
- plot points and complete a polygon;
- find a missing polygon vertex;
- translate points and polygons horizontally/vertically;
- translate a polygon so a specified vertex reaches a target;
- describe a shown translation;
- give translated vertex coordinates.

Curriculum anchor: Y4 position and direction / Ready-to-progress 4G-1.

### Year 5 - Reflection & translation

First-quadrant transformations:
- translate a shape;
- describe a translation;
- reflect in horizontal/vertical lines parallel to the axes;
- find a reflected vertex;
- describe a reflection;
- identify whether a shown transformation is a reflection or translation;
- reason that translation/reflection preserves the shape and its dimensions.

Curriculum anchor: Y5 position and direction.

### Year 6 - Four-quadrant coordinates & transformations

Full coordinate plane:
- read and plot coordinates in all four quadrants;
- distinguish signed x/y order;
- find missing vertices of rectangles, parallelograms and rhombuses;
- reason about a missing coordinate component;
- translate shapes across quadrants;
- describe translations;
- reflect shapes in the x-axis or y-axis;
- find reflected point coordinates.

Curriculum anchor: Y6 position and direction.

## Deliberate boundaries

The source review contains useful structures involving midpoint, coordinate sequences, map grids, rotation and more advanced transformation language. They are not silently included in the default year profiles in this stage. The statutory curriculum remains the coverage authority; external worksheets and historical assessments are used to identify useful mathematical structures, not to widen the curriculum or copy wording/artwork.

Rotation remains outside this coordinate release. Angle/shape work is reserved for its own visual module.

## Architecture

The module registers three visual curriculum families:
- `coordinates_y4`
- `transformations_y5`
- `coordinates_y6`

It also registers a shared visual renderer under `TT99VisualRenderers.coordinate`. The existing Graphical Statistics renderer now dispatches unknown visual types through that registry. This lets chart and coordinate questions share:
- deterministic generation;
- multi-page preview;
- PDF composition;
- S/M/L/XL footprints;
- answer overlays;
- same-subtype question replacement;
- mixed text + visual worksheets.

The old text coordinate families are retained for saved-sheet compatibility but are marked as text-only fallbacks in the Custom Worksheets workspace, so Year quick-picks do not select both text and visual coordinate versions.

## Stable subtype catalogue

30 stable coordinate subtypes are implemented:
- Year 4: 10 types, 60 deterministic pool entries;
- Year 5: 8 types, 48 deterministic pool entries;
- Year 6: 12 types, 72 deterministic pool entries.

Each question stores the curriculum-facing family, stable subtype ID, deterministic key, prompt, answer, visual model, marking metadata and layout footprint.

## Visual rules

- Year 4/5: 0-10 first-quadrant grids with unit intervals.
- Year 6: -6 to 6 four-quadrant grids with unit intervals and labels every 2 units.
- x/y unit scaling is mathematically equal.
- student and answer diagrams are generated from the same coordinate model.
- teacher answer overlays use a distinct line/point treatment but remain understandable without relying on colour alone.
- transformed/reference shapes use a dashed treatment where useful.
- reflection lines are explicit and labelled.
- all plotted geometry is validated against grid bounds before release testing.

## Files changed by the coordinate-only delta

Add:
- `assets/99club/custom-coordinates.js`

Modify:
- `assets/99club/custom-graphs.js` - external visual renderer dispatch + coordinate-aware Custom Worksheet copy/layout note.
- `_pages/99-club-custom.md` - load the coordinate module and bump `custom-graphs.js` cache version.

No coordinate-stage changes are made to:
- `assets/99club/generator.js`
- `assets/99club/pdf-layout.js`
- `assets/99club/simple-pdf.js`
- the public `/tools/99-club/` page.

## Reference sources used

Primary authority:
- Department for Education, National Curriculum in England: mathematics programmes of study.
- Department for Education, Mathematics guidance: key stages 1 and 2, including the 4G-1 coordinate-grid examples and coordinate-order guidance.
- Primary Maths Generator curriculum mapping and question-generator matrix saved in the project Library.

Question-structure references:
- `CoordinatesAngles-1.pdf` (SATs Papers Guide collection).
- Historical KS2 SATs Maths reference pack and topic indexes.
- Kirkburton Middle School past SATs questions by topic index.
- Primary Maths Generator master reference index.

The project source policy is followed: reproduce mathematical structures, not copyrighted wording, artwork or page design.
