/* 99 Club Studio v1.32.0 Sumplete regression/stress test. */
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
require(path.join(ROOT,'games-number-logic.js'));
require(path.join(ROOT,'games-number-path-v2.js'));
const L=require(path.join(ROOT,'games-sumplete.js'));
const G=require(path.join(ROOT,'games-engine.js'));
function assert(ok,msg){if(!ok)throw new Error(msg);}

assert(L?.DEFINITIONS?.sumplete,'Sumplete definition missing');
assert(G.ENGINES.sumplete,'Sumplete not registered in Games engine');
assert(L.SUMPLETE?.VERSION==='1.0.0','Wrong Sumplete engine version');

function settings(difficulty,extra={}){
  return {minYear:4,maxYear:6,topics:['calculation'],selectedEngines:['sumplete'],engineSettings:{sumplete:{difficulty,...extra}}};
}
function sums(a){
  const n=a.size,rows=Array(n).fill(0),cols=Array(n).fill(0);
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(a.solutionMask[r][c]){rows[r]+=a.valueGrid[r][c];cols[c]+=a.valueGrid[r][c];}
  return {rows,cols};
}

let generated=0;
for(const difficulty of ['easy','standard','challenge']){
  for(let i=0;i<35;i++){
    const seed=`sumplete:${difficulty}:${i}`,a=G.generateActivity('sumplete',settings(difficulty),seed,[]),b=G.generateActivity('sumplete',settings(difficulty),seed,[]);generated++;
    assert(!a.error,`${difficulty} #${i}: ${a.error}`);
    assert(JSON.stringify(a)===JSON.stringify(b),`${difficulty} #${i}: nondeterministic`);
    assert(a.size===(difficulty==='easy'?4:difficulty==='challenge'?6:5),`${difficulty}: wrong auto grid size ${a.size}`);
    const valid=L.validate(a);assert(valid.ok,`${difficulty} #${i}: ${valid.error}`);
    const s=sums(a);assert(JSON.stringify(s.rows)===JSON.stringify(a.rowTargets),`${difficulty} #${i}: row targets wrong`);assert(JSON.stringify(s.cols)===JSON.stringify(a.colTargets),`${difficulty} #${i}: column targets wrong`);
    assert(L.SUMPLETE.analyseSolutions(a.valueGrid,a.rowTargets,a.colTargets,2).count===1,`${difficulty} #${i}: puzzle not unique`);
    for(let r=0;r<a.size;r++){const kept=a.solutionMask[r].filter(Boolean).length;assert(kept>0&&kept<a.size,`${difficulty} #${i}: trivial row ${r}`);}
    for(let c=0;c<a.size;c++){let kept=0;for(let r=0;r<a.size;r++)if(a.solutionMask[r][c])kept++;assert(kept>0&&kept<a.size,`${difficulty} #${i}: trivial column ${c}`);}
  }
}

for(const n of [4,5,6])for(const numberRange of ['small','balanced','larger'])for(let i=0;i<10;i++){
  const a=G.generateActivity('sumplete',settings(n===4?'easy':n===6?'challenge':'standard',{gridSize:String(n),numberRange}),`sumplete:manual:${n}:${numberRange}:${i}`,[]);generated++;
  assert(!a.error,`manual ${n}/${numberRange} #${i}: ${a.error}`);assert(a.size===n,`manual size ${n} ignored`);assert(L.validate(a).ok,`manual ${n}/${numberRange} #${i}: invalid`);
}

// Topic claims must stay honest: this first Sumplete release is whole-number arithmetic.
for(let y=1;y<=6;y++){
  const calc=new Set(G.compatibleEngines({minYear:y,maxYear:y,topics:['calculation']}));
  assert(calc.has('sumplete')===(y>=2),`Sumplete calculation applicability wrong at Y${y}`);
  const frac=new Set(G.compatibleEngines({minYear:y,maxYear:y,topics:['fractions']}));
  assert(!frac.has('sumplete'),`Sumplete must not claim Fractions before a real fraction mode exists (Y${y})`);
}

const app=fs.readFileSync(path.join(ROOT,'games-app.js'),'utf8'),pdf=fs.readFileSync(path.join(ROOT,'games-pdf.js'),'utf8');
assert(app.includes("'arithmeticcages','sumplete'"),'Sumplete missing from Arithmetic category');
assert(app.includes("a.engineId==='sumplete')return renderSumplete"),'Sumplete browser renderer not dispatched');
assert(pdf.includes("'numberpath','sumplete'"),'Sumplete missing from PDF logic dispatch list');
assert(pdf.includes("a.engineId==='sumplete')return drawSumplete"),'Sumplete PDF renderer not dispatched');

const ex=G.generateWorkedExample('sumplete',settings('easy'),'sumplete:worked',[]);
assert(ex?.goal&&ex.rules?.length>=3&&ex.steps?.length>=3&&ex.tip&&ex.commonMistake,'Sumplete worked example incomplete');
console.log(`Sumplete regression passed: ${generated} deterministic unique puzzles across automatic/manual sizes and ranges.`);
