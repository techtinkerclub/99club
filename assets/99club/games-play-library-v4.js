/* 99 Club Studio · grouped online game library v5.0 */
(function(global){
'use strict';
function boot(){
  const Play=global.TT99GamesPlay,library=document.getElementById('tt99-play-library'),grid=document.getElementById('tt99-play-library-grid');
  if(!Play||!library||!grid||library.dataset.groupedV5==='1')return;
  library.dataset.groupedV5='1';

  const GROUPS=[
    ['arithmetic','Arithmetic & calculation'],
    ['number','Number & patterns'],
    ['algebra','Algebra & relationships'],
    ['geometry','Geometry & measurement'],
    ['logic','Logic & grids'],
    ['vocabulary','Vocabulary & language']
  ];
  const MAP={
    sumplete:'arithmetic',cornersum:'arithmetic',linkedsum:'arithmetic',killersudoku:'logic',kakuro:'arithmetic',arithmeticcages:'arithmetic',
    brokencalc:'arithmetic',target:'arithmetic',operationgrid:'arithmetic',maze:'arithmetic',crossnumber:'arithmetic',arithmagon:'arithmetic',
    pyramid:'number',numberwheels:'number',numbersearch:'arithmetic',equationcrossgrid:'arithmetic',
    squaresearch:'arithmetic',insertops:'arithmetic',
    symbols:'algebra',functionmachine:'algebra',balance:'algebra',mobilebalance:'algebra',
    magic:'number',magicshape:'number',alphametics:'algebra',numbertrail:'number',propertymaze:'number',diagonalpath:'number',
    sudoku:'logic',futoshiki:'logic',takuzu:'logic',numberpath:'logic',nonogram:'logic',mathsmines:'logic',hashi:'logic',colourlogic:'logic',
    shikaku:'geometry',perimeterregions:'geometry',
    wordsearch:'vocabulary',crossword:'vocabulary'
  };
  const labelFor=a=>{
    if(MAP[a.id])return MAP[a.id];
    const cat=String(a.category||'').toLowerCase();
    if(cat.includes('vocab'))return 'vocabulary';
    if(cat.includes('geometry')||cat.includes('measure'))return 'geometry';
    if(cat.includes('algebra')||cat.includes('relationship'))return 'algebra';
    if(cat.includes('arithmetic')||cat.includes('calculation'))return 'arithmetic';
    if(cat.includes('logic'))return 'logic';
    return 'number';
  };
  const idToGroup=new Map(Play.gameList.map(a=>[a.id,labelFor(a)]));
  let observer=null,working=false;

  function regroup(){
    if(working)return;
    working=true;
    observer?.disconnect();
    try{
      const cards=[...grid.querySelectorAll(':scope > [data-game-id]')];
      if(!cards.length){
        if(grid.querySelector('.tt99-play-library-group'))return;
        if(!grid.querySelector('.tt99-play-empty,.tt99-play-filter-empty'))grid.innerHTML='<p class="tt99-play-empty">No games match that search.</p>';
        return;
      }
      const q=(document.getElementById('tt99-play-library-search')?.value||'').trim();
      const frag=document.createDocumentFragment();
      for(const [id,label] of GROUPS){
        const members=cards.filter(card=>(idToGroup.get(card.dataset.gameId)||'number')===id);
        if(!members.length)continue;
        const details=document.createElement('details');
        details.className='tt99-play-library-group';
        details.dataset.libraryGroup=id;
        details.open=!!q||members.some(c=>c.classList.contains('is-active'))||id==='arithmetic';
        const summary=document.createElement('summary');
        summary.innerHTML='<span>'+label+' <b>'+members.length+'</b></span>';
        const body=document.createElement('div');
        body.className='tt99-play-library-group-body';
        members.forEach(card=>body.appendChild(card));
        details.append(summary,body);
        frag.appendChild(details);
      }
      grid.innerHTML='';
      grid.classList.add('tt99-library-grouped');
      grid.appendChild(frag);
    }finally{
      working=false;
      observer?.observe(grid,{childList:true});
    }
  }

  observer=new MutationObserver(()=>queueMicrotask(regroup));
  observer.observe(grid,{childList:true});
  const search=document.getElementById('tt99-play-library-search');
  search?.addEventListener('input',()=>queueMicrotask(regroup));
  regroup();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else setTimeout(boot,0);
})(typeof globalThis!=='undefined'?globalThis:this);
