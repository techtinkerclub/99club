/* Number Mobile Balance v9 · challenge chrome helper */
(function(){
'use strict';
let observer=null;
function adapt(){
  const active=document.body.classList.contains('nmb-v8-pupil-challenge');
  const stage=document.getElementById('gd-stage');
  const banner=stage&&stage.querySelector('.gd-challenge-banner');
  const work=stage&&stage.querySelector('.gd-number-mobile-workbench');
  if(!active||!banner||!work)return;
  const actions=banner.querySelector('.gd-challenge-actions');
  if(!actions)return;
  let change=actions.querySelector('[data-nmb-v9-change]');
  if(!change){
    change=document.createElement('button');
    change.type='button';
    change.className='gd-challenge-action';
    change.dataset.nmbV9Change='1';
    change.textContent='Change';
    change.title='Choose a different Number Mobile challenge';
    change.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();
      const trigger=work.querySelector('[data-nmb-challenge-toggle]');
      if(trigger)trigger.click();
    });
    actions.insertBefore(change,actions.firstChild);
  }
  const another=actions.querySelector('[data-nmb-v6-another]');
  if(another){another.textContent='Another';another.title='Generate another challenge of this type'}
  const reveal=actions.querySelector('[data-board-action="reveal"]');
  if(reveal){reveal.textContent='Reveal';reveal.title='Reveal the answer'}
  const exit=actions.querySelector('[data-nmb-v7-exit]');
  if(exit){exit.textContent='Exit';exit.title='Exit challenge mode'}
}
function install(){
  const root=document.getElementById('tt99-goodies-root');
  if(root){observer=new MutationObserver(function(){setTimeout(adapt,0)});observer.observe(root,{childList:true,subtree:true})}
  document.addEventListener('click',function(){setTimeout(adapt,0)},true);
  adapt();
}
window.TT99NumberMobileChallengeChromeVersion='9.0.1-hotfix';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
