# Whiteboard widget review and release checklist

Updated 25 November 2026. This is the mandatory companion to [the arithmetic and publishing roadmap](whiteboard-arithmetic-roadmap.md). Publishing development does not replace the original widget-by-widget quality review.

## Completion standard

A widget is **complete** only after all applicable checks are recorded against a deployed revision:
- **Visual:** standalone, embedded whiteboard and presentation mode, narrow/mobile view; readable labels, no overlap, unnecessary whitespace or horizontal overflow; consistent typography, colours and scaling.
- **Interaction:** touch-only operation; intuitive add/remove/move/reset, appropriate quick actions, restrained contextual settings, saved lesson round-trip. No keyboard dependency.
- **Mathematics:** correct representation, operations, limits and edge cases, age-appropriate challenge generation, unambiguous prompts, no accidentally disclosed answer, valid alternatives accepted where appropriate.
- **Challenge workflow:** native random all/category/specific launcher, appropriate settings, Check/Another/Reveal/Exit, correct feedback, no stale pupil response or answer.
- **Publishing L1:** publish current diagram and challenge; paper-specific response area and separate teacher key where useful; compare actual SVG/PNG/print output with intended model.
- **Publishing L2/L3:** generate single-widget and mixed documents using independent frozen recipes, replace one item without affecting other items, preserve document order and pupil/teacher parity. Non-challenge tools need capture only; do not invent challenges merely to fill a checklist.
- **Regression:** confirm new features as well as original ones on both entry points, test actual browser/touch/print, record defects and reopen previously reviewed widgets when changed.

## Catalogue baseline

The notes are implementation evidence, not a completed acceptance test. “Pilot” means an adapter is implemented and has automated checks, not browser-certified. “Pending” means not yet integrated into the shared document editor. L1 existing paths require explicit audit. All 20 widgets still require final visual/touch/print certification.

| Widget | Recent evidence / focus for next review | L1 paper status | L2/L3 shared document | Final QA |
|---|---|---|---|---|
| Number line | Marker/jump labels, multiple lines, solvability, precision and scaling | Existing; audit | Pending | Open |
| Place value board | Counters first; regrouping, exact budgets, alternative representations, decimal columns | Shared templates; custom task audit | Pilot: 13 generated types + diagrams | Open |
| Abacus & historical calculators | Western, suanpan, soroban; bead geometry; exchange and final total; historical subdevices below | Three abacus templates; historical blocked | Pilot: three abacus types | Open |
| Fraction wall | Equivalent fractions, comparison, construction and label placement | Existing; audit | Pending | Open |
| Bar model builder | Editable part–whole model, unknown quantities, paper construction | Existing; audit | Pending | Open |
| Hundred square | Number patterns, highlighting, selection, hidden values | Existing; audit | Pending | Open |
| Multiplication grid | Related facts, grid labels, response locations | Existing; audit | Pending | Open |
| Array builder | Row/column operations, factor pairs, missing dimensions, paper response | Existing; audit | Pending | Open |
| Clock & time | Shared native 14-type generator; original elapsed-time evidence, blank hands, visible display options, explicit teacher key | Shared templates; custom task audit | Pilot: 14 types + diagrams | Open |
| UK money | Consistent UK coins/notes, exact totals/change, paper manipulation | Existing; audit | Pending | Open |
| Coordinate grid | Plotting/deleting older points, labels, transformations, blank plotting grid | Existing; audit | Pending | Open |
| Ruler & measures | Scale accuracy, metric/imperial synchronisation, measurement tasks | Existing; audit | Pending | Open |
| Dice, spinner & randomiser | Roll/spin, label orientation, probabilities, reproducible current diagrams | Existing; audit; decide eligible tasks | Pending | Open |
| Equation balance | Physical model and equality, moving number tiles, animations, solvable tasks | Existing; audit | Pending | Open |
| Times-table visualiser | Groups, jumps, repeated addition, fact relationships | Existing; audit | Pending | Open |
| Factors & multiples | Prime factors, factor pairs, common factors, readable outputs | Existing; audit | Pending | Open |
| Fraction–decimal–percentage | Equivalent representations, correct shading, missing values | Existing; audit | Pending | Open |
| Shape & geoboard | Vertex manipulation, perimeter/area, plotting response | Existing; audit | Pending | Open |
| Sequences & rules | Newly introduced exploration, four families, three challenges, reveal and auto-fit | Revised templates; audit | Pilot | Open |
| Number & symbol tiles / Maths Canvas | Build/combine/split; arithmetic, advanced optional topics, batches, target activity, settings and keypad | Revised templates/pagination; audit | Pilot | Open |

### Historical calculators (within Abacus)

Reckoning board, Chinese counting rods, Napier's Bones, slide rule and Pascaline each need a correct static paper renderer and task-specific response format. Do not publish a generic abacus as their representation. Shared publishing and incorrect legacy single export are currently unavailable for these five subdevices.

## Workstream A — shared publishing

1. Keep direct current export independent of document creation.
2. Clock & Time adapter added after Place Value, Arithmetic, Sequences and the three abacus types; continue with fraction wall, array, number line, money and coordinates. Audit response semantics and teacher solutions while integrating each.
3. Automatic builder initial source configuration added for the five integrated widgets (independent type/family/range/difficulty/count). Editing or regenerating already-published source blocks remains pending; preserve manually retained items. Refine all publishing menus with the same compact visual language.
4. Extend preview layout: configurable portrait/landscape and intelligent columns, full-width diagrams where necessary, consistent numbering, page breaks, working space and teacher keys.
5. Save/reopen and reusable settings, stable versioned model records, import/export of drafts with validation; preserve exact content rather than regenerating silently.
6. Align controls and branding with Studio's existing worksheet workflow. Test actual preview/print parity and mobile/touch performance.
7. Acceptance test level 1, level 2 and mixed level 3 on every eligible widget; static-only tools need correct capture and placement, not invented game engines.

## Workstream B — widget quality

Continue the catalogue review one widget at a time, with defects and regressions recorded here. Publishing adapter work should count toward the relevant paper/generator checks only; it cannot close the visual or interaction checks. Continue curriculum refinement and avoid game/puzzle duplication. Use the actual deployed build and screenshots to verify visual work.

## Current verified scope

- Five catalogue entries have shared publishing adapters (Arithmetic, Sequences, Abacus limited to three bead instruments, Place Value, Clock & Time).
- Automated abacus rollout checks: 2,160 generated tasks; 4,320 pupil/teacher diagrams; 108 mixed-document scenarios and isolated replacements; 1,236 page checks.
- Automated Place Value rollout: 45 column ranges, 14,040 generated tasks, 28,080 pupil/teacher diagrams, 135 mixed drafts and isolated replacements, 135 captures and 1,655 page checks. Custom teacher-authored tasks still require individual export; the existing powers-of-ten demo is capture-only.
- Clock rollout: 2,800 individual generator/render checks; 100 multi-source clock drafts, 1,900 generated questions, 200 captures, 100 isolated replacements and 2,583 pupil/teacher page checks. One-clock recipes enable 10 types; two-clock recipes enable 14. Custom tasks remain direct-export only. Actual browser, touch and A4 verification is open.
- Both entry points must load identical shared asset versions.
- No real browser visual, touchscreen or physical A4 acceptance run was performed in this batch. No widget is signed off as finished.
