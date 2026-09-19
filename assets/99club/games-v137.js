/* 99 Club Studio · v1.37 browser integration
 * Adds Number Towers to the library, renders it in preview, improves Function Machines,
 * and corrects Arithmagon diagonal-operation placement.
 */
(function(global){
  'use strict';
  const root=document.getElementById('tt99-games-root'),G=global.TT99Games;
  if(!root||!G||root.dataset.v137Booted==='1')return;
  root.dataset.v137Booted='1';
  const SETTINGS_KEY='tt99-games-settings-v4';
  let scheduled=false;

  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function loadSettings(){try{return JSON.parse(global.localStorage?.getItem(SETTINGS_KEY)||'{}')||{};}catch(e){return {};}}
  function saveSettings(s){try{global.localStorage?.setItem(SETTINGS_KEY,JSON.stringify(s));return true;}catch(e){return false;}}
  function numberTowersCompatible(){
    const ys=[...root.querySelectorAll('#games-min-year,#games-max-year')].map(x=>Number(x.value)||3);const max=Math.max(...ys,3);
    const topics=[...root.querySelectorAll('[data-topic]:checked')].map(x=>x.dataset.topic);
    return max>=3&&(topics.includes('number_place_value')||topics.includes('geometry'));
  }
  function injectNumberTowersCard(){
    const category=root.querySelector('[data-category-toggle="logic"]')?.closest('.tt99-game-category'),library=category?.querySelector('.tt99-engine-library');
    if(!library||library.querySelector('[data-v137-numbertowers]'))return;
    const stored=loadSettings(),selected=new Set(stored.selectedEngines||[]),on=selected.has('numbertowers'),ok=numberTowersCompatible(),card=document.createElement('article');
    card.className=`tt99-engine-card ${on&&ok?'is-selected':''} ${ok?'':'is-incompatible'}`;card.dataset.v137Numbertowers='1';
    card.innerHTML=`<label class="tt99-engine-include"><input type="checkbox" data-v137-tower-select ${on&&ok?'checked':''} ${ok?'':'disabled'}><span class="tt99-engine-check"></span><span><b>Number Towers · Skyscrapers</b><small>Number logic & grids</small></span></label><div class="tt99-engine-summary"><span>${esc(stored.engineSettings?.numbertowers?.difficulty||'standard')}</span><span>${esc(stored.engineSettings?.numbertowers?.gridSize==='auto'||!stored.engineSettings?.numbertowers?.gridSize?'Auto grid':stored.engineSettings.numbertowers.gridSize+'×'+stored.engineSettings.numbertowers.gridSize)}</span></div><button type="button" class="tt99-engine-configure" data-v137-tower-configure ${ok?'':'disabled'}>Configure</button>${!ok?'<p class="tt99-engine-compatibility">Best suited to Years 3–6 with Number & place value or Geometry selected.</p>':'<p class="tt99-v137-tower-card-note">Use edge clues to work out how many towers are visible from each direction.</p>'}`;
    library.appendChild(card);
    card.querySelector('[data-v137-tower-select]')?.addEventListener('change',e=>{
      const s=loadSettings();s.selectedEngines=Array.isArray(s.selectedEngines)?s.selectedEngines:[];const set=new Set(s.selectedEngines);
      if(e.target.checked)set.add('numbertowers');else set.delete('numbertowers');s.selectedEngines=[...set];s.engineSettings=s.engineSettings||{};s.engineSettings.numbertowers={difficulty:'standard',gridSize:'auto',clueLevel:'auto',...(s.engineSettings.numbertowers||{})};
      if(saveSettings(s))global.location.reload();
    });
    card.querySelector('[data-v137-tower-configure]')?.addEventListener('click',()=>{
      if(!on){const cb=card.querySelector('[data-v137-tower-select]');cb.checked=true;cb.dispatchEvent(new Event('change',{bubbles:true}));return;}
      const tray=[...root.querySelectorAll('[data-configure-engine="numbertowers"]')];if(tray.length)tray[0].click();
    });
  }

  function decodePayload(text){
    const m=String(text||'').match(/\[\[TT99TOWERS:([^\]]+)\]\]/);if(!m)return null;
    try{const json=typeof atob==='function'?atob(m[1]):m[1];return JSON.parse(json);}catch(e){return null;}
  }
  function renderNumberTowers(){
    root.querySelectorAll('.tt99-game-activity').forEach(activity=>{
      if(activity.dataset.v137Towers==='1')return;
      const title=activity.querySelector('.tt99-game-activity-head h3')?.textContent||'';if(!/Number Towers/i.test(title))return;
      const p=activity.querySelector('.tt99-game-instruction'),data=decodePayload(p?.textContent||'');if(!data)return;
      activity.dataset.v137Towers='1';const answer=!!activity.closest('.tt99-game-paper.is-answer'),n=data.n,grid=data.solution||[],clues=data.clues||{};
      if(p)p.textContent=`Fill the grid with 1–${n}, using each height once in every row and column. Each edge clue is how many towers are visible looking from that side; taller towers hide shorter ones behind them.`;
      [...activity.children].filter(el=>!el.matches('.tt99-preview-replace,.tt99-game-activity-head,.tt99-game-instruction')).forEach(el=>el.remove());
      const cells=[];cells.push('<span class="tower-corner"></span>');for(let c=0;c<n;c++)cells.push(`<span class="tower-clue">${clues.top?.[c]||''}</span>`);cells.push('<span class="tower-corner"></span>');
      for(let r=0;r<n;r++){
        cells.push(`<span class="tower-clue">${clues.left?.[r]||''}</span>`);
        for(let c=0;c<n;c++)cells.push(`<span class="tower-cell ${r===0?'first-row ':''}${r===n-1?'last-row ':''}${c===0?'first-col ':''}${c===n-1?'last-col':''}">${answer?grid[r][c]:''}</span>`);
        cells.push(`<span class="tower-clue">${clues.right?.[r]||''}</span>`);
      }
      cells.push('<span class="tower-corner"></span>');for(let c=0;c<n;c++)cells.push(`<span class="tower-clue">${clues.bottom?.[c]||''}</span>`);cells.push('<span class="tower-corner"></span>');
      activity.insertAdjacentHTML('beforeend',`<div class="tt99-numbertowers-grid" style="--tower-n:${n}">${cells.join('')}</div><p class="tt99-numbertowers-key">${answer?'Completed tower heights shown above.':'A taller tower hides any shorter towers behind it.'}</p>`);
    });
  }

  function improveMachines(){
    root.querySelectorAll('.tt99-functionmachine').forEach(activity=>{
      if(activity.dataset.v137Machine==='1')return;const old=activity.querySelector('.tt99-v136-machine');if(!old)return;
      activity.dataset.v137Machine='1';const stages=[...old.querySelectorAll('.tt99-v136-stage')].map((el,i)=>({label:el.querySelector('small')?.textContent||`Step ${i+1}`,op:el.querySelector('b')?.textContent||''}));
      const stageHTML=stages.map((s,i)=>`<div class="tt99-v137-machine-stage"><small>${esc(s.label)}</small><b>${esc(s.op)}</b>${i<stages.length-1?'<span class="tt99-v137-machine-flow">›</span>':''}</div>`).join('');
      old.insertAdjacentHTML('afterend',`<div class="tt99-v137-machine"><div class="tt99-v137-machine-port input"><small>Number in</small><b>Input</b><span class="tt99-v137-machine-flow">›</span></div><div class="tt99-v137-machine-body">${stageHTML}</div><div class="tt99-v137-machine-port output"><small>Result</small><b>Output</b></div></div><p class="tt99-v137-machine-note">Missing input? Start at the output and undo the operations in reverse order.</p>`);
    });
  }

  function fixArithmagonOperators(){
    root.querySelectorAll('.tt99-arithmagon-svg').forEach(svg=>{
      const corners=[...svg.querySelectorAll('g.corner circle')];if(!corners.length)return;const centre=corners.reduce((p,c)=>[p[0]+Number(c.getAttribute('cx')),p[1]+Number(c.getAttribute('cy'))],[0,0]).map(v=>v/corners.length),lines=[...svg.querySelectorAll('line')],ops=[...svg.querySelectorAll('g.edge text.op')];
      lines.forEach((line,i)=>{if(!line.classList.contains('diagonal')||!ops[i])return;const x1=+line.getAttribute('x1'),y1=+line.getAttribute('y1'),x2=+line.getAttribute('x2'),y2=+line.getAttribute('y2'),mx=(x1+x2)/2,my=(y1+y2)/2,dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1;let vx=-dy/len,vy=dx/len;const tcx=centre[0]-mx,tcy=centre[1]-my;if(vx*tcx+vy*tcy<0){vx=-vx;vy=-vy;}ops[i].setAttribute('x',String(mx+vx*11));ops[i].setAttribute('y',String(my+vy*11+2));ops[i].dataset.v137Inward='1';});
    });
  }

  function enhance(){injectNumberTowersCard();renderNumberTowers();improveMachines();fixArithmagonOperators();}
  function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});schedule();
})(typeof globalThis!=='undefined'?globalThis:this);
