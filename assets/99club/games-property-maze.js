/* 99 Club Studio · Number Property Maze
 * v1.0.0 — seeded property-classification mazes with a proven unique route.
 */
(function(global){
  'use strict';

  const A=global.TT99ArithmeticGames;
  if(!A||A.__propertyMazeV1)return;

  const VERSION='1.0.0';
  const ORIGINAL_GENERATE=A.generate.bind(A);
  const ORIGINAL_VALIDATE=A.validate.bind(A);
  const ORIGINAL_WORKED=A.workedExample.bind(A);
  const ORIGINAL_NORMALISE=A.normalise.bind(A);
  const MODES=['auto','prime','factor','multiple','divisible','square','common_factor','common_multiple'];

  const DEF={
    id:'propertymaze',title:'Number Property Maze',group:'Number properties',kind:'independent',printableMode:'path',
    answerSheetSupport:true,workedExampleSupport:true,needsCutting:false,needsDice:false,needsPartner:false,
    supportedAnswerTypes:['number','logic','classification'],difficultyOptions:['easy','standard','challenge'],
    defaultSettings:{difficulty:'standard',gridSize:'auto',propertyMode:'auto'},
    settingsSchema:[
      {id:'difficulty',type:'difficulty',label:'Difficulty'},
      {id:'gridSize',type:'select',label:'Maze size',options:[
        {value:'auto',label:'Auto'},
        {value:'5',label:'5 × 5'},
        {value:'6',label:'6 × 6'},
        {value:'7',label:'7 × 7'}
      ],help:'Auto uses 5×5 on Easy, 6×6 on Standard and 7×7 on Challenge.'},
      {id:'propertyMode',type:'select',label:'Number property',options:[
        {value:'auto',label:'Auto for year / difficulty'},
        {value:'prime',label:'Prime numbers'},
        {value:'factor',label:'Factors of a number'},
        {value:'multiple',label:'Multiples of a number'},
        {value:'divisible',label:'Divisible by a number'},
        {value:'square',label:'Square numbers'},
        {value:'common_factor',label:'Common factors'},
        {value:'common_multiple',label:'Common multiples'}
      ],help:'The correct route is made only from numbers with the chosen property. Standard and Challenge can include matching-number dead ends.'}
    ],
    difficultyDescriptions:{
      easy:'5 × 5 with one clear route and no matching dead ends',
      standard:'6 × 6 with a longer route and a few matching-number dead ends',
      challenge:'7 × 7 with a long route and several convincing matching dead ends'
    },
    topicYearMin:{number_place_value:4,calculation:4},
    compatibility:{number_place_value:'excellent',calculation:'reasonable',fractions:'poor',decimals_percentages:'poor',ratio_proportion:'poor',measurement:'poor',geometry:'poor',statistics:'poor',algebra:'poor'}
  };
  A.DEFINITIONS.propertymaze=DEF;

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function hashString(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function rngFromSeed(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function randInt(rng,a,b){return Math.floor(rng()*(b-a+1))+a;}
  function choose(arr,rng){return arr[Math.floor(rng()*arr.length)];}
  function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function key(p){return `${p[0]}:${p[1]}`;}
  function parseKey(k){return String(k).split(':').map(Number);}
  function allCells(n){return Array.from({length:n*n},(_,i)=>[Math.floor(i/n),i%n]);}
  function neighbours(p,n){const [r,c]=p;return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([rr,cc])=>rr>=0&&cc>=0&&rr<n&&cc<n);}
  function borderCells(n){return allCells(n).filter(([r,c])=>r===0||c===0||r===n-1||c===n-1);}
  function isPrime(v){v=Math.trunc(Number(v));if(v<2)return false;if(v%2===0)return v===2;for(let d=3;d*d<=v;d+=2)if(v%d===0)return false;return true;}
  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t;}return a;}
  function lcm(a,b){return Math.abs(a*b)/gcd(a,b);}
  function divisorCount(v){let n=0;for(let d=1;d*d<=v;d++)if(v%d===0)n+=d*d===v?1:2;return n;}

  function normalise(raw={}){
    const out={...DEF.defaultSettings,...raw};
    out.difficulty=['easy','standard','challenge'].includes(out.difficulty)?out.difficulty:'standard';
    out.gridSize=['auto','5','6','7'].includes(String(out.gridSize))?String(out.gridSize):'auto';
    out.propertyMode=MODES.includes(out.propertyMode)?out.propertyMode:'auto';
    return out;
  }
  A.normalise=function(id,raw={}){return id==='propertymaze'?normalise(raw):ORIGINAL_NORMALISE(id,raw);};

  function sizeFor(o){if(o.gridSize!=='auto')return Number(o.gridSize);return o.difficulty==='easy'?5:o.difficulty==='challenge'?7:6;}
  function planFor(o,n){
    const base=o.difficulty==='easy'?{path:9,branches:0}:o.difficulty==='challenge'?{path:19,branches:6}:{path:14,branches:3};
    const maxValid=Math.max(7,n*n-6);
    return {path:Math.min(base.path,maxValid-base.branches),branches:Math.min(base.branches,Math.max(0,maxValid-base.path))};
  }
  function autoModes(settings,o){
    const y=clamp(Number(settings?.maxYear)||6,1,6);
    let modes=['factor','multiple','divisible'];
    if(y>=5)modes.push('prime','square');
    if(y>=6&&o.difficulty==='challenge')modes.push('common_factor','common_multiple');
    return modes;
  }

  function pickDivisorTarget(diff,needed,rng){
    const banks={
      easy:[36,48,60,72,84,90],
      standard:[180,240,360,420,480,600],
      challenge:[720,840,1080,1260,1440,1680]
    };
    const viable=(banks[diff]||banks.standard).filter(v=>divisorCount(v)>=needed);
    return choose(viable.length?viable:banks.challenge,rng);
  }
  function makeRule(settings,o,rng,needed){
    const mode=o.propertyMode==='auto'?choose(autoModes(settings,o),rng):o.propertyMode;
    if(mode==='prime')return {mode,label:'prime numbers',shortLabel:'Prime numbers'};
    if(mode==='square')return {mode,label:'square numbers',shortLabel:'Square numbers'};
    if(mode==='factor'){
      const a=pickDivisorTarget(o.difficulty,needed,rng);
      return {mode,a,label:`factors of ${a}`,shortLabel:`Factors of ${a}`};
    }
    if(mode==='multiple'){
      const a=choose(o.difficulty==='easy'?[2,3,4,5,6]:[3,4,5,6,7,8,9,10,12],rng);
      return {mode,a,label:`multiples of ${a}`,shortLabel:`Multiples of ${a}`};
    }
    if(mode==='divisible'){
      const a=choose(o.difficulty==='easy'?[2,3,4,5,10]:[3,4,5,6,8,9,10,12],rng);
      return {mode,a,label:`numbers divisible by ${a}`,shortLabel:`Divisible by ${a}`};
    }
    if(mode==='common_factor'){
      const d=pickDivisorTarget(o.difficulty,needed,rng),a=d*choose([2,4,5],rng),b=d*choose([3,7,9],rng);
      return {mode,a,b,gcd:d,label:`common factors of ${a} and ${b}`,shortLabel:`Common factors of ${a} and ${b}`};
    }
    const pair=choose(o.difficulty==='easy'?[[2,3],[2,4],[3,4]]:[[3,4],[4,6],[5,6],[6,8],[4,9]],rng),a=pair[0],b=pair[1];
    return {mode:'common_multiple',a,b,lcm:lcm(a,b),label:`common multiples of ${a} and ${b}`,shortLabel:`Common multiples of ${a} and ${b}`};
  }
  function matchesRule(v,rule){
    v=Math.trunc(Number(v));if(!Number.isFinite(v)||v<1)return false;
    if(rule.mode==='prime')return isPrime(v);
    if(rule.mode==='square')return Number.isInteger(Math.sqrt(v));
    if(rule.mode==='factor')return rule.a%v===0;
    if(rule.mode==='multiple'||rule.mode==='divisible')return v%rule.a===0;
    if(rule.mode==='common_factor')return rule.a%v===0&&rule.b%v===0;
    if(rule.mode==='common_multiple')return v%rule.a===0&&v%rule.b===0;
    return false;
  }

  function makeInducedPath(n,length,rng){
    const starts=shuffle(borderCells(n),rng);
    for(let outer=0;outer<Math.min(30,starts.length*2);outer++){
      const start=starts[outer%starts.length],path=[start],used=new Set([key(start)]);let nodes=0;
      function dfs(){
        if(path.length===length)return true;
        if(nodes++>12000)return false;
        const cur=path[path.length-1],prev=path.length>1?path[path.length-2]:null;
        let cands=neighbours(cur,n).filter(p=>!used.has(key(p))&&neighbours(p,n).filter(q=>used.has(key(q))).length===1);
        cands=shuffle(cands,rng).sort((a,b)=>{
          const onward=p=>neighbours(p,n).filter(q=>!used.has(key(q))).length;
          const turn=p=>!prev?0:((cur[0]-prev[0])!==(p[0]-cur[0])||(cur[1]-prev[1])!==(p[1]-cur[1])?1:0);
          return (turn(b)-turn(a))*3+(onward(b)-onward(a));
        });
        for(const p of cands){
          path.push(p);used.add(key(p));
          if(dfs())return true;
          used.delete(key(p));path.pop();
        }
        return false;
      }
      if(dfs())return path.map(p=>p.slice());
    }
    return null;
  }

  function addBranches(path,n,count,rng){
    const valid=new Set(path.map(key)),protectedKeys=new Set([key(path[0]),key(path[path.length-1])]),added=[];
    for(let i=0;i<count;i++){
      let cands=allCells(n).filter(p=>!valid.has(key(p)));
      cands=cands.filter(p=>{
        const touching=neighbours(p,n).filter(q=>valid.has(key(q)));
        return touching.length===1&&!protectedKeys.has(key(touching[0]));
      });
      if(!cands.length)break;
      cands=shuffle(cands,rng).sort((a,b)=>{
        const edge=p=>p[0]===0||p[1]===0||p[0]===n-1||p[1]===n-1?1:0;
        return edge(a)-edge(b);
      });
      const p=cands[0];valid.add(key(p));added.push(p);
    }
    return {validKeys:[...valid],branchCells:added};
  }

  function maxValueFor(rule,needed,diff){
    if(rule.mode==='factor')return Math.max(rule.a+80,180);
    if(rule.mode==='common_factor')return Math.max(rule.gcd+120,240);
    if(rule.mode==='common_multiple')return Math.max(rule.lcm*(needed+12),180);
    if(rule.mode==='multiple'||rule.mode==='divisible')return Math.max(rule.a*(needed+12),diff==='challenge'?260:160);
    if(rule.mode==='square')return Math.max((needed+9)**2,diff==='challenge'?625:324);
    return diff==='challenge'?220:150;
  }
  function makePools(rule,needed,total,diff){
    let limit=maxValueFor(rule,needed,diff),yes=[],no=[];
    for(let pass=0;pass<6;pass++){
      yes=[];no=[];
      for(let v=1;v<=limit;v++)(matchesRule(v,rule)?yes:no).push(v);
      if(yes.length>=needed&&no.length>=total-needed)return {yes,no,limit};
      limit=Math.ceil(limit*1.6);
    }
    return {yes,no,limit};
  }
  function assignValues(n,validKeys,rule,o,rng){
    const valid=new Set(validKeys),cells=allCells(n),needed=valid.size,pools=makePools(rule,needed,cells.length,o.difficulty);
    if(pools.yes.length<needed||pools.no.length<cells.length-needed)return null;
    const yes=shuffle(pools.yes,rng).slice(0,needed),no=shuffle(pools.no,rng).slice(0,cells.length-needed),grid=Array.from({length:n},()=>Array(n).fill(0));let yi=0,ni=0;
    for(const p of shuffle(cells,rng))grid[p[0]][p[1]]=valid.has(key(p))?yes[yi++]:no[ni++];
    return grid;
  }

  function solveRoutes(grid,rule,start,finish,limit=2){
    const n=grid.length,target=key(finish),seen=new Set(),path=[],solutions=[];
    function rec(p){
      if(solutions.length>=limit)return;
      const k=key(p);seen.add(k);path.push(p);
      if(k===target)solutions.push(path.map(q=>q.slice()));
      else for(const q of neighbours(p,n)){
        const qk=key(q);if(seen.has(qk)||!matchesRule(grid[q[0]][q[1]],rule))continue;
        rec(q);if(solutions.length>=limit)break;
      }
      path.pop();seen.delete(k);
    }
    if(matchesRule(grid[start[0]][start[1]],rule)&&matchesRule(grid[finish[0]][finish[1]],rule))rec(start);
    return {count:solutions.length,path:solutions[0]||[]};
  }

  function generatePropertyMaze(settings,seed){
    const o=normalise(settings?.engineSettings?.propertymaze),n=sizeFor(o),plan=planFor(o,n),rng=rngFromSeed(`${seed}:propertymaze`),needed=plan.path+plan.branches,rule=makeRule(settings,o,rng,needed);
    for(let attempt=0;attempt<90;attempt++){
      const local=rngFromSeed(`${seed}:propertymaze:${attempt}`),path=makeInducedPath(n,plan.path,local);if(!path)continue;
      const branched=addBranches(path,n,plan.branches,local);if(branched.validKeys.length<plan.path+Math.min(plan.branches,1))continue;
      const grid=assignValues(n,branched.validKeys,rule,o,local);if(!grid)continue;
      const start=path[0],finish=path[path.length-1],check=solveRoutes(grid,rule,start,finish,2);
      if(check.count!==1)continue;
      const validSet=new Set(branched.validKeys),routeSet=new Set(check.path.map(key)),deadEndCount=[...validSet].filter(k=>!routeSet.has(k)).length;
      return {
        engineId:'propertymaze',title:'Number Property Maze',difficulty:o.difficulty,size:n,grid,rule,start,finish,
        solutionPath:check.path,solutionKeys:check.path.map(key),validKeys:[...validSet],deadEndCount,
        instruction:`Start at START and reach FINISH by moving only through ${rule.label}. Move up, down, left or right — never diagonally.${deadEndCount?' Some matching numbers are dead ends.':''}`,
        seed,options:o,engineVersion:VERSION
      };
    }
    return {engineId:'propertymaze',title:'Number Property Maze',difficulty:o.difficulty,error:'Could not build a clean unique property maze. Generate another version.',seed,options:o,engineVersion:VERSION};
  }

  function validatePropertyMaze(a){
    if(!a||a.error)return {ok:false,error:a?.error||'missing activity'};
    const n=Number(a.size);if(!Number.isInteger(n)||n<5||n>7)return {ok:false,error:'property maze size invalid'};
    if(a.grid?.length!==n||a.grid.some(row=>row?.length!==n))return {ok:false,error:'property maze grid shape invalid'};
    for(const row of a.grid)for(const v of row)if(!Number.isInteger(v)||v<1)return {ok:false,error:'property maze values must be positive integers'};
    if(!a.rule||!Array.isArray(a.start)||!Array.isArray(a.finish))return {ok:false,error:'property maze metadata missing'};
    const valid=new Set(a.validKeys||[]);
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const matches=matchesRule(a.grid[r][c],a.rule),listed=valid.has(`${r}:${c}`);
      if(matches!==listed)return {ok:false,error:'property maze classification mismatch'};
    }
    const checked=solveRoutes(a.grid,a.rule,a.start,a.finish,2);
    if(checked.count!==1)return {ok:false,error:checked.count?'property maze route is not unique':'property maze has no route'};
    const stored=(a.solutionPath||[]).map(key).join('|'),actual=checked.path.map(key).join('|');
    if(stored!==actual)return {ok:false,error:'property maze stored route mismatch'};
    for(let i=1;i<checked.path.length;i++){
      const p=checked.path[i-1],q=checked.path[i];if(Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])!==1)return {ok:false,error:'property maze route is not orthogonal'};
    }
    return {ok:true};
  }

  function workedExample(){
    return {engineId:'propertymaze',kind:'propertymaze',title:'Number Property Maze worked example',goal:'Reach FINISH by moving only through numbers that satisfy the stated property.',rules:['Move only up, down, left or right.','Every number you move through must match the stated number property.','Do not move diagonally. A matching number can still lead to a dead end.'],steps:['Read the property first — for example, “multiples of 4”.','Check the squares touching START and choose a number that matches.','Keep testing the property as you move through touching squares.','If a matching route reaches a dead end, return to the last choice and try the other matching number.'],tip:'Check the maths property before thinking about the direction of the route.',commonMistake:'Do not assume every number with the right property is part of the final route.'};
  }

  A.generate=function(id,settings,seed){return id==='propertymaze'?generatePropertyMaze(settings,seed):ORIGINAL_GENERATE(id,settings,seed);};
  A.validate=function(a){return a?.engineId==='propertymaze'?validatePropertyMaze(a):ORIGINAL_VALIDATE(a);};
  A.workedExample=function(id,...args){return id==='propertymaze'?workedExample():ORIGINAL_WORKED(id,...args);};
  A.PROPERTY_MAZE={VERSION,DEFINITION:DEF,generate:generatePropertyMaze,validate:validatePropertyMaze,matchesRule,solveRoutes};
  A.__propertyMazeV1=true;

  if(typeof module!=='undefined'&&module.exports)module.exports=A;
})(typeof globalThis!=='undefined'?globalThis:this);
