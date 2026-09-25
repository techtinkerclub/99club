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

function bannerHtml(challenge,opts={}){
  if(!challenge)return '';
  const ch=normalise(challenge);
  const label=opts.label||'Challenge';
  const answerButton=ch.answer
    ?`<button class="nl-challenge-reveal gd-challenge-reveal" type="button" data-board-action="reveal">${ch.revealed?'Hide answer':'Reveal answer'}</button>`
    :'';
  return `<div class="nl-challenge-banner gd-challenge-banner" data-challenge-mode="${ch.mode}">
    <span class="gd-challenge-kicker">${esc(label)}</span>
    <div class="gd-challenge-copy">
      ${ch.title?`<h3>${esc(ch.title)}</h3>`:''}
      <div class="gd-challenge-prompt">${ch.promptHtml}</div>
    </div>
    <div class="gd-challenge-actions">
      ${ch.revealed&&ch.answer?`<em>Answer: ${esc(ch.answer)}</em>`:''}
      ${answerButton}
    </div>
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

G.challengeKit={normalise,makeCustom,sanitiseRichHtml,plainText,toolbarHtml,editorHtml,pickerHtml,bannerHtml,applyFormat};
})(window.TT99Goodies);
