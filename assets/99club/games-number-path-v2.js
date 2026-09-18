/* 99 Club Studio · Number Path v2
 * Genuine winding full-grid paths, uniqueness-preserving clue removal,
 * and 7x7 Challenge support.
 */
(function(global){
  'use strict';

  const base=global.TT99NumberLogicGames;
  if(!base||base.__numberPathV2)return;

  const VERSION='2.0.0';
  const ORIGINAL_GENERATE=base.generate.bind(base);
  const ORIGINAL_VALIDATE=base.validate.bind(base);
  const ORIGINAL_WORKED=base.workedExample.bind(base);

  function hashString(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function rngFromSeed(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function key(p){return `${p[0]}:${p[1]}`;}
  function neighbours(r,c,n){return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([rr,cc])=>rr>=0&&cc>=0&&rr<n&&cc<n);}
  function allCells(n){return Array.from({length:n*n},(_,i)=>[Math.floor(i/n),i%n]);}
  function manhattan(a,b){return Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);}

  function numberPathDefinition(){
    const old=base.DEFINITIONS.numberpath;
    return {...old,
      defaultSettings:{difficulty:'standard',gridSize:'auto',clueLevel:'auto'},
      settingsSchema:[
        {id:'difficulty',type:'difficulty',label:'Difficulty'},
        {id:'gridSize',type:'select',label:'Grid size',options:[
          {value:'auto',label:'Auto'},
          {value:'4',label:'4 × 4'},
          {value:'5',label:'5 × 5'},
          {value:'6',label:'6 × 6'},
          {value:'7',label:'7 × 7'}
        ]},
        {id:'clueLevel',type:'select',label:'Numbers shown',options:[
          {value:'auto',label:'Auto'},
          {value:'more',label:'More shown'},
          {value:'balanced',label:'Balanced'},
          {value:'fewer',label:'Fewer shown'}
        ]}
      ],
      difficultyDescriptions:{
        easy:'4 × 4 with many helpful anchors and short gaps',
        standard:'5 × 5 winding path with balanced anchors',
        challenge:'7 × 7 winding path with fewer, less convenient anchors'
      }
    };
  }
  base.DEFINITIONS.numberpath=numberPathDefinition();

  function normalise(settings){
    const raw=settings?.engineSettings?.numberpath||{};
    return base.normalise?base.normalise('numberpath',raw):{...base.DEFINITIONS.numberpath.defaultSettings,...raw};
  }
  function pathSize(settings,o){
    if(o.gridSize!=='auto')return Math.max(4,Math.min(7,Number(o.gridSize)||5));
    const y=Math.max(1,Math.min(6,Number(settings?.maxYear)||6));
    if(o.difficulty==='easy'||y<=2)return 4;
    if(o.difficulty==='challenge')return 7;
    return 5;
  }

  function snakePath(n){
    const out=[];
    for(let r=0;r<n;r++){
      const cols=Array.from({length:n},(_,i)=>i);
      if(r%2)cols.reverse();
      for(const c of cols)out.push([r,c]);
    }
    return out;
  }

  // A backbite move preserves a Hamiltonian path while changing its topology.
  // Repeating it from the simple starter path produces genuinely winding paths
  // without risking disconnected or repeated cells.
  function backbite(path,n,rng){
    let p=path.map(q=>q.slice()),reversed=false;
    if(rng()<.5){p.reverse();reversed=true;}
    const index=new Map(p.map((q,i)=>[key(q),i])),options=[];
    for(const q of neighbours(p[0][0],p[0][1],n)){
      const j=index.get(key(q));
      if(j>1)options.push(j);
    }
    if(options.length){
      const j=options[Math.floor(rng()*options.length)];
      p=p.slice(0,j).reverse().concat(p.slice(j));
    }
    if(reversed)p.reverse();
    return p;
  }

  function pathMetrics(path){
    const dirs=[];
    for(let i=1;i<path.length;i++)dirs.push([path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]]);
    let turns=0,longest=dirs.length?1:0,run=1,horizontal=0;
    for(let i=0;i<dirs.length;i++){
      if(dirs[i][0]===0)horizontal++;
      if(i&&(dirs[i][0]!==dirs[i-1][0]||dirs[i][1]!==dirs[i-1][1])){turns++;run=1;}
      else if(i){run++;longest=Math.max(longest,run);}
    }
    return {turns,longestStraight:longest,horizontalRatio:dirs.length?horizontal/dirs.length:.5};
  }
  function pathScore(path,n){
    const m=pathMetrics(path),balancePenalty=Math.abs(m.horizontalRatio-.5)*36,straightPenalty=Math.max(0,m.longestStraight-Math.max(2,Math.ceil(n*.55)))*8;
    return m.turns*12-balancePenalty-straightPenalty;
  }
  function generateWindingPath(n,seed){
    let best=null,bestScore=-Infinity;
    const N=n*n,candidates=n>=7?7:6,moves=N*(n>=7?52:44);
    for(let attempt=0;attempt<candidates;attempt++){
      const rng=rngFromSeed(`${seed}:backbite:${attempt}`);
      let p=snakePath(n);
      if(rng()<.5)p.reverse();
      for(let i=0;i<moves;i++)p=backbite(p,n,rng);
      const score=pathScore(p,n);
      if(score>bestScore){best=p;bestScore=score;}
    }
    return best||snakePath(n);
  }

  function nextFixedAfter(fixed,N){
    const out=Array(N+1).fill(0);let next=0;
    for(let v=N;v>=1;v--){out[v]=next;if(fixed[v])next=v;}
    return out;
  }

  function countNumberPathSolutions(n,givens,limit=2,nodeLimit=350000){
    const N=n*n,fixed=Array(N+1).fill(null),reserved=new Map();
    for(const g of givens||[]){
      const v=Number(g.v),p=[Number(g.r),Number(g.c)];
      if(v<1||v>N||p.some(x=>!Number.isInteger(x)||x<0||x>=n))return 0;
      if(fixed[v]||reserved.has(key(p)))return 0;
      fixed[v]=p;reserved.set(key(p),v);
    }
    const nextAfter=nextFixedAfter(fixed,N),used=new Set(),pos=Array(N+1).fill(null),gridCells=allCells(n);
    let count=0,nodes=0;

    function futureAnchorOK(v,p){
      const anchor=nextAfter[v];if(!anchor)return true;
      const target=fixed[anchor],steps=anchor-v,d=manhattan(p,target);
      return d<=steps&&((steps-d)&1)===0;
    }
    function remainingConnected(current){
      const allowed=new Set([key(current)]);
      for(const p of gridCells)if(!used.has(key(p)))allowed.add(key(p));
      const stack=[current],seen=new Set([key(current)]);
      while(stack.length){
        const p=stack.pop();
        for(const q of neighbours(p[0],p[1],n)){
          const k=key(q);if(!allowed.has(k)||seen.has(k))continue;seen.add(k);stack.push(q);
        }
      }
      return seen.size===allowed.size;
    }
    function candidatesFor(v,prev){
      const fixedPos=fixed[v];
      if(fixedPos){
        if(manhattan(prev,fixedPos)!==1||used.has(key(fixedPos)))return [];
        return [fixedPos];
      }
      const out=[];
      for(const q of neighbours(prev[0],prev[1],n)){
        const k=key(q),reservedFor=reserved.get(k);
        if(used.has(k)||(reservedFor&&reservedFor!==v))continue;
        if(!futureAnchorOK(v,q))continue;
        out.push(q);
      }
      // Constrained cells first keeps the uniqueness check fast and deterministic.
      out.sort((a,b)=>{
        const da=neighbours(a[0],a[1],n).filter(q=>!used.has(key(q))&&!reserved.has(key(q))).length;
        const db=neighbours(b[0],b[1],n).filter(q=>!used.has(key(q))&&!reserved.has(key(q))).length;
        return da-db||a[0]-b[0]||a[1]-b[1];
      });
      return out;
    }
    function rec(v){
      if(count>=limit||nodes++>nodeLimit)return;
      if(v>N){count++;return;}
      const prev=pos[v-1],cands=candidatesFor(v,prev);
      for(const q of cands){
        const k=key(q);pos[v]=q;used.add(k);
        let ok=true;
        if(v<N){
          const anchor=nextAfter[v];
          if(cands.length>1||anchor===v+1||v%5===0)ok=remainingConnected(q);
        }
        if(ok)rec(v+1);
        used.delete(k);pos[v]=null;
        if(count>=limit||nodes>nodeLimit)return;
      }
    }

    const starts=fixed[1]?[fixed[1]]:gridCells.filter(p=>!reserved.has(key(p))||reserved.get(key(p))===1);
    for(const start of starts){
      pos[1]=start;used.add(key(start));
      if(futureAnchorOK(1,start))rec(2);
      used.delete(key(start));pos[1]=null;
      if(count>=limit||nodes>nodeLimit)break;
    }
    return count;
  }

  function turnValues(path){
    const out=new Set();
    for(let i=1;i<path.length-1;i++){
      const a=path[i-1],b=path[i],c=path[i+1],d1=[b[0]-a[0],b[1]-a[1]],d2=[c[0]-b[0],c[1]-b[1]];
      if(d1[0]!==d2[0]||d1[1]!==d2[1])out.add(i+1);
    }
    return out;
  }
  function cluePolicy(o){
    if(o.clueLevel==='more')return {ratio:.58,maxGap:4};
    if(o.clueLevel==='balanced')return {ratio:.46,maxGap:6};
    if(o.clueLevel==='fewer')return {ratio:.34,maxGap:9};
    if(o.difficulty==='easy')return {ratio:.62,maxGap:4};
    if(o.difficulty==='challenge')return {ratio:.33,maxGap:9};
    return {ratio:.46,maxGap:6};
  }
  function gapOKAfterRemove(present,v,maxGap,N){
    let lo=v-1,hi=v+1;while(lo>=1&&!present.has(lo))lo--;while(hi<=N&&!present.has(hi))hi++;
    return lo>=1&&hi<=N&&(hi-lo)<=maxGap;
  }
  function givensFromSet(path,present){
    return [...present].sort((a,b)=>a-b).map(v=>{const [r,c]=path[v-1];return {r,c,v};});
  }
  function removeCluesUniquely(path,n,o,seed){
    const N=n*n,policy=cluePolicy(o),target=Math.max(4,Math.ceil(N*policy.ratio)),present=new Set(Array.from({length:N},(_,i)=>i+1)),turns=turnValues(path),rng=rngFromSeed(`${seed}:clues`),protectedValues=new Set([1,N]);
    // Easy keeps many bend points visible; Standard keeps a smaller sample;
    // Challenge relies on uniqueness rather than convenient clue placement.
    if(o.difficulty==='easy'||o.clueLevel==='more')for(const v of turns)if(v%2===0)protectedValues.add(v);
    else if(o.difficulty==='standard'&&o.clueLevel!=='fewer')for(const v of turns)if(v%4===0)protectedValues.add(v);

    let progress=true,passes=0;
    while(present.size>target&&progress&&passes++<5){
      progress=false;
      let candidates=[...present].filter(v=>!protectedValues.has(v)&&v!==1&&v!==N);
      candidates=shuffle(candidates,rng).sort((a,b)=>{
        const ar=(present.has(a-1)?1:0)+(present.has(a+1)?1:0),br=(present.has(b-1)?1:0)+(present.has(b+1)?1:0);
        return br-ar;
      });
      for(const v of candidates){
        if(present.size<=target)break;
        if(!gapOKAfterRemove(present,v,policy.maxGap,N))continue;
        present.delete(v);
        const givens=givensFromSet(path,present),solutions=countNumberPathSolutions(n,givens,2,n>=7?420000:220000);
        if(solutions===1)progress=true;else present.add(v);
      }
    }
    return givensFromSet(path,present);
  }

  function generateNumberPath(settings,seed){
    const o=normalise(settings),n=pathSize(settings,o),path=generateWindingPath(n,seed),solution=Array.from({length:n},()=>Array(n).fill(0));
    path.forEach(([r,c],i)=>solution[r][c]=i+1);
    const givens=removeCluesUniquely(path,n,o,seed),display=Array.from({length:n},()=>Array(n).fill(0));
    givens.forEach(g=>display[g.r][g.c]=g.v);
    return {engineId:'numberpath',title:'Number Path',difficulty:o.difficulty,size:n,solutionGrid:solution,displayGrid:display,givens,path:path.map(p=>p.slice()),pathMetrics:pathMetrics(path),instruction:`Fill every square with the numbers 1 to ${n*n}. Use each number exactly once. Consecutive numbers must be in squares that share a side — up, down, left or right. Diagonals do not count.`,seed,options:o,engineVersion:VERSION};
  }

  function validateNumberPath(a){
    if(!a||a.error)return {ok:false,error:a?.error||'missing activity'};
    const n=a.size,N=n*n,seen=new Set(),pos=Array(N+1).fill(null);
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const v=a.solutionGrid?.[r]?.[c];
      if(!Number.isInteger(v)||v<1||v>N||seen.has(v))return {ok:false,error:'number path must contain every number exactly once'};
      seen.add(v);pos[v]=[r,c];
    }
    for(let v=2;v<=N;v++)if(manhattan(pos[v-1],pos[v])!==1)return {ok:false,error:`number path break between ${v-1} and ${v}`};
    if(!a.givens?.some(g=>g.v===1)||!a.givens?.some(g=>g.v===N))return {ok:false,error:'number path endpoints must be shown'};
    const solutions=countNumberPathSolutions(n,a.givens,2,n>=7?520000:260000);
    if(solutions!==1)return {ok:false,error:solutions===0?'number path has no solution':'number path is not unique'};
    return {ok:true};
  }

  function workedExample(){
    return {engineId:'numberpath',kind:'numberpath',title:'Number Path worked example',goal:'Complete one continuous number sequence through every square.',rules:['Use every number from 1 to the final number exactly once.','Consecutive numbers must be in squares that share a side.','Diagonal touching does not count.'],steps:['Find two nearby given numbers, such as 7 and 10.','There must be exactly two cells for 8 and 9 between them.','Check that each new number touches both the number before it and the number after it where those are known.','Keep extending the path until every square has one number.'],tip:'Start with close anchor numbers and short gaps before tackling the longest missing sections.',commonMistake:'Do not jump diagonally, skip a number, or use a square twice.'};
  }

  base.generate=function(id,settings,seed){if(id==='numberpath')return generateNumberPath(settings,seed);return ORIGINAL_GENERATE(id,settings,seed);};
  base.validate=function(a){if(a?.engineId==='numberpath')return validateNumberPath(a);return ORIGINAL_VALIDATE(a);};
  base.workedExample=function(id,...args){if(id==='numberpath')return workedExample();return ORIGINAL_WORKED(id,...args);};
  base._countNumberPathSolutions=countNumberPathSolutions;
  base._generateWindingNumberPath=generateWindingPath;
  base._numberPathMetrics=pathMetrics;
  base.NUMBER_PATH_V2={VERSION,generate:generateNumberPath,validate:validateNumberPath,countSolutions:countNumberPathSolutions,generatePath:generateWindingPath,pathMetrics};
  base.__numberPathV2=true;

  if(typeof module!=='undefined'&&module.exports)module.exports=base;
})(typeof globalThis!=='undefined'?globalThis:this);
