#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),SITE=path.join(ROOT,'..','..');
function assert(v,m){if(!v)throw new Error(m);}
const js=fs.readFileSync(path.join(ROOT,'games-play-number-structures-v173.js'),'utf8');
const profile=fs.readFileSync(path.join(ROOT,'games-play-number-structures-v173-profile.js'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'games-play-number-structures-v173.css'),'utf8');
const page=fs.readFileSync(path.join(SITE,'_pages','99-club-games-play.md'),'utf8');
const library=fs.readFileSync(path.join(ROOT,'games-play-library-v4.js'),'utf8');
for(const id of ['pyramid','magic','arithmagon','magicshape']){
  assert(js.includes(`Play.registerAdapter('${id}'`),`missing Online Play adapter: ${id}`);
  assert(library.includes(`${id}:`),`game library filter does not classify ${id}`);
  assert(profile.includes(`${id}:`),`difficulty profile does not cover ${id}`);
}
for(const fn of ['mountPyramid','mountMagic','mountArith','mountMagicShape'])assert(js.includes(`function ${fn}(`),`missing mount function ${fn}`);
for(const contract of ['snapshot','restore','emptySnapshot','progress','check','hint'])assert(js.includes(contract),`adapter view contract missing ${contract}`);
assert(js.includes("generated('pyramid'"),'Number Pyramid does not reuse the existing generator');
assert(js.includes("generated('magic'"),'Magic Squares does not reuse the existing generator');
assert(js.includes("generated('arithmagon'"),'Arithmagons do not reuse the existing generator');
assert(js.includes("generated('magicshape'"),'Magic Number Shapes do not reuse the existing generator');
assert(js.includes("puzzleType==='transform'")||js.includes("type==='transform'"),'Magic Square transform interaction is missing');
assert(js.includes("type==='repair'")&&js.includes("type==='check'"),'check/repair interaction modes are missing');
assert(profile.includes("c?.difficulty==='easy'?2:c?.difficulty==='challenge'?6:4"),'Easy / Standard / Challenge year-range mapping is missing');
assert(profile.includes("c?.numberPattern==='decimal'"),'explicit decimal Magic Square profile is missing');
for(const selector of ['.tt99-pyramid-board{','.tt99-magic-grid{','.tt99-arith-stage{','.tt99-mshape-stage{'])assert(css.includes(selector),`missing layout styling for ${selector}`);
assert(css.includes('grid-template-columns:repeat(var(--n),minmax(0,1fr))')&&css.includes('grid-template-rows:repeat(var(--n),minmax(0,1fr))'),'Magic Squares must use explicit equal zero-minimum row/column tracks');
assert(page.includes('/assets/99club/games-play-number-structures-v173.css?v=1'),'Online Play page does not load v1.73 CSS');
assert(page.includes('/assets/99club/games-play-number-structures-v173.js?v=1'),'Online Play page does not load v1.73 adapters');
assert(page.includes('/assets/99club/games-play-number-structures-v173-profile.js?v=1'),'Online Play page does not load the difficulty profile');
assert(page.indexOf('games-play-number-structures-v173.js')<page.indexOf('games-play-number-structures-v173-profile.js'),'difficulty profile must load after the adapters');
assert(page.indexOf('games-play-number-structures-v173-profile.js')<page.indexOf('games-play-library-v4.js'),'new adapters/profile must load before the library filters count games');
console.log('PASS v1.73: Number Pyramid, Magic Squares, Arithmagons and Magic Number Shapes are wired into Online Play with difficulty-aware number ranges.');
