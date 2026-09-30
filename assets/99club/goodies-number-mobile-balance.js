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
let lastVisual={angle:0,left:0,right:0};

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
function numberVar(el,name){return Number.parseFloat(el?.style?.getPropertyValue(name))||0}
function animateMobile(work){
  const apparatus=work.querySelector('.gd-eq-balance');
  if(!apparatus||apparatus.dataset.numberMobileAnimated==='1')return;
  apparatus.dataset.numberMobileAnimated='1';
  const beam=work.querySelector('.gd-eq-beam'),left=work.querySelector('.gd-eq-side--left'),right=work.querySelector('.gd-eq-side--right');
  const legacyAngle=numberVar(apparatus,'--ba-tilt');
  const target={angle:-legacyAngle,left:numberVar(apparatus,'--ba-left-lift'),right:numberVar(apparatus,'--ba-right-lift')};
  const transition='.28s cubic-bezier(.22,.78,.28,1.08)';
  if(beam){beam.style.transition='none';beam.style.transform='rotate('+lastVisual.angle+'deg)'}
  if(left){left.style.transition='none';left.style.transform='translateY('+lastVisual.left+'px)'}
  if(right){right.style.transition='none';right.style.transform='translateY('+lastVisual.right+'px)'}
  /* Force the start pose to be committed before applying the new endpoint pose. */
  void apparatus.offsetWidth;
  requestAnimationFrame(()=>{
    if(beam){beam.style.transition='transform '+transition;beam.style.transform='rotate('+target.angle+'deg)'}
    if(left){left.style.transition='transform '+transition;left.style.transform='translateY('+target.left+'px)'}
    if(right){right.style.transition='transform '+transition;right.style.transform='translateY('+target.right+'px)'}
  });
  lastVisual=target;
}
function adaptStage(stage){
  if(!stage)return;
  const work=stage.querySelector('.gd-eq-balance-workbench');
  if(!work){disconnect();return}
  work.classList.add('gd-number-mobile-workbench');
  animateMobile(work);

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
  if(!controls||!document.querySelector('.gd-eq-balance-workbench'))return;
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
  lastVisual={angle:0,left:0,right:0};
  originalBalanceTool();
  adaptToolHeader();
  observe(document.getElementById('gd-stage'),adaptStage);
  observe(document.getElementById('gd-controls'),adaptControls);
};
G.numberMobileBalanceVersion='1.4';
document.addEventListener('DOMContentLoaded',()=>queueMicrotask(adaptCatalogueCard),{once:true});
})(window.TT99Goodies);
