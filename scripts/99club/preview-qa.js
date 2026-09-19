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
    const params=new URLSearchParams(location.search);
    const batches=Math.max(1,Math.min(8,Number(params.get('batches'))||2));
    const batch=Math.max(0,Math.min(batches-1,Number(params.get('batch'))||0));
    const cut=Math.ceil(all.length/batches),ids=all.slice(batch*cut,Math.min(all.length,(batch+1)*cut));
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
    const report={failures:[],passes:[],activities:0,pages:0,scaled:0,minScale:1,squareGrids:0,engineIds:[]};
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
    function inspectColourLogic(activity){
      const grid=activity.querySelector('.tt99-cl-paper-grid');if(!grid)return;
      const n=Math.max(1,Number(getComputedStyle(grid).getPropertyValue('--cl-n'))||1);
      const w=grid.offsetWidth,h=grid.offsetHeight,cell=w/n;
      if(Math.abs(w-h)>2)fail('colourlogic-geometry','Grid is not square: '+w+'×'+h);
      if(activity.closest('.tt99-game-activities.count-2')&&cell<38)fail('colourlogic-geometry','Half-page cells are too small: '+cell.toFixed(1)+' px');
    }

    function inspectSumGrid(activity){
      const stage=activity.querySelector('.tt99-sumgrid-stage'),board=activity.querySelector('.tt99-sumgrid-board');
      if(!stage||!board)return;
      const sr=stage.getBoundingClientRect(),br=board.getBoundingClientRect();
      if(Math.abs(br.width-br.height)>2)fail('sumgrid-geometry','Board is not square: '+br.width.toFixed(1)+'×'+br.height.toFixed(1));
      if(Math.abs(sr.width-br.width)>2||Math.abs(sr.height-br.height)>2)fail('sumgrid-geometry','Stage and board sizes differ');
      const targets=[[1,1],[2,1],[1,2],[2,2]],clueRects=[];
      [...activity.querySelectorAll('.tt99-sumgrid-clue')].forEach((el,i)=>{
        const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
        clueRects.push(r);
        const t=targets[i]||[0,0],ex=br.left+t[0]*br.width/3,ey=br.top+t[1]*br.height/3;
        if(Math.abs(cx-ex)>2||Math.abs(cy-ey)>2)fail('sumgrid-geometry','Circle '+(i+1)+' is misaligned by '+Math.round(cx-ex)+','+Math.round(cy-ey)+' px');
      });
      [...activity.querySelectorAll('.tt99-sumgrid-cell')].forEach(cell=>{
        const badge=cell.querySelector('.tt99-sumgrid-letter');if(!badge)return;
        const cr=cell.getBoundingClientRect(),r=badge.getBoundingClientRect();
        if(r.top<cr.top+4||r.bottom>cr.bottom-4||r.left<cr.left+4||r.right>cr.right-4)fail('sumgrid-geometry','Group badge is not inset inside its cell');
        for(const q of clueRects){
          const overlap=Math.min(r.right,q.right)-Math.max(r.left,q.left)>1&&Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top)>1;
          if(overlap){fail('sumgrid-geometry','Group badge overlaps a sum circle');break;}
        }
      });
      const clues=[...activity.querySelectorAll('.tt99-sumgrid-clue')].map(el=>el.getBoundingClientRect());
      [...activity.querySelectorAll('.tt99-sumgrid-cell')].forEach(cell=>{
        const badge=cell.querySelector('.tt99-sumgrid-letter');if(!badge)return;
        const cr=cell.getBoundingClientRect(),lr=badge.getBoundingClientRect();
        const cx=cr.left+cr.width/2,lx=lr.left+lr.width/2,ly=lr.top+lr.height/2;
        if(Math.abs(lx-cx)>2)fail('sumgrid-geometry','Group badge is not centred in its cell');
        for(const q of clues){
          const qx=q.left+q.width/2,qy=q.top+q.height/2,min=(q.width+lr.width)/2+2;
          if(Math.hypot(lx-qx,ly-qy)<min)fail('sumgrid-geometry','Group badge overlaps a sum circle');
        }
      });
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
      let stack=document.querySelector('.tt99-games-pupil-pages');
      const total=Number(window.TT99GamesPreviewPagerV155?.counts?.pupil)||Number(stack?.querySelector('[data-preview-total]')?.textContent)||1;
      const target=Math.min(3,total);
      if(target>1){
        const input=stack?.querySelector('.tt99-preview-pager input');
        if(input){input.value=String(target);input.dispatchEvent(new Event('change',{bubbles:true}));await sleep(180);}
      }
      stack=document.querySelector('.tt99-games-pupil-pages');
      const beforePage=Number(stack?.querySelector('.tt99-preview-pager input')?.value)||1;
      const activity=stack?.querySelector('.tt99-game-activity');
      const btn=activity?.querySelector('[data-replace-activity]');
      if(!activity||!btn){fail('preview-replace','Activity replacement control missing');return;}
      const before=activity.innerHTML;
      btn.click();
      await sleep(420);
      stack=document.querySelector('.tt99-games-pupil-pages');
      const after=stack?.querySelector('.tt99-game-activity')?.innerHTML||'';
      const afterPage=Number(stack?.querySelector('.tt99-preview-pager input')?.value)||1;
      if(!after||after===before)fail('preview-replace','Activity replacement did not change the puzzle');
      else pass('preview-replace','Activity replacement changed the rendered puzzle');
      if(afterPage!==beforePage)fail('preview-pager','Activity replacement moved preview from page '+beforePage+' to page '+afterPage);
      else pass('preview-pager','Activity replacement preserved preview page '+beforePage);
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
        report.engineIds=(window.__TT99_PREVIEW_QA_IDS||[]).slice();
        let stack=document.querySelector('.tt99-games-pupil-pages');
        if(!stack)return fail('boot','Pupil preview stack missing');
        const jumpToPage=async n=>{
          stack=document.querySelector('.tt99-games-pupil-pages');
          const input=stack?.querySelector('.tt99-preview-pager input');
          if(!input)return false;
          input.value=String(n);
          input.dispatchEvent(new Event('change',{bubbles:true}));
          await sleep(180);
          stack=document.querySelector('.tt99-games-pupil-pages');
          return Number(stack?.querySelector('.tt99-preview-pager input')?.value)===n;
        };
        const total=Number(window.TT99GamesPreviewPagerV155?.counts?.pupil)||Number(stack.querySelector('[data-preview-total]')?.textContent)||stack.querySelectorAll('.tt99-game-paper').length;
        report.pages=total;if(!total)return fail('boot','No printable preview pages generated');
        if(total>1){
          if(!(await jumpToPage(1)))fail('pager','Could not reset preview to page 1');
          else{
            const next=stack.querySelector('[data-preview-next]');
            if(!next||next.disabled)fail('pager','Next button is disabled on page 1 of '+total);
            else{
              next.click();await sleep(180);
              stack=document.querySelector('.tt99-games-pupil-pages');
              const pageAfterNext=Number(stack?.querySelector('.tt99-preview-pager input')?.value)||0;
              if(pageAfterNext!==2)fail('pager','Next button moved to page '+pageAfterNext+' instead of page 2');
              else pass('pager','Next button advanced from page 1 to page 2');
            }
            await jumpToPage(1);
          }
        }
        for(let i=0;i<total;i++){
          if(!(await jumpToPage(i+1))){fail('pager','Could not jump to preview page '+(i+1)+' of '+total);break;}
          window.TT99GamesPreviewFitV207?.refresh?.();
          await sleep(i?120:450);
          stack=document.querySelector('.tt99-games-pupil-pages');
          const p=stack?.querySelector(':scope > article.tt99-game-paper');
          if(!p){fail('boot','Preview page '+(i+1)+' was not mounted');break;}
          for(const a of p.querySelectorAll('.tt99-game-activity'))inspectActivity(a);
          for(const g of p.querySelectorAll('.tt99-kakuro-grid,.tt99-cage-grid,.tt99-numberpath-grid,.tt99-extra-path-grid,.tt99-extra-search-grid,.tt99-extra-perimeter-grid,.tt99-shikaku-grid,.tt99-sumgrid-board'))inspectSquareGrid(g);
          for(const g of p.querySelectorAll('.tt99-crossword-grid'))inspectCrosswordGrid(g);
          for(const a of p.querySelectorAll('.tt99-game-activity'))inspectSumGrid(a);
          for(const a of p.querySelectorAll('.tt99-colourlogic-print'))inspectColourLogic(a);
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
  if(report.failures?.length&&report.engineIds?.length)console.error('Batch engines: '+report.engineIds.join(', '));
  console.log('Preview QA: '+(report.failures||[]).length+' failure(s), '+report.activities+' activities, '+report.pages+' pages, '+report.scaled+' scaled, min scale '+report.minScale.toFixed(3)+'.');
  if(report.failures?.length)process.exit(1);
}
if(mode==='prepare')prepare();else if(mode==='check')check(process.argv[3]);else{console.error('Usage: preview-qa.js prepare | check <dumped-dom-file>');process.exit(2);}
