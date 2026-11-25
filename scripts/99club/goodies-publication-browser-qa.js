'use strict';
const fs=require('fs');
const pageSource=fs.readFileSync('_pages/whiteboard.md','utf8');
const styleTags=pageSource.split('\n').filter(l=>l.startsWith('<link rel="stylesheet" href="/assets/99club/goodies')).join('\n').replace(/\?v=[^"]+/g,'');
const scriptTags=pageSource.split('\n').filter(l=>l.startsWith('<script src="/assets/99club/goodies')).map(l=>l.replace(' defer','')).join('\n').replace(/\?v=[^"]+/g,'');
const file='99club-goodies-publication-qa.html',report='99club-goodies-publication-qa-report.json';
if(process.argv[2]==='prepare'){
 const browser=function(){
  function assert(v,m){if(!v)throw Error(m)}
  function run(){
   const G=window.TT99Goodies,P=G.publishing,X=G.exportTools,host=document.getElementById('publication-samples');
   const results=[],warnings=[],issues=[],clipping=[];
   let seed=42137;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const catalog=P.catalogue();
   assert(catalog.length===20&&catalog.every(x=>P.supports(x.id)),'All 20 widgets must have publishing adapters');
   const vb=svg=>svg.getAttribute('viewBox').split(/\s+/).map(Number);
   function checkPage(svg,tool,kind){
     const [x,y,w,h]=vb(svg);
     assert(Math.abs(h/w-265/182)<.002,'Page printable area ratio');
     // A nested SVG's getBBox is in its own user coordinate system, not
     // the parent sheet coordinates. Compare its allocated viewport to
     // the sheet; independently transform actual text bounds to the sheet.
     const outside=b=>b.x<x-1||b.y<y-1||b.x+b.width>x+w+1||b.y+b.height>y+h+1;
     for(const node of svg.querySelectorAll(':scope > svg')){
       const b={x:node.x.baseVal.value,y:node.y.baseVal.value,width:node.width.baseVal.value,height:node.height.baseVal.value};
       if(outside(b))issues.push(tool+' '+kind+' item viewport outside page: '+JSON.stringify(b));
     }
     for(const node of svg.querySelectorAll(':scope > text')){
       if(outside(node.getBBox()))issues.push(tool+' '+kind+' page text outside page: '+node.textContent.slice(0,80));
     }
     for(const text of svg.querySelectorAll('text')){
       const mat=text.getScreenCTM(),root=svg.getScreenCTM();
       if(!mat||!root)continue;
       const b=text.getBBox(),m=root.inverse().multiply(mat);
       const corners=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));
       const left=Math.min(...corners.map(p=>p.x)),right=Math.max(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y)),bottom=Math.max(...corners.map(p=>p.y));
       if(text.ownerSVGElement!==svg&&outside({x:left,y:top,width:right-left,height:bottom-top}))clipping.push({tool,kind,text:text.textContent.slice(0,100)});
       const scale=Math.hypot(mat.a,mat.b)/Math.hypot(root.a,root.b);
       const size=parseFloat(getComputedStyle(text).fontSize)*scale*182/w*72/25.4;
       if(text.textContent.trim()&&size<7&&!text.hasAttribute('data-gd-paper-brand'))warnings.push({tool,kind,pointSize:Math.round(size*10)/10,text:text.textContent.slice(0,70)});
     }
   }
   for(const entry of catalog){
     const tool=entry.id;
     if(!entry.canGenerate){results.push({tool,status:'current illustration only'});continue}
     const settings=P.defaultSettings(tool),families=P.types(tool,settings),items=[];
     assert(families.length,'No compatible default question types: '+tool);
     for(const family of families){
       try{
         const draft=P.createDocument();
         draft.generate(tool,settings,1,family.id,rng);
         const item=draft.list()[0];item.id=items.length+1;items.push(item);
         assert(item.kind==='challenge'&&P.answerSummary(item)!=null&&String(P.answerSummary(item)).trim(),'Missing answer: '+family.id);
       }catch(err){issues.push(tool+'/'+family.id+': '+err.message)}
     }
     if(!items.length)continue;
     try{
       const sheets=P.pages(items,{title:entry.label+' — publication audit',teacher:true});
       const section=document.createElement('section');section.className='audit-widget';
       const h=document.createElement('h2');h.textContent=entry.label+' · '+items.length+' challenge families';section.appendChild(h);host.appendChild(section);
       const numbers=[],answers=[];
       for(const sheet of sheets){
         const kind=sheet.getAttribute('data-worksheet-answer'),prepared=X.preparePaperSvg(sheet);
         const frame=document.createElement('div');frame.className='audit-sheet';frame.appendChild(prepared);section.appendChild(frame);
         checkPage(prepared,tool,kind);
         numbers.push(...[...prepared.querySelectorAll('[data-pub-number]')].map(n=>Number(n.getAttribute('data-pub-number'))));
         answers.push(...[...prepared.querySelectorAll('[data-pub-answer-number]')].map(n=>Number(n.getAttribute('data-pub-answer-number'))));
       }
       const expected=items.map((_,i)=>i+1);
       assert(JSON.stringify(numbers)===JSON.stringify(expected),'Missing or repeated pupil question numbers');
       assert(JSON.stringify(answers)===JSON.stringify(expected),'Missing or repeated teacher answers');
       results.push({tool,families:families.map(f=>f.id),generated:items.length,pupilPages:sheets.filter(s=>s.getAttribute('data-worksheet-answer')==='pupil').length,annexPages:sheets.filter(s=>s.getAttribute('data-worksheet-answer')==='annex').length,graphics:sheets.reduce((n,s)=>n+s.querySelectorAll('[data-pub-answer-graphic]').length,0)});
     }catch(err){issues.push(tool+': '+err.message)}
   }
   const sample='A very long marking explanation. '+('Accept all equivalent mathematical explanations using the required units and exact values. '.repeat(15))+'End of marking explanation.';
   const wrapped=X.wrapPaperText(sample,430,20,600);
   assert(wrapped.join(' ')===sample.replace(/\s+/g,' ').trim(),'Measured wrapping preserves complete text');
   const report={widgets:results,issues,clipping,smallText:warnings.slice(0,250),smallTextCount:warnings.length,smallTextByWidget:Object.fromEntries(catalog.map(({id})=>[id,warnings.filter(w=>w.tool===id).length]))};
   document.getElementById('publication-report').textContent=JSON.stringify(report);
   document.getElementById('publication-status').textContent=issues.length?'FAIL':'PASS';
   document.getElementById('publication-summary').textContent=results.length+' widgets · '+results.reduce((n,r)=>n+(r.generated||0),0)+' challenge families · '+issues.length+' structural issues · '+warnings.length+' small text observations';
  }
  window.addEventListener('load',()=>{try{run()}catch(err){document.getElementById('publication-status').textContent='FAIL';document.getElementById('publication-report').textContent=JSON.stringify({issues:[err.message]})}});
 };
 fs.writeFileSync(file,'<!doctype html><html><head><meta charset="utf-8"><title>99 Club worksheet publication audit</title>'+styleTags+'<style>body{font:16px Arial,sans-serif;background:#edf1f1;margin:0;padding:24px}#tt99-goodies-root{display:none}.audit-widget{margin:24px auto;max-width:980px}.audit-sheet{width:min(100%,850px);margin:20px auto;background:white;box-shadow:0 2px 10px #0002}.audit-sheet>svg{display:block;width:100%;height:auto}#publication-report{white-space:pre-wrap;font-size:12px;overflow-wrap:anywhere} @media print{body{padding:0;background:white}.audit-sheet{break-after:page;box-shadow:none;width:100%;margin:0}.audit-widget>h2,#publication-report,#publication-summary,#publication-status,body>h1{display:none}}</style></head><body><h1>99 Club Studio — worksheet publication audit</h1><p id="publication-status">PENDING</p><p id="publication-summary"></p><div id="tt99-goodies-root"></div><div id="publication-samples"></div><pre id="publication-report"></pre>'+scriptTags+'<script>('+browser.toString()+')();</script></body></html>');
}else if(process.argv[2]==='check'){
 const html=fs.readFileSync(process.argv[3],'utf8');
 const status=html.match(/<p id="publication-status">([^<]*)<\/p>/)?.[1];
 const raw=html.match(/<pre id="publication-report">([\s\S]*?)<\/pre>/)?.[1]||'{}';
 const result=JSON.parse(raw.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'));
 fs.writeFileSync(report,JSON.stringify(result,null,2));
 console.log('Publication audit:',status, result.widgets?.length||0,'widgets;',result.smallTextCount||0,'small text observations');
 console.log(JSON.stringify({widgets:result.widgets||[],smallTextByWidget:result.smallTextByWidget,clipping:result.clipping},null,2));
 if(status!=='PASS'){console.error(JSON.stringify(result.issues||['Browser audit did not complete'],null,2));process.exitCode=1}
}else throw Error('Use prepare or check');
