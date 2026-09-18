/* 99 Club Studio · shared online number-grid input v1.0.2 */
(function(global){
'use strict';
const NS='TT99GamesPlayNumberGrid';if(global[NS])return;
const clone=g=>g.map(r=>r.slice());
const key=(r,c)=>`${r}:${c}`;
function mount(root,opt={},ctx={}){
  const n=Number(opt.size)||4,symbols=(opt.symbols||Array.from({length:n},(_,i)=>i+1)).slice(),blankValue=Object.prototype.hasOwnProperty.call(opt,'blankValue')?opt.blankValue:0;
  const initial=Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>{const v=opt.initialGrid?.[r]?.[c];return v===blankValue||v==null?null:v;}));
  const given=Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>!!opt.givenMask?.[r]?.[c]));
  let state=clone(initial),selected=null,wrong=new Set(),hintKey=null,finished=false;
  const cageAt=new Map(),cageFirst=new Map();
  (opt.cages||[]).forEach((cg,i)=>{let first=null;(cg.cells||[]).forEach(([r,c])=>{cageAt.set(key(r,c),i);if(!first||r<first[0]||(r===first[0]&&c<first[1]))first=[r,c];});if(first)cageFirst.set(i,first);});
  function cageEdge(r,c,dr,dc){const here=cageAt.get(key(r,c));if(here==null)return false;const rr=r+dr,cc=c+dc;return rr<0||cc<0||rr>=n||cc>=n||cageAt.get(key(rr,cc))!==here;}
  function boxClasses(r,c){const out=[];if(!opt.boxRows||!opt.boxCols)return out;const br=Number(opt.boxRows),bc=Number(opt.boxCols);if(r%br===0)out.push('box-top');if(c%bc===0)out.push('box-left');if((r+1)%br===0)out.push('box-bottom');if((c+1)%bc===0)out.push('box-right');return out;}
  function cageHtml(r,c){const ci=cageAt.get(key(r,c));if(ci==null)return '';const bits=[];if(cageEdge(r,c,-1,0))bits.push('<i class="cage-edge top"></i>');if(cageEdge(r,c,1,0))bits.push('<i class="cage-edge bottom"></i>');if(cageEdge(r,c,0,-1))bits.push('<i class="cage-edge left"></i>');if(cageEdge(r,c,0,1))bits.push('<i class="cage-edge right"></i>');const f=cageFirst.get(ci),isFirst=f&&f[0]===r&&f[1]===c,target=opt.cages?.[ci]?.target;return bits.join('')+(isFirst?`<small class="cage-target">${target}</small>`:'');}
  const hSigns=(opt.hSigns||[]).flatMap((row,r)=>row.map((s,c)=>s?`<span class="tt99-grid-sign horizontal" style="left:${(c+1)*100/n}%;top:${(r+.5)*100/n}%">${s}</span>`:'' )).join('');
  const vSigns=(opt.vSigns||[]).flatMap((row,r)=>row.map((s,c)=>s?`<span class="tt99-grid-sign vertical" style="left:${(c+.5)*100/n}%;top:${(r+1)*100/n}%">${s==='^'?'∧':s==='v'?'∨':s}</span>`:'' )).join('');
  root.className=`tt99-numbergrid-host ${opt.className||''}`.trim();
  root.innerHTML=`<div class="tt99-numbergrid-wrap"><div class="tt99-numbergrid" style="--n:${n}">${Array.from({length:n*n},(_,i)=>{const r=Math.floor(i/n),c=i%n,g=given[r][c],classes=['tt99-numbergrid-cell',g?'is-given':'is-editable',...boxClasses(r,c)].join(' ');return `<button type="button" class="${classes}" data-r="${r}" data-c="${c}" ${g?'aria-readonly="true"':''}><span class="cell-value"></span>${cageHtml(r,c)}</button>`;}).join('')}${hSigns}${vSigns}</div>${opt.tapCycle?'':`<div class="tt99-number-keypad" style="--key-cols:${n<=4?n:3}" aria-label="Number keypad">${symbols.map(v=>`<button type="button" data-key-value="${v}">${v}</button>`).join('')}<button type="button" class="clear" data-key-clear>Clear</button></div>`}</div>`;
  const grid=root.querySelector('.tt99-numbergrid'),cells=[...root.querySelectorAll('.tt99-numbergrid-cell')],keypad=root.querySelector('.tt99-number-keypad');
  function valueText(v){return v==null?'':String(opt.formatValue?opt.formatValue(v):v);}
  function render(){
    cells.forEach(cell=>{const r=+cell.dataset.r,c=+cell.dataset.c,v=state[r][c],k=key(r,c),sel=selected&&selected.r===r&&selected.c===c;cell.querySelector('.cell-value').textContent=valueText(v);cell.classList.toggle('is-selected',!!sel);cell.classList.toggle('is-wrong',wrong.has(k));cell.classList.toggle('is-hint',hintKey===k);cell.classList.toggle('is-related',!!selected&&(selected.r===r||selected.c===c)&&!sel);cell.classList.toggle('is-same',!!selected&&state[selected.r]?.[selected.c]!=null&&state[selected.r][selected.c]===v&&!sel);cell.disabled=finished&&!given[r][c];cell.setAttribute('aria-label',`Row ${r+1}, column ${c+1}${v!=null?`, ${v}`:', blank'}${given[r][c]?', given':''}`);});
    if(keypad){keypad.querySelectorAll('[data-key-value]').forEach(b=>{b.disabled=finished||!selected||given[selected.r][selected.c];});const clr=keypad.querySelector('[data-key-clear]');if(clr)clr.disabled=finished||!selected||given[selected.r][selected.c];}
  }
  function select(r,c){selected={r,c};hintKey=null;render();}
  function apply(r,c,v){if(finished||ctx.isPaused?.()||given[r][c])return;state[r][c]=v;wrong.clear();hintKey=null;selected={r,c};render();ctx.onChange?.(snapshot());}
  function cycle(r,c){const cur=state[r][c],seq=opt.tapCycle||symbols;let idx=cur==null?-1:seq.findIndex(v=>v===cur);idx++;apply(r,c,idx>=seq.length?null:seq[idx]);}
  function clickGrid(e){const b=e.target.closest('.tt99-numbergrid-cell');if(!b)return;const r=+b.dataset.r,c=+b.dataset.c;select(r,c);if(opt.tapCycle&&!given[r][c])cycle(r,c);}
  function clickKey(e){if(!selected)return;const v=e.target.closest('[data-key-value]');if(v)return apply(selected.r,selected.c,Number(v.dataset.keyValue));if(e.target.closest('[data-key-clear]'))apply(selected.r,selected.c,null);}
  function move(dr,dc){if(!selected){const first=cells.find(b=>!given[+b.dataset.r][+b.dataset.c])||cells[0];if(first)select(+first.dataset.r,+first.dataset.c);return;}select(Math.max(0,Math.min(n-1,selected.r+dr)),Math.max(0,Math.min(n-1,selected.c+dc)));cells[selected.r*n+selected.c]?.focus();}
  function keydown(e){const moves={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};if(moves[e.key]){e.preventDefault();move(...moves[e.key]);return;}if(!selected||finished||ctx.isPaused?.())return;if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();apply(selected.r,selected.c,null);return;}if(opt.tapCycle&&(e.key==='Enter'||e.key===' ')){e.preventDefault();cycle(selected.r,selected.c);return;}if(symbols.some(v=>String(v)===e.key)){e.preventDefault();apply(selected.r,selected.c,Number(e.key));}}
  grid.addEventListener('click',clickGrid);grid.addEventListener('keydown',keydown);keypad?.addEventListener('click',clickKey);
  function snapshot(){return clone(state);}
  function restore(s){state=Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>given[r][c]?initial[r][c]:(s?.[r]?.[c]??null)));wrong.clear();hintKey=null;render();}
  function emptySnapshot(){return clone(initial);}
  function getState(){return clone(state);}
  function getValue(r,c){return state[r]?.[c]??null;}
  function isGiven(r,c){return !!given[r]?.[c];}
  function filledEditableCount(){let x=0;for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!given[r][c]&&state[r][c]!=null)x++;return x;}
  function editableCount(){let x=0;for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!given[r][c])x++;return x;}
  function setWrong(keys){wrong=new Set(keys||[]);render();}
  function setHint(k){hintKey=k||null;if(k){const [r,c]=String(k).split(':').map(Number);selected={r,c};}render();}
  function clearMarks(){wrong.clear();hintKey=null;render();}
  function setFinished(v){finished=!!v;wrong.clear();hintKey=null;render();}
  function destroy(){grid.removeEventListener('click',clickGrid);grid.removeEventListener('keydown',keydown);keypad?.removeEventListener('click',clickKey);}
  render();return {snapshot,restore,emptySnapshot,getState,getValue,isGiven,filledEditableCount,editableCount,setWrong,setHint,clearMarks,setFinished,destroy,select};
}
global[NS]={mount};
})(typeof globalThis!=='undefined'?globalThis:this);
