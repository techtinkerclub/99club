(function(global){
'use strict';
const G=global.TT99Generator;if(!G)return;
const VERSION='0.1.0';
const FAMILIES={
temperature_visuals:{label:'thermometers & temperature scales',strand:'Measurement',years:[2,3,4,5,6]},
symmetry_visuals:{label:'line symmetry on grids',strand:'Geometry',years:[2,3,4,5,6]},
tally_charts:{label:'tally charts',strand:'Statistics',years:[2,3,4,5]},
tile_area_perimeter_visual:{label:'tile area & perimeter',strand:'Measurement',years:[4,5,6]}
};
const IDS=Object.keys(FAMILIES),isKind=k=>IDS.includes(String(k||'')),hasKind=r=>Array.isArray(r?.families)&&r.families.some(isKind),clone=o=>JSON.parse(JSON.stringify(o));
for(const [id,m] of Object.entries(FAMILIES)){
if(!G.FAMILY_META[id])G.FAMILY_META[id]={label:m.label,strand:m.strand,years:m.years.slice(),visual:true};
G.FAMILY_LABELS[id]=m.label;
if(Array.isArray(G.FAMILY_ORDER)&&!G.FAMILY_ORDER.includes(id))G.FAMILY_ORDER.push(id);
if(Array.isArray(G.FAMILY_COMPACT_ORDER)&&!G.FAMILY_COMPACT_ORDER.includes(id))G.FAMILY_COMPACT_ORDER.push(id);
}
const q=(kind,subtype,i,prompt,answer,extra={})=>{const {key:keyExtra='',...rest}=extra;return {kind,prompt,answer:String(answer),key:`${kind}:${subtype}:${i}:${keyExtra}`,group:subtype,footprint:rest.footprint||(rest.visual?'L':'M'),marking:rest.marking||{mode:'exact',answer:String(answer)},...rest};};

function temperaturePool(){
const out=[];let i=0;
for(const [min,max,step] of [[-12,12,2],[-20,20,5],[-10,30,5]])for(let t=min+step;t<max;t+=step){
out.push(q('temperature_visuals','read_temperature',i++,`What temperature is shown on the thermometer?`,`${t}°C`,{key:`read:${min}:${max}:${step}:${t}`,visual:{type:'extra_visual',subtype:'thermometer',min,max,step,value:t,mode:'read'}}));
}
for(const t of [-11,-9,-7,-5,-3,-1,1,3,5,7,9,11,14,18,22,26]){
const min=t<0?-12:-5,max=t>12?30:12,step=t>12?5:2;
out.push(q('temperature_visuals','mark_temperature',i++,`Show ${t}°C on the thermometer with an arrow.`,`${t}°C marked`,{key:`mark:${min}:${max}:${step}:${t}`,visual:{type:'extra_visual',subtype:'thermometer',min,max,step,value:t,mode:'mark'},marking:{mode:'rubric',answer:`Arrow at ${t}°C`,rule:`Arrow points to ${t}°C on the scale.`}}));
}
for(let j=0;j<30;j++){const start=-10+(j%16),delta=[-7,-5,-3,3,5,7][j%6],final=start+delta;if(final<-15||final>20)continue;
out.push(q('temperature_visuals','temperature_change',i++,`The thermometer starts at ${start}°C. The temperature ${delta>0?'rises':'falls'} by ${Math.abs(delta)}°C. What is the new temperature?`,`${final}°C`,{key:`change:${start}:${delta}`,visual:{type:'extra_visual',subtype:'thermometer',min:-15,max:20,step:5,value:start,delta,final,mode:'change'}}));}
return out;
}

function symmetryRows(seed){
const rows=[];for(let r=0;r<7;r++)rows.push(r===0||r===6?0:1+((seed*3+r*5+r*r)%3));
if(rows.join(',')===rows.slice().reverse().join(','))rows[1]=rows[1]===3?2:3;
return rows;
}
function symmetryPool(){
const out=[];let i=0;
for(let seed=1;seed<=36;seed++){const rows=symmetryRows(seed);
out.push(q('symmetry_visuals','complete_shape',i++,'Part of a shape is shown. Complete the shape so the dashed line is a line of symmetry.','mirror image completed',{key:`complete:${rows.join('-')}`,visual:{type:'extra_visual',subtype:'symmetry_grid',rows,mode:'complete'},marking:{mode:'rubric',answer:'Mirror image completed',rule:'Every shaded square is reflected the same distance across the dashed vertical line.'}}));
out.push(q('symmetry_visuals','draw_symmetry_line',i++,'Draw the line of symmetry on the completed pattern.','vertical line through the centre',{key:`line:${rows.join('-')}`,visual:{type:'extra_visual',subtype:'symmetry_grid',rows,mode:'find_line'},marking:{mode:'rubric',answer:'Vertical centre line',rule:'A vertical line through the centre divides the pattern into mirror images.'}}));
}
return out;
}

const TALLY_LABELS=[['Apples','Pears','Oranges','Grapes'],['Red','Blue','Green','Yellow'],['Cats','Dogs','Fish','Birds'],['Walk','Bus','Car','Bike']];
function tallyPool(){
const out=[];let i=0;
for(let j=0;j<36;j++){const labels=TALLY_LABELS[j%TALLY_LABELS.length],counts=[3+(j%13),5+((j*3)%12),2+((j*5)%14),4+((j*7)%11)],ask=j%4;
out.push(q('tally_charts','read_tally',i++,`Use the tally chart. How many are recorded for ${labels[ask]}?`,counts[ask],{key:`read:${labels.join('-')}:${counts.join('-')}:${ask}`,visual:{type:'extra_visual',subtype:'tally',labels,counts,ask,mode:'read'}}));
const a=j%4,b=(j+2)%4,diff=Math.abs(counts[a]-counts[b]);
out.push(q('tally_charts','tally_difference',i++,`Use the tally chart. What is the difference between ${labels[a]} and ${labels[b]}?`,diff,{key:`diff:${labels.join('-')}:${counts.join('-')}:${a}:${b}`,visual:{type:'extra_visual',subtype:'tally',labels,counts,highlight:[a,b],mode:'read'}}));
out.push(q('tally_charts','complete_tally',i++,`The frequency for ${labels[ask]} is ${counts[ask]}. Complete its missing tally.`,`${counts[ask]} tally marks`,{key:`complete:${labels.join('-')}:${counts.join('-')}:${ask}`,visual:{type:'extra_visual',subtype:'tally',labels,counts,ask,mode:'complete'},marking:{mode:'rubric',answer:`Tally for ${counts[ask]}`,rule:`Correct tally representation of ${counts[ask]}, grouped in fives.`}}));
}
return out;
}

const HEX_DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
const hexKey=p=>`${p[0]},${p[1]}`;
function exposedEdges(cells){const set=new Set(cells.map(hexKey));let edges=0;for(const [q0,r0] of cells)for(const [dq,dr] of HEX_DIRS)if(!set.has(`${q0+dq},${r0+dr}`))edges++;return edges;}
function normalizeCells(cells){const minQ=Math.min(...cells.map(p=>p[0])),minR=Math.min(...cells.map(p=>p[1]));return cells.map(([q0,r0])=>[q0-minQ,r0-minR]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);}
function growHex(size,variant){
const cells=[[0,0]],set=new Set(['0,0']);
while(cells.length<size){
const candidates=[];for(const [q0,r0] of cells)for(const [dq,dr] of HEX_DIRS){const p=[q0+dq,r0+dr],k=hexKey(p);if(!set.has(k)&&!candidates.some(c=>hexKey(c)===k))candidates.push(p);}
candidates.sort((a,b)=>a[1]-b[1]||a[0]-b[0]);const pick=candidates[(variant*3+cells.length*5)%candidates.length];cells.push(pick);set.add(hexKey(pick));
}
return normalizeCells(cells);
}
function tilePool(){
const out=[],seen=new Set();let i=0;
for(let size=3;size<=8;size++)for(let variant=0;variant<18;variant++){const cells=growHex(size,variant),sig=cells.map(hexKey).join(';');if(seen.has(sig))continue;seen.add(sig);const perimeter=exposedEdges(cells),edge=[1,2,3][variant%3];
out.push(q('tile_area_perimeter_visual','hex_perimeter',i++,`Each side of a regular hexagon is ${edge} cm. Find the perimeter of the shaded shape.`,`${perimeter*edge} cm`,{key:`perim:${sig}:${edge}`,visual:{type:'extra_visual',subtype:'hex_tiles',cells,edge,perimeter,mode:'perimeter'}}));
out.push(q('tile_area_perimeter_visual','hex_area_tiles',i++,`Each regular hexagon has an area of 1 square unit. What is the area of the shaded shape?`,`${size} square units`,{key:`area:${sig}`,visual:{type:'extra_visual',subtype:'hex_tiles',cells,edge:1,perimeter,mode:'area'}}));
}
return out;
}
const POOLS={temperature_visuals:temperaturePool(),symmetry_visuals:symmetryPool(),tally_charts:tallyPool(),tile_area_perimeter_visual:tilePool()};

function drawTally(C,x,y,count,color){
const gap=4,groupGap=5,h=13;let xx=x;
for(let n=0;n<count;){const group=Math.min(5,count-n);for(let k=0;k<Math.min(4,group);k++){C.line(xx+k*gap,y,xx+k*gap,y+h,{color,width:.8});}
if(group===5)C.line(xx-1,y+h-1,xx+3*gap+1,y+1,{color,width:.9});
xx+=4*gap+groupGap;n+=group;
}
}
function hexPoints(cx,cy,s){const pts=[];for(let k=0;k<6;k++){const a=Math.PI/3*k;pts.push({x:cx+s*Math.cos(a),y:cy+s*Math.sin(a)});}return pts;}
function renderExtra(C,x,y,w,h,v,answers){
const ink=[31,41,55],muted=[95,105,120],teal=[15,118,110],line=[190,202,207],pale=[244,249,248],fill=[224,242,239];
if(v.subtype==='thermometer'){
const top=y+h*.10,bottom=y+h*.83,cx=x+w*.52,min=Number(v.min),max=Number(v.max),step=Number(v.step),map=val=>bottom-(bottom-top)*(val-min)/(max-min);
C.line(cx,top,cx,bottom,{color:ink,width:1.3});for(let val=min;val<=max;val+=step){const yy=map(val);C.line(cx-7,yy,cx+7,yy,{color:ink,width:.55});C.text(cx+13,yy+2,`${val}`,5.9,{color:muted});}
C.text(cx+28,top+4,'°C',6.5,{bold:true,color:teal});const show=v.mode==='read'||v.mode==='change'||answers;if(show){const yy=map(Number(v.value));C.line(cx-45,yy,cx-10,yy,{color:teal,width:1.1});C.polygon([{x:cx-10,y:yy},{x:cx-18,y:yy-4},{x:cx-18,y:yy+4}],{fill:teal,stroke:teal,width:.2});}
if(v.mode==='change')C.text(x+w*.25,bottom+17,`${v.delta>0?'+':''}${v.delta}°C`,7,{bold:true,align:'center',color:teal});
}
else if(v.subtype==='symmetry_grid'){
const rows=v.rows||[],cols=8,nRows=rows.length,gap=0,cell=Math.min(24,w*.66/cols,h*.76/nRows),left=x+(w-cols*cell)/2,top=y+(h-nRows*cell)/2,axisX=left+4*cell,full=v.mode==='find_line'||answers;
for(let r=0;r<nRows;r++)for(let c=0;c<cols;c++){C.rect(left+c*cell,top+r*cell,cell,cell,{stroke:[220,226,229],width:.32});}
for(let r=0;r<nRows;r++){const width=Number(rows[r]||0);for(let c=4-width;c<4;c++){if(c<0)continue;C.rect(left+c*cell,top+r*cell,cell,cell,{fill,stroke:line,width:.45});if(full){const mc=7-c;C.rect(left+mc*cell,top+r*cell,cell,cell,{fill:answers&&v.mode==='complete'?[210,238,233]:fill,stroke:line,width:.45});}}}
if(v.mode==='complete'||answers){for(let yy=top;yy<top+nRows*cell;yy+=8)C.line(axisX,yy,axisX,Math.min(yy+4,top+nRows*cell),{color:teal,width:.8});}
}
else if(v.subtype==='tally'){
const labels=v.labels||[],counts=v.counts||[],left=x+w*.08,top=y+8,rowH=Math.min(25,h/(labels.length+1)),labelW=w*.24,tallyW=w*.48,freqW=w*.15;
labels.forEach((lab,j)=>{const yy=top+j*rowH,missing=v.mode==='complete'&&j===v.ask&&!answers;C.rect(left,yy,labelW,rowH,{fill:j%2?pale:null,stroke:line,width:.4});C.rect(left+labelW,yy,tallyW,rowH,{fill:j%2?pale:null,stroke:line,width:.4});C.rect(left+labelW+tallyW,yy,freqW,rowH,{fill:j%2?pale:null,stroke:line,width:.4});C.text(left+5,yy+rowH*.66,lab,6,{color:ink});if(!missing)drawTally(C,left+labelW+8,yy+5,counts[j],j===v.ask?teal:ink);C.text(left+labelW+tallyW+freqW/2,yy+rowH*.66,String(counts[j]),6.3,{bold:true,align:'center',color:ink});});
}
else if(v.subtype==='hex_tiles'){
const cells=v.cells||[],s=Math.min(24,w*.58/(Math.max(...cells.map(p=>p[0]))-Math.min(...cells.map(p=>p[0]))+2),h*.58/(Math.max(...cells.map(p=>p[1]))-Math.min(...cells.map(p=>p[1]))+2)),centers=cells.map(([q0,r0])=>({cx:1.5*s*q0,cy:Math.sqrt(3)*s*(r0+q0/2)})),minX=Math.min(...centers.map(p=>p.cx)),maxX=Math.max(...centers.map(p=>p.cx)),minY=Math.min(...centers.map(p=>p.cy)),maxY=Math.max(...centers.map(p=>p.cy)),ox=x+w/2-(minX+maxX)/2,oy=y+h*.48-(minY+maxY)/2;
centers.forEach(p=>C.polygon(hexPoints(ox+p.cx,oy+p.cy,s),{fill,stroke:ink,width:.65}));C.text(x+w/2,y+h*.82,v.mode==='perimeter'?`side = ${v.edge} cm`:'each hexagon = 1 square unit',6.5,{bold:true,align:'center',color:muted});
if(answers)C.text(x+w/2,y+h*.92,v.mode==='perimeter'?`perimeter = ${v.perimeter*v.edge} cm`:`area = ${cells.length} square units`,6.7,{bold:true,align:'center',color:teal});
}
}
global.TT99VisualRenderers=global.TT99VisualRenderers||{};global.TT99VisualRenderers.extra_visual=renderExtra;

const previous={generateQuestions:G.generateQuestions.bind(G),questionPool:G.questionPool.bind(G),questionByKey:G.questionByKey.bind(G),questionPoolIndex:G.questionPoolIndex.bind(G),questionByPoolIndex:G.questionByPoolIndex.bind(G),replaceQuestion:G.replaceQuestion.bind(G)};
function hashString(str){let h=2166136261>>>0;for(let i=0;i<String(str).length;i++){h^=String(str).charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function rngFor(seed){if(typeof G.rngFromSeed==='function')return G.rngFromSeed(seed);let a=hashString(seed)||1234567;return()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296;};}
function shuffle(a,r){const o=a.slice();for(let i=o.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[o[i],o[j]]=[o[j],o[i]];}return o;}
function weightedCounts(rules,rng){const bag=[];for(const f of rules.families){for(let i=0;i<Math.max(1,Number(rules.familyWeights?.[f])||1);i++)bag.push(f);}const cycle=shuffle(bag,rng),counts=Object.fromEntries(rules.families.map(f=>[f,0]));for(let i=0;i<rules.questionCount;i++)counts[cycle[i%cycle.length]]++;return counts;}
function pick(p,n,r){if(!p.length)return[];const s=shuffle(p,r),out=[];for(let i=0;i<n;i++)out.push(clone(s[i%s.length]));return out;}
G.questionPool=function(kind,rules){if(isKind(kind))return clone(POOLS[kind]||[]);return previous.questionPool(kind,rules);};
G.questionByKey=function(kind,rules,key){if(!isKind(kind))return previous.questionByKey(kind,rules,key);const x=(POOLS[kind]||[]).find(q=>q.key===key);return x?clone(x):null;};
G.questionPoolIndex=function(kind,rules,key){if(!isKind(kind))return previous.questionPoolIndex(kind,rules,key);return (POOLS[kind]||[]).findIndex(q=>q.key===key);};
G.questionByPoolIndex=function(kind,rules,index){if(!isKind(kind))return previous.questionByPoolIndex(kind,rules,index);const p=POOLS[kind]||[],n=Number(index);return Number.isInteger(n)&&n>=0&&n<p.length?clone(p[n]):null;};
G.generateQuestions=function(inputRules,seed){const rules=G.normalizeRules(inputRules);if(rules.mode!=='family_mix'||!hasKind(rules))return previous.generateQuestions(inputRules,seed);const rng=rngFor(seed||'CUSTOM'),counts=weightedCounts(rules,rng);let out=[];for(const f of rules.families){const n=counts[f]||0;if(n)out=out.concat(pick(G.questionPool(f,rules),n,rng));}return shuffle(out,rng).map((it,i)=>({...it,number:i+1}));};
G.replaceQuestion=function(questions,index,inputRules,seed){const cur=questions?.[index];if(!cur||!isKind(cur.kind))return previous.replaceQuestion(questions,index,inputRules,seed);let p=(POOLS[cur.kind]||[]).filter(q=>q.key!==cur.key&&q.group===cur.group),used=new Set(questions.filter((_,i)=>i!==index).map(q=>q.key)),c=p.filter(q=>!used.has(q.key));if(!c.length)c=p;const rng=rngFor(String(seed||'')+':extra-replace'),choice=shuffle(c,rng)[0];if(!choice)return questions.slice();const out=questions.slice();out[index]={...clone(choice),number:index+1};return out;};
function validate(){const errors=[];for(const [kind,p] of Object.entries(POOLS)){if(p.length<12)errors.push(`${kind}:pool-too-small:${p.length}`);const keys=new Set();for(const item of p){if(keys.has(item.key))errors.push(`${kind}:duplicate-key:${item.key}`);keys.add(item.key);if(item.answer==null||item.answer==='')errors.push(`${kind}:blank-answer`);}}for(const item of POOLS.tile_area_perimeter_visual){const v=item.visual;if(exposedEdges(v.cells)!==v.perimeter)errors.push(`tile-perimeter:${item.key}`);}return{ok:!errors.length,errors,counts:Object.fromEntries(Object.entries(POOLS).map(([k,p])=>[k,p.length]))};}
global.TT99CustomExtraVisuals={VERSION,FAMILIES,POOLS,validate,renderExtra,exposedEdges};
}(typeof window!=='undefined'?window:globalThis));
