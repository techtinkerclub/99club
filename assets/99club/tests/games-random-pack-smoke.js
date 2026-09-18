'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

function rngFromSeed(seed){let h=2166136261>>>0;for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}let a=h||0x6d2b79f5;return()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const ENGINES={a:{id:'a',defaultSettings:{difficulty:'standard'},difficultyOptions:['easy','standard','challenge']},b:{id:'b',defaultSettings:{difficulty:'standard'},difficultyOptions:['easy','standard','challenge']},c:{id:'c',defaultSettings:{difficulty:'standard'},difficultyOptions:['easy','standard','challenge']},d:{id:'d',defaultSettings:{difficulty:'standard'},difficultyOptions:['easy','standard','challenge']}};
const base={
  ENGINES,rngFromSeed,
  normalizeSettings(s={}){const engineSettings={};for(const id of Object.keys(ENGINES))engineSettings[id]={...ENGINES[id].defaultSettings,...(s.engineSettings?.[id]||{})};return{minYear:1,maxYear:6,topics:['calculation'],sheets:Number(s.sheets)||1,activitiesPerSheet:Number(s.activitiesPerSheet)||1,selectedEngines:Array.isArray(s.selectedEngines)?s.selectedEngines:['a','b'],workedExamples:s.workedExamples==='front'?'front':'none',engineSettings};},
  compatibleEngines(){return['a','b','c','d'];},
  selectedCompatibleEngines(s){return (s.selectedEngines||[]).filter(id=>ENGINES[id]);},
  generateWorkedExample(id,s){return{engineId:id,title:`${id} example`,difficulty:s.engineSettings?.[id]?.difficulty||'standard'};},
  generateActivity(id,s,seed){return{engineId:id,difficulty:s.engineSettings?.[id]?.difficulty||'standard',seed};},
  generatePack(s,seed){const sel=s.selectedEngines||[];let k=0;const sheets=[];for(let i=0;i<s.sheets;i++){const activities=[];for(let j=0;j<s.activitiesPerSheet;j++,k++){const id=sel[k<sel.length?k:k%sel.length];activities.push({engineId:id,difficulty:s.engineSettings?.[id]?.difficulty||'standard'});}sheets.push({index:i+1,activities});}return{seed,settings:s,sheets,workedExamples:[]};}
};
const context={globalThis:{TT99Games:base},console};context.globalThis.globalThis=context.globalThis;vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../games-pack-mode.js','utf8'),context);
const G=context.globalThis.TT99Games;

let p=G.generateRandomPack({activityCount:5,workedExamples:'front',randomDifficulty:'challenge'},'seed');
assert.strictEqual(p.sheets.length,3);
assert.strictEqual(JSON.stringify(p.sheets.map(s=>s.activities.length)),JSON.stringify([2,2,1]));
assert.strictEqual(p.activityCount,5);
assert.strictEqual(new Set(p.sheets.flatMap(s=>s.activities.map(a=>a.engineId))).size,4);
assert.strictEqual(p.workedExamples.length,4);
assert.strictEqual(p.randomDifficulty,'challenge');
assert(p.sheets.flatMap(s=>s.activities).every(a=>a.difficulty==='challenge'),'fixed random difficulty must apply to every activity');
assert(p.workedExamples.every(ex=>ex.difficulty==='challenge'),'worked examples must use the random-pack difficulty');

let mixed=G.generateRandomPack({activityCount:8,randomDifficulty:'mixed',randomDifficultyWeights:{easy:25,standard:50,challenge:25}},'mixed-seed');
const mixedDiffs=mixed.sheets.flatMap(s=>s.activities.map(a=>a.difficulty));
const counts=Object.fromEntries(['easy','standard','challenge'].map(d=>[d,mixedDiffs.filter(x=>x===d).length]));
assert.deepStrictEqual(counts,{easy:2,standard:4,challenge:2},'8-item balanced mix must allocate exact 2/4/2 quota');
assert.strictEqual(JSON.stringify(mixed.randomDifficultyWeights),JSON.stringify({easy:25,standard:50,challenge:25}));
assert.strictEqual(mixed.randomDifficultyPlan.length,8);

let six=G.generateRandomPack({activityCount:6,randomDifficulty:'mixed',randomDifficultyWeights:{easy:20,standard:50,challenge:30}},'six-seed');
const sixDiffs=six.sheets.flatMap(s=>s.activities.map(a=>a.difficulty));
const sixCounts=Object.fromEntries(['easy','standard','challenge'].map(d=>[d,sixDiffs.filter(x=>x===d).length]));
assert.deepStrictEqual(sixCounts,{easy:1,standard:3,challenge:2},'6-item 20/50/30 mix must use largest-remainder quota 1/3/2');

let norm=G.generateRandomPack({activityCount:10,randomDifficulty:'mixed',randomDifficultyWeights:{easy:1,standard:2,challenge:1}},'norm-seed');
assert.strictEqual(JSON.stringify(norm.randomDifficultyWeights),JSON.stringify({easy:25,standard:50,challenge:25}),'relative weights must normalise to percentages');

let q=G.generateRandomPack({activityCount:7,randomDifficulty:'mixed',randomDifficultyWeights:{easy:25,standard:50,challenge:25}},'same-seed');
let r=G.generateRandomPack({activityCount:7,randomDifficulty:'mixed',randomDifficultyWeights:{easy:25,standard:50,challenge:25}},'same-seed');
assert.strictEqual(JSON.stringify(q.sheets),JSON.stringify(r.sheets),'mixed allocation must remain deterministic for a seed');

let m=G.generatePack({activityCount:3,packMode:'manual',selectedEngines:['a','b'],engineSettings:{a:{difficulty:'easy'},b:{difficulty:'challenge'}}},'manual');
assert.strictEqual(JSON.stringify(m.sheets.map(s=>s.activities.length)),JSON.stringify([2,1]));
assert(m.sheets.flatMap(s=>s.activities).every(a=>['a','b'].includes(a.engineId)));
assert.strictEqual(m.sheets[0].activities[0].difficulty,'easy');
assert.strictEqual(m.sheets[0].activities[1].difficulty,'challenge');
assert.strictEqual(G.PACK_MODE.version,'1.2.0');
assert(G.PACK_MODE.difficulties.includes('mixed'));

const ui=fs.readFileSync(__dirname+'/../games-random-ui.js','utf8');
assert(ui.includes('<option value="mixed"'),'Random UI must expose Mixed difficulty');
assert(ui.includes('data-random-mix-preset="25:50:25"'),'Random UI must expose Balanced preset');
assert(ui.includes('data-random-mix-preset="50:40:10"'),'Random UI must expose Gentle preset');
assert(ui.includes('data-random-mix-preset="15:70:15"'),'Random UI must expose Mostly standard preset');
assert(ui.includes('data-random-mix-preset="10:40:50"'),'Random UI must expose Challenge-heavy preset');
assert(ui.includes('Standard is the remaining percentage'),'Random UI must explain derived Standard weight');
console.log('Games random-pack mixed-difficulty smoke: PASS');
