(function(){
'use strict';
const root=document.getElementById('tt99-widget-root'),W=window.TT99SchoolWidget,SU=window.TT99SchoolUsage;
if(!root||!W)return;

const badge={11:'11club.png',22:'22club.png',33:'33club.png',44:'44club.png',55:'55club.png',66:'66club.png',77:'77club.png',88:'88club.png',99:'99club.png',bronze:'bronzeclub.png',silver:'silverclub.png',gold:'goldclub.png',platinum:'platinumclub.png',diamond:'diamondclub.png'};
const names={11:'11 Club',22:'22 Club',33:'33 Club',44:'44 Club',55:'55 Club',66:'66 Club',77:'77 Club',88:'88 Club',99:'99 Club',bronze:'Bronze',silver:'Silver',gold:'Gold',platinum:'Platinum',diamond:'Diamond'};

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fail(message){root.innerHTML='<div class="ttw-error"><strong>This maths-practice widget could not be opened.</strong><span>'+esc(message)+'</span></div>';}
function token(){return W.tokenFromText(decodeURIComponent(location.hash||''));}
function fallbackIntegrationId(text){
  let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  return 'wid_'+h.toString(36).padStart(8,'0');
}
function withVia(url,integrationId){
  try{
    const u=new URL(url,location.origin);
    if(integrationId)u.searchParams.set('via',integrationId);
    return u.href;
  }catch(_){return url;}
}
let rawToken='',cfg;
try{
  rawToken=token();
  if(!rawToken)throw new Error('The widget configuration is missing.');
  cfg=W.decode(rawToken);
}catch(err){fail(err?.message||'Invalid widget configuration.');return;}
const integrationId=cfg.integrationId||fallbackIntegrationId(rawToken);
const sourceOrigin=SU?.referrerOrigin?.()||'';
const widgetContext={
  schoolName:cfg.school?.name||'',
  sourceOrigin,
  integrationId,
  widgetType:cfg.widgetType,
  clubCount:cfg.selectedClubs?.length||0,
  puzzlePackCount:cfg.puzzles?.length||0,
  onlineGameCount:cfg.games?.length||0
};
if(sourceOrigin){
  SU?.trackWidget?.('widget_open',widgetContext);
}

const isClub=cfg.widgetType==='club',isGames=cfg.widgetType==='games';
const title=isClub?'99 Club home practice':isGames?'Maths games & puzzles':'Maths home practice';
const schoolName=cfg.school?.name||'';
const logo=cfg.school?.logo||'/assets/99club/images/99club-studio-shield.png';
const panels=[];
if((isClub||cfg.widgetType==='combined')&&cfg.selectedClubs.length)panels.push(['clubs','99 Club']);
if((isGames||cfg.widgetType==='combined')&&cfg.puzzles.length)panels.push(['puzzles','Printable puzzles']);
if((isGames||cfg.widgetType==='combined')&&cfg.games.length)panels.push(['games','Play online']);
if(!panels.length){fail('This widget does not contain any activities.');return;}
const defaultTab=panels.some(x=>x[0]===cfg.defaultTab)?cfg.defaultTab:panels[0][0];

const clubHtml=cfg.selectedClubs.map(id=>{
  const href=withVia(W.clubLink(cfg,id,location.origin),integrationId),img=badge[id]||'99club-studio-shield.png';
  return '<a class="ttw-club" data-widget-item="club" data-widget-id="'+esc(id)+'" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer"><img src="/assets/99club/images/'+esc(img)+'" alt=""><strong>'+esc(names[id]||id)+'</strong><small>Fresh worksheet + answers</small></a>';
}).join('');
const puzzleHtml=cfg.puzzles.map(p=>{
  const year=p.minYear===p.maxYear?'Year '+p.minYear:'Years '+p.minYear+'–'+p.maxYear;
  const vocab=p.vocabCount?' · '+p.vocabCount+' school vocab entr'+(p.vocabCount===1?'y':'ies'):'';
  const href=withVia(p.link,integrationId);
  const packId='pack_'+(cfg.puzzles.indexOf(p)+1);
  return '<a class="ttw-feature" data-widget-item="puzzle" data-widget-id="'+esc(packId)+'" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer"><img src="/assets/99club/images/99club-studio-shield.png" alt=""><span><strong>'+esc(year)+' puzzle pack</strong><small>'+esc(p.gameCount)+' selected game'+(p.gameCount===1?'':'s')+vocab+' · fresh pack + answers</small></span><b class="ttw-arrow" aria-hidden="true">→</b></a>';
}).join('');
const gameHtml=cfg.games.map(id=>'<a class="ttw-game" data-widget-item="online_game" data-widget-id="'+esc(id)+'" href="/play/?game='+encodeURIComponent(id)+'&via='+encodeURIComponent(integrationId)+'" target="_blank" rel="noopener noreferrer"><span class="ttw-play" aria-hidden="true">▶</span><span>'+esc(W.GAME_TITLES[id]||id)+'</span></a>').join('');

const showTabs=panels.length>1;
root.innerHTML='<section class="ttw-shell ttw-shell--'+esc(cfg.widgetType)+'" aria-label="'+esc(title)+'">'+
  '<div class="ttw-head"><img class="ttw-school-logo" src="'+esc(logo)+'" alt=""><div><h1>'+esc(schoolName||title)+'</h1><p>'+esc(schoolName?title:title==='Maths home practice'?'School-selected practice':'School-selected '+title.toLowerCase())+' · No account is needed.</p></div></div>'+
  (showTabs?'<div class="ttw-tabs" role="tablist" aria-label="Practice types">'+panels.map(([id,label])=>'<button class="ttw-tab" role="tab" id="ttw-tab-'+id+'" aria-controls="ttw-panel-'+id+'" aria-selected="'+String(id===defaultTab)+'">'+esc(label)+'</button>').join('')+'</div>':'')+
  (((isClub||cfg.widgetType==='combined')&&cfg.selectedClubs.length)?'<div class="ttw-panel" id="ttw-panel-clubs" role="tabpanel" '+(showTabs?'aria-labelledby="ttw-tab-clubs" ':'')+(defaultTab==='clubs'?'':'hidden')+'><div class="ttw-intro"><h2>99 Club practice</h2><p>Choose the level your child is working on.</p></div><div class="ttw-clubs">'+clubHtml+'</div></div>':'')+
  (((isGames||cfg.widgetType==='combined')&&cfg.puzzles.length)?'<div class="ttw-panel" id="ttw-panel-puzzles" role="tabpanel" '+(showTabs?'aria-labelledby="ttw-tab-puzzles" ':'')+(defaultTab==='puzzles'?'':'hidden')+'><div class="ttw-intro"><h2>Printable puzzle packs</h2><p>Each download makes a fresh pack and answers.</p></div><div class="ttw-features">'+puzzleHtml+'</div></div>':'')+
  (((isGames||cfg.widgetType==='combined')&&cfg.games.length)?'<div class="ttw-panel" id="ttw-panel-games" role="tabpanel" '+(showTabs?'aria-labelledby="ttw-tab-games" ':'')+(defaultTab==='games'?'':'hidden')+'><div class="ttw-intro"><h2>Play online</h2><p>Games open in a new tab.</p></div><div class="ttw-games">'+gameHtml+'</div></div>':'')+
  '<div class="ttw-foot"><span>School-selected practice · powered by 99 Club Studio</span><a href="/privacy/" target="_blank" rel="noopener">Privacy</a></div></section>';

root.querySelectorAll('[data-widget-item]').forEach(link=>link.addEventListener('click',()=>{
  if(sourceOrigin)SU?.trackWidget?.('widget_item_open',{
    ...widgetContext,
    itemType:link.dataset.widgetItem||'unknown',
    itemId:link.dataset.widgetId||'unknown'
  });
}));

if(showTabs){
  const tabs=[...root.querySelectorAll('[role="tab"]')],shown=[...root.querySelectorAll('[role="tabpanel"]')];
  function activate(tab){
    const id=tab.getAttribute('aria-controls');
    tabs.forEach(t=>t.setAttribute('aria-selected',String(t===tab)));
    shown.forEach(p=>p.hidden=p.id!==id);
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>activate(tab));
    tab.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
      e.preventDefault();
      const next=(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      tabs[next].focus();activate(tabs[next]);
    });
  });
}
})();