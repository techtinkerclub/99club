#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const mode=process.argv[2]||'prepare';
const HARNESS=path.join(ROOT,'99club-browser-qa.html');
function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}
function localTags(page,kind){
  const text=read(page),rx=kind==='css'?/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g:/<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/g;
  return [...text.matchAll(rx)].map(m=>m[1]).filter(u=>u.startsWith('/assets/99club/'));
}
function prepare(){
  const css=[...new Set(localTags('_pages/99-club-games-play.md','css'))];
  const js=localTags('_pages/99-club-games-play.md','js');
  const runner=String.raw`
  (function(){
    const report={failures:[],warnings:[],passes:[],games:[]};
    const fail=(area,msg)=>{report.failures.push({area,msg});console.error('QA FAIL',area,msg)};
    const warn=(area,msg)=>{report.warnings.push({area,msg});console.warn('QA WARN',area,msg)};
    const pass=(area,msg)=>report.passes.push({area,msg});
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    function finish(){
      const json=JSON.stringify(report),encoded=btoa(unescape(encodeURIComponent(json)));
      let pre=document.getElementById('qa-result');if(!pre){pre=document.createElement('pre');pre.id='qa-result';document.body.appendChild(pre);}
      pre.textContent=encoded;pre.dataset.status=report.failures.length?'fail':'pass';
      document.documentElement.dataset.qaStatus=pre.dataset.status;
      document.title='99club-browser-qa:'+pre.dataset.status;
    }
    window.addEventListener('error',e=>fail('runtime',e.message||String(e.error||'window error')));
    window.addEventListener('unhandledrejection',e=>fail('runtime','Unhandled rejection: '+String(e.reason||'')));
    async function genericAdapterTests(){
      const P=window.TT99GamesPlay;if(!P){fail('boot','TT99GamesPlay missing');return;}
      const list=P.gameList||[];if(list.length<35)fail('catalogue','Expected at least 35 online games, found '+list.length);else pass('catalogue',list.length+' online games registered');
      const scratch=document.createElement('div');scratch.id='qa-scratch';scratch.style.cssText='position:absolute;left:-10000px;top:0;width:390px;max-width:390px;visibility:hidden;';document.body.appendChild(scratch);
      for(const a of list){
        const item={id:a.id,warnings:[]};report.games.push(item);
        try{
          scratch.className='';scratch.innerHTML='';
          const cfg=a.normalizeConfig?a.normalizeConfig({difficulty:'standard'}):{};
          const puzzle=a.createPuzzle(cfg,'browser-qa:'+a.id+':0');
          if(!puzzle||puzzle.error){fail(a.id,'createPuzzle failed: '+(puzzle&&puzzle.error||'empty puzzle'));continue;}
          if(puzzle.engineId&&puzzle.engineId!==a.id){const m='adapter '+a.id+' returned engineId '+puzzle.engineId;warn('engine-map',m);item.warnings.push(m);}
          let changed=0;
          const view=a.mount(scratch,puzzle,{onChange:()=>changed++,onStatus:()=>{},isPaused:()=>false});
          for(const fn of ['snapshot','restore','emptySnapshot','progress','check','hint','setFinished','destroy'])if(typeof view?.[fn]!=='function')fail(a.id,'missing view contract '+fn+'()');
          if(view){
            const snap=view.snapshot?.();if(snap==null)fail(a.id,'snapshot() returned null/undefined');
            const progress=view.progress?.();if(typeof progress!=='string')fail(a.id,'progress() did not return text');
            const check=view.check?.({silent:true});if(!check||typeof check.complete!=='boolean')fail(a.id,'check() did not return {complete:boolean}');
            const hint=view.hint?.();if(!hint||typeof hint.message!=='string')fail(a.id,'hint() did not return a message');
            view.setFinished?.(true);view.setFinished?.(false);
            const empty=view.emptySnapshot?.();if(empty==null)fail(a.id,'emptySnapshot() returned null/undefined');else view.restore?.(empty);
            if(typeof view.revealAnswer!=='function')fail(a.id,'missing revealAnswer() contract');
            else{
              const revealed=view.revealAnswer();
              if(revealed===false)fail(a.id,'revealAnswer() declined to reveal the solution');
              const solved=view.check?.({silent:false});
              if(!solved?.complete)fail(a.id,'revealed answer does not produce a complete solved state');
            }
          }
          const width=scratch.clientWidth||390,overflow=scratch.scrollWidth-width;
          if(overflow>8){const m='mobile-width overflow '+Math.round(overflow)+'px at 390px';warn('mobile-layout',a.id+': '+m);item.warnings.push(m);}
          const tiny=[...scratch.querySelectorAll('button:not([hidden])')].filter(b=>{const r=b.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<28||r.height<28);});
          if(tiny.length){const m=tiny.length+' very small tap target(s) under 28px';warn('tap-target',a.id+': '+m);item.warnings.push(m);}
          view?.destroy?.();pass('adapter',a.id+' mounted and core controls responded');
        }catch(e){fail(a.id,(e&&e.stack)||String(e));}
      }
      scratch.remove();
    }
    async function brokenCalcTest(){
      try{
        const U=window.TT99PlayArithmetic,a=window.TT99GamesPlay?.adapters?.get('brokencalc');
        if(!U||!a){fail('brokencalc','adapter/evaluator missing');return;}
        const v=U.evaluate(['7','+','2','×','5']);if(v!==17)fail('brokencalc','7 + 2 × 5 evaluated as '+v+' instead of 17');
        const host=document.createElement('div');document.body.appendChild(host);const c=a.normalizeConfig({difficulty:'standard'}),p=a.createPuzzle(c,'browser-qa:calc');const view=a.mount(host,p,{onChange:()=>{},onStatus:()=>{},isPaused:()=>false});
        if(host.querySelector('[data-calc-key="("],[data-calc-key=")"]'))fail('brokencalc','bracket keys are visible');else pass('brokencalc','standard precedence active and bracket keys absent');
        view.destroy?.();host.remove();
      }catch(e){fail('brokencalc',(e&&e.stack)||String(e));}
    }
    async function colourFillTest(){
      try{
        const a=window.TT99GamesPlay?.adapters?.get('colourlogic');if(!a)return fail('colourlogic','adapter missing');
        const host=document.createElement('div');host.style.width='390px';document.body.appendChild(host);const c=a.normalizeConfig({difficulty:'easy',layout:'row'}),p=a.createPuzzle(c,'browser-qa:colour');const view=a.mount(host,p,{onChange:()=>{},onStatus:()=>{},isPaused:()=>false});
        const cell=host.querySelector('[data-cl-cell]');cell?.click();await sleep(30);
        if(!cell?.classList.contains('has-colour'))fail('colourlogic','tapping a box did not select a colour');
        else{const bg=getComputedStyle(cell).backgroundColor;if(!bg||bg==='rgb(255, 255, 255)'||bg==='rgba(0, 0, 0, 0)')fail('colourlogic','selected colour did not fill the whole box');else pass('colourlogic','whole-box colour fill verified');}
        view.destroy?.();host.remove();
      }catch(e){fail('colourlogic',(e&&e.stack)||String(e));}
    }
    async function perimeterDirectTest(){
      try{
        const a=window.TT99GamesPlay?.adapters?.get('perimeterregions');if(!a)return fail('perimeterregions','adapter missing');
        const host=document.createElement('div');host.style.width='390px';document.body.appendChild(host);const cfg=a.normalizeConfig({difficulty:'standard'}),p=a.createPuzzle(cfg,'browser-qa:perimeter');let changed=0;const view=a.mount(host,p,{onChange:()=>changed++,onStatus:()=>{},isPaused:()=>false});
        const edge=host.querySelector('[data-edge]');if(!edge){fail('perimeterregions','direct boundary controls are missing');view.destroy?.();host.remove();return;}
        const r=edge.getBoundingClientRect(),evt={bubbles:true,pointerId:31,clientX:r.left+r.width/2,clientY:r.top+r.height/2};
        edge.dispatchEvent(new PointerEvent('pointerdown',evt));edge.dispatchEvent(new PointerEvent('pointerup',evt));await sleep(30);
        if(!view.snapshot().length||changed<1)fail('perimeterregions','tapping a grid line did not draw a boundary');else pass('perimeterregions','direct grid-line boundary interaction verified');
        view.destroy?.();host.remove();
      }catch(e){fail('perimeterregions',(e&&e.stack)||String(e));}
    }
    async function alphameticsVarietyTest(){
      try{
        const a=window.TT99GamesPlay?.adapters?.get('alphametics'),lib=window.TT99AlphaLibrary;if(!a)return fail('alphametics','adapter missing');if(!lib||!Array.isArray(lib.templates)||lib.templates.length<60)return fail('alphametics','full curated word library is not loaded online');
        const cfg=a.normalizeConfig({difficulty:'standard',hintLevel:'auto',theme:'auto',template:'auto'}),seen=new Set();for(let i=0;i<14;i++){const p=a.createPuzzle(cfg,'browser-qa:alpha:'+i);seen.add(p.templateId);}
        if(seen.size<5)fail('alphametics','New puzzle seeds are not producing enough word-puzzle variety ('+seen.size+' distinct)');else pass('alphametics','full library loaded and '+seen.size+' standard puzzles sampled');
      }catch(e){fail('alphametics',(e&&e.stack)||String(e));}
    }
    async function groupedLibraryTest(){
      try{
        const open=document.getElementById('tt99-play-change-game'),search=document.getElementById('tt99-play-library-search'),grid=document.getElementById('tt99-play-library-grid');
        if(!open||!search||!grid)return fail('grouped-library','library controls missing');
        open.click();await sleep(80);
        let groups=[...grid.querySelectorAll('.tt99-play-library-group')];
        if(groups.length<6)fail('grouped-library','expected six grouped sections, found '+groups.length);
        search.value='Perimeter Regions';search.dispatchEvent(new Event('input',{bubbles:true}));await sleep(100);
        const card=grid.querySelector('[data-game-id="perimeterregions"]'),parent=card?.closest('.tt99-play-library-group');
        if(!card)fail('grouped-library','search did not retain Perimeter Regions');
        else if(!parent?.open)fail('grouped-library','search result group did not open automatically');
        else pass('grouped-library','accordion groups and cross-group search verified');
        search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));await sleep(60);
      }catch(e){fail('grouped-library',(e&&e.stack)||String(e));}
    }
    async function drawerTest(){
      try{
        const P=window.TT99GamesPlay,a=P?.adapters?.get('numberwheels'),board=document.getElementById('tt99-play-board');if(!a||!board)return fail('mobile-drawer','Number Connections adapter or board missing');
        board.innerHTML='';board.className='';const c=a.normalizeConfig({difficulty:'challenge',style:'factor',itemCount:'6'}),p=a.createPuzzle(c,'browser-qa:drawer');const view=a.mount(board,p,{onChange:()=>{},onStatus:()=>{},isPaused:()=>false});
        await sleep(60);const entries=[...board.querySelectorAll('[data-conn-entry]')],pad=board.querySelector('.tt99-wave184-keypad,.tt99-wave186-keypad,.tt99-v196-keypad');
        if(entries.length<2||!pad){fail('mobile-drawer','long Factor Web did not expose entries/keypad');view.destroy?.();return;}
        const compact=window.innerWidth<=700;
        entries[0].click();await sleep(120);
        if(compact){
          if(!pad.classList.contains('tt99-context-pad-active'))fail('keypad-drawer','compact/touch layout did not auto-open the drawer');
        }else{
          if(pad.classList.contains('tt99-context-pad-active'))fail('keypad-drawer','desktop layout auto-opened the on-screen keypad');
          const launcher=board.querySelector('.tt99-context-pad-launcher');
          if(!launcher)fail('keypad-drawer','desktop keypad launcher missing');
          else{launcher.click();await sleep(80);if(!pad.classList.contains('tt99-context-pad-active'))fail('keypad-drawer','desktop keypad launcher did not open the drawer');}
        }
        entries[1].click();await sleep(80);
        if(!pad.classList.contains('tt99-context-pad-active'))fail('keypad-drawer','drawer closed when moving to another fillable box');
        const handle=pad.querySelector('.tt99-context-pad-handle'),toggle=pad.querySelector('.tt99-context-pad-toggle');if(!handle||!toggle)fail('keypad-drawer','drawer handle/toggle missing');else{toggle.click();await sleep(30);if(!pad.classList.contains('tt99-context-pad-collapsed'))fail('keypad-drawer','toggle did not collapse drawer');toggle.click();await sleep(30);if(pad.classList.contains('tt99-context-pad-collapsed'))fail('keypad-drawer','toggle did not reopen drawer');}
        if(!compact&&handle&&typeof PointerEvent==='function'){const r=pad.getBoundingClientRect(),x=r.left+40,y=r.top+12;handle.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7,pointerType:'mouse',clientX:x,clientY:y}));document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:7,pointerType:'mouse',clientX:x+70,clientY:y+35}));document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:7,pointerType:'mouse',clientX:x+70,clientY:y+35}));await sleep(40);if(!pad.classList.contains('tt99-context-pad-moved'))fail('keypad-drawer','desktop drawer did not become draggable');const reset=pad.querySelector('.tt99-context-pad-reset');if(!reset)fail('keypad-drawer','desktop reset-position control missing');else{reset.click();await sleep(20);if(pad.classList.contains('tt99-context-pad-moved'))fail('keypad-drawer','reset-position control did not restore default position');}}
        const outside=board.querySelector('.tt99-conn-card header')||document.body;outside.click();await sleep(40);if(pad.classList.contains('tt99-context-pad-active'))fail('keypad-drawer','outside tap did not dismiss drawer');
        const launcher=board.querySelector('.tt99-context-pad-launcher');launcher?.click();await sleep(30);
        if(typeof window.TT99ContextKeypad?.hide!=='function')fail('keypad-drawer','completion close hook is missing');
        else{window.TT99ContextKeypad.hide();await sleep(20);if(pad.classList.contains('tt99-context-pad-active'))fail('keypad-drawer','completion close hook left the keypad open');else pass('keypad-drawer',compact?'compact drawer interactions and completion close hook verified':'desktop drawer interactions and completion close hook verified');}
        view.destroy?.();
      }catch(e){fail('mobile-drawer',(e&&e.stack)||String(e));}
    }
    async function sumGridContainmentTest(){
      try{
        const P=window.TT99GamesPlay;
        for(const id of ['cornersum','linkedsum']){
          const a=P?.adapters?.get(id);
          if(!a){fail('sumgrid-mobile',id+' adapter missing');continue;}
          const frame=document.createElement('div');
          frame.style.cssText='position:absolute;left:-10000px;top:0;width:332px;max-width:332px;box-sizing:border-box;overflow:hidden;';
          const host=document.createElement('div');frame.appendChild(host);document.body.appendChild(frame);
          const cfg=a.normalizeConfig({difficulty:'standard'}),p=a.createPuzzle(cfg,'browser-qa:sumgrid:'+id);
          const view=a.mount(host,p,{onChange:()=>{},onStatus:()=>{},isPaused:()=>false});
          await sleep(30);
          const board=host.querySelector('[data-sumgrid-board]'),grid=host.querySelector('.tt99-numbergrid'),groups=host.querySelector('.tt99-play-sumgrid-groups');
          if(!board||!grid)fail('sumgrid-mobile',id+' board/grid missing');
          else{
            const fr=frame.getBoundingClientRect(),br=board.getBoundingClientRect(),gr=grid.getBoundingClientRect();
            if(br.left<fr.left-.5||br.right>fr.right+.5)fail('sumgrid-mobile',id+' board escapes 332px mobile frame');
            if(gr.left<br.left-.5||gr.right>br.right+.5)fail('sumgrid-mobile',id+' number grid escapes its board wrapper');
            if(grid.scrollWidth>grid.clientWidth+1)fail('sumgrid-mobile',id+' grid has internal horizontal overflow');
            if(groups&&groups.scrollWidth>groups.clientWidth+1)fail('sumgrid-mobile',id+' A/B/C totals row overflows horizontally');
          }
          view.destroy?.();frame.remove();
        }
        pass('sumgrid-mobile','Corner Sum and Linked Sum stay inside a 332px mobile frame');
      }catch(e){fail('sumgrid-mobile',(e&&e.stack)||String(e));}
    }
    async function hintPopupTest(){
      try{
        const btn=document.getElementById('tt99-play-hint'),popup=document.getElementById('tt99-play-hint-popup'),close=document.getElementById('tt99-play-hint-popup-close');
        if(!btn||!popup||!close)return fail('hint-popup','hint popup controls missing');
        btn.click();await sleep(80);
        if(popup.hidden)fail('hint-popup','Hint did not open floating popup');
        else{
          const r=popup.getBoundingClientRect();
          if(r.width<180||r.height<50)fail('hint-popup','floating hint popup has invalid dimensions');
          close.click();await sleep(30);
          if(!popup.hidden)fail('hint-popup','close control did not dismiss popup');else pass('hint-popup','floating hint opens and closes correctly');
        }
      }catch(e){fail('hint-popup',(e&&e.stack)||String(e));}
    }
    async function answerRevealFlowTest(){
      try{
        const wrap=document.getElementById('tt99-play-answer-reveal'),open=document.getElementById('tt99-play-reveal-open'),confirm=document.getElementById('tt99-play-reveal-confirm'),cancel=document.getElementById('tt99-play-reveal-cancel'),reveal=document.getElementById('tt99-play-reveal-confirm-btn'),note=document.getElementById('tt99-play-reveal-note'),complete=document.getElementById('tt99-play-complete'),streak=document.getElementById('tt99-play-streak'),best=document.getElementById('tt99-play-best');
        if(!wrap||!open||!confirm||!cancel||!reveal||!note||!complete)return fail('answer-reveal-ui','answer reveal controls missing');
        if(wrap.hidden||open.hidden)return fail('answer-reveal-ui','quiet Show answers action is not available on an active puzzle');
        const streakBefore=streak?.textContent||'',bestBefore=best?.textContent||'';
        open.click();await sleep(30);
        if(confirm.hidden||!open.hidden)fail('answer-reveal-ui','first click did not open the confirmation step');
        cancel.click();await sleep(30);
        if(!confirm.hidden||open.hidden)fail('answer-reveal-ui','Cancel did not return to the quiet Show answers link');
        open.click();await sleep(20);reveal.click();await sleep(80);
        if(note.hidden)fail('answer-reveal-ui','post-reveal no-score explanation is missing');
        if(!complete.hidden)fail('answer-reveal-ui','revealing answers incorrectly opened the completion card');
        if((streak?.textContent||'')!==streakBefore)fail('answer-reveal-ui','revealing answers changed the solved streak');
        if((best?.textContent||'')!==bestBefore)fail('answer-reveal-ui','revealing answers changed the personal best');
        const status=document.getElementById('tt99-play-status')?.textContent||'';
        if(!/not count/i.test(status))fail('answer-reveal-ui','status does not explain that the revealed attempt is unscored');
        else pass('answer-reveal-ui','two-step reveal, cancel path and no-score behaviour verified');
      }catch(e){fail('answer-reveal-ui',(e&&e.stack)||String(e));}
    }
    async function completionSplashFitTest(){
      try{
        const board=document.getElementById('tt99-play-board'),popup=document.getElementById('tt99-play-complete'),api=window.TT99CompletionPreview;
        if(!board||!popup||!api?.injectPreview)return fail('completion-splash','completion preview API/hosts missing');
        popup.hidden=true;
        popup.innerHTML='<div class="tt99-play-complete-card"><span class="tt99-play-complete-mark">✓</span><div><small>Puzzle complete</small><h2>QA solved puzzle</h2><p>Completion overlay fixture.</p><div class="tt99-play-complete-actions"><button>New puzzle</button></div></div></div>';
        board.className='';
        board.innerHTML='<div data-qa-solved style="width:760px;height:980px;max-width:none;background:#fff"><button class="tt99-context-pad-launcher">Keypad</button><div class="tt99-number-keypad tt99-context-pad-active"><button>1</button></div><div style="height:940px;width:740px">Solved board</div></div>';
        popup.hidden=false;
        api.injectPreview();
        await sleep(140);
        const solution=popup.querySelector('.tt99-play-complete-solution'),host=popup.querySelector('.tt99-play-complete-solution-board'),clone=popup.querySelector('.tt99-play-complete-snapshot'),frame=popup.querySelector('.tt99-play-complete-snapshot-fit');
        if(!solution||!host||!clone||!frame)return fail('completion-splash','solved snapshot was not injected');
        if(clone.querySelector('.tt99-context-pad-launcher,.tt99-number-keypad,.tt99-context-pad-handle,.tt99-wave184-keypad,.tt99-wave186-keypad,.tt99-v196-keypad,.tt99-alpha-pad,.tt99-towers-keypad,.tt99-crossnumber-keypad,.tt99-letter-keypad,.tt99-extra-op-pad'))fail('completion-splash','snapshot still contains keypad UI');
        const hr=host.getBoundingClientRect(),fr=frame.getBoundingClientRect();
        const scale=Number(clone.dataset.tt99FitScale||1),diag=' host='+Math.round(hr.width)+'x'+Math.round(hr.height)+' frame='+Math.round(fr.width)+'x'+Math.round(fr.height)+' scroll='+host.scrollWidth+'x'+host.scrollHeight+' client='+host.clientWidth+'x'+host.clientHeight+' scale='+scale+' natural='+(clone.dataset.tt99NaturalWidth||'?')+'x'+(clone.dataset.tt99NaturalHeight||'?');
        if(fr.left<hr.left-1||fr.right>hr.right+1||fr.top<hr.top-1||fr.bottom>hr.bottom+1)fail('completion-splash','scaled solved snapshot escapes the splash preview frame'+diag);
        if(host.scrollWidth>host.clientWidth+2||host.scrollHeight>host.clientHeight+2)fail('completion-splash','solved snapshot still requires internal scrolling'+diag);
        if(!(scale>0&&scale<1))fail('completion-splash','oversized snapshot was not scaled down'+diag);
        else pass('completion-splash','keypad-free solved snapshot scales wholly inside the success splash');
        popup.hidden=true;popup.innerHTML='';
      }catch(e){fail('completion-splash',(e&&e.stack)||String(e));}
    }
    async function run(){
      try{await sleep(500);await genericAdapterTests();await brokenCalcTest();await colourFillTest();await perimeterDirectTest();await alphameticsVarietyTest();await groupedLibraryTest();await drawerTest();await sumGridContainmentTest();await hintPopupTest();await answerRevealFlowTest();await completionSplashFitTest();}
      catch(e){fail('runner',(e&&e.stack)||String(e));}
      finally{finish();}
    }
    if(document.readyState==='complete')run();else window.addEventListener('load',run,{once:true});
  })();`;
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>99club-browser-qa:running</title>${css.map(u=>`<link rel="stylesheet" href="${u}">`).join('\n')}<style>body{margin:0}#qa-result{white-space:pre-wrap}</style></head><body><div id="tt99-play-root"></div>${js.map(u=>`<script src="${u}"></script>`).join('\n')}<script>${runner}<\/script></body></html>`;
  fs.writeFileSync(HARNESS,html);console.log('Prepared '+path.basename(HARNESS)+' with '+js.length+' scripts and '+css.length+' stylesheets.');
}
function check(file){
  const dom=fs.readFileSync(file,'utf8'),m=dom.match(/<pre[^>]*id=["']qa-result["'][^>]*>([A-Za-z0-9+/=]+)<\/pre>/i);
  if(!m){console.error('Browser QA result marker not found.');process.exit(1);}
  const report=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));
  fs.writeFileSync(path.join(ROOT,'99club-browser-qa-report.json'),JSON.stringify(report,null,2)+'\n');
  for(const x of report.warnings||[])console.warn('WARN ['+x.area+'] '+x.msg);
  for(const x of report.failures||[])console.error('FAIL ['+x.area+'] '+x.msg);
  console.log(`Browser QA: ${(report.failures||[]).length} failure(s), ${(report.warnings||[]).length} warning(s), ${(report.games||[]).length} game adapters exercised.`);
  if(report.failures?.length)process.exit(1);
}
if(mode==='prepare')prepare();else if(mode==='check')check(process.argv[3]);else{console.error('Usage: browser-qa.js prepare | check <dumped-dom-file>');process.exit(2);}
