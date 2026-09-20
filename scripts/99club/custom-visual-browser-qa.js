#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const mode=process.argv[2]||'prepare';
const HARNESS=path.join(ROOT,'99club-custom-visual-qa.html');
function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}
function localTags(page,kind){
  const text=read(page),rx=kind==='css'?/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g:/<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/g;
  return [...text.matchAll(rx)].map(m=>m[1]).filter(u=>u.startsWith('/assets/99club/'));
}
function prepare(){
  const page='_pages/99-club-custom.md';
  const css=[...new Set(localTags(page,'css'))];
  const js=localTags(page,'js').filter(u=>!u.includes('/custom-app.js'));
  const styles=css.map(u=>`<link rel="stylesheet" href="${u}">`).join('\n');
  const scripts=js.map(u=>`<script src="${u}"><\/script>`).join('\n');
  const runner=String.raw`
<script>
(async function(){
  const report={failures:[],passes:[],families:[],renders:0,pages:0,elements:0,minFont:99};
  const fail=(area,msg)=>report.failures.push({area,msg});
  const pass=(area,msg)=>report.passes.push({area,msg});
  function finish(){
    const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(report))));
    const pre=document.createElement('pre');pre.id='custom-visual-qa-result';pre.dataset.status=report.failures.length?'fail':'pass';pre.textContent=encoded;document.body.appendChild(pre);
    document.documentElement.dataset.customVisualQaStatus=pre.dataset.status;document.title='99club-custom-visual-qa:'+pre.dataset.status;
  }
  function checkSvg(svg,family,orientation,answers,pageIndex){
    const vb=svg.viewBox.baseVal;if(!vb||!vb.width||!vb.height){fail('viewbox',family+' '+orientation+' '+pageIndex+' has no valid viewBox');return;}
    report.pages++;
    const els=[...svg.querySelectorAll('text,line,rect,polygon,circle,path,image')].filter(el=>!el.classList.contains('tt99-svg-row-hit')&&!(el.tagName==='rect'&&el.getAttribute('width')==='100%'));
    for(const el of els){
      report.elements++;
      if(el.tagName==='text'&&el.hasAttribute('font-size')){const fs=Number(el.getAttribute('font-size'));if(Number.isFinite(fs)&&fs>0){report.minFont=Math.min(report.minFont,fs);if(fs<5.7)fail('font',family+' '+orientation+' '+(answers?'answer':'pupil')+' font '+fs+' too small');}}
      let b;try{b=el.getBBox();}catch(e){continue;}
      if(!b||![b.x,b.y,b.width,b.height].every(Number.isFinite)){fail('bbox',family+' '+el.tagName+' invalid bbox');continue;}
      const tol=1.5;
      if(b.x<vb.x-tol||b.y<vb.y-tol||b.x+b.width>vb.x+vb.width+tol||b.y+b.height>vb.y+vb.height+tol){
        fail('containment',family+' '+orientation+' '+(answers?'answer':'pupil')+' page '+(pageIndex+1)+' '+el.tagName+' outside page by '+JSON.stringify({x:+b.x.toFixed(1),y:+b.y.toFixed(1),w:+b.width.toFixed(1),h:+b.height.toFixed(1)}));
      }
    }
  }
  try{
    const G=window.TT99Generator,L=window.TT99PDFLayout,W=window.TT99CustomWrittenMethods,R=window.TT99CustomReasoning,S=window.TT99CustomStructured;
    if(!G||!L||!W||!R||!S){fail('load','Required generator/layout/expansion modules missing');finish();return;}
    const families=[...Object.keys(W.FAMILIES),...Object.keys(R.FAMILIES),...Object.keys(S.FAMILIES)];
    report.families=families.slice();
    for(const family of families){
      for(const orientation of ['portrait','landscape']){
        const base=G.clone(G.OPEN_WORKSHEET_PRESET);base.mode='family_mix';base.progressionEnabled=false;base.questionCount=4;base.families=[family];base.familyWeights={[family]:1};base.worksheetTitle='Visual QA';
        const rules=G.normalizeRules(base),questions=G.generateQuestions(rules,'VISUAL:'+family+':'+orientation);
        if(questions.length!==4){fail('generation',family+' generated '+questions.length+'/4');continue;}
        const sheet={questions,code:'QA-'+family.slice(0,8).toUpperCase()};
        for(const answers of [false,true]){
          let html='';try{html=L.renderPreviewSvg({rules,sheet,school:{},answers,orientation,qrMatrix:null,teacherNote:''});}catch(e){fail('render',family+' '+orientation+' '+(answers?'answer':'pupil')+' threw '+e.message);continue;}
          report.renders++;
          if(!html||!/\<svg\b/.test(html)){fail('render',family+' '+orientation+' returned no SVG');continue;}
          if(/NaN|undefined|nullpx|Infinity/.test(html))fail('serialization',family+' '+orientation+' emitted invalid numeric/text token');
          const host=document.createElement('div');host.className='qa-host';host.innerHTML=html;document.body.appendChild(host);
          const svgs=[...host.querySelectorAll('svg.tt99-paper, svg.tt99-visual-paper')];if(!svgs.length)fail('render',family+' '+orientation+' produced no worksheet SVG');
          svgs.forEach((svg,i)=>checkSvg(svg,family,orientation,answers,i));
          host.remove();
        }
      }
    }
    if(report.minFont===99)report.minFont=null;
    if(!report.failures.length)pass('visual',families.length+' families fit pupil/answer SVG pages in portrait and landscape');
  }catch(e){fail('exception',e.stack||e.message);}
  finish();
})();
</script>`;
  fs.writeFileSync(HARNESS,`<!doctype html><html><head><meta charset="utf-8"><title>Custom visual QA</title>${styles}<style>body{margin:0}.qa-host{position:absolute;left:-10000px;top:0;width:1200px}.qa-host svg{display:block;width:auto;height:auto}</style></head><body>${scripts}${runner}</body></html>`);
  console.log('Prepared '+path.basename(HARNESS)+' with '+js.length+' scripts and '+css.length+' stylesheets.');
}
function check(file){
  const html=fs.readFileSync(file,'utf8');
  const m=html.match(/<pre[^>]*id=["']custom-visual-qa-result["'][^>]*>([^<]+)<\/pre>/i);
  if(!m){console.error('Custom visual QA result marker missing.');process.exit(1);}
  let report;try{report=JSON.parse(Buffer.from(m[1].trim(),'base64').toString('utf8'));}catch(e){console.error('Could not decode Custom visual QA report:',e.message);process.exit(1);}
  fs.writeFileSync(path.join(ROOT,'99club-custom-visual-qa-report.json'),JSON.stringify(report,null,2));
  if(report.failures?.length){for(const f of report.failures)console.error('FAIL ['+f.area+'] '+f.msg);console.error('Custom visual QA: '+report.failures.length+' failure(s), '+report.families.length+' families, '+report.renders+' renders.');process.exit(1);}
  console.log('Custom visual QA passed: '+report.families.length+' families, '+report.renders+' renders, '+report.pages+' SVG pages, min font '+report.minFont+'.');
}
if(mode==='prepare')prepare();else if(mode==='check')check(process.argv[3]);else{console.error('Use prepare or check <html>.');process.exit(2);}
