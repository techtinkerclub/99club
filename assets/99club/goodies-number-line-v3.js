(function(G){
'use strict';
if(!G)return;
const {q,qa,clamp,num,esc,setPanels}=G;
const X=G.exportTools;
const COLOURS=['#147d75','#d65a4a','#4169a8','#d99024','#7b5fc5','#39945e','#a84f86','#52666d'];
const DEFAULT_LINE={
  id:'l1',label:'',showLabels:true,showConsecutiveDifferences:false,consecutiveSide:'above',
  markers:[
    {id:'m1',label:'A',value:3,color:'#147d75',showValue:true,side:'above'},
    {id:'m2',label:'B',value:8,color:'#d65a4a',showValue:true,side:'above'}
  ],
  relations:[
    {id:'r1',from:'m1',to:'m2',type:'difference',color:'#52666d',label:'',showLabel:true,side:'above'}
  ]
};
const DEFAULT_STATE={
  min:-10,max:20,step:1,labelEvery:1,showTickLabels:true,title:'',
  activeLineId:'l1',lines:[DEFAULT_LINE],challenge:null
};

function copy(v){return JSON.parse(JSON.stringify(v))}
function cleanNumber(v){return Math.abs(v)<1e-10?0:Number(Number(v).toFixed(8))}
function fmt(v){const n=cleanNumber(v);return Number.isInteger(n)?String(n):String(Number(n.toFixed(4)))}
function snap(v,state){
  const raw=state.min+Math.round((v-state.min)/state.step)*state.step;
  return cleanNumber(clamp(raw,state.min,state.max));
}
function nextId(prefix,items){
  let i=1;const used=new Set(items.map(x=>x.id));
  while(used.has(prefix+i))i++;
  return prefix+i;
}
function contrast(hex){
  const h=String(hex||'').replace('#','');
  if(!/^[0-9a-f]{6}$/i.test(h))return '#fff';
  const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
  return (r*299+g*587+b*114)/1000>150?'#24343b':'#fff';
}
function encodeState(state){
  const bytes=new TextEncoder().encode(JSON.stringify(state));
  let binary='';bytes.forEach(b=>binary+=String.fromCharCode(b));
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decodeState(raw){
  try{
    const normal=raw.replace(/-/g,'+').replace(/_/g,'/');
    const binary=atob(normal.padEnd(Math.ceil(normal.length/4)*4,'='));
    const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }catch(_){return null}
}
function normaliseLine(raw,state,index){
  const src=raw&&typeof raw==='object'?raw:{};
  const line={
    id:String(src.id||('l'+(index+1))).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,20)||('l'+(index+1)),
    label:String(src.label||'').slice(0,30),
    showLabels:src.showLabels!==false,
    showConsecutiveDifferences:!!src.showConsecutiveDifferences,
    consecutiveSide:src.consecutiveSide==='below'?'below':'above',
    markers:Array.isArray(src.markers)?src.markers.slice(0,12).map((m,i)=>(
      {
        id:String(m.id||('m'+(i+1))).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,20)||('m'+(i+1)),
        label:String(m.label||String.fromCharCode(65+i)).slice(0,12),
        value:snap(num(m.value,state.min),state),
        color:/^#[0-9a-f]{6}$/i.test(m.color||'')?m.color:COLOURS[i%COLOURS.length],
        showValue:m.showValue!==false,
        side:m.side==='below'?'below':'above'
      }
    )):[],
    relations:[]
  };
  const ids=new Set(line.markers.map(m=>m.id));
  line.relations=Array.isArray(src.relations)?src.relations.slice(0,16)
    .filter(r=>ids.has(r.from)&&ids.has(r.to)&&r.from!==r.to)
    .map((r,i)=>({
      id:String(r.id||('r'+(i+1))).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,20)||('r'+(i+1)),
      from:r.from,to:r.to,
      type:['difference','jump','interval'].includes(r.type)?r.type:'difference',
      color:/^#[0-9a-f]{6}$/i.test(r.color||'')?r.color:'#52666d',
      label:String(r.label||'').slice(0,24),
      showLabel:r.showLabel!==false,
      side:r.side==='below'?'below':'above'
    })):[];
  return line;
}
function normalise(input){
  const legacy=input&&Array.isArray(input.markers);
  const src={...copy(DEFAULT_STATE),...(input&&typeof input==='object'?input:{})};
  src.min=num(src.min,-10);src.max=num(src.max,20);
  if(src.max<=src.min)src.max=src.min+1;
  const range=src.max-src.min;
  src.step=Math.max(0.0001,Math.min(range,num(src.step,1)));
  src.labelEvery=clamp(Math.round(num(src.labelEvery,1)),1,50);
  src.showTickLabels=src.showTickLabels!==false;
  src.title=String(src.title||'').slice(0,90);
  let lineSource=Array.isArray(input?.lines)?input.lines:src.lines;
  if(legacy){
    lineSource=[{
      id:'l1',label:'',showLabels:true,
      showConsecutiveDifferences:!!input.showConsecutiveDifferences,consecutiveSide:'above',
      markers:input.markers,relations:Array.isArray(input.relations)?input.relations:[]
    }];
  }
  src.lines=(Array.isArray(lineSource)?lineSource:[]).slice(0,4).map((l,i)=>normaliseLine(l,src,i));
  if(!src.lines.length)src.lines=[normaliseLine(DEFAULT_LINE,src,0)];
  const lineIds=new Set(src.lines.map(l=>l.id));
  src.activeLineId=lineIds.has(src.activeLineId)?src.activeLineId:src.lines[0].id;
  if(src.challenge&&typeof src.challenge==='object'){
    src.challenge={
      type:String(src.challenge.type||''),
      prompt:String(src.challenge.prompt||'').slice(0,220),
      answer:String(src.challenge.answer||'').slice(0,220),
      revealed:!!src.challenge.revealed,
      hiddenTicks:Array.isArray(src.challenge.hiddenTicks)?src.challenge.hiddenTicks.map(Number).filter(Number.isFinite):[],
      hiddenMarkerIds:Array.isArray(src.challenge.hiddenMarkerIds)?src.challenge.hiddenMarkerIds.map(String):[],
      hiddenRelationIds:Array.isArray(src.challenge.hiddenRelationIds)?src.challenge.hiddenRelationIds.map(String):[]
    };
  }else src.challenge=null;
  return src;
}

function numberLineV2(){
  const supplied=decodeState(new URLSearchParams(location.search).get('nl')||'');
  let state=normalise(supplied||DEFAULT_STATE);
  let beforeChallenge=null;
  let drag=null;
  let statusTimer=null;
  const openGroups=new Set(['line','lines','markers','export']);

  setPanels('<div id="nl-controls"></div>','<div id="nl-stage-inner"></div>');
  const controls=q('#nl-controls'),stage=q('#gd-stage');

  function activeLine(){return state.lines.find(l=>l.id===state.activeLineId)||state.lines[0]}
  function message(text,bad=false){
    const box=q('#nl-status');if(!box)return;
    box.textContent=text||'';box.classList.toggle('is-error',!!bad);
    clearTimeout(statusTimer);
    if(text)statusTimer=setTimeout(()=>{if(box)box.textContent=''},3600);
  }
  function groupOpen(id){return openGroups.has(id)?' open':''}
  function bindGroupState(){
    qa('details[data-nl-group]',controls).forEach(d=>d.addEventListener('toggle',()=>{
      const id=d.dataset.nlGroup;if(!id)return;
      if(d.open)openGroups.add(id);else openGroups.delete(id);
    }));
  }
  function applyRangeFromControls(){
    const min=num(q('#nl-min')?.value,state.min),max=num(q('#nl-max')?.value,state.max);
    state.min=min;state.max=max<=min?min+Math.max(state.step,1):max;
    const range=state.max-state.min;
    state.step=Math.max(.0001,Math.min(range,num(q('#nl-step')?.value,state.step)));
    state.labelEvery=clamp(Math.round(num(q('#nl-label-every')?.value,state.labelEvery)),1,50);
    state.lines.forEach(line=>line.markers.forEach(m=>m.value=snap(m.value,state)));
  }
  function markerOptions(line,selected){
    return line.markers.map(m=>'<option value="'+esc(m.id)+'"'+(m.id===selected?' selected':'')+'>'+esc(m.label||m.id)+' · '+fmt(m.value)+'</option>').join('');
  }
  function controlsHtml(){
    const line=activeLine();
    const lineOptions=state.lines.map((l,i)=>'<option value="'+esc(l.id)+'"'+(l.id===state.activeLineId?' selected':'')+'>Line '+(i+1)+(l.label?' · '+esc(l.label):'')+'</option>').join('');
    const markerRows=line.markers.map(m=>`
      <div class="nl-marker-row" data-marker-row="${esc(m.id)}">
        <input class="nl-colour" type="color" value="${esc(m.color)}" data-marker-color="${esc(m.id)}" aria-label="Marker colour">
        <input class="gd-input nl-marker-label" value="${esc(m.label)}" maxlength="12" data-marker-label="${esc(m.id)}" aria-label="Marker label">
        <input class="gd-input nl-marker-value" type="number" step="${state.step}" min="${state.min}" max="${state.max}" value="${fmt(m.value)}" data-marker-value="${esc(m.id)}" aria-label="Marker value">
        <select class="gd-select nl-side" data-marker-side="${esc(m.id)}" aria-label="Marker position"><option value="above"${m.side==='above'?' selected':''}>Above</option><option value="below"${m.side==='below'?' selected':''}>Below</option></select>
        <label class="nl-mini-check"><input type="checkbox" data-marker-show="${esc(m.id)}"${m.showValue?' checked':''}> value</label>
        <button class="nl-icon-btn" type="button" data-marker-delete="${esc(m.id)}" aria-label="Delete marker">×</button>
      </div>`).join('');
    const relationRows=line.relations.map(r=>`
      <div class="nl-relation-row" data-relation-row="${esc(r.id)}">
        <select class="gd-select" data-relation-from="${esc(r.id)}">${markerOptions(line,r.from)}</select>
        <span>→</span>
        <select class="gd-select" data-relation-to="${esc(r.id)}">${markerOptions(line,r.to)}</select>
        <select class="gd-select" data-relation-type="${esc(r.id)}">
          <option value="difference"${r.type==='difference'?' selected':''}>Difference</option>
          <option value="jump"${r.type==='jump'?' selected':''}>Jump</option>
          <option value="interval"${r.type==='interval'?' selected':''}>Shade interval</option>
        </select>
        <select class="gd-select nl-side" data-relation-side="${esc(r.id)}" aria-label="Teaching visual position"><option value="above"${r.side==='above'?' selected':''}>Above</option><option value="below"${r.side==='below'?' selected':''}>Below</option></select>
        <input class="nl-colour" type="color" value="${esc(r.color)}" data-relation-color="${esc(r.id)}" aria-label="Relationship colour">
        <input class="gd-input" value="${esc(r.label)}" placeholder="auto label" maxlength="24" data-relation-label="${esc(r.id)}" aria-label="Custom relationship label">
        <label class="nl-mini-check"><input type="checkbox" data-relation-show="${esc(r.id)}"${r.showLabel?' checked':''}> label</label>
        <button class="nl-icon-btn" type="button" data-relation-delete="${esc(r.id)}" aria-label="Delete relationship">×</button>
      </div>`).join('');
    const challenge=state.challenge;
    return `
      <details class="nl-group" data-nl-group="line"${groupOpen('line')}>
        <summary>Number line</summary>
        <div class="nl-group-body">
          <div class="nl-two">
            <label class="gd-field"><span>Minimum</span><input class="gd-input" id="nl-min" type="number" value="${fmt(state.min)}"></label>
            <label class="gd-field"><span>Maximum</span><input class="gd-input" id="nl-max" type="number" value="${fmt(state.max)}"></label>
          </div>
          <div class="nl-two">
            <label class="gd-field"><span>Tick step</span><input class="gd-input" id="nl-step" type="number" min="0.0001" step="any" value="${fmt(state.step)}"></label>
            <label class="gd-field"><span>Label every</span><input class="gd-input" id="nl-label-every" type="number" min="1" max="50" value="${state.labelEvery}"></label>
          </div>
          <label class="gd-field"><span>Illustration title (optional)</span><input class="gd-input" id="nl-title" maxlength="90" value="${esc(state.title)}" placeholder="e.g. Finding the difference"></label>
          <label class="nl-check"><input id="nl-tick-labels" type="checkbox"${state.showTickLabels?' checked':''}> Show number labels</label>
          <div class="nl-preset-row">
            <button class="gd-btn" type="button" data-nl-preset="0-20">0–20</button>
            <button class="gd-btn" type="button" data-nl-preset="0-100">0–100</button>
            <button class="gd-btn" type="button" data-nl-preset="negative">−10–10</button>
            <button class="gd-btn" type="button" data-nl-preset="decimal">0–1 decimals</button>
          </div>
        </div>
      </details>

      <details class="nl-group" data-nl-group="lines"${groupOpen('lines')}>
        <summary>Comparison lines <span class="nl-count">${state.lines.length}</span></summary>
        <div class="nl-group-body">
          <label class="gd-field"><span>Editing</span><select class="gd-select" id="nl-active-line">${lineOptions}</select></label>
          <label class="gd-field"><span>Line label (optional)</span><input class="gd-input" id="nl-line-label" maxlength="30" value="${esc(line.label)}" placeholder="e.g. Fractions"></label>
          <label class="nl-check"><input id="nl-line-labels" type="checkbox"${line.showLabels?' checked':''}> Show number labels on this line</label>
          <div class="gd-row"><button class="gd-btn" id="nl-add-line" type="button"${state.lines.length>=4?' disabled':''}>+ Add comparison line</button>${state.lines.length>1?'<button class="gd-btn gd-btn--danger" id="nl-delete-line" type="button">Remove this line</button>':''}</div>
          <p class="gd-help">All lines share the same scale so values align vertically. Add up to four compact lines for comparisons.</p>
        </div>
      </details>

      <details class="nl-group" data-nl-group="markers"${groupOpen('markers')}>
        <summary>Markers <span class="nl-count">${line.markers.length}</span></summary>
        <div class="nl-group-body">
          <p class="gd-help">Markers share one compact level on each side. Put individual markers above or below the line as needed.</p>
          <div class="nl-marker-list">${markerRows||'<p class="gd-help">No markers yet.</p>'}</div>
          <button class="gd-btn" id="nl-add-marker" type="button">+ Add marker</button>
        </div>
      </details>

      <details class="nl-group" data-nl-group="visuals"${groupOpen('visuals')}>
        <summary>Teaching visuals <span class="nl-count">${line.relations.length}</span></summary>
        <div class="nl-group-body">
          <p class="gd-help">Differences and jumps are packed into the nearest free level. Jumps connect marker to marker instead of sitting on the number line.</p>
          <div class="nl-relation-list">${relationRows||'<p class="gd-help">Add at least two markers, then add a visual relationship.</p>'}</div>
          <button class="gd-btn" id="nl-add-relation" type="button"${line.markers.length<2?' disabled':''}>+ Add relationship</button>
          <label class="nl-check"><input id="nl-consecutive" type="checkbox"${line.showConsecutiveDifferences?' checked':''}> Show differences between consecutive markers</label>
          <label class="gd-field"><span>Consecutive differences position</span><select class="gd-select" id="nl-consecutive-side"><option value="above"${line.consecutiveSide==='above'?' selected':''}>Above</option><option value="below"${line.consecutiveSide==='below'?' selected':''}>Below</option></select></label>
        </div>
      </details>

      <details class="nl-group" data-nl-group="challenge"${groupOpen('challenge')||challenge?' open':''}>
        <summary>Challenge generator${challenge?' <span class="nl-live">active</span>':''}</summary>
        <div class="nl-group-body">
          <label class="gd-field"><span>Challenge type</span>
            <select class="gd-select" id="nl-challenge-type">
              <option value="identify">What number is marked?</option>
              <option value="difference">Find the difference</option>
              <option value="jump">Where do you land?</option>
              <option value="missing-labels">Fill missing labels</option>
            </select>
          </label>
          <div class="gd-row">
            <button class="gd-btn gd-btn--primary" id="nl-generate" type="button">Generate challenge</button>
            ${challenge?'<button class="gd-btn" id="nl-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button><button class="gd-btn" id="nl-clear-challenge" type="button">Back to my setup</button>':''}
          </div>
          ${challenge?`<label class="gd-field"><span>Question text</span><textarea class="gd-textarea" id="nl-prompt" rows="3">${esc(challenge.prompt)}</textarea></label>`:''}
          <p class="gd-help">Challenges use the current range and step, so you control the mathematical level without selecting a year group.</p>
        </div>
      </details>

      <details class="nl-group" data-nl-group="export"${groupOpen('export')}>
        <summary>Export & reuse</summary>
        <div class="nl-group-body">
          <div class="nl-export-grid">
            <button class="gd-btn" id="nl-copy-image" type="button">Copy image</button>
            <button class="gd-btn" id="nl-png" type="button">Download PNG</button>
            <button class="gd-btn" id="nl-svg-download" type="button">Download SVG</button>
            <button class="gd-btn" id="nl-print" type="button">Print / Save PDF</button>
            <button class="gd-btn" id="nl-copy-link" type="button">Copy setup link</button>
            <button class="gd-btn" id="nl-fullscreen" type="button">Board view</button>
          </div>
          <p class="gd-help">PNG is convenient for slides. SVG stays sharp at any size. Print opens a clean A4 version that can be saved as PDF.</p>
          <div class="nl-status" id="nl-status" role="status" aria-live="polite"></div>
        </div>
      </details>

      <button class="gd-btn gd-btn--danger" id="nl-reset" type="button">Reset number line</button>
    `;
  }

  function renderControls(){controls.innerHTML=controlsHtml();bindGroupState()}

  const X0=110,X1=940;
  function px(value){return X0+(value-state.min)/(state.max-state.min)*(X1-X0)}
  function valueFromClientX(clientX){
    const svg=q('#nl-svg');if(!svg)return state.min;
    const r=svg.getBoundingClientRect(),svgX=(clientX-r.left)/r.width*1000;
    const raw=state.min+(clamp(svgX,X0,X1)-X0)/(X1-X0)*(state.max-state.min);
    return snap(raw,state);
  }
  function hiddenTick(v){
    return !!(state.challenge&&!state.challenge.revealed&&state.challenge.hiddenTicks.some(x=>Math.abs(x-v)<state.step/1000));
  }
  function 