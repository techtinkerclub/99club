# 99 Club Studio — Angles & Turns Stage 1 reliability build

Version: 1.22.2  
Module: `assets/99club/custom-angles.js`  
Scope: Custom Worksheets only

## Purpose

Angles research v0.2 contains 148 candidate primary/extension structures. v1.22 attempted to activate 110 of them, but visual review exposed a QA gap: numeric/deterministic consistency did not guarantee that the rendered pupil diagram was a complete and unambiguous mathematical problem.

v1.22.2 therefore prioritises **visual-semantic correctness over subtype count**. Six archetypes are held back until dedicated templates are available. The active set is 104 subtypes / 416 deterministic pool entries.

## Active families

| Family | Years | Active subtypes | Pool entries |
|---|---:|---:|---:|
| `angles_turns_y1_2` — turns & orientation | Y1–2 | 15 | 60 |
| `angles_right_y3` — right angles & turns | Y3 | 16 | 64 |
| `angles_compare_y4` — identify, compare & order | Y4 | 17 | 68 |
| `angles_degrees_y5` — classify, estimate, measure & draw | Y5 | 17 | 68 |
| `angles_lines_points_y5_6` — lines & around points | Y5–6 | 12 | 48 |
| `angles_triangles_y6` — triangles | Y6 | 9 | 36 |
| `angles_quads_polygons_y6` — quadrilaterals & polygons | Y6 | 12 | 48 |
| `angles_reasoning_y5_6` — reasoning & problem solving | Y5–6 | 6 | 24 |
| **Total** |  | **104** | **416** |

## Held-back v1.22 archetypes

These are intentionally inactive in v1.22.2 rather than shipping an unclear diagram:

- `ang_y6_composite_triangles_shared_vertex`
- `ang_y5_mystery_angle_constraints`
- `ang_y6_equilateral_inside_rectangle`
- `ang_y6_identical_parallelograms_rhombus`
- `ang_y5_protractor_baseline_error`
- `ang_y6_point_straight_multi_rule`

They remain research candidates and can return only after a dedicated template plus semantic QA exists.

## Visual-semantic contract

For every active angle question:

- every point/line/angle named in the prompt must be visibly identifiable in the pupil diagram;
- labels must belong to the correct object and must not sit ambiguously on unrelated lines/arcs;
- the rendered geometry must actually satisfy the mathematical relationships used by the answer;
- the diagram must not reveal an answer that the pupil is meant to derive;
- shape markings must be complete enough to support the stated property (for example, all sides of a rhombus when equal-side information matters);
- not-to-scale reasoning diagrams and physically measurable/calibrated diagrams are distinct modes;
- if a generic renderer cannot satisfy the contract, the subtype stays inactive until it has a dedicated template.


## v1.22.2 visual polish

The release after the reliability audit also tightens presentation quality:

- angle questions receive protected extra footprint so the compositor does not shrink diagrams simply to fit another question on the page;
- turn diagrams label START and END beside the actual rays rather than using a detached colour-key caption;
- angle labels use larger clearances from arcs/rays and crowded line/point scenes use wider radii;
- triangle/shape templates have larger drawing envelopes and more conservative label positions;
- the protractor renderer now draws 1° ticks, 5° intermediate ticks, 10° major ticks and both reading scales, with a larger protected print footprint;
- the old illustrative 10°-only protractor is no longer used.

These are presentation/renderer changes only: the 104 active mathematical subtypes remain unchanged.

## Marking and response contract

The v1.22 marking improvements are retained:

- visual estimates use single-best-answer MCQ rather than undefined fuzzy ranges;
- physical angle measurement/construction uses explicit teacher tolerance (currently ±2°);
- explain/justify/show-working prompts reserve pupil response space;
- explanation questions use structured rubric criteria rather than exact-sentence matching;
- the current worksheet scoring model remains one generated question = one score point.

## Compatibility

The public 99 Club path, public Help, compact QR/recreation, core generator and existing graph/coordinate/pie subtype IDs are unchanged.
