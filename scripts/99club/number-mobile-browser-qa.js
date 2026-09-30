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
<script src="/assets/99club/goodies-app.js"></script>
<script>
(function(){
  function assert(v,m){if(!v)throw new Error(m)}
  function tick(ms=0){return new Promise(r=>setTimeout(r,ms))}
  function result(status,message,detail=''){const el=document.getElementById('nmb-qa-result');el.dataset.status=status;el.dataset.message=message||'';el.dataset.detail=detail||'';el.textContent=status+': '+message}
  function work(){return document.getElementById('gd-stage')?.querySelector('.gd-number-mobile-workbench')||null}
  function tile(id){return work()?.querySelector('[data-ba-token="'+CSS.escape(String(id))+'"]')||null}
  async function run(){
    assert(window.TT99Goodies&&TT99Goodies.numberMobileBalanceVersion==='3.0','Number Mobile v3 adapter is active');
    const card=document.querySelector('[data-tool="balance"]');assert(card,'Number Mobile catalogue card exists');card.click();await tick();await tick();
    assert(work(),'Number Mobile workbench renders');
    let tiles=[...work().querySelectorAll('[data-ba-token]')];assert(tiles.length>=3,'Number Mobile starts with editable number boxes');

    const firstId=String(tiles[0].dataset.baToken);tile(firstId).click();await tick(30);
    assert(work().querySelector('.nmb-keypad'),'Tapping a box opens the number keypad');
    assert(work().querySelector('.nmb-tile-toolbar'),'Selected box exposes persistent direct actions');
    work().querySelector('[data-nmb-close]').click();await tick(20);
    assert(!work().querySelector('.nmb-keypad'),'Closing keypad hides only the keypad');
    assert(work().querySelector('.nmb-tile-toolbar'),'Edit/delete actions remain after keypad closes');

    tile(firstId).click();await tick(30);assert(work().querySelector('.nmb-keypad'),'Tapping the selected box reopens editing');
    const branchButton=work().querySelector('[data-nmb-branch]');assert(branchButton,'Keypad exposes Branch directly');branchButton.click();await tick(60);await tick(60);
    let branch=work().querySelector('.nmb-branch');assert(branch,'Branch creates a visible child mobile');
    assert(branch.querySelector('.nmb-branch-bar'),'Child mobile has its own balance bar');
    assert(branch.querySelectorAll('.nmb-branch-side').length===2,'Child mobile has two hanging sides');
    assert(branch.querySelectorAll('.nmb-branch-cord').length===2,'Child mobile has two visible suspension cords');

    const branchTile=branch.querySelector('[data-ba-token]');assert(branchTile,'Original number box moves onto the child mobile');const branchTileId=String(branchTile.dataset.baToken);tile(branchTileId).click();await tick(30);
    let toolbar=work().querySelector('.nmb-tile-toolbar');assert(toolbar,'Branched box can still be selected');
    const deleteButton=[...toolbar.querySelectorAll('button')].find(b=>b.textContent.trim()==='Delete');assert(deleteButton,'Selected box exposes direct Delete');
    const before=work().querySelectorAll('[data-ba-token]').length;deleteButton.click();await tick(60);await tick(20);
    const after=work().querySelectorAll('[data-ba-token]').length;assert(after===before-1,'Direct Delete removes the selected box');

    const editable=work().querySelector('[data-ba-token]');assert(editable,'Another box remains editable');const editableId=String(editable.dataset.baToken);tile(editableId).click();await tick(30);
    assert(work().querySelector('.nmb-keypad'),'Editing still works after branch/delete redraws');
    result('pass','Number Mobile edit, reopen, branch and delete interactions work without a render loop');
  }
  window.addEventListener('load',()=>setTimeout(()=>run().catch(e=>result('fail',e&&e.message?e.message:String(e),e&&e.stack?e.stack:'')),100));
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
