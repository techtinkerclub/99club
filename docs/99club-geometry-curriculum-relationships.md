# Geometry relationship coverage and implementation plan

Scope: England national curriculum KS1/KS2; KS3 extensions are opt-in. The year allocations below are teaching suggestions, not claims that every named theorem is statutory in that year.

Sources:
- DfE statutory mathematics programme and non-statutory guidance: https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study
- NCETM Year 3 parallel/perpendicular polygons: https://www.ncetm.org.uk/classroom-resources/cp-year-3-unit-10-parallel-and-perpendicular-sides-in-polygons/
- NCETM Year 4 symmetry: https://www.ncetm.org.uk/classroom-resources/cp-year-4-unit-10-symmetry-in-2d-shapes/
- NCETM Year 5 angles: https://www.ncetm.org.uk/classroom-resources/cp-year-5-unit-10-angles/
- NCETM Year 6 shapes: https://www.ncetm.org.uk/classroom-resources/cp-year-6-unit-4-draw-compose-and-decompose-shapes/
- NCETM KS3 geometry: https://www.ncetm.org.uk/classroom-resources/secmm-6-geometry/
- NCETM Year 6 ratio: https://www.ncetm.org.uk/classroom-resources/cp-year-6-unit-9-ratio-and-proportion/

| Progression | Relationships | Placement and next work |
|---|---|---|
| Y1–2 | Recognise shapes in any orientation; sides and vertices; quarter/half/whole turns; vertical symmetry; faces and edges of solids | Turns; polygon explorer; link symmetry and 3D widgets. Add classification and property-count tasks. |
| Y3 | Right angles in shapes, quarter turns, horizontal/vertical/parallel/perpendicular sides | Line and angle modes; add property overlays and compound right-angle tasks. |
| Y4 | Triangle and quadrilateral classification; angle ordering; symmetry in varied orientations | Polygon named-shape explorer; separate equal-side, angle, parallel marks; audit symmetry widget for completion and counting challenges. |
| Y5 | Rectangle properties and missing lengths/angles; regular/irregular polygons; degree measurement and angles on lines/around points; investigate diagonals (guidance) | First batch: rectangle length, diagonal equality, quadrilateral overlays. Next: diagonal bisection, perpendicularity and angle reasoning; vary dimensions while preserving shape properties. |
| Y6 | Triangle/quadrilateral/regular polygon missing angles; circle parts and diameter-radius; construction with given dimensions/angles; vertically opposite angles | First batch: circle mode, radius/diameter, isosceles base angle; retain existing angle facts and constructions. Next: missing sides and compound angles, circle labels/diameter with varied units, polygon interior sum explanations, links to scale/area and nets. |
| KS3 enrichment | Corresponding, alternate and co-interior angles; interior/exterior sums; congruence and similarity; perpendicular and angle bisectors; perpendicular distance; circumference/area; Pythagoras | Enrichment-only challenge families; add visual proof/deduction tasks in stages. Circle formula challenges added in first batch. |

Implementation rules:
- Explicitly separate statutory requirements, non-statutory suggestions, optional explorations and KS3 enrichment. Do not treat the whole KS3 curriculum as Year 7 statutory content.
- One renderer/model for on-screen, pupil print and teacher graphics; no solved answer leakage.
- Conventional markings (equal sides use ticks, parallel lines arrows, right angles squares, separate arc radii).
- Shape-preserving manipulation, not arbitrary movement that quietly changes the claimed shape.
- Use accurate geometric coordinates; accept equivalent orientations and multiple correct constructions. For questions asking what is always true, use a clearly specified shape family rather than inferring from a single example.
- Prioritise 2D relationships in the geometry module. Review existing symmetry, coordinate, geoboard, area/perimeter, and 3D widgets before creating duplicates.
- Release after integrated model, browser, whiteboard and publication tests and practical visual checks.

Current first batch (unreleased): named-shape exploration, angle/equal-side/parallel/diagonal overlays, diagonal comparison, rectangle missing length, isosceles base angles, circle parts, radius/diameter and opt-in circle calculations. Remaining items above are not implemented by this batch.
