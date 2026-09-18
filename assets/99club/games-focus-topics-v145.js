/* 99 Club Studio · Games teaching-focus topics v1.45
 * Teacher-facing selection is topic-led: no Year filter.
 * Legacy year values remain internal only as an automatic generation scale for
 * older puzzle engines that still use maxYear to choose number ranges/sizes.
 */
(function(global){
'use strict';
const G=global.TT99Games;if(!G||G.__focusTopicsV145)return;

const FOCUS_GROUPS=[
  {id:'number',label:'Number'},
  {id:'calculation',label:'Calculation'},
  {id:'fractions',label:'Fractions, decimals & ratio'},
  {id:'measurement',label:'Measurement'},
  {id:'geometry',label:'Geometry & spatial reasoning'},
  {id:'patterns',label:'Statistics, patterns & algebra'}
];
// `level` is an internal generation scale only. It is deliberately not shown
// to teachers and is not a curriculum/year claim.
const FOCUS_TOPICS={
  place_value:{label:'Place value & number order',group:'number',parent:'number_place_value',level:4},
  factors_multiples:{label:'Factors, multiples & primes',group:'number',parent:'number_place_value',level:5},
  square_numbers:{label:'Square numbers',group:'number',parent:'number_place_value',level:5},
  addition_subtraction:{label:'Addition & subtraction',group:'calculation',parent:'calculation',level:3},
  multiplication_division:{label:'Multiplication & division',group:'calculation',parent:'calculation',level:4},
  inverse_missing:{label:'Inverse & missing-number relationships',group:'calculation',parent:'calculation',level:4},
  mixed_calculation:{label:'Mixed mental calculation',group:'calculation',parent:'calculation',level:4},
  fractions:{label:'Fractions',group:'fractions',parent:'fractions',level:4},
  decimals_percentages:{label:'Decimals & percentages',group:'fractions',parent:'decimals_percentages',level:5},
  ratio_scale:{label:'Ratio & scale',group:'fractions',parent:'ratio_proportion',level:6},
  measures_units:{label:'Measures & unit conversions',group:'measurement',parent:'measurement',level:4},
  angles_turns:{label:'Angles & turns',group:'geometry',parent:'geometry',level:5},
  area_rectangles:{label:'Area, rectangles & factor pairs',group:'geometry',parent:'geometry',level:4},
  spatial_grids:{label:'Shape, space & grid reasoning',group:'geometry',parent:'geometry',level:4},
  statistics_averages:{label:'Statistics & averages',group:'patterns',parent:'statistics',level:4},
  sequences_patterns:{label:'Sequences & patterns',group:'patterns',parent:'algebra',level:6},
  algebra_equations:{label:'Algebra & equations',group:'patterns',parent:'algebra',level:6}
};
const ALL=Object.keys(FOCUS_TOPICS);
const ENGINE_FOCUS={
  wordsearch:ALL,crossword:ALL,
  pyramid:['addition_subtraction','inverse_missing','mixed_calculation'],
  magic:['addition_subtraction','mixed_calculation','decimals_percentages','sequences_patterns'],
  sudoku:['place_value','spatial_grids','sequences_patterns'],
  arithmagon:['addition_subtraction','multiplication_division','inverse_missing','mixed_calculation'],
  magicshape:['addition_subtraction','mixed_calculation'],
  maze:['place_value','addition_subtraction','multiplication_division','mixed_calculation','fractions','decimals_percentages','ratio_scale','measures_units','angles_turns','statistics_averages','algebra_equations'],
  propertymaze:['place_value','factors_multiples','square_numbers'],
  crossnumber:['place_value','addition_subtraction','multiplication_division','inverse_missing','mixed_calculation','fractions','decimals_percentages','ratio_scale','measures_units','angles_turns','statistics_averages','algebra_equations'],
  numbersearch:['place_value','addition_subtraction','multiplication_division','mixed_calculation','fractions','decimals_percentages','ratio_scale','measures_units','angles_turns','statistics_averages','algebra_equations'],
  equationcrossgrid:['addition_subtraction','multiplication_division','inverse_missing','algebra_equations'],
  numbertrail:['place_value','addition_subtraction','multiplication_division','sequences_patterns'],
  target:['addition_subtraction','multiplication_division','mixed_calculation'],
  brokencalc:['addition_subtraction','multiplication_division','mixed_calculation','inverse_missing'],
  operationgrid:['addition_subtraction','multiplication_division','inverse_missing','mixed_calculation'],
  numberwheels:['addition_subtraction','multiplication_division','inverse_missing','mixed_calculation'],
  functionmachine:['inverse_missing','sequences_patterns','algebra_equations'],
  balance:['inverse_missing','algebra_equations'],
  kakuro:['addition_subtraction','mixed_calculation'],
  futoshiki:['place_value','spatial_grids'],
  arithmeticcages:['addition_subtraction','multiplication_division','mixed_calculation','algebra_equations'],
  nonogram:['spatial_grids','sequences_patterns'],
  numberpath:['place_value','sequences_patterns'],
  sumplete:['addition_subtraction','mixed_calculation'],
  numbertowers:['place_value','spatial_grids'],
  takuzu:['sequences_patterns','spatial_grids'],
  killersudoku:['place_value','addition_subtraction','mixed_calculation'],
  hashi:['spatial_grids'],
  mathsmines:['addition_subtraction','spatial_grids'],
  alphametics:['place_value','addition_subtraction','algebra_equations'],
  shikaku:['factors_multiples','multiplication_division','area_rectangles','spatial_grids']
};

function validFocus(ids){return [...new Set((Array.isArray(ids)?ids:[]).filter(id=>FOCUS_TOPICS[id]))];}
function migrateFromParents(parents){
  const p=new Set(parents||[]),out=[];
  if(p.has('number_place_value'))out.push('place_value','factors_multiples','square_numbers');
  if(p.has('calculation'))out.push('addition_subtraction','multiplication_division','inverse_missing','mixed_calculation');
  if(p.has('fractions'))out.push('fractions');
  if(p.has('decimals_percentages'))out.push('decimals_percentages');
  if(p.has('ratio_proportion'))out.push('ratio_scale');
  if(p.has('measurement'))out.push('measures_units');
  if(p.has('geometry'))out.push('angles_turns','area_rectangles','spatial_grids');
  if(p.has('statistics'))out.push('statistics_averages');
  if(p.has('algebra'))out.push('sequences_patterns','algebra_equations');
  return validFocus(out.length?out:['addition_subtraction','multiplication_division']);
}
function parentsForFocus(ids){return [...new Set(validFocus(ids).map(id=>FOCUS_TOPICS[id].parent))];}
function generationLevel(ids){
  const levels=validFocus(ids).map(id=>Number(FOCUS_TOPICS[id].level)||4);
  return Math.max(1,Math.min(6,levels.length?Math.max(...levels):4));
}
for(const [id,e] of Object.entries(G.ENGINES||{})){
  const explicit=ENGINE_FOCUS[id];
  if(explicit){e.focusTopics=validFocus(explicit);continue;}
  e.focusTopics=ALL.filter(fid=>['excellent','reasonable'].includes(e.compatibility?.[FOCUS_TOPICS[fid].parent]));
}

const baseNormalize=G.normalizeSettings.bind(G);
const baseCompatible=G.compatibleEngines.bind(G);
const baseGeneratePack=G.generatePack.bind(G);
G.normalizeSettings=function(input={}){
  const raw={...(input||{})};
  let focus=validFocus(global.__tt99PendingGameFocusTopics||raw.focusTopics);
  if(!focus.length)focus=migrateFromParents(raw.topics);
  const level=generationLevel(focus);
  // Older engines still consult maxYear. Keep a broad lower bound so vocabulary
  // and prerequisite content remain available while maxYear supplies scale.
  raw.minYear=1;raw.maxYear=level;
  let base=baseNormalize(raw);
  const parents=parentsForFocus(focus);if(parents.length)base.topics=parents;
  base.focusTopics=focus;
  base.generationLevel=level;
  base.yearFilter=0;
  base.hideYearLabel=true;
  return base;
};
G.compatibleEngines=function(settings){
  const s=G.normalizeSettings(settings),focus=new Set(s.focusTopics||[]);
  // Compatibility is topic-led now. Do not let a legacy engine's year gate hide
  // an otherwise suitable game; the automatic generation scale is applied later.
  const base=new Set(baseCompatible({...s,minYear:1,maxYear:6}));
  return [...base].filter(id=>{
    const allowed=G.ENGINES?.[id]?.focusTopics||[];
    return !focus.size||allowed.some(t=>focus.has(t));
  });
};
G.selectedCompatibleEngines=function(settings){
  const s=G.normalizeSettings(settings),allowed=new Set(G.compatibleEngines(s));
  return (s.selectedEngines||[]).filter(id=>allowed.has(id));
};
G.generatePack=function(settings,seed='games',customVocabulary=[]){
  const s=G.normalizeSettings(settings),allowed=new Set(G.compatibleEngines(s));
  const safe={...s,selectedEngines:(s.selectedEngines||[]).filter(id=>allowed.has(id))};
  return baseGeneratePack(safe,seed,customVocabulary);
};

G.FOCUS_TOPICS=FOCUS_TOPICS;G.FOCUS_GROUPS=FOCUS_GROUPS;G.focusParents=parentsForFocus;G.focusGenerationLevel=generationLevel;G.__focusTopicsV145=true;
})(typeof globalThis!=='undefined'?globalThis:this);
