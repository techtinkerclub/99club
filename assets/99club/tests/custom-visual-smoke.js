/* 99 Club Studio v1.22.2 Custom Worksheet visual smoke test.
 * Run from repository root with: node assets/99club/tests/custom-visual-smoke.js
 */
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const G=require(path.join(ROOT,'generator.js'));
const P=require(path.join(ROOT,'simple-pdf.js'));
const L=require(path.join(ROOT,'pdf-layout.js'));
globalThis.TT99Generator=G;globalThis.TT99SimplePDF=P;globalThis.TT99PDFLayout=L;
require(path.join(ROOT,'custom-graphs.js'));
require(path.join(ROOT,'custom-coordinates.js'));
require(path.join(ROOT,'custom-piecharts.js'));
require(path.join(ROOT,'custom-angles.js'));
const C=globalThis.TT99CustomCoordinates;
const PC=globalThis.TT99CustomPieCharts;
function assert(ok,msg){if(!ok)throw new Error(msg);}
const expected={coordinates_y4:[72,12],transformations_y5:[54,9],coordinates_y6:[108,18],coordinates_extension:[24,4]};
const graphExpected=[['bar_charts',3,68,17],['bar_charts',4,116,29],['time_graphs',4,44,11],['line_graphs',5,80,20],['line_graphs',6,104,26]];
for(const [family,year,poolCount,typeCount] of graphExpected){const rules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:[family],familyWeights:{[family]:1},questionCount:8,progressionEnabled:false,curriculumYear:year});const pool=G.questionPool(family,rules);assert(pool.length===poolCount,`${family} Y${year}: graph pool regression`);assert(new Set(pool.map(q=>q.graphTypeId)).size===typeCount,`${family} Y${year}: graph subtype regression`);}
for(const [family,[poolCount,typeCount]] of Object.entries(expected)){
  const year=(C.COORD_FAMILIES[family].years||[])[0]||0;
  const rules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:[family],familyWeights:{[family]:1},questionCount:24,progressionEnabled:false,curriculumYear:year});
  const pool=G.questionPool(family,rules);
  assert(pool.length===poolCount,`${family}: pool ${pool.length}/${poolCount}`);
  assert(new Set(pool.map(q=>q.coordinateTypeId)).size===typeCount,`${family}: subtype count`);
  assert(pool.every(q=>C.validateVisual(q.visual).ok),`${family}: invalid visual bounds`);
  for(let seed=0;seed<100;seed++){
    const a=G.generateQuestions(rules,`coord-smoke-${seed}`),b=G.generateQuestions(rules,`coord-smoke-${seed}`);
    assert(a.length===24,`${family}: short generation`);assert(JSON.stringify(a)===JSON.stringify(b),`${family}: nondeterministic`);
  }
}

const pieExpected={pie_charts_y6:[336,21],pie_charts_reasoning_y6:[176,11],pie_charts_extension:[80,5]};
for(const [family,[poolCount,typeCount]] of Object.entries(pieExpected)){
  const rules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:[family],familyWeights:{[family]:1},questionCount:24,progressionEnabled:false,curriculumYear:6});
  const pool=G.questionPool(family,rules);
  assert(pool.length===poolCount,`${family}: pie pool ${pool.length}/${poolCount}`);
  assert(new Set(pool.map(q=>q.pieTypeId)).size===typeCount,`${family}: pie subtype count`);
  assert(pool.every(q=>PC.validateVisual(q.visual).ok),`${family}: invalid pie visual`);

  const sigs=new Set(pool.map(q=>q.visualSignature).filter(Boolean));
  assert(sigs.size>=8,`${family}: insufficient pie visual archetype diversity (${sigs.size})`);
  for(let seed=0;seed<100;seed++){
    const a=G.generateQuestions(rules,`pie-smoke-${family}-${seed}`),b=G.generateQuestions(rules,`pie-smoke-${family}-${seed}`);
    assert(a.length===24,`${family}: short generation`);assert(JSON.stringify(a)===JSON.stringify(b),`${family}: nondeterministic`);
  }
}

const angleFamilies=Object.keys(globalThis.TT99CustomAngles.ANGLE_FAMILIES);
for(const family of angleFamilies){const rules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:[family],familyWeights:{[family]:1},questionCount:12,progressionEnabled:false,curriculumYear:0});const pool=G.questionPool(family,rules);assert(pool.length===globalThis.TT99CustomAngles.TYPES_BY_FAMILY[family].length*4,`${family}: angle pool regression`);assert(pool.every(q=>globalThis.TT99CustomAngles.validateVisual(q.visual).ok),`${family}: invalid angle visual`);}

const mixedFamilies=['addition','bar_charts','time_graphs','line_graphs','coordinates_y4','transformations_y5','coordinates_y6','coordinates_extension','pie_charts_y6','pie_charts_reasoning_y6','pie_charts_extension',...angleFamilies];
for(let seed=0;seed<25;seed++){
  const rules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:mixedFamilies,familyWeights:Object.fromEntries(mixedFamilies.map(f=>[f,1])),questionCount:60,progressionEnabled:false,curriculumYear:0});
  assert(G.generateQuestions(rules,`mixed-${seed}`).length===60,'mixed visual sheet short');
}
const app=fs.readFileSync(path.join(ROOT,'custom-app.js'),'utf8');
const graphs=fs.readFileSync(path.join(ROOT,'custom-graphs.js'),'utf8');
assert(!/data-family-preset/.test(app),'Year/Core quick-select controls should be removed');
assert(/tt99-clear-all-families/.test(app),'Clear-all topic control missing');
assert(/data-clear-family-strand/.test(app),'Per-category clear control missing');
assert(!/list\.length<=8\s*&&\s*selected>0/.test(app),'Selected categories must not auto-open themselves');
assert(!/MutationObserver/.test(graphs),'Graph module must not mutate/observe Custom UI');
assert((globalThis.TT99VisualPalette?.series||[]).length>=6,'Shared visual colour palette missing');
assert(G.FAMILY_META.pie_charts_y6?.visual===true,'Pie chart visual family not registered');
assert(G.FAMILY_META.pie_chart_angles?.extension===true,'Old text-only pie angle family should be moved to Extension');
const pieRules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:['pie_charts_y6'],familyWeights:{pie_charts_y6:1},questionCount:8,progressionEnabled:false,curriculumYear:6});
const pieSheet={seed:'pie-preview',code:'WKS-G1-PIE-A',questions:G.generateQuestions(pieRules,'pie-preview')};
const pieSvg=L.renderPreviewSvg({rules:pieRules,sheet:pieSheet,answers:false,orientation:'portrait'});
const pieAnsSvg=L.renderPreviewSvg({rules:pieRules,sheet:pieSheet,answers:true,orientation:'portrait'});
assert(/<polygon/.test(pieSvg),'Pie preview should contain sector polygons');
assert(/rgb\(/.test(pieSvg),'Pie preview should contain restrained colour fills');
assert(/ANSWER KEY|Answer:/.test(pieAnsSvg),'Pie answer preview missing teacher answer state');
const pieDoc=L.buildDocument({rules:pieRules,sheets:[pieSheet],kind:'both',orientation:'portrait',school:{}});
const pieBytes=pieDoc.outputBytes();
assert(pieBytes.length>5000,'Pie PDF document unexpectedly small');
// Response-space + explanation-marking contract (v1.22).
const VG=globalThis.TT99CustomGraphs;
assert(typeof VG.responseSpec==='function'&&typeof VG.markingGuidanceLines==='function','Shared response/marking helpers missing');
const inferred=VG.responseSpec({prompt:'Explain why the answer is correct.',marking:{mode:'exact'}});
assert(inferred&&inferred.size==='M','Explain prompt should automatically reserve response space');
assert(VG.responseSpec({prompt:'Why?',choices:['A','B'],marking:{mode:'multiple-choice'}})===null,'MCQ should not gain a free-response box automatically');
const rubricPools=[];
for(const family of G.FAMILY_ORDER.filter(f=>G.FAMILY_META[f]?.visual)){
  const rules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:[family],familyWeights:{[family]:1},questionCount:8,progressionEnabled:false,curriculumYear:0});
  for(const item of G.questionPool(family,rules))if(item.marking?.mode==='rubric')rubricPools.push(item);
}
assert(rubricPools.length>0,'Expected rubric-marked Custom questions');
for(const item of rubricPools){assert(item.marking.rule,`${item.key}: rubric rule missing`);assert(Array.isArray(item.marking.criteria)&&item.marking.criteria.length,`${item.key}: rubric criteria missing`);}
const reasoningItem=rubricPools.find(q=>/Explain/i.test(q.prompt))||rubricPools[0];
const responseRules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:[reasoningItem.kind],familyWeights:{[reasoningItem.kind]:1},questionCount:1,progressionEnabled:false,curriculumYear:0,worksheetTitle:'Reasoning response QA'});
const responseSheet={seed:'response-space',code:'RESP-QA',questions:[{...reasoningItem,number:1}]};
const responseStudent=L.renderPreviewSvg({rules:responseRules,sheet:responseSheet,answers:false,orientation:'portrait'});
const responseTeacher=L.renderPreviewSvg({rules:responseRules,sheet:responseSheet,answers:true,orientation:'portrait'});
assert(/Explain|reasoning|working/i.test(responseStudent),'Reasoning question should show a labelled pupil response frame');
assert(/Marking guide/.test(responseTeacher),'Teacher answer should show rubric marking guidance');
assert(/Equivalent wording|Mark correct/i.test(responseTeacher),'Teacher rubric should state an explicit acceptance rule');
// The enhanced compositor must also work for future text-only Custom reasoning questions.
const textReason={kind:'future_custom_reasoning',prompt:'Explain why 12 is even.',answer:'12 is divisible by 2.',number:1,key:'future:text:1',marking:{mode:'rubric',answer:'12 is divisible by 2.',rule:'Mark correct if the explanation gives a valid even-number reason. Equivalent wording is acceptable.',criteria:['States that 12 can be divided by 2 with no remainder.']}};
const textSheet={seed:'text-response',code:'TEXT-R',questions:[textReason]};
const textStudent=L.renderPreviewSvg({rules:{...responseRules,questionCount:1},sheet:textSheet,answers:false,orientation:'portrait'});
const textTeacher=L.renderPreviewSvg({rules:{...responseRules,questionCount:1},sheet:textSheet,answers:true,orientation:'portrait'});
assert(/Explain your reasoning|Write your reasoning/.test(textStudent),'Text-only reasoning should receive a response frame');
assert(/Marking guide/.test(textTeacher),'Text-only reasoning should receive teacher rubric guidance');
const measureRules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:['angles_degrees_y5'],familyWeights:{angles_degrees_y5:1},questionCount:1,progressionEnabled:false,curriculumYear:5});
const measure=G.questionPool('angles_degrees_y5',measureRules).find(q=>q.angleTypeId==='ang_y5_measure_angle_actual_size');
const measureTeacher=L.renderPreviewSvg({rules:measureRules,sheet:{seed:'measure',code:'MEASURE',questions:[{...measure,number:1}]},answers:true,orientation:'portrait'});
assert(/Accept .*±2°/.test(measureTeacher),'Physical angle question should print its explicit ±2° teacher tolerance');

const blank=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET});
assert(blank.families.length===0,'Custom Worksheet should default to zero topics');
assert(G.generateQuestions(blank,'blank').length===0,'Blank state should be safe to generate internally');
console.log('Custom visual smoke test passed: blank-canvas UX + graphs + 258 coordinate entries / 43 subtypes + 592 pie entries / 37 subtypes + 416 angle entries / 104 active subtypes + mixed visual generation + response-space/rubric marking contract.');
