/* 99 Club Studio · Number Mobile Balance v5
 * Difficulty-aware classroom challenge layer over v3/v4.
 * Easy keeps the shared standard challenge engine. Medium/Hard build curated
 * branched mobiles, then use the shared custom challenge/reveal machinery.
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
const TYPE_ORDER=['missing-weight','make-balance','choose-relation','find-difference','same-to-both','spot-false-equality'];
const COMPLEX_TYPES=new Set(['missing-weight','make-balance','choose-relation','find-difference','spot-false-equality']);
const DIFFICULTY_COPY={
  easy:'Simple, direct balance challenges.',
  medium:'Adds a smaller hanging balance and an extra reasoning step.',
  hard:'Uses two hanging balances, multiple constraints and sometimes more than one missing number.'
};

let difficulty='easy',complexSpec=null,busy=false,open=false,installed=false;
let stageObserver=null,controlsObserver=null,railObserver=null,railNode=null,boardSyncing=false;

function q(sel,root=document){return root?.querySelector?.(sel)||null}
function qa(sel,root=document){return root?.querySelectorAll?[...root.querySelectorAll(sel)]:[]}
function stage(){return document.getElementById('gd-stage')}
function controls(){return document.getElementById('gd-controls')}
function work(){return q('.gd-number-mobile-workbench',stage())}
function banner(){return q('.gd-challenge-banner',stage())}
function wait(ms=40){return new Promise(resolve=>setTimeout(resolve,ms))}
async function waitFor(fn,{tries=30,delay=30}={}){
  for(let i=0;i<tries;i++){
    const value=fn();if(value)return value;
    await wait(delay);
  }
  return null;
}
function randint(min,max){return min+Math.floor(Math.random()*(max-min+1))}
function token(id){return q('[data-ba-token="'+CSS.escape(String(id))+'"]',work())}
function tokenIds(root=work()){return new Set(qa('[data-ba-token]',root).map(el=>String(el.dataset.baToken)))}
function selectedControl(id){return document.getElementById(id)}
function challengeActive(){return !!banner()}
function titleFor(type){return TYPE_LABEL[type]||'Challenge'}

function closePopover(){
  open=false;qa('.nmb-v5-challenge-popover',work()).forEach(el=>el.remove());
  const trigger=q('[data-nmb-challenge-toggle]',work());if(trigger)trigger.setAttribute('aria-expanded','false');
  syncBoardChallengeButton();
}
function difficultyButtons(){
  return ['easy','medium','hard'].map(level=>'<button type="button" class="nmb-v5-difficulty'+(difficulty===level?' is-active':'')+'" data-nmb-v5-difficulty="'+level+'">'+level[0].toUpperCase()+level.slice(1)+'</button>').join('');
}
function challengePopover(){
  const pop=document.createElement('div');pop.className='nmb-v5-challenge-popover';pop.setAttribute('role','menu');pop.setAttribute('aria-label','Number Mobile challenge generator');
  pop.innerHTML='<div class="nmb-v5-popover-head"><strong>Generate challenge</strong><span>Choose a difficulty first.</span></div>'+ 
    '<div class="nmb-v5-difficulty-row" role="group" aria-label="Challenge difficulty">'+difficultyButtons()+'</div>'+ 
    '<p class="nmb-v5-difficulty-help">'+DIFFICULTY_COPY[difficulty]+'</p>'+ 
    '<div class="nmb-v5-challenge-grid">'+
      '<button type="button" class="is-surprise" data-nmb-v5-type="random">Surprise me</button>'+ 
      TYPE_ORDER.map(type=>'<button type="button" data-nmb-v5-type="'+type+'">'+titleFor(type)+'</button>').join('')+
    '</div>'+ 
    (challengeActive()?'<button type="button" class="nmb-v5-clear is-danger" data-nmb-v5-clear>Clear challenge</button>':'');
  qa('[data-nmb-v5-difficulty]',pop).forEach(button=>button.onclick=e=>{
    e.stopPropagation();difficulty=button.dataset.nmbV5Difficulty||'easy';G.numberMobileChallengeDifficulty=difficulty;
    const fresh=challengePopover();pop.replaceWith(fresh);open=true;const trigger=q('[data-nmb-challenge-toggle]',work());if(trigger)trigger.setAttribute('aria-expanded','true');
  });
  qa('[data-nmb-v5-type]',pop).forEach(button=>button.onclick=e=>{e.stopPropagation();generate(button.dataset.nmbV5Type)});
  const clear=q('[data-nmb-v5-clear]',pop);if(clear)clear.onclick=e=>{e.stopPropagation();clearChallenge()};
  return pop;
}
function togglePopover(){
  if(busy)return;
  const w=work();if(!w)return;
  const existing=q('.nmb-v5-challenge-popover',w);
  if(existing){closePopover();return}
  open=true;
  qa('.nmb-challenge-popover',w).forEach(el=>el.remove());
  w.appendChild(challengePopover());
  const trigger=q('[data-nmb-challenge-toggle]',w);if(trigger)trigger.setAttribute('aria-expanded','true');
  syncBoardChallengeButton();
}
function hookTrigger(){
  const trigger=q('[data-nmb-challenge-toggle]',work());if(!trigger||trigger.dataset.nmbV5Bound)return;
  trigger.dataset.nmbV5Bound='1';
  trigger.addEventListener('click',e=>{
    e.preventDefault();e.stopImmediatePropagation();togglePopover();
  },true);
}

function boardRail(){
  if(!document.body.classList.contains('gd-embed-page')||window.parent===window)return null;
  try{return window.frameElement?.closest?.('[data-board-object]')?.querySelector?.('[data-board-quick-actions]')||null}catch(_){return null}
}
function syncBoardChallengeButton(){
  const rail=boardRail();if(!rail||boardSyncing)return;
  boardSyncing=true;
  try{
    let button=q('[data-nmb-board-challenge]',rail);
    if(!button){
      button=rail.ownerDocument.createElement('button');button.type='button';button.dataset.nmbBoardChallenge='1';button.textContent='Challenge';button.title='Generate a Number Mobile challenge';button.setAttribute('aria-label','Generate a Number Mobile challenge');
      button.onpointerdown=e=>e.stopPropagation();
      button.onclick=e=>{e.preventDefault();e.stopPropagation();const trigger=q('[data-nmb-challenge-toggle]',work());if(trigger)trigger.click()};
      const peers=qa(':scope > button:not([data-nmb-board-challenge])',rail);rail.insertBefore(button,peers[2]||null);
    }
    button.classList.toggle('is-active',open);button.setAttribute('aria-expanded',open?'true':'false');
    if(complexSpec?.readOnly){
      qa(':scope > button',rail).forEach(peer=>{if(peer!==button)peer.hidden=true});
    }else{
      qa(':scope > button',rail).forEach(peer=>{if(peer!==button)peer.hidden=false});
    }
    if(railNode!==rail){
      railObserver?.disconnect();railNode=rail;
      railObserver=new MutationObserver(()=>queueMicrotask(syncBoardChallengeButton));railObserver.observe(rail,{childList:true});
    }
  }finally{boardSyncing=false}
}

async function selectWorkflow(name){
  const button=q('[data-ba-workflow="'+name+'"]',controls());if(!button)return false;
  button.click();await wait(35);return true;
}
async function clearExistingChallenge(){
  if(!challengeActive())return;
  await selectWorkflow('challenge');
  const clear=await waitFor(()=>q('#ba-clear-challenge',controls()));
  if(clear){complexSpec=null;clear.click();await wait(70)}
}
async function standardChallenge(type){
  busy=true;closePopover();complexSpec=null;
  try{
    if(type==='random')type=TYPE_ORDER[Math.floor(Math.random()*TYPE_ORDER.length)];
    await clearExistingChallenge();
    if(!await selectWorkflow('challenge'))return;
    const category=TYPE_CATEGORY[type]||'read';
    let c=controls(),cat=q('[data-ba-challenge-cat="'+category+'"]',c);if(cat){cat.click();await wait(25)}
    c=controls();const typeButton=q('[data-ba-challenge-type="'+type+'"]',c);if(typeButton){typeButton.click();await wait(25)}
    c=controls();const go=q('#ba-generate',c);if(go){go.click();await wait(90)}
  }finally{busy=false;adapt()}
}

async function enterCustomShell(){
  await clearExistingChallenge();
  if(!await selectWorkflow('challenge'))return false;
  const custom=await waitFor(()=>q('[data-ba-challenge-tab="custom"]',controls()));if(!custom)return false;
  custom.click();await wait(60);
  const clear=await waitFor(()=>q('#ba-clear',controls()));if(!clear)return false;
  clear.click();await wait(70);
  return true;
}
async function addNumber(side,value){
  const before=tokenIds();
  const input=await waitFor(()=>q('#ba-custom',controls()));const button=await waitFor(()=>q(side==='right'?'#ba-add-right':'#ba-add-left',controls()));
  if(!input||!button)throw new Error('Number Mobile add controls unavailable');
  input.value=String(value);button.click();
  const added=await waitFor(()=>qa('[data-ba-token]',work()).find(el=>!before.has(String(el.dataset.baToken))),{tries:40,delay:25});
  if(!added)throw new Error('Number Mobile did not add a number box');
  await wait(35);return String(added.dataset.baToken);
}
async function selectToken(id){
  const el=await waitFor(()=>token(id));if(!el)throw new Error('Number Mobile box not found');
  if(el.disabled)el.disabled=false;
  el.click();await wait(45);return el;
}
async function setTokenValue(id,value){
  await selectToken(id);
  const input=await waitFor(()=>selectedControl('ba-value'));if(!input)throw new Error('Number Mobile value editor unavailable');
  input.value=String(value);input.dispatchEvent(new Event('change',{bubbles:true}));await wait(65);
}
async function hideToken(id){
  await selectToken(id);
  const input=await waitFor(()=>selectedControl('ba-hidden'));if(!input)throw new Error('Number Mobile hide control unavailable');
  input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));await wait(65);
}
async function branchToken(id,rightValue,extras=[]){
  await selectToken(id);
  const branchButton=await waitFor(()=>qa('.nmb-tile-toolbar button',work()).find(b=>b.textContent.trim()==='Branch'));
  if(!branchButton)throw new Error('Number Mobile branch action unavailable');
  branchButton.click();await wait(130);
  const branch=await waitFor(()=>token(id)?.closest('.nmb-branch'));if(!branch)throw new Error('Number Mobile branch was not created');
  const branchId=String(branch.dataset.nmbBranch);
  let live=q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work());
  const rightToken=q('.nmb-branch-side--right [data-ba-token]',live);if(!rightToken)throw new Error('Number Mobile branch right box missing');
  const rightId=String(rightToken.dataset.baToken);await setTokenValue(rightId,rightValue);
  const ids={left:[String(id)],right:[rightId]};
  for(const extra of extras){
    live=await waitFor(()=>q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work()));
    q('.nmb-branch-bar',live)?.click();await wait(35);
    live=q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work());
    const before=tokenIds(live),toolbar=q('.nmb-branch-toolbar',live);
    const label=extra.slot==='right'?'+ Right':'+ Left';
    const add=qa('button',toolbar).find(b=>b.textContent.trim()===label);if(!add)throw new Error('Number Mobile branch add action unavailable');
    add.click();
    const added=await waitFor(()=>{const branchNow=q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work());return qa('[data-ba-token]',branchNow).find(el=>!before.has(String(el.dataset.baToken)))},{tries:40,delay:25});
    if(!added)throw new Error('Number Mobile did not add a branch box');
    const newId=String(added.dataset.baToken);await setTokenValue(newId,extra.value);ids[extra.slot==='right'?'right':'left'].push(newId);
  }
  return{branchId,ids};
}
async function balancedBranch(side,sum){
  const part=randint(2,Math.max(2,sum-2)),other=sum-part;
  const root=await addNumber(side,part);
  const branch=await branchToken(root,sum,[{slot:'left',value:other}]);
  return{...branch,sum,values:[part,other,sum]};
}

async function setCustomCopy(spec){
  const title=await waitFor(()=>q('#ba-custom-title',controls()));if(title){title.value=spec.difficulty[0].toUpperCase()+spec.difficulty.slice(1)+' · '+titleFor(spec.type);title.dispatchEvent(new Event('input',{bubbles:true}));await wait(30)}
  const prompt=await waitFor(()=>q('#ba-custom-prompt',controls()));if(prompt){prompt.textContent=spec.prompt;prompt.dispatchEvent(new Event('input',{bubbles:true}));await wait(30)}
  const answer=await waitFor(()=>q('#ba-custom-answer',controls()));if(answer){answer.value=spec.answer;answer.dispatchEvent(new Event('input',{bubbles:true}));await wait(45)}
}
async function buildMissing(level){
  const S=randint(level==='hard'?9:8,level==='hard'?15:13);
  if(level==='medium'){
    const known=randint(2,S-2),missing=S-known;
    const root=await addNumber('left',missing),branch=await branchToken(root,S,[{slot:'left',value:known}]);
    await addNumber('right',2*S);await hideToken(root);
    return{type:'missing-weight',difficulty:level,readOnly:true,balancedBranchIds:[branch.branchId],prompt:'Every bar is balanced. Work out the missing number in the smaller hanging balance.',answer:String(missing)};
  }
  const p1=randint(2,S-2),m1=S-p1,p2=randint(2,S-2),m2=S-p2;
  const leftRoot=await addNumber('left',m1),leftBranch=await branchToken(leftRoot,S,[{slot:'left',value:p1}]);
  const rightRoot=await addNumber('right',S),rightBranch=await branchToken(rightRoot,m2,[{slot:'right',value:p2}]);
  await hideToken(leftRoot);await hideToken(rightBranch.ids.right[0]);
  return{type:'missing-weight',difficulty:level,readOnly:true,balancedBranchIds:[leftBranch.branchId,rightBranch.branchId],prompt:'Every bar is balanced. Find both missing numbers. Use the two smaller balances before checking the main bar.',answer:m1+' and '+m2};
}
async function buildCompare(level){
  if(level==='medium'){
    const S=randint(7,13),branch=await balancedBranch('left',S),delta=randint(2,7),rightTotal=2*S+delta;
    await addNumber('right',rightTotal);
    return{type:'choose-relation',difficulty:level,readOnly:true,balancedBranchIds:[branch.branchId],prompt:'Which main side is heavier? Work out the value of the hanging branch before you compare the two sides.',answer:'Right side'};
  }
  let s1=randint(7,12),s2=randint(8,14);if(s1===s2)s2+=2;
  const left=await balancedBranch('left',s1),right=await balancedBranch('right',s2),answer=s1>s2?'Left side':'Right side';
  return{type:'choose-relation',difficulty:level,readOnly:true,balancedBranchIds:[left.branchId,right.branchId],prompt:'Compare the two main sides. Each smaller bar is balanced, so calculate through both branches before deciding which side is heavier.',answer};
}
async function buildDifference(level){
  if(level==='medium'){
    const S=randint(8,13),branch=await balancedBranch('left',S),gap=randint(3,8),rightTotal=2*S-gap;
    await addNumber('right',rightTotal);
    return{type:'find-difference',difficulty:level,readOnly:true,balancedBranchIds:[branch.branchId],prompt:'How much heavier is the left main side than the right? Work through the hanging balance first.',answer:String(gap)};
  }
  const s1=randint(10,15),gap=randint(2,5),s2=s1-gap;
  const left=await balancedBranch('left',s1),right=await balancedBranch('right',s2);
  return{type:'find-difference',difficulty:level,readOnly:true,balancedBranchIds:[left.branchId,right.branchId],prompt:'Find the difference between the two main sides. Both smaller bars are balanced, so calculate the contribution of each whole branch.',answer:String(2*gap)};
}
async function buildSpot(level){
  if(level==='medium'){
    const S=randint(7,12),branch=await balancedBranch('left',S),wrong=2*S+randint(2,6);await addNumber('right',wrong);
    return{type:'spot-false-equality',difficulty:level,readOnly:true,balancedBranchIds:[branch.branchId],prompt:'A pupil says the main mobile is balanced. Are they correct? Explain how you know.',answer:'No. The left side totals '+(2*S)+' and the right side totals '+wrong+'.'};
  }
  const s1=randint(8,12),s2=s1+randint(1,4),left=await balancedBranch('left',s1),right=await balancedBranch('right',s2);
  return{type:'spot-false-equality',difficulty:level,readOnly:true,balancedBranchIds:[left.branchId,right.branchId],prompt:'A pupil says the whole mobile is balanced because both smaller bars are balanced. Are they correct? Explain.',answer:'No. The left branch totals '+(2*s1)+' and the right branch totals '+(2*s2)+'.'};
}
async function buildBalance(level){
  if(level==='medium'){
    const root=await addNumber('left',5),branch=await branchToken(root,7,[{slot:'left',value:3}]);await addNumber('right',14);
    return{type:'make-balance',difficulty:level,readOnly:false,balancedBranchIds:[],prompt:'Make every bar balance. You may edit, add, move or delete number boxes. The smaller bar and the main bar must both finish level.',answer:'Any arrangement where both the smaller bar and the main bar are balanced.'};
  }
  const leftRoot=await addNumber('left',4),left=await branchToken(leftRoot,6,[{slot:'left',value:3}]);
  const rightRoot=await addNumber('right',8),right=await branchToken(rightRoot,4,[{slot:'right',value:2}]);
  return{type:'make-balance',difficulty:level,readOnly:false,balancedBranchIds:[],prompt:'Make the entire mobile balance. Both smaller bars must balance internally and the main bar must balance too.',answer:'Any arrangement where both smaller bars and the main bar are balanced.',branchIds:[left.branchId,right.branchId]};
}
async function complexChallenge(type,level){
  busy=true;closePopover();complexSpec=null;
  try{
    if(type==='random'){
      const pool=[...COMPLEX_TYPES];type=pool[Math.floor(Math.random()*pool.length)];
    }
    if(!COMPLEX_TYPES.has(type)){await standardChallenge(type);return}
    if(!await enterCustomShell())throw new Error('Could not open Number Mobile custom challenge mode');
    let spec;
    if(type==='missing-weight')spec=await buildMissing(level);
    else if(type==='choose-relation')spec=await buildCompare(level);
    else if(type==='find-difference')spec=await buildDifference(level);
    else if(type==='spot-false-equality')spec=await buildSpot(level);
    else spec=await buildBalance(level);
    complexSpec=spec;await setCustomCopy(spec);adapt();
  }catch(err){
    console.error('Number Mobile complex challenge:',err);complexSpec=null;
  }finally{busy=false;adapt()}
}
function generate(type){
  G.numberMobileChallengeDifficulty=difficulty;
  if(difficulty==='easy')return standardChallenge(type);
  return complexChallenge(type,difficulty);
}
async function clearChallenge(){
  busy=true;closePopover();
  try{
    await selectWorkflow('challenge');const clear=await waitFor(()=>q('#ba-clear-challenge',controls()));complexSpec=null;if(clear){clear.click();await wait(80)}
  }finally{busy=false;adapt()}
}

function numericText(el){const value=Number(String(el?.textContent||'').trim());return Number.isFinite(value)?value:0}
function sumTokens(container){return qa('[data-ba-token] strong',container).reduce((sum,strong)=>sum+numericText(strong),0)}
function mainTotals(){
  const w=work();return{
    left:sumTokens(q('.gd-eq-side--left .gd-eq-weights',w)),
    right:sumTokens(q('.gd-eq-side--right .gd-eq-weights',w))
  };
}
function branchBalanced(branch){
  const left=q(':scope > .nmb-branch-sides > .nmb-branch-side--left > .nmb-branch-children',branch),right=q(':scope > .nmb-branch-sides > .nmb-branch-side--right > .nmb-branch-children',branch);
  return Math.abs(sumTokens(left)-sumTokens(right))<1e-9;
}
function mobileBalanced(){
  const totals=mainTotals(),branches=qa('.nmb-branch',work());
  return Math.abs(totals.left-totals.right)<1e-9&&branches.every(branchBalanced);
}
function sideExpression(side){
  const box=q('.gd-eq-side--'+side+' .gd-eq-weights',work());
  const values=qa('[data-ba-token] strong',box).map(el=>String(el.textContent||'').trim()||'?');
  return values.length?values.join(' + '):'0';
}
function challengePrompt(){return String(q('.gd-challenge-prompt',banner())?.textContent||'').trim().toLowerCase()}
function maskChallengeReadouts(){
  const w=work(),b=banner();if(!w)return;
  const active=!!b;document.body.classList.toggle('nmb-v5-challenge-active',active);w.classList.toggle('nmb-v5-challenge-active',active);w.classList.toggle('nmb-v5-readonly',!!complexSpec?.readOnly);
  const totalsToggle=q('#ba-show-totals',controls())?.closest('label');if(totalsToggle)totalsToggle.style.display=active?'none':'';
  if(!active)return;
  const kicker=q('.gd-challenge-kicker',b);if(kicker)kicker.textContent='NUMBER MOBILE · '+difficulty.toUpperCase();
  const verdict=q('.gd-eq-verdict strong',w),verdictLabel=q('.gd-eq-verdict span',w),eq=q('[data-ba-equation]',w);
  let task='Challenge';
  if(complexSpec){
    if(complexSpec.type==='make-balance')task=mobileBalanced()?'Balanced ✓':'Keep adjusting the mobile';
    else if(complexSpec.type==='missing-weight')task=complexSpec.difficulty==='hard'?'Find both missing numbers':'Find the missing number';
    else if(complexSpec.type==='choose-relation')task='Compare the two main sides';
    else if(complexSpec.type==='find-difference')task='Find the difference';
    else if(complexSpec.type==='spot-false-equality')task='Check the pupil’s claim';
    if(eq){
      if(complexSpec.type==='make-balance')eq.textContent='Make every bar balance';
      else if(complexSpec.type==='missing-weight')eq.textContent='Use the hanging balance'+(complexSpec.difficulty==='hard'?'s':'')+' to solve the missing number'+(complexSpec.difficulty==='hard'?'s':'');
      else if(complexSpec.type==='choose-relation')eq.textContent='Compare the two main sides';
      else if(complexSpec.type==='find-difference')eq.textContent='Find the difference between the main sides';
      else if(complexSpec.type==='spot-false-equality')eq.textContent='Is the main mobile balanced?';
    }
    (complexSpec.balancedBranchIds||[]).forEach(id=>{
      const branch=q('[data-nmb-branch="'+CSS.escape(String(id))+'"]',w);if(branch){branch.style.setProperty('--nmb-branch-angle','0deg');branch.style.setProperty('--nmb-branch-left','0px');branch.style.setProperty('--nmb-branch-right','0px')}
    });
  }else{
    const prompt=challengePrompt();
    if(/make both sides equal|make it balance/.test(prompt))task=mainTotals().left===mainTotals().right?'Balanced ✓':'Keep adjusting the balance';
    else if(/which symbol|<, > or =/.test(prompt)){task='Choose <, > or =';if(eq)eq.textContent=sideExpression('left')+' ? '+sideExpression('right')}
    else if(/how much heavier|difference/.test(prompt)){task='Find the difference';if(eq)eq.textContent='Find the difference between the two sides'}
    else if(/pupil says|are they correct|false equality/.test(prompt)){task='Check the equality';if(eq)eq.textContent=sideExpression('left')+' = '+sideExpression('right')}
    else if(/hidden|question mark|missing/.test(prompt)){task='Find the missing number';if(eq)eq.textContent=sideExpression('left')+' = '+sideExpression('right')}
    else if(/add .*both sides|both sides/.test(prompt))task='Keep both sides equal';
  }
  if(verdict)verdict.textContent=task;if(verdictLabel)verdictLabel.textContent=complexSpec?.type==='make-balance'?'Status':'Task';
}
function freezeReadonly(){
  if(!complexSpec?.readOnly)return;
  const w=work();if(!w)return;
  qa('[data-ba-token],[data-ba-stage-add],.nmb-branch-add,.nmb-branch-empty',w).forEach(el=>{el.disabled=true;el.setAttribute('aria-disabled','true')});
  qa('.nmb-keypad,.nmb-tile-toolbar,.nmb-branch-toolbar',w).forEach(el=>el.remove());
  ['ba-move','ba-duplicate','ba-delete','ba-minus','ba-plus','ba-value','ba-hidden'].forEach(id=>{const el=document.getElementById(id);if(el)el.disabled=true});
}
function ensureComplexAnother(){
  const b=banner();if(!b||!complexSpec)return;
  const actions=q('.gd-challenge-actions',b);if(!actions||q('[data-nmb-v5-another]',actions))return;
  const button=document.createElement('button');button.type='button';button.className='gd-challenge-action';button.dataset.nmbV5Another='1';button.textContent='Another like this';
  button.onclick=e=>{e.stopPropagation();complexChallenge(complexSpec.type,complexSpec.difficulty)};
  const reveal=q('[data-board-action="reveal"]',actions);actions.insertBefore(button,reveal||null);
}
function adapt(){
  const w=work();if(!w)return;
  hookTrigger();maskChallengeReadouts();freezeReadonly();ensureComplexAnother();syncBoardChallengeButton();
  if(open&&!q('.nmb-v5-challenge-popover',w)){w.appendChild(challengePopover());const trigger=q('[data-nmb-challenge-toggle]',w);if(trigger)trigger.setAttribute('aria-expanded','true')}
}
function installObservers(){
  stageObserver?.disconnect();controlsObserver?.disconnect();
  const s=stage(),c=controls();
  if(s){let queued=false;stageObserver=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;adapt()})});stageObserver.observe(s,{childList:true,subtree:true})}
  if(c){let queued=false;controlsObserver=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;adapt()})});controlsObserver.observe(c,{childList:true,subtree:true})}
  adapt();
}
function install(){
  if(installed)return;installed=true;
  G.numberMobileChallengeDifficulty=difficulty;
  document.addEventListener('pointerdown',e=>{
    if(!open)return;
    const w=work();if(!w)return;
    if(e.target.closest?.('.nmb-v5-challenge-popover,[data-nmb-challenge-toggle]'))return;
    closePopover();
  });
  installObservers();
}

G.balanceTool=function numberMobileBalanceToolV5(){
  const result=balanceToolV4.apply(this,arguments);
  complexSpec=null;open=false;setTimeout(installObservers,0);return result;
};
G.numberMobileBalanceEnhancementVersion='5.0';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else queueMicrotask(install);
})(window.TT99Goodies);
