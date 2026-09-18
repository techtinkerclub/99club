/* 99 Club Studio · Arithmagons result-node layout v1.78 */
(function(global){
'use strict';
const Play=global.TT99GamesPlay;if(!Play)return;
const adapter=Play.adapters.get('arithmagon');if(!adapter||adapter.__v178ResultNodes)return;
const originalMount=adapter.mount.bind(adapter);
adapter.mount=function(root,p,ctx){
  const view=originalMount(root,p,ctx);
  root.classList.toggle('is-mixed-ops',p?.operationMode==='mixed_within');
  root.querySelectorAll('.tt99-arith-link').forEach((el,i)=>{
    const link=p?.links?.[i];
    if(!link)return;
    const op=link.operation==='multiply'?'multiply':'add';
    el.dataset.operation=op;
    el.setAttribute('aria-label',`${op==='multiply'?'Product':'Sum'} of corner ${Number(link.a)+1} and corner ${Number(link.b)+1}`);
  });
  return view;
};
adapter.__v178ResultNodes=true;
})(typeof globalThis!=='undefined'?globalThis:this);
