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

  function fitActivity(activity){
    if(!activity?.isConnected)return;
    const bodies=bodyChildren(activity);
    if(!bodies.length)return;

    setScale(activity,1);
    const ar=activity.getBoundingClientRect();
    const cs=getComputedStyle(activity);
    const padL=parseFloat(cs.paddingLeft)||0,padR=parseFloat(cs.paddingRight)||0;
    const padT=parseFloat(cs.paddingTop)||0,padB=parseFloat(cs.paddingBottom)||0;
    const innerW=Math.max(1,activity.clientWidth-padL-padR);
    const innerH=Math.max(1,activity.clientHeight-padT-padB);
    const innerLeft=ar.left+padL,innerRight=innerLeft+innerW,innerBottom=ar.top+padT+innerH;

    let bodyTop=Infinity,naturalBottom=-Infinity,naturalLeft=Infinity,naturalRight=-Infinity;
    for(const el of bodies){
      const r=el.getBoundingClientRect();
      if(!r.width&&!r.height)continue;
      bodyTop=Math.min(bodyTop,r.top);
      naturalBottom=Math.max(naturalBottom,r.top+Math.max(r.height,el.scrollHeight||0));
      naturalLeft=Math.min(naturalLeft,r.left);
      naturalRight=Math.max(naturalRight,r.left+Math.max(r.width,el.scrollWidth||0));
    }
    if(!Number.isFinite(bodyTop))return;

    const naturalH=Math.max(1,naturalBottom-bodyTop);
    const availableH=Math.max(1,innerBottom-bodyTop);
    const naturalW=Math.max(1,naturalRight-naturalLeft);
    let scale=Math.min(1,availableH/naturalH,innerW/naturalW);

    // Leave a tiny safety margin so borders/antialiasing never appear clipped.
    if(scale<.999)scale*=.985;
    scale=setScale(activity,scale);

    // Zoom changes flow dimensions. Re-check both layout overflow and the actual
    // painted body rectangle: some browsers report scroll metrics before zoomed
    // descendants have fully contributed to the visual overflow.
    for(let i=0;i<4;i++){
      const now=activity.getBoundingClientRect(),nowStyle=getComputedStyle(activity);
      const nowPadR=parseFloat(nowStyle.paddingRight)||0,nowPadB=parseFloat(nowStyle.paddingBottom)||0;
      const rightLimit=now.right-nowPadR,bottomLimit=now.bottom-nowPadB;
      let maxRight=-Infinity,maxBottom=-Infinity,minLeft=Infinity,minTop=Infinity;
      for(const el of bodies){
        const r=el.getBoundingClientRect();
        if(!r.width&&!r.height)continue;
        minLeft=Math.min(minLeft,r.left);minTop=Math.min(minTop,r.top);
        maxRight=Math.max(maxRight,r.right);maxBottom=Math.max(maxBottom,r.bottom);
      }
      const visualW=Number.isFinite(maxRight)?Math.max(1,maxRight-minLeft):1;
      const visualH=Number.isFinite(maxBottom)?Math.max(1,maxBottom-minTop):1;
      const availVisualW=Number.isFinite(minLeft)?Math.max(1,rightLimit-minLeft):visualW;
      const availVisualH=Number.isFinite(minTop)?Math.max(1,bottomLimit-minTop):visualH;
      const rwVisual=maxRight>rightLimit+1?availVisualW/visualW:1;
      const rhVisual=maxBottom>bottomLimit+1?availVisualH/visualH:1;
      const rwScroll=activity.scrollWidth>activity.clientWidth+1?activity.clientWidth/activity.scrollWidth:1;
      const rhScroll=activity.scrollHeight>activity.clientHeight+1?activity.clientHeight/activity.scrollHeight:1;
      const adjust=Math.min(1,rwVisual,rhVisual,rwScroll,rhScroll);
      if(adjust>=.999)break;
      scale=setScale(activity,scale*adjust*.978);
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

  global.TT99GamesPreviewFitV207={version:'2.07.1',refresh:schedule,fitActivity};
})(typeof globalThis!=='undefined'?globalThis:this);
