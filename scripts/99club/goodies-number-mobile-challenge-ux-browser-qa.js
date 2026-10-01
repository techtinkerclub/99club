'use strict';

const fs=require('fs');
const mode=process.argv[2];
const HTML='99club-number-mobile-challenge-ux-qa.html';
const REPORT='99club-number-mobile-challenge-ux-qa-report.json';

if(mode==='prepare'){
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/assets/99club/goodies.css">
<link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v3.css">
<link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v4.css">
<link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v5.css">
<link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v7.css">
<style>body{margin:0}</style></head><body><div id="tt99-goodies-root"></div><div id="nmb-ux-qa-result" data-status="pending">pending</div>
<script>window.scrollTo=function(){};</script>
<script src="/assets/99club/goodies-core.js"></script><script src="/assets/99club/goodies-interaction.js"></script><script src="/assets/99club/goodies-challenge.js"></script><script src="/assets/99club/goodies-export.js"></script><script src="/assets/99club/goodies-tools-a.js"></script><script src="/assets/99club/goodies-number-line-v6.js"></script><script src="/assets/99club/goodies-tools-b.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v3.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v4.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v6.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v6-blank-bridge.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v7.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v5-embed.js"></script><script src="/assets/99club/goodies-app.js"></script>
<script>
(function(){
  function assert(v,m){if(!v)throw new Error(m)}
  function tick(ms=0){return new Promise(r=>setTimeout(r,ms))}
  async function waitFor(fn,tries=160,delay=30){for(let i=0;i<tries;i++){const v=fn();if(v)return v;await tick(delay)}return null}
  function result(status,message,detail=''){const el=document.getElementById('nmb-ux-qa-result');el.dataset.status=status;el.dataset.message=message||'';el.dataset.detail=detail||'';el.textContent=status+': '+message}
  function stage(){return document.getElementById('gd-stage')}
  function work(){return stage()?.querySelector('.gd-number-mobile-workbench')||null}
  async function run(){
    assert(TT99Goodies.numberMobileChallengeUxVersion==='7.1','Number Mobile v7 challenge UX is active');
    const card=document.querySelector('[data-tool="balance"]');assert(card,'Number Mobile catalogue card exists');card.click();
    assert(await waitFor(()=>work()),'Number Mobile renders');
    const trigger=await waitFor(()=>work()?.querySelector('[data-nmb-challenge-toggle]'));assert(trigger,'Challenge trigger exists');trigger.click();
    let pop=await waitFor(()=>work()?.querySelector('.nmb-v5-challenge-popover'));assert(pop,'Challenge picker opens');
    const hard=pop.querySelector('[data-nmb-v6-difficulty="hard"]');assert(hard,'Hard difficulty exists');hard.click();
    pop=await waitFor(()=>work()?.querySelector('.nmb-v5-challenge-popover [data-nmb-v6-difficulty="hard"].is-active')?.closest('.nmb-v5-challenge-popover'));assert(pop,'Hard picker settles');
    const missing=pop.querySelector('[data-nmb-v6-type="missing-weight"]');assert(missing,'Missing number challenge exists');
    missing.click();
    assert(document.body.classList.contains('nmb-v7-challenge-building'),'Challenge construction curtain starts on the generating click');
    assert(getComputedStyle(work()).visibility==='hidden','The mobile is hidden while the challenge is being constructed');
    assert(await waitFor(()=>stage()?.querySelector('.gd-challenge-banner')),'Challenge banner is created behind the curtain');
    assert(await waitFor(()=>!document.body.classList.contains('nmb-v7-challenge-building')),'Construction curtain is removed after the challenge settles');
    assert(getComputedStyle(work()).visibility!=='hidden','Finished challenge becomes visible only after construction settles');
    const exit=await waitFor(()=>stage()?.querySelector('[data-nmb-v7-exit]'));assert(exit,'Challenge banner exposes Exit challenge');
    exit.click();
    assert(await waitFor(()=>!stage()?.querySelector('.gd-challenge-banner')),'Exit challenge leaves challenge mode');
    assert(await waitFor(()=>work()&&[...work().querySelectorAll('[data-ba-token]')].every(el=>!el.disabled)),'Exit challenge restores editable Number Mobile mode');
    result('pass','Challenge construction stays hidden and Exit challenge restores normal mode');
  }
  window.addEventListener('load',()=>setTimeout(()=>run().catch(e=>result('fail',e?.message||String(e),e?.stack||'')),180));
})();
</script></body></html>`;
  fs.writeFileSync(HTML,html);console.log(HTML);process.exit(0);
}

if(mode==='check'){
  const file=process.argv[3];if(!file)throw new Error('Usage: node goodies-number-mobile-challenge-ux-browser-qa.js check <dumped-html>');
  const html=fs.readFileSync(file,'utf8'),m=html.match(/<div id="nmb-ux-qa-result"[^>]*data-status="([^"]+)"[^>]*data-message="([^"]*)"[^>]*data-detail="([^"]*)"/),status=m?m[1]:'missing',message=m?m[2]:'Result element missing',detail=m?m[3]:'';
  fs.writeFileSync(REPORT,JSON.stringify({status,message,detail,checkedAt:new Date().toISOString()},null,2));
  if(status!=='pass')throw new Error('Number Mobile challenge UX QA failed: '+(message||status));console.log(message);process.exit(0);
}
throw new Error('Use prepare or check mode.');
