#!/usr/bin/env node
'use strict';
const path=require('path'),ROOT=path.join(__dirname,'..');
require(path.join(ROOT,'games-arithmetic.js'));
require(path.join(ROOT,'games-number-logic.js'));
require(path.join(ROOT,'games-puzzle-pack-v140.js'));
require(path.join(ROOT,'games-puzzle-pack-v140-hashi.js'));
require(path.join(ROOT,'games-alphametics-library-v141.js'));
const G=require(path.join(ROOT,'games-engine.js'));
require(path.join(ROOT,'games-pack-mode.js'));
const NL=globalThis.TT99NumberLogicGames,LIB=globalThis.TT99AlphaLibrary;
function assert(v,m){if(!v)throw new Error(m);}
function flat(pack){return (pack.sheets||[]).flatMap(s=>s.activities||[]);}

assert(LIB&&LIB.VERSION==='1.43','v1.43 library not loaded');
assert(LIB.templates.length===120,`expected exactly 120 curated puzzles, got ${LIB.templates.length}`);

const labels=new Set(),ids=new Set(),byDifficulty={easy:[],standard:[],challenge:[]};
for(const t of LIB.templates){
 assert(!ids.has(t.id),`duplicate id ${t.id}`);ids.add(t.id);
 assert(!labels.has(t.label),`duplicate label ${t.label}`);labels.add(t.label);
 assert(Array.isArray(t.adds)&&t.adds.length>=2,'addends missing');
 assert(t.adds.concat(t.result).every(w=>/^[A-Z]{3,6}$/.test(w)),`non-curated word token in ${t.label}`);
 assert(byDifficulty[t.difficulty],`unknown difficulty in ${t.label}`);
 byDifficulty[t.difficulty].push(t);
 const sols=NL.V140.ALPHAMETICS.solve(t,t.givens||{},2);
 assert(sols.length===1,`${t.label} is not unique with stored clues (${sols.length})`);
}

for(const difficulty of ['easy','standard','challenge']){
 assert(byDifficulty[difficulty].length===40,`${difficulty} bank should contain exactly 40 puzzles`);
}

const repeated=t=>new Set(t.adds).size<t.adds.length;
const repeatedEasy=byDifficulty.easy.filter(repeated).length;
const repeatedStandard=byDifficulty.standard.filter(repeated).length;
const repeatedChallenge=byDifficulty.challenge.filter(repeated).length;
const repeatedTotal=LIB.templates.filter(repeated).length;
assert(repeatedEasy<=20,`Easy repeated-addend cap exceeded: ${repeatedEasy}/40`);
assert(repeatedStandard<=4,`Standard repeated-addend cap exceeded: ${repeatedStandard}/40`);
assert(repeatedChallenge<=2,`Challenge repeated-addend cap exceeded: ${repeatedChallenge}/40`);
assert(repeatedTotal<=24,`overall repeated-addend cap exceeded: ${repeatedTotal}/120`);

for(const difficulty of ['easy','standard','challenge'])for(const theme of ['classic','math','school','food','nature','body','family','colour']){
 const count=byDifficulty[difficulty].filter(t=>t.theme===theme).length;
 assert(count>=2,`${difficulty}/${theme} should have at least two curated choices, got ${count}`);
 const base={minYear:3,maxYear:6,topics:['calculation','algebra','number_place_value'],selectedEngines:['alphametics'],engineSettings:{alphametics:{difficulty,hintLevel:'auto',theme}}};
 const settings=G.normalizeSettings(base),a=G.generateActivity('alphametics',settings,`v143-${difficulty}-${theme}`);
 assert(!a.error,`${difficulty}/${theme}: ${a.error}`);
 assert(NL.validate(a).ok,`${difficulty}/${theme} generated invalid puzzle`);
 assert(/^[A-Z]+$/.test(a.result),'result is not a word');
}

for(const difficulty of ['easy','standard','challenge']){
 const base={
   minYear:3,maxYear:6,
   topics:['calculation','algebra','number_place_value'],
   selectedEngines:['alphametics'],
   activityCount:40,activitiesPerSheet:2,packMode:'manual',
   engineSettings:{alphametics:{difficulty,hintLevel:'auto',theme:'auto'}}
 };
 const settings=G.normalizeSettings(base),pack=G.generatePack(settings,`v143-pack-${difficulty}`);
 const activities=flat(pack);
 assert(!pack.capacityMessage,`${difficulty} 40-pack unexpectedly hit capacity: ${pack.capacityMessage}`);
 assert(activities.length===40,`${difficulty} 40-pack generated ${activities.length} activities`);
 assert(activities.every(a=>!a.error),`${difficulty} 40-pack contains an error activity`);
 const templateIds=activities.map(a=>a.templateId);
 assert(new Set(templateIds).size===40,`${difficulty} 40-pack repeated a finite Alphametics template`);
}

assert(labels.has('BASE + BALL = GAMES'),'classic BASE/BALL puzzle missing');
assert(labels.has('SEND + MORE = MONEY'),'classic SEND/MORE puzzle missing');
assert(labels.has('CROSS + ROADS = DANGER'),'classic CROSS/ROADS puzzle missing');
assert(labels.has('PLUS + SUM = EQUAL'),'maths-theme puzzle missing');
assert(labels.has('FORTY + TEN + TEN = SIXTY'),'classic three-addend puzzle missing');

console.log(`PASS v1.43: 120 curated Alphametics; 40 per difficulty; repeated addends ${repeatedTotal}/120 (easy ${repeatedEasy}, standard ${repeatedStandard}, challenge ${repeatedChallenge}); 40-puzzle packs are duplicate-free.`);
