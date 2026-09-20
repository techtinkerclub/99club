(function(){
'use strict';
const PP=window.TT99ParentPractice,W=window.TT99SchoolWidget,Q=window.TT99QR;
if(!PP)return;
const CLUBS=[
 ['11','11 Club','11club.png'],['22','22 Club','22club.png'],['33','33 Club','33club.png'],['44','44 Club','44club.png'],['55','55 Club','55club.png'],
 ['66','66 Club','66club.png'],['77','77 Club','77club.png'],['88','88 Club','88club.png'],['99','99 Club','99club.png'],
 ['bronze','Bronze','bronzeclub.png'],['silver','Silver','silverclub.png'],['gold','Gold','goldclub.png'],['platinum','Platinum','platinumclub.png'],['diamond','Diamond','diamondclub.png']
];
const PACKS=[
 {title:'Year 4 arithmetic',summary:'Maze · Number Search · Operation Grid',minYear:4,maxYear:4,gameCount:3,link:'https://99studio.uk/practice/puzzles/#p=TT99GP1.eyJ2IjoxLCJzIjp7Im1pblllYXIiOjQsIm1heFllYXIiOjQsInRvcGljcyI6WyJjYWxjdWxhdGlvbiIsIm51bWJlcl9wbGFjZV92YWx1ZSJdLCJzaGVldHMiOjIsImFjdGl2aXRpZXNQZXJTaGVldCI6MiwiaW5jbHVkZUFuc3dlcnMiOnRydWUsIndvcmtlZEV4YW1wbGVzIjoibm9uZSIsInNlbGVjdGVkRW5naW5lcyI6WyJtYXplIiwibnVtYmVyc2VhcmNoIiwib3BlcmF0aW9uZ3JpZCJdLCJlbmdpbmVTZXR0aW5ncyI6e319fQ'},
 {title:'Upper KS2 number logic',summary:'Sudoku · Futoshiki · Sumplete · Shikaku',minYear:5,maxYear:6,gameCount:4,link:'https://99studio.uk/practice/puzzles/#p=TT99GP1.eyJ2IjoxLCJzIjp7Im1pblllYXIiOjUsIm1heFllYXIiOjYsInRvcGljcyI6WyJjYWxjdWxhdGlvbiIsIm51bWJlcl9wbGFjZV92YWx1ZSIsImdlb21ldHJ5Il0sInNoZWV0cyI6MiwiYWN0aXZpdGllc1BlclNoZWV0IjoyLCJpbmNsdWRlQW5zd2VycyI6dHJ1ZSwid29ya2VkRXhhbXBsZXMiOiJub25lIiwic2VsZWN0ZWRFbmdpbmVzIjpbInN1ZG9rdSIsImZ1dG9zaGlraSIsInN1bXBsZXRlIiwic2hpa2FrdSJdLCJlbmdpbmVTZXR0aW5ncyI6e319fQ'},
 {title:'Mixed maths challenge',summary:'Number Pyramid · Magic Square · Number Connections · Target Number',minYear:4,maxYear:6,gameCount:4,link:'https://99studio.uk/practice/puzzles/#p=TT99GP1.eyJ2IjoxLCJzIjp7Im1pblllYXIiOjQsIm1heFllYXIiOjYsInRvcGljcyI6WyJjYWxjdWxhdGlvbiIsIm51bWJlcl9wbGFjZV92YWx1ZSIsImdlb21ldHJ5Il0sInNoZWV0cyI6MiwiYWN0aXZpdGllc1BlclNoZWV0IjoyLCJpbmNsdWRlQW5zd2VycyI6dHJ1ZSwid29ya2VkRXhhbXBsZXMiOiJub25lIiwic2VsZWN0ZWRFbmdpbmVzIjpbInB5cmFtaWQiLCJtYWdpYyIsIm51bWJlcndoZWVscyIsInRhcmdldCJdLCJlbmdpbmVTZXR0aW5ncyI6e319fQ'}
];
const ONLINE=[['maze','Correct Answer Maze'],['sumplete','Sumplete'],['sudoku','Sudoku'],['numbertrail','Number Trail'],['balance','Balance Lab'],['colourlogic','Colour Logic']];

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function clubLink(id){const rules=PP.baseRules('classic',id);return PP.buildLink({schemeId:'classic',clubId:id,rules,orientation:'portrait'},location.origin);}
function badgeUrl(img){return location.origin+'/assets/99club/images/'+img;}
function genericCard(href,title,summary,img){
 return '<a class="demo-generic-card" href="'+esc(href)+'" target="_blank" rel="noopener" referrerpolicy="origin"><img src="'+esc(img||'/assets/99club/images/99club-studio-shield.png')+'" alt=""><span><strong>'+esc(title)+'</strong><small>'+esc(summary)+'</small></span><b class="demo-arrow" aria-hidden="true">→</b></a>';
}
function clubButton([id,name,img]){return '<a class="demo-button" href="'+esc(clubLink(id))+'" target="_blank" rel="noopener" referrerpolicy="origin"><img src="/assets/99club/images/'+img+'" alt="">'+esc(name)+'</a>';}
function renderButtons(){
 const core=document.getElementById('demo-club-buttons-core'),post=document.getElementById('demo-club-buttons-post'),all=document.getElementById('demo-club-buttons');
 if(core)core.innerHTML=CLUBS.slice(0,9).map(clubButton).join('');
 if(post)post.innerHTML=CLUBS.slice(9).map(clubButton).join('');
 if(all)all.innerHTML=CLUBS.map(clubButton).join('');
 const packs=document.getElementById('demo-pack-buttons');
 if(packs)packs.innerHTML=PACKS.map(p=>'<a class="demo-button demo-button--accent" href="'+esc(p.link)+'" target="_blank" rel="noopener" referrerpolicy="origin">'+esc(p.title)+'</a>').join('');
 const online=document.getElementById('demo-online-buttons');
 if(online)online.innerHTML=ONLINE.map(([id,name])=>'<a class="demo-button demo-button--play" href="/play/?game='+encodeURIComponent(id)+'" target="_blank" rel="noopener" referrerpolicy="origin">'+esc(name)+'</a>').join('');
}
function clubCard([id,name,img]){return PP.websiteCardHtml(clubLink(id),name,badgeUrl(img),'Fresh printable worksheet + answers');}
function renderCards(){
 const core=document.getElementById('demo-club-cards-core'),post=document.getElementById('demo-club-cards-post'),all=document.getElementById('demo-club-cards');
 if(core)core.innerHTML=CLUBS.slice(0,9).map(clubCard).join('');
 if(post)post.innerHTML=CLUBS.slice(9).map(clubCard).join('');
 if(all)all.innerHTML=CLUBS.map(clubCard).join('');
 const packs=document.getElementById('demo-pack-cards');
 if(packs)packs.innerHTML=PACKS.map(p=>genericCard(p.link,p.title,p.summary+' · fresh pack + answers')).join('');
 const online=document.getElementById('demo-online-cards');
 if(online)online.innerHTML=ONLINE.map(([id,name])=>genericCard('/play/?game='+encodeURIComponent(id),'Play '+name,'Interactive maths game · opens online')).join('');
}
function demoLogo(){
 try{
  const c=document.createElement('canvas');c.width=96;c.height=96;const x=c.getContext('2d');
  x.fillStyle='#243e80';x.beginPath();x.arc(48,48,45,0,Math.PI*2);x.fill();x.lineWidth=5;x.strokeStyle='#b9d64a';x.stroke();
  x.fillStyle='#fff';x.font='900 30px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText('AS',48,44);x.font='700 10px Arial';x.fillText('DEMO',48,66);
  return c.toDataURL('image/png');
 }catch(_){return '';}
}
function renderWidgets(){
 if(!W)return;
 const school={name:'Addington-on-Sum Primary School',logo:demoLogo()};
 const clubCfg=W.normalise({widgetType:'club',integrationId:'wid_generaldemo99c',school,schemeId:'classic',orientation:'portrait',selectedClubs:CLUBS.map(x=>x[0]),defaultTab:'clubs'});
 const gamesCfg=W.normalise({widgetType:'games',integrationId:'wid_generaldemogames',school,puzzles:PACKS.map(p=>({link:p.link,minYear:p.minYear,maxYear:p.maxYear,gameCount:p.gameCount,vocabCount:0})),games:ONLINE.map(x=>x[0]),defaultTab:'puzzles'});
 const club=document.getElementById('demo-club-widget'),games=document.getElementById('demo-games-widget');
 if(club)club.src=W.buildUrl(clubCfg,location.origin);
 if(games)games.src=W.buildUrl(gamesCfg,location.origin);
}
function renderQr(){
 const el=document.getElementById('demo-qr');if(!el||!Q)return;
 try{el.innerHTML=Q.svg(Q.make(location.href.split('#')[0]),{quiet:3,label:'Open this 99 Studio demonstration page'});}catch(_){}
}
function initTabs(){
 const tabs=[...document.querySelectorAll('[data-demo-tab]')],panels=[...document.querySelectorAll('[data-demo-panel]')];
 if(!tabs.length||!panels.length)return;
 function activate(id,focus){
  tabs.forEach(t=>{const on=t.dataset.demoTab===id;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;if(on&&focus)t.focus();});
  panels.forEach(p=>p.hidden=p.dataset.demoPanel!==id);
  try{history.replaceState(null,'','#'+id);}catch(_){}
 }
 const requested=String(location.hash||'').replace(/^#/,'');
 const initial=tabs.some(t=>t.dataset.demoTab===requested)?requested:'buttons';
 tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>activate(tab.dataset.demoTab,false));
  tab.addEventListener('keydown',e=>{
   if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
   e.preventDefault();const next=(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;activate(tabs[next].dataset.demoTab,true);
  });
 });
 activate(initial,false);
}
renderButtons();renderCards();renderWidgets();renderQr();initTabs();
})();