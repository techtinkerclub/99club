(function(G){
'use strict';
if(!G)return;

let active=null;

function clone(value){
  return JSON.parse(JSON.stringify(value));
}
function clamp(value,min,max){
  return Math.max(min,Math.min(max,value));
}
function isTypingTarget(target){
  if(!target||!target.closest)return false;
  return !!target.closest('input,textarea,select,[contenteditable="true"]');
}
function icon(name){
  const paths={
    undo:'<path d="m9 7-5 5 5 5"/><path d="M5 12h8a6 6 0 0 1 6 6"/>',
    redo:'<path d="m15 7 5 5-5 5"/><path d="M19 12h-8a6 6 0 0 0-6 6"/>',
    duplicate:'<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    colour:'<path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h3a6 6 0 0 0 0-12h-3Z"/><circle cx="7.5" cy="9" r="1"/><circle cx="10" cy="6.5" r="1"/><circle cx="14" cy="6.5" r="1"/>',
    lock:'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    unlock:'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M16 10V7a4 4 0 0 0-7.5-2"/>',
    delete:'<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="m8 10 .5 8m7.5-8-.5 8"/><path d="M6 7l1 14h10l1-14"/>',
    grid:'<path d="M4 4h16v16H4zM4 10h16M4 16h16M10 4v16M16 4v16"/>',
    clear:'<path d="m4 15 7-9 9 7-6 8H8Z"/><path d="m11 6 9 7"/>'
  };
  return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+(paths[name]||paths.duplicate)+'</svg>';
}
function toolButton(action,iconName,label,classes,disabled){
  return '<button type="button" class="gd-object-tool '+(classes||'')+'" data-gd-action="'+action+'" data-label="'+G.esc(label)+'" aria-label="'+G.esc(label)+'" title="'+G.esc(label)+'"'+(disabled?' disabled':'')+'>'+icon(iconName)+'</button>';
}
function mount(options){
  if(active)active.destroy();
  const o=Object.assign({selector:'[data-gd-object]',maxHistory:50,snap:1},options||{});
  let selectedId=null;
  let drag=null;
  let destroyed=false;
  const undoStack=[];
  const redoStack=[];

  function items(){
    const value=o.getItems?o.getItems():[];
    return Array.isArray(value)?value:[];
  }
  function selected(){
    return items().find(item=>String(item.id)===String(selectedId))||null;
  }
  function canvas(){
    return o.getCanvas?o.getCanvas():null;
  }
  function snapshot(){
    return clone(o.getState());
  }
  function pushSnapshot(value){
    undoStack.push(clone(value));
    if(undoStack.length>o.maxHistory)undoStack.shift();
    redoStack.length=0;
  }
  function remember(){
    pushSnapshot(snapshot());
  }
  function restore(value){
    o.setState(clone(value));
    selectedId=null;
    refresh();
  }
  function canUndo(){return undoStack.length>0}
  function canRedo(){return redoStack.length>0}
  function undo(){
    if(!canUndo())return;
    redoStack.push(snapshot());
    restore(undoStack.pop());
  }
  function redo(){
    if(!canRedo())return;
    undoStack.push(snapshot());
    restore(redoStack.pop());
  }
  function select(id){
    selectedId=id==null?null:String(id);
    refresh();
  }
  function isLocked(item){
    return !!(o.isLocked?o.isLocked(item):item&&item.locked);
  }
  function setPosition(item,x,y){
    if(o.setPosition)o.setPosition(item,x,y);
    else{item.x=x;item.y=y;}
  }
  function snapValue(value){
    const size=typeof o.snap==='function'?Number(o.snap()):Number(o.snap);
    return size>1?Math.round(value/size)*size:value;
  }
  function constrain(item,x,y,element){
    const c=canvas();
    if(!c)return{x,y};
    if(o.constrain)return o.constrain(item,x,y,element,c);
    const maxX=Math.max(0,c.clientWidth-(element?element.offsetWidth:0));
    const maxY=Math.max(0,c.clientHeight-(element?element.offsetHeight:0));
    return{x:clamp(x,0,maxX),y:clamp(y,0,maxY)};
  }
  function mutate(fn){
    remember();
    fn();
    refresh();
  }
  function removeSelected(){
    const item=selected();if(!item||isLocked(item))return;
    mutate(()=>{
      if(o.remove)o.remove(item);
      else{
        const list=items(),index=list.indexOf(item);
        if(index>=0)list.splice(index,1);
      }
      selectedId=null;
    });
  }
  function duplicateSelected(){
    const item=selected();if(!item)return;
    mutate(()=>{
      const duplicated=o.duplicate?o.duplicate(item):null;
      if(duplicated&&duplicated.id!=null)selectedId=String(duplicated.id);
    });
  }
  function toggleLockSelected(){
    const item=selected();if(!item)return;
    mutate(()=>{
      if(o.toggleLock)o.toggleLock(item);
      else item.locked=!item.locked;
    });
  }
  function setColourSelected(colour){
    const item=selected();if(!item||isLocked(item))return;
    mutate(()=>{
      if(o.setColour)o.setColour(item,colour);
      else item.color=colour;
    });
  }
  function nudge(dx,dy){
    const item=selected();if(!item||isLocked(item))return;
    remember();
    const currentX=Number(item.x)||0,currentY=Number(item.y)||0;
    const pos=constrain(item,currentX+dx,currentY+dy,null);
    setPosition(item,snapValue(pos.x),snapValue(pos.y));
    refresh();
  }
  function bindObjects(){
    const c=canvas();if(!c)return;
    c.onpointerdown=e=>{
      if(e.target===c||e.target.hasAttribute('data-gd-canvas-bg')){
        selectedId=null;refresh();
      }
    };
    Array.from(c.querySelectorAll(o.selector)).forEach(el=>{
      el.onpointerdown=e=>{
        if(e.button!=null&&e.button!==0)return;
        e.stopPropagation();
        const item=items().find(x=>String(x.id)===String(el.getAttribute('data-gd-object')));
        if(!item)return;
        selectedId=String(item.id);
        refreshSelectionOnly();
        if(isLocked(item))return;
        const rect=el.getBoundingClientRect();
        drag={
          id:String(item.id),pointerId:e.pointerId,
          dx:e.clientX-rect.left,dy:e.clientY-rect.top,
          start:snapshot(),remembered:false,element:el
        };
        try{el.setPointerCapture(e.pointerId)}catch(_){}
      };
      el.onpointermove=e=>{
        if(!drag||drag.pointerId!==e.pointerId||drag.element!==el)return;
        const item=items().find(x=>String(x.id)===drag.id);
        const cRect=canvas().getBoundingClientRect();
        if(!item)return;
        let x=e.clientX-cRect.left-drag.dx;
        let y=e.clientY-cRect.top-drag.dy;
        if(!drag.remembered){
          const moved=Math.abs(x-(Number(item.x)||0))+Math.abs(y-(Number(item.y)||0));
          if(moved<2)return;
          pushSnapshot(drag.start);drag.remembered=true;
        }
        x=snapValue(x);y=snapValue(y);
        const pos=constrain(item,x,y,el);
        setPosition(item,pos.x,pos.y);
        el.style.left=pos.x+'px';
        el.style.top=pos.y+'px';
        if(o.onMove)o.onMove(item);
      };
      const endDrag=e=>{
        if(!drag||drag.pointerId!==e.pointerId||drag.element!==el)return;
        drag=null;refresh();
      };
      el.onpointerup=endDrag;
      el.onpointercancel=endDrag;
      el.ondblclick=e=>{e.preventDefault();selectedId=String(el.getAttribute('data-gd-object'));duplicateSelected();};
    });
  }
  function bindActions(){
    const root=o.getActionRoot?o.getActionRoot():canvas()?.parentElement;
    if(!root)return;
    Array.from(root.querySelectorAll('[data-gd-action]')).forEach(btn=>{
      btn.onclick=e=>{
        e.preventDefault();
        const action=btn.getAttribute('data-gd-action');
        if(action==='undo')undo();
        else if(action==='redo')redo();
        else if(action==='duplicate')duplicateSelected();
        else if(action==='delete')removeSelected();
        else if(action==='lock')toggleLockSelected();
        else if(action==='deselect')select(null);
        else if(o.onAction)o.onAction(action,api,btn);
      };
    });
    Array.from(root.querySelectorAll('[data-gd-colour]')).forEach(btn=>{
      btn.onclick=e=>{e.preventDefault();setColourSelected(btn.getAttribute('data-gd-colour'));};
    });
  }
  function refreshSelectionOnly(){
    const c=canvas();if(!c)return;
    Array.from(c.querySelectorAll(o.selector)).forEach(el=>{
      const on=String(el.getAttribute('data-gd-object'))===String(selectedId);
      el.classList.toggle('is-selected',on);
      el.setAttribute('aria-selected',on?'true':'false');
    });
    if(o.onSelectionChange)o.onSelectionChange(selected());
  }
  function refresh(){
    if(destroyed)return;
    o.render(selectedId,{canUndo:canUndo(),canRedo:canRedo(),selected:selected()});
    bindObjects();
    bindActions();
    refreshSelectionOnly();
    if(o.afterRender)o.afterRender(api);
  }
  function keydown(e){
    if(destroyed||isTypingTarget(e.target))return;
    const mod=e.ctrlKey||e.metaKey;
    if(mod&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}
    if(mod&&e.key.toLowerCase()==='y'){e.preventDefault();redo();return;}
    if(mod&&e.key.toLowerCase()==='d'){e.preventDefault();duplicateSelected();return;}
    if(e.key==='Escape'){if(selectedId!=null){e.preventDefault();select(null);}return;}
    if(e.key==='Delete'||e.key==='Backspace'){if(selected()){e.preventDefault();removeSelected();}return;}
    const rawStep=typeof o.nudgeStep==='function'?Number(o.nudgeStep()):Number(o.nudgeStep||1);
    const baseStep=Number.isFinite(rawStep)&&rawStep>0?rawStep:1;
    const step=e.shiftKey?baseStep*5:baseStep;
    if(e.key==='ArrowLeft'){e.preventDefault();nudge(-step,0);}
    else if(e.key==='ArrowRight'){e.preventDefault();nudge(step,0);}
    else if(e.key==='ArrowUp'){e.preventDefault();nudge(0,-step);}
    else if(e.key==='ArrowDown'){e.preventDefault();nudge(0,step);}
  }
  function destroy(){
    if(destroyed)return;
    destroyed=true;
    document.removeEventListener('keydown',keydown);
    if(active===api)active=null;
  }
  document.addEventListener('keydown',keydown);
  const api={
    refresh,select,selected,mutate,undo,redo,canUndo,canRedo,
    removeSelected,duplicateSelected,toggleLockSelected,setColourSelected,nudge,destroy,
    getSelectedId:()=>selectedId
  };
  active=api;
  return api;
}
function clear(){
  if(active)active.destroy();
  active=null;
}
G.interaction={mount,clear,icon,toolButton};
})(window.TT99Goodies);
