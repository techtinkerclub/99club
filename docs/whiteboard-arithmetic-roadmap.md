# 99 Club Studio — whiteboard arithmetic roadmap

Updated 25 November 2026.

## Implemented
- Configurable arithmetic generation: operation and relation filters, number ranges, fixed-point decimal precision, left/right term counts, difficulty presets.
- Missing results, operands and operations; number bonds; equal expressions; comparisons; true/false; order of operations; inverse facts.
- Bracket calculations, squares/cubes, whole-number remainders.
- Practice sets of 1–10 distinct equations, including five-a-day: single type, category or all compatible types; new set; automatic, one-column and two-column layouts.
- Numbered interactive questions, shared numeric touch keypad, choices, per-question checking and reveal/hide of unresolved answers.
- Save/restore set, responses, layout and launch scope in lesson state.
- Unanswered set SVG/PNG/copy/print export, preserving numbering and selected column layout.
- Existing single-question workflow preserved when quantity is one.

## Verification
- Extended generator: 5,700 generation checks passed in earlier session.
- Practice-set generator: 738 sets / 3,936 questions at counts 1, 5 and 10 across all three presets and compatible single-type/category/mixed scopes. No repeated equation within a set; two incompatible requests rejected.
- Changed JavaScript files parse successfully.
- **Pending:** live browser deployment verification; actual touch/keypad interaction, mobile and board resizing, lesson save/reopen, PNG/SVG/copy, portrait print readability (especially ten long expressions in one column). Generator tests are not browser integration tests.

## Equation typography polish (25 November)
- Shared range-based numeric answer width and compact symbol answer width; consistent inline height and equation font across the entire set, including inverse facts and SVG export.
- Compact worksheet-style layout following classroom feedback: left-aligned headings and equations, smaller shared font cap, slim inline answer boxes, Check controls beside equations, feedback in headings, tighter gaps and subtle borders. Paper export uses left-aligned equations and reduced row heights. Responsive shared font budget changes for the entire grid, never a single question.
- Browser visual/touch and actual paper checks remain pending. Exceptionally long equations can require the whole set to use a smaller font; future pagination or expression wrapping should improve that without inconsistent type sizes.

## Shared paper publication pass (25 November)
- Reviewed export entry points across the catalogue. Legacy diagram branding, nested challenge-card branding and print-page branding could stack.
- Shared export layer removes legacy generated marks from cloned diagrams, adds one canonical footer, and uses the same prepared SVG for copy/PNG/SVG/print. Print avoids duplicate card headings and sizes to the A4 content area. Existing portrait/landscape and transparency choices remain.
- Arithmetic answer key: explicit teacher-only copy and print actions, exact current question order and answers, independent of pupil responses and reveal state. Pupil exports stay unanswered.
- Remaining consistency audit: older Place Value and Abacus paper modes currently follow reveal state; define explicit pupil versus teacher exports across all widgets, harmonise card/prompt/working-space templates, review diagram-specific hidden labels, print orientation and pagination with actual browser output. Do not silently change legacy teacher behaviour.
- Browser print/PDF and raster/clipboard tests remain outstanding; shared code tests are not visual signoff.

## Curriculum extensions (25 November)
- Source: England DfE mathematics programme of study: https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study
- Fourteen individually selectable fraction, percentage and exact-root topics, grouped by indicative curriculum year/stage. All default off for compatibility; KS3 roots and fraction division clearly separate from primary.
- Exact rational arithmetic, input denominator limit, fixed-format topics independent of ordinary term counts. Whole quantities and roots respect ordinary range; mixed-number whole parts are 1–4; whole multipliers/divisors are 2–12 within the range.
- Stacked fraction notation on screen and paper; existing touch keypad and separate teacher keys.
- Generator checks: 8,400 individual questions and 120 ten-question sets, six denominator caps, operation filters and default-off regression checks passed.
- Remaining: fraction ordering, fraction/decimal/percentage conversions, mixed-number multiplication, signed fractions, higher powers and root approximations (optional KS3), full curriculum presets and browser/print QA.

## Settings refinement (25 November)
- Maths Canvas settings now use progressive disclosure: quantity/layout and preset visible, operations/comparisons, range/terms, optional topics and specific questions expandable. Preserve opened sections during selections and board proxy refresh; wider floating panel, compact workflow tabs and no horizontal scrollbar.
- Continue reviewing other widgets individually where crowded; do not impose additional panels on simple widgets. Browser verification pending.

## Abacus paper tasks (25 November)
- Shared live/paper bead position and active-state logic, reduced bead diameter to avoid overlapping western beads and vertical bead collisions; theme-aware SVG.
- Task exports now reconstruct the original start rather than exporting a child's partially solved or revealed screen. Build-number tasks show only a final template; operation tasks show start plus a final outline template to shade. Western rows shade from left; soroban/suanpan shade nearest the beam. Teacher keys explicitly requested and show completed final configuration.
- Paper prompts omit interactive Check/move instructions. Pupil and teacher exports are independent of reveal state. Other historical calculator paper workflows remain to audit.
- Standard templates only where meaningful: single diagram, before/after construction, question set, teacher key. Do not force all four onto every widget.
- Browser/print review pending, including visual comparison of themes and final template readability.

## Curriculum presets and daily practice (25 November)
- Curriculum selector: Free choice, Years 1–6, KS3 extension. Independent Easy/Medium/Hard choices adapt ranges and denominator caps within the selected profile. The profiles are arithmetic teaching starting points, not complete statutory curriculum coverage; targeted multiplication-table filters, year-specific mental/written methods and restricted early fraction forms still need development.
- Curriculum profile applies only when explicitly selected. Manual changes return to Free choice / Adjusted; saved settings and profiles persist. Older boards retain their original settings.
- One-tap 5 a day shortcut in the quick launcher and full settings uses five distinct questions mixed across compatible enabled types, with existing layout and export. New set retains the same scope.
- Source: https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study
- Browser interaction and live print verification pending.

## Worksheet response and conversion pass (25 November)
- Abacus number bonds distinguish the missing addend from the final total explicitly; paper prompts include place-value exchange and specify one step for skip counting.
- Shared worksheet composer now puts the response label on a separate line above boxes, writing lines and teacher answers, with height reserved for wrapped labels. Fixes the abacus “Missing number” overlap and applies to all widgets using the composer.
- Six opt-in exact fraction/decimal/percentage conversion directions and fraction comparisons; Year 5+ starting presets include them. Fractions use the selected denominator cap, conversions use values strictly between zero and one with at most two decimal places, comparison symbols respect the enabled relation filter. Simplest-form fraction answers required where indicated.
- Existing distinct-question policy retained. Very small denominator caps can have fewer unique conversions than the requested set; show a clear error rather than repeat questions.
- Fraction ordering, more precise year-based conversion restrictions, target puzzles and reasoning remain. Browser/print appearance not yet verified.

## Place value paper tasks (25 November)
- Counters are the primary model; addition no longer forces bead-frame mode. Legacy bead-frame/linked displays remain under Setup > Display options for saved lessons and comparison.
- Paper-specific counter charts: reading/hidden/digit tasks use one original chart and an answer box; build/exact tasks use a blank drawing chart; addition/regroup/same-value tasks use starting and blank final charts. Same-value tasks omit unnecessary numeric response boxes. Teacher keys show the original task and an example solution, not live pupil progress.
- Explicit teacher copy/print paths and immutable original counts for new activities and standard generated tasks. Old saved regroup tasks without original counts may reconstruct an equivalent starting chart; custom challenges retain their existing diagram behaviour.
- Taller stacked paper layouts use portrait printing and a per-template diagram height allowance; visual A4 checks pending.
- Automated checks: 960 pupil/teacher worksheet pairs over six whole-number and decimal ranges; 117,288 SVG nodes checked for finite geometry, plus blank response charts, equal-value alternative solutions and exact counter budgets. These are DOM-model checks, not rendered-page verification.
- Retain addition and regrouping teaching tools, not duplicate all generic abacus arithmetic. Review remaining panel density after classroom feedback.

## Arithmetic reasoning and ordering (25 November)
- Three optional fixed-format tasks: order three/four distinct proper fractions (exact cross multiplication), order three arithmetic expressions with distinct values, and correct a deliberately incorrect calculated result. Use labelled answers through the existing touch keypad; paper prompts explain the response convention. Curriculum starting profiles include them from Years 5, 4 and 3 respectively.
- Expression ordering/correction use a bounded pool of exact fixed-point calculations constrained by enabled operators, selected number range and precision. Incompatible settings hide these types. Fraction ordering uses the denominator limit and avoids equal-valued alternatives.
- Single arithmetic worksheet exports now use the shared plain worksheet composer and omit redundant response boxes when the equation already has an inline response. Choices are listed in paper instructions when needed.
- Target-number puzzles with multiple valid solutions remain a separate next priority; avoid disguising a single-answer calculation as an open-ended target puzzle.
- Browser and print validation still pending.

## Next priorities
1. Visual/touch feedback: validate the practice-set launcher, whiteboard layout, inline answer boxes, responsive columns and paper outputs; refine density and font sizes after classroom feedback.
2. Worksheet-oriented improvements: separate arithmetic answer key implemented; five-a-day shortcut implemented; optional space for working, shared pupil/teacher export policies across all widgets, and print pagination remain.
3. Extend the implemented fraction/roots topics to remaining curriculum content and complete visual QA, and refine the curriculum presets.
4. Target-number puzzles with multiple valid solutions; extend error-spotting to reasoning explanations. Initial fraction/expression ordering and result correction implemented.
5. Refine curriculum presets with narrower year-specific objectives, including multiplication-table and early fraction constraints.
6. Dedicated sequences and rules widget: number sequences, missing terms, next terms and rule reasoning. Keep separate from arithmetic generator but reuse challenge interaction and export patterns.
7. Performance and accessibility audit of whiteboard, all manipulatives and mobile/touch behaviour.

## Principles
- No reliance on a physical keyboard.
- Challenge launcher offers quantity and layout without deep menus; existing random all/category/specific paths remain.
- A new set is generated without carrying forward previous responses. Layout changes preserve questions and responses.
- Export must not leak answers, even after reveal. Teacher-selected ranges and operations remain respected.
- Avoid claiming visual or print verification until performed in a browser.
