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

Current main baseline: `c2f81cd5dd3b5e23359aec53ed52b377d3a11a58` (#416 merged after successful focused QA). This audit candidate includes #417 at `de12230adb9acb661a7301bc61a7c78ccc3a57da` and depends on its focused QA and merge. Previous full Studio run [46042380060](https://github.com/techtinkerclub/99club/actions/runs/46042380060) passed 12 of 13 jobs; mixed Goodies composition failed on its older baseline. Do not carry that result forward as current acceptance.

- [x] Rebuild the audit on the current teaching and linked-challenge candidate rather than the obsolete #368 branch.
- [ ] Verify #417's final focused QA, merge it independently, then verify the integrated audit candidate.
- [ ] Run the full Studio QA workflow, including games, Custom Worksheets, printable catalogue, practice, security/privacy, SEO, help coverage, mathematical contracts and Goodies publication at phone and desktop sizes.
- [ ] Resolve actual failures with evidence. Do not weaken mathematical or layout assertions merely to make CI green.
- [ ] Review whole-app panel reachability, Help styling, controls and publication usability (see #331).
- [ ] Reconcile remaining geometry, written-method, statistics and curriculum gaps against the implemented catalogue; no implied full statutory coverage or timed presets.
- [ ] Verify production revision, physical touchscreen and representative physical printed pages; record device/browser and exact tested revision.
- [ ] Record a release decision with limitations and reproducible regression evidence.

Passing the automated suite is necessary but does not establish physical classroom acceptance or complete geometry coverage. Keep the recovered backlog (#369) open until each requirement is verified or explicitly deferred.

## Release discipline
Keep implementation, automated verification, visual approval, merge and live deployment separate. Prefer coherent verified batches; avoid leaving usable features on a long-lived branch unnecessarily. Record outstanding limitations honestly.
