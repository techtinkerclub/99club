#!/usr/bin/env node
'use strict';
const path=require('path'),ROOT=path.join(__dirname,'..');
require(path.join(ROOT,'games-arithmetic.js'));
require(path.join(ROOT,'games-number-logic.js'));
require(path.join(ROOT,'games-takuzu-v139.js'));
require(path.join(ROOT,'games-takuzu-v139-logic.js'));
require(path.join(ROOT,'games-puzzle-pack-v140.js'));
require(path.join(ROOT,'games-puzzle-pack-v140-hashi.js'));
require(path.join(ROOT,'games-number-towers-v137.js'));
require(path.join(ROOT,'games-number-towers-v137-unique.js'));
require(path.join(ROOT,'games-number-path-v2.js'));
require(path.join(ROOT,'games-sumplete.js'));
const G=require(path.join(ROOT,'games-engine.js'));require(path.join(ROOT,'games-pack-mode.js'));require(path.join(ROOT,'games-instructions-v139.js'));
const NL=globalThis.TT99NumberLogicGames;function assert(v,m){if(!v)throw new Error(m);}const ids=['killersudoku','hashi','mathsmines','alphametics'];
for(const id of ids)assert(G.ENGINES[id],`${id} definition missing`);
function make(id,options,seed){const base={minYear:1,maxYear:6,topics:['number_place_value','calculation','geometry','algebra'],selectedEngines:[id],engineSettings:{[id]:{...(G.ENGINES[id].defaultSettings||{}),...options}}},s=G.normalizeSettings(base),a=G.generateActivity(id,s,seed);assert(!a.error,`${id} generation failed: ${a.error}`);const v=NL.validate(a);assert(v.ok,`${id} invalid: ${v.error}`);assert(/TT99V140/.test(a.instruction),`${id} render marker missing`);return a;}
let generated=0;
for(const difficulty of ['easy','standard','challenge'])for(let i=0;i<8;i++)for(const id of ids){const a=make(id,{difficulty},`v140-${id}-${difficulty}-${i}`);generated++;if(id==='alphametics'){const words=[...(a.addends||[]),a.result];assert(words.every(w=>/^[A-Z]+$/.test(w)),`alphametics contains non-word token`);}}
// Manual boundary variants.
for(const size of ['4','6','9']){const a=make('killersudoku',{difficulty:size==='4'?'easy':'challenge',gridSize:size,clueLevel:'balanced'},`v140-killer-manual-${size}`);assert(a.size===Number(size),`killer manual ${size} ignored`);generated++;}
for(const count of ['7','10','12']){const a=make('hashi',{difficulty:'standard',islandCount:count},`v140-hashi-manual-${count}`);assert(a.islands.length===Number(count),`hashi manual ${count} islands ignored`);generated++;}
for(const size of ['5','6','7']){const a=make('mathsmines',{difficulty:'standard',gridSize:size,gemCount:'auto'},`v140-mines-manual-${size}`);assert(a.size===Number(size),`mines manual ${size} ignored`);generated++;}
for(const t of NL.V140.ALPHAMETICS.templates){const a=make('alphametics',{difficulty:t.difficulty,template:t.id,hintLevel:'auto'},`v140-alpha-${t.id}`);assert(a.templateId===t.id,`alphametics template ${t.id} ignored`);generated++;}
const alphaLabels=NL.V140.ALPHAMETICS.templates.map(t=>t.label);assert(alphaLabels.includes('BASE + BALL = GAMES'),'BASE/BALL template missing');assert(alphaLabels.includes('CROSS + ROADS = DANGER'),'CROSS/ROADS template missing');
console.log(`PASS v1.40: ${generated} generated/validated puzzles including manual maximum variants; meaningful Alphametics templates present.`);
