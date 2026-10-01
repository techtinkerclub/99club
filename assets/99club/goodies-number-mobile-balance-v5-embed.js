/* Number Mobile v5 embedded-workflow guard.
 * The mixed whiteboard intentionally hides the legacy Challenge settings tab.
 * V5 still uses that shared engine behind the scenes, so prevent the embed
 * simplifier from switching back to Explore while a direct challenge action is
 * actively generating/clearing a puzzle. */
(function(){
'use strict';
let guardUntil=0;
function arm(){guardUntil=Date.now()+15000}
function guarded(){return Date.now()<guardUntil}
document.addEventListener('click',event=>{
  const target=event.target?.closest?.('button');if(!target)return;
  if(target.matches('[data-nmb-v5-type],[data-nmb-v5-clear],[data-nmb-v5-another]')){arm();return}
  if(document.body.classList.contains('gd-embed-page')&&guarded()&&!event.isTrusted&&target.matches('[data-ba-workflow="explore"]')){
    event.preventDefault();event.stopImmediatePropagation();
  }
},true);
})();
