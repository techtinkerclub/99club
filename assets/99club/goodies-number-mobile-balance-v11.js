/* Number Mobile Balance v11 · hard challenge variety + deterministic initial chrome */
(function(G){
'use strict';
if(!G)return;

let building=false;
function q(sel,root=document){return root?.querySelector?.(sel)||null}
function qa(sel,root=document){return root?.querySelectorAll?[...root.querySelectorAll(sel)]:[]}
function stage(){return document.getElementById('gd-stage')}
function controls(){return document.getElementById('gd-controls')}
function work(){return q('.gd-number-mobile-workbench',stage())}
function banner(){return q('.gd-challenge-banner',stage())}
function wait(ms=30){return new Promise(resolve=>setTimeout(resolve,ms))}
async function waitFor(fn,{tries=90,delay=30}={}){for(let i=0;i<tries;i++){const value=fn();if(value)return value;await wait(delay)}return null}
function randint(min,max){return min+Math.floor(Math.random()*(max-min+1))}
function token(id){return q('[data-ba-token="'+CSS.escape(String(id))+'"]',work())}
function tokenIds(root=work()){return new Set(qa('[data-ba-token]',root).map(el=>String(el.dataset.baToken)))}
function pupilReady(){return document.body.classList.contains('nmb-v8-pupil-challenge')&&!!banner()}
function setBuilding(on){document.body.classList.toggle('nmb-v7-challenge-building',!!on);document.documentElement.classList.toggle('nmb-v7-challenge-building',!!on);if(on)document.body.setAttribute('aria-busy','true');else document.body.removeAttribute('aria-busy')}

function tidyChrome(){
  if(!pupilReady())return false;
  const b=banner(),w=work(),actions=q('.gd-challenge-actions',b);if(!b||!w||!actions)return false;
  let change=q('[data-nmb-v9-change]',actions);
  if(!change){change=document.createElement('button');change.type='button';change.className='gd-challenge-action';change.dataset.nmbV9Change='1';change.textContent='Change';change.title='Choose a different Number Mobile challenge';change.onclick=e=>{e.preventDefault();e.stopPropagation();q('[data-nmb-challenge-toggle]',w)?.click()};actions.insertBefore(change,actions.firstChild)}
  let another=q('[data-nmb-v6-another]',actions);
  if(!another&&G.numberMobileChallengeSpec?.type){another=document.createElement('button');another.type='button';another.className='gd-challenge-action';another.dataset.nmbV6Another='1';another.textContent='Another';another.title='Generate another challenge of this type';actions.insertBefore(another,q('[data-board-action="reveal"]',actions)||null)}
  if(another){another.textContent='Another';another.title='Generate another challenge of this type'}
  const reveal=q('[data-board-action="reveal"]',actions);if(reveal){reveal.textContent='Reveal';reveal.title='Reveal the answer'}
  const exit=q('[data-nmb-v7-exit]',actions);if(exit){exit.textContent='Exit';exit.title='Exit challenge mode'}
  return true;
}
async function tidyWhenReady(){await waitFor(()=>pupilReady());tidyChrome()}

function splitSum(total,count,min=2){
  const parts=[];let remaining=total;
  for(let i=0;i<count-1;i++){
    const slots=count-i-1,max=remaining-min*slots,value=randint(min,max);
    parts.push(value);remaining-=value;
  }
  parts.push(remaining);
  for(let i=parts.length-1;i>0;i--){const j=randint(0,i),t=parts[i];parts[i]=parts[j];parts[j]=t}
  return parts;
}
function planFor(sum,avoid=''){
  for(let attempt=0;attempt<12;attempt++){
    const hiddenSide=Math.random()<.5?'left':'right';
    const hiddenKnownCount=Math.random()<.45?2:1;
    const oppositeCount=Math.random()<.22?3:(Math.random()<.55?2:1);
    const minAnswer=Math.max(5,Math.floor(sum*.32)),maxAnswer=sum-2*hiddenKnownCount;
    const answer=randint(Math.min(minAnswer,maxAnswer),maxAnswer);
    const known=splitSum(sum-answer,hiddenKnownCount,2),opposite=splitSum(sum,oppositeCount,2);
    const signature=[hiddenSide,hiddenKnownCount,oppositeCount].join('-');
    if(signature!==avoid||attempt===11)return{hiddenSide,answer,known,opposite,signature};
  }
}

async function selectWorkflow(name){const button=q('[data-ba-workflow="'+name+'"]',controls());if(!button)return false;button.click();await wait(35);return true}
async function clearExisting(){
  if(!banner())return;
  await selectWorkflow('challenge');const clear=await waitFor(()=>q('#ba-clear-challenge',controls()));
  G.numberMobileChallengeSpec=null;if(clear){clear.click();await waitFor(()=>!banner());await wait(60)}
}
async function enterCustomShell(){
  await clearExisting();if(!await selectWorkflow('challenge'))return false;
  const custom=await waitFor(()=>q('[data-ba-challenge-tab="custom"]',controls()));if(!custom)return false;custom.click();await wait(55);
  const clear=await waitFor(()=>q('#ba-clear',controls()));if(!clear)return false;clear.click();await wait(65);return true;
}
async function addNumber(side,value){
  const before=tokenIds(),input=await waitFor(()=>q('#ba-custom',controls())),button=await waitFor(()=>q(side==='right'?'#ba-add-right':'#ba-add-left',controls()));
  if(!input||!button)throw new Error('Number Mobile add controls unavailable');input.value=String(value);button.click();
  const added=await waitFor(()=>qa('[data-ba-token]',work()).find(el=>!before.has(String(el.dataset.baToken))));if(!added)throw new Error('Number Mobile did not add a number box');await wait(25);return String(added.dataset.baToken);
}
async function selectToken(id){
  const sid=String(id);for(let attempt=0;attempt<4;attempt++){
    const el=await waitFor(()=>token(sid));if(!el)throw new Error('Number Mobile box not found');if(el.disabled){el.disabled=false;el.removeAttribute('disabled');el.removeAttribute('aria-disabled')}el.click();
    if(await waitFor(()=>q('[data-ba-selected="'+CSS.escape(sid)+'"]',work()),{tries:12,delay:15})){await wait(15);return token(sid)||el}await wait(20)
  }throw new Error('Number Mobile could not focus the requested box');
}
async function setTokenValue(id,value){await selectToken(id);const input=await waitFor(()=>document.getElementById('ba-value'));if(!input)throw new Error('Number Mobile value editor unavailable');input.value=String(value);input.dispatchEvent(new Event('change',{bubbles:true}));await wait(50)}
async function hideToken(id){await selectToken(id);const input=await waitFor(()=>document.getElementById('ba-hidden'));if(!input)throw new Error('Number Mobile hide control unavailable');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));await wait(50)}
async function branchToken(id,rightValue,extras=[]){
  await selectToken(id);const branchButton=await waitFor(()=>qa('.nmb-tile-toolbar button',work()).find(b=>b.textContent.trim()==='Branch'));if(!branchButton)throw new Error('Number Mobile branch action unavailable');branchButton.click();await wait(100);
  const branch=await waitFor(()=>token(id)?.closest('.nmb-branch'));if(!branch)throw new Error('Number Mobile branch was not created');const branchId=String(branch.dataset.nmbBranch);
  let live=q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work()),rightToken=q('.nmb-branch-side--right [data-ba-token]',live);if(!rightToken)throw new Error('Number Mobile branch right box missing');
  const rightId=String(rightToken.dataset.baToken);await setTokenValue(rightId,rightValue);const ids={left:[String(id)],right:[rightId]};
  for(const extra of extras){
    live=await waitFor(()=>q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work()));q('.nmb-branch-bar',live)?.click();await wait(25);live=q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work());
    const before=tokenIds(live),toolbar=q('.nmb-branch-toolbar',live),label=extra.slot==='right'?'+ Right':'+ Left',add=qa('button',toolbar).find(b=>b.textContent.trim()===label);if(!add)throw new Error('Number Mobile branch add action unavailable');add.click();
    const added=await waitFor(()=>{const now=q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work());return qa('[data-ba-token]',now).find(el=>!before.has(String(el.dataset.baToken)))});if(!added)throw new Error('Number Mobile did not add a branch box');const newId=String(added.dataset.baToken);await setTokenValue(newId,extra.value);ids[extra.slot==='right'?'right':'left'].push(newId);
  }
  return{branchId,ids};
}
async function buildPlannedBranch(mainSide,sum,plan){
  let rootValue,rightValue,extras=[],hiddenId;
  if(plan.hiddenSide==='left'){
    rootValue=plan.answer;rightValue=plan.opposite[0];extras=plan.known.map(value=>({slot:'left',value})).concat(plan.opposite.slice(1).map(value=>({slot:'right',value})));
  }else{
    rootValue=plan.opposite[0];rightValue=plan.answer;extras=plan.opposite.slice(1).map(value=>({slot:'left',value})).concat(plan.known.map(value=>({slot:'right',value})));
  }
  const root=await addNumber(mainSide,rootValue),branch=await branchToken(root,rightValue,extras);hiddenId=plan.hiddenSide==='left'?root:branch.ids.right[0];await hideToken(hiddenId);
  return{branchId:branch.branchId,hiddenId,answer:plan.answer,signature:plan.signature};
}
async function setCustomCopy(spec){
  const title=await waitFor(()=>q('#ba-custom-title',controls()));if(title){title.value='Hard · Missing number';title.dispatchEvent(new Event('input',{bubbles:true}))}
  const prompt=await waitFor(()=>q('#ba-custom-prompt',controls()));if(prompt){prompt.textContent=spec.prompt;prompt.dispatchEvent(new Event('input',{bubbles:true}))}
  const answer=await waitFor(()=>q('#ba-custom-answer',controls()));if(answer){answer.value=spec.answer;answer.dispatchEvent(new Event('input',{bubbles:true}))}await wait(45)
}
async function buildHardMissing(){
  if(building)return;building=true;setBuilding(true);
  try{
    const trigger=q('[data-nmb-challenge-toggle]',work());if(trigger&&q('.nmb-v5-challenge-popover',work())){trigger.click();await wait(25)}
    if(!await enterCustomShell())throw new Error('Could not open Number Mobile custom challenge mode');
    const sum=randint(14,24),leftPlan=planFor(sum),rightPlan=planFor(sum,leftPlan.signature);
    const left=await buildPlannedBranch('left',sum,leftPlan),right=await buildPlannedBranch('right',sum,rightPlan);
    const spec={type:'missing-weight',difficulty:'hard',readOnly:true,balancedBranchIds:[left.branchId,right.branchId],branchSum:sum,layoutSignatures:[left.signature,right.signature],prompt:'Every bar is balanced. Find both missing numbers. Use the two smaller balances before checking the main bar.',answer:left.answer+' and '+right.answer,answerByToken:{[String(left.hiddenId)]:left.answer,[String(right.hiddenId)]:right.answer}};
    G.numberMobileChallengeDifficulty='hard';G.numberMobileChallengeSpec=spec;await setCustomCopy(spec);
  }catch(err){console.error('Number Mobile v11 hard challenge:',err);G.numberMobileChallengeSpec=null}
  finally{setBuilding(false);building=false;setTimeout(tidyWhenReady,90)}
}

function capture(e){
  const type=e.target?.closest?.('[data-nmb-v6-type]');
  if(type){setTimeout(tidyWhenReady,0);if(type.dataset.nmbV6Type==='missing-weight'&&String(G.numberMobileChallengeDifficulty||'easy')==='hard'){
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();buildHardMissing();
  }}
}
function install(){window.addEventListener('click',capture,true);document.addEventListener('click',()=>setTimeout(tidyWhenReady,0),true);setTimeout(tidyWhenReady,80)}
G.numberMobileVarietyVersion='11.0';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(window.TT99Goodies);
