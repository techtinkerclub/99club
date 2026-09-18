/* 99 Club Studio · PDF-faithful preview scaler v2.06
 * The preview is laid out at the PDF's fixed A4 point size and the whole page is
 * zoomed uniformly to fit the current preview column. No puzzle content is
 * regenerated and no PDF drawing code is changed here.
 */
(function(global){
  'use strict';
  const root=document.getElementById('tt99-games-root');if(!root)return;
  const GEO=global.TT99GamesPageGeometry||{pageWidth:595.28,pageHeight:841.89};
  const PAGE_W=Number(GEO.pageWidth)||595.28;
  let raf=0,printing=false;

  function fit(page){
    if(!page||printing)return;
    const stack=page.closest('.tt99-games-preview-stack');
    if(!stack)return;
    const available=Math.max(1,stack.clientWidth);
    const scale=Math.max(.25,Math.min(1.55,available/PAGE_W));
    page.style.zoom=String(scale);
    page.dataset.previewScale=scale.toFixed(4);
  }

  function scan(){
    if(printing)return;
    root.querySelectorAll('.tt99-games-preview-stack > article.tt99-game-paper').forEach(fit);
  }
  function schedule(){
    if(printing||raf)return;
    raf=requestAnimationFrame(()=>{raf=0;scan();});
  }
  function beforePrint(){
    printing=true;
    root.querySelectorAll('article.tt99-game-paper').forEach(page=>{
      page.style.removeProperty('zoom');
      delete page.dataset.previewScale;
    });
  }
  function afterPrint(){printing=false;schedule();}

  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  if(global.ResizeObserver){const ro=new ResizeObserver(schedule);ro.observe(root);}
  global.addEventListener?.('resize',schedule,{passive:true});
  global.addEventListener?.('beforeprint',beforePrint);
  global.addEventListener?.('afterprint',afterPrint);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();

  global.TT99GamesPreviewParityV206={version:'2.06',refresh:schedule,geometry:GEO};
})(typeof globalThis!=='undefined'?globalThis:this);
