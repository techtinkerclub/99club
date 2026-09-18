/* 99 Club Studio · Equation Crossgrid block rendering fix v1.85
 * The arithmetic engine uses '#' internally to mark unused cells. Online Play
 * should never show that sentinel to pupils; unused cells are dark blocks.
 */
(function(global){
'use strict';
const Play=global.TT99GamesPlay;
const adapter=Play?.adapters?.get?.('equationcrossgrid');
if(!adapter||adapter.__v185BlocksFixed)return;
const originalMount=adapter.mount.bind(adapter);
adapter.mount=function(root,p,ctx){
  const cleanGrid=grid=>(grid||[]).map(row=>row.map(v=>v==='#'?null:v));
  const clean={...p,solutionGrid:cleanGrid(p?.solutionGrid),displayGrid:cleanGrid(p?.displayGrid)};
  return originalMount(root,clean,ctx);
};
adapter.__v185BlocksFixed=true;
})(typeof globalThis!=='undefined'?globalThis:this);
