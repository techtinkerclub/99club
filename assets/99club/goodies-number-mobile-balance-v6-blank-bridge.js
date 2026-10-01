/* Number Mobile v6 generated-blank bridge.
 * Branch-created boxes are deliberately born as Number Mobile blanks. When the
 * v6 challenge builder assigns one a value through the base balance editor,
 * route that assignment through the Number Mobile keyboard path so its own
 * blank state is cleared as well as the underlying numeric value being set.
 */
(function(){
'use strict';
document.addEventListener('change',event=>{
  const input=event.target;if(!input||input.id!=='ba-value')return;
  const work=document.querySelector('#gd-stage .gd-number-mobile-workbench');if(!work)return;
  const tile=work.querySelector('[data-ba-token].is-nmb-focused.is-blank-box');if(!tile)return;
  const text=String(input.value??'').trim();if(!/^\d+(?:\.\d+)?$/.test(text))return;
  event.preventDefault();event.stopImmediatePropagation();
  for(const key of text)document.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
},true);
})();
