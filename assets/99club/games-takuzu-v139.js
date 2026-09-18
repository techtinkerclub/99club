/* 99 Club Studio · v1.39 Binary Puzzle / Takuzu
 * Deterministic 4x4 / 6x6 / 8x8 generator with verified unique solutions.
 */
(function(global){
'use strict';
let NL=global.TT99NumberLogicGames||null;
if(!NL&&typeof require==='function'){try{NL=require('./games-number-logic.js');global.TT99NumberLogicGames=NL;}catch(e){}}
if(!NL||NL.__takuzuV139)return;
const VERSION='1.0.0';
const BASE_GENERATE=NL.generate.bind(NL),BASE_VALIDATE=NL.validate.bind(NL),BASE_WORKED=NL.workedExample.bind(NL),BASE_NORMALISE=NL.normalise.bind(NL);
const choiceOptions=values=>values.map(([value,label])=>({value,label}));
const compatibility={number_place_value:'excellent',calculation:'reasonable',fractions:'poor',decimals_percentages:'poor',ratio_proportion:'poor',measurement:'poor',geometry:'poor',statistics:'poor',algebra:'reasonable'};
const DEF={
  id:'takuzu',title:'Binary Puzzle · Takuzu',group:'Numeric logic',kind:'independent',printableMode:'grid',answerSheetSupport:true,workedExampleSupport:true,
  needsCutting:false,needsDice:false,needsPartner:false,supportedAnswerTypes:['number','logic','pattern'],difficultyOptions:['easy','standard','challenge'],
  defaultSettings:{difficulty:'standard',gridSize:'auto',givenLevel:'auto'},
  settingsSchema:[
    {id:'difficulty',type:'difficulty',label:'Difficulty'},
    {id:'gridSize',type:'select',label:'Grid size',options:choiceOptions([['auto','Auto'],['4','4 × 4'],['6','6 × 6'],['8','8 × 8']])},
    {id:'givenLevel',type:'select',label:'Starting digits',options:choiceOptions([['auto','Auto'],['more','More'],['balanced','Balanced'],['fewer','Fewer']])}
  ],
  difficultyDescriptions:{easy:'4 × 4 with generous starting digits',standard:'6 × 6 with balanced clues',challenge:'8 × 8 with fewer starting digits and deeper deduction'},
  topicYearMin:{number_place_value:3,calculation:3,algebra:5},compatibility
};
NL.DEFINITIONS.takuzu=DEF;
function normalise(raw={}){const d=DEF.defaultSettings,o={...d,...raw};o.difficulty=['easy','standard','challenge'].includes(o.difficulty)?o.difficulty:'standard';o.gridSize=['auto','4','6','8'].includes(String(o.gridSize))?String(o.gridSize):'auto';o.givenLevel=['auto','more','balanced','fewer'].includes(o.givenLevel)?o.givenLevel:'auto';return o;}
NL.normalise=function(id,raw={}){if(id==='takuzu')return normalise(raw);return BASE_NORMALISE(id,raw);};
function hashString(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rngFromSeed(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
const LINE_CACHE={};
function validLine(bits){const n=bits.length,half=n/2;if(bits.reduce((a,b)=>a+b,0)!==half)return false;for(let i=0;i<n-2;i++)if(bits[i]===bits[i+1]&&bits[i]===bits[i+2])return false;return true;}
function linePatterns(n){if(LINE_CACHE[n])return LINE_CACHE[n];const out=[];for(let mask=0;mask<(1<<n);mask++){const bits=Array.from({length:n},(_,i)=>(mask>>(n-1-i))&1);if(validLine(bits))out.push(bits);}return LINE_CACHE[n]=out;}
function partialColumnOK(grid,row,r,n){const half=n/2,remaining=n-r-1;for(let c=0;c<n;c++){let ones=row[c],zeros=1-row[c];for(let rr=0;rr<r;rr++){if(grid[rr][c]===1)ones++;else zeros++;}if(ones>half||zeros>half||ones+remaining<half||zeros+remaining<half)return false;if(r>=2&&grid[r-1][c]===row[c]&&grid[r-2][c]===row[c])return false;}return true;}
function columnsUnique(grid,n){const seen=new Set();for(let c=0;c<n;c++){const key=grid.map(row=>row[c]).join('');if(seen.has(key))return false;seen.add(key);}return true;}
function buildSolution(n,seed){const rng=rngFromSeed(`${seed}:solution`),patterns=linePatterns(n),ordered=shuffle(patterns,rng),grid=[],used=new Set();function rec(r){if(r===n)return columnsUnique(grid,n);const offset=Math.floor(rng()*ordered.length);for(let k=0;k<ordered.length;k++){const row=ordered[(k+offset)%ordered.length],key=row.join('');if(used.has(key)||!partialColumnOK(grid,row,r,n))continue;grid[r]=row;used.add(key);if(rec(r+1))return true;used.delete(key);grid.pop();}return false;}if(!rec(0))return null;return grid.map(r=>r.slice());}
function rowMatches(row,givens){for(let c=0;c<row.length;c++)if(givens[c]!=null&&givens[c]!==row[c])return false;return true;}
function countSolutions(display,limit=2){const n=display.length,patterns=linePatterns(n),candidates=display.map(row=>patterns.filter(p=>rowMatches(p,row))),grid=[],used=new Set();let count=0;function rec(r){if(count>=limit)return;if(r===n){if(columnsUnique(grid,n))count++;return;}for(const row of candidates[r]){const key=row.join('');if(used.has(key)||!partialColumnOK(grid,row,r,n))continue;grid[r]=row;used.add(key);rec(r+1);used.delete(key);if(count>=limit)return;}}rec(0);return count;}
function gridValid(grid){const n=grid?.length;if(![4,6,8].includes(n)||grid.some(r=>!Array.isArray(r)||r.length!==n))return false;for(const row of grid)if(!validLine(row))return false;const cols=Array.from({length:n},(_,c)=>grid.map(r=>r[c]));if(cols.some(c=>!validLine(c)))return false;const rows=new Set(grid.map(r=>r.join(''))),colSet=new Set(cols.map(c=>c.join('')));return rows.size===n&&colSet.size===n;}
function sizeFor(o){if(o.gridSize!=='auto')return Number(o.gridSize);return o.difficulty==='easy'?4:o.difficulty==='challenge'?8:6;}
function ratioFor(o){if(o.givenLevel==='more')return .62;if(o.givenLevel==='balanced')return .46;if(o.givenLevel==='fewer')return .33;return o.difficulty==='easy'?.58:o.difficulty==='challenge'?.33:.45;}
function minPerLine(o){return o.difficulty==='easy'?2:1;}
function encodePayload(data){const s=JSON.stringify(data);if(typeof btoa==='function')return btoa(s);if(typeof Buffer!=='undefined')return Buffer.from(s,'utf8').toString('base64');return s;}
function generateTakuzu(settings,seed){const o=normalise(settings?.engineSettings?.takuzu),n=sizeFor(o),solution=buildSolution(n,seed);if(!solution)return {engineId:'takuzu',title:'Binary Puzzle · Takuzu',error:'A valid binary grid could not be built. Generate another version.'};const display=solution.map(r=>r.slice()),rng=rngFromSeed(`${seed}:mask`),order=shuffle(Array.from({length:n*n},(_,i)=>[Math.floor(i/n),i%n]),rng),target=Math.max(n*minPerLine(o),Math.round(n*n*ratioFor(o))),rowCount=Array(n).fill(n),colCount=Array(n).fill(n),minLine=minPerLine(o);let shown=n*n;for(const [r,c] of order){if(shown<=target)break;if(rowCount[r]<=minLine||colCount[c]<=minLine)continue;const old=display[r][c];display[r][c]=null;if(countSolutions(display,2)===1){shown--;rowCount[r]--;colCount[c]--;}else display[r][c]=old;}const givens=[];for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(display[r][c]!=null)givens.push({r,c,v:display[r][c]});const payload={n,display,solution};return {engineId:'takuzu',title:'Binary Puzzle · Takuzu',difficulty:o.difficulty,size:n,displayGrid:display,solutionGrid:solution,givens,seed,options:o,engineVersion:VERSION,rules:['Equal numbers of 0s and 1s in every row and column.','Never place three identical digits next to each other.','No two completed rows or columns may be identical.'],instruction:`Fill every blank with 0 or 1. Follow the three binary-puzzle rules. [[TT99TAKUZU:${encodePayload(payload)}]]`};}
function validateTakuzu(a){if(!a||a.error)return {ok:false,error:a?.error||'missing activity'};const n=a.size;if(![4,6,8].includes(n))return {ok:false,error:'takuzu size invalid'};if(!gridValid(a.solutionGrid))return {ok:false,error:'takuzu solution violates the rules'};if(!Array.isArray(a.displayGrid)||a.displayGrid.length!==n)return {ok:false,error:'takuzu display grid missing'};for(let r=0;r<n;r++){if(!Array.isArray(a.displayGrid[r])||a.displayGrid[r].length!==n)return {ok:false,error:'takuzu display row invalid'};for(let c=0;c<n;c++){const v=a.displayGrid[r][c];if(v!=null&&v!==0&&v!==1)return {ok:false,error:'takuzu clue must be 0 or 1'};if(v!=null&&v!==a.solutionGrid[r][c])return {ok:false,error:'takuzu clue does not match solution'};}}const count=countSolutions(a.displayGrid,2);if(count!==1)return {ok:false,error:count===0?'takuzu has no solution':'takuzu is not unique'};return {ok:true};}
function workedExample(){return {engineId:'takuzu',kind:'takuzu',title:'Binary Puzzle · Takuzu worked example',goal:'Fill every blank with 0 or 1 while satisfying all three rules.',rules:['Each row and column has the same number of 0s and 1s.','000 and 111 are never allowed horizontally or vertically.','Every completed row is different, and every completed column is different.'],steps:['If two matching digits sit together, the cell beside them must be the other digit.','If a row already has half of one digit, its remaining blanks must be the other digit.','Use the same ideas down columns.','Check that no finished row or column duplicates another.'],tip:'Look first for pairs such as 00, 11, 0_0 or 1_1.',commonMistake:'Do not stop after balancing 0s and 1s — the no-three and no-duplicate rules still apply.'};}
NL.generate=function(id,settings,seed){if(id==='takuzu')return generateTakuzu(settings,seed);return BASE_GENERATE(id,settings,seed);};
NL.validate=function(a){if(a?.engineId==='takuzu')return validateTakuzu(a);return BASE_VALIDATE(a);};
NL.workedExample=function(id,...args){if(id==='takuzu')return workedExample();return BASE_WORKED(id,...args);};
NL.TAKUZU={VERSION,DEFINITION:DEF,generate:generateTakuzu,validate:validateTakuzu,countSolutions,gridValid,linePatterns};NL.__takuzuV139=true;
if(typeof module!=='undefined'&&module.exports)module.exports=NL;global.TT99NumberLogicGames=NL;
})(typeof globalThis!=='undefined'?globalThis:this);
