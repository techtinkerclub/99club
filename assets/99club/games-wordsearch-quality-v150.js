/* 99 Club Studio · Word Search quality guard v1.50
 * Ensures every listed target word has exactly one physical occurrence in the
 * finished grid, regardless of allowed search direction. Shared by printable
 * Games and Online Play.
 */
(function(global){
'use strict';
const G=global.TT99Games;
if(!G||G.__wordSearchQualityV150)return;

const baseWordSearch=G.generateWordSearch.bind(G);
const baseReplace=G.replaceWordSearchEntry.bind(G);
const baseActivity=G.generateActivity.bind(G);
const basePack=G.generatePack.bind(G);
const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
const LETTERS='ETAOINSHRDLUCMFPGWYBVKXJQZ';

function clone(v){return G.clone?G.clone(v):JSON.parse(JSON.stringify(v));}
function normaliseWord(v){return G.normalizeTerm?G.normalizeTerm(v):String(v||'').toUpperCase().replace(/[^A-Z]/g,'');}
function cellKey(x,y){return `${x}:${y}`;}
function pathKey(cells){const a=cells.map(([x,y])=>cellKey(x,y)).join('|'),b=cells.slice().reverse().map(([x,y])=>cellKey(x,y)).join('|');return a<b?a:b;}

function targetMap(activity){
  const map=new Map();
  for(const p of activity?.placements||[]){
    const word=normaliseWord(p.term);if(!word)continue;
    if(!map.has(word))map.set(word,{placements:[],intended:new Set()});
    const rec=map.get(word);rec.placements.push(p);rec.intended.add(pathKey(p.cells||[]));
  }
  return map;
}
function protectedCells(activity){const out=new Set();for(const p of activity?.placements||[])for(const [x,y] of p.cells||[])out.add(cellKey(x,y));return out;}
function occurrences(grid,word){
  const h=grid?.length||0,w=h?(grid[0]?.length||0):0,out=new Map();if(!h||!w||!word)return out;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(const [dx,dy] of DIRS){
    const ex=x+dx*(word.length-1),ey=y+dy*(word.length-1);if(ex<0||ex>=w||ey<0||ey>=h)continue;
    const cells=[];let ok=true;
    for(let i=0;i<word.length;i++){const xx=x+dx*i,yy=y+dy*i;if(String(grid[yy][xx]||'').toUpperCase()!==word[i]){ok=false;break;}cells.push([xx,yy]);}
    if(ok)out.set(pathKey(cells),cells);
  }
  return out;
}
function audit(activity){
  const targets=targetMap(activity),extras=[],missing=[],duplicates=[];
  for(const [word,rec] of targets){
    if(rec.placements.length!==1)duplicates.push({word,count:rec.placements.length});
    const found=occurrences(activity.grid,word);
    for(const key of rec.intended)if(!found.has(key))missing.push({word,key});
    for(const [key,cells] of found)if(!rec.intended.has(key))extras.push({word,key,cells});
  }
  return {ok:extras.length===0&&missing.length===0&&duplicates.length===0,extras,missing,duplicates};
}
function repair(activity){
  if(!activity||activity.engineId!=='wordsearch'||!Array.isArray(activity.grid))return activity;
  const out=clone(activity),protectedSet=protectedCells(out);let report=audit(out);
  if(report.ok)return out;
  if(report.missing.length||report.duplicates.length)return null;

  for(let pass=0;pass<300&&!report.ok;pass++){
    const before=report.extras.length;let best=null;
    const candidateCells=[];
    for(const extra of report.extras)for(const [x,y] of extra.cells)if(!protectedSet.has(cellKey(x,y))&&!candidateCells.some(c=>c[0]===x&&c[1]===y))candidateCells.push([x,y]);
    if(!candidateCells.length)return null;

    for(const [x,y] of candidateCells){
      const old=out.grid[y][x];
      for(const letter of LETTERS){
        if(letter===old)continue;out.grid[y][x]=letter;const q=audit(out);
        if(!q.missing.length&&!q.duplicates.length&&q.extras.length<before){best={x,y,letter,report:q};break;}
      }
      out.grid[y][x]=old;if(best)break;
    }
    if(!best)return null;
    out.grid[best.y][best.x]=best.letter;report=best.report;
  }
  if(!report.ok)return null;
  out.wordSearchQuality={version:'1.50',uniqueTargets:true};
  return out;
}
function settingsForActivity(settings,activity){
  const s=G.normalizeSettings(settings||{}),engineSettings={...(s.engineSettings||{})};
  engineSettings.wordsearch={...(engineSettings.wordsearch||{}),...(activity?.options||{})};
  return {...s,engineSettings};
}
function cleanOrRegenerate(activity,settings,seed,customVocabulary=[]){
  let candidate=activity;
  for(let attempt=0;attempt<24;attempt++){
    const fixed=repair(candidate);if(fixed)return fixed;
    const retrySettings=settingsForActivity(settings,candidate);
    candidate=baseWordSearch(retrySettings,`${seed}:unique:${attempt+1}`,customVocabulary);
    if(!candidate||candidate.error)continue;
  }
  return {engineId:'wordsearch',title:'Maths Word Search',error:'A duplicate-free word-search grid could not be built. Generate another version.'};
}

G.generateWordSearch=function(settings,seed,customVocabulary=[]){
  const a=baseWordSearch(settings,seed,customVocabulary);return cleanOrRegenerate(a,settings,seed,customVocabulary);
};
G.replaceWordSearchEntry=function(activity,index,settings,seed,customVocabulary=[]){
  let candidate=baseReplace(activity,index,settings,seed,customVocabulary);
  for(let attempt=0;attempt<16;attempt++){
    const fixed=repair(candidate);if(fixed)return fixed;
    candidate=baseReplace(activity,index,settings,`${seed}:unique:${attempt+1}`,customVocabulary);
  }
  return cleanOrRegenerate(candidate,settings,seed,customVocabulary);
};
G.generateActivity=function(engineId,settings,seed,customVocabulary=[]){
  const a=baseActivity(engineId,settings,seed,customVocabulary);
  return engineId==='wordsearch'?cleanOrRegenerate(a,settings,seed,customVocabulary):a;
};
G.generatePack=function(settings,seed='games',customVocabulary=[]){
  const pack=basePack(settings,seed,customVocabulary);
  for(const sheet of pack?.sheets||[])for(let i=0;i<(sheet.activities||[]).length;i++){
    const a=sheet.activities[i];if(a?.engineId==='wordsearch')sheet.activities[i]=cleanOrRegenerate(a,settings,a.seed||`${seed}:wordsearch:${sheet.index}:${i}`,customVocabulary);
  }
  return pack;
};
G.WORDSEARCH_QUALITY={version:'1.50',audit,repair};
G.__wordSearchQualityV150=true;
})(typeof globalThis!=='undefined'?globalThis:this);
