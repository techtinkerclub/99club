/* 99 Club Studio · Online Play number-structures polish v1.75
 * - shared on-screen numeric keypad for the v1.73 games
 * - Magic Square transform source square
 * - touch/PWA inputs never receive native text focus (prevents iOS auto-zoom)
 */
(function(global){
'use strict';
const Play=global.TT99GamesPlay;if(!Play)return;

function addTransformSource(root,p){
  if(p?.puzzleType!=='transform'||!Array.isArray(p.sourceGrid)||root.querySelector('.tt99-magic-transform-source'))return;
  const target=root.querySelector('.tt99-magic-target'),grid=root.querySelector('.tt99-magic-grid');
  if(!target||!grid)return;
  const n=Number(p.size)||p.sourceGrid.length;
  const panel=document.createElement('section');
  panel.className='tt99-magic-transform-source';
  panel.innerHTML=`<div class="tt99-magic-transform-source-head"><strong>Starting square</strong><span>Apply the rule to every number.</span></div><div class="tt99-magic-source-grid" style="--n:${n}">${p.sourceGrid.flatMap(row=>row.map(v=>`<div>${String(v)}</div>`)).join('')}</div>`;
  target.parentNode.insertBefore(panel,target);
  const answerLabel=document.createElement('div');
  answerLabel.className='tt99-magic-transform-answer-label';
  answerLabel.textContent='Your transformed square';
  grid.parentNode.insertBefore(answerLabel,grid);
}

function addVirtualKeypad(root,view){
  const inputs=[...root.querySelectorAll('.tt99-structure-entry')];
  if(!inputs.length||root.querySelector('.tt99-structure-keypad'))return view;
  let active=null,finished=false;
  const standalone=global.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
  const touchLike=standalone||global.matchMedia?.('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
  const pad=document.createElement('div');
  pad.className='tt99-number-keypad tt99-structure-keypad';
  pad.style.setProperty('--key-cols','4');
  pad.setAttribute('aria-label','Number keypad');
  pad.innerHTML=`${[1,2,3,4,5,6,7,8,9].map(v=>`<button type="button" data-structure-key="${v}">${v}</button>`).join('')}<button type="button" data-structure-key=".">.</button><button type="button" data-structure-key="0">0</button><button type="button" data-structure-key="minus">−</button><button type="button" data-structure-back aria-label="Backspace">⌫</button><button type="button" class="clear" data-structure-clear>Clear</button>`;
  root.appendChild(pad);

  function entryHost(el){
    return el?.closest('.tt99-magic-cell,.tt99-pyramid-brick,.tt99-arith-node,.tt99-arith-link,.tt99-mshape-node,.tt99-magic-total-entry label,.tt99-repair-control label')||el?.parentElement||null;
  }
  function clearActiveMarks(){
    inputs.forEach(x=>{
      x.classList.remove('is-keypad-active');
      entryHost(x)?.classList.remove('tt99-entry-host-active');
      x.removeAttribute('aria-current');
    });
  }
  function setActive(el){
    if(!el||finished)return;
    active=el;
    clearActiveMarks();
    el.classList.add('is-keypad-active');
    entryHost(el)?.classList.add('tt99-entry-host-active');
    el.setAttribute('aria-current','true');
    pad.querySelectorAll('button').forEach(b=>b.disabled=false);
  }
  function commit(value){
    if(!active||finished)return;
    active.value=value;
    active.dispatchEvent(new Event('input',{bubbles:true}));
    setActive(active);
  }
  function append(token){
    let v=String(active?.value??'');
    if(token==='minus'){
      v=v.startsWith('-')?v.slice(1):`-${v}`;
    }else if(token==='.'){
      if(v.includes('.'))return;
      v=(v===''||v==='-')?`${v}0.`:`${v}.`;
    }else{
      v+=token;
    }
    commit(v);
  }
  function clickPad(e){
    const key=e.target.closest('[data-structure-key]');
    if(key){append(key.dataset.structureKey);return;}
    if(e.target.closest('[data-structure-back]')){if(active)commit(String(active.value||'').slice(0,-1));return;}
    if(e.target.closest('[data-structure-clear]'))commit('');
  }
  function focusInput(e){
    const el=e.target.closest('.tt99-structure-entry');if(!el)return;
    setActive(el);
    if(touchLike)el.blur();
  }
  function pointerInput(e){
    if(!touchLike)return;
    const el=e.target.closest('.tt99-structure-entry');if(!el||finished)return;
    e.preventDefault();
    setActive(el);
  }
  function clickInput(e){
    if(!touchLike)return;
    const el=e.target.closest('.tt99-structure-entry');if(!el||finished)return;
    e.preventDefault();
    setActive(el);
  }
  function keydown(e){
    const el=e.target.closest('.tt99-structure-entry');if(!el||finished)return;
    setActive(el);
    if(/^\d$/.test(e.key))return;
    if(e.key==='.'||e.key==='-'||e.key==='Backspace'||e.key==='Delete'||e.key==='Tab'||e.key==='Enter'||e.key.startsWith('Arrow'))return;
    e.preventDefault();
  }
  inputs.forEach(el=>{
    el.setAttribute('autocomplete','off');
    if(touchLike){
      el.readOnly=true;
      el.tabIndex=-1;
      el.setAttribute('inputmode','none');
      el.setAttribute('aria-readonly','true');
      // Original v1.73 repair modes call input.focus(). Redirect that call to
      // the virtual keypad selection so iOS never starts native input zoom.
      el.focus=function(){setActive(el);};
    }
    el.addEventListener('focus',focusInput);
    el.addEventListener('keydown',keydown);
  });
  root.addEventListener('pointerdown',pointerInput,true);
  root.addEventListener('click',clickInput,true);
  pad.addEventListener('click',clickPad);
  pad.querySelectorAll('button').forEach(b=>b.disabled=true);

  const originalSetFinished=view?.setFinished?.bind(view);
  const originalDestroy=view?.destroy?.bind(view);
  if(view){
    view.setFinished=function(v){
      finished=!!v;
      originalSetFinished?.(v);
      if(finished){
        const focused=document.activeElement;if(focused&&root.contains(focused))focused.blur?.();
        active=null;clearActiveMarks();
      }
      pad.querySelectorAll('button').forEach(b=>b.disabled=finished||!active);
    };
    view.destroy=function(){
      root.removeEventListener('pointerdown',pointerInput,true);
      root.removeEventListener('click',clickInput,true);
      pad.removeEventListener('click',clickPad);
      inputs.forEach(el=>{
        el.removeEventListener('focus',focusInput);
        el.removeEventListener('keydown',keydown);
        if(touchLike)delete el.focus;
      });
      originalDestroy?.();
    };
  }
  return view;
}

for(const id of ['pyramid','magic','arithmagon','magicshape']){
  const adapter=Play.adapters.get(id);if(!adapter||adapter.__v174Polished)continue;
  const originalMount=adapter.mount.bind(adapter);
  adapter.mount=function(root,p,ctx){
    const view=originalMount(root,p,ctx);
    if(id==='magic')addTransformSource(root,p);
    return addVirtualKeypad(root,view);
  };
  adapter.__v174Polished=true;
}
})(typeof globalThis!=='undefined'?globalThis:this);
