'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=path.resolve(__dirname,'../../..');
const A=require(path.join(root,'assets/99club/games-arithmetic.js'));

function valid(id,config,seed,maxYear=6){
  const p=A.generate(id,{minYear:1,maxYear,topics:['number_place_value','calculation','algebra'],engineSettings:{[id]:config}},seed);
  assert(p&&!p.error,`${id} failed to generate: ${p?.error||'missing puzzle'}`);
  const v=A.validate(p);assert(v?.ok,`${id} validation failed: ${v?.error||'unknown'}`);return p;
}

for(const difficulty of ['easy','standard','challenge']){
  valid('numbertrail',{difficulty,length:'auto',ruleMode:'auto',clueLevel:'balanced'},`trail-${difficulty}`);
  valid('numbersearch',{difficulty,questionCount:'auto',gridSize:'auto',directionMode:'auto'},`search-${difficulty}`);
  valid('equationcrossgrid',{difficulty,gridSize:'auto',operationFamily:'auto',missingLevel:'auto'},`cross-${difficulty}`);
}
for(const style of ['wheel','factor','diamond'])valid('numberwheels',{difficulty:'standard',style,itemCount:'3'},`connections-${style}`);
valid('numbertrail',{difficulty:'challenge',length:'25',ruleMode:'alternating',clueLevel:'fewer'},'trail-max');
valid('numbersearch',{difficulty:'challenge',questionCount:'12',gridSize:'15',directionMode:'all'},'search-max');
valid('equationcrossgrid',{difficulty:'challenge',gridSize:'10',operationFamily:'mixed',missingLevel:'fewer_clues'},'cross-max');
valid('numberwheels',{difficulty:'challenge',style:'factor',itemCount:'6'},'connections-max');

const registrations=[];
global.TT99ArithmeticGames=A;
global.TT99GamesPlay={registerAdapter:(id,obj)=>registrations.push([id,obj])};
require(path.join(root,'assets/99club/games-play-arithmetic-wave-v184.js'));
const ids=registrations.map(x=>x[0]);
for(const id of ['numbertrail','numberwheels','numbersearch','equationcrossgrid'])assert(ids.includes(id),`${id} adapter not registered`);
for(const [id,a] of registrations){
  assert.equal(typeof a.createPuzzle,'function',`${id} missing createPuzzle`);
  assert.equal(typeof a.mount,'function',`${id} missing mount`);
  assert.equal(typeof a.fromQuery,'function',`${id} missing fromQuery`);
  assert.equal(typeof a.toQuery,'function',`${id} missing toQuery`);
  const cfg=a.normalizeConfig({difficulty:'standard'});const p=a.createPuzzle(cfg,`adapter-${id}`);assert(A.validate(p)?.ok,`${id} adapter created invalid puzzle`);
}

const css=fs.readFileSync(path.join(root,'assets/99club/games-play-arithmetic-wave-v184.css'),'utf8');
assert(css.includes('grid-template-columns:repeat(var(--n),minmax(0,1fr))'),'Number Search equal columns guard missing');
assert(css.includes('grid-template-rows:repeat(var(--n),minmax(0,1fr))'),'Number Search equal rows guard missing');
assert(css.includes('grid-template-columns:repeat(var(--cross-n),minmax(0,1fr))'),'Crossgrid equal columns guard missing');
assert(css.includes('grid-template-rows:repeat(var(--cross-n),minmax(0,1fr))'),'Crossgrid equal rows guard missing');
assert(css.includes('aspect-ratio:1'),'square board guard missing');
assert(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))'),'shared 4-column keypad guard missing');
assert(!css.includes('96vw'),'viewport-width board sizing must not be used');

const page=fs.readFileSync(path.join(root,'_pages/99-club-games-play.md'),'utf8');
assert(page.includes('games-play-arithmetic-wave-v184.css?v=1'),'wave CSS not loaded');
assert(page.includes('games-play-arithmetic-wave-v184.js?v=1'),'wave JS not loaded');
assert(page.indexOf('games-play-arithmetic-wave-v184.js')<page.indexOf('games-play-library-v4.js'),'wave adapters must load before library');

const codec=fs.readFileSync(path.join(root,'assets/99club/games-play-share-codec-v156.js'),'utf8');
for(const pair of ["numbertrail:'r'","numberwheels:'s'","numbersearch:'t'","equationcrossgrid:'u'"])assert(codec.includes(pair),`compact share code missing: ${pair}`);
const library=fs.readFileSync(path.join(root,'assets/99club/games-play-library-v4.js'),'utf8');
for(const id of ['numbertrail','numberwheels','numbersearch','equationcrossgrid'])assert(library.includes(`${id}:`),`${id} library filter mapping missing`);

console.log('v1.84 arithmetic Online Play smoke checks passed');
