#!/usr/bin/env node
'use strict';
const assert=require('assert');
const path=require('path');
const NL=require(path.join(__dirname,'..','games-number-logic.js'));
require(path.join(__dirname,'..','games-number-towers-v137.js'));
require(path.join(__dirname,'..','games-number-towers-v137-unique.js'));

assert(NL.DEFINITIONS.numbertowers,'Number Towers definition missing');
const kGrid=(NL.DEFINITIONS.kakuro.settingsSchema||[]).find(x=>x.id==='gridSize');
assert(kGrid.options.some(o=>String(o.value??o)==='8'),'Kakuro 8x8 option missing');
assert(Array.isArray(NL._KAKURO_MASKS[8])&&NL._KAKURO_MASKS[8].length===8,'Kakuro 8x8 mask missing');

for(const difficulty of ['easy','standard','challenge']){
  for(let i=0;i<4;i++){
    const settings={minYear:3,maxYear:6,engineSettings:{numbertowers:{difficulty,gridSize:'auto',clueLevel:'auto'}}};
    const a=NL.generate('numbertowers',settings,`v137:${difficulty}:${i}`);
    assert(a&&a.engineId==='numbertowers'&&!a.error,`Number Towers generation failed (${difficulty})`);
    assert.strictEqual(a.size,difficulty==='easy'?4:difficulty==='challenge'?6:5,'Unexpected auto grid size');
    assert.strictEqual(NL.validate(a).ok,true,`Invalid/ambiguous Number Towers (${difficulty}, ${i})`);
    assert(a.instruction.includes('[[TT99TOWERS:'),'Browser payload marker missing');
  }
}

for(let i=0;i<3;i++){
  const settings={minYear:5,maxYear:6,engineSettings:{kakuro:{difficulty:'challenge',gridSize:'8',givenLevel:'minimum'}}};
  const a=NL.generate('kakuro',settings,`v137:kakuro8:${i}`);
  assert(a&&!a.error,'8x8 Kakuro generation failed');
  assert.strictEqual(a.size,8,'8x8 Kakuro returned wrong size');
  assert.strictEqual(NL.validate(a).ok,true,'8x8 Kakuro invalid or non-unique');
}

const fs=require('fs');
const browser=fs.readFileSync(path.join(__dirname,'..','games-v137.js'),'utf8');
const pdf=fs.readFileSync(path.join(__dirname,'..','games-pdf-v137.js'),'utf8');
assert(browser.includes('vx*tcx+vy*tcy<0'),'Browser Arithmagon inward-vector rule missing');
assert(pdf.includes('arithInwardPoint'),'PDF Arithmagon inward placement patch missing');
assert(pdf.includes("String(lk.text||'').split('□')"),'PDF Codebreaker multi-slot rendering missing');
assert(browser.includes('tt99-v137-machine-body')&&pdf.includes('STEP ${i+1}'),'Function Machine connected-body refinements missing');
console.log('Games v1.37 batch smoke passed: Number Towers unique generation, Kakuro 8x8, Codebreaker multi-slot, Function Machine and Arithmagon patches.');
