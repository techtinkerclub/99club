/* 99 Club Studio · Online Play completion preview v1.0.3 */
(function(){
'use strict';
const watched=new WeakSet();
const TRANSIENT='.is-selected,.is-related,.is-same,.is-current,.is-hint,.is-wrong,.is-keypad-active,.tt99-entry-host-active';
function clearTransient(node){
  document.activeElement?.blur?.();
  node.querySelectorAll?.(TRANSIENT).forEach(el=>el.classList.remove('is-selected','is-related','is-same','is-current','is-hint','is-wrong','is-keypad-active','tt99-entry-host-active'));
}
function freezeStructureInputs(node,values){
  node.querySelectorAll?.('.tt99-structure-entry').forEach((el,i)=>{
    const frozen=document.createElement('span');
    frozen.className='tt99-capture-value';
    frozen.textContent=values[i]??el.value??'';
    el.replaceWith(frozen);
  });
}
function sanitiseClone(node,structureValues=[]){
  freezeStructureInputs(node,structureValues);
  node.removeAttribute?.('id');
  node.querySelectorAll?.('[id]').forEach(el=>el.removeAttribute('id'));
  node.querySelectorAll?.('button,input,select,textarea,a').forEach(el=>{
    el.setAttribute('tabindex','-1');
    el.setAttribute('aria-hidden','true');
    if('disabled' in el)el.disabled=true;
  });
  node.querySelectorAll?.('.tt99-number-keypad,.tt99-structure-keypad,.tt99-cycle-note,.tt99-hashi-note,.tt99-hashi-hitlayer,.tt99-play-board-tip').forEach(el=>el.remove());
  clearTransient(node);
}
function injectPreview(){
  const popup=document.getElementById('tt99-play-complete');
  if(!popup||popup.hidden||popup.querySelector('.tt99-play-complete-solution'))return;
  const card=popup.querySelector('.tt99-play-complete-card');
  const source=document.getElementById('tt99-play-board');
  if(!card||!source||!source.firstElementChild)return;
  const structureValues=[...source.querySelectorAll('.tt99-structure-entry')].map(el=>String(el.value??''));
  clearTransient(source);
  const clone=source.cloneNode(true);
  sanitiseClone(clone,structureValues);
  clone.classList.add('tt99-play-complete-snapshot');
  clone.setAttribute('aria-hidden','true');
  const wrap=document.createElement('section');
  wrap.className='tt99-play-complete-solution';
  wrap.innerHTML='<div class="tt99-play-complete-solution-head"><small>Your solution</small></div><div class="tt99-play-complete-solution-board"></div>';
  wrap.querySelector('.tt99-play-complete-solution-board').appendChild(clone);
  card.appendChild(wrap);
}
function watch(){
  const popup=document.getElementById('tt99-play-complete');
  if(!popup)return false;
  if(watched.has(popup)){injectPreview();return true;}
  watched.add(popup);
  new MutationObserver(injectPreview).observe(popup,{childList:true,subtree:false,attributes:true,attributeFilter:['hidden']});
  injectPreview();
  return true;
}
function boot(){
  if(watch())return;
  const root=document.getElementById('tt99-play-root');
  if(!root)return;
  const observer=new MutationObserver(()=>{if(watch())observer.disconnect();});
  observer.observe(root,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
