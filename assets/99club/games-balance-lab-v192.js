/* 99 Club Studio · Balance Lab v1.92
 * Reworks Balance the Equation into a two-stage game:
 *   1) balance equations with operations on both sides and collect their common values;
 *   2) use every collected value once to make one final equal balance.
 * The generator is shared by printable packs and Online Play.
 */
(function(global){
'use strict';
const A=global.TT99ArithmeticGames;
if(!A||typeof A.generate!=='function'||A.__balanceLabV192)return;

function hash(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rngFromSeed(seed){let a=hash(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function randInt(rng,a,b){return Math.floor(rng()*(b-a+1))+a;}
function choose(rng,arr){return arr[Math.floor(rng()*arr.length)];}
function shuffle(rng,arr){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));}

function normalise(raw={}){
  const difficulty=['easy','standard','challenge'].includes(raw.difficulty)?raw.difficulty:'standard';
  const validRows=['auto','4','5','6','8'];
  const style=raw.style==='number'?'additive':raw.style==='expression'?'mixed':raw.style;
  return {difficulty,rowCount:validRows.includes(String(raw.rowCount))?String(raw.rowCount):'auto',style:['auto','additive','mixed'].includes(style)?style:'auto'};
}
function rowCount(c){if(c.rowCount!=='auto')return Number(c.rowCount);return c.difficulty==='easy'?4:c.difficulty==='challenge'?6:4;}

function composition(total,count,min,max,rng){
  const out=[];let left=total;
  for(let i=0;i<count;i++){
    const remain=count-i-1;
    if(!remain){out.push(left);break;}
    const lo=Math.max(min,left-max*remain),hi=Math.min(max,left-min*remain);
    const value=randInt(rng,lo,hi);out.push(value);left-=value;
  }
  return out;
}
function finalWeights(n,difficulty,rng){
  const g1=Math.floor(n/2),g2=n-g1;
  const min=difficulty==='easy'?10:difficulty==='challenge'?18:14;
  const max=difficulty==='easy'?34:difficulty==='challenge'?78:52;
  const minT=Math.max(g1*min,g2*min),maxT=Math.min(g1*max,g2*max);
  const target=randInt(rng,minT,maxT);
  const left=composition(target,g1,min,max,rng).map(v=>({value:v,side:'L'}));
  const right=composition(target,g2,min,max,rng).map(v=>({value:v,side:'R'}));
  const mixed=shuffle(rng,left.concat(right));
  return {
    weights:mixed.map(x=>x.value),target,
    solutionSides:mixed.map(x=>x.side),
    solutionLeft:mixed.filter(x=>x.side==='L').map(x=>x.value),
    solutionRight:mixed.filter(x=>x.side==='R').map(x=>x.value)
  };
}
function divisors(target){const out=[];for(let d=2;d<=9;d++)if(target%d===0)out.push(d);return out;}
function completeExpr(target,difficulty,rng,allowMul){
  const candidates=[];
  const add=randInt(rng,2,Math.max(2,target-2));candidates.push(`${target-add} + ${add}`);
  const sub=randInt(rng,2,difficulty==='easy'?12:24);candidates.push(`${target+sub} − ${sub}`);
  if(allowMul){
    const ds=divisors(target);if(ds.length){const d=choose(rng,ds);candidates.push(`${d} × ${target/d}`);}
    const d=randInt(rng,2,difficulty==='challenge'?9:6);candidates.push(`${target*d} ÷ ${d}`);
  }
  return choose(rng,candidates);
}
function blankExpr(target,difficulty,rng,allowMul){
  const candidates=[];
  const k=randInt(rng,2,Math.max(2,Math.min(target-1,difficulty==='easy'?14:28)));
  candidates.push({text:`${target-k} + □`,answer:k});
  candidates.push({text:`□ + ${k}`,answer:target-k});
  const sub=randInt(rng,2,difficulty==='easy'?12:24);
  candidates.push({text:`□ − ${sub}`,answer:target+sub});
  candidates.push({text:`${target+sub} − □`,answer:sub});
  if(allowMul){
    const ds=divisors(target);if(ds.length){const d=choose(rng,ds);candidates.push({text:`${d} × □`,answer:target/d});candidates.push({text:`□ × ${d}`,answer:target/d});}
    const d=randInt(rng,2,difficulty==='challenge'?9:6);candidates.push({text:`□ ÷ ${d}`,answer:target*d});
    if(difficulty==='challenge')candidates.push({text:`${target*d} ÷ □`,answer:d});
  }
  return choose(rng,candidates.filter(x=>Number.isFinite(x.answer)&&x.answer>=0&&Number.isInteger(x.answer)));
}
function makeRow(target,difficulty,style,rng,index){
  const allowMul=style==='mixed'||(style==='auto'&&difficulty!=='easy');
  const blank=blankExpr(target,difficulty,rng,allowMul),known=completeExpr(target,difficulty,rng,allowMul),swap=(index+rng())%2>1;
  const left=swap?known:blank.text,right=swap?blank.text:known;
  const display=`${left} = ${right}`;
  return {display,answer:blank.answer,solution:display.replace('□',String(blank.answer)),balancedValue:target};
}

function paperFinalWeights(difficulty,rng){
  const min=difficulty==='easy'?2:difficulty==='challenge'?6:4;
  const max=difficulty==='easy'?12:difficulty==='challenge'?26:20;
  let best=null;
  for(let attempt=0;attempt<30;attempt++){
    const target=randInt(rng,min*2,max*2),left=composition(target,2,min,max,rng),right=composition(target,2,min,max,rng);
    const tagged=shuffle(rng,left.map(value=>({value,side:'L'})).concat(right.map(value=>({value,side:'R'}))));
    const candidate={weights:tagged.map(x=>x.value),target,solutionSides:tagged.map(x=>x.side),solutionLeft:tagged.filter(x=>x.side==='L').map(x=>x.value),solutionRight:tagged.filter(x=>x.side==='R').map(x=>x.value)};
    best=candidate;
    const leftKey=left.slice().sort((a,b)=>a-b).join(','),rightKey=right.slice().sort((a,b)=>a-b).join(',');
    if(new Set(candidate.weights).size>=3&&leftKey!==rightKey)return candidate;
  }
  return best;
}
function paperKnownExpr(total,difficulty,rng){
  const candidates=[];
  const a=randInt(rng,2,Math.max(2,total-2));candidates.push(`${total-a} + ${a}`);
  const s=randInt(rng,2,difficulty==='easy'?10:18);candidates.push(`${total+s} − ${s}`);
  if(difficulty!=='easy'){
    const ds=divisors(total);if(ds.length){const d=choose(rng,ds);candidates.push(`${d} × ${total/d}`);}
    const d=randInt(rng,2,difficulty==='challenge'?8:5);candidates.push(`${total*d} ÷ ${d}`);
  }
  return choose(rng,candidates);
}
function makePaperRow(weight,difficulty,style,rng,index){
  const allowMul=style==='mixed'||(style==='auto'&&difficulty!=='easy'),modes=['add_after','add_before','subtract'];
  if(allowMul)modes.push('multiply');
  if(difficulty==='challenge'&&weight>=6)modes.push('divide');
  let mode=modes[index%modes.length],target,blank;
  if(mode==='multiply'){
    const m=randInt(rng,2,difficulty==='challenge'?6:4);target=weight*m;blank=(index%2?`□ × ${m}`:`${m} × □`);
  }else if(mode==='divide'){
    const divis=[2,3,4,5].filter(d=>weight%d===0&&weight/d>=2);
    if(divis.length){const d=choose(rng,divis);target=weight/d;blank=`□ ÷ ${d}`;}else mode='add_after';
  }
  if(mode==='add_after'){
    const k=randInt(rng,2,difficulty==='easy'?10:15);target=weight+k;blank=`${k} + □`;
  }else if(mode==='add_before'){
    const k=randInt(rng,2,difficulty==='easy'?10:15);target=weight+k;blank=`□ + ${k}`;
  }else if(mode==='subtract'){
    target=randInt(rng,Math.max(5,Math.ceil(weight/2)),difficulty==='challenge'?35:25);blank=`${target+weight} − □`;
  }
  const known=paperKnownExpr(target,difficulty,rng),swap=(index%4===3)||(rng()<.28),left=swap?known:blank,right=swap?blank:known,display=`${left} = ${right}`;
  return {display,answer:weight,solution:display.replace('□',String(weight)),balancedValue:target,weightValue:weight,weightLabel:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[index]||String(index+1)};
}
function generatePaperBalanceLab(c,seed){
  const rng=rngFromSeed(`${seed}:balance-lab-paper-v194`),final=paperFinalWeights(c.difficulty,rng),rows=final.weights.map((v,i)=>makePaperRow(v,c.difficulty,c.style,rng,i));
  return {rows,finalChallenge:final,instruction:'Find the four weight values, then use A, B, C and D exactly once to make the final scale balance.',version:'1.94'};
}
function generateBalanceLab(settings,seed){
  const raw=settings?.engineSettings?.balance||{},c=normalise(raw),rng=rngFromSeed(`${seed}:balance-lab-v192`),n=rowCount(c),final=finalWeights(n,c.difficulty,rng);
  const rows=final.weights.map((v,i)=>makeRow(v,c.difficulty,c.style,rng,i));
  return {
    engineId:'balance',title:'Balance Lab',difficulty:c.difficulty,rows,
    finalChallenge:{...final,instruction:'Use every collected weight once. Split them between the two pans so both totals are equal.'},
    paper:generatePaperBalanceLab(c,seed),
    instruction:'Balance each equation to collect its weight. Then use every weight in the Final Balance.',seed,options:c,balanceLabVersion:'1.92'
  };
}

const previousGenerate=A.generate.bind(A);
const previousWorkedExample=A.workedExample.bind(A);
A.generate=function(id,settings,seed){return id==='balance'?generateBalanceLab(settings,seed):previousGenerate(id,settings,seed);};
A.workedExample=function(id,settings,seed){
  if(id!=='balance')return previousWorkedExample(id,settings,seed);
  return {
    engineId:'balance',kind:'balance',title:'Balance the Equation worked example',
    goal:'Repair each equation to collect its weight, then use every collected weight once to balance the final scale.',
    rules:['Both sides of each equals sign must have the same value.','Each solved equation unlocks one labelled weight.','In the final challenge, use every collected weight exactly once and split them between the two pans so the totals are equal.'],
    steps:['Balance A: 7 + □ = 12, so A = 5.','Balance B: 15 − □ = 8, so B = 7. Solve C and D in the same way.','Suppose the collected weights are A=5, B=7, C=4 and D=8.','Place 5 + 7 on one pan and 4 + 8 on the other: both sides total 12, so the final scale balances.'],
    tip:'Treat = as “has the same value as”. Solve all equation weights before attempting the final split.',
    commonMistake:'Do not stop after repairing the equations; the pack game also includes the final balance using every collected weight once.'
  };
};
A.generateBalanceLabV192=generateBalanceLab;

const def=A.DEFINITIONS?.balance;
if(def){
  def.title='Balance the Equation';
  def.defaultSettings={...def.defaultSettings,difficulty:'standard',rowCount:'auto',style:'auto'};
  const rows=def.settingsSchema?.find(x=>x.id==='rowCount');
  if(rows)rows.options=[{value:'auto',label:'Auto for difficulty'},{value:'4',label:'4 balances'},{value:'5',label:'5 balances'},{value:'6',label:'6 balances'},{value:'8',label:'8 balances'}];
  const style=def.settingsSchema?.find(x=>x.id==='style');
  if(style){style.label='Operations';style.options=[{value:'auto',label:'Auto for difficulty'},{value:'additive',label:'Addition + subtraction'},{value:'mixed',label:'Mixed + − × ÷'}];}
  def.difficultyDescriptions={easy:'Four + / − balances, then split the collected weights',standard:'Operations on both sides plus a final weight balance',challenge:'Richer × / ÷ balances and a larger final partition'};
}
A.__balanceLabV192=true;

/* Online Play enhancement. On printable pages TT99GamesPlay is absent, so only
   the shared generator above is installed. */
const Play=global.TT99GamesPlay,adapter=Play?.adapters?.get?.('balance');
if(!adapter)return;

function padHtml(){return `<div class="tt99-wave186-keypad" data-balance-pad aria-label="On-screen number keypad">${[1,2,3,4,5,6,7,8,9].map(v=>`<button type="button" data-balance-digit="${v}">${v}</button>`).join('')}<button type="button" data-balance-back aria-label="Backspace">⌫</button><button type="button" data-balance-digit="0">0</button><button type="button" class="clear" data-balance-clear>Clear</button></div>`;}
function appendDigit(cur,d){const s=cur==null?'':String(cur);return (s==='0'?String(d):(s+String(d))).slice(0,6);}
function backspace(cur){const s=cur==null?'':String(cur);return s.length>1?s.slice(0,-1):null;}
function selectOptions(root,c,onChange){
  c=normalise(c);
  root.innerHTML=`<label><span>Difficulty</span><select data-bl-opt="difficulty">${['easy','standard','challenge'].map(v=>`<option value="${v}" ${c.difficulty===v?'selected':''}>${v[0].toUpperCase()+v.slice(1)}</option>`).join('')}</select></label><label><span>Balances</span><select data-bl-opt="rowCount">${[['auto','Auto'],['4','4'],['5','5'],['6','6'],['8','8']].map(([v,l])=>`<option value="${v}" ${c.rowCount===v?'selected':''}>${l}</option>`).join('')}</select></label><label><span>Operations</span><select data-bl-opt="style"><option value="auto" ${c.style==='auto'?'selected':''}>Auto</option><option value="additive" ${c.style==='additive'?'selected':''}>+ and −</option><option value="mixed" ${c.style==='mixed'?'selected':''}>+ − × ÷</option></select></label>`;
  root.querySelectorAll('[data-bl-opt]').forEach(el=>el.addEventListener('change',()=>onChange(normalise({...c,[el.dataset.blOpt]:el.value}))));
}
function mount(root,p,ctx){
  const weights=p.finalChallenge?.weights||p.rows.map(r=>r.balancedValue),answers=p.rows.map(()=>null),sides=weights.map(()=>null);
  let selected=null,wrong=new Set(),hint=-1,finished=false,finalWrong=false;
  root.className='tt99-play-balance tt99-balance-lab';
  root.innerHTML=`<div class="tt99-balance-lab-mission"><small>MISSION</small><strong>Solve → collect → balance</strong><span>Every repaired equation gives you a weight for the final scale.</span></div><div class="tt99-balance-lab-list">${p.rows.map((r,i)=>{const parts=String(r.display).split('□');return `<div class="tt99-balance-card" data-bl-row="${i}"><div class="tt99-balance-card-head"><small>BALANCE ${i+1}</small><span data-bl-weight-status>WEIGHT LOCKED</span></div><div class="tt99-balance-equation"><span>${esc(parts[0])}</span><button type="button" data-bl-answer="${i}"><b data-bl-value></b></button><span>${esc(parts.slice(1).join('□'))}</span></div></div>`;}).join('')}</div><section class="tt99-balance-final is-locked" data-bl-final><div class="tt99-balance-final-head"><small>FINAL CHALLENGE</small><strong>Use every collected weight once</strong><span data-bl-final-status>Solve all balances to unlock the scale.</span></div><div class="tt99-balance-scale"><div class="tt99-balance-pan left"><small>LEFT PAN</small><div data-bl-left></div><b data-bl-left-total>0</b></div><div class="tt99-balance-beam-wrap"><div class="tt99-balance-beam" data-bl-beam></div><div class="tt99-balance-stand">▲</div></div><div class="tt99-balance-pan right"><small>RIGHT PAN</small><div data-bl-right></div><b data-bl-right-total>0</b></div></div><div class="tt99-balance-weight-tray"><small>COLLECTED WEIGHTS · tap a weight to cycle tray → left → right</small><div>${weights.map((v,i)=>`<button type="button" data-bl-weight="${i}" disabled><b data-bl-weight-value>?</b><span>LOCKED</span></button>`).join('')}</div></div></section>${padHtml()}`;
  const answerBtns=[...root.querySelectorAll('[data-bl-answer]')],weightBtns=[...root.querySelectorAll('[data-bl-weight]')],pad=root.querySelector('[data-balance-pad]'),finalEl=root.querySelector('[data-bl-final]');
  const rowSolved=i=>answers[i]!=null&&String(answers[i])===String(p.rows[i].answer),solvedCount=()=>p.rows.reduce((n,_,i)=>n+(rowSolved(i)?1:0),0),allRowsSolved=()=>solvedCount()===p.rows.length;
  function totals(){let l=0,r=0;for(let i=0;i<weights.length;i++){if(sides[i]==='L')l+=Number(weights[i]);else if(sides[i]==='R')r+=Number(weights[i]);}return {l,r};}
  function finalAssigned(){return sides.every(Boolean);}function finalBalanced(){const t=totals();return allRowsSolved()&&finalAssigned()&&t.l===t.r;}
  function panHtml(side){return weights.map((v,i)=>sides[i]===side?`<span>${v}</span>`:'').join('');}
  function render(){
    answerBtns.forEach(b=>{const i=+b.dataset.blAnswer;b.querySelector('[data-bl-value]').textContent=answers[i]??'';b.classList.toggle('is-selected',selected===i);b.classList.toggle('is-wrong',wrong.has(i));b.classList.toggle('is-hint',hint===i);b.disabled=finished;const card=b.closest('[data-bl-row]'),ok=rowSolved(i);card.classList.toggle('is-solved',ok);card.querySelector('[data-bl-weight-status]').textContent=ok?`WEIGHT ${p.rows[i].balancedValue} COLLECTED`:'WEIGHT LOCKED';});
    const unlocked=allRowsSolved(),balanced=finalBalanced(),t=totals();finalEl.classList.toggle('is-locked',!unlocked);finalEl.classList.toggle('is-balanced',balanced);finalEl.classList.toggle('is-wrong',finalWrong&&!balanced);finalEl.querySelector('[data-bl-left]').innerHTML=panHtml('L');finalEl.querySelector('[data-bl-right]').innerHTML=panHtml('R');finalEl.querySelector('[data-bl-left-total]').textContent=t.l;finalEl.querySelector('[data-bl-right-total]').textContent=t.r;const tilt=unlocked?clamp((t.r-t.l)/Math.max(1,p.finalChallenge?.target||1)*8,-8,8):0;finalEl.querySelector('[data-bl-beam]').style.setProperty('--balance-tilt',`${tilt}deg`);
    const status=finalEl.querySelector('[data-bl-final-status]');status.textContent=!unlocked?'Solve all balances to unlock the scale.':balanced?'Perfect balance! Both pans match.':finalAssigned()?`Left ${t.l} · Right ${t.r}. Keep adjusting.`:'Tap every weight until each is on the left or right pan.';
    weightBtns.forEach((b,i)=>{const earned=rowSolved(i);b.disabled=finished||!unlocked;b.classList.toggle('is-earned',earned);b.classList.toggle('is-left',sides[i]==='L');b.classList.toggle('is-right',sides[i]==='R');b.querySelector('[data-bl-weight-value]').textContent=earned?weights[i]:'?';b.querySelector('span').textContent=!earned?'LOCKED':sides[i]==='L'?'LEFT':sides[i]==='R'?'RIGHT':'TRAY';});
    pad.querySelectorAll('button').forEach(b=>b.disabled=finished||selected==null);
  }
  function snapshot(){return {answers:answers.slice(),sides:sides.slice()};}
  function emptySnapshot(){return {answers:p.rows.map(()=>null),sides:weights.map(()=>null)};}
  function restore(s){const src=Array.isArray(s)?{answers:s,sides:[]}:s||{};for(let i=0;i<answers.length;i++)answers[i]=src.answers?.[i]??null;for(let i=0;i<sides.length;i++)sides[i]=src.sides?.[i]??null;selected=null;wrong.clear();hint=-1;finalWrong=false;render();}
  function commit(v){if(selected==null||finished||ctx.isPaused?.())return;answers[selected]=v;wrong.clear();hint=-1;finalWrong=false;render();ctx.onChange?.(snapshot());}
  function select(i){if(finished||ctx.isPaused?.())return;selected=i;hint=-1;render();}
  function click(e){const a=e.target.closest('[data-bl-answer]');if(a){select(+a.dataset.blAnswer);return;}const w=e.target.closest('[data-bl-weight]');if(w&&!w.disabled){const i=+w.dataset.blWeight;sides[i]=sides[i]==null?'L':sides[i]==='L'?'R':null;finalWrong=false;render();ctx.onChange?.(snapshot());}}
  function padClick(e){const d=e.target.closest('[data-balance-digit]');if(d)return commit(appendDigit(selected==null?null:answers[selected],d.dataset.balanceDigit));if(e.target.closest('[data-balance-back]'))return commit(backspace(selected==null?null:answers[selected]));if(e.target.closest('[data-balance-clear]'))return commit(null);}
  function keydown(e){if(selected==null)return;if(/^\d$/.test(e.key)){e.preventDefault();commit(appendDigit(answers[selected],e.key));}else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();commit(backspace(answers[selected]));}}
  root.addEventListener('click',click);pad.addEventListener('click',padClick);root.addEventListener('keydown',keydown);
  function bad(){const out=[];for(let i=0;i<answers.length;i++)if(answers[i]!=null&&!rowSolved(i))out.push(i);return out;}
  function progress(){const placed=sides.filter(Boolean).length;return allRowsSolved()?`${solvedCount()} / ${p.rows.length} balances · ${placed} / ${weights.length} weights placed`:`${solvedCount()} / ${p.rows.length} balances solved`;}
  function check({silent=false}={}){const b=bad();if(b.length){if(!silent){wrong=new Set(b);finalWrong=false;render();}return {complete:false,wrong:true,message:`${b.length} balance${b.length===1?' is':'s are'} incorrect.`};}if(!allRowsSolved())return {complete:false,wrong:false,message:'The balances entered so far are correct. Solve the remaining equations to collect every weight.'};if(!finalAssigned())return {complete:false,wrong:false,message:'All equation weights collected. Put every weight onto the left or right pan.'};if(!finalBalanced()){if(!silent){finalWrong=true;render();}const t=totals();return {complete:false,wrong:true,message:`The final scale is not balanced yet: left ${t.l}, right ${t.r}.`};}return {complete:true,message:'Perfect balance! Every equation is correct and every collected weight has been used.'};}
  function hintFn(){const b=bad();if(b.length)return {tone:'hint',message:'One entered value does not balance its equation. Use Check to highlight it.'};const i=p.rows.findIndex((_,j)=>!rowSolved(j));if(i>=0){selected=i;hint=i;wrong.clear();finalWrong=false;render();return {tone:'hint',message:'For the highlighted balance, work out the complete side first. The other side must have exactly the same value.'};}const unassigned=sides.findIndex(x=>!x);if(unassigned>=0)return {tone:'hint',message:'All weights are unlocked. Put each one on a pan; you must use every weight exactly once.'};const t=totals();if(t.l!==t.r)return {tone:'hint',message:`The ${t.l>t.r?'left':'right'} pan is heavier by ${Math.abs(t.l-t.r)}. Move or swap weights to close that gap.`};return {tone:'hint',message:'The scale is level — try Check.'};}
  function setFinished(v){finished=!!v;wrong.clear();hint=-1;finalWrong=false;render();}
  function destroy(){root.removeEventListener('click',click);pad.removeEventListener('click',padClick);root.removeEventListener('keydown',keydown);}
  render();return {snapshot,restore,emptySnapshot,progress,check,hint:hintFn,setFinished,destroy};
}

adapter.normalizeConfig=normalise;adapter.fromQuery=q=>({difficulty:q.get('d')||undefined,rowCount:q.get('rc')||undefined,style:q.get('s')||undefined});adapter.toQuery=c=>{c=normalise(c);return {d:c.difficulty,rc:c.rowCount,s:c.style};};adapter.recordKey=c=>{c=normalise(c);return `${c.difficulty}:${c.rowCount}:${c.style}:v192`;};adapter.createPuzzle=(c,seed)=>generateBalanceLab({minYear:c?.difficulty==='easy'?2:4,maxYear:6,topics:['calculation','algebra'],engineSettings:{balance:normalise(c)}},seed);
adapter.title='Balance Lab';adapter.shortTitle='Balance Lab';adapter.icon='⚖';adapter.blurb='Balance equations, collect their common values, then use every weight to level the final scale.';adapter.completionTitle='Perfect balance';adapter.completeMessage='Every equation and the final scale are balanced.';adapter.startMessage='Balance the equations first. Correct answers unlock weights for the final challenge.';adapter.instruction='Make both sides of each equation equal. Each solved balance gives you a weight; use all the weights in the Final Balance.';adapter.howTitle='Solve → collect → balance';adapter.howText='Find the missing number so both sides have the same value. That common value becomes a weight. After all weights are collected, split them between the two pans so the totals match.';adapter.renderOptions=selectOptions;adapter.mount=mount;adapter.meta=(p,c)=>`${(c?.difficulty||p.difficulty||'standard').replace(/^./,x=>x.toUpperCase())} · ${p.rows.length} balances · final weight challenge`;
})(typeof globalThis!=='undefined'?globalThis:this);
