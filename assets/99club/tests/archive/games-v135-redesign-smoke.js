/* 99 Club Studio · v1.35 puzzle redesign smoke test. */
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),PAGE=path.resolve(ROOT,'../../_pages/99-club-games.md');
function assert(ok,msg){if(!ok)throw new Error(msg);}
const js=fs.readFileSync(path.join(ROOT,'games-puzzle-redesign-v135.js'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'games-puzzle-redesign-v135.css'),'utf8');
const page=fs.readFileSync(PAGE,'utf8');
for(const name of ['redesignOperation','redesignSymbols','redesignMachine','redesignBalance'])assert(js.includes(`function ${name}`),`${name} missing`);
for(const cls of ['tt99-v135-lock-card','tt99-v135-symbol-board','tt99-v135-machine-stage','tt99-v135-balance-card'])assert(js.includes(cls)&&css.includes(`.${cls}`),`${cls} JS/CSS contract missing`);
assert(js.includes('operation-to-digit')||js.includes('code key'),'Codebreaker does not derive a digit code');
assert(js.includes('Mystery value'),'Symbol Equations mystery target missing');
assert(js.includes('undo the machine steps'),'Function Machine reverse guidance missing');
assert(js.includes('Keep every scale balanced'),'Balance-scale framing missing');
assert(page.includes('games-puzzle-redesign-v135.css?v=1'),'v1.35 CSS not loaded');
assert(page.includes('games-puzzle-redesign-v135.js?v=1'),'v1.35 JS not loaded');
console.log('Games v1.35 puzzle redesign smoke: PASS');
