/* 99 Club Studio · v1.38 browser refinement */
(function(global){
'use strict';
const root=document.getElementById('tt99-games-root');if(!root)return;let scheduled=false;
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function refineCode(){
  root.querySelectorAll('.tt99-operationgrid .tt99-v136-lock').forEach(lock=>{
    if(lock.dataset.v138==='1')return;lock.dataset.v138='1';
    const main=lock.querySelector('.tt99-v136-lock-main'),choices=main?.querySelector(':scope > div:not(.tt99-v136-lock-equation)');
    if(choices){choices.classList.add('tt99-v138-lock-key');}
    const badge=lock.querySelector(':scope > i');if(badge)badge.textContent=`LOCK ${badge.textContent.trim()}`;
  });
}
function refineMachines(){
  root.querySelectorAll('.tt99-functionmachine').forEach(activity=>{
    if(activity.dataset.v138Machine==='1')return;const old=activity.querySelector('.tt99-v137-machine');if(!old)return;
    activity.dataset.v138Machine='1';
    const stages=[...old.querySelectorAll('.tt99-v137-machine-stage')].map((el,i)=>({label:el.querySelector('small')?.textContent||`Step ${i+1}`,op:el.querySelector('b')?.textContent||''}));
    const bits=['<div class="tt99-v138-machine-port">Input</div>'];
    stages.forEach((s,i)=>{bits.push('<span class="tt99-v138-machine-link"></span>');bits.push(`<div class="tt99-v138-machine-stage"><small>${esc(s.label)}</small>${esc(s.op)}</div>`);});
    bits.push('<span class="tt99-v138-machine-link"></span><div class="tt99-v138-machine-port">Output</div>');
    old.insertAdjacentHTML('afterend',`<div class="tt99-v138-machine">${bits.join('')}</div>`);
  });
}
function enhance(){refineCode();refineMachines();}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});schedule();
})(typeof globalThis!=='undefined'?globalThis:this);
