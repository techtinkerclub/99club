(function(global){
  'use strict';

  const VERSION='0.1.2';
  const SOURCE={
    jurisdiction:'England',
    stages:'KS1/KS2',
    years:[1,2,3,4,5,6],
    statutoryProgramme:'National curriculum in England: mathematics programmes of study',
    statutoryUrl:'https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study',
    progressionGuidance:'Mathematics guidance: key stages 1 and 2',
    progressionUrl:'https://www.gov.uk/government/publications/teaching-mathematics-in-primary-schools'
  };

  const DOMAIN_ORDER=[
    'Number & place value',
    'Addition & subtraction',
    'Multiplication & division',
    'Number properties',
    'Fractions',
    'Decimals & percentages',
    'Ratio & proportion',
    'Measurement',
    'Geometry',
    'Statistics',
    'Algebra'
  ];

  const STATUS_LABELS={
    live:'Live',
    partial:'Partial',
    planned:'Planned'
  };

  const objectives=[];
  function leaf(id,year,domain,subcategory,label,status='planned',providers=[],sourceDomain='',notes='',readyCodes=[]){
    objectives.push({id,year,domain,subcategory,label,status,providers:[...providers],sourceDomain:sourceDomain||domain,notes,readyCodes:[...readyCodes]});
  }

  // YEAR 1
  leaf('Y1-NPV-COUNT-100',1,'Number & place value','Counting','Count forwards and backwards to and across 100 from different starting numbers','live',['number_sequences'],'Number - number and place value');
  leaf('Y1-NPV-STEPS-2-5-10',1,'Number & place value','Counting','Count in steps of 2, 5 and 10','live',['number_sequences'],'Number - number and place value');
  leaf('Y1-NPV-READ-WRITE-100',1,'Number & place value','Read & write numbers','Read and write numerals to 100','partial',['number_words','place_value'],'Number - number and place value');
  leaf('Y1-NPV-ONE-MORE-LESS',1,'Number & place value','More / less','Find one more and one less','live',['more_less'],'Number - number and place value');
  leaf('Y1-NPV-REPRESENT-COMPARE',1,'Number & place value','Represent, compare & order','Represent and compare numbers using objects, pictures and number lines','partial',['compare_numbers','number_line_visuals'],'Number - number and place value');
  leaf('Y1-NPV-WORDS-20',1,'Number & place value','Read & write numbers','Read and write 1–20 in numerals and words','live',['number_words'],'Number - number and place value');

  leaf('Y1-AS-STATEMENTS',1,'Addition & subtraction','Equations & symbols','Read, write and interpret +, − and = statements','partial',['addition','subtraction','missing_symbols'],'Number - addition and subtraction');
  leaf('Y1-AS-BONDS-20',1,'Addition & subtraction','Number bonds','Use number bonds and related subtraction facts within 20','live',['number_bonds'],'Number - addition and subtraction');
  leaf('Y1-AS-CALC-20',1,'Addition & subtraction','Fluency','Add and subtract one- and two-digit numbers within 20, including zero','live',['addition','subtraction'],'Number - addition and subtraction');
  leaf('Y1-AS-ONE-STEP',1,'Addition & subtraction','Context problems','Solve one-step addition and subtraction problems','partial',['add_sub_missing'],'Number - addition and subtraction','Needs a richer curated/template contextual bank.');
  leaf('Y1-AS-MISSING',1,'Addition & subtraction','Missing numbers','Solve missing-number addition and subtraction statements','live',['add_sub_missing'],'Number - addition and subtraction');
  leaf('Y1-AS-DIFFERENCE',1,'Addition & subtraction','Difference / comparison','Solve early difference and “how many more/fewer” situations','planned',[],'Number - addition and subtraction');

  leaf('Y1-MD-GROUP-SHARE',1,'Multiplication & division','Grouping & sharing','Solve one-step grouping and sharing problems','partial',['correspondence','fraction_diagrams'],'Number - multiplication and division','Needs explicit early-years grouping versus sharing providers.');
  leaf('Y1-MD-ARRAYS',1,'Multiplication & division','Arrays','Use simple arrays to reason about multiplication and division','planned',[],'Number - multiplication and division');
  leaf('Y1-MD-DOUBLES',1,'Multiplication & division','Doubling','Double small numbers and quantities','live',['double'],'Number - multiplication and division');
  leaf('Y1-MD-ONE-STEP',1,'Multiplication & division','One-step problems','Solve one-step multiplication and division problems using concrete/pictorial models and arrays','partial',['correspondence','container_reasoning'],'Number - multiplication and division','Existing providers cover selected structures; explicit Year 1 visual/template questions are still needed.');

  leaf('Y1-FR-HALVES',1,'Fractions','Recognise & find fractions','Recognise and find one half of shapes, objects and quantities','live',['fraction_of','fraction_diagrams'],'Number - fractions');
  leaf('Y1-FR-QUARTERS',1,'Fractions','Recognise & find fractions','Recognise and find one quarter of shapes, objects and quantities','live',['fraction_of','fraction_diagrams'],'Number - fractions');
  leaf('Y1-FR-EQUAL-PARTS',1,'Fractions','Equal parts','Reason about whether a whole has been split into equal parts','partial',['fraction_diagrams'],'Number - fractions');

  leaf('Y1-MEAS-COMPARE-LENGTH',1,'Measurement','Length & height','Compare and describe lengths and heights','partial',['measure_compare'],'Measurement');
  leaf('Y1-MEAS-COMPARE-MASS',1,'Measurement','Mass','Compare and describe mass/weight','partial',['measure_compare','balance_scales'],'Measurement');
  leaf('Y1-MEAS-COMPARE-CAPACITY',1,'Measurement','Capacity & volume','Compare and describe capacity and volume','partial',['measure_compare'],'Measurement');
  leaf('Y1-MEAS-COMPARE-TIME',1,'Measurement','Time language','Compare durations using everyday time language','live',['time_language'],'Measurement');
  leaf('Y1-MEAS-NONSTANDARD',1,'Measurement','Measuring','Measure and record using early/non-standard measures','planned',[],'Measurement');
  leaf('Y1-MEAS-RECORD-LENGTH',1,'Measurement','Measuring & recording','Measure and begin to record lengths and heights','planned',[],'Measurement');
  leaf('Y1-MEAS-RECORD-MASS',1,'Measurement','Measuring & recording','Measure and begin to record mass/weight','planned',[],'Measurement');
  leaf('Y1-MEAS-RECORD-CAPACITY',1,'Measurement','Measuring & recording','Measure and begin to record capacity and volume','planned',[],'Measurement');
  leaf('Y1-MEAS-RECORD-TIME',1,'Measurement','Measuring & recording','Measure and begin to record time in hours, minutes and seconds','partial',['clock_reasoning_visual','time_language'],'Measurement','Clock/time language is available; direct elapsed-time measurement recording is not yet granularly covered.');
  leaf('Y1-MEAS-COINS-NOTES',1,'Measurement','Money','Recognise common coins and notes and know their values','partial',['coin_reasoning','money'],'Measurement');
  leaf('Y1-MEAS-SEQUENCE-EVENTS',1,'Measurement','Calendar & chronology','Sequence events using chronological language','live',['time_language'],'Measurement');
  leaf('Y1-MEAS-DATES',1,'Measurement','Calendar & chronology','Use days, weeks, months and years vocabulary','live',['calendar_facts','calendar_reasoning_visual'],'Measurement');
  leaf('Y1-MEAS-TIME-HOUR-HALF',1,'Measurement','Analogue time','Tell and draw time to the hour and half hour','live',['clock_reasoning_visual','time_words'],'Measurement');

  leaf('Y1-GEO-2D-3D-NAME',1,'Geometry','2-D & 3-D shapes','Recognise and name common 2-D and 3-D shapes in varied sizes and orientations','live',['visual_shape_properties','shape_properties'],'Geometry - properties of shapes');
  leaf('Y1-GEO-POSITION',1,'Geometry','Position & movement','Describe position, direction and movement','live',['position_language','angles_turns_y1_2'],'Geometry - position and direction');
  leaf('Y1-GEO-TURNS',1,'Geometry','Turns & orientation','Use whole, half, quarter and three-quarter turns','live',['turns_direction','angles_turns_y1_2'],'Geometry - position and direction');

  // YEAR 2
  leaf('Y2-NPV-STEPS',2,'Number & place value','Counting','Count in 2s, 3s and 5s from zero and in 10s from any number','live',['number_sequences'],'Number - number and place value');
  leaf('Y2-NPV-PLACE-TENS-ONES',2,'Number & place value','Place value','Recognise tens and ones in two-digit numbers','live',['place_value'],'Number - number and place value');
  leaf('Y2-NPV-PARTITION',2,'Number & place value','Partitioning','Partition two-digit numbers in standard and non-standard ways','partial',['partition_number'],'Number - number and place value');
  leaf('Y2-NPV-NUMBER-LINE',2,'Number & place value','Number lines','Locate, represent and estimate two-digit numbers on number lines','partial',['number_line_visuals'],'Number - number and place value');
  leaf('Y2-NPV-COMPARE',2,'Number & place value','Represent, compare & order','Compare and order numbers to 100 using <, > and =','live',['compare_numbers'],'Number - number and place value');
  leaf('Y2-NPV-WORDS',2,'Number & place value','Read & write numbers','Read and write numbers to at least 100 in numerals and words','live',['number_words'],'Number - number and place value');
  leaf('Y2-NPV-PROBLEMS',2,'Number & place value','Reasoning','Solve place-value and number-fact problems','partial',['number_card_constraints','number_line_visuals'],'Number - number and place value');

  leaf('Y2-AS-CONTEXT',2,'Addition & subtraction','Context problems','Solve addition and subtraction problems with numbers, quantities and measures','partial',['money','measure_compare'],'Number - addition and subtraction','Needs curated/template word-problem coverage.');
  leaf('Y2-AS-FACTS-20-100',2,'Addition & subtraction','Number bonds','Recall facts to 20 and derive related facts to 100','live',['number_bonds','derived_calculations'],'Number - addition and subtraction');
  leaf('Y2-AS-2D-ONES',2,'Addition & subtraction','Mental calculation','Add/subtract a two-digit number and ones','live',['addition','subtraction'],'Number - addition and subtraction');
  leaf('Y2-AS-2D-TENS',2,'Addition & subtraction','Mental calculation','Add/subtract a two-digit number and tens','live',['addition','subtraction'],'Number - addition and subtraction');
  leaf('Y2-AS-2D-2D',2,'Addition & subtraction','Mental calculation','Add/subtract two two-digit numbers','live',['addition','subtraction'],'Number - addition and subtraction');
  leaf('Y2-AS-THREE-ADDENDS',2,'Addition & subtraction','Mental calculation','Add three one-digit numbers','live',['three_addends'],'Number - addition and subtraction');
  leaf('Y2-AS-COMMUTATIVE',2,'Addition & subtraction','Properties & inverse','Use commutativity for addition and understand subtraction is not commutative','live',['fact_families'],'Number - addition and subtraction');
  leaf('Y2-AS-INVERSE',2,'Addition & subtraction','Properties & inverse','Use inverse relationships to check calculations and solve missing-number problems','live',['fact_families','add_sub_missing'],'Number - addition and subtraction');
  leaf('Y2-AS-DIFFERENCE',2,'Addition & subtraction','Difference / comparison','Solve sum, difference, more/fewer comparison questions','planned',[],'Number - addition and subtraction');

  leaf('Y2-MD-TABLES-2-5-10',2,'Multiplication & division','Times tables','Recall 2, 5 and 10 multiplication/division facts and recognise odd/even numbers','live',['multiply','divide','odd_even'],'Number - multiplication and division');
  leaf('Y2-MD-STATEMENTS',2,'Multiplication & division','Equations & symbols','Write and calculate ×, ÷ and = statements','live',['multiply','divide','missing_number'],'Number - multiplication and division');
  leaf('Y2-MD-COMMUTATIVE',2,'Multiplication & division','Properties & inverse','Use commutativity for multiplication and understand division is not commutative','live',['fact_families'],'Number - multiplication and division');
  leaf('Y2-MD-ARRAYS',2,'Multiplication & division','Arrays','Solve multiplication/division problems using arrays','planned',[],'Number - multiplication and division');
  leaf('Y2-MD-GROUP-SHARE',2,'Multiplication & division','Grouping & sharing','Solve grouping and sharing problems in context','partial',['correspondence','container_reasoning'],'Number - multiplication and division');
  leaf('Y2-MD-REPEATED',2,'Multiplication & division','Repeated addition','Connect multiplication to repeated addition','live',['repeated_addition'],'Number - multiplication and division');

  leaf('Y2-FR-THIRDS-QUARTERS',2,'Fractions','Recognise & find fractions','Recognise, find, name and write thirds, quarters, two-quarters and three-quarters','live',['fraction_of','fraction_diagrams'],'Number - fractions');
  leaf('Y2-FR-OF-VARIOUS',2,'Fractions','Fractions of shapes, sets & lengths','Find fractions of lengths, shapes, sets and quantities','partial',['fraction_of','fraction_diagrams'],'Number - fractions');
  leaf('Y2-FR-EQUIV-HALF',2,'Fractions','Equivalent fractions','Recognise two-quarters as equivalent to one-half','live',['equivalent_fractions','fraction_diagrams'],'Number - fractions');
  leaf('Y2-FR-COUNT',2,'Fractions','Counting in fractions','Count in halves and quarters, including beyond one whole','partial',['fraction_sequences'],'Number - fractions');

  leaf('Y2-MEAS-UNITS',2,'Measurement','Measuring & units','Choose and use suitable standard units for length, mass, temperature and capacity','partial',['unit_choice','measure_scales','temperature_visuals'],'Measurement');
  leaf('Y2-MEAS-SCALES',2,'Measurement','Reading scales','Read rulers, scales, thermometers and measuring vessels to suitable divisions','partial',['measure_scales','temperature_visuals'],'Measurement');
  leaf('Y2-MEAS-COMPARE',2,'Measurement','Compare & order measures','Compare and order length, mass and capacity using symbols','live',['measure_compare'],'Measurement');
  leaf('Y2-MEAS-MONEY-COMBINE',2,'Measurement','Money','Combine pounds/pence or coins to make specified values','live',['coin_reasoning','money'],'Measurement');
  leaf('Y2-MEAS-MONEY-COMBINATIONS',2,'Measurement','Money','Find different coin combinations for the same amount','live',['coin_reasoning'],'Measurement');
  leaf('Y2-MEAS-MONEY-CHANGE',2,'Measurement','Money','Solve simple money addition/subtraction and change problems','live',['money','coin_reasoning'],'Measurement');
  leaf('Y2-MEAS-TIME-INTERVALS',2,'Measurement','Duration','Compare and sequence intervals of time','live',['time_duration','time_language'],'Measurement');
  leaf('Y2-MEAS-TIME-5MIN',2,'Measurement','Analogue time','Tell/write time to five minutes including quarter past/to','live',['clock_reasoning_visual','time_words'],'Measurement');
  leaf('Y2-MEAS-TIME-FACTS',2,'Measurement','Time facts','Know minutes in an hour and hours in a day','live',['time_conversion'],'Measurement');

  leaf('Y2-GEO-2D-PROPS',2,'Geometry','2-D shape properties','Describe 2-D shapes using sides and vertical line symmetry','live',['visual_shape_properties','symmetry_visuals'],'Geometry - properties of shapes');
  leaf('Y2-GEO-3D-PROPS',2,'Geometry','3-D shape properties','Describe 3-D shapes using edges, vertices and faces','partial',['visual_shape_properties','shape_properties'],'Geometry - properties of shapes');
  leaf('Y2-GEO-2D-ON-3D',2,'Geometry','2-D faces on 3-D shapes','Identify 2-D shapes on surfaces of 3-D shapes','planned',[],'Geometry - properties of shapes');
  leaf('Y2-GEO-SORT-SHAPES',2,'Geometry','Classify & sort shapes','Compare and sort common 2-D/3-D shapes and everyday objects','planned',[],'Geometry - properties of shapes');
  leaf('Y2-GEO-PATTERNS',2,'Geometry','Patterns & sequences','Order and arrange mathematical objects in patterns and sequences','planned',[],'Geometry - position and direction');
  leaf('Y2-GEO-MOVEMENT',2,'Geometry','Position & movement','Describe straight movement, turns, clockwise/anticlockwise and right-angle turns','live',['turns_direction','angles_turns_y1_2'],'Geometry - position and direction');

  leaf('Y2-STAT-CONSTRUCT',2,'Statistics','Construct representations','Construct simple pictograms, tally charts, block diagrams and tables','partial',['data_diagrams','tally_charts'],'Statistics');
  leaf('Y2-STAT-CATEGORIES',2,'Statistics','Categorical data','Count categories and sort categories by quantity','partial',['data_diagrams','table_reasoning'],'Statistics');
  leaf('Y2-STAT-COMPARE',2,'Statistics','Categorical data','Answer total and comparison questions about categorical data','partial',['data_diagrams','table_reasoning'],'Statistics');

  // YEAR 3
  leaf('Y3-NPV-STEPS',3,'Number & place value','Counting','Count in multiples of 4, 8, 50 and 100','live',['number_sequences'],'Number - number and place value');
  leaf('Y3-NPV-MORE-LESS',3,'Number & place value','More / less','Find 10 or 100 more or less','live',['more_less'],'Number - number and place value');
  leaf('Y3-NPV-PLACE',3,'Number & place value','Place value','Recognise hundreds, tens and ones in three-digit numbers','live',['place_value'],'Number - number and place value');
  leaf('Y3-NPV-PARTITION',3,'Number & place value','Partitioning','Partition three-digit numbers in varied ways','partial',['partition_number'],'Number - number and place value');
  leaf('Y3-NPV-COMPARE',3,'Number & place value','Represent, compare & order','Compare and order numbers to 1,000','live',['compare_numbers'],'Number - number and place value');
  leaf('Y3-NPV-REPRESENT',3,'Number & place value','Represent & estimate','Represent and estimate three-digit numbers using varied representations','partial',['number_line_visuals'],'Number - number and place value');
  leaf('Y3-NPV-WORDS',3,'Number & place value','Read & write numbers','Read and write numbers to 1,000 in numerals and words','live',['number_words'],'Number - number and place value');
  leaf('Y3-NPV-PROBLEMS',3,'Number & place value','Problem solving','Solve number and practical problems using Year 3 place-value ideas','partial',['number_card_constraints','number_line_visuals'],'Number - number and place value','Existing reasoning providers cover parts of this objective; richer contextual templates are still needed.');

  leaf('Y3-AS-3D-ONES',3,'Addition & subtraction','Mental calculation','Add/subtract ones to/from a three-digit number','live',['addition','subtraction'],'Number - addition and subtraction');
  leaf('Y3-AS-3D-TENS',3,'Addition & subtraction','Mental calculation','Add/subtract tens to/from a three-digit number','live',['addition','subtraction'],'Number - addition and subtraction');
  leaf('Y3-AS-3D-HUNDREDS',3,'Addition & subtraction','Mental calculation','Add/subtract hundreds to/from a three-digit number','live',['addition','subtraction'],'Number - addition and subtraction');
  leaf('Y3-AS-COLUMN',3,'Addition & subtraction','Written methods','Use column addition and subtraction up to three digits','live',['column_addition','column_subtraction'],'Number - addition and subtraction');
  leaf('Y3-AS-ESTIMATE-CHECK',3,'Addition & subtraction','Estimation & checking','Estimate calculations and use inverse operations to check','live',['estimate_calculation','fact_families'],'Number - addition and subtraction');
  leaf('Y3-AS-PROBLEMS',3,'Addition & subtraction','Context problems','Solve varied and missing-number addition/subtraction problems','partial',['add_sub_missing','missing_digit_calculations'],'Number - addition and subtraction');

  leaf('Y3-MD-TABLES',3,'Multiplication & division','Times tables','Recall multiplication/division facts for 3, 4 and 8 tables','live',['multiply','divide'],'Number - multiplication and division');
  leaf('Y3-MD-2D-1D',3,'Multiplication & division','Mental & written multiplication','Calculate two-digit × one-digit products','live',['multidigit_multiply','long_multiplication'],'Number - multiplication and division');
  leaf('Y3-MD-STATEMENTS',3,'Multiplication & division','Equations & symbols','Write and calculate multiplication/division statements using known facts','live',['multiply','divide','missing_number'],'Number - multiplication and division');
  leaf('Y3-MD-SCALING',3,'Multiplication & division','Scaling','Solve positive integer scaling problems','live',['correspondence','scaled_multiply'],'Number - multiplication and division');
  leaf('Y3-MD-CORRESPONDENCE',3,'Multiplication & division','Correspondence','Solve correspondence and combinations problems','partial',['correspondence'],'Number - multiplication and division');
  leaf('Y3-MD-MISSING',3,'Multiplication & division','Missing numbers','Solve missing-number multiplication and division problems','live',['missing_number'],'Number - multiplication and division');
  leaf('Y3-MD-GROUP-SHARE',3,'Multiplication & division','Grouping & sharing','Solve contextual grouping/sharing problems','partial',['container_reasoning','correspondence'],'Number - multiplication and division');

  leaf('Y3-FR-TENTHS',3,'Fractions','Tenths','Count in tenths and connect tenths with division by 10','partial',['fraction_sequences','fraction_diagrams'],'Number - fractions');
  leaf('Y3-FR-SETS',3,'Fractions','Fractions of sets','Find unit and non-unit fractions of discrete sets','live',['fraction_of','fraction_diagrams'],'Number - fractions');
  leaf('Y3-FR-NUMBER',3,'Fractions','Fractions as numbers','Recognise unit and non-unit fractions as numbers','partial',['fraction_compare','fraction_diagrams'],'Number - fractions');
  leaf('Y3-FR-NUMBER-LINE',3,'Fractions','Fraction number lines','Locate fractions on number lines, including beyond one','planned',[],'Number - fractions');
  leaf('Y3-FR-EQUIV',3,'Fractions','Equivalent fractions','Recognise/show equivalent fractions with small denominators','live',['equivalent_fractions','fraction_diagrams'],'Number - fractions');
  leaf('Y3-FR-ADD-SUB',3,'Fractions','Add & subtract fractions','Add/subtract fractions with the same denominator within one whole','live',['fraction_add_subtract'],'Number - fractions');
  leaf('Y3-FR-COMPARE',3,'Fractions','Compare & order','Compare/order unit fractions and same-denominator fractions','live',['fraction_compare'],'Number - fractions');
  leaf('Y3-FR-PROBLEMS',3,'Fractions','Problem solving','Solve problems involving the Year 3 fraction objectives','partial',['fraction_reasoning','fraction_diagrams','fraction_of'],'Number - fractions','Direct skills are covered; a broader contextual/reasoning library is still needed.');

  leaf('Y3-MEAS-MIXED',3,'Measurement','Length, mass & capacity','Measure, compare, add and subtract length, mass and capacity','partial',['measure_compare','metric_conversion'],'Measurement');
  leaf('Y3-MEAS-PERIMETER',3,'Measurement','Perimeter','Measure perimeter of simple 2-D shapes','live',['perimeter'],'Measurement');
  leaf('Y3-MEAS-MONEY',3,'Measurement','Money','Add/subtract money and give change using £ and p','live',['money','coin_reasoning'],'Measurement');
  leaf('Y3-MEAS-CLOCKS',3,'Measurement','Time','Read/write analogue, 12-hour and 24-hour time','live',['clock_reasoning_visual','time_12_24'],'Measurement');
  leaf('Y3-MEAS-CLOCK-ROMAN',3,'Measurement','Time','Read analogue clock faces using Roman numerals I to XII','partial',['clock_reasoning_visual','roman_numerals'],'Measurement','The ingredients exist; a dedicated Roman-clock question mode is still needed.');
  leaf('Y3-MEAS-TIME-MINUTE',3,'Measurement','Time','Estimate/read time to nearest minute and compare seconds/minutes/hours','partial',['clock_reasoning_visual','time_duration'],'Measurement');
  leaf('Y3-MEAS-CALENDAR',3,'Measurement','Calendar & time facts','Use seconds/minute and days/month/year/leap-year facts','live',['calendar_facts','time_conversion'],'Measurement');
  leaf('Y3-MEAS-DURATION',3,'Measurement','Duration','Compare and calculate event durations','live',['time_duration'],'Measurement');

  leaf('Y3-GEO-DRAW-MAKE',3,'Geometry','Draw & make shapes','Draw 2-D shapes and make/describe 3-D shapes in varied orientations','partial',['visual_shape_properties'],'Geometry - properties of shapes');
  leaf('Y3-GEO-ANGLE-AS-TURN',3,'Geometry','Angles & turns','Recognise an angle as a shape property or turn','live',['angles_right_y3'],'Geometry - properties of shapes');
  leaf('Y3-GEO-RIGHT-ANGLES',3,'Geometry','Angles & turns','Identify right angles and relate 2, 3 and 4 right angles to turns','live',['angles_right_y3'],'Geometry - properties of shapes');
  leaf('Y3-GEO-COMPARE-RIGHT',3,'Geometry','Angles & turns','Identify angles greater/less than a right angle','live',['angles_right_y3'],'Geometry - properties of shapes');
  leaf('Y3-GEO-LINES',3,'Geometry','Lines','Identify horizontal, vertical, parallel and perpendicular lines','live',['line_properties','angles_right_y3'],'Geometry - properties of shapes');

  leaf('Y3-STAT-PRESENT',3,'Statistics','Charts & tables','Interpret and present data with bar charts, pictograms and tables','live',['bar_charts','data_diagrams','table_reasoning'],'Statistics');
  leaf('Y3-STAT-ONE-TWO-STEP',3,'Statistics','Data problem solving','Solve one- and two-step comparison questions from scaled charts/tables','partial',['bar_charts','data_diagrams','table_reasoning'],'Statistics');

  // YEAR 4
  leaf('Y4-NPV-MULTIPLES',4,'Number & place value','Counting','Count in multiples of 6, 7, 9, 25 and 1,000','live',['number_sequences'],'Number - number and place value');
  leaf('Y4-NPV-1000-MORE-LESS',4,'Number & place value','More / less','Find 1,000 more or less','live',['more_less'],'Number - number and place value');
  leaf('Y4-NPV-NEGATIVE',4,'Number & place value','Negative numbers','Count backwards through zero into negative numbers','live',['negative_numbers','number_line_visuals'],'Number - number and place value');
  leaf('Y4-NPV-PLACE',4,'Number & place value','Place value','Recognise place value in four-digit numbers','live',['place_value'],'Number - number and place value');
  leaf('Y4-NPV-PARTITION',4,'Number & place value','Partitioning','Partition four-digit numbers in varied ways','partial',['partition_number'],'Number - number and place value');
  leaf('Y4-NPV-COMPARE',4,'Number & place value','Represent, compare & order','Order and compare numbers beyond 1,000','live',['compare_numbers'],'Number - number and place value');
  leaf('Y4-NPV-REPRESENT',4,'Number & place value','Represent & estimate','Represent and estimate larger whole numbers','partial',['number_line_visuals'],'Number - number and place value');
  leaf('Y4-NPV-ROUND',4,'Number & place value','Rounding','Round whole numbers to nearest 10, 100 or 1,000','live',['rounding_whole'],'Number - number and place value');
  leaf('Y4-NPV-ROMAN',4,'Number & place value','Roman numerals','Read Roman numerals to 100','live',['roman_numerals'],'Number - number and place value');
  leaf('Y4-NPV-ROMAN-HISTORY',4,'Number & place value','Roman numerals','Understand that numeral systems changed over time and that zero/place value were later developments','planned',[],'Number - number and place value','Best suited to a small curated question library rather than a numeric generator.');
  leaf('Y4-NPV-PROBLEMS',4,'Number & place value','Problem solving','Solve number and practical problems using Year 4 place-value ideas and larger positive numbers','partial',['number_card_constraints','rounding_bounds','number_line_visuals'],'Number - number and place value','Existing reasoning families cover selected forms; contextual breadth remains incomplete.');

  leaf('Y4-AS-COLUMN',4,'Addition & subtraction','Written methods','Add/subtract up to four digits using column methods','live',['column_addition','column_subtraction'],'Number - addition and subtraction');
  leaf('Y4-AS-ESTIMATE-CHECK',4,'Addition & subtraction','Estimation & checking','Estimate and use inverse operations to check','live',['estimate_calculation','fact_families'],'Number - addition and subtraction');
  leaf('Y4-AS-TWO-STEP',4,'Addition & subtraction','Context problems','Solve two-step contextual addition/subtraction problems and choose methods','planned',[],'Number - addition and subtraction');

  leaf('Y4-MD-TABLES-12',4,'Multiplication & division','Times tables','Recall multiplication and division facts to 12 × 12','live',['multiply','divide'],'Number - multiplication and division');
  leaf('Y4-MD-MENTAL',4,'Multiplication & division','Mental multiplication/division','Use place value and derived facts, including ×0, ×1, ÷1 and three-factor products','live',['fact_families','derived_calculations'],'Number - multiplication and division');
  leaf('Y4-NP-FACTOR-PAIRS',4,'Number properties','Factors','Recognise factor pairs and use commutativity','live',['factor_pairs','factor_check'],'Number - multiplication and division');
  leaf('Y4-MD-2D3D-1D',4,'Multiplication & division','Written multiplication','Multiply two- or three-digit numbers by one digit using formal layout','live',['long_multiplication','multidigit_multiply'],'Number - multiplication and division');
  leaf('Y4-MD-DISTRIBUTIVE',4,'Multiplication & division','Distributive law','Solve multiplication/addition problems using distributive reasoning','live',['distributive_law'],'Number - multiplication and division');
  leaf('Y4-MD-SCALING',4,'Multiplication & division','Scaling','Solve integer scaling problems','live',['correspondence','scaled_multiply'],'Number - multiplication and division');
  leaf('Y4-MD-CORRESPONDENCE',4,'Multiplication & division','Correspondence','Solve harder correspondence/combination problems','partial',['correspondence'],'Number - multiplication and division');

  leaf('Y4-FR-EQUIV',4,'Fractions','Equivalent fractions','Recognise families of common equivalent fractions, including diagrams','live',['equivalent_fractions','fraction_diagrams'],'Number - fractions');
  leaf('Y4-FR-HUNDREDTHS',4,'Fractions','Hundredths','Count in hundredths and connect hundredths to tenths/division','partial',['fraction_sequences','fraction_diagrams'],'Number - fractions');
  leaf('Y4-FR-QUANTITIES',4,'Fractions','Fractions of quantities','Calculate increasingly difficult fractions of quantities','live',['fraction_of'],'Number - fractions');
  leaf('Y4-FR-DIVIDE-QUANTITY',4,'Fractions','Fractions of quantities','Use fractions to divide quantities, including non-unit fractions','partial',['fraction_of'],'Number - fractions');
  leaf('Y4-FR-ADD-SUB',4,'Fractions','Add & subtract fractions','Add/subtract fractions with the same denominator, including beyond one','live',['fraction_add_subtract'],'Number - fractions');

  leaf('Y4-DEC-TENTHS-HUNDREDTHS',4,'Decimals & percentages','Tenths & hundredths','Read/write decimal equivalents of tenths and hundredths','live',['decimal_place_value','decimal_to_fraction'],'Number - fractions (including decimals)');
  leaf('Y4-DEC-QUARTERS-HALVES',4,'Decimals & percentages','Fraction ↔ decimal','Know decimal equivalents of 1/4, 1/2 and 3/4','live',['fraction_decimal_percent'],'Number - fractions (including decimals)');
  leaf('Y4-DEC-DIVIDE-10-100',4,'Decimals & percentages','Place value scaling','Divide one- or two-digit numbers by 10 and 100 and identify resulting place value','live',['decimal_scale','powers_of_10'],'Number - fractions (including decimals)');
  leaf('Y4-DEC-ROUND',4,'Decimals & percentages','Rounding','Round one-decimal-place numbers to nearest whole','live',['decimal_rounding'],'Number - fractions (including decimals)');
  leaf('Y4-DEC-COMPARE',4,'Decimals & percentages','Compare & order','Compare numbers with the same number of decimal places up to 2 d.p.','live',['decimal_compare'],'Number - fractions (including decimals)');
  leaf('Y4-DEC-NUMBER-LINE',4,'Decimals & percentages','Decimal number lines','Represent tenths/hundredths on number lines','planned',[],'Number - fractions (including decimals)');
  leaf('Y4-DEC-MEASURE-MONEY',4,'Decimals & percentages','Context problems','Solve simple measure/money problems involving fractions and decimals','partial',['money','measure_compare'],'Number - fractions (including decimals)');

  leaf('Y4-MEAS-CONVERT',4,'Measurement','Metric conversions','Convert between appropriate units such as km/m and hour/minute','live',['metric_conversion','time_conversion'],'Measurement');
  leaf('Y4-MEAS-PERIMETER',4,'Measurement','Perimeter','Measure/calculate perimeter of rectilinear figures','live',['perimeter','tile_area_perimeter_visual'],'Measurement');
  leaf('Y4-MEAS-AREA-SQUARES',4,'Measurement','Area','Find rectilinear area by counting squares','live',['area','tile_area_perimeter_visual'],'Measurement');
  leaf('Y4-MEAS-MIXED',4,'Measurement','Mixed measures & money','Estimate, compare and calculate measures including pounds/pence','partial',['measure_compare','money'],'Measurement');
  leaf('Y4-MEAS-TIME-12-24',4,'Measurement','Time','Convert between analogue/digital 12-hour and 24-hour time','live',['time_12_24','clock_reasoning_visual'],'Measurement');
  leaf('Y4-MEAS-TIME-CONVERT',4,'Measurement','Time conversions','Solve hour/minute, minute/second, year/month and week/day conversions','live',['time_conversion'],'Measurement');

  leaf('Y4-GEO-CLASSIFY',4,'Geometry','Classify & sort shapes','Compare/classify triangles and quadrilaterals by properties and size','partial',['visual_shape_properties','shape_properties'],'Geometry - properties of shapes');
  leaf('Y4-GEO-ANGLES',4,'Geometry','Angles','Identify acute/obtuse angles and compare/order angles up to 180°','live',['angles_compare_y4'],'Geometry - properties of shapes');
  leaf('Y4-GEO-SYMMETRY',4,'Geometry','Symmetry','Identify lines of symmetry in varied orientations','live',['symmetry_visuals'],'Geometry - properties of shapes');
  leaf('Y4-GEO-COMPLETE-SYMMETRY',4,'Geometry','Symmetry','Complete a simple figure across a line of symmetry','live',['symmetry_visuals'],'Geometry - properties of shapes');
  leaf('Y4-GEO-COORDS',4,'Geometry','Coordinates','Describe first-quadrant coordinates','live',['coordinates_y4'],'Geometry - position and direction');
  leaf('Y4-GEO-TRANSLATION',4,'Geometry','Coordinates','Describe horizontal/vertical translations','live',['coordinates_y4'],'Geometry - position and direction');
  leaf('Y4-GEO-COMPLETE-POLYGON',4,'Geometry','Coordinates','Plot points and complete polygons on a coordinate grid','live',['coordinates_y4'],'Geometry - position and direction');

  leaf('Y4-STAT-PRESENT',4,'Statistics','Charts & graphs','Interpret/present discrete and continuous data using suitable graphs','live',['bar_charts','time_graphs','data_diagrams'],'Statistics');
  leaf('Y4-STAT-PROBLEMS',4,'Statistics','Data problem solving','Solve comparison, sum and difference problems from charts/tables/graphs','partial',['bar_charts','time_graphs','table_reasoning'],'Statistics');

  // YEAR 5
  leaf('Y5-NPV-MILLION',5,'Number & place value','Large numbers','Read/write/order/compare numbers to at least 1,000,000 and identify digit values','live',['place_value','compare_numbers','number_words'],'Number - number and place value');
  leaf('Y5-NPV-POW10-STEPS',5,'Number & place value','Counting','Count forwards/backwards in powers-of-10 steps','live',['number_sequences','powers_of_10'],'Number - number and place value');
  leaf('Y5-NPV-NEGATIVE',5,'Number & place value','Negative numbers','Interpret and count with negative whole numbers through zero','live',['negative_numbers','number_line_visuals'],'Number - number and place value');
  leaf('Y5-NPV-ROUND',5,'Number & place value','Rounding','Round numbers to 1,000,000 to specified powers of 10','live',['rounding_whole'],'Number - number and place value');
  leaf('Y5-NPV-ROMAN',5,'Number & place value','Roman numerals','Read Roman numerals to 1,000 and recognise years','live',['roman_numerals'],'Number - number and place value');
  leaf('Y5-NPV-SEQUENCES',5,'Number & place value','Sequences','Recognise and describe linear sequences involving fractions/decimals','partial',['number_sequences','fraction_sequences'],'Number - number and place value');
  leaf('Y5-NPV-PROBLEMS',5,'Number & place value','Problem solving','Solve number and practical problems using the Year 5 place-value objectives','partial',['number_card_constraints','rounding_bounds','number_line_visuals'],'Number - number and place value','Existing reasoning families cover selected forms; contextual breadth remains incomplete.');

  leaf('Y5-AS-COLUMN',5,'Addition & subtraction','Written methods','Add/subtract whole numbers with more than four digits using column methods','live',['column_addition','column_subtraction'],'Number - addition and subtraction');
  leaf('Y5-AS-MENTAL',5,'Addition & subtraction','Mental calculation','Add/subtract mentally with increasingly large numbers','live',['addition','subtraction'],'Number - addition and subtraction');
  leaf('Y5-AS-ROUND-CHECK',5,'Addition & subtraction','Estimation & checking','Use rounding to check and judge appropriate accuracy','live',['estimate_calculation','rounding_whole'],'Number - addition and subtraction');
  leaf('Y5-AS-MULTISTEP',5,'Addition & subtraction','Context problems','Solve multi-step contextual addition/subtraction problems and choose methods','planned',[],'Number - addition and subtraction');

  leaf('Y5-NP-FACTORS',5,'Number properties','Factors','Find multiples, factors, factor pairs and common factors','live',['multiple_check','factor_check','factor_pairs','common_factors'],'Number - multiplication and division');
  leaf('Y5-NP-PRIMES',5,'Number properties','Primes','Use prime/composite vocabulary and identify primes to 100','live',['prime_numbers'],'Number - multiplication and division');
  leaf('Y5-NP-SQUARE-CUBE',5,'Number properties','Square & cube numbers','Recognise/use square and cube numbers and notation','live',['square','cube'],'Number - multiplication and division');
  leaf('Y5-NP-PROBLEMS',5,'Number properties','Problem solving','Solve problems using factors, multiples, square numbers and cube numbers','partial',['number_property_constraints','constrained_factor_pairs','event_cycles'],'Number - multiplication and division','Strong reasoning coverage exists, but the curriculum objective spans a wider contextual range.');
  leaf('Y5-MD-LONG-MULT',5,'Multiplication & division','Written multiplication','Multiply up to four digits by one/two digits including long multiplication','live',['long_multiplication','multidigit_multiply'],'Number - multiplication and division');
  leaf('Y5-MD-MENTAL',5,'Multiplication & division','Mental multiplication/division','Multiply/divide mentally using known facts','live',['derived_calculations','scaled_multiply','scaled_divide'],'Number - multiplication and division');
  leaf('Y5-MD-SHORT-DIV',5,'Multiplication & division','Written division','Divide up to four digits by one digit using short division','live',['short_division','division_remainders'],'Number - multiplication and division');
  leaf('Y5-MD-REMAINDERS',5,'Multiplication & division','Remainders','Interpret remainders appropriately in context','partial',['division_remainders'],'Number - multiplication and division','Raw remainders are live; contextual interpretation needs richer templates.');
  leaf('Y5-MD-POW10',5,'Multiplication & division','Powers of 10','Multiply/divide whole and decimal numbers by 10, 100 and 1,000','live',['powers_of_10','decimal_scale'],'Number - multiplication and division');
  leaf('Y5-MD-MIXED-PROBLEMS',5,'Multiplication & division','Mixed-operation problems','Solve problems combining all four operations and equality','partial',['insert_brackets','missing_symbols'],'Number - multiplication and division');
  leaf('Y5-MD-SCALING-RATE',5,'Multiplication & division','Scaling & rates','Solve scaling by simple fractions and simple-rate problems','partial',['unit_rate','scale_factor','ratio_proportion_reasoning'],'Number - multiplication and division');

  leaf('Y5-FR-COMPARE',5,'Fractions','Compare & order','Compare/order fractions with related denominators','live',['fraction_compare'],'Number - fractions');
  leaf('Y5-FR-EQUIV',5,'Fractions','Equivalent fractions','Identify/name/write equivalent fractions, including visual tenths/hundredths','live',['equivalent_fractions','fraction_diagrams'],'Number - fractions');
  leaf('Y5-FR-MIXED-IMPROPER',5,'Fractions','Mixed & improper fractions','Convert between mixed and improper fractions','live',['mixed_improper'],'Number - fractions');
  leaf('Y5-FR-ADD-SUB',5,'Fractions','Add & subtract fractions','Add/subtract same or related-denominator fractions','live',['fraction_add_subtract'],'Number - fractions');
  leaf('Y5-FR-MULT-WHOLE',5,'Fractions','Multiply fractions','Multiply proper fractions/mixed numbers by whole numbers','live',['fraction_multiply_whole'],'Number - fractions');

  leaf('Y5-DEC-AS-FRACTION',5,'Decimals & percentages','Fraction ↔ decimal','Write decimals as fractions by place value','live',['decimal_to_fraction'],'Number - fractions (including decimals and percentages)');
  leaf('Y5-DEC-THOUSANDTHS',5,'Decimals & percentages','Thousandths','Recognise thousandths and relate them to tenths/hundredths','live',['decimal_place_value'],'Number - fractions (including decimals and percentages)');
  leaf('Y5-DEC-ROUND',5,'Decimals & percentages','Rounding','Round 2 d.p. decimals to nearest whole and 1 d.p.','live',['decimal_rounding'],'Number - fractions (including decimals and percentages)');
  leaf('Y5-DEC-COMPARE',5,'Decimals & percentages','Compare & order','Read/write/order/compare numbers with up to 3 d.p.','live',['decimal_place_value','decimal_compare'],'Number - fractions (including decimals and percentages)');
  leaf('Y5-DEC-PROBLEMS',5,'Decimals & percentages','Context problems','Solve problems involving numbers to 3 d.p.','partial',['decimal_add_subtract','decimal_multiply'],'Number - fractions (including decimals and percentages)');
  leaf('Y5-PCT-MEANING',5,'Decimals & percentages','Percentage meaning','Understand percent as parts per 100 and write as fraction/decimal','live',['fraction_decimal_percent'],'Number - fractions (including decimals and percentages)');
  leaf('Y5-PCT-EQUIV',5,'Decimals & percentages','Fraction/decimal/percentage equivalence','Use common fraction–decimal–percentage equivalences','live',['fraction_decimal_percent'],'Number - fractions (including decimals and percentages)');
  leaf('Y5-PCT-EQUIV-PROBLEMS',5,'Decimals & percentages','Fraction/decimal/percentage equivalence','Solve problems requiring known percentage and decimal equivalents of common fractions','partial',['fraction_decimal_percent','percentage_reasoning'],'Number - fractions (including decimals and percentages)','Direct equivalence is live; broader contextual problem forms need expansion.');
  leaf('Y5-DEC-NUMBER-LINE',5,'Decimals & percentages','Decimal number lines','Locate decimals/fractions on number lines, including crossing zero','planned',[],'Number - fractions (including decimals and percentages)');

  leaf('Y5-MEAS-METRIC',5,'Measurement','Metric conversions','Convert between metric units','live',['metric_conversion'],'Measurement');
  leaf('Y5-MEAS-IMPERIAL',5,'Measurement','Metric/imperial','Use approximate metric/imperial equivalences','live',['imperial_conversion'],'Measurement');
  leaf('Y5-MEAS-PERIMETER',5,'Measurement','Perimeter','Calculate perimeter of composite rectilinear shapes and missing lengths','live',['perimeter','missing_measure'],'Measurement');
  leaf('Y5-MEAS-AREA-RECT',5,'Measurement','Area','Calculate/compare area of rectangles and squares','live',['area','tile_area_perimeter_visual'],'Measurement');
  leaf('Y5-MEAS-AREA-IRREGULAR',5,'Measurement','Area','Estimate area of irregular shapes','planned',[],'Measurement');
  leaf('Y5-MEAS-VOLUME-ESTIMATE',5,'Measurement','Volume & capacity','Estimate volume and capacity','planned',[],'Measurement');
  leaf('Y5-MEAS-TIME-CONVERT',5,'Measurement','Time conversions','Solve problems converting between units of time','live',['time_conversion','mixed_unit_order'],'Measurement');
  leaf('Y5-MEAS-4OPS',5,'Measurement','Measure problem solving','Use all four operations with measures, money and decimal notation','partial',['money_multi_step','measure_diagrams'],'Measurement');

  leaf('Y5-GEO-3D-FROM-2D',5,'Geometry','3-D shapes','Identify 3-D shapes from 2-D representations','planned',[],'Geometry - properties of shapes');
  leaf('Y5-GEO-ANGLES-MEASURE',5,'Geometry','Angles','Estimate/compare acute, obtuse and reflex angles','live',['angles_degrees_y5'],'Geometry - properties of shapes');
  leaf('Y5-GEO-DRAW-MEASURE-ANGLES',5,'Geometry','Angles','Draw and measure angles in degrees','live',['angles_degrees_y5'],'Geometry - properties of shapes');
  leaf('Y5-GEO-ANGLE-FACTS',5,'Geometry','Angles','Use angles at a point/on a line and multiples of 90°','live',['angles_lines_points_y5_6'],'Geometry - properties of shapes');
  leaf('Y5-GEO-RECT-PROPS',5,'Geometry','Shape reasoning','Use rectangle properties to find missing lengths/angles','partial',['measure_diagrams','visual_shape_properties'],'Geometry - properties of shapes');
  leaf('Y5-GEO-REGULAR',5,'Geometry','Polygons','Distinguish regular and irregular polygons','partial',['visual_shape_properties'],'Geometry - properties of shapes');
  leaf('Y5-GEO-TRANSFORM',5,'Geometry','Transformations','Describe and represent reflections/translations in the first quadrant','live',['transformations_y5'],'Geometry - position and direction');

  leaf('Y5-STAT-LINE',5,'Statistics','Line graphs','Solve comparison/sum/difference problems from line graphs','live',['line_graphs'],'Statistics');
  leaf('Y5-STAT-TABLES',5,'Statistics','Tables & timetables','Complete, read and interpret tables including timetables','live',['table_reasoning','timetable_reasoning'],'Statistics');

  // YEAR 6
  leaf('Y6-NPV-10M',6,'Number & place value','Large numbers','Read/write/order/compare numbers to 10,000,000 and determine digit values','live',['place_value','compare_numbers','number_words'],'Number - number and place value');
  leaf('Y6-NPV-ROUND',6,'Number & place value','Rounding','Round whole numbers to a required degree of accuracy','live',['rounding_whole','rounding_custom'],'Number - number and place value');
  leaf('Y6-NPV-NEGATIVE',6,'Number & place value','Negative numbers','Use negative numbers in context and calculate intervals across zero','live',['negative_numbers','temperature_interval','number_line_visuals'],'Number - number and place value');
  leaf('Y6-NPV-PROBLEMS',6,'Number & place value','Problem solving','Solve number and practical problems using the Year 6 place-value objectives','partial',['number_card_constraints','rounding_bounds','temperature_interval'],'Number - number and place value','Existing providers cover selected forms; broader contextual question templates are still needed.');

  leaf('Y6-MD-LONG-MULT',6,'Multiplication & division','Written multiplication','Multiply up to four digits by a two-digit number using long multiplication','live',['long_multiplication'],'Number - addition, subtraction, multiplication and division');
  leaf('Y6-MD-LONG-DIV',6,'Multiplication & division','Written division','Divide up to four digits by two digits using long division','live',['written_long_division','long_division'],'Number - addition, subtraction, multiplication and division');
  leaf('Y6-MD-SHORT-DIV',6,'Multiplication & division','Written division','Use short division by two-digit divisors where appropriate','partial',['short_division','long_division'],'Number - addition, subtraction, multiplication and division');
  leaf('Y6-MD-REMAINDER-CONTEXT',6,'Multiplication & division','Remainders','Interpret division results as remainder, fraction or rounded value according to context','partial',['division_remainders'],'Number - addition, subtraction, multiplication and division');
  leaf('Y6-MD-MENTAL',6,'Multiplication & division','Mental calculation','Perform mental calculations with mixed operations and large numbers','partial',['derived_calculations','bodmas'],'Number - addition, subtraction, multiplication and division');
  leaf('Y6-NP-COMMON',6,'Number properties','Factors, multiples & primes','Identify common factors, common multiples and prime numbers','live',['common_factors','common_multiples','prime_numbers'],'Number - addition, subtraction, multiplication and division');
  leaf('Y6-MD-BODMAS',6,'Multiplication & division','Order of operations','Use the order of operations, including brackets','live',['bodmas','insert_brackets'],'Number - addition, subtraction, multiplication and division');
  leaf('Y6-AS-MULTISTEP',6,'Addition & subtraction','Context problems','Solve multi-step contextual addition/subtraction problems and choose methods','planned',[],'Number - addition, subtraction, multiplication and division');
  leaf('Y6-MD-MIXED-PROBLEMS',6,'Multiplication & division','Mixed-operation problems','Solve problems involving all four operations','partial',['container_reasoning','money_multi_step'],'Number - addition, subtraction, multiplication and division');
  leaf('Y6-MD-ESTIMATE',6,'Multiplication & division','Estimation & checking','Use estimation to check answers and judge required accuracy','live',['estimate_calculation','rounding_custom'],'Number - addition, subtraction, multiplication and division');

  leaf('Y6-FR-SIMPLIFY',6,'Fractions','Simplify & common denominator','Use common factors to simplify and common multiples for common denominators','live',['simplify_fractions','common_factors','common_multiples'],'Number - fractions');
  leaf('Y6-FR-COMPARE',6,'Fractions','Compare & order','Compare and order fractions including values greater than one','live',['fraction_compare'],'Number - fractions');
  leaf('Y6-FR-ADD-SUB',6,'Fractions','Add & subtract fractions','Add/subtract different denominators and mixed numbers','live',['fraction_add_subtract'],'Number - fractions');
  leaf('Y6-FR-MULT',6,'Fractions','Multiply fractions','Multiply pairs of proper fractions and simplify','live',['fraction_multiply'],'Number - fractions');
  leaf('Y6-FR-DIVIDE',6,'Fractions','Divide fractions','Divide proper fractions by whole numbers','live',['fraction_divide_whole'],'Number - fractions');
  leaf('Y6-FR-AS-DIVISION',6,'Fractions','Fraction as division','Associate fractions with division and find decimal equivalents','live',['fraction_division_decimal','fraction_to_decimal'],'Number - fractions');

  leaf('Y6-DEC-PLACE',6,'Decimals & percentages','Decimal place value','Identify digits to 3 d.p.','live',['decimal_place_value'],'Number - fractions');
  leaf('Y6-DEC-SCALE',6,'Decimals & percentages','Place value scaling','Multiply/divide by 10, 100 and 1,000 with answers up to 3 d.p.','live',['decimal_scale','powers_of_10'],'Number - fractions');
  leaf('Y6-DEC-MULT',6,'Decimals & percentages','Decimal multiplication','Multiply one-digit numbers with up to 2 d.p. by whole numbers','live',['decimal_multiply'],'Number - fractions');
  leaf('Y6-DEC-DIV',6,'Decimals & percentages','Decimal division','Use written division where answers have up to 2 d.p.','live',['decimal_divide'],'Number - fractions');
  leaf('Y6-DEC-ROUND-PROBLEMS',6,'Decimals & percentages','Rounding','Solve decimal problems requiring specified accuracy','partial',['decimal_rounding','rounding_custom'],'Number - fractions');
  leaf('Y6-FDP-EQUIV',6,'Decimals & percentages','Fraction/decimal/percentage equivalence','Recall/use simple fraction, decimal and percentage equivalences','live',['fraction_decimal_percent'],'Number - fractions');

  leaf('Y6-RATIO-RELATIVE',6,'Ratio & proportion','Equivalent ratios','Solve relative-size/missing-value problems using multiplication/division','live',['ratio_missing','ratio_proportion_reasoning'],'Ratio and proportion');
  leaf('Y6-RATIO-PERCENT',6,'Ratio & proportion','Percentages','Calculate percentages of quantities and use percentages for comparison','live',['percentage_of','percentage_compare','percentage_reasoning'],'Ratio and proportion');
  leaf('Y6-RATIO-SIMILAR',6,'Ratio & proportion','Scale factor','Solve similar-shape problems using scale factors','live',['scale_factor','similar_shapes'],'Ratio and proportion');
  leaf('Y6-RATIO-SHARE',6,'Ratio & proportion','Unequal sharing','Solve unequal sharing/grouping using fractions and multiples','live',['ratio_share','ratio_proportion_reasoning'],'Ratio and proportion');
  leaf('Y6-RATIO-RATE',6,'Ratio & proportion','Rates','Solve simple rate problems','live',['unit_rate','recipe_scaling'],'Ratio and proportion');

  leaf('Y6-ALG-FORMULAE',6,'Algebra','Formulae','Use simple formulae','live',['formula_substitution'],'Algebra');
  leaf('Y6-ALG-SEQUENCES',6,'Algebra','Sequences','Generate and describe linear number sequences','live',['algebra_sequences','recursive_sequences'],'Algebra');
  leaf('Y6-ALG-MISSING',6,'Algebra','Equations','Express missing-number problems algebraically','live',['simple_algebra'],'Algebra');
  leaf('Y6-ALG-TWO-UNKNOWN',6,'Algebra','Two unknowns','Find pairs satisfying an equation with two unknowns','live',['equation_pairs'],'Algebra');
  leaf('Y6-ALG-ENUMERATE',6,'Algebra','Enumerate combinations','Systematically enumerate combinations of two variables','planned',[],'Algebra');
  leaf('Y6-ALG-GENERALISE',6,'Algebra','Generalisation','Reason with equivalent expressions and generalise number patterns','partial',['letter_sum_grid','inverse_formula_reasoning'],'Algebra');

  leaf('Y6-MEAS-CONVERT',6,'Measurement','Unit conversions','Calculate/convert standard units using decimals to 3 d.p.','live',['metric_conversion','time_conversion'],'Measurement');
  leaf('Y6-MEAS-CONVERSION-PROBLEMS',6,'Measurement','Unit conversions','Solve problems involving calculation and conversion of measures using decimals to 3 d.p.','partial',['metric_conversion','time_conversion','measure_diagrams'],'Measurement','Direct conversions are live; richer contextual conversion problems are only partially covered.');
  leaf('Y6-MEAS-MILES-KM',6,'Measurement','Metric/imperial','Convert between miles and kilometres','partial',['imperial_conversion'],'Measurement');
  leaf('Y6-MEAS-AREA-PERIM',6,'Measurement','Area & perimeter relationships','Reason that equal areas can have different perimeters and vice versa','live',['area_perimeter_relationships','tile_area_perimeter_visual'],'Measurement');
  leaf('Y6-MEAS-FORMULAE',6,'Measurement','Formulae','Recognise when area/volume formulae can be used','partial',['area','volume','formula_substitution'],'Measurement');
  leaf('Y6-MEAS-TRI-PARA',6,'Measurement','Area','Calculate areas of triangles and parallelograms','live',['triangle_area','parallelogram_area'],'Measurement');
  leaf('Y6-MEAS-VOLUME',6,'Measurement','Volume','Calculate, estimate and compare cube/cuboid volumes','live',['volume','same_volume_cuboids'],'Measurement');

  leaf('Y6-GEO-DRAW-2D',6,'Geometry','Draw shapes','Draw 2-D shapes using given dimensions and angles','planned',[],'Geometry - properties of shapes');
  leaf('Y6-GEO-NETS',6,'Geometry','3-D shapes & nets','Recognise, describe and build simple 3-D shapes including nets','partial',['shape_nets','cube_net_reasoning'],'Geometry - properties of shapes');
  leaf('Y6-GEO-CLASSIFY-ANGLES',6,'Geometry','Classify & reason','Compare/classify shapes and find unknown angles in triangles, quadrilaterals and regular polygons','live',['angles_triangles_y6','angles_quads_polygons_y6','visual_shape_properties'],'Geometry - properties of shapes');
  leaf('Y6-GEO-CIRCLES',6,'Geometry','Circles','Name radius, diameter and circumference and use diameter = 2 × radius','live',['circle_properties'],'Geometry - properties of shapes');
  leaf('Y6-GEO-ANGLE-REL',6,'Geometry','Angles','Use angles at a point, on a line and vertically opposite to find unknowns','live',['angles_lines_points_y5_6','angles_reasoning_y5_6'],'Geometry - properties of shapes');
  leaf('Y6-GEO-COORDS',6,'Geometry','Coordinates','Describe positions in all four quadrants','live',['coordinates_y6'],'Geometry - position and direction');
  leaf('Y6-GEO-TRANSFORM',6,'Geometry','Transformations','Draw/translate shapes and reflect them in coordinate axes','live',['coordinates_y6'],'Geometry - position and direction');

  leaf('Y6-STAT-PIE-LINE',6,'Statistics','Pie charts & line graphs','Interpret and construct pie charts and line graphs and solve problems','live',['pie_charts_y6','pie_charts_reasoning_y6','line_graphs'],'Statistics');
  leaf('Y6-STAT-MEAN',6,'Statistics','Mean','Calculate and interpret the mean as an average','live',['mean','mean_cards','mean_reasoning'],'Statistics');

  const STATUS_SET=new Set(Object.keys(STATUS_LABELS));
  function validate(){
    const errors=[];
    const ids=new Set();
    for(const row of objectives){
      if(!row.id || ids.has(row.id)) errors.push('Duplicate/missing id: '+row.id);
      ids.add(row.id);
      if(!Number.isInteger(row.year)||row.year<1||row.year>6) errors.push('Bad year: '+row.id);
      if(!DOMAIN_ORDER.includes(row.domain)) errors.push('Unknown domain: '+row.id+' -> '+row.domain);
      if(!row.subcategory) errors.push('Missing subcategory: '+row.id);
      if(!row.label) errors.push('Missing label: '+row.id);
      if(!STATUS_SET.has(row.status)) errors.push('Bad status: '+row.id+' -> '+row.status);
      if(row.status==='live' && !row.providers.length) errors.push('Live objective without provider: '+row.id);
    }
    return errors;
  }

  function summary(rows=objectives){
    const out={total:rows.length,live:0,partial:0,planned:0,byYear:{},byDomain:{}};
    for(const row of rows){
      out[row.status]=(out[row.status]||0)+1;
      const y=out.byYear[row.year]||(out.byYear[row.year]={total:0,live:0,partial:0,planned:0});
      y.total++;y[row.status]++;
      const d=out.byDomain[row.domain]||(out.byDomain[row.domain]={total:0,live:0,partial:0,planned:0});
      d.total++;d[row.status]++;
    }
    return out;
  }

  function group(rows=objectives){
    const domains=[];
    for(const domain of DOMAIN_ORDER){
      const domainRows=rows.filter(x=>x.domain===domain);
      if(!domainRows.length) continue;
      const names=[];
      const seen=new Set();
      for(const row of domainRows) if(!seen.has(row.subcategory)){seen.add(row.subcategory);names.push(row.subcategory);}
      domains.push({
        domain,
        subcategories:names.map(name=>({name,objectives:domainRows.filter(x=>x.subcategory===name)}))
      });
    }
    return domains;
  }

  const api={VERSION,SOURCE,DOMAIN_ORDER,STATUS_LABELS,objectives,validate,summary,group};
  global.TT99CurriculumRegistry=Object.freeze(api);
})(window);
