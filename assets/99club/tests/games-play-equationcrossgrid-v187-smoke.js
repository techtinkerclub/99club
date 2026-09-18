'use strict';
const assert=require('assert');
require('../games-arithmetic.js');
require('../games-crossgrid-v1321.js');
const A=globalThis.TT99ArithmeticGames;
assert(A&&A.CROSSGRID_USABILITY,'Crossgrid usability patch did not load');

function check(difficulty,size,seed){
  const settings={minYear:2,maxYear:6,topics:['calculation','algebra'],engineSettings:{equationcrossgrid:{difficulty,gridSize:String(size),operationFamily:difficulty==='challenge'?'mixed':'auto',missingLevel:'balanced'}}};
  const p=A.generate('equationcrossgrid',settings,seed);
  assert(p&&!p.error,`${difficulty} ${size}x${size} failed: ${p?.error||'missing puzzle'}`);
  assert.strictEqual(p.size,size,'reported active size mismatch');
  assert.strictEqual(p.solutionGrid.length,size,'row count mismatch');
  assert(p.solutionGrid.every(row=>row.length===size),'column count mismatch');
  assert(A.validate(p)?.ok,'generated Crossgrid failed maths validation');
  const active=v=>v!=='#';
  assert(p.solutionGrid[0].some(active),'empty blocked top border');
  assert(p.solutionGrid[size-1].some(active),'empty blocked bottom border');
  assert(p.solutionGrid.some(row=>active(row[0])),'empty blocked left border');
  assert(p.solutionGrid.some(row=>active(row[size-1])),'empty blocked right border');
}

for(const [difficulty,size] of [['easy',5],['standard',7],['challenge',9]]){
  for(let i=0;i<4;i++)check(difficulty,size,`v187-${difficulty}-${i}`);
}
console.log('Equation Crossgrid v1.87 active-grid smoke tests passed.');
