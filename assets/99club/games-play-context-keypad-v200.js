/* 99 Club Studio · contextual keypad for long mobile puzzles v2.00 */
(function(){
'use strict';
if(window.__tt99ContextKeypadV200)return;
window.__tt99ContextKeypadV200=true;

const pads='.tt99-wave184-keypad,.tt99-wave186-keypad,.tt99-v196-keypad';
const entries='[data-conn-entry],[data-trail-i],[data-cg-key],[data-machine],[data-sym],[data-mobile-answer]';
let activePad=null;

function isMobile(){return window.matchMedia('(max-width:700px)').matches;}
function hidePad(){
  const board=document.getElementById('tt99-play-board');
  if(activePad)activePad.classList.remove('tt99-context-pad-active');
  if(board){board.classList.remove('tt99-has-context-pad');board.style.removeProperty('--tt99-context-pad-space');}
  activePad=null;
}
function showPad(entry){
  if(!isMobile())return;
  const board=document.getElementById('tt99-play-board');
  if(!board||!board.contains(entry))return;
  const pad=board.querySelector(pads);if(!pad)return;
  const pr=pad.getBoundingClientRect(),er=entry.getBoundingClientRect(),screen=window.innerHeight;
  /* Only float when the inline keypad is genuinely far from the selected answer.
     A puzzle that is merely a little taller than the phone keeps its normal inline keypad. */
  const gap=pr.top-er.bottom,longPuzzle=gap>screen*.48;
  if(!longPuzzle){hidePad();return;}
  hidePad();activePad=pad;pad.classList.add('tt99-context-pad-active');board.classList.add('tt99-has-context-pad');
  requestAnimationFrame(function(){
    const height=pad.getBoundingClientRect().height;
    board.style.setProperty('--tt99-context-pad-space',Math.ceil(height+28)+'px');
    const r=entry.getBoundingClientRect(),limit=window.innerHeight-height-18;
    if(r.bottom>limit)window.scrollBy({top:r.bottom-limit+14,behavior:'smooth'});
    else if(r.top<84)window.scrollBy({top:r.top-94,behavior:'smooth'});
  });
}

document.addEventListener('click',function(e){
  if(!isMobile()){hidePad();return;}
  if(e.target.closest(pads))return;
  const entry=e.target.closest(entries);
  if(!entry){hidePad();return;}
  setTimeout(function(){showPad(entry);},0);
});
window.addEventListener('resize',function(){if(!isMobile())hidePad();});
})();
