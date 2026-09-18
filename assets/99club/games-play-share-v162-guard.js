/* Prevent the legacy v1.57 completion injector from re-adding its large share buttons. */
(function(){
'use strict';
let queued=false;
function clean(){queued=false;document.querySelectorAll('.tt99-play-complete-actions').forEach(actions=>{
  actions.querySelectorAll(':scope > [data-share-card],:scope > [data-challenge-card]').forEach(el=>el.remove());
  if(!actions.querySelector('[data-v162-share-sentinel]')){const s=document.createElement('span');s.hidden=true;s.dataset.shareCard='1';s.dataset.v162ShareSentinel='1';actions.appendChild(s);}
});}
function schedule(){if(queued)return;queued=true;queueMicrotask(clean);}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
