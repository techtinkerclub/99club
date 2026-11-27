(function(G){
'use strict';
if(!G)return;

const ALLOWED_TAGS=new Set(['B','STRONG','I','EM','BR','P','DIV','UL','OL','LI','FONT']);

function esc(v){
  return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function sanitiseRichHtml(input){
  const box=document.createElement('div');
  box.innerHTML=String(input||'').slice(0,6000);
  [...box.querySelectorAll('*')].forEach(el=>{
    if(!ALLOWED_TAGS.has(el.tagName)){
      const parent=el.parentNode;
      if(!parent)return;
      while(el.firstChild)parent.insertBefore(el.firstChild,el);
      el.remove();
      return;
    }
    const fontSize=el.tagName==='FONT'?el.getAttribute('size'):null;
    [...el.attributes].forEach(a=>el.removeAttribute(a.name));
    if(el.tagName==='FONT'){
      const size=['1','3','5'].includes(fontSize)?fontSize:'3';
      el.setAttribute('size',size);
    }
  });
  [...box.querySelectorAll('font')].forEach(el=>{
    const raw=el.getAttribute('size');
    el.setAttribute('size',['1','3','5'].includes(raw)?raw:'3');
  });
  return box.innerHTML;
}

function plainText(html){
  const box=document.createElement('div');
  box.innerHTML=sanitiseRichHtml(html);
  box.querySelectorAll('br').forEach(el=>el.replaceWith('\n'));
  box.querySelectorAll('p,div,li').forEach(el=>el.append('\n'));
  return String(box.textContent||'').replace(/\n{3,}/g,'\n\n').trim();
}

function normalise(raw){
  const src=raw&&typeof raw==='object'?raw:{};
  const promptHtml=sanitiseRichHtml(src.promptHtml!=null?src.promptHtml:esc(src.prompt||''));
  return {
    ...src,
    mode:src.mode==='custom'?'custom':'standard',
    type:String(src.type||'').slice(0,60),
    category:String(src.category||'').slice(0,40),
    title:String(src.title||'').slice(0,100),
    promptHtml,
    prompt:plainText(promptHtml).slice(0,600),
    answer:String(src.answer||'').slice(0,400),
    answerMode:src.answerMode==='manual'?'manual':'bound',
    answerSource:String(src.answerSource||'').replace(/[^a-zA-Z0-9:_-]/g,'').slice(0,120),
    revealed:!!src.revealed
  };
}

function makeCustom(raw){
  const src=normalise(raw||{});
  const keepLiveAnswer=src.mode==='custom'||(src.type&&src.type!=='custom');
  return normalise({
    ...src,
    mode:'custom',
    type:src.type||'custom',
    title:src.title||'Challenge',
    promptHtml:src.promptHtml||'Write your challenge here.',
    answerMode:keepLiveAnswer?src.answerMode:'manual'
  });
}

function toolbarHtml(prefix){
  return `<div class="gd-rich-toolbar" data-gd-rich-toolbar="${esc(prefix)}" aria-label="Text formatting">
    <button type="button" data-gd-rich-action="bold" aria-label="Bold"><strong>B</strong></button>
    <button type="button" data-gd-rich-action="italic" aria-label="Italic"><em>I</em></button>
    <span class="gd-rich-divider" aria-hidden="true"></span>
    <button type="button" data-gd-rich-action="size-small" aria-label="Small text">A<small>−</small></button>
    <button type="button" data-gd-rich-action="size-normal" aria-label="Normal text">A</button>
    <button type="button" data-gd-rich-action="size-large" aria-label="Large text">A<small>+</small></button>
  </div>`;
}

function editorHtml(challenge,prefix,opts={}){
  const ch=makeCustom(challenge);
  const supplied=Array.isArray(opts.answerSources)?opts.answerSources:[];
  const sources=supplied
    .filter(s=>s&&s.id&&s.label)
    .map(s=>({id:String(s.id).replace(/[^a-zA-Z0-9:_-]/g,'').slice(0,120),label:String(s.label).slice(0,100)}))
    .filter(s=>s.id&&s.label);
  let selected=ch.answerMode==='manual'?'manual':(ch.answerSource||'generated');
  const choices=[{id:'manual',label:'Type the answer myself'}];
  if(ch.answerMode==='bound'&&!ch.answerSource)choices.push({id:'generated',label:String(opts.generatedAnswerLabel||'Keep the generated answer').slice(0,100)});
  choices.push(...sources);
  if(!choices.some(s=>s.id===selected))selected='manual';
  const sourceOptions=choices.map(s=>`<option value="${esc(s.id)}"${s.id===selected?' selected':''}>${esc(s.label)}</option>`).join('');
  const answerEditor=selected==='manual'
    ?`<label class="gd-field"><span>Answer (optional)</span><input class="gd-input" id="${esc(prefix)}-custom-answer" maxlength="400" value="${esc(ch.answer)}" placeholder="Shown only when Reveal answer is used"></label>`
    :`<div class="gd-answer-live"><span>Current answer</span><strong id="${esc(prefix)}-custom-live-answer">${esc(ch.answer||'—')}</strong><small>This stays linked to the diagram.</small></div>`;
  return `<div class="gd-challenge-editor">
    <label class="gd-field"><span>Title</span><input class="gd-input" id="${esc(prefix)}-custom-title" maxlength="100" value="${esc(ch.title)}" placeholder="e.g. Can you explain why?"></label>
    <label class="gd-field"><span>Question / instructions</span></label>
    ${toolbarHtml(prefix)}
    <div class="gd-rich-editor" id="${esc(prefix)}-custom-prompt" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="Write your challenge or teaching prompt…">${ch.promptHtml}</div>
    ${choices.length>1?`<label class="gd-field"><span>Answer comes from</span><select class="gd-select" id="${esc(prefix)}-custom-answer-source">${sourceOptions}</select></label>`:''}
    ${answerEditor}
    <p class="gd-help">Formatting is deliberately small: bold, italic and three text sizes. A linked answer updates automatically when the diagram changes.</p>
  </div>`;
}

function tabsHtml(prefix,active='standard'){
  const safe=String(prefix||'gd').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,30)||'gd';
  return `<div class="gd-challenge-tabs" role="tablist" aria-label="Challenge mode">
    <button type="button" class="gd-challenge-tab${active==='standard'?' is-active':''}" data-${safe}-challenge-tab="standard">Standard</button>
    <button type="button" class="gd-challenge-tab${active==='custom'?' is-active':''}" data-${safe}-challenge-tab="custom">Custom</button>
  </div>`;
}

function pickerHtml(templates,categories,activeCategory,selectedId,prefix){
  const cats=(categories||[]).map(c=>`<button type="button" class="gd-challenge-chip${c.id===activeCategory?' is-active':''}" data-${esc(prefix)}-challenge-cat="${esc(c.id)}">${esc(c.label)}</button>`).join('');
  const cards=(templates||[]).filter(t=>t.category===activeCategory).map(t=>`
    <button type="button" class="gd-challenge-card${t.id===selectedId?' is-selected':''}" data-${esc(prefix)}-challenge-type="${esc(t.id)}"${t.disabled?' disabled':''}>
      <strong>${esc(t.title)}</strong>
      <span>${esc(t.desc||'')}</span>
      ${t.disabledReason?`<small>${esc(t.disabledReason)}</small>`:''}
    </button>`).join('');
  const pool=(templates||[]).filter(t=>!t.disabled).map(t=>({id:t.id,category:t.category}));
  return `<div class="gd-challenge-picker" data-gd-picker-prefix="${esc(prefix)}" data-gd-picker-pool="${esc(JSON.stringify(pool))}">
    <div class="gd-challenge-random-row"><button type="button" class="gd-btn gd-btn--primary" data-gd-random-scope="all">Random · all types</button><button type="button" class="gd-btn" data-gd-random-scope="${esc(activeCategory)}"${pool.some(t=>t.category===activeCategory)?'':' disabled'}>Random · ${esc((categories||[]).find(c=>c.id===activeCategory)?.label||'this category')}</button></div>
    <div class="gd-challenge-chips" role="tablist" aria-label="Challenge categories">${cats}</div>
    <div class="gd-challenge-cards">${cards||'<p class="gd-help">No challenge types in this category yet.</p>'}</div>
  </div>`;
}


// Random generation uses the same native selectors and generator as the
// teacher's explicit selection. Keep the scope for subsequent Another clicks.
let randomScope=null,launchingRandom=false;
function randomFromPicker(picker,scope){
  const prefix=picker.dataset.gdPickerPrefix;
  if(!/^[a-z0-9-]+$/.test(prefix||''))return;
  const pool=JSON.parse(picker.dataset.gdPickerPool||'[]').filter(t=>scope==='all'||t.category===scope);
  if(!pool.length)return;
  const previous=randomScope?.last;
  const candidates=pool.length>1?pool.filter(t=>t.id!==previous):pool;
  const pick=candidates[Math.floor(Math.random()*candidates.length)];
  launchingRandom=true;
  try{
    const controls=document.getElementById('gd-controls');
    controls.querySelector('[data-'+prefix+'-challenge-cat="'+CSS.escape(pick.category)+'"]')?.click();
    const type=controls.querySelector('[data-'+prefix+'-challenge-type="'+CSS.escape(pick.id)+'"]');
    if(!type||type.disabled)return;
    type.click();
    randomScope={prefix,scope,last:pick.id};
    controls.querySelector('#'+prefix+'-generate')?.click();
  }finally{launchingRandom=false}
}
function nativeRandomHtml(prefix,groups){
  return '<div class="gd-challenge-random-row" data-gd-native-prefix="'+esc(prefix)+'" data-gd-native-groups="'+esc(JSON.stringify(groups))+'"><button type="button" class="gd-btn gd-btn--primary" data-gd-native-random="all">Random · all types</button>'+groups.map((g,i)=>'<button type="button" class="gd-btn" data-gd-native-random="'+i+'">Random · '+esc(g.label)+'</button>').join('')+'</div>';
}
function nativeRandom(row,scope){
  const groups=JSON.parse(row.dataset.gdNativeGroups||'[]'),prefix=row.dataset.gdNativePrefix;
  if(!/^[a-z0-9-]+$/.test(prefix||''))return;
  const ids=scope==='all'?groups.flatMap(g=>g.ids):groups[Number(scope)]?.ids||[];
  const available=ids.filter(id=>document.querySelector('#gd-controls [data-'+prefix+'-challenge-mode="'+CSS.escape(id)+'"]:not(:disabled)'));
  if(!available.length)return;
  const options=available.length>1?available.filter(id=>id!==randomScope?.last):available;
  const id=options[Math.floor(Math.random()*options.length)];
  launchingRandom=true;try{randomScope={prefix,scope,last:id,native:true};document.querySelector('#gd-controls [data-'+prefix+'-challenge-mode="'+CSS.escape(id)+'"]').click()}finally{launchingRandom=false}
}
if(typeof document!=='undefined')document.addEventListener('click',e=>{
  const el=e.target?.closest?.('button');if(!el||launchingRandom||el.closest('#gd-board-floating-controls'))return;
  const picker=el.closest('.gd-challenge-picker');
  if(el.hasAttribute('data-gd-random-scope')&&picker){e.preventDefault();e.stopImmediatePropagation();randomFromPicker(picker,el.dataset.gdRandomScope);return}
  const native=el.closest('[data-gd-native-prefix]');
  if(el.hasAttribute('data-gd-native-random')&&native){e.preventDefault();e.stopImmediatePropagation();nativeRandom(native,el.dataset.gdNativeRandom);return}
  if(el.matches('[data-challenge-action="another"],[data-pv-activity-another],[data-ab-another]')&&randomScope){
    const p=document.querySelector('#gd-controls [data-gd-picker-prefix="'+randomScope.prefix+'"]'),n=document.querySelector('#gd-controls [data-gd-native-prefix="'+randomScope.prefix+'"]');
    if(p||n){e.preventDefault();e.stopImmediatePropagation();if(p)randomFromPicker(p,randomScope.scope);else nativeRandom(n,randomScope.scope);return}
  }
  if(el.closest('#gd-controls')&&(el.id.endsWith('-generate')||Array.from(el.attributes).some(a=>/-challenge-mode$/.test(a.name))))randomScope=null;
  if(el.matches('[data-challenge-action="end"],[data-pv-activity-exit],[data-ab-exit]'))randomScope=null;
},true);

const pupilStates=new WeakMap();
let pupilCurrent=null;
function capturePupil(ch){const s=ch&&pupilStates.get(ch);return s?{values:s.values.slice(),status:s.status,correct:s.correct}:null}
function restorePupil(ch,s){if(ch&&s&&Array.isArray(s.values))pupilStates.set(ch,{challenge:ch,values:s.values.map(v=>String(v).slice(0,240)),status:String(s.status||''),correct:!!s.correct,spec:null})}
function pupilSpec(kind='text',extra={}){return {kind,...extra}}
function cleanAnswer(v){return String(v??'').trim().toLowerCase().replace(/[−–—]/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/[’‘]/g,"'").replace(/\s+/g,' ')}
function numericAnswer(v){
  const t=cleanAnswer(v);
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(t))return NaN;
  return Number(t);
}
function fractionAnswer(v){
  const t=cleanAnswer(v);
  const mixed=t.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/),f=t.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);
  if(mixed&&+mixed[3]>0&&+mixed[2]<+mixed[3])return +mixed[1]+(+mixed[2]/+mixed[3]);
  if(f&&+f[2]>0)return +f[1]/+f[2];
  return numericAnswer(t);
}
function moneyAnswer(v){
  let t=cleanAnswer(v).replace(/\s/g,'');
  if(t.endsWith('p'))return numericAnswer(t.slice(0,-1))/100;
  return numericAnswer(t.replace(/^£/,''));
}
function timeAnswer(v,periodRequired=false){
  const m=cleanAnswer(v).replace(/\./g,'').match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if(!m||+m[2]>59||+m[1]>23||m[3]&&(+m[1]<1||+m[1]>12)||periodRequired&&!m[3])return null;
  return {h:m[3]?(+m[1]%12)+(m[3]==='pm'?12:0):+m[1],m:+m[2],period:m[3]};
}
function pupilAnswerCorrect(spec,values,expected){
  const a=String(values[0]??'').trim(),b=String(expected??'').trim();
  if(spec.kind==='model')return !!spec.check?.();
  if(spec.kind==='discuss'||!a||!b)return false;
  const equal=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<1e-8;
  const compact=v=>cleanAnswer(v).replace(/\s/g,'').replace(/x/g,'*');
  switch(spec.kind){
    case 'target-expression':return !!G.numberChallenges?.targetAnswerCorrect(spec.question,a);
    case 'choice':return cleanAnswer(a)===cleanAnswer(spec.expected??b);
    case 'number':return equal(numericAnswer(a),numericAnswer(b));
    case 'ordered-parts':return Array.isArray(spec.parts)&&values.length===spec.parts.length&&spec.parts.every((part,i)=>equal(numericAnswer(values[i]),Number(part.answer)));
    case 'quotient-remainder':return equal(numericAnswer(a),spec.quotient)&&equal(numericAnswer(values[1]),spec.remainder);
    case 'multiplication-equation':{
      const parse=v=>{const sides=cleanAnswer(v).replace(/×|x/gi,'*').split('=');if(sides.length!==2)return null;const product=sides.find(s=>s.includes('*'));if(!product)return null;const factors=product.split('*').map(numericAnswer).sort((x,y)=>x-y),total=numericAnswer(sides[sides.indexOf(product)===0?1:0]);if(factors.length!==2||!equal(factors[0]*factors[1],total))return null;return{factors,total}};
      const x=parse(a),y=parse(b);return !!x&&!!y&&equal(x.total,y.total)&&x.factors.every((n,i)=>equal(n,y.factors[i]));
    }
    case 'addition-equation':{
      const parse=v=>{
        const sides=cleanAnswer(v).split('=').map(t=>t.trim());
        if(sides.length!==2)return null;
        const sum=sides.find(t=>t.includes('+'));
        if(!sum)return null;
        const total=numericAnswer(sides[sides.indexOf(sum)===0?1:0]);
        const terms=sum.split('+').map(numericAnswer).sort((x,y)=>x-y);
        if(!Number.isFinite(total)||terms.some(n=>!Number.isFinite(n))||!equal(terms.reduce((x,y)=>x+y,0),total))return null;
        return {terms,total};
      };
      const x=parse(a),y=parse(b);
      return !!x&&!!y&&equal(x.total,y.total)&&x.terms.length===y.terms.length&&x.terms.every((n,i)=>equal(n,y.terms[i]));
    }
    case 'unit':{
      const suffix=String(spec.unit||'');
      const strip=v=>{v=cleanAnswer(v);return suffix&&v.endsWith(suffix)?v.slice(0,-suffix.length).trim():v};
      return equal(numericAnswer(strip(a)),numericAnswer(strip(b)));
    }
    case 'money':return equal(moneyAnswer(a),moneyAnswer(b));
    case 'fraction':return equal(fractionAnswer(a),fractionAnswer(b));
    case 'fraction-form':return /^\d+\s*\/\s*[1-9]\d*$/.test(a)&&compact(a)===compact(b);
    case 'mixed':return /^\d+\s+\d+\s*\/\s*[1-9]\d*$/.test(a)&&equal(fractionAnswer(a),fractionAnswer(b));
    case 'coordinate':{
      const m=b.match(/^\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/);
      return !!m&&equal(numericAnswer(a),+m[1])&&equal(numericAnswer(values[1]),+m[2]);
    }
    case 'metrics':{
      const m=b.match(/Perimeter\s+([\d.]+)\s+units;\s*area\s+([\d.]+)\s+square units/i);
      return !!m&&equal(numericAnswer(a),+m[1])&&equal(numericAnswer(values[1]),+m[2]);
    }
    case 'spoken':return spokenAnswer(a)===spokenAnswer(b);
    case 'partials':{
      const given=values.slice(0,-1).map(numericAnswer).sort((x,y)=>x-y),products=[...spec.products].sort((x,y)=>x-y);
      return given.length===products.length&&given.every((v,i)=>equal(v,products[i]))&&equal(numericAnswer(values.at(-1)),spec.total);
    }
    case 'set':{
      const parse=v=>cleanAnswer(v).split(/[,;\s]+/).filter(Boolean).map(numericAnswer).sort((x,y)=>x-y);
      const x=parse(a),y=parse(b);
      return x.length===y.length&&x.every((v,i)=>equal(v,y[i]));
    }
    case 'clock-face':{
      const x=timeAnswer(a),y=timeAnswer(b);
      return !!x&&!!y&&x.h%12===y.h%12&&x.m===y.m;
    }
    case 'clock-24':{
      const x=timeAnswer(a),y=timeAnswer(b);
      return !!x&&!!y&&!x.period&&x.h===y.h&&x.m===y.m;
    }
    case 'clock-12':{
      const x=timeAnswer(a,true),y=timeAnswer(b,true);
      return !!x&&!!y&&x.h===y.h&&x.m===y.m;
    }
    default:return compact(a)===compact(b);
  }
}
function pickVariant(list,previous){
  if(!Array.isArray(list)||!list.length)throw new Error('Empty challenge variant list');
  let i=Math.min(list.length-1,Math.floor(Math.random()*list.length));
  if(list.length>1&&JSON.stringify(list[i])===previous)i=(i+1)%list.length;
  return list[i];
}
function simplePolygon(points){
  if(!Array.isArray(points)||points.length<3||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return false;
  if(new Set(points.map(p=>p.x+','+p.y)).size!==points.length)return false;
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const on=(a,b,c)=>Math.abs(cross(a,b,c))<1e-9&&c.x>=Math.min(a.x,b.x)&&c.x<=Math.max(a.x,b.x)&&c.y>=Math.min(a.y,b.y)&&c.y<=Math.max(a.y,b.y);
  const intersect=(a,b,c,d)=>{
    const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b);
    return x*y<0&&z*w<0||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);
  };
  let signed=0;
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],c=points[(i+2)%points.length];
    signed+=a.x*b.y-a.y*b.x;
    if(Math.abs(cross(a,b,c))<1e-9&&(a.x-b.x)*(c.x-b.x)+(a.y-b.y)*(c.y-b.y)>0)return false;
    for(let j=i+2;j<points.length;j++){
      if(i===0&&j===points.length-1)continue;
      if(intersect(a,b,points[j],points[(j+1)%points.length]))return false;
    }
  }
  return Math.abs(signed)>1e-9;
}
function spokenAnswer(v){
  const nums={one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10',eleven:'11',twelve:'12',fifteen:'15',twenty:'20','twenty-five':'25','twenty five':'25',thirty:'30'};
  return cleanAnswer(v).replace(/\btwenty[- ]five\b/g,'25').replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty)\b/g,m=>nums[m]).replace(/\bminutes?\b/g,'').replace(/\b15\s+(past|to)\b/g,'quarter $1').replace(/\b30\s+past\b/g,'half past').replace(/\bo\s*'?\s*clock\b/g,"o'clock").replace(/\s+/g,' ').trim();
}
// A single touch keypad for all numeric challenge fields. The native input
// remains the source of truth: existing input events and checkers still work.
const keypadFields='[data-gd-keypad],[data-challenge-response],[data-nl-missing-slot],[data-pv-activity-answer],[data-ab-answer],[data-ab-history-answer]';
let keypad=null,keypadField=null,keypadSelectAll=false;
function keypadKind(field){
  if(field.dataset.gdKeypad)return field.dataset.gdKeypad;
  if(field.matches('[data-challenge-response],[data-nl-missing-slot]'))return 'number-line';
  return 'number';
}
function keypadSymbols(kind){
  if(kind==='dimension')return [];
  if(kind==='marker-order')return ['A','B','C','<'];
  if(kind==='number-line')return ['−','/','Space','%'];
  if(['fraction','fraction-form','mixed'].includes(kind))return ['−','/','Space'];
  if(kind==='money')return ['£','p'];
  if(kind.startsWith('clock-'))return kind==='clock-12'?[':','Space','am','pm']:[':'];
  if(kind==='set')return [',','Space'];
  if(kind==='target-expression')return ['+','−','×','÷','=','(',')','Space'];
  if(kind==='spoken')return ['quarter','half','past','to',"o'clock",'minutes','Space'];
  if(['addition-equation','multiplication-equation','equation','expression','fact','fact-family','multiplication'].includes(kind))return ['+','−','×','÷','=','(',')','Space'];
  return ['−'];
}
function closeKeypad(){keypad?.remove();keypad=null;if(keypadField)keypadField.removeAttribute('aria-expanded');keypadField=null;keypadSelectAll=false}
function positionKeypad(){
  if(!keypad||!keypadField?.isConnected){closeKeypad();return}
  const r=keypadField.getBoundingClientRect(),w=keypad.offsetWidth,h=keypad.offsetHeight;
  const vw=document.documentElement.clientWidth,vh=document.documentElement.clientHeight;
  let x=r.right+10;if(x+w>vw-8)x=r.left-w-10;if(x<8)x=Math.max(8,Math.min(vw-w-8,r.left));
  let y=r.top;if(x<r.right&&x+w>r.left)y=r.bottom+8;
  if(y+h>vh-8)y=Math.max(8,Math.min(vh-h-8,r.top-h-8));
  keypad.style.left=Math.max(8,Math.min(vw-w-8,x))+'px';keypad.style.top=Math.max(8,y)+'px';
}
function keypadUpdateDisplay(){if(keypad&&keypadField)keypad.querySelector('.gd-touch-display').textContent=keypadField.value||'?'}
function keypadWrite(key){
  const field=keypadField;if(!field?.isConnected||field.disabled){closeKeypad();return}
  let value=field.value;
  if(key==='Clear')value='';
  else if(key==='⌫')value=keypadSelectAll?'':value.slice(0,-1);
  else{const mapped=key==='Space'?' ':key==='−'?'-':key;value=(keypadSelectAll?'':value)+mapped}
  keypadSelectAll=false;
  field.value=value.slice(0,Math.min(field.maxLength>0?field.maxLength:64,240));
  field.dispatchEvent(new Event('input',{bubbles:true}));keypadUpdateDisplay();
}
function keypadCheck(){
  const field=keypadField;if(!field)return;
  const root=field.closest('.gd-pupil-response,.nl-challenge-solve,.gd-pv-activity,.gd-ab-task')||document.getElementById('gd-stage');
  const check=root?.querySelector('[data-gd-pupil-check],[data-challenge-check],[data-pv-activity-check],[data-ab-check],[data-ab-history-check]');
  closeKeypad();if(check&&!check.disabled)check.click();
}
function openKeypad(field){
  if(!field||field.disabled||field.readOnly)return;
  if(keypadField===field&&keypad)return;
  closeKeypad();keypadField=field;keypadSelectAll=false;
  field.setAttribute('inputmode','none');field.setAttribute('aria-expanded','true');
  const panel=document.createElement('div');panel.className='gd-touch-keypad';panel.setAttribute('role','dialog');panel.setAttribute('aria-label',keypadKind(field)==='dimension'?'Enter dimension':'Enter your answer');
  const label=field.getAttribute('aria-label')||field.closest('label')?.querySelector('span')?.textContent||'Enter your answer';
  const keyButton=k=>'<button type="button" data-gd-touch-key="'+esc(k)+'" aria-label="'+esc(k==='⌫'?'Backspace':k)+'">'+esc(k)+'</button>';
  panel.innerHTML='<div class="gd-touch-head"><strong>'+esc(label==='Answer'?'Enter your answer':label)+'</strong><button type="button" data-gd-touch-close aria-label="Close keypad">×</button></div><div class="gd-touch-display" aria-live="polite"></div><div class="gd-touch-grid">'+(keypadKind(field)==='marker-order'?['A','B','C','<','⌫']:['7','8','9','4','5','6','1','2','3','0','.','⌫']).map(keyButton).join('')+'</div><div class="gd-touch-symbols">'+(keypadKind(field)==='marker-order'?[]:keypadSymbols(keypadKind(field))).map(keyButton).join('')+'</div><div class="gd-touch-actions"><button type="button" data-gd-touch-key="Clear">Clear</button><button type="button" data-gd-touch-close>Done</button>'+(keypadKind(field)==='dimension'?'':'<button type="button" data-gd-touch-check>Check</button>')+'</div>';
  keypad=panel;document.body.appendChild(panel);keypadUpdateDisplay();positionKeypad();
  panel.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault()});
  panel.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const button=e.target.closest('button');if(!button)return;if(button.hasAttribute('data-gd-touch-close'))closeKeypad();else if(button.hasAttribute('data-gd-touch-check'))keypadCheck();else if(button.hasAttribute('data-gd-touch-key'))keypadWrite(button.dataset.gdTouchKey)});
}
if(typeof document!=='undefined'){
  document.addEventListener('pointerdown',e=>{
    const field=e.target?.closest?.(keypadFields);if(field){field.setAttribute('inputmode','none');return}
    if(keypad&&!e.target.closest('.gd-touch-keypad'))closeKeypad();
  },true);
  document.addEventListener('click',e=>{const field=e.target?.closest?.(keypadFields);if(field&&!field.disabled)openKeypad(field)},true);
  document.addEventListener('input',e=>{if(e.target===keypadField)keypadUpdateDisplay()},true);
  document.addEventListener('keydown',e=>{if(keypad&&e.key==='Escape'){e.preventDefault();e.stopPropagation();closeKeypad()}},true);
  window.addEventListener('resize',positionKeypad);
  const root=document.getElementById('tt99-goodies-root');
  if(root&&typeof MutationObserver==='function')new MutationObserver(()=>{if(keypad&&!keypadField?.isConnected)closeKeypad()}).observe(root,{childList:true,subtree:true});
}
function pupilFields(spec){
  if(spec.kind==='quotient-remainder')return [{label:'Quotient',hint:'Number'},{label:'Remainder',hint:'0 if exact'}];
  if(spec.kind==='coordinate')return [{label:'x',hint:'x'},{label:'y',hint:'y'}];
  if(spec.kind==='metrics')return [{label:'Perimeter',hint:'units'},{label:'Area',hint:'square units'}];
  if(spec.kind==='ordered-parts')return spec.parts.map(p=>({label:p.label,hint:'Number',unit:p.unit}));
  if(spec.kind==='partials')return spec.products.map((_,i)=>({label:'Part '+(i+1),hint:'Product'})).concat({label:'Total',hint:'Total'});
  return [{label:'Answer',hint:spec.hint||({number:'Number',money:'e.g. £2.50',fraction:'e.g. 2/3','fraction-form':'e.g. 2/3',mixed:'e.g. 1 2/3','clock-face':'e.g. 3:25','clock-24':'e.g. 15:25','clock-12':'e.g. 3:25 pm',set:'e.g. 1, 2, 4'}[spec.kind]||'Type your answer'),unit:spec.unit}];
}
function pupilReady(s){return s.spec.kind==='model'?(!s.spec.ready||!!s.spec.ready()):s.values.length>0&&s.values.every(v=>String(v).trim()!=='')}
function pupilResponseHtml(challenge,spec){
  if(!spec||challenge.mode!=='standard')return '';
  if(spec.kind==='discuss')return '<div class="gd-pupil-discuss">Discuss your reasoning, then reveal the model answer.</div>';
  let s=pupilStates.get(challenge);
  if(!s){s={values:[],status:'',correct:false,spec,challenge};pupilStates.set(challenge,s)}
  s.spec=spec;
  if(challenge.revealed){s.correct=false;s.status='Answer shown';}
  else if(s.status==='Answer shown'){s.status='';s.values=[]}
  if(s.correct&&spec.kind==='model'&&!pupilAnswerCorrect(spec,[],challenge.answer)){s.correct=false;s.status=''}
  pupilCurrent=s;
  let fields='';
  if(spec.kind==='choice'){
    fields='<div class="gd-pupil-choices" role="group" aria-label="Choose an answer">'+spec.choices.map(v=>'<button type="button" class="gd-btn" data-gd-pupil-choice="'+esc(v)+'" aria-pressed="'+(s.values[0]===v?'true':'false')+'"'+(s.correct||challenge.revealed?' disabled':'')+'>'+esc(v)+'</button>').join('')+'</div>';
  }else if(spec.kind==='model'){
    fields='<span class="gd-pupil-instruction">'+esc(spec.hint||'Change the model, then check your work.')+'</span>';
  }else{
    const defs=pupilFields(spec);
    s.values=defs.map((_,i)=>s.values[i]||'');
    fields=defs.map((f,i)=>'<label class="gd-pupil-field"><span>'+esc(f.label)+'</span><input type="text" '+(['number','unit','coordinate','metrics','partials','ordered-parts','quotient-remainder','money','fraction','fraction-form','mixed','clock-face','clock-24','clock-12','spoken','set','addition-equation','multiplication-equation','equation','expression','target-expression','fact','fact-family','multiplication'].includes(spec.kind)?'data-gd-keypad="'+esc(spec.kind)+'" inputmode="none"':'inputmode="text"')+' autocomplete="off" maxlength="240" data-gd-pupil-field="'+i+'" value="'+esc(s.values[i])+'" placeholder="'+esc(f.hint||'')+'"'+(s.correct||challenge.revealed?' disabled':'')+'>'+(f.unit?'<span>'+esc(f.unit)+'</span>':'')+'</label>').join('');
  }
  return '<div class="gd-pupil-response">'+fields+'<button type="button" class="gd-btn gd-btn--primary" data-gd-pupil-check'+(!pupilReady(s)||s.correct||challenge.revealed?' disabled':'')+'>Check</button><span role="status" aria-live="polite" class="gd-pupil-feedback'+(s.correct?' is-correct':s.status&&s.status!=='Answer shown'?' is-wrong':'')+'">'+esc(s.status)+'</span></div>';
}
function updatePupilUi(panel,s){
  const check=panel.querySelector('[data-gd-pupil-check]'),feedback=panel.querySelector('.gd-pupil-feedback');
  if(check)check.disabled=!pupilReady(s)||s.correct||s.challenge.revealed;
  if(feedback){feedback.textContent=s.status;feedback.classList.toggle('is-correct',s.correct);feedback.classList.toggle('is-wrong',!!s.status&&!s.correct&&s.status!=='Answer shown')}
  panel.querySelectorAll('[data-gd-pupil-field],[data-gd-pupil-choice]').forEach(el=>{
    el.disabled=s.correct||s.challenge.revealed;
    if(el.hasAttribute('data-gd-pupil-choice'))el.setAttribute('aria-pressed',String(el.dataset.gdPupilChoice===s.values[0]));
  });
  const reveal=panel.closest('.gd-challenge-banner')?.querySelector('[data-board-action="reveal"]');
  if(reveal)reveal.hidden=s.correct&&!s.spec.explain;
}
function refreshModelPupil(challenge){
  const s=challenge&&pupilStates.get(challenge);
  if(!s||s.spec?.kind!=='model')return;
  if(s.correct&&!s.spec.check?.()){s.correct=false;s.status=''}
  else if(!s.correct&&s.spec.ready&&!s.challenge.revealed)s.status='';
  if(typeof document!=='undefined'){const panel=document.querySelector('#gd-stage .gd-pupil-response');if(panel)updatePupilUi(panel,s)}
}
function checkPupil(panel,s){
  if(!pupilReady(s)||s.correct||s.challenge.revealed)return;
  const ok=pupilAnswerCorrect(s.spec,s.values,s.challenge.answer);
  s.correct=ok;
  s.status=ok?(s.spec.explain?'Correct choice. Now explain why.':'Correct ✓'):s.spec.kind==='ordered-parts'?(s.spec.parts.filter((part,i)=>Number.isFinite(numericAnswer(s.values[i]))&&Math.abs(numericAnswer(s.values[i])-Number(part.answer))<1e-8).length+' of '+s.spec.parts.length+' correct — check your working and try again.'):'Not quite — try again.';
  updatePupilUi(panel,s);
}
function pupilEvent(e){
  const panel=e.target?.closest?.('.gd-pupil-response'),s=pupilCurrent;
  if(!panel||!s||!panel.isConnected)return;
  const field=e.target.closest('[data-gd-pupil-field]'),choice=e.target.closest('[data-gd-pupil-choice]'),check=e.target.closest('[data-gd-pupil-check]');
  if(e.type==='input'&&field){s.values[Number(field.dataset.gdPupilField)]=field.value;s.status='';updatePupilUi(panel,s)}
  if(e.type==='click'&&choice&&!choice.disabled){e.preventDefault();e.stopPropagation();s.values=[choice.dataset.gdPupilChoice];s.status='';updatePupilUi(panel,s)}
  if((e.type==='click'&&check&&!check.disabled)||(e.type==='keydown'&&field&&e.key==='Enter')){e.preventDefault();e.stopPropagation();checkPupil(panel,s)}
}
if(typeof document!=='undefined'){
  ['input','click','keydown'].forEach(type=>document.addEventListener(type,pupilEvent,true));
  // Model tasks may remain editable. A new manipulation invalidates a previous
  // success rather than leaving a stale green status on a changed diagram.
  document.addEventListener('pointerdown',e=>{
    const s=pupilCurrent;if(!s?.correct||s.spec.kind!=='model'||e.target?.closest?.('.gd-challenge-banner'))return;
    const panel=document.querySelector('#gd-stage .gd-pupil-response');if(!panel)return;
    s.correct=false;s.status='';updatePupilUi(panel,s);
  },true);
}

function bannerHtml(challenge,opts={}){
  if(!challenge)return '';
  const ch=normalise(challenge);
  const label='Challenge';
  const pupil=pupilResponseHtml(challenge,opts.pupil);
  const pupilCorrect=!!(opts.pupil&&!opts.pupil.explain&&pupilStates.get(challenge)?.correct);
  const answerButton=ch.answer&&!opts.hideReveal
    ?`<button class="nl-challenge-reveal gd-challenge-reveal" type="button" data-board-action="reveal"${pupilCorrect?' hidden':''}>${ch.revealed?'Hide answer':'Reveal answer'}</button>`
    :'';
  const extraActions=Array.isArray(opts.actions)?opts.actions:[];
  const actionButtons=extraActions
    .filter(a=>a&&a.action&&a.label)
    .slice(0,3)
    .map(a=>({action:a.action,html:`<button class="gd-challenge-action" type="button" data-challenge-action="${esc(String(a.action).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,40))}">${esc(a.action==='another'?'Another':a.action==='end'?'Exit challenge':String(a.label).slice(0,60))}</button>`}));
  const regularActions=actionButtons.filter(a=>a.action!=='end').map(a=>a.html).join('');
  const exitActions=actionButtons.filter(a=>a.action==='end').map(a=>a.html).join('');
  return `<div class="nl-challenge-banner gd-challenge-banner" data-challenge-mode="${ch.mode}">
    <span class="gd-challenge-kicker">${esc(label)}</span>
    <div class="gd-challenge-copy">
      ${ch.title?`<h3>${esc(ch.title)}</h3>`:''}
      <div class="gd-challenge-prompt">${ch.promptHtml}</div>
    </div>
    <div class="gd-challenge-actions">
      ${ch.revealed&&ch.answer?`<em>Answer: ${esc(ch.answer)}</em>`:''}
      ${regularActions}
      ${answerButton}
      ${exitActions}
    </div>
    ${ch.revealed&&ch.solutionExplanation?`<div class="gd-pupil-instruction gd-challenge-explanation">${esc(String(ch.solutionExplanation).slice(0,600))}</div>`:'' }
    ${pupil}
  </div>`;
}

function applyFormat(editor,action){
  if(!editor)return;
  editor.focus();
  if(action==='bold')document.execCommand('bold',false);
  else if(action==='italic')document.execCommand('italic',false);
  else if(action==='size-small')document.execCommand('fontSize',false,'1');
  else if(action==='size-normal')document.execCommand('fontSize',false,'3');
  else if(action==='size-large')document.execCommand('fontSize',false,'5');
}

G.challengeKit={nativeScope:prefix=>{if(!launchingRandom||randomScope?.prefix!==prefix||!randomScope.native)return '';if(randomScope.scope==='all')return 'all';const row=document.querySelector('#gd-controls [data-gd-native-prefix="'+CSS.escape(prefix)+'"]');const group=JSON.parse(row?.dataset.gdNativeGroups||'[]')[Number(randomScope.scope)];return group?'category:'+group.id:''},refreshModelPupil,nativeRandomHtml,capturePupil,restorePupil,pupilSpec,pupilAnswerCorrect,pickVariant,simplePolygon,normalise,makeCustom,sanitiseRichHtml,plainText,toolbarHtml,tabsHtml,editorHtml,pickerHtml,bannerHtml,applyFormat};
})(window.TT99Goodies);
