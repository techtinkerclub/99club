/* 99 Club Studio v1.27.0 arithmetic games expansion stress/regression test. */
'use strict';
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const G=require(path.join(ROOT,'games-engine.js'));
const A=G.ARITH;
function assert(ok,msg){if(!ok)throw new Error(msg);}
const IDS=['arithmagon','magicshape','maze','crossnumber','numbersearch','equationcrossgrid','numbertrail','target','brokencalc','symbols','domino','operationgrid','numberwheels','functionmachine','balance'];
assert(A&&A.VERSION==='1.3.1','Arithmetic engine module missing/wrong version');
assert(JSON.stringify(Object.keys(A.DEFINITIONS))===JSON.stringify(IDS),'Arithmetic engine IDs changed unexpectedly');

// Deterministic base-generation load test: intentionally exercises every engine at every
// year/difficulty even when the UI would normally hide that engine for the selected year.
let generated=0;
for(const id of IDS){
  const e=G.ENGINES[id];
  assert(e&&e.defaultSettings&&Array.isArray(e.settingsSchema),`${id}: settings contract missing`);
  assert(e.answerSheetSupport&&e.workedExampleSupport,`${id}: output contract missing`);
  assert(e.needsDice===false&&e.needsPartner===false,`${id}: activity must remain print -> pencil -> solve`);
  const topic=id==='symbols'?'algebra':'calculation',iterations=id==='numbersearch'?20:id==='equationcrossgrid'?60:100;
  for(let year=1;year<=6;year++)for(const difficulty of ['easy','standard','challenge'])for(let i=0;i<iterations;i++){
    const settings={minYear:year,maxYear:year,topics:[topic],engineSettings:{[id]:{difficulty}}};
    const seed=`arith-stress:${id}:${year}:${difficulty}:${i}`;
    const a=G.generateActivity(id,settings,seed,[]),b=G.generateActivity(id,settings,seed,[]);
    generated++;
    assert(JSON.stringify(a)===JSON.stringify(b),`${id} Y${year} ${difficulty} #${i}: nondeterministic`);
    const valid=A.validate(a);assert(valid.ok,`${id} Y${year} ${difficulty} #${i}: ${valid.error}`);
    assert(a.engineId===id,`${id}: wrong engine id`);
  }
}

// UI applicability must be truthful: algebra-only engines must not leak into younger years,
// and calculation-only engines should not appear merely because another numerical topic is selected.
for(let year=1;year<=6;year++){
  const algebra=new Set(G.compatibleEngines({minYear:year,maxYear:year,topics:['algebra']}));
  assert(algebra.has('symbols')===(year>=6),`symbols algebra applicability wrong at Y${year}`);
  assert(algebra.has('balance')===(year>=6),`balance algebra applicability wrong at Y${year}`);
  assert(algebra.has('functionmachine')===(year>=6),`function machine algebra applicability wrong at Y${year}`);
  assert(!algebra.has('operationgrid'),`missing operations should not masquerade as Algebra at Y${year}`);
  assert(!algebra.has('brokencalc'),`broken calculator should not masquerade as Algebra at Y${year}`);
  assert(!algebra.has('numberwheels'),`number wheels should not masquerade as Algebra at Y${year}`);
}
for(const topic of ['fractions','decimals_percentages','measurement','geometry','statistics']){
  const c=new Set(G.compatibleEngines({minYear:6,maxYear:6,topics:[topic]}));
  for(const id of ['arithmagon','magicshape','target','brokencalc','operationgrid','numberwheels'])assert(!c.has(id),`${id} incorrectly claims ${topic}`);
}

// Arithmagons: every edge follows the selected operation.
for(let i=0;i<700;i++){
  const a=G.generateActivity('arithmagon',{minYear:3,maxYear:6,topics:['calculation'],engineSettings:{arithmagon:{difficulty:'challenge',shape:i%2?'triangle':'square',operation:i%3?'add':'multiply',missing:'fewer_clues'}}},`arithmagon-deep:${i}`);
  const op=a.operation==='add'?((x,y)=>x+y):((x,y)=>x*y);
  for(let j=0;j<a.corners.length;j++)assert(a.edges[j]===op(a.corners[j],a.corners[(j+1)%a.corners.length]),`arithmagon deep ${i}: edge invariant`);
}

// Magic number shapes: canonical solution really is magic; check variants are honest.
for(const shape of ['triangle','circle','star'])for(let i=0;i<400;i++){
  const a=G.generateActivity('magicshape',{minYear:4,maxYear:6,topics:['calculation'],engineSettings:{magicshape:{difficulty:'challenge',shape,puzzleType:i%3===0?'check':'missing',clueLevel:'fewer'}}},`magicshape-deep:${shape}:${i}`);
  const sums=a.lines.map(line=>line.reduce((s,j)=>s+a.solutionValues[j],0));
  assert(sums.every(x=>x===a.target),`magicshape ${shape} ${i}: unequal solution line totals`);
  if(a.puzzleType==='check'){
    assert(a.displayValues.every(x=>x!==null),`magicshape check ${shape}: complete grid required`);
    if(a.isMagic)assert(a.lineSums.every(x=>x===a.lineSums[0]),`magicshape check true but unequal`);
    else assert(a.lineSums.some(x=>x!==a.lineSums[0]),`magicshape check false but equal`);
  }
}

// Correct-answer maze: the solution is a unique orthogonal route and distractors never
// duplicate a correct answer anywhere in the grid.
for(let i=0;i<1500;i++){
  const a=G.generateActivity('maze',{minYear:2,maxYear:6,topics:['calculation'],engineSettings:{maze:{difficulty:'challenge',length:'9',gridSize:String(5+i%3)}}},`maze-deep:${i}`);
  assert(a.steps.length===9,'maze: wrong forced length');
  assert(a.path.length===11,'maze: route should be START + 9 answers + FINISH');
  const keys=new Set();
  for(let j=0;j<a.path.length;j++){
    const [x,y]=a.path[j],k=`${x}:${y}`;assert(!keys.has(k),'maze: route repeats a cell');keys.add(k);
    if(j){const [px,py]=a.path[j-1];assert(Math.abs(x-px)+Math.abs(y-py)===1,'maze: non-orthogonal step');}
    const cell=a.grid[y][x];
    if(j===0)assert(cell.kind==='start','maze: start cell wrong');
    else if(j===a.path.length-1)assert(cell.kind==='finish','maze: finish cell wrong');
    else assert(cell.kind==='answer'&&String(cell.value)===String(a.steps[j-1].answer)&&cell.step===j,`maze: wrong answer at route step ${j}`);
  }
  const answers=new Set(a.steps.map(s=>String(s.answer)));
  for(const row of a.grid)for(const cell of row)if(cell.kind==='distractor')assert(!answers.has(String(cell.value)),'maze: distractor duplicates a correct answer');
}

// Broad wrappers must consume only a topic selected by the teacher and appropriate to the year.
const broad=['maze','crossnumber','numbersearch','domino'];
const broadTopics=['number_place_value','calculation','fractions','decimals_percentages','ratio_proportion','measurement','geometry','statistics','algebra'];
let topicStress=0;
for(const id of broad)for(const topic of broadTopics)for(let year=1;year<=6;year++){
  if(!G.compatibleEngines({minYear:year,maxYear:year,topics:[topic]}).includes(id))continue;
  for(let i=0;i<80;i++){
    const a=G.generateActivity(id,{minYear:year,maxYear:year,topics:[topic],engineSettings:{[id]:{difficulty:['easy','standard','challenge'][i%3]}}},`topic-route:${id}:${topic}:${year}:${i}`,[]);topicStress++;
    const used=id==='maze'?a.steps.map(x=>x.topic):id==='crossnumber'?a.entries.map(x=>x.topic):id==='numbersearch'?a.placements.map(x=>x.topic):a.ordered.map(x=>x.topic).filter(Boolean);
    assert(used.length>0,`${id}/${topic}/Y${year}: no topic-bearing content`);
    assert(used.every(t=>t===topic),`${id}/${topic}/Y${year}: leaked topic ${[...new Set(used)].join(',')}`);
  }
}

// Crossnumbers: all clue entries are connected through crossings and digits agree with grid.
for(let i=0;i<1800;i++){
  const a=G.generateActivity('crossnumber',{minYear:3,maxYear:6,topics:['calculation'],engineSettings:{crossnumber:{difficulty:'challenge',clueCount:'12',gridSize:'15'}}},`crossnumber-deep:${i}`);
  assert(!a.error,`crossnumber ${i}: ${a.error}`);assert(a.entries.length>=5,`crossnumber ${i}: too few entries`);
  const cellMap=new Map();
  a.entries.forEach((e,ei)=>e.cells.forEach(([x,y],j)=>{assert(a.grid[y][x]===String(e.answer)[j],`crossnumber ${i}: cell mismatch`);const k=`${x}:${y}`;if(!cellMap.has(k))cellMap.set(k,[]);cellMap.get(k).push(ei);}));
  const graph=Array.from({length:a.entries.length},()=>new Set());
  for(const ids of cellMap.values())if(ids.length>1)for(const u of ids)for(const v of ids)if(u!==v)graph[u].add(v);
  const seen=new Set([0]),stack=[0];while(stack.length){const u=stack.pop();for(const v of graph[u])if(!seen.has(v)){seen.add(v);stack.push(v);}}
  assert(seen.size===a.entries.length,`crossnumber ${i}: disconnected entry island`);
}

for(let i=0;i<700;i++){
  const a=G.generateActivity('numbertrail',{minYear:2,maxYear:6,topics:['calculation'],engineSettings:{numbertrail:{difficulty:'challenge',length:'20',ruleMode:i%2?'constant':'alternating',clueLevel:'fewer'}}},`trail-deep:${i}`);
  assert(a.values.length===20,'number trail wrong forced length');assert(a.displayValues[0]!==null&&a.displayValues.at(-1)!==null,'number trail should keep endpoints visible');
}

// Target-number and broken-calculator challenges must carry valid solutions. Broken-calculator
// targets must not simply be typeable using the surviving digit keys.
for(let i=0;i<1400;i++){
  const a=G.generateActivity('target',{minYear:4,maxYear:6,topics:['calculation'],engineSettings:{target:{difficulty:'challenge'}}},`target-deep:${i}`);
  for(const c of a.challenges){assert(Number.isFinite(Number(c.target))&&c.target>0,'target: bad target');assert(c.solution&&String(c.solution).length>0,'target: missing worked solution');}
  const b=G.generateActivity('brokencalc',{minYear:4,maxYear:6,topics:['calculation'],engineSettings:{brokencalc:{difficulty:'challenge'}}},`brokencalc-deep:${i}`);
  const digits=new Set(b.keys.filter(k=>/^\d$/.test(k)));
  for(const c of b.targets){assert(c.solution&&String(c.solution).length>0,'broken calculator: missing solution');assert(!String(c.target).split('').every(d=>digits.has(d)),`broken calculator: target ${c.target} is directly typeable`);}
}

for(let i=0;i<700;i++){
  const a=G.generateActivity('symbols',{minYear:6,maxYear:6,topics:['algebra'],engineSettings:{symbols:{difficulty:'challenge',symbolCount:'3',equationStyle:'coefficients'}}},`symbols-deep:${i}`);
  assert(a.names.length===3&&a.values.length===3,'symbols: expected 3 unknowns');
}

for(let i=0;i<800;i++){
  const a=G.generateActivity('domino',{minYear:3,maxYear:6,topics:['calculation'],engineSettings:{domino:{difficulty:'challenge',dominoCount:'10'}}},`domino-deep:${i}`);
  assert(!a.error,'domino error');assert(a.ordered[0].left==='START'&&a.ordered.at(-1).right==='END','domino endpoints');assert(a.dominoes.length===a.ordered.length,'domino shuffle lost card');
  for(const d of a.ordered)if(d.rightAnswer!=null)assert(Math.abs(Number(d.rightAnswer))<=5000,'domino answer too large');
}

for(let i=0;i<900;i++){
  const settings={minYear:4,maxYear:6,topics:['calculation'],engineSettings:{operationgrid:{difficulty:'challenge',rowCount:'8',operations:'four'}}};
  const a=G.generateActivity('operationgrid',settings,`ops-deep:${i}`);assert(a.rows.length===8,'operation grid row count');
  const pool=['+','-','×','÷'];
  for(const r of a.rows){assert(r.ops.every(op=>pool.includes(op)),'operation grid illegal op');assert(A._operationSolutions(r,pool).length===1,`operation grid has ${A._operationSolutions(r,pool).length} legal answers: ${r.text}`);}
}

for(let i=0;i<900;i++){
  const style=['wheel','factor','diamond'][i%3],a=G.generateActivity('numberwheels',{minYear:3,maxYear:6,topics:['calculation'],engineSettings:{numberwheels:{difficulty:'challenge',style,itemCount:'4'}}},`wheels-deep:${i}`);assert(a.items.length===4,'number wheels item count');
  for(const it of a.items){
    if(style==='wheel')for(let j=0;j<it.inputs.length;j++){const spec=it.ruleSpec||{},expected=spec.type==='add'?it.inputs[j]+spec.a:spec.type==='multiply'?it.inputs[j]*spec.a:spec.type==='multiply_add'?it.inputs[j]*spec.a+spec.b:NaN;assert(it.outputs[j]===expected,'number wheel relation wrong');}
    if(style==='factor')for(const [u,v] of it.pairs)assert(u*v===it.centre,'factor flower pair wrong');
    if(style==='diamond'){assert(it.top===it.left*it.right,'diamond product wrong');assert(it.bottom===it.left+it.right,'diamond sum wrong');assert(Array.isArray(it.hidden)&&it.hidden.length>=1&&it.hidden.every(k=>['top','bottom','left','right'].includes(k)),'diamond hidden-cell metadata invalid');}
  }
}

for(let i=0;i<800;i++){
  const a=G.generateActivity('functionmachine',{minYear:6,maxYear:6,topics:['algebra'],engineSettings:{functionmachine:{difficulty:'challenge',stages:'3',rowCount:'6',direction:'mixed'}}},`machine-deep:${i}`);assert(a.operations.length===3,'function machine stages');assert(a.rows.length===6,'function machine rows unexpectedly sparse');
  for(let j=1;j<a.operations.length;j++)assert(!(a.operations[j].op===a.operations[j-1].op&&a.operations[j].value===a.operations[j-1].value),'function machine repeats identical adjacent stage');
}
for(let i=0;i<700;i++){
  const a=G.generateActivity('balance',{minYear:2,maxYear:6,topics:['calculation'],engineSettings:{balance:{difficulty:'challenge',rowCount:'8',style:'mixed'}}},`balance-deep:${i}`);assert(a.rows.length===8,'balance row count');for(const r of a.rows)assert(Number.isFinite(Number(r.answer)),'balance missing answer');
}

// Every new engine has a genuinely child-facing worked-example contract.
for(const id of IDS){const topic=id==='symbols'?'algebra':'calculation',year=id==='symbols'?6:4,ex=G.generateWorkedExample(id,{minYear:year,maxYear:year,topics:[topic],engineSettings:{[id]:{difficulty:'standard'}}},`worked:${id}`,[]);assert(ex&&ex.goal&&Array.isArray(ex.rules)&&ex.rules.length>=2&&Array.isArray(ex.steps)&&ex.steps.length>=3&&ex.tip&&ex.commonMistake,`${id}: incomplete worked example`);}

console.log(`Arithmetic expansion stress passed: ${generated} deterministic base activities + ${topicStress} topic-routing activities + deep invariant checks across all ${IDS.length} new engines.`);
