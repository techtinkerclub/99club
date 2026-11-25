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
  return `<div class="gd-challenge-picker">
    <div class="gd-challenge-chips" role="tablist" aria-label="Challenge categories">${cats}</div>
    <div class="gd-challenge-cards">${cards||'<p class="gd-help">No challenge types in this category yet.</p>'}</div>
  </div>`;
}


const pupilStates=new WeakMap();
let pupilCurrent=null;
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
    case 'choice':return cleanAnswer(a)===cleanAnswer(spec.expected??b);
    case 'number':return equal(numericAnswer(a),numericAnswer(b));
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
    case 'set':{
      const parse=v=>cleanAnswer(v).split(/[,;\s]+/).filter(Boolean).map(numericAnswer).sort((x,y)=>x-y);
      const x=parse(a),y=parse(b);
      return x.length===y.length&&x.every((v,i)=>equal(v,y[i]));
    }
    case 'clock-face':{
      const x=timeAnswer(a),y=timeAnswer(b);
      return !!x&&!!y&&x.h%12===y.h%12&&x.m===y.m&&(!x.period||x.h===y.h);
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
function pupilFields(spec){
  if(spec.kind==='coordinate')return [{label:'x',hint:'x'},{label:'y',hint:'y'}];
  if(spec.kind==='metrics')return [{label:'Perimeter',hint:'units'},{label:'Area',hint:'square units'}];
  return [{label:'Answer',hint:spec.hint||({number:'Number',money:'e.g. £2.50',fraction:'e.g. 2/3','fraction-form':'e.g. 2/3',mixed:'e.g. 1 2/3','clock-face':'e.g. 3:25','clock-24':'e.g. 15:25','clock-12':'e.g. 3:25 pm',set:'e.g. 1, 2, 4'}[spec.kind]||'Type your answer'),unit:spec.unit}];
}
function pupilReady(s){return s.spec.kind==='model'||s.values.length>0&&s.values.every(v=>String(v).trim()!=='')}
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
    fields=defs.map((f,i)=>'<label class="gd-pupil-field"><span>'+esc(f.label)+'</span><input type="text" inputmode="'+(['number','unit','coordinate','metrics'].includes(spec.kind)?'decimal':'text')+'" autocomplete="off" maxlength="240" data-gd-pupil-field="'+i+'" value="'+esc(s.values[i])+'" placeholder="'+esc(f.hint||'')+'"'+(s.correct||challenge.revealed?' disabled':'')+'>'+(f.unit?'<span>'+esc(f.unit)+'</span>':'')+'</label>').join('');
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
  if(reveal)reveal.hidden=s.correct;
}
function checkPupil(panel,s){
  if(!pupilReady(s)||s.correct||s.challenge.revealed)return;
  const ok=pupilAnswerCorrect(s.spec,s.values,s.challenge.answer);
  s.correct=ok;
  s.status=ok?(s.spec.explain?'Correct choice. Explain why: '+s.challenge.answer:'Correct ✓'):'Not quite — try again.';
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
  const label=opts.label||'Challenge';
  const pupil=pupilResponseHtml(challenge,opts.pupil);
  const pupilCorrect=!!(opts.pupil&&pupilStates.get(challenge)?.correct);
  const answerButton=ch.answer&&!opts.hideReveal
    ?`<button class="nl-challenge-reveal gd-challenge-reveal" type="button" data-board-action="reveal"${pupilCorrect?' hidden':''}>${ch.revealed?'Hide answer':'Reveal answer'}</button>`
    :'';
  const extraActions=Array.isArray(opts.actions)?opts.actions:[];
  const actionButtons=extraActions
    .filter(a=>a&&a.action&&a.label)
    .slice(0,3)
    .map(a=>`<button class="gd-challenge-action" type="button" data-challenge-action="${esc(String(a.action).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,40))}">${esc(String(a.label).slice(0,60))}</button>`)
    .join('');
  return `<div class="nl-challenge-banner gd-challenge-banner" data-challenge-mode="${ch.mode}">
    <span class="gd-challenge-kicker">${esc(label)}</span>
    <div class="gd-challenge-copy">
      ${ch.title?`<h3>${esc(ch.title)}</h3>`:''}
      <div class="gd-challenge-prompt">${ch.promptHtml}</div>
    </div>
    <div class="gd-challenge-actions">
      ${ch.revealed&&ch.answer?`<em>Answer: ${esc(ch.answer)}</em>`:''}
      ${actionButtons}
      ${answerButton}
    </div>
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

G.challengeKit={pupilSpec,pupilAnswerCorrect,normalise,makeCustom,sanitiseRichHtml,plainText,toolbarHtml,tabsHtml,editorHtml,pickerHtml,bannerHtml,applyFormat};
})(window.TT99Goodies);
