const assert=require('assert');

const base=require('../games-number-logic.js');
global.TT99NumberLogicGames=base;
const logic=require('../games-number-path-v2.js');

function settings(difficulty,gridSize='auto',clueLevel='auto',maxYear=6){
  return {maxYear,engineSettings:{numberpath:{difficulty,gridSize,clueLevel}}};
}
function positions(activity){
  const pos=Array(activity.size*activity.size+1).fill(null);
  for(let r=0;r<activity.size;r++)for(let c=0;c<activity.size;c++)pos[activity.solutionGrid[r][c]]=[r,c];
  return pos;
}
function assertPath(activity){
  const N=activity.size*activity.size,pos=positions(activity),seen=new Set(activity.solutionGrid.flat());
  assert.strictEqual(seen.size,N,'solution must contain every number once');
  for(let v=1;v<=N;v++)assert(seen.has(v),`missing ${v}`);
  for(let v=2;v<=N;v++){
    const a=pos[v-1],b=pos[v];
    assert.strictEqual(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]),1,`path break between ${v-1} and ${v}`);
  }
  assert(activity.givens.some(g=>g.v===1),'1 must be shown');
  assert(activity.givens.some(g=>g.v===N),'final number must be shown');
  assert.strictEqual(logic._countNumberPathSolutions(activity.size,activity.givens,2,activity.size>=7?600000:300000),1,'puzzle must have one solution');
  assert.deepStrictEqual(logic.validate(activity),{ok:true});
}

const expected={easy:4,standard:5,challenge:7};
for(const difficulty of Object.keys(expected)){
  const signatures=new Set();
  for(let i=0;i<12;i++){
    const a=logic.generate('numberpath',settings(difficulty),`number-path-v2-${difficulty}-${i}`);
    assert.strictEqual(a.size,expected[difficulty],`${difficulty} auto size`);
    assert.strictEqual(a.engineVersion,'2.0.0');
    assert(a.instruction.includes('Use each number exactly once'));
    assert(a.instruction.includes('Diagonals do not count'));
    assertPath(a);
    signatures.add(a.solutionGrid.flat().join(','));
    assert(a.pathMetrics.turns>=Math.max(5,a.size*2-2),'path should genuinely wind');
  }
  assert(signatures.size>=10,`${difficulty} should produce varied path structures`);
}

const schema=logic.DEFINITIONS.numberpath.settingsSchema.find(x=>x.id==='gridSize');
assert(schema.options.some(x=>String(x.value)==='7'),'7x7 manual option must exist');
const six=logic.generate('numberpath',settings('challenge','6','balanced'),`number-path-v2-manual-6`);
assert.strictEqual(six.size,6);assertPath(six);
const seven=logic.generate('numberpath',settings('standard','7','more'),`number-path-v2-manual-7`);
assert.strictEqual(seven.size,7);assertPath(seven);

console.log('Number Path v2 smoke passed: winding paths, unique clues, 4/5/6/7 grids and 7x7 Challenge.');
