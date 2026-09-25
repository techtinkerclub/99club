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
<script src="/assets/99club/goodies-number-line-v6.js"></script>
<script src="/assets/99club/goodies-tools-a.js"></script>
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
    assert(document.querySelectorAll('[data-nl-challenge-type]').length>=2,'Standard challenge cards are shown');
    assert(document.querySelector('[data-nl-challenge-type="identify"]'),'Existing marked-number challenge remains available');

    const intervalCat=document.querySelector('[data-nl-challenge-cat="read"]');
    assert(intervalCat,'Read & scale challenge category exists');
    const interval=document.querySelector('[data-nl-challenge-type="interval-value"]');
    assert(interval,'Interval-value challenge exists');
    interval.click();
    document.getElementById('nl-generate').click();
    assert(document.querySelector('.gd-challenge-banner'),'Generated standard challenge appears above the number line');
    assert(document.querySelector('.gd-challenge-prompt').textContent.includes('interval'),'Generated interval challenge has contextual prompt');
    assert(document.querySelector('.gd-challenge-reveal'),'Generated challenge exposes answer contextually');

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

    const answer=document.getElementById('nl-custom-answer');
    answer.value='Because the equal spaces have the same value.';
    answer.dispatchEvent(new Event('input',{bubbles:true}));
    document.getElementById('nl-reveal').click();
    assert(document.querySelector('.gd-challenge-banner').textContent.includes('Because the equal spaces'),'Custom answer reveals contextually');

    TT99Goodies.numberLine();
    const markerCount=document.querySelectorAll('[data-marker-hit]').length;
    document.querySelector('[data-nl-challenge-tab="custom"]').click();
    assert(document.querySelectorAll('[data-marker-hit]').length===markerCount,'Starting a custom challenge preserves the current maths setup');

    document.querySelector('[data-nl-challenge-tab="standard"]').click();
    document.querySelector('[data-nl-challenge-cat="round"]').click();
    const rounding=document.querySelector('[data-nl-challenge-type="rounding"]');
    assert(rounding,'Rounding challenge is available');
    rounding.click();
    document.getElementById('nl-generate').click();
    assert(document.querySelector('.gd-challenge-prompt').textContent.includes('nearest'),'Rounding challenge generates a rounding prompt');
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
        result('pass','Number Line challenges, Maths Canvas, Place Value, Fraction Wall, Geoboard and Coordinates interactions work');
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
