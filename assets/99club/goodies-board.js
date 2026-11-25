(function(G){
'use strict';
if(!G)return;
const params=new URLSearchParams(location.search);
const forcedBoard=!!window.TT99_GOODIES_FORCE_BOARD&&params.get('embed')!=='1';
if(params.get('board')!=='1'&&!forcedBoard)return;

const root=G.root;
const tools=Array.isArray(G.toolCatalogue)?G.toolCatalogue:[];
const SNAP=10;
const BOARD_W=2800,BOARD_H=1800;
const AUTO_SHRINK_HEIGHT_TOOLS=new Set(['number-line','place-value','abacus','array-builder','factors','fdp','clock','money','measurement']);
let nextId=1,selectedId=null,snapOn=true,zCounter=10,drag=null,resize=null,pan=null;

const defaults={
  'number-line':[760,360],
  'place-value':[820,520],
  'abacus':[760,520],
  'fraction-wall':[720,660],
  'bar-model':[760,440],
  'hundred-square':[590,620],
  'multiplication-grid':[590,620],
  'array-builder':[660,560],
  'clock':[560,680],
  'money':[760,570],
  'coordinates':[680,610],
  'measurement':[780,650],
  'randomiser':[680,500],
  'balance':[760,580],
  'times-table':[700,580],
  'factors':[740,620],
  'fdp':[700,800],
  'geoboard':[650,780],
  'maths-canvas':[760,560]
};
const QUICK_ACTIONS={
  'number-line':[
    {label:'Challenge',selector:'[data-nl-workflow="challenge"]',allowHidden:true,panelMode:'challenge',title:'Choose a challenge'},
    {label:'Reveal answer',selector:'[data-board-action="reveal"]',allowHidden:true,dynamicLabel:true,title:'Reveal or hide the current challenge answer'},
    {label:'+ Marker',selector:'[data-board-action="add-marker"]',title:'Add marker',notice:'Tap the number line where you want the marker.'},
    {label:'− Item',selector:'[data-board-action="delete"]',title:'Delete marker or comparison line',notice:'Tap the marker or comparison line you want to remove.'},
    {label:'+ Relation',selector:'[data-board-action="relation"]',title:'Add relationship',notice:'Choose the relationship type, then tap two markers.'},
    {label:'+ Line',selector:'[data-board-action="add-line"]',title:'Add aligned comparison line'}
  ],
  'place-value':[
    {label:'Challenge',selector:'[data-pv-workflow="challenge"]',allowHidden:true,panelMode:'challenge',title:'Choose a challenge'},
    {label:'Reveal answer',selector:'[data-board-action="reveal"]',dynamicLabel:true,title:'Reveal or hide the challenge answer'},
    {label:'Exchange 10→1',selector:'[data-gd-action="exchange-up"]',allowHidden:true,title:'Exchange ten selected-place counters for one of the next larger place'},
    {label:'Split 1→10',selector:'[data-gd-action="split-down"]',allowHidden:true,title:'Split the selected counter into ten of the next smaller place'}
  ],
  abacus:[
    {label:'Challenge',selector:'[data-ab-workflow="challenge"],#ab-history-challenge',allowHidden:true,panelMode:'challenge',title:'Choose a challenge',skipClickSelector:'#ab-history-challenge'},
    {label:'Clear',selector:'[data-ab-stage="clear"]',title:'Reset every place-value rod to zero',danger:true}
  ],
  'bar-model':[
    {label:'+ Part',selector:'#bm-add-stage'},
    {label:'−',selector:'#bm-minus',title:'Decrease selected part'},
    {label:'+',selector:'#bm-plus',title:'Increase selected part'},
    {label:'×',selector:'#bm-delete',title:'Delete selected part',danger:true}
  ],
  'fraction-wall':[
    {label:'+ Strip',selector:'[data-gd-action="add"],[data-fw-to-workbench]'},
    {label:'Duplicate',selector:'[data-gd-action="duplicate"]'},
    {label:'×',selector:'[data-gd-action="delete"]',title:'Delete selected strip',danger:true}
  ],
  clock:[
    {label:'+ Clock',selector:'#cl-add-clock',allowHidden:true,title:'Add another clock'},
    {label:'↔',selector:'[data-cl-layout-cycle]',allowHidden:true,dynamicLabel:true,title:'Change clock layout (horizontal / vertical / grid)'},
    {label:'− Clock',selector:'#cl-remove-clock',allowHidden:true,title:'Remove selected clock',danger:true}
  ],
  money:[
    {label:'+ Money',selector:'[data-gd-action="add-money"]',panelMode:'money-palette',title:'Add coins and notes'}
  ],
  balance:[
    {label:'+ Left',selector:'[data-ba-stage-add="left"]'},
    {label:'+ Right',selector:'[data-ba-stage-add="right"]'},
    {label:'Move',selector:'#ba-move',allowHidden:true,title:'Move selected weight to other pan'},
    {label:'Duplicate',selector:'#ba-duplicate',allowHidden:true},
    {label:'×',selector:'#ba-delete',allowHidden:true,title:'Delete selected weight',danger:true}
  ],
  'maths-canvas':[
    {label:'+ Tile',selector:'[data-gd-action="add"]',allowHidden:true,title:'Add number or operation tile'},
    {label:'Combine +',selector:'[data-gd-action="combine"]',allowHidden:true,title:'Combine selected number tile by addition'},
    {label:'Split',selector:'[data-gd-action="split"]',allowHidden:true,title:'Split selected number into equal tiles'},
    {label:'Duplicate',selector:'[data-gd-action="duplicate"]',allowHidden:true},
    {label:'×',selector:'[data-gd-action="delete"]',allowHidden:true,title:'Delete selected tile',danger:true}
  ],
  'hundred-square':[
    {label:'Rule',selector:'[data-hs-rule-toggle]',allowHidden:true,title:'Set highlight rule'}
  ],
  measurement:[
    {label:'+ Ruler',selector:'#me-add-ruler',allowHidden:true,title:'Add comparison ruler'},
    {label:'Sync',selector:'#me-sync-rulers',allowHidden:true,checkedLabel:'Unlink',uncheckedLabel:'Sync',title:'Link or unlink ruler movement'}
  ],
  randomiser:[
    {label:'Go',selector:'[data-ra-stage-go]',dynamicLabel:true,allowHidden:true}
  ],
  coordinates:[
    {label:'× Point',selector:'[data-co-delete]',danger:true}
  ],
  geoboard:[
    {label:'× Vertex',selector:'[data-ge-delete]',danger:true}
  ]
};
// Standard challenge pickers are reachable without opening the overflow menu.
for(const [tool,prefix] of Object.entries({"fraction-wall":"fw","bar-model":"bm","hundred-square":"hs","multiplication-grid":"mg","array-builder":"ab","clock":"cl","money":"mo","coordinates":"co","measurement":"me","times-table":"tv","factors":"fe","fdp":"fd","geoboard":"ge"})){
  (QUICK_ACTIONS[tool]||=[]).push({label:'Challenge',selector:'[data-'+prefix+'-workflow="challenge"]',allowHidden:true,panelMode:'challenge',title:'Choose a challenge'});
}
const HISTORY_SELECTORS={
  undo:'[data-gd-action="undo"],[data-board-action="undo"],[data-co-undo-stage],#hs-undo,#ab-undo,#ba-undo',
  redo:'[data-gd-action="redo"],[data-board-action="redo"],[data-co-redo-stage],#hs-redo,#ab-redo,#ba-redo'
};
const objects=[];

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function snapped(v){return snapOn?Math.round(v/SNAP)*SNAP:v}
function iconSvg(name){
  const paths={
    back:'<path d="m14 6-6 6 6 6"/>',
    save:'<path d="M6 4h12l2 2v14H4V4zM8 4v6h8V4M8 20v-6h8v6"/>',
    full:'<path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4"/>',
    snap:'<circle cx="7" cy="7" r="1.2"/><circle cx="12" cy="7" r="1.2"/><circle cx="17" cy="7" r="1.2"/><circle cx="7" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="17" cy="12" r="1.2"/><circle cx="7" cy="17" r="1.2"/><circle cx="12" cy="17" r="1.2"/><circle cx="17" cy="17" r="1.2"/>',
    settings:'<path d="M5 7h8M17 7h2M11 12h8M5 12h2M5 17h5M14 17h5"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="12" cy="17" r="2"/>',
    lock:'<rect x="6" y="10" width="12" height="10" rx="2"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
    unlock:'<rect x="6" y="10" width="12" height="10" rx="2"/><path d="M15 10V7a3 3 0 0 0-5.7-1.3"/>',
    trash:'<path d="M5 7h14M9 7V4h6v3M8 10l1 9h6l1-9"/>',
    undo:'<path d="M9 7 4 12l5 5"/><path d="M5 12h8a6 6 0 0 1 6 6"/>',
    redo:'<path d="m15 7 5 5-5 5"/><path d="M19 12h-8a6 6 0 0 0-6 6"/>',
    more:'<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>',
    export:'<path d="M12 4v10M8 8l4-4 4 4"/><path d="M5 13v6h14v-6"/>'
  };
  return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(paths[name]||'')+'</svg>';
}

document.documentElement.classList.add('gd-mixed-board-page');
document.body.classList.add('gd-mixed-board-page');

root.innerHTML='<div class="gd-mixed-board" id="gd-mixed-board">'+
  '<nav class="gd-board-palette" aria-label="Add manipulatives">'+
    tools.map(t=>'<button type="button" class="gd-board-tool" data-board-add="'+esc(t.id)+'" data-label="'+esc(t.title)+'" aria-label="Add '+esc(t.title)+'"><span aria-hidden="true">'+esc(t.icon)+'</span></button>').join('')+
  '</nav>'+
  '<div class="gd-board-viewport" id="gd-board-viewport" tabindex="0" aria-label="Maths whiteboard">'+
    '<div class="gd-board-canvas" id="gd-board-canvas" style="width:'+BOARD_W+'px;height:'+BOARD_H+'px"></div>'+
  '</div>'+
  '<div class="gd-board-tooltip" id="gd-board-tooltip" role="tooltip"></div>'+
  '<div class="gd-board-hint" id="gd-board-hint" role="status" aria-live="polite"></div>'+
  '<aside class="gd-board-floating-controls" id="gd-board-floating-controls" hidden aria-label="Manipulative settings">'+
    '<div class="gd-board-floating-controls-head" data-board-controls-drag>'+
      '<strong id="gd-board-floating-controls-title">Settings</strong>'+
      '<button type="button" data-board-controls-close aria-label="Close settings" title="Close">×</button>'+
    '</div>'+
    '<div class="gd-board-floating-controls-body" id="gd-board-floating-controls-body"></div>'+
  '</aside>'+
  '<dialog class="gd-board-library" id="gd-board-library" aria-labelledby="gd-board-library-title">'+
    '<div class="gd-board-library-head"><strong id="gd-board-library-title">Saved boards</strong><button type="button" data-board-library-close aria-label="Close saved boards">×</button></div>'+
    '<p>Save editable lesson boards in this browser. No account required. Clearing browser data removes saved boards.</p>'+
    '<label class="gd-field"><span>Board name</span><input id="gd-board-save-name" class="gd-input" maxlength="80" placeholder="e.g. Fractions lesson"></label>'+
    '<button type="button" class="gd-btn gd-btn--primary" id="gd-board-save-current">Save current board</button>'+
    '<div id="gd-board-library-list"></div><p id="gd-board-library-status" role="status" aria-live="polite"></p>'+
  '</dialog>'+
  '<div class="gd-board-global" aria-label="Whiteboard controls">'+
    '<button type="button" class="gd-board-global-button" id="gd-board-saved" aria-label="Saved boards" title="Saved boards">'+iconSvg('save')+'</button>'+
    '<button type="button" class="gd-board-global-button" id="gd-board-back" aria-label="Back to manipulatives" title="Back">'+iconSvg('back')+'</button>'+
    '<button type="button" class="gd-board-global-button is-active" id="gd-board-snap" aria-pressed="true" aria-label="Toggle snap to dots" title="Snap to dots">'+iconSvg('snap')+'</button>'+
    '<button type="button" class="gd-board-global-button" id="gd-board-full" aria-label="Present full screen" title="Present">'+iconSvg('full')+'</button>'+
  '</div>'+
'</div>';

const board=document.getElementById('gd-mixed-board');
const viewport=document.getElementById('gd-board-viewport');
const canvas=document.getElementById('gd-board-canvas');
const hint=document.getElementById('gd-board-hint');
const tooltip=document.getElementById('gd-board-tooltip');
const floatingControls=document.getElementById('gd-board-floating-controls');
const floatingControlsBody=document.getElementById('gd-board-floating-controls-body');
const floatingControlsTitle=document.getElementById('gd-board-floating-controls-title');
let floatingControlObjectId=null,floatingControlDrag=null,floatingControlX=86,floatingControlY=76,floatingControlMoved=false,floatingPanelMode='settings',floatingHelpData=null;
let hintTimer=null,tooltipTimer=null;
function showToolTip(button){
  if(!tooltip||!button)return;
  clearTimeout(tooltipTimer);
  const label=button.dataset.label||button.getAttribute('aria-label')||'';
  if(!label)return;
  const r=button.getBoundingClientRect(),host=board.getBoundingClientRect();
  tooltip.textContent=label;
  tooltip.style.left=(r.right-host.left+9)+'px';
  tooltip.style.top=(r.top-host.top+r.height/2)+'px';
  tooltip.classList.add('is-visible');
}
function hideToolTip(){if(!tooltip)return;clearTimeout(tooltipTimer);tooltipTimer=setTimeout(()=>tooltip.classList.remove('is-visible'),80)}

function boardHint(message){
  if(!hint||!message)return;
  clearTimeout(hintTimer);hint.textContent=message;hint.classList.add('is-visible');
  hintTimer=setTimeout(()=>hint.classList.remove('is-visible'),2600);
}

function objectById(id){return objects.find(x=>String(x.id)===String(id))||null}
function usedClockSlots(){
  const used=new Set();
  objects.filter(obj=>obj.toolId==='clock').forEach(obj=>(Array.isArray(obj.clockSlots)?obj.clockSlots:[]).forEach(slot=>{
    const value=Math.round(Number(slot));if(Number.isInteger(value)&&value>=0)used.add(value);
  }));
  return used;
}
function nextClockSlot(){
  const used=usedClockSlots();let slot=0;while(used.has(slot))slot++;return slot;
}
function allocateClockSlot(id){
  const obj=objectById(id);if(!obj||obj.toolId!=='clock')return null;
  if(!Array.isArray(obj.clockSlots))obj.clockSlots=[];
  const slot=nextClockSlot();obj.clockSlots.push(slot);return slot;
}
function releaseClockSlot(id,slot){
  const obj=objectById(id);if(!obj||obj.toolId!=='clock'||!Array.isArray(obj.clockSlots))return false;
  const value=Math.round(Number(slot)),index=obj.clockSlots.indexOf(value);
  if(index<0)return false;obj.clockSlots.splice(index,1);return true;
}
function frameFor(id){return canvas.querySelector('[data-board-object="'+id+'"]')}
function innerDocument(obj){
  const frame=frameFor(obj?.id),iframe=frame?.querySelector('iframe');
  try{return iframe?.contentDocument||null}catch(_){return null}
}
function innerTarget(obj,selector,allowHidden=false){
  const doc=innerDocument(obj);if(!doc||!selector)return null;
  const node=doc.querySelector(selector);
  if(!node||node.disabled||(node.hidden&&node.matches('[data-board-action="reveal"]'))||node.classList?.contains('is-disabled')||node.getAttribute?.('aria-disabled')==='true')return null;
  if(!allowHidden){
    if(node.hidden)return null;
    const style=doc.defaultView?.getComputedStyle(node);
    if(style&&(style.display==='none'||style.visibility==='hidden'))return null;
  }
  return node;
}
const CONTROL_SELECTOR='button,input,select,textarea,[contenteditable="true"]';
let floatingControlSources=[],floatingControlSignature='',floatingControlStructure='';
const innerConnections=new Map();
function positionFloatingControls(){
  if(!floatingControls)return;
  const margin=8,maxX=Math.max(margin,board.clientWidth-floatingControls.offsetWidth-margin),maxY=Math.max(margin,board.clientHeight-floatingControls.offsetHeight-margin);
  floatingControlX=clamp(floatingControlX,margin,maxX);floatingControlY=clamp(floatingControlY,margin,maxY);
  floatingControls.style.left=floatingControlX+'px';floatingControls.style.top=floatingControlY+'px';
}
function sourceControls(obj){return innerDocument(obj)?.getElementById(floatingPanelMode==='money-palette'&&obj?.toolId==='money'?'mo-board-palette':'gd-controls')||null}
// The frame launcher is deliberately not a clone of the full settings panel.
// Keep proxy identities, so every action runs through its native widget engine.
function compactChallengeControls(clone,obj){
  const doc=clone.ownerDocument,wrap=doc.createElement('div');wrap.className='gd-board-challenge-launcher';
  const picker=clone.querySelector('.gd-challenge-picker');
  const native=clone.querySelector('[data-gd-native-prefix]');
  const label=(text)=>{const node=doc.createElement('div');node.className='gd-launch-label';node.textContent=text;return node};
  function addButton(button,cls){if(!button)return;button.classList.add(cls);wrap.appendChild(button)}
  if(picker){
    const all=picker.querySelector('[data-gd-random-scope="all"]');
    const category=picker.querySelector('[data-gd-random-scope]:not([data-gd-random-scope="all"])');
    const chips=picker.querySelector('.gd-challenge-chips'),cards=picker.querySelector('.gd-challenge-cards');
    addButton(all,'gd-launch-all');
    wrap.appendChild(label('Choose a category'));
    if(chips)wrap.appendChild(chips);
    if(category){category.textContent='Random · '+(chips?.querySelector('.is-active')?.textContent.trim()||'this category');addButton(category,'gd-launch-category-random')}
    wrap.appendChild(label('Or choose a question'));
    if(cards){
      cards.querySelectorAll('.gd-challenge-card').forEach(card=>{
        const desc=card.querySelector('span');if(desc){card.title=desc.textContent;desc.remove()}
        card.removeAttribute('aria-selected');card.classList.remove('is-selected');
      });
      wrap.appendChild(cards);
    }
  }else if(native){
    const groups=JSON.parse(native.dataset.gdNativeGroups||'[]'),prefix=native.dataset.gdNativePrefix;
    const selected=Math.max(0,Math.min(groups.length-1,Number(obj.launcherCategory)||0));
    addButton(native.querySelector('[data-gd-native-random="all"]'),'gd-launch-all');
    wrap.appendChild(label('Choose a category'));
    const chips=doc.createElement('div');chips.className='gd-challenge-chips';
    groups.forEach((group,index)=>{const chip=doc.createElement('button');chip.type='button';chip.className='gd-challenge-chip'+(index===selected?' is-active':'');chip.dataset.boardLauncherCategory=String(index);chip.textContent=group.label;chip.setAttribute('aria-pressed',String(index===selected));chips.appendChild(chip)});
    wrap.appendChild(chips);
    addButton(native.querySelector('[data-gd-native-random="'+selected+'"]'),'gd-launch-category-random');
    wrap.appendChild(label('Or choose a question'));
    const cards=doc.createElement('div');cards.className='gd-challenge-cards';
    for(const button of clone.querySelectorAll('[data-'+prefix+'-challenge-mode]')){
      if(!groups[selected]?.ids.includes(button.getAttribute('data-'+prefix+'-challenge-mode')))continue;
      button.classList.remove('gd-btn--primary');button.classList.add('gd-launch-native-type');cards.appendChild(button)
    }
    wrap.appendChild(cards);
  }else if(clone.querySelector('#ab-history-challenge')){
    const button=clone.querySelector('#ab-history-challenge');button.textContent='Random challenge';addButton(button,'gd-launch-all');
    const ops=[...clone.querySelectorAll('[data-ab-history-operation]')];if(ops.length){wrap.appendChild(label('Or choose an operation'));const cards=doc.createElement('div');cards.className='gd-challenge-cards';ops.forEach(op=>{op.classList.add('gd-launch-native-type');cards.appendChild(op)});wrap.appendChild(cards)}
  }else{
    // An authored custom task can remain intact while its standard tab is reopened.
    const standard=clone.querySelector('.gd-challenge-tab:not(.is-active)[data-board-control-index]');
    if(standard&&/standard/i.test(standard.textContent)){standard.textContent='Browse standard challenges';addButton(standard,'gd-launch-all')}
    else wrap.appendChild(label('Challenge options are available in settings.'));
  }
  const advanced=doc.createElement('button');advanced.type='button';advanced.className='gd-launch-settings';advanced.dataset.boardLauncherSettings='1';advanced.textContent='Challenge settings';wrap.appendChild(advanced);
  return wrap;
}
function renderFloatingControls(obj){
  if(floatingPanelMode==='help')return;
  if(!floatingControls||!floatingControlsBody||!obj||!obj.settingsOpen||floatingControlObjectId!==obj.id)return;
  const source=sourceControls(obj);if(!source){if(floatingPanelMode==='money-palette')closeFloatingControls(obj.id);return}
  if(floatingControls){floatingControls.dataset.tool=obj.toolId||'';floatingControls.classList.toggle('is-money-palette',floatingPanelMode==='money-palette')}
  const sourceInputs=[...source.querySelectorAll(CONTROL_SELECTOR)];
  let clone=source.cloneNode(true);
  clone.removeAttribute('id');clone.removeAttribute('aria-hidden');clone.removeAttribute('hidden');clone.classList.add('gd-board-controls-proxy');
  // Stamp identity on the complete clone BEFORE pruning controls.
  // Array offsets after pruning are not equivalent to the source positions.
  [...clone.querySelectorAll(CONTROL_SELECTOR)].forEach((node,index)=>{
    const original=sourceInputs[index];if(!original)return;
    node.dataset.boardControlIndex=String(index);
    if('value' in original)node.value=original.value;
    if('checked' in original)node.checked=original.checked;
    if(original.isContentEditable)node.innerHTML=original.innerHTML;
  });
  if(obj.toolId==='place-value'){
    if(floatingPanelMode==='challenge')clone.querySelector('.pv-mode-tabs')?.remove();
    else clone.querySelectorAll('[data-pv-workflow="challenge"],[data-pv-workflow="export"]').forEach(n=>n.remove());
  }
  if(obj.toolId==='abacus'&&floatingPanelMode!=='challenge')clone.querySelectorAll('[data-ab-workflow="challenge"],[data-ab-workflow="export"]').forEach(n=>n.remove());
  clone.querySelectorAll('#nl-fullscreen,.gd-embed-workflow-hidden[id$="-fullscreen"]').forEach(node=>node.remove());
  const compact=floatingPanelMode==='challenge';
  floatingControls.classList.toggle('is-challenge-launcher',compact);
  if(compact)clone=compactChallengeControls(clone,obj);
  // Use a signature that includes property values (not just innerHTML).
  const signature=JSON.stringify([obj.id,floatingPanelMode,floatingPanelMode==='money-palette'?'denominations':clone.innerHTML,sourceInputs.map(n=>[n.value,n.checked,n.disabled,n.isContentEditable?n.innerHTML:null])]);
  const structure=JSON.stringify(sourceInputs.map(n=>[n.tagName,n.id,n.type,n.name,{...n.dataset},n.tagName==='BUTTON'?n.textContent:null]));
  if(signature===floatingControlSignature&&floatingControlsBody.firstElementChild){floatingControlSources=sourceInputs;return}
  // Preserve an active input only when the new source has the same control identities.
  const active=document.activeElement;
  if(structure===floatingControlStructure&&floatingControlsBody.contains(active)&&active.matches('input,textarea,[contenteditable="true"]')&&active.type!=='button'){
    floatingControlSources=sourceInputs;return;
  }
  floatingControlSources=sourceInputs;floatingControlStructure=structure;
  const scroll=floatingControlsBody.scrollTop;
  floatingControlsBody.replaceChildren(clone);
  floatingControlSignature=signature;
  floatingControlsBody.scrollTop=scroll;
  const tool=tools.find(t=>t.id===obj.toolId);
  if(floatingControlsTitle)floatingControlsTitle.textContent=floatingPanelMode==='money-palette'?'Add money':(tool?.title||'Manipulative')+(floatingPanelMode==='challenge'?' · Challenge':floatingPanelMode==='challenge-settings'?' · Challenge settings':' settings');
  floatingControls.hidden=false;
  requestAnimationFrame(positionFloatingControls);
}
function renderFloatingHelp(obj,data){
  if(!floatingControls||!floatingControlsBody||!obj||!data)return;
  floatingPanelMode='help';floatingHelpData=data;floatingControlSignature='';floatingControlSources=[];floatingControlStructure='';
  if(floatingControls)floatingControls.dataset.tool=obj.toolId||'';
  floatingControls.classList.remove('is-challenge-launcher','is-money-palette');floatingControls.classList.add('is-help');
  floatingControlsBody.replaceChildren();
  const wrap=document.createElement('div');wrap.className='gd-board-help-panel';
  const intro=document.createElement('p');intro.className='gd-board-help-intro';intro.textContent=String(data.intro||'');wrap.appendChild(intro);
  if(Array.isArray(data.steps)&&data.steps.length){
    const ol=document.createElement('ol');ol.className='gd-board-help-steps';
    data.steps.forEach(step=>{const li=document.createElement('li');li.textContent=String(step);ol.appendChild(li)});
    wrap.appendChild(ol);
  }
  if(data.example){
    const box=document.createElement('div');box.className='gd-board-help-example';
    const strong=document.createElement('strong');strong.textContent='Worked example';
    const p=document.createElement('p');p.textContent=String(data.example);
    box.append(strong,p);wrap.appendChild(box);
  }
  if(data.history){
    const details=document.createElement('details');details.className='gd-board-help-history';
    const summary=document.createElement('summary');summary.textContent='History';
    const p=document.createElement('p');p.textContent=String(data.history);
    details.append(summary,p);wrap.appendChild(details);
  }
  floatingControlsBody.appendChild(wrap);
  if(floatingControlsTitle)floatingControlsTitle.textContent=(data.title||'Manipulative')+' · How to use';
  floatingControls.hidden=false;
  requestAnimationFrame(positionFloatingControls);
}
function openFloatingHelp(obj,data){
  if(!obj||!data)return;
  if(floatingControlObjectId!=null&&String(floatingControlObjectId)!==String(obj.id)){
    const previous=objectById(floatingControlObjectId);if(previous)previous.settingsOpen=false;
  }
  floatingControlObjectId=obj.id;obj.settingsOpen=true;floatingPanelMode='help';floatingHelpData=data;
  const frame=frameFor(obj.id);frame?.classList.add('has-settings');
  floatingControls?.classList.add('is-help');
  const rect=frame?.getBoundingClientRect(),host=board.getBoundingClientRect();
  if(rect&&!floatingControlMoved){
    floatingControlX=Math.min(board.clientWidth-350,Math.max(58,rect.right-host.left+14));
    floatingControlY=Math.max(12,Math.min(board.clientHeight-360,rect.top-host.top));
  }
  positionFloatingControls();renderFloatingHelp(obj,data);
}
function refreshFloatingControls(obj,delay=0){
  if(!obj||!obj.settingsOpen||floatingControlObjectId!==obj.id)return;
  setTimeout(()=>renderFloatingControls(obj),delay);
}
function openFloatingControls(obj,mode='settings'){
  if(!obj)return;
  floatingHelpData=null;floatingControls?.classList.remove('is-help');
  floatingPanelMode=['challenge','challenge-settings','money-palette'].includes(mode)?mode:'settings';
  floatingControls?.classList.toggle('is-money-palette',floatingPanelMode==='money-palette');
  floatingControls?.classList.toggle('is-challenge-launcher',floatingPanelMode==='challenge');
  if(obj.toolId==='place-value'&&floatingPanelMode==='settings'){
    const source=sourceControls(obj),active=source?.querySelector('[data-pv-workflow].gd-btn--primary')?.dataset?.pvWorkflow;
    if(active==='challenge'||active==='export')source?.querySelector('[data-pv-workflow="setup"]')?.click();
  }
  if(obj.toolId==='abacus'&&floatingPanelMode==='settings'){
    const source=sourceControls(obj),active=source?.querySelector('[data-ab-workflow].gd-btn--primary')?.dataset?.abWorkflow;
    if(active==='challenge'||active==='export')source?.querySelector('[data-ab-workflow="setup"]')?.click();
  }
  if(floatingControlObjectId!=null&&String(floatingControlObjectId)!==String(obj.id)){
    const previous=objectById(floatingControlObjectId);if(previous)previous.settingsOpen=false;
  }
  floatingControlObjectId=obj.id;obj.settingsOpen=true;
  const frame=frameFor(obj.id);frame?.classList.add('has-settings');
  const tool=tools.find(t=>t.id===obj.toolId);
  if(floatingControlsTitle)floatingControlsTitle.textContent=floatingPanelMode==='money-palette'?'Add money':(tool?.title||'Manipulative')+(floatingPanelMode==='challenge'?' · Challenge':floatingPanelMode==='challenge-settings'?' · Challenge settings':' settings');
  if(floatingControls)floatingControls.hidden=false;
  const rect=frame?.getBoundingClientRect(),host=board.getBoundingClientRect();
  if(rect&&(floatingPanelMode==='challenge'||!floatingControlMoved)){
    const trigger=floatingPanelMode==='challenge'?frame.querySelector('[data-board-inner-action][aria-label="Choose a challenge"]'):null;
    if(trigger){const tr=trigger.getBoundingClientRect();floatingControlX=tr.right-host.left-320;floatingControlY=tr.bottom-host.top+8}
    else{
    const right=rect.right-host.left+14,left=rect.left-host.left-310;
    const preferredX=floatingPanelMode==='money-palette'?(right+300<=board.clientWidth?right:left>=8?left:Math.max(8,board.clientWidth-310)):Math.min(board.clientWidth-330,Math.max(58,right));
    const preferredY=Math.max(12,Math.min(board.clientHeight-280,rect.top-host.top));
    floatingControlX=preferredX;floatingControlY=preferredY;
    }
  }
  positionFloatingControls();
  renderFloatingControls(obj);
  [0,30,90].forEach(delay=>refreshFloatingControls(obj,delay));
}
function closeFloatingControls(id=null){
  const target=id==null?objectById(floatingControlObjectId):objectById(id);
  if(target){target.settingsOpen=false;frameFor(target.id)?.classList.remove('has-settings')}
  if(id==null||String(floatingControlObjectId)===String(id)){
    floatingControlObjectId=null;floatingHelpData=null;floatingPanelMode='settings';floatingControlSources=[];floatingControlSignature='';floatingControlStructure='';
    if(floatingControls){floatingControls.classList.remove('is-help','is-challenge-launcher','is-money-palette');delete floatingControls.dataset.tool;floatingControls.hidden=true;floatingControlsBody?.replaceChildren()}
  }
}
function floatingOriginal(index){
  const obj=objectById(floatingControlObjectId),source=obj&&sourceControls(obj);
  if(!source)return{obj:null,node:null};
  const node=floatingPanelMode==='money-palette'?source.querySelectorAll(CONTROL_SELECTOR)[Number(index)]:floatingControlSources[Number(index)];
  return{obj,node:node&&source.contains(node)?node:null};
}
function measuredStageContentHeight(stage){
  // Measure the natural flow at the current width, without the iframe height
  // influencing flex auto margins, alignments or viewport-sized stage boxes.
  const saved=['height','bottom','min-height','max-height'].map(key=>[key,stage.style.getPropertyValue(key),stage.style.getPropertyPriority(key)]);
  try{
    stage.style.setProperty('height','max-content','important');
    stage.style.setProperty('bottom','auto','important');
    stage.style.setProperty('min-height','0','important');
    stage.style.setProperty('max-height','none','important');
    const rect=stage.getBoundingClientRect(),view=stage.ownerDocument.defaultView,style=view.getComputedStyle(stage);
    const padBottom=parseFloat(style.paddingBottom)||0;
    let bottom=0;
    [...stage.children].forEach(child=>{
      const cs=view.getComputedStyle(child);
      if(cs.display==='none'||cs.visibility==='hidden'||cs.position==='absolute'||cs.position==='fixed')return;
      const cr=child.getBoundingClientRect();
      if(cr.width<=0&&cr.height<=0)return;
      bottom=Math.max(bottom,cr.bottom-rect.top+(parseFloat(cs.marginBottom)||0));
    });
    return Math.ceil(Math.max(rect.height,bottom+padBottom));
  }finally{saved.forEach(([key,value,priority])=>{if(value)stage.style.setProperty(key,value,priority);else stage.style.removeProperty(key)})}
}
function fitEmbeddedObject(obj,initial=false){
  const frame=frameFor(obj?.id),doc=innerDocument(obj);if(!frame||!doc)return;
  const stage=doc.getElementById('gd-stage');if(!stage)return;
  const neededW=Math.ceil(Math.max(stage.clientWidth,stage.scrollWidth));
  const naturalH=AUTO_SHRINK_HEIGHT_TOOLS.has(obj.toolId)?measuredStageContentHeight(stage):Math.max(stage.clientHeight,stage.scrollHeight);
  const neededH=Math.ceil(Math.max(180,naturalH));
  const nextBaseW=clamp(Math.max(obj.baseW,neededW),220,1200);
  const nextBaseH=clamp(AUTO_SHRINK_HEIGHT_TOOLS.has(obj.toolId)?neededH:Math.max(obj.baseH,neededH),180,1400);
  const widthChanged=nextBaseW>obj.baseW+2;
  const heightChanged=AUTO_SHRINK_HEIGHT_TOOLS.has(obj.toolId)?Math.abs(nextBaseH-obj.baseH)>2:nextBaseH>obj.baseH+2;
  if(!widthChanged&&!heightChanged)return;
  obj.baseW=nextBaseW;obj.baseH=nextBaseH;
  if(initial){
    const narrow=viewport.clientWidth<620;
    const availableW=Math.max(220,viewport.clientWidth-(narrow?72:110));
    const availableH=Math.max(180,viewport.clientHeight-90);
    const fitScale=clamp(Math.floor(Math.min(1,availableW/obj.baseW,availableH/obj.baseH)*20)/20,.35,1);
    obj.scale=Math.min(obj.scale,fitScale);
  }
  const boardMaxScale=Math.min((BOARD_W-obj.x)/obj.baseW,(BOARD_H-obj.y)/obj.baseH,2);
  obj.scale=clamp(Math.min(obj.scale,boardMaxScale),.35,2);
  obj.w=Math.round(obj.baseW*obj.scale);obj.h=Math.round(obj.baseH*obj.scale);
  positionObject(obj);
}
function syncQuickActions(obj){
  const frame=frameFor(obj?.id),rail=frame?.querySelector('[data-board-quick-actions]');if(!rail)return;
  const actions=QUICK_ACTIONS[obj.toolId]||[];
  const available=actions.map((action,index)=>({action,index,node:innerTarget(obj,action.selector,!!action.allowHidden)})).filter(x=>x.node);
  const markup=available.map(({action,index,node})=>{
    const label=action.checkedLabel&&'checked' in node?(node.checked?action.checkedLabel:(action.uncheckedLabel||action.label)):(action.dynamicLabel?(node.textContent||action.label).trim():action.label);
    return '<button type="button" data-board-inner-action="'+index+'"'+(action.danger?' class="is-danger"':'')+' aria-label="'+esc(action.title||label)+'" title="'+esc(action.title||label)+'">'+esc(label)+'</button>';
  }).join('');
  if(rail._tt99Markup!==markup){rail.innerHTML=markup;rail._tt99Markup=markup}
  rail.classList.toggle('is-empty',available.length===0);
  syncHistoryActions(obj);
}
function syncHistoryActions(obj){
  const frame=frameFor(obj?.id);if(!frame)return;
  ['undo','redo'].forEach(kind=>{
    const button=frame.querySelector('[data-board-history="'+kind+'"]');
    if(!button)return;
    const target=innerTarget(obj,HISTORY_SELECTORS[kind],true);
    button.hidden=!target;
    button.disabled=!target;
  });
}
function connectInnerObject(obj){
  const frame=frameFor(obj.id),iframe=frame?.querySelector('iframe');if(!iframe)return;
  function connect(){
    const doc=innerDocument(obj),stage=doc?.getElementById('gd-stage');
    if(!doc||!stage)return;
    const previous=innerConnections.get(obj.id);
    if(previous?.doc===doc)return;
    previous?.dispose();
    let pending=0,settleTimer=0,disposed=false,initial=!obj.restored;
    const observed=new Set();
    const controls=doc.getElementById('gd-controls');
    const ro=typeof ResizeObserver==='function'?new ResizeObserver(()=>queueFit()):null;
    const mo=typeof MutationObserver==='function'?new MutationObserver(records=>{
      if(records.some(r=>r.target===stage&&r.type==='childList'))observeChildren();
      queueFit();
    }):null;
    function observeChildren(){
      if(!ro)return;
      const next=new Set([stage,...stage.children]);
      observed.forEach(n=>{if(!next.has(n)){ro.unobserve(n);observed.delete(n)}});
      next.forEach(n=>{if(!observed.has(n)){ro.observe(n);observed.add(n)}});
    }
    function valid(){return !disposed&&frameFor(obj.id)===frame&&innerDocument(obj)===doc}
    function measure(){
      if(!valid())return;
      fitEmbeddedObject(obj,initial);initial=false;
      syncQuickActions(obj);
      if(obj.settingsOpen&&floatingPanelMode!=='help')renderFloatingControls(obj);
    }
    function queueFit(){
      if(!valid()||pending)return;
      pending=requestAnimationFrame(()=>{
        pending=0;if(!valid())return;measure();
        // ResizeObserver catches subsequent layout and font changes. Only use
        // a fallback trailing measurement when that API is unavailable.
        if(!ro){clearTimeout(settleTimer);settleTimer=setTimeout(measure,80)}
      });
    }
    function dispose(){
      disposed=true;clearTimeout(settleTimer);if(pending)cancelAnimationFrame(pending);
      ro?.disconnect();mo?.disconnect();events.forEach(type=>doc.removeEventListener(type,queueFit,true));
    }
    const events=['click','pointerup','change'];
    innerConnections.set(obj.id,{doc,dispose});
    events.forEach(type=>doc.addEventListener(type,queueFit,true));
    observeChildren();
    mo?.observe(stage,{childList:true,subtree:true,characterData:true});
    if(controls)mo?.observe(controls,{childList:true,subtree:true,characterData:true});
    queueFit();
  }
  iframe.addEventListener('load',connect);
  connect();
}

function sendSettings(obj,open,mode='settings'){
  if(!obj)return;
  const frame=frameFor(obj.id),iframe=frame?.querySelector('iframe');
  if(open)openFloatingControls(obj,mode);else closeFloatingControls(obj.id);
  if(iframe?.contentWindow)iframe.contentWindow.postMessage({type:'tt99-board-settings',open:false},location.origin);
}
function closeContext(obj){
  obj.menuOpen=false;
  frameFor(obj.id)?.classList.remove('has-context-menu');
}
function selectObject(id){
  const next=objectById(id);
  if(selectedId!=null&&String(selectedId)!==String(id)){
    const previous=objectById(selectedId);
    if(previous){sendSettings(previous,false);closeContext(previous)}
  }
  selectedId=next?next.id:null;
  if(next){next.z=++zCounter}
  objects.forEach(obj=>{
    const frame=frameFor(obj.id);
    const selected=!!next&&obj.id===next.id;
    frame?.classList.toggle('is-selected',selected);
    frame?.setAttribute('aria-selected',selected?'true':'false');
    if(selected)frame.style.zIndex=String(obj.z);
  });
}
function deselect(){
  if(selectedId!=null){
    const current=objectById(selectedId);
    if(current){sendSettings(current,false);closeContext(current)}
  }
  selectedId=null;
  canvas.querySelectorAll('.gd-board-object').forEach(el=>{el.classList.remove('is-selected','has-context-menu','has-settings','has-export-menu');el.setAttribute('aria-selected','false')});
}
function positionObject(obj){
  const frame=frameFor(obj.id);if(!frame)return;
  frame.style.left=obj.x+'px';frame.style.top=obj.y+'px';
  frame.style.width=obj.w+'px';frame.style.height=obj.h+'px';
  frame.style.zIndex=String(obj.z);
  frame.style.setProperty('--gd-board-base-w',obj.baseW+'px');
  frame.style.setProperty('--gd-board-base-h',obj.baseH+'px');
  frame.style.setProperty('--gd-board-scale',String(obj.scale));
}
function objectMarkup(obj,tool){
  const embedPath=window.TT99_GOODIES_BOARD_EMBED_PATH||location.pathname;
  const query=new URLSearchParams({embed:'1'});
  // Tie iframe navigation to the deployed parent build, not a stale cached /goodies/ page.
  const build=String(window.TT99_GOODIES_BUILD||'');if(build)query.set('build',build);
  if(tool.id==='clock'){
    query.set('clockStart',String(Array.isArray(obj.clockSlots)&&obj.clockSlots.length?obj.clockSlots[0]:0));
    query.set('boardObject',String(obj.id));
  }
  const src=embedPath+'?'+query.toString()+'#'+encodeURIComponent(tool.id);
  return '<section class="gd-board-object is-selected" data-board-object="'+obj.id+'" data-tool-id="'+esc(tool.id)+'" aria-label="'+esc(tool.title)+'" aria-selected="true">'+
    '<iframe class="gd-board-object-iframe" src="'+src+'" title="'+esc(tool.title)+'"></iframe>'+
    '<button type="button" class="gd-board-object-cover" data-board-select="'+obj.id+'" aria-label="Select '+esc(tool.title)+'"></button>'+
    '<button type="button" class="gd-board-move-handle" data-board-move="'+obj.id+'" aria-label="Move '+esc(tool.title)+'" title="Move"><span></span><span></span><span></span></button>'+
    '<button type="button" class="gd-board-context-trigger" data-board-context="'+obj.id+'" aria-label="Object menu" title="Object menu">'+iconSvg('more')+'</button>'+
    '<button type="button" class="gd-board-export-direct" data-board-export="'+obj.id+'" aria-label="Export '+esc(tool.title)+'" title="Export for worksheet or print">'+iconSvg('export')+'</button>'+
    '<button type="button" class="gd-board-delete-direct" data-board-delete="'+obj.id+'" aria-label="Delete '+esc(tool.title)+'" title="Delete">'+iconSvg('trash')+'</button>'+
    '<div class="gd-board-export-menu" data-board-export-menu role="menu" aria-label="Export '+esc(tool.title)+'">'+
      '<button type="button" data-board-export-kind="copy" role="menuitem">Copy</button>'+
      '<button type="button" data-board-export-kind="png" role="menuitem">PNG</button>'+
      '<button type="button" data-board-export-kind="svg" role="menuitem">SVG</button>'+
      '<button type="button" data-board-export-kind="print" role="menuitem">Print</button>'+
    '</div>'+
    '<div class="gd-board-quick-actions is-empty" data-board-quick-actions aria-label="'+esc(tool.title)+' quick actions"></div>'+
    '<div class="gd-board-context-menu" role="menu" aria-label="'+esc(tool.title)+' controls">'+
      '<button type="button" data-board-history="undo" role="menuitem" aria-label="Undo" title="Undo" hidden>'+iconSvg('undo')+'</button>'+
      '<button type="button" data-board-history="redo" role="menuitem" aria-label="Redo" title="Redo" hidden>'+iconSvg('redo')+'</button>'+
      '<button type="button" data-board-settings="'+obj.id+'" role="menuitem" aria-label="Settings" title="Settings">'+iconSvg('settings')+'</button>'+
      '<button type="button" data-board-lock="'+obj.id+'" role="menuitem" aria-label="Lock position" title="Lock position">'+iconSvg('lock')+'</button>'+
    '</div>'+
    '<button type="button" class="gd-board-resize-handle" data-board-resize="'+obj.id+'" aria-label="Resize '+esc(tool.title)+'" title="Resize"></button>'+
  '</section>';
}
function addObject(toolId){
  const tool=tools.find(t=>t.id===toolId);if(!tool)return;
  const [baseW,baseH]=defaults[tool.id]||[650,520];
  const narrow=viewport.clientWidth<620;
  const availableW=Math.max(220,viewport.clientWidth-(narrow?72:110));
  const availableH=Math.max(180,viewport.clientHeight-90);
  let scale=Math.min(1,availableW/baseW,availableH/baseH);
  scale=clamp(Math.round(scale*20)/20,.4,1);
  const w=Math.round(baseW*scale),h=Math.round(baseH*scale);
  const i=objects.length,obj={
    id:nextId++,toolId:tool.id,baseW,baseH,scale,
    x:snapped((narrow?55:90)+(i%5)*40+viewport.scrollLeft),
    y:snapped((narrow?45:80)+(i%4)*40+viewport.scrollTop),
    w,h,z:++zCounter,locked:false,menuOpen:false,settingsOpen:false
  };
  if(tool.id==='clock')obj.clockSlots=[nextClockSlot()];
  objects.push(obj);
  if(selectedId!=null)deselect();
  canvas.insertAdjacentHTML('beforeend',objectMarkup(obj,tool));
  positionObject(obj);
  selectObject(obj.id);
  bindObject(obj);
  connectInnerObject(obj);
}
const LIBRARY_KEY='tt99-whiteboard-lessons-v1';
let libraryBusy=false;
const libraryDialog=document.getElementById('gd-board-library'),libraryStatus=document.getElementById('gd-board-library-status');
function libraryMessage(message){libraryStatus.textContent=String(message)}
function readLibrary(){const value=JSON.parse(localStorage.getItem(LIBRARY_KEY)||'[]');if(!Array.isArray(value))throw new Error('The saved-board library is unreadable.');return value}
function writeLibrary(entries){localStorage.setItem(LIBRARY_KEY,JSON.stringify(entries))}
function captureBoard(){
  if(objects.length>60)throw new Error('A saved board can contain up to 60 objects.');
  return {version:1,snapOn,viewport:{left:viewport.scrollLeft,top:viewport.scrollTop},objects:objects.map(obj=>{
    const api=innerDocument(obj)?.defaultView?.TT99Goodies?.lessonState;
    if(!api?.supports(obj.toolId))throw new Error((tools.find(t=>t.id===obj.toolId)?.title||obj.toolId)+' is still loading or does not support saved boards yet. Nothing was saved.');
    const {toolId,x,y,baseW,baseH,scale,locked,z,clockSlots}=obj;
    return {toolId,x,y,baseW,baseH,scale,locked,z,clockSlots,state:api.capture(toolId)};
  })};
}
function validateBoard(saved){
  if(saved?.version!==1||!Array.isArray(saved.objects)||saved.objects.length>60)throw new Error('Unsupported saved board format.');
  for(const o of saved.objects){
    if(!tools.some(t=>t.id===o.toolId)||o.state?.version!==1||o.state.tool!==o.toolId||!o.state.model)throw new Error('This board contains an unsupported widget.');
    if(!['x','y','baseW','baseH','scale','z'].every(k=>Number.isFinite(o[k]))||o.x<0||o.y<0||o.x>BOARD_W||o.y>BOARD_H||o.baseW<100||o.baseW>1200||o.baseH<100||o.baseH>1400||o.scale<.35||o.scale>2)throw new Error('Invalid saved widget dimensions.');
  }return saved;
}
async function restoreBoard(saved){
  validateBoard(saved);if(libraryBusy)throw new Error('A board is already opening.');libraryBusy=true;
  const original=objects.slice(),added=[],previousSelected=selectedId,previousScroll={left:viewport.scrollLeft,top:viewport.scrollTop};
  try{
    for(const record of saved.objects.slice().sort((a,b)=>a.z-b.z)){
      const tool=tools.find(t=>t.id===record.toolId);
      const obj={id:nextId++,toolId:record.toolId,x:record.x,y:record.y,baseW:record.baseW,baseH:record.baseH,scale:record.scale,locked:!!record.locked,z:++zCounter,menuOpen:false,settingsOpen:false,w:Math.round(record.baseW*record.scale),h:Math.round(record.baseH*record.scale),restored:true};
      if(tool.id==='clock')obj.clockSlots=Array.isArray(record.clockSlots)?record.clockSlots.slice(0,4):[nextClockSlot()];
      added.push(obj);objects.push(obj);canvas.insertAdjacentHTML('beforeend',objectMarkup(obj,tool));
      const frame=frameFor(obj.id);frame.style.visibility='hidden';frame.classList.remove('is-selected');frame.setAttribute('aria-selected','false');positionObject(obj);bindObject(obj);
      const iframe=frame.querySelector('iframe');
      await new Promise((resolve,reject)=>{
        let timer=null,timeout=null;function stop(){clearInterval(timer);clearTimeout(timeout)}
        function ready(){try{const api=iframe.contentWindow?.TT99Goodies?.lessonState;if(!api?.supports(obj.toolId))return;stop();api.restore(obj.toolId,record.state);resolve()}catch(err){stop();reject(err)}}
        timer=setInterval(ready,30);timeout=setTimeout(()=>{stop();reject(new Error(tool.title+' could not be restored.'))},8000);ready();
      });
    }
    original.forEach(o=>removeObject(o.id));deselect();
    for(const obj of added){const frame=frameFor(obj.id);frame.style.visibility='';if(obj.locked){obj.locked=false;toggleLock(obj.id)}connectInnerObject(obj)}
    snapOn=saved.snapOn!==false;const button=document.getElementById('gd-board-snap');button.classList.toggle('is-active',snapOn);button.setAttribute('aria-pressed',String(snapOn));board.classList.toggle('is-snap-off',!snapOn);
    viewport.scrollLeft=Math.max(0,Number(saved.viewport?.left)||0);viewport.scrollTop=Math.max(0,Number(saved.viewport?.top)||0);return true;
  }catch(err){added.forEach(o=>removeObject(o.id));if(previousSelected!=null)selectObject(previousSelected);viewport.scrollLeft=previousScroll.left;viewport.scrollTop=previousScroll.top;throw err}
  finally{libraryBusy=false}
}
function renderLibrary(){
  const list=document.getElementById('gd-board-library-list');list.replaceChildren();
  let entries;try{entries=readLibrary()}catch(err){libraryMessage(err.message);return}
  if(!entries.length){const p=document.createElement('p');p.textContent='No saved boards yet.';list.append(p);return}
  for(const entry of entries){
    const row=document.createElement('div');row.className='gd-board-library-row';
    const title=document.createElement('span');title.textContent=entry.name;
    const info=document.createElement('small');info.textContent=(entry.board?.objects?.length||0)+' objects';
    const copy=document.createElement('div');copy.append(title,info);
    const open=document.createElement('button');open.type='button';open.className='gd-btn';open.textContent='Open';
    open.onclick=async()=>{if(libraryBusy)return;if(objects.length&&!window.confirm('Replace the current board with "'+entry.name+'"?'))return;libraryMessage('Opening '+entry.name+'…');open.disabled=true;
      try{await restoreBoard(entry.board);libraryDialog.close();boardHint('Opened '+entry.name)}catch(err){libraryMessage(err.message+' Your previous board has been kept.')}finally{open.disabled=false}};
    const del=document.createElement('button');del.type='button';del.className='gd-btn';del.textContent='Delete';del.setAttribute('aria-label','Delete saved board '+entry.name);
    del.onclick=()=>{if(libraryBusy||!window.confirm('Delete saved board "'+entry.name+'"?'))return;try{writeLibrary(readLibrary().filter(e=>e.name!==entry.name));renderLibrary();libraryMessage('Saved board deleted.')}catch(err){libraryMessage(err.message)}};
    row.append(copy,open,del);list.append(row);
  }
}
document.getElementById('gd-board-saved').onclick=()=>{libraryMessage('');renderLibrary();if(!libraryDialog.open)libraryDialog.showModal()};
libraryDialog.addEventListener('cancel',e=>{if(libraryBusy)e.preventDefault()});
libraryDialog.querySelector('[data-board-library-close]').onclick=()=>{if(!libraryBusy)libraryDialog.close()};
document.getElementById('gd-board-save-current').onclick=()=>{
  if(libraryBusy)return;
  const name=document.getElementById('gd-board-save-name').value.trim().slice(0,80);
  if(!name){libraryMessage('Enter a name for your board.');return}if(!objects.length){libraryMessage('Add a manipulative before saving.');return}
  try{const snapshot=captureBoard(),entries=readLibrary();if(entries.some(e=>e.name===name)&&!window.confirm('Replace the saved board "'+name+'"?'))return;
    writeLibrary([{name,board:snapshot},...entries.filter(e=>e.name!==name)]);renderLibrary();libraryMessage('Saved '+name+' in this browser.')}catch(err){libraryMessage(err.message)}
};
function removeObject(id){
  const obj=objectById(id);if(!obj)return;
  sendSettings(obj,false);
  innerConnections.get(obj.id)?.dispose();innerConnections.delete(obj.id);
  const index=objects.indexOf(obj);if(index>=0)objects.splice(index,1);
  frameFor(id)?.remove();
  if(selectedId===id)selectedId=null;
}
function toggleLock(id){
  const obj=objectById(id);if(!obj)return;
  obj.locked=!obj.locked;obj.menuOpen=false;
  const frame=frameFor(id);frame?.classList.toggle('is-locked',obj.locked);frame?.classList.remove('has-context-menu');
  const button=frame?.querySelector('[data-board-lock]');
  if(button){
    button.innerHTML=iconSvg(obj.locked?'unlock':'lock');
    button.setAttribute('aria-label',obj.locked?'Unlock position':'Lock position');
    button.title=obj.locked?'Unlock position':'Lock position';
  }
}
function toggleContext(id){
  const obj=objectById(id);if(!obj)return;
  selectObject(id);
  obj.menuOpen=!obj.menuOpen;
  frameFor(id)?.classList.toggle('has-context-menu',obj.menuOpen);
}
function workflowExportButton(doc){
  const buttons=[...doc.querySelectorAll('#gd-controls button')];
  return buttons.find(button=>[...button.attributes].some(attr=>/-workflow$/.test(attr.name)&&attr.value==='export'))||
    buttons.find(button=>/^export(?:\s|\/|$)/i.test(button.textContent.trim()));
}
function currentWorkflowButton(doc){
  const buttons=[...doc.querySelectorAll('#gd-controls [role="tablist"][aria-label$="workflow"] button')];
  return buttons.find(button=>button.classList.contains('gd-btn--primary'))||null;
}
function exportActionButton(doc,kind){
  const buttons=[...doc.querySelectorAll('#gd-controls button')].filter(button=>!button.disabled);
  const match={
    copy:/^copy\b/i,
    png:/^png$/i,
    svg:/^svg$/i,
    print:/^print/i
  }[kind];
  return buttons.find(button=>match?.test(button.textContent.trim()))||null;
}
function runPaperExport(obj,kind){
  const doc=innerDocument(obj);if(!doc){boardHint('This manipulative is still loading.');return false}
  const direct=doc.querySelector('[data-gd-direct-export="'+kind+'"]');
  if(direct&&!direct.disabled){direct.click();return true}
  const previous=currentWorkflowButton(doc),exportTab=workflowExportButton(doc);
  if(exportTab&&exportTab!==previous)exportTab.click();
  const action=exportActionButton(doc,kind);
  if(!action){
    if(previous&&exportTab&&previous!==exportTab)previous.click();
    boardHint('Paper export is not available for this manipulative yet.');
    return false;
  }
  action.click();
  if(previous&&exportTab&&previous!==exportTab)setTimeout(()=>previous.click(),0);
  return true;
}
function toggleExportMenu(id){
  const obj=objectById(id);if(!obj)return;
  selectObject(id);
  const frame=frameFor(id),open=!frame?.classList.contains('has-export-menu');
  canvas.querySelectorAll('.gd-board-object.has-export-menu').forEach(el=>el.classList.remove('has-export-menu'));
  frame?.classList.toggle('has-export-menu',open);
  frame?.classList.remove('has-context-menu');
  obj.menuOpen=false;
}
function toggleSettings(id){
  const obj=objectById(id);if(!obj)return;
  selectObject(id);
  const alreadySettings=obj.settingsOpen&&floatingControlObjectId===obj.id&&floatingPanelMode==='settings';
  sendSettings(obj,!alreadySettings);
  obj.menuOpen=false;frameFor(id)?.classList.remove('has-context-menu');
}
function bindObject(obj){
  const frame=frameFor(obj.id);if(!frame)return;
  const select=frame.querySelector('[data-board-select]');
  if(select)select.onclick=e=>{e.stopPropagation();selectObject(obj.id)};
  const context=frame.querySelector('[data-board-context]');
  if(context)context.onclick=e=>{e.stopPropagation();toggleContext(obj.id)};
  const settings=frame.querySelector('[data-board-settings]');
  if(settings)settings.onclick=e=>{e.stopPropagation();toggleSettings(obj.id)};
  const exportButton=frame.querySelector('[data-board-export]');
  if(exportButton)exportButton.onclick=e=>{e.stopPropagation();toggleExportMenu(obj.id)};
  const exportMenu=frame.querySelector('[data-board-export-menu]');
  if(exportMenu)exportMenu.onclick=e=>{
    const button=e.target.closest('[data-board-export-kind]');if(!button)return;
    e.preventDefault();e.stopPropagation();
    runPaperExport(obj,button.dataset.boardExportKind);
    frame.classList.remove('has-export-menu');
  };
  const lock=frame.querySelector('[data-board-lock]');
  if(lock)lock.onclick=e=>{e.stopPropagation();toggleLock(obj.id)};
  frame.querySelectorAll('[data-board-history]').forEach(button=>button.onclick=e=>{
    e.stopPropagation();
    const kind=button.dataset.boardHistory,target=innerTarget(obj,HISTORY_SELECTORS[kind],true);
    if(target){target.click();setTimeout(()=>{syncQuickActions(obj);syncHistoryActions(obj)},0)}
  });
  const del=frame.querySelector('[data-board-delete]');
  if(del)del.onclick=e=>{e.stopPropagation();removeObject(obj.id)};
  const quick=frame.querySelector('[data-board-quick-actions]');
  if(quick)quick.onclick=e=>{
    const button=e.target.closest('[data-board-inner-action]');if(!button)return;
    e.preventDefault();e.stopPropagation();
    const action=(QUICK_ACTIONS[obj.toolId]||[])[Number(button.dataset.boardInnerAction)];
    const target=action&&innerTarget(obj,action.selector,!!action.allowHidden);
    if(target){
      if(action.panelMode){
        if(obj.settingsOpen&&floatingControlObjectId===obj.id&&floatingPanelMode===action.panelMode){closeFloatingControls(obj.id);return}
        if(action.panelMode==='money-palette'){sendSettings(obj,true,'money-palette');return}
        if(!action.skipClickSelector||!target.matches(action.skipClickSelector)){const active=target.classList.contains('gd-btn--primary')||target.classList.contains('is-active')||target.getAttribute('aria-selected')==='true';if(!active)target.click()}
        setTimeout(()=>{sendSettings(obj,true,action.panelMode);syncQuickActions(obj)},0);
      }else if(action.openSettings){
        sendSettings(obj,true);setTimeout(()=>target.focus?.(),30)
      }else target.click();
      if(action.notice)boardHint(action.notice);
      setTimeout(()=>{syncQuickActions(obj);fitEmbeddedObject(obj,false)},0)
    }
  };

  const move=frame.querySelector('[data-board-move]');
  if(move)move.onpointerdown=e=>{
    if(obj.locked||e.button!==0)return;
    e.preventDefault();e.stopPropagation();selectObject(obj.id);
    drag={id:obj.id,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,x:obj.x,y:obj.y};
    try{move.setPointerCapture(e.pointerId)}catch(_){}
  };
  const size=frame.querySelector('[data-board-resize]');
  if(size)size.onpointerdown=e=>{
    if(obj.locked||e.button!==0)return;
    e.preventDefault();e.stopPropagation();selectObject(obj.id);
    resize={id:obj.id,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,w:obj.w,h:obj.h,scale:obj.scale,baseW:obj.baseW,baseH:obj.baseH};
    try{size.setPointerCapture(e.pointerId)}catch(_){}
  };
}

if(floatingControlsBody){
  floatingControlsBody.addEventListener('click',e=>{
    const launcherAction=e.target.closest('[data-board-launcher-settings],[data-board-launcher-category]');
    if(launcherAction){e.preventDefault();e.stopPropagation();const obj=objectById(floatingControlObjectId);if(!obj)return;if(launcherAction.hasAttribute('data-board-launcher-settings'))openFloatingControls(obj,'challenge-settings');else{obj.launcherCategory=Number(launcherAction.dataset.boardLauncherCategory);renderFloatingControls(obj)}return}
    const control=e.target.closest('[data-board-control-index]');if(!control)return;
    if(control.tagName!=='BUTTON'&&!(control.tagName==='INPUT'&&/^(button|submit|reset)$/i.test(control.type||'')))return;
    e.preventDefault();e.stopPropagation();
    const {obj,node}=floatingOriginal(control.dataset.boardControlIndex);if(!obj||!node)return;
    const launch=node.matches('[data-gd-random-scope],[data-gd-native-random],[data-pv-challenge-mode],[data-ab-challenge-mode],[data-ab-history-operation],#ab-history-challenge,[id$="-generate"]');
    const specific=floatingPanelMode==='challenge'&&[...node.attributes].find(a=>/^-?data-[a-z0-9-]+-challenge-type$/.test(a.name));
    if(specific){const prefix=specific.name.match(/^data-([a-z0-9-]+)-challenge-type$/)[1];node.click();const generate=sourceControls(obj)?.querySelector('#'+prefix+'-generate');if(generate&&!generate.disabled){generate.click();closeFloatingControls(obj.id)}}
    else{node.click();if(launch&&floatingPanelMode==='challenge')closeFloatingControls(obj.id);else if(floatingPanelMode==='money-palette')renderFloatingControls(obj)}
    setTimeout(()=>{syncQuickActions(obj);refreshFloatingControls(obj)},0);
  });
  const forwardValue=e=>{
    const control=e.target.closest('[data-board-control-index]');if(!control)return;
    const {obj,node}=floatingOriginal(control.dataset.boardControlIndex);if(!obj||!node)return;
    if('value' in node&&'value' in control)node.value=control.value;
    if('checked' in node&&'checked' in control)node.checked=control.checked;
    if(node.isContentEditable)node.innerHTML=control.innerHTML;
    node.dispatchEvent(new Event(e.type,{bubbles:true}));
    if(e.type==='change')setTimeout(()=>{syncQuickActions(obj);refreshFloatingControls(obj)},0);
  };
  floatingControlsBody.addEventListener('input',forwardValue);
  floatingControlsBody.addEventListener('change',forwardValue);
  floatingControlsBody.addEventListener('focusout',()=>{const obj=objectById(floatingControlObjectId);if(obj)refreshFloatingControls(obj,0)});
}
const floatingClose=floatingControls?.querySelector('[data-board-controls-close]');
if(floatingClose)floatingClose.onclick=e=>{e.preventDefault();e.stopPropagation();closeFloatingControls()};
const floatingHead=floatingControls?.querySelector('[data-board-controls-drag]');
if(floatingHead)floatingHead.onpointerdown=e=>{
  if(e.button!==0||e.target.closest('button'))return;
  e.preventDefault();e.stopPropagation();
  floatingControlDrag={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,x:floatingControlX,y:floatingControlY};
  floatingControlMoved=true;floatingControls.classList.add('is-dragging');
  try{floatingHead.setPointerCapture(e.pointerId)}catch(_){}
};

document.addEventListener('pointermove',e=>{
  if(floatingControlDrag&&floatingControlDrag.pointerId===e.pointerId){
    e.preventDefault();
    floatingControlX=floatingControlDrag.x+(e.clientX-floatingControlDrag.startX);
    floatingControlY=floatingControlDrag.y+(e.clientY-floatingControlDrag.startY);
    positionFloatingControls();return;
  }
  if(pan&&pan.pointerId===e.pointerId){
    e.preventDefault();
    viewport.scrollLeft=pan.scrollLeft-(e.clientX-pan.startX);
    viewport.scrollTop=pan.scrollTop-(e.clientY-pan.startY);
    if(Math.abs(e.clientX-pan.startX)>3||Math.abs(e.clientY-pan.startY)>3)pan.moved=true;
    return;
  }
  if(drag&&drag.pointerId===e.pointerId){
    const obj=objectById(drag.id);if(!obj)return;
    obj.x=clamp(snapped(drag.x+e.clientX-drag.startX),0,BOARD_W-obj.w);
    obj.y=clamp(snapped(drag.y+e.clientY-drag.startY),0,BOARD_H-obj.h);
    positionObject(obj);
  }
  if(resize&&resize.pointerId===e.pointerId){
    const obj=objectById(resize.id);if(!obj)return;
    const dx=e.clientX-resize.startX,dy=e.clientY-resize.startY;
    const sx=(resize.w+dx)/resize.baseW,sy=(resize.h+dy)/resize.baseH;
    let nextScale=Math.abs(dx/resize.baseW)>=Math.abs(dy/resize.baseH)?sx:sy;
    nextScale=clamp(nextScale,.35,2);
    if(snapOn)nextScale=Math.round(nextScale*20)/20;
    const maxScale=Math.min((BOARD_W-obj.x)/obj.baseW,(BOARD_H-obj.y)/obj.baseH,2);
    obj.scale=clamp(nextScale,.35,maxScale);
    obj.w=Math.round(obj.baseW*obj.scale);obj.h=Math.round(obj.baseH*obj.scale);
    positionObject(obj);
  }
});
function endPointer(e){
  if(floatingControlDrag&&floatingControlDrag.pointerId===e.pointerId){
    floatingControlDrag=null;floatingControls?.classList.remove('is-dragging');
  }
  if(pan&&pan.pointerId===e.pointerId){
    pan=null;board.classList.remove('is-panning');
  }
  if(drag&&drag.pointerId===e.pointerId)drag=null;
  if(resize&&resize.pointerId===e.pointerId)resize=null;
}
document.addEventListener('pointerup',endPointer);
document.addEventListener('pointercancel',endPointer);

canvas.addEventListener('pointerdown',e=>{
  if(e.target!==canvas)return;
  deselect();
  if(e.pointerType==='touch')return;
  if(e.button!==0)return;
  e.preventDefault();
  pan={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,scrollLeft:viewport.scrollLeft,scrollTop:viewport.scrollTop,moved:false};
  board.classList.add('is-panning');
  try{canvas.setPointerCapture(e.pointerId)}catch(_){}
});
document.querySelectorAll('[data-board-add]').forEach(button=>{
  button.addEventListener('click',()=>addObject(button.dataset.boardAdd));
  button.addEventListener('pointerenter',()=>showToolTip(button));
  button.addEventListener('pointerleave',hideToolTip);
  button.addEventListener('focus',()=>showToolTip(button));
  button.addEventListener('blur',hideToolTip);
});

document.getElementById('gd-board-back').onclick=()=>{if(objects.length&&!window.confirm('Leave this whiteboard? Changes made since your last save will be lost.'))return;location.href=window.TT99_GOODIES_BOARD_HOME||location.pathname};
document.getElementById('gd-board-snap').onclick=e=>{
  snapOn=!snapOn;e.currentTarget.classList.toggle('is-active',snapOn);e.currentTarget.setAttribute('aria-pressed',snapOn?'true':'false');
  board.classList.toggle('is-snap-off',!snapOn);
};
document.getElementById('gd-board-full').onclick=()=>{
  if(document.fullscreenElement===board){document.exitFullscreen?.();return}
  board.requestFullscreen?.().catch(()=>{});
};
document.addEventListener('fullscreenchange',()=>board.classList.toggle('is-fullscreen',document.fullscreenElement===board));
document.addEventListener('keydown',e=>{
  // The modal owns its keyboard interaction, including native Escape dismissal.
  // Never apply board shortcuts to a focused saved-board button or field.
  if(libraryDialog.open)return;
  const tag=(e.target?.tagName||'').toLowerCase();
  const editing=tag==='input'||tag==='textarea'||tag==='select'||e.target?.isContentEditable;
  if(e.key==='Escape'&&selectedId!=null){e.preventDefault();deselect();return}
  if(!editing&&selectedId!=null&&e.code==='Space'){
    const obj=objectById(selectedId);
    if(obj?.toolId==='randomiser'){
      const target=innerTarget(obj,'[data-ra-stage-go]',true);
      if(target&&!target.disabled){e.preventDefault();target.click();boardHint((target.textContent||'Go').trim())}
    }
  }
  if(!editing&&selectedId!=null&&(e.key==='Delete'||e.key==='Backspace')){e.preventDefault();removeObject(selectedId)}
});

window.addEventListener('message',event=>{
  if(event.origin!==location.origin||!event.data||typeof event.data!=='object')return;
  const frame=[...canvas.querySelectorAll('iframe')].find(x=>x.contentWindow===event.source);
  if(!frame)return;
  const host=frame.closest('.gd-board-object'),obj=host&&objectById(host.dataset.boardObject);
  if(event.data.type==='tt99-board-ready'){
    host?.classList.add('is-ready');if(obj)syncQuickActions(obj);return;
  }
  if(event.data.type==='tt99-board-help'&&obj&&event.data.help){
    selectObject(obj.id);openFloatingHelp(obj,event.data.help);return;
  }
});

G.compositionBoard={
  add:addObject,
  capture:captureBoard,
  restore:restoreBoard,
  select:selectObject,
  remove:removeObject,
  allocateClockSlot,
  releaseClockSlot,
  objects:()=>objects.map(({menuOpen,settingsOpen,...obj})=>({...obj})),
  viewport:()=>({left:viewport.scrollLeft,top:viewport.scrollTop}),
  isMounted:()=>true
};

})(window.TT99Goodies);
