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
<link rel="stylesheet" href="/assets/99club/goodies-number-mobile-balance-v8.css">
<style>body{margin:0}</style></head><body><div id="tt99-goodies-root"></div><div id="nmb-ux-qa-result" data-status="pending">pending</div>
<script>window.scrollTo=function(){};</script>
<script src="/assets/99club/goodies-core.js"></script><script src="/assets/99club/goodies-interaction.js"></script><script src="/assets/99club/goodies-challenge.js"></script><script src="/assets/99club/goodies-export.js"></script><script src="/assets/99club/goodies-tools-a.js"></script><script src="/assets/99club/goodies-number-line-v6.js"></script><script src="/assets/99club/goodies-tools-b.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v3.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v4.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v6.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v6-blank-bridge.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v7.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v5-embed.js"></script><script src="/assets/99club/goodies-number-mobile-balance-v8.js"></script><script src="/assets/99club/goodies-app.js"></script>
<script>
(function(){
  function assert(v,m){if(!v)throw new Error(m)}
  function tick(ms=0){return new Promise(r=>setTimeout(r,ms))}
  async function waitFor(fn,tries=180,delay=30){for(let i=0;i<tries;i++){const v=fn();if(v)return v;await tick(delay)}return null}
  function result(status,message,detail=''){const el=document.getElementById('nmb-ux-qa-result');el.dataset.status=status;el.dataset.message=message||'';el.dataset.detail=detail||'';el.textContent=status+': '+message}
  function stage(){return document.getElementById('gd-stage')}
  function work(){return stage()?.querySelector('.gd-number-mobile-workbench')||null}
  function sum(root,except=null){return [...(root?.querySelectorAll('[data-ba-token]')||[])].reduce((s,t)=>{if(t===except)return s;const n=Number(t.querySelector('strong')?.textContent);return s+(Number.isFinite(n)?n:0)},0)}
  function expectedFor(tile){const branch=tile.closest('.nmb-branch');if(branch){const side=tile.closest('.nmb-branch-side--right')?'right':'left',other=side==='left'?'right':'left',same=branch.querySelector(':scope > .nmb-branch-sides > .nmb-branch-side--'+side+' > .nmb-branch-children'),opp=branch.querySelector(':scope > .nmb-branch-sides > .nmb-branch-side--'+other+' > .nmb-branch-children');return sum(opp)-sum(same,tile)}const side=tile.closest('.gd-eq-side--right')?'right':'left',other=side==='left'?'right':'left';return sum(work().querySelector('.gd-eq-side--'+other+' .gd-eq-weights'))-sum(work().querySelector('.gd-eq-side--'+side+' .gd-eq-weights'),tile)}
  async function openPicker(level,type){const trigger=await waitFor(()=>work()?.querySelector('[data-nmb-challenge-toggle]'));trigger.click();let pop=await waitFor(()=>work()?.querySelector('.nmb-v5-challenge-popover'));assert(pop,'Challenge picker opens');const difficulty=pop.querySelector('[data-nmb-v6-difficulty="'+level+'"]');assert(difficulty,level+' difficulty exists');difficulty.click();pop=await waitFor(()=>work()?.querySelector('.nmb-v5-challenge-popover [data-nmb-v6-difficulty="'+level+'"].is-active')?.closest('.nmb-v5-challenge-popover'));const choice=pop.querySelector('[data-nmb-v6-type="'+type+'"]');assert(choice,type+' challenge exists');choice.click();assert(document.body.classList.contains('nmb-v7-challenge-building'),'Challenge curtain starts immediately');assert(await waitFor(()=>stage()?.querySelector('.gd-challenge-banner')),'Challenge banner appears');assert(await waitFor(()=>!document.body.classList.contains('nmb-v7-challenge-building')),'Challenge curtain clears only after finished state');assert(await waitFor(()=>document.body.classList.contains('nmb-v8-pupil-challenge')),'Pupil challenge mode activates');return stage().querySelector('.gd-challenge-banner')}
  async function exitChallenge(){const exit=await waitFor(()=>stage()?.querySelector('[data-nmb-v7-exit]'));assert(exit,'Exit challenge exists');exit.click();assert(await waitFor(()=>!stage()?.querySelector('.gd-challenge-banner')),'Exit challenge leaves challenge mode')}
  async function enterPadNumber(pad,value){for(const digit of String(value)){const key=pad.querySelector('[data-nmb-v8-key="'+digit+'"]');assert(key,'Key '+digit+' exists');key.click();await tick(5)}}
  async function run(){
    assert(TT99Goodies.numberMobileChallengeUxVersion==='7.1','Number Mobile v7 challenge UX is active');
    assert(TT99Goodies.numberMobilePupilChallengeVersion==='8.0','Number Mobile v8 pupil challenge UX is active');
    const card=document.querySelector('[data-tool="balance"]');assert(card,'Number Mobile catalogue card exists');card.click();assert(await waitFor(()=>work()),'Number Mobile renders');

    let b=await openPicker('medium','missing-weight');
    assert(b.getBoundingClientRect().height<180,'Desktop challenge banner stays shallow');
    const fixed=await waitFor(()=>[...work().querySelectorAll('[data-ba-token]')].find(t=>t.querySelector('strong')?.textContent.trim()!=='?'));assert(fixed,'Fixed number exists');fixed.click();await tick(80);assert(!work().querySelector('.nmb-keypad,.nmb-tile-toolbar,.nmb-branch-toolbar'),'Fixed challenge numbers never open teacher edit controls');
    const unknown=await waitFor(()=>[...work().querySelectorAll('[data-ba-token]')].find(t=>t.querySelector('strong')?.textContent.trim()==='?'));assert(unknown,'Missing-number box exists');assert(!unknown.disabled,'Missing-number box is the only editable challenge box');
    const expected=expectedFor(unknown);assert(Number.isFinite(expected),'Expected missing value can be derived from the balanced branch');unknown.click();let pad=await waitFor(()=>stage().querySelector('.nmb-v8-answer-pad'));assert(pad,'Question-mark box opens the pupil keypad');assert(!work().querySelector('.nmb-keypad,.nmb-tile-toolbar'),'Teacher keypad and edit toolbar stay hidden');
    const wrong=expected+1;await enterPadNumber(pad,wrong);pad.querySelector('[data-nmb-v8-check]').click();assert(await waitFor(()=>/try again/i.test(stage().querySelector('[data-nmb-v8-feedback]')?.textContent||'')),'Wrong answer gives Try again feedback');
    pad=stage().querySelector('.nmb-v8-answer-pad');for(let i=0;i<String(wrong).length;i++){pad.querySelector('[data-nmb-v8-key="⌫"]').click()}await enterPadNumber(pad,expected);pad.querySelector('[data-nmb-v8-check]').click();assert(await waitFor(()=>/correct/i.test(stage().querySelector('[data-nmb-v8-feedback]')?.textContent||'')),'Correct missing number is confirmed');
    await exitChallenge();assert(await waitFor(()=>!document.body.classList.contains('nmb-v8-pupil-challenge')),'Pupil challenge lock clears on exit');
    const normal=work().querySelector('[data-ba-token]');normal.click();assert(await waitFor(()=>work().querySelector('.nmb-tile-toolbar,.nmb-keypad')),'Normal teacher editing returns after Exit challenge');
    work().dispatchEvent(new MouseEvent('click',{bubbles:true}));await tick(30);

    b=await openPicker('easy','choose-relation');
    assert(b.getBoundingClientRect().height<180,'Compare banner also stays shallow');const panel=await waitFor(()=>stage().querySelector('.nmb-v8-response-panel[data-nmb-v8-response="compare"]'));assert(panel,'Non-missing challenge gets a pupil answer panel');const totals={left:sum(work().querySelector('.gd-eq-side--left .gd-eq-weights')),right:sum(work().querySelector('.gd-eq-side--right .gd-eq-weights'))},rel=totals.left===totals.right?'=':totals.left>totals.right?'>':'<',correct=panel.querySelector('[data-nmb-v8-choice="'+rel+'"]');assert(correct,'Compare challenge presents <, = and > choices');correct.click();assert(await waitFor(()=>/correct/i.test(panel.querySelector('[data-nmb-v8-feedback]')?.textContent||'')),'Correct relation choice is confirmed');
    const compareFixed=work().querySelector('[data-ba-token]');compareFixed.click();await tick(60);assert(!work().querySelector('.nmb-keypad,.nmb-tile-toolbar,.nmb-branch-toolbar'),'Compare challenge remains locked against teacher editing');
    await exitChallenge();result('pass','Pupil challenge mode locks teacher editing, validates answers and keeps the banner compact');
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
