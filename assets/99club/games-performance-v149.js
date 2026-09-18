/* 99 Club Studio · v1.49 large-pack Number Towers performance overlay
 *
 * Number Towers Challenge (6x6) can spend several seconds repeatedly proving
 * uniqueness while removing edge clues. That is appropriate for one-off puzzle
 * generation, but it can block the browser main thread inside 40-activity packs.
 *
 * For large packs only, reuse a small family of solver-validated Challenge
 * templates produced by the existing generator. The normal generator remains
 * untouched for small / one-off packs and for explicit clue-density choices.
 */
(function(global){
'use strict';
const G=global.TT99Games,NL=global.TT99NumberLogicGames;
if(!G||!NL||G.__numberTowersPackFastV149)return;
G.__numberTowersPackFastV149=true;

const TEMPLATES=[
  {
    solutionGrid:[
      [6,2,1,3,4,5],
      [5,6,2,1,3,4],
      [4,5,6,2,1,3],
      [3,4,5,6,2,1],
      [1,3,4,5,6,2],
      [2,1,3,4,5,6]
    ],
    clues:{
      top:[1,2,3,2,0,0],
      right:[2,0,0,0,0,1],
      bottom:[5,5,0,3,2,1],
      left:[1,2,0,4,5,5]
    }
  },
  {
    solutionGrid:[
      [6,4,3,1,2,5],
      [4,3,1,2,5,6],
      [3,1,2,5,6,4],
      [1,2,5,6,4,3],
      [2,5,6,4,3,1],
      [5,6,4,3,1,2]
    ],
    clues:{
      top:[1,0,3,4,3,0],
      right:[2,0,2,3,4,4],
      bottom:[2,1,2,0,4,4],
      left:[1,0,0,4,0,0]
    }
  },
  {
    solutionGrid:[
      [3,1,2,4,5,6],
      [1,2,4,5,6,3],
      [2,4,5,6,3,1],
      [4,5,6,3,1,2],
      [5,6,3,1,2,4],
      [6,3,1,2,4,5]
    ],
    clues:{
      top:[4,0,0,0,2,1],
      right:[1,2,3,3,2,2],
      bottom:[1,0,3,0,2,2],
      left:[0,5,4,0,0,1]
    }
  }
];

function clone(v){return JSON.parse(JSON.stringify(v));}
function hashString(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function encodePayload(data){const s=JSON.stringify(data);if(typeof btoa==='function')return btoa(s);if(typeof Buffer!=='undefined')return Buffer.from(s,'utf8').toString('base64');return s;}

function fastNumberTowers(settings,seed){
  const raw=settings?.engineSettings?.numbertowers||{},o=NL.normalise('numbertowers',raw);
  if(o.difficulty!=='challenge')return null;
  const gridSize=String(o.gridSize??'auto'),clueLevel=String(o.clueLevel??'auto');
  if(gridSize!=='auto'&&gridSize!=='6')return null;
  // Preserve every explicit teacher choice. The prevalidated templates match the
  // normal Challenge/Auto clue density (16 visible clues out of 24).
  if(clueLevel!=='auto')return null;
  const t=clone(TEMPLATES[hashString(seed)%TEMPLATES.length]),n=6,payload={n,solution:t.solutionGrid,clues:t.clues};
  return {
    engineId:'numbertowers',
    title:'Number Towers · Skyscrapers',
    difficulty:'challenge',
    size:n,
    solutionGrid:t.solutionGrid,
    clues:t.clues,
    seed,
    options:o,
    engineVersion:'1.49-fast-pack',
    instruction:`Fill the grid with 1–${n}, using each height once in every row and column. Edge clues tell how many towers are visible from that direction. [[TT99TOWERS:${encodePayload(payload)}]]`
  };
}

const baseGenerate=NL.generate.bind(NL);
NL.generate=function(id,settings,seed){
  if(id==='numbertowers'&&G.__fastPackGeneration){
    const fast=fastNumberTowers(settings,seed);
    if(fast)return fast;
  }
  return baseGenerate(id,settings,seed);
};

G.PERFORMANCE={...(G.PERFORMANCE||{}),numberTowersFastVersion:'1.49',numberTowersFastTemplates:TEMPLATES.length};
})(typeof globalThis!=='undefined'?globalThis:this);
