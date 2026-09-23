/* v1.37 Number Towers fast unique-puzzle acceptance layer.
 * Builds a small deterministic family of Latin grids, chooses one whose complete
 * visibility signature is unique, then removes only a limited number of clues
 * while rechecking uniqueness. This keeps generation fast enough for classroom use.
 */
(function(global){
  'use strict';
  let NL=global.TT99NumberLogicGames||null;
  if(!NL&&typeof require==='function'){try{NL=require('./games-number-towers-v137.js');}catch(e){}}
  if(!NL||NL.__v137UniqueAcceptance)return;
  NL.__v137UniqueAcceptance=true;
  const base=NL.generate.bind(NL);

  function hashString(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function rngFromSeed(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function cyclic(n,offset=0){return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>((r+c+offset)%n)+1));}
  function rotate(g){const n=g.length;return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>g[n-1-c][r]));}
  function reflect(g){return g.map(row=>row.slice().reverse());}
  function transpose(g){const n=g.length;return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>g[c][r]));}
  function complement(g){const n=g.length;return g.map(row=>row.map(v=>n+1-v));}
  function permuteSymbols(g,rng){const n=g.length,p=shuffle(Array.from({length:n},(_,i)=>i+1),rng);return g.map(row=>row.map(v=>p[v-1]));}
  function cloneClues(c){return {top:c.top.slice(),right:c.right.slice(),bottom:c.bottom.slice(),left:c.left.slice()};}
  function encodePayload(data){const s=JSON.stringify(data);if(typeof btoa==='function')return btoa(s);if(typeof Buffer!=='undefined')return Buffer.from(s,'utf8').toString('base64');return s;}
  function towerSize(settings,o){if(o.gridSize!=='auto')return Number(o.gridSize);if(o.difficulty==='easy')return 4;if(o.difficulty==='challenge')return 6;return 5;}
  function removalTarget(o,n){
    if(o.clueLevel==='more')return Math.max(1,Math.round(n*.45));
    if(o.clueLevel==='fewer')return Math.round(n*1.45);
    if(o.clueLevel==='balanced')return Math.round(n*.9);
    return o.difficulty==='easy'?Math.max(1,Math.round(n*.45)):o.difficulty==='challenge'?Math.round(n*1.35):Math.round(n*.85);
  }
  function candidates(n,seed){
    const rng=rngFromSeed(`${seed}:fast-towers`),out=[],seen=new Set();
    for(let offset=0;offset<n;offset++){
      let g=cyclic(n,offset);
      const variants=[g,rotate(g),rotate(rotate(g)),rotate(rotate(rotate(g))),reflect(g),transpose(g),complement(g),complement(reflect(g))];
      for(const v0 of variants){const v=permuteSymbols(v0,rng),key=JSON.stringify(v);if(!seen.has(key)){seen.add(key);out.push(v);}}
    }
    return shuffle(out,rng);
  }
  function makeTowers(settings,seed){
    const o=NL.normalise('numbertowers',settings?.engineSettings?.numbertowers),n=towerSize(settings,o),rng=rngFromSeed(`${seed}:clues`),list=candidates(n,seed);let solution=null,full=null;
    for(const grid of list){const clues=NL._towerClues(grid),logic=NL._solveTowersByLogic?.(n,clues);if(NL._countTowerSolutions(n,clues,2)===1&&logic?.solved){solution=grid;full=clues;break;}}
    // Rare fallback: use the original generator if the compact candidate family did not produce a unique signature.
    if(!solution){const fallback=base('numbertowers',settings,`${seed}:fallback`);if(fallback&&!fallback.error&&NL.validate(fallback).ok)return fallback;return {engineId:'numbertowers',title:'Number Towers · Skyscrapers',error:'A unique Number Towers puzzle could not be built. Generate another version.'};}
    const clues=cloneClues(full),all=[];for(const side of ['top','right','bottom','left'])for(let i=0;i<n;i++)all.push([side,i]);
    let removed=0,target=removalTarget(o,n);
    for(const [side,i] of shuffle(all,rng)){
      if(removed>=target)break;const old=clues[side][i];clues[side][i]=0;
      if(NL._countTowerSolutions(n,clues,2)===1)removed++;else clues[side][i]=old;
    }
    const repaired=NL._restoreTowerCluesUntilLogical(solution,clues,seed),finalClues=repaired.clues,audit=repaired.audit;
    if(!audit?.solved)return {engineId:'numbertowers',title:'Number Towers · Skyscrapers',error:'A deduction-solvable Number Towers puzzle could not be built. Generate another version.'};
    const payload={n,solution,clues:finalClues};
    return {engineId:'numbertowers',title:'Number Towers · Skyscrapers',difficulty:o.difficulty,size:n,solutionGrid:solution,clues:finalClues,logicStats:{solved:true,passes:audit.passes,eliminations:audit.eliminations,restoredClues:repaired.restored},seed,options:o,
      instruction:`Fill the grid with 1–${n}, using each height once in every row and column. Edge clues tell how many towers are visible from that direction. [[TT99TOWERS:${encodePayload(payload)}]]`};
  }
  NL.generate=function(id,settings,seed){return id==='numbertowers'?makeTowers(settings,seed):base(id,settings,seed);};
  if(typeof module!=='undefined'&&module.exports)module.exports=NL;
})(typeof globalThis!=='undefined'?globalThis:this);
