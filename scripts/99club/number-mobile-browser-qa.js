'use strict';

const fs=require('fs');
const mode=process.argv[2];
const HARNESS='99club-number-mobile-qa.html';
const REPORT='99club-number-mobile-qa-report.json';

if(mode==='prepare'){
  const html=`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/assets/99club/goodies.css">
<link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v3.css">
<link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v4.css">
<link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v5.css">
<style>body{margin:0}</style></head><body>
<div id="tt99-goodies-root"></div><div id="nmb-qa-result" data-status="pending">pending</div>
<script>window.scrollTo=function(){};</script>
<script src="/assets/99club/goodies-core.js"></script>
<script src="/assets/99club/goodies-interaction.js"></script>
<script src="/assets/99club/goodies-challenge.js"></script>
<script src="/assets/99club/goodies-export.js"></script>
<script src="/assets/99club/goodies-tools-a.js"></script>
<script src="/assets/99club/goodies-number-line-v6.js"></script>
<script src="/assets/99club/goodies-tools-b.js"></script>
<script src="/assets/99club/goodies-number-mobile-balance-v3.js"></script>
<script src="/assets/99club/goodies-number-mobile-balance-v4.js"></script>
<script src="/assets/99club/goodies-number-mobile-balance-v5.js"></script>
<script src="/assets/99club/goodies-app.js"></script>
<script>
(function(){
  function assert(v,m){if(!v)throw new Error(m)}
  function tick(ms=0){return new Promise(r=>setTimeout(r,ms))}
  async function waitFor(fn,tries=80,delay=40){for(let i=0;i<tries;i++){const v=fn();if(v)return v;await tick(delay)}return null}
  function result(status,message,detail=''){const el=document.getElementById('nmb-qa-result');el.dataset.status=status;el.dataset.message=message||'';el.dataset.detail=detail||'';el.textContent=status+': '+message}
  function stage(){return document.getElementById('gd-stage')}
  function work(){return stage()?.querySelector('.gd-number-mobile-workbench')||null}
  function tile(id){return work()?.querySelector('[data-ba-token="'+CSS.escape(String(id))+'"]')||null}
  async function openChallenge(){const trigger=work()?.querySelector('[data-nmb-challenge-toggle]');assert(trigger,'Number Mobile exposes a direct Challenge action');trigger.click();return await waitFor(()=>work()?.querySelector('.nmb-v5-challenge-popover'))}
  async function clearChallenge(){let pop=await openChallenge();const clear=pop?.querySelector('[data-nmb-v5-clear]');assert(clear,'Active challenge can be cleared directly');clear.click();await tick(100);assert(!stage().querySelector('.gd-challenge-banner'),'Clear challenge returns to normal Number Mobile mode')}
  async function run(){
    assert(window.TT99Goodies&&String(TT99Goodies.numberMobileBalanceVersion||'').startsWith('3.0'),'Number Mobile v3 adapter is active');
    assert(TT99Goodies.numberMobileBalanceEnhancementVersion==='5.0','Number Mobile v5 challenge enhancement is active');
    const card=document.querySelector('[data-tool="balance"]');assert(card,'Number Mobile catalogue card exists');card.click();await tick(80);
    assert(work(),'Number Mobile workbench renders');
    let tiles=[...work().querySelectorAll('[data-ba-token]')];assert(tiles.length>=3,'Number Mobile starts with editable number boxes');
    assert(tiles.every(t=>!t.disabled),'Normal starter number boxes are editable');

    const firstId=String(tiles[0].dataset.baToken);tile(firstId).click();await tick(40);
    assert(work().querySelector('.nmb-keypad'),'Tapping a starter box opens the number keypad');
    assert(work().querySelector('.nmb-tile-toolbar'),'Selected box exposes direct actions');
    work().querySelector('[data-nmb-close]').click();await tick(25);
    assert(!work().querySelector('.nmb-keypad'),'Closing keypad hides only the keypad');
    assert(work().querySelector('.nmb-tile-toolbar'),'Selected box keeps direct actions until selection is dismissed');

    work().dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'mouse'}));await tick(25);
    assert(!work().querySelector('.nmb-tile-toolbar'),'Clicking blank mobile space dismisses the selected-box menu');
    tile(firstId).click();await tick(40);assert(work().querySelector('.nmb-keypad'),'Tapping the same box reopens editing after dismissal');

    const branchButton=work().querySelector('[data-nmb-branch]');assert(branchButton,'Keypad exposes Branch directly');branchButton.click();await tick(140);
    let branch=work().querySelector('.nmb-branch');assert(branch,'Branch creates a visible child mobile');
    assert(branch.querySelector('.nmb-branch-bar'),'Child mobile has its own balance bar');
    assert(branch.querySelectorAll('.nmb-branch-side').length===2,'Child mobile has two hanging sides');
    assert(branch.querySelectorAll('.nmb-branch-cord').length===2,'Child mobile has two visible suspension cords');

    const branchTile=branch.querySelector('[data-ba-token]');assert(branchTile,'Original number box moves onto the child mobile');const branchTileId=String(branchTile.dataset.baToken);tile(branchTileId).click();await tick(40);
    let toolbar=work().querySelector('.nmb-tile-toolbar');assert(toolbar,'Branched box can still be selected');
    const deleteButton=[...toolbar.querySelectorAll('button')].find(b=>b.textContent.trim()==='Delete');assert(deleteButton,'Selected box exposes direct Delete');
    const before=work().querySelectorAll('[data-ba-token]').length;deleteButton.click();await tick(100);
    const after=work().querySelectorAll('[data-ba-token]').length;assert(after===before-1,'Direct Delete removes the selected box');

    let pop=await openChallenge();assert(pop,'Challenge picker opens');
    assert(pop.querySelectorAll('[data-nmb-v5-difficulty]').length===3,'Challenge picker offers Easy, Medium and Hard');
    assert(pop.querySelector('[data-nmb-v5-difficulty="easy"].is-active'),'Easy is the default difficulty');
    pop.querySelector('[data-nmb-v5-type="missing-weight"]').click();
    await waitFor(()=>stage().querySelector('.gd-challenge-banner'));await tick(100);
    assert(stage().querySelector('.gd-challenge-banner'),'Easy challenge still uses the shared challenge engine');
    const total=work().querySelector('.gd-eq-total');assert(total&&getComputedStyle(total).display==='none','Side totals are hidden during challenges');
    assert(!/\d+\s*[<>=]\s*\d+/.test(work().querySelector('.gd-eq-verdict strong')?.textContent||''),'Challenge status does not reveal side totals');
    await clearChallenge();

    pop=await openChallenge();
    const hard=pop.querySelector('[data-nmb-v5-difficulty="hard"]');assert(hard,'Hard difficulty is available');hard.click();await tick(30);
    pop=work().querySelector('.nmb-v5-challenge-popover');assert(pop.querySelector('[data-nmb-v5-difficulty="hard"].is-active'),'Hard selection remains active');
    pop.querySelector('[data-nmb-v5-type="missing-weight"]').click();
    const hardBanner=await waitFor(()=>stage().querySelector('.gd-challenge-banner'),120,50);assert(hardBanner,'Hard missing-number challenge renders');
    await waitFor(()=>work()?.querySelectorAll('.nmb-branch').length>=2,120,50);await tick(120);
    assert(work().querySelectorAll('.nmb-branch').length>=2,'Hard challenge uses two hanging branches');
    assert([...work().querySelectorAll('[data-ba-token] strong')].filter(el=>el.textContent.trim()==='?').length>=2,'Hard challenge contains multiple missing numbers');
    assert([...work().querySelectorAll('.gd-eq-total')].every(el=>getComputedStyle(el).display==='none'),'Hard challenge never shows side totals');
    assert(/HARD/.test(stage().querySelector('.gd-challenge-kicker')?.textContent||''),'Challenge banner identifies Hard difficulty');
    assert(stage().querySelector('[data-nmb-v5-another]'),'Hard challenge keeps Another like this on the banner');
    assert([...work().querySelectorAll('[data-ba-token]')].every(el=>el.disabled),'Read-only hard puzzle protects its given boxes');

    const reveal=stage().querySelector('[data-board-action="reveal"]');assert(reveal,'Hard challenge has Reveal answer');reveal.click();await tick(120);
    assert([...work().querySelectorAll('[data-ba-token] strong')].filter(el=>el.textContent.trim()==='?').length===0,'Reveal answer restores both hidden values');

    await clearChallenge();
    assert([...work().querySelectorAll('[data-ba-token]')].every(t=>!t.disabled),'Original setup is editable again after challenge mode');

    result('pass','Number Mobile contextual editing plus Easy/Medium/Hard challenge interactions work without leaking totals');
  }
  window.addEventListener('load',()=>setTimeout(()=>run().catch(e=>result('fail',e&&e.message?e.message:String(e),e&&e.stack?e.stack:'')),140));
})();
</script></body></html>`;
  fs.writeFileSync(HARNESS,html);console.log(HARNESS);process.exit(0);
}

if(mode==='check'){
  const file=process.argv[3];if(!file)throw new Error('Usage: node number-mobile-browser-qa.js check <dumped-html>');
  const html=fs.readFileSync(file,'utf8');
  const m=html.match(/<div id="nmb-qa-result"[^>]*data-status="([^"]+)"[^>]*data-message="([^"]*)"[^>]*data-detail="([^"]*)"/);
  const status=m?m[1]:'missing',message=m?m[2]:'Result element missing',detail=m?m[3]:'';
  fs.writeFileSync(REPORT,JSON.stringify({status,message,detail,checkedAt:new Date().toISOString()},null,2));
  if(status!=='pass')throw new Error('Number Mobile browser QA failed: '+(message||status));console.log(message);process.exit(0);
}

throw new Error('Use prepare or check mode.');
