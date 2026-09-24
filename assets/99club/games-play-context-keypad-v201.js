/* 99 Club Studio · unified contextual keypad drawer v2.04
 * One input model across phone, tablet, hybrid and desktop:
 * - touch/pen selection opens the drawer automatically;
 * - desktop keeps the drawer closed by default so the physical keyboard can be used;
 * - the compact Keypad/Keyboard button always provides mouse-only access.
 */
(function(){
'use strict';
if(window.__tt99ContextKeypadV202)return;
window.__tt99ContextKeypadV202=true;

const PAD_SELECTOR=[
  '.tt99-wave184-keypad',
  '.tt99-wave186-keypad',
  '.tt99-v196-keypad',
  '.tt99-number-keypad',
  '.tt99-alpha-pad',
  '.tt99-towers-keypad',
  '.tt99-crossnumber-keypad',
  '.tt99-letter-keypad',
  '.tt99-extra-op-pad'
].join(',');

const ENTRY_SELECTOR=[
  '[data-conn-entry]',
  '[data-trail-i]',
  '[data-cg-key]',
  '[data-machine]',
  '[data-sym]',
  '[data-mobile-answer]',
  '[data-bl-answer]',
  '.tt99-numbergrid-cell.is-editable',
  '.tt99-kakuro-play.is-editable',
  '[data-letter]',
  '[data-alpha-key]',
  '.tt99-towers-cell',
  '.tt99-crossnumber-cell',
  '[data-cw]',
  '[data-cw-clue]',
  '[data-slot]',
  '[data-entry]'
].join(',');

let activePad=null;
let activeEntry=null;
let lastPointerType='';
let observer=null;
let manageQueued=false;
let padId=0;
let dragPos=null;
let dragState=null;
let suppressHandleClick=false;

function board(){return document.getElementById('tt99-play-board');}
function mq(q){try{return window.matchMedia(q).matches;}catch(_){return false;}}
function inputProfile(){
  const primaryCoarse=mq('(pointer: coarse)');
  const primaryHover=mq('(hover: hover)');
  const anyFine=mq('(any-pointer: fine)');
  const touch=(navigator.maxTouchPoints||0)>0;
  if(primaryCoarse&&!primaryHover)return anyFine?'hybrid':'touch';
  if(touch&&anyFine)return 'hybrid';
  return 'desktop';
}
function autoOpenForCurrentInput(){
  if(lastPointerType==='mouse')return false;
  if(lastPointerType==='touch'||lastPointerType==='pen')return true;
  if(inputProfile()==='touch')return true;
  return window.innerWidth<=700;
}
function keepClearOfPad(){
  return inputProfile()!=='desktop'||window.innerWidth<=760;
}
function padLabel(pad){
  if(!pad)return 'Keypad';
  if(pad.matches('.tt99-letter-keypad'))return 'Keyboard';
  if(pad.matches('.tt99-extra-op-pad'))return 'Operators';
  return 'Keypad';
}
function currentPad(){
  const b=board();
  return b?.querySelector(PAD_SELECTOR)||null;
}
function ensureLauncher(b){
  let btn=b.querySelector(':scope > .tt99-context-pad-launcher');
  if(btn)return btn;
  btn=document.createElement('button');
  btn.type='button';
  btn.className='tt99-context-pad-launcher';
  btn.hidden=true;
  btn.setAttribute('aria-expanded','false');
  b.appendChild(btn);
  return btn;
}
function ensureHandle(pad){
  let h=pad.querySelector(':scope > .tt99-context-pad-handle');
  if(h)return h;
  h=document.createElement('div');
  h.className='tt99-context-pad-handle';
  h.setAttribute('role','toolbar');
  const label=padLabel(pad);
  h.setAttribute('aria-label',`${label} controls`);
  h.innerHTML=`<span class="tt99-context-handle-bar" aria-hidden="true"></span><span class="tt99-context-handle-text">${label}</span><button type="button" class="tt99-context-pad-reset" aria-label="Reset keypad position">↺</button><button type="button" class="tt99-context-pad-toggle" aria-label="Collapse ${label.toLowerCase()}">⌄</button>`;
  pad.insertBefore(h,pad.firstChild);
  return h;
}
function clearBoardSpace(){
  const b=board();
  if(!b)return;
  b.classList.remove('tt99-has-context-pad','tt99-context-pad-reserve');
  b.style.removeProperty('--tt99-context-pad-space');
}
function setPadSpace(){
  const b=board();
  if(!b)return;
  if(!activePad||activePad.classList.contains('tt99-context-pad-collapsed')||!keepClearOfPad()){
    b.classList.remove('tt99-context-pad-reserve');
    b.style.removeProperty('--tt99-context-pad-space');
    return;
  }
  const apply=()=>{
    if(!activePad||!document.contains(activePad)||activePad.classList.contains('tt99-context-pad-collapsed'))return;
    const h=Math.ceil(activePad.getBoundingClientRect().height);
    const space=Math.max(0,h+24);
    b.classList.add('tt99-context-pad-reserve');
    b.style.setProperty('--tt99-context-pad-space',space+'px');
  };
  // Apply immediately so there is never a visible expanded-without-reserve frame,
  // then refresh once after layout in case the drawer height changed.
  apply();
  requestAnimationFrame(apply);
}
function keepBoardClearOfPad(){
  const b=board();
  if(!b||!activePad||!keepClearOfPad()||activePad.classList.contains('tt99-context-pad-collapsed'))return;
  requestAnimationFrame(()=>{
    if(!activePad||!document.contains(activePad)||!document.contains(b))return;
    const pr=activePad.getBoundingClientRect(),br=b.getBoundingClientRect();
    const safeTop=72,gap=14,available=Math.max(0,pr.top-safeTop-gap);
    if(br.height<=available&&br.bottom>pr.top-gap){
      window.scrollBy({top:br.bottom-(pr.top-gap),behavior:'smooth'});
    }
  });
}
function setCollapsed(collapsed){
  if(!activePad)return;
  activePad.classList.toggle('tt99-context-pad-collapsed',!!collapsed);
  const h=ensureHandle(activePad);
  const toggle=h.querySelector('.tt99-context-pad-toggle');
  if(toggle){
    toggle.setAttribute('aria-expanded',collapsed?'false':'true');
    toggle.setAttribute('aria-label',collapsed?'Open keypad':'Collapse keypad');
    toggle.textContent=collapsed?'⌃':'⌄';
  }
  setPadSpace();
  if(!collapsed){keepBoardClearOfPad();keepEntryVisible(activeEntry);}
}
function keepEntryVisible(entry){
  if(!entry||!activePad||!keepClearOfPad())return;
  requestAnimationFrame(()=>{
    if(!activePad||!document.contains(activePad)||!document.contains(entry))return;
    const h=activePad.getBoundingClientRect().height;
    const r=entry.getBoundingClientRect();
    const top=84;
    const bottom=window.innerHeight-h-18;
    if(r.bottom>bottom)window.scrollBy({top:r.bottom-bottom+12,behavior:'smooth'});
    else if(r.top<top)window.scrollBy({top:r.top-top-10,behavior:'smooth'});
  });
}
function syncLauncher(){
  const b=board();
  if(!b)return;
  const pad=currentPad();
  const btn=ensureLauncher(b);
  if(!pad){
    btn.hidden=true;
    btn.removeAttribute('aria-controls');
    btn.setAttribute('aria-expanded','false');
    return;
  }
  btn.hidden=false;
  btn.textContent=`⌨ ${padLabel(pad)}`;
  btn.setAttribute('aria-controls',pad.id);
  btn.setAttribute('aria-expanded',String(activePad===pad));
  btn.setAttribute('aria-label',`${activePad===pad?'Close':'Open'} on-screen ${padLabel(pad).toLowerCase()}`);
}
function hidePad(){
  if(activePad){
    activePad.classList.remove('tt99-context-pad-active','tt99-context-pad-collapsed','tt99-context-pad-dragging');
    activePad.setAttribute('aria-hidden','true');
  }
  activePad=null;
  activeEntry=null;
  dragState=null;
  clearBoardSpace();
  syncLauncher();
}
function applyDragPosition(pad){
  if(!pad)return;
  const movable=window.innerWidth>760&&inputProfile()!=='touch';
  pad.classList.toggle('tt99-context-pad-moved',!!dragPos&&movable);
  if(dragPos&&movable){
    pad.style.setProperty('--tt99-pad-x',Math.round(dragPos.x)+'px');
    pad.style.setProperty('--tt99-pad-y',Math.round(dragPos.y)+'px');
  }else{
    pad.style.removeProperty('--tt99-pad-x');
    pad.style.removeProperty('--tt99-pad-y');
  }
}
function resetDragPosition(){
  dragPos=null;
  if(activePad)applyDragPosition(activePad);
}
function clampDragPosition(x,y,pad){
  const r=pad.getBoundingClientRect(),margin=8;
  return {
    x:Math.max(margin,Math.min(window.innerWidth-r.width-margin,x)),
    y:Math.max(margin,Math.min(window.innerHeight-r.height-margin,y))
  };
}
function openPad(pad,entry){
  const b=board();
  if(!b||!pad||!b.contains(pad))return;
  if(activePad&&activePad!==pad){
    activePad.classList.remove('tt99-context-pad-active');
    activePad.setAttribute('aria-hidden','true');
  }
  activePad=pad;
  activeEntry=entry||activeEntry;
  ensureHandle(pad);
  pad.classList.add('tt99-context-pad-active');
  pad.classList.remove('tt99-context-pad-collapsed');
  pad.setAttribute('aria-hidden','false');
  applyDragPosition(pad);
  b.classList.add('tt99-has-context-pad');
  syncLauncher();
  setPadSpace();
  keepBoardClearOfPad();
  keepEntryVisible(activeEntry);
}
function manageCurrentPad(){
  manageQueued=false;
  const b=board();
  if(!b)return;
  b.dataset.tt99InputProfile=inputProfile();

  if(activePad&&!document.contains(activePad)){
    activePad=null;
    activeEntry=null;
    clearBoardSpace();
  }

  const pad=currentPad();
  if(pad){
    if(!pad.dataset.tt99ContextManaged){
      pad.dataset.tt99ContextManaged='1';
      pad.classList.add('tt99-context-pad-managed');
      if(!pad.id)pad.id=`tt99-context-pad-${++padId}`;
      pad.setAttribute('aria-hidden',activePad===pad?'false':'true');
      ensureHandle(pad);
    }
  }else if(activePad){
    hidePad();
  }
  syncLauncher();
}
function scheduleManage(){
  if(manageQueued)return;
  manageQueued=true;
  requestAnimationFrame(manageCurrentPad);
}
function installObserver(){
  const b=board();
  if(!b)return;
  observer?.disconnect();
  observer=new MutationObserver(scheduleManage);
  observer.observe(b,{childList:true,subtree:true});
  manageCurrentPad();
}

document.addEventListener('pointerdown',e=>{lastPointerType=e.pointerType||'';},{capture:true,passive:true});

document.addEventListener('click',e=>{
  const b=board();
  if(!b)return;
  manageCurrentPad();

  const launcher=e.target.closest('.tt99-context-pad-launcher');
  if(launcher&&b.contains(launcher)){
    e.preventDefault();
    const pad=currentPad();
    if(!pad)return;
    if(activePad===pad)hidePad();else openPad(pad,activeEntry);
    return;
  }

  const reset=e.target.closest('.tt99-context-pad-reset');
  if(reset&&activePad&&activePad.contains(reset)){
    e.preventDefault();e.stopPropagation();resetDragPosition();return;
  }
  const toggle=e.target.closest('.tt99-context-pad-toggle');
  if(toggle&&activePad&&activePad.contains(toggle)){
    e.preventDefault();e.stopPropagation();setCollapsed(!activePad.classList.contains('tt99-context-pad-collapsed'));return;
  }
  const handle=e.target.closest('.tt99-context-pad-handle');
  if(handle&&activePad&&activePad.contains(handle)&&suppressHandleClick){
    e.preventDefault();suppressHandleClick=false;return;
  }

  if(e.target.closest(PAD_SELECTOR))return;

  const entry=e.target.closest(ENTRY_SELECTOR);
  const pad=currentPad();
  if(entry&&pad&&b.contains(entry)){
    activeEntry=entry;
    if(activePad===pad){
      setPadSpace();
      keepBoardClearOfPad();
      keepEntryVisible(entry);
    }else if(autoOpenForCurrentInput()){
      setTimeout(()=>openPad(pad,entry),0);
    }
    return;
  }

  if(activePad)hidePad();
});

document.addEventListener('keydown',e=>{
  if(!activePad)return;
  if(e.key==='Escape'){hidePad();return;}
  const h=e.target.closest?.('.tt99-context-pad-handle');
  if(!h||window.innerWidth<=760||inputProfile()==='touch')return;
  const step=e.shiftKey?20:8;
  const dir={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[e.key];
  if(!dir)return;
  e.preventDefault();
  const r=activePad.getBoundingClientRect();
  const p=clampDragPosition(r.left+dir[0],r.top+dir[1],activePad);
  dragPos=p;applyDragPosition(activePad);
});

document.addEventListener('pointerdown',e=>{
  if(!activePad||window.innerWidth<=760||inputProfile()==='touch')return;
  const h=e.target.closest?.('.tt99-context-pad-handle');
  if(!h||!activePad.contains(h)||e.target.closest('button'))return;
  const r=activePad.getBoundingClientRect();
  dragState={pointerId:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top,startX:e.clientX,startY:e.clientY,moved:false};
  activePad.classList.add('tt99-context-pad-dragging');
  try{h.setPointerCapture?.(e.pointerId);}catch(_){}
  e.preventDefault();
},{capture:true});

document.addEventListener('pointermove',e=>{
  if(!dragState||!activePad||e.pointerId!==dragState.pointerId)return;
  const moved=Math.hypot(e.clientX-dragState.startX,e.clientY-dragState.startY)>4;
  dragState.moved=dragState.moved||moved;
  const p=clampDragPosition(e.clientX-dragState.dx,e.clientY-dragState.dy,activePad);
  dragPos=p;applyDragPosition(activePad);
  e.preventDefault();
},{capture:true});

function finishDrag(e){
  if(!dragState||e.pointerId!==dragState.pointerId)return;
  suppressHandleClick=dragState.moved;
  dragState=null;
  activePad?.classList.remove('tt99-context-pad-dragging');
}
document.addEventListener('pointerup',finishDrag,{capture:true});
document.addEventListener('pointercancel',finishDrag,{capture:true});

window.addEventListener('resize',()=>{
  const b=board();
  if(b)b.dataset.tt99InputProfile=inputProfile();
  if(activePad){
    if(dragPos&&window.innerWidth>760&&inputProfile()!=='touch'){
      const r=activePad.getBoundingClientRect();
      dragPos=clampDragPosition(r.left,r.top,activePad);
    }
    applyDragPosition(activePad);
    setPadSpace();
    keepBoardClearOfPad();
    keepEntryVisible(activeEntry);
  }
});

window.TT99ContextKeypad={hide:hidePad,isOpen:()=>!!activePad};
function boot(){
  installObserver();
  setTimeout(manageCurrentPad,0);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
