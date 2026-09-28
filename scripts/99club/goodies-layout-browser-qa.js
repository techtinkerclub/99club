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
<link rel="stylesheet" href="/assets/99club/goodies.css">
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
<script src="/assets/99club/goodies-number-line-v6.js"></script>
<script src="/assets/99club/goodies-tools-b.js"></script>
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
  async function run(){
    assert(window.TT99Goodies&&TT99Goodies.whiteboard,'Goodies app is registered');
    const cards=[...document.querySelectorAll('[data-tool]')];
    assert(cards.length>=18,'Expected the full Goodies catalogue');
    const ids=cards.map(x=>x.dataset.tool),checked=[];
    for(const id of ids){
      const card=document.querySelector('[data-tool="'+id+'"]');
      assert(card,'Catalogue card exists for '+id);
      card.click();await tick();await tick();
      checkLayout(id,'default');
      await visitWorkflow(id,/challenge/i,'challenge');
      await visitWorkflow(id,/task/i,'task');
      await visitWorkflow(id,/export/i,'export');
      checked.push(id);
      document.getElementById('gd-back').click();await tick();
      assert(document.documentElement.scrollWidth<=innerWidth+3,id+' leaves page overflow after closing');
    }
    result('pass','Shared classroom layout stays contained across all '+checked.length+' manipulatives',checked.join(','));
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
