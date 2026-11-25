'use strict';

const fs=require('fs');
const mode=process.argv[2];
const HARNESS='99club-goodies-layout-qa.html';
const REPORT='99club-goodies-layout-qa-report.json';

if(mode==='prepare'){
  const html=`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/assets/99club/goodies.css">\n<link rel="stylesheet" href="/assets/99club/goodies-abacus.css">
<style>html{scroll-behavior:auto!important}</style>
</head>
<body>
<div id="tt99-goodies-root"></div>
<div id="gd-layout-qa-result" data-status="pending">pending</div>
<script>
window.scrollTo=function(){};
</script>
<script src="/assets/99club/goodies-core.js"></script>
<script src="/assets/99club/goodies-interaction.js"></script>
<script src="/assets/99club/goodies-challenge.js"></script>
<script src="/assets/99club/goodies-export.js"></script>
<script src="/assets/99club/goodies-tools-a.js"></script>
<script src="/assets/99club/goodies-abacus.js"></script>
<script src="/assets/99club/goodies-number-line-v6.js"></script>
<script src="/assets/99club/goodies-tools-b.js"></script>
<script src="/assets/99club/goodies-sequences.js"></script>
<script src="/assets/99club/goodies-written-methods.js"></script>
<script src="/assets/99club/goodies-column-methods.js"></script>
<script src="/assets/99club/goodies-app.js"></script>
<script>
(function(){
  function assert(value,message){if(!value)throw new Error(message)}
  function tick(){return new Promise(resolve=>setTimeout(resolve,0))}
  function visible(el){
    if(!el)return false;
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';
  }
  function result(status,message,detail){
    const el=document.getElementById('gd-layout-qa-result');
    el.dataset.status=status;el.dataset.message=message||'';el.dataset.detail=detail||'';
    el.textContent=status+': '+(message||'');
  }
  function datasetHasWorkflow(el){
    return Object.keys(el.dataset||{}).some(key=>/workflow/i.test(key));
  }
  function checkButtonText(root,label){
    [...root.querySelectorAll('button')].filter(visible).forEach(button=>{
      assert(button.scrollWidth<=button.clientWidth+4,label+' button text overflows: '+button.textContent.trim());
    });
  }
  function checkControlsContainment(controls,label){
    const cr=controls.getBoundingClientRect();
    [...controls.querySelectorAll('button,input,select,textarea')].filter(visible).forEach(el=>{
      const r=el.getBoundingClientRect();
      assert(r.left>=cr.left-3,label+' control escapes left edge: '+(el.id||el.textContent.trim()));
      assert(r.right<=cr.right+3,label+' control escapes right edge: '+(el.id||el.textContent.trim()));
    });
  }
  function fontPx(el){return parseFloat(getComputedStyle(el).fontSize)||0}
  function checkTeacherControlScale(controls,label){
    [...controls.querySelectorAll('.gd-btn,.gd-input:not([type="range"]),.gd-select')].filter(visible).forEach(el=>{
      const h=el.getBoundingClientRect().height;
      const minimum=innerWidth<=520?44:42;
      assert(h>=minimum,label+' teacher control is too small ('+Math.round(h)+'px): '+(el.id||el.textContent.trim()||el.getAttribute('aria-label')||el.tagName));
    });
    [...controls.querySelectorAll('.gd-challenge-card')].filter(visible).forEach(card=>{
      const title=card.querySelector('strong'),desc=card.querySelector('span'),note=card.querySelector('small');
      if(title)assert(fontPx(title)>=13,label+' challenge title is too small: '+title.textContent.trim());
      if(desc)assert(fontPx(desc)>=12,label+' challenge description is too small: '+desc.textContent.trim());
      if(note)assert(fontPx(note)>=11,label+' challenge note is too small: '+note.textContent.trim());
    });
    [...controls.querySelectorAll('.gd-rich-toolbar button')].filter(visible).forEach(button=>{
      const r=button.getBoundingClientRect();
      assert(r.width>=37&&r.height>=37,label+' rich-text toolbar target is too small: '+button.textContent.trim());
    });
    [...controls.querySelectorAll('.nl-workflow-tab')].filter(visible).forEach(button=>assert(button.getBoundingClientRect().height>=41,label+' Number Line workflow tab is too small: '+button.textContent.trim()));
    [...controls.querySelectorAll('.nl-icon-btn')].filter(visible).forEach(button=>{
      const r=button.getBoundingClientRect();
      assert(r.width>=37&&r.height>=37,label+' Number Line edit/delete target is too small');
    });
    [...controls.querySelectorAll('.nl-compact-field>span')].filter(visible).forEach(span=>assert(fontPx(span)>=11.4,label+' compact teacher label is too small: '+span.textContent.trim()));
  }
  function checkLayout(id,state){
    const label=id+' / '+state;
    const workspace=document.getElementById('gd-workspace');
    const controls=document.getElementById('gd-controls');
    const stage=document.getElementById('gd-stage');
    assert(workspace&&controls&&stage,label+' workspace shell exists');
    const wr=workspace.getBoundingClientRect(),sr=stage.getBoundingClientRect(),cr=controls.getBoundingClientRect();
    assert(wr.left>=-2&&wr.right<=innerWidth+2,label+' workspace stays inside viewport');
    assert(sr.left>=wr.left-2&&sr.right<=wr.right+2,label+' stage stays inside workspace');
    assert(cr.left>=wr.left-2&&cr.right<=wr.right+2,label+' controls stay inside workspace');
    assert(document.documentElement.scrollWidth<=innerWidth+3,label+' creates page-level horizontal scrolling');
    assert(document.body.scrollWidth<=innerWidth+3,label+' body creates horizontal scrolling');
    assert(controls.scrollWidth<=controls.clientWidth+3,label+' controls need horizontal scrolling');
    checkControlsContainment(controls,label);
    checkButtonText(controls,label);
    checkTeacherControlScale(controls,label);
    if(id!=='number-line'&&id!=='randomiser'){
      const workflow=[...controls.children].find(el=>el.matches('[role="tablist"][aria-label$="workflow"]'));
      assert(workflow,label+' exposes workflow navigation at the top of the teacher controls');
      const workflowButtons=[...workflow.querySelectorAll('button')].filter(visible);
      const expectedWorkflowCount=(id==='place-value'||id==='abacus'||id==='maths-canvas')?4:3;
      assert(workflowButtons.length===expectedWorkflowCount,label+' workflow navigation keeps the expected '+expectedWorkflowCount+' primary destinations');
      assert(getComputedStyle(workflow).display==='grid',label+' workflow navigation uses the shared equal-width grid');
      workflowButtons.forEach(button=>assert(button.scrollWidth<=button.clientWidth+4,label+' workflow label stays fully readable: '+button.textContent.trim()));
      if(innerWidth>=901)assert(getComputedStyle(workflow).position==='sticky',label+' workflow navigation remains visible while desktop controls scroll');
      else assert(getComputedStyle(workflow).position!=='sticky',label+' workflow navigation stays in normal flow on phone');
    }
    if(innerWidth>=901){
      const style=getComputedStyle(controls);
      assert(style.position==='sticky',label+' desktop controls should remain pinned while the page moves');
      assert(style.overflowY==='auto'||style.overflow==='auto',label+' desktop controls should scroll internally when long');
      assert(cr.height<=innerHeight-20,label+' desktop controls should fit the viewport');
    }else{
      assert(getComputedStyle(controls).position==='static',label+' phone controls should stay in normal document flow');
    }
  }
  async function visitWorkflow(id,pattern,label){
    const controls=document.getElementById('gd-controls');
    const button=[...controls.querySelectorAll('button')].find(b=>datasetHasWorkflow(b)&&pattern.test(b.textContent||''));
    if(!button)return false;
    button.click();await tick();await tick();
    checkLayout(id,label);
    return true;
  }
  async function exerciseChallenge(id){
    const controls=document.getElementById('gd-controls');
    const stage=document.getElementById('gd-stage');
    const workflow=[...controls.querySelectorAll('button')].find(b=>datasetHasWorkflow(b)&&/challenge/i.test(b.textContent||''));
    if(!workflow)return false;
    workflow.click();await tick();await tick();
    checkLayout(id,'challenge');
    if(id==='abacus'){
      const modes=[...controls.querySelectorAll('[data-ab-challenge-mode]')];
      assert(modes.length===9,'abacus challenge controls expose all nine arithmetic and number-sense task types');
      const random=controls.querySelector('[data-gd-native-prefix="ab"] [data-gd-native-random="all"]');
      assert(visible(random),'abacus challenge controls expose a direct Random challenge action');
      assert(!stage.querySelector('.gd-ab-task'),'opening the Abacus Challenge tab shows the picker without silently replacing the teacher setup');
      random.click();await tick();await tick();
      let game=stage.querySelector('.gd-ab-task');
      assert(visible(game),'abacus Random challenge creates a pupil task on the stage');
      assert(visible(game.querySelector('[data-ab-check]'))&&visible(game.querySelector('[data-ab-another]'))&&visible(game.querySelector('[data-ab-reveal]')),'abacus challenge exposes Check, Reveal and Another on the stage');
      const kind=game.dataset.abTask;
      game.querySelector('[data-ab-another]').click();await tick();await tick();
      game=stage.querySelector('.gd-ab-task');
      assert(visible(game)&&modes.some(mode=>mode.dataset.abChallengeMode===game.dataset.abTask),'abacus Random-all Another generates a valid fresh task');
      assert(stage.querySelector('[data-ab-total]').textContent.trim()==='?','abacus challenge keeps the total hidden before reveal');
      game.querySelector('[data-ab-reveal]').click();await tick();await tick();
      assert(stage.querySelector('[data-ab-total]').textContent.trim()!=='?','abacus Reveal shows the completed frame value');
      checkLayout(id,'generated challenge');
      return true;
    }
    if(id==='place-value'){
      const modes=[...controls.querySelectorAll('[data-pv-challenge-mode]')];
      assert(modes.length===8,'place-value challenge controls expose all eight unified task types, including Addition');
      const random=controls.querySelector('[data-gd-native-prefix="pv"] [data-gd-native-random="all"]');
      assert(visible(random),'place-value challenge controls expose a direct Random challenge action');
      random.click();await tick();await tick();
      let game=stage.querySelector('.gd-pv-activity--game');
      assert(visible(game),'place-value random challenge appears contextually on the stage');
      assert(visible(game.querySelector('[data-pv-activity-check]'))&&visible(game.querySelector('[data-pv-activity-another]')),'place-value unified challenge exposes Check and Another on the stage');
      const kind=game.dataset.pvActivityKind;
      game.querySelector('[data-pv-activity-another]').click();await tick();await tick();
      game=stage.querySelector('.gd-pv-activity--game');
      assert(visible(game)&&modes.some(mode=>mode.dataset.pvChallengeMode===game.dataset.pvActivityKind),'place-value Random-all Another generates a valid fresh task');
      checkLayout(id,'generated challenge');
      return true;
    }
    const generate=['sequences','maths-canvas','column-addition','column-subtraction','written-multiplication','written-division'].includes(id)?controls.querySelector('[data-gd-native-prefix="'+(id==='sequences'?'seq':(id.startsWith('column-')||id.startsWith('written-'))?'wm':'mc')+'"] [data-gd-native-random="all"]'):[...controls.querySelectorAll('button')].find(b=>/^(Generate challenge|Another like this)$/.test((b.textContent||'').trim()));
    assert(generate,id+' challenge controls expose a direct generate action');
    generate.click();await tick();await tick();
    let banner=stage.querySelector('.gd-challenge-banner');
    assert(visible(banner),id+' generated challenge appears contextually on the stage');
    let another=banner.querySelector('[data-challenge-action="another"]');
    assert(visible(another),id+' generated standard challenge exposes Another like this on the stage');
    let reveal=banner.querySelector('[data-board-action="reveal"]');
    assert(visible(reveal),id+' generated challenge exposes Reveal answer on the stage');
    reveal.click();await tick();await tick();
    banner=stage.querySelector('.gd-challenge-banner');
    assert(/Answer:/.test(banner.textContent||''),id+' Reveal answer displays the answer in the stage banner');
    const hide=banner.querySelector('[data-board-action="reveal"]');
    assert(hide&&/Hide answer/i.test(hide.textContent||''),id+' reveal control changes to Hide answer');
    another=banner.querySelector('[data-challenge-action="another"]');
    assert(visible(another),id+' Another like this remains available after revealing');
    another.click();await tick();await tick();
    banner=stage.querySelector('.gd-challenge-banner');
    assert(visible(banner),id+' Another like this leaves a fresh challenge on the stage');
    reveal=banner.querySelector('[data-board-action="reveal"]');
    assert(visible(reveal)&&/Reveal answer/i.test(reveal.textContent||''),id+' fresh challenge resets to a hidden answer');
    checkLayout(id,'generated challenge');
    return true;
  }
  async function run(){
    assert(window.TT99Goodies&&TT99Goodies.whiteboard,'Goodies app is registered');
    const cards=[...document.querySelectorAll('[data-tool]')];
    assert(cards.length>=19,'Expected the full Goodies catalogue including Abacus');
    const ids=cards.map(x=>x.dataset.tool),checked=[];
    for(const id of ids){
      const card=document.querySelector('[data-tool="'+id+'"]');
      assert(card,'Catalogue card exists for '+id);
      card.click();await tick();await tick();
      checkLayout(id,'default');
      await exerciseChallenge(id);
      await visitWorkflow(id,/task/i,'task');
      await visitWorkflow(id,/export/i,'export');
      checked.push(id);
      document.getElementById('gd-back').click();await tick();
      assert(document.documentElement.scrollWidth<=innerWidth+3,id+' leaves page overflow after closing');
    }
    result('pass','Shared classroom layout and contextual challenge actions work across all '+checked.length+' manipulatives',checked.join(','));
  }
  window.addEventListener('load',()=>setTimeout(()=>run().catch(err=>result('fail',err&&err.message?err.message:String(err),err&&err.stack?err.stack:'')),120));
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
  if(!file)throw new Error('Usage: node goodies-layout-browser-qa.js check <dumped-html>');
  const html=fs.readFileSync(file,'utf8');
  const match=html.match(/<div id="gd-layout-qa-result"[^>]*data-status="([^"]+)"[^>]*data-message="([^"]*)"[^>]*data-detail="([^"]*)"/);
  const status=match?match[1]:'missing',message=match?match[2]:'Result element missing',detail=match?match[3]:'';
  const report={status,message,detail,checkedAt:new Date().toISOString()};
  fs.writeFileSync(REPORT,JSON.stringify(report,null,2));
  if(status!=='pass')throw new Error('Goodies layout QA failed: '+(message||status));
  console.log(message);
  process.exit(0);
}

throw new Error('Use prepare or check mode.');
