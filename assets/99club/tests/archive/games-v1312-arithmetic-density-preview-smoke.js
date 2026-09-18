/* 99 Club Studio v1.31.2 Arithmetic density + preview containment regression. */
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),REPO=path.resolve(ROOT,'../..');
const G=require(path.join(ROOT,'games-engine.js')),A=G.ARITH;
function assert(ok,msg){if(!ok)throw new Error(msg);}

// Crossnumbers should be crossword-like, not single-crossing ladders, and Challenge should use 3/4-digit answers.
for(let i=0;i<24;i++){
  const a=G.generateActivity('crossnumber',{minYear:6,maxYear:6,topics:['calculation','algebra'],engineSettings:{crossnumber:{difficulty:'challenge',clueStyle:'mixed',clueCount:'20',gridSize:'17'}}},`1312-cross-${i}`);
  assert(!a.error,`crossnumber failed: ${a.error}`);
  assert(a.entries.length===20,'crossnumber failed to place all requested clues');
  assert(a.entries.every(e=>String(e.answer).length>=3),'Challenge crossnumber contains a short 1/2-digit answer');
  assert(a.layoutStats&&a.layoutStats.crossings>=19,'crossnumber does not contain enough multiple crossings');
  assert(a.layoutStats.branches>=5,'crossnumber topology is still ladder-like');
  assert(a.layoutStats.aspect<=2,'crossnumber bounding box is still excessively ladder-shaped');
  assert(A.validate(a).ok,'crossnumber validation failed');
}

// 10x10 Challenge Crossgrids should actually use the larger board rather than leaving most cells black.
for(let i=0;i<28;i++){
  const a=G.generateActivity('equationcrossgrid',{minYear:6,maxYear:6,topics:['calculation'],engineSettings:{equationcrossgrid:{difficulty:'challenge',gridSize:'10',operationFamily:'mixed',missingLevel:'fewer_clues'}}},`1312-crossgrid-${i}`);
  assert(!a.error,`10x10 crossgrid failed: ${a.error}`);
  assert(a.lines.length>=16,'10x10 crossgrid has too few interlocking equations');
  assert(a.occupancy>=.55,'10x10 crossgrid leaves too much of the board unused');
  for(const op of ['+','-','×','÷'])assert(a.operationsUsed.includes(op),`10x10 crossgrid missing ${op}`);
  assert(A.validate(a).ok,'dense 10x10 crossgrid validation failed');
}

const app=fs.readFileSync(path.join(ROOT,'games-app.js'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'games.css'),'utf8');
const page=fs.readFileSync(path.join(REPO,'_pages','99-club-games.md'),'utf8');
assert(app.includes("ratio<.78?'is-tall'"),'Crossnumber preview shape hook missing');
assert(css.includes('.tt99-crossnumber .tt99-crossword-grid.is-tall'),'Crossnumber tall-grid containment CSS missing');
assert(css.includes('width:min(100%,520px)!important'),'Kakuro preview was not enlarged');
assert(css.includes('.tt99-cage-grid .cage-cell.top{border-top:2.4px solid #4f696f!important}'),'Arithmetic Cage wall priority fix missing');
assert(/games\.css\?v=20/.test(page)&&/games-arithmetic\.js\?v=6/.test(page)&&/games-app\.js\?v=19/.test(page),'v1.31.2 cache versions missing');
console.log('v1.31.2 Arithmetic density + preview regression passed.');
