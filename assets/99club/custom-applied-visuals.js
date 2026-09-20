(function(global){
'use strict';
const G=global.TT99Generator;if(!G)return;
const VERSION='0.1.0';
const FAMILIES={
measure_scales:{label:'read measurement scales',strand:'Measurement',years:[2,3,4,5,6]},
timetable_reasoning:{label:'timetables & schedules',strand:'Measurement',years:[3,4,5,6]},
missing_digit_calculations:{label:'missing digits in calculations',strand:'Calculation',years:[2,3,4,5,6]},
coin_reasoning:{label:'coin combinations & change',strand:'Measurement',years:[1,2,3,4]},
visual_shape_properties:{label:'visual shape properties',strand:'Geometry',years:[1,2,3,4,5,6]},
table_reasoning:{label:'read & reason from tables',strand:'Statistics',years:[2,3,4,5,6]}
};
const IDS=Object.keys(FAMILIES),isKind=k=>IDS.includes(String(k||'')),hasKind=r=>Array.isArray(r?.families)&&r.families.some(isKind),clone=o=>JSON.parse(JSON.stringify(o));
for(const [id,m] of Object.entries(FAMILIES)){
if(!G.FAMILY_META[id])G.FAMILY_META[id]={label:m.label,strand:m.strand,years:m.years.slice(),visual:true};
G.FAMILY_LABELS[id]=m.label;if(Array.isArray(G.FAMILY_ORDER)&&!G.FAMILY_ORDER.includes(id))G.FAMILY_ORDER.push(id);if(Array.isArray(G.FAMILY_COMPACT_ORDER)&&!G.FAMILY_COMPACT_ORDER.includes(id))G.FAMILY_COMPACT_ORDER.push(id);
}
const q=(kind,subtype,i,prompt,answer,extra={})=>{const {key:keyExtra='',...rest}=extra;return {kind,prompt,answer:String(answer),key:`${kind}:${subtype}:${i}:${keyExtra}`,group:subtype,footprint:rest.footprint||(rest.visual?'L':'M'),marking:rest.marking||{mode:'exact',answer:String(answer)},...rest};};
function measurePool(){
const out=[];let i=0;
for(const max of [500,1000,1500,2000])for(const step of [50,100])for(let k=1;k<Math.min(9,max/step);k++){const level=k*step;if(level>=max)continue;
out.push(q('measure_scales','jug_read',i++,`How much water is in the jug?`,`${level} ml`,{key:`jug:${max}:${step}:${level}`,visual:{type:'applied',subtype:'jug',max,step,level,mode:'read'}}));
const target=Math.min(max,level+step*(1+(k%3)));if(target>level)out.push(q('measure_scales','jug_add_to',i++,`The jug contains ${level} ml. How many more millilitres are needed to reach ${target} ml?`,`${target-level} ml`,{key:`jugadd:${max}:${step}:${level}:${target}`,visual:{type:'applied',subtype:'jug',max,step,level,target,mode:'add'}}));
}
for(let j=0;j<36;j++){const start=(j%4)*10,step=[1,2,5][j%3],ticks=11,mark=1+(j%9),value=start+mark*step;
out.push(q('measure_scales','ruler_read',i++,`What length is marked on the ruler?`,`${value} cm`,{key:`ruler:${start}:${step}:${mark}`,visual:{type:'applied',subtype:'ruler',start,step,ticks,mark,value}}));}
return out;
}
function mins(h,m){return h*60+m;}
function timeText(t){t=((t%1440)+1440)%1440;const h=Math.floor(t/60),m=t%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}
function timetablePool(){
const out=[];let i=0;
const lessonNames=['Maths','Science','English','Break','Art','PE'];
for(let j=0;j<36;j++){const start=mins(9,0)+5*(j%3),durations=[45+5*(j%4),55,50+5*((j+1)%3),15,45,60],blocks=[];let t=start;for(let b=0;b<5;b++){blocks.push({name:lessonNames[b],start:t,end:t+durations[b]});t+=durations[b];}
const ask=j%blocks.length,b=blocks[ask],duration=b.end-b.start;
out.push(q('timetable_reasoning','lesson_duration',i++,`How long does the ${b.name} session last?`,`${duration} minutes`,{key:`lesson:${j}:${ask}`,visual:{type:'applied',subtype:'timeline',blocks,ask,mode:'duration'}}));
const delta=[10,15,20,25][j%4],leave=b.end-delta;
out.push(q('timetable_reasoning','leave_early',i++,`Someone leaves ${delta} minutes before the end of ${b.name}. What time do they leave?`,timeText(leave),{key:`leave:${j}:${ask}:${delta}`,visual:{type:'applied',subtype:'timeline',blocks,ask,delta,mode:'leave'}}));
}
const stations=['Southville','Leek','Jamestown','Milton'];
for(let j=0;j<24;j++){const departures=[mins(6,30)+10*(j%4),mins(6,50)+5*(j%3),mins(7,10)+5*(j%5)],dur=[95+5*(j%4),85+5*((j+1)%4),100-5*(j%3)],rows=stations.map((s,ri)=>({station:s,times:departures.map((d,ci)=>d+Math.round(dur[ci]*ri/(stations.length-1)))})),best=dur.indexOf(Math.min(...dur));
out.push(q('timetable_reasoning','shortest_train',i++,`Which train completes the journey from ${stations[0]} to ${stations[stations.length-1]} in the shortest time?`,timeText(departures[best]),{key:`train:${j}`,visual:{type:'applied',subtype:'train_table',rows,departures,durations:dur,best}}));}
return out;
}
function missingDigitPool(){
const out=[];let i=0;
for(let j=0;j<60;j++){const a=120+((j*37)%780),b=20+((j*19)%180),sum=a+b,pos=j%String(a).length,digits=String(a).split(''),hidden=digits[pos];digits[pos]='□';
const candidates=[];for(let d=0;d<=9;d++){if(pos===0&&d===0)continue;const aa=Number(digits.map((x,k)=>k===pos?d:x).join(''));if(aa+b===sum)candidates.push(d);}
if(candidates.length!==1)continue;
out.push(q('missing_digit_calculations','addition_digit',i++,`Find the missing digit.`,hidden,{key:`add:${a}:${b}:${pos}`,visual:{type:'applied',subtype:'missing_digit',aMasked:digits.join(''),b,result:sum,op:'+',position:pos,answerDigit:hidden}}));
}
for(let j=0;j<60;j++){const b=20+((j*23)%180),result=80+((j*31)%700),a=b+result,pos=j%String(b).length,digits=String(b).split(''),hidden=digits[pos];digits[pos]='□';
const candidates=[];for(let d=0;d<=9;d++){if(pos===0&&d===0)continue;const bb=Number(digits.map((x,k)=>k===pos?d:x).join(''));if(a-bb===result)candidates.push(d);}
if(candidates.length!==1)continue;
out.push(q('missing_digit_calculations','subtraction_digit',i++,`Find the missing digit.`,hidden,{key:`sub:${a}:${b}:${pos}`,visual:{type:'applied',subtype:'missing_digit',aMasked:String(a),bMasked:digits.join(''),result,op:'−',position:pos,answerDigit:hidden}}));
}
return out;
}
const COINS=[1,2,5,10,20,50,100,200];
function coinList(vals){return vals.map(v=>v>=100?`£${v/100}`:`${v}p`).join(', ');}
function coinPool(){
const out=[];let i=0;
for(let j=0;j<40;j++){const vals=[COINS[(j+2)%COINS.length],COINS[(j+4)%COINS.length],COINS[(j+5)%COINS.length]],counts=[1+(j%3),1+((j+1)%3),1],total=vals.reduce((s,v,k)=>s+v*counts[k],0);
out.push(q('coin_reasoning','coin_total',i++,`How much money is shown?`,total>=100?`£${(total/100).toFixed(2)}`:`${total}p`,{key:`total:${vals.join('-')}:${counts.join('-')}`,visual:{type:'applied',subtype:'coins',values:vals,counts,mode:'total'}}));}
for(let j=0;j<40;j++){const price=10+5*(j%16),paid=price+[5,10,20,50][j%4],change=paid-price;
out.push(q('coin_reasoning','change',i++,`An item costs ${price}p. You pay ${paid}p. How much change should you receive?`,`${change}p`,{key:`change:${price}:${paid}`,visual:{type:'applied',subtype:'coins',values:[paid],counts:[1],price,mode:'change'}}));}
for(const target of [20,30,40,50,60,70,80,90,100,120,150]){const combos=[];for(let a=0;a<=target/50;a++)for(let b=0;b<=target/20;b++)for(let c=0;c<=target/10;c++)if(a*50+b*20+c*10===target&&a+b+c===4)combos.push([a,b,c]);if(!combos.length)continue;
out.push(q('coin_reasoning','four_coins',i++,`Choose four coins worth 10p, 20p or 50p that total ${target}p. Give one possible combination.`,coinList(combos[0].flatMap((n,k)=>Array(n).fill([50,20,10][k]))),{key:`four:${target}`,visual:{type:'applied',subtype:'coin_slots',target,allowed:[10,20,50],count:4},marking:{mode:'rubric',answer:'Any valid four-coin combination',rule:`Exactly four allowed coins totalling ${target}p.`}}));}
return out;
}
function shapePool(){
const out=[];let i=0,shapes=[
{id:'triangle',name:'triangle',sides:3,vertices:3},{id:'square',name:'square',sides:4,vertices:4},{id:'rectangle',name:'rectangle',sides:4,vertices:4},{id:'pentagon',name:'pentagon',sides:5,vertices:5},{id:'hexagon',name:'hexagon',sides:6,vertices:6},{id:'octagon',name:'octagon',sides:8,vertices:8}
];
for(let r=0;r<5;r++)for(const s of shapes){out.push(q('visual_shape_properties','name_shape',i++,`Name this shape.`,s.name,{key:`name:${s.id}:${r}`,visual:{type:'applied',subtype:'shape',shape:s.id,rotation:r*11,mode:'name'}}));
out.push(q('visual_shape_properties','count_sides',i++,`How many sides does this shape have?`,s.sides,{key:`sides:${s.id}:${r}`,visual:{type:'applied',subtype:'shape',shape:s.id,rotation:r*11,mode:'sides'}}));}
return out;
}
function tablePool(){
const out=[];let i=0,names=['Oak','Beech','Ash','Elm'];
for(let j=0;j<36;j++){const vals=[20+((j*7)%60),30+((j*11)%70),15+((j*13)%65),25+((j*17)%75)],a=j%4,b=(j+2)%4,diff=Math.abs(vals[a]-vals[b]);
out.push(q('table_reasoning','difference',i++,`Use the table. What is the difference between ${names[a]} and ${names[b]}?`,diff,{key:`diff:${vals.join('-')}:${a}:${b}`,visual:{type:'applied',subtype:'value_table',labels:names,values:vals,unit:'units',highlight:[a,b]}}));}
for(let j=0;j<36;j++){const vals=[100+((j*37)%900),200+((j*41)%800),150+((j*43)%850),250+((j*47)%750)],a=j%4,b=(j+1)%4,sum=vals[a]+vals[b];
out.push(q('table_reasoning','combined',i++,`Use the table. What is the combined total for ${names[a]} and ${names[b]}?`,sum,{key:`sum:${vals.join('-')}:${a}:${b}`,visual:{type:'applied',subtype:'value_table',labels:names,values:vals,unit:'',highlight:[a,b]}}));}
return out;
}
const POOLS={measure_scales:measurePool(),timetable_reasoning:timetablePool(),missing_digit_calculations:missingDigitPool(),coin_reasoning:coinPool(),visual_shape_properties:shapePool(),table_reasoning:tablePool()};
function circlePts(cx,cy,r,n=40){return Array.from({length:n},(_,i)=>{const a=2*Math.PI*i/n;return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)};});}
function polyShape(id,cx,cy,r,rot=0){const sides={triangle:3,square:4,rectangle:4,pentagon:5,hexagon:6,octagon:8}[id]||4,pts=[];for(let i=0;i<sides;i++){const a=rot*Math.PI/180-Math.PI/2+i*2*Math.PI/sides,rx=id==='rectangle'?r*1.35:r,ry=id==='rectangle'?r*.72:r;pts.push({x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry});}return pts;}
function renderApplied(C,x,y,w,h,v,answers){
const ink=[31,41,55],muted=[95,105,120],teal=[15,118,110],line=[190,202,207],pale=[244,249,248],fill=[224,242,239];
if(v.subtype==='jug'){const left=x+w*.34,top=y+h*.12,jw=w*.30,jh=h*.70;C.rect(left,top,jw,jh,{stroke:ink,width:.8});const frac=v.level/v.max,waterH=jh*frac;C.rect(left,top+jh-waterH,jw,waterH,{fill,stroke:null});for(let val=0;val<=v.max;val+=v.step){const yy=top+jh-jh*val/v.max;C.line(left+jw,yy,left+jw+9,yy,{color:ink,width:.55});if(val>0)C.text(left+jw+13,yy+2,String(val),5.6,{color:muted});}C.text(x+w/2,top+jh+16,'ml',6.5,{bold:true,align:'center',color:teal});if(v.target)C.text(x+w*.18,top+jh*(1-v.target/v.max)+2,`target ${v.target}`,5.6,{color:teal});}
else if(v.subtype==='ruler'){const left=x+w*.10,right=x+w*.90,cy=y+h*.55;C.line(left,cy,right,cy,{color:ink,width:1});for(let k=0;k<v.ticks;k++){const xx=left+(right-left)*k/(v.ticks-1);C.line(xx,cy-10,xx,cy+2,{color:ink,width:.6});if(k%2===0)C.text(xx,cy+15,String(v.start+k*v.step),5.7,{align:'center',color:muted});}const mx=left+(right-left)*v.mark/(v.ticks-1);C.line(mx,cy-28,mx,cy-12,{color:teal,width:1.4});C.polygon([{x:mx-4,y:cy-18},{x:mx+4,y:cy-18},{x:mx,y:cy-10}],{fill:teal,stroke:teal,width:.3});}
else if(v.subtype==='timeline'){const blocks=v.blocks||[],start=blocks[0]?.start||0,end=blocks[blocks.length-1]?.end||start+1,left=x+w*.08,right=x+w*.92,top=y+h*.35,bh=42;blocks.forEach((b,j)=>{const xx=left+(right-left)*(b.start-start)/(end-start),ww=(right-left)*(b.end-b.start)/(end-start);C.rect(xx,top,ww,bh,{fill:j===v.ask?fill:pale,stroke:line,width:.5});C.text(xx+ww/2,top+17,b.name,5.7,{bold:true,align:'center',color:j===v.ask?teal:ink});C.text(xx,top+bh+13,timeText(b.start),5.4,{align:'center',color:muted});if(j===blocks.length-1)C.text(xx+ww,top+bh+13,timeText(b.end),5.4,{align:'center',color:muted});});}
else if(v.subtype==='train_table'){const rows=v.rows||[],cols=(rows[0]?.times||[]).length,left=x+w*.08,top=y+8,rowH=Math.min(23,h/(rows.length+2)),nameW=w*.25,timeW=(w*.80-nameW)/Math.max(1,cols);rows.forEach((r,ri)=>{C.rect(left,top+ri*rowH,nameW,rowH,{fill:ri%2?pale:null,stroke:line,width:.4});C.text(left+5,top+ri*rowH+rowH*.65,r.station,5.8,{color:ink});r.times.forEach((t,ci)=>{const xx=left+nameW+ci*timeW;C.rect(xx,top+ri*rowH,timeW,rowH,{fill:ci===v.best?fill:null,stroke:line,width:.4});C.text(xx+timeW/2,top+ri*rowH+rowH*.65,timeText(t),5.8,{align:'center',color:ci===v.best?teal:ink});});});}
else if(v.subtype==='missing_digit'){const cy=y+h*.48,fs=13,top=cy-35;C.text(x+w*.60,top,String(v.aMasked||''),fs,{bold:true,align:'right',color:ink});C.text(x+w*.31,top+28,v.op,fs,{bold:true,align:'center',color:muted});C.text(x+w*.60,top+28,String(v.bMasked??v.b??''),fs,{bold:true,align:'right',color:ink});C.line(x+w*.25,top+37,x+w*.65,top+37,{color:ink,width:1});C.text(x+w*.60,top+58,String(v.result),fs,{bold:true,align:'right',color:ink});if(answers)C.text(x+w*.78,top+28,`digit ${v.answerDigit}`,7,{bold:true,color:teal});}
else if(v.subtype==='coins'){const vals=v.values||[],counts=v.counts||[],all=[];vals.forEach((v0,k)=>{for(let n=0;n<(counts[k]||0);n++)all.push(v0);});const gap=10,r=Math.min(22,w/(all.length*2.7)),left=x+w/2-(all.length-1)*(2*r+gap)/2;all.forEach((coin,j)=>{const cx=left+j*(2*r+gap),cy=y+h*.48;C.polygon(circlePts(cx,cy,r),{fill:pale,stroke:ink,width:.7});C.text(cx,cy+3,coin>=100?`£${coin/100}`:`${coin}p`,6.8,{bold:true,align:'center',color:ink});});if(v.price)C.text(x+w/2,y+h*.78,`price ${v.price}p`,7,{bold:true,align:'center',color:teal});}
else if(v.subtype==='coin_slots'){const r=18,gap=15,total=v.count,left=x+w/2-(total-1)*(2*r+gap)/2;for(let j=0;j<total;j++){const cx=left+j*(2*r+gap),cy=y+h*.48;C.polygon(circlePts(cx,cy,r),{fill:null,stroke:ink,width:.7});C.text(cx,cy+3,'?',8,{bold:true,align:'center',color:teal});}C.text(x+w/2,y+h*.77,`Total ${v.target}p · use 10p, 20p or 50p`,6.5,{align:'center',color:muted});}
else if(v.subtype==='shape'){const pts=polyShape(v.shape,x+w/2,y+h*.50,Math.min(w*.18,h*.30),v.rotation||0);C.polygon(pts,{fill:pale,stroke:ink,width:1});}
else if(v.subtype==='value_table'){const labels=v.labels||[],vals=v.values||[],left=x+w*.20,top=y+8,rowH=Math.min(25,h/(labels.length+1)),tw=w*.60;labels.forEach((lab,j)=>{const hi=(v.highlight||[]).includes(j);C.rect(left,top+j*rowH,tw*.55,rowH,{fill:hi?fill:j%2?pale:null,stroke:line,width:.4});C.rect(left+tw*.55,top+j*rowH,tw*.45,rowH,{fill:hi?fill:j%2?pale:null,stroke:line,width:.4});C.text(left+7,top+j*rowH+rowH*.65,lab,6.2,{bold:hi,color:hi?teal:ink});C.text(left+tw*.92,top+j*rowH+rowH*.65,`${vals[j]}${v.unit?' '+v.unit:''}`,6.2,{bold:true,align:'right',color:ink});});}
}
global.TT99VisualRenderers=global.TT99VisualRenderers||{};global.TT99VisualRenderers.applied=renderApplied;
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
G.replaceQuestion=function(questions,index,inputRules,seed){const cur=questions?.[index];if(!cur||!isKind(cur.kind))return previous.replaceQuestion(questions,index,inputRules,seed);let p=(POOLS[cur.kind]||[]).filter(q=>q.key!==cur.key&&q.group===cur.group),used=new Set(questions.filter((_,i)=>i!==index).map(q=>q.key));let c=p.filter(q=>!used.has(q.key));if(!c.length)c=p;const rng=rngFor(String(seed||'')+':applied-replace'),choice=shuffle(c,rng)[0];if(!choice)return questions.slice();const out=questions.slice();out[index]={...clone(choice),number:index+1};return out;};
function validate(){const errors=[];for(const [kind,p] of Object.entries(POOLS)){if(p.length<12)errors.push(`${kind}:pool-too-small:${p.length}`);const keys=new Set();for(const item of p){if(keys.has(item.key))errors.push(`${kind}:duplicate-key:${item.key}`);keys.add(item.key);if(item.answer==null||item.answer==='')errors.push(`${kind}:blank-answer`);}}return{ok:!errors.length,errors,counts:Object.fromEntries(Object.entries(POOLS).map(([k,p])=>[k,p.length]))};}
global.TT99CustomAppliedVisuals={VERSION,FAMILIES,POOLS,validate,renderApplied};
}(typeof window!=='undefined'?window:globalThis));
