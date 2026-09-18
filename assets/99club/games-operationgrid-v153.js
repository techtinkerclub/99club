/* 99 Club Studio · Operation Codebreaker engine upgrade v1.53
 * Adds 1–3 missing operators, precedence/bracket structures and exhaustive
 * unique-solution validation. Loaded after games-arithmetic.js and before
 * games-engine.js so printable sheets and Online Play share one data model.
 */
(function(global){
'use strict';
const A=global.TT99ArithmeticGames;if(!A||A.__operationGridV153)return;
const DEF=A.DEFINITIONS?.operationgrid;if(!DEF)return;
const OPS_ALL=['+','-','×','÷'];
const VALID_MISSING=['auto','one','up2','up3'];
const VALID_STRUCTURE=['auto','precedence','mixed','brackets'];
const VALID_ROWS=['auto','5','6','8'];
const VALID_OPS=['auto','addsub','four'];
const baseGenerate=A.generate.bind(A),baseNormalise=A.normalise.bind(A),baseValidate=A.validate.bind(A),baseWorked=A.workedExample.bind(A);

function choice(value,label){return {value,label};}
DEF.defaultSettings={...DEF.defaultSettings,missingOps:'auto',structure:'auto'};
DEF.settingsSchema=[
  {id:'difficulty',type:'difficulty',label:'Difficulty'},
  {id:'rowCount',type:'select',label:'Equations',options:[choice('auto','Auto'),choice('5','5'),choice('6','6'),choice('8','8')]},
  {id:'operations',type:'select',label:'Operations',options:[choice('auto','Auto for difficulty'),choice('addsub','+ and −'),choice('four','+ − × ÷')]},
  {id:'missingOps',type:'select',label:'Missing operators / equation',help:'Auto progresses from one missing sign to multi-step expressions. Three missing signs are reserved for Challenge.',options:[choice('auto','Auto for difficulty'),choice('one','Exactly 1'),choice('up2','Up to 2'),choice('up3','Up to 3 (Challenge)')]},
  {id:'structure',type:'select',label:'Expression structure',help:'Precedence uses × and ÷ before + and −. Brackets are generated only when they genuinely change the calculation.',options:[choice('auto','Auto for difficulty'),choice('precedence','Order of operations'),choice('mixed','Mixed precedence + brackets'),choice('brackets','Include brackets')]}
];
DEF.difficultyDescriptions={easy:'One missing sign and straightforward arithmetic',standard:'One or two signs with order-of-operations reasoning',challenge:'Mainly two signs, occasional three-sign expressions and meaningful brackets'};

function normalise(raw={}){
  const out={...DEF.defaultSettings,...raw};
  if(!['easy','standard','challenge'].includes(out.difficulty))out.difficulty='standard';
  out.rowCount=VALID_ROWS.includes(String(out.rowCount))?String(out.rowCount):'auto';
  out.operations=VALID_OPS.includes(out.operations)?out.operations:'auto';
  out.missingOps=VALID_MISSING.includes(out.missingOps)?out.missingOps:'auto';
  out.structure=VALID_STRUCTURE.includes(out.structure)?out.structure:'auto';
  return out;
}
A.normalise=function(id,raw={}){return id==='operationgrid'?normalise(raw):baseNormalise(id,raw);};

function poolFor(o){if(o.operations==='addsub')return ['+','-'];if(o.operations==='four')return OPS_ALL.slice();if(o.difficulty==='easy')return ['+','-'];if(o.difficulty==='standard')return ['+','-','×'];return OPS_ALL.slice();}
function precedence(op){return op==='+'||op==='-'?1:2;}
function apply(a,op,b){
  if(!Number.isInteger(a)||!Number.isInteger(b))return null;
  if(op==='+')return a+b;
  if(op==='-'){const v=a-b;return v<0?null:v;}
  if(op==='×')return a*b;
  if(op==='÷'){if(b===0||a%b!==0)return null;return a/b;}
  return null;
}
function tokensFor(values,ops,structure){
  const v=values.map(Number),n=ops.length;
  if(n===1)return [v[0],ops[0],v[1]];
  if(n===2){
    if(structure==='left')return ['(',v[0],ops[0],v[1],')',ops[1],v[2]];
    if(structure==='right')return [v[0],ops[0],'(',v[1],ops[1],v[2],')'];
    return [v[0],ops[0],v[1],ops[1],v[2]];
  }
  if(structure==='left')return ['(',v[0],ops[0],v[1],')',ops[1],v[2],ops[2],v[3]];
  if(structure==='middle')return [v[0],ops[0],'(',v[1],ops[1],v[2],')',ops[2],v[3]];
  if(structure==='right')return [v[0],ops[0],v[1],ops[1],'(',v[2],ops[2],v[3],')'];
  if(structure==='pairs')return ['(',v[0],ops[0],v[1],')',ops[1],'(',v[2],ops[2],v[3],')'];
  return [v[0],ops[0],v[1],ops[1],v[2],ops[2],v[3]];
}
function evaluate(values,ops,structure='precedence'){
  if(!Array.isArray(values)||!Array.isArray(ops)||values.length!==ops.length+1)return null;
  const tokens=tokensFor(values,ops,structure),output=[],stack=[];
  for(const token of tokens){
    if(typeof token==='number'){output.push(token);continue;}
    if(token==='('){stack.push(token);continue;}
    if(token===')'){let found=false;while(stack.length){const x=stack.pop();if(x==='('){found=true;break;}output.push(x);}if(!found)return null;continue;}
    if(!OPS_ALL.includes(token))return null;
    while(stack.length&&OPS_ALL.includes(stack.at(-1))&&precedence(stack.at(-1))>=precedence(token))output.push(stack.pop());
    stack.push(token);
  }
  while(stack.length){const x=stack.pop();if(x==='(')return null;output.push(x);}
  const valuesStack=[];
  for(const token of output){
    if(typeof token==='number'){valuesStack.push(token);continue;}
    if(valuesStack.length<2)return null;const b=valuesStack.pop(),a=valuesStack.pop(),v=apply(a,token,b);if(v==null||!Number.isFinite(v))return null;valuesStack.push(v);
  }
  return valuesStack.length===1&&Number.isInteger(valuesStack[0])?valuesStack[0]:null;
}
function enumerateSolutions(row,pool){
  const out=[],n=row.ops?.length||Math.max(1,(row.values?.length||2)-1),trial=Array(n).fill(pool[0]);
  function walk(i){if(i===n){const value=evaluate(row.values,trial,row.structure);if(value===row.result)out.push(trial.slice());return;}for(const op of pool){trial[i]=op;walk(i+1);if(out.length>2)return;}}
  walk(0);return out;
}
function sameOps(a,b){return a.length===b.length&&a.every((v,i)=>v===b[i]);}
function expressionText(values,structure){
  const boxes=Array(values.length-1).fill('□');return `${tokensFor(values,boxes,structure).join(' ')} = `;
}
function formatRow(values,ops,structure,result,pool){
  const text=`${expressionText(values,structure)}${result}`;
  const row={values:values.slice(),ops:ops.slice(),structure,result,text,operatorCount:ops.length,pool:pool.slice()};
  row.a=values[0];row.b=values[1];if(values.length>2)row.c=values[2];if(values.length>3)row.d=values[3];return row;
}
function bracketStructures(n){return n===2?['left','right']:n===3?['left','middle','right','pairs']:['precedence'];}
function chooseStructure(o,n,rng){
  if(n===1)return 'precedence';
  const bracket=bracketStructures(n);
  if(o.structure==='precedence')return 'precedence';
  if(o.structure==='brackets')return bracket[Math.floor(rng()*bracket.length)];
  if(o.structure==='mixed')return rng()<.5?'precedence':bracket[Math.floor(rng()*bracket.length)];
  if(o.difficulty==='easy')return 'precedence';
  if(o.difficulty==='standard')return rng()<.68?'precedence':bracket[Math.floor(rng()*bracket.length)];
  return rng()<.42?'precedence':bracket[Math.floor(rng()*bracket.length)];
}
function randomOps(pool,n,rng){return Array.from({length:n},()=>pool[Math.floor(rng()*pool.length)]);}
function hasPrecedenceContrast(ops){return ops.some(op=>precedence(op)===1)&&ops.some(op=>precedence(op)===2);}
function meaningfulBrackets(values,ops,structure,result){if(structure==='precedence')return true;const unbracketed=evaluate(values,ops,'precedence');return unbracketed!=null&&unbracketed!==result;}
function randomValues(n,o,rng){const hi=o.difficulty==='easy'?18:o.difficulty==='standard'?24:32;return Array.from({length:n},()=>2+Math.floor(rng()*(hi-1)));}
function makeRow(o,pool,operatorCount,rng){
  const cap=o.difficulty==='easy'?60:o.difficulty==='standard'?180:600;
  for(let tries=0;tries<2600;tries++){
    const values=randomValues(operatorCount+1,o,rng),ops=randomOps(pool,operatorCount,rng),structure=chooseStructure(o,operatorCount,rng),result=evaluate(values,ops,structure);
    if(result==null||result<0||result>cap)continue;
    if(structure==='precedence'&&operatorCount>1&&pool.some(op=>precedence(op)===2)&&o.structure==='precedence'&&!hasPrecedenceContrast(ops))continue;
    if(!meaningfulBrackets(values,ops,structure,result))continue;
    const row=formatRow(values,ops,structure,result,pool),solutions=enumerateSolutions(row,pool);
    if(solutions.length===1&&sameOps(solutions[0],ops)){row.solutionCount=1;return row;}
  }
  // Simple, guaranteed unique row if a requested complex structure proves unusually awkward.
  const values=[10,3],ops=['+'],result=13,row=formatRow(values,ops,'precedence',result,pool);row.solutionCount=1;return row;
}
function maxOperators(o){if(o.difficulty==='easy')return 1;if(o.difficulty==='standard')return Math.min(2,o.missingOps==='one'?1:o.missingOps==='up3'?2:o.missingOps==='up2'?2:2);if(o.missingOps==='one')return 1;if(o.missingOps==='up2')return 2;return 3;}
function operatorCounts(o,n,rng){
  const max=maxOperators(o),counts=Array(n).fill(1),budget=Math.max(0,12-n);if(max===1||budget===0)return counts;
  const order=Array.from({length:n},(_,i)=>i);for(let i=order.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  let left=budget;
  if(max===3&&left>=2){const threeTarget=o.missingOps==='up3'&&n<=5?2:1;for(let k=0;k<threeTarget&&k<order.length&&left>=2;k++){counts[order[k]]=3;left-=2;}}
  const start=counts.filter(x=>x===3).length;
  let desiredTwos=0;
  if(o.missingOps==='up2'||o.missingOps==='up3')desiredTwos=n;
  else if(o.difficulty==='standard')desiredTwos=Math.ceil(n*.45);
  else desiredTwos=Math.ceil(n*.70);
  for(let k=start;k<order.length&&left>0&&desiredTwos>0;k++){const i=order[k];if(counts[i]===1){counts[i]=2;left--;desiredTwos--;}}
  return counts;
}
function generateOperationGrid(settings,seed){
  const raw=settings?.engineSettings?.operationgrid||{},o=normalise(raw),rng=A.rngFromSeed(seed),pool=poolFor(o),n=o.rowCount!=='auto'?Number(o.rowCount):(o.difficulty==='easy'?5:o.difficulty==='challenge'?6:6),counts=operatorCounts(o,n,rng),rows=counts.map(count=>makeRow(o,pool,count,rng)),code=rows.flatMap(r=>r.ops);
  return {engineId:'operationgrid',title:'Operation Codebreaker',difficulty:o.difficulty,rows,code,operatorPool:pool,operationGridVersion:153,instruction:'Fill every operator box so each equation is true. Use × and ÷ before + and − unless brackets change the order. Every row has one unique solution; then copy the signs in numbered order into the code.',seed,options:o};
}
function validateOperationGrid(a){
  if(!a?.rows?.length)return {ok:false,error:'operation codebreaker has no equations'};const pool=Array.isArray(a.operatorPool)&&a.operatorPool.length?a.operatorPool:poolFor(normalise(a.options||{}));let slots=0;
  for(const row of a.rows){if(!Array.isArray(row.values)||!Array.isArray(row.ops)||row.values.length!==row.ops.length+1)return {ok:false,error:'operation row malformed'};slots+=row.ops.length;const v=evaluate(row.values,row.ops,row.structure||'precedence');if(v!==Number(row.result))return {ok:false,error:'operation row result mismatch'};const solutions=enumerateSolutions(row,pool);if(solutions.length!==1||!sameOps(solutions[0],row.ops))return {ok:false,error:'operation row is not uniquely solvable'};if((row.structure||'precedence')!=='precedence'&&!meaningfulBrackets(row.values,row.ops,row.structure,row.result))return {ok:false,error:'operation row has decorative brackets'};}
  if(slots>12)return {ok:false,error:'operation code exceeds printable slot budget'};return {ok:true};
}

A.generate=function(id,settings,seed){return id==='operationgrid'?generateOperationGrid(settings,seed):baseGenerate(id,settings,seed);};
A.validate=function(activity){return activity?.engineId==='operationgrid'&&activity.operationGridVersion===153?validateOperationGrid(activity):baseValidate(activity);};
A.workedExample=function(id,settings,seed){if(id!=='operationgrid')return baseWorked(id,settings,seed);return {engineId:id,title:'Operation Codebreaker worked example',kind:id,goal:'Choose the missing signs, using order of operations and brackets correctly.',rules:['Multiplication and division are worked before addition and subtraction unless brackets tell you otherwise.','A row can contain more than one missing sign. Each generated row has one unique combination.','Copy the solved signs into the code in numbered order.'],steps:['First solve a simple lock: 18 □ 6 = 3, so the missing sign is ÷.','For 2 + 3 × 4, multiply first: 3 × 4 = 12, then add 2 to make 14.','Brackets can change the order: (2 + 3) × 4 = 20, because the bracket is worked first.','For a multi-box row, test the whole expression after choosing every sign.'],tip:'Before trying signs, decide which calculation must happen first.',commonMistake:'Do not simply work left to right when × or ÷ appears; follow the order of operations and any brackets.'};};
A._operationSolutions=function(row,pool){return row?.values?enumerateSolutions(row,pool||row.pool||OPS_ALL):[];};
A.OPERATIONGRID_V153={version:153,normalise,poolFor,evaluate,enumerateSolutions,validate:validateOperationGrid,generate:generateOperationGrid,tokensFor};
A.__operationGridV153=true;
})(typeof globalThis!=='undefined'?globalThis:this);
