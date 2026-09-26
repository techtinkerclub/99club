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
<script src="/assets/99club/goodies-challenge.js"></script>
<script src="/assets/99club/goodies-export.js"></script>
<script src="/assets/99club/goodies-tools-a.js"></script>
<script src="/assets/99club/goodies-number-line-v6.js"></script>
<script src="/assets/99club/goodies-tools-b.js"></script>
<script>
(function(){
  function assert(value,message){if(!value)throw new Error(message)}
  function numberText(selector){
    const el=document.querySelector(selector);
    return Number(String(el&&el.textContent||'').replace(/,/g,''));
  }
  function pointer(el,type,x,y,id){
    el.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:id||1,button:0,clientX:x,clientY:y}));
  }
  function result(status,message){
    const el=document.getElementById('gd-qa-result');
    el.dataset.status=status;
    el.dataset.message=message||'';
    el.textContent=status+': '+(message||'');
  }
  function testNumberLineChallenges(){
    assert(window.TT99Goodies&&TT99Goodies.numberLine,'Number Line is registered');
    assert(TT99Goodies.challengeKit&&TT99Goodies.challengeKit.editorHtml,'Shared challenge framework is registered');

    TT99Goodies.numberLine();
    assert(document.querySelectorAll('[data-nl-workflow]').length===4,'Number Line exposes four teacher workflow tabs');
    assert(document.querySelector('[data-nl-panel="setup"]'),'Number Line opens on Setup');

    document.getElementById('nl-add-line').click();
    assert(document.getElementById('nl-active-line').value==='l2','New comparison line becomes active');
    const ownScale=document.querySelector('[data-nl-scale-mode="own"]');
    assert(ownScale&&!ownScale.disabled,'Extra line can switch to its own scale');
    ownScale.click();
    const setInput=(id,value)=>{const el=document.getElementById(id);assert(el,'Expected scale input '+id);el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}))};
    setInput('nl-line-max',200);
    setInput('nl-line-min',100);
    setInput('nl-line-step',10);
    setInput('nl-line-label-every',2);
    document.querySelector('[data-nl-workflow="objects"]').click();
    document.getElementById('nl-add-marker').click();
    const ownMarker=document.querySelector('[data-line-id="l2"][data-marker-hit]');
    assert(ownMarker,'Independent line accepts its own marker');
    const ownValue=document.querySelector('[data-marker-value]');
    assert(ownValue&&Number(ownValue.value)===150,'New marker uses the midpoint of the independent 100–200 scale');
    assert(Number(ownValue.step)===10,'Marker editing uses the independent line tick step');
    const ownCx=Number(ownMarker.querySelector('circle').getAttribute('cx'));
    assert(Math.abs(ownCx-525)<3,'Independent-scale midpoint renders at the centre of its own line');
    const ownText=document.getElementById('nl-svg').textContent;
    assert(ownText.includes('100')&&ownText.includes('200'),'Independent line renders its own endpoint labels');
    assert(ownText.includes('-10')&&ownText.includes('20'),'Main line keeps its original scale');

    document.querySelector('[data-nl-workflow="setup"]').click();
    document.querySelector('[data-nl-scale-mode="shared"]').click();
    document.querySelector('[data-nl-workflow="objects"]').click();
    const sharedValue=document.querySelector('[data-marker-value]');
    assert(sharedValue&&Number(sharedValue.value)<=20,'Returning to aligned scale clamps the marker to the main scale');

    TT99Goodies.numberLine();
    const zoomKind=document.getElementById('nl-new-line-mode');
    assert(zoomKind&&[...zoomKind.options].some(o=>o.value==='zoom')&&[...zoomKind.options].some(o=>o.value==='linked'),'Add teaching line exposes Zoomed interval and Double number line');
    zoomKind.value='zoom';
    document.getElementById('nl-add-line').click();
    assert(document.querySelector('[data-nl-line-mode="zoom"]'),'Zoom line renders as a distinct teaching-line mode');
    assert(document.querySelector('.nl-zoom-link'),'Zoom line visually connects its source interval to the enlarged line');
    assert(Number(document.getElementById('nl-line-min').value)===3&&Number(document.getElementById('nl-line-max').value)===8,'Zoom defaults to the two main-line markers when available');
    const followZoom=document.getElementById('nl-zoom-follow');
    assert(followZoom&&followZoom.checked,'Marker-based zoom follows the first two main markers by default');
    followZoom.checked=false;
    followZoom.dispatchEvent(new Event('change',{bubbles:true}));
    setInput('nl-line-min',4);
    setInput('nl-line-max',6);
    document.getElementById('nl-fit-zoom-markers').click();
    assert(Number(document.getElementById('nl-line-min').value)===3&&Number(document.getElementById('nl-line-max').value)===8,'Use current marker interval restores the teaching interval quickly');
    document.getElementById('nl-zoom-follow').checked=true;
    document.getElementById('nl-zoom-follow').dispatchEvent(new Event('change',{bubbles:true}));
    const zoomLineSelect=document.getElementById('nl-active-line');
    zoomLineSelect.value='l1';zoomLineSelect.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('[data-nl-workflow="objects"]').click();
    const mainA=document.querySelector('[data-marker-value="m1"]');
    mainA.value='4';mainA.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('[data-nl-workflow="setup"]').click();
    assert(!document.getElementById('nl-delete-line'),'The main reference line cannot be removed while dependent teaching lines exist');
    const backToZoom=document.getElementById('nl-active-line');
    backToZoom.value='l2';backToZoom.dispatchEvent(new Event('change',{bubbles:true}));
    assert(Number(document.getElementById('nl-line-min').value)===4&&Number(document.getElementById('nl-line-max').value)===8,'Moving a followed main marker updates the zoom interval live');

    TT99Goodies.numberLine();
    document.querySelector('[data-nl-preset="0-20"]').click();
    const linkedKind=document.getElementById('nl-new-line-mode');
    linkedKind.value='linked';
    document.getElementById('nl-add-line').click();
    assert(document.querySelector('[data-nl-line-mode="linked"]'),'Double number line renders as a linked teaching-line mode');
    assert(document.querySelectorAll('.nl-linked-guide').length===3,'Double number line shows restrained correspondence guides');
    setInput('nl-line-max',100);
    setInput('nl-line-step',10);
    assert(document.querySelector('.nl-linked-badge')?.textContent.includes('×5'),'Zero-based linked scales show the proportional factor when it is meaningful');
    document.querySelector('[data-nl-workflow="objects"]').click();
    const pairButton=document.getElementById('nl-add-correspondence');
    assert(pairButton,'Double number line exposes a direct corresponding-pair action');
    pairButton.click();
    let pairNodes=[...document.querySelectorAll('.nl-svg-marker[data-position-group="p1"]')];
    assert(pairNodes.length===2,'Corresponding pair adds one live marker to each line');
    assert(document.querySelector('.nl-linked-pair-guide[data-position-group="p1"]'),'Corresponding pair gets a restrained visual guide');
    let linkedValue=document.querySelector('[data-marker-value]');
    assert(linkedValue&&Number(linkedValue.value)===50&&Number(linkedValue.step)===10,'Corresponding marker uses the linked scale and tick step');
    linkedValue.value='80';linkedValue.dispatchEvent(new Event('input',{bubbles:true}));
    pairNodes=[...document.querySelectorAll('.nl-svg-marker[data-position-group="p1"]')];
    const mainPair=pairNodes.find(n=>n.getAttribute('data-line-id')==='l1'),linkedPair=pairNodes.find(n=>n.getAttribute('data-line-id')==='l2');
    assert(mainPair&&linkedPair&&mainPair.querySelector('circle').getAttribute('cx')===linkedPair.querySelector('circle').getAttribute('cx'),'Dragging/editing either corresponding marker keeps the pair proportionally aligned');
    assert(mainPair.textContent.includes('16')&&linkedPair.textContent.includes('80'),'A 0–20 to 0–100 pair maps 16 to 80');
    const pairLabel=document.querySelector('[data-marker-label]');
    pairLabel.value='Q';pairLabel.dispatchEvent(new Event('input',{bubbles:true}));
    pairNodes=[...document.querySelectorAll('.nl-svg-marker[data-position-group="p1"]')];
    assert(pairNodes.every(n=>n.textContent.includes('Q')),'Corresponding marker labels stay visually linked');
    document.querySelector('[data-marker-delete]').click();
    assert(!document.querySelector('[data-position-group="p1"]'),'Deleting a corresponding marker removes the paired correspondence cleanly');
    document.getElementById('nl-add-marker').click();
    linkedValue=document.querySelector('[data-marker-value]');
    assert(linkedValue&&Number(linkedValue.value)===50&&Number(linkedValue.step)===10,'Ordinary independent markers still work on a double number line');

    TT99Goodies.numberLine();
    document.querySelector('[data-nl-workflow="challenge"]').click();
    const standardCards=document.querySelectorAll('[data-nl-challenge-type]');
    assert(standardCards.length>=2,'Standard challenge cards are shown (found '+standardCards.length+'): '+String(document.getElementById('nl-controls')?.innerHTML||'').slice(0,500));
    assert(document.querySelector('[data-nl-challenge-type="identify"]'),'Existing marked-number challenge remains available');

    const intervalCat=document.querySelector('[data-nl-challenge-cat="read"]');
    assert(intervalCat,'Read & scale challenge category exists');
    const interval=document.querySelector('[data-nl-challenge-type="interval-value"]');
    assert(interval,'Interval-value challenge exists');
    interval.click();
    assert(document.getElementById('nl-generate').textContent.includes('Generate challenge'),'Standard picker starts with an explicit Generate challenge action');
    document.getElementById('nl-generate').click();
    assert(document.querySelector('.gd-challenge-banner'),'Generated standard challenge appears above the number line');
    assert(document.querySelector('.gd-challenge-prompt').textContent.includes('interval'),'Generated interval challenge has contextual prompt');
    assert(document.querySelector('.gd-challenge-reveal'),'Generated challenge exposes answer contextually');
    assert(document.getElementById('nl-generate').textContent.includes('Another like this'),'Active standard challenge changes the editor action to Another like this');
    const another=document.querySelector('[data-challenge-action="another"]');
    assert(another&&another.textContent.includes('Another like this'),'Challenge banner exposes Another like this without reopening menus');
    another.click();
    assert(document.querySelector('[data-challenge-action="another"]'),'Another like this immediately produces the next challenge of the same type');
    assert(document.querySelector('.gd-challenge-reveal'),'Repeated classroom challenge still exposes contextual Reveal answer');

    document.querySelector('[data-nl-challenge-tab="custom"]').click();
    assert(document.getElementById('nl-custom-title'),'Custom challenge exposes editable title');
    assert(document.getElementById('nl-custom-prompt'),'Custom challenge exposes rich-text prompt editor');
    assert(document.querySelector('[data-gd-rich-action="bold"]'),'Custom challenge exposes bold formatting');
    assert(document.querySelector('[data-gd-rich-action="italic"]'),'Custom challenge exposes italic formatting');
    assert(document.querySelector('[data-gd-rich-action="size-large"]'),'Custom challenge exposes text-size formatting');

    const title=document.getElementById('nl-custom-title');
    title.value='Explain your thinking';
    title.dispatchEvent(new Event('input',{bubbles:true}));
    const prompt=document.getElementById('nl-custom-prompt');
    prompt.innerHTML='Why is <strong>this interval</strong> correct?';
    prompt.dispatchEvent(new Event('input',{bubbles:true}));
    assert(document.querySelector('.gd-challenge-banner h3').textContent==='Explain your thinking','Custom title appears on the challenge');
    assert(document.querySelector('.gd-challenge-prompt strong').textContent==='this interval','Allowed rich text appears in the challenge');

    const generatedSource=document.getElementById('nl-custom-answer-source');
    assert(generatedSource&&generatedSource.value==='generated','Converted standard challenge keeps its generated live answer');
    generatedSource.value='manual';
    generatedSource.dispatchEvent(new Event('change',{bubbles:true}));
    const answer=document.getElementById('nl-custom-answer');
    assert(answer,'Manual answer field appears when the teacher chooses to type the answer');
    answer.value='Because the equal spaces have the same value.';
    answer.dispatchEvent(new Event('input',{bubbles:true}));
    document.getElementById('nl-reveal').click();
    assert(document.querySelector('.gd-challenge-banner').textContent.includes('Because the equal spaces'),'Custom answer reveals contextually');

    TT99Goodies.numberLine();
    const markerCount=document.querySelectorAll('[data-marker-hit]').length;
    document.querySelector('[data-nl-workflow="challenge"]').click();
    document.querySelector('[data-nl-challenge-tab="custom"]').click();
    assert(document.querySelectorAll('[data-marker-hit]').length===markerCount,'Starting a custom challenge preserves the current maths setup');
    const sourceSelect=document.getElementById('nl-custom-answer-source');
    assert(sourceSelect,'Custom challenge exposes an answer-source selector');
    assert([...sourceSelect.options].some(o=>o.value==='marker:l1:m1'),'Marker A can be used as a live answer');
    assert([...sourceSelect.options].some(o=>o.value==='relation:l1:r1'),'The A → B relationship can be used as a live answer');

    sourceSelect.value='marker:l1:m1';
    sourceSelect.dispatchEvent(new Event('change',{bubbles:true}));
    assert(document.getElementById('nl-custom-live-answer').textContent.trim()==='3','Marker A live answer starts at its current value');
    assert(document.querySelector('[data-marker-hit="m1"] .nl-answer-box'),'The linked marker value is hidden in challenge mode');

    const liveMarker=document.querySelector('[data-marker-hit="m1"]');
    const liveSvg=document.getElementById('nl-svg'),liveSvgRect=liveSvg.getBoundingClientRect(),liveMarkerRect=liveMarker.getBoundingClientRect();
    const targetSvgX=110+((6-(-10))/(20-(-10)))*(940-110);
    const targetClientX=liveSvgRect.left+(targetSvgX/1000)*liveSvgRect.width;
    pointer(liveMarker,'pointerdown',liveMarkerRect.left+liveMarkerRect.width/2,liveMarkerRect.top+liveMarkerRect.height/2,41);
    pointer(liveMarker,'pointermove',targetClientX,liveMarkerRect.top+liveMarkerRect.height/2,41);
    pointer(liveMarker,'pointerup',targetClientX,liveMarkerRect.top+liveMarkerRect.height/2,41);
    assert(document.getElementById('nl-custom-live-answer').textContent.trim()==='6','Moving a linked marker updates the custom answer immediately');

    const relationSource=document.getElementById('nl-custom-answer-source');
    relationSource.value='relation:l1:r1';
    relationSource.dispatchEvent(new Event('change',{bubbles:true}));
    assert(!document.querySelector('[data-marker-hit="m1"] .nl-answer-box'),'Switching to a relationship source reveals the marker value again');
    assert(document.querySelectorAll('.nl-answer-box').length>=1,'A linked relationship hides its calculated label');
    assert(document.getElementById('nl-custom-live-answer').textContent.trim()==='2','Difference answer uses the current A and B positions');

    TT99Goodies.numberLine();
    document.getElementById('nl-add-line').click();
    document.querySelector('[data-nl-workflow="objects"]').click();
    document.getElementById('nl-add-marker').click();
    document.querySelector('[data-nl-workflow="challenge"]').click();
    document.querySelector('[data-nl-challenge-tab="custom"]').click();
    const multiSource=document.getElementById('nl-custom-answer-source');
    assert([...multiSource.options].some(o=>o.value==='marker:l2:m1'),'Second-line marker can be selected even when marker ids repeat across lines');
    multiSource.value='marker:l2:m1';
    multiSource.dispatchEvent(new Event('change',{bubbles:true}));
    assert(document.querySelector('[data-line-id="l2"][data-marker-hit="m1"] .nl-answer-box'),'Selected second-line marker is hidden');
    assert(!document.querySelector('[data-line-id="l1"][data-marker-hit="m1"] .nl-answer-box'),'Same-id marker on the main line remains visible');

    document.querySelector('[data-nl-challenge-tab="standard"]').click();
    document.querySelector('[data-nl-challenge-cat="round"]').click();
    const rounding=document.querySelector('[data-nl-challenge-type="rounding"]');
    assert(rounding,'Rounding challenge is available');
    rounding.click();
    document.getElementById('nl-generate').click();
    assert(document.querySelector('.gd-challenge-prompt').textContent.includes('nearest'),'Rounding challenge generates a rounding prompt');

    document.querySelector('[data-nl-challenge-cat="fractions"]').click();
    const equivalent=document.querySelector('[data-nl-challenge-type="equivalent-fractions"]');
    assert(equivalent,'Equivalent-fractions multi-line challenge is available');
    equivalent.click();
    document.getElementById('nl-generate').click();
    assert(document.querySelectorAll('[data-line-hit]').length===2,'Equivalent-fractions challenge builds two aligned number lines');
    assert(document.querySelector('.gd-challenge-prompt').textContent.includes('equivalent fraction'),'Equivalent-fractions challenge has an explicit prompt');
    assert(document.querySelectorAll('.nl-answer-box').length>=1,'Equivalent-fractions challenge hides the target value with an answer box');
    const eqTop=document.querySelector('[data-marker-hit="mEqTop"]');
    const eqBottom=()=>document.querySelector('[data-marker-hit="mEqBottom"]');
    const eqSvg=document.getElementById('nl-svg'),eqRect=eqSvg.getBoundingClientRect(),topRect=eqTop.getBoundingClientRect();
    pointer(eqTop,'pointerdown',topRect.left+topRect.width/2,topRect.top+topRect.height/2,31);
    pointer(eqTop,'pointermove',eqRect.left+eqRect.width*.7,topRect.top+topRect.height/2,31);
    pointer(eqTop,'pointerup',eqRect.left+eqRect.width*.7,topRect.top+topRect.height/2,31);
    const topX=document.querySelector('[data-marker-hit="mEqTop"] circle').getAttribute('cx');
    const bottomX=eqBottom().querySelector('circle').getAttribute('cx');
    assert(topX===bottomX,'Dragging one equivalent marker keeps the aligned marker synchronized');
    document.getElementById('nl-reveal').click();
    const eqBanner=document.querySelector('.gd-challenge-banner').textContent;
    const eqBottomText=document.querySelector('[data-marker-hit="mEqBottom"]').textContent;
    const eqValue=eqBottomText.replace('?','').trim();
    assert(eqBanner.includes('Answer:'),'Equivalent-fractions reveal exposes the answer');
    assert(eqValue&&eqBanner.includes('Answer: '+eqValue),'Equivalent-fractions target and revealed answer agree, including whole-number equivalents: '+eqBottomText);

    document.querySelector('[data-nl-challenge-cat="fractions"]').click();
    const fdp=document.querySelector('[data-nl-challenge-type="fdp-equivalence"]');
    assert(fdp,'Fraction-decimal-percent challenge is available');
    fdp.click();
    document.getElementById('nl-generate').click();
    assert(document.querySelectorAll('[data-line-hit]').length===3,'FDP challenge builds three aligned number lines');
    const svgText=document.getElementById('nl-svg').textContent;
    assert(svgText.includes('Fraction')&&svgText.includes('Decimal')&&svgText.includes('Percent'),'FDP challenge labels all three representations');
    document.getElementById('nl-reveal').click();
    assert(document.querySelector('.gd-challenge-banner').textContent.includes('%'),'FDP challenge reveals a percentage answer');

    document.querySelector('[data-nl-challenge-cat="fractions"]').click();
    const fractionSequence=document.querySelector('[data-nl-challenge-type="fraction-sequence"]');
    assert(fractionSequence,'Fraction-sequence challenge is available');
    fractionSequence.click();
    document.getElementById('nl-generate').click();
    assert(document.querySelector('.gd-challenge-prompt').textContent.includes('Count on in'),'Fraction-sequence challenge asks pupils to continue equal fractional steps');
    assert(document.querySelectorAll('[data-marker-hit]').length===4,'Fraction-sequence challenge builds four sequence positions');
    assert(document.querySelectorAll('.nl-answer-box').length>=1,'Fraction-sequence challenge hides the final value');

    document.querySelector('[data-nl-challenge-cat="fractions"]').click();
    const fractionJump=document.querySelector('[data-nl-challenge-type="fraction-jump"]');
    assert(fractionJump,'Fraction-jump challenge is available');
    fractionJump.click();
    document.getElementById('nl-generate').click();
    assert(document.querySelector('.gd-challenge-prompt').textContent.includes('fraction jump'),'Fraction-jump challenge has an explicit calculation prompt');
    assert(document.querySelector('[data-marker-hit="m2"] .nl-answer-box'),'Fraction-jump challenge hides the landing value');

    document.querySelector('[data-nl-challenge-cat="fractions"]').click();
    const compareFractions=document.querySelector('[data-nl-challenge-type="compare-fractions"]');
    assert(compareFractions,'Compare-fractions challenge is available');
    compareFractions.click();
    document.getElementById('nl-generate').click();
    assert(document.querySelectorAll('[data-line-hit]').length===2,'Compare-fractions challenge builds two aligned fraction scales');
    assert(document.querySelectorAll('.nl-answer-box').length>=2,'Compare-fractions challenge hides both compared values');
    assert(document.querySelector('.gd-challenge-prompt').textContent.includes('Use <, > or ='),'Compare-fractions challenge makes the comparison task explicit');

    document.querySelector('[data-nl-challenge-cat="read"]').click();
    const zoomRead=document.querySelector('[data-nl-challenge-type="zoom-read"]');
    assert(zoomRead,'Zoom-reading challenge is available');
    zoomRead.click();
    document.getElementById('nl-generate').click();
    assert(document.querySelectorAll('[data-line-hit]').length===2,'Zoom-reading challenge builds a main line and zoom line');
    assert(document.querySelector('[data-nl-line-mode="zoom"]'),'Zoom-reading challenge uses the real zoom teaching-line mode');
    assert(document.querySelector('.nl-zoom-link'),'Zoom-reading challenge visually connects the magnified interval');

    document.querySelector('[data-nl-challenge-cat="calculate"]').click();
    const doubleLineValue=document.querySelector('[data-nl-challenge-type="double-line-value"]');
    assert(doubleLineValue,'Double-number-line missing-value challenge is available');
    doubleLineValue.click();
    document.getElementById('nl-generate').click();
    assert(document.querySelector('[data-nl-line-mode="linked"]'),'Double-number-line challenge uses the real linked teaching-line mode');
    assert(document.querySelectorAll('.nl-linked-pair-guide').length===2,'Double-number-line challenge shows two corresponding pairs');
    assert(document.querySelector('[data-line-id="l2"][data-marker-hit="mTargetBottom"] .nl-answer-box'),'Double-number-line challenge hides only the target corresponding value');

    document.querySelector('[data-nl-challenge-cat="compare"]').click();
    const order=document.querySelector('[data-nl-challenge-type="order-markers"]');
    assert(order,'Order-markers challenge is available');
    order.click();
    document.getElementById('nl-generate').click();
    assert(document.querySelectorAll('[data-marker-hit]').length===3,'Order challenge displays three movable markers');
    assert(document.querySelector('.gd-challenge-prompt').textContent.includes('smallest to largest'),'Order challenge asks for positional ordering');

    document.querySelector('[data-nl-workflow="objects"]').click();
    assert(document.querySelector('[data-nl-panel="objects"]'),'Objects workflow replaces the challenge controls');
    assert(document.querySelector('[data-nl-object-tab="markers"]'),'Objects workflow has marker and relationship subtabs');
    document.querySelector('[data-nl-workflow="export"]').click();
    assert(document.querySelector('[data-nl-export-mode="challenge"]'),'Active challenge offers Challenge card export');
    assert(document.getElementById('nl-response-lines'),'Challenge export offers answer-space control');
    const card=TT99Goodies.exportTools.composeChallengeCardSvg(document.getElementById('nl-svg'),{
      title:'Example challenge',
      prompt:'Work out the missing value.',
      responseLabel:'Answer',
      responseLines:2
    });
    assert(card&&card.tagName.toLowerCase()==='svg','Challenge-card composer returns SVG');
    assert(card.textContent.includes('Example challenge')&&card.textContent.includes('Work out the missing value.'),'Challenge-card export includes title and prompt');
    assert(card.querySelectorAll('rect').length>=2,'Challenge-card export includes a response box');

    document.querySelectorAll('.nl-workflow-tab,.nl-export-mode button,.nl-export-grid .gd-btn').forEach(el=>{
      assert(el.scrollWidth<=el.clientWidth+3,'Number Line control text stays inside its container: '+el.textContent.trim());
    });
  }

  function testMathsCanvas(){
    assert(window.TT99Goodies&&TT99Goodies.mathsCanvas,'Maths Canvas is registered');
    assert(TT99Goodies.interaction&&TT99Goodies.interaction.mount,'Interaction controller is registered');
    TT99Goodies.mathsCanvas();

    const add=document.querySelector('[data-mc-add="1"]');
    assert(add,'Number tile palette exists');
    add.click();
    assert(document.querySelectorAll('[data-gd-object]').length===1,'Adding a tile creates one canvas object');

    let tile=document.querySelector('[data-gd-object]');
    const r=tile.getBoundingClientRect();
    pointer(tile,'pointerdown',r.left+10,r.top+10,1);
    pointer(tile,'pointerup',r.left+10,r.top+10,1);
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
  }
  function testPlaceValue(){
    TT99Goodies.interaction.clear();
    assert(TT99Goodies.placeValue,'Place Value is registered');
    TT99Goodies.placeValue();

    assert(document.querySelectorAll('.gd-pv-column').length===7,'Place Value has seven semantic columns');
    assert(numberText('#pv-total')===1234.5,'Default counters represent 1,234.5');
    assert(document.querySelectorAll('[data-gd-object]').length===15,'Default number is decomposed into 15 counters');

    const addOne=document.querySelector('[data-pv-add="4"]');
    assert(addOne,'Ones column has direct add control');
    addOne.click();
    assert(numberText('#pv-total')===1235.5,'Adding one ones-counter increases total by 1');

    let token=document.querySelector('[data-gd-object].is-selected');
    assert(token&&token.dataset.pvPlace==='4','New counter is selected in ones column');
    const tens=document.querySelector('[data-pv-column="3"]');
    const tr=token.getBoundingClientRect(),cr=tens.getBoundingClientRect();
    const startX=tr.left+tr.width/2,startY=tr.top+tr.height/2;
    const targetX=cr.left+cr.width/2,targetY=Math.max(cr.top+100,startY);
    pointer(token,'pointerdown',startX,startY,7);
    pointer(token,'pointermove',targetX,targetY,7);
    pointer(token,'pointerup',targetX,targetY,7);

    token=document.querySelector('[data-gd-object].is-selected');
    assert(token&&token.dataset.pvPlace==='3','Dragging a counter changes its semantic place');
    assert(numberText('#pv-total')===1244.5,'Moving one from ones to tens changes total by +9');

    const input=document.getElementById('pv-value');
    input.value='19';
    document.getElementById('pv-build').click();
    assert(numberText('#pv-total')===19,'Quick setup rebuilds the board from a number');
    document.querySelector('[data-pv-add="4"]').click();
    assert(numberText('#pv-total')===20,'Adding one to 19 gives total 20 before regrouping');
    assert(document.querySelector('[data-pv-count="4"]').textContent==='10','Non-standard representation keeps ten ones visible');
    const regroup=document.getElementById('pv-regroup');
    assert(regroup&&!regroup.disabled,'Regroup is available for a non-standard representation');
    regroup.click();
    assert(numberText('#pv-total')===20,'Regrouping preserves the represented total');
    assert(document.querySelector('[data-pv-count="3"]').textContent==='2','Regrouping converts to two tens');
    assert(document.querySelector('[data-pv-count="4"]').textContent==='0','Regrouping clears the ten ones');

    document.querySelector('[data-pv-workflow="export"]').click();
    assert(document.getElementById('pv-copy-image')&&document.getElementById('pv-png')&&document.getElementById('pv-svg-download')&&document.getElementById('pv-print'),'Place Value export exposes copy, PNG, SVG and Print/PDF actions');
    let pvCapturedSvg=null,pvCapturedName='';
    const pvOldDownloadSvg=TT99Goodies.exportTools.downloadSvg;
    TT99Goodies.exportTools.downloadSvg=(svg,name)=>{pvCapturedSvg=svg.cloneNode(true);pvCapturedName=name};
    document.getElementById('pv-svg-download').click();
    assert(pvCapturedSvg&&pvCapturedSvg.dataset.pvExport==='board','Place Value board-only export is a deterministic SVG board');
    assert(pvCapturedSvg.querySelectorAll('text').length>=16,'Place Value SVG export carries semantic column/readout text');
    assert(pvCapturedName.includes('place-value-board'),'Place Value board export has a reusable filename');
    TT99Goodies.exportTools.downloadSvg=pvOldDownloadSvg;

    document.querySelector('[data-pv-workflow="challenge"]').click();
    assert(document.querySelector('[data-pv-challenge-tab="standard"]'),'Place Value uses the shared Standard / Custom challenge language');
    assert(document.querySelector('[data-pv-challenge-type="read-number"]'),'Place Value read-number challenge is available');
    document.querySelector('[data-pv-challenge-type="read-number"]').click();
    document.getElementById('pv-generate').click();
    assert(document.querySelector('.gd-challenge-banner'),'Generated Place Value challenge appears above the board');
    assert(document.getElementById('pv-total').textContent.trim()==='?','Read-number challenge hides the represented total');
    assert(document.getElementById('pv-expanded').textContent.includes('Hidden'),'Read-number challenge also hides the expanded representation');
    assert(document.querySelector('[data-challenge-action="another"]'),'Place Value standard challenge exposes Another like this');
    document.querySelector('[data-board-action="reveal"]').click();
    assert(document.querySelector('.gd-challenge-banner').textContent.includes('Answer:'),'Place Value challenge reveals its answer contextually');
    assert(document.getElementById('pv-total').textContent.trim()!=='?','Reveal restores the live represented total');

    document.querySelector('[data-pv-workflow="export"]').click();
    assert(document.querySelector('[data-pv-export-mode="challenge"]'),'Active Place Value challenge offers Challenge card export');
    let pvChallengeSvg=null;
    const pvOldChallengeDownload=TT99Goodies.exportTools.downloadSvg;
    TT99Goodies.exportTools.downloadSvg=(svg)=>{pvChallengeSvg=svg.cloneNode(true)};
    document.getElementById('pv-svg-download').click();
    TT99Goodies.exportTools.downloadSvg=pvOldChallengeDownload;
    assert(pvChallengeSvg&&pvChallengeSvg.querySelector('[data-pv-export-board="1"]'),'Place Value challenge card embeds the vector board');
    assert(!pvChallengeSvg.textContent.includes('Answer:'),'Place Value pupil challenge export never includes a revealed answer label');
    const pvBoardTexts=[...pvChallengeSvg.querySelectorAll('text')].map(x=>x.textContent.trim());
    const pvNumberLabel=pvBoardTexts.indexOf('Number represented');
    assert(pvNumberLabel>=0&&pvBoardTexts[pvNumberLabel+1]==='?','Place Value pupil export re-hides the represented total after teacher reveal');
    assert(pvChallengeSvg.textContent.includes('What number is represented'),'Place Value challenge-card export includes the pupil prompt');

    document.querySelector('[data-pv-workflow="challenge"]').click();
    document.querySelector('[data-pv-challenge-tab="custom"]').click();
    const pvSource=document.getElementById('pv-custom-answer-source');
    assert(pvSource,'Place Value custom challenge exposes live answer sources');
    assert([...pvSource.options].some(o=>o.value==='total'),'Place Value custom answer can bind to the represented total');
    assert([...pvSource.options].some(o=>o.value==='value:3'),'Place Value custom answer can bind to a column value');
    pvSource.value='total';
    pvSource.dispatchEvent(new Event('change',{bubbles:true}));
    assert(document.getElementById('pv-total').textContent.trim()==='?','Binding a custom answer to the total hides that pupil-facing value');
    const liveBefore=document.getElementById('pv-custom-live-answer').textContent.trim();
    document.querySelector('[data-pv-add="4"]').click();
    const liveAfter=document.getElementById('pv-custom-live-answer').textContent.trim();
    assert(liveAfter!==liveBefore,'Place Value live custom answer updates when the board changes');

    document.getElementById('pv-clear-challenge').click();
    assert(numberText('#pv-total')===20,'Ending the generated/custom Place Value challenge restores the teacher setup');

    document.querySelector('[data-pv-workflow="challenge"]').click();
    document.querySelector('[data-pv-challenge-cat="build"]').click();
    assert(document.querySelector('[data-pv-challenge-type="build-number"]'),'Build-number challenge is available');
    assert(document.querySelector('[data-pv-challenge-type="non-standard"]'),'Non-standard regrouping challenge is available');
    document.querySelector('[data-pv-challenge-cat="reason"]').click();
    assert(document.querySelector('[data-pv-challenge-type="zero-placeholder"]'),'Zero-placeholder diagnostic challenge is available');

    document.querySelector('[data-pv-workflow="setup"]').click();
    const canvas=document.getElementById('pv-canvas');
    assert(canvas&&getComputedStyle(canvas).touchAction==='pan-y','Place Value empty board preserves vertical touch scrolling');
  }
  function testFractions(){
    TT99Goodies.interaction.clear();
    assert(TT99Goodies.fractionWall,'Fraction Wall is registered');
    TT99Goodies.fractionWall();

    assert(document.querySelectorAll('[data-fw-row]').length===12,'Fraction Wall has denominators 1 to 12');
    assert(document.querySelectorAll('[data-fw-row="2"] .gd-fr-cell.is-on').length===1,'Default focus is one half');
    assert(document.querySelectorAll('[data-fw-row="4"] .gd-fr-cell.is-equivalent').length===2,'One half automatically highlights two quarters');
    assert(document.querySelectorAll('[data-fw-row="6"] .gd-fr-cell.is-equivalent').length===3,'One half automatically highlights three sixths');

    const threeQuarters=document.querySelector('[data-fw-wall="4:2"]');
    assert(threeQuarters,'Three-quarters endpoint exists on the wall');
    threeQuarters.click();
    assert(document.querySelector('.gd-fr-focus strong').textContent.trim()==='3/4','Wall tap selects three quarters');
    assert(document.querySelectorAll('[data-fw-row="8"] .gd-fr-cell.is-equivalent').length===6,'Three quarters automatically highlights six eighths');
    assert(document.querySelectorAll('[data-fw-row="12"] .gd-fr-cell.is-equivalent').length===9,'Three quarters automatically highlights nine twelfths');

    document.querySelector('[data-fw-use="a"]').click();
    assert(document.getElementById('fw-an').value==='3'&&document.getElementById('fw-ad').value==='4','Selected wall fraction can be sent directly to A');

    const bTwoThirds=document.querySelector('[data-fw-set="b:2"]');
    assert(bTwoThirds,'B comparison bar exposes direct numerator segments');
    bTwoThirds.click();
    assert(document.getElementById('fw-bn').value==='2'&&document.getElementById('fw-bd').value==='3','Tapping B bar changes its numerator to two thirds');
    assert(document.querySelector('.gd-fr-equation').textContent.replace(/\s+/g,'').includes('3/4>2/3'),'Comparison updates automatically after direct edits');

    const an=document.getElementById('fw-an'),ad=document.getElementById('fw-ad');
    an.value='7';ad.value='4';
    an.dispatchEvent(new Event('input',{bubbles:true}));
    assert(an.value==='7'&&ad.value==='4','Quick setup preserves improper fractions');
    assert(document.querySelectorAll('[data-fw-direct="a"] .gd-fr-bar').length===2,'Improper fraction renders across multiple wholes');
    assert(document.querySelectorAll('[data-fw-direct="a"] .gd-fr-piece.is-fill').length===7,'Improper fraction keeps all seven quarters visible');

    document.querySelector('[data-fw-mode="workbench"]').click();
    assert(document.getElementById('fw-strip-canvas'),'Fractions exposes a direct strip workbench');
    assert(document.querySelectorAll('#fw-strip-canvas [data-gd-object]').length===2,'Fraction workbench starts with two comparison strips');
    assert(getComputedStyle(document.getElementById('fw-strip-canvas')).touchAction==='pan-y','Fraction workbench preserves vertical touch scrolling outside strips');

    let strip=document.querySelector('#fw-strip-canvas [data-gd-object]');
    let sr=strip.getBoundingClientRect();
    pointer(strip,'pointerdown',sr.left+20,sr.top+20,51);
    pointer(strip,'pointerup',sr.left+20,sr.top+20,51);
    assert(strip.classList.contains('is-selected'),'Fraction strip can be selected directly');

    document.querySelector('[data-gd-action="duplicate"]').click();
    assert(document.querySelectorAll('#fw-strip-canvas [data-gd-object]').length===3,'Duplicate creates another fraction strip');
    assert(document.querySelector('#fw-strip-canvas [data-gd-object].is-selected .gd-fr-strip-head strong').textContent.trim()==='1/2','Duplicated strip remains selected');

    document.querySelector('[data-gd-action="split"]').click();
    assert(document.querySelector('#fw-strip-canvas [data-gd-object].is-selected .gd-fr-strip-head strong').textContent.trim()==='2/4','Split partitions a strip into twice as many equal pieces');
    assert(document.querySelectorAll('#fw-strip-canvas [data-gd-object].is-equivalent').length>=1,'Equivalent strips highlight automatically after partitioning');

    document.querySelector('[data-gd-action="simplify"]').click();
    assert(document.querySelector('#fw-strip-canvas [data-gd-object].is-selected .gd-fr-strip-head strong').textContent.trim()==='1/2','Simplify returns an equivalent strip to lowest terms');

    document.getElementById('fw-align').click();
    const aligned=[...document.querySelectorAll('#fw-strip-canvas [data-gd-object]')].map(x=>x.style.left);
    assert(aligned.every(x=>x==='24px'),'Align strips gives all comparison strips a common starting point');

    strip=document.querySelector('#fw-strip-canvas [data-gd-object].is-selected');
    sr=strip.getBoundingClientRect();
    pointer(strip,'pointerdown',sr.left+20,sr.top+20,52);
    pointer(strip,'pointermove',sr.left+80,sr.top+20,52);
    pointer(strip,'pointerup',sr.left+80,sr.top+20,52);
    strip=document.querySelector('#fw-strip-canvas [data-gd-object].is-selected');
    assert(parseFloat(strip.style.left)>24,'Selected fraction strip can be dragged directly');

    document.querySelector('[data-fw-mode="wall"]').click();
    assert(document.querySelectorAll('[data-fw-row]').length===12,'Switching back restores the full fraction wall without losing the existing tool');

    document.querySelector('[data-fw-workflow="export"]').click();
    assert(document.getElementById('fw-copy-image')&&document.getElementById('fw-png')&&document.getElementById('fw-svg-download')&&document.getElementById('fw-print'),'Fractions export exposes copy, PNG, SVG and Print/PDF actions');
    let fwCapturedSvg=null,fwCapturedName='';
    const fwOldDownloadSvg=TT99Goodies.exportTools.downloadSvg;
    TT99Goodies.exportTools.downloadSvg=(svg,name)=>{fwCapturedSvg=svg.cloneNode(true);fwCapturedName=name};
    document.getElementById('fw-svg-download').click();
    TT99Goodies.exportTools.downloadSvg=fwOldDownloadSvg;
    assert(fwCapturedSvg&&fwCapturedSvg.dataset.fwExport==='wall','Fraction Wall exports as a deterministic SVG model');
    assert(fwCapturedSvg.querySelectorAll('rect').length>30,'Fraction Wall SVG keeps the segmented mathematical structure');
    assert(fwCapturedSvg.textContent.includes('Fraction wall'),'Fraction Wall SVG includes its semantic heading');
    assert(fwCapturedName.includes('fraction-wall'),'Fraction Wall export has a reusable filename');

    document.querySelector('[data-fw-workflow="challenge"]').click();
    assert(document.querySelector('[data-fw-challenge-tab="standard"]'),'Fractions uses the shared Standard / Custom challenge language');
    assert(document.querySelector('[data-fw-challenge-type="identify-strip"]'),'Read-a-strip challenge is available');
    document.querySelector('[data-fw-challenge-type="identify-strip"]').click();
    document.getElementById('fw-generate').click();
    assert(document.querySelector('.gd-challenge-banner'),'Generated Fractions challenge appears above the representation');
    assert(document.getElementById('fw-strip-canvas'),'Read-a-strip challenge switches to the strip representation');
    assert(document.querySelector('#fw-strip-canvas [data-gd-object] .gd-fr-strip-head strong').textContent.trim()==='?','Read-a-strip challenge hides the target fraction label');
    assert(document.querySelector('[data-challenge-action="another"]'),'Fractions standard challenge exposes Another like this');
    document.querySelector('[data-board-action="reveal"]').click();
    assert(document.querySelector('.gd-challenge-banner').textContent.includes('Answer:'),'Fractions challenge reveals its answer contextually');
    assert(document.querySelector('#fw-strip-canvas [data-gd-object] .gd-fr-strip-head strong').textContent.trim()!=='?','Reveal restores the hidden strip fraction');

    document.querySelector('[data-fw-workflow="export"]').click();
    assert(document.querySelector('[data-fw-export-mode="challenge"]'),'Active Fractions challenge offers Challenge card export');
    let fwChallengeSvg=null;
    const fwOldChallengeDownload=TT99Goodies.exportTools.downloadSvg;
    TT99Goodies.exportTools.downloadSvg=(svg)=>{fwChallengeSvg=svg.cloneNode(true)};
    document.getElementById('fw-svg-download').click();
    TT99Goodies.exportTools.downloadSvg=fwOldChallengeDownload;
    assert(fwChallengeSvg&&fwChallengeSvg.querySelector('[data-fw-export-strip]'),'Fractions challenge card embeds the vector strip model');
    assert(!fwChallengeSvg.textContent.includes('Answer:'),'Fractions pupil challenge export never includes a revealed answer label');
    assert([...fwChallengeSvg.querySelectorAll('text')].some(x=>x.textContent.trim()==='?'),'Fractions pupil export re-hides the target strip after teacher reveal');
    assert(fwChallengeSvg.textContent.includes('What fraction is represented'),'Fractions challenge-card export includes the pupil prompt');

    document.querySelector('[data-fw-workflow="challenge"]').click();
    document.querySelector('[data-challenge-action="another"]').click();
    assert(document.querySelector('#fw-strip-canvas [data-gd-object] .gd-fr-strip-head strong').textContent.trim()==='?','Another like this creates the next hidden strip challenge directly');

    document.querySelector('[data-fw-workflow="challenge"]').click();
    document.querySelector('[data-fw-challenge-cat="read"]').click();
    const equivalentChallenge=document.querySelector('[data-fw-challenge-type="equivalent-strip"]');
    assert(equivalentChallenge,'Equivalent-strip challenge is available');
    equivalentChallenge.click();
    document.getElementById('fw-generate').click();
    assert(document.querySelectorAll('#fw-strip-canvas [data-gd-object]').length===2,'Equivalent challenge creates two aligned strips');
    assert(document.querySelectorAll('#fw-strip-canvas [data-gd-object]')[1].querySelector('.gd-fr-strip-head strong').textContent.trim()==='?','Equivalent challenge hides the target equivalent fraction');

    document.querySelector('[data-fw-workflow="challenge"]').click();
    document.querySelector('[data-fw-challenge-tab="custom"]').click();
    const fwSource=document.getElementById('fw-custom-answer-source');
    assert(fwSource,'Fractions custom challenge exposes live answer sources');
    assert([...fwSource.options].some(o=>o.value==='strip:1:fraction'),'Fractions custom answer can bind to a live strip fraction');
    assert([...fwSource.options].some(o=>o.value==='strip:1:simplified'),'Fractions custom answer can bind to a simplified strip value');
    assert([...fwSource.options].some(o=>o.value==='strip:1:mixed'),'Fractions custom answer can bind to a mixed-number value');
    fwSource.value='strip:1:fraction';
    fwSource.dispatchEvent(new Event('change',{bubbles:true}));
    assert(document.querySelector('#fw-strip-canvas [data-gd-object="1"] .gd-fr-strip-head strong').textContent.trim()==='?','Binding a custom answer hides that strip label');
    const fwLiveBefore=document.getElementById('fw-custom-live-answer').textContent.trim();
    const stripOnePieces=[...document.querySelectorAll('[data-fr-strip-piece^="1:"]')];
    assert(stripOnePieces.length>=2,'Bound strip exposes editable fraction segments');
    stripOnePieces[stripOnePieces.length-1].click();
    const fwLiveAfter=document.getElementById('fw-custom-live-answer').textContent.trim();
    assert(fwLiveAfter!==fwLiveBefore,'Editing a bound strip updates the custom answer immediately');

    document.getElementById('fw-clear-challenge').click();
    assert(document.querySelectorAll('[data-fw-row]').length===12,'Ending a Fractions challenge restores the teacher wall setup');
    assert(document.querySelector('.gd-fr-equation').textContent.replace(/\s+/g,'').includes('7/4>2/3'),'Fractions challenge restoration recovers the previous comparison values');

    document.querySelector('[data-fw-workflow="challenge"]').click();
    document.querySelector('[data-fw-challenge-cat="compare"]').click();
    assert(document.querySelector('[data-fw-challenge-type="compare-strips"]'),'Visual fraction comparison challenge is available');
    document.querySelector('[data-fw-challenge-cat="convert"]').click();
    assert(document.querySelector('[data-fw-challenge-type="simplify-strip"]'),'Simplify-fraction challenge is available');
    assert(document.querySelector('[data-fw-challenge-type="mixed-improper"]'),'Improper-to-mixed challenge is available');
    document.querySelector('[data-fw-challenge-cat="reason"]').click();
    assert(document.querySelector('[data-fw-challenge-type="denominator-misconception"]'),'Denominator misconception challenge is available');
  }
  function testGeoboard(){
    TT99Goodies.interaction.clear();
    assert(TT99Goodies.geoboard,'Geoboard is registered');
    TT99Goodies.geoboard();

    function clickPeg(pos){
      const peg=document.querySelector('[data-gp="'+pos+'"]');
      assert(peg,'Geoboard peg '+pos+' exists');
      peg.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    }

    clickPeg('0,0');
    clickPeg('4,0');
    clickPeg('4,3');
    assert(document.querySelectorAll('[data-ge-vertex]').length===3,'Three peg taps create three vertices');
    let readout=document.getElementById('ge-readout').textContent;
    assert(readout.includes('Perimeter ≈ 12.00 units'),'3-4-5 triangle perimeter is 12');
    assert(readout.includes('Area = 6.00 square units'),'3-4-5 triangle area is 6');

    let vertex=document.querySelector('[data-ge-vertex="1"]');
    const target=document.querySelector('[data-gp="3,0"]');
    const vr=vertex.getBoundingClientRect(),tr=target.getBoundingClientRect();
    const sx=vr.left+vr.width/2,sy=vr.top+vr.height/2;
    const tx=tr.left+tr.width/2,ty=tr.top+tr.height/2;
    pointer(vertex,'pointerdown',sx,sy,21);
    pointer(vertex,'pointermove',tx,ty,21);
    pointer(vertex,'pointerup',tx,ty,21);

    vertex=document.querySelector('[data-ge-vertex="1"]');
    assert(vertex&&vertex.dataset.gePos==='3,0','Dragging vertex B snaps it to the new peg');
    readout=document.getElementById('ge-readout').textContent;
    assert(readout.includes('Perimeter ≈ 11.16 units'),'Moved triangle perimeter updates immediately');
    assert(readout.includes('Area = 4.50 square units'),'Moved triangle area updates immediately');

    const del=document.querySelector('[data-ge-delete]');
    assert(del&&!del.hidden,'Selected vertex exposes direct delete');
    del.click();
    assert(document.querySelectorAll('[data-ge-vertex]').length===2,'Delete removes the selected vertex only');
    readout=document.getElementById('ge-readout').textContent;
    assert(readout.includes('Length ≈ 5.00 units'),'Two remaining vertices report segment length rather than a fake perimeter');

    const undo=document.getElementById('ge-undo');
    assert(undo&&!undo.disabled,'Geoboard Undo is available after deletion');
    undo.click();
    assert(document.querySelectorAll('[data-ge-vertex]').length===3,'Undo restores the deleted vertex');
    assert(document.getElementById('ge-readout').textContent.includes('Area = 4.50 square units'),'Undo restores the moved triangle geometry');

    document.querySelector('[data-ge-workflow="export"]').click();
    assert(document.getElementById('ge-copy-image')&&document.getElementById('ge-png')&&document.getElementById('ge-svg-download')&&document.getElementById('ge-print'),'Geoboard export exposes copy, PNG, SVG and Print/PDF actions');
    let geCapturedSvg=null,geCapturedName='';
    const geOldDownloadSvg=TT99Goodies.exportTools.downloadSvg;
    TT99Goodies.exportTools.downloadSvg=(svg,name)=>{geCapturedSvg=svg.cloneNode(true);geCapturedName=name};
    document.getElementById('ge-svg-download').click();
    TT99Goodies.exportTools.downloadSvg=geOldDownloadSvg;
    assert(geCapturedSvg&&geCapturedSvg.dataset.geExport==='board','Geoboard board-only export is a deterministic SVG board');
    assert(geCapturedSvg.querySelectorAll('circle').length>=52,'Geoboard SVG export preserves the peg grid and vertices');
    assert(geCapturedSvg.querySelector('[data-ge-export-shape]'),'Geoboard SVG export carries the drawn geometry');
    assert(geCapturedSvg.textContent.includes('Area = 4.50 square units'),'Geoboard board-only export includes visible measurements');
    assert(geCapturedName.includes('geoboard-shape'),'Geoboard board export has a reusable filename');

    document.querySelector('[data-ge-workflow="challenge"]').click();
    assert(document.querySelector('[data-ge-challenge-tab="standard"]')&&document.querySelector('[data-ge-challenge-tab="custom"]'),'Geoboard uses the shared Standard / Custom challenge tabs');
    assert(document.querySelector('[data-ge-challenge-type="find-length"]'),'Geoboard length challenge is available');
    assert(document.querySelector('[data-ge-challenge-type="find-perimeter"]'),'Geoboard perimeter challenge is available');
    assert(document.querySelector('[data-ge-challenge-type="find-area"]'),'Geoboard area challenge is available');
    document.querySelector('[data-ge-challenge-type="find-length"]').click();
    document.getElementById('ge-generate').click();
    assert(document.querySelector('.gd-challenge-banner'),'Generated Geoboard challenge appears above the board');
    assert(document.querySelectorAll('[data-ge-vertex]').length===2,'Length challenge creates a two-point segment');
    assert(document.getElementById('ge-readout').textContent.includes('Length ≈ ?'),'Length challenge hides the target measurement');
    assert(document.querySelector('[data-challenge-action="another"]'),'Geoboard standard challenge exposes Another like this');
    document.querySelector('[data-board-action="reveal"]').click();
    assert(document.querySelector('.gd-challenge-banner').textContent.includes('Answer:'),'Geoboard challenge reveals its answer contextually');
    assert(!document.getElementById('ge-readout').textContent.includes('Length ≈ ?'),'Reveal restores the live length readout');

    document.querySelector('[data-ge-workflow="export"]').click();
    assert(document.querySelector('[data-ge-export-mode="challenge"]'),'Active Geoboard challenge offers Challenge card export');
    let geChallengeSvg=null;
    const geOldChallengeDownload=TT99Goodies.exportTools.downloadSvg;
    TT99Goodies.exportTools.downloadSvg=(svg)=>{geChallengeSvg=svg.cloneNode(true)};
    document.getElementById('ge-svg-download').click();
    TT99Goodies.exportTools.downloadSvg=geOldChallengeDownload;
    assert(geChallengeSvg&&geChallengeSvg.querySelector('[data-ge-export-board]'),'Geoboard challenge card embeds the vector board');
    assert(!geChallengeSvg.textContent.includes('Answer:'),'Geoboard pupil challenge export never includes a revealed answer label');
    assert(geChallengeSvg.textContent.includes('Length ≈ ?'),'Geoboard pupil export re-hides the target length after teacher reveal');
    assert(geChallengeSvg.textContent.includes('What is the length of segment AB?'),'Geoboard challenge-card export includes the pupil prompt');

    document.querySelector('[data-ge-workflow="challenge"]').click();
    document.querySelector('[data-ge-challenge-type="find-area"]').click();
    document.getElementById('ge-generate').click();
    assert(document.querySelectorAll('[data-ge-vertex]').length>=3,'Area challenge creates a polygon');
    assert(document.getElementById('ge-readout').textContent.includes('Area = ?'),'Area challenge hides the area while preserving the shape');

    document.querySelector('[data-ge-workflow="challenge"]').click();
    document.querySelector('[data-ge-challenge-tab="custom"]').click();
    const geSource=document.getElementById('ge-custom-answer-source');
    assert(geSource,'Geoboard custom challenge exposes live answer sources');
    for(const source of ['length','perimeter','area','perimeter-area','vertices']){
      assert([...geSource.options].some(o=>o.value===source),'Geoboard custom answer source '+source+' is available');
    }
    geSource.value='area';
    geSource.dispatchEvent(new Event('change',{bubbles:true}));
    assert(document.getElementById('ge-readout').textContent.includes('Area = ?'),'Binding a custom answer to area hides the pupil-facing area');
    const geLiveBefore=document.getElementById('ge-custom-live-answer').textContent.trim();
    const geVertices=[...document.querySelectorAll('[data-ge-vertex]')].map(v=>{
      const [x,y]=v.dataset.gePos.split(',').map(Number);return{x,y};
    });
    const polygonArea=pts=>Math.abs(pts.reduce((sum,p,i)=>{
      const n=pts[(i+1)%pts.length];return sum+p.x*n.y-n.x*p.y;
    },0))/2;
    const geAreaBefore=polygonArea(geVertices),occupied=new Set(geVertices.map(p=>p.x+','+p.y));
    let geMove=null;
    for(let i=0;i<geVertices.length&&!geMove;i++){
      for(const peg of [...document.querySelectorAll('[data-gp]')]){
        if(occupied.has(peg.dataset.gp))continue;
        const [x,y]=peg.dataset.gp.split(',').map(Number),next=geVertices.map(p=>({...p}));
        next[i]={x,y};
        if(Math.abs(polygonArea(next)-geAreaBefore)>1e-9){geMove={i,peg};break}
      }
    }
    assert(geMove,'Geoboard has a deterministic vertex move that changes area');
    let geVertex=document.querySelector('[data-ge-vertex="'+geMove.i+'"]');
    const geVr=geVertex.getBoundingClientRect(),gePr=geMove.peg.getBoundingClientRect();
    pointer(geVertex,'pointerdown',geVr.left+geVr.width/2,geVr.top+geVr.height/2,71);
    pointer(geVertex,'pointermove',gePr.left+gePr.width/2,gePr.top+gePr.height/2,71);
    pointer(geVertex,'pointerup',gePr.left+gePr.width/2,gePr.top+gePr.height/2,71);
    const geLiveAfter=document.getElementById('ge-custom-live-answer').textContent.trim();
    assert(geLiveAfter!==geLiveBefore,'Geoboard live custom area answer updates when the polygon changes');

    document.getElementById('ge-clear-challenge').click();
    assert(document.querySelectorAll('[data-ge-vertex]').length===3,'Ending a Geoboard challenge restores the teacher shape');
    assert(document.getElementById('ge-readout').textContent.includes('Area = 4.50 square units'),'Ending a Geoboard challenge restores the original teacher measurements');

    document.querySelector('[data-ge-workflow="challenge"]').click();
    document.querySelector('[data-ge-challenge-cat="construct"]').click();
    assert(document.querySelector('[data-ge-challenge-type="build-area"]'),'Geoboard build-a-target-area challenge is available');
    document.querySelector('[data-ge-challenge-cat="reason"]').click();
    assert(document.querySelector('[data-ge-challenge-type="area-perimeter-units"]'),'Geoboard units misconception challenge is available');
  }
  function testCoordinates(){
    TT99Goodies.interaction.clear();
    assert(TT99Goodies.coordinateTool,'Coordinate tool is registered');
    TT99Goodies.coordinateTool();

    function coordClient(x,y){
      const svg=document.getElementById('co-svg');
      const min=Number(svg.dataset.coMin),max=Number(svg.dataset.coMax),W=600,pad=42;
      const step=(W-2*pad)/(max-min),r=svg.getBoundingClientRect();
      const px=pad+(x-min)*step,py=pad+(max-y)*step;
      return{svg,x:r.left+px/W*r.width,y:r.top+py/W*r.height};
    }
    function clickCoord(x,y){
      const p=coordClient(x,y);
      p.svg.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:p.x,clientY:p.y}));
    }

    clickCoord(2,3);
    clickCoord(8,4);
    assert(document.querySelectorAll('[data-co-point]').length===2,'Coordinate grid plots two points directly');
    assert(document.getElementById('co-readout').textContent.includes('(2, 3)'),'Coordinate readout includes the first point');

    let point=document.querySelector('[data-co-point="0"]');
    const start=point.getBoundingClientRect(),target=coordClient(4,5);
    pointer(point,'pointerdown',start.left+start.width/2,start.top+start.height/2,31);
    pointer(point,'pointermove',target.x,target.y,31);
    pointer(point,'pointerup',target.x,target.y,31);

    point=document.querySelector('[data-co-point="0"]');
    assert(point&&point.dataset.coPos==='4,5','Dragging a coordinate point snaps it to the new intersection');
    assert(document.getElementById('co-readout').textContent.includes('(4, 5)'),'Coordinate readout updates after drag');

    const del=document.querySelector('[data-co-delete]');
    assert(del&&!del.hidden,'Selected coordinate point exposes direct delete');
    del.click();
    assert(document.querySelectorAll('[data-co-point]').length===1,'Delete removes only the selected coordinate point');

    const undo=document.getElementById('co-undo');
    assert(undo&&!undo.disabled,'Coordinate Undo is available after deletion');
    undo.click();
    assert(document.querySelectorAll('[data-co-point]').length===2,'Coordinate Undo restores the deleted point');
    assert(document.querySelector('[data-co-pos="4,5"]'),'Coordinate Undo restores the moved point position');

    const four=document.getElementById('co-four');
    four.checked=true;
    four.dispatchEvent(new Event('change',{bubbles:true}));
    clickCoord(-3,-2);
    assert(document.querySelectorAll('[data-co-point]').length===3,'Four-quadrant grid accepts a negative point');

    four.checked=false;
    four.dispatchEvent(new Event('change',{bubbles:true}));
    assert(document.querySelectorAll('[data-co-point]').length===2,'Negative point is hidden in first-quadrant view');
    assert(document.getElementById('co-readout').textContent.includes('1 outside this grid is hidden'),'Grid switch reports preserved hidden point');

    four.checked=true;
    four.dispatchEvent(new Event('change',{bubbles:true}));
    assert(document.querySelectorAll('[data-co-point]').length===3,'Negative point reappears when four quadrants return');
    assert(document.querySelector('[data-co-pos="-3,-2"]'),'Quadrant switching preserves the negative point data');

    document.querySelector('[data-co-workflow="export"]').click();
    assert(document.getElementById('co-copy-image')&&document.getElementById('co-png')&&document.getElementById('co-svg-download')&&document.getElementById('co-print'),'Coordinates export exposes copy, PNG, SVG and Print/PDF actions');
    let coCapturedSvg=null,coCapturedName='';
    const coOldDownloadSvg=TT99Goodies.exportTools.downloadSvg;
    TT99Goodies.exportTools.downloadSvg=(svg,name)=>{coCapturedSvg=svg.cloneNode(true);coCapturedName=name};
    document.getElementById('co-svg-download').click();
    TT99Goodies.exportTools.downloadSvg=coOldDownloadSvg;
    assert(coCapturedSvg&&coCapturedSvg.dataset.coExport==='grid','Coordinates board-only export is a deterministic SVG grid');
    assert(coCapturedSvg.querySelectorAll('[data-co-export-point]').length===3,'Coordinates SVG export preserves all visible four-quadrant points');
    assert(coCapturedSvg.textContent.includes('(-3, -2)'),'Coordinates SVG export preserves negative coordinates');
    assert(coCapturedName.includes('four-quadrants'),'Coordinates four-quadrant export has a reusable filename');

    document.querySelector('[data-co-workflow="challenge"]').click();
    assert(document.querySelector('[data-co-challenge-tab="standard"]')&&document.querySelector('[data-co-challenge-tab="custom"]'),'Coordinates uses the shared Standard / Custom challenge tabs');
    assert(document.querySelector('[data-co-challenge-type="read-coordinate"]'),'Read-coordinate challenge is available');
    assert(document.querySelector('[data-co-challenge-type="plot-coordinate"]'),'Plot-coordinate challenge is available');
    assert(document.querySelector('[data-co-challenge-type="missing-coordinate"]'),'Missing-coordinate challenge is available');

    document.querySelector('[data-co-challenge-type="read-coordinate"]').click();
    document.getElementById('co-generate').click();
    assert(document.querySelector('.gd-challenge-banner'),'Generated Coordinates challenge appears above the grid');
    let coPoint=document.querySelector('[data-co-point="0"]');
    assert(coPoint&&document.querySelector('[data-co-label="0"]').textContent.trim()==='A','Read-coordinate challenge hides the coordinate behind point A');
    assert(!coPoint.getAttribute('aria-label').includes('('),'Hidden coordinate does not leak through the point accessibility label');
    assert(document.getElementById('co-readout').textContent.trim()==='Points: A','Hidden coordinate does not leak through the grid readout');
    const fixedBefore=coPoint.dataset.coPos,fixedParts=fixedBefore.split(',').map(Number);
    const fixedTarget=coordClient(fixedParts[0]===10?9:fixedParts[0]+1,fixedParts[1]);
    const fixedRect=coPoint.getBoundingClientRect();
    pointer(coPoint,'pointerdown',fixedRect.left+fixedRect.width/2,fixedRect.top+fixedRect.height/2,61);
    pointer(coPoint,'pointermove',fixedTarget.x,fixedTarget.y,61);
    pointer(coPoint,'pointerup',fixedTarget.x,fixedTarget.y,61);
    coPoint=document.querySelector('[data-co-point="0"]');
    assert(coPoint.dataset.coPos===fixedBefore,'Given point stays fixed during a read-only Coordinates challenge');
    assert(document.querySelector('[data-co-delete]').hidden,'Fixed challenge point does not expose delete');
    document.querySelector('[data-board-action="reveal"]').click();
    assert(document.querySelector('.gd-challenge-banner').textContent.includes('Answer:'),'Coordinates challenge reveals its answer contextually');
    assert(document.querySelector('[data-co-label="0"]').textContent.trim().includes('('),'Reveal restores the hidden coordinate label');

    document.querySelector('[data-co-workflow="export"]').click();
    assert(document.querySelector('[data-co-export-mode="challenge"]'),'Active Coordinates challenge offers Challenge card export');
    let coChallengeSvg=null;
    const coOldChallengeDownload=TT99Goodies.exportTools.downloadSvg;
    TT99Goodies.exportTools.downloadSvg=(svg)=>{coChallengeSvg=svg.cloneNode(true)};
    document.getElementById('co-svg-download').click();
    TT99Goodies.exportTools.downloadSvg=coOldChallengeDownload;
    assert(coChallengeSvg&&coChallengeSvg.querySelector('[data-co-export-board]'),'Coordinates challenge card embeds the vector grid');
    assert(!coChallengeSvg.textContent.includes('Answer:'),'Coordinates pupil challenge export never includes a revealed answer label');
    assert(coChallengeSvg.textContent.includes('Points: A'),'Coordinates pupil export re-hides the coordinate after teacher reveal');
    assert(coChallengeSvg.textContent.includes('What are the coordinates of point A?'),'Coordinates challenge-card export includes the pupil prompt');

    document.querySelector('[data-co-workflow="challenge"]').click();
    document.querySelector('[data-co-challenge-cat="read"]').click();
    document.querySelector('[data-co-challenge-type="missing-coordinate"]').click();
    document.getElementById('co-generate').click();
    assert(document.querySelector('[data-co-label="0"]').textContent.includes('?'),'Missing-coordinate challenge hides only the requested coordinate component');

    document.querySelector('[data-co-workflow="challenge"]').click();
    document.querySelector('[data-co-challenge-type="plot-coordinate"]').click();
    document.getElementById('co-generate').click();
    assert(document.querySelectorAll('[data-co-point]').length===0,'Plot-coordinate challenge starts with a blank grid');
    clickCoord(3,4);
    assert(document.querySelectorAll('[data-co-point]').length===1,'Plot-coordinate challenge lets the pupil place a point directly');
    clickCoord(5,6);
    assert(document.querySelectorAll('[data-co-point]').length===1&&document.querySelector('[data-co-pos="5,6"]'),'Plot-coordinate challenge keeps one movable pupil point rather than accumulating guesses');

    document.querySelector('[data-co-workflow="export"]').click();
    let coPlotSvg=null;
    const coOldPlotDownload=TT99Goodies.exportTools.downloadSvg;
    TT99Goodies.exportTools.downloadSvg=(svg)=>{coPlotSvg=svg.cloneNode(true)};
    document.getElementById('co-svg-download').click();
    TT99Goodies.exportTools.downloadSvg=coOldPlotDownload;
    assert(coPlotSvg&&!coPlotSvg.querySelector('[data-co-export-point]'),'Plot-coordinate pupil card exports a blank grid even after the teacher tested a point');
    assert(coPlotSvg.textContent.includes('Plot point A at'),'Plot-coordinate pupil card keeps the target instruction');

    document.querySelector('[data-co-workflow="challenge"]').click();
    document.querySelector('[data-co-challenge-cat="transform"]').click();
    assert(document.querySelector('[data-co-challenge-type="reflect-axis"]'),'Axis-reflection challenge is available');
    assert(document.querySelector('[data-co-challenge-type="translate-point"]'),'Translation challenge is available');
    document.querySelector('[data-co-challenge-cat="reason"]').click();
    const quadrantChallenge=document.querySelector('[data-co-challenge-type="identify-quadrant"]');
    assert(quadrantChallenge,'Quadrant-identification challenge is available');
    quadrantChallenge.click();
    document.getElementById('co-generate').click();
    assert(Number(document.getElementById('co-svg').dataset.coMin)===-10,'Quadrant challenge automatically uses the four-quadrant grid');
    assert(document.querySelector('[data-co-label="0"]').textContent.trim()==='A','Quadrant challenge hides the coordinate while leaving the point visible');

    document.querySelector('[data-co-workflow="challenge"]').click();
    document.querySelector('[data-co-challenge-tab="custom"]').click();
    const coSource=document.getElementById('co-custom-answer-source');
    assert(coSource,'Coordinates custom challenge exposes live point answer sources');
    for(const source of ['point:0:coords','point:0:x','point:0:y','point:0:quadrant']){
      assert([...coSource.options].some(o=>o.value===source),'Coordinates custom answer source '+source+' is available');
    }
    coSource.value='point:0:coords';
    coSource.dispatchEvent(new Event('change',{bubbles:true}));
    assert(document.querySelector('[data-co-label="0"]').textContent.trim()==='A','Binding a custom coordinate answer hides the pupil-facing coordinate');
    const coLiveBefore=document.getElementById('co-custom-live-answer').textContent.trim();
    coPoint=document.querySelector('[data-co-point="0"]');
    const current=coPoint.dataset.coPos.split(',').map(Number);
    const nx=current[0]===10?9:current[0]+1,ny=current[1],coMove=coordClient(nx,ny),coRect=coPoint.getBoundingClientRect();
    pointer(coPoint,'pointerdown',coRect.left+coRect.width/2,coRect.top+coRect.height/2,62);
    pointer(coPoint,'pointermove',coMove.x,coMove.y,62);
    pointer(coPoint,'pointerup',coMove.x,coMove.y,62);
    assert(document.getElementById('co-custom-live-answer').textContent.trim()!==coLiveBefore,'Coordinates live custom answer updates when the bound point moves');

    document.getElementById('co-clear-challenge').click();
    assert(Number(document.getElementById('co-svg').dataset.coMin)===-10,'Ending a Coordinates challenge restores the teacher four-quadrant view');
    assert(document.querySelectorAll('[data-co-point]').length===3,'Ending a Coordinates challenge restores the teacher point set');
    assert(document.querySelector('[data-co-pos="-3,-2"]'),'Ending a Coordinates challenge restores the negative teacher point');
  }
  function testMeasurement(){
    TT99Goodies.interaction.clear();
    assert(TT99Goodies.measurementTool,'Measurement tool is registered');
    TT99Goodies.measurementTool();

    function rulerClient(value){
      const ruler=document.getElementById('me-ruler'),r=ruler.getBoundingClientRect();
      return{ruler,x:r.left+Math.max(0,Math.min(1,value/30))*r.width,y:r.top+r.height/2};
    }
    let marker=document.getElementById('me-marker');
    assert(marker&&marker.getAttribute('aria-valuenow')==='12.3','Measurement ruler starts at the expected marker value');
    const p=rulerClient(15.7);
    pointer(p.ruler,'pointerdown',p.x,p.y,81);
    marker=document.getElementById('me-marker');
    assert(marker&&marker.getAttribute('aria-valuenow')==='15.7','Tapping the ruler moves the marker to the nearest millimetre');
    const dragTo=rulerClient(16.4);
    pointer(p.ruler,'pointermove',dragTo.x,dragTo.y,81);
    pointer(p.ruler,'pointerup',dragTo.x,dragTo.y,81);
    marker=document.getElementById('me-marker');
    assert(marker.getAttribute('aria-valuenow')==='16.4','Dragging along the ruler updates the marker continuously');
    marker.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    marker=document.getElementById('me-marker');
    assert(marker.getAttribute('aria-valuenow')==='16.5','Focused ruler marker moves by 1 mm with the arrow keys');
    const teacherValue=marker.getAttribute('aria-valuenow');

    document.querySelector('[data-me-workflow="challenge"]').click();
    assert(document.querySelector('[data-me-challenge-tab="standard"]')&&document.querySelector('[data-me-challenge-tab="custom"]'),'Measurement uses the shared Standard / Custom challenge tabs');
    for(const type of ['read-mark','place-mark','distance-between']){
      assert(document.querySelector('[data-me-challenge-type="'+type+'"]'),'Measurement challenge '+type+' is available');
    }
    document.querySelector('[data-me-challenge-type="read-mark"]').click();
    document.getElementById('me-generate').click();
    assert(document.querySelector('.gd-challenge-banner'),'Generated Measurement challenge appears above the ruler');
    assert([...document.querySelectorAll('.gd-fdp-value strong')].every(x=>x.textContent.trim()==='?'),'Read-the-ruler challenge hides all equivalent unit readouts');
    marker=document.getElementById('me-marker');
    const frozenBefore=marker.getAttribute('aria-valuenow'),frozenMove=rulerClient(4.2);
    pointer(frozenMove.ruler,'pointerdown',frozenMove.x,frozenMove.y,82);
    assert(document.getElementById('me-marker').getAttribute('aria-valuenow')===frozenBefore,'Read challenge keeps the given marker fixed');
    document.querySelector('[data-board-action="reveal"]').click();
    assert(document.querySelector('.gd-challenge-banner').textContent.includes('Answer:'),'Measurement challenge reveals its answer contextually');
    assert([...document.querySelectorAll('.gd-fdp-value strong')].some(x=>x.textContent.includes('cm')),'Reveal restores the live unit readouts');

    document.querySelector('[data-me-workflow="challenge"]').click();
    document.querySelector('[data-me-challenge-cat="read"]').click();
    document.querySelector('[data-me-challenge-type="place-mark"]').click();
    document.getElementById('me-generate').click();
    assert([...document.querySelectorAll('.gd-fdp-value strong')].every(x=>x.textContent.trim()==='?'),'Place-the-mark challenge hides the live numeric readouts');
    const prompt=document.querySelector('.gd-challenge-prompt').textContent;
    const targetMatch=prompt.match(/to\s+([0-9.]+)\s*cm/i);
    assert(targetMatch,'Place-the-mark challenge states a numeric centimetre target');
    const targetValue=Number(targetMatch[1]),targetPoint=rulerClient(targetValue);
    pointer(targetPoint.ruler,'pointerdown',targetPoint.x,targetPoint.y,83);
    pointer(targetPoint.ruler,'pointerup',targetPoint.x,targetPoint.y,83);
    assert(Number(document.getElementById('me-marker').getAttribute('aria-valuenow'))===targetValue,'Place-the-mark challenge keeps direct ruler interaction active');
    assert(document.querySelector('.gd-answer-live')?.textContent.includes('On target'),'Place-the-mark challenge confirms an exact direct placement');

    document.querySelector('[data-me-workflow="challenge"]').click();
    document.querySelector('[data-me-challenge-type="distance-between"]').click();
    document.getElementById('me-generate').click();
    assert(document.querySelector('.gd-ruler-marker--secondary'),'Distance challenge shows a second fixed ruler mark');
    assert([...document.querySelectorAll('.gd-ruler-marker-label')].some(x=>x.textContent.trim()==='A')&&[...document.querySelectorAll('.gd-ruler-marker-label')].some(x=>x.textContent.trim()==='B'),'Distance challenge labels marks A and B');
    assert([...document.querySelectorAll('.gd-fdp-value strong')].every(x=>x.textContent.trim()==='?'),'Distance challenge does not leak the answer through unit readouts');

    document.querySelector('[data-me-workflow="challenge"]').click();
    document.querySelector('[data-me-challenge-cat="convert"]').click();
    for(const type of ['cm-to-mm','mm-to-cm','cm-to-m']){
      assert(document.querySelector('[data-me-challenge-type="'+type+'"]'),'Measurement conversion challenge '+type+' is available');
    }
    document.querySelector('[data-me-challenge-cat="reason"]').click();
    assert(document.querySelector('[data-me-challenge-type="unit-misconception"]'),'Measurement unit-conversion misconception challenge is available');

    document.querySelector('[data-me-challenge-tab="custom"]').click();
    const source=document.getElementById('me-custom-answer-source');
    assert(source,'Measurement custom challenge exposes live unit answer sources');
    for(const id of ['cm','mm','m'])assert([...source.options].some(o=>o.value===id),'Measurement custom source '+id+' is available');
    source.value='mm';source.dispatchEvent(new Event('change',{bubbles:true}));
    assert([...document.querySelectorAll('.gd-fdp-value strong')].every(x=>x.textContent.trim()==='?'),'Bound custom measurement answer hides all equivalent readouts');
    const liveBefore=document.getElementById('me-custom-live-answer').textContent.trim();
    marker=document.getElementById('me-marker');
    marker.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    const liveAfter=document.getElementById('me-custom-live-answer').textContent.trim();
    assert(liveAfter!==liveBefore,'Measurement live custom answer updates when the marker moves');

    document.getElementById('me-clear-challenge').click();
    assert(document.getElementById('me-marker').getAttribute('aria-valuenow')===teacherValue,'Ending a Measurement challenge restores the teacher marker position');
  }

  window.addEventListener('load',function(){
    setTimeout(function(){
      try{
        testNumberLineChallenges();
        testMathsCanvas();
        testPlaceValue();
        testFractions();
        testGeoboard();
        testCoordinates();
        testMeasurement();
        result('pass','Number Line challenges, Maths Canvas, Place Value, Fraction Wall, Geoboard, Coordinates and Measurement interactions work');
      }catch(err){
        result('fail',err&&err.message?err.message:String(err));
      }
    },100);
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
