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
| Number line | Shared 25-type generator/rendering; collision lanes retained, endpoint ties and scale variation addressed | Shared templates; custom task audit | Pilot: 25 types + diagrams | Open |
| Place value board | Counters first; regrouping, exact budgets, alternative representations, decimal columns | Shared templates; custom task audit | Pilot: 13 generated types + diagrams | Open |
| Abacus & historical calculators | Western, suanpan, soroban; bead geometry; exchange and final total; historical subdevices below | Three abacus templates; historical blocked | Pilot: three abacus types | Open |
| Fraction wall | Shared six-type generator; equivalent fractions, comparison, simplify, mixed numbers, reasoning; compact aligned paper strips | Shared templates; custom task audit | Pilot: 6 types + diagrams | Open |
| Bar model builder | Editable part–whole model, unknown quantities, paper construction | Existing; audit | Pending | Open |
| Hundred square | Shared eight-type generator, five ranges, compact row extracts, complete marking diagrams | Shared templates; custom audit | Pilot: 8 types + diagrams and graphical keys | Open |
| Multiplication grid | Related facts, grid labels, response locations | Existing; audit | Pending | Open |
| Array builder | Shared seven-type generator, saved factor ranges, build grid and teacher key, partitions | Shared templates; custom task audit | Pilot: 7 types + diagrams | Open |
| Clock & time | Shared native 14-type generator; original elapsed-time evidence, blank hands, visible display options, explicit teacher key | Shared templates; custom task audit | Pilot: 14 types + diagrams | Open |
| UK money | Shared ten-type generator, consistent coin art, exact/minimum pieces, change | Shared templates; custom audit | Pilot: 10 types + diagrams and graphical keys | Open |
| Coordinate grid | Shared six-type generator, grid scopes, collision-aware paper labels, solved transformations | Shared templates; custom audit | Pilot: 6 types + diagrams and graphical keys | Open |
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
2. Array Builder adapter added after Fraction Wall, Clock & Time, Place Value, Arithmetic, Sequences and the three abacus types; continue with number line, money and coordinates. Audit response semantics and teacher solutions while integrating each.
3. Automatic builder initial source configuration added for the twelve integrated widgets (independent type/family/range/difficulty/count). Editing or regenerating already-published source blocks remains pending; preserve manually retained items. Refine all publishing menus with the same compact visual language.
4. Extend preview layout: configurable portrait/landscape and intelligent columns, full-width diagrams where necessary, consistent numbering, page breaks, working space and teacher keys.
5. Save/reopen and reusable settings, stable versioned model records, import/export of drafts with validation; preserve exact content rather than regenerating silently.
6. Align controls and branding with Studio's existing worksheet workflow. Test actual preview/print parity and mobile/touch performance.
7. Acceptance test level 1, level 2 and mixed level 3 on every eligible widget; static-only tools need correct capture and placement, not invented game engines.

## Workstream B — widget quality

Continue the catalogue review one widget at a time, with defects and regressions recorded here. Publishing adapter work should count toward the relevant paper/generator checks only; it cannot close the visual or interaction checks. Continue curriculum refinement and avoid game/puzzle duplication. Use the actual deployed build and screenshots to verify visual work.

## Current verified scope

- Twelve catalogue entries have shared publishing adapters (Arithmetic, Sequences, Abacus limited to three bead instruments, Place Value, Clock & Time, Fraction Wall, Array Builder, Number Line, UK Money, Coordinate Grid, Bar Model, Hundred Square).
- Automated abacus rollout checks: 2,160 generated tasks; 4,320 pupil/teacher diagrams; 108 mixed-document scenarios and isolated replacements; 1,236 page checks.
- Automated Place Value rollout: 45 column ranges, 14,040 generated tasks, 28,080 pupil/teacher diagrams, 135 mixed drafts and isolated replacements, 135 captures and 1,655 page checks. Custom teacher-authored tasks still require individual export; the existing powers-of-ten demo is capture-only.
- Clock rollout: 2,800 individual generator/render checks; 100 multi-source clock drafts, 1,900 generated questions, 200 captures, 100 isolated replacements and 2,583 pupil/teacher page checks. One-clock recipes enable 10 types; two-clock recipes enable 14. Custom tasks remain direct-export only. Actual browser, touch and A4 verification is open.
- Fraction Wall rollout: 3,000 individual checks, 100 two-source drafts, 1,600 generated questions, 200 captures, 100 replacements and 1,527 page checks; 3,400 prompt-baseline alignments checked. Standalone card headings preserved. Preview-only right-side actions replace the content sidebar; real browser/touch/print validation remains open.
- Array Builder: 4,200 individual generation/render checks, 100 two-source documents, 1,400 generated questions, 200 captures, 100 replacements, 1,679 page checks and 3,000 baseline alignments. Saved factor range shared by native and automatic generation; captured build tasks retain original target and recipe. Browser/touch/print QA remains open.
- Both entry points must load identical shared asset versions.
- No real browser visual, touchscreen or physical A4 acceptance run was performed in this batch. No widget is signed off as finished.

### Compact worksheet layout and teacher annex (25 November)
- Shared document cards now remove excess vertical space; equation-only items use compact intrinsic geometry and reduced equation type, without applying that reduction to diagrams. Written boxes and line spacing are larger for handwriting. Standalone exports retain their original layout.
- Pupil mode prints questions only; With answers appends a numbered, text-only answer annex from frozen mathematical records. Pupil pages are identical between modes. Diagrams without questions have no annex entry; numbering follows the actual document order. Construction/alternative answers use concise expected results or example solutions. Standalone widget teacher exports remain unchanged.
- Verified 80 mixed seven-widget documents, 2,800 annex entries, 1,161 pupil pages and 160 annex pages; exact pupil-page structural parity, answer order and single branding checked. A ten-question missing-result document uses two pages in the SVG layout. No actual browser or physical print validation. Browser print headers/footers still require disabling in print settings if shown.
- Next planned widget: Number Line; seven of 20 adapters integrated.

### Number Line shared publishing (25 November)
- Eighth catalogue adapter: all 25 standard templates, current demonstration/challenge capture, automatic generation, individual replacement and concise answer annex. Automatic builder provides five scale presets and answer-space selection; fraction, zoom and proportional tasks use their own compatible scales. Across-zero tasks require a negative-to-positive scale.
- Live and paper outputs now use the same generator and SVG renderer, retaining existing marker/tick collision lanes and relationship geometry. Unknown jump positions remain concealed in pupil output; missing-label boxes reset after reveal and have no redundant response box. Nearest-endpoint ties are avoided; scale-reading and misconception tasks vary subranges/tick multiples so replacement works under fixed outer ranges. Long/non-divisible challenge scales use a bounded aligned subset of the configured range rather than claiming incorrect endpoint intervals. Custom authored tasks remain direct-export only.
- Initial 5,840 generator/markup checks; final 3,630 across all five presets, plus 40 mixed Number Line/arithmetic documents, 800 generated questions, 80 current captures, 40 isolated replacements, 321 pupil pages, 40 annex pages and 840 exact prompt alignments. Pupil pages identical in both modes; mock SVG DOM/lightweight XML validation, not browser or actual A4 signoff.
- Next adapter: UK Money, followed by Coordinate Grid. Eight of 20 catalogue entries integrated; full visual/touch/print acceptance still open.

### UK Money and Coordinate Grid follow-up
- UK Money: 3,000 generated tasks, 800 graphical solutions, independent minimum-piece validation, 30 mixed documents. Coordinate Grid: 3,200 generator checks, 800 individual solution checks, 30 mixed documents, 390 answer entries and alignment checks. Both entry points updated. Actual browser, touch and print acceptance still open.
- Graphical teacher annex includes solved diagrams and marking guidance. Next: Bar Model, then Hundred Square. Ten of 20 entries integrated; formal written methods follow the existing catalogue rollout.

### Bar Model follow-up
- 2,400 generator checks, 800 pupil/solution checks, 30 mixed documents, 390 annex entries. Both entry points updated. Real browser/touch/print acceptance remains open. Next: Hundred Square.

### Hundred Square follow-up
- 6,000 generator checks, 1,600 pupil/solution checks, 30 mixed documents, 390 annex entries. Both entry points updated. Browser/touch/print acceptance remains open. Next: Multiplication Grid.
