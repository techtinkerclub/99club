/* 99 Club Studio · v1.47 original overlapping sum-grid puzzles
 * Corner Sum Grid and Linked Sum Grid.
 * Original presentation/naming; deterministic generation with unique-solution validation.
 */
(function(global){
'use strict';
const NL=global.TT99NumberLogicGames;if(!NL||NL.__sumGridsV147)return;
const VERSION='1.0.0',BASE_GENERATE=NL.generate.bind(NL),BASE_VALIDATE=NL.validate.bind(NL),BASE_WORKED=NL.workedExample.bind(NL),BASE_NORMALISE=NL.normalise.bind(NL);
const TOPICS=['number_place_value','calculation','fractions','decimals_percentages','ratio_proportion','measurement','geometry','statistics','algebra'];
const compat=(excellent=[],reasonable=[])=>Object.fromEntries(TOPICS.map(t=>[t,excellent.includes(t)?'excellent':reasonable.includes(t)?'reasonable':'poor']));
const opts=a=>a.map(([value,label])=>({value,label}));
const WINDOWS=[[0,1,3,4],[1,2,4,5],[3,4,6,7],[4,5,7,8]];
const GROUP_PATTERNS=[[[0,4,8],[1,5,6],[2,3,7]],[[0,5,7],[1,3,8],[2,4,6]],[[0,4,7],[1,5,8],[2,3,6]],[[0,3,8],[1,4,6],[2,5,7]],[[0,5,6],[1,4,8],[2,3,7]],[[0,4,6],[1,5,7],[2,3,8]]];
const COMMON={group:'Number logic & grids',kind:'independent',printableMode:'grid',answerSheetSupport:true,workedExampleSupport:true,needsCutting:false,needsDice:false,needsPartner:false,supportedAnswerTypes:['number','logic','arithmetic'],difficultyOptions:['easy','standard','challenge'],topicYearMin:{number_place_value:2,calculation:2,algebra:5},compatibility:compat(['calculation'],['number_place_value','algebra'])};
const DEFS={
 cornersum:{...COMMON,id:'cornersum',title:'Corner Sum Grid',defaultSettings:{difficulty:'standard',givenLevel:'auto'},settingsSchema:[{id:'difficulty',type:'difficulty',label:'Difficulty'},{id:'givenLevel',type:'select',label:'Starting digits',options:opts([['auto','Auto'],['more','More'],['balanced','Balanced'],['fewer','Fewer']])}],difficultyDescriptions:{easy:'More starter digits with the same overlapping-sum reasoning',standard:'Usually one or two starter digits',challenge:'No starter digits where the four sums uniquely determine the grid'}},
 linkedsum:{...COMMON,id:'linkedsum',title:'Linked Sum Grid',defaultSettings:{difficulty:'standard',givenLevel:'auto'},settingsSchema:[{id:'difficulty',type:'difficulty',label:'Difficulty'},{id:'givenLevel',type:'select',label:'Starting digits',options:opts([['auto','Auto'],['more','More'],['balanced','Balanced'],['fewer','Fewer']])}],difficultyDescriptions:{easy:'Local window sums plus A/B/C totals with extra starter digits',standard:'Cross-check overlapping windows against the three group totals',challenge:'All deductions come from the local and group totals where possible'}}
};
Object.assign(NL.DEFINITIONS,DEFS);
function normalise(id,raw={}){const d=DEFS[id]?.defaultSettings||{},o={...d,...raw};o.difficulty=['easy','standard','challenge'].includes(o.difficulty)?o.difficulty:'standard';o.givenLevel=['auto','more','balanced','fewer'].includes(o.givenLevel)?o.givenLevel:'auto';return o;}
NL.normalise=function(id,raw={}){if(DEFS[id])return normalise(id,raw);return BASE_NORMALISE(id,raw);};
function hashString(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rngFromSeed(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function permutation(rng){return shuffle([1,2,3,4,5,6,7,8,9],rng);}
function windowTotals(solution){return WINDOWS.map(w=>w.reduce((s,i)=>s+solution[i],0));}
function makeGroups(solution,rng){const pattern=GROUP_PATTERNS[Math.floor(rng()*GROUP_PATTERNS.length)].map(a=>a.slice()),labels=shuffle(['A','B','C'],rng);return pattern.map((cells,i)=>({label:labels[i],cells,target:cells.reduce((s,j)=>s+solution[j],0)})).sort((a,b)=>a.label.localeCompare(b.label));}
function constraints(data){const out=WINDOWS.map((cells,i)=>({cells,target:Number(data.windowTotals?.[i])||0,type:'window',id:i}));for(const g of data.groups||[])out.push({cells:g.cells.slice(),target:Number(g.target)||0,type:'group',id:g.label});return out;}
function solve(data,limit=2,nodeLimit=500000){
 const cons=constraints(data),state=Array(9).fill(0),givenMap=new Map((data.givens||[]).map(g=>[Number(g.index??(g.r*3+g.c)),Number(g.v)])),touch=Array.from({length:9},()=>[]);cons.forEach((q,qi)=>q.cells.forEach(i=>touch[i].push(qi)));let used=0,count=0,nodes=0,capped=false,first=null;
 function availableDigits(){const a=[];for(let v=1;v<=9;v++)if(!(used&(1<<v)))a.push(v);return a;}
 function feasible(q){let sum=0,left=[];for(const i of q.cells){if(state[i])sum+=state[i];else left.push(i);}if(!left.length)return sum===q.target;if(sum>=q.target)return false;const avail=availableDigits();if(avail.length<left.length)return false;avail.sort((a,b)=>a-b);let min=0,max=0;for(let k=0;k<left.length;k++){min+=avail[k];max+=avail[avail.length-1-k];}return sum+min<=q.target&&sum+max>=q.target;}
 function allFeasible(indices){const set=new Set();for(const i of indices)for(const qi of touch[i])set.add(qi);for(const qi of set)if(!feasible(cons[qi]))return false;return true;}
 for(const [i,v] of givenMap){if(i<0||i>8||v<1||v>9||(used&(1<<v)))return {count:0,nodes,capped:false,solution:null};state[i]=v;used|=1<<v;}
 if(!allFeasible([...givenMap.keys()]))return {count:0,nodes,capped:false,solution:null};
 function chooseCell(){let best=-1,score=-1;for(let i=0;i<9;i++)if(!state[i]){let assigned=0;for(const qi of touch[i])for(const j of cons[qi].cells)if(state[j])assigned++;const s=touch[i].length*10+assigned;if(s>score){score=s;best=i;}}return best;}
 function rec(){if(count>=limit||capped)return;if(++nodes>nodeLimit){capped=true;return;}const i=chooseCell();if(i<0){count++;if(!first)first=state.slice();return;}const forced=givenMap.get(i),domain=forced?[forced]:availableDigits();for(const v of domain){if(used&(1<<v))continue;state[i]=v;used|=1<<v;if(allFeasible([i]))rec();used&=~(1<<v);state[i]=0;if(count>=limit||capped)return;}}
 rec();return {count,nodes,capped,solution:first};
}
function requestedGivens(id,o){if(o.givenLevel==='more')return id==='cornersum'?4:3;if(o.givenLevel==='balanced')return 2;if(o.givenLevel==='fewer')return 0;if(o.difficulty==='easy')return id==='cornersum'?3:2;if(o.difficulty==='challenge')return 0;return 1;}
function candidateGivens(solution,count,rng){return shuffle(Array.from({length:9},(_,i)=>i),rng).slice(0,count).map(index=>({index,r:Math.floor(index/3),c:index%3,v:solution[index]}));}
function encode(data){const s=JSON.stringify(data);if(typeof btoa==='function')return btoa(unescape(encodeURIComponent(s)));if(typeof Buffer!=='undefined')return Buffer.from(s,'utf8').toString('base64');return s;}
function marker(id,data){return ` [[TT99V147:${id}:${encode(data)}]]`;}
function generateOne(id,settings,seed){const o=normalise(id,settings?.engineSettings?.[id]),rng=rngFromSeed(`${seed}:${id}`),wanted=requestedGivens(id,o);let best=null;
 for(let attempt=0;attempt<120;attempt++){
   const solution=permutation(rng),totals=windowTotals(solution),groups=id==='linkedsum'?makeGroups(solution,rng):[],data={windowTotals:totals,groups,givens:[]};
   let givens=candidateGivens(solution,wanted,rng),probe=solve({...data,givens},2,160000);
   if(probe.count!==1||probe.capped){const remaining=shuffle(Array.from({length:9},(_,i)=>i).filter(i=>!givens.some(g=>g.index===i)),rng);for(const i of remaining){givens.push({index:i,r:Math.floor(i/3),c:i%3,v:solution[i]});probe=solve({...data,givens},2,160000);if(probe.count===1&&!probe.capped)break;}}
   if(probe.count!==1||probe.capped)continue;
   const extra=Math.max(0,givens.length-wanted),score=extra*1000+probe.nodes;if(!best||score<best.score)best={solution,totals,groups,givens,probe,score};if(extra===0)break;
 }
 if(!best)return {engineId:id,title:DEFS[id].title,error:'A unique sum-grid puzzle could not be built. Generate another version.'};
 const display=Array(9).fill(null);best.givens.forEach(g=>display[g.index]=g.v);const payload={kind:id,windowTotals:best.totals,givens:best.givens,groups:best.groups,solution:best.solution};
 const instruction=id==='cornersum'?'Place 1–9 once each. Each corner target is the sum of the four cells in its overlapping 2 × 2 window.':'Place 1–9 once each. Match every overlapping 2 × 2 window total and each lettered A/B/C group total.';
 return {engineId:id,title:DEFS[id].title,difficulty:o.difficulty,size:3,solutionGrid:[best.solution.slice(0,3),best.solution.slice(3,6),best.solution.slice(6,9)],solution:best.solution,displayGrid:[display.slice(0,3),display.slice(3,6),display.slice(6,9)],windowTotals:best.totals,givens:best.givens,groups:best.groups,solverNodes:best.probe.nodes,seed,options:o,engineVersion:VERSION,instruction:instruction+marker(id,payload)};
}
function validPermutation(a){return Array.isArray(a)&&a.length===9&&a.every(v=>Number.isInteger(v)&&v>=1&&v<=9)&&new Set(a).size===9;}
function validateOne(a){if(!a||a.error)return {ok:false,error:a?.error||'missing activity'};const id=a.engineId;if(!DEFS[id])return BASE_VALIDATE(a);const sol=Array.isArray(a.solution)?a.solution:(a.solutionGrid||[]).flat();if(!validPermutation(sol))return {ok:false,error:'sum-grid solution must use 1–9 exactly once'};const totals=windowTotals(sol);if(!Array.isArray(a.windowTotals)||totals.some((v,i)=>v!==Number(a.windowTotals[i])))return {ok:false,error:'sum-grid window total mismatch'};if(id==='linkedsum'){const groups=a.groups||[],cells=groups.flatMap(g=>g.cells||[]);if(groups.length!==3||cells.length!==9||new Set(cells).size!==9||cells.some(i=>i<0||i>8))return {ok:false,error:'linked sum groups must partition all nine cells'};for(const g of groups)if(g.cells.reduce((s,i)=>s+sol[i],0)!==Number(g.target))return {ok:false,error:'linked sum group total mismatch'};}
 for(const g of a.givens||[]){const i=Number(g.index??(g.r*3+g.c));if(sol[i]!==Number(g.v))return {ok:false,error:'sum-grid starter digit mismatch'};}
 const q=solve({windowTotals:a.windowTotals,groups:a.groups||[],givens:a.givens||[]},2,500000);if(q.capped)return {ok:false,error:'sum-grid uniqueness check exceeded safe search limit'};if(q.count!==1)return {ok:false,error:q.count===0?'sum-grid has no solution':'sum-grid is not unique'};if(!q.solution||q.solution.some((v,i)=>v!==sol[i]))return {ok:false,error:'stored sum-grid answer does not match unique solution'};return {ok:true,solverNodes:q.nodes};}
function worked(id){if(id==='cornersum')return {engineId:id,kind:id,title:'Corner Sum Grid worked example',goal:'Place 1–9 once each so every overlapping four-cell window matches its target.',rules:['Use each digit from 1 to 9 exactly once.','Each target belongs to the four cells in one overlapping 2 × 2 window.','A starter digit, if shown, is fixed.'],steps:['Pick a window with useful known values.','Subtract known cells from its target to find the total still needed.','Compare that remaining total with an overlapping window, then rule out digits already used elsewhere.'],tip:'The four windows overlap, so a number in the centre contributes to all four totals.',commonMistake:'Do not reuse a digit: the grid must contain 1, 2, 3, 4, 5, 6, 7, 8 and 9 exactly once.'};return {engineId:id,kind:id,title:'Linked Sum Grid worked example',goal:'Place 1–9 once each while satisfying both overlapping window sums and A/B/C group totals.',rules:['Use each digit from 1 to 9 exactly once.','Each local target totals an overlapping 2 × 2 window.','Cells carrying the same letter also add to that letter total.'],steps:['Use a local window to work out a missing subtotal.','Use an A, B or C group total to connect cells that are not next to each other.','Cross-check both kinds of total before fixing a digit.'],tip:'A cell belongs to a local window and a letter group, so every placement has two kinds of consequences.',commonMistake:'The letters are groups, not values: three A cells add to the A target.'};}
NL.generate=function(id,settings,seed){if(DEFS[id])return generateOne(id,settings,seed);return BASE_GENERATE(id,settings,seed);};
NL.validate=function(a){if(DEFS[a?.engineId])return validateOne(a);return BASE_VALIDATE(a);};
NL.workedExample=function(id,...args){if(DEFS[id])return worked(id);return BASE_WORKED(id,...args);};
NL.V147={VERSION,DEFINITIONS:DEFS,WINDOWS,generate:generateOne,validate:validateOne,solve,windowTotals};NL.__sumGridsV147=true;
if(typeof module!=='undefined'&&module.exports)module.exports=NL;global.TT99NumberLogicGames=NL;
})(typeof globalThis!=='undefined'?globalThis:this);
