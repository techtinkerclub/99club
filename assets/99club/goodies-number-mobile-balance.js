/* 99 Club Studio · Number Mobile Balance adapter
 * The established balance model owns state, challenges, undo/redo and exports.
 * This adapter keeps those contracts intact while presenting the live tool as
 * a number mobile: number tiles hang directly from the equal-arm balance.
 */
(function(G){
'use strict';
if(!G||typeof G.balanceTool!=='function')return;
const originalBalanceTool=G.balanceTool;
let observers=[];
function disconnect(){observers.forEach(o=>o.disconnect());observers=[]}
function exactText(root,from,to){
  if(!root)return;
  root.querySelectorAll('*').forEach(el=>{
    if(el.children.length===0&&String(el.textContent||'').trim()===from)el.textContent=to;
  });
}
function adaptStage(stage){
  if(!stage)return;
  const work=stage.querySelector('.gd-eq-balance-workbench');
  if(!work)return;
  work.classList.add('gd-number-mobile-workbench');
  const summary=work.querySelector('.gd-eq-summary span');
  if(summary&&/equation balance/i.test(summary.textContent||''))summary.textContent='Number mobile';
  const selected=work.querySelector('.gd-eq-selected__head span');
  if(selected&&/selected weight/i.test(selected.textContent||''))selected.textContent='Selected number';
  const help=work.querySelector('.gd-eq-drag-hint');
  if(help)help.textContent='Drag a number tile across the mobile to move it to the other side. Select a tile to edit, duplicate or hide its value.';
  work.querySelectorAll('[data-ba-token]').forEach(tile=>{
    const value=tile.querySelector('strong')?.textContent?.trim()||'number';
    const frozen=tile.disabled?' fixed for this challenge':'';
    tile.setAttribute('aria-label',(value==='?'?'Hidden number':'Number '+value)+frozen);
    tile.setAttribute('title',tile.disabled?'Fixed number tile':'Drag or select this number tile');
  });
  work.querySelectorAll('[data-ba-stage-add]').forEach(button=>{
    const side=button.dataset.baStageAdd==='right'?'right':'left';
    button.setAttribute('aria-label','Add 1 to '+side+' side');
    button.setAttribute('title','Add 1 to '+side+' side');
  });
}
function adaptControls(controls){
  if(!controls)return;
  exactText(controls,'Add a weight','Add a number tile');
  exactText(controls,'Show pan totals','Show side totals');
  exactText(controls,'Selected weight value','Selected number value');
  controls.querySelectorAll('.gd-help').forEach(el=>{
    const text=String(el.textContent||'');
    if(/Drag weights between pans/i.test(text))el.textContent='Drag number tiles between the two sides to explore how their values change the mobile.';
    else if(/vector weights, beam position/i.test(text))el.textContent='Mobile-only export contains the current number tiles, balance position and visible mathematical readouts without editing controls.';
  });
  controls.querySelectorAll('button').forEach(button=>{
    if(button.textContent.trim()==='Balanced example')button.textContent='Balanced mobile example';
  });
}
function observe(root,fn){
  if(!root)return;
  let queued=false;
  const run=()=>{queued=false;fn(root)};
  const obs=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(run)});
  obs.observe(root,{childList:true,subtree:true,characterData:true});
  observers.push(obs);run();
}
G.balanceTool=function numberMobileBalanceTool(){
  disconnect();
  originalBalanceTool();
  observe(document.getElementById('gd-stage'),adaptStage);
  observe(document.getElementById('gd-controls'),adaptControls);
};
G.numberMobileBalanceVersion='1.0';
})(window.TT99Goodies);
