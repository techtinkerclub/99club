/* 99 Club Studio · Games granular topic selector UI v1.45.1 · topic-only */
(function(global){
'use strict';
const root=document.getElementById('tt99-games-root'),G=global.TT99Games;if(!root||!G?.FOCUS_TOPICS||root.dataset.focusTopicsV145==='1')return;
root.dataset.focusTopicsV145='1';let scheduled=false;
const SETTINGS_KEY='tt99-games-settings-v4';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function stored(){try{return G.normalizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'));}catch(e){return G.normalizeSettings({});}}
function focusLabels(s){return (s.focusTopics||[]).map(id=>G.FOCUS_TOPICS[id]?.label||id).filter(Boolean);}
function focusSummary(s){const labels=focusLabels(s);if(!labels.length)return 'Maths teaching focus';const joined=labels.join(' · ');if(joined.length<=82)return joined;if(labels.length<=2)return joined;return `${labels[0]} · ${labels[1]} · +${labels.length-2} more`;}
function applyFocus(ids){
  const clean=[...new Set((ids||[]).filter(id=>G.FOCUS_TOPICS[id]))];if(!clean.length)return;
  global.__tt99PendingGameFocusTopics=clean;
  const parents=new Set(G.focusParents(clean));
  const legacy=[...root.querySelectorAll('.tt99-topic-legacy-v145 [data-topic]')];
  legacy.forEach(el=>el.checked=parents.has(el.dataset.topic));
  const trigger=legacy.find(el=>el.checked)||legacy[0];
  trigger?.dispatchEvent(new Event('change',{bubbles:true}));
  // Base render/normalisation is synchronous; avoid stale pending state leaking
  // into unrelated settings changes after the focus update completes.
  delete global.__tt99PendingGameFocusTopics;
}
function build(){
  const oldGrid=root.querySelector('.tt99-games-topic-grid'),label=root.querySelector('.tt99-games-topic-label');if(!oldGrid)return;
  oldGrid.classList.add('tt99-topic-legacy-v145');oldGrid.hidden=true;if(label)label.hidden=true;
  const card=oldGrid.closest('.tt99-games-card');if(!card||card.querySelector('.tt99-focus-v145'))return;
  const s=stored(),selected=new Set(s.focusTopics||[]),groups=(G.FOCUS_GROUPS||[]).map((group,i)=>{
    const topics=Object.entries(G.FOCUS_TOPICS).filter(([,m])=>m.group===group.id),selectedCount=topics.filter(([id])=>selected.has(id)).length;
    return `<details class="tt99-focus-group ${selectedCount?'has-selection':''}" ${selectedCount||i===0?'open':''}><summary><span><strong>${esc(group.label)}</strong><small>${selectedCount?`${selectedCount} selected`:'Choose a focus'}</small></span><em>▾</em></summary><div class="tt99-focus-topic-list">${topics.map(([id,m])=>`<label class="tt99-focus-topic ${selected.has(id)?'is-selected':''}"><input type="checkbox" data-focus-topic="${id}" ${selected.has(id)?'checked':''}><span>${esc(m.label)}</span></label>`).join('')}</div></details>`;
  }).join('');
  const el=document.createElement('div');el.className='tt99-focus-v145';el.innerHTML=`<div class="tt99-focus-heading"><span>Teaching focus</span><small>Choose one or more precise areas. Number ranges and automatic puzzle sizing are handled for you; difficulty is configured separately for each game.</small></div><div class="tt99-focus-actions"><button type="button" class="tt99-ghost" data-focus-all>Select all</button><button type="button" class="tt99-ghost" data-focus-core>Core arithmetic</button></div><div class="tt99-focus-groups">${groups}</div>`;
  oldGrid.insertAdjacentElement('afterend',el);
  el.querySelectorAll('[data-focus-topic]').forEach(cb=>cb.addEventListener('change',()=>{const ids=[...el.querySelectorAll('[data-focus-topic]:checked')].map(x=>x.dataset.focusTopic);if(!ids.length){cb.checked=true;return;}applyFocus(ids);}));
  el.querySelector('[data-focus-all]')?.addEventListener('click',()=>applyFocus(Object.keys(G.FOCUS_TOPICS)));
  el.querySelector('[data-focus-core]')?.addEventListener('click',()=>applyFocus(['addition_subtraction','multiplication_division','inverse_missing']));
}
function removeLegacyYearWording(){
  // Preserve internal automatic generation settings, but never present them as
  // teacher-facing year recommendations.
  root.querySelectorAll('option').forEach(opt=>{
    const text=String(opt.textContent||'').trim();
    if(/^Auto for year\s*\/\s*difficulty$/i.test(text))opt.textContent='Auto for difficulty';
    else if(/^Auto for year$/i.test(text))opt.textContent='Auto';
  });
}
function patchVisibleMetadata(){
  const s=stored(),summary=focusSummary(s),broad=new Set(Object.values(G.TOPICS||{}).map(m=>m?.label).filter(Boolean));
  root.querySelectorAll('.tt99-game-paper-identity p,.tt99-games-preview-toolbar>div:first-child>span:first-of-type').forEach(el=>{
    if(el.dataset.focusMetaV145===summary)return;
    const parts=String(el.textContent||'').split(' · ').filter(Boolean),kept=[];let insertAt=-1;
    for(const part of parts){const isOld=broad.has(part)||/^Years?\s+\d+(?:[–-]\d+)?$/i.test(part)||/^\d+ selected maths topics$/i.test(part)||/^All maths topics$/i.test(part)||/^Maths topics$/i.test(part);if(isOld){if(insertAt<0)insertAt=kept.length;continue;}kept.push(part);}
    if(insertAt<0)insertAt=Math.min(2,kept.length);kept.splice(insertAt,0,summary);el.textContent=kept.join(' · ');el.dataset.focusMetaV145=summary;
  });
  root.querySelectorAll('.tt99-engine-compatibility').forEach(el=>{if(/year\/topic combination/i.test(el.textContent||''))el.textContent='Not a good fit for the selected teaching focus.';});
}
function patchPdfMetadata(){
  const PDF=global.TT99GamesPDF;if(!PDF?.buildDocument||PDF.__focusTopicsV145)return;
  const base=PDF.buildDocument.bind(PDF);PDF.buildDocument=function(opts={}){const s=G.normalizeSettings(opts.settings||{}),label=focusSummary(s),key='__tt99_focus_summary__';return base({...opts,settings:{...(opts.settings||{}),minYear:s.minYear,maxYear:s.maxYear,hideYearLabel:true,topics:[key],focusTopics:s.focusTopics,generationLevel:s.generationLevel},topics:{...(opts.topics||{}),[key]:{label}}});};PDF.__focusTopicsV145=true;
}
function enhance(){build();removeLegacyYearWording();patchVisibleMetadata();}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}
patchPdfMetadata();
// games-app replaces the root's first child on render. Watching only root-level
// children avoids reacting to our own accordion/highlight/text mutations.
new MutationObserver(schedule).observe(root,{childList:true});
schedule();
})(typeof globalThis!=='undefined'?globalThis:this);
