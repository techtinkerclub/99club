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
- Automated checks: 2,600 individual generation checks, 144 ten-question sets, 120 SVG/markup/answer-key sets and 1,200 answer-checking tests passed. Seven incompatible settings combinations excluded. Browser and print validation still pending.

## Target-number puzzles (25 November)
- Optional Reach the target topic (Year 4+ teaching starting profile), with three positive integer tiles used exactly once; teacher operation filters and bracket toggle are respected. Disabled for decimal settings or incompatible ranges/operations.
- Constructive generation with a verified witness. Exact bounded integer expression parser (no eval) accepts valid arrangements, ordinary precedence and permitted brackets; rejects invented/reused/omitted operands, disallowed operations, non-exact division and malformed expressions. Canonical set deduplication ignores tile order.
- Shared expression touch keypad, wider response box, explicit rules on whiteboard and paper, separate teacher key marked as one possible solution.
- Retain the initial three-tile scope as a short teacher-led activity. Do not expand into a standalone target-number game or larger puzzle engine without first reviewing the existing Studio Games & Puzzles catalogue and establishing a distinct teaching need.
- Automated checks: 2,100 puzzle generation/validation checks, 70 initial five-question sets, 120 ten-question SVG/markup/key sets and 1,200 shared-checker validations passed. Browser/print visual QA remains pending.

## Catalogue comparison and sequence teaching model (25 November)
- Reviewed actual Studio sources: games-arithmetic.js (Target Number Challenge, Number Trails & Snakes, Function Machines, Number Connections); games-play-target-v1.js (existing interactive target game); games-app.js (catalogue and print rendering). These already cover independent puzzle generation and practice.
- Existing Whiteboard three-number target activity stays available by explicit selection only; no longer automatically enabled by year/KS3 presets. Saved settings are not overwritten.
- Added a teacher-led Sequences & rules manipulative: directly choose first term, number of terms, constant/changing difference, multiplication factor or alternating differences; reveal terms progressively and toggle rule/links. No random puzzle generator, scoring or new independent practice engine.
- Uses the same SVG for display and export; hidden terms remain blank, and links into hidden terms are not exported. Lesson save/restore supported. Function-machine expansion deferred pending a distinct live teaching need because the Games catalogue already has it.
- Synced all shared asset versions and sequence script registration between /whiteboard/ and /goodies/; the former previously referenced older cached assets. Automated checks: 576 sequence states, 12,928 SVG nodes, 21 year/difficulty opt-in checks; both entry-point asset manifests match exactly. Browser, embedded-board interaction and print appearance still need visual QA.

## Arithmetic working space and A4 pagination (25 November)
- Optional 0/2/4 working lines per question, in Export only, saved with the widget. No changes to whiteboard response layout. Single question worksheets use the working section without a redundant answer box when the equation contains one.
- Question sets calculate row heights including working space and instructions; print uses complete rows on separate portrait A4 SVGs with the same font metrics, continued numbering, page headings and a single footer per page. Copy/PNG/SVG still export the continuous set for external layout work.
- Shared print helper accepts one SVG or an array of pages, preserving existing single-page callers. Both entry pages have matching cache versions.
- Whiteboard frame Export → Paper settings exposes the arithmetic Export controls directly, without requiring a hidden workflow tab. Automated checks: 288 sets, 444 pages, 2,160 questions; four simulated print documents verified page count, footer count and backwards-compatible single-page print options. Physical print/browser testing remains outstanding; the next cross-widget pass should focus on model-building response areas and explicit teacher keys.

## Contextual sequence challenges (25 November)
- Added Find the next term, Find the missing term and Identify the rule to Sequences & rules, using the existing native challenge launcher, touch numeric keypad, Check/Another/Reveal/Exit and explicit family/difficulty choices. This is short teacher-led practice; no independent puzzle engine or progression.
- Prompts name the rule family so finite sequences are not presented as uniquely inferable without constraints. All tasks hide rule text and arrows until reveal. Pupil exports preserve the original missing term even after solving/revealing; teacher keys are explicit. Saved exploration models remain compatible.
- Added sequence widget to automatic height fitting to reduce wasted whiteboard space. Browser/touch/print verification pending.

## Publishing programme — final product goal (25 November)
Three levels: (1) publish the current challenge or non-challenge representation for every widget; (2) generate a document of multiple challenges from one widget using its generation settings; (3) assemble a complex document across multiple widgets, each with independent settings, grouped or mixed. For levels 2 and 3, preview the document before publishing, replace individual challenges with another of the same type under the captured settings, reorder, remove, mix or group; pupil and teacher versions must stay in lockstep.
- Reviewed existing Custom Studio custom-app.js replaceOne and pdf-layout.js preview/print. Reuse its review-and-replace principle, rather than create another games catalogue. Widget generators/renderers stay the authoritative source.
- Initial shared publishing pilot: Arithmetic and Sequences & rules only, from each widget frame Export → Add current to document / Generate for document. Global worksheet document button reopens the combined draft. The model captures each item and its generation recipe independently; replacement never regenerates the other items or mutates a live widget. Group/mix/reorder/remove, document title, actual paginated pupil/teacher preview and Print/PDF. Existing single exports untouched.
- Pilot limitations: session-only draft, vertical full-width A4 layout, at most 80 items, 20 per addition; no arbitrary imported SVG or document save/reopen yet. More adapters required for every other widget, and review controls need classroom/browser QA. The existing worksheet editor's school branding, more elaborate layout controls and reusable document persistence remain future integration work.
- Automated initial checks: 120 mixed draft scenarios, 1,440 items, 120 isolated replacements and 1,204 pupil/teacher page geometry checks. Initial test uses mock SVG DOM, not browser print rendering.
- Rollout: audit and certify each widget's current representation and pupil/teacher renderer; extract pure generation and snapshot adapters; add current/generate/replace to all eligible widgets; then improve document editor layout, per-source generation recipes, persistence and print/preview parity. No additional game engines.

## Publishing rollout and whole-catalogue quality gate (25 November)
- Third publishing adapter: Western abacus, Chinese suanpan and Japanese soroban; original generator and paper rendering refactored into reusable functions, with the live widget still calling them. Capture existing diagram or task; generate any of nine task types under captured device, rod count and display settings; replace individually; pupil and teacher diagrams follow existing start/final templates. Historical calculators remain outside this adapter until their paper representations are reviewed. Their old single-export path incorrectly drew a bead frame instead of the selected historical device; export now reports an explicit limitation rather than publishing the wrong instrument.
- Generation type selector now lists compatible types for all three pilot adapters. The current board and other document items remain unchanged.
- Automated checks: 2,160 abacus tasks, 4,320 pupil/teacher diagrams, 108 mixed documents and isolated replacements, 1,236 document page checks. Historical instrument rejection checked; no real browser or printer QA.
- The 20-widget audit is a separate mandatory workstream, not superseded by publishing. See docs/whiteboard-widget-review.md. No widget is certified until visual, mathematical, challenge, settings, touch and print checks are completed.

## Place Value shared publishing (25 November)
- Fourth document adapter: five standard challenges plus eight counter activities (build, exact, regroup, same value, read, hidden place, digit value, addition). Shared generator now drives live standard challenges and random counter activities as well as document generation; paper renderer is shared with direct pupil/teacher exports. Captures range, counter budget, addition regroup preference and original representation independently.
- Current free/teaching diagrams captured using existing static renderer, including legacy linked views; long counter stacks no longer clip due to capped export height. Custom authored tasks remain direct-export only until safe frozen custom response semantics are reviewed. Powers-of-ten demonstrations can be captured as diagrams, not randomly generated puzzles.
- Fixed narrow custom ranges that produced insufficient variation, and changed zero-placeholder prompts to avoid assuming that trailing decimal zeros change numeric value. Shared document composer isolates local SVG IDs and references per question to avoid repeated clip-path collisions.
- Automated checks: 45 column ranges × 3 addition settings, 14,040 generated tasks, 28,080 pupil/teacher diagrams, 135 mixed drafts, 135 isolated replacements and captures, 1,655 page checks. Full browser, touch and actual print certification remains open.

## Publishing UX and dual entry workflow (25 November)
- User screenshots show horizontal export menu overflow and oversized/misaligned document controls. Replace with a compact grouped popover, explicit local type scale and consistent 34–36px controls; redesign review, generator dialogue and responsive layout. Actual browser appearance still needs checking.
- Two entry workflows, one document: live capture/generate from a widget; automatic builder with a full catalogue, independent source blocks, quantities and compatible challenge checkboxes. A widget may be added more than once with different settings. Both append to the same review draft; existing items are retained. Source generation is atomic, with type-balanced selection and independent frozen recipes.
- Automatic builder currently enables the four integrated widgets only; other catalogue rows are disabled until adapters are ready. Arithmetic options include curriculum, difficulty, ranges, precision, allowed operations/relations, term counts and opt-in topics. Abacus, Place Value and Sequences use their existing settings. No separate challenge engine.
- Automated builder checks: 100 four-widget drafts, 1,500 generated questions, 100 atomic failure checks, selected-type balance and isolated replacement. Both entry-point manifests match. Popover bounds correction and review scroll preservation added; actual browser acceptance remains open.
- Continue remaining adapter rollout, then persistence, intelligent document layouts, source recipe editing and full visual/touch/print quality gate.

## Clock & Time shared publishing (25 November)
- Fifth catalogue adapter: 14 existing standard types, including four comparisons enabled when a second clock is available. The original native challenge generator now supplies the live widget and document editor; no parallel random challenge engine.
- Pupil clock tasks preserve elapsed-time start evidence; set-time tasks have blank faces and teacher keys show correct hands. Analogue read solutions omit unnecessary AM/PM. Paper comparison tasks retain clock labels and AM/PM evidence. Standard pupil cards no longer include hidden answer metadata or live reveal state. Free diagram export respects digital and seconds options. Custom authored tasks remain individual-export only until safe frozen semantics are reviewed.
- Automatic builder exposes independent one/two-clock source settings, horizontal/vertical comparison layout and response space. Current diagrams, generation and same-type replacement use the shared draft; explicit copy/print teacher keys for direct standard challenge exports.
- Automated checks: 2,800 individual generation/render checks; 100 multi-source clock documents, 1,900 generated questions, 200 captures, 100 isolated replacements and 2,583 pupil/teacher page checks with the real composer in a mock SVG DOM. Both entry-point asset manifests match and modified JavaScript parses. No actual browser/touch/print signoff.
- Next adapter: Fraction Wall. Continue the full widget audit separately; publishing integration is now 5 of 20 catalogue entries, all final QA open.

## Worksheet review refinements and Fraction Wall (25 November)
- User feedback: align question number and prompt, remove redundant small type labels, replace content sidebar with contextual actions beside each question. Shared plain cards now suppress the type heading only when composed into a document and expose the first prompt baseline for exact numbering. Direct standalone cards retain headings. Group/Mix remain in the toolbar.
- Preview-only HTML action rail is separate from paper SVG and print path. Move up/down, replace and remove sit beside each numbered item; narrow screens use a contextual ellipsis. Actual responsive browser/touch appearance needs verification.
- Sixth adapter: Fraction Wall, six existing challenge types and current wall/workbench captures. Shared native generator expands denominators and equivalent/reducible fraction variation; mixed answers are simplified. Compact same-width strips hide the original unknown labels, with explicit teacher copy/print. Custom authored tasks remain individual-export only. Automatic builder exposes answer space; no new curriculum range setting introduced.
- Checks: 3,000 individual generation/render checks; 100 two-source drafts, 1,600 generated questions, 200 captures, 100 isolated replacements, 1,527 pupil/teacher pages and 3,400 exact prompt-baseline alignments in mock SVG DOM. Standalone headings retained. Browser and actual A4 QA open.
- Next adapter: Array Builder. Six of 20 catalogue entries integrated; no final widget certification yet.

## Array Builder shared publishing (25 November)
- Seventh adapter: seven native challenge types, direct current diagram or challenge capture, automatic source generation and same-type replacement. Shared paper renderer gives blank 12 × 12 drawing grid for build tasks, exact target array in teacher keys, visible partition lines and no hidden-answer readouts.
- Explicit factor range settings in live challenge panel and automatic builder (2–12, default 2–10, minimum strictly below maximum); live settings persist and captured generated tasks retain their original range. Commutative tasks avoid equal factors; paper labels stay horizontal. Custom teacher-authored challenges remain direct-export only.
- Automated checks: 4,200 individual generation/render checks across three ranges; 100 two-source documents, 1,400 generated questions, 200 captures, 100 isolated replacements, 1,679 pupil/teacher page checks and 3,000 prompt baseline checks. Mock SVG DOM, not browser acceptance.
- Next adapter: Number Line. Seven of 20 entries integrated; final widget certification still open.


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


### Graphical answer annex and later written-methods work
- Teacher annex: solved vector graphics for Abacus, Place Value, Fraction Wall, Array Builder, Clock, Number Line and Sequences, with task-specific marking notes. Arithmetic remains concise text. Completed models omit starting models where appropriate. Future graphical adapters must implement answerGraphic/answerNote as appropriate.
- Verification: 696 individual questions, 616 graphics, 264 marking notes; 25 mixed documents, 800 entries, 700 graphics, 327 pupil and 239 annex pages; structural parity, bounds and branding in mock SVG DOM. Real print legibility and compactness remain open.
- Finish all 20 existing publishing adapters first. Next: UK Money.
- Then dedicated formal written-methods tools: column addition, column subtraction (interpreting repeated addition request), short and long multiplication, short and long division. Research England primary curriculum, DfE guidance and school calculation policies before specifying progression and notation. Include interactive step-by-step demonstrations, carries/exchanges, partial products and remainders, structured pupil working grids, worked solution graphics and marking guidance. Support school notation variants.


### UK Money shared publishing and graphical annex refinement
- Ninth adapter: all ten standard Money challenge types, shared live/worksheet generator, demonstration and challenge capture, automatic source, replacement and graphical answer annex. Marking criteria distinguish exact-piece, minimum-piece and any-valid-combination tasks. Coin artwork is reused from the live widget, including twelve-sided £1 geometry.
- Compact graphics sit beside answer text; wide charts remain full-width.
- Checks: 3,000 generated tasks, 800 solution diagrams with independent minimum-piece validation, 30 mixed nine-widget documents, 840 annex entries, 750 graphics, 350 pupil and 208 annex pages, 30 replacements and 30 captured solved construction tasks. Mock SVG DOM verification; real browser/print QA open.
- Next adapter: Coordinate Grid, then Bar Model. Nine of 20 integrated. Formal written-methods tools follow the original 20.


### Coordinate Grid shared publishing
- Tenth adapter: all six existing standard challenge types, shared live/worksheet generator, manual capture, automatic source, replacement and solved graphical annex.
- Mixed, first-quadrant-only and four-quadrant generation settings persist with the live widget; the automatic builder exposes the same scope. First-quadrant-only excludes reflection and quadrant identification. Plot tasks leave the grid blank regardless of live reveal state; teacher diagrams show the exact target intersection. Reflection and translation keys show original and transformed coordinates plus dashed construction guides. Paper grids have labelled axes and collision-aware point label placement.
- Checks: 3,200 generator checks across three scopes; 800 individual pupil/solution checks, including 250 transformations and 150 plotting tasks; 30 mixed documents, 294 pupil pages, 150 annex pages, 390 answer entries, 30 replacements, 30 solved captures and 390 prompt alignment checks. Mock SVG DOM only; browser, touchscreen and physical print QA still open. Custom authored tasks remain individual-export only.
- Ten of 20 existing catalogue entries integrated. Next: Bar Model, then Hundred Square. Formal written methods remain queued after the existing rollout.


### Bar Model shared publishing
- Eleventh adapter: eight existing challenge types, shared native generator, manual capture, automatic source settings, same-type replacement, graphical answer annex and marking notes. Build-model tasks use blank drawing space and a missing-part answer box; completed keys use the original target, not the teacher's trial. Equal groups and comparison reveals show actual values on the whiteboard. Construction reveal restores the pupil's previous model when hidden again.
- Checks: 2,400 mathematical generator checks; 800 individual pupil/solution diagram checks, 400 marking notes; 30 mixed documents, 203 pupil pages, 124 annex pages, 390 answer entries, 30 replacements and 30 captures. Mock SVG DOM, not real-browser acceptance. Custom tasks remain individual-export only. Live model checking retains its existing ordered target; paper marking allows mathematically equivalent arrangements.
- Eleven of 20 existing entries integrated. Next: Hundred Square, then Multiplication Grid. Formal written methods remain queued after existing rollout.


### Hundred Square shared publishing
- Twelfth adapter: all eight existing challenge types, shared native generator, manual capture, automatic source, same-type replacement and solved graphical annex. Live and automatic settings offer five number ranges (0–99, 1–100, 101–200, 201–300, 901–1000). Short relationship/missing-number questions use complete-row extracts; pattern and marking questions use the full square. Solutions highlight the correct number or mark all rule matches. Captured solved tasks reset to original pupil state.
- Checks: 6,000 generation checks, 1,600 pupil/solution checks, 1,000 extracts, 200 rule-marking checks, 30 mixed documents, 245 pupil pages, 153 annex pages, 390 answer entries, 30 replacements and 30 solved captures. Mock SVG DOM only; actual browser/touch/print QA remains open. Custom authored tasks remain individual-export only.
- Twelve of 20 existing entries integrated. Next: Multiplication Grid, then Ruler & Measures. Formal written methods remain queued after the original catalogue. Confirm both entry-point asset versions match before proceeding.


### Multiplication Grid shared publishing
- Thirteenth adapter: six standard challenge types, shared generator, current capture, automatic source, same-type replacement and solved graphical annex. Grid size 5–15, default 12, in live and automatic generation. Relevant complete table rows for short tasks; full grid for locating a fact. Writable empty products, corrected error cells and explicit row/column marking guidance.
- Checks: 5,400 generation checks across six sizes; 1,080 pupil/solution checks, 180 blank-cell and 180 error checks; 30 mixed documents, 214 pupil pages, 135 annex pages, 330 answers, 30 replacements and 30 captures. Mock SVG DOM; real browser/touch/print acceptance open. Custom authored tasks remain individual-export only.
- Both entry points updated. Thirteen of 20 existing entries integrated; next Ruler & Measures, then Dice/Spinner.

### Follow-on workstream: Statistics and data handling
- User requested graphing manipulatives and statistics-based challenges after the existing publishing rollout. Schedule alongside (not in place of) formal written methods; keep the 20-widget baseline unchanged.
- Curriculum baseline: England DfE mathematics programme of study, statistics Years 2–6: https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study
- Y2: tally charts, simple tables, block diagrams and pictograms; Y3: scaled pictograms, bar charts, tables and comparison questions; Y4: discrete/continuous data, bar charts and time graphs, comparison/sum/difference; Y5: line-graph problems, tables and timetables; Y6: construct and interpret pie/line graphs and calculate and interpret the mean.
- Proposed shared data model and interactive graphing workspace with independently selectable representations: tables/tallies, pictograms/block diagrams, bar charts, line/time graphs, pie charts, and mean-as-equal-sharing. Editable categories, values, units, titles, scales and keys; touch-first drag/plot and increment controls, real-time linked table/chart views, optional step-by-step demonstrations. Do not confuse bar models with bar charts.
- Challenge families: read and compare; totals/differences; missing data; complete or construct a graph from a table; choose appropriate representations; identify misleading scales or incorrect plots; interpret change over time; fractions/percentages of pie charts; mean and missing values. Include contextual datasets (school surveys, weather, measurements, sports), internally consistent generated data, explicit units, appropriate scales and age-specific settings. Distinguish discrete and continuous data; pie sectors must sum to 360 degrees. Median/mode/range only optional extension, not assumed statutory primary objectives.
- Publishing from day one: current demonstrations, batches and mixed documents; adequate blank axes/grids and drawing space; solved diagrams, numerical answers, tolerances and marking notes where valid alternatives exist. Prefer shared data/renderer architecture over disconnected duplicate generators. Final widget split to be decided after reviewing teaching workflow.

## Next priorities
1. Visual/touch feedback: validate the practice-set launcher, whiteboard layout, inline answer boxes, responsive columns and paper outputs; refine density and font sizes after classroom feedback.
2. Worksheet-oriented improvements: separate arithmetic answer key implemented; five-a-day shortcut implemented; optional arithmetic working space and row-based A4 pagination implemented; shared pupil/teacher export policies across the remaining widgets still need work.
3. Extend the implemented fraction/roots topics to remaining curriculum content and complete visual QA, and refine the curriculum presets.
4. Consolidate the existing arithmetic teaching challenges and fix usability issues. Larger target-number puzzles and game-like extensions are deferred to avoid duplication with Studio Games & Puzzles.
5. Refine curriculum presets with narrower year-specific objectives, including multiplication-table and early fraction constraints.
6. Sequences & rules initial teaching manipulative implemented; validate live rendering, progressive reveals, rule visibility and saved lessons. Add input/output demonstrations only if justified separately from existing Function Machines activities.
7. Performance and accessibility audit of whiteboard, all manipulatives and mobile/touch behaviour.

## Principles
- Product boundary: Whiteboard/Goodies is for teacher-led demonstrations, exploration, configurable representations, short contextual checks and printable resources. Studio Games & Puzzles is for independent practice, dedicated puzzle collections, progression and extended problem-solving. Do not duplicate game engines or build game variants inside manipulatives merely to increase challenge counts. Review existing functionality before introducing new puzzle-like features.
- No reliance on a physical keyboard.
- Challenge launcher offers quantity and layout without deep menus; existing random all/category/specific paths remain.
- A new set is generated without carrying forward previous responses. Layout changes preserve questions and responses.
- Export must not leak answers, even after reveal. Teacher-selected ranges and operations remain respected.
- Avoid claiming visual or print verification until performed in a browser.


## Cross-manipulative paper geometry audit — agreed 27 November 2026

See [Geometry Lab roadmap](99club-geometry-lab-roadmap.md) for the full candidate list and provisional 6G–6M sequencing. This is an extension to, not a replacement for, the existing publishing, written arithmetic, statistics, individual widget QA and UI/UX workstreams.

**Implementation gate:** inspect existing model, renderer, teaching controls, challenge catalogue and publishing adapter before implementing each candidate. Record whether it is already available, needs refinement, belongs in a different widget, should be shared, or is not worth implementing. Prefer one well-designed tool to several overlapping versions. All candidates remain recorded, but inclusion in this plan is not automatic approval to implement.

| Owner | Candidate scope |
|---|---|
| Geometry Lab | Contextual style/colour and current instrument QA; trim/extend/split/join, protect givens, tracing paper and rigid/group transformations, accurate measurements of its own constructed geometry, construction guides/challenges/replay and optional KS3 scale/bearings. Maintain distinct fixed/free/constrained modes. |
| Geoboard / shape tools | Audit existing area and perimeter, compound shapes, grid counting, conservation of area, decomposition and challenges. Evaluate cutting, joining, moving pieces, tangrams and tessellation; use an existing shape manipulative or dedicated pieces workspace if the peg lattice is inappropriate. |
| Coordinate Grid | Already has six standard challenge families including reflection and translation; extend rather than recreate. Audit rotation, enlargement, arbitrary mirror lines, origin and scale controls, all four quadrants, linked points and graphical answers. Consider coordinate geometry versus graphs/functions as separate modes only when justified; coordinate plotting and transformations are geometry, function graphs are algebra. Coordinate mathematical engines with Geometry Lab; preserve distinct teaching interfaces. |
| Statistics | Data-driven graphs, charts and tables remain in existing statistics plan, not a duplicate Coordinate Grid feature. |
| Shared whiteboard | Reusable freehand pen, highlighter, text/math, arrows, annotation eraser, editable labels where applicable. Investigate current shared board capabilities before adding new tools. Annotations must not change mathematical answers or leak solutions. |
| Shared publishing | Exact-size output where supported, optional calibration mark, grids, working space, cut/fold guides where relevant, monochrome legibility, vector diagrams and correct graphical annexes. Verify real printer limitations separately from mathematical scale. |
| Deferred ideas | Faithful paper folding/origami only as a separate feasibility study if justified; simple fold-line reflection in transformations is enough for now. Extra physical utensils (French curve, parallel ruler, dividers, templates) not active scope; possible existing-protractor 360-degree mode only if a gap is verified. |

Current priority remains completing 6G and PR #297, verifying deployment, and resolving #266 locus tracing. Do not let this research create an uncontrolled expansion or delay fixing defects. For each new feature, check educational need, reuse, implementation feasibility, touchscreen interaction, challenge and publication implications, and release quality before proceeding.


## GeometryLab.net reference audit — shared measurement and teaching quality (27 November 2026)

See [Geometry roadmap](99club-geometry-lab-roadmap.md#reference-audit-geometrylabnet--teaching-explorer-improvements-27-november-2026). Improve the existing teaching explorers before expanding their catalogue. Assign coordinate transformations, midpoint/distance/gradient and equations to Coordinate Grid; function graphs to algebra (trigonometric graphs deferred advanced enrichment); primary area and perimeter/decomposition to Geoboard/shape tools; 3D properties, nets, surface area and volume to appropriate 3D tools. Audit current coverage first. Do not duplicate calculators or adopt advanced content simply because the reference site offers it.

### Ruler & Measures → candidate Measures & angles workspace

Existing measurement implementation in goodies-tools-b.js: 11 templates (read/place ruler, line/side/compare/perimeter, distance between marks, three unit conversions and misconception), metric/imperial and dual rulers, measurement-specific print calibration. Geometry already has angle estimation, measurement, construction and reflex families and a common ruler/protractor/set-square renderer in goodies-core.js; the two workspaces still have separate interaction paths. Do not discard the current measurement features.

Proposed: keep stable measurement widget ID, lesson state and publishing compatibility; consider user-facing name Measures & angles. Separate compact Length, Angles and Unit conversion modes. Reuse existing angle family definitions and generation/assessment/rendering; avoid two diverging versions or duplicate entries in automatic worksheet catalogue. Geometry keeps shape/angle relationships, constructions and dynamic geometry; direct measurement and reading instruments are the responsibility of Measures, with the same shared engine callable within Geometry and other suitable tools. Use linked modes or common content IDs for overlap, not duplicate generators.

- Extract reusable calibrated instrument controller only after current geometry utensil QA: shared ruler/protractor/set squares where appropriate, metric and imperial, multiple independent rulers, 180/360-degree protractor mode, placement/rotation/drag/resize, magnetic snap to actual geometry, local actions, screen-space target sizes, predictable zoom and measurement precision. Keep task-specific policies for tool availability, scale, snap assistance, readouts and reveal. Reuse on existing shape inspection, Geoboard/Coordinates or other manipulatives only where meaningful.
- Audit and migrate challenges: read/mark from zero or nonzero origin, estimate then measure, compare distances, measure side/perimeter, metric conversion and imperial teaching; angle read/estimate/draw, rotated baselines, dual scales, reflex angles, turns and compare/order. Advanced radians optional and deferred. Use generated true geometry, defined tolerances and no target snapping or unsolicited answers in assessment. Preserve manual scale-reading and existing dual-ruler workflow.
- Verify legacy saved lessons/challenges, category filters and stable IDs, current capture, automatic batches, mixed documents, graphical answer annexes, paper calibration, and tool exclusion from pupil print where appropriate. Ensure old and new entry points do not list identical challenges twice. All shared instrument improvements should propagate across consuming widgets without changing their mathematics.
- Sequencing: finish current geometry 6G and its open issues first; audit actual existing Measures and Geometry UI, design common component API, migrate one instrument/challenge at a time with regression coverage. Name and final menu split remain proposals pending teacher workflow review. This is part of overall manipulatives/geometry quality plan, not a new competing top-level project.


### Mandatory delivery contract — teaching, challenges and paper (27 November 2026)

Every new or revised mathematical teaching capability is reviewed as a complete classroom workflow, not just an interactive diagram. Each increment must specify: (1) live teaching/exploration with optional property/reasoning reveal; (2) relevant independent pupil challenge families, curriculum/difficulty settings, valid generated givens, mathematical assessment and worked feedback; (3) current demonstration or challenge capture; (4) batch generation from the same settings and mixed-widget publication; (5) pupil worksheets with adequate working space and no answer leakage, even after reveal; (6) graphical teacher annexes with matching givens, tolerances, alternative valid solutions and marking notes; (7) model, browser, touch and publication regression checks. For temporary measuring utensils, annotations or infrastructure that do not constitute a mathematical topic, test how they support existing challenges and paper outputs instead of inventing redundant challenge families. Maintain vector diagrams, physical scale where supported and separate physical print/classroom verification. Do not mark a workstream complete solely because its live controls work.


## Reference audit — Revision Library KS2 maths (27 November 2026)

Sources: https://www.revisionlibrary.co.uk/library/ks2-maths ; https://www.revisionlibrary.co.uk/library/ks2-maths/geometry ; https://www.revisionlibrary.co.uk/topics/ks2-maths ; https://www.revisionlibrary.co.uk/editorial-policy . Catalogue reports 70 packs and 2,375 printable pages across seven strands. All seven geometry pack pages located; representative question samples and other strand topic guides examined, not an exhaustive question-level import or validation. Site states software/AI assists drafting with editorial specification and independent checks; independent teacher review of every item not established. Reference for skill patterns only; do not redistribute or clone wording, PDFs, answers or illustrations. Generate original questions and validate against DfE curriculum; distinguish enrichment (e.g. symbolic angle equations or nth-term work beyond primary expectations).

### Candidate challenge audit (not claims of missing implementation)
- Arithmetic/number: formal method working and remainder interpretation; multi-step operation choice; place value, rounding, negative numbers, factors/multiples, Roman numerals. Audit existing Maths Canvas, number line, place value and written-method generators before adding variants.
- Fractions/decimals/percentages and ratio: compare/order, reverse fraction or percentage of quantity, part/whole/unknown part, scaling recipes and similar figures, mixed unit and multi-step reasoning. Prefer manipulatives' bar/area models and existing arithmetic engine.
- Algebra: inverse operations, rule from inputs, sequence continuation and missing terms, formula substitution, pairs of solutions, multiple valid answers; keep curriculum stage tags. Use existing balance/function/sequence tools where appropriate.
- Geometry: property deductions, symmetry counts/completion, intersecting lines with linked unknowns, multiple adjacent angles, fractional turns, repeated circles and diameter reasoning, coordinate missing vertices, inverse translations, reflections and midpoint/distance; allocate 3D nets/face-edge-vertex count to solid shapes, coordinate transformations to Coordinate Grid. Area/perimeter composite and missing lengths primarily Geoboard/area tools.
- Measurement: nonzero ruler start plus conversion, choose suitable units, full metric ladder and contextual imperial approximations, scales for mass/capacity, time duration and timetable/calendar, money/change; do not cram unrelated units into geometric instrument workspace.
- Statistics: missing entries, comparisons/differences, graph scales, table-to-graph construction, pie sector fraction/angle/count conversion, missing value from mean, combined-group mean (enrichment if appropriate); reuse existing data models.
- Reasoning: original parameterised real-world multi-part scenarios, same diagram/dataset shared across dependent subquestions, explanation and misconception checks, reverse problems, multiple valid answers and partial credit. Do not require every generated question to be interactive; choose useful model or printable-only reasoning.

### Publishing and challenge design
Reference site offers timed packs, tests, worked methods, misconception sections, question-by-question marks and mark schemes, cross-topic pack builder. Candidate Studio improvements: duration presets (estimate from family-specific task time, never guarantee), configurable marks/difficulty/skill coverage, shared scenario with subparts, pupil-only diagrams plus separate mark-by-mark graphical annex, equivalent solutions and independent method credit where appropriate. Curriculum coverage matrix per family: stable ID, year/stage, prerequisites, representation, reasoning type, challenge generation, assessment, current/batch/mixed publication, paper/annex QA and evidence. Add audit entries after checking actual code rather than adding duplicate widgets. Keep teach/explore/challenge/print contract. Original authored geometry with unknown labels is a foundation for these multi-part tasks. Sequence after current annotation/Measures & Angles increments; no new top-level workstream.


### Accepted follow-on deliverables (27 November 2026)
- Within the existing curriculum coverage and final integration workstreams, maintain an auditable matrix of actual challenge family IDs, statutory objectives/year or enrichment, live teaching, generation, assessment, current/batch/mixed publishing, graphical answer and verification evidence. Distinguish implemented, tested, and classroom-verified; audit each existing widget before extending it.
- Build original shared-scenario multi-part tasks incrementally, with independently checkable subparts, explicit marks and method credit in teacher annexes, optional alternative solutions and misconception prompts. Reuse one mathematical model across teaching, pupil and paper views. Do not automatically award method marks from a numerical answer alone.
- Extend existing worksheet builder with configurable estimated practice durations, coverage and difficulty mixes, marks and teacher mark schemes only after family-level generation and paper tests are stable. These are accepted design deliverables, not a commitment to reproduce the reference site or a new top-level workstream.
- Immediate sequence unchanged: finish geometry annotation editing and unknown/solution separation, resume shared protractor and Measures & Angles, improve teaching explorers, then apply the coverage audit across the catalogue.
