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

## Workspace formats and measurement investigations

Replace ambiguous More space with Workspace settings: A5/A4/A3 portrait or landscape, custom width/height in mm, plain paper or 5/10/20 mm grid. Keep four drawing units per mm; preserve existing coordinates and viewport scale on sheet changes, allow pan without altering ink, prevent shrinking over existing geometry. Persist dimensions and grid in saved scenes and vector output. Exact physical print size still depends on the document placement/print calibration workflow. Inspectable diagonal problems expose intersection O to the same ruler/protractor as the vertices. A measured example supports exploration but does not prove a universal property; teacher notes should explain the general reasoning. Retain instrument restrictions for tasks that assess calculations or authentic constructions.


## Paper-geometry capability audit and allocation (27 November 2026)

Agreed after reviewing the 36 guided methods, 12 assessed construction families and existing paper-equivalent/dynamic workspaces. All audit ideas are retained as candidates, not unconditional implementation commitments. Review the actual existing widget, shared components and publishing adapters before each increment: reuse, extend, relocate, defer or reject as justified. Do not duplicate another manipulative's teaching workflow. Maintain the existing three-mode teaching contract and the UI/UX/release gates above.

### Current gate — Point 6G

- Finish and verify PR #297 / issue #296 (selection-local Normal/Construction, independent teaching colours, Duplicate artwork); verify #283 utensils and #287 compass arcs. Resolve #266 rapid-drag locus trace accuracy without waiting for the expansion to finish.
- Preserve the earlier plan, release checks and physical whiteboard/print limitations. No new expansion should destabilise the existing board.

### Geometry-owned candidates

- **6H — Editing and annotation:** shared reusable pen, highlighter, text, mathematical expressions, arrows, editable/positionable labels and point renaming, annotation-only eraser. Geometry-specific trim/extend, split/join segments and arcs, selective erasure, protect/lock given geometry, and undo. Audit any existing equivalent first.
- **6I — Tracing and transformations:** multi-selection, grouping, duplication, rigid movement, transparent tracing/ghost overlays, movable pivot, translation, reflection, rotation, enlargement/reduction about a centre; compare congruence and similarity. Reuse exact transformation mathematics with Coordinate Grid, but keep free paper-equivalent construction distinct from dynamic constraints and assessed coordinate tasks. Simple mirror/fold-line demonstration is sufficient here; no origami engine.
- **6J — Measurements, not duplicate area curriculum:** inspect exact area/perimeter of constructed closed regions, shortest distances, parallel-line separation, perpendicular heights, arc length and sector area where appropriate. Allow measurement reveal controls, correct units, and no answer leakage. Dedicated primary area/perimeter teaching and investigations belong primarily to Geoboard; assess cut/rearrange/join and area decomposition there or in a dedicated shape-pieces manipulative first.
- **6K — Paper and scale:** retain workspace formats and physical grid calibration. Cartesian axes, origins, quadrants, axis units and coordinate transformation challenges belong primarily to existing Coordinate Grid. Consider isometric/polar grids only for a demonstrated construction need. Optional KS3 scale drawings, ratios, north references and three-figure bearings may belong here; do not build another coordinate widget.
- **6L — Library, challenges and replay:** audit all existing methods and challenge families, add assessed external perpendicular, angle bisector/copy, parallel through point, triangle centres/circumcircle/incircle, regular inscribed polygons, equal segment division and ratio division, tangents and intersecting locus conditions as appropriate. Consider exact classical angles, triangle medians/altitudes, similarity, compound locus regions, rosettes/compass flowers and two-pin-and-string ellipse investigations. Include generated givens, alternative solutions, graphical guidance/annex, tool restrictions, step replay/back/forward and construction evidence where the method is assessed. Exact input, explicit property constraints, persistent measurements, saved comparison scenes and ghost overlays only in appropriate modes. Reuse existing library and dependency engine rather than reinventing them.
- **6M — Integration:** mathematical invariants, rapid traces, touch and mouse behaviour, selection/context palettes, regular/full board, saved scenes, worksheet and annex parity, visual QA and release verification. Use compact contextual families; avoid adding a permanent toolbar button for every operation.

### Deferred or relocated ideas

- Full origami/paper folding (multi-fold layers, realistic folds and unfolding) is a future standalone feasibility candidate, not Geometry scope. Retain simple symmetry reflection under 6I; only revisit a dedicated fold manipulative if a faithful educational prototype is viable.
- Cutting/rearranging/joining polygon pieces, tangrams, tessellation, fractions and conservation of area: compare existing Geoboard and shape manipulatives before deciding. A separate shape-pieces workspace may be more appropriate than forcing freely moving pieces onto a peg grid.
- Additional utensils: no active work on French curves, parallel rulers, dividers or physical polygon stencils. Existing retained compass opening covers distance transfer; consider reusable shape templates or a 360-degree extension to the current protractor only if a concrete unmet use case is confirmed. Prioritise instrument quality over quantity.
- Shared publishing: actual-size print where feasible, grid and calibration ruler, printable cut/fold guides only for supported activities, adequate blank working space, arcs, monochrome accessibility, correct givens and graphical keys, page formats/margins. Distinguish model calibration, browser/PDF scaling and physical printer verification.

See [master whiteboard roadmap](whiteboard-arithmetic-roadmap.md) for cross-widget ownership. Phase numbers above are provisional sequencing labels, not completion claims or a mandate to implement every candidate.


## Reference audit: GeometryLab.net — teaching explorer improvements (27 November 2026)

Reference: https://geometrylab.net/ (Explore homepage), https://geometrylab.net/tools/ and https://geometrylab.net/shapes/. Catalogue includes 17 tools/collections and eight shape pages; reviewed public page descriptions and controls, not an executed live browser usability test. Extract educational ideas, not their artwork, UI or source code. Primary-first, optional KS3/GCSE extensions only where justified.

- **Teaching explorer renovation:** treat existing angle, turn, line, angle-fact, triangle/polygon and circle explorers as first-class teaching tools, not just static challenge diagrams. Inspect existing presets, investigation overlays and constrained-shape code first. Common pattern: direct drag and optional exact touch keypad input, curated examples, property panel, selectable visual evidence, predict/explain/reveal, misconceptions, counterexamples, discovery tasks, worked reasoning and consistent publishing. Keep teaching diagrams distinct from free construction and dynamic constraints; no duplicate top-level tools.
- **Shape atlas inside existing explorer:** triangles (both side and angle classifications, inclusive definitions), quadrilaterals (square/rectangle/rhombus/parallelogram/kite/trapezium, inclusive family relationships with documented convention), regular/irregular and convex/concave polygons. Interactive classification, free deformation and property-preserving mode, arbitrary orientation, side/angle equality, parallelism, symmetry, diagonals, perpendicular height, medians and optional triangle centres. Show multiple valid labels, explain why, provide examples/nonexamples and degeneracy feedback. Regular polygon side count/length, triangulation, angle sums, exterior turning, diagonals and optional apothem; existing challenges to be extended rather than duplicated.
- **Lines and angle facts:** line vs ray vs segment, horizontal/vertical relative to axes, parallel/perpendicular/intersecting/neither, movable lines and endpoints, adjustable separation and orientation; demonstrate invariant separation, right angles, coincident lines, intersections, midpoint and perpendicular distance. Transversal: matched corresponding/alternate/co-interior angles, distinguish when lines are not parallel. Angle on a line/around a point/vertically opposite, triangle angle sum and exterior angles, use colour plus unambiguous notation and reveal controls.
- **Circles:** existing radius/diameter and circle relationships extended with draggable radius/angle, chord, arc, sector vs segment, tangent, circumference/area visual reasoning; optional KS3/GCSE arc length, sector area and circle theorems where curriculum review supports them.
- **Calculation enrichment:** borrow visual and worked-step approach from triangle solver (SSS/SAS/AAS/SSA, invalid/ambiguous cases), Pythagoras and regular polygon/sector explorers. Do not expose solvers during construction assessment. GCSE trigonometry, unit circle, radians, sine/cosine rules, Heron and trig graphs are deferred enrichment candidates, not compulsory KS2 work. Turns/degrees/fractions of a turn are primary-relevant. Coordinate distance/midpoint/gradient/line equation and transformations go to Coordinate Grid; area/perimeter teaching to Geoboard/shape tools; solid properties/nets/volume to dedicated 3D tools. Formula references support explanation, not answer leakage.
- **Measurement commonality:** current goodies-core.js already exports rulerGraduations, ruler, protractor, setSquare and adaptMarkings; goodies-tools-b.js uses the shared ruler renderer for measurement drawing and ruler strips. Reuse/extract independent instrument interaction (placement, drag/rotate, magnetic alignment, calibrated graduations, readout policy, touch targets, contextual controls) from Geometry Lab only after 6G stabilises. Provide host adapters for coordinate scale, snap targets, overlay layers, lifecycle, challenge permissions and export. Do not merge the whole Geometry Lab into Ruler & Measures. Dedicated length/angle-reading skill challenges belong in Measures; geometry classification, reasoning and constructions stay in Geometry. Share definitions/generators/renderers for overlapping angle challenge families and maintain legacy IDs/saved lessons. See master roadmap for migration.
- **Acceptance:** one mathematical model for diagram, properties, challenge and paper answer; numerical/visual invariant tests (incl. near-degenerate shapes, mirrored/rotated figures, tolerance, vertical lines), controlled reveal, multiple valid answers, current/batch/mixed publishing, browser/touch and visual QA. Each idea must pass existing-feature/ownership/educational-value review. Schedule teaching explorer renovation as an explicit follow-on within geometry Point 6, without derailing current #297, #283, #287 and #266.


### Point 6G — exact endpoint centre and measurement reading cue (27 November 2026)

User observed that a filled point dot obscures the precise endpoint when reading a ruler at high zoom. The mathematical endpoint remains the centre of the dot. Visual options considered: small neutral crosshair, centre pinhole, perpendicular reading tick with shorter longitudinal stroke. Prefer the last option where direction is unambiguous, neutral crosshair for isolated points or ambiguous intersections. Initial design: 8 CSS px total perpendicular span, 3.6 px longitudinal span, dark ink with thin white contrast halo; never change model coordinates, snap tolerances or stored dimensions. Review sizing on classroom screens.

- Orientation: selected segment/ray or active drawing direction takes priority; otherwise use the nearest relevant measuring edge (prefer selected utensil), or an unambiguous incident line direction. At ambiguous junctions without a reference, remain neutral. Rotate the mark with the line, not with the screen; the longer stroke is perpendicular to the line/edge. Preview the exact prospective endpoint while constructing.
- Visibility: selected point, selected line endpoints, active drawing anchor and preview, moving/hovered point, and points near visible measuring edges. Draw above the instrument overlay, pointer-events none, no interference with selection or dragging; disappear when no longer relevant. Hide during pan. No automatic extension to an undisclosed solution point.
- Teaching: same centre cue in free/fixed construction, optional real measurement readouts only under existing teacher policy. Challenge: same visual endpoint aid, no added numerical answers, target snapping or new constraints. Print: temporary cue excluded from pupil and teacher vector publication and saved geometry; ordinary point dot and line termination remain exact. If printed measurement readability proves inadequate, consider a separate intentional print-safe centre glyph after physical print QA.
- Shared instrument engine: extract the centre-cue renderer and reference-direction policy along with reusable instrument interaction after 6G. Host supplies mathematical points, actual visible edges, selection/preview and view transform; overlay remains ephemeral and cannot alter mathematical geometry. Apply to Measures & Angles and other suitable measurement activities, including existing challenges, without duplicating code or challenge families.
- Acceptance: rotated diagonal perpendicularity, exact centres within SVG rendering precision, stable screen-space size under zoom, point movement, measuring-edge alignment, ambiguous junction handling, no pointer interception, no mutation of saved state, pupil/teacher publication exclusion, visual inspection with ruler graduations. PR #298; automated and physical acceptance remain separate.


### Persistent annotations and instrument-to-drawing workflow (27 November 2026)

The teacher needs to be able to measure an existing angle or length with a temporary utensil and explicitly retain that result on the drawing, then turn it into a question, a named unknown or a custom label without modifying the geometry. Separate automatic readouts from authored annotations. PR #308 begins the persistent annotation model and contextual controls.

- Segment dimensions: automatic / pinned measured value / custom text (including ?, x, a, stated value and unit) / hidden; authored labels override automatic readouts and persist with automatic measurements off. Measured mode follows geometry; custom text is literal. Keep a separate future option for a deliberately frozen measured value if needed.
- Angle notation: select a vertex, choose the two actual arms with highlighted preview, choose single/double arc or right-angle mark and independently choose measured/custom/no label. Support editing existing marks, minor/reflex selection, multiple angles per vertex with collision avoidance, removing or hiding automatic labels, and ray-based arms without requiring artificial points. Do not silently mark a non-right angle as right.
- Instrument-local action: "Add measurement" on selected ruler/protractor. Enable only when the measured references are unambiguous; identify actual geometric endpoints or vertex and both arms, not utensil size or a rounded reading. Preview the target geometry and annotation, ask for selection where ambiguous, never create geometry or guesses merely to save a measurement. Reuse the same persistent annotation model as manual entry. Support adding a distance between visible points as well as segment lengths, with appropriate dimension line where no segment exists. No automatic annotation on instrument removal.
- Free text and point labels: anchored labels, optional text annotations on paper, edit/move/remove, avoid overlaps and keep identifiers independent of displayed names. Later shared annotation layer may support arrows and mathematical labels in other manipulatives.
- Teaching/challenge/paper: explicit authored unknowns must not be replaced with numerical values or leaked via automatic dimensions, revealed answers, or pupil print. Keep actual mathematics and answer data separate. For authored questions, allow a separately controlled teacher answer annex with true measurements and worked reasoning; preserve symbols on the pupil diagram. Respect challenge restrictions and do not add automatic answer shortcuts. Preserve vector export, saved lesson restore, undo and reference deletion. Test current, batch and mixed publishing where applicable; verify physical paper readability and touch placement.
- Sequencing: verify #308, implement direct instrument annotation action and reference matching, complete label editing and unknown/answer separation, then continue shared protractor and Measures & Angles work. Full general drawing annotation layer remains a planned workstream rather than a reason to overload the current palette.


### Revision Library reference audit — geometry challenge crosswalk (27 November 2026)

Reference: https://www.revisionlibrary.co.uk/library/ks2-maths/geometry . Seven packs across geometry, measures and transformations. Sampled public HTML question pages, not bulk-downloaded content. Use original parameterised tasks, independently validated against the England curriculum; do not copy their questions/illustrations or assume their year tagging is correct.

Current FAMILIES in goodies-angles.js already include angle classification/measurement/estimation/construction/reflex, line orientation/pairs, straight/point/opposite relationships, triangle/quadrilateral/isosceles/rectangle/regular angle problems, circle radius/diameter, property classifications and 12 assessed constructions. Keep these and enrich scenarios rather than duplicate families. Coordinate Grid currently has read-coordinate, plot-coordinate, missing-coordinate (single missing component), reflect-axis, translate-point and identify-quadrant. Candidate gaps confirmed at the family catalogue level: coordinate midpoint/distance, missing polygon vertex, whole-shape transformation and reverse displacement; audit underlying support before implementing. Allocate to Coordinate Grid. For Geometry review property deduction from several clues, mirror/rotational symmetry, multiple missing angles and linked reasoning, fractional/repeated turns, tangent rows of identical circles; existing polygon-sum and symbolic angle equations belong in appropriate enrichment, not automatic KS2. Send solid properties/nets to 3D owner, composite area and perimeter to Geoboard/area owner, clock turns to time where appropriate.

High-value lesson pattern: shared original geometry model with multiple subquestions (read/measure, calculate, explain, then change one constraint), independent unknown labels and not-to-scale drawings where reasoning rather than measurement is assessed. Print should preserve givens and unknowns, provide adequate working space, then give a graphical teacher key with method marks and alternative valid answers. Add stable family tags and coverage matrix to master audit. PR #309 merged after automated QA; direct measurement annotation currently supports named minor-angle arms and existing segments only. Finish annotation editing/repositioning, text and unknown/answer separation before expanding content; do not interrupt the shared instrument plan.
