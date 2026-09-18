/* 99 Club Studio v1.19 maintainer smoke test.
 * Run from repository root with: node assets/99club/tests/smoke.js
 */
'use strict';
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const G=require(path.join(ROOT,'generator.js'));
const L=require(path.join(ROOT,'pdf-layout.js'));
const P=require(path.join(ROOT,'simple-pdf.js'));

function assert(condition,message){if(!condition)throw new Error(message);}
const profiles={
  1:{curriculumYear:1,wholeNumberMax:100,arithmeticMax:20,arithmeticOperandMax:20,tables:[2,5,10],factorMax:10,fractionDenominators:[2,4],fractionQuantityMax:40,coordinateFourQuadrants:false},
  2:{curriculumYear:2,wholeNumberMax:100,arithmeticMax:100,arithmeticOperandMax:100,tables:[2,5,10],factorMax:12,fractionDenominators:[2,3,4],fractionQuantityMax:100,coordinateFourQuadrants:false},
  3:{curriculumYear:3,wholeNumberMax:1000,arithmeticMax:1000,arithmeticOperandMax:1000,tables:[2,3,4,5,8,10],factorMax:12,fractionDenominators:[2,3,4,5,8,10],fractionQuantityMax:240,romanMax:12,coordinateFourQuadrants:false},
  4:{curriculumYear:4,wholeNumberMax:10000,arithmeticMax:5000,arithmeticOperandMax:5000,tables:Array.from({length:12},(_,i)=>i+1),factorMax:12,fractionDenominators:[2,3,4,5,6,8,10,12],fractionQuantityMax:500,decimalPlacesMax:2,decimalWholeMax:100,coordinateFourQuadrants:false},
  5:{curriculumYear:5,wholeNumberMax:1000000,arithmeticMax:5000,arithmeticOperandMax:5000,tables:Array.from({length:12},(_,i)=>i+1),factorMax:12,fractionDenominators:[2,3,4,5,6,8,10,12],fractionQuantityMax:1000,decimalPlacesMax:3,decimalWholeMax:1000,romanMax:1000,coordinateMax:20,coordinateFourQuadrants:false},
  6:{curriculumYear:6,wholeNumberMax:10000000,arithmeticMax:5000,arithmeticOperandMax:5000,tables:Array.from({length:12},(_,i)=>i+1),factorMax:12,fractionDenominators:[2,3,4,5,6,8,10,12],fractionQuantityMax:2000,decimalPlacesMax:3,decimalWholeMax:1000,ratioPartMax:10,ratioQuantityMax:360,coordinateMax:20,coordinateFourQuadrants:true,statsValueMax:60}
};

const failures=[];
for(const family of G.FAMILY_ORDER){
  try{
    const meta=G.FAMILY_META[family]||{};
    const year=(meta.years||[])[0]||0;
    let rules=G.clone(G.OPEN_WORKSHEET_PRESET);
    Object.assign(rules,profiles[year]||{}, {families:[family],familyWeights:{[family]:1},questionCount:Math.min(8,year?8:5),progressionEnabled:false});
    rules=G.normalizeRules(rules);
    const pool=G.questionPool(family,rules);
    assert(pool.length>0,`${family}: empty question pool`);
    const qs=G.generateQuestions(rules,`smoke-${family}`);
    assert(qs.length===rules.questionCount,`${family}: generated ${qs.length}/${rules.questionCount}`);
    assert(qs.every(q=>q.kind===family),`${family}: wrong family returned`);
    assert(qs.every(q=>q.prompt!==undefined && q.answer!==undefined),`${family}: missing prompt/answer`);
  }catch(err){failures.push(err.message);}
}

for(let year=1;year<=6;year++){
  try{
    const families=G.FAMILY_ORDER.filter(f=>(G.FAMILY_META[f]?.years||[]).includes(year)&&!G.FAMILY_META[f]?.extension);
    assert(families.length>0,`Year ${year}: no year-starting-selection families`);
    let rules=G.clone(G.OPEN_WORKSHEET_PRESET);
    Object.assign(rules,profiles[year],{families,familyWeights:Object.fromEntries(families.map(f=>[f,1])),questionCount:60,progressionEnabled:false});
    rules=G.normalizeRules(rules);
    const started=Date.now();
    const qs=G.generateQuestions(rules,`smoke-year-${year}`);
    assert(qs.length===60,`Year ${year}: generated ${qs.length}/60`);
    assert(Date.now()-started<3000,`Year ${year}: generation unexpectedly slow`);
  }catch(err){failures.push(err.message);}
}

try{
  const classic=G.normalizeRules(G.SCHEME_PRESETS.classic.presets['33']);
  assert(classic.perfectAttempts===3,'Classic default should require 3 perfect attempts');
  assert(classic.consecutivePerfectAttempts===false,'Classic default attempts should not need to be consecutive');
  const classicInstruction=G.instructionText(classic);
  assert(/three times/i.test(classicInstruction) && /do not need to be consecutive/i.test(classicInstruction),'Classic pupil instruction does not match default progression rule');

  const open=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,questionCount:12,timeEnabled:false});
  assert(open.families.length===0,'Custom Worksheet should start with no topics selected');
  assert(G.generateQuestions(open,'blank-custom').length===0,'Blank Custom Worksheet should generate zero questions without error');
  assert(!/next club|perfect score/i.test(G.instructionText(open)),'Custom Worksheet instruction leaked Club progression wording');

  assert((G.FAMILY_META.volume.years||[]).join(',')==='6','Cuboid volume should be Year 6 text family only');
  assert((G.FAMILY_META.angle_sums.years||[]).join(',')==='6','Formal angle sums should be Year 6 text family only');
  assert(G.FAMILY_META.square_root.extension===true,'Square roots must remain extension');
  assert(G.FAMILY_META.rounding_custom.extension===true,'Non-standard rounding must remain extension');
  assert(!G.FAMILY_ORDER.includes('word_problems'),'Contextual story word problems must not be exposed in the active catalogue');
  assert(!G.FAMILY_ORDER.includes('data_table_questions'),'Pseudo text-data interpretation must not be exposed in the active catalogue');
  assert((G.FAMILY_COMPACT_ORDER||[]).includes('data_table_questions'),'Retired text-data compact index should remain stable for pre-release recreation compatibility');
  assert(G.questionPool('data_table_questions',G.OPEN_WORKSHEET_PRESET).length===0,'Retired pseudo-data generator should not produce questions');
  assert(G.FAMILY_LABELS.pie_chart_angles==='pie-chart angle calculations','Pie-chart calculation family label should be explicit');
  assert((G.FAMILY_COMPACT_ORDER||[]).includes('word_problems'),'Retired word-problem compact index should remain available for pre-release recreation compatibility');
  assert(G.questionPool('word_problems',G.OPEN_WORKSHEET_PRESET).length===0,'Retired word-problem generator should not produce questions');
  const migrated=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:['word_problems'],familyWeights:{word_problems:1}});
  assert(!migrated.families.includes('word_problems'),'Old saved setups should migrate away from the retired word-problem family');
  const roundPool=G.questionPool('rounding_whole',G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,curriculumYear:3,families:['rounding_whole']}));
  assert(roundPool.some(q=>/nearest/i.test(q.prompt)),'Direct mathematical text prompts such as rounding instructions must remain available');

  const noteRules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,questionCount:8});
  const noteSheet={seed:'note-test-V1',code:'WKS-G1-TEST-A',questions:G.generateQuestions(noteRules,'note-test-V1')};
  const noteText='Used for a short decimal recap before the lesson. Revisit place value if needed.';
  const answerSvg=L.renderPreviewSvg({rules:noteRules,sheet:noteSheet,answers:true,teacherNote:noteText});
  const pupilSvg=L.renderPreviewSvg({rules:noteRules,sheet:noteSheet,answers:false,teacherNote:noteText});
  assert(/Teacher note/.test(answerSvg) && /decimal recap/.test(answerSvg),'Teacher note should print on answer-sheet preview');
  assert(!/Teacher note/.test(pupilSvg) && !/decimal recap/.test(pupilSvg),'Teacher note must never appear on pupil worksheet preview');

  assert(L.getColumns(24,'portrait',true)===2,'Custom 24-question portrait sheet should use 2 columns');
  assert(L.getColumns(24,'landscape',true)===3,'Custom 24-question landscape sheet should use 3 columns');
  assert(L.getColumns(33,'portrait',false)===3,'Classic 33 portrait column count changed');
  assert(P.asciiish('a→b ↔ c − d ≈ e')==='a->b <-> c - d ~ e','PDF mathematical ASCII fallbacks are incorrect');
  const fs=require('fs');
  const appSource=fs.readFileSync(path.join(ROOT,'app.js'),'utf8');
  const helpSource=fs.readFileSync(path.resolve(ROOT,'../../_pages/99-club-help.md'),'utf8');
  assert(/POST99_EXTRA_GROUPS/.test(appSource),'Post-99 extras registry missing');
  for(const family of ['add_sub_missing','negative_numbers','roman_numerals','decimal_scale','metric_conversion','time_duration','money','fraction_of','percentage_of','factor_check','square','cube','bodmas','angle_facts','ratio_missing','mean']) assert(appSource.includes(`'${family}'`),`Expected post-99 extra missing from registry: ${family}`);
  assert(!/POST99_EXTRA_GROUPS[\s\S]{0,5000}'decimal_compare'/.test(appSource),'Decimal comparison must not be a 99 Club post-99 extra');
  assert(!/POST99_EXTRA_GROUPS[\s\S]{0,5000}'area'/.test(appSource),'Area must not be a 99 Club post-99 extra');
  assert(/target=\"_blank\" rel=\"noopener\"/.test(appSource),'Main Help link should open safely in a new tab');

}catch(err){failures.push(err.message);}

if(failures.length){
  console.error(`99 Club Studio smoke test FAILED (${failures.length})`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(2);
}
console.log(`99 Club Studio smoke test passed: ${G.FAMILY_ORDER.length} base families + Year 1–6 generation profiles + blank Custom Worksheet + progression/PDF invariants.`);
