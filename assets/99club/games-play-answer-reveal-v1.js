/* 99 Club Studio · Online answer reveal bridge v1
 * Supplies a solved snapshot to the existing Online Play view for every game
 * whose answer can be represented by its normal restore() contract.
 * Multi-stage Operation Codebreaker exposes its own revealAnswer() because its
 * final secret word is deliberately held inside that adapter's mount closure.
 */
(function(global){
'use strict';
const Play=global.TT99GamesPlay;
if(!Play?.adapters)return;
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const textGrid=g=>(g||[]).map(row=>row.map(v=>v==null?v:String(v)));

function targetTokens(ch){
  const raw=String(ch?.solution||''),parts=raw.match(/\d+(?:\.\d+)?|[()+\-×÷]/g)||[],used=[];
  const tokens=parts.map(part=>{
    if(!/^\d+(?:\.\d+)?$/.test(part))return part;
    const value=Number(part),i=(ch.numbers||[]).findIndex((v,idx)=>!used.includes(idx)&&Number(v)===value);
    if(i<0)return {type:'num',value,index:-1};
    used.push(i);return {type:'num',value:ch.numbers[i],index:i};
  });
  return {tokens,used};
}
function brokenTokens(t){return String(t?.solution||'').match(/\d+(?:\.\d+)?|[()+\-×÷]/g)||[];}
function crossnumberSolution(p){
  const out=Array.from({length:Number(p.height)||0},()=>Array(Number(p.width)||0).fill(null));
  for(const e of p.entries||[]){const answer=String(e.answerText??e.answer??'');(e.cells||[]).forEach(([x,y],i)=>{if(out[y])out[y][x]=answer[i]??null;});}
  return out;
}
function numberWheelSolution(p){
  const out={};
  (p.items||[]).forEach((item,ii)=>{
    if(p.style==='wheel'){
      (item.inputs||[]).forEach((v,j)=>{if(item.displayInputs?.[j]==null)out[`w:${ii}:i:${j}`]=String(v);});
      (item.outputs||[]).forEach((v,j)=>{if(item.displayOutputs?.[j]==null)out[`w:${ii}:o:${j}`]=String(v);});
    }else if(p.style==='factor'){
      if(item.displayCentre==null)out[`f:${ii}:center`]=String(item.centre);
      (item.pairs||[]).forEach((pair,j)=>{const d=item.displayPairs?.[j]||[null,null];if(d[0]==null)out[`f:${ii}:p:${j}:0`]=String(pair[0]);if(d[1]==null)out[`f:${ii}:p:${j}:1`]=String(pair[1]);});
    }else{
      for(const k of item.hidden||[])out[`d:${ii}:${k}`]=String(item[k]);
    }
  });
  return out;
}

const grid=p=>clone(p.solutionGrid);
const providers={
  shikaku:p=>(p.solutionRects||[]).map(r=>({r:r.r,c:r.c,h:r.h,w:r.w})),
  sumplete:p=>(p.solutionMask||[]).map(row=>row.map(keep=>keep?0:1)),
  nonogram:p=>(p.solutionGrid||[]).map(row=>row.map(v=>Number(v)===1?1:2)),
  mathsmines:p=>{const gems=new Set(p.solutionGems||[]),clues=p.clues||{},n=Number(p.size)||0;return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>{const k=`${r}:${c}`;return Object.prototype.hasOwnProperty.call(clues,k)?0:(gems.has(k)?1:2);}));},
  takuzu:grid,
  sudoku:grid,
  futoshiki:grid,
  killersudoku:grid,
  kakuro:grid,
  arithmeticcages:grid,
  alphametics:p=>clone(p.solution||{}),
  cornersum:grid,
  linkedsum:grid,
  hashi:p=>(p.edges||[]).map(e=>Number(e.solution)||0),
  numberpath:grid,
  wordsearch:p=>(p.placements||[]).map((_,i)=>i),
  brokencalc:p=>({current:0,entries:(p.targets||[]).map(t=>({tokens:brokenTokens(t),solved:true,result:Number(t.target),tried:true}))}),
  target:p=>({current:0,states:(p.challenges||[]).map(ch=>{const q=targetTokens(ch);return {tokens:q.tokens,used:q.used,solved:true,tried:true,value:Number(ch.target)};})}),
  numbertowers:grid,
  propertymaze:p=>clone(p.solutionPath||[]),
  maze:p=>({path:clone(p.path||[]),step:(p.steps||[]).length,attempt:null}),
  crossnumber:crossnumberSolution,
  pyramid:p=>textGrid(p.rows),
  magic:p=>{
    if(p.puzzleType==='check')return {answer:!!p.checkIsMagic};
    if(p.puzzleType==='repair')return {cell:p.wrongCell,correction:String(p.correctValue)};
    return {grid:textGrid(p.solutionGrid),total:p.puzzleType==='transform'?String(p.magicSum):''};
  },
  arithmagon:p=>({corners:(p.corners||[]).map(String),links:(p.links||[]).map(x=>String(x.value))}),
  magicshape:p=>{
    if(p.puzzleType==='check')return {answer:!!p.isMagic};
    if(p.puzzleType==='repair')return {node:Number(p.brokenIndex),correction:String(p.correctValue)};
    return (p.solutionValues||[]).map(String);
  },
  numbertrail:p=>(p.values||[]).map(String),
  numberwheels:numberWheelSolution,
  numbersearch:p=>(p.placements||[]).map((_,i)=>i),
  equationcrossgrid:p=>textGrid(p.solutionGrid),
  crossword:p=>{const out={};for(const e of p.entries||[])(e.cells||[]).forEach(([x,y],i)=>{out[`${x}:${y}`]=String(e.answer||'')[i]??null;});return out;},
  symbols:p=>Object.fromEntries((p.symbols||p.names||[]).map((s,i)=>[s,String((p.values||[])[i])])),
  functionmachine:p=>Object.fromEntries((p.rows||[]).map((r,i)=>[String(i),String(r.hide==='input'?r.input:r.output)])),
  balance:p=>({answers:(p.rows||[]).map(r=>r.answer),sides:clone(p.finalChallenge?.solutionSides||[])}),
  colourlogic:p=>clone(p.variant==='row'?p.solution:p.solutionGrid),
  mobilebalance:p=>clone(p.values||{}),
  diagonalpath:grid,
  squaresearch:p=>(p.matches||[]).map(m=>`${m.r}:${m.c}`),
  insertops:p=>clone(p.solutionOps||[]),
  perimeterregions:p=>clone(p.solutionEdges||[])
};

for(const [id,adapter] of Play.adapters){
  if(!adapter||adapter.__answerRevealV1)continue;
  const provider=providers[id];
  if(!provider&&id!=='operationgrid'){console.warn(`99 Studio: no answer reveal provider for ${id}`);continue;}
  const originalMount=adapter.mount?.bind(adapter);
  if(typeof originalMount!=='function')continue;
  adapter.mount=function(root,puzzle,ctx){
    const view=originalMount(root,puzzle,ctx);
    if(view&&typeof view.revealAnswer!=='function'&&provider){
      view.revealAnswer=function(){
        const solved=provider(puzzle);
        if(solved==null)return false;
        view.restore(clone(solved));
        return true;
      };
    }
    return view;
  };
  adapter.__answerRevealV1=true;
}
global.TT99GamesPlayAnswerRevealV1={providers};
})(typeof globalThis!=='undefined'?globalThis:this);
