#!/usr/bin/env node
'use strict';
const assert=require('assert'),path=require('path');
let numericCalls=0,arithCalls=0;
const NL={DEFINITIONS:{hashi:{id:'hashi'}},generate(id,settings,seed){numericCalls++;return {engineId:id,difficulty:settings?.engineSettings?.[id]?.difficulty||'standard',seed,year:settings?.maxYear,topics:settings?.topics};}};
const AR={generate(id,settings,seed){arithCalls++;return {engineId:id,difficulty:settings?.engineSettings?.[id]?.difficulty||'standard',seed};}};
const G={__fastPackGeneration:false,generatePack(settings,seed){const s={minYear:settings?.minYear||3,maxYear:settings?.maxYear||6,topics:settings?.topics||['calculation'],engineSettings:{demo:{difficulty:'standard'}}};return {sheets:[{activities:[NL.generate('demo',s,seed+':same'),NL.generate('demo',s,seed+':same'),AR.generate('arith',s,seed+':same'),AR.generate('arith',s,seed+':same')]}]};}};
globalThis.TT99Games=G;globalThis.TT99NumberLogicGames=NL;globalThis.TT99ArithmeticGames=AR;
require(path.join(__dirname,'..','games-performance-v142.js'));
assert.strictEqual(G.PERFORMANCE.version,'1.42.3');
assert.strictEqual(G.PERFORMANCE.largePackThreshold,8);

// Below the threshold, normal generator behaviour remains untouched.
numericCalls=arithCalls=0;G.generatePack({activityCount:4},'small');
assert.strictEqual(numericCalls,2,'small packs must retain normal numeric generation path');
assert.strictEqual(arithCalls,2,'small packs must retain normal arithmetic generation path');

// At/above the threshold, deterministic duplicate work is cached.
G.PERFORMANCE.clearCache();numericCalls=arithCalls=0;G.generatePack({activityCount:8,minYear:3,maxYear:6,topics:['calculation']},'large');
assert.strictEqual(numericCalls,1,'large packs should cache duplicate numeric generation');
assert.strictEqual(arithCalls,1,'large packs should cache duplicate arithmetic generation');

// Cache identity must include curriculum context, not only engine options + seed.
G.PERFORMANCE.clearCache();numericCalls=0;G.__fastPackGeneration=true;
const ctxA=NL.generate('demo',{minYear:3,maxYear:4,topics:['calculation'],engineSettings:{demo:{difficulty:'standard'}}},'same-seed');
const ctxB=NL.generate('demo',{minYear:5,maxYear:6,topics:['fractions'],engineSettings:{demo:{difficulty:'standard'}}},'same-seed');
G.__fastPackGeneration=false;
assert.strictEqual(numericCalls,2,'different year/topic contexts must not share a cached puzzle');
assert.notDeepStrictEqual({year:ctxA.year,topics:ctxA.topics},{year:ctxB.year,topics:ctxB.topics});

// Hashi in an auto-configured large pack may use the fast validated-template path.
G.PERFORMANCE.clearCache();numericCalls=0;let captured;
G.__fastPackGeneration=true;captured=NL.generate('hashi',{engineSettings:{hashi:{difficulty:'challenge',boardSize:'auto',islandCount:'auto'}}},'hashi-fast');G.__fastPackGeneration=false;
assert.strictEqual(numericCalls,0,'auto fast Hashi must bypass the expensive base generator');
assert.strictEqual(captured.engineId,'hashi');
assert.strictEqual(captured.islands.length,12);
assert(captured.instruction.includes('TT99V140:hashi:'),'fast Hashi must preserve the v1.40 render payload');
assert(captured.edges.some(e=>e.solution>0),'fast Hashi must include a bridge solution');

// Explicit manual Hashi dimensions/counts must never be silently replaced by a template.
G.PERFORMANCE.clearCache();numericCalls=0;G.__fastPackGeneration=true;
const manual=NL.generate('hashi',{engineSettings:{hashi:{difficulty:'challenge',boardSize:'8',islandCount:'10'}}},'hashi-manual');G.__fastPackGeneration=false;
assert.strictEqual(numericCalls,1,'manual Hashi settings that do not match the template must use the base generator');
assert.strictEqual(manual.engineId,'hashi');

// Large-pack live preview is deliberately capped before DOM parsing. Full pack data is not touched.
function page(classes='',body='x'){return `<article class="tt99-game-paper${classes?' '+classes:''}"><section>${body}</section></article>`;}
let html='<div class="tt99-games-preview-stack tt99-games-pupil-pages">';
for(let i=0;i<10;i++)html+=page('',`p${i}`);html+='</div><div class="tt99-games-preview-stack tt99-games-answer-pages">';
for(let i=0;i<10;i++)html+=page('is-answer',`a${i}`);html+='</div>';
for(let i=0;i<4;i++)html+=page('tt99-worked-page',`w${i}`);
const trimmed=G.PERFORMANCE.trimPreviewHTML(html);
assert.strictEqual((trimmed.match(/<article class="tt99-game-paper">/g)||[]).length,6,'pupil live preview must cap at six pages');
assert.strictEqual((trimmed.match(/tt99-game-paper is-answer/g)||[]).length,6,'answer live preview must cap at six pages');
assert.strictEqual((trimmed.match(/tt99-game-paper tt99-worked-page/g)||[]).length,2,'worked-example live preview must cap at two pages');
assert(trimmed.includes('Fast preview'),'large preview must explain the cap');
assert(trimmed.includes('downloaded PDF still contains the complete pack'),'preview notice must state that PDF remains complete');
assert(!trimmed.includes('p9')&&!trimmed.includes('a9')&&!trimmed.includes('w3'),'omitted preview pages must not be parsed into the live DOM');

console.log('PASS v1.42 performance: cache/context, manual Hashi preservation and preview cap contracts verified.');
