/* 99 Club Studio · Online Play top instructions v1.1.0
 * Moves the existing objective + How to play content above the board so the
 * player sees the rules before interacting, especially on phones. Puzzle-
 * specific live tips (for example Word Search directions) are mirrored here too.
 */
(function(){
'use strict';
let panel=null,liveRule=null;
function arrange(){
  const card=document.querySelector('.tt99-play-board-card'),head=card?.querySelector('.tt99-play-board-head');
  const instruction=document.getElementById('tt99-play-instruction'),how=document.querySelector('.tt99-play-how');
  if(!card||!head||!instruction||!how)return;
  if(!panel||!panel.isConnected){
    panel=document.createElement('div');panel.className='tt99-play-top-instructions';
    liveRule=document.createElement('p');liveRule.className='tt99-play-live-rule';liveRule.hidden=true;
    head.insertAdjacentElement('afterend',panel);
  }
  if(instruction.parentElement!==panel)panel.appendChild(instruction);
  if(liveRule&&liveRule.parentElement!==panel)panel.appendChild(liveRule);
  if(how.parentElement!==panel)panel.appendChild(how);
  instruction.classList.add('is-top');

  const source=document.querySelector('#tt99-play-board .tt99-play-board-tip');
  const text=source?.textContent?.trim()||'';
  if(liveRule){
    if(text){if(liveRule.textContent!==text)liveRule.textContent=text;liveRule.hidden=false;}
    else{liveRule.hidden=true;if(liveRule.textContent)liveRule.textContent='';}
  }
}
function boot(){
  arrange();
  const root=document.getElementById('tt99-play-root');
  if(root&&window.MutationObserver)new MutationObserver(arrange).observe(root,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
