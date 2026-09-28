'use strict';

const fs=require('fs');
const mode=process.argv[2];
const HARNESS='99club-goodies-whiteboard-qa.html';
const REPORT='99club-goodies-whiteboard-qa-report.json';

if(mode==='prepare'){
  const html=`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/assets/99club/goodies.css">
</head>
<body>
<div id="tt99-goodies-root"></div>
<div id="gd-whiteboard-qa-result" data-status="pending">pending</div>
<script>
window.__qaFullscreenElement=null;
Object.defineProperty(document,'fullscreenElement',{configurable:true,get:function(){return window.__qaFullscreenElement;}});
Element.prototype.requestFullscreen=function(){
  window.__qaFullscreenElement=this;
  document.dispatchEvent(new Event('fullscreenchange'));
  return Promise.resolve();
};
document.exitFullscreen=function(){
  window.__qaFullscreenElement=null;
  document.dispatchEvent(new Event('fullscreenchange'));
  return Promise.resolve();
};
</script>
<script src="/assets/99club/goodies-core.js"></script>
<script src="/assets/99club/goodies-interaction.js"></script>
<script src="/assets/99club/goodies-challenge.js"></script>
<script src="/assets/99club/goodies-export.js"></script>
<script src="/assets/99club/goodies-tools-a.js"></script>
<script src="/assets/99club/goodies-number-line-v6.js"></script>
<script src="/assets/99club/goodies-tools-b.js"></script>
<script src="/assets/99club/goodies-app.js"></script>
<script>
(function(){
  function assert(value,message){if(!value)throw new Error(message)}
  function tick(){return new Promise(resolve=>setTimeout(resolve,0))}
  function result(status,message,detail){
    const el=document.getElementById('gd-whiteboard-qa-result');
    el.dataset.status=status;el.dataset.message=message||'';el.dataset.detail=detail||'';
    el.textContent=status+': '+(message||'');
  }
  async function run(){
    const cards=[...document.querySelectorAll('[data-tool]')];
    assert(cards.length>=18,'Expected the full Goodies manipulative catalogue');
    const ids=cards.map(x=>x.dataset.tool);
    assert(new Set(ids).size===ids.length,'Goodies catalogue tool ids must be unique');
    assert(window.TT99Goodies&&TT99Goodies.whiteboard,'Shared whiteboard controller is registered');

    const checked=[];
    for(const id of ids){
      const card=document.querySelector('[data-tool="'+id+'"]');
      assert(card,'Catalogue card exists for '+id);
      card.click();
      const sharedPresent=document.getElementById('gd-present');
      const workspace=document.getElementById('gd-workspace');
      const stage=document.getElementById('gd-stage');
      assert(sharedPresent&&workspace&&stage,'Whiteboard shell exists for '+id);
      assert(workspace.dataset.whiteboardSupported==='true','Whiteboard support contract is present for '+id);

      if(id==='number-line'){
        assert(sharedPresent.hidden,'Number Line does not duplicate its bespoke Present control in the shared header');
        const present=document.getElementById('nl-fullscreen');
        assert(present,'Number Line keeps its bespoke Present button');
        present.click();
        await tick();
        assert(document.fullscreenElement===stage||stage.classList.contains('nl-board-fallback'),'Number Line Present delegates to its bespoke whiteboard mode');
        assert(stage.classList.contains('is-board-active')||document.querySelector('.nl-board-ui'),'Number Line whiteboard UI remains available');
        assert(TT99Goodies.whiteboard.isActive(),'Shared whiteboard controller reports bespoke Number Line mode as active');
        TT99Goodies.whiteboard.exit();
        await tick();
        assert(!TT99Goodies.whiteboard.isActive(),'Shared whiteboard controller exits bespoke Number Line mode cleanly');
      }else{
        assert(!sharedPresent.hidden,'Shared Present control is visible for '+id);
        sharedPresent.click();
        await tick();
        assert(workspace.classList.contains('gd-whiteboard-active'),'Shared whiteboard mode activates for '+id);
        assert(document.fullscreenElement===workspace||workspace.classList.contains('gd-whiteboard-fallback'),'Shared whiteboard mode occupies the viewport for '+id);
        const tools=document.getElementById('gd-whiteboard-tools');
        const exit=document.getElementById('gd-whiteboard-exit');
        assert(tools&&exit,'Whiteboard Tools and Exit controls exist for '+id);
        assert(tools.getAttribute('aria-expanded')==='false','Whiteboard Tools starts collapsed for '+id);
        tools.click();
        assert(workspace.classList.contains('gd-whiteboard-tools-open'),'Whiteboard Tools drawer opens for '+id);
        assert(tools.getAttribute('aria-expanded')==='true','Whiteboard Tools exposes expanded state for '+id);
        assert(document.getElementById('gd-controls').getAttribute('aria-hidden')==='false','Whiteboard controls expose accessible visibility for '+id);
        assert(getComputedStyle(document.getElementById('gd-controls')).display!=='none','Existing '+id+' controls remain accessible in whiteboard mode');
        exit.click();
        await tick();
        assert(!workspace.classList.contains('gd-whiteboard-active'),'Whiteboard mode exits cleanly for '+id);
      }
      checked.push(id);
    }

    // Fullscreen API fallback is important on embedded/mobile browsers.
    document.querySelector('[data-tool="maths-canvas"]').click();
    const workspace=document.getElementById('gd-workspace');
    const original=workspace.requestFullscreen;
    workspace.requestFullscreen=function(){return Promise.reject(new Error('fullscreen unavailable'))};
    document.getElementById('gd-present').click();
    await tick();await tick();
    assert(workspace.classList.contains('gd-whiteboard-fallback'),'Shared whiteboard falls back to fixed viewport mode when Fullscreen API fails');
    document.getElementById('gd-whiteboard-exit').click();
    assert(!workspace.classList.contains('gd-whiteboard-fallback'),'Fallback whiteboard mode exits cleanly');
    workspace.requestFullscreen=original;

    result('pass','Whiteboard mode works across all '+checked.length+' manipulatives',checked.join(','));
  }
  window.addEventListener('load',()=>setTimeout(()=>run().catch(err=>result('fail',err&&err.message?err.message:String(err),err&&err.stack?err.stack:'')),100));
})();
</script>
</body>
</html>`;
  fs.writeFileSync(HARNESS,html);
  console.log(HARNESS);
  process.exit(0);
}

if(mode==='check'){
  const file=process.argv[3];
  if(!file)throw new Error('Usage: node goodies-whiteboard-browser-qa.js check <dumped-html>');
  const html=fs.readFileSync(file,'utf8');
  const match=html.match(/<div id="gd-whiteboard-qa-result"[^>]*data-status="([^"]+)"[^>]*data-message="([^"]*)"[^>]*data-detail="([^"]*)"/);
  const status=match?match[1]:'missing',message=match?match[2]:'Result element missing',detail=match?match[3]:'';
  const report={status,message,detail,checkedAt:new Date().toISOString()};
  fs.writeFileSync(REPORT,JSON.stringify(report,null,2));
  if(status!=='pass')throw new Error('Goodies whiteboard QA failed: '+(message||status));
  console.log(message);
  process.exit(0);
}

throw new Error('Use prepare or check mode.');
