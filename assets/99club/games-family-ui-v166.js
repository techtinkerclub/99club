/* 99 Club Studio · Games family UI v1.66.1 */
(function(){
'use strict';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function tool(href,icon,label,extra=''){return `<a href="${href}" class="tt99-brand-tool ${extra}"><span aria-hidden="true">${icon}</span>${label}</a>`;}
function brandHero(mode){
  const play=mode==='play';
  const title=play?'Play Online':'Maths Games & Puzzles';
  const note=play?'Fresh interactive maths puzzles · Relaxed or Challenge mode':'Build polished printable maths games and puzzle packs';
  const alternate=play?tool('/tools/99-club/games/','▦','Printable games'):tool('/tools/99-club/games/play/','▶','Play online');
  return `
    <span class="tt99-brand-math tt99-brand-math--x2" aria-hidden="true">x²</span>
    <span class="tt99-brand-math tt99-brand-math--sum" aria-hidden="true">a + b</span>
    <span class="tt99-brand-math tt99-brand-math--plus" aria-hidden="true">+</span>
    <span class="tt99-brand-math tt99-brand-math--99" aria-hidden="true">99</span>
    <span class="tt99-brand-math tt99-brand-math--divide" aria-hidden="true">÷</span>
    <div class="tt99-brand-dots" aria-hidden="true"></div>
    <svg class="tt99-brand-graph" viewBox="0 0 150 130" aria-hidden="true" focusable="false" fill="none"><path d="M18 106H134M40 118V18"/><path class="curve" d="M41 105 C65 105 80 99 91 88 C106 73 114 48 125 24"/></svg>
    <div class="tt99-brand-hero__mark"><img src="/assets/99club/images/99club-studio-shield.png" alt="99 Club achievement shield"></div>
    <div class="tt99-brand-hero__copy">
      <span class="tt99-eyebrow">Tech Tinker Club · Free classroom tool</span>
      <img class="tt99-brand-wordmark" src="/assets/99club/images/99club-studio-wordmark.png" alt="99 Club Studio — Maths for further progress">
      <h1 class="tt99-brand-page-title">${title}<span class="tt99-brand-page-note">${note}</span></h1>
    </div>
    <nav class="tt99-brand-tools" aria-label="99 Club Studio sections">
      ${tool('/tools/99-club/','99','99 Club')}
      ${alternate}
      ${tool('/tools/99-club/games/help/','?','Help & guide')}
      <button type="button" class="tt99-brand-tool tt99-brand-tool--contact" data-tt99-contact-open aria-haspopup="dialog"><span aria-hidden="true">✉</span>Contact</button>
      <button type="button" class="tt99-brand-tool tt99-brand-tool--support" data-tt99-kofi-open aria-haspopup="dialog"><img class="tt99-brand-kofi" src="/assets/99club/images/kofi-cup.png?v=19.4" alt="" aria-hidden="true">Buy me a coffee</button>
    </nav>`;
}
function enhancePrintable(){
  const root=document.getElementById('tt99-games-root'),hero=root?.querySelector('.tt99-games-hero');if(!hero||hero.dataset.family166==='1')return;
  hero.dataset.family166='1';hero.className='tt99-games-hero tt99-brand-hero tt99-brand-hero--print';hero.setAttribute('aria-label','99 Club Studio · Maths Games & Puzzles');hero.innerHTML=brandHero('print');
  window.TT99BannerActions?.enhance?.();
}
function optionSummary(){
  const host=document.getElementById('tt99-play-options');if(!host)return 'Default settings';
  const parts=[...host.querySelectorAll('label')].map(label=>{const name=label.querySelector('span')?.textContent?.trim(),sel=label.querySelector('select'),input=label.querySelector('input');const value=sel?.selectedOptions?.[0]?.textContent?.trim()||input?.value?.trim();return name&&value?`${name}: ${value}`:'';}).filter(Boolean);return parts.join(' · ')||'Default settings';
}
function refreshSummary(){
  const el=document.querySelector('.tt99-play-settings-summary'),summary=optionSummary();if(el&&el.textContent!==summary)el.textContent=summary;
  const meta=document.querySelector('.tt99-play-current-meta');if(meta){const difficulty=[...document.querySelectorAll('#tt99-play-options label')].find(l=>/^difficulty$/i.test(l.querySelector('span')?.textContent?.trim()||''))?.querySelector('select')?.selectedOptions?.[0]?.textContent?.trim();const mode=document.querySelector('[data-mode].is-active')?.dataset.mode;const html=`<span>${mode==='challenge'?'Challenge mode':'Relaxed mode'}</span>${difficulty?`<span>${esc(difficulty)}</span>`:''}`;if(meta.innerHTML!==html)meta.innerHTML=html;}
}
function wrapLibrary(){
  const lib=document.getElementById('tt99-play-library');if(!lib||lib.dataset.drawer166==='1')return;lib.dataset.drawer166='1';lib.classList.add('tt99-play-library--drawer');
  const panel=document.createElement('div');panel.className='tt99-play-library-panel';while(lib.firstChild)panel.appendChild(lib.firstChild);lib.appendChild(panel);
  lib.addEventListener('click',e=>{if(e.target===lib)document.getElementById('tt99-play-library-close')?.click();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!lib.hidden)document.getElementById('tt99-play-library-close')?.click();});
  const sync=()=>document.documentElement.classList.toggle('tt99-game-library-open',!lib.hidden);new MutationObserver(sync).observe(lib,{attributes:true,attributeFilter:['hidden']});sync();
}
function enhancePlay(){
  const root=document.getElementById('tt99-play-root'),hero=root?.querySelector('.tt99-play-hero');if(!root||!hero||hero.dataset.family166==='1')return;
  hero.dataset.family166='1';hero.className='tt99-play-hero tt99-brand-hero tt99-brand-hero--play';hero.setAttribute('aria-label','99 Club Studio · Play Online');hero.innerHTML=brandHero('play');
  window.TT99BannerActions?.enhance?.();
  const gamebar=root.querySelector('.tt99-play-gamebar'),setup=root.querySelector('.tt99-play-setup');if(gamebar&&setup&&!gamebar.parentElement.classList.contains('tt99-play-control-deck')){const deck=document.createElement('section');deck.className='tt99-play-control-deck';gamebar.before(deck);deck.append(gamebar,setup);}
  const current=root.querySelector('.tt99-play-current>div');if(current&&!current.querySelector('.tt99-play-current-meta'))current.insertAdjacentHTML('beforeend','<div class="tt99-play-current-meta"></div>');
  const change=document.getElementById('tt99-play-change-game');if(change&&change.textContent!=='Choose game')change.textContent='Choose game';
  const settings=root.querySelector('.tt99-play-settings');if(settings){settings.removeAttribute('open');const sum=settings.querySelector('summary');if(sum&&!sum.querySelector('.tt99-play-settings-summary'))sum.innerHTML='<span class="tt99-play-settings-label">Game options<span class="tt99-play-settings-summary"></span></span>';}
  wrapLibrary();refreshSummary();
  root.addEventListener('change',e=>{if(e.target.closest('#tt99-play-options'))setTimeout(refreshSummary,0);});root.addEventListener('click',e=>{if(e.target.closest('[data-mode]'))setTimeout(refreshSummary,0);});
  new MutationObserver(()=>{refreshSummary();wrapLibrary();}).observe(root,{childList:true,subtree:true});
}
function boot(){enhancePrintable();enhancePlay();const g=document.getElementById('tt99-games-root');if(g)new MutationObserver(enhancePrintable).observe(g,{childList:true,subtree:false});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();
