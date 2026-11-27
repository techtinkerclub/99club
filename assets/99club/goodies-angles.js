/* Angles & geometry: common mathematical model, teaching diagrams, assessment and publishing. */
(function(root){
'use strict';
const constructionLibraryUrl=typeof document==='undefined'?null:new URL('geometry-construction-methods.json',document.currentScript?.src||new URL('/assets/99club/goodies-angles.js',document.baseURI)).href;
let constructionLibraryPromise=null;
function loadConstructionLibrary(){if(!constructionLibraryUrl)return Promise.reject(Error('Construction library requires a browser'));if(!constructionLibraryPromise)constructionLibraryPromise=fetch(constructionLibraryUrl).then(r=>{if(!r.ok)throw Error('Construction library unavailable');return r.json()}).then(d=>{if(d.schemaVersion!==2||!Array.isArray(d.methods)||d.methods.some(m=>!m.steps?.length||m.graphics?.frames?.length!==m.steps.length))throw Error('Invalid construction library');return d.methods}).catch(e=>{constructionLibraryPromise=null;throw e});return constructionLibraryPromise}
function constructionFrame(method,step=-1){const g=method.graphics;return [...g.initial,...g.frames.slice(0,Math.max(0,step+1)).flatMap(f=>f.add)]}
function constructionMethodGraphic(method,step=-1){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),add=(tag,attrs,content)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(content!=null)el.textContent=content;svg.append(el);return el};
 svg.setAttribute('viewBox',method.graphics.viewBox.join(' '));svg.setAttribute('role','img');svg.setAttribute('aria-label',method.title+(step<0?' — starting geometry':' — step '+(step+1)));svg.dataset.agMethodGraphic='1';svg.style.cssText='display:block;width:100%;height:auto;max-height:230px;background:#fff;border-radius:6px';
 const items=constructionFrame(method,step),style=k=>k==='result'?{stroke:'#16796c','stroke-width':2.5}:k==='construction'?{stroke:'#996c36','stroke-width':1.45,'stroke-dasharray':'5 3'}:{stroke:'#31434a','stroke-width':1.8};
 for(const o of items.filter(o=>o.kind!=='point')){const attrs={fill:'none',...style(o.style),'data-ag-method-primitive':o.kind};if(o.kind==='line')add('line',{x1:o.a[0],y1:o.a[1],x2:o.b[0],y2:o.b[1],...attrs});else if(o.kind==='circle')add('circle',{cx:o.center[0],cy:o.center[1],r:o.radius,...attrs});else if(o.kind==='arc'){const at=t=>[o.center[0]+o.radius*Math.cos(t*Math.PI/180),o.center[1]+o.radius*Math.sin(t*Math.PI/180)],a=at(o.start),b=at(o.end);add('path',{d:'M '+a.join(' ')+' A '+o.radius+' '+o.radius+' 0 '+(o.end-o.start>180?1:0)+' 1 '+b.join(' '),...attrs})}}
 for(const o of items.filter(o=>o.kind==='point')){add('circle',{cx:o.at[0],cy:o.at[1],r:3,fill:o.style==='result'?'#16796c':'#31434a','data-ag-method-primitive':'point'});add('text',{x:o.at[0]+8,y:o.at[1]-8,'font-size':13,fill:'#31434a',stroke:'#fff','stroke-width':3,'paint-order':'stroke'},o.label)}
 return svg
}
const CONSTRUCTION_METHODS_BY_TASK={'shape-build':'triangle-sas','build-sss':'triangle-sss','build-equilateral':'triangle-equilateral','build-right':'triangle-right-legs','build-rectangle':'rectangle-sides','build-square':'square-on-side','build-midpoint':'midpoint','build-perpendicular':'perpendicular-at-point','build-circle':'circle-given-radius','build-asa':'triangle-asa','build-bisector':'midpoint','build-rhombus':'rhombus-side-angle'};
// Challenge-specific guidance is generated from the same dimensions as assessment.
function challengeConstructionMethod(method,task){
 if(!task||method.id!==CONSTRUCTION_METHODS_BY_TASK[task.type])return method;
 const type=task.type,sol=labSolution(task),[A,B,C,E,M]=sol.points,mid=labAt(A,labSub(B,A),.5),length=task.length,fmt=n=>Number(n.toFixed(3)),L=(a,b,style='construction')=>({kind:'line',a,b,style}),P=(at,label,style='given')=>({kind:'point',at,label,style}),arc=(center,radius,p,span=22)=>{const t=Math.atan2(p[1]-center[1],p[0]-center[0])/D;return {kind:'arc',center,radius,start:t-span,end:t+span,style:'construction'}},circle=(center,radius,style='construction')=>({kind:'circle',center,radius,style});
 const steps=[],frames=[],add=(instruction,...objects)=>{steps.push(instruction);frames.push({add:objects})},initial=type==='build-circle'?[P(A,'A')]:[L(A,B,'given'),P(A,'A'),P(B,'B')];
 if(type==='build-midpoint'||type==='build-bisector'){
   const r=150,h=Math.sqrt(r*r-120*120),x=[mid[0],mid[1]-h],y=[mid[0],mid[1]+h];
   add('Set the compass opening to more than 3 cm (for example 3.75 cm).',L(A,[A[0],A[1]-r]));
   add('Draw equal arcs from A and B on both sides of AB.',arc(A,r,x),arc(A,r,y),arc(B,r,x),arc(B,r,y));
   add('Join the intersections X and Y.',P(x,'X'),P(y,'Y'),L([mid[0],mid[1]-120],[mid[0],mid[1]+120],type==='build-bisector'?'result':'construction'));
   add('Mark M where the perpendicular bisector crosses AB. AM = MB = 3 cm.',P(mid,'M','result'));
 }else if(type==='build-circle'){
   add('Set the compass opening to '+fmt(length)+' cm.',L(A,[A[0],A[1]-length*40]));
   add('Place the compass at A and draw one full circle.',circle(A,length*40,'result'));
 }else if(type==='build-perpendicular'||type==='build-right'){
   add('Align the set square or protractor with AB at A. Draw a 90° ray.',L(A,[A[0],Math.max(10,C[1]-30)]));
   add('Measure '+fmt(length)+' cm from A along the perpendicular and mark C.',arc(A,length*40,C),P(C,'C'),L(A,C,'result'));
   if(type==='build-right')add('Join B to C.',L(B,C,'result'));
 }else if(type==='build-sss'||type==='build-equilateral'){
   add('Set the compass to '+fmt(length)+' cm and draw an arc from A.',arc(A,length*40,C,30));
   add('Set the compass to '+fmt(task.rightLength)+' cm and draw an arc from B intersecting the first at C.',arc(B,task.rightLength*40,C,30),P(C,'C'));
   add('Join A to C and B to C.',L(A,C,'result'),L(B,C,'result'));
 }else if(type==='build-asa'){
   add('At A construct the '+task.angle+'° ray from AB.',L(A,C));
   add('At B construct the '+task.rightAngle+'° ray from BA on the same side.',L(B,C),P(C,'C'));
   add('Join both remaining sides at C.',L(A,C,'result'),L(B,C,'result'));
 }else if(type==='build-rectangle'||type==='build-square'){
   add('At A draw a perpendicular to AB. Mark D '+fmt(length)+' cm from A.',L(A,[A[0],Math.max(10,E[1]-25)]),arc(A,length*40,E),P(E,'D'),L(A,E,'result'));
   add('At B draw a perpendicular on the same side. Mark C '+fmt(length)+' cm from B.',L(B,[B[0],Math.max(10,C[1]-25)]),arc(B,length*40,C),P(C,'C'),L(B,C,'result'));
   add('Join C to D to complete the shape.',L(C,E,'result'));
 }else if(type==='build-rhombus'){
   add('At A draw a ray making '+task.angle+'° with AB.',L(A,E));
   add('Set the compass to 6 cm and mark D on the ray.',arc(A,240,E),P(E,'D'),L(A,E,'result'));
   add('Draw arcs of radius 6 cm from B and D to intersect at C, other than A.',arc(B,240,C),arc(E,240,C),P(C,'C'));
   add('Join B to C and C to D.',L(B,C,'result'),L(C,E,'result'));
 }else{
   add('At A use the protractor to draw the '+task.angle+'° ray from AB.',L(A,C));
   add('Set the compass to '+fmt(length)+' cm and mark C on the ray.',arc(A,length*40,C),P(C,'C'),L(A,C,'result'));
   add('Join B to C.',L(B,C,'result'));
 }
 const bounds=[];for(const o of [...initial,...frames.flatMap(f=>f.add)]){if(o.kind==='line')bounds.push(o.a,o.b);else if(o.kind==='point')bounds.push(o.at);else if(o.kind==='circle')bounds.push([o.center[0]-o.radius,o.center[1]-o.radius],[o.center[0]+o.radius,o.center[1]+o.radius]);else if(o.kind==='arc'){for(let t=o.start;t<o.end;t+=5)bounds.push([o.center[0]+o.radius*Math.cos(t*D),o.center[1]+o.radius*Math.sin(t*D)]);bounds.push([o.center[0]+o.radius*Math.cos(o.end*D),o.center[1]+o.radius*Math.sin(o.end*D)])}}
 const xs=bounds.map(p=>p[0]),ys=bounds.map(p=>p[1]),x=Math.min(...xs)-28,y=Math.min(...ys)-28,w=Math.max(...xs)-x+28,h=Math.max(...ys)-y+28;
 const given=['AB = 6 cm'],cm=v=>fmt(v)+' cm',deg=v=>fmt(v)+'°';
 let title=method.title;
 switch(type){
   case 'build-circle':given.splice(0,given.length,'Centre A','Radius = '+cm(length));break;
   case 'build-midpoint':title='Construct the midpoint of AB';break;
   case 'build-bisector':title='Construct the perpendicular bisector of AB';break;
   case 'build-sss':case 'build-equilateral':given.push('AC = '+cm(length),'BC = '+cm(task.rightLength));break;
   case 'build-right':case 'build-perpendicular':given.push('AC = '+cm(length),'Angle BAC = 90°');break;
   case 'build-rectangle':case 'build-square':given.push('BC = '+cm(length),'Four right angles');break;
   case 'build-asa':given.push('Angle BAC = '+deg(task.angle),'Angle ABC = '+deg(task.rightAngle));break;
   case 'build-rhombus':given.push('All four sides = 6 cm','Angle BAD = '+deg(task.angle));break;
   case 'shape-build':given.push('AC = '+cm(length),'Angle BAC = '+deg(task.angle));break;
 }
 return {...method,title,challengeSpecific:true,objective:task.prompt,given,steps,checks:[task.answer||method.checks.join('; ')],graphics:{viewBox:[x,y,w,h],initial,frames}};
}
// Independent construction checks use explicitly assigned point roles, never
// a pixel comparison with the illustrated example. Length tolerance 0.01 cm;
// angular tolerance 0.01 degrees. No claim is made about the tool sequence.
const INDEPENDENT_METHOD_ROLES={
 midpoint:['A','B','M'],
 'perpendicular-at-point':['A','B','P','X'],
 'perpendicular-from-point':['A','B','P','F'],
 'angle-bisector':['A','O','B','Z'],
 'parallel-through-point':['A','B','P','Q'],
 'triangle-equilateral':['A','B','C'],
 'square-on-side':['A','B','C','D'],
 'rectangle-sides':['A','B','C','D'],
 'parallelogram-sas':['A','B','C','D'],
 'rhombus-side-angle':['A','B','C','D'],
 'isosceles-trapezium':['A','B','C','D'],
 'circle-centre':['A','B','C','O'],
 'tangent-at-point':['O','T','X'],
 'tangents-external-point':['O','P','T₁','T₂'],
 'regular-hexagon':['O','A','B','C','D','E','F'],
 'square-in-circle':['O','A','B','C','D'],
 'regular-octagon':['O','A','B','C','D','E','F','G','H'],
 'regular-pentagon':['O','A','B','C','D','E'],
 'triangle-circumcircle':['A','B','C','O'],
 'triangle-incircle':['A','B','C','I','F'],
 'divide-segment-thirds':['A','B','P','Q'],
 'golden-section':['A','B','G'],
 'triangle-centroid':['A','B','C','G'],
 'triangle-orthocentre':['A','B','C','H'],
 'angle-in-semicircle':['A','B','T'],
 'copy-angle':['A','O','B','P','Q','S'],
 'triangle-sss':['A','B','C'],
 'triangle-asa':['A','B','C'],
 'triangle-sas':['A','B','C'],
 'triangle-right-legs':['A','B','C'],
 'right-triangle-hypotenuse':['A','B','C'],
 'common-external-tangents':['O','P','T1','T2','U1','U2'],
 'common-internal-tangents':['O','P','T1','T2','U1','U2'],
 'two-distance-locus':['A','B','P₁','P₂'],
 'equidistant-fixed-radius-locus':['A','B','M','P','Q'],
 'circle-given-radius':['A']
};
// Each numerical given is entered by the teacher/pupil, not derived from
// the illustrative solution. The result reports missing targets separately.
const INDEPENDENT_METHOD_DIMENSIONS={
 'triangle-sss':[['AB','AB (cm)'],['AC','AC (cm)'],['BC','BC (cm)']],
 'triangle-asa':[['AB','AB (cm)'],['angleA','Angle BAC (°)'],['angleB','Angle ABC (°)']],
 'triangle-sas':[['AB','AB (cm)'],['AC','AC (cm)'],['angleA','Angle BAC (°)']],
 'triangle-right-legs':[['AB','AB (cm)'],['AC','AC (cm)']],
 'right-triangle-hypotenuse':[['AB','Hypotenuse AB (cm)'],['AC','AC (cm)']],
 'rectangle-sides':[['AB','AB (cm)'],['AD','AD (cm)']],
 'parallelogram-sas':[['AB','AB (cm)'],['AD','AD (cm)'],['angleA','Angle DAB (°)']],
 'rhombus-side-angle':[['angleA','Angle DAB (°)']],
 'isosceles-trapezium':[['AB','AB (cm)'],['CD','CD (cm)'],['height','Height (cm)']],
 'two-distance-locus':[['radius','Given distance (cm)']],
 'equidistant-fixed-radius-locus':[['radius','Given radius (cm)']],
 'circle-given-radius':[['radius','Given radius (cm)']]
};
function independentConstructionCheck(st,id,assignment,targets={}){
 const roles=id==='two-distance-locus'&&['0','1','infinite'].includes(String(targets.solutionCount))?['A','B',...(String(targets.solutionCount)==='1'?['P₁']:[])]:INDEPENDENT_METHOD_ROLES[id];if(!roles)return {supported:false,ready:false,correct:false,checks:[]};
 const ids=roles.map(k=>assignment[k]);if(ids.some(i=>!Number.isInteger(i)||!st.points[i])||(id!=='two-distance-locus'||String(targets.solutionCount)!=='infinite')&&new Set(ids).size!==ids.length)return {supported:true,ready:false,correct:false,checks:[]};
 const p=Object.fromEntries(roles.map((k,i)=>[k,st.points[ids[i]]])),{A,B,C,D:Q,O,M,P:U,F,G,H,I,T,X,Z}=p,checks=[],preciseAngle=LAB_ANGLE_TOLERANCE_DEG,preciseLength=LAB_LENGTH_TOLERANCE_CM*LAB_UNIT,eps=preciseLength;
 const d=labDist,v=labSub,dot=labDot,cross=labCross,near=(a,b)=>Math.abs(a-b)<=eps;
 const angle=(a,b)=>Math.hypot(...a)>1e-8&&Math.hypot(...b)>1e-8?Math.atan2(Math.abs(cross(a,b)),dot(a,b))/D:NaN;
 const lineDist=(q,a,b)=>d(a,b)>1e-8?Math.abs(cross(v(b,a),v(q,a)))/d(a,b):Infinity;
 const perp=(a,b)=>Math.abs(angle(a,b)-90)<=preciseAngle;
 const parallel=(a,b)=>Math.min(angle(a,b),180-angle(a,b))<=preciseAngle;
 const segment=(a,b)=>d(a,b)>eps&&labLines(st).some(l=>lineDist(a,l.a,l.ray?labAt(l.a,l.v,100):l.b)<=eps&&lineDist(b,l.a,l.ray?labAt(l.a,l.v,100):l.b)<=eps&&[a,b].every(q=>{const t=dot(v(q,l.a),l.v)/dot(l.v,l.v);return l.infinite||t>=-eps/Math.hypot(...l.v)&&(l.ray||t<=1+eps/Math.hypot(...l.v))}));
 const onSegment=(q,a,b)=>lineDist(q,a,b)<=eps&&dot(v(q,a),v(b,a))>=0&&dot(v(q,b),v(a,b))>=0;
 const circleError=(o,r)=>r>1e-8?Math.min(...st.circles.filter(c=>!isLabArc(c)&&labVisible(st,'circles',c)&&st.points[c.i]&&c.r>1e-8).map(c=>Math.max(d(st.points[c.i],o),Math.abs(c.r-r)))):Infinity;
 const circle=(o,r)=>circleError(o,r)<=preciseLength;
 const test=(label,ok,detail)=>checks.push({label,ok:!!ok,...(detail?{detail}:{})});
 // Verification tolerances are independent of display rounding and zoom.
 const residual=(label,error,tolerance,unit,divisor=1)=>{const value=error/divisor,limit=tolerance/divisor,detail=Number.isFinite(value)?'Error '+(value===0?'0':value<.0001?value.toExponential(2):value.toFixed(4))+unit+'; tolerance '+limit+unit:'Undefined geometric relationship';test(label,Number.isFinite(error)&&error<=tolerance,detail)};
 const directionError=(a,b,wanted)=>{if(Math.hypot(...a)<1e-8||Math.hypot(...b)<1e-8)return Infinity;const actual=Math.atan2(Math.abs(cross(a,b)),dot(a,b))/D;return wanted===0?Math.min(actual,180-actual):Math.abs(actual-wanted)};
 const distanceCheck=(label,error)=>residual(label,error,preciseLength,' cm',LAB_UNIT);
 const angleCheck=(label,error)=>residual(label,error,preciseAngle,'°');
 const polygon=pts=>{test('All sides are drawn',pts.every((a,i)=>segment(a,pts[(i+1)%pts.length])));test('Shape is non-degenerate and does not cross itself',validRegion(pts,pts.map((_,i)=>i)))};
 const triangle=()=>{test('Triangle has three non-collinear vertices',lineDist(C,A,B)>eps);polygon([A,B,C])};
 if(id==='midpoint'){distanceCheck('M lies halfway along AB',d(A,B)>1e-8?d(M,labAt(A,v(B,A),.5)):Infinity);test('AB is drawn',segment(A,B))}
 else if(id==='perpendicular-at-point'||id==='perpendicular-from-point'){
   const from=id==='perpendicular-at-point'?U:F,to=id==='perpendicular-at-point'?X:U;
   test('Reference line AB is drawn',segment(A,B));distanceCheck('Foot lies on the line AB',lineDist(from,A,B));angleCheck('Constructed line is perpendicular',directionError(v(B,A),v(to,from),90));test('Perpendicular is drawn',segment(from,to));
 }else if(id==='angle-bisector'){
   const a=v(A,O),b=v(B,O),z=v(Z,O),ab=angle(a,b),az=angle(a,z),zb=angle(z,b);test('Both angle arms are drawn',segment(O,A)&&segment(O,B));test('Bisector lies inside a non-degenerate angle',ab>preciseAngle&&ab<180-preciseAngle&&Math.abs(az+zb-ab)<=preciseAngle);angleCheck('Both half angles are equal',Math.abs(az-zb));test('Bisector is drawn',segment(O,Z));
 }else if(id==='parallel-through-point'){test('Reference line AB is drawn',segment(A,B));angleCheck('PQ is parallel to AB',directionError(v(B,A),v(p.Q,U),0));test('Parallel line is distinct from AB',lineDist(U,A,B)>preciseLength);test('Parallel line is drawn',segment(U,p.Q))}
 else if(id==='triangle-equilateral'){triangle();distanceCheck('Three sides are equal',Math.max(d(A,B),d(B,C),d(C,A))-Math.min(d(A,B),d(B,C),d(C,A)))}
 else if(['square-on-side','rectangle-sides','parallelogram-sas','rhombus-side-angle','isosceles-trapezium'].includes(id)){
   polygon([A,B,C,Q]);angleCheck('AB is parallel to CD',directionError(v(B,A),v(Q,C),0));
   if(id==='isosceles-trapezium'){distanceCheck('AD and BC are equal',Math.abs(d(A,Q)-d(B,C)));test('AB is longer than CD',d(A,B)>d(C,Q)+eps)}
   else{angleCheck('AD is parallel to BC',directionError(v(Q,A),v(C,B),0));distanceCheck('Opposite sides are equal',Math.max(Math.abs(d(A,B)-d(C,Q)),Math.abs(d(A,Q)-d(B,C))));if(id==='square-on-side'||id==='rectangle-sides')angleCheck('Angle at A is a right angle',directionError(v(B,A),v(Q,A),90));if(id==='square-on-side'||id==='rhombus-side-angle')distanceCheck('Adjacent sides are equal',Math.abs(d(A,B)-d(A,Q)))}
 }else if(id==='circle-centre'||id==='triangle-circumcircle'){test('A, B and C are not collinear',lineDist(C,A,B)>eps);distanceCheck('O is equidistant from A, B and C',Math.max(d(O,A),d(O,B),d(O,C))-Math.min(d(O,A),d(O,B),d(O,C)));distanceCheck('Circle through A, B and C is present',circleError(O,d(O,A)));if(id==='triangle-circumcircle')triangle()}
 else if(id==='tangent-at-point'){const r=d(O,T),errors=st.circles.filter(c=>!isLabArc(c)&&labVisible(st,'circles',c)&&st.points[c.i]&&c.r>0).map(c=>Math.max(d(st.points[c.i],O),Math.abs(c.r-r)));distanceCheck('Circle centred at O passes through T',Math.min(...errors));angleCheck('TX is perpendicular to OT',directionError(v(O,T),v(X,T),90));test('Tangent line is drawn',segment(T,X))}
 else if(id==='tangents-external-point'){const t=p['T₁'],u=p['T₂'];test('Both contacts lie on the circle',circle(O,d(O,t))&&near(d(O,t),d(O,u)));test('P lies outside the circle',d(O,U)>d(O,t)+eps);test('Two distinct perpendicular tangents are drawn',d(t,u)>2*eps&&perp(v(O,t),v(U,t))&&perp(v(O,u),v(U,u))&&segment(U,t)&&segment(U,u))}
 else if(['regular-hexagon','square-in-circle','regular-octagon','regular-pentagon'].includes(id)){
   const pts=roles.slice(1).map(k=>p[k]),r=d(O,A);polygon(pts);test('All vertices lie on the drawn circle',circle(O,r)&&pts.every(q=>near(d(O,q),r)));angleCheck('Every side subtends the required central angle',Math.max(...pts.map((q,i)=>directionError(v(q,O),v(pts[(i+1)%pts.length],O),360/pts.length))));
 }else if(id==='triangle-incircle'){triangle();test('I is inside the triangle',[[A,B,C],[B,C,A],[C,A,B]].every(([a,b,c])=>cross(v(b,a),v(I,a))*cross(v(b,a),v(c,a))>0));test('F is the perpendicular contact on BC',onSegment(F,B,C)&&perp(v(I,F),v(C,B)));test('Circle touches all three sides',circle(I,d(I,F))&&[[A,B],[B,C],[C,A]].every(([a,b])=>near(lineDist(I,a,b),d(I,F))))}
 else if(id==='divide-segment-thirds'){test('P and Q lie at one third and two thirds along AB',d(A,B)>3*eps&&d(U,labAt(A,v(B,A),1/3))<=eps&&d(p.Q,labAt(A,v(B,A),2/3))<=eps);test('AB is drawn',segment(A,B))}
 else if(id==='golden-section'){test('G divides AB in the golden ratio',d(A,B)>2*eps&&d(G,labAt(A,v(B,A),(Math.sqrt(5)-1)/2))<=eps);test('AB is drawn',segment(A,B))}
 else if(id==='triangle-centroid'){triangle();test('G is the intersection of the medians',d(G,labAt(A,v(labAt(B,v(C,B),.5),A),2/3))<=eps)}
 else if(id==='triangle-orthocentre'){triangle();test('H lies on the altitudes from A and B',Math.abs(dot(v(H,A),v(C,B)))/d(C,B)<=eps&&Math.abs(dot(v(H,B),v(C,A)))/d(C,A)<=eps)}
 else if(id==='angle-in-semicircle'){const m=labAt(A,v(B,A),.5);test('Circle has AB as its diameter',circle(m,d(A,B)/2)&&near(d(m,T),d(A,B)/2));test('Angle ATB is a right angle',perp(v(A,T),v(B,T)));test('Both sides are drawn',segment(T,A)&&segment(T,B))}
 else if(id==='copy-angle'){
   test('Original and copied angle arms are drawn',segment(O,A)&&segment(O,B)&&segment(U,p.Q)&&segment(U,p.S));
   const original=angle(v(A,O),v(B,O)),copied=angle(v(p.Q,U),v(p.S,U));test('Original angle is non-degenerate',original>preciseAngle&&original<180-preciseAngle);angleCheck('Copied angle equals original angle',Math.abs(original-copied))
 }else if(['triangle-sss','triangle-asa','triangle-sas','triangle-right-legs','right-triangle-hypotenuse'].includes(id)){
   triangle();if(id==='triangle-right-legs')test('Angle BAC is 90°',perp(v(B,A),v(C,A)));if(id==='right-triangle-hypotenuse')test('Angle ACB is 90°',perp(v(A,C),v(B,C)))
 }else if(id==='common-external-tangents'||id==='common-internal-tangents'){
   const t=p.T1,u=p.T2,x=p.U1,y=p.U2,R=d(O,t),r=d(U,x),internal=id==='common-internal-tangents';
   test('Two disjoint circles are drawn',circle(O,R)&&circle(U,r)&&d(O,U)>R+r);
   test('Contacts lie on the corresponding circles',near(d(O,u),R)&&near(d(U,y),r)&&d(t,u)>2*eps&&d(x,y)>2*eps);
   for(const [a,b] of [[t,x],[u,y]]){const va=v(b,a);test('Common tangent is drawn perpendicular to both radii',segment(a,b)&&perp(v(O,a),va)&&perp(v(U,b),va));test(internal?'Centres on opposite sides of tangent':'Centres on same side of tangent',(cross(va,v(O,a))*cross(va,v(U,a))<0)===internal)}
 }else if(id==='two-distance-locus'){
   const count=String(targets.solutionCount??'2'),expected=Number(targets.radius)*LAB_UNIT,a=p['P₁'],b=p['P₂'],r=Number.isFinite(expected)&&expected>0?expected:a?d(A,a):NaN,ab=d(A,B);
   if(Number.isFinite(r)&&r>0){
     test('Equal-radius loci are drawn',circle(A,r)&&circle(B,r));
     const actual=ab<1e-7?'infinite':Math.abs(ab-2*r)<=1e-6?'1':ab>2*r?'0':'2';
     test('Number of solutions matches the circle relationship',actual===count);
     if(count==='1')test('The single intersection satisfies both distances',near(d(A,a),r)&&near(d(B,a),r));
     if(count==='2')test('Both distinct intersections satisfy the distances',d(a,b)>2*eps&&near(d(A,a),r)&&near(d(A,b),r)&&near(d(B,a),r)&&near(d(B,b),r));
   }else if(count==='2'){test('Both distinct intersections satisfy equal distances',a&&b&&d(a,b)>2*eps&&near(d(A,a),d(B,a))&&near(d(A,a),d(A,b))&&near(d(A,a),d(B,b)))}

 }else if(id==='equidistant-fixed-radius-locus'){
   const a=U,b=p.Q,r=d(M,a);test('M is midpoint of AB',d(M,labAt(A,v(B,A),.5))<=eps&&d(A,B)>2*eps);test('Both distinct intersections are on the circle and equidistant from A and B',circle(M,r)&&near(d(M,b),r)&&d(a,b)>2*eps&&near(d(A,a),d(B,a))&&near(d(A,b),d(B,b)))
 }else if(id==='circle-given-radius'){test('A circle centred at A is drawn',st.circles.some(c=>!isLabArc(c)&&st.points[c.i]&&d(st.points[c.i],A)<=eps&&c.r>eps))}
 const pending=[];
 for(const [key,label] of INDEPENDENT_METHOD_DIMENSIONS[id]||[]){
   const expected=Number(targets[key]);if(targets[key]==null||targets[key]===''||!Number.isFinite(expected)||expected<=0){pending.push(label);continue}
   let actual=NaN;
   if(key==='AB')actual=d(A,B)/LAB_UNIT;else if(key==='AC')actual=d(A,C)/LAB_UNIT;else if(key==='BC')actual=d(B,C)/LAB_UNIT;else if(key==='AD')actual=d(A,Q)/LAB_UNIT;else if(key==='CD')actual=d(C,Q)/LAB_UNIT;
   else if(key==='height')actual=lineDist(Q,A,B)/LAB_UNIT;
   else if(key==='angleA')actual=angle(v(B,A),v(Q||C,A));else if(key==='angleB')actual=angle(v(A,B),v(C,B));
   else if(key==='radius'){
      if(id==='circle-given-radius'){distanceCheck(label+' matches specified value',circleError(A,expected*LAB_UNIT));continue}
      if(id==='two-distance-locus'){distanceCheck(label+' matches specified value',Math.max(circleError(A,expected*LAB_UNIT),circleError(B,expected*LAB_UNIT)));continue}
      actual=d(M,U)/LAB_UNIT;
   }
   if(key.startsWith('angle'))angleCheck(label+' matches specified value',Math.abs(actual-expected));else distanceCheck(label+' matches specified value',Math.abs(actual-expected)*LAB_UNIT);
 }
 return {supported:true,ready:true,correct:checks.length>0&&checks.every(c=>c.ok)&&!pending.length,checks,pending};
}
function mountConstructionLibrary(owner,button,task=null,getDrawing=null,publishMethod=null){
 const panel=document.createElement('section');panel.className='gd-ag-method-panel';panel.dataset.agMethodPanel='1';panel.setAttribute('role','region');panel.setAttribute('aria-label','Construction library');panel.hidden=true;
 panel.style.cssText='position:fixed;z-index:2147483000;top:72px;right:16px;width:min(360px,calc(100vw - 24px));max-height:calc(100dvh - 90px);overflow:auto;box-sizing:border-box;padding:10px;background:#fff;color:#31434a;border:1px solid #abc6bd;border-radius:10px;box-shadow:0 5px 24px #183a3440;font-size:13px';
 const head=document.createElement('div');head.style.cssText='display:flex;gap:8px;align-items:center;cursor:move;touch-action:none';const title=document.createElement('strong');title.textContent='Construction library';title.style.flex='1';head.append(title);
 const mk=(parent,id,label,fn)=>{const b=document.createElement('button');b.type='button';b.className='gd-btn';b.textContent=label;b.dataset.agMethodAction=id;b.onclick=fn;parent.append(b);return b};
 const fold=mk(head,'collapse','−',()=>{collapsed=!collapsed;syncCollapsed();clamp()});
 const close=mk(head,'close','Close',()=>toggle(false));const body=document.createElement('div');body.style.cssText='display:grid;gap:8px;margin-top:8px';panel.append(head,body);document.body.append(panel);
 let collapsed=false;
 function syncCollapsed(){body.hidden=collapsed;body.style.display=collapsed?'none':'grid';fold.textContent=collapsed?'+':'−';fold.title=(collapsed?'Expand':'Collapse')+' construction library';fold.setAttribute('aria-label',fold.title);fold.setAttribute('aria-expanded',String(!collapsed))}
 syncCollapsed();
 let methods=[],selected=null,step=-1,graphic=false,verification=false,query='',category='all',drag=null,disposed=false,loading=false,methodStack=[],showIndependent=false,roleAssignments={},dimensionAssignments={};
 const clamp=()=>{if(panel.hidden)return;const w=document.documentElement.clientWidth,h=window.innerHeight;panel.style.maxHeight=Math.max(80,h-12)+'px';const rect=panel.getBoundingClientRect();panel.style.left=Math.max(4,Math.min(rect.left,w-rect.width-4))+'px';panel.style.top=Math.max(4,Math.min(rect.top,h-rect.height-4))+'px';panel.style.right='auto'};
 head.addEventListener('pointerdown',e=>{if(e.target.closest('button')||e.button!==0)return;const r=panel.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX-r.left,y:e.clientY-r.top};try{head.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()});head.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;panel.style.left=e.clientX-drag.x+'px';panel.style.top=e.clientY-drag.y+'px';panel.style.right='auto';clamp()});for(const t of ['pointerup','pointercancel','lostpointercapture'])head.addEventListener(t,()=>{drag=null});
 const resize=()=>{if(!panel.hidden)clamp()};window.addEventListener('resize',resize);
 const observer=new MutationObserver(()=>{if(!owner.isConnected||!button.isConnected){disposed=true;observer.disconnect();window.removeEventListener('resize',resize);panel.remove()}});observer.observe(document.body,{childList:true,subtree:true});
 function toggle(open=panel.hidden){if(disposed)return;panel.hidden=!open;panel.style.display=open?'block':'none';button.setAttribute('aria-expanded',String(open));if(!open)return;collapsed=false;syncCollapsed();if(!methods.length&&!loading){loading=true;body.textContent='Loading construction methods…';loadConstructionLibrary().then(m=>{if(disposed)return;methods=m.map(method=>challengeConstructionMethod(method,task));loading=false;if(task&&!selected)selected=methods.find(x=>x.id===CONSTRUCTION_METHODS_BY_TASK[task.type])||null;render()}).catch(e=>{if(disposed)return;loading=false;body.textContent=e.message;mk(body,'retry','Retry',()=>toggle(true))})}else if(methods.length)render();clamp()}
 function el(tag,parent,text,style){const e=document.createElement(tag);if(text!=null)e.textContent=text;if(style)e.style.cssText=style;parent.append(e);return e}
 function render(){
   body.replaceChildren();
   if(!selected){const input=el('input',body,null,'width:100%;box-sizing:border-box');input.type='search';input.placeholder='Search constructions';input.value=query;input.dataset.agMethodSearch='1';input.setAttribute('aria-label','Search construction methods');
     const cat=el('select',body);cat.className='gd-select';cat.dataset.agMethodCategory='1';cat.setAttribute('aria-label','Construction category');for(const [v,l] of [['all','All categories'],...[...new Set(methods.map(m=>m.category))].sort().map(c=>[c,c])]){const o=el('option',cat,l);o.value=v}cat.value=category;
     const results=el('div',body,null,'display:grid;gap:5px');function filter(){results.replaceChildren();const q=query.toLowerCase().trim();const matches=methods.filter(m=>(category==='all'||m.category===category)&&[m.title,m.category,m.objective,...m.given,...m.instruments].join(' ').toLowerCase().includes(q));el('small',results,matches.length+' methods');for(const m of matches){const b=mk(results,'method',m.title,()=>{selected=m;step=-1;graphic=false;verification=false;methodStack=[];showIndependent=false;render()});b.dataset.agMethodId=m.id;b.style.cssText='text-align:left;white-space:normal;justify-content:flex-start'}if(!matches.length)el('p',results,'No matching constructions.')}
     input.oninput=()=>{query=input.value;filter()};cat.onchange=()=>{category=cat.value;filter()};filter();return;
   }
   const top=el('div',body,null,'display:flex;gap:6px;align-items:center;flex-wrap:wrap');mk(top,'back',methodStack.length?'Back to construction':'All methods',()=>{if(methodStack.length){const last=methodStack.pop();selected=last.selected;step=last.step;graphic=last.graphic;verification=last.verification}else selected=null;render()});el('small',top,selected.category);
   el('strong',body,selected.title,'font-size:16px;line-height:1.25');if(task){const context=el('div',body,null,'padding:7px;border:1px solid #abc6bd;border-radius:6px');context.dataset.agMethodTask='1';el('strong',context,'Current challenge');el('div',context,task.prompt);el('small',context,selected.challengeSpecific?'This guide uses the dimensions of your current challenge. Reflected valid solutions may look different.':'This related method uses illustrative dimensions.')}el('div',body,'Given: '+selected.given.join('; '));el('div',body,selected.objective||selected.title);el('small',body,'Tools: '+selected.instruments.join(', '));el('small',body,selected.conditions);
   const modes=el('div',body,null,'display:flex;gap:6px;flex-wrap:wrap');const a=mk(modes,'instructions','Instructions',()=>{graphic=false;render()}),b=mk(modes,'graphics','Graphical guide',()=>{graphic=true;render()});for(const [el,active] of [[a,!graphic],[b,graphic]]){el.classList.toggle('gd-btn--primary',active);el.setAttribute('aria-pressed',String(active))}
   el('small',body,step<0?'Starting problem':'Step '+(step+1)+' of '+selected.steps.length);const instruction=el('div',body,step<0?'Prepare the given geometry, then begin the construction.':selected.steps[step],'padding:8px;border:1px solid #dbe7e3;border-radius:6px;line-height:1.4');instruction.dataset.agMethodStep=String(step);
   if(graphic)body.append(constructionMethodGraphic(selected,step));
   if(selected.prerequisites?.length){const details=el('details',body);el('summary',details,'Related techniques');const related=el('div',details,null,'display:grid;gap:4px;margin-top:5px');for(const id of selected.prerequisites){const m=methods.find(m=>m.id===id);if(!m)continue;const link=mk(related,'related',m.title,()=>{methodStack.push({selected,step,graphic,verification});selected=m;step=-1;graphic=false;verification=false;render()});link.dataset.agMethodRelated=id;link.style.cssText='white-space:normal;text-align:left'}}
   const nav=el('div',body,null,'display:flex;gap:5px;flex-wrap:wrap');const prev=mk(nav,'previous','Previous',()=>{step--;verification=false;render()});prev.disabled=step<0;mk(nav,'restart','Restart',()=>{step=-1;verification=false;render()});const next=mk(nav,'next',step<0?'Begin':'Next step',()=>{step++;verification=false;render()});next.disabled=step>=selected.steps.length-1;
   mk(body,'verify',verification?'Hide explanation':'Check construction / why it works',()=>{verification=!verification;render()});if(verification){el('div',body,selected.why);const list=el('ul',body);for(const c of selected.checks)el('li',list,c)}
   if(publishMethod){const publishing=el('details',body);el('summary',publishing,'Add to document');const actions=el('div',publishing,null,'display:flex;flex-wrap:wrap;gap:5px;margin-top:6px');mk(actions,'publish-exercise','Exercise + answer key',()=>publishMethod(selected,'exercise'));mk(actions,'publish-instructions','Written instructions',()=>publishMethod(selected,'instructions'));mk(actions,'publish-illustrated','Illustrated instructions',()=>publishMethod(selected,'illustrated'))}
   if(task&&getDrawing&&selected.challengeSpecific){const feedback=el('div',body);feedback.dataset.agMethodFeedback='1';feedback.setAttribute('role','status');mk(body,'check-drawing','Check my drawing',()=>{const result=labCheck(getDrawing(),task);feedback.replaceChildren();el('strong',feedback,result.precise?'Mathematically verified — within 0.01 cm and 0.01°':result.correct?'Within practice tolerance, but not yet mathematically verified.':result.ready?'Not quite — check the required lengths and geometric relationships.':'Construction not complete yet — finish the required points, lines or circle.');feedback.style.color=result.precise?'#16796c':'#795520';if(result.precisionReady){const list=el('ul',feedback);for(const c of result.precisionChecks){const detail=c.tolerance?(Number.isFinite(c.error)?' — error '+(c.error===0?'0':c.error<.0001?c.error.toExponential(2):c.error.toFixed(4))+' '+c.unit+'; tolerance '+c.tolerance+' '+c.unit:' — undefined relationship'):'';el('li',list,(c.ok?'✓ ':'✗ ')+c.label+detail)}}})}
   if(!task&&getDrawing&&INDEPENDENT_METHOD_ROLES[selected.id]){const block=el('details',body);block.open=showIndependent;block.ontoggle=()=>{showIndependent=block.open};el('summary',block,'Verify my construction');el('small',block,'Assign the points in your drawing to the method labels. Checks use geometric relationships, not the example size or orientation. Enter any specified numerical givens below. The construction procedure itself is not assessed. Verification uses unrounded geometry: 0.01 cm distance tolerance and 0.01° angular tolerance. Numerical errors are shown where applicable.');const fields=el('div',block,null,'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin-top:6px');const selection=roleAssignments[selected.id]||(roleAssignments[selected.id]={}),targets=dimensionAssignments[selected.id]||(dimensionAssignments[selected.id]={});if(selected.id==='two-distance-locus'){const label=el('label',block,'Number of solutions');const count=el('select',label);count.className='gd-select';count.dataset.agMethodSolutionCount='1';for(const [value,text] of [['2','Two'],['1','One'],['0','None'],['infinite','Infinitely many']]){const option=el('option',count,text);option.value=value}count.value=targets.solutionCount??'2';count.onchange=()=>{targets.solutionCount=count.value;refresh()}}const refresh=()=>{const st=getDrawing();fields.replaceChildren();for(const role of (selected.id==='two-distance-locus'&&['0','1','infinite'].includes(String(targets.solutionCount))?['A','B',...(String(targets.solutionCount)==='1'?['P₁']:[])]:INDEPENDENT_METHOD_ROLES[selected.id])){const label=el('label',fields,role);const sel=el('select',label);sel.className='gd-select';sel.dataset.agMethodRole=role;sel.style.width='100%';sel.setAttribute('aria-label','Point '+role);const empty=el('option',sel,'Choose point');empty.value='';st.points.forEach((_,i)=>{const opt=el('option',sel,st.names?.[i]||pointName(i));opt.value=i});const saved=selection[role],named=st.names?.indexOf(role);sel.value=Number.isInteger(saved)&&st.points[saved]?String(saved):named>=0?String(named):'';sel.onchange=()=>{selection[role]=sel.value===''?null:Number(sel.value)}}};refresh();mk(block,'refresh-points','Refresh points',refresh);if(INDEPENDENT_METHOD_DIMENSIONS[selected.id]?.length){el('small',block,'Specified dimensions (from your problem)');const dimensions=el('div',block,null,'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px');for(const [id,title] of INDEPENDENT_METHOD_DIMENSIONS[selected.id]){const label=el('label',dimensions,title),input=el('input',label);input.type='text';input.dataset.gdKeypad='number';input.inputMode='none';input.autocomplete='off';input.style.width='100%';input.value=targets[id]??'';input.dataset.agMethodDimension=id;input.oninput=()=>{targets[id]=input.value}}}if(selected.id==='two-distance-locus')el('small',block,'Choose the number of solutions you believe exists. Assign only the points required for that case; for coincident circles assign A and B to the same centre.');const feedback=el('div',block);feedback.dataset.agMethodIndependentFeedback='1';feedback.setAttribute('role','status');mk(block,'check-independent','Check relationships',()=>{const assignment=Object.fromEntries([...fields.querySelectorAll('select')].map(e=>[e.dataset.agMethodRole,e.value===''?null:Number(e.value)])),result=independentConstructionCheck(getDrawing(),selected.id,assignment,targets);feedback.replaceChildren();if(!result.ready){el('p',feedback,'Assign a distinct existing point to every role.');return}el('strong',feedback,result.correct?'All checked relationships and specified dimensions satisfied':result.checks.every(c=>c.ok)&&result.pending?.length?'Relationships satisfied — enter missing dimensions to complete verification':'Some relationships need attention');if(result.pending?.length)el('small',feedback,'Missing: '+result.pending.join(', '));const list=el('ul',feedback);for(const c of result.checks){const li=el('li',list,(c.ok?'✓ ':'✗ ')+c.label+(c.detail?' — '+c.detail:''));li.style.color=c.ok?'#16796c':'#795520'}})}
   if(!panel.hidden)clamp()
 }
 panel.style.display='none';button.setAttribute('aria-expanded','false');return {toggle}
}
const ID='angles',D=Math.PI/180,mod=a=>(a%360+360)%360,round=v=>Math.round(v*1000)/1000;
const LEVELS=[['easy','Gentle'],['medium','Standard'],['hard','Stretch']];
const MODES=[['angle','Angle explorer & protractor'],['turn','Turns & direction'],['lines','Line relationships'],['facts','Angle facts'],['polygon','Triangles & polygons'],['circle','Circles'],['construct','Shape construction'],['free-explore','Free exploration — move points'],['loci','Dynamic geometry — loci & traces']];
const YEARS=[['custom','All / custom'],['1','Year 1'],['2','Year 2'],['3','Year 3'],['4','Year 4'],['5','Year 5'],['6','Year 6']];
const FAMILIES=[
 ['turn','Describe a turn','turn',1],['direction','Clockwise or anticlockwise','turn',2],['right-turns','Count right-angle turns','turn',3],
 ['right-count','Count right angles in a shape','polygon',3],['right','Compare with a right angle','angle',3],['classify','Name the angle type','angle',4],['compare','Compare two angles','angle',4],['order','Order three angles','angle',4],
 ['estimate','Estimate an angle','angle',5],['measure','Measure an angle independently','angle',5],['draw','Construct a given angle','angle',5],['reflex','Measure a reflex angle','angle',5],['draw-reflex','Construct a reflex angle','angle',5],['estimate-reflex','Estimate a reflex angle','angle',5],['compare-reflex','Compare reflex and other angles','angle',5],
 ['line-orientation','Horizontal or vertical','lines',3],['line-pair','Parallel or perpendicular','lines',3],
 ['straight','Missing angle on a straight line','facts',5],['point','Missing angle around a point','facts',5],['opposite','Vertically opposite angles','facts',6],
 ['rectangle','Angles in rectangles','polygon',5],['rectangle-length','Missing length in a rectangle','polygon',5],['isosceles-angle','Missing base angle in an isosceles triangle','polygon',6],['diagonal-equal','Equal diagonals in quadrilaterals','polygon',5],['diagonal-bisect','Diagonals that bisect each other','polygon',6],['diagonal-perpendicular','Perpendicular diagonals','polygon',6],['side-count','Count sides of a polygon','polygon',2],['parallel-count','Count pairs of parallel sides','polygon',3],['shape-family','Recognise inclusive shape families','polygon',5],['quad-reasoning','Quadrilateral reasoning: always, sometimes or never','polygon',6],['geometry-reasoning','Geometry reasoning: always, sometimes or never','polygon',6],['circle-part','Name a circle part','circle',6],['circle-diameter','Find diameter from radius','circle',6],['circle-radius','Find radius from diameter','circle',6],['triangle-type','Classify a triangle by sides','polygon',4],['triangle-angle-type','Classify a triangle by angles','polygon',4],['triangle-centroid-ratio','Divide a median at the centroid','polygon',7],['triangle-centre','Identify a triangle centre','polygon',7],['euler-ratio','Find a distance on the Euler line','polygon',7],['quad-type','Classify a quadrilateral','polygon',4],['regularity','Regular or irregular polygon','polygon',5],
 ['triangle','Missing angle in a triangle','polygon',6],['quadrilateral','Missing angle in a quadrilateral','polygon',6],['regular','Interior angle of a regular polygon','polygon',6],
 ['shape-build','Construct a triangle from dimensions and an angle','construct',6],['build-sss','Construct a triangle from three sides','construct',6],['build-equilateral','Construct an equilateral triangle','construct',5],['build-right','Construct a right-angled triangle','construct',5],['build-rectangle','Construct a rectangle','construct',5],['build-square','Construct a square','construct',4],['build-midpoint','Locate the midpoint of a segment','construct',4],['build-perpendicular','Construct a perpendicular segment','construct',5],['build-circle','Construct a circle of given radius','construct',6],['build-asa','Construct a triangle from two angles and a side','construct',6],['build-bisector','Construct a perpendicular bisector','construct',7],['build-rhombus','Construct a rhombus from a side and angle','construct',7],
 ['exterior','Exterior angle of a regular polygon','polygon',7],['circle-circumference','Find circumference using π','circle',7],['circle-area','Find circle area using π','circle',7],['circle-chord-half','Find half a bisected chord','circle',7],['circle-chord-distance','Find the perpendicular distance to a chord','circle',7],['circle-arc-length','Calculate arc length','circle',7],['circle-sector-area','Calculate sector area','circle',7],['circle-segment-area','Calculate a circular segment area','circle',7],['circle-tangent-angle','Find an angle in a radius–tangent triangle','circle',7],['parallel','Corresponding and alternate angles','facts',7],['co-interior','Co-interior angles','facts',7],['similar-side','Missing length in similar triangles','polygon',7],['triangle-comparison','Congruent, similar or neither','polygon',7],['triangle-criterion','Is the triangle uniquely determined?','polygon',7],['triangle-inequality','Can these sides form a triangle?','polygon',7],['pythagoras','Find a missing right-triangle side','polygon',7],['area-same-base','Triangles with the same base and height','polygon',6],['area-same-perimeter','Find area with a fixed perimeter','polygon',6],['perimeter-same-area','Find perimeter with a fixed area','polygon',6],['polygon-sum','Interior angle sum of a polygon','polygon',7],['polygon-missing','Missing angle in an irregular polygon','polygon',7],['polygon-turn-missing','Missing signed exterior turn','polygon',7],['polygon-diagonal-count','Count all diagonals of a polygon','polygon',7]
];
const rand=(rng,a,b)=>a+Math.floor(rng()*(b-a+1)),pick=(rng,a)=>a[rand(rng,0,a.length-1)];
function settings(s={}){return {level:LEVELS.some(x=>x[0]===s.level)?s.level:'medium',mode:MODES.some(x=>x[0]===s.mode)?s.mode:'angle',year:YEARS.some(x=>x[0]===String(s.year))?String(s.year):'custom',enrichment:s.enrichment===true||s.enrichment===1||s.enrichment==='1'||s.enrichment==='true'}}
function types(s={}){return FAMILIES.filter(t=>t[3]!==7||settings(s).enrichment||s.type===t[0]).map(([id,label,mode,year])=>({id,label,mode,year}))}
function challengeGroups(s={}){
 const catalogue=types(s),defs=[
  ['turn','Turns',t=>t.mode==='turn'],
  ['angle','Angles',t=>t.mode==='angle'],
  ['lines','Lines',t=>t.mode==='lines'],
  ['facts','Angle relationships',t=>t.mode==='facts'],
  ['properties','Shape properties',t=>t.mode==='polygon'&&['right-count','diagonal-equal','diagonal-bisect','diagonal-perpendicular','side-count','parallel-count','shape-family','quad-reasoning','geometry-reasoning','triangle-type','triangle-angle-type','quad-type','regularity'].includes(t.id)],
  ['polygon','Shape calculations',t=>t.mode==='polygon'&&!['right-count','diagonal-equal','diagonal-bisect','diagonal-perpendicular','side-count','parallel-count','shape-family','quad-reasoning','geometry-reasoning','triangle-type','triangle-angle-type','quad-type','regularity'].includes(t.id)],
  ['circle','Circles',t=>t.mode==='circle'],
  ['construct','Construction',t=>t.mode==='construct'],
  ['ks3','KS3 enrichment',t=>t.year===7]
 ];
 return defs.map(([id,label,test])=>({id,label,ids:catalogue.filter(t=>(id==='ks3'||t.year!==7)&&test(t)).map(t=>t.id)})).filter(g=>g.ids.length);
}

const exactPolar=(x,y,r,a)=>[x+r*Math.cos(a*D),y-r*Math.sin(a*D)];
const polar=(x,y,r,a)=>exactPolar(x,y,r,a).map(round);
// Snap the movable ray to whole-degree graduations, relative to the fixed ray.
// Outside a semicircle choose the nearer endpoint, not an arbitrary 180°.
function snapAngle(raw,max=180,previous=0){
 const v=mod(raw),n=Math.round(v);
 if(max===180){if(v<=180)return Math.min(180,n);return v<270?180:0}
 if(n===360||n===0)return previous>180?360:0;
 return n;
}
function classify(a){return a===0?'Zero':a<90?'Acute':a===90?'Right':a<180?'Obtuse':a===180?'Straight':a<360?'Reflex':'Full turn'}
function trianglePoints(a,b,x=140,y=315,length=400){const c=180-a-b,other=length*Math.sin(b*D)/Math.sin(c*D);return [[x,y],[x+length,y],exactPolar(x,y,other,a)]}
const polyInterior=n=>180*(n-2)/n,polyExterior=n=>360/n;
function generate(s={},rng=Math.random){
 const cfg=settings(s),available=types({...cfg,type:s.type}),type=s.type==='all'?pick(rng,available).id:s.type;
 if(!available.some(t=>t.id===type))throw Error('Choose an available angle challenge.');
 const mode=FAMILIES.find(t=>t[0]===type)[2],inc=cfg.level==='easy'?15:cfg.level==='hard'?1:5;
 const angle=(min=15,max=165)=>rand(rng,Math.ceil(min/inc),Math.floor(max/inc))*inc;
 const rotation=cfg.level==='easy'?pick(rng,[0,90,180,270]):rand(rng,0,11)*30;
 const base={type,mode,cfg,rotation,angle:angle(),length:5,baseLength:6};
 const task=(extra,prompt,answer,note,choices)=>({...base,...extra,prompt,answer:String(answer),note,...(choices?{choices}:{} )});
 if(['turn','direction','right-turns'].includes(type)){const a=pick(rng,type==='direction'?[90,270]:[90,180,270,360]),clockwise=rng()<.5,turns={90:'Quarter turn',180:'Half turn',270:'Three-quarter turn',360:'Full turn'};return task({angle:a,clockwise,rotation:90},type==='turn'?'How much has the arrow turned?':type==='direction'?'Follow the curved arrow. Which direction is the turn?':'How many right-angle turns are shown?',type==='turn'?turns[a]:type==='direction'?(clockwise?'Clockwise':'Anticlockwise'):a/90,'A quarter turn is one right angle. '+turns[a]+' = '+a+' degrees.',type==='turn'?Object.values(turns):type==='direction'?['Clockwise','Anticlockwise']:null)}
 if(type==='right'){const a=pick(rng,[angle(15,75),90,angle(105,165)]);return task({angle:a},'Is this angle smaller than, equal to, or larger than a right angle?',a<90?'Smaller':a===90?'Equal':'Larger','Compare the opening with a square corner, not the length of its arms.',['Smaller','Equal','Larger'])}
 if(type==='classify'){const a=pick(rng,[angle(15,75),90,angle(105,165),180,angle(195,345)]);return task({angle:a},'Name the marked angle.',classify(a),'Acute < 90°; right = 90°; obtuse between 90° and 180°; straight = 180°; reflex between 180° and 360°.',['Acute','Right','Obtuse','Straight','Reflex'])}
 if(['compare','order','compare-reflex'].includes(type)){const n=type==='order'?3:2,as=type==='compare-reflex'?[angle(195,345)]:[];while(as.length<n){const a=type==='compare-reflex'?angle(15,345):angle();if(!as.includes(a)&&as.every(b=>Math.abs(a-b)>=10))as.push(a)}const labels=['A','B','C'],order=as.map((a,i)=>({a,l:labels[i]})).sort((x,y)=>x.a-y.a).map(v=>v.l);const choices=type!=='order'?labels.slice(0,2):['A B C','A C B','B A C','B C A','C A B','C B A'];return task({angles:as},type!=='order'?'Which marked angle is larger?':'Order the marked angles from smallest to largest.',type!=='order'?order.at(-1):order.join(' '),'Actual openings: '+as.map((a,i)=>labels[i]+' = '+a+'°').join(', ')+'. Compare opening size rather than arm length.',choices)}
 if(type==='estimate'||type==='estimate-reflex'){let a=type==='estimate-reflex'?angle(195,345):angle(15,165);if(a%30===15)a+=1;const nearest=Math.round(a/30)*30,choices=Array.from({length:13},(_,i)=>i*30).filter(v=>Math.abs(v-nearest)<=60);return task({angle:a},'Which estimate is closest to the marked angle?',nearest+'°','The angle is '+a+'°. The nearest multiple of 30° is '+nearest+'°.',choices.map(v=>v+'°'))}
 if(['measure','draw','reflex','draw-reflex'].includes(type)){const a=['reflex','draw-reflex'].includes(type)?angle(195,345):angle(15,165);return task({angle:a},['draw','draw-reflex'].includes(type)?'Construct an angle of '+a+'° from the given baseline.':type==='reflex'?'Use a protractor to measure the marked reflex angle in degrees.':'Use a protractor to measure the marked angle in degrees.',a,type==='reflex'?'The full turn is 360°. The smaller angle is '+(360-a)+'°, so the reflex angle is '+a+'°.':'Align the centre and zero line with the vertex and baseline. The marked opening is '+a+'°.') }
 if(type==='line-orientation'){const a=pick(rng,[0,90]);return task({angle:a,rotation:0},'Is the marked line horizontal or vertical?',a===0?'Horizontal':'Vertical','Horizontal lines run left to right; vertical lines run up and down.',['Horizontal','Vertical'])}
 if(type==='line-pair'){const relation=pick(rng,['Parallel','Perpendicular','Neither']);return task({relation,angle:relation==='Parallel'?0:relation==='Perpendicular'?90:angle(15,75)},'Describe the relationship between the two lines.',relation,'Parallel lines never meet; perpendicular lines meet at 90°.',['Parallel','Perpendicular','Neither'])}
 if(type==='straight'){const a=angle(20,160);return task({angles:[a,180-a],rotation:rotation},'Find the missing angle x.',180-a,'Angles on a straight line total 180°. 180° − '+a+'° = '+(180-a)+'°.')}
 if(type==='point'){const a=angle(40,110),b=angle(40,110),c=360-a-b;return task({angles:[a,b,c],rotation:rotation},'Find the missing angle x around the point.',c,'Angles around a point total 360°. Subtract '+a+'° and '+b+'° from 360°.')}
 if(type==='opposite'){const a=angle(30,150);return task({angles:[a,180-a,a,180-a]},'Find the angle x vertically opposite the labelled angle.',a,'Vertically opposite angles are equal.')}
 if(type==='right-count'){const shape=pick(rng,['Rectangle','Right-angled triangle','Triangle with no right angle','Parallelogram with no right angles']);return task({shape},'How many right angles does the shape have?',shape==='Rectangle'?4:shape==='Right-angled triangle'?1:0,'Look for square corners, including when the shape has been rotated.');}
 if(type==='rectangle-length'){const w=rand(rng,6,15),h=rand(rng,2,5),side=pick(rng,[2,3]);return task({width:w,height:h,missingSide:side},'Find the missing side length x in centimetres.',side===2?w:h,'Opposite sides of a rectangle have equal lengths.')}
 if(type==='isosceles-angle'){const a=pick(rng,[30,40,50,70,80,100,110,120]),b=(180-a)/2;return task({angles:[b,b,a]},'The two marked sides are equal. Find the missing base angle x.',b,'The base angles of an isosceles triangle are equal. Subtract '+a+'° from 180° and divide by 2.')}
 if(type==='diagonal-bisect'||type==='diagonal-perpendicular'){
   const shape=pick(rng,['Square','Rectangle (not square)','Rhombus (not square)','Parallelogram (not rectangle or rhombus)','Trapezium']);
   const bisect=type==='diagonal-bisect',yes=bisect?shape!=='Trapezium':shape==='Square'||shape.startsWith('Rhombus');
   return task({shape},'For a '+shape.toLowerCase()+', '+(bisect?'do the diagonals always bisect each other?':'are the diagonals always perpendicular?'),yes?'Yes':'No',bisect?'The diagonals of a parallelogram, including rectangles, rhombuses and squares, bisect each other.':'Squares and rhombuses have perpendicular diagonals. The other listed shape families do not guarantee this.',['Yes','No']);
 }
 if(type==='side-count'){const n=rand(rng,3,10);return task({n,regular:rng()<.5},'How many sides does this polygon have?',n,'Count each straight side once.')}
 if(type==='parallel-count'){const shape=pick(rng,['Square','Rectangle','Rhombus (not square)','Parallelogram (not rectangle)','Trapezium']);return task({shape},'How many pairs of parallel sides does this shape have?',shape==='Trapezium'?1:2,'Parallel sides remain the same distance apart.')}
 if(type==='geometry-reasoning'){const statement=pick(rng,GEOMETRY_REASONING);return task({reasoningId:statement.id},statement.prompt+' Always, sometimes or never? Explain your reasoning.',statement.answer,statement.note,['Always','Sometimes','Never'])}
 if(type==='quad-reasoning'){const statement=pick(rng,QUAD_REASONING),examples=statement.examples.map(k=>({name:k,points:quadReasoningPoints(k)}));return task({quadStatement:statement.id,quadExamples:examples},statement.prompt+' Always, sometimes or never? Explain your reasoning.',statement.answer,statement.note,['Always','Sometimes','Never'])}
 if(type==='shape-family'){const [shape,claim,yes]=pick(rng,[['Square','rectangle',true],['Square','rhombus',true],['Rectangle','square',false],['Rhombus (not square)','square',false],['Rectangle','parallelogram',true],['Rhombus (not square)','parallelogram',true],['Parallelogram (not rectangle)','rectangle',false]]);return task({shape,claim},'Is every '+(shape==='Rhombus (not square)'?'rhombus':shape.startsWith('Parallelogram')?'parallelogram':shape.toLowerCase())+' a '+claim+'?',yes?'Yes':'No','A family includes all shapes that meet its defining properties. A square is both a rectangle and a rhombus.',['Yes','No'])}
 if(type==='co-interior'){const a=angle(35,145);return task({angle:a,relation:'co-interior',rotation:0},'The lines are parallel. Find the marked co-interior angle x.',180-a,'Co-interior angles on the same side of a transversal sum to 180°.')}
 if(type==='triangle-inequality'){
   const a=rand(rng,2,6),b=rand(rng,2,6),kind=pick(rng,['valid','flat','impossible']),c=kind==='valid'?a+b-rand(rng,1,Math.min(a,b)):kind==='flat'?a+b:a+b+rand(rng,1,3),lengths=[a,b,c];
   for(let i=lengths.length-1;i>0;i--){const j=rand(rng,0,i);[lengths[i],lengths[j]]=[lengths[j],lengths[i]]}
   const m=triangleInequality(lengths),[u,v,w]=m.sorted;
   return task({inequalityLengths:lengths},'Can these three side lengths form a triangle with positive area?',m.kind==='valid'?'Yes':'No',u+' + '+v+' = '+(u+v)+'. '+(m.kind==='valid'?'This is greater than '+w+', so the triangle can close.':m.kind==='flat'?'This equals '+w+', so the sides lie on a straight line.':'This is less than '+w+', so the two shorter sides cannot meet.'),['Yes','No']);
 }
 if(type==='triangle-criterion'){
   const criterion=pick(rng,Object.keys(TRIANGLE_CRITERIA)),size=pick(rng,[1,2,3]),model=triangleCriterion(criterion,size);
   return task({criterion,criterionSize:size},'Using only the stated measurements, must every possible triangle be congruent? The drawing is not a measuring task.',model.unique?'Yes':'No',TRIANGLE_CRITERIA[criterion].explanation,['Yes','No']);
 }
 if(type==='triangle-comparison'){
   const example=pick(rng,['congruent','similar','neither']),factor=example==='similar'?pick(rng,[.5,1.5,2]):1,comparison={factor,rotation:pick(rng,[0,45,90,135,180,225,270,315]),mirror:rng()<.5,distort:example==='neither'};
   const pair=triangleComparison(comparison),answer=triangleComparisonResult(pair[0],pair[1]).label;
   return task({comparison},'Compare triangles ABC and DEF using the stated side lengths. Which description is correct?',answer,'Compare the three corresponding side-length ratios. All equal to 1 means congruent; all equal but not 1 means similar but not congruent; unequal ratios mean neither. Rotation and reflection do not affect these relationships.',['Congruent','Similar, not congruent','Neither']);
 }
 if(type==='similar-side'){const base=rand(rng,3,7),height=rand(rng,2,5),factor=pick(rng,[2,3,4]);return task({baseLength:base,length:height,factor},'The two triangles are similar. Find the missing side x in centimetres.',height*factor,'The scale factor is '+factor+'. Corresponding lengths are multiplied by the same factor.')}
 if(['area-same-base','area-same-perimeter','perimeter-same-area'].includes(type)){
   const baseLength=rand(rng,3,8),height=rand(rng,3,7),kind=type==='area-same-base'?'base-height':type==='area-same-perimeter'?'perimeter':'area',values=kind==='base-height'?[-2,0,baseLength,baseLength+2]:kind==='perimeter'?Array.from({length:baseLength+height-1},(_,i)=>i+1).filter(w=>w!==baseLength&&w!==height):Array.from({length:baseLength*height},(_,i)=>i+1).filter(w=>baseLength*height%w===0&&w!==baseLength&&w!==height&&w<=baseLength*height/2),value=pick(rng,values),m=areaComparison(kind,value,baseLength,height),[a,b]=m.shapes;
   const prompt=kind==='base-height'?'Triangle A has area '+a.area+' cm². B has the same base and perpendicular height. Find the area of B in cm².':kind==='perimeter'?'The rectangles have the same perimeter ('+a.perimeter+' cm). Find the area of B in cm².':'The rectangles have the same area ('+a.area+' cm²). Find the perimeter of B in cm.';
   const note=kind==='base-height'?'A = ½ × base × perpendicular height = '+a.area+' cm² for both triangles.':kind==='perimeter'?'Half the perimeter is '+a.perimeter/2+' cm. B has height '+a.perimeter/2+' − '+b.width+' = '+b.height+' cm. Area = '+b.width+' × '+b.height+' = '+b.area+' cm².':'B has height '+a.area+' ÷ '+b.width+' = '+b.height+' cm. Perimeter = 2 × ('+b.width+' + '+b.height+') = '+b.perimeter+' cm.';
   return task({baseLength,height,areaComparisonKind:kind,areaComparisonValue:value},prompt,kind==='area'?b.perimeter:b.area,note);
 }
 if(type==='pythagoras'){const [u,v,h]=pick(rng,[[3,4,5],[5,12,13],[6,8,10],[8,15,17],[9,12,15]]),missingSide=pick(rng,['hypotenuse','base','height']),answer=missingSide==='base'?u:missingSide==='height'?v:h,other=missingSide==='base'?v:u,note=missingSide==='hypotenuse'?'x² = '+u+'² + '+v+'² = '+h*h:'x² = '+h+'² − '+other+'² = '+answer*answer;return task({baseLength:u,length:v,hypotenuse:h,missingSide},'Find the '+(missingSide==='hypotenuse'?'hypotenuse':'missing shorter side')+' x in centimetres.',answer,'Pythagoras: '+note+'. Therefore x = '+answer+' cm.')}
 if(type==='diagonal-equal'){const shape=pick(rng,['Square','Rectangle','Rhombus (not square)','Parallelogram (not rectangle)']);return task({shape},'For this type of '+(shape.startsWith('Parallelogram')?'parallelogram':'quadrilateral')+', are the two diagonals always equal in length?',shape==='Square'||shape==='Rectangle'?'Yes':'No','A rectangle (including a square) always has equal diagonals. A non-square rhombus or non-rectangular parallelogram does not.',['Yes','No'])}
 if(type==='circle-part'){const part=pick(rng,['Radius','Diameter','Circumference','Centre']);return task({part,radius:5},'Name the highlighted part of the circle.',part,'The radius runs from the centre to the boundary, the diameter crosses the centre between two boundary points, and the circumference is the boundary.',['Radius','Diameter','Circumference','Centre'])}
 if(type==='circle-diameter'||type==='circle-radius'){const r=rand(rng,2,15);return task({radius:r},type==='circle-diameter'?'Find the diameter in centimetres.':'Find the radius in centimetres.',type==='circle-diameter'?2*r:r,'Diameter = 2 × radius. Radius = diameter ÷ 2.')}
 if(type==='circle-circumference'||type==='circle-area'){const r=rand(rng,2,10),v=type==='circle-area'?r*r:2*r;return task({radius:r},'Find the '+(type==='circle-area'?'area (cm²)':'circumference (cm)')+' of the circle. Use 3.14 for π.',String(Math.round(v*314)/100),type==='circle-area'?'Area = πr². Multiply 3.14 by '+r+' × '+r+'.':'Circumference = 2πr. Multiply 3.14 by 2 × '+r+'.')}
 if(type==='circle-chord-half'||type==='circle-chord-distance'){
   const [half,distance,r]=pick(rng,[[3,4,5],[4,3,5],[6,8,10],[8,6,10],[5,12,13],[12,5,13],[9,12,15],[12,9,15]]),span=2*Math.asin(half/r)/D;
   const isHalf=type==='circle-chord-half';
   return task({radius:r,circleStart:90-span/2,circleSpan:span,chordLength:2*half,chordHalf:half,chordDistance:distance},isHalf?'OM is perpendicular to chord AB at M. AB = '+2*half+' cm. Find AM in centimetres.':'OM is perpendicular to chord AB at M. OA = '+r+' cm, AB = '+2*half+' cm. Find OM in centimetres.',isHalf?half:distance,isHalf?'The perpendicular from the centre bisects the chord. AM = AB ÷ 2 = '+half+' cm.':'AM = AB ÷ 2 = '+half+' cm. In right triangle OMA, OM² = '+r+'² − '+half+'² = '+distance*distance+'. OM = '+distance+' cm.');
 }
 if(['circle-arc-length','circle-sector-area','circle-segment-area'].includes(type)){
   const radius=rand(rng,3,12),circleSpan=pick(rng,type==='circle-segment-area'?[90,270]:[30,45,60,90,120,135,180,225,240,270,300,315]),circleStart=90-circleSpan/2;
   const m=circleInvestigation({radius,circleStart,circleSpan}),arc=type==='circle-arc-length',segment=type==='circle-segment-area',answer=(arc?m.arc:segment?m.segment:m.sector).toFixed(2),unit=arc?'cm':'cm²';
   const question=arc?'length of the highlighted arc':segment?'area of the shaded circular segment':'area of the shaded sector';
   const note=arc?'Arc length = '+circleSpan+'/360 × 2π × '+radius:segment?'Segment area = '+circleSpan+'/360 × π × '+radius+'² '+(circleSpan===90?'−':'+')+' '+radius+'²/2. '+(circleSpan===90?'Subtract':'Add')+' the area of the right triangle.':'Sector area = '+circleSpan+'/360 × π × '+radius+'²';
   return task({radius,circleStart,circleSpan},'Find the '+question+' in '+unit+'. Radius = '+radius+' cm; selected central angle = '+circleSpan+'°. Use calculator π and round to 2 decimal places.',answer,note+' = '+answer+' '+unit+'.');
 }
 if(type==='circle-tangent-angle'){
   const radius=rand(rng,3,8),tangentAngle=pick(rng,[25,30,35,40,45,50]);
   return task({radius,circleStart:0,circleSpan:90,tangentAngle},'AT is tangent to the circle at A. Angle AOT = '+tangentAngle+'°. Find angle OTA in degrees.',90-tangentAngle,'The tangent AT is perpendicular to radius OA. Angles in triangle OAT total 180°, so 180° − 90° − '+tangentAngle+'° = '+(90-tangentAngle)+'°.');
 }
 if(type==='rectangle')return task({angles:[90,90,90,90]},'Find the missing corner angle x in this rectangle.',90,'All four angles in a rectangle are right angles.');
 if(type==='triangle-type'){const name=pick(rng,['Equilateral','Isosceles (not equilateral)','Scalene']);const a=name==='Equilateral'?60:name==='Isosceles (not equilateral)'?pick(rng,[40,50,70]):pick(rng,[35,45,55]),b=name==='Scalene'?a+10:a;return task({angles:[a,b,180-a-b],shape:name},'Classify this triangle by its side lengths.',name,'Equal angles face equal sides. A triangle with three equal sides is equilateral; exactly two equal sides is isosceles (not equilateral); no equal sides is scalene.',['Equilateral','Isosceles (not equilateral)','Scalene'])}
 if(type==='triangle-angle-type'){
   const category=pick(rng,['Acute','Right-angled','Obtuse']),a=pick(rng,[20,25,30,35,40]),angles=category==='Right-angled'?[a,90-a,90]:category==='Obtuse'?[a,15,165-a]:[a,80,100-a];
   // Shuffle which vertex carries the distinguishing angle.
   const offset=rand(rng,0,2),v=angles.slice(offset).concat(angles.slice(0,offset));
   return task({angles:v},'Classify this triangle by its angles.',category,'An acute triangle has three acute angles; a right-angled triangle has one 90° angle; an obtuse triangle has one angle greater than 90°. Here the largest angle is '+Math.max(...v)+'°.',['Acute','Right-angled','Obtuse']);
 }
 if(type==='euler-ratio'){
   const unit=rand(rng,2,12),pairs=[['OG',1],['GH',2],['OH',3]],given=rand(rng,0,2),missing=pick(rng,[0,1,2].filter(i=>i!==given)),length=unit*pairs[given][1],answer=unit*pairs[missing][1];
   return task({eulerGiven:pairs[given][0],eulerUnknown:pairs[missing][0],eulerLength:length},'O, G and H are the circumcentre, centroid and orthocentre of a non-equilateral triangle. '+pairs[given][0]+' = '+length+' cm. Find '+pairs[missing][0]+' in cm.',answer,'OG : GH : OH = 1 : 2 : 3. One part = '+length+' ÷ '+pairs[given][1]+' = '+unit+' cm. '+pairs[missing][0]+' = '+pairs[missing][1]+' × '+unit+' = '+answer+' cm.');
 }
 if(type==='triangle-centre'){const centre=pick(rng,['centroid','circumcentre','incentre','orthocentre']),angles=pick(rng,[[40,65,75],[30,40,110],[30,60,90],[35,70,75]]),names={centroid:'Centroid',circumcentre:'Circumcentre',incentre:'Incentre',orthocentre:'Orthocentre'},notes={centroid:'The medians meet at the centroid.',circumcentre:'The perpendicular bisectors meet at the circumcentre, equidistant from the vertices.',incentre:'The internal angle bisectors meet at the incentre, equidistant from the sides.',orthocentre:'The three altitude lines meet at the orthocentre.'};return task({centre,angles},'Identify the marked point P from the geometric evidence.',names[centre],notes[centre],Object.values(names))}
 if(type==='triangle-centroid-ratio'){const median=3*rand(rng,2,8),fromVertex=rng()<.5;return task({median,fromVertex,angles:[48,72,60]},'AD is a median and G is the centroid. AD = '+median+' cm. Find '+(fromVertex?'AG':'GD')+' in centimetres.',median*(fromVertex?2:1)/3,'The centroid divides every median in the ratio 2:1, with the longer part towards the vertex. '+median+' ÷ 3 = '+median/3+' cm. '+(fromVertex?'AG = 2 × '+median/3:'GD = '+median/3)+' cm.')}
 if(type==='quad-type'){const name=pick(rng,['Square','Rectangle (not square)','Rhombus (not square)','Parallelogram (not rectangle or rhombus)','Trapezium']);return task({shape:name},'Choose the most specific description of this quadrilateral.',name,'Use equal-side markings, right angles and parallel sides. Other inclusive family names may also be true. The question asks for the listed most specific description.',['Square','Rectangle (not square)','Rhombus (not square)','Parallelogram (not rectangle or rhombus)','Trapezium'])}
 if(type==='regularity'){const n=pick(rng,[4,5,6,8]),regular=rng()<.5;return task({n,regular},'Is the polygon regular or irregular?',regular?'Regular':'Irregular','A regular polygon has all sides equal and all interior angles equal.',['Regular','Irregular'])}
 if(type==='triangle'){const a=angle(30,70),b=angle(35,75),c=180-a-b;return task({angles:[a,b,c]},'Calculate the missing interior angle x.',c,'Angles in a triangle total 180°. Subtract the two given angles.')}
 if(type==='quadrilateral'){const a=angle(55,125),b=180-a;return task({angles:[a,b,a,b]},'Find the missing interior angle x in the parallelogram.',b,'The four interior angles total 360°. Subtract the three given angles.')}
 if(type==='polygon-missing'||type==='polygon-turn-missing'){
   const examples=polygonInvestigationExamples(),ex=pick(rng,examples),pts=ex.points.map(p=>p.slice()),n=pts.length,turns=polygonInvestigationTurns(pts),angles=turns.map(v=>180-v),unknown=rand(rng,0,n-1),exterior=type==='polygon-turn-missing',values=exterior?turns:angles,sum=exterior?360:180*(n-2),answer=values[unknown],known=values.filter((_,i)=>i!==unknown).reduce((a,b)=>a+b,0);
   return task({n,regular:false,investigationPoints:pts,investigationAngles:angles,investigationTurns:turns,unknownVertex:unknown},exterior?'The signed exterior turns total 360°. Negative turns are inward turns. Find the missing turn at '+pointNameForInvestigation(unknown)+' in degrees.':'Find the missing interior angle at '+pointNameForInvestigation(unknown)+' in degrees.',answer,(exterior?'Signed exterior turns total 360°.':'Interior angles total ('+n+' − 2) × 180° = '+sum+'°. ')+' The given '+(exterior?'signed turns':'angles')+' total '+known+'°. Missing value = '+sum+' − ('+known+') = '+answer+'°.');
 }
 if(type==='polygon-diagonal-count'){
   const n=rand(rng,4,12),answer=n*(n-3)/2;return task({n,regular:true},'How many different diagonals can be drawn in this '+n+'-sided polygon? Do not count sides.',answer,'Each vertex can join to '+(n-3)+' non-adjacent vertices. Each diagonal is counted twice, so '+n+' × '+(n-3)+' ÷ 2 = '+answer+'.');
 }
 if(['regular','exterior','polygon-sum'].includes(type)){const n=pick(rng,[3,4,5,6,8,9,10,12]);return task({n,regular:true},type==='regular'?'Find one interior angle of this regular '+n+'-sided polygon.':type==='exterior'?'Find the exterior turning angle of this regular '+n+'-sided polygon.':'Find the sum of all interior angles of this '+n+'-sided polygon.',type==='regular'?polyInterior(n):type==='exterior'?polyExterior(n):180*(n-2),type==='regular'?'Divide the interior angle sum '+180*(n-2)+'° by '+n+'.':type==='exterior'?'One complete turn is 360°. Divide by '+n+'.':'Divide the polygon into '+(n-2)+' triangles, each with angle sum 180°.')}
 if(type==='parallel'){const a=angle(35,145),relation=pick(rng,['corresponding','alternate']);return task({angle:a,relation,rotation:0},'The lines are parallel. Find the marked '+relation+' angle x.',a,'Corresponding and alternate angles between parallel lines are equal.')}
 if(type==='build-sss'||type==='build-equilateral'){
   const l=type==='build-equilateral'?6:rand(rng,4,7),r=type==='build-equilateral'?6:rand(rng,4,7);
   return task({length:l,rightLength:r,angle:Math.acos((36+l*l-r*r)/(12*l))/D},'Construct triangle ABC with AB = 6 cm, AC = '+l+' cm and BC = '+r+' cm. Draw the remaining sides.', 'AB = 6 cm; AC = '+l+' cm; BC = '+r+' cm','Use the compass to draw arcs of radius '+l+' cm from A and '+r+' cm from B. Their intersection is C. Join C to A and B. Reflection across AB is also valid.');
 }
 if(type==='build-right'){
   const l=rand(rng,3,6);return task({angle:90,length:l},'Construct triangle ABC with AB = 6 cm, AC = '+l+' cm and a right angle at A. Join B to C.','AB = 6 cm; AC = '+l+' cm; angle BAC = 90°','Align the set square or protractor with AB, draw a perpendicular at A, measure '+l+' cm to C and join B to C. Reflection is valid.');
 }
 if(type==='build-rectangle'||type==='build-square'){
   const l=type==='build-square'?6:rand(rng,3,5);
   return task({angle:90,length:l},'Construct '+(type==='build-square'?'a square':'a rectangle')+' ABCD with AB = 6 cm and BC = '+l+' cm. Draw all four sides.','AB = CD = 6 cm; BC = DA = '+l+' cm; four right angles','Draw perpendiculars at A and B on the same side of AB. Measure '+l+' cm along each to locate D and C. Join C and D. Reflection is valid.');
 }
 if(type==='build-midpoint')return task({},'Mark the midpoint of AB, where AB = 6 cm.','AM = MB = 3 cm','Measure 3 cm from A along AB. M must lie on AB, not merely be equidistant from its endpoints.');
 if(type==='build-perpendicular'){const l=rand(rng,2,5);return task({length:l,angle:90},'Draw AC perpendicular to AB, with AC = '+l+' cm.','AC = '+l+' cm; angle BAC = 90°','Place the set square along AB at A. Mark C '+l+' cm along the perpendicular and join A to C.');}
 if(type==='build-circle'){const l=pick(rng,[1,1.5,2]);return task({length:l},'Draw a circle with centre A and radius '+l+' cm.','Centre A; radius '+l+' cm','Set the compass opening to '+l+' cm, place its centre on A and draw the circle.');}
 if(type==='build-asa'){const a=pick(rng,[30,45,60,75]),b=pick(rng,[30,45,60,75].filter(b=>a+b<=120)),l=6*Math.sin(b*D)/Math.sin((180-a-b)*D);return task({angle:a,rightAngle:b,length:l},'Construct triangle ABC with AB = 6 cm, angle BAC = '+a+'° and angle ABC = '+b+'°. Draw both remaining sides.','Angles A = '+a+'°, B = '+b+'°, C = '+(180-a-b)+'°','Construct the two angles at A and B on the same side of AB. Mark their intersection C and join the sides. Reflections are valid.');}
 if(type==='build-bisector')return task({},'Construct a perpendicular bisector of AB. Make it cross AB and extend on both sides.','Crosses AB at its midpoint, at 90°','Draw equal compass arcs centred at A and B with opening greater than 3 cm. Join their intersections; the line passes through the midpoint at 90°.');
 if(type==='build-rhombus'){const a=pick(rng,[45,60,120]);return task({angle:a,length:6},'Construct rhombus ABCD with AB = 6 cm and angle BAD = '+a+'°. Draw all four sides.','All four sides = 6 cm; angle BAD = '+a+'°','Draw AD = 6 cm at '+a+'° to AB. Use equal compass openings from B and D to locate C opposite A. Join BC and CD.');}
 if(type==='shape-build'){const a=angle(30,120),l=rand(rng,3,7);return task({angle:a,length:l,baseLength:6},'Use geometry instruments to construct triangle ABC with AB = 6 cm, AC = '+l+' cm and angle BAC = '+a+'°. Draw both remaining sides.',a+'°; '+l+' cm','Accept the triangle with AB = 6 cm, AC = '+l+' cm and included angle '+a+'°. Rotation or reflection is also valid on paper.')}
 throw Error('Unknown family');
}

 // Construction Lab geometry uses SVG units: 40 units = 1 cm. No target
 // values enter snapping or instrument alignment.
 const LAB_UNIT=40,LAB_A=[340,302],LAB_B=[580,302],LAB_LENGTH_TOLERANCE_CM=.01,LAB_ANGLE_TOLERANCE_DEG=.01;
 const labDist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const labAngle=(a,b)=>mod(Math.atan2(a[1]-b[1],b[0]-a[0])/D);
 const labCross=(a,b)=>a[0]*b[1]-a[1]*b[0],labSub=(a,b)=>[a[0]-b[0],a[1]-b[1]],labDot=(a,b)=>a[0]*b[0]+a[1]*b[1];
 const labAt=(a,v,t)=>[a[0]+v[0]*t,a[1]+v[1]*t];

 const REGION_COLOURS=['#4c9b85','#5385c5','#d7a13c','#a080c5','#d77968'];
 function pointName(i){return String.fromCharCode(65+i%26)+(i>=26?Math.floor(i/26):'')}
 function polygonArea(points){return Math.abs(points.reduce((sum,p,i)=>sum+labCross(p,points[(i+1)%points.length]),0))/2}
 function validRegion(points,ids){
   if(!Array.isArray(ids)||ids.length<3||new Set(ids).size!==ids.length||ids.some(i=>!points[i]))return false;
   const p=ids.map(i=>points[i]),n=p.length,eps=1e-6;
   if(polygonArea(p)<eps||p.some((a,i)=>p.slice(i+1).some(b=>labDist(a,b)<eps)))return false;
   const orient=(a,b,c)=>labCross(labSub(b,a),labSub(c,a)),on=(a,b,c)=>Math.abs(orient(a,b,c))<eps&&labDot(labSub(c,a),labSub(c,b))<=eps;
   const intersects=(a,b,c,d)=>{const u=orient(a,b,c),v=orient(a,b,d),w=orient(c,d,a),z=orient(c,d,b);return (u*v<0&&w*z<0)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b)};
   for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){if(j===i+1||i===0&&j===n-1)continue;if(intersects(p[i],p[(i+1)%n],p[j],p[(j+1)%n]))return false}
   return true;
 }

 // Place measurements in the line's local coordinate system, rather than
 // shifting the baseline vertically (which crosses steep lines).
 function labelBox(p,angle,label,size){
   const rad=angle*D,u=[Math.cos(rad),Math.sin(rad)],v=[-u[1],u[0]];
   return {p,u,v,hw:Math.max(size*.6,String(label).length*size*.31)+3,hh:size*.63+3};
 }
 function labelIntersectsLine(box,a,b){
   const local=p=>{const q=labSub(p,box.p);return [labDot(q,box.u),labDot(q,box.v)]},p=local(a),q=local(b),d=labSub(q,p);
   let lo=0,hi=1;
   for(let i=0;i<2;i++){const bound=i?box.hh:box.hw;if(Math.abs(d[i])<1e-9){if(Math.abs(p[i])>bound)return false;continue}let t=(-bound-p[i])/d[i],z=(bound-p[i])/d[i];if(t>z)[t,z]=[z,t];lo=Math.max(lo,t);hi=Math.min(hi,z);if(lo>hi)return false}
   return true;
 }
 function labelCorners(b){return [-1,1].flatMap(i=>[-1,1].map(j=>labAt(labAt(b.p,b.u,i*b.hw),b.v,j*b.hh)))}
 function boxesOverlap(a,b){return [a.u,a.v,b.u,b.v].every(axis=>Math.abs(labDot(labSub(a.p,b.p),axis))<=Math.abs(labDot(a.u,axis))*a.hw+Math.abs(labDot(a.v,axis))*a.hh+Math.abs(labDot(b.u,axis))*b.hw+Math.abs(labDot(b.v,axis))*b.hh)}
 function dimensionPlacement(a,b,label,{size=14,offset=18,outside=null,lines=[],occupied=[],bounds=null,manualOffset=null}={}){
   if(labDist(a,b)<.001)return null;
   let angle=Math.atan2(b[1]-a[1],b[0]-a[0])/D;if(angle>90)angle-=180;if(angle<=-90)angle+=180;
   const u=[Math.cos(angle*D),Math.sin(angle*D)],n=[-u[1],u[0]],m=labAt(a,labSub(b,a),.5);
   if(Array.isArray(manualOffset)&&manualOffset.length===2&&manualOffset.every(Number.isFinite)){const p=labAt(m,manualOffset,1);return {p,angle,box:labelBox(p,angle,label,size)}}
   const preferred=outside?Math.sign(labDot(labSub(outside,m),n))||1:-1;
   const base=Math.max(offset,size*.63+7);
   for(const side of [preferred,-preferred])for(const extra of [0,12,25,42,64,90])for(const fraction of [.5,.35,.65,.2,.8]){
     const p=labAt(labAt(a,labSub(b,a),fraction),n,side*(base+extra)),box=labelBox(p,angle,label,size);
     if(bounds&&labelCorners(box).some(q=>q[0]<bounds[0]||q[1]<bounds[1]||q[0]>bounds[2]||q[1]>bounds[3]))continue;
     if([[a,b],...lines].some(([x,y])=>labelIntersectsLine(box,x,y))||occupied.some(o=>boxesOverlap(box,o)))continue;
     return {p,angle,box};
   }
   return null;
 }
 function angleLabelPlacement(o,r,start,sweep,label,size=18,minimum=r+22){
   const dir=start+sweep/2;
   const arms=[polar(...o,3000,start),polar(...o,3000,start+sweep)];
   for(let font=size;font>=10;font-=2){
     for(let radius=Math.max(minimum,r+font*.8+6);radius<=Math.max(minimum+100,230);radius+=4){
       const p=polar(...o,radius,dir),box=labelBox(p,0,label,font);
       if(arms.some(a=>labelIntersectsLine(box,o,a)))continue;
       // Entire label must sit beyond the angle arc, not merely its centre.
       const u=labSub(p,o),norm=Math.hypot(...u),radial=u.map(x=>x/norm),extent=Math.abs(radial[0])*box.hw+Math.abs(radial[1])*box.hh;
       if(radius-extent<r+4)continue;
       return {p,size:font,box};
     }
   }
   // Degenerate or exceptionally narrow sectors: put the annotation
   // alongside the sector instead of laying text across its arms.
   for(const delta of [15,-15,30,-30,45,-45,90,-90])for(const radius of [Math.max(minimum,r+36),Math.max(minimum,r+58),Math.max(minimum,r+80)]){
     const p=polar(...o,radius,dir+delta),box=labelBox(p,0,label,12);
     if(!arms.some(a=>labelIntersectsLine(box,o,a)))return {p,size:12,box};
   }
   const p=polar(...o,r+55,dir+90);return {p,size:10,box:labelBox(p,0,label,10)};
 }

 // Point names belong in the unmarked sector, including reflex angles.
 function angleVertexPlacement(o,start,sweep,label='A',size=13){
   const span=Math.max(0,Math.min(360,sweep)),gap=360-span,mid=start+span+gap/2;
   const arms=[polar(...o,243,start),polar(...o,243,start+span)];
   for(let radius=19;radius<=220;radius+=3){
     const p=polar(...o,radius,mid),box=labelBox(p,0,label,size);
     if(gap>0&&labelCorners(box).every(q=>mod(labAngle(o,q)-start-span)<gap)&&!arms.some(a=>labelIntersectsLine(box,o,a)))return {p,box,external:false};
   }
   // Full turns have no unmarked sector. Very narrow reflex complements
   // cannot fit a legible label either: keep the name outside the arc and
   // link it to its vertex, rather than writing over the angle marking.
   const dir=gap===0?start+180:mid;
   const p=polar(...o,Math.min(220,gap>0?145:77),dir);
   for(const delta of [0,15,-15,30,-30,60,-60,90,-90]){
     const q=polar(...o,Math.hypot(p[0]-o[0],p[1]-o[1]),dir+delta),box=labelBox(q,0,label,size);
     if(!arms.some(a=>labelIntersectsLine(box,o,a)))return {p:q,box,external:true};
   }
   return {p,box:labelBox(p,0,label,size),external:true};
 }
 function vertexLabel(p,prev,next,offset=22){
   const unit=v=>{const n=Math.hypot(...v)||1;return v.map(a=>a/n)};
   if(!prev&&!next)return [p[0]+offset,p[1]-offset*.6];
   const u=prev?unit(labSub(prev,p)):[0,0],v=next?unit(labSub(next,p)):[0,0],out=[-u[0]-v[0],-u[1]-v[1]];
   const dir=Math.hypot(...out)<.01?[0,-1]:unit(out);return labAt(p,dir,offset)
 }
 function polygonRegionKey(d){return [d.shapeView||'regular',d.n||5,d.regular!==false,d.showDiagonals===true].join(':')}

 const WORKSPACE_FORMATS={A4:[210,297],A5:[148,210],A3:[297,420]};
 function workspaceSize(format='custom',orientation='landscape',width=250,height=160){
   const paper=WORKSPACE_FORMATS[format],mm=paper?(orientation==='portrait'?paper:paper.slice().reverse()):[width,height];
   return {format:paper?format:'custom',orientation:orientation==='portrait'?'portrait':'landscape',w:Math.round(Math.max(50,Math.min(650,Number(mm[0])||250))*4),h:Math.round(Math.max(50,Math.min(650,Number(mm[1])||160))*4)};
 }
 function workspaceState(st){
   const w=st.workspace||{},width=Number(w.w),height=Number(w.h);
   return {...workspaceSize(w.format||(Number.isFinite(width)&&Number.isFinite(height)?'custom':'A4'),w.orientation||'landscape',Number.isFinite(width)?width/4:250,Number.isFinite(height)?height/4:160),...(w.expanded&&width>0&&height>0&&Number.isFinite(width)&&Number.isFinite(height)?{format:'custom',w:width,h:height,x:Number.isFinite(w.x)?w.x:0,y:Number.isFinite(w.y)?w.y:0,expanded:true}:{}),gridMm:[0,5,10,20].includes(w.gridMm)?w.gridMm:10};
 }
 // The Cartesian datum lives in model space, never in the camera or paper extent.
 // SVG coordinates remain unchanged for compatibility; mathematical y increases upwards.
 function datumState(st){const d=st.datum||{},ws=workspaceState(st),valid=Array.isArray(d.origin)&&d.origin.length===2&&d.origin.every(Number.isFinite);return {origin:valid?d.origin.slice():[(ws.x||0)+ws.w/2,(ws.y||0)+ws.h/2],axes:d.axes===true,showOrigin:d.showOrigin===true,graduations:d.graduations===true,coordinates:d.coordinates===true,snapAxes:d.snapAxes===true,snapOrigin:d.snapOrigin===true,snapGrid:d.snapGrid===true,snapDirection:d.snapDirection!==false}}
 function datumCoordinates(st,p){const o=datumState(st).origin;return [(p[0]-o[0])/LAB_UNIT,(o[1]-p[1])/LAB_UNIT]}
 function datumPoint(st,xy){const o=datumState(st).origin;return [o[0]+xy[0]*LAB_UNIT,o[1]-xy[1]*LAB_UNIT]}
 function datumCoordinateText(st,p){return '('+datumCoordinates(st,p).map(n=>String(Math.round(n*100)/100)).join(', ')+')'}
 function datumGridStart(min,origin,step){return origin+(Math.floor((min-origin)/step)+1)*step}
 function datumSnap(st,p,tol){const d=datumState(st),o=d.origin,candidates=[];if(d.snapOrigin)candidates.push({p:o.slice(),kind:'Origin'});if(d.snapAxes)candidates.push({p:[p[0],o[1]],kind:'X-axis'},{p:[o[0],p[1]],kind:'Y-axis'});const step=workspaceState(st).gridMm*4;if(d.snapGrid&&step>0)candidates.push({p:p.map((v,i)=>o[i]+Math.round((v-o[i])/step)*step),kind:'Grid'});return candidates.map(c=>({...c,d:labDist(c.p,p)})).filter(c=>c.d<=tol).sort((a,b)=>a.d-b.d)[0]||{p,kind:''}}
 function datumDirection(st,o,hit,tol){if(!datumState(st).snapDirection||hit.kind)return hit;const p=hit.p,dx=p[0]-o[0],dy=p[1]-o[1];if(Math.hypot(dx,dy)<tol*2)return hit;if(Math.abs(dy)<=tol&&Math.abs(dy)<=Math.abs(dx))return {p:[p[0],o[1]],kind:'Horizontal'};if(Math.abs(dx)<=tol)return {p:[o[0],p[1]],kind:'Vertical'};return hit}
 function datumGraphic(st,bounds,emit){const d=datumState(st),[x,y,w,h]=bounds,[ox,oy]=d.origin,right=x+w,bottom=y+h,inside=(a,b)=>a>=x&&a<=right&&b>=y&&b<=bottom;
   const stroke='#708e87',attrs={'stroke-width':1.25,stroke,'pointer-events':'none'},label=(a,b,t,extra={})=>emit('text',{x:a,y:b,fill:'#536f68','font-family':'Arial,sans-serif','font-size':12,'text-anchor':'middle','pointer-events':'none',...extra},t);
   if(d.axes){if(oy>=y&&oy<=bottom){emit('line',{...attrs,x1:x,y1:oy,x2:right-3,y2:oy,'data-ag-datum-axis':'x'});emit('path',{...attrs,d:'M '+(right-12)+' '+(oy-4)+' L '+(right-3)+' '+oy+' L '+(right-12)+' '+(oy+4),fill:'none'});label(right-13,oy-9,'x')}if(ox>=x&&ox<=right){emit('line',{...attrs,x1:ox,y1:bottom,x2:ox,y2:y+3,'data-ag-datum-axis':'y'});emit('path',{...attrs,d:'M '+(ox-4)+' '+(y+12)+' L '+ox+' '+(y+3)+' L '+(ox+4)+' '+(y+12),fill:'none'});label(ox+11,y+15,'y')}}
   if(d.graduations){const step=LAB_UNIT*Math.max(1,Math.ceil(Math.max(w,h)/LAB_UNIT/40));if(oy>=y&&oy<=bottom)for(let a=datumGridStart(x,ox,step);a<right-16;a+=step){if(Math.abs(a-ox)<.001)continue;emit('line',{...attrs,x1:a,y1:oy-4,x2:a,y2:oy+4,'data-ag-datum-tick':'x'});label(a,oy+15,String(Math.round((a-ox)/LAB_UNIT)))}if(ox>=x&&ox<=right)for(let b=datumGridStart(y,oy,step);b<bottom-8;b+=step){if(Math.abs(b-oy)<.001)continue;emit('line',{...attrs,x1:ox-4,y1:b,x2:ox+4,y2:b,'data-ag-datum-tick':'y'});label(ox-9,b+4,String(Math.round((oy-b)/LAB_UNIT)),{'text-anchor':'end'})}}
   if(d.showOrigin&&inside(ox,oy)){emit('circle',{cx:ox,cy:oy,r:3,fill:stroke,'data-ag-datum-origin':'1','pointer-events':'none'});label(ox-8,oy+15,'O (0, 0)',{'text-anchor':'end'})}
 }
 // A partial compass mark is an exact circular arc (signed angular sweep).
 function isLabArc(c){return Number.isFinite(c.start)&&Number.isFinite(c.sweep)&&Math.abs(c.sweep)<360}
 function labArcContains(c,a){if(!isLabArc(c))return true;const d=mod((a-c.start)*Math.sign(c.sweep));return d<=Math.abs(c.sweep)+1e-6||d>=360-1e-6}
 function labArcPath(o,c){const p=exactPolar(...o,c.r,c.start),q=exactPolar(...o,c.r,c.start+c.sweep);return 'M '+p.join(' ')+' A '+c.r+' '+c.r+' 0 '+(Math.abs(c.sweep)>180?1:0)+' '+(c.sweep<0?1:0)+' '+q.join(' ')}
 function labCircleExtents(o,c){return isLabArc(c)?[c.start,c.start+c.sweep,...[0,90,180,270].filter(a=>labArcContains(c,a))].map(a=>exactPolar(...o,c.r,a)):[[o[0]-c.r,o[1]-c.r],[o[0]+c.r,o[1]+c.r]]}
 function labCircleDistance(o,c,p){if(labArcContains(c,labAngle(o,p)))return Math.abs(labDist(o,p)-c.r);return Math.min(labDist(p,exactPolar(...o,c.r,c.start)),labDist(p,exactPolar(...o,c.r,c.start+c.sweep)))}
 // Finite content bounds: rays contribute their origins, never their infinite extent.
 function labContentBounds(st){
   let x=Infinity,y=Infinity,right=-Infinity,bottom=-Infinity;
   const include=(p,r=0)=>{if(!p||!p.every(Number.isFinite))return;x=Math.min(x,p[0]-r);y=Math.min(y,p[1]-r);right=Math.max(right,p[0]+r);bottom=Math.max(bottom,p[1]+r)};
   st.points.forEach((p,i)=>{include(p);if(st.pointLabels?.[st.names?.[i]]?.offset)include(labLabel(st,i))});if(st.names)for(const [i,j] of st.segments){const offset=st.dimensionLabels?.[labStyleKey(st,i,j)]?.offset;if(Array.isArray(offset)&&offset.length===2&&offset.every(Number.isFinite)&&labVisible(st,'segments',[i,j])&&labDimensionText(st,i,j,st.showMeasurements===true&&!labConstruction(st,'segments',[i,j])))include(labAt(labAt(st.points[i],labSub(st.points[j],st.points[i]),.5),offset,1))}st.circles.forEach(c=>labCircleExtents(st.points[c.i],c).forEach(p=>include(p)));for(const trail of Object.values(st.traces||{}))for(const p of trail)include(p);
   return Number.isFinite(x)?[x,y,right,bottom]:null;
 }
 function labStraightEnds(p,angle,bounds,infinite=false){return [infinite?rayEnd(p,angle+180,bounds):p,rayEnd(p,angle,bounds)]}
 function rayEnd(p,angle,bounds){const [x,y,w,h]=bounds,r=Math.max(...[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(q=>labDist(p,q)))+1;return labAt(p,[Math.cos(angle*D),-Math.sin(angle*D)],r)}
 function workspaceFits(st,w,h,x=0,y=0){
   const inside=p=>p&&p[0]>=x&&p[1]>=y&&p[0]<=x+w&&p[1]<=y+h;
   return st.points.every(inside)&&st.circles.every(c=>labCircleExtents(st.points[c.i],c).every(inside))&&Object.values(st.traces||{}).every(trail=>trail.every(p=>p===null||inside(p)));
 }

 function labNames(s){if(!Array.isArray(s.names)||s.names.length!==s.points.length){s.names=s.points.map((_,i)=>pointName(i));s.nextName=s.points.length}if(!Number.isInteger(s.nextName))s.nextName=s.points.length;if(!Array.isArray(s.regions))s.regions=[];labRayIds(s);if(s.given===false)s.datum=datumState(s);return s}
 // Prefer the exterior of a closed simple boundary, including concave polygons.
 function labOutside(s,i,j){
   const a=s.points[i],b=s.points[j],m=labAt(a,labSub(b,a),.5),v=labSub(b,a),len=Math.hypot(...v);if(len<.001)return null;
   const edges=[...s.segments,...(s.given!==false?[[0,1]]:[])],adj=k=>edges.filter(e=>e.includes(k)).map(e=>e[0]===k?e[1]:e[0]);
   let ids=[i,j],prev=i,cur=j;while(ids.length<=s.points.length){const neighbours=adj(cur);if(neighbours.length!==2)return null;const next=neighbours.find(k=>k!==prev);if(next===i){if(ids.length<3||adj(i).length!==2||!validRegion(s.points,ids))return null;let area=0;for(let k=0;k<ids.length;k++)area+=labCross(s.points[ids[k]],s.points[ids[(k+1)%ids.length]]);return labAt(m,[v[1]/len,-v[0]/len],Math.sign(area)*40)}if(next===undefined||ids.includes(next))return null;ids.push(next);prev=cur;cur=next}return null;
 }
 function labFaces(s){
   // Vector arrangement of finite straight edges and circular arcs.
   const E=1e-7,T=Math.PI*2,edges=s.segments.filter(e=>labVisible(s,'segments',e)).map(([i,j])=>({a:s.points[i],b:s.points[j],cuts:[0,1],key:'L:'+labStyleKey(s,i,j)})).filter(e=>labDist(e.a,e.b)>E);
   if(s.given!==false&&s.points.length>=2)edges.push({a:s.points[0],b:s.points[1],cuts:[0,1],key:'given'});
   const cs=s.circles.filter(c=>!isLabArc(c)&&c.r>E&&labVisible(s,'circles',c)).map(c=>({o:s.points[c.i],r:c.r,cuts:[0,Math.PI],key:'C:'+s.names[c.i]+':'+c.r}));
   const ca=(c,p)=>(Math.atan2(p[1]-c.o[1],p[0]-c.o[0])+T)%T,cp=(c,t)=>[c.o[0]+c.r*Math.cos(t),c.o[1]+c.r*Math.sin(t)];
   for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){const e=edges[i],f=edges[j],v=labSub(e.b,e.a),w=labSub(f.b,f.a),q=labSub(f.a,e.a),den=labCross(v,w);if(Math.abs(den)>E){const t=labCross(q,w)/den,u=labCross(q,v)/den;if(t>=-E&&t<=1+E&&u>=-E&&u<=1+E){e.cuts.push(Math.max(0,Math.min(1,t)));f.cuts.push(Math.max(0,Math.min(1,u)))}}else if(Math.abs(labCross(q,v))<E){for(const p of [f.a,f.b]){const t=labDot(labSub(p,e.a),v)/labDot(v,v);if(t>E&&t<1-E)e.cuts.push(t)}for(const p of [e.a,e.b]){const t=labDot(labSub(p,f.a),w)/labDot(w,w);if(t>E&&t<1-E)f.cuts.push(t)}}}
   for(const e of edges)for(const c of cs){const v=labSub(e.b,e.a),q=labSub(e.a,c.o),aa=labDot(v,v),bb=2*labDot(q,v),cc=labDot(q,q)-c.r*c.r,disc=bb*bb-4*aa*cc;if(disc< -E)continue;for(const t of [(-bb-Math.sqrt(Math.max(0,disc)))/(2*aa),(-bb+Math.sqrt(Math.max(0,disc)))/(2*aa)])if(t>=-E&&t<=1+E){const u=Math.max(0,Math.min(1,t));e.cuts.push(u);c.cuts.push(ca(c,labAt(e.a,v,u)))}}
   for(let i=0;i<cs.length;i++)for(let j=i+1;j<cs.length;j++){const c=cs[i],d=cs[j],v=labSub(d.o,c.o),l=Math.hypot(...v);if(l<E||l>c.r+d.r+E||l<Math.abs(c.r-d.r)-E)continue;const x=(c.r*c.r-d.r*d.r+l*l)/(2*l),h=Math.sqrt(Math.max(0,c.r*c.r-x*x)),m=labAt(c.o,v,x/l);for(const sign of [-1,1]){const p=labAt(m,[-v[1],v[0]],sign*h/l);c.cuts.push(ca(c,p));d.cuts.push(ca(d,p))}}
   const nodes=[],adj=[],half=[];function node(p){let i=nodes.findIndex(q=>labDist(q,p)<1e-4);if(i<0){i=nodes.length;nodes.push(p);adj.push([])}return i}
   const cuts=ts=>[...new Set(ts.map(t=>Math.round(t*1e9)/1e9))].sort((a,b)=>a-b);
   function edge(a,b,key,arc=null){const i=node(a),j=node(b);if(i===j)return;const reverse=arc?{...arc,t:arc.t+arc.dt,dt:-arc.dt}:null;for(const [u,v,c] of [[i,j,arc],[j,i,reverse]]){const dir=c?c.t+Math.sign(c.dt)*Math.PI/2:Math.atan2(nodes[v][1]-nodes[u][1],nodes[v][0]-nodes[u][0]);if(!c&&adj[u].some(k=>half[k].v===v&&!half[k].arc))return;const k=half.length;half.push({u,v,arc:c,dir:Math.atan2(Math.sin(dir),Math.cos(dir)),key});adj[u].push(k)}}
   for(const e of edges){const ts=cuts(e.cuts),v=labSub(e.b,e.a);for(let i=1;i<ts.length;i++)edge(labAt(e.a,v,ts[i-1]),labAt(e.a,v,ts[i]),e.key)}
   for(const c of cs){const ts=cuts(c.cuts);for(let i=0;i<ts.length;i++){const t=ts[i],dt=(ts[i+1]??ts[0]+T)-t;if(dt>E)edge(cp(c,t),cp(c,t+dt),c.key,{...c,t,dt})}}
   adj.forEach(a=>a.sort((i,j)=>half[i].dir-half[j].dir));const seen=new Set(),faces=[];
   for(let i=0;i<half.length;i++){if(seen.has(i))continue;let k=i,walk=[];while(!seen.has(k)&&walk.length<=half.length){seen.add(k);walk.push(half[k]);const e=half[k],a=adj[e.v],rev=k^1;k=a[(a.indexOf(rev)+a.length-1)%a.length]}if(k!==i||walk.length<2)continue;
     const points=[],commands=[],keys=[];let area=0;for(const e of walk){const a=nodes[e.u],b=nodes[e.v];points.push(a);keys.push(e.key);if(e.arc){const c=e.arc,n=Math.max(2,Math.ceil(Math.abs(c.dt)/(.025)));for(let j=1;j<n;j++)points.push(cp(c,c.t+c.dt*j/n));commands.push('A '+c.r+' '+c.r+' 0 '+(Math.abs(c.dt)>Math.PI?1:0)+' '+(c.dt>0?1:0)+' '+b.join(' '));area+=(labCross(c.o,labSub(b,a))+c.r*c.r*c.dt)/2}else{commands.push('L '+b.join(' '));area+=labCross(a,b)/2}}
     if(area>1e-4)faces.push({points,area,path:'M '+nodes[walk[0].u].join(' ')+' '+commands.join(' ')+' Z',key:[...new Set(keys)].sort().join('|')});
   }
   // Disconnected nested loops are holes, not overlapping filled regions.
   for(const f of faces){const children=faces.filter(g=>g!==f&&g.area<f.area-E&&g.points.every(p=>labContains(f.points,p)));const direct=children.filter(g=>!children.some(h=>h!==g&&h.area>g.area&&g.points.every(p=>labContains(h.points,p))));f.holes=direct;f.path+=direct.map(g=>' '+g.path).join('');f.key+=direct.map(g=>'!'+g.key).sort().join('')}
   return faces;
 }
 function labContains(points,p){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside}
 function labInFace(f,p){return labContains(f.points,p)&&!(f.holes||[]).some(h=>labContains(h.points,p))}
 function labFaceAt(s,p){return labFaces(s).filter(f=>labInFace(f,p)).sort((a,b)=>a.area-b.area)[0]||null}
 function labRegionShapes(s){const faces=s.regions.some(r=>r.seed)?labFaces(s):[];return s.regions.flatMap(r=>{if(r.seed){const matching=faces.filter(f=>f.key===r.faceKey),f=matching.find(f=>labInFace(f,r.seed))||(matching.length===1?matching[0]:null)||faces.filter(f=>labInFace(f,r.seed)).sort((a,b)=>a.area-b.area)[0];return f?[{path:f.path,colour:r.colour}]:[]}if(r.circle){const c=s.circles.find(c=>!isLabArc(c)&&s.names[c.i]===r.circle.name&&Math.abs(c.r-r.circle.radius)<1e-5);return c&&labVisible(s,'circles',c)?[{circle:{p:s.points[c.i],r:c.r},colour:r.colour}]:[]}return r.ids&&validRegion(s.points,r.ids)?[{points:r.ids.map(i=>s.points[i]),colour:r.colour}]:[]})}
 // Persistent annotations are teaching content, independent of transient measurements.
 // Match the actual visible geometry, not the length of the physical ruler
 // or a rounded protractor display. Never guess between multiple candidates.
 // Find real named half-lines, including a vertex inside an existing ray.
 function labNamedArms(s,i){
   const o=s.points[i],points=s.points,arms=new Set();if(!o)return [];
   const on=(p,line)=>{const v=labSub(line.b,line.a),len=Math.hypot(...v);if(len<1e-8)return false;const u=v.map(x=>x/len),d=labSub(p,line.a),k=labDot(d,u);return Math.abs(labCross(d,u))<1e-6&&(line.infinite||k>=-1e-6&&(line.ray||k<=len+1e-6))};
   for(const line of instrumentScene(s).lines)if(on(o,line))points.forEach((p,j)=>{if(j!==i&&labDist(p,o)>1e-8&&on(p,line))arms.add(j)});

   return [...arms];
 }
 // Resolve actual half-lines at a vertex, even when no named point lies in that direction.
 function labRayIds(s){if(!s.rays.length&&!Number.isInteger(s.nextAngleRayId))return;let next=Number.isInteger(s.nextAngleRayId)?s.nextAngleRayId:1;for(const r of s.rays){if(Number.isInteger(r.angleId))next=Math.max(next,r.angleId+1)}for(const r of s.rays)if(!Number.isInteger(r.angleId))r.angleId=next++;s.nextAngleRayId=next}
 function labAngleSupports(s,i){const o=s.points[i],out=[];if(!o)return out;labRayIds(s);
   const on=(a,v,limit,ref,infinite=false)=>{const len=Math.hypot(...v);if(len<1e-8)return;const u=v.map(x=>x/len),d=labSub(o,a),t=labDot(d,u);if(Math.abs(labCross(d,u))>1e-5||(!infinite&&t< -1e-5)||t>limit+1e-5)return;const angle=labAngle(a,labAt(a,u,1));if(t<limit-1e-5)out.push({ref:{...ref,side:1},angle});if(infinite||t>1e-5)out.push({ref:{...ref,side:-1},angle:mod(angle+180)})};
   const segment=(e,given=false)=>{if(!given&&!labVisible(s,'segments',e))return;const ids=e.slice().sort((a,b)=>s.names[a].localeCompare(s.names[b])),a=s.points[ids[0]],b=s.points[ids[1]],v=labSub(b,a);on(a,v,Math.hypot(...v),{kind:given?'given':'segment',ends:ids.map(j=>s.names[j])})};
   for(const e of s.segments)segment(e);if(s.given!==false&&s.points.length>=2)segment([0,1],true);
   for(const r of s.rays)if(labVisible(s,'rays',r)){const a=s.points[r.i],angle=labRayAngle(s,r);on(a,[Math.cos(angle*D),-Math.sin(angle*D)],Infinity,{kind:'ray',id:r.angleId},r.infinite===true)}
   return out;
 }
 function labAngleArms(s,i){const o=s.points[i],supports=labAngleSupports(s,i),named=labNamedArms(s,i).sort((a,b)=>labDist(s.points[a],o)-labDist(s.points[b],o)),arms=[];
   const same=(a,b)=>Math.abs(Math.sin((a-b)*D/2))<1e-7;
   for(const a of supports)if(!arms.some(b=>same(a.angle,b.angle)))arms.push({...a,j:named.find(j=>same(labAngle(o,s.points[j]),a.angle))??null});
   return arms.sort((a,b)=>a.angle-b.angle);
 }
 function labSector(i,a,b){const sweep=mod(b.angle-a.angle);return {ids:[a.j,i,b.j],refs:[a.ref,b.ref],from:a.angle,sweep}}
 function labAnglePair(s,i,first,second){const arms=labAngleArms(s,i),a=arms[first],b=arms[second];return a&&b&&first!==second?[labSector(i,a,b),labSector(i,b,a)]:[]}
 function labAngleSectors(s,i){const arms=labAngleArms(s,i);if(arms.length<2)return [];const sectors=arms.flatMap((a,k)=>{const b=arms[(k+1)%arms.length],sector=labSector(i,a,b);return sector.sweep>.01&&sector.sweep<359.99?[sector]:[]});
   if(arms.length>2)for(const a of sectors.slice()){const reverse={ids:a.ids.slice().reverse(),refs:a.refs.slice().reverse(),from:mod(a.from+a.sweep),sweep:360-a.sweep};if(!sectors.some(b=>Math.abs(a.sweep+ b.sweep-360)<1e-6&&Math.abs(Math.sin((reverse.from-b.from)*D/2))<1e-7))sectors.push(reverse)}
   return sectors;
 }
 function labSectorMark(s,sector){return {names:sector.ids.map(i=>i===null?null:s.names[i]),arms:sector.refs,sweepMode:'directed'}}
 function labSectorCaption(s,sector){return sector.ids.every(i=>i!==null)?'∠'+sector.ids.map(i=>labPointText(s,i)).join(''):'Angle at '+labPointText(s,sector.ids[1])}
 function labSectorPreview(sectors,i){const sector=sectors[i],multiple=sectors.length>2,outer=multiple&&sector.sweep>180,radius=outer?76:42,mid=sector.from+sector.sweep/2,pad=Math.min(4,sector.sweep*.12);return {radius,from:mod(outer?mid-13:sector.from+pad),sweep:outer?26:sector.sweep-2*pad}}
 function labRulerTargets(s,t,scale=1){
   const origin=[t.x,t.y],tol=Math.min(2,4/Math.max(.001,scale)),direction=[Math.cos(t.angle*D),-Math.sin(t.angle*D)],names=s.names||s.points.map((_,i)=>pointName(i));
   const aligned=s.points.map((p,i)=>{const v=labSub(p,origin);return {i,p,k:labDot(v,direction),error:Math.abs(labCross(direction,v))}}).filter(v=>v.error<=tol&&v.k>=-tol&&v.k<=t.size+tol).sort((a,b)=>a.k-b.k),matches=[];
   for(let i=0;i<aligned.length;i++)for(let j=i+1;j<aligned.length;j++){const a=aligned[i],b=aligned[j];if(labDist(a.p,b.p)<1e-8)continue;matches.push({kind:'length',names:[names[a.i],names[b.i]],points:[a.p,b.p],label:(s.segments.some(e=>e.includes(a.i)&&e.includes(b.i))?'Add length ':'Add distance ')+(s.names?labPointText(s,a.i)+labPointText(s,b.i):names[a.i]+names[b.i])})}
   return matches;
 }
 function labIndependentDimensions(s){
   const segments=new Set(s.segments.map(e=>labStyleKey(s,...e)));
   return Object.keys(s.dimensionLabels||{}).filter(k=>!segments.has(k)).flatMap(key=>{const ids=key.split(':').map(n=>s.names.indexOf(n));if(ids.length!==2||ids.some(i=>i<0))return [];const [i,j]=ids,value=labDimensionText(s,i,j,false);return value&&labDist(s.points[i],s.points[j])>.001?[{key,ids,value,offset:s.dimensionLabels[key].offset}]:[]});
 }
 function distanceGuide(a,b,q){const v=labSub(b,a),len=Math.hypot(...v),u=v.map(x=>x/len),n=[-u[1],u[0]],h=labDot(labSub(q.p,a),n),p=labAt(a,n,h),r=labAt(b,n,h),gap=Math.min(len*.42,q.box.hw+4),mid=labDot(labSub(q.p,p),u),sign=Math.sign(h)||1;
   const x=labAt(p,u,Math.max(0,Math.min(len,mid-gap))),y=labAt(p,u,Math.max(0,Math.min(len,mid+gap))),tick=4;
   return 'M '+labAt(a,n,sign*3).join(' ')+' L '+labAt(p,n,sign*4).join(' ')+' M '+labAt(b,n,sign*3).join(' ')+' L '+labAt(r,n,sign*4).join(' ')+' M '+p.join(' ')+' L '+x.join(' ')+' M '+y.join(' ')+' L '+r.join(' ')+' M '+labAt(p,n,-tick).join(' ')+' L '+labAt(p,n,tick).join(' ')+' M '+labAt(r,n,-tick).join(' ')+' L '+labAt(r,n,tick).join(' ');
 }
 // Physical set-square corners: preserve the original triangle and its base size.
 function labSquareMatches(s,t,scale=1,snapping=false,previous=null){
   if(!['square45','square30'].includes(t.kind)||!(t.size>0)||!Array.isArray(s.names)||s.names.length!==s.points.length)return [];
   const local=[[0,0],[t.size,0],[0,-t.size*(t.kind==='square30'?Math.sqrt(3):1)]],origin=[t.x,t.y],tol=(snapping?12:4)/Math.max(.001,scale),angleTol=snapping?3:.25,retaining=snapping&&previous?.kind?.startsWith('Aligned ')&&previous.kind.endsWith('° corner'),releaseTol=retaining?tol*1.5:tol,releaseAngle=retaining?angleTol*1.5:angleTol,diff=(a,b)=>Math.min(mod(a-b),mod(b-a)),rotate=(p,angle)=>[p[0]*Math.cos(angle*D)+p[1]*Math.sin(angle*D),-p[0]*Math.sin(angle*D)+p[1]*Math.cos(angle*D)],out=[];
   for(let corner=0;corner<3;corner++){
     const q=local[corner],offset=rotate(q,t.angle),world=labAt(origin,offset,1),others=local.filter((_,i)=>i!==corner),directions=others.map(p=>labAngle(q,p)),sweep=mod(directions[1]-directions[0]);if(sweep>180)directions.reverse();
     const expected=mod(directions[1]-directions[0]);
     for(let i=0;i<s.points.length;i++){const o=s.points[i],distance=labDist(world,o);if(distance>releaseTol)continue;const arms=labAngleArms(s,i);
       for(const a of arms){const angle=mod(a.angle-directions[0]);if(diff(angle,t.angle)>releaseAngle)continue;
         for(const b of arms){const sector=labSector(i,a,b);if(Math.abs(sector.sweep-expected)>.01||diff(b.angle,t.angle+directions[1])>releaseAngle)continue;
           const off=rotate(q,angle),pose=labSub(o,off),shift=labDist(pose,origin),key='square-corner:'+JSON.stringify([corner,o,a.angle,b.angle]);const held=retaining&&previous.snapKey===key,limit=held?releaseTol:tol,angularLimit=held?releaseAngle:angleTol;if(shift>limit||distance>limit||diff(angle,t.angle)>angularLimit||diff(b.angle,t.angle+directions[1])>angularLimit)continue;
           const mark=labSectorMark(s,sector),target={kind:'angle',...mark,points:[o,...[a,b].map(arm=>arm.j===null?exactPolar(...o,Math.min(t.size,100),arm.angle):s.points[arm.j])],label:'Add '+Math.round(expected)+'° mark',squareAngle:expected};
           out.push({target,x:pose[0],y:pose[1],angle,kind:'Aligned '+Math.round(expected)+'° corner',score:shift+diff(angle,t.angle)*.8,snapKey:key});
         }
       }
     }
   }
   return out.sort((a,b)=>a.score-b.score);
 }
 // A reference is a visible finite segment, identified by its stable point names.
 function labSquareBaseReferences(s,t,scale=1){
   if(!['square45','square30'].includes(t.kind)||!(t.size>0))return [];
   const o=[t.x,t.y],u=[Math.cos(t.angle*D),-Math.sin(t.angle*D)],tol=Math.min(2,4/Math.max(.001,scale)),out=[];
   for(const e of s.segments){
     if(!labVisible(s,'segments',e))continue;
     const [a,b]=e.map(i=>s.points[i]),v=labSub(b,a),len=Math.hypot(...v);if(len<1e-8)continue;
     const angle=Math.asin(Math.min(1,Math.abs(labCross(u,v))/len))/D;if(angle>.25)continue;
     const [p,q]=[a,b].map(x=>labSub(x,o)),lo=Math.max(0,Math.min(labDot(p,u),labDot(q,u))),hi=Math.min(t.size,Math.max(labDot(p,u),labDot(q,u)));
     if(hi-lo<Math.min(len,t.size)*.1||Math.max(Math.abs(labCross(p,u)),Math.abs(labCross(q,u)))>tol)continue;
     out.push({key:labStyleKey(s,...e),names:e.map(i=>labPointText(s,i)),points:[a,b]});
   }
   return out;
 }
 // A visual comparison has a tolerance; permanent parallel notation requires mathematical agreement.
 function labParallelMarkPlan(s,keys){
   if(!Array.isArray(keys)||keys.length!==2||keys[0]===keys[1])return {reason:'Choose two distinct segments'};
   const pair=keys.map(key=>s.segments.find(e=>labStyleKey(s,...e)===key&&labVisible(s,'segments',e)));
   if(pair.some(e=>!e))return {reason:'Reference unavailable'};
   const [a,b]=pair[0].map(i=>s.points[i]),v=labSub(b,a),len=Math.hypot(...v);
   if(len<1e-8)return {reason:'Reference unavailable'};
   const agrees=e=>{const [p,q]=e.map(i=>s.points[i]),w=labSub(q,p),l=Math.hypot(...w);return l>1e-8&&Math.atan2(Math.abs(labCross(v,w)),Math.abs(labDot(v,w)))/D<=1e-7};
   if(!agrees(pair[1]))return {reason:'Not exactly parallel'};
   if(pair[1].every(i=>Math.abs(labCross(v,labSub(s.points[i],a)))/len<=1e-7))return {reason:'Same supporting line'};
   const counts=pair.map(e=>labLineMarks(s,e).parallel),used=new Set(s.segments.map(e=>labLineMarks(s,e).parallel).filter(Boolean));
   if(counts[0]&&counts[1]&&counts[0]!==counts[1])return {reason:'Different existing arrow groups'};
   const group=counts[0]||counts[1]||[1,2,3].find(n=>!used.has(n));
   if(!group)return {reason:'All three arrow groups in use'};
   if(s.segments.some(e=>labLineMarks(s,e).parallel===group&&!agrees(e)))return {reason:'Existing arrow group conflicts'};
   if(counts.every(n=>n===group))return {reason:'Already marked'};
   return {group,pair};
 }
 function labSquareComparison(s,t,scale=1){
   const matches=labSquareBaseReferences(s,t,scale),ref=s.segments.find(e=>labStyleKey(s,...e)===t.squareReference&&labVisible(s,'segments',e));
   if(!t.squareReference)return {candidate:matches.length===1?matches[0]:null};
   if(!ref)return {missing:true};
   const [a,b]=ref.map(i=>s.points[i]),v=labSub(b,a),len=Math.hypot(...v);if(len<1e-8)return {missing:true};
   const reference={key:t.squareReference,names:ref.map(i=>labPointText(s,i)),points:[a,b]},others=matches.filter(m=>m.key!==reference.key);
   if(others.length!==1)return {reference};
   const candidate=others[0],w=labSub(candidate.points[1],candidate.points[0]),wl=Math.hypot(...w),angle=Math.atan2(Math.abs(labCross(v,w)),Math.abs(labDot(v,w)))/D;
   const collinear=angle<=.01&&candidate.points.every(p=>Math.abs(labCross(v,labSub(p,a)))/len<1e-7);
   const relation=collinear?'Collinear':angle<=.01?'Parallel':90-angle<=.01?'Perpendicular':'Neither';
   const marking=relation==='Parallel'?labParallelMarkPlan(s,[reference.key,candidate.key]):null;
   return {reference,candidate,angle,relation,marking:marking?.group?{kind:'parallel',keys:[reference.key,candidate.key],group:marking.group}:null,markingReason:marking?.reason};
 }
 function labMeasurementTarget(s,t,scale=1){
   if(['square45','square30'].includes(t.kind)){const matches=labSquareMatches(s,t,scale);return matches.length===1?matches[0].target:null}

   const origin=[t.x,t.y],tol=Math.min(2,4/Math.max(.001,scale)),direction=[Math.cos(t.angle*D),-Math.sin(t.angle*D)],points=s.points,names=s.names||points.map((_,i)=>pointName(i));
   if(t.kind==='ruler'){const matches=labRulerTargets(s,t,scale);return matches.length===1?matches[0]:null}
   if(t.kind!=='protractor'||!(t.reading>.01&&t.reading<=180))return null;
   const vertices=points.map((p,i)=>({p,i})).filter(v=>labDist(v.p,origin)<=tol);if(vertices.length!==1)return null;
   const {p:o,i}=vertices[0],arms=labAngleArms(s,i),diff=(a,b)=>Math.min(mod(a-b),mod(b-a)),hand=t.hand===-1?-1:1;
   const armAt=a=>{const matching=arms.filter(b=>diff(b.angle,a)<=.25);return matching.length===1?matching[0]:null};
   const a=armAt(t.angle),b=armAt(t.angle+hand*t.reading);if(!a||!b||a===b)return null;
   const sector=hand===1?labSector(i,a,b):labSector(i,b,a),mark=labSectorMark(s,sector);
   return {kind:'angle',...mark,points:sector.ids.map((j,k)=>j===null?polar(...o,Math.min(t.size||100,100),k===0?sector.from:sector.from+sector.sweep):points[j]),label:sector.ids.every(j=>j!==null)?'Add angle '+sector.ids.map(j=>labPointText(s,j)).join(''):'Add angle at '+labPointText(s,i)};

 }
 function labApplyMeasurement(s,target){
   if(!target)return false;
   if(target.kind==='parallel'){const plan=labParallelMarkPlan(s,target.keys);if(!plan.group||plan.group!==target.group)return false;for(const e of plan.pair)labSetLineMark(s,e,'parallel',plan.group);return true}
   const ids=target.names.map(n=>s.names.indexOf(n));if(target.kind==='length'&&(ids.length!==2||ids[0]===ids[1]||ids.some(i=>i<0)))return false;
   if(target.kind==='length'){const key=labStyleKey(s,...ids);s.dimensionLabels||={};s.dimensionLabels[key]={...s.dimensionLabels[key],mode:'measured'};delete s.dimensionLabels[key].text;return true}
   if(target.kind==='angle'){const mark={names:target.names.slice(),...(target.arms?{arms:target.arms,sweepMode:target.sweepMode}:{}),kind:Math.abs((target.squareAngle??0)-90)<.01?'right':'angle1',labelMode:'measured'};const resolved=labAngleAnnotation(s,mark);if(!resolved||(target.squareAngle!==undefined&&Math.abs(resolved.angle-target.squareAngle)>.01))return false;s.angleNotation||=[];const existing=s.angleNotation.find(m=>labSameAngle(s,m,mark));if(existing){if(mark.kind==='right')existing.kind='right';existing.labelMode='measured';delete existing.label}else s.angleNotation.push(mark);return true}
   return false;
 }
 function labMeasurementDigits(s){return s.measurementPrecision===1?1:2}
 function labLengthText(s,length,digits=labMeasurementDigits(s)){return (length/LAB_UNIT).toFixed(digits)+' cm'}
 function labAngleText(s,angle){return (labMeasurementDigits(s)===2?angle.toFixed(2):String(Math.round(angle*10)/10))+'°'}
 // Only a manually chosen construction increment is quantised; geometry-derived values retain full precision.
 function labProtractorDirection(s,base,relative,hand,free,step=free?0:1){const bounded=relative<=180?relative:relative<270?180:0,reading=step>0?Math.max(0,Math.min(180,Math.round(bounded/step)*step)):bounded;return mod(base+hand*reading)}
 function labDimensionText(s,i,j,automatic){
   const entry=s.dimensionLabels?.[labStyleKey(s,i,j)];
   if(entry?.mode==='hidden')return '';
   if(entry?.mode==='custom')return String(entry.text||'');
   if(entry?.mode==='measured'||automatic)return labLengthText(s,labDist(s.points[i],s.points[j]));
   return '';
 }
 function labAngleAnnotation(s,m){
   const ids=m.names.map(n=>s.names.indexOf(n)),o=s.points[ids[1]];if(!o)return null;let start,end;if(m.arms){const supports=labAngleSupports(s,ids[1]),match=ref=>supports.find(a=>JSON.stringify(a.ref)===JSON.stringify(ref));const a=match(m.arms[0]),b=match(m.arms[1]);if(!a||!b)return null;start=a.angle;end=b.angle}else{const a=s.points[ids[0]],b=s.points[ids[2]];if(!a||!b||labDist(a,o)<1e-8||labDist(b,o)<1e-8)return null;start=labAngle(o,a);end=labAngle(o,b)}
   const sweep=mod(end-start),directed=m.sweepMode==='directed',from=!directed&&sweep>180?end:start,angle=directed?sweep:Math.min(sweep,360-sweep);
   if(angle<.01||angle>359.99)return null;
   const value=m.labelMode==='measured'?labAngleText(s,angle):m.labelMode==='custom'?String(m.label||''):'';
   return {ids,o,from,angle,value};
 }
 // Two markings sharing arms may describe different sides of the vertex.
 function labSameAngle(s,a,b){if(a.names[1]!==b.names[1])return false;const x=labAngleAnnotation(s,a),y=labAngleAnnotation(s,b);return !!(x&&y&&Math.abs(x.angle-y.angle)<1e-6&&Math.abs(Math.sin((x.from-y.from)*D/2))<1e-7)}
 // Matching symbols are independent assertions, not movement constraints.
 function labLineMarks(s,e){const key=labStyleKey(s,...e),old=s.notation?.[key],modern=s.lineMarks?.[key]||{};return {equal:modern.equal??(/^equal[123]$/.test(old||'')?Number(old.slice(-1)):0),parallel:modern.parallel??(/^parallel[123]$/.test(old||'')?Number(old.slice(-1)):0),symmetry:modern.symmetry??(old==='symmetry')}}
 function labSetLineMark(s,e,family,value){const key=labStyleKey(s,...e),marks=labLineMarks(s,e);if(!['equal','parallel','symmetry'].includes(family))return false;if(family==='symmetry')marks.symmetry=!!value;else {if(![0,1,2,3].includes(value))return false;marks[family]=value}s.lineMarks||={};if(marks.equal||marks.parallel||marks.symmetry)s.lineMarks[key]=marks;else delete s.lineMarks[key];if(s.notation)delete s.notation[key];return true}
 function labNotation(s,emit,label=()=>{},layout=null){for(const e of s.segments){if(!labVisible(s,'segments',e))continue;const marks=labLineMarks(s,e),a=s.points[e[0]],b=s.points[e[1]],v=labSub(b,a),l=Math.hypot(...v);if(l<8)continue;const u=v.map(x=>x/l),n=[-u[1],u[0]],m=labAt(a,v,.5),gap=marks.equal&&marks.parallel?Math.min(22,l*.19):0;if(marks.symmetry)emit('M '+a.join(' ')+' L '+b.join(' '),'symmetry');for(const family of ['equal','parallel']){const count=marks[family];if(!count)continue;const spacing=Math.min(9,l/(marks.equal&&marks.parallel?10:5)),centre=labAt(m,u,family==='equal'?-gap:gap);for(let j=0;j<count;j++){const p=labAt(centre,u,(j-(count-1)/2)*spacing),mark=family+count;if(family==='equal')emit('M '+labAt(p,n,-7).join(' ')+' L '+labAt(p,n,7).join(' '),mark,null,{key:labStyleKey(s,...e),family});else{const tip=labAt(p,u,5),back=labAt(p,u,-5);emit('M '+labAt(back,n,-5).join(' ')+' L '+tip.join(' ')+' L '+labAt(back,n,5).join(' '),mark,null,{key:labStyleKey(s,...e),family})}}}}for(const m of s.angleNotation||[]){const data=labAngleAnnotation(s,m);if(!data)continue;const {o,from,angle,value}=data;if(m.kind==='right'&&Math.abs(angle-90)>.01)continue;const count=m.kind==='angle3'?3:m.kind==='angle2'?2:1,prior=(s.angleNotation||[]).filter(x=>x!==m&&x.names[1]===m.names[1]&&s.angleNotation.indexOf(x)<s.angleNotation.indexOf(m)).reduce((sum,x)=>sum+(x.kind==='angle3'?3:x.kind==='angle2'?2:1)*9+6,0),base=23+prior;for(let j=0;j<count;j++){const r=base+j*9,p=polar(...o,r,from),q=polar(...o,r,from+angle);if(m.kind==='right'){if(Math.abs(angle-90)>1)continue;emit('M '+p.join(' ')+' L '+[p[0]+q[0]-o[0],p[1]+q[1]-o[1]].join(' ')+' L '+q.join(' '),m.kind,m)}else emit('M '+p.join(' ')+' A '+r+' '+r+' 0 '+(angle>180?1:0)+' 0 '+q.join(' '),m.kind,m)}if(value){const q=layout?labPlaceAngleLabel(layout,o,base+(count-1)*9,from,angle,value,13,base+22,m.labelOffset):{p:Array.isArray(m.labelOffset)&&m.labelOffset.length===2&&m.labelOffset.every(Number.isFinite)?labAt(o,m.labelOffset,1):angleLabelPlacement(o,base+(count-1)*9,from,angle,value,13,base+22).p};label(q.p,value,m)}}}
 function labStyleKey(s,i,j){return [s.names[i],s.names[j]].sort().join(':')}
 function labConstruction(s,kind,obj){return kind==='segments'?s.segmentStyles?.[labStyleKey(s,...obj)]===true:obj.construction!==false}
 const LAB_INK={default:null,blue:'#2359b8',red:'#b42332',green:'#14734a',purple:'#7944a3'};
 function labInk(s,kind,obj){const key=kind==='segments'?s.segmentColours?.[labStyleKey(s,...obj)]:obj.colour;return Object.hasOwn(LAB_INK,key)?LAB_INK[key]:null}
 function labVisible(s,kind,obj){return s.showConstruction!==false||!labConstruction(s,kind,obj)}
 function labReferenceAngle(s,ref,seen=new Set()){
   if(!ref)return null;let angle=null;
   if(ref.kind==='ray'){const source=s.rays.find(r=>r.angleId===ref.id);if(source&&!seen.has(source))angle=labRayAngle(s,source,seen)}
   else if(ref.kind==='segment'||ref.kind==='given'){const ids=ref.ends.map(n=>s.names.indexOf(n)),[a,b]=ids.map(i=>s.points[i]);const exists=ref.kind==='given'?s.given!==false&&ids.slice().sort().join(':')==='0:1':s.segments.some(e=>ids.every(i=>e.includes(i)));if(exists&&a&&b&&labDist(a,b)>1e-8)angle=labAngle(a,b)}
   return Number.isFinite(angle)?mod(angle+(ref.side===-1?180:0)):null;
 }
 function labRayAngle(s,r,seen=new Set()){
   if(r.referenceArm&&!seen.has(r)){const next=new Set(seen);next.add(r);const base=labReferenceAngle(s,r.referenceArm,next);if(base!==null)return mod(base+(r.relativeAngle||0))}
   const j=s.names?.indexOf(r.relativeTo);return j>=0&&j!==r.i&&labDist(s.points[r.i],s.points[j])>1e-8?mod(labAngle(s.points[r.i],s.points[j])+(r.relativeAngle||0)):r.angle;
 }
 function labReferenceArm(s,i,p,tol){
   const o=s.points[i];if(!o||labDist(o,p)<1e-8)return null;const q=labSub(p,o);
   const candidates=labAngleArms(s,i).map(a=>{const v=[Math.cos(a.angle*D),-Math.sin(a.angle*D)];return {...a,error:labDot(q,v)>0?Math.abs(labCross(q,v)):Infinity}}).filter(a=>a.error<=tol).sort((a,b)=>a.error-b.error);
   return candidates[0]||null;
 }
 // Detach dependants before deleting an object, preserving their current ink direction.
 function labDetachReferences(s,{point=-1,segment=null,ray=null}={}){
   labRayIds(s);
   const name=point>=0?s.names[point]:null,edge=segment?labStyleKey(s,...segment):null;
   const removedIds=new Set(s.rays.filter(r=>r===ray||r.i===point).map(r=>r.angleId));
   const removed=ref=>!!ref&&(ref.kind==='ray'?removedIds.has(ref.id):ref.kind==='segment'&&(ref.ends.includes(name)||(edge!==null&&ref.ends.slice().sort().join(':')===edge)));
   const affected=s.rays.filter(r=>removed(r.referenceArm)||(name!==null&&r.relativeTo===name));
   const angles=affected.map(r=>labRayAngle(s,r));
   affected.forEach((r,i)=>{r.angle=angles[i];delete r.referenceArm;delete r.relativeTo;delete r.relativeAngle;delete r.mark});
   if(s.angleNotation)s.angleNotation=s.angleNotation.filter(m=>!(name!==null&&m.names.includes(name))&&!m.arms?.some(removed));
 }
 function labRelativeRay(s,i,arm,angle,hand=1){if(!arm||!Number.isFinite(angle)||!s.points[i])return null;return {i,angle:mod(angle),referenceArm:{...arm.ref},relativeAngle:mod(angle-arm.angle),mark:{hand}}}

 function labRayDefinition(s,r){
   if(r.referenceArm&&labReferenceAngle(s,r.referenceArm)!==null)return {kind:'relative-object',origin:s.names[r.i],referenceArm:r.referenceArm,offset:mod(r.relativeAngle||0),angle:labRayAngle(s,r)};
   const j=s.names?.indexOf(r.relativeTo),linked=j>=0&&j!==r.i&&labDist(s.points[r.i],s.points[j])>1e-8;
   if(linked)return {kind:Math.abs(mod(r.relativeAngle||0))<1e-8?'through-point':'relative-angle',origin:s.names[r.i],reference:s.names[j],offset:mod(r.relativeAngle||0),angle:labRayAngle(s,r)};
   return {kind:'absolute-angle',origin:s.names?.[r.i],angle:mod(r.angle)};
 }
 function labAbsoluteRay(s,i,angle,construction){if(!s.points[i]||!Number.isFinite(angle))return null;return {i,angle:mod(angle),construction}}
 function labDirectRay(s,i,hit,construction){const o=s.points[i],a=labAngle(o,hit.p),j=hit.i;return {i,angle:a,construction,...(Number.isInteger(j)&&j!==i&&s.names?.[j]!==undefined?{relativeTo:s.names[j],relativeAngle:0}:{})}}
 function labMarks(s,i){return s.rays.filter(r=>r.i===i&&r.mark&&labVisible(s,'rays',r)).flatMap(r=>{
   let base,j=-1;if(r.referenceArm){const arm=labAngleSupports(s,i).find(a=>JSON.stringify(a.ref)===JSON.stringify(r.referenceArm));if(!arm)return [];base=arm.angle}
   else{j=s.names.indexOf(r.mark.base);if(j<0||j===i)return [];base=labAngle(s.points[i],s.points[j])}
   const a=labRayAngle(s,r),sweep=mod(r.mark.hand*(a-base));return sweep>.01&&sweep<359.99?[{r,j,start:r.mark.hand===1?base:a,sweep}]:[];
 })}
 function labAngleGraphics(s,emit,layout=null){for(let i=0;i<s.points.length;i++){const o=s.points[i];labMarks(s,i).forEach((m,k)=>{const same=(a,b)=>Math.abs(Math.sin((a-b)*D/2))<1e-6;if((s.angleNotation||[]).some(mark=>{if(mark.names[1]!==s.names[i])return false;const data=labAngleAnnotation(s,mark);return data&&same(data.from,m.start)&&Math.abs(data.angle-m.sweep)<1e-6}))return;const used=layout?(s.angleNotation||[]).filter(m=>m.names[1]===s.names[i]&&labAngleAnnotation(s,m)).reduce((n,m)=>n+(m.kind==='angle3'?3:m.kind==='angle2'?2:1)*9+6,0):0,radius=30+used+k*24,value=labAngleText(s,m.sweep),p=polar(...o,radius,m.start),q=polar(...o,radius,m.start+m.sweep),right=Math.abs(m.sweep-90)<.01;const d=right?'M '+p.join(' ')+' L '+[p[0]+q[0]-o[0],p[1]+q[1]-o[1]].join(' ')+' L '+q.join(' '):'M '+p.join(' ')+' A '+radius+' '+radius+' 0 '+(m.sweep>180?1:0)+' 0 '+q.join(' ');const label=layout?labPlaceAngleLabel(layout,o,radius,m.start,m.sweep,value,12,radius+15):angleLabelPlacement(o,radius,m.start,m.sweep,value,12,radius+15);emit(d,label.p,value,i,k)})}}
 // A single deterministic label plan is shared by the board and publication.
 // Manual offsets are preserved; automatic labels reserve their full text box.
 function labPlaceAngleLabel(layout,o,r,start,sweep,value,size,minimum,offset){
   if(Array.isArray(offset)&&offset.length===2&&offset.every(Number.isFinite)){const p=labAt(o,offset,1);return {p,box:labelBox(p,0,value,size)}}
   const dir=start+sweep/2,arms=[start,start+sweep].map(a=>[o,exactPolar(...o,3000,a)]),min=Math.max(minimum,r+size+8);
   const valid=box=>!layout.boxes.some(b=>boxesOverlap(box,b))&&![...arms,...layout.lines].some(([a,b])=>labelIntersectsLine(box,a,b))&&(!layout.bounds||labelCorners(box).every(([x,y])=>x>=layout.bounds[0]&&y>=layout.bounds[1]&&x<=layout.bounds[2]&&y<=layout.bounds[3]));
   for(let radius=min;radius<=Math.max(280,min+180);radius+=8)for(const delta of [0,-.2,.2,-.35,.35].map(k=>k*sweep)){
     const p=exactPolar(...o,radius,dir+delta),box=labelBox(p,0,value,size);if(valid(box)){layout.boxes.push(box);return {p,box}}
   }
   for(let radius=min;radius<=Math.max(280,min+180);radius+=12)for(const delta of [-30,30,-60,60,-90,90,180]){
     const p=exactPolar(...o,radius,dir+delta),box=labelBox(p,0,value,size);if(valid(box)){layout.boxes.push(box);return {p,box}}
   }
   // Crowded drawings retain the value and its contextual editability.
   const p=angleLabelPlacement(o,r,start,sweep,value,size,minimum).p,box=labelBox(p,0,value,size);layout.boxes.push(box);return {p,box};
 }
 function labAnnotationPlan(s,bounds){
   const boxes=s.points.map((p,i)=>labelBox(labLabel(s,i),0,labPointText(s,i)+(datumState(s).coordinates?' '+datumCoordinateText(s,p):''),16)),lines=labLines(s).map(l=>[l.infinite?labAt(l.a,l.v,-3000):l.a,l.ray?labAt(l.a,l.v,3000):l.b]),layout={boxes,lines,bounds},notation=[],labels=[],automatic=[];
   for(const m of s.angleNotation||[]){const data=labAngleAnnotation(s,m),offset=m.labelOffset;if(data?.value&&Array.isArray(offset)&&offset.length===2&&offset.every(Number.isFinite))boxes.push(labelBox(labAt(data.o,offset,1),0,data.value,13))}
   for(const [key,entry] of Object.entries(s.dimensionLabels||{})){if(!Array.isArray(entry.offset)||entry.offset.length!==2||!entry.offset.every(Number.isFinite))continue;const [i,j]=key.split(':').map(n=>s.names.indexOf(n));if(i<0||j<0)continue;const value=labDimensionText(s,i,j,false),q=value&&dimensionPlacement(s.points[i],s.points[j],value,{size:14,manualOffset:entry.offset});if(q)boxes.push(q.box)}
   labNotation(s,(...args)=>notation.push(args),(...args)=>labels.push(args),layout);
   labAngleGraphics(s,(...args)=>automatic.push(args),layout);
   return {boxes,notation,labels,automatic,renderNotation:(emit,label)=>{for(const a of notation)emit(...a);for(const a of labels)label(...a)},renderAutomatic:emit=>{for(const a of automatic)emit(...a)}};
 }
 // Stable point identifiers remain unchanged when a teacher edits visible names.
 function labPointText(s,i){const name=s.names[i],entry=s.pointLabels?.[name];return typeof entry?.text==='string'?entry.text:name}
 function labLabel(s,i){const p=s.points[i],offset=s.pointLabels?.[s.names[i]]?.offset;if(Array.isArray(offset)&&offset.length===2&&offset.every(Number.isFinite))return labAt(p,offset,1);const marks=labMarks(s,i);if(marks.length){const arms=marks.flatMap(m=>[m.start,mod(m.start+m.sweep)]),valid=a=>marks.every(m=>mod(a-m.start)>m.sweep+5&&mod(a-m.start)<355);let best=null;for(let a=0;a<360;a+=5){if(!valid(a))continue;const score=Math.min(...arms.map(b=>Math.min(mod(a-b),mod(b-a))));if(!best||score>best.score)best={a,score}}if(best)return polar(...p,25,best.a);const m=marks[0];return angleVertexPlacement(p,m.start,m.sweep,labPointText(s,i),13).p}const neighbours=s.segments.filter(e=>e.includes(i)).map(e=>s.points[e[0]===i?e[1]:e[0]]);if(s.given!==false&&i<2)neighbours.push(s.points[1-i]);return vertexLabel(p,neighbours[0],neighbours[1],20)}

 function labEmpty(free=false){return {given:!free,points:free?[]:[LAB_A.slice(),LAB_B.slice()],segments:[],rays:[],circles:[],regions:[]}}
 function labLines(s,exclude=-1){return [...(s.given!==false&&s.points.length>=2?[{a:s.points[0],b:s.points[1],ray:false}]:[]),...s.segments.filter(l=>!l.includes(exclude)&&labVisible(s,'segments',l)).map(([i,j])=>({a:s.points[i],b:s.points[j],ray:false})),...s.rays.filter(r=>r.i!==exclude&&labVisible(s,'rays',r)).map(r=>({a:s.points[r.i],b:labAt(s.points[r.i],[Math.cos(labRayAngle(s,r)*D),-Math.sin(labRayAngle(s,r)*D)],1),ray:true,infinite:r.infinite===true}))].map(l=>({...l,v:labSub(l.b,l.a)}))}
 function labWithin(l,t){return l.infinite||t>=-1e-7&&(l.ray||t<=1+1e-7)}
 // Shared exact intersection candidates: no named points are created by detection.
 function labIntersectionSettings(s){const v=s.intersectionOptions||{};return {snap:v.snap!==false,show:v.show===true,auto:v.auto===true}}
 function labIntersectionLines(s,lines){const d=datumState(s);if(s.given!==false||!d.snapAxes)return lines;const [x,y]=d.origin;return [...lines,{a:[x,y],b:[x+1,y],v:[1,0],ray:true,infinite:true,axis:'x'},{a:[x,y],b:[x,y+1],v:[0,1],ray:true,infinite:true,axis:'y'}]}
 function labIntersectionCircles(s,exclude=-1){return s.circles.filter(c=>c.i!==exclude&&labVisible(s,'circles',c)&&c.r>1e-8).map(c=>({...c,o:s.points[c.i]}))}
 function labIntersections(s,{exclude=-1,axes=false}={}){
  const drawn=labLines(s,exclude),lines=axes?labIntersectionLines(s,drawn):drawn,circles=labIntersectionCircles(s,exclude),intersections=[];
  const add=q=>{if(q.every(Number.isFinite)&&!intersections.some(v=>labDist(v.p,q)<1e-5))intersections.push({p:q,kind:'Intersection'})};
  for(let i=0;i<lines.length;i++)for(let j=i+1;j<lines.length;j++){
   const l=lines[i],m=lines[j];if(l.axis&&m.axis)continue;const v=labSub(m.a,l.a),den=labCross(l.v,m.v);
   if(Math.abs(den)<1e-7)continue;
   const t=labCross(v,m.v)/den,u=labCross(v,l.v)/den;
   if(labWithin(l,t)&&labWithin(m,u))add(labAt(l.a,l.v,t));
  }
  for(const l of lines)for(const c of circles){
   const v=labSub(l.a,c.o),aa=labDot(l.v,l.v),bb=2*labDot(v,l.v),cc=labDot(v,v)-c.r*c.r,disc=bb*bb-4*aa*cc;
   if(aa<1e-8||disc< -1e-7)continue;
   for(const t of [(-bb+Math.sqrt(Math.max(0,disc)))/(2*aa),(-bb-Math.sqrt(Math.max(0,disc)))/(2*aa)])if(labWithin(l,t)){const q=labAt(l.a,l.v,t);if(labArcContains(c,labAngle(c.o,q)))add(q)}
  }
  for(let i=0;i<circles.length;i++)for(let j=i+1;j<circles.length;j++){
   const a=circles[i],b=circles[j],dist=labDist(a.o,b.o);
   if(dist<1e-7||dist>a.r+b.r+1e-7||dist<Math.abs(a.r-b.r)-1e-7)continue;
   const x=(a.r*a.r-b.r*b.r+dist*dist)/(2*dist),h=Math.sqrt(Math.max(0,a.r*a.r-x*x)),u=labSub(b.o,a.o).map(v=>v/dist),q=labAt(a.o,u,x),v=[-u[1],u[0]];
   for(const p of [labAt(q,v,h),labAt(q,v,-h)])if(labArcContains(a,labAngle(a.o,p))&&labArcContains(b,labAngle(b.o,p)))add(p);
  }
  return intersections;
 }
 function labNewIntersections(s,before,bounds){const [x,y,w,h]=bounds;return labIntersections(s).filter(({p})=>p[0]>=x&&p[0]<=x+w&&p[1]>=y&&p[1]<=y+h&&!before.some(q=>labDist(q.p,p)<1e-5)&&!s.points.some(q=>labDist(q,p)<.001))}
 function labSnap(s,p,tol=16,enabled=true,exclude=-1,previous=null){
  if(!enabled)return {p,kind:''};
  const points=s.points.map((p,i)=>({p,kind:'Vertex',i})).filter(x=>x.i!==exclude);
  const lines=labLines(s,exclude),circles=labIntersectionCircles(s,exclude),intersections=labIntersectionSettings(s).snap?labIntersections(s,{exclude,axes:true}):[];
  const closest=(list)=>list.map(c=>({...c,d:labDist(c.p,p)})).filter(c=>c.d<=tol).sort((a,b)=>a.d-b.d)[0];
  // Prefer the closest exact target; retain an existing vertex when coincident.
  const targets=[...points,...intersections];
  // Only an actual, still-existing fixed point may be retained during a gesture.
  // Revalidate the candidate rather than freezing a previous pointer position.
  const held=previous&&targets.find(c=>c.kind===previous.kind&&(c.kind!=='Vertex'||c.i===previous.i)&&labDist(c.p,previous.p)<1e-7&&labDist(c.p,p)<=tol*1.5);
  if(held)return {...held,d:labDist(held.p,p)};
  const precise=closest(targets);if(precise)return precise;
  const guides=[];
  for(const l of lines){const den=labDot(l.v,l.v);if(den<1e-8)continue;const t=labDot(labSub(p,l.a),l.v)/den;if(labWithin(l,t))guides.push({p:labAt(l.a,l.v,t),kind:'On line'})}
  for(const c of circles){const len=labDist(p,c.o);if(len>1e-7&&labArcContains(c,labAngle(c.o,p)))guides.push({p:labAt(c.o,labSub(p,c.o),c.r/len),kind:isLabArc(c)?'On arc':'On circle'});if(isLabArc(c))for(const a of [c.start,c.start+c.sweep])guides.push({p:exactPolar(...c.o,c.r,a),kind:'Arc endpoint'})}
  return closest(guides)||{p,kind:''};
 }
 // Optional physical graduations modify only the radius/length chosen by the user.
 // Exact vertices/intersections and non-radial geometric references always win.
 function labGraduationHit(s,o,hit,stepCm){
  if(!(stepCm>0)||!['','Horizontal','Vertical','On line'].includes(hit.kind))return hit;
  const v=labSub(hit.p,o),length=Math.hypot(...v),step=stepCm*LAB_UNIT;if(length<1e-8)return hit;
  const r=Math.round(length/step)*step;if(r<=0)return hit;
  const p=labAt(o,v,r/length);
  if(hit.kind==='On line'){
    const on=(q,l,within=true)=>{const n=labDot(l.v,l.v);if(n<1e-12)return false;const t=labDot(labSub(q,l.a),l.v)/n;return (!within||labWithin(l,t))&&labDist(q,labAt(l.a,l.v,t))<1e-6};
    if(!labLines(s).some(l=>on(o,l,false)&&on(hit.p,l)&&on(p,l)))return hit;
  }
  return {...hit,p,kind:'Graduation',lengthCm:r/LAB_UNIT};
 }
 const labTypes=['shape-build','build-sss','build-equilateral','build-right','build-rectangle','build-square','build-midpoint','build-perpendicular','build-circle','build-asa','build-bisector','build-rhombus'];
 function labPracticeCheck(s,target){
  const linked=(i,j)=>s.segments.some(l=>l.includes(i)&&l.includes(j)),near=(a,b,t=.15)=>Math.abs(a-b)<=t,len=(a,b)=>labDist(a,b)/LAB_UNIT;
  const A=s.points[0],B=s.points[1];if(!A||!B)return {ready:false,correct:false};const midpoint=labAt(A,labSub(B,A),.5),base=labAngle(A,B),diff=(p,q)=>Math.min(mod(p-q),mod(q-p));
  if(target.type==='build-circle'){const ready=s.circles.length>0;return {ready,correct:s.circles.some(c=>!isLabArc(c)&&labDist(s.points[c.i],A)<=6&&near(c.r/LAB_UNIT,target.length))}}
  if(s.points.length<3)return {ready:false,correct:false};
  if(target.type==='build-midpoint')return {ready:true,correct:s.points.slice(2).some(p=>labDist(p,midpoint)<=6)};
  if(target.type==='build-perpendicular'){const candidates=s.points.slice(2).filter((p,i)=>linked(0,i+2));return {ready:candidates.length>0,correct:candidates.some(p=>near(len(A,p),target.length)&&near(diff(labAngle(A,p),base),90,2))}}
  if(target.type==='build-bisector'){const candidates=s.segments.map(([i,j])=>[s.points[i],s.points[j]]);return {ready:candidates.length>0,correct:candidates.some(([p,q])=>{const v=labSub(q,p),u=labSub(midpoint,p),n=labDot(v,v);if(n<1)return false;const t=labDot(u,v)/n;return t>0&&t<1&&labDist(midpoint,labAt(p,v,t))<=6&&near(diff(labAngle(p,q),base),90,2)})}}
  if(target.type==='build-rhombus'){let ready=false,correct=false;for(let c=2;c<s.points.length;c++)for(let d=2;d<s.points.length;d++){if(c===d||!linked(1,c)||!linked(c,d)||!linked(d,0))continue;ready=true;const C=s.points[c],E=s.points[d],expect=labAt(B,labSub(E,A),1);if(near(len(A,E),6)&&near(len(B,C),6)&&near(len(C,E),6)&&labDist(C,expect)<=6&&near(diff(labAngle(A,E),base),target.angle,2))correct=true}return {ready,correct}}
  if(target.type==='build-asa'){const candidates=s.points.slice(2).filter((p,i)=>linked(0,i+2)&&linked(1,i+2));return {ready:candidates.length>0,correct:candidates.some(p=>near(diff(labAngle(A,p),base),target.angle,2)&&near(diff(labAngle(B,p),labAngle(B,A)),target.rightAngle,2))}}
  if(target.type==='build-rectangle'||target.type==='build-square'){
    let ready=false,correct=false;
    for(let c=2;c<s.points.length;c++)for(let d=2;d<s.points.length;d++){
     if(c===d||!linked(1,c)||!linked(c,d)||!linked(d,0))continue;ready=true;
     const C=s.points[c],E=s.points[d],h=target.length*LAB_UNIT,sign=Math.sign(C[1]-B[1]);
     if(sign&&labDist(C,[B[0],B[1]+sign*h])<=6&&labDist(E,[A[0],A[1]+sign*h])<=6&&near(len(C,E),6)&&near(len(B,C),target.length)&&near(len(A,E),target.length))correct=true;
    }
    return {ready,correct};
  }
  const candidates=s.points.slice(2).map((p,k)=>{const i=k+2,angle=labAngle(A,p);return {i,length:len(A,p),rightLength:len(B,p),angle:Math.min(angle,360-angle),joined:linked(0,i)&&linked(1,i)}});
  return {ready:candidates.some(c=>c.joined),correct:candidates.some(c=>c.joined&&near(c.length,target.length)&&(['build-sss','build-equilateral'].includes(target.type)?near(c.rightLength,target.rightLength):near(c.angle,target.angle,2)))};
 }
 // The older pupil practice check deliberately allows hand-drawn approximations.
 // Precision verification is separate, uses raw geometry, and never changes the drawing.
 function labPrecisionCheck(s,target){
   const [A,B]=s.points,checks=[],lt=LAB_LENGTH_TOLERANCE_CM,at=LAB_ANGLE_TOLERANCE_DEG;
   if(!A||(!B&&target.type!=='build-circle'))return {ready:false,correct:false,checks:[]};
   const len=(a,b)=>labDist(a,b)/LAB_UNIT,linked=(i,j)=>s.segments.some(e=>e.includes(i)&&e.includes(j)),distance=(label,error)=>metric(label,error,lt,'cm'),angular=(label,error)=>metric(label,error,at,'°');
   function metric(label,error,tolerance,unit){error=Math.abs(error);return {label,error,tolerance,unit,ok:Number.isFinite(error)&&error<=tolerance+1e-10}}
   const angle=(a,o,b)=>{const u=labSub(a,o),v=labSub(b,o);return labDist(a,o)>1e-8&&labDist(b,o)>1e-8?Math.atan2(Math.abs(labCross(u,v)),labDot(u,v))/D:Infinity};
   const angleBetween=(u,v)=>Math.hypot(...u)>1e-8&&Math.hypot(...v)>1e-8?Math.atan2(Math.abs(labCross(u,v)),labDot(u,v))/D:Infinity;
   const requirement=(label,ok)=>({label,ok:!!ok});
   const base=()=>distance('AB length',len(A,B)-6),mid=()=>labAt(A,labSub(B,A),.5);
   const add=items=>checks.push(items);
   if(target.type==='build-circle'){
     for(const c of s.circles)if(!isLabArc(c)&&s.points[c.i])add([distance('Centre at A',len(s.points[c.i],A)),distance('Radius',c.r/LAB_UNIT-target.length)]);
   }else if(target.type==='build-midpoint'){
     for(const p of s.points.slice(2))add([base(),distance('Distance from the true midpoint',len(p,mid()))]);
   }else if(target.type==='build-bisector'){
     for(const [i,j] of s.segments){
       const p=s.points[i],q=s.points[j],v=labSub(q,p),n=labDot(v,v);if(n<1e-12)continue;
       const t=labDot(labSub(mid(),p),v)/n;
       add([base(),requirement('Segment extends on both sides of AB',t>0&&t<1),distance('Distance from the midpoint to the line',len(mid(),labAt(p,v,t))),angular('Perpendicular angle',angleBetween(v,labSub(B,A))-90)]);
     }
   }else if(['build-rectangle','build-square','build-rhombus'].includes(target.type)){
     for(let c=2;c<s.points.length;c++)for(let d=2;d<s.points.length;d++){
       if(c===d||!linked(1,c)||!linked(c,d)||!linked(d,0))continue;
       const C=s.points[c],E=s.points[d],pts=[A,B,C,E],h=target.type==='build-rhombus'?6:target.length;
       const items=[base(),distance('BC length',len(B,C)-h),distance('CD length',len(C,E)-6),distance('DA length',len(E,A)-h),requirement('Simple, non-degenerate quadrilateral',validRegion(pts,[0,1,2,3]))];
       if(target.type==='build-rhombus'){
         items.push(angular('Angle BAD',angle(B,A,E)-target.angle),angular('AB parallel to CD',Math.min(angleBetween(labSub(B,A),labSub(E,C)),angleBetween(labSub(A,B),labSub(E,C)))),angular('AD parallel to BC',Math.min(angleBetween(labSub(E,A),labSub(C,B)),angleBetween(labSub(A,E),labSub(C,B)))));
       }else for(let i=0;i<4;i++)items.push(angular('Right angle at '+['A','B','C','D'][i],angle(pts[(i+3)%4],pts[i],pts[(i+1)%4])-90));
       add(items);
     }
   }else {
     for(let i=2;i<s.points.length;i++){
       const C=s.points[i],perpendicular=target.type==='build-perpendicular';
       if(!linked(0,i)||(!perpendicular&&!linked(1,i)))continue;
       const items=[base()];
       if(!perpendicular)items.push(requirement('Non-degenerate triangle',Math.abs(labCross(labSub(B,A),labSub(C,A)))>1e-8));
       if(target.type==='build-asa')items.push(angular('Angle BAC',angle(B,A,C)-target.angle),angular('Angle ABC',angle(A,B,C)-target.rightAngle));
       else {
         items.push(distance('AC length',len(A,C)-target.length));
         if(['build-sss','build-equilateral'].includes(target.type))items.push(distance('BC length',len(B,C)-target.rightLength));
         else items.push(angular('Angle BAC',angle(B,A,C)-(perpendicular?90:target.angle)));
       }
       add(items);
     }
   }
   const score=items=>Math.max(...items.map(c=>c.tolerance?c.error/c.tolerance:c.ok?0:Infinity));
   checks.sort((a,b)=>Number(b.every(c=>c.ok))-Number(a.every(c=>c.ok))||score(a)-score(b));
   const best=checks[0]||[];
   return {ready:best.length>0,correct:best.length>0&&best.every(c=>c.ok),checks:best};
 }
 function labCheck(s,target){
   const practice=labPracticeCheck(s,target),precision=labPrecisionCheck(s,target);
   return {...practice,precise:precision.correct,precisionReady:precision.ready,precisionChecks:precision.checks};
 }
 function labSolution(d){
  const st=labEmpty(),A=st.points[0],B=st.points[1];
  if(d.type==='build-midpoint'){st.points.push(labAt(A,labSub(B,A),.5));return st}
  if(d.type==='build-circle'){st.circles.push({i:0,r:40*d.length,construction:false});return st}
  if(d.type==='build-perpendicular'){st.points.push(exactPolar(...A,40*d.length,90));st.segments.push([0,2]);return st}
  if(d.type==='build-bisector'){const m=labAt(A,labSub(B,A),.5);st.points.push([m[0],m[1]-155],[m[0],m[1]+65],m);st.segments.push([2,3]);return st}
  if(d.type==='build-rhombus'){const E=exactPolar(...A,240,d.angle),C=labAt(B,labSub(E,A),1);st.points.push(C,E);st.segments.push([1,2],[2,3],[3,0]);return st}
  if(d.type==='build-rectangle'||d.type==='build-square'){st.points.push([B[0],B[1]-40*d.length],[A[0],A[1]-40*d.length]);st.segments.push([1,2],[2,3],[3,0]);return st}
  st.points.push(exactPolar(...A,40*d.length,d.angle));st.segments.push([0,2],[1,2]);
  if(d.type==='build-sss'||d.type==='build-equilateral')st.circles.push({i:0,r:40*d.length},{i:1,r:40*d.rightLength});
  return st;
 }


 // Teaching classifications use actual geometry, not the preset name or rounded labels.
 function triangleProperties(pts){
   if(!Array.isArray(pts)||pts.length!==3)return null;
   const lengths=pts.map((p,i)=>labDist(p,pts[(i+1)%3])),scale=Math.max(...lengths),area=Math.abs(labCross(labSub(pts[1],pts[0]),labSub(pts[2],pts[0])))/2;
   if(!Number.isFinite(area)||scale<=1e-8||area<=1e-10*scale*scale)return null;
   const angles=pts.map((p,i)=>{const a=labSub(pts[(i+1)%3],p),b=labSub(pts[(i+2)%3],p);return Math.atan2(Math.abs(labCross(a,b)),labDot(a,b))/D}),equal=(a,b)=>Math.abs(a-b)<=scale*1e-9,pairs=lengths.filter((a,i)=>lengths.slice(i+1).some(b=>equal(a,b))).length;
   const sides=pairs===2?'Equilateral':pairs===1?'Isosceles':'Scalene',max=Math.max(...angles),kind=Math.abs(max-90)<=1e-8?'Right-angled':max>90?'Obtuse':'Acute',midpoints=pts.map((_,i)=>labAt(pts[(i+1)%3],labSub(pts[(i+2)%3],pts[(i+1)%3]),.5)),centroid=[0,1].map(k=>pts.reduce((sum,p)=>sum+p[k],0)/3);
   return {sides,kind,angles,lengths,midpoints,centroid,alsoIsosceles:sides==='Equilateral'};
 }
 const TRIANGLE_FAMILY_SIDES=['Equilateral','Isosceles','Scalene'],TRIANGLE_FAMILY_ANGLES=['Acute','Right-angled','Obtuse'];
 // Exclusive rows describe exact side classification; inclusive membership
 // is stated separately, since every equilateral triangle is isosceles.
 const TRIANGLE_FAMILY_EXAMPLES={
   'Equilateral|Acute':[60,60],
   'Isosceles|Acute':[50,50],'Isosceles|Right-angled':[45,45],'Isosceles|Obtuse':[30,30],
   'Scalene|Acute':[50,60],'Scalene|Right-angled':[30,60],'Scalene|Obtuse':[25,40]
 };
 function triangleFamilyExample(sides,kind){
   const a=TRIANGLE_FAMILY_EXAMPLES[sides+'|'+kind];return a?trianglePoints(a[0],a[1],0,0,300):null;
 }
 function triangleFamilyModel(points){
   const p=triangleProperties(points);if(!p)return null;
   const cells=TRIANGLE_FAMILY_SIDES.flatMap(sides=>TRIANGLE_FAMILY_ANGLES.map(kind=>({sides,kind,possible:!!TRIANGLE_FAMILY_EXAMPLES[sides+'|'+kind],selected:p.sides===sides&&p.kind===kind})));
   return {...p,points,cells,members:['Triangle',p.sides,...(p.alsoIsosceles?['Isosceles']:[]),p.kind],explanation:p.alsoIsosceles?'Three equal sides imply three 60° angles. An equilateral triangle is always acute and is also isosceles under the inclusive definition.':p.sides==='Isosceles'?'Exactly two equal sides have equal opposite angles. An isosceles triangle may be acute, right-angled or obtuse.':'Three unequal sides have three unequal opposite angles. A scalene triangle may be acute, right-angled or obtuse.'};
 }
 function triangleCentres(pts){
   const p=triangleProperties(pts);if(!p)return null;
   const [a,b,c]=pts,u=labSub(b,a),v=labSub(c,a),den=2*labCross(u,v),uu=labDot(u,u),vv=labDot(v,v);
   const O=[a[0]+(uu*v[1]-vv*u[1])/den,a[1]+(u[0]*vv-v[0]*uu)/den],H=[0,1].map(k=>a[k]+b[k]+c[k]-2*O[k]);
   const opposite=pts.map((_,i)=>labDist(pts[(i+1)%3],pts[(i+2)%3])),perimeter=opposite.reduce((s,x)=>s+x,0),I=[0,1].map(k=>pts.reduce((s,q,i)=>s+q[k]*opposite[i],0)/perimeter);
   const foot=(q,i)=>{const a=pts[(i+1)%3],v=labSub(pts[(i+2)%3],a);return labAt(a,v,labDot(labSub(q,a),v)/labDot(v,v))};
   return {centroid:p.centroid,circumcentre:O,incentre:I,orthocentre:H,circumradius:labDist(O,a),inradius:labDist(I,foot(I,0)),midpoints:p.midpoints,altitudeFeet:pts.map(foot),contacts:pts.map((_,i)=>foot(I,i)),bisectorFeet:pts.map((q,i)=>{const a=pts[(i+1)%3],b=pts[(i+2)%3],l=labDist(q,a),r=labDist(q,b);return labAt(a,labSub(b,a),l/(l+r))})};
 }
 function eulerLineModel(pts){
   const p=triangleCentres(pts);if(!p)return null;
   const O=p.circumcentre,G=p.centroid,H=p.orthocentre,scale=Math.max(...pts.map((q,i)=>labDist(q,pts[(i+1)%3]))),coincident=Math.max(labDist(O,G),labDist(G,H))<=1e-9*scale;
   return {O,G,H,coincident,OG:labDist(O,G),GH:labDist(G,H),OH:labDist(O,H)};
 }
 const TRIANGLE_CENTRE_NAMES={centroid:'Centroid',circumcentre:'Circumcentre',incentre:'Incentre',orthocentre:'Orthocentre',euler:'Euler line'};
 const TRIANGLE_CENTRE_RULES={centroid:'Medians meet at G; each is divided 2 : 1.',circumcentre:'Perpendicular bisectors meet at O; OA = OB = OC.',incentre:'Angle bisectors meet at I; equal distances to all sides.',orthocentre:'Altitude lines meet at H; each is perpendicular to its side.',euler:'O, G and H are collinear; OG : GH = 1 : 2.'};
 // A comparison uses real lengths and a shared display scale. Classification
 // checks all vertex correspondences, so relabelling or reflection cannot change it.
 function triangleComparison(settings={}){
   const factor=[.5,1,1.5,2].includes(Number(settings.factor))?Number(settings.factor):1,angle=(Number.isFinite(Number(settings.rotation))?Number(settings.rotation):0)*D,mirror=settings.mirror===true?-1:1;
   const a=[[0,0],[4,0],[0,-3]],b=settings.distort===true?[[0,0],[12,0],[0,-5]]:a;
   return [a,b.map(([x,y])=>[factor*(mirror*x*Math.cos(angle)-y*Math.sin(angle)),factor*(mirror*x*Math.sin(angle)+y*Math.cos(angle))])];
 }
 function triangleComparisonResult(a,b){
   if(!triangleProperties(a)||!triangleProperties(b))return null;
   const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]],near=(x,y)=>Math.abs(x-y)<=1e-9*Math.max(1,Math.abs(x),Math.abs(y));
   for(const order of permutations){const ratios=a.map((p,i)=>labDist(b[order[i]],b[order[(i+1)%3]])/labDist(p,a[(i+1)%3]));if(ratios.every(r=>near(r,ratios[0])))return {label:near(ratios[0],1)?'Congruent':'Similar, not congruent',factor:ratios[0],order}}
   return {label:'Neither',factor:null,order:null};
 }
 const TRIANGLE_CRITERIA={
   SSS:{label:'SSS — three sides',explanation:'Three side lengths fix the triangle, apart from rotation or reflection.'},
   SAS:{label:'SAS — two sides and included angle',explanation:'The angle between the two given sides fixes their opening.'},
   ASA:{label:'ASA — two angles and included side',explanation:'The angles fix the shape; the given side fixes the size.'},
   RHS:{label:'RHS — right angle, hypotenuse and side',explanation:'In a right triangle the hypotenuse and one leg fix the remaining leg.'},
   SSA:{label:'SSA — two sides and a non-included angle',explanation:'The non-included angle and two side lengths can allow two different third vertices. These triangles are not congruent.'},
   AAA:{label:'AAA — three angles',explanation:'Three angles fix the shape but not its size. Enlargements have the same angles.'}
 };
 function triangleCriterion(kind,size=1){
   kind=Object.hasOwn(TRIANGLE_CRITERIA,kind)?kind:'SSS';const k=[1,2,3].includes(Number(size))?Number(size):1;
   let a,b,edges=[],angles=[];
   if(kind==='SSS'){const x=(6*6+5*5-7*7)/12;a=[[0,0],[6,0],[x,-Math.sqrt(25-x*x)]];edges=[0,1,2]}
   else if(kind==='SAS'){a=[[0,0],[6,0],exactPolar(0,0,4,60)];edges=[0,2];angles=[0]}
   else if(kind==='ASA'){a=trianglePoints(50,60,0,0,6);edges=[0];angles=[0,1]}
   else if(kind==='RHS'){a=[[0,0],[4,0],[0,-3]];edges=[0,1];angles=[0]}
   else if(kind==='AAA'){a=trianglePoints(45,60,0,0,5);b=a.map(p=>p.map(v=>v*1.5));angles=[0,1,2]}
   else {const t=8*Math.cos(30*D),h=Math.sqrt(25-64*Math.sin(30*D)**2);a=[[0,0],[8,0],exactPolar(0,0,t+h,30)];b=[[0,0],[8,0],exactPolar(0,0,t-h,30)];edges=[0,1];angles=[0]}
   // Reflect the second valid solution in its baseline if the criterion is sufficient.
   const unique=!b;if(unique)b=a.map(([x,y])=>[x,-y]);
   return {kind,unique,edges,angles,triangles:[a,b].map(pts=>pts.map(p=>p.map(v=>v*k)))};
 }
 // Sort only for the mathematical test; the three original givens remain in their stated order.
 function triangleInequality(lengths){
   if(!Array.isArray(lengths)||lengths.length!==3||lengths.some(x=>typeof x!=='number'||!Number.isFinite(x)||x<=0))return null;
   const sorted=lengths.slice().sort((a,b)=>a-b),[a,b,c]=sorted,delta=a+b-c,eps=Number.EPSILON*Math.max(a,b,c)*8;
   const kind=delta>eps?'valid':delta< -eps?'impossible':'flat';
   // Use the factored form of Heron's formula to retain precision near the boundary.
   const x=(c*c+a*a-b*b)/(2*c),h=kind==='valid'?Math.sqrt((c+a+b)*(a+b-c)*(c+a-b)*(c+b-a))/(2*c):0;
   return {sorted,delta,kind,points:kind==='valid'?[[0,0],[c,0],[x,-h]]:kind==='flat'?[[0,0],[c,0],[a,0]]:null};
 }
 function inequalitySettings(d){const a=d.inequalityLengths;return Array.isArray(a)&&a.length===3&&a.every(x=>Number.isInteger(x)&&x>=1&&x<=15)?a.slice():[3,4,5]}
 // Classification uses actual geometry, not the chosen example's name.
 // A simple concave quadrilateral is valid; crossed and degenerate outlines are not.
 function quadrilateralProperties(pts){
   if(!Array.isArray(pts)||pts.length!==4||!pts.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))return null;
   const edges=pts.map((p,i)=>labSub(pts[(i+1)%4],p)),lengths=edges.map(v=>Math.hypot(...v)),scale=Math.max(...lengths),eps=1e-9*scale;
   if(scale<1e-8||lengths.some(l=>l<=eps)||!validRegion(pts,[0,1,2,3]))return null;
   const turns=edges.map((v,i)=>labCross(v,edges[(i+1)%4])),sign=turns.reduce((s,v)=>s+v,0)>0?1:-1;
   if(turns.some(v=>Math.abs(v)<=scale*eps))return null;
   const convex=turns.every(v=>v*sign>0),equal=(a,b)=>Math.abs(a-b)<=eps,parallel=(i,j)=>Math.abs(labCross(edges[i],edges[j]))<=1e-9*lengths[i]*lengths[j],parallelPairs=[0,1].filter(i=>parallel(i,i+2)),angles=pts.map((p,i)=>{const a=labSub(pts[(i+3)%4],p),b=edges[i],angle=Math.atan2(Math.abs(labCross(a,b)),labDot(a,b))/D;return turns[(i+3)%4]*sign<0?360-angle:angle});
   const right=angles.filter(a=>Math.abs(a-90)<1e-7).length,allEqual=lengths.every(l=>equal(l,lengths[0])),kite=(equal(lengths[0],lengths[1])&&equal(lengths[2],lengths[3]))||(equal(lengths[0],lengths[3])&&equal(lengths[1],lengths[2])),para=parallelPairs.length===2;
   const families=['Quadrilateral'];if(convex&&parallelPairs.length>=1)families.push('Trapezium');if(para)families.push('Parallelogram');if(para&&right===4)families.push('Rectangle');if(kite&&convex)families.push('Kite');if(para&&allEqual)families.push('Rhombus');if(para&&right===4&&allEqual)families.push('Square');
   const kind=families.includes('Square')?'Square':families.includes('Rectangle')?'Rectangle':families.includes('Rhombus')?'Rhombus':para?'Parallelogram':families.includes('Kite')?'Kite':parallelPairs.length===1&&convex?'Trapezium':convex?'Other quadrilateral':'Concave quadrilateral';
   const u=labSub(pts[2],pts[0]),v=labSub(pts[3],pts[1]),den=labCross(u,v),w=labSub(pts[1],pts[0]),t=Math.abs(den)>scale*eps?labCross(w,v)/den:null,k=t===null?null:labCross(w,u)/den,intersection=t!==null&&t>=0&&t<=1&&k>=0&&k<=1?labAt(pts[0],u,t):null;
   const diagonalEqual=equal(Math.hypot(...u),Math.hypot(...v)),diagonalPerpendicular=!!intersection&&Math.abs(labDot(u,v))<=1e-9*Math.hypot(...u)*Math.hypot(...v),diagonalBisect=!!intersection&&Math.abs(t-.5)<1e-9&&Math.abs(k-.5)<1e-9;
   return {kind,families,convex,lengths,angles,parallelPairs,right,diagonalEqual,diagonalPerpendicular,diagonalBisect,intersection};
 }
 const QUAD_REASONING=[
  {id:'square-rectangle',prompt:'A square is a rectangle.',answer:'Always',note:'A rectangle has four right angles. Every square has four right angles, regardless of its equal sides.',examples:['Square']},
  {id:'rectangle-rhombus',prompt:'A rectangle is a rhombus.',answer:'Sometimes',note:'A square is both. A rectangle with unequal adjacent sides is not a rhombus.',examples:['Square','Rectangle']},
  {id:'rhombus-equal-diagonals',prompt:'A rhombus has equal diagonals.',answer:'Sometimes',note:'A square has equal diagonals. A non-square rhombus has unequal diagonals.',examples:['Square','Rhombus']},
  {id:'parallelogram-bisect',prompt:'The diagonals of a parallelogram bisect each other.',answer:'Always',note:'Opposite sides are parallel. Opposite triangles formed by the diagonals are congruent, so each diagonal is divided into two equal lengths.',examples:['Parallelogram','Rectangle']},
  {id:'rectangle-perp',prompt:'The diagonals of a rectangle are perpendicular.',answer:'Sometimes',note:'The diagonals of a square meet at right angles. In a non-square rectangle they do not.',examples:['Square','Rectangle']},
  {id:'one-pair-square',prompt:'A quadrilateral with exactly one pair of parallel sides is a square.',answer:'Never',note:'Every square has two pairs of parallel sides. Exactly one pair excludes a square.',examples:['Trapezium']},
  {id:'equal-diagonals-rectangle',prompt:'A convex quadrilateral with equal diagonals is a rectangle.',answer:'Sometimes',note:'Rectangles have equal diagonals, but so does an isosceles trapezium that has no right angles.',examples:['Rectangle','Trapezium']},
  {id:'three-right',prompt:'A quadrilateral has exactly three right angles.',answer:'Never',note:'The interior angles sum to 360°. Three right angles total 270°, so the fourth must also be 90°.',examples:['Rectangle']},
  {id:'kite-parallel',prompt:'A convex kite has two pairs of parallel sides.',answer:'Sometimes',note:'A rhombus is a kite under the inclusive definition and has two parallel pairs. Other kites need not have parallel sides.',examples:['Rhombus','Kite']},
  {id:'concave-square',prompt:'A concave quadrilateral is a square.',answer:'Never',note:'A concave quadrilateral has an interior angle greater than 180°. A square has four 90° angles.',examples:['Concave quadrilateral']}
 ];
 // Examples are witnesses, never a substitute for the general argument.
 const GEOMETRY_REASONING=[
   {id:'isosceles-right',prompt:'An isosceles triangle is right-angled.',answer:'Sometimes',note:'A 45°, 45°, 90° triangle is isosceles and right-angled; a 50°, 50°, 80° triangle is isosceles but acute.',examples:[['triangle','Isosceles','Right-angled'],['triangle','Isosceles','Acute']]},
   {id:'two-obtuse',prompt:'A triangle has two obtuse angles.',answer:'Never',note:'Two angles greater than 90° would already sum to more than 180°. Every triangle has interior angle sum 180°.',examples:[['triangle','Scalene','Obtuse'],['triangle','Scalene','Acute']]},
   {id:'equilateral-rotation',prompt:'An equilateral triangle has rotational symmetry of order 3.',answer:'Always',note:'Its three equal sides and three equal angles give identical positions after turns of 120°, 240° and 360°. These are the only matching turns in a full revolution.',examples:[['triangle','Equilateral','Acute']]},
   {id:'equal-side-regular',prompt:'A polygon with all sides equal is regular.',answer:'Sometimes',note:'A regular polygon must have equal sides AND equal angles. A square meets both conditions. A non-square rhombus has equal sides but unequal angles.',examples:[['quad','Square'],['quad','Rhombus']]},
   {id:'concave-reflex',prompt:'A simple concave polygon has at least one reflex interior angle.',answer:'Always',note:'A simple polygon is concave precisely when it has an inward turn, corresponding to an interior angle greater than 180°.',examples:[['quad','Concave quadrilateral']]},
   {id:'perimeter-area',prompt:'Two rectangles with the same perimeter have the same area.',answer:'Sometimes',note:'A 6 × 4 and a 4 × 6 rectangle have equal areas and perimeters. A 6 × 4 and a 3 × 7 rectangle both have perimeter 20 cm, but areas 24 and 21 cm².',examples:[['pair','perimeter',4],['pair','perimeter',3]]},
   {id:'area-perimeter',prompt:'Two rectangles with the same area have the same perimeter.',answer:'Sometimes',note:'A 6 × 4 and a 4 × 6 rectangle have equal areas and perimeters. A 6 × 4 and a 3 × 8 rectangle both have area 24 cm², but perimeters 20 and 22 cm.',examples:[['pair','area',4],['pair','area',3]]},
   {id:'triangle-three-right',prompt:'A triangle has three right angles.',answer:'Never',note:'Three right angles total 270°, but the interior angle sum of a triangle is 180°.',examples:[['triangle','Scalene','Right-angled'],['triangle','Equilateral','Acute']]}
 ];
 function geometryReasoning(id){
   const row=[...GEOMETRY_REASONING,...QUAD_REASONING].find(r=>r.id===id)||GEOMETRY_REASONING[0],near=(a,b)=>Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b)),fmt=v=>Number(v.toFixed(2));
   const examples=row.examples.map(spec=>{
     const s=typeof spec==='string'?['quad',spec.trim()]:spec;
     if(s[0]==='pair'){
       const m=areaComparison(s[1],s[2]),[a,b]=m.shapes,truth=s[1]==='area'?near(a.perimeter,b.perimeter):near(a.area,b.area);
       return {name:'Compare rectangles',points:m.shapes.map(v=>v.points),truth,evidence:'Areas: '+fmt(a.area)+' and '+fmt(b.area)+' cm²; perimeters: '+fmt(a.perimeter)+' and '+fmt(b.perimeter)+' cm.'};
     }
     const pts=s[0]==='triangle'?triangleFamilyExample(s[1],s[2]):quadReasoningPoints(s[1]),p=polygonProperties(pts),t=pts.length===3?triangleProperties(pts):null,q=pts.length===4?quadrilateralProperties(pts):null;
     let truth=false,evidence='';
     switch(row.id){
       case 'isosceles-right':truth=t.kind==='Right-angled';break;
       case 'two-obtuse':truth=t.angles.filter(a=>a>90+1e-8).length===2;break;
       case 'triangle-three-right':truth=t.angles.filter(a=>near(a,90)).length===3;break;
       case 'equilateral-rotation':truth=shapeSymmetry(pts).rotation===3;evidence='Rotational order: '+shapeSymmetry(pts).rotation+'. ';break;
       case 'equal-side-regular':truth=p.regular;evidence='All sides equal; '+(truth?'all angles equal. ':'angles not all equal. ');break;
       case 'concave-reflex':truth=p.angles.some(a=>a>180+1e-8);break;
       case 'square-rectangle':case 'equal-diagonals-rectangle':truth=q.families.includes('Rectangle');break;
       case 'rectangle-rhombus':truth=q.families.includes('Rhombus');break;
       case 'rhombus-equal-diagonals':truth=q.diagonalEqual;evidence='Diagonals '+(truth?'equal. ':'unequal. ');break;
       case 'parallelogram-bisect':truth=q.diagonalBisect;evidence='Diagonals '+(truth?'bisect each other. ':'do not bisect each other. ');break;
       case 'rectangle-perp':truth=q.diagonalPerpendicular;evidence='Diagonals '+(truth?'perpendicular. ':'not perpendicular. ');break;
       case 'one-pair-square':case 'concave-square':truth=q.families.includes('Square');break;
       case 'three-right':truth=q.right===3;break;
       case 'kite-parallel':truth=q.parallelPairs.length===2;break;
     }
     evidence+='Angles: '+p.angles.map(a=>fmt(a)+'°').join(', ')+(q?'; parallel pairs: '+q.parallelPairs.length: '')+'.';
     return {name:t?t.sides+' · '+t.kind:s[1],points:[pts],truth,evidence,diagonals:!!q&&/diagonal|bisect|perp/.test(row.id)};
   });
   return {...row,examples};
 }
 const QUAD_FAMILY_DEFINITIONS={
   Quadrilateral:'A simple polygon with four sides.',
   Trapezium:'A convex quadrilateral with at least one pair of parallel opposite sides.',
   Parallelogram:'Both pairs of opposite sides are parallel.',
   Rectangle:'Four right angles.',
   Kite:'Two pairs of equal adjacent sides; the pairs may be the same length.',
   Rhombus:'Four equal sides.',
   Square:'Four equal sides and four right angles.'
 };
 const QUAD_FAMILY_LINKS=[['Trapezium','Quadrilateral'],['Kite','Quadrilateral'],['Parallelogram','Trapezium'],['Rectangle','Parallelogram'],['Rhombus','Parallelogram'],['Rhombus','Kite'],['Square','Rectangle'],['Square','Rhombus']];
 const QUAD_FAMILY_EXAMPLES=['Square','Rectangle','Rhombus','Parallelogram','Trapezium','Kite','Concave quadrilateral'];
 function quadrilateralFamilyModel(points){
   const p=quadrilateralProperties(points);if(!p)return null;
   const members=p.families.slice(),nodes=Object.keys(QUAD_FAMILY_DEFINITIONS).map(name=>({name,member:members.includes(name),definition:QUAD_FAMILY_DEFINITIONS[name]}));
   return {kind:p.kind,points,members,nodes,links:QUAD_FAMILY_LINKS.map(([child,parent])=>({child,parent,active:members.includes(child)&&members.includes(parent)}))};
 }
 function quadReasoningPoints(name){return ({
   Square:[[0,0],[4,0],[4,4],[0,4]],Rectangle:[[0,0],[6,0],[6,4],[0,4]],Rhombus:[[0,0],[5,0],[8,4],[3,4]],Parallelogram:[[0,0],[6,0],[9,4],[3,4]],Trapezium:[[0,0],[8,0],[6,4],[2,4]],Kite:[[0,0],[3,4],[0,10],[-3,4]],'Concave quadrilateral':[[0,0],[6,0],[2,2],[0,6]]
 })[name].map(p=>p.map(x=>x*40))}
 // Ear clipping works for simple concave as well as convex polygons.
 // Flat vertices are intentionally rejected: they do not define a proper corner.
 function polygonProperties(pts){
   if(!Array.isArray(pts)||pts.length<3||pts.length>12||!pts.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))return null;
   const n=pts.length,ids=pts.map((_,i)=>i),edges=pts.map((p,i)=>labSub(pts[(i+1)%n],p)),lengths=edges.map(v=>Math.hypot(...v)),scale=Math.max(...lengths),eps=scale*scale*1e-10;
   if(!validRegion(pts,ids)||scale<1e-8||lengths.some(l=>l<scale*1e-10))return null;
   const cross=(a,b,c)=>labCross(labSub(pts[b],pts[a]),labSub(pts[c],pts[a])),winding=Math.sign(pts.reduce((sum,p,i)=>sum+labCross(p,pts[(i+1)%n]),0));
   const turns=edges.map((v,i)=>Math.atan2(winding*labCross(edges[(i+n-1)%n],v),labDot(edges[(i+n-1)%n],v))/D);
   if(turns.some(t=>Math.abs(t)<1e-8))return null;
   const angles=turns.map(t=>180-t),convex=turns.every(t=>t>0),remaining=ids.slice(),triangles=[];
   const contains=(a,b,c,p)=>winding*cross(a,b,p)>=-eps&&winding*cross(b,c,p)>=-eps&&winding*cross(c,a,p)>=-eps;
   while(remaining.length>3){
     let clipped=false;
     for(let i=0;i<remaining.length;i++){
       const a=remaining[(i+remaining.length-1)%remaining.length],b=remaining[i],c=remaining[(i+1)%remaining.length];
       if(winding*cross(a,b,c)<=eps||remaining.some(p=>p!==a&&p!==b&&p!==c&&contains(a,b,c,p)))continue;
       triangles.push([a,b,c]);remaining.splice(i,1);clipped=true;break;
     }
     if(!clipped)return null;
   }
   if(winding*cross(...remaining)<=eps)return null;
   triangles.push(remaining.slice());
   const diagonals=new Map();for(const tri of triangles)for(let i=0;i<3;i++){const a=tri[i],b=tri[(i+1)%3],gap=Math.abs(a-b);if(gap!==1&&gap!==n-1)diagonals.set([a,b].sort((a,b)=>a-b).join(':'),[a,b])}
   const regular=convex&&lengths.every(l=>Math.abs(l-lengths[0])<=scale*1e-9)&&angles.every(a=>Math.abs(a-angles[0])<=1e-7);
   return {n,winding,lengths,angles,turns,convex,regular,triangles,diagonals:[...diagonals.values()],interiorSum:angles.reduce((s,v)=>s+v,0),turnSum:turns.reduce((s,v)=>s+v,0),diagonalCount:n*(n-3)/2};
 }
 // Separate ALL vertex-pair diagonals from the non-crossing interior
 // diagonals used in a triangulation. Concave polygons need not admit a fan.
 function polygonFormulaProof(points,vertex=0){
   const p=polygonProperties(points);if(!p)return null;
   const n=p.n,i=Math.max(0,Math.min(n-1,Math.floor(Number(vertex)||0))),all=[];
   for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)if(b-a!==1&&b-a!==n-1)all.push([a,b]);
   const from=all.filter(pair=>pair.includes(i)),ordered=all.flatMap(([a,b])=>[[a,b],[b,a]]),fan=Array.from({length:n-2},(_,j)=>[i,(i+j+1)%n,(i+j+2)%n]);
   const triangles=p.convex?fan:p.triangles,internal=new Map();
   for(const tri of triangles)for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],gap=Math.abs(a-b);if(gap!==1&&gap!==n-1)internal.set([a,b].sort((a,b)=>a-b).join(':'),[a,b])}
   const prev=(i+n-1)%n,next=(i+1)%n,steps=[
    {title:'Start at one vertex',note:'From vertex '+pointName(i)+', exclude the vertex itself and its two neighbours '+pointName(prev)+' and '+pointName(next)+'. A diagonal joins non-neighbouring vertices. That leaves '+n+' − 3 = '+(n-3)+' possible diagonals.'},
    {title:'Count from every vertex',note:'Each of the '+n+' vertices has '+(n-3)+' possible diagonals. Multiplying gives '+n+' × '+(n-3)+' = '+ordered.length+' directed counts.'},
    {title:'Remove the double counting',note:all.length?'For example, '+pointName(all[0][0])+pointName(all[0][1])+' and '+pointName(all[0][1])+pointName(all[0][0])+' are the same diagonal. Every diagonal was counted twice, so divide by 2. Total = '+n+' × ('+n+' − 3) ÷ 2 = '+all.length+'.':'A triangle has no non-neighbouring vertices. The same formula gives 3 × (3 − 3) ÷ 2 = 0.'},
    {title:'Divide the polygon into triangles',note:(p.convex?'Draw the '+(n-3)+' non-crossing diagonals from the selected vertex.':'For a concave polygon, choose non-crossing diagonals inside the shape; a fan from an arbitrary vertex may leave the polygon.')+' Starting with one region, each of the '+internal.size+' cuts adds one region, giving 1 + ('+n+' − 3) = '+(n-2)+' triangles. Equivalently, removing one triangular ear reduces the side count by one until a final triangle remains.'},
    {title:'Find the interior angle sum',note:'Every triangle contributes 180°. The triangles fill the polygon without overlap, and their corner angles together make the original interior angles. So ('+n+' − 2) × 180° = '+180*(n-2)+'°. This also works for simple concave polygons.'}
   ];
   return {points,n,vertex:i,prev,next,convex:p.convex,all,from,ordered,triangles,internal:[...internal.values()],interiorSum:p.interiorSum,steps};
 }
 function freePolygonPoints(d){
   const n=Math.max(3,Math.min(12,Math.round(Number(d.n)||5))),p=d.polygonPoints;
   return Array.isArray(p)&&p.length===n&&p.every(q=>Array.isArray(q)&&q.length===2&&q.every(Number.isFinite))?p.map(q=>q.slice()):Array.from({length:n},(_,i)=>exactPolar(400,195,145,90+i*360/n));
 }
 // Exact integer-angle examples, including concave polygons. Model coordinates
 // are retained; rotation and uniform scaling in the renderer preserve angles.
 function pointNameForInvestigation(i){return String.fromCharCode(65+i)}
 function polygonInvestigationExamples(){
   return [
    {name:'Bevelled pentagon',points:[[0,0],[8,0],[8,4],[5,7],[0,7]]},
    {name:'Bevelled hexagon',points:[[2,0],[8,0],[10,2],[10,6],[0,6],[0,2]]},
    {name:'Clipped heptagon',points:[[2,0],[8,0],[10,2],[10,6],[8,8],[0,8],[0,2]]},
    {name:'L-shaped hexagon',points:[[0,0],[9,0],[9,3],[4,3],[4,8],[0,8]]},
    {name:'Notched octagon',points:[[0,0],[12,0],[12,8],[8,8],[8,3],[4,3],[4,8],[0,8]]},
    {name:'Bevelled octagon',points:[[2,0],[10,0],[12,2],[12,6],[10,8],[2,8],[0,6],[0,2]]}
   ];
 }
 function polygonInvestigationTurns(pts){
   const n=pts.length,sign=Math.sign(pts.reduce((s,p,i)=>s+labCross(p,pts[(i+1)%n]),0));return pts.map((p,i)=>{const a=labSub(p,pts[(i+n-1)%n]),b=labSub(pts[(i+1)%n],p);return Math.round(Math.atan2(sign*labCross(a,b),labDot(a,b))/D)});
 }
 // Circle investigations preserve exact internal angles and lengths.
 const FACT_VIEWS=[['straight','Angles on a straight line'],['point','Angles around a point'],['opposite','Vertically opposite angles'],['corresponding','Corresponding angles'],['alternate','Alternate interior angles'],['alternate-exterior','Alternate exterior angles'],['co-interior','Co-interior angles']];
 const TRANSVERSAL_VIEWS=FACT_VIEWS.slice(3).map(([id])=>id);
 function transversalModel(d={}){
   const angle=Math.max(35,Math.min(145,Number(d.angle)||60)),tilt=d.transversalParallel===false?15:0,relation=TRANSVERSAL_VIEWS.includes(d.fact)?d.fact:TRANSVERSAL_VIEWS.includes(d.relation)?d.relation:'corresponding',dx=65/Math.tan(angle*D);
   const upper=[400+dx,125],lower=[400-dx,255];
   const sectors=(base)=>[base,angle,base+180,angle+180].map((start,i)=>({start,sweep:i%2?180-angle+base:angle-base}));
   const u=sectors(0),l=sectors(tilt),pair=relation==='alternate'?[2,0]:relation==='alternate-exterior'?[0,2]:relation==='co-interior'?[3,0]:[0,0];
   const first=u[pair[0]],second=l[pair[1]],sum=first.sweep+second.sweep,match=relation==='co-interior'?Math.abs(sum-180)<1e-8:Math.abs(first.sweep-second.sweep)<1e-8;
   return {angle,tilt,relation,upper,lower,first,second,sum,match,parallel:tilt===0};
 }
 const SHAPE_VIEWS=[['regular','General polygons'],['free-polygon','Free polygon — drag vertices'],['free-triangle','Free triangle — drag vertices'],['free-quadrilateral','Free quadrilateral — drag vertices'],['triangle-comparison','Congruence & similarity (enrichment)'],['triangle-criterion','Congruence criteria (enrichment)'],['triangle-inequality','Triangle inequality (enrichment)'],['equilateral','Equilateral triangle'],['isosceles','Isosceles triangle'],['scalene','Scalene triangle'],['right-triangle','Right-angled triangle'],['kite','Kite'],['square','Square'],['rectangle','Rectangle'],['rhombus','Rhombus'],['parallelogram','Parallelogram'],['trapezium','Trapezium']];
 const CENTRE_VIEWS=[['none','Off'],['circumcentre','Circumcentre & circumcircle'],['incentre','Incentre & incircle'],['orthocentre','Orthocentre & altitudes'],['euler','Euler line — O, G, H']];
 const CIRCLE_THEOREMS=[['centre-angle','Angle at centre & circumference'],['semicircle','Angle in a semicircle'],['same-segment','Angles in the same segment'],['cyclic-quad','Opposite angles in a cyclic quadrilateral'],['alternate-segment','Alternate segment theorem'],['equal-tangents','Equal tangents from an external point']];
 const isCircleTheorem=view=>CIRCLE_THEOREMS.some(([k])=>k===view);
 function equalTangentTheorem(d={}){
   const r=Math.max(1,Math.min(15,Number(d.radius)||5)),O=[280,205],R=65+4*r,ratio=Math.max(1.2,Math.min(2.6,Number(d.tangentRatio)||1.9)),direction=Math.max(-25,Math.min(25,Number(d.tangentDirection)||0)),P=exactPolar(...O,R*ratio,direction),[A,B]=tangentContacts(O,P,R);
   const angleAt=(p,a,b)=>{const u=labSub(a,p),v=labSub(b,p);return Math.atan2(Math.abs(labCross(u,v)),labDot(u,v))/D};
   return {view:'equal-tangents',r,O,R,P,A,B,ratio,direction,PA:labDist(P,A)*r/R,PB:labDist(P,B)*r/R,OP:labDist(O,P)*r/R,angleA:angleAt(A,O,P),angleB:angleAt(B,O,P),halfA:angleAt(P,O,A),halfB:angleAt(P,O,B)};
 }
 function circleTheoremModel(d={}){
   if(d.circleView==='equal-tangents')return equalTangentTheorem(d);
   const view=isCircleTheorem(d.circleView)?d.circleView:'centre-angle',r=Math.max(1,Math.min(15,Number(d.radius)||5)),O=[400,205],R=65+6*r,span=view==='semicircle'?180:Math.max(45,Math.min(285,Number(d.theoremSpan)||120)),start=270-span/2,end=start+span;
   const clamp=(v,min,max,fallback)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:fallback)),same=view==='same-segment',cyclic=view==='cyclic-quad';
   const ranges={C:{start:end,span:360-span,lo:same?.08:.06,hi:same?.44:.94},D:cyclic?{start,span,lo:.08,hi:.92}:{start:end,span:360-span,lo:.56,hi:.92}};
   const c=clamp(d.theoremC,ranges.C.lo,ranges.C.hi,same?.25:.5),f=clamp(d.theoremD,ranges.D.lo,ranges.D.hi,cyclic?.5:.75),angles={A:start,B:end,C:end+c*(360-span),D:ranges.D.start+f*ranges.D.span};
   const points=Object.fromEntries(Object.entries(angles).map(([k,v])=>[k,exactPolar(...O,R,v)])),angleAt=(p,a,b)=>{const u=labSub(a,p),v=labSub(b,p);return Math.atan2(Math.abs(labCross(u,v)),labDot(u,v))/D},Cangle=angleAt(points.C,points.A,points.B),Dangle=angleAt(points.D,points.A,points.B);
   const T=exactPolar(...points.A,76,start+90),U=exactPolar(...points.A,76,start-90),tangentAngle=angleAt(points.A,T,points.B);
   return {view,r,O,R,span,start,end,angles,ranges,c,f,...points,Cangle,Dangle,T,U,tangentAngle};
 }
 function circleTheoremMove(d,which,p){
   const m=circleTheoremModel(d);
   if(m.view==='equal-tangents'){if(which!=='P'||labDist(m.O,p)<1e-8)return {};const direction=mod(labAngle(m.O,p)+180)-180;return {tangentRatio:Math.max(1.2,Math.min(2.6,labDist(m.O,p)/m.R)),tangentDirection:Math.max(-25,Math.min(25,direction))}}
   const range=m.ranges[which];if(!range||labDist(m.O,p)<1e-8)return {};
   const angle=labAngle(m.O,p),delta=mod(angle-range.start),lo=range.lo*range.span,hi=range.hi*range.span;
   const distance=(a,b)=>Math.abs(mod(a-b+180)-180),value=delta>=lo&&delta<=hi?delta:distance(delta,lo)<=distance(delta,hi)?lo:hi;
   return {[which==='C'?'theoremC':'theoremD']:value/range.span};
 }
 const CIRCLE_VIEWS=[['overview','Radius & diameter'],['chord','Chord & perpendicular bisector'],['sector','Arc & sector'],['segment','Circular segment'],['tangent','Radius & tangent'],...CIRCLE_THEOREMS];
 function circleInvestigation(d={}){
   const r=Math.max(1,Math.min(15,Number(d.radius)||5)),start=mod(Number.isFinite(d.circleStart)?d.circleStart:25),span=Math.max(5,Math.min(355,Number.isFinite(d.circleSpan)?d.circleSpan:110)),theta=span*D,O=[400,190],R=65+6*r,A=exactPolar(...O,R,start),B=exactPolar(...O,R,start+span),M=labAt(A,labSub(B,A),.5),normal=[Math.cos(start*D),-Math.sin(start*D)],tangent=[-normal[1],normal[0]],T=labAt(A,tangent,90),U=labAt(A,tangent,-90);
   return {r,start,span,O,R,A,B,M,T,U,chord:2*r*Math.sin(theta/2),distance:Math.abs(r*Math.cos(theta/2)),arc:r*theta,sector:r*r*theta/2,segment:r*r*(theta-Math.sin(theta))/2};
 }
 function circleInvestigationMove(d,which,p){
   const m=circleInvestigation(d);if(labDist(m.O,p)<1e-8)return {circleStart:m.start,circleSpan:m.span};
   const a=labAngle(m.O,p),end=mod(m.start+m.span),bounded=v=>Math.max(5,Math.min(355,v));
   if(which==='B')return {circleStart:m.start,circleSpan:bounded(mod(a-m.start))};
   if(d.circleView==='tangent')return {circleStart:a,circleSpan:m.span};
   const span=bounded(mod(end-a));return {circleStart:mod(end-span),circleSpan:span};
 }
 function freeQuadrilateralPoints(d){
   const p=d.quadrilateralPoints;
   return Array.isArray(p)&&p.length===4&&p.every(q=>Array.isArray(q)&&q.length===2&&q.every(Number.isFinite))?p.map(q=>q.slice()):[[175,100],[625,100],[625,320],[175,320]];
 }
 function freeTrianglePoints(d){
   const p=d.trianglePoints;
   return Array.isArray(p)&&p.length===3&&p.every(q=>Array.isArray(q)&&q.length===2&&q.every(Number.isFinite))?p.map(q=>q.slice()):[[170,310],[630,310],[335,95]];
 }
 // Teaching reference uses the unscaled geometric model. The diagram may
 // be fitted to the widget, so model centimetres are not a screen ruler.
 function shapeSymmetry(pts){
   const n=pts.length,centre=[0,1].map(k=>pts.reduce((s,p)=>s+p[k],0)/n),v=pts.map(p=>labSub(p,centre)),scale=Math.max(...v.map(p=>Math.hypot(...p))),eps=scale*1e-8;
   const i=v.findIndex(p=>Math.hypot(...p)>eps);if(i<0)return {reflection:0,rotation:0};
   const len=Math.hypot(...v[i]),close=(a,b)=>labDist(a,b)<=eps;let reflection=0,rotation=0;const axes=[];
   for(let j=0;j<n;j++){
     if(Math.abs(Math.hypot(...v[j])-len)>eps)continue;
     const alpha=Math.atan2(v[i][1],v[i][0]),beta=Math.atan2(v[j][1],v[j][0]),q=beta-alpha,axis=(alpha+beta)/2,co=Math.cos(q),si=Math.sin(q),u=[Math.cos(axis),Math.sin(axis)];
     if(v.every((p,k)=>close([co*p[0]-si*p[1],si*p[0]+co*p[1]],v[(j+k-i+n)%n])))rotation++;
     if(v.every((p,k)=>close([2*labDot(p,u)*u[0]-p[0],2*labDot(p,u)*u[1]-p[1]],v[(j+i-k+2*n)%n]))){reflection++;axes.push(u)}
   }
   return {reflection,rotation,axes,centre};
 }
 function shapeTeachingReference(d={}){
   if(d.mode!=='polygon'||['triangle-comparison','triangle-criterion','triangle-inequality'].includes(d.shapeView))return null;
   const shape=d.shapeView||'regular',pts=shape==='free-polygon'?freePolygonPoints(d):shape==='free-quadrilateral'?freeQuadrilateralPoints(d):shape==='free-triangle'?freeTrianglePoints(d):shape==='regular'?Array.from({length:d.n||5},(_,i)=>exactPolar(400,218,d.regular===false&&i===1?155*(1-(1-Math.cos(360/(d.n||5)*D))*.65):155,90+(d.rotation||0)+i*360/(d.n||5))):shapeGeometry(d);
   const p=polygonProperties(pts);if(!p)return {valid:false,groups:[]};
   const n=p.n,tri=n===3?triangleProperties(pts):null,quad=n===4?quadrilateralProperties(pts):null,sym=shapeSymmetry(pts),fmt=v=>Number(v.toFixed(2)).toString(),lengths=p.lengths.map(v=>v/LAB_UNIT),perimeter=lengths.reduce((s,v)=>s+v,0),area=polygonArea(pts)/(LAB_UNIT*LAB_UNIT),base=lengths[0],height=2*area/base;
   const kind=tri?tri.sides+' · '+tri.kind:quad?quad.kind:p.regular?'Regular '+n+'-gon':p.convex?'Irregular convex '+n+'-gon':'Concave '+n+'-gon';
   const properties=[['Classification',kind],['Sides and vertices',n+' of each'],['Interior angle sum','('+n+' − 2) × 180° = '+180*(n-2)+'°'],['Exterior turns','Signed sum = 360°'],['Symmetry',sym.reflection+' reflection '+(sym.reflection===1?'axis':'axes')+'; rotational order '+sym.rotation]];
   if(p.regular)properties.push(['Each interior / exterior angle',fmt(180*(n-2)/n)+'° / '+fmt(360/n)+'°']);
   if(quad)properties.push(['Opposite parallel pairs',String(quad.parallelPairs.length)],['Right angles',String(quad.right)],['Inclusive families',quad.families.join(', ')]);
   if(tri)properties.push(['Angle relationship',tri.sides==='Equilateral'?'All three angles are 60°.':tri.sides==='Isosceles'?'Angles opposite equal sides are equal.':'All three side lengths differ.']);
   const diagonals=[['Total diagonals',n+' × ('+n+' − 3) ÷ 2 = '+p.diagonalCount],['From each vertex',n+' − 3 = '+(n-3)],['Internal cuts in a triangulation',n+' − 3 = '+(n-3)],['Triangles in a triangulation',n+' − 2 = '+(n-2)]];
   if(quad){
     const u=labSub(pts[2],pts[0]),v=labSub(pts[3],pts[1]),I=quad.intersection,midAC=I&&labDist(I,labAt(pts[0],u,.5))<=1e-8*Math.max(...p.lengths),midBD=I&&labDist(I,labAt(pts[1],v,.5))<=1e-8*Math.max(...p.lengths);
     diagonals.push(['Diagonal lengths','AC = '+fmt(Math.hypot(...u)/LAB_UNIT)+' cm; BD = '+fmt(Math.hypot(...v)/LAB_UNIT)+' cm'],['Equal / perpendicular',(quad.diagonalEqual?'Equal':'Unequal')+'; '+(quad.diagonalPerpendicular?'perpendicular':'not perpendicular')],['Bisection',quad.diagonalBisect?'Bisect each other':midAC?'BD bisects AC only':midBD?'AC bisects BD only':'Do not bisect each other']);
   }
   const formulas=[['Perimeter', 'Add all sides = '+fmt(perimeter)+' cm'],['Area',''+fmt(area)+' cm²']];
   if(tri){
     formulas.push(['Triangle area','A = ½bh; b = '+fmt(base)+' cm, h = '+fmt(height)+' cm']);
     if(tri.sides==='Equilateral')formulas.push(['Equilateral area','A = (√3 ÷ 4)s²; P = 3s']);
     if(tri.kind==='Right-angled')formulas.push(['Pythagoras','a² + b² = c², where c is the hypotenuse']);
   }else if(quad?.kind==='Square'){
     formulas.push(['Square','A = s²; P = 4s; diagonal = s√2']);
   }else if(quad?.kind==='Rectangle'){
     formulas.push(['Rectangle','A = lw; P = 2(l + w); diagonal = √(l² + w²)']);
   }else if(quad?.kind==='Rhombus'){
     formulas.push(['Rhombus','A = bh = ½d₁d₂; P = 4s']);
   }else if(quad?.kind==='Parallelogram'){
     formulas.push(['Parallelogram','A = bh; P = 2(a + b)']);
   }else if(quad?.kind==='Trapezium'){
     formulas.push(['Trapezium','A = ½(a + b)h; a and b are parallel sides']);
   }else if(quad?.kind==='Kite'){
     formulas.push(['Kite','A = ½d₁d₂; P = 2(a + b)']);
   }else if(p.regular){
     const apothem=base/(2*Math.tan(Math.PI/n));formulas.push(['Regular polygon','P = ns; A = ½P × apothem'],['Apothem',fmt(apothem)+' cm']);
   }else formulas.push(['Irregular polygon','Split into non-overlapping triangles; add their areas.']);
   formulas.push(['Lengths','Model centimetres; display may be rescaled.']);
   return {valid:true,kind,points:pts,n,area,perimeter,symmetry:sym,polygon:p,quad,groups:[{title:'Properties & angles',rows:properties},{title:'Diagonals & triangulation',rows:diagonals},{title:'Formulae & example values',rows:formulas}]};
 }
 // Exact area-preserving demonstrations on the current shape.
 // Compare the transformed vertices, not rounded displayed angles.
 // A reflection is an isometry about an infinite mirror line.
 function reflectionInvestigation(m,degrees=0,offsetPercent=0){
   if(!m?.valid)return null;
   const pts=m.points,centre=m.symmetry.centre,n=pts.length,angle=Math.max(0,Math.min(180,Number(degrees)||0)),q=angle*D,u=[Math.cos(q),-Math.sin(q)],normal=[-u[1],u[0]],radius=Math.max(...pts.map(p=>labDist(p,centre))),offset=Math.max(-25,Math.min(25,Number(offsetPercent)||0)),origin=labAt(centre,normal,radius*offset/100),eps=radius*1e-8;
   const feet=pts.map(p=>labAt(origin,u,labDot(labSub(p,origin),u))),reflected=pts.map((p,i)=>[2*feet[i][0]-p[0],2*feet[i][1]-p[1]]);
   const match=pts.some((p,i)=>reflected.every((v,k)=>labDist(v,pts[(i-k+n)%n])<=eps));
   const axes=m.symmetry.axes.map(v=>((Math.atan2(-v[1],v[0])/D%180)+180)%180).map(x=>x>180-1e-9||x<1e-9?0:x).sort((a,b)=>a-b);
   return {angle,offset,origin,u,normal,centre,radius,feet,reflected,matches:match,axes};
 }
 function rotationInvestigation(m,degrees=0){
   if(!m?.valid)return null;
   const pts=m.points,centre=m.symmetry.centre,n=pts.length,angle=Math.max(0,Math.min(360,Number(degrees)||0)),q=angle*D,co=Math.cos(q),si=Math.sin(q),scale=Math.max(...pts.map(p=>labDist(p,centre))),eps=scale*1e-8;
   const rotated=pts.map(p=>{const [x,y]=labSub(p,centre);return [centre[0]+co*x+si*y,centre[1]-si*x+co*y]});
   const offset=pts.findIndex((p,i)=>rotated.every((v,k)=>labDist(v,pts[(i+k)%n])<=eps));
   return {angle,centre,rotated,matches:offset>=0,offset,order:m.symmetry.rotation,smallest:360/m.symmetry.rotation};
 }
 // Two equal outer squares, each containing four congruent right triangles.
 // Independent mathematical investigations in centimetres. Geometry, area
 // and perimeter are kept at full precision; only presentation is rounded.
 function areaComparison(kind='base-height',value,base=6,height=4){
   if(!['base-height','perimeter','area'].includes(kind))kind='base-height';
   base=Number(base);height=Number(height);if(!Number.isFinite(base)||base<=0)base=6;if(!Number.isFinite(height)||height<=0)height=4;
   const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))&&v!==null?Math.min(max,Math.max(min,Number(v))):fallback;
   const make=(points,width,h,apex)=>({points,width,height:h,apex,area:polygonArea(points),perimeter:points.reduce((sum,p,i)=>sum+labDist(p,points[(i+1)%points.length]),0)});
   const rect=(w,h)=>make([[0,0],[w,0],[w,h],[0,h]],w,h),tri=x=>make([[0,0],[base,0],[x,height]],base,height,x);
   let a,b,min,max,step=1,caption,explanation;
   if(kind==='base-height'){min=-2;max=base+2;value=clamp(value,min,max,base/2+2);a=tri(base/2);b=tri(value);caption='Same base and perpendicular height';explanation='Moving the apex along a line parallel to the base changes the side lengths, but not the perpendicular height. Both areas are ½ × base × height.'}
   else if(kind==='perimeter'){min=1;max=base+height-1;value=clamp(value,min,max,Math.min(max,base+1));a=rect(base,height);b=rect(value,base+height-value);caption='Same perimeter';explanation='The sum of the width and height stays fixed. Their product changes. Equal perimeter does not guarantee equal area.'}
   else {min=1;max=Math.max(1,base*height/2);value=clamp(value,min,max,Math.min(max,base+2));a=rect(base,height);b=rect(value,base*height/value);caption='Same area';explanation='Width × height stays fixed, so increasing one dimension reduces the other. The perimeter can change even when the area stays the same.'}
   return {kind,value,min,max,step,caption,explanation,shapes:[a,b]};
 }
 function pythagorasProof(points){
   const p=triangleProperties(points);if(p?.kind!=='Right-angled')return null;
   const i=p.angles.indexOf(Math.max(...p.angles)),a=labDist(points[i],points[(i+1)%3])/LAB_UNIT,b=labDist(points[i],points[(i+2)%3])/LAB_UNIT,c=labDist(points[(i+1)%3],points[(i+2)%3])/LAB_UNIT,L=a+b;
   const turn=q=>[L-q[1],q[0]],around=[[[0,0],[a,0],[0,b]]];
   for(let j=1;j<4;j++)around.push(around[j-1].map(turn));
   const centre=[[a,0],[L,a],[b,L],[0,b]],square=(x,y,s)=>[[x,y],[x+s,y],[x+s,y+s],[x,y+s]];
   const together=[[[a,0],[L,0],[a,a]],[[L,a],[a,a],[L,0]],[[0,a],[a,a],[0,L]],[[a,L],[0,L],[a,a]]];
   const small=[square(0,0,a),square(a,a,b)],fmt=v=>Number(v.toFixed(2)).toString();
   return {a,b,c,L,triangleArea:a*b/2,around,together,centre,small,steps:[
     {title:'Four congruent triangles',note:'Place four copies of the same right-angled triangle, with perpendicular sides a and b and hypotenuse c, at the corners of a square of side a + b.'},
     {title:'The first arrangement leaves c²',note:'The four hypotenuses form the central square. Its angles are 90° because the two acute angles of a right triangle add to 90°. The uncovered area is c².'},
     {title:'Rearrange the same triangles',note:'Put the same four triangles into two rectangles in an identical outer square. The uncovered regions are squares of sides a and b, with combined area a² + b².'},
     {title:'Equal remaining areas',note:'Both outer squares have the same area and contain the same four triangles. Subtract those equal triangle areas: a² + b² = c². Here '+fmt(a*a)+' + '+fmt(b*b)+' ≈ '+fmt(c*c)+' cm² (displayed values rounded). This proof applies to right-angled triangles.'}
   ]};
 }
 function shapeAreaProof(m){
   if(!m?.valid)return null;
   const n=m.n,kind=n===3?'triangle':m.quad?.kind;
   if(!['triangle','Parallelogram','Rhombus','Trapezium'].includes(kind))return null;
   const original=m.points;
   let i=n===4&&!m.quad.parallelPairs.includes(0)?1:0;
   if(n===4&&m.quad.parallelPairs.length===2&&labDist(original[(i+1)%4],original[(i+2)%4])>labDist(original[i],original[(i+1)%4]))i=(i+1)%4;
   const pts=Array.from({length:n},(_,j)=>original[(i+j)%n]),origin=pts[0],edge=labSub(pts[1],origin),b=Math.hypot(...edge),u=edge.map(x=>x/b),normal=[-u[1],u[0]],sign=Math.sign(labDot(labSub(pts[2],origin),normal));
   let p=pts.map(q=>[labDot(labSub(q,origin),u),sign*labDot(labSub(q,origin),normal)]);
   p[0]=[0,0];p[1]=[b,0];const h=p[2][1],eps=1e-8*Math.max(b,h);
   if(h<=eps)return null;
   const fmt=x=>Number((x/LAB_UNIT).toFixed(2)).toString(),area=x=>Number((x/(LAB_UNIT*LAB_UNIT)).toFixed(2)).toString(),originalArea=polygonArea(p);
   if(kind==='Parallelogram'||kind==='Rhombus'){
     if(p[3][0]<0)p=[p[1],p[0],p[3],p[2]].map(q=>[b-q[0],q[1]]);
     const s=p[3][0];if(s<-eps||s>b+eps)return null;
     const A=p[0],B=p[1],C=p[2],D=p[3],F=[s,0],cut=[A,F,D],rest=[F,B,C,D],moved=cut.map(q=>[q[0]+b,q[1]]),target=[F,[b+s,0],[b+s,h],D];
     return {kind:'parallelogram',base:b,height:h,originalArea,finalArea:polygonArea(target),copies:1,target,steps:[
       {pieces:[p],note:'Start with the parallelogram. Identify the base and perpendicular height.'},
       {pieces:[rest,cut],note:'Cut along the perpendicular height to separate a triangular piece.'},
       {pieces:[rest,moved],outline:target,note:'Slide the triangle across. The same pieces form a rectangle: A = b × h = '+area(originalArea)+' cm².'}]};
   }
   // Half-turn about the midpoint of the right sloping edge: the two
   // congruent copies share that edge and form one parallelogram.
   const C=p[2],B=p[1],mirror=q=>[B[0]+C[0]-q[0],B[1]+C[1]-q[1]],copy=p.map(mirror),shift=Math.max(...p.map(q=>q[0]))-Math.min(...p.map(q=>q[0]))+b*.24,apart=copy.map(q=>[q[0]+shift,q[1]]);
   const target=n===3?[p[0],copy[0],C,B]:[p[0],copy[3],copy[0],p[3]];
   // Boundary for triangle is A, B-copy(A), C? The shared edge B–C
   // is internal; outer boundary runs A,B,copy(A),C.
   const outer=n===3?[p[0],B,copy[0],C]:[p[0],copy[3],copy[0],p[3]];
   const top=n===3?b:labDist(p[2],p[3]),sum=n===3?b:b+top;
   return {kind:n===3?'triangle':'trapezium',base:b,otherBase:top,height:h,originalArea,finalArea:polygonArea(outer),copies:2,target:outer,steps:[
     {pieces:[p],note:'Start with one '+kind.toLowerCase()+'. Identify its parallel base'+(n===3?'':'s')+' and perpendicular height.'},
     {pieces:[p,apart],note:'Make an identical copy and turn it through 180°.'},
     {pieces:[p,copy],outline:outer,note:'Fit the two identical shapes together. The parallelogram has base '+fmt(sum)+' cm and height '+fmt(h)+' cm. Half its area gives '+(n===3?'A = ½bh':'A = ½(a + b)h')+' = '+area(originalArea)+' cm².'}]};
 }
 function shapeGeometry(d){
   const shape=d.shapeView,w=300,h=shape==='square'?300:Math.max(90,Math.min(280,d.shapeHeight||180)),theta=shape==='rectangle'||shape==='square'?90:Math.max(25,Math.min(85,d.shapeAngle||65)),base=shape==='scalene'?Math.max(20,Math.min(48,d.shapeBaseAngle||40)):Math.max(20,Math.min(75,d.shapeBaseAngle||50));
   if(shape==='trapezium')return [[0,0],[300,0],[240,-h],[65,-h]];
   if(shape==='kite')return [[0,-h],[150,0],[0,320],[-150,0]];
   if(shape==='right-triangle')return [[0,0],[300,0],[0,-h]];
   if(shape==='equilateral')return trianglePoints(60,60,0,0,300);
   if(shape==='isosceles')return trianglePoints(base,base,0,0,300);
   if(shape==='scalene')return trianglePoints(base,65,0,0,300);
   return [[0,0],[w,0],exactPolar(w,0,shape==='rhombus'?w:h,theta),exactPolar(0,0,shape==='rhombus'?w:h,theta)];
 }


 // A locus is a geometric constraint with a projection, guide and explanatory readout.
 const locusClamp=(v,a,b)=>Math.max(a,Math.min(b,v)),locusCircle=(p,o,r,previous)=>{let v=labSub(p,o),n=Math.hypot(...v);if(n<1e-7){v=labSub(previous,o);n=Math.hypot(...v)}return n<1e-7?[o[0]+r,o[1]]:labAt(o,v,r/n)};
 function locusLine(p,a,b,ray=false){const v=labSub(b,a),t=labDot(labSub(p,a),v)/labDot(v,v);return labAt(a,v,ray?Math.max(0,t):t)}
 const LOCUS_PRESETS={
   circle:{label:'Fixed distance from a point',initial:[540,220],anchors:{O:[400,220]},links:[['O','P']],project:(p,old)=>locusCircle(p,[400,220],140,old),guides:[{circle:[400,220,140]}],summary:p=>'OP = '+(labDist(p,[400,220])/40).toFixed(2)+' cm (constant)',rule:'P stays a fixed distance from O.'},
   bisector:{label:'Equal distance from two points',initial:[400,100],anchors:{A:[250,220],B:[550,220]},links:[['A','P'],['B','P'],['A','B']],project:p=>[400,locusClamp(p[1],45,395)],guides:[{line:[[400,28],[400,412]]}],summary:p=>'AP = BP = '+(labDist(p,[250,220])/40).toFixed(2)+' cm',rule:'P stays equidistant from A and B.'},
   parallel:{label:'Fixed distance from a line',initial:[400,100],anchors:{A:[170,220],B:[630,220]},links:[['A','B'],['P','F']],project:(p,old)=>[locusClamp(p[0],100,700),Math.abs(p[1]-220)<.001?(old[1]<220?100:340):p[1]<220?100:340],dependent:p=>({F:[p[0],220]}),guides:[{line:[[100,100],[700,100]]},{line:[[100,340],[700,340]]}],summary:()=> 'PF = 3.00 cm (constant)',rule:'P stays on either of two parallel lines.'},
   angleBisector:{label:'Equal distance from two intersecting lines',initial:[500,120],anchors:{O:[400,220],A:[650,220],B:[400,40]},links:[['O','A'],['O','B'],['P','F'],['P','G']],project:(p,old)=>{const o=[400,220],v=labSub(p,o),a=labAt(o,[1,-1],locusClamp((v[0]-v[1])/2,-165,165)),b=labAt(o,[1,1],locusClamp((v[0]+v[1])/2,-165,165)),da=labDist(a,p),db=labDist(b,p);return Math.abs(da-db)<.001?(labDist(old,a)<=labDist(old,b)?a:b):da<db?a:b},dependent:p=>({F:[p[0],220],G:[400,p[1]]}),guides:[{line:[[235,385],[565,55]]},{line:[[235,55],[565,385]]}],summary:p=>'PF = PG = '+(Math.abs(p[1]-220)/40).toFixed(2)+' cm',rule:'Both angle bisectors are valid loci for two intersecting lines.'},
   ellipse:{label:'Constant sum of distances (ellipse)',initial:[600,220],anchors:{A:[280,220],B:[520,220]},links:[['A','P'],['B','P']],project:(p,old)=>{let x=(p[0]-400)/200,y=(p[1]-220)/160;if(Math.hypot(x,y)<1e-7){x=(old[0]-400)/200;y=(old[1]-220)/160}const t=Math.atan2(y,x);return [400+200*Math.cos(t),220+160*Math.sin(t)]},guides:[{ellipse:[400,220,200,160]}],summary:p=>'AP + BP = '+((labDist(p,[280,220])+labDist(p,[520,220]))/40).toFixed(2)+' cm',rule:'The sum of the distances to the two foci remains constant.'},
   fixedAngle:{label:'Fixed angle at a moving point',initial:[400,100],anchors:{A:[280,220],B:[520,220]},links:[['A','B'],['A','P'],['B','P']],project:(p,old)=>{const q=locusCircle(p,[400,220],120,old);if(labDist(q,[280,220])<5||labDist(q,[520,220])<5)return locusCircle([q[0],220+(old[1]<220?-8:8)],[400,220],120,old);return q},guides:[{circle:[400,220,120]}],summary:()=> 'Angle APB = 90° (constant)',rule:'Every point on either semicircle, except A and B, makes a right angle at P.'},
   reflection:{label:'Reflection in a line',initial:[280,120],anchors:{A:[400,40],B:[400,400]},links:[['A','B'],['P','Q']],project:p=>[locusClamp(p[0],100,700),locusClamp(p[1],45,395)],dependent:p=>({Q:[800-p[0],p[1]],F:[400,p[1]]}),guides:[{line:[[400,28],[400,412]]}],summary:p=>'PF = FQ = '+(Math.abs(p[0]-400)/40).toFixed(2)+' cm',rule:'Q is the mirror image of P; the mirror line perpendicularly bisects PQ.'}
 };
 // Dynamic shapes use the same driver/dependency contract as the locus investigations.
 function constrainedShape(kind,c){
   const box=(kind==='rectangle'||kind==='areaRectangle'||kind==='perimeterRectangle');
   if(box){
     const A=[180,360],w0=240,h0=160,lo=80,hi=480,top=280;
     let project=p=>[A[0]+locusClamp(p[0]-A[0],lo,hi),A[1]-locusClamp(A[1]-p[1],lo,top)],initial=[A[0]+w0,A[1]-h0],guides=[],label='Rectangle — four right angles',rule='Opposite sides stay parallel and equal; all four angles remain right angles.';
     if(kind==='areaRectangle'){const area=c.area*1600,minW=Math.max(lo,area/top),maxW=Math.min(hi,area/lo),at=w=>[A[0]+w,A[1]-area/w];project=p=>at(locusClamp(p[0]-A[0],minW,maxW));initial=at((minW+maxW)/2);guides=[{polyline:Array.from({length:81},(_,i)=>at(minW+(maxW-minW)*i/80))}];label='Rectangle — constant area';rule='Changing the width changes the height so the area stays constant.'}
     if(kind==='perimeterRectangle'){const sum=c.perimeter*20,minW=Math.max(lo,sum-top),maxW=Math.min(hi,sum-lo),at=w=>[A[0]+w,A[1]-(sum-w)];project=p=>at(locusClamp((p[0]-A[0]+sum-(A[1]-p[1]))/2,minW,maxW));initial=at((minW+maxW)/2);guides=[{line:[at(minW),at(maxW)]}];label='Rectangle — constant perimeter';rule='Width plus height stays constant, even while the area changes.'}
     return {label,initial,anchors:{A},links:[['A','B'],['B','P'],['P','C'],['C','A']],project,dependent:p=>({B:[p[0],A[1]],C:[A[0],p[1]]}),guides,summary:p=>{const w=(p[0]-A[0])/40,h=(A[1]-p[1])/40;return 'Area = '+(w*h).toFixed(2)+' cm²   ·   Perimeter = '+(2*(w+h)).toFixed(2)+' cm'},rule,shape:['A','B','P','C'],rightCorners:['A','B','P','C']};
   }
   if(kind==='isosceles'){
     const A=[400-20*c.base,350],B=[400+20*c.base,350],at=y=>[400,y];return {label:'Isosceles triangle — equal sides',initial:at(130),anchors:{A,B},links:[['A','B'],['A','P'],['B','P']],project:p=>at(locusClamp(p[1],60,300)),guides:[{line:[at(60),at(300)]}],summary:p=>'AP = BP = '+(labDist(A,p)/40).toFixed(2)+' cm',rule:'The apex moves along the perpendicular bisector; the two sides stay equal.',shape:['A','B','P'],equalEdges:[['A','P'],['B','P']]};
   }
   if(kind==='rhombus'){
     const l=c.side*40,A=[260,245],B=[260+l,245],at=t=>[B[0]+l*Math.cos(t*D),B[1]-l*Math.sin(t*D)];return {label:'Rhombus — four equal sides',initial:at(65),anchors:{A,B},links:[['A','B'],['B','P'],['P','C'],['C','A']],project:p=>at(locusClamp(Math.atan2(B[1]-p[1],p[0]-B[0])/D,25,155)),dependent:p=>({C:labAt(A,labSub(p,B),1)}),guides:[{polyline:Array.from({length:81},(_,i)=>at(25+130*i/80))}],summary:p=>'All sides = '+(l/40).toFixed(2)+' cm   ·   Angle ABP = '+(180-labAngle(B,p)).toFixed(0)+'°',rule:'All four sides remain equal as the angles change.',shape:['A','B','P','C'],equalEdges:[['A','B'],['B','P'],['P','C'],['C','A']]};
   }
   if(kind==='rightTriangle'){
     const A=[230,350],B=[230+c.base*40,350],at=y=>[230,y];return {label:'Right-angled triangle',initial:at(130),anchors:{A,B},links:[['A','B'],['A','P'],['B','P']],project:p=>at(locusClamp(p[1],60,300)),guides:[{line:[at(60),at(300)]}],summary:p=>'Angle BAP = 90°   ·   BP = '+(labDist(B,p)/40).toFixed(2)+' cm',rule:'The right angle is preserved as the height and hypotenuse change.',shape:['A','B','P'],rightCorners:['A']};
   }
 }
 const SHAPE_DEFAULTS={rectangle:{},areaRectangle:{area:20},perimeterRectangle:{perimeter:24},isosceles:{base:6},rhombus:{side:4},rightTriangle:{base:6}};
 for(const [kind,c] of Object.entries(SHAPE_DEFAULTS))LOCUS_PRESETS[kind]=constrainedShape(kind,c);
 // Circle relationships use exact vector geometry, not visually estimated contacts.
 function tangentContacts(o,p,r){const v=labSub(p,o),d2=labDot(v,v);if(d2<=r*r)return [];const f=r*r/d2,k=r*Math.sqrt(d2-r*r)/d2,b=labAt(o,v,f),n=[-v[1],v[0]];return [labAt(b,n,k),labAt(b,n,-k)]}
 function circleContacts(a,b,r,s){const v=labSub(b,a),d=Math.hypot(...v);if(d<1e-8||d>r+s||d<Math.abs(r-s))return [];const x=(r*r-s*s+d*d)/(2*d),h=Math.sqrt(Math.max(0,r*r-x*x)),u=v.map(n=>n/d),m=labAt(a,u,x),n=[-u[1],u[0]];return [labAt(m,n,h),labAt(m,n,-h)]}
 function circleRelationship(kind,c){
   const O=[400,220],r=40*c.radius;
   if(kind==='tangent'){
     const ends=p=>{const v=labSub(p,O).map(n=>n/r),t=[-v[1],v[0]];return {A:labAt(p,t,120),B:labAt(p,t,-120)}};
     return {label:'Tangent at a point on a circle',initial:[400+r,220],anchors:{O},links:[['O','P'],['A','B']],project:(p,old)=>locusCircle(p,O,r,old),dependent:ends,guides:[{circle:[...O,r]}],objects:()=>[{circle:[...O,r]}],rightTriples:[['O','P','A']],summary:()=> 'OP = '+c.radius.toFixed(1)+' cm   ·   Radius meets tangent at 90°',rule:'Drag P around the circle. The tangent remains perpendicular to OP.',hiddenPoints:['A','B']};
   }
   if(kind==='externalTangents'){
     const initial=[400+Math.min(175,r+65),220],project=(p,old)=>{const v=labSub(p,O),d=Math.hypot(...v);return locusCircle(p,O,locusClamp(d,r+25,175),old)},dependent=p=>{const [T,U]=tangentContacts(O,p,r);return {T,U}};
     return {label:'Two tangents from an external point',initial,anchors:{O},links:[['O','T'],['O','U'],['P','T'],['P','U']],project,dependent,guides:[{circle:[...O,r+25]},{circle:[...O,175]}],objects:()=>[{circle:[...O,r]}],rightTriples:[['O','T','P'],['O','U','P']],equalEdges:[['P','T'],['P','U']],summary:p=>'PT = PU = '+(Math.sqrt(labDot(labSub(p,O),labSub(p,O))-r*r)/40).toFixed(2)+' cm',rule:'The two tangent lengths from the same external point are equal.'};
   }
   if(kind==='circleChord'){
     const at=y=>[400,y],project=p=>at(locusClamp(p[1],220-r+5,220+r-5)),dependent=p=>{const dx=Math.sqrt(r*r-(p[1]-220)**2);return {A:[400-dx,p[1]],B:[400+dx,p[1]]}};
     return {label:'Chord and perpendicular bisector',initial:at(220-r/2),anchors:{O},links:[['O','A'],['O','B'],['O','P'],['A','B']],project,dependent,guides:[{line:[at(220-r+5),at(220+r-5)]}],objects:()=>[{circle:[...O,r]}],equalEdges:[['P','A'],['P','B']],rightTriples:[['O','P','B']],summary:p=>'AP = PB = '+(Math.sqrt(r*r-(p[1]-220)**2)/40).toFixed(2)+' cm',rule:'The perpendicular from the centre bisects every chord.'};
   }
   if(kind==='circleIntersection'||kind==='circleTangency'||kind==='internalTangency'){
     const s=40*c.secondRadius,min=Math.abs(r-s)+12,max=r+s-12,touch=kind!=='circleIntersection',internal=kind==='internalTangency',d=internal?Math.abs(r-s):r+s,initial=[400+(touch?d:(min+max)/2),220],project=(p,old)=>{const v=labSub(p,O),dist=Math.hypot(...v),angle=Math.atan2(v[1],v[0]),range=touch?d:locusClamp(dist,min,max),t=dist<1e-8?Math.atan2(old[1]-220,old[0]-400):angle;return [400+range*Math.cos(t),220+range*Math.sin(t)]},dependent=p=>{if(touch){const v=labSub(p,O),len=Math.hypot(...v);return {T:labAt(O,v,(internal&&s>r?-r:r)/len)}}const [T,U]=circleContacts(O,p,r,s);return {T,U}};
     return {label:touch?(internal?'Internally tangent circles':'Externally tangent circles'):'Intersection of two circles',initial,anchors:{O},links:touch?[['O','P'],['O','T'],['P','T']]:[['O','T'],['P','T'],['O','U'],['P','U']],project,dependent,guides:touch?[{circle:[...O,d]}]:[{circle:[...O,min]},{circle:[...O,max]}],objects:p=>[{circle:[...O,r]},{circle:[...p,s]}],summary:p=>touch?'OP = '+(labDist(O,p)/40).toFixed(2)+' cm   ·   '+(internal?'Internal':'External')+' tangency':'OT = OU = '+c.radius.toFixed(1)+' cm   ·   PT = PU = '+c.secondRadius.toFixed(1)+' cm',rule:touch?'The centres and the single contact point remain collinear.':'Both intersection points remain on both circles as P moves.'};
   }
 }
 const RELATION_DEFAULTS={tangent:{radius:3},externalTangents:{radius:2.5},circleChord:{radius:3.5},circleIntersection:{radius:2,secondRadius:1.5},circleTangency:{radius:2,secondRadius:1},internalTangency:{radius:3,secondRadius:1.5}};
 for(const [kind,c] of Object.entries(RELATION_DEFAULTS))LOCUS_PRESETS[kind]=circleRelationship(kind,c);
 const LOCUS_PARAMETERS={
   circle:[['radius','Radius (cm)',1,4,.5,3.5]],
   bisector:[['separation','Distance AB (cm)',2,12,.5,7.5]],
   parallel:[['distance','Perpendicular distance (cm)',1,4,.5,3]],
   angleBisector:[['angle','Angle between lines (°)',30,150,15,90]],
   ellipse:[['major','Semi-major axis (cm)',3,6,.5,5],['minor','Semi-minor axis (cm)',1,4,.5,4]],
   fixedAngle:[['diameter','Diameter AB (cm)',2,8,.5,6]],
   reflection:[['axis','Mirror x-position (cm)',8,12,.5,10]],
   rectangle:[],areaRectangle:[['area','Area (cm²)',6,36,2,20]],perimeterRectangle:[['perimeter','Perimeter (cm)',10,34,2,24]],isosceles:[['base','Base AB (cm)',2,10,.5,6]],rhombus:[['side','Side length (cm)',2,4.5,.5,4]],rightTriangle:[['base','Base AB (cm)',2,10,.5,6]],
   tangent:[['radius','Radius (cm)',1,3.5,.5,3]],externalTangents:[['radius','Radius (cm)',1,3,.5,2.5]],circleChord:[['radius','Radius (cm)',1,4,.5,3.5]],circleIntersection:[['radius','Radius O (cm)',1,2,.5,2],['secondRadius','Radius P (cm)',1,1.5,.5,1.5]],circleTangency:[['radius','Radius O (cm)',1.5,2,.5,2],['secondRadius','Radius P (cm)',.5,1,.5,1]],internalTangency:[['radius','Outer radius (cm)',2.5,4,.5,3],['secondRadius','Inner radius (cm)',.5,2,.5,1.5]]
 };
 function locusParameters(kind,values={}){const out={};for(const [id,,min,max,step,initial] of LOCUS_PARAMETERS[kind]||[]){const v=Number(values[id]);out[id]=Number.isFinite(v)?locusClamp(Math.round((v-min)/step)*step+min,min,max):initial}if(kind==='ellipse')out.minor=Math.min(out.minor,out.major-.5);return out}
 function locusPreset(kind,values){
   const base=LOCUS_PRESETS[kind]||LOCUS_PRESETS.circle;if(!values)return base;const c=locusParameters(kind,values),o=[400,220];if(Object.hasOwn(SHAPE_DEFAULTS,kind))return constrainedShape(kind,c);if(Object.hasOwn(RELATION_DEFAULTS,kind))return circleRelationship(kind,c);
   if(kind==='circle'){const r=40*c.radius;return {...base,initial:[400+r,220],project:(p,old)=>locusCircle(p,o,r,old),guides:[{circle:[...o,r]}],summary:p=>'OP = '+(labDist(p,o)/40).toFixed(2)+' cm (constant)'}}
   if(kind==='bisector'){const A=[400-20*c.separation,220],B=[400+20*c.separation,220];return {...base,anchors:{A,B},summary:p=>'AP = BP = '+(labDist(p,A)/40).toFixed(2)+' cm'}}
   if(kind==='parallel'){const d=40*c.distance;return {...base,initial:[400,220-d],project:(p,old)=>[locusClamp(p[0],100,700),220+(p[1]===220?(old[1]<220?-d:d):p[1]<220?-d:d)],guides:[{line:[[100,220-d],[700,220-d]]},{line:[[100,220+d],[700,220+d]]}],summary:()=> 'PF = '+c.distance.toFixed(2)+' cm (constant)'}}
   if(kind==='angleBisector'){const t=c.angle,exact=(r,a)=>[o[0]+r*Math.cos(a*D),o[1]-r*Math.sin(a*D)],u=exact(155,t),a=exact(165,t/2),b=exact(165,t/2+90),neg=q=>labAt(o,labSub(o,q),1),foot=(p,q)=>locusLine(p,o,q),clamped=(p,q)=>{const v=labSub(q,o),f=locusClamp(labDot(labSub(p,o),v)/labDot(v,v),-1,1);return labAt(o,v,f)};return {...base,initial:exactPolar(...o,120,t/2),anchors:{O:o,A:[650,220],B:u},project:(p,old)=>{const x=clamped(p,a),y=clamped(p,b),dx=labDist(x,p),dy=labDist(y,p);return Math.abs(dx-dy)<.001?(labDist(old,x)<=labDist(old,y)?x:y):dx<dy?x:y},dependent:p=>({F:foot(p,[650,220]),G:foot(p,u)}),guides:[{line:[neg(a),a]},{line:[neg(b),b]}],summary:p=>'PF = PG = '+(labDist(p,foot(p,u))/40).toFixed(2)+' cm'}}
   if(kind==='ellipse'){const a=40*c.major,b=40*c.minor,f=Math.sqrt(a*a-b*b),A=[400-f,220],B=[400+f,220];return {...base,initial:[400+a,220],anchors:{A,B},project:(p,old)=>{let x=(p[0]-400)/a,y=(p[1]-220)/b;if(Math.hypot(x,y)<1e-7){x=(old[0]-400)/a;y=(old[1]-220)/b}const t=Math.atan2(y,x);return [400+a*Math.cos(t),220+b*Math.sin(t)]},guides:[{ellipse:[400,220,a,b]}],summary:p=>'AP + BP = '+((labDist(p,A)+labDist(p,B))/40).toFixed(2)+' cm'}}
   if(kind==='fixedAngle'){const r=20*c.diameter,A=[400-r,220],B=[400+r,220];return {...base,initial:[400,220-r],anchors:{A,B},project:(p,old)=>{const q=locusCircle(p,o,r,old);if(Math.min(labDist(q,A),labDist(q,B))<5)return locusCircle([q[0],220+(old[1]<220?-8:8)],o,r,old);return q},guides:[{circle:[400,220,r]}]}}
   if(kind==='reflection'){const x=40*c.axis;return {...base,initial:[x-120,120],anchors:{A:[x,40],B:[x,400]},project:p=>[locusClamp(p[0],Math.max(100,2*x-700),Math.min(700,2*x-100)),locusClamp(p[1],45,395)],dependent:p=>({Q:[2*x-p[0],p[1]],F:[x,p[1]]}),guides:[{line:[[x,28],[x,412]]}],summary:p=>'PF = FQ = '+(Math.abs(p[0]-x)/40).toFixed(2)+' cm'}}
   return base;
 }
 function locusInitial(kind='circle',params){const k=Object.hasOwn(LOCUS_PRESETS,kind)?kind:'circle',p=locusPreset(k,params);return {kind:k,...(params?{params:locusParameters(k,params)}:{}),p:p.initial.slice(),traceNames:[],traces:{},showLocus:false}}
 function locusProject(kind,p,previous,params){const preset=locusPreset(kind,params);return preset.project(p,previous||preset.initial)}
 function locusPoints(state){const preset=locusPreset(state.kind,state.params),p=locusProject(state.kind,state.p||preset.initial,state.p||preset.initial,state.params),anchor=Object.values(preset.anchors)[0];return {...preset.anchors,P:p,M:labAt(anchor,labSub(p,anchor),.5),...(preset.dependent?preset.dependent(p):{})}}
 function traceParts(points){const parts=[];let part=[];for(const p of points||[]){if(p===null){if(part.length>1)parts.push(part);part=[]}else part.push(p)}if(part.length>1)parts.push(part);return parts}
 function traceAdd(state,name,p,old){
   if(!state.traceNames?.includes(name))return;
   state.traces=state.traces||{};const path=state.traces[name]||(state.traces[name]=[]),last=path.at(-1);
   if(labDist(p,last||old)<.35)return;
   if(!last)path.push(old.slice());
   // Bounded rolling history: never silently stop recording new movement.
   if(path.length>=6000)path.splice(0,path.length-5500);
   path.push(p.slice());
 }
 function traceBreakPoint(state,name){const path=state.traces?.[name];if(path?.length&&path.at(-1)!==null)path.push(null)}
 // Never join disconnected branches or large angular jumps with a fictitious chord.
 function traceBreak(state){for(const name of state.traceNames||[])traceBreakPoint(state,name)}
 function locusTraceMove(state,target){
   const preset=locusPreset(state.kind,state.params),old=locusPoints(state),end=preset.project(target,old.P),kind=state.kind;
   const angular=['circle','ellipse','fixedAngle','tangent','externalTangents','circleIntersection','circleTangency','internalTangency','rhombus'].includes(kind);
   const origin=kind==='rhombus'?preset.anchors.B:[400,220],u=labSub(old.P,origin),v=labSub(end,origin);
   // For ellipse compare normalized parameter directions, not physical polar angles.
   if(kind==='ellipse'){const [, ,a,b]=preset.guides[0].ellipse;u[0]/=a;u[1]/=b;v[0]/=a;v[1]/=b}
   const ambiguous=angular&&labDot(u,v)<-1e-7*Math.hypot(...u)*Math.hypot(...v);
   const switched=kind==='parallel'&&old.P[1]!==end[1]||kind==='fixedAngle'&&(old.P[1]-220)*(end[1]-220)<0;
   let crossed=false;
   if(kind==='angleBisector'){
     const onFirst=p=>{const [a,b]=preset.guides[0].line;return Math.abs(labCross(labSub(b,a),labSub(p,a)))/labDist(a,b)<1e-6};
     crossed=labDist(old.P,[400,220])>1e-6&&labDist(end,[400,220])>1e-6&&onFirst(old.P)!==onFirst(end);
   }
   if(ambiguous||switched||crossed){traceBreak(state);state.p=end;return}
   if(!state.traceNames?.length){state.p=end;return}
   // Reproject intermediate driver positions, then resolve every dependent point
   // on that same constraint. Only bridge locally unambiguous motion.
   const steps=Math.max(1,Math.min(160,Math.ceil(labDist(old.P,end)/4)));let previous=old;
   for(let i=1;i<=steps;i++){
     const p=i===steps?end:preset.project(labAt(old.P,labSub(end,old.P),i/steps),previous.P);
     const next=locusPoints({...state,p});
     for(const name of state.traceNames)if(previous[name]&&next[name])traceAdd(state,name,next[name],previous[name]);
     previous=next;
   }
   state.p=end;
 }
 function traceToggle(state,name){
   state.traceNames=state.traceNames||[];state.traces=state.traces||{};
   if(state.traceNames.includes(name)){state.traceNames=state.traceNames.filter(n=>n!==name);const path=state.traces[name];if(path?.length&&path.at(-1)!==null)path.push(null)}
   else state.traceNames.push(name)
 }

// Acyclic construction graph: each node depends only on earlier named points.
 const CUSTOM_OPERATIONS={
  free:{label:'Free point',refs:[],place:true},
  onLine:{label:'Point on segment',refs:['Endpoint A','Endpoint B'],place:true},
  onCircle:{label:'Point on circle',refs:['Centre','Radius point'],place:true},
  midpoint:{label:'Midpoint',refs:['Point A','Point B']},
  ratio:{label:'Divide a segment in a ratio',refs:['Endpoint A','Endpoint B'],values:[.2,.25,1/3,.4,.5,.6,2/3,.75,.8]},
  foot:{label:'Perpendicular foot',refs:['Point P','Line A','Line B']},
  reflection:{label:'Reflect point in line',refs:['Point P','Line A','Line B']},
  parallel:{label:'Parallel direction point',refs:['Through P','Line A','Line B'],values:[1,2,3,4,5]},
  perpendicular:{label:'Perpendicular direction point',refs:['Through P','Line A','Line B'],values:[1,2,3,4,5]},
  angle:{label:'Fixed angle and length ratio',refs:['Vertex','Reference point'],values:[30,45,60,90,120,135,150,-30,-45,-60,-90]},
  distance:{label:'Fixed distance from point',refs:['Centre','Direction point'],values:[1,2,3,4,5]},
  lineIntersection:{label:'Intersection of two lines',refs:['Line 1 A','Line 1 B','Line 2 A','Line 2 B']},
  lineCircle:{label:'Line–circle intersection',refs:['Line A','Line B','Centre','Radius point'],branches:true},
  circleCircle:{label:'Circle–circle intersection',refs:['Centre 1','Radius point 1','Centre 2','Radius point 2'],branches:true},
  tangentContact:{label:'Tangent contact from external point',refs:['External point','Centre','Radius point'],branches:true},
  tangentDirection:{label:'Tangent direction at circle point',refs:['Centre','Contact point'],values:[1,2,3,4,5]},
  segment:{label:'Join points (segment)',refs:['Point A','Point B'],object:true},
  line:{label:'Draw straight line',refs:['Point A','Point B'],object:true},
  circle:{label:'Draw circle',refs:['Centre','Radius point'],object:true}
 };
 function customBounds(st,pad=24,fitOnly=false){let x=fitOnly?Infinity:0,y=fitOnly?Infinity:0,right=fitOnly?-Infinity:800,bottom=fitOnly?-Infinity:440;const include=(p,r=0)=>{if(!p||!p.every(Number.isFinite))return;x=Math.min(x,p[0]-r-pad);y=Math.min(y,p[1]-r-pad);right=Math.max(right,p[0]+r+pad);bottom=Math.max(bottom,p[1]+r+pad)};const {points}=customResolve(st);Object.values(points).forEach(p=>include(p));for(const o of st.objects||[])if(o.op==='circle'){const [a,b]=o.refs.map(n=>points[n]);if(a&&b)include(a,labDist(a,b))}for(const trail of Object.values(st.traces||{}))for(const p of trail)include(p);return Number.isFinite(x)?[x,y,right-x,bottom-y]:[0,0,800,440]}
 function locusFitBounds(st){
   const preset=locusPreset(st.kind,st.params),points=locusPoints(st);let x=Infinity,y=Infinity,right=-Infinity,bottom=-Infinity;
   const include=(p,rx=0,ry=rx)=>{if(!p||!p.every(Number.isFinite))return;x=Math.min(x,p[0]-rx-40);y=Math.min(y,p[1]-ry-40);right=Math.max(right,p[0]+rx+40);bottom=Math.max(bottom,p[1]+ry+40)};
   Object.values(points).forEach(p=>include(p));for(const trail of Object.values(st.traces||{}))for(const p of trail)include(p);
   for(const g of [...(st.showLocus?preset.guides:[]),...(preset.objects?.(points.P)||[])]){if(g.circle)include(g.circle.slice(0,2),g.circle[2]);else if(g.ellipse)include(g.ellipse.slice(0,2),g.ellipse[2],g.ellipse[3]);else for(const p of g.polyline||g.line||[])include(p)}
   return Number.isFinite(x)?[x,y,right-x,bottom-y]:[0,0,800,440];
 }
 function fitGeometryBounds(bounds,width,height){const [x,y,w,h]=bounds,ratio=Math.max(1,width)/Math.max(1,height),nw=Math.max(w,h*ratio),nh=Math.max(h,w/ratio);return [x-(nw-w)/2,y-(nh-h)/2,nw,nh]}
 function customInitial(){return {kind:'custom',nodes:[],objects:[],nextId:0,traceNames:[],traces:{},grid:true}}
 function customName(i){let s='';for(i++;i>0;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s}
 function customLineCircle(a,b,o,r){const v=labSub(b,a),w=labSub(a,o),aa=labDot(v,v);if(aa<1e-10||r<1e-8)return [];const bb=2*labDot(v,w),cc=labDot(w,w)-r*r,disc=bb*bb-4*aa*cc;if(disc< -1e-7)return [];const h=Math.sqrt(Math.max(0,disc));return [labAt(a,v,(-bb+h)/(2*aa)),labAt(a,v,(-bb-h)/(2*aa))]}
 function customResolve(st){
   const p=Object.create(null),invalid=[];
   const norm=v=>{const d=Math.hypot(...v);return d>1e-8?v.map(x=>x/d):null},rot=(v,t)=>[v[0]*Math.cos(t*D)+v[1]*Math.sin(t*D),-v[0]*Math.sin(t*D)+v[1]*Math.cos(t*D)],valid=q=>Array.isArray(q)&&q.length===2&&q.every(Number.isFinite);
   for(const n of st.nodes||[]){
     const spec=CUSTOM_OPERATIONS[n.op],refs=(n.refs||[]).map(id=>p[id]),[a,b,c,d]=refs;let q=null;
     if(!spec||spec.object||refs.length!==spec.refs.length||refs.some(v=>!v)){invalid.push(n.id);continue}
     const v=a&&b?labSub(b,a):null,u=v?norm(v):null,val=Number(n.value)||1,branch=n.branch===1?1:0;
     if(n.op==='free')q=n.at;
     else if(n.op==='onLine'&&u&&valid(n.at))q=labAt(a,v,locusClamp(labDot(labSub(n.at,a),v)/labDot(v,v),0,1));
     else if(n.op==='onCircle'&&u&&valid(n.at))q=locusCircle(n.at,a,labDist(a,b),b);
     else if(n.op==='midpoint')q=labAt(a,v,.5);
     else if(n.op==='ratio')q=labAt(a,v,val);
     else if((n.op==='foot'||n.op==='reflection')&&labDist(b,c)>1e-8){const f=locusLine(a,b,c);q=n.op==='foot'?f:labAt(a,labSub(f,a),2)}
     else if(n.op==='parallel'||n.op==='perpendicular'){const dir=norm(labSub(c,b));if(dir)q=labAt(a,n.op==='parallel'?dir:rot(dir,90),40*val)}
     else if(n.op==='angle'&&u)q=labAt(a,rot(v,val),1);
     else if(n.op==='distance'&&u)q=labAt(a,u,40*val);
     else if(n.op==='lineIntersection'&&u){const w=labSub(d,c),den=labCross(v,w);if(Math.abs(den)>1e-8)q=labAt(a,v,labCross(labSub(c,a),w)/den)}
     else if(n.op==='lineCircle')q=customLineCircle(a,b,c,labDist(c,d))[branch];
     else if(n.op==='circleCircle'&&labDist(a,b)>1e-8&&labDist(c,d)>1e-8)q=circleContacts(a,c,labDist(a,b),labDist(c,d))[branch];
     else if(n.op==='tangentContact'&&labDist(b,c)>1e-8)q=tangentContacts(b,a,labDist(b,c))[branch];
     else if(n.op==='tangentDirection'&&u)q=labAt(b,rot(u,90),40*val);
     if(valid(q)&&q.every(x=>Math.abs(x)<1e6))p[n.id]=q.slice();else invalid.push(n.id);
   }
   return {points:p,invalid};
 }
 function customAppend(st,op,refs=[],options={}){
   const spec=CUSTOM_OPERATIONS[op];if(!spec||refs.length!==spec.refs.length||refs.some(id=>!st.nodes.some(n=>n.id===id))||new Set(refs).size!==refs.length)throw Error('Choose distinct existing points for this relationship.');
   if(spec.object){st.objects.push({op,refs:refs.slice()});return null}
   if(st.nodes.length>=80)throw Error('This workspace supports up to 80 points.');
   const id=customName(st.nextId++),node={id,op,refs:refs.slice()};if(spec.place){if(!Array.isArray(options.at)||!options.at.every(Number.isFinite))throw Error('Choose a location.');node.at=options.at.slice()}if(spec.values)node.value=spec.values.includes(Number(options.value))?Number(options.value):spec.values[0];if(spec.branches)node.branch=options.branch===1?1:0;
   st.nodes.push(node);return id;
 }
 function customMove(st,id,p){
   const n=st.nodes.find(n=>n.id===id);if(!n||!CUSTOM_OPERATIONS[n.op]?.place||!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))return false;
   const names=st.traceNames||[],old=customResolve(st).points,from=n.at.slice();n.at=p.slice();const end=customResolve(st).points;
   if(!names.length)return true;
   // For a constrained driver on a circle interpolate between resolved points,
   // not raw cursor positions (which can pass through the circle centre).
   let startAt=from,endAt=p;
   if(n.op==='onCircle'&&old[id]&&end[id]&&old[n.refs[0]]){
     const o=old[n.refs[0]],u=labSub(old[id],o),v=labSub(end[id],o);
     if(labDot(u,v)<-1e-7*Math.hypot(...u)*Math.hypot(...v)){traceBreak(st);return true}
     startAt=old[id];endAt=end[id];
   }
   const resolveAt=t=>{n.at=labAt(startAt,labSub(endAt,startAt),t);return customResolve(st).points};
   let budget=256;
   // Adaptive midpoint checks detect curved dependents and undefined/singular
   // relationships; unresolved intervals are gaps, never long fictitious chords.
   function visit(t0,a,t1,b,depth){
     const tm=(t0+t1)/2,mid=budget>0?(budget--,resolveAt(tm)):null;
     const needs=names.some(name=>{const x=a[name],y=b[name],m=mid?.[name];if(!x&&!y&&!m)return false;if(!x||!y||!m)return true;return labDist(x,y)>8||labDist(m,labAt(x,labSub(y,x),.5))>.2});
     if(needs&&mid&&depth<9&&budget>0){visit(t0,a,tm,mid,depth+1);visit(tm,mid,t1,b,depth+1);return}
     for(const name of names){
       const x=a[name],y=b[name],m=mid?.[name];
       if(!x||!y||!m||labDist(x,y)>8||labDist(m,labAt(x,labSub(y,x),.5))>.2)traceBreakPoint(st,name);
       else traceAdd(st,name,y,x);
     }
   }
   try{
     const steps=Math.max(1,Math.min(32,Math.ceil(labDist(startAt,endAt)/16)));let a=old;
     for(let i=1;i<=steps;i++){const b=i===steps?end:resolveAt(i/steps);visit((i-1)/steps,a,i/steps,b,0);a=b}
   }finally{n.at=p.slice()}
   return true;
 }
 const model={geometryReasoning,GEOMETRY_REASONING,areaComparison,pythagorasProof,polygonFormulaProof,circleTheoremModel,circleTheoremMove,triangleFamilyModel,triangleFamilyExample,quadrilateralFamilyModel,reflectionInvestigation,rotationInvestigation,shapeAreaProof,shapeTeachingReference,shapeSymmetry,transversalModel,protractorReading,utensilAlignment,squareGeometry,isLabArc,labArcContains,labCircleExtents,labContentBounds,locusFitBounds,customBounds,fitGeometryBounds,INDEPENDENT_METHOD_DIMENSIONS,INDEPENDENT_METHOD_ROLES,independentConstructionCheck,challengeConstructionMethod,CONSTRUCTION_METHODS_BY_TASK,loadConstructionLibrary,constructionFrame,constructionMethodGraphic,CUSTOM_OPERATIONS,customInitial,customName,customResolve,customAppend,customMove,customLineCircle,tangentContacts,circleContacts,LOCUS_PRESETS,LOCUS_PARAMETERS,locusParameters,locusPreset,labNotation,labLineMarks,labSetLineMark,labAngleAnnotation,labSameAngle,labAngleArms,labAngleSectors,labAnglePair,labSectorMark,labSectorPreview,labDimensionText,labRulerTargets,labIndependentDimensions,labSquareBaseReferences,labSquareComparison,labParallelMarkPlan,labSquareSlideSnap,labMeasurementTarget,labApplyMeasurement,labAngleText,labProtractorDirection,labAngleGraphics,labAnnotationPlan,boxesOverlap,labelBox,labFaces,labFaceAt,labRegionShapes,labMarks,labRayAngle,labRayDefinition,labAbsoluteRay,labDirectRay,labReferenceArm,labRelativeRay,labDetachReferences,labStraightEnds,rayEnd,labLabel,labPointText,labConstruction,labVisible,labStyleKey,labOutside,workspaceSize,workspaceState,workspaceFits,datumState,datumCoordinates,datumPoint,datumSnap,datumDirection,datumGridStart,datumGraphic,locusInitial,locusProject,locusPoints,locusTraceMove,traceParts,traceAdd,traceToggle,shapeGeometry,freeTrianglePoints,triangleComparison,triangleComparisonResult,triangleCriterion,TRIANGLE_CRITERIA,triangleInequality,inequalitySettings,triangleProperties,triangleCentres,eulerLineModel,quadrilateralProperties,freeQuadrilateralPoints,circleInvestigation,circleInvestigationMove,CIRCLE_VIEWS,polygonProperties,freePolygonPoints,polygonInvestigationExamples,polygonInvestigationTurns,QUAD_REASONING,quadReasoningPoints,angleVertexPlacement,labelCorners,dimensionPlacement,labelIntersectsLine,angleLabelPlacement,validRegion,polygonArea,vertexLabel,labEmpty,labSnap,labIntersections,labIntersectionSettings,labNewIntersections,labCheck,labSolution,labTypes,MODES,LEVELS,YEARS,FAMILIES,settings,types,challengeGroups,generate,polar,classify,polyInterior,polyExterior,trianglePoints};
if(typeof module==='object'&&module.exports){module.exports=model;return}
const G=root.TT99Goodies;if(!G)return;G.angles=model;
const {q,qa,esc,field,btn,setPanels}=G,CK=G.challengeKit;
function diagram(d,teacher=false,options={}){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),W=800,H=440,ink='#263e43',teal='#277b70',orange='#b56d2c',shapeFill=!options.paper&&d.type==='diagram'&&d.showFill===true?'#e9f4f0':'none';
 const add=(tag,attrs,t,parent=svg)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(options.paper&&k==='stroke-width'&&Number(v)>0?Math.max(.8,Number(v)*.52):options.paper&&k==='font-size'&&Number(v)>0?Math.max(29,Number(v)):v)));if(t!=null)e.textContent=t;parent.appendChild(e);return e};
 Object.entries({viewBox:'0 0 '+W+' '+H,xmlns:ns,role:'img','aria-label':'Geometry diagram'}).forEach(([k,v])=>svg.setAttribute(k,v));
 const text=(x,y,v,size=21,extra={})=>add('text',{x,y,fill:ink,'font-family':'Arial,sans-serif','font-size':size,'text-anchor':'middle',...extra},v);
 const dimensions=[];
 const dimension=(a,b,value,{size=16,offset=20,outside=null,lines=[],bounds=null,manualOffset=null,independent=false}={})=>{const q=dimensionPlacement(a,b,value,{size,offset,outside,lines,bounds,manualOffset,occupied:dimensions});if(!q)return;dimensions.push(q.box);if(independent)add('path',{d:distanceGuide(a,b,q),fill:'none',stroke:teal,'stroke-width':1.2,'data-ag-distance-guide':'1'});text(q.p[0],q.p[1],value,size,{'dominant-baseline':'central',transform:'rotate('+q.angle+' '+q.p.join(' ')+')','data-ag-dimension':'1'})};
 const line=(a,b,stroke=ink,width=5,extra={})=>add('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke,'stroke-width':width,'stroke-linecap':'round',...extra});
 const path=(p,extra={})=>add('path',{d:p,fill:'none',stroke:teal,'stroke-width':3,...extra});
 const circle=(p,r,fill=teal)=>add('circle',{cx:p[0],cy:p[1],r,fill});
 const arc=(x,y,r,start,a,extra={})=>{if(a>=360){add('circle',{cx:x,cy:y,r,fill:'none',stroke:teal,'stroke-width':3,...extra});return}if(a<=0)return;const p=polar(x,y,r,start),e=polar(x,y,r,start+a);path('M '+p.join(' ')+' A '+r+' '+r+' 0 '+(a>180?1:0)+' 0 '+e.join(' '),extra)};
 // Angle labels sit on their own bisector; neighbouring sectors must not
 // form a single continuous arc. Keep right-angle squares conventional.
 const labelArc=(x,y,r,start,a,label,{labelSize=18,labelRadius=r+22}={})=>{
   const meta={'data-ag-angle-mark':'1','data-ag-radius':r,'data-ag-start':start,'data-ag-sweep':a,'stroke-width':2.5};
   if(Math.abs(a-90)<.01){const p=polar(x,y,r*.75,start),v=polar(x,y,r*.75,start+90),u=[p[0]+v[0]-x,p[1]+v[1]-y];path('M '+p.join(' ')+' L '+u.join(' ')+' L '+v.join(' '),meta)}
   else arc(x,y,r,start,a,meta);
   if(label!=null){const q=angleLabelPlacement([x,y],r,start,a,label,labelSize,labelRadius);text(q.p[0],q.p[1],label,q.size,{'dominant-baseline':'central','font-weight':'500','data-ag-angle-label':'1'})}
 };
 const ray=(x,y,r,a,color=ink)=>line([x,y],polar(x,y,r,a),color);
 const arrow=(x,y,r,a,color=ink)=>{const p=polar(x,y,r,a),l=polar(p[0],p[1],16,a+150),rr=polar(p[0],p[1],16,a-150);line([x,y],p,color,5);line(p,l,color,5);line(p,rr,color,5)};
 const background=add('rect',{width:W,height:H,fill:'#fff'});
 // Crop to the mathematical content, not a fixed landscape canvas. Keep the same coordinates for pointer mapping and paper export.
 function frame(x,y,w,h){svg.setAttribute('viewBox',[x,y,w,h].join(' '));Object.entries({x,y,width:w,height:h}).forEach(([k,v])=>background.setAttribute(k,v));return svg}
 const type=d.type,explore=type==='diagram',a=d.angle??60,rot=d.rotation??0,mode=d.mode||'angle';
 function protractor(x,y,r,start,full=false){G.instruments.protractor(svg,{x,y,radius:r,start,full});}
 function single(x,y,r,a,start,label,scale=false,blank=false,full=false){if(scale)protractor(x,y,r,start,full);ray(x,y,r+5,start);if(!blank){ray(x,y,r+5,start+a,teal);labelArc(x,y,Math.min(r*.27,48),start,a,label)}circle([x,y],4,ink)}
 if(mode==='turn'){
   const x=400,y=225,r=136,sign=d.clockwise?-1:1,start=explore?90+rot:90,end=start+sign*a;add('circle',{cx:x,cy:y,r:r+28,fill:options.paper?'none':'#f8fbfa',stroke:'#d4e2de','stroke-width':2});for(let i=0;i<4;i++)line(polar(x,y,r+18,start+i*90),polar(x,y,r+28,start+i*90),'#a3b8b3',3);
   arrow(x,y,r,start,'#99a9ab');arrow(x,y,r,end,teal);const rr=92;if(a===360)add('circle',{cx:x,cy:y,r:rr,fill:'none',stroke:orange,'stroke-width':4});else if(d.clockwise)arc(x,y,rr,end,a,{stroke:orange,'stroke-width':4});else arc(x,y,rr,start,a,{stroke:orange,'stroke-width':4});const tip=polar(x,y,rr,end),tangent=end+(d.clockwise?-90:90);if(a>0){line(tip,polar(tip[0],tip[1],14,tangent+155),orange,4);line(tip,polar(tip[0],tip[1],14,tangent-155),orange,4);}text(400,420,teacher||explore?(a===0?'No turn':(d.clockwise?'Clockwise':'Anticlockwise')+' · '+a+'°'+({90:' · Quarter turn',180:' · Half turn',270:' · Three-quarter turn',360:' · Full turn'}[a]||'')):'Start: grey arrow   •   Finish: green arrow',24);return frame(110,43,580,397)
 }
 if(mode==='lines'){
   if(type==='line-orientation'){const x=400,y=220;line(polar(x,y,155,a),polar(x,y,155,a+180),teal,6);return frame(208,28,384,384)}
   const r=d.relation||(a===0?'Parallel':a===90?'Perpendicular':'Neither'),x=400,y=220;const start=rot;
   if(r==='Parallel'){for(const off of [-65,65]){const c=polar(x,y,off,start+90);line(polar(...c,180,start),polar(...c,180,start+180),teal,5)}}
   else{line(polar(x,y,180,start),polar(x,y,180,start+180));line(polar(x,y,155,start+a),polar(x,y,155,start+a+180),teal);if(r==='Perpendicular'&&(teacher||explore))labelArc(x,y,35,start,90,'90°')}
   return frame(180,20,440,400)
 }
 if(['compare','order','compare-reflex'].includes(type)){const n=d.angles.length;d.angles.forEach((v,i)=>{const x=(i+.5)*W/n,y=200,r=n===3?105:162;single(x,y,r,v,(rot+i*55)%360,teacher?v+'°':null);text(x,395,['A','B','C'][i],34)});return svg}
 if(mode==='angle'){
   const draw=['draw','draw-reflex'].includes(type),pupilDraw=draw&&!teacher,blank=pupilDraw&&options.attempt==null&&!options.interactive,shown=pupilDraw?(options.attempt??0):a;
   const full=options.full??(shown>180||['reflex','draw-reflex'].includes(type)),scale=options.scale??d.scale??(teacher&&['measure','reflex'].includes(type));
   const r=238,start=rot,x=400,y=220;
   // A rotated semicircle occupies a different bounding rectangle. Include the full arc, rays, degree labels and touch handle, with generous edge clearance.
   const sweep=full?360:180,extent=Array.from({length:sweep+1},(_,i)=>polar(x,y,r+9,start+i));extent.push([x,y]);
   const pad=26,minX=Math.min(...extent.map(p=>p[0]))-pad,maxX=Math.max(...extent.map(p=>p[0]))+pad,minY=Math.min(...extent.map(p=>p[1]))-pad,maxY=Math.max(...extent.map(p=>p[1]))+pad;
   const targetH=pupilDraw&&!options.interactive&&!options.paper?42:0;if(options.measureWorkspace)frame(110,-70,580,580);else frame(minX,minY,maxX-minX,maxY-minY+targetH);
   single(x,y,r,shown,start,teacher||explore?shown+'°':null,scale,blank||options.interactive,full);
   if(pupilDraw&&!options.interactive&&!options.paper)text((minX+maxX)/2,maxY+26,'Target: '+a+'°',25);
   if(options.interactive){
     // The initial handle is at zero, independent of the answer. Show only
     // the pupil's actual ray and its unlabelled arc during construction.
     if(shown>0)labelArc(x,y,48,start,shown,teacher||explore?shown+'°':null);
     const p=polar(x,y,r+9,start+shown);
     line([x,y],p,'#be762b',shown===0?3:5,{'data-ag-moving-arm':'1'});
     add('circle',{cx:p[0],cy:p[1],r:10,fill:'#d58c42',stroke:'#fff','stroke-width':2,'data-ag-angle-handle':'1'});
     add('circle',{cx:x,cy:y,r:r+25,fill:'transparent','data-ag-angle-target':'1',style:'cursor:grab;touch-action:none'});
   }
   const named=[[polar(x,y,r+5,start),'B',start],[polar(x,y,r+5,start+shown),'C',start+shown]];
   const vertex=options.interactive&&!full?{p:polar(x,y,24,start+225),box:labelBox(polar(x,y,24,start+225),0,'A',13),external:false}:angleVertexPlacement([x,y],start,shown);
   if(vertex.external){const v=labSub(vertex.p,[x,y]),len=Math.hypot(...v);line(labAt([x,y],v,6/len),labAt([x,y],v,1-13/len),'#829793',1,{'stroke-dasharray':'3 4','data-ag-point-leader':'A'})}
   text(vertex.p[0],vertex.p[1],'A',13,{'dominant-baseline':'central','data-ag-point-label':'A','paint-order':'stroke',stroke:'#fff','stroke-width':3});
   if(!options.measureWorkspace&&!full){const corners=labelCorners(vertex.box),lx=Math.min(minX,...corners.map(q=>q[0]-3)),ly=Math.min(minY,...corners.map(q=>q[1]-3)),rx=Math.max(maxX,...corners.map(q=>q[0]+3)),by=Math.max(maxY+targetH,...corners.map(q=>q[1]+3));frame(lx,ly,rx-lx,by-ly)}
   for(const [p,name,dir] of named.slice(0,blank||shown===0?1:2)){const q=options.interactive&&name==='C'?polar(x,y,r+9+21,dir):polar(...p,13,dir);text(q[0],q[1],name,13,{'data-ag-point-label':name,'paint-order':'stroke',stroke:'#fff','stroke-width':3})}
   return svg
 }
 if(mode==='facts'){
   if(type==='transversal'){
     const m=transversalModel(d),{upper,lower,angle,tilt,first,second,relation,parallel}=m;
     for(const [p,dir,key] of [[upper,0,'upper'],[lower,tilt,'lower']]){
       line(exactPolar(...p,240,dir+180),exactPolar(...p,240,dir),ink,3,{'data-ag-transversal-line':key});
       if(parallel){const c=exactPolar(...p,170,dir),v1=exactPolar(...c,10,145),v2=exactPolar(...c,10,215);path('M '+v1.join(' ')+' L '+c.join(' ')+' L '+v2.join(' '),{stroke:ink,'stroke-width':2,'data-ag-transversal-parallel':key})}
     }
     line(exactPolar(...upper,52/Math.sin(angle*D),angle),exactPolar(...lower,52/Math.sin(angle*D),angle+180),teal,3,{'data-ag-transversal':'1'});
     for(const [p,v,key] of [[upper,first,'upper'],[lower,second,'lower']]){
       const label=Number(v.sweep.toFixed(2))+'°';labelArc(...p,37,v.start,v.sweep,label,{labelSize:18,labelRadius:Math.abs(v.sweep-90)>50?82:60});
       circle(p,3,ink);
     }
     const name=FACT_VIEWS.find(([k])=>k===relation)[1],comparison=relation==='co-interior'?first.sweep+'° + '+second.sweep+'° = '+m.sum+'°':first.sweep+'° '+(m.match?'=':'≠')+' '+second.sweep+'°';
     text(400,370,name,20,{'data-ag-transversal-title':'1'});
     text(400,400,comparison,20,{'data-ag-transversal-comparison':'1'});
     text(400,430,parallel?(relation==='co-interior'?'Parallel lines: the pair sums to 180°.':'Parallel lines: the marked angles are equal.'):'Non-parallel example: the rule is not guaranteed.',17,{'data-ag-transversal-condition':parallel?'parallel':'nonparallel'});
     return frame(20,0,760,450);
   }
   if(type==='parallel'||type==='co-interior'){const y1=140,y2=300,dx=80/Math.tan(a*D),p=[400+dx,y1],u=[400-dx,y2];line([65,y1],[735,y1]);line([65,y2],[735,y2]);line(polar(...p,65/Math.sin(a*D),a),polar(...u,65/Math.sin(a*D),a+180),teal);const co=type==='co-interior',alt=d.relation==='alternate';labelArc(...u,42,0,a,a+'°');labelArc(...p,44,co?a+180:alt?180:0,co?180-a:a,teacher?(co?180-a:a)+'°':'x');return svg}
   const values=d.angles||[a,180-a],x=400,y=220,r=165;let at=rot;const count=type==='opposite'?4:values.length;
   // Give adjacent sectors different radii, including the last/first
   // pair around a point. Opposite sectors retain matching radii.
   for(let i=0;i<count;i++){
     ray(x,y,r,at);const v=values[i],missing=type==='opposite'?i===2:i===count-1;
     const label=missing&&!teacher&&!explore?'x':type==='opposite'&&i%2===1&&!teacher?null:v+'°';
     const radius=count===3?[49,70,91][i]:i%2===0?70:49;
     // Narrow sectors need additional space for multi-digit labels.
     const halfWidth=(String(label??'').length*24*.56)/2;
     const halfHeight=12,angle=Math.min(v,360-v)*D/2;
     const clearance=(halfWidth+halfHeight*.5+5)/Math.max(.2,Math.sin(angle));
     const labelRadius=Math.min(145,Math.max(radius+24,clearance));
     labelArc(x,y,radius,at,v,label,{labelSize:18,labelRadius});at+=v
   }
   if(type==='straight'||explore&&values.reduce((s,v)=>s+v,0)===180)ray(x,y,r,at);circle([x,y],4,ink);return frame(195,20,410,400)
 }
 function polygon(points,pointNames=null){
   const outline=add('polygon',{'data-ag-inspect-polygon':'1',points:points.map(p=>p.join(',')).join(' '),fill:shapeFill,stroke:ink,'stroke-width':3,'stroke-linejoin':'round'});
   const names=pointNames||points.map((_,i)=>pointName(i)),regionPoints=points.slice(),key=polygonRegionKey(d);
   if(explore&&d.showDiagonals&&points.length===4){const u=labSub(points[2],points[0]),v=labSub(points[3],points[1]),den=labCross(u,v);if(Math.abs(den)>1e-6){regionPoints.push(labAt(points[0],u,labCross(labSub(points[1],points[0]),v)/den));names.push('O')}}
   if(explore){
     outline.setAttribute('data-ag-region-points',JSON.stringify(regionPoints));outline.setAttribute('data-ag-region-names',JSON.stringify(names));
     for(const region of (d.regionsByShape?.[key]||[])){if(validRegion(regionPoints,region.ids))add('polygon',{points:region.ids.map(i=>regionPoints[i].join(',')).join(' '),fill:REGION_COLOURS[region.colour]||REGION_COLOURS[0],'fill-opacity':.28,stroke:'none','data-ag-region':'1'})}
   }
   points.forEach((p,i)=>{const pos=vertexLabel(p,points[(i+points.length-1)%points.length],points[(i+1)%points.length],22);circle(p,3,ink);text(pos[0],pos[1]+5,names[i],16,{'data-ag-point-label':names[i],'paint-order':'stroke',stroke:'#fff','stroke-width':3})});
   if(regionPoints.length>points.length){const p=regionPoints.at(-1);circle(p,3,ink);text(p[0]+13,p[1]-10,'O',16,{'data-ag-point-label':'O','paint-order':'stroke',stroke:'#fff','stroke-width':3})}
 }
 function corner(points,i,label){const p=points[i],prev=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length],dir=v=>mod(Math.atan2(p[1]-v[1],v[0]-p[0])/D);let start=dir(prev),v=mod(dir(next)-start);if(v>180){start=dir(next);v=360-v}labelArc(...p,Math.min(38,Math.hypot(next[0]-p[0],next[1]-p[1])*.22,Math.hypot(prev[0]-p[0],prev[1]-p[1])*.22),start,v,label)}
 function fit(points){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),s=Math.min(540/Math.max(1,maxX-minX),300/Math.max(1,maxY-minY));return points.map(([x,y])=>[400+(x-(minX+maxX)/2)*s,210+(y-(minY+maxY)/2)*s])}
 function polygonFrame(points,pad=76){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs)-pad,y=Math.min(...ys)-pad;return frame(x,y,Math.max(...xs)-x+pad,Math.max(...ys)-y+pad)}
 if((mode==='construct'||mode==='free-explore')&&(d.labDrawing||teacher&&labTypes.includes(d.type))){
   const st=labNames(JSON.parse(JSON.stringify(d.labDrawing||labSolution(d)))),free=st.given===false,ws=workspaceState(st),ww=free?ws.w:800,hh=free?ws.h:400,ox=free?ws.x||0:0,oy=free?ws.y||0:0,key=options.paper&&teacher&&!free&&labTypes.includes(d.type),step=key?0:free?ws.gridMm*4:40;if(step){for(let gx=free?datumGridStart(ox,datumState(st).origin[0],step):20;gx<ox+ww;gx+=step)line([gx,free?oy:22],[gx,free?oy+hh:hh-18],'#e0e9e6',1,{'data-ag-grid':'1'});for(let gy=free?datumGridStart(oy,datumState(st).origin[1],step):22;gy<oy+hh;gy+=step)line([free?ox:20,gy],[free?ox+ww:ww-20,gy],'#e0e9e6',1,{'data-ag-grid':'1'})}
   if(free)datumGraphic(st,[ox,oy,ww,hh],add);
   if(free)for(const trail of Object.values(st.traces||{}))for(const points of traceParts(trail)){add('polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',stroke:orange,'stroke-width':1.8,'stroke-dasharray':'4 3','data-ag-trace':'1'})}
   for(const region of labRegionShapes(st)){const attrs={fill:REGION_COLOURS[region.colour]||REGION_COLOURS[0],'fill-opacity':.28,stroke:'none','data-ag-region':'1'};if(region.circle)add('circle',{...attrs,cx:region.circle.p[0],cy:region.circle.p[1],r:region.circle.r});else if(region.path)add('path',{...attrs,d:region.path,'fill-rule':'evenodd'});else add('polygon',{...attrs,points:region.points.map(p=>p.join(',')).join(' ')})}
   for(const c of st.circles)if(labVisible(st,'circles',c)){const p=st.points[c.i],construction=labConstruction(st,'circles',c);if(isLabArc(c))path(labArcPath(p,c),{stroke:labInk(st,'circles',c)||(construction?orange:teal),'stroke-width':construction?1.8:3,'stroke-dasharray':construction?'5 4':'','data-ag-compass-arc':'1'});else if(key&&construction&&['build-sss','build-equilateral'].includes(d.type)){const a=labAngle(p,st.points[2]);arc(...p,c.r,a-13,26,{stroke:orange,'stroke-width':1.8,'stroke-dasharray':'5 4','data-ag-construction-arc':'1'})}else add('circle',{cx:p[0],cy:p[1],r:c.r,fill:'none',stroke:labInk(st,'circles',c)||(construction?orange:teal),'stroke-width':construction?1.8:3,'stroke-dasharray':construction?'5 4':'','data-ag-solution-circle':key?'1':''})}
   for(const r of st.rays)if(labVisible(st,'rays',r))line(...labStraightEnds(st.points[r.i],labRayAngle(st,r),[ox,oy,ww,hh],r.infinite),labInk(st,'rays',r)||teal,labConstruction(st,'rays',r)?1.8:3,{'stroke-dasharray':labConstruction(st,'rays',r)?'7 5':''});
   const dimLines=labLines(st).map(l=>[l.infinite?labAt(l.a,l.v,-1200):l.a,l.ray?labAt(l.a,l.v,1200):l.b]),annotationPlan=labAnnotationPlan(st,[ox,oy,ox+ww,oy+hh]);dimensions.push(...annotationPlan.boxes);
   if(!free&&!(key&&d.type==='build-circle')){line(st.points[0],st.points[1],ink,4);dimension(st.points[0],st.points[1],'6 cm',{outside:[460,360],lines:dimLines,bounds:[0,0,ww,hh]})}
   for(const [i,j] of st.segments){const edge=[i,j];if(!labVisible(st,'segments',edge))continue;const a=st.points[i],b=st.points[j],construction=labConstruction(st,'segments',edge);line(a,b,labInk(st,'segments',edge)||(construction?orange:teal),construction?1.8:3,{'stroke-dasharray':construction?'5 4':''});const value=labDimensionText(st,i,j,!construction&&(!free||st.showMeasurements===true));if(value){const others=st.points.filter(p=>p!==a&&p!==b),mid=labAt(a,labSub(b,a),.5),c=others.length?others.reduce((v,p)=>labAt(v,p,1/others.length),[0,0]):null;dimension(a,b,value,{size:14,outside:labOutside(st,i,j)||(c?labAt(mid,labSub(mid,c),1):null),lines:dimLines,bounds:[ox,oy,ox+ww,oy+hh],manualOffset:st.dimensionLabels?.[labStyleKey(st,i,j)]?.offset})}}
   for(const d of labIndependentDimensions(st)){const [i,j]=d.ids;dimension(st.points[i],st.points[j],d.value,{size:14,offset:30,lines:dimLines,bounds:[ox,oy,ox+ww,oy+hh],manualOffset:d.offset,independent:true})}
   annotationPlan.renderNotation((d,k)=>path(d,{stroke:teal,'stroke-width':1.8,'stroke-dasharray':k==='symmetry'?'8 4 2 4':'','data-ag-notation':k}),(p,v)=>text(p[0],p[1],v,13,{'data-ag-annotation-value':'1','paint-order':'stroke',stroke:'#fff','stroke-width':3}));
   annotationPlan.renderAutomatic((d,p,v)=>{path(d,{stroke:teal,'stroke-width':1.8,'data-ag-angle-mark':'1'});text(p[0],p[1],v,12,{'data-ag-angle-value':'1','paint-order':'stroke',stroke:'#fff','stroke-width':3})});
    st.points.forEach((p,i)=>{if(key&&d.type==='build-circle'&&i!==0)return;circle(p,3,ink);const pos=labLabel(st,i);text(pos[0],pos[1]+4,d.type==='build-midpoint'&&i===2?'M':d.type==='build-bisector'&&i===4?'M':labPointText(st,i)+(free&&datumState(st).coordinates?' '+datumCoordinateText(st,p):''),16,{'data-ag-point-label':st.names[i],'paint-order':'stroke',stroke:'#fff','stroke-width':3})});
   if(!free&&['shape-build','build-right','build-perpendicular','build-asa','build-rhombus'].includes(d.type))labelArc(...st.points[0],38,0,d.angle,d.angle+'°');
   if(key&&d.type==='build-asa')labelArc(...st.points[1],38,180-d.rightAngle,d.rightAngle,d.rightAngle+'°');
   if(key&&d.type==='build-circle'){const p=st.points[0],q=polar(...p,40*d.length,120);line(p,q,orange,2,{'data-ag-radius-line':'1'});dimension(p,q,d.length+' cm',{size:18,offset:24,outside:[p[0]-100,p[1]-100]})}
   if(key&&['build-midpoint','build-bisector'].includes(d.type)){const m=d.type==='build-midpoint'?st.points[2]:st.points[4];for(const p of [labAt(st.points[0],labSub(m,st.points[0]),.5),labAt(m,labSub(st.points[1],m),.5)])line([p[0],p[1]-8],[p[0],p[1]+8],teal,2,{'data-ag-midpoint-tick':'1'});if(d.type==='build-bisector')labelArc(...m,25,0,90,null)}
   if(!free&&['build-rectangle','build-square'].includes(d.type)){for(let i=0;i<4;i++){const p=st.points[i],u=st.points[(i+1)%4],v=st.points[(i+3)%4],a=polar(...p,16,labAngle(p,u)),b=polar(...p,16,labAngle(p,v));path('M '+a.join(' ')+' L '+[a[0]+b[0]-p[0],a[1]+b[1]-p[1]].join(' ')+' L '+b.join(' '),{stroke:teal,'stroke-width':2})}}
   let bounds=[ox,oy,ww,hh];if(key){const ps=d.type==='build-circle'?[st.points[0]]:st.points.slice();if(d.type==='build-circle'){const p=st.points[0],r=40*d.length;ps.push([p[0]-r,p[1]-r],[p[0]+r,p[1]+r])}const xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]),pad=65;bounds=[Math.min(...xs)-pad,Math.min(...ys)-pad,Math.max(...xs)-Math.min(...xs)+2*pad,Math.max(...ys)-Math.min(...ys)+2*pad]}const out=frame(...bounds);if(key)out.setAttribute('data-ag-construction-key','1');if(free){out.setAttribute('data-ag-workspace-mm',ww/4+' '+hh/4);out.setAttribute('width',ww/4+'mm');out.setAttribute('height',hh/4+'mm')}return out;
 }
 if(mode==='construct'&&labTypes.includes(d.type)&&!teacher){
   add('rect',{x:24,y:24,width:752,height:552,fill:'#fff',stroke:'#c4d3cf','stroke-width':1.5,'stroke-dasharray':'5 5','data-ag-pupil-working':'1'});return frame(0,0,800,600);
 }
 if(mode==='construct'){
   const show=teacher||explore||options.attempt!=null,aa=teacher||explore?a:options.attempt??0,l=teacher||explore?d.length:options.length??0;
   const x=340,y=302,unit=40,B=[x+6*unit,y],C=polar(x,y,l*unit,aa);
   for(let gx=20;gx<=780;gx+=unit)line([gx,22],[gx,342],'#e0e9e6',1);for(let gy=22;gy<=342;gy+=unit)line([20,gy],[780,gy],'#e0e9e6',1);
   line([x,y],B,ink,4);text(x-18,y+20,'A',26);text(B[0]+16,B[1]+20,'B',26);dimension([x,y],B,'6 cm',{outside:[x,y+100],size:16});
   if(show&&l>0&&aa>0){line([x,y],C,teal,4);line(C,B,ink,4);text(C[0],C[1]-14,'C',26);labelArc(x,y,43,0,aa,aa+'°');const mid=labAt([x,y],labSub(C,[x,y]),.5);dimension([x,y],C,l+' cm',{outside:labAt(mid,labSub(mid,B),1),lines:[[[x,y],B],[C,B]],size:16})}
   text(400,402,'Scale: each grid square represents 1 cm',25);return svg
 }

 if(mode==='loci'&&d.locusState?.kind==='custom'){
   const st=d.locusState,{points}=customResolve(st),attrs={'data-ag-custom-object':'1'};
   const bounds=options.dynamicBounds||customBounds(st,options.paper?48:24);if(st.grid&&!options.paper){const [x,y,w,h]=bounds,defs=add('defs',{}),pattern=add('pattern',{id:'ag-custom-grid',width:40,height:40,patternUnits:'userSpaceOnUse'},null,defs);add('path',{d:'M40 0H0V40',fill:'none',stroke:'#e3ebe8','stroke-width':1},null,pattern);add('rect',{x,y,width:w,height:h,fill:'url(#ag-custom-grid)','data-ag-custom-grid':'1'})}
   for(const object of st.objects||[]){const [a,b]=object.refs.map(id=>points[id]);if(!a||!b||labDist(a,b)<1e-8)continue;
     if(object.op==='circle')add('circle',{cx:a[0],cy:a[1],r:labDist(a,b),fill:'none',stroke:teal,'stroke-width':2,...attrs});
     else if(object.op==='line'){const angle=labAngle(a,b);line(rayEnd(a,angle+180,bounds),rayEnd(a,angle,bounds),teal,2,attrs)}
     else line(a,b,teal,2.5,attrs);
   }
   for(const [name,trail] of Object.entries(st.traces||{}))for(const pts of traceParts(trail))add('polyline',{points:pts.map(p=>p.join(',')).join(' '),fill:'none',stroke:orange,'stroke-width':2,'data-ag-locus-trace':name});
   for(const n of st.nodes||[]){const p=points[n.id];if(!p)continue;const movable=CUSTOM_OPERATIONS[n.op]?.place;if(st.traceNames?.includes(n.id)&&!options.paper)add('circle',{cx:p[0],cy:p[1],r:10,fill:'none',stroke:orange,'stroke-width':2});add('circle',{cx:p[0],cy:p[1],r:movable?5.5:4,fill:movable?teal:ink,'data-ag-custom-point':n.id,'data-ag-custom-movable':String(!!movable)});text(p[0]+12,p[1]-10,n.id,15,{'paint-order':'stroke',stroke:'#fff','stroke-width':3})}
   return frame(...bounds);
 }
 if(mode==='loci'){
   const st=d.locusState||locusInitial(),preset=locusPreset(st.kind,st.params),points=locusPoints(st),P=points.P,showM=st.showMidpoint||st.traceNames?.includes('M')||st.traces?.M?.length,guideAttrs={fill:'none',stroke:'#83a99f','stroke-width':1.6,'stroke-dasharray':'6 5','data-ag-locus-guide':'1'};
   if(st.showLocus)for(const g of preset.guides){if(g.circle){const [cx,cy,r]=g.circle;add('circle',{cx,cy,r,...guideAttrs})}else if(g.ellipse){const [cx,cy,rx,ry]=g.ellipse;add('ellipse',{cx,cy,rx,ry,...guideAttrs})}else if(g.polyline)add('polyline',{points:g.polyline.map(p=>p.join(',')).join(' '),...guideAttrs});else line(...g.line,'#83a99f',1.6,guideAttrs)}
   for(const g of preset.objects?.(P)||[]){const [cx,cy,r]=g.circle;add('circle',{cx,cy,r,fill:'none',stroke:ink,'stroke-width':2.2,'data-ag-constraint-circle':'1'})}
   for(const [name,trail] of Object.entries(st.traces||{}))for(const pts of traceParts(trail))add('polyline',{points:pts.map(p=>p.join(',')).join(' '),fill:'none',stroke:name==='P'?orange:'#5385c5','stroke-width':2.4,'stroke-linejoin':'round','stroke-linecap':'round','data-ag-locus-trace':name});
   if(preset.shape)add('polygon',{points:preset.shape.map(n=>points[n].join(',')).join(' '),fill:'#dceee9','fill-opacity':.45,stroke:'none','data-ag-constrained-shape':st.kind});
   for(const [a,b] of preset.links){const fixed=a in preset.anchors&&b in preset.anchors;line(points[a],points[b],fixed?ink:teal,fixed?1.5:2.5,fixed&&!preset.shape?{'stroke-dasharray':'5 4'}:{})}
   for(const n of preset.rightCorners||[]){const i=preset.shape.indexOf(n),p=points[n],a=points[preset.shape[(i+1)%preset.shape.length]],b=points[preset.shape[(i+preset.shape.length-1)%preset.shape.length]],u=labSub(a,p),v=labSub(b,p),q=labAt(p,u,13/Math.hypot(...u)),r=labAt(p,v,13/Math.hypot(...v));add('polyline',{points:[q,[q[0]+r[0]-p[0],q[1]+r[1]-p[1]],r].map(p=>p.join(',')).join(' '),fill:'none',stroke:teal,'stroke-width':1.7,'data-ag-constraint-right-angle':n})}
   for(const [a,n,b] of preset.rightTriples||[]){const p=points[n],u=labSub(points[a],p),v=labSub(points[b],p),lu=Math.hypot(...u),lv=Math.hypot(...v);if(lu<1e-6||lv<1e-6)continue;const q=labAt(p,u,Math.min(13,lu*.5)/lu),r=labAt(p,v,Math.min(13,lv*.5)/lv);add('polyline',{points:[q,[q[0]+r[0]-p[0],q[1]+r[1]-p[1]],r].map(p=>p.join(',')).join(' '),fill:'none',stroke:teal,'stroke-width':1.7,'data-ag-constraint-right-angle':n})}
   for(const [a,b] of preset.equalEdges||[]){const p=points[a],q=points[b],m=labAt(p,labSub(q,p),.5),angle=labAngle(p,q)+90;line(polar(...m,7,angle),polar(...m,7,angle+180),teal,2,{'data-ag-constraint-equal-side':'1'})}
   const namePoint=(p,name,movable=false)=>{if(st.traceNames?.includes(name)&&!options.paper)add('circle',{cx:p[0],cy:p[1],r:11,fill:'none',stroke:name==='P'?orange:'#5385c5','stroke-width':2});add('circle',{cx:p[0],cy:p[1],r:movable?6:4,fill:movable?teal:ink,'data-ag-locus-point':name});const neighbours=preset.links.filter(l=>l.includes(name)).map(l=>points[l.find(n=>n!==name)]),q=vertexLabel(p,neighbours[0],neighbours[1],18);text(q[0],q[1]+4,name,16,{'paint-order':'stroke',stroke:'#fff','stroke-width':3})};
   for(const name of Object.keys(points))if((name!=='M'||showM)&&(!preset.hiddenPoints?.includes(name)||st.traceNames?.includes(name)))namePoint(points[name],name,name==='P');
   if(options.paper){
     // Derive the printable extent from actual rendered geometry, including
     // dependent endpoints, guides and traces. The captions live below it.
     let left=65,top=10,right=735,bottom=420;
     const include=(p,rx=0,ry=rx)=>{if(!p||!p.every(Number.isFinite))return;left=Math.min(left,p[0]-rx-40);right=Math.max(right,p[0]+rx+40);top=Math.min(top,p[1]-ry-40);bottom=Math.max(bottom,p[1]+ry+40)};
     Object.values(points).forEach(p=>include(p));
     for(const trail of Object.values(st.traces||{}))for(const p of trail)include(p);
     for(const g of [...(st.showLocus?preset.guides:[]),...(preset.objects?.(P)||[])]){
       if(g.circle)include(g.circle.slice(0,2),g.circle[2]);
       else if(g.ellipse)include(g.ellipse.slice(0,2),g.ellipse[2],g.ellipse[3]);
       else for(const p of g.polyline||g.line||[])include(p);
     }
     let y=bottom+32;const width=right-left,caption=value=>{for(const row of G.exportTools.wrapPaperText(value,width-40,29,400)){text((left+right)/2,y,row,29,{'data-ag-locus-caption':'1'});y+=38}};
     caption(preset.summary(P));caption(preset.rule);if(showM)caption('M is the midpoint of '+Object.keys(preset.anchors)[0]+'P.');
     return frame(left,top,width,y-top+12);
   }
   if(!options.dynamicBounds){text(400,435,preset.summary(P),17);text(400,462,preset.rule,16);if(showM)text(400,484,'M is the midpoint of '+Object.keys(preset.anchors)[0]+'P.',15)}
   return frame(...(options.dynamicBounds||[65,10,670,490]))
 }
 if(mode==='circle'&&['circle-chord-half','circle-chord-distance','circle-arc-length','circle-sector-area','circle-segment-area','circle-tangent-angle'].includes(type)){
   const m=circleInvestigation(d),{O,A,B,M,R,start,span}=m,chord=type.startsWith('circle-chord'),tangent=type==='circle-tangent-angle',segment=type==='circle-segment-area',sector=type==='circle-sector-area',arcPath='M '+A.join(' ')+' A '+R+' '+R+' 0 '+(span>180?1:0)+' 0 '+B.join(' ');
   if(sector)path('M '+O.join(' ')+' L '+A.join(' ')+' A '+R+' '+R+' 0 '+(span>180?1:0)+' 0 '+B.join(' ')+' Z',{fill:'#dcefe8',stroke:'none','data-ag-circle-sector':'1'});
   if(segment)path(arcPath+' Z',{fill:'#f4e0be',stroke:'none','data-ag-circle-segment':'1'});
   add('circle',{cx:O[0],cy:O[1],r:R,fill:'none',stroke:ink,'stroke-width':3,'data-ag-circle-outline':'1'});
   const mark=(p,label,offset)=>{circle(p,3,ink);text(p[0]+offset[0],p[1]+offset[1],label,18,{'data-ag-point-label':label,'paint-order':'stroke',stroke:'#fff','stroke-width':3})};
   line(O,A,teal,2,{'data-ag-circle-radius':'A'});mark(O,'O',[-20,25]);
   if(tangent){
     const T=[A[0],A[1]-R*Math.tan(d.tangentAngle*D)];
     line([A[0],Math.max(5,T[1]-32)],[A[0],A[1]+50],orange,3,{'data-ag-circle-tangent':'1'});line(O,T,teal,2);
     labelArc(...A,18,90,90,null);labelArc(...O,30,0,d.tangentAngle,d.tangentAngle+'°',{labelRadius:65});
     labelArc(...T,20,180+d.tangentAngle,90-d.tangentAngle,teacher?d.answer+'°':'x',{labelRadius:47});
     mark(A,'A',[20,22]);mark(T,'T',[20,-9]);
   }else{
     line(O,B,teal,2,{'data-ag-circle-radius':'B'});
     for(const [p,name,angle] of [[A,'A',start],[B,'B',start+span]]){const q=exactPolar(...O,R+27,angle);mark(p,name,[q[0]-p[0],q[1]-p[1]+6])}
     if(chord){
       line(A,B,orange,3,{'data-ag-circle-chord':'1'});line(O,M,teal,2,{'data-ag-circle-chord-bisector':'1','stroke-dasharray':'5 4'});mark(M,'M',[0,-16]);labelArc(...M,17,270,90,null);
       const p=type==='circle-chord-half'?labAt(A,labSub(M,A),.5):labAt(O,labSub(M,O),.5);
       text(p[0]+(type==='circle-chord-half'?0:20),p[1]+(type==='circle-chord-half'?-12:0),teacher?d.answer+' cm':'x',18,{'data-ag-circle-unknown':'1','paint-order':'stroke',stroke:'#fff','stroke-width':3});
     }else{
       path(arcPath,{stroke:orange,'stroke-width':4,'data-ag-circle-arc':'1'});
       if(segment)line(A,B,orange,2,{'data-ag-circle-chord':'1'});
       labelArc(...O,28,start,span,span+'°',{labelRadius:58});
     }
   }
   const given=chord?(type==='circle-chord-half'?'AB = '+d.chordLength+' cm':'OA = '+d.radius+' cm · AB = '+d.chordLength+' cm'):tangent?'AT is tangent at A.':'Radius = '+d.radius+' cm';
   text(400,375,given,19,{'data-ag-circle-challenge-given':'1'});
   if(teacher)text(400,415,(chord?(type==='circle-chord-half'?'AM':'OM'):tangent?'Angle OTA':segment?'Segment area':sector?'Sector area':'Arc length')+' = '+d.answer+(tangent?'°':segment||sector?' cm²':' cm'),20,{'data-ag-circle-challenge-answer':'1'});
   return frame(150,0,500,teacher?440:400);
 }
 if(mode==='circle'&&explore&&d.circleView==='equal-tangents'){
   const m=circleTheoremModel(d),{O,R,P,A,B}=m,fmt=v=>v.toFixed(2),markRight=(p,a,b)=>{const u=labAngle(p,a),v=labAngle(p,b);labelArc(...p,18,mod(v-u)<=180?u:v,90,null)},tick=(a,b)=>{const p=labAt(a,labSub(b,a),.5),q=labAngle(a,b);line(exactPolar(...p,7,q+90),exactPolar(...p,7,q-90),orange,2.8,{'data-ag-tangent-equal-mark':'1'})};
   add('circle',{cx:O[0],cy:O[1],r:R,fill:'none',stroke:ink,'stroke-width':3,'data-ag-circle-outline':'1'});
   line(O,A,teal,2.2);line(O,B,teal,2.2);line(A,P,orange,2.8,{'data-ag-equal-tangent':'PA'});line(B,P,orange,2.8,{'data-ag-equal-tangent':'PB'});line(O,P,ink,1.6,{'stroke-dasharray':'5 5','data-ag-tangent-bisector':'1'});
   markRight(A,O,P);markRight(B,O,P);tick(A,P);tick(B,P);
   for(const [name,p] of Object.entries({O,A,B,P})){const q=name==='O'?[p[0]-16,p[1]+14]:name==='P'?[p[0]+23,p[1]+5]:exactPolar(...O,R+24,labAngle(O,p));circle(p,5,teal);text(q[0],q[1]+4,name,18,{'data-ag-point-label':name,'paint-order':'stroke',stroke:'#fff','stroke-width':3})}
   if(!options.paper)add('circle',{cx:P[0],cy:P[1],r:23,fill:'transparent',stroke:'none','data-ag-circle-handle':'P',cursor:'grab','aria-label':'Move external point P'});
   text(400,400,'Tangents drawn from the same external point are equal.',19,{'data-ag-circle-theorem':'equal-tangents'});
   text(400,430,'PA = PB = '+fmt(m.PA)+' cm',22,{'data-ag-theorem-equation':'1'});
   text(400,459,'OP bisects angle APB: '+fmt(m.halfA)+'° = '+fmt(m.halfB)+'°',18);
   text(400,487,options.paper?'OA and OB meet the tangents at right angles.':'Drag P outside the circle to change the two tangents.',16);
   return frame(40,0,720,505);
 }
 if(mode==='circle'&&explore&&isCircleTheorem(d.circleView)){
   const m=circleTheoremModel(d),{O,R,A,B,C,D:Q,start,span,angles,view}=m,same=view==='same-segment',cyclic=view==='cyclic-quad',central=view==='centre-angle',semi=view==='semicircle',alternate=view==='alternate-segment',fmt=v=>v.toFixed(2)+'°';
   add('circle',{cx:O[0],cy:O[1],r:R,fill:'none',stroke:ink,'stroke-width':3,'data-ag-circle-outline':'1'});
   path('M '+A.join(' ')+' A '+R+' '+R+' 0 '+(span>180?1:0)+' 0 '+B.join(' '),{stroke:orange,'stroke-width':4,'data-ag-theorem-arc':'1'});
   line(A,B,semi?orange:ink,2.2,{'data-ag-theorem-chord':'AB'});line(A,C,teal,2.4);line(B,C,teal,2.4);
   if(same||cyclic){line(A,Q,orange,2.4);line(B,Q,orange,2.4)}
   if(central){line(O,A,orange,2.2);line(O,B,orange,2.2);labelArc(...O,35,start,span,fmt(span),{labelSize:18,labelRadius:57})}
   const mark=(p,value)=>{const a=labAngle(p,A),b=labAngle(p,B),sweep=mod(b-a),st=sweep<=180?a:b;labelArc(...p,Math.min(26,R*.22),st,Math.min(sweep,360-sweep),fmt(value),{labelSize:17,labelRadius:Math.min(51,R*.44)})};
   mark(C,m.Cangle);if(same||cyclic)mark(Q,m.Dangle);
   if(alternate){line(m.U,m.T,orange,2.8,{'data-ag-theorem-tangent':'1'});const t=labAngle(A,m.T),b=labAngle(A,B),s=mod(b-t);labelArc(...A,24,s<=180?t:b,Math.min(s,360-s),fmt(m.tangentAngle),{labelSize:17,labelRadius:46});const q=exactPolar(...m.T,15,t);text(q[0],q[1],'T',17,{'data-ag-point-label':'T','paint-order':'stroke',stroke:'#fff','stroke-width':3})}
   if(central||semi){circle(O,4,ink);text(O[0],O[1]+19,'O',17,{'data-ag-point-label':'O','paint-order':'stroke',stroke:'#fff','stroke-width':3})}
   for(const name of ['A','B','C',...(same||cyclic?['D']:[])]){
     const p=m[name],q=exactPolar(...O,R+25,angles[name]);circle(p,5,teal);text(q[0],q[1]+5,name,18,{'data-ag-point-label':name,'paint-order':'stroke',stroke:'#fff','stroke-width':3});
     if(!options.paper&&['C','D'].includes(name))add('circle',{cx:p[0],cy:p[1],r:23,fill:'transparent',stroke:'none','data-ag-circle-handle':name,cursor:'grab','aria-label':'Move circle point '+name});
   }
   const rule=central?'The angle at the centre is twice the angle at the circumference.':semi?'An angle subtended by a diameter is always a right angle.':same?'Angles subtended by the same chord in the same segment are equal.':alternate?'The tangent–chord angle equals the angle in the alternate segment.':'Opposite angles of a cyclic quadrilateral add to 180°.';
   const equation=central?fmt(span)+' = 2 × '+fmt(m.Cangle):semi?'Angle ACB = '+fmt(m.Cangle):same?'Angle ACB = angle ADB = '+fmt(m.Cangle):alternate?'Angle TAB = angle ACB = '+fmt(m.tangentAngle):fmt(m.Cangle)+' + '+fmt(m.Dangle)+' = 180°';
   text(400,410,rule,18,{'data-ag-circle-theorem':view});
   text(400,441,equation,21,{'data-ag-theorem-equation':'1'});
   text(400,470,options.paper?'A and B define the selected chord.':'Move '+(same||cyclic?'C and D':'C')+' along the circumference to investigate.',16);
   return frame(40,0,720,490);
 }
 if(mode==='circle'&&explore&&CIRCLE_VIEWS.slice(1).some(([k])=>k===d.circleView)){
   const m=circleInvestigation(d),{O,A,B,M,T,U,R,start,span,r}=m,view=d.circleView,show=d.circleEnrichment===true,paper=options.paper;
   const arcPath='M '+A.join(' ')+' A '+R+' '+R+' 0 '+(span>180?1:0)+' 0 '+B.join(' ');
   if(view==='sector')path('M '+O.join(' ')+' L '+A.join(' ')+' A '+R+' '+R+' 0 '+(span>180?1:0)+' 0 '+B.join(' ')+' Z',{fill:'#dcefe8',stroke:'none','data-ag-circle-sector':'1'});
   if(view==='segment')path(arcPath+' Z',{fill:'#f4e0be',stroke:'none','data-ag-circle-segment':'1'});
   add('circle',{cx:O[0],cy:O[1],r:R,fill:'none',stroke:ink,'stroke-width':3,'data-ag-circle-outline':'1'});
   const tangentView=view==='tangent',chordView=view==='chord'||view==='segment';
   line(O,A,teal,2,{'data-ag-circle-radius':'A'});if(!tangentView)line(O,B,teal,2,{'data-ag-circle-radius':'B'});
   if(chordView)line(A,B,orange,3,{'data-ag-circle-chord':'1'});
   if(view==='sector'||view==='segment')path(arcPath,{stroke:orange,'stroke-width':4,'data-ag-circle-arc':'1'});
   if(view==='chord'){
     if(labDist(O,M)>1e-6){line(O,M,teal,2,{'stroke-dasharray':'5 4','data-ag-circle-chord-bisector':'1'});const a=labAngle(M,O),b=labAngle(M,A);let st=a;if(mod(b-a)>180)st=b;labelArc(...M,14,st,90,null)}
     circle(M,4,ink);text(M[0]+15,M[1]+18,'M',16,{'data-ag-point-label':'M','paint-order':'stroke',stroke:'#fff','stroke-width':3});
   }
   if(tangentView){line(U,T,orange,3,{'data-ag-circle-tangent':'1'});labelArc(...A,17,mod(start+90),90,null);text(T[0]+12,T[1]+14,'t',18,{'paint-order':'stroke',stroke:'#fff','stroke-width':3})}
   else if(view==='sector'||view==='segment')labelArc(...O,Math.min(33,R*.35),start,span,span.toFixed(2)+'°',{labelSize:17});
   circle(O,4,ink);text(O[0]-13,O[1]+20,'O',16,{'data-ag-circle-centre':'1','data-ag-point-label':'O','paint-order':'stroke',stroke:'#fff','stroke-width':3});
   for(const [name,p,a] of [['A',A,start],...(!tangentView?[['B',B,start+span]]:[])]){
     const q=exactPolar(...O,R+24,a);circle(p,5,teal);text(q[0],q[1]+5,name,19,{'data-ag-point-label':name,'paint-order':'stroke',stroke:'#fff','stroke-width':3});
     if(!paper)add('circle',{cx:p[0],cy:p[1],r:22,fill:'transparent',stroke:'none','data-ag-circle-handle':name,cursor:'grab','aria-label':'Move circle point '+name});
   }
   const names={chord:'Chord AB joins two points on the circumference.',sector:'A sector is bounded by two radii and an arc.',segment:'A segment is bounded by a chord and an arc.',tangent:'The tangent is perpendicular to radius OA at A.'};
   text(400,395,names[view],19,{'data-ag-circle-investigation-rule':view});let y=425;
   const values=view==='chord'?'AM = MB = '+(m.chord/2).toFixed(2)+' cm · AB = '+m.chord.toFixed(2)+' cm':tangentView?'Angle between radius and tangent = 90°':(span>180?'Major':span===180?'Semicircle':'Minor')+' '+(view==='sector'?'sector':'segment')+' · Central angle = '+span.toFixed(2)+'°';
   text(400,y,values,18,{'data-ag-circle-investigation-value':view});
   if(show&&!tangentView){y+=30;const formula=view==='chord'?'OM = '+m.distance.toFixed(2)+' cm':view==='sector'?'Arc = '+m.arc.toFixed(2)+' cm · Sector area = '+m.sector.toFixed(2)+' cm²':'Arc = '+m.arc.toFixed(2)+' cm · Segment area = '+m.segment.toFixed(2)+' cm²';text(400,y,formula,18,{'data-ag-circle-investigation-formula':view})}
   return frame(45,0,710,y+30);
 }
 if(mode==='circle'){
   const r=d.radius||5,x=400,y=180,R=explore?65+6*r:145,p=[x,y],left=[x-R,y],right=[x+R,y],top=[x,y-R];
   const highlight=d.part||'Radius',isPart=type==='circle-part',rad=explore||teacher&&!isPart||type!=='circle-radius'&&!isPart||isPart&&highlight==='Radius',dia=explore||teacher&&!isPart&&['circle-radius','circle-diameter'].includes(type)||type==='circle-radius'||isPart&&highlight==='Diameter';
   add('circle',{cx:x,cy:y,r:R,fill:shapeFill,stroke:isPart&&highlight==='Circumference'?orange:ink,'stroke-width':isPart&&highlight==='Circumference'?5:3,'data-ag-circle-outline':'1'});
   // Paper rendering enlarges small text to 29 units. Allow for the actual
   // rendered label size rather than reusing the smaller screen offsets.
   const pointSize=options.paper?29:13,symbolSize=options.paper?29:17,pointGap=pointSize+4,symbolGap=symbolSize*.75+6;
   const pointLabel=(q,name)=>text(q[0],q[1],name,pointSize,{'dominant-baseline':'central','data-ag-point-label':name});
   const symbolLabel=(q,name)=>text(q[0],q[1],name,symbolSize,{'dominant-baseline':'central','font-style':'italic','data-ag-circle-symbol':name});
   if(dia){line(left,right,isPart?orange:teal,isPart?4:2.5,explore?{'stroke-dasharray':'7 5'}:{});if(!isPart)symbolLabel([x-R*.55,y+symbolGap],'D')}
   if(rad){const end=polar(x,y,R,55);line(p,end,isPart?orange:teal,isPart?4:2.5);if(!isPart){const mid=polar(x,y,R*.58,55),offset=polar(...mid,symbolGap,-35);symbolLabel(offset,'r')}}
   add('circle',{cx:x,cy:y,r:isPart&&highlight==='Centre'?7:3.5,fill:isPart&&highlight==='Centre'?orange:ink,'data-ag-circle-centre':'1'});
   if(!isPart){pointLabel([x,y+pointGap],'O');if(dia){for(const [p,name,dx] of [[left,'A',-pointGap],[right,'B',pointGap]]){circle(p,2.8,ink);pointLabel([p[0]+dx,p[1]],name)}}if(rad){const end=polar(x,y,R,55),pos=polar(x,y,R+pointGap,55);circle(end,2.8,ink);pointLabel(pos,dia?'C':'A')}}
   let baseline=365;
   if(isPart){if(teacher)text(x,baseline,highlight,19);return frame(200,12,400,teacher?380:338)}
   const given=explore||teacher?'r = '+r+' cm     ·     D = '+2*r+' cm':type==='circle-radius'?'D = '+2*r+' cm':'r = '+r+' cm';
   text(x,baseline,given,18,{'data-ag-circle-values':'1'});
   if(explore||teacher&&['circle-radius','circle-diameter'].includes(type)){baseline+=25;text(x,baseline,'D = 2r  (Diameter = 2 × radius)',17,{'data-ag-circle-rule':'1'})}
   if(explore&&d.circleEnrichment){
     baseline+=30;text(x,baseline,'Circumference: C = πD = 2πr',17,{'data-ag-circle-formula':'circumference'});
     baseline+=23;text(x,baseline,'C = 2 × π × '+r+' ≈ '+(2*Math.PI*r).toFixed(2)+' cm',16,{'data-ag-circle-working':'circumference'});
     baseline+=30;text(x,baseline,'Area: A = πr²',17,{'data-ag-circle-formula':'area'});
     baseline+=23;text(x,baseline,'A = π × '+r+'² ≈ '+(Math.PI*r*r).toFixed(2)+' cm²',16,{'data-ag-circle-working':'area'});
   }
   if(teacher&&['circle-area','circle-circumference'].includes(type)){
     const area=type==='circle-area';baseline+=26;text(x,baseline,area?'A = πr²':'C = 2πr',17,{'data-ag-circle-formula':area?'area':'circumference'});
     baseline+=23;text(x,baseline,(area?'A = 3.14 × '+r+'²':'C = 2 × 3.14 × '+r)+' = '+d.answer+(area?' cm²':' cm'),16,{'data-ag-circle-working':area?'area':'circumference'});
   }
   return frame(190,12,420,baseline+12);
 }
 if(mode==='polygon'&&['rectangle-length','diagonal-equal','diagonal-bisect','diagonal-perpendicular','parallel-count','shape-family','isosceles-angle'].includes(type)){
   let pts;
   if(type==='isosceles-angle'){
     pts=fit(trianglePoints(d.angles[0],d.angles[1]));polygon(pts);
     for(const i of [0,1]){const p=pts[i],q=pts[2],mid=[(p[0]+q[0])/2,(p[1]+q[1])/2],a=Math.atan2(q[1]-p[1],q[0]-p[0]);line([mid[0]-9*Math.sin(a),mid[1]+9*Math.cos(a)],[mid[0]+9*Math.sin(a),mid[1]-9*Math.cos(a)],teal,3)}
     pts.forEach((p,i)=>corner(pts,i,i===0&&!teacher?'x':i===1&&!teacher?null:d.angles[i]+'°'));return polygonFrame(pts)
   }
   if(type==='rectangle-length')pts=fit([[0,0],[d.width,0],[d.width,d.height],[0,d.height]]);
   else if(d.shape==='Square')pts=fit([[0,0],[200,0],[200,200],[0,200]]);
   else if(d.shape.startsWith('Rectangle'))pts=fit([[0,0],[320,0],[320,190],[0,190]]);
   else if(d.shape.startsWith('Rhombus'))pts=fit([[0,0],[200,0],polar(200,0,200,65),polar(0,0,200,65)]);
   else if(d.shape==='Trapezium')pts=fit([[0,0],[320,0],[240,-180],[70,-180]]);
   else pts=fit([[0,0],[320,0],polar(320,0,180,65),polar(0,0,180,65)]);
   polygon(pts);
   if(type==='rectangle-length'){pts.forEach((p,i)=>{corner(pts,i,null);const q=pts[(i+1)%4],m=labAt(p,labSub(q,p),.5);dimension(p,q,i===d.missingSide&&!teacher?'x':(i%2?d.height:d.width)+' cm',{outside:labAt(m,labSub(m,[400,210]),1),lines:pts.map((p,i)=>[p,pts[(i+1)%4]]),size:16,offset:25})})}
   else if(type.startsWith('diagonal-')){line(pts[0],pts[2],teal,3,{'stroke-dasharray':'7 4'});line(pts[1],pts[3],orange,3,{'stroke-dasharray':'7 4'});const u=labSub(pts[2],pts[0]),v=labSub(pts[3],pts[1]),o=labAt(pts[0],u,labCross(labSub(pts[1],pts[0]),v)/labCross(u,v));add('circle',{cx:o[0],cy:o[1],r:3,fill:ink,'data-ag-inspect-point':'O'});text(o[0]+13,o[1]-10,'O',15,{'data-ag-point-label':'O'});if(teacher){const yes=d.answer==='Yes';text(400,410,yes?({'diagonal-equal':'Equal diagonals','diagonal-bisect':'Diagonals bisect each other','diagonal-perpendicular':'Perpendicular diagonals'}[type]):({'diagonal-equal':'Diagonals are not always equal','diagonal-bisect':'Diagonals do not always bisect each other','diagonal-perpendicular':'Diagonals are not always perpendicular'}[type]),18);return frame(70,0,660,440)}}
   return polygonFrame(pts,80)
 }

 if(mode==='polygon'&&(type==='triangle-inequality'||explore&&d.shapeView==='triangle-inequality')){
   const lengths=inequalitySettings(d),m=triangleInequality(lengths),[a,b,c]=m.sorted,show=explore?d.inequalityReveal===true:teacher,scale=480/c,fmt=n=>String(Number(n.toFixed(2)));
   lengths.forEach((n,i)=>{const y=55+i*52;line([90,y],[90+n*scale,y],i===0?teal:i===1?orange:ink,5,{'data-ag-inequality-side':i});text(65,y+6,['a','b','c'][i],20);text(665,y+7,fmt(n)+' cm',22,{'data-ag-inequality-given':i})});
   if(show){
     const y=350,s=Math.min(420/c,m.kind==='valid'?140/Math.max(1e-12,-m.points[2][1]):420/c),left=400-c*s/2,A=[left,y],B=[left+c*s,y];
     line(A,B,ink,4,{'data-ag-inequality-baseline':'1'});
     if(m.kind==='valid'){
       const C=[left+m.points[2][0]*s,y+m.points[2][1]*s];line(A,C,teal,4,{'data-ag-inequality-result-side':'1'});line(B,C,orange,4,{'data-ag-inequality-result-side':'1'});circle(C,4,teal);
       text(400,384,'The sides meet and enclose an area.',19);
     }else{
       const p=[left+a*s,y-40],q=[left+(c-b)*s,y-40];line([left,y-40],p,teal,5,{'data-ag-inequality-result-side':'1'});line(q,[left+c*s,y-40],orange,5,{'data-ag-inequality-result-side':'1'});
       if(m.kind==='impossible')line(p,q,'#9aa9a8',2,{'stroke-dasharray':'5 4','data-ag-inequality-gap':'1'});else circle(p,4,teal);
       text(400,384,m.kind==='flat'?'They meet only in a straight line.':'The two shorter sides cannot meet.',19);
     }
     text(400,423,fmt(a)+' + '+fmt(b)+' '+(m.kind==='valid'?'>':m.kind==='flat'?'=':'<')+' '+fmt(c),26,{'data-ag-inequality-equation':'1'});
     text(400,458,m.kind==='valid'?'Triangle possible':m.kind==='flat'?'No triangle — zero area':'No triangle — gap remains',22,{'data-ag-inequality-result':m.kind});
   }else text(400,273,'Could these lengths close into a triangle?',22);
   return frame(0,0,800,480)
 }
 if(mode==='polygon'&&(type==='triangle-criterion'||explore&&d.shapeView==='triangle-criterion')){
   const model=triangleCriterion(d.criterion,d.criterionSize),show=explore?d.criterionReveal===true:teacher,pair=show?model.triangles:model.triangles.slice(0,1),bounds=model.triangles.map(pts=>{const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]}),scale=Math.min(...bounds.map(([x,y,r,b])=>Math.min(260/(r-x),205/(b-y))));
   const fmt=v=>String(Number(v.toFixed(2)));
   pair.forEach((pts,j)=>{const [x,y,r,b]=bounds[j],cx=show?(j?595:205):400,placed=pts.map(([u,v])=>[cx+(u-(x+r)/2)*scale,158+(v-(y+b)/2)*scale]),names=j?['D','E','F']:['A','B','C'],properties=triangleProperties(pts);
     polygon(placed,names);text(cx,20,show?'Possible triangle '+(j+1):'Given information',20);
     for(const i of model.edges){line(placed[i],placed[(i+1)%3],teal,4,{'data-ag-criterion-edge':j+':'+i})}
     for(const i of model.angles)corner(placed,i,null);
     const givens=[...model.edges.map(i=>names[i]+names[(i+1)%3]+' = '+fmt(properties.lengths[i])+' cm'),...model.angles.map(i=>'∠'+names[i]+' = '+fmt(properties.angles[i])+'°')];
     givens.forEach((v,i)=>text(cx,294+i*26,v,19,{'data-ag-criterion-given':j+':'+i}));
   });
   if(show){text(400,397,model.unique?'Yes — '+model.kind+' fixes the triangle':'No — '+model.kind+' does not guarantee congruence',22,{'data-ag-criterion-result':model.unique?'yes':'no'});const lines=model.kind==='SSA'?['Two different third vertices satisfy the givens.','Both triangles have the stated sides and angle, but differ in shape.']:model.kind==='AAA'?['The angles fix the shape, not the size.','An enlargement has the same three angles.']:model.kind==='SSS'?['Three side lengths fix the shape and size.','Rotation or reflection does not change congruence.']:model.kind==='SAS'?['The given angle lies between the two given sides.','It fixes the remaining side.']:model.kind==='ASA'?['Two angles fix the third; the side fixes the size.']:['The right angle, hypotenuse and one leg fix the triangle.'];lines.forEach((v,i)=>text(400,430+i*25,v,17,{'data-ag-criterion-explanation':'1'}))}
   return frame(0,0,800,show?480:385)
 }
 if(mode==='polygon'&&(type==='triangle-comparison'||explore&&d.shapeView==='triangle-comparison')){
   const pair=triangleComparison(d.comparison),result=triangleComparisonResult(...pair),show=!explore?teacher:d.comparisonReveal!==false,measure=!explore||d.comparisonMeasures!==false;
   const bounds=pair.map(pts=>{const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]}),scale=Math.min(...bounds.map(([x,y,r,b])=>Math.min(270/(r-x),220/(b-y))));
   pair.forEach((pts,j)=>{const [x,y,r,b]=bounds[j],cx=j?595:205,names=j?['D','E','F']:['A','B','C'],placed=pts.map(([u,v])=>[cx+(u-(x+r)/2)*scale,165+(v-(y+b)/2)*scale]);polygon(placed,names);corner(placed,0,null);
     text(cx,24,'Triangle '+names.join(''),22,{'data-ag-comparison-title':j});
     if(measure){const lengths=pts.map((p,i)=>labDist(p,pts[(i+1)%3])),fmt=n=>String(Number(n.toFixed(2)));for(let i=0;i<3;i++)text(cx,312+i*29,names[i]+names[(i+1)%3]+' = '+fmt(lengths[i])+' cm',19,{'data-ag-comparison-length':j+':'+i})}
   });
   if(show){text(400,418,result.label,24,{'data-ag-comparison-result':'1'});text(400,451,result.label==='Congruent'?'Same shape and size; rotation and reflection preserve lengths.':result.factor===null?'The corresponding side-length ratios are not all equal.':'Same shape; scale factor '+Number(result.factor.toFixed(2))+'. Corresponding angles are equal.',17,{'data-ag-comparison-explanation':'1'});}
   return frame(0,0,800,480)
 }
 if(mode==='polygon'&&['area-same-base','area-same-perimeter','perimeter-same-area'].includes(type)){
   return areaComparisonGraphic(areaComparison(d.areaComparisonKind,d.areaComparisonValue,d.baseLength,d.height),teacher,true);
 }
 if(mode==='polygon'&&['similar-side','pythagoras'].includes(type)){
   if(type==='similar-side'){
     const ratio=d.length/d.baseLength,k=d.factor,scale=Math.min(100,260/k,230/(ratio*k)),small=[[135,310],[135+scale,310],[135,310-scale*ratio]],large=[[430,310],[430+scale*k,310],[430,310-scale*k*ratio]];
     for(const [pts,factor,names] of [[small,1,['A','B','C']],[large,k,['D','E','F']]]){
       polygon(pts,names);corner(pts,0,null);const edges=pts.map((p,i)=>[p,pts[(i+1)%3]]);
       dimension(pts[0],pts[1],d.baseLength*factor+' cm',{outside:[pts[0][0],360],size:15,lines:edges});
       dimension(pts[0],pts[2],factor===1?d.length+' cm':teacher?d.answer+' cm':'x',{outside:[pts[0][0]-70,200],size:15,lines:edges});
     }
     return frame(40,35,730,355)
   }
   const pts=fit([[0,0],[d.baseLength,0],[0,-d.length]]),edges=pts.map((p,i)=>[p,pts[(i+1)%3]]);
   polygon(pts);corner(pts,0,null);
   for(const [i,j,label] of [[0,1,!teacher&&d.missingSide==='base'?'x':d.baseLength+' cm'],[0,2,!teacher&&d.missingSide==='height'?'x':d.length+' cm'],[1,2,!teacher&&(!d.missingSide||d.missingSide==='hypotenuse')?'x':(d.hypotenuse??d.answer)+' cm']]){const a=pts[i],b=pts[j],m=labAt(a,labSub(b,a),.5),c=pts[3-i-j];dimension(a,b,label,{outside:labAt(m,labSub(m,c),1),size:16,lines:edges})}
   return polygonFrame(pts,95)
 }
 // Centre diagrams share the same analytic model in teaching, pupil and teacher output.
 function triangleCentreGraphic(pts,kind,reveal){
   if(kind==='euler'){
     const m=eulerLineModel(pts);if(!m)return pts;const {O,G,H,coincident}=m;
     if(coincident){circle(G,5,teal);text(G[0]+16,G[1]-12,'O = G = H',18,{'data-ag-euler-coincident':'1','paint-order':'stroke',stroke:'#fff','stroke-width':3});return [...pts,G]}
     line(O,H,orange,2.5,{'data-ag-euler-line':'1'});const v=labSub(H,O),n=Math.hypot(...v),normal=[-v[1]/n,v[0]/n];
     for(const [i,key] of ['O','G','H'].entries()){const p=m[key],offset=labAt(p,normal,(i===1?-1:1)*(n<65?28+i*12:20));circle(p,4,teal);line(p,offset,teal,1,{'stroke-dasharray':'2 3'});text(offset[0],offset[1]+5,key,18,{'data-ag-euler-centre':key,'paint-order':'stroke',stroke:'#fff','stroke-width':3})}
     return [...pts,O,G,H];
   }
   const model=triangleCentres(pts);if(!model||!model[kind])return pts;
   const p=model[kind],extent=[...pts,p],guide=(a,b,tag)=>{if(labDist(a,b)>1e-8){line(a,b,orange,2,{'stroke-dasharray':'6 4','data-ag-centre-guide':tag});extent.push(a,b)}};
   const through=(a,b,c,tag)=>{const v=labSub(b,a),l=labDot(v,v);if(l<1e-12)return;const t=labDot(labSub(c,a),v)/l;guide(labAt(a,v,Math.min(0,t)),labAt(a,v,Math.max(1,t)),tag)};
   const outline=(r)=>{add('circle',{cx:p[0],cy:p[1],r,fill:'none',stroke:teal,'stroke-width':2,'data-ag-centre-circle':kind});extent.push([p[0]-r,p[1]-r],[p[0]+r,p[1]+r])};
   for(let i=0;i<3;i++){
     const a=pts[(i+1)%3],b=pts[(i+2)%3],m=model.midpoints[i];
     if(kind==='centroid'){guide(pts[i],m,'median');circle(m,3,orange)}
     if(kind==='circumcentre'){const v=labSub(b,a),n=Math.hypot(...v),perp=[-v[1]/n,v[0]/n];through(m,labAt(m,perp,24),p,'perpendicular-bisector');circle(m,3,orange)}
     if(kind==='incentre')guide(pts[i],model.bisectorFeet[i],'angle-bisector');
     if(kind==='orthocentre'){const foot=model.altitudeFeet[i],v=labSub(b,a),t=labDot(labSub(foot,a),v)/labDot(v,v);if(t<0||t>1)guide(t<0?a:b,foot,'side-extension');if(labDist(pts[i],foot)>1e-8)through(pts[i],foot,p,'altitude');else{const w=labSub(b,a),n=Math.hypot(...w);through(foot,labAt(foot,[-w[1]/n,w[0]/n],24),p,'altitude')}circle(foot,3,orange)}
   }
   if(kind==='circumcentre')outline(model.circumradius);
   if(kind==='incentre'){outline(model.inradius);for(const q of model.contacts){guide(p,q,'radius');circle(q,3,teal)}}
   circle(p,5,teal);const letter=reveal?{centroid:'G',circumcentre:'O',incentre:'I',orthocentre:'H'}[kind]:'P';text(p[0]+16,p[1]-12,letter,18,{'data-ag-triangle-centre':reveal?kind:'unknown','paint-order':'stroke',stroke:'#fff','stroke-width':3});return extent;
 }
 function triangleCentreFrame(extent,kind,reveal,classification=null,rule=TRIANGLE_CENTRE_RULES[kind]){
   const xs=extent.map(p=>p[0]),ys=extent.map(p=>p[1]),x=Math.min(65,Math.min(...xs)-68),right=Math.max(735,Math.max(...xs)+68),y=Math.min(0,Math.min(...ys)-68),bottom=Math.max(380,Math.max(...ys)+68),width=right-x,centre=x+width/2;
   let base=bottom;if(classification){base+=28;text(centre,base,classification,22,{'data-ag-triangle-classification':'1'})}
   if(reveal){base+=34;text(centre,base,TRIANGLE_CENTRE_NAMES[kind],23,{'data-ag-centre-name':'1'});base+=30;text(centre,base,rule,17,{'data-ag-centre-rule':'1'})}
   return frame(x,y,width,base+30-y)
 }
 if(mode==='polygon'&&type==='euler-ratio'){
   const at={O:[185,170],G:[325,170],H:[605,170]},edges={OG:['O','G'],GH:['G','H'],OH:['O','H']};line(at.O,at.H,orange,3,{'data-ag-euler-line':'1'});
   for(const [key,p] of Object.entries(at)){circle(p,5,teal);text(p[0],p[1]-20,key,22,{'data-ag-euler-centre':key})}
   const drawDistance=(key,value)=>{const [a,b]=edges[key].map(k=>at[k]),y=key==='OH'?240:205;line([a[0],y],[b[0],y],ink,1.5);for(const p of [a,b])line([p[0],y-6],[p[0],y+6],ink,1.5);text((a[0]+b[0])/2,y+22,key+' = '+value,19,{'data-ag-euler-distance':key})};
   drawDistance(d.eulerGiven,d.eulerLength+' cm');drawDistance(d.eulerUnknown,teacher?d.answer+' cm':'x');
   if(teacher)text(400,300,'OG : GH : OH = 1 : 2 : 3',22,{'data-ag-euler-rule':'1'});
   return frame(70,85,660,245)
 }
 if(mode==='polygon'&&type==='triangle-centre'){
   const ar=rot*D,pts=fit(trianglePoints(d.angles[0],d.angles[1]).map(([x,y])=>[x*Math.cos(ar)-y*Math.sin(ar),x*Math.sin(ar)+y*Math.cos(ar)]));polygon(pts);const extent=triangleCentreGraphic(pts,d.centre,teacher);return triangleCentreFrame(extent,d.centre,teacher)
 }
 if(mode==='polygon'&&['polygon-missing','polygon-turn-missing','polygon-diagonal-count'].includes(type)){
   const diagonal=type==='polygon-diagonal-count',exterior=type==='polygon-turn-missing',n=d.n,ar=rot*D,raw=diagonal?Array.from({length:n},(_,i)=>exactPolar(0,0,150,90+i*360/n)):d.investigationPoints,pts=fit(raw.map(([x,y])=>[x*Math.cos(ar)-y*Math.sin(ar),x*Math.sin(ar)+y*Math.cos(ar)]));
   polygon(pts);
   if(diagonal){
     if(teacher){for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(j-i!==1&&j-i!==n-1)line(pts[i],pts[j],teal,1.3,{'data-ag-counted-diagonal':i+':'+j,'stroke-opacity':.65});text(400,410,n+' × '+(n-3)+' ÷ 2 = '+d.answer,22,{'data-ag-polygon-investigation-answer':'1'})}
     return frame(30,0,740,teacher?460:400);
   }
   // A separated value table avoids ambiguous or colliding labels around
   // small edges, concave corners and rotated polygons.
   const values=exterior?d.investigationTurns:d.investigationAngles;
   for(let i=0;i<n;i++){
     const row=Math.floor(i/4),col=i%4,p=pts[i],unknown=i===d.unknownVertex,v=unknown&&!teacher?'x':String(values[i])+'°';
     if(unknown){add('circle',{cx:p[0],cy:p[1],r:10,fill:'none',stroke:orange,'stroke-width':2.5,'data-ag-polygon-unknown-vertex':i})}
     text(120+col*185,408+row*35,pointName(i)+': '+v,19,{'data-ag-polygon-investigation-value':i});
   }
   const base=408+Math.ceil(n/4)*35;if(teacher)text(400,base,(exterior?'Signed turn total = 360°':'Interior angle sum = '+180*(n-2)+'°')+' · x = '+d.answer+'°',20,{'data-ag-polygon-investigation-answer':'1'});
   return frame(15,0,770,base+(teacher?24:0))
 }
 if(mode==='polygon'&&type==='geometry-reasoning'){
   if(teacher)return geometryReasoningGraphic(geometryReasoning(d.reasoningId),null,true);
   add('rect',{x:100,y:70,width:600,height:250,rx:10,fill:'none',stroke:'#afc2bd','stroke-dasharray':'7 5','data-ag-reasoning-space':'1'});text(400,110,'Draw an example or counterexample.',19);return frame(65,40,670,310);
 }
 if(mode==='polygon'&&type==='quad-reasoning'){
   // Pupil task leaves reasoning space rather than revealing the counterexample.
   if(!teacher){add('rect',{x:100,y:70,width:600,height:250,rx:10,fill:'none',stroke:'#afc2bd','stroke-dasharray':'7 5','data-ag-quad-reasoning-space':'1'});text(400,110,'Draw an example or counterexample.',19);return frame(65,40,670,310)}
   const examples=d.quadExamples||QUAD_REASONING.find(x=>x.id===d.quadStatement)?.examples.map(name=>({name,points:quadReasoningPoints(name)}))||[];
   examples.forEach((ex,i)=>{const m=quadrilateralProperties(ex.points),xs=ex.points.map(p=>p[0]),ys=ex.points.map(p=>p[1]),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys),scale=Math.min(230/w,150/h),cx=examples.length===1?400:210+i*380,cy=155,pts=ex.points.map(([x,y])=>[cx+(x-(Math.min(...xs)+Math.max(...xs))/2)*scale,cy+(y-(Math.min(...ys)+Math.max(...ys))/2)*scale]);
     polygon(pts);if(/diagonal|bisect|perp/.test(d.quadStatement)){line(pts[0],pts[2],teal,2,{'stroke-dasharray':'6 4'});line(pts[1],pts[3],orange,2,{'stroke-dasharray':'6 4'})}
     text(cx,260,ex.name,20,{'data-ag-quad-reasoning-example':ex.name});if(m)text(cx,294,m.parallelPairs.length+' parallel pair'+(m.parallelPairs.length===1?'':'s')+' · '+m.right+' right angle'+(m.right===1?'':'s'),15);
   });
   text(400,350,d.answer,24,{'data-ag-quad-reasoning-answer':'1'});return frame(25,35,750,350)
 }
 if(mode==='polygon'&&explore&&d.shapeView==='free-polygon'){
   const pts=freePolygonPoints(d),m=polygonProperties(pts),i=Math.max(0,Math.min(pts.length-1,Math.round(Number(d.polygonVertex)||0)));
   if(m&&d.triangulate!==false)for(const [j,tri] of m.triangles.entries())add('polygon',{points:tri.map(k=>pts[k].join(',')).join(' '),fill:REGION_COLOURS[j%REGION_COLOURS.length], 'fill-opacity':.16,stroke:'none','data-ag-polygon-triangle':j});
   polygon(pts);
   if(m){
     if(d.triangulate!==false)m.diagonals.forEach(([a,b])=>line(pts[a],pts[b],teal,1.8,{'stroke-dasharray':'5 4','data-ag-polygon-diagonal':a+':'+b}));
     if(d.showCorners!==false){const p=pts[i],a=labAngle(p,pts[(i+1)%m.n]),b=labAngle(p,pts[(i+m.n-1)%m.n]),start=m.winding>0?b:a;labelArc(...p,Math.min(34,m.lengths[i]*.24,m.lengths[(i+m.n-1)%m.n]*.24),start,m.angles[i],m.angles[i].toFixed(2)+'°')}
     if(d.showTurns){const p=pts[i],prev=pts[(i+m.n-1)%m.n],next=pts[(i+1)%m.n],a=labAngle(prev,p),b=labAngle(p,next),start=mod(b-a)<=180?a:b;line(p,polar(...p,55,a),orange,2,{'stroke-dasharray':'4 3','data-ag-polygon-turn-extension':'1'});arc(...p,27,start,Math.abs(m.turns[i]),{'stroke':orange,'data-ag-polygon-turn':'1'});text(400,374,'Turn at '+pointName(i)+' = '+(m.turns[i]<0?'−':'')+Math.abs(m.turns[i]).toFixed(2)+'°',17,{'data-ag-polygon-turn-value':'1'})}
     if(d.showProperties!==false){
       text(400,407,(m.regular?'Regular':m.convex?'Irregular convex':'Concave')+' · '+m.n+' sides',21,{'data-ag-polygon-classification':'1'});
       text(400,438,'Interior sum: '+(m.n-2)+' × 180° = '+Math.round(m.interiorSum)+'°',19,{'data-ag-polygon-sum':'1'});
       text(400,469,'Signed exterior turns total '+Math.round(m.turnSum)+'° · '+m.diagonalCount+' possible diagonals',17,{'data-ag-polygon-turn-sum':'1'});
     }
   }else text(400,425,'Not a simple polygon: separate crossed, repeated or flat vertices.',18,{'data-ag-polygon-invalid':'1'});
   if(!options.paper)pts.forEach((p,k)=>{add('circle',{cx:p[0],cy:p[1],r:22,fill:'transparent',stroke:'none','data-ag-poly-vertex':k,cursor:'grab','aria-label':'Move vertex '+pointName(k)});add('circle',{cx:p[0],cy:p[1],r:5,fill:'#fff',stroke:teal,'stroke-width':2,'pointer-events':'none'})});
   return frame(0,0,800,510)
 }
 if(mode==='polygon'&&explore&&d.shapeView==='free-quadrilateral'){
   const pts=freeQuadrilateralPoints(d),m=quadrilateralProperties(pts);polygon(pts);
   if(m){
     if(d.showCorners!==false)pts.forEach((p,i)=>{if(m.angles[i]<=180)corner(pts,i,m.angles[i].toFixed(2)+'°');else {const a=labAngle(p,pts[(i+1)%4]),b=labAngle(p,pts[(i+3)%4]),start=mod(b-a)>180?a:b;labelArc(...p,34,start,m.angles[i],m.angles[i].toFixed(2)+'°')}});
     if(d.showSides!==false){const groups=[];m.lengths.forEach((l,i)=>{const same=x=>Math.abs(x-l)<=Math.max(...m.lengths)*1e-9;if(m.lengths.filter(same).length<2)return;let k=groups.findIndex(same);if(k<0){k=groups.length;groups.push(l)}const a=pts[i],b=pts[(i+1)%4],dir=labAngle(a,b),mid=labAt(a,labSub(b,a),.5);for(let j=0;j<=k;j++){const c=polar(...mid,(j-k/2)*8,dir);line(polar(...c,8,dir+90),polar(...c,8,dir-90),teal,3,{'data-ag-quad-equal':i})}})}
     if(d.showParallel)m.parallelPairs.forEach(i=>{for(const j of [i,i+2]){const a=pts[j],b=pts[(j+1)%4],mid=labAt(a,labSub(b,a),.5),dir=labAngle(a,b);for(let k=0;k<=i;k++){const c=polar(...mid,18+k*10,dir);line(polar(...c,8,dir+145),c,orange,2,{'data-ag-quad-parallel':j});line(polar(...c,8,dir-145),c,orange,2)}}});
     if(d.showDiagonals){line(pts[0],pts[2],teal,2,{'stroke-dasharray':'6 5','data-ag-quad-diagonal':'AC'});line(pts[1],pts[3],orange,2,{'stroke-dasharray':'6 5','data-ag-quad-diagonal':'BD'});if(m.intersection)circle(m.intersection,3,teal);text(400,380,(m.diagonalEqual?'Equal':'Unequal')+' diagonals'+(m.diagonalBisect?' · bisect each other':'')+(m.diagonalPerpendicular?' · perpendicular':''),16,{'data-ag-quad-diagonal-summary':'1'})}
     if(d.showProperties!==false){text(400,414,m.kind+' · '+m.parallelPairs.length+' parallel pair'+(m.parallelPairs.length===1?'':'s')+' · '+m.right+' right angle'+(m.right===1?'':'s'),21,{'data-ag-quad-classification':'1'});text(400,446,'Interior angle sum = 360°',17,{'data-ag-quad-sum':'1'});text(400,477,'Also: '+m.families.filter(x=>x!==m.kind).join(' · '),16,{'data-ag-quad-family':'1'})}
   }else text(400,420,'Not a quadrilateral: avoid crossing sides or collinear vertices.',19,{'data-ag-quad-invalid':'1'});
   if(!options.paper)pts.forEach((p,i)=>{add('circle',{cx:p[0],cy:p[1],r:22,fill:'transparent',stroke:'none','data-ag-quad-vertex':i,cursor:'grab','aria-label':'Move vertex '+pointName(i)});add('circle',{cx:p[0],cy:p[1],r:6,fill:'#fff',stroke:teal,'stroke-width':2,'pointer-events':'none'})});return frame(0,0,800,520)
 }
 if(mode==='polygon'&&explore&&d.shapeView&&d.shapeView!=='regular'){
   const shape=d.shapeView,freeTriangle=shape==='free-triangle';let pts=freeTriangle?freeTrianglePoints(d):shapeGeometry(d);
   if(!freeTriangle){const ar=rot*D;pts=fit(pts.map(([x,y])=>[x*Math.cos(ar)-y*Math.sin(ar),x*Math.sin(ar)+y*Math.cos(ar)]))}
   const properties=triangleProperties(pts),centre=d.triangleCentre&&d.triangleCentre!=='none'?d.triangleCentre:null;
   polygon(pts);
   function freeHandles(){if(freeTriangle&&!options.paper)pts.forEach((p,i)=>{add('circle',{cx:p[0],cy:p[1],r:22,fill:'transparent',stroke:'none','data-ag-triangle-vertex':i,cursor:'grab','aria-label':'Move vertex '+pointName(i)});add('circle',{cx:p[0],cy:p[1],r:6,fill:'#fff',stroke:teal,'stroke-width':2,'pointer-events':'none'})})}
   if(freeTriangle&&!properties){text(400,410,'Not a triangle: vertices must be distinct and non-collinear.',19,{'data-ag-triangle-invalid':'1'});freeHandles();return frame(0,0,800,520)}
   if(centre&&properties){
     const model=triangleCentres(pts),euler=centre==='euler'?eulerLineModel(pts):null,rule=euler?.coincident?'O = G = H; no unique Euler line.':TRIANGLE_CENTRE_RULES[centre],positions=euler?[euler.O,euler.G,euler.H]:[model[centre]],far=freeTriangle&&Math.max(...positions.map(p=>labDist(p,[400,220])),centre==='circumcentre'?model.circumradius:0)>2400;
     if(far){text(400,410,'Centre is too far away to display at this scale.',19,{'data-ag-centre-offscreen':'1'});if(d.showProperties!==false)text(400,442,properties.sides+' · '+properties.kind,22,{'data-ag-triangle-classification':'1'});freeHandles();return frame(0,0,800,520)}
     const extent=triangleCentreGraphic(pts,centre,true);
     if(freeTriangle&&!options.paper){const outside=extent.some(([x,y])=>x<10||x>790||y<10||y>385);add('rect',{x:0,y:385,width:800,height:135,fill:'#fff','pointer-events':'none'});if(d.showProperties!==false)text(400,410,properties.sides+' · '+properties.kind,22,{'data-ag-triangle-classification':'1'});text(400,446,TRIANGLE_CENTRE_NAMES[centre],22,{'data-ag-centre-name':'1'});text(400,473,rule,17,{'data-ag-centre-rule':'1'});if(outside)text(400,502,'Part of the construction is outside this view.',16,{'data-ag-centre-offscreen':'1'});freeHandles();return frame(0,0,800,520)}
     return triangleCentreFrame(extent,centre,true,d.showProperties!==false?properties.sides+' · '+properties.kind:null,rule)
   }
   if(d.showCorners!==false)pts.forEach((p,i)=>{const u=pts[(i+1)%pts.length],v=pts[(i+pts.length-1)%pts.length],a=labAngle(p,u),b=labAngle(p,v),ang=Math.min(mod(a-b),mod(b-a));corner(pts,i,(freeTriangle?ang.toFixed(2):Math.round(ang))+'°')});
   if(d.showDiagonals&&pts.length===4){line(pts[0],pts[2],teal,3,{'stroke-dasharray':'6 5'});line(pts[1],pts[3],orange,3,{'stroke-dasharray':'6 5'});const eq=Math.abs(labDist(pts[0],pts[2])-labDist(pts[1],pts[3]))<.1;const bisect=['square','rectangle','rhombus','parallelogram'].includes(shape),u=labSub(pts[2],pts[0]),v=labSub(pts[3],pts[1]),perp=Math.abs(labDot(u,v))/(Math.hypot(...u)*Math.hypot(...v))<.001;const p=labAt(pts[0],u,labCross(labSub(pts[1],pts[0]),v)/labCross(u,v));if(perp){const a=polar(...p,13,labAngle(p,pts[0])),b=polar(...p,13,labAngle(p,pts[1]));path('M '+a.join(' ')+' L '+[a[0]+b[0]-p[0],a[1]+b[1]-p[1]].join(' ')+' L '+b.join(' '),{stroke:teal,'stroke-width':1.6})}text(400,378,(eq?'Equal':'Unequal')+' diagonals'+(bisect?' · bisect each other':'')+(perp?' · perpendicular':''),16)}
   if(d.showSides!==false){const lengths=pts.map((p,i)=>labDist(p,pts[(i+1)%pts.length]));const groups=[],equal=(a,b)=>Math.abs(a-b)<(freeTriangle?Math.max(...lengths)*1e-9:.05);lengths.forEach(l=>{if(!groups.some(v=>equal(v,l)))groups.push(l)});lengths.forEach((l,i)=>{if(lengths.filter(v=>equal(v,l)).length<2)return;const p=pts[i],q=pts[(i+1)%pts.length],a=Math.atan2(q[1]-p[1],q[0]-p[0]),m=[(p[0]+q[0])/2,(p[1]+q[1])/2],count=1+groups.findIndex(v=>equal(v,l));for(let k=0;k<count;k++){const t=(k-(count-1)/2)*8,x=m[0]+t*Math.cos(a),y=m[1]+t*Math.sin(a);line([x-8*Math.sin(a),y+8*Math.cos(a)],[x+8*Math.sin(a),y-8*Math.cos(a)],teal,3)}})}
   if(d.showParallel&&pts.length===4){const pairs=shape==='kite'?[]:shape==='trapezium'?[0]:[0,1];for(const i of pairs)for(const j of [i,i+2]){const p=pts[j],q=pts[(j+1)%4],a=labAngle(p,q),m=[(p[0]+q[0])/2,(p[1]+q[1])/2];for(let k=0;k<=i;k++){const c=polar(...m,(k+1)*17,a);line(polar(...c,8,a+145),c,orange,2);line(polar(...c,8,a-145),c,orange,2)}}}
   const notes={square:'Four equal sides · four right angles',rectangle:'Opposite sides equal · four right angles',rhombus:'Four equal sides · opposite angles equal',parallelogram:'Opposite sides and angles equal',trapezium:'One pair of parallel sides',kite:'Two pairs of adjacent equal sides','right-triangle':'One right angle · other angles sum to 90°',equilateral:'Three equal sides · three 60° angles',isosceles:'Two equal sides · equal base angles',scalene:'No equal sides · no equal angles'};
   if(d.showHeight&&pts.length===3){const a=pts[0],b=pts[1],c=pts[2],v=labSub(b,a),p=labAt(a,v,labDot(labSub(c,a),v)/labDot(v,v));line(c,p,orange,2,{'stroke-dasharray':'5 4'});if(labDist(c,p)>1)dimension(c,p,'h',{size:15,lines:pts.map((p,i)=>[p,pts[(i+1)%3]])});text(400,378,'Area = ½ × base × perpendicular height',17)}
   if(properties&&d.showMedians){for(let i=0;i<3;i++){line(pts[i],properties.midpoints[i],orange,2,{'stroke-dasharray':'6 4','data-ag-triangle-median':i});circle(properties.midpoints[i],3,orange)}circle(properties.centroid,5,teal);text(properties.centroid[0]+16,properties.centroid[1]-12,'G',17,{'data-ag-centroid':'1','paint-order':'stroke',stroke:'white','stroke-width':3})}
   if(properties){
     if(d.showProperties!==false){text(400,410,properties.sides+' · '+properties.kind,22,{'data-ag-triangle-classification':'1'});if(properties.alsoIsosceles)text(400,444,'Also isosceles: at least two equal sides',17,{'data-ag-triangle-family':'1'})}
     if(d.showMedians)text(400,properties.alsoIsosceles&&d.showProperties!==false?478:444,'Centroid G divides each median 2 : 1',17,{'data-ag-centroid-rule':'1'});
     if(freeTriangle){freeHandles();return frame(0,0,800,520)}
     return frame(55,0,690,d.showMedians?(properties.alsoIsosceles&&d.showProperties!==false?500:466):properties.alsoIsosceles&&d.showProperties!==false?466:440)
   }
   text(400,410,notes[shape]||'',18);return frame(75,0,650,440)
 }
 if(mode==='polygon'){
   if(type==='right-count'){const raw=d.shape==='Rectangle'?[[0,0],[260,0],[260,150],[0,150]]:d.shape==='Right-angled triangle'?[[0,0],[220,0],[0,150]]:d.shape==='Triangle with no right angle'?[[0,0],[240,0],[100,160]]:[[0,0],[220,0],[290,140],[70,140]],rad=(rot+25)*D,pts=fit(raw.map(([x,y])=>[x*Math.cos(rad)-y*Math.sin(rad),x*Math.sin(rad)+y*Math.cos(rad)]));polygon(pts);if(teacher&&d.shape==='Rectangle')pts.forEach((_,i)=>corner(pts,i,'90°'));if(teacher&&d.shape==='Right-angled triangle')corner(pts,0,'90°');return polygonFrame(pts)}
   if(type==='rectangle'||type==='quad-type'||type==='quadrilateral'){let points,shape=d.shape;const a=d.angles?.[0]??65;
     if(type==='rectangle'||shape==='Rectangle (not square)')points=[[205,105],[595,105],[595,325],[205,325]];
     else if(shape==='Square')points=[[265,85],[535,85],[535,355],[265,355]];
     else if(shape==='Rhombus (not square)')points=fit([[0,0],[200,0],polar(200,0,200,65),polar(0,0,200,65)]);
     else if(shape==='Trapezium')points=[[250,100],[540,100],[650,325],[150,325]];
     else points=fit([[0,0],[320,0],polar(320,0,180,a),polar(0,0,180,a)]);
     polygon(points);
     if(type==='rectangle'){points.forEach((p,i)=>corner(points,i,i===2&&!teacher?'x':i===2?'90°':null))}
     else if(type==='quadrilateral'){points.forEach((p,i)=>corner(points,i,i===3&&!teacher?'x':d.angles[i]+'°'))}
     else {const lengths=points.map((p,i)=>Math.hypot(points[(i+1)%4][0]-p[0],points[(i+1)%4][1]-p[1]));points.forEach((p,i)=>{const n=points[(i+1)%4],l=lengths[i],equal=lengths.filter(v=>Math.abs(v-l)<.05).length;if(equal>1){const x=(p[0]+n[0])/2,y=(p[1]+n[1])/2,ang=Math.atan2(n[1]-p[1],n[0]-p[0]);const marks=Math.abs(l-Math.max(...lengths))<.05?1:2;for(let k=0;k<marks;k++){const dx=(k-(marks-1)/2)*8*Math.cos(ang),dy=(k-(marks-1)/2)*8*Math.sin(ang);line([x+dx-8*Math.sin(ang),y+dy+8*Math.cos(ang)],[x+dx+8*Math.sin(ang),y+dy-8*Math.cos(ang)],teal,3)}}});if(shape==='Square'||shape==='Rectangle (not square)')points.forEach((p,i)=>corner(points,i,null))}
     return polygonFrame(points)
   }
   if(type==='triangle-centroid-ratio'){const pts=fit(trianglePoints(d.angles[0],d.angles[1])),p=triangleProperties(pts),a=pts[0],m=p.midpoints[0],g=p.centroid;polygon(pts,['A','B','C']);line(a,m,teal,3,{'data-ag-triangle-median':'0'});circle(m,4,ink);circle(g,4,teal);text(m[0]+16,m[1]+20,'D',18);text(g[0]+17,g[1]-12,'G',18);if(teacher){text(400,410,'AG : GD = 2 : 1',22,{'data-ag-centroid-rule':'1'});return frame(65,0,670,440)}return polygonFrame([...pts,m,g],90)}
   if(type==='triangle'||type==='triangle-type'||type==='triangle-angle-type'){const v=d.angles,ar=rot*D,raw=trianglePoints(v[0],v[1]),points=fit(type==='triangle-angle-type'?raw.map(([x,y])=>[x*Math.cos(ar)-y*Math.sin(ar),x*Math.sin(ar)+y*Math.cos(ar)]):raw);polygon(points);if(type==='triangle'||teacher)points.forEach((p,i)=>corner(points,i,type==='triangle'&&i===2&&!teacher?'x':v[i]+'°'));if(type==='triangle-angle-type'&&teacher){text(400,410,triangleProperties(points).kind,22,{'data-ag-triangle-classification':'1'});return frame(65,0,670,440)}return polygonFrame(points)}
   const n=d.n||5,regular=d.regular!==false,pts=Array.from({length:n},(_,i)=>exactPolar(400,218,!regular&&i===1?155*(1-(1-Math.cos(360/n*D))*.65):155,90+rot+i*360/n));polygon(pts);
   if(type==='polygon-sum'||explore&&d.triangulate!==false){for(let i=2;i<n-1;i++)line(pts[0],pts[i],'#89aaa1',2,{'stroke-dasharray':'5 5'});if(teacher||explore)text(400,410,(n-2)+' × 180° = '+180*(n-2)+'°',24)}
   if(explore&&d.showCorners!==false&&regular)corner(pts,0,round(polyInterior(n))+'°');
   if(type==='regular')corner(pts,0,teacher?polyInterior(n)+'°':'x');
   if(type==='exterior'){const p=pts[0],prev=pts.at(-1),next=pts[1],start=mod(Math.atan2(prev[1]-p[1],p[0]-prev[0])/D),end=mod(Math.atan2(p[1]-next[1],next[0]-p[0])/D),delta=mod(end-start);ray(...p,68,end);labelArc(...p,34,delta<=180?start:end,Math.min(delta,360-delta),teacher?polyExterior(n)+'°':'x')}
   if(type==='regularity'&&teacher)text(400,410,regular?'Regular: equal sides and angles':'Irregular: sides or angles differ',27);
   return type==='regularity'&&teacher||type==='polygon-sum'||explore?frame(125,22,550,418):polygonFrame(pts,90)
 }
 return svg
}
function geometry(t){return {...t,mode:t.geometryMode||FAMILIES.find(f=>f[0]===t.type)?.[2]||t.mode}}
function methodPublication(data,teacher=false){
 const m=data.constructionMethod,mode=data.publicationMode,ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),W=760,pad=24;
 let y=28;const add=(tag,attrs,text,parent=svg)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text!=null)e.textContent=text;parent.append(e);return e};
 const para=(str,size=18,weight=400,x=pad,width=W-2*pad)=>{for(const line of G.exportTools.wrapPaperText(String(str),width,size,weight)){add('text',{x,y,'font-size':size,'font-weight':weight,fill:'#253b40','font-family':'Arial, sans-serif'},line);y+=size*1.35}y+=5};
 const picture=(step,maxH=220)=>{const g=constructionMethodGraphic(m,step),[,,w,h]=m.graphics.viewBox,scale=Math.min((W-2*pad)/w,maxH/h);g.removeAttribute('style');g.setAttribute('x',(W-w*scale)/2);g.setAttribute('y',y);g.setAttribute('width',w*scale);g.setAttribute('height',h*scale);svg.append(g);y+=h*scale+14};
 svg.setAttribute('data-ag-method-publication',mode);
 para(m.title,24,700);para('Given: '+m.given.join('; '));para(m.objective||m.title,18,600);para('Tools: '+m.instruments.join(', '),16);
 if(mode==='exercise'){
   if(!teacher){para('Use the starting diagram as a reference. Construct your answer in the empty working space. Redraw to the specified dimensions where measurements are given; the reference is not necessarily actual size.',16);picture(-1,120);add('rect',{x:pad,y,width:W-2*pad,height:460,rx:3,fill:'white',stroke:'#a9b9b5','stroke-width':1,'data-ag-method-working':'1'});y+=478}
   else{picture(m.steps.length-1);para('Check: '+m.checks.join('; '),17);para(m.why,16)}
 }else{
   const illustrated=mode==='illustrated';if(illustrated)picture(-1,130);
   for(let i=0;i<m.steps.length;i++){para((i+1)+'. '+m.steps[i],17);if(illustrated)picture(i,135)}
   para('Check: '+m.checks.join('; '),16);para('Why it works: '+m.why,16);
 }
 para(m.conditions,15);svg.setAttribute('viewBox','0 0 '+W+' '+Math.ceil(y+12));return svg
}
// Small purpose-specific diagrams keep the main explorer uncluttered.
function shapeReferenceGraphic(m,kind){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),W=320,H=200,pts=m.points,n=pts.length,p=m.polygon;
 const add=(tag,attrs,value)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(value!=null)el.textContent=value;svg.append(el);return el};
 const line=(u,v,attrs={})=>add('line',{x1:u[0],y1:u[1],x2:v[0],y2:v[1],stroke:'#277b70','stroke-width':2,...attrs});
 const label=(q,value,attrs={})=>add('text',{x:q[0],y:q[1],fill:'#263e43','font-family':'Arial,sans-serif','font-size':14,'text-anchor':'middle','paint-order':'stroke',stroke:'#fff','stroke-width':3,...attrs},value);
 const poly=(q,attrs={})=>add('polygon',{points:q.map(v=>v.join(',')).join(' '),fill:'#eef6f2',stroke:'#35565a','stroke-width':1.8,...attrs});
 const base=labSub(pts[1],pts[0]),len=Math.hypot(...base),foot=q=>labAt(pts[0],base,labDot(labSub(q,pts[0]),base)/(len*len));
 let altitude=null,parallelSide=null;
 if(kind==='area'&&(n===3||m.quad?.parallelPairs.length)){
   let i=0;if(n===4&&!m.quad.parallelPairs.includes(0))i=1;
   const start=pts[i],v=labSub(pts[(i+1)%n],start),q=pts[(i+2)%n],f=labAt(start,v,labDot(labSub(q,start),v)/labDot(v,v));
   altitude={a:start,b:pts[(i+1)%n],q,f};if(n===4)parallelSide=[pts[(i+2)%n],pts[(i+3)%n]];
 }
 const ext=altitude?[...pts,altitude.f]:pts,xs=ext.map(q=>q[0]),ys=ext.map(q=>q[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,s=Math.min(205/Math.max(1,Math.max(...xs)-Math.min(...xs)),122/Math.max(1,Math.max(...ys)-Math.min(...ys))),map=q=>[160+(q[0]-cx)*s,88+(q[1]-cy)*s],v=pts.map(map);
 svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.setAttribute('role','img');svg.setAttribute('aria-label',kind==='symmetry'?'Reflection axes of the current shape':kind==='diagonals'?'Diagonals and triangulation of the current shape':'Area measurements of the current shape');svg.dataset.agReferenceGraphic=kind;
 add('rect',{width:W,height:H,fill:'#fff'});poly(v);
 const mid=(a,b)=>labAt(a,labSub(b,a),.5),fmt=x=>Number(x.toFixed(2)).toString();
 if(kind==='symmetry'){
   const centre=map(m.symmetry.centre);
   for(const axis of m.symmetry.axes){const limits=v.map(q=>labDot(labSub(q,centre),axis)),lo=Math.min(...limits)-13,hi=Math.max(...limits)+13;line(labAt(centre,axis,lo),labAt(centre,axis,hi),{stroke:'#b56d2c','stroke-dasharray':'5 4','data-ag-reflection-axis':'1'})}
   add('circle',{cx:centre[0],cy:centre[1],r:3,fill:'#277b70','data-ag-rotation-centre':'1'});
   label([160,174],m.symmetry.reflection+' reflection '+(m.symmetry.reflection===1?'axis':'axes'));
   label([160,192],m.symmetry.rotation>1?'Smallest rotation: '+fmt(360/m.symmetry.rotation)+'°':'Only a full 360° rotation matches');
 }else if(kind==='diagonals'){
   if(n===4){line(v[0],v[2],{'data-ag-reference-diagonal':'AC','stroke-dasharray':'5 3'});line(v[1],v[3],{stroke:'#b56d2c','data-ag-reference-diagonal':'BD','stroke-dasharray':'5 3'});if(m.quad?.intersection){const q=map(m.quad.intersection);add('circle',{cx:q[0],cy:q[1],r:3,fill:'#263e43'})}}
   else if(n>3){for(const [j,tri] of p.triangles.entries())poly(tri.map(i=>v[i]),{fill:REGION_COLOURS[j%REGION_COLOURS.length],'fill-opacity':.22,stroke:'none','data-ag-reference-triangle':j});for(const [i,j] of p.diagonals)line(v[i],v[j],{'stroke-dasharray':'5 3','data-ag-reference-diagonal':i+':'+j});poly(v,{fill:'none'})}
   v.forEach((q,i)=>{const offset=labSub(q,[160,88]),k=Math.max(1,Math.hypot(...offset));label(labAt(q,offset,13/k),pointName(i),{'dominant-baseline':'central','font-size':12})});
   label([160,174],n>4?p.diagonals.length+' internal cuts shown · '+p.diagonalCount+' total':p.diagonalCount+' possible diagonal'+(p.diagonalCount===1?'':'s'));
   label([160,192],n===4?'Both vertex-to-vertex diagonals shown':(n-2)+' triangle'+(n===3?'':'s')+' in a triangulation');
 }else{
   if(altitude){
     const {a,b,q,f}=altitude,A=map(a),B=map(b),Q=map(q),F=map(f),u=labSub(B,A),h=labSub(Q,F),ul=Math.hypot(...u),hl=Math.hypot(...h),u1=u.map(x=>x/ul),h1=h.map(x=>x/hl);
     line(A,B,{stroke:'#277b70','stroke-width':4,'data-ag-reference-base':'1'});
     if(labDot(labSub(F,A),u)<0)line(F,A,{'stroke-dasharray':'3 4'});else if(labDot(labSub(F,B),u)>0)line(B,F,{'stroke-dasharray':'3 4'});
     line(Q,F,{stroke:'#b56d2c','stroke-dasharray':'5 3','data-ag-reference-height':'1'});
     const corner=[labAt(F,u1,8),labAt(labAt(F,u1,8),h1,8),labAt(F,h1,8)];
     add('polyline',{points:corner.map(v=>v.join(',')).join(' '),fill:'none',stroke:'#b56d2c','stroke-width':1.5,'data-ag-reference-right-angle':'1'});
     if(parallelSide)line(...parallelSide.map(map),{stroke:'#277b70','stroke-width':3,'data-ag-reference-parallel-base':'1'});
     label([160,174],'Base = '+fmt(labDist(a,b)/LAB_UNIT)+' cm; height = '+fmt(labDist(q,f)/LAB_UNIT)+' cm');
   }else if(m.quad?.kind==='Kite'){
     line(v[0],v[2],{'data-ag-reference-area-diagonal':'AC'});line(v[1],v[3],{stroke:'#b56d2c','data-ag-reference-area-diagonal':'BD'});
     label([160,174],'A = ½ × diagonal × diagonal');
   }else{
     for(const [j,tri] of p.triangles.entries())poly(tri.map(i=>v[i]),{fill:REGION_COLOURS[j%REGION_COLOURS.length],'fill-opacity':.28,stroke:'#fff','stroke-width':1,'data-ag-reference-area-triangle':j});
     poly(v,{fill:'none'});label([160,174],'Area = sum of the triangle areas');
   }
   label([160,192],'Area = '+fmt(m.area)+' cm²');
 }
 return svg;
}
function areaComparisonGraphic(m,reveal=true,challenge=false,interactive=false){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),W=640,H=310;
 const add=(tag,attrs,value)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(value!=null)el.textContent=value;svg.append(el);return el};
 const label=(x,y,value,attrs={})=>add('text',{x,y,'font-family':'Arial,sans-serif','font-size':17,'text-anchor':'middle',fill:'#263e43',...attrs},value);
 const fmt=v=>Math.abs(v-Number(v.toFixed(2)))>1e-9?'≈ '+Number(v.toFixed(2)):String(Number(v.toFixed(2)));
 const bounds=m.shapes.map(s=>{const xs=s.points.map(p=>p[0]);return [Math.min(...xs),Math.max(...xs),s.height]}),scale=interactive?(m.kind==='base-height'?23:m.kind==='perimeter'?15:12):Math.min(230/Math.max(...bounds.map(v=>v[1]-v[0])),142/Math.max(...bounds.map(v=>v[2])));
 svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.setAttribute('role','img');svg.setAttribute('aria-label',m.caption+'. Two shapes shown at the same scale.');svg.dataset.agAreaComparisonGraphic=m.kind;
 add('rect',{width:W,height:H,fill:'#fff'});
 label(320,24,interactive?(m.kind==='base-height'?'Both: base 6 cm · perpendicular height 4 cm':m.kind==='perimeter'?'Both: perimeter 20 cm':'Both: area 24 cm²'):m.caption,{'font-size':19,'font-weight':700});
 if(interactive&&m.kind==='base-height')add('line',{x1:35,y1:194-4*scale,x2:610,y2:194-4*scale,stroke:'#94a3b8','stroke-width':1.4,'stroke-dasharray':'5 4','data-ag-comparison-track':'1'});
 m.shapes.forEach((s,i)=>{
   const cx=160+i*320,[lo,hi]=bounds[i],origin=interactive?(m.kind==='base-height'?cx-3*scale:cx-72):cx-(lo+hi)/2*scale,map=p=>[origin+p[0]*scale,194-p[1]*scale],v=s.points.map(map),hidden=challenge&&!reveal&&i===1&&m.kind!=='base-height';
   label(cx,48,interactive?(i?'B · change this shape':'A · fixed reference'):(i?'Shape B':'Shape A'),{'font-weight':700});
   add('polygon',{points:v.map(p=>p.join(',')).join(' '),fill:i?'#f3d9a8':'#d9eee6',stroke:i?'#a56a2e':'#277b70','stroke-width':2.2,'data-ag-area-comparison-shape':i});
   if(m.kind==='base-height'){
     const apex=map([s.apex,s.height]),foot=map([s.apex,0]),end=map([s.width,0]),origin=map([0,0]);
     if(s.apex<0||s.apex>s.width){const near=s.apex<0?origin:end;add('line',{x1:near[0],y1:near[1],x2:foot[0],y2:foot[1],stroke:'#64748b','stroke-dasharray':'5 3','stroke-width':1.5})}
     add('line',{x1:apex[0],y1:apex[1],x2:foot[0],y2:foot[1],stroke:'#52676e','stroke-dasharray':'5 3','stroke-width':1.5,'data-ag-area-comparison-height':i});
     const q=map([s.apex+(s.apex>s.width/2?-1:1)*Math.min(.3,s.width/8),Math.min(.3,s.height/8)]);add('path',{d:'M '+foot[0]+' '+q[1]+' L '+q.join(' ')+' L '+q[0]+' '+foot[1],fill:'none',stroke:'#52676e','stroke-width':1.4});
   }
   if(interactive&&i===1){const p=map(m.kind==='base-height'?[s.apex,s.height]:[s.width,0]);add('circle',{cx:p[0],cy:p[1],r:12,fill:'#fff',stroke:'#a56a2e','stroke-width':2.5,'data-ag-comparison-handle':'1','data-ag-comparison-origin':origin,'data-ag-comparison-scale':scale});add('path',{d:'M '+(p[0]-7)+' '+p[1]+' H '+(p[0]+7)+' M '+(p[0]-7)+' '+p[1]+' l 4 -4 m -4 4 l 4 4 M '+(p[0]+7)+' '+p[1]+' l -4 -4 m 4 4 l -4 4',fill:'none',stroke:'#a56a2e','stroke-width':1.8,'pointer-events':'none'});}
   label(cx,220,(m.kind==='base-height'?'Base ':'Width ')+fmt(s.width)+' cm',{'data-ag-area-comparison-width':i});
   label(cx,243,(m.kind==='base-height'?'Perpendicular height ':'Height ')+(hidden?'?':fmt(s.height)+' cm'),{'data-ag-area-comparison-height-label':i});
   if(reveal||challenge&&i===0){
     label(cx,268,'Area = '+fmt(s.area)+' cm²',{'font-weight':700,'data-ag-area-comparison-area':i});label(cx,291,'Perimeter = '+fmt(s.perimeter)+' cm',{'font-weight':700,'data-ag-area-comparison-perimeter':i});
   }else{label(cx,268,'Area = ?',{'data-ag-area-comparison-area':i});label(cx,291,'Perimeter = ?',{'data-ag-area-comparison-perimeter':i})}
 });
 return svg;
}
function geometryReasoningGraphic(m,index=null,reveal=false){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),examples=index===null?m.examples:[m.examples[index]],W=640,H=examples.length*218+12;
 const add=(tag,attrs,value)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(value!=null)el.textContent=value;svg.append(el);return el};
 const label=(x,y,value,attrs={})=>add('text',{x,y,'font-family':'Arial,sans-serif','font-size':16,'text-anchor':'middle',fill:'#263e43',...attrs},value);
 svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.setAttribute('role','img');svg.setAttribute('aria-label','Geometric examples for: '+m.prompt);svg.dataset.agReasoningGraphic=m.id;
 add('rect',{width:W,height:H,fill:'#fff'});
 examples.forEach((ex,i)=>{
   const y=i*218,boxes=ex.points.map(pts=>{const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]}),scale=Math.min(...boxes.map(([x,y,r,b])=>Math.min(200/Math.max(1,r-x),124/Math.max(1,b-y))));
   label(320,y+21,ex.name,{'font-weight':700});
   ex.points.forEach((pts,j)=>{
     const [x0,y0,x1,y1]=boxes[j],cx=ex.points.length===1?320:160+j*320,v=pts.map(p=>[cx+(p[0]-(x0+x1)/2)*scale,y+97-(p[1]-(y0+y1)/2)*scale]);
     add('polygon',{points:v.map(p=>p.join(',')).join(' '),fill:j?'#f3d9a8':'#d9eee6',stroke:j?'#a56a2e':'#277b70','stroke-width':2,'data-ag-reasoning-shape':i+':'+j});
     if(ex.diagonals)for(const [a,b] of [[0,2],[1,3]])add('line',{x1:v[a][0],y1:v[a][1],x2:v[b][0],y2:v[b][1],stroke:'#52676e','stroke-width':1.6,'stroke-dasharray':'5 3'});
   });
   const lines=G.exportTools.wrapPaperText(ex.evidence,600,15,400);if(reveal)lines.forEach((line,j)=>label(320,y+168+j*16,line,{'font-size':15,'data-ag-reasoning-evidence':i}));
   label(320,y+207,reveal?(ex.truth?'Statement holds here':'Counterexample — statement fails here'):'Does the statement hold for this example?',{'font-size':16,'font-weight':700,'data-ag-reasoning-witness':reveal?String(ex.truth):'hidden'});
 });
 return svg;
}
function mountGeometryReasoning(container,demo){
 const section=document.createElement('section');section.className='gd-ag-area-proof';section.dataset.agGeometryReasoning='1';
 const rows=[...GEOMETRY_REASONING,...QUAD_REASONING];section.innerHTML='<h4>Always, sometimes or never?</h4><label>Statement <select class="gd-select" data-ag-reasoning-select>'+rows.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.prompt)+'</option>').join('')+'</select></label><p><strong data-ag-reasoning-prompt></strong></p><div class="gd-row" data-ag-reasoning-predictions>'+['Always','Sometimes','Never'].map(v=>'<button type="button" class="gd-btn" data-ag-reasoning-predict="'+v+'">'+v+'</button>').join('')+'</div><div data-ag-reasoning-picture></div><div class="gd-row"><button type="button" class="gd-btn" data-ag-reasoning-prev>Previous example</button><strong data-ag-reasoning-count></strong><button type="button" class="gd-btn" data-ag-reasoning-next>Next example</button><button type="button" class="gd-btn" data-ag-reasoning-test>Check example</button></div><p data-ag-reasoning-feedback aria-live="polite"></p><div class="gd-row"><button type="button" class="gd-btn" data-ag-reasoning-reveal>Reveal reasoning</button><button type="button" class="gd-btn" data-ag-reasoning-reset>Reset</button></div><p data-ag-reasoning-result aria-live="polite"></p>';
 const q=s=>section.querySelector(s),select=q('[data-ag-reasoning-select]');let m=geometryReasoning(demo.reasoningId),index=Math.max(0,Math.min(m.examples.length-1,Math.floor(Number(demo.reasoningExample)||0))),checked=demo.reasoningChecked===true,reveal=demo.reasoningReveal===true,prediction=['Always','Sometimes','Never'].includes(demo.reasoningPrediction)?demo.reasoningPrediction:'';
 const show=()=>{Object.assign(demo,{reasoningId:m.id,reasoningExample:index,reasoningChecked:checked,reasoningReveal:reveal,reasoningPrediction:prediction});select.value=m.id;q('[data-ag-reasoning-prompt]').textContent=m.prompt;q('[data-ag-reasoning-picture]').replaceChildren(geometryReasoningGraphic(m,index,checked||reveal));q('[data-ag-reasoning-count]').textContent=(index+1)+' / '+m.examples.length;q('[data-ag-reasoning-prev]').disabled=index===0;q('[data-ag-reasoning-next]').disabled=index===m.examples.length-1;q('[data-ag-reasoning-test]').disabled=checked||reveal;q('[data-ag-reasoning-feedback]').textContent=checked||reveal?(m.examples[index].truth?'This example shows possibility. It does not prove an Always claim.':'One counterexample is enough to disprove an Always claim.'):'Inspect the shape, then check this example.';q('[data-ag-reasoning-result]').textContent=reveal?m.answer+'. '+m.note+(prediction?' Your prediction: '+prediction+'.':''):'Use the general mathematical reason, not just a collection of examples.';q('[data-ag-reasoning-reveal]').textContent=reveal?'Hide reasoning':'Reveal reasoning';section.querySelectorAll('[data-ag-reasoning-predict]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.agReasoningPredict===prediction));b.classList.toggle('gd-btn--primary',b.dataset.agReasoningPredict===prediction)})};
 const reset=()=>{index=0;checked=false;reveal=false;prediction='';show()};select.onchange=()=>{m=geometryReasoning(select.value);reset()};section.querySelectorAll('[data-ag-reasoning-predict]').forEach(b=>b.onclick=()=>{prediction=b.dataset.agReasoningPredict;show()});q('[data-ag-reasoning-prev]').onclick=()=>{index=Math.max(0,index-1);checked=false;show()};q('[data-ag-reasoning-next]').onclick=()=>{index=Math.min(m.examples.length-1,index+1);checked=false;show()};q('[data-ag-reasoning-test]').onclick=()=>{checked=true;show()};q('[data-ag-reasoning-reveal]').onclick=()=>{reveal=!reveal;show()};q('[data-ag-reasoning-reset]').onclick=reset;container.appendChild(section);show();
}
function mountAreaComparison(container,demo){
 const section=document.createElement('section');section.className='gd-ag-area-proof';section.dataset.agAreaComparison='1';
 section.innerHTML='<h4>Compare area and perimeter</h4><label>What stays the same? <select class="gd-select" data-ag-area-comparison-kind><option value="base-height">Same base and height</option><option value="perimeter">Same perimeter</option><option value="area">Same area</option></select></label><p data-ag-area-comparison-instruction></p><div data-ag-area-comparison-picture></div><div class="gd-row"><button type="button" class="gd-btn" data-ag-area-comparison-minus aria-label="Move B left or make narrower">−</button><label data-ag-area-comparison-slider-label for="ag-area-comparison-value"></label><input id="ag-area-comparison-value" type="number" step="0.1" data-ag-area-comparison-value><span>cm</span><button type="button" class="gd-btn" data-ag-area-comparison-plus aria-label="Move B right or make wider">+</button></div><p data-ag-area-comparison-note aria-live="polite"></p><div class="gd-row"><button type="button" class="gd-btn" data-ag-area-comparison-reveal>Hide measurements</button><button type="button" class="gd-btn" data-ag-area-comparison-reset>Reset</button></div>';
 const q=s=>section.querySelector(s),select=q('[data-ag-area-comparison-kind]'),field=q('[data-ag-area-comparison-value]'),picture=q('[data-ag-area-comparison-picture]');let kind=demo.areaComparisonKind||'base-height',value=demo.areaComparisonValue,reveal=demo.areaComparisonReveal!==false,drag=null;
 const limits=()=>{const m=areaComparison(kind,value);return [kind==='area'?2:m.min,m.max]};
 const show=()=>{let m=areaComparison(kind,value);if(kind==='area'&&m.value<2)m=areaComparison(kind,2);kind=m.kind;value=m.value;Object.assign(demo,{areaComparisonKind:kind,areaComparisonValue:value,areaComparisonReveal:reveal});select.value=kind;const [min,max]=limits();field.min=min;field.max=max;field.value=Number(value.toFixed(2));q('[data-ag-area-comparison-slider-label]').textContent=kind==='base-height'?'B: apex offset from left base corner':'B: width';q('[data-ag-area-comparison-instruction]').textContent=kind==='base-height'?'Drag the orange handle at the top of triangle B left or right along the dashed horizontal line. The base stays fixed. Watch what happens to its area and perimeter.':kind==='perimeter'?'Drag the orange handle on rectangle B to change its width. Its height adjusts to keep the perimeter at 20 cm.':'Drag the orange handle on rectangle B to change its width. Its height adjusts to keep the area at 24 cm².';picture.replaceChildren(areaComparisonGraphic(m,reveal,false,true));q('[data-ag-area-comparison-note]').textContent=reveal?m.explanation:'Predict which measurements will change, then reveal.';q('[data-ag-area-comparison-reveal]').textContent=reveal?'Hide measurements for prediction':'Reveal measurements'};
 const change=v=>{if(!Number.isFinite(v))return;const [min,max]=limits();value=Math.max(min,Math.min(max,v));show()};
 picture.addEventListener('pointerdown',e=>{const h=e.target.closest('[data-ag-comparison-handle]'),svg=picture.querySelector('svg'),matrix=svg?.getScreenCTM();if(!h||!matrix||e.button!==0)return;drag={id:e.pointerId,inverse:matrix.inverse(),origin:Number(h.dataset.agComparisonOrigin),scale:Number(h.dataset.agComparisonScale)};e.preventDefault();try{picture.setPointerCapture(e.pointerId)}catch(_){}});
 picture.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;e.preventDefault();const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(drag.inverse);change(Math.round((p.x-drag.origin)/drag.scale*100)/100)});
 const endDrag=e=>{if(drag?.id!==e.pointerId)return;drag=null;try{if(picture.hasPointerCapture(e.pointerId))picture.releasePointerCapture(e.pointerId)}catch(_){}};
 for(const event of ['pointerup','pointercancel','lostpointercapture'])picture.addEventListener(event,endDrag);
 select.onchange=()=>{kind=select.value;value=undefined;show()};field.onchange=()=>change(Number(field.value));field.oninput=()=>{if(field.value!==''&&Number(field.value)>=Number(field.min)&&Number(field.value)<=Number(field.max))change(Number(field.value))};q('[data-ag-area-comparison-minus]').onclick=()=>change(value-1);q('[data-ag-area-comparison-plus]').onclick=()=>change(value+1);q('[data-ag-area-comparison-reveal]').onclick=()=>{reveal=!reveal;show()};q('[data-ag-area-comparison-reset]').onclick=()=>{value=undefined;reveal=true;show()};container.appendChild(section);show();
}

function pythagorasGraphic(p,index){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),W=500,H=265,scale=190/p.L;
 const add=(tag,attrs,value)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(value!=null)el.textContent=value;svg.append(el);return el};
 const label=(x,y,v,attrs={})=>add('text',{x,y,'font-family':'Arial,sans-serif','font-size':15,'text-anchor':'middle',fill:'#27494c',...attrs},v);
 const colors=['#d9eee6','#c7e2ec','#f3d9a8','#e7dcf1'];
 const layout=(x,y,which)=>{
   const map=q=>[x+q[0]*scale,y+q[1]*scale],poly=(pts,attrs)=>add('polygon',{points:pts.map(q=>map(q).join(',')).join(' '),...attrs});
   add('rect',{x,y,width:190,height:190,fill:'#fff',stroke:'#27494c','stroke-width':2,'data-ag-pythagoras-outer':which});
   (which==='c'?p.around:p.together).forEach((tri,i)=>poly(tri,{fill:colors[i],stroke:'#41636a','stroke-width':1.5,'data-ag-pythagoras-piece':i}));
   const regions=which==='c'?[p.centre]:p.small;
   if(index>0)regions.forEach((region,i)=>{poly(region,{fill:'#fff5ce',stroke:'#a56a2e','stroke-width':1.5,'data-ag-pythagoras-square':which==='c'?'c':i?'b':'a'});const q=map([0,1].map(k=>region.reduce((s,v)=>s+v[k],0)/4));label(q[0],q[1]+5,which==='c'?'c²':i?'b²':'a²',{'font-weight':700,'font-size':Math.min(17,Math.max(9,(which==='c'?p.c:i?p.b:p.a)*scale*.22))})});
   label(x+95,y-9,'a + b',{'font-size':13});label(x+95,y+210,which==='c'?'Four triangles around c²':'Same four triangles around a² + b²',{'font-size':12});
   if(index===0){label(x+p.a*scale/2,y+14,'a',{'font-size':13});label(x+13,y+p.b*scale/2,'b',{'font-size':13});label(x+p.a*scale/2+12,y+p.b*scale/2+12,'c',{'font-size':13})}
 };
 svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.setAttribute('role','img');svg.setAttribute('aria-label',p.steps[index].note);svg.dataset.agPythagorasGraphic=String(index);
 add('rect',{width:W,height:H,fill:'#fff'});
 if(index===3){layout(34,24,'c');layout(276,24,'ab');label(250,128,'=',{'font-size':23,'font-weight':700})}
 else layout(155,24,index===2?'ab':'c');
 label(250,257,index===3?'a² + b² = c²':p.steps[index].title,{'font-size':17,'font-weight':700,'data-ag-pythagoras-equation':'1'});return svg;
}
function mountPythagorasProof(container,proof,demo){
 let index=Math.max(0,Math.min(3,Math.floor(Number(demo.pythagorasProofStep)||0)));
 const section=document.createElement('section');section.className='gd-ag-area-proof';section.dataset.agPythagorasProof='1';
 section.innerHTML='<h4>Why Pythagoras works</h4><div data-ag-pythagoras-picture></div><p data-ag-pythagoras-note aria-live="polite"></p><div class="gd-row"><button type="button" class="gd-btn" data-ag-pythagoras-back>Previous</button><strong data-ag-pythagoras-count></strong><button type="button" class="gd-btn" data-ag-pythagoras-next>Next step</button><button type="button" class="gd-btn" data-ag-pythagoras-reset>Restart</button></div>';
 const q=s=>section.querySelector(s),show=()=>{demo.pythagorasProofStep=index;q('[data-ag-pythagoras-picture]').replaceChildren(pythagorasGraphic(proof,index));q('[data-ag-pythagoras-note]').textContent=proof.steps[index].note;q('[data-ag-pythagoras-count]').textContent=(index+1)+' / 4';q('[data-ag-pythagoras-back]').disabled=index===0;q('[data-ag-pythagoras-next]').disabled=index===3};
 q('[data-ag-pythagoras-back]').onclick=()=>{index=Math.max(0,index-1);show()};q('[data-ag-pythagoras-next]').onclick=()=>{index=Math.min(3,index+1);show()};q('[data-ag-pythagoras-reset]').onclick=()=>{index=0;show()};container.appendChild(section);show();
}
function areaProofGraphic(proof,index){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),step=proof.steps[index],W=480,H=230;
 const all=proof.steps.flatMap(s=>s.pieces.flat()),xs=all.map(q=>q[0]),ys=all.map(q=>q[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.min(410/(maxX-minX),150/(maxY-minY)),map=q=>[240+(q[0]-(minX+maxX)/2)*scale,101-(q[1]-(minY+maxY)/2)*scale];
 const add=(tag,attrs,value)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(value!=null)el.textContent=value;svg.append(el);return el};
 const poly=(pts,attrs)=>add('polygon',{points:pts.map(q=>map(q).join(',')).join(' '),...attrs});
 svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.dataset.agAreaProofGraphic=String(index);svg.setAttribute('role','img');svg.setAttribute('aria-label',step.note);
 add('rect',{width:W,height:H,fill:'#fff'});
 step.pieces.forEach((piece,i)=>poly(piece,{fill:i?'#f3d9a8':'#d9eee6',stroke:i?'#a56a2e':'#277b70','stroke-width':2,'data-ag-proof-piece':i}));
 if(step.outline)poly(step.outline,{fill:'none',stroke:'#27494c','stroke-width':2,'stroke-dasharray':'5 3','data-ag-proof-outline':'1'});
 const a=map([0,0]),b=map([proof.base,0]);if(index===0){add('line',{x1:a[0],y1:a[1]+9,x2:b[0],y2:b[1]+9,stroke:'#277b70','stroke-width':2});add('text',{x:(a[0]+b[0])/2,y:a[1]+24,'text-anchor':'middle',fill:'#27494c','font-size':13},'base');const h=map([0,proof.height]);add('line',{x1:a[0]-10,y1:a[1],x2:h[0]-10,y2:h[1],stroke:'#a56a2e','stroke-dasharray':'4 3','stroke-width':2});add('text',{x:a[0]-15,y:(a[1]+h[1])/2,'text-anchor':'end',fill:'#a56a2e','font-size':13},'h')}
 add('text',{x:240,y:217,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':16,'font-weight':700,fill:'#27494c'},index===2?'Same area per copy: '+Number((proof.originalArea/(LAB_UNIT*LAB_UNIT)).toFixed(2))+' cm²':'Step '+(index+1)+' of 3');
 return svg;
}
function mountAreaProof(container,proof,demo){
 let index=Math.max(0,Math.min(2,Math.round(Number(demo.areaProofStep)||0)));
 const section=document.createElement('section');section.className='gd-ag-area-proof';section.dataset.agAreaProof='1';
 section.innerHTML='<h4>Why the area formula works</h4><div data-ag-proof-picture></div><p data-ag-proof-note aria-live="polite"></p><div class="gd-row"><button type="button" class="gd-btn" data-ag-proof-back>Previous</button><strong data-ag-proof-count></strong><button type="button" class="gd-btn" data-ag-proof-next>Next step</button><button type="button" class="gd-btn" data-ag-proof-reset>Restart</button></div>';
 const show=()=>{demo.areaProofStep=index;section.querySelector('[data-ag-proof-picture]').replaceChildren(areaProofGraphic(proof,index));section.querySelector('[data-ag-proof-note]').textContent=proof.steps[index].note;section.querySelector('[data-ag-proof-count]').textContent=(index+1)+' / 3';section.querySelector('[data-ag-proof-back]').disabled=index===0;section.querySelector('[data-ag-proof-next]').disabled=index===2};
 section.querySelector('[data-ag-proof-back]').onclick=()=>{index=Math.max(0,index-1);show()};section.querySelector('[data-ag-proof-next]').onclick=()=>{index=Math.min(2,index+1);show()};section.querySelector('[data-ag-proof-reset]').onclick=()=>{index=0;show()};container.appendChild(section);show();
}
function rotationReferenceGraphic(m,degrees){
 const model=rotationInvestigation(m,degrees),ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),W=420,H=280,centre=model.centre,r=Math.max(...m.points.map(p=>labDist(p,centre))),s=103/r,map=p=>[210+(p[0]-centre[0])*s,120+(p[1]-centre[1])*s];
 const add=(tag,attrs,value)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(value!=null)el.textContent=value;svg.append(el);return el};
 const poly=(pts,attrs)=>add('polygon',{points:pts.map(p=>map(p).join(',')).join(' '),...attrs});
 const label=(x,y,value,attrs={})=>add('text',{x,y,'font-family':'Arial,sans-serif','font-size':15,'text-anchor':'middle',fill:'#264a49',...attrs},value);
 svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.setAttribute('role','img');svg.setAttribute('aria-label','Shape rotated by '+Number(model.angle.toFixed(2))+' degrees. '+(model.matches?'Matches original outline.':'Does not match original outline.'));svg.dataset.agRotationGraphic='1';svg.dataset.agRotationMatch=String(model.matches);
 add('rect',{width:W,height:H,fill:'#fff'});
 poly(m.points,{fill:'#e6f1ec',stroke:'#277b70','stroke-width':2.2,'data-ag-rotation-original':'1'});
 poly(model.rotated,{fill:'#efbd72','fill-opacity':.24,stroke:'#b56d2c','stroke-width':2.5,'stroke-dasharray':'6 4','data-ag-rotation-overlay':'1'});
 const p=map(m.points[0]),q=map(model.rotated[0]);add('line',{x1:210,y1:120,x2:p[0],y2:p[1],stroke:'#277b70','stroke-dasharray':'3 3'});add('line',{x1:210,y1:120,x2:q[0],y2:q[1],stroke:'#b56d2c','stroke-width':1.5});
 add('circle',{cx:p[0],cy:p[1],r:5,fill:'#277b70','data-ag-rotation-start-vertex':'1'});
 add('circle',{cx:q[0],cy:q[1],r:5,fill:'#f6d6a4',stroke:'#b56d2c','stroke-width':2,'data-ag-rotation-moving-vertex':'1'});
 add('circle',{cx:210,cy:120,r:4,fill:'#263e43'});
 const arc=34,rad=model.angle*D;if(model.angle>0&&model.angle<360)add('path',{d:'M '+(210+arc)+' 120 A '+arc+' '+arc+' 0 '+(model.angle>180?1:0)+' 0 '+(210+arc*Math.cos(rad))+' '+(120-arc*Math.sin(rad)),fill:'none',stroke:'#a56a2e','stroke-width':1.5});
 label(210,249,Number(model.angle.toFixed(2))+'° — '+(model.matches?'Matches the original outline':'Does not match the original outline'),{'font-weight':700,fill:model.matches?'#175e55':'#85551f','data-ag-rotation-result':'1'});
 label(210,271,'Rotational order '+model.order+' · smallest positive turn '+Number(model.smallest.toFixed(2))+'°',{'font-size':13});
 return svg;
}
function mountRotationReference(container,m,demo){
 let angle=Math.max(0,Math.min(360,Number(demo.symmetryRotation)||0));
 const section=document.createElement('section');section.className='gd-ag-rotation-reference';section.dataset.agRotationReference='1';
 section.innerHTML='<h4>Investigate rotational symmetry</h4><p>Rotate the orange outline. When does it coincide with the green original?</p><div data-ag-rotation-picture></div><label>Turn (degrees) <output data-ag-rotation-angle></output><input type="range" min="0" max="360" step="any" data-ag-rotation-slider aria-label="Rotation in degrees"></label><div class="gd-row"><button type="button" class="gd-btn" data-ag-rotation-reset>Reset</button><button type="button" class="gd-btn" data-ag-rotation-quarter>+ 90°</button><button type="button" class="gd-btn" data-ag-rotation-next-match>Next matching turn</button></div>';
 const input=section.querySelector('[data-ag-rotation-slider]'),show=()=>{demo.symmetryRotation=angle;input.value=angle;section.querySelector('[data-ag-rotation-angle]').textContent=Number(angle.toFixed(2))+'°';section.querySelector('[data-ag-rotation-picture]').replaceChildren(rotationReferenceGraphic(m,angle))};
 input.oninput=()=>{angle=Number(input.value);show()};
 section.querySelector('[data-ag-rotation-reset]').onclick=()=>{angle=0;show()};
 section.querySelector('[data-ag-rotation-quarter]').onclick=()=>{angle=angle===360?90:Math.min(360,angle+90);show()};
 section.querySelector('[data-ag-rotation-next-match]').onclick=()=>{const step=360/m.symmetry.rotation;angle=angle>=360-1e-8?step:Math.min(360,(Math.floor((angle+1e-8)/step)+1)*step);show()};
 container.appendChild(section);show();
}
function reflectionReferenceGraphic(m,degrees,offset){
 const v=reflectionInvestigation(m,degrees,offset),ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),W=420,H=310,s=78/v.radius,map=p=>[210+(p[0]-v.centre[0])*s,137+(p[1]-v.centre[1])*s];
 const add=(tag,attrs,value)=>{const el=document.createElementNS(ns,tag);for(const [k,x] of Object.entries(attrs))el.setAttribute(k,x);if(value!=null)el.textContent=value;svg.append(el);return el};
 const poly=(pts,attrs)=>add('polygon',{points:pts.map(p=>map(p).join(',')).join(' '),...attrs});
 const line=(p,q,attrs)=>{const a=map(p),b=map(q);return add('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],...attrs})};
 const label=(x,y,value,attrs={})=>add('text',{x,y,'font-family':'Arial,sans-serif','font-size':14,'text-anchor':'middle',fill:'#264a49',...attrs},value);
 const dot=(p,fill)=>{const q=map(p);add('circle',{cx:q[0],cy:q[1],r:4,fill,stroke:'#fff','stroke-width':1})};
 svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.setAttribute('role','img');svg.dataset.agReflectionGraphic='1';svg.dataset.agReflectionMatch=String(v.matches);
 svg.setAttribute('aria-label','Reflection across a line at '+Number(v.angle.toFixed(2))+' degrees. '+(v.matches?'Matches original shape.':'Does not match original shape.'));
 add('rect',{width:W,height:H,fill:'#fff'});
 poly(m.points,{fill:'#d9eee6',stroke:'#277b70','stroke-width':2.2,'data-ag-reflection-original':'1'});
 poly(v.reflected,{fill:'#f3d9a8','fill-opacity':.35,stroke:'#b56d2c','stroke-width':2.2,'stroke-dasharray':'6 4','data-ag-reflection-image':'1'});
 const ends=[labAt(v.origin,v.u,-v.radius*1.55),labAt(v.origin,v.u,v.radius*1.55)];
 line(...ends,{stroke:'#476e9f','stroke-width':2.5,'stroke-dasharray':'8 4','data-ag-reflection-mirror':'1'});
 const i=m.points.reduce((best,p,k)=>labDist(p,v.feet[k])>labDist(m.points[best],v.feet[best])?k:best,0);
 const p=m.points[i],q=v.reflected[i],f=v.feet[i];line(p,q,{stroke:'#476e9f','stroke-width':1.5,'stroke-dasharray':'3 3','data-ag-reflection-perpendicular':'1'});
 if(labDist(p,f)>v.radius*.02){const n=labSub(p,f).map(x=>x/labDist(p,f)),k=v.radius*.075,corner=[labAt(f,v.u,k),labAt(labAt(f,v.u,k),n,k),labAt(f,n,k)];add('polyline',{points:corner.map(x=>map(x).join(',')).join(' '),fill:'none',stroke:'#476e9f','stroke-width':1.4,'data-ag-reflection-right-angle':'1'})}
 dot(p,'#277b70');dot(q,'#b56d2c');dot(f,'#476e9f');
 label(210,278,v.matches?'The mirror line is an axis of symmetry':'The mirror line is not an axis of symmetry',{'font-weight':700,fill:v.matches?'#175e55':'#85551f','data-ag-reflection-result':'1'});
 label(210,300,v.axes.length+' reflection '+(v.axes.length===1?'axis':'axes')+' · corresponding points are equidistant');
 return svg;
}
function mountReflectionReference(container,m,demo){
 let angle=Math.max(0,Math.min(180,Number(demo.symmetryReflectionAngle)||0)),offset=Math.max(-25,Math.min(25,Number(demo.symmetryReflectionOffset)||0));
 const section=document.createElement('section');section.className='gd-ag-reflection-reference';section.dataset.agReflectionReference='1';
 section.innerHTML='<h4>Investigate reflection symmetry</h4><p>Change the mirror line. Does the reflected outline coincide with the original?</p><div data-ag-reflection-picture></div><label>Mirror direction <output data-ag-mirror-angle-value></output><input type="range" min="0" max="180" step="any" data-ag-mirror-angle aria-label="Mirror line direction in degrees"></label><label>Mirror position <output data-ag-mirror-offset-value></output><input type="range" min="-25" max="25" step="1" data-ag-mirror-offset aria-label="Mirror line displacement"></label><div class="gd-row"><button type="button" class="gd-btn" data-ag-mirror-reset>Reset</button><button type="button" class="gd-btn" data-ag-mirror-next-axis>Next symmetry axis</button></div>';
 const direction=section.querySelector('[data-ag-mirror-angle]'),position=section.querySelector('[data-ag-mirror-offset]'),axes=reflectionInvestigation(m).axes,show=()=>{demo.symmetryReflectionAngle=angle;demo.symmetryReflectionOffset=offset;direction.value=angle;position.value=offset;section.querySelector('[data-ag-mirror-angle-value]').textContent=Number(angle.toFixed(2))+'°';section.querySelector('[data-ag-mirror-offset-value]').textContent=offset===0?'Through centre':Math.abs(offset)+'% of radius '+(offset>0?'(+ side)':'(− side)');section.querySelector('[data-ag-reflection-picture]').replaceChildren(reflectionReferenceGraphic(m,angle,offset))};
 direction.oninput=()=>{angle=Number(direction.value);show()};position.oninput=()=>{offset=Number(position.value);show()};
 section.querySelector('[data-ag-mirror-reset]').onclick=()=>{angle=0;offset=0;show()};
 const next=section.querySelector('[data-ag-mirror-next-axis]');next.disabled=!axes.length;if(!axes.length)next.textContent='No symmetry axes';
 next.onclick=()=>{if(!axes.length)return;angle=offset!==0&&axes.some(v=>Math.abs(v-angle)<1e-8)?angle:axes.find(v=>v>angle+1e-8)??axes[0];offset=0;show()};
 container.appendChild(section);show();
}
function quadrilateralFamilyGraphic(f){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),W=600,H=356;
 const add=(tag,attrs,value)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(value!=null)el.textContent=value;svg.append(el);return el};
 const pos={Quadrilateral:[235,30],Trapezium:[120,91],Kite:[356,91],Parallelogram:[120,152],Rectangle:[78,224],Rhombus:[268,224],Square:[173,291]},width=146,height=35;
 const label=(x,y,value,attrs={})=>add('text',{x,y,'font-family':'Arial,sans-serif','font-size':14,'text-anchor':'middle',fill:'#264a49',...attrs},value);
 svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.setAttribute('role','img');svg.setAttribute('aria-label',f.kind+' belongs to '+f.members.join(', '));svg.dataset.agFamilyGraphic='1';
 add('rect',{width:W,height:H,fill:'#fff'});
 for(const e of f.links){const [x,y]=pos[e.child],[u,v]=pos[e.parent],start=[x,y-height/2],end=[u,v+height/2],dx=end[0]-start[0],dy=end[1]-start[1],len=Math.hypot(dx,dy),a=[dx/len,dy/len],n=[-a[1],a[0]],back=labAt(end,a,-8);const stroke=e.active?'#277b70':'#b5c5c3';add('line',{x1:start[0],y1:start[1],x2:end[0],y2:end[1],stroke,'stroke-width':e.active?2.5:1.4,'data-ag-family-link':e.child+'>'+e.parent});add('polyline',{points:[labAt(back,n,4),end,labAt(back,n,-4)].map(p=>p.join(',')).join(' '),fill:'none',stroke,'stroke-width':1.6})}
 for(const node of f.nodes){const [x,y]=pos[node.name];add('rect',{x:x-width/2,y:y-height/2,width,height,rx:7,fill:node.member?'#d9eee6':'#f6f8f7',stroke:node.member?'#277b70':'#c6d3d0','stroke-width':node.member?2:1,'data-ag-family-node':node.name,'data-ag-family-member':String(node.member)});label(x,y+5,node.name,{'font-weight':node.member?700:400})}
 const pts=f.points,xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys),s=Math.min(105/(hiX-loX),105/(hiY-loY)),map=p=>[508+(p[0]-(loX+hiX)/2)*s,191+(p[1]-(loY+hiY)/2)*s];
 add('polygon',{points:pts.map(p=>map(p).join(',')).join(' '),fill:'#d9eee6',stroke:'#277b70','stroke-width':2.3,'data-ag-family-example':'1'});label(508,267,f.kind,{'font-size':12,'font-weight':700});
 label(300,329,'Highlighted boxes are all families of this shape.',{'font-size':14,'font-weight':700});label(300,347,'Each arrow means “is a special case of”.',{'font-size':13});
 return svg;
}
function mountQuadrilateralFamily(container,m,demo){
 const section=document.createElement('section');section.className='gd-ag-family-reference';section.dataset.agFamilyReference='1';
 section.innerHTML='<h4>Explore the quadrilateral family tree</h4><p>One shape can belong to several families. Compare the current shape with other examples.</p><label>Example <select class="gd-select" data-ag-family-select><option value="current">Current shape</option>'+QUAD_FAMILY_EXAMPLES.map(name=>'<option value="'+esc(name)+'">'+esc(name)+'</option>').join('')+'</select></label><div data-ag-family-picture></div><p data-ag-family-members aria-live="polite"></p><dl data-ag-family-definitions></dl><p class="gd-ag-family-convention">Convention: here a trapezium has at least one pair of parallel sides, and a kite has two pairs of adjacent equal sides (including a rhombus). Some textbooks use exclusive definitions instead.</p>';
 const select=section.querySelector('[data-ag-family-select]');select.value=QUAD_FAMILY_EXAMPLES.includes(demo.familyExample)?demo.familyExample:'current';
 const show=()=>{demo.familyExample=select.value;const f=quadrilateralFamilyModel(select.value==='current'?m.points:quadReasoningPoints(select.value));section.querySelector('[data-ag-family-picture]').replaceChildren(quadrilateralFamilyGraphic(f));section.querySelector('[data-ag-family-members]').textContent=f.kind+' belongs to: '+f.members.join(', ')+'.';section.querySelector('[data-ag-family-definitions]').innerHTML=f.nodes.filter(n=>n.member).map(n=>'<dt>'+esc(n.name)+'</dt><dd>'+esc(n.definition)+'</dd>').join('')};
 select.onchange=show;container.appendChild(section);show();
}
function triangleFamilyGraphic(f){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),W=600,H=385;
 const add=(tag,attrs,value)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(value!=null)el.textContent=value;svg.append(el);return el};
 const label=(x,y,value,attrs={})=>add('text',{x,y,'font-family':'Arial,sans-serif','font-size':14,'text-anchor':'middle',fill:'#264a49',...attrs},value);
 svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.setAttribute('role','img');svg.setAttribute('aria-label',f.sides+' and '+f.kind+' triangle. Seven of nine side and angle combinations are possible.');svg.dataset.agTriangleFamilyGraphic='1';
 add('rect',{width:W,height:H,fill:'#fff'});
 const gridX=132,gridY=52,cw=146,ch=94;
 label(350,16,'Classify by angles',{'font-weight':700});
 TRIANGLE_FAMILY_ANGLES.forEach((name,i)=>label(gridX+cw*(i+.5),37,name,{'font-weight':700}));
 TRIANGLE_FAMILY_SIDES.forEach((name,i)=>label(66,gridY+ch*(i+.5),name,{'font-weight':700,'font-size':13}));
 for(const cell of f.cells){
   const row=TRIANGLE_FAMILY_SIDES.indexOf(cell.sides),col=TRIANGLE_FAMILY_ANGLES.indexOf(cell.kind),x=gridX+col*cw,y=gridY+row*ch;
   add('rect',{x:x+2,y:y+2,width:cw-4,height:ch-4,rx:7,fill:cell.selected?'#d9eee6':cell.possible?'#f6f9f7':'#f5f1ef',stroke:cell.selected?'#277b70':'#ccd8d4','stroke-width':cell.selected?2.5:1,'data-ag-triangle-family-cell':cell.sides+'|'+cell.kind,'data-ag-family-possible':String(cell.possible),'data-ag-family-selected':String(cell.selected)});
   if(!cell.possible){label(x+cw/2,y+41,'Impossible',{'font-weight':700,fill:'#85551f'});label(x+cw/2,y+62,'All angles are 60°',{'font-size':12});continue}
   const pts=cell.selected?f.points:triangleFamilyExample(cell.sides,cell.kind),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys),s=Math.min(94/(hiX-loX),57/(hiY-loY)),map=p=>[x+cw/2+(p[0]-(loX+hiX)/2)*s,y+35+(p[1]-(loY+hiY)/2)*s];
   const v=pts.map(map);add('polygon',{points:v.map(p=>p.join(',')).join(' '),fill:cell.selected?'#d9eee6':'#fff',stroke:'#277b70','stroke-width':1.7});
   if(cell.selected)label(x+cw/2,y+82,'Current example',{'font-weight':700,'font-size':12});
   else label(x+cw/2,y+82,'Possible',{'font-size':12});
 }
 label(300,356,'One exact side classification + one angle classification',{'font-weight':700});
 label(300,376,'An equilateral triangle also belongs to the inclusive isosceles family.',{'font-size':12});
 return svg;
}
function mountTriangleFamily(container,m,demo){
 const section=document.createElement('section');section.className='gd-ag-triangle-family';section.dataset.agTriangleFamilyReference='1';
 const options=Object.keys(TRIANGLE_FAMILY_EXAMPLES);
 section.innerHTML='<h4>Explore triangle classifications</h4><p>Classify the same triangle by its sides and by its angles. Not all combinations are possible.</p><label>Example <select class="gd-select" data-ag-triangle-family-select><option value="current">Current triangle</option>'+options.map(key=>'<option value="'+esc(key)+'">'+esc(key.replace('|',' · '))+'</option>').join('')+'</select></label><div data-ag-triangle-family-picture></div><p data-ag-triangle-family-result aria-live="polite"></p><p data-ag-triangle-family-measures></p><p data-ag-triangle-family-explanation></p>';
 const select=section.querySelector('[data-ag-triangle-family-select]');select.value=options.includes(demo.triangleFamilyExample)?demo.triangleFamilyExample:'current';
 const show=()=>{demo.triangleFamilyExample=select.value;const f=triangleFamilyModel(select.value==='current'?m.points:triangleFamilyExample(...select.value.split('|')));section.querySelector('[data-ag-triangle-family-picture]').replaceChildren(triangleFamilyGraphic(f));section.querySelector('[data-ag-triangle-family-result]').textContent='Classification: '+f.sides+' · '+f.kind+'.';section.querySelector('[data-ag-triangle-family-measures]').textContent='Angles: '+f.angles.map(v=>Number(v.toFixed(2))+'°').join(' + ')+' = 180°. Side lengths (model cm): '+f.lengths.map(v=>Number((v/LAB_UNIT).toFixed(2))).join(', ')+'.';section.querySelector('[data-ag-triangle-family-explanation]').textContent=f.explanation};
 select.onchange=show;container.appendChild(section);show();
}
function polygonFormulaGraphic(proof,index){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),W=500,H=300,pts=proof.points,n=proof.n,xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys),scale=Math.min(335/(hiX-loX),172/(hiY-loY)),map=p=>[250+(p[0]-(loX+hiX)/2)*scale,119+(p[1]-(loY+hiY)/2)*scale],v=pts.map(map);
 const add=(tag,attrs,value)=>{const el=document.createElementNS(ns,tag);for(const [k,x] of Object.entries(attrs))el.setAttribute(k,x);if(value!=null)el.textContent=value;svg.append(el);return el};
 const poly=(points,attrs)=>add('polygon',{points:points.map(p=>p.join(',')).join(' '),...attrs});
 const line=(a,b,attrs)=>add('line',{x1:v[a][0],y1:v[a][1],x2:v[b][0],y2:v[b][1],...attrs});
 const label=(x,y,value,attrs={})=>add('text',{x,y,'font-family':'Arial,sans-serif','font-size':15,'text-anchor':'middle',fill:'#263e43','paint-order':'stroke',stroke:'#fff','stroke-width':3,...attrs},value);
 svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.setAttribute('role','img');svg.setAttribute('aria-label',proof.steps[index].title+'. '+proof.steps[index].note);svg.dataset.agPolygonProofGraphic=String(index);
 add('rect',{width:W,height:H,fill:'#fff'});
 poly(v,{fill:'#f2f7f4',stroke:'none'});
 if(index>=3){
   proof.triangles.forEach((tri,j)=>{const p=tri.map(i=>v[i]);poly(p,{fill:REGION_COLOURS[j%REGION_COLOURS.length],'fill-opacity':.45,stroke:'#fff','stroke-width':1,'data-ag-proof-triangle':j});const q=[0,1].map(k=>p.reduce((s,v)=>s+v[k],0)/3);label(q[0],q[1]+4,index===4?'180°':String(j+1),{'font-size':n>=9?11:14,'font-weight':700})});
   proof.internal.forEach(([a,b])=>line(a,b,{stroke:'#277b70','stroke-width':2,'stroke-dasharray':'5 3','data-ag-proof-internal-cut':a+':'+b}));
 }else{
   const edges=index===0?proof.from:proof.all;
   edges.forEach(([a,b])=>line(a,b,{stroke:index===0?'#277b70':'#789e97','stroke-opacity':index===0?.95:.48,'stroke-width':index===0?2.4:1.4,'data-ag-proof-counted-diagonal':a+':'+b}));
   if(index===2&&proof.all.length){const [a,b]=proof.all[0];line(a,b,{stroke:'#b56d2c','stroke-width':3.4,'data-ag-proof-double-example':'1'});const q=labAt(v[a],labSub(v[b],v[a]),.5);label(q[0],q[1]-7,pointName(a)+pointName(b)+' = '+pointName(b)+pointName(a),{'font-size':13,'font-weight':700})}
 }
 poly(v,{fill:'none',stroke:'#35565a','stroke-width':2});
 v.forEach((p,i)=>{const selected=i===proof.vertex,excluded=index===0&&(i===proof.prev||i===proof.next),delta=labSub(p,[250,119]),len=Math.max(1,Math.hypot(...delta)),q=labAt(p,delta,15/len);add('circle',{cx:p[0],cy:p[1],r:selected&&index===0?5:3.4,fill:selected&&index===0?'#277b70':excluded?'#b56d2c':'#35565a','data-ag-proof-vertex':i});label(q[0],q[1]+4,pointName(i),{'font-size':13,'font-weight':selected?700:400})});
 const equations=[n+' − 3 = '+proof.from.length+' diagonals from one vertex',n+' × '+(n-3)+' = '+proof.ordered.length+' counts',n+' × ('+n+' − 3) ÷ 2 = '+proof.all.length+' diagonals', '1 + '+proof.internal.length+' = '+proof.triangles.length+' triangles', '('+n+' − 2) × 180° = '+180*(n-2)+'°'];
 label(250,257,equations[index],{'font-weight':700,'font-size':17,'data-ag-proof-equation':'1'});
 label(250,281,index===1?'Each segment is counted at both endpoints.':index===2?'A diagonal is an unordered pair of vertices.':index>=3?'Only non-crossing interior cuts are used.':'The vertex and its neighbours are excluded.',{'font-size':13});
 return svg;
}
function mountPolygonFormulaProof(container,m,demo){
 let index=Math.max(0,Math.min(4,Math.floor(Number(demo.polygonProofStep)||0))),vertex=Math.max(0,Math.min(m.n-1,Math.floor(Number(demo.polygonProofVertex)||0)));
 const section=document.createElement('section');section.className='gd-ag-polygon-proof';section.dataset.agPolygonProof='1';
 section.innerHTML='<h4>Why the polygon formulae work</h4><label>Start vertex <select class="gd-select" data-ag-polygon-proof-vertex>'+m.points.map((_,i)=>'<option value="'+i+'">'+pointName(i)+'</option>').join('')+'</select></label><div data-ag-polygon-proof-picture></div><strong data-ag-polygon-proof-title></strong><p data-ag-polygon-proof-note aria-live="polite"></p><div class="gd-row"><button type="button" class="gd-btn" data-ag-polygon-proof-back>Previous</button><strong data-ag-polygon-proof-count></strong><button type="button" class="gd-btn" data-ag-polygon-proof-next>Next step</button><button type="button" class="gd-btn" data-ag-polygon-proof-reset>Restart</button></div>';
 const select=section.querySelector('[data-ag-polygon-proof-vertex]'),show=()=>{const proof=polygonFormulaProof(m.points,vertex);demo.polygonProofStep=index;demo.polygonProofVertex=vertex;select.value=vertex;section.querySelector('[data-ag-polygon-proof-picture]').replaceChildren(polygonFormulaGraphic(proof,index));section.querySelector('[data-ag-polygon-proof-title]').textContent=proof.steps[index].title;section.querySelector('[data-ag-polygon-proof-note]').textContent=proof.steps[index].note;section.querySelector('[data-ag-polygon-proof-count]').textContent=(index+1)+' / 5';section.querySelector('[data-ag-polygon-proof-back]').disabled=index===0;section.querySelector('[data-ag-polygon-proof-next]').disabled=index===4};
 select.onchange=()=>{vertex=Number(select.value);show()};section.querySelector('[data-ag-polygon-proof-back]').onclick=()=>{index=Math.max(0,index-1);show()};section.querySelector('[data-ag-polygon-proof-next]').onclick=()=>{index=Math.min(4,index+1);show()};section.querySelector('[data-ag-polygon-proof-reset]').onclick=()=>{index=0;vertex=0;show()};container.appendChild(section);show();
}
function appendShapeReference(svg,d){
 const m=shapeTeachingReference(d);if(!m?.valid||d.showReference===false)return svg;
 const ns='http://www.w3.org/2000/svg',view=svg.getAttribute('viewBox').trim().split(/\s+/).map(Number),[x,y,w,h]=view;let at=y+h+20;
 const add=(tag,attrs,value)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(value!=null)el.textContent=value;svg.append(el);return el};
 const bg=add('rect',{x,y:y+h,width:w,height:1,fill:'#fff','data-ag-shape-reference':'1'});
 const size=Math.max(15,Math.min(21,w/34)),margin=20;
 for(const [i,group] of m.groups.entries()){
   add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size+2,'font-weight':700,fill:'#285c55','data-ag-shape-reference-group':group.title},group.title);at+=size+12;
   const graphic=shapeReferenceGraphic(m,['symmetry','diagonals','area'][i]),gw=Math.min(w-40,390),gh=gw*200/320;graphic.setAttribute('x',x+(w-gw)/2);graphic.setAttribute('y',at);graphic.setAttribute('width',gw);graphic.setAttribute('height',gh);svg.append(graphic);at+=gh+8;
   for(const [label,value] of group.rows){
     const lines=G.exportTools.wrapPaperText(label+': '+value,w-2*margin,size,400);
     for(const line of lines){add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size,fill:'#263e43'},line);at+=size*1.32}
   }
   at+=12;
 }
 const polygonProof=polygonFormulaProof(m.points);if(polygonProof){add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size+2,'font-weight':700,fill:'#285c55'},'Why the polygon formulae work');at+=size+12;for(let i=0;i<polygonProof.steps.length;i++){const g=polygonFormulaGraphic(polygonProof,i),gw=Math.min(w-40,500),gh=gw*300/500;g.setAttribute('x',x+(w-gw)/2);g.setAttribute('y',at);g.setAttribute('width',gw);g.setAttribute('height',gh);svg.append(g);at+=gh+6;for(const line of G.exportTools.wrapPaperText(polygonProof.steps[i].note,w-2*margin,size,400)){add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size,fill:'#263e43'},line);at+=size*1.32}at+=12}}
 const rotation=rotationReferenceGraphic(m,360/m.symmetry.rotation),rw=Math.min(w-40,420),rh=rw*280/420;add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size+2,'font-weight':700,fill:'#285c55'},'Rotational symmetry');at+=size+12;rotation.setAttribute('x',x+(w-rw)/2);rotation.setAttribute('y',at);rotation.setAttribute('width',rw);rotation.setAttribute('height',rh);svg.append(rotation);at+=rh+16;
 const mirror=reflectionReferenceGraphic(m,reflectionInvestigation(m).axes[0]??0,0),mw=Math.min(w-40,420),mh=mw*310/420;add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size+2,'font-weight':700,fill:'#285c55'},'Reflection symmetry');at+=size+12;mirror.setAttribute('x',x+(w-mw)/2);mirror.setAttribute('y',at);mirror.setAttribute('width',mw);mirror.setAttribute('height',mh);svg.append(mirror);at+=mh+16;
 if(m.quad){const family=quadrilateralFamilyGraphic(quadrilateralFamilyModel(m.points)),fw=w-2*margin,fh=fw*356/600;add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size+2,'font-weight':700,fill:'#285c55'},'Quadrilateral family tree');at+=size+12;family.setAttribute('x',x+margin);family.setAttribute('y',at);family.setAttribute('width',fw);family.setAttribute('height',fh);svg.append(family);at+=fh+8;for(const line of G.exportTools.wrapPaperText('Inclusive definitions: a trapezium has at least one parallel pair; a kite has two pairs of adjacent equal sides.',w-2*margin,size,400)){add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size,fill:'#263e43'},line);at+=size*1.32}at+=12}
 if(m.n===3){const family=triangleFamilyGraphic(triangleFamilyModel(m.points)),fw=w-2*margin,fh=fw*385/600;add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size+2,'font-weight':700,fill:'#285c55'},'Triangle classifications');at+=size+12;family.setAttribute('x',x+margin);family.setAttribute('y',at);family.setAttribute('width',fw);family.setAttribute('height',fh);svg.append(family);at+=fh+16}
 const proof=shapeAreaProof(m);if(proof){add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size+2,'font-weight':700,fill:'#285c55'},'Why the area formula works');at+=size+12;for(let i=0;i<proof.steps.length;i++){const g=areaProofGraphic(proof,i),gw=Math.min(w-40,480),gh=gw*230/480;g.setAttribute('x',x+(w-gw)/2);g.setAttribute('y',at);g.setAttribute('width',gw);g.setAttribute('height',gh);svg.append(g);at+=gh+6;for(const line of G.exportTools.wrapPaperText(proof.steps[i].note,w-2*margin,size,400)){add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size,fill:'#263e43'},line);at+=size*1.32}at+=12}}
 const pyth=pythagorasProof(m.points);if(pyth){add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size+2,'font-weight':700,fill:'#285c55'},'Why Pythagoras works');at+=size+12;for(let i=0;i<pyth.steps.length;i++){const g=pythagorasGraphic(pyth,i),gw=Math.min(w-40,500),gh=gw*265/500;g.setAttribute('x',x+(w-gw)/2);g.setAttribute('y',at);g.setAttribute('width',gw);g.setAttribute('height',gh);svg.append(g);at+=gh+6;for(const line of G.exportTools.wrapPaperText(pyth.steps[i].note,w-2*margin,size,400)){add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size,fill:'#263e43'},line);at+=size*1.32}at+=12}}
 if(d.teachingTab==='area-comparison'){const m=areaComparison(d.areaComparisonKind,d.areaComparisonValue),g=areaComparisonGraphic(m,d.areaComparisonReveal===true),gw=w-2*margin,gh=gw*310/640;add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size+2,'font-weight':700,fill:'#285c55'},'Area and perimeter investigation');at+=size+12;g.setAttribute('x',x+margin);g.setAttribute('y',at);g.setAttribute('width',gw);g.setAttribute('height',gh);svg.append(g);at+=gh+8;for(const line of G.exportTools.wrapPaperText(d.areaComparisonReveal===true?m.explanation:'Predict which measurements stay the same and which change.',w-2*margin,size,400)){add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size,fill:'#263e43'},line);at+=size*1.32}at+=12}
 if(d.teachingTab==='reasoning'){const m=geometryReasoning(d.reasoningId),reveal=d.reasoningReveal===true,g=geometryReasoningGraphic(m,null,reveal),gw=w-2*margin,gh=gw*(m.examples.length*218+12)/640;for(const line of G.exportTools.wrapPaperText(m.prompt+' Always, sometimes or never?',w-2*margin,size,400)){add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size,fill:'#263e43'},line);at+=size*1.32}g.setAttribute('x',x+margin);g.setAttribute('y',at);g.setAttribute('width',gw);g.setAttribute('height',gh);svg.append(g);at+=gh+8;if(reveal)for(const line of G.exportTools.wrapPaperText(m.answer+'. '+m.note,w-2*margin,size,400)){add('text',{x:x+margin,y:at+size,'font-family':'Arial,sans-serif','font-size':size,fill:'#263e43'},line);at+=size*1.32}at+=12}
 bg.setAttribute('height',at-y-h+10);svg.setAttribute('viewBox',[x,y,w,at-y+10].join(' '));return svg;
}
function paper(item,teacher){if(item.data.constructionMethod)return methodPublication(item.data,teacher);const d=geometry(item.data);if(item.kind==='diagram')return appendShapeReference(diagram(d,true,{scale:d.scale,paper:true}),d);let prompt=d.prompt;if(['measure','reflex'].includes(d.type))prompt+=' Use your own protractor.';if(inspectTypes.includes(d.type))prompt+=' You may use a ruler or protractor to investigate the diagram.';if(labTypes.includes(d.type))prompt=(d.type==='build-circle'?'Mark centre A in the working space. ':'Draw AB = 6 cm first using your ruler. ')+prompt+' Use your geometry set in the working space.';if(d.choices)prompt+=' Choices: '+d.choices.join(' / ')+'.';return G.exportTools.composeWorksheetCardSvg(diagram(d,teacher,{paper:true,scale:teacher&&['measure','reflex','draw','draw-reflex'].includes(d.type)}),{title:'Angles & geometry',prompt,responseMode:(['draw','draw-reflex'].includes(d.type)||labTypes.includes(d.type))?'none':d.choices?'lines':'box',responseLines:1,responseLabel:'Answer',paperStyle:'plain',printDiagramScale:labTypes.includes(d.type)?null:['draw','draw-reflex','measure','reflex'].includes(d.type)?1.55:1.05,diagramMaxHeight:labTypes.includes(d.type)?830:380,answer:d.answer,showAnswer:teacher})}
if(G.publishing)G.publishing.register(ID,{label:'Angles & geometry',types:s=>types(s),title:item=>item.data.constructionMethod?.title||FAMILIES.find(t=>t[0]===item.data.type)?.[1]||'Angle illustration',recipe:(s,type)=>({...settings(s),type}),generate,signature:d=>d.constructionMethod?JSON.stringify([d.constructionMethod.id,d.publicationMode,d.constructionMethod.graphics,d.constructionMethod.steps]):JSON.stringify([d.type,d.angle,d.angles,d.rotation,d.clockwise,d.n,d.regular,d.shape,d.relation,d.length,d.rightLength,d.rightAngle,d.radius,d.part,d.circleStart,d.circleSpan,d.fact,d.transversalParallel,d.chordLength,d.tangentAngle,d.width,d.height,d.missingSide,d.claim,d.baseLength,d.factor,d.hypotenuse,d.areaComparisonKind,d.areaComparisonValue,d.reasoningId]),capture:s=>s.constructionPublication?[G.publishing.record(ID,s.constructionPublication.publicationMode==='exercise'?'challenge':'diagram',s.constructionPublication)]:[G.publishing.record(ID,s.task?'challenge':'diagram',s.task?{...geometry(s.task),revealed:false}:s.demo)],render:paper,answerSummary:item=>item.data.constructionMethod?item.data.constructionMethod.checks.join('; '):item.data.answer,answerGraphic:item=>item.data.constructionMethod?constructionMethodGraphic(item.data.constructionMethod,item.data.constructionMethod.steps.length-1):diagram(geometry(item.data),true,{paper:true,scale:['measure','draw','draw-reflex','reflex'].includes(item.data.type)}),answerNote:item=>item.data.constructionMethod?[item.data.constructionMethod.why,item.data.constructionMethod.conditions,'Accept any mathematically valid construction satisfying the given conditions.'].join(' '):[item.data.note,labTypes.includes(item.data.type)?'Illustrative diagram; accept any construction meeting the stated conditions, including valid reflections where applicable.':''].filter(Boolean).join(' ')});

 const icon=G.instruments.icon,instrumentButton=G.instruments.button;
 function squareGeometry(o,base,kind,corner=0,hand=1){const angles=kind==='square45'?[90,45,45]:[90,30,60],opening=angles[corner],other=angles[(corner+1)%3],last=angles[(corner+2)%3],scale=140/Math.sin(angles[2]*D),edge=scale*Math.sin(last*D),r=scale*Math.sin(other*D);const exact=(length,angle)=>[o[0]+length*Math.cos(angle*D),o[1]-length*Math.sin(angle*D)];return {angles,opening,other,last,v:exact(edge,base),w:exact(r,base+hand*opening)}}
 function drawSquare(layer,o,base,kind,corner=0,hand=1){const {opening,other,last,v,w}=squareGeometry(o,base,kind,corner,hand),g=G.instruments.setSquare(layer,{points:[o,v,w],angles:[opening,other,last],unitsPerCm:LAB_UNIT,kind});g.setAttribute('pointer-events','none');return g}
 // One floating-palette implementation for free, fixed and constrained geometry.
 function clampGeometryPanel(overlay,panel){
   if(!overlay||panel.hidden||panel.style.display==='none')return;
   const b=overlay.getBoundingClientRect();if(!b.width||!b.height)return;panel.style.maxHeight=Math.max(0,b.height-8)+'px';const r=panel.getBoundingClientRect();if(!r.width||!r.height)return;
   panel.style.left=Math.max(4,Math.min(r.left-b.left,b.width-r.width-4))+'px';
   panel.style.top=Math.max(4,Math.min(r.top-b.top,b.height-r.height-4))+'px';
 }
 function geometryPalette(overlay,title,nodes,left,top,{dynamic=false,onClose=null,collapsible=true}={}){
   const panel=document.createElement('section');panel.className='gd-ag-full-panel';panel.dataset[dynamic?'agDynamicPanel':'agFullPanel']=title;panel.style.left=left;panel.style.top=top;panel.setAttribute('aria-label',title);
   const head=document.createElement('div');head.className='gd-ag-full-panel-head';const name=document.createElement('strong');name.textContent=title;
   const fold=document.createElement('button');fold.type='button';fold.className='gd-btn';const close=document.createElement('button');close.type='button';close.className='gd-btn';close.textContent='×';close.title='Close '+title;close.setAttribute('aria-label',close.title);close.dataset.agClosePanel='1';const grip=document.createElement('span');grip.className='gd-ag-panel-grip';grip.setAttribute('aria-hidden','true');grip.textContent='⠿';head.append(grip,name);if(collapsible)head.append(fold);head.append(close);close.onclick=()=>{if(onClose){onClose();return}panel.dataset.agClosed='1';panel.hidden=true;overlay.dispatchEvent(new Event('tt99-palette-closed'))};
   const content=document.createElement('div');content.className='gd-ag-full-panel-content';content.append(...nodes);panel.append(head,content);overlay.append(panel);
   const sync=()=>{const label=(content.hidden?'Expand ':'Collapse ')+title;fold.textContent=content.hidden?'+':'−';fold.title=label;fold.setAttribute('aria-label',label);fold.setAttribute('aria-expanded',String(!content.hidden))};sync();
   fold.onclick=()=>{content.hidden=!content.hidden;sync();clampGeometryPanel(overlay,panel)};
   panel.addEventListener('pointerdown',()=>{for(const other of overlay.querySelectorAll('.gd-ag-full-panel'))other.style.zIndex=other===panel?'3':'2'});
   let drag=null;head.addEventListener('pointerdown',e=>{if(e.target.closest('button')||e.button!==0)return;const r=panel.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX-r.left,y:e.clientY-r.top};try{head.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()});
   head.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;const b=overlay.getBoundingClientRect();panel.style.left=e.clientX-b.left-drag.x+'px';panel.style.top=e.clientY-b.top-drag.y+'px';clampGeometryPanel(overlay,panel)});
   for(const t of ['pointerup','pointercancel','lostpointercapture'])head.addEventListener(t,e=>{if(drag?.id===e.pointerId)drag=null});
   return panel;
 }
 function geometryNavigation(){
   const nav=document.createElement('div');nav.className='gd-ag-lab-actions gd-ag-board-navigation';nav.setAttribute('role','group');nav.setAttribute('aria-label','Drawing navigation');nav.dataset.agBoardNavigation='1';return nav;
 }
 function geometryPaletteDock(overlay,onToggle){
   const dock=document.createElement('button');dock.type='button';dock.className='gd-btn gd-ag-full-dock';dock.dataset.agFullPanels='1';let hidden=false;
   const closed=()=>[...overlay.querySelectorAll('.gd-ag-full-panel[data-ag-closed]')];const sync=()=>{dock.textContent=hidden||closed().length?'Show panels':'Hide panels';dock.setAttribute('aria-expanded',String(!hidden))};sync();overlay.addEventListener('tt99-palette-closed',sync);
   dock.onclick=()=>{if(hidden||closed().length){hidden=false;for(const p of closed())delete p.dataset.agClosed}else hidden=true;sync();onToggle(hidden)};overlay.append(dock);return dock;
 }
 // Local controls stay readable in screen pixels and do not rotate with the utensil.
 const localInstrumentActions=G.instruments.localActions;
 // Temporary measuring utensils are separate from the mathematical drawing.
 // All positions and dimensions use the same world units as constructed marks.
 // Snap in screen-pixel tolerances, with exact world coordinates.
 // Translation and rotation are independent; snapping never changes size.
 // Convert Geometry's saved model to the shared visible-geometry contract.
 function instrumentScene(st){
   const lines=[...st.segments.filter(o=>labVisible(st,'segments',o)).map(o=>({a:st.points[o[0]],b:st.points[o[1]],ray:false})),...st.rays.filter(o=>labVisible(st,'rays',o)).map(o=>{const a=st.points[o.i],angle=labRayAngle(st,o);return {a,b:[a[0]+100*Math.cos(angle*D),a[1]-100*Math.sin(angle*D)],ray:true,infinite:o.infinite===true}})];
   if(st.given!==false&&st.points.length>=2)lines.push({a:st.points[0],b:st.points[1],ray:false});
   return {points:st.points,lines};
 }
 function sharedInstrumentMath(){return typeof module==='object'&&module.exports?require('./goodies-core.js'):root.TT99Goodies.instruments}
 // Guided sliding may magnetically settle only along its permitted axis.
 function labSquareSlideSnap(s,t,scale=1,previous=null){
   if(t.slideMode!=='across'||!['square45','square30'].includes(t.kind))return null;
   const o=[t.x,t.y],u=[Math.cos(t.angle*D),-Math.sin(t.angle*D)],n=[-u[1],u[0]],tol=12/Math.max(.001,scale),offsets=[];
   for(const e of s.segments){
     if(!labVisible(s,'segments',e))continue;
     const [a,b]=e.map(i=>labSub(s.points[i],o)),v=labSub(b,a),len=Math.hypot(...v);
     if(len<1e-8||Math.abs(labCross(u,v))/len>1e-9)continue;
     const p=labDot(a,u),q=labDot(b,u),overlap=Math.min(t.size,Math.max(p,q))-Math.max(0,Math.min(p,q)),delta=labDot(a,n);
     const key='square-slide:'+JSON.stringify(e.map(i=>s.points[i])),held=previous?.snapKey===key;if(overlap<Math.min(len,t.size)*.1||Math.abs(delta)>tol*(held?1.5:1))continue;
     const existing=offsets.find(x=>Math.abs(x.delta-delta)<1e-7);if(!existing)offsets.push({delta,key,held});else if(held)Object.assign(existing,{key,held});
   }
   offsets.sort((a,b)=>Number(b.held)-Number(a.held)||Math.abs(a.delta)-Math.abs(b.delta));
   if(!offsets.length||!offsets[0].held&&offsets.length>1&&Math.abs(Math.abs(offsets[0].delta)-Math.abs(offsets[1].delta))<1e-7)return null;
   const {delta,key}=offsets[0];return {x:o[0]+n[0]*delta,y:o[1]+n[1]*delta,angle:t.angle,kind:'Guided parallel edge',snapKey:key};
 }
 function utensilAlignment(st,t,mode,scale,previous=null){if(mode==='slide')return labSquareSlideSnap(st,t,scale,previous);if(['move','rotate'].includes(mode)&&t.kind.startsWith('square')){const matches=labSquareMatches(st,t,scale,true,previous),held=matches.find(m=>m.snapKey===previous?.snapKey);if(held||matches.length===1){const {target,score,...pose}=held||matches[0];return pose}}return sharedInstrumentMath().align(instrumentScene(st),t,mode,scale,previous)}
 function protractorReading(st,t,raw,scale,previous=null){return sharedInstrumentMath().readAngle(instrumentScene(st),t,raw,scale,previous)}
 // A point is its exact mathematical centre, not the edge of its visual dot.
 // Draw a small screen-sized, non-interactive cue above transparent instruments.
 function measuringUtensils(parent,getSvg,onPaint,getDrawing,onAnnotation,onAdd,canStart){return G.instruments.movable(parent,getSvg,onPaint,{unitsPerCm:LAB_UNIT,onAdd,canStart,precision:()=>labMeasurementDigits(getDrawing()),align:(t,mode,scale,previous)=>utensilAlignment(getDrawing(),t,mode,scale,previous),read:(t,a,scale,previous)=>protractorReading(getDrawing(),t,a,scale,previous),annotation:onAnnotation?{target:(t,scale)=>labMeasurementTarget(getDrawing(),t,scale),candidates:(t,scale)=>t.kind==='ruler'?labRulerTargets(getDrawing(),t,scale):[],squareComparison:(t,scale)=>labSquareComparison(getDrawing(),t,scale),apply:onAnnotation}:null})}
 function mountLab(box,initial,onChange,{free=false,motion=false,task=null,publishMethod=null}={}){
  let st=labNames(initial||labEmpty(free)),ws=workspaceState(st),ww=free?ws.w:800,hh=free?ws.h:400,corner=0,hand=1,selection=null,tool=free?'select':'segment',first=null,aligned=null,reference=null,referenceDatum=false,hover=null,history=[],snap=true,measure=free&&st.showMeasurements!==false,grid=free?ws.gridMm>0:true,moving=null,sheetPan=null,panMode=false,aperture=null,keepOpening=false,openingPickup=null,lengthGraduation=0,angleGraduation=free?0:1,fineMode=false,finePending=null,arcMode=false,arcStart=null,arcClockwise=false,guideOpen=false,guideStep=0,regionPick=[],regionColour=0,regionStatus='',shadeMode='region',notationMode='',notationPick=[],notationVertex=null,pointEditor=null,labelPlacement=null,angleEditor=null,anglePicking=null,manualAngle=false,angleArmMode=false,pickedArms=[];
  motion=free&&(st.allowMovement??motion);if(free){st.allowMovement=motion;st.showMeasurements=measure;}
  let draft=null,redoHistory=[],constructionSnapshot=null;
  const clone=x=>JSON.parse(JSON.stringify(x)),save=()=>{cancelActive();cancelDraft();history.push(clone(st));redoHistory=[]},N='http://www.w3.org/2000/svg';
  function cancelDraft(){finePending=null;if(!draft)return false;st=draft.state;aperture=draft.aperture;draft=null;first=null;aligned=null;reference=null;referenceDatum=false;arcStart=null;hover=null;placing=null;return true}
  function commitDraft(){constructionSnapshot=draft||{state:clone(st),aperture};draft=null}
  function exitTool(){cancelActive();cancelDraft();openingPickup=null;tool='select';selection=null;pointEditor=null;labelPlacement=null;angleEditor=null;anglePicking=null;manualAngle=false;panMode=false;first=null;aligned=null;reference=null;referenceDatum=false;arcStart=null;hover=null;placing=null;regionPick=[];regionStatus='';notationMode='';notationPick=[];notationVertex=null;paint()}
  const toolbar=document.createElement('div');toolbar.className='gd-ag-lab-toolbar';toolbar.setAttribute('aria-label','Construction tools');
  const instruments=document.createElement('div');instruments.className='gd-ag-lab-tools';instruments.setAttribute('role','group');instruments.setAttribute('aria-label','Drawing instruments');
  const helpers=document.createElement('div');helpers.className='gd-ag-lab-helpers';
  const actions=document.createElement('div');actions.className='gd-ag-lab-actions';actions.setAttribute('role','group');actions.setAttribute('aria-label','Drawing actions');
  const options=document.createElement('div');options.className='gd-ag-lab-options';options.setAttribute('role','group');options.setAttribute('aria-label','Drawing assistance');
  helpers.append(actions,options);toolbar.append(instruments,helpers);helpers.style.justifyContent='space-between';helpers.style.columnGap='8px';
  const svg=document.createElementNS(N,'svg');svg.setAttribute('viewBox','0 0 '+ww+' '+hh);svg.classList.add('gd-ag-lab-canvas');svg.style.cssText='width:100%;max-height:'+(free?'820':'620')+'px;display:block;touch-action:none;user-select:none;background:white;border:1px solid #cbded8;border-radius:8px';
  const hint=document.createElement('p');hint.className='gd-help';hint.dataset.agPaperConstruction='1';hint.style.cssText='text-align:center;min-height:24px;margin:5px 0';
  const guide=document.createElement('section');guide.className='gd-ag-lab-guide';guide.hidden=true;
  const viewport=free?document.createElement('div'):null;if(viewport){viewport.className='gd-ag-sheet-viewport';viewport.style.cssText='max-width:100%;max-height:680px;overflow:auto;overscroll-behavior:contain;position:relative;border:1px solid #cbded8;border-radius:8px;background:#e4eae8;padding:8px;box-sizing:border-box';viewport.append(svg)}box.replaceChildren(toolbar,viewport||svg,hint,guide);
  let screenUnit=1,availableHeight=680,viewX=free?ws.x||0:0,viewY=free?ws.y||0:0,camera=null,fullBoard=false,fullPanels=[],dock=null,panelsHidden=false,boardReady=false,helpPanel=null,methodLibrary=null;
  const normalViewportStyle=viewport?.style.cssText,normalSvgStyle=svg.style.cssText;
  function boardExtent(){
    const x=ws.x||0,y=ws.y||0,b=labContentBounds(st);
    if(!b)return {x,y,w:ws.w,h:ws.h};
    const left=Math.min(x,b[0]),top=Math.min(y,b[1]),right=Math.max(x+ws.w,b[2]),bottom=Math.max(y+ws.h,b[3]);
    return {x:left,y:top,w:Math.ceil(right-left),h:Math.ceil(bottom-top)};
  }
  function boardWorkspace(){
    const e=boardExtent(),x=ws.x||0,y=ws.y||0;
    if(e.x===x&&e.y===y&&e.w===ws.w&&e.h===ws.h)return {...ws};
    const left=Math.floor((e.x<x?e.x-40:x)/4)*4,top=Math.floor((e.y<y?e.y-40:y)/4)*4;
    return {...ws,format:'custom',expanded:true,x:left,y:top,w:Math.ceil((Math.max(e.x+e.w+40,x+ws.w)-left)/4)*4,h:Math.ceil((Math.max(e.y+e.h+40,y+ws.h)-top)/4)*4};
  }
  function sizeCanvas(){
    if(fullBoard){
      const w=Math.max(1,viewport.clientWidth),h=Math.max(1,viewport.clientHeight),e=boardExtent(),scale=camera?camera.scale:Math.max(.001,Math.min(w/e.w,h/e.h)),nextW=w/scale,nextH=h/scale,nx=camera?camera.x-nextW/2:e.x,ny=camera?camera.y-nextH/2:e.y,dirty=Math.abs(ww-nextW)+Math.abs(hh-nextH)+Math.abs(viewX-nx)+Math.abs(viewY-ny)>.01;
      ww=nextW;hh=nextH;viewX=nx;viewY=ny;screenUnit=scale;svg.setAttribute('viewBox',[viewX,viewY,ww,hh].join(' '));svg.style.cssText='width:100%;height:100%;display:block;touch-action:none;user-select:none;background:white;border:0;border-radius:0;max-width:none;max-height:none';if(dirty&&boardReady)paint();return
    }
    viewX=free?ws.x||0:0;viewY=free?ws.y||0:0;svg.setAttribute('viewBox',[viewX,viewY,ww,hh].join(' '));
    if(free){screenUnit=Math.max(.02,Math.min(Math.max(1,(viewport.clientWidth||box.clientWidth||800)-18)/ww,Math.max(1,availableHeight-18)/hh));svg.style.width=ww*screenUnit+'px';svg.style.height=hh*screenUnit+'px';svg.style.maxWidth='none';svg.style.maxHeight='none';svg.style.boxSizing='content-box';svg.style.border='0';svg.style.borderRadius='0';svg.style.margin='0 auto';svg.style.boxShadow='0 0 0 1px #aebfba, 2px 3px 7px #243d3920'}
  }sizeCanvas();
  function currentCamera(){return {x:viewX+ww/2,y:viewY+hh/2,scale:screenUnit}}
  function zoomBoard(factor){if(!fullBoard)return;camera=currentCamera();camera.scale=Math.max(.005,Math.min(12,camera.scale*factor));hover=null;sizeCanvas();paint()}
  function fitBoard(){if(!fullBoard)return;const b=labContentBounds(st);if(!b){camera=null;sizeCanvas();paint();return}const w=Math.max(1,viewport.clientWidth),h=Math.max(1,viewport.clientHeight),pad=70;camera={x:(b[0]+b[2])/2,y:(b[1]+b[3])/2,scale:Math.max(.005,Math.min(12,w/Math.max(2*pad,b[2]-b[0]+2*pad),h/Math.max(2*pad,b[3]-b[1]+2*pad)))};hover=null;sizeCanvas();paint()}


  const controls=[['point','Point','Place a point'],['segment','Ruler','Draw a straight line with the ruler'],['ray','Ray','Draw a ray'],['protractor','Draw angle','Draw a new ray at an angle'],['square45','45°','45° set square'],['square30','30°–60°','30°–60° set square'],['compass','Compass','Draw a compass circle'],['erase','Erase','Erase a drawn object']];if(free)controls.splice(3,0,['line','Line','Draw an infinite straight line']);if(free)controls.push(['select','Select','Select objects, drag movable points or pan empty canvas'],['shade','Shade','Select and shade a polygonal region']);if(free){controls.unshift(['move','Move','Move vertices freely without preserving shape properties']);controls.push(['trace','Trace','Select a point to trace its movement'])}
  function button(id,label,description,fn,parent=actions){return instrumentButton(parent,id,label,description,fn)}
  const buttons=controls.map(([id,label,desc])=>[id,button(id,label,desc,()=>{if(panMode&&tool===id){cancelActive();panMode=false;hover=null;paint();return}if(free&&tool===id&&id!=='select'){exitTool();return}cancelActive();cancelDraft();openingPickup=null;tool=id;selection=null;pointEditor=null;labelPlacement=null;angleEditor=null;anglePicking=null;manualAngle=false;panMode=false;first=null;aligned=null;arcStart=null;hand=1;hover=null;guideStep=0;regionPick=[];regionStatus='';notationMode='';notationPick=[];notationVertex=null;paint()},instruments)]);
  const cancelToolButton=free?button('select','Cancel tool','Cancel unfinished drawing and return to Select (Escape)',exitTool,instruments):null;if(cancelToolButton){cancelToolButton.dataset.agTool='cancel-tool';cancelToolButton.style.minHeight='44px'}
  if(free){svg.setAttribute('tabindex','0');box.addEventListener('keydown',e=>{if(e.defaultPrevented||e.target.closest?.('input,textarea,select,[contenteditable=true]'))return;if((e.ctrlKey||e.metaKey)&&!e.altKey&&['z','y'].includes(e.key.toLowerCase())){const action=e.key.toLowerCase()==='y'||e.shiftKey?redoButton:undoButton;if(!action.disabled){e.preventDefault();e.stopPropagation();action.click()}return}if((e.key==='Delete'||e.key==='Backspace')&&tool==='select'&&selection?.markFamily&&!labelPlacement){e.preventDefault();e.stopPropagation();lineMarkRemove.click();return}if((e.key==='Delete'||e.key==='Backspace')&&tool==='select'&&selection?.dimensionKey&&!labelPlacement){e.preventDefault();e.stopPropagation();dimensionRemove.click();return}if((e.key==='Delete'||e.key==='Backspace')&&tool==='select'&&currentAngle()&&selection?.kind==='points'&&!anglePicking&&!labelPlacement){e.preventDefault();e.stopPropagation();angleEditBox.querySelector('[data-ag-edit-angle-action="remove"]').click();return}if(e.key!=='Escape')return;if(tool!=='select'||draft||panMode||anglePicking!==null||notationMode||labelPlacement||selection){e.preventDefault();e.stopPropagation();exitTool()}});svg.addEventListener('pointerdown',()=>{svg.focus({preventScroll:true})},true)}
  const cornerButton=button('corner','Corner','Change set square corner',()=>{corner=(corner+1)%3;paint()});
  button('flip','Mirror','Mirror across the reference edge',()=>{if(aligned!==null){hand=-hand;paint()}}).dataset.agFlip='1';
  const rotateButton=button('reset','Rotate 180°','Reverse reference edge about anchored vertex',()=>{if(aligned!==null){aligned=mod(aligned+180);paint()}});
  const openingButton=button('compass','Change opening','Change or retain the exact compass opening',()=>{cancelActive();cancelDraft();openingPickup=null;if(aperture!==null)keepOpening=!keepOpening;first=null;aligned=null;arcStart=null;hover=null;paint()});openingButton.dataset.agTool='compass-opening';
  const pickupButton=button('compass','Pick up opening','Pick up an exact radius from a visible circle or span between two marked points',()=>{cancelActive();cancelDraft();openingPickup=openingPickup===null?-1:null;hover=null;paint()});pickupButton.dataset.agTool='compass-pickup';
  const arcButton=button('compass','Full circle','Switch between full circles and partial arcs',()=>{cancelActive();cancelDraft();openingPickup=null;arcMode=!arcMode;arcStart=null;first=null;hover=null;paint()});arcButton.dataset.agTool='compass-arc';
  const graduationLabel=document.createElement('label');graduationLabel.className='gd-ag-lab-option';graduationLabel.title='Optional physical graduation snap for the drawing ruler and compass opening';const graduationInput=document.createElement('select');graduationInput.className='gd-select';graduationInput.dataset.agOption='length-graduation';graduationInput.setAttribute('aria-label','Length graduations');for(const [value,label] of [[0,'Free'],[.1,'1 mm'],[.01,'0.1 mm']]){const o=document.createElement('option');o.value=String(value);o.textContent=label;graduationInput.append(o)}graduationInput.onchange=()=>{cancelActive();lengthGraduation=Number(graduationInput.value)||0;hover=null;paint()};graduationLabel.append('Length ',graduationInput);options.append(graduationLabel);
  const angleGraduationLabel=document.createElement('label');angleGraduationLabel.className='gd-ag-lab-option';angleGraduationLabel.title='Optional physical angular graduations for the drawing protractor';const angleGraduationInput=document.createElement('select');angleGraduationInput.className='gd-select';angleGraduationInput.dataset.agOption='angle-graduation';angleGraduationInput.setAttribute('aria-label','Angular graduations');for(const [value,label] of [[0,'Free'],[1,'1°'],[.1,'0.1°'],[.01,'0.01°']]){const o=document.createElement('option');o.value=String(value);o.textContent=label;angleGraduationInput.append(o)}angleGraduationInput.onchange=()=>{cancelActive();angleGraduation=Number(angleGraduationInput.value)||0;hover=null;paint()};angleGraduationLabel.append('Angle ',angleGraduationInput);options.append(angleGraduationLabel);
  const fineLabel=document.createElement('label');fineLabel.className='gd-ag-lab-option';fineLabel.title='Refine the selected ruler, compass or protractor graduation before drawing';const fineInput=document.createElement('input');fineInput.type='checkbox';fineInput.dataset.agOption='fine-placement';fineInput.setAttribute('aria-label','Fine placement');fineInput.onchange=()=>{cancelActive();fineMode=fineInput.checked;paint()};fineLabel.append(fineInput,document.createTextNode(' Fine placement'));options.append(fineLabel);
  const arcDirection=button('reset','Anticlockwise','Change arc sweep direction',()=>{arcClockwise=!arcClockwise;paint()});arcDirection.dataset.agTool='arc-direction';
  function arcSweep(o,p){const a=labAngle(o,p);return arcClockwise?-mod(arcStart-a):mod(a-arcStart)}
  const undoButton=button('undo','Undo','Undo last drawing action',()=>{const active=cancelActive(),pending=cancelDraft();if(openingPickup!==null){openingPickup=null;paint();return}if(active||pending){paint();return}if(history.length){redoHistory.push(clone(st));distancePair=null;st=labNames(history.pop());if(free){st.allowMovement=motion;syncSheet()}selection=null;if(free)st.workspace={...ws};first=null;aligned=null;arcStart=null;regionPick=[];notationMode='';notationPick=[];notationVertex=null;pointEditor=null;labelPlacement=null;angleEditor=null;anglePicking=null;changed()}});
  const redoButton=button('reset','Redo','Redo last undone drawing action',()=>{const active=cancelActive(),pending=cancelDraft();if(openingPickup!==null){openingPickup=null;paint();return}if(active||pending){paint();return}if(!redoHistory.length)return;history.push(clone(st));st=labNames(redoHistory.pop());if(free){st.allowMovement=motion;st.workspace={...ws};syncSheet()}exitTool();changed()});redoButton.dataset.agTool='redo';
  button('reset','Reset','Reset construction',()=>{save();distancePair=null;const datum=st.datum,intersectionOptions=st.intersectionOptions,measurementPrecision=st.measurementPrecision;st=labNames(labEmpty(free));st.measurementPrecision=measurementPrecision;if(free){st.datum=datum;st.intersectionOptions=intersectionOptions;st.allowMovement=motion}selection=null;if(free)st.workspace={...ws};first=null;aligned=null;regionPick=[];aperture=null;keepOpening=false;openingPickup=null;arcStart=null;changed()});
  const expandButton=free?button('expand','Workspace','Choose paper dimensions and grid size',()=>{sheetPanel.hidden=!sheetPanel.hidden;expandButton.setAttribute('aria-expanded',String(!sheetPanel.hidden))}):null;
  if(free)button('trace','Clear traces','Remove recorded paths without changing the drawing',()=>{save();st.traces={};changed()}).dataset.agTool='clear-traces';
  const panButton=button('pan','Pan','Move around the drawing without changing geometry',()=>{cancelActive();panMode=!panMode;hover=null;paint()});
  const resetViewButton=!free?button('fit','Reset view','Return to the original view without changing the drawing',()=>{cancelActive();viewX=0;viewY=0;svg.setAttribute('viewBox',[viewX,viewY,ww,hh].join(' '));hover=null;paint()}):null;if(resetViewButton)resetViewButton.dataset.agTool='reset-view';
  const navButtons=free?[button('zoom-out','−','Zoom out',()=>zoomBoard(.8)),button('zoom-in','+','Zoom in',()=>zoomBoard(1.25)),button('fit','Fit','Fit all finite geometry in view',fitBoard)]:[];navButtons.forEach(b=>b.hidden=true);
  const navigation=free?geometryNavigation():null;
  const utensils=free?measuringUtensils(toolbar,()=>svg,()=>paint(),()=>draft?draft.state:st,target=>{cancelActive();cancelDraft();const prior=clone(st);if(labApplyMeasurement(st,target)){history.push(prior);redoHistory=[];changed()}else paint()},exitTool,()=>boardPointer()===null):null;
  const utensilsButton=free?button('segment','Measure','Open measuring instruments without drawing new geometry',()=>{cancelActive();cancelDraft();utensils.toggle();paint()}):null;if(utensilsButton)utensilsButton.dataset.agTool='measuring-tools';
  const guideButton=button('help',free?'Help':'Tool help','Show instrument instructions',()=>{guideOpen=!guideOpen;guideStep=0;paint()});
  if(free||CONSTRUCTION_METHODS_BY_TASK[task?.type]){const libraryButton=button('help',free?'Construction library':'Method guide',free?'Open searchable construction methods':'Open optional construction guidance',()=>methodLibrary.toggle());libraryButton.dataset.agTool='construction-library';methodLibrary=mountConstructionLibrary(box,libraryButton,task,()=>draft?draft.state:st,publishMethod)}
  for(const [id,label,get,set] of [['snap','Snap',()=>snap,v=>{snap=v;gestureSnap=null}],...(free?[['measure','Auto lengths',()=>measure,v=>{cancelDraft();measure=v;st.showMeasurements=v;onChange(clone(st))}]]:[]),...(free?[]:[['grid','Grid',()=>grid,v=>grid=v]])]){
   const l=document.createElement('label');l.className='gd-ag-lab-option';const input=document.createElement('input');input.type='checkbox';input.dataset.agOption=id;input.checked=get();input.onchange=()=>{set(input.checked);paint()};const t=document.createElement('span');t.textContent=label;l.append(input,icon(id),t);options.append(l);
  }
  const precisionLabel=document.createElement('label');precisionLabel.className='gd-ag-lab-option';const precisionInput=document.createElement('select');precisionInput.className='gd-select';precisionInput.dataset.agOption='precision';precisionInput.setAttribute('aria-label','Measurement precision');for(const n of [1,2]){const o=document.createElement('option');o.value=String(n);o.textContent=n===1?'0.1':'0.01';precisionInput.append(o)}precisionInput.onchange=()=>{const precision=Number(precisionInput.value);save();st.measurementPrecision=precision;changed()};precisionLabel.append('Precision ',precisionInput);options.append(precisionLabel);
  const movementLabel=document.createElement('label');movementLabel.className='gd-ag-lab-option';const movementInput=document.createElement('input');movementInput.type='checkbox';movementInput.dataset.agOption='movement';movementInput.onchange=()=>{const enabled=movementInput.checked;cancelActive();cancelDraft();motion=enabled;st.allowMovement=motion;if(!motion&&['move','trace'].includes(tool))tool='select';if(motion)tool='select';first=null;aligned=null;hover=null;moving=null;changed()};const movementText=document.createElement('span');movementText.textContent='Move points';movementLabel.title='Allow points to move';movementLabel.append(movementInput,icon('move'),movementText);if(free)options.append(movementLabel);
  const newStyles={segment:false,ray:true,line:false,compass:true};let rayMode='through';
  const styleBar=document.createElement('div');styleBar.className='gd-ag-lab-helpers';toolbar.append(styleBar);
  const localStyle=document.createElement('div');localStyle.className='gd-ag-lab-helpers';localStyle.dataset.agSelectionMenu='1';localStyle.setAttribute('role','group');localStyle.setAttribute('aria-label','Selected geometry');localStyle.style.cssText='position:absolute;z-index:5;display:none;flex-direction:column;flex-wrap:nowrap;align-items:stretch;justify-content:flex-start;gap:4px;padding:6px;width:280px;min-width:0;margin:0;background:#fff;border:1px solid #bfcfc9;border-radius:12px;box-shadow:0 6px 22px #243d3929;box-sizing:border-box;overflow:hidden;overscroll-behavior:contain';if(viewport)viewport.append(localStyle);
  const menuHead=document.createElement('div');menuHead.dataset.agSelectionDrag='1';menuHead.style.cssText='display:flex;align-items:center;gap:6px;min-height:32px;padding:0 0 5px;cursor:grab;touch-action:none;user-select:none;flex-shrink:0;border-bottom:1px solid #e2ebe7';
  const menuGrip=document.createElement('span');menuGrip.textContent='⠿';menuGrip.setAttribute('aria-hidden','true');menuGrip.style.cssText='color:#5b8279;font-size:17px';
  const menuTitle=document.createElement('strong');menuTitle.style.cssText='flex:1;font:600 12px Arial,sans-serif;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
  const menuFold=document.createElement('button');menuFold.type='button';menuFold.className='gd-btn';menuFold.dataset.agSelectionFold='1';
  const menuClose=document.createElement('button');menuClose.type='button';menuClose.className='gd-btn';menuClose.textContent='×';menuClose.title='Close selection';menuClose.style.cssText='width:32px;min-width:32px;padding:0!important';menuFold.style.cssText='width:32px;min-width:32px;padding:0!important';menuClose.setAttribute('aria-label','Close selection');menuClose.dataset.agSelectionClose='1';
  const menuBack=document.createElement('button');menuBack.type='button';menuBack.className='gd-btn';menuBack.textContent='‹ Back';menuBack.dataset.agSelectionBack='1';menuBack.setAttribute('aria-label','Back to selected point');menuBack.hidden=true;menuBack.onclick=()=>{distancePair=null;anglePicking=null;angleEditor=null;pointEditor=null;manualAngle=false;editStatus.textContent='';paint()};
  const menuBody=document.createElement('div');menuBody.style.cssText='display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-start;gap:4px;min-width:0;min-height:0;overflow:auto;overscroll-behavior:contain';menuHead.append(menuGrip,menuBack,menuTitle,menuFold,menuClose);localStyle.append(menuHead,menuBody);
  let menuPosition=null,menuDrag=null,menuCollapsed=false;
  const syncMenuFold=()=>{menuBody.hidden=menuCollapsed;menuFold.textContent=menuCollapsed?'+':'−';menuFold.title=(menuCollapsed?'Expand':'Collapse')+' selection';menuFold.setAttribute('aria-label',menuFold.title);menuFold.setAttribute('aria-expanded',String(!menuCollapsed))};syncMenuFold();
  function positionMenu(x,y){if(!viewport)return;const w=localStyle.offsetWidth,h=localStyle.offsetHeight;const left=Math.max(6,Math.min(Math.max(6,viewport.clientWidth-w-6),x)),top=Math.max(6,Math.min(Math.max(6,viewport.clientHeight-h-6),y));localStyle.style.left=(viewport.scrollLeft+left)+'px';localStyle.style.top=(viewport.scrollTop+top)+'px';return {x:left,y:top}}
  menuFold.onclick=()=>{menuCollapsed=!menuCollapsed;syncMenuFold();paint()};
  menuClose.onclick=()=>{distancePair=null;selection=null;angleEditor=null;pointEditor=null;manualAngle=false;anglePicking=null;labelPlacement=null;notationMode='';notationPick=[];notationVertex=null;menuCollapsed=false;syncMenuFold();paint()};
  menuHead.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button'))return;const bounds=localStyle.getBoundingClientRect();menuDrag={id:e.pointerId,x:e.clientX-bounds.left,y:e.clientY-bounds.top};menuHead.style.cursor='grabbing';try{menuHead.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault();e.stopPropagation()});
  menuHead.addEventListener('pointermove',e=>{if(menuDrag?.id!==e.pointerId)return;const bounds=viewport.getBoundingClientRect();menuPosition=positionMenu(e.clientX-bounds.left-viewport.clientLeft-menuDrag.x,e.clientY-bounds.top-viewport.clientTop-menuDrag.y);e.preventDefault();e.stopPropagation()});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])menuHead.addEventListener(type,e=>{if(menuDrag?.id===e.pointerId){menuDrag=null;menuHead.style.cursor='grab';e.stopPropagation()}});
   let selectionAnchor=null;
   const styleText=document.createElement('span');styleText.style.font='650 13px Arial,sans-serif';styleBar.append(styleText);
  const styleButtons=[false,true].map(value=>{const b=document.createElement('button');b.type='button';b.className='gd-btn';b.textContent=value?'Construction':'Normal';b.dataset.agStyle=String(value);b.onclick=()=>{if(!selection){if(Object.hasOwn(newStyles,tool)){newStyles[tool]=value;paint()}return}const {kind,index}=selection,obj=st[kind][index];if(!obj)return;save();if(kind==='segments'){st.segmentStyles||={};st.segmentStyles[labStyleKey(st,...obj)]=value}else obj.construction=value;changed()};styleBar.append(b);return b});
  const rayControls=document.createElement('div');rayControls.style.cssText='display:none;flex-wrap:wrap;align-items:center;gap:5px;width:100%';
  const rayModeInput=document.createElement('select');rayModeInput.className='gd-select';rayModeInput.dataset.agRayDefinition='1';rayModeInput.setAttribute('aria-label','Ray definition');
  for(const [v,l] of [['through','Through two points'],['absolute','Absolute direction (from +x)']]){const o=document.createElement('option');o.value=v;o.textContent=l;rayModeInput.append(o)}
  rayModeInput.onchange=()=>{rayMode=rayModeInput.value;hover=null;paint()};
  const rayAngleInput=document.createElement('input');rayAngleInput.type='number';rayAngleInput.className='gd-input';rayAngleInput.inputMode='decimal';rayAngleInput.step='any';rayAngleInput.value='0';rayAngleInput.style.cssText='width:85px;min-width:0';rayAngleInput.dataset.agRayAngle='1';rayAngleInput.setAttribute('aria-label','Absolute angle in degrees, anticlockwise from positive x');
  const rayCommit=document.createElement('button');rayCommit.type='button';rayCommit.className='gd-btn gd-btn--primary';rayCommit.dataset.agRayCommit='1';rayCommit.textContent='Draw ray';
  const rayStatus=document.createElement('span');rayStatus.style.cssText='font:500 11px Arial,sans-serif;width:100%;color:#536f68';rayStatus.setAttribute('role','status');
  rayCommit.onclick=()=>{if(!['ray','line'].includes(tool)||first===null||rayMode!=='absolute')return;const ray=labAbsoluteRay(st,first,rayAngleInput.valueAsNumber,newStyles[tool]);if(!ray){rayStatus.textContent='Enter a valid angle in degrees.';return}commitDraft();const before=beforeGeometry();if(tool==='line')ray.infinite=true;st.rays.push(ray);first=null;hover=null;finishGeometry(before)};
  rayAngleInput.oninput=()=>{rayCommit.disabled=first===null||!Number.isFinite(rayAngleInput.valueAsNumber);paint()};
  rayControls.append(rayModeInput,rayAngleInput,rayCommit,rayStatus);styleBar.append(rayControls);
  const rayDefinitionText=document.createElement('span');rayDefinitionText.style.cssText='font:500 12px/1.4 Arial,sans-serif;color:#385e55;width:100%';rayDefinitionText.dataset.agRaySummary='1';menuBody.append(rayDefinitionText);
  const inkButtons=Object.entries(LAB_INK).map(([key,colour])=>{const b=document.createElement('button');b.type='button';b.className='gd-btn';b.dataset.agInk=key;b.title=key==='default'?'Default colour':key;b.setAttribute('aria-label',key==='default'?'Default colour':key+' colour');b.style.cssText='min-width:44px;min-height:44px;padding:8px;justify-content:center';const swatch=document.createElement('span');swatch.style.cssText='display:block;width:18px;height:18px;border-radius:50%;background:'+(colour||'#285c52')+';border:1px solid #0002';b.append(swatch);b.onclick=()=>{if(!selection||selection.kind==='points')return;const {kind,index}=selection,obj=st[kind][index];if(!obj)return;save();if(kind==='segments'){st.segmentColours||={};const k=labStyleKey(st,...obj);if(colour)st.segmentColours[k]=key;else delete st.segmentColours[k]}else if(colour)obj.colour=key;else delete obj.colour;changed()};menuBody.append(b);return b});
  const pointTrace=button('trace','Trace point','Toggle trace for selected point',()=>{if(selection?.kind!=='points'||!motion)return;save();traceToggle(st,st.names[selection.index]);changed()},styleBar);pointTrace.dataset.agTool='selected-trace';
  const notationBar=document.createElement('div');notationBar.className='gd-ag-lab-helpers';toolbar.append(notationBar);const notationSelect=document.createElement('select');notationSelect.className='gd-select';notationSelect.setAttribute('aria-label','Geometric notation');notationSelect.dataset.agNotation='1';for(const [v,l] of [['','Equal length: none'],['equal1','Equal length · one tick'],['equal2','Equal length · two ticks'],['equal3','Equal length · three ticks']]){const o=document.createElement('option');o.value=v;o.textContent=l;notationSelect.append(o)}notationSelect.onchange=()=>{if(selection?.kind!=='segments')return;save();labSetLineMark(st,st.segments[selection.index],'equal',Number(notationSelect.value.slice(-1))||0);if(selection.markFamily==='equal'&&!notationSelect.value)selection=null;changed()};const parallelSelect=document.createElement('select');parallelSelect.className='gd-select';parallelSelect.dataset.agParallelNotation='1';parallelSelect.setAttribute('aria-label','Parallel notation');for(const [v,l] of [['0','Parallel: none'],['1','Parallel · one arrow'],['2','Parallel · two arrows'],['3','Parallel · three arrows']]){const o=document.createElement('option');o.value=v;o.textContent=l;parallelSelect.append(o)}parallelSelect.onchange=()=>{if(selection?.kind!=='segments')return;save();labSetLineMark(st,st.segments[selection.index],'parallel',Number(parallelSelect.value));if(selection.markFamily==='parallel'&&parallelSelect.value==='0')selection=null;changed()};const symmetryMark=document.createElement('button');symmetryMark.type='button';symmetryMark.className='gd-btn';symmetryMark.dataset.agSymmetryNotation='1';symmetryMark.onclick=()=>{if(selection?.kind!=='segments')return;const e=st.segments[selection.index];save();labSetLineMark(st,e,'symmetry',!labLineMarks(st,e).symmetry);changed()};notationBar.append(notationSelect,parallelSelect,symmetryMark);const angleSelect=document.createElement('select');angleSelect.className='gd-select';angleSelect.setAttribute('aria-label','Angle notation');angleSelect.dataset.agAngleNotation='1';for(const [v,l] of [['','Choose mark style…'],['angle1','Equal angle · one arc'],['angle2','Equal angle · two arcs'],['right','Right angle'],['remove','Remove angle mark']]){const o=document.createElement('option');o.value=v;o.textContent=l;angleSelect.append(o)}angleSelect.onchange=()=>{notationMode=angleSelect.value;notationPick=[];notationVertex=selection?.kind==='points'?selection.index:null;selection=null;paint()};notationBar.append(angleSelect);
  const dimensionSelect=document.createElement('select');dimensionSelect.className='gd-select';dimensionSelect.dataset.agDimensionMode='1';dimensionSelect.setAttribute('aria-label','Line dimension');for(const [v,l] of [['auto','Dimension: automatic'],['measured','Keep measured length'],['custom','Custom value / unknown'],['hidden','Hide dimension']]){const o=document.createElement('option');o.value=v;o.textContent=l;dimensionSelect.append(o)}
  const dimensionInput=document.createElement('input');dimensionInput.className='gd-input';dimensionInput.type='text';dimensionInput.maxLength=30;dimensionInput.placeholder='e.g. x, ?, 12 cm';dimensionInput.setAttribute('aria-label','Custom dimension');dimensionInput.dataset.agDimensionText='1';
  const dimensionApply=document.createElement('button');dimensionApply.className='gd-btn';dimensionApply.type='button';dimensionApply.textContent='Apply label';dimensionApply.dataset.agDimensionApply='1';
  function applyDimension(){const d=selectedDimension();if(!d)return;const k=d.key,mode=dimensionSelect.value,text=dimensionInput.value.trim();if(mode==='custom'&&!text)return;save();st.dimensionLabels||={};const offset=st.dimensionLabels[k]?.offset;if(mode==='auto'&&!offset)delete st.dimensionLabels[k];else st.dimensionLabels[k]={mode,...(mode==='custom'?{text}:{}),...(offset?{offset}:{})};changed()}
  dimensionSelect.onchange=()=>{dimensionInput.hidden=dimensionApply.hidden=dimensionSelect.value!=='custom';if(dimensionSelect.value==='custom'){dimensionInput.focus()}else applyDimension()};dimensionApply.onclick=applyDimension;dimensionInput.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();applyDimension()}};
  const angleLabelSelect=document.createElement('select');angleLabelSelect.className='gd-select';angleLabelSelect.dataset.agAngleLabelMode='1';angleLabelSelect.setAttribute('aria-label','Angle label');for(const [v,l] of [['none','No value'],['measured','Measured angle'],['custom','Custom value / unknown']]){const o=document.createElement('option');o.value=v;o.textContent=l;angleLabelSelect.append(o)}
  const angleLabelInput=document.createElement('input');angleLabelInput.className='gd-input';angleLabelInput.type='text';angleLabelInput.maxLength=30;angleLabelInput.placeholder='e.g. x, ?, 35°';angleLabelInput.dataset.agAngleLabelText='1';angleLabelInput.setAttribute('aria-label','Custom angle label');angleLabelInput.hidden=true;angleLabelSelect.onchange=()=>{angleLabelInput.hidden=angleLabelSelect.value!=='custom'};
  const cancelNotation=document.createElement('button');cancelNotation.className='gd-btn';cancelNotation.type='button';cancelNotation.textContent='Cancel angle';cancelNotation.onclick=()=>{if(notationVertex!==null)selection={kind:'points',index:notationVertex};notationMode='';notationPick=[];notationVertex=null;manualAngle=false;paint()};notationBar.append(angleLabelSelect,angleLabelInput,cancelNotation);menuBody.append(dimensionSelect,dimensionInput,dimensionApply);
  const dimensionAction=(id,label,fn)=>{const b=document.createElement('button');b.type='button';b.className='gd-btn';b.dataset.agDimensionAction=id;b.textContent=label;b.onclick=fn;menuBody.append(b);return b};
  let distancePair=null;const selectedDimension=()=>{const edge=selection?.dimensionKey?selection.dimensionKey.split(':').map(n=>st.names.indexOf(n)):selection?.kind==='segments'?st.segments[selection.index]:selection?.kind==='points'&&distancePair?.[0]===st.names[selection.index]?distancePair.map(n=>st.names.indexOf(n)):null;if(!edge||edge.some(i=>i<0))return null;const [i,j]=edge,a=st.points[i],b=st.points[j],key=labStyleKey(st,i,j);return {edge,key,mid:labAt(a,labSub(b,a),.5),value:labDimensionText(st,i,j,st.segments.some(e=>labStyleKey(st,...e)===key&&!labConstruction(st,'segments',e))&&measure)}};
  const dimensionMove=dimensionAction('position','Position length label',()=>{const d=selectedDimension();if(!d?.value)return;labelPlacement={dimension:d.key};paint()});
  const dimensionReset=dimensionAction('reset','Reset length position',()=>{const d=selectedDimension(),entry=d&&st.dimensionLabels?.[d.key];if(!entry?.offset)return;save();delete entry.offset;if(entry.mode==='auto')delete st.dimensionLabels[d.key];changed()});
  const lineMarkRemove=dimensionAction('remove-mark','Remove marking',()=>{if(selection?.kind!=='segments'||!selection.markFamily)return;const edge=st.segments[selection.index];if(!edge)return;save();labSetLineMark(st,edge,selection.markFamily,0);selection=null;changed()});
  const dimensionRemove=dimensionAction('remove','Remove length annotation',()=>{const d=selectedDimension();if(!d?.value)return;save();st.dimensionLabels||={};if(st.segments.some(e=>labStyleKey(st,...e)===d.key&&!labConstruction(st,'segments',e)))st.dimensionLabels[d.key]={mode:'hidden'};else delete st.dimensionLabels[d.key];selection=null;distancePair=null;changed()});
  const distanceSelect=document.createElement('select');distanceSelect.className='gd-select';distanceSelect.dataset.agDistancePoint='1';distanceSelect.setAttribute('aria-label','Distance to another point');distanceSelect.onchange=()=>{const i=selectedPointIndex(),j=st.names.indexOf(distanceSelect.value);if(i<0||j<0||i===j)return;distancePair=[st.names[i],st.names[j]];const k=labStyleKey(st,i,j);if(!st.dimensionLabels?.[k]){save();labApplyMeasurement(st,{kind:'length',names:distancePair});changed()}else paint()};menuBody.append(distanceSelect);const labelEdit=document.createElement('button');labelEdit.type='button';labelEdit.className='gd-btn';labelEdit.textContent='Point label';labelEdit.style.cssText='flex:1 1 100px';labelEdit.dataset.agPointLabelEdit='1';
  const labelInput=document.createElement('input');labelInput.type='text';labelInput.className='gd-input';labelInput.maxLength=30;labelInput.placeholder='Point name';labelInput.setAttribute('aria-label','Point label text');labelInput.dataset.agPointLabelText='1';labelInput.style.maxWidth='140px';
  const labelAction=(id,text,fn)=>{const b=document.createElement('button');b.type='button';b.className='gd-btn';b.dataset.agPointLabelAction=id;b.textContent=text;b.onclick=fn;return b};
  function selectedPointIndex(){return selection?.kind==='points'?selection.index:-1}
  function editPointLabel(){const i=selectedPointIndex();if(i<0)return;const name=st.names[i];pointEditor=name;angleEditor=null;manualAngle=false;labelInput.value=labPointText(st,i);paint();if(pointEditor)labelInput.focus()}
  labelEdit.onclick=editPointLabel;
  const labelApply=labelAction('apply','Apply',()=>{const i=selectedPointIndex();if(i<0||pointEditor!==st.names[i])return;const value=labelInput.value.trim();if(!value)return;save();st.pointLabels||={};st.pointLabels[pointEditor]={...st.pointLabels[pointEditor],text:value};changed()});
  labelInput.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();labelApply.click()}};
  const labelMove=labelAction('position','Position label',()=>{const i=selectedPointIndex();if(i<0)return;labelPlacement=st.names[i];paint()});
  const labelReset=labelAction('reset','Reset label',()=>{const i=selectedPointIndex();if(i<0)return;const name=st.names[i];if(st.pointLabels?.[name]){save();delete st.pointLabels[name];labelInput.value=name;changed()}});
  const labelCancel=labelAction('cancel','Cancel positioning',()=>{labelPlacement=null;paint()});
  notationBar.append(labelCancel);menuBody.append(labelEdit,labelInput,labelApply,labelMove,labelReset);
  const chooseAngle=document.createElement('button');chooseAngle.type='button';chooseAngle.className='gd-btn';chooseAngle.textContent='Mark angle';chooseAngle.classList.add('gd-btn--primary');chooseAngle.style.cssText='flex:1 1 100%;font-weight:600!important';chooseAngle.dataset.agChooseAngle='1';menuBody.append(chooseAngle);
  const cancelAnglePick=document.createElement('button');cancelAnglePick.type='button';cancelAnglePick.className='gd-btn';cancelAnglePick.textContent='Cancel angle selection';cancelAnglePick.dataset.agCancelAnglePick='1';const chooseDirections=document.createElement('button');chooseDirections.type='button';chooseDirections.className='gd-btn';chooseDirections.dataset.agChooseDirections='1';chooseDirections.onclick=()=>{angleArmMode=!angleArmMode;pickedArms=[];paint()};const anglePickStatus=document.createElement('div');anglePickStatus.dataset.agAnglePickStatus='1';anglePickStatus.setAttribute('role','status');anglePickStatus.style.cssText='width:100%;font:500 12px/1.4 Arial,sans-serif;color:#385e55;padding:4px 0';const resetArms=document.createElement('button');resetArms.type='button';resetArms.className='gd-btn';resetArms.textContent='Clear arms';resetArms.dataset.agResetArms='1';resetArms.onclick=()=>{pickedArms=[];paint()};const sideButtons=[0,1].map(i=>{const b=document.createElement('button');b.type='button';b.className='gd-btn';b.dataset.agAngleSide=i;b.style.cssText='flex:1 1 110px';b.onclick=()=>{const sector=currentSectors()[i];if(sector)selectSector(sector)};return b});menuBody.append(anglePickStatus,...sideButtons,chooseDirections,resetArms,cancelAnglePick);
  function currentSectors(){if(anglePicking===null)return [];if(!angleArmMode)return labAngleSectors(st,anglePicking);return pickedArms.length===2?labAnglePair(st,anglePicking,...pickedArms):[]}
  chooseAngle.onclick=()=>{if(selection?.kind!=='points')return;anglePicking=selection.index;angleArmMode=labAngleArms(st,anglePicking).length>2;pickedArms=[];angleEditor=null;pointEditor=null;manualAngle=false;paint()};
  cancelAnglePick.onclick=()=>{anglePicking=null;paint()};
  function selectSector(sector){
    st.angleNotation||=[];
    const mark={...labSectorMark(st,sector),kind:'angle1',labelMode:'none'};
    let idx=st.angleNotation.findIndex(m=>labSameAngle(st,m,mark));
    if(idx<0){save();idx=st.angleNotation.length;st.angleNotation.push(mark)}
    anglePicking=null;selection={kind:'points',index:sector.ids[1]};angleEditor=idx;const m=currentAngle();editKind.value=m.kind;editMode.value=m.labelMode||'none';editText.value=m.label||'';editStatus.textContent='';changed()
  }
  const angleExisting=document.createElement('select');angleExisting.className='gd-select';angleExisting.dataset.agAngleExisting='1';angleExisting.setAttribute('aria-label','Edit existing angle');angleExisting.style.cssText='width:100%;min-width:0';
  const angleEditBox=document.createElement('div');angleEditBox.style.cssText='display:flex;flex-wrap:wrap;gap:6px;align-items:center;width:100%';menuBody.append(angleExisting,angleEditBox);
  const angleField=(id,aria,options)=>{const e=document.createElement('select');e.className='gd-select';e.dataset[id]='1';e.setAttribute('aria-label',aria);e.style.cssText='width:auto;flex:1 1 115px;min-width:0';for(const [v,l] of options){const o=document.createElement('option');o.value=v;o.textContent=l;e.append(o)}angleEditBox.append(e);return e};
  const editKind=angleField('agEditAngleKind','Angle mark',[['angle1','Single arc'],['angle2','Double arc'],['angle3','Triple arc'],['right','Right angle']]),editMode=angleField('agEditAngleMode','Angle value',[['none','No value'],['measured','Measured angle'],['custom','Custom value / unknown']]);
  const editText=document.createElement('input');editText.type='text';editText.className='gd-input';editText.maxLength=30;editText.placeholder='x, ?, 35°';editText.dataset.agEditAngleText='1';editText.setAttribute('aria-label','Edited angle label');angleEditBox.append(editText);
  const editStatus=document.createElement('span');editStatus.setAttribute('role','status');editStatus.style.cssText='font-size:12px;color:#a13e2d';angleEditBox.append(editStatus);
  function currentAngle(){return angleEditor===null?null:st.angleNotation?.[angleEditor]||null}
  angleExisting.onchange=()=>{angleEditor=angleExisting.value===''?null:Number(angleExisting.value);pointEditor=null;manualAngle=false;const m=currentAngle();if(m){editKind.value=m.kind;editMode.value=m.labelMode||'none';editText.value=m.label||''}editStatus.textContent='';paint()};
  editMode.onchange=()=>{editText.hidden=editMode.value!=='custom'};
  function angleAction(id,label,fn){const b=document.createElement('button');b.type='button';b.className='gd-btn';b.dataset.agEditAngleAction=id;b.textContent=label;b.onclick=fn;angleEditBox.append(b);return b}
  const applyAngle=angleAction('apply','Apply',()=>{const m=currentAngle(),data=m&&labAngleAnnotation(st,m);if(!data)return;if(editKind.value==='right'&&Math.abs(data.angle-90)>.01){editStatus.textContent='This angle is not 90°.';return}if(editMode.value==='custom'&&!editText.value.trim()){editStatus.textContent='Enter a label.';return}save();m.kind=editKind.value;m.labelMode=editMode.value;m.label=editText.value.trim();editStatus.textContent='';changed()});
  applyAngle.classList.add('gd-btn--primary');angleAction('position','Position label',()=>{const m=currentAngle();if(!m||!labAngleAnnotation(st,m)?.value)return;labelPlacement={angle:angleEditor};paint()});
  angleAction('reset-position','Auto position',()=>{const m=currentAngle();if(m?.labelOffset){save();delete m.labelOffset;changed()}});
  angleAction('remove','Remove mark',()=>{if(!currentAngle())return;save();st.angleNotation.splice(angleEditor,1);angleEditor=null;changed()});
  const visibility=document.createElement('label');visibility.className='gd-ag-lab-option';const visibleInput=document.createElement('input');visibleInput.type='checkbox';visibleInput.checked=st.showConstruction!==false;visibleInput.dataset.agOption='construction';visibleInput.onchange=()=>{save();st.showConstruction=visibleInput.checked;selection=null;changed()};const visibilityText=document.createElement('span');visibilityText.textContent='Construction lines';visibility.append(visibleInput,visibilityText);if(free)options.append(visibility);
  const regionBar=document.createElement('div');regionBar.className='gd-ag-lab-helpers';regionBar.hidden=true;toolbar.append(regionBar);
  const shadeModeButton=document.createElement('button');shadeModeButton.type='button';shadeModeButton.className='gd-btn';shadeModeButton.dataset.agShadeMode='1';shadeModeButton.onclick=()=>{shadeMode=shadeMode==='region'?'vertices':'region';regionPick=[];regionStatus='';paint()};regionBar.append(shadeModeButton);
  const colourButtons=REGION_COLOURS.map((c,i)=>{const b=document.createElement('button');b.type='button';b.className='gd-btn';b.style.cssText='width:34px;min-height:36px;background:'+c+';border:2px solid white';b.setAttribute('aria-label',['Green','Blue','Gold','Purple','Coral'][i]+' region');b.onclick=()=>{regionColour=i;paint()};regionBar.append(b);return b});
  const regionAction=(label,fn)=>{const b=document.createElement('button');b.type='button';b.className='gd-btn';b.textContent=label;b.onclick=fn;regionBar.append(b);return b};
  const applyRegion=regionAction('Shade selected',()=>{if(!validRegion(st.points,regionPick))return;save();st.regions.push({ids:regionPick.slice(),colour:regionColour});regionPick=[];regionStatus='';changed()});
  const clearRegion=regionAction('Clear selection',()=>{regionPick=[];regionStatus='';paint()});
  const removeRegion=regionAction('Remove last region',()=>{if(!st.regions.length)return;save();st.regions.pop();changed()});
  const sheetPanel=document.createElement('div');sheetPanel.hidden=true;sheetPanel.className='gd-ag-sheet-settings';
  let formatInput,orientationInput,widthInput,heightInput,gridInput,sheetStatus,customFields;const datumInputs={},intersectionInputs={};
  function resizeWorkspace(next){
    if(!free)return false;
    cancelDraft();if(!workspaceFits(st,next.w,next.h)){sheetStatus.textContent='Existing drawing does not fit this sheet. Choose a larger size or undo/erase marks first.';return false}
    ws={...next};camera=null;ww=ws.w;hh=ws.h;grid=ws.gridMm>0;st.workspace={...ws};sizeCanvas();syncSheet();changed();return true
  }
  function syncSheet(){
    if(!free)return;formatInput.value=ws.format;orientationInput.value=ws.orientation;widthInput.value=ws.w/4;heightInput.value=ws.h/4;gridInput.value=ws.gridMm;for(const [key,input] of Object.entries(datumInputs))input.checked=datumState(st)[key];for(const [key,input] of Object.entries(intersectionInputs))input.checked=labIntersectionSettings(st)[key];
    customFields.hidden=ws.format!=='custom';customFields.style.display=ws.format==='custom'?'flex':'none';orientationInput.disabled=ws.format==='custom';sheetStatus.textContent=(ws.w/4)+' × '+(ws.h/4)+' mm · '+(grid?ws.gridMm+' mm grid':'Plain paper')+(fullBoard?' · Board fills screen':'');expandButton.querySelector('span').textContent='Workspace · '+(ws.format==='custom'?'Custom':ws.format)
  }
  if(free){
    sheetPanel.style.cssText='padding:4px 6px;border-top:1px solid #dce8e4';toolbar.append(sheetPanel);expandButton.setAttribute('aria-expanded','false');
    const row=document.createElement('div');row.className='gd-ag-lab-helpers';row.style.cssText='display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;padding:0;border:0';sheetPanel.append(row);
    const field=(parent,label,values,id)=>{const l=document.createElement('label');l.style.cssText='display:flex;align-items:center;gap:5px;font-size:12px';l.append(label);const input=document.createElement(values?'select':'input');input.className='gd-select';input.style.cssText='min-height:32px;height:32px;padding:3px 7px;font-size:12px';input.dataset.agWorkspace=id;
      if(values)for(const [value,name] of values){const o=document.createElement('option');o.value=value;o.textContent=name;input.append(o)}else{input.type='text';input.inputMode='none';input.autocomplete='off';input.maxLength=7;input.dataset.gdKeypad='dimension';input.setAttribute('aria-label',label);input.style.width='90px'}l.append(input);parent.append(l);return input};
    formatInput=field(row,'Paper',[['A4','A4'],['A5','A5'],['A3','A3'],['custom','Custom']],'format');
    orientationInput=field(row,'Orientation',[['landscape','Landscape'],['portrait','Portrait']],'orientation');
    gridInput=field(row,'Grid',[['0','Plain'],['5','5 mm'],['10','10 mm'],['20','20 mm']],'grid');
    const datumDetails=document.createElement('details');datumDetails.style.cssText='margin:4px 0;padding:5px 7px;border:1px solid #dce8e4;border-radius:7px';const datumSummary=document.createElement('summary');datumSummary.textContent='Coordinate reference';datumSummary.style.cssText='font:600 12px Arial,sans-serif;cursor:pointer';datumDetails.append(datumSummary);const datumGroup=document.createElement('div');datumGroup.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;padding:5px 0';datumDetails.append(datumGroup);for(const [key,label] of [['axes','Show axes'],['showOrigin','Show origin'],['graduations','Show graduations'],['coordinates','Point coordinates'],['snapAxes','Snap to axes'],['snapOrigin','Snap to origin'],['snapGrid','Snap to grid'],['snapDirection','Horizontal / vertical snap']]){const l=document.createElement('label');l.className='gd-ag-lab-option';l.style.cssText='font-size:11px;display:flex;align-items:center;gap:4px';const input=document.createElement('input');input.type='checkbox';input.dataset.agDatum=key;input.checked=datumState(st)[key];datumInputs[key]=input;input.onchange=()=>{cancelDraft();st.datum={...datumState(st),[key]:input.checked};changed()};l.append(input,label);datumGroup.append(l)}const datumNote=document.createElement('p');datumNote.style.cssText='margin:3px 0;font-size:11px;color:#536f68';datumNote.textContent='Coordinates in cm; positive y is up. The datum stays fixed as the paper or view changes.';datumDetails.append(datumNote);sheetPanel.append(datumDetails);const intersectionDetails=document.createElement('details');intersectionDetails.style.cssText=datumDetails.style.cssText;const intersectionSummary=document.createElement('summary');intersectionSummary.textContent='Intersections';intersectionSummary.style.cssText=datumSummary.style.cssText;intersectionDetails.append(intersectionSummary);for(const [key,label] of [['snap','Snap to intersections'],['show','Show intersections'],['auto','Create new intersection points automatically']]){const l=document.createElement('label');l.className='gd-ag-lab-option';l.style.cssText='display:flex;gap:5px;align-items:center;font-size:11px;margin:5px 0';const input=document.createElement('input');input.type='checkbox';input.dataset.agIntersection=key;input.checked=labIntersectionSettings(st)[key];intersectionInputs[key]=input;input.onchange=()=>{cancelDraft();st.intersectionOptions={...labIntersectionSettings(st),[key]:input.checked};changed()};l.append(input,label);intersectionDetails.append(l)}const note=document.createElement('p');note.style.cssText=datumNote.style.cssText;note.textContent='Preview markers are not named points. Use Point or Select to define one. Automatic creation applies only to new crossings on the visible sheet.';intersectionDetails.append(note);sheetPanel.append(intersectionDetails);
    customFields=document.createElement('div');customFields.className='gd-ag-lab-helpers';customFields.style.cssText='align-items:center;justify-content:center;gap:6px;padding:0;border:0';row.append(customFields);
    widthInput=field(customFields,'Width (mm)',null,'width');heightInput=field(customFields,'Height (mm)',null,'height');
    formatInput.onchange=()=>{customFields.hidden=formatInput.value!=='custom';customFields.style.display=formatInput.value==='custom'?'flex':'none';orientationInput.disabled=formatInput.value==='custom'};
    const apply=document.createElement('button');apply.type='button';apply.className='gd-btn gd-btn--primary';apply.textContent='Apply';apply.style.cssText='min-height:32px;padding:4px 10px;font-size:13px';apply.dataset.agWorkspace='apply';row.append(apply);
    sheetStatus=document.createElement('p');sheetStatus.className='gd-help';sheetStatus.setAttribute('role','status');sheetStatus.style.cssText='margin:3px 0 0;font-size:11px;text-align:center';sheetPanel.append(sheetStatus);
    apply.onclick=()=>{
      const width=Number(widthInput.value),height=Number(heightInput.value),format=formatInput.value,orientation=orientationInput.value,gridMm=Number(gridInput.value);
      const samePaper=format===ws.format&&(format==='custom'?width===ws.w/4&&height===ws.h/4:orientation===ws.orientation);
      // Grid changes are presentation settings, not requests to crop the board.
      // Keep the original paper and any expanded drawing extent, including on restore.
      if(samePaper){cancelDraft();ws={...ws,gridMm};grid=gridMm>0;st.workspace=fullBoard?boardWorkspace():{...ws};syncSheet();changed();}
      else{
        if(format==='custom'&&(!Number.isFinite(width)||!Number.isFinite(height)||width<50||height<50||width>650||height>650)){sheetStatus.textContent='Enter dimensions between 50 and 650 mm.';return}
        if(!resizeWorkspace({...workspaceSize(format,orientation,width,height),gridMm}))return;
      }
      sheetPanel.hidden=true;expandButton.setAttribute('aria-expanded','false');
    };
    svg.dataset.agFreeWorkspace='1';viewport.addEventListener('tt99-viewport-resize',e=>{if(fullBoard)return;const available=Math.max(120,e.detail.h-toolbar.offsetHeight-hint.offsetHeight-45);availableHeight=available;viewport.style.maxHeight=available+'px';sizeCanvas()});st.workspace={...ws};syncSheet();onChange(clone(st));if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(()=>{if(!svg.isConnected){observer.disconnect();return}sizeCanvas()});observer.observe(viewport)}
  }
  const angleTool=()=>['protractor','square45','square30'].includes(tool);
  const nearest=(p,skip=-1)=>{const a=st.points.map((q,i)=>({i,d:labDist(q,p)})).filter(x=>x.i!==skip).sort((a,b)=>a.d-b.d)[0];return a&&a.d<=tolerance()?a.i:-1};
  function tolerance(){const m=svg.getScreenCTM();return m?Math.min(42,20/Math.hypot(m.a,m.b)):20}
  const magnetic=(p,exclude=-1)=>{const hit=labSnap(st,p,tolerance(),snap,exclude,placing!==null?gestureSnap:null);if(placing!==null)gestureSnap=['Vertex','Intersection'].includes(hit.kind)?hit:null;if(hit.kind||!free||!snap)return hit;return datumSnap(st,p,Math.min(tolerance(),10/Math.max(.001,screenUnit)))};
  const drawingHit=p=>{if(finePending)return finePending.hit;let hit=magnetic(p);if(first===null)return hit;if(free&&snap&&['segment','ray','line'].includes(tool))hit=datumDirection(st,st.points[first],hit,Math.min(12,5/Math.max(.001,screenUnit)));if(tool==='segment'||tool==='compass'&&!keepOpening&&arcStart===null&&openingPickup===null)hit=labGraduationHit(st,st.points[first],hit,lengthGraduation);return hit};
  function point(p,resolved=null){const hit=resolved||magnetic(p);const i=st.points.findIndex(q=>labDist(q,hit.p)<.001);if(i>=0)return i;st.points.push(hit.p.slice());st.names.push(pointName(st.nextName++));return st.points.length-1}
  function finishGeometry(before){if(constructionSnapshot){const prior=constructionSnapshot;constructionSnapshot=null;const count=x=>x.segments.length+x.rays.length+x.circles.length;if(count(st)===count(prior.state)){st=prior.state;aperture=prior.aperture;paint();return}history.push(prior.state);redoHistory=[]}if(free&&before&&labIntersectionSettings(st).auto){for(const {p} of labNewIntersections(st,before,[viewX,viewY,ww,hh]))point(p,{p,kind:'Intersection'})}changed()}
  const beforeGeometry=()=>free&&labIntersectionSettings(st).auto?labIntersections(st):null;
  function changed(){labRayIds(st);const directions=st.rays.map(r=>labRayAngle(st,r));st.rays.forEach((r,i)=>{if(r.referenceArm&&Number.isFinite(directions[i]))r.angle=directions[i]});st.showMeasurements=measure;if(fullBoard)st.workspace=boardWorkspace();onChange(clone(st));paint()}
  function el(tag,attrs,txt){if(free&&['line','path','circle','polygon','polyline'].includes(tag)&&attrs['stroke-width']!=null&&attrs['vector-effect']==null){const w=Number(attrs['stroke-width']);attrs={...attrs,'stroke-width':attrs['data-ag-grid']?0.5:w>=9?4:w===3?2:w===1.8?1.5:w===1.2?1:w,'vector-effect':'non-scaling-stroke'};}const x=document.createElementNS(N,tag);for(const [k,v] of Object.entries(attrs))x.setAttribute(k,v);if(txt!=null)x.textContent=txt;svg.append(x);return x}
  function line(a,b,color='#284d46',w=2.5,dash=''){if(free&&dash&&w===1.8)w=1.25;el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:color,'stroke-width':w,'stroke-linecap':'round','stroke-dasharray':dash})}
  function text(p,t,color='#325a50',size=15){el('text',{x:p[0],y:p[1],fill:color,'font-size':size,'font-family':'Arial,sans-serif','text-anchor':'middle','paint-order':'stroke',stroke:'white','stroke-width':3},t)}
  function circle(p,r,stroke,fill='none',dash=''){el('circle',{cx:p[0],cy:p[1],r,stroke,fill,'stroke-width':2,'stroke-dasharray':dash})}
  let dimBoxes=[],dimLines=[],unplaced=[];
  function dim(a,b,value,color='#325a50',outside=null,preview=false,manualOffset=null,independent=false,key=null){const q=dimensionPlacement(a,b,value,{size:13,offset:independent?30:17,outside,manualOffset,lines:dimLines,occupied:dimBoxes,bounds:[viewX+5,viewY+5,viewX+ww-5,viewY+hh-5]});if(!q){if(!preview){const i=st.points.indexOf(a),j=st.points.indexOf(b);unplaced.push((i>=0&&j>=0?st.names[i]+st.names[j]+': ':'')+value)};return}dimBoxes.push(q.box);const active=free&&key&&selection?.dimensionKey===key,hit=free&&key&&tool==='select'&&!panMode?{'data-ag-dimension-key':key,cursor:'pointer'}:{};if(active)color='#b45309';if(independent){const guide=distanceGuide(a,b,q);el('path',{d:guide,fill:'none',stroke:color,'stroke-width':1.2,'data-ag-distance-guide':'1'});if(Object.keys(hit).length)el('path',{d:guide,fill:'none',stroke:'transparent','stroke-width':12,'vector-effect':'non-scaling-stroke','pointer-events':'stroke',...hit})}el('text',{x:q.p[0],y:q.p[1],fill:color,'font-size':13,'font-family':'Arial,sans-serif','text-anchor':'middle','dominant-baseline':'central',transform:'rotate('+q.angle+' '+q.p.join(' ')+')','data-ag-dimension':'1',...hit,...(Object.keys(hit).length?{'pointer-events':'bounding-box','aria-label':'Edit length '+value}:{})},value)}
  function segment(a,b,color='#285c52',outside=null){line(a,b,color,3);if(measure)dim(a,b,(labDist(a,b)/LAB_UNIT).toFixed(labMeasurementDigits(st))+' cm',color,outside)}
  // Instrument is anchored to the chosen vertex and aligned to a direction
  // selected by the pupil. The triangle edges, not target angles, determine rays.
  function instrument(o,base){
   if(tool==='protractor'){
    G.instruments.protractor(svg,{x:o[0],y:o[1],radius:170,start:base,direction:hand});
   }else drawSquare(svg,o,base,tool,corner,hand);
   if(!finePending)localInstrumentActions(svg,o,tool==='protractor'?'Protractor':(tool==='square45'?[90,45,45]:[90,30,60])[corner]+'° corner',[tool==='protractor'?null:['corner','Change corner','corner',()=>{corner=(corner+1)%3;paint()}],['mirror','Mirror','flip',()=>{hand=-hand;paint()}],['reverse','Rotate 180°','reset',()=>{aligned=mod(aligned+180);paint()}]].filter(Boolean),'agGuidedAction');
  }
  function selectedAngle(o,p,hit=null){
   const a=labAngle(o,p),base=aligned??0,relative=mod(hand*(a-base));
   if(tool==='protractor'){const exact=['Vertex','Intersection','On line','On circle','On arc','Arc endpoint','Fine adjustment'].includes(hit?.kind);return labProtractorDirection(st,base,relative,hand,free,exact?0:angleGraduation)}
   const choices=[0,(tool==='square45'?[90,45,45]:[90,30,60])[corner]];
   // Actual set-square orientation is adjusted below to show the chosen edge.
   const diff=(x,y)=>Math.min(mod(x-y),mod(y-x));return mod(base+hand*choices.reduce((x,y)=>diff(y,relative)<diff(x,relative)?y:x));
  }
  const helpSteps={
   select:['Select an existing point, line, ray or circle.','To mark an angle, select its vertex, choose Mark angle and tap a faint arc.','Choose Measured angle or a custom value in the editor and Apply. To use a physical measuring instrument instead, open Measure.'],
   move:['Select Move.','Drag a vertex; connected marks follow it, but equal sides or right angles may be lost.','Compare the altered shape with the original. Use Undo to restore it.'],
   trace:['Select Trace.','Tap an existing point to switch its trace on or off.','Select Move and drag that point to record its path. Clear traces removes paths without altering geometry.'],
   point:['Select Point.','Touch near an endpoint or crossing. The magnetic highlight shows the exact snap position.','Place the point. You can now join other lines to it.'],
   segment:['Select Ruler.','Tap the starting point.','Touch the ending point, slide to refine the length, and release. A straight segment joins the two points.'],
   ray:['Select Ray.','Tap the origin.','Choose a second point to define the ray, or enter an absolute direction measured anticlockwise from +x.'],
   line:['Select Line.','Tap the first defining point.','Choose a second point or an exact direction. The line extends indefinitely in both directions.'],
   protractor:['Select Draw angle to construct a new ray. To measure existing geometry instead, open Measure and add a protractor.','Tap the vertex, then tap along the reference line to align the zero edge.','Read the graduations from that edge. Touch the required direction and release to draw the ray.'],
   square45:['Select the 45° set square.','Choose a corner, tap a vertex and align the reference edge. Use Mirror if the instrument faces the wrong way.','Draw along the other edge of the triangle. The tool has two 45° corners and one 90° corner.'],
   square30:['Select the 30°–60° set square.','Choose the appropriate corner, tap a vertex and align the reference edge. Use Mirror if needed.','Draw along the other edge. This instrument has 30°, 60° and 90° corners.'],
   compass:['Select Compass. Tap the centre.','Slide to set the radius using its readout, or snap to an existing point. Release to draw a circle.','Choose Keep opening to transfer the same radius to a new centre. Mark intersections with Point. Use Undo or Erase to correct existing marks.'],
   shade:['Select Shade.','Tap at least three existing vertices in perimeter order.','Choose a colour and apply shading. Use Undo or Remove last region to correct it.'],
   erase:['Select Erase.','Tap the object you want to remove. A point and its attached objects are removed together.','Undo restores the previous construction. Given challenge baselines are protected.']
  };
  function guideGraphic(step){
   // This sample is isolated from pupil work, and is available only in free mode.
   const sample=labEmpty();const A=sample.points[0],B=sample.points[1],C=polar(...A,180,40);
   if(tool==='segment'||tool==='erase'||tool==='point'){
    if(step>=1)sample.points.push(C);
    if((tool==='segment'&&step===2)||tool==='erase'&&step===1)sample.segments.push([0,2]);
    if(tool==='erase'&&step===2)sample.points.pop();
   }else if(tool==='compass'){if(step>=1)sample.circles.push({i:0,r:180});if(step===2){sample.rays.push({i:0,angle:40});sample.points.push(C)}}
   else if(tool==='ray'||tool==='line'){if(step>=1)sample.points.push(C);if(step===2)sample.rays.push({i:0,angle:40,infinite:tool==='line'})}
   else if(step===2)sample.rays.push({i:0,angle:tool==='square45'?45:tool==='square30'?30:40});
   const picture=diagram({type:'diagram',mode:'construct',labDrawing:sample},true);picture.setAttribute('aria-label','Worked example of '+tool);
   picture.style.cssText='width:100%;max-height:230px;display:block';
   if(step>=1&&tool==='segment'){G.instruments.ruler(picture,{x:A[0],y:A[1],width:240,length:6,height:44,tickHeight:23,angle:40,labelSize:11});}
   if(step>=1&&['protractor','square45','square30'].includes(tool)){
    const add=(tag,attrs,content)=>{const e=document.createElementNS(N,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(content!=null)e.textContent=content;picture.append(e);return e};
    if(tool==='protractor'){G.instruments.protractor(picture,{x:A[0],y:A[1],radius:170,start:0});}
    else{const a=tool==='square45'?45:30,v=polar(...A,150,0),w=polar(...A,150/Math.cos(a*D),a);add('polygon',{points:[A,v,w].map(p=>p.join(',')).join(' '),fill:'#c5e3da','fill-opacity':.6,stroke:'#458778','stroke-width':2});const p=polar(...A,42,a/2);add('text',{x:p[0],y:p[1]+4,'font-size':15,fill:'#285d51'},a+'°')}
    if(step===2){const p=polar(...A,200,tool==='square45'?45:tool==='square30'?30:40);add('line',{x1:A[0],y1:A[1],x2:p[0],y2:p[1],stroke:'#b77b32','stroke-width':3})}
   }
   return picture;
  }
  let guideKey='';
  function paintGuide(){
   guideButton.setAttribute('aria-expanded',String(guideOpen));guide.hidden=!guideOpen;
   if(fullBoard&&guideOpen&&!panelsHidden&&!helpPanel){helpPanel=geometryPalette(toolbar,'Instrument help',[guide],'calc(100% - 325px)','240px',{collapsible:false,onClose:()=>{guideOpen=false;paint()}})}
   if(helpPanel&&(!guideOpen||panelsHidden||!fullBoard)){box.append(guide);helpPanel.remove();helpPanel=null}
   if(helpPanel)clampGeometryPanel(toolbar,helpPanel);
   const key=[guideOpen,tool,guideStep,free].join(':');if(key===guideKey)return;guideKey=key;
   if(!guideOpen){guide.replaceChildren();return}
   const steps=helpSteps[tool],header=document.createElement('strong');header.textContent=controls.find(c=>c[0]===tool)?.[2]||'Using the tool';
   const body=document.createElement('div');body.className='gd-ag-guide-body';
   const list=document.createElement('ol');steps.forEach((t,i)=>{const li=document.createElement('li');li.textContent=t;if(free&&i===guideStep)li.className='is-current';list.append(li)});body.append(list);
   if(free){const demo=document.createElement('div');demo.className='gd-ag-guide-example';demo.append(guideGraphic(guideStep));const nav=document.createElement('div');nav.className='gd-row';const prev=document.createElement('button'),next=document.createElement('button'),read=document.createElement('span');for(const b of [prev,next]){b.className='gd-btn';b.type='button'}prev.textContent='Previous';prev.disabled=guideStep===0;prev.onclick=()=>{guideStep--;paintGuide()};next.textContent=guideStep===2?'Replay':'Next step';next.onclick=()=>{guideStep=(guideStep+1)%3;paintGuide()};read.textContent='Step '+(guideStep+1)+' / 3';nav.append(prev,read,next);demo.append(nav);body.append(demo)}
   guide.replaceChildren(header,body);
  }
  function paint(){
   precisionInput.value=String(labMeasurementDigits(st));
   // A ghost sector is valid only while its selected vertex and visible arms remain available.
   if(anglePicking!==null&&(tool!=='select'||selection?.kind!=='points'||selection.index!==anglePicking||!labAngleSectors(st,anglePicking).length))anglePicking=null;if(selection?.kind!=='points'&&!notationMode)manualAngle=false;if(anglePicking===null){angleArmMode=false;pickedArms=[]}
   regionBar.hidden=tool!=='shade';regionBar.style.display=tool==='shade'?'flex':'none';shadeModeButton.textContent=shadeMode==='region'?'By enclosed region':'By vertices';applyRegion.hidden=clearRegion.hidden=shadeMode!=='vertices';applyRegion.disabled=!validRegion(st.points,regionPick);removeRegion.disabled=!st.regions.length;colourButtons.forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===regionColour));b.style.outline=i===regionColour?'2px solid #263e43':'none'});
   if(panButton){panButton.setAttribute('aria-pressed',String(panMode));panButton.classList.toggle('gd-btn--primary',panMode);svg.style.cursor=panMode?'grab':''}if(resetViewButton)resetViewButton.hidden=Math.abs(viewX)+Math.abs(viewY)<1e-8;
   fineLabel.hidden=panMode||!((tool==='protractor'&&angleGraduation>0)||(lengthGraduation>0&&(tool==='segment'||tool==='compass'&&!keepOpening&&arcStart===null&&openingPickup===null)));fineInput.checked=fineMode;angleGraduationLabel.hidden=panMode||tool!=='protractor';angleGraduationInput.value=String(angleGraduation);graduationLabel.hidden=panMode||!(tool==='segment'||tool==='compass'&&!keepOpening&&arcStart===null&&openingPickup===null);graduationInput.value=String(lengthGraduation);openingButton.hidden=tool!=='compass';openingButton.disabled=aperture===null;openingButton.setAttribute('aria-pressed',String(keepOpening));openingButton.querySelector('span').textContent=keepOpening?'Change opening':'Keep opening';openingButton.title=aperture===null?'Choose an opening':(keepOpening?'Retained: ':'Previous opening: ')+(aperture/LAB_UNIT).toFixed(labMeasurementDigits(st))+' cm';pickupButton.hidden=tool!=='compass';pickupButton.disabled=st.points.length<2&&!st.circles.some(c=>labVisible(st,'circles',c));pickupButton.setAttribute('aria-pressed',String(openingPickup!==null));pickupButton.querySelector('span').textContent=openingPickup!==null?'Cancel pickup':'Pick up opening';arcButton.hidden=tool!=='compass';arcButton.querySelector('span').textContent=arcMode?'Arc':'Full circle';arcButton.setAttribute('aria-pressed',String(arcMode));arcDirection.hidden=tool!=='compass'||!arcMode;arcDirection.querySelector('span').textContent=arcClockwise?'Clockwise':'Anticlockwise';
   notationBar.hidden=!(free&&tool==='select'&&(notationMode||labelPlacement));notationBar.style.display=notationBar.hidden?'none':'flex';notationSelect.hidden=parallelSelect.hidden=symmetryMark.hidden=selection?.kind!=='segments';const lineMarks=selection?.kind==='segments'?labLineMarks(st,st.segments[selection.index]):{equal:0,parallel:0,symmetry:false};notationSelect.value=lineMarks.equal?'equal'+lineMarks.equal:'';parallelSelect.value=String(lineMarks.parallel);symmetryMark.textContent=lineMarks.symmetry?'Remove symmetry mark':'Mark symmetry axis';symmetryMark.setAttribute('aria-pressed',String(lineMarks.symmetry));angleSelect.value=notationMode;cancelNotation.hidden=!notationMode;labelCancel.hidden=!labelPlacement;cancelAnglePick.hidden=anglePicking===null;chooseDirections.hidden=anglePicking===null;chooseDirections.textContent=angleArmMode?'Show all sectors':'Choose two arms';anglePickStatus.hidden=anglePicking===null;resetArms.hidden=anglePicking===null||!angleArmMode||!pickedArms.length;anglePickStatus.textContent=angleArmMode?(pickedArms.length<2?pickedArms.length+'/2 arms selected · Tap '+(pickedArms.length?'the second':'the first')+' line or ray direction.':'2/2 arms selected · Tap inside either angular region or choose a side below.'):'Tap a preview arc, or choose two arms for a specific angle.';const sides=angleArmMode&&pickedArms.length===2?currentSectors():[];sideButtons.forEach((b,i)=>{const q=sides[i];b.hidden=!q;if(q){b.textContent=Math.abs(q.sweep-180)<.01?(i===0?'Side 1':'Side 2'):q.sweep>180?'Reflex side':'Smaller side';b.setAttribute('aria-label','Mark '+b.textContent);b.onpointerenter=()=>{hover=polar(...st.points[anglePicking],60/G.instruments.screenScale(svg),q.from+q.sweep/2);paint()};b.onpointerleave=()=>{hover=null;paint()}}});
   const selected=selection&&st[selection.kind]?.[selection.index];
   rayControls.style.display=free&&['ray','line'].includes(tool)&&!panMode?'flex':'none';rayCommit.textContent=tool==='line'?'Draw line':'Draw ray';rayModeInput.setAttribute('aria-label',tool==='line'?'Line definition':'Ray definition');rayModeInput.value=rayMode;rayAngleInput.hidden=rayCommit.hidden=rayMode!=='absolute';rayCommit.disabled=first===null||!Number.isFinite(rayAngleInput.valueAsNumber);
   rayStatus.textContent=rayMode==='absolute'?(first===null?'Select an origin, then enter a direction.':'Direction in degrees, anticlockwise from +x.'):(first===null?'Select or place the origin.':'Select or place the second point.');
   rayDefinitionText.hidden=!(free&&tool==='select'&&selection?.kind==='rays'&&selected&&!panMode);
   if(!rayDefinitionText.hidden){const d=labRayDefinition(st,selected);const name=n=>labPointText(st,st.names.indexOf(n));const noun=selected.infinite?'Line':'Ray';rayDefinitionText.textContent=d.kind==='through-point'?noun+' '+name(d.origin)+' through '+name(d.reference):d.kind==='relative-object'?noun+' at '+(Math.round(d.offset*100)/100)+'° from its reference '+(d.referenceArm.kind==='ray'?'straight object':'segment'):d.kind==='relative-angle'?noun+' at '+(Math.round(d.offset*100)/100)+'° from '+name(d.origin)+name(d.reference):noun+' through '+name(d.origin)+' · '+(Math.round(d.angle*100)/100)+'° from +x'}
   styleBar.hidden=!(free&&!panMode&&(tool==='select'&&selected||Object.hasOwn(newStyles,tool)));styleBar.style.display=styleBar.hidden?'none':'flex';visibleInput.checked=st.showConstruction!==false;const selectedPoint=!!selected&&selection.kind==='points';styleButtons.forEach(b=>b.hidden=selectedPoint);pointTrace.hidden=!selectedPoint||!motion;if(selectedPoint){styleText.textContent='Point '+labPointText(st,selection.index);pointTrace.setAttribute('aria-pressed',String(!!st.traceNames?.includes(st.names[selection.index])));pointTrace.querySelector('span').textContent=st.traceNames?.includes(st.names[selection.index])?'Stop tracing':'Trace point'}else if(selected){styleText.textContent=(selection.kind==='circles'&&isLabArc(selected)?'Arc':({segments:'Segment',rays:selected.infinite?'Line':'Ray',circles:'Circle'})[selection.kind])+' style';styleButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(labConstruction(st,selection.kind,selected)===Boolean(i))))}else if(Object.hasOwn(newStyles,tool)){styleText.textContent='New '+({segment:'segment',ray:'ray',line:'line',compass:'circle'})[tool];styleButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(newStyles[tool]===Boolean(i))))}
   if(free){
     const contextual=!!selected&&tool==='select'&&!panMode&&!labelPlacement;const directDimension=!!selection?.dimensionKey,directMark=selection?.markFamily;
     const destination=contextual?menuBody:styleBar;
     const titleDestination=contextual?menuTitle:styleBar;if(styleText.parentNode!==titleDestination)titleDestination.append(styleText);
     for(const node of [...styleButtons,pointTrace,notationSelect,parallelSelect,symmetryMark])if(node.parentNode!==destination)destination.append(node);
     for(const node of [angleSelect,angleLabelSelect,angleLabelInput]){const dest=contextual&&selectedPoint?menuBody:notationBar;if(node.parentNode!==dest)dest.append(node)}
     const showManual=false;angleSelect.hidden=!showManual;angleLabelSelect.hidden=!showManual;angleLabelInput.hidden=!showManual||angleLabelSelect.value!=='custom';
     const d=selectedDimension(),entry=d?st.dimensionLabels?.[d.key]:null;dimensionSelect.hidden=!(contextual&&d);dimensionSelect.value=entry?.mode||'auto';dimensionInput.value=entry?.text||'';dimensionInput.hidden=dimensionApply.hidden=dimensionSelect.hidden||dimensionSelect.value!=='custom';dimensionMove.hidden=dimensionSelect.hidden||!selectedDimension()?.value;dimensionReset.hidden=dimensionSelect.hidden||!entry?.offset;dimensionRemove.hidden=!(contextual&&directDimension&&d?.value);
     chooseAngle.hidden=!(contextual&&selectedPoint&&labAngleSectors(st,selection.index).length);labelEdit.hidden=!(contextual&&selectedPoint);const editing=contextual&&selectedPoint&&pointEditor===st.names[selection.index];labelEdit.setAttribute('aria-expanded',String(editing));for(const node of [labelInput,labelApply,labelMove,labelReset])node.hidden=!editing;
     const marks=selectedPoint?(st.angleNotation||[]).map((m,i)=>({m,i})).filter(({m})=>m.names[1]===st.names[selection.index]):[];if(!marks.some(x=>x.i===angleEditor))angleEditor=null;const markCaption=m=>{const data=labAngleAnnotation(st,m),suffix=data?.angle>180?' (reflex)':Math.abs((data?.angle??0)-180)<.01?' (straight)':'';return (m.names.every(n=>n!==null)?'∠'+m.names.map(n=>labPointText(st,st.names.indexOf(n))).join(''):'Angle at '+labPointText(st,st.names.indexOf(m.names[1])))+suffix+(m.names.includes(null)&&data?' · '+Math.round(data.from)+'° direction':'')};const markKey=JSON.stringify(marks.map(({m,i})=>[i,markCaption(m)]));if(angleExisting.dataset.key!==markKey){angleExisting.dataset.key=markKey;angleExisting.replaceChildren();for(const [v,l] of [['','Edit angle…'],...marks.map(({m,i})=>[String(i),markCaption(m)])]){const o=document.createElement('option');o.value=v;o.textContent=l;angleExisting.append(o)}}angleExisting.value=angleEditor===null?'':String(angleEditor);const page=contextual&&directMark?'line-mark':contextual&&directDimension?'dimension':contextual&&selectedPoint?(anglePicking!==null?'pick-angle':currentAngle()?'angle':editing?'point-label':'root'):'root';localStyle.dataset.agSelectionPage=page;menuBack.hidden=page==='root'||page==='dimension'||page==='line-mark';if(page!=='root')styleText.textContent=page==='angle'?'Edit angle':page==='point-label'?'Point label':'Mark angle';const root=page==='root';distanceSelect.hidden=!(contextual&&selectedPoint&&root&&st.points.length>1);if(!distanceSelect.hidden){const opts=st.names.filter((_,i)=>i!==selection.index);const key=JSON.stringify(opts.map(n=>[n,labPointText(st,st.names.indexOf(n))]));if(distanceSelect.dataset.key!==key){distanceSelect.dataset.key=key;distanceSelect.replaceChildren();for(const [v,l] of [['','Measure distance to…'],...opts.map(n=>[n,labPointText(st,st.names.indexOf(n))])]){const o=document.createElement('option');o.value=v;o.textContent=l;distanceSelect.append(o)}}distanceSelect.value=distancePair?.[0]===st.names[selection.index]?distancePair[1]:''}if(!root&&selectedPoint&&!directDimension)dimensionSelect.hidden=dimensionInput.hidden=dimensionApply.hidden=dimensionMove.hidden=dimensionReset.hidden=true;chooseAngle.hidden=chooseAngle.hidden||!root;labelEdit.hidden=labelEdit.hidden||!root;pointTrace.hidden=pointTrace.hidden||!root;angleExisting.hidden=!(contextual&&marks.length&&(root||page==='angle'));angleEditBox.style.display=page==='angle'?'flex':'none';editText.hidden=editMode.value!=='custom';
     styleBar.style.display=!contextual&&!styleBar.hidden?'flex':'none';
     localStyle.style.display=contextual?'flex':'none';
     for(const b of inkButtons){b.hidden=!contextual||selectedPoint;const active=!!selected&&!selectedPoint&&(labInk(st,selection.kind,selected)||null)===LAB_INK[b.dataset.agInk];b.setAttribute('aria-pressed',String(active));b.style.outline=active?'2px solid #325a50':'none'}
     lineMarkRemove.hidden=!(contextual&&directMark);
     if(contextual&&directMark){styleText.textContent=directMark==='equal'?'Equal-length mark':'Parallel mark';for(const node of [...styleButtons,...inkButtons,symmetryMark,rayDefinitionText,pointTrace,dimensionSelect,dimensionInput,dimensionApply,dimensionMove,dimensionReset,dimensionRemove])node.hidden=true;notationSelect.hidden=directMark!=='equal';parallelSelect.hidden=directMark!=='parallel'}
     if(contextual&&directDimension){styleText.textContent='Length '+d.edge.map(i=>labPointText(st,i)).join('–');for(const node of [...styleButtons,...inkButtons,notationSelect,parallelSelect,symmetryMark,rayDefinitionText,pointTrace])node.hidden=true}
     if(contextual){
       const anchor=directDimension?selectionAnchor:selectedPoint?st.points[selection.index]:selectionAnchor;
       const matrix=svg.getScreenCTM(),v=viewport.getBoundingClientRect();
       localStyle.style.maxWidth=Math.max(0,viewport.clientWidth-12)+'px';localStyle.style.maxHeight=Math.max(0,viewport.clientHeight-12)+'px';
       if(menuPosition){menuPosition=positionMenu(menuPosition.x,menuPosition.y)}else if(anchor&&matrix){
         const p=new DOMPoint(...anchor).matrixTransform(matrix),x=p.x-v.left-viewport.clientLeft,y=p.y-v.top-viewport.clientTop,w=localStyle.offsetWidth,h=localStyle.offsetHeight;
         if(x<0||y<0||x>viewport.clientWidth||y>viewport.clientHeight)localStyle.style.display='none';
         else{const clearance=anglePicking!==null?100:18,right=x+clearance,left=x-w-clearance;if(right+w<=viewport.clientWidth-6)positionMenu(right,y-24);else if(left>=6)positionMenu(left,y-24);else positionMenu(x-w/2,y-h-clearance>=6?y-h-clearance:y+clearance)}
       }else localStyle.style.display='none';
     }
   }
   paintGuide();cornerButton.hidden=!tool.startsWith('square')||aligned!==null;const flip=toolbar.querySelector('[data-ag-flip]');flip.hidden=true;rotateButton.hidden=true;
   movementInput.checked=motion;const clearTrace=toolbar.querySelector('[data-ag-tool="clear-traces"]');if(clearTrace)clearTrace.hidden=!motion;buttons.forEach(([id,b])=>{if(['move','trace'].includes(id))b.hidden=!motion;b.classList.toggle('gd-btn--primary',!panMode&&id===tool);b.setAttribute('aria-pressed',String(!panMode&&id===tool))});undoButton.disabled=!draft&&boardPointer()===null&&history.length===0;redoButton.disabled=!!draft||boardPointer()!==null||redoHistory.length===0;if(cancelToolButton)cancelToolButton.hidden=tool==='select'&&!panMode;
   svg.replaceChildren();dimLines=labLines(st).map(l=>[l.infinite?labAt(l.a,l.v,-1200):l.a,l.ray?labAt(l.a,l.v,1200):l.b]);const annotationPlan=labAnnotationPlan(st,free?[ws.x||0,ws.y||0,(ws.x||0)+ws.w,(ws.y||0)+ws.h]:[0,0,800,400]);dimBoxes=annotationPlan.boxes.slice();unplaced=[];el('rect',{x:viewX,y:viewY,width:ww,height:hh,fill:'#fff'});
   if(grid&&fullBoard){const step=ws.gridMm*4,defs=el('defs',{}),pattern=document.createElementNS(N,'pattern');pattern.setAttribute('id','ag-full-grid');pattern.setAttribute('width',step);pattern.setAttribute('height',step);pattern.setAttribute('patternUnits','userSpaceOnUse');pattern.setAttribute('x',datumState(st).origin[0]);pattern.setAttribute('y',datumState(st).origin[1]);const path=document.createElementNS(N,'path');path.setAttribute('d','M '+step+' 0 H 0 V '+step);path.setAttribute('fill','none');path.setAttribute('stroke','#e1ebe6');path.setAttribute('stroke-width',String(.5/G.instruments.screenScale(svg)));pattern.append(path);defs.append(pattern);el('rect',{x:viewX,y:viewY,width:ww,height:hh,fill:'url(#ag-full-grid)','data-ag-grid':'1'})}else if(grid){const step=free?ws.gridMm*4:40;for(let x=datumGridStart(viewX,free?datumState(st).origin[0]:20,step);x<viewX+ww;x+=step)el('line',{x1:x,y1:free?viewY:viewY+22,x2:x,y2:free?viewY+hh:viewY+hh-18,stroke:'#e1ebe6','stroke-width':1,'data-ag-grid':'1'});for(let y=datumGridStart(viewY,free?datumState(st).origin[1]:22,step);y<viewY+hh;y+=step)el('line',{x1:free?viewX:viewX+20,y1:y,x2:free?viewX+ww:viewX+ww-20,y2:y,stroke:'#e1ebe6','stroke-width':1,'data-ag-grid':'1'})}
   if(free)datumGraphic(st,[viewX,viewY,ww,hh],el);
   if(free&&['ray','line'].includes(tool)&&rayMode==='absolute'&&first!==null&&Number.isFinite(rayAngleInput.valueAsNumber)&&!panMode){const o=st.points[first];line(...labStraightEnds(o,mod(rayAngleInput.valueAsNumber),[viewX,viewY,ww,hh],tool==='line'),'#b77b32',2,'5 4')}
   if(free)for(const trail of Object.values(st.traces||{}))for(const points of traceParts(trail)){el('polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#b56d2c','stroke-width':2,'stroke-dasharray':'4 3','data-ag-trace':'1'})}
   for(const region of labRegionShapes(st)){const attrs={fill:REGION_COLOURS[region.colour]||REGION_COLOURS[0],'fill-opacity':.32,stroke:'none','data-ag-region':'1'};if(region.circle)el('circle',{...attrs,cx:region.circle.p[0],cy:region.circle.p[1],r:region.circle.r});else if(region.path)el('path',{...attrs,d:region.path,'fill-rule':'evenodd'});else el('polygon',{...attrs,points:region.points.map(p=>p.join(',')).join(' ')})}
   if(tool==='shade'&&regionPick.length>=2)el('polygon',{points:regionPick.map(i=>st.points[i].join(',')).join(' '),fill:validRegion(st.points,regionPick)?REGION_COLOURS[regionColour]:'none','fill-opacity':.15,stroke:REGION_COLOURS[regionColour],'stroke-width':2,'stroke-dasharray':'5 4'});
   for(const [k,c] of st.circles.entries())if(labVisible(st,'circles',c)){const cons=labConstruction(st,'circles',c);const color=labInk(st,'circles',c)||(cons?'#a97830':'#285c52');if(selection?.kind==='circles'&&selection.index===k){if(isLabArc(c))el('path',{d:labArcPath(st.points[c.i],c),fill:'none',stroke:'#e6ad55','stroke-opacity':.5,'stroke-width':9});else el('circle',{cx:st.points[c.i][0],cy:st.points[c.i][1],r:c.r,fill:'none',stroke:'#f5d49e','stroke-width':9})}if(isLabArc(c))el('path',{d:labArcPath(st.points[c.i],c),fill:'none',stroke:color,'stroke-width':cons?1.8:3,'stroke-dasharray':cons?'5 4':'','data-ag-compass-arc':'1'});else circle(st.points[c.i],c.r,color,'none',cons?'5 4':'')}
   for(const [k,r] of st.rays.entries())if(labVisible(st,'rays',r)){const cons=labConstruction(st,'rays',r);if(selection?.kind==='rays'&&selection.index===k)line(...labStraightEnds(st.points[r.i],labRayAngle(st,r),[viewX,viewY,ww,hh],r.infinite),'#f5d49e',9);line(...labStraightEnds(st.points[r.i],labRayAngle(st,r),[viewX,viewY,ww,hh],r.infinite),labInk(st,'rays',r)||'#63978a',cons?1.8:3,cons?'7 5':'')}
   if(st.given!==false&&st.points.length>=2){line(st.points[0],st.points[1],'#283f3a',4);dim(st.points[0],st.points[1],'6 cm','#325a50',[460,360])}
   for(const [k,edge] of st.segments.entries()){if(!labVisible(st,'segments',edge))continue;const [i,j]=edge,cons=labConstruction(st,'segments',edge),color=labInk(st,'segments',edge)||(cons?'#a97830':'#285c52');if(selection?.kind==='segments'&&!selection.dimensionKey&&!selection.markFamily&&selection.index===k)line(st.points[i],st.points[j],'#f5d49e',9);line(st.points[i],st.points[j],color,cons?1.8:3,cons?'5 4':'');const value=labDimensionText(st,i,j,!cons&&measure);if(value)dim(st.points[i],st.points[j],value,color,labOutside(st,i,j),false,st.dimensionLabels?.[labStyleKey(st,i,j)]?.offset,false,labStyleKey(st,i,j))}
   for(const d of labIndependentDimensions(st)){const [i,j]=d.ids;dim(st.points[i],st.points[j],d.value,'#325a50',null,false,d.offset,true,d.key)}
   annotationPlan.renderNotation((d,k,m,mark)=>{const index=m?st.angleNotation.indexOf(m):-1,active=free&&tool==='select'&&(index>=0&&angleEditor===index&&selection?.kind==='points'||mark&&selection?.markFamily===mark.family&&selection.kind==='segments'&&labStyleKey(st,...st.segments[selection.index])===mark.key);el('path',{d,fill:'none',stroke:active?'#b45309':'#287f6c','stroke-width':active?3:1.8,'stroke-dasharray':k==='symmetry'?'8 4 2 4':'','data-ag-notation':k});if(free&&tool==='select'&&!panMode&&index>=0)el('path',{d,fill:'none',stroke:'transparent','stroke-width':14,'vector-effect':'non-scaling-stroke','pointer-events':'stroke','data-ag-angle-annotation':index,cursor:'pointer','aria-label':'Edit angle mark'});if(free&&tool==='select'&&!panMode&&mark)el('path',{d,fill:'none',stroke:'transparent','stroke-width':10,'vector-effect':'non-scaling-stroke','pointer-events':'stroke','data-ag-line-mark-key':mark.key,'data-ag-line-mark-family':mark.family,cursor:'pointer','aria-label':mark.family==='equal'?'Edit equal-length mark':'Edit parallel mark'})},(p,v,m)=>{const index=st.angleNotation.indexOf(m),active=free&&tool==='select'&&angleEditor===index&&selection?.kind==='points';el('text',{x:p[0],y:p[1],fill:active?'#b45309':'#325a50','font-size':13,'text-anchor':'middle','dominant-baseline':'central','paint-order':'stroke',stroke:'#fff','stroke-width':3,'data-ag-annotation-value':'1',...(free&&tool==='select'&&!panMode?{'data-ag-angle-annotation':index,'pointer-events':'bounding-box',cursor:'pointer','aria-label':'Edit angle '+v}:{})},v)});
   if(free&&labIntersectionSettings(st).show){const scale=G.instruments.screenScale(svg);for(const {p} of labIntersections(st,{axes:true}))if(!st.points.some(q=>labDist(q,p)<.001)&&p[0]>=viewX&&p[0]<=viewX+ww&&p[1]>=viewY&&p[1]<=viewY+hh)el('circle',{cx:p[0],cy:p[1],r:4/scale,fill:'white',stroke:'#b77925','stroke-width':1.5,'vector-effect':'non-scaling-stroke','pointer-events':'none','data-ag-intersection-preview':'1'})}
   if(anglePicking!==null&&!panMode){
     const o=st.points[anglePicking],scale=G.instruments.screenScale(svg),sectors=currentSectors();
     if(o&&angleArmMode)labAngleArms(st,anglePicking).forEach((a,i)=>{const p=polar(...o,54/scale,a.angle),chosen=pickedArms.includes(i);if(pickedArms.length===2&&!chosen)return;el('line',{x1:o[0],y1:o[1],x2:p[0],y2:p[1],stroke:chosen?'#16796e':'#a0bcb6','stroke-width':chosen?4:2,'vector-effect':'non-scaling-stroke','pointer-events':'none',...(chosen?{'data-ag-selected-arm':i}:{})});el('circle',{cx:p[0],cy:p[1],r:chosen?7/scale:9/scale,fill:chosen?'#16796e':'white',stroke:'#16796e','stroke-width':2,'vector-effect':'non-scaling-stroke','data-ag-direction-choice':i,cursor:'pointer','aria-label':'Choose direction '+(i+1)})});
     if(o)sectors.forEach((sector,i)=>{const preview=labSectorPreview(sectors,i),r=preview.radius/scale,a=polar(...o,r,preview.from),b=polar(...o,r,preview.from+preview.sweep),path='M '+a.join(' ')+' A '+r+' '+r+' 0 '+(preview.sweep>180?1:0)+' 0 '+b.join(' '),hit=hover&&(angleArmMode&&pickedArms.length===2?labDist(hover,o)*scale>12&&mod(labAngle(o,hover)-sector.from)<sector.sweep:Math.abs(labDist(hover,o)*scale-preview.radius)<=10&&mod(labAngle(o,hover)-preview.from)<=preview.sweep);if(hit&&angleArmMode&&pickedArms.length===2){const p=polar(...o,r,sector.from),q=polar(...o,r,sector.from+sector.sweep);el('path',{d:'M '+o.join(' ')+' L '+p.join(' ')+' A '+r+' '+r+' 0 '+(sector.sweep>180?1:0)+' 0 '+q.join(' ')+' Z',fill:'#168c79','fill-opacity':.16,stroke:'none','pointer-events':'none','data-ag-angle-region-preview':i})}if(hit&&sector.sweep>180&&sectors.length>2){const p=polar(...o,r,sector.from),q=polar(...o,r,sector.from+sector.sweep);el('path',{d:'M '+p.join(' ')+' A '+r+' '+r+' 0 1 0 '+q.join(' '),fill:'none',stroke:'#16796e','stroke-width':2,'vector-effect':'non-scaling-stroke','pointer-events':'none'})}
       el('path',{d:path,fill:'none',stroke:hit?'#16796e':'#86aaa3','stroke-width':hit?3:2,'stroke-dasharray':hit?'':'4 3','vector-effect':'non-scaling-stroke','pointer-events':'none','data-ag-ghost-angle':i});
       el('path',{d:path,fill:'none',stroke:'transparent','stroke-width':20,'vector-effect':'non-scaling-stroke','pointer-events':'stroke','data-ag-angle-choice':i,cursor:'pointer','aria-label':'Choose '+(sector.sweep>180?'reflex ':'')+labSectorCaption(st,sector)});
     });
   }
   if(notationMode&&notationVertex!==null){const o=st.points[notationVertex];if(o){circle(o,12,'#b45309','none');for(const i of notationPick)line(o,st.points[i],'#b45309',3);if(hover){const i=nearest(hover);if(i>=0&&i!==notationVertex&&!notationPick.includes(i))line(o,st.points[i],'#b45309',2,'4 3')}}}
   annotationPlan.renderAutomatic((d,p,v)=>{el('path',{d,fill:'none',stroke:'#287f6c','stroke-width':1.8,'data-ag-angle-mark':'1'});el('text',{x:p[0],y:p[1],fill:'#325a50','font-size':12,'text-anchor':'middle','dominant-baseline':'central','paint-order':'stroke',stroke:'#fff','stroke-width':3,'data-ag-angle-value':'1'},v)});
    if(!panMode&&angleTool()&&first!==null){if(aligned!==null)instrument(st.points[first],aligned);else if(free)localInstrumentActions(svg,st.points[first],'Choose reference',[['datum-x','Use +x','line',()=>{aligned=0;referenceDatum=true;hover=null;paint()}],['datum-y','Use +y','line',()=>{aligned=90;referenceDatum=true;hover=null;paint()}]],'agGuidedAction')}
   if(!panMode&&hover&&!(free&&['ray','line'].includes(tool)&&rayMode==='absolute'&&first!==null)){const hit=drawingHit(hover),p=hit.p;
    if(tool==='compass'&&openingPickup===null&&!arcMode&&keepOpening&&aperture!==null&&first===null){circle(p,aperture,'#b77b32');circle(p,4,'#b77b32','#fff')}
    if(tool==='compass'&&openingPickup!==null){const i=nearest(hover,openingPickup);if(i>=0){circle(st.points[i],8/G.instruments.screenScale(svg),'#b77b32','none');if(openingPickup>=0)line(st.points[openingPickup],st.points[i],'#b77b32',2,'4 3')}}
    if(first!==null){const a=st.points[first];
     if(angleTool()&&aligned!==null){const v=selectedAngle(a,p,hit);line(a,polar(...a,190,v),'#b77b32',3);{const sweep=mod(hand*(v-aligned)),value=tool==='protractor'&&angleGraduation===.01?sweep.toFixed(2)+'°':labAngleText(st,sweep);const q=angleLabelPlacement(a,38,aligned,hand*sweep,value,13,65);text(q.p,value,'#996221',q.size)}}
     else if(tool==='compass'){const r=arcMode&&(arcStart!==null||keepOpening)&&aperture!==null?aperture:labDist(a,p);if(r>1){const q=polar(...a,r,labAngle(a,p));if(arcMode&&arcStart!==null){const sweep=arcSweep(a,p);if(Math.abs(sweep)>.01)el('path',{d:labArcPath(a,{r,start:arcStart,sweep}),fill:'none',stroke:'#b77b32','stroke-width':2,'data-ag-arc-preview':'1'})}else circle(a,r,'#b77b32');line(a,q,'#b77b32',1.5);dim(a,q,'r = '+labLengthText(st,r,Math.max(labMeasurementDigits(st),lengthGraduation===.01?2:1)),'#996221',null,true)}}
     else if(tool==='segment'){const len=labDist(a,p);if(len>1){const mm=Math.ceil(len/(LAB_UNIT/10)-1e-9)+5,cm=mm/10;G.instruments.ruler(svg,{x:a[0],y:a[1],width:mm*(LAB_UNIT/10),length:cm,height:44,tickHeight:23,angle:labAngle(a,p),labelSize:11});line(a,p,'#b77b32',2,'5 4');if(measure)dim(a,p,labLengthText(st,len,Math.max(labMeasurementDigits(st),lengthGraduation===.01?2:1)),'#996221',polar(...a,70,labAngle(a,p)+90),true)}}else if(tool==='line'&&labDist(a,p)>1e-8)line(...labStraightEnds(a,labAngle(a,p),[viewX,viewY,ww,hh],true),'#b77b32',2,'5 4');else if(tool==='ray'||angleTool())line(a,p,'#b77b32',2,'5 4');
    }
    if(placing!==null&&openingPickup===null&&(tool==='point'||first===null)&&!hit.kind){const u=1/G.instruments.screenScale(svg);el('circle',{cx:p[0],cy:p[1],r:4*u,fill:'#b77b32',stroke:'#fff','stroke-width':1.5,'vector-effect':'non-scaling-stroke','pointer-events':'none','data-ag-placement-preview':'1'})}
    if(hit.kind&&openingPickup===null){const u=1/G.instruments.screenScale(svg);for(const [radius,fill] of [[10,'#d5eee5'],[3,'#2e9982']])el('circle',{cx:p[0],cy:p[1],r:radius*u,fill,stroke:'#2e9982','stroke-width':1.5,'vector-effect':'non-scaling-stroke','pointer-events':'none','data-ag-snap-cue':hit.kind});el('text',{x:p[0],y:p[1]-15*u,fill:'#287b69','font-size':12*u,'text-anchor':'middle','paint-order':'stroke',stroke:'white','stroke-width':2*u,'pointer-events':'none','data-ag-snap-caption':'1'},hit.kind==='Graduation'?hit.lengthCm.toFixed(Math.max(labMeasurementDigits(st),lengthGraduation===.01?2:1))+' cm · graduation':hit.kind)}
   }
   if(tool==='compass'&&openingPickup!==null&&openingPickup>=0&&st.points[openingPickup])circle(st.points[openingPickup],10/G.instruments.screenScale(svg),'#b77b32','none');
   st.points.forEach((p,i)=>{if(motion&&st.traceNames?.includes(st.names[i]))circle(p,10,'#b56d2c','none');if(regionPick.includes(i))circle(p,11,REGION_COLOURS[regionColour],'none');if(selection?.kind==='points'&&!selection.dimensionKey&&selection.index===i)el('circle',{cx:p[0],cy:p[1],r:13/G.instruments.screenScale(svg),fill:'none',stroke:'#b45309','stroke-width':2,'vector-effect':'non-scaling-stroke','pointer-events':'none','data-ag-selection-halo':'1'});circle(p,i===first?6:4,'white',st.given!==false&&i<2?'#28413d':'#287f6c');const pos=labLabel(st,i);el('text',{x:pos[0],y:pos[1],fill:'#325a50','font-size':13,'text-anchor':'middle','dominant-baseline':'central','paint-order':'stroke',stroke:'#fff','stroke-width':3,'data-ag-point-label':st.names[i]},labPointText(st,i)+(free&&datumState(st).coordinates?' '+datumCoordinateText(st,p):''))});
   if(labelPlacement&&hover){if(labelPlacement.dimension){const d=selectedDimension();if(d?.key===labelPlacement.dimension){line(d.mid,hover,'#b45309',1.4,'4 3');text(hover,d.value,'#b45309',13)}}else if(typeof labelPlacement==='object'){const m=st.angleNotation?.[labelPlacement.angle],data=m&&labAngleAnnotation(st,m);if(data){line(data.o,hover,'#b45309',1.4,'4 3');text(hover,data.value,'#b45309',13)}}else{const i=st.names.indexOf(labelPlacement);if(i>=0){line(st.points[i],hover,'#b45309',1.4,'4 3');text(hover,labPointText(st,i),'#b45309',13)}}}
   if(utensils){utensils.paint(svg);utensilsButton.setAttribute('aria-expanded',String(utensils.isOpen()))}
   if(!panMode){
     const activeIndices=new Set(),directions=new Map();
     if(first!==null)activeIndices.add(first);
     if(moving)activeIndices.add(moving.i);
     if(selection?.kind==='points')activeIndices.add(selection.index);
     if(selection?.kind==='segments'){const edge=st.segments[selection.index];if(edge){const a=labAngle(st.points[edge[0]],st.points[edge[1]]);for(const i of edge){activeIndices.add(i);directions.set(i,a)}}}
     if(selection&&['rays','circles'].includes(selection.kind)){const item=st[selection.kind][selection.index];if(item){activeIndices.add(item.i);if(selection.kind==='rays')directions.set(item.i,labRayAngle(st,item))}}
     if(hover){const i=nearest(hover);if(i>=0)activeIndices.add(i)}
     if(tool==='segment'&&first!==null&&hover){const p=drawingHit(hover).p,a=st.points[first];if(labDist(a,p)>1e-7){const angle=labAngle(a,p);directions.set(first,angle);const i=st.points.findIndex(q=>labDist(q,p)<1e-7);if(i>=0){activeIndices.add(i);directions.set(i,angle)}else G.instruments.centreCue(svg,p,'preview',angle)}}
     st.points.forEach((p,i)=>{
       const edge=utensils?.nearMeasuringEdge(p);if(!activeIndices.has(i)&&!edge)return;
       let angle=directions.get(i)??edge?.angle??null;
       if(angle===null){const incident=st.segments.filter(e=>e.includes(i)&&labVisible(st,'segments',e)).map(e=>labAngle(st.points[e[0]],st.points[e[1]]));if(st.given!==false&&i<2&&st.points.length>=2)incident.push(labAngle(st.points[0],st.points[1]));for(const ray of st.rays)if(ray.i===i&&labVisible(st,'rays',ray))incident.push(labRayAngle(st,ray));if(incident.length&&incident.every(a=>Math.abs(Math.sin((a-incident[0])*D))<1e-7))angle=incident[0]}
       G.instruments.centreCue(svg,p,st.names[i],angle);
     });
   }
   if(finePending&&!panMode)paintFinePlacement();
   G.instruments.adaptMarkings(svg);
   hint.textContent=finePending?'Use the local adjustment buttons, then Place to commit or Cancel to choose again.':anglePicking!==null?(angleArmMode&&pickedArms.length<2?'Choose '+(pickedArms.length?'the second':'the first')+' highlighted direction.':angleArmMode?'Choose which side of the two directions to mark.':'Choose an arc, or use Choose two arms to define a specific pair. Outer short arcs select reflex angles at crossings.'):labelPlacement?'Tap the desired position for the label, or cancel.':panMode?'Drag to move around the drawing. Tap Pan again to resume '+(controls.find(c=>c[0]===tool)?.[1]||'drawing')+'.':tool==='move'?'Drag a vertex freely. Its connected geometry will follow.':tool==='trace'?'Tap a point to toggle tracing, then select Move.':tool==='select'?(notationMode?(notationVertex!==null?'Angle at '+st.names[notationVertex]+': tap the two arm points. ':'Tap three points in order: arm, vertex, arm. ')+notationPick.map(i=>st.names[i]).join(' → '):'Tap a vertex to mark an angle, or another object to edit it. Open Measure to use a measuring instrument.'+(motion?' Drag points to move.':'')+(fullBoard?' Drag empty space to pan.':'')):tool==='shade'?(regionStatus||(shadeMode==='region'?'Tap inside a closed contour to shade or unshade.':'Tap vertices in perimeter order. ')+regionPick.map(i=>st.names[i]).join(' → ')+(regionPick.length>=3&&!validRegion(st.points,regionPick)?' · Invalid or crossing region.':'')):angleTool()?(first===null?'Tap a vertex to place the instrument.':aligned===null?(free?'Tap a reference edge, or use +x / +y at the vertex.':'Tap along the reference edge to align the instrument.'):'Choose a direction on the instrument to draw a ray.'):tool==='compass'?(openingPickup!==null?(openingPickup<0?'Tap a visible circle away from marked points, or choose the first marked point.':'Choose the second marked point to pick up the exact distance.'):arcMode?(first===null?'Tap arc centre.':arcStart===null?'Choose arc start and radius.':'Choose the arc end in the selected direction.'):keepOpening?'Retained radius: '+(aperture/LAB_UNIT).toFixed(labMeasurementDigits(st))+' cm · Drag or tap the new centre, then release. Change opening to adjust.':first===null?'Tap the centre of the circle.':hover?'Radius: '+(labDist(st.points[first],drawingHit(hover).p)/LAB_UNIT).toFixed(Math.max(labMeasurementDigits(st),lengthGraduation===.01?2:1))+' cm · Release to draw.':'Touch and slide to set the radius.'):['ray','line'].includes(tool)&&free?(first===null?'Choose the first defining point.':rayMode==='absolute'?'Enter the absolute direction and confirm.':'Choose the second defining point.'):tool==='point'?'Tap a point or a highlighted intersection.':tool==='erase'?'Tap a drawn point, line or circle to erase.':first===null?'Tap the starting point.':'Touch, slide to refine, then release to place.';
   if(unplaced.length)hint.textContent+=' · Measurements in crowded areas: '+unplaced.join(', ');
   hint.textContent+=motion?' · Free exploration: no geometric constraints are applied.':' · Drawn marks are fixed. Use Undo or Erase to correct them.';
  }
  function coords(e){const m=svg.getScreenCTM();if(!m)return null;return new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse())}
  let placing=null,gestureSnap=null;
  const boardPointer=()=>placing??moving?.id??sheetPan?.id??null;
  function cancelBoardGesture(){const id=boardPointer(),prior=moving?.prior,wasFine=!!finePending;finePending=null;placing=null;gestureSnap=null;moving=null;sheetPan=null;hover=null;if(prior){st=prior;changed()}if(id!==null&&svg.hasPointerCapture?.(id))try{svg.releasePointerCapture(id)}catch(_){}return id!==null||wasFine}
  function cancelActive(){utensils?.cancelGesture();return cancelBoardGesture()}
  function objectHit(p){const dist=(a,b,ray=false,infinite=false)=>{const v=labSub(b,a),t=labDot(labSub(p,a),v)/(labDot(v,v)||1);return labDist(p,labAt(a,v,infinite?t:Math.max(0,ray?t:Math.min(1,t))))};const hits=[];for(const [kind,items] of [['segments',st.segments],['rays',st.rays],['circles',st.circles]])items.forEach((obj,index)=>{if(!labVisible(st,kind,obj))return;const d=kind==='segments'?dist(st.points[obj[0]],st.points[obj[1]]):kind==='rays'?dist(st.points[obj.i],exactPolar(...st.points[obj.i],1,labRayAngle(st,obj)),true,obj.infinite):labCircleDistance(st.points[obj.i],obj,p);if(d<=tolerance())hits.push({kind,index,d})});return hits.sort((a,b)=>a.d-b.d)[0]||null}
  svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;if(boardPointer()!==null||finePending){e.preventDefault();return}if(panMode){e.preventDefault();sheetPan={id:e.pointerId,x:e.clientX,y:e.clientY,left:viewport?.scrollLeft||0,top:viewport?.scrollTop||0,camera:fullBoard?currentCamera():null,view:!free?{x:viewX,y:viewY,scale:G.instruments.screenScale(svg)}:null};try{svg.setPointerCapture(e.pointerId)}catch(_){}return}const z=coords(e);if(!z)return;const p=[z.x,z.y];e.preventDefault();hover=p;
   if(anglePicking!==null){const o=st.points[anglePicking],sectors=currentSectors(),scale=G.instruments.screenScale(svg);if(angleArmMode){const arms=labAngleArms(st,anglePicking),target=e.target.closest?.('[data-ag-direction-choice]');let idx=target?Number(target.dataset.agDirectionChoice):-1;if(idx<0&&pickedArms.length<2&&labDist(p,o)*scale>12){const candidates=arms.map((a,i)=>{const v=[Math.cos(a.angle*D),-Math.sin(a.angle*D)],q=labSub(p,o),along=labDot(q,v);return {i,d:along>0?Math.abs(labCross(q,v))*scale:Infinity}}).filter(a=>a.d<=10).sort((a,b)=>a.d-b.d);idx=candidates[0]?.i??-1}if(idx>=0&&arms[idx]){if(pickedArms.includes(idx))pickedArms=pickedArms.filter(i=>i!==idx);else if(pickedArms.length<2)pickedArms.push(idx);paint();return}if(pickedArms.length<2)return}const hit=e.target.closest?.('[data-ag-angle-choice]');let sector=hit?sectors[Number(hit.dataset.agAngleChoice)]:null;if(!sector&&o)sector=sectors.find((a,i)=>{const q=labSectorPreview(sectors,i);return Math.abs(labDist(p,o)*scale-q.radius)<=10&&mod(labAngle(o,p)-q.from)<=q.sweep});if(!sector&&o&&angleArmMode&&pickedArms.length===2&&labDist(p,o)*scale>12)sector=sectors.find(a=>{const d=mod(labAngle(o,p)-a.from);return d>.001&&d<a.sweep-.001});if(sector)selectSector(sector);return}
   if(labelPlacement){const target=labelPlacement;labelPlacement=null;if(target.dimension){const d=selectedDimension();if(d?.key===target.dimension&&d.value){save();st.dimensionLabels||={};st.dimensionLabels[d.key]={mode:'auto',...st.dimensionLabels[d.key],offset:labSub(p,d.mid)};changed()}else paint()}else if(typeof target==='object'){const m=st.angleNotation?.[target.angle],data=m&&labAngleAnnotation(st,m);if(data){save();m.labelOffset=labSub(p,data.o);changed()}else paint()}else{const i=st.names.indexOf(target);if(i>=0){save();st.pointLabels||={};st.pointLabels[target]={...st.pointLabels[target],offset:labSub(p,st.points[i])};changed()}else paint()}return}
   if(free&&(tool==='select'||tool==='move')&&!notationMode){
     const lineMark=e.target.closest?.('[data-ag-line-mark-key]');if(lineMark){const key=lineMark.dataset.agLineMarkKey,family=lineMark.dataset.agLineMarkFamily,index=st.segments.findIndex(edge=>labStyleKey(st,...edge)===key);if(index>=0&&['equal','parallel'].includes(family)&&labLineMarks(st,st.segments[index])[family]){selection={kind:'segments',index,markFamily:family};selectionAnchor=p.slice();distancePair=null;pointEditor=null;angleEditor=null;manualAngle=false;tool='select';paint();return}}
     const length=e.target.closest?.('[data-ag-dimension-key]');if(length){const key=length.dataset.agDimensionKey,ids=key.split(':').map(n=>st.names.indexOf(n)),index=st.segments.findIndex(e=>labStyleKey(st,...e)===key);if(ids.length===2&&ids.every(i=>i>=0)){selection=index>=0?{kind:'segments',index,dimensionKey:key}:{kind:'points',index:ids[0],dimensionKey:key};selectionAnchor=p.slice();distancePair=null;pointEditor=null;angleEditor=null;manualAngle=false;tool='select';paint();return}}
     const annotation=e.target.closest?.('[data-ag-angle-annotation]');if(annotation){const index=Number(annotation.dataset.agAngleAnnotation),m=st.angleNotation?.[index],i=m?st.names.indexOf(m.names[1]):-1;if(i>=0&&labAngleAnnotation(st,m)){selection={kind:'points',index:i};distancePair=null;pointEditor=null;manualAngle=false;angleEditor=index;tool='select';editKind.value=m.kind;editMode.value=m.labelMode||'none';editText.value=m.label||'';editStatus.textContent='';paint();return}}
     let i=nearest(p);const hit=objectHit(p);if(i<0&&free&&labIntersectionSettings(st).show){const candidates=labIntersections(st,{axes:true}).map(v=>({...v,d:labDist(v.p,p)})).filter(v=>v.d<=tolerance()).sort((a,b)=>a.d-b.d);if(candidates.length){save();i=point(candidates[0].p,candidates[0]);changed()}}
     if(i>=0){if(distancePair?.[0]!==st.names[i])distancePair=null;if(pointEditor!==st.names[i])pointEditor=null;if(selection?.kind!=='points'||selection.index!==i){angleEditor=null;manualAngle=false}selection={kind:'points',index:i};tool='select';if(motion){moving={i,id:e.pointerId,pending:true,x:e.clientX,y:e.clientY};try{svg.setPointerCapture(e.pointerId)}catch(_){}}paint();return}
     if(hit){pointEditor=null;angleEditor=null;manualAngle=false;selection=hit;selectionAnchor=p.slice();tool='select';paint();return}
     selection=null;pointEditor=null;hover=null;if(i<0&&fullBoard){sheetPan={id:e.pointerId,x:e.clientX,y:e.clientY,camera:currentCamera(),pending:true};try{svg.setPointerCapture(e.pointerId)}catch(_){}}paint();return
   }
   if(['point','segment','ray','line','compass','protractor','square45','square30'].includes(tool)){
     // Dragging a point that already exists in Point mode must not add new ink.
     if(tool==='point'&&magnetic(p).kind==='Vertex'){hover=null;paint();return}
     gestureSnap=null;placing=e.pointerId;try{svg.setPointerCapture(e.pointerId)}catch(_){}paint();return
   }
   place(p,e);
  });
  // A local vernier is an optional instrument adjustment, not a dimension
  // constraint. No target/task dimensions are consulted; exact snaps bypass it.
  function beginFinePlacement(hit){
   if(!fineMode||first===null||!hit||labDist(st.points[first],hit.p)<8)return false;
   const angular=tool==='protractor'&&aligned!==null&&angleGraduation>0&&!hit.kind,length=!angular&&hit.kind==='Graduation'&&lengthGraduation>0&&(tool==='segment'||tool==='compass'&&!keepOpening&&arcStart===null&&openingPickup===null);
   if(!angular&&!length)return false;
   const o=st.points[first],direction=labAngle(o,hit.p),radius=labDist(o,hit.p),step=angular?angleGraduation:lengthGraduation;
   const value=angular?Math.min(180,mod(hand*(selectedAngle(o,hit.p,hit)-aligned))):radius/LAB_UNIT;
   finePending={angular,o:o.slice(),direction,radius,step,ticks:Math.round(value/step),increment:step,hit};updateFinePlacement();return true;
  }
  function updateFinePlacement(){
   const f=finePending;if(!f)return;const value=f.ticks*f.step,p=exactPolar(...f.o,f.angular?f.radius:value*LAB_UNIT,f.angular?aligned+hand*value:f.direction);
   f.hit={p,kind:'Fine adjustment'};hover=p.slice();paint();
  }
  function paintFinePlacement(){
   const f=finePending;if(!f)return;const digits=Math.max(labMeasurementDigits(st),f.step===.01?2:1),unit=f.angular?'°':' cm',format=v=>Number(v.toFixed(2))+unit;
   const value=(f.ticks*f.step).toFixed(digits)+unit;
   const nudge=sign=>{const n=f.ticks+sign*Math.round(f.increment/f.step),min=f.angular?0:Math.ceil(8/(LAB_UNIT*f.step));f.ticks=Math.max(min,Math.min(f.angular?Math.round(180/f.step):Number.MAX_SAFE_INTEGER,n));updateFinePlacement()};
   const cycle=()=>{const max=f.angular?1:.1,steps=[f.step,f.step*10,f.step*100].filter(x=>x<=max+1e-9);const i=steps.findIndex(x=>Math.abs(x-f.increment)<1e-9);f.increment=steps[(i+1)%steps.length];paint()};
   localInstrumentActions(svg,f.hit.p,value,[
     ['minus','Decrease by '+format(f.increment),'zoom-out',()=>nudge(-1),undefined,'−'],
     ['step','Change adjustment increment','measure',cycle,undefined,format(f.increment)],
     ['plus','Increase by '+format(f.increment),'zoom-in',()=>nudge(1),undefined,'+'],
     ['place','Commit fine placement','select',()=>{const hit=f.hit;finePending=null;hover=null;place(hit.p,null,hit);paint()},undefined,'Place'],
     ['cancel','Cancel fine placement and choose again','clear',()=>{finePending=null;hover=null;paint()},undefined,'Cancel']
   ],'agFineAction');
  }
  function place(p,e,resolved=null){
   if(tool==='compass'&&openingPickup!==null){const i=nearest(p,openingPickup);if(i>=0){if(openingPickup<0){openingPickup=i;hover=null;paint();return}const r=labDist(st.points[openingPickup],st.points[i]);if(r>0){aperture=r;keepOpening=true;openingPickup=null;hover=null;paint()}return}if(openingPickup<0){const c=st.circles.filter(c=>labVisible(st,'circles',c)).map(c=>({c,d:labCircleDistance(st.points[c.i],c,p)})).filter(q=>q.d<=tolerance()).sort((a,b)=>a.d-b.d)[0]?.c;if(c){aperture=c.r;keepOpening=true;openingPickup=null;hover=null;paint()}}return}
   if(tool==='select'){if(notationMode){const i=nearest(p);if(i<0||i===notationVertex||notationPick.includes(i))return;notationPick.push(i);if(notationPick.length===(notationVertex===null?3:2)){const ids=notationVertex===null?notationPick:[notationPick[0],notationVertex,notationPick[1]],names=ids.map(i=>st.names[i]);save();st.angleNotation||=[];st.angleNotation=st.angleNotation.filter(m=>!labSameAngle(st,m,{names}));if(notationMode!=='remove')st.angleNotation.push({names,kind:notationMode,labelMode:angleLabelSelect.value,label:angleLabelInput.value.trim()});notationPick=[];notationMode='';notationVertex=null;changed()}else paint();return}selection=objectHit(p);selectionAnchor=p.slice();paint();return}
   if(motion&&tool==='trace'){const i=nearest(p);if(i>=0){save();const name=st.names[i];traceToggle(st,name);changed()}return}
   if(motion&&tool==='move'){const i=nearest(p);if(i>=0){moving={i,id:e.pointerId,pending:true,x:e.clientX,y:e.clientY};try{svg.setPointerCapture(e.pointerId)}catch(_){}}return}
   if(tool==='shade'){if(shadeMode==='region'){const face=labFaceAt(st,p);if(face){const old=st.regions.findIndex(r=>r.seed&&labInFace(face,r.seed));save();if(old>=0)st.regions.splice(old,1);else st.regions.push({seed:p.slice(),faceKey:face.key,colour:regionColour});regionStatus='';changed();return}const c=st.circles.filter(c=>!isLabArc(c)&&labVisible(st,'circles',c)&&labDist(st.points[c.i],p)<c.r).sort((a,b)=>a.r-b.r)[0];if(c){const key={name:st.names[c.i],radius:c.r},old=st.regions.findIndex(r=>r.circle?.name===key.name&&r.circle?.radius===key.radius);save();if(old>=0)st.regions.splice(old,1);else st.regions.push({circle:key,colour:regionColour});regionStatus='';changed();return}regionStatus='No closed region here. Draw a closed boundary or use vertices.';paint();return}const i=nearest(p);if(i>=0){regionPick=regionPick.includes(i)?regionPick.filter(j=>j!==i):[...regionPick,i];regionStatus='';paint()}return}
   if(tool==='erase'){const i=nearest(p);if(i>=(st.given===false?0:2)){save();labDetachReferences(st,{point:i});const removed=st.names[i];if(st.pointLabels)delete st.pointLabels[removed];for(const marks of [st.notation,st.lineMarks])if(marks)for(const key of Object.keys(marks))if(key.split(':').includes(removed))delete marks[key];if(st.dimensionLabels)for(const k of Object.keys(st.dimensionLabels))if(k.split(':').includes(removed))delete st.dimensionLabels[k];if(st.traces)delete st.traces[removed];if(st.traceNames)st.traceNames=st.traceNames.filter(n=>n!==removed);st.points.splice(i,1);st.names.splice(i,1);st.regions=st.regions.filter(r=>!r.ids?.includes(i)&&r.circle?.name!==removed).map(r=>r.ids?({...r,ids:r.ids.map(j=>j>i?j-1:j)}):r);regionPick=[];st.segments=st.segments.filter(l=>!l.includes(i)).map(l=>l.map(j=>j>i?j-1:j));for(const k of ['rays','circles'])st[k]=st[k].filter(r=>r.i!==i).map(r=>({...r,i:r.i>i?r.i-1:r.i}));changed();return}
    const distanceTo=(a,b,ray=false,infinite=false)=>{const v=labSub(b,a),t=labDot(labSub(p,a),v)/(labDot(v,v)||1);return labDist(p,labAt(a,v,infinite?t:Math.max(0,ray?t:Math.min(1,t))))};
    let k=st.segments.findIndex(e=>labVisible(st,'segments',e)&&distanceTo(st.points[e[0]],st.points[e[1]])<tolerance());if(k>=0){save();labDetachReferences(st,{segment:st.segments[k]});if(st.segmentColours)delete st.segmentColours[labStyleKey(st,...st.segments[k])];if(st.notation)delete st.notation[labStyleKey(st,...st.segments[k])];if(st.lineMarks)delete st.lineMarks[labStyleKey(st,...st.segments[k])];if(st.dimensionLabels)delete st.dimensionLabels[labStyleKey(st,...st.segments[k])];st.segments.splice(k,1)}else{k=st.rays.findIndex(r=>labVisible(st,'rays',r)&&distanceTo(st.points[r.i],exactPolar(...st.points[r.i],1,labRayAngle(st,r)),true,r.infinite)<tolerance());if(k>=0){save();labDetachReferences(st,{ray:st.rays[k]});st.rays.splice(k,1)}else{k=st.circles.findIndex(c=>labVisible(st,'circles',c)&&labCircleDistance(st.points[c.i],c,p)<tolerance());if(k>=0){save();st.circles.splice(k,1)}}}changed();return;
   }
   if(tool==='point'){const hit=resolved||magnetic(p);if(st.points.some(q=>labDist(q,hit.p)<.001))return;save();point(p,hit);hover=null;changed();return}
   if(tool==='compass'&&!arcMode&&keepOpening&&aperture!==null){commitDraft();const before=beforeGeometry(),i=point(p,resolved);if(!st.circles.some(c=>!isLabArc(c)&&c.i===i&&Math.abs(c.r-aperture)<1e-7))st.circles.push({i,r:aperture,construction:free?newStyles.compass:true});hover=null;finishGeometry(before);return}
   if(first===null){draft={state:clone(st),aperture};referenceDatum=false;first=point(p,resolved);hover=null;paint();return}
   if(free&&['ray','line'].includes(tool)&&rayMode==='absolute'){paint();return}
   const o=st.points[first],hit=resolved||drawingHit(p);if(labDist(o,hit.p)<8)return;
   if(angleTool()&&aligned===null){const target=hit.p;if(labDist(o,target)<1e-8)return;const arm=free&&snap?labReferenceArm(st,first,target,tolerance()):null;aligned=arm?arm.angle:labAngle(o,target);referenceDatum=false;reference=exactPolar(...o,labDist(o,target),aligned);paint();return}
   if(tool==='compass'&&arcMode){if(arcStart===null){const q=hit.p,r=keepOpening&&aperture!==null?aperture:labDist(o,q);if(r<=0)return;aperture=r;arcStart=labAngle(o,q);hover=null;paint();return}const sweep=arcSweep(o,hit.p);if(Math.abs(sweep)<.1||Math.abs(sweep)>359.9)return;commitDraft();const before=beforeGeometry();st.circles.push({i:first,r:aperture,start:arcStart,sweep,construction:free?newStyles.compass:true});keepOpening=true;first=null;arcStart=null;hover=null;finishGeometry(before);return}
   commitDraft();const before=beforeGeometry();
   if(tool==='segment'){const j=point(p,hit);if(j!==first&&!st.segments.some(l=>l.includes(first)&&l.includes(j))){st.segments.push([first,j]);if(free&&newStyles.segment){st.segmentStyles||={};st.segmentStyles[labStyleKey(st,first,j)]=true}}}
   else if(tool==='compass'){const r=labDist(o,hit.p);if(r>0){aperture=r;keepOpening=true;st.circles.push({i:first,r,construction:free?newStyles.compass:true})}}
   else if(tool==='line'||tool==='ray'||angleTool()){const a=angleTool()?selectedAngle(o,hit.p,hit):null;if(angleTool()){if(free&&referenceDatum){st.rays.push(labAbsoluteRay(st,first,a,true));first=null;aligned=null;referenceDatum=false;hover=null;finishGeometry(before);return}const distance=reference?labDist(o,reference):120;const target=exactPolar(...o,Math.max(8,distance),aligned),arm=free?labReferenceArm(st,first,target,1e-5):null;if(arm){st.rays.push(labRelativeRay(st,first,arm,a,hand));first=null;aligned=null;hover=null;finishGeometry(before);return}const j=point(target,{p:target,kind:''});if(j!==first){const base=labAngle(o,st.points[j]),relative=mod(a-base),given=st.given!==false&&[first,j].sort().join(':')==='0:1';if(!given&&!st.segments.some(l=>l.includes(first)&&l.includes(j))){st.segments.push([first,j]);st.segmentStyles||={};st.segmentStyles[labStyleKey(st,first,j)]=true}st.rays.push({i:first,angle:a,relativeTo:st.names[j],relativeAngle:relative,mark:{base:st.names[j],hand}})}else st.rays.push({i:first,angle:a})}else {if(labDist(o,hit.p)>1e-8){if(free){const j=point(p,hit);if(j!==first){const r=labDirectRay(st,first,{p:st.points[j],i:j},newStyles[tool]);if(tool==='line')r.infinite=true;st.rays.push(r)}}else st.rays.push(labDirectRay(st,first,hit,true))}}}
   first=null;aligned=null;hover=null;finishGeometry(before);
  }
  function moveBoardPointer(e){if(finePending)return;if(boardPointer()!==null&&boardPointer()!==e.pointerId)return;if(panMode||sheetPan?.id===e.pointerId){if(sheetPan?.id===e.pointerId){if(sheetPan.pending&&Math.hypot(sheetPan.x-e.clientX,sheetPan.y-e.clientY)<5)return;sheetPan.pending=false;if(fullBoard&&sheetPan.camera){const c=sheetPan.camera;camera={...c,x:c.x+(sheetPan.x-e.clientX)/c.scale,y:c.y+(sheetPan.y-e.clientY)/c.scale};sizeCanvas()}else if(sheetPan.view){const v=sheetPan.view;viewX=v.x+(sheetPan.x-e.clientX)/v.scale;viewY=v.y+(sheetPan.y-e.clientY)/v.scale;svg.setAttribute('viewBox',[viewX,viewY,ww,hh].join(' '));paint()}else if(viewport){viewport.scrollLeft=sheetPan.left+sheetPan.x-e.clientX;viewport.scrollTop=sheetPan.top+sheetPan.y-e.clientY}}return}const z=coords(e);if(!z)return;hover=[z.x,z.y];if(motion&&moving?.id===e.pointerId){if(moving.pending){if(Math.hypot(moving.x-e.clientX,moving.y-e.clientY)<5)return;moving.prior=clone(st);moving.pending=false}const p=fullBoard?[z.x,z.y]:[Math.max(viewX+5,Math.min(viewX+ww-5,z.x)),Math.max(viewY+5,Math.min(viewY+hh-5,z.y))],i=moving.i,name=st.names[i],old=st.points[i];traceAdd(st,name,p,old);st.points[i]=p;changed()}else paint()}
  svg.addEventListener('pointermove',moveBoardPointer);
  svg.addEventListener('pointerup',e=>{if(boardPointer()!==null&&boardPointer()!==e.pointerId)return;if(sheetPan?.id===e.pointerId){if(!free)moveBoardPointer(e);sheetPan=null;return}if(placing===e.pointerId){const z=coords(e),p=z&&[z.x,z.y],hit=p&&drawingHit(p);placing=null;gestureSnap=null;if(p&&!beginFinePlacement(hit))place(p,e,hit)}if(moving?.id===e.pointerId){const z=coords(e),p=z&&st.points[moving.i];if(z&&p&&labDist(p,[z.x,z.y])>1e-8)moveBoardPointer(e);if(moving.prior){history.push(moving.prior);redoHistory=[]}moving=null}paint()});
  svg.addEventListener('wheel',e=>{if(!fullBoard)return;e.preventDefault();zoomBoard(e.deltaY<0?1.25:.8)},{passive:false});
  const cancel=e=>{const owner=boardPointer();if(owner!==null&&owner!==e.pointerId)return;if(e.type==='lostpointercapture'&&owner===null)return;const view=sheetPan?.view,wasPan=!!sheetPan;if(view){viewX=view.x;viewY=view.y;svg.setAttribute('viewBox',[viewX,viewY,ww,hh].join(' '))}cancelBoardGesture();if(!wasPan)cancelDraft();paint()};svg.addEventListener('pointercancel',cancel);svg.addEventListener('lostpointercapture',cancel);
  // A maximised lab is a real drawing surface, not an enlarged paper preview.
  // Reparent existing controls rather than duplicating their state or handlers.
  function floatingPanel(title,nodes,left,top){const panel=geometryPalette(toolbar,title,nodes,left,top);fullPanels.push(panel);return panel}
  function clampPanel(panel){clampGeometryPanel(toolbar,panel)}
  function fullResize(){if(!fullBoard)return;sizeCanvas();fullPanels.forEach(clampPanel);if(helpPanel)clampPanel(helpPanel)}
  if(free)svg._tt99SetFullBoard=active=>{
    active=!!active;if(active===fullBoard){if(active)fullResize();return}
    cancelActive();cancelDraft();fullBoard=active;camera=null;navButtons.forEach(b=>b.hidden=!active);box.classList.toggle('gd-ag-full-board',active);panMode=false;hover=null;
    const stage=box.closest('#gd-stage');stage?.classList.toggle('gd-ag-full-stage',active);document.documentElement.classList.toggle('gd-ag-full-page',active);
    if(active){
      viewport.style.cssText='position:absolute;inset:0;overflow:hidden;background:white;padding:0;border:0;border-radius:0;max-width:none;max-height:none';
      toolbar.classList.add('gd-ag-full-tools');navigation.append(panButton,...navButtons);toolbar.append(navigation);floatingPanel('Instruments',[instruments],'10px','46px');const drawingPanel=floatingPanel('Drawing options',[helpers,styleBar,notationBar,regionBar,sheetPanel,utensils.bar],'calc(100% - 365px)','54px');if(viewport.clientWidth<600)drawingPanel.querySelector('.gd-ag-full-panel-head button').click();
      panelsHidden=false;dock=geometryPaletteDock(toolbar,hidden=>{panelsHidden=hidden;fullPanels.forEach(p=>p.hidden=hidden);if(hidden){guideOpen=false;methodLibrary?.toggle(false)}else fullResize();paintGuide()});
      // Instrument help floats independently of the tool palettes.
      fullResize();syncSheet();
    }else{
      ws=boardWorkspace();ww=ws.w;hh=ws.h;st.workspace={...ws};actions.append(panButton,...navButtons);navigation.remove();toolbar.classList.remove('gd-ag-full-tools');toolbar.append(instruments,helpers,styleBar,notationBar,regionBar,sheetPanel,utensils.bar);box.append(guide);helpPanel?.remove();helpPanel=null;fullPanels.forEach(p=>p.remove());fullPanels=[];dock?.remove();dock=null;viewport.style.cssText=normalViewportStyle;svg.style.cssText=normalSvgStyle;sizeCanvas();syncSheet();onChange(clone(st));
    }
    paint()
  };
  if(free&&typeof ResizeObserver!=='undefined'){const fullObserver=new ResizeObserver(()=>{if(!svg.isConnected){fullObserver.disconnect();if(fullBoard&&!document.querySelector('.gd-ag-full-board')){document.documentElement.classList.remove('gd-ag-full-page');document.getElementById('gd-stage')?.classList.remove('gd-ag-full-stage')}return}fullResize()});fullObserver.observe(viewport)}
  if(viewport)viewport.addEventListener('scroll',()=>{if(selection)paint()},{passive:true});
  boardReady=true;paint();
 }


 // Optional investigation tools: measurements come from the rendered
 // polygon coordinates, never from its answer or named shape family.
 const inspectTypes=['right-count','triangle-type','triangle-angle-type','quad-type','regularity','diagonal-equal','diagonal-bisect','diagonal-perpendicular','parallel-count','shape-family','side-count'];
 function mountInvestigation(box,svg){
  const outline=svg.querySelector('[data-ag-inspect-polygon]');if(!outline)return;
  const points=outline.getAttribute('points').trim().split(/\s+/).map(v=>v.split(',').map(Number));
  if(points.length<3)return;
  for(const p of svg.querySelectorAll('[data-ag-inspect-point]')){const pos=[Number(p.getAttribute('cx')),Number(p.getAttribute('cy'))];if(pos.every(Number.isFinite)&&!points.some(q=>labDist(q,pos)<.001))points.push(pos)}
  const N='http://www.w3.org/2000/svg',bar=document.createElement('div');bar.className='gd-ag-inspect-tools';
  const message=document.createElement('span');message.className='gd-ag-inspect-message';message.setAttribute('role','status');
  const layer=document.createElementNS(N,'g');layer.setAttribute('data-ag-inspection','1');layer.setAttribute('pointer-events','none');svg.append(layer);
  let tool='',selected=[],hover=-1,auxMode='',auxStart=null,auxPreview=null,auxMarks=[],auxHistory=[];const boundaryCount=outline.getAttribute('points').trim().split(/\s+/).length;
  const auxLayer=document.createElementNS(N,'g');auxLayer.setAttribute('data-ag-auxiliary','1');auxLayer.setAttribute('pointer-events','none');svg.insertBefore(auxLayer,layer);
  const auxBar=document.createElement('div');auxBar.className='gd-ag-inspect-tools';auxBar.hidden=true;const auxStatus=document.createElement('span');auxStatus.className='gd-ag-inspect-message';auxStatus.setAttribute('role','status');
  function stopAux(){auxMode='';auxStart=null;auxPreview=null;auxBar.hidden=true;auxToggle.setAttribute('aria-pressed','false');paintAux()}
  function auxSnapshot(){auxHistory.push(auxMarks.map(m=>({...m,a:m.a.slice(),...(m.b?{b:m.b.slice()}: {})})));if(auxHistory.length>60)auxHistory.shift()}
  function auxModel(){const ps=points.map(p=>p.slice()),segments=Array.from({length:boundaryCount},(_,i)=>[i,(i+1)%boundaryCount]),circles=[];const index=p=>{let i=ps.findIndex(q=>labDist(p,q)<.001);if(i<0){i=ps.length;ps.push(p.slice())}return i};for(const m of auxMarks){const i=index(m.a);if(m.kind==='segment')segments.push([i,index(m.b)]);else if(m.kind==='circle')circles.push({i,r:m.r})}return {given:false,points:ps,segments,circles,rays:[]}}
  function auxPosition(e){const m=svg.getScreenCTM();if(!m)return null;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse()),tol=Math.min(42,20/Math.hypot(m.a,m.b));return {raw:[p.x,p.y],p:labSnap(auxModel(),[p.x,p.y],tol,true).p,tol}}
  function auxDistance(m,p){if(m.kind==='point')return labDist(m.a,p);if(m.kind==='circle')return Math.abs(labDist(m.a,p)-m.r);const v=labSub(m.b,m.a),t=Math.max(0,Math.min(1,labDot(labSub(p,m.a),v)/(labDot(v,v)||1)));return labDist(p,labAt(m.a,v,t))}
  function paintAux(){auxLayer.replaceChildren();function add(tag,attrs){const e=document.createElementNS(N,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);auxLayer.append(e)}function draw(m,preview=false){const attrs={stroke:'#ad762b','stroke-width':preview?1.5:2,fill:'none','stroke-dasharray':'6 4',...(preview?{'data-ag-aux-preview':'1'}:{'data-ag-aux-mark':m.kind})};if(m.kind==='point')add('circle',{...attrs,cx:m.a[0],cy:m.a[1],r:4,fill:'#ad762b','stroke-dasharray':''});else if(m.kind==='segment')add('line',{...attrs,x1:m.a[0],y1:m.a[1],x2:m.b[0],y2:m.b[1]});else add('circle',{...attrs,cx:m.a[0],cy:m.a[1],r:m.r})}for(const m of auxMarks)draw(m);if(auxStart&&auxPreview){if(auxMode==='segment')draw({kind:'segment',a:auxStart,b:auxPreview},true);if(auxMode==='circle')draw({kind:'circle',a:auxStart,r:labDist(auxStart,auxPreview)},true)}if(auxStart)draw({kind:'point',a:auxStart},true);for(const b of auxBar.querySelectorAll('[data-ag-aux]'))b.setAttribute('aria-pressed',String(b.dataset.agAux===auxMode));auxUndo.disabled=!auxHistory.length;auxClear.disabled=!auxMarks.length;auxStatus.textContent=auxMode==='erase'?'Tap an auxiliary mark to remove it. Original geometry is protected.':auxMode==='point'?'Tap to mark a point or intersection.':auxMode==='circle'?(auxStart?'Tap the radius endpoint.':'Tap the centre of the circle.'):(auxStart?'Tap the second endpoint.':'Tap the first endpoint.');}
  function chooseAux(mode){auxMode=mode;auxStart=null;auxPreview=null;paintAux()}
  for(const [id,label] of [['segment','Line'],['point','Point'],['circle','Circle'],['erase','Erase']]){const b=instrumentButton(auxBar,id==='circle'?'compass':id,label,label+' auxiliary mark',()=>chooseAux(id),'agAux');b.dataset.agAux=id;b.classList.add('gd-ag-inspect-btn')}
  const auxUndo=instrumentButton(auxBar,'undo','Undo','Undo auxiliary mark',()=>{if(auxHistory.length)auxMarks=auxHistory.pop();auxStart=null;auxPreview=null;paintAux()},'agAux');auxUndo.classList.add('gd-ag-inspect-btn');const auxClear=instrumentButton(auxBar,'clear','Clear marks','Remove all auxiliary marks',()=>{if(auxMarks.length){auxSnapshot();auxMarks=[]}auxStart=null;auxPreview=null;paintAux()},'agAux');auxClear.classList.add('gd-ag-inspect-btn');auxBar.append(auxStatus);
  function button(id,label){const b=instrumentButton(bar,id,label,label,()=>{stopAux();physicalMode.deactivate();physicalMode.bar.hidden=true;physical.setAttribute('aria-pressed','false');if(id==='clear'&&auxMarks.length){auxSnapshot();auxMarks=[];paintAux()}tool=id==='clear'||tool===id?'':id;selected=[];hover=-1;paint()},'agInspect');b.classList.add('gd-ag-inspect-btn');b.setAttribute('aria-pressed','false');return b}
  const rb=button('ruler','Ruler'),ab=button('angle','Protractor');button('clear','Clear');const physical=instrumentButton(bar,'protractor','Instruments','Place and manipulate physical geometry instruments',()=>{stopAux();tool='';selected=[];paint();if(physicalMode.isActive()){physicalMode.deactivate();physicalMode.bar.hidden=true;physical.setAttribute('aria-pressed','false')}else{physicalMode.bar.hidden=false;physicalMode.activate();physical.setAttribute('aria-pressed','true')}},'agInspect');physical.classList.add('gd-ag-inspect-btn');const auxToggle=instrumentButton(bar,'segment','Draw marks','Add temporary construction marks',()=>{if(auxMode){stopAux();paint();return}physicalMode.deactivate();physicalMode.bar.hidden=true;physical.setAttribute('aria-pressed','false');tool='';selected=[];paint();auxBar.hidden=false;auxToggle.setAttribute('aria-pressed','true');svg.style.touchAction='none';chooseAux('segment')},'agInspect');auxToggle.dataset.agInspect='auxiliary';auxToggle.classList.add('gd-ag-inspect-btn');auxToggle.setAttribute('aria-pressed','false');bar.append(message);box.insertBefore(bar,svg);box.insertBefore(auxBar,svg);const physicalMode=mountAngleMeasurement(box,svg,{}, {inspectionPoints:points,snapModel:auxModel});physicalMode.bar.hidden=true;
  function el(tag,attrs,content){const e=document.createElementNS(N,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(content!=null)e.textContent=content;layer.append(e);return e}
  function line(a,b,stroke='#14796b',w=2,extra={}){return el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke,'stroke-width':w,...extra})}
  function mark(p,r,fill){el('circle',{cx:p[0],cy:p[1],r,fill,stroke:'#177d6f','stroke-width':2})}
  function paint(){
   layer.replaceChildren();for(const [id,b] of [['ruler',rb],['angle',ab]]){b.classList.toggle('gd-btn--primary',tool===id);b.setAttribute('aria-pressed',String(tool===id))}
   svg.style.touchAction=tool?'none':'auto';message.textContent=tool==='ruler'?'Tap two labelled points to compare lengths (diagram units).':tool==='angle'?'Tap the vertex or intersection, then one point on each arm.':'Optional: investigate the shape before answering.';
   if(!tool)return;
   points.forEach((p,i)=>mark(p,i===hover?10:5,selected.includes(i)?'#e3af53':i===hover?'#d0eee4':'white'));
   if(tool==='ruler'&&selected.length===2){
    const [a,b]=selected.map(i=>points[i]),len=labDist(a,b),v=labSub(b,a).map(x=>x/len),normal=[-v[1],v[0]],center=points.reduce((r,p)=>[r[0]+p[0]/points.length,r[1]+p[1]/points.length],[0,0]);if(labDot(labSub(center,a),normal)<0){normal[0]*=-1;normal[1]*=-1}
    const angle=labAngle(a,b),side=labDot(normal,[-v[1],v[0]])>=0?1:-1,cm=20;G.instruments.ruler(layer,{x:a[0],y:a[1],width:cm*40,length:cm,height:44,tickHeight:23,angle,side,labelSize:11,unitLabel:false});
    line(a,b,'#177d6f',3);message.textContent='Length: '+(len/40).toFixed(2)+' diagram units. Tap two more points to compare.';
   }else if(tool==='angle'&&selected.length>=2){
    const o=points[selected[0]],a=points[selected[1]],base=labAngle(o,a),b=selected.length===3?points[selected[2]]:null,delta=b?mod(labAngle(o,b)-base):0,sign=b&&delta>180?-1:1,deg=Math.min(delta,360-delta),radius=155;
    G.instruments.protractor(layer,{x:o[0],y:o[1],radius,start:base,direction:sign});
    line(o,polar(...o,radius,base),'#397b70',2);if(b){line(o,polar(...o,radius,base+sign*deg),'#b77b32',3);message.textContent='Measured angle: '+Math.round(deg)+'°. Tap a new corner to measure another.'}else message.textContent='Tap a point on the second arm.';
   }else if(selected.length===1)message.textContent=tool==='ruler'?'Tap the other endpoint.':'Tap a point on the first arm.';
  }
  function hit(e){const m=svg.getScreenCTM();if(!m)return -1;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse()),tol=Math.min(65,28/Math.hypot(m.a,m.b));let best=-1,dist=tol;points.forEach((q,i)=>{const d=labDist(q,[p.x,p.y]);if(d<dist){best=i;dist=d}});return best}
  svg.addEventListener('pointermove',e=>{if(auxMode){const q=auxPosition(e);if(q&&auxStart){auxPreview=q.p;paintAux()}return}if(!tool)return;const i=hit(e);if(i!==hover){hover=i;paint()}});
  svg.addEventListener('pointerdown',e=>{if(auxMode&&e.button===0){const q=auxPosition(e);if(!q)return;e.preventDefault();if(auxMode==='erase'){const hits=auxMarks.map((m,i)=>({i,d:auxDistance(m,q.raw)})).filter(m=>m.d<=q.tol).sort((a,b)=>a.d-b.d);if(hits.length){auxSnapshot();auxMarks.splice(hits[0].i,1)}}else if(auxMode==='point'){if(!auxMarks.some(m=>m.kind==='point'&&labDist(m.a,q.p)<.001)){auxSnapshot();auxMarks.push({kind:'point',a:q.p})}}else if(!auxStart){auxStart=q.p;auxPreview=q.p}else if(labDist(auxStart,q.p)>1){auxSnapshot();auxMarks.push(auxMode==='segment'?{kind:'segment',a:auxStart,b:q.p}:{kind:'circle',a:auxStart,r:labDist(auxStart,q.p)});auxStart=null;auxPreview=null}paintAux();return}if(!tool||e.button!==0)return;const i=hit(e);if(i<0)return;e.preventDefault();if(selected.length===(tool==='ruler'?2:3))selected=[];if(!selected.includes(i))selected.push(i);hover=i;paint()});
  paint();
 }


 // Independent measurement: the pupil places and aligns the same instrument
 // used in the explorer. No computed answer or target angle is displayed.
 function mountAngleMeasurement(box,svg,d,{inspectionPoints=null,snapModel=null}={}){
  const N='http://www.w3.org/2000/svg',vertex=[400,220],rays=[mod(d.rotation||0),mod((d.rotation||0)+d.angle)],radius=inspectionPoints?155:208;
  let active=false,centre=null,start=0,aligned=false,full=false,direction=1,drag=null,preview=null,kind='protractor',corner=0,opening=100;
  const bar=document.createElement('div');bar.className='gd-ag-inspect-tools';
  const message=document.createElement('span');message.className='gd-ag-inspect-message';message.setAttribute('role','status');
  const layer=document.createElementNS(N,'g');layer.setAttribute('data-ag-measure-overlay','1');layer.setAttribute('pointer-events','none');svg.append(layer);
  function button(id,label,fn){const b=instrumentButton(bar,id,label,label,fn,'agMeasure');b.classList.add('gd-ag-inspect-btn');return b}
  const show=button('show','Protractor',()=>{active=!active;if(!active){centre=null;aligned=false;preview=null}paint()});
  const picker=document.createElement('select');picker.className='gd-select';picker.setAttribute('aria-label','Physical instrument');picker.dataset.agInstrument='1';for(const [value,label] of [['protractor','Protractor'],['ruler','Ruler'],['square45','45° set square'],['square30','30°–60° set square'],['compass','Compass']]){const o=document.createElement('option');o.value=value;o.textContent=label;picker.append(o)}picker.onchange=()=>{kind=picker.value;drag=null;paint()};if(inspectionPoints){show.hidden=true;bar.append(picker)}
  const cornerBtn=button('corner','Corner',()=>{corner=(corner+1)%3;paint()});
  const format=button('format','360° protractor',()=>{full=!full;paint()});
  const flip=button('flip','Flip',()=>{direction*=-1;paint()});
  const left=button('left','−1°',()=>{start=mod(start-1);aligned=true;paint()});
  const right=button('right','+1°',()=>{start=mod(start+1);aligned=true;paint()});
  const reset=button('reset','Reset',()=>{centre=null;aligned=false;start=0;direction=1;preview=null;paint()});
  bar.append(message);box.insertBefore(bar,svg);
  function el(tag,attrs){const n=document.createElementNS(N,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));layer.append(n);return n}
  function point(e){const m=svg.getScreenCTM();if(!m)return null;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());return [p.x,p.y]}
  function tol(){const m=svg.getScreenCTM();return m?Math.min(60,26/Math.hypot(m.a,m.b)):25}
  function snapCentre(p){if(snapModel)return labSnap(snapModel(),p,tol(),true).p;const candidates=inspectionPoints||[vertex],nearest=candidates.reduce((a,b)=>labDist(a,p)<labDist(b,p)?a:b);return labDist(nearest,p)<=tol()?nearest.slice():p}
  function orientation(p){const a=labAngle(centre,p),delta=(u,v)=>Math.min(mod(u-v),mod(v-u));const candidates=inspectionPoints?(snapModel?snapModel().points:inspectionPoints).filter(p=>labDist(p,centre)>.01).map(p=>labAngle(centre,p)):rays;const nearest=candidates.reduce((u,v)=>delta(u,a)<=delta(v,a)?u:v,a+180);return (inspectionPoints||labDist(centre,vertex)<.01)&&delta(nearest,a)<=5?nearest:mod(Math.round(a))}
  function paint(){
   layer.replaceChildren();show.setAttribute('aria-pressed',String(active));show.classList.toggle('gd-btn--primary',active);
   for(const b of [format,flip,left,right,reset,cornerBtn])b.hidden=!active;format.hidden=!active||kind!=='protractor';cornerBtn.hidden=!active||!kind.startsWith('square');left.hidden=right.hidden=!active||kind==='compass';
   for(const b of [flip,left,right])b.disabled=!centre;
   format.querySelector('span').textContent=full?'180° protractor':'360° protractor';flip.hidden=!active||kind==='compass'||(kind==='protractor'&&full);
   svg.style.touchAction=active?'none':'auto';
   message.textContent=!active?'Select the protractor when you are ready to measure.':!centre?'Tap the angle vertex to position the centre.':!aligned?'Tap or slide along an arm to align the zero line.':'Read the correct scale. Drag a graduation to realign, or drag the centre to reposition.';
   if(!active)return;
   if(inspectionPoints){message.textContent=!centre?'Tap to position the instrument.':kind==='compass'?'Drag the centre to move; drag the radius handle to change its opening.':'Drag the centre to move; drag the amber handle to rotate. No answer is calculated.'}
   if(!centre&&preview){const q=snapCentre(preview);if(labDist(q,preview)<.001&&(inspectionPoints||labDist(q,vertex)<.001))el('circle',{cx:q[0],cy:q[1],r:12,fill:'#c5e3da',stroke:'#287c70','stroke-width':2})}
   if(!centre)return;
   let handleRadius=radius;if(kind==='protractor')G.instruments.protractor(layer,{x:centre[0],y:centre[1],radius,start,direction,full});else if(kind==='ruler'){handleRadius=320;G.instruments.ruler(layer,{x:centre[0],y:centre[1],width:320,length:8,height:44,tickHeight:23,angle:start,side:direction,labelSize:11,unitLabel:false})}else if(kind.startsWith('square')){handleRadius=140;drawSquare(layer,centre,start,kind,corner,direction)}else{handleRadius=opening;el('circle',{cx:centre[0],cy:centre[1],r:opening,fill:'none',stroke:'#b77b32','stroke-width':1.8,'stroke-dasharray':'5 3','data-geometry-instrument':'compass'})}
   const zero=polar(...centre,handleRadius,start);
   el('line',{x1:centre[0],y1:centre[1],x2:zero[0],y2:zero[1],stroke:'#b77b32','stroke-width':2.5});
   el('circle',{cx:centre[0],cy:centre[1],r:7,fill:'#fff',stroke:'#287c70','stroke-width':2});
   el('circle',{cx:zero[0],cy:zero[1],r:8,fill:'#e4b56a',stroke:'#fff','stroke-width':2});
  }
  svg.addEventListener('pointerdown',e=>{
   if(!active||e.button!==0)return;const p=point(e);if(!p)return;e.preventDefault();
   if(!centre){centre=snapCentre(p);aligned=false;preview=null;paint();return}
   drag={id:e.pointerId,kind:labDist(p,centre)<=tol()?'centre':'rotate'};
   if(drag.kind==='rotate'&&labDist(p,centre)>10){start=orientation(p);if(kind==='compass')opening=Math.max(5,labDist(p,centre));aligned=true}
   try{svg.setPointerCapture(e.pointerId)}catch(_){}paint();
  });
  svg.addEventListener('pointermove',e=>{
   if(!active)return;const p=point(e);if(!p)return;
   if(!centre){preview=p;paint();return}
   if(!drag||drag.id!==e.pointerId)return;e.preventDefault();
   if(drag.kind==='centre')centre=snapCentre(p);else if(labDist(p,centre)>10){start=orientation(p);if(kind==='compass')opening=Math.max(5,labDist(p,centre));aligned=true}paint();
  });
  const finish=e=>{if(drag?.id===e.pointerId)drag=null};svg.addEventListener('pointerup',finish);svg.addEventListener('pointercancel',finish);svg.addEventListener('lostpointercapture',finish);
  paint();return {bar,activate(){if(!active)show.click()},deactivate(){if(active)show.click()},isActive:()=>active};
 }


 function mountPolygonRegions(box,svg,d,onChange){
   const outline=svg.querySelector('[data-ag-region-points]');if(!outline)return;
   const points=JSON.parse(outline.getAttribute('data-ag-region-points')),names=JSON.parse(outline.getAttribute('data-ag-region-names')),key=polygonRegionKey(d),N='http://www.w3.org/2000/svg';
   let active=false,selected=[],colour=0,regions=(d.regionsByShape?.[key]||[]).slice();
   const bar=document.createElement('div');bar.className='gd-ag-inspect-tools';
   const toggle=document.createElement('button');toggle.type='button';toggle.className='gd-btn';toggle.textContent='Shade regions';toggle.dataset.agPolygonShade='1';bar.append(toggle);
   const actions=document.createElement('div');actions.className='gd-ag-lab-helpers';bar.append(actions);
   const status=document.createElement('span');status.className='gd-ag-inspect-message';status.setAttribute('role','status');bar.append(status);box.insertBefore(bar,svg);
   const layer=document.createElementNS(N,'g');layer.setAttribute('pointer-events','none');svg.append(layer);
   const colours=REGION_COLOURS.map((c,i)=>{const b=document.createElement('button');b.type='button';b.className='gd-btn';b.style.cssText='width:32px;min-height:34px;background:'+c+';border:2px solid white';b.setAttribute('aria-label',['Green','Blue','Gold','Purple','Coral'][i]+' region');b.onclick=()=>{colour=i;paint()};actions.append(b);return b});
   function action(label,fn){const b=document.createElement('button');b.type='button';b.className='gd-btn';b.textContent=label;b.onclick=fn;actions.append(b);return b}
   const apply=action('Shade selected',()=>{if(!validRegion(points,selected))return;regions.push({ids:selected.slice(),colour});selected=[];commit()});
   const undo=action('Remove last',()=>{regions.pop();commit()});
   action('Clear regions',()=>{regions=[];selected=[];commit()});
   function el(tag,attrs){const node=document.createElementNS(N,tag);Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,String(v)));layer.append(node);return node}
   function commit(){
     d.regionsByShape={...(d.regionsByShape||{}),[key]:regions.slice()};onChange(d.regionsByShape);
     svg.querySelectorAll('[data-ag-region]').forEach(e=>e.remove());let previous=outline;
     for(const region of regions){if(!validRegion(points,region.ids))continue;const node=el('polygon',{points:region.ids.map(i=>points[i].join(',')).join(' '),fill:REGION_COLOURS[region.colour],'fill-opacity':.28,stroke:'none','data-ag-region':'1'});previous.after(node);previous=node}
     paint()
   }
   function paint(){
     layer.replaceChildren();toggle.setAttribute('aria-pressed',String(active));toggle.classList.toggle('gd-btn--primary',active);actions.style.display=active?'flex':'none';status.textContent=!active?'':selected.length>=3&&!validRegion(points,selected)?'Invalid region. Choose vertices in perimeter order.':'Tap vertices in perimeter order: '+selected.map(i=>names[i]).join(' → ');
     colours.forEach((b,i)=>{b.style.outline=i===colour?'2px solid #263e43':'none';b.setAttribute('aria-pressed',String(i===colour))});apply.disabled=!validRegion(points,selected);undo.disabled=!regions.length;svg.style.touchAction=active?'none':'auto';
     if(!active)return;
     if(selected.length>=2)el('polygon',{points:selected.map(i=>points[i].join(',')).join(' '),fill:'none',stroke:REGION_COLOURS[colour],'stroke-width':2,'stroke-dasharray':'5 4'});
     points.forEach((p,i)=>{el('circle',{cx:p[0],cy:p[1],r:selected.includes(i)?10:6,fill:selected.includes(i)?REGION_COLOURS[colour]:'white','fill-opacity':.8,stroke:REGION_COLOURS[colour],'stroke-width':2})})
   }
   toggle.onclick=()=>{active=!active;selected=[];paint()};
   svg.addEventListener('pointerdown',e=>{if(!active||e.button!==0)return;const m=svg.getScreenCTM();if(!m)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());let nearest=-1,dist=Math.min(45,25/Math.hypot(m.a,m.b));points.forEach((q,i)=>{const l=labDist(q,[p.x,p.y]);if(l<dist){nearest=i;dist=l}});if(nearest<0)return;e.preventDefault();selected=selected.includes(nearest)?selected.filter(i=>i!==nearest):[...selected,nearest];paint()});
   paint();
 }


 // Full-board dynamic workspaces keep the same controls and coordinate model.
 function dynamicBoard(box,surface,groups,getBounds,redraw,getFitBounds=getBounds,canPan=()=>false,geometryBusy=()=>false,cancelGeometry=()=>{}){
   const originalStyle=surface.style.cssText;let active=false,bounds=null,overlay=null,dock=null,panels=[],hidden=false,camera=null,pan=false,drag=null,nav=null,panButton=null;
   surface.dataset.agDynamicWorkspace='1';
   const clamp=panel=>clampGeometryPanel(overlay,panel),size=()=>[Math.max(1,surface.clientWidth),Math.max(1,surface.clientHeight)];
   const resize=()=>{if(!active)return;const [w,h]=size(),next=camera?[camera.x-w/(2*camera.scale),camera.y-h/(2*camera.scale),w/camera.scale,h/camera.scale]:fitGeometryBounds(getBounds(),w,h);if(!bounds||next.some((v,i)=>Math.abs(v-bounds[i])>.01)){bounds=next;redraw()}panels.forEach(clamp)};
   const current=()=>{const [w]=size();return {x:bounds[0]+bounds[2]/2,y:bounds[1]+bounds[3]/2,scale:w/bounds[2]}};
   function setPan(value){cancelGeometry();pan=value;drag=null;if(panButton){panButton.setAttribute('aria-pressed',String(pan));panButton.classList.toggle('gd-btn--primary',pan)}surface.style.cursor=pan?'grab':''}
   function zoom(factor){if(!active||!bounds)return;camera=current();camera.scale=Math.max(.005,Math.min(12,camera.scale*factor));resize()}
   function fit(){if(!active)return;const [w,h]=size(),[x,y,bw,bh]=fitGeometryBounds(getFitBounds(),w,h);camera={x:x+bw/2,y:y+bh/2,scale:Math.max(.005,Math.min(12,w/bw))};resize()}
   function makeNavigation(){
     nav=geometryNavigation();overlay.append(nav);
     panButton=instrumentButton(nav,'pan','Pan','Pan drawing without moving geometry',()=>setPan(!pan),'agNav');setPan(false);
     instrumentButton(nav,'zoom-out','−','Zoom out',()=>zoom(.8),'agNav');instrumentButton(nav,'zoom-in','+','Zoom in',()=>zoom(1.25),'agNav');instrumentButton(nav,'fit','Fit','Fit all finite geometry in view',fit,'agNav');
   }
   function makePanel(group,i){
     const [title,node]=group,panel=geometryPalette(overlay,title,[node],i?'calc(100% - 340px)':'10px',i?'54px':'46px',{dynamic:true});panels.push(panel);
     if(i&&surface.clientWidth<600)panel.querySelector('.gd-ag-full-panel-head button').click();
   }
   // Capture navigation gestures before construction/constraint handlers.
   surface.addEventListener('pointerdown',e=>{if(geometryBusy())return;if(drag){e.preventDefault();e.stopImmediatePropagation();return}if(e.target.closest?.('[data-ag-local-instrument]')||!active||e.button!==0||!bounds||(!pan&&!canPan(e)))return;e.preventDefault();e.stopImmediatePropagation();drag={id:e.pointerId,x:e.clientX,y:e.clientY,c:current(),pending:!pan};try{surface.setPointerCapture(e.pointerId)}catch(_){}},true);
   surface.addEventListener('pointermove',e=>{if(!active||(!pan&&drag?.id!==e.pointerId))return;e.preventDefault();e.stopImmediatePropagation();if(drag?.id!==e.pointerId)return;if(drag.pending&&Math.hypot(drag.x-e.clientX,drag.y-e.clientY)<5)return;drag.pending=false;const c=drag.c;camera={...c,x:c.x+(drag.x-e.clientX)/c.scale,y:c.y+(drag.y-e.clientY)/c.scale};resize()},true);
   for(const type of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(type,e=>{if(!active||(!pan&&drag?.id!==e.pointerId))return;e.stopImmediatePropagation();if(drag?.id===e.pointerId)drag=null},true);
   surface.addEventListener('wheel',e=>{if(!active)return;e.preventDefault();zoom(e.deltaY<0?1.25:.8)},{passive:false});
   for(const [,node] of groups)node.addEventListener('click',e=>{if(pan&&e.target.closest('button,select,input'))setPan(false)},true);
   surface._tt99SetFullBoard=value=>{value=!!value;if(value===active){if(value)resize();return}active=value;camera=null;setPan(false);surface.dataset.agFullActive=String(active);box.classList.toggle('gd-ag-full-board',active);box.closest('#gd-stage')?.classList.toggle('gd-ag-full-stage',active);document.documentElement.classList.toggle('gd-ag-full-page',active);
     if(active){surface.style.cssText='position:absolute;inset:0;width:100%;height:100%;touch-action:none;background:white';overlay=document.createElement('div');overlay.className='gd-ag-lab-toolbar gd-ag-full-tools';box.append(overlay);makeNavigation();groups.forEach(makePanel);hidden=false;dock=geometryPaletteDock(overlay,value=>{hidden=value;panels.forEach(p=>p.hidden=hidden);if(!hidden)panels.forEach(clamp)});resize()
     }else{for(const [,node] of groups)box.insertBefore(node,surface);overlay?.remove();overlay=null;panels=[];dock=null;nav=null;panButton=null;bounds=null;surface.style.cssText=originalStyle;redraw()}
   };
   if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(()=>{if(!surface.isConnected){observer.disconnect();return}resize()});observer.observe(surface)}
   return {bounds:()=>active?bounds:null,isFull:()=>active,refreshPanels:()=>{panels.forEach((panel,i)=>{if(groups[i][1].hidden)panel.style.display='none';else{panel.style.display='';clamp(panel)}})},style:svg=>{svg.style.cssText=active?'width:100%;height:100%;display:block;max-height:none;max-width:none':'width:100%;height:auto;max-height:620px;display:block'}};
 }
 function localTraceAction(svg,point,name,st,onToggle){
   if(!point)return;
   const enabled=st.traceNames?.includes(name);
   localInstrumentActions(svg,point,'Point '+name,[['toggle',(enabled?'Stop':'Start')+' tracing '+name,'trace',onToggle,!!enabled]],'agPointTrace');
 }
 function mountCustomGeometry(box,initial,onChange,onExit){
   let st=JSON.parse(JSON.stringify(initial||customInitial())),op='free',placing=null,drag=null,tracing=false,history=[],status='',selectedPoint=null;
   const bar=document.createElement('div');bar.className='gd-ag-inspect-tools gd-ag-dynamic-controls';
   const mode=document.createElement('select');mode.className='gd-select';mode.setAttribute('aria-label','Dynamic geometry workspace');mode.dataset.agLocusPreset='1';
   for(const [id,label] of [['custom','Custom construction'],...Object.entries(LOCUS_PRESETS).map(([k,v])=>[k,v.label])]){const o=document.createElement('option');o.value=id;o.textContent=label;mode.append(o)}mode.value='custom';mode.onchange=()=>{const kind=mode.value;cancelDrag();onExit(kind)};bar.append(mode);
   const panel=document.createElement('div');panel.className='gd-ag-inspect-tools gd-ag-dynamic-controls';
   const select=document.createElement('select');select.className='gd-select';select.dataset.agCustomOperation='1';select.setAttribute('aria-label','Construction operation');
   for(const [title,filter] of [['Points',k=>CUSTOM_OPERATIONS[k].place],['Dependent relationships',k=>!CUSTOM_OPERATIONS[k].place&&!CUSTOM_OPERATIONS[k].object],['Lines and circles',k=>CUSTOM_OPERATIONS[k].object]]){const group=document.createElement('optgroup');group.label=title;for(const [id,spec] of Object.entries(CUSTOM_OPERATIONS).filter(([k])=>filter(k))){const o=document.createElement('option');o.value=id;o.textContent=spec.label;group.append(o)}select.append(group)}panel.append(select);
   const fields=document.createElement('div');fields.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:6px';panel.append(fields);
   const makeButton=(parent,id,label,fn)=>{const b=document.createElement('button');b.className='gd-btn gd-ag-inspect-btn';b.type='button';b.textContent=label;b.dataset.agCustomAction=id;b.onclick=fn;parent.append(b);return b};
   const trace=makeButton(bar,'trace','Trace',()=>{tracing=!tracing;placing=null;selectedPoint=null;paint()});
   const grid=makeButton(bar,'grid','Grid',()=>{st.grid=!st.grid;changed()});
   const undo=makeButton(bar,'undo','Undo',()=>{if(cancelDrag()){paint();return}if(history.length){st=history.pop();placing=null;selectedPoint=null;changed(true)}});
   makeButton(bar,'clear-traces','Clear traces',()=>{st.traces={};changed()});
   makeButton(bar,'reset','Reset',()=>{cancelDrag();remember();st=customInitial();placing=null;selectedPoint=null;changed(true)});
   const hint=document.createElement('span');hint.className='gd-ag-inspect-message';hint.setAttribute('role','status');bar.append(hint);
   const addBtn=makeButton(panel,'add','Place point',()=>{try{const spec=CUSTOM_OPERATIONS[op],refs=[...fields.querySelectorAll('[data-ag-custom-ref]')].map(e=>e.value),value=Number(fields.querySelector('[data-ag-custom-value]')?.value),branch=Number(fields.querySelector('[data-ag-custom-branch]')?.value)||0;if(refs.some(id=>!id)||new Set(refs).size!==refs.length)throw Error('Choose the required distinct points.');tracing=false;selectedPoint=null;if(spec.place){placing={op,refs,value,branch};status='Tap the workspace to position the point.';paint()}else{remember();customAppend(st,op,refs,{value,branch});placing=null;status='Relationship added.';changed(true)}}catch(e){status=e.message;paint()}});
   const surface=document.createElement('div');surface.style.cssText='touch-action:none;width:100%;min-width:0';box.replaceChildren(bar,panel,surface);const boardView=dynamicBoard(box,surface,[['Dynamic geometry',bar],['Construction',panel]],()=>customBounds(st),()=>paint(),()=>customBounds(st,40,true),e=>{if(placing||tracing)return false;const hit=locate(e);return !!hit&&!Object.values(customResolve(st).points).some(p=>labDist(p,hit.p)<=hit.tol)},()=>!!drag,cancelDrag);
   function remember(){history.push(JSON.parse(JSON.stringify(st)));if(history.length>60)history.shift()}
   function buildFields(){const previous=[...fields.querySelectorAll('[data-ag-custom-ref]')].map(e=>e.value);fields.replaceChildren();const spec=CUSTOM_OPERATIONS[op];
     function field(label,options,data,index,current){const wrap=document.createElement('label');wrap.style.cssText='display:flex;align-items:center;gap:4px;font-size:11px';wrap.textContent=label;const el=document.createElement('select');el.className='gd-select';el.dataset[data]=index;el.setAttribute('aria-label',label);for(const [v,l] of options){const o=document.createElement('option');o.value=v;o.textContent=l;el.append(o)}if(options.some(x=>String(x[0])===String(current)))el.value=current;wrap.append(el);fields.append(wrap)}
     spec.refs.forEach((label,i)=>field(label,[['','Choose'],...st.nodes.map(n=>[n.id,n.id])],'agCustomRef',i,previous[i]||st.nodes[i]?.id));
     if(spec.values)field(op==='ratio'?'Fraction of AB':op==='angle'?'Angle (°)':'Length (cm)',spec.values.map(v=>[v,op==='ratio'?({0.3333333333333333:'1/3',0.6666666666666666:'2/3'}[v]||String(v)):String(v)]),'agCustomValue',1,spec.values[0]);
     if(spec.branches)field('Solution',[[0,'First'],[1,'Second']],'agCustomBranch',1,0);
     addBtn.textContent=spec.place?'Place point':spec.object?'Draw':'Add point';addBtn.disabled=st.nodes.length<spec.refs.length;select.value=op
   }
   select.onchange=()=>{op=select.value;placing=null;tracing=false;selectedPoint=null;status='';buildFields();paint()};
   function changed(rebuild=false){if(rebuild)buildFields();onChange(JSON.parse(JSON.stringify(st)));paint()}
   function paint(){const {points,invalid}=customResolve(st);trace.setAttribute('aria-pressed',String(tracing));grid.setAttribute('aria-pressed',String(st.grid));undo.disabled=!history.length&&!drag;hint.textContent=(tracing?'Tap a point to toggle its trace.':placing?'Tap to position the new point.':status||'Drag green points; tap any point for tracing. Dependent dark points follow. Drag empty space to pan in full board.')+(invalid.length?' Undefined relationships: '+invalid.join(', ')+'.':'');const svg=diagram({type:'diagram',mode:'loci',locusState:st},false,{dynamicBounds:boardView.bounds()});boardView.style(svg);surface.replaceChildren(svg);if(!tracing&&!placing&&!drag&&selectedPoint)localTraceAction(svg,points[selectedPoint],selectedPoint,st,()=>{remember();traceToggle(st,selectedPoint);changed()})}
   function locate(e){const svg=surface.querySelector('svg'),m=svg?.getScreenCTM();if(!m)return null;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());const {x,y,width:w,height:h}=svg.viewBox.baseVal;return {p:[locusClamp(p.x,x+8,x+w-8),locusClamp(p.y,y+8,y+h-8)],tol:Math.min(40,24/Math.hypot(m.a,m.b))}}
   surface.addEventListener('pointerdown',e=>{if(e.button!==0||drag)return;const hit=locate(e);if(!hit)return;e.preventDefault();const points=customResolve(st).points;
     const nearest=Object.keys(points).sort((a,b)=>labDist(points[a],hit.p)-labDist(points[b],hit.p)).find(n=>labDist(points[n],hit.p)<=hit.tol);
     if(tracing){if(nearest){traceToggle(st,nearest);changed()}return}
     if(placing){try{remember();customAppend(st,placing.op,placing.refs,{...placing,at:hit.p});placing=null;status='Point added.';changed(true)}catch(e){status=e.message;paint()}return}
     if(!nearest){selectedPoint=null;paint();return}drag={id:e.pointerId,name:nearest,x:e.clientX,y:e.clientY,pending:true,movable:!!CUSTOM_OPERATIONS[st.nodes.find(n=>n.id===nearest)?.op]?.place};try{surface.setPointerCapture(e.pointerId)}catch(_){}
   });
   function cancelDrag(){if(!drag)return false;const d=drag;drag=null;if(d.prior){st=d.prior;changed()}try{if(surface.hasPointerCapture(d.id))surface.releasePointerCapture(d.id)}catch(_){}return true}
   function moveDrag(e){if(!drag||drag.id!==e.pointerId||!drag.movable)return;e.preventDefault();if(drag.pending){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5)return;drag.prior=JSON.parse(JSON.stringify(st));drag.pending=false;selectedPoint=null}for(const sample of [...(e.getCoalescedEvents?.()||[]),e]){const hit=locate(sample);if(hit)customMove(st,drag.name,hit.p)}changed()}
   surface.addEventListener('pointermove',moveDrag);
   const finish=e=>{if(drag?.id!==e.pointerId)return;if(e.type!=='pointerup'){cancelDrag();paint();return}moveDrag(e);const d=drag;drag=null;if(d.prior){history.push(d.prior);if(history.length>60)history.shift()}if(d.pending&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<5)selectedPoint=d.name;paint()};for(const t of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(t,finish);
   buildFields();paint();
 }
 function mountLoci(box,initial,onChange){
   if(initial?.kind==='custom'){mountCustomGeometry(box,initial,onChange,kind=>{const st=locusInitial(kind);onChange(st);mountLoci(box,st,onChange)});return}
   let st=JSON.parse(JSON.stringify(initial||locusInitial())),drag=null,selecting=false,selectedPoint=null;
   const bar=document.createElement('div');bar.className='gd-ag-inspect-tools gd-ag-dynamic-controls';
   const choice=document.createElement('select');choice.className='gd-select';choice.setAttribute('aria-label','Locus relationship');choice.dataset.agLocusPreset='1';
   for(const [title,filter] of [['Loci & relationships',k=>!Object.hasOwn(SHAPE_DEFAULTS,k)&&!Object.hasOwn(RELATION_DEFAULTS,k)],['Constrained shapes',k=>Object.hasOwn(SHAPE_DEFAULTS,k)],['Circles & tangents',k=>Object.hasOwn(RELATION_DEFAULTS,k)]]){const group=document.createElement('optgroup');group.label=title;for(const [value,{label}] of Object.entries(LOCUS_PRESETS).filter(([k])=>filter(k))){const o=document.createElement('option');o.value=value;o.textContent=label;group.append(o)}choice.append(group)}const customOption=document.createElement('option');customOption.value='custom';customOption.textContent='Custom construction';choice.append(customOption);choice.value=st.kind;bar.append(choice);
   const button=(id,label,fn)=>{const b=document.createElement('button');b.type='button';b.className='gd-btn gd-ag-inspect-btn';b.dataset.agLocusAction=id;b.textContent=label;b.onclick=fn;bar.append(b);return b};
   const configure=button('settings','Dimensions',()=>{settingsBar.hidden=!settingsBar.hidden;configure.setAttribute('aria-pressed',String(!settingsBar.hidden));boardView.refreshPanels()});
   const trace=button('trace','Select trace point',()=>{selecting=!selecting;selectedPoint=null;paint()});
   const mid=button('midpoint','Show midpoint M',()=>{st.showMidpoint=!st.showMidpoint;changed()});
   const guide=button('guide','Reveal locus',()=>{st.showLocus=!st.showLocus;changed()});
   button('clear','Clear traces',()=>{st.traces={};changed()});
   button('reset','Reset',()=>{cancelDrag();st=locusInitial(st.kind,st.params);selecting=false;selectedPoint=null;changed()});
   const hint=document.createElement('span');hint.className='gd-ag-inspect-message';hint.setAttribute('role','status');bar.append(hint);
   const settingsBar=document.createElement('div');settingsBar.className='gd-ag-inspect-tools gd-ag-dynamic-controls';settingsBar.hidden=true;const surface=document.createElement('div');surface.style.cssText='touch-action:none;width:100%';box.replaceChildren(bar,settingsBar,surface);const boardView=dynamicBoard(box,surface,[['Dynamic geometry',bar],['Dimensions',settingsBar]],()=>[0,0,800,440],()=>paint(),()=>locusFitBounds(st),e=>{if(selecting)return false;const hit=locate(e);return !!hit&&!Object.values(locusPoints(st)).some(p=>labDist(p,hit.p)<=hit.tol)},()=>!!drag,cancelDrag);
   function buildSettings(){settingsBar.replaceChildren();const values=locusParameters(st.kind,st.params);for(const [id,label,min,max,step] of LOCUS_PARAMETERS[st.kind]||[]){const wrap=document.createElement('label');wrap.style.cssText='display:flex;align-items:center;gap:6px;font-size:12px';wrap.textContent=label;const input=document.createElement('select');input.className='gd-select';input.style.width='76px';for(let v=min;v<=max+1e-8;v+=step){const option=document.createElement('option');option.value=v;option.textContent=v;input.append(option)}input.value=values[id];input.dataset.agLocusParameter=id;wrap.append(input);settingsBar.append(wrap)}const apply=instrumentButton(settingsBar,'reset','Apply','Apply dimensions and clear previous traces',()=>{const raw=Object.fromEntries([...settingsBar.querySelectorAll('[data-ag-locus-parameter]')].map(e=>[e.dataset.agLocusParameter,e.value]));const params=locusParameters(st.kind,raw),next=locusInitial(st.kind,params);next.showMidpoint=st.showMidpoint;next.showLocus=st.showLocus;next.traceNames=st.traceNames;st=next;selectedPoint=null;buildSettings();changed()},'agLocusAction');apply.dataset.agLocusAction='apply';apply.classList.add('gd-ag-inspect-btn');const note=document.createElement('span');note.className='gd-ag-inspect-message';note.textContent='Applying new dimensions clears old traces.';settingsBar.append(note)}
   choice.onchange=()=>{cancelDrag();if(choice.value==='custom'){const next=customInitial();onChange(next);mountLoci(box,next,onChange);return}st=locusInitial(choice.value);selecting=false;selectedPoint=null;buildSettings();changed()};buildSettings();
   function changed(){onChange(JSON.parse(JSON.stringify(st)));paint()}
   function paint(){
     trace.setAttribute('aria-pressed',String(selecting));trace.classList.toggle('gd-btn--primary',selecting);configure.hidden=!(LOCUS_PARAMETERS[st.kind]?.length);if(configure.hidden){settingsBar.hidden=true;configure.setAttribute('aria-pressed','false')}guide.hidden=!locusPreset(st.kind,st.params).guides.length;
     mid.textContent=st.showMidpoint?'Hide midpoint M':'Show midpoint M';mid.setAttribute('aria-pressed',String(!!st.showMidpoint));guide.textContent=st.showLocus?'Hide locus guide':'Reveal locus';guide.setAttribute('aria-pressed',String(!!st.showLocus));
     hint.textContent=selecting?'Tap a moving or dependent point to toggle its trace.':('Drag P to investigate; tap a point for tracing. Tracing: '+(st.traceNames?.join(', ')||'off')+'.'+(boardView.isFull()?' Drag empty space to pan.':''));
     if(boardView.isFull())hint.textContent+=' '+locusPreset(st.kind,st.params).summary(st.p)+' · '+locusPreset(st.kind,st.params).rule;const svg=diagram({type:'diagram',mode:'loci',locusState:st},false,{dynamicBounds:boardView.bounds()});boardView.style(svg);surface.replaceChildren(svg);if(!selecting&&!drag&&selectedPoint)localTraceAction(svg,locusPoints(st)[selectedPoint],selectedPoint,st,()=>{traceToggle(st,selectedPoint);changed()});boardView.refreshPanels()
   }
   function locate(e){const svg=surface.querySelector('svg'),m=svg?.getScreenCTM();if(!m)return null;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());return {p:[p.x,p.y],tol:Math.min(45,28/Math.hypot(m.a,m.b))}}
   surface.addEventListener('pointerdown',e=>{if(e.button!==0||drag)return;const hit=locate(e);if(!hit)return;const pts=locusPoints(st);
     if(selecting){const name=Object.keys(pts).filter(n=>!(n in locusPreset(st.kind,st.params).anchors)&&!locusPreset(st.kind,st.params).hiddenPoints?.includes(n)&&(n!=='M'||st.showMidpoint||st.traceNames?.includes('M')||st.traces?.M?.length)).sort((a,b)=>labDist(hit.p,pts[a])-labDist(hit.p,pts[b])).find(n=>labDist(hit.p,pts[n])<=hit.tol);if(name){traceToggle(st,name);changed()}return}
     const preset=locusPreset(st.kind,st.params),name=Object.keys(pts).filter(n=>!(n in preset.anchors)&&!preset.hiddenPoints?.includes(n)&&(n!=='M'||st.showMidpoint||st.traceNames?.includes('M')||st.traces?.M?.length)).sort((a,b)=>labDist(hit.p,pts[a])-labDist(hit.p,pts[b])).find(n=>labDist(hit.p,pts[n])<=hit.tol);if(!name){selectedPoint=null;paint();return}e.preventDefault();drag={id:e.pointerId,name,x:e.clientX,y:e.clientY,pending:true};try{surface.setPointerCapture(e.pointerId)}catch(_){}
   });
   function cancelDrag(){if(!drag)return false;const d=drag;drag=null;if(d.prior){st=d.prior;changed()}try{if(surface.hasPointerCapture(d.id))surface.releasePointerCapture(d.id)}catch(_){}return true}
   function moveDrag(e){if(drag?.id!==e.pointerId||drag.name!=='P')return;e.preventDefault();if(drag.pending){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5)return;drag.prior=JSON.parse(JSON.stringify(st));drag.pending=false;selectedPoint=null}const samples=e.getCoalescedEvents?.()||[];for(const sample of [...samples,e]){const hit=locate(sample);if(hit)locusTraceMove(st,hit.p)}changed()}
   surface.addEventListener('pointermove',moveDrag);
   const finish=e=>{if(drag?.id!==e.pointerId)return;if(e.type!=='pointerup'){cancelDrag();paint();return}moveDrag(e);const d=drag;drag=null;if(d.pending&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<5)selectedPoint=d.name;paint()};for(const t of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(t,finish);
   paint();
 }

// Measurement hosts reuse the canonical geometry task model, diagrams and
// publication adapter instead of maintaining duplicate angle question families.
G.angleMeasurement={
 types:()=>types().filter(t=>['measure','reflex','estimate','estimate-reflex'].includes(t.id)),
 generate:(type,level,rng=Math.random)=>generate({type,level,mode:'angle'},rng),
 record:task=>G.publishing.record(ID,'challenge',{...geometry(task),revealed:false},{...settings(task.cfg||{}),type:task.type}),
 render(task,teacher=false){return paper(this.record(task),teacher)},
 mount(host,task){
   const d=geometry(task),teacher=!!task.revealed,measuring=['measure','reflex'].includes(d.type)&&!teacher;
   const svg=diagram(d,teacher,{scale:teacher&&['measure','reflex'].includes(d.type),measureWorkspace:measuring});
   svg.style.cssText='width:100%;height:auto;max-height:560px;display:block;margin:auto';host.replaceChildren(svg);
   if(measuring)mountAngleMeasurement(host,svg,d);
   return svg;
 }
};
G.anglesTool=function(){
 let cfg=settings(),demo={type:'diagram',mode:'angle',angle:60,rotation:0,scale:true,clockwise:false,n:5,regular:true,length:5,baseLength:6},task=null,workflow='build',attempt=null,attemptLength=null,scope='',status='',draft=null,lab=null,freeLab=null,motionLab=null,locusState=null;
 // Direct teaching topics are board navigation, not extra drawing tools. Keep
 // the underlying lesson state and standalone controls as the single source of truth.
 const topicRows=[];
 const topic=(value,label,group,mode,extra={})=>topicRows.push({value,label,group,mode,extra});
 for(const [value,label] of MODES.filter(([v])=>['angle','turn','lines'].includes(v)))topic(value,label,'Angles & lines',value);
 for(const [fact,label] of FACT_VIEWS)topic(fact==='straight'?'facts':'facts:'+fact,label,'Angle relationships','facts',{fact});
 for(const [shape,label] of SHAPE_VIEWS){
   const group=shape==='regular'||shape==='free-polygon'?'Polygons':shape.startsWith('triangle-')?'Enrichment — triangles': ['free-triangle','equilateral','isosceles','scalene','right-triangle'].includes(shape)?'Triangles':'Quadrilaterals';
   topic(shape==='regular'?'polygon':'polygon:'+shape,label,group,'polygon',{shapeView:shape});
 }
 topic('centre:centroid','Medians & centroid','Enrichment — triangle centres','polygon',{shapeView:'free-triangle',showMedians:true,triangleCentre:'none'});
 for(const [centre,label] of CENTRE_VIEWS.slice(1))topic('centre:'+centre,label,'Enrichment — triangle centres','polygon',{shapeView:'free-triangle',showMedians:false,triangleCentre:centre});
 for(const [view,label] of CIRCLE_VIEWS)topic(view==='overview'?'circle':'circle:'+view,label,isCircleTheorem(view)?'Enrichment — circle theorems':'Circles','circle',{circleView:view});
 topic('construct','Geometry Construction Lab','Geometry workspaces','construct');
 topic('loci','Dynamic geometry — loci & traces','Geometry workspaces','loci');
 G.geometryTopics={
   read(){
     let value=demo.mode;
     if(value==='polygon'){
       const shape=demo.shapeView||'regular';
       value=shape==='regular'?'polygon':'polygon:'+shape;
       if(shape==='free-triangle'){
         if(demo.showMedians)value='centre:centroid';
         else if(CENTRE_VIEWS.slice(1).some(([k])=>k===demo.triangleCentre))value='centre:'+demo.triangleCentre;
       }
     }else if(value==='facts'&&demo.fact&&demo.fact!=='straight')value='facts:'+demo.fact;
     else if(value==='circle'&&demo.circleView&&demo.circleView!=='overview')value='circle:'+demo.circleView;
     if(!topicRows.some(t=>t.value===value))return null;
     return {value,options:topicRows.map(({value,label,group})=>({value,label,group,disabled:false}))};
   },
   set(value){
     const row=topicRows.find(t=>t.value===value);if(!row||task)return false;
     workflow='build';demo.areaProofStep=0;demo.symmetryRotation=0;demo.symmetryReflectionAngle=0;demo.symmetryReflectionOffset=0;demo.familyExample='current';demo.triangleFamilyExample='current';demo.teachingTab='properties';demo.polygonProofStep=0;demo.polygonProofVertex=0;demo.mode=cfg.mode=row.mode;
     if(row.mode==='construct')demo.freeLab=true;
     if(row.mode==='polygon'&&!value.startsWith('centre:')){demo.showMedians=false;demo.triangleCentre='none'}
     Object.assign(demo,row.extra);render();return true;
   }
 };
 const snapshot=()=>({...cfg,demo:demoData(),task,workflow,attempt,attemptLength,scope,lab,freeLab,motionLab,locusState,pupil:CK.capturePupil(task)});
 const select=(id,opts,current)=>'<select class="gd-select" id="'+id+'">'+opts.map(([v,l])=>'<option value="'+esc(v)+'"'+(String(v)===String(current)?' selected':'')+'>'+esc(l)+'</option>').join('')+'</select>';
 const report=s=>{status=s;const el=q('#ag-status');if(el)el.textContent=s};
 function launch(type){try{const native=CK.nativeScope('ag');if(native)scope=native;const actual=type==='all'?pick(Math.random,types(cfg)).id:type;task=CK.normalise({...generate({...cfg,type:actual}),mode:'standard',answerMode:'manual',revealed:false});task.geometryMode=FAMILIES.find(t=>t[0]===actual)[2];attempt=null;attemptLength=null;lab=null;scope=CK.nativeScope('ag')||scope;workflow='challenge';render()}catch(e){report(e.message)}}
 // CK reserves mode for standard/custom; restore the geometry display mode for drawing/export.
 function geometryTask(t){return t?{...t,mode:t.geometryMode||FAMILIES.find(f=>f[0]===t.type)?.[2]||t.mode}:null}
 function exportRecord(){return {tool:ID,kind:task?'challenge':'diagram',data:task?{...geometryTask(task),revealed:false}:demoData()}}
 async function exportAction(kind){try{const teacher=kind.startsWith('key-');if(teacher&&!task)return;const X=G.exportTools,out=paper(exportRecord(),teacher);if(kind==='copy'||kind==='key-copy')await X.copyPng(out);else if(kind==='png')await X.downloadPng(out,'angles-and-geometry',2);else if(kind==='svg')X.downloadSvg(out,'angles-and-geometry');else X.printSvg(out,{title:teacher?'Angles — teacher key':'Angles & geometry',landscape:true});report('Export ready.')}catch(e){report(e.message)}}
 function publishMethod(method,publicationMode){const P=G.publishing;try{if(!P)throw Error('Publishing unavailable');draft=draft||P.createDocument();draft.addCurrent(ID,{constructionPublication:{type:'construction-method',constructionMethod:method,publicationMode}});P.openEditor(draft)}catch(e){report(e.message)}}
 function publish(batch){const P=G.publishing;try{if(!P)throw Error('Publishing unavailable');draft=draft||P.createDocument();if(batch)P.openQuickGenerate(draft,ID,snapshot());else{draft.addCurrent(ID,snapshot());P.openEditor(draft)}}catch(e){report(e.message)}}
 function controls(){const host=q('#gd-controls'),openSections=new Set([...host.querySelectorAll('details[data-ag-section][open]')].map(e=>e.dataset.agSection)),tabs='<div class="gd-row" role="tablist" aria-label="Angles workflow">'+[['build','Explore'],['challenge','Challenge'],['export','Export']].map(([v,l])=>'<button type="button" class="gd-btn'+(workflow===v?' gd-btn--primary':'')+'" data-ag-workflow="'+v+'">'+l+'</button>').join('')+'</div>';
  const common=field('Curriculum suggestions',select('ag-year',YEARS,cfg.year))+field('Difficulty',select('ag-level',LEVELS,cfg.level))+'<label class="gd-field"><span><input type="checkbox" id="ag-enrich"'+(cfg.enrichment?' checked':'')+'> Include KS3 enrichment</span></label>';
  const avail=types(cfg),groups=challengeGroups(cfg);
  const challenge='<div class="gd-ag-challenge-catalogue" data-gd-native-prefix="ag" data-gd-native-groups="'+esc(JSON.stringify(groups))+'"><button type="button" class="gd-btn gd-btn--primary" data-gd-native-random="all">Random challenge</button><p class="gd-help">Choose any question, or generate randomly from a category.</p>'+groups.map((g,index)=>'<details class="gd-ag-challenge-section" data-ag-section="'+g.id+'"><summary>'+esc(g.label)+' <span>'+g.ids.length+'</span></summary><div class="gd-ag-challenge-options"><button type="button" class="gd-btn" data-gd-native-random="'+index+'">Random · '+esc(g.label)+'</button><div class="gd-ag-challenge-types">'+g.ids.map(id=>{const t=avail.find(x=>x.id===id);return '<button type="button" class="gd-btn" data-ag-challenge-mode="'+t.id+'">'+esc(t.label)+'</button>'}).join('')+'</div></div></details>').join('')+'</div><details class="gd-ag-challenge-section" data-ag-section="settings"><summary>Generation settings</summary><div class="gd-ag-challenge-options">'+common+'<p class="gd-help">Year suggestions are advisory; KS3 is optional.</p></div></details>';
  const angleField=(max=360,min=0)=>field(demo.mode==='turn'?'Turn amount':'Angle opening',select('ag-value',Array.from({length:max-min+1},(_,i)=>[i+min,(i+min)+'°']),Math.max(min,Math.min(max,demo.angle))));
  const rotationField=field(demo.mode==='turn'?'Starting direction':'Orientation',select('ag-rotation',Array.from({length:24},(_,i)=>[i*15,i*15+'°']),demo.rotation));
  const check=(id,label,on)=>'<label class="gd-field"><span><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'> '+label+'</span></label>';
  const modeFields={
    angle:angleField()+rotationField+check('ag-scale','Show protractor',demo.scale),
    turn:angleField()+rotationField+field('Turn direction',select('ag-direction',[['cw','Clockwise'],['ccw','Anticlockwise']],demo.clockwise?'cw':'ccw')),
    polygon:check('ag-fill','Shade whole shape (demonstration)',demo.showFill===true)+field('Shape',select('ag-shape-view',SHAPE_VIEWS,demo.shapeView||'regular'))+(demo.shapeView==='triangle-inequality'?inequalitySettings(demo).map((v,i)=>field('Side '+['a','b','c'][i]+' (cm)',select('ag-inequality-'+i,Array.from({length:15},(_,j)=>[j+1,j+1]),v))).join('')+'<p class="gd-help">Choose three side lengths, predict whether they can close, then reveal.</p>':demo.shapeView==='triangle-criterion'?field('Given information',select('ag-criterion',Object.entries(TRIANGLE_CRITERIA).map(([id,v])=>[id,v.label]),demo.criterion||'SSS'))+field('Example size',select('ag-criterion-size',[[1,'Small'],[2,'Medium'],[3,'Large']],demo.criterionSize||1))+'<p class="gd-help">Predict whether the stated information fixes a unique triangle, then reveal.</p>':demo.shapeView==='triangle-comparison'?field('Scale factor',select('ag-comparison-factor',[[.5,'½'],[1,'1'],[1.5,'1½'],[2,'2']],demo.comparison?.factor||1))+field('Second triangle orientation',select('ag-comparison-rotation',Array.from({length:8},(_,i)=>[i*45,i*45+'°']),demo.comparison?.rotation||0))+check('ag-comparison-mirror','Reflect second triangle',demo.comparison?.mirror===true)+check('ag-comparison-distort','Change proportions',demo.comparison?.distort===true)+check('ag-comparison-measures','Show side lengths',demo.comparisonMeasures!==false):['free-triangle','free-quadrilateral','free-polygon'].includes(demo.shapeView)?'<p class="gd-help">Drag any vertex to investigate the changing properties.</p>':rotationField)+(['triangle-criterion','triangle-comparison','triangle-inequality'].includes(demo.shapeView)?'':(demo.shapeView==='free-polygon'?field('Sides',select('ag-sides',Array.from({length:10},(_,i)=>[i+3,i+3]),demo.n))+check('ag-triangulate','Show triangulation',demo.triangulate!==false)+field('Inspect vertex',select('ag-polygon-vertex',Array.from({length:demo.n||5},(_,i)=>[i,pointName(i)]),Math.min(demo.n-1,demo.polygonVertex||0)))+check('ag-polygon-turns','Show exterior turn',demo.showTurns===true):!demo.shapeView||demo.shapeView==='regular'?field('Sides',select('ag-sides',Array.from({length:10},(_,i)=>[i+3,i+3]),demo.n))+check('ag-regular','Regular polygon',demo.regular)+check('ag-triangulate','Show triangulation',demo.triangulate!==false):check('ag-sides-mark','Mark equal sides',demo.showSides!==false)+(['free-quadrilateral','square','rectangle','rhombus','parallelogram','trapezium','kite'].includes(demo.shapeView)?check('ag-diagonals','Show diagonals',demo.showDiagonals===true)+check('ag-parallel','Mark parallel sides',demo.showParallel===true):''))+check('ag-corners','Show interior angles',demo.showCorners!==false)+(['free-quadrilateral','free-polygon'].includes(demo.shapeView)?check('ag-properties','Reveal classifications',demo.showProperties!==false):'')+(['free-triangle','equilateral','isosceles','scalene','right-triangle'].includes(demo.shapeView)?check('ag-height','Show perpendicular height',demo.showHeight===true)+check('ag-properties','Reveal classifications',demo.showProperties!==false)+check('ag-medians','Medians & centroid (enrichment)',demo.showMedians===true)+field('Triangle centre (enrichment)',select('ag-triangle-centre',CENTRE_VIEWS,demo.triangleCentre||'none')):'')),
    circle:field('Explore',select('ag-circle-view',CIRCLE_VIEWS,demo.circleView||'overview'))+((!demo.circleView||demo.circleView==='overview')?check('ag-fill','Shade whole circle (demonstration)',demo.showFill===true):'<p class="gd-help">'+(demo.circleView==='equal-tangents'?'Drag P outside the circle.':'Drag the labelled point or points around the circumference.')+'</p>')+field('Radius (cm)',select('ag-radius',Array.from({length:15},(_,i)=>[i+1,(i+1)+' cm']),demo.radius||5))+(isCircleTheorem(demo.circleView)?'':check('ag-circle-extension','Show KS3 formulae and working',demo.circleEnrichment===true)),
    'free-explore':'<p class="gd-help">Draw freely and move vertices to test what happens when a shape loses its properties. Trace any chosen point.</p>',
    loci:'<p class="gd-help">Move a constrained point and record the path it follows.</p>',
    construct:'<p class="gd-help">Draw with instruments. Enable Allow points to move in the workspace to explore and trace the same drawing.</p>' ,
    facts:angleField(TRANSVERSAL_VIEWS.includes(demo.fact)?145:170,TRANSVERSAL_VIEWS.includes(demo.fact)?35:10)+field('Angle relationship',select('ag-fact',FACT_VIEWS,demo.fact||'straight'))+(TRANSVERSAL_VIEWS.includes(demo.fact)?check('ag-transversal-parallel','Lines are parallel',demo.transversalParallel!==false):rotationField),
    lines:field('Line relationship',select('ag-relation',[['Parallel','Parallel'],['Perpendicular','Perpendicular'],['Neither','Neither']],demo.relation||'Neither'))+rotationField+(!demo.relation||demo.relation==='Neither'?angleField(80,10):'')
  };
  const modeGroups=[['Teaching diagrams',['angle','turn','lines','facts','polygon','circle']],['Geometry workspaces',['construct','loci']]];
  const modeLabels={'construct':'Geometry Construction Lab','free-explore':'Free exploration — movable points','loci':'Dynamic geometry — loci & traces'};
  const groupedModes='<select class="gd-select" id="ag-mode" aria-label="Geometry activity">'+modeGroups.map(([group,ids])=>'<optgroup label="'+esc(group)+'">'+ids.map(id=>'<option value="'+esc(id)+'"'+(demo.mode===id?' selected':'')+'>'+esc(modeLabels[id]||MODES.find(m=>m[0]===id)[1])+'</option>').join('')+'</optgroup>').join('')+'</select>';
  const exploration=field('Geometry activity',groupedModes)+modeFields[demo.mode];
  const exports='<p class="gd-help">'+(task?'Pupil copies always hide the answer. Use a separate teacher key.':'Export the current teaching diagram.')+'</p><div class="gd-row">'+btn('Copy image','ag-copy')+btn('PNG','ag-png')+btn('SVG','ag-svg')+btn('Print / PDF','ag-print')+'</div>'+(task?'<div class="gd-row">'+btn('Copy answer key','ag-key-copy')+btn('Print answer key','ag-key-print')+'</div>':'')+'<div class="gd-row">'+btn('Add current item','ag-add')+btn('Generate questions…','ag-batch')+'</div>'+btn('Review worksheet','ag-review');
  host.innerHTML=tabs+(workflow==='challenge'?challenge:workflow==='export'?exports:exploration)+'<p class="gd-help" id="ag-status" role="status">'+esc(status)+'</p>';
  host.querySelectorAll('details[data-ag-section]').forEach(el=>el.open=openSections.has(el.dataset.agSection));
  qa('[data-ag-workflow]',host).forEach(b=>b.onclick=()=>{workflow=b.dataset.agWorkflow;if(workflow==='build'){task=null;attempt=null;scope=''}render()});
  qa('[data-ag-challenge-mode]',host).forEach(b=>b.onclick=()=>{scope='';launch(b.dataset.agChallengeMode)});
  const bind=(id,fn)=>{const el=q('#'+id,host);if(el)el.onchange=e=>{fn(e.target);render()}};
  bind('ag-year',e=>cfg.year=e.value);bind('ag-level',e=>cfg.level=e.value);bind('ag-enrich',e=>cfg.enrichment=e.checked);bind('ag-mode',e=>{demo.mode=e.value;cfg.mode=e.value;if(e.value==='construct')demo.freeLab=true});bind('ag-value',e=>demo.angle=+e.value);bind('ag-rotation',e=>demo.rotation=+e.value);bind('ag-scale',e=>demo.scale=e.checked);bind('ag-direction',e=>demo.clockwise=e.value==='cw');bind('ag-sides',e=>{demo.n=+e.value;delete demo.polygonPoints;demo.polygonVertex=0});bind('ag-polygon-vertex',e=>demo.polygonVertex=+e.value);bind('ag-polygon-turns',e=>demo.showTurns=e.checked);bind('ag-regular',e=>demo.regular=e.checked);bind('ag-triangulate',e=>demo.triangulate=e.checked);bind('ag-corners',e=>demo.showCorners=e.checked);bind('ag-height',e=>demo.showHeight=e.checked);bind('ag-properties',e=>demo.showProperties=e.checked);bind('ag-medians',e=>{demo.showMedians=e.checked;if(e.checked)demo.triangleCentre='none'});bind('ag-triangle-centre',e=>{demo.triangleCentre=e.value;if(e.value!=='none')demo.showMedians=false});bind('ag-shape-view',e=>demo.shapeView=e.value);for(const [id,key,read] of [['ag-comparison-factor','factor',e=>+e.value],['ag-comparison-rotation','rotation',e=>+e.value],['ag-comparison-mirror','mirror',e=>e.checked],['ag-comparison-distort','distort',e=>e.checked]])bind(id,e=>demo.comparison={...(demo.comparison||{}),[key]:read(e)});bind('ag-comparison-measures',e=>demo.comparisonMeasures=e.checked);bind('ag-criterion',e=>{demo.criterion=e.value;demo.criterionReveal=false});bind('ag-criterion-size',e=>{demo.criterionSize=+e.value;demo.criterionReveal=false});for(let i=0;i<3;i++)bind('ag-inequality-'+i,e=>{const a=inequalitySettings(demo);a[i]=+e.value;demo.inequalityLengths=a;demo.inequalityReveal=false});bind('ag-sides-mark',e=>demo.showSides=e.checked);bind('ag-diagonals',e=>demo.showDiagonals=e.checked);bind('ag-parallel',e=>demo.showParallel=e.checked);bind('ag-radius',e=>demo.radius=+e.value);bind('ag-circle-view',e=>demo.circleView=e.value);bind('ag-fill',e=>demo.showFill=e.checked);bind('ag-circle-extension',e=>demo.circleEnrichment=e.checked);bind('ag-length',e=>demo.length=+e.value);bind('ag-free-lab',e=>demo.freeLab=e.checked);bind('ag-fact',e=>demo.fact=e.value);bind('ag-transversal-parallel',e=>demo.transversalParallel=e.checked);bind('ag-relation',e=>demo.relation=e.value);
  for(const kind of ['copy','png','svg','print',...(task?['key-copy','key-print']:[])]){let el=q('#ag-'+kind,host);if(!el){el=document.createElement('button');el.hidden=true;el.type='button';host.appendChild(el)}el.setAttribute('data-gd-direct-export',kind);el.onclick=()=>exportAction(kind)}
  const ad=q('#ag-add',host);if(ad)ad.onclick=()=>publish(false);const ba=q('#ag-batch',host);if(ba)ba.onclick=()=>publish(true);const re=q('#ag-review',host);if(re)re.onclick=()=>{const P=G.publishing;if(P){draft=draft||P.createDocument();P.openEditor(draft)}};
 }
 function demoData(){if(demo.mode==='facts'){const f=demo.fact||'straight',a=Math.max(10,Math.min(170,demo.angle));if(TRANSVERSAL_VIEWS.includes(f))return {...demo,type:'transversal',fact:f,angle:Math.max(35,Math.min(145,a))};return {...demo,type:f,angles:f==='straight'?[a,180-a]:f==='point'?[a,90,270-a]:[a,180-a,a,180-a]}}if(demo.mode==='lines')return {...demo,angle:demo.relation==='Parallel'?0:demo.relation==='Perpendicular'?90:Math.max(10,Math.min(80,demo.angle)),relation:demo.relation||'Neither'};if(demo.mode==='loci')return {...demo,locusState:locusState||locusInitial()};if(demo.mode==='free-explore')return {...demo,labDrawing:motionLab||labEmpty(true)};if(demo.mode==='construct')return {...demo,angle:Math.max(10,Math.min(170,demo.angle)),labDrawing:freeLab||labEmpty(true)};return demo}
 function stage(){const host=q('#gd-stage'),draw=['draw','draw-reflex'].includes(task?.type),build=labTypes.includes(task?.type),construct=draw||build,d=task?geometryTask(task):demoData(),teacher=!task||task.revealed;
  const pupil=construct?CK.pupilSpec('model',{hint:draw?'Drag the orange arm to the correct graduation, then check.':'Use the geometry tools to complete the construction, then check.',ready:()=>build?labCheck(lab||labEmpty(),task).ready:attempt!==null,check:()=>build?labCheck(lab||labEmpty(),task).correct:Math.abs(attempt-task.angle)<=1}):task?.choices?CK.pupilSpec('choice',{choices:task.choices,expected:task.answer}):CK.pupilSpec('number');
  host.innerHTML=(task?CK.bannerHtml(task,{pupil,actions:[{action:'another',label:'Another'},{action:'end',label:'Exit challenge'}]}):'')+'<div class="gd-ag-visual" style="width:100%;max-width:920px;margin:0 auto"></div>';
  const box=q('.gd-ag-visual',host);
  let reference=null;
  function syncReferenceTabs(){
    if(!reference)return;
    const body=q('[data-ag-shape-reference-body]',reference),nav=q('[data-ag-teaching-tabs]',reference),sections=[...body.querySelectorAll(':scope > section')];
    const tabs=[['properties','Properties & formulae'],['polygon-proof','Diagonals & angle sums'],['symmetry','Symmetry'],['families','Shape families'],['proof','Area proof'],['pythagoras','Pythagoras'],['area-comparison','Area & perimeter'],['reasoning','Always / sometimes / never']];
    sections.forEach(section=>{section.dataset.agTeachingPanel=section.matches('[data-ag-rotation-reference],[data-ag-reflection-reference]')?'symmetry':section.matches('[data-ag-family-reference],[data-ag-triangle-family-reference]')?'families':section.matches('[data-ag-geometry-reasoning]')?'reasoning':section.matches('[data-ag-area-comparison]')?'area-comparison':section.matches('[data-ag-pythagoras-proof]')?'pythagoras':section.matches('[data-ag-area-proof]')?'proof':section.matches('[data-ag-polygon-proof]')?'polygon-proof':'properties'});
    const available=tabs.filter(([key])=>sections.some(s=>s.dataset.agTeachingPanel===key)),signature=available.map(([key])=>key).join(',');
    const selected=available.some(([key])=>key===demo.teachingTab)?demo.teachingTab:'properties';
    demo.teachingTab=selected;
    if(nav.dataset.signature!==signature){
      nav.dataset.signature=signature;nav.replaceChildren();
      for(const [key,label] of available){const button=document.createElement('button');button.type='button';button.className='gd-btn';button.dataset.agTeachingTab=key;button.textContent=label;button.onclick=()=>{demo.teachingTab=key;syncReferenceTabs()};nav.appendChild(button)}
    }
    for(const button of nav.querySelectorAll('button')){const active=button.dataset.agTeachingTab===selected;button.setAttribute('aria-pressed',String(active));button.classList.toggle('gd-btn--primary',active)}
    for(const section of sections)section.hidden=section.dataset.agTeachingPanel!==selected;
    nav.hidden=!available.length;
    body.dataset.agTeachingActive=selected;
  }
  function updateReference(){
    if(!reference)return;const m=shapeTeachingReference(d),body=q('[data-ag-shape-reference-body]',reference);
    if(!m?.valid){body.innerHTML='<p>Move the vertices to form a simple, non-degenerate polygon before inspecting its properties.</p>';syncReferenceTabs();return}
    body.innerHTML=m.groups.map(g=>'<section><h4>'+esc(g.title)+'</h4><dl>'+g.rows.map(([label,value])=>'<dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd>').join('')+'</dl></section>').join('');
    [...body.querySelectorAll('section')].forEach((section,i)=>section.insertBefore(shapeReferenceGraphic(m,['symmetry','diagonals','area'][i]),section.querySelector('dl')));
    mountPolygonFormulaProof(body,m,demo);
    mountRotationReference(body,m,demo);
    mountReflectionReference(body,m,demo);
    if(m.quad)mountQuadrilateralFamily(body,m,demo);
    if(m.n===3)mountTriangleFamily(body,m,demo);
    const proof=shapeAreaProof(m);if(proof)mountAreaProof(body,proof,demo);const pyth=pythagorasProof(m.points);if(pyth)mountPythagorasProof(body,pyth,demo);
    mountAreaComparison(body,demo);
    mountGeometryReasoning(body,demo);
    syncReferenceTabs();
  }
  // Capture on the persistent wrapper: the SVG may be replaced on every
  // snapped degree, but pointer capture and the coordinate transform survive.
  let drag=null,triangleDrag=null,circleDrag=null;const freeCircle=!task&&demo.mode==='circle'&&CIRCLE_VIEWS.slice(1).some(([k])=>k===demo.circleView),theoremCircle=freeCircle&&isCircleTheorem(demo.circleView);
  const freeTriangle=!task&&demo.mode==='polygon'&&demo.shapeView==='free-triangle',freeQuad=!task&&demo.mode==='polygon'&&demo.shapeView==='free-quadrilateral',freePoly=!task&&demo.mode==='polygon'&&demo.shapeView==='free-polygon',freeShape=freeTriangle||freeQuad||freePoly,shapePoints=freePoly?freePolygonPoints:freeQuad?freeQuadrilateralPoints:freeTrianglePoints,shapeKey=freePoly?'polygonPoints':freeQuad?'quadrilateralPoints':'trianglePoints';
  function drawSvg(){
    const interactive=freeShape||freeCircle||(!task&&demo.mode==='angle')||(draw&&!task.revealed);
    box.style.touchAction=interactive?'none':'auto';
    const measuring=!!task&&['measure','reflex'].includes(task.type)&&!task.revealed;
    const svg=diagram(d,teacher,{attempt,length:attemptLength,scale:task?(task.revealed&&['measure','reflex'].includes(task.type)||['draw','draw-reflex'].includes(task.type)):demo.scale,measureWorkspace:measuring,interactive,...(drag?{full:drag.max===360}:{})});
    svg.style.cssText='width:100%;height:auto;max-height:560px;display:block;margin:auto';
    box.replaceChildren(svg);updateReference();if(measuring)mountAngleMeasurement(box,svg,d);else if(task&&!task.revealed&&inspectTypes.includes(task.type))mountInvestigation(box,svg);else if(!task&&demo.mode==='polygon'&&!['triangle-comparison','triangle-criterion','triangle-inequality'].includes(demo.shapeView))mountPolygonRegions(box,svg,d,v=>demo.regionsByShape=v);
  }
  if(freeCircle){
    const moveCircle=e=>{if(circleDrag?.id!==e.pointerId)return;const q=new DOMPoint(e.clientX,e.clientY).matrixTransform(circleDrag.inverse),values=(theoremCircle?circleTheoremMove:circleInvestigationMove)(d,circleDrag.which,[q.x+circleDrag.offset[0],q.y+circleDrag.offset[1]]);Object.assign(demo,values);Object.assign(d,values);drawSvg()};
    box.addEventListener('pointerdown',e=>{if(circleDrag||e.button!==0)return;const node=e.target.closest('[data-ag-circle-handle]'),matrix=q('svg',box)?.getScreenCTM();if(!node||!matrix)return;const inverse=matrix.inverse(),p=new DOMPoint(e.clientX,e.clientY).matrixTransform(inverse),m=(theoremCircle?circleTheoremModel:circleInvestigation)(d),which=node.dataset.agCircleHandle;circleDrag={id:e.pointerId,which,inverse,prior:theoremCircle?(m.view==='equal-tangents'?{tangentRatio:m.ratio,tangentDirection:m.direction}:{theoremC:m.c,theoremD:m.f}):{circleStart:m.start,circleSpan:m.span},offset:[m[which][0]-p.x,m[which][1]-p.y]};e.preventDefault();try{box.setPointerCapture(e.pointerId)}catch(_){}});
    box.addEventListener('pointermove',e=>{if(circleDrag?.id===e.pointerId){e.preventDefault();moveCircle(e)}});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])box.addEventListener(type,e=>{if(circleDrag?.id!==e.pointerId)return;const g=circleDrag;if(type==='pointerup')moveCircle(e);else{Object.assign(demo,g.prior);Object.assign(d,g.prior)}circleDrag=null;drawSvg()});
  }
  if(freeShape){
    const vertexMove=e=>{if(!triangleDrag||triangleDrag.id!==e.pointerId)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(triangleDrag.inverse),pts=shapePoints(d);pts[triangleDrag.index]=[Math.max(65,Math.min(735,p.x+triangleDrag.offset[0])),Math.max(45,Math.min(345,p.y+triangleDrag.offset[1]))];d[shapeKey]=demo[shapeKey]=pts;drawSvg()};
    box.addEventListener('pointerdown',e=>{if(triangleDrag||e.button!==0||q('[data-ag-polygon-shade][aria-pressed="true"]',box))return;const node=e.target.closest(freePoly?'[data-ag-poly-vertex]':freeQuad?'[data-ag-quad-vertex]':'[data-ag-triangle-vertex]'),m=q('svg',box)?.getScreenCTM();if(!node||!m)return;const index=Number(freePoly?node.dataset.agPolyVertex:freeQuad?node.dataset.agQuadVertex:node.dataset.agTriangleVertex),inverse=m.inverse(),p=new DOMPoint(e.clientX,e.clientY).matrixTransform(inverse),prior=shapePoints(d);triangleDrag={id:e.pointerId,index,inverse,prior,offset:[prior[index][0]-p.x,prior[index][1]-p.y]};e.preventDefault();try{box.setPointerCapture(e.pointerId)}catch(_){}});
    box.addEventListener('pointermove',e=>{if(triangleDrag?.id===e.pointerId){e.preventDefault();vertexMove(e)}});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])box.addEventListener(type,e=>{if(triangleDrag?.id!==e.pointerId)return;const gesture=triangleDrag;if(type==='pointerup')vertexMove(e);else d[shapeKey]=demo[shapeKey]=gesture.prior;triangleDrag=null;drawSvg()});
  }
  function updateDemo(v){
    demo.angle=v;d.angle=v;const label=q('#ag-value');
    if(label)label.value=String(v);
    const readout=q('[data-ag-demo-value]',host);if(readout)readout.textContent=v+'° · '+classify(v);
    drawSvg();
  }
  function movePointer(e){
    if(!drag||e.pointerId!==drag.id)return;
    const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(drag.inverse);
    if(Math.hypot(p.x-400,p.y-220)<16)return;
    const raw=Math.atan2(220-p.y,p.x-400)/D-(d.rotation||0),previous=draw?(attempt??0):demo.angle;
    const v=snapAngle(raw,drag.max,previous);
    if(draw){if(attempt!==v)setAngle(v)}else if(demo.angle!==v)updateDemo(v);
  }
  box.addEventListener('pointerdown',e=>{
    if(e.button!==0||!e.target.closest('[data-ag-angle-target]'))return;
    const svg=q('svg',box),matrix=svg?.getScreenCTM();if(!matrix)return;
    const max=draw?(task.type==='draw-reflex'?360:180):(demo.angle>180?360:180);
    drag={id:e.pointerId,inverse:matrix.inverse(),max};
    e.preventDefault();try{box.setPointerCapture(e.pointerId)}catch(_){}
    movePointer(e);
  });
  box.addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.id){e.preventDefault();movePointer(e)}});
  function endDrag(e){if(!drag||e.pointerId!==drag.id)return;drag=null;try{if(box.hasPointerCapture(e.pointerId))box.releasePointerCapture(e.pointerId)}catch(_){}}
  box.addEventListener('pointerup',endDrag);box.addEventListener('pointercancel',endDrag);box.addEventListener('lostpointercapture',endDrag);
  function setAngle(v){attempt=Math.max(0,Math.min(task?.type==='draw-reflex'?360:180,Math.round(v)));drawSvg();const el=q('#ag-attempt',host);if(el)el.textContent=draw?'Arm positioned':attempt+'°';CK.refreshModelPupil(task)}
  if(build&&!task.revealed){box.style.maxWidth='1200px';mountLab(box,lab,v=>{lab=v;CK.refreshModelPupil(task)},{task,publishMethod})}else if(!task&&demo.mode==='loci'){box.style.maxWidth='none';mountLoci(box,locusState,v=>{locusState=v})}else if(!task&&demo.mode==='free-explore'){box.style.maxWidth='none';mountLab(box,motionLab,v=>{motionLab=v},{free:true,motion:true,publishMethod})}else if(!task&&demo.mode==='construct'){box.style.maxWidth='none';mountLab(box,freeLab,v=>{freeLab=v},{free:true,publishMethod})}else drawSvg();
  if(draw&&!task.revealed){const row=document.createElement('div');row.className='gd-row';row.style.cssText='justify-content:center;flex-wrap:wrap;padding:8px;gap:8px';row.innerHTML='<span>Angle</span><button class="gd-btn" data-ag-adjust="-10">−10°</button><button class="gd-btn" data-ag-adjust="-1">−1°</button><strong id="ag-attempt">'+(draw?(attempt===null?'Move the arm':'Arm positioned'):(attempt===null?'—':attempt+'°'))+'</strong><button class="gd-btn" data-ag-adjust="1">+1°</button><button class="gd-btn" data-ag-adjust="10">+10°</button>'+(build?'<label>AC (cm) '+select('ag-attempt-length',[['','Choose'],...Array.from({length:7},(_,i)=>[i+1,i+1])],attemptLength??'')+'</label>':'');host.appendChild(row);qa('[data-ag-adjust]',row).forEach(b=>b.onclick=()=>setAngle((attempt??0)+Number(b.dataset.agAdjust)));const l=q('#ag-attempt-length',row);if(l)l.onchange=()=>{attemptLength=l.value===''?null:+l.value;drawSvg();CK.refreshModelPupil(task)}}
  if(task){q('[data-challenge-action="another"]',host).onclick=()=>{const current=task.type;if(scope==='all')launch('all');else if(scope.startsWith('category:')){const group=scope.slice(9),ids=challengeGroups(cfg).find(g=>g.id===group)?.ids||[];launch(ids.length?pick(Math.random,ids):current)}else launch(current)};q('[data-challenge-action="end"]',host).onclick=()=>{task=null;attempt=null;scope='';workflow='build';render()};const reveal=q('[data-board-action="reveal"]',host);if(reveal)reveal.onclick=()=>{task.revealed=!task.revealed;stage()}}
  else {
    const row=document.createElement('div');row.className='gd-row';row.style.cssText='justify-content:center;flex-wrap:wrap;gap:8px';
    const action=(id,label)=>'<button type="button" class="gd-btn" data-ag-action="'+id+'">'+label+'</button>';
    const angleButtons=(label)=>'<button type="button" class="gd-btn" data-ag-action="minus" data-ag-demo="-5">−5°</button>'+'<strong data-ag-demo-value>'+esc(label)+'</strong>'+'<button type="button" class="gd-btn" data-ag-action="plus" data-ag-demo="5">+5°</button>';
    const m=demo.mode;
    if(m==='angle')row.innerHTML=angleButtons(demo.angle+'° · '+classify(demo.angle));
    else if(m==='turn')row.innerHTML=action('minus-turn','−¼ turn')+'<strong>'+demo.angle+'° · '+(demo.clockwise?'Clockwise':'Anticlockwise')+'</strong>'+action('plus-turn','+¼ turn')+action('direction','Reverse direction')+action('reset-turn','Reset');
    else if(m==='polygon'&&demo.shapeView==='triangle-inequality')row.innerHTML=action('inequality-reveal',demo.inequalityReveal?'Hide explanation':'Reveal result')+action('inequality-reset','Reset sides');
    else if(m==='polygon'&&demo.shapeView==='triangle-criterion')row.innerHTML=action('criterion-reveal',demo.criterionReveal?'Hide explanation':'Reveal possible triangles');
    else if(m==='polygon'&&demo.shapeView==='triangle-comparison')row.innerHTML=action('comparison-reset','Reset comparison')+action('comparison-reveal',demo.comparisonReveal===false?'Reveal relationship':'Hide relationship');
    else if(m==='polygon'&&demo.shapeView==='free-polygon')row.innerHTML=action('reset-polygon','Reset polygon')+action('triangulate',demo.triangulate===false?'Show triangles':'Hide triangles')+action('polygon-turns',demo.showTurns?'Hide exterior turn':'Show exterior turn')+action('toggle-corners',demo.showCorners===false?'Show angle':'Hide angle');
    else if(m==='polygon'&&demo.shapeView==='free-quadrilateral')row.innerHTML=action('reset-quad','Reset quadrilateral')+action('toggle-side-marks',demo.showSides===false?'Show equal sides':'Hide equal sides')+action('toggle-corners',demo.showCorners===false?'Show angles':'Hide angles')+action('diagonal',demo.showDiagonals?'Hide diagonals':'Show diagonals')+action('parallel-marks',demo.showParallel?'Hide parallel marks':'Show parallel marks');
    else if(m==='polygon'&&demo.shapeView==='free-triangle')row.innerHTML=action('reset-triangle','Reset triangle')+action('toggle-side-marks',demo.showSides===false?'Show equal sides':'Hide equal sides')+action('toggle-corners',demo.showCorners===false?'Show angles':'Hide angles');
    else if(m==='polygon'&&demo.shapeView&&demo.shapeView!=='regular')row.innerHTML=action('next-shape','Next shape')+action('toggle-side-marks',demo.showSides===false?'Show equal sides':'Hide equal sides')+action('toggle-corners',demo.showCorners===false?'Show angles':'Hide angles')+(['square','rectangle','rhombus','parallelogram','trapezium','kite'].includes(demo.shapeView)?action('diagonal',demo.showDiagonals?'Hide diagonals':'Show diagonals')+action('parallel-marks',demo.showParallel?'Hide parallel marks':'Show parallel marks'):'')+(['rectangle','parallelogram','trapezium','right-triangle','kite'].includes(demo.shapeView)?action('shape-shorter','− height')+action('shape-taller','+ height'):'')+(['rhombus','parallelogram','isosceles','scalene'].includes(demo.shapeView)?action('shape-angle-down','− opening')+action('shape-angle-up','+ opening'):'')+(['free-triangle','equilateral','isosceles','scalene','right-triangle'].includes(demo.shapeView)?action('shape-height',demo.showHeight?'Hide height':'Show height'):'');
    else if(m==='circle'&&theoremCircle)row.innerHTML=action('circle-reset','Reset points')+(demo.circleView==='equal-tangents'?'<strong>Move external point P</strong>':demo.circleView==='semicircle'?'<strong>Diameter AB</strong>':action('theorem-span-down','−15° arc')+'<strong>Arc: '+circleTheoremModel(d).span+'°</strong>'+action('theorem-span-up','+15° arc'))+action('radius-down','−1 cm')+'<strong>Radius: '+(demo.radius||5)+' cm</strong>'+action('radius-up','+1 cm');
    else if(m==='circle'&&freeCircle)row.innerHTML=action('circle-reset','Reset points')+action('radius-down','−1 cm')+'<strong>Radius: '+(demo.radius||5)+' cm</strong>'+action('radius-up','+1 cm')+action('circle-extension',demo.circleEnrichment?'Hide KS3 working':'Show KS3 working');
    else if(m==='circle')row.innerHTML=action('radius-down','−1 cm')+'<strong>Radius: '+(demo.radius||5)+' cm</strong>'+action('radius-up','+1 cm')+action('circle-extension',demo.circleEnrichment?'Hide KS3 working':'Show KS3 working');
    else if(m==='polygon')row.innerHTML=action('minus-side','− side')+'<strong>'+demo.n+' sides · '+(demo.regular?'Regular':'Irregular')+'</strong>'+action('plus-side','+ side')+action('regular',demo.regular?'Make irregular':'Make regular')+action('triangulate',demo.triangulate===false?'Show triangles':'Hide triangles');
    else if(m==='facts')row.innerHTML=angleButtons(d.angle+'°')+action('fact','Change relationship')+(TRANSVERSAL_VIEWS.includes(demo.fact)?action('transversal-parallel',demo.transversalParallel===false?'Make parallel':'Make non-parallel'):'');
    else if(m==='lines')row.innerHTML=action('relation','Change relationship')+'<strong>'+esc(d.relation)+'</strong>'+(d.relation==='Neither'?angleButtons(d.angle+'°'):'')+action('rotate','Rotate 15°');
    
    host.appendChild(row);
    if(m==='polygon'&&shapeTeachingReference(d)){
      reference=document.createElement('details');reference.className='gd-ag-shape-reference';reference.dataset.agShapeReference='1';reference.open=demo.showReference!==false;reference.innerHTML='<summary>Shape teaching &amp; investigations</summary><nav data-ag-teaching-tabs aria-label="Shape teaching sections"></nav><div data-ag-shape-reference-body></div>';reference.ontoggle=()=>{demo.showReference=reference.open};host.appendChild(reference);updateReference();
    }
    const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
    const cycle=(v,arr)=>arr[(arr.indexOf(v)+1)%arr.length];
    qa('[data-ag-action]',row).forEach(b=>b.onclick=()=>{const id=b.dataset.agAction;
      if(id==='minus'||id==='plus'){const trans=m==='facts'&&TRANSVERSAL_VIEWS.includes(demo.fact),min=m==='angle'?0:trans?35:10,max=m==='angle'?360:m==='lines'?80:trans?145:170;demo.angle=clamp(d.angle+(id==='plus'?5:-5),min,max)}
      else if(id==='minus-turn'||id==='plus-turn')demo.angle=clamp(demo.angle+(id==='plus-turn'?90:-90),0,360);
      else if(id==='direction')demo.clockwise=!demo.clockwise;
      else if(id==='reset-turn')demo.angle=0;
      else if(id==='minus-side'||id==='plus-side')demo.n=clamp(demo.n+(id==='plus-side'?1:-1),3,12);
      else if(id==='regular')demo.regular=!demo.regular;
      else if(id==='triangulate')demo.triangulate=demo.triangulate===false;
      else if(id==='fact')demo.fact=cycle(demo.fact||'straight',FACT_VIEWS.map(([k])=>k));
      else if(id==='transversal-parallel')demo.transversalParallel=demo.transversalParallel===false;
      else if(id==='relation')demo.relation=cycle(d.relation,['Parallel','Perpendicular','Neither']);
      else if(id==='rotate')demo.rotation=mod(demo.rotation+15);
      else if(id==='shape-shorter'||id==='shape-taller')demo.shapeHeight=clamp((demo.shapeHeight||180)+(id==='shape-taller'?15:-15),90,280);
      else if(id==='shape-angle-down'||id==='shape-angle-up'){const k=id==='shape-angle-up'?5:-5;if(['isosceles','scalene'].includes(demo.shapeView))demo.shapeBaseAngle=clamp((demo.shapeBaseAngle||(demo.shapeView==='scalene'?40:50))+k,20,demo.shapeView==='scalene'?48:75);else demo.shapeAngle=clamp((demo.shapeAngle||65)+k,25,85)}
      else if(id==='inequality-reveal')demo.inequalityReveal=!demo.inequalityReveal;
      else if(id==='inequality-reset'){demo.inequalityLengths=[3,4,5];demo.inequalityReveal=false}
      else if(id==='criterion-reveal')demo.criterionReveal=!demo.criterionReveal;
      else if(id==='comparison-reset'){demo.comparison={};demo.comparisonMeasures=true;demo.comparisonReveal=true}
      else if(id==='comparison-reveal')demo.comparisonReveal=demo.comparisonReveal===false;
      else if(id==='reset-polygon'){delete demo.polygonPoints;demo.polygonVertex=0}
      else if(id==='polygon-turns')demo.showTurns=!demo.showTurns;
      else if(id==='reset-quad')delete demo.quadrilateralPoints;
      else if(id==='reset-triangle')delete demo.trianglePoints;
      else if(id==='shape-height')demo.showHeight=!demo.showHeight;
      else if(id==='next-shape')demo.shapeView=cycle(demo.shapeView,['equilateral','isosceles','scalene','right-triangle','square','rectangle','rhombus','parallelogram','trapezium','kite']);
      else if(id==='toggle-side-marks')demo.showSides=demo.showSides===false;
      else if(id==='toggle-corners')demo.showCorners=demo.showCorners===false;
      else if(id==='diagonal')demo.showDiagonals=!demo.showDiagonals;
      else if(id==='parallel-marks')demo.showParallel=!demo.showParallel;
      else if(id==='radius-down'||id==='radius-up')demo.radius=clamp((demo.radius||5)+(id==='radius-up'?1:-1),1,15);
      else if(id==='circle-reset'){delete demo.circleStart;delete demo.circleSpan;delete demo.theoremSpan;delete demo.theoremC;delete demo.theoremD;delete demo.tangentRatio;delete demo.tangentDirection}
      else if(id==='theorem-span-down'||id==='theorem-span-up')demo.theoremSpan=clamp(circleTheoremModel(d).span+(id==='theorem-span-up'?15:-15),45,285);
      else if(id==='circle-extension')demo.circleEnrichment=!demo.circleEnrichment;
      else if(id==='minus-length'||id==='plus-length')demo.length=clamp(demo.length+(id==='plus-length'?1:-1),1,7);
      render();
    });
  }
 }
 function render(){controls();stage()}
 setPanels('','');render();G.lessonState.register(ID,()=>({...snapshot(),demo:demoData()}),s=>{cfg=settings(s);demo={...demo,...s.demo,type:'diagram'};workflow=['build','challenge','export'].includes(s.workflow)?s.workflow:'build';task=s.task?CK.normalise(s.task):null;attempt=Number.isFinite(s.attempt)?s.attempt:null;attemptLength=Number.isFinite(s.attemptLength)?s.attemptLength:null;scope=String(s.scope||'');lab=s.lab||null;freeLab=s.freeLab||null;motionLab=s.motionLab||null;if(demo.mode==='free-explore'){demo.mode='construct';freeLab=motionLab||s.demo?.labDrawing||freeLab||labEmpty(true);freeLab.allowMovement=true}else if(!freeLab&&demo.mode==='construct')freeLab=s.demo?.labDrawing||null;demo.freeLab=true;locusState=s.locusState||s.demo?.locusState||null;CK.restorePupil(task,s.pupil);render()});
};
})(typeof globalThis!=='undefined'?globalThis:this);
