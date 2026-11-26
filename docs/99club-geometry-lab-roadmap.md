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
| 5 | **Exploration only:** dependent geometry objects, constrained dragging and drag tests; step-by-step construction replay with physical instruments | Investigate invariants without turning construction into a shortcut |
| 6 | Investigate Always/Sometimes/Never statements and construct counterexamples; compare families with inclusive definitions | Mathematical justification |
| 7 | Area and proof lab: shared base/height, same perimeter/different area, rearrangements, angle sum dissection, Pythagoras area proof (KS3) | See why rules work |
| 8 | Shape transformations, symmetry, scaling, tiling and tangrams; integrate with existing coordinates/geoboard rather than duplicate | Spatial thinking |
| 9 | Circle investigations (chords/arcs/sectors as optional enrichment), basic loci/distance constraints, geometric design patterns | Apply geometry creatively |
| 10 | 3D geometry review: nets, faces/edges/vertices, alternate views, volume; use existing solid-shape widgets | Complete curriculum coverage |

## Non-negotiable interaction rules

- Use correct mathematical geometry, not visual approximations; retain defining properties through variation in exploration only. Do not automatically maintain or solve geometric constraints in paper-equivalent construction.
- Label vertices outside figures/marked sectors where possible. Keep length labels parallel and offset. Keep equations and explanations below figures. No decorative fills by default; selected mathematical regions can be shaded.
- Shared ruler/protractor/compass instruments, generous magnetic targets and touch controls. Don't reveal answers in measurement, calculation or estimation tasks.
- Separate exploration, guided demonstration, independent task and paper output. Assess properties and accept reflected or otherwise valid solutions where appropriate.
- In investigation tasks, allow evidence and counterexamples, not only multiple-choice guessing. Avoid claiming a finite set of examples proves a general result.
- Region fills persist by point identity; preserve print scale for measuring tasks. Use monochrome hatching when needed.
- Every addition needs browser and model QA, pupil publication without answer leakage, graphical teacher key and practical touchscreen review.

## Teaching contract: exploration is not construction

Agreed 26 November 2026: dynamic geometry is useful for investigating relationships, but pupils learning constructions must use the digital equivalents of the instruments available on paper. This distinction applies to free construction as well as construction challenges and guided demonstrations.

| Capability | Dynamic exploration | Paper-equivalent construction |
|---|---|---|
| Drag a completed vertex to change a shape | Yes; preserve intended relationships | No; erase/undo and reconstruct |
| Dependent points, automatic constraint propagation | Yes | No; completed marks remain fixed |
| Move, rotate or align an instrument before drawing | Yes | Yes |
| Ruler, protractor, set squares, compass, pencil, eraser | As appropriate | Only the permitted physical-equivalent instruments |
| Snap to an existing vertex or actual drawn intersection | Yes | Yes, as touch assistance, not as a solution generator |
| Automatic midpoint, parallel, perpendicular, bisector or equal-length commands | Optional investigation tools | No; pupil constructs them using permitted instruments |
| Numerical measurement readout | Optional | Only where consistent with task; reading real graduations is the default, especially when assessing measurement |
| Undo and erase | Yes | Yes |
| Construction replay | Optional | Demonstrate actual instrument operations in order, without moving previously completed marks |

- No snapping to undisclosed target coordinates, required angles, lengths, or final answer. Grid snapping is optional and must be disabled in classical compass-and-straightedge tasks. Instrument alignment may snap to existing marks; no general automatic geometric solver.
- Allow permitted instrument motion, including retaining a compass aperture and transferring it to another centre. Moving the instrument is not moving the ink. Straightedge-only tasks use an ungraduated straightedge; classical constructions disallow protractor, set squares, numerical readouts and grid aids.
- Preserve drawn construction arcs, lines and points, with undo/erase to correct errors. The teacher may reveal/replay a valid method after attempting the task. Where the task assesses a construction method, check relevant construction evidence as well as final shape; geometry alone does not establish which method was used.
- Keep existing dynamic exploration and construction workflows distinct in the UI. Do not repurpose the construction Move tool as a constraint editor. Audit current construction point dragging, automatic readouts, snapping and allowed instruments; remove or restrict shortcuts in the construction workflow while preserving existing exploration capabilities.
- Regression acceptance: drawing a new mark never moves an existing one, instrument repositioning preserves the existing drawing, undo works, challenge constraints cannot be solved by hidden snapping, paper and screen tasks require comparable operations. Teacher keys show the physical construction steps and allow alternate valid solutions.

## Status of this branch

Based on production after PR #238, retaining label placement, independent measurement and selective shading. Forward-ports eight previously unmerged challenge families; adds right-triangle and kite exploration, parameter controls that preserve shape properties, diagonal and height overlays. Direct constrained vertex dragging and the general dependency engine are planned, not delivered here. Other rows above remain roadmap items unless already supported by the live widgets. Avoid merging the superseded development branches wholesale.
