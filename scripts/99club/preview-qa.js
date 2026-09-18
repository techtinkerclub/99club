#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const mode=process.argv[2]||'prepare';
const HARNESS=path.join(ROOT,'99club-preview-qa.html');
function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}
function localTags(page,kind){
  const text=read(page),rx=kind==='css'?/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g:/<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/g;
  return [...text.matchAll(rx)].map(m=>m[1]).filter(u=>u.startsWith('/assets/99club/'));
}
function prepare(){
  const page='_pages/99-club-games.md';
  const css=[...new Set(localTags(page,'css'))],js=localTags(page,'js');
  const topics=['number_place_value','calculation','fractions','decimals_percentages','ratio_proportion','measurement','geometry','statistics','algebra'];
  const setup=String.raw`<script>
  (function(){
    const G=window.TT99Games;if(!G)return;
    const all=Object.entries(G.ENGINES||{}).filter(([,d])=>!d?.hiddenFromLibrary).map(([id])=>id);
    const batch=Math.max(0,Math.min(1,Number(new URLSearchParams(location.search).get('batch'))||0));
    const cut=Math.ceil(all.length/2),ids=batch?all.slice(cut):all.slice(0,cut);
    window.__TT99_PREVIEW_QA_IDS=ids.slice();
    localStorage.setItem('tt99-games-pack-mode-v1','manual');
    localStorage.setItem('tt99-games-activity-count-v1',String(ids.length));
    localStorage.setItem('tt99-games-activities-per-sheet-v2','2');
    localStorage.setItem('tt99-games-settings-v4',JSON.stringify({
      minYear:6,maxYear:6,topics:${JSON.stringify(topics)},
      activityCount:ids.length,sheets:Math.ceil(ids.length/2),activitiesPerSheet:2,includeAnswers:true,workedExamples:'none',
      selectedEngines:ids,personalisation:{schoolName:'',packTitle:'Preview QA',classLabel:'',worksheetDate:'',logoDataUrl:'',logoWidth:0,logoHeight:0},
      engineSettings:{}
    }));
  })();
  </script>`;
  const scripts=js.map(u=>u.includes('/games-app.js')?setup+`<script src="${u}"><\/script>`:`<script src="${u}"><\/script>`).join('\n');
  const runner=String.raw`
  <script>
  (function(){
    const report={failures:[],passes:[],activities:0,pages:0,scaled:0,minScale:1,squareGrids:0};
    const fail=(area,msg)=>report.failures.push({area,msg});
    const pass=(area,msg)=>report.passes.push({area,msg});
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
    function finish(){
      const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(report))));
      const pre=document.createElement('pre');pre.id='preview-qa-result';pre.dataset.status=report.failures.length?'fail':'pass';pre.textContent=encoded;document.body.appendChild(pre);
      document.documentElement.dataset.previewQaStatus=pre.dataset.status;document.title='99club-preview-qa:'+pre.dataset.status;
    }
    function titleOf(a){return a.querySelector('.tt99-game-activity-head h3')?.textContent?.trim()||a.className;}
    function inspectActivity(a){
      report.activities++;
      const ar=a.getBoundingClientRect(),tol=2.5;
      const scale=Number(a.dataset.previewBodyScale||1);if(scale<.999){report.scaled++;report.minScale=Math.min(report.minScale,scale);}
      const descendants=[...a.querySelectorAll('*')].filter(e=>visible(e)&&!e.closest('.tt99-replace-activity'));
      for(const e of descendants){
        const r=e.getBoundingClientRect();
        if(r.right>ar.right+tol||r.left<ar.left-tol||r.bottom>ar.bottom+tol||r.top<ar.top-tol){
          fail('containment',titleOf(a)+' -> '+e.className+' outside frame by '+JSON.stringify({left:Math.round(ar.left-r.left),right:Math.round(r.right-ar.right),top:Math.round(ar.top-r.top),bottom:Math.round(r.bottom-ar.bottom)}));
          break;
        }
      }
    }
    function inspectSquareGrid(g){
      const cells=[...g.children].filter(visible);if(!cells.length)return;
      const r0=cells[0].getBoundingClientRect();if(!r0.width||!r0.height)return;
      report.squareGrids++;
      if(Math.abs(r0.width-r0.height)>2)fail('square-grid',(g.className||'grid')+' first cell is '+r0.width.toFixed(1)+'×'+r0.height.toFixed(1));
      for(const c of cells.slice(1,Math.min(cells.length,12))){
        const r=c.getBoundingClientRect();
        if(Math.abs(r.width-r0.width)>2||Math.abs(r.height-r0.height)>2) {fail('square-grid',(g.className||'grid')+' has unequal cell tracks');break;}
      }
    }
    function inspectCrosswordGrid(g){
      const style=getComputedStyle(g),cols=Math.max(1,Number(style.getPropertyValue('--cw'))||1),rows=Math.max(1,Number(style.getPropertyValue('--ch'))||1);
      const gr=g.getBoundingClientRect(),expected=cols/rows,actual=gr.width/Math.max(1,gr.height);
      if(Math.abs(actual-expected)>.03)fail('crossword-geometry','Grid ratio '+actual.toFixed(3)+' does not match '+cols+'×'+rows);
      const cells=[...g.querySelectorAll(':scope > span.open')].filter(visible);
      const byPos=new Map();
      for(const el of cells){
        const s=getComputedStyle(el),col=Number(s.gridColumnStart),row=Number(s.gridRowStart),r=el.getBoundingClientRect();
        if(Math.abs(r.width-r.height)>2)fail('crossword-geometry','Cell '+col+','+row+' is not square: '+r.width.toFixed(1)+'×'+r.height.toFixed(1));
        byPos.set(col+':'+row,{r,col,row});
      }
      for(const {r,col,row} of byPos.values()){
        const right=byPos.get((col+1)+':'+row),down=byPos.get(col+':'+(row+1));
        if(right&&Math.abs(right.r.left-r.right)>2)fail('crossword-geometry','Across cells '+col+','+row+' and '+(col+1)+','+row+' do not touch');
        if(down&&Math.abs(down.r.top-r.bottom)>2)fail('crossword-geometry','Down cells '+col+','+row+' and '+col+','+(row+1)+' do not touch');
      }
    }

    async function previewReplaceTest(){
      const stack=document.querySelector('.tt99-games-pupil-pages');
      const activity=stack?.querySelector('.tt99-game-activity');
      const btn=activity?.querySelector('[data-replace-activity]');
      if(!activity||!btn){fail('preview-replace','Activity replacement control missing');return;}
      const before=activity.innerHTML;
      btn.click();
      await sleep(220);
      const after=document.querySelector('.tt99-games-pupil-pages .tt99-game-activity')?.innerHTML||'';
      if(!after||after===before)fail('preview-replace','Activity replacement did not change the puzzle');
      else pass('preview-replace','Activity replacement changed the rendered puzzle');
    }
    async function configurePlacementTest(){
      const cardTitle=card=>(card?.querySelector('.tt99-engine-include b')?.textContent||'').trim();
      const titles=[...document.querySelectorAll('.tt99-engine-card')].map(cardTitle).filter(Boolean);
      let checked=0;
      for(const title of titles){
        const card=[...document.querySelectorAll('.tt99-engine-card')].find(x=>cardTitle(x)===title);
        const btn=card?.querySelector('.tt99-engine-configure:not([disabled])');
        if(!btn)continue;
        btn.click(); await sleep(45);
        const current=[...document.querySelectorAll('.tt99-engine-card')].find(x=>cardTitle(x)===title);
        const panel=document.querySelector('.tt99-engine-panel');
        if(!current||!panel){fail('configure-placement',title+': configuration panel did not open');continue;}
        if(panel.previousElementSibling!==current)fail('configure-placement',title+': configuration panel is not directly under its game card');
        else checked++;
      }
      if(!checked)fail('configure-placement','No enabled game configuration panels were exercised');
      else pass('configure-placement',checked+' game configuration panels opened directly under their cards');
    }
    async function run(){
      try{
        await sleep(1800);
        await previewReplaceTest();
        await configurePlacementTest();
        const stack=document.querySelector('.tt99-games-pupil-pages');
        if(!stack)return fail('boot','Pupil preview stack missing');
        const total=Number(window.TT99GamesPreviewPagerV155?.counts?.pupil)||Number(stack.querySelector('[data-preview-total]')?.textContent)||stack.querySelectorAll('.tt99-game-paper').length;
        report.pages=total;if(!total)return fail('boot','No printable preview pages generated');
        for(let i=0;i<total;i++){
          window.TT99GamesPreviewFitV207?.refresh?.();
          await sleep(i?120:450);
          const p=stack.querySelector(':scope > article.tt99-game-paper');
          if(!p){fail('boot','Preview page '+(i+1)+' was not mounted');break;}
          for(const a of p.querySelectorAll('.tt99-game-activity'))inspectActivity(a);
          for(const g of p.querySelectorAll('.tt99-kakuro-grid,.tt99-cage-grid,.tt99-numberpath-grid,.tt99-extra-path-grid,.tt99-extra-search-grid,.tt99-extra-perimeter-grid,.tt99-shikaku-grid,.tt99-sumgrid-board'))inspectSquareGrid(g);
          for(const g of p.querySelectorAll('.tt99-crossword-grid'))inspectCrosswordGrid(g);
          if(i<total-1){
            const next=stack.querySelector('[data-preview-next]');
            if(!next||next.disabled){fail('pager','Could not advance from preview page '+(i+1));break;}
            next.click();
          }
        }
        const expected=(window.__TT99_PREVIEW_QA_IDS||[]).length;
        if(report.activities<expected)fail('catalogue','Only '+report.activities+' pupil activities rendered for '+expected+' selected engines in this batch');
        else pass('catalogue',report.activities+' activities inspected across '+report.pages+' pages');
        pass('square-grid',report.squareGrids+' square-grid instances checked in this batch');
        if(!report.failures.length)pass('containment','All rendered puzzle bodies remained inside their activity frames');
      }catch(e){fail('runner',(e&&e.stack)||String(e));}
      finally{finish();}
    }
    window.addEventListener('error',e=>fail('runtime',e.message||String(e.error||'window error')));
    window.addEventListener('unhandledrejection',e=>fail('runtime','Unhandled rejection: '+String(e.reason||'')));
    if(document.readyState==='complete')run();else window.addEventListener('load',run,{once:true});
  })();
  </script>`;
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css.map(u=>`<link rel="stylesheet" href="${u}">`).join('\n')}<style>body{margin:0}.tt99-games-shell{max-width:1200px;margin:0 auto}#preview-qa-result{display:block}</style></head><body><div id="tt99-games-root"></div>${scripts}${runner}</body></html>`;
  fs.writeFileSync(HARNESS,html);console.log('Prepared '+path.basename(HARNESS)+' with '+js.length+' scripts and '+css.length+' stylesheets.');
}
function check(file){
  const dom=fs.readFileSync(file,'utf8'),m=dom.match(/<pre[^>]*id=["']preview-qa-result["'][^>]*>([A-Za-z0-9+/=]+)<\/pre>/i);
  if(!m){console.error('Preview QA result marker not found.');process.exit(1);}
  const report=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));
  fs.writeFileSync(path.join(ROOT,'99club-preview-qa-report.json'),JSON.stringify(report,null,2)+'\n');
  for(const x of report.failures||[])console.error('FAIL ['+x.area+'] '+x.msg);
  console.log('Preview QA: '+(report.failures||[]).length+' failure(s), '+report.activities+' activities, '+report.pages+' pages, '+report.scaled+' scaled, min scale '+report.minScale.toFixed(3)+'.');
  if(report.failures?.length)process.exit(1);
}
if(mode==='prepare')prepare();else if(mode==='check')check(process.argv[3]);else{console.error('Usage: preview-qa.js prepare | check <dumped-dom-file>');process.exit(2);}
