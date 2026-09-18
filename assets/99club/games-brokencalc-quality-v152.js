/* 99 Club Studio · Broken Calculator engine + quality guard v1.53
 * Normal arithmetic precedence throughout: × and ÷ before + and −.
 * No brackets are generated, required or accepted by the QA proof search.
 */
(function(global){
'use strict';
const A=global.TT99ArithmeticGames;
if(!A||A.__brokenCalcQualityV153)return;

const baseGenerate=A.generate.bind(A),OPS=['+','-','×','÷'];
function hash(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rngFromSeed(seed){let a=hash(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function choose(rng,arr){return arr[Math.floor(rng()*arr.length)];}
function shuffle(rng,arr){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function norm(raw={}){return {difficulty:['easy','standard','challenge'].includes(raw.difficulty)?raw.difficulty:'standard',targets:['2','3','4'].includes(String(raw.targets))?String(raw.targets):'3',keyLevel:['auto','generous','tight'].includes(raw.keyLevel)?raw.keyLevel:'auto'};}
function difficultyOf(settings){return norm(settings?.engineSettings?.brokencalc||{}).difficulty;}

/* Evaluate an unbracketed expression with standard precedence. */
function evaluate(tokens){
  const t=(tokens||[]).map(String);if(!t.length||t.length%2===0||!/^\d+$/.test(t[0]))return NaN;
  let sum=0,term=Number(t[0]);
  for(let i=1;i<t.length;i+=2){const op=t[i],b=Number(t[i+1]);if(!OPS.includes(op)||!Number.isFinite(b))return NaN;
    if(op==='×')term*=b;else if(op==='÷'){if(b===0)return NaN;term/=b;}else{sum+=term;term=op==='+'?b:-b;}
    if(!Number.isFinite(sum)||!Number.isFinite(term))return NaN;
  }
  return sum+term;
}

/* Engine: generate targets whose stored solution itself obeys standard precedence. */
function makeExpression(digits,ops,rng,difficulty){
  const terms=difficulty==='easy'?2:difficulty==='challenge'?4:3,nums=Array.from({length:terms},()=>choose(rng,digits)),tokens=[String(nums[0])];
  for(let i=1;i<terms;i++)tokens.push(choose(rng,ops),String(nums[i]));
  return {tokens,value:evaluate(tokens),expr:tokens.join(' ')};
}
function generateStandard(settings,seed){
  const c=norm(settings?.engineSettings?.brokencalc||{}),rng=rngFromSeed(`${seed}:brokencalc:v153`),maxYear=clamp(Number(settings?.maxYear)||6,1,6);
  const digitCount=c.keyLevel==='generous'?4:c.keyLevel==='tight'?2:(c.difficulty==='easy'?4:3),digits=shuffle(rng,[1,2,3,4,5,6,7,8,9]).slice(0,digitCount).sort((a,b)=>a-b);
  let ops;if(c.difficulty==='easy')ops=['+'];else if(maxYear<=2)ops=['+','-'];else if(c.difficulty==='challenge')ops=['+','-','×','÷'];else ops=['+','×'];
  const keys=[...digits.map(String),...ops,'='],digitSet=new Set(digits.map(String)),targetCount=clamp(Number(c.targets)||3,2,4),targets=[],seen=new Set();
  const typeable=value=>String(Math.trunc(value)).split('').every(ch=>digitSet.has(ch));
  for(let tries=0;tries<1800&&targets.length<targetCount;tries++){
    const q=makeExpression(digits,ops,rng,c.difficulty),v=q.value;if(!Number.isFinite(v)||Math.abs(v-Math.round(v))>1e-9)continue;
    const iv=Math.round(v);if(iv<=0||iv>=1000||typeable(iv)||seen.has(iv))continue;
    seen.add(iv);targets.push({target:iv,solution:q.expr,keyPresses:`${q.expr} =`,evaluation:'standard-precedence'});
  }
  if(targets.length<targetCount){const a=digits[0]||2;for(let n=2;n<=10&&targets.length<targetCount;n++){const iv=a*n;if(iv<=0||iv>=1000||typeable(iv)||seen.has(iv))continue;const expr=Array(n).fill(String(a)).join(' + ');seen.add(iv);targets.push({target:iv,solution:expr,keyPresses:`${expr} =`,evaluation:'standard-precedence'});}}
  if(targets.length<targetCount)return generateStandard(settings,`${seed}:retry`);
  return {engineId:'brokencalc',title:'Broken Calculator',difficulty:c.difficulty,keys,targets,instruction:'Only the keys shown still work. Make each target using normal order of operations.',seed,options:c,evaluationMode:'standard-precedence',bracketsAllowed:false};
}

/* QA: state=(completed additive sum,current multiplicative term). Appending ×/÷
   changes only the term; appending +/− closes it. This proves reachability under
   the same precedence rule as the player UI, without introducing brackets. */
function workingParts(puzzle){const keys=new Set(puzzle?.keys||[]);return {digits:[...keys].filter(k=>/^\d$/.test(k)).map(Number),ops:[...keys].filter(k=>OPS.includes(k))};}
function stateKey(sum,term){return `${Math.round(sum*1e8)/1e8}|${Math.round(term*1e8)/1e8}`;}
function appendState(s,op,b){if(op==='×')return {sum:s.sum,term:s.term*b};if(op==='÷')return b===0?null:{sum:s.sum,term:s.term/b};if(op==='+')return {sum:s.sum+s.term,term:b};if(op==='-')return {sum:s.sum+s.term,term:-b};return null;}
function reachable(target,puzzle,{maxOperands=8,valueCap=5000,maxStates=30000}={}){
  target=Number(target);if(!Number.isFinite(target))return null;const {digits,ops}=workingParts(puzzle);if(!digits.length||!ops.length)return null;
  let layer=new Map();for(const d of digits){const s={sum:0,term:d,expr:String(d)};layer.set(stateKey(0,d),s);if(Math.abs(d-target)<1e-9)return s.expr;}
  for(let used=2;used<=maxOperands;used++){
    const next=new Map();
    for(const s of layer.values()){
      for(const op of ops)for(const d of digits){const n=appendState(s,op,d);if(!n)continue;const value=n.sum+n.term;if(!Number.isFinite(value)||Math.abs(n.sum)>valueCap||Math.abs(n.term)>valueCap||Math.abs(value)>valueCap)continue;const k=stateKey(n.sum,n.term);if(next.has(k))continue;n.expr=`${s.expr} ${op} ${d}`;next.set(k,n);if(Math.abs(value-target)<1e-9)return n.expr;if(next.size>=maxStates)break;}if(next.size>=maxStates)break;
    }
    layer=next;if(!layer.size)break;
  }
  return null;
}
function verify(puzzle){
  if(!puzzle||puzzle.engineId!=='brokencalc'||puzzle.error)return {ok:false,error:puzzle?.error||'Not a Broken Calculator puzzle'};
  const proofs=[];for(const t of puzzle.targets||[]){const expr=reachable(t.target,puzzle);if(!expr)return {ok:false,error:`Target ${t.target} is not reachable using normal order of operations and the visible working keys.`};proofs.push({target:Number(t.target),expression:expr,evaluation:'standard-precedence'});}return {ok:true,proofs};
}
function enhance(puzzle,settings){
  if(!puzzle||puzzle.engineId!=='brokencalc'||puzzle.error)return puzzle;const out=JSON.parse(JSON.stringify(puzzle));
  if(difficultyOf(settings)==='challenge'&&!out.keys.includes('÷')){const eqIndex=out.keys.indexOf('=');if(eqIndex>=0)out.keys.splice(eqIndex,0,'÷');else out.keys.push('÷');}
  out.keys=out.keys.filter(k=>k!=='('&&k!==')');const proof=verify(out);if(!proof.ok)return null;
  out.evaluationMode='standard-precedence';out.bracketsAllowed=false;out.brokenCalcQuality={version:'1.53',reachable:true,proofs:proof.proofs,divisionAvailable:out.keys.includes('÷'),evaluation:'standard-precedence',brackets:false};return out;
}
function generateClean(settings,seed){for(let attempt=0;attempt<30;attempt++){const fixed=enhance(generateStandard(settings,attempt?`${seed}:precedence:${attempt}`:seed),settings);if(fixed)return fixed;}return {engineId:'brokencalc',title:'Broken Calculator',error:'Could not build a calculator puzzle whose targets are reachable using normal order of operations.'};}

A.generate=function(id,settings,seed){return id==='brokencalc'?generateClean(settings,seed):baseGenerate(id,settings,seed);};
A._brokenCalcEvaluateV153=evaluate;
A.generateBrokenCalcV153=generateStandard;
A.BROKENCALC_QUALITY={version:'1.53',evaluation:'standard-precedence',reachable,verify};
A.__brokenCalcQualityV152=true;
A.__brokenCalcQualityV153=true;
})(typeof globalThis!=='undefined'?globalThis:this);
