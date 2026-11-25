# Primary mathematics curriculum coverage audit

Status: working audit, not certification. Source: Department for Education, National curriculum in England: mathematics programmes of study, updated 28 September 2021. https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study

## Policy

Year suggestions are advisory, not access controls. Difficulty adjusts numerical complexity independently. Teachers can override every setting. Separate statutory requirements from non-statutory guidance. Never infer complete curriculum coverage from existence of a widget. Evidence must include task identifiers, live interaction, pupil output, marking evidence and regression checks. All implementation entries below remain subject to integrated browser and visual QA.

## Statistics coverage

| Year | Curriculum focus (paraphrased) | Candidate implementation | Status / remaining evidence |
|---|---|---|---|
| 1 | No separate statistics programme | Optional exploratory counting | Not a statutory gap |
| 2 | Read and make simple pictograms, tallies, block diagrams and tables | Data & graphs: pictogram, tally, block, table; complete | Implemented; verify construction and layout |
| 2 | Count, order categories, total and compare | read, total, difference, range, rank | Implemented; verify ties and ranking |
| 2 guidance | Pictogram keys such as 2, 5 and 10 | configurable key | Implemented; verify all scales |
| 3 | Scaled bar charts, pictograms and tables; one- and two-step comparisons | bar, pictogram, table; combined | Implemented; verify construction and scales |
| 4 | Discrete and continuous data, including bar and time graphs; comparisons and calculations | bar, line, temperature series, combined | Partial: verify continuous measurement and time scale semantics |
| 5 | Compare, add and subtract using line graphs | line; total, difference, combined | Implemented; verify representative problems |
| 5 | Complete, read and interpret tables including timetables | table, timetable; time-read, time-elapsed, time-complete | Implemented: two-service timetable and 24-hour marking; verify live and print |
| 6 | Read and construct pie charts and line graphs, solve problems | pie, line; angle, percent, pie-build, complete for line | Implemented: full pie construction with independently assigned sectors; verify saved attempts and marking |
| 6 | Compute and interpret mean | mean and mean-missing with measurement datasets | Implemented computation and missing observation; qualitative appropriateness remains a Phase 5 extension |
| 6 guidance | Connections with fractions, angles, percentages and graphs of two variables | pie angles, percentages, equivalent fractions and line graphs | Implemented core links; further two-variable and conversion contexts in Phase 5 |

## Phase 5 audit structure

Expand this matrix for Years 1–6 across number/place value, addition/subtraction, multiplication/division, fractions/decimals/percentages, ratio/proportion, algebra, measurement, shape, position/direction and statistics. Use one row per statutory learning requirement, record widget and specific challenge family, distinguish demonstrated/partial/gap, and link automated and visual evidence. No domain should be labelled complete before its requirements have been mapped. The aim is a transparent coverage record, not a claim that a digital manipulative replaces classroom teaching.

## Phase 4 release acceptance

Eight representations are implemented in one workspace with advisory year guidance, independent difficulty presets, live assessment, saved lessons, and generated/current publication. Timetable and graph datasets are stored separately. Final browser/print tests and production deployment must be verified against the merged revision; classroom visual acceptance is not implied by an automated pass. The qualitative interpretation and broader curriculum extensions above remain tracked for Phase 5.


## Phase 5A: Function machines and algebra

| Curriculum link | Function-machine evidence | Scope |
|---|---|---|
| KS1 and lower KS2 arithmetic: unknown quantities, inverse operations and number relationships | output, input, constant, operation, reverse; step-by-step demonstration and reversible machines | Teaching representation; not a separate statutory algebra strand |
| Year 6: simple formulae | formula; substitution of an input into an expression | Whole-number linear arithmetic |
| Year 6: generate and describe linear sequences | sequence, rule, table; position-to-term rule and input/output pairs | Explicitly constrained rule families, not arbitrary inference |
| Year 6: express missing-number problems algebraically | input, constant, formula, operation; machine diagram and letters | Complement Equation Balance and Arithmetic Hub |
| Year 6: pairs of values satisfying an equation with two unknowns | pairs; accepts any positive whole-number pair meeting the sum | Multiple solutions accepted |
| Year 6: enumerate possibilities with two variables | pairs-all; selects every valid ordered positive whole-number pair, with complete worked list in teacher annex | Bounded additive equations; further contexts remain for Phase 5 |
| Year 6: order of operations | order; compare outputs with the same operations reversed | Reasoning about operation order |
| Enrichment | configurable two-stage rules, signed exploration and reverse machines | No claim of complete KS3 functions curriculum |

Source: https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study

Implementation uses one shared generator, screen and SVG paper rendering, existing touchscreen response framework, lesson-state capture and automatic builder. The initial generator uses whole-number exact arithmetic; fractional and decimal challenge generation, contextual formulae beyond the initial linear family, and deeper algebraic notation remain later extensions. The model was sampled over 5,400 seeded challenge cases during implementation; integrated CI, graphical print and classroom acceptance are still required.
