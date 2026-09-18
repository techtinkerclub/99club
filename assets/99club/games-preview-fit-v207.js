/* 99 Club Studio · printable preview body fitter v2.07
 * Keeps every generated puzzle body inside its allocated A4 activity rectangle.
 * Headings/instructions retain their normal size; only the puzzle body is reduced
 * when its rendered dimensions would otherwise overflow.
 */
(function(global){
  'use strict';
  const root=document.getElementById('tt99-games-root');
  if(!root)return;

  const MIN_SCALE=.42;
  let raf=0, fitting=false;

  function bodyChildren(activity){
    return [...activity.children].filter(el=>
      !el.classList.contains('tt99-replace-activity') &&
      !el.classList.contains('tt99-game-activity-head') &&
      !el.classList.contains('tt99-game-instruction')
    );
  }

  function setScale(activity,scale){
    const s=Math.max(MIN_SCALE,Math.min(1,Number(scale)||1));
    activity.dataset.tt99PreviewFit='1';
    activity.style.setProperty('--tt99-preview-body-scale',String(s));
    activity.dataset.previewBodyScale=s.toFixed(4);
    activity.toggleAttribute('data-preview-fit-warning',s<.62);
    return s;
  }

  function visualBounds(bodies){
    let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
    for(const body of bodies){
      const nodes=[body,...body.querySelectorAll('*')];
      for(const el of nodes){
        if(el.matches?.('.tt99-preview-replace'))continue;
        const style=getComputedStyle(el);
        if(style.display==='none'||style.visibility==='hidden')continue;
        const r=el.getBoundingClientRect();
        if(r.width<.5&&r.height<.5)continue;
        left=Math.min(left,r.left);top=Math.min(top,r.top);
        right=Math.max(right,r.right);bottom=Math.max(bottom,r.bottom);
      }
    }
    return Number.isFinite(left)?{left,top,right,bottom,width:Math.max(1,right-left),height:Math.max(1,bottom-top)}:null;
  }

  function fitActivity(activity){
    if(!activity?.isConnected)return;
    const bodies=bodyChildren(activity);
    if(!bodies.length)return;

    let scale=setScale(activity,1);
    const ar=activity.getBoundingClientRect();
    const cs=getComputedStyle(activity);
    const padL=parseFloat(cs.paddingLeft)||0,padR=parseFloat(cs.paddingRight)||0;
    const padT=parseFloat(cs.paddingTop)||0,padB=parseFloat(cs.paddingBottom)||0;
    const limits={
      left:ar.left+padL,
      right:ar.right-padR,
      top:ar.top+padT,
      bottom:ar.bottom-padB
    };

    for(let i=0;i<5;i++){
      const b=visualBounds(bodies);
      if(!b)return;
      const overLeft=Math.max(0,limits.left-b.left);
      const overRight=Math.max(0,b.right-limits.right);
      const overTop=Math.max(0,limits.top-b.top);
      const overBottom=Math.max(0,b.bottom-limits.bottom);
      if(overLeft<=1&&overRight<=1&&overTop<=1&&overBottom<=1)break;

      const availableW=Math.max(1,(limits.right-limits.left)-Math.max(0,b.left-limits.left));
      const availableH=Math.max(1,limits.bottom-Math.max(b.top,limits.top));
      const rw=(overLeft>1||overRight>1)?availableW/b.width:1;
      const rh=(overTop>1||overBottom>1)?availableH/b.height:1;
      const adjust=Math.min(1,rw,rh);
      if(adjust>=.999)break;
      scale=setScale(activity,scale*adjust*.985);
    }
  }

  function scan(){
    if(fitting)return;
    fitting=true;
    try{
      root.querySelectorAll('.tt99-game-paper .tt99-game-activity').forEach(fitActivity);
    }finally{fitting=false;}
  }

  function schedule(){
    if(raf)return;
    raf=requestAnimationFrame(()=>{raf=0;scan();});
  }

  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  if(global.ResizeObserver){
    const ro=new ResizeObserver(schedule);
    ro.observe(root);
  }
  global.addEventListener?.('resize',schedule,{passive:true});
  global.addEventListener?.('load',schedule,{once:true});
  if(document.fonts?.ready)document.fonts.ready.then(schedule).catch(()=>{});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();

  global.TT99GamesPreviewFitV207={version:'2.08',refresh:schedule,fitActivity};
})(typeof globalThis!=='undefined'?globalThis:this);
