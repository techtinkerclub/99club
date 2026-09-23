/* 99 Club Studio · Numeric logic puzzle engines
 * v1.0.0 — Kakuro / Futoshiki / Arithmetic Cages / Nonograms / Number Paths.
 * Pure client-side deterministic generators. No DOM dependency.
 */
(function(global){
  'use strict';

  const VERSION='1.2.0';
  const TOPICS=['number_place_value','calculation','geometry','algebra'];
  const choiceOptions=values=>values.map(([value,label])=>({value,label}));
  const compat=(excellent=[],reasonable=[])=>Object.fromEntries(['number_place_value','calculation','fractions','decimals_percentages','ratio_proportion','measurement','geometry','statistics','algebra'].map(t=>[t,excellent.includes(t)?'excellent':reasonable.includes(t)?'reasonable':'poor']));

  const DEFINITIONS={
    kakuro:{id:'kakuro',title:'Kakuro · Cross Sums',group:'Numeric logic',kind:'independent',printableMode:'grid',answerSheetSupport:true,workedExampleSupport:true,needsCutting:false,needsDice:false,needsPartner:false,
      supportedAnswerTypes:['number','logic'],difficultyOptions:['easy','standard','challenge'],defaultSettings:{difficulty:'standard',gridSize:'auto',givenLevel:'auto'},
      settingsSchema:[{id:'difficulty',type:'difficulty',label:'Difficulty'},{id:'gridSize',type:'select',label:'Grid size',options:choiceOptions([['auto','Auto'],['5','5 × 5'],['6','6 × 6'],['7','7 × 7'],['9','9 × 9']])},{id:'givenLevel',type:'select',label:'Starting digits',options:choiceOptions([['auto','Auto'],['more','More'],['balanced','Balanced'],['minimum','Minimum needed for one solution']])}],
      difficultyDescriptions:{easy:'Small cross-sums + a few starting digits',standard:'More intersections, fewer starting digits',challenge:'Can use a 9 × 9 grid with the minimum starter digits needed for one solution'},topicYearMin:{calculation:3},compatibility:compat(['calculation'],[])},

    futoshiki:{id:'futoshiki',title:'Futoshiki · Inequality Grid',group:'Numeric logic',kind:'independent',printableMode:'grid',answerSheetSupport:true,workedExampleSupport:true,needsCutting:false,needsDice:false,needsPartner:false,
      supportedAnswerTypes:['number','logic'],difficultyOptions:['easy','standard','challenge'],defaultSettings:{difficulty:'standard',gridSize:'auto',signLevel:'auto',givenLevel:'auto'},
      settingsSchema:[{id:'difficulty',type:'difficulty',label:'Difficulty'},{id:'gridSize',type:'select',label:'Grid size',options:choiceOptions([['auto','Auto'],['4','4 × 4'],['5','5 × 5'],['6','6 × 6']])},{id:'signLevel',type:'select',label:'Inequality signs',options:choiceOptions([['auto','Auto'],['more','More signs'],['balanced','Balanced'],['fewer','Fewer signs']])},{id:'givenLevel',type:'select',label:'Given numbers',options:choiceOptions([['auto','Auto'],['more','More numbers'],['balanced','Balanced'],['fewer','Fewer numbers']])}],
      difficultyDescriptions:{easy:'4 × 4 with more clues',standard:'Balanced inequalities + givens',challenge:'Larger grids with fewer givens'},topicYearMin:{number_place_value:2,calculation:2},compatibility:compat(['number_place_value'],['calculation'])},

    arithmeticcages:{id:'arithmeticcages',title:'Arithmetic Cages',group:'Numeric logic',kind:'independent',printableMode:'grid',answerSheetSupport:true,workedExampleSupport:true,needsCutting:false,needsDice:false,needsPartner:false,
      supportedAnswerTypes:['number','logic','arithmetic'],difficultyOptions:['easy','standard','challenge'],defaultSettings:{difficulty:'standard',gridSize:'auto',operations:'auto',cageSize:'auto'},
      settingsSchema:[{id:'difficulty',type:'difficulty',label:'Difficulty'},{id:'gridSize',type:'select',label:'Grid size',options:choiceOptions([['auto','Auto'],['4','4 × 4'],['5','5 × 5'],['6','6 × 6']])},{id:'operations',type:'select',label:'Cage operations',options:choiceOptions([['auto','Auto for year'],['add','Addition only'],['addsub','Addition + subtraction'],['mixed','+ − × ÷']])},{id:'cageSize',type:'select',label:'Cage size',options:choiceOptions([['auto','Auto'],['small','Mostly 1–2 cells'],['balanced','Balanced'],['larger','More 2–3 cell cages']])}],
      difficultyDescriptions:{easy:'Small grid and mostly addition',standard:'Mixed +/− and some multiplication',challenge:'Larger cages and mixed operations'},topicYearMin:{calculation:3,algebra:6},compatibility:compat(['calculation'],['algebra'])},

    nonogram:{id:'nonogram',title:'Nonogram · Number Picture',group:'Numeric logic',kind:'independent',printableMode:'grid',answerSheetSupport:true,workedExampleSupport:true,needsCutting:false,needsDice:false,needsPartner:false,
      supportedAnswerTypes:['pattern','logic'],difficultyOptions:['easy','standard','challenge'],defaultSettings:{difficulty:'standard',gridSize:'auto',pictureStyle:'auto'},
      settingsSchema:[{id:'difficulty',type:'difficulty',label:'Difficulty'},{id:'gridSize',type:'select',label:'Grid size',options:choiceOptions([['auto','Auto'],['5','5 × 5'],['7','7 × 7'],['10','10 × 10']])},{id:'pictureStyle',type:'select',label:'Picture style',options:choiceOptions([['auto','Auto'],['symmetric','Symmetric pattern'],['geometric','Geometric pattern'],['random','Abstract pattern']])}],
      difficultyDescriptions:{easy:'5 × 5 and simpler clue runs',standard:'7 × 7 picture',challenge:'Can use 10 × 10'},topicYearMin:{number_place_value:2,geometry:2},compatibility:compat(['number_place_value'],['geometry'])},

    numberpath:{id:'numberpath',title:'Number Path',group:'Numeric logic',kind:'independent',printableMode:'grid',answerSheetSupport:true,workedExampleSupport:true,needsCutting:false,needsDice:false,needsPartner:false,
      supportedAnswerTypes:['sequence','logic'],difficultyOptions:['easy','standard','challenge'],defaultSettings:{difficulty:'standard',gridSize:'auto',clueLevel:'auto'},
      settingsSchema:[{id:'difficulty',type:'difficulty',label:'Difficulty'},{id:'gridSize',type:'select',label:'Grid size',options:choiceOptions([['auto','Auto'],['4','4 × 4'],['5','5 × 5'],['6','6 × 6']])},{id:'clueLevel',type:'select',label:'Numbers shown',options:choiceOptions([['auto','Auto'],['more','More shown'],['balanced','Balanced'],['fewer','Fewer shown']])}],
      difficultyDescriptions:{easy:'Shorter path with many anchors',standard:'5 × 5 with balanced anchors',challenge:'Larger path with fewer anchors'},topicYearMin:{number_place_value:1,calculation:2,algebra:6},compatibility:compat(['number_place_value'],['calculation','algebra'])}
  };

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function hashString(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function rngFromSeed(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function randInt(rng,a,b){return Math.floor(rng()*(b-a+1))+a;}
  function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function choose(arr,rng){return arr[Math.floor(rng()*arr.length)];}
  function fmt(v){const n=Number(v);if(!Number.isFinite(n))return String(v??'');const r=Math.round(n*1000)/1000;return Number.isInteger(r)?String(r):String(r).replace(/0+$/,'').replace(/\.$/,'');}
  function years(settings){return {min:clamp(Number(settings?.minYear)||1,1,6),max:clamp(Number(settings?.maxYear)||6,1,6)};}
  function normalise(id,raw={}){const d=DEFINITIONS[id]?.defaultSettings||{},out={...d,...raw};out.difficulty=['easy','standard','challenge'].includes(out.difficulty)?out.difficulty:'standard';return out;}
  function latinSolution(n,rng){const symbols=shuffle(Array.from({length:n},(_,i)=>i+1),rng),rows=shuffle(Array.from({length:n},(_,i)=>i),rng),cols=shuffle(Array.from({length:n},(_,i)=>i),rng),shift=randInt(rng,0,n-1);return rows.map(r=>cols.map(c=>symbols[(r+c+shift)%n]));}
  function cells(n){return Array.from({length:n*n},(_,i)=>[Math.floor(i/n),i%n]);}
  function neighbours(r,c,n){return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([rr,cc])=>rr>=0&&cc>=0&&rr<n&&cc<n);}

  // ---------- Futoshiki ----------
  function futoshikiSize(settings,o){const y=years(settings).max;if(o.gridSize!=='auto')return Number(o.gridSize);if(o.difficulty==='easy'||y<=2)return 4;if(o.difficulty==='challenge'&&y>=5)return 6;return 5;}
  function inequalityH(a,b){return a<b?'<':'>';}
  function inequalityV(a,b){return a<b?'^':'v';} // ^ means upper is smaller; v means lower is smaller
  function countFutoshiki(n,givens,hSigns,vSigns,limit=2){
    const grid=Array.from({length:n},()=>Array(n).fill(0));for(const g of givens)grid[g.r][g.c]=g.v;let count=0;
    function valid(r,c,v){for(let i=0;i<n;i++){if(i!==c&&grid[r][i]===v)return false;if(i!==r&&grid[i][c]===v)return false;}
      const checks=[[r,c-1,'h',c-1],[r,c+1,'h',c],[r-1,c,'v',r-1],[r+1,c,'v',r]];
      for(const [rr,cc,type,idx] of checks){if(rr<0||cc<0||rr>=n||cc>=n||!grid[rr][cc])continue;let sign;if(type==='h')sign=hSigns[r]?.[idx];else sign=vSigns[idx]?.[c];if(!sign)continue;const other=grid[rr][cc];if(type==='h'){const left=cc<c?other:v,right=cc<c?v:other;if(sign==='<'&&!(left<right))return false;if(sign==='>'&&!(left>right))return false;}else{const top=rr<r?other:v,bottom=rr<r?v:other;if(sign==='^'&&!(top<bottom))return false;if(sign==='v'&&!(top>bottom))return false;}}
      return true;}
    function nextCell(){let best=null,bestCand=null;for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!grid[r][c]){const cand=[];for(let v=1;v<=n;v++)if(valid(r,c,v))cand.push(v);if(!cand.length)return [r,c,[]];if(!bestCand||cand.length<bestCand.length){best=[r,c];bestCand=cand;if(cand.length===1)return [r,c,cand];}}return best?[...best,bestCand]:null;}
    function rec(){if(count>=limit)return;const nxt=nextCell();if(!nxt){count++;return;}const [r,c,cand]=nxt;if(!cand.length)return;for(const v of cand){grid[r][c]=v;rec();grid[r][c]=0;if(count>=limit)return;}}
    rec();return count;
  }

  function solveFutoshikiByLogic(n,givens,hSigns,vSigns){
    const all=()=>new Set(Array.from({length:n},(_,i)=>i+1)),domains=Array.from({length:n},()=>Array.from({length:n},all));let passes=0,eliminations=0;
    for(const g of givens||[])domains[g.r][g.c]=new Set([g.v]);
    function reduce(set,allowed){let changed=false;for(const v of [...set])if(!allowed.has(v)){set.delete(v);eliminations++;changed=true;}return changed;}
    function bad(){return {solved:false,contradiction:true,passes,eliminations,grid:domains.map(row=>row.map(s=>s.size===1?[...s][0]:0)),domains};}
    function relationOK(a,b,sign){return sign==='<'?a<b:sign==='>'?a>b:sign==='^'?a<b:a>b;}
    for(let guard=0;guard<120;guard++){
      passes++;let changed=false;
      for(let r=0;r<n;r++)for(let cc=0;cc<n-1;cc++){const sign=hSigns?.[r]?.[cc];if(!sign)continue;const A=domains[r][cc],B=domains[r][cc+1],aa=new Set([...A].filter(a=>[...B].some(b=>relationOK(a,b,sign)))),bb=new Set([...B].filter(b=>[...A].some(a=>relationOK(a,b,sign))));if(reduce(A,aa))changed=true;if(reduce(B,bb))changed=true;if(!A.size||!B.size)return bad();}
      for(let rr=0;rr<n-1;rr++)for(let col=0;col<n;col++){const sign=vSigns?.[rr]?.[col];if(!sign)continue;const A=domains[rr][col],B=domains[rr+1][col],aa=new Set([...A].filter(a=>[...B].some(b=>relationOK(a,b,sign)))),bb=new Set([...B].filter(b=>[...A].some(a=>relationOK(a,b,sign))));if(reduce(A,aa))changed=true;if(reduce(B,bb))changed=true;if(!A.size||!B.size)return bad();}
      const lines=[];for(let rr=0;rr<n;rr++)lines.push(Array.from({length:n},(_,cc)=>[rr,cc]));for(let cc=0;cc<n;cc++)lines.push(Array.from({length:n},(_,rr)=>[rr,cc]));
      for(const cells of lines){const q=lineSupports(domains,cells,n);if(!q.count)return bad();for(let i=0;i<n;i++){const [rr,cc]=cells[i];if(reduce(domains[rr][cc],q.supports[i]))changed=true;if(!domains[rr][cc].size)return bad();}}
      if(domains.every(row=>row.every(s=>s.size===1)))return {solved:true,contradiction:false,passes,eliminations,grid:domains.map(row=>row.map(s=>[...s][0])),domains};
      if(!changed)return {solved:false,contradiction:false,passes,eliminations,grid:domains.map(row=>row.map(s=>s.size===1?[...s][0]:0)),domains};
    }
    return {solved:false,contradiction:false,passes,eliminations,grid:domains.map(row=>row.map(s=>s.size===1?[...s][0]:0)),domains};
  }

  function generateFutoshiki(settings,seed){const rng=rngFromSeed(seed),o=normalise('futoshiki',settings?.engineSettings?.futoshiki),n=futoshikiSize(settings,o),solution=latinSolution(n,rng),allH=[],allV=[];for(let r=0;r<n;r++)for(let c=0;c<n-1;c++)allH.push({r,c,s:inequalityH(solution[r][c],solution[r][c+1])});for(let r=0;r<n-1;r++)for(let c=0;c<n;c++)allV.push({r,c,s:inequalityV(solution[r][c],solution[r+1][c])});
    const signRatio=o.signLevel==='more'?.38:o.signLevel==='fewer'?.16:o.difficulty==='easy'?.34:o.difficulty==='challenge'?.16:.24,hPick=shuffle(allH,rng).slice(0,Math.max(2,Math.round(allH.length*signRatio))),vPick=shuffle(allV,rng).slice(0,Math.max(2,Math.round(allV.length*signRatio))),hSigns=Array.from({length:n},()=>Array(n-1).fill('')),vSigns=Array.from({length:n-1},()=>Array(n).fill(''));hPick.forEach(x=>hSigns[x.r][x.c]=x.s);vPick.forEach(x=>vSigns[x.r][x.c]=x.s);
    const givenRatio=o.givenLevel==='more'?.38:o.givenLevel==='fewer'?.12:o.difficulty==='easy'?.34:o.difficulty==='challenge'?.12:.22,order=shuffle(cells(n),rng),givens=order.slice(0,Math.max(2,Math.round(n*n*givenRatio))).map(([r,c])=>({r,c,v:solution[r][c]}));
    const givenSet=new Set(givens.map(g=>g.r+':'+g.c));for(const [r,c] of order){if(countFutoshiki(n,givens,hSigns,vSigns,2)===1)break;const k=r+':'+c;if(givenSet.has(k))continue;givens.push({r,c,v:solution[r][c]});givenSet.add(k);}
    let audit=solveFutoshikiByLogic(n,givens,hSigns,vSigns),extraGivens=0;
    if(!audit.solved){const repair=shuffle(cells(n),rngFromSeed(String(seed)+':logic-repair')).sort((a,b)=>(audit.domains[a[0]][a[1]].size-audit.domains[b[0]][b[1]].size));for(const [r,c] of repair){const k=r+':'+c;if(givenSet.has(k))continue;givens.push({r,c,v:solution[r][c]});givenSet.add(k);extraGivens++;audit=solveFutoshikiByLogic(n,givens,hSigns,vSigns);if(audit.solved)break;}}
    if(!audit.solved)return {engineId:'futoshiki',title:'Futoshiki · Inequality Grid',error:'A deduction-solvable Futoshiki could not be built. Generate another version.'};
    const display=Array.from({length:n},()=>Array(n).fill(0));givens.forEach(g=>display[g.r][g.c]=g.v);return {engineId:'futoshiki',title:'Futoshiki · Inequality Grid',difficulty:o.difficulty,size:n,solutionGrid:solution,displayGrid:display,hSigns,vSigns,givens,logicStats:{solved:true,passes:audit.passes,eliminations:audit.eliminations,extraGivens},instruction:'Fill the '+n+' × '+n+' grid with 1–'+n+'. Use each number once in every row and column. The point of each inequality sign faces the smaller number.',seed,options:o};}

  // ---------- Arithmetic cages ----------
  function cageTarget(values,op){if(op==='=')return values[0];if(op==='+')return values.reduce((a,b)=>a+b,0);if(op==='×')return values.reduce((a,b)=>a*b,1);if(op==='−')return Math.abs(values[0]-values[1]);if(op==='÷')return Math.max(...values)/Math.min(...values);return values[0];}
  function cageOp(values,allowed,rng){if(values.length===1)return '=';if(values.length===2){const opts=['+'];if(allowed.includes('−'))opts.push('−');if(allowed.includes('×'))opts.push('×');const hi=Math.max(...values),lo=Math.min(...values);if(allowed.includes('÷')&&hi%lo===0)opts.push('÷');return choose(opts,rng);}return allowed.includes('×')&&rng()<.28?'×':'+';}
  function arithmeticAllowed(settings,o){const y=years(settings).max;if(o.operations==='add')return ['+'];if(o.operations==='addsub')return ['+','−'];if(o.operations==='mixed')return ['+','−','×','÷'];if(y<=2)return ['+'];if(y===3)return ['+','−','×'];return ['+','−','×','÷'];}
  function buildCages(solution,settings,o,rng){const n=solution.length,unassigned=new Set(cells(n).map(x=>x.join(':'))),cages=[],allowed=arithmeticAllowed(settings,o);while(unassigned.size){const first=choose([...unassigned],rng).split(':').map(Number);let targetSize=o.cageSize==='small'?choose([1,2],rng):o.cageSize==='larger'?choose([2,2,3],rng):(o.difficulty==='easy'?choose([1,1,2],rng):choose([1,2,2,3],rng));const group=[first];unassigned.delete(first.join(':'));while(group.length<targetSize){const frontier=[];for(const [r,c] of group)for(const p of neighbours(r,c,n))if(unassigned.has(p.join(':')))frontier.push(p);if(!frontier.length)break;const p=choose(frontier,rng);group.push(p);unassigned.delete(p.join(':'));}const vals=group.map(([r,c])=>solution[r][c]),op=cageOp(vals,allowed,rng),target=cageTarget(vals,op);cages.push({cells:group,op,target});}return cages;}
  function cageAllows(cage,grid,n){const vals=cage.cells.map(([r,c])=>grid[r][c]),filled=vals.filter(Boolean);if(cage.op==='=')return !filled.length||filled[0]===cage.target;if(cage.op==='+'){const s=filled.reduce((a,b)=>a+b,0);return s<=cage.target&&(filled.length<cage.cells.length||s===cage.target);}if(cage.op==='×'){const p=filled.reduce((a,b)=>a*b,1);return p<=cage.target&&cage.target%p===0&&(filled.length<cage.cells.length||p===cage.target);}if(filled.length<2)return true;return Math.abs(filled[0]-filled[1])===cage.target||Math.max(...filled)/Math.min(...filled)===cage.target;}
  function countCageSolutions(n,cages,limit=2){const grid=Array.from({length:n},()=>Array(n).fill(0)),cellCage=new Map();cages.forEach((cg,i)=>cg.cells.forEach(([r,c])=>cellCage.set(`${r}:${c}`,i)));let count=0;function valid(r,c,v){for(let i=0;i<n;i++){if(grid[r][i]===v||grid[i][c]===v)return false;}grid[r][c]=v;const ok=cageAllows(cages[cellCage.get(`${r}:${c}`)],grid,n);grid[r][c]=0;return ok;}function rec(pos=0){if(count>=limit)return;if(pos===n*n){count++;return;}let best=null,bestCand=null;for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!grid[r][c]){const cand=[];for(let v=1;v<=n;v++)if(valid(r,c,v))cand.push(v);if(!cand.length)return;if(!bestCand||cand.length<bestCand.length){best=[r,c];bestCand=cand;if(cand.length===1)break;}}if(!best){count++;return;}const [r,c]=best;for(const v of bestCand){grid[r][c]=v;if(cageAllows(cages[cellCage.get(`${r}:${c}`)],grid,n))rec(pos+1);grid[r][c]=0;if(count>=limit)return;}}rec();return count;}

  function cageTupleWorks(cage,values){
    if(cage.op==='=')return values.length===1&&values[0]===cage.target;
    if(cage.op==='+')return values.reduce((a,b)=>a+b,0)===cage.target;
    if(cage.op==='×')return values.reduce((a,b)=>a*b,1)===cage.target;
    if(cage.op==='−')return values.length===2&&Math.abs(values[0]-values[1])===cage.target;
    if(cage.op==='÷'){if(values.length!==2)return false;const hi=Math.max(...values),lo=Math.min(...values);return lo!==0&&hi/lo===cage.target;}
    return false;
  }
  function cageTuples(n,cage){
    const out=[],vals=Array(cage.cells.length).fill(0);
    function rec(i){
      if(i===vals.length){if(cageTupleWorks(cage,vals))out.push(vals.slice());return;}
      const [r,c]=cage.cells[i];
      for(let v=1;v<=n;v++){
        let ok=true;
        for(let j=0;j<i;j++){const [rr,cc]=cage.cells[j];if((rr===r||cc===c)&&vals[j]===v){ok=false;break;}}
        if(!ok)continue;vals[i]=v;rec(i+1);
      }
    }
    rec(0);return out;
  }
  function lineSupports(domains,cells,n){
    const supports=cells.map(()=>new Set()),used=new Set(),pick=Array(cells.length).fill(0);let count=0;
    function rec(i){
      if(i===cells.length){count++;for(let k=0;k<cells.length;k++)supports[k].add(pick[k]);return;}
      const [r,c]=cells[i],vals=[...domains[r][c]].sort((a,b)=>a-b);
      for(const v of vals){if(used.has(v))continue;used.add(v);pick[i]=v;rec(i+1);used.delete(v);}
    }
    rec(0);return {count,supports};
  }
  function solveCagesByLogic(n,cages){
    const all=()=>new Set(Array.from({length:n},(_,i)=>i+1)),domains=Array.from({length:n},()=>Array.from({length:n},all));
    const cageData=cages.map(cage=>({cage,tuples:cageTuples(n,cage)}));let passes=0,eliminations=0;
    function reduce(set,allowed){
      let changed=false;for(const v of [...set])if(!allowed.has(v)){set.delete(v);eliminations++;changed=true;}return changed;
    }
    function contradiction(){return {solved:false,contradiction:true,passes,eliminations,grid:domains.map(row=>row.map(s=>s.size===1?[...s][0]:0)),domains};}
    for(let guard=0;guard<120;guard++){
      passes++;let changed=false;
      for(const item of cageData){
        item.tuples=item.tuples.filter(tuple=>tuple.every((v,i)=>{const [r,c]=item.cage.cells[i];return domains[r][c].has(v);}));
        if(!item.tuples.length)return contradiction();
        for(let i=0;i<item.cage.cells.length;i++){
          const allowed=new Set(item.tuples.map(t=>t[i])),[r,c]=item.cage.cells[i];
          if(reduce(domains[r][c],allowed))changed=true;if(!domains[r][c].size)return contradiction();
        }
      }
      const lines=[];
      for(let r=0;r<n;r++)lines.push(Array.from({length:n},(_,c)=>[r,c]));
      for(let c=0;c<n;c++)lines.push(Array.from({length:n},(_,r)=>[r,c]));
      for(const cells of lines){
        const q=lineSupports(domains,cells,n);if(!q.count)return contradiction();
        for(let i=0;i<cells.length;i++){const [r,c]=cells[i];if(reduce(domains[r][c],q.supports[i]))changed=true;if(!domains[r][c].size)return contradiction();}
      }
      if(domains.every(row=>row.every(s=>s.size===1))){
        return {solved:true,contradiction:false,passes,eliminations,grid:domains.map(row=>row.map(s=>[...s][0])),domains};
      }
      if(!changed)return {solved:false,contradiction:false,passes,eliminations,grid:domains.map(row=>row.map(s=>s.size===1?[...s][0]:0)),domains};
    }
    return {solved:false,contradiction:false,passes,eliminations,grid:domains.map(row=>row.map(s=>s.size===1?[...s][0]:0)),domains};
  }
  function connectedCells(group){
    if(group.length<=1)return true;const seen=new Set([group[0].join(':')]),stack=[group[0]];
    while(stack.length){const [r,c]=stack.pop();for(const [rr,cc] of group){const k=rr+':'+cc;if(!seen.has(k)&&Math.abs(r-rr)+Math.abs(c-cc)===1){seen.add(k);stack.push([rr,cc]);}}}
    return seen.size===group.length;
  }
  function repairCagesForLogic(solution,settings,o,seed,cages){
    const n=solution.length,out=cages.map(cg=>({cells:cg.cells.map(p=>p.slice()),op:cg.op,target:cg.target})),rng=rngFromSeed(String(seed)+':logic-repair');
    for(let guard=0;guard<n*n;guard++){
      const audit=solveCagesByLogic(n,out);if(audit.solved)return {cages:out,audit,extraSingles:out.filter(cg=>cg.cells.length===1).length-cages.filter(cg=>cg.cells.length===1).length};
      const unresolved=[];for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(audit.domains[r][c].size>1)unresolved.push([r,c,audit.domains[r][c].size]);
      const candidates=shuffle(unresolved,rng).sort((a,b)=>a[2]-b[2]);
      let changed=false;
      for(const [r,c] of candidates){
        const idx=out.findIndex(cg=>cg.cells.length>1&&cg.cells.some(([rr,cc])=>rr===r&&cc===c));if(idx<0)continue;
        const old=out[idx],rest=old.cells.filter(([rr,cc])=>rr!==r||cc!==c);if(!connectedCells(rest))continue;
        const vals=rest.map(([rr,cc])=>solution[rr][cc]),op=cageOp(vals,arithmeticAllowed(settings,o),rng),replacement=[{cells:[[r,c]],op:'=',target:solution[r][c]}];
        if(rest.length)replacement.push({cells:rest,op,target:cageTarget(vals,op)});
        out.splice(idx,1,...replacement);changed=true;break;
      }
      if(!changed)break;
    }
    const audit=solveCagesByLogic(n,out);return {cages:out,audit,extraSingles:out.filter(cg=>cg.cells.length===1).length-cages.filter(cg=>cg.cells.length===1).length};
  }

  function arithmeticCageSize(settings,o){const y=years(settings).max;if(o.gridSize!=='auto')return Number(o.gridSize);if(o.difficulty==='easy'||y<=3)return 4;if(o.difficulty==='challenge'&&y>=5)return 6;return 5;}
  function generateArithmeticCages(settings,seed){
    const rng=rngFromSeed(seed),o=normalise('arithmeticcages',settings?.engineSettings?.arithmeticcages),n=arithmeticCageSize(settings,o),solution=latinSolution(n,rng);let firstUnique=null;
    for(let attempt=0;attempt<120;attempt++){
      const candidate=buildCages(solution,settings,o,rngFromSeed(String(seed)+':cages:'+attempt));
      if(countCageSolutions(n,candidate,2)!==1)continue;
      if(!firstUnique)firstUnique=candidate;
      const audit=solveCagesByLogic(n,candidate);
      if(audit.solved)return {engineId:'arithmeticcages',title:'Arithmetic Cages',difficulty:o.difficulty,size:n,solutionGrid:solution,cages:candidate,logicStats:{solved:true,passes:audit.passes,eliminations:audit.eliminations,extraSingles:0},instruction:'Fill the grid with 1–'+n+', using each number once in every row and column. Each outlined cage must make its target using the operation shown.',seed,options:o};
    }
    let base=firstUnique;
    if(!base){
      base=buildCages(solution,settings,{...o,cageSize:'small'},rngFromSeed(String(seed)+':fallback'));
      const order=shuffle(cells(n),rng),singles=new Set(base.filter(c=>c.cells.length===1).flatMap(c=>c.cells.map(x=>x.join(':'))));
      for(const [r,c] of order){
        if(countCageSolutions(n,base,2)===1)break;const k=r+':'+c;if(singles.has(k))continue;
        const idx=base.findIndex(cg=>cg.cells.some(([rr,cc])=>rr===r&&cc===c));if(idx<0||base[idx].cells.length===1)continue;
        const old=base[idx],rest=old.cells.filter(([rr,cc])=>rr!==r||cc!==c);if(!connectedCells(rest))continue;
        const vals=rest.map(([rr,cc])=>solution[rr][cc]),op=cageOp(vals,arithmeticAllowed(settings,o),rng);
        base.splice(idx,1,{cells:[[r,c]],op:'=',target:solution[r][c]},{cells:rest,op,target:cageTarget(vals,op)});singles.add(k);
      }
    }
    const repaired=repairCagesForLogic(solution,settings,o,seed,base),audit=repaired.audit;
    if(countCageSolutions(n,repaired.cages,2)!==1||!audit.solved)return {engineId:'arithmeticcages',title:'Arithmetic Cages',error:'A deduction-solvable Arithmetic Cages puzzle could not be built. Generate another version.'};
    return {engineId:'arithmeticcages',title:'Arithmetic Cages',difficulty:o.difficulty,size:n,solutionGrid:solution,cages:repaired.cages,logicStats:{solved:true,passes:audit.passes,eliminations:audit.eliminations,extraSingles:repaired.extraSingles},instruction:'Fill the grid with 1–'+n+', using each number once in every row and column. Each outlined cage must make its target using the operation shown.',seed,options:o};
  }

  // ---------- Nonogram ----------
  function lineClue(line){const out=[];let run=0;for(const v of line){if(v)run++;else if(run){out.push(run);run=0;}}if(run)out.push(run);return out.length?out:[0];}
  function linePatterns(n,clue){if(clue.length===1&&clue[0]===0)return [Array(n).fill(0)];const out=[];function rec(i,pos,row){if(i===clue.length){out.push(row.concat(Array(n-row.length).fill(0)));return;}const len=clue[i],remaining=clue.slice(i+1).reduce((a,b)=>a+b,0)+Math.max(0,clue.length-i-1),maxStart=n-len-remaining;for(let s=pos;s<=maxStart;s++){const next=row.concat(Array(s-row.length).fill(0),Array(len).fill(1));if(i<clue.length-1)next.push(0);rec(i+1,next.length,next);}}rec(0,0,[]);return out;}
  function countNonogramSolutions(rowClues,colClues,limit=2){const n=rowClues.length,rowP=rowClues.map(c=>linePatterns(n,c)),colP=colClues.map(c=>linePatterns(n,c)),grid=[];let count=0;function prefixOK(r){for(let c=0;c<n;c++){const prefix=grid.map(row=>row[c]);if(!colP[c].some(p=>prefix.every((v,i)=>p[i]===v)))return false;}return true;}function rec(r){if(count>=limit)return;if(r===n){count++;return;}for(const p of rowP[r]){grid.push(p);if(prefixOK(r))rec(r+1);grid.pop();if(count>=limit)return;}}rec(0);return count;}
  function nonogramSize(settings,o){const y=years(settings).max;if(o.gridSize!=='auto')return Number(o.gridSize);if(o.difficulty==='easy'||y<=3)return 5;if(o.difficulty==='challenge'&&y>=5)return 10;return 7;}
  function makeNonogramPattern(n,style,rng){const grid=Array.from({length:n},()=>Array(n).fill(0));if(style==='geometric'){const mode=randInt(rng,0,2);for(let r=0;r<n;r++)for(let c=0;c<n;c++){if(mode===0)grid[r][c]=(r===Math.floor(n/2)||c===Math.floor(n/2))?1:0;else if(mode===1)grid[r][c]=(Math.abs(r-Math.floor(n/2))+Math.abs(c-Math.floor(n/2))<=Math.floor(n/2)-1)?1:0;else grid[r][c]=(r===c||r+c===n-1)?1:0;}}else{const symmetric=style==='symmetric'||rng()<.55,p=.32+rng()*.18;for(let r=0;r<n;r++)for(let c=0;c<(symmetric?Math.ceil(n/2):n);c++){const v=rng()<p?1:0;grid[r][c]=v;if(symmetric)grid[r][n-1-c]=v;}}
    return grid;}
  function generateNonogram(settings,seed){const rng=rngFromSeed(seed),o=normalise('nonogram',settings?.engineSettings?.nonogram),n=nonogramSize(settings,o);for(let attempt=0;attempt<120;attempt++){let style=o.pictureStyle==='auto'?choose(['symmetric','geometric','random'],rng):o.pictureStyle,solution=makeNonogramPattern(n,style,rngFromSeed(`${seed}:pic:${attempt}`)),filled=solution.flat().reduce((a,b)=>a+b,0);if(filled<Math.max(3,n)||filled>n*n*.7)continue;const rowClues=solution.map(lineClue),colClues=Array.from({length:n},(_,c)=>lineClue(solution.map(row=>row[c])));if(countNonogramSolutions(rowClues,colClues,2)!==1)continue;return {engineId:'nonogram',title:'Nonogram · Number Picture',difficulty:o.difficulty,size:n,solutionGrid:solution,rowClues,colClues,pictureStyle:style,instruction:'Use the number clues to decide which squares to shade. Each number is a consecutive block; separate blocks have at least one empty square between them.',seed,options:o};}
    // deterministic unique 5x5 fallback plus-sign, scaled into selected size by centre lines.
    const solution=Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>(r===Math.floor(n/2)||c===Math.floor(n/2))?1:0)),rowClues=solution.map(lineClue),colClues=Array.from({length:n},(_,c)=>lineClue(solution.map(row=>row[c])));return {engineId:'nonogram',title:'Nonogram · Number Picture',difficulty:o.difficulty,size:n,solutionGrid:solution,rowClues,colClues,pictureStyle:'geometric',instruction:'Use the number clues to decide which squares to shade. Each number is a consecutive block; separate blocks have at least one empty square between them.',seed,options:o};}

  // ---------- Number Path ----------
  function pathSize(settings,o){const y=years(settings).max;if(o.gridSize!=='auto')return Number(o.gridSize);if(o.difficulty==='easy'||y<=2)return 4;if(o.difficulty==='challenge'&&y>=5)return 6;return 5;}
  function snakePath(n){const out=[];for(let r=0;r<n;r++){const cs=Array.from({length:n},(_,i)=>i);if(r%2)cs.reverse();for(const c of cs)out.push([r,c]);}return out;}
  function transformPath(path,n,rng){let pts=path.map(x=>x.slice());const turns=randInt(rng,0,3);for(let k=0;k<turns;k++)pts=pts.map(([r,c])=>[c,n-1-r]);if(rng()<.5)pts=pts.map(([r,c])=>[r,n-1-c]);if(rng()<.5)pts.reverse();return pts;}
  function countNumberPathSolutions(n,givens,limit=2){const N=n*n,givenPos=new Map(givens.map(g=>[g.v,[g.r,g.c]])),used=new Set(),pos=Array(N+1).fill(null);for(const [v,p] of givenPos){pos[v]=p;used.add(p.join(':'));}let count=0;function rec(v){if(count>=limit)return;if(v>N){count++;return;}if(pos[v]){if(v>1&&pos[v-1]){const [a,b]=pos[v-1],[c,d]=pos[v];if(Math.abs(a-c)+Math.abs(b-d)!==1)return;}rec(v+1);return;}const prev=pos[v-1];if(!prev)return;for(const [r,c] of neighbours(prev[0],prev[1],n)){const k=`${r}:${c}`;if(used.has(k))continue;const nextGiven=pos[v+1];if(nextGiven&&Math.abs(r-nextGiven[0])+Math.abs(c-nextGiven[1])!==1)continue;pos[v]=[r,c];used.add(k);rec(v+1);used.delete(k);pos[v]=null;if(count>=limit)return;}}
    if(!pos[1]){for(const [r,c] of cells(n)){pos[1]=[r,c];used.add(`${r}:${c}`);rec(2);used.delete(`${r}:${c}`);pos[1]=null;if(count>=limit)break;}}else rec(2);return count;}
  function generateNumberPath(settings,seed){const rng=rngFromSeed(seed),o=normalise('numberpath',settings?.engineSettings?.numberpath),n=pathSize(settings,o),path=transformPath(snakePath(n),n,rng),solution=Array.from({length:n},()=>Array(n).fill(0));path.forEach(([r,c],i)=>solution[r][c]=i+1);const ratio=o.clueLevel==='more'?.58:o.clueLevel==='fewer'?.34:o.difficulty==='easy'?.62:o.difficulty==='challenge'?.34:.46,all=Array.from({length:n*n},(_,i)=>i+1),must=new Set([1,n*n]),givens=all.filter(v=>must.has(v)||rng()<ratio).map(v=>{const [r,c]=path[v-1];return {r,c,v};});const present=new Set(givens.map(g=>g.v));
    // Add anchors until unique. For 6x6 this stays intentionally clue-rich for print use.
    for(const v of shuffle(all,rng)){if(countNumberPathSolutions(n,givens,2)===1)break;if(present.has(v))continue;const [r,c]=path[v-1];givens.push({r,c,v});present.add(v);}const display=Array.from({length:n},()=>Array(n).fill(0));givens.forEach(g=>display[g.r][g.c]=g.v);return {engineId:'numberpath',title:'Number Path',difficulty:o.difficulty,size:n,solutionGrid:solution,displayGrid:display,givens,instruction:`Fill the missing numbers from 1 to ${n*n}. Consecutive numbers must touch along an edge — up, down, left or right.`,seed,options:o};}

  // ---------- Kakuro ----------
  const KAKURO_MASKS={
    5:[[0,0,0,0,0],[0,0,1,1,1],[0,0,1,1,1],[0,1,1,1,0],[0,1,1,1,0]],
    6:[[0,0,0,0,0,0],[0,1,1,0,1,1],[0,1,1,1,1,1],[0,0,1,1,1,0],[0,1,1,1,1,1],[0,1,1,0,1,1]],
    7:[[0,0,0,0,0,0,0],[0,0,1,1,1,0,0],[0,0,1,1,1,1,1],[0,1,1,0,1,1,1],[0,1,1,1,1,1,1],[0,0,1,1,1,1,1],[0,0,1,1,0,1,1]],
    9:[[0,0,0,0,0,0,0,0,0],[0,0,1,1,1,0,1,1,0],[0,1,1,1,1,0,1,1,1],[0,1,1,0,1,1,1,1,1],[0,0,1,1,1,1,1,1,1],[0,1,1,1,0,1,1,1,0],[0,1,1,1,1,1,0,1,1],[0,0,1,1,1,1,1,1,1],[0,0,1,1,0,1,1,1,0]]
  };
  function kakuroSize(settings,o){const y=years(settings).max;if(o.gridSize!=='auto')return Number(o.gridSize);if(o.difficulty==='easy'||y<=3)return 5;if(o.difficulty==='challenge'&&y>=5)return 7;return 6;}
  function kakuroRuns(mask){const n=mask.length,runs=[];for(let r=0;r<n;r++){let c=0;while(c<n){if(!mask[r][c]){c++;continue;}const start=c,cs=[];while(c<n&&mask[r][c]){cs.push([r,c]);c++;}if(cs.length>=2)runs.push({dir:'across',cells:cs,clueCell:[r,start-1]});}}for(let c=0;c<n;c++){let r=0;while(r<n){if(!mask[r][c]){r++;continue;}const start=r,cs=[];while(r<n&&mask[r][c]){cs.push([r,c]);r++;}if(cs.length>=2)runs.push({dir:'down',cells:cs,clueCell:[start-1,c]});}}return runs;}
  function fillKakuro(mask,seed){const rng=rngFromSeed(seed),n=mask.length,grid=Array.from({length:n},()=>Array(n).fill(0)),runs=kakuroRuns(mask),cellRuns=new Map();runs.forEach((run,i)=>run.cells.forEach(([r,c])=>{const k=`${r}:${c}`;if(!cellRuns.has(k))cellRuns.set(k,[]);cellRuns.get(k).push(i);}));const whites=cells(n).filter(([r,c])=>mask[r][c]);function rec(i){if(i===whites.length)return true;let best=i,bestCand=null;for(let j=i;j<whites.length;j++){const [r,c]=whites[j],used=new Set();for(const ri of cellRuns.get(`${r}:${c}`)||[])for(const [rr,cc] of runs[ri].cells)if(grid[rr][cc])used.add(grid[rr][cc]);const cand=shuffle([1,2,3,4,5,6,7,8,9].filter(v=>!used.has(v)),rng);if(!bestCand||cand.length<bestCand.length){best=j;bestCand=cand;}}[whites[i],whites[best]]=[whites[best],whites[i]];const [r,c]=whites[i];for(const v of bestCand){grid[r][c]=v;if(rec(i+1))return true;grid[r][c]=0;}return false;}return rec(0)?{grid,runs}:null;}
  const KAKURO_COMBO_CACHE=new Map();
  function kakuroComboMasks(len,target){
    const key=`${len}:${target}`;if(KAKURO_COMBO_CACHE.has(key))return KAKURO_COMBO_CACHE.get(key);
    const out=[];
    function rec(next,left,sum,mask){
      if(left===0){if(sum===target)out.push(mask);return;}
      for(let d=next;d<=9;d++){if(sum+d>target)break;rec(d+1,left-1,sum+d,mask|(1<<(d-1)));}
    }
    rec(1,len,0,0);KAKURO_COMBO_CACHE.set(key,out);return out;
  }
  function countKakuro(mask,runs,givens,limit=2){
    const n=mask.length,N=n*n,grid=new Uint8Array(N),runMasks=new Uint16Array(runs.length),cellRuns=Array.from({length:N},()=>[]);
    const runCombos=runs.map(run=>kakuroComboMasks(run.cells.length,run.target));
    runs.forEach((run,ri)=>run.cells.forEach(([r,c])=>cellRuns[r*n+c].push(ri)));

    function supports(ri,used){for(const combo of runCombos[ri])if((combo&used)===used)return true;return false;}
    for(const g of givens||[]){
      const id=g.r*n+g.c,bit=1<<(g.v-1);
      if(grid[id]&&grid[id]!==g.v)return 0;
      for(const ri of cellRuns[id]){
        if(runMasks[ri]&bit)return 0;
        const next=runMasks[ri]|bit;if(!supports(ri,next))return 0;
      }
      grid[id]=g.v;for(const ri of cellRuns[id])runMasks[ri]|=bit;
    }

    const whites=[];for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(mask[r][c])whites.push(r*n+c);
    function allowedBits(id){
      let bits=0x1ff;
      for(const ri of cellRuns[id]){
        let runBits=0,used=runMasks[ri];
        for(const combo of runCombos[ri])if((combo&used)===used)runBits|=(combo&~used);
        bits&=runBits;if(!bits)break;
      }
      return bits;
    }

    let count=0;
    function rec(){
      if(count>=limit)return;
      let best=-1,bits=0,bestCount=10;
      for(const id of whites)if(!grid[id]){
        const cb=allowedBits(id);if(!cb)return;
        let pc=0,x=cb;while(x){x&=x-1;pc++;}
        if(pc<bestCount){best=id;bits=cb;bestCount=pc;if(pc===1)break;}
      }
      if(best<0){count++;return;}
      while(bits&&count<limit){
        const bit=bits&-bits;bits-=bit;const v=32-Math.clz32(bit);
        grid[best]=v;for(const ri of cellRuns[best])runMasks[ri]|=bit;
        rec();
        for(const ri of cellRuns[best])runMasks[ri]^=bit;grid[best]=0;
      }
    }
    rec();return count;
  }


  function kakuroRunTuples(len,target){
    const out=[],vals=Array(len).fill(0),used=new Set();
    function rec(i,sum){if(i===len){if(sum===target)out.push(vals.slice());return;}for(let v=1;v<=9;v++){if(used.has(v)||sum+v>target)continue;used.add(v);vals[i]=v;rec(i+1,sum+v);used.delete(v);}}
    rec(0,0);return out;
  }
  function solveKakuroByLogic(mask,runs,givens){
    const n=mask.length,domains=Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>mask[r][c]?new Set([1,2,3,4,5,6,7,8,9]):new Set())),runData=runs.map(run=>({run,tuples:kakuroRunTuples(run.cells.length,run.target)}));let passes=0,eliminations=0;
    for(const g of givens||[])domains[g.r][g.c]=new Set([g.v]);
    function reduce(set,allowed){let changed=false;for(const v of [...set])if(!allowed.has(v)){set.delete(v);eliminations++;changed=true;}return changed;}
    function grid(){return domains.map((row,r)=>row.map((s,c)=>mask[r][c]&&s.size===1?[...s][0]:0));}
    for(let guard=0;guard<120;guard++){
      passes++;let changed=false;
      for(const item of runData){
        item.tuples=item.tuples.filter(tuple=>tuple.every((v,i)=>{const [r,c]=item.run.cells[i];return domains[r][c].has(v);}));
        if(!item.tuples.length)return {solved:false,contradiction:true,passes,eliminations,grid:grid(),domains};
        for(let i=0;i<item.run.cells.length;i++){const [r,c]=item.run.cells[i],allowed=new Set(item.tuples.map(t=>t[i]));if(reduce(domains[r][c],allowed))changed=true;if(!domains[r][c].size)return {solved:false,contradiction:true,passes,eliminations,grid:grid(),domains};}
      }
      let solved=true;for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(mask[r][c]&&domains[r][c].size!==1)solved=false;
      if(solved)return {solved:true,contradiction:false,passes,eliminations,grid:grid(),domains};
      if(!changed)return {solved:false,contradiction:false,passes,eliminations,grid:grid(),domains};
    }
    return {solved:false,contradiction:false,passes,eliminations,grid:grid(),domains};
  }

  function generateKakuro(settings,seed){const rng=rngFromSeed(seed),o=normalise('kakuro',settings?.engineSettings?.kakuro),n=kakuroSize(settings,o),mask=KAKURO_MASKS[n];for(let attempt=0;attempt<80;attempt++){const f=fillKakuro(mask,String(seed)+':fill:'+attempt);if(!f)continue;const runs=f.runs.map(run=>({...run,target:run.cells.reduce((s,[r,c])=>s+f.grid[r][c],0)})),white=cells(n).filter(([r,c])=>mask[r][c]),givenRatio=o.givenLevel==='more'?.22:o.givenLevel==='balanced'?.10:(o.givenLevel==='minimum'||o.givenLevel==='none')?0:o.difficulty==='easy'?.18:o.difficulty==='challenge'?0:.08,givens=shuffle(white,rngFromSeed(String(seed)+':given:'+attempt)).slice(0,Math.round(white.length*givenRatio)).map(([r,c])=>({r,c,v:f.grid[r][c]})),set=new Set(givens.map(g=>g.r+':'+g.c));for(const [r,c] of shuffle(white,rng)){if(countKakuro(mask,runs,givens,2)===1)break;const k=r+':'+c;if(set.has(k))continue;givens.push({r,c,v:f.grid[r][c]});set.add(k);}if(countKakuro(mask,runs,givens,2)!==1)continue;
      let logic=solveKakuroByLogic(mask,runs,givens),extraGivens=0;if(!logic.solved){const repair=shuffle(white,rngFromSeed(String(seed)+':kakuro-logic:'+attempt)).sort((a,b)=>logic.domains[a[0]][a[1]].size-logic.domains[b[0]][b[1]].size);for(const [r,c] of repair){const k=r+':'+c;if(set.has(k))continue;givens.push({r,c,v:f.grid[r][c]});set.add(k);extraGivens++;logic=solveKakuroByLogic(mask,runs,givens);if(logic.solved)break;}}
      if(!logic.solved)continue;const clueCells={};for(const run of runs){const k=run.clueCell.join(':');clueCells[k]=clueCells[k]||{};clueCells[k][run.dir]=run.target;}const display=Array.from({length:n},()=>Array(n).fill(0));givens.forEach(g=>display[g.r][g.c]=g.v);return {engineId:'kakuro',title:'Kakuro · Cross Sums',difficulty:o.difficulty,size:n,mask,solutionGrid:f.grid,displayGrid:display,runs,clueCells,givens,logicStats:{solved:true,passes:logic.passes,eliminations:logic.eliminations,extraGivens},instruction:'Fill each white square with 1–9. Every across/down run must add to its clue, and a digit cannot repeat within one run.',seed,options:o};}return {engineId:'kakuro',title:'Kakuro · Cross Sums',error:'A deduction-solvable Kakuro could not be built. Generate another version.'};}

  function generate(id,settings,seed){if(id==='kakuro')return generateKakuro(settings,seed);if(id==='futoshiki')return generateFutoshiki(settings,seed);if(id==='arithmeticcages')return generateArithmeticCages(settings,seed);if(id==='nonogram')return generateNonogram(settings,seed);if(id==='numberpath')return generateNumberPath(settings,seed);return null;}
  function workedExample(id){const base={engineId:id,kind:id,title:`${DEFINITIONS[id]?.title||id} worked example`};if(id==='kakuro')return {...base,goal:'Choose digits so a run reaches its clue total without repeats.',rules:['Use digits 1–9.','Digits in one run must add to the clue.','A digit cannot repeat inside the same run.'],steps:['A two-cell run has clue 4.','The two digits must be different, so 2 + 2 is not allowed.','The only pair is 1 and 3.','Use crossing runs to decide which cell is 1 and which is 3.'],tip:'Short runs with small or large totals often have very few possible combinations.',commonMistake:'Never repeat a digit within one across or down run.'};if(id==='futoshiki')return {...base,goal:'Fill the grid while obeying row, column and inequality rules.',rules:['Use 1–N once in every row and column.','The open side of < or > faces the larger number.'],steps:['In a 4 × 4 row, 1, 2 and 4 are already used.','The missing number is 3.','Check the inequality beside that cell.','If it says 3 < 4, the placement is valid.'],tip:'A cell on the smaller side of an inequality cannot contain the largest number.',commonMistake:'Do not treat the inequality as decoration — it is a compulsory clue.'};if(id==='arithmeticcages')return {...base,goal:'Use arithmetic cage targets together with the row/column no-repeat rule.',rules:['Use 1–N once in every row and column.','Numbers in each cage must make the target using its operation.'],steps:['A two-cell cage says 6× in a 4 × 4 grid.','Possible digits are 2 and 3.','Use the row and column to decide which cell is 2 and which is 3.','Check that 2 × 3 = 6.'],tip:'Work on cages with only one or two possible number combinations first.',commonMistake:'A correct cage is not enough if a row or column repeats a number.'};if(id==='nonogram')return {...base,goal:'Shade cells so every row and column matches its run-length clues.',rules:['Each clue number is a consecutive block of shaded cells.','Separate blocks have at least one empty cell between them.','Blocks appear in the clue order.'],steps:['On a 5-cell row, clue 5 means all five cells are shaded.','Clue 2 1 means two shaded cells, a gap, then one shaded cell.','Use completed rows to help decide the crossing columns.'],tip:'Start with clues that almost fill the whole line.',commonMistake:'Two clue blocks must have at least one empty square between them.'};if(id==='numberpath')return {...base,goal:'Complete the number sequence through touching cells.',rules:['Write every number in order.','Consecutive numbers must touch along an edge, not diagonally.'],steps:['You can see 7 and 10 with two blanks between them.','The blanks must contain 8 and 9 in that order.','Each new number must touch the number immediately before and after it.'],tip:'Work between pairs of given anchor numbers that are close together.',commonMistake:'Do not jump diagonally between consecutive numbers.'};return null;}
  function validate(a){if(!a||a.error)return {ok:false,error:a?.error||'missing activity'};if(a.engineId==='futoshiki'){for(let r=0;r<a.size;r++){if(new Set(a.solutionGrid[r]).size!==a.size)return {ok:false,error:'futoshiki row repeat'};const col=a.solutionGrid.map(row=>row[r]);if(new Set(col).size!==a.size)return {ok:false,error:'futoshiki column repeat'};}if(countFutoshiki(a.size,a.givens,a.hSigns,a.vSigns,2)!==1)return {ok:false,error:'futoshiki not unique'};const logic=solveFutoshikiByLogic(a.size,a.givens,a.hSigns,a.vSigns);if(!logic.solved)return {ok:false,error:'futoshiki requires guessing; deduction solver stalled'};for(let r=0;r<a.size;r++)for(let c=0;c<a.size;c++)if(logic.grid[r][c]!==a.solutionGrid[r][c])return {ok:false,error:'futoshiki deduction solution mismatch'};}
    if(a.engineId==='arithmeticcages'){if(countCageSolutions(a.size,a.cages,2)!==1)return {ok:false,error:'arithmetic cages not unique'};const logic=solveCagesByLogic(a.size,a.cages);if(!logic.solved)return {ok:false,error:'arithmetic cages requires guessing; deduction solver stalled'};for(const cg of a.cages){const vals=cg.cells.map(([r,c])=>a.solutionGrid[r][c]);if(Math.abs(cageTarget(vals,cg.op)-cg.target)>1e-9)return {ok:false,error:'cage target mismatch'};}for(let r=0;r<a.size;r++)for(let c=0;c<a.size;c++)if(logic.grid[r][c]!==a.solutionGrid[r][c])return {ok:false,error:'arithmetic cages deduction solution mismatch'};}
    if(a.engineId==='nonogram'){const rows=a.solutionGrid.map(lineClue),cols=Array.from({length:a.size},(_,c)=>lineClue(a.solutionGrid.map(row=>row[c])));if(JSON.stringify(rows)!==JSON.stringify(a.rowClues)||JSON.stringify(cols)!==JSON.stringify(a.colClues))return {ok:false,error:'nonogram clues mismatch'};if(countNonogramSolutions(a.rowClues,a.colClues,2)!==1)return {ok:false,error:'nonogram not unique'};}
    if(a.engineId==='numberpath'){for(let v=1;v<a.size*a.size;v++){let p1=null,p2=null;for(let r=0;r<a.size;r++)for(let c=0;c<a.size;c++){if(a.solutionGrid[r][c]===v)p1=[r,c];if(a.solutionGrid[r][c]===v+1)p2=[r,c];}if(!p1||!p2||Math.abs(p1[0]-p2[0])+Math.abs(p1[1]-p2[1])!==1)return {ok:false,error:'number path broken'};}if(countNumberPathSolutions(a.size,a.givens,2)!==1)return {ok:false,error:'number path not unique'};}
    if(a.engineId==='kakuro'){if(countKakuro(a.mask,a.runs,a.givens,2)!==1)return {ok:false,error:'kakuro not unique'};const logic=solveKakuroByLogic(a.mask,a.runs,a.givens);if(!logic.solved)return {ok:false,error:'kakuro requires guessing; deduction solver stalled'};for(const run of a.runs){const vals=run.cells.map(([r,c])=>a.solutionGrid[r][c]);if(new Set(vals).size!==vals.length||vals.reduce((x,y)=>x+y,0)!==run.target)return {ok:false,error:'kakuro run mismatch'};}for(let r=0;r<a.size;r++)for(let c=0;c<a.size;c++)if(a.mask[r][c]&&logic.grid[r][c]!==a.solutionGrid[r][c])return {ok:false,error:'kakuro deduction solution mismatch'};}
    return {ok:true};}

  const api={VERSION,DEFINITIONS,normalise,generate,workedExample,validate,_countFutoshiki:countFutoshiki,_solveFutoshikiByLogic:solveFutoshikiByLogic,_countCageSolutions:countCageSolutions,_solveCagesByLogic:solveCagesByLogic,_countNonogramSolutions:countNonogramSolutions,_countNumberPathSolutions:countNumberPathSolutions,_countKakuro:countKakuro,_solveKakuroByLogic:solveKakuroByLogic,_fillKakuro:fillKakuro,_kakuroRuns:kakuroRuns,_KAKURO_MASKS:KAKURO_MASKS};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;global.TT99NumberLogicGames=api;
})(typeof globalThis!=='undefined'?globalThis:this);
