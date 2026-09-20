/* 99 Club Studio · Online Play completion preview v1.0.4 */
(function(global){
'use strict';
const watched=new WeakSet();
const TRANSIENT='.is-selected,.is-related,.is-same,.is-current,.is-hint,.is-wrong,.is-keypad-active,.tt99-entry-host-active';
const PAD_UI=[
  '.tt99-context-pad-launcher',
  '.tt99-context-pad-handle',
  '.tt99-wave184-keypad',
  '.tt99-wave186-keypad',
  '.tt99-v196-keypad',
  '.tt99-number-keypad',
  '.tt99-structure-keypad',
  '.tt99-alpha-pad',
  '.tt99-towers-keypad',
  '.tt99-crossnumber-keypad',
  '.tt99-letter-keypad',
  '.tt99-extra-op-pad'
].join(',');
let resizeQueued=false;

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
  node.querySelectorAll?.(`${PAD_UI},.tt99-cycle-note,.tt99-hashi-note,.tt99-hashi-hitlayer,.tt99-play-board-tip`).forEach(el=>el.remove());
  node.classList.remove('tt99-has-context-pad','tt99-context-pad-reserve');
  node.style.removeProperty('--tt99-context-pad-space');
  clearTransient(node);
}
function fitLimits(el){
  const cs=getComputedStyle(el);
  const px=v=>Number.parseFloat(v)||0;
  const padX=px(cs.paddingLeft)+px(cs.paddingRight),padY=px(cs.paddingTop)+px(cs.paddingBottom);
  const compact=global.innerWidth<=520;
  const maxBoxHeight=Math.min(global.innerHeight*(compact?.42:.46),compact?360:460);
  return {
    width:Math.max(1,el.clientWidth-padX),
    height:Math.max(96,maxBoxHeight-padY)
  };
}
function fitSnapshot(solution){
  const board=solution?.querySelector('.tt99-play-complete-solution-board');
  const frame=solution?.querySelector('.tt99-play-complete-snapshot-fit');
  const clone=frame?.querySelector('.tt99-play-complete-snapshot');
  if(!board||!frame||!clone)return;

  requestAnimationFrame(()=>{
    if(!document.contains(solution)||!document.contains(clone))return;
    const limits=fitLimits(board);
    const rect=clone.getBoundingClientRect();
    let naturalWidth=Number(clone.dataset.tt99NaturalWidth)||0;
    let naturalHeight=Number(clone.dataset.tt99NaturalHeight)||0;
    if(!(naturalWidth>0))naturalWidth=Math.max(1,Math.ceil(clone.scrollWidth||0),Math.ceil(rect.width||0));
    if(!(naturalHeight>0))naturalHeight=Math.max(1,Math.ceil(clone.scrollHeight||0),Math.ceil(rect.height||0));
    clone.dataset.tt99NaturalWidth=String(naturalWidth);
    clone.dataset.tt99NaturalHeight=String(naturalHeight);
    const scale=Math.min(1,limits.width/naturalWidth,limits.height/naturalHeight);
    const scaledWidth=Math.max(1,Math.floor(naturalWidth*scale));
    const scaledHeight=Math.max(1,Math.floor(naturalHeight*scale));

    frame.style.width=scaledWidth+'px';
    frame.style.height=scaledHeight+'px';
    clone.style.position='absolute';
    clone.style.left='0';
    clone.style.top='0';
    clone.style.transformOrigin='top left';
    clone.style.transform=`scale(${scale})`;
    clone.dataset.tt99FitScale=scale.toFixed(4);
  });
}
function injectPreview(){
  const popup=document.getElementById('tt99-play-complete');
  if(!popup||popup.hidden)return;
  const existing=popup.querySelector('.tt99-play-complete-solution');
  if(existing){fitSnapshot(existing);return;}
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
  wrap.innerHTML='<div class="tt99-play-complete-solution-head"><small>Your solution</small></div><div class="tt99-play-complete-solution-board"><div class="tt99-play-complete-snapshot-fit"></div></div>';
  wrap.querySelector('.tt99-play-complete-snapshot-fit').appendChild(clone);
  card.appendChild(wrap);
  fitSnapshot(wrap);
}
function refitVisiblePreview(){
  const solution=document.querySelector('#tt99-play-complete:not([hidden]) .tt99-play-complete-solution');
  if(solution)fitSnapshot(solution);
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
global.addEventListener('resize',()=>{
  if(resizeQueued)return;
  resizeQueued=true;
  requestAnimationFrame(()=>{resizeQueued=false;refitVisiblePreview();});
});
global.TT99CompletionPreview={injectPreview,fitSnapshot,refitVisiblePreview};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(typeof globalThis!=='undefined'?globalThis:this);
