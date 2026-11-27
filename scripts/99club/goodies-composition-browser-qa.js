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
  assert(tools.length===24&&new Set(tools.map(button=>button.dataset.boardAdd)).size===24,'All 24 distinct manipulatives are available in the grouped palette');
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
  assert(visible(abFloating)&&abFloating.querySelector('#ab-rows')&&!abFloating.querySelector('#ab-kind')&&abFrame.querySelector('[data-board-mode-picker] select').options.length===8,'Abacus exposes place-value column and instrument settings on the whiteboard');
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
    assert(dialog.querySelectorAll('[data-pub-add-source]').length===24,'Clearing search restores the full catalogue');
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
  // Shared mode picker: audit every catalogue item, dispatch real native mode
  // handlers, and preserve chart data when changing representations.
  const modeAudit=TT99Goodies.modeControl.audit();
  assert(modeAudit.length===24&&modeAudit.every(t=>t.multi||t.reason),'Every widget declares primary modes or a single-purpose reason');
  for(const item of modeAudit){
    const fixture=await addForSave(item.id),bridge=fixture.doc.defaultView.TT99Goodies.modeControl,picker=fixture.frame.querySelector('[data-board-mode-picker]'),select=picker.querySelector('select');
    const before=bridge.read();
    if(!item.multi){assert(picker.hidden&&!before,'Single-purpose widget does not add a mode control: '+item.id);api.remove(fixture.record.id);continue}
    assert(before&&before.options.length>=2&&!picker.hidden,'Shared mode control appears for '+item.id);
    const pr=picker.getBoundingClientRect(),sr=select.getBoundingClientRect(),cr=picker.querySelector('span').getBoundingClientRect(),mr=fixture.frame.querySelector('[data-board-move]').getBoundingClientRect();
    const center=r=>r.top+r.height/2;
    assert(Math.abs(center(pr)-center(sr))<1.5&&Math.abs(center(pr)-center(cr))<3,'Mode text control and chevron vertically centred: '+item.id);
    assert(Math.abs(center(pr)-center(mr))<2,'Mode dropdown and move handle aligned: '+item.id);
    assert(getComputedStyle(select).marginTop==='0px'&&getComputedStyle(select).marginBottom==='0px','Theme margins cannot shift native mode select: '+item.id);

    const alternate=before.options.find(o=>o.value!==before.value&&!o.disabled);
    assert(alternate,'Alternative mode available: '+item.id);
    const snapshot=()=>fixture.doc.defaultView.TT99Goodies.lessonState.capture(item.id).model;
    const original=item.id==='statistics-table'?JSON.stringify(snapshot().data.rows):null;
    select.value=alternate.value;select.dispatchEvent(new Event('change',{bubbles:true}));await tick(100);
    assert(bridge.read().value===alternate.value&&select.value===alternate.value,'Mode switch is applied to actual widget: '+item.id);
    if(item.id==='statistics-table'){
      assert(JSON.stringify(snapshot().data.rows)===original,'Changing statistical representation preserves dataset');
      assert(fixture.doc.querySelector('.gd-mode-hint')?.textContent===bridge.read().hint,'Data representation has its contextual teaching hint');
      fixture.frame.querySelector('[data-board-context]').click();await tick();
      fixture.frame.querySelector('[data-board-mode-hint]').click();await tick();
      assert(!fixture.doc.querySelector('.gd-mode-hint'),'Teaching hint can be hidden');
      fixture.frame.querySelector('[data-board-context]').click();await tick();
      fixture.frame.querySelector('[data-board-mode-hint]').click();await tick();
      assert(fixture.doc.querySelector('.gd-mode-hint'),'Teaching hint can be restored');
    }
    api.remove(fixture.record.id);
  }
  // Angles: live construction, exact assessment and capture of revealed work.
  {
    const id='angles',fixture=await addForSave(id),doc=fixture.doc,G=doc.defaultView.TT99Goodies,M=G.angles,cap=()=>G.lessonState.capture(id).model;
    assert(doc.querySelector('#gd-stage svg'),'Angle explorer mounts a geometry diagram');
    const svg=()=>doc.querySelector('#gd-stage svg'),bounds=()=>svg().getAttribute('viewBox').split(' ').map(Number);
    assert(bounds()[2]<=550&&bounds()[3]<=310,'Default semicircular protractor uses a tight content viewBox');
    const scaleLabels=[...svg().querySelectorAll('text')].filter(el=>/^[0-9]+$/.test(el.textContent));
    assert(scaleLabels.length>=19&&scaleLabels.every(el=>+el.getAttribute('font-size')>=17),'Protractor numerals remain legible on both scales');
    const rot=doc.getElementById('ag-rotation');rot.value='90';rot.dispatchEvent(new doc.defaultView.Event('change',{bubbles:true}));await tick();
    assert(bounds()[2]<=310&&bounds()[3]<=550,'Rotated semicircle frames its geometry without clipping');
    const value=doc.getElementById('ag-value');value.value='270';value.dispatchEvent(new doc.defaultView.Event('change',{bubbles:true}));await tick();
    assert(bounds()[2]===bounds()[3]&&bounds()[2]<=550,'Reflex protractor uses a compact full-circle frame');
    // The same angle-fact renderer is used for the whiteboard and teacher key.
    const straight=TT99Goodies.publishing.createDocument();
    straight.generate('angles',TT99Goodies.publishing.defaultSettings('angles'),1,'straight');
    const graphic=TT99Goodies.publishing.answerGraphic(straight.list()[0]);
    const marks=[...graphic.querySelectorAll('[data-ag-angle-mark]')],labels=[...graphic.querySelectorAll('[data-ag-angle-label]')];
    assert(marks.length===2&&marks[0].getAttribute('data-ag-radius')!==marks[1].getAttribute('data-ag-radius'),'Adjacent angle arcs have distinct radii');
    assert(labels.length===2&&labels.every(n=>+n.getAttribute('font-size')===29),'Print geometry labels retain a consistent readable size');

    
    doc.querySelector('[data-ag-workflow="challenge"]').click();await tick();
    doc.querySelector('[data-ag-challenge-mode="classify"]').click();await tick();
    const namedAngle=doc.querySelector('.gd-ag-visual>svg'),namedTask=cap().task,vertexName=namedAngle.querySelector('[data-ag-point-label="A"]');
    assert(vertexName,'Angle challenge names its vertex');
    const vertexDir=(Math.atan2(220-Number(vertexName.getAttribute('y')),Number(vertexName.getAttribute('x'))-400)*180/Math.PI-(namedTask.rotation||0)+720)%360;
    assert(vertexDir>=namedTask.angle,'Vertex name is outside the marked angle sector');
    const namesPaper=TT99Goodies.publishing.createDocument();namesPaper.addCurrent(id,cap());
    assert(TT99Goodies.publishing.renderItem(namesPaper.list()[0],false).querySelector('[data-ag-point-label="A"]').getAttribute('x')===vertexName.getAttribute('x'),'Published angle uses the same exterior vertex placement');
    for(const type of ['measure','reflex']){
      doc.querySelector('[data-ag-challenge-mode="'+type+'"]').click();await tick();
      const t=cap().task,ms=doc.querySelector('.gd-ag-visual>svg'),w=doc.defaultView;
      assert(!ms.querySelector('[data-geometry-instrument]'),'Independent angle starts without aligned protractor: '+type);
      doc.querySelector('[data-ag-measure="show"]').click();
      assert(!ms.querySelector('[data-geometry-instrument]'),'Pupil must position instrument centre');
      const tap=(x,y)=>{const p=new w.DOMPoint(x,y).matrixTransform(ms.getScreenCTM());for(const event of ['pointerdown','pointerup'])ms.dispatchEvent(new w.PointerEvent(event,{bubbles:true,cancelable:true,pointerId:17,pointerType:'touch',button:0,clientX:p.x,clientY:p.y}))};
      tap(403,222);assert(ms.querySelector('[data-geometry-instrument="protractor"]'),'Centre placement uses shared protractor');
      tap(...M.polar(400,220,208,t.rotation));
      const zero=ms.querySelector('[data-ag-measure-overlay]>line'),p=M.polar(400,220,208,t.rotation);
      assert(Math.hypot(+zero.getAttribute('x2')-p[0],+zero.getAttribute('y2')-p[1])<.1,'Pupil aligns zero to selected ray');
      assert(!doc.querySelector('.gd-ag-inspect-message').textContent.includes('Measured angle:'),'No numerical measurement readout');
      doc.querySelector('[data-ag-measure="format"]').click();
      assert(ms.querySelector('[data-geometry-instrument="protractor"]').textContent.includes('350'),'Full protractor available');
      const pp=TT99Goodies.publishing.createDocument();pp.addCurrent(id,cap());
      assert(!TT99Goodies.publishing.renderItem(pp.list()[0],false).querySelector('[data-geometry-instrument]'),'Printed angle requires real protractor');
      assert(TT99Goodies.publishing.answerGraphic(pp.list()[0]).querySelector('[data-geometry-instrument]'),'Teacher key includes aligned protractor');
    }
    doc.querySelector('[data-ag-challenge-mode="quad-type"]').click();await tick();
    const inspectSvg=doc.querySelector('.gd-ag-visual>svg'),inspectList=inspectSvg.querySelector('[data-ag-inspect-polygon]').points,inspectPoints=Array.from({length:inspectList.numberOfItems},(_,i)=>{const p=inspectList.getItem(i);return [p.x,p.y]}),iw=doc.defaultView;
    const inspectTap=i=>{const p=new iw.DOMPoint(...inspectPoints[i]).matrixTransform(inspectSvg.getScreenCTM());inspectSvg.dispatchEvent(new iw.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',button:0,clientX:p.x,clientY:p.y}))};
    doc.querySelector('[data-ag-inspect="ruler"]').click();inspectTap(0);inspectTap(1);
    const length=Math.hypot(inspectPoints[1][0]-inspectPoints[0][0],inspectPoints[1][1]-inspectPoints[0][1])/40;
    assert(inspectSvg.querySelector('[data-ag-inspection] [data-geometry-instrument="ruler"]'),'Investigation uses the shared ruler renderer');
    assert(doc.querySelector('.gd-ag-inspect-message').textContent.includes(length.toFixed(2)+' diagram units'),'Investigation ruler measures actual selected vertices');
    doc.querySelector('[data-ag-inspect="angle"]').click();inspectTap(0);inspectTap(1);inspectTap(3);
    const va=inspectPoints[1].map((v,i)=>v-inspectPoints[0][i]),vb=inspectPoints[3].map((v,i)=>v-inspectPoints[0][i]),deg=Math.round(Math.acos(Math.max(-1,Math.min(1,(va[0]*vb[0]+va[1]*vb[1])/(Math.hypot(...va)*Math.hypot(...vb)))))*180/Math.PI);
    assert(inspectSvg.querySelector('[data-ag-inspection] [data-geometry-instrument="protractor"]'),'Investigation uses the shared dual-scale protractor');
    assert(doc.querySelector('.gd-ag-inspect-message').textContent.includes(deg+'°'),'Investigation protractor measures selected angle');
    doc.querySelector('[data-ag-inspect="clear"]').click();assert(!inspectSvg.querySelector('[data-ag-inspection]').children.length,'Clear removes inspection without changing question');
    {
      const questionOutline=inspectSvg.querySelector('[data-ag-inspect-polygon]').getAttribute('points');
      const physicalBtn=doc.querySelector('[data-ag-inspect="protractor"]');physicalBtn.click();await tick();
      const instrumentPicker=doc.querySelector('[data-ag-instrument]'),overlay=inspectSvg.querySelector('[data-ag-measure-overlay]');
      assert(instrumentPicker&&!instrumentPicker.closest('.gd-ag-inspect-tools').hidden,'Physical instruments available in contextual toolbar');
      inspectTap(0);
      for(const kind of ['protractor','ruler','square45','square30','compass']){
        instrumentPicker.value=kind;instrumentPicker.dispatchEvent(new iw.Event('change',{bubbles:true}));
        assert(overlay.querySelector('[data-geometry-instrument="'+kind+'"]'),'Physical overlay renders '+kind);
      }
      inspectTap(1);
      assert(inspectSvg.querySelector('[data-ag-inspect-polygon]').getAttribute('points')===questionOutline,'Physical instrument operations preserve the original question');
      doc.querySelector('[data-ag-inspect="clear"]').click();assert(!overlay.children.length&&instrumentPicker.closest('.gd-ag-inspect-tools').hidden,'Clear dismisses physical instruments and contextual controls');
      const auxiliary=inspectSvg.querySelector('[data-ag-auxiliary]');
      doc.querySelector('[data-ag-inspect="auxiliary"]').click();inspectTap(0);inspectTap(2);
      assert(auxiliary.querySelectorAll('[data-ag-aux-mark="segment"]').length===1,'Auxiliary diagonal can be drawn between existing vertices');
      doc.querySelector('[data-ag-aux="circle"]').click();inspectTap(0);inspectTap(1);
      assert(auxiliary.querySelector('[data-ag-aux-mark="circle"]'),'Auxiliary compass circle is retained');
      doc.querySelector('[data-ag-aux="undo"]').click();assert(!auxiliary.querySelector('[data-ag-aux-mark="circle"]')&&auxiliary.querySelector('[data-ag-aux-mark="segment"]'),'Undo only removes latest auxiliary mark');
      physicalBtn.click();assert(auxiliary.querySelector('[data-ag-aux-mark="segment"]'),'Switching to physical tools retains construction marks');
      doc.querySelector('[data-ag-inspect="auxiliary"]').click();doc.querySelector('[data-ag-aux="erase"]').click();
      const mid=inspectPoints[0].map((v,i)=>(v+inspectPoints[2][i])/2),v=new iw.DOMPoint(...mid).matrixTransform(inspectSvg.getScreenCTM());
      inspectSvg.dispatchEvent(new iw.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',button:0,clientX:v.x,clientY:v.y}));
      assert(!auxiliary.querySelector('[data-ag-aux-mark]'),'Erase removes only auxiliary diagonal');
      assert(inspectSvg.querySelector('[data-ag-inspect-polygon]').getAttribute('points')===questionOutline,'Question geometry unchanged after auxiliary construction and erase');
      doc.querySelector('[data-ag-aux="undo"]').click();assert(auxiliary.querySelector('[data-ag-aux-mark="segment"]'),'Undo restores erased mark');
      doc.querySelector('[data-ag-inspect="clear"]').click();assert(!auxiliary.children.length,'Clear removes auxiliary marks as well as instruments');

    }
    doc.querySelector('[data-ag-challenge-mode="diagonal-bisect"]').click();await tick();
    const ds=doc.querySelector('.gd-ag-visual>svg'),dp=ds.querySelector('[data-ag-inspect-polygon]').points,intersection=ds.querySelector('[data-ag-inspect-point="O"]');
    assert(intersection,'Diagonal intersection is a selectable inspection point');
    const diagTap=p=>{const view=doc.defaultView;const v=new view.DOMPoint(...p).matrixTransform(ds.getScreenCTM());ds.dispatchEvent(new view.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',button:0,clientX:v.x,clientY:v.y}))};
    const o=[Number(intersection.getAttribute('cx')),Number(intersection.getAttribute('cy'))],a0=[dp.getItem(0).x,dp.getItem(0).y],b0=[dp.getItem(1).x,dp.getItem(1).y];
    doc.querySelector('[data-ag-inspect="ruler"]').click();diagTap(a0);diagTap(o);
    assert(ds.querySelector('[data-ag-inspection] [data-geometry-instrument="ruler"]'),'Ruler can measure vertex to diagonal intersection');
    doc.querySelector('[data-ag-inspect="angle"]').click();diagTap(o);diagTap(a0);diagTap(b0);
    assert(ds.querySelector('[data-ag-inspection] [data-geometry-instrument="protractor"]'),'Protractor can measure the angle between diagonals at their intersection');
    const investigationPaper=TT99Goodies.publishing.createDocument();investigationPaper.addCurrent(id,cap());assert(!TT99Goodies.publishing.renderItem(investigationPaper.list()[0],false).querySelector('[data-ag-inspection]'),'Inspection overlays do not leak into pupil publication');
    doc.querySelector('[data-ag-challenge-mode="draw"]').click();await tick();
    assert(!doc.querySelector('.gd-ag-inspect-tools'),'Calculation and construction tasks do not get inspection shortcuts');
    const t=cap().task;assert(t.type==='draw'&&doc.querySelector('[data-gd-pupil-check]').disabled,'Construction starts unanswered');
    assert(parseFloat(doc.defaultView.getComputedStyle(doc.querySelector('.gd-challenge-prompt')).fontSize)>=17,'Angle question uses classroom-sized text');
    assert(doc.querySelector('[data-gd-pupil-check]').getBoundingClientRect().height>=40,'Angle check action has a generous touch target');
    const win=doc.defaultView,box=doc.querySelector('.gd-ag-visual'),rad=Math.PI/180;
    const handle=()=>svg().querySelector('[data-ag-angle-handle]');
    const handleAngle=()=>((Math.atan2(220-Number(handle().getAttribute('cy')),Number(handle().getAttribute('cx'))-400)/rad-t.rotation)%360+360)%360;
    assert(Math.min(handleAngle(),360-handleAngle())<.02&&cap().attempt===null,'Initial construction arm is at zero, not the answer');
    assert(!svg().querySelector('[data-ag-angle-label]')&&!svg().querySelector('[data-ag-angle-mark]'),'No solved angle or angle label before construction');
    function anglePointer(type,angle,node){
      const theta=(t.rotation+angle)*rad,p=new win.DOMPoint(400+247*Math.cos(theta),220-247*Math.sin(theta)).matrixTransform(svg().getScreenCTM());
      node.dispatchEvent(new win.PointerEvent(type,{bubbles:true,cancelable:true,pointerId:8,pointerType:'touch',button:0,buttons:type==='pointerup'?0:1,clientX:p.x,clientY:p.y}));
    }
    anglePointer('pointerdown',0,svg().querySelector('[data-ag-angle-target]'));
    const wrong=t.angle>90?40:140;
    anglePointer('pointermove',wrong+.27,box);await tick();
    assert(cap().attempt===wrong&&Math.abs(handleAngle()-wrong)<.02,'Continuous pointer movement snaps to nearest whole degree');
    assert(!svg().querySelector('[data-ag-angle-label]')&&!doc.querySelector('#ag-attempt').textContent.includes('°'),'Construction does not display its numerical answer');
    anglePointer('pointermove',t.angle+.24,box);
    anglePointer('pointerup',t.angle,box);await tick();
    assert(cap().attempt===t.angle&&Math.abs(handleAngle()-t.angle)<.02,'Arm continues dragging after SVG redraw and reaches target graduation');
    doc.querySelector('[data-gd-pupil-check]').click();await tick();
    assert(doc.querySelector('.gd-pupil-feedback').classList.contains('is-correct'),'Constructed angle is assessed');
    const P=TT99Goodies.publishing,draft=P.createDocument();draft.addCurrent(id,cap());
    assert(draft.list()[0].data.mode==='angle','Published question retains geometry mode');
    assert(P.answerSummary(draft.list()[0])===String(t.angle),'Published key retains answer');
    const calls=[],X=G.exportTools;X.downloadSvg=svg=>calls.push(svg.textContent);X.printSvg=svg=>calls.push(svg.textContent);
    doc.querySelector('[data-gd-direct-export="svg"]').click();await tick();doc.querySelector('[data-gd-direct-export="key-print"]').click();await tick();
    assert(calls.length===2&&calls[0].includes(t.prompt)&&calls[1].includes('°'),'Direct pupil and teacher exports are connected');
    const pupilSvg=P.renderItem(draft.list()[0],false);
    assert(!pupilSvg.querySelector('[data-ag-angle-handle],[data-ag-moving-arm],[data-ag-angle-mark]'),'Printed construction question contains no answer arm');
    doc.querySelector('[data-challenge-action="another"]').click();await tick();
    assert(cap().attempt===null&&!svg().querySelector('[data-ag-angle-mark]'),'Another resets the construction independently of its new target');

    fixture.frame.querySelector('[data-board-export]').click();await tick();
    assert(!fixture.frame.querySelector('[data-pub-key-group]').hidden,'Angle teacher keys available in whiteboard');
    doc.querySelector('[data-ag-challenge-mode="shape-build"]').click();await tick();
    const labTask=cap().task,tray=doc.querySelector('.gd-ag-lab-toolbar'),tools=[...tray.querySelectorAll('.gd-ag-lab-tools button')];
    assert(labTask.type==='shape-build'&&tools.length===8&&!tray.querySelector('[data-ag-tool="move"]'),'Construction opens with eight paper-equivalent tools and no vertex move');
    assert(tools.every(b=>b.querySelector('svg path,svg rect,svg circle')&&b.getAttribute('aria-label')&&b.getBoundingClientRect().height>=44),'Instrument icons have accessible names and touch targets');
    assert(tray.querySelector('[data-ag-tool="segment"]').getAttribute('aria-pressed')==='true','Ruler selected initially');
    assert(tray.querySelectorAll('.gd-ag-lab-options input:checked').length===2&&!tray.querySelector('[data-ag-option="measure"]'),'Construction challenges keep snap and grid but hide numerical measurement shortcuts');
    tray.querySelector('[data-ag-tool="square30"]').click();await tick();
    assert(tray.querySelector('[data-ag-tool="square30"]').getAttribute('aria-pressed')==='true'&&!tray.querySelector('[data-ag-tool="corner"]').hidden,'Set square shows its contextual corner control');
    tray.querySelector('[data-ag-tool="segment"]').click();await tick();
    assert(tray.querySelector('[data-ag-tool="corner"]').hidden,'Irrelevant instrument controls remain hidden');
    const labSvg=doc.querySelector('.gd-ag-visual>svg');
    function tapLab(x,y){
      const p=new win.DOMPoint(x,y).matrixTransform(labSvg.getScreenCTM());
      for(const type of ['pointerdown','pointerup'])labSvg.dispatchEvent(new win.PointerEvent(type,{bubbles:true,cancelable:true,pointerId:11,pointerType:'touch',button:0,buttons:type==='pointerup'?0:1,clientX:p.x,clientY:p.y}));
    }
    const [cx,cy]=M.polar(340,302,labTask.length*40,labTask.angle);
    tapLab(340,302);tapLab(cx,cy);tapLab(580,302);tapLab(cx,cy);await tick();
    assert(M.labCheck(cap().lab,labTask).correct,'Illustrated ruler remains functional and shares geometric assessment');
    assert(!doc.querySelector('[data-gd-pupil-check]').disabled,'Completed triangle enables Check');
    tray.querySelector('[data-ag-tool="undo"]').click();await tick();
    assert(!M.labCheck(cap().lab,labTask).ready,'Illustrated Undo removes the last segment');
    assert(labSvg.querySelectorAll('[data-ag-dimension]').length===1,'Only given baseline dimension is shown in pupil construction');
    const fixedPoints=JSON.stringify(cap().lab.points);
    tray.querySelector('[data-ag-tool="compass"]').click();tapLab(340,302);
    const compassEnd=new win.DOMPoint(580,302).matrixTransform(labSvg.getScreenCTM());
    labSvg.dispatchEvent(new win.PointerEvent('pointermove',{bubbles:true,pointerId:11,pointerType:'touch',clientX:compassEnd.x,clientY:compassEnd.y}));
    assert(!labSvg.querySelector('[data-geometry-instrument="ruler"]')&&labSvg.textContent.includes('r = 6.0 cm'),'Compass preview shows its radius without a ruler or global measurement setting');
    tapLab(580,302);
    const opening=tray.querySelector('[data-ag-tool="compass-opening"]');assert(!opening.disabled,'Compass opening can be retained after drawing');
    opening.click();tapLab(580,302);
    const circles=cap().lab.circles;assert(circles.length===2&&Math.abs(circles[0].r-240)<1e-7&&circles[1].r===circles[0].r,'Compass transfers its exact opening to another centre');
    assert(JSON.stringify(cap().lab.points)===fixedPoints,'Compass operations preserve existing points');
    opening.click();assert(opening.getAttribute('aria-pressed')==='false','Compass can be reopened for a different radius');
    tray.querySelector('[data-ag-tool="help"]').click();await tick();
    assert(!doc.querySelector('.gd-ag-lab-guide').hidden&&!doc.querySelector('.gd-ag-guide-example'),'Challenge help provides technique without worked answers');
    {
      const model=win.TT99Goodies.angles,methods=await model.loadConstructionLibrary();
      assert(model.labTypes.every(type=>methods.some(m=>m.id===model.CONSTRUCTION_METHODS_BY_TASK[type])),'Every construction challenge has an associated method');
      for(const type of model.labTypes)for(let i=0;i<30;i++){
        const t=model.generate({type,enrichment:true}),base=methods.find(m=>m.id===model.CONSTRUCTION_METHODS_BY_TASK[type]),m=model.challengeConstructionMethod(base,t),sol=model.labSolution(t),end=model.constructionFrame(m,m.steps.length-1),pts=Object.fromEntries(end.filter(o=>o.kind==='point').map(o=>[o.label,o.at])),dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
        assert(m.challengeSpecific&&m.steps.length===m.graphics.frames.length&&model.constructionMethodGraphic(m,m.steps.length-1).outerHTML.indexOf('NaN')===-1,'Challenge-specific vector stages render: '+type);
        if(type==='build-circle')assert(pts.A&&!pts.B&&m.graphics.initial.length===1,'Circle guide starts with its centre only');else assert(dist(pts.A,pts.B)===240,'Challenge baseline remains exactly 6 cm: '+type);
        const expected=[],cm=v=>Number(v.toFixed(3))+' cm',deg=v=>Number(v.toFixed(3))+'°';
        if(type==='build-circle')expected.push('Centre A','Radius = '+cm(t.length));else expected.push('AB = 6 cm');
        if(['shape-build','build-right','build-perpendicular','build-sss','build-equilateral'].includes(type))expected.push('AC = '+cm(t.length));
        if(['build-sss','build-equilateral'].includes(type))expected.push('BC = '+cm(t.rightLength));
        if(['build-right','build-perpendicular'].includes(type))expected.push('Angle BAC = 90°');
        if(type==='shape-build'||type==='build-asa')expected.push('Angle BAC = '+deg(t.angle));
        if(type==='build-asa')expected.push('Angle ABC = '+deg(t.rightAngle));
        if(['build-square','build-rectangle'].includes(type))expected.push('BC = '+cm(t.length),'Four right angles');
        if(type==='build-rhombus')expected.push('All four sides = 6 cm','Angle BAD = '+deg(t.angle));
        assert(JSON.stringify(m.given)===JSON.stringify(expected)&&m.objective===t.prompt,'Method givens and task prompt agree: '+type);
        if(type==='build-midpoint'||type==='build-bisector')assert(m.title===(type==='build-midpoint'?'Construct the midpoint of AB':'Construct the perpendicular bisector of AB'),'Shared technique has challenge-specific title');
        assert(model.labCheck(sol,t).correct,'Contextual method uses an assessed valid solution: '+type);
        if(type==='build-circle')assert(end.some(o=>o.kind==='circle'&&o.radius===40*t.length),'Guide circle has task radius');
        if(type==='build-midpoint'||type==='build-bisector')assert(dist(pts.A,pts.M)===120&&dist(pts.B,pts.M)===120,'Guide midpoint exact');
        if(pts.C&&type!=='build-bisector')assert(dist(pts.C,sol.points[2])<1e-7,'Guide C matches assessed solution');
        if(pts.D)assert(dist(pts.D,sol.points[3])<1e-7,'Guide D matches assessed solution');
      }
      const before=JSON.stringify(cap().lab),taskBefore=JSON.stringify(cap().task);
      doc.querySelector('[data-ag-tool="construction-library"]').click();await tick(50);
      const panel=doc.querySelector('[data-ag-method-panel]'),action=id=>panel.querySelector('[data-ag-method-action="'+id+'"]');
      assert(panel&&!panel.hidden&&panel.querySelector('[data-ag-method-task]'),'Challenge opens contextual method guide');
      assert(!panel.querySelector('[data-ag-method-graphic]')&&panel.querySelector('[data-ag-method-step]').dataset.agMethodStep==='-1','Challenge guidance starts text-first');
      action('next').click();action('graphics').click();assert(panel.querySelector('[data-ag-method-graphic]'),'Challenge graphic appears only by choice');
      action('check-drawing').click();assert(panel.querySelector('[data-ag-method-feedback]').textContent.length>0,'Optional verification returns drawing feedback');
      action('close').click();assert(JSON.stringify(cap().lab)===before&&JSON.stringify(cap().task)===taskBefore,'Method guide never modifies challenge drawing or assessment');
    }
    {
      const constructionModel=win.TT99Goodies.angles;
      for(const type of ['build-midpoint','build-perpendicular','build-circle','build-asa','build-bisector','build-rhombus']){
        for(let sample=0;sample<60;sample++){
          const t=constructionModel.generate({type,enrichment:true}),solution=constructionModel.labSolution(t);
          assert(constructionModel.labCheck(solution,t).correct,'Generated construction solution validates: '+type);
          assert(solution.points.every(p=>p[0]>=0&&p[0]<=800&&p[1]>=0&&p[1]<=400),'Construction solution fits canvas: '+type);
          assert(!constructionModel.labCheck(constructionModel.labEmpty(),t).correct,'Empty construction cannot pass: '+type);
          const reflected=JSON.parse(JSON.stringify(solution));reflected.points=reflected.points.map(p=>[p[0],604-p[1]]);
          assert(constructionModel.labCheck(reflected,t).correct,'Reflected construction is mathematically valid: '+type);
        }
        const t=constructionModel.generate({type,enrichment:true});
        assert(constructionModel.labCheck(constructionModel.labSolution(t),t).ready,'Construction answer ready: '+type);
      }
    }
    for(const type of ['build-sss','build-equilateral','build-right','build-rectangle','build-square']){
      doc.querySelector('[data-ag-challenge-mode="'+type+'"]').click();await tick();
      assert(cap().task.type===type&&doc.querySelector('.gd-ag-lab-tools'),'New construction family mounts interactive lab: '+type);
      const pubDraft=P.createDocument();pubDraft.addCurrent(id,cap());const item=pubDraft.list()[0];
      assert(P.renderItem(item,false).textContent.includes('Draw AB')||P.renderItem(item,false).textContent.includes('draw AB'),'Printed construction asks pupils to draw full-size baseline');
      assert(P.answerGraphic(item).querySelector('[data-ag-point-label]')&&P.answerGraphic(item).getAttribute('data-ag-construction-key')==='1','New construction has graphical key: '+type);
    }
    {
      const model=win.TT99Goodies.angles;
      const mixedConstruction=[];
      for(const type of model.labTypes){
        const task=model.generate({type,enrichment:true}),item=P.record(id,'challenge',task);
        mixedConstruction.push(item);
        const pupil=P.renderItem(item,false),key=P.answerGraphic(item);
        assert(!pupil.querySelector('[data-ag-point-label]')&&!pupil.querySelector('[data-ag-construction-key]'),'Construction pupil sheet contains no solution: '+type);
        assert(key.getAttribute('data-ag-construction-key')==='1'&&key.querySelector('[data-ag-point-label]'),'Every construction has compact graphical key: '+type);
        assert(!key.querySelector('[data-ag-grid]'),'Answer annex omits working grid: '+type);
        assert(P.answerNote(item).includes('Illustrative diagram'),'Answer note clarifies scale and valid alternatives: '+type);
        if(type==='build-circle'){assert(key.querySelector('[data-ag-radius-line]')&&!key.querySelector('[data-ag-point-label="B"]')&&!key.textContent.includes('6 cm'),'Circle answer labels radius without unrelated baseline');assert(!pupil.textContent.includes('Draw AB')&&pupil.textContent.includes('Mark centre A'),'Circle pupil prompt requires only its centre and specified radius');}
        if(type==='build-asa')assert(key.querySelectorAll('[data-ag-angle-mark]').length>=2,'ASA answer marks both angles');
        if(type==='build-midpoint'||type==='build-bisector')assert(key.querySelectorAll('[data-ag-midpoint-tick]').length===2,'Midpoint marks show equal halves: '+type);
      }
      const pupilPages=P.pages(mixedConstruction,{title:'Mixed construction practice'}),teacherPages=P.pages(mixedConstruction,{title:'Mixed construction practice',teacher:true}),annex=teacherPages.filter(page=>page.getAttribute('data-worksheet-answer')==='annex');
      assert(pupilPages.length>1&&pupilPages.every(page=>!page.querySelector('[data-pub-answer-graphic],[data-ag-construction-key]')),'Mixed construction pupil pages contain no answer graphics');
      const areas=pupilPages.flatMap(page=>[...page.querySelectorAll('[data-ag-pupil-working]')].map(rect=>{
        const inner=rect.closest('svg'),card=inner.closest('[data-pub-item]'),iv=inner.viewBox.baseVal,cv=card.viewBox.baseVal;
        const scale=Math.min(Number(inner.getAttribute('width'))/iv.width,Number(inner.getAttribute('height'))/iv.height)*Math.min(Number(card.getAttribute('width'))/cv.width,Number(card.getAttribute('height'))/cv.height)*182/page.viewBox.baseVal.width;
        return [Number(rect.getAttribute('width'))*scale,Number(rect.getAttribute('height'))*scale];
      }));
      assert(areas.length===mixedConstruction.length&&areas.every(([w,h])=>w>=140&&h>=100),'Every construction pupil workspace provides at least 140 x 100 mm in the intended A4 printable layout');
      const indices=attribute=>annex.flatMap(page=>[...page.querySelectorAll('['+attribute+']')].map(n=>Number(n.getAttribute(attribute))));
      const expected=mixedConstruction.map((_,i)=>i+1);
      assert(JSON.stringify(indices('data-pub-answer-number'))===JSON.stringify(expected)&&JSON.stringify(indices('data-pub-answer-graphic'))===JSON.stringify(expected),'Mixed construction annex has one numbered graphical answer per challenge in order');
      assert(expected.every(i=>indices('data-pub-answer-note').includes(i)),'Every construction answer includes marking guidance');
    }
    doc.querySelector('[data-ag-workflow="build"]').click();await tick();
    const mode=doc.getElementById('ag-mode');mode.value='construct';mode.dispatchEvent(new win.Event('change',{bubbles:true}));await tick();
    const freeSvg=doc.querySelector('.gd-ag-lab-canvas');
    assert(freeSvg&&freeSvg.getAttribute('viewBox')==='0 0 1188 840','Free construction defaults to A4 landscape');
    assert(cap().demo.labDrawing.points.length===0,'Free canvas has no compulsory baseline');
    doc.querySelector('[data-ag-tool="help"]').click();await tick();
    assert(doc.querySelector('.gd-ag-guide-example svg'),'Free mode provides worked instrument demonstration');
    const next=[...doc.querySelectorAll('.gd-ag-guide-example button')].find(b=>b.textContent==='Next step');next.click();await tick();
    assert(doc.querySelector('.gd-ag-guide-example').textContent.includes('Step 2 / 3')&&cap().demo.labDrawing.points.length===0,'Demo advances without altering free drawing');
    doc.querySelector('[data-ag-tool="help"]').click();
    {
      const model=win.TT99Goodies.angles,methods=await model.loadConstructionLibrary();
      assert(methods.length>=36,'Construction library has at least thirty-six methods');
      {
        const roleMap=model.INDEPENDENT_METHOD_ROLES;
        assert(Object.keys(roleMap).length===methods.length&&methods.every(m=>roleMap[m.id]),'Every library method has independent verification');
        for(const [methodId,roles] of Object.entries(roleMap)){
          const m=methods.find(m=>m.id===methodId),items=model.constructionFrame(m,m.steps.length-1);
          for(const [rotation,scale,reflect] of [[0,1,1],[.77,1.8,1],[1.2,1.4,-1]]){
            const st=model.labEmpty(true),assignment={},transform=p=>[500+scale*(p[0]*Math.cos(rotation)-p[1]*reflect*Math.sin(rotation)),300+scale*(p[0]*Math.sin(rotation)+p[1]*reflect*Math.cos(rotation))];
            function index(p){const q=transform(p),i=st.points.findIndex(v=>Math.hypot(v[0]-q[0],v[1]-q[1])<1e-6);if(i>=0)return i;st.points.push(q);return st.points.length-1}
            for(const o of items)if(o.kind==='point'&&roles.includes(o.label))assignment[o.label]=index(o.at);
            if(methodId==='parallel-through-point')assignment.Q=index(items.find(o=>o.kind==='line'&&o.style==='result').b);
            for(const o of items){if(o.kind==='line')st.segments.push([index(o.a),index(o.b)]);if(o.kind==='circle')st.circles.push({i:index(o.center),r:o.radius*scale})}
            const p=Object.fromEntries(roles.map(k=>[k,st.points[assignment[k]]])),d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),angle=(a,o,b)=>Math.acos(Math.max(-1,Math.min(1,((a[0]-o[0])*(b[0]-o[0])+(a[1]-o[1])*(b[1]-o[1]))/(d(a,o)*d(b,o)))))*180/Math.PI;
            const targets={};
            for(const [key] of model.INDEPENDENT_METHOD_DIMENSIONS[methodId]||[]){
              if(['AB','AC','BC','AD','CD'].includes(key))targets[key]=d(p[key[0]],p[key[1]])/40;
              else if(key==='angleA')targets[key]=angle(p.B,p.A,p.D||p.C);
              else if(key==='angleB')targets[key]=angle(p.A,p.B,p.C);
              else if(key==='height')targets[key]=Math.abs((p.B[0]-p.A[0])*(p.D[1]-p.A[1])-(p.B[1]-p.A[1])*(p.D[0]-p.A[0]))/d(p.A,p.B)/40;
              else if(key==='radius')targets[key]=methodId==='circle-given-radius'?st.circles[0].r/40:methodId==='two-distance-locus'?d(p.A,p['P₁'])/40:d(p.M,p.P)/40;
            }
            const result=model.independentConstructionCheck(st,methodId,assignment,targets);
            if(Object.keys(targets).length){
              const missing=model.independentConstructionCheck(st,methodId,assignment,{});
              assert(!missing.correct&&missing.pending.length===Object.keys(targets).length,'Missing dimensions cannot pass '+methodId);
              const key=Object.keys(targets)[0],wrong={...targets,[key]:targets[key]+20};
              assert(!model.independentConstructionCheck(st,methodId,assignment,wrong).correct,'Incorrect given dimension rejected '+methodId);
            }
            assert(result.ready&&result.correct,'Independent construction accepts exact transformed '+methodId+': '+JSON.stringify(result));
            assert(!model.independentConstructionCheck(st,methodId,{}).ready,'Unassigned roles cannot pass '+methodId);
            const broken=JSON.parse(JSON.stringify(st));if(methodId==='circle-given-radius')broken.circles=[];else broken.points[assignment[roles.at(-1)]]=[-5000,-4000];
            assert(!model.independentConstructionCheck(broken,methodId,assignment,targets).correct,'Broken construction rejected '+methodId);
          }
        }
        for(const [separation,count] of [[240,'0'],[160,'1'],[100,'2'],[0,'infinite']]){
          const r=80,st=model.labEmpty(true),a=[100,200],b=[100+separation,200];st.points=[a,b];st.circles=[{i:0,r},{i:1,r}];const roles={A:0,B:1};
          if(count==='1'){roles['P₁']=2;st.points.push([180,200])}
          if(count==='2'){const h=Math.sqrt(r*r-separation*separation/4);roles['P₁']=2;roles['P₂']=3;st.points.push([150,200-h],[150,200+h])}
          if(count==='infinite')roles.B=0;
          assert(model.independentConstructionCheck(st,'two-distance-locus',roles,{radius:2,solutionCount:count}).correct,'Locus solution count verified: '+count);
          assert(!model.independentConstructionCheck(st,'two-distance-locus',roles,{radius:2,solutionCount:count==='0'?'infinite':'0'}).correct,'Wrong solution count cannot pass: '+count);
          assert(!model.independentConstructionCheck(st,'two-distance-locus',roles,{solutionCount:count}).correct,'Missing radius cannot pass: '+count);
        }
        assert(!model.independentConstructionCheck(model.labEmpty(true),'unknown-method',{}).supported,'Unsupported checks are explicitly marked unavailable');
      }
      for(const m of methods){
        for(const publicationMode of ['exercise','instructions','illustrated']){
          const draft=P.createDocument();draft.addCurrent(id,{constructionPublication:{type:'construction-method',constructionMethod:m,publicationMode}});
          const item=draft.list()[0],pupil=P.renderItem(item,false);
          assert(pupil.dataset.agMethodPublication===publicationMode&&!pupil.outerHTML.includes('NaN'),'Method publication renders: '+m.id+' '+publicationMode);
          if(publicationMode==='exercise'){
            assert(item.kind==='challenge'&&pupil.querySelector('[data-ag-method-working]')&&pupil.querySelectorAll('[data-ag-method-primitive]').length===m.graphics.initial.length,'Exercise exposes only starting geometry');
            const reference=pupil.querySelector('[data-ag-method-graphic]'),working=pupil.querySelector('[data-ag-method-working]');
            assert(Number(reference.getAttribute('y'))+Number(reference.getAttribute('height'))<=Number(working.getAttribute('y'))&&Number(working.getAttribute('height'))>=460,'Method reference is separate from the blank drawing area: '+m.id);
            const key=P.answerGraphic(item);assert(key.querySelectorAll('[data-ag-method-primitive]').length===model.constructionFrame(m,m.steps.length-1).length&&P.answerSummary(item)===m.checks.join('; '),'Method answer annex shows complete construction and criteria');
          }else{assert(item.kind==='diagram'&&P.answerSummary(item)===null,'Instruction handouts do not duplicate the answer annex');assert(pupil.textContent.includes(m.steps[0]),'Handout contains written instructions');if(publicationMode==='illustrated')assert(pupil.querySelectorAll('[data-ag-method-graphic]').length===m.steps.length+1,'Illustrated handout contains every stage');else assert(!pupil.querySelector('[data-ag-method-graphic]'),'Text handout omits diagrams')}
          assert(P.pages([item],'Construction').length>0,'Method fits document pagination');
        }
      }
      assert(new Set(methods.map(m=>m.id)).size===methods.length,'Construction method IDs are unique');
      const finalPoints=id=>Object.fromEntries(model.constructionFrame(methods.find(m=>m.id===id),100).filter(o=>o.kind==='point').map(o=>[o.label,o.at])),dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),near=(a,b)=>Math.abs(a-b)<1e-6,dot=(a,b,c)=>(a[0]-b[0])*(c[0]-b[0])+(a[1]-b[1])*(c[1]-b[1]);
      const eq=finalPoints('triangle-equilateral');assert(near(dist(eq.A,eq.B),dist(eq.A,eq.C))&&near(dist(eq.A,eq.B),dist(eq.B,eq.C)),'Equilateral example is exact');
      for(const id of ['square-on-side','rectangle-sides','parallelogram-sas']){const p=finalPoints(id);assert(near(dist(p.A,p.B),dist(p.C,p.D))&&near(dist(p.A,p.D),dist(p.B,p.C)),'Quadrilateral opposite sides match: '+id);if(id!=='parallelogram-sas')assert(near(dot(p.B,p.A,p.D),0),'Rectangle example has right angle: '+id)}
      const sq=finalPoints('square-on-side');assert(near(dist(sq.A,sq.B),dist(sq.A,sq.D)),'Square has equal adjacent sides');
      const cc=finalPoints('triangle-circumcircle');assert(near(dist(cc.O,cc.A),dist(cc.O,cc.B))&&near(dist(cc.O,cc.A),dist(cc.O,cc.C)),'Circumcentre is equidistant from vertices');
      const ic=finalPoints('triangle-incircle'),lineDistance=(p,a,b)=>Math.abs((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))/dist(a,b);assert([['A','B'],['B','C'],['C','A']].every(([a,b])=>near(lineDistance(ic.I,ic[a],ic[b]),dist(ic.I,ic.F))),'Incentre is equidistant from sides');
      const rh=finalPoints('rhombus-side-angle');assert([dist(rh.B,rh.C),dist(rh.C,rh.D),dist(rh.D,rh.A)].every(v=>near(v,dist(rh.A,rh.B))),'Rhombus example has equal sides');
      const tr=finalPoints('isosceles-trapezium');assert(near(dist(tr.A,tr.D),dist(tr.B,tr.C))&&near(tr.A[1],tr.B[1])&&near(tr.D[1],tr.C[1]),'Trapezium is symmetric with parallel bases');
      for(const [mid,labels] of [['square-in-circle','ABCD'],['regular-octagon','ABCDEFGH']]){const p=finalPoints(mid),v=[...labels];assert(v.every((n,i)=>near(dist(p[n],p[v[(i+1)%v.length]]),dist(p.A,p.B))&&near(dist(p[n],p.O),dist(p.A,p.O))),'Inscribed regular polygon has equal sides and common radius: '+mid)}
      const thirds=finalPoints('divide-segment-thirds');assert(near(dist(thirds.A,thirds.P),dist(thirds.P,thirds.Q))&&near(dist(thirds.P,thirds.Q),dist(thirds.Q,thirds.B)),'Segment is divided into exact thirds');
      const rt=finalPoints('right-triangle-hypotenuse');assert(near(dot(rt.A,rt.C,rt.B),0),'Hypotenuse construction preserves right angle');
      const cg=finalPoints('triangle-centroid');assert(near(dist(cg.C,cg.G),2*dist(cg.G,cg.M))&&near(dist(cg.A,cg.G),2*dist(cg.G,cg.N)),'Centroid divides medians 2:1');
      const semi=finalPoints('angle-in-semicircle');assert(near(dot(semi.A,semi.T,semi.B),0),'Semicircle construction creates right angle');
      const orth=finalPoints('triangle-orthocentre');assert(near(dot(orth.A,orth.F,orth.B),0)&&near(dot(orth.B,orth.G,orth.C),0)&&near((orth.H[0]-orth.B[0])*(orth.G[1]-orth.B[1])-(orth.H[1]-orth.B[1])*(orth.G[0]-orth.B[0]),0),'Orthocentre lies on the altitudes');
      const gold=finalPoints('golden-section');assert(near(dist(gold.A,gold.B)/dist(gold.A,gold.G),dist(gold.A,gold.G)/dist(gold.G,gold.B)),'Golden ratio exact');
      const pent=finalPoints('regular-pentagon'),vertices=[...'ABCDE'];assert(vertices.every((n,i)=>near(dist(pent[n],pent[vertices[(i+1)%5]]),dist(pent.A,pent.B))&&near(dist(pent[n],pent.O),dist(pent.A,pent.O)))&&near(dist(pent.A,pent.K),dist(pent.A,pent.B)),'Regular pentagon construction chord is exact');
      for(const id of ['common-internal-tangents','common-external-tangents']){const p=finalPoints(id);for(const i of [1,2]){const t=p['T'+i],u=p['U'+i];assert(near(dot(p.O,t,u),0)&&near(dot(p.P,u,t),0)&&near(dist(p.O,t),65)&&near(dist(p.P,u),30),'Common tangent contacts are exact: '+id)}}
      const lp=finalPoints('two-distance-locus');assert(['P₁','P₂'].every(n=>near(dist(lp[n],lp.A),110)&&near(dist(lp[n],lp.B),110)),'Both locus solutions satisfy both distances');
      for(const m of methods){assert(m.prerequisites.every(id=>methods.some(n=>n.id===id)),'Prerequisite methods exist: '+m.id);
        assert(m.objective&&m.steps.length===m.graphics.frames.length&&m.checks.length,'Method includes problem, matching written and graphical steps and checks: '+m.id);
        for(let i=-1;i<m.steps.length;i++){const svg=model.constructionMethodGraphic(m,i);assert(svg.querySelectorAll('[data-ag-method-primitive]').length===model.constructionFrame(m,i).length&&!svg.outerHTML.includes('NaN'),'Each construction step renders exact vector primitives: '+m.id)}
      }
      const originalDrawing=JSON.stringify(cap().demo.labDrawing);
      const libButton=doc.querySelector('[data-ag-tool="construction-library"]');assert(libButton,'Free construction exposes method library');libButton.click();await tick(50);
      const panel=doc.querySelector('[data-ag-method-panel]');assert(panel&&!panel.hidden&&panel.parentElement===doc.body,'Library floats independently outside widget');
      const search=panel.querySelector('[data-ag-method-search]');search.value='tangent';search.dispatchEvent(new win.Event('input',{bubbles:true}));assert(panel.querySelectorAll('[data-ag-method-id]').length===4,'Search filters the methods');
      panel.querySelector('[data-ag-method-id="tangents-external-point"]').click();
      const act=id=>panel.querySelector('[data-ag-method-action="'+id+'"]');
      assert(!panel.querySelector('[data-ag-method-graphic]')&&panel.querySelector('[data-ag-method-step]').dataset.agMethodStep==='-1','Text-first problem has no graphical spoilers');
      act('next').click();act('next').click();assert(panel.querySelector('[data-ag-method-step]').dataset.agMethodStep==='1','Written navigation advances step');
      act('graphics').click();assert(panel.querySelector('[data-ag-method-graphic]')&&panel.querySelector('[data-ag-method-step]').dataset.agMethodStep==='1','Graphical guide synchronises to current step');
      act('next').click();assert(panel.querySelector('[data-ag-method-graphic]').querySelectorAll('circle[data-ag-method-primitive="circle"]').length===2,'Auxiliary circle appears at correct step');
      const stepBeforeFold=panel.querySelector('[data-ag-method-step]').dataset.agMethodStep,guideGraphic=panel.querySelector('[data-ag-method-graphic]'),heightBeforeFold=panel.getBoundingClientRect().height;
      act('collapse').click();assert(act('collapse').getAttribute('aria-expanded')==='false'&&guideGraphic.closest('[hidden]')&&panel.getBoundingClientRect().height<heightBeforeFold,'Guide collapses independently to its header');
      act('collapse').click();assert(act('collapse').getAttribute('aria-expanded')==='true'&&panel.querySelector('[data-ag-method-graphic]')===guideGraphic&&panel.querySelector('[data-ag-method-step]').dataset.agMethodStep===stepBeforeFold,'Expanding retains graphical step and DOM');
      act('close').click();libButton.click();assert(!panel.hidden&&act('collapse').getAttribute('aria-expanded')==='true'&&panel.querySelector('[data-ag-method-step]').dataset.agMethodStep===stepBeforeFold&&panel.querySelector('[data-ag-method-graphic]'),'Reopening restores selected method and graphical step');
      assert(JSON.stringify(cap().demo.labDrawing)===originalDrawing,'Library collapse and reopen never change construction');
      panel.querySelector('details').open=true;panel.querySelector('[data-ag-method-related="midpoint"]').click();assert(panel.querySelector('[data-ag-method-step]').dataset.agMethodStep==='-1'&&!panel.querySelector('[data-ag-method-graphic]'),'Related technique opens independently in text-first mode');act('back').click();assert(panel.querySelector('[data-ag-method-step]').dataset.agMethodStep==='2'&&panel.querySelector('[data-ag-method-graphic]'),'Return from prerequisite restores original step and graphical mode');
      act('instructions').click();assert(!panel.querySelector('[data-ag-method-graphic]')&&panel.querySelector('[data-ag-method-step]').dataset.agMethodStep==='2','Returning to instructions preserves progress');
      act('verify').click();assert(panel.textContent.includes("Thales"),'Optional verification explains geometry');
      act('restart').click();assert(panel.querySelector('[data-ag-method-step]').dataset.agMethodStep==='-1','Restart returns to problem statement');
            const independent=panel.querySelector('[data-ag-method-action="check-independent"]');assert(independent,'Independent method offers geometric verification');independent.click();assert(panel.querySelector('[data-ag-method-independent-feedback]').textContent.includes('Assign a distinct existing point'),'Independent checker reports missing assignments without revealing answers');
assert(JSON.stringify(cap().demo.labDrawing)===originalDrawing,'Guide never alters the actual drawing');
            act('back').click();const methodSearch=panel.querySelector('[data-ag-method-search]');methodSearch.value='given radius';methodSearch.dispatchEvent(new win.Event('input',{bubbles:true}));panel.querySelector('[data-ag-method-id="circle-given-radius"]').click();const field=panel.querySelector('[data-ag-method-dimension="radius"]');field.closest('details').open=true;field.click();await tick();const touch=doc.querySelector('.gd-touch-keypad');assert(touch&&field.dataset.gdKeypad==='number','Independent dimensions reuse shared whiteboard keypad');touch.querySelector('[data-gd-touch-key="2"]').click();assert(field.value==='2','Shared keypad enters dimension');touch.querySelector('[data-gd-touch-close]').click();
act('close').click();assert(panel.hidden,'Guide closes independently');
    }
    const work=doc.querySelector('.gd-ag-lab-canvas'),beforeView=work.viewBox.baseVal.height,beforeScale=Math.hypot(work.getScreenCTM().a,work.getScreenCTM().b);
    doc.querySelector('[data-ag-tool="expand"]').click();await tick();
    const wsField=id=>doc.querySelector('[data-ag-workspace="'+id+'"]');
    wsField('format').value='A4';wsField('format').dispatchEvent(new win.Event('change',{bubbles:true}));wsField('orientation').value='landscape';wsField('grid').value='5';wsField('apply').click();await tick();
    assert(work.viewBox.baseVal.width===1188&&work.viewBox.baseVal.height===840&&work.getBoundingClientRect().width<=work.parentElement.clientWidth,'A4 workspace fits visible sheet');
    work.parentElement.dispatchEvent(new win.CustomEvent('tt99-viewport-resize',{detail:{h:1000}}));await tick();
    assert(work.viewBox.baseVal.width===1188&&work.viewBox.baseVal.height===840&&cap().demo.labDrawing.workspace.format==='A4','Viewport resize preserves paper dimensions and preset');
    const verticalGrid=[...work.querySelectorAll('[data-ag-grid]')].filter(l=>l.getAttribute('x1')===l.getAttribute('x2'));
    assert(Number(verticalGrid[1].getAttribute('x1'))-Number(verticalGrid[0].getAttribute('x1'))===20,'Five millimetre grid is exactly 20 drawing units');
    doc.querySelector('[data-ag-tool="expand"]').click();wsField('format').value='A5';wsField('apply').click();await tick();
    assert(work.viewBox.baseVal.width===840&&work.viewBox.baseVal.height===592,'A5 format can shrink the empty sheet below the old minimum');
    const previewPointer=(type,p)=>{const v=new win.DOMPoint(...p).matrixTransform(work.getScreenCTM());work.dispatchEvent(new win.PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',pointerId:47,button:0,clientX:v.x,clientY:v.y}))};
    const checkRuler=()=>{
      doc.querySelector('[data-ag-tool="segment"]').click();previewPointer('pointerdown',[60,160]);
      for(const endpoint of [[460,160],[97,160],[183,236],[660,160],[260,160]]){
        previewPointer('pointermove',endpoint);
        const ruler=work.querySelector('[data-geometry-instrument="ruler"]'),ticks=ruler.querySelectorAll('[data-me-division]'),width=Number(ruler.querySelector('rect').getAttribute('width')),len=Math.hypot(endpoint[0]-60,endpoint[1]-160);
        assert(width-len>=20-.01&&width-len<24+.01,'Construction ruler extends only 5–6 mm beyond active endpoint');
        assert(ticks.length===Math.round(width/4)+1&&Math.abs(Number(ticks[1].getAttribute('x1'))-4)<1e-7&&Math.abs(Number(ticks[ticks.length-1].getAttribute('x1'))-width)<1e-7,'Growing and shrinking ruler maintains exact millimetre graduations');
        if(ticks.length>10)assert(Math.abs(Number(ticks[10].getAttribute('x1'))-40)<1e-7,'Centimetre graduations remain calibrated');
      }
      doc.querySelector('[data-ag-tool="undo"]').click();assert(cap().demo.labDrawing.points.length===0,'Ruler preview cleanup preserves empty sheet');
    };
    {
      const N='http://www.w3.org/2000/svg',sample=doc.createElementNS(N,'svg');
      sample.setAttribute('viewBox','-500 -500 1000 1000');sample.style.cssText='position:absolute;left:0;top:0;width:600px;height:600px;visibility:hidden;pointer-events:none';doc.body.append(sample);
      const centreOf=n=>new win.DOMPoint(Number(n.getAttribute('x')),Number(n.getAttribute('y')));
      for(const side of [-1,1]){const ruler=G.instruments.ruler(sample,{width:400,length:10,height:44,side,labelSize:11});for(const label of ruler.querySelectorAll('[data-me-ruler-label]')){const b=label.getBBox();assert(b.x>=-.1&&b.x+b.width<=400.1&&b.y>=Math.min(0,side*44)-.1&&b.y+b.height<=Math.max(0,side*44)+.1,'Ruler numerals fit inside physical body at both ends and on either side')}ruler.remove()}
      for(const radius of [120,170,350])for(const direction of [-1,1]){
        const g=G.instruments.protractor(sample,{radius,start:37,direction}),body=g.querySelector('path'),labels=[...g.querySelectorAll('[data-me-protractor-label]')];
        assert(labels.length===38&&body.getAttribute('d').includes(' A '),'Protractor has a true circular outline and two complete scales');
        for(const label of labels){const p=centreOf(label);assert(body.isPointInFill(p),'Protractor numeral centres lie within the semicircle on either side')}
        g.remove();
      }
      for(const kind of ['square45','square30'])for(const corner of [0,1,2])for(const hand of [-1,1]){
        const o=[0,0],{opening,other,last,v,w}=M.squareGeometry(o,37,kind,corner,hand),g=G.instruments.setSquare(sample,{points:[o,v,w],angles:[opening,other,last],kind,unitsPerCm:40}),body=g.querySelector('[data-me-square-body]');
        for(const n of g.querySelectorAll('[data-me-square-label]'))assert(body.isPointInFill(centreOf(n))&&n.hasAttribute('transform'),'Set-square numerals sit on the solid rim and follow the edge');
        for(const n of g.querySelectorAll('[data-me-square-mm]')){const x=Number(n.getAttribute('x1')),y=Number(n.getAttribute('y1')),xx=Number(n.getAttribute('x2')),yy=Number(n.getAttribute('y2'));if(Math.hypot(xx-x,yy-y)>1e-6)assert(body.isPointInFill(new win.DOMPoint(xx,yy)),'Set-square graduation ends remain inside the solid rim')}
        g.remove();
      }

      for(const [kind,pts,angles] of [['square45',[[0,0],[200,0],[0,200]],[90,45,45]],['square30',[[0,0],[200,0],[0,200*Math.sqrt(3)]],[90,60,30]]]){
        const g=G.instruments.setSquare(sample,{points:pts,angles,unitsPerCm:40,kind});
        assert(g.querySelector('[data-me-square-body]').getAttribute('fill-rule')==='evenodd','Set square has an open centre');
        for(let edge=0;edge<2;edge++){const ticks=[...g.querySelectorAll('[data-me-square-edge="'+edge+'"]')];
          assert(ticks.length>10,'Set square contains millimetre graduations on both legs');
          const xy=n=>[Number(n.getAttribute('x1')),Number(n.getAttribute('y1'))];
          assert(Math.abs(Math.hypot(xy(ticks[1])[0]-xy(ticks[0])[0],xy(ticks[1])[1]-xy(ticks[0])[1])-4)<1e-6,'Set square tick spacing is exactly one millimetre');
        }
      }
      sample.replaceChildren();
      const ruler=G.instruments.ruler(sample,{width:400,length:10,height:44}),protractor=G.instruments.protractor(sample,{radius:170}),square=G.instruments.setSquare(sample,{points:[[0,0],[200,0],[0,-200]],angles:[90,45,45],kind:'square45',unitsPerCm:40});
      const all=[...sample.querySelectorAll('[data-me-division],[data-me-protractor-degree],[data-me-square-mm]')],coordinates=all.map(n=>['x1','y1','x2','y2'].map(k=>n.getAttribute(k)).join(',')).join('|'),visible=(g,selector)=>[...g.querySelectorAll(selector)].filter(n=>n.getAttribute('display')!=='none').length;
      G.instruments.adaptMarkings(sample,.1);
      assert(visible(ruler,'[data-me-division]')<101&&visible(protractor,'[data-me-protractor-degree]')<181&&visible(square,'[data-me-square-mm]')<102,'Zoomed-out utensils suppress overcrowded minor marks');
      assert(visible(ruler,'[data-me-ruler-label]')<11&&visible(protractor,'[data-me-protractor-label]')<38,'Zoomed-out utensils reduce numeral density');
      G.instruments.adaptMarkings(sample,2);
      assert(visible(ruler,'[data-me-division]')===101&&visible(protractor,'[data-me-protractor-degree]')===181&&visible(square,'[data-me-square-mm]')===102,'Zoom restores full calibrated graduations');
      assert(all.map(n=>['x1','y1','x2','y2'].map(k=>n.getAttribute(k)).join(',')).join('|')===coordinates,'Adaptive markings never alter tick coordinates');
      sample.remove();
    }
    {
      const scene=M.labEmpty(true);scene.points=[[100,100],[400,200],[100,350]];scene.segments=[[0,1]];
      const p={kind:'ruler',x:104,y:110,angle:0,size:400};
      const near=M.utensilAlignment(scene,p,'move',1);assert(near.kind==='Point'&&near.x===100&&near.y===100,'Utensil aligns precisely to nearby point');
      const shared=G.instruments,raw={points:scene.points,lines:[{a:scene.points[0],b:scene.points[1],ray:false}]};
      assert(JSON.stringify(shared.align(raw,p,'move',1))===JSON.stringify(near),'Shared visible-geometry alignment matches Geometry adapter');
      const degree=83.27*Math.PI/180,independent={points:[[100,100],[200,100]],lines:[{a:[100,100],b:[100+100*Math.cos(degree),100-100*Math.sin(degree)],ray:true}]};
      const read=shared.readAngle(independent,{kind:'protractor',x:100,y:100,angle:0,hand:1,snap:true},83,1);
      assert(Math.abs(read.reading-83.27)<1e-8&&read.kind==='Edge','Shared protractor accepts exact visible ray without widget model');
      assert(shared.readAngle({points:[],lines:[]},{kind:'protractor',x:100,y:100,angle:0,hand:1,snap:true},83,1).kind==='','No hidden angle target enters shared measurement policy');
      assert(M.utensilAlignment(scene,p,'move',4)===null,'Magnet tolerance is measured in screen pixels rather than drawing units');
      const q=M.utensilAlignment(scene,{...p,x:250,y:155},'move',1);assert(q.kind==='Edge'&&Math.abs((q.x-100)/3-(q.y-100))<1e-8,'Utensil origin snaps onto exact segment');
      const a=Math.atan2(-100,300)*180/Math.PI+360,r=M.utensilAlignment(scene,{...p,x:250,y:150,angle:a+1},'rotate',1);
      assert(r.kind==='Edge'&&Math.abs(r.angle-a)<1e-8,'Rotation aligns to nearby actual edge');
      assert(M.utensilAlignment(scene,{...p,x:800,y:700,angle:46},'rotate',1).angle===45,'Rotation snaps gently to common angles');
      assert(M.utensilAlignment(scene,{...p,x:800,y:700,angle:52},'rotate',1)===null,'Rotation stays free between snap tolerances');
      assert(M.utensilAlignment(scene,p,'resize',1)===null,'Resize never changes origin or angle through snapping');
      const exact=M.labEmpty(true);exact.points=[[100,100],[500,100]];exact.segments=[[0,1]];
      const aligned=M.utensilAlignment(exact,{kind:'ruler',x:97,y:106,angle:2,size:400},'move',1);
      assert(aligned.kind==='Aligned vertex'&&aligned.x===100&&aligned.y===100&&aligned.angle===0,'Ruler zero and measuring edge align together');
      const mid=M.utensilAlignment(exact,{kind:'ruler',x:-100,y:106,angle:0,size:400},'move',1);
      assert(mid.kind==='Aligned edge'&&Math.abs(mid.x+100)<1e-8&&mid.y===100&&mid.angle===0,'Ruler aligns by its measuring edge even with zero outside the segment');
      const tipScene=M.labEmpty(true);tipScene.points=[[500,100]];
      const tip=M.utensilAlignment(tipScene,{kind:'ruler',x:104,y:106,angle:0,size:400},'move',1);
      assert(tip.kind==='Endpoint'&&tip.x===100&&tip.y===100,'Ruler far endpoint can snap without changing length');
      const pro=M.utensilAlignment(exact,{kind:'protractor',x:105,y:105,angle:3,size:170},'move',1);
      assert(pro.kind==='Aligned vertex'&&pro.x===100&&pro.y===100&&pro.angle===0,'Protractor centre and baseline align in one gesture');
      // Exercise the common instrument-local annotation action independently
      // of the larger board's gesture fixtures.
      {
        const host=doc.createElement('div'),svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('viewBox','0 0 500 400');svg.style.cssText='width:500px;height:400px';host.append(svg);doc.body.append(host);
        const model={...M.labEmpty(true),points:[[160,208],[360,208]],names:['A','B'],segments:[[0,1]]};
        let controller,allowed=true,applied=0;
        const paint=()=>{svg.replaceChildren();controller.paint(svg)};
        controller=G.instruments.movable(host,()=>svg,paint,{kinds:['ruler'],annotation:{target:(t,scale)=>allowed?M.labMeasurementTarget(model,t,scale):null,apply:target=>{if(M.labApplyMeasurement(model,target))applied++;paint()}}});
        controller.add('ruler');
        const action=()=>svg.querySelector('[data-ag-utensil-action="annotate"]');
        assert(action()?.getAttribute('aria-label')==='Add length AB'&&svg.querySelectorAll('[data-ag-measurement-reference]').length===2,'Aligned instrument offers local annotation with reference preview');
        action().click();assert(applied===1&&M.labDimensionText(model,0,1,false)==='5.0 cm','Local instrument button persists the measured segment');
        allowed=false;paint();assert(!action()&&!svg.querySelector('[data-ag-measurement-reference]'),'Host can disable measurement annotation and preview');
        host.remove();
      }
      // Instrument annotations resolve named, visible geometric references.
      const measured={...M.labEmpty(true),points:[[100,100],[500,100],[240,100]],names:['A','B','C'],segments:[[0,1]]};
      const rulerPose={kind:'ruler',x:80,y:100,angle:0,size:480};
      const target=M.labMeasurementTarget(measured,rulerPose,1);
      assert(target?.kind==='length'&&target.names.join('')==='AB','Ruler resolves actual covered segment rather than ruler size');
      assert(M.labApplyMeasurement(measured,target)&&M.labDimensionText(measured,0,1,false)==='10.0 cm','Instrument adds persistent exact length independent of automatic measurements');
      measured.points[1]=[460,100];assert(M.labDimensionText(measured,0,1,false)==='9.0 cm','Pinned measured dimension follows geometry');
      assert(!M.labMeasurementTarget(measured,{...rulerPose,y:110},1)&&!M.labMeasurementTarget(measured,{...rulerPose,size:100},1),'Misaligned or too-short ruler cannot annotate');
      measured.segments.push([0,2]);assert(!M.labMeasurementTarget(measured,rulerPose,1),'Ambiguous overlapping measured segments are not guessed');
      measured.segmentStyles={'A:C':true};measured.showConstruction=false;assert(M.labMeasurementTarget(measured,rulerPose,1)?.names.join('')==='AB','Hidden construction edges are excluded');
      const theta=34.27*Math.PI/180,angleScene={...M.labEmpty(true),points:[[100,100],[300,100],[100+200*Math.cos(theta),100-200*Math.sin(theta)]],names:['A','B','C'],segments:[[0,1],[0,2]]};
      const anglePose={kind:'protractor',x:100,y:100,angle:0,reading:34.3,hand:1,size:170};
      const at=M.labMeasurementTarget(angleScene,anglePose,1);
      assert(at?.names.join('')==='BAC'&&M.labApplyMeasurement(angleScene,at),'Protractor matches actual vertex and named arms');
      const values=[];M.labNotation(angleScene,()=>{},(_,v)=>values.push(v));assert(values.join('')==='34.3°','Persistent angle uses exact geometry and display precision');
      assert(!M.labMeasurementTarget(angleScene,{...anglePose,reading:40},1),'Unaligned measuring arm cannot annotate');
      angleScene.segments=[[0,1]];angleScene.rays=[{i:0,angle:34.27,relativeTo:'C',relativeAngle:0,construction:false}];assert(M.labMeasurementTarget(angleScene,anglePose,1)?.names.join('')==='BAC','Referenced ray can serve as measured angle arm');
      angleScene.angleNotation[0].labelMode='custom';angleScene.angleNotation[0].label='x';M.labApplyMeasurement(angleScene,at);assert(angleScene.angleNotation.length===1&&angleScene.angleNotation[0].labelMode==='measured','Reapplying measurement edits existing annotation rather than duplicating');
      const square=M.utensilAlignment(exact,{kind:'square45',x:100,y:106,angle:92,size:200},'move',1);
      assert(square.kind==='Aligned vertex'&&square.angle===90,'Set square can align perpendicular leg to existing edge');

    }
    {
      const scene=M.labEmpty(true),o=[200,200],angle=37.42,baseline=23.17,end=a=>[o[0]+200*Math.cos(a*Math.PI/180),o[1]-200*Math.sin(a*Math.PI/180)];
      scene.points=[o,end(baseline),end(baseline+angle),end(baseline-angle)];scene.segments=[[0,1],[0,2],[0,3]];
      const t={kind:'protractor',x:o[0],y:o[1],angle:baseline,hand:1,snap:true};
      const exact=M.protractorReading(scene,t,38,1);
      assert(exact.kind==='Edge'&&Math.abs(exact.reading-angle)<1e-8&&exact.reading.toFixed(1)==='37.4','Protractor snaps to exact fractional angle relative to rotated baseline');
      const flipped=M.protractorReading(scene,{...t,hand:-1},36,1);assert(Math.abs(flipped.reading-angle)<1e-8,'Flipped protractor reads opposite half-plane accurately');
      const manual=M.protractorReading(scene,{...t,snap:false},37.46,1);assert(manual.reading===37.5&&!manual.kind,'Manual measurement resolves to a tenth of a degree');
      const away=M.protractorReading(scene,{...t,x:900,y:900},37.46,1);assert(away.reading===37.5&&!away.kind,'Remote geometry cannot snap measuring arm');
      scene.rays=[{i:0,angle:baseline+83.27,construction:false}];assert(Math.abs(M.protractorReading(scene,t,83,1).reading-83.27)<1e-8,'Exact ray direction is preserved for measurement');
    }
    // Every guided corner is a rigid orientation of the same physical triangle.
    for(const kind of ['square45','square30']){
      const sides=(corner,hand)=>{const o=[123,217],{v,w}=M.squareGeometry(o,37,kind,corner,hand);return [[o,v],[o,w],[v,w]].map(([a,b])=>Math.hypot(a[0]-b[0],a[1]-b[1])).sort((a,b)=>a-b)};
      const original=sides(0,1);for(const corner of [0,1,2])for(const hand of [-1,1])assert(sides(corner,hand).every((v,i)=>Math.abs(v-original[i])<1e-6),'Changing set square corner or mirroring preserves all three physical side lengths');
    }
    const verifyInstruments=label=>{
      const tap=p=>{previewPointer('pointerdown',p);previewPointer('pointerup',p)},tool=id=>doc.querySelector('[data-ag-tool="'+id+'"]'),reset=()=>doc.querySelector('[aria-label="Reset construction"]').click();
      const c=[200,200],edge=[320,200],other=[500,200];
      tool('compass').click();tap(c);previewPointer('pointermove',edge);
      assert(work.textContent.includes('r = 3.0 cm')&&!work.querySelector('[data-geometry-instrument="ruler"]'),'Compass preview uses exact radius without a ruler: '+label);
      tap(edge);tool('compass-opening').click();tap(other);
      const circles=cap().demo.labDrawing.circles;
      assert(circles.length===2&&circles.every(q=>Math.abs(q.r-120)<.001),'Compass preserves transferred 3 cm radius: '+label);
      const paper=P.createDocument();paper.addCurrent(id,cap());const printed=P.renderItem(paper.list()[0],false);
      assert([...printed.querySelectorAll('circle')].filter(q=>Math.abs(Number(q.getAttribute('r'))-120)<.001).length===2,'Both exact-radius circles survive publishing: '+label);
      reset();tool('protractor').click();
      const origin=[300,300],base=M.polar(...origin,160,30),aim=M.polar(...origin,180,67);
      tap(origin);tap(base);assert(work.querySelector('[data-geometry-instrument="protractor"]'),'Protractor aligns to a rotated baseline: '+label);assert(work.querySelector('[data-ag-local-instrument] [data-ag-guided-action="mirror"]'),'Guided instrument mirror control appears on canvas');
      tap(aim);const drawing=cap().demo.labDrawing,ray=drawing.rays[0];
      assert(drawing.rays.length===1&&Math.abs(ray.relativeAngle-37)<.001&&Math.abs(M.labRayAngle(drawing,ray)-67)<.001,'Rotated baseline yields exact 37 degree relative angle: '+label);
      assert(work.querySelector('[data-ag-angle-value]')?.textContent==='37°','Rendered angle annotation agrees with geometry: '+label);
      reset();assert(cap().demo.labDrawing.points.length===0,'Instrument verification leaves empty sheet: '+label);
    };
    checkRuler();verifyInstruments('A5 normal');
    {
      const tool=id=>doc.querySelector('[data-ag-tool="'+id+'"]'),tap=p=>{previewPointer('pointerdown',p);previewPointer('pointerup',p)},centre=[200,200];
      tool('compass').click();tool('compass-arc').click();tap(centre);tap([320,200]);previewPointer('pointermove',[200,80]);
      assert(work.querySelector('[data-ag-arc-preview]'),'Compass previews partial arc after choosing centre and radius');
      tap([200,80]);const d=cap().demo.labDrawing,c=d.circles[0];
      assert(M.isLabArc(c)&&Math.abs(c.r-120)<.001&&Math.abs(c.sweep-90)<.001&&work.querySelector('[data-ag-compass-arc]'),'Compass creates exact 3 cm quarter arc');
      const bounds=M.labContentBounds(d);assert(Math.abs(bounds[0]-200)<.001&&Math.abs(bounds[1]-80)<.001&&Math.abs(bounds[2]-320)<.001&&Math.abs(bounds[3]-200)<.001,'Fit bounds include only drawn arc and centre');
      const docDraft=P.createDocument();docDraft.addCurrent(id,cap());assert(P.renderItem(docDraft.list()[0],false).querySelector('[data-ag-compass-arc]'),'Partial arc survives vector publication');
      tool('compass-opening').click();tool('arc-direction').click();tap([500,200]);tap([550,200]);tap([500,320]);
      const transferred=cap().demo.labDrawing.circles[1];assert(M.isLabArc(transferred)&&Math.abs(transferred.r-120)<.001&&Math.abs(transferred.sweep+90)<.001,'Retained opening produces equal-radius clockwise arc');
      doc.querySelector('[aria-label="Reset construction"]').click();tool('compass-arc').click();
      const m=M.labEmpty(true);m.points=[[200,200],[320,200]];m.circles=[{i:0,r:120,start:0,sweep:120},{i:1,r:120,start:60,sweep:120}];
      const upper=[260,200-60*Math.sqrt(3)],lower=[260,200+60*Math.sqrt(3)];
      assert(M.labSnap(m,upper,.5).kind==='Intersection'&&M.labSnap(m,lower,.5).kind==='','Arc intersections snap only on visible sweeps');
      m.points.push([0,200],[450,200]);m.segments=[[2,3]];assert(M.labSnap(m,[80,200],.5).kind==='On line','Invisible continuation of arc is not a line intersection');
      assert(M.labSnap(m,[440,200],.5).kind==='On line','Other invisible arc continuation is not a line intersection');
    }
    doc.querySelector('[data-ag-tool="expand"]').click();wsField('format').value='A4';wsField('apply').click();await tick();
    checkRuler();verifyInstruments('A4 normal');
    {
      const frame=fixture.frame,max=frame.querySelector('[data-board-maximise]');
      api.select(fixture.record.id);max.click();await tick(150);
      assert(frame.classList.contains('is-geometry-board'),'Full board entered for instrument scale checks');
      checkRuler();verifyInstruments('A4 full board');
      const original=JSON.stringify(cap().demo.labDrawing),tool=id=>doc.querySelector('[data-ag-tool="'+id+'"]'),add=kind=>doc.querySelector('[data-ag-utensil-add="'+kind+'"]').click(),action=id=>doc.querySelector('[data-ag-utensil-action="'+id+'"]'),utensil=kind=>work.querySelector('[data-ag-utensil-kind="'+kind+'"]');
      tool('measuring-tools').click();for(const kind of ['ruler','protractor','square45','square30'])add(kind);
      assert(work.querySelectorAll('[data-ag-utensil]').length===4,'Four independent measuring utensils can coexist');
      // Exercise the host-independent gesture engine with a different world calibration.
      const I=G.instruments,t={kind:'ruler',x:10,y:20,angle:0,size:200,snap:true},spec={min:20,max:600};
      let d=I.beginGesture(t,[30,30],null,81);
      assert(!I.moveGesture(d,[31,30],1,{spec,step:2}),'Shared gesture ignores incidental movement');
      assert(I.moveGesture(d,[70,50],1,{spec,step:2,align:()=>({x:51,y:41,kind:'Point'})})&&t.x===50&&t.y===40,'Shared gesture translates without stretching');
      I.finishGesture(d,true);assert(t.x===51&&t.y===41&&t.size===200,'Shared gesture commits host-supplied magnetic candidate');
      d=I.beginGesture(t,[251,41],'rotate',82);I.moveGesture(d,[51,-159],1,{spec,step:2});assert(t.angle===90&&t.x===51&&t.y===41,'Shared rotation preserves origin');
      d=I.beginGesture(t,[51,-159],'resize',83);I.moveGesture(d,[51,-222],1,{spec,step:2});assert(t.size===264&&t.angle===90,'Shared resize respects host calibration without changing angle');
      d=I.beginGesture(t,[51,41],null,84);I.moveGesture(d,[61,41],1,{spec,step:2,align:()=>({x:99,kind:'Point'})});I.finishGesture(d,false);assert(t.x===61,'Cancelled gesture does not commit snap candidate');
      const ruler=utensil('ruler'),before=ruler.transform.baseVal.getItem(0).matrix,body=ruler.querySelector('rect'),worldToScreen=p=>new win.DOMPoint(...p).matrixTransform(work.getScreenCTM());
      const event=(target,type,p,id)=>{const q=worldToScreen(p);target.dispatchEvent(new win.PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',button:0,clientX:q.x,clientY:q.y}))};
      const start=[before.e+100,before.f+15];event(body,'pointerdown',start,70);event(work,'pointermove',[start[0]+60,start[1]-40],70);event(work,'pointerup',[start[0]+60,start[1]-40],70);
      const moved=utensil('ruler').transform.baseVal.getItem(0).matrix;
      assert(Math.abs(moved.e-before.e-60)<.01&&Math.abs(moved.f-before.f+40)<.01,'Independent ruler can be dragged without altering measurements');
      const handle=utensil('ruler').querySelector('[data-ag-utensil-handle="rotate"]'),origin=[moved.e,moved.f],arm=Number(handle.getAttribute('cx'));event(handle,'pointerdown',[origin[0]+arm,origin[1]],71);event(work,'pointermove',[origin[0],origin[1]-arm],71);event(work,'pointerup',[origin[0],origin[1]-arm],71);
      assert(Number(utensil('ruler').dataset.agUtensilAngle)===90,'Touch rotation handle rotates ruler by 90 degrees');
      const ticks=[...utensil('ruler').querySelectorAll('[data-me-division]')];assert(ticks.length===101&&Number(ticks[1].getAttribute('x1'))-Number(ticks[0].getAttribute('x1'))===4,'Ruler remains exactly ten centimetres with one millimetre divisions after rotation');
      const resize=utensil('ruler').querySelector('[data-ag-utensil-handle="resize"]');event(resize,'pointerdown',[origin[0],origin[1]-400],72);event(work,'pointermove',[origin[0],origin[1]-640],72);event(work,'pointerup',[origin[0],origin[1]-640],72);
      const extended=utensil('ruler'),extendedTicks=[...extended.querySelectorAll('[data-me-division]')];
      assert(Number(extended.dataset.agUtensilSize)===640&&extendedTicks.length===161&&Number(extendedTicks[1].getAttribute('x1'))===4&&Number(extendedTicks.at(-1).getAttribute('x1'))===640&&Number(extended.dataset.agUtensilAngle)===90,'Extending rotated ruler to 16 cm adds graduations without stretching or changing angle');
      for(const [kind,delta] of [['square45',120],['square30',80],['protractor',70]]){
        const old=utensil(kind),m=old.transform.baseVal.getItem(0).matrix,at=[m.e,m.f],startSize=Number(old.dataset.agUtensilSize);
        event(old.querySelector('[data-geometry-instrument]'),'pointerdown',at,73);event(work,'pointerup',at,73);
        const h=utensil(kind).querySelector('[data-ag-utensil-handle="resize"]'),p=kind==='protractor'?[at[0],at[1]-startSize]:[at[0]+startSize,at[1]],q=kind==='protractor'?[p[0],p[1]-delta]:[p[0]+delta,p[1]];
        event(h,'pointerdown',p,74);event(work,'pointermove',q,74);event(work,'pointerup',q,74);
        const next=utensil(kind);assert(Number(next.dataset.agUtensilSize)===startSize+delta,'Endpoint resize adjusts '+kind+' size');
        if(kind.startsWith('square')){const tt=[...next.querySelectorAll('[data-me-square-edge="0"]')];assert(Math.abs(Number(tt[1].getAttribute('x1'))-Number(tt[0].getAttribute('x1'))-4)<1e-6,'Resized set square retains exact millimetre spacing')}
        else{assert(next.querySelectorAll('[data-geometry-instrument="protractor"] line').length===182,'Resized protractor retains every degree and baseline');const handle=next.querySelector('[data-ag-utensil-handle="measure"]'),rad=Number(next.dataset.agUtensilSize)*.68,atAngle=a=>[at[0]+rad*Math.cos(a*Math.PI/180),at[1]-rad*Math.sin(a*Math.PI/180)];event(handle,'pointerdown',atAngle(45),77);event(work,'pointermove',atAngle(72.34),77);event(work,'pointerup',atAngle(72.34),77);assert(utensil(kind).querySelector('[data-ag-protractor-reading]').textContent==='72.3°','Touch measuring arm shows tenth-degree angle');action('flip').click();assert(utensil(kind).querySelector('[data-instrument-direction]').getAttribute('data-instrument-direction')==='-1','Local flip reverses measuring side without moving centre');action('flip').click()}
      }
      // Reselect the ruler to verify selected-only removal below.
      const rr=utensil('ruler');event(rr.querySelector('rect'), 'pointerdown',[origin[0]+10,origin[1]-100],75);event(work,'pointerup',[origin[0]+10,origin[1]-100],75);
      assert(JSON.stringify(cap().demo.labDrawing)===original,'Measuring utensils never mutate drawing state');
      const publication=P.createDocument();publication.addCurrent(id,cap());assert(!P.renderItem(publication.list()[0],false).querySelector('[data-ag-utensil]'),'Temporary utensils are excluded from publication');
      const local=work.querySelector('[data-ag-local-instrument]');
      const localButton=local.querySelector('button'),hit=localButton.getBoundingClientRect();
      assert(hit.width>=44&&hit.height>=44,'Local instrument controls have whiteboard-sized touch targets');
      const snap=action('snap');assert(local.contains(snap)&&snap.getAttribute('aria-pressed')==='true','Magnetic alignment is available at the selected utensil');
      snap.click();assert(action('snap').getAttribute('aria-pressed')==='false','Local snap can be disabled without entering settings');action('snap').click();
      assert(work.querySelector('[data-ag-local-instrument]')?.contains(action('remove'))&&work.querySelector('[data-ag-local-instrument]')?.contains(action('rotate'))&&!doc.querySelector('.gd-ag-utensils [data-ag-utensil-action="remove"]'),'Selected utensil actions are attached locally rather than in drawing options');
      assert(action('duplicate').querySelector('svg rect'),'Duplicate uses overlapping rectangle artwork rather than point crosshair');
      action('duplicate').click();assert(work.querySelectorAll('[data-ag-utensil-kind="ruler"]').length===2,'Local duplicate copies the selected calibrated instrument');
      action('remove').click();assert(work.querySelectorAll('[data-ag-utensil-kind="ruler"]').length===1,'Local removal affects only the duplicate');
      const remaining=utensil('ruler');event(remaining.querySelector('rect'),'pointerdown',[origin[0]+10,origin[1]-100],76);event(work,'pointerup',[origin[0]+10,origin[1]-100],76);
      action('remove').click();assert(!utensil('ruler')&&work.querySelectorAll('[data-ag-utensil]').length===3,'Remove affects only the selected measuring utensil');
      action('visibility').click();assert(!work.querySelector('[data-ag-utensil]'),'Hide removes all utensil graphics without deleting them');
      action('visibility').click();assert(work.querySelectorAll('[data-ag-utensil]').length===3,'Show restores independently placed utensils');
      action('visibility').click();tool('measuring-tools').click();max.click();await tick(150);
      assert(work.viewBox.baseVal.width===1188&&work.viewBox.baseVal.height===840,'Instrument review restores selected paper');
    }
    doc.querySelector('[data-ag-tool="point"]').click();
    const tapWork=(p)=>{const v=new win.DOMPoint(...p).matrixTransform(work.getScreenCTM());work.dispatchEvent(new win.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',button:0,clientX:v.x,clientY:v.y}))};
    for(const p of [[150,150],[450,150],[300,350]])tapWork(p);
    assert(doc.querySelector('[data-ag-tool="move"]').hidden&&doc.querySelector('[data-ag-option="measure"]').checked,'Free construction defaults to fixed marks with measurements enabled');
    const beforeInk=JSON.stringify(cap().demo.labDrawing.points);
    doc.querySelector('[data-ag-tool="expand"]').click();wsField('format').value='custom';wsField('format').dispatchEvent(new win.Event('change',{bubbles:true}));
    const enterDimension=(id,digits)=>{
      const input=wsField(id);input.click();const pad=doc.querySelector('.gd-touch-keypad');
      assert(pad&&input.dataset.gdKeypad==='dimension'&&input.getAttribute('inputmode')==='none','Workspace dimensions use the shared touch keypad');
      assert(!pad.querySelector('[data-gd-touch-check]'),'Settings keypad does not show pupil challenge Check');
      pad.querySelector('[data-gd-touch-key="Clear"]').click();
      for(const digit of digits)pad.querySelector('[data-gd-touch-key="'+digit+'"]').click();
      assert(input.value===digits,'Touch keypad enters exact custom dimension');
      pad.querySelectorAll('[data-gd-touch-close]')[1].click();assert(!doc.querySelector('.gd-touch-keypad'),'Done closes keypad without submitting the challenge or paper settings');
    };
    enterDimension('width','50.5');enterDimension('height','50');wsField('apply').click();await tick();
    assert(work.viewBox.baseVal.width===1188&&JSON.stringify(cap().demo.labDrawing.points)===beforeInk,'Smaller sheet cannot clip existing drawing');
    wsField('format').value='A4';wsField('grid').value='0';wsField('apply').click();await tick();assert(!work.querySelector('[data-ag-grid]'),'Plain paper removes the grid');
    assert(wsField('format').closest('.gd-ag-sheet-settings').hidden,'Successful paper settings close automatically');

    for(const [type,p] of [['pointerdown',[150,150]],['pointermove',[220,210]],['pointerup',[220,210]]]){const v=new win.DOMPoint(...p).matrixTransform(work.getScreenCTM());work.dispatchEvent(new win.PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',pointerId:31,button:0,buttons:type==='pointerup'?0:1,clientX:v.x,clientY:v.y}))}
    assert(JSON.stringify(cap().demo.labDrawing.points)===beforeInk,'Dragging a drawn point does not move ink or create a new point');
    doc.querySelector('[data-ag-tool="shade"]').click();
    doc.querySelector('[data-ag-shade-mode]').click();
    for(const p of [[150,150],[450,150],[300,350]])tapWork(p);
    [...doc.querySelectorAll('.gd-ag-lab-toolbar button')].find(b=>b.textContent==='Shade selected').click();
    assert(work.querySelectorAll('[data-ag-region]').length===1&&cap().demo.labDrawing.regions.length===1,'Free construction stores a selected polygonal region');
    doc.querySelector('[data-ag-tool="undo"]').click();
    assert(!work.querySelector('[data-ag-region]'),'Undo removes the region without deleting its vertices');
    doc.querySelector('[data-ag-tool="segment"]').click();
    const lineTap=p=>{const v=new win.DOMPoint(...p).matrixTransform(work.getScreenCTM());for(const type of ['pointerdown','pointerup'])work.dispatchEvent(new win.PointerEvent(type,{bubbles:true,cancelable:true,pointerId:21,pointerType:'touch',button:0,clientX:v.x,clientY:v.y}))};
    lineTap([150,150]);lineTap([300,350]);
    assert(work.querySelector('[data-ag-dimension]'),'Free construction defaults to measurement annotations');
    doc.querySelector('[data-ag-option="measure"]').click();await tick();assert(!work.querySelector('[data-ag-dimension]'),'Measurements can be switched off');doc.querySelector('[data-ag-option="measure"]').click();await tick();
    const dim=work.querySelector('[data-ag-dimension]');assert(dim&&Math.abs(+dim.getAttribute('transform').slice(7).split(' ')[0]-Math.atan2(200,150)*180/Math.PI)<.1,'Length label rotates parallel to its sloping segment');
    doc.querySelector('[data-ag-tool="select"]').click();tapWork([225,250]);const selectedDrawing=cap().demo.labDrawing,selectedEdge=selectedDrawing.segments.find(e=>{const a=selectedDrawing.points[e[0]],b=selectedDrawing.points[e[1]];return Math.hypot((a[0]+b[0])/2-225,(a[1]+b[1])/2-250)<.01});assert(selectedEdge,'Diagonal selection fixture exists');const [a,b]=selectedEdge.map(i=>selectedDrawing.points[i]),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
    for(const i of selectedEdge){const cue=work.querySelector('[data-ag-point-centre="'+selectedDrawing.names[i]+'"]');assert(cue&&cue.dataset.agCentreDirection!=='neutral','Selected diagonal endpoints use directional marks');const m=cue.transform.baseVal.getItem(1).matrix;assert(Math.abs((m.c*dx+m.d*dy)/len)<1e-5,'Long centre mark is perpendicular to diagonal segment');const p=cue.querySelector('path').getBBox();assert(p.height>p.width,'Perpendicular stroke is longer than longitudinal stroke')}
    const mark=doc.querySelector('[data-ag-notation]');mark.value='equal2';mark.dispatchEvent(new win.Event('change',{bubbles:true}));await tick();assert(work.querySelectorAll('[data-ag-notation="equal2"]').length===2,'Double equality ticks render on selected segment');const markDraft=P.createDocument();markDraft.addCurrent(id,cap());assert(P.renderItem(markDraft.list()[0],false).querySelectorAll('[data-ag-notation="equal2"]').length===2,'Manual marks survive publishing');
    {const regionModel=win.TT99Goodies.angles,curves={given:false,points:[[250,250],[350,250]],names:['A','B'],segments:[],rays:[],circles:[{i:0,r:100},{i:1,r:100}],regions:[]};const lens=regionModel.labFaceAt(curves,[300,250]);assert(lens&&lens.path.includes('A ')&&regionModel.labFaces(curves).length===3,'Two overlapping circles form three bounded curved faces');assert(!regionModel.labFaceAt(curves,[50,50]),'Exterior remains unshaded');curves.regions.push({seed:[300,250],faceKey:lens.key,colour:0});assert(regionModel.labRegionShapes(curves)[0]?.path.includes('A '),'Curved region retains vector arcs');}
    {
      // Explicit labels replace automatic numerical dimensions in live and printed geometry.
      const capture=()=>cap().demo.labDrawing, mode=()=>doc.querySelector('[data-ag-dimension-mode]'),change=(el,v)=>{el.value=v;el.dispatchEvent(new win.Event('change',{bubbles:true}))};
      const before=JSON.stringify(capture().points),key=win.TT99Goodies.angles.labStyleKey(capture(),0,2);
      change(mode(),'custom');doc.querySelector('[data-ag-dimension-text]').value='x';doc.querySelector('[data-ag-dimension-apply]').click();
      assert(capture().dimensionLabels[key].text==='x'&&work.querySelector('[data-ag-dimension]').textContent==='x','Custom dimension replaces measured value');
      doc.querySelector('[data-ag-option="measure"]').click();assert(work.querySelector('[data-ag-dimension]').textContent==='x','Explicit unknown remains with automatic measurements disabled');
      const draft=P.createDocument();draft.addCurrent(id,cap());assert(P.renderItem(draft.list()[0],false).querySelector('[data-ag-dimension]').textContent==='x','Unknown dimension is preserved in vector publication');
      change(mode(),'measured');assert(work.querySelector('[data-ag-dimension]').textContent==='6.3 cm','Pinned measured length stays visible independently of automatic measurements');
      change(mode(),'hidden');assert(!work.querySelector('[data-ag-dimension]'),'Hide dimension suppresses the automatic value');
      change(mode(),'auto');doc.querySelector('[data-ag-option="measure"]').click();
      assert(JSON.stringify(capture().points)===before,'Editing dimensions never changes geometry');
      // Select a vertex, choose the mark and label, then choose two arms.
      tapWork([150,150]);const labelMode=doc.querySelector('[data-ag-angle-label-mode]');change(labelMode,'custom');doc.querySelector('[data-ag-angle-label-text]').value='?';
      change(doc.querySelector('[data-ag-angle-notation]'),'angle1');tapWork([450,150]);tapWork([300,350]);
      assert(work.querySelector('[data-ag-annotation-value]')?.textContent==='?','Vertex-first angle annotation adds custom label');
      const annotated=P.createDocument();annotated.addCurrent(id,cap());assert(P.renderItem(annotated.list()[0],false).querySelector('[data-ag-annotation-value]')?.textContent==='?','Angle annotation survives vector publication');
      doc.querySelector('[data-ag-tool="undo"]').click();assert(!work.querySelector('[data-ag-annotation-value]'),'Undo removes angle annotation without altering geometry');
    }
    // Point display names and positions are independent of stable geometry IDs.
    {
      const M=win.TT99Goodies.angles,model=()=>cap().demo.labDrawing,original=model(),name=original.names[0],label=()=>work.querySelector('[data-ag-point-label="'+name+'"]');
      tapWork(original.points[0]);doc.querySelector('[data-ag-point-label-edit]').click();
      doc.querySelector('[data-ag-point-label-text]').value='P₁';doc.querySelector('[data-ag-point-label-action="apply"]').click();
      assert(label().textContent==='P₁'&&M.labPointText(model(),0)==='P₁','Edited name renders on board');
      assert(JSON.stringify(model().names)===JSON.stringify(original.names)&&JSON.stringify(model().points)===JSON.stringify(original.points),'Renaming never changes point identity or coordinates');
      doc.querySelector('[data-ag-point-label-action="position"]').click();const p=[original.points[0][0]+35,original.points[0][1]-40];tapWork(p);
      assert(Math.hypot(Number(label().getAttribute('x'))-p[0],Number(label().getAttribute('y'))-p[1])<.01,'Point label can be positioned separately from point');
      const moved=JSON.parse(JSON.stringify(model()));moved.points[0]=[original.points[0][0]+20,original.points[0][1]+15];const follow=M.labLabel(moved,0);assert(Math.hypot(follow[0]-p[0]-20,follow[1]-p[1]-15)<.01,'Label offset follows its point when moved');
      const draft=P.createDocument();draft.addCurrent(id,cap());const printed=P.renderItem(draft.list()[0],false).querySelector('[data-ag-point-label="'+name+'"]');assert(printed.textContent==='P₁'&&Math.abs(Number(printed.getAttribute('x'))-p[0])<.01,'Custom point label and position survive vector publication');
      doc.querySelector('[data-ag-tool="undo"]').click();assert(label().textContent==='P₁'&&!model().pointLabels[name].offset,'Undo restores automatic positioning without losing edited name');
      doc.querySelector('[data-ag-tool="undo"]').click();assert(label().textContent===name,'Second undo restores original label');
    }
    // A ray through two named vertices must not round the exact direction.
    {
      const model=win.TT99Goodies.angles,check=(p,q,end)=>{const dx=q[0]-p[0],dy=q[1]-p[1];return Math.abs(dx*(end[1]-p[1])-dy*(end[0]-p[0]))/Math.hypot(dx,dy)<1e-6};
      doc.querySelector('[data-ag-tool="ray"]').click();lineTap([150,150]);lineTap([300,350]);
      const drawing=cap().demo.labDrawing,r=drawing.rays.at(-1),p=drawing.points[0],q=drawing.points[2],angle=model.labRayAngle(drawing,r);
      assert(r.relativeTo===drawing.names[2]&&r.relativeAngle===0&&Math.abs(angle-Math.round(angle))>.01,'Ray snapped to named vertex retains fractional direction and reference');
      for(const bounds of [[0,0,1188,840],[-2000,-1000,10000,8000]])assert(check(p,q,model.rayEnd(p,angle,bounds)),'Ray remains collinear over arbitrary board extents');
      const rayPaper=P.createDocument();rayPaper.addCurrent(id,cap());const graphic=P.renderItem(rayPaper.list()[0],false);
      const lines=[...graphic.querySelectorAll('line')],n=(el,k)=>Number(el.getAttribute(k));
      assert(lines.some(el=>Math.hypot(n(el,'x1')-p[0],n(el,'y1')-p[1])<.001&&Math.hypot(n(el,'x2')-p[0],n(el,'y2')-p[1])>Math.hypot(q[0]-p[0],q[1]-p[1])&&check(p,q,[n(el,'x2'),n(el,'y2')])),'Printed ray extends exactly through named vertex');
      const moved=JSON.parse(JSON.stringify(drawing));moved.points[2]=[321,367];assert(check(p,moved.points[2],model.rayEnd(p,model.labRayAngle(moved,moved.rays.at(-1)),[0,0,1188,840])),'Ray follows its referenced point when moved');
      const freeRay=model.labDirectRay(drawing,0,{p:[311,357],kind:''},false);assert(!freeRay.relativeTo&&check(p,[311,357],model.rayEnd(p,freeRay.angle,[0,0,1188,840])),'Free ray direction is exact without adding a reference');
      doc.querySelector('[data-ag-tool="undo"]').click();doc.querySelector('[data-ag-tool="undo"]').click();
      assert(cap().demo.labDrawing.rays.length===0,'Undo restores original geometry after ray regression');
    }
    // A constructed angle must have permanent marks, even with measurements disabled.
    doc.querySelector('[data-ag-option="measure"]').click();
    doc.querySelector('[data-ag-tool="protractor"]').click();
    lineTap([450,150]);lineTap([650,150]);lineTap([590,10]);
    const angleDrawing=cap().demo.labDrawing;
    assert(angleDrawing.segments.some(e=>e.includes(1)&&e.includes(3)),'Protractor creates the missing baseline');
    assert(work.querySelector('[data-ag-angle-mark]')&&work.querySelector('[data-ag-angle-value]')?.textContent==='45°','Protractor retains 45 degree notation with measurements disabled');
    const vertex=work.querySelector('[data-ag-point-label="B"]');
    assert(vertex&&(+vertex.getAttribute('x')<450||+vertex.getAttribute('y')>150),'Vertex B label is outside the marked sector');
    const anglePaper=P.createDocument();anglePaper.addCurrent(id,cap());assert(P.renderItem(anglePaper.list()[0],false).querySelector('[data-ag-angle-mark]'),'Publishing retains construction angle notation');
    doc.querySelector('[data-ag-option="measure"]').click();
    const paperDimensions=P.createDocument();paperDimensions.addCurrent(id,cap());assert(P.renderItem(paperDimensions.list()[0],false).querySelector('[data-ag-dimension]'),'Published free construction retains its offset length labels');
    const sheetPaper=P.renderItem(paperDimensions.list()[0],false);assert(sheetPaper.getAttribute('data-ag-workspace-mm')==='297 210'&&!sheetPaper.querySelector('[data-ag-grid]'),'Publishing retains A4 landscape dimensions and plain paper');


    {
      const initial=JSON.stringify(cap().demo.labDrawing.points),frame=fixture.frame,hostBoard=document.getElementById('gd-mixed-board'),hostViewport=document.getElementById('gd-board-viewport'),restore=frame.querySelector('[data-board-maximise]');
      api.select(fixture.record.id);restore.click();await tick(150);
      assert(frame.classList.contains('is-geometry-board')&&hostBoard.classList.contains('is-geometry-drawing'),'Free geometry maximises into a dedicated board');
      const rect=work.getBoundingClientRect(),vr=hostViewport.getBoundingClientRect(),matrix=work.getScreenCTM();
      assert(Math.abs(rect.width-vr.width)<3&&Math.abs(rect.height-vr.height)<3,'Drawing surface fills the entire whiteboard viewport');
      assert(Math.abs(matrix.a-matrix.d)<.001,'Full-screen geometry preserves equal horizontal and vertical scale');
      assert(JSON.stringify(cap().demo.labDrawing.points)===initial,'Entering full board does not move drawing points');
      const palettes=[...doc.querySelectorAll('[data-ag-full-panel]')];assert(palettes.length===3,'Instruments, options and help are separate floating panels');
      const instrument=palettes[0],fold=instrument.querySelector('.gd-ag-full-panel-head button'),content=instrument.querySelector('.gd-ag-full-panel-content');fold.click();assert(content.hidden,'Floating panel collapses');fold.click();assert(!content.hidden,'Floating panel expands');
      const head=instrument.querySelector('.gd-ag-full-panel-head'),start=head.getBoundingClientRect(),oldLeft=instrument.getBoundingClientRect().left;
      for(const [type,x,y] of [['pointerdown',start.left+10,start.top+8],['pointermove',start.left+70,start.top+20],['pointerup',start.left+70,start.top+20]])head.dispatchEvent(new win.PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',pointerId:44,button:0,clientX:x,clientY:y}));
      assert(instrument.getBoundingClientRect().left>oldLeft+20,'Floating instrument panel can be moved by touch');
      doc.querySelector('[data-ag-tool="point"]').click();const dock=doc.querySelector('[data-ag-full-panels]');dock.click();assert(palettes.every(p=>p.hidden),'Hide panels clears the drawing area');
      const navigation=doc.querySelector('[data-ag-board-navigation]'),navigationRect=navigation.getBoundingClientRect();
      assert(navigation.parentElement.classList.contains('gd-ag-full-tools')&&navigationRect.width>0&&navigationRect.height>0&&navigation.querySelectorAll('button').length===4,'Independent navigation remains visible when construction palettes are hidden');
      const edge=[work.viewBox.baseVal.width-25,work.viewBox.baseVal.height-25];tapWork(edge);
      const drawn=cap().demo.labDrawing;assert(drawn.points.length===JSON.parse(initial).length+1&&Math.hypot(drawn.points.at(-1)[0]-edge[0],drawn.points.at(-1)[1]-edge[1])<2,'Draw near the far edge of the maximised board');
      assert(M.workspaceFits(drawn,drawn.workspace.w,drawn.workspace.h),'Expanded drawing extent is retained in saved model');
      dock.click();
      const applyGrid=value=>{doc.querySelector('[data-ag-tool="expand"]').click();const grid=doc.querySelector('[data-ag-workspace="grid"]');grid.value=value;grid.dispatchEvent(new win.Event('change',{bubbles:true}));doc.querySelector('[data-ag-workspace="apply"]').click()};
      const edgePoints=JSON.stringify(drawn.points),edgeBounds=work.getAttribute('viewBox');
      applyGrid('5');const gridded=cap().demo.labDrawing;
      assert(gridded.workspace.gridMm===5&&JSON.stringify(gridded.points)===edgePoints&&work.getAttribute('viewBox')===edgeBounds&&M.workspaceFits(gridded,gridded.workspace.w,gridded.workspace.h),'Grid-only change preserves expanded board and edge drawing');
      assert(work.querySelector('#ag-full-grid')?.getAttribute('width')==='20','5 mm grid uses exact 20-unit spacing in full board');
      const frozenBoard=P.createDocument();frozenBoard.addCurrent(id,cap());const frozenItem=frozenBoard.list()[0],frozenData=JSON.stringify(frozenItem.data),frozenSvg=P.renderItem(frozenItem,false),frozenView=frozenSvg.viewBox.baseVal;
      assert(frozenItem.kind==='diagram'&&frozenView.width===gridded.workspace.w&&frozenView.height===gridded.workspace.h&&frozenSvg.getAttribute('data-ag-workspace-mm')===gridded.workspace.w/4+' '+gridded.workspace.h/4,'Publication uses actual expanded paper dimensions');
      assert(frozenSvg.querySelectorAll('[data-ag-point-label]').length===gridded.points.length,'All construction point labels survive full-board capture');
      const gridLines=[...frozenSvg.querySelectorAll('[data-ag-grid]')].filter(n=>n.getAttribute('x1')===n.getAttribute('x2'));
      assert(gridLines.length>2&&Number(gridLines[1].getAttribute('x1'))-Number(gridLines[0].getAttribute('x1'))===20,'Published expanded paper retains exact 5 mm grid');
      applyGrid('0');assert(!work.querySelector('[data-ag-grid]')&&cap().demo.labDrawing.workspace.gridMm===0,'Plain grid setting applies without cropping expanded board');
      doc.querySelector('[data-ag-tool="undo"]').click();restore.click();await tick(150);
      assert(!frame.classList.contains('is-geometry-board')&&!hostBoard.classList.contains('is-geometry-drawing'),'Restore leaves dedicated drawing mode');
      assert(work.viewBox.baseVal.width===1188&&work.viewBox.baseVal.height===840&&JSON.stringify(cap().demo.labDrawing.points)===initial,'Restore retains original A4 format and unchanged drawing after undo');
      assert(!doc.querySelector('[data-ag-full-panel]')&&!doc.querySelector('[data-ag-board-navigation]')&&doc.querySelector('[data-ag-tool="point"]')&&doc.querySelectorAll('[data-ag-tool="pan"]').length===1,'Normal toolbar restored without duplicated controls');
      assert(JSON.stringify(frozenBoard.list()[0].data)===frozenData&&P.renderItem(frozenBoard.list()[0],false).querySelectorAll('[data-ag-point-label]').length===gridded.points.length,'Published full-board snapshot remains frozen after grid change, undo and restore');
      assert(P.answerSummary(frozenItem)===null&&P.pages([frozenItem],{teacher:true}).every(page=>page.getAttribute('data-worksheet-answer')!=='annex'),'Free construction does not create a spurious answer annex');
      const question=P.record(id,'challenge',M.generate({type:'build-square',enrichment:true})),mixed=P.pages([frozenItem,question],{teacher:true}),annex=mixed.filter(page=>page.getAttribute('data-worksheet-answer')==='annex'),numbers=annex.flatMap(page=>[...page.querySelectorAll('[data-pub-answer-number]')].map(n=>n.getAttribute('data-pub-answer-number')));
      assert(numbers.join(',')==='2'&&annex.some(page=>page.querySelector('[data-pub-answer-graphic="2"]')),'Mixed free construction and challenge retain correct answer numbering');
    }
    {
      const frame=fixture.frame,restore=frame.querySelector('[data-board-maximise]'),before=JSON.stringify(cap().demo.labDrawing);
      api.select(fixture.record.id);restore.click();await tick(150);
      const button=id=>doc.querySelector('[data-ag-tool="'+id+'"]'),view=()=>{const v=work.viewBox.baseVal;return [v.x,v.y,v.width,v.height]};
      const beforeView=view(),beforeScale=Math.hypot(work.getScreenCTM().a,work.getScreenCTM().b);
      button('zoom-out').click();assert(view()[2]>beforeView[2]&&Math.hypot(work.getScreenCTM().a,work.getScreenCTM().b)<beforeScale,'Zoom out changes the camera scale only');
      button('zoom-in').click();assert(Math.abs(view()[2]-beforeView[2])<.01,'Zoom in reverses zoom out');
      button('select').click();const rect=work.getBoundingClientRect(),startX=rect.left+20,startY=rect.top+20;
      for(const [type,x,y] of [['pointerdown',startX,startY],['pointermove',startX+rect.width*.7,startY+rect.height*.7],['pointerup',startX+rect.width*.7,startY+rect.height*.7]])work.dispatchEvent(new win.PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',pointerId:56,button:0,clientX:x,clientY:y}));
      assert(view()[0]<0&&view()[1]<0&&JSON.stringify(cap().demo.labDrawing)===before,'Dragging empty space in Select pans into negative coordinates without changing drawing or paper');
      const [x,y,w,h]=view(),centre=[x+w*.2,y+h*.2],r=Math.min(100,w*.12,h*.12),point=[centre[0]+r,centre[1]];
      button('compass').click();const normal=doc.querySelector('[data-ag-style="false"]'),construction=doc.querySelector('[data-ag-style="true"]');
      assert(!normal.closest('.gd-ag-lab-helpers').hidden,'New circle style is accessible before drawing');normal.click();
      const tap=p=>{previewPointer('pointerdown',p);previewPointer('pointerup',p)};tap(centre);
      const pendingCentre=JSON.stringify(cap().demo.labDrawing),pan=button('pan');
      pan.click();assert(pan.getAttribute('aria-pressed')==='true','Pan temporarily suspends active compass');
      const rr=work.getBoundingClientRect(),px=rr.left+rr.width*.5,py=rr.top+rr.height*.5;
      for(const [type,x,y] of [['pointerdown',px,py],['pointermove',px+20,py+12],['pointerup',px+20,py+12]])work.dispatchEvent(new win.PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',pointerId:61,button:0,clientX:x,clientY:y}));
      button('zoom-out').click();pan.click();
      assert(JSON.stringify(cap().demo.labDrawing)===pendingCentre&&button('compass').getAttribute('aria-pressed')==='true','Pan and zoom preserve pending compass centre and resume instrument');
      tap(point);
      const drawing=cap().demo.labDrawing,circle=drawing.circles.at(-1),actual=drawing.points[circle.i];
      assert(circle.construction===false&&Math.abs(circle.r-r)<2&&actual[0]<0&&actual[1]<0,'Normal circle can be drawn outside the original sheet');
      button('fit').click();const v=view(),bounds=M.labContentBounds(drawing);
      assert(v[0]<bounds[0]&&v[1]<bounds[1]&&v[0]+v[2]>bounds[2]&&v[1]+v[3]>bounds[3],'Fit includes the entire circle and all finite geometry');
      assert(JSON.stringify(cap().demo.labDrawing)===JSON.stringify(drawing),'Fit changes no drawing coordinates or styles');
      const rayModel=JSON.parse(JSON.stringify(drawing));rayModel.rays.push({i:circle.i,angle:45});assert(JSON.stringify(M.labContentBounds(rayModel))===JSON.stringify(bounds),'Infinite ray length has no influence on finite fit bounds');
      button('select').click();tapWork([actual[0]-circle.r,actual[1]]);construction.click();
      assert(cap().demo.labDrawing.circles.at(-1).construction===true,'Existing normal circle can become a construction circle');
      const centreCue=work.querySelector('[data-ag-point-centre="'+drawing.names[circle.i]+'"]');
      assert(centreCue&&centreCue.getAttribute('pointer-events')==='none','Selecting circle marks its exact centre without intercepting gestures');
      const checkCentre=()=>{const cue=work.querySelector('[data-ag-point-centre="'+drawing.names[circle.i]+'"]'),m=cue.transform.baseVal.getItem(0).matrix;assert(Math.hypot(m.e-actual[0],m.f-actual[1])<1e-3,'Centre crosshair coincides with stored geometry');const p=cue.querySelector('path'),span=p.getBBox().height*Math.hypot(work.getScreenCTM().a,work.getScreenCTM().b);assert(Math.abs(span-8)<.1,'Centre crosshair remains eight screen pixels wide')};
      checkCentre();button('zoom-in').click();checkCentre();button('zoom-out').click();checkCentre();
      const menu=doc.querySelector('[data-ag-selection-menu]');
      assert(menu.contains(normal)&&menu.contains(construction)&&getComputedStyle(menu).display!=='none','Selected circle style controls are local to the drawing');
      const red=menu.querySelector('[data-ag-ink="red"]');red.click();
      assert(cap().demo.labDrawing.circles.at(-1).colour==='red'&&cap().demo.labDrawing.circles.at(-1).construction===true,'Colour and construction style are independent');
      assert(work.querySelector('circle[stroke="#b42332"][stroke-dasharray="5 4"]'),'Selected construction circle retains red dashed stroke');
      normal.click();assert(cap().demo.labDrawing.circles.at(-1).construction===false&&cap().demo.labDrawing.circles.at(-1).colour==='red','Normal style preserves selected colour');
      const inkDoc=P.createDocument();inkDoc.addCurrent(id,cap());
      assert(P.renderItem(inkDoc.list()[0],false).querySelector('circle[stroke="#b42332"]'),'Published circle preserves teaching colour');
      menu.querySelector('[data-ag-ink="default"]').click();assert(!cap().demo.labDrawing.circles.at(-1).colour,'Default restores legacy ink');
      button('undo').click();assert(cap().demo.labDrawing.circles.at(-1).colour==='red','Undo restores colour');
      button('undo').click();button('undo').click();button('undo').click();
      assert(JSON.stringify(cap().demo.labDrawing.circles.at(-1))===JSON.stringify(circle),'Undo all four style and colour edits restores the original circle');
      const signed=P.createDocument();signed.addCurrent(id,cap());const printed=P.renderItem(signed.list()[0],false),pv=printed.viewBox.baseVal;
      assert(pv.x<=actual[0]-circle.r&&pv.y<=actual[1]-circle.r&&pv.x+pv.width>=actual[0]+circle.r&&pv.y+pv.height>=actual[1]+circle.r,'Published expanded board includes negative circle extent');
      for(let i=0;i<2;i++)button('undo').click(); // Undo the circle and its centre only; style edits were already undone.
      restore.click();await tick(150);
      assert(JSON.stringify(cap().demo.labDrawing.points)===JSON.stringify(JSON.parse(before).points),'Undo and restore return to original geometry after camera navigation');
    }
    const modePicker=doc.getElementById('ag-mode');
    assert(modePicker.querySelectorAll('optgroup').length===2&&modePicker.querySelector('optgroup[label="Geometry workspaces"]').children.length===2,'Geometry workspaces are unified construction and constrained loci');
    const setGeometryMode=value=>{const el=doc.getElementById('ag-mode');el.value=value;el.dispatchEvent(new win.Event('change',{bubbles:true}))};
    const movement=doc.querySelector('[data-ag-option="movement"]'),beforeMove=JSON.stringify(cap().demo.labDrawing.points);
    assert(movement&&!movement.checked&&doc.querySelector('[data-ag-tool="move"]').hidden,'Fixed drawing starts with movement disabled');
    movement.click();await tick();
    const motion=doc.querySelector('.gd-ag-lab-canvas');
    assert(!doc.querySelector('[data-ag-tool="move"]').hidden&&!doc.querySelector('[data-ag-tool="trace"]').hidden&&JSON.stringify(cap().demo.labDrawing.points)===beforeMove,'Enabling movement preserves drawing and enables tracing');
    const motionPointer=(type,p)=>{const v=new win.DOMPoint(...p).matrixTransform(motion.getScreenCTM());motion.dispatchEvent(new win.PointerEvent(type,{bubbles:true,cancelable:true,pointerId:32,pointerType:'touch',button:0,buttons:type==='pointerup'?0:1,clientX:v.x,clientY:v.y}))};
    assert(doc.querySelector('[data-ag-tool="select"]').getAttribute('aria-pressed')==='true','Direct manipulation is the default after enabling movement');
    motionPointer('pointerdown',[450,150]);motionPointer('pointerup',[450,150]);const selectedTrace=doc.querySelector('[data-ag-tool="selected-trace"]');assert(!selectedTrace.hidden,'Tapping point exposes contextual trace action');selectedTrace.click();
    assert(JSON.stringify(cap().demo.labDrawing.points)===beforeMove,'Selecting and enabling trace does not move a point');motionPointer('pointerdown',[450,150]);motionPointer('pointermove',[420,230]);motionPointer('pointermove',[400,300]);motionPointer('pointerup',[400,300]);
    const moved=cap().demo.labDrawing;const cue=motion.querySelector('[data-ag-point-centre="'+moved.names[1]+'"]');assert(cue&&Math.hypot(cue.transform.baseVal.getItem(0).matrix.e-moved.points[1][0],cue.transform.baseVal.getItem(0).matrix.f-moved.points[1][1])<1e-3,'Centre cue follows moved point exactly');assert(Math.hypot(moved.points[1][0]-400,moved.points[1][1]-300)<.1&&moved.segments.length===angleDrawing.segments.length,'Free drag changes existing connected geometry');
    assert(motion.querySelector('[data-ag-trace]'),'Free movement leaves selected point trace');
    const motionDraft=P.createDocument();motionDraft.addCurrent(id,cap());const motionItem=motionDraft.list()[0],traceSvg=P.renderItem(motionItem,false);
    assert(traceSvg.querySelector('[data-ag-trace]'),'Free trace survives publication');
    assert(!traceSvg.querySelector('[data-ag-point-centre]'),'Temporary centre cues do not pollute printed drawings');
    assert([...traceSvg.querySelectorAll('[data-ag-trace]')].map(n=>n.getAttribute('points')).join('|')===Object.values(moved.traces).flatMap(trail=>M.traceParts(trail).map(pts=>pts.map(p=>p.join(',')).join(' '))).join('|'),'Published free-motion traces retain actual recorded coordinates');
    assert(P.answerSummary(motionItem)===null,'Free motion remains an illustration rather than an assessed challenge');
    movement.click();await tick();assert(doc.querySelector('[data-ag-tool="move"]').hidden&&JSON.stringify(cap().demo.labDrawing.points)===JSON.stringify(moved.points),'Disabling movement preserves the same scene');
    setGeometryMode('loci');await tick();
    const checkDynamicControls=()=>{
      for(const bar of doc.querySelectorAll('.gd-ag-dynamic-controls')){
        if(!bar.getBoundingClientRect().width||!bar.getBoundingClientRect().height)continue;
        const r=bar.getBoundingClientRect(),choice=bar.querySelector(':scope > select'),hint=bar.querySelector(':scope > .gd-ag-inspect-message');
        if(choice){const b=choice.getBoundingClientRect();assert(b.width>=r.width-24&&b.right<=r.right+1,'Dynamic selector occupies its own row without overflow')}
        if(hint){const b=hint.getBoundingClientRect();assert(b.width>=r.width-24&&b.right<=r.right+1,'Dynamic instruction has a dedicated full-width row')}
        for(const b of bar.querySelectorAll('.gd-ag-inspect-btn')){if(!b.getBoundingClientRect().height)continue;assert(b.classList.contains('gd-btn')&&b.getBoundingClientRect().right<=r.right+1,'Dynamic action uses shared compact button and remains within panel')}
      }
    };
    checkDynamicControls();
    const locusTap=(type,p)=>{const surface=doc.querySelector('[data-ag-locus-point="P"]').closest('svg').parentElement,v=new win.DOMPoint(...p).matrixTransform(surface.querySelector('svg').getScreenCTM());surface.dispatchEvent(new win.PointerEvent(type,{bubbles:true,cancelable:true,pointerId:33,pointerType:'touch',button:0,buttons:type==='pointerup'?0:1,clientX:v.x,clientY:v.y}))};
    doc.querySelector('[data-ag-locus-action="midpoint"]').click();assert(doc.querySelector('[data-ag-locus-action="midpoint"]').getAttribute('aria-pressed')==='true','Midpoint toggle exposes active state');
    const initialPoints=JSON.stringify(M.locusPoints(cap().demo.locusState));
    for(const [name,p] of [['P',[540,220]],['M',[470,220]]]){
      locusTap('pointerdown',p);locusTap('pointerup',p);
      const local=doc.querySelector('[data-ag-point-trace="toggle"]');assert(local&&local.getAttribute('aria-label')==='Start tracing '+name,'Tap exposes local trace action: '+name);local.click();
      assert(cap().demo.locusState.traceNames.includes(name)&&doc.querySelector('[data-ag-point-trace="toggle"]').getAttribute('aria-pressed')==='true','Local tracing activates without mode switch');
    }
    assert(JSON.stringify(M.locusPoints(cap().demo.locusState))===initialPoints,'Tapping points and activating trace does not move geometry');
    assert(doc.querySelector('[data-ag-locus-action="trace"]').getAttribute('aria-pressed')==='false','Global trace mode is not needed');
    locusTap('pointerdown',[540,220]);locusTap('pointermove',[400,70]);locusTap('pointermove',[260,220]);locusTap('pointerup',[260,220]);
    {
      const frame=fixture.frame,restore=frame.querySelector('[data-board-maximise]'),initial=JSON.stringify(cap().demo.locusState),hostViewport=document.getElementById('gd-board-viewport');
      api.select(fixture.record.id);restore.click();await tick(150);
      let surface=doc.querySelector('[data-ag-dynamic-workspace]'),svg=surface.querySelector('svg'),rect=svg.getBoundingClientRect(),vr=hostViewport.getBoundingClientRect(),matrix=svg.getScreenCTM();
      assert(frame.classList.contains('is-geometry-board')&&surface.dataset.agFullActive==='true','Preset dynamic geometry enters dedicated drawing mode');
      assert(Math.abs(rect.width-vr.width)<3&&Math.abs(rect.height-vr.height)<3&&Math.abs(matrix.a-matrix.d)<.001,'Dynamic board fills viewport without geometric distortion');
      assert(JSON.stringify(cap().demo.locusState)===initial,'Maximising preserves dynamic state and traces');
      const dynamicPalettes=[...doc.querySelectorAll('[data-ag-dynamic-panel]')],primary=dynamicPalettes[0],secondary=dynamicPalettes[1],header=primary.querySelector('.gd-ag-full-panel-head'),fold=header.querySelector('button'),body=primary.querySelector('.gd-ag-full-panel-content'),start=header.getBoundingClientRect(),oldLeft=primary.getBoundingClientRect().left;
      fold.click();assert(body.hidden&&fold.getAttribute('aria-expanded')==='false'&&fold.getAttribute('aria-label')==='Expand Dynamic geometry','Dynamic palette uses accessible shared collapse');fold.click();assert(!body.hidden&&fold.getAttribute('aria-expanded')==='true','Dynamic palette expands');
      for(const [type,x,y] of [['pointerdown',start.left+10,start.top+8],['pointermove',start.left+70,start.top+20],['pointerup',start.left+70,start.top+20]])header.dispatchEvent(new win.PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',pointerId:46,button:0,clientX:x,clientY:y}));
      assert(primary.getBoundingClientRect().left>oldLeft+20&&Number(primary.style.zIndex)>Number(secondary.style.zIndex),'Dynamic palette moves by touch and rises above other panels');
      const dock=doc.querySelector('[data-ag-full-panels]');dock.click();assert(dynamicPalettes.every(p=>p.hidden)&&dock.getAttribute('aria-expanded')==='false','Dynamic palettes can be hidden');
      const persistent=doc.querySelector('[data-ag-board-navigation]'),pr=persistent.getBoundingClientRect(),stateWithHidden=JSON.stringify(cap().demo.locusState),widthBeforeHidden=surface.querySelector('svg').viewBox.baseVal.width;
      assert(pr.width>0&&pr.height>0&&persistent.querySelectorAll('button').length===4&&!persistent.closest('[data-ag-dynamic-panel]'),'Independent camera controls remain accessible with dynamic palettes hidden');
      persistent.querySelector('[data-ag-nav="zoom-out"]').click();assert(surface.querySelector('svg').viewBox.baseVal.width>widthBeforeHidden&&JSON.stringify(cap().demo.locusState)===stateWithHidden,'Hidden-panel navigation changes only the camera');
      persistent.querySelector('[data-ag-nav="zoom-in"]').click();dock.click();assert(dock.getAttribute('aria-expanded')==='true'&&!primary.hidden,'Dynamic palettes can be restored');

      const nav=id=>doc.querySelector('[data-ag-nav="'+id+'"]'),cameraView=()=>{const v=surface.querySelector('svg').viewBox.baseVal;return [v.x,v.y,v.width,v.height]},beforeNav=cameraView(),stateBeforeNav=JSON.stringify(cap().demo.locusState);
      nav('zoom-out').click();assert(cameraView()[2]>beforeNav[2],'Preset board zooms out');
      nav('zoom-in').click();assert(Math.abs(cameraView()[2]-beforeNav[2])<.02,'Preset zoom in restores scale');
      const r=surface.getBoundingClientRect(),cx=r.left+r.width*.1,cy=r.top+r.height*.1;
      for(const [type,x,y] of [['pointerdown',cx,cy],['pointermove',cx+r.width*.4,cy+r.height*.4],['pointerup',cx+r.width*.4,cy+r.height*.4]])surface.dispatchEvent(new win.PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',pointerId:59,button:0,clientX:x,clientY:y}));
      assert(cameraView()[0]<beforeNav[0]&&cameraView()[1]<beforeNav[1]&&JSON.stringify(cap().demo.locusState)===stateBeforeNav,'Dragging empty dynamic canvas pans without selecting Pan, preserving constraint and traces');
      nav('fit').click();const fitView=cameraView(),fitBounds=M.locusFitBounds(cap().demo.locusState);
      assert(fitView[0]<=fitBounds[0]+.02&&fitView[1]<=fitBounds[1]+.02&&fitView[0]+fitView[2]>=fitBounds[0]+fitBounds[2]-.02&&fitView[1]+fitView[3]>=fitBounds[1]+fitBounds[3]-.02,'Preset Fit includes finite geometry and traces');
      const choose=doc.querySelector('[data-ag-locus-preset]');choose.value='custom';choose.dispatchEvent(new win.Event('change',{bubbles:true}));await tick(150);
      surface=doc.querySelector('[data-ag-dynamic-workspace]');assert(surface.dataset.agFullActive==='true'&&frame.classList.contains('is-geometry-board'),'Switching to custom geometry retains full-board mode');checkDynamicControls();
      const customSvg=surface.querySelector('svg'),{x,y,width:w,height:h}=customSvg.viewBox.baseVal,p=[x+w-25,y+h-25],v=new win.DOMPoint(...p).matrixTransform(customSvg.getScreenCTM());
      assert([x,y,w,h,v.x,v.y].every(Number.isFinite)&&w>50&&h>50,'Custom full-board SVG has valid bounds and screen coordinates');doc.querySelector('[data-ag-custom-action="add"]').click();
      surface.dispatchEvent(new win.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:45,button:0,clientX:v.x,clientY:v.y}));
      const saved=cap().demo.locusState;assert(saved.nodes.length===1&&Math.hypot(saved.nodes[0].at[0]-p[0],saved.nodes[0].at[1]-p[1])<2,'Custom points can be placed near full-board edge');
      const [bx,by,bw,bh]=M.customBounds(saved);assert(p[0]>=bx&&p[0]<=bx+bw&&p[1]>=by&&p[1]<=by+bh,'Saved custom geometry bounds retain edge point');
      nav('zoom-out').click();const wide=cameraView();nav('fit').click();const fitted=cameraView();
      assert(fitted[2]<wide[2]&&p[0]>=fitted[0]&&p[0]<=fitted[0]+fitted[2]&&p[1]>=fitted[1]&&p[1]<=fitted[1]+fitted[3]&&JSON.stringify(cap().demo.locusState)===JSON.stringify(saved),'Custom Fit focuses on actual construction rather than default paper');
      const lineModel=M.customInitial(),a=M.customAppend(lineModel,'free',[],{at:[-500,-300]}),b=M.customAppend(lineModel,'free',[],{at:[-300,-300]});
      const finite=M.customBounds(lineModel,40,true);M.customAppend(lineModel,'line',[a,b],{});
      assert(JSON.stringify(M.customBounds(lineModel,40,true))===JSON.stringify(finite),'Infinite custom lines do not expand finite Fit bounds');
      restore.click();await tick(150);assert(!frame.classList.contains('is-geometry-board')&&!doc.querySelector('[data-ag-dynamic-panel]')&&JSON.stringify(cap().demo.locusState)===JSON.stringify(saved),'Restoring custom geometry retains drawing and removes floating chrome');
      G.lessonState.restore(id,{...G.lessonState.capture(id),model:{...cap(),locusState:JSON.parse(initial),demo:{...cap().demo,locusState:JSON.parse(initial)}}});await tick(100);
    }
    const ls=cap().demo.locusState;
    assert(Math.abs(Math.hypot(ls.p[0]-400,ls.p[1]-220)-140)<1e-7,'Constrained point preserves exact radius');
    assert(doc.querySelector('[data-ag-locus-trace="P"]')&&doc.querySelector('[data-ag-locus-trace="M"]'),'Selected driver and dependent midpoint leave separate traces');
    const lociDraft=P.createDocument();lociDraft.addCurrent(id,cap());assert(P.renderItem(lociDraft.list()[0],false).querySelectorAll('[data-ag-locus-trace]').length===2,'Locus traces publish as vector graphics');
    {
      const model=win.TT99Goodies.angles;
      const ellipse=model.locusInitial('ellipse',{major:5,minor:4});ellipse.traceNames=['P','M'];
      const ellipseAt=a=>[400+200*Math.cos(a*Math.PI/180),220+160*Math.sin(a*Math.PI/180)];
      for(let turn=0;turn<3;turn++)for(let a=45;a<=360;a+=45)model.locusTraceMove(ellipse,ellipseAt(a));
      for(let a=315;a>=180;a-=45)model.locusTraceMove(ellipse,ellipseAt(a));
      const ellipseParts=model.traceParts(ellipse.traces.P);assert(ellipseParts.length===1&&ellipseParts[0].length>100,'Repeated rapid ellipse revolutions and reversal retain a continuous sampled trace');
      for(const part of ellipseParts)for(let i=1;i<part.length;i++){
        const p=part[i-1],q=part[i],mid=p.map((x,j)=>(x+q[j])/2),error=Math.abs(((mid[0]-400)/200)**2+((mid[1]-220)/160)**2-1);
        assert(error<.003,'Ellipse trace contains no long false interior chords');
      }
      const focus=model.locusPreset('ellipse',ellipse.params).anchors.A;
      assert(ellipse.traces.M.every(p=>Math.abs(((2*p[0]-focus[0]-400)/200)**2+((2*p[1]-focus[1]-220)/160)**2-1)<1e-6),'Midpoint trace stays on its corresponding constrained locus');
      model.locusTraceMove(ellipse,ellipseAt(0));assert(ellipse.traces.P.at(-1)===null,'Ambiguous half-turn ends trace rather than inventing a path');
      model.locusTraceMove(ellipse,ellipseAt(45));assert(model.traceParts(ellipse.traces.P).length===2,'Tracing resumes after discontinuity');
      const parallel=model.locusInitial('parallel');parallel.traceNames=['P'];model.locusTraceMove(parallel,[500,100]);model.locusTraceMove(parallel,[500,340]);model.locusTraceMove(parallel,[600,340]);assert(model.traceParts(parallel.traces.P).length===2&&model.traceParts(parallel.traces.P).every(part=>part.every(p=>p[1]===part[0][1])),'Parallel branches are never joined by false traces');
      const bisector=model.locusInitial('angleBisector');bisector.traceNames=['P'];model.locusTraceMove(bisector,[450,170]);model.locusTraceMove(bisector,[500,320]);assert(bisector.traces.P.at(-1)===null,'Angle-bisector branch switch breaks trace');
      for(const kind of Object.keys(model.LOCUS_PRESETS)){
        const st=model.locusInitial(kind);st.traceNames=['P','M'];for(const target of [[700,50],[100,400],[400,50],[400,400],[500,300]])model.locusTraceMove(st,target);
        assert(Object.values(st.traces).every(path=>path.every(p=>p===null||p.every(Number.isFinite))),'Rapid trace samples are finite: '+kind);
        assert(Math.hypot(...model.locusPoints(st).P.map((x,i)=>x-st.p[i]))<1e-6,'Final driver remains on its constraint: '+kind);
      }
      for(const kind of Object.keys(model.LOCUS_PRESETS)){
        const params=model.locusParameters(kind,Object.fromEntries((model.LOCUS_PARAMETERS[kind]||[]).map(([id,,min,max])=>[id,max]))),st=model.locusInitial(kind,params);st.showLocus=true;st.showMidpoint=true;
        for(const target of [[700,50],[100,400],[400,50],[400,400]]){
          st.p=model.locusProject(kind,target,st.p,params);
          const svg=P.renderItem(P.record(id,'diagram',{type:'diagram',mode:'loci',locusState:st}),false),v=svg.viewBox.baseVal;
          const captions=[...svg.querySelectorAll('[data-ag-locus-caption]')];assert(captions.length>=2,'Locus publication includes explanation: '+kind);
          const capTop=Number(captions[0].getAttribute('y'))-29;
          const inside=(x,y,rx=0,ry=rx)=>x-rx>=v.x&&x+rx<=v.x+v.width&&y-ry>=v.y&&y+ry<capTop;
          for(const c of svg.querySelectorAll('circle,ellipse')){const n=k=>Number(c.getAttribute(k)),rx=c.tagName==='ellipse'?n('rx'):n('r'),ry=c.tagName==='ellipse'?n('ry'):rx;assert(inside(n('cx'),n('cy'),rx,ry),'Published locus circle/ellipse fits above captions: '+kind)}
          for(const line of svg.querySelectorAll('line')){const n=k=>Number(line.getAttribute(k));assert(inside(n('x1'),n('y1'))&&inside(n('x2'),n('y2')),'Published locus line fits above captions: '+kind)}
          assert(Number(captions.at(-1).getAttribute('y'))<v.y+v.height,'Locus caption fits printable bounds');
        }
      }
      const st=model.customInitial();model.customAppend(st,'free',[],{at:[1050,620]});
      const svg=P.renderItem(P.record(id,'diagram',{type:'diagram',mode:'loci',locusState:st}),false),v=svg.viewBox.baseVal;
      assert(v.x+v.width>=1098&&v.y+v.height>=668&&svg.querySelector('[data-ag-custom-point]'),'Custom publication retains extended edge point and label margin');
    }
    const preset=doc.querySelector('[data-ag-locus-preset]');preset.value='bisector';preset.dispatchEvent(new win.Event('change',{bubbles:true}));
    locusTap('pointerdown',[400,100]);locusTap('pointermove',[630,320]);locusTap('pointerup',[630,320]);
    assert(Math.abs(cap().demo.locusState.p[0]-400)<1e-7,'Equidistant point moves along its perpendicular bisector');
    {
      const model=win.TT99Goodies.angles,dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),near=(a,b)=>Math.abs(a-b)<1e-6;
      for(const kind of Object.keys(model.LOCUS_PRESETS)){
        const state=model.locusInitial(kind);preset.value=kind;preset.dispatchEvent(new win.Event('change',{bubbles:true}));
        assert(doc.querySelector('[data-ag-locus-point="P"]'),'Locus preset mounts: '+kind);
        if(model.locusPreset(kind).guides.length){doc.querySelector('[data-ag-locus-action="guide"]').click();assert(doc.querySelector('[data-ag-locus-guide]'),'Locus reveal renders: '+kind)}
        for(let x=100;x<=700;x+=50)for(let y=50;y<=400;y+=50){
          state.p=model.locusProject(kind,[x,y],state.p);const p=model.locusPoints(state);
          assert(Object.values(p).every(q=>q.every(Number.isFinite)),'Finite dependent geometry: '+kind);
          if(kind==='circle')assert(near(dist(p.P,p.O),140),'Constant circle radius');
          if(kind==='bisector')assert(near(dist(p.P,p.A),dist(p.P,p.B)),'Equal point distances');
          if(kind==='parallel')assert(near(dist(p.P,p.F),120),'Fixed perpendicular distance');
          if(kind==='angleBisector')assert(near(dist(p.P,p.F),dist(p.P,p.G)),'Equal perpendicular distances');
          if(kind==='ellipse')assert(near(dist(p.P,p.A)+dist(p.P,p.B),400),'Constant ellipse focal sum');
          if(kind==='fixedAngle')assert(Math.abs((p.A[0]-p.P[0])*(p.B[0]-p.P[0])+(p.A[1]-p.P[1])*(p.B[1]-p.P[1]))<1e-6,'Right angle remains invariant');
          if(kind==='reflection')assert(near(p.P[0]+p.Q[0],800)&&near(p.P[1],p.Q[1]),'Reflection preserves symmetry');
        }
      }
    }
    {
      const model=win.TT99Goodies.angles,dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),near=(a,b)=>Math.abs(a-b)<1e-6;
      for(const kind of Object.keys(model.LOCUS_PARAMETERS)){
        const defs=model.LOCUS_PARAMETERS[kind];
        for(const factor of [0,.5,1]){
          const params=model.locusParameters(kind,Object.fromEntries(defs.map(([id,,min,max])=>[id,min+(max-min)*factor]))),st=model.locusInitial(kind,params);
          for(let x=100;x<=700;x+=100)for(let y=50;y<=400;y+=50){
            st.p=model.locusProject(kind,[x,y],st.p,params);const p=model.locusPoints(st);
            assert(Object.values(p).every(q=>q.every(Number.isFinite)),'Configurable locus finite: '+kind);
            if(kind==='circle')assert(near(dist(p.P,p.O),40*params.radius),'Adjustable radius');
            if(kind==='bisector')assert(near(dist(p.P,p.A),dist(p.P,p.B))&&near(dist(p.A,p.B),40*params.separation),'Adjustable bisector anchors');
            if(kind==='parallel')assert(near(dist(p.P,p.F),40*params.distance),'Adjustable parallel distance');
            if(kind==='angleBisector')assert(near(dist(p.P,p.F),dist(p.P,p.G)),'Adjustable angle bisectors');
            if(kind==='ellipse')assert(near(dist(p.P,p.A)+dist(p.P,p.B),80*params.major),'Adjustable ellipse focal sum');
            if(kind==='fixedAngle')assert(Math.abs((p.A[0]-p.P[0])*(p.B[0]-p.P[0])+(p.A[1]-p.P[1])*(p.B[1]-p.P[1]))<1e-6,'Adjustable diameter right angle');
            if(kind==='reflection')assert(near(p.P[0]+p.Q[0],80*params.axis)&&near(p.P[1],p.Q[1]),'Adjustable mirror axis');
          }
        }
      }
      preset.value='circle';preset.dispatchEvent(new win.Event('change',{bubbles:true}));
      doc.querySelector('[data-ag-locus-action="settings"]').click();
      const radiusControl=doc.querySelector('[data-ag-locus-parameter="radius"]');radiusControl.value='2';
      doc.querySelector('[data-ag-locus-action="apply"]').click();
      const saved=cap().demo.locusState;assert(saved.params.radius===2&&near(dist(model.locusPoints(saved).P,model.locusPoints(saved).O),80),'Dimensions apply and persist in snapshot');
      assert(!Object.keys(saved.traces).length,'Changing dimensions clears stale traces');
    }
    {
      const model=win.TT99Goodies.angles,dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),near=(a,b)=>Math.abs(a-b)<1e-6;
      const dot=(a,b,c)=>(a[0]-b[0])*(c[0]-b[0])+(a[1]-b[1])*(c[1]-b[1]);
      for(const kind of ['rectangle','areaRectangle','perimeterRectangle','isosceles','rhombus','rightTriangle']){
        for(const factor of [0,.5,1]){
          const params=model.locusParameters(kind,Object.fromEntries(model.LOCUS_PARAMETERS[kind].map(([id,,min,max])=>[id,min+(max-min)*factor]))),st=model.locusInitial(kind,params);
          for(let x=100;x<=700;x+=75)for(let y=50;y<=400;y+=50){
            st.p=model.locusProject(kind,[x,y],st.p,params);const p=model.locusPoints(st);
            assert(Object.values(p).every(q=>q.every(Number.isFinite)&&q[0]>=65&&q[0]<=735&&q[1]>=10&&q[1]<=412),'Constrained shape fits drawing space: '+kind);
            if(['rectangle','areaRectangle','perimeterRectangle'].includes(kind)){
              const w=dist(p.A,p.B),h=dist(p.B,p.P);
              assert(w>0&&h>0&&near(w,dist(p.C,p.P))&&near(h,dist(p.A,p.C))&&near(dot(p.A,p.B,p.P),0)&&near(dot(p.B,p.P,p.C),0)&&near(dot(p.P,p.C,p.A),0)&&near(dot(p.C,p.A,p.B),0),'All rectangle properties remain true');
              if(kind==='areaRectangle')assert(near(w*h/1600,params.area),'Area remains constant');
              if(kind==='perimeterRectangle')assert(near(2*(w+h)/40,params.perimeter),'Perimeter remains constant');
            }
            if(kind==='isosceles')assert(near(dist(p.A,p.P),dist(p.B,p.P)),'Isosceles equal sides preserved');
            if(kind==='rhombus')assert([dist(p.A,p.B),dist(p.B,p.P),dist(p.P,p.C),dist(p.C,p.A)].every(v=>near(v,40*params.side)),'Rhombus retains four equal sides');
            if(kind==='rightTriangle')assert(near(dot(p.B,p.A,p.P),0),'Right triangle retains perpendicular sides');
          }
        }
        preset.value=kind;preset.dispatchEvent(new win.Event('change',{bubbles:true}));
        assert(doc.querySelector('[data-ag-constrained-shape="'+kind+'"]'),'Constrained shape mounts: '+kind);
        const shapeDraft=P.createDocument();shapeDraft.addCurrent(id,cap());assert(P.renderItem(shapeDraft.list()[0],false).querySelector('[data-ag-constrained-shape="'+kind+'"]'),'Constrained shape publishes as vector graphic: '+kind);
      }
    }
    {
      const model=win.TT99Goodies.angles,dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),near=(a,b)=>Math.abs(a-b)<1e-6,dot=(a,b,c)=>(a[0]-b[0])*(c[0]-b[0])+(a[1]-b[1])*(c[1]-b[1]);
      for(const kind of ['tangent','externalTangents','circleChord','circleIntersection','circleTangency','internalTangency']){
        for(const factor of [0,.5,1]){
          const params=model.locusParameters(kind,Object.fromEntries(model.LOCUS_PARAMETERS[kind].map(([id,,min,max])=>[id,min+(max-min)*factor]))),st=model.locusInitial(kind,params),r=40*params.radius;
          for(let x=100;x<=700;x+=100)for(let y=50;y<=400;y+=50){
            st.p=model.locusProject(kind,[x,y],st.p,params);const p=model.locusPoints(st);
            assert(Object.values(p).every(q=>q.every(Number.isFinite)),'Circle dependency remains finite: '+kind);
            if(kind==='tangent')assert(near(dist(p.O,p.P),r)&&near(dot(p.O,p.P,p.A),0)&&near(dot(p.O,p.P,p.B),0),'Tangent stays perpendicular at contact');
            if(kind==='externalTangents')assert(near(dist(p.O,p.T),r)&&near(dist(p.O,p.U),r)&&near(dist(p.P,p.T),dist(p.P,p.U))&&near(dot(p.O,p.T,p.P),0)&&near(dot(p.O,p.U,p.P),0),'Both external tangents are exact and equal');
            if(kind==='circleChord')assert(near(dist(p.O,p.A),r)&&near(dist(p.O,p.B),r)&&near(dist(p.A,p.P),dist(p.B,p.P))&&near(dot(p.O,p.P,p.B),0),'Chord bisected by perpendicular');
            if(kind==='circleIntersection')assert([p.T,p.U].every(q=>near(dist(p.O,q),r)&&near(dist(p.P,q),40*params.secondRadius)),'Both circle intersections lie on both boundaries');
            if(['circleTangency','internalTangency'].includes(kind))assert(near(dist(p.O,p.T),r)&&near(dist(p.P,p.T),40*params.secondRadius)&&near(dist(p.O,p.P),kind==='internalTangency'?r-40*params.secondRadius:r+40*params.secondRadius),'Circle tangency preserves exact contact');
          }
        }
        preset.value=kind;preset.dispatchEvent(new win.Event('change',{bubbles:true}));
        assert(doc.querySelector('[data-ag-constraint-circle]'),'Circle relationship renders: '+kind);
        if(kind==='tangent'||kind==='externalTangents')assert(doc.querySelector('[data-ag-constraint-right-angle]'),'Tangent radius right-angle notation renders');
        const circleDraft=P.createDocument();circleDraft.addCurrent(id,cap());assert(P.renderItem(circleDraft.list()[0],false).querySelector('[data-ag-constraint-circle]'),'Circle relationship publishes as vector graphic: '+kind);
      }
    }
    {
      const model=win.TT99Goodies.angles,st=model.customInitial(),dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),near=(a,b)=>Math.abs(a-b)<1e-6,dot=(a,b,c)=>(a[0]-b[0])*(c[0]-b[0])+(a[1]-b[1])*(c[1]-b[1]);
      const O=model.customAppend(st,'free',[],{at:[350,220]}),R=model.customAppend(st,'free',[],{at:[450,220]}),P0=model.customAppend(st,'onCircle',[O,R],{at:[350,120]}),Q=model.customAppend(st,'tangentDirection',[O,P0],{value:2}),M=model.customAppend(st,'midpoint',[P0,Q]),N=model.customAppend(st,'ratio',[P0,Q],{value:.25}),E=model.customAppend(st,'free',[],{at:[600,220]}),T=model.customAppend(st,'tangentContact',[E,O,R],{branch:0}),U=model.customAppend(st,'tangentContact',[E,O,R],{branch:1}),F=model.customAppend(st,'foot',[E,O,R]),S=model.customAppend(st,'reflection',[P0,O,R]),V=model.customAppend(st,'parallel',[P0,O,R],{value:2}),W=model.customAppend(st,'perpendicular',[P0,O,R],{value:2}),K=model.customAppend(st,'angle',[O,R],{value:60}),H=model.customAppend(st,'distance',[O,R],{value:2}),I=model.customAppend(st,'lineIntersection',[P0,Q,O,E]);
      model.customAppend(st,'circle',[O,R]);model.customAppend(st,'line',[P0,Q]);model.customAppend(st,'segment',[E,T]);model.customAppend(st,'segment',[E,U]);model.traceToggle(st,M);
      for(let theta=0;theta<360;theta+=5){
        model.customMove(st,P0,[350+110*Math.cos(theta*Math.PI/180),220+110*Math.sin(theta*Math.PI/180)]);
        const {points:p}=model.customResolve(st);
        assert(near(dist(p[O],p[P0]),dist(p[O],p[R]))&&near(dot(p[O],p[P0],p[Q]),0),'Custom compound tangent stays exact');
        assert(near(dist(p[M],p[P0]),dist(p[M],p[Q]))&&near(dist(p[N],p[P0]),.25*dist(p[P0],p[Q])),'Midpoint and ratio follow tangent');
        assert(near(dist(p[E],p[T]),dist(p[E],p[U]))&&near(dot(p[O],p[T],p[E]),0),'External tangents valid');
        assert(near(p[F][1],220)&&near(p[S][1]+p[P0][1],440),'Foot and reflection remain valid');
        assert(near(p[V][1],p[P0][1])&&near(p[W][0],p[P0][0]),'Parallel and perpendicular dependent points');
        assert(near(dist(p[O],p[K]),100)&&near(dist(p[O],p[H]),80),'Fixed angle and distance');
        if(p[I])assert(Math.abs((p[I][0]-p[P0][0])*(p[Q][1]-p[P0][1])-(p[I][1]-p[P0][1])*(p[Q][0]-p[P0][0]))<1e-6,'Line intersection lies on tangent');
      }
      assert(st.traces[M].length>20,'Dependent custom point traces follow movement');
      const fast=model.customInitial(),o=model.customAppend(fast,'free',[],{at:[350,220]}),r=model.customAppend(fast,'free',[],{at:[450,220]}),driver=model.customAppend(fast,'onCircle',[o,r],{at:[450,220]}),mid=model.customAppend(fast,'midpoint',[o,driver]);fast.traceNames=[driver,mid];
      const at=theta=>[350+100*Math.cos(theta*Math.PI/180),220+100*Math.sin(theta*Math.PI/180)];
      for(let turn=0;turn<3;turn++)for(let theta=45;theta<=360;theta+=45)model.customMove(fast,driver,at(theta));
      for(let theta=315;theta>=180;theta-=45)model.customMove(fast,driver,at(theta));
      for(const [name,radius] of [[driver,100],[mid,50]]){
        const parts=model.traceParts(fast.traces[name]);assert(parts.length===1&&parts[0].length>100,'Custom fast circular trajectory stays continuous');
        for(const part of parts)for(let j=1;j<part.length;j++){const a=part[j-1],b=part[j],m=a.map((x,k)=>(x+b[k])/2);assert(near(dist(a,[350,220]),radius)&&radius-dist(m,[350,220])<.15,'Custom trace avoids false interior chords')}
      }
      const customTracePrint=P.renderItem(P.record(id,'diagram',{type:'diagram',mode:'loci',locusState:fast}),false);
      assert(customTracePrint.querySelectorAll('[data-ag-locus-trace]').length===2,'Custom sampled traces survive vector publishing');
      model.customMove(fast,driver,at(0));assert(fast.traces[driver].at(-1)===null,'Ambiguous custom half-turn breaks trace');
      model.customMove(fast,driver,at(45));assert(model.traceParts(fast.traces[driver]).length===2,'Custom trace resumes after gap');
      model.traceToggle(st,T);model.customMove(st,E,[570,220]);model.customMove(st,E,[100,220]);model.customMove(st,E,[80,220]);
      const tangentParts=model.traceParts(st.traces[T]);assert(tangentParts.length>=2,'Undefined intermediate tangent separates otherwise valid endpoints');
      assert(tangentParts.every(part=>part.slice(1).every((p,i)=>dist(p,part[i])<9)),'No false tangent jump across singularity');
      const rolling={traceNames:['P'],traces:{}};
      for(let i=1;i<=7000;i++)model.traceAdd(rolling,'P',[i,0],[i-1,0]);
      assert(rolling.traces.P.length<=6000&&rolling.traces.P.at(-1)[0]===7000&&rolling.traces.P[0][0]>0,'Trace capacity retains recent motion instead of silently stopping');
      model.customMove(st,E,[600,220]);

      model.customMove(st,E,[350,220]);assert(model.customResolve(st).invalid.includes(T),'Impossible tangent is marked undefined, not fabricated');model.customMove(st,E,[600,220]);assert(model.customResolve(st).points[T],'Tangent recovers when geometry becomes valid');
      const A=model.customAppend(st,'free',[],{at:[300,220]}),B=model.customAppend(st,'free',[],{at:[500,220]}),C=model.customAppend(st,'free',[],{at:[430,220]}),D=model.customAppend(st,'free',[],{at:[430,300]}),J=model.customAppend(st,'lineCircle',[A,B,O,R]),Z=model.customAppend(st,'circleCircle',[O,R,C,D]);const p=model.customResolve(st).points;
      assert(near(dist(p[J],p[O]),100)&&near(dist(p[Z],p[O]),100)&&near(dist(p[Z],p[C]),80),'Line/circle and circle/circle intersections exact');
      preset.value='custom';preset.dispatchEvent(new win.Event('change',{bubbles:true}));
      const place=(x,y)=>{doc.querySelector('[data-ag-custom-action="add"]').click();const svg=doc.querySelector('.gd-ag-visual svg'),surface=svg.parentElement,v=new win.DOMPoint(x,y).matrixTransform(svg.getScreenCTM());surface.dispatchEvent(new win.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:44,pointerType:'touch',button:0,clientX:v.x,clientY:v.y}))};
      place(200,220);place(400,220);
      const operation=doc.querySelector('[data-ag-custom-operation]');operation.value='midpoint';operation.dispatchEvent(new win.Event('change',{bubbles:true}));doc.querySelector('[data-ag-custom-action="add"]').click();
      assert(doc.querySelector('[data-ag-custom-point="C"]')&&cap().demo.locusState.nodes.length===3,'Custom workspace places points and adds a dependent midpoint');
      const customTap=(type,p)=>{const svg=doc.querySelector('.gd-ag-visual svg'),surface=svg.parentElement,v=new win.DOMPoint(...p).matrixTransform(svg.getScreenCTM());surface.dispatchEvent(new win.PointerEvent(type,{bubbles:true,cancelable:true,pointerId:84,pointerType:'touch',button:0,clientX:v.x,clientY:v.y}))};
      const customBefore=JSON.stringify(model.customResolve(cap().demo.locusState).points);
      customTap('pointerdown',[300,220]);customTap('pointerup',[300,220]);
      const local=doc.querySelector('[data-ag-point-trace="toggle"]');assert(local&&local.getAttribute('aria-label')==='Start tracing C','Dependent custom point supports local trace action');local.click();
      assert(cap().demo.locusState.traceNames.includes('C')&&JSON.stringify(model.customResolve(cap().demo.locusState).points)===customBefore,'Local trace toggle preserves custom geometry');
      const customDraft=P.createDocument();customDraft.addCurrent(id,cap());assert(customDraft.list()[0]&&P.renderItem(customDraft.list()[0],false).querySelector('[data-ag-custom-point="C"]'),'Custom construction publishes as a vector diagram');
      assert(!P.renderItem(customDraft.list()[0],false).querySelector('[data-ag-point-trace]'),'Local trace controls are excluded from paper');
      doc.querySelector('[data-ag-custom-action="undo"]').click();assert(!cap().demo.locusState.traceNames.includes('C'),'Undo restores trace toggle');doc.querySelector('[data-ag-custom-action="undo"]').click();assert(!doc.querySelector('[data-ag-custom-point="C"]'),'Custom construction undo restores graph');
      const customPreset=doc.querySelector('[data-ag-locus-preset]');customPreset.value='circle';customPreset.dispatchEvent(new win.Event('change',{bubbles:true}));assert(doc.querySelector('[data-ag-locus-point="P"]'),'Return to predefined investigations');
    }
    const polygonMode=doc.getElementById('ag-mode');polygonMode.value='polygon';polygonMode.dispatchEvent(new win.Event('change',{bubbles:true}));await tick();
    const chooseShape=doc.getElementById('ag-shape-view');chooseShape.value='rectangle';chooseShape.dispatchEvent(new win.Event('change',{bubbles:true}));await tick();
    doc.querySelector('[data-ag-action="diagonal"]').click();await tick();
    assert(cap().demo.showDiagonals&&doc.querySelector('.gd-ag-visual svg').textContent.includes('Equal diagonals'),'Rectangle explorer displays its diagonal relationship');
    const shapeHeightBefore=cap().demo.shapeHeight||180;
    doc.querySelector('[data-ag-action="shape-taller"]').click();await tick();
    assert(cap().demo.shapeHeight>shapeHeightBefore&&doc.querySelector('.gd-ag-visual svg').textContent.includes('Equal diagonals'),'Rectangle changes proportions while retaining its properties');

    const regionSvg=doc.querySelector('.gd-ag-visual>svg'),regionOutline=regionSvg.querySelector('[data-ag-region-points]'),regionPoints=JSON.parse(regionOutline.getAttribute('data-ag-region-points'));
    assert(regionPoints.length===5&&regionSvg.querySelectorAll('[data-ag-point-label]').length===5,'Polygon vertices and diagonal intersection have names');
    doc.querySelector('[data-ag-polygon-shade]').click();
    function shadeTap(svg,p){const v=new win.DOMPoint(...p).matrixTransform(svg.getScreenCTM());svg.dispatchEvent(new win.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',button:0,clientX:v.x,clientY:v.y}))}
    const shadeApply=()=>[...doc.querySelectorAll('.gd-ag-inspect-tools button')].find(b=>b.textContent==='Shade selected');
    for(const j of [0,1,4])shadeTap(regionSvg,regionPoints[j]);shadeApply().click();
    doc.querySelector('.gd-ag-inspect-tools button[aria-label="Blue region"]').click();
    for(const j of [2,3,4])shadeTap(regionSvg,regionPoints[j]);shadeApply().click();
    assert(regionSvg.querySelectorAll('[data-ag-region]').length===2,'Two independently selected regions are shaded');
    const regionDraft=P.createDocument();regionDraft.addCurrent(id,cap());assert(P.renderItem(regionDraft.list()[0],false).querySelectorAll('[data-ag-region]').length===2,'Authored mathematical shading survives publication');
    doc.querySelector('[data-ag-polygon-shade]').click();

    const circleMode=doc.getElementById('ag-mode');circleMode.value='circle';circleMode.dispatchEvent(new win.Event('change',{bubbles:true}));await tick();
    assert(doc.querySelector('.gd-ag-visual svg').textContent.includes('Diameter = 2 × radius'),'Circle explorer explains radius-diameter relationship');
    const beforeRadius=cap().demo.radius||5;doc.querySelector('[data-ag-action="radius-up"]').click();await tick();
    assert(cap().demo.radius===beforeRadius+1,'Circle radius adjusts interactively');
    const circleSvg=()=>doc.querySelector('.gd-ag-visual svg');
    assert([...circleSvg().querySelectorAll('[data-ag-circle-symbol]')].map(n=>n.textContent).sort().join(',')==='D,r','Circle diagram uses only short mathematical symbols');
    assert(circleSvg().querySelector('[data-ag-circle-outline]').getAttribute('fill')==='none','Screen exploration defaults to clean outlines');
    const verifyCircleClearance=out=>{
      const centre=out.querySelector('[data-ag-circle-centre]'),outline=out.querySelector('[data-ag-circle-outline]'),cx=Number(centre.getAttribute('cx')),cy=Number(centre.getAttribute('cy')),r=Number(outline.getAttribute('r')),labels=[...out.querySelectorAll('[data-ag-point-label],[data-ag-circle-symbol]')],at=n=>[Number(n.getAttribute('x')),Number(n.getAttribute('y'))],size=n=>Number(n.getAttribute('font-size'));
      for(const n of labels){const [x,y]=at(n),name=n.textContent;
        assert(n.getAttribute('dominant-baseline')==='central','Circle labels have centred vertical alignment');
        if(name==='O')assert(Math.hypot(x-cx,y-cy)>=size(n),'Centre label clears centre dot and diameter');
        if(name==='D')assert(y-cy>=size(n)*.75,'Diameter symbol clears horizontal diameter');
        if(n.hasAttribute('data-ag-point-label')&&name!=='O')assert(Math.hypot(x-cx,y-cy)-r>=size(n),'Boundary point label clears circumference');
        if(name==='r'){const a=55*Math.PI/180;assert(Math.abs((x-cx)*Math.sin(a)+(y-cy)*Math.cos(a))>=size(n)*.75,'Radius symbol clears sloping radius')}
      }
      for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=at(labels[i]),b=at(labels[j]);assert(Math.hypot(a[0]-b[0],a[1]-b[1])>=(size(labels[i])+size(labels[j]))/2,'Circle label centres remain separated')}
    };
    verifyCircleClearance(circleSvg());
    doc.querySelector('[data-ag-action="circle-extension"]').click();await tick();
    assert(circleSvg().querySelectorAll('[data-ag-circle-formula]').length===2&&circleSvg().querySelectorAll('[data-ag-circle-working]').length===2,'KS3 extension shows general formulae and substituted numerical working');
    for(const type of ['regularity','triangle-type','quad-type','circle-diameter','circle-radius','circle-part']){
      const pack=P.createDocument();pack.generate(id,P.defaultSettings(id),1,type);const item=pack.list()[0];
      for(const out of [P.renderItem(item,false),P.answerGraphic(item)]){
        const outline=out.querySelector('[data-ag-inspect-polygon],[data-ag-circle-outline]');
        assert(outline&&outline.getAttribute('fill')==='none','Printed geometry shape has no decorative shading: '+type);
      }
      if(type==='circle-diameter'||type==='circle-radius'){
        verifyCircleClearance(P.renderItem(item,false));verifyCircleClearance(P.answerGraphic(item));
        const values=P.renderItem(item,false).querySelector('[data-ag-circle-values]').textContent;
        assert(type==='circle-diameter'?!values.includes('D ='):!values.includes('r ='),'Pupil print does not reveal missing circle dimension');
      }
    }
    for(const [type,expected] of [['circle-diameter','cm'],['circle-radius','cm'],['rectangle-length','cm'],['isosceles-angle','°'],['diagonal-equal','diagonals']]){
      const pack=P.createDocument();pack.generate(id,P.defaultSettings(id),1,type);const item=pack.list()[0];
      assert(P.renderItem(item,false).querySelector('svg,polygon,circle'),'Relationship question has pupil diagram: '+type);
      assert(P.answerGraphic(item).textContent.toLowerCase().includes(expected.toLowerCase()),'Relationship key displays relevant notation: '+type);
    }



    api.remove(fixture.record.id);
  }
  // Function machine live exploration, reverse and shared pupil assessment.
  {
    const id='function-machine',fixture=await addForSave(id),doc=fixture.doc,G=doc.defaultView.TT99Goodies,M=G.functionMachines,cap=()=>G.lessonState.capture(id).model;
    doc.getElementById('fm-next-step').click();await tick();assert(cap().progress===1,'Machine step demonstration advances one operation');
    doc.getElementById('fm-table').click();await tick();assert(cap().showTable&&doc.querySelector('#gd-stage table'),'Input/output table appears in explore mode');
    const pub=TT99Goodies.publishing;
    const demoDraft=pub.createDocument();demoDraft.addCurrent(id,cap());
    const demo=demoDraft.list()[0];assert(demo.kind==='diagram'&&demo.data.progress===1&&demo.data.rows.length===5,'Teaching capture preserves displayed step and table');
    const demoSvg=pub.renderItem(demo,false);assert(demoSvg.textContent.includes('Input')&&demoSvg.textContent.includes('Output')&&demoSvg.textContent.includes('?'),'Unfinished demonstration remains unfinished on paper');
    const exportCalls=[],X=G.exportTools;
    X.copyPng=async svg=>{exportCalls.push(['copy',svg.textContent])};X.downloadPng=async svg=>{exportCalls.push(['png',svg.textContent])};X.downloadSvg=svg=>{exportCalls.push(['svg',svg.textContent])};X.printSvg=svg=>{exportCalls.push(['print',svg.textContent])};
    for(const kind of ['copy','png','svg','print']){const button=doc.querySelector('[data-gd-direct-export="'+kind+'"]');assert(button,'Direct export exists in Explore: '+kind);button.click();await tick()}
    assert(exportCalls.length===4&&exportCalls.every(e=>e[1].includes('Input')&&e[1].includes('Output')),'All four direct exports use current machine diagram');
    const before=cap(),out=M.trace(before.input,before.steps).at(-1);
    doc.getElementById('fm-reverse').click();await tick();assert(cap().input===out&&M.trace(cap().input,cap().steps).at(-1)===before.input,'Machine inverse reverses the order and operations');
    doc.querySelector('[data-fm-workflow="challenge"]').click();await tick();
    doc.querySelector('[data-fm-challenge-mode="pairs-all"]').click();await tick();
    const task=cap().task,check=doc.querySelector('[data-gd-pupil-check]');assert(task.all.length>0&&check.disabled,'No pair is selected initially');
    for(const p of task.all){const button=[...doc.querySelectorAll('#gd-stage button[aria-pressed]')].find(b=>b.textContent==='('+p.join(', ')+')');assert(button,'Every valid pair is offered');button.click()}
    check.click();await tick();assert(doc.querySelector('.gd-pupil-feedback').classList.contains('is-correct'),'All valid pairs are accepted');
    const draft=TT99Goodies.publishing.createDocument();draft.addCurrent(id,cap());assert(draft.list()[0].data.type==='pairs-all','Saved challenge and teacher marking are preserved');
    doc.querySelector('[data-board-action="reveal"]').click();await tick();
    for(const kind of ['svg','key-copy','key-print']){const button=doc.querySelector('[data-gd-direct-export="'+kind+'"]');assert(button,'Challenge export exists: '+kind);button.click();await tick()}
    const pupil=exportCalls.at(-3)[1],key=exportCalls.at(-2)[1];assert(!pupil.includes(task.answer)&&key.includes(task.all.map(p=>'('+p.join(', ')+')').join('; ').slice(0,10)),'Revealed challenge exports remain answer-free; teacher key lists solutions');
    fixture.frame.querySelector('[data-board-export]').click();await tick();
    assert(!fixture.frame.querySelector('[data-pub-key-group]').hidden,'Whiteboard menu exposes teacher key for a live challenge');
    assert(!fixture.frame.querySelector('[data-board-export-kind="add-document"]').hidden&& !fixture.frame.querySelector('[data-board-export-kind="generate-document"]').hidden,'Whiteboard supports current and batch publication');
    const mixed=pub.createDocument();mixed.addCurrent(id,cap());mixed.generateBlocks([{tool:id,settings:pub.defaultSettings(id),types:['output','table','rule'],count:5},{tool:'statistics-table',settings:pub.defaultSettings('statistics-table'),types:['read'],count:2}]);
    assert(mixed.list().length===8&&pub.pages(mixed.list(),{teacher:true}).some(s=>s.getAttribute('data-worksheet-answer')==='annex'),'Current and generated machine items coexist with other widgets and answer annex');
    api.remove(fixture.record.id);
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
  // Full pie construction and a timetable question exercise the shared assessment UI.
  {
    const id='statistics-table',fixture=await addForSave(id),doc=fixture.doc,live=doc.defaultView.TT99Goodies,stage=doc.querySelector('#gd-stage'),capture=()=>live.lessonState.capture(id).model;
    const choose=view=>{const select=doc.getElementById('st-view');select.value=view;select.dispatchEvent(new doc.defaultView.Event('change',{bubbles:true}))};
    choose('pie');await tick();doc.querySelector('[data-st-workflow="challenge"]').click();await tick();
    doc.querySelector('[data-st-challenge-mode="pie-build"]').click();await tick();
    const angles=live.statistics.pie(capture().data).map(s=>Math.round(s.angle)),check=stage.querySelector('[data-gd-pupil-check]');
    assert(check.disabled,'Pie construction starts with no sectors allocated');
    for(let i=0;i<angles.length;i++){const select=stage.querySelector('[data-st-sector="'+i+'"]');select.value=String(angles[i]);select.dispatchEvent(new doc.defaultView.Event('change',{bubbles:true}));}
    assert(!check.disabled,'Pie check is enabled only after every angle is entered');check.click();await tick();
    assert(stage.querySelector('.gd-pupil-feedback').classList.contains('is-correct'),'Complete pie construction is marked correctly');
    const draft=TT99Goodies.publishing.createDocument();draft.addCurrent(id,capture());assert(TT99Goodies.publishing.answerSummary(draft.list()[0])===angles.join(', '),'Pie marking keeps all angles');
    choose('timetable');await tick();doc.querySelector('[data-st-challenge-mode="time-elapsed"]').click();await tick();
    const model=capture();assert(model.task.type==='time-elapsed'&&Number(model.task.answer)>0,'Timetable journey duration is positive');
    api.remove(fixture.record.id);
  }
  // Work directly in actual embedded written-method grids with the shared keypad.
  for(const id of ['written-methods','column-addition','column-subtraction','written-multiplication','written-division']){
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
  for(const id of ['place-value','abacus','maths-canvas','sequences','column-addition','column-subtraction','written-multiplication','written-division','statistics-table','function-machine','angles']){
    const fixture=await addForSave(id),panel=document.getElementById('gd-board-floating-controls');
    fixture.frame.querySelector('[data-board-settings]').click();await tick();
    assert(panel.dataset.panelMode==='settings'&&panel.querySelector('.gd-board-controls-proxy'),'Specialist teaching settings open: '+id);
    panel.querySelector('[data-board-controls-close]').click();await tick();
    const challengeButton=fixture.frame.querySelector('[data-board-quick-actions] button[aria-label="Choose a challenge"]');assert(challengeButton,'Frame Challenge action exists for '+id);challengeButton.click();await tick();
    assert(panel.querySelector('[data-gd-native-random="all"]'),'Specialist quick launcher: '+id);
    panel.querySelector('[data-board-launcher-settings]').click();await tick();
    assert(panel.querySelector('.gd-panel-native-random')&&panel.querySelector('[data-board-launcher-back]'),'Specialist full challenge settings: '+id);
    if(id==='angles'){
      const catalogue=panel.querySelector('.gd-ag-challenge-catalogue'),settings=panel.querySelector('details[data-ag-section="settings"]');
      assert(catalogue&&catalogue.querySelectorAll('details[data-ag-section]').length===8&&!catalogue.querySelector('details[open]'),'Geometry full challenge panel starts with eight compact primary categories');
      const section=catalogue.querySelector('details[data-ag-section="properties"]');section.open=true;settings.open=true;
      const en=panel.querySelector('#ag-enrich');en.checked=true;en.dispatchEvent(new Event('change',{bubbles:true}));await tick(100);
      assert(panel.querySelector('details[data-ag-section="properties"]').open&&panel.querySelector('details[data-ag-section="settings"]').open,'Open geometry sections survive generation settings changes');
      assert(panel.querySelector('details[data-ag-section="ks3"]')&&fixture.doc.querySelector('#ag-enrich').checked,'KS3 questions appear only after opt-in');
      const propertyRandom=panel.querySelector('details[data-ag-section="properties"] [data-gd-native-random]');propertyRandom.click();await tick(100);
      const source=fixture.doc.querySelector('[data-gd-native-prefix="ag"]'),groups=JSON.parse(source.dataset.gdNativeGroups);
      const getTask=()=>fixture.doc.defaultView.TT99Goodies.lessonState.capture('angles').model.task;
      assert(groups.find(g=>g.id==='properties').ids.includes(getTask().type),'Scoped geometry random generation uses selected category');
      fixture.doc.querySelector('[data-challenge-action="another"]').click();await tick();
      assert(groups.find(g=>g.id==='properties').ids.includes(getTask().type),'Another preserves geometry random category');
    }
    if(id==='sequences'){const d=panel.querySelector('[data-seq-challenge-setting="difficulty"]');d.value='hard';d.dispatchEvent(new Event('change',{bubbles:true}));await tick();assert(fixture.doc.querySelector('[data-seq-challenge-setting="difficulty"]').value==='hard','Sequence difficulty forwards from full panel')}
    panel.querySelector('[data-gd-native-random="all"]').click();await tick(100);
    assert(fixture.doc.querySelector('#gd-stage .gd-native-challenge,#gd-stage .gd-challenge-banner,#gd-stage .gd-ab-task'),'Specialist full settings Random generates: '+id);
    panel.querySelector('[data-board-launcher-back]').click();await tick();
    panel.querySelector('[data-gd-native-random="all"]').click();await tick(100);
    assert(!visible(panel),'Specialist quick generation closes launcher: '+id);
    if(['column-addition','column-subtraction','written-multiplication','written-division','statistics-table','function-machine','angles'].includes(id)){
      fixture.frame.querySelector('[data-board-quick-actions] button[aria-label="Choose a challenge"]').click();await tick();
      const specific=panel.querySelector('.gd-launch-native-type:not(:disabled)');
      assert(specific,'New widget has a specific question in the quick launcher: '+id);
      specific.click();await tick(100);
      assert(!visible(panel),'Specific question closes quick launcher: '+id);
      const banner=fixture.doc.querySelector('.gd-challenge-banner'),response=banner?.querySelector('.gd-pupil-response'),answer=response?.querySelector('.gd-pupil-field input'),check=response?.querySelector('[data-gd-pupil-check]');
      if(answer&&check){
        const ar=answer.getBoundingClientRect(),cr=check.getBoundingClientRect();
        assert(Math.abs(ar.height-cr.height)<1.5,'Answer and Check use equal height: '+id);
        if(Math.abs(ar.top-cr.top)<ar.height)assert(Math.abs(ar.top+ar.height/2-cr.top-cr.height/2)<1.5,'Answer and Check are vertically centred: '+id);
      }
      const actions=[...banner.querySelectorAll('.gd-challenge-actions button')].filter(b=>fixture.doc.defaultView.getComputedStyle(b).display!=='none'&&!b.hidden);
      assert(actions.every(b=>Math.abs(b.getBoundingClientRect().height-40)<1.5),'Compact equal-height challenge controls: '+id);

      const reveal=fixture.doc.querySelector('[data-board-action="reveal"]'),rail=fixture.frame.querySelector('[data-board-quick-actions]');
      const frameReveal=()=>[...rail.querySelectorAll('button')].filter(b=>/^(Reveal|Hide) answer$/.test(b.textContent.trim()));
      assert(reveal&&frameReveal().length===1&&reveal.hasAttribute('data-board-delegated-reveal')&&fixture.doc.defaultView.getComputedStyle(reveal).display==='none','Exactly one visible reveal action in selected frame: '+id);
      frameReveal()[0].click();await tick(100);
      const hidden=fixture.doc.querySelector('[data-board-action="reveal"]');
      assert(frameReveal().length===1&&frameReveal()[0].textContent.trim()==='Hide answer'&&hidden?.hasAttribute('data-board-delegated-reveal'),'Delegated reveal remains in sync after revealing: '+id);
      frameReveal()[0].click();await tick(100);
      assert(frameReveal().length===1&&frameReveal()[0].textContent.trim()==='Reveal answer','Delegated hide restores question: '+id);
      fixture.frame.querySelector('[data-board-context]').click();await tick();
      assert(!fixture.doc.querySelector('[data-board-action="reveal"]').hasAttribute('data-board-delegated-reveal'),'Native reveal available while frame context menu hides rail: '+id);
      fixture.frame.querySelector('[data-board-context]').click();await tick();
      assert(fixture.doc.querySelector('[data-board-action="reveal"]').hasAttribute('data-board-delegated-reveal'),'Frame delegation resumes when context menu closes: '+id);

    }
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
