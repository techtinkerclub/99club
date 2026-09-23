/* 99 Club Studio · deduction-quality gate v2.10
 * Constraint puzzles must be solvable without an arbitrary branch.
 * Accepted reasoning:
 *   - direct constraint propagation / candidate elimination;
 *   - all-different subset/matching deductions;
 *   - one-level contradiction elimination ("if this were X, the rules break").
 * The contradiction probe never recursively guesses.
 */
(function(global){
'use strict';
const G=global.TT99Games,N=global.TT99NumberLogicGames;
if(!G||!N||N.__deductionGateV210)return;
const VERSION='2.10.0';
const range=n=>Array.from({length:n},(_,i)=>i+1);
const cloneDomains=d=>d.map(s=>new Set(s));
const only=s=>s.size===1?[...s][0]:null;
const key=(r,c,n)=>r*n+c;
function setOnly(s,v){if(s.size===1&&s.has(v))return 0;if(!s.has(v))return -1;s.clear();s.add(v);return 1;}
function keepOnly(s,allowed){let ch=0;for(const v of [...s])if(!allowed.has(v)){s.delete(v);ch++;}return s.size?ch:-1;}
function matchingExists(domains,cells,forcedIndex=-1,forcedValue=null){
  const m=cells.length,adj=cells.map(i=>[...domains[i]]);
  if(forcedIndex>=0){if(!adj[forcedIndex].includes(forcedValue))return false;adj[forcedIndex]=[forcedValue];}
  const match=new Map();
  const order=Array.from({length:m},(_,i)=>i).sort((a,b)=>adj[a].length-adj[b].length);
  function aug(ci,seen){
    for(const v of adj[ci]){if(seen.has(v))continue;seen.add(v);const prev=match.get(v);if(prev==null||aug(prev,seen)){match.set(v,ci);return true;}}
    return false;
  }
  for(const ci of order)if(!aug(ci,new Set()))return false;
  return true;
}
function allDiff(domains,cells){
  if(!matchingExists(domains,cells))return {ok:false,changed:0};
  let changed=0;
  for(const i of cells)for(const v of [...domains[i]]){
    const local=cells.indexOf(i);
    if(!matchingExists(domains,cells,local,v)){domains[i].delete(v);changed++;if(!domains[i].size)return {ok:false,changed};}
  }
  return {ok:true,changed};
}
function genericDeduce(domains,propagate,{indirect=true,maxRounds=160}={}){
  let passes=0,indirectEliminations=0;
  for(let round=0;round<maxRounds;round++){
    const q=propagate(domains);passes+=q.passes||1;if(!q.ok)return {solved:false,contradiction:true,domains,passes,indirectEliminations};
    if(domains.every(s=>s.size===1))return {solved:true,domains,passes,indirectEliminations};
    if(q.changed)continue;
    if(!indirect)break;
    let eliminated=false;
    const order=domains.map((s,i)=>({i,n:s.size})).filter(x=>x.n>1).sort((a,b)=>a.n-b.n||a.i-b.i);
    outer:for(const {i} of order){
      for(const v of [...domains[i]]){
        const test=cloneDomains(domains);test[i].clear();test[i].add(v);
        const t=propagate(test);
        if(!t.ok){domains[i].delete(v);indirectEliminations++;eliminated=true;if(!domains[i].size)return {solved:false,contradiction:true,domains,passes,indirectEliminations};break outer;}
      }
    }
    if(!eliminated)break;
  }
  return {solved:domains.every(s=>s.size===1),domains,passes,indirectEliminations};
}
function latinUnits(n,boxRows=0,boxCols=0){
  const units=[];
  for(let r=0;r<n;r++)units.push(Array.from({length:n},(_,c)=>key(r,c,n)));
  for(let c=0;c<n;c++)units.push(Array.from({length:n},(_,r)=>key(r,c,n)));
  if(boxRows&&boxCols)for(let r0=0;r0<n;r0+=boxRows)for(let c0=0;c0<n;c0+=boxCols){const u=[];for(let r=r0;r<r0+boxRows;r++)for(let c=c0;c<c0+boxCols;c++)u.push(key(r,c,n));units.push(u);}
  return units;
}
function baseLatinDomains(n,display){
  const vals=range(n);return Array.from({length:n*n},(_,i)=>{const r=Math.floor(i/n),c=i%n,v=Number(display?.[r]?.[c]||0);return new Set(v?[v]:vals);});
}
function latinPropagator(n,units,extra){
  return function(domains){
    let total=0,passes=0;
    for(let spin=0;spin<80;spin++){passes++;let changed=0;
      for(const u of units){const q=allDiff(domains,u);if(!q.ok)return {ok:false,changed:total+changed,passes};changed+=q.changed;}
      if(extra){const q=extra(domains);if(!q.ok)return {ok:false,changed:total+changed,passes};changed+=q.changed||0;}
      total+=changed;if(!changed)return {ok:true,changed:total,passes};
    }
    return {ok:true,changed:total,passes};
  };
}
function auditSudoku(p){
  const n=Number(p.size),domains=baseLatinDomains(n,p.displayGrid),units=latinUnits(n,p.style==='latin'?0:Number(p.boxRows),p.style==='latin'?0:Number(p.boxCols));
  const res=genericDeduce(domains,latinPropagator(n,units,null));return {...res,engineId:'sudoku'};
}
function futoshikiPairs(p){
  const n=Number(p.size),pairs=[];
  for(let r=0;r<n;r++)for(let c=0;c<n-1;c++){const s=p.hSigns?.[r]?.[c];if(s)pairs.push([key(r,c,n),key(r,c+1,n),s==='<'?'<':'>']);}
  for(let r=0;r<n-1;r++)for(let c=0;c<n;c++){const s=p.vSigns?.[r]?.[c];if(s)pairs.push([key(r,c,n),key(r+1,c,n),s==='^'?'<':'>']);}
  return pairs;
}
function binaryOrder(domains,a,b,op){
  const A=domains[a],B=domains[b],aa=new Set([...A].filter(x=>[...B].some(y=>op==='<'?x<y:x>y))),bb=new Set([...B].filter(y=>[...A].some(x=>op==='<'?x<y:x>y)));
  const ca=keepOnly(A,aa);if(ca<0)return {ok:false,changed:0};const cb=keepOnly(B,bb);if(cb<0)return {ok:false,changed:0};return {ok:true,changed:ca+cb};
}
function auditFutoshiki(p){
  const n=Number(p.size),domains=baseLatinDomains(n,p.displayGrid),units=latinUnits(n),pairs=futoshikiPairs(p);
  const extra=d=>{let changed=0;for(const [a,b,op] of pairs){const q=binaryOrder(d,a,b,op);if(!q.ok)return q;changed+=q.changed;}return {ok:true,changed};};
  return {...genericDeduce(domains,latinPropagator(n,units,extra)),engineId:'futoshiki'};
}
function cageOk(vals,op,target){
  if(op==='=')return vals.length===1&&vals[0]===Number(target);
  if(op==='+')return vals.reduce((a,b)=>a+b,0)===Number(target);
  if(op==='×')return vals.reduce((a,b)=>a*b,1)===Number(target);
  if(op==='−')return vals.length===2&&Math.abs(vals[0]-vals[1])===Number(target);
  if(op==='÷'){if(vals.length!==2)return false;const hi=Math.max(...vals),lo=Math.min(...vals);return lo!==0&&hi/lo===Number(target);}
  return false;
}
function tupleSupport(domains,cells,test,distinct=false,peerConflict=null){
  const supports=cells.map(()=>new Set()),vals=Array(cells.length),used=new Set();let any=false;
  function rec(pos){
    if(pos===cells.length){if(!test(vals))return;any=true;for(let i=0;i<cells.length;i++)supports[i].add(vals[i]);return;}
    const ci=cells[pos];
    for(const v of domains[ci]){
      if(distinct&&used.has(v))continue;
      let bad=false;if(peerConflict)for(let j=0;j<pos;j++)if(vals[j]===v&&peerConflict(ci,cells[j])){bad=true;break;}if(bad)continue;
      vals[pos]=v;if(distinct)used.add(v);rec(pos+1);if(distinct)used.delete(v);
    }
  }
  rec(0);if(!any)return {ok:false,changed:0};let changed=0;
  for(let i=0;i<cells.length;i++){const q=keepOnly(domains[cells[i]],supports[i]);if(q<0)return {ok:false,changed};changed+=q;}
  return {ok:true,changed};
}
function auditArithmeticCages(p){
  const n=Number(p.size),domains=baseLatinDomains(n,null),units=latinUnits(n);
  const cages=(p.cages||[]).map(cg=>({cells:cg.cells.map(([r,c])=>key(r,c,n)),raw:cg}));
  const peer=(a,b)=>Math.floor(a/n)===Math.floor(b/n)||(a%n)===(b%n);
  const extra=d=>{let changed=0;for(const x of cages){const q=tupleSupport(d,x.cells,vals=>cageOk(vals,x.raw.op,x.raw.target),false,peer);if(!q.ok)return q;changed+=q.changed;}return {ok:true,changed};};
  return {...genericDeduce(domains,latinPropagator(n,units,extra)),engineId:'arithmeticcages'};
}
function runAssignments(domains,cells,target){
  return tupleSupport(domains,cells,vals=>new Set(vals).size===vals.length&&vals.reduce((a,b)=>a+b,0)===Number(target),true,null);
}
function auditKakuro(p){
  const n=Number(p.size),white=[],index=new Map();for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(p.mask?.[r]?.[c]){index.set(r+':'+c,white.length);white.push([r,c]);}
  const domains=white.map(([r,c])=>{const v=Number(p.displayGrid?.[r]?.[c]||0);return new Set(v?[v]:range(9));});
  const runs=(p.runs||[]).map(run=>({cells:run.cells.map(([r,c])=>index.get(r+':'+c)).filter(i=>i!=null),target:run.target}));
  const prop=d=>{let total=0,passes=0;for(let spin=0;spin<80;spin++){passes++;let changed=0;for(const run of runs){const q=runAssignments(d,run.cells,run.target);if(!q.ok)return {ok:false,changed:total+changed,passes};changed+=q.changed;}total+=changed;if(!changed)return {ok:true,changed:total,passes};}return {ok:true,changed:total,passes};};
  return {...genericDeduce(domains,prop),engineId:'kakuro'};
}
function linePatterns(n,clue){
  if(clue.length===1&&Number(clue[0])===0)return [Array(n).fill(0)];const out=[];
  function rec(i,pos,row){if(i===clue.length){out.push(row.concat(Array(n-row.length).fill(0)));return;}const len=Number(clue[i]),remaining=clue.slice(i+1).reduce((a,b)=>a+Number(b),0)+Math.max(0,clue.length-i-1),max=n-len-remaining;for(let s=pos;s<=max;s++){const next=row.concat(Array(s-row.length).fill(0),Array(len).fill(1));if(i<clue.length-1)next.push(0);rec(i+1,next.length,next);}}
  rec(0,0,[]);return out;
}
function auditNonogram(p){
  const n=Number(p.size),domains=Array.from({length:n*n},()=>new Set([0,1])),rows=(p.rowClues||[]).map(c=>linePatterns(n,c)),cols=(p.colClues||[]).map(c=>linePatterns(n,c));
  const prop=d=>{let total=0,passes=0;for(let spin=0;spin<100;spin++){passes++;let changed=0;
    for(let r=0;r<n;r++){const viable=rows[r].filter(pat=>pat.every((v,c)=>d[key(r,c,n)].has(v)));if(!viable.length)return {ok:false,changed:total+changed,passes};for(let c=0;c<n;c++){const allow=new Set(viable.map(x=>x[c]));const q=keepOnly(d[key(r,c,n)],allow);if(q<0)return {ok:false,changed:total+changed,passes};changed+=q;}}
    for(let c=0;c<n;c++){const viable=cols[c].filter(pat=>pat.every((v,r)=>d[key(r,c,n)].has(v)));if(!viable.length)return {ok:false,changed:total+changed,passes};for(let r=0;r<n;r++){const allow=new Set(viable.map(x=>x[r]));const q=keepOnly(d[key(r,c,n)],allow);if(q<0)return {ok:false,changed:total+changed,passes};changed+=q;}}
    total+=changed;if(!changed)return {ok:true,changed:total,passes};
  }return {ok:true,changed:total,passes};};
  return {...genericDeduce(domains,prop),engineId:'nonogram'};
}
function adjacencyPathAudit(p,diagonal=false){
  const n=Number(p.size),Nn=n*n,cells=Array.from({length:Nn},(_,i)=>i),domains=Array.from({length:Nn},()=>new Set(cells));
  const givens=(p.givens||[]).map(g=>({v:Number(g.v??g.value),i:key(Number(g.r),Number(g.c),n)}));
  for(const g of givens){domains[g.v-1].clear();domains[g.v-1].add(g.i);}
  const neigh=i=>{const r=Math.floor(i/n),c=i%n,out=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;if(!diagonal&&Math.abs(dr)+Math.abs(dc)!==1)continue;const rr=r+dr,cc=c+dc;if(rr>=0&&rr<n&&cc>=0&&cc<n)out.push(key(rr,cc,n));}return out;};
  const neighborSets=cells.map(i=>new Set(neigh(i)));
  const all=Array.from({length:Nn},(_,i)=>i);
  const prop=d=>{let total=0,passes=0;for(let spin=0;spin<120;spin++){passes++;let changed=0;
    const q=allDiff(d,all);if(!q.ok)return {ok:false,changed:total+changed,passes};changed+=q.changed;
    for(let v=0;v<Nn;v++){
      let allow=new Set(d[v]);
      if(v>0)allow=new Set([...allow].filter(i=>[...d[v-1]].some(j=>neighborSets[i].has(j))));
      if(v<Nn-1)allow=new Set([...allow].filter(i=>[...d[v+1]].some(j=>neighborSets[i].has(j))));
      const x=keepOnly(d[v],allow);if(x<0)return {ok:false,changed:total+changed,passes};changed+=x;
    }
    total+=changed;if(!changed)return {ok:true,changed:total,passes};
  }return {ok:true,changed:total,passes};};
  return {...genericDeduce(domains,prop),engineId:p.engineId};
}
function visible(line){let m=0,c=0;for(const v of line)if(v>m){m=v;c++;}return c;}
const permCache=new Map();
function perms(n){if(permCache.has(n))return permCache.get(n);const out=[],a=range(n);function rec(pre,rest){if(!rest.length){out.push(pre);return;}for(let i=0;i<rest.length;i++)rec(pre.concat(rest[i]),rest.slice(0,i).concat(rest.slice(i+1)));}rec([],a);permCache.set(n,out);return out;}
function auditTowers(p){
  const n=Number(p.size),all=perms(n),rowSets=Array.from({length:n},(_,r)=>all.filter(x=>(!p.clues.left[r]||visible(x)===p.clues.left[r])&&(!p.clues.right[r]||visible(x.slice().reverse())===p.clues.right[r]))),domains=Array.from({length:n*n},()=>new Set(range(n)));
  const prop=d=>{let total=0,passes=0;for(let spin=0;spin<100;spin++){passes++;let changed=0;
    for(let r=0;r<n;r++){const viable=rowSets[r].filter(row=>row.every((v,c)=>d[key(r,c,n)].has(v)));if(!viable.length)return {ok:false,changed:total+changed,passes};for(let c=0;c<n;c++){const q=keepOnly(d[key(r,c,n)],new Set(viable.map(x=>x[c])));if(q<0)return {ok:false,changed:total+changed,passes};changed+=q;}}
    for(let c=0;c<n;c++){const q=allDiff(d,Array.from({length:n},(_,r)=>key(r,c,n)));if(!q.ok)return {ok:false,changed:total+changed,passes};changed+=q.changed;}
    total+=changed;if(!changed)return {ok:true,changed:total,passes};
  }return {ok:true,changed:total,passes};};
  return {...genericDeduce(domains,prop),engineId:'numbertowers'};
}
function auditKiller(p){
  const n=Number(p.size),domains=baseLatinDomains(n,p.displayGrid),units=latinUnits(n,Number(p.boxRows),Number(p.boxCols)),cages=(p.cages||[]).map(cg=>({cells:cg.cells.map(([r,c])=>key(r,c,n)),target:Number(cg.target)}));
  const extra=d=>{let changed=0;for(const cg of cages){const q=tupleSupport(d,cg.cells,vals=>new Set(vals).size===vals.length&&vals.reduce((a,b)=>a+b,0)===cg.target,true,null);if(!q.ok)return q;changed+=q.changed;}return {ok:true,changed};};
  return {...genericDeduce(domains,latinPropagator(n,units,extra)),engineId:'killersudoku'};
}
function hashiData(p){
  const islands=(p.islands||[]).map(x=>[Number(x.r),Number(x.c)]),edges=(p.edges||[]).map(e=>[Number(e.a),Number(e.b)]),clues=(p.islands||[]).map(x=>Number(x.clue)),inc=Array.from({length:islands.length},()=>[]),cross=Array.from({length:edges.length},()=>[]);
  edges.forEach(([a,b],i)=>{inc[a].push(i);inc[b].push(i);});
  function crosses(e1,e2){const [a,b]=e1.map(i=>islands[i]),[c,d]=e2.map(i=>islands[i]);const h1=a[0]===b[0],h2=c[0]===d[0];if(h1===h2)return false;const H=h1?[a,b]:[c,d],V=h1?[c,d]:[a,b],hr=H[0][0],hc1=Math.min(H[0][1],H[1][1]),hc2=Math.max(H[0][1],H[1][1]),vc=V[0][1],vr1=Math.min(V[0][0],V[1][0]),vr2=Math.max(V[0][0],V[1][0]);return hc1<vc&&vc<hc2&&vr1<hr&&hr<vr2;}
  for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++)if(crosses(edges[i],edges[j])){cross[i].push(j);cross[j].push(i);}
  return {islands,edges,clues,inc,cross};
}
function auditHashi(p){
  const h=hashiData(p),domains=h.edges.map(()=>new Set([0,1,2]));
  const prop=d=>{let total=0,passes=0;for(let spin=0;spin<120;spin++){passes++;let changed=0;
    for(let u=0;u<h.islands.length;u++){const es=h.inc[u],supports=es.map(()=>new Set()),vals=Array(es.length),target=h.clues[u];let any=false;function rec(pos,sum){if(pos===es.length){if(sum!==target)return;any=true;for(let i=0;i<es.length;i++)supports[i].add(vals[i]);return;}for(const v of d[es[pos]])if(sum+v<=target){vals[pos]=v;rec(pos+1,sum+v);}}rec(0,0);if(!any)return {ok:false,changed:total+changed,passes};for(let i=0;i<es.length;i++){const q=keepOnly(d[es[i]],supports[i]);if(q<0)return {ok:false,changed:total+changed,passes};changed+=q;}}
    for(let i=0;i<d.length;i++)if(!d[i].has(0))for(const j of h.cross[i]){const q=keepOnly(d[j],new Set([0]));if(q<0)return {ok:false,changed:total+changed,passes};changed+=q;}
    // The graph of edges that could still be positive must remain connected.
    const possible=h.edges.map((e,i)=>d[i].has(1)||d[i].has(2));const adj=Array.from({length:h.islands.length},()=>[]);h.edges.forEach(([a,b],i)=>{if(possible[i]){adj[a].push(b);adj[b].push(a);}});const seen=new Set([0]),stack=[0];while(stack.length){const u=stack.pop();for(const v of adj[u])if(!seen.has(v)){seen.add(v);stack.push(v);}}if(seen.size!==h.islands.length)return {ok:false,changed:total+changed,passes};
    // If excluding an undecided edge disconnects the remaining possible graph, it must be positive.
    for(let ei=0;ei<h.edges.length;ei++)if(d[ei].has(0)&&(d[ei].has(1)||d[ei].has(2))){const adj2=Array.from({length:h.islands.length},()=>[]);h.edges.forEach(([a,b],j)=>{if(j!==ei&&(d[j].has(1)||d[j].has(2))){adj2[a].push(b);adj2[b].push(a);}});const s2=new Set([0]),st=[0];while(st.length){const u=st.pop();for(const v of adj2[u])if(!s2.has(v)){s2.add(v);st.push(v);}}if(s2.size!==h.islands.length){if(d[ei].delete(0))changed++;}}
    total+=changed;if(!changed)return {ok:true,changed:total,passes};
  }return {ok:true,changed:total,passes};};
  const r=genericDeduce(domains,prop);if(r.solved){const vals=domains.map(only),adj=Array.from({length:h.islands.length},()=>[]);h.edges.forEach(([a,b],i)=>{if(vals[i]>0){adj[a].push(b);adj[b].push(a);}});const seen=new Set([0]),stack=[0];while(stack.length){const u=stack.pop();for(const v of adj[u])if(!seen.has(v)){seen.add(v);stack.push(v);}}if(seen.size!==h.islands.length)r.solved=false;}
  return {...r,engineId:'hashi'};
}
function auditSumplete(p){
  const n=Number(p.size),domains=Array.from({length:n*n},()=>new Set([0,1]));
  function masks(vals,target){const out=[];for(let m=0;m<(1<<n);m++){let s=0,row=[];for(let i=0;i<n;i++){const b=(m>>i)&1;row.push(b);if(b)s+=Number(vals[i]);}if(Math.abs(s-Number(target))<1e-9)out.push(row);}return out;}
  const rowP=Array.from({length:n},(_,r)=>masks(p.valueGrid[r],p.rowTargets[r])),colP=Array.from({length:n},(_,c)=>masks(Array.from({length:n},(_,r)=>p.valueGrid[r][c]),p.colTargets[c]));
  const prop=d=>{let total=0,passes=0;for(let spin=0;spin<100;spin++){passes++;let changed=0;
    for(let r=0;r<n;r++){const v=rowP[r].filter(x=>x.every((b,c)=>d[key(r,c,n)].has(b)));if(!v.length)return {ok:false,changed:total+changed,passes};for(let c=0;c<n;c++){const q=keepOnly(d[key(r,c,n)],new Set(v.map(x=>x[c])));if(q<0)return {ok:false,changed:total+changed,passes};changed+=q;}}
    for(let c=0;c<n;c++){const v=colP[c].filter(x=>x.every((b,r)=>d[key(r,c,n)].has(b)));if(!v.length)return {ok:false,changed:total+changed,passes};for(let r=0;r<n;r++){const q=keepOnly(d[key(r,c,n)],new Set(v.map(x=>x[r])));if(q<0)return {ok:false,changed:total+changed,passes};changed+=q;}}
    total+=changed;if(!changed)return {ok:true,changed:total,passes};
  }return {ok:true,changed:total,passes};};
  return {...genericDeduce(domains,prop),engineId:'sumplete'};
}
function shikakuCandidates(p){
  const rows=Number(p.rows||p.size),cols=Number(p.cols||p.size),clues=p.clues||[],out=[];
  for(const clue of clues){const list=[],area=Number(clue.area);for(let h=1;h<=area;h++)if(area%h===0){const w=area/h;if(h>rows||w>cols)continue;for(let r=Math.max(0,clue.r-h+1);r<=Math.min(clue.r,rows-h);r++)for(let c=Math.max(0,clue.c-w+1);c<=Math.min(clue.c,cols-w);c++){let bad=false;for(const q of clues)if(q!==clue&&q.r>=r&&q.r<r+h&&q.c>=c&&q.c<c+w){bad=true;break;}if(!bad){const cells=[];for(let rr=r;rr<r+h;rr++)for(let cc=c;cc<c+w;cc++)cells.push(key(rr,cc,cols));list.push({r,c,h,w,cells:new Set(cells)});}}}out.push(list);}
  return {rows,cols,clues,candidates:out};
}
function auditShikaku(p){
  const s=shikakuCandidates(p),domains=s.candidates.map(x=>new Set(x.map((_,i)=>i)));
  function prop(d){let total=0,passes=0;for(let spin=0;spin<100;spin++){passes++;let changed=0;
    // fixed rectangles remove overlapping candidates from every other clue.
    for(let i=0;i<d.length;i++)if(d[i].size===1){const ri=s.candidates[i][only(d[i])];for(let j=0;j<d.length;j++)if(j!==i)for(const cj of [...d[j]]){const rj=s.candidates[j][cj];if([...ri.cells].some(x=>rj.cells.has(x))){d[j].delete(cj);changed++;if(!d[j].size)return {ok:false,changed:total+changed,passes};}}}
    // Every board cell must be covered exactly once. A sole candidate covering a cell is forced.
    for(let cell=0;cell<s.rows*s.cols;cell++){const opts=[];for(let i=0;i<d.length;i++)for(const ci of d[i])if(s.candidates[i][ci].cells.has(cell))opts.push([i,ci]);if(!opts.length)return {ok:false,changed:total+changed,passes};if(opts.length===1){const [i,ci]=opts[0];const q=setOnly(d[i],ci);if(q<0)return {ok:false,changed:total+changed,passes};changed+=q;}}
    total+=changed;if(!changed)return {ok:true,changed:total,passes};
  }return {ok:true,changed:total,passes};}
  // one-level contradiction on rectangle choices
  let passes=0,indirectEliminations=0;for(let round=0;round<120;round++){const q=prop(domains);passes+=q.passes||1;if(!q.ok)return {solved:false,contradiction:true,passes,indirectEliminations,engineId:'shikaku'};if(domains.every(x=>x.size===1))return {solved:true,passes,indirectEliminations,engineId:'shikaku'};if(q.changed)continue;let elim=false;outer:for(let i=0;i<domains.length;i++)if(domains[i].size>1)for(const v of [...domains[i]]){const t=domains.map(x=>new Set(x));t[i].clear();t[i].add(v);if(!prop(t).ok){domains[i].delete(v);indirectEliminations++;elim=true;break outer;}}if(!elim)break;}return {solved:domains.every(x=>x.size===1),passes,indirectEliminations,engineId:'shikaku'};
}
function alphaColumns(p){
  const adds=p.addends||[],result=String(p.result||''),max=Math.max(result.length,...adds.map(x=>x.length)),cols=[];
  for(let k=0;k<max;k++){cols.push({add:adds.map(w=>w[w.length-1-k]).filter(Boolean),res:result[result.length-1-k]||null});}
  return cols;
}
function auditAlpha(p){
  const letters=[...new Set([...(p.addends||[]).join('').split(''),...String(p.result||'').split('')])],idx=new Map(letters.map((x,i)=>[x,i])),domains=letters.map(ch=>new Set(range(10).map(x=>x-1))),leading=new Set([...(p.addends||[]).map(w=>w[0]),String(p.result||'')[0]].filter(Boolean));
  for(let i=0;i<letters.length;i++)if(leading.has(letters[i]))domains[i].delete(0);
  for(const [ch,v] of Object.entries(p.givens||{})){const i=idx.get(ch);if(i!=null){domains[i].clear();domains[i].add(Number(v));}}
  const cols=alphaColumns(p),carry=Array.from({length:cols.length+1},(_,i)=>new Set(i===0||i===cols.length?[0]:range((p.addends||[]).length).map(x=>x-1)));
  function prop(d){let total=0,passes=0;for(let spin=0;spin<120;spin++){passes++;let changed=0;
    const q=allDiff(d,Array.from({length:d.length},(_,i)=>i));if(!q.ok)return {ok:false,changed:total+changed,passes};changed+=q.changed;
    for(let ci=0;ci<cols.length;ci++){const col=cols[ci],vars=[...new Set(col.add.concat(col.res?[col.res]:[]))],varIdx=vars.map(ch=>idx.get(ch)),supports=varIdx.map(()=>new Set()),cinSup=new Set(),coutSup=new Set(),assign=new Map(),used=new Set();let any=false;
      function rec(pos){if(pos===vars.length){for(const cin of carry[ci])for(const cout of carry[ci+1]){const sum=col.add.reduce((s,ch)=>s+assign.get(ch),0)+cin,res=col.res?assign.get(col.res):0;if(sum===res+10*cout){any=true;varIdx.forEach((vi,k)=>supports[k].add(assign.get(vars[k])));cinSup.add(cin);coutSup.add(cout);}}return;}
        const ch=vars[pos],vi=idx.get(ch);for(const v of d[vi]){if(used.has(v))continue;assign.set(ch,v);used.add(v);rec(pos+1);used.delete(v);assign.delete(ch);}}
      rec(0);if(!any)return {ok:false,changed:total+changed,passes};
      for(let k=0;k<varIdx.length;k++){const z=keepOnly(d[varIdx[k]],supports[k]);if(z<0)return {ok:false,changed:total+changed,passes};changed+=z;}
      let z=keepOnly(carry[ci],cinSup);if(z<0)return {ok:false,changed:total+changed,passes};changed+=z;z=keepOnly(carry[ci+1],coutSup);if(z<0)return {ok:false,changed:total+changed,passes};changed+=z;
    }
    total+=changed;if(!changed)return {ok:true,changed:total,passes};
  }return {ok:true,changed:total,passes};}
  const res=genericDeduce(domains,prop);return {...res,engineId:'alphametics'};
}
function sumGridAudit(p){
  const vals=range(9),domains=Array.from({length:9},()=>new Set(vals));for(const g of p.givens||[]){const i=Number(g.i??g.index??(Number(g.r)*3+Number(g.c))),v=Number(g.v??g.value);if(Number.isInteger(i)&&i>=0&&i<9&&v)domains[i]=new Set([v]);}
  const constraints=[];const W=[[0,1,3,4],[1,2,4,5],[3,4,6,7],[4,5,7,8]];(p.windowTotals||[]).forEach((t,i)=>constraints.push({cells:W[i],target:Number(t)}));if(p.engineId==='linkedsum')for(const g of p.groups||[])constraints.push({cells:(g.cells||[]).map(Number),target:Number(g.target)});
  const prop=d=>{let total=0,passes=0;for(let spin=0;spin<100;spin++){passes++;let changed=0;let q=allDiff(d,Array.from({length:9},(_,i)=>i));if(!q.ok)return {ok:false,changed:total+changed,passes};changed+=q.changed;for(const c of constraints){q=tupleSupport(d,c.cells,x=>x.reduce((a,b)=>a+b,0)===c.target,true,null);if(!q.ok)return {ok:false,changed:total+changed,passes};changed+=q.changed;}total+=changed;if(!changed)return {ok:true,changed:total,passes};}return {ok:true,changed:total,passes};};
  return {...genericDeduce(domains,prop),engineId:p.engineId};
}
function perimeterCandidates(p){
  const n=Number(p.size),clues=p.clues||[],blocked=new Set(clues.map(q=>Number(q.idx))),all=[];
  const neigh=i=>{const r=Math.floor(i/n),c=i%n,o=[];if(r)o.push(i-n);if(r<n-1)o.push(i+n);if(c)o.push(i-1);if(c<n-1)o.push(i+1);return o;};
  const per=s=>{let z=0;for(const i of s){const r=Math.floor(i/n),c=i%n;for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){const rr=r+dr,cc=c+dc;if(rr<0||rr>=n||cc<0||cc>=n||!s.has(key(rr,cc,n)))z++;}}return z;};
  for(const clue of clues){const start=Number(clue.idx),target=Number(clue.perimeter),out=[],seen=new Set(),maxArea=Math.min(n*n-blocked.size+1,Math.max(1,Math.floor(target*target/16)+1));function rec(s){const k=[...s].sort((a,b)=>a-b).join(',');if(seen.has(k)||out.length>=3500)return;seen.add(k);if(per(s)===target)out.push(new Set(s));if(s.size>=maxArea)return;const fr=new Set();for(const cell of s)for(const q of neigh(cell))if(!s.has(q)&&(!blocked.has(q)||q===start))fr.add(q);for(const q of fr){const t=new Set(s);t.add(q);rec(t);}}rec(new Set([start]));all.push(out);}
  return {n,all};
}
function exactCoverAudit(p,kind){
  const x=perimeterCandidates(p),domains=x.all.map(a=>new Set(a.map((_,i)=>i)));
  function prop(d){let total=0,passes=0;for(let spin=0;spin<100;spin++){passes++;let changed=0;
    for(let i=0;i<d.length;i++)if(d[i].size===1){const a=x.all[i][only(d[i])];for(let j=0;j<d.length;j++)if(j!==i)for(const cj of [...d[j]])if([...a].some(z=>x.all[j][cj].has(z))){d[j].delete(cj);changed++;if(!d[j].size)return {ok:false,changed:total+changed,passes};}}
    for(let cell=0;cell<x.n*x.n;cell++){const opts=[];for(let i=0;i<d.length;i++)for(const ci of d[i])if(x.all[i][ci].has(cell))opts.push([i,ci]);if(!opts.length)return {ok:false,changed:total+changed,passes};if(opts.length===1){const [i,ci]=opts[0],q=setOnly(d[i],ci);if(q<0)return {ok:false,changed:total+changed,passes};changed+=q;}}
    total+=changed;if(!changed)return {ok:true,changed:total,passes};
  }return {ok:true,changed:total,passes};}
  let passes=0,indirectEliminations=0;for(let round=0;round<120;round++){const q=prop(domains);passes+=q.passes||1;if(!q.ok)return {solved:false,contradiction:true,passes,indirectEliminations,engineId:kind};if(domains.every(s=>s.size===1))return {solved:true,passes,indirectEliminations,engineId:kind};if(q.changed)continue;let e=false;outer:for(let i=0;i<domains.length;i++)if(domains[i].size>1)for(const v of [...domains[i]]){const t=domains.map(s=>new Set(s));t[i]=new Set([v]);if(!prop(t).ok){domains[i].delete(v);indirectEliminations++;e=true;break outer;}}if(!e)break;}return {solved:domains.every(s=>s.size===1),passes,indirectEliminations,engineId:kind};
}
function auditExisting(p){
  if(p.engineId==='takuzu'&&N.TAKUZU?.solveByLogic){const q=N.TAKUZU.solveByLogic(p.displayGrid,p.solutionGrid);return {solved:!!q.solved,passes:q.passes||0,indirectEliminations:0,engineId:p.engineId};}
  if(p.engineId==='mathsmines'&&N.V140?.MINES?.logic){const q=N.V140.MINES.logic(p.size,p.clues,p.gemCount,new Set(p.solutionGems));return {solved:!!q.solved,passes:q.passes||0,indirectEliminations:0,engineId:p.engineId};}
  return null;
}
const AUDIT={
  sudoku:auditSudoku,futoshiki:auditFutoshiki,arithmeticcages:auditArithmeticCages,kakuro:auditKakuro,nonogram:auditNonogram,
  numberpath:p=>adjacencyPathAudit(p,false),diagonalpath:p=>adjacencyPathAudit(p,true),numbertowers:auditTowers,killersudoku:auditKiller,
  hashi:auditHashi,sumplete:auditSumplete,shikaku:auditShikaku,alphametics:auditAlpha,cornersum:sumGridAudit,linkedsum:sumGridAudit,
  perimeterregions:p=>exactCoverAudit(p,'perimeterregions')
};
const IDS=new Set([...Object.keys(AUDIT),'takuzu','mathsmines','colourlogic']);
function audit(p){
  if(!p||p.error)return {solved:false,error:p?.error||'missing puzzle',engineId:p?.engineId};
  const old=auditExisting(p);if(old)return old;
  if(p.engineId==='colourlogic'&&global.TT99ArithmeticGames?.COLOURLOGIC_DEDUCTION?.audit)return global.TT99ArithmeticGames.COLOURLOGIC_DEDUCTION.audit(p);
  const fn=AUDIT[p.engineId];if(!fn)return {solved:true,notApplicable:true,engineId:p.engineId};
  try{return fn(p);}catch(e){return {solved:false,error:e?.message||String(e),engineId:p.engineId};}
}
function addGridGiven(p,r,c,v){
  p.displayGrid[r][c]=v;
  if(p.engineId==='sudoku'){
    const n=Number(p.size);p.givenSet=[];p.missingSet=[];
    for(let rr=0;rr<n;rr++)for(let cc=0;cc<n;cc++)(Number(p.displayGrid[rr][cc]||0)?p.givenSet:p.missingSet).push(rr+':'+cc);
    return p;
  }
  p.givens=p.givens||[];if(!p.givens.some(g=>Number(g.r)===r&&Number(g.c)===c))p.givens.push({r,c,v});return p;
}
function strengthenByGivens(p,maxAdds=20){
  if(!p.solutionGrid||!p.displayGrid)return p;const n=Number(p.size),order=[];
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!Number(p.displayGrid[r][c]||0))order.push([r,c]);
  for(let i=0;i<order.length&&i<maxAdds;i++){const [r,c]=order[i];addGridGiven(p,r,c,p.solutionGrid[r][c]);const q=audit(p);if(q.solved){p.deductionStats={...q,extraClues:i+1};return p;}}
  return p;
}
function strengthenAlpha(p){
  const letters=Object.keys(p.solution||{}).sort(),givens=p.givens||(p.givens={});let added=0;for(const ch of letters){if(givens[ch]!=null)continue;givens[ch]=p.solution[ch];added++;const q=audit(p);if(q.solved){p.deductionStats={...q,extraClues:added};return p;}}return p;
}
function towerFullClues(p){
  const sol=p.solutionGrid,n=Number(p.size);if(!sol)return p;const full={top:[],bottom:[],left:[],right:[]};for(let r=0;r<n;r++){full.left[r]=visible(sol[r]);full.right[r]=visible(sol[r].slice().reverse());}for(let c=0;c<n;c++){const col=sol.map(row=>row[c]);full.top[c]=visible(col);full.bottom[c]=visible(col.slice().reverse());}
  const slots=[];for(const side of ['top','bottom','left','right'])for(let i=0;i<n;i++)if(!p.clues[side][i])slots.push([side,i]);for(let k=0;k<slots.length;k++){const [s,i]=slots[k];p.clues[s][i]=full[s][i];const q=audit(p);if(q.solved){p.deductionStats={...q,extraClues:k+1};return p;}}return p;
}
function strengthenPath(p,maxAdds=20){
  const n=Number(p.size),present=new Set((p.givens||[]).map(g=>Number(g.v??g.value))),pos=[];for(let r=0;r<n;r++)for(let c=0;c<n;c++)pos[Number(p.solutionGrid[r][c])]=[r,c];
  for(let v=1,added=0;v<=n*n&&added<maxAdds;v++){if(present.has(v))continue;const [r,c]=pos[v];p.givens.push({r,c,v,value:v});p.displayGrid[r][c]=v;present.add(v);added++;const q=audit(p);if(q.solved){p.deductionStats={...q,extraClues:added};return p;}}return p;
}
function strengthenSumGrid(p){
  const sol=Array.isArray(p.solution)?p.solution:(p.solutionGrid||[]).flat(),have=new Set((p.givens||[]).map(g=>Number(g.i??g.index??(Number(g.r)*3+Number(g.c)))));p.givens=p.givens||[];
  for(let i=0,added=0;i<9;i++)if(!have.has(i)){p.givens.push({index:i,r:Math.floor(i/3),c:i%3,v:Number(sol[i])});added++;if(p.displayGrid?.[Math.floor(i/3)])p.displayGrid[Math.floor(i/3)][i%3]=Number(sol[i]);const q=audit(p);if(q.solved){p.deductionStats={...q,extraClues:added};return p;}}return p;
}
const BASE_N_GENERATE=N.generate.bind(N),BASE_N_VALIDATE=N.validate.bind(N);
const RETRY=new Set(['arithmeticcages','nonogram','hashi','sumplete','shikaku','perimeterregions']);
function ensureDeduction(id,settings,seed){
  let p=BASE_N_GENERATE(id,settings,seed);if(!p||p.error||!IDS.has(id))return p;let q=audit(p);if(q.solved){p.deductionStats=q;return p;}
  if(['futoshiki','kakuro','killersudoku'].includes(id))p=strengthenByGivens(p,id==='killersudoku'?18:14);
  else if(id==='alphametics')p=strengthenAlpha(p);
  else if(['numberpath','diagonalpath'].includes(id))p=strengthenPath(p,Math.max(8,Number(p.size)||5));
  else if(id==='numbertowers')p=towerFullClues(p);
  else if(['cornersum','linkedsum'].includes(id))p=strengthenSumGrid(p);
  q=audit(p);if(q.solved){p.deductionStats=p.deductionStats||q;return p;}
  if(RETRY.has(id))for(let attempt=1;attempt<=18;attempt++){const cand=BASE_N_GENERATE(id,settings,seed+':deduction:'+attempt);if(!cand||cand.error)continue;const a=audit(cand);if(a.solved){cand.seed=seed;cand.deductionStats=a;return cand;}}
  return {...p,error:'A deduction-solvable '+(p.title||id)+' puzzle could not be built. Generate another version.',deductionStats:q};
}
N.generate=function(id,settings,seed){return IDS.has(id)&&id!=='colourlogic'&&id!=='sudoku'?ensureDeduction(id,settings,seed):BASE_N_GENERATE(id,settings,seed);};
N.validate=function(p){const base=BASE_N_VALIDATE(p);if(!base?.ok||!p||!IDS.has(p.engineId)||p.engineId==='colourlogic'||p.engineId==='sudoku')return base;const q=audit(p);return q.solved?{...base,deductionSolvable:true,deductionPasses:q.passes||0,indirectEliminations:q.indirectEliminations||0}:{ok:false,error:(q.error||p.engineId+' requires an arbitrary branch; deduction audit stalled')};};

// Sudoku lives in games-engine rather than TT99NumberLogicGames, so wrap both
// public Sudoku entry points after games-engine has been created.
const BASE_G_SUDOKU=G.generateSudoku.bind(G),BASE_G_ACTIVITY=G.generateActivity.bind(G),BASE_G_PACK=G.generatePack.bind(G);
function ensureSudoku(settings,seed){
  let p=BASE_G_SUDOKU(settings,seed),q=auditSudoku(p);if(q.solved){p.deductionStats=q;return p;}
  p=strengthenByGivens(p,Math.max(10,Number(p.size)||6));q=auditSudoku(p);p.deductionStats=q;
  return q.solved?p:{...p,error:'A deduction-solvable '+(p.title||'Sudoku')+' puzzle could not be built. Generate another version.'};
}
G.generateSudoku=ensureSudoku;
G.generateMiniSudoku=ensureSudoku;
G.generateActivity=function(id,settings,seed,customVocabulary){
  if(id==='sudoku')return ensureSudoku(settings,seed);
  return BASE_G_ACTIVITY(id,settings,seed,customVocabulary);
};
G.generatePack=function(settings,seed,customVocabulary){
  const pack=BASE_G_PACK(settings,seed,customVocabulary);
  for(const sheet of pack?.sheets||[])for(let i=0;i<(sheet.activities||[]).length;i++){
    const p=sheet.activities[i];if(p?.engineId!=='sudoku'||p.error)continue;
    let q=auditSudoku(p);if(!q.solved)p=strengthenByGivens(p,Math.max(10,Number(p.size)||6)),q=auditSudoku(p);
    p.deductionStats=q;if(!q.solved)p.error='A deduction-solvable '+(p.title||'Sudoku')+' puzzle could not be built. Generate another version.';
    sheet.activities[i]=p;
  }
  return pack;
};
G.DEDUCTION={VERSION,IDS:[...IDS],audit,solvers:AUDIT,ensureSudoku,policy:'propagation + all-different support + one-level contradiction elimination; no recursive guessing'};
N.DEDUCTION=G.DEDUCTION;
N.__deductionGateV210=true;
if(typeof module!=='undefined'&&module.exports)module.exports=G.DEDUCTION;
})(typeof globalThis!=='undefined'?globalThis:this);
