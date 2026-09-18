/* 99 Club Studio · Colour Logic + Mobile Balance v1.96
 * Deterministic generators shared by printable packs and Online Play.
 * Colour Logic uses a constraint solver and only publishes uniquely solvable puzzles.
 * Mobile Balance builds exact integer mobiles; Challenge always uses multiple nested balances.
 */
(function(global){
'use strict';
const A=global.TT99ArithmeticGames;
if(!A||!A.DEFINITIONS||typeof A.generate!=='function'||A.__newPuzzlesV196)return;

const TOPICS=['number_place_value','calculation','fractions','decimals_percentages','ratio_proportion','measurement','geometry','statistics','algebra'];
const DIFFS=['easy','standard','challenge'];
const COLOURS=[
  {id:'R',name:'Red',hex:'#d9574f'},
  {id:'B',name:'Blue',hex:'#3f68c5'},
  {id:'G',name:'Green',hex:'#42a66c'},
  {id:'Y',name:'Yellow',hex:'#e4b83c'},
  {id:'P',name:'Purple',hex:'#8b5cc7'},
  {id:'O',name:'Orange',hex:'#e48635'}
];
const SHAPES=[
  {id:'circle',label:'Circle',glyph:'●'},
  {id:'square',label:'Square',glyph:'■'},
  {id:'triangle',label:'Triangle',glyph:'▲'},
  {id:'diamond',label:'Diamond',glyph:'◆'},
  {id:'star',label:'Star',glyph:'★'}
];

function hash(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rngFromSeed(seed){let a=hash(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function randInt(rng,a,b){return Math.floor(rng()*(b-a+1))+a;}
function choose(rng,arr){return arr[Math.floor(rng()*arr.length)];}
function shuffle(rng,arr){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t;}return a||1;}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b);}
function allCompat(excellent=[],reasonable=[]){return Object.fromEntries(TOPICS.map(t=>[t,excellent.includes(t)?'excellent':reasonable.includes(t)?'reasonable':'poor']));}
function selectOptions(values){return values.map(([value,label])=>({value,label}));}

A.DEFINITIONS.colourlogic={
  id:'colourlogic',title:'Colour Logic',group:'Logic & patterns',kind:'independent',printableMode:'logic',answerSheetSupport:true,workedExampleSupport:true,needsCutting:false,needsDice:false,needsPartner:false,
  supportedAnswerTypes:['logic','colour'],difficultyOptions:DIFFS,
  defaultSettings:{difficulty:'standard',layout:'auto',ruleStyle:'mixed'},
  settingsSchema:[
    {id:'difficulty',type:'difficulty',label:'Difficulty'},
    {id:'layout',type:'select',label:'Puzzle layout',options:selectOptions([['auto','Mixed row + grid'],['row','Colour row'],['grid','Colour grid']])},
    {id:'ruleStyle',type:'select',label:'Rule focus',options:selectOptions([['mixed','Mixed rules'],['position','Position & order'],['neighbour','Neighbours & distance'],['count','Counts & spatial rules']])}
  ],
  difficultyDescriptions:{easy:'Direct clues and compact 4-place / 3×3 puzzles',standard:'Five-place rows or 3×3 grids with linked deductions',challenge:'Six-place rows or 4×4 grids with interdependent constraints'},
  topicYearMin:{number_place_value:2,calculation:2,geometry:2,algebra:4},compatibility:allCompat(['geometry','algebra'],['number_place_value','calculation'])
};
A.DEFINITIONS.mobilebalance={
  id:'mobilebalance',title:'Mobile Balance',group:'Algebra & relationships',kind:'independent',printableMode:'diagram',answerSheetSupport:true,workedExampleSupport:true,needsCutting:false,needsDice:false,needsPartner:false,
  supportedAnswerTypes:['number','unknown'],difficultyOptions:DIFFS,
  defaultSettings:{difficulty:'standard',layout:'auto',givenMode:'auto'},
  settingsSchema:[
    {id:'difficulty',type:'difficulty',label:'Difficulty'},
    {id:'layout',type:'select',label:'Mobile layout',options:selectOptions([['auto','Auto for difficulty'],['simple','Single balance'],['nested','Nested balance'],['multiple','Multiple nested balances']])},
    {id:'givenMode',type:'select',label:'Starting clue',options:selectOptions([['auto','Mixed'],['shape','Give one shape value'],['total','Give the whole-mobile total']])}
  ],
  difficultyDescriptions:{easy:'One bar and two shapes',standard:'A two-level mobile with linked balances',challenge:'Three or more connected balances, including nested multi-level mobiles'},
  topicYearMin:{calculation:2,algebra:5,ratio_proportion:6},compatibility:allCompat(['calculation','algebra'],['ratio_proportion'])
};

function normColour(raw={}){return {difficulty:DIFFS.includes(raw.difficulty)?raw.difficulty:'standard',layout:['auto','row','grid'].includes(raw.layout)?raw.layout:'auto',ruleStyle:['mixed','position','neighbour','count'].includes(raw.ruleStyle)?raw.ruleStyle:'mixed'};}
function normMobile(raw={}){const difficulty=DIFFS.includes(raw.difficulty)?raw.difficulty:'standard';let layout=['auto','simple','nested','multiple'].includes(raw.layout)?raw.layout:'auto';if(difficulty==='challenge'&&layout!=='auto')layout='multiple';if(difficulty==='easy'&&layout==='multiple')layout='simple';return {difficulty,layout,givenMode:['auto','shape','total'].includes(raw.givenMode)?raw.givenMode:'auto'};}
const prevNormalise=A.normalise.bind(A);
A.normalise=function(id,raw={}){if(id==='colourlogic')return normColour(raw);if(id==='mobilebalance')return normMobile(raw);return prevNormalise(id,raw);};

function perms(items){const out=[];function rec(prefix,left){if(!left.length){out.push(prefix);return;}for(let i=0;i<left.length;i++)rec(prefix.concat(left[i]),left.slice(0,i).concat(left.slice(i+1)));}rec([],items);return out;}
function pos(state,id){return state.indexOf(id);}
function rowClueTest(clue,state){const p=id=>pos(state,id);switch(clue.type){case'exact':return p(clue.a)===clue.i;case'notExact':return p(clue.a)!==clue.i;case'end':return [0,state.length-1].includes(p(clue.a));case'notEnd':return ![0,state.length-1].includes(p(clue.a));case'left':return p(clue.a)<p(clue.b);case'right':return p(clue.a)>p(clue.b);case'next':return Math.abs(p(clue.a)-p(clue.b))===1;case'notNext':return Math.abs(p(clue.a)-p(clue.b))!==1;case'immediateLeft':return p(clue.a)+1===p(clue.b);case'distance2':return Math.abs(p(clue.a)-p(clue.b))===2;case'betweenImmediate':{const x=p(clue.a),u=p(clue.b),v=p(clue.c);return Math.abs(u-v)===2&&x===(u+v)/2;}case'between':{const x=p(clue.a),u=p(clue.b),v=p(clue.c);return (u<x&&x<v)||(v<x&&x<u);}case'oneOf':return p(clue.a)===clue.i||p(clue.a)===clue.j;case'exactlyOneEnd':return Number([0,state.length-1].includes(p(clue.a)))+Number([0,state.length-1].includes(p(clue.b)))===1;default:return true;}}
function colourName(id){return COLOURS.find(c=>c.id===id)?.name||id;}
function rowClueText(c){const A1=colourName(c.a),B1=colourName(c.b),C1=colourName(c.c);switch(c.type){case'exact':return `${A1} is in position ${c.i+1}.`;case'notExact':return `${A1} is not in position ${c.i+1}.`;case'end':return `${A1} is at one end.`;case'notEnd':return `${A1} is not at an end.`;case'left':return `${A1} is somewhere left of ${B1}.`;case'right':return `${A1} is somewhere right of ${B1}.`;case'next':return `${A1} is next to ${B1}.`;case'notNext':return `${A1} is not next to ${B1}.`;case'immediateLeft':return `${A1} is immediately left of ${B1}.`;case'distance2':return `There is one box between ${A1} and ${B1}.`;case'betweenImmediate':return `${A1} sits directly between ${B1} and ${C1}.`;case'between':return `${A1} is somewhere between ${B1} and ${C1}.`;case'oneOf':return `${A1} is in position ${c.i+1} or ${c.j+1}.`;case'exactlyOneEnd':return `Exactly one of ${A1} and ${B1} is at an end.`;default:return '';}}
function rowClueFamily(c){if(['exact','notExact','end','notEnd','oneOf','left','right'].includes(c.type))return'position';return'neighbour';}
function rowPool(solution,diff){const n=solution.length,pool=[];for(const a of solution){const i=pos(solution,a);pool.push({type:'exact',a,i},{type:'notEnd',a});if(i===0||i===n-1)pool.push({type:'end',a});else pool.push({type:'notExact',a,i:0},{type:'notExact',a,i:n-1});if(n>=5){const alt=(i+2)%n;if(alt!==i)pool.push({type:'oneOf',a,i:Math.min(i,alt),j:Math.max(i,alt)});}}for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const a=solution[i],b=solution[j];pool.push({type:'left',a,b},{type:'right',a:b,b:a});if(j-i===1)pool.push({type:'next',a,b},{type:'immediateLeft',a,b});else pool.push({type:'notNext',a,b});if(j-i===2)pool.push({type:'distance2',a,b});}if(n>=5)for(let i=1;i<n-1;i++){pool.push({type:'betweenImmediate',a:solution[i],b:solution[i-1],c:solution[i+1]});pool.push({type:'between',a:solution[i],b:solution[0],c:solution[n-1]});}if(diff==='challenge')for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const c={type:'exactlyOneEnd',a:solution[i],b:solution[j]};if(rowClueTest(c,solution))pool.push(c);}const seen=new Set();return pool.filter(c=>{if(!rowClueTest(c,solution))return false;const k=rowClueText(c);if(!k||seen.has(k))return false;seen.add(k);return true;});}
function chooseUniqueRow(solution,diff,style,rng){const states=perms(solution),all=rowPool(solution,diff),wanted=all.filter(c=>style==='mixed'||style==='count'||rowClueFamily(c)===style),pool=wanted.length>=4?wanted:all;let remaining=states.slice(),clues=[],direct=0;const directMax=diff==='easy'?2:diff==='standard'?1:0,candidates=shuffle(rng,pool).sort((a,b)=>{const score=c=>{const direct=c.type==='exact'?3:c.type==='oneOf'||c.type==='end'?2:0,complex=['betweenImmediate','between','distance2','exactlyOneEnd'].includes(c.type)?2:0;return diff==='easy'?direct-complex:diff==='challenge'?complex-direct:complex*.6-direct*.2;};return score(b)-score(a);});for(const c of candidates){if(c.type==='exact'&&direct>=directMax)continue;const next=remaining.filter(s=>rowClueTest(c,s));if(next.length===remaining.length)continue;clues.push(c);remaining=next;if(c.type==='exact')direct++;if(remaining.length===1)break;}if(remaining.length!==1){for(const c of shuffle(rng,all)){if(clues.some(x=>rowClueText(x)===rowClueText(c)))continue;const next=remaining.filter(s=>rowClueTest(c,s));if(next.length===remaining.length)continue;clues.push(c);remaining=next;if(remaining.length===1)break;}}if(remaining.length!==1)return null;for(let i=clues.length-1;i>=0;i--){const test=clues.slice(0,i).concat(clues.slice(i+1));if(states.filter(s=>test.every(c=>rowClueTest(c,s))).length===1)clues.splice(i,1);}const min=diff==='easy'?3:diff==='standard'?4:5;while(clues.length<min){const extra=shuffle(rng,all).find(c=>!clues.some(x=>rowClueText(x)===rowClueText(c)));if(!extra)break;clues.push(extra);}return {clues,solutionCount:1};}
function makeRowPuzzle(c,seed,rng){const n=c.difficulty==='easy'?4:c.difficulty==='challenge'?6:5,ids=COLOURS.slice(0,n).map(x=>x.id),solution=shuffle(rng,ids),picked=chooseUniqueRow(solution,c.difficulty,c.ruleStyle==='count'?'mixed':c.ruleStyle,rng);if(!picked)return null;return {engineId:'colourlogic',title:'Colour Logic',variant:'row',difficulty:c.difficulty,colors:COLOURS.slice(0,n),solution,clues:picked.clues.map(x=>({...x,text:rowClueText(x)})),instruction:'Place each colour exactly once. Use every rule to work out the order.',seed,options:c,solutionCount:1};}

function bitStates(n){const total=1<<(n*n),out=new Array(total);for(let mask=0;mask<total;mask++){const s=new Array(n*n);for(let i=0;i<s.length;i++)s[i]=(mask>>i)&1?'B':'R';out[mask]=s;}return out;}
const GRID_STATE_CACHE={};
function gridStates(n){return GRID_STATE_CACHE[n]||(GRID_STATE_CACHE[n]=bitStates(n));}
function gidx(n,r,c){return r*n+c;}
function gridClueTest(clue,state,n){const at=(r,c)=>state[gidx(n,r,c)],count=(cells,col)=>cells.reduce((k,[r,c])=>k+(at(r,c)===col?1:0),0);switch(clue.type){case'fixed':return at(clue.r,clue.c)===clue.col;case'notFixed':return at(clue.r,clue.c)!==clue.col;case'rowCount':return count(Array.from({length:n},(_,c)=>[clue.r,c]),clue.col)===clue.k;case'colCount':return count(Array.from({length:n},(_,r)=>[r,clue.c]),clue.col)===clue.k;case'totalCount':return state.filter(x=>x===clue.col).length===clue.k;case'cornerCount':return count([[0,0],[0,n-1],[n-1,0],[n-1,n-1]],clue.col)===clue.k;case'diagCount':return count(Array.from({length:n},(_,i)=>[i,clue.diag==='main'?i:n-1-i]),clue.col)===clue.k;case'noTouch':{for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(at(r,c)===clue.col){if(r+1<n&&at(r+1,c)===clue.col)return false;if(c+1<n&&at(r,c+1)===clue.col)return false;}return true;}case'no2x2':{for(let r=0;r<n-1;r++)for(let c=0;c<n-1;c++){const q=[at(r,c),at(r+1,c),at(r,c+1),at(r+1,c+1)];if(q.every(x=>x===q[0]))return false;}return true;}case'edgeCount':{const cells=[];for(let i=0;i<n;i++){cells.push([0,i],[n-1,i]);if(i>0&&i<n-1)cells.push([i,0],[i,n-1]);}return count(cells,clue.col)===clue.k;}default:return true;}}
function gridClueText(c,n){const name=colourName(c.col),cell=`row ${c.r+1}, column ${c.c+1}`;switch(c.type){case'fixed':return `The box at ${cell} is ${name}.`;case'notFixed':return `The box at ${cell} is not ${name}.`;case'rowCount':return `Row ${c.r+1} has exactly ${c.k} ${name} box${c.k===1?'':'es'}.`;case'colCount':return `Column ${c.c+1} has exactly ${c.k} ${name} box${c.k===1?'':'es'}.`;case'totalCount':return `The whole grid has exactly ${c.k} ${name} boxes.`;case'cornerCount':return `Exactly ${c.k} corner${c.k===1?' is':'s are'} ${name}.`;case'diagCount':return `The ${c.diag==='main'?'top-left to bottom-right':'top-right to bottom-left'} diagonal has exactly ${c.k} ${name} box${c.k===1?'':'es'}.`;case'noTouch':return `No two ${name} boxes touch side-by-side or top-to-bottom.`;case'no2x2':return `No 2×2 block is all one colour.`;case'edgeCount':return `Exactly ${c.k} edge boxes are ${name}.`;default:return '';}}
function gridClueFamily(c){if(['fixed','notFixed'].includes(c.type))return'position';if(['noTouch','no2x2'].includes(c.type))return'neighbour';return'count';}
function gridPool(solution,n){const p=[];for(let r=0;r<n;r++)for(let c=0;c<n;c++){const col=solution[gidx(n,r,c)];p.push({type:'fixed',r,c,col},{type:'notFixed',r,c,col:col==='R'?'B':'R'});}for(const col of ['R','B']){for(let r=0;r<n;r++){const k=Array.from({length:n},(_,c)=>solution[gidx(n,r,c)]).filter(x=>x===col).length;p.push({type:'rowCount',r,col,k});}for(let c=0;c<n;c++){const k=Array.from({length:n},(_,r)=>solution[gidx(n,r,c)]).filter(x=>x===col).length;p.push({type:'colCount',c,col,k});}p.push({type:'totalCount',col,k:solution.filter(x=>x===col).length});const corners=[[0,0],[0,n-1],[n-1,0],[n-1,n-1]],ck=corners.filter(([r,c])=>solution[gidx(n,r,c)]===col).length;p.push({type:'cornerCount',col,k:ck});for(const diag of ['main','anti']){const dk=Array.from({length:n},(_,i)=>solution[gidx(n,i,diag==='main'?i:n-1-i)]).filter(x=>x===col).length;p.push({type:'diagCount',diag,col,k:dk});}const edge=[];for(let i=0;i<n;i++){edge.push([0,i],[n-1,i]);if(i>0&&i<n-1)edge.push([i,0],[i,n-1]);}p.push({type:'edgeCount',col,k:edge.filter(([r,c])=>solution[gidx(n,r,c)]===col).length});const no={type:'noTouch',col};if(gridClueTest(no,solution,n))p.push(no);}const no2={type:'no2x2'};if(gridClueTest(no2,solution,n))p.push(no2);const seen=new Set();return p.filter(c=>{const k=gridClueText(c,n);if(!k||seen.has(k))return false;seen.add(k);return true;});}
function chooseUniqueGrid(solution,n,diff,style,rng){const states=gridStates(n),all=gridPool(solution,n),wanted=all.filter(c=>style==='mixed'||gridClueFamily(c)===style),pool=wanted.length>=4?wanted:all;let remaining=states.slice(),clues=[],direct=0;const sorted=shuffle(rng,pool).sort((a,b)=>{const sc=c=>{const direct=['fixed','notFixed'].includes(c.type)?2:0,global=['noTouch','no2x2','diagCount','cornerCount'].includes(c.type)?2:0;return diff==='easy'?direct-global:diff==='challenge'?global-direct:global*.6-direct*.2;};return sc(b)-sc(a);}),maxDirect=diff==='easy'?2:1;for(const c of sorted){if(['fixed','notFixed'].includes(c.type)&&direct>=maxDirect)continue;const next=remaining.filter(s=>gridClueTest(c,s,n));if(next.length===remaining.length)continue;clues.push(c);remaining=next;if(['fixed','notFixed'].includes(c.type))direct++;if(remaining.length===1)break;}if(remaining.length!==1){for(const c of shuffle(rng,all)){if(clues.some(x=>gridClueText(x,n)===gridClueText(c,n)))continue;const next=remaining.filter(s=>gridClueTest(c,s,n));if(next.length===remaining.length)continue;clues.push(c);remaining=next;if(remaining.length===1)break;}}if(remaining.length!==1)return null;for(let i=clues.length-1;i>=0;i--){const test=clues.slice(0,i).concat(clues.slice(i+1));if(states.filter(s=>test.every(c=>gridClueTest(c,s,n))).length===1)clues.splice(i,1);}const min=diff==='easy'?3:diff==='standard'?4:5;while(clues.length<min){const c=shuffle(rng,all).find(x=>!clues.some(y=>gridClueText(y,n)===gridClueText(x,n)));if(!c)break;clues.push(c);}return {clues,solutionCount:1};}
function makeGridPuzzle(c,seed,rng){const n=c.difficulty==='challenge'?4:3,states=gridStates(n);for(let attempt=0;attempt<40;attempt++){const solution=states[randInt(rng,0,states.length-1)].slice(),red=solution.filter(x=>x==='R').length;if(red<Math.floor(n*n*.3)||red>Math.ceil(n*n*.7))continue;const picked=chooseUniqueGrid(solution,n,c.difficulty,c.ruleStyle,rng);if(!picked)continue;return {engineId:'colourlogic',title:'Colour Logic',variant:'grid',difficulty:c.difficulty,size:n,colors:COLOURS.filter(x=>['R','B'].includes(x.id)),solutionGrid:Array.from({length:n},(_,r)=>solution.slice(r*n,(r+1)*n)),clues:picked.clues.map(x=>({...x,text:gridClueText(x,n)})),instruction:'Fill every box with R or B. Every rule must be true.',seed,options:c,solutionCount:1};}return null;}
function generateColour(settings,seed){const c=normColour(settings?.engineSettings?.colourlogic||{}),rng=rngFromSeed(`${seed}:colourlogic:v196`),layout=c.layout==='auto'?(c.ruleStyle==='count'?'grid':(rng()<.5?'row':'grid')):c.layout;let p=layout==='row'?makeRowPuzzle(c,seed,rng):makeGridPuzzle(c,seed,rng);if(!p)p=makeRowPuzzle({...c,layout:'row'},seed,rng);return p;}

function group(shape,count){return {type:'group',shape,count};}
function bar(left,right){return {type:'bar',left,right};}
function branchWeight(node,values){if(node.type==='group')return node.count*values[node.shape];return branchWeight(node.left,values)+branchWeight(node.right,values);}
function collectBars(node,out=[]){if(node.type==='bar'){out.push(node);collectBars(node.left,out);collectBars(node.right,out);}return out;}
function collectShapes(node,out=new Set()){if(node.type==='group')out.add(node.shape);else{collectShapes(node.left,out);collectShapes(node.right,out);}return out;}
function mobileBalanced(node,values){if(node.type==='group')return true;return branchWeight(node.left,values)===branchWeight(node.right,values)&&mobileBalanced(node.left,values)&&mobileBalanced(node.right,values);}
function shapeSet(rng,n){return shuffle(rng,SHAPES).slice(0,n).map(x=>x.id);}
function counts(rng,n){return Array.from({length:n},()=>randInt(rng,1,4));}
function baseT(cs,rng,maxFactor=3){let t=1;for(const c of cs)t=lcm(t,c);return t*randInt(rng,1,maxFactor);}
function buildEasy(rng,shapes){const [A1,B1]=shapes,[ka,kb]=counts(rng,2),T=baseT([ka,kb],rng,3),values={[A1]:T/ka,[B1]:T/kb},tree=bar(group(A1,ka),group(B1,kb));return {tree,values,topTotal:2*T,template:'simple'};}
function buildStandard(rng,shapes){const [A1,B1,C1]=shapes,[ka,kb,kc]=counts(rng,3),T=baseT([ka,kb,kc],rng,3),values={[A1]:2*T/ka,[B1]:T/kb,[C1]:T/kc},child=bar(group(B1,kb),group(C1,kc)),tree=bar(group(A1,ka),child);return {tree,values,topTotal:4*T,template:'nested'};}
function buildChallengeChain(rng,shapes){const [A1,B1,C1,D1]=shapes,[ka,kb,kc,kd]=counts(rng,4),T=baseT([ka,kb,kc,kd],rng,2),values={[A1]:4*T/ka,[B1]:2*T/kb,[C1]:T/kc,[D1]:T/kd},deep=bar(group(C1,kc),group(D1,kd)),mid=bar(group(B1,kb),deep),tree=bar(group(A1,ka),mid);return {tree,values,topTotal:8*T,template:'deep'};}
function buildChallengeTwin(rng,shapes){const [A1,B1,C1,D1]=shapes,[ka,kb,kc,kd]=counts(rng,4),T=baseT([ka,kb,kc,kd],rng,3),values={[A1]:T/ka,[B1]:T/kb,[C1]:T/kc,[D1]:T/kd},left=bar(group(A1,ka),group(B1,kb)),right=bar(group(C1,kc),group(D1,kd)),tree=bar(left,right);return {tree,values,topTotal:4*T,template:'twin'};}
function chooseGiven(c,built,shapeIds,rng){let mode=c.givenMode;if(mode==='auto')mode=rng()<.55?'shape':'total';const givens={};let shownTotal=null;if(mode==='shape'){const s=choose(rng,shapeIds);givens[s]=built.values[s];}else shownTotal=built.topTotal;return {givens,shownTotal,mode};}
function makeMobile(settings,seed){const c=normMobile(settings?.engineSettings?.mobilebalance||{}),rng=rngFromSeed(`${seed}:mobilebalance:v196`);let diff=c.difficulty,layout=c.layout;if(layout==='auto')layout=diff==='easy'?'simple':diff==='standard'?'nested':'multiple';if(diff==='challenge'&&layout!=='multiple')layout='multiple';if(diff==='easy'&&layout==='multiple')layout='simple';const n=diff==='easy'?2:diff==='standard'?3:4,ids=shapeSet(rng,n);let built;if(layout==='simple')built=buildEasy(rng,ids.slice(0,2));else if(layout==='nested'&&diff!=='challenge')built=buildStandard(rng,ids.slice(0,3));else built=rng()<.5?buildChallengeChain(rng,ids):buildChallengeTwin(rng,ids);const used=[...collectShapes(built.tree)],meta=Object.fromEntries(SHAPES.filter(s=>used.includes(s.id)).map(s=>[s.id,s])),given=chooseGiven(c,built,used,rng),bars=collectBars(built.tree);return {engineId:'mobilebalance',title:'Mobile Balance',difficulty:diff,tree:built.tree,shapeIds:used,shapeMeta:meta,values:built.values,givens:given.givens,topTotal:given.shownTotal,actualTopTotal:built.topTotal,givenMode:given.mode,barCount:bars.length,template:built.template,instruction:'Every horizontal bar is balanced. Work out the value of each shape.',seed,options:c};}

const prevGenerate=A.generate.bind(A);
A.generate=function(id,settings,seed){if(id==='colourlogic')return generateColour(settings,seed);if(id==='mobilebalance')return makeMobile(settings,seed);return prevGenerate(id,settings,seed);};
const prevWorkedExample=A.workedExample.bind(A);
A.workedExample=function(id,settings,seed){
  if(id==='colourlogic')return {
    engineId:id,kind:id,title:'Colour Logic worked example',
    goal:'Arrange the colours so every clue is true at the same time.',
    rules:['Use each listed colour exactly once in a row puzzle.','Position and neighbour clues must all be satisfied together.'],
    steps:['Example clues: Green is at one end; Red is immediately left of Blue; Yellow is right of Blue; Red is not at an end.','Green cannot be at the right end: that would force Red into the left end, which is forbidden.','So Green is first. The remaining order must be Red, Blue, Yellow.','The finished row is Green – Red – Blue – Yellow, and every clue is true.'],
    tip:'Start with the strongest clues: exact positions, ends and immediately-next-to relationships.',
    commonMistake:'A placement is not finished just because it satisfies one clue; it must satisfy every clue.'
  };
  if(id==='mobilebalance')return {
    engineId:id,kind:id,title:'Mobile Balance worked example',
    goal:'Use equal weights on both sides of each bar to work out the shape values.',
    rules:['Treat each horizontal bar as an equal-arm balance: total weight on the left equals total weight on the right.','Repeated copies of a shape have the same value.','On a nested mobile, the whole lower branch becomes one combined weight for the bar above.'],
    steps:['Two circles balance one triangle. Each circle is worth 6.','The two circles weigh 6 + 6 = 12.','So the triangle must also weigh 12.','The whole lower branch weighs 12 + 12 = 24; use 24 when that branch hangs from a higher bar.'],
    tip:'Solve the lowest bar first, then carry its whole branch total upwards.',
    commonMistake:'Do not compare only the nearest shape on a nested branch; everything hanging below the attachment point counts.'
  };
  return prevWorkedExample(id,settings,seed);
};

const prevValidate=A.validate.bind(A);
A.validate=function(p){if(p?.engineId==='colourlogic'){if(p.solutionCount!==1)return {ok:false,error:'colour logic not unique'};if(p.variant==='row'&&(!p.solution||!p.clues?.length))return {ok:false,error:'row puzzle incomplete'};if(p.variant==='grid'&&(!p.solutionGrid||!p.clues?.length))return {ok:false,error:'grid puzzle incomplete'};return {ok:true};}if(p?.engineId==='mobilebalance'){if(!p.tree||!mobileBalanced(p.tree,p.values||{}))return {ok:false,error:'mobile is not balanced'};if(p.difficulty==='challenge'&&Number(p.barCount)<3)return {ok:false,error:'challenge mobile must have multiple balances'};return {ok:true};}return prevValidate(p);};

A.generateColourLogicV196=generateColour;
A.generateMobileBalanceV196=makeMobile;
A._colourRowClueTestV196=rowClueTest;
A._gridClueTestV196=gridClueTest;
A._mobileBranchWeightV196=branchWeight;
A.__newPuzzlesV196=true;
})(typeof globalThis!=='undefined'?globalThis:this);
