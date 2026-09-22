#!/usr/bin/env node
'use strict';

/*
 * 99 Club Studio · deduction-solvability audit
 *
 * Standard:
 *   - interdependent clues are allowed;
 *   - deterministic constraint propagation is allowed;
 *   - a single candidate may be tested only to prove it impossible;
 *   - no arbitrary unresolved branch may be kept.
 *
 * Search/exploration activities (Target Number, Broken Calculator, Insert the
 * Operations, etc.) are intentionally outside this audit.
 */
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const SAMPLES=Math.max(1,Number(process.env.DEDUCTION_SAMPLES||process.argv[2]||5));
const failures=[];
const results=[];

function fail(id,difficulty,seed,detail){
  failures.push({id,difficulty,seed,detail});
  console.error('FAIL ['+id+'] '+difficulty+' '+seed+' · '+detail);
}
function note(id,difficulty,total,stalled,contradictions,retries){
  results.push({id,difficulty,total,stalled,contradictions,retries});
  console.log('AUDIT '+id.padEnd(18)+' '+difficulty.padEnd(9)+' '+String(total-stalled)+'/'+total+
    ' deduction-solvable · contradictions '+contradictions+(retries?' · retries '+retries:''));
}
function load(rel){
  const full=path.join(ROOT,rel);
  delete require.cache[require.resolve(full)];
  return require(full);
}
function reset(){
  for(const k of ['TT99GamesVocabularyV2','TT99ArithmeticGames','TT99NumberLogicGames','TT99Games','TT99GamesPlay','TT99PlayArithmetic','TT99AlphaLibrary','TT99SymbolDecoder'])delete global[k];
  global.window=global;global.globalThis=global;
}
reset();
[
 'assets/99club/games-vocabulary.js',
 'assets/99club/games-arithmetic.js',
 'assets/99club/games-new-puzzles-v196.js',
 'assets/99club/games-colourlogic-deduction-v209.js',
 'assets/99club/games-balance-lab-v192.js',
 'assets/99club/games-operationgrid-v153.js',
 'assets/99club/games-operationgrid-print-v155.js',
 'assets/99club/games-operationgrid-print-v158.js',
 'assets/99club/games-crossgrid-v1321.js',
 'assets/99club/games-property-maze.js',
 'assets/99club/games-brokencalc-quality-v152.js',
 'assets/99club/games-number-logic.js',
 'assets/99club/games-extra-puzzles-v204.js',
 'assets/99club/games-number-towers-v137.js',
 'assets/99club/games-number-towers-v137-unique.js',
 'assets/99club/games-takuzu-v139.js',
 'assets/99club/games-takuzu-v139-logic.js',
 'assets/99club/games-puzzle-pack-v140.js',
 'assets/99club/games-puzzle-pack-v140-hashi.js',
 'assets/99club/games-alphametics-library-v141.js',
 'assets/99club/games-number-path-v2.js',
 'assets/99club/games-sumplete.js',
 'assets/99club/games-shikaku-v143.js',
 'assets/99club/games-sum-grids-v147.js',
 'assets/99club/games-engine.js',
 'assets/99club/games-symbol-decoder-v189.js',
 'assets/99club/games-wordsearch-quality-v150.js'
].forEach(load);

const G=global.TT99Games,A=global.TT99ArithmeticGames,N=global.TT99NumberLogicGames;
if(!G||!A||!N)throw new Error('Generator stack did not initialise');

function cloneSets(a){return a.map(s=>new Set(s));}
function force(ds,i,v){
  const d=ds[i];if(d.size===1&&d.has(v))return 0;if(!d.has(v))return -1;ds[i]=new Set([v]);return 1;
}
function remove(ds,i,v){
  const d=ds[i];if(!d.has(v))return 0;if(d.size===1)return -1;d.delete(v);return 1;
}
function contradictionAudit(state,propagate,solved,max=300){
  let contradictions=0,passes=0;
  for(let guard=0;guard<max;guard++){
    const q=propagate(state);passes+=Number(q&&q.passes||0);
    if(!q||q.ok===false)return {solved:false,contradiction:true,contradictions,passes};
    if(solved(state))return {solved:true,contradictions,passes};
    let changed=false;
    outer:for(let i=0;i<state.length;i++){
      if(!(state[i] instanceof Set)||state[i].size<=1)continue;
      for(const v of Array.from(state[i])){
        const test=cloneSets(state);test[i]=new Set([v]);
        const probe=propagate(test);
        if(!probe||probe.ok===false){
          state[i].delete(v);contradictions++;changed=true;break outer;
        }
      }
    }
    if(!changed)return {solved:false,contradictions,passes,remaining:state.filter(x=>x instanceof Set&&x.size>1).length};
  }
  return {solved:false,capped:true,contradictions,passes};
}

/* ---------- Latin / Sudoku helpers ---------- */
function sudokuUnits(p){
  const n=p.size,units=[];
  for(let r=0;r<n;r++)units.push(Array.from({length:n},(_,c)=>r*n+c));
  for(let c=0;c<n;c++)units.push(Array.from({length:n},(_,r)=>r*n+c));
  if(p.style!=='latin'){
    const br=Number(p.boxRows),bc=Number(p.boxCols);
    for(let r0=0;r0<n;r0+=br)for(let c0=0;c0<n;c0+=bc){
      const u=[];for(let r=r0;r<r0+br;r++)for(let c=c0;c<c0+bc;c++)u.push(r*n+c);units.push(u);
    }
  }
  return units;
}
function latinPropagate(p,ds,extra){
  const n=p.size,units=sudokuUnits(p);let changed=true,passes=0;
  while(changed&&passes++<100){
    changed=false;
    for(const u of units){
      const singles=new Map();
      for(const i of u)if(ds[i].size===1){const v=Array.from(ds[i])[0];if(singles.has(v))return {ok:false,passes};singles.set(v,i);}
      for(const [v,src] of singles)for(const i of u)if(i!==src){const q=remove(ds,i,v);if(q<0)return {ok:false,passes};if(q)changed=true;}
      for(let v=1;v<=n;v++){
        const cells=u.filter(i=>ds[i].has(v));if(!cells.length)return {ok:false,passes};
        if(cells.length===1){const q=force(ds,cells[0],v);if(q<0)return {ok:false,passes};if(q)changed=true;}
      }
      /* Naked pairs/triples: legitimate compact human deduction. */
      for(const k of [2,3]){
        const cand=u.filter(i=>ds[i].size>=2&&ds[i].size<=k);
        for(let a=0;a<cand.length;a++)for(let b=a+1;b<cand.length;b++){
          const pick=k===2?[cand[a],cand[b]]:null;
          if(!pick)continue;
          const union=new Set();pick.forEach(i=>ds[i].forEach(v=>union.add(v)));
          if(union.size!==k)continue;
          for(const i of u)if(!pick.includes(i))for(const v of union){const q=remove(ds,i,v);if(q<0)return {ok:false,passes};if(q)changed=true;}
        }
      }
    }
    if(extra){
      const q=extra(ds);if(q===false)return {ok:false,passes};if(q===true)changed=true;
    }
    if(ds.some(d=>!d.size))return {ok:false,passes};
  }
  return {ok:true,passes};
}
function auditSudoku(p,extra){
  const n=p.size,ds=Array.from({length:n*n},()=>new Set(Array.from({length:n},(_,i)=>i+1)));
  const display=p.displayGrid||[];
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(Number(display[r]&&display[r][c]))ds[r*n+c]=new Set([Number(display[r][c])]);
  return contradictionAudit(ds,s=>latinPropagate(p,s,extra?d=>extra(p,d):null),s=>s.every(d=>d.size===1));
}

/* ---------- Futoshiki ---------- */
function futoshikiExtra(p,ds){
  const n=p.size,idx=(r,c)=>r*n+c;let changed=false;
  function arc(i,j,less){
    const aa=Array.from(ds[i]),bb=Array.from(ds[j]);let local=false;
    for(const x of aa)if(!bb.some(y=>less?x<y:x>y)){const q=remove(ds,i,x);if(q<0)return false;if(q)local=changed=true;}
    for(const y of bb)if(!aa.some(x=>less?x<y:x>y)){const q=remove(ds,j,y);if(q<0)return false;if(q)local=changed=true;}
    return true;
  }
  for(let r=0;r<n;r++)for(let c=0;c<n-1;c++){const s=p.hSigns&&p.hSigns[r]&&p.hSigns[r][c];if(s&&!arc(idx(r,c),idx(r,c+1),s==='<'))return false;}
  for(let r=0;r<n-1;r++)for(let c=0;c<n;c++){const s=p.vSigns&&p.vSigns[r]&&p.vSigns[r][c];if(s&&!arc(idx(r,c),idx(r+1,c),s==='^'))return false;}
  return changed?true:null;
}
function auditFutoshiki(p){return auditSudoku(Object.assign({},p,{style:'latin'}),futoshikiExtra);}

/* ---------- Arithmetic Cages / Killer Sudoku ---------- */
const tupleCache=new Map();
function tuples(n,k,target,op,distinct){
  const key=[n,k,target,op,distinct?1:0].join('|');if(tupleCache.has(key))return tupleCache.get(key);
  const out=[],row=Array(k).fill(0);
  function valid(vals){
    if(distinct&&new Set(vals).size!==vals.length)return false;
    if(op==='=')return vals[0]===target;
    if(op==='+')return vals.reduce((a,b)=>a+b,0)===target;
    if(op==='×')return vals.reduce((a,b)=>a*b,1)===target;
    if(op==='−')return vals.length===2&&Math.abs(vals[0]-vals[1])===target;
    if(op==='÷')return vals.length===2&&Math.max(vals[0],vals[1])/Math.min(vals[0],vals[1])===target;
    return false;
  }
  function rec(i){if(i===k){if(valid(row))out.push(row.slice());return;}for(let v=1;v<=n;v++){row[i]=v;rec(i+1);}}
  rec(0);tupleCache.set(key,out);return out;
}
function cageExtra(cages,distinctWithin){
  return function(p,ds){
    let changed=false,n=p.size;
    for(const cage of cages||[]){
      const cells=cage.cells.map(x=>x[0]*n+x[1]),op=cage.op||'+',target=Number(cage.target);
      const opts=tuples(n,cells.length,target,op,distinctWithin).filter(t=>t.every((v,i)=>ds[cells[i]].has(v)));
      if(!opts.length)return false;
      for(let k=0;k<cells.length;k++){
        const supports=new Set(opts.map(t=>t[k]));
        for(const v of Array.from(ds[cells[k]]))if(!supports.has(v)){const q=remove(ds,cells[k],v);if(q<0)return false;if(q)changed=true;}
      }
    }
    return changed?true:null;
  };
}
function auditArithmeticCages(p){
  const q=Object.assign({},p,{style:'latin',displayGrid:Array.from({length:p.size},()=>Array(p.size).fill(0))});
  return auditSudoku(q,cageExtra(p.cages,false));
}
function auditKiller(p){return auditSudoku(Object.assign({},p,{style:'sudoku'}),cageExtra(p.cages,true));}

/* ---------- Nonogram ---------- */
const lineCache=new Map();
function linePatterns(n,clue){
  const key=n+'|'+clue.join(',');if(lineCache.has(key))return lineCache.get(key);
  if(clue.length===1&&Number(clue[0])===0){const z=[Array(n).fill(0)];lineCache.set(key,z);return z;}
  const out=[];
  function rec(i,pos,row){
    if(i===clue.length){out.push(row.concat(Array(n-row.length).fill(0)));return;}
    const len=Number(clue[i]),remaining=clue.slice(i+1).reduce((a,b)=>a+Number(b),0)+Math.max(0,clue.length-i-1),maxStart=n-len-remaining;
    for(let s=pos;s<=maxStart;s++){const next=row.concat(Array(s-row.length).fill(0),Array(len).fill(1));if(i<clue.length-1)next.push(0);rec(i+1,next.length,next);}
  }
  rec(0,0,[]);lineCache.set(key,out);return out;
}
function auditNonogram(p){
  const n=p.size,ds=Array.from({length:n*n},()=>new Set([0,1]));
  function prop(s){
    let changed=true,passes=0;
    while(changed&&passes++<100){changed=false;
      const doLine=(indices,clue)=>{
        const pats=linePatterns(n,clue).filter(pt=>indices.every((i,k)=>s[i].has(pt[k])));
        if(!pats.length)return false;
        for(let k=0;k<n;k++){const vals=new Set(pats.map(x=>x[k]));for(const v of Array.from(s[indices[k]]))if(!vals.has(v)){const q=remove(s,indices[k],v);if(q<0)return false;if(q)changed=true;}}
        return true;
      };
      for(let r=0;r<n;r++)if(!doLine(Array.from({length:n},(_,c)=>r*n+c),p.rowClues[r]))return {ok:false,passes};
      for(let c=0;c<n;c++)if(!doLine(Array.from({length:n},(_,r)=>r*n+c),p.colClues[c]))return {ok:false,passes};
    }
    return {ok:true,passes};
  }
  return contradictionAudit(ds,prop,s=>s.every(d=>d.size===1));
}

/* ---------- Kakuro ---------- */
const kakuroCache=new Map();
function kakuroTuples(len,target){
  const key=len+'|'+target;if(kakuroCache.has(key))return kakuroCache.get(key);
  const out=[],row=Array(len).fill(0),used=new Set();
  function rec(i,sum){
    if(i===len){if(sum===target)out.push(row.slice());return;}
    for(let v=1;v<=9;v++){if(used.has(v)||sum+v>target)continue;used.add(v);row[i]=v;rec(i+1,sum+v);used.delete(v);}
  }
  rec(0,0);kakuroCache.set(key,out);return out;
}
function auditKakuro(p){
  const n=p.size,white=[];for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(p.mask[r][c])white.push(r*n+c);
  const ds=Array.from({length:n*n},()=>new Set());
  white.forEach(i=>ds[i]=new Set([1,2,3,4,5,6,7,8,9]));
  for(const g of p.givens||[])ds[g.r*n+g.c]=new Set([Number(g.v)]);
  function prop(s){
    let changed=true,passes=0;
    while(changed&&passes++<100){changed=false;
      for(const run of p.runs||[]){
        const cells=run.cells.map(x=>x[0]*n+x[1]),opts=kakuroTuples(cells.length,Number(run.target)).filter(t=>t.every((v,i)=>s[cells[i]].has(v)));
        if(!opts.length)return {ok:false,passes};
        for(let k=0;k<cells.length;k++){const vals=new Set(opts.map(t=>t[k]));for(const v of Array.from(s[cells[k]]))if(!vals.has(v)){const q=remove(s,cells[k],v);if(q<0)return {ok:false,passes};if(q)changed=true;}}
      }
    }
    return {ok:true,passes};
  }
  return contradictionAudit(ds,prop,s=>white.every(i=>s[i].size===1));
}

/* ---------- Number Paths ---------- */
function auditPath(p,diagonal){
  const n=p.size,NN=n*n,cells=Array.from({length:NN},(_,i)=>i),domains=Array.from({length:NN},()=>new Set(cells));
  const given=new Map((p.givens||[]).map(g=>[Number(g.value!=null?g.value:g.v),Number(g.r)*n+Number(g.c)]));
  function rc(i){return [Math.floor(i/n),i%n];}
  function adjacent(a,b){
    const x=rc(a),y=rc(b),dr=Math.abs(x[0]-y[0]),dc=Math.abs(x[1]-y[1]);
    return diagonal?Math.max(dr,dc)===1:dr+dc===1;
  }
  function distance(a,b){const x=rc(a),y=rc(b);return diagonal?Math.max(Math.abs(x[0]-y[0]),Math.abs(x[1]-y[1])):Math.abs(x[0]-y[0])+Math.abs(x[1]-y[1]);}
  for(let v=1;v<=NN;v++){
    if(given.has(v)){domains[v-1]=new Set([given.get(v)]);continue;}
    for(const [gv,cell] of given){
      for(const c of Array.from(domains[v-1])){
        const gap=Math.abs(gv-v),dist=distance(c,cell);
        if(dist>gap||(!diagonal&&((dist-gap)&1)!==0))domains[v-1].delete(c);
      }
    }
  }
  function prop(s){
    let changed=true,passes=0;
    while(changed&&passes++<120){changed=false;
      const fixed=new Map();
      for(let v=0;v<NN;v++)if(s[v].size===1){const c=Array.from(s[v])[0];if(fixed.has(c)&&fixed.get(c)!==v)return {ok:false,passes};fixed.set(c,v);}
      for(const [c,v0] of fixed)for(let v=0;v<NN;v++)if(v!==v0){const q=remove(s,v,c);if(q<0)return {ok:false,passes};if(q)changed=true;}
      for(const c of cells){
        const vals=[];for(let v=0;v<NN;v++)if(s[v].has(c))vals.push(v);
        if(!vals.length)return {ok:false,passes};
        if(vals.length===1){const q=force(s,vals[0],c);if(q<0)return {ok:false,passes};if(q)changed=true;}
      }
      for(let v=0;v<NN-1;v++){
        const a=Array.from(s[v]),b=Array.from(s[v+1]);
        for(const c of a)if(!b.some(d=>adjacent(c,d))){const q=remove(s,v,c);if(q<0)return {ok:false,passes};if(q)changed=true;}
        for(const d of b)if(!a.some(c=>adjacent(c,d))){const q=remove(s,v+1,d);if(q<0)return {ok:false,passes};if(q)changed=true;}
      }
    }
    return {ok:true,passes};
  }
  return contradictionAudit(domains,prop,s=>s.every(d=>d.size===1),500);
}

/* ---------- Number Towers ---------- */
const permCache=new Map();
function permutations(n){
  if(permCache.has(n))return permCache.get(n);
  const out=[],row=[],used=new Set();
  function rec(){if(row.length===n){out.push(row.slice());return;}for(let v=1;v<=n;v++)if(!used.has(v)){used.add(v);row.push(v);rec();row.pop();used.delete(v);}}
  rec();permCache.set(n,out);return out;
}
function visible(row){let max=0,count=0;for(const v of row)if(v>max){max=v;count++;}return count;}
function auditTowers(p){
  const n=p.size,base=permutations(n),ds=Array.from({length:n*n},()=>new Set(Array.from({length:n},(_,i)=>i+1)));
  let rowC=Array.from({length:n},(_,r)=>base.filter(x=>(!p.clues.left[r]||visible(x)===p.clues.left[r])&&(!p.clues.right[r]||visible(x.slice().reverse())===p.clues.right[r])));
  let colC=Array.from({length:n},(_,c)=>base.filter(x=>(!p.clues.top[c]||visible(x)===p.clues.top[c])&&(!p.clues.bottom[c]||visible(x.slice().reverse())===p.clues.bottom[c])));
  function pack(d,rr,cc){return {d:cloneSets(d),r:rr.map(x=>x.slice()),c:cc.map(x=>x.slice())};}
  function prop(st){
    let changed=true,passes=0;
    while(changed&&passes++<100){changed=false;
      for(let r=0;r<n;r++){
        const next=st.r[r].filter(x=>x.every((v,c)=>st.d[r*n+c].has(v)));if(!next.length)return {ok:false,passes};if(next.length!==st.r[r].length){st.r[r]=next;changed=true;}
        for(let c=0;c<n;c++){const vals=new Set(next.map(x=>x[c]));for(const v of Array.from(st.d[r*n+c]))if(!vals.has(v)){const q=remove(st.d,r*n+c,v);if(q<0)return {ok:false,passes};if(q)changed=true;}}
      }
      for(let c=0;c<n;c++){
        const next=st.c[c].filter(x=>x.every((v,r)=>st.d[r*n+c].has(v)));if(!next.length)return {ok:false,passes};if(next.length!==st.c[c].length){st.c[c]=next;changed=true;}
        for(let r=0;r<n;r++){const vals=new Set(next.map(x=>x[r]));for(const v of Array.from(st.d[r*n+c]))if(!vals.has(v)){const q=remove(st.d,r*n+c,v);if(q<0)return {ok:false,passes};if(q)changed=true;}}
      }
    }
    return {ok:true,passes};
  }
  let st={d:ds,r:rowC,c:colC},contradictions=0,passes=0;
  for(let guard=0;guard<300;guard++){
    const q=prop(st);passes+=q.passes||0;if(!q.ok)return {solved:false,contradiction:true,contradictions,passes};
    if(st.d.every(x=>x.size===1))return {solved:true,contradictions,passes};
    let did=false;
    outer:for(let i=0;i<st.d.length;i++)if(st.d[i].size>1)for(const v of Array.from(st.d[i])){
      const t=pack(st.d,st.r,st.c);t.d[i]=new Set([v]);if(!prop(t).ok){st.d[i].delete(v);contradictions++;did=true;break outer;}
    }
    if(!did)return {solved:false,contradictions,passes,remaining:st.d.filter(x=>x.size>1).length};
  }
  return {solved:false,capped:true,contradictions,passes};
}

/* ---------- Sumplete ---------- */
const maskCache=new Map();
function rowMasks(vals,target){
  const key=vals.join(',')+'|'+target;if(maskCache.has(key))return maskCache.get(key);
  const out=[],n=vals.length;
  for(let m=0;m<(1<<n);m++){let sum=0;for(let i=0;i<n;i++)if((m>>i)&1)sum+=Number(vals[i]);if(Math.abs(sum-target)<1e-9)out.push(Array.from({length:n},(_,i)=>(m>>i)&1));}
  maskCache.set(key,out);return out;
}
function auditSumplete(p){
  const n=p.size,ds=Array.from({length:n*n},()=>new Set([0,1]));
  function prop(s){
    let changed=true,passes=0;
    while(changed&&passes++<100){changed=false;
      for(let r=0;r<n;r++){
        const opts=rowMasks(p.valueGrid[r],Number(p.rowTargets[r])).filter(m=>m.every((v,c)=>s[r*n+c].has(v)));if(!opts.length)return {ok:false,passes};
        for(let c=0;c<n;c++){const vals=new Set(opts.map(x=>x[c]));for(const v of Array.from(s[r*n+c]))if(!vals.has(v)){const q=remove(s,r*n+c,v);if(q<0)return {ok:false,passes};if(q)changed=true;}}
      }
      for(let c=0;c<n;c++){
        const vals=Array.from({length:n},(_,r)=>p.valueGrid[r][c]),opts=rowMasks(vals,Number(p.colTargets[c])).filter(m=>m.every((v,r)=>s[r*n+c].has(v)));if(!opts.length)return {ok:false,passes};
        for(let r=0;r<n;r++){const vs=new Set(opts.map(x=>x[r]));for(const v of Array.from(s[r*n+c]))if(!vs.has(v)){const q=remove(s,r*n+c,v);if(q<0)return {ok:false,passes};if(q)changed=true;}}
      }
    }
    return {ok:true,passes};
  }
  return contradictionAudit(ds,prop,s=>s.every(d=>d.size===1));
}

/* ---------- Exact-cover region puzzles: Shikaku / Perimeter ---------- */
function factorPairs(a){const out=[];for(let h=1;h<=a;h++)if(a%h===0)out.push([h,a/h]);return out;}
function shikakuCandidates(p){
  const n=p.size,out=[];
  for(const clue of p.clues){
    const list=[];
    for(const [h,w] of factorPairs(Number(clue.area))){
      if(h>n||w>n)continue;
      for(let r=Math.max(0,clue.r-h+1);r<=Math.min(clue.r,n-h);r++)for(let c=Math.max(0,clue.c-w+1);c<=Math.min(clue.c,n-w);c++){
        let other=false;for(const q of p.clues)if(q!==clue&&q.r>=r&&q.r<r+h&&q.c>=c&&q.c<c+w){other=true;break;}if(other)continue;
        const cells=[];for(let rr=r;rr<r+h;rr++)for(let cc=c;cc<c+w;cc++)cells.push(rr*n+cc);
        list.push({cells,key:r+':'+c+':'+h+':'+w});
      }
    }
    out.push(list);
  }
  return out;
}
function n4(n,i){const r=Math.floor(i/n),c=i%n,out=[];if(r)out.push(i-n);if(r<n-1)out.push(i+n);if(c)out.push(i-1);if(c<n-1)out.push(i+1);return out;}
function perimeter(n,cells){const s=new Set(cells);let p=0;for(const i of s){for(const q of n4(n,i))if(!s.has(q))p++;const r=Math.floor(i/n),c=i%n;if(!r)p++;if(r===n-1)p++;if(!c)p++;if(c===n-1)p++;}return p;}
function perimeterCandidates(p){
  const n=p.size,clueSet=new Set(p.clues.map(q=>Number(q.idx))),out=[];
  for(const clue of p.clues){
    const blocked=new Set(Array.from(clueSet).filter(x=>x!==Number(clue.idx))),seen=new Set(),list=[],maxArea=Math.min(n*n-blocked.size,Math.max(1,Math.floor(Number(clue.perimeter)*Number(clue.perimeter)/16)+1));
    function key(s){return Array.from(s).sort((a,b)=>a-b).join(',');}
    function rec(s){
      if(list.length>=3500)return;const k=key(s);if(seen.has(k))return;seen.add(k);
      if(perimeter(n,s)===Number(clue.perimeter))list.push({cells:Array.from(s),key:k});
      if(s.size>=maxArea)return;
      const fr=new Set();for(const cell of s)for(const q of n4(n,cell))if(!s.has(q)&&!blocked.has(q))fr.add(q);
      for(const q of fr){const next=new Set(s);next.add(q);rec(next);if(list.length>=3500)return;}
    }
    rec(new Set([Number(clue.idx)]));out.push(list);
  }
  return out;
}
function auditExactCover(p,lists){
  const total=p.size*p.size;
  function cloneLists(x){return x.map(a=>a.slice());}
  function prop(st){
    let changed=true,passes=0;
    while(changed&&passes++<100){changed=false;
      if(st.some(x=>!x.length))return {ok:false,passes};
      /* Selected regions exclude overlaps. */
      for(let i=0;i<st.length;i++)if(st[i].length===1){
        const fixed=new Set(st[i][0].cells);
        for(let j=0;j<st.length;j++)if(j!==i){
          const next=st[j].filter(r=>!r.cells.some(c=>fixed.has(c)));if(!next.length)return {ok:false,passes};if(next.length!==st[j].length){st[j]=next;changed=true;}
        }
      }
      /* Pairwise arc consistency: every candidate needs a compatible candidate for every other clue. */
      for(let i=0;i<st.length;i++)for(let j=0;j<st.length;j++)if(i!==j){
        const next=st[i].filter(a=>st[j].some(b=>{const bs=new Set(b.cells);return !a.cells.some(c=>bs.has(c));}));
        if(!next.length)return {ok:false,passes};if(next.length!==st[i].length){st[i]=next;changed=true;}
      }
      /* Every cell must be covered exactly once. If only one clue can cover it, restrict that clue. */
      for(let cell=0;cell<total;cell++){
        const supporters=[];
        for(let i=0;i<st.length;i++){const opts=st[i].filter(r=>r.cells.includes(cell));if(opts.length)supporters.push([i,opts]);}
        if(!supporters.length)return {ok:false,passes};
        if(supporters.length===1){
          const i=supporters[0][0],opts=supporters[0][1];
          if(opts.length!==st[i].length){st[i]=opts;changed=true;}
        }
      }
    }
    return {ok:true,passes};
  }
  let st=cloneLists(lists),contradictions=0,passes=0;
  for(let guard=0;guard<300;guard++){
    const q=prop(st);passes+=q.passes||0;if(!q.ok)return {solved:false,contradiction:true,contradictions,passes};
    if(st.every(x=>x.length===1))return {solved:true,contradictions,passes};
    let did=false;
    outer:for(let i=0;i<st.length;i++)if(st[i].length>1)for(const cand of st[i].slice()){
      const t=cloneLists(st);t[i]=[cand];if(!prop(t).ok){st[i]=st[i].filter(x=>x.key!==cand.key);contradictions++;did=true;break outer;}
    }
    if(!did)return {solved:false,contradictions,passes,remaining:st.map(x=>x.length)};
  }
  return {solved:false,capped:true,contradictions,passes};
}
function auditShikaku(p){return auditExactCover(p,shikakuCandidates(p));}
function auditPerimeter(p){return auditExactCover(p,perimeterCandidates(p));}

/* ---------- Hashi ---------- */
function segmentsCross(e1,e2,islands){
  const a=e1.a,b=e1.b,c=e2.a,d=e2.b;if(new Set([a,b,c,d]).size<4)return false;
  const A=islands[a],B=islands[b],C=islands[c],D=islands[d];
  if(A.r===B.r&&C.c===D.c)return Math.min(A.c,B.c)<C.c&&C.c<Math.max(A.c,B.c)&&Math.min(C.r,D.r)<A.r&&A.r<Math.max(C.r,D.r);
  if(A.c===B.c&&C.r===D.r)return Math.min(C.c,D.c)<A.c&&A.c<Math.max(C.c,D.c)&&Math.min(A.r,B.r)<C.r&&C.r<Math.max(A.r,B.r);
  return false;
}
function auditHashi(p){
  const edges=p.edges,islands=p.islands,m=edges.length,ds=Array.from({length:m},()=>new Set([0,1,2]));
  const inc=Array.from({length:islands.length},()=>[]),cross=Array.from({length:m},()=>[]);
  edges.forEach((e,i)=>{inc[e.a].push(i);inc[e.b].push(i);});
  for(let i=0;i<m;i++)for(let j=i+1;j<m;j++)if(segmentsCross(edges[i],edges[j],islands)){cross[i].push(j);cross[j].push(i);}
  function components(s){
    const adj=Array.from({length:islands.length},()=>[]);
    edges.forEach((e,i)=>{if(s[i].size===1&&Array.from(s[i])[0]>0){adj[e.a].push(e.b);adj[e.b].push(e.a);}});
    const comp=Array(islands.length).fill(-1);let k=0;
    for(let start=0;start<islands.length;start++)if(comp[start]<0){const stack=[start];comp[start]=k;while(stack.length){const u=stack.pop();for(const v of adj[u])if(comp[v]<0){comp[v]=k;stack.push(v);}}k++;}
    return {comp,count:k};
  }
  function prop(s){
    let changed=true,passes=0;
    while(changed&&passes++<120){changed=false;
      for(let u=0;u<islands.length;u++){
        const list=inc[u],target=Number(islands[u].clue),opts=[];
        function rec(k,sum,row){if(k===list.length){if(sum===target)opts.push(row.slice());return;}for(const v of s[list[k]]){if(sum+v<=target){row.push(v);rec(k+1,sum+v,row);row.pop();}}}
        rec(0,0,[]);if(!opts.length)return {ok:false,passes};
        for(let k=0;k<list.length;k++){const sup=new Set(opts.map(x=>x[k]));for(const v of Array.from(s[list[k]]))if(!sup.has(v)){const q=remove(s,list[k],v);if(q<0)return {ok:false,passes};if(q)changed=true;}}
      }
      for(let i=0;i<m;i++)if(!s[i].has(0)){
        for(const j of cross[i])for(const v of [1,2]){const q=remove(s,j,v);if(q<0)return {ok:false,passes};if(q)changed=true;}
      }
      const cc=components(s);
      if(cc.count>1){
        for(let cid=0;cid<cc.count;cid++){
          const outgoing=[];
          for(let i=0;i<m;i++){const e=edges[i];if(cc.comp[e.a]!==cc.comp[e.b]&&(cc.comp[e.a]===cid||cc.comp[e.b]===cid)&&Array.from(s[i]).some(v=>v>0))outgoing.push(i);}
          if(!outgoing.length)return {ok:false,passes};
          if(outgoing.length===1&&s[outgoing[0]].has(0)){const q=remove(s,outgoing[0],0);if(q<0)return {ok:false,passes};if(q)changed=true;}
        }
      }
      if(s.every(x=>x.size===1)){
        const fin=components(s);if(fin.count!==1)return {ok:false,passes};
      }
    }
    return {ok:true,passes};
  }
  return contradictionAudit(ds,prop,s=>s.every(d=>d.size===1));
}

/* ---------- Alphametics: column/carry deduction audit ---------- */
function auditAlphametic(p){
  const words=(p.addends||[]).concat([p.result]),letters=Array.from(new Set(words.join(''))),letterIndex=new Map(letters.map((x,i)=>[x,i]));
  const lead=new Set(words.filter(w=>w.length>1).map(w=>w[0])),maxLen=Math.max(...words.map(w=>w.length)),addCount=(p.addends||[]).length;
  const state=letters.map(ch=>{
    const d=new Set(Array.from({length:10},(_,i)=>i);
    if(lead.has(ch))d.delete(0);
    if(p.givens&&p.givens[ch]!=null)return new Set([Number(p.givens[ch])]);
    return d;
  });
  const carryOffset=state.length;
  for(let col=0;col<=maxLen;col++){
    if(col===0||col===maxLen)state.push(new Set([0]));
    else state.push(new Set(Array.from({length:Math.max(1,addCount)},(_,i)=>i)));
  }

  function matchingExists(domains,forcedI=-1,forcedV=-1){
    const order=letters.map((_,i)=>i).sort((a,b)=>domains[a].size-domains[b].size),used=new Set();
    function rec(k){
      if(k===order.length)return true;
      const i=order[k],vals=i===forcedI?[forcedV]:Array.from(domains[i]);
      for(const v of vals){
        if(!domains[i].has(v)||used.has(v))continue;
        used.add(v);if(rec(k+1))return true;used.delete(v);
      }
      return false;
    }
    return rec(0);
  }

  const columns=[];
  for(let col=0;col<maxLen;col++){
    const coeff=new Map();
    for(const w of p.addends||[]){
      const ch=col<w.length?w[w.length-1-col]:null;
      if(ch)coeff.set(ch,(coeff.get(ch)||0)+1);
    }
    const rch=col<p.result.length?p.result[p.result.length-1-col]:null;
    if(rch)coeff.set(rch,(coeff.get(rch)||0)-1);
    const vars=Array.from(coeff.keys()).map(ch=>letterIndex.get(ch));
    vars.push(carryOffset+col,carryOffset+col+1);
    columns.push({coeff,vars:Array.from(new Set(vars)),cin:carryOffset+col,cout:carryOffset+col+1});
  }

  function propagate(s){
    let changed=true,passes=0;
    while(changed&&passes++<100){
      changed=false;
      /* Global all-different support across letters. */
      if(!matchingExists(s))return {ok:false,passes};
      for(let i=0;i<letters.length;i++)for(const v of Array.from(s[i])){
        if(!matchingExists(s,i,v)){s[i].delete(v);changed=true;if(!s[i].size)return {ok:false,passes};}
      }

      for(const column of columns){
        const supports=new Map(column.vars.map(i=>[i,new Set()])),assign=new Map(),usedLetters=new Set(),vars=column.vars.slice().sort((a,b)=>s[a].size-s[b].size);
        function rec(k){
          if(k===vars.length){
            let value=Number(assign.get(column.cin)||0)-10*Number(assign.get(column.cout)||0);
            for(const [ch,coef] of column.coeff)value+=coef*Number(assign.get(letterIndex.get(ch)));
            if(value===0)for(const i of column.vars)supports.get(i).add(assign.get(i));
            return;
          }
          const i=vars[k],isLetter=i<letters.length;
          for(const v of s[i]){
            if(isLetter&&usedLetters.has(v))continue;
            assign.set(i,v);if(isLetter)usedLetters.add(v);rec(k+1);if(isLetter)usedLetters.delete(v);assign.delete(i);
          }
        }
        rec(0);
        for(const i of column.vars){
          const sup=supports.get(i);if(!sup.size)return {ok:false,passes};
          for(const v of Array.from(s[i]))if(!sup.has(v)){s[i].delete(v);changed=true;if(!s[i].size)return {ok:false,passes};}
        }
      }
    }
    return {ok:true,passes};
  }
  const a=contradictionAudit(state,prop,s=>s.slice(0,letters.length).every(d=>d.size===1),500);
  a.letters=letters.length;a.columns=maxLen;
  return a;
}

function auditAlphameticsLibrary(){
  const lib=global.TT99AlphaLibrary&&global.TT99AlphaLibrary.templates||[],summary={easy:{total:0,solved:0,contradictions:0,max:0},standard:{total:0,solved:0,contradictions:0,max:0},challenge:{total:0,solved:0,contradictions:0,max:0}},stalled=[];
  for(const t of lib){
    const difficulty=t.difficulty||'standard',settings={minYear:1,maxYear:6,topics:['algebra','calculation'],engineSettings:{alphametics:{difficulty,hintLevel:'auto',theme:'auto',template:t.id}}};
    const p=G.generateActivity('alphametics',settings,'deduction:alphametics:'+t.id,[]);
    const a=p&&!p.error?auditAlphametic(p):{solved:false,error:p&&p.error||'generation failed'};
    const s=summary[difficulty]||summary.standard;s.total++;
    if(a.solved){s.solved++;s.contradictions+=Number(a.contradictions||0);s.max=Math.max(s.max,Number(a.contradictions||0));}
    else stalled.push({id:t.id,difficulty,a});
  }
  return {summary,stalled};
}

/* ---------- Existing explicit deduction guards ---------- */
function auditGuarded(p){
  if(p.engineId==='colourlogic')return A.COLOURLOGIC_DEDUCTION.audit(p);
  const v=N.validate(p);
  if(p.engineId==='takuzu')return {solved:!!v.logicSolvable,contradictions:0};
  if(p.engineId==='mathsmines')return {solved:v.ok===true,contradictions:0};
  return {solved:false,error:'no guard'};
}

const auditors={
 sudoku:auditSudoku,
 kakuro:auditKakuro,
 futoshiki:auditFutoshiki,
 arithmeticcages:auditArithmeticCages,
 nonogram:auditNonogram,
 numberpath:p=>auditPath(p,false),
 diagonalpath:p=>auditPath(p,true),
 takuzu:auditGuarded,
 killersudoku:auditKiller,
 hashi:auditHashi,
 mathsmines:auditGuarded,
 numbertowers:auditTowers,
 sumplete:auditSumplete,
 shikaku:auditShikaku,
 perimeterregions:auditPerimeter,
 colourlogic:auditGuarded
};

function settingsFor(id,difficulty){
  return {
    minYear:1,maxYear:6,
    topics:['number_place_value','calculation','fractions','decimals_percentages','ratio_proportion','measurement','geometry','statistics','algebra'],
    engineSettings:{[id]:{difficulty}}
  };
}

for(const id of Object.keys(auditors)){
  for(const difficulty of ['easy','standard','challenge']){
    let stalled=0,contradictions=0,retries=0,total=0;
    for(let i=0;i<SAMPLES;i++){
      const seed='deduction:'+id+':'+difficulty+':'+i;
      let p;
      try{p=G.generateActivity(id,settingsFor(id,difficulty),seed,[]);}
      catch(e){fail(id,difficulty,seed,'generation threw: '+e.message);stalled++;continue;}
      if(!p||p.error){fail(id,difficulty,seed,'generation failed: '+(p&&p.error||'empty'));stalled++;continue;}
      total++;
      let a;
      try{a=auditors[id](p);}
      catch(e){fail(id,difficulty,seed,'audit threw: '+e.message);stalled++;continue;}
      contradictions+=Number(a&&a.contradictions||0);
      retries+=Math.max(0,Number(p.deductionStats&&p.deductionStats.attempt||1)-1);
      if(!a||!a.solved){stalled++;fail(id,difficulty,seed,'deduction stalled: '+JSON.stringify(a||{}));}
    }
    note(id,difficulty,total,stalled,contradictions,retries);
  }
}

/* Structural families where the generator itself proves a direct algebraic
 * determination rather than a search path. Keep these in the report so they
 * are not accidentally mistaken for unaudited logic puzzles.
 */
console.log('');
console.log('STRUCTURAL / DIRECT-DEDUCTION FAMILIES');
console.log('  Number Pyramid: hidden mask retained only while linear equations stay full-rank.');
console.log('  Magic Squares / Magic Shape: missing-value masks retained only while line equations stay full-rank.');
console.log('  Equation Crossgrid: hidden cells are retained only when a one-unknown-at-a-time solve order exists.');
console.log('  Symbol Equations / Function Machines / Balance: direct equation or inverse-operation deduction.');
console.log('');
console.log('SEARCH / EXPLORATION FAMILIES (not subject to no-branch gate)');
console.log('  Target Number, Broken Calculator, Insert the Operations, Target Square Search.');
const alphaAudit=auditAlphameticsLibrary();
console.log('');
console.log('ALPHAMETICS COLUMN/CARRY AUDIT');
for(const difficulty of ['easy','standard','challenge']){
  const s=alphaAudit.summary[difficulty];
  console.log('  '+difficulty+': '+s.solved+'/'+s.total+' solved by propagation + contradiction; '+s.contradictions+' contradiction eliminations total; max '+s.max+' in one puzzle.');
}
if(alphaAudit.stalled.length)console.log('  '+alphaAudit.stalled.length+' curated template(s) still require deeper branching: '+alphaAudit.stalled.map(x=>x.id).join(', '));
else console.log('  All curated Alphametics templates passed the column/carry audit.');
console.log('');
console.log('SEARCH / EXPLORATION FAMILIES (not subject to no-branch gate)');
console.log('  Target Number, Broken Calculator, Insert the Operations, Target Square Search.');
console.log('  Number Property Maze deliberately includes valid-looking dead ends at Standard/Challenge; route backtracking is part of that maze design.');
console.log('  Balance Lab final weight split is an intentional partition/search challenge.');

if(failures.length){
  console.error('');
  console.error(failures.length+' deduction-solvability failure(s).');
  process.exit(1);
}
console.log('');
console.log('All '+Object.keys(auditors).length+' deduction-sensitive families passed.');
