#!/usr/bin/env node
'use strict';
const path=require('path'),ROOT=path.join(__dirname,'..');
require(path.join(ROOT,'games-arithmetic.js'));
require(path.join(ROOT,'games-number-logic.js'));
require(path.join(ROOT,'games-puzzle-pack-v140.js'));
require(path.join(ROOT,'games-puzzle-pack-v140-hashi.js'));
require(path.join(ROOT,'games-alphametics-library-v141.js'));
const G=require(path.join(ROOT,'games-engine.js'));
const NL=globalThis.TT99NumberLogicGames,LIB=globalThis.TT99AlphaLibrary;
function assert(v,m){if(!v)throw new Error(m);}
assert(LIB&&LIB.VERSION==='1.41','v1.41 library not loaded');
assert(LIB.templates.length>=60,`expected at least 60 curated puzzles, got ${LIB.templates.length}`);
const labels=new Set(),ids=new Set();
for(const t of LIB.templates){
 assert(!ids.has(t.id),`duplicate id ${t.id}`);ids.add(t.id);
 assert(!labels.has(t.label),`duplicate label ${t.label}`);labels.add(t.label);
 assert(Array.isArray(t.adds)&&t.adds.length>=2,'addends missing');
 assert(t.adds.concat(t.result).every(w=>/^[A-Z]{3,6}$/.test(w)),`non-curated word token in ${t.label}`);
 const sols=NL.V140.ALPHAMETICS.solve(t,t.givens||{},2);
 assert(sols.length===1,`${t.label} is not unique with stored clues (${sols.length})`);
}
for(const difficulty of ['easy','standard','challenge'])for(const theme of ['auto','classic','math','school','food','nature','body','family','colour']){
 const base={minYear:3,maxYear:6,topics:['calculation','algebra','number_place_value'],selectedEngines:['alphametics'],engineSettings:{alphametics:{difficulty,hintLevel:'auto',theme}}};
 const settings=G.normalizeSettings(base),a=G.generateActivity('alphametics',settings,`v141-${difficulty}-${theme}`);
 assert(!a.error,`${difficulty}/${theme}: ${a.error}`);
 assert(NL.validate(a).ok,`${difficulty}/${theme} generated invalid puzzle`);
 assert(/^[A-Z]+$/.test(a.result),'result is not a word');
}
assert(labels.has('BASE + BALL = GAMES'),'classic BASE/BALL puzzle missing');
assert(labels.has('CROSS + ROADS = DANGER'),'classic CROSS/ROADS puzzle missing');
assert(labels.has('PLUS + SUM = EQUAL'),'maths-theme puzzle missing');
console.log(`PASS v1.41: ${LIB.templates.length} curated Alphametics are unique; all themes/difficulties generate valid puzzles.`);
