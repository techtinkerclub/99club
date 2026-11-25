# 99 Club Studio whiteboard — development plan

This is a rolling engineering checklist, not a claim that unverified work is complete.
Update it with evidence and release revisions as the work progresses.

## 1. Existing manipulatives and whiteboard interaction
- [x] Initial per-widget functional QA for the 20 existing tools.
- [x] Common challenge presentation and touchscreen numeric responses; initial regression tests.
- [x] Geoboard adjustable 5×5–13×13 pin grids.
- [ ] Finish the current three-panel UI/UX review (PR #213): normal teaching settings, quick challenge launcher, full challenge settings. Preserve native mathematical controls.
- [ ] Inspect every widget's actual panel layout, touch targets, scrolling, disabled states, and action forwarding. Remove duplicated actions where safe.
- [ ] Verify specialist engines, custom challenges, historical abacus modes, and active-question preservation. Release tested improvements to main; verify deployed revision.

## 2. Publishing and teacher marking
- [x] Initial adapters for all 20 existing widgets (Randomiser illustration-only).
- [x] Manual current-item publication, widget batches, automatic mixed-widget builder, document review, teacher annex.
- [x] Initial shared A4 renderer and publication audit. Released in b0c9a82 (PR #212).
- [ ] Resume the deferred individual worksheet quality audit after panel consistency: every question family, print font size, diagrams, working space, pagination, no leaked answers.
- [ ] Verify graphical answers and explicit acceptance criteria for all valid alternatives; no teacher guesswork.
- [ ] Audit exact current illustrations and authored custom challenges, generation coverage and variety, and mixed documents. Do not equate an adapter with complete support for every live state.
- [ ] Final mathematical, browser, layout, print and release QA.

## 3. Extend the manipulatives (after existing publishing is solid)
- [ ] UK primary written addition, subtraction, multiplication and division: research curriculum and teaching conventions; interactive whiteboard demonstrations, place-value alignment, exchanges/remainders, challenge generation, proper worksheet working space and worked marking keys.
- [ ] Primary statistics and graphs: bar charts, line graphs, pictograms, tables, pie charts and other relevant curriculum representations. Research year-appropriate reading, interpretation and construction tasks. Combine meaningful data with challenges and worksheets.
- [ ] Curriculum coverage review across existing and new tools, refine difficulty and question variation.
- [ ] Final integrated QA, usability review and production release.

## Release discipline
Keep implementation, automated verification, visual approval, merge and live deployment separate. Prefer coherent verified batches; avoid leaving usable features on a long-lived branch unnecessarily. Record outstanding limitations honestly.
