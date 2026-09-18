/* 99 Club Studio v1.22 Angles Stage 1 smoke/regression test. */
'use strict';
const fs=require('fs');const path=require('path');const ROOT=path.resolve(__dirname,'..');
const G=require(path.join(ROOT,'generator.js'));const P=require(path.join(ROOT,'simple-pdf.js'));const L=require(path.join(ROOT,'pdf-layout.js'));
globalThis.TT99Generator=G;globalThis.TT99SimplePDF=P;globalThis.TT99PDFLayout=L;
require(path.join(ROOT,'custom-graphs.js'));require(path.join(ROOT,'custom-coordinates.js'));require(path.join(ROOT,'custom-piecharts.js'));require(path.join(ROOT,'custom-angles.js'));
const A=globalThis.TT99CustomAngles;function assert(ok,msg){if(!ok)throw new Error(msg);}
assert(A&&A.CATALOGUE.length===104,'Angle catalogue must contain 104 active reliability-reviewed subtypes');
const expected={angles_turns_y1_2:[60,15],angles_right_y3:[64,16],angles_compare_y4:[68,17],angles_degrees_y5:[68,17],angles_lines_points_y5_6:[48,12],angles_triangles_y6:[36,9],angles_quads_polygons_y6:[48,12],angles_reasoning_y5_6:[24,6]};
let generated=0;
for(const [family,[poolCount,typeCount]] of Object.entries(expected)){
  const rules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:[family],familyWeights:{[family]:1},questionCount:24,progressionEnabled:false,curriculumYear:0});
  const pool=G.questionPool(family,rules);assert(pool.length===poolCount,`${family}: pool ${pool.length}/${poolCount}`);assert(new Set(pool.map(q=>q.angleTypeId)).size===typeCount,`${family}: subtype count`);assert(pool.every(q=>A.validateVisual(q.visual).ok),`${family}: invalid visual`);
  for(const q of pool){
    assert(q&&q.key&&q.prompt&&q.answer,`${family}: incomplete question`);
    if(Array.isArray(q.choices)){assert(q.choices.length>=2&&q.choices.length<=4,`${q.angleTypeId}: choice count`);assert(new Set(q.choices).size===q.choices.length,`${q.angleTypeId}: duplicate choices`);assert(Number.isInteger(q.correctChoice)&&q.correctChoice>=0&&q.correctChoice<q.choices.length,`${q.angleTypeId}: invalid correctChoice`);assert(q.marking?.mode==='multiple-choice',`${q.angleTypeId}: MCQ marking`);assert(q.marking.answer===q.choices[q.correctChoice],`${q.angleTypeId}: MCQ answer mismatch`);}
    if(/estimate/i.test(q.prompt)){assert(Array.isArray(q.choices)&&q.marking?.mode==='multiple-choice',`${q.angleTypeId}: estimation must be explicit MCQ`);}
    if(q.marking?.mode==='measure-angle'||Number.isFinite(Number(q.marking?.toleranceDeg))){assert(Number(q.marking.toleranceDeg)===2,`${q.angleTypeId}: physical angle tolerance must be explicit ±2°`);assert(q.visual?.physical===true,`${q.angleTypeId}: physically measured question must use calibrated scene mode`);}
  }
  for(let seed=0;seed<125;seed++){const a=G.generateQuestions(rules,`angle-${family}-${seed}`),b=G.generateQuestions(rules,`angle-${family}-${seed}`);generated+=a.length;assert(a.length===24,`${family}: short generation`);assert(JSON.stringify(a)===JSON.stringify(b),`${family}: nondeterministic`);}
  const current=pool[0],sheet=[{...current,number:1},...pool.slice(1,4).map((q,i)=>({...q,number:i+2}))];const repl=G.replaceQuestion(sheet,0,rules,'replace-test');assert(repl[0].angleTypeId===current.angleTypeId,`${family}: replace-one changed subtype`);
}
function first(id){const row=A.CATALOGUE.find(r=>r.id===id);const rules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:[row.family],familyWeights:{[row.family]:1},curriculumYear:row.year});return G.questionPool(row.family,rules).find(q=>q.angleTypeId===id);}
const checks={
 'ang_y5_straight_line_one_missing':'145°','ang_y5_around_point_one_missing':'80°','ang_y6_vertically_opposite_direct':'45°','ang_y6_triangle_one_missing':'85°','ang_y6_triangle_missing_with_right_angle':'65°','ang_y6_isosceles_base_angle':'70°','ang_y6_quadrilateral_one_missing':'95°','ang_y6_regular_polygon_one_interior':'108°','ang_y6_irregular_polygon_missing':'90°','ang_y6_polygon_interior_sum_by_triangulation':'540°'
};
for(const [id,ans] of Object.entries(checks))assert(first(id).answer===ans,`${id}: mathematical invariant regression`);
assert(first('ang_y5_measure_angle_actual_size').marking.toleranceDeg===2,'measure angle explicit tolerance');
assert(first('ang_y5_draw_given_angle_actual_size').marking.toleranceDeg===2,'draw angle explicit tolerance');
assert(G.FAMILY_META.angles_compare_y4?.visual===true,'Angle visual family not registered');for(const id of Object.keys(A.ANGLE_FAMILIES))assert(G.FAMILY_META[id]?.strand==='Geometry',`${id}: graphical angle family should belong to Geometry`);for(const id of ['angle_facts','angle_sums','angle_relationships','angle_classification'])assert(G.FAMILY_META[id]?.extension===true,`${id} should be fallback/Extension`);
// Diagram completeness audit: if a prompt refers to named point/line letters,
// those letters must exist as visible labels in the pupil visual.
function visibleLabels(q){
  const out=new Set();
  for(const el of (q.visual?.elements||[])){
    const v=el?.kind==='text'?String(el.text||''):el?.kind==='angle'?String(el.label||''):'';
    if(/^[A-Z]$/.test(v))out.add(v);
  }
  return out;
}
for(const row of A.CATALOGUE){
  const rules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:[row.family],familyWeights:{[row.family]:1},curriculumYear:row.year});
  const q=G.questionPool(row.family,rules).find(x=>x.angleTypeId===row.id);const labs=visibleLabels(q);
  const pairs=[...String(q.prompt).matchAll(/\b([A-D])([A-D])\b/g)];
  for(const m of pairs){assert(labs.has(m[1])&&labs.has(m[2]),`${row.id}: prompt names ${m[0]} but visual does not show both point labels`);}
  const named=[...String(q.prompt).matchAll(/\b(?:angle|point)\s+([A-D])\b/gi)].map(m=>m[1].toUpperCase());
  for(const lab of named)assert(labs.has(lab),`${row.id}: prompt names ${lab} but visual does not show it`);
}
for(const id of ['ang_y6_composite_triangles_shared_vertex','ang_y5_mystery_angle_constraints','ang_y6_equilateral_inside_rectangle','ang_y6_identical_parallelograms_rhombus'])assert(!A.CATALOGUE.some(r=>r.id===id),`${id}: unreliable archetype must remain held back`);
const graphSource=fs.readFileSync(path.join(ROOT,'custom-graphs.js'),'utf8'),pieSource=fs.readFileSync(path.join(ROOT,'custom-piecharts.js'),'utf8'),angleSource=fs.readFileSync(path.join(ROOT,'custom-angles.js'),'utf8');assert(!/mode\s*:\s*['\"]range['\"]/.test(graphSource+pieSource),'No fuzzy range marking should remain in graph/pie visuals');assert(/for\(let d=0;d<=180;d\+\+\)/.test(angleSource)&&/d%5===0/.test(angleSource),'Protractor renderer must retain 1-degree ticks with 5-degree hierarchy');assert(!/Start = dark/.test(angleSource),'Turn renderer must not use the old crowded Start/End caption');
const barRules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:['bar_charts'],familyWeights:{bar_charts:1},questionCount:4,curriculumYear:4,progressionEnabled:false});const barSheet={seed:'axis',code:'AXIS',questions:G.generateQuestions(barRules,'axis')};const barSvg=L.renderPreviewSvg({rules:barRules,sheet:barSheet,answers:false,orientation:'portrait'});assert(/rotate\(-90/.test(barSvg),'Bar-chart y-axis title must be vertical');
const lineRules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:['line_graphs'],familyWeights:{line_graphs:1},questionCount:4,curriculumYear:5,progressionEnabled:false});const lineSheet={seed:'axis2',code:'AXIS2',questions:G.generateQuestions(lineRules,'axis2')};const lineSvg=L.renderPreviewSvg({rules:lineRules,sheet:lineSheet,answers:false,orientation:'portrait'});assert(/rotate\(-90/.test(lineSvg),'Line-graph y-axis title must be vertical');
console.log(`Angles Stage 1 smoke passed: 104 active subtypes / 416 pool entries; ${generated} deterministic generated questions; explicit estimation/measurement marking; vertical graph y-axis labels.`);
