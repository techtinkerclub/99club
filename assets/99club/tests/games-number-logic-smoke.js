/* 99 Club Studio v1.28.0 numeric-logic expansion stress/regression test. */
'use strict';
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const G=require(path.join(ROOT,'games-engine.js'));
const L=G.NUMLOGIC;
function assert(ok,msg){if(!ok)throw new Error(msg);}
const IDS=['kakuro','futoshiki','arithmeticcages','nonogram','numberpath'];
assert(L&&L.VERSION==='1.1.2','Numeric logic module missing/wrong version');
assert(JSON.stringify(Object.keys(L.DEFINITIONS))===JSON.stringify(IDS),'Numeric logic IDs changed unexpectedly');
for(const id of IDS){const e=G.ENGINES[id];assert(e&&e.defaultSettings&&Array.isArray(e.settingsSchema),`${id}: settings contract missing`);assert(e.answerSheetSupport&&e.workedExampleSupport,`${id}: output contract missing`);assert(e.needsDice===false&&e.needsPartner===false,`${id}: must remain print -> pencil -> solve`);}

const topicFor={kakuro:'calculation',futoshiki:'number_place_value',arithmeticcages:'calculation',nonogram:'number_place_value',numberpath:'number_place_value'};
let generated=0;
for(const id of IDS){
  const reps=id==='kakuro'?3:12;
  for(let year=1;year<=6;year++)for(const difficulty of ['easy','standard','challenge'])for(let i=0;i<reps;i++){
    const settings={minYear:year,maxYear:year,topics:[topicFor[id]],selectedEngines:[id],engineSettings:{[id]:{difficulty}}};
    const seed=`numlogic:${id}:${year}:${difficulty}:${i}`,a=G.generateActivity(id,settings,seed,[]),b=G.generateActivity(id,settings,seed,[]);generated++;
    assert(JSON.stringify(a)===JSON.stringify(b),`${id} Y${year} ${difficulty} #${i}: nondeterministic`);
    const valid=L.validate(a);assert(valid.ok,`${id} Y${year} ${difficulty} #${i}: ${valid.error}`);
  }
}

// Applicability: keep these as numerical puzzle choices, not generic all-topic fillers.
for(let y=1;y<=6;y++){
  const calc=new Set(G.compatibleEngines({minYear:y,maxYear:y,topics:['calculation']}));
  assert(calc.has('kakuro')===(y>=3),`Kakuro applicability wrong at Y${y}`);
  assert(calc.has('arithmeticcages')===(y>=3),`Arithmetic cages applicability wrong at Y${y}`);
  assert(calc.has('futoshiki')===(y>=2),`Futoshiki calculation applicability wrong at Y${y}`);
  assert(calc.has('numberpath')===(y>=2),`Number path calculation applicability wrong at Y${y}`);
  assert(!calc.has('nonogram'),`Nonogram should not masquerade as Calculation at Y${y}`);
  const np=new Set(G.compatibleEngines({minYear:y,maxYear:y,topics:['number_place_value']}));
  assert(np.has('numberpath'),`Number path should support number/place value at Y${y}`);
  assert(np.has('futoshiki')===(y>=2),`Futoshiki number applicability wrong at Y${y}`);
  assert(np.has('nonogram')===(y>=2),`Nonogram number applicability wrong at Y${y}`);
  assert(!np.has('kakuro'),`Kakuro should not masquerade as place value at Y${y}`);
}

// Force representative sizes / styles and uniqueness checks.
for(let i=0;i<45;i++){
  const f=G.generateActivity('futoshiki',{minYear:5,maxYear:6,topics:['number_place_value'],engineSettings:{futoshiki:{difficulty:'challenge',gridSize:String([4,5,6][i%3]),signLevel:['more','balanced','fewer'][i%3],givenLevel:'fewer'}}},`futo-deep:${i}`);assert(L.validate(f).ok,'Futoshiki deep validation failed');
  const c=G.generateActivity('arithmeticcages',{minYear:4,maxYear:6,topics:['calculation'],engineSettings:{arithmeticcages:{difficulty:'challenge',gridSize:String([4,5,6][i%3]),operations:'mixed',cageSize:['small','balanced','larger'][i%3]}}},`cage-deep:${i}`);assert(L.validate(c).ok,'Arithmetic cage deep validation failed');
  const p=G.generateActivity('numberpath',{minYear:3,maxYear:6,topics:['number_place_value'],engineSettings:{numberpath:{difficulty:'challenge',gridSize:String([4,5,6][i%3]),clueLevel:'fewer'}}},`path-deep:${i}`);assert(L.validate(p).ok,'Number path deep validation failed');
}

for(const n of [5,7,10])for(let i=0;i<24;i++){
  const a=G.generateActivity('nonogram',{minYear:4,maxYear:6,topics:['number_place_value'],engineSettings:{nonogram:{difficulty:n===10?'challenge':'standard',gridSize:String(n),pictureStyle:['symmetric','geometric','random'][i%3]}}},`nonogram-deep:${n}:${i}`);assert(L.validate(a).ok,`Nonogram ${n} deep validation failed`);
}
for(const n of [5,6,7,9])for(let i=0;i<(n===9?1:4);i++){
  const a=G.generateActivity('kakuro',{minYear:4,maxYear:6,topics:['calculation'],engineSettings:{kakuro:{difficulty:n>=7?'challenge':'standard',gridSize:String(n),givenLevel:['more','balanced','minimum'][i%3]}}},`kakuro-deep:${n}:${i}`);assert(!a.error,`Kakuro ${n}: ${a.error}`);assert(L.validate(a).ok,`Kakuro ${n} validation failed`);
}

const kakuroPerfStart=Date.now();
for(let i=0;i<4;i++){
  const a=G.generateActivity('kakuro',{minYear:6,maxYear:6,topics:['calculation'],engineSettings:{kakuro:{difficulty:'challenge',gridSize:'9',givenLevel:'minimum'}}},`kakuro-perf:${i}`);
  assert(!a.error&&L.validate(a).ok,`Kakuro performance sample ${i} failed validation`);
}
const kakuroPerfMs=Date.now()-kakuroPerfStart;
assert(kakuroPerfMs<6000,`Kakuro 9x9 generation performance regressed: ${kakuroPerfMs} ms for 4 puzzles`);

// Every new engine must have a concise child-facing worked example.
for(const id of IDS){const topic=topicFor[id],ex=G.generateWorkedExample(id,{minYear:4,maxYear:5,topics:[topic],engineSettings:{[id]:{difficulty:'standard'}}},`worked:${id}`,[]);assert(ex&&ex.goal&&ex.rules?.length>=2&&ex.steps?.length>=3&&ex.tip&&ex.commonMistake,`${id}: incomplete worked example`);}
console.log(`Numeric logic stress passed: ${generated} deterministic base activities + deep uniqueness/invariant checks across ${IDS.length} engines.`);
