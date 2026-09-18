# 99 Club Studio — Primary maths curriculum coverage

## Purpose

This document records the curriculum scope of **Custom Worksheet** mode. It is a maintainer-facing coverage audit, not a claim that one automatically generated worksheet teaches or assesses an entire curriculum objective.

The statutory baseline is the **National curriculum in England: mathematics programmes of study (Years 1–6)**. The DfE *Mathematics guidance: key stages 1 and 2* is useful for progression and teaching detail, but the guidance itself is not a replacement for the full statutory programme.

Primary sources:

- https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study
- https://www.gov.uk/government/publications/teaching-mathematics-in-primary-schools

## Scope rule

Custom Worksheet currently aims to cover curriculum content that can be represented honestly as **direct numerical questions or concise mathematical prompts**. Examples include `Round 673 to the nearest 100` and `What is the value of 6 in 678?`. Contextual/story word problems are deliberately excluded from this engine: they need a separate structured problem-language system with enough contexts and phrasing to avoid repetitive templates. Content whose mathematical meaning depends on a diagram, physical measurement, clock face, chart, scale, construction or other visual representation is added only when a dedicated visual generator exists; bar/time/line graphs, coordinates, pie charts and Angles Stage 1 now have such modules, while the remaining visual topics stay deferred.

The optional Year 1–6 starting selections choose all non-extension families tagged for that year. Several builders then narrow their numbers and question forms using `curriculumYear` so a Year 2 starting selection does not simply use the same questions as Year 6 with smaller numbers.

## What is covered

The active family catalogue contains **105 question families** (103 curriculum/direct-maths families plus 2 explicit extension families). The retired pre-release `word_problems` ID remains only as an internal index placeholder so later compact family numbers do not shift; its sentence-template generator has been removed and it is not exposed in the app or normal Year-tagged curriculum families.

### Number & place value

| Family ID | Teacher label | Years |
|---|---|---|
| `negative_numbers` | negative numbers | Y4, Y5, Y6 |
| `roman_numerals` | Roman numerals | Y3, Y4, Y5 |
| `number_words` | numbers in words | Y1, Y2, Y3, Y4, Y5, Y6 |
| `place_value` | digit place value | Y1, Y2, Y3, Y4, Y5, Y6 |
| `compare_numbers` | compare whole numbers (< > =) | Y1, Y2, Y3, Y4, Y5, Y6 |
| `rounding_whole` | round whole numbers | Y3, Y4, Y5, Y6 |
| `number_sequences` | number sequences / counting | Y1, Y2, Y3, Y4, Y5, Y6 |
| `more_less` | more / less from a number | Y1, Y2, Y3, Y4 |
| `partition_number` | partition numbers by place value | Y2, Y3, Y4 |
| `powers_of_10` | multiply / divide by powers of 10 | Y5, Y6 |

### Number properties

| Family ID | Teacher label | Years |
|---|---|---|
| `square` | square numbers | Y5, Y6 |
| `cube` | cube numbers | Y5, Y6 |
| `odd_even` | odd and even numbers | Y2, Y3, Y4, Y5, Y6 |
| `factor_check` | factors | Y4, Y5, Y6 |
| `multiple_check` | multiples | Y4, Y5, Y6 |
| `prime_numbers` | prime numbers | Y5, Y6 |
| `factor_pairs` | factor pairs | Y4, Y5, Y6 |
| `common_factors` | common factors | Y5, Y6 |
| `common_multiples` | common multiples | Y6 |

### Calculation

| Family ID | Teacher label | Years |
|---|---|---|
| `addition` | addition | Y1, Y2, Y3, Y4, Y5, Y6 |
| `subtraction` | subtraction | Y1, Y2, Y3, Y4, Y5, Y6 |
| `multiply` | multiplication facts | Y2, Y3, Y4, Y5, Y6 |
| `divide` | division facts | Y2, Y3, Y4, Y5, Y6 |
| `missing_number` | missing ×/÷ numbers | Y2, Y3, Y4, Y5, Y6 |
| `bodmas` | order of operations | Y6 |
| `scaled_multiply` | scaled multiplication | Y4, Y5, Y6 |
| `scaled_divide` | scaled division | Y4, Y5, Y6 |
| `double` | doubles | Y1, Y2 |
| `repeated_addition` | repeated addition | Y1, Y2, Y3 |
| `add_sub_missing` | missing +/− numbers | Y1, Y2, Y3, Y4, Y5, Y6 |
| `multidigit_multiply` | multi-digit multiplication | Y4, Y5, Y6 |
| `division_remainders` | multi-digit division / remainders | Y4, Y5, Y6 |
| `multidigit_add_subtract` | large-number addition / subtraction | Y3, Y4, Y5, Y6 |
| `estimate_calculation` | estimate calculations by rounding | Y3, Y4, Y5, Y6 |
| `number_bonds` | number bonds / complements | Y1, Y2, Y3 |
| `three_addends` | add three one-digit numbers | Y2 |
| `fact_families` | commutativity & inverse facts | Y2, Y3, Y4, Y5, Y6 |
| `distributive_law` | distributive law / mental multiplication | Y4, Y5, Y6 |
| `correspondence` | grouping, scaling & correspondence | Y1, Y2, Y3, Y4 |
| `long_division` | division by two-digit divisors | Y6 |

### Fractions

| Family ID | Teacher label | Years |
|---|---|---|
| `fraction_of` | fractions of quantities | Y1, Y2, Y3, Y4, Y5, Y6 |
| `equivalent_fractions` | equivalent fractions | Y2, Y3, Y4, Y5, Y6 |
| `simplify_fractions` | simplify fractions | Y6 |
| `fraction_compare` | compare fractions | Y3, Y4, Y5, Y6 |
| `mixed_improper` | mixed ↔ improper fractions | Y5, Y6 |
| `fraction_add_subtract` | add / subtract fractions | Y3, Y4, Y5, Y6 |
| `fraction_multiply_whole` | fraction × whole number | Y5, Y6 |
| `fraction_multiply` | fraction × fraction | Y6 |
| `fraction_divide_whole` | fraction ÷ whole number | Y6 |
| `fraction_sequences` | fraction sequences | Y2, Y3, Y4, Y5 |

### Decimals & percentages

| Family ID | Teacher label | Years |
|---|---|---|
| `percentage_of` | percentages of quantities | Y5, Y6 |
| `decimal_place_value` | decimal place value | Y4, Y5, Y6 |
| `decimal_compare` | compare decimals | Y4, Y5, Y6 |
| `decimal_rounding` | round decimals | Y4, Y5, Y6 |
| `decimal_scale` | decimals ×/÷ 10, 100, 1000 | Y4, Y5, Y6 |
| `decimal_add_subtract` | decimal addition / subtraction | Y4, Y5, Y6 |
| `decimal_multiply` | decimal × whole number | Y6 |
| `decimal_divide` | decimal ÷ whole number | Y6 |
| `fraction_decimal_percent` | fraction ↔ decimal ↔ percentage | Y4, Y5, Y6 |
| `decimal_to_fraction` | decimal → fraction by place value | Y5, Y6 |
| `fraction_to_decimal` | fraction → decimal | Y6 |
| `percentage_compare` | compare percentage quantities | Y6 |
| `fraction_division_decimal` | fractions as division / rounded decimals | Y6 |

### Ratio & proportion

| Family ID | Teacher label | Years |
|---|---|---|
| `ratio_missing` | equivalent ratios / missing values | Y6 |
| `ratio_share` | share in a ratio | Y6 |
| `scale_factor` | scale-factor problems | Y6 |
| `unit_rate` | simple rates / unit rates | Y5, Y6 |

### Measurement

| Family ID | Teacher label | Years |
|---|---|---|
| `metric_conversion` | metric unit conversions | Y3, Y4, Y5, Y6 |
| `time_conversion` | time-unit conversions | Y2, Y3, Y4, Y5, Y6 |
| `time_duration` | time durations | Y2, Y3, Y4, Y5, Y6 |
| `money` | money / change | Y1, Y2, Y3, Y4, Y5, Y6 |
| `perimeter` | perimeter from dimensions | Y3, Y4, Y5, Y6 |
| `area` | area from dimensions | Y4, Y5, Y6 |
| `volume` | cuboid volume | Y6 |
| `measure_compare` | compare measures | Y1, Y2, Y3, Y4, Y5, Y6 |
| `calendar_facts` | calendar facts | Y1, Y2, Y3 |
| `time_12_24` | 12-hour ↔ 24-hour time | Y3, Y4, Y5, Y6 |
| `imperial_conversion` | approximate metric / imperial conversions | Y5, Y6 |
| `temperature_interval` | temperature intervals across zero | Y6 |
| `triangle_area` | triangle area from dimensions | Y6 |
| `parallelogram_area` | parallelogram area from dimensions | Y6 |
| `missing_measure` | missing length from area / perimeter | Y5, Y6 |
| `unit_choice` | choose appropriate measurement units | Y1, Y2, Y3, Y4, Y5, Y6 |
| `time_words` | time words ↔ digital time | Y1, Y2, Y3, Y4 |
| `area_perimeter_relationships` | area & perimeter relationships | Y6 |
| `time_language` | time order & duration language | Y1, Y2 |

### Geometry

| Family ID | Teacher label | Years |
|---|---|---|
| `angle_facts` | right/straight/full-turn angle facts | Y3, Y4, Y5, Y6 |
| `angle_sums` | triangle / quadrilateral angle sums | Y6 |
| `shape_properties` | shape properties (text) | Y1, Y2, Y3, Y4, Y5, Y6 |
| `coordinates` | coordinate translations | Y4, Y5, Y6 |
| `line_properties` | parallel / perpendicular / line facts | Y3, Y4, Y5, Y6 |
| `angle_relationships` | angles at a point / line / opposite | Y5, Y6 |
| `circle_properties` | circle radius / diameter facts | Y6 |
| `position_language` | position vocabulary | Y1 |
| `turns_direction` | turns & direction vocabulary | Y1, Y2 |
| `angle_classification` | classify angles | Y3, Y4, Y5, Y6 |
| `coordinate_reflection` | coordinate reflections (text) | Y5, Y6 |
| `angles_turns_y1_2` | turns & orientation (visual) | Y1, Y2 |
| `angles_right_y3` | right angles & turns (visual) | Y3 |
| `angles_compare_y4` | identify, compare & order angles (visual) | Y4 |
| `angles_degrees_y5` | degrees: classify, estimate, measure & draw (visual) | Y5 |
| `angles_lines_points_y5_6` | angles on lines & around points (visual) | Y5, Y6 |
| `angles_triangles_y6` | angles in triangles (visual) | Y6 |
| `angles_quads_polygons_y6` | angles in quadrilaterals & polygons (visual) | Y6 |
| `angles_reasoning_y5_6` | angle reasoning & problem solving (visual) | Y5, Y6 |

### Algebra

| Family ID | Teacher label | Years |
|---|---|---|
| `simple_algebra` | simple algebra / missing values | Y6 |
| `formula_substitution` | formula substitution | Y6 |
| `equation_pairs` | pairs satisfying equations | Y6 |
| `algebra_sequences` | linear number sequences | Y6 |

### Statistics

| Family ID | Teacher label | Years |
|---|---|---|
| `mean` | mean average | Y6 |
| `pie_chart_angles` | pie-chart angle calculations (text-only practice) | Extension |
| `pie_charts_y6` | pie charts — interpret & construct | Y6 |
| `pie_charts_reasoning_y6` | pie charts — reasoning & problem solving | Y6 |
| `pie_charts_extension` | pie-chart reasoning (extension) | Extension |
| `data_table_questions` | retired placeholder — real statistics interpretation should use rendered tables/charts | Retired / no active years |

### Extension

| Family ID | Teacher label | Years |
|---|---|---|
| `square_root` | square roots (extension) | Extension |
| `rounding_custom` | round to non-standard multiples (extension) | Extension |

## Year starting-selection intent

- **Year 1:** counting and number language to 100, comparison/place value, one-more/less, number bonds and addition/subtraction within 20, early grouping/sharing and doubling, halves/quarters of quantities, money values, unit/measure language, calendar/time words, simple shape/property vocabulary, position and turns.
- **Year 2:** adds two-digit arithmetic, three addends, 2/5/10 multiplication and inverse facts, unit/non-unit fractions and simple equivalence, money/change, 5-minute time language/durations, measurement comparisons, shape properties. Table/chart interpretation remains visual/deferred.
- **Year 3:** extends to 1,000, 3/4/8 tables, 2-digit × 1-digit work, tenths/fraction sequences, same-denominator fraction addition/subtraction within one whole plus appropriate unit-fraction comparison, metric conversion/perimeter, minute/time facts, and generated right-angle/turn/line-property visuals. Pictogram/tally/block-diagram interpretation remains staged.
- **Year 4:** extends to 10,000, all 12×12 facts, factor pairs/remainders/distributive reasoning, hundredths and decimals (up to 2 d.p. where appropriate), negative-number counting through zero, unit conversion, money/time, area/perimeter, generated acute/right/obtuse comparison/classification and first-quadrant coordinate translations.
- **Year 5:** extends to 1,000,000, powers of 10, primes/squares/cubes, formal multiplication/division, fractions/mixed numbers, decimals to thousandths, percentages/common equivalences, rate/scaling, metric/imperial conversion, area/measure relationships, degree/reflex-angle work, explicit-estimate angle questions, line/point angle facts, selected protractor measurement/drawing, polygon properties and coordinate reflection/translation. Practical volume estimation remains deferred because the statutory Year 5 emphasis is representation/practical comparison rather than a text-only cuboid-volume formula exercise.
- **Year 6:** extends to 10,000,000, long multiplication/division, order of operations, full fraction calculation including mixed-number variants, decimal calculation/division to 3 d.p. where appropriate, FDP/percentage work, ratio/proportion, algebra, unit conversion, triangle/parallelogram/cuboid calculations, generated line/point/triangle/quadrilateral/polygon angle reasoning, four-quadrant coordinates/reflections, generated pie-chart interpretation/construction, line graphs and mean. Pictograms/tally/block diagrams and some table/timetable work remain staged.


## Deliberately deferred: contextual/story word problems

Word problems are **not currently part of the active Custom Worksheet catalogue**. The short v1.16 template family was removed before public release because changing only the numbers inside a handful of repeated pencil/sticker/bag stories is not a strong enough problem bank.

Direct mathematical wording remains fully in scope. For example:

- `Round 673 to the nearest 100.`
- `What is the value of 6 in 678?`
- `3/4 as a percentage =`
- `Find the mean of 8, 11, 7, 10 and 9.`

A future word-problem engine should separate mathematical structure, context, vocabulary and phrasing so it can produce varied, age-appropriate problems without becoming linguistically repetitive.

## Deliberately deferred: visual / practical generator required

The following statutory content is **not claimed as fully covered** by the current text-only engine. Some related numeric facts may already exist, but a faithful assessment of these objectives needs a rendered diagram, graph, clock, scale or practical representation:

- placing, locating or estimating numbers on **number lines and scales**;
- reading measurements from **rulers, scales, jugs, thermometers or other instruments**;
- recognising fractions of **shapes/objects** and partitioned visual models;
- reading or drawing **analogue clock faces** and clock hands;
- visual recognition, composition and construction of **2D/3D shapes**;
- **nets** and 2D representations/views of 3D shapes;
- **Angles Stage 1 reliability build is now implemented** as dedicated Y1-Y6 visual families covering turns/orientation, right angles, classification/comparison, degrees/reflex angles, explicit-estimate MCQs, protractor interpretation and selected calibrated measurement/drawing, line/point facts, triangles, quadrilaterals/polygons and reasoning/diagnostics. v1.22.2 adds protected diagram footprints, clearer label spacing and a classroom-style protractor with 1°/5°/10° graduations and dual scales. More elaborate full-size ruler+protractor constructions and open multi-answer constructions remain staged;
- completing **line symmetry** beyond the implemented coordinate-reflection families;
- coordinate geometry now has dedicated visual families for Y4 first-quadrant coordinates/translation, Y5 translation/reflection and Y6 four-quadrant coordinates/transformations; midpoint/rotation and similar non-core structures are isolated in an explicit Extension family;
- **pictograms, tally charts and block diagrams** remain deferred; bar charts (Y3–4), time graphs (Y4) and line graphs (Y5–6) now have dedicated generated visual families;
- Year 6 **pie charts are now implemented** as dedicated generated visual families covering interpretation, construction and opt-in reasoning/problem solving. v1.22.2 expands each subtype to 16 deterministic visual variants and deliberately varies sector count/distribution/order/rotation/legend layout so repeated sheets do not merely relabel the same chart shape; the older text-only angle family remains in Extension for compatibility/practice;
- visual **scale drawings/similar shapes** where proportional geometry depends on the drawing;
- practical volume/capacity estimation and irregular-area estimation.

In particular, **Year 5 volume estimation** is not brought forward merely to increase topic counts. Diagram-led angle reasoning now uses the dedicated Angles visual subsystem with year-aware routing; the old text-only angle families are retained only as Extension/fallback content.


## Custom response-space and marking policy

Custom Worksheet questions must make the expected pupil response explicit. If a prompt asks the pupil to **show working, explain, justify, prove, describe a method or give a substantial written response**, the renderer reserves an appropriately sized framed response area. The response area counts towards page layout/packing and must not be created by shrinking the mathematical diagram. A construction task may instead declare that the diagram itself is the response area.

Marking must also be deterministic for the teacher:

- exact numerical work uses an exact answer unless a rounding instruction says otherwise;
- visual estimation normally uses a single-best-answer multiple-choice question rather than an undefined “approximately” answer;
- genuine physical measurement/construction states an explicit tolerance (Angles Stage 1 currently uses ±2° for protractor tasks);
- explanations/justifications use a structured rubric with a marking rule and required mathematical criteria, while explicitly allowing equivalent wording/methods where appropriate;
- genuinely open or multiple-solution tasks are not activated until their valid-answer rule can be represented unambiguously.

From v1.22 each generated question still contributes one score point. A rubric-marked reasoning item receives that point only when all of its required criteria are satisfied.

## Important interpretation notes

- **Decimals:** Year 4 includes tenths/hundredths and decimal work up to two places; Year 5 explicitly includes thousandths and reading/writing/ordering/comparing numbers with up to three decimal places; Year 6 continues place value and calculation with decimals. When a teacher chooses an optional Year generation profile, Year 4 is capped at 2 d.p. and Years 5–6 at 3 d.p.; the profile does not select curriculum topics.
- **Square roots:** exact square roots remain an **Extension** family. Square and cube numbers are statutory upper-KS2 content; square-root fluency is not presented as a normal statutory Year 1–6 starting-selection topic.
- **99 Club rules are separate from curriculum coverage.** Classic and post-99 challenges preserve their existing, reproducible maths paths. Custom Worksheets uses an optional Year generation profile for age-sensitive ranges; it does not auto-select curriculum topics.
- A year tag means the family can provide age-appropriate practice connected to that year. It does not mean every question family exhaustively assesses every sentence of the statutory objective.
- Custom Worksheets begins with zero selected topics. Teachers may mix any catalogue families manually; normal Y4/Y5/Y6 coordinate families remain separate from coordinate Extension reasoning.

## Regression requirement

Adding curriculum families must not silently alter historical Classic 11–99 or Bronze–Diamond fixed-seed output. New families are appended to the family catalogue and Custom Worksheet uses a separate non-progression generation path. Regression tests compare fixed seeds against the pre-Custom-Worksheet generator before release.

## v1.19 boundary

Curriculum-wide coverage belongs to the separate **Custom Worksheets** beta workspace. The stable **11–99** interface remains focused on the traditional progression. Only **post-99 Bronze–Diamond challenges** can add optional concise mental-maths extras: missing values, negatives, Roman numerals, decimal calculations, fractions/percentages and FDP equivalence, factors/multiples, squares/cubes/powers of 10, order of operations, angle facts, compact ratio work, unit/time/money conversions and calculations, temperature intervals, approximate metric/imperial conversions and mean.

The inclusion test is deliberately narrow: an extra must be short to read, quick to understand, realistically solvable mentally and not depend on a diagram. Comparison-heavy families, area/perimeter, formal written methods, longer problem-solving, story word problems and graphical/statistical interpretation remain outside the 99 Club extras.

`data_table_questions` is retired because text-only pseudo-data does not faithfully represent the graphical/table interpretation objectives. `pie_chart_angles` remains only as **text-only pie-chart angle practice** in Extension for saved-sheet compatibility and focused arithmetic. The curriculum-facing Year 6 Pie Charts families now use rendered sectors, tables and construction circles.
