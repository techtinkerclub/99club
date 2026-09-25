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
  let boardMenuOpen=false,boardMoreOpen=false,boardChallengeOpen=false,boardLocked=false;
  let boardMode=null,boardRelationType='difference',boardFirstMarker=null,boardNotice='';
  let boardNoticeTimer=null;
  const undoStack=[],redoStack=[];
  const openGroups=new Set(['line','lines','markers','export']);

  setPanels('<div id="nl-controls"></div>','<div id="nl-stage-inner"></div>');
  const controls=q('#nl-controls'),stage=q('#gd-stage');

  function activeLine(){return state.lines.find(l=>l.id===state.activeLineId)||state.lines[0]}
  function snapshot(){return copy(state)}
  function remember(){
    undoStack.push(snapshot());
    if(undoStack.length>40)undoStack.shift();
    redoStack.length=0;
  }
  function undo(){
    if(!undoStack.length)return;
    redoStack.push(snapshot());
    state=normalise(undoStack.pop());
    beforeChallenge=null;
    boardMode=null;boardFirstMarker=null;
    renderAll();
  }
  function redo(){
    if(!redoStack.length)return;
    undoStack.push(snapshot());
    state=normalise(redoStack.pop());
    beforeChallenge=null;
    boardMode=null;boardFirstMarker=null;
    renderAll();
  }
  function boardMessage(text){
    boardNotice=text||'';
    clearTimeout(boardNoticeTimer);
    renderStage();
    if(text)boardNoticeTimer=setTimeout(()=>{boardNotice='';renderStage()},2400);
  }
  function updateChallengeAnswer(){
    const ch=state.challenge;if(!ch)return;
    const line=state.lines[0];if(!line)return;
    if(ch.type==='identify'){
      const id=ch.hiddenMarkerIds[0],m=line.markers.find(x=>x.id===id);
      if(m)ch.answer=fmt(m.value);
    }else if(ch.type==='difference'){
      const id=ch.hiddenRelationIds[0],r=line.relations.find(x=>x.id===id);
      if(r){const a=line.markers.find(x=>x.id===r.from),b=line.markers.find(x=>x.id===r.to);if(a&&b)ch.answer=fmt(Math.abs(cleanNumber(b.value-a.value)))}
    }else if(ch.type==='jump'){
      const id=ch.hiddenMarkerIds[0],m=line.markers.find(x=>x.id===id);
      if(m)ch.answer=fmt(m.value);
    }
  }
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

      <details class="nl-group" data-nl-group="challenge"${groupOpen('challenge')}>
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
  function answerBox(cx,cy,w=54,h=24){
    return `<rect class="nl-answer-box" x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" rx="5" fill="#fff" stroke="#52666d" stroke-width="1.8" stroke-dasharray="5 3"/>`;
  }
  function relationDisplay(line,r){
    const a=line.markers.find(m=>m.id===r.from),b=line.markers.find(m=>m.id===r.to);if(!a||!b)return null;
    const delta=cleanNumber(b.value-a.value),auto=r.type==='jump'?(delta>=0?'+':'')+fmt(delta):r.type==='difference'?fmt(Math.abs(delta)):'';
    const hidden=state.challenge&&!state.challenge.revealed&&state.challenge.hiddenRelationIds.includes(r.id);
    return {a,b,label:hidden?'':(r.label||auto),show:r.showLabel,hidden};
  }
  function assignLanes(line,side){
    const items=[];
    line.relations.filter(r=>r.type!=='interval'&&r.side===side).forEach(r=>{
      const d=relationDisplay(line,r);if(!d)return;
      const left=Math.min(px(d.a.value),px(d.b.value)),right=Math.max(px(d.a.value),px(d.b.value));
      items.push({id:r.id,left,right});
    });
    if(line.showConsecutiveDifferences&&line.consecutiveSide===side){
      const sorted=[...line.markers].sort((a,b)=>a.value-b.value);
      sorted.slice(0,-1).forEach((m,i)=>{
        const n=sorted[i+1],left=Math.min(px(m.value),px(n.value)),right=Math.max(px(m.value),px(n.value));
        items.push({id:'auto-'+i,left,right});
      });
    }
    items.sort((a,b)=>a.left-b.left||a.right-b.right);
    const ends=[],map={};
    items.forEach(item=>{
      let lane=ends.findIndex(end=>item.left-end>34);
      if(lane<0){lane=ends.length;ends.push(item.right)}else ends[lane]=item.right;
      map[item.id]=lane;
    });
    return {map,count:ends.length};
  }
  function layout(){
    const layouts=[];let cursor=state.title?54:28;
    state.lines.forEach((line,index)=>{
      const above=assignLanes(line,'above'),below=assignLanes(line,'below');
      const hasAboveMarker=line.markers.some(m=>m.side==='above');
      const hasBelowMarker=line.markers.some(m=>m.side==='below');
      const aboveExtent=Math.max(hasAboveMarker?82:24,above.count?136+(above.count-1)*30:24);
      const belowLabel=state.showTickLabels&&line.showLabels?42:18;
      const belowExtent=Math.max(belowLabel,hasBelowMarker?belowLabel+70:belowLabel,below.count?belowLabel+112+(below.count-1)*30:belowLabel);
      const baseY=cursor+aboveExtent;
      layouts.push({line,index,baseY,above,below,aboveExtent,belowExtent});
      cursor=baseY+belowExtent+26;
    });
    return {lines:layouts,height:Math.max(250,cursor+18)};
  }
  function markerCentre(layout,m){
    const labelBand=state.showTickLabels&&layout.line.showLabels?42:18;
    return m.side==='above'?layout.baseY-48:layout.baseY+labelBand+38;
  }
  function markerStem(layout,m){
    const x=px(m.value),cy=markerCentre(layout,m),base=layout.baseY;
    if(m.side==='above')return `<line x1="${x}" y1="${base-3}" x2="${x}" y2="${cy+17}" stroke="${esc(m.color)}" stroke-width="2.5"/>`;
    if(!(state.showTickLabels&&layout.line.showLabels))return `<line x1="${x}" y1="${base+3}" x2="${x}" y2="${cy-17}" stroke="${esc(m.color)}" stroke-width="2.5"/>`;
    const labelTop=base+20,labelBottom=base+43;
    return `<line x1="${x}" y1="${base+3}" x2="${x}" y2="${labelTop-4}" stroke="${esc(m.color)}" stroke-width="2.5"/><line x1="${x}" y1="${labelBottom+4}" x2="${x}" y2="${cy-17}" stroke="${esc(m.color)}" stroke-width="2.5"/>`;
  }
  function buildLine(layout){
    const {line,baseY,above,below,index}=layout;
    const range=state.max-state.min,rawCount=Math.floor(range/state.step+1e-8),stride=Math.max(1,Math.ceil(rawCount/160)),renderStep=state.step*stride,tickCount=Math.floor(range/renderStep+1e-8);
    let intervalLayer='',ticks='',relationshipLayer='',markerLayer='';
    line.relations.filter(r=>r.type==='interval').forEach(r=>{
      const d=relationDisplay(line,r);if(!d)return;
      const x1=px(d.a.value),x2=px(d.b.value),left=Math.min(x1,x2),w=Math.abs(x2-x1),y=r.side==='above'?baseY-16:baseY;
      intervalLayer+=`<rect x="${left}" y="${y}" width="${w}" height="16" rx="6" fill="${esc(r.color)}" opacity=".18"/>`;
      if(d.show&&d.label){const ty=r.side==='above'?baseY-22:(state.showTickLabels&&line.showLabels?baseY+58:baseY+30);intervalLayer+=`<text x="${(x1+x2)/2}" y="${ty}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="${esc(r.color)}">${esc(d.label)}</text>`}
    });
    for(let i=0;i<=tickCount;i++){
      const v=cleanNumber(state.min+i*renderStep),x=px(v),major=(i%state.labelEvery===0)||i===0||i===tickCount;
      ticks+=`<line x1="${x}" y1="${baseY-(major?13:8)}" x2="${x}" y2="${baseY+(major?13:8)}" stroke="#33474e" stroke-width="${major?2:1}"/>`;
      if(state.showTickLabels&&line.showLabels&&major){
        if(hiddenTick(v))ticks+=answerBox(x,baseY+30,50,24);
        else ticks+=`<text x="${x}" y="${baseY+35}" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="#33474e">${esc(fmt(v))}</text>`;
      }
    }
    const baseline=`<line x1="${X0}" y1="${baseY}" x2="${X1}" y2="${baseY}" stroke="#24343b" stroke-width="4" stroke-linecap="round"/><rect data-line-hit="${esc(line.id)}" x="${X0}" y="${baseY-16}" width="${X1-X0}" height="32" fill="transparent" style="cursor:crosshair"/>`;
    const lineLabel=line.label?`<text x="26" y="${baseY+5}" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="#52666d">${esc(line.label)}</text>`:'';

    line.relations.filter(r=>r.type!=='interval').forEach(r=>{
      const d=relationDisplay(line,r);if(!d)return;
      const x1=px(d.a.value),x2=px(d.b.value),left=Math.min(x1,x2),right=Math.max(x1,x2),mid=(x1+x2)/2;
      const lane=(r.side==='above'?above.map[r.id]:below.map[r.id])||0;
      if(r.type==='difference'){
        const y=r.side==='above'?baseY-112-lane*30:baseY+(state.showTickLabels&&line.showLabels?112:88)+lane*30;
        const drop=r.side==='above'?9:-9;
        relationshipLayer+=`<path d="M${left} ${y+drop} V${y} H${right} V${y+drop}" fill="none" stroke="${esc(r.color)}" stroke-width="2.4" stroke-linecap="round"/>`;
        if(d.show&&(d.label||d.hidden)){const ty=r.side==='above'?y-8:y+20;if(d.hidden)relationshipLayer+=answerBox(mid,ty-5,58,24);else relationshipLayer+=`<rect x="${mid-31}" y="${ty-14}" width="62" height="21" rx="10" fill="#fff"/><text x="${mid}" y="${ty+1}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="${esc(r.color)}">${esc(d.label)}</text>`}
      }else{
        const y1=markerCentre(layout,d.a),y2=markerCentre(layout,d.b);
        const controlY=r.side==='above'?Math.min(y1,y2,baseY)-64-lane*30:Math.max(y1,y2,baseY)+64+lane*30;
        const startY=y1,endY=y2;
        relationshipLayer+=`<path d="M${x1} ${startY} Q${mid} ${controlY} ${x2} ${endY}" fill="none" stroke="${esc(r.color)}" stroke-width="3" stroke-linecap="round" marker-end="url(#nl-arrow-${esc(line.id)}-${esc(r.id)})"/>`;
        if(d.show&&(d.label||d.hidden)){const ty=r.side==='above'?controlY+4:controlY-6;if(d.hidden)relationshipLayer+=answerBox(mid,ty-5,58,24);else relationshipLayer+=`<rect x="${mid-31}" y="${ty-15}" width="62" height="21" rx="10" fill="#fff"/><text x="${mid}" y="${ty}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="${esc(r.color)}">${esc(d.label)}</text>`}
      }
    });

    if(line.showConsecutiveDifferences&&line.markers.length>1){
      const sorted=[...line.markers].sort((a,b)=>a.value-b.value);
      sorted.slice(0,-1).forEach((m,i)=>{
        const n=sorted[i+1],x1=px(m.value),x2=px(n.value),mid=(x1+x2)/2,side=line.consecutiveSide||'above',lane=(side==='above'?above.map['auto-'+i]:below.map['auto-'+i])||0,y=side==='above'?baseY-112-lane*30:baseY+(state.showTickLabels&&line.showLabels?112:88)+lane*30,drop=side==='above'?9:-9,labelY=side==='above'?y-6:y+18;
        relationshipLayer+=`<path d="M${x1} ${y+drop} V${y} H${x2} V${y+drop}" fill="none" stroke="#71858b" stroke-width="1.8"/><rect x="${mid-25}" y="${labelY-15}" width="50" height="20" rx="10" fill="#fff"/><text x="${mid}" y="${labelY}" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#52666d">${esc(fmt(Math.abs(n.value-m.value)))}</text>`;
      });
    }

    line.markers.forEach((m,i)=>{
      const x=px(m.value),cy=markerCentre(layout,m),hidden=state.challenge&&!state.challenge.revealed&&state.challenge.hiddenMarkerIds.includes(m.id),showValue=m.showValue&&!hidden;
      const valueY=m.side==='above'?cy-28:cy+34;
      markerLayer+=`<g class="nl-svg-marker" data-line-id="${esc(line.id)}" data-marker-hit="${esc(m.id)}" style="cursor:ew-resize;touch-action:none">${markerStem(layout,m)}<circle cx="${x}" cy="${cy}" r="16" fill="${esc(m.color)}" stroke="#fff" stroke-width="3"/><circle cx="${x}" cy="${cy}" r="22" fill="transparent"/><text x="${x}" y="${cy+5}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="800" fill="${contrast(m.color)}" pointer-events="none">${esc(m.label||String(i+1))}</text>${showValue?`<text x="${x}" y="${valueY}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#33474e" pointer-events="none">${esc(fmt(m.value))}</text>`:(hidden?answerBox(x,valueY-5,54,24):'')}</g>`;
    });

    return intervalLayer+relationshipLayer+baseline+ticks+lineLabel+markerLayer;
  }
  function buildSvg(){
    const plan=layout();
    const title=state.title?`<text x="500" y="30" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="700" fill="#24343b">${esc(state.title)}</text>`:'';
    return `<svg id="nl-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 ${plan.height}" role="img" aria-label="Interactive number line from ${esc(fmt(state.min))} to ${esc(fmt(state.max))}"><defs>${state.lines.map(line=>line.relations.filter(r=>r.type==='jump').map(r=>`<marker id="nl-arrow-${esc(line.id)}-${esc(r.id)}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" fill="${esc(r.color)}"/></marker>`).join('')).join('')}</defs><rect x="0" y="0" width="1000" height="${plan.height}" rx="18" fill="#ffffff"/>${title}${plan.lines.map(buildLine).join('')}<text x="500" y="${plan.height-6}" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#87969a">99 Club Studio</text></svg>`;
  }
  function boardMarkerRows(){
    const line=activeLine();
    return line.markers.map(m=>`<div class="nl-board-item">
      <input class="nl-board-colour" type="color" value="${esc(m.color)}" data-board-marker-color="${esc(m.id)}" aria-label="Marker colour">
      <input class="nl-board-label" value="${esc(m.label)}" maxlength="12" data-board-marker-label="${esc(m.id)}" aria-label="Marker label">
      <input class="nl-board-value" type="number" step="${state.step}" min="${state.min}" max="${state.max}" value="${fmt(m.value)}" data-board-marker-value="${esc(m.id)}" aria-label="Marker value">
      <button class="nl-board-mini" type="button" data-board-marker-show="${esc(m.id)}" aria-label="Show or hide marker value">${m.showValue?'◉':'○'}</button>
      <button class="nl-board-mini" type="button" data-board-marker-side="${esc(m.id)}">${m.side==='above'?'↑':'↓'}</button>
      <button class="nl-board-mini nl-board-delete" type="button" data-board-marker-delete="${esc(m.id)}" aria-label="Delete marker">×</button>
    </div>`).join('')||'<div class="nl-board-empty">No markers on this line.</div>';
  }
  function boardRelationRows(){
    const line=activeLine();
    return line.relations.map(r=>{
      const a=line.markers.find(m=>m.id===r.from),b=line.markers.find(m=>m.id===r.to);
      return `<div class="nl-board-rel"><span>${esc(a?.label||r.from)} → ${esc(b?.label||r.to)}</span><select data-board-relation-type-edit="${esc(r.id)}"><option value="difference"${r.type==='difference'?' selected':''}>Difference</option><option value="jump"${r.type==='jump'?' selected':''}>Jump</option><option value="interval"${r.type==='interval'?' selected':''}>Interval</option></select><input class="nl-board-colour" type="color" value="${esc(r.color)}" data-board-relation-color="${esc(r.id)}" aria-label="Relationship colour"><button class="nl-board-mini" type="button" data-board-relation-side="${esc(r.id)}">${r.side==='above'?'↑':'↓'}</button><button class="nl-board-mini nl-board-delete" type="button" data-board-relation-delete="${esc(r.id)}">×</button></div>`;
    }).join('')||'<div class="nl-board-empty">No relationships on this line.</div>';
  }
  function boardUiHtml(){
    const ch=state.challenge,line=activeLine();
    const lineOptions=state.lines.map((l,i)=>`<option value="${esc(l.id)}"${l.id===state.activeLineId?' selected':''}>Line ${i+1}${l.label?' · '+esc(l.label):''}</option>`).join('');
    return `<div class="nl-board-ui">
      ${boardNotice?`<div class="nl-board-notice">${esc(boardNotice)}</div>`:''}
      <button class="nl-board-tools-toggle" type="button" data-board-action="toggle" aria-expanded="${boardMenuOpen?'true':'false'}">☰ <span>Tools</span></button>
      <div class="nl-board-menu${boardMenuOpen?' is-open':''}">
        <div class="nl-board-actions">
          <button type="button" data-board-action="add-marker"${boardLocked?' disabled':''}>＋ Marker</button>
          <button type="button" data-board-action="relation"${boardLocked||line.markers.length<2?' disabled':''}>↔ Relation</button>
          <button type="button" data-board-action="add-line"${boardLocked||state.lines.length>=4?' disabled':''}>＋ Line</button>
          <button type="button" data-board-action="challenge">? Challenge</button>
          <button type="button" data-board-action="reveal"${!ch?' disabled':''}>${ch?.revealed?'Hide answer':'Reveal answer'}</button>
          <button type="button" data-board-action="undo"${!undoStack.length?' disabled':''}>↶ Undo</button>
          <button type="button" data-board-action="redo"${!redoStack.length?' disabled':''}>↷ Redo</button>
          <button type="button" data-board-action="lock" class="${boardLocked?'is-active':''}">${boardLocked?'🔒 Locked':'🔓 Lock'}</button>
          <button type="button" data-board-action="more" class="${boardMoreOpen?'is-active':''}">••• More</button>
        </div>
        ${boardMode==='relation'?`<div class="nl-board-sub"><span>Relationship:</span><button data-board-relation-type="difference" class="${boardRelationType==='difference'?'is-active':''}">Difference</button><button data-board-relation-type="jump" class="${boardRelationType==='jump'?'is-active':''}">Jump</button><button data-board-relation-type="interval" class="${boardRelationType==='interval'?'is-active':''}">Interval</button><small>${boardFirstMarker?'Now tap the second marker.':'Choose a type, then tap two markers.'}</small></div>`:''}
        ${boardChallengeOpen?`<div class="nl-board-sub nl-board-challenges"><span>Make challenge:</span><button data-board-challenge="identify">Marked number</button><button data-board-challenge="difference">Difference</button><button data-board-challenge="jump">Jump</button><button data-board-challenge="missing-labels">Missing labels</button></div>`:''}
        ${boardMoreOpen?`<div class="nl-board-more">
          <div class="nl-board-more-head"><strong>Quick edit</strong><button type="button" data-board-action="exit">Exit board</button></div>
          <label>Editing <select data-board-line-select>${lineOptions}</select></label>
          <label>Line label <input data-board-line-label value="${esc(line.label)}" maxlength="30" placeholder="optional"></label>
          <div class="nl-board-section"><b>Markers</b>${boardMarkerRows()}</div>
          <div class="nl-board-section"><b>Relationships</b>${boardRelationRows()}</div>
          <div class="nl-board-more-actions"><button type="button" data-board-action="add-marker"${boardLocked?' disabled':''}>＋ Marker</button><button type="button" data-board-action="add-line"${boardLocked||state.lines.length>=4?' disabled':''}>＋ Line</button>${state.lines.length>1?`<button type="button" class="is-danger" data-board-action="delete-line"${boardLocked?' disabled':''}>Delete line</button>`:''}</div>
        </div>`:''}
      </div>
    </div>`;
  }
  function renderStage(){
    const c=state.challenge,prompt=c?`<div class="nl-challenge-banner"><span>Challenge</span><strong>${esc(c.prompt)}</strong>${c.revealed?`<em>Answer: ${esc(c.answer)}</em>`:''}</div>`:'';
    q('#gd-stage').innerHTML=`<div class="nl-stage-wrap">${prompt}<div class="nl-export-frame">${buildSvg()}</div><p class="nl-drag-help">Drag a marker along its line to move it. Values snap to the chosen tick step.</p></div>${boardUiHtml()}`;
    bindMarkerDragging();
    qa('[data-line-hit]',stage).forEach(el=>el.addEventListener('click',e=>{
      if(boardLocked||boardMode!=='add-marker')return;
      const lineId=el.getAttribute('data-line-hit');
      state.activeLineId=lineId;
      addMarker(valueFromClientX(e.clientX),lineId);
      boardMode=null;boardMenuOpen=false;
      boardMessage('Marker added. Drag it to fine-tune the position.');
    }));
  }
  function renderAll(){state=normalise(state);renderControls();renderStage()}
  function bindMarkerDragging(){
    qa('[data-marker-hit]',stage).forEach(el=>el.addEventListener('pointerdown',e=>{
      const lineId=el.getAttribute('data-line-id'),id=el.getAttribute('data-marker-hit');
      const line=state.lines.find(l=>l.id===lineId);if(!line||!line.markers.some(m=>m.id===id))return;
      if(boardLocked){e.preventDefault();return}
      if(boardMode==='relation'){
        e.preventDefault();
        if(!boardFirstMarker){boardFirstMarker={lineId,id};boardMessage('First marker selected. Tap the second marker.');return}
        if(boardFirstMarker.lineId!==lineId){boardFirstMarker=null;boardMessage('Choose two markers on the same number line.');return}
        if(boardFirstMarker.id===id){boardMessage('Choose a different second marker.');return}
        remember();
        state.activeLineId=lineId;
        const rid=nextId('r',line.relations);
        line.relations.push({id:rid,from:boardFirstMarker.id,to:id,type:boardRelationType,color:'#52666d',label:'',showLabel:true,side:'above'});
        boardFirstMarker=null;boardMode=null;boardMenuOpen=false;
        renderAll();boardMessage('Relationship added.');
        return;
      }
      remember();
      drag={lineId,id};e.preventDefault();
    }));
  }
  function moveDrag(e){
    if(!drag)return;
    const line=state.lines.find(l=>l.id===drag.lineId),m=line?.markers.find(x=>x.id===drag.id);if(!m)return;
    m.value=valueFromClientX(e.clientX);
    updateChallengeAnswer();
    const input=controls.querySelector('[data-marker-value="'+CSS.escape(m.id)+'"]');if(input&&line.id===state.activeLineId)input.value=fmt(m.value);
    renderStage();
  }
  function endDrag(){drag=null}
  window.addEventListener('pointermove',moveDrag);window.addEventListener('pointerup',endDrag);window.addEventListener('pointercancel',endDrag);

  function addMarker(value,lineId=state.activeLineId){
    const line=state.lines.find(l=>l.id===lineId)||activeLine(),id=nextId('m',line.markers),index=line.markers.length;
    remember();
    state.activeLineId=line.id;
    line.markers.push({id,label:String.fromCharCode(65+(index%26)),value:snap(value==null?(state.min+state.max)/2:value,state),color:COLOURS[index%COLOURS.length],showValue:true,side:'above'});
    renderAll();
  }
  function addRelation(){
    const line=activeLine();if(line.markers.length<2)return;
    remember();
    const id=nextId('r',line.relations);line.relations.push({id,from:line.markers[0].id,to:line.markers[1].id,type:'difference',color:'#52666d',label:'',showLabel:true,side:'above'});renderAll();
  }
  function addLine(){
    if(state.lines.length>=4)return;
    remember();
    const id=nextId('l',state.lines),index=state.lines.length;
    state.lines.push({id,label:'Line '+(index+1),showLabels:index===0,showConsecutiveDifferences:false,consecutiveSide:'above',markers:[],relations:[]});state.activeLineId=id;renderAll();
  }
  function randomTick(){const count=Math.max(1,Math.floor((state.max-state.min)/state.step+1e-8));return snap(state.min+Math.floor(Math.random()*(count+1))*state.step,state)}
  function randomDistinct(a){let b=randomTick(),guard=0;while(Math.abs(b-a)<state.step/1000&&guard++<40)b=randomTick();return b}
  function generateChallenge(type){
    remember();
    if(!beforeChallenge)beforeChallenge=copy({...state,challenge:null});else state=normalise(copy(beforeChallenge));
    const a=randomTick(),b=randomDistinct(a),lo=Math.min(a,b),hi=Math.max(a,b);
    const line={id:'l1',label:'',showLabels:true,showConsecutiveDifferences:false,consecutiveSide:'above',markers:[],relations:[]};
    state.lines=[line];state.activeLineId='l1';
    if(type==='identify'){
      line.markers=[{id:'m1',label:'A',value:a,color:'#147d75',showValue:true,side:'above'}];
      state.challenge={type,prompt:'What number is marker A pointing to?',answer:fmt(a),revealed:false,hiddenTicks:[],hiddenMarkerIds:['m1'],hiddenRelationIds:[]};
    }else if(type==='difference'){
      line.markers=[{id:'m1',label:'A',value:lo,color:'#147d75',showValue:true,side:'above'},{id:'m2',label:'B',value:hi,color:'#d65a4a',showValue:true,side:'above'}];
      line.relations=[{id:'r1',from:'m1',to:'m2',type:'difference',color:'#52666d',label:'',showLabel:true,side:'above'}];
      state.challenge={type,prompt:'What is the difference between A and B?',answer:fmt(cleanNumber(hi-lo)),revealed:false,hiddenTicks:[],hiddenMarkerIds:[],hiddenRelationIds:['r1']};
    }else if(type==='jump'){
      let start=a,end=b;if(Math.abs(end-start)<state.step/1000)end=snap(start+state.step,state);const delta=cleanNumber(end-start);
      line.markers=[{id:'m1',label:'Start',value:start,color:'#147d75',showValue:true,side:'above'},{id:'m2',label:'?',value:end,color:'#d65a4a',showValue:true,side:'above'}];
      line.relations=[{id:'r1',from:'m1',to:'m2',type:'jump',color:'#4169a8',label:(delta>=0?'+':'')+fmt(delta),showLabel:true,side:'above'}];
      state.challenge={type,prompt:'Start at '+fmt(start)+' and make the shown jump. Where do you land?',answer:fmt(end),revealed:false,hiddenTicks:[],hiddenMarkerIds:['m2'],hiddenRelationIds:[]};
    }else{
      const count=Math.max(2,Math.floor((state.max-state.min)/state.step+1e-8)),candidates=[];
      for(let i=1;i<count;i++)if(i%state.labelEvery===0)candidates.push(cleanNumber(state.min+i*state.step));
      const shuffled=candidates.sort(()=>Math.random()-.5).slice(0,Math.min(5,Math.max(2,Math.floor(candidates.length/3))));
      state.challenge={type:'missing-labels',prompt:'Fill in the missing number labels on the line.',answer:shuffled.sort((x,y)=>x-y).map(fmt).join(', '),revealed:false,hiddenTicks:shuffled,hiddenMarkerIds:[],hiddenRelationIds:[]};
    }
    state=normalise(state);openGroups.add('challenge');renderAll();
  }
  function applyPreset(name){
    beforeChallenge=null;state.challenge=null;
    if(name==='0-20'){state.min=0;state.max=20;state.step=1;state.labelEvery=1}
    if(name==='0-100'){state.min=0;state.max=100;state.step=10;state.labelEvery=1}
    if(name==='negative'){state.min=-10;state.max=10;state.step=1;state.labelEvery=1}
    if(name==='decimal'){state.min=0;state.max=1;state.step=.1;state.labelEvery=1}
    state.lines.forEach(line=>line.markers.forEach(m=>m.value=snap(m.value,state)));renderAll();
  }
  function exportName(){return state.title||('number-line-'+fmt(state.min)+'-to-'+fmt(state.max))}
  function svg(){return q('#nl-svg')}
  async function exportAction(kind){
    try{
      if(!X)throw new Error('Export tools are not available.');
      if(kind==='copy'){await X.copyPng(svg());message('Image copied — paste it into your slide or document.')}
      if(kind==='png'){await X.downloadPng(svg(),exportName(),2);message('PNG downloaded.')}
      if(kind==='svg'){X.downloadSvg(svg(),exportName());message('SVG downloaded.')}
      if(kind==='print'){X.printSvg(svg(),{title:state.title||'Number line',prompt:state.challenge?.prompt||'',answer:state.challenge?.answer||'',showAnswer:!!state.challenge?.revealed,landscape:true});message('Print view opened. Choose “Save as PDF” in the print dialog.')}
      if(kind==='link'){const u=new URL(location.href);u.searchParams.set('nl',encodeState(state));u.hash='number-line';await X.copyText(u.toString());message('Setup link copied. It will reopen this number line exactly as shown.')}
    }catch(err){message(err?.message||'That export did not work.',true)}
  }

  controls.addEventListener('input',e=>{
    const t=e.target,line=activeLine();
    if(['nl-min','nl-max','nl-step','nl-label-every'].includes(t.id)){applyRangeFromControls();renderStage();return}
    if(t.id==='nl-title'){state.title=t.value.slice(0,90);renderStage();return}
    if(t.id==='nl-tick-labels'){state.showTickLabels=t.checked;renderStage();return}
    if(t.id==='nl-line-label'){line.label=t.value.slice(0,30);const option=q('#nl-active-line')?.selectedOptions?.[0];if(option){const i=state.lines.findIndex(l=>l.id===line.id);option.textContent='Line '+(i+1)+(line.label?' · '+line.label:'')}renderStage();return}
    if(t.id==='nl-line-labels'){line.showLabels=t.checked;renderStage();return}
    if(t.id==='nl-consecutive'){line.showConsecutiveDifferences=t.checked;renderStage();return}
    if(t.id==='nl-consecutive-side'){line.consecutiveSide=t.value==='below'?'below':'above';renderStage();return}
    if(t.id==='nl-prompt'&&state.challenge){state.challenge.prompt=t.value.slice(0,220);renderStage();return}
    let id=t.dataset.markerLabel;if(id){const m=line.markers.find(x=>x.id===id);if(m){m.label=t.value.slice(0,12);renderStage()}return}
    id=t.dataset.markerValue;if(id){const m=line.markers.find(x=>x.id===id);if(m){m.value=snap(num(t.value,m.value),state);updateChallengeAnswer();renderStage()}return}
    id=t.dataset.markerColor;if(id){const m=line.markers.find(x=>x.id===id);if(m){m.color=t.value;renderStage()}return}
    id=t.dataset.markerSide;if(id){const m=line.markers.find(x=>x.id===id);if(m){m.side=t.value==='below'?'below':'above';renderStage()}return}
    id=t.dataset.markerShow;if(id){const m=line.markers.find(x=>x.id===id);if(m){m.showValue=t.checked;renderStage()}return}
    id=t.dataset.relationFrom;if(id){const r=line.relations.find(x=>x.id===id);if(r){r.from=t.value;if(r.from===r.to){const other=line.markers.find(m=>m.id!==r.from);if(other){r.to=other.id;const otherSelect=controls.querySelector('[data-relation-to="'+CSS.escape(id)+'"]');if(otherSelect)otherSelect.value=r.to}}updateChallengeAnswer();renderStage()}return}
    id=t.dataset.relationTo;if(id){const r=line.relations.find(x=>x.id===id);if(r){r.to=t.value;if(r.from===r.to){const other=line.markers.find(m=>m.id!==r.to);if(other){r.from=other.id;const otherSelect=controls.querySelector('[data-relation-from="'+CSS.escape(id)+'"]');if(otherSelect)otherSelect.value=r.from}}updateChallengeAnswer();renderStage()}return}
    id=t.dataset.relationType;if(id){const r=line.relations.find(x=>x.id===id);if(r){r.type=t.value;renderStage()}return}
    id=t.dataset.relationSide;if(id){const r=line.relations.find(x=>x.id===id);if(r){r.side=t.value==='below'?'below':'above';renderStage()}return}
    id=t.dataset.relationColor;if(id){const r=line.relations.find(x=>x.id===id);if(r){r.color=t.value;renderStage()}return}
    id=t.dataset.relationLabel;if(id){const r=line.relations.find(x=>x.id===id);if(r){r.label=t.value.slice(0,24);renderStage()}return}
    id=t.dataset.relationShow;if(id){const r=line.relations.find(x=>x.id===id);if(r){r.showLabel=t.checked;renderStage()}return}
  });

  controls.addEventListener('change',e=>{
    const t=e.target;
    if(['nl-min','nl-max','nl-step','nl-label-every'].includes(t.id)){state=normalise(state);renderAll();return}
    if(t.id==='nl-active-line'){state.activeLineId=t.value;renderControls();renderStage();return}
  });

  controls.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;const line=activeLine();
    if(b.dataset.nlPreset){applyPreset(b.dataset.nlPreset);return}
    if(b.id==='nl-add-marker'){addMarker();return}
    if(b.id==='nl-add-relation'){addRelation();return}
    if(b.id==='nl-add-line'){addLine();return}
    if(b.id==='nl-delete-line'&&state.lines.length>1){remember();state.lines=state.lines.filter(l=>l.id!==state.activeLineId);state.activeLineId=state.lines[0].id;renderAll();return}
    if(b.dataset.markerDelete){remember();line.markers=line.markers.filter(m=>m.id!==b.dataset.markerDelete);line.relations=line.relations.filter(r=>r.from!==b.dataset.markerDelete&&r.to!==b.dataset.markerDelete);updateChallengeAnswer();renderAll();return}
    if(b.dataset.relationDelete){remember();line.relations=line.relations.filter(r=>r.id!==b.dataset.relationDelete);updateChallengeAnswer();renderAll();return}
    if(b.id==='nl-generate'){generateChallenge(q('#nl-challenge-type').value);return}
    if(b.id==='nl-reveal'&&state.challenge){state.challenge.revealed=!state.challenge.revealed;renderAll();return}
    if(b.id==='nl-clear-challenge'){if(beforeChallenge)state=normalise(copy(beforeChallenge));beforeChallenge=null;renderAll();return}
    if(b.id==='nl-copy-image'){exportAction('copy');return}
    if(b.id==='nl-png'){exportAction('png');return}
    if(b.id==='nl-svg-download'){exportAction('svg');return}
    if(b.id==='nl-print'){exportAction('print');return}
    if(b.id==='nl-copy-link'){exportAction('link');return}
    if(b.id==='nl-fullscreen'){const target=q('#gd-stage');boardMenuOpen=false;boardMoreOpen=false;boardChallengeOpen=false;boardMode=null;boardFirstMarker=null;if(target?.requestFullscreen)target.requestFullscreen().catch(()=>message('Full-screen mode is not available here.',true));return}
    if(b.id==='nl-reset'){beforeChallenge=null;state=normalise(DEFAULT_STATE);renderAll();return}
  });

  stage.addEventListener('click',e=>{
    const b=e.target.closest('[data-board-action],[data-board-relation-type],[data-board-challenge],[data-board-marker-delete],[data-board-marker-show],[data-board-marker-side],[data-board-relation-delete],[data-board-relation-side]');
    if(!b)return;
    if(b.dataset.boardRelationType){
      if(boardLocked)return;
      boardRelationType=b.dataset.boardRelationType;boardMode='relation';boardFirstMarker=null;boardMenuOpen=false;
      boardMessage('Tap the first marker, then the second marker.');
      return;
    }
    if(b.dataset.boardChallenge){boardChallengeOpen=false;boardMenuOpen=false;generateChallenge(b.dataset.boardChallenge);return}
    const line=activeLine();
    if(b.dataset.boardMarkerDelete){
      if(boardLocked)return;remember();line.markers=line.markers.filter(m=>m.id!==b.dataset.boardMarkerDelete);line.relations=line.relations.filter(r=>r.from!==b.dataset.boardMarkerDelete&&r.to!==b.dataset.boardMarkerDelete);updateChallengeAnswer();renderAll();return;
    }
    if(b.dataset.boardMarkerShow){
      if(boardLocked)return;remember();const m=line.markers.find(x=>x.id===b.dataset.boardMarkerShow);if(m)m.showValue=!m.showValue;renderAll();return;
    }
    if(b.dataset.boardMarkerSide){
      if(boardLocked)return;remember();const m=line.markers.find(x=>x.id===b.dataset.boardMarkerSide);if(m)m.side=m.side==='above'?'below':'above';renderAll();return;
    }
    if(b.dataset.boardRelationDelete){
      if(boardLocked)return;remember();line.relations=line.relations.filter(r=>r.id!==b.dataset.boardRelationDelete);updateChallengeAnswer();renderAll();return;
    }
    if(b.dataset.boardRelationSide){
      if(boardLocked)return;remember();const r=line.relations.find(x=>x.id===b.dataset.boardRelationSide);if(r)r.side=r.side==='above'?'below':'above';renderAll();return;
    }
    const action=b.dataset.boardAction;
    if(action==='toggle'){boardMenuOpen=!boardMenuOpen;if(!boardMenuOpen){boardMoreOpen=false;boardChallengeOpen=false}renderStage();return}
    if(action==='add-marker'){if(boardLocked)return;boardMode='add-marker';boardFirstMarker=null;boardMenuOpen=false;boardMoreOpen=false;boardMessage('Tap the number line where you want the new marker.');return}
    if(action==='relation'){if(boardLocked)return;boardMode=boardMode==='relation'?null:'relation';boardFirstMarker=null;boardChallengeOpen=false;renderStage();return}
    if(action==='add-line'){if(boardLocked)return;addLine();boardMessage('Comparison line added.');return}
    if(action==='challenge'){boardChallengeOpen=!boardChallengeOpen;boardMoreOpen=false;renderStage();return}
    if(action==='reveal'&&state.challenge){state.challenge.revealed=!state.challenge.revealed;renderAll();return}
    if(action==='undo'){undo();return}
    if(action==='redo'){redo();return}
    if(action==='lock'){boardLocked=!boardLocked;boardMode=null;boardFirstMarker=null;renderStage();return}
    if(action==='more'){boardMoreOpen=!boardMoreOpen;boardChallengeOpen=false;renderStage();return}
    if(action==='delete-line'&&state.lines.length>1&&!boardLocked){remember();state.lines=state.lines.filter(l=>l.id!==state.activeLineId);state.activeLineId=state.lines[0].id;renderAll();return}
    if(action==='exit'){if(document.fullscreenElement)document.exitFullscreen();return}
  });
  stage.addEventListener('change',e=>{
    const t=e.target,line=activeLine();
    if(t.matches('[data-board-line-select]')){state.activeLineId=t.value;renderAll();return}
    if(t.matches('[data-board-line-label]')){remember();line.label=t.value.slice(0,30);renderAll();return}
    let id=t.dataset.boardMarkerLabel;if(id){remember();const m=line.markers.find(x=>x.id===id);if(m)m.label=t.value.slice(0,12);renderAll();return}
    id=t.dataset.boardMarkerValue;if(id){remember();const m=line.markers.find(x=>x.id===id);if(m)m.value=snap(num(t.value,m.value),state);updateChallengeAnswer();renderAll();return}
    id=t.dataset.boardMarkerColor;if(id){remember();const m=line.markers.find(x=>x.id===id);if(m)m.color=t.value;renderAll();return}
    id=t.dataset.boardRelationTypeEdit;if(id){remember();const r=line.relations.find(x=>x.id===id);if(r)r.type=t.value;updateChallengeAnswer();renderAll();return}
    id=t.dataset.boardRelationColor;if(id){remember();const r=line.relations.find(x=>x.id===id);if(r)r.color=t.value;renderAll();return}
  });
  document.addEventListener('fullscreenchange',()=>{
    if(document.fullscreenElement!==stage){boardMenuOpen=false;boardMoreOpen=false;boardChallengeOpen=false;boardMode=null;boardFirstMarker=null;boardLocked=false;renderStage()}
  });

  renderAll();
}

G.numberLine=numberLineV2;
})(window.TT99Goodies);
