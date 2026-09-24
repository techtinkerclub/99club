/* 99 Club Studio · Online Play app shell v1.0
 * Layout-only helper. It deliberately does not touch puzzle generation,
 * analytics/tracking, URLs, persistence or page metadata.
 */
(function(global){
  'use strict';
  const ROOT_ID='tt99-play-root';
  let root=null,board=null,boardWrap=null,observer=null,raf=0,resizeTimer=0;

  function schedule(fn){
    if(raf)cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{raf=0;fn();});
  }
  function setViewportHeight(){
    if(!root)return;
    const r=root.getBoundingClientRect(),top=Math.max(0,r.top);
    const h=Math.max(280,global.innerHeight-top-4);
    root.style.setProperty('--tt99-play-app-height',h+'px');
  }
  function fitBoard(){
    if(!root||!board||!boardWrap)return;
    board.style.transform='none';
    board.dataset.tt99AppScale='1';
    const availW=Math.max(1,boardWrap.clientWidth-4),availH=Math.max(1,boardWrap.clientHeight-4);
    const naturalW=Math.max(1,board.scrollWidth,board.offsetWidth);
    const naturalH=Math.max(1,board.scrollHeight,board.offsetHeight);
    let scale=Math.min(1,availW/naturalW,availH/naturalH);
    if(!Number.isFinite(scale)||scale<=0)scale=1;
    // Avoid microscopic controls. The compact shell is designed so most games
    // need little or no scaling; this is only the final containment guard.
    scale=Math.max(.66,scale);
    board.dataset.tt99AppScale=scale.toFixed(3);
    board.style.transform=scale<.999?'scale('+scale+')':'none';
  }
  function refit(){
    setViewportHeight();
    schedule(fitBoard);
  }
  function closeSettings(){
    const d=root?.querySelector('.tt99-play-settings');
    if(d)d.open=false;
  }
  function moveHeroNav(){
    const hero=root?.querySelector('.tt99-play-hero'),nav=hero?.querySelector('nav'),actions=root?.querySelector('.tt99-play-gamebar-actions');
    if(hero)hero.classList.add('is-app-hidden');
    if(nav&&actions&&!nav.dataset.tt99AppMoved){
      nav.dataset.tt99AppMoved='1';
      nav.classList.add('tt99-play-app-nav');
      actions.insertBefore(nav,actions.firstChild);
    }
  }
  function bind(){
    const details=root?.querySelector('.tt99-play-settings');
    details?.addEventListener('toggle',()=>setTimeout(refit,0));
    root?.addEventListener('click',e=>{
      const t=e.target;
      if(details?.open&&!t.closest?.('.tt99-play-settings'))details.open=false;
      if(t.closest?.('#tt99-play-new,#tt99-play-surprise,.tt99-play-game-card'))setTimeout(refit,40);
      if(t.closest?.('#tt99-play-change-game')&&details?.open)details.open=false;
    });
    global.addEventListener('resize',()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(refit,60);
    },{passive:true});
    global.visualViewport?.addEventListener?.('resize',()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(refit,60);
    },{passive:true});
  }
  function observeBoard(){
    if(!board)return;
    observer?.disconnect();
    observer=new MutationObserver(()=>setTimeout(fitBoard,0));
    observer.observe(board,{childList:true,subtree:true});
  }
  function init(){
    root=document.getElementById(ROOT_ID);
    if(!root||root.dataset.appShell==='1')return;
    const shell=root.querySelector('.tt99-play-shell');
    if(!shell){setTimeout(init,25);return;}
    board=document.getElementById('tt99-play-board');
    boardWrap=root.querySelector('.tt99-play-board-wrap');
    document.documentElement.classList.add('tt99-play-app-shell');
    document.body?.classList.add('tt99-play-app-shell');
    root.dataset.appShell='1';
    moveHeroNav();
    closeSettings();
    bind();
    observeBoard();
    refit();
    setTimeout(refit,80);
    setTimeout(refit,260);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});
  else setTimeout(init,0);

  global.TT99PlayAppShell={version:'1.0',refit:()=>{if(root)refit();},fitBoard:()=>{if(board)fitBoard();}};
})(window);
