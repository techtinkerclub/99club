/* Number Mobile Balance v11 · compatibility chrome layer
 * Hard challenge variety now lives in the stable v6 challenge engine so the
 * normal challenge lifecycle, embed guard and v7 curtain all see every launch.
 */
(function(G){
'use strict';
if(!G)return;
function q(sel,root=document){return root?.querySelector?.(sel)||null}
function stage(){return document.getElementById('gd-stage')}
function work(){return q('.gd-number-mobile-workbench',stage())}
function banner(){return q('.gd-challenge-banner',stage())}
function wait(ms=30){return new Promise(resolve=>setTimeout(resolve,ms))}
async function waitFor(fn,{tries=120,delay=30}={}){for(let i=0;i<tries;i++){const value=fn();if(value)return value;await wait(delay)}return null}
function pupilReady(){return document.body.classList.contains('nmb-v8-pupil-challenge')&&!!banner()}
function setLabel(button,label,title){if(!button)return;if(button.textContent.trim()!==label)button.textContent=label;if(title)button.title=title}
function tidyChrome(){
  if(!pupilReady())return false;
  const b=banner(),w=work(),actions=q('.gd-challenge-actions',b);if(!b||!w||!actions)return false;
  let change=q('[data-nmb-v9-change]',actions);
  if(!change){change=document.createElement('button');change.type='button';change.className='gd-challenge-action';change.dataset.nmbV9Change='1';change.textContent='Change';change.onclick=e=>{e.preventDefault();e.stopPropagation();q('[data-nmb-challenge-toggle]',w)?.click()};actions.insertBefore(change,actions.firstChild)}
  let another=q('[data-nmb-v6-another]',actions);
  if(!another&&G.numberMobileChallengeSpec?.type){another=document.createElement('button');another.type='button';another.className='gd-challenge-action';another.dataset.nmbV6Another='1';another.textContent='Another';actions.insertBefore(another,q('[data-board-action="reveal"]',actions)||null)}
  setLabel(change,'Change','Choose a different Number Mobile challenge');
  setLabel(another,'Another','Generate another challenge of this type');
  setLabel(q('[data-board-action="reveal"]',actions),'Reveal','Reveal the answer');
  setLabel(q('[data-nmb-v7-exit]',actions),'Exit','Exit challenge mode');
  return true;
}
async function tidyWhenReady(){await waitFor(()=>pupilReady());tidyChrome()}
function relevant(target){return !!target?.closest?.('[data-nmb-v6-type],[data-nmb-v6-another],[data-nmb-v9-change],[data-nmb-challenge-toggle],[data-nmb-v7-exit]')}
function install(){
  window.addEventListener('click',e=>{if(relevant(e.target))setTimeout(tidyWhenReady,0)},true);
  document.addEventListener('click',()=>setTimeout(tidyWhenReady,0),true);
  setTimeout(tidyWhenReady,80);
}
G.numberMobileVarietyVersion='11.1-native-v6';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(window.TT99Goodies);
