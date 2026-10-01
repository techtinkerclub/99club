/* Number Mobile embedded-workflow guard.
 * The mixed whiteboard intentionally hides the legacy Challenge settings tab.
 * The direct Number Mobile challenge UI still uses that shared engine behind
 * the scenes, so do not let the embed simplifier switch back to Explore while
 * a generated challenge is being built, cleared or regenerated.
 */
(function(){
'use strict';
let guardUntil=0;
function arm(){guardUntil=Date.now()+15000}
function guarded(){return Date.now()<guardUntil}
document.addEventListener('click',event=>{
  const target=event.target?.closest?.('button');if(!target)return;
  if(target.matches('[data-nmb-v6-type],[data-nmb-v6-clear],[data-nmb-v6-another]')){arm();return}
  if(document.body.classList.contains('gd-embed-page')&&guarded()&&!event.isTrusted&&target.matches('[data-ba-workflow="explore"]')){
    event.preventDefault();event.stopImmediatePropagation();
  }
},true);
})();
