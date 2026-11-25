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

## Next priorities
1. Visual/touch feedback: validate the practice-set launcher, whiteboard layout, inline answer boxes, responsive columns and paper outputs; refine density and font sizes after classroom feedback.
2. Worksheet-oriented improvements: separate arithmetic answer key implemented; dedicated five-a-day shortcut, optional space for working, shared pupil/teacher export policies across all widgets, and print pagination remain.
3. Exact fraction arithmetic: equivalence, addition/subtraction, multiplication/division where appropriate; integrate with the same quantity, layout and export workflow.
4. Target-number puzzles; ordering expressions by value; identify and correct errors. Ensure questions are solvable and answer checking handles valid alternatives.
5. Curriculum-aligned KS1/KS2 presets and compatible question-type controls.
6. Dedicated sequences and rules widget: number sequences, missing terms, next terms and rule reasoning. Keep separate from arithmetic generator but reuse challenge interaction and export patterns.
7. Performance and accessibility audit of whiteboard, all manipulatives and mobile/touch behaviour.

## Principles
- No reliance on a physical keyboard.
- Challenge launcher offers quantity and layout without deep menus; existing random all/category/specific paths remain.
- A new set is generated without carrying forward previous responses. Layout changes preserve questions and responses.
- Export must not leak answers, even after reveal. Teacher-selected ranges and operations remain respected.
- Avoid claiming visual or print verification until performed in a browser.
