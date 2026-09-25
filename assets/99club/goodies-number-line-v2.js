(function(G){
'use strict';
if(!G)return;
const {q,qa,clamp,num,esc,setPanels}=G;
const X=G.exportTools;
const COLOURS=['#147d75','#d65a4a','#4169a8','#d99024','#7b5fc5','#39945e','#a84f86','#52666d'];
const DEFAULT_STATE={
  min:-10,max:20,step:1,labelEvery:1,showTickLabels:true,title:'',
  markers:[
    {id:'m1',label:'A',value:3,color:'#147d75',showValue:true},
    {id:'m2',label:'B',value:8,color:'#d65a4a',showValue:true}
  ],
  relations:[
    {id:'r1',from:'m1',to:'m2',type:'difference',color:'#52666d',label:'',showLabel:true}
  ],
  showConsecutiveDifferences:false,
  challenge:null
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
function normalise(input){
  const s={...copy(DEFAULT_STATE),...(input&&typeof input==='object'?input:{})};
  s.min=num(s.min,-10);s.max=num(s.max,20);
  if(s.max<=s.min)s.max=s.min+1;
  const range=s.max-s.min;
  s.step=Math.max(0.0001,Math.min(range,num(s.step,1)));
  s.labelEvery=clamp(Math.round(num(s.labelEvery,1)),1,50);
  s.showTickLabels=s.showTickLabels!==false;
  s.title=String(s.title||'').slice(0,90);
  s.markers=Array.isArray(s.markers)?s.markers.slice(0,12).map((m,i)=>({
    id:String(m.id||('m'+(i+1))).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,20)||('m'+(i+1)),
    label:String(m.label||String.fromCharCode(65+i)).slice(0,12),
    value:snap(num(m.value,s.min),s),
    color:/^#[0-9a-f]{6}$/i.test(m.color||'')?m.color:COLOURS[i%COLOURS.length],
    showValue:m.showValue!==false
  })):[];
  const markerIds=new Set(s.markers.map(m=>m.id));
  s.relations=Array.isArray(s.relations)?s.relations.slice(0,16).filter(r=>markerIds.has(r.from)&&markerIds.has(r.to)&&r.from!==r.to).map((r,i)=>({
    id:String(r.id||('r'+(i+1))).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,20)||('r'+(i+1)),
    from:r.from,to:r.to,
    type:['difference','jump','interval'].includes(r.type)?r.type:'difference',
    color:/^#[0-9a-f]{6}$/i.test(r.color||'')?r.color:'#52666d',
    label:String(r.label||'').slice(0,24),
    showLabel:r.showLabel!==false
  })):[];
  s.showConsecutiveDifferences=!!s.showConsecutiveDifferences;
  if(s.challenge&&typeof s.challenge==='object'){
    s.challenge={
      type:String(s.challenge.type||''),
      prompt:String(s.challenge.prompt||'').slice(0,220),
      answer:String(s.challenge.answer||'').slice(0,220),
      revealed:!!s.challenge.revealed,
      hiddenTicks:Array.isArray(s.challenge.hiddenTicks)?s.challenge.hiddenTicks.map(Number).filter(Number.isFinite):[],
      hiddenMarkerIds:Array.isArray(s.challenge.hiddenMarkerIds)?s.challenge.hiddenMarkerIds.map(String):[],
      hiddenRelationIds:Array.isArray(s.challenge.hiddenRelationIds)?s.challenge.hiddenRelationIds.map(String):[]
    };
  }else s.challenge=null;
  return s;
}

function numberLineV2(){
  const supplied=decodeState(new URLSearchParams(location.search).get('nl')||'');
  let state=normalise(supplied||DEFAULT_STATE);
  let beforeChallenge=null;
  let drag=null;
  let statusTimer=null;

  setPanels('<div id="nl-controls"></div>','<div id="nl-stage-inner"></div>');
  const controls=q('#nl-controls'),stage=q('#gd-stage');

  function message(text,bad=false){
    let box=q('#nl-status');
    if(!box)return;
    box.textContent=text||'';
    box.classList.toggle('is-error',!!bad);
    clearTimeout(statusTimer);
    if(text)statusTimer=setTimeout(()=>{if(box)box.textContent=''},3600);
  }
  function applyRangeFromControls(){
    const min=num(q('#nl-min')?.value,state.min),max=num(q('#nl-max')?.value,state.max);
    state.min=min;state.max=max<=min?min+Math.max(state.step,1):max;
    const range=state.max-state.min;
    state.step=Math.max(.0001,Math.min(range,num(q('#nl-step')?.value,state.step)));
    state.labelEvery=clamp(Math.round(num(q('#nl-label-every')?.value,state.labelEvery)),1,50);
    state.markers.forEach(m=>m.value=snap(m.value,state));
  }
  function markerOptions(selected){
    return state.markers.map(m=>'<option value="'+esc(m.id)+'"'+(m.id===selected?' selected':'')+'>'+esc(m.label||m.id)+' · '+fmt(m.value)+'</option>').join('');
  }
  function controlsHtml(){
    const markerRows=state.markers.map((m,i)=>`
      <div class="nl-marker-row" data-marker-row="${esc(m.id)}">
        <input class="nl-colour" type="color" value="${esc(m.color)}" data-marker-color="${esc(m.id)}" aria-label="Marker colour">
        <input class="gd-input nl-marker-label" value="${esc(m.label)}" maxlength="12" data-marker-label="${esc(m.id)}" aria-label="Marker label">
        <input class="gd-input nl-marker-value" type="number" step="${state.step}" min="${state.min}" max="${state.max}" value="${fmt(m.value)}" data-marker-value="${esc(m.id)}" aria-label="Marker value">
        <label class="nl-mini-check"><input type="checkbox" data-marker-show="${esc(m.id)}"${m.showValue?' checked':''}> value</label>
        <button class="nl-icon-btn" type="button" data-marker-delete="${esc(m.id)}" aria-label="Delete marker">×</button>
      </div>`).join('');
    const relationRows=state.relations.map(r=>`
      <div class="nl-relation-row" data-relation-row="${esc(r.id)}">
        <select class="gd-select" data-relation-from="${esc(r.id)}">${markerOptions(r.from)}</select>
        <span>→</span>
        <select class="gd-select" data-relation-to="${esc(r.id)}">${markerOptions(r.to)}</select>
        <select class="gd-select" data-relation-type="${esc(r.id)}">
          <option value="difference"${r.type==='difference'?' selected':''}>Difference</option>
          <option value="jump"${r.type==='jump'?' selected':''}>Jump</option>
          <option value="interval"${r.type==='interval'?' selected':''}>Shade interval</option>
        </select>
        <input class="nl-colour" type="color" value="${esc(r.color)}" data-relation-color="${esc(r.id)}" aria-label="Relationship colour">
        <input class="gd-input" value="${esc(r.label)}" placeholder="auto label" maxlength="24" data-relation-label="${esc(r.id)}" aria-label="Custom relationship label">
        <label class="nl-mini-check"><input type="checkbox" data-relation-show="${esc(r.id)}"${r.showLabel?' checked':''}> label</label>
        <button class="nl-icon-btn" type="button" data-relation-delete="${esc(r.id)}" aria-label="Delete relationship">×</button>
      </div>`).join('');
    const challenge=state.challenge;
    return `
      <details class="nl-group" open>
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

      <details class="nl-group" open>
        <summary>Markers <span class="nl-count">${state.markers.length}</span></summary>
        <div class="nl-group-body">
          <p class="gd-help">Drag markers on the line, or type exact values here. Each marker can have its own label and colour.</p>
          <div class="nl-marker-list">${markerRows||'<p class="gd-help">No markers yet.</p>'}</div>
          <button class="gd-btn" id="nl-add-marker" type="button">+ Add marker</button>
        </div>
      </details>

      <details class="nl-group">
        <summary>Teaching visuals <span class="nl-count">${state.relations.length}</span></summary>
        <div class="nl-group-body">
          <p class="gd-help">Show a difference, a jump, or shade the interval between any two markers.</p>
          <div class="nl-relation-list">${relationRows||'<p class="gd-help">Add at least two markers, then add a visual relationship.</p>'}</div>
          <button class="gd-btn" id="nl-add-relation" type="button"${state.markers.length<2?' disabled':''}>+ Add relationship</button>
          <label class="nl-check"><input id="nl-consecutive" type="checkbox"${state.showConsecutiveDifferences?' checked':''}> Show differences between consecutive markers</label>
        </div>
      </details>

      <details class="nl-group"${challenge?' open':''}>
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

      <details class="nl-group" open>
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

  function renderControls(){
    controls.innerHTML=controlsHtml();
  }

  function px(value){return 70+(value-state.min)/(state.max-state.min)*860}
  function valueFromClientX(clientX){
    const svg=q('#nl-svg');
    if(!svg)return state.min;
    const r=svg.getBoundingClientRect();
    const svgX=(clientX-r.left)/r.width*1000;
    const raw=state.min+(clamp(svgX,70,930)-70)/860*(state.max-state.min);
    return snap(raw,state);
  }
  function relationDisplay(r){
    const a=state.markers.find(m=>m.id===r.from),b=state.markers.find(m=>m.id===r.to);
    if(!a||!b)return null;
    const delta=cleanNumber(b.value-a.value);
    const auto=r.type==='jump'?(delta>=0?'+':'')+fmt(delta):r.type==='difference'?fmt(Math.abs(delta)):'';
    const hidden=state.challenge&&!state.challenge.revealed&&state.challenge.hiddenRelationIds.includes(r.id);
    return {a,b,label:hidden?'?':(r.label||auto),show:r.showLabel};
  }
  function markerLanes(){
    const sorted=[...state.markers].sort((a,b)=>px(a.value)-px(b.value));
    const ends=[-Infinity,-Infinity,-Infinity,-Infinity];
    const lanes={};
    sorted.forEach(m=>{
      const x=px(m.value);let lane=ends.findIndex(e=>x-e>=62);
      if(lane<0)lane=sorted.indexOf(m)%4;
      lanes[m.id]=lane;ends[lane]=x;
    });
    return lanes;
  }
  function hiddenTick(v){
    return !!(state.challenge&&!state.challenge.revealed&&state.challenge.hiddenTicks.some(x=>Math.abs(x-v)<state.step/1000));
  }
  function buildSvg(){
    const range=state.max-state.min;
    const rawCount=Math.floor(range/state.step+1e-8);
    const stride=Math.max(1,Math.ceil(rawCount/160));
    const renderStep=state.step*stride;
    const tickCount=Math.floor(range/renderStep+1e-8);
    const baseY=220;
    const lanes=markerLanes();
    let defs='<defs>';
    state.relations.filter(r=>r.type==='jump').forEach(r=>{
      defs+=`<marker id="nl-arrow-${esc(r.id)}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" fill="${esc(r.color)}"/></marker>`;
    });
    defs+='</defs>';

    let background='<rect x="0" y="0" width="1000" height="430" rx="18" fill="#ffffff"/>';
    let title=state.title?`<text x="500" y="34" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="700" fill="#24343b">${esc(state.title)}</text>`:'';

    let intervalLayer='';
    state.relations.filter(r=>r.type==='interval').forEach(r=>{
      const d=relationDisplay(r);if(!d)return;
      const x1=px(d.a.value),x2=px(d.b.value),left=Math.min(x1,x2),w=Math.abs(x2-x1);
      intervalLayer+=`<rect x="${left}" y="${baseY-18}" width="${w}" height="36" rx="9" fill="${esc(r.color)}" opacity=".16"/>`;
      if(d.show&&d.label)intervalLayer+=`<text x="${(x1+x2)/2}" y="${baseY-28}" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="${esc(r.color)}">${esc(d.label)}</text>`;
    });

    let ticks='';
    for(let i=0;i<=tickCount;i++){
      const v=cleanNumber(state.min+i*renderStep),x=px(v);
      const major=(i%state.labelEvery===0)||i===0||i===tickCount;
      ticks+=`<line x1="${x}" y1="${baseY-(major?13:8)}" x2="${x}" y2="${baseY+(major?13:8)}" stroke="#33474e" stroke-width="${major?2:1}"/>`;
      if(state.showTickLabels&&major&&!hiddenTick(v)){
        ticks+=`<text x="${x}" y="${baseY+38}" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="#33474e">${esc(fmt(v))}</text>`;
      }
    }
    const line=`<line x1="70" y1="${baseY}" x2="930" y2="${baseY}" stroke="#24343b" stroke-width="4" stroke-linecap="round"/><path d="M70 ${baseY} l12 -7 v14 z" fill="#24343b"/><path d="M930 ${baseY} l-12 -7 v14 z" fill="#24343b"/>`;

    let relationshipLayer='';
    let relationLane=0;
    state.relations.filter(r=>r.type!=='interval').forEach(r=>{
      const d=relationDisplay(r);if(!d)return;
      const x1=px(d.a.value),x2=px(d.b.value),left=Math.min(x1,x2),right=Math.max(x1,x2),mid=(x1+x2)/2;
      if(r.type==='difference'){
        const y=82+(relationLane%4)*27;relationLane++;
        relationshipLayer+=`<path d="M${left} ${y+9} V${y} H${right} V${y+9}" fill="none" stroke="${esc(r.color)}" stroke-width="2.5" stroke-linecap="round"/>`;
        if(d.show&&d.label)relationshipLayer+=`<rect x="${mid-30}" y="${y-16}" width="60" height="22" rx="11" fill="#fff"/><text x="${mid}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="${esc(r.color)}">${esc(d.label)}</text>`;
      }else{
        const peak=142-(relationLane%3)*30;relationLane++;
        relationshipLayer+=`<path d="M${x1} ${baseY-8} Q${mid} ${peak} ${x2} ${baseY-8}" fill="none" stroke="${esc(r.color)}" stroke-width="3" stroke-linecap="round" marker-end="url(#nl-arrow-${esc(r.id)})"/>`;
        if(d.show&&d.label)relationshipLayer+=`<rect x="${mid-30}" y="${peak-14}" width="60" height="22" rx="11" fill="#fff"/><text x="${mid}" y="${peak+2}" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="${esc(r.color)}">${esc(d.label)}</text>`;
      }
    });

    if(state.showConsecutiveDifferences&&state.markers.length>1){
      const sorted=[...state.markers].sort((a,b)=>a.value-b.value);
      sorted.slice(0,-1).forEach((m,i)=>{
        const n=sorted[i+1],x1=px(m.value),x2=px(n.value),mid=(x1+x2)/2,y=174-(i%2)*24;
        relationshipLayer+=`<path d="M${x1} ${y+7} V${y} H${x2} V${y+7}" fill="none" stroke="#71858b" stroke-width="1.8"/><rect x="${mid-24}" y="${y-15}" width="48" height="20" rx="10" fill="#fff"/><text x="${mid}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#52666d">${esc(fmt(Math.abs(n.value-m.value)))}</text>`;
      });
    }

    let markerLayer='';
    state.markers.forEach((m,i)=>{
      const x=px(m.value),lane=lanes[m.id]||0,cy=292+lane*34;
      const hidden=state.challenge&&!state.challenge.revealed&&state.challenge.hiddenMarkerIds.includes(m.id);
      const showValue=m.showValue&&!hidden;
      markerLayer+=`<g class="nl-svg-marker" data-marker-hit="${esc(m.id)}" style="cursor:ew-resize;touch-action:none"><line x1="${x}" y1="${baseY+4}" x2="${x}" y2="${cy-17}" stroke="${esc(m.color)}" stroke-width="2.5"/><circle cx="${x}" cy="${cy}" r="17" fill="${esc(m.color)}" stroke="#fff" stroke-width="3"/><circle cx="${x}" cy="${cy}" r="22" fill="transparent"/><text x="${x}" y="${cy+5}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="800" fill="${contrast(m.color)}" pointer-events="none">${esc(m.label||String(i+1))}</text>${showValue?`<text x="${x}" y="${cy+35}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#33474e" pointer-events="none">${esc(fmt(m.value))}</text>`:''}</g>`;
    });

    return `<svg id="nl-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 430" role="img" aria-label="Interactive number line from ${esc(fmt(state.min))} to ${esc(fmt(state.max))}">${defs}${background}${title}${intervalLayer}${relationshipLayer}${line}${ticks}${markerLayer}<text x="500" y="414" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#87969a">99 Club Studio</text></svg>`;
  }

  function renderStage(){
    const c=state.challenge;
    const prompt=c?`<div class="nl-challenge-banner"><span>Challenge</span><strong>${esc(c.prompt)}</strong>${c.revealed?`<em>Answer: ${esc(c.answer)}</em>`:''}</div>`:'';
    q('#gd-stage').innerHTML=`<div class="nl-stage-wrap">${prompt}<div class="nl-export-frame">${buildSvg()}</div><p class="nl-drag-help">Drag a marker along the line to move it. Values snap to the chosen tick step.</p></div>`;
    bindMarkerDragging();
  }

  function renderAll(){
    state=normalise(state);
    renderControls();
    renderStage();
  }

  function bindMarkerDragging(){
    qa('[data-marker-hit]',stage).forEach(el=>{
      el.addEventListener('pointerdown',e=>{
        const id=el.getAttribute('data-marker-hit');
        if(!state.markers.some(m=>m.id===id))return;
        drag={id};
        e.preventDefault();
      });
    });
  }
  function moveDrag(e){
    if(!drag)return;
    const m=state.markers.find(x=>x.id===drag.id);if(!m)return;
    m.value=valueFromClientX(e.clientX);
    const input=controls.querySelector('[data-marker-value="'+CSS.escape(m.id)+'"]');
    if(input)input.value=fmt(m.value);
    renderStage();
  }
  function endDrag(){drag=null}
  window.addEventListener('pointermove',moveDrag);
  window.addEventListener('pointerup',endDrag);
  window.addEventListener('pointercancel',endDrag);

  function addMarker(value){
    const id=nextId('m',state.markers),index=state.markers.length;
    state.markers.push({id,label:String.fromCharCode(65+(index%26)),value:snap(value==null?(state.min+state.max)/2:value,state),color:COLOURS[index%COLOURS.length],showValue:true});
    renderAll();
  }
  function addRelation(){
    if(state.markers.length<2)return;
    const id=nextId('r',state.relations);
    state.relations.push({id,from:state.markers[0].id,to:state.markers[1].id,type:'difference',color:'#52666d',label:'',showLabel:true});
    renderAll();
  }
  function randomTick(){
    const count=Math.max(1,Math.floor((state.max-state.min)/state.step+1e-8));
    return snap(state.min+Math.floor(Math.random()*(count+1))*state.step,state);
  }
  function randomDistinct(a){
    let b=randomTick(),guard=0;
    while(Math.abs(b-a)<state.step/1000&&guard++<40)b=randomTick();
    return b;
  }
  function generateChallenge(type){
    if(!beforeChallenge)beforeChallenge=copy({...state,challenge:null});
    else state=normalise(copy(beforeChallenge));
    const a=randomTick(),b=randomDistinct(a);
    const lo=Math.min(a,b),hi=Math.max(a,b);
    if(type==='identify'){
      state.markers=[{id:'m1',label:'A',value:a,color:'#147d75',showValue:true}];
      state.relations=[];
      state.challenge={type,prompt:'What number is marker A pointing to?',answer:fmt(a),revealed:false,hiddenTicks:[],hiddenMarkerIds:['m1'],hiddenRelationIds:[]};
    }else if(type==='difference'){
      state.markers=[
        {id:'m1',label:'A',value:lo,color:'#147d75',showValue:true},
        {id:'m2',label:'B',value:hi,color:'#d65a4a',showValue:true}
      ];
      state.relations=[{id:'r1',from:'m1',to:'m2',type:'difference',color:'#52666d',label:'',showLabel:true}];
      state.challenge={type,prompt:'What is the difference between A and B?',answer:fmt(cleanNumber(hi-lo)),revealed:false,hiddenTicks:[],hiddenMarkerIds:[],hiddenRelationIds:['r1']};
    }else if(type==='jump'){
      let start=a,end=b;
      if(Math.abs(end-start)<state.step/1000)end=snap(start+state.step,state);
      const delta=cleanNumber(end-start);
      state.markers=[
        {id:'m1',label:'Start',value:start,color:'#147d75',showValue:true},
        {id:'m2',label:'?',value:end,color:'#d65a4a',showValue:true}
      ];
      state.relations=[{id:'r1',from:'m1',to:'m2',type:'jump',color:'#4169a8',label:(delta>=0?'+':'')+fmt(delta),showLabel:true}];
      state.challenge={type,prompt:'Start at '+fmt(start)+' and make the shown jump. Where do you land?',answer:fmt(end),revealed:false,hiddenTicks:[],hiddenMarkerIds:['m2'],hiddenRelationIds:[]};
    }else{
      state.markers=[];
      state.relations=[];
      const count=Math.max(2,Math.floor((state.max-state.min)/state.step+1e-8));
      const candidates=[];
      for(let i=1;i<count;i++)if(i%state.labelEvery===0)candidates.push(cleanNumber(state.min+i*state.step));
      const shuffled=candidates.sort(()=>Math.random()-.5).slice(0,Math.min(5,Math.max(2,Math.floor(candidates.length/3))));
      state.challenge={type:'missing-labels',prompt:'Fill in the missing number labels on the line.',answer:shuffled.sort((x,y)=>x-y).map(fmt).join(', '),revealed:false,hiddenTicks:shuffled,hiddenMarkerIds:[],hiddenRelationIds:[]};
    }
    state=normalise(state);renderAll();
  }
  function applyPreset(name){
    beforeChallenge=null;state.challenge=null;
    if(name==='0-20'){state.min=0;state.max=20;state.step=1;state.labelEvery=1}
    if(name==='0-100'){state.min=0;state.max=100;state.step=10;state.labelEvery=1}
    if(name==='negative'){state.min=-10;state.max=10;state.step=1;state.labelEvery=1}
    if(name==='decimal'){state.min=0;state.max=1;state.step=.1;state.labelEvery=1}
    state.markers.forEach(m=>m.value=snap(m.value,state));
    renderAll();
  }
  function exportName(){
    return state.title||('number-line-'+fmt(state.min)+'-to-'+fmt(state.max));
  }
  function svg(){return q('#nl-svg')}
  async function exportAction(kind){
    try{
      if(!X)throw new Error('Export tools are not available.');
      if(kind==='copy'){await X.copyPng(svg());message('Image copied — paste it into your slide or document.')}
      if(kind==='png'){await X.downloadPng(svg(),exportName(),2);message('PNG downloaded.')}
      if(kind==='svg'){X.downloadSvg(svg(),exportName());message('SVG downloaded.')}
      if(kind==='print'){X.printSvg(svg(),{title:state.title||'Number line',prompt:state.challenge?.prompt||'',answer:state.challenge?.answer||'',showAnswer:!!state.challenge?.revealed,landscape:true});message('Print view opened. Choose “Save as PDF” in the print dialog.')}
      if(kind==='link'){
        const u=new URL(location.href);u.searchParams.set('nl',encodeState(state));u.hash='number-line';
        await X.copyText(u.toString());message('Setup link copied. It will reopen this number line exactly as shown.');
      }
    }catch(err){message(err?.message||'That export did not work.',true)}
  }

  controls.addEventListener('input',e=>{
    const t=e.target;
    if(['nl-min','nl-max','nl-step','nl-label-every'].includes(t.id)){applyRangeFromControls();renderStage();return}
    if(t.id==='nl-title'){state.title=t.value.slice(0,90);renderStage();return}
    if(t.id==='nl-tick-labels'){state.showTickLabels=t.checked;renderStage();return}
    if(t.id==='nl-consecutive'){state.showConsecutiveDifferences=t.checked;renderStage();return}
    if(t.id==='nl-prompt'&&state.challenge){state.challenge.prompt=t.value.slice(0,220);renderStage();return}
    let id=t.dataset.markerLabel;if(id){const m=state.markers.find(x=>x.id===id);if(m){m.label=t.value.slice(0,12);renderStage()}return}
    id=t.dataset.markerValue;if(id){const m=state.markers.find(x=>x.id===id);if(m){m.value=snap(num(t.value,m.value),state);renderStage()}return}
    id=t.dataset.markerColor;if(id){const m=state.markers.find(x=>x.id===id);if(m){m.color=t.value;renderStage()}return}
    id=t.dataset.markerShow;if(id){const m=state.markers.find(x=>x.id===id);if(m){m.showValue=t.checked;renderStage()}return}
    id=t.dataset.relationFrom;if(id){const r=state.relations.find(x=>x.id===id);if(r){r.from=t.value;if(r.from===r.to){const other=state.markers.find(m=>m.id!==r.from);if(other)r.to=other.id}renderAll()}return}
    id=t.dataset.relationTo;if(id){const r=state.relations.find(x=>x.id===id);if(r){r.to=t.value;if(r.from===r.to){const other=state.markers.find(m=>m.id!==r.to);if(other)r.from=other.id}renderAll()}return}
    id=t.dataset.relationType;if(id){const r=state.relations.find(x=>x.id===id);if(r){r.type=t.value;renderStage()}return}
    id=t.dataset.relationColor;if(id){const r=state.relations.find(x=>x.id===id);if(r){r.color=t.value;renderStage()}return}
    id=t.dataset.relationLabel;if(id){const r=state.relations.find(x=>x.id===id);if(r){r.label=t.value.slice(0,24);renderStage()}return}
    id=t.dataset.relationShow;if(id){const r=state.relations.find(x=>x.id===id);if(r){r.showLabel=t.checked;renderStage()}return}
  });

  controls.addEventListener('change',e=>{
    const t=e.target;
    if(['nl-min','nl-max','nl-step','nl-label-every'].includes(t.id)){state=normalise(state);renderAll()}
  });

  controls.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.nlPreset){applyPreset(b.dataset.nlPreset);return}
    if(b.id==='nl-add-marker'){addMarker();return}
    if(b.id==='nl-add-relation'){addRelation();return}
    if(b.dataset.markerDelete){state.markers=state.markers.filter(m=>m.id!==b.dataset.markerDelete);state.relations=state.relations.filter(r=>r.from!==b.dataset.markerDelete&&r.to!==b.dataset.markerDelete);renderAll();return}
    if(b.dataset.relationDelete){state.relations=state.relations.filter(r=>r.id!==b.dataset.relationDelete);renderAll();return}
    if(b.id==='nl-generate'){generateChallenge(q('#nl-challenge-type').value);return}
    if(b.id==='nl-reveal'&&state.challenge){state.challenge.revealed=!state.challenge.revealed;renderAll();return}
    if(b.id==='nl-clear-challenge'){if(beforeChallenge)state=normalise(copy(beforeChallenge));beforeChallenge=null;renderAll();return}
    if(b.id==='nl-copy-image'){exportAction('copy');return}
    if(b.id==='nl-png'){exportAction('png');return}
    if(b.id==='nl-svg-download'){exportAction('svg');return}
    if(b.id==='nl-print'){exportAction('print');return}
    if(b.id==='nl-copy-link'){exportAction('link');return}
    if(b.id==='nl-fullscreen'){const target=q('#gd-stage');if(target?.requestFullscreen)target.requestFullscreen().catch(()=>message('Full-screen mode is not available here.',true));return}
    if(b.id==='nl-reset'){beforeChallenge=null;state=normalise(DEFAULT_STATE);renderAll();return}
  });

  renderAll();
}

G.numberLine=numberLineV2;
})(window.TT99Goodies);
