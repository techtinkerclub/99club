'use strict';
const fs=require('fs');
const mode=process.argv[2],HTML='99club-number-mobile-v12-qa.html',REPORT='99club-number-mobile-v12-qa-report.json';
if(mode==='prepare'){
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/assets/99club/goodies.css"><link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v3.css"><link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v4.css"><link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v5.css"><link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v7.css"><link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v8.css"><link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v9.css"><link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v11.css"><link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v12.css"><style>body{margin:0}</style></head><body><div id="tt99-goodies-root"></div><div id="nmb-v12-result" data-status="pending">pending</div>
<script>window.scrollTo=function(){};</script>
<script src="/assets/99club/goodies-core.js"></script><script src="/assets/99club/goodies-interaction.js"></script><script src="/assets/99club/goodies-challenge.js"></script><script src="/assets/99club/goodies-export.js"></script><script src="/assets/99club/goodies-tools-a.js"></script><script src="/assets/99club/goodies-number-line-v6.js"></script><script src="/assets/99club/goodies-tools-b.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v3.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v4.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v6.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v6-blank-bridge.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v7.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v5-embed.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v8.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v9.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v10.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v11.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v12.js"></script><script src="/assets/99club/goodies-app.js"></script>
<script>(function(){
function A(v,m){if(!v)throw new Error(m)}function T(ms=0){return new Promise(r=>setTimeout(r,ms))}async function W(fn,n=320,d=30){for(let i=0;i<n;i++){const v=fn();if(v)return v;await T(d)}return null}function S(){return document.getElementById('gd-stage')}function M(){return S()?.querySelector('.gd-number-mobile-workbench')||null}function R(s,m,d=''){const e=document.getElementById('nmb-v12-result');e.dataset.status=s;e.dataset.message=m||'';e.dataset.detail=d||'';e.textContent=s+': '+m}function labels(actions){return[...actions.querySelectorAll('button')].map(x=>x.textContent.trim())}
async function tidyGeometry(){
  const ready=await W(()=>{
    const b=S()?.querySelector('.gd-challenge-banner'),actions=b?.querySelector('.gd-challenge-actions');if(!b||!actions)return null;
    const l=labels(actions);if(!(l.includes('Change')&&l.includes('Another')&&l.includes('Reveal')&&l.includes('Exit')))return null;
    const br=b.getBoundingClientRect(),ar=actions.getBoundingClientRect();if(ar.bottom>br.bottom+2)return null;
    const panel=S()?.querySelector('.nmb-v8-response-panel'),pr=panel?.getBoundingClientRect();if(!panel||pr.top<br.bottom-2)return null;
    return{b,actions,panel};
  },160,25);
  A(ready,'Current challenge settles to tidy contained Change / Another / Reveal / Exit before pupil interaction');
  return ready;
}
async function run(){
 A(/^12\./.test(String(TT99Goodies.numberMobileChromeVersion||'')),'v12 chrome layer is active');
 A(document.body.classList.contains('gd-embed-page'),'Harness is using the real ?embed=1 lifecycle');
 document.querySelector('[data-tool="balance"]').click();A(await W(()=>M()),'Number Mobile renders in embed mode');
 const trigger=await W(()=>M()?.querySelector('[data-nmb-challenge-toggle]'));A(trigger,'Challenge trigger exists');trigger.click();
 let p=await W(()=>M()?.querySelector('.nmb-v5-challenge-popover'));A(p,'Initial challenge picker opens');p.querySelector('[data-nmb-v6-difficulty="hard"]').click();
 p=await W(()=>M()?.querySelector('.nmb-v5-challenge-popover [data-nmb-v6-difficulty="hard"].is-active')?.closest('.nmb-v5-challenge-popover'));A(p,'Hard difficulty is active');
 p.querySelector('[data-nmb-v6-type="missing-weight"]').click();
 /* Reproduce the embedded simplifier race. The synthetic Explore switch must
    be blocked while the native v6 complex challenge is being assembled. */
 setTimeout(()=>document.querySelector('[data-ba-workflow="explore"]')?.click(),5);
 A(await W(()=>TT99Goodies.numberMobileChallengeSpec?.type==='missing-weight'),'First Hard Missing publishes its challenge spec');
 A(await W(()=>/find both missing numbers/i.test(S()?.querySelector('.gd-challenge-prompt')?.textContent||'')),'Visible first challenge is the requested Hard Missing challenge');
 A(await W(()=>M()?.querySelectorAll('.nmb-branch').length>=2),'Visible first challenge renders two hanging balances');
 A(await W(()=>document.body.classList.contains('nmb-v8-pupil-challenge')),'First Hard Missing reaches pupil mode');
 const spec=TT99Goodies.numberMobileChallengeSpec;A(Object.keys(spec.answerByToken||{}).length===2,'First Hard Missing has two answer targets');A(Number(spec.branchSum)>=14&&Number(spec.branchSum)<=24,'Hard Missing retains the raised number range');A(Array.isArray(spec.layoutSignatures)&&spec.layoutSignatures.length===2,'Hard Missing retains varied branch layouts');
 await tidyGeometry();
 /* Standard path too: this is the live screenshot case where late Another/Exit
    controls previously kept their long labels and overlapped the next panel. */
 const change=S().querySelector('[data-nmb-v9-change]');A(change,'Change button is available');change.click();
 p=await W(()=>M()?.querySelector('.nmb-v5-challenge-popover'));A(p,'Challenge picker reopens');const same=p.querySelector('[data-nmb-v6-type="same-to-both"]');A(same,'Same-to-both challenge is available');same.click();
 A(await W(()=>/both sides|equality/i.test(S()?.querySelector('.gd-challenge-prompt')?.textContent||'')),'Standard challenge replaces Hard Missing');
 await tidyGeometry();
 R('pass','First real embed challenge is visible and challenge chrome is stable for complex and standard paths');
}
window.addEventListener('load',()=>setTimeout(()=>run().catch(e=>R('fail',e?.message||String(e),e?.stack||'')),200));})();</script></body></html>`;fs.writeFileSync(HTML,html);console.log(HTML);process.exit(0)}
if(mode==='check'){const file=process.argv[3];if(!file)throw new Error('Usage: node number-mobile-v12-browser-qa.js check <dumped-html>');const html=fs.readFileSync(file,'utf8'),m=html.match(/<div id="nmb-v12-result"[^>]*data-status="([^"]+)"[^>]*data-message="([^"]*)"[^>]*data-detail="([^"]*)"/),status=m?m[1]:'missing',message=m?m[2]:'Result element missing',detail=m?m[3]:'';fs.writeFileSync(REPORT,JSON.stringify({status,message,detail,checkedAt:new Date().toISOString()},null,2));if(status!=='pass')throw new Error('Number Mobile v12 QA failed: '+(message||status));console.log(message);process.exit(0)}
throw new Error('Use prepare or check mode.');
