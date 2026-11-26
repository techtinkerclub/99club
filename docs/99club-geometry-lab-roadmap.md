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

## Paper-equivalent construction implementation — first increment

- Fixed marks in free Construction Lab and the six shape-construction families: removed vertex Move and pointer-drag mutation. Undo/Erase remain available. Previewing an instrument or moving a pointer does not change committed coordinates.
- Numeric dimension annotation is off by default in free construction (teacher may opt in) and not offered in shape-construction challenges; the given baseline remains labelled. The compass and ruler provide actual graduated scale previews.
- Compass retains an exact chosen aperture for reuse at another centre; opening can be changed again. Snapping remains limited to existing drawn geometry, not hidden task targets.
- Browser regressions cover immovable points, compass transfer, default measurement policy, undo, and retained exploration controls.
- Remaining: convert the separate angle-drawing tasks to paper-equivalent instrument placement and fixed marks; implement allowed-instrument presets, ungraduated straightedge, classical construction tasks and method assessment. Current six shape construction families assess the finished geometry, not the sequence. The general dynamic dependency engine belongs only to exploration.

## Three geometry environments (agreed refinement)

The earlier two-environment distinction is refined into three explicit modes, not a global toggle:

1. **Construction Lab:** paper-equivalent fixed marks, instruments, erase/undo. Never allow vertex movement or constraint-solving shortcuts during construction assessment.
2. **Free exploration:** independently movable points; attached segments and circles follow their points, but no equal-side/angle/parallel constraints are automatically imposed. Useful for counterexamples, showing a square cease to be a square, or a triangle change classification. Allow selective tracing of moving points.
3. **Dynamic geometry — loci & traces:** explicit mathematical constraints and dependent points; a dragged driver preserves its defining property and dependent points recalculate. Trace any selected available point; distinguish the observed sampled trail from the exact mathematical locus. Keep trace paths in the saved scene and export them as vector graphics. Toggle tracing without connecting separate recording periods. Include clear/reset and optional reveal of exact locus.

The KS3 teaching guidance explicitly includes the circle as a locus of points equidistant from a fixed point: https://www.gov.uk/government/publications/teaching-mathematics-at-key-stage-3 . GeoGebra distinguishes tracing and generating loci: https://geogebra.github.io/docs/manual/en/Tracing/ and https://geogebra.github.io/docs/manual/en/tools/Locus/ .

Initial implementation on the motion/loci branch: separate saved free-exploration workspace with Move and Trace; two constrained demonstrations (fixed distance from a point and equal distance from two points), optionally show and trace dependent midpoint M as well as driver P. Constraint projection is exact, within finite canvas bounds; recorded traces are sampled paths. This is not yet a general constraint editor. Next add point on line/circle, perpendicular-distance loci (both parallel branches), angle bisectors, region inequalities, independent point selection and arbitrary dependency graphs with robust cycle/degeneracy handling. Future investigations include intersections of loci and multiple valid solutions. Keep fixed construction unaffected.

## UI/UX acceptance contract (applies to every geometry increment)

Geometry Lab must remain usable by a primary teacher on an interactive whiteboard, not become a collection of unrelated controls. UI/UX is part of each feature's definition of done, not a cleanup postponed to the end.

- **Information architecture:** keep the main whiteboard menu compact. Within geometry, group teaching diagrams separately from the three workspaces (Construction Lab, Free exploration, Dynamic geometry). Do not add a top-level widget for every relationship, locus or construction. Preserve Explore / Challenge / Export conventions and saved drawings when switching activity.
- **Visible state:** clearly name the current workspace and whether marks are fixed, freely movable or constrained. One selected instrument at a time. Show only controls appropriate to the current activity, instrument and stage. Hide irrelevant controls, not merely disable them. Advanced properties, constraints and generation options belong in contextual settings rather than permanent toolbars.
- **Common controls:** reuse the same icons, instrument renderers, colour meanings, touch target sizes, undo/erase, trace selection, reset and publishing patterns. Pair unfamiliar icons with short labels or accessible names. Do not duplicate Reveal, Generate, Challenge or export actions. Prefer one clear primary action. Random challenge must be one easy action within the chosen scope, with generation settings separately accessible.
- **Canvas first:** compact controls, consistent alignment, stable diagram viewport, expandable working area independent of geometry scale, no clipping, overlaps, or unintentional page scrolling while drawing. Preserve readable line thickness, graduations and label clearances. Use at least 44 CSS px touch targets; verify actual transformed target sizes in embedded whiteboard, not just CSS declarations. Keyboard is optional, never required for a pupil answer.
- **Interaction:** predictable touch selection and generous snapping only to actual geometry; clear selected-tool/point/trace state, feedback, reversible changes, sensible defaults. Avoid redraws that cancel pointer capture, shift layouts, lose work or move instruments unexpectedly. Provide short contextual instructions and optional guided tool demonstrations. Distinguish sampled traces from exact loci. Keep constraints explicit and provide useful feedback for invalid/degenerate constructions.
- **Assessment and publishing:** fixed paper-equivalent construction cannot be bypassed by switching motion tools; no inadvertent answer leaks. Pupil page, teacher annex, live diagram and whiteboard share correct geometry and notation. Preserve intentional shading, trace and true-scale measurement requirements.
- **Release gate:** validate model mathematics, browser interactions, publish output and existing features; inspect representative narrow and wide layouts, touch targets, empty/active/revealed states, settings and mode transitions. Check no toolbar overflow or duplicate actions. Physical whiteboard usability and paper calibration still need real classroom feedback; do not claim these were visually verified by unit tests. Record limitations and review findings in the PR. Fix regressions before expanding scope.

### UI sequence

1. Group the geometry activity selector into teaching diagrams and workspaces, keeping stable activity IDs. This is the initial organisation change.
2. Audit and consolidate instrument/trace/shading toolbars and contextual controls; use the shared Goodies challenge and settings patterns.
3. Group challenge families into clear curricular categories without hiding quick random generation; separate primary and optional KS3 content.
4. Verify saved scenes, switching activities, responsive layouts and publishing on representative classroom screen sizes.
5. Add further construction families, constraints, loci and investigations through the same UI system. Treat a newly crowded panel as a regression, not an acceptable consequence of more content.
