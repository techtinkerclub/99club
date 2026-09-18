/* 99 Club Studio · Online Play number structures wave v1.73
 * Interactive adapters for Number Pyramid, Magic Squares, Arithmagons and Magic Number Shapes.
 * Reuses the mature printable generators from games-engine.js / games-arithmetic.js.
 */
(function(global){
'use strict';
const Play=global.TT99GamesPlay,G=global.TT99Games;
if(!Play||!G)return;

const DIFFS=['easy','standard','challenge'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>G.formatNumber?G.formatNumber(v):String(v);
const key=(r,c)=>`${r}:${c}`;
const parseNumber=v=>{const s=String(v??'').trim();if(!s)return null;const n=Number(s);return Number.isFinite(n)?n:null;};
const equal=(a,b)=>{const x=parseNumber(a),y=Number(b);return x!==null&&Number.isFinite(y)&&Math.abs(x-y)<1e-8;};
const cap=s=>String(s||'').replace(/^./,x=>x.toUpperCase());
const clone=x=>JSON.parse(JSON.stringify(x));

function choice(id,label,values,current,labels={}){
  return `<label><span>${esc(label)}</span><select data-play-opt="${esc(id)}">${values.map(v=>`<option value="${esc(v)}" ${String(current)===String(v)?'selected':''}>${esc(labels[v]||cap(v))}</option>`).join('')}</select></label>`;
}
function bindOptions(root,config,normalise,onChange){
  root.querySelectorAll('[data-play-opt]').forEach(el=>el.addEventListener('change',()=>onChange(normalise({...config,[el.dataset.playOpt]:el.value}))));
}
function generated(id,config,seed,topics=['calculation'],minYear=1){
  const settings={minYear,maxYear:6,topics,selectedEngines:[id],engineSettings:{[id]:config}};
  const p=G.generateActivity(id,settings,`${seed}:online`);
  if(!p||p.error)throw new Error(`${id} generation failed${p?.error?`: ${p.error}`:''}`);
  return p;
}
function entryValueHtml(value,entryKey,label){
  return `<input class="tt99-structure-entry" data-entry="${esc(entryKey)}" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="${esc(label)}" value="${esc(value||'')}">`;
}
function setEntryMarks(root,wrong,hint){
  root.querySelectorAll('[data-entry]').forEach(el=>{
    const k=el.dataset.entry;
    el.classList.toggle('is-wrong',wrong.has(k));
    el.classList.toggle('is-hint',hint===k);
  });
}

/* ---------------- Number Pyramid ---------------- */
const PYR_LEVELS=['auto','3','4','5','6','7'],PYR_CLUES=['more','balanced','fewer'];
function normalisePyramid(c={}){
  return {difficulty:DIFFS.includes(c.difficulty)?c.difficulty:'standard',levels:PYR_LEVELS.includes(String(c.levels))?String(c.levels):'auto',clueLevel:PYR_CLUES.includes(c.clueLevel)?c.clueLevel:'balanced'};
}
function pyramidOptions(root,c,onChange){
  c=normalisePyramid(c);
  root.innerHTML=choice('difficulty','Difficulty',DIFFS,c.difficulty)+choice('levels','Pyramid levels',PYR_LEVELS,c.levels,{auto:'Auto','3':'3 levels','4':'4 levels','5':'5 levels','6':'6 levels','7':'7 levels'})+choice('clueLevel','Clues shown',PYR_CLUES,c.clueLevel,{more:'More clues',balanced:'Balanced',fewer:'Fewer clues'});
  bindOptions(root,c,normalisePyramid,onChange);
}
function mountPyramid(root,p,ctx){
  const missing=new Set(p.missingSet||p.missing?.map(([r,c])=>key(r,c))||[]);
  let state=p.rows.map((row,r)=>row.map((v,c)=>missing.has(key(r,c))?'':String(v))),wrong=new Set(),hint=null,finished=false;
  root.className='tt99-play-pyramid';
  root.innerHTML=`<div class="tt99-pyramid-board" style="--levels:${p.rows.length}">${p.rows.map((row,r)=>`<div class="tt99-pyramid-row" style="--count:${row.length}">${row.map((v,c)=>{const k=key(r,c),blank=missing.has(k);return `<div class="tt99-pyramid-brick ${blank?'is-entry':'is-given'}" data-brick="${k}">${blank?entryValueHtml('',k,`Pyramid row ${r+1}, brick ${c+1}`):`<span>${esc(fmt(v))}</span>`}</div>`;}).join('')}</div>`).join('')}</div><p class="tt99-cycle-note">Each brick is the sum of the two bricks directly below it.</p>`;
  function paintValues(){root.querySelectorAll('[data-entry]').forEach(el=>{const [r,c]=el.dataset.entry.split(':').map(Number);el.value=state[r][c]??'';});}
  function paint(){setEntryMarks(root,wrong,hint);root.classList.toggle('is-finished',finished);}
  function snapshot(){return clone(state);}
  function restore(s){state=p.rows.map((row,r)=>row.map((v,c)=>missing.has(key(r,c))?String(s?.[r]?.[c]??''):String(v)));wrong.clear();hint=null;paintValues();paint();}
  function emptySnapshot(){return p.rows.map((row,r)=>row.map((v,c)=>missing.has(key(r,c))?'':String(v)));}
  function filled(){let n=0;for(const k of missing){const [r,c]=k.split(':').map(Number);if(parseNumber(state[r][c])!==null)n++;}return n;}
  function wrongKeys(){const out=[];for(const k of missing){const [r,c]=k.split(':').map(Number);if(parseNumber(state[r][c])!==null&&!equal(state[r][c],p.rows[r][c]))out.push(k);}return out;}
  function complete(){return [...missing].every(k=>{const [r,c]=k.split(':').map(Number);return equal(state[r][c],p.rows[r][c]);});}
  function progress(){return `${filled()} / ${missing.size} blanks filled`;}
  function check({silent=false}={}){if(complete())return {complete:true,message:'Solved! Every brick follows the addition rule.'};const bad=wrongKeys();if(!silent){wrong=new Set(bad);paint();}if(bad.length)return {complete:false,wrong:true,message:`${bad.length} brick${bad.length===1?' is':'s are'} incorrect.`};return {complete:false,wrong:false,message:'Everything filled so far is correct. Keep using the addition rule.'};}
  function valueAt(r,c){return r>=0&&r<state.length&&c>=0&&c<state[r].length?parseNumber(state[r][c]):null;}
  function hintFn(){
    let pick=null,msg='';
    for(const k of missing){const [r,c]=k.split(':').map(Number);if(parseNumber(state[r][c])!==null)continue;
      if(r+1<state.length&&valueAt(r+1,c)!==null&&valueAt(r+1,c+1)!==null){pick=k;msg='This brick has both supporting bricks filled. Add those two numbers.';break;}
      if(r>0&&c<state[r-1].length&&valueAt(r-1,c)!==null&&valueAt(r,c+1)!==null){pick=k;msg='Use the brick above and the known neighbour: subtract the known lower brick from the brick above.';break;}
      if(r>0&&c>0&&valueAt(r-1,c-1)!==null&&valueAt(r,c-1)!==null){pick=k;msg='Use the brick above and the known neighbour: subtract the known lower brick from the brick above.';break;}
    }
    if(!pick){pick=[...missing].find(k=>{const [r,c]=k.split(':').map(Number);return parseNumber(state[r][c])===null;})||null;msg='Look for a blank beside two known numbers. Work forwards by adding, or backwards by subtracting from the brick above.';}
    hint=pick;paint();return {tone:'hint',message:msg};
  }
  function onInput(e){const el=e.target.closest('[data-entry]');if(!el||finished)return;const [r,c]=el.dataset.entry.split(':').map(Number);state[r][c]=el.value;wrong.delete(el.dataset.entry);hint=null;paint();ctx.onChange(snapshot());}
  root.addEventListener('input',onInput);paint();
  return {snapshot,restore,emptySnapshot,progress,check,hint:hintFn,setFinished(v){finished=!!v;wrong.clear();hint=null;paint();},destroy(){root.removeEventListener('input',onInput);}};
}

/* ---------------- Magic Squares ---------------- */
const MAGIC_SIZES=['auto','3','4'],MAGIC_TYPES=['auto','missing','check','repair','transform'],MAGIC_PATTERNS=['auto','classic','shifted','scaled','decimal'],MAGIC_CLUES=['more','balanced','fewer'];
function normaliseMagic(c={}){
  return {difficulty:DIFFS.includes(c.difficulty)?c.difficulty:'standard',gridSize:MAGIC_SIZES.includes(String(c.gridSize))?String(c.gridSize):'auto',puzzleType:MAGIC_TYPES.includes(c.puzzleType)?c.puzzleType:'auto',numberPattern:MAGIC_PATTERNS.includes(c.numberPattern)?c.numberPattern:'auto',clueLevel:MAGIC_CLUES.includes(c.clueLevel)?c.clueLevel:'balanced'};
}
function magicOptions(root,c,onChange){
  c=normaliseMagic(c);
  root.innerHTML=choice('difficulty','Difficulty',DIFFS,c.difficulty)+choice('gridSize','Square size',MAGIC_SIZES,c.gridSize,{auto:'Auto','3':'3 × 3','4':'4 × 4'})+choice('puzzleType','Puzzle style',MAGIC_TYPES,c.puzzleType,{auto:'Auto',missing:'Fill missing',check:'Check: is it magic?',repair:'Repair one value',transform:'Transform'})+choice('numberPattern','Numbers',MAGIC_PATTERNS,c.numberPattern,{auto:'Auto',classic:'Classic',shifted:'Shifted',scaled:'Scaled',decimal:'Decimals'})+choice('clueLevel','Clues shown',MAGIC_CLUES,c.clueLevel,{more:'More clues',balanced:'Balanced',fewer:'Fewer clues'});
  bindOptions(root,c,normaliseMagic,onChange);
}
function magicGridMarkup(p,editableSet=new Set(),clickable=false){
  const n=p.size;
  return `<div class="tt99-magic-grid" style="--n:${n}">${p.displayGrid.map((row,r)=>row.map((v,c)=>{const k=key(r,c),editable=editableSet.has(k);if(editable)return `<div class="tt99-magic-cell is-entry" data-cell="${k}">${entryValueHtml('',k,`Magic square row ${r+1}, column ${c+1}`)}</div>`;return clickable?`<button type="button" class="tt99-magic-cell is-pick" data-pick="${k}">${esc(fmt(v))}</button>`:`<div class="tt99-magic-cell is-given" data-cell="${k}">${esc(fmt(v))}</div>`;}).join('')).join('')}</div>`;
}
function mountMagic(root,p,ctx){
  const type=p.puzzleType,editable=new Set(p.missingSet||[]);let finished=false,wrong=new Set(),hint=null;
  root.className='tt99-play-magic';
  if(type==='check'){
    let state={answer:null};
    root.innerHTML=`<div class="tt99-magic-target">Check every row, column and both main diagonals</div>${magicGridMarkup(p)}<div class="tt99-binary-choice" role="group" aria-label="Is this a magic square?"><button type="button" data-magic-answer="yes">Yes, it is magic</button><button type="button" data-magic-answer="no">No, it is not</button></div>`;
    const buttons=[...root.querySelectorAll('[data-magic-answer]')];
    function paint(){buttons.forEach(b=>{const val=b.dataset.magicAnswer==='yes';b.classList.toggle('is-selected',state.answer===val);b.classList.toggle('is-wrong',wrong.has('answer')&&state.answer===val);});root.classList.toggle('is-finished',finished);}
    function snapshot(){return {...state};}function restore(s){state={answer:typeof s?.answer==='boolean'?s.answer:null};wrong.clear();paint();}function emptySnapshot(){return {answer:null};}
    function progress(){return state.answer===null?'Choose Yes or No':'Answer chosen · press Check';}
    function check({silent=false}={}){if(state.answer===p.checkIsMagic)return {complete:true,message:'Correct! Your magic-square check is right.'};if(state.answer===null)return {complete:false,wrong:false,message:'Choose whether the square is magic, then check your answer.'};if(!silent){wrong=new Set(['answer']);paint();}return {complete:false,wrong:true,message:'That choice is not correct. Compare the line totals again.'};}
    function onClick(e){const b=e.target.closest('[data-magic-answer]');if(!b||finished)return;state.answer=b.dataset.magicAnswer==='yes';wrong.clear();paint();ctx.onChange(snapshot());}
    root.addEventListener('click',onClick);paint();
    return {snapshot,restore,emptySnapshot,progress,check,hint(){return {tone:'hint',message:'Calculate one row total first, then compare another row or column. The moment two required lines have different totals, the square is not magic.'};},setFinished(v){finished=!!v;wrong.clear();paint();},destroy(){root.removeEventListener('click',onClick);}};
  }
  if(type==='repair'){
    let state={cell:null,correction:''};
    root.innerHTML=`<div class="tt99-magic-target">One value is wrong — find and repair it</div>${magicGridMarkup(p,new Set(),true)}<div class="tt99-repair-control"><label><span>Replacement value</span><input class="tt99-structure-entry" data-repair-value inputmode="decimal" autocomplete="off" aria-label="Replacement value"></label><small>Tap the number you think is wrong, then enter its replacement.</small></div>`;
    const input=root.querySelector('[data-repair-value]');
    function paint(){root.querySelectorAll('[data-pick]').forEach(b=>{b.classList.toggle('is-selected',state.cell===b.dataset.pick);b.classList.toggle('is-wrong',wrong.has('cell')&&state.cell===b.dataset.pick);});input.value=state.correction||'';input.classList.toggle('is-wrong',wrong.has('correction'));root.classList.toggle('is-finished',finished);}
    function snapshot(){return {...state};}function restore(s){state={cell:s?.cell||null,correction:String(s?.correction??'')};wrong.clear();paint();}function emptySnapshot(){return {cell:null,correction:''};}
    function complete(){return state.cell===p.wrongCell&&equal(state.correction,p.correctValue);}
    function progress(){return `${state.cell?'Cell selected':'Select the wrong cell'} · ${parseNumber(state.correction)!==null?'replacement entered':'enter replacement'}`;}
    function check({silent=false}={}){if(complete())return {complete:true,message:'Solved! The wrong value has been repaired.'};if(!state.cell||parseNumber(state.correction)===null)return {complete:false,wrong:false,message:'Select the wrong cell and enter the value that should replace it.'};if(!silent){wrong=new Set();if(state.cell!==p.wrongCell)wrong.add('cell');if(!equal(state.correction,p.correctValue))wrong.add('correction');paint();}return {complete:false,wrong:true,message:'That repair does not make every required line total the same. Recheck the affected row, column and diagonal.'};}
    function onClick(e){const b=e.target.closest('[data-pick]');if(!b||finished)return;state.cell=b.dataset.pick;wrong.clear();paint();input.focus();ctx.onChange(snapshot());}
    function onInput(){if(finished)return;state.correction=input.value;wrong.clear();ctx.onChange(snapshot());}
    root.addEventListener('click',onClick);input.addEventListener('input',onInput);paint();
    return {snapshot,restore,emptySnapshot,progress,check,hint(){return {tone:'hint',message:'Compare line totals. A wrong corner or centre changes several lines at once, so look for the cell shared by the lines that disagree.'};},setFinished(v){finished=!!v;wrong.clear();paint();},destroy(){root.removeEventListener('click',onClick);input.removeEventListener('input',onInput);}};
  }

  let state={grid:p.displayGrid.map(row=>row.map(v=>v==null?'':String(v))),total:type==='transform'?'':''};
  root.innerHTML=`<div class="tt99-magic-target">${type==='transform'?esc(p.transform?.label||'Transform the square'):`Magic total: ${esc(fmt(p.magicSum))}`}</div>${magicGridMarkup(p,editable)}${type==='transform'?`<div class="tt99-magic-total-entry"><label><span>New magic total</span>${entryValueHtml('','total','New magic total')}</label></div>`:''}`;
  function paintValues(){root.querySelectorAll('[data-entry]').forEach(el=>{if(el.dataset.entry==='total')el.value=state.total||'';else{const [r,c]=el.dataset.entry.split(':').map(Number);el.value=state.grid[r][c]??'';}});}
  function paint(){setEntryMarks(root,wrong,hint);root.classList.toggle('is-finished',finished);}
  function snapshot(){return clone(state);}
  function restore(s){state={grid:p.displayGrid.map((row,r)=>row.map((v,c)=>editable.has(key(r,c))?String(s?.grid?.[r]?.[c]??''):String(v))),total:type==='transform'?String(s?.total??''):''};wrong.clear();hint=null;paintValues();paint();}
  function emptySnapshot(){return {grid:p.displayGrid.map((row,r)=>row.map((v,c)=>editable.has(key(r,c))?'':String(v))),total:type==='transform'?'':''};}
  function wrongKeys(){const out=[];for(const k of editable){const [r,c]=k.split(':').map(Number);if(parseNumber(state.grid[r][c])!==null&&!equal(state.grid[r][c],p.solutionGrid[r][c]))out.push(k);}if(type==='transform'&&parseNumber(state.total)!==null&&!equal(state.total,p.magicSum))out.push('total');return out;}
  function filledCount(){let n=0;for(const k of editable){const [r,c]=k.split(':').map(Number);if(parseNumber(state.grid[r][c])!==null)n++;}return n;}
  function complete(){const cells=[...editable].every(k=>{const [r,c]=k.split(':').map(Number);return equal(state.grid[r][c],p.solutionGrid[r][c]);});return cells&&(type!=='transform'||equal(state.total,p.magicSum));}
  function progress(){return `${filledCount()} / ${editable.size} blanks filled${type==='transform'?` · ${parseNumber(state.total)!==null?'total entered':'find total'}`:''}`;}
  function check({silent=false}={}){if(complete())return {complete:true,message:'Solved! Every required line has the same total.'};const bad=wrongKeys();if(!silent){wrong=new Set(bad);paint();}if(bad.length)return {complete:false,wrong:true,message:`${bad.length} entr${bad.length===1?'y is':'ies are'} incorrect.`};return {complete:false,wrong:false,message:'Everything entered so far is consistent. Keep balancing the line totals.'};}
  function hintFn(){let pick=null;for(const k of editable){const [r,c]=k.split(':').map(Number);if(parseNumber(state.grid[r][c])===null){pick=k;break;}}hint=pick||((type==='transform'&&parseNumber(state.total)===null)?'total':null);paint();return {tone:'hint',message:type==='transform'?'Use a completed row, column or diagonal to find the new magic total, then use that total to solve a line with one blank.':'Start with a row, column or diagonal that has only one blank. Subtract the known values from the magic total.'};}
  function onInput(e){const el=e.target.closest('[data-entry]');if(!el||finished)return;if(el.dataset.entry==='total')state.total=el.value;else{const [r,c]=el.dataset.entry.split(':').map(Number);state.grid[r][c]=el.value;}wrong.delete(el.dataset.entry);hint=null;paint();ctx.onChange(snapshot());}
  root.addEventListener('input',onInput);paint();
  return {snapshot,restore,emptySnapshot,progress,check,hint:hintFn,setFinished(v){finished=!!v;wrong.clear();hint=null;paint();},destroy(){root.removeEventListener('input',onInput);}};
}

/* ---------------- Arithmagons ---------------- */
const AR_SHAPES=['auto','triangle','square','pentagon','hexagon'],AR_OPS=['auto','add','multiply','mixed_within'],AR_CONN=['auto','sides','diagonals'],AR_MISSING=['more_clues','balanced','fewer_clues'];
function normaliseArith(c={}){
  return {difficulty:DIFFS.includes(c.difficulty)?c.difficulty:'standard',shape:AR_SHAPES.includes(c.shape)?c.shape:'auto',operation:AR_OPS.includes(c.operation)?c.operation:'auto',connections:AR_CONN.includes(c.connections)?c.connections:'auto',missing:AR_MISSING.includes(c.missing)?c.missing:'balanced'};
}
function arithOptions(root,c,onChange){
  c=normaliseArith(c);
  root.innerHTML=choice('difficulty','Difficulty',DIFFS,c.difficulty)+choice('shape','Shape',AR_SHAPES,c.shape,{auto:'Auto',triangle:'Triangle',square:'Square',pentagon:'Pentagon',hexagon:'Hexagon'})+choice('operation','Operations',AR_OPS,c.operation,{auto:'Auto / mixed across puzzles',add:'Addition only',multiply:'Multiplication only',mixed_within:'Mix + and ×'})+choice('connections','Connections',AR_CONN,c.connections,{auto:'Auto',sides:'Outer sides only',diagonals:'Add diagonals'})+choice('missing','Missing values',AR_MISSING,c.missing,{more_clues:'More clues',balanced:'Balanced',fewer_clues:'Fewer clues'});
  bindOptions(root,c,normaliseArith,onChange);
}
function mountArith(root,p,ctx){
  const missingCorners=new Set(p.displayCorners.map((v,i)=>v==null?i:null).filter(v=>v!==null)),missingLinks=new Set(p.displayLinks.map((v,i)=>v==null?i:null).filter(v=>v!==null));
  let state={corners:p.displayCorners.map(v=>v==null?'':String(v)),links:p.displayLinks.map(v=>v==null?'':String(v))},wrong=new Set(),hint=null,finished=false;
  const lineSvg=p.links.map((l,i)=>{const a=p.coords[l.a],b=p.coords[l.b];return `<line class="tt99-arith-line ${l.diagonal?'is-diagonal':''}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"></line>`;}).join('');
  const nodes=p.coords.map(([x,y],i)=>`<div class="tt99-arith-node ${missingCorners.has(i)?'is-entry':'is-given'}" style="left:${x}%;top:${y}%">${missingCorners.has(i)?entryValueHtml('',`c:${i}`,`Arithmagon corner ${i+1}`):`<span>${esc(fmt(p.corners[i]))}</span>`}</div>`).join('');
  const bubbles=p.links.map((l,i)=>{const a=p.coords[l.a],b=p.coords[l.b],x=(a[0]+b[0])/2,y=(a[1]+b[1])/2,op=l.operation==='multiply'?'×':'+';return `<div class="tt99-arith-link ${l.diagonal?'is-diagonal':''} ${missingLinks.has(i)?'is-entry':'is-given'}" style="left:${x}%;top:${y}%"><small>${op}</small>${missingLinks.has(i)?entryValueHtml('',`l:${i}`,`Connection ${i+1} result`):`<strong>${esc(fmt(l.value))}</strong>`}</div>`;}).join('');
  root.className='tt99-play-arithmagon';
  root.innerHTML=`<div class="tt99-arith-rule">${esc(p.operationMode==='mixed_within'?'Use the + or × shown on each connection.':p.operation==='multiply'?'Each connection is the product of its two corners.':'Each connection is the sum of its two corners.')}</div><div class="tt99-arith-stage"><svg class="tt99-arith-svg" viewBox="0 0 100 100" aria-hidden="true">${lineSvg}</svg>${nodes}${bubbles}</div>`;
  function paintValues(){root.querySelectorAll('[data-entry]').forEach(el=>{const [t,i]=el.dataset.entry.split(':');el.value=t==='c'?state.corners[+i]:state.links[+i];});}
  function paint(){setEntryMarks(root,wrong,hint);root.classList.toggle('is-finished',finished);}
  function snapshot(){return clone(state);}
  function restore(s){state={corners:p.displayCorners.map((v,i)=>missingCorners.has(i)?String(s?.corners?.[i]??''):String(v)),links:p.displayLinks.map((v,i)=>missingLinks.has(i)?String(s?.links?.[i]??''):String(v))};wrong.clear();hint=null;paintValues();paint();}
  function emptySnapshot(){return {corners:p.displayCorners.map(v=>v==null?'':String(v)),links:p.displayLinks.map(v=>v==null?'':String(v))};}
  function wrongKeys(){const out=[];for(const i of missingCorners)if(parseNumber(state.corners[i])!==null&&!equal(state.corners[i],p.corners[i]))out.push(`c:${i}`);for(const i of missingLinks)if(parseNumber(state.links[i])!==null&&!equal(state.links[i],p.links[i].value))out.push(`l:${i}`);return out;}
  function totalMissing(){return missingCorners.size+missingLinks.size;}
  function filled(){let x=0;for(const i of missingCorners)if(parseNumber(state.corners[i])!==null)x++;for(const i of missingLinks)if(parseNumber(state.links[i])!==null)x++;return x;}
  function complete(){return [...missingCorners].every(i=>equal(state.corners[i],p.corners[i]))&&[...missingLinks].every(i=>equal(state.links[i],p.links[i].value));}
  function progress(){return `${filled()} / ${totalMissing()} blanks filled`;}
  function check({silent=false}={}){if(complete())return {complete:true,message:'Solved! Every connection matches its two corner values.'};const bad=wrongKeys();if(!silent){wrong=new Set(bad);paint();}if(bad.length)return {complete:false,wrong:true,message:`${bad.length} value${bad.length===1?' is':'s are'} incorrect.`};return {complete:false,wrong:false,message:'Everything entered so far is correct. Keep following the connection rules.'};}
  function hintFn(){let k=null,msg='';for(const i of missingLinks){if(parseNumber(state.links[i])===null){k=`l:${i}`;msg='This connection is missing its result. Use the two corner values and the + or × shown beside it.';break;}}if(!k)for(const i of missingCorners){if(parseNumber(state.corners[i])===null){k=`c:${i}`;const supporting=p.links.find(l=>(l.a===i||l.b===i)&&parseNumber(state.links[p.links.indexOf(l)])!==null);msg=supporting?'Use a known connection result and the other corner. Work backwards with subtraction for +, or division for ×.':'Find a connection touching this corner where the other value is known, then work backwards from the result.';break;}}hint=k;paint();return {tone:'hint',message:msg||'Look for a connection with only one missing value.'};}
  function onInput(e){const el=e.target.closest('[data-entry]');if(!el||finished)return;const [t,i]=el.dataset.entry.split(':');if(t==='c')state.corners[+i]=el.value;else state.links[+i]=el.value;wrong.delete(el.dataset.entry);hint=null;paint();ctx.onChange(snapshot());}
  root.addEventListener('input',onInput);paint();
  return {snapshot,restore,emptySnapshot,progress,check,hint:hintFn,setFinished(v){finished=!!v;wrong.clear();hint=null;paint();},destroy(){root.removeEventListener('input',onInput);}};
}

/* ---------------- Magic Number Shapes ---------------- */
const MS_SHAPES=['auto','triangle','circle','bowtie','star'],MS_TYPES=['auto','missing','check','repair'],MS_CLUES=['more','balanced','fewer'];
function normaliseMagicShape(c={}){
  return {difficulty:DIFFS.includes(c.difficulty)?c.difficulty:'standard',shape:MS_SHAPES.includes(c.shape)?c.shape:'auto',puzzleType:MS_TYPES.includes(c.puzzleType)?c.puzzleType:'auto',clueLevel:MS_CLUES.includes(c.clueLevel)?c.clueLevel:'balanced'};
}
function magicShapeOptions(root,c,onChange){
  c=normaliseMagicShape(c);
  root.innerHTML=choice('difficulty','Difficulty',DIFFS,c.difficulty)+choice('shape','Shape',MS_SHAPES,c.shape,{auto:'Auto',triangle:'Magic triangle',circle:'Magic web',bowtie:'Magic bow-tie',star:'Magic star'})+choice('puzzleType','Puzzle style',MS_TYPES,c.puzzleType,{auto:'Auto',missing:'Fill missing values',check:'Check: is it magic?',repair:'Repair one value'})+choice('clueLevel','Clues shown',MS_CLUES,c.clueLevel,{more:'More clues',balanced:'Balanced',fewer:'Fewer clues'});
  bindOptions(root,c,normaliseMagicShape,onChange);
}
function magicShapeStage(p,editableSet=new Set(),clickable=false){
  const pct=v=>8+84*Number(v);
  const polylines=p.lines.map(line=>`<polyline class="tt99-mshape-line" points="${line.map(i=>`${pct(p.coords[i][0])},${pct(p.coords[i][1])}`).join(' ')}"></polyline>`).join('');
  const nodes=p.coords.map(([x,y],i)=>{const px=pct(x),py=pct(y),editable=editableSet.has(i),v=p.displayValues[i];if(editable)return `<div class="tt99-mshape-node is-entry" style="left:${px}%;top:${py}%">${entryValueHtml('',`n:${i}`,`Magic shape node ${i+1}`)}</div>`;return clickable?`<button type="button" class="tt99-mshape-node is-pick" data-pick="${i}" style="left:${px}%;top:${py}%">${esc(fmt(v))}</button>`:`<div class="tt99-mshape-node is-given" style="left:${px}%;top:${py}%">${esc(fmt(v))}</div>`;}).join('');
  return `<div class="tt99-mshape-stage"><svg class="tt99-mshape-svg" viewBox="0 0 100 100" aria-hidden="true">${polylines}</svg>${nodes}</div>`;
}
function mountMagicShape(root,p,ctx){
  const type=p.puzzleType;let finished=false,wrong=new Set(),hint=null;
  root.className='tt99-play-magicshape';
  if(type==='check'){
    let state={answer:null};
    root.innerHTML=`<div class="tt99-mshape-target">Do all marked lines have the same total?</div>${magicShapeStage(p)}<div class="tt99-binary-choice"><button type="button" data-shape-answer="yes">Yes, it is magic</button><button type="button" data-shape-answer="no">No, it is not</button></div>`;
    const buttons=[...root.querySelectorAll('[data-shape-answer]')];
    function paint(){buttons.forEach(b=>{const val=b.dataset.shapeAnswer==='yes';b.classList.toggle('is-selected',state.answer===val);b.classList.toggle('is-wrong',wrong.has('answer')&&state.answer===val);});root.classList.toggle('is-finished',finished);}
    function snapshot(){return {...state};}function restore(s){state={answer:typeof s?.answer==='boolean'?s.answer:null};wrong.clear();paint();}function emptySnapshot(){return {answer:null};}
    function progress(){return state.answer===null?'Choose Yes or No':'Answer chosen · press Check';}
    function check({silent=false}={}){if(state.answer===p.isMagic)return {complete:true,message:'Correct! Your line-sum check is right.'};if(state.answer===null)return {complete:false,wrong:false,message:'Choose whether the shape is magic, then check your answer.'};if(!silent){wrong=new Set(['answer']);paint();}return {complete:false,wrong:true,message:'That choice is not correct. Compare the marked line totals again.'};}
    function onClick(e){const b=e.target.closest('[data-shape-answer]');if(!b||finished)return;state.answer=b.dataset.shapeAnswer==='yes';wrong.clear();paint();ctx.onChange(snapshot());}
    root.addEventListener('click',onClick);paint();
    return {snapshot,restore,emptySnapshot,progress,check,hint(){return {tone:'hint',message:'Add the numbers on one complete marked line, then compare a second line. If two totals differ, the shape is not magic.'};},setFinished(v){finished=!!v;wrong.clear();paint();},destroy(){root.removeEventListener('click',onClick);}};
  }
  if(type==='repair'){
    let state={node:null,correction:''};
    root.innerHTML=`<div class="tt99-mshape-target">One value is wrong — find and repair it</div>${magicShapeStage(p,new Set(),true)}<div class="tt99-repair-control"><label><span>Replacement value</span><input class="tt99-structure-entry" data-repair-value inputmode="decimal" autocomplete="off" aria-label="Replacement value"></label><small>Tap the node you think is wrong, then enter its replacement.</small></div>`;
    const input=root.querySelector('[data-repair-value]');
    function paint(){root.querySelectorAll('[data-pick]').forEach(b=>{b.classList.toggle('is-selected',String(state.node)===b.dataset.pick);b.classList.toggle('is-wrong',wrong.has('node')&&String(state.node)===b.dataset.pick);});input.value=state.correction||'';input.classList.toggle('is-wrong',wrong.has('correction'));root.classList.toggle('is-finished',finished);}
    function snapshot(){return {...state};}function restore(s){state={node:Number.isInteger(s?.node)?s.node:null,correction:String(s?.correction??'')};wrong.clear();paint();}function emptySnapshot(){return {node:null,correction:''};}
    function complete(){return state.node===p.brokenIndex&&equal(state.correction,p.correctValue);}
    function progress(){return `${state.node!==null?'Node selected':'Select the wrong node'} · ${parseNumber(state.correction)!==null?'replacement entered':'enter replacement'}`;}
    function check({silent=false}={}){if(complete())return {complete:true,message:'Solved! Every marked line now has the same total.'};if(state.node===null||parseNumber(state.correction)===null)return {complete:false,wrong:false,message:'Select the wrong node and enter its replacement value.'};if(!silent){wrong=new Set();if(state.node!==p.brokenIndex)wrong.add('node');if(!equal(state.correction,p.correctValue))wrong.add('correction');paint();}return {complete:false,wrong:true,message:'That repair does not balance all of the marked lines. Check the totals again.'};}
    function onClick(e){const b=e.target.closest('[data-pick]');if(!b||finished)return;state.node=Number(b.dataset.pick);wrong.clear();paint();input.focus();ctx.onChange(snapshot());}
    function onInput(){if(finished)return;state.correction=input.value;wrong.clear();ctx.onChange(snapshot());}
    root.addEventListener('click',onClick);input.addEventListener('input',onInput);paint();
    return {snapshot,restore,emptySnapshot,progress,check,hint(){return {tone:'hint',message:'Compare two lines that share a node. The wrong value will usually sit on more than one line whose totals do not match the others.'};},setFinished(v){finished=!!v;wrong.clear();paint();},destroy(){root.removeEventListener('click',onClick);input.removeEventListener('input',onInput);}};
  }

  const editable=new Set(p.hiddenIndices||[]);let state=p.displayValues.map(v=>v==null?'':String(v));
  root.innerHTML=`<div class="tt99-mshape-target">Every marked line totals <strong>${esc(fmt(p.target))}</strong></div>${magicShapeStage(p,editable)}`;
  function paintValues(){root.querySelectorAll('[data-entry]').forEach(el=>{const i=Number(el.dataset.entry.split(':')[1]);el.value=state[i]??'';});}
  function paint(){setEntryMarks(root,wrong,hint);root.classList.toggle('is-finished',finished);}
  function snapshot(){return state.slice();}
  function restore(s){state=p.displayValues.map((v,i)=>editable.has(i)?String(s?.[i]??''):String(v));wrong.clear();hint=null;paintValues();paint();}
  function emptySnapshot(){return p.displayValues.map(v=>v==null?'':String(v));}
  function wrongKeys(){const out=[];for(const i of editable)if(parseNumber(state[i])!==null&&!equal(state[i],p.solutionValues[i]))out.push(`n:${i}`);return out;}
  function filled(){let n=0;for(const i of editable)if(parseNumber(state[i])!==null)n++;return n;}
  function complete(){return [...editable].every(i=>equal(state[i],p.solutionValues[i]));}
  function progress(){return `${filled()} / ${editable.size} blanks filled`;}
  function check({silent=false}={}){if(complete())return {complete:true,message:'Solved! Every marked line reaches the magic total.'};const bad=wrongKeys();if(!silent){wrong=new Set(bad);paint();}if(bad.length)return {complete:false,wrong:true,message:`${bad.length} value${bad.length===1?' is':'s are'} incorrect.`};return {complete:false,wrong:false,message:'Everything entered so far is correct. Keep balancing the marked lines.'};}
  function hintFn(){const i=[...editable].find(i=>parseNumber(state[i])===null);hint=i===undefined?null:`n:${i}`;paint();return {tone:'hint',message:'Look for a marked line with only one blank. Add the known values on that line and subtract their total from the magic total.'};}
  function onInput(e){const el=e.target.closest('[data-entry]');if(!el||finished)return;const i=Number(el.dataset.entry.split(':')[1]);state[i]=el.value;wrong.delete(el.dataset.entry);hint=null;paint();ctx.onChange(snapshot());}
  root.addEventListener('input',onInput);paint();
  return {snapshot,restore,emptySnapshot,progress,check,hint:hintFn,setFinished(v){finished=!!v;wrong.clear();hint=null;paint();},destroy(){root.removeEventListener('input',onInput);}};
}

/* ---------------- Adapter registration ---------------- */
Play.registerAdapter('pyramid',{
  id:'pyramid',order:21,icon:'△',title:'Number Pyramid',shortTitle:'Number Pyramid',category:'Number patterns',blurb:'Build the pyramid using addition and inverse reasoning.',completionTitle:'Number Pyramid solved',completeMessage:'Solved! Every brick follows the addition rule.',
  startMessage:'Fill the missing bricks.',instruction:'Each brick is the sum of the two bricks directly below it.',howTitle:'Build upwards — or work backwards',howText:'Add two touching bricks to find the brick above. If a lower brick is missing, subtract the known lower brick from the brick above.',
  normalizeConfig:normalisePyramid,fromQuery:q=>({difficulty:q.get('d'),levels:q.get('lv'),clueLevel:q.get('cl')}),toQuery:c=>{c=normalisePyramid(c);return {d:c.difficulty,lv:c.levels,cl:c.clueLevel};},renderOptions:pyramidOptions,
  createPuzzle:(c,s)=>generated('pyramid',normalisePyramid(c),s,['number_place_value','calculation'],1),mount:mountPyramid,meta:(p,c)=>`${cap(c.difficulty)} · ${p.rows.length} levels · ${p.missing?.length||p.missingSet?.length||0} blanks`,recordKey:c=>{c=normalisePyramid(c);return `${c.difficulty}:${c.levels}:${c.clueLevel}`;}
});

Play.registerAdapter('magic',{
  id:'magic',order:22,icon:'□',title:'Magic Squares',shortTitle:'Magic Squares',category:'Number patterns',blurb:'Balance rows, columns and diagonals to one total.',completionTitle:'Magic Square solved',completeMessage:'Solved! The magic-square relationships are correct.',
  startMessage:'Use the line totals to solve the square.',instruction:'Make every row, column and main diagonal total the same amount.',howTitle:'Use the magic total',howText:'Find or use the common total. Solve lines with one unknown first, then use crossing rows, columns and diagonals to check your work.',
  normalizeConfig:normaliseMagic,fromQuery:q=>({difficulty:q.get('d'),gridSize:q.get('n'),puzzleType:q.get('pt'),numberPattern:q.get('np'),clueLevel:q.get('cl')}),toQuery:c=>{c=normaliseMagic(c);return {d:c.difficulty,n:c.gridSize,pt:c.puzzleType,np:c.numberPattern,cl:c.clueLevel};},renderOptions:magicOptions,
  createPuzzle:(c,s)=>generated('magic',normaliseMagic(c),s,['number_place_value','calculation','algebra'],1),mount:mountMagic,meta:(p,c)=>`${cap(c.difficulty)} · ${p.size} × ${p.size} · ${p.puzzleType} · ${p.numberPatternLabel||p.numberPattern}`,recordKey:c=>{c=normaliseMagic(c);return `${c.difficulty}:${c.gridSize}:${c.puzzleType}:${c.numberPattern}:${c.clueLevel}`;}
});

Play.registerAdapter('arithmagon',{
  id:'arithmagon',order:23,icon:'◇',title:'Arithmagons',shortTitle:'Arithmagons',category:'Arithmetic',blurb:'Use connected corner values to find sums or products.',completionTitle:'Arithmagon solved',completeMessage:'Solved! Every connection is correct.',
  startMessage:'Fill the missing corner and connection values.',instruction:'Each connection value is made from the two corner numbers it joins.',howTitle:'Follow each connection',howText:'For a missing result, combine the two corners using the shown operation. For a missing corner, work backwards from a known result and the other corner.',
  normalizeConfig:normaliseArith,fromQuery:q=>({difficulty:q.get('d'),shape:q.get('sh'),operation:q.get('op'),connections:q.get('cn'),missing:q.get('ms')}),toQuery:c=>{c=normaliseArith(c);return {d:c.difficulty,sh:c.shape,op:c.operation,cn:c.connections,ms:c.missing};},renderOptions:arithOptions,
  createPuzzle:(c,s)=>generated('arithmagon',normaliseArith(c),s,['calculation'],2),mount:mountArith,meta:(p,c)=>`${cap(c.difficulty)} · ${cap(p.shape)} · ${p.operationMode==='mixed_within'?'mixed + / ×':p.operation==='multiply'?'multiplication':'addition'}${p.connections==='diagonals'?' · diagonals':''}`,recordKey:c=>{c=normaliseArith(c);return `${c.difficulty}:${c.shape}:${c.operation}:${c.connections}:${c.missing}`;}
});

Play.registerAdapter('magicshape',{
  id:'magicshape',order:24,icon:'✦',title:'Magic Number Shapes',shortTitle:'Magic Shapes',category:'Visual arithmetic',blurb:'Balance overlapping lines around triangles, webs, bow-ties and stars.',completionTitle:'Magic Shape solved',completeMessage:'Solved! Every marked line balances.',
  startMessage:'Use the shared line total to solve the shape.',instruction:'Every marked line must have the same total.',howTitle:'Balance overlapping lines',howText:'Start with a complete line or a line with one blank. Because lines overlap, one solved node often unlocks another line.',
  normalizeConfig:normaliseMagicShape,fromQuery:q=>({difficulty:q.get('d'),shape:q.get('sh'),puzzleType:q.get('pt'),clueLevel:q.get('cl')}),toQuery:c=>{c=normaliseMagicShape(c);return {d:c.difficulty,sh:c.shape,pt:c.puzzleType,cl:c.clueLevel};},renderOptions:magicShapeOptions,
  createPuzzle:(c,s)=>generated('magicshape',normaliseMagicShape(c),s,['calculation'],2),mount:mountMagicShape,meta:(p,c)=>`${cap(c.difficulty)} · ${cap(p.shape)} · ${p.puzzleType}`,recordKey:c=>{c=normaliseMagicShape(c);return `${c.difficulty}:${c.shape}:${c.puzzleType}:${c.clueLevel}`;}
});

})(typeof globalThis!=='undefined'?globalThis:this);
