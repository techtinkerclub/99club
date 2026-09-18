/* 99 Club Studio v1.29.1 Vocabulary & Language refinement regression. */
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
global.TT99GamesVocabularyV2=require(path.join(ROOT,'games-vocabulary.js'));
global.TT99ArithmeticGames=require(path.join(ROOT,'games-arithmetic.js'));
global.TT99NumberLogicGames=require(path.join(ROOT,'games-number-logic.js'));
const G=require(path.join(ROOT,'games-engine.js'));
function assert(ok,msg){if(!ok)throw new Error(msg);}
function crossingCount(a){const m=new Map();for(const e of a.entries||[])for(const [x,y] of e.cells){const k=`${x}:${y}`;m.set(k,(m.get(k)||0)+1);}return [...m.values()].filter(v=>v>1).length;}
function connected(a){const entries=a.entries||[],adj=Array.from({length:entries.length},()=>new Set()),at=new Map();entries.forEach((e,i)=>e.cells.forEach(([x,y])=>{const k=`${x}:${y}`;if(!at.has(k))at.set(k,[]);at.get(k).push(i);}));for(const ids of at.values())for(const i of ids)for(const j of ids)if(i!==j)adj[i].add(j);if(!entries.length)return true;const seen=new Set([0]),q=[0];while(q.length){const i=q.shift();for(const j of adj[i])if(!seen.has(j)){seen.add(j);q.push(j);}}return seen.size===entries.length;}
// Word-search rule text must match the actual allowed direction family.
for(const mode of ['straight','diagonal','all']){const a=G.generateWordSearch({minYear:4,maxYear:6,topics:['fractions'],engineSettings:{wordsearch:{difficulty:'standard',directionMode:mode,wordCount:'10',gridSize:'16'}}},`v1291-ws-${mode}`);assert(!a.error,`${mode}: ${a.error}`);assert(a.directionTip?.startsWith('Search directions:'),`${mode}: missing pupil direction tip`);assert(a.directionTipPdf?.startsWith('Directions:'),`${mode}: missing PDF direction tip`);if(mode==='all')assert(/backwards/i.test(a.directionTip)&&!/No backwards/i.test(a.directionTip),`${mode}: backwards rule incorrect`);else assert(/No backwards/i.test(a.directionTip),`${mode}: backwards prohibition missing`);}

// Browser crossword geometry must preserve square, touching cells. A full-height
// grid breaks Down answers by stretching row tracks independently of columns.
const css=fs.readFileSync(path.join(ROOT,'games.css'),'utf8');
assert(/v1\.29\.2[^]*?\.tt99-crossword-grid\{[^}]*width:100%!important[^}]*height:auto!important[^}]*aspect-ratio:var\(--cw\) \/ var\(--ch\)!important/.test(css),'crossword browser geometry override missing');
assert(!/v1\.29\.2[^]*?\.tt99-crossword-grid\{[^}]*height:100%!important/.test(css),'crossword browser geometry must not force full activity height');
// Crosswords must remain connected, deterministic and crossing-rich across a broad seed set.
let totalCross=0,totalEntries=0,totalArea=0;
for(let i=0;i<300;i++){const settings={minYear:4,maxYear:6,topics:['calculation'],engineSettings:{crossword:{difficulty:'challenge',gridSize:'17',wordCount:'12',wordBank:'hide'}}},a=G.generateCrossword(settings,`v1291-cw-${i}`),b=G.generateCrossword(settings,`v1291-cw-${i}`);assert(!a.error,`crossword ${i}: ${a.error}`);assert(JSON.stringify(a)===JSON.stringify(b),`crossword ${i}: nondeterministic`);assert(a.entries.length===12,`crossword ${i}: expected 12 entries`);assert(connected(a),`crossword ${i}: disconnected`);const cross=crossingCount(a);assert(cross>=a.entries.length-1,`crossword ${i}: too few crossing cells (${cross})`);totalCross+=cross;totalEntries+=a.entries.length;totalArea+=a.width*a.height;}
assert(totalCross/totalEntries>=1.10,`crossword crossing density too low: ${totalCross/totalEntries}`);
// Mixed difficulty must allocate exact counts for every visible one-player engine.
let engines=0;for(const [id,e] of Object.entries(G.ENGINES)){if(e.hiddenFromLibrary)continue;const topic=(id==='wordsearch'||id==='crossword')?'calculation':Object.keys(G.TOPICS).find(t=>['excellent','reasonable'].includes(e.compatibility?.[t])&&6>=Number(e.topicYearMin?.[t]||1)&&6<=Number(e.topicYearMax?.[t]||6));assert(topic,`${id}: no Y6 compatible topic for mixed test`);const p=G.generatePack({minYear:6,maxYear:6,topics:[topic],sheets:5,activitiesPerSheet:2,selectedEngines:[id],engineSettings:{[id]:{...(e.defaultSettings||{}),difficulty:'mixed',difficultyWeights:{easy:30,standard:50,challenge:20}}}},`v1291-mix-${id}`),acts=p.sheets.flatMap(s=>s.activities),counts=acts.reduce((o,a)=>(o[a.difficulty]=(o[a.difficulty]||0)+1,o),{});assert(!acts.some(a=>a.error),`${id}: mixed generation error`);assert(counts.easy===3&&counts.standard===5&&counts.challenge===2,`${id}: mixed allocation wrong ${JSON.stringify(counts)}`);engines++;}
console.log(`Vocabulary refinement smoke passed: 300 challenge crosswords, ${(totalCross/300).toFixed(2)} avg crossing cells, ${(totalArea/300).toFixed(2)} avg footprint, exact mixed difficulty across ${engines} visible engines.`);
