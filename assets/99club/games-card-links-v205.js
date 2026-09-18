/* 99 Club Studio · quick links on game selector cards v2.05
 * Adds direct "Play online" and "Guide" links to every game card without
 * disturbing the teacher's current pack-builder state.
 */
(function(global){
'use strict';

const root=document.getElementById('tt99-games-root');
const G=global.TT99Games;
if(!root||!G||root.dataset.cardLinksV205==='1')return;
root.dataset.cardLinksV205='1';

const LINK_IDS=[
  'wordsearch','crossword','pyramid','magic','arithmagon','magicshape','numbertrail','numberwheels',
  'maze','propertymaze','crossnumber','numbersearch','equationcrossgrid','target','brokencalc','operationgrid',
  'kakuro','arithmeticcages','sumplete','symbols','functionmachine','balance','alphametics','sudoku','futoshiki',
  'nonogram','numberpath','numbertowers','takuzu','killersudoku','hashi','mathsmines','shikaku','cornersum',
  'linkedsum','colourlogic','mobilebalance','diagonalpath','squaresearch','insertops','perimeterregions'
];
const supported=new Set(LINK_IDS);

function idForCard(card){
  const direct=card.querySelector('[data-engine-select]')?.dataset.engineSelect;
  if(direct)return direct;
  for(const key of ['v140Card','v143Card','v147Card']){
    const value=card.dataset?.[key];
    if(value)return value;
  }
  if(card.hasAttribute('data-v139-takuzu'))return 'takuzu';
  if(card.hasAttribute('data-v137-numbertowers'))return 'numbertowers';

  const checkbox=card.querySelector('input[type="checkbox"]');
  if(checkbox){
    for(const value of Object.values(checkbox.dataset||{})){
      if(typeof value==='string'&&supported.has(value))return value;
    }
  }

  const title=card.querySelector('.tt99-engine-include b')?.textContent?.trim();
  if(title){
    for(const id of LINK_IDS)if(G.ENGINES?.[id]?.title===title)return id;
  }
  return '';
}

function link(href,label,kind,id){
  const a=document.createElement('a');
  a.className='tt99-engine-quicklink '+kind;
  a.href=href;
  a.target='_blank';
  a.rel='noopener noreferrer';
  a.dataset.gameQuicklink=id;
  a.setAttribute('aria-label',label+' for '+(G.ENGINES?.[id]?.title||id)+' (opens in a new tab or window)');
  a.title='Opens without leaving this pack builder';
  a.textContent=label;
  return a;
}

function openSeparateContext(url){
  // Installed PWAs do not treat target="_blank" consistently. Handle the
  // navigation ourselves so the pack-builder window is never also navigated.
  global.open(url,'_blank','noopener,noreferrer');
}

function interceptQuicklink(e){
  const a=e.target.closest?.('.tt99-engine-quicklink');
  if(!a||!root.contains(a))return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation?.();
  openSeparateContext(a.href);
}

root.addEventListener('click',interceptQuicklink,true);

function enhanceCard(card){
  if(card.dataset.tt99Quicklinks==='1')return;
  const id=idForCard(card);
  if(!supported.has(id))return;

  const configure=card.querySelector('.tt99-engine-configure');
  if(!configure)return;

  const actions=document.createElement('div');
  actions.className='tt99-engine-card-actions';
  actions.append(
    link('/tools/99-club/games/play/?game='+encodeURIComponent(id),'▶ Play online','is-play',id),
    link('/tools/99-club/games/help/?guide='+encodeURIComponent(id),'? Guide','is-guide',id)
  );
  configure.insertAdjacentElement('beforebegin',actions);
  actions.appendChild(configure);
  card.dataset.tt99Quicklinks='1';
  card.dataset.tt99GameId=id;
}

function enhance(){
  root.querySelectorAll('.tt99-engine-card').forEach(enhanceCard);
}

let scheduled=false;
function schedule(){
  if(scheduled)return;
  scheduled=true;
  queueMicrotask(()=>{scheduled=false;enhance();});
}

new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
schedule();

global.TT99GameCardLinks={version:'2.05.2',ids:LINK_IDS.slice()};
})(typeof globalThis!=='undefined'?globalThis:this);
