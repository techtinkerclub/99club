(function(G){
'use strict';
if(!G)return;
const params=new URLSearchParams(location.search);
if(params.get('board')!=='1')return;

const root=G.root;
const tools=Array.isArray(G.toolCatalogue)?G.toolCatalogue:[];
const SNAP=10;
const BOARD_W=2800,BOARD_H=1800;
let nextId=1,selectedId=null,snapOn=true,zCounter=10,drag=null,resize=null;

const defaults={
  'number-line':[760,360],
  'place-value':[650,500],
  'fraction-wall':[680,540],
  'bar-model':[720,520],
  'hundred-square':[590,620],
  'multiplication-grid':[590,620],
  'array-builder':[640,540],
  'clock':[540,650],
  'money':[740,560],
  'coordinates':[680,570],
  'measurement':[760,440],
  'randomiser':[650,520],
  'balance':[740,580],
  'times-table':[700,580],
  'factors':[740,620],
  'fdp':[700,620],
  'geoboard':[650,680],
  'maths-canvas':[740,560]
};
const objects=[];

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function snapped(v){return snapOn?Math.round(v/SNAP)*SNAP:v}
function iconSvg(name){
  const paths={
    back:'<path d="m14 6-6 6 6 6"/>',
    full:'<path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4"/>',
    snap:'<circle cx="7" cy="7" r="1.2"/><circle cx="12" cy="7" r="1.2"/><circle cx="17" cy="7" r="1.2"/><circle cx="7" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="17" cy="12" r="1.2"/><circle cx="7" cy="17" r="1.2"/><circle cx="12" cy="17" r="1.2"/><circle cx="17" cy="17" r="1.2"/>',
    settings:'<path d="M5 7h8M17 7h2M11 12h8M5 12h2M5 17h5M14 17h5"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="12" cy="17" r="2"/>',
    lock:'<rect x="6" y="10" width="12" height="10" rx="2"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
    unlock:'<rect x="6" y="10" width="12" height="10" rx="2"/><path d="M15 10V7a3 3 0 0 0-5.7-1.3"/>',
    trash:'<path d="M5 7h14M9 7V4h6v3M8 10l1 9h6l1-9"/>',
    more:'<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>'
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
  '<div class="gd-board-global" aria-label="Whiteboard controls">'+
    '<button type="button" class="gd-board-global-button" id="gd-board-back" aria-label="Back to manipulatives" title="Back">'+iconSvg('back')+'</button>'+
    '<button type="button" class="gd-board-global-button is-active" id="gd-board-snap" aria-pressed="true" aria-label="Toggle snap to dots" title="Snap to dots">'+iconSvg('snap')+'</button>'+
    '<button type="button" class="gd-board-global-button" id="gd-board-full" aria-label="Present full screen" title="Present">'+iconSvg('full')+'</button>'+
  '</div>'+
'</div>';

const board=document.getElementById('gd-mixed-board');
const viewport=document.getElementById('gd-board-viewport');
const canvas=document.getElementById('gd-board-canvas');

function objectById(id){return objects.find(x=>String(x.id)===String(id))||null}
function frameFor(id){return canvas.querySelector('[data-board-object="'+id+'"]')}
function sendSettings(obj,open){
  obj.settingsOpen=!!open;
  const frame=frameFor(obj.id),iframe=frame?.querySelector('iframe');
  if(iframe?.contentWindow)iframe.contentWindow.postMessage({type:'tt99-board-settings',open:obj.settingsOpen},location.origin);
  frame?.classList.toggle('has-settings',obj.settingsOpen);
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
  canvas.querySelectorAll('.gd-board-object').forEach(el=>{el.classList.remove('is-selected','has-context-menu','has-settings');el.setAttribute('aria-selected','false')});
}
function positionObject(obj){
  const frame=frameFor(obj.id);if(!frame)return;
  frame.style.left=obj.x+'px';frame.style.top=obj.y+'px';
  frame.style.width=obj.w+'px';frame.style.height=obj.h+'px';
  frame.style.zIndex=String(obj.z);
}
function objectMarkup(obj,tool){
  const src=location.pathname+'?embed=1#'+encodeURIComponent(tool.id);
  return '<section class="gd-board-object is-selected" data-board-object="'+obj.id+'" data-tool-id="'+esc(tool.id)+'" aria-label="'+esc(tool.title)+'" aria-selected="true">'+
    '<iframe class="gd-board-object-iframe" src="'+src+'" title="'+esc(tool.title)+'"></iframe>'+
    '<button type="button" class="gd-board-object-cover" data-board-select="'+obj.id+'" aria-label="Select '+esc(tool.title)+'"></button>'+
    '<button type="button" class="gd-board-move-handle" data-board-move="'+obj.id+'" aria-label="Move '+esc(tool.title)+'" title="Move"><span></span><span></span><span></span></button>'+
    '<button type="button" class="gd-board-context-trigger" data-board-context="'+obj.id+'" aria-label="Object menu" title="Object menu">'+iconSvg('more')+'</button>'+
    '<div class="gd-board-context-menu" role="menu" aria-label="'+esc(tool.title)+' controls">'+
      '<button type="button" data-board-settings="'+obj.id+'" role="menuitem" aria-label="Settings" title="Settings">'+iconSvg('settings')+'</button>'+
      '<button type="button" data-board-lock="'+obj.id+'" role="menuitem" aria-label="Lock position" title="Lock position">'+iconSvg('lock')+'</button>'+
      '<button type="button" data-board-delete="'+obj.id+'" role="menuitem" aria-label="Delete" title="Delete">'+iconSvg('trash')+'</button>'+
    '</div>'+
    '<button type="button" class="gd-board-resize-handle" data-board-resize="'+obj.id+'" aria-label="Resize '+esc(tool.title)+'" title="Resize"></button>'+
  '</section>';
}
function addObject(toolId){
  const tool=tools.find(t=>t.id===toolId);if(!tool)return;
  const [w,h]=defaults[tool.id]||[650,520];
  const i=objects.length,obj={
    id:nextId++,toolId:tool.id,
    x:snapped(90+(i%5)*40+viewport.scrollLeft),
    y:snapped(80+(i%4)*40+viewport.scrollTop),
    w,h,z:++zCounter,locked:false,menuOpen:false,settingsOpen:false
  };
  objects.push(obj);
  if(selectedId!=null)deselect();
  canvas.insertAdjacentHTML('beforeend',objectMarkup(obj,tool));
  positionObject(obj);
  selectObject(obj.id);
  bindObject(obj);
}
function removeObject(id){
  const obj=objectById(id);if(!obj)return;
  sendSettings(obj,false);
  const index=objects.indexOf(obj);if(index>=0)objects.splice(index,1);
  frameFor(id)?.remove();
  if(selectedId===id)selectedId=null;
}
function toggleLock(id){
  const obj=objectById(id);if(!obj)return;
  obj.locked=!obj.locked;
  const frame=frameFor(id);frame?.classList.toggle('is-locked',obj.locked);
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
function toggleSettings(id){
  const obj=objectById(id);if(!obj)return;
  selectObject(id);
  sendSettings(obj,!obj.settingsOpen);
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
  const lock=frame.querySelector('[data-board-lock]');
  if(lock)lock.onclick=e=>{e.stopPropagation();toggleLock(obj.id)};
  const del=frame.querySelector('[data-board-delete]');
  if(del)del.onclick=e=>{e.stopPropagation();removeObject(obj.id)};

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
    resize={id:obj.id,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,w:obj.w,h:obj.h};
    try{size.setPointerCapture(e.pointerId)}catch(_){}
  };
}

document.addEventListener('pointermove',e=>{
  if(drag&&drag.pointerId===e.pointerId){
    const obj=objectById(drag.id);if(!obj)return;
    obj.x=clamp(snapped(drag.x+e.clientX-drag.startX),0,BOARD_W-obj.w);
    obj.y=clamp(snapped(drag.y+e.clientY-drag.startY),0,BOARD_H-obj.h);
    positionObject(obj);
  }
  if(resize&&resize.pointerId===e.pointerId){
    const obj=objectById(resize.id);if(!obj)return;
    obj.w=clamp(snapped(resize.w+e.clientX-resize.startX),320,1100);
    obj.h=clamp(snapped(resize.h+e.clientY-resize.startY),240,900);
    if(obj.x+obj.w>BOARD_W)obj.w=BOARD_W-obj.x;
    if(obj.y+obj.h>BOARD_H)obj.h=BOARD_H-obj.y;
    positionObject(obj);
  }
});
function endPointer(e){
  if(drag&&drag.pointerId===e.pointerId)drag=null;
  if(resize&&resize.pointerId===e.pointerId)resize=null;
}
document.addEventListener('pointerup',endPointer);
document.addEventListener('pointercancel',endPointer);

canvas.addEventListener('pointerdown',e=>{if(e.target===canvas)deselect()});
document.querySelectorAll('[data-board-add]').forEach(button=>button.addEventListener('click',()=>addObject(button.dataset.boardAdd)));

document.getElementById('gd-board-back').onclick=()=>{location.href=location.pathname};
document.getElementById('gd-board-snap').onclick=e=>{
  snapOn=!snapOn;e.currentTarget.classList.toggle('is-active',snapOn);e.currentTarget.setAttribute('aria-pressed',snapOn?'true':'false');
  board.classList.toggle('is-snap-off',!snapOn);
};
document.getElementById('gd-board-full').onclick=()=>{
  if(document.fullscreenElement===board){document.exitFullscreen?.();return}
  board.requestFullscreen?.().catch(()=>{});
};
document.addEventListener('fullscreenchange',()=>board.classList.toggle('is-fullscreen',document.fullscreenElement===board));

window.addEventListener('message',event=>{
  if(event.origin!==location.origin||!event.data||event.data.type!=='tt99-board-ready')return;
  const frame=[...canvas.querySelectorAll('iframe')].find(x=>x.contentWindow===event.source);
  if(frame)frame.closest('.gd-board-object')?.classList.add('is-ready');
});

G.compositionBoard={
  add:addObject,
  select:selectObject,
  remove:removeObject,
  objects:()=>objects.map(({menuOpen,settingsOpen,...obj})=>({...obj})),
  isMounted:()=>true
};

})(window.TT99Goodies);
