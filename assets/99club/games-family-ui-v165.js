/* 99 Club Studio · Games family UI v1.65 */
(function(){
'use strict';
const SUPPORT_URL='https://gofund.me/1a0aa29c7';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function heroIdentity(mode){return `<div class="tt99-family-hero__identity"><img src="/assets/99club/images/99club.png" alt="99 Club"><span><em class="tt99-family-hero__mode"><i class="tt99-family-hero__mode-icon">${mode==='play'?'▶':'▤'}</i>${mode==='play'?'Online play':'Printable games'}</em><strong>99 Club Studio</strong><small>${mode==='play'?'Interactive maths games and puzzles':'Printable maths games and puzzle packs'}</small></span></div>`;}
function enhancePrintable(){
  const root=document.getElementById('tt99-games-root'),hero=root?.querySelector('.tt99-games-hero');if(!hero||hero.dataset.family165==='1')return;
  hero.dataset.family165='1';hero.classList.add('tt99-family-hero','tt99-family-hero--print');
  const copy=hero.firstElementChild;if(copy)copy.classList.add('tt99-family-hero__copy');
  let nav=hero.querySelector('.tt99-games-nav');if(!nav){nav=document.createElement('nav');nav.className='tt99-games-nav';hero.appendChild(nav);}
  const side=document.createElement('div');side.className='tt99-family-hero__side';side.innerHTML=heroIdentity('print');
  if(nav.parentNode===hero){hero.removeChild(nav);side.appendChild(nav);}hero.appendChild(side);
  nav.innerHTML='';
  const links=[['99 Club','/tools/99-club/'],['Play online','/tools/99-club/games/play/'],['Help','/tools/99-club/games/help/']];
  for(const [label,href] of links){const a=document.createElement('a');a.href=href;a.textContent=label;nav.appendChild(a);}const support=document.createElement('a');support.href=SUPPORT_URL;support.target='_blank';support.rel='noopener';support.className='is-support';support.textContent='Support us';nav.appendChild(support);
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
  const lib=document.getElementById('tt99-play-library');if(!lib||lib.dataset.drawer165==='1')return;lib.dataset.drawer165='1';lib.classList.add('tt99-play-library--drawer');
  const panel=document.createElement('div');panel.className='tt99-play-library-panel';while(lib.firstChild)panel.appendChild(lib.firstChild);lib.appendChild(panel);
  lib.addEventListener('click',e=>{if(e.target===lib)document.getElementById('tt99-play-library-close')?.click();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!lib.hidden)document.getElementById('tt99-play-library-close')?.click();});
  const sync=()=>document.documentElement.classList.toggle('tt99-game-library-open',!lib.hidden);new MutationObserver(sync).observe(lib,{attributes:true,attributeFilter:['hidden']});sync();
}
function enhancePlay(){
  const root=document.getElementById('tt99-play-root'),hero=root?.querySelector('.tt99-play-hero');if(!root||!hero||hero.dataset.family165==='1')return;
  hero.dataset.family165='1';hero.classList.add('tt99-family-hero','tt99-family-hero--play');
  const copy=hero.firstElementChild;if(copy)copy.classList.add('tt99-family-hero__copy');
  let nav=hero.querySelector('nav');const side=document.createElement('div');side.className='tt99-family-hero__side';side.innerHTML=heroIdentity('play');if(nav){hero.removeChild(nav);side.appendChild(nav);}hero.appendChild(side);
  if(nav){nav.innerHTML='<a href="/tools/99-club/">99 Club</a><a href="/tools/99-club/games/">Printable games</a><a href="/tools/99-club/games/help/">Help</a>';const support=document.createElement('a');support.href=SUPPORT_URL;support.target='_blank';support.rel='noopener';support.className='is-support';support.textContent='Support us';nav.appendChild(support);}
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
