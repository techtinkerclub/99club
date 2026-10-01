/* 99 Club Studio · Number Mobile Balance v6
 * Stable difficulty-aware challenge layer over v3/v4.
 * Uses event-driven refreshes rather than observing and rewriting its own stage.
 */
(function(G){
'use strict';
if(!G||typeof G.balanceTool!=='function')return;

const balanceToolV4=G.balanceTool;
const TYPE_CATEGORY={
  'missing-weight':'read','choose-relation':'read','find-difference':'read',
  'make-balance':'build','same-to-both':'build','spot-false-equality':'reason'
};
const TYPE_LABEL={
  'missing-weight':'Missing number','make-balance':'Make it balance',
  'choose-relation':'Compare','find-difference':'Difference',
  'same-to-both':'Same to both','spot-false-equality':'Spot the mistake'
};
const TYPES=['missing-weight','make-balance','choose-relation','find-difference','same-to-both','spot-false-equality'];
const COMPLEX=new Set(['missing-weight','make-balance','choose-relation','find-difference','spot-false-equality']);
const DIFFICULTY_COPY={
  easy:'Simple, direct balance challenges.',
  medium:'One hanging balance and an extra reasoning step.',
  hard:'Two hanging balances, multiple constraints and sometimes more than one missing number.'
};

let difficulty='easy',complexSpec=null,busy=false,popoverOpen=false,installed=false;
let railObserver=null,railNode=null,boardSyncing=false,adaptTimer=null;

function q(sel,root=document){return root?.querySelector?.(sel)||null}
function qa(sel,root=document){return root?.querySelectorAll?[...root.querySelectorAll(sel)]:[]}
function stage(){return document.getElementById('gd-stage')}
function controls(){return document.getElementById('gd-controls')}
function work(){return q('.gd-number-mobile-workbench',stage())}
function banner(){return q('.gd-challenge-banner',stage())}
function wait(ms=35){return new Promise(resolve=>setTimeout(resolve,ms))}
async function waitFor(fn,{tries=36,delay=30}={}){for(let i=0;i<tries;i++){const value=fn();if(value)return value;await wait(delay)}return null}
function randint(min,max){return min+Math.floor(Math.random()*(max-min+1))}
function setText(el,text){if(el&&el.textContent!==String(text))el.textContent=String(text)}
function scheduleAdapt(delay=0){clearTimeout(adaptTimer);adaptTimer=setTimeout(adapt,delay)}
function token(id){return q('[data-ba-token="'+CSS.escape(String(id))+'"]',work())}
function tokenIds(root=work()){return new Set(qa('[data-ba-token]',root).map(el=>String(el.dataset.baToken)))}
function activeChallenge(){return !!banner()}
function titleFor(type){return TYPE_LABEL[type]||'Challenge'}

function closePopover(){
  popoverOpen=false;qa('.nmb-v5-challenge-popover',work()).forEach(el=>el.remove());
  const trigger=q('[data-nmb-challenge-toggle]',work());if(trigger)trigger.setAttribute('aria-expanded','false');
  syncBoardButton();
}
function challengePopover(){
  const pop=document.createElement('div');pop.className='nmb-v5-challenge-popover';pop.setAttribute('role','menu');pop.setAttribute('aria-label','Number Mobile challenge generator');
  pop.innerHTML='<div class="nmb-v5-popover-head"><strong>Generate challenge</strong><span>Choose a difficulty first.</span></div>'+ 
    '<div class="nmb-v5-difficulty-row" role="group" aria-label="Challenge difficulty">'+
      ['easy','medium','hard'].map(level=>'<button type="button" class="nmb-v5-difficulty'+(difficulty===level?' is-active':'')+'" data-nmb-v6-difficulty="'+level+'">'+level[0].toUpperCase()+level.slice(1)+'</button>').join('')+
    '</div><p class="nmb-v5-difficulty-help">'+DIFFICULTY_COPY[difficulty]+'</p>'+ 
    '<div class="nmb-v5-challenge-grid"><button type="button" class="is-surprise" data-nmb-v6-type="random">Surprise me</button>'+ 
      TYPES.map(type=>'<button type="button" data-nmb-v6-type="'+type+'">'+titleFor(type)+'</button>').join('')+'</div>'+ 
    (activeChallenge()?'<button type="button" class="nmb-v5-clear is-danger" data-nmb-v6-clear>Clear challenge</button>':'');
  qa('[data-nmb-v6-difficulty]',pop).forEach(button=>button.onclick=e=>{
    e.stopPropagation();difficulty=button.dataset.nmbV6Difficulty||'easy';G.numberMobileChallengeDifficulty=difficulty;
    const fresh=challengePopover();pop.replaceWith(fresh);popoverOpen=true;const trigger=q('[data-nmb-challenge-toggle]',work());if(trigger)trigger.setAttribute('aria-expanded','true');
  });
  qa('[data-nmb-v6-type]',pop).forEach(button=>button.onclick=e=>{e.stopPropagation();generate(button.dataset.nmbV6Type)});
  const clear=q('[data-nmb-v6-clear]',pop);if(clear)clear.onclick=e=>{e.stopPropagation();clearChallenge()};
  return pop;
}
function togglePopover(){
  if(busy)return;const w=work();if(!w)return;
  const existing=q('.nmb-v5-challenge-popover',w);if(existing){closePopover();return}
  popoverOpen=true;qa('.nmb-challenge-popover',w).forEach(el=>el.remove());w.appendChild(challengePopover());
  const trigger=q('[data-nmb-challenge-toggle]',w);if(trigger)trigger.setAttribute('aria-expanded','true');syncBoardButton();
}
function hookTrigger(){
  const trigger=q('[data-nmb-challenge-toggle]',work());if(!trigger||trigger.dataset.nmbV6Bound)return;
  trigger.dataset.nmbV6Bound='1';
  trigger.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();togglePopover()},true);
}

function boardRail(){
  if(!document.body.classList.contains('gd-embed-page')||window.parent===window)return null;
  try{return window.frameElement?.closest?.('[data-board-object]')?.querySelector?.('[data-board-quick-actions]')||null}catch(_){return null}
}
function syncBoardButton(){
  const rail=boardRail();if(!rail||boardSyncing)return;boardSyncing=true;
  try{
    let button=q('[data-nmb-board-challenge]',rail);
    if(!button){
      button=rail.ownerDocument.createElement('button');button.type='button';button.dataset.nmbBoardChallenge='1';button.textContent='Challenge';button.title='Generate a Number Mobile challenge';button.setAttribute('aria-label','Generate a Number Mobile challenge');
      button.onpointerdown=e=>e.stopPropagation();button.onclick=e=>{e.preventDefault();e.stopPropagation();q('[data-nmb-challenge-toggle]',work())?.click()};
      const peers=qa(':scope > button:not([data-nmb-board-challenge])',rail);rail.insertBefore(button,peers[2]||null);
    }
    button.classList.toggle('is-active',popoverOpen);button.setAttribute('aria-expanded',popoverOpen?'true':'false');
    qa(':scope > button',rail).forEach(peer=>{if(peer!==button)peer.hidden=!!complexSpec?.readOnly});
    if(railNode!==rail){railObserver?.disconnect();railNode=rail;railObserver=new MutationObserver(()=>queueMicrotask(syncBoardButton));railObserver.observe(rail,{childList:true})}
  }finally{boardSyncing=false}
}

async function selectWorkflow(name){const button=q('[data-ba-workflow="'+name+'"]',controls());if(!button)return false;button.click();await wait(30);return true}
async function clearExisting(){
  if(!activeChallenge())return;
  await selectWorkflow('challenge');const clear=await waitFor(()=>q('#ba-clear-challenge',controls()));
  if(clear){complexSpec=null;clear.click();await wait(70)}
}
async function standardChallenge(type){
  busy=true;closePopover();complexSpec=null;
  try{
    if(type==='random')type=TYPES[Math.floor(Math.random()*TYPES.length)];
    await clearExisting();if(!await selectWorkflow('challenge'))return;
    let c=controls(),cat=q('[data-ba-challenge-cat="'+(TYPE_CATEGORY[type]||'read')+'"]',c);if(cat){cat.click();await wait(20)}
    c=controls();const typeButton=q('[data-ba-challenge-type="'+type+'"]',c);if(typeButton){typeButton.click();await wait(20)}
    c=controls();const go=q('#ba-generate',c);if(go){go.click();await wait(80)}
  }finally{busy=false;adapt()}
}

async function enterCustomShell(){
  await clearExisting();if(!await selectWorkflow('challenge'))return false;
  const custom=await waitFor(()=>q('[data-ba-challenge-tab="custom"]',controls()));if(!custom)return false;custom.click();await wait(55);
  const clear=await waitFor(()=>q('#ba-clear',controls()));if(!clear)return false;clear.click();await wait(65);return true;
}
async function addNumber(side,value){
  const before=tokenIds(),input=await waitFor(()=>q('#ba-custom',controls())),button=await waitFor(()=>q(side==='right'?'#ba-add-right':'#ba-add-left',controls()));
  if(!input||!button)throw new Error('Number Mobile add controls unavailable');input.value=String(value);button.click();
  const added=await waitFor(()=>qa('[data-ba-token]',work()).find(el=>!before.has(String(el.dataset.baToken))),{tries:42,delay:25});
  if(!added)throw new Error('Number Mobile did not add a number box');await wait(30);adapt();return String(added.dataset.baToken);
}
async function selectToken(id){const el=await waitFor(()=>token(id));if(!el)throw new Error('Number Mobile box not found');if(el.disabled)el.disabled=false;el.click();await wait(40);adapt();return el}
async function setTokenValue(id,value){
  await selectToken(id);const input=await waitFor(()=>document.getElementById('ba-value'));if(!input)throw new Error('Number Mobile value editor unavailable');input.value=String(value);input.dispatchEvent(new Event('change',{bubbles:true}));await wait(55);adapt();
}
async function hideToken(id){
  await selectToken(id);const input=await waitFor(()=>document.getElementById('ba-hidden'));if(!input)throw new Error('Number Mobile hide control unavailable');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));await wait(55);adapt();
}
async function branchToken(id,rightValue,extras=[]){
  await selectToken(id);const branchButton=await waitFor(()=>qa('.nmb-tile-toolbar button',work()).find(b=>b.textContent.trim()==='Branch'));if(!branchButton)throw new Error('Number Mobile branch action unavailable');
  branchButton.click();await wait(110);adapt();
  const branch=await waitFor(()=>token(id)?.closest('.nmb-branch'));if(!branch)throw new Error('Number Mobile branch was not created');const branchId=String(branch.dataset.nmbBranch);
  let live=q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work()),rightToken=q('.nmb-branch-side--right [data-ba-token]',live);if(!rightToken)throw new Error('Number Mobile branch right box missing');
  const rightId=String(rightToken.dataset.baToken);await setTokenValue(rightId,rightValue);const ids={left:[String(id)],right:[rightId]};
  for(const extra of extras){
    live=await waitFor(()=>q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work()));q('.nmb-branch-bar',live)?.click();await wait(30);adapt();live=q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work());
    const before=tokenIds(live),toolbar=q('.nmb-branch-toolbar',live),label=extra.slot==='right'?'+ Right':'+ Left',add=qa('button',toolbar).find(b=>b.textContent.trim()===label);if(!add)throw new Error('Number Mobile branch add action unavailable');
    add.click();const added=await waitFor(()=>{const now=q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work());return qa('[data-ba-token]',now).find(el=>!before.has(String(el.dataset.baToken)))},{tries:42,delay:25});
    if(!added)throw new Error('Number Mobile did not add a branch box');const newId=String(added.dataset.baToken);await setTokenValue(newId,extra.value);ids[extra.slot==='right'?'right':'left'].push(newId);
  }
  return{branchId,ids};
}
async function balancedBranch(side,sum){const part=randint(2,sum-2),other=sum-part,root=await addNumber(side,part),branch=await branchToken(root,sum,[{slot:'left',value:other}]);return{...branch,sum}}
async function setCustomCopy(spec){
  const title=await waitFor(()=>q('#ba-custom-title',controls()));if(title){title.value=spec.difficulty[0].toUpperCase()+spec.difficulty.slice(1)+' · '+titleFor(spec.type);title.dispatchEvent(new Event('input',{bubbles:true}));await wait(20)}
  const prompt=await waitFor(()=>q('#ba-custom-prompt',controls()));if(prompt){prompt.textContent=spec.prompt;prompt.dispatchEvent(new Event('input',{bubbles:true}));await wait(20)}
  const answer=await waitFor(()=>q('#ba-custom-answer',controls()));if(answer){answer.value=spec.answer;answer.dispatchEvent(new Event('input',{bubbles:true}));await wait(30)}
}

async function buildMissing(level){
  const S=randint(level==='hard'?9:8,level==='hard'?15:13);
  if(level==='medium'){
    const known=randint(2,S-2),missing=S-known,root=await addNumber('left',missing),branch=await branchToken(root,S,[{slot:'left',value:known}]);await addNumber('right',2*S);await hideToken(root);
    return{type:'missing-weight',difficulty:level,readOnly:true,balancedBranchIds:[branch.branchId],prompt:'Every bar is balanced. Work out the missing number in the smaller hanging balance.',answer:String(missing)};
  }
  const p1=randint(2,S-2),m1=S-p1,p2=randint(2,S-2),m2=S-p2,leftRoot=await addNumber('left',m1),left=await branchToken(leftRoot,S,[{slot:'left',value:p1}]),rightRoot=await addNumber('right',S),right=await branchToken(rightRoot,m2,[{slot:'right',value:p2}]);
  await hideToken(leftRoot);await hideToken(right.ids.right[0]);
  return{type:'missing-weight',difficulty:level,readOnly:true,balancedBranchIds:[left.branchId,right.branchId],prompt:'Every bar is balanced. Find both missing numbers. Use the two smaller balances before checking the main bar.',answer:m1+' and '+m2};
}
async function buildCompare(level){
  if(level==='medium'){const S=randint(7,13),branch=await balancedBranch('left',S),delta=randint(2,7);await addNumber('right',2*S+delta);return{type:'choose-relation',difficulty:level,readOnly:true,balancedBranchIds:[branch.branchId],prompt:'Which main side is heavier? Work out the value of the hanging branch before you compare the two sides.',answer:'Right side'}}
  let s1=randint(7,12),s2=randint(8,14);if(s1===s2)s2+=2;const left=await balancedBranch('left',s1),right=await balancedBranch('right',s2);
  return{type:'choose-relation',difficulty:level,readOnly:true,balancedBranchIds:[left.branchId,right.branchId],prompt:'Compare the two main sides. Each smaller bar is balanced, so calculate through both branches before deciding which side is heavier.',answer:s1>s2?'Left side':'Right side'};
}
async function buildDifference(level){
  if(level==='medium'){const S=randint(8,13),branch=await balancedBranch('left',S),gap=randint(3,8);await addNumber('right',2*S-gap);return{type:'find-difference',difficulty:level,readOnly:true,balancedBranchIds:[branch.branchId],prompt:'How much heavier is the left main side than the right? Work through the hanging balance first.',answer:String(gap)}}
  const s1=randint(10,15),gap=randint(2,5),s2=s1-gap,left=await balancedBranch('left',s1),right=await balancedBranch('right',s2);
  return{type:'find-difference',difficulty:level,readOnly:true,balancedBranchIds:[left.branchId,right.branchId],prompt:'Find the difference between the two main sides. Both smaller bars are balanced, so calculate the contribution of each whole branch.',answer:String(2*gap)};
}
async function buildSpot(level){
  if(level==='medium'){const S=randint(7,12),branch=await balancedBranch('left',S),wrong=2*S+randint(2,6);await addNumber('right',wrong);return{type:'spot-false-equality',difficulty:level,readOnly:true,balancedBranchIds:[branch.branchId],prompt:'A pupil says the main mobile is balanced. Are they correct? Explain how you know.',answer:'No. The left side totals '+(2*S)+' and the right side totals '+wrong+'.'}}
  const s1=randint(8,12),s2=s1+randint(1,4),left=await balancedBranch('left',s1),right=await balancedBranch('right',s2);
  return{type:'spot-false-equality',difficulty:level,readOnly:true,balancedBranchIds:[left.branchId,right.branchId],prompt:'A pupil says the whole mobile is balanced because both smaller bars are balanced. Are they correct? Explain.',answer:'No. The left branch totals '+(2*s1)+' and the right branch totals '+(2*s2)+'.'};
}
async function buildBalance(level){
  if(level==='medium'){const root=await addNumber('left',5);await branchToken(root,7,[{slot:'left',value:3}]);await addNumber('right',14);return{type:'make-balance',difficulty:level,readOnly:false,balancedBranchIds:[],prompt:'Make every bar balance. You may edit, add, move or delete number boxes. The smaller bar and the main bar must both finish level.',answer:'Any arrangement where the smaller bar and the main bar are both balanced.'}}
  const leftRoot=await addNumber('left',4);await branchToken(leftRoot,6,[{slot:'left',value:3}]);const rightRoot=await addNumber('right',8);await branchToken(rightRoot,4,[{slot:'right',value:2}]);
  return{type:'make-balance',difficulty:level,readOnly:false,balancedBranchIds:[],prompt:'Make the entire mobile balance. Both smaller bars must balance internally and the main bar must balance too.',answer:'Any arrangement where both smaller bars and the main bar are balanced.'};
}
async function complexChallenge(type,level){
  busy=true;closePopover();complexSpec=null;
  try{
    if(type==='random'){const pool=[...COMPLEX];type=pool[Math.floor(Math.random()*pool.length)]}
    if(!COMPLEX.has(type)){await standardChallenge(type);return}
    if(!await enterCustomShell())throw new Error('Could not open Number Mobile custom challenge mode');
    let spec;if(type==='missing-weight')spec=await buildMissing(level);else if(type==='choose-relation')spec=await buildCompare(level);else if(type==='find-difference')spec=await buildDifference(level);else if(type==='spot-false-equality')spec=await buildSpot(level);else spec=await buildBalance(level);
    complexSpec=spec;await setCustomCopy(spec);adapt();
  }catch(err){console.error('Number Mobile complex challenge:',err);complexSpec=null}
  finally{busy=false;adapt()}
}
function generate(type){G.numberMobileChallengeDifficulty=difficulty;return difficulty==='easy'?standardChallenge(type):complexChallenge(type,difficulty)}
async function clearChallenge(){
  busy=true;closePopover();try{await selectWorkflow('challenge');const clear=await waitFor(()=>q('#ba-clear-challenge',controls()));complexSpec=null;if(clear){clear.click();await wait(75)}}finally{busy=false;adapt()}
}

function numericText(el){const value=Number(String(el?.textContent||'').trim());return Number.isFinite(value)?value:0}
function sumTokens(container){return qa('[data-ba-token] strong',container).reduce((sum,strong)=>sum+numericText(strong),0)}
function mainTotals(){const w=work();return{left:sumTokens(q('.gd-eq-side--left .gd-eq-weights',w)),right:sumTokens(q('.gd-eq-side--right .gd-eq-weights',w))}}
function branchBalanced(branch){const left=q(':scope > .nmb-branch-sides > .nmb-branch-side--left > .nmb-branch-children',branch),right=q(':scope > .nmb-branch-sides > .nmb-branch-side--right > .nmb-branch-children',branch);return Math.abs(sumTokens(left)-sumTokens(right))<1e-9}
function mobileBalanced(){const totals=mainTotals();return Math.abs(totals.left-totals.right)<1e-9&&qa('.nmb-branch',work()).every(branchBalanced)}
function sideExpression(side){const box=q('.gd-eq-side--'+side+' .gd-eq-weights',work()),values=qa('[data-ba-token] strong',box).map(el=>String(el.textContent||'').trim()||'?');return values.length?values.join(' + '):'0'}
function promptText(){return String(q('.gd-challenge-prompt',banner())?.textContent||'').trim().toLowerCase()}
function maskChallengeReadouts(){
  const w=work(),b=banner();if(!w)return;const active=!!b;document.body.classList.toggle('nmb-v5-challenge-active',active);w.classList.toggle('nmb-v5-challenge-active',active);w.classList.toggle('nmb-v5-readonly',!!complexSpec?.readOnly);
  const totalsToggle=q('#ba-show-totals',controls())?.closest('label');if(totalsToggle)totalsToggle.style.display=active?'none':'';if(!active)return;
  const kicker=q('.gd-challenge-kicker',b);setText(kicker,'NUMBER MOBILE · '+difficulty.toUpperCase());
  const verdict=q('.gd-eq-verdict strong',w),verdictLabel=q('.gd-eq-verdict span',w),eq=q('[data-ba-equation]',w);let task='Challenge';
  if(complexSpec){
    if(complexSpec.type==='make-balance')task=mobileBalanced()?'Balanced ✓':'Keep adjusting the mobile';
    else if(complexSpec.type==='missing-weight')task=complexSpec.difficulty==='hard'?'Find both missing numbers':'Find the missing number';
    else if(complexSpec.type==='choose-relation')task='Compare the two main sides';
    else if(complexSpec.type==='find-difference')task='Find the difference';
    else if(complexSpec.type==='spot-false-equality')task='Check the pupil’s claim';
    if(eq){
      if(complexSpec.type==='make-balance')setText(eq,'Make every bar balance');
      else if(complexSpec.type==='missing-weight')setText(eq,'Use the hanging balance'+(complexSpec.difficulty==='hard'?'s':'')+' to solve the missing number'+(complexSpec.difficulty==='hard'?'s':''));
      else if(complexSpec.type==='choose-relation')setText(eq,'Compare the two main sides');
      else if(complexSpec.type==='find-difference')setText(eq,'Find the difference between the main sides');
      else if(complexSpec.type==='spot-false-equality')setText(eq,'Is the main mobile balanced?');
    }
    (complexSpec.balancedBranchIds||[]).forEach(id=>{const branch=q('[data-nmb-branch="'+CSS.escape(String(id))+'"]',w);if(branch){branch.style.setProperty('--nmb-branch-angle','0deg');branch.style.setProperty('--nmb-branch-left','0px');branch.style.setProperty('--nmb-branch-right','0px')}});
  }else{
    const prompt=promptText();
    if(/make both sides equal|make it balance/.test(prompt))task=mainTotals().left===mainTotals().right?'Balanced ✓':'Keep adjusting the balance';
    else if(/which symbol|<, > or =/.test(prompt)){task='Choose <, > or =';setText(eq,sideExpression('left')+' ? '+sideExpression('right'))}
    else if(/how much heavier|difference/.test(prompt)){task='Find the difference';setText(eq,'Find the difference between the two sides')}
    else if(/pupil says|are they correct|false equality/.test(prompt)){task='Check the equality';setText(eq,sideExpression('left')+' = '+sideExpression('right'))}
    else if(/hidden|question mark|missing/.test(prompt)){task='Find the missing number';setText(eq,sideExpression('left')+' = '+sideExpression('right'))}
    else if(/add .*both sides|both sides/.test(prompt))task='Keep both sides equal';
  }
  setText(verdict,task);setText(verdictLabel,complexSpec?.type==='make-balance'?'Status':'Task');
}
function freezeReadonly(){
  if(!complexSpec?.readOnly)return;const w=work();if(!w)return;
  qa('[data-ba-token],[data-ba-stage-add],.nmb-branch-add,.nmb-branch-empty',w).forEach(el=>{el.disabled=true;el.setAttribute('aria-disabled','true')});
  qa('.nmb-keypad,.nmb-tile-toolbar,.nmb-branch-toolbar',w).forEach(el=>el.remove());
  ['ba-move','ba-duplicate','ba-delete','ba-minus','ba-plus','ba-value','ba-hidden'].forEach(id=>{const el=document.getElementById(id);if(el)el.disabled=true});
}
function ensureAnother(){
  const b=banner();if(!b||!complexSpec)return;const actions=q('.gd-challenge-actions',b);if(!actions||q('[data-nmb-v6-another]',actions))return;
  const button=document.createElement('button');button.type='button';button.className='gd-challenge-action';button.dataset.nmbV6Another='1';button.textContent='Another like this';button.onclick=e=>{e.stopPropagation();complexChallenge(complexSpec.type,complexSpec.difficulty)};
  actions.insertBefore(button,q('[data-board-action="reveal"]',actions)||null);
}
function adapt(){
  const w=work();if(!w)return;hookTrigger();maskChallengeReadouts();freezeReadonly();ensureAnother();syncBoardButton();
  if(popoverOpen&&!q('.nmb-v5-challenge-popover',w)){w.appendChild(challengePopover());q('[data-nmb-challenge-toggle]',w)?.setAttribute('aria-expanded','true')}
}
function install(){
  if(installed)return;installed=true;G.numberMobileChallengeDifficulty=difficulty;
  document.addEventListener('click',e=>{
    if(popoverOpen&&!e.target.closest?.('.nmb-v5-challenge-popover,[data-nmb-challenge-toggle]'))closePopover();
    scheduleAdapt(0);scheduleAdapt(70);
  },true);
  document.addEventListener('change',()=>scheduleAdapt(40),true);document.addEventListener('input',()=>scheduleAdapt(40),true);document.addEventListener('pointerup',()=>scheduleAdapt(60),true);
  adapt();
}
G.balanceTool=function numberMobileBalanceToolV6(){const result=balanceToolV4.apply(this,arguments);complexSpec=null;popoverOpen=false;setTimeout(adapt,30);setTimeout(adapt,130);return result};
G.numberMobileBalanceEnhancementVersion='6.0';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else queueMicrotask(install);
})(window.TT99Goodies);
