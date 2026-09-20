/* 99 Club Studio - Custom Worksheets formal written methods
 * Deterministic UK-style written calculation questions with generated working grids.
 */
(function(global){
'use strict';
const G=global.TT99Generator;if(!G)return;
const VERSION='0.1.0';
const FAMILIES={
  column_addition:{label:'column addition',strand:'Calculation',years:[3,4,5,6],curriculumId:'KS2 written addition'},
  column_subtraction:{label:'column subtraction',strand:'Calculation',years:[3,4,5,6],curriculumId:'KS2 written subtraction'},
  long_multiplication:{label:'formal multiplication',strand:'Calculation',years:[4,5,6],curriculumId:'KS2 written multiplication'},
  short_division:{label:'short division',strand:'Calculation',years:[3,4,5,6],curriculumId:'KS2 written division'},
  long_division:{label:'long division',strand:'Calculation',years:[6],curriculumId:'Y6 written division'}
};
const IDS=Object.keys(FAMILIES),isKind=k=>IDS.includes(String(k||'')),hasKind=r=>Array.isArray(r?.families)&&r.families.some(isKind);
const clone=o=>JSON.parse(JSON.stringify(o));
for(const [id,m] of Object.entries(FAMILIES)){
  if(!G.FAMILY_META[id])G.FAMILY_META[id]={label:m.label,strand:m.strand,years:m.years.slice(),visual:true,curriculumId:m.curriculumId};
  G.FAMILY_LABELS[id]=m.label;
  if(Array.isArray(G.FAMILY_ORDER)&&!G.FAMILY_ORDER.includes(id))G.FAMILY_ORDER.push(id);
  if(Array.isArray(G.FAMILY_COMPACT_ORDER)&&!G.FAMILY_COMPACT_ORDER.includes(id))G.FAMILY_COMPACT_ORDER.push(id);
}
function int(n){return Math.round(Number(n));}
function q(kind,i,prompt,answer,visual,keyExtra=''){
  return {kind,prompt,answer:String(answer),key:`${kind}:${i}:${keyExtra}`,visual,footprint:'L',group:kind,marking:{mode:'exact',answer:String(answer)}};
}
function additionPool(){
  const out=[];for(let i=0;i<36;i++){
    const digits=3+(i%4),count=2+(i%3),base=10**(digits-1),ops=[];
    for(let j=0;j<count;j++)ops.push(base+((i+3)*(j+5)*7919)%(9*base));
    const result=ops.reduce((a,b)=>a+b,0);
    out.push(q('column_addition',i,'Use column addition to calculate.',result,{type:'written_method',method:'addition',operands:ops,result,gridCols:Math.max(digits+2,String(result).length+2),gridRows:count+4},ops.join('-')));
  }return out;
}
function subtractionPool(){
  const out=[];for(let i=0;i<36;i++){
    const digits=3+(i%4),base=10**(digits-1),b=base+((i+7)*4861)%(7*base),result=Math.max(100,Math.floor(base*.18)+((i+11)*1237)%(Math.max(101,Math.floor(2*base)))),a=b+result;
    out.push(q('column_subtraction',i,'Use column subtraction to calculate.',result,{type:'written_method',method:'subtraction',operands:[a,b],result,gridCols:Math.max(String(a).length,String(b).length,String(result).length)+2,gridRows:6},`${a}-${b}`));
  }return out;
}
function multiplicationPool(){
  const out=[];for(let i=0;i<40;i++){
    const aDigits=i%3===0?2:i%3===1?3:4,bDigits=i%4<2?1:2;
    const a=10**(aDigits-1)+((i+5)*3571)%(9*10**(aDigits-1));
    const b=10**(bDigits-1)+((i+9)*43)%(9*10**(bDigits-1));
    const result=a*b,partials=String(b).split('').reverse().map((d,j)=>a*Number(d)*10**j);
    out.push(q('long_multiplication',i,'Use a formal written method to calculate.',result,{type:'written_method',method:'multiplication',operands:[a,b],result,partials,gridCols:Math.max(String(result).length+2,String(a).length+3),gridRows:7+partials.length},`${a}x${b}`));
  }return out;
}
function shortDivisionPool(){
  const out=[];for(let i=0;i<36;i++){
    const divisor=2+(i%8),quotient=100+((i+3)*137)%(i%3===0?900:4900),dividend=divisor*quotient;
    out.push(q('short_division',i,'Use short division to calculate.',quotient,{type:'written_method',method:'short_division',divisor,dividend,result:quotient,gridCols:String(dividend).length+4,gridRows:6},`${dividend}/${divisor}`));
  }return out;
}
function longDivisionPool(){
  const divisors=[11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28,31,32,34,36];
  const out=[];for(let i=0;i<40;i++){
    const divisor=divisors[i%divisors.length],quotient=12+((i+4)*19)%288,dividend=divisor*quotient;
    out.push(q('long_division',i,'Use long division to calculate.',quotient,{type:'written_method',method:'long_division',divisor,dividend,result:quotient,gridCols:String(dividend).length+5,gridRows:9},`${dividend}/${divisor}`));
  }return out;
}
const POOLS={column_addition:additionPool(),column_subtraction:subtractionPool(),long_multiplication:multiplicationPool(),short_division:shortDivisionPool(),long_division:longDivisionPool()};
function pool(kind){return clone(POOLS[kind]||[]);}

function grid(C,x,y,w,h,cols,rows){
  cols=Math.max(6,cols||8);rows=Math.max(5,rows||7);
  const cell=Math.min(22,Math.max(12,Math.min(w/cols,h/rows))),gw=cell*cols,gh=cell*rows,left=x+(w-gw)/2,top=y+(h-gh)/2;
  for(let c=0;c<=cols;c++)C.line(left+c*cell,top,left+c*cell,top+gh,{color:[212,224,226],width:.42});
  for(let r=0;r<=rows;r++)C.line(left,top+r*cell,left+gw,top+r*cell,{color:[212,224,226],width:.42});
  return {cell,left,top,cols,rows,right:left+gw,bottom:top+gh};
}
function drawDigits(C,g,row,value,opts={}){
  const text=String(value),start=g.cols-1-text.length-(opts.reserveRight||0),size=Math.min(12,g.cell*.62),yy=g.top+(row+.69)*g.cell;
  [...text].forEach((ch,j)=>C.text(g.left+(start+j+.5)*g.cell,yy,ch,size,{bold:!!opts.bold,align:'center',color:opts.color||[31,41,55]}));
}
function renderWritten(C,x,y,w,h,v,answers){
  const g=grid(C,x,y,w,h,v.gridCols,v.gridRows),ink=[31,41,55],teal=[15,118,110];
  if(v.method==='addition'||v.method==='subtraction'||v.method==='multiplication'){
    const ops=v.operands||[],start=1;
    ops.forEach((n,j)=>drawDigits(C,g,start+j,n,{bold:j===ops.length-1}));
    const op=v.method==='addition'?'+':v.method==='subtraction'?'−':'×',opRow=start+ops.length-1;
    C.text(g.left+g.cell*.55,g.top+(opRow+.68)*g.cell,op,Math.min(12,g.cell*.66),{bold:true,align:'center',color:ink});
    const lineY=g.top+(start+ops.length)*g.cell;C.line(g.left+g.cell*.35,lineY,g.right-g.cell*.25,lineY,{color:ink,width:1});
    let resultRow=start+ops.length;
    if(v.method==='multiplication'&&Array.isArray(v.partials)&&v.partials.length>1){
      if(answers){v.partials.forEach((n,j)=>drawDigits(C,g,resultRow+j,n,{color:[70,84,90]}));}
      resultRow+=v.partials.length;
      C.line(g.left+g.cell*.35,g.top+resultRow*g.cell,g.right-g.cell*.25,g.top+resultRow*g.cell,{color:ink,width:.8});
    }
    if(answers)drawDigits(C,g,resultRow,v.result,{bold:true,color:teal});
  }else{
    const divisor=String(v.divisor),dividend=String(v.dividend),row=2,size=Math.min(12,g.cell*.62);
    const divStart=1,bracketCol=Math.min(g.cols-2,divisor.length+2);
    [...divisor].forEach((ch,j)=>C.text(g.left+(divStart+j+.5)*g.cell,g.top+(row+.69)*g.cell,ch,size,{align:'center',color:ink}));
    [...dividend].forEach((ch,j)=>C.text(g.left+(bracketCol+j+.5)*g.cell,g.top+(row+.69)*g.cell,ch,size,{align:'center',color:ink}));
    const bx=g.left+(bracketCol-.15)*g.cell,by=g.top+(row+.08)*g.cell;
    C.line(bx,by,bx,g.top+(row+1)*g.cell,{color:ink,width:1});
    C.line(bx,by,g.right-g.cell*.2,by,{color:ink,width:1});
    if(answers){
      const qt=String(v.result),start=bracketCol+Math.max(0,dividend.length-qt.length);
      [...qt].forEach((ch,j)=>C.text(g.left+(start+j+.5)*g.cell,g.top+(row-.35)*g.cell,ch,size,{bold:true,align:'center',color:teal}));
    }
  }
}
global.TT99VisualRenderers=global.TT99VisualRenderers||{};global.TT99VisualRenderers.written_method=renderWritten;

const previous={generateQuestions:G.generateQuestions.bind(G),questionPool:G.questionPool.bind(G),questionByKey:G.questionByKey.bind(G),questionPoolIndex:G.questionPoolIndex.bind(G),questionByPoolIndex:G.questionByPoolIndex.bind(G),replaceQuestion:G.replaceQuestion.bind(G)};
function hashString(str){let h=2166136261>>>0;for(let i=0;i<String(str).length;i++){h^=String(str).charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function rngFor(seed){if(typeof G.rngFromSeed==='function')return G.rngFromSeed(seed);let a=hashString(seed)||1234567;return()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296;};}
function shuffle(a,r){const o=a.slice();for(let i=o.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[o[i],o[j]]=[o[j],o[i]];}return o;}
function weightedCounts(rules,rng){const bag=[];for(const f of rules.families){for(let i=0;i<Math.max(1,Number(rules.familyWeights?.[f])||1);i++)bag.push(f);}const cycle=shuffle(bag,rng),counts=Object.fromEntries(rules.families.map(f=>[f,0]));for(let i=0;i<rules.questionCount;i++)counts[cycle[i%cycle.length]]++;return counts;}
function pick(p,n,r,avoid=true){const s=shuffle(p,r),out=[];for(let i=0;i<n;i++){if(i<s.length)out.push(clone(s[i]));else if(s.length)out.push(clone(s[i%s.length]));}return out;}
G.questionPool=function(kind,rules){if(isKind(kind))return pool(kind);return previous.questionPool(kind,rules);};
G.questionByKey=function(kind,rules,key){if(!isKind(kind))return previous.questionByKey(kind,rules,key);const x=pool(kind).find(q=>q.key===key);return x?clone(x):null;};
G.questionPoolIndex=function(kind,rules,key){if(!isKind(kind))return previous.questionPoolIndex(kind,rules,key);return pool(kind).findIndex(q=>q.key===key);};
G.questionByPoolIndex=function(kind,rules,index){if(!isKind(kind))return previous.questionByPoolIndex(kind,rules,index);const p=pool(kind),n=Number(index);return Number.isInteger(n)&&n>=0&&n<p.length?clone(p[n]):null;};
G.generateQuestions=function(inputRules,seed){
  const rules=G.normalizeRules(inputRules);if(rules.mode!=='family_mix'||!hasKind(rules))return previous.generateQuestions(inputRules,seed);
  const rng=rngFor(seed||'CUSTOM'),counts=weightedCounts(rules,rng);let out=[];
  for(const f of rules.families){const n=counts[f]||0;if(n)out=out.concat(pick(G.questionPool(f,rules),n,rng,rules.avoidExactDuplicates!==false));}
  return shuffle(out,rng).map((it,i)=>({...it,number:i+1}));
};
G.replaceQuestion=function(questions,index,inputRules,seed){
  const current=questions?.[index];if(!current||!isKind(current.kind))return previous.replaceQuestion(questions,index,inputRules,seed);
  const rules=G.normalizeRules(inputRules),p=pool(current.kind).filter(q=>q.key!==current.key),used=new Set(questions.filter((_,i)=>i!==index).map(q=>q.key)),c=p.filter(q=>!used.has(q.key)),rng=rngFor(String(seed||'')+':written-replace'),choice=shuffle(c.length?c:p,rng)[0];if(!choice)return questions.slice();const out=questions.slice();out[index]={...clone(choice),number:index+1};return out;
};
function validateQuestion(item){
  const v=item?.visual;if(!v||v.type!=='written_method')return {ok:false,error:'not-written-method'};
  if(v.method==='addition')return {ok:v.operands.reduce((a,b)=>a+b,0)===v.result,error:'addition-mismatch'};
  if(v.method==='subtraction')return {ok:v.operands[0]-v.operands[1]===v.result,error:'subtraction-mismatch'};
  if(v.method==='multiplication')return {ok:v.operands[0]*v.operands[1]===v.result,error:'multiplication-mismatch'};
  return {ok:v.divisor*v.result===v.dividend,error:'division-mismatch'};
}
global.TT99CustomWrittenMethods={VERSION,FAMILIES,POOLS,validateQuestion,renderWritten};
}(typeof window!=='undefined'?window:globalThis));
