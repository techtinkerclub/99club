/* 99 Club Studio · Number Mobile Balance v8
 * Pupil-facing challenge layer. Challenge mode is deliberately different from
 * teacher edit mode: fixed boxes are inert, ? boxes accept answers directly,
 * and non-missing-number challenges use a simple response panel.
 */
(function(G){
'use strict';
if(!G)return;

const ACTIVE_CLASS='nmb-v8-pupil-challenge';
let installed=false,observer=null,adaptQueued=false,lastKey='',activeTileId=null;
const answers=new Map();
let responseBuffer='',feedback='',feedbackKind='';

function q(sel,root=document){return root?.querySelector?.(sel)||null}
function qa(sel,root=document){return root?.querySelectorAll?[...root.querySelectorAll(sel)]:[]}
function stage(){return document.getElementById('gd-stage')}
function work(){return q('.gd-number-mobile-workbench',stage())}
function banner(){return q('.gd-challenge-banner',stage())}
function challengeActive(){return !!(banner()&&work())}
function challengeBuilding(){return document.body.classList.contains('nmb-v7-challenge-building')||document.documentElement.classList.contains('nmb-v7-challenge-building')}
function pupilActive(){return challengeActive()&&!challengeBuilding()}
function revealed(){const b=banner();return !!(b&&(q('.gd-challenge-actions em',b)||/hide answer/i.test(q('[data-board-action="reveal"]',b)?.textContent||'')))}
function text(el){return String(el?.textContent||'').trim()}
function numeric(str){const n=Number(String(str??'').trim());return Number.isFinite(n)?n:null}
function scheduleAdapt(){if(adaptQueued)return;adaptQueued=true;queueMicrotask(()=>{adaptQueued=false;adapt()})}
function challengeKey(){const b=banner(),ids=qa('[data-ba-token]',work()).map(el=>el.dataset.baToken).join(',');return b?text(q('.gd-challenge-kicker',b))+'|'+text(q('.gd-challenge-prompt',b))+'|'+ids:''}
function intendedAnswers(){const map=G.numberMobileChallengeSpec?.answerByToken;return map&&typeof map==='object'?map:null}
function isIntendedAnswerTile(tile){const map=intendedAnswers(),id=String(tile?.dataset?.baToken||'');return map?Object.prototype.hasOwnProperty.call(map,id):(text(q('strong',tile))==='?'||answers.has(id))}
function unknownTiles(){const map=intendedAnswers();if(map)return Object.keys(map).map(id=>q('[data-ba-token="'+CSS.escape(String(id))+'"]',work())).filter(Boolean);return qa('[data-ba-token]',work()).filter(tile=>text(q('strong',tile))==='?'||answers.has(String(tile.dataset.baToken)))}
function visibleNumber(tile){return numeric(text(q('strong',tile)))}
function sumTokens(root,except=null){return qa('[data-ba-token]',root).reduce((sum,tile)=>{if(except&&tile===except)return sum;const n=visibleNumber(tile);return sum+(n==null?0:n)},0)}
function mainSide(side){return q('.gd-eq-side--'+side+' .gd-eq-weights',work())}
function mainTotals(){return{left:sumTokens(mainSide('left')),right:sumTokens(mainSide('right'))}}
function relation(){const t=mainTotals();return Math.abs(t.left-t.right)<1e-9?'=':t.left>t.right?'>':'<'}
function challengeType(){
  if(unknownTiles().length)return'missing';
  const b=banner(),copy=(text(q('.gd-challenge-prompt',b))+' '+text(q('.gd-challenge-copy h3',b))+' '+text(q('[data-ba-equation]',work()))).toLowerCase();
  if(/difference|how much heavier/.test(copy))return'difference';
  if(/which symbol|compare|which .*side.*heavier|which main side/.test(copy))return'compare';
  if(/pupil says|are they correct|claim|spot .*mistake|false equal/.test(copy))return'spot';
  if(/same .*both|add .*both sides|what happens to .*equality/.test(copy))return'same';
  if(/make .*balance|make both sides equal|make every bar|make the entire mobile/.test(copy))return'balance';
  return'generic';
}
function branchExpected(tile){
  const branch=tile.closest('.nmb-branch');if(!branch)return null;
  const side=tile.closest('.nmb-branch-side--right')?'right':'left',other=side==='left'?'right':'left';
  const same=q(':scope > .nmb-branch-sides > .nmb-branch-side--'+side+' > .nmb-branch-children',branch),opposite=q(':scope > .nmb-branch-sides > .nmb-branch-side--'+other+' > .nmb-branch-children',branch);if(!same||!opposite)return null;
  const unresolved=qa('[data-ba-token]',same).filter(el=>el!==tile&&isIntendedAnswerTile(el));if(unresolved.length)return null;
  return sumTokens(opposite)-sumTokens(same,tile);
}
function mainExpected(tile){
  const side=tile.closest('.gd-eq-side--right')?'right':'left',other=side==='left'?'right':'left',same=mainSide(side),opposite=mainSide(other);if(!same||!opposite)return null;
  const unresolved=qa('[data-ba-token]',same).filter(el=>el!==tile&&isIntendedAnswerTile(el));if(unresolved.length)return null;
  return sumTokens(opposite)-sumTokens(same,tile);
}
function expectedForTile(tile){const map=intendedAnswers(),id=String(tile?.dataset?.baToken||'');if(map&&Object.prototype.hasOwnProperty.call(map,id)){const expected=Number(map[id]);return Number.isFinite(expected)?expected:null}const branch=branchExpected(tile);return branch==null?mainExpected(tile):branch}
function normalise(value){return String(value??'').trim().toLowerCase().replace(/\s+/g,' ')}
function setFeedback(message,kind=''){feedback=message;feedbackKind=kind;renderFeedback()}
function renderFeedback(){const el=q('[data-nmb-v8-feedback]',stage());if(!el)return;el.textContent=feedback||'';el.className='nmb-v8-feedback'+(feedbackKind?' is-'+feedbackKind:'');el.setAttribute('aria-live','polite')}
function answerState(id){if(!answers.has(id))answers.set(id,{buffer:'',correct:false,wrong:false});return answers.get(id)}
function renderTileAnswer(tile){const state=answers.get(String(tile.dataset.baToken));if(!state)return;const strong=q('strong',tile);if(strong)strong.textContent=state.buffer||'?';tile.classList.toggle('nmb-v8-answer-correct',!!state.correct);tile.classList.toggle('nmb-v8-answer-wrong',!!state.wrong);tile.setAttribute('aria-label',state.buffer?'Answer box. Current answer '+state.buffer:'Answer box. Tap to enter the missing number')}
function closePad(){activeTileId=null;q('.nmb-v8-answer-pad',stage())?.remove()}
function checkTile(tile){
  const state=answerState(String(tile.dataset.baToken)),expected=expectedForTile(tile),given=numeric(state.buffer);
  if(expected==null||!Number.isFinite(expected)){state.wrong=true;renderTileAnswer(tile);setFeedback('Not quite — try again.','wrong');return}
  if(given!=null&&Math.abs(given-expected)<1e-9){state.correct=true;state.wrong=false;renderTileAnswer(tile);setFeedback('Correct ✓','correct');closePad()}
  else{state.correct=false;state.wrong=true;renderTileAnswer(tile);setFeedback('Not quite — try again.','wrong')}
}
function answerPad(tile){
  closePad();const host=work();if(!host)return;const id=String(tile.dataset.baToken),state=answerState(id),pad=document.createElement('div');activeTileId=id;pad.className='nmb-v8-answer-pad';pad.dataset.nmbV8AnswerPad=id;
  pad.innerHTML='<div class="nmb-v8-answer-pad__head"><strong>Enter your answer</strong><button type="button" data-nmb-v8-close aria-label="Close number pad">×</button></div><div class="nmb-v8-answer-display">'+(state.buffer||'?')+'</div><div class="nmb-v8-answer-digits">'+['7','8','9','4','5','6','1','2','3','0','.','⌫'].map(key=>'<button type="button" data-nmb-v8-key="'+key+'">'+key+'</button>').join('')+'</div><button type="button" class="nmb-v8-check" data-nmb-v8-check>Check answer</button>';
  host.appendChild(pad);const wr=host.getBoundingClientRect(),tr=tile.getBoundingClientRect(),width=225,height=300;let left=tr.right-wr.left+10,top=tr.top-wr.top-18;if(left+width>wr.width)left=Math.max(8,tr.left-wr.left-width-10);if(top+height>wr.height)top=Math.max(8,wr.height-height-8);pad.style.left=left+'px';pad.style.top=top+'px';
  q('[data-nmb-v8-close]',pad).onclick=closePad;
  qa('[data-nmb-v8-key]',pad).forEach(button=>button.onclick=()=>{if(state.correct)return;const key=button.dataset.nmbV8Key;if(key==='⌫')state.buffer=state.buffer.slice(0,-1);else if(key==='.'&&!state.buffer.includes('.'))state.buffer=(state.buffer||'0')+'.';else if(key!=='.')state.buffer=(state.buffer+key).replace(/^0(?=\d)/,'');state.wrong=false;q('.nmb-v8-answer-display',pad).textContent=state.buffer||'?';renderTileAnswer(tile);setFeedback('','')});q('[data-nmb-v8-check]',pad).onclick=()=>checkTile(tile);
}
function numericResponseExpected(type){const t=mainTotals();return type==='difference'||type==='balance'?Math.abs(t.left-t.right):null}
function responseChoice(type){
  if(type==='compare'){const prompt=text(q('.gd-challenge-prompt',banner())).toLowerCase();if(/symbol|<, >|<.*>.*=/.test(prompt))return{options:['<','=','>'],correct:relation()};const rel=relation();return{options:['Left','Balanced','Right'],correct:rel==='>'?'Left':rel==='<'?'Right':'Balanced'}}
  if(type==='spot')return{options:['Yes','No'],correct:relation()==='='?'Yes':'No'};
  if(type==='same')return{options:['Stays equal','Does not stay equal'],correct:'Stays equal'};
  return null;
}
function responseInstructions(type){if(type==='difference')return'Enter the difference between the two main sides.';if(type==='balance')return'How much must be added to the lighter main side to balance the main bar?';if(type==='compare')return'Choose your answer.';if(type==='spot')return'Is the pupil correct?';if(type==='same')return'What happens to the equality?';return'Enter your answer.'}
function checkNumericResponse(type,panel){const expected=numericResponseExpected(type),given=numeric(responseBuffer);setFeedback(given!=null&&expected!=null&&Math.abs(given-expected)<1e-9?'Correct ✓':'Not quite — try again.',given!=null&&expected!=null&&Math.abs(given-expected)<1e-9?'correct':'wrong');q('.nmb-v8-response-display',panel)?.focus?.()}
function insertResponsePanel(panel){const w=work();if(!w)return;const summary=q('.gd-eq-summary',w);if(summary)summary.insertAdjacentElement('afterend',panel);else w.prepend(panel)}
function responsePanel(type){
  const existing=q('.nmb-v8-response-panel',stage());if(existing)return existing;const panel=document.createElement('div');panel.className='nmb-v8-response-panel';panel.dataset.nmbV8Response=type;const choice=responseChoice(type);
  if(choice){panel.innerHTML='<span class="nmb-v8-response-label">'+responseInstructions(type)+'</span><div class="nmb-v8-choice-row">'+choice.options.map(option=>'<button type="button" data-nmb-v8-choice="'+option.replace(/"/g,'&quot;')+'">'+option+'</button>').join('')+'</div><span class="nmb-v8-feedback" data-nmb-v8-feedback aria-live="polite"></span>';qa('[data-nmb-v8-choice]',panel).forEach(button=>button.onclick=()=>{const ok=normalise(button.dataset.nmbV8Choice)===normalise(choice.correct);qa('[data-nmb-v8-choice]',panel).forEach(b=>b.classList.remove('is-correct','is-wrong'));button.classList.add(ok?'is-correct':'is-wrong');setFeedback(ok?'Correct ✓':'Not quite — try again.',ok?'correct':'wrong')})}
  else if(type==='difference'||type==='balance'){panel.innerHTML='<span class="nmb-v8-response-label">'+responseInstructions(type)+'</span><div class="nmb-v8-number-response"><div class="nmb-v8-response-display" tabindex="0">'+(responseBuffer||'?')+'</div><div class="nmb-v8-response-keys">'+['1','2','3','4','5','6','7','8','9','0','⌫'].map(k=>'<button type="button" data-nmb-v8-response-key="'+k+'">'+k+'</button>').join('')+'</div><button type="button" class="nmb-v8-check" data-nmb-v8-response-check>Check answer</button></div><span class="nmb-v8-feedback" data-nmb-v8-feedback aria-live="polite"></span>';qa('[data-nmb-v8-response-key]',panel).forEach(button=>button.onclick=()=>{const key=button.dataset.nmbV8ResponseKey;if(key==='⌫')responseBuffer=responseBuffer.slice(0,-1);else responseBuffer=(responseBuffer+key).replace(/^0(?=\d)/,'');q('.nmb-v8-response-display',panel).textContent=responseBuffer||'?';setFeedback('','')});q('[data-nmb-v8-response-check]',panel).onclick=()=>checkNumericResponse(type,panel)}
  else panel.innerHTML='<span class="nmb-v8-response-label">Think through the mobile, then tell your teacher your answer.</span><span class="nmb-v8-feedback" data-nmb-v8-feedback aria-live="polite"></span>';
  insertResponsePanel(panel);renderFeedback();return panel;
}
function missingPanel(){let panel=q('.nmb-v8-response-panel',stage());if(panel)return panel;panel=document.createElement('div');panel.className='nmb-v8-response-panel is-missing';panel.dataset.nmbV8Response='missing';panel.innerHTML='<span class="nmb-v8-response-label">Tap a <strong>?</strong> box and enter the missing number.</span><span class="nmb-v8-feedback" data-nmb-v8-feedback aria-live="polite"></span>';insertResponsePanel(panel);renderFeedback();return panel}
function hideTeacherControls(active){
  if(active)qa('.nmb-keypad,.nmb-tile-toolbar,.nmb-branch-toolbar',work()).forEach(el=>el.remove());
  try{if(window.parent!==window){const rail=window.frameElement?.closest?.('[data-board-object]')?.querySelector?.('[data-board-quick-actions]');if(rail)qa(':scope > button',rail).forEach(button=>{if(!button.dataset.nmbBoardChallenge)button.hidden=active})}}catch(_err){}
}
function restoreBoardRail(){try{if(window.parent!==window){const rail=window.frameElement?.closest?.('[data-board-object]')?.querySelector?.('[data-board-quick-actions]');if(rail)qa(':scope > button',rail).forEach(button=>button.hidden=false)}}catch(_err){}}
function prepareUnknownTiles(){const unknowns=unknownTiles();unknowns.forEach(tile=>{const id=String(tile.dataset.baToken);tile.disabled=false;tile.removeAttribute('disabled');tile.removeAttribute('aria-disabled');tile.classList.add('nmb-v8-answer-box');answerState(id);renderTileAnswer(tile)});return unknowns}
function compactPrompt(type){const p=q('.gd-challenge-prompt',banner());if(p&&type==='balance'&&p.textContent!=='How much must be added to the lighter main side to balance the main bar?')p.textContent='How much must be added to the lighter main side to balance the main bar?'}
function resetChallengeState(){answers.clear();activeTileId=null;responseBuffer='';feedback='';feedbackKind='';closePad();q('.nmb-v8-response-panel',stage())?.remove()}
function adapt(){
  if(challengeBuilding()){document.body.classList.remove(ACTIVE_CLASS);document.documentElement.classList.remove(ACTIVE_CLASS);setTimeout(scheduleAdapt,80);return}
  const active=challengeActive();document.body.classList.toggle(ACTIVE_CLASS,active);document.documentElement.classList.toggle(ACTIVE_CLASS,active);
  if(!active){if(lastKey){resetChallengeState();lastKey=''}hideTeacherControls(false);restoreBoardRail();return}
  const key=challengeKey();if(key!==lastKey){resetChallengeState();lastKey=key}hideTeacherControls(true);const type=challengeType();compactPrompt(type);
  if(revealed()){closePad();q('.nmb-v8-response-panel',stage())?.remove();return}
  const unknowns=prepareUnknownTiles();if(unknowns.length)missingPanel();else responsePanel(type);
}
function intercept(e){
  if(!pupilActive()||revealed())return;const target=e.target?.closest?.('[data-ba-token],.nmb-branch-bar,.nmb-branch-add,.nmb-branch-empty,[data-ba-stage-add],.nmb-tile-toolbar,.nmb-branch-toolbar,.nmb-keypad');if(!target)return;const tile=target.closest?.('[data-ba-token]');e.preventDefault();e.stopImmediatePropagation();if(tile&&isIntendedAnswerTile(tile)){const state=answerState(String(tile.dataset.baToken));if(!state.correct)answerPad(tile)}
}
function blankClick(e){if(!pupilActive())return;if(e.target.closest?.('.nmb-v8-answer-pad,.nmb-v8-response-panel,.gd-challenge-banner,[data-ba-token]'))return;closePad()}
function keyboard(e){
  if(!pupilActive()||revealed()||e.ctrlKey||e.metaKey||e.altKey)return;const tag=String(e.target?.tagName||'').toLowerCase();if(['input','textarea','select'].includes(tag))return;
  if(activeTileId){const tile=q('[data-ba-token="'+CSS.escape(activeTileId)+'"]',work()),state=tile&&answerState(activeTileId);if(!tile||!state||state.correct)return;if(/^\d$/.test(e.key)){e.preventDefault();state.buffer=(state.buffer+e.key).replace(/^0(?=\d)/,'');state.wrong=false;renderTileAnswer(tile);const d=q('.nmb-v8-answer-display',stage());if(d)d.textContent=state.buffer||'?'}else if(e.key==='Backspace'){e.preventDefault();state.buffer=state.buffer.slice(0,-1);state.wrong=false;renderTileAnswer(tile);const d=q('.nmb-v8-answer-display',stage());if(d)d.textContent=state.buffer||'?'}else if(e.key==='Enter'){e.preventDefault();checkTile(tile)}return}
  const type=challengeType(),numericMode=type==='difference'||type==='balance';if(numericMode&&/^\d$/.test(e.key)){e.preventDefault();responseBuffer=(responseBuffer+e.key).replace(/^0(?=\d)/,'');const d=q('.nmb-v8-response-display',stage());if(d)d.textContent=responseBuffer||'?'}else if(numericMode&&e.key==='Backspace'){e.preventDefault();responseBuffer=responseBuffer.slice(0,-1);const d=q('.nmb-v8-response-display',stage());if(d)d.textContent=responseBuffer||'?'}else if(numericMode&&e.key==='Enter'){e.preventDefault();const panel=q('.nmb-v8-response-panel',stage());if(panel)checkNumericResponse(type,panel)}
}
function observe(){observer?.disconnect();const s=stage();if(!s)return;observer=new MutationObserver(scheduleAdapt);observer.observe(s,{childList:true})}
function install(){
  if(installed)return;installed=true;document.addEventListener('pointerdown',intercept,true);document.addEventListener('click',intercept,true);document.addEventListener('click',blankClick,true);document.addEventListener('keydown',keyboard,true);document.addEventListener('click',()=>setTimeout(scheduleAdapt,0),true);document.addEventListener('change',scheduleAdapt,true);
  observe();const root=document.getElementById('tt99-goodies-root');if(root){const rootObserver=new MutationObserver(()=>{observe();scheduleAdapt()});rootObserver.observe(root,{childList:true})}scheduleAdapt();
}
G.numberMobilePupilChallengeVersion='8.3';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else queueMicrotask(install);
})(window.TT99Goodies);
