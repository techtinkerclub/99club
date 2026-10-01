'use strict';

const fs=require('fs');
const mode=process.argv[2];
const STANDALONE='99club-number-mobile-qa.html';
const BOARD='99club-number-mobile-board-qa.html';
const EMBED='99club-number-mobile-embed-qa.html';
const REPORT='99club-number-mobile-qa-report.json';
const BOARD_REPORT='99club-number-mobile-board-qa-report.json';

const runtimeScripts=`
<script src="/assets/99club/goodies-core.js"></script>
<script src="/assets/99club/goodies-interaction.js"></script>
<script src="/assets/99club/goodies-challenge.js"></script>
<script src="/assets/99club/goodies-export.js"></script>
<script src="/assets/99club/goodies-tools-a.js"></script>
<script src="/assets/99club/goodies-number-line-v6.js"></script>
<script src="/assets/99club/goodies-tools-b.js"></script>
<script src="/assets/99club/goodies-number-mobile-balance-v3.js"></script>
<script src="/assets/99club/goodies-number-mobile-balance-v4.js"></script>
<script src="/assets/99club/goodies-number-mobile-balance-v6.js"></script>
<script src="/assets/99club/goodies-number-mobile-balance-v6-blank-bridge.js"></script>
<script src="/assets/99club/goodies-number-mobile-balance-v5-embed.js"></script>
<script src="/assets/99club/goodies-app.js"></script>`;

const commonHead=`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/assets/99club/goodies.css">
<link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v3.css">
<link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v4.css">
<link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v5.css">
<style>body{margin:0}</style>`;

if(mode==='prepare'){
  const standalone=`<!doctype html><html><head>${commonHead}</head><body>
<div id="tt99-goodies-root"></div><div id="nmb-qa-result" data-status="pending">pending</div>
<script>window.scrollTo=function(){};</script>${runtimeScripts}
<script>
(function(){
  function assert(v,m){if(!v)throw new Error(m)}
  function tick(ms=0){return new Promise(r=>setTimeout(r,ms))}
  async function waitFor(fn,tries=120,delay=35){for(let i=0;i<tries;i++){const v=fn();if(v)return v;await tick(delay)}return null}
  function result(status,message,detail=''){const el=document.getElementById('nmb-qa-result');el.dataset.status=status;el.dataset.message=message||'';el.dataset.detail=detail||'';el.textContent=status+': '+message}
  function stage(){return document.getElementById('gd-stage')}
  function work(){return stage()?.querySelector('.gd-number-mobile-workbench')||null}
  function missingCount(){return [...(work()?.querySelectorAll('[data-ba-token] strong')||[])].filter(el=>el.textContent.trim()==='?').length}
  async function openChallenge(){
    const trigger=await waitFor(()=>work()?.querySelector('[data-nmb-challenge-toggle]'));assert(trigger,'Number Mobile exposes Challenge');trigger.click();
    const pop=await waitFor(()=>work()?.querySelector('.nmb-v5-challenge-popover'));assert(pop,'Challenge picker opens');return pop;
  }
  async function clearChallenge(){
    const pop=await openChallenge();const clear=pop.querySelector('[data-nmb-v6-clear]');assert(clear,'Active challenge exposes Clear challenge');clear.click();
    await waitFor(()=>!stage()?.querySelector('.gd-challenge-banner'));assert(!stage()?.querySelector('.gd-challenge-banner'),'Clear challenge ends challenge mode');
    await waitFor(()=>work()&&[...work().querySelectorAll('[data-ba-token]')].every(el=>!el.disabled));
  }
  async function run(){
    assert(window.TT99Goodies,'Goodies runtime loads');
    assert(String(TT99Goodies.numberMobileBalanceVersion||'').startsWith('3.0'),'Number Mobile tree adapter is active');
    assert(TT99Goodies.numberMobileBalanceEnhancementVersion==='6.0','Number Mobile difficulty layer is active');

    const card=document.querySelector('[data-tool="balance"]');assert(card,'Number Mobile catalogue card exists');card.click();
    const w=await waitFor(()=>work());assert(w,'Number Mobile workbench renders');
    await waitFor(()=>work()?.querySelectorAll('[data-ba-token]').length>=3);
    let starter=[...work().querySelectorAll('[data-ba-token]')];assert(starter.length>=3,'Starter number boxes render');
    assert(starter.every(el=>!el.disabled),'Starter number boxes are editable');

    const firstId=String(starter[0].dataset.baToken);
    const first=await waitFor(()=>work()?.querySelector('[data-ba-token="'+CSS.escape(firstId)+'"]'));assert(first,'Starter box remains addressable after initial layout settles');first.click();
    assert(await waitFor(()=>work()?.querySelector('.nmb-keypad')),'Tapping a starter box opens its keypad');
    assert(work().querySelector('.nmb-tile-toolbar'),'Selected box exposes direct actions');
    const branchAction=[...work().querySelectorAll('.nmb-tile-toolbar button')].find(b=>b.textContent.trim()==='Branch');assert(branchAction,'Selected box exposes Branch');branchAction.click();
    assert(await waitFor(()=>work()?.querySelector('.nmb-branch')),'Branch creates a smaller hanging balance');
    const branch=work().querySelector('.nmb-branch');assert(branch.querySelectorAll('.nmb-branch-side').length===2,'Child balance has two hanging sides');

    let pop=await openChallenge();
    assert(pop.querySelectorAll('[data-nmb-v6-difficulty]').length===3,'Challenge picker offers Easy, Medium and Hard');
    assert(pop.querySelector('[data-nmb-v6-difficulty="easy"].is-active'),'Easy is the default difficulty');
    pop.querySelector('[data-nmb-v6-type="missing-weight"]').click();
    assert(await waitFor(()=>stage()?.querySelector('.gd-challenge-banner')),'Easy challenge uses the shared challenge engine');
    await waitFor(()=>work()?.querySelector('.gd-eq-total'));
    assert([...work().querySelectorAll('.gd-eq-total')].every(el=>getComputedStyle(el).display==='none'),'Challenge hides side totals');
    const taskText=work().querySelector('.gd-eq-verdict strong')?.textContent||'';
    assert(!/\d+\s*[<>=]\s*\d+/.test(taskText),'Challenge status does not leak a numeric relationship');
    await clearChallenge();

    pop=await openChallenge();
    const hard=pop.querySelector('[data-nmb-v6-difficulty="hard"]');assert(hard,'Hard difficulty is available');hard.click();
    pop=await waitFor(()=>work()?.querySelector('.nmb-v5-challenge-popover'));assert(pop.querySelector('[data-nmb-v6-difficulty="hard"].is-active'),'Hard selection becomes active');
    pop.querySelector('[data-nmb-v6-type="missing-weight"]').click();
    assert(await waitFor(()=>stage()?.querySelector('.gd-challenge-banner')),'Hard challenge banner renders');
    assert(await waitFor(()=>work()?.querySelectorAll('.nmb-branch').length>=2),'Hard missing-number challenge uses two hanging branches');
    assert(await waitFor(()=>missingCount()>=2),'Hard missing-number challenge exposes at least two unknowns');
    assert([...work().querySelectorAll('.gd-eq-total')].every(el=>getComputedStyle(el).display==='none'),'Hard challenge keeps all side totals hidden');
    assert(await waitFor(()=>/HARD/.test(stage()?.querySelector('.gd-challenge-kicker')?.textContent||'')),'Challenge banner identifies Hard difficulty');
    assert(await waitFor(()=>stage()?.querySelector('[data-nmb-v6-another]')),'Hard challenge keeps Another like this');
    assert(await waitFor(()=>work()&&[...work().querySelectorAll('[data-ba-token]')].every(el=>el.disabled)),'Hard reasoning puzzle protects its given boxes');

    const reveal=stage().querySelector('[data-board-action="reveal"]');assert(reveal,'Hard challenge exposes Reveal answer');reveal.click();
    await waitFor(()=>missingCount()===0);assert(missingCount()===0,'Reveal restores all hidden values');
    await clearChallenge();
    assert(work()&&[...work().querySelectorAll('[data-ba-token]')].every(el=>!el.disabled),'Clearing restores an editable mobile');

    result('pass','Number Mobile editing and Easy/Medium/Hard challenges work without leaking totals');
  }
  window.addEventListener('load',()=>setTimeout(()=>run().catch(e=>result('fail',e?.message||String(e),e?.stack||'')),160));
})();
</script></body></html>`;

  const embed=`<!doctype html><html><head>${commonHead}</head><body class="gd-embed-page">
<div id="tt99-goodies-root"></div><script>window.scrollTo=function(){};</script>${runtimeScripts}
</body></html>`;

  const board=`<!doctype html><html><head>${commonHead}</head><body>
<div id="tt99-goodies-root"></div><div id="nmb-board-qa-result" data-status="pending">pending</div>
<script>history.replaceState(null,'','/?board=1');window.TT99_GOODIES_BOARD_EMBED_PATH='/${EMBED}';window.scrollTo=function(){};</script>
<script src="/assets/99club/goodies-core.js"></script>
<script src="/assets/99club/goodies-interaction.js"></script>
<script src="/assets/99club/goodies-challenge.js"></script>
<script src="/assets/99club/goodies-export.js"></script>
<script src="/assets/99club/goodies-tools-a.js"></script>
<script src="/assets/99club/goodies-number-line-v6.js"></script>
<script src="/assets/99club/goodies-tools-b.js"></script>
<script src="/assets/99club/goodies-app.js"></script>
<script src="/assets/99club/goodies-board.js"></script>
<script>
(function(){
  function assert(v,m){if(!v)throw new Error(m)}
  function tick(ms=0){return new Promise(r=>setTimeout(r,ms))}
  async function waitFor(fn,tries=120,delay=40){for(let i=0;i<tries;i++){const v=fn();if(v)return v;await tick(delay)}return null}
  function result(status,message,detail=''){const el=document.getElementById('nmb-board-qa-result');el.dataset.status=status;el.dataset.message=message||'';el.dataset.detail=detail||'';el.textContent=status+': '+message}
  async function run(){
    assert(window.TT99Goodies?.compositionBoard,'Mixed whiteboard mounts');
    const add=document.querySelector('[data-board-add="balance"]');assert(add,'Number Mobile is available on the whiteboard rail');add.click();
    const object=await waitFor(()=>document.querySelector('[data-board-object].is-ready'));assert(object,'Number Mobile embedded object becomes ready');
    const quick=object.querySelector('[data-board-quick-actions]');assert(quick,'Selected Number Mobile exposes quick actions');
    assert(await waitFor(()=>quick.querySelector('[data-nmb-board-challenge]')),'Challenge is injected into the whiteboard-owned action cluster');
    const labels=[...quick.querySelectorAll(':scope > button')].filter(b=>!b.hidden).map(b=>b.textContent.trim());
    const challenge=labels.indexOf('Challenge'),right=labels.indexOf('+ Right'),move=labels.indexOf('Move'),duplicate=labels.indexOf('Duplicate');
    assert(challenge>=0,'Challenge is visible with the other object actions');
    assert(right>=0&&challenge===right+1,'Challenge sits immediately after + Right');
    assert(move===challenge+1&&duplicate===move+1,'Move and Duplicate follow Challenge in the same action cluster');
    result('pass','Number Mobile Challenge sits with + Left/+ Right/Move/Duplicate on the mixed whiteboard');
  }
  window.addEventListener('load',()=>setTimeout(()=>run().catch(e=>result('fail',e?.message||String(e),e?.stack||'')),180));
})();
</script></body></html>`;

  fs.writeFileSync(STANDALONE,standalone);fs.writeFileSync(EMBED,embed);fs.writeFileSync(BOARD,board);
  console.log([STANDALONE,EMBED,BOARD].join('\n'));process.exit(0);
}

if(mode==='check'){
  const file=process.argv[3],kind=process.argv[4]||'standalone';if(!file)throw new Error('Usage: node number-mobile-browser-qa.js check <dumped-html> [standalone|board]');
  const html=fs.readFileSync(file,'utf8'),id=kind==='board'?'nmb-board-qa-result':'nmb-qa-result';
  const re=new RegExp('<div id="'+id+'"[^>]*data-status="([^"]+)"[^>]*data-message="([^"]*)"[^>]*data-detail="([^"]*)"');
  const m=html.match(re),status=m?m[1]:'missing',message=m?m[2]:'Result element missing',detail=m?m[3]:'';
  fs.writeFileSync(kind==='board'?BOARD_REPORT:REPORT,JSON.stringify({status,message,detail,checkedAt:new Date().toISOString()},null,2));
  if(status!=='pass')throw new Error('Number Mobile '+kind+' QA failed: '+(message||status));console.log(message);process.exit(0);
}

throw new Error('Use prepare or check mode.');
