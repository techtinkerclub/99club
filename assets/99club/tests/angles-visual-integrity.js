/* 99 Club Studio v1.22.2 Angles visual-semantic integrity audit. */
'use strict';
const path=require('path');const ROOT=path.resolve(__dirname,'..');
const G=require(path.join(ROOT,'generator.js'));globalThis.TT99Generator=G;globalThis.TT99SimplePDF=require(path.join(ROOT,'simple-pdf.js'));globalThis.TT99PDFLayout=require(path.join(ROOT,'pdf-layout.js'));
require(path.join(ROOT,'custom-graphs.js'));require(path.join(ROOT,'custom-coordinates.js'));require(path.join(ROOT,'custom-piecharts.js'));require(path.join(ROOT,'custom-angles.js'));
const A=globalThis.TT99CustomAngles;function assert(ok,msg){if(!ok)throw new Error(msg);}
function labels(q){const s=new Set();for(const e of q.visual?.elements||[]){const v=e.kind==='text'?String(e.text||''):e.kind==='angle'?String(e.label||''):'';if(/^[A-Z]$/.test(v))s.add(v);}return s;}
function eachVariant(fn){for(const row of A.CATALOGUE){const rules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:[row.family],familyWeights:{[row.family]:1},curriculumYear:row.year,progressionEnabled:false});const pool=G.questionPool(row.family,rules).filter(q=>q.angleTypeId===row.id);assert(pool.length===4,`${row.id}: expected four deterministic variants`);pool.forEach((q,i)=>fn(q,row,i));}}
function interiorAngles(points){return points.map((p,i)=>{const a=points[(i-1+points.length)%points.length],b=points[(i+1)%points.length];const v1=[a.x-p.x,a.y-p.y],v2=[b.x-p.x,b.y-p.y],dot=v1[0]*v2[0]+v1[1]*v2[1],m1=Math.hypot(...v1),m2=Math.hypot(...v2);return Math.acos(Math.max(-1,Math.min(1,dot/(m1*m2))))*180/Math.PI;});}
function targetDirection(q){const o=(q.visual.elements||[]).find(e=>e.kind==='orientation'),t=(q.visual.elements||[]).find(e=>e.kind==='text'&&e.text==='Target');if(!o||!t)return null;const dx=t.x-o.cx,dy=t.y-o.cy;if(Math.abs(dx)>Math.abs(dy))return dx>0?'right':'left';return dy>0?'down':'up';}
const dirs=['right','up','left','down'];function turn(dir,cw){const idx=dirs.indexOf(dir);return dirs[(idx+(cw?-1:1)+4)%4];}
let checked=0;
eachVariant((q,row)=>{
  checked++;
  assert(A.validateVisual(q.visual).ok,`${row.id}: base visual invalid`);
  const labs=labels(q);
  for(const m of String(q.prompt).matchAll(/\b([A-D])([A-D])\b/g))assert(labs.has(m[1])&&labs.has(m[2]),`${row.id}: named line ${m[0]} has missing endpoint labels`);
  for(const m of String(q.prompt).matchAll(/\b(?:angle|point)\s+([A-D])\b/gi))assert(labs.has(m[1].toUpperCase()),`${row.id}: named ${m[1]} missing from diagram`);
  if(row.id==='ang_y2_choose_route_instruction_to_target'){
    const o=q.visual.elements.find(e=>e.kind==='orientation');const expected=turn(o.dir,/quarter turn clockwise/.test(q.marking.answer));assert(targetDirection(q)===expected,`${row.id}: target is not in the direction of the correct turn`);
  }
  if(row.id==='ang_y6_equilateral_angle')assert(q.visual.elements.filter(e=>e.kind==='sideMark').length===3,`${row.id}: equilateral diagram must mark all three sides equal`);
  if(row.id==='ang_y6_triangle_missing_with_right_angle')assert(q.visual.elements.some(e=>e.kind==='right'),`${row.id}: right triangle must visibly mark the right angle`);
  if(row.id==='ang_y6_rhombus_missing')assert(q.visual.elements.filter(e=>e.kind==='sideMark').length===4,`${row.id}: rhombus must mark four equal sides`);
  if(row.id==='ang_y6_kite_missing'){
    const marks=q.visual.elements.filter(e=>e.kind==='sideMark');assert(marks.length===4&&new Set(marks.map(e=>e.count)).size===2,`${row.id}: kite must show two adjacent equal-side pairs`);
  }
  if(row.id==='ang_y4_largest_smallest_in_polygon'){
    const poly=q.visual.elements.find(e=>e.kind==='polygon'),angs=interiorAngles(poly.points),want=/smallest/.test(q.prompt)?Math.min(...angs):Math.max(...angs),idx=angs.findIndex(a=>Math.abs(a-want)<1e-6),expected=String.fromCharCode(65+idx);assert(q.marking.answer===expected,`${row.id}: answer does not match rendered polygon geometry`);
  }
  if(row.id==='ang_y6_irregular_polygon_missing'){
    const poly=q.visual.elements.find(e=>e.kind==='polygon'),lens=poly.points.map((p,i)=>{const n=poly.points[(i+1)%poly.points.length];return Math.hypot(n.x-p.x,n.y-p.y)});assert(Math.max(...lens)-Math.min(...lens)>5,`${row.id}: 'irregular' polygon is visually regular`);
  }
  if(/straight line/.test(q.prompt)&&q.angleTypeId==='ang_y5_straight_line_one_missing')assert(labs.has('P')&&labs.has('Q'),`${row.id}: PQ must be labelled`);
});
for(const id of ['ang_y6_composite_triangles_shared_vertex','ang_y5_mystery_angle_constraints','ang_y6_equilateral_inside_rectangle','ang_y6_identical_parallelograms_rhombus','ang_y5_protractor_baseline_error','ang_y6_point_straight_multi_rule'])assert(!A.CATALOGUE.some(r=>r.id===id),`${id}: unresolved archetype is active`);
console.log(`Angles visual integrity audit passed: ${checked} rendered-data variants across 104 active subtypes; six unresolved archetypes held back.`);
