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

/* goodies-app publishes its catalogue after this file runs. Intercept that one
 * assignment so the whiteboard rail also uses the classroom-facing name. */
let catalogueValue=G.toolCatalogue;
try{
  Object.defineProperty(G,'toolCatalogue',{
    configurable:true,
    get(){return catalogueValue},
    set(value){
      catalogueValue=Array.isArray(value)?value.map(item=>item?.id==='balance'?{
        ...item,
        title:'Number mobile balance',
        desc:'Balance hanging number tiles on a centred maths mobile.',
        use:'Equality, missing-number problems, inverse operations and comparing expressions.'
      }:item):value;
    }
  });
}catch(_err){}

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

  /* The legacy balance stored its angle using the old seesaw sign convention.
   * The endpoint lifts already use the physically correct direction, so invert
   * only the visible bar: the heavier hanging side now always sits lower. */
  const apparatus=work.querySelector('.gd-eq-balance'),beam=work.querySelector('.gd-eq-beam');
  if(apparatus&&beam){
    const raw=apparatus.style.getPropertyValue('--ba-tilt');
    const deg=Number.parseFloat(raw)||0;
    beam.style.transform='rotate('+(-deg)+'deg)';
  }

  const summary=work.querySelector('.gd-eq-summary span');
  if(summary&&/equation balance/i.test(summary.textContent||''))summary.textContent='Number mobile';
  const selected=work.querySelector('.gd-eq-selected__head span');
  if(selected&&/selected weight/i.test(selected.textContent||''))selected.textContent='Selected number';
  const desiredHelp='Drag a number tile across the mobile to move it to the other side. Select a tile to edit, duplicate or hide its value.';
  const help=work.querySelector('.gd-eq-drag-hint');
  if(help&&help.textContent!==desiredHelp)help.textContent=desiredHelp;
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
function adaptToolHeader(){
  const title=document.getElementById('gd-tool-title');
  const desc=document.getElementById('gd-tool-desc');
  if(title)title.textContent='Number mobile balance';
  if(desc)desc.textContent='Balance hanging number tiles on a centred maths mobile.';
}
function adaptCatalogueCard(){
  const card=document.querySelector('[data-tool="balance"]');
  if(!card)return;
  const title=card.querySelector('h2'),desc=card.querySelector('p');
  if(title)title.textContent='Number mobile balance';
  if(desc)desc.textContent='Balance hanging number tiles on a centred maths mobile.';
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
  adaptToolHeader();
  observe(document.getElementById('gd-stage'),adaptStage);
  observe(document.getElementById('gd-controls'),adaptControls);
};
G.numberMobileBalanceVersion='1.2';
document.addEventListener('DOMContentLoaded',()=>queueMicrotask(adaptCatalogueCard),{once:true});
})(window.TT99Goodies);
