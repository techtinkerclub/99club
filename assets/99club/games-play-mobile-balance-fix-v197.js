/* 99 Club Studio · Mobile Balance live renderer fix v1.99
 * Re-registers only the Mobile Balance online adapter. The generator is unchanged.
 * Every bar has equal arms and a centred suspension point. Hanging strings remain
 * vertical; child bars and weights move with the endpoint that supports them.
 * Balance feedback updates immediately as values are entered.
 */
(function(global){
'use strict';
const Play=global.TT99GamesPlay,A=global.TT99ArithmeticGames;
if(!Play||!A||typeof Play.registerAdapter!=='function')return;

const DIFFS=['easy','standard','challenge'];
const MB_LAYOUT=['auto','simple','nested','multiple'],MB_GIVEN=['auto','shape','total'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const cap=s=>String(s||'').replace(/^./,x=>x.toUpperCase());
function select(c,id,label,vals,labels={}){return `<label><span>${label}</span><select data-v199-opt="${id}">${vals.map(v=>`<option value="${v}" ${String(c[id])===String(v)?'selected':''}>${labels[v]||cap(v)}</option>`).join('')}</select></label>`;}
function bindOptions(root,c,onChange,norm){root.querySelectorAll('[data-v199-opt]').forEach(el=>el.addEventListener('change',()=>onChange(norm({...c,[el.dataset.v199Opt]:el.value}))));}
function numericPad(){return `<div class="tt99-v196-keypad" data-v199-pad>${[1,2,3,4,5,6,7,8,9].map(v=>`<button type="button" data-v199-digit="${v}">${v}</button>`).join('')}<button type="button" data-v199-back>⌫</button><button type="button" data-v199-digit="0">0</button><button type="button" data-v199-clear>Clear</button></div>`;}
function appendDigit(cur,d){const s=cur==null?'':String(cur);return (s==='0'?String(d):s+String(d)).slice(0,5);}
function backspace(cur){const s=cur==null?'':String(cur);return s.length>1?s.slice(0,-1):null;}

function mbNorm(c={}){return {difficulty:DIFFS.includes(c.difficulty)?c.difficulty:'standard',layout:MB_LAYOUT.includes(c.layout)?c.layout:'auto',givenMode:MB_GIVEN.includes(c.givenMode)?c.givenMode:'auto'};}
function mbFrom(q){const o={};if(q.has('d'))o.difficulty=q.get('d');if(q.has('lay'))o.layout=q.get('lay');if(q.has('gm'))o.givenMode=q.get('gm');return o;}
function mbTo(c){c=mbNorm(c);return {d:c.difficulty,lay:c.layout,gm:c.givenMode};}
function mbOptions(root,c,onChange){c=mbNorm(c);root.innerHTML=select(c,'difficulty','Difficulty',DIFFS)+select(c,'layout','Mobile layout',MB_LAYOUT,{auto:'Auto for difficulty',simple:'Single balance',nested:'Nested balance',multiple:'Multiple nested balances'})+select(c,'givenMode','Starting clue',MB_GIVEN,{auto:'Mixed',shape:'Give one shape value',total:'Give whole-mobile total'});bindOptions(root,c,onChange,mbNorm);}
function mbCreate(c,seed){c=mbNorm(c);const settings={minYear:c.difficulty==='easy'?2:4,maxYear:6,topics:['calculation','algebra'],engineSettings:{mobilebalance:c}};for(let i=0;i<8;i++){const p=A.generate('mobilebalance',settings,`${seed}:online:${i}`);if(p&&!p.error&&A.validate(p)?.ok)return p;}throw new Error('Mobile Balance generation failed');}
function mbMeta(p,c){return `${cap(c.difficulty)} · ${p.barCount} balance${p.barCount===1?'':'s'} · ${p.shapeIds.length} shapes`;}
function mbRecord(c){c=mbNorm(c);return `${c.difficulty}:${c.layout}:${c.givenMode}`;}

function shapeSvg(id,cx,cy,size,cls=''){
  if(id==='circle')return `<circle class="${cls}" cx="${cx}" cy="${cy}" r="${size*.46}"/>`;
  if(id==='square')return `<rect class="${cls}" x="${cx-size*.45}" y="${cy-size*.45}" width="${size*.9}" height="${size*.9}" rx="3"/>`;
  if(id==='triangle')return `<path class="${cls}" d="M ${cx} ${cy-size*.52} L ${cx+size*.52} ${cy+size*.45} L ${cx-size*.52} ${cy+size*.45} Z"/>`;
  if(id==='diamond')return `<path class="${cls}" d="M ${cx} ${cy-size*.55} L ${cx+size*.5} ${cy} L ${cx} ${cy+size*.55} L ${cx-size*.5} ${cy} Z"/>`;
  return `<path class="${cls}" d="M ${cx} ${cy-size*.56} L ${cx+size*.16} ${cy-size*.18} L ${cx+size*.55} ${cy-size*.17} L ${cx+size*.25} ${cy+size*.08} L ${cx+size*.35} ${cy+size*.48} L ${cx} ${cy+size*.25} L ${cx-size*.35} ${cy+size*.48} L ${cx-size*.25} ${cy+size*.08} L ${cx-size*.55} ${cy-size*.17} L ${cx-size*.16} ${cy-size*.18} Z"/>`;
}
function depth(n){return n.type==='group'?1:1+Math.max(depth(n.left),depth(n.right));}
function shapeIds(n,out=new Set()){if(n.type==='group')out.add(n.shape);else{shapeIds(n.left,out);shapeIds(n.right,out);}return out;}
function branchKnown(n,vals){return [...shapeIds(n)].every(id=>vals[id]!=null&&String(vals[id])!=='');}
function branchValue(n,vals){if(n.type==='group')return n.count*Number(vals[n.shape]);return branchValue(n.left,vals)+branchValue(n.right,vals);}
function endpoint(cx,cy,dx,deg){const r=deg*Math.PI/180;return {x:cx+dx*Math.cos(r),y:cy+dx*Math.sin(r)};}
function fmt(v){return Number(v).toFixed(2).replace(/\.00$/,'').replace(/(\.\d)0$/,'$1');}
function cloneState(s){return Object.fromEntries(Object.entries(s||{}).map(([k,v])=>[k,v]));}
function animateAttr(name,from,to){if(Math.abs(Number(from)-Number(to))<.01)return'';return `<animate attributeName="${name}" from="${fmt(from)}" to="${fmt(to)}" dur="0.28s" fill="freeze"/>`;}
function animateTranslate(fromX,fromY,toX,toY){if(Math.abs(fromX-toX)<.01&&Math.abs(fromY-toY)<.01)return'';return `<animateTransform attributeName="transform" type="translate" from="${fmt(fromX)} ${fmt(fromY)}" to="${fmt(toX)} ${fmt(toY)}" dur="0.28s" fill="freeze"/>`;}
function animateRotate(from,to){if(Math.abs(from-to)<.01)return'';return `<animateTransform attributeName="transform" type="rotate" from="${fmt(from)}" to="${fmt(to)}" dur="0.28s" fill="freeze"/>`;}

function mobileSvg(p,state,previousState=null){
  let barId=0;
  const colors={circle:'#3f68c5',square:'#e48932',triangle:'#41a56a',diamond:'#d95b4f',star:'#8c5bc7'};
  const vals={...p.givens,...state},prevVals={...p.givens,...(previousState||state)};
  const animate=!!previousState;
  function tiltFor(n,v,expectedTotal=null){
    const leftKnown=branchKnown(n.left,v),rightKnown=branchKnown(n.right,v);
    let a=null,b=null;
    if(leftKnown)a=branchValue(n.left,v);
    if(rightKnown)b=branchValue(n.right,v);
    if(a!=null&&b!=null){const m=Math.max(1,Math.abs(a),Math.abs(b));return Math.max(-5,Math.min(5,(b-a)/m*9));}
    if(expectedTotal!=null&&Number.isFinite(Number(expectedTotal))){
      const half=Number(expectedTotal)/2;
      if(a!=null){const m=Math.max(1,Math.abs(a),Math.abs(half));return Math.max(-5,Math.min(5,(half-a)/m*9));}
      if(b!=null){const m=Math.max(1,Math.abs(b),Math.abs(half));return Math.max(-5,Math.min(5,(b-half)/m*9));}
    }
    return 0;
  }
  function rec(n,cx,y,prevCx,prevY,span,expectedTotal=null,prevExpectedTotal=null){
    if(n.type==='group'){
      const gap=23,first=y+20,prevFirst=prevY+20,last=first+Math.max(0,n.count-1)*gap,prevLast=prevFirst+Math.max(0,n.count-1)*gap,bottom=last+13,prevBottom=prevLast+13;
      let out=`<g class="tt99-mobile-leaf"><line class="string" x1="${fmt(cx)}" y1="${fmt(y)}" x2="${fmt(cx)}" y2="${fmt(bottom)}">${animate?animateAttr('x1',prevCx,cx)+animateAttr('y1',prevY,y)+animateAttr('x2',prevCx,cx)+animateAttr('y2',prevBottom,bottom):''}</line>`;
      for(let i=0;i<n.count;i++){
        const cy=first+i*gap,py=prevFirst+i*gap;
        out+=`<g transform="translate(${fmt(cx)} ${fmt(cy)})">${animate?animateTranslate(prevCx,py,cx,cy):''}${shapeSvg(n.shape,0,0,18,`shape s-${n.shape}`)}</g>`;
      }
      return `${out}</g>`;
    }
    const id=barId++,arm=Math.max(48,Math.min(150,span*.28)),hanger=72,childSpan=Math.max(100,span*.5);
    const tilt=tiltFor(n,vals,expectedTotal),prevTilt=tiltFor(n,prevVals,prevExpectedTotal);
    const left=endpoint(cx,y,-arm,tilt),right=endpoint(cx,y,arm,tilt),prevLeft=endpoint(prevCx,prevY,-arm,prevTilt),prevRight=endpoint(prevCx,prevY,arm,prevTilt);
    const leftChildY=left.y+hanger,rightChildY=right.y+hanger,prevLeftChildY=prevLeft.y+hanger,prevRightChildY=prevRight.y+hanger;
    const leftTotal=branchKnown(n.left,vals)?branchValue(n.left,vals):null,rightTotal=branchKnown(n.right,vals)?branchValue(n.right,vals):null;
    const prevLeftTotal=branchKnown(n.left,prevVals)?branchValue(n.left,prevVals):null,prevRightTotal=branchKnown(n.right,prevVals)?branchValue(n.right,prevVals):null;
    return `<g class="tt99-mobile-subtree" data-bar="${id}"><g transform="translate(${fmt(cx)} ${fmt(y)})">${animate?animateTranslate(prevCx,prevY,cx,y):''}<g transform="rotate(${fmt(tilt)})">${animate?animateRotate(prevTilt,tilt):''}<line class="bar" x1="${fmt(-arm)}" y1="0" x2="${fmt(arm)}" y2="0"/></g><circle class="tt99-mobile-pivot" cx="0" cy="0" r="3"/></g><line class="string" x1="${fmt(left.x)}" y1="${fmt(left.y)}" x2="${fmt(left.x)}" y2="${fmt(leftChildY)}">${animate?animateAttr('x1',prevLeft.x,left.x)+animateAttr('y1',prevLeft.y,left.y)+animateAttr('x2',prevLeft.x,left.x)+animateAttr('y2',prevLeftChildY,leftChildY):''}</line>${rec(n.left,left.x,leftChildY,prevLeft.x,prevLeftChildY,childSpan,leftTotal,prevLeftTotal)}<line class="string" x1="${fmt(right.x)}" y1="${fmt(right.y)}" x2="${fmt(right.x)}" y2="${fmt(rightChildY)}">${animate?animateAttr('x1',prevRight.x,right.x)+animateAttr('y1',prevRight.y,right.y)+animateAttr('x2',prevRight.x,right.x)+animateAttr('y2',prevRightChildY,rightChildY):''}</line>${rec(n.right,right.x,rightChildY,prevRight.x,prevRightChildY,childSpan,rightTotal,prevRightTotal)}</g>`;
  }
  const rootX=300,rootY=62,viewH=Math.max(265,depth(p.tree)*92+115),style=Object.entries(colors).map(([k,v])=>`--${k}:${v}`).join(';');
  const note=p.topTotal!=null?'<p class="tt99-mobile-total-note">The number in the top circle is the total weight of the whole mobile.</p>':'';
  const top=p.topTotal!=null?`<g class="top-total"><circle cx="${rootX}" cy="25" r="20"/><text x="${rootX}" y="30">${esc(p.topTotal)}</text><line x1="${rootX}" y1="45" x2="${rootX}" y2="${rootY}"/></g>`:`<line class="top-string" x1="${rootX}" y1="18" x2="${rootX}" y2="${rootY}"/>`;
  return `${note}<svg class="tt99-mobile-svg" viewBox="0 0 600 ${viewH}" style="${style}">${top}${rec(p.tree,rootX,rootY,rootX,rootY,520,p.topTotal,p.topTotal)}</svg>`;
}

function mbMount(root,p,ctx){
  const unknown=p.shapeIds.filter(id=>p.givens[id]==null),state=Object.fromEntries(unknown.map(id=>[id,null]));
  let selected=unknown[0]||null,wrong=new Set(),hint=null,finished=false,lastRenderedState=cloneState(state);
  root.className='tt99-mobile-online';
  root.innerHTML=`<div class="tt99-mobile-stage" data-mobile-stage></div><div class="tt99-mobile-values">${p.shapeIds.map(id=>{const m=p.shapeMeta[id];return p.givens[id]!=null?`<div class="given"><span data-shape-icon="${id}"></span><b>${esc(m.label)} = ${esc(p.givens[id])}</b></div>`:`<button type="button" data-mobile-answer="${id}"><span data-shape-icon="${id}"></span><b>${esc(m.label)} = <em data-mobile-value></em></b></button>`;}).join('')}</div>${numericPad()}`;
  const stage=root.querySelector('[data-mobile-stage]'),boxes=[...root.querySelectorAll('[data-mobile-answer]')],pad=root.querySelector('[data-v199-pad]');
  function renderIcons(){root.querySelectorAll('[data-shape-icon]').forEach(el=>{el.innerHTML=`<svg viewBox="0 0 40 40">${shapeSvg(el.dataset.shapeIcon,20,20,20,`shape s-${el.dataset.shapeIcon}`)}</svg>`;});}
  function render({animate=true}={}){const prev=animate?lastRenderedState:null;stage.innerHTML=mobileSvg(p,state,prev);lastRenderedState=cloneState(state);boxes.forEach(b=>{const id=b.dataset.mobileAnswer;b.querySelector('[data-mobile-value]').textContent=state[id]??'';b.classList.toggle('is-selected',selected===id);b.classList.toggle('is-wrong',wrong.has(id));b.classList.toggle('is-hint',hint===id);b.disabled=finished;});pad.querySelectorAll('button').forEach(b=>b.disabled=finished||!selected);renderIcons();}
  function snapshot(){return {...state};}
  function emptySnapshot(){return Object.fromEntries(unknown.map(id=>[id,null]));}
  function restore(s){for(const id of unknown)state[id]=s?.[id]??null;wrong.clear();hint=null;lastRenderedState=cloneState(state);render({animate:false});}
  function commit(v){if(!selected||finished||ctx.isPaused?.())return;state[selected]=v;wrong.clear();hint=null;render({animate:true});ctx.onChange?.(snapshot());}
  function click(e){const b=e.target.closest('[data-mobile-answer]');if(b&&!finished){selected=b.dataset.mobileAnswer;hint=null;render({animate:false});return;}const d=e.target.closest('[data-v199-digit]');if(d)return commit(appendDigit(state[selected],d.dataset.v199Digit));if(e.target.closest('[data-v199-back]'))return commit(backspace(state[selected]));if(e.target.closest('[data-v199-clear]'))return commit(null);}
  function keydown(e){if(!selected)return;if(/^\d$/.test(e.key)){e.preventDefault();commit(appendDigit(state[selected],e.key));}else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();commit(backspace(state[selected]));}}
  root.addEventListener('click',click);root.addEventListener('keydown',keydown);
  function bad(){return unknown.filter(id=>state[id]!=null&&Number(state[id])!==Number(p.values[id]));}
  function filled(){return unknown.filter(id=>state[id]!=null).length;}
  function complete(){return filled()===unknown.length&&!bad().length;}
  function progress(){return `${filled()} / ${unknown.length} shape values entered · ${p.barCount} balance${p.barCount===1?'':'s'}`;}
  function check({silent=false}={}){if(complete())return {complete:true,message:'Balanced! Every bar and every shape value is correct.'};const b=bad();if(!silent){wrong=new Set(b);render({animate:false});}return b.length?{complete:false,wrong:true,message:`${b.length} shape value${b.length===1?' is':'s are'} incorrect. Watch the bars as you change the values: a heavy side drops and a light side rises.`}:{complete:false,wrong:false,message:'No incorrect values so far. Use the lower balances to unlock the higher ones.'};}
  function hintFn(){if(bad().length)return {tone:'hint',message:'At least one entered shape value is wrong. Watch which completed bar tilts, or use Check to highlight the incorrect entry.'};const id=unknown.find(x=>state[x]==null);if(!id)return {tone:'hint',message:'All values are filled — try Check.'};selected=id;hint=id;render({animate:false});return {tone:'hint',message:p.barCount>1?'Start with the lowest bar whose shapes you can compare directly. As soon as both sides have values, the bar responds visually. Once that bar balances, treat its whole branch as one known weight higher up.':'Both sides of the bar weigh the same. Enter a value and watch the bar respond.'};}
  function setFinished(v){finished=!!v;wrong.clear();hint=null;render({animate:true});}
  function destroy(){root.removeEventListener('click',click);root.removeEventListener('keydown',keydown);}
  render({animate:false});
  return {snapshot,restore,emptySnapshot,progress,check,hint:hintFn,setFinished,destroy};
}

Play.registerAdapter('mobilebalance',{
  id:'mobilebalance',order:35,icon:'⚖',title:'Mobile Balance',shortTitle:'Mobile Balance',category:'Algebra & arithmetic',
  blurb:'Use balanced hanging shapes to work out hidden values. Challenge has multiple nested balances.',
  completionTitle:'Mobile balanced',completeMessage:'Every bar is balanced and every shape value is correct.',
  startMessage:'Use the lowest balance first, then work upwards through the mobile.',
  instruction:'Every horizontal bar is balanced. Work out the value of each shape.',
  howTitle:'A whole branch has weight too',
  howText:'The suspension point is in the middle of every bar, so the left and right sides carry equal weight. As you enter values, each completed balance moves immediately: the heavier side drops and the lighter side rises. Hanging strings stay vertical and the weights move with their supporting bar. Repeated shapes mean repeated copies of the same value. If a number is shown in the top circle, it is the total weight of the whole mobile.',
  normalizeConfig:mbNorm,fromQuery:mbFrom,toQuery:mbTo,renderOptions:mbOptions,createPuzzle:mbCreate,mount:mbMount,meta:mbMeta,recordKey:mbRecord
});
})(typeof globalThis!=='undefined'?globalThis:this);
