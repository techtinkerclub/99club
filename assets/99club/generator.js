/* Tech Tinker Club - 99 Club worksheet generator core
 * Pure JavaScript, deterministic and browser/Node friendly.
 */
(function (global) {
  'use strict';

  const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);

  const CLASSIC_PRESETS = {
    '11': {
      id: '11', name: '11 Club', tagline: 'Doubling 1-10', questionCount: 11,
      mode: 'double', numberMin: 1, numberMax: 10,
      timeMinutes: 5, perfectAttempts: 3, consecutivePerfectAttempts: false, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '22': {
      id: '22', name: '22 Club', tagline: 'Repeated addition', questionCount: 22,
      mode: 'repeated_addition', addendMin: 1, addendMax: 10, repeatsMin: 2, repeatsMax: 7,
      timeMinutes: 5, perfectAttempts: 3, consecutivePerfectAttempts: false, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '33': {
      id: '33', name: '33 Club', tagline: '2x, 3x, 5x & 10x', questionCount: 33,
      mode: 'multiply', tables: [2, 3, 5, 10], factorMin: 1, factorMax: 12,
      timeMinutes: 5, perfectAttempts: 3, consecutivePerfectAttempts: false, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '44': {
      id: '44', name: '44 Club', tagline: 'Adds 1x, 4x & 6x', questionCount: 44,
      mode: 'multiply', tables: [1, 2, 3, 4, 5, 6, 10], factorMin: 1, factorMax: 12,
      timeMinutes: 5, perfectAttempts: 3, consecutivePerfectAttempts: false, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '55': {
      id: '55', name: '55 Club', tagline: 'Adds 7x & 8x', questionCount: 55,
      mode: 'multiply', tables: [1, 2, 3, 4, 5, 6, 7, 8, 10], factorMin: 1, factorMax: 12,
      timeMinutes: 5, perfectAttempts: 3, consecutivePerfectAttempts: false, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '66': {
      id: '66', name: '66 Club', tagline: 'All tables to 12x', questionCount: 66,
      mode: 'multiply', tables: range(1, 12), factorMin: 1, factorMax: 12,
      timeMinutes: 5, perfectAttempts: 3, consecutivePerfectAttempts: false, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '77': {
      id: '77', name: '77 Club', tagline: 'Inverse division facts', questionCount: 77,
      mode: 'divide', tables: range(1, 12), factorMin: 1, factorMax: 12,
      timeMinutes: 5, perfectAttempts: 3, consecutivePerfectAttempts: false, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '88': {
      id: '88', name: '88 Club', tagline: 'Mixed multiplication & division', questionCount: 88,
      mode: 'mixed', tables: range(1, 12), factorMin: 1, factorMax: 12, multiplyPercent: 50,
      timeMinutes: 5, perfectAttempts: 3, consecutivePerfectAttempts: false, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '99': {
      id: '99', name: '99 Club', tagline: 'The full mixed challenge', questionCount: 99,
      mode: 'mixed', tables: range(1, 12), factorMin: 1, factorMax: 12, multiplyPercent: 50,
      timeMinutes: 5, perfectAttempts: 3, consecutivePerfectAttempts: false, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    }
  };


  // Post-99 challenge presets. These are deliberately separate from the Classic
  // 11-99 sequence so the existing default progression remains unchanged.
  const CHALLENGE_PRESETS = {
    bronze: {
      id: 'bronze', name: 'Bronze Club', tagline: 'All tables & related division', questionCount: 100,
      mode: 'mixed', tables: range(1, 12), factorMin: 1, factorMax: 12, multiplyPercent: 50,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    silver: {
      id: 'silver', name: 'Silver Club', tagline: 'All four operations', questionCount: 100,
      mode: 'family_mix', families: ['addition','subtraction','multiply','divide'],
      familyWeights: { addition:2, subtraction:2, multiply:3, divide:3 },
      arithmeticMin: 0, arithmeticMax: 200, arithmeticOperandMax: 120,
      tables: range(1, 12), factorMin: 1, factorMax: 12,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    gold: {
      id: 'gold', name: 'Gold Club', tagline: 'Four operations, squares & roots', questionCount: 100,
      mode: 'family_mix', families: ['addition','subtraction','multiply','divide','square','square_root'],
      familyWeights: { addition:2, subtraction:2, multiply:3, divide:3, square:1, square_root:1 },
      arithmeticMin: 0, arithmeticMax: 250, arithmeticOperandMax: 160,
      tables: range(1, 12), factorMin: 1, factorMax: 12, squareMin: 1, squareMax: 12,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    platinum: {
      id: 'platinum', name: 'Platinum Club', tagline: 'Adds order of operations', questionCount: 100,
      mode: 'family_mix', families: ['addition','subtraction','multiply','divide','square','square_root','bodmas'],
      familyWeights: { addition:2, subtraction:2, multiply:3, divide:3, square:1, square_root:1, bodmas:2 },
      arithmeticMin: 0, arithmeticMax: 300, arithmeticOperandMax: 180,
      tables: range(1, 12), factorMin: 1, factorMax: 12, squareMin: 1, squareMax: 12, bodmasMax: 12,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    diamond: {
      id: 'diamond', name: 'Diamond Club', tagline: 'Broad advanced mental maths', questionCount: 100,
      mode: 'family_mix',
      families: ['addition','subtraction','multiply','divide','square','square_root','bodmas','scaled_multiply','scaled_divide','fraction_of','percentage_of'],
      familyWeights: { addition:2, subtraction:2, multiply:2, divide:2, square:1, square_root:1, bodmas:2, scaled_multiply:2, scaled_divide:1, fraction_of:1, percentage_of:1 },
      arithmeticMin: 0, arithmeticMax: 1000, arithmeticOperandMax: 850,
      tables: range(1, 12), factorMin: 1, factorMax: 12, squareMin: 1, squareMax: 12, bodmasMax: 12,
      fractionDenominators: [2,3,4,5,10], percentageChoices: [10,20,25,50,75],
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    }
  };


  // Flexible, non-club worksheet mode for starters, quizzes, homework and targeted practice.
  // It deliberately uses the same deterministic family-mix engine as the named challenges,
  // but has no advancement rule and no club badge on the worksheet.
  const OPEN_WORKSHEET_PRESET = {
    id: 'worksheet', name: 'Custom Worksheet', tagline: 'Choose curriculum topics, weights and question count',
    questionCount: 15, mode: 'family_mix',
    families: [],
    familyWeights: {},
    arithmeticMin: 0, arithmeticMax: 100, arithmeticOperandMin: 0, arithmeticOperandMax: 100,
    tables: range(1, 12), factorMin: 1, factorMax: 12,
    timeMinutes: 10, timeEnabled: false, progressionEnabled: false, unaided: false,
    worksheetTitle: 'Maths Practice',
    wholeNumberMax: 1000, decimalPlacesMax: 2, decimalWholeMax: 100,
    ratioPartMax: 8, ratioQuantityMax: 120, coordinateMax: 12, statsValueMax: 30,
    fractionDenominators: [2,3,4,5,6,8,10,12], percentageChoices: [10,20,25,50,75],
    avoidExactDuplicates: true, avoidReversedDuplicates: false
  };

  function commonPreset(id, name, tagline, questionCount, extra) {
    return Object.assign({
      id, name, tagline, questionCount,
      timeMinutes: 5, perfectAttempts: 2, consecutivePerfectAttempts: true, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    }, extra || {});
  }

  // Optional content schemes found in public UK school implementations. Timing
  // and advancement intentionally keep their existing 5 minutes / 2 consecutive
  // perfect-attempt defaults; users can edit those independently in the rule editor.
  const SCHEME_PRESETS = {
    classic: {
      id: 'classic', name: 'Classic 99 Club', tagline: 'Doubling → repeated addition → tables → division',
      presets: CLASSIC_PRESETS
    },
    addition_first: {
      id: 'addition_first', name: 'Addition-first', tagline: 'Addition first, then tables and division',
      presets: {
        '11': commonPreset('11','11 Club','Addition to 10',11,{mode:'addition',arithmeticMin:0,arithmeticMax:10,arithmeticOperandMax:10}),
        '22': commonPreset('22','22 Club','Addition to 20',22,{mode:'addition',arithmeticMin:0,arithmeticMax:20,arithmeticOperandMax:20}),
        '33': commonPreset('33','33 Club','Addition to 20 + 2× & 10×',33,{mode:'family_mix',families:['addition','multiply'],familyWeights:{addition:2,multiply:1},arithmeticMin:0,arithmeticMax:20,arithmeticOperandMax:20,tables:[2,10],factorMin:1,factorMax:12}),
        '44': commonPreset('44','44 Club','Addition to 20 + 2×, 5× & 10×',44,{mode:'family_mix',families:['addition','multiply'],familyWeights:{addition:2,multiply:2},arithmeticMin:0,arithmeticMax:20,arithmeticOperandMax:20,tables:[2,5,10],factorMin:1,factorMax:12}),
        '55': commonPreset('55','55 Club','2×, 3×, 4×, 5× & 10×',55,{mode:'multiply',tables:[2,3,4,5,10],factorMin:1,factorMax:12}),
        '66': commonPreset('66','66 Club','Adds 6×',66,{mode:'multiply',tables:[2,3,4,5,6,10],factorMin:1,factorMax:12}),
        '77': commonPreset('77','77 Club','Adds 7×',77,{mode:'multiply',tables:[2,3,4,5,6,7,10],factorMin:1,factorMax:12}),
        '88': commonPreset('88','88 Club','All tables to 12×',88,{mode:'multiply',tables:range(1,12),factorMin:1,factorMax:12}),
        '99': commonPreset('99','99 Club','All tables + related division',99,{mode:'mixed',tables:range(1,12),factorMin:1,factorMax:12,multiplyPercent:50})
      }
    },
    arithmetic_first: {
      id: 'arithmetic_first', name: 'Arithmetic-first', tagline: 'Addition/subtraction before multiplication and division',
      presets: {
        '11': commonPreset('11','11 Club','Add two single-digit numbers',11,{mode:'addition',arithmeticMin:0,arithmeticMax:18,arithmeticOperandMax:9}),
        '22': commonPreset('22','22 Club','Addition & subtraction to 20',22,{mode:'add_subtract',arithmeticMin:0,arithmeticMax:20,arithmeticOperandMax:20}),
        '33': commonPreset('33','33 Club','Addition & subtraction to 20',33,{mode:'add_subtract',arithmeticMin:0,arithmeticMax:20,arithmeticOperandMax:20}),
        '44': commonPreset('44','44 Club','Addition to 20 + 2×, 5× & 10×',44,{mode:'family_mix',families:['addition','multiply'],familyWeights:{addition:2,multiply:2},arithmeticMin:0,arithmeticMax:20,arithmeticOperandMax:20,tables:[2,5,10],factorMin:0,factorMax:12}),
        '55': commonPreset('55','55 Club','Adds 3×, 4× & 6×',55,{mode:'multiply',tables:[2,3,4,5,6,10],factorMin:0,factorMax:12}),
        '66': commonPreset('66','66 Club','Adds 7×, 8× & 9×',66,{mode:'multiply',tables:[2,3,4,5,6,7,8,9,10],factorMin:0,factorMax:12}),
        '77': commonPreset('77','77 Club','Mixed multiplication & division',77,{mode:'mixed',tables:range(1,12),factorMin:0,factorMax:12,multiplyPercent:60}),
        '88': commonPreset('88','88 Club','Mixed facts + missing numbers',88,{mode:'family_mix',families:['multiply','divide','missing_number'],familyWeights:{multiply:3,divide:2,missing_number:2},tables:range(1,12),factorMin:0,factorMax:12}),
        '99': commonPreset('99','99 Club','Full mixed facts + missing numbers',99,{mode:'family_mix',families:['multiply','divide','missing_number'],familyWeights:{multiply:3,divide:2,missing_number:3},tables:range(1,12),factorMin:0,factorMax:12})
      }
    },
    missing_number: {
      id: 'missing_number', name: 'Missing-number progression', tagline: 'Tables build-up finishing with missing-number facts',
      presets: {
        '11': commonPreset('11','11 Club','Doubling 1-10',11,{mode:'double',numberMin:1,numberMax:10}),
        '22': commonPreset('22','22 Club','2×, 5× & 10×',22,{mode:'multiply',tables:[2,5,10],factorMin:1,factorMax:12}),
        '33': commonPreset('33','33 Club','Adds 3× & 4×',33,{mode:'multiply',tables:[2,3,4,5,10],factorMin:1,factorMax:12}),
        '44': commonPreset('44','44 Club','Adds 1× & 6×',44,{mode:'multiply',tables:[1,2,3,4,5,6,10],factorMin:1,factorMax:12}),
        '55': commonPreset('55','55 Club','Adds 7×, 8× & 9×',55,{mode:'multiply',tables:range(1,10),factorMin:1,factorMax:12}),
        '66': commonPreset('66','66 Club','Adds 11× & 12×',66,{mode:'multiply',tables:range(1,12),factorMin:1,factorMax:12}),
        '77': commonPreset('77','77 Club','Inverse division facts',77,{mode:'divide',tables:range(1,12),factorMin:1,factorMax:12}),
        '88': commonPreset('88','88 Club','Mixed multiplication & division',88,{mode:'mixed',tables:range(1,12),factorMin:1,factorMax:12,multiplyPercent:50}),
        '99': commonPreset('99','99 Club','Missing-number multiplication & division',99,{mode:'missing_number',tables:range(1,12),factorMin:1,factorMax:12})
      }
    },
    tables_first: {
      id: 'tables_first', name: 'Tables-first', tagline: 'Multiplication first, then related division',
      presets: {
        '11': commonPreset('11','11 Club','Multiply by 2 & 10',11,{mode:'multiply',tables:[2,10],factorMin:1,factorMax:12}),
        '22': commonPreset('22','22 Club','Multiply by 2, 5 & 10',22,{mode:'multiply',tables:[2,5,10],factorMin:1,factorMax:12}),
        '33': commonPreset('33','33 Club','× and ÷ by 2, 5 & 10',33,{mode:'mixed',tables:[2,5,10],factorMin:1,factorMax:12,multiplyPercent:50}),
        '44': commonPreset('44','44 Club','Adds 3× & 4× families',44,{mode:'mixed',tables:[2,3,4,5,10],factorMin:1,factorMax:12,multiplyPercent:50}),
        '55': commonPreset('55','55 Club','Adds 8× family',55,{mode:'mixed',tables:[2,3,4,5,8,10],factorMin:1,factorMax:12,multiplyPercent:50}),
        '66': commonPreset('66','66 Club','Adds 9× family',66,{mode:'mixed',tables:[2,3,4,5,8,9,10],factorMin:1,factorMax:12,multiplyPercent:50}),
        '77': commonPreset('77','77 Club','Adds 6× family',77,{mode:'mixed',tables:[2,3,4,5,6,8,9,10],factorMin:1,factorMax:12,multiplyPercent:50}),
        '88': commonPreset('88','88 Club','Adds 7× family',88,{mode:'mixed',tables:[2,3,4,5,6,7,8,9,10],factorMin:1,factorMax:12,multiplyPercent:50}),
        '99': commonPreset('99','99 Club','All × and ÷ facts to 12×12',99,{mode:'mixed',tables:[2,3,4,5,6,7,8,9,10,11,12],factorMin:1,factorMax:12,multiplyPercent:50})
      }
    }
  };


  // Text-only primary-maths topic map. `years` is the main National Curriculum year span
  // in England; it is used only for optional Custom Worksheets Year starting selections, not to gate teachers.
  // Graph/diagram-dependent objectives are intentionally left for a later visual-question layer.
  const FAMILY_META = {
    addition:{label:'addition',strand:'Calculation',years:[1,2,3,4,5,6]},
    subtraction:{label:'subtraction',strand:'Calculation',years:[1,2,3,4,5,6]},
    multiply:{label:'multiplication facts',strand:'Calculation',years:[2,3,4,5,6]},
    divide:{label:'division facts',strand:'Calculation',years:[2,3,4,5,6]},
    missing_number:{label:'missing ×/÷ numbers',strand:'Calculation',years:[2,3,4,5,6]},
    square:{label:'square numbers',strand:'Number properties',years:[5,6]},
    square_root:{label:'square roots (extension)',strand:'Extension',years:[],extension:true},
    cube:{label:'cube numbers',strand:'Number properties',years:[5,6]},
    bodmas:{label:'order of operations',strand:'Calculation',years:[6]},
    scaled_multiply:{label:'scaled multiplication',strand:'Calculation',years:[4,5,6]},
    scaled_divide:{label:'scaled division',strand:'Calculation',years:[4,5,6]},
    fraction_of:{label:'fractions of quantities',strand:'Fractions',years:[1,2,3,4,5,6]},
    percentage_of:{label:'percentages of quantities',strand:'Decimals & percentages',years:[5,6]},
    negative_numbers:{label:'negative numbers',strand:'Number & place value',years:[4,5,6]},
    roman_numerals:{label:'Roman numerals',strand:'Number & place value',years:[3,4,5]},
    angle_facts:{label:'right/straight/full-turn angle facts',strand:'Geometry',years:[3,4,5,6]},
    simple_algebra:{label:'simple algebra / missing values',strand:'Algebra',years:[6]},

    double:{label:'doubles',strand:'Calculation',years:[1,2]},
    repeated_addition:{label:'repeated addition',strand:'Calculation',years:[1,2,3]},
    number_words:{label:'numbers in words',strand:'Number & place value',years:[1,2,3,4,5,6]},
    place_value:{label:'digit place value',strand:'Number & place value',years:[1,2,3,4,5,6]},
    compare_numbers:{label:'compare whole numbers (< > =)',strand:'Number & place value',years:[1,2,3,4,5,6]},
    rounding_whole:{label:'round whole numbers',strand:'Number & place value',years:[3,4,5,6]},
    number_sequences:{label:'number sequences / counting',strand:'Number & place value',years:[1,2,3,4,5,6]},
    odd_even:{label:'odd and even numbers',strand:'Number properties',years:[2,3,4,5,6]},
    factor_check:{label:'factors',strand:'Number properties',years:[4,5,6]},
    multiple_check:{label:'multiples',strand:'Number properties',years:[4,5,6]},
    prime_numbers:{label:'prime numbers',strand:'Number properties',years:[5,6]},
    add_sub_missing:{label:'missing +/− numbers',strand:'Calculation',years:[1,2,3,4,5,6]},
    multidigit_multiply:{label:'multi-digit multiplication',strand:'Calculation',years:[4,5,6]},
    division_remainders:{label:'multi-digit division / remainders',strand:'Calculation',years:[4,5,6]},

    equivalent_fractions:{label:'equivalent fractions',strand:'Fractions',years:[2,3,4,5,6]},
    simplify_fractions:{label:'simplify fractions',strand:'Fractions',years:[6]},
    fraction_compare:{label:'compare fractions',strand:'Fractions',years:[3,4,5,6]},
    mixed_improper:{label:'mixed ↔ improper fractions',strand:'Fractions',years:[5,6]},
    fraction_add_subtract:{label:'add / subtract fractions',strand:'Fractions',years:[3,4,5,6]},
    fraction_multiply_whole:{label:'fraction × whole number',strand:'Fractions',years:[5,6]},
    fraction_multiply:{label:'fraction × fraction',strand:'Fractions',years:[6]},
    fraction_divide_whole:{label:'fraction ÷ whole number',strand:'Fractions',years:[6]},

    decimal_place_value:{label:'decimal place value',strand:'Decimals & percentages',years:[4,5,6]},
    decimal_compare:{label:'compare decimals',strand:'Decimals & percentages',years:[4,5,6]},
    decimal_rounding:{label:'round decimals',strand:'Decimals & percentages',years:[4,5,6]},
    decimal_scale:{label:'decimals ×/÷ 10, 100, 1000',strand:'Decimals & percentages',years:[4,5,6]},
    decimal_add_subtract:{label:'decimal addition / subtraction',strand:'Decimals & percentages',years:[4,5,6]},
    decimal_multiply:{label:'decimal × whole number',strand:'Decimals & percentages',years:[6]},
    decimal_divide:{label:'decimal ÷ whole number',strand:'Decimals & percentages',years:[6]},
    fraction_decimal_percent:{label:'fraction ↔ decimal ↔ percentage',strand:'Decimals & percentages',years:[4,5,6]},

    ratio_missing:{label:'equivalent ratios / missing values',strand:'Ratio & proportion',years:[6]},
    ratio_share:{label:'share in a ratio',strand:'Ratio & proportion',years:[6]},
    scale_factor:{label:'scale-factor problems',strand:'Ratio & proportion',years:[6]},

    metric_conversion:{label:'metric unit conversions',strand:'Measurement',years:[3,4,5,6]},
    time_conversion:{label:'time-unit conversions',strand:'Measurement',years:[2,3,4,5,6]},
    time_duration:{label:'time durations',strand:'Measurement',years:[2,3,4,5,6]},
    money:{label:'money / change',strand:'Measurement',years:[1,2,3,4,5,6]},
    perimeter:{label:'perimeter from dimensions',strand:'Measurement',years:[3,4,5,6]},
    area:{label:'area from dimensions',strand:'Measurement',years:[4,5,6]},
    volume:{label:'cuboid volume',strand:'Measurement',years:[6]},

    angle_sums:{label:'triangle / quadrilateral angle sums',strand:'Geometry',years:[6]},
    shape_properties:{label:'shape properties (text)',strand:'Geometry',years:[1,2,3,4,5,6]},
    coordinates:{label:'coordinate translations',strand:'Geometry',years:[4,5,6]},

    formula_substitution:{label:'formula substitution',strand:'Algebra',years:[6]},
    equation_pairs:{label:'pairs satisfying equations',strand:'Algebra',years:[6]},

    mean:{label:'mean average',strand:'Statistics',years:[6]},
    pie_chart_angles:{label:'pie-chart angle calculations',strand:'Statistics',years:[6]},

    more_less:{label:'more / less from a number',strand:'Number & place value',years:[1,2,3,4]},
    partition_number:{label:'partition numbers by place value',strand:'Number & place value',years:[2,3,4]},
    rounding_custom:{label:'round to non-standard multiples (extension)',strand:'Extension',years:[],extension:true},
    factor_pairs:{label:'factor pairs',strand:'Number properties',years:[4,5,6]},
    common_factors:{label:'common factors',strand:'Number properties',years:[5,6]},
    common_multiples:{label:'common multiples',strand:'Number properties',years:[6]},
    multidigit_add_subtract:{label:'large-number addition / subtraction',strand:'Calculation',years:[3,4,5,6]},
    estimate_calculation:{label:'estimate calculations by rounding',strand:'Calculation',years:[3,4,5,6]},
    word_problems:{label:'short calculation word problems (retired)',strand:'Calculation',years:[],retired:true},
    fraction_sequences:{label:'fraction sequences',strand:'Fractions',years:[2,3,4,5]},
    decimal_to_fraction:{label:'decimal → fraction by place value',strand:'Decimals & percentages',years:[5,6]},
    fraction_to_decimal:{label:'fraction → decimal',strand:'Decimals & percentages',years:[6]},
    percentage_compare:{label:'compare percentage quantities',strand:'Decimals & percentages',years:[6]},
    unit_rate:{label:'simple rates / unit rates',strand:'Ratio & proportion',years:[5,6]},
    measure_compare:{label:'compare measures',strand:'Measurement',years:[1,2,3,4,5,6]},
    calendar_facts:{label:'calendar facts',strand:'Measurement',years:[1,2,3]},
    time_12_24:{label:'12-hour ↔ 24-hour time',strand:'Measurement',years:[3,4,5,6]},
    imperial_conversion:{label:'approximate metric / imperial conversions',strand:'Measurement',years:[5,6]},
    temperature_interval:{label:'temperature intervals across zero',strand:'Measurement',years:[6]},
    triangle_area:{label:'triangle area from dimensions',strand:'Measurement',years:[6]},
    parallelogram_area:{label:'parallelogram area from dimensions',strand:'Measurement',years:[6]},
    missing_measure:{label:'missing length from area / perimeter',strand:'Measurement',years:[5,6]},
    line_properties:{label:'parallel / perpendicular / line facts',strand:'Geometry',years:[3,4,5,6]},
    angle_relationships:{label:'angles at a point / line / opposite',strand:'Geometry',years:[5,6]},
    circle_properties:{label:'circle radius / diameter facts',strand:'Geometry',years:[6]},
    data_table_questions:{label:'retired statistics placeholder',strand:'Statistics',years:[],retired:true},

    // Additional text-only families needed to cover statutory objectives that do not require diagrams.
    // Keep these appended so older compact recreation family indices remain stable.
    number_bonds:{label:'number bonds / complements',strand:'Calculation',years:[1,2,3]},
    three_addends:{label:'add three one-digit numbers',strand:'Calculation',years:[2]},
    fact_families:{label:'commutativity & inverse facts',strand:'Calculation',years:[2,3,4,5,6]},
    distributive_law:{label:'distributive law / mental multiplication',strand:'Calculation',years:[4,5,6]},
    correspondence:{label:'grouping, scaling & correspondence',strand:'Calculation',years:[1,2,3,4]},
    long_division:{label:'division by two-digit divisors',strand:'Calculation',years:[6]},
    powers_of_10:{label:'multiply / divide by powers of 10',strand:'Number & place value',years:[5,6]},
    unit_choice:{label:'choose appropriate measurement units',strand:'Measurement',years:[1,2,3,4,5,6]},
    time_words:{label:'time words ↔ digital time',strand:'Measurement',years:[1,2,3,4]},
    position_language:{label:'position vocabulary',strand:'Geometry',years:[1]},
    turns_direction:{label:'turns & direction vocabulary',strand:'Geometry',years:[1,2]},
    angle_classification:{label:'classify angles',strand:'Geometry',years:[3,4,5,6]},
    algebra_sequences:{label:'linear number sequences',strand:'Algebra',years:[6]},
    fraction_division_decimal:{label:'fractions as division / rounded decimals',strand:'Decimals & percentages',years:[6]},
    area_perimeter_relationships:{label:'area & perimeter relationships',strand:'Measurement',years:[6]},
    coordinate_reflection:{label:'coordinate reflections (text)',strand:'Geometry',years:[5,6]},
    time_language:{label:'time order & duration language',strand:'Measurement',years:[1,2]}
  };
  const FAMILY_LABELS = Object.fromEntries(Object.entries(FAMILY_META).map(([id,m]) => [id,m.label]));
  // Keep the historical prefix stable: compact QR/recreation codes use this ordering indirectly.
  const LEGACY_FAMILY_ORDER = ['addition','subtraction','multiply','divide','missing_number','square','square_root','cube','bodmas','scaled_multiply','scaled_divide','fraction_of','percentage_of','negative_numbers','roman_numerals','angle_facts','simple_algebra'];
  const FAMILY_COMPACT_ORDER = LEGACY_FAMILY_ORDER.concat(Object.keys(FAMILY_META).filter(id => !LEGACY_FAMILY_ORDER.includes(id)));
  // Active public catalogue. Retired families remain in FAMILY_COMPACT_ORDER only so
  // older compact recreation recipes keep stable family indices.
  const FAMILY_ORDER = FAMILY_COMPACT_ORDER.filter(id => !FAMILY_META[id]?.retired);


  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rngFromSeed(seed) {
    let a = hashString(String(seed)) || 0x6d2b79f5;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(array, rng) {
    const out = array.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function randomCode(length = 5) {
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let out = '';
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      for (const b of bytes) out += alphabet[b % alphabet.length];
      return out;
    }
    const seed = String(Date.now()) + ':' + String(Math.random());
    const rng = rngFromSeed(seed);
    for (let i = 0; i < length; i += 1) out += alphabet[Math.floor(rng() * alphabet.length)];
    return out;
  }

  function newSeed(clubId) { return `${clubId}-${randomCode(5)}`; }

  function normalizeRules(input) {
    const r = clone(input || {});
    r.questionCount = clampInt(r.questionCount, 1, 200, 33);
    r.timeMinutes = clampNumber(r.timeMinutes, 0.25, 60, 5);
    r.perfectAttempts = clampInt(r.perfectAttempts, 1, 10, 2);
    r.consecutivePerfectAttempts = r.consecutivePerfectAttempts !== false;
    r.unaided = r.unaided !== false;
    r.avoidExactDuplicates = r.avoidExactDuplicates !== false;
    r.avoidReversedDuplicates = !!r.avoidReversedDuplicates;
    r.mode = ['double', 'repeated_addition', 'multiply', 'divide', 'mixed', 'addition', 'add_subtract', 'missing_number', 'family_mix'].includes(r.mode) ? r.mode : 'multiply';
    r.numberMin = clampInt(r.numberMin, 0, 100, 1);
    r.numberMax = clampInt(r.numberMax, r.numberMin, 100, Math.max(10, r.numberMin));
    r.addendMin = clampInt(r.addendMin, 0, 100, 1);
    r.addendMax = clampInt(r.addendMax, r.addendMin, 100, Math.max(10, r.addendMin));
    r.repeatsMin = clampInt(r.repeatsMin, 2, 20, 2);
    r.repeatsMax = clampInt(r.repeatsMax, r.repeatsMin, 20, Math.max(7, r.repeatsMin));
    r.factorMin = clampInt(r.factorMin, 0, 100, 1);
    r.factorMax = clampInt(r.factorMax, r.factorMin, 100, Math.max(12, r.factorMin));
    r.multiplyPercent = clampInt(r.multiplyPercent, 0, 100, 50);
    r.tables = Array.isArray(r.tables) ? [...new Set(r.tables.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 100))].sort((a,b)=>a-b) : range(1, 12);
    if (!r.tables.length && ['multiply', 'divide', 'mixed', 'missing_number', 'family_mix'].includes(r.mode)) r.tables = range(1, 12);
    r.arithmeticMin = clampInt(r.arithmeticMin, -1000, 1000, 0);
    r.arithmeticMax = clampInt(r.arithmeticMax, Math.max(1, r.arithmeticMin), 5000, 100);
    r.arithmeticOperandMax = clampInt(r.arithmeticOperandMax, 1, 5000, Math.min(100, r.arithmeticMax));
    r.arithmeticOperandMin = clampInt(r.arithmeticOperandMin, 0, r.arithmeticOperandMax, 0);
    r.allowNegativeAnswers = !!r.allowNegativeAnswers;
    r.squareMin = clampInt(r.squareMin, 0, 50, 1);
    r.squareMax = clampInt(r.squareMax, r.squareMin, 50, Math.max(12, r.squareMin));
    r.cubeMin = clampInt(r.cubeMin, 0, 20, 1);
    r.cubeMax = clampInt(r.cubeMax, r.cubeMin, 20, Math.max(10, r.cubeMin));
    r.bodmasMax = clampInt(r.bodmasMax, 2, 30, 12);
    r.bodmasOperations = normalizeStringList(r.bodmasOperations, ['add','subtract','multiply','divide'], ['add','subtract','multiply','divide']);
    if (r.bodmasOperations.length < 2) r.bodmasOperations = ['add','multiply'];
    r.bodmasUseBrackets = r.bodmasUseBrackets !== false;
    r.missingNumberOperations = normalizeStringList(r.missingNumberOperations, ['multiply','divide'], ['multiply','divide']);
    r.missingNumberPositions = normalizeStringList(r.missingNumberPositions, ['multiply_second','multiply_first','divide_divisor','divide_dividend'], ['multiply_first','multiply_second','multiply_result','divide_dividend','divide_divisor','divide_result']);
    const compatibleMissing = r.missingNumberPositions.filter(pos => (pos.startsWith('multiply_') && r.missingNumberOperations.includes('multiply')) || (pos.startsWith('divide_') && r.missingNumberOperations.includes('divide')));
    if (compatibleMissing.length) r.missingNumberPositions = compatibleMissing;
    else r.missingNumberPositions = r.missingNumberOperations.includes('multiply') ? ['multiply_second','multiply_first'] : ['divide_divisor','divide_dividend'];
    r.fractionDenominators = normalizeNumberList(r.fractionDenominators, [2,3,4,5,10], 2, 100);
    r.fractionQuantityMin = clampInt(r.fractionQuantityMin, 1, 5000, 1);
    r.fractionQuantityMax = clampInt(r.fractionQuantityMax, r.fractionQuantityMin, 5000, Math.max(500, r.fractionQuantityMin));
    r.percentageChoices = normalizeNumberList(r.percentageChoices, [10,20,25,50,75], 1, 100);
    r.percentageQuantityMin = clampInt(r.percentageQuantityMin, 10, 5000, 20);
    r.percentageQuantityMax = clampInt(r.percentageQuantityMax, r.percentageQuantityMin, 5000, Math.max(500, r.percentageQuantityMin));
    r.scaledBaseMin = clampInt(r.scaledBaseMin, 0, 100, r.factorMin);
    r.scaledBaseMax = clampInt(r.scaledBaseMax, r.scaledBaseMin, 100, r.factorMax);
    r.scaledMultipliers = normalizeNumberList(r.scaledMultipliers, [10,100], 10, 1000);
    r.romanMax = clampInt(r.romanMax, 1, 3999, Math.min(100, r.arithmeticMax));
    r.algebraUnknownMax = clampInt(r.algebraUnknownMax, 1, 100, Math.min(20, r.arithmeticOperandMax));
    r.algebraCoefficientMax = clampInt(r.algebraCoefficientMax, 2, 50, Math.min(12, r.factorMax));
    r.angleTotals = normalizeNumberList(r.angleTotals, [90,180,360], 1, 360);
    const requestedFamilies = Array.isArray(r.families) ? r.families.map(String) : [];
    const hasAnyFamily = (...ids) => ids.some(id => requestedFamilies.includes(id));
    if (r.id === 'worksheet' || Object.prototype.hasOwnProperty.call(r,'progressionEnabled')) r.progressionEnabled = r.progressionEnabled !== false;
    if (r.id === 'worksheet' || Object.prototype.hasOwnProperty.call(r,'timeEnabled')) r.timeEnabled = r.timeEnabled !== false;
    if (r.id === 'worksheet' || Object.prototype.hasOwnProperty.call(r,'worksheetTitle')) r.worksheetTitle = String(r.worksheetTitle || 'Maths Practice').trim().slice(0,60) || 'Maths Practice';
    if (r.id === 'worksheet' || Object.prototype.hasOwnProperty.call(r,'curriculumYear')) r.curriculumYear = clampInt(r.curriculumYear, 0, 6, 0);
    if (hasAnyFamily('number_words','place_value','compare_numbers','rounding_whole','rounding_custom','number_sequences','more_less','partition_number','odd_even','factor_check','multiple_check','factor_pairs','common_factors','common_multiples','prime_numbers','add_sub_missing','multidigit_add_subtract','multidigit_multiply','division_remainders','estimate_calculation','number_bonds','three_addends','fact_families','distributive_law','correspondence','long_division','powers_of_10'))
      r.wholeNumberMax = clampInt(r.wholeNumberMax, 20, 10000000, 1000);
    if (hasAnyFamily('decimal_place_value','decimal_compare','decimal_rounding','decimal_scale','decimal_add_subtract','decimal_multiply','decimal_divide','fraction_decimal_percent','decimal_to_fraction','fraction_to_decimal','percentage_compare','fraction_division_decimal')) {
      r.decimalPlacesMax = clampInt(r.decimalPlacesMax, 1, 3, 2);
      r.decimalWholeMax = clampInt(r.decimalWholeMax, 1, 10000, 100);
    }
    if (hasAnyFamily('ratio_missing','ratio_share','scale_factor','unit_rate')) {
      r.ratioPartMax = clampInt(r.ratioPartMax, 2, 30, 8);
      r.ratioQuantityMax = clampInt(r.ratioQuantityMax, 10, 5000, 120);
    }
    if (hasAnyFamily('coordinates','coordinate_reflection')) { r.coordinateMax = clampInt(r.coordinateMax, 4, 100, 12); r.coordinateFourQuadrants = !!r.coordinateFourQuadrants; }
    if (hasAnyFamily('mean')) r.statsValueMax = clampInt(r.statsValueMax, 5, 1000, 30);
    const validFamilies = FAMILY_ORDER;
    const blankFamilyMixAllowed = r.id === 'worksheet' || r.progressionEnabled === false;
    r.families = Array.isArray(r.families) ? [...new Set(r.families.filter(f => validFamilies.includes(f)))] : (blankFamilyMixAllowed ? [] : ['addition','subtraction','multiply','divide']);
    if (!r.families.length && r.mode === 'family_mix' && !blankFamilyMixAllowed) r.families = ['addition','subtraction','multiply','divide'];
    const weights = r.familyWeights && typeof r.familyWeights === 'object' ? r.familyWeights : {};
    r.familyWeights = Object.fromEntries(r.families.map(f => [f, clampInt(weights[f], 1, 20, 1)]));
    return r;
  }

  function clampInt(v, min, max, fallback) {
    const n = Number.parseInt(v, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }
  function clampNumber(v, min, max, fallback) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function normalizeNumberList(value, fallback, min, max) {
    const source = Array.isArray(value) ? value : fallback;
    const out = [...new Set(source.map(Number).filter(n => Number.isInteger(n) && n >= min && n <= max))].sort((a,b)=>a-b);
    return out.length ? out : fallback.slice();
  }

  function normalizeStringList(value, fallback, allowed) {
    const source = Array.isArray(value) ? value : fallback;
    const valid = new Set(allowed);
    const out = [...new Set(source.map(String).filter(v => valid.has(v)))];
    return out.length ? out : fallback.slice();
  }


  function intText(n) {
    const sign = Number(n) < 0 ? '-' : '';
    const raw = String(Math.abs(Math.trunc(Number(n) || 0)));
    return sign + raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function gcd(a,b){a=Math.abs(Math.trunc(a));b=Math.abs(Math.trunc(b));while(b){const t=a%b;a=b;b=t;}return a||1;}
  function lcm(a,b){return Math.abs(a*b)/gcd(a,b);}
  function fractionText(n,d){
    if(d===0)return '';
    const sign=(n<0)!==(d<0)?-1:1;n=Math.abs(n);d=Math.abs(d);const g=gcd(n,d);n/=g;d/=g;n*=sign;
    return d===1?String(n):`${n}/${d}`;
  }
  function mixedText(n,d){
    const sign=n<0?'-':'';n=Math.abs(n);d=Math.abs(d);const whole=Math.floor(n/d),rem=n%d;
    if(!rem)return sign+String(whole);
    if(!whole)return sign+fractionText(rem,d);
    return `${sign}${whole} ${fractionText(rem,d)}`;
  }
  function pow10(p){return Math.pow(10,Math.max(0,Math.trunc(p)));}
  function decimalTextFromScaled(value,places,trim=true){
    const scale=pow10(places),sign=value<0?'-':'',abs=Math.abs(Math.trunc(value));
    const whole=Math.floor(abs/scale), frac=String(abs%scale).padStart(places,'0');
    if(!places)return sign+String(whole);
    const f=trim?frac.replace(/0+$/,''):frac;
    return f?`${sign}${whole}.${f}`:`${sign}${whole}`;
  }
  function decimalText(value,maxPlaces=3){
    const n=Number(value);if(!Number.isFinite(n))return String(value);
    return n.toFixed(maxPlaces).replace(/\.0+$|(?<=\.[0-9]*?)0+$/g,'').replace(/\.$/,'');
  }
  function sampleWholeNumbers(max){
    const limit=Math.max(20,Math.trunc(max||1000)),set=new Set();
    for(let n=0;n<=Math.min(limit,250);n++)set.add(n);
    for(let n=275;n<=Math.min(limit,5000);n+=37)set.add(n);
    const templates=[1024,1357,2048,3175,4096,5023,6789,7504,8642,9901,12034,20507,34816,50703,65432,90105,123456,205704,430812,654321,900105,1234567,2050704,4308126,7654321,9000105];
    templates.forEach(n=>{if(n<=limit)set.add(n);});
    return [...set].sort((a,b)=>a-b);
  }
  function numberToWordsUnder1000(n){
    const ones=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
    const tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
    n=Math.trunc(n);if(n<20)return ones[n];if(n<100)return tens[Math.floor(n/10)]+(n%10?`-${ones[n%10]}`:'');
    return `${ones[Math.floor(n/100)]} hundred${n%100?` and ${numberToWordsUnder1000(n%100)}`:''}`;
  }
  function numberToWords(n){
    n=Math.max(0,Math.min(10000000,Math.trunc(Number(n)||0)));
    if(n<1000)return numberToWordsUnder1000(n);
    if(n<1000000){const th=Math.floor(n/1000),rem=n%1000;return `${numberToWordsUnder1000(th)} thousand${rem?(rem<100?' and ':' ')+numberToWordsUnder1000(rem):''}`;}
    const mil=Math.floor(n/1000000),rem=n%1000000;
    return `${numberToWordsUnder1000(mil)} million${rem?(rem<100?' and ':' ')+numberToWords(rem):''}`;
  }
  function isPrime(n){if(n<2)return false;if(n%2===0)return n===2;for(let d=3;d*d<=n;d+=2)if(n%d===0)return false;return true;}
  function nextPrime(n){let x=n+1;while(!isPrime(x))x++;return x;}

  function buildDoublePool(rules) {
    return range(rules.numberMin, rules.numberMax).map(n => ({
      kind: 'double', a: n, b: n, prompt: `${n} + ${n} =`, answer: n + n,
      key: `d:${n}`
    }));
  }

  function buildRepeatedPool(rules) {
    const out = [];
    for (let n = rules.addendMin; n <= rules.addendMax; n += 1) {
      for (let count = rules.repeatsMin; count <= rules.repeatsMax; count += 1) {
        out.push({
          kind: 'repeated_addition', a: n, count,
          prompt: `${Array(count).fill(n).join(' + ')} =`,
          answer: n * count, key: `r:${n}:${count}`, group: n
        });
      }
    }
    return out;
  }

  function buildMultiplyPool(rules) {
    const out = [];
    for (const table of rules.tables) {
      for (let factor = rules.factorMin; factor <= rules.factorMax; factor += 1) {
        out.push({
          kind: 'multiply', a: table, b: factor,
          prompt: `${table} × ${factor} =`, answer: table * factor,
          key: `m:${table}:${factor}`,
          reverseKey: `m:${Math.min(table, factor)}:${Math.max(table, factor)}`,
          group: table
        });
      }
    }
    return out;
  }

  function buildDividePool(rules) {
    const out = [];
    for (const divisor of rules.tables.filter(t => t !== 0)) {
      for (let quotient = Math.max(0, rules.factorMin); quotient <= rules.factorMax; quotient += 1) {
        const dividend = divisor * quotient;
        out.push({
          kind: 'divide', a: dividend, b: divisor,
          prompt: `${dividend} ÷ ${divisor} =`, answer: quotient,
          key: `v:${dividend}:${divisor}`,
          reverseKey: `v:${divisor}:${quotient}`,
          group: divisor
        });
      }
    }
    return out;
  }


  function sampledArithmeticValues(min,max){
    min=Math.max(0,Math.trunc(min||0));max=Math.max(min,Math.trunc(max||0));
    if(max-min<=260)return range(min,max);
    const set=new Set();
    for(let n=min;n<=Math.min(max,min+120);n++)set.add(n);
    const span=max-min,step=Math.max(7,Math.floor(span/180));
    for(let n=min;n<=max;n+=step)set.add(n);
    [10,20,25,50,75,100,125,150,200,250,500,750,1000,1250,1500,2000,2500,3000,4000,5000].forEach(n=>{if(n>=min&&n<=max)set.add(n);});
    return [...set].sort((a,b)=>a-b);
  }
  function buildAdditionPool(rules) {
    const out = [];
    const maxOperand = Math.min(rules.arithmeticOperandMax, rules.arithmeticMax);
    const minOperand = Math.max(0, rules.arithmeticOperandMin || 0);
    // Preserve the historical exhaustive pool for named Club challenges. Flexible worksheets can
    // use very large ranges, so sample them deterministically instead of allocating millions of pairs.
    if(rules.progressionEnabled===false){
      const vals=sampledArithmeticValues(minOperand,maxOperand),len=vals.length;
      for(let i=0;i<len;i++)for(let j=0;j<Math.min(8,len);j++){
        const a=vals[i],b=vals[(i*7+j*13)%len];if(a===0&&b===0||a+b>rules.arithmeticMax)continue;
        out.push({kind:'addition',a,b,prompt:`${intText(a)} + ${intText(b)} =`,answer:a+b,key:`a:${a}:${b}`});
      }
      return out;
    }
    for (let a = Math.max(0, rules.arithmeticMin, minOperand); a <= maxOperand; a += 1) {
      const bMax = Math.min(maxOperand, rules.arithmeticMax - a);
      for (let b = minOperand; b <= bMax; b += 1) {
        if (a === 0 && b === 0) continue;
        out.push({ kind:'addition', a, b, prompt:`${a} + ${b} =`, answer:a+b, key:`a:${a}:${b}` });
      }
    }
    return out;
  }

  function buildSubtractionPool(rules) {
    const out = [];
    const maxOperand = Math.min(rules.arithmeticOperandMax, rules.arithmeticMax);
    const minOperand = Math.max(0, rules.arithmeticOperandMin || 0);
    if(rules.progressionEnabled===false){
      const vals=sampledArithmeticValues(minOperand,maxOperand),len=vals.length;
      for(let i=0;i<len;i++)for(let j=0;j<Math.min(8,len);j++){
        let a=vals[i],b=vals[(i*11+j*17)%len];
        if(!rules.allowNegativeAnswers&&b>a)[a,b]=[b,a];
        const answer=a-b;if(!rules.allowNegativeAnswers&&answer<0)continue;
        out.push({kind:'subtraction',a,b,prompt:`${intText(a)} - ${intText(b)} =`,answer,key:`s:${a}:${b}`});
      }
      return out;
    }
    for (let a = Math.max(1, minOperand); a <= maxOperand; a += 1) {
      const bStart = minOperand;
      const bMax = rules.allowNegativeAnswers ? maxOperand : a;
      for (let b = bStart; b <= bMax; b += 1) {
        const answer = a - b;
        if (!rules.allowNegativeAnswers && answer < 0) continue;
        out.push({ kind:'subtraction', a, b, prompt:`${a} - ${b} =`, answer, key:`s:${a}:${b}` });
      }
    }
    return out;
  }

  function buildMissingNumberPool(rules) {
    const out = [];
    const operations = new Set(rules.missingNumberOperations || ['multiply','divide']);
    const positions = new Set(rules.missingNumberPositions || ['multiply_second','multiply_first','divide_divisor','divide_dividend']);
    for (const table of rules.tables.filter(t => t !== 0)) {
      for (let factor = Math.max(0, rules.factorMin); factor <= rules.factorMax; factor += 1) {
        const product = table * factor;
        // Keep the historical order of the four default patterns so v1.2
        // fixed-seed worksheets remain unchanged when the new controls are untouched.
        if (operations.has('multiply') && positions.has('multiply_second'))
          out.push({ kind:'missing_number', prompt:`${table} × ___ = ${product}`, answer:factor, key:`mn:m:r:${table}:${factor}`, group:table });
        if (operations.has('multiply') && positions.has('multiply_first'))
          out.push({ kind:'missing_number', prompt:`___ × ${factor} = ${product}`, answer:table, key:`mn:m:l:${table}:${factor}`, group:table });
        if (operations.has('divide') && positions.has('divide_divisor') && factor !== 0)
          out.push({ kind:'missing_number', prompt:`${product} ÷ ___ = ${factor}`, answer:table, key:`mn:d:d:${table}:${factor}`, group:table });
        if (operations.has('divide') && positions.has('divide_dividend'))
          out.push({ kind:'missing_number', prompt:`___ ÷ ${table} = ${factor}`, answer:product, key:`mn:d:n:${table}:${factor}`, group:table });
        if (operations.has('multiply') && positions.has('multiply_result'))
          out.push({ kind:'missing_number', prompt:`${table} × ${factor} = ___`, answer:product, key:`mn:m:a:${table}:${factor}`, group:table });
        if (operations.has('divide') && positions.has('divide_result'))
          out.push({ kind:'missing_number', prompt:`${product} ÷ ${table} = ___`, answer:factor, key:`mn:d:a:${table}:${factor}`, group:table });
      }
    }
    return out;
  }

  function buildSquarePool(rules) {
    return range(rules.squareMin, rules.squareMax).map(n => ({ kind:'square', prompt:`${n}² =`, answer:n*n, key:`sq:${n}` }));
  }

  function buildSquareRootPool(rules) {
    return range(rules.squareMin, rules.squareMax).map(n => ({ kind:'square_root', prompt:`√${n*n} =`, answer:n, key:`sr:${n}` }));
  }

  function buildCubePool(rules) {
    return range(rules.cubeMin, rules.cubeMax).map(n => ({ kind:'cube', prompt:`${n}³ =`, answer:n*n*n, key:`cu:${n}` }));
  }

  function buildBodmasPool(rules) {
    const out = [], m = rules.bodmasMax;
    const ops = new Set(rules.bodmasOperations || ['add','subtract','multiply','divide']);
    const brackets = rules.bodmasUseBrackets !== false;
    const legacyDefault = brackets && ['add','subtract','multiply','divide'].every(x=>ops.has(x)) && ops.size===4;
    for (let a = 2; a <= m; a += 1) {
      for (let b = 2; b <= m; b += 1) {
        const c = ((a + b) % Math.max(2, m - 1)) + 2;
        if (legacyDefault) {
          // Historical v1.2 order retained byte-for-byte for default presets.
          out.push({ kind:'bodmas', prompt:`${a} + ${b} × ${c} =`, answer:a+b*c, key:`bo:1:${a}:${b}:${c}` });
          out.push({ kind:'bodmas', prompt:`${a} × (${b} + ${c}) =`, answer:a*(b+c), key:`bo:2:${a}:${b}:${c}` });
          out.push({ kind:'bodmas', prompt:`(${a} + ${b}) × ${c} =`, answer:(a+b)*c, key:`bo:3:${a}:${b}:${c}` });
          out.push({ kind:'bodmas', prompt:`${a*b} ÷ ${b} + ${c} =`, answer:a+c, key:`bo:4:${a}:${b}:${c}` });
          if (a*b > c) out.push({ kind:'bodmas', prompt:`${a*b} - (${b} + ${c}) =`, answer:a*b-b-c, key:`bo:5:${a}:${b}:${c}` });
          continue;
        }
        if (ops.has('add') && ops.has('multiply')) {
          out.push({ kind:'bodmas', prompt:`${a} + ${b} × ${c} =`, answer:a+b*c, key:`box:am:${a}:${b}:${c}` });
          if (brackets) out.push({ kind:'bodmas', prompt:`${a} × (${b} + ${c}) =`, answer:a*(b+c), key:`box:amb:${a}:${b}:${c}` });
        }
        if (ops.has('subtract') && ops.has('multiply') && a*b >= c) {
          out.push({ kind:'bodmas', prompt:`${a} × ${b} - ${c} =`, answer:a*b-c, key:`box:sm:${a}:${b}:${c}` });
          if (brackets && b < c) out.push({ kind:'bodmas', prompt:`${a} × (${c} - ${b}) =`, answer:a*(c-b), key:`box:smb:${a}:${b}:${c}` });
        }
        if (ops.has('add') && ops.has('divide'))
          out.push({ kind:'bodmas', prompt:`${a*b} ÷ ${b} + ${c} =`, answer:a+c, key:`box:ad:${a}:${b}:${c}` });
        if (ops.has('subtract') && ops.has('divide') && a >= c)
          out.push({ kind:'bodmas', prompt:`${a*b} ÷ ${b} - ${c} =`, answer:a-c, key:`box:sd:${a}:${b}:${c}` });
        if (ops.has('multiply') && ops.has('divide'))
          out.push({ kind:'bodmas', prompt:`${a*c} × ${b} ÷ ${c} =`, answer:a*b, key:`box:md:${a}:${b}:${c}` });
        if (ops.has('add') && ops.has('subtract')) {
          out.push({ kind:'bodmas', prompt:`${a} + ${b} - ${c} =`, answer:a+b-c, key:`box:as:${a}:${b}:${c}` });
          if (brackets) out.push({ kind:'bodmas', prompt:`(${a} + ${b}) - ${c} =`, answer:a+b-c, key:`box:asb:${a}:${b}:${c}` });
        }
      }
    }
    return out;
  }

  function buildScaledMultiplyPool(rules) {
    const out = [];
    const bases = range(Math.max(2, rules.scaledBaseMin), rules.scaledBaseMax);
    const scales = rules.scaledMultipliers || [10,100];
    const legacyDefault = scales.length === 2 && scales[0] === 10 && scales[1] === 100;
    for (const a of bases) for (const b of bases) for (const sa of scales) {
      out.push({ kind:'scaled_multiply', prompt:`${a*sa} × ${b} =`, answer:a*sa*b, key:`sm:1:${a}:${sa}:${b}` });
      // Preserve the historical default pool exactly for v1.2. When a teacher
      // deliberately changes the scale choices, make this second pattern honour
      // the selected scale too.
      const bothScale = legacyDefault ? 10 : sa;
      out.push({ kind:'scaled_multiply', prompt:`${a*bothScale} × ${b*bothScale} =`, answer:a*b*bothScale*bothScale, key:legacyDefault?`sm:2:${a}:${b}`:`sm:2:${a}:${b}:${bothScale}` });
    }
    return out;
  }

  function buildScaledDividePool(rules) {
    const out = [];
    const bases = range(Math.max(2, rules.scaledBaseMin), rules.scaledBaseMax);
    for (const divisor of bases) for (const quotient of bases) {
      for (const scale of (rules.scaledMultipliers || [10,100])) {
        const dividend = divisor * quotient * scale;
        out.push({ kind:'scaled_divide', prompt:`${dividend} ÷ ${divisor} =`, answer:quotient*scale, key:`sd:1:${divisor}:${quotient}:${scale}` });
        out.push({ kind:'scaled_divide', prompt:`${dividend} ÷ ${divisor*scale} =`, answer:quotient, key:`sd:2:${divisor}:${quotient}:${scale}` });
      }
    }
    return out;
  }

  function buildFractionOfPool(rules) {
    const out = [];
    // Keep the v1.2 default pool/order exactly unchanged. When a teacher edits
    // the quantity range, deliberately switch to a range-driven pool so both
    // the minimum and maximum controls genuinely affect the available facts.
    const legacyRange = rules.fractionQuantityMin === 1 && rules.fractionQuantityMax === 500;
    for (const d of rules.fractionDenominators) {
      const unitMin = legacyRange ? 2 : Math.max(1, Math.ceil(rules.fractionQuantityMin / d));
      const unitMax = legacyRange ? 20 : Math.floor(rules.fractionQuantityMax / d);
      for (let n = 1; n < d; n += 1) {
        const cy=Number(rules.curriculumYear)||0;
        if (cy===1 && !((d===2||d===4)&&n===1)) continue;
        if (cy===2 && !((d===2&&n===1)||(d===3&&n===1)||(d===4&&[1,2,3].includes(n)))) continue;
        for (let unit = unitMin; unit <= unitMax; unit += 1) {
          const quantity = d * unit;
          if (quantity < rules.fractionQuantityMin || quantity > rules.fractionQuantityMax) continue;
          out.push({ kind:'fraction_of', prompt:`${n}/${d} of ${quantity} =`, answer:n*unit, key:`fr:${n}:${d}:${quantity}` });
        }
      }
    }
    return out;
  }

  function buildPercentageOfPool(rules) {
    const out = [];
    for (const pct of rules.percentageChoices) {
      const start = Math.max(10, Math.ceil(rules.percentageQuantityMin / 10) * 10);
      for (let quantity = start; quantity <= rules.percentageQuantityMax; quantity += 10) {
        const answer = quantity * pct / 100;
        if (!Number.isInteger(answer)) continue;
        out.push({ kind:'percentage_of', prompt:`${pct}% of ${quantity} =`, answer, key:`pc:${pct}:${quantity}` });
      }
    }
    return out;
  }

  function buildNegativeNumberPool(rules) {
    const out = [], cy=Number(rules.curriculumYear)||0;
    if(cy===4){
      for(let n=-10;n<=5;n++){out.push({kind:'negative_numbers',prompt:`1 less than ${n} =`,answer:n-1,key:`neg:y4:l:${n}`});out.push({kind:'negative_numbers',prompt:`1 more than ${n} =`,answer:n+1,key:`neg:y4:m:${n}`});}
      for(const step of [1,2,5])for(let start=8;start>=-2;start-=2){const vals=[0,1,2,3].map(i=>start-i*step);out.push({kind:'negative_numbers',prompt:`${vals.join(', ')}, ___`,answer:start-4*step,key:`neg:y4:s:${start}:${step}`});}
      return out;
    }
    if(cy===5){
      for(let n=-20;n<=10;n+=2)for(const step of [2,5,10]){out.push({kind:'negative_numbers',prompt:`${step} more than ${n} =`,answer:n+step,key:`neg:y5:m:${n}:${step}`});out.push({kind:'negative_numbers',prompt:`${step} less than ${n} =`,answer:n-step,key:`neg:y5:l:${n}:${step}`});}
      return out;
    }
    const m = Math.max(5, Math.min(50, rules.arithmeticOperandMax, rules.arithmeticMax));
    for (let a = 1; a <= m; a += 1) for (let b = 1; b <= m; b += 1) {
      if (a + b > Math.max(m, rules.arithmeticMax)) continue;
      out.push({ kind:'negative_numbers', prompt:`-${a} + ${b} =`, answer:b-a, key:`neg:1:${a}:${b}` });
      out.push({ kind:'negative_numbers', prompt:`${a} - ${a+b} =`, answer:-b, key:`neg:2:${a}:${b}` });
      out.push({ kind:'negative_numbers', prompt:`-${a} - ${b} =`, answer:-(a+b), key:`neg:3:${a}:${b}` });
    }
    return out;
  }

  function toRoman(value) {
    let n = Math.max(1, Math.min(3999, Number(value) || 1));
    const map=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
    let out='';
    for(const [v,symbol] of map){ while(n>=v){out+=symbol;n-=v;} }
    return out;
  }

  function buildRomanNumeralPool(rules) {
    const out = [];
    const max = Math.max(10, Math.min(3999, rules.romanMax));
    for (let n = 1; n <= max; n += 1) {
      const roman=toRoman(n);
      out.push({ kind:'roman_numerals', prompt:`${roman} =`, answer:n, key:`rom:n:${n}` });
      out.push({ kind:'roman_numerals', prompt:`Roman ${n} =`, answer:roman, key:`rom:r:${n}` });
    }
    return out;
  }

  function buildAngleFactsPool(rules) {
    const out = [];
    for (const total of (rules.angleTotals || [90,180,360])) {
      const step=total===90?5:10;
      for(let known=step;known<total;known+=step){
        out.push({ kind:'angle_facts', prompt:`${total}° - ${known}° =`, answer:total-known, key:`ang:${total}:${known}` });
      }
    }
    return out;
  }

  function buildSimpleAlgebraPool(rules) {
    const out = [];
    const xMax=Math.max(5,Math.min(100,rules.algebraUnknownMax));
    const cMax=Math.max(5,Math.min(50,rules.algebraCoefficientMax));
    for(let x=1;x<=xMax;x+=1){
      for(let c=1;c<=cMax;c+=1){
        out.push({ kind:'simple_algebra', prompt:`x + ${c} = ${x+c}, x =`, answer:x, key:`alg:1:${x}:${c}` });
        if(x>c)out.push({ kind:'simple_algebra', prompt:`x - ${c} = ${x-c}, x =`, answer:x, key:`alg:2:${x}:${c}` });
      }
      for(let m=2;m<=rules.algebraCoefficientMax;m+=1){
        out.push({ kind:'simple_algebra', prompt:`${m}x = ${m*x}, x =`, answer:x, key:`alg:3:${x}:${m}` });
        const c=((x+m)%9)+1;
        out.push({ kind:'simple_algebra', prompt:`${m}x + ${c} = ${m*x+c}, x =`, answer:x, key:`alg:4:${x}:${m}:${c}` });
      }
    }
    return out;
  }


  function buildNumberWordsPool(rules){
    const out=[],cy=Number(rules.curriculumYear)||0,max=Math.min(10000000,Number(rules.wholeNumberMax)||1000);
    let vals;
    if(cy===1)vals=range(0,Math.min(20,max));
    else if(cy===2)vals=range(0,Math.min(100,max));
    else if(cy===3)vals=sampleWholeNumbers(Math.min(1000,max));
    else vals=sampleWholeNumbers(max);
    for(const n of vals.slice(0,700)){
      const words=numberToWords(n);
      out.push({kind:'number_words',prompt:`${intText(n)} in words =`,answer:words,key:`nw:w:${n}`});
      out.push({kind:'number_words',prompt:`${words} =`,answer:intText(n),key:`nw:n:${n}`});
    }
    return out;
  }
  function buildPlaceValuePool(rules){
    const out=[];
    for(const n of sampleWholeNumbers(rules.wholeNumberMax||1000).filter(x=>x>=10)){
      const digits=String(n).split('').map(Number),len=digits.length;
      digits.forEach((digit,i)=>{if(!digit)return;const value=digit*pow10(len-i-1);out.push({kind:'place_value',prompt:`Value of ${digit} in ${intText(n)} =`,answer:intText(value),key:`pv:${n}:${i}`});});
    }
    return out;
  }
  function buildCompareNumbersPool(rules){
    const vals=sampleWholeNumbers(rules.wholeNumberMax||1000).filter(n=>n>0),out=[];
    for(let i=1;i<vals.length;i++){
      const a=vals[i-1],b=vals[i];out.push({kind:'compare_numbers',prompt:`${intText(a)} ___ ${intText(b)}`,answer:'<',key:`cmp:${a}:${b}:l`});
      if(i%3===0)out.push({kind:'compare_numbers',prompt:`${intText(b)} ___ ${intText(a)}`,answer:'>',key:`cmp:${b}:${a}:g`});
    }
    vals.slice(0,60).forEach(n=>out.push({kind:'compare_numbers',prompt:`${intText(n)} ___ ${intText(n)}`,answer:'=',key:`cmp:${n}:${n}:e`}));
    return out;
  }
  function buildRoundingWholePool(rules){
    const out=[],max=Number(rules.wholeNumberMax)||1000,cy=Number(rules.curriculumYear)||0;
    let units;
    if(cy===3)units=[10,100];
    else if(cy===4)units=[10,100,1000];
    else if(cy===5)units=[10,100,1000,10000,100000];
    else units=[10,100,1000,10000,100000,1000000].filter(u=>u<=Math.max(10,max));
    units=units.filter(u=>u<=Math.max(10,max));
    for(const unit of units){
      const offsets=[Math.max(1,Math.floor(unit*.2)),Math.max(1,Math.floor(unit*.49)),Math.ceil(unit*.5),Math.max(1,Math.floor(unit*.78))];
      for(let k=0;k<=Math.min(80,Math.floor(max/unit));k++)for(const off of offsets){const n=k*unit+off;if(n>max)continue;const rounded=Math.round(n/unit)*unit;out.push({kind:'rounding_whole',prompt:`${intText(n)} rounded to nearest ${intText(unit)} =`,answer:intText(rounded),key:`rnd:${n}:${unit}`});}
    }
    return out;
  }

  function buildNumberSequencesPool(rules){
    const out=[],max=Number(rules.wholeNumberMax)||1000,cy=Number(rules.curriculumYear)||0;
    let steps;
    if(cy===1)steps=[1,2,5,10];
    else if(cy===2)steps=[1,2,3,5,10];
    else if(cy===3)steps=[4,8,50,100];
    else if(cy===4)steps=[6,7,9,25,1000];
    else if(cy===5)steps=[10,100,1000,10000,100000];
    else steps=[1,2,3,4,5,10,20,25,50,100,1000,10000].filter(s=>s<=Math.max(10,max));
    steps=steps.filter(step=>step<=Math.max(10,max));
    for(const step of steps)for(let start=0;start<=Math.min(max-step*4,step*8+40);start+=Math.max(1,step)){
      const vals=[0,1,2,3].map(i=>start+i*step);out.push({kind:'number_sequences',prompt:`${vals.map(intText).join(', ')}, ___`,answer:intText(start+4*step),key:`seq:u:${cy}:${start}:${step}`});
      if(start>=4*step)out.push({kind:'number_sequences',prompt:`${intText(start)}, ${intText(start-step)}, ${intText(start-2*step)}, ___`,answer:intText(start-3*step),key:`seq:d:${cy}:${start}:${step}`});
    }
    return out;
  }

  function buildOddEvenPool(rules){return sampleWholeNumbers(rules.wholeNumberMax||1000).slice(0,500).map(n=>({kind:'odd_even',prompt:`${intText(n)} is odd or even?`,answer:n%2?'odd':'even',key:`oe:${n}`}));}
  function buildFactorCheckPool(rules){
    const out=[],max=Math.min(200,Number(rules.wholeNumberMax)||100);
    for(let n=2;n<=max;n++)for(let f=2;f<=Math.min(12,n);f++)out.push({kind:'factor_check',prompt:`Is ${f} a factor of ${n}?`,answer:n%f===0?'Yes':'No',key:`fac:${n}:${f}`});return out;
  }
  function buildMultipleCheckPool(rules){
    const out=[],max=Math.min(300,Number(rules.wholeNumberMax)||120);
    for(let n=2;n<=max;n++)for(let f=2;f<=12;f++)out.push({kind:'multiple_check',prompt:`Is ${n} a multiple of ${f}?`,answer:n%f===0?'Yes':'No',key:`mulc:${n}:${f}`});return out;
  }
  function buildPrimePool(rules){
    const out=[],max=Math.min(200,Number(rules.wholeNumberMax)||100);
    for(let n=2;n<=max;n++){out.push({kind:'prime_numbers',prompt:`Is ${n} prime?`,answer:isPrime(n)?'Yes':'No',key:`pr:y:${n}`});if(n<max-10&&n%3===1)out.push({kind:'prime_numbers',prompt:`Next prime after ${n} =`,answer:nextPrime(n),key:`pr:n:${n}`});}return out;
  }
  function buildAddSubMissingPool(rules){
    const out=[],max=Math.min(rules.arithmeticMax||100,rules.arithmeticOperandMax||100);
    for(let a=0;a<=max;a+=Math.max(1,Math.ceil(max/40)))for(let b=0;b<=Math.min(max-a,40);b+=Math.max(1,Math.ceil(Math.min(max,40)/12))){if(a===0&&b===0)continue;const t=a+b;out.push({kind:'add_sub_missing',prompt:`${a} + ___ = ${t}`,answer:b,key:`asm:a2:${a}:${b}`});out.push({kind:'add_sub_missing',prompt:`___ + ${b} = ${t}`,answer:a,key:`asm:a1:${a}:${b}`});out.push({kind:'add_sub_missing',prompt:`${t} - ___ = ${a}`,answer:b,key:`asm:s2:${a}:${b}`});out.push({kind:'add_sub_missing',prompt:`___ - ${b} = ${a}`,answer:t,key:`asm:s1:${a}:${b}`});}return out;
  }
  function buildMultidigitMultiplyPool(rules){
    const out=[],max=Math.max(100,Number(rules.wholeNumberMax)||1000),vals=sampleWholeNumbers(max).filter(n=>n>=12&&n<=Math.min(max,9999));
    for(const a of vals.filter((_,i)=>i%3===0).slice(0,220))for(const b of [2,3,4,5,6,7,8,9,12,15,20,24].filter(x=>a*x<=max*25))out.push({kind:'multidigit_multiply',prompt:`${intText(a)} × ${b} =`,answer:intText(a*b),key:`mdm:${a}:${b}`});return out;
  }
  function buildDivisionRemaindersPool(rules){
    const out=[],max=Math.max(100,Number(rules.wholeNumberMax)||1000),vals=sampleWholeNumbers(max).filter(n=>n>=20);
    for(const n of vals.filter((_,i)=>i%2===0).slice(0,260))for(const d of [2,3,4,5,6,7,8,9,11,12]){if(d>=n)continue;const q=Math.floor(n/d),rem=n%d;out.push({kind:'division_remainders',prompt:`${intText(n)} ÷ ${d} =`,answer:rem?`${q} r ${rem}`:String(q),key:`divr:${n}:${d}`});}return out;
  }

  function fractionDenoms(rules){return (rules.fractionDenominators||[2,3,4,5,6,8,10,12]).filter(d=>d>=2&&d<=24);}
  function buildEquivalentFractionsPool(rules){
    const out=[],cy=Number(rules.curriculumYear)||0;
    if(cy===2)return [
      {kind:'equivalent_fractions',prompt:'2/4 = ___/2',answer:1,key:'ef:y2:1'},
      {kind:'equivalent_fractions',prompt:'1/2 = ___/4',answer:2,key:'ef:y2:2'}
    ];
    for(const d of fractionDenoms(rules))for(let n=1;n<d;n++)if(gcd(n,d)===1)for(const k of [2,3,4,5]){
      out.push({kind:'equivalent_fractions',prompt:`${n}/${d} = ___/${d*k}`,answer:n*k,key:`ef:1:${n}:${d}:${k}`});
      out.push({kind:'equivalent_fractions',prompt:`___/${d*k} = ${n}/${d}`,answer:n*k,key:`ef:2:${n}:${d}:${k}`});
    }return out;
  }
  function buildSimplifyFractionsPool(rules){const out=[];for(const d of fractionDenoms(rules))for(let n=1;n<d;n++)if(gcd(n,d)===1)for(const k of [2,3,4,5,6])out.push({kind:'simplify_fractions',prompt:`Simplify ${n*k}/${d*k} =`,answer:`${n}/${d}`,key:`sf:${n}:${d}:${k}`});return out;}
  function buildFractionComparePool(rules){
    const out=[],ds=fractionDenoms(rules),cy=Number(rules.curriculumYear)||0;
    for(let i=0;i<ds.length;i++)for(let j=i;j<ds.length;j++){
      const d1=ds[i],d2=ds[j];
      if(cy===4 && d1!==d2)continue;
      if(cy===5 && Math.max(d1,d2)%Math.min(d1,d2)!==0)continue;
      const max1=cy>=6?2*d1:d1,max2=cy>=6?2*d2:d2;
      for(let n1=1;n1<max1;n1++)for(let n2=1;n2<max2;n2++){
        // Year 3 compares unit fractions with different denominators and
        // non-unit fractions when the denominator is the same.
        if(cy===3 && d1!==d2 && !(n1===1&&n2===1))continue;
        const a=n1*d2,b=n2*d1;if(a===b)continue;
        out.push({kind:'fraction_compare',prompt:`${n1}/${d1} ___ ${n2}/${d2}`,answer:a>b?'>':'<',key:`fc:${n1}:${d1}:${n2}:${d2}`});if(out.length>1800)return out;
      }
    }return out;
  }
  function buildMixedImproperPool(rules){const out=[];for(const d of fractionDenoms(rules))for(let whole=1;whole<=8;whole++)for(let n=1;n<d;n++){const imp=whole*d+n;out.push({kind:'mixed_improper',prompt:`${imp}/${d} as a mixed number =`,answer:`${whole} ${n}/${d}`,key:`mi:m:${imp}:${d}`});out.push({kind:'mixed_improper',prompt:`${whole} ${n}/${d} as an improper fraction =`,answer:`${imp}/${d}`,key:`mi:i:${whole}:${n}:${d}`});}return out;}
  function buildFractionAddSubtractPool(rules){
    const out=[],ds=fractionDenoms(rules).slice(0,8),cy=Number(rules.curriculumYear)||0;
    for(const d1 of ds)for(const d2 of ds){
      if((cy===3||cy===4) && d1!==d2)continue;
      if(cy===5 && Math.max(d1,d2)%Math.min(d1,d2)!==0)continue;
      const common=lcm(d1,d2);if(common>60)continue;
      for(let n1=1;n1<d1;n1++)for(let n2=1;n2<d2;n2++){
        const a=n1*(common/d1),b=n2*(common/d2);
        // Year 3 statutory addition/subtraction stays within one whole.
        if(cy!==3 || a+b<=common)out.push({kind:'fraction_add_subtract',prompt:`${n1}/${d1} + ${n2}/${d2} =`,answer:fractionText(a+b,common),key:`fas:a:${n1}:${d1}:${n2}:${d2}`});
        if(a>=b)out.push({kind:'fraction_add_subtract',prompt:`${n1}/${d1} - ${n2}/${d2} =`,answer:fractionText(a-b,common),key:`fas:s:${n1}:${d1}:${n2}:${d2}`});
        if(cy>=6){
          const w1=1+(n1%3),w2=1+(n2%2),A=(w1*d1+n1)*(common/d1),B=(w2*d2+n2)*(common/d2);
          out.push({kind:'fraction_add_subtract',prompt:`${w1} ${n1}/${d1} + ${w2} ${n2}/${d2} =`,answer:mixedText(A+B,common),key:`fas:ma:${w1}:${n1}:${d1}:${w2}:${n2}:${d2}`});
          if(A>=B)out.push({kind:'fraction_add_subtract',prompt:`${w1} ${n1}/${d1} - ${w2} ${n2}/${d2} =`,answer:mixedText(A-B,common),key:`fas:ms:${w1}:${n1}:${d1}:${w2}:${n2}:${d2}`});
        }
        if(out.length>2200)return out;
      }
    }return out;
  }
  function buildFractionMultiplyWholePool(rules){const out=[];for(const d of fractionDenoms(rules))for(let n=1;n<d;n++)for(let w=2;w<=12;w++){out.push({kind:'fraction_multiply_whole',prompt:`${n}/${d} × ${w} =`,answer:fractionText(n*w,d),key:`fmw:${n}:${d}:${w}`});if(Number(rules.curriculumYear)>=5&&w<=8)out.push({kind:'fraction_multiply_whole',prompt:`1 ${n}/${d} × ${w} =`,answer:mixedText((d+n)*w,d),key:`fmw:m:${n}:${d}:${w}`});}return out;}
  function buildFractionMultiplyPool(rules){const out=[],ds=fractionDenoms(rules).slice(0,8);for(const d1 of ds)for(const d2 of ds)for(let n1=1;n1<d1;n1++)for(let n2=1;n2<d2;n2++){out.push({kind:'fraction_multiply',prompt:`${n1}/${d1} × ${n2}/${d2} =`,answer:fractionText(n1*n2,d1*d2),key:`fm:${n1}:${d1}:${n2}:${d2}`});if(out.length>1800)return out;}return out;}
  function buildFractionDivideWholePool(rules){const out=[];for(const d of fractionDenoms(rules))for(let n=1;n<d;n++)for(let w=2;w<=8;w++)out.push({kind:'fraction_divide_whole',prompt:`${n}/${d} ÷ ${w} =`,answer:fractionText(n,d*w),key:`fdw:${n}:${d}:${w}`});return out;}

  function decimalPlaces(rules){return Math.max(1,Math.min(3,Number(rules.decimalPlacesMax)||2));}
  function buildDecimalPlaceValuePool(rules){
    const out=[],pmax=decimalPlaces(rules),wholeMax=Math.min(999,Number(rules.decimalWholeMax)||100);
    for(let p=1;p<=pmax;p++){const scale=pow10(p);for(let whole=0;whole<=Math.min(wholeMax,30);whole+=3)for(let frac=1;frac<scale;frac+=Math.max(1,Math.floor(scale/13))){const raw=whole*scale+frac,s=decimalTextFromScaled(raw,p,false);const digits=String(frac).padStart(p,'0');for(let i=0;i<p;i++){const digit=Number(digits[i]);if(!digit)continue;const value=decimalTextFromScaled(digit,p-i,true);out.push({kind:'decimal_place_value',prompt:`Value of ${digit} in ${s} =`,answer:value,key:`dpv:${raw}:${p}:${i}`});}}}return out;
  }
  function buildDecimalComparePool(rules){const out=[],p=decimalPlaces(rules),scale=pow10(p),max=(Math.min(50,Number(rules.decimalWholeMax)||50)+1)*scale;for(let a=1;a<max;a+=Math.max(1,Math.floor(scale/4)+3)){const b=Math.min(max-1,a+Math.max(1,Math.floor(scale/10)+1));out.push({kind:'decimal_compare',prompt:`${decimalTextFromScaled(a,p)} ___ ${decimalTextFromScaled(b,p)}`,answer:'<',key:`dc:${a}:${b}:${p}`});if(a%3===0)out.push({kind:'decimal_compare',prompt:`${decimalTextFromScaled(b,p)} ___ ${decimalTextFromScaled(a,p)}`,answer:'>',key:`dc:${b}:${a}:${p}`});}return out;}
  function buildDecimalRoundingPool(rules){
    const out=[],pmax=decimalPlaces(rules),cy=Number(rules.curriculumYear)||0;
    for(let p=1;p<=pmax;p++){
      if(cy===4 && p!==1)continue;
      const scale=pow10(p);
      for(let whole=0;whole<=Math.min(80,Number(rules.decimalWholeMax)||100);whole+=2)
        for(const frac of [Math.floor(scale*.24),Math.floor(scale*.49),Math.ceil(scale*.5),Math.floor(scale*.76)].filter(x=>x>0&&x<scale)){
          const raw=whole*scale+frac,s=decimalTextFromScaled(raw,p,false),roundedWhole=Math.floor((raw+scale/2)/scale);
          out.push({kind:'decimal_rounding',prompt:`${s} rounded to nearest whole =`,answer:String(roundedWhole),key:`dr:w:${raw}:${p}`});
          if(p>=2 && cy!==4){const unit=pow10(p-1),rounded=Math.floor((raw+unit/2)/unit)*unit;out.push({kind:'decimal_rounding',prompt:`${s} rounded to 1 decimal place =`,answer:decimalTextFromScaled(rounded,p,false).replace(/(\.\d)\d*$/,'$1'),key:`dr:1:${raw}:${p}`});}
        }
    }return out;
  }
  function buildDecimalScalePool(rules){
    const out=[],cy=Number(rules.curriculumYear)||0;
    if(cy===4){
      for(let n=1;n<=99;n++)for(const k of [10,100])out.push({kind:'decimal_scale',prompt:`${n} ÷ ${k} =`,answer:decimalText(n/k,2),key:`dsc:y4:${n}:${k}`});
      return out;
    }
    const p=decimalPlaces(rules),scale=pow10(p);
    for(let raw=1;raw<=Math.min((Number(rules.decimalWholeMax)||100)*scale,5000);raw+=Math.max(1,Math.floor(scale/5)+7)){
      const st=decimalTextFromScaled(raw,p);for(const k of [10,100,1000]){
        out.push({kind:'decimal_scale',prompt:`${st} × ${k} =`,answer:decimalText((raw/scale)*k,p+1),key:`dsc:m:${raw}:${p}:${k}`});
        out.push({kind:'decimal_scale',prompt:`${st} ÷ ${k} =`,answer:decimalText((raw/scale)/k,p+3),key:`dsc:d:${raw}:${p}:${k}`});
      }
    }return out;
  }
  function buildDecimalAddSubtractPool(rules){const out=[],p=decimalPlaces(rules),scale=pow10(p),max=Math.min(100*scale,(Number(rules.decimalWholeMax)||100)*scale);for(let a=1;a<=max;a+=Math.max(1,Math.floor(scale/2)+11))for(let b=1;b<=Math.min(max-a,8*scale);b+=Math.max(1,Math.floor(scale/3)+7)){out.push({kind:'decimal_add_subtract',prompt:`${decimalTextFromScaled(a,p)} + ${decimalTextFromScaled(b,p)} =`,answer:decimalTextFromScaled(a+b,p),key:`das:a:${a}:${b}:${p}`});if(a>=b)out.push({kind:'decimal_add_subtract',prompt:`${decimalTextFromScaled(a,p)} - ${decimalTextFromScaled(b,p)} =`,answer:decimalTextFromScaled(a-b,p),key:`das:s:${a}:${b}:${p}`});}return out;}
  function buildDecimalMultiplyPool(rules){const out=[],p=Math.min(2,decimalPlaces(rules)),scale=pow10(p);for(let raw=1;raw<=Math.min(60*scale,(Number(rules.decimalWholeMax)||100)*scale);raw+=Math.max(1,Math.floor(scale/5)+3))for(let w=2;w<=12;w++)out.push({kind:'decimal_multiply',prompt:`${decimalTextFromScaled(raw,p)} × ${w} =`,answer:decimalTextFromScaled(raw*w,p),key:`dm:${raw}:${p}:${w}`});return out;}
  function buildDecimalDividePool(rules){
    const out=[],p=Math.min(2,decimalPlaces(rules)),scale=pow10(p),cy=Number(rules.curriculumYear)||0;
    for(let ans=1;ans<=Math.min(40*scale,(Number(rules.decimalWholeMax)||100)*scale);ans+=Math.max(1,Math.floor(scale/5)+2))for(let d=2;d<=12;d++){
      const raw=ans*d;out.push({kind:'decimal_divide',prompt:`${decimalTextFromScaled(raw,p)} ÷ ${d} =`,answer:decimalTextFromScaled(ans,p),key:`dd:${ans}:${p}:${d}`});
    }
    if(cy>=6){
      for(const d of [2,4,5,8,10,20,25,40])for(let n=1;n<=120;n++)if(n%d!==0){const v=n/d;if(Math.round(v*100)===v*100)out.push({kind:'decimal_divide',prompt:`${n} ÷ ${d} =`,answer:decimalText(v,2),key:`dd:w:${n}:${d}`});}
    }
    return out;
  }
  function buildFractionDecimalPercentPool(rules={}){
    let triples=[[1,2,0.5,50],[1,4,0.25,25],[3,4,0.75,75],[1,5,0.2,20],[2,5,0.4,40],[3,5,0.6,60],[4,5,0.8,80],[1,10,0.1,10],[3,10,0.3,30],[7,10,0.7,70],[1,8,0.125,12.5],[3,8,0.375,37.5],[5,8,0.625,62.5],[7,8,0.875,87.5]];
    const cy=Number(rules.curriculumYear)||0;if(cy===4)triples=triples.filter(([n,d])=>[[1,2],[1,4],[3,4]].some(x=>x[0]===n&&x[1]===d));
    const out=[];
    for(const [n,d,dec,pct] of triples){const f=`${n}/${d}`,ds=decimalText(dec,3),ps=`${decimalText(pct,1)}%`;out.push({kind:'fraction_decimal_percent',prompt:`${f} as a decimal =`,answer:ds,key:`fdp:fd:${n}:${d}`});out.push({kind:'fraction_decimal_percent',prompt:`${ds} as a fraction =`,answer:f,key:`fdp:df:${n}:${d}`});if(cy!==4){out.push({kind:'fraction_decimal_percent',prompt:`${f} as a percentage =`,answer:ps,key:`fdp:fp:${n}:${d}`});out.push({kind:'fraction_decimal_percent',prompt:`${ps} as a decimal =`,answer:ds,key:`fdp:pd:${n}:${d}`});}}
    return out;
  }

  function buildRatioMissingPool(rules){const out=[],m=Math.min(20,Number(rules.ratioPartMax)||8);for(let a=1;a<=m;a++)for(let b=1;b<=m;b++)if(gcd(a,b)===1)for(let k=2;k<=8;k++){out.push({kind:'ratio_missing',prompt:`${a}:${b} = ${a*k}:___`,answer:b*k,key:`rm:1:${a}:${b}:${k}`});out.push({kind:'ratio_missing',prompt:`${a}:${b} = ___:${b*k}`,answer:a*k,key:`rm:2:${a}:${b}:${k}`});}return out;}
  function buildRatioSharePool(rules){const out=[],m=Math.min(20,Number(rules.ratioPartMax)||8),qmax=Number(rules.ratioQuantityMax)||120;for(let a=1;a<=m;a++)for(let b=1;b<=m;b++)if(a!==b)for(let unit=2;unit<=20;unit++){const total=(a+b)*unit;if(total>qmax)break;const large=Math.max(a,b)*unit,small=Math.min(a,b)*unit;out.push({kind:'ratio_share',prompt:`Share ${total} in ratio ${a}:${b}. Larger share =`,answer:large,key:`rs:l:${a}:${b}:${unit}`});out.push({kind:'ratio_share',prompt:`Share ${total} in ratio ${a}:${b}. Smaller share =`,answer:small,key:`rs:s:${a}:${b}:${unit}`});}return out;}
  function buildScaleFactorPool(rules){const out=[],qmax=Number(rules.ratioQuantityMax)||120;for(let n=2;n<=Math.min(30,qmax);n++)for(let k=2;k<=6;k++)if(n*k<=qmax)out.push({kind:'scale_factor',prompt:`${n} cm enlarged by scale factor ${k} =`,answer:`${n*k} cm`,key:`scf:${n}:${k}`});return out;}

  function buildMetricConversionPool(rules={}){
    const out=[],cy=Number(rules.curriculumYear)||0;
    let pairs=[['mm','cm',10],['cm','m',100],['g','kg',1000],['ml','l',1000]];
    if(!cy||cy>=4)pairs.splice(2,0,['m','km',1000]);
    for(const [small,big,factor] of pairs)for(const units of [1,2,3,4,5,12,25,50,75]){const smallVal=units*factor;out.push({kind:'metric_conversion',prompt:`${smallVal} ${small} = ___ ${big}`,answer:decimalText(units,3),key:`mc:s:${cy}:${small}:${big}:${smallVal}`});const decimal=units/factor;out.push({kind:'metric_conversion',prompt:`${decimalText(decimal,3)} ${big} = ___ ${small}`,answer:units,key:`mc:b:${cy}:${small}:${big}:${units}`});}
    return out;
  }
  function buildTimeConversionPool(rules={}){const out=[],cy=Number(rules.curriculumYear)||0;
    const hs=cy===2?[1,2,3,4,6,12,24]:[1,2,3,4,6,8,12,24];for(const h of hs)out.push({kind:'time_conversion',prompt:`${h} hours = ___ minutes`,answer:h*60,key:`tc:hm:${cy}:${h}`});
    if(cy!==2)for(const m of [1,2,5,10,15,30,45,60])out.push({kind:'time_conversion',prompt:`${m} minutes = ___ seconds`,answer:m*60,key:`tc:ms:${m}`});
    if(cy>=3||!cy){for(const w of [1,2,3,4,6,8])out.push({kind:'time_conversion',prompt:`${w} weeks = ___ days`,answer:w*7,key:`tc:wd:${w}`});for(const y of [1,2,3,5,10])out.push({kind:'time_conversion',prompt:`${y} years = ___ months`,answer:y*12,key:`tc:ym:${y}`});}
    return out;}
  function hhmm(total){const h=Math.floor(total/60)%24,m=total%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}
  function buildTimeDurationPool(rules={}){const out=[],cy=Number(rules.curriculumYear)||0;
    if(cy===2){for(let h=8;h<=16;h++)for(const startMin of [0,15,30,45])for(const dur of [5,10,15,20,30,45,60]){const start=h*60+startMin,end=start+dur;if(end>=24*60)continue;out.push({kind:'time_duration',prompt:`From ${format12(h,startMin)} to ${format12(Math.floor(end/60)%24,end%60)} = ___ minutes`,answer:dur,key:`td:y2:${start}:${dur}`});}return out;}
    for(let start=7*60;start<=17*60;start+=35)for(const dur of [20,30,45,60,75,90,105,120])if(start+dur<24*60)out.push({kind:'time_duration',prompt:`${hhmm(start)} to ${hhmm(start+dur)} = ___ minutes`,answer:dur,key:`td:${start}:${dur}`});return out;}
  function moneyText(pence){return `£${(pence/100).toFixed(2)}`;}
  function buildMoneyPool(rules={}){
    const out=[],cy=Number(rules.curriculumYear)||0;
    if(cy===1){
      const coins=[1,2,5,10,20,50,100,200];
      coins.forEach(p=>{const label=p<100?`${p}p`:`£${p/100}`;out.push({kind:'money',prompt:`${label} = ___ pence`,answer:p,key:`mon:y1:v:${p}`});});
      const notes=[5,10,20,50];notes.forEach(v=>out.push({kind:'money',prompt:`£${v} = ___ pence`,answer:v*100,key:`mon:y1:n:${v}`}));
      for(let i=0;i<coins.length-1;i++)out.push({kind:'money',prompt:`Which is worth more: ${coins[i]<100?coins[i]+'p':'£'+coins[i]/100} or ${coins[i+1]<100?coins[i+1]+'p':'£'+coins[i+1]/100}?`,answer:coins[i+1]<100?`${coins[i+1]}p`:`£${coins[i+1]/100}`,key:`mon:y1:c:${i}`});
      return out;
    }
    if(cy===2){
      const coins=[1,2,5,10,20,50,100,200];
      for(const coin of [5,10,20,50])for(const count of [2,3,4,5])out.push({kind:'money',prompt:`${count} × ${coin}p coins =`,answer:`${count*coin}p`,key:`mon:y2:coins:${coin}:${count}`});
      for(const a of coins)for(const b of coins)if(a<=b&&a+b<=200)out.push({kind:'money',prompt:`${a}p + ${b}p =`,answer:`${a+b}p`,key:`mon:y2:pair:${a}:${b}`});
    }
    const vals=cy===2?[5,10,20,25,30,40,50,60,75,80,100,120,150,200,250,300]:[25,50,75,100,125,150,175,200,250,300,350,425,475,550,625,750,875,950];
    for(const a of vals)for(const b of vals.filter(x=>x<=a+300).slice(0,10)){
      out.push({kind:'money',prompt:`${moneyText(a)} + ${moneyText(b)} =`,answer:moneyText(a+b),key:`mon:a:${a}:${b}`});
      if(a>=b)out.push({kind:'money',prompt:`${moneyText(a)} - ${moneyText(b)} =`,answer:moneyText(a-b),key:`mon:s:${a}:${b}`});
      const tender=[100,200,500,1000,2000].find(t=>t>=a);if(tender)out.push({kind:'money',prompt:`Change from ${moneyText(tender)} after ${moneyText(a)} =`,answer:moneyText(tender-a),key:`mon:c:${tender}:${a}`});
    }return out;
  }
  function buildPerimeterPool(){const out=[];for(let a=2;a<=30;a++)for(let b=2;b<=20;b++)out.push({kind:'perimeter',prompt:`Rectangle ${a} cm × ${b} cm. Perimeter =`,answer:`${2*(a+b)} cm`,key:`per:${a}:${b}`});return out;}
  function buildAreaPool(){const out=[];for(let a=2;a<=30;a++)for(let b=2;b<=20;b++)out.push({kind:'area',prompt:`Rectangle ${a} cm × ${b} cm. Area =`,answer:`${a*b} cm²`,key:`area:${a}:${b}`});return out;}
  function buildVolumePool(){const out=[];for(let a=2;a<=12;a++)for(let b=2;b<=10;b++)for(let c=2;c<=8;c++)out.push({kind:'volume',prompt:`Cuboid ${a} cm × ${b} cm × ${c} cm. Volume =`,answer:`${a*b*c} cm³`,key:`vol:${a}:${b}:${c}`});return out;}

  function buildAngleSumsPool(){const out=[];for(let a=20;a<=120;a+=10)for(let b=20;b<=140;b+=10){const c=180-a-b;if(c>0)out.push({kind:'angle_sums',prompt:`Triangle: ${a}°, ${b}°, ___`,answer:`${c}°`,key:`angs:t:${a}:${b}`});}for(let a=60;a<=120;a+=15)for(let b=60;b<=120;b+=15)for(let c=60;c<=120;c+=15){const d=360-a-b-c;if(d>0&&d<180)out.push({kind:'angle_sums',prompt:`Quadrilateral: ${a}°, ${b}°, ${c}°, ___`,answer:`${d}°`,key:`angs:q:${a}:${b}:${c}`});}return out;}
  function buildShapePropertiesPool(rules={}){
    const cy=Number(rules.curriculumYear)||0;
    const y1=[
      ['A 2-D shape with 3 sides is a =','triangle','sp:y1:tri'],['A 2-D shape with 4 equal sides and 4 right angles is a =','square','sp:y1:sq'],
      ['A perfectly round 2-D shape is a =','circle','sp:y1:cir'],['A 3-D shape with 6 square faces is a =','cube','sp:y1:cube'],
      ['A 3-D shape shaped like a ball is a =','sphere','sp:y1:sph'],['A 3-D shape with rectangular faces is a =','cuboid','sp:y1:cub'],['A 3-D shape with a point and triangular faces is a =','pyramid','sp:y1:pyr']
    ];
    const y2=[
      ['How many sides does a triangle have?',3,'sp:tri:s'],['How many sides does a quadrilateral have?',4,'sp:quad:s'],['How many sides does a pentagon have?',5,'sp:pent:s'],['How many sides does a hexagon have?',6,'sp:hex:s'],
      ['How many vertices does a cube have?',8,'sp:cube:v'],['How many faces does a cube have?',6,'sp:cube:f'],['How many edges does a cube have?',12,'sp:cube:e'],['How many faces does a cuboid have?',6,'sp:cub:f'],
      ['How many lines of symmetry does a square have?',4,'sp:sq:sym'],['How many lines of symmetry does a rectangle have?',2,'sp:rec:sym'],['A cylinder has how many circular flat faces?',2,'sp:cyl:f'],['A cone has how many vertices?',1,'sp:cone:v']
    ];
    const y3=[
      ['A triangle with 3 equal sides is called =','equilateral','sp:eq'],['A triangle with 2 equal sides is called =','isosceles','sp:iso'],['A triangle with no equal sides is called =','scalene','sp:sca'],['A triangle with one 90° angle is called a ___ triangle','right-angled','sp:righttri']
    ];
    const y4=[
      ['A quadrilateral with 4 equal sides but not necessarily right angles is a =','rhombus','sp:rho'],['A quadrilateral with exactly one pair of parallel sides is a =','trapezium','sp:trap'],
      ['A quadrilateral with 2 pairs of parallel sides is a =','parallelogram','sp:para']
    ];
    const y5=[
      ['A polygon with all sides and angles equal is =','regular','sp:reg'],['A polygon whose sides or angles are not all equal is =','irregular','sp:irreg'],
      ['A rectangle is always also a =','parallelogram','sp:rectpara']
    ];
    const y6=[
      ['Every square is also a =','rectangle','sp:sqrect'],['Every square is also a =','rhombus','sp:sqrho'],['A quadrilateral with two pairs of parallel sides is a =','parallelogram','sp:qpara']
    ];
    let rows=[...y1];if(!cy||cy>=2)rows=rows.concat(y2);if(!cy||cy>=3)rows=rows.concat(y3);if(!cy||cy>=4)rows=rows.concat(y4);if(!cy||cy>=5)rows=rows.concat(y5);if(!cy||cy>=6)rows=rows.concat(y6);
    return rows.map(([prompt,answer,key])=>({kind:'shape_properties',prompt,answer,key}));
  }

  function buildCoordinatesPool(rules){
    const out=[],m=Math.min(30,Number(rules.coordinateMax)||12),four=!!rules.coordinateFourQuadrants,min=four?-m:0;
    for(let x=min;x<=m;x++)for(let y=min;y<=m;y++)for(const [dx,dy,label] of [[2,0,'2 right'],[0,2,'2 up'],[3,1,'3 right, 1 up'],[-2,1,'2 left, 1 up'],[1,-2,'1 right, 2 down']]){
      const nx=x+dx,ny=y+dy;if(nx<min||ny<min||nx>m||ny>m)continue;
      out.push({kind:'coordinates',prompt:`(${x}, ${y}) translated ${label} =`,answer:`(${nx}, ${ny})`,key:`co:${x}:${y}:${dx}:${dy}:${four?4:1}`});
    }return out;
  }
  function buildFormulaSubstitutionPool(){const out=[];for(let a=1;a<=12;a++)for(let b=1;b<=12;b++){out.push({kind:'formula_substitution',prompt:`a=${a}, b=${b}. 2a + b =`,answer:2*a+b,key:`fs:1:${a}:${b}`});out.push({kind:'formula_substitution',prompt:`l=${a}, w=${b}. P=2(l+w). P =`,answer:2*(a+b),key:`fs:2:${a}:${b}`});out.push({kind:'formula_substitution',prompt:`x=${a}, y=${b}. 3x - y =`,answer:3*a-b,key:`fs:3:${a}:${b}`});}return out;}
  function buildEquationPairsPool(){const out=[];for(let total=2;total<=20;total++)out.push({kind:'equation_pairs',prompt:`How many whole-number pairs (x,y) satisfy x + y = ${total}?`,answer:total+1,key:`ep:${total}`});return out;}
  function buildMeanPool(rules){const out=[],m=Math.min(100,Number(rules.statsValueMax)||30);for(let mean=2;mean<=m;mean+=2)for(const d1 of [1,2,3,4])for(const d2 of [1,2,3]){const vals=[mean-d1,mean+d1,mean-d2,mean+d2];if(Math.min(...vals)<0||Math.max(...vals)>m)continue;out.push({kind:'mean',prompt:`Mean of ${vals.join(', ')} =`,answer:mean,key:`mean:${mean}:${d1}:${d2}`});}return out;}
  function buildPieChartAnglesPool(){const out=[];for(const pct of [5,10,20,25,30,40,50,60,75]){const deg=360*pct/100;if(Number.isInteger(deg))out.push({kind:'pie_chart_angles',prompt:`${pct}% of a pie chart = ___°`,answer:`${deg}°`,key:`pie:p:${pct}`});}for(const [n,d] of [[1,2],[1,3],[1,4],[2,5],[3,4],[1,5]]){const deg=360*n/d;if(Number.isInteger(deg))out.push({kind:'pie_chart_angles',prompt:`${n}/${d} of a pie chart = ___°`,answer:`${deg}°`,key:`pie:f:${n}:${d}`});}return out;}


  function buildMoreLessPool(rules){
    const out=[],cy=Number(rules.curriculumYear)||0,max=Number(rules.wholeNumberMax)||1000;
    const steps=cy===1?[1]:cy===2?[1,10]:cy===3?[10,100]:[100,1000];
    for(const n of sampleWholeNumbers(max).filter(x=>x>=0).slice(0,320))for(const step of steps){
      if(n+step<=max)out.push({kind:'more_less',prompt:`${step} more than ${intText(n)} =`,answer:intText(n+step),key:`ml:m:${n}:${step}`});
      if(n>=step)out.push({kind:'more_less',prompt:`${step} less than ${intText(n)} =`,answer:intText(n-step),key:`ml:l:${n}:${step}`});
    }return out;
  }

  function buildPartitionNumberPool(rules){
    const out=[],max=Math.min(10000,Number(rules.wholeNumberMax)||1000);
    for(const n of sampleWholeNumbers(max).filter(x=>x>=10)){
      const s=String(n),len=s.length;
      for(let i=0;i<len-1;i++){
        const place=pow10(len-i-1),digit=Number(s[i]);if(!digit)continue;
        const part=digit*place,rest=n-part;
        out.push({kind:'partition_number',prompt:`${intText(n)} = ${intText(part)} + ___`,answer:intText(rest),key:`part:${n}:${i}`});
        const cy=Number(rules.curriculumYear)||0;
        if(cy>=2 && rest>0 && part>=10){
          const shift=Math.min(part,Math.max(10,Math.floor(part/2/10)*10));
          const nonStandard=part-shift;
          if(nonStandard>=0)out.push({kind:'partition_number',prompt:`${intText(n)} = ${intText(nonStandard)} + ___`,answer:intText(n-nonStandard),key:`part:n:${n}:${i}:${nonStandard}`});
        }
      }
    }return out;
  }

  function buildRoundingCustomPool(rules){
    const out=[],max=Number(rules.wholeNumberMax)||10000000;
    for(const unit of [20,50])for(const n of sampleWholeNumbers(max).filter(x=>x>0).slice(0,280)){
      const ans=Math.round(n/unit)*unit;
      out.push({kind:'rounding_custom',prompt:`${intText(n)} rounded to nearest ${unit} =`,answer:intText(ans),key:`rc:${n}:${unit}`});
    }return out;
  }

  function buildFactorPairsPool(rules){
    const out=[],max=Math.min(1000,Number(rules.wholeNumberMax)||100);
    for(let n=4;n<=max;n++){
      const pairs=[];for(let f=1;f*f<=n;f++)if(n%f===0)pairs.push([f,n/f]);
      out.push({kind:'factor_pairs',prompt:`How many factor pairs does ${n} have?`,answer:pairs.length,key:`fp:c:${n}`});
      for(const [a,b] of pairs.filter(([a,b])=>a!==1&&b!==n).slice(0,3))out.push({kind:'factor_pairs',prompt:`${n} = ${a} × ___`,answer:b,key:`fp:m:${n}:${a}`});
    }return out;
  }

  function buildCommonFactorsPool(rules){
    const out=[],max=Math.min(240,Number(rules.wholeNumberMax)||100);
    for(let a=8;a<=max;a+=2)for(let b=6;b<=Math.min(max,a+30);b+=3){
      for(const f of [2,3,4,5,6,8,10,12])if(f<=Math.min(a,b))out.push({kind:'common_factors',prompt:`Is ${f} a common factor of ${a} and ${b}?`,answer:(a%f===0&&b%f===0)?'Yes':'No',key:`cf:${a}:${b}:${f}`});
    }return out;
  }

  function buildCommonMultiplesPool(){
    const out=[];for(let a=2;a<=12;a++)for(let b=2;b<=12;b++){const base=lcm(a,b);for(const k of [1,2,3,4]){const n=base*k;out.push({kind:'common_multiples',prompt:`Is ${n} a common multiple of ${a} and ${b}?`,answer:'Yes',key:`cm:y:${a}:${b}:${n}`});if(n+1<200)out.push({kind:'common_multiples',prompt:`Is ${n+1} a common multiple of ${a} and ${b}?`,answer:((n+1)%a===0&&(n+1)%b===0)?'Yes':'No',key:`cm:n:${a}:${b}:${n+1}`});}}return out;
  }

  function buildMultidigitAddSubtractPool(rules){
    const out=[],max=Math.max(100,Number(rules.wholeNumberMax)||1000),vals=sampleWholeNumbers(max).filter(n=>n>=20);
    for(let i=0;i<vals.length;i++){
      const a=vals[i],b=vals[(i*7+11)%vals.length];if(a+b<=max)out.push({kind:'multidigit_add_subtract',prompt:`${intText(a)} + ${intText(b)} =`,answer:intText(a+b),key:`mdas:a:${a}:${b}`});
      const hi=Math.max(a,b),lo=Math.min(a,b);if(hi!==lo)out.push({kind:'multidigit_add_subtract',prompt:`${intText(hi)} - ${intText(lo)} =`,answer:intText(hi-lo),key:`mdas:s:${hi}:${lo}`});
    }return out;
  }

  function roundTo(n,unit){return Math.round(n/unit)*unit;}
  function buildEstimateCalculationPool(rules){
    const out=[],max=Math.max(100,Number(rules.wholeNumberMax)||1000),vals=sampleWholeNumbers(max).filter(n=>n>=20);
    for(let i=0;i<Math.min(vals.length,260);i++){
      const a=vals[i],b=vals[(i*5+9)%vals.length],unit=max>=1000?100:10;
      out.push({kind:'estimate_calculation',prompt:`Estimate ${intText(a)} + ${intText(b)} (round each to nearest ${unit}) =`,answer:intText(roundTo(a,unit)+roundTo(b,unit)),key:`est:a:${a}:${b}:${unit}`});
      if(a!==b){const hi=Math.max(a,b),lo=Math.min(a,b);out.push({kind:'estimate_calculation',prompt:`Estimate ${intText(hi)} - ${intText(lo)} (nearest ${unit}) =`,answer:intText(roundTo(hi,unit)-roundTo(lo,unit)),key:`est:s:${hi}:${lo}:${unit}`});}
    }return out;
  }

  // `word_problems` remains only as a retired metadata/index slot. The provisional
  // sentence-template generator itself was removed before public beta.

  function buildFractionSequencesPool(rules){
    const out=[],cy=Number(rules.curriculumYear)||0,ds=fractionDenoms(rules);
    for(const d of ds){
      const stepNums=cy===2?[1]:[1,2].filter(n=>n<d);
      for(const nstep of stepNums)for(let start=0;start<=Math.max(0,d*2-4*nstep);start+=nstep){
        const vals=[0,1,2,3].map(i=>fractionText(start+i*nstep,d));
        out.push({kind:'fraction_sequences',prompt:`${vals.join(', ')}, ___`,answer:fractionText(start+4*nstep,d),key:`fseq:${d}:${start}:${nstep}`});
      }
    }return out;
  }

  function buildDecimalToFractionPool(rules){
    const out=[],pmax=decimalPlaces(rules);
    for(let p=1;p<=pmax;p++){const scale=pow10(p);for(let raw=1;raw<scale;raw+=Math.max(1,Math.floor(scale/25))){out.push({kind:'decimal_to_fraction',prompt:`${decimalTextFromScaled(raw,p,false)} as a fraction in simplest form =`,answer:fractionText(raw,scale),key:`dtf:${raw}:${p}`});}}return out;
  }

  function buildFractionToDecimalPool(){
    const out=[],ds=[2,4,5,8,10,20,25,40,50,100,125];for(const d of ds)for(let n=1;n<d;n++){const v=n/d;if(String(v).length>8)continue;out.push({kind:'fraction_to_decimal',prompt:`${n}/${d} as a decimal =`,answer:decimalText(v,3),key:`ftd:${n}:${d}`});if(out.length>1200)return out;}return out;
  }

  function buildPercentageComparePool(){
    const out=[],cases=[[25,80,40,50],[50,70,35,100],[20,150,30,100],[75,40,50,50],[10,360,15,240],[60,50,25,120],[40,90,30,120]];
    for(const [p1,q1,p2,q2] of cases){const a=p1*q1/100,b=p2*q2/100;out.push({kind:'percentage_compare',prompt:`${p1}% of ${q1} ___ ${p2}% of ${q2}`,answer:a===b?'=':(a>b?'>':'<'),key:`pcmp:${p1}:${q1}:${p2}:${q2}`});}return out;
  }

  function buildUnitRatePool(){
    const out=[];for(const qty of [2,3,4,5,6,8,10])for(const unitPence of [25,40,50,75,100,125,150,200]){const total=qty*unitPence;out.push({kind:'unit_rate',prompt:`${qty} items cost ${moneyText(total)}. Cost of 1 item =`,answer:moneyText(unitPence),key:`ur:m:${qty}:${unitPence}`});}for(const hours of [2,3,4,5])for(const rate of [20,30,40,50,60])out.push({kind:'unit_rate',prompt:`${rate*hours} km in ${hours} hours = ___ km per hour`,answer:rate,key:`ur:r:${hours}:${rate}`});return out;
  }

  function buildMeasureComparePool(rules={}){
    const out=[],cy=Number(rules.curriculumYear)||0;
    if(cy===1){
      const groups=[['cm',[3,5,8,12,15]],['g',[50,100,200,350,500]],['ml',[100,250,400,500,750]]];
      for(const [unit,vals] of groups)for(let i=0;i<vals.length-1;i++){
        out.push({kind:'measure_compare',prompt:`${vals[i]} ${unit} ___ ${vals[i+1]} ${unit}`,answer:'<',key:`mcmp:y1:${unit}:${i}:l`});
        out.push({kind:'measure_compare',prompt:`${vals[i+1]} ${unit} ___ ${vals[i]} ${unit}`,answer:'>',key:`mcmp:y1:${unit}:${i}:g`});
      }return out;
    }
    const rows=[
      ['100 cm','1 m',100,100],['80 cm','1 m',80,100],['150 cm','1 m',150,100],['1000 g','1 kg',1000,1000],['750 g','1 kg',750,1000],['1250 g','1 kg',1250,1000],['1000 ml','1 l',1000,1000],['500 ml','1 l',500,1000],['1500 ml','1 l',1500,1000],['10 mm','1 cm',10,10],['25 mm','2 cm',25,20]
    ];for(const [a,b,av,bv] of rows)out.push({kind:'measure_compare',prompt:`${a} ___ ${b}`,answer:av===bv?'=':(av>bv?'>':'<'),key:`mcmp:${a}:${b}`});return out;
  }

  function buildCalendarFactsPool(rules={}){
    const cy=Number(rules.curriculumYear)||0,rows=[['Days in 1 week =',7,'cal:w'],['Months in 1 year =',12,'cal:y']];
    if(cy>=2||!cy)rows.push(['Hours in 1 day =',24,'cal:hd'],['Minutes in 1 hour =',60,'cal:mh']);
    if(cy>=3||!cy)rows.push(['Seconds in 1 minute =',60,'cal:sm'],['Days in a normal year =',365,'cal:ny'],['Days in a leap year =',366,'cal:ly'],['Days in February in a normal year =',28,'cal:f28'],['Days in February in a leap year =',29,'cal:f29'],['Days in April =',30,'cal:apr'],['Days in June =',30,'cal:jun'],['Days in September =',30,'cal:sep'],['Days in November =',30,'cal:nov']);
    return rows.map(([prompt,answer,key])=>({kind:'calendar_facts',prompt,answer,key}));}

  function format12(h,m){const suffix=h>=12?'pm':'am',hh=h%12||12;return `${hh}:${String(m).padStart(2,'0')} ${suffix}`;}
  function buildTime1224Pool(){const out=[];for(let h=0;h<24;h++)for(const m of [0,15,30,45]){const t24=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,t12=format12(h,m);out.push({kind:'time_12_24',prompt:`${t12} in 24-hour time =`,answer:t24,key:`t1224:a:${h}:${m}`});out.push({kind:'time_12_24',prompt:`${t24} in 12-hour time =`,answer:t12,key:`t1224:b:${h}:${m}`});}return out;}

  function buildImperialConversionPool(){
    const out=[];for(const n of [1,2,4,6,8,10,12])out.push({kind:'imperial_conversion',prompt:`Using 1 inch ≈ 2.5 cm, ${n} inches ≈ ___ cm`,answer:decimalText(n*2.5,1),key:`imp:i:${n}`});for(const n of [5,10,15,20,25,30])out.push({kind:'imperial_conversion',prompt:`Using 5 miles ≈ 8 km, ${n} miles ≈ ___ km`,answer:decimalText(n*8/5,1),key:`imp:mi:${n}`});return out;
  }

  function buildTemperatureIntervalPool(){const out=[];for(let low=-15;low<=-1;low+=2)for(let high=1;high<=20;high+=3)out.push({kind:'temperature_interval',prompt:`Temperature rises from ${low}°C to ${high}°C. Rise =`,answer:`${high-low}°C`,key:`temp:${low}:${high}`});return out;}

  function buildTriangleAreaPool(){const out=[];for(let b=2;b<=30;b++)for(let h=2;h<=20;h++)if((b*h)%2===0)out.push({kind:'triangle_area',prompt:`Triangle base ${b} cm, height ${h} cm. Area =`,answer:`${b*h/2} cm²`,key:`ta:${b}:${h}`});return out;}
  function buildParallelogramAreaPool(){const out=[];for(let b=2;b<=30;b++)for(let h=2;h<=20;h++)out.push({kind:'parallelogram_area',prompt:`Parallelogram base ${b} cm, perpendicular height ${h} cm. Area =`,answer:`${b*h} cm²`,key:`pa:${b}:${h}`});return out;}
  function buildMissingMeasurePool(){const out=[];for(let a=2;a<=20;a++)for(let b=2;b<=15;b++){out.push({kind:'missing_measure',prompt:`Rectangle area ${a*b} cm², one side ${a} cm. Other side =`,answer:`${b} cm`,key:`mm:a:${a}:${b}`});out.push({kind:'missing_measure',prompt:`Rectangle perimeter ${2*(a+b)} cm, one side ${a} cm. Other side =`,answer:`${b} cm`,key:`mm:p:${a}:${b}`});}return out;}

  function buildLinePropertiesPool(){return [
    ['Two lines that never meet are =','parallel','lp:par'],['Two lines that meet at 90° are =','perpendicular','lp:perp'],['A line from left to right is =','horizontal','lp:h'],['A line straight up and down is =','vertical','lp:v']
  ].map(([prompt,answer,key])=>({kind:'line_properties',prompt,answer,key}));}

  function buildAngleRelationshipsPool(rules={}){const out=[],cy=Number(rules.curriculumYear)||0;for(const a of [20,35,45,60,75,95,120,135,150]){out.push({kind:'angle_relationships',prompt:`Angles on a straight line: ${a}° and ___`,answer:`${180-a}°`,key:`ar:l:${cy}:${a}`});if(!cy||cy>=6)out.push({kind:'angle_relationships',prompt:`Angle vertically opposite ${a}° =`,answer:`${a}°`,key:`ar:v:${cy}:${a}`});if(a<180)out.push({kind:'angle_relationships',prompt:`Angles around a point: ${a}° and ___`,answer:`${360-a}°`,key:`ar:p:${cy}:${a}`});}return out;}

  function buildCirclePropertiesPool(){const out=[];for(let r=1;r<=30;r++){out.push({kind:'circle_properties',prompt:`Circle radius ${r} cm. Diameter =`,answer:`${2*r} cm`,key:`cir:d:${r}`});out.push({kind:'circle_properties',prompt:`Circle diameter ${2*r} cm. Radius =`,answer:`${r} cm`,key:`cir:r:${r}`});}out.push({kind:'circle_properties',prompt:'Distance around a circle is called =',answer:'circumference',key:'cir:c'});return out;}

  // Retained only as a compact-family ID placeholder for pre-release recreation compatibility.
  // Statistics interpretation that depends on tables/charts belongs to the future visual renderer.
  function buildDataTableQuestionsPool(){ return []; }


  function buildNumberBondsPool(rules){
    const out=[],cy=Number(rules.curriculumYear)||0;
    const targets=cy===1?[10,20]:cy===2?[10,20,100]:[20,50,100];
    for(const t of targets){
      const step=t===100?10:1;
      for(let a=0;a<=t;a+=step){const b=t-a;
        out.push({kind:'number_bonds',prompt:`${a} + ___ = ${t}`,answer:b,key:`nb:a:${t}:${a}`});
        out.push({kind:'number_bonds',prompt:`${t} - ${a} =`,answer:b,key:`nb:s:${t}:${a}`});
      }
    }return out;
  }

  function buildThreeAddendsPool(){
    const out=[];for(let a=0;a<=9;a++)for(let b=a;b<=9;b++)for(let c=b;c<=9;c++){
      out.push({kind:'three_addends',prompt:`${a} + ${b} + ${c} =`,answer:a+b+c,key:`ta3:${a}:${b}:${c}`});
    }return out;
  }

  function buildFactFamiliesPool(rules){
    const out=[],cy=Number(rules.curriculumYear)||0,addMax=cy<=2?20:Math.min(100,Number(rules.arithmeticMax)||100);
    for(let a=1;a<=Math.min(30,addMax);a++)for(let b=1;b<=Math.min(20,addMax-a);b++){
      const t=a+b;
      out.push({kind:'fact_families',prompt:`If ${a} + ${b} = ${t}, then ${t} - ${a} =`,answer:b,key:`ff:as:${a}:${b}`});
      out.push({kind:'fact_families',prompt:`${a} + ${b} ___ ${b} + ${a}`,answer:'=',key:`ff:ac:${a}:${b}`});
      if(a!==b)out.push({kind:'fact_families',prompt:`${t} - ${a} ___ ${a} - ${t}`,answer:'>',key:`ff:sn:${a}:${b}`});
    }
    const tables=(rules.tables||[2,3,5,10]).filter(n=>n>0&&n<=12);
    for(const a of tables)for(let b=1;b<=Math.min(12,Number(rules.factorMax)||12);b++){
      const p=a*b;out.push({kind:'fact_families',prompt:`If ${a} × ${b} = ${p}, then ${p} ÷ ${a} =`,answer:b,key:`ff:md:${a}:${b}`});
      out.push({kind:'fact_families',prompt:`${a} × ${b} ___ ${b} × ${a}`,answer:'=',key:`ff:mc:${a}:${b}`});
    }return out;
  }

  function buildDistributiveLawPool(rules){
    const out=[],tables=(rules.tables||range(2,12)).filter(n=>n>=2&&n<=12);
    for(const a of tables)for(let ones=1;ones<=9;ones++)for(const tens of [10,20,30]){
      const b=tens+ones;
      out.push({kind:'distributive_law',prompt:`${a} × ${b} = (${a} × ${tens}) + (${a} × ${ones}) =`,answer:a*b,key:`dl:c:${a}:${b}`});
      out.push({kind:'distributive_law',prompt:`${a} × ${b} = ${a} × ${tens} + ${a} × ___`,answer:ones,key:`dl:m:${a}:${b}`});
    }
    for(const a of tables)for(const b of [2,4,5,10])for(const c of [2,5,10])out.push({kind:'distributive_law',prompt:`${a} × ${b} × ${c} =`,answer:a*b*c,key:`dl:3:${a}:${b}:${c}`});
    return out;
  }

  function buildCorrespondencePool(rules){
    const out=[],cy=Number(rules.curriculumYear)||0,tables=(rules.tables||[2,3,5,10]).filter(n=>n>=2&&n<=12),maxGroups=cy<=1?5:cy===2?10:12;
    const nouns=[['boxes','pencils'],['bags','counters'],['teams','players'],['packs','cards']];
    for(let i=0;i<nouns.length;i++)for(const each of tables)for(let groups=2;groups<=maxGroups;groups++){
      const [groupN,itemN]=nouns[i];
      out.push({kind:'correspondence',prompt:`${groups} ${groupN}, ${each} ${itemN} in each. Total ${itemN} =`,answer:groups*each,key:`corr:${i}:${groups}:${each}`});
      if(cy>=2)out.push({kind:'correspondence',prompt:`${groups*each} ${itemN} shared equally into ${groups} ${groupN}. In each =`,answer:each,key:`corr:d:${i}:${groups}:${each}`});
    }return out;
  }

  function buildLongDivisionPool(rules){
    const out=[],max=Math.min(9999,Math.max(1000,Number(rules.wholeNumberMax)||9999));
    for(const d of [12,14,15,16,18,20,21,24,25,30,32,36,40,45,48,50])for(let q=12;q<=180;q+=7){
      const exact=d*q;if(exact<=max)out.push({kind:'long_division',prompt:`${intText(exact)} ÷ ${d} =`,answer:q,key:`ld:e:${exact}:${d}`});
      const rem=(q%Math.max(2,d-1))+1,dividend=exact+rem;if(dividend<=max&&rem<d)out.push({kind:'long_division',prompt:`${intText(dividend)} ÷ ${d} =`,answer:`${q} r ${rem}`,key:`ld:r:${dividend}:${d}`});
    }return out;
  }

  function buildPowersOf10Pool(rules){
    const out=[],cy=Number(rules.curriculumYear)||0,max=Math.min(1000000,Number(rules.wholeNumberMax)||100000);
    const vals=sampleWholeNumbers(max).filter(n=>n>=1).slice(0,350);
    for(const n of vals)for(const k of [10,100,1000]){
      if(n*k<=10000000)out.push({kind:'powers_of_10',prompt:`${intText(n)} × ${intText(k)} =`,answer:intText(n*k),key:`p10:m:${n}:${k}`});
      if(n%k===0)out.push({kind:'powers_of_10',prompt:`${intText(n)} ÷ ${intText(k)} =`,answer:intText(n/k),key:`p10:d:${n}:${k}`});
    }
    if(cy>=5){for(const [raw,p] of [[25,1],[37,1],[125,2],[406,2],[375,3],[1205,3]])for(const k of [10,100,1000]){
      const x=raw/pow10(p),st=decimalTextFromScaled(raw,p,false);
      out.push({kind:'powers_of_10',prompt:`${st} × ${k} =`,answer:decimalText(x*k,3),key:`p10:dm:${raw}:${p}:${k}`});
      out.push({kind:'powers_of_10',prompt:`${st} ÷ ${k} =`,answer:decimalText(x/k,6),key:`p10:dd:${raw}:${p}:${k}`});
    }}return out;
  }

  function buildUnitChoicePool(rules){
    const cy=Number(rules.curriculumYear)||0;
    const rows=[
      ['Best unit for the length of a pencil =','cm','uc:pencil'],['Best unit for the height of a classroom door =','m','uc:door'],
      ['Best unit for the mass of an apple =','g','uc:apple'],['Best unit for the mass of a person =','kg','uc:person'],
      ['Best unit for water in a drinking glass =','ml','uc:glass'],['Best unit for water in a bath =','l','uc:bath'],
      ['Best unit for room temperature =','°C','uc:temp'],['Best unit for a lesson duration =','minutes','uc:lesson']
    ];
    if(cy>=3||!cy)rows.push(['Best unit for the thickness of a coin =','mm','uc:coin'],['Best unit for distance between two towns =','km','uc:towns']);
    return rows.map(([prompt,answer,key])=>({kind:'unit_choice',prompt,answer,key}));
  }

  function buildTimeWordsPool(rules){
    const out=[],cy=Number(rules.curriculumYear)||0;
    for(let h=1;h<=12;h++){
      out.push({kind:'time_words',prompt:`${h} o'clock =`,answer:`${h}:00`,key:`tw:o:${h}`});
      out.push({kind:'time_words',prompt:`half past ${h} =`,answer:`${h}:30`,key:`tw:h:${h}`});
      if(cy>=2||!cy){out.push({kind:'time_words',prompt:`quarter past ${h} =`,answer:`${h}:15`,key:`tw:qp:${h}`});const nh=h===1?12:h-1;out.push({kind:'time_words',prompt:`quarter to ${h} =`,answer:`${nh}:45`,key:`tw:qt:${h}`});}
      if(cy>=2||!cy)for(const m of [5,10,20,25]){out.push({kind:'time_words',prompt:`${m} past ${h} =`,answer:`${h}:${String(m).padStart(2,'0')}`,key:`tw:p:${h}:${m}`});const prev=h===1?12:h-1;out.push({kind:'time_words',prompt:`${m} to ${h} =`,answer:`${prev}:${String(60-m).padStart(2,'0')}`,key:`tw:t:${h}:${m}`});}
    }return out;
  }

  function buildPositionLanguagePool(){return [
    ['If A is left of B, B is ___ of A.','right','pos:r'],['If A is right of B, B is ___ of A.','left','pos:l'],
    ['If A is above B, B is ___ A.','below','pos:b'],['If A is below B, B is ___ A.','above','pos:a'],
    ['The word meaning in the middle of two objects is =','between','pos:between'],['The opposite of inside is =','outside','pos:outside']
  ].map(([prompt,answer,key])=>({kind:'position_language',prompt,answer,key}));}

  function buildTurnsDirectionPool(rules){
    const out=[
      ['Two quarter turns make a =','half turn','turn:2q'],['Two half turns make a =','full turn','turn:2h'],
      ['A half turn followed by a quarter turn makes a =','three-quarter turn','turn:hq'],
      ['Opposite direction to clockwise =','anticlockwise','turn:anti']
    ].map(([prompt,answer,key])=>({kind:'turns_direction',prompt,answer,key}));
    if(Number(rules.curriculumYear)>=2||!Number(rules.curriculumYear)){
      [[90,'quarter turn'],[180,'half turn'],[270,'three-quarter turn'],[360,'full turn']].forEach(([deg,name])=>out.push({kind:'turns_direction',prompt:`${deg}° =`,answer:name,key:`turn:d:${deg}`}));
    }return out;
  }

  function buildAngleClassificationPool(rules){
    const out=[],cy=Number(rules.curriculumYear)||0;
    const vals=[20,35,45,60,75,90,100,120,135,150,175,180,200,240,270,300];
    for(const a of vals){let type=a<90?'acute':a===90?'right':a<180?'obtuse':a===180?'straight':'reflex';
      if(cy===3){if(a===90)type='right angle';else if(a<90)type='less than a right angle';else if(a<180)type='greater than a right angle';else continue;}
      out.push({kind:'angle_classification',prompt:`${a}° is =`,answer:type,key:`ac:${cy}:${a}`});
    }return out;
  }

  function buildAlgebraSequencesPool(){
    const out=[];for(const step of [-7,-5,-3,-2,2,3,4,5,7,10])for(const start of [-20,-10,0,3,8,15,25]){
      const vals=[0,1,2,3].map(i=>start+i*step);out.push({kind:'algebra_sequences',prompt:`${vals.join(', ')}, ___`,answer:start+4*step,key:`alseq:n:${start}:${step}`});
      out.push({kind:'algebra_sequences',prompt:`Start ${start}; add ${step} each time. 10th term =`,answer:start+9*step,key:`alseq:t:${start}:${step}`});
    }return out;
  }

  function buildFractionDivisionDecimalPool(){
    const out=[];for(const d of [3,6,7,8,9,11,12,16,20,25,40])for(let n=1;n<d;n++){
      const v=n/d;for(const places of [2,3])out.push({kind:'fraction_division_decimal',prompt:`${n}/${d} as a decimal to ${places} d.p. =`,answer:v.toFixed(places),key:`fdd:${n}:${d}:${places}`});
    }return out;
  }

  function buildCoordinateReflectionPool(rules){
    const out=[],cy=Number(rules.curriculumYear)||0,m=Math.min(30,Number(rules.coordinateMax)||12);
    if(cy===5){for(let x=0;x<=m;x++)for(let y=0;y<=m;y++){for(const line of [2,5,10].filter(v=>v<=m)){const rx=2*line-x;if(rx>=0&&rx<=m)out.push({kind:'coordinate_reflection',prompt:`Point (${x}, ${y}) reflected in line x=${line} =`,answer:`(${rx}, ${y})`,key:`cr:y5:x:${x}:${y}:${line}`});const ry=2*line-y;if(ry>=0&&ry<=m)out.push({kind:'coordinate_reflection',prompt:`Point (${x}, ${y}) reflected in line y=${line} =`,answer:`(${x}, ${ry})`,key:`cr:y5:y:${x}:${y}:${line}`});}}return out;}
    for(let x=-m;x<=m;x++)for(let y=-m;y<=m;y++){out.push({kind:'coordinate_reflection',prompt:`(${x}, ${y}) reflected in x-axis =`,answer:`(${x}, ${-y})`,key:`cr:x:${x}:${y}`});out.push({kind:'coordinate_reflection',prompt:`(${x}, ${y}) reflected in y-axis =`,answer:`(${-x}, ${y})`,key:`cr:y:${x}:${y}`});}
    return out;
  }

  function buildTimeLanguagePool(){
    return [
      ['Which is longer: 1 minute or 1 hour?','1 hour','tl:long1'],['Which is shorter: 1 day or 1 week?','1 day','tl:short1'],
      ['Morning comes before or after afternoon?','before','tl:ma'],['Evening comes before or after afternoon?','after','tl:ea'],
      ['Tuesday comes before or after Wednesday?','before','tl:tw'],['Saturday comes before or after Friday?','after','tl:sf'],
      ['Which is longer: 30 minutes or 1 hour?','1 hour','tl:long2'],['Which is longer: 7 days or 1 week?','same length','tl:eq']
    ].map(([prompt,answer,key])=>({kind:'time_language',prompt,answer,key}));
  }

  function buildAreaPerimeterRelationshipsPool(){
    const out=[];
    const sameArea=[[[3,12],[4,9]],[[2,18],[3,12]],[[5,12],[6,10]],[[4,15],[5,12]],[[6,8],[4,12]]];
    for(const [[a,b],[c,d]] of sameArea){const p1=2*(a+b),p2=2*(c+d);out.push({kind:'area_perimeter_relationships',prompt:`${a}×${b} and ${c}×${d} rectangles have the same area. Larger perimeter =`,answer:`${Math.max(p1,p2)} units`,key:`apr:a:${a}:${b}:${c}:${d}`});}
    const samePerim=[[[3,9],[5,7]],[[4,10],[6,8]],[[2,12],[5,9]],[[7,11],[8,10]]];
    for(const [[a,b],[c,d]] of samePerim){const a1=a*b,a2=c*d;out.push({kind:'area_perimeter_relationships',prompt:`${a}×${b} and ${c}×${d} rectangles have the same perimeter. Larger area =`,answer:`${Math.max(a1,a2)} square units`,key:`apr:p:${a}:${b}:${c}:${d}`});}
    return out;
  }

  function poolForFamily(family, rules) {
    if (family === 'double') return buildDoublePool(rules);
    if (family === 'repeated_addition') return buildRepeatedPool(rules);
    if (family === 'addition') return buildAdditionPool(rules);
    if (family === 'subtraction') return buildSubtractionPool(rules);
    if (family === 'multiply') return buildMultiplyPool(rules);
    if (family === 'divide') return buildDividePool(rules);
    if (family === 'missing_number') return buildMissingNumberPool(rules);
    if (family === 'square') return buildSquarePool(rules);
    if (family === 'square_root') return buildSquareRootPool(rules);
    if (family === 'cube') return buildCubePool(rules);
    if (family === 'bodmas') return buildBodmasPool(rules);
    if (family === 'scaled_multiply') return buildScaledMultiplyPool(rules);
    if (family === 'scaled_divide') return buildScaledDividePool(rules);
    if (family === 'fraction_of') return buildFractionOfPool(rules);
    if (family === 'percentage_of') return buildPercentageOfPool(rules);
    if (family === 'negative_numbers') return buildNegativeNumberPool(rules);
    if (family === 'roman_numerals') return buildRomanNumeralPool(rules);
    if (family === 'angle_facts') return buildAngleFactsPool(rules);
    if (family === 'simple_algebra') return buildSimpleAlgebraPool(rules);
    if (family === 'number_words') return buildNumberWordsPool(rules);
    if (family === 'place_value') return buildPlaceValuePool(rules);
    if (family === 'compare_numbers') return buildCompareNumbersPool(rules);
    if (family === 'rounding_whole') return buildRoundingWholePool(rules);
    if (family === 'number_sequences') return buildNumberSequencesPool(rules);
    if (family === 'odd_even') return buildOddEvenPool(rules);
    if (family === 'factor_check') return buildFactorCheckPool(rules);
    if (family === 'multiple_check') return buildMultipleCheckPool(rules);
    if (family === 'prime_numbers') return buildPrimePool(rules);
    if (family === 'add_sub_missing') return buildAddSubMissingPool(rules);
    if (family === 'multidigit_multiply') return buildMultidigitMultiplyPool(rules);
    if (family === 'division_remainders') return buildDivisionRemaindersPool(rules);
    if (family === 'equivalent_fractions') return buildEquivalentFractionsPool(rules);
    if (family === 'simplify_fractions') return buildSimplifyFractionsPool(rules);
    if (family === 'fraction_compare') return buildFractionComparePool(rules);
    if (family === 'mixed_improper') return buildMixedImproperPool(rules);
    if (family === 'fraction_add_subtract') return buildFractionAddSubtractPool(rules);
    if (family === 'fraction_multiply_whole') return buildFractionMultiplyWholePool(rules);
    if (family === 'fraction_multiply') return buildFractionMultiplyPool(rules);
    if (family === 'fraction_divide_whole') return buildFractionDivideWholePool(rules);
    if (family === 'decimal_place_value') return buildDecimalPlaceValuePool(rules);
    if (family === 'decimal_compare') return buildDecimalComparePool(rules);
    if (family === 'decimal_rounding') return buildDecimalRoundingPool(rules);
    if (family === 'decimal_scale') return buildDecimalScalePool(rules);
    if (family === 'decimal_add_subtract') return buildDecimalAddSubtractPool(rules);
    if (family === 'decimal_multiply') return buildDecimalMultiplyPool(rules);
    if (family === 'decimal_divide') return buildDecimalDividePool(rules);
    if (family === 'fraction_decimal_percent') return buildFractionDecimalPercentPool(rules);
    if (family === 'ratio_missing') return buildRatioMissingPool(rules);
    if (family === 'ratio_share') return buildRatioSharePool(rules);
    if (family === 'scale_factor') return buildScaleFactorPool(rules);
    if (family === 'metric_conversion') return buildMetricConversionPool(rules);
    if (family === 'time_conversion') return buildTimeConversionPool(rules);
    if (family === 'time_duration') return buildTimeDurationPool(rules);
    if (family === 'money') return buildMoneyPool(rules);
    if (family === 'perimeter') return buildPerimeterPool(rules);
    if (family === 'area') return buildAreaPool(rules);
    if (family === 'volume') return buildVolumePool(rules);
    if (family === 'angle_sums') return buildAngleSumsPool(rules);
    if (family === 'shape_properties') return buildShapePropertiesPool(rules);
    if (family === 'coordinates') return buildCoordinatesPool(rules);
    if (family === 'formula_substitution') return buildFormulaSubstitutionPool(rules);
    if (family === 'equation_pairs') return buildEquationPairsPool(rules);
    if (family === 'mean') return buildMeanPool(rules);
    if (family === 'pie_chart_angles') return buildPieChartAnglesPool(rules);
    if (family === 'more_less') return buildMoreLessPool(rules);
    if (family === 'partition_number') return buildPartitionNumberPool(rules);
    if (family === 'rounding_custom') return buildRoundingCustomPool(rules);
    if (family === 'factor_pairs') return buildFactorPairsPool(rules);
    if (family === 'common_factors') return buildCommonFactorsPool(rules);
    if (family === 'common_multiples') return buildCommonMultiplesPool(rules);
    if (family === 'multidigit_add_subtract') return buildMultidigitAddSubtractPool(rules);
    if (family === 'estimate_calculation') return buildEstimateCalculationPool(rules);
    if (family === 'fraction_sequences') return buildFractionSequencesPool(rules);
    if (family === 'decimal_to_fraction') return buildDecimalToFractionPool(rules);
    if (family === 'fraction_to_decimal') return buildFractionToDecimalPool(rules);
    if (family === 'percentage_compare') return buildPercentageComparePool(rules);
    if (family === 'unit_rate') return buildUnitRatePool(rules);
    if (family === 'measure_compare') return buildMeasureComparePool(rules);
    if (family === 'calendar_facts') return buildCalendarFactsPool(rules);
    if (family === 'time_12_24') return buildTime1224Pool(rules);
    if (family === 'imperial_conversion') return buildImperialConversionPool(rules);
    if (family === 'temperature_interval') return buildTemperatureIntervalPool(rules);
    if (family === 'triangle_area') return buildTriangleAreaPool(rules);
    if (family === 'parallelogram_area') return buildParallelogramAreaPool(rules);
    if (family === 'missing_measure') return buildMissingMeasurePool(rules);
    if (family === 'line_properties') return buildLinePropertiesPool(rules);
    if (family === 'angle_relationships') return buildAngleRelationshipsPool(rules);
    if (family === 'circle_properties') return buildCirclePropertiesPool(rules);
    if (family === 'data_table_questions') return buildDataTableQuestionsPool(rules);
    if (family === 'number_bonds') return buildNumberBondsPool(rules);
    if (family === 'three_addends') return buildThreeAddendsPool(rules);
    if (family === 'fact_families') return buildFactFamiliesPool(rules);
    if (family === 'distributive_law') return buildDistributiveLawPool(rules);
    if (family === 'correspondence') return buildCorrespondencePool(rules);
    if (family === 'long_division') return buildLongDivisionPool(rules);
    if (family === 'powers_of_10') return buildPowersOf10Pool(rules);
    if (family === 'unit_choice') return buildUnitChoicePool(rules);
    if (family === 'time_words') return buildTimeWordsPool(rules);
    if (family === 'position_language') return buildPositionLanguagePool(rules);
    if (family === 'turns_direction') return buildTurnsDirectionPool(rules);
    if (family === 'angle_classification') return buildAngleClassificationPool(rules);
    if (family === 'algebra_sequences') return buildAlgebraSequencesPool(rules);
    if (family === 'fraction_division_decimal') return buildFractionDivisionDecimalPool(rules);
    if (family === 'area_perimeter_relationships') return buildAreaPerimeterRelationshipsPool(rules);
    if (family === 'coordinate_reflection') return buildCoordinateReflectionPool(rules);
    if (family === 'time_language') return buildTimeLanguagePool(rules);
    return [];
  }

  function weightedFamilyCounts(rules, rng) {
    const counts = Object.fromEntries((rules.families || []).map(f => [f,0]));
    if (!(rules.families || []).length) return counts;
    const bag = [];
    for (const family of rules.families) {
      const weight = Math.max(1, Number(rules.familyWeights[family]) || 1);
      for (let i = 0; i < weight; i += 1) bag.push(family);
    }
    const cycle = shuffle(bag, rng);
    for (let i = 0; i < rules.questionCount; i += 1) counts[cycle[i % cycle.length]] += 1;
    return counts;
  }

  function generateFamilyMix(rules, rng) {
    const counts = weightedFamilyCounts(rules, rng);
    let out = [];
    for (const family of rules.families) {
      const count = counts[family] || 0;
      if (!count) continue;
      const pool = poolForFamily(family, rules);
      out = out.concat(balancedPick(pool, count, rng, rules));
    }
    return shuffle(out, rng);
  }

  function balancedPick(pool, count, rng, rules) {
    if (!pool.length) return [];
    const chosen = [];
    const exactSeen = new Set();
    const reverseSeen = new Set();
    const groups = new Map();
    for (const q of pool) {
      const g = q.group == null ? '__all' : String(q.group);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(q);
    }
    const groupKeys = shuffle(Array.from(groups.keys()), rng);
    for (const key of groupKeys) groups.set(key, shuffle(groups.get(key), rng));
    const offsets = Object.fromEntries(groupKeys.map(k => [k, 0]));

    let guard = 0;
    while (chosen.length < count && guard < count * 100 + 1000) {
      guard += 1;
      let madeProgress = false;
      for (const g of shuffle(groupKeys, rng)) {
        const arr = groups.get(g);
        if (!arr.length) continue;
        let tries = 0;
        while (tries < arr.length) {
          const q = arr[offsets[g] % arr.length];
          offsets[g] += 1;
          tries += 1;
          const exactBlocked = rules.avoidExactDuplicates && exactSeen.has(q.key);
          const reverseKey = q.reverseKey || q.key;
          const reverseBlocked = rules.avoidReversedDuplicates && reverseSeen.has(reverseKey);
          if (exactBlocked || reverseBlocked) continue;
          chosen.push({ ...q });
          exactSeen.add(q.key);
          reverseSeen.add(reverseKey);
          madeProgress = true;
          break;
        }
        if (chosen.length >= count) break;
      }
      if (!madeProgress) {
        // The requested sheet is larger than the unique pool. Start another balanced cycle.
        exactSeen.clear();
        reverseSeen.clear();
        for (const g of groupKeys) groups.set(g, shuffle(groups.get(g), rng));
      }
    }
    return chosen.slice(0, count);
  }

  function generateQuestions(inputRules, seed) {
    const rules = normalizeRules(inputRules);
    const rng = rngFromSeed(seed || newSeed(rules.id || 'CUSTOM'));
    let questions = [];

    if (rules.mode === 'double') {
      questions = balancedPick(buildDoublePool(rules), rules.questionCount, rng, rules);
    } else if (rules.mode === 'repeated_addition') {
      questions = balancedPick(buildRepeatedPool(rules), rules.questionCount, rng, rules);
    } else if (rules.mode === 'multiply') {
      questions = balancedPick(buildMultiplyPool(rules), rules.questionCount, rng, rules);
    } else if (rules.mode === 'divide') {
      questions = balancedPick(buildDividePool(rules), rules.questionCount, rng, rules);
    } else if (rules.mode === 'mixed') {
      // Keep this path byte-for-byte equivalent to v1.1 for Classic 88/99 regression safety.
      const multCount = Math.round(rules.questionCount * rules.multiplyPercent / 100);
      const divCount = rules.questionCount - multCount;
      const mult = balancedPick(buildMultiplyPool(rules), multCount, rng, rules);
      const div = balancedPick(buildDividePool(rules), divCount, rng, rules);
      questions = shuffle(mult.concat(div), rng);
    } else if (rules.mode === 'addition') {
      questions = balancedPick(buildAdditionPool(rules), rules.questionCount, rng, rules);
    } else if (rules.mode === 'add_subtract') {
      const addCount = Math.ceil(rules.questionCount / 2);
      const subCount = rules.questionCount - addCount;
      questions = shuffle(
        balancedPick(buildAdditionPool(rules), addCount, rng, rules)
          .concat(balancedPick(buildSubtractionPool(rules), subCount, rng, rules)), rng);
    } else if (rules.mode === 'missing_number') {
      questions = balancedPick(buildMissingNumberPool(rules), rules.questionCount, rng, rules);
    } else if (rules.mode === 'family_mix') {
      questions = generateFamilyMix(rules, rng);
    }

    return questions.map((q, idx) => ({ ...q, number: idx + 1 }));
  }

  function shuffleQuestions(questions, seed) {
    const rng = rngFromSeed(String(seed) + ':shuffle');
    return shuffle(questions, rng).map((q, idx) => ({ ...q, number: idx + 1 }));
  }

  function poolForQuestionKind(kind, rules) {
    if (kind === 'double') return buildDoublePool(rules);
    if (kind === 'repeated_addition') return buildRepeatedPool(rules);
    if (kind === 'multiply') return buildMultiplyPool(rules);
    if (kind === 'divide') return buildDividePool(rules);
    if (kind === 'addition') return buildAdditionPool(rules);
    if (kind === 'subtraction') return buildSubtractionPool(rules);
    if (kind === 'missing_number') return buildMissingNumberPool(rules);
    if (Object.prototype.hasOwnProperty.call(FAMILY_LABELS, kind)) return poolForFamily(kind, rules);
    return [];
  }

  function questionByKey(kind, inputRules, key) {
    const rules = normalizeRules(inputRules);
    const q = poolForQuestionKind(kind, rules).find(item => item && item.key === key);
    return q ? { ...q } : null;
  }

  // Portable-recreation helpers. These expose the stable pool position of a question
  // without changing any worksheet-generation path. v1.10 uses the numeric position
  // in QR recipes instead of carrying long question-key strings.
  function questionPoolIndex(kind, inputRules, key) {
    const rules = normalizeRules(inputRules);
    return poolForQuestionKind(kind, rules).findIndex(item => item && item.key === key);
  }

  function questionByPoolIndex(kind, inputRules, index) {
    const rules = normalizeRules(inputRules);
    const i = Number(index);
    const pool = poolForQuestionKind(kind, rules);
    if (!Number.isInteger(i) || i < 0 || i >= pool.length) return null;
    return pool[i] ? { ...pool[i] } : null;
  }

  function questionPool(kind, inputRules) {
    const rules = normalizeRules(inputRules);
    return poolForQuestionKind(kind, rules).map(q => ({ ...q }));
  }

  function replaceQuestion(questions, index, inputRules, seed) {
    if (index < 0 || index >= questions.length) return questions.slice();
    const rules = normalizeRules(inputRules);
    const current = questions[index];
    if (!current) return questions.slice();

    // A manual replacement is a review action, not a re-roll of the whole sheet.
    // Keep the replacement in the same mathematical family as the question it replaces.
    const pool = poolForQuestionKind(current.kind, rules);
    if (!pool.length) return questions.slice();

    const exactSeen = new Set();
    const reverseSeen = new Set();
    questions.forEach((q, i) => {
      if (i === index || !q) return;
      if (q.key) exactSeen.add(q.key);
      reverseSeen.add(q.reverseKey || q.key || '');
    });

    let candidates = pool.filter(q => {
      if (!q || q.key === current.key) return false;
      if (rules.avoidExactDuplicates && exactSeen.has(q.key)) return false;
      if (rules.avoidReversedDuplicates && reverseSeen.has(q.reverseKey || q.key)) return false;
      return true;
    });
    // If a very small pool is exhausted, still stay in the same family rather than
    // silently switching category. Prefer a different fact even if duplication is unavoidable.
    if (!candidates.length) candidates = pool.filter(q => q && q.key !== current.key);
    if (!candidates.length) return questions.slice();

    const rng = rngFromSeed(String(seed || '') + ':same-family-replacement');
    candidates = shuffle(candidates, rng);
    const out = questions.slice();
    out[index] = { ...candidates[0], number: index + 1 };
    return out;
  }

  function rulesSummary(inputRules) {
    const r = normalizeRules(inputRules);
    let maths = '';
    if (r.mode === 'double') maths = `doubling ${r.numberMin}-${r.numberMax}`;
    if (r.mode === 'repeated_addition') maths = `repeated addition (${r.addendMin}-${r.addendMax}, repeated ${r.repeatsMin}-${r.repeatsMax} times)`;
    if (r.mode === 'multiply') maths = `multiplication · tables ${compressNumbers(r.tables)} · factors ${r.factorMin}-${r.factorMax}`;
    if (r.mode === 'divide') maths = `exact division · tables ${compressNumbers(r.tables)} · quotients ${r.factorMin}-${r.factorMax}`;
    if (r.mode === 'mixed') maths = `mixed multiplication/division · tables ${compressNumbers(r.tables)} · ${r.multiplyPercent}% multiplication`;
    if (r.mode === 'addition') maths = `addition · answers to ${r.arithmeticMax}`;
    if (r.mode === 'add_subtract') maths = `addition/subtraction · range to ${r.arithmeticMax}`;
    if (r.mode === 'missing_number') maths = `missing-number ${r.missingNumberOperations.join('/')} · tables ${compressNumbers(r.tables)}`;
    if (r.mode === 'family_mix') maths = `mixed mental maths · ${r.families.map(f => FAMILY_LABELS[f] || f).join(', ')}`;
    if (r.progressionEnabled === false) {
      const timeSummary = r.timeEnabled === false ? 'untimed' : formatMinutes(r.timeMinutes);
      return `${r.questionCount} questions · ${maths} · ${timeSummary}`;
    }
    const advanceSummary = r.perfectAttempts === 1
      ? '1 perfect attempt to advance'
      : `${r.perfectAttempts} perfect attempts to advance${r.consecutivePerfectAttempts ? ' · consecutive' : ' · not necessarily consecutive'}`;
    return `${r.questionCount} questions · ${maths} · ${formatMinutes(r.timeMinutes)} · ${advanceSummary}`;
  }

  function instructionText(inputRules) {
    const r = normalizeRules(inputRules);
    const time = formatMinutes(r.timeMinutes);
    const solo = r.unaided ? ' Work independently and without help.' : '';
    if (r.progressionEnabled === false) {
      const opening = r.timeEnabled === false
        ? `Complete all ${r.questionCount} questions.`
        : `Try to complete all ${r.questionCount} questions in ${time}.`;
      return `${opening}${solo}`.replace(/\s+/g, ' ').trim();
    }
    let advance;
    if (r.perfectAttempts === 1) {
      advance = 'A perfect score moves you to the next club.';
    } else {
      const countPhrase = r.perfectAttempts === 2 ? 'twice' : `${numberWord(r.perfectAttempts)} times`;
      if (r.consecutivePerfectAttempts) {
        advance = `Get a perfect score ${countPhrase} in a row to move to the next club.`;
      } else {
        advance = `Get a perfect score ${countPhrase} to move to the next club. The perfect scores do not need to be consecutive.`;
      }
    }
    return `Try to complete all ${r.questionCount} questions in ${time}.${solo} ${advance}`.replace(/\s+/g, ' ').trim();
  }

  function formatMinutes(v) {
    const n = Number(v);
    if (n < 1) return `${Math.round(n * 60)} seconds`;
    return Number.isInteger(n) ? `${n} ${n === 1 ? 'minute' : 'minutes'}` : `${n} minutes`;
  }

  function numberWord(n) {
    return ({1:'once',2:'twice',3:'three',4:'four',5:'five'})[n] || String(n);
  }

  function compressNumbers(nums) {
    const a = [...nums].sort((x,y)=>x-y);
    if (!a.length) return 'none';
    const chunks = [];
    let start = a[0], prev = a[0];
    for (let i = 1; i <= a.length; i += 1) {
      const cur = a[i];
      if (cur === prev + 1) { prev = cur; continue; }
      chunks.push(start === prev ? String(start) : `${start}-${prev}`);
      start = cur; prev = cur;
    }
    return chunks.join(', ');
  }

  const api = {
    CLASSIC_PRESETS, CHALLENGE_PRESETS, OPEN_WORKSHEET_PRESET, SCHEME_PRESETS, FAMILY_META, FAMILY_LABELS, FAMILY_ORDER, FAMILY_COMPACT_ORDER,
    clone, normalizeRules, generateQuestions, shuffleQuestions,
    replaceQuestion, questionByKey, questionPoolIndex, questionByPoolIndex, questionPool, rulesSummary, instructionText, newSeed, rngFromSeed, compressNumbers
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TT99Generator = api;
}(typeof window !== 'undefined' ? window : globalThis));
