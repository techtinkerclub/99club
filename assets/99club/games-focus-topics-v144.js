/* 99 Club Studio · Games teaching-focus topics v1.44
 * Granular teacher-facing topics layered over the existing broad generator strands.
 * Keeps legacy generator topic IDs intact to avoid changing puzzle maths unexpectedly.
 */
(function(global){
'use strict';
const G=global.TT99Games;if(!G||G.__focusTopicsV144)return;

const FOCUS_GROUPS=[
  {id:'number',label:'Number'},
  {id:'calculation',label:'Calculation'},
  {id:'fractions',label:'Fractions, decimals & ratio'},
  {id:'measurement',label:'Measurement'},
  {id:'geometry',label:'Geometry & spatial reasoning'},
  {id:'patterns',label:'Statistics, patterns & algebra'}
];
const FOCUS_TOPICS={
  place_value:{label:'Place value & number order',group:'number',parent:'number_place_value',years:[1,2,3,4,5,6]},
  factors_multiples:{label:'Factors, multiples & primes',group:'number',parent:'number_place_value',years:[3,4,5,6]},
  square_numbers:{label:'Square numbers',group:'number',parent:'number_place_value',years:[4,5,6]},
  addition_subtraction:{label:'Addition & subtraction',group:'calculation',parent:'calculation',years:[1,2,3,4,5,6]},
  multiplication_division:{label:'Multiplication & division',group:'calculation',parent:'calculation',years:[2,3,4,5,6]},
  inverse_missing:{label:'Inverse & missing-number relationships',group:'calculation',parent:'calculation',years:[2,3,4,5,6]},
  mixed_calculation:{label:'Mixed mental calculation',group:'calculation',parent:'calculation',years:[2,3,4,5,6]},
  fractions:{label:'Fractions',group:'fractions',parent:'fractions',years:[1,2,3,4,5,6]},
  decimals_percentages:{label:'Decimals & percentages',group:'fractions',parent:'decimals_percentages',years:[4,5,6]},
  ratio_scale:{label:'Ratio & scale',group:'fractions',parent:'ratio_proportion',years:[6]},
  measures_units:{label:'Measures & unit conversions',group:'measurement',parent:'measurement',years:[2,3,4,5,6]},
  angles_turns:{label:'Angles & turns',group:'geometry',parent:'geometry',years:[2,3,4,5,6]},
  area_rectangles:{label:'Area, rectangles & factor pairs',group:'geometry',parent:'geometry',years:[3,4,5,6]},
  spatial_grids:{label:'Shape, space & grid reasoning',group:'geometry',parent:'geometry',years:[1,2,3,4,5,6]},
  statistics_averages:{label:'Statistics & averages',group:'patterns',parent:'statistics',years:[2,3,4,5,6]},
  sequences_patterns:{label:'Sequences & patterns',group:'patterns',parent:'algebra',years:[2,3,4,5,6]},
  algebra_equations:{label:'Algebra & equations',group:'patterns',parent:'algebra',years:[5,6]}
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
function focusAllowedForYear(id,yearFilter){const ys=FOCUS_TOPICS[id]?.years||[];return ys.includes(Number(yearFilter));}

for(const [id,e] of Object.entries(G.ENGINES||{})){
  const explicit=ENGINE_FOCUS[id];
  if(explicit){e.focusTopics=validFocus(explicit);continue;}
  e.focusTopics=ALL.filter(fid=>{
    const parent=FOCUS_TOPICS[fid].parent;
    return ['excellent','reasonable'].includes(e.compatibility?.[parent]);
  });
}

const baseNormalize=G.normalizeSettings.bind(G);
const baseCompatible=G.compatibleEngines.bind(G);
const baseGeneratePack=G.generatePack.bind(G);
G.normalizeSettings=function(input={}){
  const raw={...(input||{})};
  let yearFilter=global.__tt99PendingGameYearFilter;
  if(yearFilter===undefined||yearFilter===null){
    if(raw.yearFilter!==undefined)yearFilter=Number(raw.yearFilter);
    else yearFilter=Number(raw.maxYear)||Number(raw.minYear)||4;
  }
  yearFilter=Math.max(1,Math.min(6,Number(yearFilter)||4));
  raw.minYear=yearFilter;raw.maxYear=yearFilter;
  let base=baseNormalize(raw);
  let focus=validFocus(global.__tt99PendingGameFocusTopics||raw.focusTopics);
  if(!focus.length)focus=migrateFromParents(base.topics);
  const pruned=focus.filter(id=>focusAllowedForYear(id,yearFilter));if(pruned.length)focus=pruned;
  const parents=parentsForFocus(focus);if(parents.length)base.topics=parents;
  base.focusTopics=focus;
  base.yearFilter=yearFilter;
  return base;
};
G.compatibleEngines=function(settings){
  const s=G.normalizeSettings(settings),base=new Set(baseCompatible(s)),focus=new Set(s.focusTopics||[]);
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

G.FOCUS_TOPICS=FOCUS_TOPICS;G.FOCUS_GROUPS=FOCUS_GROUPS;G.focusParents=parentsForFocus;G.focusAllowedForYear=focusAllowedForYear;G.__focusTopicsV144=true;
})(typeof globalThis!=='undefined'?globalThis:this);
