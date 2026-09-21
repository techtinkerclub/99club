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

  function fitSumGrid(activity){
    const wrap=activity.querySelector(':scope > .tt99-sumgrid-wrap');
    const stage=wrap?.querySelector(':scope > .tt99-sumgrid-stage');
    const board=stage?.querySelector(':scope > .tt99-sumgrid-board');
    if(!wrap||!stage||!board)return false;
    const twoPerPage=!!activity.closest('.tt99-game-activities.count-2');
    const threePerPage=!!activity.closest('.tt99-game-activities.count-3');
    const size=threePerPage?145:(twoPerPage?190:210);

    activity.dataset.tt99PreviewFit='sumgrid';
    activity.style.setProperty('--tt99-preview-body-scale','1');
    activity.dataset.previewBodyScale='1.0000';

    wrap.style.setProperty('zoom','1','important');
    wrap.style.setProperty('transform','none','important');
    wrap.style.setProperty('width','100%','important');
    stage.style.setProperty('zoom','1','important');
    stage.style.setProperty('transform','none','important');
    stage.style.setProperty('width',size+'px','important');
    stage.style.setProperty('height',size+'px','important');
    stage.style.setProperty('aspect-ratio','1 / 1','important');
    board.style.setProperty('width','100%','important');
    board.style.setProperty('height','100%','important');
    board.style.setProperty('grid-template-columns','repeat(3,minmax(0,1fr))','important');
    board.style.setProperty('grid-template-rows','repeat(3,minmax(0,1fr))','important');

    const clueSize=Math.max(26,Math.min(32,size*.158));
    stage.querySelectorAll(':scope > .tt99-sumgrid-clue').forEach((el,i)=>{
      el.style.setProperty('width',clueSize+'px','important');
      el.style.setProperty('height',clueSize+'px','important');
      const x=(i%2?2:1)*size/3,y=(i<2?1:2)*size/3;
      el.style.setProperty('left',x+'px','important');
      el.style.setProperty('top',y+'px','important');
      el.style.setProperty('transform','translate(-50%,-50%)','important');
    });
    return true;
  }

  function fitMaze(activity){
    const layout=activity.querySelector(':scope > .tt99-maze-layout');
    const grid=layout?.querySelector(':scope > .tt99-maze-grid');
    const questions=layout?.querySelector(':scope > .tt99-maze-questions');
    if(!layout||!grid||!questions)return false;
    const twoPerPage=!!activity.closest('.tt99-game-activities.count-2');
    const threePerPage=!!activity.closest('.tt99-game-activities.count-3');
    const size=threePerPage?150:(twoPerPage?235:285);

    activity.dataset.tt99PreviewFit='maze';
    activity.style.setProperty('--tt99-preview-body-scale','1');
    activity.dataset.previewBodyScale='1.0000';

    layout.style.setProperty('zoom','1','important');
    layout.style.setProperty('transform','none','important');
    layout.style.setProperty('display','grid','important');
    layout.style.setProperty('grid-template-columns',size+'px minmax(0,1fr)','important');
    layout.style.setProperty('gap',threePerPage?'8px':'12px','important');
    layout.style.setProperty('align-items','center','important');
    layout.style.setProperty('width','100%','important');
    layout.style.setProperty('height','calc(100% - 66px)','important');

    grid.style.setProperty('zoom','1','important');
    grid.style.setProperty('transform','none','important');
    grid.style.setProperty('width',size+'px','important');
    grid.style.setProperty('height',size+'px','important');
    grid.style.setProperty('max-width','none','important');
    grid.style.setProperty('aspect-ratio','1 / 1','important');

    questions.style.setProperty('zoom','1','important');
    questions.style.setProperty('transform','none','important');
    return true;
  }

  function fitColourLogic(activity){
    const layout=activity.querySelector(':scope > .tt99-cl-paper-layout');
    const grid=layout?.querySelector('.tt99-cl-paper-grid');
    const rules=layout?.querySelector('.tt99-cl-print-rules');
    if(!layout||!grid||!rules)return false;
    const cs=getComputedStyle(grid);
    const n=Math.max(1,Number(cs.getPropertyValue('--cl-n'))||1);
    const twoPerPage=!!activity.closest('.tt99-game-activities.count-2');
    const threePerPage=!!activity.closest('.tt99-game-activities.count-3');
    const cell=threePerPage?30:(twoPerPage?42:48);
    const maxSize=threePerPage?165:(twoPerPage?210:240);
    const size=Math.min(maxSize,n*cell);

    activity.dataset.tt99PreviewFit='colourlogic';
    activity.style.setProperty('--tt99-preview-body-scale','1');
    activity.dataset.previewBodyScale='1.0000';

    layout.style.setProperty('zoom','1','important');
    layout.style.setProperty('transform','none','important');
    layout.style.setProperty('display','grid','important');
    layout.style.setProperty('grid-template-columns',size+'px minmax(0,1fr)','important');
    layout.style.setProperty('gap',twoPerPage?'16px':'18px','important');
    layout.style.setProperty('align-items','start','important');
    layout.style.setProperty('width','100%','important');

    const left=grid.parentElement;
    if(left){
      left.style.setProperty('width',size+'px','important');
      left.style.setProperty('max-width',size+'px','important');
    }
    grid.style.setProperty('zoom','1','important');
    grid.style.setProperty('transform','none','important');
    grid.style.setProperty('width',size+'px','important');
    grid.style.setProperty('height',size+'px','important');
    grid.style.setProperty('max-width','none','important');
    grid.style.setProperty('grid-template-columns','repeat('+n+',minmax(0,1fr))','important');
    grid.style.setProperty('grid-template-rows','repeat('+n+',minmax(0,1fr))','important');
    grid.querySelectorAll(':scope > span').forEach(el=>{
      el.style.setProperty('width','auto','important');
      el.style.setProperty('height','auto','important');
      el.style.setProperty('aspect-ratio','auto','important');
    });
    return true;
  }

  function fitNumberSearch(activity){
    const layout=activity.querySelector(':scope > .tt99-numbersearch-layout');
    const grid=layout?.querySelector(':scope > .tt99-numbersearch-grid');
    const side=layout?.querySelector(':scope > .tt99-numbersearch-side');
    if(!layout||!grid||!side)return false;
    const twoPerPage=!!activity.closest('.tt99-game-activities.count-2');
    const threePerPage=!!activity.closest('.tt99-game-activities.count-3');
    const desired=threePerPage?235:(twoPerPage?340:420);
    const gap=threePerPage?8:12;

    activity.dataset.tt99PreviewFit='numbersearch';
    activity.style.setProperty('--tt99-preview-body-scale','1');
    activity.dataset.previewBodyScale='1.0000';
    activity.removeAttribute('data-preview-fit-warning');

    layout.style.setProperty('zoom','1','important');
    layout.style.setProperty('transform','none','important');
    layout.style.setProperty('display','grid','important');
    layout.style.setProperty('gap',gap+'px','important');
    layout.style.setProperty('align-items','center','important');
    layout.style.setProperty('width','100%','important');
    layout.style.setProperty('height','auto','important');

    /* The paper preview is itself scaled on phones, so raw getBoundingClientRect()
       pixels cannot be used directly as CSS pixels. Convert the remaining visual
       height back to the activity's unscaled coordinate system, then cap the
       square to that space. This keeps a larger Number Search without ever
       letting it cross the activity frame. */
    const ar=activity.getBoundingClientRect();
    const lr=layout.getBoundingClientRect();
    const scaleY=ar.height/Math.max(1,activity.offsetHeight||activity.clientHeight||ar.height);
    const padBottom=parseFloat(getComputedStyle(activity).paddingBottom)||0;
    const availableH=Math.max(90,Math.floor((ar.bottom-lr.top)/Math.max(.01,scaleY)-padBottom-30));
    const layoutW=Math.max(1,layout.clientWidth);
    const sideReserve=threePerPage?125:(twoPerPage?185:210);
    const availableW=Math.max(90,layoutW-sideReserve-gap);
    const size=Math.max(90,Math.min(desired,availableH,availableW));

    layout.style.setProperty('grid-template-columns',size+'px minmax(0,1fr)','important');
    layout.style.setProperty('height',availableH+'px','important');

    grid.style.setProperty('zoom','1','important');
    grid.style.setProperty('transform','none','important');
    grid.style.setProperty('width',size+'px','important');
    grid.style.setProperty('height',size+'px','important');
    grid.style.setProperty('max-width','none','important');
    grid.style.setProperty('max-height','none','important');
    grid.style.setProperty('aspect-ratio','1 / 1','important');

    side.style.setProperty('zoom','1','important');
    side.style.setProperty('transform','none','important');
    side.style.setProperty('align-self','center','important');
    side.style.setProperty('max-height',availableH+'px','important');
    return true;
  }

  function fitCrossword(activity){
    const layout=activity.querySelector(':scope > .tt99-crossword-layout');
    const grid=layout?.querySelector(':scope > .tt99-crossword-grid');
    const clues=layout?.querySelector(':scope > .tt99-crossword-clues');
    if(!layout||!grid||!clues)return false;
    const cs=getComputedStyle(grid);
    const cols=Math.max(1,Number(cs.getPropertyValue('--cw'))||1);
    const rows=Math.max(1,Number(cs.getPropertyValue('--ch'))||1);
    const ls=getComputedStyle(layout);
    const gap=parseFloat(ls.columnGap||ls.gap)||0;
    const layoutW=Math.max(1,layout.clientWidth);
    const layoutH=Math.max(1,layout.clientHeight);
    const cluesW=Math.max(0,clues.offsetWidth);
    const leftW=Math.max(1,layoutW-cluesW-gap);
    const cell=Math.max(1,Math.min(leftW/cols,layoutH/rows));
    grid.style.setProperty('width',(cell*cols)+'px','important');
    grid.style.setProperty('height',(cell*rows)+'px','important');
    grid.style.setProperty('max-width','none','important');
    grid.style.setProperty('max-height','none','important');
    grid.style.setProperty('aspect-ratio',cols+' / '+rows,'important');
    grid.querySelectorAll(':scope > span.open').forEach(el=>{
      el.style.setProperty('width','auto','important');
      el.style.setProperty('height','auto','important');
      el.style.setProperty('aspect-ratio','auto','important');
    });
    activity.dataset.tt99PreviewFit='crossword';
    activity.style.setProperty('--tt99-preview-body-scale','1');
    activity.dataset.previewBodyScale='1.0000';
    return true;
  }

  function fitActivity(activity){
    if(!activity?.isConnected)return;
    if(activity.querySelector(':scope > .tt99-sumgrid-wrap')){
      if(fitSumGrid(activity))return;
    }
    if(activity.classList.contains('tt99-colourlogic-print')){
      if(fitColourLogic(activity))return;
    }
    if(activity.classList.contains('tt99-maze')){
      if(fitMaze(activity))return;
    }
    if(activity.classList.contains('tt99-numbersearch')){
      if(fitNumberSearch(activity))return;
    }
    if(activity.classList.contains('tt99-crossword')||activity.classList.contains('tt99-crossnumber')){
      if(fitCrossword(activity))return;
    }
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

  global.TT99GamesPreviewFitV207={version:'2.15',refresh:schedule,fitActivity};
})(typeof globalThis!=='undefined'?globalThis:this);
