/* 99 Club Studio · Symbol Decoder online polish v1.89
 * Keeps the decoded word on one row and moves the definition directly beneath it.
 */
(function(global){
'use strict';
const Play=global.TT99GamesPlay,Shared=global.TT99SymbolDecoder;
const adapter=Play?.adapters?.get?.('symbols');
if(!adapter||adapter.__decoderV189)return;
const previousMount=adapter.mount.bind(adapter),previousCreate=adapter.createPuzzle.bind(adapter);
adapter.createPuzzle=function(config,seed){return Shared?.generate?Shared.generate(config,seed):previousCreate(config,seed);};
adapter.mount=function(root,p,ctx){
  const view=previousMount(root,p,ctx);
  const code=root.querySelector('[data-dec-code]');
  const reveal=root.querySelector('[data-dec-reveal]');
  const mission=root.querySelector('.tt99-decoder-mission');
  const len=Math.max(1,Number(p?.code?.length)||Number(p?.word?.length)||1);
  root.style.setProperty('--tt99-decoder-length',String(len));
  root.style.setProperty('--tt99-decoder-max',`${Math.min(620,len*61)}px`);
  root.classList.toggle('is-decoder-long',len>=8);
  root.classList.toggle('is-decoder-very-long',len>=10);
  /* The v1.88 renderer already updates this reveal element when the puzzle is
     solved. Moving the same node keeps that logic intact while placing the
     definition where the pupil expects it: immediately below the decoded word. */
  if(code&&reveal&&mission&&reveal.parentElement!==mission){
    code.insertAdjacentElement('afterend',reveal);
    reveal.classList.add('tt99-decoder-inline-definition');
  }
  return view;
};
adapter.__decoderV189=true;
})(typeof globalThis!=='undefined'?globalThis:this);
