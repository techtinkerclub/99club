# Geometry Lab: curriculum and development roadmap

Updated 26 November 2026. Scope: England primary maths, with opt-in KS3 enrichment; suggested levels are not statutory year-by-year prescriptions for KS3.

## Research basis

- DfE national curriculum: https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study
- NCETM secondary mastery materials: https://www.ncetm.org.uk/teaching-for-mastery/mastery-materials/secondary-mastery-professional-development/
- NRICH primary geometry map: https://nrich.maths.org/curriculum-maps/primary?tab=geometry
- NRICH reasoning: https://nrich.maths.org/problems/always-sometimes-or-never-shape
- NRICH area investigations: https://nrich.maths.org/curriculum/area-and-perimeter-age-7-11
- NRICH tessellation: https://nrich.maths.org/problems/tessellating-triangles
- Dynamic geometry principle (drag test): https://www.geogebra.org/m/z2KzZYdR
- Polypad teaching workflows: https://mathigon.org/teachers

## Delivery sequence

| Priority | Work | Teaching purpose |
|---|---|---|
| 1 | Consolidate current geometry, consistent notation, shared instruments, paper/teacher graphics, release verification | Stable classroom tools |
| 2 | Shape-preserving manipulation and relationship overlays; missing diagonal, classification, similarity, parallel-angle and Pythagoras challenges | Invariants and reasoning |
| 3 | Complete construction families: segments, parallel/perpendicular, circles, ASA triangles, isosceles triangles, parallelograms, rhombuses, trapezia; open-ended property/area/perimeter problems | Practical geometry, multiple valid answers |
| 4 | Classical constructions: unmarked straightedge, compass aperture transfer, perpendicular bisectors, perpendicular through a point, angle bisectors, exact 60/30/45 degrees; KS3 toggle | Understand construction methods rather than numeric shortcuts |
| 5 | Dependent geometry objects: point on segment/circle, midpoint, intersections, parallel/perpendicular constraints, fixed lengths/angles; drag test and construction replay | Real dynamic geometry, not static drawings |
| 6 | Investigate Always/Sometimes/Never statements and construct counterexamples; compare families with inclusive definitions | Mathematical justification |
| 7 | Area and proof lab: shared base/height, same perimeter/different area, rearrangements, angle sum dissection, Pythagoras area proof (KS3) | See why rules work |
| 8 | Shape transformations, symmetry, scaling, tiling and tangrams; integrate with existing coordinates/geoboard rather than duplicate | Spatial thinking |
| 9 | Circle investigations (chords/arcs/sectors as optional enrichment), basic loci/distance constraints, geometric design patterns | Apply geometry creatively |
| 10 | 3D geometry review: nets, faces/edges/vertices, alternate views, volume; use existing solid-shape widgets | Complete curriculum coverage |

## Non-negotiable interaction rules

- Use correct mathematical geometry, not visual approximations; retain defining properties through variation.
- Label vertices outside figures/marked sectors where possible. Keep length labels parallel and offset. Keep equations and explanations below figures. No decorative fills by default; selected mathematical regions can be shaded.
- Shared ruler/protractor/compass instruments, generous magnetic targets and touch controls. Don't reveal answers in measurement, calculation or estimation tasks.
- Separate exploration, guided demonstration, independent task and paper output. Assess properties and accept reflected or otherwise valid solutions where appropriate.
- In investigation tasks, allow evidence and counterexamples, not only multiple-choice guessing. Avoid claiming a finite set of examples proves a general result.
- Region fills persist by point identity; preserve print scale for measuring tasks. Use monochrome hatching when needed.
- Every addition needs browser and model QA, pupil publication without answer leakage, graphical teacher key and practical touchscreen review.

## Status of this branch

Based on production after PR #238, retaining label placement, independent measurement and selective shading. Forward-ports eight previously unmerged challenge families; adds right-triangle and kite exploration, parameter controls that preserve shape properties, diagonal and height overlays. Direct constrained vertex dragging and the general dependency engine are planned, not delivered here. Other rows above remain roadmap items unless already supported by the live widgets. Avoid merging the superseded development branches wholesale.
