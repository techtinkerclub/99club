/* 99 Club Studio · Online Play safe viewport measurement v2.0
 * Measures the real space below the play stage top (including the live site
 * header) and exposes a CSS size variable. It never locks page scrolling and
 * never transforms/scales the board.
 */
(function(global){
'use strict';
let root=null,stage=null,board=null,raf=0,observer=null;

function measure(){
  if(!root||!stage)return;
  const viewport=global.visualViewport?.height||global.innerHeight||0;
  const top=stage.getBoundingClientRect().top;
  const available=Math.max(280,viewport-top-8);
  // Leave room inside the board card for progress + the single instruction
  // block + card/wrap padding. Square boards can use the remainder directly.
  const square=Math.max(260,available-105);
  root.style.setProperty('--tt99-stage-available',available+'px');
  root.style.setProperty('--tt99-square-fit',square+'px');
}
function schedule(){
  if(raf)cancelAnimationFrame(raf);
  raf=requestAnimationFrame(()=>{raf=0;measure();});
}
function bind(){
  root=document.getElementById('tt99-play-root');
  if(!root)return;
  stage=root.querySelector('.tt99-play-stage');
  board=document.getElementById('tt99-play-board');
  if(!stage){setTimeout(bind,30);return;}
  global.addEventListener('resize',schedule,{passive:true});
  global.visualViewport?.addEventListener?.('resize',schedule,{passive:true});
  const settings=root.querySelector('.tt99-play-settings');
  settings?.addEventListener('toggle',()=>setTimeout(schedule,0));
  if(board&&global.MutationObserver){
    observer=new MutationObserver(schedule);
    observer.observe(board,{attributes:true,attributeFilter:['class'],childList:true});
  }
  root.addEventListener('click',e=>{
    if(e.target.closest?.('#tt99-play-change-game,#tt99-play-surprise,#tt99-play-new,.tt99-play-game-card'))setTimeout(schedule,40);
  });
  schedule();
  setTimeout(schedule,80);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else setTimeout(bind,0);
global.TT99PlaySafeFit={version:'2.0',refit:schedule};
})(window);
