# Custom Worksheets — current maintainer guide

The Custom Worksheet tool is the curriculum-driven worksheet generator within 99 Club Studio. Its public entry page is `99-club-custom.md`; active JavaScript and styles are loaded from `assets/99club/`.

## Current design principles

- Teachers should begin with a clean selector rather than automatic year-based topic preselection.
- Year shortcuts, where retained, are optional conveniences rather than the primary workflow.
- Topic/category accordions remain open while items are selected or deselected.
- Categories containing selected items must be visually obvious without relying only on a numeric count.
- Teachers can remove selections individually and can clear/reset all selections in one action.
- Generated questions should be mapped to genuine curriculum topics and constrained by selected year range.
- Numerical engines and graphical engines should be modular enough to add to the curriculum catalogue without rebuilding the page.

## Graphical question families

The tool already contains substantial graphical infrastructure, including angles, coordinates, graphs and pie-chart work. Historical implementation/QA documents are retained in `docs/archive/` and older `docs/99club/` material, but current behaviour must be checked against active code rather than old stage notes.

For every graphical family, validate:

- mathematical correctness;
- suitable values and terminology for the selected year;
- readable labels and geometry;
- browser preview layout;
- generated PDF layout;
- answer rendering;
- maximum-density/long-label cases.

## File hygiene

Active Custom Worksheet modules live under `assets/99club/`. Several large `custom-*.js` files also remain at repository root from earlier development stages; the healthcheck has classified these as legacy duplicates because the public page loads the `assets/99club/` versions. They are intentionally not deleted as part of the documentation cleanup; remove or archive them only in a separate, verified code-hygiene change.

## Curriculum

See [`CURRICULUM.md`](CURRICULUM.md) for the current mapping principles. Do not use historical release notes as the curriculum source of truth.
