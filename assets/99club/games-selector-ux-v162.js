/* 99 Club Studio · Sheets selector state/accordion finishing layer v1.62
 * Keeps topic/game accordions under explicit user control, fixes category counts
 * after extension cards are injected, and removes the unsupported 3-up option.
 */
(function(global){
'use strict';
const root=document.getElementById('tt99-games-root'),G=global.TT99Games;
if(!root||!G||root.dataset.selectorUxV162==='1')return;
root.dataset.selectorUxV162='1';
const SETTINGS_KEY='tt99-games-settings-v4',RESTORE_KEY='tt99-games-open-once-v162';
let scheduled=false,gamesInitialised=false;
let focusOpen=new Set();

function loadSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')||{};}catch(_){return {};}}
function saveSettings(s){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));return true;}catch(_){return false;}}
function focusKey(details){return details?.querySelector('summary strong')?.textContent?.trim()||'';}
function openGameIds(){return [...root.querySelectorAll('[data-category-toggle][aria-expanded="true"]')].map(b=>b.dataset.categoryToggle).filter(Boolean);}
function openFocusKeys(){return [...root.querySelectorAll('.tt99-focus-group[open]')].map(focusKey).filter(Boolean);}
function storeOpenOnce(){try{sessionStorage.setItem(RESTORE_KEY,JSON.stringify({games:openGameIds(),focus:openFocusKeys()}));}catch(_){}}
function readRestore(){try{const raw=sessionStorage.getItem(RESTORE_KEY);if(!raw)return null;sessionStorage.removeItem(RESTORE_KEY);return JSON.parse(raw);}catch(_){return null;}}
const pending=readRestore();
if(Array.isArray(pending?.focus))focusOpen=new Set(pending.focus);

function gameToggle(id){return root.querySelector(`[data-category-toggle="${String(id).replace(/"/g,'\\"')}"]`);}
function initialiseGameAccordions(){
  if(gamesInitialised)return;
  const toggles=[...root.querySelectorAll('[data-category-toggle]')];if(!toggles.length)return;
  gamesInitialised=true;
  // Every fresh visit starts collapsed. A one-shot restore is used only when an
  // older extension card has forced a page reload during a selection change.
  toggles.filter(b=>b.getAttribute('aria-expanded')==='true').forEach(b=>b.click());
  if(Array.isArray(pending?.games)){
    for(const id of pending.games){const b=gameToggle(id);if(b&&b.getAttribute('aria-expanded')!=='true')b.click();}
  }
}

function applyFocusAccordionState(){
  const groups=[...root.querySelectorAll('.tt99-focus-group')];if(!groups.length)return;
  for(const details of groups){const key=focusKey(details);const should=!!key&&focusOpen.has(key);if(details.open!==should)details.open=should;}
}

function refreshCategoryCounts(){
  root.querySelectorAll('.tt99-game-category').forEach(cat=>{
    const inputs=[...cat.querySelectorAll('.tt99-engine-card input[type="checkbox"]')];
    // Closed categories intentionally do not render their engine cards. In that
    // state the count already rendered by games-app is authoritative; treating
    // the absent cards as an empty category would incorrectly overwrite it as 0/0.
    if(!inputs.length)return;
    const compatible=inputs.filter(i=>!i.disabled),selected=compatible.filter(i=>i.checked);
    const count=cat.querySelector('.tt99-game-category-toggle em');
    const nextCount=`${selected.length}/${compatible.length} selected`;
    if(count&&count.textContent!==nextCount)count.textContent=nextCount;
    cat.classList.toggle('has-selection',selected.length>0);
    const clear=cat.querySelector('[data-category-clear]');if(clear)clear.disabled=selected.length===0;
  });
}

function removeUnsupportedThreeUp(){
  const select=root.querySelector('#games-activities');if(!select)return;
  const wasThree=select.value==='3';
  select.querySelector('option[value="3"]')?.remove();
  if(wasThree){select.value='2';select.dispatchEvent(new Event('change',{bubbles:true}));}
}

function engineIdForCard(card){
  if(!card)return '';
  const normal=card.querySelector('[data-engine-select]')?.dataset.engineSelect;if(normal)return normal;
  const input=card.querySelector('input[type="checkbox"]');
  if(input){for(const [k,v] of Object.entries(input.dataset||{}))if(/select$/i.test(k)&&G.ENGINES?.[v])return v;}
  for(const attr of card.attributes||[]){if(/^data-.*-card$/i.test(attr.name)&&G.ENGINES?.[attr.value])return attr.value;}
  const title=card.querySelector('.tt99-engine-include b')?.textContent?.trim();
  if(title)for(const [id,e] of Object.entries(G.ENGINES||{}))if(e?.title===title)return id;
  return '';
}
function categoryHasExtensionCards(cat){return [...cat.querySelectorAll('.tt99-engine-card')].some(card=>!card.querySelector('[data-engine-select]'));}

function bulkCategory(btn,selecting){
  const cat=btn.closest('.tt99-game-category');if(!cat)return;
  const ids=[...new Set([...cat.querySelectorAll('.tt99-engine-card')].filter(card=>{
    const cb=card.querySelector('input[type="checkbox"]');return cb&&!cb.disabled;
  }).map(engineIdForCard).filter(Boolean))];
  if(!ids.length)return;
  const s=loadSettings(),set=new Set(s.selectedEngines||[]);s.engineSettings=s.engineSettings||{};
  for(const id of ids){if(selecting){set.add(id);s.engineSettings[id]={...(G.ENGINES?.[id]?.defaultSettings||{}),...(s.engineSettings[id]||{})};}else set.delete(id);}
  s.selectedEngines=[...set];
  if(saveSettings(s)){storeOpenOnce();location.reload();}
}

// Track only explicit accordion actions. Re-renders are then free to recreate
// controls without silently opening or closing categories.
root.addEventListener('click',e=>{
  const summary=e.target.closest?.('.tt99-focus-group > summary');
  if(summary){const details=summary.parentElement,key=focusKey(details);setTimeout(()=>{if(!key)return;if(details.open)focusOpen.add(key);else focusOpen.delete(key);},0);return;}

  const configure=e.target.closest?.('[data-configure-engine],[data-v140-configure],[data-takuzu-configure],[data-v137-configure],[data-shikaku-configure]');
  if(configure){const before=new Set(openGameIds());setTimeout(()=>{
    for(const b of root.querySelectorAll('[data-category-toggle]')){
      const should=before.has(b.dataset.categoryToggle),isOpen=b.getAttribute('aria-expanded')==='true';
      if(should!==isOpen)b.click();
    }
  },0);return;}

  const bulk=e.target.closest?.('[data-category-select],[data-category-clear]');
  if(bulk){const cat=bulk.closest('.tt99-game-category');if(cat&&categoryHasExtensionCards(cat)){e.preventDefault();e.stopImmediatePropagation();bulkCategory(bulk,bulk.hasAttribute('data-category-select'));}}
},{capture:true});

// Several older expansion modules attach a direct change handler which saves
// correctly but reloads the page. Remember the manually-open accordions before
// that unavoidable reload so the UI returns exactly where the teacher left it.
root.addEventListener('change',e=>{
  const cb=e.target.closest?.('.tt99-engine-card input[type="checkbox"]');
  if(cb&&!cb.hasAttribute('data-engine-select'))storeOpenOnce();
},{capture:true});

function enhance(){initialiseGameAccordions();applyFocusAccordionState();refreshCategoryCounts();removeUnsupportedThreeUp();}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
root.addEventListener('change',()=>setTimeout(schedule,0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})(typeof globalThis!=='undefined'?globalThis:this);
