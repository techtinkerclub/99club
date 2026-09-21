# Custom Worksheet curriculum coverage audit

Status: planning baseline for the hidden Custom Worksheet module.

Scope: England National Curriculum mathematics, Years 1–6 (KS1 and KS2).

Primary completeness source:
- Department for Education, *National curriculum in England: mathematics programmes of study*.
- https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study

Secondary progression source:
- Department for Education, *Mathematics guidance: key stages 1 and 2* (2020).
- https://www.gov.uk/government/publications/teaching-mathematics-in-primary-schools

The statutory programme of study is the completeness checklist. Ready-to-progress criteria are useful progression tags but are not a complete curriculum and must not replace the statutory objective map.

## Current repo position

The audited Custom Worksheet modules currently contain about 175 family definitions across:
- Number & place value
- Number properties
- Calculation
- Fractions
- Decimals & percentages
- Ratio & proportion
- Measurement
- Geometry
- Algebra
- Statistics
- Extension

This is already broad, but the public-facing taxonomy is flatter than the curriculum. Many broad families cover several statutory objectives, and several objectives have no clearly named leaf even where an existing generator could probably support them.

The next catalogue version should therefore separate:
1. curriculum taxonomy;
2. question providers;
3. availability/status.

A curriculum leaf must be allowed to exist even when it has no provider yet.

## Recommended data model

Every curriculum leaf should have:
- stable curriculum ID;
- year or year range;
- statutory domain;
- subcategory;
- short teacher-facing label;
- concise objective wording;
- optional DfE ready-to-progress code(s);
- status: live / partial / planned;
- provider type: generator / template / curated library / visual / none;
- provider IDs;
- notes about limitations.

Do not make a planned leaf selectable until it has at least one usable provider. Planned leaves can still be visible in the hidden Custom module with a restrained “planned” state.

## Proposed catalogue hierarchy

### Number & place value
Subcategories:
- Counting forwards/backwards
- Counting in multiples / step counting
- Read & write numbers
- Place value
- Standard & non-standard partitioning
- Compare & order
- Number-line position
- Represent & estimate numbers
- More / less
- Powers of 10
- Rounding
- Negative numbers
- Roman numerals

Important leaves to make explicit:
- Y1 count to/across 100 from any starting point
- Y1 count in 2s, 5s and 10s
- Y1 identify 1 more / 1 less
- Y1 represent numbers and reason on a number line
- Y2 non-standard partitioning of 2-digit numbers
- Y2 estimate/locate 2-digit numbers on a number line
- Y3 10/100 more or less
- Y3 non-standard partitioning of 3-digit numbers
- Y3 locate/read scaled number lines
- Y4 1,000 more or less
- Y4 count backwards through zero
- Y4 non-standard partitioning of 4-digit numbers
- Y5 count in powers of 10
- Y5 decimal place value / partitioning
- Y5 negative numbers in context
- Y6 place value to 10,000,000 including decimals
- Y6 rounding to a required degree of accuracy

Likely gaps/weakly named areas:
- explicit number-line / scale partitioning by 2, 4, 5 and 10 equal parts;
- standard vs non-standard partitioning as its own teacher-visible leaf;
- representation/estimation tasks as a distinct leaf.

### Addition & subtraction
Subcategories:
- Number bonds / complements
- Addition facts
- Subtraction facts
- Mental addition
- Mental subtraction
- Add/subtract across boundaries
- Missing-number equations
- Commutativity / inverse
- Difference problems
- Column addition
- Column subtraction
- Estimation & checking
- One-step contextual problems
- Two-step contextual problems
- Multi-step contextual problems

Important leaves to make explicit:
- Y1 equations with +, − and =
- Y1 bonds and related subtraction facts within 20
- Y1 one-step contextual and missing-number problems
- Y2 facts to 20 and derived facts to 100
- Y2 2-digit +/− ones
- Y2 2-digit +/− tens
- Y2 two 2-digit numbers
- Y2 three 1-digit addends
- Y2 difference / “how many more?”
- Y2 inverse and checking
- Y3 3-digit +/− ones, tens and hundreds
- Y3 complements to 100
- Y3 column addition/subtraction
- Y4 4-digit column methods
- Y4 two-step contextual problems
- Y5 large-number mental calculation
- Y5 multi-step contextual problems
- Y6 mixed-operation / multi-step contextual problems

Likely gaps/weakly named areas:
- “difference / how many more?” deserves a distinct leaf;
- bridge-through-10 tasks should be visible separately;
- contextual one/two/multi-step problems should no longer be represented by one retired generic word-problem family.

### Multiplication & division
Subcategories:
- Grouping & sharing
- Arrays
- Repeated addition
- Times-table facts
- Related division facts
- Multiplication statements
- Division statements
- Commutativity / inverse
- Derived facts / scaling
- Mental multiplication
- Mental division
- Short multiplication
- Long multiplication
- Short division
- Long division
- Remainders & contextual interpretation
- Distributive law
- Scaling
- Correspondence / combinations

Important leaves to make explicit:
- Y1 grouping/sharing with objects and arrays
- Y2 arrays/repeated addition/grouping/sharing
- Y2 2, 5 and 10 facts
- Y3 3, 4 and 8 facts
- Y3 2-digit × 1-digit
- Y3 scaling and correspondence
- Y4 facts to 12×12
- Y4 ×0, ×1, ÷1 and multiply three numbers
- Y4 2-/3-digit × 1-digit
- Y4 distributive-law problems
- Y5 up to 4-digit × 1-/2-digit
- Y5 up to 4-digit ÷ 1-digit and remainder interpretation
- Y6 4-digit × 2-digit
- Y6 4-digit ÷ 2-digit, short/long division and remainder interpretation

Likely gaps/weakly named areas:
- visual arrays as their own leaf/provider;
- grouping vs sharing should be distinguished in early years;
- contextual remainder interpretation should be distinct from raw remainder calculation.

### Number properties
Subcategories:
- Odd & even
- Multiples
- Factors
- Factor pairs
- Common factors
- Common multiples
- Prime / composite
- Square numbers
- Cube numbers

Current coverage is strong. Keep this as a teacher-friendly category even though the statutory programme embeds much of it in multiplication/division.

### Fractions
Subcategories:
- Equal parts
- Recognise & name fractions
- Unit fractions
- Non-unit fractions
- Fractions of quantities
- Fractions of sets
- Fractions of lengths
- Fractions of shapes
- Fractions on number lines
- Count in fractions
- Equivalent fractions
- Compare & order fractions
- Add fractions
- Subtract fractions
- Mixed & improper fractions
- Simplify / common denominator
- Fraction × whole number
- Fraction × fraction
- Fraction ÷ whole number
- Fraction as division

Important leaves to make explicit:
- Y1 halves
- Y1 quarters
- Y2 thirds, quarters, 2/4 and 3/4
- Y2 2/4 = 1/2
- Y2 count in halves/quarters beyond 1
- Y3 tenths
- Y3 fractions as numbers on a number line
- Y3 equivalent fractions using diagrams
- Y3 add/subtract same denominator within one whole
- Y4 hundredths
- Y4 fractions to divide quantities
- Y4 decimal equivalents of tenths/hundredths and 1/4, 1/2, 3/4
- Y5 denominators that are multiples
- Y5 mixed/improper conversion
- Y5 fractions × whole numbers
- Y6 simplify using common factors
- Y6 common denominators using common multiples
- Y6 add/subtract different denominators/mixed numbers
- Y6 fraction × fraction
- Y6 fraction ÷ whole number
- Y6 fraction as division

Likely gaps/weakly named areas:
- fraction number-line questions need their own family;
- equal-parts misconception questions are valuable and currently hidden inside broad fraction visuals;
- recognise/finding fractions should be distinguishable by shape/set/quantity/length.

### Decimals & percentages
Subcategories:
- Tenths
- Hundredths
- Thousandths
- Decimal place value
- Decimal number lines
- Compare & order decimals
- Round decimals
- Multiply/divide by 10, 100, 1,000
- Decimal addition/subtraction
- Decimal multiplication
- Decimal division
- Fraction ↔ decimal
- Percentage meaning
- Fraction ↔ percentage
- Decimal ↔ percentage
- Percentage of amount
- Percentage comparison
- Contextual decimal/percentage problems

Likely gaps/weakly named areas:
- explicit thousandths;
- decimal number-line placement;
- percentage as “parts per 100” separate from percentage calculation.

### Ratio & proportion
Subcategories:
- Relative size / equivalent ratios
- Missing ratio values
- Unequal sharing & grouping
- Scale factor
- Similar shapes
- Recipe/quantity scaling
- Percentage proportion problems
- Simple rates

Current coverage is reasonably strong. Percentage comparison should cross-link rather than duplicate.

### Measurement
Subcategories:
- Length / height
- Mass / weight
- Capacity
- Volume
- Temperature
- Unit choice
- Reading scales
- Compare/order measures
- Add/subtract measures
- Metric conversions
- Metric/imperial approximate equivalence
- Miles ↔ kilometres
- Money: recognise coins/notes
- Money: compose amounts
- Money: coin combinations
- Money: change
- Money: multi-step
- Time: sequence/order language
- Time: calendar/dates
- Time: analogue clocks
- Time: digital time
- Time: 12-/24-hour
- Time: duration
- Time: unit conversions
- Time: timetables
- Perimeter
- Area by counting squares
- Rectangle/rectilinear area
- Irregular-area estimation
- Triangle area
- Parallelogram area
- Area/perimeter relationships
- Estimate volume/capacity
- Cuboid volume
- Measure problem solving

Likely gaps/weakly named areas:
- non-standard measurement for Y1;
- separate length/mass/capacity scale reading;
- irregular-area estimation Y5;
- estimate volume/capacity Y5;
- explicit “same area, different perimeter / same perimeter, different area”;
- miles ↔ kilometres as a dedicated Y6 leaf.

### Geometry – properties of shapes
Subcategories:
- Recognise/name 2-D shapes
- Recognise/name 3-D shapes
- 2-D shape properties
- 3-D shape properties
- 2-D faces on 3-D shapes
- Compare/sort shapes
- Draw 2-D shapes
- Make/build 3-D shapes
- Nets
- Triangles
- Quadrilaterals
- Regular/irregular polygons
- Symmetry
- Horizontal/vertical lines
- Parallel/perpendicular lines
- Circles
- Angles & turns
- Draw shapes from dimensions/angles

Likely gaps/weakly named areas:
- Y2 identify 2-D shapes on surfaces of 3-D shapes;
- Y2/Y3 compare and sort shape families should be visible;
- Y3 draw 2-D / recognise 3-D in different orientations;
- Y5 identify 3-D shapes from 2-D representations;
- Y6 draw 2-D shapes from given dimensions and angles;
- Y6 recognise/build simple 3-D shapes from nets;
- regular vs irregular polygons should have an explicit leaf rather than relying on broad shape properties.

### Geometry – position & direction
Subcategories:
- Positional language
- Movement
- Turns
- Shape/object patterns
- First-quadrant coordinates
- Plot points / complete polygons
- Translation
- Reflection
- Four-quadrant coordinates
- Coordinate transformations

Likely gap:
- Y2 arrange mathematical objects in patterns/sequences is not clearly represented.

### Angles
Keep the current visual angle subsystem, but expose it through the geometry hierarchy:
- Turns & orientation Y1–2
- Right angles & turns Y3
- Identify/compare/order angles Y4
- Estimate/measure/draw degrees Y5
- Angles on lines/around points Y5–6
- Angles in triangles Y6
- Angles in quadrilaterals/polygons Y6
- Angle reasoning Y5–6

This is currently one of the strongest areas of the Custom module.

### Statistics
Subcategories:
- Categorise/sort data
- Tally charts
- Pictograms
- Block diagrams
- Tables
- Bar charts
- Time graphs
- Line graphs
- Timetables
- Pie charts
- Mean
- Comparison/sum/difference from data
- Construct representations
- Interpret representations
- Choose an appropriate representation

Likely gaps/weakly named areas:
- construction and interpretation should be distinguishable;
- Y2 “sort categories by quantity / total / compare categorical data” should have a low-reading-age leaf;
- Y4 continuous-data presentation should be explicit;
- “choose appropriate representation” is non-statutory guidance but useful as an extension/reasoning family.

### Algebra
Subcategories:
- Missing-number statements
- Use simple formulae
- Substitute into formulae
- Linear sequences
- Express missing-number problems algebraically
- One-unknown equations
- Two-unknown equations
- Find pairs satisfying an equation
- Enumerate combinations of two variables
- Equivalent expressions / generalisation

Likely gap:
- “enumerate possibilities of combinations of two variables” should be a separate Y6 leaf.

## Coverage priorities

### Priority A — taxonomy gaps, likely easy to support from existing engines
- bridge-through-10 addition/subtraction
- difference / how-many-more
- non-standard place-value partitioning
- number-line location / scale partitioning
- grouping vs sharing
- arrays
- fraction number lines
- decimal number lines
- explicit tenths/hundredths/thousandths
- contextual remainder interpretation
- equal-area/different-perimeter reasoning
- regular/irregular polygon classification
- two-variable enumeration
- categorical-data comparison

### Priority B — new visual/template generators
- early arrays
- non-standard measurement
- 2-D face on 3-D shape
- shape sorting
- shape patterns/sequences
- Y3 draw/recognise shapes in varied orientation
- Y5 3-D from 2-D representations
- irregular-area estimation
- volume/capacity estimation
- Y6 draw 2-D shape from dimensions/angles

### Priority C — curated question libraries
Use original, locally stored question banks for objectives where a fully general generator gives little benefit or risks awkward wording.

Good candidates:
- contextual one/two/multi-step problems
- measure reasoning
- money reasoning
- calendar/timetable interpretation
- “which method / why?” reasoning
- classify/explain/justify questions
- misconception diagnosis
- multi-clue number-property problems
- algebraic/generalisation word problems
- data interpretation with richer contexts

## Curated question-bank architecture

Do not store hundreds of unstructured strings in one file.

Recommended structure:
- one library file per domain or tightly related group;
- each question has a stable ID;
- objective IDs and year tags;
- difficulty;
- prompt;
- answer;
- worked solution;
- marking mode;
- optional choices;
- optional visual specification;
- keywords / misconception tags;
- provenance = original;
- review status.

Suggested provider modes:
- seeded-generator
- parameterised-template
- curated-library
- visual-generator

A parameterised template is preferable where possible because it combines natural language with mathematically verified variation.

Example fields:

```js
{
  id: 'Y4-MEAS-MONEY-017',
  objectiveIds: ['Y4-MEAS-MONEY-02'],
  years: [4],
  difficulty: 'standard',
  mode: 'curated-library',
  prompt: '...',
  answer: { type: 'money', value: 6.35 },
  solution: [
    '...',
    '...'
  ],
  tags: ['money', 'two-step', 'change'],
  review: 'approved',
  provenance: 'original'
}
```

## QA requirements

Add automated checks that:
1. every statutory curriculum leaf has a stable ID;
2. every statutory leaf has status live / partial / planned;
3. every live leaf has at least one valid provider;
4. every provider references valid curriculum IDs;
5. generated/template questions validate mathematically;
6. curated questions include a non-empty answer and worked solution;
7. IDs are unique;
8. no empty/planned leaf is selectable;
9. no exact question repeats in one generated sheet;
10. coverage reports show live/partial/planned counts by year and domain.

A human sample review remains required for wording, age appropriateness and diagram clarity.

## Product implication

The Custom Worksheet selector should become a curriculum browser:
**Domain → subcategory → objective/question family**.

Teachers should not need to understand internal generator names.

Existing broad generator families can continue to serve several curriculum leaves behind the scenes. The curriculum structure and the generation implementation should no longer be the same thing.
