'use strict';

const fs=require('fs');
const mode=process.argv[2];
const BOARD='99club-goodies-composition-qa.html';
const EMBED='99club-goodies-embed-qa.html';
const REPORT='99club-goodies-composition-qa-report.json';

function shell(url,bodyScript){
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/assets/99club/goodies.css">
<style>html{scroll-behavior:auto!important}body{margin:0}</style>
</head>
<body>
<div id="tt99-goodies-root"></div>
<div id="gd-composition-qa-result" data-status="pending" data-kind="">pending</div>
<script>history.replaceState(null,'','${url}');window.scrollTo=function(){};</script>
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
${bodyScript}
</script>
</body>
</html>`;
}

if(mode==='prepare'){
  const common=`
function assert(value,message){if(!value)throw new Error(message)}
function tick(ms=0){return new Promise(resolve=>setTimeout(resolve,ms))}
function visible(el){if(!el)return false;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'}
function result(status,kind,message,detail=''){const el=document.getElementById('gd-composition-qa-result');el.dataset.status=status;el.dataset.kind=kind;el.dataset.message=message||'';el.dataset.detail=detail||'';el.textContent=status+': '+message}
function pointer(target,type,x,y,id=1){target.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:id,pointerType:'mouse',button:0,clientX:x,clientY:y}))}
`;

  const boardScript=`(function(){
${common}
async function run(){
  assert(window.TT99Goodies&&TT99Goodies.compositionBoard,'Mixed whiteboard mounts from ?board=1');
  const board=document.getElementById('gd-mixed-board'),palette=document.querySelector('.gd-board-palette'),canvas=document.getElementById('gd-board-canvas');
  assert(board&&palette&&canvas,'Whiteboard shell, palette and canvas exist');
  const tools=[...document.querySelectorAll('[data-board-add]')];
  assert(tools.length===18,'All 18 manipulatives are available as compact palette icons');
  assert(palette.getBoundingClientRect().width<=50,'Left manipulative rail stays narrow');
  assert(getComputedStyle(canvas).backgroundImage.includes('radial-gradient'),'Whiteboard uses a fine dotted canvas');
  assert(getComputedStyle(canvas).backgroundSize==='10px 10px','Whiteboard dot spacing matches the 10px snap grid');
  tools.forEach(button=>{
    const r=button.getBoundingClientRect(),s=getComputedStyle(button);
    assert(r.width<=38&&r.height<=38,'Palette icon stays visually compact: '+button.getAttribute('aria-label'));
    assert(parseFloat(s.borderTopWidth)<=1,'Palette icon does not use a thick contour');
  });

  document.querySelector('[data-board-add="clock"]').click();
  document.querySelector('[data-board-add="money"]').click();
  await tick();
  let objects=[...document.querySelectorAll('[data-board-object]')];
  assert(objects.length===2,'Different manipulatives can coexist on one board');
  assert(TT99Goodies.compositionBoard.objects().length===2,'Board keeps independent object records');
  assert(objects[0].querySelector('iframe').getAttribute('src').includes('?embed=1#clock'),'Clock runs as an isolated live board object');
  assert(objects[1].querySelector('iframe').getAttribute('src').includes('?embed=1#money'),'Money runs as an isolated live board object');

  const money=objects[1];
  assert(money.classList.contains('is-selected'),'Newest object is focused automatically');
  assert(parseFloat(getComputedStyle(money).borderTopWidth)<=1,'Focused object uses only a thin selection outline');
  const context=money.querySelector('[data-board-context]');
  assert(visible(context)&&context.getBoundingClientRect().width<=30,'Focused object exposes only a tiny contextual menu trigger');
  assert(getComputedStyle(money.querySelector('.gd-board-context-menu')).display==='none','Context actions stay hidden until requested');
  context.click();
  assert(visible(money.querySelector('.gd-board-context-menu')),'Context menu opens only after the focused-object button is pressed');
  [...money.querySelectorAll('.gd-board-context-menu button')].forEach(button=>{
    const r=button.getBoundingClientRect();
    assert(r.width<=31&&r.height<=31,'Context action remains compact');
  });

  const settings=money.querySelector('[data-board-settings]');
  settings.click();
  assert(money.classList.contains('has-settings'),'Context Settings opens the manipulative settings overlay');
  assert(!money.classList.contains('has-context-menu'),'Settings closes the transient context menu');
  context.click();
  assert(money.classList.contains('has-context-menu'),'Context menu can be reopened while the object remains focused');
  context.click();
  assert(!money.classList.contains('has-context-menu'),'Context menu can be dismissed without affecting the object');

  const before=TT99Goodies.compositionBoard.objects().find(x=>x.toolId==='money');
  const move=money.querySelector('[data-board-move]');
  pointer(move,'pointerdown',100,100,41);
  pointer(document,'pointermove',137,146,41);
  pointer(document,'pointerup',137,146,41);
  const moved=TT99Goodies.compositionBoard.objects().find(x=>x.toolId==='money');
  assert(moved.x!==before.x||moved.y!==before.y,'Focused object moves from its small drag handle');
  assert(moved.x%10===0&&moved.y%10===0,'Object movement snaps cleanly to the dot grid');

  context.click();
  money.querySelector('[data-board-lock]').click();
  assert(!money.classList.contains('has-context-menu'),'Lock action closes the transient context menu');
  const locked=TT99Goodies.compositionBoard.objects().find(x=>x.toolId==='money');
  const lockedX=locked.x,lockedY=locked.y;
  pointer(move,'pointerdown',100,100,42);
  pointer(document,'pointermove',190,190,42);
  pointer(document,'pointerup',190,190,42);
  const afterLockedDrag=TT99Goodies.compositionBoard.objects().find(x=>x.toolId==='money');
  assert(afterLockedDrag.x===lockedX&&afterLockedDrag.y===lockedY,'Lock prevents accidental whole-object movement');

  const snap=document.getElementById('gd-board-snap');
  snap.click();
  assert(snap.getAttribute('aria-pressed')==='false','Snap can be disabled from a compact board control');
  snap.click();
  assert(snap.getAttribute('aria-pressed')==='true','Snap can be restored');

  const viewport=document.getElementById('gd-board-viewport');
  viewport.scrollLeft=180;viewport.scrollTop=160;
  const panBefore=TT99Goodies.compositionBoard.viewport();
  pointer(canvas,'pointerdown',700,650,44);
  pointer(document,'pointermove',620,580,44);
  pointer(document,'pointerup',620,580,44);
  const panAfter=TT99Goodies.compositionBoard.viewport();
  assert(panAfter.left>panBefore.left&&panAfter.top>panBefore.top,'Dragging empty board space pans the large whiteboard naturally');
  assert(!board.classList.contains('is-panning'),'Board leaves grab state when panning ends');

  context.click();
  money.querySelector('[data-board-delete]').click();
  objects=[...document.querySelectorAll('[data-board-object]')];
  assert(objects.length===1,'Delete removes only the focused manipulative');

  const clock=objects[0];
  const boardRect=canvas.getBoundingClientRect();
  pointer(canvas,'pointerdown',boardRect.left+5,boardRect.top+5,43);
  pointer(document,'pointerup',boardRect.left+5,boardRect.top+5,43);
  assert(!clock.classList.contains('is-selected'),'Touching blank canvas removes object focus');
  assert(getComputedStyle(clock.querySelector('[data-board-context]')).display==='none','Object chrome disappears completely when unfocused');

  if(innerWidth>=900){
    const firstRecord=TT99Goodies.compositionBoard.objects()[0];
    if(firstRecord)TT99Goodies.compositionBoard.remove(firstRecord.id);
    assert(document.querySelectorAll('[data-board-object]').length===0,'All initial test objects can be cleared before the catalogue smoke pass');
    const mounted=[];
    for(const toolButton of tools){
      toolButton.click();
      const record=TT99Goodies.compositionBoard.objects().slice(-1)[0];
      assert(record,'Board creates a record for '+toolButton.getAttribute('aria-label'));
      const frame=document.querySelector('[data-board-object="'+record.id+'"]');
      let ready=false;
      for(let attempt=0;attempt<40;attempt++){
        if(frame?.classList.contains('is-ready')){ready=true;break}
        await tick(50);
      }
      assert(ready,toolButton.getAttribute('aria-label')+' mounts successfully as an isolated live whiteboard object');
      mounted.push(record.toolId);
      TT99Goodies.compositionBoard.remove(record.id);
      await tick();
    }
    assert(mounted.length===tools.length,'Every palette manipulative completed the embedded-object smoke pass');
  }

  result('pass','board','Mixed whiteboard is clean, pannable and all palette tools mount','tools='+tools.length);
}
window.addEventListener('load',()=>setTimeout(()=>run().catch(err=>result('fail','board',err&&err.message?err.message:String(err),err&&err.stack?err.stack:'')),180));
})();`;

  const embedScript=`(function(){
${common}
async function run(){
  assert(document.documentElement.classList.contains('gd-embed-page'),'Embedded manipulative mode is active');
  assert(!window.TT99Goodies.compositionBoard,'Embedded object does not recursively mount the mixed board');
  const shell=document.querySelector('.gd-shell'),stage=document.getElementById('gd-stage'),controls=document.getElementById('gd-controls');
  assert(shell&&stage&&controls,'Embedded manipulative keeps its live stage and controls');
  assert(visible(stage),'Embedded clock stage is visible');
  assert(getComputedStyle(controls).display==='none','Embedded controls are hidden until contextual Settings is requested');
  window.postMessage({type:'tt99-board-settings',open:true},location.origin);
  await tick();
  assert(shell.classList.contains('gd-embed-controls-open'),'Parent Settings message opens the compact contextual controls');
  assert(visible(controls),'Contextual controls become visible');
  const cr=controls.getBoundingClientRect();
  assert(cr.width<=305,'Contextual settings panel stays narrow');
  [...controls.querySelectorAll('.gd-btn,.gd-input:not([type="range"]),.gd-select')].filter(visible).forEach(el=>{
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    assert(r.height<=40,'Embedded control stays visually compact: '+(el.id||el.textContent.trim()));
    assert(parseFloat(s.borderTopWidth)<=1,'Embedded control avoids thick borders');
  });
  window.postMessage({type:'tt99-board-settings',open:false},location.origin);
  await tick();
  assert(getComputedStyle(controls).display==='none','Contextual settings close back to a clean object');
  result('pass','embed','Embedded manipulative controls stay compact and contextual');
}
window.addEventListener('load',()=>setTimeout(()=>run().catch(err=>result('fail','embed',err&&err.message?err.message:String(err),err&&err.stack?err.stack:'')),180));
})();`;

  fs.writeFileSync(BOARD,shell('/goodies/?board=1',boardScript));
  fs.writeFileSync(EMBED,shell('/goodies/?embed=1#clock',embedScript));
  console.log(BOARD+'\n'+EMBED);
  process.exit(0);
}

if(mode==='check'){
  const file=process.argv[3];
  if(!file)throw new Error('Usage: node goodies-composition-browser-qa.js check <dumped-html>');
  const html=fs.readFileSync(file,'utf8');
  const match=html.match(/<div id="gd-composition-qa-result"[^>]*data-status="([^"]+)"[^>]*data-kind="([^"]*)"[^>]*data-message="([^"]*)"[^>]*data-detail="([^"]*)"/);
  const status=match?match[1]:'missing',kind=match?match[2]:'',message=match?match[3]:'Result element missing',detail=match?match[4]:'';
  const report={status,kind,message,detail,checkedAt:new Date().toISOString()};
  fs.writeFileSync(REPORT,JSON.stringify(report,null,2));
  if(status!=='pass')throw new Error('Goodies composition QA failed: '+(message||status));
  console.log(message);
  process.exit(0);
}

throw new Error('Use prepare or check mode.');
