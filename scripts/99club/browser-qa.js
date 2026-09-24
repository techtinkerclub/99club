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
    async function initialInstructionStatusTest(){
      try{
        await sleep(80);
        const status=document.getElementById('tt99-play-status');
        const panel=document.querySelector('.tt99-play-top-instructions-v154');
        const visibleInstruction=[...document.querySelectorAll('.tt99-play-top-instructions-v154 .tt99-play-instruction')].filter(el=>getComputedStyle(el).display!=='none'&&el.textContent.trim());
        const visibleLegacy=[...document.querySelectorAll('.tt99-play-live-rule')].filter(el=>getComputedStyle(el).display!=='none'&&el.textContent.trim());
        if(status?.textContent?.trim())fail('instruction-single-source','initial play status repeats guidance below the board: '+status.textContent.trim());
        else if(status&&getComputedStyle(status).display!=='none')fail('instruction-single-source','empty initial status still leaves a blank card below the board');
        else if(!panel||visibleInstruction.length!==1)fail('instruction-single-source','expected exactly one visible first-use instruction block, found '+visibleInstruction.length);
        else if(visibleLegacy.length)fail('instruction-single-source','legacy live-rule paragraph is visible as a duplicate instruction');
        else pass('instruction-single-source','exactly one first-use instruction block is visible and initial status is hidden');
      }catch(e){fail('instruction-single-source',(e&&e.stack)||String(e));}
    }
    async function safeFitLayoutTest(){
      try{
        await sleep(80);
        const root=document.getElementById('tt99-play-root'),settings=root?.querySelector('.tt99-play-settings'),stage=root?.querySelector('.tt99-play-stage'),board=document.getElementById('tt99-play-board');
        if(!root||!settings||!stage||!board)return fail('safe-fit','Online Play safe-fit hosts are unavailable');
        if(settings.open)fail('safe-fit','Puzzle settings still start expanded');
        const htmlOverflow=getComputedStyle(document.documentElement).overflowY,bodyOverflow=getComputedStyle(document.body).overflowY;
        const measuredFit=getComputedStyle(root).getPropertyValue('--tt99-square-fit').trim();
        if(!measuredFit)fail('safe-fit','real viewport measurement helper did not publish --tt99-square-fit');
        if(htmlOverflow==='hidden'||bodyOverflow==='hidden')fail('safe-fit','safe-fit must not lock document scrolling');
        const transform=getComputedStyle(board).transform;
        if(transform&&transform!=='none')fail('safe-fit','live board is transformed/scaled instead of participating in layout: '+transform);
        const before=stage.getBoundingClientRect().top;
        settings.open=true;await sleep(30);
        const after=stage.getBoundingClientRect().top;
        if(Math.abs(after-before)>4)fail('safe-fit','opening Puzzle settings pushes the play stage by '+Math.round(after-before)+'px instead of overlaying it');
        settings.open=false;await sleep(20);
        const sr=stage.getBoundingClientRect(),rr=root.getBoundingClientRect(),wrap=root.querySelector('.tt99-play-board-wrap')?.getBoundingClientRect(),br=board.getBoundingClientRect();
        const diag=' game='+(document.getElementById('tt99-play-game-title')?.textContent||'?')+' viewport='+window.innerWidth+'x'+window.innerHeight+' stage='+Math.round(sr.top)+'..'+Math.round(sr.bottom)+' board='+Math.round(br.width)+'x'+Math.round(br.height)+' boardScroll='+board.scrollWidth+'x'+board.scrollHeight+' wrap='+(wrap?Math.round(wrap.width)+'x'+Math.round(wrap.height):'?')+' class='+board.className;
        if(sr.left<-2||sr.right>window.innerWidth+2)fail('safe-fit','play stage escapes the viewport horizontally'+diag);
        if(window.innerWidth>=821&&window.innerHeight>=700&&sr.bottom>window.innerHeight+18)fail('safe-fit','desktop play stage still extends below a normal viewport by '+Math.round(sr.bottom-window.innerHeight)+'px;'+diag);
        if(window.innerWidth<=820&&window.innerHeight>=700&&rr.bottom>window.innerHeight+80)warn('safe-fit-mobile','mobile play area exceeds one viewport; normal scrolling remains as fallback;'+diag);
        if(Math.abs(after-before)<=4&&htmlOverflow!=='hidden'&&bodyOverflow!=='hidden'&&(!transform||transform==='none')&&(window.innerWidth<821||window.innerHeight<700||sr.bottom<=window.innerHeight+18))pass('safe-fit','compact play layout fits the normal viewport without page-locking or board transforms');
      }catch(e){fail('safe-fit',(e&&e.stack)||String(e));}
    }
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
    async function paperExportEntryTest(){
      try{
        const entry=document.querySelector('.tt99-play-setup-actions [data-paper-export]');
        if(!entry)return fail('paper-export-ui','Print / save action missing from play controls');
        if(entry.textContent!=='Print / save')fail('paper-export-ui','play export action has the wrong label');
        entry.click();await sleep(40);
        const dialog=document.querySelector('.tt99-paper-export-dialog');
        if(!dialog||dialog.hidden)return fail('paper-export-ui','paper export dialog did not open');
        for(const sel of ['[data-paper-pdf]','[data-paper-png]','[data-paper-copy]','[data-paper-answer-pdf]'])if(!dialog.querySelector(sel))fail('paper-export-ui','paper export dialog missing '+sel);
        dialog.querySelector('.tt99-paper-export-close')?.click();await sleep(10);
        if(!dialog.hidden)fail('paper-export-ui','paper export dialog did not close');
        else pass('paper-export-ui','Print / save opens PDF, PNG, copy-image and optional answer controls');
      }catch(e){fail('paper-export-ui',(e&&e.stack)||String(e));}
    }
    async function completionShareEntryTest(){
      try{
        const popup=document.getElementById('tt99-play-complete');
        if(!popup)return fail('completion-share-entry','completion popup missing');
        popup.hidden=false;
        popup.innerHTML='<div class="tt99-play-complete-card"><div><div class="tt99-play-complete-actions"><button type="button" data-play-share>Copy puzzle link</button></div></div></div>';
        window.TT99PlayShareV156?.open?.('solved');
        window.TT99PlayShareV156?.close?.();
        document.dispatchEvent(new Event('visibilitychange'));
        await sleep(20);
        const actions=popup.querySelector('.tt99-play-complete-actions');
        const entries=actions?.querySelectorAll('[data-share-puzzle]')||[];
        if(entries.length!==1)fail('completion-share-entry','completion splash should have exactly one share-panel entry');
        if(actions?.querySelector('[data-share-card],[data-challenge-card]'))fail('completion-share-entry','legacy duplicate share entry remains');
        if(entries[0]?.textContent!=='Share this puzzle')fail('completion-share-entry','single share entry has the wrong label');
        if(actions?.querySelector('[data-play-share]')?.textContent!=='Copy puzzle link')fail('completion-share-entry','copy action still uses old challenge-link wording');
        else pass('completion-share-entry','completion splash uses one Share this puzzle entry plus Copy puzzle link');
        popup.hidden=true;popup.innerHTML='';
      }catch(e){fail('completion-share-entry',(e&&e.stack)||String(e));}
    }
    async function sharePanelTest(){
      try{
        const codec=window.TT99PlayShareCodec;
        if(!codec?.shareUrl)return fail('share-codec','challenge share codec missing');
        const current=codec.shareUrl(location.origin+'/play/?game=pyramid&seed=qa-seed&mode=challenge&difficulty=standard');
        const legacy=codec.shareUrl(location.origin+'/tools/99-club/games/play/?game=pyramid&seed=qa-seed&mode=challenge&difficulty=standard');
        if(!/^https?:\/\/[^/]+\/c\/\?c=1~n~c~qa-seed~/.test(current))fail('share-codec','current /play route did not become a /c challenge URL: '+current);
        if(!/^https?:\/\/[^/]+\/c\/\?c=1~n~c~qa-seed~/.test(legacy))fail('share-codec','legacy play route no longer becomes a /c challenge URL: '+legacy);
        else pass('share-codec','current and legacy play routes both share through the /c metadata route');
        const api=window.TT99PlayShareV156;
        if(!api?.open)return fail('share-panel','share API missing');
        await api.open('challenge');await sleep(40);
        const dialog=document.querySelector('.tt99-share-dialog'),panel=dialog?.querySelector('.tt99-share-panel');
        if(!dialog||dialog.hidden||!panel)return fail('share-panel','share panel did not open');
        const rich=dialog.querySelector('[data-share-card-link]'),card=dialog.querySelector('[data-share-card-native]'),save=dialog.querySelector('[data-download]'),copy=dialog.querySelector('[data-copy-link]');
        if(!rich||!card||!save||!copy)fail('share-panel','simplified share actions are incomplete');
        if(dialog.querySelector('[data-social],.tt99-share-social'))fail('share-panel','legacy social-network button grid is still present');
        const labels=[rich?.textContent,card?.textContent,save?.textContent,copy?.textContent].join('|');
        if(!/Share card \+ link/.test(labels)||!/Share image only/.test(labels)||!/Save image/.test(labels)||!/Copy link/.test(labels))fail('share-panel','share action labels are not the simplified set');
        const payload=api.cardWithLinkPayload?.(new File(['qa'],'qa.png',{type:'image/png'}));
        if(!payload||!Array.isArray(payload.files)||payload.files.length!==1||!payload.text||!payload.url)fail('share-panel','card-plus-link payload is missing image, caption or URL');
        if(!api.isIOSShareTarget?.({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)',platform:'iPhone',maxTouchPoints:5}))fail('share-panel','iPhone share-target detection failed');

        const r=panel.getBoundingClientRect();
        if(r.left<-1||r.right>window.innerWidth+1)fail('share-panel','share panel escapes the viewport');
        if(window.innerWidth>720){
          const preview=dialog.querySelector('.tt99-share-preview'),img=preview?.querySelector('img'),pr=preview?.getBoundingClientRect(),ir=img?.getBoundingClientRect();
          if(!preview||!img||!pr||!ir)fail('share-panel-desktop-fit','desktop share preview image is unavailable');
          else if(ir.left<pr.left-1||ir.right>pr.right+1||ir.top<pr.top-1||ir.bottom>pr.bottom+1)fail('share-panel-desktop-fit','share card is clipped inside the desktop preview');
          else if(panel.scrollHeight>panel.clientHeight+2)fail('share-panel-desktop-fit','desktop share panel still requires vertical scrolling');
          else pass('share-panel-desktop-fit','complete share card fits inside the desktop modal without scrolling');
        }
        dialog.hidden=true;window.dispatchEvent(new Event('pageshow'));await sleep(20);
        if(dialog.hidden)fail('share-panel','return/resume did not restore the still-open share panel');
        dialog.querySelector('.tt99-share-close')?.click();await sleep(10);
        if(!dialog.hidden)fail('share-panel','close control did not dismiss the share panel');
        else pass('share-panel','native share actions, mobile containment and return-to-panel behaviour verified');
      }catch(e){fail('share-panel',(e&&e.stack)||String(e));}
    }
    async function searchDirectionInstructionTest(){
      try{
        const open=document.getElementById('tt99-play-change-game');if(!open)return fail('search-directions','Change game control is unavailable');
        open.click();await sleep(40);
        const pick=document.querySelector('[data-game-id="numbersearch"]');if(!pick)return fail('search-directions','Number Search card is unavailable');
        pick.click();
        for(let i=0;i<20;i++){const instruction=document.querySelector('.tt99-play-top-instructions-v154 .tt99-play-instruction');if(instruction&&/Directions:/i.test(instruction.textContent||''))break;await sleep(25);}
        const board=document.getElementById('tt99-play-board'),source=board?.querySelector('.tt99-play-board-tip'),instruction=document.querySelector('.tt99-play-top-instructions-v154 .tt99-play-instruction');
        const visibleTop=[...document.querySelectorAll('.tt99-play-top-instructions-v154 .tt99-play-instruction,.tt99-play-top-instructions-v154 .tt99-play-live-rule')].filter(el=>getComputedStyle(el).display!=='none'&&el.textContent.trim());
        if(!board?.classList.contains('tt99-play-numbersearch'))fail('search-directions','Change game did not mount Number Search on the live board');
        if(!source)fail('search-directions','hidden Number Search direction source is missing from the live board');
        if(!instruction||!/Directions:/i.test(instruction.textContent||''))fail('search-directions','generated direction rule was not folded into the single top instruction');
        if(source&&getComputedStyle(source).display!=='none')fail('search-directions','legacy under-board direction note is visibly duplicated');
        if(visibleTop.length!==1)fail('search-directions','search directions render in '+visibleTop.length+' visible top instruction blocks instead of one');
        if(board?.classList.contains('tt99-play-numbersearch')&&source&&instruction&&/Directions:/i.test(instruction.textContent||'')&&getComputedStyle(source).display==='none'&&visibleTop.length===1)pass('search-directions','real game switch shows instructions + dynamic direction rule once in one top block');
      }catch(e){fail('search-directions',(e&&e.stack)||String(e));}
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
        popup.innerHTML='<div class="tt99-play-complete-card"><span class="tt99-play-complete-mark">✓</span><div><small>Puzzle complete</small><h2>Futoshiki solved</h2><div class="tt99-play-complete-actions"><button>New puzzle</button></div></div></div>';
        board.className='tt99-numbergrid-host tt99-play-futoshiki';
        const cells=Array.from({length:25},(_,i)=>'<button class="tt99-numbergrid-cell '+(i%4===0?'is-given':'is-editable')+'"><span class="cell-value">'+((i%5)+1)+'</span></button>').join('');
        board.innerHTML='<div class="tt99-numbergrid-wrap"><div class="tt99-numbergrid" style="--n:5">'+cells+'<span class="tt99-grid-sign horizontal" style="left:40%;top:30%">&lt;</span></div><div class="tt99-number-keypad"><button>1</button><button>2</button><button>3</button><button>4</button><button>5</button></div></div>';
        const liveWidth=board.getBoundingClientRect().width;
        popup.hidden=false;api.injectPreview();await sleep(40);
        const ngClone=popup.querySelector('.tt99-play-complete-snapshot'),ngFrame=popup.querySelector('.tt99-play-complete-snapshot-fit'),ngHost=popup.querySelector('.tt99-play-complete-solution-board');
        if(!ngClone||!ngFrame||!ngHost)return fail('completion-splash-numbergrid','number-grid snapshot was not injected');
        const ngr=ngFrame.getBoundingClientRect(),ngScale=Number(ngClone.dataset.tt99FitScale||1),expected=Math.min(window.innerWidth<=520?340:430,liveWidth,ngHost.clientWidth||9999);
        if(ngFrame.querySelector('.tt99-number-keypad'))fail('completion-splash-numbergrid','number-grid keypad leaked into completion snapshot');
        if(ngr.width<Math.max(180,expected*.68))fail('completion-splash-numbergrid','number-grid snapshot collapsed to intrinsic/min-content width: frame='+Math.round(ngr.width)+' live='+Math.round(liveWidth)+' expected≈'+Math.round(expected)+' scale='+ngScale);
        if(!(ngScale>.65&&ngScale<=1))fail('completion-splash-numbergrid','square number-grid was over-scaled in completion splash: '+ngScale);
        else pass('completion-splash-numbergrid','number-grid snapshot keeps its live width and remains legible in the success splash');
        popup.hidden=true;popup.innerHTML='';
      }catch(e){fail('completion-splash',(e&&e.stack)||String(e));}
    }
    async function run(){
      try{await sleep(500);await initialInstructionStatusTest();await safeFitLayoutTest();await genericAdapterTests();await brokenCalcTest();await colourFillTest();await perimeterDirectTest();await alphameticsVarietyTest();await groupedLibraryTest();await drawerTest();await sumGridContainmentTest();await hintPopupTest();await answerRevealFlowTest();await paperExportEntryTest();await completionShareEntryTest();await sharePanelTest();await completionSplashFitTest();await searchDirectionInstructionTest();}
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
