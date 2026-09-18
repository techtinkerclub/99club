# Angles & Turns Stage 1 — v1.22.2 QA record

Version: 1.22.2

## Why this QA revision exists

v1.22 passed deterministic/numeric tests but failed the more important visual-semantic standard on several sampled angle diagrams. v1.22.2 retains a release gate that asks whether the **rendered pupil problem itself is complete, unambiguous and mathematically faithful**.

## Automated checks

- JavaScript syntax checks for all changed Custom modules.
- Existing 99 Club base smoke test passes.
- Existing Custom visual smoke test passes with graph, coordinate and pie-chart counts unchanged.
- Dedicated Angles smoke test validates **104 active subtype IDs / 416 pool entries**.
- 24,000 deterministic generated angle questions exercised.
- All **416 deterministic rendered-data variants** pass the dedicated `angles-visual-integrity.js` semantic audit.
- Every prompt containing a named two-letter line is checked for visible endpoint labels.
- Named point/angle references are checked for corresponding visible labels where required.
- Route/turn target direction is checked against the actual generated turn.
- Structural markings are checked for right triangles, equilateral triangles, rhombi and kites.
- Irregular-polygon tasks are checked to ensure the rendered polygon is actually non-regular.
- Y4 largest/smallest polygon answers are checked against calculated geometry.
- The six unresolved v1.22 archetypes are asserted inactive.
- Estimation questions retain explicit single-best-answer MCQ marking.
- Physical measurement/construction retains explicit ±2° tolerance.
- Bar/line SVG output retains vertically centred y-axis titles.
- Rubric/response-space contract remains active.

## Full visual audit

A one-question-per-active-subtype pupil PDF was generated: **104 questions across 46 pages**. The full set was rasterised and visually inspected, rather than sampling only a few representative families.

The rebuild specifically corrected:

- labels placed on top of rays/edges/arcs;
- prompts referring to AB/AD/PQ/etc. without visible endpoints;
- variable angle values drawn against fixed line geometry;
- answer-leaking turn diagrams;
- incorrect route-target direction;
- right/equilateral/rhombus/kite structural markings;
- arbitrary quadrilateral values drawn on a parallelogram;
- regular-looking geometry used for an explicitly irregular polygon;
- ambiguous two-item ordering-error wording;
- generic diagrams that did not support the stated relationship.

## Release rule

A mathematically correct stored answer is **not sufficient**. An active visual question must also be a fair, self-contained pupil problem after rendering. Any subtype that cannot meet that requirement is held back.

## v1.22.2 additional visual checks

- Protractor renderer source is regression-checked for 1° graduations with 5° hierarchy.
- The withdrawn detached `Start = dark · End = blue` turn caption is regression-checked absent.
- Angle footprints now reserve extra drawing space, with an additional protractor-specific allowance.
- Protractor, benchmark-estimation, turn and representative line/point pages were rasterised again after the polish pass.
