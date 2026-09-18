'use strict';
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
function assert(ok,msg){if(!ok)throw new Error(msg);}
const store=new Map();
global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
global.TT99GamesVocabularyV2=require(path.join(ROOT,'games-vocabulary.js'));
global.TT99ArithmeticGames=require(path.join(ROOT,'games-arithmetic.js'));
global.TT99NumberLogicGames=require(path.join(ROOT,'games-number-logic.js'));
global.TT99Games=require(path.join(ROOT,'games-engine.js'));
require(path.join(ROOT,'games-pack-mode.js'));
const G=global.TT99Games;
assert(G.VERSION==='1.9.0','wrong engine version');
assert(G.PACK_MODE?.version==='1.1.0','live pack-mode compatibility missing');
// Manual mixed: exact allocation across 20 same-type puzzles through v1.29 exact-count wrapper.
store.set(G.PACK_MODE.storageModeKey,'manual');store.set(G.PACK_MODE.storageCountKey,'20');
let pack=G.generatePack({minYear:4,maxYear:4,topics:['calculation'],selectedEngines:['crossword'],engineSettings:{crossword:{difficulty:'mixed',difficultyWeights:{easy:25,standard:50,challenge:25},gridSize:'17',wordCount:'8'}}},'v1291-manual-mixed');
let acts=pack.sheets.flatMap(s=>s.activities),counts=acts.reduce((o,a)=>(o[a.difficulty]=(o[a.difficulty]||0)+1,o),{});
assert(acts.length===20,`manual mixed expected 20, got ${acts.length}`);
assert(counts.easy===5&&counts.standard===10&&counts.challenge===5,`manual mixed allocation wrong ${JSON.stringify(counts)}`);
assert(pack.sheets.length===10,'manual 20 should use 10 two-up sheets');
// Current v1.29 UI advertises up to 40 activities; ensure engine normalization no longer truncates at 12/20.
store.set(G.PACK_MODE.storageModeKey,'random');store.set(G.PACK_MODE.storageCountKey,'40');store.set(G.PACK_MODE.storageDifficultyKey,'challenge');
pack=G.generatePack({minYear:4,maxYear:4,topics:['calculation']},'v1291-random-40');acts=pack.sheets.flatMap(s=>s.activities);
assert(acts.length===40,`random exact-count wrapper expected 40, got ${acts.length}`);
assert(pack.sheets.length===20,'40 activities should use 20 two-up sheets');
assert(acts.every(a=>a.error||a.difficulty==='challenge'), 'random challenge difficulty was not propagated consistently');
console.log('v1.29.1 pack compatibility passed: 20-puzzle exact mixed manual pack + 40-activity v1.29 random pack.');
