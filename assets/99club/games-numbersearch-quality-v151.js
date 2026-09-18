/* 99 Club Studio · Number Search quality guard v1.51
 * Guarantees each listed numerical answer occupies exactly one physical path
 * in the completed digit grid when scanning all 8 directions.
 */
(function(global){
'use strict';
const A=global.TT99ArithmeticGames;
if(!A||A.__numberSearchQualityV151)return;

const baseGenerate=A.generate.bind(A);
const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
const DIGITS='0123456789';

function clone(v){return JSON.parse(JSON.stringify(v));}
function cellKey(x,y){return `${x}:${y}`;}
function canonicalPath(cells){
  const a=cells.map(([x,y])=>cellKey(x,y)).join('|');
  const b=cells.slice().reverse().map(([x,y])=>cellKey(x,y)).join('|');
  return a<b?a:b;
}
function occurrences(grid,text){
  const n=grid?.length||0,out=new Map();if(!n||!text)return out;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)for(const [dx,dy] of DIRS){
    const ex=x+dx*(text.length-1),ey=y+dy*(text.length-1);
    if(ex<0||ey<0||ex>=n||ey>=n)continue;
    const cells=[];let ok=true;
    for(let i=0;i<text.length;i++){
      const xx=x+dx*i,yy=y+dy*i;
      if(String(grid[yy][xx])!==text[i]){ok=false;break;}
      cells.push([xx,yy]);
    }
    if(ok)out.set(canonicalPath(cells),cells);
  }
  return out;
}
function targetRecords(activity){
  const map=new Map();
  for(const p of activity?.placements||[]){
    const text=String(p.answerText??p.answer??'');if(!text)continue;
    if(!map.has(text))map.set(text,{placements:[],intended:new Set()});
    const rec=map.get(text);rec.placements.push(p);rec.intended.add(canonicalPath(p.cells||[]));
  }
  return map;
}
function protectedCells(activity){const out=new Set();for(const p of activity?.placements||[])for(const [x,y] of p.cells||[])out.add(cellKey(x,y));return out;}
function audit(activity){
  const extras=[],missing=[],duplicates=[];
  for(const [text,rec] of targetRecords(activity)){
    if(rec.placements.length!==1)duplicates.push({text,count:rec.placements.length});
    const found=occurrences(activity.grid,text);
    for(const key of rec.intended)if(!found.has(key))missing.push({text,key});
    for(const [key,cells] of found)if(!rec.intended.has(key))extras.push({text,key,cells});
  }
  return {ok:extras.length===0&&missing.length===0&&duplicates.length===0,extras,missing,duplicates};
}
function repair(activity){
  if(!activity||activity.engineId!=='numbersearch'||!Array.isArray(activity.grid))return activity;
  const out=clone(activity),locked=protectedCells(out);let report=audit(out);
  if(report.ok){out.numberSearchQuality={version:'1.51',uniqueTargets:true};return out;}
  if(report.missing.length||report.duplicates.length)return null;

  for(let pass=0;pass<400&&!report.ok;pass++){
    const before=report.extras.length,candidates=[];
    for(const extra of report.extras)for(const [x,y] of extra.cells){
      const k=cellKey(x,y);if(locked.has(k)||candidates.some(c=>c[0]===x&&c[1]===y))continue;
      candidates.push([x,y]);
    }
    if(!candidates.length)return null;
    let best=null;
    for(const [x,y] of candidates){
      const old=String(out.grid[y][x]);
      for(const d of DIGITS){
        if(d===old)continue;out.grid[y][x]=d;const q=audit(out);
        if(!q.missing.length&&!q.duplicates.length&&q.extras.length<before){best={x,y,d,report:q};break;}
      }
      out.grid[y][x]=old;if(best)break;
    }
    if(!best)return null;
    out.grid[best.y][best.x]=best.d;report=best.report;
  }
  if(!report.ok)return null;
  out.accidentalMatches=0;
  out.numberSearchQuality={version:'1.51',uniqueTargets:true};
  return out;
}
function generateClean(settings,seed){
  let candidate=baseGenerate('numbersearch',settings,seed);
  for(let attempt=0;attempt<24;attempt++){
    if(candidate?.error)return candidate;
    const fixed=repair(candidate);if(fixed)return fixed;
    candidate=baseGenerate('numbersearch',settings,`${seed}:unique:${attempt+1}`);
  }
  return {engineId:'numbersearch',title:'Number Search',error:'Could not build a duplicate-free Number Search. Generate another version.'};
}
A.generate=function(id,settings,seed){return id==='numbersearch'?generateClean(settings,seed):baseGenerate(id,settings,seed);};
A.NUMBERSEARCH_QUALITY={version:'1.51',audit,repair,occurrences};
A.__numberSearchQualityV151=true;
})(typeof globalThis!=='undefined'?globalThis:this);
