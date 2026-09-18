/* 99 Club Studio · online game library filters v3 */
(function(global){
'use strict';
function boot(){const Play=global.TT99GamesPlay,library=document.getElementById('tt99-play-library'),grid=document.getElementById('tt99-play-library-grid');if(!Play||!library||!grid||library.dataset.filtersV3==='1')return;library.dataset.filtersV3='1';
  const GROUPS=[['all','All'],['arithmetic','Arithmetic'],['number','Number logic'],['visual','Visual logic'],['vocabulary','Vocabulary']],MAP={sumplete:'arithmetic',cornersum:'arithmetic',linkedsum:'arithmetic',killersudoku:'arithmetic',takuzu:'number',sudoku:'number',futoshiki:'number',numberpath:'number',nonogram:'visual',mathsmines:'visual',hashi:'visual',shikaku:'visual',wordsearch:'vocabulary'};let active='all';
  const counts=Object.fromEntries(GROUPS.map(([id])=>[id,0]));for(const a of Play.gameList){counts.all++;counts[MAP[a.id]||'number']=(counts[MAP[a.id]||'number']||0)+1;}
  const bar=document.createElement('div');bar.className='tt99-play-library-filters';bar.setAttribute('aria-label','Filter game library');bar.innerHTML=GROUPS.map(([id,label])=>`<button type="button" data-library-filter="${id}" class="${id==='all'?'is-active':''}">${label} <span>${counts[id]||0}</span></button>`).join('');grid.parentNode.insertBefore(bar,grid);
  function apply(){let shown=0;grid.querySelectorAll('[data-game-id]').forEach(card=>{const ok=active==='all'||(MAP[card.dataset.gameId]||'number')===active;card.hidden=!ok;if(ok)shown++;});let empty=grid.querySelector('.tt99-play-filter-empty');if(!shown){if(!empty){empty=document.createElement('p');empty.className='tt99-play-filter-empty';grid.appendChild(empty);}empty.textContent='No games in this filter match the current search.';}else empty?.remove();}
  bar.addEventListener('click',e=>{const b=e.target.closest('[data-library-filter]');if(!b)return;active=b.dataset.libraryFilter;bar.querySelectorAll('button').forEach(x=>x.classList.toggle('is-active',x===b));apply();});
  new MutationObserver(apply).observe(grid,{childList:true});apply();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else setTimeout(boot,0);
})(typeof globalThis!=='undefined'?globalThis:this);
