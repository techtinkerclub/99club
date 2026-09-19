(function(){
'use strict';
const root=document.getElementById('tt99-widget-root'),W=window.TT99SchoolWidget;
if(!root||!W)return;
const badge={11:'11club.png',22:'22club.png',33:'33club.png',44:'44club.png',55:'55club.png',66:'66club.png',77:'77club.png',88:'88club.png',99:'99club.png',bronze:'bronzeclub.png',silver:'silverclub.png',gold:'goldclub.png',platinum:'platinumclub.png',diamond:'diamondclub.png'};
const names={11:'11 Club',22:'22 Club',33:'33 Club',44:'44 Club',55:'55 Club',66:'66 Club',77:'77 Club',88:'88 Club',99:'99 Club',bronze:'Bronze',silver:'Silver',gold:'Gold',platinum:'Platinum',diamond:'Diamond'};
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fail(message){root.innerHTML='<div class="ttw-error"><strong>This maths-practice widget could not be opened.</strong><span>'+esc(message)+'</span></div>';}
function token(){return W.tokenFromText(decodeURIComponent(location.hash||''));}
let cfg;try{const t=token();if(!t)throw new Error('The widget configuration is missing.');cfg=W.decode(t);}catch(err){fail(err?.message||'Invalid widget configuration.');return;}
const panels=[];
if(cfg.selectedClubs.length)panels.push(['clubs','99 Club']);
if(cfg.puzzles.length)panels.push(['puzzles','Printable puzzles']);
if(cfg.games.length)panels.push(['games','Play online']);
if(!panels.length){fail('This widget does not contain any activities.');return;}
const defaultTab=panels.some(x=>x[0]===cfg.defaultTab)?cfg.defaultTab:panels[0][0];
const clubHtml=cfg.selectedClubs.map(id=>{
 const href=W.clubLink(cfg,id,location.origin),img=badge[id]||'99club-studio-shield.png';
 return '<a class="ttw-club" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer"><img src="/assets/99club/images/'+esc(img)+'" alt=""><strong>'+esc(names[id]||id)+'</strong><small>Practice</small></a>';
}).join('');
const puzzleHtml=cfg.puzzles.map(p=>{
 const year=p.minYear===p.maxYear?'Year '+p.minYear:'Years '+p.minYear+'–'+p.maxYear;
 return '<a class="ttw-feature" href="'+esc(p.link)+'" target="_blank" rel="noopener noreferrer"><img src="/assets/99club/images/99club-studio-shield.png" alt=""><span><strong>'+esc(year)+' puzzle pack</strong><small>'+esc(p.gameCount)+' selected game'+(p.gameCount===1?'':'s')+' · fresh pack + answers</small></span><b class="ttw-arrow" aria-hidden="true">→</b></a>';
}).join('');
const gameHtml=cfg.games.map(id=>'<a class="ttw-game" href="/play/?game='+encodeURIComponent(id)+'" target="_blank" rel="noopener noreferrer"><span class="ttw-play" aria-hidden="true">▶</span><span>'+esc(W.GAME_TITLES[id]||id)+'</span></a>').join('');
root.innerHTML='<section class="ttw-shell" aria-label="Maths home practice"><div class="ttw-head"><img src="/assets/99club/images/99club-studio-shield.png" alt=""><div><h1>Maths home practice</h1><p>School-selected practice. No account is needed.</p></div></div><div class="ttw-tabs" role="tablist" aria-label="Practice types">'+panels.map(([id,label])=>'<button class="ttw-tab" role="tab" id="ttw-tab-'+id+'" aria-controls="ttw-panel-'+id+'" aria-selected="'+String(id===defaultTab)+'">'+esc(label)+'</button>').join('')+'</div>'+
(cfg.selectedClubs.length?'<div class="ttw-panel" id="ttw-panel-clubs" role="tabpanel" aria-labelledby="ttw-tab-clubs" '+(defaultTab==='clubs'?'':'hidden')+'><div class="ttw-intro"><h2>99 Club practice</h2><p>Choose the level your child is working on.</p></div><div class="ttw-clubs">'+clubHtml+'</div></div>':'')+
(cfg.puzzles.length?'<div class="ttw-panel" id="ttw-panel-puzzles" role="tabpanel" aria-labelledby="ttw-tab-puzzles" '+(defaultTab==='puzzles'?'':'hidden')+'><div class="ttw-intro"><h2>Printable puzzle packs</h2><p>Each download makes a fresh pack and answers.</p></div><div class="ttw-features">'+puzzleHtml+'</div></div>':'')+
(cfg.games.length?'<div class="ttw-panel" id="ttw-panel-games" role="tabpanel" aria-labelledby="ttw-tab-games" '+(defaultTab==='games'?'':'hidden')+'><div class="ttw-intro"><h2>Play online</h2><p>Games open in a new tab.</p></div><div class="ttw-games">'+gameHtml+'</div></div>':'')+
'<div class="ttw-foot"><span>Powered by 99 Club Studio</span><a href="/privacy/" target="_blank" rel="noopener">Privacy</a></div></section>';
const tabs=[...root.querySelectorAll('[role="tab"]')],shown=[...root.querySelectorAll('[role="tabpanel"]')];
function activate(tab){tabs.forEach(t=>t.setAttribute('aria-selected',String(t===tab)));shown.forEach(p=>p.hidden=p.id!=='ttw-panel-'+tab.getAttribute('aria-controls').replace('ttw-panel-',''));}
tabs.forEach((tab,i)=>{
 tab.addEventListener('click',()=>{const id=tab.getAttribute('aria-controls');tabs.forEach(t=>t.setAttribute('aria-selected',String(t===tab)));shown.forEach(p=>p.hidden=p.id!==id);});
 tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const next=(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();tabs[next].click();});
});
})();