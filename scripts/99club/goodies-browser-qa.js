'use strict';

const fs=require('fs');

const mode=process.argv[2];
const HARNESS='99club-goodies-browser-qa.html';

if(mode==='prepare'){
  const html=`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/assets/99club/goodies.css">
</head>
<body>
<div id="tt99-goodies-root">
  <div id="gd-controls"></div>
  <div id="gd-stage"></div>
  <div id="gd-qa-result" data-status="pending">pending</div>
</div>
<script src="/assets/99club/goodies-core.js"></script>
<script src="/assets/99club/goodies-interaction.js"></script>
<script src="/assets/99club/goodies-tools-b.js"></script>
<script>
(function(){
  function assert(value,message){if(!value)throw new Error(message)}
  function result(status,message){
    const el=document.getElementById('gd-qa-result');
    el.dataset.status=status;
    el.dataset.message=message||'';
    el.textContent=status+': '+(message||'');
  }
  window.addEventListener('load',function(){
    setTimeout(function(){
      try{
        assert(window.TT99Goodies&&TT99Goodies.mathsCanvas,'Maths Canvas is registered');
        assert(TT99Goodies.interaction&&TT99Goodies.interaction.mount,'Interaction controller is registered');
        TT99Goodies.mathsCanvas();

        const add=document.querySelector('[data-mc-add="1"]');
        assert(add,'Number tile palette exists');
        add.click();
        assert(document.querySelectorAll('[data-gd-object]').length===1,'Adding a tile creates one canvas object');

        let tile=document.querySelector('[data-gd-object]');
        const r=tile.getBoundingClientRect();
        tile.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1,button:0,clientX:r.left+10,clientY:r.top+10}));
        tile.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1,button:0,clientX:r.left+10,clientY:r.top+10}));
        assert(document.querySelector('[data-gd-object].is-selected'),'Pointer selection marks the tile selected');

        let duplicate=document.querySelector('[data-gd-action="duplicate"]');
        assert(duplicate&&!duplicate.disabled,'Duplicate action is directly available');
        duplicate.click();
        assert(document.querySelectorAll('[data-gd-object]').length===2,'Duplicate creates a second tile');

        let lock=document.querySelector('[data-gd-action="lock"]');
        assert(lock,'Lock action exists');
        lock.click();
        assert(document.querySelector('[data-gd-object].is-selected.is-locked'),'Lock action locks selected tile');

        lock=document.querySelector('[data-gd-action="lock"]');
        lock.click();
        assert(!document.querySelector('[data-gd-object].is-selected.is-locked'),'Second lock action unlocks selected tile');

        const del=document.querySelector('[data-gd-action="delete"]');
        assert(del&&!del.disabled,'Delete action is directly available');
        del.click();
        assert(document.querySelectorAll('[data-gd-object]').length===1,'Delete removes selected tile');

        const undo=document.querySelector('[data-gd-action="undo"]');
        assert(undo&&!undo.disabled,'Undo becomes available after edits');
        undo.click();
        assert(document.querySelectorAll('[data-gd-object]').length===2,'Undo restores deleted tile');

        const canvas=document.getElementById('mc-canvas');
        assert(canvas&&canvas.classList.contains('has-grid'),'Visible snap grid is enabled');
        assert(getComputedStyle(canvas).touchAction==='pan-y','Empty canvas preserves vertical touch scrolling');

        result('pass','Maths Canvas object interaction works');
      }catch(err){
        result('fail',err&&err.message?err.message:String(err));
      }
    },80);
  });
})();
</script>
</body>
</html>`;
  fs.writeFileSync(HARNESS,html);
  console.log(HARNESS);
  process.exit(0);
}

if(mode==='check'){
  const path=process.argv[3];
  if(!path)throw new Error('Usage: node scripts/99club/goodies-browser-qa.js check <dumped-html>');
  const html=fs.readFileSync(path,'utf8');
  const status=(html.match(/id="gd-qa-result"[^>]*data-status="([^"]+)"/)||[])[1];
  const message=(html.match(/id="gd-qa-result"[^>]*data-status="[^"]+"[^>]*data-message="([^"]*)"/)||[])[1]||'';
  if(status!=='pass')throw new Error('Goodies browser QA failed: '+(message||status||'no result'));
  console.log('Goodies browser QA passed: '+message);
  process.exit(0);
}

throw new Error('Use prepare or check mode.');
