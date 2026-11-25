/* Number Mobile — consolidated legacy layers, original execution order. Packaging only. */

/* ===== v3 ===== */
/* 99 Club Studio · Number Mobile Balance v3
 * Classroom-first adapter over the established balance engine.
 * Keeps challenge/export/undo logic underneath while presenting an editable
 * recursive number mobile with obvious edit, branch and delete actions.
 */
(function(G){
'use strict';
if(!G||typeof G.balanceTool!=='function')return;
const originalBalanceTool=G.balanceTool;
let observers=[],cleanups=[],lastVisual={angle:0,left:0,right:0};
let blankIds=new Set(),roots={left:[],right:[]},nextBranch=1;
let setupTopology=null;
let selectedBranchId=null,focusedTileId=null,editingId=null,editBuffer='',pendingAdd=null,adapting=false,adaptQueued=false;

let catalogueValue=G.toolCatalogue;
try{
  Object.defineProperty(G,'toolCatalogue',{
    configurable:true,
    get(){return catalogueValue},
    set(value){
      catalogueValue=Array.isArray(value)?value.map(item=>item?.id==='balance'?{
        ...item,
        title:'Number mobile balance',
        desc:'Build, branch and balance hanging number boxes on a maths mobile.',
        use:'Equality, missing-number equations, decomposition and comparing expressions.'
      }:item):value;
    }
  });
}catch(_err){}

function disconnect(){observers.forEach(o=>o.disconnect());observers=[];cleanups.forEach(fn=>{try{fn()}catch(_err){}});cleanups=[]}
function exactText(root,from,to){if(!root)return;root.querySelectorAll('*').forEach(el=>{if(el.children.length===0&&String(el.textContent||'').trim()===from)el.textContent=to})}
function numberVar(el,name){return Number.parseFloat(el?.style?.getPropertyValue(name))||0}
function tileNode(id){return{kind:'tile',id:String(id)}}
function branchNode(left=[],right=[]){return{kind:'branch',id:'b'+(nextBranch++),left,right}}
function walk(nodes,fn,parent=null,slot=null){for(let i=0;i<nodes.length;i++){const node=nodes[i];if(fn(node,nodes,i,parent,slot)===false)return false;if(node.kind==='branch'){if(walk(node.left,fn,node,'left')===false)return false;if(walk(node.right,fn,node,'right')===false)return false}}return true}
function findNode(id){
  let found=null;
  for(const side of ['left','right']){
    walk(roots[side],(node,list,index,parent,slot)=>{if(String(node.id)===String(id)){found={node,list,index,parent,slot,rootSide:side};return false}});
    if(found)break;
  }
  return found;
}
function branchById(id){const loc=findNode(id);return loc?.node?.kind==='branch'?loc.node:null}
function descendantIds(node){const out=[];walk([node],n=>{if(n.kind==='tile')out.push(String(n.id))});return out}
function rootSideForNodeId(id){let result=null;for(const side of ['left','right']){walk(roots[side],node=>{if(String(node.id)===String(id)){result=side;return false}});if(result)break}return result}
function sideForToken(id){for(const side of ['left','right']){let found=false;walk(roots[side],node=>{if(node.kind==='tile'&&String(node.id)===String(id)){found=true;return false}});if(found)return side}return null}
function flattenLabels(nodes,labels){const out=[];walk(nodes,node=>{if(node.kind==='tile')out.push(labels.get(String(node.id))??'0')});return out}
function numericValue(label){if(label==='□'||label==='?'||label==='')return 0;const n=Number(label);return Number.isFinite(n)?Math.max(0,n):0}
function treeValue(nodes,labels){return flattenLabels(nodes,labels).reduce((sum,label)=>sum+numericValue(label),0)}
function treeSignature(){return JSON.stringify({roots,blank:[...blankIds].sort(),selectedBranchId})}
function stage(){return document.getElementById('gd-stage')}
function workbench(){return stage()?.querySelector('.gd-eq-balance-workbench')||null}
function scheduleAdapt(){if(adaptQueued)return;adaptQueued=true;setTimeout(()=>{adaptQueued=false;adaptStage(stage())},0)}

function animateMobile(work){
  const apparatus=work.querySelector('.gd-eq-balance');if(!apparatus||apparatus.dataset.nmbAnimated==='1')return;
  apparatus.dataset.nmbAnimated='1';
  const beam=work.querySelector('.gd-eq-beam'),left=work.querySelector('.gd-eq-side--left'),right=work.querySelector('.gd-eq-side--right');
  const legacyAngle=numberVar(apparatus,'--ba-tilt');
  const target={angle:-legacyAngle,left:numberVar(apparatus,'--ba-left-lift'),right:numberVar(apparatus,'--ba-right-lift')};
  const transition='.28s cubic-bezier(.22,.78,.28,1.08)';
  if(beam){beam.style.transition='none';beam.style.transform='rotate('+lastVisual.angle+'deg)'}
  if(left){left.style.transition='none';left.style.transform='translateY('+lastVisual.left+'px)'}
  if(right){right.style.transition='none';right.style.transform='translateY('+lastVisual.right+'px)'}
  void apparatus.offsetWidth;
  requestAnimationFrame(()=>{
    if(beam){beam.style.transition='transform '+transition;beam.style.transform='rotate('+target.angle+'deg)'}
    if(left){left.style.transition='transform '+transition;left.style.transform='translateY('+target.left+'px)'}
    if(right){right.style.transition='transform '+transition;right.style.transform='translateY('+target.right+'px)'}
  });
  lastVisual=target;
}

function currentTokenInfo(work){
  const map=new Map();
  work.querySelectorAll('[data-ba-token]').forEach(tile=>{
    const id=String(tile.dataset.baToken),strong=tile.querySelector('strong'),raw=String(strong?.textContent||'').trim();
    const side=tile.closest('.gd-eq-side--right')?'right':'left';
    map.set(id,{id,tile,strong,raw,side});
  });
  return map;
}
function selectedTokenId(work){return String(work.querySelector('[data-ba-token].is-selected')?.dataset?.baToken||'')||null}
function pruneTreeToTokens(tokens){
  function prune(nodes,side){
    for(let i=nodes.length-1;i>=0;i--){
      const node=nodes[i];
      if(node.kind==='tile'){
        const info=tokens.get(String(node.id));if(!info||info.side!==side)nodes.splice(i,1);
      }else{
        prune(node.left,side);prune(node.right,side);
        if(!node.left.length&&!node.right.length)nodes.splice(i,1);
      }
    }
  }
  prune(roots.left,'left');prune(roots.right,'right');
  const tracked=new Set();walk([...roots.left,...roots.right],n=>{if(n.kind==='tile')tracked.add(String(n.id))});
  tokens.forEach(info=>{if(!tracked.has(info.id))roots[info.side].push(tileNode(info.id))});
}
function labelMap(tokens){const labels=new Map();tokens.forEach(info=>labels.set(info.id,blankIds.has(info.id)?'□':info.raw));return labels}

function engineSelect(id,after){
  const work=workbench();if(!work)return;
  const tile=work.querySelector('[data-ba-token="'+CSS.escape(String(id))+'"]');if(!tile)return;
  if(!tile.classList.contains('is-selected'))tile.click();
  setTimeout(()=>{if(typeof after==='function')after()},0);
}
function setEngineValue(id,value){
  engineSelect(id,()=>{
    const input=document.getElementById('ba-value');if(!input)return;
    input.value=String(value);input.dispatchEvent(new Event('change',{bubbles:true}));
  });
}
function deleteTile(id){
  focusedTileId=null;editingId=null;
  engineSelect(id,()=>{const del=document.getElementById('ba-delete');if(del)del.click()});
}
function duplicateTile(id){
  const loc=findNode(id),dup=document.getElementById('ba-duplicate');if(!loc||!dup)return;
  pendingAdd={side:sideForToken(id)||'left',blank:false,placement:loc.parent?{branchId:loc.parent.id,slot:loc.slot}:null};
  engineSelect(id,()=>dup.click());
}
function nativeAdd(side,placement=null){
  const work=workbench();if(!work)return;
  const button=work.querySelector('[data-ba-stage-add="'+side+'"]');if(!button)return;
  pendingAdd={side,blank:true,placement};focusedTileId=null;editingId=null;
  const fn=button._nmbNativeAdd||button.onclick;if(typeof fn==='function')fn.call(button,new MouseEvent('click',{bubbles:true}));
}
function finalizePending(work,tokens){
  if(!pendingAdd)return false;
  const request=pendingAdd,selected=selectedTokenId(work);if(!selected||!tokens.has(selected))return false;
  const info=tokens.get(selected);if(info.side!==request.side)return false;
  const wantsBlank=request.blank!==false;
  if(wantsBlank){blankIds.add(selected);focusedTileId=selected;editingId=selected;editBuffer=''}else{blankIds.delete(selected);focusedTileId=selected;editingId=null}
  const loc=findNode(selected);if(loc)loc.list.splice(loc.index,1);
  const place=request.placement;
  if(place?.branchId){const branch=branchById(place.branchId);if(branch)branch[place.slot==='right'?'right':'left'].push(tileNode(selected));else roots[request.side].push(tileNode(selected))}
  else roots[request.side].push(tileNode(selected));
  pendingAdd=null;
  if(wantsBlank&&numericValue(info.raw)!==0){setEngineValue(selected,0);return true}
  return false;
}
function reconcile(work,tokens){
  pruneTreeToTokens(tokens);
  if(finalizePending(work,tokens))return false;
  blankIds.forEach(id=>{if(!tokens.has(String(id)))blankIds.delete(id)});
  if(focusedTileId&&!tokens.has(String(focusedTileId)))focusedTileId=null;
  if(editingId&&!tokens.has(String(editingId)))editingId=null;
  return true;
}

function branchSelected(id){
  const loc=findNode(id);if(!loc||loc.node.kind!=='tile')return;
  const side=sideForToken(id)||loc.rootSide||'left';
  const branch=branchNode([loc.node],[]);loc.list.splice(loc.index,1,branch);
  selectedBranchId=branch.id;focusedTileId=null;editingId=null;
  adaptStage(stage());
  nativeAdd(side,{branchId:branch.id,slot:'right'});
}
function deleteTokenSequence(ids){
  const queue=[...ids];
  function next(){const id=queue.shift();if(!id)return;engineSelect(id,()=>{const del=document.getElementById('ba-delete');if(del)del.click();setTimeout(next,0)})}
  next();
}
function branchToolbar(node){
  const bar=document.createElement('div');bar.className='nmb-branch-toolbar';
  const add=(label,slot,title)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.title=title;b.onclick=e=>{e.stopPropagation();nativeAdd(rootSideForNodeId(node.id)||'left',{branchId:node.id,slot})};return b};
  bar.appendChild(add('+ Left','left','Add empty box to left side of this branch'));
  bar.appendChild(add('+ Right','right','Add empty box to right side of this branch'));
  const unbranch=document.createElement('button');unbranch.type='button';unbranch.textContent='Unbranch';unbranch.title='Remove this small balance bar but keep its boxes';unbranch.onclick=e=>{e.stopPropagation();const loc=findNode(node.id);if(!loc)return;loc.list.splice(loc.index,1,...node.left,...node.right);selectedBranchId=null;adaptStage(stage())};bar.appendChild(unbranch);
  const del=document.createElement('button');del.type='button';del.className='is-danger';del.textContent='Delete branch';del.title='Delete this branch and all boxes hanging from it';del.onclick=e=>{e.stopPropagation();const ids=descendantIds(node);selectedBranchId=null;deleteTokenSequence(ids)};bar.appendChild(del);
  return bar;
}
function makeBranchElement(node,tokens,depth){
  const labels=labelMap(tokens),l=treeValue(node.left,labels),r=treeValue(node.right,labels),scale=Math.max(1,l,r),angle=Math.max(-10,Math.min(10,(l-r)/scale*-10));
  const lift=Math.sin(angle*Math.PI/180)*62;
  const wrap=document.createElement('div');wrap.className='nmb-branch'+(String(node.id)===String(selectedBranchId)?' is-selected':'');wrap.dataset.nmbBranch=node.id;wrap.dataset.nmbDepth=String(depth);
  wrap.style.setProperty('--nmb-branch-angle',angle+'deg');wrap.style.setProperty('--nmb-branch-left',(-lift)+'px');wrap.style.setProperty('--nmb-branch-right',lift+'px');
  const suspension=document.createElement('span');suspension.className='nmb-branch-suspension';wrap.appendChild(suspension);
  const select=document.createElement('button');select.type='button';select.className='nmb-branch-bar';select.title='Select this small balance';select.setAttribute('aria-label','Select branch balance');select.onclick=e=>{e.stopPropagation();selectedBranchId=node.id;focusedTileId=null;editingId=null;adaptStage(stage())};wrap.appendChild(select);
  const sides=document.createElement('div');sides.className='nmb-branch-sides';
  ['left','right'].forEach(slot=>{
    const side=document.createElement('div');side.className='nmb-branch-side nmb-branch-side--'+slot;
    const cord=document.createElement('span');cord.className='nmb-branch-cord';side.appendChild(cord);
    const children=document.createElement('div');children.className='nmb-branch-children';
    node[slot].forEach(child=>children.appendChild(makeNodeElement(child,tokens,depth+1)));
    if(!node[slot].length){const placeholder=document.createElement('button');placeholder.type='button';placeholder.className='nmb-branch-empty';placeholder.textContent='+';placeholder.title='Add empty box here';placeholder.onclick=e=>{e.stopPropagation();nativeAdd(rootSideForNodeId(node.id)||'left',{branchId:node.id,slot})};children.appendChild(placeholder)}
    else{const add=document.createElement('button');add.type='button';add.className='nmb-branch-add';add.textContent='+';add.title='Add another empty box here';add.onclick=e=>{e.stopPropagation();nativeAdd(rootSideForNodeId(node.id)||'left',{branchId:node.id,slot})};children.appendChild(add)}
    side.appendChild(children);sides.appendChild(side);
  });
  wrap.appendChild(sides);
  if(String(node.id)===String(selectedBranchId))wrap.appendChild(branchToolbar(node));
  return wrap;
}
function makeNodeElement(node,tokens,depth=0){
  if(node.kind==='branch')return makeBranchElement(node,tokens,depth);
  const info=tokens.get(String(node.id));if(!info)return document.createElement('span');
  const tile=info.tile,id=String(node.id);
  tile.dataset.nmbDepth=String(depth);
  tile.classList.toggle('is-blank-box',blankIds.has(id));
  tile.classList.toggle('is-nmb-focused',String(focusedTileId)===id);
  if(blankIds.has(id)){if(info.strong)info.strong.textContent='';tile.setAttribute('aria-label','Empty number box');tile.title='Tap to enter a number'}
  else{tile.setAttribute('aria-label','Number '+(info.raw||''));tile.title='Tap to edit this number'}
  return tile;
}
function renderTrees(work,tokens){
  const signature=treeSignature();if(work.dataset.nmbTreeSignature===signature)return;
  work.dataset.nmbTreeSignature=signature;
  ['left','right'].forEach(side=>{
    const box=work.querySelector('.gd-eq-side--'+side+' .gd-eq-weights');if(!box)return;
    box.textContent='';roots[side].forEach(node=>box.appendChild(makeNodeElement(node,tokens,0)));
    if(!roots[side].length){const empty=document.createElement('span');empty.className='gd-eq-empty';empty.textContent='Add a box here';box.appendChild(empty)}
  });
}

function openEditor(id,tokens){
  const info=tokens.get(String(id));if(!info||info.tile.disabled)return;
  focusedTileId=String(id);selectedBranchId=null;editingId=String(id);
  const current=blankIds.has(String(id))?'':String(info.tile.querySelector('strong')?.textContent||info.raw||'').replace(/[^0-9.\-]/g,'');
  editBuffer=current==='?'?'':current;scheduleAdapt();
}
function bindTileClicks(work){
  if(work.dataset.nmbTileClickBound)return;work.dataset.nmbTileClickBound='1';
  work.addEventListener('click',e=>{
    const tile=e.target.closest?.('[data-ba-token]');if(!tile||tile.disabled)return;
    const id=String(tile.dataset.baToken);setTimeout(()=>{const fresh=workbench();if(!fresh)return;const tokens=currentTokenInfo(fresh);openEditor(id,tokens)},0);
  },true);
}
function applyBuffer(id,buffer){
  editingId=String(id);focusedTileId=String(id);editBuffer=buffer;
  if(buffer===''||buffer==='-'){blankIds.add(String(id));setEngineValue(id,0);return}
  const value=Number(buffer);if(!Number.isFinite(value))return;blankIds.delete(String(id));setEngineValue(id,Math.max(0,value));
}
function positionPopup(popup,tile,work,pw,ph){
  const wr=work.getBoundingClientRect(),tr=tile.getBoundingClientRect();let left=tr.right-wr.left+10,top=tr.top-wr.top-16;
  if(left+pw>wr.width)left=Math.max(8,tr.left-wr.left-pw-10);if(top+ph>wr.height)top=Math.max(8,wr.height-ph-8);popup.style.left=left+'px';popup.style.top=top+'px';
}
function tileToolbar(work,tokens){
  work.querySelectorAll('.is-nmb-focused').forEach(tile=>tile.classList.remove('is-nmb-focused'));
  if(!focusedTileId||!tokens.has(String(focusedTileId)))return;
  const id=String(focusedTileId),tile=work.querySelector('[data-ba-token="'+CSS.escape(id)+'"]');if(!tile||tile.disabled)return;
  tile.classList.add('is-nmb-focused');
  const bar=document.createElement('div');bar.className='nmb-tile-toolbar';bar.dataset.nmbTileToolbar=id;
  const button=(label,title,cls='')=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.title=title;if(cls)b.className=cls;return b};
  const edit=button('Edit','Edit this number');edit.onclick=e=>{e.stopPropagation();openEditor(id,currentTokenInfo(workbench()))};bar.appendChild(edit);
  const branch=button('Branch','Hang a smaller balance from this position');branch.onclick=e=>{e.stopPropagation();branchSelected(id)};bar.appendChild(branch);
  const dup=button('Duplicate','Duplicate this number box');dup.onclick=e=>{e.stopPropagation();duplicateTile(id)};bar.appendChild(dup);
  const del=button('Delete','Delete this number box','is-danger');del.onclick=e=>{e.stopPropagation();deleteTile(id)};bar.appendChild(del);
  work.appendChild(bar);positionPopup(bar,tile,work,248,38);
}
function keypad(work,tokens){
  if(!editingId||!tokens.has(String(editingId)))return;
  const id=String(editingId),tile=work.querySelector('[data-ba-token="'+CSS.escape(id)+'"]');if(!tile||tile.disabled)return;
  const pad=document.createElement('div');pad.className='nmb-keypad';pad.dataset.nmbKeypad=id;
  pad.innerHTML='<div class="nmb-keypad-head"><strong>'+(blankIds.has(id)?'Empty box':'Edit number')+'</strong><button type="button" data-nmb-close aria-label="Close keypad">×</button></div><div class="nmb-keypad-display">'+(editBuffer||'□')+'</div><div class="nmb-keypad-grid">'+['7','8','9','4','5','6','1','2','3','0','.','⌫'].map(k=>'<button type="button" data-nmb-key="'+k+'">'+k+'</button>').join('')+'</div><div class="nmb-keypad-actions"><button type="button" data-nmb-blank>Blank</button><button type="button" data-nmb-branch>Branch</button><button type="button" data-nmb-duplicate>Duplicate</button><button type="button" class="is-danger" data-nmb-delete>Delete</button><button type="button" class="is-primary" data-nmb-done>Done</button></div>';
  work.appendChild(pad);positionPopup(pad,tile,work,230,310);
  const close=()=>{editingId=null;adaptStage(stage())};
  pad.querySelector('[data-nmb-close]').onclick=close;
  pad.querySelectorAll('[data-nmb-key]').forEach(b=>b.onclick=e=>{e.stopPropagation();const key=b.dataset.nmbKey;if(key==='⌫')editBuffer=editBuffer.slice(0,-1);else if(key==='.'&&!editBuffer.includes('.'))editBuffer=(editBuffer||'0')+'.';else if(key!=='.')editBuffer=(editBuffer+key).replace(/^0(?=\d)/,'');applyBuffer(id,editBuffer)});
  pad.querySelector('[data-nmb-blank]').onclick=e=>{e.stopPropagation();editBuffer='';applyBuffer(id,'')};
  pad.querySelector('[data-nmb-branch]').onclick=e=>{e.stopPropagation();branchSelected(id)};
  pad.querySelector('[data-nmb-duplicate]').onclick=e=>{e.stopPropagation();duplicateTile(id)};
  pad.querySelector('[data-nmb-delete]').onclick=e=>{e.stopPropagation();deleteTile(id)};
  pad.querySelector('[data-nmb-done]').onclick=e=>{e.stopPropagation();close()};
}

function equationOverride(work,tokens){
  if(stage()?.querySelector('.gd-challenge-banner'))return;
  const labels=labelMap(tokens),leftLabels=flattenLabels(roots.left,labels),rightLabels=flattenLabels(roots.right,labels),lt=treeValue(roots.left,labels),rt=treeValue(roots.right,labels),rel=Math.abs(lt-rt)<1e-9?'=':lt>rt?'>':'<';
  const desired=(leftLabels.length?leftLabels.join(' + '):'0')+' '+rel+' '+(rightLabels.length?rightLabels.join(' + '):'0'),eq=work.querySelector('[data-ba-equation]');if(eq&&eq.textContent!==desired)eq.textContent=desired;
}
function wrapStageAdd(work){
  work.querySelectorAll('[data-ba-stage-add]').forEach(button=>{
    if(button.dataset.nmbWrapped)return;button.dataset.nmbWrapped='1';button._nmbNativeAdd=button.onclick;
    const side=button.dataset.baStageAdd==='right'?'right':'left';button.textContent='+';button.setAttribute('aria-label','Add empty number box to '+side+' side');button.title='Add empty number box';
    button.onclick=e=>{pendingAdd={side,blank:true,placement:null};focusedTileId=null;editingId=null;if(typeof button._nmbNativeAdd==='function')button._nmbNativeAdd.call(button,e)};
  });
}
function adaptStage(root){
  if(!root||adapting)return;const work=root.querySelector('.gd-eq-balance-workbench');if(!work){disconnect();return}
  adapting=true;
  try{
    work.classList.add('gd-number-mobile-workbench');animateMobile(work);bindTileClicks(work);wrapStageAdd(work);
    const summary=work.querySelector('.gd-eq-summary span');if(summary&&/equation balance/i.test(summary.textContent||''))summary.textContent='Number mobile';
    const selected=work.querySelector('.gd-eq-selected__head span');if(selected&&/selected weight/i.test(selected.textContent||''))selected.textContent='Selected number';
    const helpText='Tap any box to edit it again. Selected boxes keep Edit, Branch, Duplicate and Delete beside them. Branch creates a smaller hanging balance.';
    const help=work.querySelector('.gd-eq-drag-hint');if(help&&help.textContent!==helpText)help.textContent=helpText;
    const tokens=currentTokenInfo(work);if(!reconcile(work,tokens))return;
    renderTrees(work,tokens);equationOverride(work,tokens);
    work.querySelectorAll('.nmb-keypad,.nmb-tile-toolbar').forEach(el=>el.remove());
    tileToolbar(work,currentTokenInfo(work));keypad(work,currentTokenInfo(work));
  }finally{adapting=false}
}
function adaptControls(controls){
  if(!controls||!workbench())return;
  exactText(controls,'Add a weight','Add a number box');exactText(controls,'Show pan totals','Show side totals');exactText(controls,'Selected weight value','Selected number value');
  controls.querySelectorAll('.gd-help').forEach(el=>{const text=String(el.textContent||'');if(/Drag weights between pans/i.test(text))el.textContent='Tap a number box to edit it, branch it, duplicate it or delete it. Drag a box between the two main sides.'});
  controls.querySelectorAll('button').forEach(button=>{if(button.textContent.trim()==='Balanced example')button.textContent='Balanced mobile example'});
}
function adaptToolHeader(){const title=document.getElementById('gd-tool-title'),desc=document.getElementById('gd-tool-desc');if(title)title.textContent='Number mobile balance';if(desc)desc.textContent='Build, branch and balance hanging number boxes on a maths mobile.'}
function adaptCatalogueCard(){const card=document.querySelector('[data-tool="balance"]');if(!card)return;const title=card.querySelector('h2'),desc=card.querySelector('p');if(title)title.textContent='Number mobile balance';if(desc)desc.textContent='Build, branch and balance hanging number boxes on a maths mobile.'}
function observe(root,fn){if(!root)return;let queued=false;const run=()=>{queued=false;fn(root)};const obs=new MutationObserver(()=>{if(queued||adapting)return;queued=true;queueMicrotask(run)});obs.observe(root,{childList:true});observers.push(obs);run()}
function keyboardHandler(e){
  if(!editingId||e.ctrlKey||e.metaKey||e.altKey)return;const tag=String(e.target?.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea'||tag==='select')return;
  if(/^\d$/.test(e.key)){e.preventDefault();editBuffer=(editBuffer+e.key).replace(/^0(?=\d)/,'');applyBuffer(editingId,editBuffer)}
  else if(e.key==='.'&&!editBuffer.includes('.')){e.preventDefault();editBuffer=(editBuffer||'0')+'.';applyBuffer(editingId,editBuffer)}
  else if(e.key==='Backspace'){e.preventDefault();editBuffer=editBuffer.slice(0,-1);applyBuffer(editingId,editBuffer)}
  else if(e.key==='Delete'){e.preventDefault();const id=editingId;editingId=null;deleteTile(id)}
  else if(e.key==='Enter'||e.key==='Escape'){e.preventDefault();editingId=null;adaptStage(stage())}
}
// Versioned snapshot combines the numeric model with the recursive tree.
function validateMobile(saved){
  const invalid=()=>{throw new Error('Invalid saved Number Mobile Balance.')};
  const d=saved?.diagram,t=saved?.topology;
  if(!d||!t||!Array.isArray(d.left)||!Array.isArray(d.right)||!Array.isArray(t.blankIds)||!t.roots||!Number.isSafeInteger(t.nextBranch)||t.nextBranch<1)invalid();
  const all=new Map(),branchIds=new Set(),seen=new Set();
  let nodeCount=0,maxBranch=0;
  for(const side of ['left','right']){
    if(!Array.isArray(t.roots[side]))invalid();
    for(const item of d[side]){
      if(!item||!Number.isSafeInteger(item.id)||item.id<1||!Number.isFinite(item.value)||item.value<0||typeof item.hidden!=='boolean'||all.has(String(item.id)))invalid();
      all.set(String(item.id),{side,value:item.value});
    }
    function visit(nodes,depth){
      if(!Array.isArray(nodes)||depth>40)invalid();
      for(const n of nodes){
        if(!n||++nodeCount>1000)invalid();
        if(n.kind==='tile'){
          const id=String(n.id);
          if(seen.has(id)||all.get(id)?.side!==side)invalid();
          seen.add(id);
        }else if(n.kind==='branch'){
          const id=String(n.id);
          if(!/^b[1-9][0-9]*$/.test(id)||branchIds.has(id))invalid();
          branchIds.add(id);maxBranch=Math.max(maxBranch,Number(id.slice(1)));
          visit(n.left,depth+1);visit(n.right,depth+1);
        }else invalid();
      }
    }
    visit(t.roots[side],0);
  }
  if(seen.size!==all.size||t.nextBranch<=maxBranch||new Set(t.blankIds).size!==t.blankIds.length||t.blankIds.some(id=>!all.has(String(id))||all.get(String(id)).value!==0))invalid();
}
function validateChallengeSession(saved){
  const session=saved.session;if(!session)return;
  const invalid=()=>{throw new Error('Invalid saved Number Mobile challenge.')};
  const ch=session.engine?.challenge,meta=session.generator,pupil=session.pupil;
  if(!ch||!session.engine.beforeChallenge||!session.setupTopology||!meta||!pupil)invalid();
  const types=['missing-weight','choose-relation','find-difference','make-balance','same-to-both','spot-false-equality'];
  if(!['standard','custom'].includes(ch.mode)||!['easy','medium','hard'].includes(meta.difficulty)||typeof ch.promptHtml!=='string'||typeof ch.answer!=='string')invalid();
  if(ch.mode==='standard'&&!types.includes(ch.type))invalid();
  if(ch.mode==='custom'&&(!meta.spec||!types.includes(meta.spec.type)))invalid();
  validateMobile({diagram:session.engine.beforeChallenge,topology:session.setupTopology});
  const tokens=new Map([...saved.diagram.left,...saved.diagram.right].map(t=>[String(t.id),t]));
  if(meta.spec){
    const spec=meta.spec;
    if(!types.includes(spec.type)||!['medium','hard'].includes(spec.difficulty)||typeof spec.readOnly!=='boolean')invalid();
    if(spec.answerByToken!=null){
      if(typeof spec.answerByToken!=='object'||Array.isArray(spec.answerByToken))invalid();
      for(const [id,value] of Object.entries(spec.answerByToken)){if(!tokens.get(id)?.hidden||!Number.isFinite(value)||tokens.get(id).value!==value)invalid()}
    }
    if(!Array.isArray(spec.balancedBranchIds)||spec.balancedBranchIds.some(id=>typeof id!=='string'||!/^b[1-9][0-9]*$/.test(id)))invalid();
  }
  const buffer=v=>typeof v==='string'&&v.length<=64&&/^[0-9]*[.]?[0-9]*$/.test(v);
  if(!Array.isArray(pupil.answers)||!buffer(pupil.responseBuffer)||typeof pupil.choiceValue!=='string'||pupil.choiceValue.length>40||typeof pupil.feedback!=='string'||pupil.feedback.length>200||!['','correct','wrong'].includes(pupil.feedbackKind))invalid();
  const seen=new Set();
  for(const row of pupil.answers){
    if(!Array.isArray(row)||row.length!==2)invalid();
    const [id,state]=row;
    if(typeof id!=='string'||seen.has(id)||!tokens.get(id)?.hidden||!state||!buffer(state.buffer)||typeof state.correct!=='boolean'||typeof state.wrong!=='boolean')invalid();
    seen.add(id);
  }
}
function captureMobile(){
  if(G.numberMobileChallengeIsBuilding?.()||document.body.classList.contains('nmb-v7-challenge-building'))throw new Error('Wait for the Number Mobile challenge to finish generating.');
  const engine=G.numberMobileEngineState.captureChallenge();
  if(pendingAdd||adapting||(!engine&&editingId))throw new Error('Finish editing the Number Mobile Balance before saving.');
  const saved={diagram:G.numberMobileEngineState.capture(),topology:topologySnapshot(),difficulty:G.numberMobileChallengeDifficulty||'easy'};
  if(engine){
    const generator=G.numberMobileChallengeSession.capture();
    if(engine.challenge.mode==='custom'&&!generator.spec)throw new Error('Finish or exit the custom Number Mobile challenge before saving.');
    saved.session={engine,generator,pupil:G.numberMobilePupilState.capture(),setupTopology};
  }
  validateMobile(saved);validateChallengeSession(saved);return saved;
}
function restoreMobile(saved){
  validateMobile(saved);validateChallengeSession(saved);
  const session=saved.session||null;
  setupTopology=session?.setupTopology||null;
  applyTopology(saved.topology);
  G.numberMobileChallengeSession?.restore(session?.generator);
  G.numberMobileEngineState.restore(saved.diagram,session?.engine);
  adaptStage(stage());adaptControls(document.getElementById('gd-controls'));
  G.numberMobileChallengeSession?.refresh();
  G.numberMobilePupilState?.restore(session?.pupil);
  G.numberMobileChallengeChrome?.refresh();
  G.numberMobileNumericInput?.refresh();
}
function topologySnapshot(){return JSON.parse(JSON.stringify({roots,blankIds:[...blankIds],nextBranch}))}
function applyTopology(t){
  roots=t.roots;blankIds=new Set(t.blankIds.map(String));nextBranch=t.nextBranch;
  selectedBranchId=null;focusedTileId=null;editingId=null;editBuffer='';pendingAdd=null;
}
G.numberMobileTopology={
  captureSetup(){setupTopology=topologySnapshot()},
  restoreSetup(){if(setupTopology){applyTopology(setupTopology);setupTopology=null}},
  resetChallengeTree(){applyTopology({roots:{left:[],right:[]},blankIds:[],nextBranch:1})}
};
G.balanceTool=function numberMobileBalanceToolV3(){
  disconnect();setupTopology=null;lastVisual={angle:0,left:0,right:0};blankIds=new Set();roots={left:[],right:[]};nextBranch=1;selectedBranchId=null;focusedTileId=null;editingId=null;editBuffer='';pendingAdd=null;
  originalBalanceTool();adaptToolHeader();document.addEventListener('keydown',keyboardHandler);cleanups.push(()=>document.removeEventListener('keydown',keyboardHandler));
  observe(document.getElementById('gd-stage'),adaptStage);observe(document.getElementById('gd-controls'),adaptControls);
  G.lessonState?.register('balance',captureMobile,restoreMobile);
};
G.numberMobileBalanceVersion='3.0.1';
document.addEventListener('DOMContentLoaded',()=>queueMicrotask(adaptCatalogueCard),{once:true});
})(window.TT99Goodies);
;


/* ===== v4 ===== */
/* 99 Club Studio · Number Mobile Balance v4 enhancement
 * Small classroom-UX layer over v3: temporary context actions, editable starter
 * boxes and a compact launcher for the shared Balance challenge engine.
 */
(function(G){
'use strict';
if(!G)return;
const STAGE_ID='gd-stage',balanceToolV3=G.balanceTool;
let stageObserver=null,controlsObserver=null,challengeOpen=false,installed=false;
const TYPE_CATEGORY={
  'missing-weight':'read','choose-relation':'read','find-difference':'read',
  'make-balance':'build','same-to-both':'build','spot-false-equality':'reason'
};
const CHALLENGES=[
  ['random','Surprise me'],['missing-weight','Missing number'],['make-balance','Make it balance'],['choose-relation','Compare'],['find-difference','Difference'],['same-to-both','Same to both'],['spot-false-equality','Spot the mistake']
];
function stage(){return document.getElementById(STAGE_ID)}
function work(){return stage()?.querySelector('.gd-number-mobile-workbench')||null}
function controls(){return document.getElementById('gd-controls')}
function isChallenge(){return !!stage()?.querySelector('.gd-challenge-banner')}
function pupilChallenge(){return document.body.classList.contains('nmb-v8-pupil-challenge')||document.documentElement.classList.contains('nmb-v8-pupil-challenge')}
function dismissContext(){
  const w=work();if(!w)return;
  w.classList.add('nmb-context-dismissed');challengeOpen=false;
  const close=w.querySelector('[data-nmb-close]');if(close)close.click();
  w.querySelectorAll('.nmb-keypad,.nmb-tile-toolbar,.nmb-branch-toolbar,.nmb-challenge-popover').forEach(el=>el.remove());
  const trigger=w.querySelector('[data-nmb-challenge-toggle]');if(trigger)trigger.setAttribute('aria-expanded','false');
}
function revealContext(){const w=work();if(!w)return;if(pupilChallenge()){w.classList.add('nmb-context-dismissed');return}w.classList.remove('nmb-context-dismissed')}
function unlockStarterBoxes(w){
  if(!w||isChallenge())return;
  w.querySelectorAll('[data-ba-token]').forEach(tile=>{tile.disabled=false;tile.removeAttribute('disabled');tile.classList.remove('is-frozen')});
}
function selectWorkflowChallenge(){const c=controls();if(!c)return false;const workflow=c.querySelector('[data-ba-workflow="challenge"]');if(workflow)workflow.click();return true}
function generateChallenge(type){
  if(type==='random'){const pool=['missing-weight','make-balance','choose-relation','find-difference','same-to-both','spot-false-equality'];type=pool[Math.floor(Math.random()*pool.length)]}
  if(!selectWorkflowChallenge())return false;
  let c=controls(),category=TYPE_CATEGORY[type]||'read';const cat=c?.querySelector('[data-ba-challenge-cat="'+category+'"]');if(cat)cat.click();c=controls();const typeButton=c?.querySelector('[data-ba-challenge-type="'+type+'"]');if(typeButton)typeButton.click();c=controls();const generate=c?.querySelector('#ba-generate');if(generate){generate.click();challengeOpen=false;setTimeout(adaptStage,0);return true}return false;
}
function clearChallenge(){if(!selectWorkflowChallenge())return;const clear=controls()?.querySelector('#ba-clear-challenge');if(clear){clear.click();challengeOpen=false;setTimeout(adaptStage,0)}}
function challengePopover(){
  const pop=document.createElement('div');pop.className='nmb-challenge-popover';pop.setAttribute('role','menu');pop.setAttribute('aria-label','Number Mobile challenges');const heading=document.createElement('strong');heading.textContent='Generate challenge';pop.appendChild(heading);
  CHALLENGES.forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.dataset.nmbChallenge=id;b.textContent=label;b.onclick=e=>{e.stopPropagation();generateChallenge(id)};pop.appendChild(b)});
  if(isChallenge()){const clear=document.createElement('button');clear.type='button';clear.className='is-danger';clear.textContent='Clear challenge';clear.onclick=e=>{e.stopPropagation();clearChallenge()};pop.appendChild(clear)}return pop;
}
function ensureChallengeLauncher(w){
  if(!w||w.querySelector('[data-nmb-challenge-toggle]'))return;const summary=w.querySelector('.gd-eq-summary');if(!summary)return;const wrap=document.createElement('div');wrap.className='nmb-challenge-launcher';const trigger=document.createElement('button');trigger.type='button';trigger.className='nmb-challenge-trigger';trigger.dataset.nmbChallengeToggle='1';trigger.textContent='Challenge';trigger.setAttribute('aria-expanded','false');
  trigger.onclick=e=>{e.stopPropagation();revealContext();challengeOpen=!challengeOpen;w.querySelector('.nmb-challenge-popover')?.remove();trigger.setAttribute('aria-expanded',challengeOpen?'true':'false');if(challengeOpen)wrap.appendChild(challengePopover())};wrap.appendChild(trigger);summary.appendChild(wrap);
}
function adaptStage(){
  const w=work();if(!w)return;unlockStarterBoxes(w);ensureChallengeLauncher(w);
  if(pupilChallenge())w.classList.add('nmb-context-dismissed');
  if(w.classList.contains('nmb-context-dismissed'))w.querySelectorAll('.nmb-keypad,.nmb-tile-toolbar,.nmb-branch-toolbar').forEach(el=>el.remove());
}
function insideInteractive(target){return !!target.closest?.('[data-ba-token],.nmb-keypad,.nmb-tile-toolbar,.nmb-branch-bar,.nmb-branch-toolbar,.nmb-branch-add,.nmb-branch-empty,.nmb-challenge-launcher,[data-ba-stage-add]')}
function pointerCapture(e){
  const w=work();if(!w)return;
  if(pupilChallenge()){dismissContext();return}
  if(insideInteractive(e.target)){revealContext();setTimeout(adaptStage,0);return}
  if(w.contains(e.target)||stage()?.contains(e.target))dismissContext();
}
function installObservers(){
  if(stageObserver)stageObserver.disconnect();if(controlsObserver)controlsObserver.disconnect();const s=stage(),c=controls();
  if(s){let queued=false;stageObserver=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;adaptStage()})});stageObserver.observe(s,{childList:true})}
  if(c){controlsObserver=new MutationObserver(()=>queueMicrotask(adaptStage));controlsObserver.observe(c,{childList:true})}adaptStage();
}
function install(){
  if(installed)return;installed=true;document.addEventListener('pointerdown',pointerCapture,true);window.addEventListener('blur',dismissContext);installObservers();const root=document.getElementById('tt99-goodies-root');if(root){const obs=new MutationObserver(()=>{if(document.getElementById(STAGE_ID))installObservers()});obs.observe(root,{childList:true,subtree:false})}
}
if(typeof balanceToolV3==='function')G.balanceTool=function numberMobileBalanceToolV4(){const result=balanceToolV3.apply(this,arguments);setTimeout(installObservers,0);return result};
G.numberMobileBalanceEnhancementVersion='4.1';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else queueMicrotask(install);
})(window.TT99Goodies);
;


/* ===== v6 ===== */
/* 99 Club Studio · Number Mobile Balance v6
 * Stable difficulty-aware challenge layer over v3/v4.
 * Uses event-driven refreshes rather than observing and rewriting its own stage.
 */
(function(G){
'use strict';
if(!G||typeof G.balanceTool!=='function')return;

const balanceToolV4=G.balanceTool;
const TYPE_CATEGORY={
  'missing-weight':'read','choose-relation':'read','find-difference':'read',
  'make-balance':'build','same-to-both':'build','spot-false-equality':'reason'
};
const TYPE_LABEL={
  'missing-weight':'Missing number','make-balance':'Make it balance',
  'choose-relation':'Compare','find-difference':'Difference',
  'same-to-both':'Same to both','spot-false-equality':'Spot the mistake'
};
const TYPES=['missing-weight','make-balance','choose-relation','find-difference','same-to-both','spot-false-equality'];
const COMPLEX=new Set(['missing-weight','make-balance','choose-relation','find-difference','spot-false-equality']);
const DIFFICULTY_COPY={
  easy:'Simple, direct balance challenges.',
  medium:'One hanging balance and an extra reasoning step.',
  hard:'Two hanging balances, multiple constraints and sometimes more than one missing number.'
};

let difficulty='easy',complexSpec=null,busy=false,popoverOpen=false,installed=false,randomScope=null,lastRandomType=null;
let railObserver=null,railNode=null,boardSyncing=false,adaptTimer=null;

function q(sel,root=document){return root?.querySelector?.(sel)||null}
function qa(sel,root=document){return root?.querySelectorAll?[...root.querySelectorAll(sel)]:[]}
function stage(){return document.getElementById('gd-stage')}
function controls(){return document.getElementById('gd-controls')}
function work(){return q('.gd-number-mobile-workbench',stage())}
function banner(){return work()?q('.gd-challenge-banner',stage()):null}
function wait(ms=35){return new Promise(resolve=>setTimeout(resolve,ms))}
async function waitFor(fn,{tries=36,delay=30}={}){for(let i=0;i<tries;i++){const value=fn();if(value)return value;await wait(delay)}return null}
function randint(min,max){return min+Math.floor(Math.random()*(max-min+1))}
function setText(el,text){if(el&&el.textContent!==String(text))el.textContent=String(text)}
function scheduleAdapt(delay=0){clearTimeout(adaptTimer);adaptTimer=setTimeout(adapt,delay)}
function token(id){return q('[data-ba-token="'+CSS.escape(String(id))+'"]',work())}
function tokenIds(root=work()){return new Set(qa('[data-ba-token]',root).map(el=>String(el.dataset.baToken)))}
function activeChallenge(){return !!banner()}
function titleFor(type){return TYPE_LABEL[type]||'Challenge'}
function exposeSpec(spec){complexSpec=spec||null;G.numberMobileChallengeSpec=complexSpec}

function closePopover(){
  popoverOpen=false;qa('.nmb-v5-challenge-popover',work()).forEach(el=>el.remove());
  const trigger=q('[data-nmb-challenge-toggle]',work());if(trigger)trigger.setAttribute('aria-expanded','false');
  syncBoardButton();
}
function challengePopover(){
  const pop=document.createElement('div');pop.className='nmb-v5-challenge-popover';pop.setAttribute('role','menu');pop.setAttribute('aria-label','Number Mobile challenge generator');
  pop.innerHTML='<div class="nmb-v5-popover-head"><strong>Generate challenge</strong><span>Choose a difficulty first.</span></div>'+ 
    '<div class="nmb-v5-difficulty-row" role="group" aria-label="Challenge difficulty">'+
      ['easy','medium','hard'].map(level=>'<button type="button" class="nmb-v5-difficulty'+(difficulty===level?' is-active':'')+'" data-nmb-v6-difficulty="'+level+'">'+level[0].toUpperCase()+level.slice(1)+'</button>').join('')+
    '</div><p class="nmb-v5-difficulty-help">'+DIFFICULTY_COPY[difficulty]+'</p>'+ 
    '<div class="nmb-v5-challenge-grid"><button type="button" class="is-surprise" data-nmb-v6-type="random">Random · all types</button><button type="button" data-nmb-v6-type="random-read">Random · read &amp; compare</button><button type="button" data-nmb-v6-type="random-build">Random · balance</button><button type="button" data-nmb-v6-type="random-reason">Random · reasoning</button>'+ 
      TYPES.map(type=>'<button type="button" data-nmb-v6-type="'+type+'">'+titleFor(type)+'</button>').join('')+'</div>'+ 
    (activeChallenge()?'<button type="button" class="nmb-v5-clear is-danger" data-nmb-v6-clear>Clear challenge</button>':'');
  qa('[data-nmb-v6-difficulty]',pop).forEach(button=>button.onclick=e=>{
    e.stopPropagation();difficulty=button.dataset.nmbV6Difficulty||'easy';G.numberMobileChallengeDifficulty=difficulty;
    const fresh=challengePopover();pop.replaceWith(fresh);popoverOpen=true;const trigger=q('[data-nmb-challenge-toggle]',work());if(trigger)trigger.setAttribute('aria-expanded','true');
  });
  qa('[data-nmb-v6-type]',pop).forEach(button=>button.onclick=e=>{e.stopPropagation();generate(button.dataset.nmbV6Type)});
  const clear=q('[data-nmb-v6-clear]',pop);if(clear)clear.onclick=e=>{e.stopPropagation();clearChallenge()};
  return pop;
}
function togglePopover(){
  if(busy)return;const w=work();if(!w)return;
  const existing=q('.nmb-v5-challenge-popover',w);if(existing){closePopover();return}
  popoverOpen=true;qa('.nmb-challenge-popover',w).forEach(el=>el.remove());w.appendChild(challengePopover());
  const trigger=q('[data-nmb-challenge-toggle]',w);if(trigger)trigger.setAttribute('aria-expanded','true');syncBoardButton();
}
function hookTrigger(){
  const trigger=q('[data-nmb-challenge-toggle]',work());if(!trigger||trigger.dataset.nmbV6Bound)return;
  trigger.dataset.nmbV6Bound='1';
  trigger.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();togglePopover()},true);
}

function boardRail(){
  if(!document.body.classList.contains('gd-embed-page')||window.parent===window)return null;
  try{return window.frameElement?.closest?.('[data-board-object]')?.querySelector?.('[data-board-quick-actions]')||null}catch(_){return null}
}
function syncBoardButton(){
  const rail=boardRail();if(!rail||boardSyncing)return;boardSyncing=true;
  try{
    let button=q('[data-nmb-board-challenge]',rail);
    if(!button){
      button=rail.ownerDocument.createElement('button');button.type='button';button.dataset.nmbBoardChallenge='1';button.textContent='Challenge';button.title='Generate a Number Mobile challenge';button.setAttribute('aria-label','Generate a Number Mobile challenge');
      button.onpointerdown=e=>e.stopPropagation();button.onclick=e=>{e.preventDefault();e.stopPropagation();q('[data-nmb-challenge-toggle]',work())?.click()};
      const peers=qa(':scope > button:not([data-nmb-board-challenge])',rail);rail.insertBefore(button,peers[2]||null);
    }
    button.classList.toggle('is-active',popoverOpen);button.setAttribute('aria-expanded',popoverOpen?'true':'false');
    qa(':scope > button',rail).forEach(peer=>{if(peer!==button)peer.hidden=!!complexSpec?.readOnly});
    if(railNode!==rail){railObserver?.disconnect();railNode=rail;railObserver=new MutationObserver(()=>queueMicrotask(syncBoardButton));railObserver.observe(rail,{childList:true})}
  }finally{boardSyncing=false}
}

async function selectWorkflow(name){const button=q('[data-ba-workflow="'+name+'"]',controls());if(!button)return false;button.click();await wait(30);return true}
async function clearExisting(){
  if(!activeChallenge())return;
  await selectWorkflow('challenge');const clear=await waitFor(()=>q('#ba-clear-challenge',controls()));
  if(clear){exposeSpec(null);clear.click();await wait(70)}
}
async function standardChallenge(type){
  busy=true;closePopover();exposeSpec(null);
  try{
    if(type==='random')type=TYPES[Math.floor(Math.random()*TYPES.length)];
    await clearExisting();if(!await selectWorkflow('challenge'))return;
    let c=controls(),cat=q('[data-ba-challenge-cat="'+(TYPE_CATEGORY[type]||'read')+'"]',c);if(cat){cat.click();await wait(20)}
    c=controls();const typeButton=q('[data-ba-challenge-type="'+type+'"]',c);if(typeButton){typeButton.click();await wait(20)}
    c=controls();const go=q('#ba-generate',c);if(go){go.click();await wait(80)}
  }finally{busy=false;adapt()}
}

async function enterCustomShell(){
  await clearExisting();if(!await selectWorkflow('challenge'))return false;
  const custom=await waitFor(()=>q('[data-ba-challenge-tab="custom"]',controls()));if(!custom)return false;custom.click();await wait(55);
  const clear=await waitFor(()=>q('#ba-clear',controls()));if(!clear)return false;clear.click();await wait(65);return true;
}
async function addNumber(side,value){
  const before=tokenIds(),input=await waitFor(()=>q('#ba-custom',controls())),button=await waitFor(()=>q(side==='right'?'#ba-add-right':'#ba-add-left',controls()));
  if(!input||!button)throw new Error('Number Mobile add controls unavailable');input.value=String(value);button.click();
  const added=await waitFor(()=>qa('[data-ba-token]',work()).find(el=>!before.has(String(el.dataset.baToken))),{tries:42,delay:25});
  if(!added)throw new Error('Number Mobile did not add a number box');await wait(30);adapt();return String(added.dataset.baToken);
}
async function selectToken(id){
  const sid=String(id);
  for(let attempt=0;attempt<4;attempt++){
    const el=await waitFor(()=>token(sid));if(!el)throw new Error('Number Mobile box not found');if(el.disabled){el.disabled=false;el.removeAttribute('disabled');el.removeAttribute('aria-disabled')}
    el.click();
    const selected=await waitFor(()=>q('[data-ba-selected="'+CSS.escape(sid)+'"]',work()),{tries:10,delay:12});
    if(selected){await wait(18);adapt();return token(sid)||el}
    await wait(20);
  }
  throw new Error('Number Mobile could not focus the requested box');
}
async function setTokenValue(id,value){
  await selectToken(id);const input=await waitFor(()=>document.getElementById('ba-value'));if(!input)throw new Error('Number Mobile value editor unavailable');input.value=String(value);input.dispatchEvent(new Event('change',{bubbles:true}));await wait(55);adapt();
}
async function hideToken(id){
  await selectToken(id);const input=await waitFor(()=>document.getElementById('ba-hidden'));if(!input)throw new Error('Number Mobile hide control unavailable');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));await wait(55);adapt();
}
async function branchToken(id,rightValue,extras=[]){
  await selectToken(id);const branchButton=await waitFor(()=>qa('.nmb-tile-toolbar button',work()).find(b=>b.textContent.trim()==='Branch'));if(!branchButton)throw new Error('Number Mobile branch action unavailable');
  branchButton.click();await wait(110);adapt();
  const branch=await waitFor(()=>token(id)?.closest('.nmb-branch'));if(!branch)throw new Error('Number Mobile branch was not created');const branchId=String(branch.dataset.nmbBranch);
  let live=q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work()),rightToken=q('.nmb-branch-side--right [data-ba-token]',live);if(!rightToken)throw new Error('Number Mobile branch right box missing');
  const rightId=String(rightToken.dataset.baToken);await setTokenValue(rightId,rightValue);const ids={left:[String(id)],right:[rightId]};
  for(const extra of extras){
    live=await waitFor(()=>q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work()));q('.nmb-branch-bar',live)?.click();await wait(30);adapt();live=q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work());
    const before=tokenIds(live),toolbar=q('.nmb-branch-toolbar',live),label=extra.slot==='right'?'+ Right':'+ Left',add=qa('button',toolbar).find(b=>b.textContent.trim()===label);if(!add)throw new Error('Number Mobile branch add action unavailable');
    add.click();const added=await waitFor(()=>{const now=q('[data-nmb-branch="'+CSS.escape(branchId)+'"]',work());return qa('[data-ba-token]',now).find(el=>!before.has(String(el.dataset.baToken)))},{tries:42,delay:25});
    if(!added)throw new Error('Number Mobile did not add a branch box');const newId=String(added.dataset.baToken);await setTokenValue(newId,extra.value);ids[extra.slot==='right'?'right':'left'].push(newId);
  }
  return{branchId,ids};
}
async function balancedBranch(side,sum){const part=randint(2,sum-2),other=sum-part,root=await addNumber(side,part),branch=await branchToken(root,sum,[{slot:'left',value:other}]);return{...branch,sum}}
function splitSum(total,count,min=2){
  const parts=[];let remaining=total;
  for(let i=0;i<count-1;i++){
    const slots=count-i-1,max=remaining-min*slots,value=randint(min,max);
    parts.push(value);remaining-=value;
  }
  parts.push(remaining);
  for(let i=parts.length-1;i>0;i--){const j=randint(0,i),tmp=parts[i];parts[i]=parts[j];parts[j]=tmp}
  return parts;
}
function missingPlan(sum,avoid=''){
  for(let attempt=0;attempt<16;attempt++){
    const hiddenSide=Math.random()<.5?'left':'right';
    const hiddenKnownCount=Math.random()<.45?2:1;
    const oppositeCount=Math.random()<.22?3:(Math.random()<.55?2:1);
    const maxAnswer=sum-2*hiddenKnownCount,minAnswer=Math.max(5,Math.floor(sum*.32));
    if(maxAnswer<2)continue;
    const answer=randint(Math.min(minAnswer,maxAnswer),maxAnswer);
    const known=splitSum(sum-answer,hiddenKnownCount,2),opposite=splitSum(sum,oppositeCount,2);
    const signature=[hiddenSide,hiddenKnownCount,oppositeCount].join('-');
    if(signature!==avoid||attempt===15)return{hiddenSide,answer,known,opposite,signature};
  }
}
async function plannedMissingBranch(mainSide,sum,plan){
  let rootValue,rightValue,extras=[];
  if(plan.hiddenSide==='left'){
    rootValue=plan.answer;rightValue=plan.opposite[0];
    extras=plan.known.map(value=>({slot:'left',value})).concat(plan.opposite.slice(1).map(value=>({slot:'right',value})));
  }else{
    rootValue=plan.opposite[0];rightValue=plan.answer;
    extras=plan.opposite.slice(1).map(value=>({slot:'left',value})).concat(plan.known.map(value=>({slot:'right',value})));
  }
  const root=await addNumber(mainSide,rootValue),branch=await branchToken(root,rightValue,extras);
  const hiddenId=plan.hiddenSide==='left'?root:branch.ids.right[0];await hideToken(hiddenId);
  return{branchId:branch.branchId,hiddenId,answer:plan.answer,signature:plan.signature};
}
async function setCustomCopy(spec){
  const title=await waitFor(()=>q('#ba-custom-title',controls()));if(title){title.value=spec.difficulty[0].toUpperCase()+spec.difficulty.slice(1)+' · '+titleFor(spec.type);title.dispatchEvent(new Event('input',{bubbles:true}));await wait(20)}
  const prompt=await waitFor(()=>q('#ba-custom-prompt',controls()));if(prompt){prompt.textContent=spec.prompt;prompt.dispatchEvent(new Event('input',{bubbles:true}));await wait(20)}
  const answer=await waitFor(()=>q('#ba-custom-answer',controls()));if(answer){answer.value=spec.answer;answer.dispatchEvent(new Event('input',{bubbles:true}));await wait(30)}
}

async function buildMissing(level){
  if(level==='medium'){
    const S=randint(8,13),known=randint(2,S-2),missing=S-known,root=await addNumber('left',missing),branch=await branchToken(root,S,[{slot:'left',value:known}]);await addNumber('right',2*S);await hideToken(root);
    return{type:'missing-weight',difficulty:level,readOnly:true,balancedBranchIds:[branch.branchId],prompt:'Every bar is balanced. Work out the missing number in the smaller hanging balance.',answer:String(missing),answerByToken:{[String(root)]:missing}};
  }
  const S=randint(14,24),leftPlan=missingPlan(S),rightPlan=missingPlan(S,leftPlan?.signature||'');
  const left=await plannedMissingBranch('left',S,leftPlan),right=await plannedMissingBranch('right',S,rightPlan);
  return{type:'missing-weight',difficulty:level,readOnly:true,balancedBranchIds:[left.branchId,right.branchId],branchSum:S,layoutSignatures:[left.signature,right.signature],prompt:'Every bar is balanced. Find both missing numbers. Use the two smaller balances before checking the main bar.',answer:left.answer+' and '+right.answer,answerByToken:{[String(left.hiddenId)]:left.answer,[String(right.hiddenId)]:right.answer}};
}
async function buildCompare(level){
  if(level==='medium'){const S=randint(7,13),branch=await balancedBranch('left',S),delta=randint(2,7);await addNumber('right',2*S+delta);return{type:'choose-relation',difficulty:level,readOnly:true,balancedBranchIds:[branch.branchId],prompt:'Which main side is heavier? Work out the value of the hanging branch before you compare the two sides.',answer:'Right side'}}
  let s1=randint(7,12),s2=randint(8,14);if(s1===s2)s2+=2;const left=await balancedBranch('left',s1),right=await balancedBranch('right',s2);
  return{type:'choose-relation',difficulty:level,readOnly:true,balancedBranchIds:[left.branchId,right.branchId],prompt:'Compare the two main sides. Each smaller bar is balanced, so calculate through both branches before deciding which side is heavier.',answer:s1>s2?'Left side':'Right side'};
}
async function buildDifference(level){
  if(level==='medium'){const S=randint(8,13),branch=await balancedBranch('left',S),gap=randint(3,8);await addNumber('right',2*S-gap);return{type:'find-difference',difficulty:level,readOnly:true,balancedBranchIds:[branch.branchId],prompt:'How much heavier is the left main side than the right? Work through the hanging balance first.',answer:String(gap)}}
  const s1=randint(10,15),gap=randint(2,5),s2=s1-gap,left=await balancedBranch('left',s1),right=await balancedBranch('right',s2);
  return{type:'find-difference',difficulty:level,readOnly:true,balancedBranchIds:[left.branchId,right.branchId],prompt:'Find the difference between the two main sides. Both smaller bars are balanced, so calculate the contribution of each whole branch.',answer:String(2*gap)};
}
async function buildSpot(level){
  if(level==='medium'){const S=randint(7,12),branch=await balancedBranch('left',S),wrong=2*S+randint(2,6);await addNumber('right',wrong);return{type:'spot-false-equality',difficulty:level,readOnly:true,balancedBranchIds:[branch.branchId],prompt:'A pupil says the main mobile is balanced. Are they correct? Explain how you know.',answer:'No. The left side totals '+(2*S)+' and the right side totals '+wrong+'.'}}
  const s1=randint(8,12),s2=s1+randint(1,4),left=await balancedBranch('left',s1),right=await balancedBranch('right',s2);
  return{type:'spot-false-equality',difficulty:level,readOnly:true,balancedBranchIds:[left.branchId,right.branchId],prompt:'A pupil says the whole mobile is balanced because both smaller bars are balanced. Are they correct? Explain.',answer:'No. The left branch totals '+(2*s1)+' and the right branch totals '+(2*s2)+'.'};
}
async function buildBalance(level){
  const side=Math.random()<.5?'left':'right',other=side==='left'?'right':'left';
  const sum=randint(9,15),gap=randint(2,6),branch=await balancedBranch(side,sum);
  let branches=[branch.branchId],answer=gap;
  if(level==='medium')await addNumber(other,2*sum+gap);
  else{const second=await balancedBranch(other,sum+gap);branches.push(second.branchId);answer=2*gap}
  return{type:'make-balance',difficulty:level,readOnly:true,balancedBranchIds:branches,prompt:'How much must be added to the lighter main side to balance the main bar?',answer:String(answer)};
}
async function complexChallenge(type,level){
  busy=true;closePopover();exposeSpec(null);
  try{
    if(type==='random'){const pool=[...COMPLEX];type=pool[Math.floor(Math.random()*pool.length)]}
    if(!COMPLEX.has(type)){await standardChallenge(type);return}
    if(!await enterCustomShell())throw new Error('Could not open Number Mobile custom challenge mode');
    let spec;if(type==='missing-weight')spec=await buildMissing(level);else if(type==='choose-relation')spec=await buildCompare(level);else if(type==='find-difference')spec=await buildDifference(level);else if(type==='spot-false-equality')spec=await buildSpot(level);else spec=await buildBalance(level);
    exposeSpec(spec);await setCustomCopy(spec);adapt();
  }catch(err){console.error('Number Mobile complex challenge:',err);exposeSpec(null)}
  finally{busy=false;adapt()}
}
function generate(type){
  if(busy)return;
  if(type==='random'||type.startsWith('random-')){
    randomScope=type;
    const category=type==='random'?'':type.slice(7);
    const pool=TYPES.filter(t=>!category||TYPE_CATEGORY[t]===category);
    const choices=pool.length>1?pool.filter(t=>t!==lastRandomType):pool;
    type=choices[Math.floor(Math.random()*choices.length)]||'missing-weight';lastRandomType=type;
  }else{randomScope=null;lastRandomType=null}
  G.numberMobileChallengeDifficulty=difficulty;
  return difficulty==='easy'?standardChallenge(type):complexChallenge(type,difficulty)
}
async function clearChallenge(){
  busy=true;closePopover();try{await selectWorkflow('challenge');const clear=await waitFor(()=>q('#ba-clear-challenge',controls()));exposeSpec(null);if(clear){clear.click();await wait(75)}}finally{busy=false;adapt()}
}

function numericText(el){const value=Number(String(el?.textContent||'').trim());return Number.isFinite(value)?value:0}
function sumTokens(container){return qa('[data-ba-token] strong',container).reduce((sum,strong)=>sum+numericText(strong),0)}
function mainTotals(){const w=work();return{left:sumTokens(q('.gd-eq-side--left .gd-eq-weights',w)),right:sumTokens(q('.gd-eq-side--right .gd-eq-weights',w))}}
function branchBalanced(branch){const left=q(':scope > .nmb-branch-sides > .nmb-branch-side--left > .nmb-branch-children',branch),right=q(':scope > .nmb-branch-sides > .nmb-branch-side--right > .nmb-branch-children',branch);return Math.abs(sumTokens(left)-sumTokens(right))<1e-9}
function mobileBalanced(){const totals=mainTotals();return Math.abs(totals.left-totals.right)<1e-9&&qa('.nmb-branch',work()).every(branchBalanced)}
function sideExpression(side){const box=q('.gd-eq-side--'+side+' .gd-eq-weights',work()),values=qa('[data-ba-token] strong',box).map(el=>String(el.textContent||'').trim()||'?');return values.length?values.join(' + '):'0'}
function promptText(){return String(q('.gd-challenge-prompt',banner())?.textContent||'').trim().toLowerCase()}
function maskChallengeReadouts(){
  const w=work(),b=banner();if(!w)return;const active=!!b;document.body.classList.toggle('nmb-v5-challenge-active',active);w.classList.toggle('nmb-v5-challenge-active',active);w.classList.toggle('nmb-v5-readonly',!!complexSpec?.readOnly);
  const totalsToggle=q('#ba-show-totals',controls())?.closest('label');if(totalsToggle)totalsToggle.style.display=active?'none':'';if(!active)return;
  const kicker=q('.gd-challenge-kicker',b);setText(kicker,'Challenge');
  const verdict=q('.gd-eq-verdict strong',w),verdictLabel=q('.gd-eq-verdict span',w),eq=q('[data-ba-equation]',w);let task='Challenge';
  if(complexSpec){
    if(complexSpec.type==='make-balance')task='Work out the missing amount';
    else if(complexSpec.type==='missing-weight')task=complexSpec.difficulty==='hard'?'Find both missing numbers':'Find the missing number';
    else if(complexSpec.type==='choose-relation')task='Compare the two main sides';
    else if(complexSpec.type==='find-difference')task='Find the difference';
    else if(complexSpec.type==='spot-false-equality')task='Check the pupil’s claim';
    if(eq){
      if(complexSpec.type==='make-balance')setText(eq,'Find the amount needed to balance the main bar');
      else if(complexSpec.type==='missing-weight')setText(eq,'Use the hanging balance'+(complexSpec.difficulty==='hard'?'s':'')+' to solve the missing number'+(complexSpec.difficulty==='hard'?'s':''));
      else if(complexSpec.type==='choose-relation')setText(eq,'Compare the two main sides');
      else if(complexSpec.type==='find-difference')setText(eq,'Find the difference between the main sides');
      else if(complexSpec.type==='spot-false-equality')setText(eq,'Is the main mobile balanced?');
    }
    (complexSpec.balancedBranchIds||[]).forEach(id=>{const branch=q('[data-nmb-branch="'+CSS.escape(String(id))+'"]',w);if(branch){branch.style.setProperty('--nmb-branch-angle','0deg');branch.style.setProperty('--nmb-branch-left','0px');branch.style.setProperty('--nmb-branch-right','0px')}});
  }else{
    const prompt=promptText();
    if(/make both sides equal|make it balance/.test(prompt))task=mainTotals().left===mainTotals().right?'Balanced ✓':'Keep adjusting the balance';
    else if(/which symbol|<, > or =/.test(prompt)){task='Choose <, > or =';setText(eq,sideExpression('left')+' ? '+sideExpression('right'))}
    else if(/how much heavier|difference/.test(prompt)){task='Find the difference';setText(eq,'Find the difference between the two sides')}
    else if(/pupil says|are they correct|false equality/.test(prompt)){task='Check the equality';setText(eq,sideExpression('left')+' = '+sideExpression('right'))}
    else if(/hidden|question mark|missing/.test(prompt)){task='Find the missing number';setText(eq,sideExpression('left')+' = '+sideExpression('right'))}
    else if(/add .*both sides|both sides/.test(prompt))task='Keep both sides equal';
  }
  setText(verdict,task);setText(verdictLabel,complexSpec?.type==='make-balance'?'Status':'Task');
}
function freezeReadonly(){
  if(!complexSpec?.readOnly)return;const w=work();if(!w)return;
  qa('[data-ba-token],[data-ba-stage-add],.nmb-branch-add,.nmb-branch-empty',w).forEach(el=>{const answer=el.matches('[data-ba-token]')&&Object.prototype.hasOwnProperty.call(complexSpec.answerByToken||{},String(el.dataset.baToken))&&document.body.classList.contains('nmb-v8-pupil-challenge');el.disabled=!answer;if(answer)el.removeAttribute('aria-disabled');else el.setAttribute('aria-disabled','true')});
  qa('.nmb-keypad,.nmb-tile-toolbar,.nmb-branch-toolbar',w).forEach(el=>el.remove());
  ['ba-move','ba-duplicate','ba-delete','ba-minus','ba-plus','ba-value','ba-hidden'].forEach(id=>{const el=document.getElementById(id);if(el)el.disabled=true});
}
function ensureAnother(){
  const b=banner();if(!b||!complexSpec)return;const actions=q('.gd-challenge-actions',b);if(!actions||q('[data-nmb-v6-another]',actions))return;
  const button=document.createElement('button');button.type='button';button.className='gd-challenge-action';button.dataset.nmbV6Another='1';button.textContent='Another';button.onclick=e=>{e.stopPropagation();complexChallenge(complexSpec.type,complexSpec.difficulty)};
  actions.insertBefore(button,q('[data-board-action="reveal"]',actions)||null);
}
function adapt(){
  const w=work();if(!w)return;hookTrigger();maskChallengeReadouts();freezeReadonly();ensureAnother();syncBoardButton();
  if(popoverOpen&&!q('.nmb-v5-challenge-popover',w)){w.appendChild(challengePopover());q('[data-nmb-challenge-toggle]',w)?.setAttribute('aria-expanded','true')}
}
function install(){
  if(installed)return;
  window.addEventListener('click',e=>{
    const another=e.target?.closest?.('[data-nmb-v6-another],[data-challenge-action="another"]');
    if(!another||!randomScope||!work()||!banner()||busy)return;
    e.preventDefault();e.stopImmediatePropagation();
    const scope=randomScope;closePopover();togglePopover();q('[data-nmb-v6-type="'+scope+'"]',work())?.click();
  },true);installed=true;G.numberMobileChallengeDifficulty=difficulty;G.numberMobileChallengeSpec=null;
  document.addEventListener('click',e=>{
    if(popoverOpen&&!e.target.closest?.('.nmb-v5-challenge-popover,[data-nmb-challenge-toggle]'))closePopover();
    scheduleAdapt(0);scheduleAdapt(70);
  },true);
  document.addEventListener('change',()=>scheduleAdapt(40),true);document.addEventListener('input',()=>scheduleAdapt(40),true);document.addEventListener('pointerup',()=>scheduleAdapt(60),true);
  adapt();
}
G.balanceTool=function numberMobileBalanceToolV6(){const result=balanceToolV4.apply(this,arguments);exposeSpec(null);popoverOpen=false;randomScope=null;lastRandomType=null;setTimeout(adapt,30);setTimeout(adapt,130);return result};
G.numberMobileChallengeSession={
  capture(){if(busy)throw new Error('Wait for the Number Mobile challenge to finish generating.');return {difficulty,spec:complexSpec,randomScope,lastRandomType}},
  restore(saved){
    difficulty=['easy','medium','hard'].includes(saved?.difficulty)?saved.difficulty:'easy';
    G.numberMobileChallengeDifficulty=difficulty;
    exposeSpec(saved?.spec||null);popoverOpen=false;
    randomScope=['random','random-read','random-build','random-reason'].includes(saved?.randomScope)?saved.randomScope:null;
    lastRandomType=TYPES.includes(saved?.lastRandomType)?saved.lastRandomType:null;
  },
  refresh(){adapt()}
};
G.numberMobileChallengeIsBuilding=()=>busy;
G.numberMobileBalanceEnhancementVersion='6.3';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else queueMicrotask(install);
})(window.TT99Goodies);
;


/* ===== v6-blank-bridge ===== */
/* Number Mobile v6 state bridge.
 * Keeps generated blank boxes in sync with the v3 Number Mobile editor and
 * protects the v6 Challenge trigger during the brief redraw/rebind window.
 */
(function(){
'use strict';

function replayChallengeClick(attempt=0){
  const fresh=document.querySelector('#gd-stage .gd-number-mobile-workbench [data-nmb-challenge-toggle]');
  if(fresh?.dataset.nmbV6Bound){fresh.click();return}
  if(attempt<8)setTimeout(()=>replayChallengeClick(attempt+1),16);
}

/* A redraw replaces the v4 Challenge button. If it is clicked before v6 has
 * rebound that fresh node, hold the click and replay it after the rebind. */
document.addEventListener('click',event=>{
  const trigger=event.target?.closest?.('[data-nmb-challenge-toggle]');
  if(!trigger||trigger.dataset.nmbV6Bound)return;
  event.preventDefault();event.stopPropagation();
  setTimeout(()=>replayChallengeClick(),16);
},true);

/* Branch-created Number Mobile boxes start with v3's own blank flag. The base
 * challenge builder edits values through #ba-value. When that selected box is
 * still a Number Mobile blank, mirror the value through the matching keypad in
 * the same event turn. This clears v3's blank state synchronously, while the
 * builder remains free to continue using its normal synchronous balance edit.
 * Matching by data-ba-selected/data-nmb-keypad prevents edits spilling into a
 * previously focused box. */
document.addEventListener('change',event=>{
  const input=event.target;if(!input||input.id!=='ba-value')return;
  const work=document.querySelector('#gd-stage .gd-number-mobile-workbench');if(!work)return;
  const selected=work.querySelector('.gd-eq-selected[data-ba-selected]');if(!selected)return;
  const id=String(selected.dataset.baSelected||'');if(!id)return;
  const tile=work.querySelector('[data-ba-token="'+CSS.escape(id)+'"]');
  if(!tile?.classList.contains('is-blank-box'))return;
  const pad=work.querySelector('.nmb-keypad[data-nmb-keypad="'+CSS.escape(id)+'"]');if(!pad)return;
  const text=String(input.value??'').trim();if(!/^\d+(?:\.\d+)?$/.test(text))return;

  /* Do not cancel the builder's original value edit. The keypad pass is only
     responsible for clearing/updating v3's presentation state. v3 queues its
     engine writes until after this event turn, so these synchronous key clicks
     can safely share the current keypad node. */
  pad.querySelector('[data-nmb-blank]')?.click();
  for(const key of text){
    const button=[...pad.querySelectorAll('[data-nmb-key]')].find(el=>el.dataset.nmbKey===key);
    if(button)button.click();
  }
  pad.querySelector('[data-nmb-done]')?.click();
},true);
})();
;


/* ===== v7 ===== */
/* 99 Club Studio · Number Mobile Balance v7
 * Challenge UX guard: construct puzzles behind a curtain so hidden answers are
 * never briefly visible, and expose a direct Exit challenge action.
 */
(function(G){
'use strict';
if(!G)return;

const BUILD_CLASS='nmb-v7-challenge-building';
let installed=false,building=false,buildSeq=0,buildStarted=0,checkTimer=null,failSafeTimer=null,observer=null,exiting=false,originBanner=null;

function q(sel,root=document){return root?.querySelector?.(sel)||null}
function stage(){return document.getElementById('gd-stage')}
function controls(){return document.getElementById('gd-controls')}
function work(){return q('.gd-number-mobile-workbench',stage())}
function banner(){return work()?q('.gd-challenge-banner',stage()):null}
function wait(ms=30){return new Promise(resolve=>setTimeout(resolve,ms))}
async function waitFor(fn,{tries=50,delay=30}={}){for(let i=0;i<tries;i++){const value=fn();if(value)return value;await wait(delay)}return null}

function setBuilding(on){
  building=!!on;
  document.documentElement.classList.toggle(BUILD_CLASS,building);
  document.body.classList.toggle(BUILD_CLASS,building);
  if(building)document.body.setAttribute('aria-busy','true');else document.body.removeAttribute('aria-busy');
}
function finishBuild(seq){
  if(seq!==buildSeq)return;
  clearTimeout(checkTimer);clearTimeout(failSafeTimer);checkTimer=failSafeTimer=null;originBanner=null;
  setBuilding(false);ensureExit();G.numberMobilePupilState?.refresh?.();G.numberMobileNumericInput?.refresh?.();
}
function finalChallengeReady(){
  const b=banner(),w=work();if(!b||!w||q('.nmb-v5-challenge-popover',w))return false;
  if(originBanner&&b===originBanner)return false;
  if(G.numberMobileChallengeIsBuilding?.())return false;
  const prompt=String(q('.gd-challenge-prompt',b)?.textContent||'').trim();
  if(!prompt||/write your challenge here/i.test(prompt))return false;
  /* Medium/Hard complex puzzles are assembled through the custom editor. The
   * temporary custom banner exists long before branches/unknowns are ready, so
   * do not drop the curtain until v6 publishes the completed challenge spec. */
  const customEditor=!!q('#ba-custom-title',controls());
  if(customEditor&&!G.numberMobileChallengeSpec)return false;
  return true;
}
function checkBuild(seq){
  if(!building||seq!==buildSeq)return;
  if(checkTimer!==null)return;
  checkTimer=setTimeout(()=>{
    checkTimer=null;
    if(!building||seq!==buildSeq)return;
    const oldEnough=Date.now()-buildStarted>=180;
    if(!oldEnough||!finalChallengeReady()){checkBuild(seq);return}
    finishBuild(seq);
  },45);
}
function beginBuild(){
  clearTimeout(checkTimer);checkTimer=null;
  const seq=++buildSeq;buildStarted=Date.now();originBanner=banner();setBuilding(true);checkBuild(seq);
  clearTimeout(failSafeTimer);failSafeTimer=setTimeout(()=>{if(seq!==buildSeq)return;if(finalChallengeReady()||!banner())finishBuild(seq);else if(!G.numberMobileChallengeIsBuilding?.())exitChallenge()},30000);
}
function noteMutation(){
  if(!building&&!work())return;
  if(building)checkBuild(buildSeq);
  else ensureExit();
}

async function clearThroughNumberMobile(){
  if(!banner()||!G.numberMobileChallengeSpec)return false;
  const trigger=q('[data-nmb-challenge-toggle]',work());if(!trigger)return false;
  trigger.click();
  const popClear=await waitFor(()=>q('[data-nmb-v6-clear]',work()),{tries:24,delay:25});
  if(!popClear)return false;
  popClear.click();
  await waitFor(()=>!banner(),{tries:44,delay:25});
  return !banner();
}
async function exitChallenge(){
  if(exiting)return;exiting=true;
  try{
    if(building)finishBuild(buildSeq);
    /* Complex Medium/Hard challenges keep Number Mobile-specific state in v6.
     * Clear through that layer first so its read-only spec is released before
     * the shared challenge banner disappears. */
    if(await clearThroughNumberMobile())return;
    const challengeTab=q('[data-ba-workflow="challenge"]',controls());if(challengeTab)challengeTab.click();
    const clear=await waitFor(()=>q('#ba-clear-challenge',controls()),{tries:30,delay:25});
    if(clear){clear.click();await waitFor(()=>!banner(),{tries:36,delay:25})}
    if(banner()){
      const trigger=q('[data-nmb-challenge-toggle]',work());if(trigger)trigger.click();
      const popClear=await waitFor(()=>q('[data-nmb-v6-clear]',work()),{tries:20,delay:25});if(popClear)popClear.click();
      await waitFor(()=>!banner(),{tries:36,delay:25});
    }
  }finally{exiting=false;ensureExit()}
}
function ensureExit(){
  const b=banner();if(!b)return;
  const actions=q('.gd-challenge-actions',b);if(!actions||q('[data-nmb-v7-exit]',actions))return;
  const button=document.createElement('button');button.type='button';button.className='gd-challenge-action nmb-v7-exit-challenge';button.dataset.nmbV7Exit='1';button.textContent='Exit challenge';button.title='Return to normal Number Mobile mode';button.setAttribute('aria-label','Exit challenge mode');
  button.onclick=e=>{e.preventDefault();e.stopPropagation();exitChallenge()};
  actions.appendChild(button);
}
function installObserver(){
  observer?.disconnect();const root=document.getElementById('tt99-goodies-root');if(!root)return;
  observer=new MutationObserver(noteMutation);observer.observe(root,{childList:true,subtree:true,characterData:true});
}
function captureChallengeStart(e){
  const target=e.target?.closest?.('[data-nmb-v6-type],[data-nmb-v6-another]');if(!target)return;
  beginBuild();
}
function install(){
  if(installed)return;installed=true;
  document.addEventListener('click',captureChallengeStart,true);
  document.addEventListener('click',()=>{if(work())setTimeout(ensureExit,0)},true);
  installObserver();ensureExit();
}

G.numberMobileChallengeUxVersion='7.3';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else queueMicrotask(install);
})(window.TT99Goodies);
;


/* ===== v5-embed ===== */
/* Number Mobile embedded-workflow guard.
 * The mixed whiteboard intentionally hides the legacy Challenge settings tab.
 * The direct Number Mobile challenge UI still uses that shared engine behind
 * the scenes, so do not let the embed simplifier switch back to Explore while
 * a generated challenge is being built, cleared or regenerated.
 *
 * Important: this guard runs on WINDOW capture. Newer Number Mobile challenge
 * layers can legitimately intercept a challenge-type click before it reaches
 * document capture. Arming here guarantees the embedded workflow is protected
 * even on the very first intercepted challenge launch.
 */
(function(){
'use strict';
let guardUntil=0;
function arm(){guardUntil=Date.now()+15000}
function guarded(){return Date.now()<guardUntil}
function capture(event){
  const target=event.target?.closest?.('button');if(!target)return;
  if(target.matches('[data-nmb-v6-type],[data-nmb-v6-clear],[data-nmb-v6-another]')){arm();return}
  if(document.body.classList.contains('gd-embed-page')&&guarded()&&!event.isTrusted&&target.matches('[data-ba-workflow="explore"]')){
    event.preventDefault();event.stopImmediatePropagation();
  }
}
window.addEventListener('click',capture,true);
})();
;


/* ===== v8 ===== */
/* 99 Club Studio · Number Mobile Balance v8
 * Pupil-facing challenge layer. Challenge mode is deliberately different from
 * teacher edit mode: fixed boxes are inert, ? boxes accept answers directly,
 * and non-missing-number challenges use a simple response panel.
 */
(function(G){
'use strict';
if(!G)return;

const ACTIVE_CLASS='nmb-v8-pupil-challenge';
let installed=false,observer=null,adaptQueued=false,lastKey=null,activeTileId=null;
const answers=new Map();
let responseBuffer='',feedback='',feedbackKind='',choiceValue='';

function q(sel,root=document){return root?.querySelector?.(sel)||null}
function qa(sel,root=document){return root?.querySelectorAll?[...root.querySelectorAll(sel)]:[]}
function stage(){return document.getElementById('gd-stage')}
function work(){return q('.gd-number-mobile-workbench',stage())}
function banner(){return q('.gd-challenge-banner',stage())}
function challengeActive(){return !!(banner()&&work())}
function challengeBuilding(){return document.body.classList.contains('nmb-v7-challenge-building')||document.documentElement.classList.contains('nmb-v7-challenge-building')}
function pupilActive(){return challengeActive()&&!challengeBuilding()}
function revealed(){const b=banner();return !!(b&&(q('.gd-challenge-actions em',b)||/hide answer/i.test(q('[data-board-action="reveal"]',b)?.textContent||'')))}
function text(el){return String(el?.textContent||'').trim()}
function numeric(str){const raw=String(str??'').trim();if(!raw||raw==='.'||raw==='?')return null;const n=Number(raw);return Number.isFinite(n)?n:null}
function scheduleAdapt(){if(adaptQueued)return;adaptQueued=true;queueMicrotask(()=>{adaptQueued=false;adapt()})}
function challengeKey(){return G.numberMobileEngineState?.challengeIdentity?.()||banner()}
function intendedAnswers(){const map=G.numberMobileChallengeSpec?.answerByToken;return map&&typeof map==='object'?map:null}
function isIntendedAnswerTile(tile){const map=intendedAnswers(),id=String(tile?.dataset?.baToken||'');return map?Object.prototype.hasOwnProperty.call(map,id):(text(q('strong',tile))==='?'||answers.has(id))}
function unknownTiles(){const map=intendedAnswers();if(map)return Object.keys(map).map(id=>q('[data-ba-token="'+CSS.escape(String(id))+'"]',work())).filter(Boolean);return qa('[data-ba-token]',work()).filter(tile=>text(q('strong',tile))==='?'||answers.has(String(tile.dataset.baToken)))}
function visibleNumber(tile){return numeric(text(q('strong',tile)))}
function sumTokens(root,except=null){return qa('[data-ba-token]',root).reduce((sum,tile)=>{if(except&&tile===except)return sum;const n=visibleNumber(tile);return sum+(n==null?0:n)},0)}
function mainSide(side){return q('.gd-eq-side--'+side+' .gd-eq-weights',work())}
function mainTotals(){return{left:sumTokens(mainSide('left')),right:sumTokens(mainSide('right'))}}
function relation(){const t=mainTotals();return Math.abs(t.left-t.right)<1e-9?'=':t.left>t.right?'>':'<'}
function challengeType(){
  if(unknownTiles().length)return'missing';
  const type=G.numberMobileChallengeSpec?.type||G.numberMobileEngineState?.challengeIdentity?.()?.type;
  const types={'find-difference':'difference','make-balance':'balance','choose-relation':'compare','spot-false-equality':'spot','same-to-both':'same'};
  if(types[type])return types[type];
  const b=banner(),copy=(text(q('.gd-challenge-prompt',b))+' '+text(q('.gd-challenge-copy h3',b))+' '+text(q('[data-ba-equation]',work()))).toLowerCase();
  if(G.numberMobileChallengeSpec?.type==='make-balance'||/how much.*(?:add|added).*lighter.*balance/.test(copy))return'balance';
  if(/difference|how much heavier/.test(copy))return'difference';
  if(/which symbol|compare|which .*side.*heavier|which main side/.test(copy))return'compare';
  if(/pupil says|are they correct|claim|spot .*mistake|false equal/.test(copy))return'spot';
  if(/same .*both|add .*both sides|what happens to .*equality/.test(copy))return'same';
  if(/make .*balance|make both sides equal|make every bar|make the entire mobile/.test(copy))return'balance';
  return'generic';
}
function branchExpected(tile){
  const branch=tile.closest('.nmb-branch');if(!branch)return null;
  const side=tile.closest('.nmb-branch-side--right')?'right':'left',other=side==='left'?'right':'left';
  const same=q(':scope > .nmb-branch-sides > .nmb-branch-side--'+side+' > .nmb-branch-children',branch),opposite=q(':scope > .nmb-branch-sides > .nmb-branch-side--'+other+' > .nmb-branch-children',branch);if(!same||!opposite)return null;
  const unresolved=qa('[data-ba-token]',same).filter(el=>el!==tile&&isIntendedAnswerTile(el));if(unresolved.length)return null;
  return sumTokens(opposite)-sumTokens(same,tile);
}
function mainExpected(tile){
  const side=tile.closest('.gd-eq-side--right')?'right':'left',other=side==='left'?'right':'left',same=mainSide(side),opposite=mainSide(other);if(!same||!opposite)return null;
  const unresolved=qa('[data-ba-token]',same).filter(el=>el!==tile&&isIntendedAnswerTile(el));if(unresolved.length)return null;
  return sumTokens(opposite)-sumTokens(same,tile);
}
function expectedForTile(tile){const map=intendedAnswers(),id=String(tile?.dataset?.baToken||'');if(map&&Object.prototype.hasOwnProperty.call(map,id)){const expected=Number(map[id]);return Number.isFinite(expected)?expected:null}const branch=branchExpected(tile);return branch==null?mainExpected(tile):branch}
function normalise(value){return String(value??'').trim().toLowerCase().replace(/\s+/g,' ')}
function setFeedback(message,kind=''){feedback=message;feedbackKind=kind;renderFeedback();const reveal=q('[data-board-action="reveal"]',banner());if(reveal&&!revealed())reveal.hidden=kind==='correct'}
function renderFeedback(){const el=q('[data-nmb-v8-feedback]',stage());if(!el)return;if(el.textContent!==(feedback||''))el.textContent=feedback||'';el.className='nmb-v8-feedback'+(feedbackKind?' is-'+feedbackKind:'');el.setAttribute('aria-live','polite')}
function answerState(id){if(!answers.has(id))answers.set(id,{buffer:'',correct:false,wrong:false});return answers.get(id)}
function renderTileAnswer(tile){const state=answers.get(String(tile.dataset.baToken));if(!state)return;const strong=q('strong',tile);if(strong&&strong.textContent!==(state.buffer||'?'))strong.textContent=state.buffer||'?';tile.classList.toggle('nmb-v8-answer-correct',!!state.correct);tile.classList.toggle('nmb-v8-answer-wrong',!!state.wrong);tile.setAttribute('aria-label',state.buffer?'Answer box. Current answer '+state.buffer:'Answer box. Tap to enter the missing number')}
function closePad(){activeTileId=null;q('.nmb-v8-answer-pad',stage())?.remove()}
function checkTile(tile){
  const unknowns=unknownTiles();
  if(unknowns.length>1){
    const rows=unknowns.map(el=>({el,state:answerState(String(el.dataset.baToken)),expected:expectedForTile(el)}));
    if(rows.some(row=>numeric(row.state.buffer)==null)){setFeedback('Fill in all ? boxes, then check.');return}
    const correct=rows.every(row=>row.expected!=null&&Math.abs(numeric(row.state.buffer)-row.expected)<1e-9);
    rows.forEach(row=>{row.state.correct=correct;row.state.wrong=!correct&&!(row.expected!=null&&Math.abs(numeric(row.state.buffer)-row.expected)<1e-9);renderTileAnswer(row.el)});
    setFeedback(correct?'Correct ✓':'Not quite — check both answers.',correct?'correct':'wrong');
    if(correct)closePad();return;
  }
  const state=answerState(String(tile.dataset.baToken)),expected=expectedForTile(tile),given=numeric(state.buffer);
  if(expected==null||!Number.isFinite(expected)){state.wrong=true;renderTileAnswer(tile);setFeedback('Not quite — try again.','wrong');return}
  if(given!=null&&Math.abs(given-expected)<1e-9){state.correct=true;state.wrong=false;renderTileAnswer(tile);setFeedback('Correct ✓','correct');closePad()}
  else{state.correct=false;state.wrong=true;renderTileAnswer(tile);setFeedback('Not quite — try again.','wrong')}
}
function answerPad(tile){
  closePad();const host=work();if(!host)return;const id=String(tile.dataset.baToken),state=answerState(id),pad=document.createElement('div');activeTileId=id;pad.className='nmb-v8-answer-pad';pad.dataset.nmbV8AnswerPad=id;
  pad.innerHTML='<div class="nmb-v8-answer-pad__head"><strong>Enter your answer</strong><button type="button" data-nmb-v8-close aria-label="Close number pad">×</button></div><div class="nmb-v8-answer-display">'+(state.buffer||'?')+'</div><div class="nmb-v8-answer-digits">'+['7','8','9','4','5','6','1','2','3','0','.','⌫'].map(key=>'<button type="button" data-nmb-v8-key="'+key+'">'+key+'</button>').join('')+'</div><button type="button" class="nmb-v8-check" data-nmb-v8-check>Check</button>';
  host.appendChild(pad);const wr=host.getBoundingClientRect(),tr=tile.getBoundingClientRect(),width=225,height=300;let left=tr.right-wr.left+10,top=tr.top-wr.top-18;if(left+width>wr.width)left=Math.max(8,tr.left-wr.left-width-10);if(top+height>wr.height)top=Math.max(8,wr.height-height-8);pad.style.left=left+'px';pad.style.top=top+'px';
  q('[data-nmb-v8-close]',pad).onclick=closePad;
  qa('[data-nmb-v8-key]',pad).forEach(button=>button.onclick=()=>{if(state.correct)return;const key=button.dataset.nmbV8Key;if(key==='⌫')state.buffer=state.buffer.slice(0,-1);else if(key==='.'&&!state.buffer.includes('.'))state.buffer=(state.buffer||'0')+'.';else if(key!=='.')state.buffer=(state.buffer+key).replace(/^0(?=\d)/,'');state.wrong=false;q('.nmb-v8-answer-display',pad).textContent=state.buffer||'?';renderTileAnswer(tile);setFeedback('','')});q('[data-nmb-v8-check]',pad).onclick=()=>checkTile(tile);
}
function numericResponseExpected(type){const t=mainTotals();return type==='difference'||type==='balance'?Math.abs(t.left-t.right):null}
function responseChoice(type){
  if(type==='compare'){const prompt=text(q('.gd-challenge-prompt',banner())).toLowerCase();if(/symbol|<, >|<.*>.*=/.test(prompt))return{options:['<','=','>'],correct:relation()};const rel=relation();return{options:['Left','Balanced','Right'],correct:rel==='>'?'Left':rel==='<'?'Right':'Balanced'}}
  if(type==='spot')return{options:['Yes','No'],correct:relation()==='='?'Yes':'No'};
  if(type==='same')return{options:['Stays equal','Does not stay equal'],correct:'Stays equal'};
  return null;
}
function responseInstructions(type){if(type==='difference')return'Enter the difference between the two main sides.';if(type==='balance')return'Enter the amount needed to balance the main bar.';if(type==='compare')return'Choose your answer.';if(type==='spot')return'Is the pupil correct?';if(type==='same')return'What happens to the equality?';return'Enter your answer.'}
function checkNumericResponse(type,panel){const expected=numericResponseExpected(type),given=numeric(responseBuffer);setFeedback(given!=null&&expected!=null&&Math.abs(given-expected)<1e-9?'Correct ✓':'Not quite — try again.',given!=null&&expected!=null&&Math.abs(given-expected)<1e-9?'correct':'wrong');q('.nmb-v8-response-display',panel)?.focus?.()}
function insertResponsePanel(panel){const w=work();if(!w)return;const summary=q('.gd-eq-summary',w);if(summary)summary.insertAdjacentElement('afterend',panel);else w.prepend(panel)}
function responsePanel(type){
  const existing=q('.nmb-v8-response-panel',stage());if(existing)return existing;const panel=document.createElement('div');panel.className='nmb-v8-response-panel';panel.dataset.nmbV8Response=type;const choice=responseChoice(type);
  if(choice){panel.innerHTML='<span class="nmb-v8-response-label">'+responseInstructions(type)+'</span><div class="nmb-v8-choice-row">'+choice.options.map(option=>'<button type="button" data-nmb-v8-choice="'+option.replace(/"/g,'&quot;')+'">'+option+'</button>').join('')+'</div><span class="nmb-v8-feedback" data-nmb-v8-feedback aria-live="polite"></span>';qa('[data-nmb-v8-choice]',panel).forEach(button=>button.onclick=()=>{choiceValue=button.dataset.nmbV8Choice;const ok=normalise(choiceValue)===normalise(choice.correct);qa('[data-nmb-v8-choice]',panel).forEach(b=>b.classList.remove('is-correct','is-wrong'));button.classList.add(ok?'is-correct':'is-wrong');setFeedback(ok?'Correct ✓':'Not quite — try again.',ok?'correct':'wrong')})}
  else if(type==='difference'||type==='balance'){panel.innerHTML='<span class="nmb-v8-response-label">'+responseInstructions(type)+'</span><div class="nmb-v8-number-response"><div class="nmb-v8-response-display" tabindex="0">'+(responseBuffer||'?')+'</div><div class="nmb-v8-response-keys">'+['7','8','9','4','5','6','1','2','3','0','⌫'].map(k=>'<button type="button" data-nmb-v8-response-key="'+k+'">'+k+'</button>').join('')+'</div><button type="button" class="nmb-v8-check" data-nmb-v8-response-check>Check</button></div><span class="nmb-v8-feedback" data-nmb-v8-feedback aria-live="polite"></span>';qa('[data-nmb-v8-response-key]',panel).forEach(button=>button.onclick=()=>{const key=button.dataset.nmbV8ResponseKey;if(key==='⌫')responseBuffer=responseBuffer.slice(0,-1);else responseBuffer=(responseBuffer+key).replace(/^0(?=\d)/,'');q('.nmb-v8-response-display',panel).textContent=responseBuffer||'?';setFeedback('','')});q('[data-nmb-v8-response-check]',panel).onclick=()=>checkNumericResponse(type,panel)}
  else panel.innerHTML='<span class="nmb-v8-response-label">Think through the mobile, then tell your teacher your answer.</span><span class="nmb-v8-feedback" data-nmb-v8-feedback aria-live="polite"></span>';
  insertResponsePanel(panel);if(choice&&choiceValue){const selected=qa('[data-nmb-v8-choice]',panel).find(b=>b.dataset.nmbV8Choice===choiceValue);if(selected)selected.classList.add(feedbackKind==='correct'?'is-correct':'is-wrong')}renderFeedback();return panel;
}
function missingPanel(){let panel=q('.nmb-v8-response-panel',stage());if(panel)return panel;panel=document.createElement('div');panel.className='nmb-v8-response-panel is-missing';panel.dataset.nmbV8Response='missing';panel.innerHTML='<span class="nmb-v8-response-label">Tap a <strong>?</strong> box and enter the missing number.</span><span class="nmb-v8-feedback" data-nmb-v8-feedback aria-live="polite"></span>';insertResponsePanel(panel);renderFeedback();return panel}
function hideTeacherControls(active){
  if(active)qa('.nmb-keypad,.nmb-tile-toolbar,.nmb-branch-toolbar',work()).forEach(el=>el.remove());
  try{if(window.parent!==window){const rail=window.frameElement?.closest?.('[data-board-object]')?.querySelector?.('[data-board-quick-actions]');if(rail)qa(':scope > button',rail).forEach(button=>{if(!button.dataset.nmbBoardChallenge)button.hidden=active})}}catch(_err){}
}
function restoreBoardRail(){try{if(window.parent!==window){const rail=window.frameElement?.closest?.('[data-board-object]')?.querySelector?.('[data-board-quick-actions]');if(rail)qa(':scope > button',rail).forEach(button=>button.hidden=false)}}catch(_err){}}
function prepareUnknownTiles(){const unknowns=unknownTiles();unknowns.forEach(tile=>{const id=String(tile.dataset.baToken);tile.disabled=false;tile.removeAttribute('disabled');tile.removeAttribute('aria-disabled');tile.classList.add('nmb-v8-answer-box');answerState(id);renderTileAnswer(tile)});return unknowns}
function compactPrompt(type){const p=q('.gd-challenge-prompt',banner());if(p&&type==='balance'&&p.textContent!=='How much must be added to the lighter main side to balance the main bar?')p.textContent='How much must be added to the lighter main side to balance the main bar?'}
function resetChallengeState(){answers.clear();activeTileId=null;responseBuffer='';feedback='';feedbackKind='';choiceValue='';closePad();q('.nmb-v8-response-panel',stage())?.remove()}
function adapt(){
  if(!work()){if(lastKey){resetChallengeState();lastKey=null;restoreBoardRail()}document.body.classList.remove(ACTIVE_CLASS);document.documentElement.classList.remove(ACTIVE_CLASS);return}
  if(challengeBuilding()){document.body.classList.remove(ACTIVE_CLASS);document.documentElement.classList.remove(ACTIVE_CLASS);setTimeout(scheduleAdapt,80);return}
  const active=challengeActive();document.body.classList.toggle(ACTIVE_CLASS,active);document.documentElement.classList.toggle(ACTIVE_CLASS,active);
  if(!active){if(lastKey){resetChallengeState();lastKey=null}hideTeacherControls(false);restoreBoardRail();return}
  const key=challengeKey();if(key!==lastKey){resetChallengeState();lastKey=key}hideTeacherControls(true);const type=challengeType();compactPrompt(type);
  if(revealed()){closePad();q('.nmb-v8-response-panel',stage())?.remove();return}
  const unknowns=prepareUnknownTiles();if(unknowns.length)missingPanel();else responsePanel(type);
  setFeedback(feedback,feedbackKind);
}
function intercept(e){
  if(!pupilActive()||revealed())return;const target=e.target?.closest?.('[data-ba-token],.nmb-branch-bar,.nmb-branch-add,.nmb-branch-empty,[data-ba-stage-add],.nmb-tile-toolbar,.nmb-branch-toolbar,.nmb-keypad');if(!target)return;const tile=target.closest?.('[data-ba-token]');e.preventDefault();e.stopImmediatePropagation();if(tile&&isIntendedAnswerTile(tile)){const state=answerState(String(tile.dataset.baToken));if(!state.correct)answerPad(tile)}
}
function blankClick(e){if(!pupilActive())return;if(e.target.closest?.('.nmb-v8-answer-pad,.nmb-v8-response-panel,.gd-challenge-banner,[data-ba-token]'))return;closePad()}
function keyboard(e){
  if(!pupilActive()||revealed()||e.ctrlKey||e.metaKey||e.altKey)return;const tag=String(e.target?.tagName||'').toLowerCase();if(['input','textarea','select'].includes(tag))return;
  if(activeTileId){const tile=q('[data-ba-token="'+CSS.escape(activeTileId)+'"]',work()),state=tile&&answerState(activeTileId);if(!tile||!state||state.correct)return;if(/^\d$/.test(e.key)){e.preventDefault();state.buffer=(state.buffer+e.key).replace(/^0(?=\d)/,'');state.wrong=false;renderTileAnswer(tile);const d=q('.nmb-v8-answer-display',stage());if(d)d.textContent=state.buffer||'?'}else if(e.key==='Backspace'){e.preventDefault();state.buffer=state.buffer.slice(0,-1);state.wrong=false;renderTileAnswer(tile);const d=q('.nmb-v8-answer-display',stage());if(d)d.textContent=state.buffer||'?'}else if(e.key==='Enter'){e.preventDefault();checkTile(tile)}return}
  const type=challengeType(),numericMode=type==='difference'||type==='balance';if(numericMode&&/^\d$/.test(e.key)){e.preventDefault();responseBuffer=(responseBuffer+e.key).replace(/^0(?=\d)/,'');const d=q('.nmb-v8-response-display',stage());if(d)d.textContent=responseBuffer||'?'}else if(numericMode&&e.key==='Backspace'){e.preventDefault();responseBuffer=responseBuffer.slice(0,-1);const d=q('.nmb-v8-response-display',stage());if(d)d.textContent=responseBuffer||'?'}else if(numericMode&&e.key==='Enter'){e.preventDefault();const panel=q('.nmb-v8-response-panel',stage());if(panel)checkNumericResponse(type,panel)}
}
function observe(){observer?.disconnect();const s=stage();if(!s)return;observer=new MutationObserver(scheduleAdapt);observer.observe(s,{childList:true})}
function install(){
  if(installed)return;installed=true;document.addEventListener('pointerdown',intercept,true);document.addEventListener('click',intercept,true);document.addEventListener('click',blankClick,true);document.addEventListener('keydown',keyboard,true);document.addEventListener('click',()=>setTimeout(scheduleAdapt,0),true);document.addEventListener('change',scheduleAdapt,true);
  observe();const root=document.getElementById('tt99-goodies-root');if(root){const rootObserver=new MutationObserver(()=>{observe();scheduleAdapt()});rootObserver.observe(root,{childList:true})}scheduleAdapt();
}
G.numberMobilePupilState={
  capture:()=>({answers:[...answers].map(([id,state])=>[id,{...state}]),responseBuffer,choiceValue,feedback,feedbackKind}),
  restore(saved){
    resetChallengeState();lastKey=challengeKey();
    if(saved){
      for(const [id,state] of saved.answers||[])answers.set(String(id),{buffer:String(state.buffer),correct:!!state.correct,wrong:!!state.wrong});
      responseBuffer=String(saved.responseBuffer||'');choiceValue=String(saved.choiceValue||'');
      feedback=String(saved.feedback||'');feedbackKind=saved.feedbackKind||'';
    }
    adapt();
    if(!revealed())setFeedback(feedback,feedbackKind);
  },
  refresh(){adapt()}
};
G.numberMobilePupilChallengeVersion='8.4';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else queueMicrotask(install);
})(window.TT99Goodies);
;


/* ===== v10 ===== */
/* Number Mobile Balance v10 · event-driven pupil challenge state */
(function(G){
'use strict';
if(!G)return;
let regenerating=false;

function q(sel,root=document){return root?.querySelector?.(sel)||null}
function qa(sel,root=document){return root?.querySelectorAll?[...root.querySelectorAll(sel)]:[]}
function stage(){return document.getElementById('gd-stage')}
function work(){return q('.gd-number-mobile-workbench',stage())}
function banner(){return q('.gd-challenge-banner',stage())}
function spec(){return G.numberMobileChallengeSpec||null}
function wait(ms=30){return new Promise(resolve=>setTimeout(resolve,ms))}
async function waitFor(fn,{tries=70,delay=30}={}){for(let i=0;i<tries;i++){const value=fn();if(value)return value;await wait(delay)}return null}
function expectedEntries(){const map=spec()?.answerByToken;if(!map||typeof map!=='object')return[];return Object.entries(map).map(([id,value])=>[String(id),Number(value)]).filter(([,value])=>Number.isFinite(value))}
function tileFor(id){return q('[data-ba-token="'+CSS.escape(String(id))+'"]',work())}
function tileNumber(tile){const raw=String(q('strong',tile)?.textContent||'').trim();if(!raw||raw==='?')return null;const value=Number(raw);return Number.isFinite(value)?value:null}
function feedback(){return q('[data-nmb-v8-feedback]',stage())}
function revealButton(){return q('.gd-challenge-actions [data-board-action="reveal"]',banner())}
function showReveal(){const reveal=revealButton();if(!reveal)return;reveal.hidden=false;reveal.disabled=false;reveal.removeAttribute('aria-hidden');reveal.style.removeProperty('display')}
function hideReveal(){const reveal=revealButton();if(!reveal)return;reveal.hidden=true;reveal.disabled=true;reveal.setAttribute('aria-hidden','true');reveal.style.setProperty('display','none','important')}
function setFeedback(message,kind=''){const el=feedback();if(!el)return;el.textContent=message||'';el.className='nmb-v8-feedback'+(kind?' is-'+kind:'');el.setAttribute('aria-live','polite')}
function clearAssessment(){expectedEntries().forEach(([id])=>tileFor(id)?.classList.remove('nmb-v8-answer-correct','nmb-v8-answer-wrong'));setFeedback('','');showReveal()}
function multiMissing(){return expectedEntries().length>1}
function checkAllMissing(){
  const entries=expectedEntries();if(entries.length<2)return false;
  const rows=entries.map(([id,expected])=>({tile:tileFor(id),expected}));
  if(rows.some(row=>!row.tile))return false;
  const values=rows.map(row=>tileNumber(row.tile));
  if(values.some(value=>value===null)){
    rows.forEach(row=>row.tile.classList.remove('nmb-v8-answer-correct','nmb-v8-answer-wrong'));
    setFeedback('Fill in all ? boxes, then check.','');showReveal();return true;
  }
  let allCorrect=true;
  rows.forEach((row,index)=>{const ok=Math.abs(values[index]-row.expected)<1e-9;allCorrect=allCorrect&&ok;row.tile.classList.toggle('nmb-v8-answer-correct',ok);row.tile.classList.toggle('nmb-v8-answer-wrong',!ok)});
  if(allCorrect){setFeedback('Correct ✓','correct');q('.nmb-v8-answer-pad',stage())?.remove();hideReveal()}
  else{setFeedback('Not quite — check both answers.','wrong');showReveal()}
  return true;
}
async function anotherClean(type,difficulty){
  if(regenerating)return;regenerating=true;
  try{
    let trigger=await waitFor(()=>q('[data-nmb-challenge-toggle]',work()));if(!trigger)return;
    trigger.click();
    let pop=await waitFor(()=>q('.nmb-v5-challenge-popover',work()));if(!pop)return;
    const clear=q('[data-nmb-v6-clear]',pop);if(clear){
      clear.click();
      await waitFor(()=>!banner());
      await waitFor(()=>!document.body.classList.contains('nmb-v8-pupil-challenge'));
    }
    trigger=await waitFor(()=>q('[data-nmb-challenge-toggle]',work()));if(!trigger)return;
    await wait(40);trigger.click();
    pop=await waitFor(()=>q('.nmb-v5-challenge-popover',work()));if(!pop)return;
    let diff=q('[data-nmb-v6-difficulty="'+CSS.escape(String(difficulty||'easy'))+'"]',pop);
    if(diff&&!diff.classList.contains('is-active')){
      diff.click();
      pop=await waitFor(()=>q('.nmb-v5-challenge-popover [data-nmb-v6-difficulty="'+CSS.escape(String(difficulty||'easy'))+'"].is-active')?.closest('.nmb-v5-challenge-popover'));
      if(!pop)return;
    }
    const next=q('[data-nmb-v6-type="'+CSS.escape(String(type))+'"]',pop);if(next)next.click();
  }finally{regenerating=false}
}
function captureWindowClick(e){
  const another=e.target?.closest?.('[data-nmb-v6-another]');
  if(!another)return;
  const s=spec();if(!s?.type)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  anotherClean(s.type,s.difficulty||G.numberMobileChallengeDifficulty||'easy');
}
function captureCheck(e){
  const check=e.target?.closest?.('[data-nmb-v8-check]');
  if(check&&multiMissing()){
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();checkAllMissing();
  }
}
function bubbleClick(e){
  if(e.target?.closest?.('[data-nmb-v8-key]'))setTimeout(clearAssessment,0);
}
function captureKeydown(e){
  if(e.key!=='Enter'||!multiMissing()||!q('.nmb-v8-answer-pad',stage()))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();checkAllMissing();
}
function install(){
  window.addEventListener('click',captureWindowClick,true);
  // Multi-box checking is owned by v8, including keyboard submission.
}
G.numberMobilePupilStateVersion='10.2';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(window.TT99Goodies);
;


/* ===== v12 ===== */
/* Number Mobile Balance v12 · pupil challenge chrome + compare concealment
 * Keeps the working challenge engine untouched. This layer normalises the
 * pupil action row and prevents Compare challenges giving away the answer
 * through the main beam tilt before the pupil has solved them.
 */
(function(G){
'use strict';
if(!G)return;
let watchedActions=null,actionsObserver=null,runToken=0;
function q(sel,root=document){return root?.querySelector?.(sel)||null}
function stage(){return document.getElementById('gd-stage')}
function work(){return q('.gd-number-mobile-workbench',stage())}
function banner(){return q('.gd-challenge-banner',stage())}
function pupilReady(){return document.body.classList.contains('nmb-v8-pupil-challenge')&&!!banner()}
function setLabel(button,label,title){if(!button)return;if(button.textContent.trim()!==label)button.textContent=label;if(title&&button.title!==title)button.title=title}
function revealed(){const b=banner();return !!(b&&(q('.gd-challenge-actions em',b)||/hide answer/i.test(q('[data-board-action="reveal"]',b)?.textContent||'')))}
function syncCompareConceal(){
  const w=work();if(!w)return;
  const panel=q('.nmb-v8-response-panel[data-nmb-v8-response="compare"]',stage());
  const specType=String(G.numberMobileChallengeSpec?.type||'');
  const compare=specType==='choose-relation'||!!panel;
  const correct=!!q('[data-nmb-v8-choice].is-correct',panel);
  const conceal=pupilReady()&&compare&&!revealed()&&!correct;
  w.classList.toggle('nmb-v12-conceal-main-balance',conceal);
}
function tidy(){
  if(!pupilReady()){work()?.classList.remove('nmb-v12-conceal-main-balance');return false}
  const b=banner(),w=work(),actions=q('.gd-challenge-actions',b);if(!b||!w||!actions)return false;
  let buttons=[...actions.querySelectorAll('button')];
  let change=q('[data-nmb-v9-change]',actions)||buttons.find(btn=>/^change$/i.test(btn.textContent.trim()));
  if(!change){
    change=document.createElement('button');change.type='button';change.className='gd-challenge-action';change.dataset.nmbV9Change='1';change.textContent='Change';change.onclick=e=>{e.preventDefault();e.stopPropagation();q('[data-nmb-challenge-toggle]',w)?.click()};actions.insertBefore(change,actions.firstChild);
  }
  let another=q('[data-nmb-v6-another]',actions)||buttons.find(btn=>/^another(?: like this)?$/i.test(btn.textContent.trim()));
  if(!another&&G.numberMobileChallengeSpec?.type){
    another=document.createElement('button');another.type='button';another.className='gd-challenge-action';another.dataset.nmbV6Another='1';another.textContent='Another';actions.insertBefore(another,q('[data-board-action="reveal"]',actions)||null);
  }
  buttons=[...actions.querySelectorAll('button')];
  setLabel(change,'Change','Choose a different Number Mobile challenge');
  setLabel(another||buttons.find(btn=>/^another(?: like this)?$/i.test(btn.textContent.trim())),'Another','Generate another challenge of this type');
  setLabel(q('[data-board-action="reveal"]',actions),revealed()?'Hide answer':'Reveal answer','Show or hide the answer');
  setLabel(q('[data-nmb-v7-exit]',actions),'Exit challenge','Exit challenge mode');
  syncCompareConceal();
  if(watchedActions!==actions){
    actionsObserver?.disconnect();watchedActions=actions;
    actionsObserver=new MutationObserver(()=>queueMicrotask(tidy));
    /* Direct children only: catches late-added Another/Exit buttons without
       reacting to our own text-node edits or anything elsewhere on the board. */
    actionsObserver.observe(actions,{childList:true});
  }
  return true;
}
async function stabilise(){
  const token=++runToken;if(!work())return;
  /* A Hard custom mobile can take several seconds to assemble in an embedded
     board. Stay bounded, but remain alive for the whole construction window. */
  for(let i=0;i<240&&token===runToken&&work();i++){
    if(tidy()){
      /* Keep a short settling tail for buttons/answer UI appended after pupil
         mode first becomes visible. The direct action-row observer handles
         later button changes, while event-driven sync handles answer choices. */
      for(let j=0;j<40&&token===runToken&&work();j++){await new Promise(r=>setTimeout(r,50));tidy()}
      return;
    }
    syncCompareConceal();
    await new Promise(r=>setTimeout(r,50));
  }
}
function relevant(target){return !!work()&&!!target?.closest?.('[data-nmb-v6-type],[data-nmb-v6-another],[data-nmb-v9-change],[data-nmb-challenge-toggle],[data-board-action="reveal"],[data-nmb-v7-exit],[data-nmb-v8-choice]')}
function install(){
  window.addEventListener('click',e=>{if(relevant(e.target))setTimeout(stabilise,0)},true);
  document.addEventListener('click',e=>{if(relevant(e.target)){setTimeout(syncCompareConceal,0);setTimeout(stabilise,0)}},false);
  setTimeout(stabilise,80);
}
G.numberMobileChallengeChrome={refresh:tidy};
G.numberMobileChromeVersion='12.3';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(window.TT99Goodies);
;


/* ===== v13 ===== */
/* Number Mobile Balance v13 · compact numeric answer interaction
 * Numeric challenges show one answer box. Tapping it opens the number keypad
 * in a popover, so the answer strip stays compact. Existing v8 numeric input
 * logic is reused where available; this layer also repairs the older generic
 * classification of the numeric "Make it balance" prompt.
 */
(function(G){
'use strict';
if(!G)return;
let runToken=0,activePanel=null;
function q(sel,root=document){return root?.querySelector?.(sel)||null}
function qa(sel,root=document){return root?.querySelectorAll?[...root.querySelectorAll(sel)]:[]}
function stage(){return document.getElementById('gd-stage')}
function work(){return q('.gd-number-mobile-workbench',stage())}
function banner(){return q('.gd-challenge-banner',stage())}
function text(el){return String(el?.textContent||'').trim()}
function numeric(value){const raw=String(value??'').trim();if(!raw||raw==='.'||raw==='?')return null;const n=Number(raw);return Number.isFinite(n)?n:null}
function sideTotal(side){return qa('.gd-eq-side--'+side+' .gd-eq-weights [data-ba-token]',work()).reduce((sum,tile)=>{const n=numeric(text(q('strong',tile)));return sum+(n==null?0:n)},0)}
function revealButton(){return q('[data-board-action="reveal"]',banner())}
function closePad(panel=activePanel){
  if(!panel)return;
  const pad=q('.nmb-v13-number-pad',panel),display=q('[data-nmb-v13-answer-box]',panel);
  if(pad)pad.hidden=true;
  if(display)display.setAttribute('aria-expanded','false');
  panel.classList.remove('nmb-v13-pad-open');
  if(activePanel===panel)activePanel=null;
}
function openPad(panel){
  if(activePanel&&activePanel!==panel)closePad(activePanel);
  const pad=q('.nmb-v13-number-pad',panel),display=q('[data-nmb-v13-answer-box]',panel);
  if(!pad||!display)return;
  activePanel=panel;pad.hidden=false;panel.classList.add('nmb-v13-pad-open');display.setAttribute('aria-expanded','true');
}
function looksLikeNumericBalance(panel){
  if(panel?.dataset?.nmbV8Response!=='generic')return false;
  const prompt=text(q('.gd-challenge-prompt',banner())).toLowerCase();
  return /how much.*(?:add|added).*lighter.*balance|how much.*balance.*main bar/.test(prompt);
}
function repairNumericBalance(panel){
  if(!looksLikeNumericBalance(panel)||panel.dataset.nmbV13BalanceRepair==='1')return false;
  panel.dataset.nmbV13BalanceRepair='1';panel.dataset.nmbV8Response='balance';
  panel.innerHTML='<span class="nmb-v8-response-label">How much must be added to the lighter main side to balance the main bar?</span><div class="nmb-v8-number-response"><div class="nmb-v8-response-display" tabindex="0">?</div><div class="nmb-v8-response-keys">'+['7','8','9','4','5','6','1','2','3','0','⌫'].map(k=>'<button type="button" data-nmb-v8-response-key="'+k+'">'+k+'</button>').join('')+'</div><button type="button" class="nmb-v8-check" data-nmb-v8-response-check>Check</button></div><span class="nmb-v8-feedback" data-nmb-v8-feedback aria-live="polite"></span>';
  let buffer='';const display=q('.nmb-v8-response-display',panel),feedback=q('[data-nmb-v8-feedback]',panel),keys=qa('[data-nmb-v8-response-key]',panel),check=q('[data-nmb-v8-response-check]',panel);
  function clearFeedback(){feedback.textContent='';feedback.className='nmb-v8-feedback';const reveal=revealButton();if(reveal)reveal.hidden=false}
  keys.forEach(button=>button.onclick=()=>{const key=button.dataset.nmbV8ResponseKey;if(key==='⌫')buffer=buffer.slice(0,-1);else buffer=(buffer+key).replace(/^0(?=\d)/,'');display.textContent=buffer||'?';clearFeedback()});
  check.onclick=()=>{const given=numeric(buffer),expected=Math.abs(sideTotal('left')-sideTotal('right')),ok=given!=null&&Math.abs(given-expected)<1e-9;feedback.textContent=ok?'Correct ✓':'Not quite — try again.';feedback.className='nmb-v8-feedback '+(ok?'is-correct':'is-wrong');const reveal=revealButton();if(reveal)reveal.hidden=ok};
  return true;
}
function enhancePanel(panel){
  if(!panel)return false;
  repairNumericBalance(panel);
  if(panel.dataset.nmbV13Numeric==='1')return true;
  const number=q('.nmb-v8-number-response',panel),display=q('.nmb-v8-response-display',number),keys=q('.nmb-v8-response-keys',number),check=q('[data-nmb-v8-response-check]',number);
  if(!number||!display||!keys||!check)return false;
  panel.dataset.nmbV13Numeric='1';number.classList.add('nmb-v13-number-response');
  display.dataset.nmbV13AnswerBox='1';display.setAttribute('role','button');display.setAttribute('aria-haspopup','dialog');display.setAttribute('aria-expanded','false');display.setAttribute('aria-label','Numeric answer. Tap to open number keypad');display.title='Tap to enter your answer';
  const pad=document.createElement('div');pad.className='nmb-v13-number-pad';pad.hidden=true;pad.setAttribute('role','dialog');pad.setAttribute('aria-label','Number keypad');
  const head=document.createElement('div');head.className='nmb-v13-number-pad__head';head.innerHTML='<strong>Enter your answer</strong><button type="button" data-nmb-v13-close aria-label="Close number keypad">×</button>';
  const body=document.createElement('div');body.className='nmb-v13-number-pad__body';body.appendChild(keys);body.appendChild(check);pad.appendChild(head);pad.appendChild(body);number.appendChild(pad);
  const toggle=e=>{e.preventDefault();e.stopPropagation();pad.hidden?openPad(panel):closePad(panel)};
  display.addEventListener('click',toggle);
  display.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){toggle(e)}else if(e.key==='Escape'){closePad(panel)}});
  q('[data-nmb-v13-close]',pad).addEventListener('click',e=>{e.preventDefault();e.stopPropagation();closePad(panel);display.focus()});
  check.addEventListener('click',()=>setTimeout(()=>{if(q('.nmb-v8-feedback.is-correct',panel))closePad(panel)},0));
  qa('[data-nmb-v8-response-key]',keys).forEach(button=>button.addEventListener('click',()=>display.focus({preventScroll:true})));
  return true;
}
function enhanceCurrent(){
  const panel=q('.nmb-v8-response-panel',stage());
  if(!panel){if(activePanel)closePad(activePanel);return false}
  return enhancePanel(panel);
}
async function stabilise(){
  if(!work())return;
  const token=++runToken,initial=q('.nmb-v8-response-panel',stage()),initialReady=initial?.dataset?.nmbV13Numeric==='1';
  for(let i=0;i<160&&token===runToken&&work();i++){
    const panel=q('.nmb-v8-response-panel',stage());
    if(!panel){if(activePanel)closePad(activePanel);await new Promise(r=>setTimeout(r,40));continue}
    const transitioned=!initial||panel!==initial||!initial.isConnected;
    const ready=enhancePanel(panel);
    if(ready&&(transitioned||!initialReady))return;
    await new Promise(r=>setTimeout(r,40));
  }
}
function relevant(target){return !!work()&&!!target?.closest?.('.nmb-v5-challenge-popover,[data-nmb-v6-type],[data-nmb-v6-another],[data-nmb-v9-change],[data-nmb-challenge-toggle],[data-board-action="reveal"],[data-nmb-v7-exit]')}
function install(){
  window.addEventListener('click',e=>{if(relevant(e.target))setTimeout(stabilise,0)},true);
  document.addEventListener('click',e=>{if(relevant(e.target))setTimeout(stabilise,0)},false);
  document.addEventListener('click',e=>{if(activePanel&&!e.target.closest('.nmb-v13-number-response'))closePad(activePanel)},false);
  setTimeout(stabilise,100);
}
G.numberMobileNumericInput={refresh:enhanceCurrent};
G.numberMobileNumericInputVersion='13.3';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(window.TT99Goodies);
;
