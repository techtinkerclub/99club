/* 99 Club Studio · v1.37 Number Towers + Kakuro 8x8 extension
 * Loaded after games-number-logic.js and before games-engine.js.
 * Keeps the existing numeric-logic engine intact while extending its public API.
 */
(function(global){
  'use strict';
  let NL=global.TT99NumberLogicGames||null;
  if(!NL&&typeof require==='function'){
    try{NL=require('./games-number-logic.js');}catch(e){}
  }
  if(!NL||NL.__v137NumberTowers)return;
  NL.__v137NumberTowers=true;

  const choiceOptions=values=>values.map(([value,label])=>({value,label}));
  const compat=(excellent=[],reasonable=[])=>Object.fromEntries(['number_place_value','calculation','fractions','decimals_percentages','ratio_proportion','measurement','geometry','statistics','algebra'].map(t=>[t,excellent.includes(t)?'excellent':reasonable.includes(t)?'reasonable':'poor']));

  NL.DEFINITIONS.numbertowers={
    id:'numbertowers',title:'Number Towers · Skyscrapers',group:'Numeric logic',kind:'independent',printableMode:'grid',answerSheetSupport:true,workedExampleSupport:true,
    needsCutting:false,needsDice:false,needsPartner:false,supportedAnswerTypes:['number','logic'],difficultyOptions:['easy','standard','challenge'],
    defaultSettings:{difficulty:'standard',gridSize:'auto',clueLevel:'auto'},
    settingsSchema:[
      {id:'difficulty',type:'difficulty',label:'Difficulty'},
      {id:'gridSize',type:'select',label:'Grid size',options:choiceOptions([['auto','Auto'],['4','4 × 4'],['5','5 × 5'],['6','6 × 6']])},
      {id:'clueLevel',type:'select',label:'Edge clues',options:choiceOptions([['auto','Auto'],['more','More clues'],['balanced','Balanced'],['fewer','Fewer clues']])}
    ],
    difficultyDescriptions:{easy:'4 × 4 with generous edge clues',standard:'5 × 5 with a balanced clue set',challenge:'6 × 6 with fewer clues and deeper deduction'},
    topicYearMin:{number_place_value:3,geometry:3},
    compatibility:compat(['number_place_value'],['geometry'])
  };

  // Add the missing manual 8×8 Kakuro option and a validated 8×8 mask.
  const kakuro=NL.DEFINITIONS.kakuro;
  if(kakuro){
    const gridSpec=(kakuro.settingsSchema||[]).find(x=>x.id==='gridSize');
    if(gridSpec&&Array.isArray(gridSpec.options)&&!gridSpec.options.some(o=>String(o?.value??o)==='8')){
      const idx=gridSpec.options.findIndex(o=>String(o?.value??o)==='9');
      const option={value:'8',label:'8 × 8'};
      if(idx>=0)gridSpec.options.splice(idx,0,option);else gridSpec.options.push(option);
    }
    NL._KAKURO_MASKS[8]=[
      [0,0,0,0,0,0,0,0],
      [0,1,1,1,0,1,1,1],
      [0,1,1,1,1,1,1,1],
      [0,1,1,0,1,1,1,0],
      [0,1,1,1,1,0,1,1],
      [0,0,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1]
    ];
  }

  function hashString(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function rngFromSeed(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function visibleCount(line){let max=0,count=0;for(const v of line){if(v>max){max=v;count++;}}return count;}
  function permutations(n){
    const out=[],a=Array.from({length:n},(_,i)=>i+1);
    function rec(i){if(i===n){out.push(a.slice());return;}for(let j=i;j<n;j++){[a[i],a[j]]=[a[j],a[i]];rec(i+1);[a[i],a[j]]=[a[j],a[i]];}}
    rec(0);return out;
  }
  const PERM_CACHE={};
  function perms(n){return PERM_CACHE[n]||(PERM_CACHE[n]=permutations(n));}
  function latinSolution(n,rng){
    const symbols=shuffle(Array.from({length:n},(_,i)=>i+1),rng),rows=shuffle(Array.from({length:n},(_,i)=>i),rng),cols=shuffle(Array.from({length:n},(_,i)=>i),rng),shift=Math.floor(rng()*n);
    return rows.map(r=>cols.map(c=>symbols[(r+c+shift)%n]));
  }
  function towerClues(grid){
    const n=grid.length,top=[],right=[],bottom=[],left=[];
    for(let r=0;r<n;r++){left.push(visibleCount(grid[r]));right.push(visibleCount(grid[r].slice().reverse()));}
    for(let c=0;c<n;c++){const col=grid.map(row=>row[c]);top.push(visibleCount(col));bottom.push(visibleCount(col.slice().reverse()));}
    return {top,right,bottom,left};
  }
  function cluesMatch(line,a,b){if(a&&visibleCount(line)!==a)return false;if(b&&visibleCount(line.slice().reverse())!==b)return false;return true;}
  function countTowerSolutions(n,clues,limit=2){
    const ps=perms(n),rowCandidates=Array.from({length:n},(_,r)=>ps.filter(p=>cluesMatch(p,clues.left[r]||0,clues.right[r]||0))),cols=Array.from({length:n},()=>new Set()),grid=Array(n),count={v:0};
    function topPossible(c,depth){const target=clues.top[c]||0;if(!target)return true;const line=[];for(let r=0;r<depth;r++)line.push(grid[r][c]);let vis=visibleCount(line),max=Math.max(0,...line),remaining=n-depth;if(vis>target)return false;if(vis+remaining<target)return false;if(depth===n&&vis!==target)return false;return true;}
    function rec(r){if(count.v>=limit)return;if(r===n){for(let c=0;c<n;c++){const col=grid.map(row=>row[c]);if(!cluesMatch(col,clues.top[c]||0,clues.bottom[c]||0))return;}count.v++;return;}
      for(const row of rowCandidates[r]){let ok=true;for(let c=0;c<n;c++)if(cols[c].has(row[c])){ok=false;break;}if(!ok)continue;grid[r]=row;for(let c=0;c<n;c++)cols[c].add(row[c]);for(let c=0;c<n&&ok;c++)ok=topPossible(c,r+1);if(ok)rec(r+1);for(let c=0;c<n;c++)cols[c].delete(row[c]);if(count.v>=limit)return;}}
    rec(0);return count.v;
  }

  function solveTowersByLogic(n,clues){
    const all=()=>new Set(Array.from({length:n},(_,i)=>i+1)),domains=Array.from({length:n},()=>Array.from({length:n},all)),ps=perms(n);let passes=0,eliminations=0;
    function reduce(set,allowed){let changed=false;for(const v of [...set])if(!allowed.has(v)){set.delete(v);eliminations++;changed=true;}return changed;}
    function grid(){return domains.map(row=>row.map(s=>s.size===1?[...s][0]:0));}
    for(let guard=0;guard<120;guard++){
      passes++;let changed=false;
      for(let r=0;r<n;r++){
        const opts=ps.filter(p=>cluesMatch(p,clues.left[r]||0,clues.right[r]||0)&&p.every((v,c)=>domains[r][c].has(v)));
        if(!opts.length)return {solved:false,contradiction:true,passes,eliminations,grid:grid(),domains};
        for(let c=0;c<n;c++){const allowed=new Set(opts.map(p=>p[c]));if(reduce(domains[r][c],allowed))changed=true;if(!domains[r][c].size)return {solved:false,contradiction:true,passes,eliminations,grid:grid(),domains};}
      }
      for(let c=0;c<n;c++){
        const opts=ps.filter(p=>cluesMatch(p,clues.top[c]||0,clues.bottom[c]||0)&&p.every((v,r)=>domains[r][c].has(v)));
        if(!opts.length)return {solved:false,contradiction:true,passes,eliminations,grid:grid(),domains};
        for(let r=0;r<n;r++){const allowed=new Set(opts.map(p=>p[r]));if(reduce(domains[r][c],allowed))changed=true;if(!domains[r][c].size)return {solved:false,contradiction:true,passes,eliminations,grid:grid(),domains};}
      }
      if(domains.every(row=>row.every(s=>s.size===1)))return {solved:true,contradiction:false,passes,eliminations,grid:grid(),domains};
      if(!changed)return {solved:false,contradiction:false,passes,eliminations,grid:grid(),domains};
    }
    return {solved:false,contradiction:false,passes,eliminations,grid:grid(),domains};
  }
  function restoreTowerCluesUntilLogical(solution,clues,seed){
    const full=towerClues(solution),out={top:clues.top.slice(),right:clues.right.slice(),bottom:clues.bottom.slice(),left:clues.left.slice()},rng=rngFromSeed(String(seed)+':tower-logic'),missing=[];
    for(const side of ['top','right','bottom','left'])for(let i=0;i<solution.length;i++)if(!out[side][i])missing.push([side,i]);
    let audit=solveTowersByLogic(solution.length,out),restored=0;
    for(const [side,i] of shuffle(missing,rng)){if(audit.solved)break;out[side][i]=full[side][i];restored++;audit=solveTowersByLogic(solution.length,out);}
    return {clues:out,audit,restored};
  }

  function towerSize(settings,o){if(o.gridSize!=='auto')return Number(o.gridSize);if(o.difficulty==='easy')return 4;if(o.difficulty==='challenge')return 6;return 5;}
  function clueTargetRatio(o){if(o.clueLevel==='more')return .78;if(o.clueLevel==='balanced')return .60;if(o.clueLevel==='fewer')return .44;return o.difficulty==='easy'?.80:o.difficulty==='challenge'?.44:.60;}
  function encodePayload(data){const s=JSON.stringify(data);if(typeof btoa==='function')return btoa(s);if(typeof Buffer!=='undefined')return Buffer.from(s,'utf8').toString('base64');return s;}
  function generateNumberTowers(settings,seed){
    const o=NL.normalise('numbertowers',settings?.engineSettings?.numbertowers),n=towerSize(settings,o),rng=rngFromSeed(`${seed}:towers`),solution=latinSolution(n,rng),full=towerClues(solution),clues={top:full.top.slice(),right:full.right.slice(),bottom:full.bottom.slice(),left:full.left.slice()},all=[];
    for(const side of ['top','right','bottom','left'])for(let i=0;i<n;i++)all.push([side,i]);
    const wanted=Math.max(n+2,Math.round(all.length*clueTargetRatio(o)));
    for(const [side,i] of shuffle(all,rng)){
      if(all.length<=wanted)break;
      const old=clues[side][i];clues[side][i]=0;
      if(countTowerSolutions(n,clues,2)!==1)clues[side][i]=old;
    }
    // Second reduction pass attempts to approach the target while preserving uniqueness.
    let shown=['top','right','bottom','left'].reduce((s,side)=>s+clues[side].filter(Boolean).length,0);
    if(shown>wanted){for(const [side,i] of shuffle(all,rngFromSeed(`${seed}:towers:reduce`))){if(shown<=wanted)break;if(!clues[side][i])continue;const old=clues[side][i];clues[side][i]=0;if(countTowerSolutions(n,clues,2)===1)shown--;else clues[side][i]=old;}}
    const repaired=restoreTowerCluesUntilLogical(solution,clues,seed),finalClues=repaired.clues,audit=repaired.audit;if(!audit.solved)return {engineId:'numbertowers',title:'Number Towers · Skyscrapers',error:'A deduction-solvable Number Towers puzzle could not be built. Generate another version.'};
    const payload={n,solution,clues:finalClues};
    return {engineId:'numbertowers',title:'Number Towers · Skyscrapers',difficulty:o.difficulty,size:n,solutionGrid:solution,clues:finalClues,logicStats:{solved:true,passes:audit.passes,eliminations:audit.eliminations,restoredClues:repaired.restored},seed,options:o,
      instruction:`Fill the grid with 1–${n}, using each height once in every row and column. Edge clues tell how many towers are visible from that direction. [[TT99TOWERS:${encodePayload(payload)}]]`};
  }
  function validateNumberTowers(a){
    if(!a||a.error)return {ok:false,error:a?.error||'missing activity'};const n=a.size,g=a.solutionGrid;if(!Array.isArray(g)||g.length!==n)return {ok:false,error:'tower grid size mismatch'};
    for(let r=0;r<n;r++){if(new Set(g[r]).size!==n)return {ok:false,error:'tower row repeat'};const col=g.map(row=>row[r]);if(new Set(col).size!==n)return {ok:false,error:'tower column repeat'};}
    const actual=towerClues(g);for(const side of ['top','right','bottom','left'])for(let i=0;i<n;i++)if(a.clues?.[side]?.[i]&&a.clues[side][i]!==actual[side][i])return {ok:false,error:`tower ${side} clue mismatch`};
    if(countTowerSolutions(n,a.clues,2)!==1)return {ok:false,error:'number towers not unique'};const logic=solveTowersByLogic(n,a.clues);if(!logic.solved)return {ok:false,error:'number towers requires guessing; deduction solver stalled'};for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(logic.grid[r][c]!==g[r][c])return {ok:false,error:'number towers deduction solution mismatch'};return {ok:true,logicPasses:logic.passes};
  }

  const baseGenerate=NL.generate.bind(NL),baseWorked=NL.workedExample.bind(NL),baseValidate=NL.validate.bind(NL);
  NL.generate=function(id,settings,seed){
    if(id==='numbertowers')return generateNumberTowers(settings,seed);
    if(id==='kakuro'){
      const raw=settings?.engineSettings?.kakuro||{};
      if(raw.gridSize==='auto'&&raw.difficulty==='challenge'&&(Number(settings?.maxYear)||6)>=6){
        const copy=JSON.parse(JSON.stringify(settings||{}));copy.engineSettings=copy.engineSettings||{};copy.engineSettings.kakuro={...raw,gridSize:'8'};return baseGenerate(id,copy,seed);
      }
    }
    return baseGenerate(id,settings,seed);
  };
  NL.workedExample=function(id){if(id==='numbertowers')return {engineId:id,kind:id,title:'Number Towers worked example',goal:'Use the edge clues to place tower heights.',rules:['Use 1–N once in every row and column.','A taller tower hides every shorter tower behind it.','Each edge clue counts the towers visible from that side.'],steps:['If a 4×4 row has clue 4, the row must increase 1, 2, 3, 4 from that side.','If a row starts with 4, a clue of 1 is satisfied because no shorter tower behind it can be seen.','Combine the view clues with the no-repeat row and column rule.'],tip:'Clues 1 and N are the strongest places to start.',commonMistake:'The clue counts visible towers, not their total height.'};return baseWorked(id);};
  NL.validate=function(a){if(a?.engineId==='numbertowers')return validateNumberTowers(a);return baseValidate(a);};
  NL._countTowerSolutions=countTowerSolutions;
  NL._towerClues=towerClues;
  NL._solveTowersByLogic=solveTowersByLogic;
  NL._restoreTowerCluesUntilLogical=restoreTowerCluesUntilLogical;

  if(typeof module!=='undefined'&&module.exports)module.exports=NL;global.TT99NumberLogicGames=NL;
})(typeof globalThis!=='undefined'?globalThis:this);
