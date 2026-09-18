/* 99 Club Studio · solved share-card value preservation v1.76
 * iOS/html2canvas is unreliable when cloning completed native inputs. Once a
 * solved-share action begins, convert the now-read-only live structure inputs
 * to plain centred text before the existing share renderer takes its capture.
 */
(function(){
'use strict';
function freezeSolvedStructureValues(){
  const complete=document.getElementById('tt99-play-complete');
  const board=document.getElementById('tt99-play-board');
  if(!complete||complete.hidden||!board)return;
  board.querySelectorAll('.tt99-structure-entry').forEach(input=>{
    const value=String(input.value??'');
    const frozen=document.createElement('span');
    frozen.className='tt99-capture-value';
    frozen.textContent=value;
    frozen.dataset.frozenEntry=input.dataset.entry||'';
    frozen.setAttribute('aria-hidden','true');
    input.replaceWith(frozen);
  });
  board.querySelectorAll('.is-keypad-active,.tt99-entry-host-active,.is-selected,.is-related,.is-same,.is-current,.is-hint,.is-wrong').forEach(el=>{
    el.classList.remove('is-keypad-active','tt99-entry-host-active','is-selected','is-related','is-same','is-current','is-hint','is-wrong');
  });
}
document.addEventListener('click',e=>{
  if(!e.target.closest?.('[data-share-card],[data-challenge-card]'))return;
  freezeSolvedStructureValues();
},true);
})();
