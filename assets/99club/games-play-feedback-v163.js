/* 99 Club Studio · Online Play feedback v1.63
 * Keeps hint feedback visible without document-wide modal observers.
 */
(function(){
'use strict';
let lastHint='',toastTimer=0;
function status(){return document.getElementById('tt99-play-status');}
function toast(){
  const box=status();
  if(!box||box.dataset.tone!=='hint')return;
  const text=(box.textContent||'').trim();
  if(!text||text===lastHint)return;
  lastHint=text;
  let el=document.getElementById('tt99-hint-toast');
  if(!el){
    el=document.createElement('div');
    el.id='tt99-hint-toast';
    el.className='tt99-hint-toast';
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    document.body.appendChild(el);
  }
  el.textContent=text;
  el.hidden=false;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{el.hidden=true;},7000);
}
function boot(){
  const box=status();
  if(!box)return;
  new MutationObserver(toast).observe(box,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-tone']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
