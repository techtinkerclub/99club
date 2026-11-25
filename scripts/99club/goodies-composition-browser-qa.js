'use strict';

const fs=require('fs');
const pageSource=fs.readFileSync('_pages/whiteboard.md','utf8');
// Exercise the exact production asset order, including Number Mobile extensions.
const styleTags=pageSource.split('\n').filter(line=>line.startsWith('<link rel="stylesheet" href="/assets/99club/goodies')).join('\n').replace(/\?v=[^\"]+/g,'');
const scriptTags=pageSource.split('\n').filter(line=>line.startsWith('<script src="/assets/99club/goodies')).map(line=>line.replace(' defer','')).join('\n').replace(/\?v=[^\"]+/g,'');
if(!styleTags||!scriptTags||!scriptTags.includes('goodies-number-mobile.js'))throw new Error('Production Goodies asset manifest is incomplete');

const mode=process.argv[2];
const BOARD='99club-goodies-composition-qa.html';
const EMBED='99club-goodies-embed-qa.html';
const HOST='99club-goodies-embed-host.html';
const REPORT='99club-goodies-composition-qa-report.json';

function shell(url,bodyScript){
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${styleTags}
<style>html{scroll-behavior:auto!important}body{margin:0}</style>
</head>
<body>
<header class="masthead" id="gd-qa-theme-header">Theme header</header>
<div id="tt99-goodies-root"></div>
<footer class="page__footer" id="gd-qa-theme-footer">Theme footer</footer>
<div id="gd-composition-qa-result" data-status="pending" data-kind="" data-message="" data-detail="">pending</div>
<script>history.replaceState(null,'','${url}');window.scrollTo=function(){};${url.includes('board=1')?`window.TT99_GOODIES_BOARD_EMBED_PATH='/${HOST}';`:''}</script>
${scriptTags}
<script>
${bodyScript}
</script>
</body>
</html>`;
}

function embedHost(){
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${styleTags}
<style>html{scroll-behavior:auto!important}body{margin:0}</style>
</head>
<body>
<div id="tt99-goodies-root"></div>
<script>window.scrollTo=function(){};</script>
${scriptTags}
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
  assert(getComputedStyle(document.getElementById('gd-qa-theme-header')).display==='none','Mixed whiteboard hides the site masthead');
  assert(getComputedStyle(document.getElementById('gd-qa-theme-footer')).display==='none','Mixed whiteboard hides the site footer');
  const tools=[...document.querySelectorAll('[data-board-add]')];
  assert(tools.length===25&&new Set(tools.map(button=>button.dataset.boardAdd)).size===25,'All 25 distinct manipulatives are available in the grouped palette');
  assert(palette.getBoundingClientRect().width<=64,'Left category rail stays narrow');
  const groups=[...palette.querySelectorAll('[data-board-group]')],picker=document.getElementById('gd-board-tool-picker');
  assert(groups.length===8&&picker.hidden,'Eight groups replace the long icon list');
  const hub=palette.querySelector('[data-board-add="maths-canvas"]');
  assert(hub&&visible(hub)&&hub.getAttribute('aria-label')==='Add Arithmetic Hub'&&palette.firstElementChild===hub,'Arithmetic Hub is directly available as the first toolbar item');
  const rail=palette.getBoundingClientRect(),br=board.getBoundingClientRect();
  assert(rail.top>=br.top&&rail.bottom<=br.bottom,'Entire toolbar fits the board height');
  assert(getComputedStyle(canvas).backgroundImage.includes('radial-gradient'),'Whiteboard uses a fine dotted canvas');
  assert(getComputedStyle(canvas).backgroundSize==='10px 10px','Whiteboard dot spacing matches the 10px snap grid');
  for(const group of groups){
    group.click();await tick();
    assert(!picker.hidden&&group.getAttribute('aria-expanded')==='true','Category opens a labelled picker: '+group.dataset.boardGroup);
    const visibleTools=tools.filter(el=>picker.contains(el)&&visible(el));assert(visibleTools.length>0&&visibleTools.every(el=>el.closest('[data-board-tool-group]').dataset.boardToolGroup===group.dataset.boardGroup),'Only selected category tools are visible');
    assert(visibleTools.every(el=>el.textContent.trim().length>3&&el.getBoundingClientRect().height>=40),'Picker rows are labelled and touch sized');
    const labels=visibleTools.map(el=>el.querySelector('.gd-board-tool-name')),left=labels[0].getBoundingClientRect().left;
    assert(labels.every(el=>Math.abs(el.getBoundingClientRect().left-left)<1&&getComputedStyle(el).textAlign==='left'&&el.getBoundingClientRect().width>0),'All menu names share a left edge, including wrapped names');
    assert(visibleTools.every(el=>el.querySelector('.gd-board-tool-symbol svg')&&!el.querySelector('.gd-board-tool-plus')),'Consistent outline icons without redundant plus signs');
    const pr=picker.getBoundingClientRect();assert(pr.top>=br.top-1&&pr.bottom<=br.bottom+1&&pr.right<=br.right+1,'Category picker fits board');
    picker.querySelector('[data-board-picker-close]').click();
    assert(picker.hidden,'Picker closes independently');
  }
  // Reflow to a short landscape board; all eight category buttons stay visible.
  const oldHeight=board.style.height;board.style.height='320px';window.dispatchEvent(new Event('resize'));await tick();
  const shortRail=palette.getBoundingClientRect(),shortBoard=board.getBoundingClientRect();
  assert(palette.classList.contains('is-short')&&shortRail.bottom<=shortBoard.bottom+1&&shortRail.top>=shortBoard.top-1,'Compact rail fits a 320px board');
  groups.find(g=>g.dataset.boardGroup==='number').click();await tick();
  assert(picker.getBoundingClientRect().bottom<=shortBoard.bottom+1,'Short-screen picker remains contained');
  picker.querySelector('[data-board-picker-close]').click();board.style.height=oldHeight;window.dispatchEvent(new Event('resize'));await tick();
  groups.find(g=>g.dataset.boardGroup==='measure').click();await tick();
  document.querySelector('[data-board-add="clock"]').click();
  assert(picker.hidden,'Adding a widget closes the picker');
  groups.find(g=>g.dataset.boardGroup==='measure').click();await tick();
  document.querySelector('[data-board-add="money"]').click();
  await tick();
  let objects=[...document.querySelectorAll('[data-board-object]')];
  assert(objects.length===2,'Different manipulatives can coexist on one board');
  assert(TT99Goodies.compositionBoard.objects().length===2,'Board keeps independent object records');
  const clockSrc=objects[0].querySelector('iframe').getAttribute('src');
  assert(clockSrc.includes('?embed=1')&&clockSrc.endsWith('#clock'),'Clock runs as an isolated live board object');
  assert(objects[1].querySelector('iframe').getAttribute('src').includes('?embed=1#money'),'Money runs as an isolated live board object');

  const money=objects[1];
  for(let attempt=0;attempt<40&&!money.classList.contains('is-ready');attempt++)await tick(50);
  assert(money.classList.contains('is-ready'),'Money object reaches embedded ready state');
  assert(money.classList.contains('is-selected'),'Newest object is focused automatically');
  assert(parseFloat(getComputedStyle(money).borderTopWidth)<=1,'Focused object uses only a thin selection outline');
  assert(getComputedStyle(money).backgroundColor==='rgba(0, 0, 0, 0)','Board object frame stays transparent');
  const moneyFrame=money.querySelector('iframe');
  assert(getComputedStyle(moneyFrame).backgroundColor==='rgba(0, 0, 0, 0)','Embedded iframe surface stays transparent');
  assert(parseFloat(getComputedStyle(moneyFrame).borderTopLeftRadius)>=6,'Embedded manipulative surface keeps the same rounded corner treatment as its whiteboard frame');
  const quick=money.querySelector('[data-board-quick-actions]');
  assert(visible(quick),'Focused Money object exposes whiteboard-owned quick actions');
  const addMoney=[...quick.querySelectorAll('button')].find(button=>/Money/.test(button.textContent));
  assert(addMoney&&addMoney.getBoundingClientRect().height<=27,'Money add action is compact and contextual');
  const directDelete=money.querySelector('.gd-board-delete-direct');
  assert(visible(directDelete)&&directDelete.getBoundingClientRect().width<=30,'Focused object keeps delete directly available');
  const cover=money.querySelector('.gd-board-object-cover');cover.focus();
  assert(getComputedStyle(cover).outlineStyle==='none','Selecting an object does not leave a browser focus rectangle');
  const context=money.querySelector('[data-board-context]');
  assert(visible(context)&&context.getBoundingClientRect().width<=30,'Focused object exposes a tiny settings menu trigger');
  assert(getComputedStyle(money.querySelector('.gd-board-context-menu')).display==='none','Context actions stay hidden until requested');
  context.click();
  assert(visible(money.querySelector('.gd-board-context-menu')),'Context menu opens only after the focused-object button is pressed');
  const contextButtons=[...money.querySelectorAll('.gd-board-context-menu button')],visibleContextButtons=contextButtons.filter(visible);
  visibleContextButtons.forEach(button=>{
    const r=button.getBoundingClientRect();
    assert(r.width<=31&&r.height<=31,'Context action remains compact');
  });
  assert(visibleContextButtons.length===2,'Object overflow menu starts with only Settings and Lock when no history is available');
  assert(!money.querySelector('.gd-board-context-menu [data-board-delete]'),'Delete is not duplicated inside the overflow menu');

  const settings=money.querySelector('[data-board-settings]');
  settings.click();await tick();
  const floatingSettings=document.getElementById('gd-board-floating-controls');
  assert(money.classList.contains('has-settings'),'Context Settings marks the manipulative as having active settings');
  assert(visible(floatingSettings)&&/UK money settings/i.test(floatingSettings.textContent),'Context Settings opens a whiteboard-level floating palette outside the widget');
  const floatingRect=floatingSettings.getBoundingClientRect();
  assert(floatingRect.width<=300&&floatingRect.height<=innerHeight*.7,'Floating settings palette stays compact enough to sit beside the maths');
  const floatingHelp=floatingSettings.querySelector('.gd-help:not([role="status"])');
  if(floatingHelp)assert(getComputedStyle(floatingHelp).display==='none','Long instructional help is hidden in the compact whiteboard palette');
  assert(!money.classList.contains('has-context-menu'),'Settings closes the transient context menu');
  const floatingHead=floatingSettings.querySelector('[data-board-controls-drag]'),floatingBefore=floatingSettings.getBoundingClientRect();
  pointer(floatingHead,'pointerdown',floatingBefore.left+30,floatingBefore.top+15,39);
  pointer(document,'pointermove',floatingBefore.left+120,floatingBefore.top+85,39);
  pointer(document,'pointerup',floatingBefore.left+120,floatingBefore.top+85,39);
  const floatingAfter=floatingSettings.getBoundingClientRect();
  assert(Math.abs(floatingAfter.left-floatingBefore.left)>40||Math.abs(floatingAfter.top-floatingBefore.top)>30,'Floating settings palette can be dragged away from the manipulative');
  floatingSettings.querySelector('[data-board-controls-close]').click();await tick();
  assert(!visible(floatingSettings)&&!money.classList.contains('has-settings'),'Floating settings palette closes independently without removing the widget');
  context.click();
  assert(money.classList.contains('has-context-menu'),'Context menu can be reopened while the object remains focused');
  context.click();
  assert(!money.classList.contains('has-context-menu'),'Context menu can be dismissed without affecting the object');

  const beforeScale=TT99Goodies.compositionBoard.objects().find(x=>x.toolId==='money');
  const size=money.querySelector('[data-board-resize]');
  const sizeRect=size.getBoundingClientRect();
  pointer(size,'pointerdown',sizeRect.left+4,sizeRect.top+4,40);
  pointer(document,'pointermove',sizeRect.left-96,sizeRect.top-66,40);
  pointer(document,'pointerup',sizeRect.left-96,sizeRect.top-66,40);
  const scaled=TT99Goodies.compositionBoard.objects().find(x=>x.toolId==='money');
  assert(scaled.scale<beforeScale.scale,'Corner handle scales the whole manipulative down instead of reflowing a tiny webpage');
  assert(Math.abs((scaled.w/scaled.h)-(scaled.baseW/scaled.baseH))<0.02,'Whiteboard object scaling preserves the manipulative aspect ratio');
  assert(parseFloat(getComputedStyle(moneyFrame).width)===scaled.baseW,'Embedded manipulative keeps a stable logical width while the board scales it');

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

  directDelete.click();
  objects=[...document.querySelectorAll('[data-board-object]')];
  assert(objects.length===1,'Direct Delete removes only the focused manipulative');

  document.querySelector('[data-board-add="number-line"]').click();
  await tick();
  const nlRecord=TT99Goodies.compositionBoard.objects().find(x=>x.toolId==='number-line');
  const nlFrame=nlRecord&&document.querySelector('[data-board-object="'+nlRecord.id+'"]');
  for(let attempt=0;attempt<40&&nlFrame&&!nlFrame.classList.contains('is-ready');attempt++)await tick(50);
  assert(nlFrame&&nlFrame.classList.contains('is-ready'),'Number Line reaches embedded ready state');
  const nlQuick=[...nlFrame.querySelectorAll('[data-board-quick-actions] button')];
  const nlLabels=nlQuick.map(button=>button.textContent.trim());
  assert(nlLabels.includes('+ Marker')&&nlLabels.includes('− Item')&&nlLabels.includes('+ Relation')&&nlLabels.includes('+ Line'),'Number Line exposes add/delete Marker, Relationship and Line construction actions directly');
  nlQuick.find(button=>button.textContent.trim()==='+ Marker').click();
  await tick();
  const nlStage=nlFrame.querySelector('iframe').contentDocument.getElementById('gd-stage');
  assert(nlStage.classList.contains('is-add-marker-mode'),'Number Line Marker action immediately enters place-a-marker mode');
  const hint=document.getElementById('gd-board-hint');
  assert(visible(hint)&&/Tap .*number line/i.test(hint.textContent),'Multi-step Number Line action explains what to do next');
  const nlSettings=nlFrame.querySelector('[data-board-settings]');nlSettings.click();await tick();
  const nlDoc=nlFrame.querySelector('iframe').contentDocument;
  assert(nlDoc.querySelector('[data-nl-active-line-top]'),'Expanded Number Line settings keep the active-line selector at the top');
  const nlFloating=document.getElementById('gd-board-floating-controls');
  assert(visible(nlFloating)&&nlFloating.querySelector('[data-nl-active-line-top]'),'Number Line settings are proxied into the floating whiteboard palette');
  nlSettings.click();await tick();
  nlFrame.querySelector('[data-board-quick-actions] button[aria-label="Choose a challenge"]').click();await tick();
  assert(nlFloating.classList.contains('is-challenge-launcher'),'Frame Challenge uses compact launcher styling');
  assert(!nlFloating.querySelector('[data-nl-active-line-top],.nl-workflow-tabs,#nl-generate'),'Quick launcher does not duplicate setup, workflow tabs or Generate');
  assert(nlFloating.querySelector('[data-gd-random-scope="all"]'),'Random all is directly available');
  nlFloating.querySelector('[data-nl-challenge-cat="calculate"]').click();await tick();
  assert(nlFloating.querySelector('[data-gd-random-scope="calculate"]'),'Random category is directly available after one category tap');
  nlFloating.querySelector('[data-nl-challenge-type="jump"]').click();await tick(100);
  assert(!visible(nlFloating),'Choosing a specific question generates and closes in one tap');
  assert(nlDoc.querySelector('.gd-challenge-banner'),'Specific question is generated without separate Generate button');
  nlDoc.querySelector('[data-challenge-action="end"]').click();await tick();
  nlFrame.querySelector('[data-board-quick-actions] button[aria-label="Choose a challenge"]').click();await tick();
  nlFloating.querySelector('[data-board-launcher-settings]').click();await tick();
  assert(!nlFloating.classList.contains('is-challenge-launcher')&&nlFloating.querySelector('.gd-challenge-tabs'),'Full standard and custom challenge settings remain accessible');
  nlFloating.querySelector('[data-board-controls-close]').click();await tick();
  nlDoc.querySelector('[data-nl-workflow="challenge"]').click();
  nlDoc.querySelector('[data-nl-challenge-cat="compare"]').click();
  nlDoc.querySelector('[data-nl-challenge-type="order-markers"]').click();
  nlDoc.getElementById('nl-generate').click();await tick(100);
  const orderInput=nlDoc.querySelector('[data-challenge-response]');orderInput.click();
  const orderPad=nlDoc.querySelector('.gd-touch-keypad');
  const orderAnswer=nlDoc.defaultView.TT99Goodies.lessonState.capture('number-line').model.state.challenge.answer;
  for(const letter of orderAnswer.match(/[ABC]/g))orderPad.querySelector('[data-gd-touch-key="'+letter+'"]').click();
  orderPad.querySelector('[data-gd-touch-check]').click();await tick(100);
  assert(nlDoc.querySelector('.nl-challenge-feedback.is-correct'),'Ordering challenge can be solved entirely using touch letter keys');
  nlDoc.querySelector('[data-challenge-action="end"]').click();await tick();
  // Generate through the actual teacher controls, not a synthetic question.
  nlDoc.querySelector('[data-nl-workflow="challenge"]').click();
  nlDoc.querySelector('[data-nl-challenge-cat="calculate"]').click();
  for(const type of ['jump','missing-start','repeated-jumps']){
    nlDoc.querySelector('[data-nl-challenge-type="'+type+'"]').click();
    nlDoc.getElementById('nl-generate').click();await tick(100);
    const stage=nlDoc.getElementById('gd-stage');
    assert(stage.querySelector('.gd-challenge-kicker').textContent.trim()==='Challenge','Standard challenge heading: '+type);
    assert(stage.querySelectorAll('.nl-challenge-jump').length===0,'Unsolved calculation never draws the answer-bearing jump: '+type);
    assert(stage.querySelectorAll('.nl-svg-marker--challenge-jump').length===1,'Unsolved calculation shows only the known marker: '+type);
    assert(stage.querySelectorAll('[data-challenge-action="end"],[data-nmb-v7-exit]').length===1,'Exactly one challenge exit: '+type);
    const model=nlDoc.defaultView.TT99Goodies.lessonState.capture('number-line').model.state;
    const input=stage.querySelector('[data-challenge-response]');
    input.click();await tick();
    const pad=nlDoc.querySelector('.gd-touch-keypad');
    assert(pad,'Numeric Number Line answer opens the touch keypad');
    pad.querySelector('[data-gd-touch-key="7"]').click();
    assert(input.value==='7','Touch keypad feeds the native answer field');
    pad.querySelector('[data-gd-touch-close]').click();
    input.value=model.challenge.answer;input.dispatchEvent(new nlDoc.defaultView.Event('input',{bubbles:true}));
    stage.querySelector('[data-challenge-check]').click();await tick(100);
    assert(stage.querySelectorAll('.nl-challenge-jump').length>0,'Correct answer shows the worked jump: '+type);
    assert(!stage.querySelector('.gd-challenge-reveal'),'Reveal is redundant after a correct answer: '+type);
    stage.querySelector('[data-challenge-action="end"]').click();await tick(50);
    nlDoc.querySelector('[data-nl-workflow="challenge"]').click();
    nlDoc.querySelector('[data-nl-challenge-cat="calculate"]').click();
  }
  TT99Goodies.compositionBoard.remove(nlRecord.id);

  const firstClockRecord=TT99Goodies.compositionBoard.objects().find(x=>x.toolId==='clock');
  const firstClockFrame=firstClockRecord&&document.querySelector('[data-board-object="'+firstClockRecord.id+'"]');
  for(let attempt=0;attempt<40&&firstClockFrame&&!firstClockFrame.classList.contains('is-ready');attempt++)await tick(50);
  assert(firstClockFrame&&firstClockFrame.classList.contains('is-ready'),'First Clock reaches embedded ready state');
  TT99Goodies.compositionBoard.select(firstClockRecord.id);await tick();
  const firstClockDoc=firstClockFrame.querySelector('iframe').contentDocument;
  assert(firstClockDoc.querySelector('[data-cl-select-stage="0"]').textContent.includes('Clock A'),'First board clock starts as Clock A');
  const firstClockQuick=[...firstClockFrame.querySelectorAll('[data-board-quick-actions] button')];
  const addClockInsideFirst=firstClockQuick.find(button=>button.textContent.trim()==='+ Clock');
  assert(addClockInsideFirst,'Clock exposes Add Clock directly on its whiteboard frame');
  addClockInsideFirst.click();await tick();
  assert(firstClockDoc.querySelectorAll('.gd-clock-card').length===2,'Frame Add Clock creates a comparison clock in the same widget');
  assert(firstClockDoc.querySelector('[data-cl-select-stage="1"]').textContent.includes('Clock B'),'Internal Add Clock allocates Clock B');

  document.querySelector('[data-board-add="clock"]').click();await tick();
  const extraClockRecord=TT99Goodies.compositionBoard.objects().find(x=>x.toolId==='clock'&&String(x.id)!==String(firstClockRecord.id));
  const extraClockFrame=extraClockRecord&&document.querySelector('[data-board-object="'+extraClockRecord.id+'"]');
  for(let attempt=0;attempt<40&&extraClockFrame&&!extraClockFrame.classList.contains('is-ready');attempt++)await tick(50);
  assert(extraClockFrame&&extraClockFrame.classList.contains('is-ready'),'Palette-added Clock reaches embedded ready state');
  const extraClockDoc=extraClockFrame.querySelector('iframe').contentDocument;
  assert(extraClockDoc.querySelector('[data-cl-select-stage="0"]').textContent.includes('Clock C'),'Separate palette Clock uses the next board-wide label, Clock C');
  const clockQuick=[...extraClockFrame.querySelectorAll('[data-board-quick-actions] button')];
  const addClock=clockQuick.find(button=>button.textContent.trim()==='+ Clock');
  assert(addClock,'Separate Clock keeps Add Clock available inside its own widget');
  addClock.click();await tick();
  assert(extraClockDoc.querySelectorAll('.gd-clock-card').length===2,'Separate widget can still add a comparison clock internally');
  assert(extraClockDoc.querySelector('[data-cl-select-stage="1"]').textContent.includes('Clock D'),'Internal Add Clock continues the board-wide sequence with Clock D');
  TT99Goodies.compositionBoard.remove(extraClockRecord.id);

  document.querySelector('[data-board-add="place-value"]').click();await tick();
  const pvRecord=TT99Goodies.compositionBoard.objects().find(x=>x.toolId==='place-value');
  const pvFrame=pvRecord&&document.querySelector('[data-board-object="'+pvRecord.id+'"]');
  for(let attempt=0;attempt<40&&pvFrame&&!pvFrame.classList.contains('is-ready');attempt++)await tick(50);
  assert(pvFrame&&pvFrame.classList.contains('is-ready'),'Place Value reaches embedded ready state');
  assert(pvRecord.baseW>=800,'Place Value receives a wider logical whiteboard frame so column controls have breathing room');
  const pvIframe=pvFrame.querySelector('iframe'),pvDoc=pvIframe.contentDocument,pvWin=pvIframe.contentWindow;
  const pvSettings=pvFrame.querySelector('[data-board-settings]');pvSettings.click();await tick();
  const pvFloating=document.getElementById('gd-board-floating-controls');
  const pvRange=pvFloating.querySelector('#pv-range');
  assert(visible(pvFloating)&&pvRange,'Place Value exposes Visible place range through the floating whiteboard settings palette');
  assert(!pvFloating.querySelector('[data-pv-workflow="challenge"]')&&!pvFloating.querySelector('[data-pv-workflow="export"]'),'Place Value settings palette contains Setup / Teach only; Challenge and Export are not duplicated there');
  const pvTabs=[...pvFloating.querySelectorAll('.pv-mode-tabs>.gd-btn')];
  assert(pvTabs.length===2&&pvTabs.every(button=>getComputedStyle(button).whiteSpace==='nowrap'),'Place Value Setup and Teach/play stay on one compact row without wrapping');
  const pvQuickInput=pvFloating.querySelector('#pv-value');
  assert(pvQuickInput,'Floating Place Value settings exposes Quick setup number');
  pvQuickInput.focus();
  const pvInputNode=pvQuickInput;
  pvQuickInput.value='12';pvQuickInput.dispatchEvent(new Event('input',{bubbles:true}));await tick();
  pvQuickInput.value='123';pvQuickInput.dispatchEvent(new Event('input',{bubbles:true}));await tick();
  assert(document.activeElement===pvInputNode&&pvFloating.querySelector('#pv-value')===pvInputNode,'Quick setup number keeps the same focused input node across multiple keystrokes');
  assert(pvDoc.getElementById('pv-value').value==='123','Floating quick-number typing is forwarded to the live Place Value input without rebuilding the panel');
  pvRange.value='thousands';pvRange.dispatchEvent(new Event('change',{bubbles:true}));await tick();
  assert(pvDoc.getElementById('pv-range').value==='thousands','Changing place range in the floating palette updates the live Place Value widget');
  assert(pvDoc.querySelectorAll('.gd-pv-column').length===4,'Whiteboard Place Value can show a compact 1,000 → 1 four-column board');
  pvSettings.click();await tick();

  let pvQuick=[...pvFrame.querySelectorAll('[data-board-quick-actions] button')];
  const challengePV=pvQuick.find(button=>/^Challenge/.test(button.textContent.trim()));
  assert(challengePV,'Place Value exposes Challenge as a direct whiteboard frame action');
  const pvOriginal=JSON.stringify(pvDoc.defaultView.TT99Goodies.lessonState.capture('place-value').model.diagram);
  challengePV.click();await tick();
  assert(visible(pvFloating),'Frame Challenge opens the common challenge picker');
  assert(!pvDoc.querySelector('.gd-pv-activity--game'),'Opening Challenge does not replace the teaching board');
  pvFloating.querySelector('[data-gd-native-random="all"]').click();await tick();
  assert(!visible(pvFloating),'Generating a challenge closes the picker');
  const pvGame=pvDoc.querySelector('.gd-pv-activity--game');
  assert(pvGame,'Random-all generates an active Place Value pupil task');
  assert(pvGame.classList.contains('gd-native-challenge'),'Place Value uses the shared challenge presentation');
  assert(pvGame.querySelector('.gd-pv-activity-head span').textContent.trim()==='CHALLENGE','Place Value uses the common challenge heading');
  assert(pvGame.querySelector('[data-pv-activity-exit]'),'Place Value has a direct challenge exit');
  const pvRepresentationView=pvDoc.querySelector('.gd-pv-board-wrap,.gd-pv-abacus');
  const pvChallengeGap=Math.round(pvRepresentationView.getBoundingClientRect().top-pvGame.getBoundingClientRect().bottom);
  assert(pvChallengeGap>=6&&pvChallengeGap<=16,'Place Value challenge card keeps a small fixed gap before the table: '+pvChallengeGap+'px');
  const livePvRecord=()=>TT99Goodies.compositionBoard.objects().find(x=>String(x.id)===String(pvRecord.id));
  const pvBaseBeforeProbe=livePvRecord().baseH;
  const pvFitProbe=pvDoc.createElement('div');
  pvFitProbe.style.height='220px';pvFitProbe.style.minHeight='220px';pvFitProbe.style.flex='0 0 220px';pvFitProbe.style.width='10px';
  pvDoc.getElementById('gd-stage').appendChild(pvFitProbe);
  pvFitProbe.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  await tick(180);
  const pvBaseWithProbe=livePvRecord().baseH;
  assert(pvBaseWithProbe>pvBaseBeforeProbe+150,'Place Value auto-fit grows when real embedded content becomes taller: '+pvBaseBeforeProbe+' → '+pvBaseWithProbe+' (probe '+pvFitProbe.getBoundingClientRect().height+'px)');
  pvFitProbe.remove();
  pvDoc.getElementById('gd-stage').dispatchEvent(new MouseEvent('click',{bubbles:true}));
  await tick(180);
  assert(livePvRecord().baseH<pvBaseWithProbe-150,'Place Value auto-fit shrinks again after tall content is removed');
  const pvChallengeKinds=['build','exact','regroup','same','read','hidden','digit','add'];
  assert(pvChallengeKinds.includes(pvGame.dataset.pvActivityKind),'Random frame Challenge chooses from the full pupil-task set');
  assert(pvDoc.querySelector('[data-pv-activity-check]')&&pvDoc.querySelector('[data-pv-activity-another]'),'Generated pupil challenge exposes Check and Another directly on the board');
  if(['build','exact'].includes(pvGame.dataset.pvActivityKind))assert(pvDoc.querySelectorAll('[data-gd-object]').length===0,'Build/Exact random challenges start with an empty pupil board');
  else if(pvGame.dataset.pvActivityKind==='add'){
    const model=pvWin.TT99Goodies.lessonState.capture('place-value').model;
    const originalMode=JSON.parse(pvOriginal).representationMode;
    const mode=model.diagram.representationMode;
    assert(mode===originalMode,'Random Addition preserves the teacher-selected representation');
    assert((mode==='abacus'||mode==='both')===!!pvDoc.querySelector('.gd-pv-abacus'),'Addition shows the selected bead representation');
    assert((mode==='counters'||mode==='both')===!!pvDoc.querySelector('.gd-pv-board-wrap'),'Addition shows the selected counter representation');
    const displayed=Number((pvDoc.getElementById('pv-total').textContent||'').replace(/,/g,''));
    assert(Number.isFinite(model.additionA)&&displayed===model.additionA,'Random Addition starts from the exact first addend');
    if(mode!=='abacus')assert(pvDoc.querySelectorAll('#pv-canvas [data-gd-object]').length===model.paperActivityStart.reduce((a,b)=>a+b,0),'Addition renders every starting counter');
    if(mode!=='counters')assert([...pvDoc.querySelectorAll('.gd-pv-abacus-rod')].every((rod,i)=>rod.querySelectorAll('.gd-pv-abacus-bead.is-active').length===model.paperActivityStart[i]),'Addition renders the starting digits on the bead frame');
  }
  else assert(pvDoc.querySelectorAll('[data-gd-object]').length>0,'Interpret/regroup/same-value random challenges start with a meaningful board representation');

  const challengeKindBefore=pvGame.dataset.pvActivityKind;
  const challengePromptBefore=pvGame.querySelector('.gd-pv-activity-head strong')?.textContent||'';
  const challengeObjectsBefore=pvDoc.querySelectorAll('[data-gd-object]').length;
  let pvChallengeExportSvg=null;
  const pvOldChallengeSvg=pvWin.TT99Goodies.exportTools.downloadSvg;
  pvWin.TT99Goodies.exportTools.downloadSvg=(svg)=>{pvChallengeExportSvg=svg.cloneNode(true)};
  const pvChallengeExportButton=pvFrame.querySelector('[data-board-export]');
  pvChallengeExportButton.click();await tick();
  pvFrame.querySelector('[data-board-export-menu] [data-board-export-kind="svg"]').click();await tick();
  const challengeGameAfterExport=pvDoc.querySelector('.gd-pv-activity--game');
  assert(pvChallengeExportSvg&&pvChallengeExportSvg.dataset.worksheetCard==='1','Frame share export produces a worksheet for the current active Place Value challenge');
  assert(challengeGameAfterExport&&challengeGameAfterExport.dataset.pvActivityKind===challengeKindBefore,'Frame share export does not replace the current Place Value challenge');
  assert((challengeGameAfterExport.querySelector('.gd-pv-activity-head strong')?.textContent||'')===challengePromptBefore,'Frame share export preserves the exact current challenge prompt');
  assert(pvDoc.querySelectorAll('[data-gd-object]').length===challengeObjectsBefore,'Frame share export preserves the current challenge representation');
  pvWin.TT99Goodies.exportTools.downloadSvg=pvOldChallengeSvg;

  pvDoc.querySelector('[data-pv-activity-exit]').click();await tick();
  const restoredPV=pvDoc.defaultView.TT99Goodies.lessonState.capture('place-value').model.diagram;
  const initialPV=JSON.parse(pvOriginal);
  const pvCounts=d=>d.tokens.reduce((out,t)=>(out[t.place]=(out[t.place]||0)+1,out),{});
  assert(JSON.stringify(pvCounts(restoredPV))===JSON.stringify(pvCounts(initialPV))&&restoredPV.representationMode===initialPV.representationMode,'Exit challenge restores original Place Value representation and counts');
  const repControls=[...pvDoc.querySelectorAll('[data-pv-representation]')];
  assert(repControls.length===3,'Whiteboard Place Value settings exposes Counters / Abacus / Both');
  pvDoc.querySelector('[data-pv-representation="abacus"]').click();await tick();
  assert(pvDoc.querySelector('.gd-pv-abacus')&&!pvDoc.querySelector('.gd-pv-board-wrap'),'Whiteboard can switch the live Place Value widget into Abacus mode');
  pvDoc.querySelector('[data-pv-representation="both"]').click();await tick();
  assert(pvDoc.querySelector('.gd-pv-abacus')&&pvDoc.querySelector('.gd-pv-board-wrap'),'Whiteboard Both mode renders linked counters and abacus together');
  pvDoc.querySelector('[data-pv-representation="counters"]').click();await tick();
  const pvSetupValue=pvDoc.getElementById('pv-value');
  pvSetupValue.value='20';
  pvDoc.getElementById('pv-build').click();await tick();

  let pvExportSvg=null,pvExportName='';
  const pvOldSvg=pvWin.TT99Goodies.exportTools.downloadSvg;
  pvWin.TT99Goodies.exportTools.downloadSvg=(svg,name)=>{pvExportSvg=svg.cloneNode(true);pvExportName=name};
  const pvExportButton=pvFrame.querySelector('[data-board-export]');
  assert(pvExportButton,'Selected Place Value frame has a dedicated paper-export button');
  pvExportButton.click();await tick();
  const pvExportMenu=pvFrame.querySelector('[data-board-export-menu]');
  assert(visible(pvExportMenu)&&pvExportMenu.querySelector('[data-board-export-kind="svg"]'),'Frame export opens compact Copy / PNG / SVG / Print choices');
  pvExportMenu.querySelector('[data-board-export-kind="svg"]').click();await tick();
  assert(pvExportSvg&&pvExportSvg.dataset.pvExport==='board'&&/place-value/.test(pvExportName),'Frame SVG export delegates to the live clean Place Value export rather than capturing whiteboard chrome');
  pvWin.TT99Goodies.exportTools.downloadSvg=pvOldSvg;

  const pvTens=[...pvDoc.querySelectorAll('[data-gd-object][data-pv-place="2"]')][0]||[...pvDoc.querySelectorAll('[data-gd-object]')].find(el=>Number(el.dataset.pvPlace)<pvDoc.querySelectorAll('.gd-pv-column').length-1);
  const pvr=pvTens.getBoundingClientRect();
  pointer(pvTens,'pointerdown',pvr.left+pvr.width/2,pvr.top+pvr.height/2,55);
  pointer(pvTens,'pointerup',pvr.left+pvr.width/2,pvr.top+pvr.height/2,55);await tick(100);
  pvQuick=[...pvFrame.querySelectorAll('[data-board-quick-actions] button')];
  const splitPV=pvQuick.find(button=>button.textContent.includes('Split 1→10'));
  assert(splitPV,'Place Value exposes Split 1→10 directly on the selected whiteboard widget');
  const pvBefore=Number((pvDoc.getElementById('pv-total').textContent||'').replace(/,/g,''));
  splitPV.click();await tick();
  const pvAfterSplit=Number((pvDoc.getElementById('pv-total').textContent||'').replace(/,/g,''));
  assert(Math.abs(pvAfterSplit-pvBefore)<0.00001,'Whiteboard Split 1→10 preserves represented value');
  pvQuick=[...pvFrame.querySelectorAll('[data-board-quick-actions] button')];
  const exchangePV=pvQuick.find(button=>button.textContent.includes('Exchange 10→1'));
  assert(exchangePV,'After splitting, Place Value exposes Exchange 10→1 directly on the frame');
  exchangePV.click();await tick();
  const pvAfterExchange=Number((pvDoc.getElementById('pv-total').textContent||'').replace(/,/g,''));
  assert(Math.abs(pvAfterExchange-pvBefore)<0.00001,'Whiteboard Exchange 10→1 restores the grouped representation without changing value');

  const fakeReveal=pvDoc.createElement('button');
  fakeReveal.type='button';fakeReveal.dataset.boardAction='reveal';fakeReveal.textContent='Reveal answer';
  fakeReveal.style.position='fixed';fakeReveal.style.left='-9999px';fakeReveal.style.top='0';
  fakeReveal.onclick=()=>{fakeReveal.textContent=fakeReveal.textContent.includes('Reveal')?'Hide answer':'Reveal answer'};
  pvDoc.body.appendChild(fakeReveal);
  pvDoc.body.dispatchEvent(new MouseEvent('click',{bubbles:true}));await tick();
  pvQuick=[...pvFrame.querySelectorAll('[data-board-quick-actions] button')];
  const revealPV=pvQuick.find(button=>/Reveal answer/i.test(button.textContent));
  assert(revealPV,'Place Value whiteboard bridge exposes a live Reveal answer target as a direct frame action');
  revealPV.click();await tick();
  pvQuick=[...pvFrame.querySelectorAll('[data-board-quick-actions] button')];
  assert(pvQuick.some(button=>/Hide answer/i.test(button.textContent)),'Whiteboard answer action mirrors the live Reveal / Hide state');
  fakeReveal.remove();
  pvDoc.body.dispatchEvent(new MouseEvent('click',{bubbles:true}));await tick();
  TT99Goodies.compositionBoard.remove(pvRecord.id);

  document.querySelector('[data-board-add="abacus"]').click();await tick();
  const abRecord=TT99Goodies.compositionBoard.objects().find(x=>x.toolId==='abacus');
  const abFrame=abRecord&&document.querySelector('[data-board-object="'+abRecord.id+'"]');
  for(let attempt=0;attempt<40&&abFrame&&!abFrame.classList.contains('is-ready');attempt++)await tick(50);
  assert(abFrame&&abFrame.classList.contains('is-ready'),'Classical Abacus reaches embedded ready state');
  assert(abRecord.baseW>=740,'Abacus receives enough width for the place-value rods');
  const abIframe=abFrame.querySelector('iframe'),abDoc=abIframe.contentDocument,abWin=abIframe.contentWindow;
  assert(abDoc.querySelector('.gd-ab-frame--western')&&abDoc.querySelectorAll('[data-ab-col]').length===5&&abDoc.querySelectorAll('[data-ab-bead]').length===50,'Whiteboard Abacus renders five Western rows of ten physical beads');

  const abSettings=abFrame.querySelector('[data-board-settings]');abSettings.click();await tick();
  const abFloating=document.getElementById('gd-board-floating-controls');
  assert(visible(abFloating)&&abFloating.querySelector('#ab-rows')&&abFloating.querySelector('#ab-kind'),'Abacus exposes place-value column and instrument settings on the whiteboard');
  const visibleAbWorkflows=[...abFloating.querySelectorAll('[data-ab-workflow]')].filter(visible).map(b=>b.textContent.trim());
  assert(visibleAbWorkflows.includes('Setup')&&visibleAbWorkflows.includes('Teach / play')&&!visibleAbWorkflows.includes('Challenge')&&!visibleAbWorkflows.includes('Export'),'Embedded Abacus keeps Setup / Teach controls and removes duplicate Challenge / Export tabs');
  abSettings.click();await tick();

  abDoc.querySelector('[data-ab-bead="4:unit:0"]').click();await tick();
  assert(Number(abDoc.querySelector('[data-ab-total]').textContent)===1,'Whiteboard Western abacus moves its ones bead into the counted group');
  let abQuick=[...abFrame.querySelectorAll('[data-board-quick-actions] button')];
  const abClear=abQuick.find(button=>button.textContent.trim()==='Clear');
  assert(abClear,'Whiteboard Abacus exposes a contextual Clear frame action');
  abClear.click();await tick();
  assert(Number(abDoc.querySelector('[data-ab-total]').textContent)===0,'Whiteboard frame Clear resets every place-value row');
  abQuick=[...abFrame.querySelectorAll('[data-board-quick-actions] button')];
  const challengeAb=abQuick.find(button=>/^Challenge/.test(button.textContent.trim()));
  assert(challengeAb,'Abacus exposes a direct random Challenge frame action');
  abDoc.querySelector('[data-ab-bead="4:unit:2"]').click();await tick();
  const originalAb=abWin.TT99Goodies.lessonState.capture('abacus').model.counts;
  challengeAb.click();await tick();
  const abPicker=document.getElementById('gd-board-floating-controls')||document.querySelector('.gd-board-floating-controls');
  assert(abDoc.querySelector('[data-gd-native-random="all"]'),'Frame Challenge opens Abacus random and category options');
  abPicker.querySelector('[data-gd-native-random="all"]').click();await tick();
  assert(abDoc.querySelector('.gd-ab-task'),'Random-all starts an Abacus pupil task');
  assert(abDoc.querySelector('[data-ab-total]').textContent.trim()==='?','Abacus pupil challenge hides the live total');

  let abExportSvg=null,abExportName='';
  const abOldSvg=abWin.TT99Goodies.exportTools.downloadSvg;
  abWin.TT99Goodies.exportTools.downloadSvg=(svg,name)=>{abExportSvg=svg.cloneNode(true);abExportName=name};
  const abExportButton=abFrame.querySelector('[data-board-export]');
  assert(abExportButton,'Abacus uses the universal whiteboard export control');
  abExportButton.click();await tick();
  const abExportMenu=abFrame.querySelector('[data-board-export-menu]');
  abExportMenu.querySelector('[data-board-export-kind="svg"]').click();await tick();
  assert(abExportSvg&&abExportSvg.dataset.worksheetCard==='1'&&abExportSvg.querySelector('[data-ab-export-frame="1"]'),'Abacus frame export produces a clean worksheet containing the new place-value frame');
  assert(/^abacus-/.test(abExportName),'Abacus whiteboard export has a reusable filename');
  abWin.TT99Goodies.exportTools.downloadSvg=abOldSvg;
  abDoc.querySelector('[data-ab-exit]').click();await tick();
  assert(JSON.stringify(abWin.TT99Goodies.lessonState.capture('abacus').model.counts)===JSON.stringify(originalAb),'Exiting Abacus challenge restores original bead arrangement');
  const deviceSelector=abDoc.getElementById('ab-kind');deviceSelector.value='pascaline';deviceSelector.dispatchEvent(new abWin.Event('change',{bubbles:true}));await tick();
  const pascalOriginal=abWin.TT99Goodies.lessonState.capture('abacus').model;
  abDoc.querySelector('[data-ab-history-operation="subtract"]').click();await tick();
  let pascalTask=abWin.TT99Goodies.lessonState.capture('abacus').model.historyChallenge;
  assert(pascalTask.operation==='subtract'&&pascalTask.start-pascalTask.amount===pascalTask.target,'Pascaline subtraction launcher produces valid subtraction');
  abDoc.querySelector('[data-ab-history-another]').click();await tick();
  pascalTask=abWin.TT99Goodies.lessonState.capture('abacus').model.historyChallenge;
  assert(pascalTask.operation==='subtract','Another retains subtraction scope');
  abDoc.querySelector('[data-ab-history-reveal]').click();await tick();
  assert(abDoc.querySelector('[data-ab-history-check]').disabled&&!abDoc.querySelector('[data-ab-history-reveal]'),'Revealed historical challenge does not offer redundant checking');
  abDoc.querySelector('[data-ab-history-end]').click();await tick();
  const restoredPascal=abWin.TT99Goodies.lessonState.capture('abacus').model;
  assert(JSON.stringify(restoredPascal.pascalDigits)===JSON.stringify(pascalOriginal.pascalDigits)&&restoredPascal.pascalOperation===pascalOriginal.pascalOperation,'Exit restores original Pascaline state');
  TT99Goodies.compositionBoard.remove(abRecord.id);

  document.querySelector('[data-board-add="randomiser"]').click();await tick();
  const randomRecord=TT99Goodies.compositionBoard.objects().find(x=>x.toolId==='randomiser');
  const randomFrame=randomRecord&&document.querySelector('[data-board-object="'+randomRecord.id+'"]');
  for(let attempt=0;attempt<40&&randomFrame&&!randomFrame.classList.contains('is-ready');attempt++)await tick(50);
  const go=[...randomFrame.querySelectorAll('[data-board-quick-actions] button')].find(button=>/Roll|Spin|Go/i.test(button.textContent));
  assert(go,'Dice / Spinner exposes its primary Roll or Spin action directly on the frame');
  const randomIframe=randomFrame.querySelector('iframe'),randomWin=randomIframe.contentWindow;
  let randomExportSvg=null,randomExportName='';
  const randomOldSvg=randomWin.TT99Goodies.exportTools.downloadSvg;
  randomWin.TT99Goodies.exportTools.downloadSvg=(svg,name)=>{randomExportSvg=svg.cloneNode(true);randomExportName=name};
  const randomExportButton=randomFrame.querySelector('[data-board-export]');
  assert(randomExportButton,'Randomiser uses the universal frame export control');
  randomExportButton.click();await tick();
  const randomExportMenu=randomFrame.querySelector('[data-board-export-menu]');
  randomExportMenu.querySelector('[data-board-export-kind="svg"]').click();await tick();
  assert(randomExportSvg&&/randomiser-dice/.test(randomExportName),'Randomiser frame export produces a clean vector paper result');
  randomWin.TT99Goodies.exportTools.downloadSvg=randomOldSvg;
  assert(TT99Goodies.publishing.supports('randomiser')&&!TT99Goodies.publishing.canGenerate('randomiser'),'Randomiser is available for current illustration capture only');
  randomExportButton.click();await tick();
  assert(randomExportMenu.querySelector('[data-board-export-kind="add-document"]')&&!randomExportMenu.querySelector('[data-board-export-kind="generate-document"]'),'Randomiser offers current item publishing without unsupported challenge generation');
  randomExportMenu.querySelector('[data-board-export-kind="add-document"]').click();await tick();
  const publisher=document.getElementById('gd-publishing-editor');
  assert(publisher.open&&publisher.querySelector('.gd-pub-preview svg')?.textContent.includes('Dice result'),'Randomiser illustration appears in the shared worksheet preview');
  publisher.querySelector('[data-pub-teacher]').click();await tick();
  assert(!publisher.querySelector('[data-worksheet-answer="annex"]'),'An illustration alone does not create a spurious answer annex');
  publisher.querySelector('[data-pub-builder]').click();await tick();
  const randomSource=publisher.querySelector('[data-pub-add-source="randomiser"]');
  assert(randomSource.disabled&&randomSource.textContent.includes('Current item only'),'Automatic builder explains why Randomiser is not a challenge source');
  publisher.querySelector('[data-pub-back]').click();await tick();
  publisher.querySelector('[data-pub-remove]').click();await tick();
  publisher.querySelector('[data-pub-close]').click();
  TT99Goodies.compositionBoard.remove(randomRecord.id);
  // Review navigation and print versions use the actual generated page set.
  {
    const P=TT99Goodies.publishing,draft=P.createDocument();
    draft.generate('geoboard',{gridSize:9},1,'build-area',()=>0.15);
    draft.generate('times-table',{},1,'find-total',()=>0.2);
    P.openEditor(draft);
    const dialog=document.getElementById('gd-publishing-editor');
    assert(dialog.querySelector('.gd-pub-review-count').textContent.includes('2 / 80'),'Review shows the document item count');
    assert(!dialog.querySelector('.gd-pub-sheet.is-annex')&&dialog.querySelector('[data-pub-jump-answers]').hidden,'Pupil version contains no annex');
    dialog.querySelector('[data-pub-teacher]').click();await tick();
    const annex=dialog.querySelector('.gd-pub-sheet.is-annex');
    assert(annex&&!annex.querySelector('.gd-pub-action-rail'),'Annex preview has no duplicate question editing controls');
    assert(!dialog.querySelector('[data-pub-jump-answers]').hidden,'Teacher view offers direct annex navigation');
    dialog.querySelector('[data-pub-jump-answers]').click();
    assert(dialog.querySelector('[data-pub-page]').selectedOptions[0].textContent.startsWith('Answers'),'Page selector navigates to annex');
    dialog.querySelector('[data-pub-zoom="large"]').click();
    assert(dialog.querySelector('.gd-pub-preview.is-large'),'Large preview mode is available');
    dialog.querySelector('[data-pub-pupil]').click();await tick();
    assert(!dialog.querySelector('.gd-pub-sheet.is-annex')&&dialog.querySelector('[data-pub-page]').value==='1','Switching back to pupil resets page navigation');
    dialog.querySelector('[data-pub-zoom="fit"]').click();
    dialog.querySelector('[data-pub-close]').click();await tick();
  }

  // Automatic builder supports search, independent sets and visible validation.
  {
    const P=TT99Goodies.publishing,draft=P.createDocument();
    P.openEditor(draft,{mode:'builder'});
    const dialog=document.getElementById('gd-publishing-editor');
    const search=dialog.querySelector('[data-pub-search]');
    search.value='geoboard';search.dispatchEvent(new Event('input',{bubbles:true}));
    assert(dialog.querySelectorAll('[data-pub-add-source]').length===1,'Catalogue search filters widgets');
    dialog.querySelector('[data-pub-add-source="geoboard"]').click();
    dialog.querySelector('[data-pub-add-source="geoboard"]').click();
    let sets=dialog.querySelectorAll('[data-pub-block]');
    assert(sets.length===2&&sets[0].querySelector('.gd-pub-source-content').hidden&&!sets[1].querySelector('.gd-pub-source-content').hidden,'Repeated widget sets are independent and prior sets collapse');
    sets[0].querySelector('[data-pub-toggle-block]').click();
    sets=dialog.querySelectorAll('[data-pub-block]');
    assert(!sets[0].querySelector('.gd-pub-source-content').hidden,'Source settings can be reopened');
    sets[0].querySelector('[data-pub-no-types]').click();
    assert(dialog.querySelector('[data-pub-generate]').disabled&&dialog.querySelector('.gd-pub-source.is-invalid'),'Builder prevents generation when a set has no question types');
    dialog.querySelector('[data-pub-block] [data-pub-all-types]').click();
    assert(!dialog.querySelector('[data-pub-generate]').disabled,'Selecting compatible types restores the action');
    const searchAgain=dialog.querySelector('[data-pub-search]');searchAgain.value='';searchAgain.dispatchEvent(new Event('input',{bubbles:true}));
    assert(dialog.querySelectorAll('[data-pub-add-source]').length===25,'Clearing search restores the full catalogue');
    dialog.querySelector('[data-pub-collapse-all]').click();
    assert([...dialog.querySelectorAll('.gd-pub-source-content')].every(el=>el.hidden),'Collapse all preserves sets while hiding settings');
    const counts=dialog.querySelectorAll('[data-pub-count]');counts[0].value='1';counts[0].dispatchEvent(new Event('change',{bubbles:true}));
    const second=dialog.querySelectorAll('[data-pub-count]')[1];second.value='1';second.dispatchEvent(new Event('change',{bubbles:true}));
    assert(dialog.querySelector('.gd-pub-draft-total').textContent.includes('2 / 80'),'Builder shows total capacity');
    dialog.querySelector('[data-pub-generate]').click();await tick();
    assert(draft.list().length===2,'Independent sets generate into one draft');
    dialog.querySelector('[data-pub-close]').click();await tick();
  }

  // Manual and automatic publishing share selection and validation.
  {
    const P=TT99Goodies.publishing,draft=P.createDocument();
    P.openQuickGenerate(draft,'geoboard',{gridSize:9,responseLines:2});
    const dialog=document.querySelector('.gd-publishing-generate');
    assert(dialog.open&&dialog.querySelectorAll('[data-pub-quick-type]:checked').length===6,'Quick publisher starts with all compatible types selected');
    dialog.querySelector('[data-pub-quick-none]').click();
    assert(dialog.querySelector('[data-pub-quick-add]').disabled,'Cannot generate without selected types');
    const type=dialog.querySelector('[data-pub-quick-type][value="build-area"]');type.click();
    const count=dialog.querySelector('[name=count]');count.value='1';count.dispatchEvent(new Event('change',{bubbles:true}));
    assert(!dialog.querySelector('[data-pub-quick-add]').disabled&&dialog.querySelector('[data-pub-quick-add]').textContent==='Add 1 question','Quick publisher updates its count and action');
    dialog.querySelector('[data-pub-quick-add]').click();await tick();
    assert(draft.list().length===1&&draft.list()[0].data.type==='build-area'&&draft.list()[0].data.diagram.gridSize===9,'Quick publisher uses selected family and preserves live grid settings');
    document.getElementById('gd-publishing-editor').querySelector('[data-pub-close]').click();await tick();
  }

  // Geoboard paper generation uses exactly the selected pin count.
  {
    const P=TT99Goodies.publishing,G=TT99Goodies.geoboardPaperModel;
    assert(P.canGenerate('geoboard')&&G.types().length===6,'Geoboard supports all six publication families');
    const draft=P.createDocument();
    for(const {id} of G.types())draft.generate('geoboard',{gridSize:11,responseLines:2},1,id,()=>0.15);
    const items=draft.list(),build=items.find(item=>item.data.type==='build-area');
    const pupil=P.renderItem(build,false),teacher=P.answerGraphic(build);
    assert(pupil.querySelectorAll('[data-ge-paper-pin]').length===121&&teacher.querySelectorAll('[data-ge-paper-pin]').length===121,'11 by 11 grid renders exactly 121 pins');
    assert(!pupil.querySelector('[data-ge-paper-shape]')&&teacher.querySelector('[data-ge-paper-shape]'),'Construction pupil grid is blank and teacher diagram is solved');
    assert(G.area(G.solution(build.data))===build.data.challenge.targetArea,'Teacher example has the target area');
    assert(P.answerNote(build).includes('only one example'),'Geoboard marking accepts other correct polygons');
    assert(P.pages(items,{teacher:true}).some(page=>page.getAttribute('data-worksheet-answer')==='annex'),'Geoboard worksheet includes graphical teacher annex');
    const captured=P.createDocument();captured.addCurrent('geoboard',{diagram:{gridSize:11,pts:G.solution(build.data)},challenge:{...build.data.challenge,revealed:true}});
    assert(P.signature(captured.list()[0])===P.signature(build),'Captured construction task remains blank after reveal');
    for(const gridSize of [5,7,9,11,13])for(const {id} of G.types())for(let i=0;i<20;i++){
      let seed=i+10;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
      const d=G.generate(id,{gridSize},rng),pts=G.solution(d);
      assert(pts.every(v=>Number.isInteger(v.x)&&Number.isInteger(v.y)&&v.x>=0&&v.y>=0&&v.x<gridSize&&v.y<gridSize),'Generated geometry fits chosen pins');
      if(id==='build-area')assert(G.area(pts)===d.challenge.targetArea,'Every target area has a valid example');
      if(id==='find-length')assert(parseFloat(d.challenge.answer)===G.length(pts),'Segment length is exact');
      if(id==='find-area')assert(parseFloat(d.challenge.answer)===G.area(pts),'Area is exact');
      if(id==='find-perimeter')assert(parseFloat(d.challenge.answer)===G.perimeter(pts),'Perimeter uses integer side lengths');
    }
  }

  // Number Mobile paper models retain the recursive topology and freeze all answers.
  {
    const P=TT99Goodies.publishing,N=TT99Goodies.numberMobilePaperModel;
    assert(P.canGenerate('balance')&&N.types().length===6,'Number Mobile exposes all six publishing families');
    const draft=P.createDocument();
    for(const difficulty of ['easy','medium','hard'])for(const {id} of N.types())if(id!=='same-to-both'||difficulty==='easy')draft.generate('balance',{difficulty,responseLines:2},1,id,()=>difficulty==='easy'?0.1:difficulty==='medium'?0.4:0.8);
    const items=draft.list(),hard=items.find(item=>item.data.type==='missing-weight'&&item.data.difficulty==='hard');
    const pupil=P.renderItem(hard,false),teacher=P.answerGraphic(hard);
    assert(pupil.querySelectorAll('[data-nm-paper-bar]').length===3&&teacher.querySelectorAll('[data-nm-paper-bar]').length===3,'Hard missing-number paper retains both hanging branches');
    assert([...pupil.querySelectorAll('[data-nm-paper-value]')].filter(n=>n.textContent==='?').length===2&&!([...teacher.querySelectorAll('[data-nm-paper-value]')].some(n=>n.textContent==='?')),'Pupil unknowns remain hidden and teacher values are revealed');
    assert(P.answerSummary(hard).includes('A =')&&P.answerSummary(hard).includes('B ='),'Multiple missing answers are identified by position');
    assert(P.pages(items,{teacher:true}).some(page=>page.getAttribute('data-worksheet-answer')==='annex'),'Mixed Number Mobile worksheet includes marking annex');
    const d=hard.data,captured=P.createDocument();captured.addCurrent('balance',{diagram:d.diagram,topology:d.topology,session:{engine:{challenge:{mode:'custom',revealed:true,...d.challenge}},generator:{difficulty:'hard',spec:{...d.challenge,difficulty:'hard'}}}});
    assert(P.signature(captured.list()[0])===P.signature(hard),'Number Mobile captures exact recursive question topology');
    for(const difficulty of ['easy','medium','hard'])for(const {id} of N.types())for(let i=0;i<25;i++){
      let seed=i+100;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
      const v=N.generate(id,{difficulty},rng),ch=v.challenge,tokens=new Map([...v.diagram.left,...v.diagram.right].map(x=>[String(x.id),x]));
      const sum=ns=>ns.reduce((a,n)=>a+(n.kind==='branch'?sum(n.left)+sum(n.right):tokens.get(String(n.id)).value),0);
      const L=sum(v.topology.roots.left),R=sum(v.topology.roots.right);
      const walk=ns=>ns.forEach(n=>{if(n.kind==='branch'){assert(sum(n.left)===sum(n.right),'Each generated hanging bar is balanced');walk(n.left);walk(n.right)}});
      walk(v.topology.roots.left);walk(v.topology.roots.right);
      if(id==='missing-weight'||id==='same-to-both')assert(L===R,'Equality task is balanced');
      if(id==='make-balance'||id==='find-difference')assert(Number(ch.answer)===Math.abs(L-R),'Mobile difference is exact');
      if(id==='choose-relation')assert(ch.answer===(difficulty==='easy'?(L===R?'=':L>R?'>':'<'):(L>R?'Left side':'Right side')),'Mobile comparison is exact');
      if(id==='spot-false-equality')assert(L!==R&&ch.answer.startsWith('No.'),'False equality is indeed false');
    }
  }

  // Equal-groups worksheets must not expose solutions on the pupil page.
  {
    const P=TT99Goodies.publishing,T=TT99Goodies.timesTablePaperModel;
    assert(P.canGenerate('times-table')&&T.types().length===6,'Times-table publishing covers every challenge family');
    const draft=P.createDocument();
    for(const {id} of T.types())draft.generate('times-table',{responseLines:2},1,id,()=>0.1);
    const items=draft.list(),build=items.find(item=>item.data.type==='build-fact'),c=build.data.challenge;
    const pupil=P.renderItem(build,false),teacher=P.answerGraphic(build);
    assert(pupil.querySelector('[data-tv-paper-working]')&&!pupil.querySelector('[data-tv-paper-dot]'),'Build-fact pupil page supplies blank drawing space');
    assert(teacher.querySelectorAll('[data-tv-paper-group]').length===c.targetGroups&&teacher.querySelectorAll('[data-tv-paper-dot]').length===c.targetGroups*c.targetItems,'Teacher diagram has the exact target groups and dot count');
    assert(P.answerNote(build).includes('exactly'),'Equal groups annex states the marking criteria');
    assert(P.pages(items,{teacher:true}).some(page=>page.getAttribute('data-worksheet-answer')==='annex'),'Times-table worksheet includes teacher annex');
    const captured=P.createDocument();captured.addCurrent('times-table',{...build.data,diagram:{groupsCount:1,itemsPerGroup:1},challenge:{...c,revealed:true}});
    assert(P.signature(captured.list()[0])===P.signature(build),'Times-table capture preserves the original question after manipulation');
    for(const {id} of T.types())for(let i=0;i<30;i++){
      let seed=i+1;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
      const d=T.generate(id,{},rng),{groupsCount:g,itemsPerGroup:n}=d.diagram,q=d.challenge;
      if(id==='find-total')assert(Number(q.answer)===g*n,'Equal group total is exact');
      if(id==='related-division')assert(Number(q.answer)===n,'Related division is exact');
      if(id==='commutative-fact')assert(g!==n&&q.answer===n+' × '+g+' = '+g*n,'Reversed multiplication fact is correct');
      if(id==='spot-error')assert(q.answer.startsWith(q.wrongTotal===g*n?'Yes':'No'),'Error classification is correct');
      if(id==='build-fact')assert(q.answer===q.targetGroups+' × '+q.targetItems+' = '+q.targetGroups*q.targetItems,'Construction target is exact');
      if(id==='write-repeated')assert(q.answer===Array.from({length:g},()=>n).join(' + ')+' = '+g*n,'Repeated addition is correct');
    }
  }

  // Factor evidence and frozen solutions use the same question generator as the widget.
  {
    const P=TT99Goodies.publishing,F=TT99Goodies.factorPaperModel;
    assert(P.canGenerate('factors')&&F.types().length===7,'Factors publishes every existing challenge family');
    const draft=P.createDocument();
    for(const {id} of F.types())draft.generate('factors',{responseLines:2},1,id,()=>0.1);
    const items=draft.list();
    assert(items.length===7&&items.every(item=>P.answerSummary(item)),'Factors questions have frozen answers');
    const missing=items.find(item=>item.data.type==='missing-factor');
    const pupil=P.renderItem(missing,false),teacher=P.answerGraphic(missing);
    assert(pupil.querySelector('[data-fe-paper-equation]').textContent.includes('?')&&!teacher.querySelector('[data-fe-paper-equation]').textContent.includes('?'),'Factor rectangle pupil question hides the missing factor and teacher graphic solves it');
    assert(teacher.querySelectorAll('[data-fe-paper-cell]').length===missing.data.diagram.a,'Factor rectangle has the exact number of cells');
    assert(P.pages(items,{teacher:true}).some(page=>page.getAttribute('data-worksheet-answer')==='annex'),'Factors worksheet has graphical marking annex');
    const captured=P.createDocument();captured.addCurrent('factors',{...missing.data,challenge:{...missing.data.challenge,revealed:true}});
    assert(P.signature(captured.list()[0])===P.signature(missing),'Revealed factor challenge captures the original question');
    for(const {id} of F.types())for(let i=0;i<20;i++){
      const d=F.generate(id,{},()=>i/20),{a,b}=d.diagram,c=d.challenge;
      const factors=n=>Array.from({length:n},(_,j)=>j+1).filter(v=>n%v===0);
      if(id==='missing-factor')assert(Number(c.answer)*Number(c.prompt.split(' ×')[0].split(' ').pop())===a,'Factor pair product is exact');
      if(id==='common-factors')assert(c.answer===factors(a).filter(v=>b%v===0).join(', '),'Common factors are complete');
      if(id==='hcf')assert(Number(c.answer)===Math.max(...factors(a).filter(v=>b%v===0)),'Highest common factor is exact');
      if(id==='lcm'){const n=Number(c.answer);assert(n%a===0&&n%b===0&&!Array.from({length:n/a-1},(_,j)=>a*(j+1)).some(v=>v%b===0),'Lowest common multiple is minimal');}
      if(id==='prime-or-composite')assert(c.answer===(factors(a).length===2?'Prime':'Composite'),'Classification is correct');
      if(id==='explain-prime')assert(factors(a).length===2,'Prime reasoning uses a prime number');
      if(id==='divisible-by')assert(c.answer.startsWith(a%c.hiddenDivisor===0?'Yes':'No'),'Divisibility answer is exact');
    }
  }

  // The FDP publication model is shared with the live widget.
  {
    const P=TT99Goodies.publishing,F=TT99Goodies.fdpPaperModel;
    assert(P.canGenerate('fdp')&&F.types().length===6,'FDP publishes all six challenge families');
    const draft=P.createDocument();
    const ids=F.types().map(x=>x.id);
    for(const id of ids)draft.generate('fdp',{responseLines:2},1,id,()=>0.1);
    const items=draft.list();
    assert(items.length===6&&items.every(item=>P.answerSummary(item)),'All FDP challenge families have frozen answers');
    const build=items.find(item=>item.data.type==='build-percentage');
    const pupil=P.renderItem(build,false),teacher=P.answerGraphic(build);
    assert(!pupil.querySelector('[data-fdp-shaded="1"]')&&teacher.querySelectorAll('[data-fdp-shaded="1"]').length===build.data.challenge.targetNumerator,'FDP pupil shading is blank and teacher graphic is solved');
    assert(P.answerNote(build).includes('Accept any valid shading'),'FDP marking guidance accepts equivalent valid shading');
    assert(P.pages(items,{teacher:true}).some(page=>page.getAttribute('data-worksheet-answer')==='annex'),'FDP mixed-family worksheet includes teacher annex');
    const live=F.generate('build-percentage',{},()=>0.1);
    const captured=P.createDocument();captured.addCurrent('fdp',{...live,diagram:{numerator:0,denominator:1},challenge:{...live.challenge,revealed:true}});
    assert(P.signature(captured.list()[0])===P.signature(build),'FDP current challenge capture preserves original question after reveal or manipulation');
    for(const type of ids){
      for(let i=0;i<12;i++){
        const d=F.generate(type,{},()=>i/12),c=d.challenge,{numerator:n,denominator:den}=d.diagram;
        if(type==='to-decimal')assert(Number(c.answer)===n/den,'FDP decimal answer is exact');
        if(type==='to-percentage')assert(Math.abs(parseFloat(c.answer)-n/den*100)<1e-8,'FDP percentage answer is exact');
        if(type==='build-percentage')assert(Math.abs(c.targetNumerator/c.targetDenominator*100-c.targetPercent)<1e-8,'FDP shading target is exact');
        if(type==='simplify-fraction'){const [a,b]=c.answer.split('/').map(Number);assert(a*den===b*n,'FDP simplified answer is equivalent');}
      }
    }
  }


  hub.click();await tick();assert(picker.hidden,'Arithmetic Hub opens directly without a category menu');
  const mcRecord=TT99Goodies.compositionBoard.objects().find(x=>x.toolId==='maths-canvas');
  const mcFrame=mcRecord&&document.querySelector('[data-board-object="'+mcRecord.id+'"]');
  for(let attempt=0;attempt<40&&mcFrame&&!mcFrame.classList.contains('is-ready');attempt++)await tick(50);
  const mcAdd=[...mcFrame.querySelectorAll('[data-board-quick-actions] button')].find(button=>button.textContent.trim()==='+ Tile');
  assert(mcAdd,'Maths Canvas exposes Add Tile directly on the frame');
  mcAdd.click();await tick();
  const mcDoc=mcFrame.querySelector('iframe').contentDocument;
  const tilePalette=document.getElementById('gd-board-floating-controls');
  const tilePick=tilePalette.querySelector('[data-board-control-index][data-mc-add], [data-board-control-index][data-mc-stage-add]');
  assert(visible(tilePalette)&&tilePalette.querySelector('.gd-mc-stage-palette')&&tilePalette.querySelectorAll('button[data-board-control-index]').length>4,'Frame Add Tile opens the contextual number / operation palette on the board');
  assert(mcDoc.querySelector('#mc-board-palette').hidden,'Embedded palette remains a hidden proxy source');
  TT99Goodies.compositionBoard.remove(mcRecord.id);

  document.querySelector('[data-board-add="measurement"]').click();await tick();
  const meRecord=TT99Goodies.compositionBoard.objects().find(x=>x.toolId==='measurement');
  const meFrame=meRecord&&document.querySelector('[data-board-object="'+meRecord.id+'"]');
  for(let attempt=0;attempt<40&&meFrame&&!meFrame.classList.contains('is-ready');attempt++)await tick(50);
  let meQuick=[...meFrame.querySelectorAll('[data-board-quick-actions] button')];
  const addRuler=meQuick.find(button=>button.textContent.trim()==='+ Ruler');
  assert(addRuler,'Measurement exposes Add Ruler directly on the frame');
  addRuler.click();await tick();
  meQuick=[...meFrame.querySelectorAll('[data-board-quick-actions] button')];
  const syncRulers=meQuick.find(button=>button.textContent.trim()==='Sync');
  assert(syncRulers,'Measurement exposes Sync after a comparison ruler exists');
  syncRulers.click();await tick();
  assert(meFrame.querySelector('iframe').contentDocument.querySelector('.gd-ruler-sync-readout'),'Synced rulers show the metric / imperial correspondence');
  TT99Goodies.compositionBoard.remove(meRecord.id);

  document.querySelector('[data-board-add="hundred-square"]').click();await tick();
  const hsRecord=TT99Goodies.compositionBoard.objects().find(x=>x.toolId==='hundred-square');
  const hsFrame=hsRecord&&document.querySelector('[data-board-object="'+hsRecord.id+'"]');
  for(let attempt=0;attempt<40&&hsFrame&&!hsFrame.classList.contains('is-ready');attempt++)await tick(50);
  const hsRule=[...hsFrame.querySelectorAll('[data-board-quick-actions] button')].find(button=>button.textContent.trim()==='Rule');
  assert(hsRule,'Hundred Square exposes Rule directly on the frame');
  hsRule.click();await tick();
  const hsDoc=hsFrame.querySelector('iframe').contentDocument;
  assert(visible(hsDoc.querySelector('.gd-hs-rule-popover')),'Frame Rule opens the compact rule picker without the full Settings panel');
  const hsEven=hsDoc.querySelector('[data-hs-rule-mode="even"]');assert(hsEven,'Compact Hundred Square rule picker includes Even');
  hsEven.click();await tick();
  assert(hsDoc.querySelectorAll('.gd-hs-cell.is-rule').length===50,'Compact rule picker applies the selected rule immediately');
  hsDoc.querySelector('[data-hs-workflow="challenge"]').click();
  const hsPicker=hsDoc.querySelector('.gd-challenge-picker');
  assert(hsPicker.querySelector('[data-gd-random-scope="all"]'),'Standard picker offers random across all challenge types');
  hsPicker.querySelector('[data-gd-random-scope]:not([data-gd-random-scope="all"])').click();await tick();
  assert(hsDoc.querySelector('.gd-challenge-banner'),'Random category generates a challenge');
  hsDoc.querySelector('[data-hs-challenge-cat="patterns"]').click();
  hsDoc.querySelector('[data-hs-challenge-type="continue-pattern"]').click();
  hsDoc.getElementById('hs-generate').click();await tick(50);
  assert(hsDoc.querySelectorAll('.gd-hs-cell.is-marked').length===3,'Pattern task marks only the three given terms');
  assert(hsDoc.querySelectorAll('.gd-hs-cell.is-hidden-number').length===0,'Pattern task does not point to the next term');
  hsDoc.querySelector('[data-hs-challenge-cat="reason"]').click();
  hsDoc.querySelector('[data-hs-challenge-type="spot-wrong-mark"]').click();
  for(let attempt=0;attempt<8;attempt++){
    hsDoc.getElementById('hs-generate').click();await tick();
    const prompt=hsDoc.querySelector('.gd-challenge-prompt').textContent;
    const k=Number(prompt.match(/multiple of ([0-9]+)/)[1]);
    const marked=[...hsDoc.querySelectorAll('.gd-hs-cell.is-marked')].map(el=>Number(el.dataset.hsValue));
    assert(marked.filter(n=>n%k!==0).length===1,'Wrong-mark task has exactly one incorrect multiple');
    assert(marked.filter(n=>n%k===0).length>=2,'Wrong-mark task contains enough valid examples');
  }
  hsDoc.querySelector('[data-hs-challenge-cat="read"]').click();
  hsDoc.querySelector('[data-hs-challenge-type="ten-more"]').click();
  hsDoc.getElementById('hs-generate').click();await tick();
  assert(hsDoc.querySelectorAll('.gd-hs-cell.is-hidden-number').length===0,'Ten-more challenge does not mark the answer location');
  hsDoc.querySelector('[data-hs-challenge-cat="patterns"]').click();
  hsDoc.querySelector('[data-hs-challenge-type="mark-rule"]').click();
  hsDoc.getElementById('hs-generate').click();await tick();
  const hsMarkModel=hsDoc.defaultView.TT99Goodies.lessonState.capture('hundred-square').model;
  assert(!/✓|do not fit/.test(hsDoc.querySelector('[data-hs-target-status]').textContent),'Marking does not provide premature correctness feedback');
  hsDoc.querySelector('[data-board-action="reveal"]').click();await tick();
  assert(hsDoc.querySelectorAll('.gd-hs-cell.is-marked').length===hsMarkModel.challenge.targetValues.length,'Reveal shows the complete marking solution');
  hsDoc.querySelector('[data-board-action="reveal"]').click();await tick();
  assert(hsDoc.querySelectorAll('.gd-hs-cell.is-marked').length===0,'Hiding the solution restores the pupil marks');
  const checker=hsDoc.defaultView.TT99Goodies.challengeKit;
  assert(checker.pupilAnswerCorrect(checker.pupilSpec('multiplication-equation'),['12 = 3 x 4'],'4 × 3 = 12'),'Array accepts reversed factors and equality');
  assert(!checker.pupilAnswerCorrect(checker.pupilSpec('multiplication-equation'),['2 × 6 = 12'],'4 × 3 = 12'),'Array rejects unrelated factors with the same product');
  assert(!checker.pupilAnswerCorrect(checker.pupilSpec('equation'),['3 × 4 = 12'],'4 × 3 = 12'),'Explicit commutative tasks still require the requested factor order');
  assert(checker.pupilAnswerCorrect(checker.pupilSpec('clock-face'),['3:25'],'3:25 pm'),'Analogue reading does not require AM or PM');
  assert(checker.pupilAnswerCorrect(checker.pupilSpec('clock-face'),['3:25 am'],'3:25 pm'),'Analogue reading does not infer an invisible period');
  assert(!checker.pupilAnswerCorrect(checker.pupilSpec('clock-12'),['3:25 am'],'3:25 pm'),'Explicit AM/PM conversion still checks the period');
  const equation=checker.pupilSpec('addition-equation');
  assert(checker.pupilAnswerCorrect(equation,['5 + 9 + 4 = 18'],'4 + 5 + 9 = 18'),'Equivalent reordered addition equation is accepted');
  assert(checker.pupilAnswerCorrect(equation,['18 = 9 + 4 + 5'],'4 + 5 + 9 = 18'),'Reversed equality is accepted');
  assert(!checker.pupilAnswerCorrect(equation,['6 + 6 + 6 = 18'],'4 + 5 + 9 = 18'),'Unrelated equation with same total is rejected');
  assert(!checker.pupilAnswerCorrect(equation,['5 + 9 + 4 = 19'],'4 + 5 + 9 = 18'),'Incorrect sum is rejected');
  TT99Goodies.compositionBoard.remove(hsRecord.id);

  const clock=objects[0];
  const boardRect=canvas.getBoundingClientRect();
  pointer(canvas,'pointerdown',boardRect.left+5,boardRect.top+5,43);
  pointer(document,'pointerup',boardRect.left+5,boardRect.top+5,43);
  assert(!clock.classList.contains('is-selected'),'Touching blank canvas removes object focus');
  assert(getComputedStyle(clock.querySelector('[data-board-context]')).display==='none','Object chrome disappears completely when unfocused');

  // Clear the initial Clock at every viewport width. Only the expensive
  // all-widget catalogue smoke pass is desktop-only.
  assert(TT99Goodies.compositionBoard.objects().length===1&&TT99Goodies.compositionBoard.objects()[0].toolId==='clock','Only the initial Clock remains before fixture cleanup');
  TT99Goodies.compositionBoard.remove(firstClockRecord.id);
  assert(TT99Goodies.compositionBoard.objects().length===0&&document.querySelectorAll('[data-board-object]').length===0,'All initial test objects can be cleared before the next test');
  if(innerWidth>=900){
    const mounted=[],clipFailures=[];
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
      await tick(80);
      const innerStage=frame?.querySelector('iframe')?.contentDocument?.getElementById('gd-stage');
      if(innerStage){
        const label=toolButton.getAttribute('aria-label');
        const vertical=innerStage.scrollHeight-innerStage.clientHeight;
        const horizontal=innerStage.scrollWidth-innerStage.clientWidth;
        if(vertical>3||horizontal>3)clipFailures.push(label+' (vertical +'+Math.max(0,vertical)+'px, horizontal +'+Math.max(0,horizontal)+'px)');
      }
      if(record.toolId!=='balance'){
        const stateApi=frame.querySelector('iframe').contentWindow.TT99Goodies.lessonState;
        assert(stateApi?.supports(record.toolId),'State adapter is registered for '+record.toolId);
        const saved=stateApi.capture(record.toolId);
        assert(saved.tool===record.toolId&&saved.version===1&&saved.model,'Captures editable state for '+record.toolId);
        assert(stateApi.restore(record.toolId,saved),'Restores editable state for '+record.toolId);
        assert(stateApi.capture(record.toolId).tool===saved.tool,'Restored state is readable for '+record.toolId);
      }
      mounted.push(record.toolId);
      TT99Goodies.compositionBoard.remove(record.id);
      await tick();
    }
    assert(mounted.length===tools.length,'Every palette manipulative completed the embedded-object smoke pass');
    assert(clipFailures.length===0,'Whiteboard frame clipping: '+clipFailures.join('; '));
  }

  // Exercise the actual saved-board library with a mixed editable lesson.
  const api=TT99Goodies.compositionBoard;
  async function addForSave(id){
    api.add(id);const record=api.objects().slice(-1)[0],frame=document.querySelector('[data-board-object="'+record.id+'"]');
    for(let i=0;i<50&&!frame.classList.contains('is-ready');i++)await tick(40);
    assert(frame.classList.contains('is-ready'),'Lesson object is ready: '+id);await tick(50);
    return {record,frame,doc:frame.querySelector('iframe').contentDocument};
  }
  // Verify real widget challenge controls before the saved-board round trip.
  const qaFraction=await addForSave('fraction-wall'),fwDoc=qaFraction.doc;
  fwDoc.querySelector('[data-fw-workflow="challenge"]').click();
  fwDoc.querySelector('[data-fw-challenge-cat="read"]').click();
  fwDoc.querySelector('[data-fw-challenge-type="identify-strip"]').click();
  fwDoc.getElementById('fw-generate').click();await tick();
  const fixedFraction=fwDoc.defaultView.TT99Goodies.lessonState.capture('fraction-wall').model;
  assert(fwDoc.querySelectorAll('[data-fr-strip-piece]:disabled').length>0,'Generated fraction strips cannot be changed');
  assert(!fwDoc.querySelector('.gd-fr-workbench .gd-object-rail'),'Generated fraction strips do not offer simplify or delete tools');
  fwDoc.querySelector('[data-fr-strip-piece]').click();await tick();
  assert(JSON.stringify(fwDoc.defaultView.TT99Goodies.lessonState.capture('fraction-wall').model.diagram)===JSON.stringify(fixedFraction.diagram),'Tapping a given fraction cannot change the question');
  api.remove(qaFraction.record.id);
  const qaArray=await addForSave('array-builder'),arrayDoc=qaArray.doc;
  arrayDoc.querySelector('[data-ab-workflow="challenge"]').click();
  arrayDoc.querySelector('[data-ab-challenge-cat="build"]').click();
  arrayDoc.querySelector('[data-ab-challenge-type="build-array"]').click();
  arrayDoc.getElementById('ab-generate').click();await tick();
  const arrayApi=arrayDoc.defaultView.TT99Goodies.lessonState;
  const arrayInitial=arrayApi.capture('array-builder').model;
  arrayDoc.querySelector('[data-array-step="rows:1"]').click();await tick();
  const arrayEdited=arrayApi.capture('array-builder').model;
  assert(arrayEdited.diagram.rows===arrayInitial.diagram.rows+1,'Touch row stepper changes array without keyboard or drag');
  assert(!arrayDoc.querySelector('[data-ab-target-status]'),'Array does not announce correct answer before Check');
  arrayDoc.querySelector('[data-board-action="reveal"]').click();await tick();
  const arraySolution=arrayApi.capture('array-builder').model;
  assert(arraySolution.diagram.rows===arraySolution.challenge.targetRows&&arraySolution.diagram.cols===arraySolution.challenge.targetCols,'Reveal builds the correct array');
  arrayDoc.querySelector('[data-board-action="reveal"]').click();await tick();
  assert(JSON.stringify(arrayApi.capture('array-builder').model.diagram)===JSON.stringify(arrayEdited.diagram),'Hide answer restores pupil array');
  arrayDoc.querySelector('[data-ab-challenge-cat="read"]').click();
  arrayDoc.querySelector('[data-ab-challenge-type="multiplication-fact"]').click();
  arrayDoc.getElementById('ab-generate').click();await tick(100);
  assert(!arrayDoc.querySelector('.gd-array-maths,.gd-array-summary'),'Fixed array challenge omits redundant concealed teaching readouts');
  assert(arrayDoc.querySelector('.gd-challenge-prompt').textContent.includes('including the total'),'Multiplication question explicitly asks for a complete equation');
  assert(!arrayDoc.querySelector('[data-ab-resize="rows"] small').textContent.includes('↕'),'Fixed dimension labels no longer imply dragging');
  api.remove(qaArray.record.id);
  const qaClock=await addForSave('clock'),clockDoc=qaClock.doc;
  clockDoc.querySelector('[data-cl-workflow="challenge"]').click();
  clockDoc.querySelector('[data-cl-challenge-cat="set"]').click();
  clockDoc.querySelector('[data-cl-challenge-type="set-five"]').click();
  clockDoc.getElementById('cl-generate').click();await tick();
  assert(clockDoc.querySelectorAll('[data-cl-period-stage]').length===2,'Setting a time exposes both AM and PM');
  clockDoc.querySelector('[data-cl-period-stage="12"]').click();
  assert(Number(clockDoc.getElementById('cl-face').dataset.clHour)>=12,'PM selector actually changes the clock period');
  assert(!clockDoc.querySelector('[data-cl-target-status]'),'Clock setting does not reveal success before Check');
  assert(!clockDoc.querySelector('.gd-clock-readouts,.gd-clock-digital'),'Clock challenge omits concealed readout panels');
  const clockApi=clockDoc.defaultView.TT99Goodies.lessonState,clockAttempt=clockApi.capture('clock').model;
  clockDoc.querySelector('[data-board-action="reveal"]').click();await tick();
  const clockSolution=clockApi.capture('clock').model;
  assert(clockSolution.diagram.hour===clockSolution.challenge.targetHour&&clockSolution.diagram.minute===clockSolution.challenge.targetMinute,'Reveal moves the clock to the requested time');
  clockDoc.querySelector('[data-board-action="reveal"]').click();await tick();
  assert(clockApi.capture('clock').model.diagram.hour===clockAttempt.diagram.hour&&clockApi.capture('clock').model.diagram.minute===clockAttempt.diagram.minute,'Hide answer restores clock attempt');
  api.remove(qaClock.record.id);
  const qaRuler=await addForSave('measurement'),rulerDoc=qaRuler.doc;
  rulerDoc.querySelector('[data-me-workflow="challenge"]').click();
  rulerDoc.querySelector('[data-me-challenge-cat="read"]').click();
  rulerDoc.querySelector('[data-me-challenge-type="read-mark"]').click();
  rulerDoc.getElementById('me-generate').click();await tick();
  assert(rulerDoc.querySelectorAll('.gd-ruler-marker--secondary').length===0,'Single marker task does not invent a marker at zero');
  assert(!rulerDoc.querySelector('.gd-ruler-card .gd-fdp-readout'),'Ruler challenge omits concealed measurement panels');
  rulerDoc.querySelector('[data-me-challenge-type="place-mark"]').click();rulerDoc.getElementById('me-generate').click();await tick();
  const rulerApi=rulerDoc.defaultView.TT99Goodies.lessonState,rulerAttempt=rulerApi.capture('measurement').model;
  rulerDoc.querySelector('[data-board-action="reveal"]').click();await tick();
  const rulerSolution=rulerApi.capture('measurement').model;
  assert(rulerSolution.diagram.cm===rulerSolution.challenge.targetCm,'Reveal moves the marker to the correct length');
  rulerDoc.querySelector('[data-board-action="reveal"]').click();await tick();
  assert(rulerApi.capture('measurement').model.diagram.cm===rulerAttempt.diagram.cm,'Hide answer restores previous marker');
  api.remove(qaRuler.record.id);
  {
    const P=TT99Goodies.publishing,fixture=await addForSave('geoboard'),live=fixture.doc.defaultView.TT99Goodies;
    const original=live.publishingLive(),draft=P.createDocument();
    assert(original.illustration,'Geoboard exposes its actual teaching illustration for publishing');
    draft.addCurrent('geoboard',live.lessonState.capture('geoboard').model,original);
    const first=draft.list()[0];
    assert(first.kind==='diagram'&&first.data.frozenSvg===original.illustration,'Current teaching SVG is frozen verbatim');
    const authored={title:'Teacher question',prompt:'Find the missing value.',answer:'42',pupilSvg:original.illustration,responseLines:2};
    draft.addCurrent('geoboard',{},null,authored);
    const item=draft.list()[1];
    assert(item.kind==='challenge'&&!item.recipe&&P.answerSummary(item)==='42','Authored challenges retain answers but cannot be randomly regenerated');
    assert(!P.renderItem(item,false).textContent.includes('42')||original.illustration.includes('42'),'Teacher answer is not inserted into the pupil question');
    assert(P.pages(draft.list(),{teacher:true}).some(svg=>svg.getAttribute('data-worksheet-answer')==='annex'),'Authored challenge receives teacher annex');
    let rejected=false;try{draft.addCurrent('geoboard',{},null,{...authored,answer:''})}catch(_){rejected=true}
    assert(rejected&&draft.list().length===2,'Incomplete custom tasks cannot silently create answerless documents');
    api.remove(fixture.record.id);
  }
  // Statistics: live representations, random challenge, current capture and generated worksheets.
  {
    const id='statistics-table',fixture=await addForSave(id),doc=fixture.doc,live=doc.defaultView.TT99Goodies;
    const capture=()=>live.lessonState.capture(id).model;
    const original=capture();
    const select=doc.getElementById('st-view');select.value='tally';select.dispatchEvent(new doc.defaultView.Event('change',{bubbles:true}));
    await tick();
    assert(capture().view==='tally'&&JSON.stringify(capture().data)===JSON.stringify(original.data),'Statistics representation switch preserves dataset');
    assert(doc.querySelectorAll('#gd-stage svg line').length>0,'Tally marks render as lines');
    doc.querySelector('[data-st-change="0,1"]').click();await tick();
    assert(capture().data.rows[0].value===original.data.rows[0].value+1,'Statistics touch increment changes frequency');
    const teaching=capture();
    doc.querySelector('[data-st-workflow="challenge"]').click();await tick();
    doc.querySelector('[data-st-challenge-mode="total"]').click();await tick();
    const question=capture();
    assert(question.task&&Number(question.task.answer)===question.data.rows.reduce((sum,r)=>sum+r.value,0),'Statistics challenge total matches dataset');
    const P=TT99Goodies.publishing,draft=P.createDocument();
    draft.addCurrent(id,question);
    draft.generate(id,question,3,'read');
    assert(draft.list().length===4,'Statistics current capture and batch generation');
    assert(Number(P.answerSummary(draft.list()[0]))===Number(question.task.answer),'Current question marking remains exact');
    assert(P.pages(draft.list(),{teacher:true}).some(svg=>svg.querySelector('[data-pub-answer-graphic]')),'Statistics graphical teacher annex');
    doc.querySelector('[data-challenge-action="end"]').click();await tick();
    assert(JSON.stringify(capture().data)===JSON.stringify(teaching.data),'Exiting statistics challenge restores teaching dataset');
    api.remove(fixture.record.id);
  }
  // Interactive construction: all five representations require a real model edit.
  {
    const id='statistics-table',fixture=await addForSave(id),doc=fixture.doc,live=doc.defaultView.TT99Goodies;
    const capture=()=>live.lessonState.capture(id).model;
    const stage=doc.querySelector('#gd-stage');
    for(const view of ['table','tally','pictogram','block','bar','line']){
      const select=doc.getElementById('st-view');select.value=view;select.dispatchEvent(new doc.defaultView.Event('change',{bubbles:true}));await tick();
      doc.querySelector('[data-st-workflow="challenge"]').click();await tick();
      doc.querySelector('[data-st-challenge-mode="complete"]').click();await tick();
      const model=capture(),target=model.data.rows[model.task.missing].value,check=stage.querySelector('[data-gd-pupil-check]');
      assert(check&&check.disabled&&model.attempt===null,'Construction starts blank: '+view);
      stage.querySelector('[data-st-edit="zero"]').click();await tick();
      assert(!check.disabled,'Explicit zero enables construction check: '+view);
      for(let i=0;i<target/(view==='pictogram'?model.key:1);i++)stage.querySelector('[data-st-edit="plus"]').click();
      assert(capture().attempt===target,'Touch controls build exact missing value: '+view);
      check.click();await tick();
      assert(stage.querySelector('.gd-pupil-feedback').classList.contains('is-correct'),'Correct construction is accepted: '+view);
      const draft=TT99Goodies.publishing.createDocument();draft.addCurrent(id,capture());
      assert(draft.list()[0].data.missing===model.task.missing,'Publishing retains missing index rather than solved pupil state');
      doc.querySelector('[data-challenge-action="end"]').click();await tick();
    }
    api.remove(fixture.record.id);
  }
  // Work directly in actual embedded written-method grids with the shared keypad.
  for(const id of ['column-addition','column-subtraction','written-multiplication','written-division']){
    const fixture=await addForSave(id),doc=fixture.doc,live=doc.defaultView.TT99Goodies,frame=fixture.frame;
    const choose=doc.querySelector('[data-wm-workflow="challenge"]');choose.click();await tick();
    doc.querySelector('[data-wm-challenge-mode]').click();await tick();
    const model=live.lessonState.capture(id).model,M=live.writtenMethods.calculate(model.method,model.a,model.b),slots=live.columnMethods.practiceCells(M);
    const stage=doc.querySelector('#gd-stage'),check=stage.querySelector('[data-gd-pupil-check]');
    assert(check.disabled&&stage.querySelectorAll('[data-wm-cell]').length===slots.length,id+' complete working starts blank and Check disabled');
    const first=stage.querySelector('[data-wm-cell]');first.click();await tick();
    assert(doc.querySelector('.gd-touch-keypad'),id+' working cell opens shared touch keypad');
    doc.querySelector('[data-gd-touch-close]').click();
    for(const slot of slots.filter(s=>!s.optional)){const input=stage.querySelector('[data-wm-cell="'+slot.id+'"]');input.value=String(slot.expected);input.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}))}
    assert(!check.disabled,id+' enables Check only after all required working');
    check.click();await tick();
    assert(stage.querySelector('.gd-pupil-feedback').classList.contains('is-correct'),id+' correct working accepted');
    const P=TT99Goodies.publishing,draft=P.createDocument();draft.addCurrent(id,live.lessonState.capture(id).model);
    assert(!P.renderItem(draft.list()[0],false).querySelector('[data-wm-result],[data-wm-partial],[data-wm-quotient]'),id+' pupil publication never includes entered working');
    api.remove(fixture.record.id);
  }
  // Specialist native engines must work through the same full and quick panels.
  for(const id of ['place-value','abacus','maths-canvas','sequences']){
    const fixture=await addForSave(id),panel=document.getElementById('gd-board-floating-controls');
    fixture.frame.querySelector('[data-board-settings]').click();await tick();
    assert(panel.dataset.panelMode==='settings'&&panel.querySelector('.gd-board-controls-proxy'),'Specialist teaching settings open: '+id);
    panel.querySelector('[data-board-controls-close]').click();await tick();
    const challengeButton=fixture.frame.querySelector('[data-board-quick-actions] button[aria-label="Choose a challenge"]');assert(challengeButton,'Frame Challenge action exists for '+id);challengeButton.click();await tick();
    assert(panel.querySelector('[data-gd-native-random="all"]'),'Specialist quick launcher: '+id);
    panel.querySelector('[data-board-launcher-settings]').click();await tick();
    assert(panel.querySelector('.gd-panel-native-random')&&panel.querySelector('[data-board-launcher-back]'),'Specialist full challenge settings: '+id);
    if(id==='sequences'){const d=panel.querySelector('[data-seq-challenge-setting="difficulty"]');d.value='hard';d.dispatchEvent(new Event('change',{bubbles:true}));await tick();assert(fixture.doc.querySelector('[data-seq-challenge-setting="difficulty"]').value==='hard','Sequence difficulty forwards from full panel')}
    panel.querySelector('[data-gd-native-random="all"]').click();await tick(100);
    assert(fixture.doc.querySelector('#gd-stage .gd-native-challenge,#gd-stage .gd-challenge-banner,#gd-stage .gd-ab-task'),'Specialist full settings Random generates: '+id);
    panel.querySelector('[data-board-launcher-back]').click();await tick();
    panel.querySelector('[data-gd-native-random="all"]').click();await tick(100);
    assert(!visible(panel),'Specialist quick generation closes launcher: '+id);
    api.remove(fixture.record.id);
  }
  {
    const fixture=await addForSave('balance');
    const panel=document.getElementById('gd-board-floating-controls');
    fixture.frame.querySelector('[data-board-settings]').click();await tick();
    assert(panel.dataset.panelMode==='settings'&&panel.querySelector('.gd-board-controls-proxy'),'Number Mobile teaching settings remain available');
    panel.querySelector('[data-board-controls-close]').click();await tick();
    for(let i=0;i<20&&!fixture.frame.querySelector('[data-nmb-board-challenge]');i++)await tick(50);
    fixture.frame.querySelector('[data-nmb-board-challenge]').click();await tick();
    const pop=fixture.doc.querySelector('.nmb-v5-challenge-popover');
    assert(pop&&pop.querySelector('[data-nmb-panel-close]'),'Number Mobile uses grouped challenge menu with close action');
    pop.querySelector('[data-nmb-v6-type="random"]').click();
    for(let i=0;i<30&&!fixture.doc.querySelector('#gd-stage .gd-challenge-banner');i++)await tick(60);
    assert(fixture.doc.querySelector('#gd-stage .gd-challenge-banner'),'Number Mobile frame Random generates an actual challenge');
    api.remove(fixture.record.id);
  }
  {
    const fixture=await addForSave('randomiser'),panel=document.getElementById('gd-board-floating-controls');
    fixture.frame.querySelector('[data-board-settings]').click();await tick();
    assert(panel.dataset.panelMode==='settings'&&panel.querySelector('.gd-board-controls-proxy'),'Randomiser teaching settings remain available without an invented challenge mode');
    panel.querySelector('[data-board-controls-close]').click();await tick();api.remove(fixture.record.id);
  }
  // The standard picker is shared, but validate the parent-to-iframe path on
  // every standard-picker widget with a fresh board object.
  for(const [id,prefix] of [['fraction-wall','fw'],['bar-model','bm'],['hundred-square','hs'],['multiplication-grid','mg'],['array-builder','ab'],['clock','cl'],['money','mo'],['coordinates','co'],['measurement','me'],['times-table','tv'],['factors','fe'],['fdp','fd']]){
    const fixture=await addForSave(id),panel=document.getElementById('gd-board-floating-controls');
    fixture.frame.querySelector('[data-board-settings]').click();await tick();
    assert(panel.dataset.panelMode==='settings'&&panel.querySelector('.gd-board-controls-proxy'),'Normal settings open for '+id);
    panel.querySelector('[data-board-controls-close]').click();await tick();
    fixture.frame.querySelector('[data-board-quick-actions] button[aria-label="Choose a challenge"]').click();await tick();
    assert(panel.dataset.panelMode==='challenge'&&panel.querySelector('[data-gd-random-scope="all"]'),'Quick challenge available for '+id);
    panel.querySelector('[data-board-launcher-settings]').click();await tick();
    assert(panel.dataset.panelMode==='challenge-settings'&&panel.querySelector('.gd-panel-challenge-picker'),'Shared full challenge settings for '+id);
    panel.querySelector('[data-gd-random-scope="all"]').click();await tick(70);
    const model=fixture.doc.defaultView.TT99Goodies.lessonState.capture(id).model;
    assert(model.challenge||model.state?.challenge||fixture.doc.querySelector('#gd-stage .gd-challenge-banner'),'Full settings Random actually generates for '+id);
    panel.querySelector('[data-board-launcher-back]').click();await tick();
    assert(panel.dataset.panelMode==='challenge','Back to quick challenge for '+id);
    panel.querySelector('[data-gd-random-scope="all"]').click();await tick(70);
    assert(!visible(panel)&&fixture.doc.querySelector('#gd-stage .gd-challenge-banner'),'Quick Random generates and closes for '+id);
    api.remove(fixture.record.id);
  }
  const qaGeo=await addForSave('geoboard'),geoDoc=qaGeo.doc;
  // Exercise the real parent floating inspector, not only iframe controls.
  const geoPanel=document.getElementById('gd-board-floating-controls');
  qaGeo.frame.querySelector('[data-board-quick-actions] button[aria-label="Choose a challenge"]').click();await tick();
  assert(geoPanel.dataset.panelMode==='challenge'&&geoPanel.querySelector('[data-gd-random-scope="all"]'),'Geoboard has the common quick challenge launcher');
  geoPanel.querySelector('[data-board-launcher-settings]').click();await tick();
  assert(geoPanel.dataset.panelMode==='challenge-settings'&&geoPanel.querySelector('[data-board-launcher-back]'),'Challenge settings provide a clear route back to launcher');
  const proxyGrid=geoPanel.querySelector('#ge-grid-size');proxyGrid.value='13';proxyGrid.dispatchEvent(new Event('change',{bubbles:true}));await tick();
  geoPanel.querySelector('[data-gd-random-scope="all"]').click();await tick(100);
  const geoCapture=()=>geoDoc.defaultView.TT99Goodies.lessonState.capture('geoboard').model;
  assert(geoCapture().challenge&&geoCapture().diagram.gridSize===13,'Full settings Random all forwards into live widget using selected pin count');
  const firstRandom=JSON.stringify(geoCapture().challenge);
  geoPanel.querySelector('[data-gd-random-scope="all"]').click();await tick(100);
  assert(JSON.stringify(geoCapture().challenge)!==firstRandom,'Second Random all generates a different question');
  geoPanel.querySelector('[data-board-launcher-back]').click();await tick();
  assert(geoPanel.dataset.panelMode==='challenge','Back returns to quick launcher');
  geoPanel.querySelector('[data-gd-random-scope="all"]').click();await tick(100);
  assert(geoCapture().challenge&&!visible(geoPanel),'Quick Random all generates and closes the launcher');
  geoDoc.querySelector('[data-challenge-action="end"]').click();await tick();
  geoDoc.querySelector('[data-ge-workflow="explore"]').click();await tick();
  qaGeo.frame.querySelector('[data-board-settings]').click();await tick();
  assert(geoPanel.dataset.panelMode==='settings'&&geoPanel.querySelector('#ge-grid-size'),'Normal teaching settings preserve the grid selector');
  geoPanel.querySelector('[data-board-controls-close]').click();await tick();

  const geoGrid=geoDoc.getElementById('ge-grid-size');
  assert(geoGrid&&geoDoc.querySelectorAll('[data-gp]').length===49,'Geoboard defaults to 7 by 7 pins');
  geoDoc.querySelector('[data-gp="2,2"]').dispatchEvent(new geoDoc.defaultView.MouseEvent('click',{bubbles:true}));await tick();
  function changeGeoGrid(n){const select=geoDoc.getElementById('ge-grid-size');select.value=String(n);select.dispatchEvent(new geoDoc.defaultView.Event('change',{bubbles:true}))}
  changeGeoGrid(13);await tick();
  assert(geoDoc.querySelectorAll('[data-gp]').length===169&&geoDoc.querySelector('[data-ge-pos="2,2"]'),'Increasing pins preserves the existing vertex');
  geoDoc.querySelector('[data-gp="12,12"]').dispatchEvent(new geoDoc.defaultView.MouseEvent('click',{bubbles:true}));await tick();
  changeGeoGrid(5);await tick();
  assert(geoDoc.querySelectorAll('[data-gp]').length===169&&geoDoc.getElementById('ge-grid-status').textContent.includes('does not fit'),'Shrinking cannot silently delete an outlying vertex');
  geoDoc.getElementById('ge-clear').click();await tick();changeGeoGrid(5);await tick();
  assert(geoDoc.querySelectorAll('[data-gp]').length===25,'Cleared board can shrink to 5 by 5');

  geoDoc.querySelector('[data-ge-workflow="challenge"]').click();
  geoDoc.querySelector('[data-ge-challenge-cat="measure"]').click();
  geoDoc.querySelector('[data-ge-challenge-type="find-area"]').click();
  changeGeoGrid(11);await tick();
  geoDoc.getElementById('ge-generate').click();await tick();
  const geoState=geoDoc.defaultView.TT99Goodies.lessonState;
  assert(geoState.capture('geoboard').model.diagram.gridSize===11&&geoDoc.querySelectorAll('[data-gp]').length===121,'Live challenge uses its selected generation grid');
  const given=JSON.stringify(geoState.capture('geoboard').model.diagram.pts);
  geoDoc.querySelector('[data-gp]').dispatchEvent(new geoDoc.defaultView.MouseEvent('click',{bubbles:true}));
  assert(JSON.stringify(geoState.capture('geoboard').model.diagram.pts)===given,'Given geometry cannot be altered during a calculation question');
  api.remove(qaGeo.record.id);
  assert(api.objects().length===0,'Saved-board fixture starts with an empty board at every viewport width');
  const saveAb=await addForSave('abacus');
  saveAb.doc.querySelector('[data-ab-bead="4:unit:0"]').click();
  const saveNl=await addForSave('number-line');
  const saved=api.capture();
  assert(saved.objects.length===2,'Mixed board captures both objects');
  document.getElementById('gd-board-saved').click();
  assert(document.getElementById('gd-board-library').open,'Saved boards library opens');
  const library=document.getElementById('gd-board-library');
  const saveButton=document.getElementById('gd-board-save-current');
  api.select(saveNl.record.id);
  const modalDelete=new KeyboardEvent('keydown',{key:'Delete',bubbles:true,cancelable:true});
  saveButton.dispatchEvent(modalDelete);
  assert(api.objects().length===2&&!modalDelete.defaultPrevented,'Delete in the saved-board dialog cannot delete a board object');
  const modalBackspace=new KeyboardEvent('keydown',{key:'Backspace',bubbles:true,cancelable:true});
  saveButton.dispatchEvent(modalBackspace);
  assert(api.objects().length===2&&!modalBackspace.defaultPrevented,'Backspace in the saved-board dialog cannot delete a board object');
  const modalEscape=new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true});
  saveButton.dispatchEvent(modalEscape);
  assert(!modalEscape.defaultPrevented,'Escape remains available for native modal dismissal');
  document.getElementById('gd-board-save-name').value='QA lesson';
  document.getElementById('gd-board-save-current').click();
  const stored=JSON.parse(localStorage.getItem('tt99-whiteboard-lessons-v1'));
  assert(stored.some(e=>e.name==='QA lesson'&&e.board.objects.length===2),'Library writes a named editable board');
  document.querySelector('[data-board-library-close]').click();
  await api.restore(saved);await tick(80);
  const restored=api.capture();
  assert(restored.objects.length===2,'Mixed lesson opens with both objects');
  const restoredAb=restored.objects.find(o=>o.toolId==='abacus'),savedAb=saved.objects.find(o=>o.toolId==='abacus');
  assert(JSON.stringify(restoredAb.state.model.counts)===JSON.stringify(savedAb.state.model.counts),'Abacus bead positions survive save and restore');
  assert(restoredAb.x===savedAb.x&&restoredAb.y===savedAb.y&&restoredAb.scale===savedAb.scale,'Object position and scale survive save and restore');
  const broken=JSON.parse(JSON.stringify(saved));broken.objects[0].state.model.counts=null;
  let failed=false;try{await api.restore(broken)}catch(_){failed=true}
  assert(failed&&api.objects().length===2,'Failed restore keeps original lesson intact');
  const saveBalance=await addForSave('balance');
  const mobileApi=saveBalance.doc.defaultView.TT99Goodies.lessonState;
  const mobileSnapshot=mobileApi.capture('balance');
  // Restore an actual recursive model containing a branch and a blank box.
  mobileSnapshot.model.diagram.left=[{id:1,value:8,hidden:false},{id:2,value:0,hidden:false}];
  mobileSnapshot.model.topology={roots:{left:[{kind:'branch',id:'b1',left:[{kind:'tile',id:'1'}],right:[{kind:'tile',id:'2'}]}],right:[{kind:'tile',id:'3'}]},blankIds:['2'],nextBranch:2};
  mobileApi.restore('balance',mobileSnapshot);await tick(100);
  assert(saveBalance.doc.querySelectorAll('.nmb-branch').length===1,'Saved mobile restores its hanging branch');
  assert(saveBalance.doc.querySelector('[data-ba-token="2"]').classList.contains('is-blank-box'),'Saved mobile restores the blank number box');
  const mixedMobile=api.capture();
  await api.restore(mixedMobile);await tick(100);
  const reopened=api.capture();
  assert(reopened.objects.length===3,'Mixed board including Number Mobile Balance opens');
  assert(JSON.stringify(reopened.objects.find(o=>o.toolId==='balance').state.model.topology)===JSON.stringify(mobileSnapshot.model.topology),'Number Mobile topology round-trips through board library');
  const mobileRecord=api.objects().find(o=>o.toolId==='balance');
  const mobileDoc=document.querySelector('[data-board-object="'+mobileRecord.id+'"] iframe').contentDocument;
  mobileDoc.querySelector('[data-ba-workflow="challenge"]').click();
  mobileDoc.getElementById('ba-generate').click();await tick(100);
  const answerTile=mobileDoc.querySelector('.nmb-v8-answer-box');
  assert(answerTile,'Missing-number challenge provides an answer box');
  answerTile.click();await tick();
  mobileDoc.querySelector('[data-nmb-v8-key="1"]').click();
  const activeMobile=api.capture(),activeModel=activeMobile.objects.find(o=>o.toolId==='balance').state.model;
  assert(activeModel.session.pupil.answers.some(row=>row[1].buffer==='1'),'Partial pupil answer captured');
  document.getElementById('gd-board-saved').click();
  document.getElementById('gd-board-save-name').value='Active mobile lesson';
  document.getElementById('gd-board-save-current').click();
  assert(JSON.parse(localStorage.getItem('tt99-whiteboard-lessons-v1')).some(e=>e.name==='Active mobile lesson'),'Active generated mobile challenge can be saved');
  document.querySelector('[data-board-library-close]').click();
  await api.restore(activeMobile);await tick(150);
  const current=api.objects().find(o=>o.toolId==='balance');
  const currentDoc=document.querySelector('[data-board-object="'+current.id+'"] iframe').contentDocument;
  const activeRestored=api.capture().objects.find(o=>o.toolId==='balance').state.model;
  assert(activeRestored.session.engine.challenge.answer===activeModel.session.engine.challenge.answer,'Saved challenge keeps exactly the same answer');
  assert(JSON.stringify(activeRestored.session.pupil.answers)===JSON.stringify(activeModel.session.pupil.answers),'Partial answers survive a complete whiteboard round trip');
  assert(currentDoc.querySelector('.nmb-v8-answer-box strong').textContent==='1','Restored answer appears inside its number box');
  currentDoc.querySelector('[data-nmb-v7-exit]').click();
  for(let i=0;i<60&&currentDoc.querySelector('.gd-challenge-banner');i++)await tick(40);
  const returnedMobile=currentDoc.defaultView.TT99Goodies.lessonState.capture('balance');
  assert(JSON.stringify(returnedMobile.model.topology)===JSON.stringify(mobileSnapshot.model.topology),'Exiting a restored challenge recovers the original teaching topology and blank boxes');
  api.remove(current.id);
  localStorage.removeItem('tt99-whiteboard-lessons-v1');
  result('pass','board','Mixed whiteboard objects are frameless, scalable, contextual, all palette tools mount and editable lessons restore','tools='+tools.length);
}
window.addEventListener('load',()=>setTimeout(()=>run().catch(err=>result('fail','board',err&&err.message?err.message:String(err),err&&err.stack?err.stack:'')),180));
})();`;

  const embedScript=`(function(){
${common}
async function run(){
  assert(document.documentElement.classList.contains('gd-embed-page'),'Embedded manipulative mode is active');
  assert(getComputedStyle(document.getElementById('gd-qa-theme-header')).display==='none','Embedded manipulative hides the site masthead');
  assert(getComputedStyle(document.getElementById('gd-qa-theme-footer')).display==='none','Embedded manipulative hides the site footer');
  assert(!window.TT99Goodies.compositionBoard,'Embedded object does not recursively mount the mixed board');
  const shell=document.querySelector('.gd-shell'),stage=document.getElementById('gd-stage'),controls=document.getElementById('gd-controls');
  assert(shell&&stage&&controls,'Embedded manipulative keeps its live stage and controls');
  assert(visible(stage),'Embedded manipulative stage is visible');
  assert(getComputedStyle(controls).display==='none','Embedded controls are hidden until contextual Settings is requested');
  window.postMessage({type:'tt99-board-settings',open:true},location.origin);
  await tick();
  assert(shell.classList.contains('gd-embed-controls-open'),'Parent Settings message opens the compact contextual controls');
  assert(visible(controls),'Contextual controls become visible');
  const workflowButtons=[...controls.querySelectorAll('[role="tablist"] button')];
  const blockedButtons=workflowButtons.filter(button=>/^(challenge|export|present|task)(\b|\s|$)/i.test((button.textContent||'').trim()));
  blockedButtons.forEach(button=>assert(getComputedStyle(button).display==='none','Embedded Settings hides '+button.textContent.trim()));
  const usefulButtons=workflowButtons.filter(button=>/^(explore|setup|build|objects)$/i.test((button.textContent||'').trim()));
  usefulButtons.forEach(button=>assert(getComputedStyle(button).display!=='none','Embedded Settings keeps useful '+button.textContent.trim()+' access'));
  const presentButton=controls.querySelector('#nl-fullscreen,.nl-present-btn');
  if(presentButton)assert(getComputedStyle(presentButton).display==='none','Embedded Settings hides Present');
  assert(getComputedStyle(document.body).backgroundColor==='rgba(0, 0, 0, 0)','Embedded page body is transparent');
  assert(getComputedStyle(stage).backgroundColor==='rgba(0, 0, 0, 0)','Embedded stage is transparent');
  assert(getComputedStyle(stage).overflow==='hidden','Embedded stage does not show an internal page scrollbar');
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

  // Parse the generated inline scripts before launching the browser.
  new Function(boardScript);new Function(embedScript);
  fs.writeFileSync(BOARD,shell('/goodies/?board=1',boardScript));
  fs.writeFileSync(EMBED,shell('/goodies/?embed=1#fraction-wall',embedScript));
  fs.writeFileSync(HOST,embedHost());
  console.log(BOARD+'\n'+EMBED+'\n'+HOST);
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
  if(status!=='pass')throw new Error('Goodies composition QA failed: '+(message||status)+'\n'+detail);
  console.log(message);
  process.exit(0);
}

throw new Error('Use prepare or check mode.');
