/* 99 Club Studio · Random pack UI v1.4.0
 * Compact, mode-aware pack builder for manual and random-compatible packs.
 */
(function(global){
  'use strict';

  const root=document.getElementById('tt99-games-root');
  const G=global.TT99Games;
  if(!root||!G?.PACK_MODE)return;

  const MODE_KEY=G.PACK_MODE.storageModeKey;
  const COUNT_KEY=G.PACK_MODE.storageCountKey;
  const PER_PAGE_KEY=G.PACK_MODE.storagePerPageKey||'tt99-games-activities-per-sheet-v2';
  const DIFFICULTY_KEY=G.PACK_MODE.storageDifficultyKey;
  const WEIGHTS_KEY=G.PACK_MODE.storageDifficultyWeightsKey;
  const SCOPE_KEY=G.PACK_MODE.storageRandomScopeKey||'tt99-games-random-scope-v1';
  const DEFAULT_WEIGHTS=G.PACK_MODE.defaultDifficultyWeights||{easy:25,standard:50,challenge:25};
  let scheduled=false;

  function getStored(key,fallback){try{return localStorage.getItem(key)??fallback;}catch(e){return fallback;}}
  function setStored(key,value){try{localStorage.setItem(key,String(value));}catch(e){}}
  function mode(){return getStored(MODE_KEY,'manual')==='random'?'random':'manual';}
  function perPage(){return Number(getStored(PER_PAGE_KEY,'2'))===1?1:2;}
  function count(){const n=Math.round(Number(getStored(COUNT_KEY,'')));if(Number.isFinite(n)&&n>=1)return Math.min(40,n);const s=Number(root.querySelector('#games-sheets')?.value)||1,a=Number(root.querySelector('#games-activities')?.value)||perPage();return Math.min(40,Math.max(1,s*a));}
  function difficulty(){const value=getStored(DIFFICULTY_KEY,'standard');return ['easy','standard','challenge','mixed'].includes(value)?value:'standard';}
  function scope(){const value=getStored(SCOPE_KEY,'maths');return ['maths','mixed','verbal'].includes(value)?value:'maths';}
  function scopeLabel(value){return value==='verbal'?'Verbal reasoning only':value==='mixed'?'Maths + verbal reasoning':'Maths only';}
  function difficultyLabel(value){return value==='easy'?'Easy':value==='challenge'?'Challenge':value==='mixed'?'Mixed':'Standard';}
  function normalizeWeights(raw={}){
    let easy=Math.max(0,Math.min(100,Number(raw.easy)||0)),challenge=Math.max(0,Math.min(100,Number(raw.challenge)||0));
    if(easy+challenge>100){const total=easy+challenge;easy=Math.round(easy*100/total);challenge=100-easy;}
    return {easy,standard:100-easy-challenge,challenge};
  }
  function weights(){try{return normalizeWeights(JSON.parse(getStored(WEIGHTS_KEY,JSON.stringify(DEFAULT_WEIGHTS))));}catch(e){return {...DEFAULT_WEIGHTS};}}
  function saveWeights(w){setStored(WEIGHTS_KEY,JSON.stringify(normalizeWeights(w)));}
  function weightsLabel(w){return `${w.easy}% Easy · ${w.standard}% Standard · ${w.challenge}% Challenge`;}

  function mixedControls(w){return `<section class="tt99-random-pack-mix-v134" aria-label="Mixed difficulty weights">
    <div class="tt99-random-pack-mix-head-v134"><strong>Difficulty mix</strong><small>Easy and Challenge are editable. Standard is the remaining percentage, calculated automatically so the total stays at 100%.</small></div>
    <div class="tt99-random-pack-weights-v134">
      <label class="tt99-random-pack-weight-v134"><span>Easy</span><input id="games-random-easy" type="number" min="0" max="100" step="5" value="${w.easy}"><b>${w.easy}%</b></label>
      <label class="tt99-random-pack-weight-v134 is-derived"><span>Standard</span><output id="games-random-standard">${w.standard}%</output><b>Calculated</b></label>
      <label class="tt99-random-pack-weight-v134"><span>Challenge</span><input id="games-random-challenge" type="number" min="0" max="100" step="5" value="${w.challenge}"><b>${w.challenge}%</b></label>
    </div>
    <div class="tt99-random-pack-presets-v134"><button type="button" data-random-mix-preset="25:50:25">Balanced</button><button type="button" data-random-mix-preset="50:40:10">Gentle</button><button type="button" data-random-mix-preset="15:70:15">Mostly standard</button><button type="button" data-random-mix-preset="10:40:50">Challenge-heavy</button></div>
  </section>`;}

  function enhance(){
    const buildSelect=root.querySelector('#games-sheets');
    if(!buildSelect)return;
    const buildCard=buildSelect.closest('.tt99-games-card');
    const gamesCard=root.querySelector('[data-category-toggle]')?.closest('.tt99-games-card');
    if(!buildCard||!gamesCard||buildCard.dataset.randomPackEnhanced==='1')return;
    buildCard.dataset.randomPackEnhanced='1';

    const currentMode=mode(),currentCount=count(),currentPerPage=perPage(),currentDifficulty=difficulty(),currentWeights=weights(),currentScope=scope(),sheetCount=Math.ceil(currentCount/currentPerPage);
    gamesCard.classList.toggle('tt99-random-mode',currentMode==='random');

    const sheetField=buildSelect.closest('.tt99-field');
    const activityField=root.querySelector('#games-activities')?.closest('.tt99-field');
    if(sheetField)sheetField.remove();
    if(activityField)activityField.remove();

    const grid=sheetField?.parentElement||buildCard.querySelector('.tt99-games-grid2');
    if(grid){
      const holder=document.createElement('div');
      holder.className='tt99-pack-builder-v134 wide';
      holder.innerHTML=`
        <div class="tt99-pack-summary-v134"><span><small>${currentMode==='random'?'Random compatible pack':'Selected-games pack'}</small><strong>${currentCount} activit${currentCount===1?'y':'ies'} · ${currentPerPage} per sheet · ${sheetCount} pupil sheet${sheetCount===1?'':'s'}</strong></span></div>
        <div class="tt99-pack-type-v134">
          <label class="tt99-field"><span>Pack type</span><select id="games-pack-mode"><option value="random" ${currentMode==='random'?'selected':''}>Random compatible games &amp; puzzles</option><option value="manual" ${currentMode==='manual'?'selected':''}>Use my selected games</option></select><small>${currentMode==='random'?'The app chooses only games that genuinely fit the selected years and topics.':'Uses the games and individual settings you chose in Step 2.'}</small></label>
        </div>
        <div class="tt99-pack-options-v134 ${currentMode==='manual'?'is-manual':''}">
          ${currentMode==='random'?`<label class="tt99-field"><span>Content</span><select id="games-random-scope"><option value="maths" ${currentScope==='maths'?'selected':''}>Maths only</option><option value="mixed" ${currentScope==='mixed'?'selected':''}>Maths + verbal reasoning</option><option value="verbal" ${currentScope==='verbal'?'selected':''}>Verbal reasoning only</option></select><small>Maths only is the default, so existing random packs do not change.</small></label><label class="tt99-field"><span>Difficulty</span><select id="games-random-difficulty"><option value="easy" ${currentDifficulty==='easy'?'selected':''}>Easy</option><option value="standard" ${currentDifficulty==='standard'?'selected':''}>Standard</option><option value="challenge" ${currentDifficulty==='challenge'?'selected':''}>Challenge</option><option value="mixed" ${currentDifficulty==='mixed'?'selected':''}>Mixed — weighted</option></select><small>${currentDifficulty==='mixed'?'Uses the mix below across the whole pack.':'Applied consistently across the random pack.'}</small></label>`:''}
          <label class="tt99-field"><span>Number of activities</span><input id="games-activity-count" type="number" min="1" max="40" step="1" value="${currentCount}"><small><strong>Maximum 40 activities per pack.</strong> Finite puzzle libraries are used without repeats.</small></label><label class="tt99-field"><span>Activities per sheet</span><select id="games-activities-per-sheet"><option value="1" ${currentPerPage===1?'selected':''}>1</option><option value="2" ${currentPerPage===2?'selected':''}>2</option></select><small>The sheet count is calculated automatically. Two per sheet is the compact default.</small></label>
        </div>
        ${currentMode==='random'&&currentDifficulty==='mixed'?mixedControls(currentWeights):''}
        ${currentMode==='random'?'<p class="tt99-pack-preserved-v134">Your manual game choices and their settings are preserved while Random compatible is selected.</p>':''}`;
      grid.prepend(holder);

      holder.querySelector('#games-pack-mode')?.addEventListener('change',e=>{setStored(MODE_KEY,e.target.value==='random'?'random':'manual');root.querySelector('#games-new-version')?.click();});
      holder.querySelector('#games-random-scope')?.addEventListener('change',e=>{setStored(SCOPE_KEY,['maths','mixed','verbal'].includes(e.target.value)?e.target.value:'maths');root.querySelector('#games-new-version')?.click();});
      holder.querySelector('#games-random-difficulty')?.addEventListener('change',e=>{setStored(DIFFICULTY_KEY,['easy','standard','challenge','mixed'].includes(e.target.value)?e.target.value:'standard');root.querySelector('#games-new-version')?.click();});
      holder.querySelector('#games-activity-count')?.addEventListener('input',e=>{const n=Number(e.target.value);if(Number.isFinite(n)&&n>40)e.target.value='40';});
      holder.querySelector('#games-activity-count')?.addEventListener('change',e=>{const n=Math.max(1,Math.min(40,Math.round(Number(e.target.value)||1)));e.target.value=String(n);setStored(COUNT_KEY,n);root.querySelector('#games-new-version')?.click();});
      holder.querySelector('#games-activities-per-sheet')?.addEventListener('change',e=>{setStored(PER_PAGE_KEY,Number(e.target.value)===1?1:2);root.querySelector('#games-new-version')?.click();});
      const updateEdge=key=>{
        let easy=Math.max(0,Math.min(100,Number(holder.querySelector('#games-random-easy')?.value??currentWeights.easy)||0));
        let challenge=Math.max(0,Math.min(100,Number(holder.querySelector('#games-random-challenge')?.value??currentWeights.challenge)||0));
        if(key==='easy'&&easy+challenge>100)challenge=100-easy;
        if(key==='challenge'&&easy+challenge>100)easy=100-challenge;
        saveWeights({easy,standard:100-easy-challenge,challenge});
        root.querySelector('#games-new-version')?.click();
      };
      holder.querySelector('#games-random-easy')?.addEventListener('change',()=>updateEdge('easy'));
      holder.querySelector('#games-random-challenge')?.addEventListener('change',()=>updateEdge('challenge'));
      holder.querySelectorAll('[data-random-mix-preset]').forEach(btn=>btn.addEventListener('click',()=>{const [easy,standard,challenge]=btn.dataset.randomMixPreset.split(':').map(Number);saveWeights({easy,standard,challenge});root.querySelector('#games-new-version')?.click();}));
    }

    const gamesIntro=gamesCard.querySelector('.tt99-games-step p');
    if(gamesIntro&&currentMode==='random')gamesIntro.textContent=`Random compatible is active. Step 2 choices are preserved and will return when you switch back to “Use my selected games”.`;

    const buildIntro=buildCard.querySelector('.tt99-games-step p');
    if(buildIntro)buildIntro.textContent=currentMode==='random'?(currentDifficulty==='mixed'?`Build a varied random pack using ${weightsLabel(currentWeights).toLowerCase()}.`:`Build a varied ${difficultyLabel(currentDifficulty).toLowerCase()} pack from compatible games.`):'Build the printable pack from the games configured above.';

    const newBtn=buildCard.querySelector('#games-new-version');
    if(newBtn)newBtn.textContent=currentMode==='random'?'Generate random pack':'Generate new version';

    const toolbar=root.querySelector('.tt99-games-preview-toolbar > div');
    if(toolbar){
      const spans=toolbar.querySelectorAll(':scope > span');
      if(spans[0]){
        const prefix=currentMode==='random'?(currentDifficulty==='mixed'?`${scopeLabel(currentScope)} · mixed ${currentWeights.easy}/${currentWeights.standard}/${currentWeights.challenge}`:`${scopeLabel(currentScope)} · ${difficultyLabel(currentDifficulty).toLowerCase()}`):'Selected games';
        spans[0].textContent=`${prefix} · ${currentCount} activit${currentCount===1?'y':'ies'} · ${sheetCount} sheet${sheetCount===1?'':'s'}`;
      }
    }
  }

  function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}
  const observer=new MutationObserver(schedule);observer.observe(root,{childList:true,subtree:true});
  schedule();
})(typeof globalThis!=='undefined'?globalThis:this);
