/* 99 Club Studio · Games granular topic selector UI v1.44 */
(function(global){
'use strict';
const root=document.getElementById('tt99-games-root'),G=global.TT99Games;if(!root||!G?.FOCUS_TOPICS||root.dataset.focusTopicsV144==='1')return;
root.dataset.focusTopicsV144='1';let scheduled=false;
const SETTINGS_KEY='tt99-games-settings-v4';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function stored(){try{return G.normalizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'));}catch(e){return G.normalizeSettings({});}}
function yearValue(s){return Math.max(1,Math.min(6,Number(s.yearFilter)||4));}
function available(id,year){return G.focusAllowedForYear(id,year);}
function focusLabels(s){return (s.focusTopics||[]).map(id=>G.FOCUS_TOPICS[id]?.label||id).filter(Boolean);}
function focusSummary(s){const labels=focusLabels(s);if(!labels.length)return 'Maths teaching focus';const joined=labels.join(' · ');if(joined.length<=82)return joined;if(labels.length<=2)return joined;return `${labels[0]} · ${labels[1]} · +${labels.length-2} more`;}
function applyFocus(ids){
  const s=stored(),year=yearValue(s),clean=[...new Set(ids.filter(id=>G.FOCUS_TOPICS[id]&&available(id,year)))];if(!clean.length)return;
  global.__tt99PendingGameFocusTopics=clean;
  const parents=new Set(G.focusParents(clean));
  const legacy=[...root.querySelectorAll('.tt99-topic-legacy-v144 [data-topic]')];legacy.forEach(el=>el.checked=parents.has(el.dataset.topic));
  const trigger=legacy.find(el=>el.checked)||legacy[0];trigger?.dispatchEvent(new Event('change',{bubbles:true}));
}
function applyYear(value){
  const year=Math.max(1,Math.min(6,Number(value)||4)),s=stored(),current=(s.focusTopics||[]).filter(id=>available(id,year));
  global.__tt99PendingGameYearFilter=year;global.__tt99PendingGameFocusTopics=current.length?current:Object.keys(G.FOCUS_TOPICS).filter(id=>available(id,year)).slice(0,1);
  const min=root.querySelector('#games-min-year'),max=root.querySelector('#games-max-year');if(!min||!max)return;
  min.value=String(year);max.value=String(year);min.dispatchEvent(new Event('change',{bubbles:true}));
}
function build(){
  const oldGrid=root.querySelector('.tt99-games-topic-grid'),oldYear=root.querySelector('#games-min-year')?.closest('.tt99-games-grid2'),label=root.querySelector('.tt99-games-topic-label');if(!oldGrid||!oldYear)return;
  oldGrid.classList.add('tt99-topic-legacy-v144');oldGrid.hidden=true;oldYear.classList.add('tt99-year-legacy-v144');oldYear.hidden=true;if(label)label.hidden=true;
  const card=oldGrid.closest('.tt99-games-card');if(!card||card.querySelector('.tt99-focus-v144'))return;
  const s=stored(),year=yearValue(s),selected=new Set(s.focusTopics||[]),groups=(G.FOCUS_GROUPS||[]).map((group,i)=>{
    const topics=Object.entries(G.FOCUS_TOPICS).filter(([,m])=>m.group===group.id),selectedCount=topics.filter(([id])=>selected.has(id)).length;
    return `<details class="tt99-focus-group ${selectedCount?'has-selection':''}" ${selectedCount||i===0?'open':''}><summary><span><strong>${esc(group.label)}</strong><small>${selectedCount?`${selectedCount} selected`:'Choose a focus'}</small></span><em>▾</em></summary><div class="tt99-focus-topic-list">${topics.map(([id,m])=>{const ok=available(id,year);return `<label class="tt99-focus-topic ${selected.has(id)?'is-selected':''} ${ok?'':'is-unavailable'}"><input type="checkbox" data-focus-topic="${id}" ${selected.has(id)?'checked':''} ${ok?'':'disabled'}><span>${esc(m.label)}</span></label>`;}).join('')}</div></details>`;
  }).join('');
  const el=document.createElement('div');el.className='tt99-focus-v144';el.innerHTML=`<div class="tt99-focus-year"><label class="tt99-field"><span>Year group</span><select data-focus-year>${[1,2,3,4,5,6].map(y=>`<option value="${y}" ${year===y?'selected':''}>Year ${y}</option>`).join('')}</select><small>Sets the curriculum fit and the number scale used by automatic puzzle settings.</small></label><div class="tt99-focus-actions"><button type="button" class="tt99-ghost" data-focus-all>Select all available</button><button type="button" class="tt99-ghost" data-focus-core>Core arithmetic</button></div></div><div class="tt99-focus-heading"><span>Teaching focus</span><small>Choose one or more precise areas. Puzzle difficulty is still configured separately for each game.</small></div><div class="tt99-focus-groups">${groups}</div>`;
  oldYear.insertAdjacentElement('afterend',el);
  el.querySelector('[data-focus-year]')?.addEventListener('change',e=>applyYear(e.target.value));
  el.querySelectorAll('[data-focus-topic]').forEach(cb=>cb.addEventListener('change',()=>{const ids=[...el.querySelectorAll('[data-focus-topic]:checked')].map(x=>x.dataset.focusTopic);if(!ids.length){cb.checked=true;return;}applyFocus(ids);}));
  el.querySelector('[data-focus-all]')?.addEventListener('click',()=>applyFocus(Object.keys(G.FOCUS_TOPICS).filter(id=>available(id,year))));
  el.querySelector('[data-focus-core]')?.addEventListener('click',()=>applyFocus(['addition_subtraction','multiplication_division','inverse_missing'].filter(id=>available(id,year))));
}
function patchVisibleMetadata(){
  const s=stored(),summary=focusSummary(s),broad=new Set(Object.values(G.TOPICS||{}).map(m=>m?.label).filter(Boolean));
  root.querySelectorAll('.tt99-game-paper-identity p,.tt99-games-preview-toolbar>div:first-child>span:first-of-type').forEach(el=>{
    if(el.dataset.focusMetaV144===summary)return;
    const parts=String(el.textContent||'').split(' · ').filter(Boolean),kept=[];let insertAt=-1;
    for(const part of parts){const isOld=broad.has(part)||/^\d+ selected maths topics$/i.test(part)||/^All maths topics$/i.test(part)||/^Maths topics$/i.test(part);if(isOld){if(insertAt<0)insertAt=kept.length;continue;}kept.push(part);}
    if(insertAt<0)insertAt=Math.min(2,kept.length);kept.splice(insertAt,0,summary);el.textContent=kept.join(' · ');el.dataset.focusMetaV144=summary;
  });
}
function patchPdfMetadata(){
  const PDF=global.TT99GamesPDF;if(!PDF?.buildDocument||PDF.__focusTopicsV144)return;
  const base=PDF.buildDocument.bind(PDF);PDF.buildDocument=function(opts={}){const s=G.normalizeSettings(opts.settings||{}),label=focusSummary(s),key='__tt99_focus_summary__';return base({...opts,settings:{...(opts.settings||{}),minYear:s.minYear,maxYear:s.maxYear,topics:[key],focusTopics:s.focusTopics,yearFilter:s.yearFilter},topics:{...(opts.topics||{}),[key]:{label,years:[1,2,3,4,5,6]}}});};PDF.__focusTopicsV144=true;
}
function enhance(){build();patchVisibleMetadata();}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}
patchPdfMetadata();new MutationObserver(schedule).observe(root,{childList:true,subtree:true});schedule();
})(typeof globalThis!=='undefined'?globalThis:this);
