/* 99 Club Studio · v1.39 Takuzu deduction guard
 * Accepts only puzzles that can be completed by deterministic Takuzu deductions:
 * line balance, no-three, and row/column uniqueness. No branching or guessing.
 */
(function(global){
'use strict';
const NL=global.TT99NumberLogicGames;if(!NL||!NL.TAKUZU||NL.__takuzuLogicV139)return;
const baseGenerate=NL.generate.bind(NL),baseValidate=NL.validate.bind(NL),patterns=NL.TAKUZU.linePatterns;
function clone(g){return g.map(r=>r.slice());}
function hashString(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rngFromSeed(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function complete(line){return line.every(v=>v===0||v===1);}
function lineKey(line){return line.join('');}
function matches(pattern,line){for(let i=0;i<line.length;i++)if(line[i]!=null&&line[i]!==pattern[i])return false;return true;}
function forcedFromCandidates(line,cands){const forced=[];for(let i=0;i<line.length;i++){if(line[i]!=null||!cands.length)continue;const v=cands[0][i];if(cands.every(p=>p[i]===v))forced.push([i,v]);}return forced;}
function rowCandidates(grid,r){const n=grid.length,completed=new Set(grid.filter((row,i)=>i!==r&&complete(row)).map(lineKey));return patterns(n).filter(p=>matches(p,grid[r])&&!completed.has(lineKey(p)));}
function col(grid,c){return grid.map(r=>r[c]);}
function colCandidates(grid,c){const n=grid.length,completed=new Set(Array.from({length:n},(_,cc)=>cc).filter(cc=>cc!==c).map(cc=>col(grid,cc)).filter(complete).map(lineKey)),line=col(grid,c);return patterns(n).filter(p=>matches(p,line)&&!completed.has(lineKey(p)));}
function solveByLogic(display,solution=null){const grid=clone(display),n=grid.length;let passes=0,fills=0;for(let guard=0;guard<n*n*4;guard++){let changed=false;passes++;
  for(let r=0;r<n;r++){const cands=rowCandidates(grid,r);if(!cands.length)return {solved:false,contradiction:true,grid,passes,fills};for(const [c,v] of forcedFromCandidates(grid[r],cands)){if(solution&&solution[r][c]!==v)return {solved:false,contradiction:true,grid,passes,fills};grid[r][c]=v;fills++;changed=true;}}
  for(let c=0;c<n;c++){const cands=colCandidates(grid,c);if(!cands.length)return {solved:false,contradiction:true,grid,passes,fills};for(const [r,v] of forcedFromCandidates(col(grid,c),cands)){if(solution&&solution[r][c]!==v)return {solved:false,contradiction:true,grid,passes,fills};grid[r][c]=v;fills++;changed=true;}}
  if(grid.every(complete))return {solved:true,contradiction:false,grid,passes,fills};if(!changed)return {solved:false,contradiction:false,grid,passes,fills};
}return {solved:false,contradiction:false,grid,passes,fills};}
function makeLogicSolvable(a){if(!a||a.error||a.engineId!=='takuzu')return a;let check=solveByLogic(a.displayGrid,a.solutionGrid);if(check.solved){a.logicStats={logicSolvable:true,extraGivens:0,passes:check.passes};return a;}const n=a.size,rng=rngFromSeed(`${a.seed}:logic-reveal`),order=shuffle(Array.from({length:n*n},(_,i)=>[Math.floor(i/n),i%n]).filter(([r,c])=>a.displayGrid[r][c]==null),rng);let extra=0;for(const [r,c] of order){a.displayGrid[r][c]=a.solutionGrid[r][c];extra++;check=solveByLogic(a.displayGrid,a.solutionGrid);if(check.solved)break;}a.givens=[];for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(a.displayGrid[r][c]!=null)a.givens.push({r,c,v:a.displayGrid[r][c]});a.logicStats={logicSolvable:check.solved,extraGivens:extra,passes:check.passes};return a;}
NL.generate=function(id,settings,seed){const a=baseGenerate(id,settings,seed);return id==='takuzu'?makeLogicSolvable(a):a;};
NL.validate=function(a){const v=baseValidate(a);if(!v.ok||a?.engineId!=='takuzu')return v;const logic=solveByLogic(a.displayGrid,a.solutionGrid);if(!logic.solved)return {ok:false,error:'takuzu requires guessing; deduction solver stalled'};return {ok:true,logicSolvable:true,logicPasses:logic.passes};};
NL.TAKUZU.solveByLogic=solveByLogic;NL.TAKUZU.makeLogicSolvable=makeLogicSolvable;NL.__takuzuLogicV139=true;
if(typeof module!=='undefined'&&module.exports)module.exports=NL;
})(typeof globalThis!=='undefined'?globalThis:this);
