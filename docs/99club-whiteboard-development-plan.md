# 99 Club Studio whiteboard — development plan

This is a rolling engineering checklist, not a claim that unverified work is complete.
Update it with evidence and release revisions as the work progresses.

## 1. Existing manipulatives and whiteboard interaction
- [x] Initial per-widget functional QA for the 20 existing tools.
- [x] Common challenge presentation and touchscreen numeric responses; initial regression tests.
- [x] Geoboard adjustable 5×5–13×13 pin grids.
- [x] Shared three-panel UI/UX refinements and actual floating-panel interaction tests (PR #213, merged as 4ad14a2). Normal teaching settings, quick launcher and full challenge settings; native controls retained.
- [ ] Inspect every widget's actual panel layout, touch targets, scrolling, disabled states, and action forwarding. Remove duplicated actions where safe.
- [ ] Verify specialist engines, custom challenges, historical abacus modes, and active-question preservation. Release tested improvements to main; verify deployed revision.

## 2. Publishing and teacher marking
- [x] Initial adapters for all 20 existing widgets (Randomiser illustration-only).
- [x] Manual current-item publication, widget batches, automatic mixed-widget builder, document review, teacher annex.
- [x] Initial shared A4 renderer and publication audit. Released in b0c9a82 (PR #212).
- [ ] Individual worksheet quality audit: every question family, print font size, diagrams, working space, pagination, no leaked answers. Baseline audit passed structure with 2,111 sub-7pt text observations and no reported page clipping. Dense-diagram and label refinements now pass the default sample audit with zero sub-7pt observations and zero reported page clipping. Rendered 159 audit pages from PR #214 (163 default question families and 12 additional historical-instrument questions), visually reviewed at contact-sheet scale. Default and historical samples report zero sub-7pt text and no page clipping. PR #214 merged as a28c7b6; final annex packing adjustment merged as a055164 (PR #215, all five browser suites passed). Alternate settings and direct classroom visual acceptance remain outstanding.
- [ ] Verify graphical answers and explicit acceptance criteria for all valid alternatives; no teacher guesswork.
- [ ] Audit exact current illustrations and authored custom challenges, generation coverage and variety, and mixed documents. Do not equate an adapter with complete support for every live state.
- [ ] Final mathematical, browser, layout, print and release QA.

## 3. Extend the manipulatives (current phase)
- Phases 1 and 2 are released milestones; remaining classroom acceptance and unusual configurations roll into final integrated QA.
- Written-method engine: column addition/subtraction, short/long multiplication, short/long division. Year profiles are teaching defaults, not a claim of full statutory coverage. Initial integer-only scope; decimal methods, short division by suitable two-digit divisors and contextual remainder interpretation remain to implement.
- Curriculum reference: https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study
- All four initial integer teaching interfaces, step controls, final-answer practice, pupil grids, graphical worked annex and mixed builder integration are implemented on PR #216. Division has separate quotient/remainder fields. Next: working-cell interaction, decimal scope, contextual remainders and final QA.
- [ ] UK primary written addition, subtraction, multiplication and division: research curriculum and teaching conventions; interactive whiteboard demonstrations, place-value alignment, exchanges/remainders, challenge generation, proper worksheet working space and worked marking keys.
- [ ] Primary statistics and graphs: bar charts, line graphs, pictograms, tables, pie charts and other relevant curriculum representations. Research year-appropriate reading, interpretation and construction tasks. Combine meaningful data with challenges and worksheets.
- [ ] Curriculum coverage review across existing and new tools, refine difficulty and question variation.
- [ ] Final integrated QA, usability review and production release.


## 7. Integrated release acceptance (parallel regression checks; final gate deferred)

Geometry implementation baseline: `58b883bc29a176bbe954e7f53cff61194e9b3d6f` (PRs #352–367 merged). [Focused post-merge QA](https://github.com/techtinkerclub/99club/actions/runs/46041523166) and [Pages deployment](https://github.com/techtinkerclub/99club/actions/runs/46041522565) both succeeded. Direct production browser and physical classroom acceptance remain unverified.

- [x] Consolidate geometry implementation and regression evidence; keep specific outstanding acceptance issues open (#266, #283, #330–333, #336).
- [ ] Run the full Studio QA workflow on the current release candidate, including games, Custom Worksheets, printable catalogue, practice, security/privacy, SEO, help coverage, and Goodies at phone and desktop sizes. Include written-method and statistics contracts and Goodies publication.
- [ ] Resolve actual failures before adding further features; distinguish legacy failures from regressions using evidence.
- [ ] Review standalone Help, whole-app panel reachability, compact layout, action consistency and publication controls (see #331). Desktop and phone automation is not equivalent to a physical whiteboard review.
- [ ] Reconcile remaining written-method, statistics and curriculum gaps against the current implemented catalogue; no implied full statutory coverage and no timed worksheet presets.
- [ ] Verify production revision, physical touchscreen and representative physical print outputs; record device/browser and exact tested revision.
- [ ] Record a release decision with outstanding limitations and a reproducible regression checklist.

The tested geometry engine is a foundation, not a completed geometry product. The recovered expansion backlog is tracked in #369 and the geometry roadmap (G3–G7 and 6H–6L). Resume those gates before final catalogue acceptance. Run the integrated automated audit in parallel without diverting feature work. Do not freeze planned geometry capability or enrichment development. Keep the public 99 Club worksheet workflow and the separate Custom Worksheets workspace independent.

## Release discipline
Keep implementation, automated verification, visual approval, merge and live deployment separate. Prefer coherent verified batches; avoid leaving usable features on a long-lived branch unnecessarily. Record outstanding limitations honestly.
