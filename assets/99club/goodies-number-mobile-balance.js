/* 99 Club Studio · Number Mobile Balance adapter
 * The established balance model continues to own totals, challenges, undo/redo
 * and exports. This adapter adds the classroom editor used by the live mobile:
 * direct number editing, true blank boxes and recursive visual branches.
 */
(function(G){
'use strict';
if(!G||typeof G.balanceTool!=='function')return;
const originalBalanceTool=G.balanceTool;
let observers=[],cleanups=[],lastVisual={angle:0,left:0,right:0};
let blankIds=new Set(),roots={left:[],right:[]},nextBranch=1,selectedBranchId=null,editingId=null,editBuffer='',pendingAdd=null,adapting=false;

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
function findNode(id){let found=null;walk([...roots.left,...roots.right],(node,list,index,parent,slot)=>{if(String(node.id)===String(id)){found={node,list,index,parent,slot};return false}});return found}
function descendantIds(node){const out=[];walk([node],n=>{if(n.kind==='tile')out.push(String(n.id))});return out}
function rootSideForNodeId(id){let result=null;for(const side of ['left','right'])walk(roots[side],node=>{if(String(node.id)===String(id)){result=side;return false}});return result}
function sideForToken(id){for(const side of ['left','right']){let yes=false;walk(roots[side],node=>{if(node.kind==='tile'&&String(node.id)===String(id)){yes=true;return false}});if(yes)return side}return null}
function branchById(id){const loc=findNode(id);return loc?.node?.kind==='branch'?loc.node:null}
function flattenLabels(nodes,labels){const out=[];walk(nodes,node=>{if(node.kind==='tile')out.push(labels.get(String(node.id))??'0')});return out}
function numericValue(label){if(label==='□'||label==='?'||label==='')return 0;const n=Number(label);return Number.isFinite(n)?Math.max(0,n):0}
function treeValue(nodes,labels){return flattenLabels(nodes,labels).reduce((sum,label)=>sum+numericValue(label),0)}
function treeSignature(){return JSON.stringify({roots,blank:[...blankIds].sort(),selectedBranchId,editingId})}

function animateMobile(work){
  const apparatus=work.querySelector('.gd-eq-balance');if(!apparatus||apparatus.dataset.numberMobileAnimated==='1')return;
  apparatus.dataset.numberMobileAnimated='1';
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
function pruneTreeToTokens(tokens){
  function prune(nodes,side){
    for(let i=nodes.length-1;i>=0;i--){
      const node=nodes[i];
      if(node.kind==='tile'){
        const info=tokens.get(String(node.id));
        if(!info||info.side!==side)nodes.splice(i,1);
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
function selectedTokenId(work){return String(work.querySelector('[data-ba-token].is-selected')?.dataset?.baToken||'')||null}
function setEngineValue(id,value){
  const work=document.querySelector('.gd-eq-balance-workbench');if(!work)return;
  const tile=work.querySelector('[data-ba-token="'+CSS.escape(String(id))+'"]');
  if(tile&&!tile.classList.contains('is-selected'))tile.click();
  queueMicrotask(()=>{
    const input=document.getElementById('ba-value');if(!input)return;
    input.value=String(value);input.dispatchEvent(new Event('change',{bubbles:true}));
  });
}
function nativeAdd(side,placement=null){
  const work=document.querySelector('.gd-eq-balance-workbench');if(!work)return;
  const button=work.querySelector('[data-ba-stage-add="'+side+'"]');if(!button)return;
  pendingAdd={side,blank:true,placement};editingId=null;
  const fn=button._nmbNativeAdd||button.onclick;if(typeof fn==='function')fn.call(button,new MouseEvent('click',{bubbles:true}));
}
function finalizePending(work,tokens){
  if(!pendingAdd)return false;
  const request=pendingAdd,selected=selectedTokenId(work);if(!selected||!tokens.has(selected))return false;
  const info=tokens.get(selected);if(info.side!==request.side)return false;
  const wantsBlank=request.blank!==false;
  if(wantsBlank){blankIds.add(selected);editingId=selected;editBuffer=''}else{blankIds.delete(selected);editingId=null}
  const loc=findNode(selected);if(loc)loc.list.splice(loc.index,1);
  const place=request.placement;
  if(place?.branchId){const branch=branchById(place.branchId);if(branch)branch[place.slot==='right'?'right':'left'].push(tileNode(selected));else roots[request.side].push(tileNode(selected))}
  else roots[request.side].push(tileNode(selected));
  pendingAdd=null;
  const raw=numericValue(info.raw);if(wantsBlank&&raw!==0){setEngineValue(selected,0);return true}
  return false;
}
function reconcile(work,tokens){
  pruneTreeToTokens(tokens);
  if(finalizePending(work,tokens))return false;
  blankIds.forEach(id=>{if(!tokens.has(String(id)))blankIds.delete(id)});
  if(editingId&&!tokens.has(String(editingId)))editingId=null;
  return true;
}

function makeBranchElement(node,tokens,depth){
  const wrap=document.createElement('div');wrap.className='nmb-branch'+(String(node.id)===String(selectedBranchId)?' is-selected':'');wrap.dataset.nmbBranch=node.id;wrap.dataset.nmbDepth=String(depth);
  const labels=labelMap(tokens),l=treeValue(node.left,labels),r=treeValue(node.right,labels),scale=Math.max(1,l,r),angle=Math.max(-10,Math.min(10,(l-r)/scale*-10)),lift=Math.sin(angle*Math.PI/180)*70;
  wrap.style.setProperty('--nmb-branch-angle',angle+'deg');wrap.style.setProperty('--nmb-branch-left',(-lift)+'px');wrap.style.setProperty('--nmb-branch-right',lift+'px');
  const select=document.createElement('button');select.type='button';select.className='nmb-branch-bar';select.title='Select this branch';select.setAttribute('aria-label','Select branch');select.onclick=e=>{e.stopPropagation();selectedBranchId=node.id;editingId=null;adaptStage(document.getElementById('gd-stage'))};wrap.appendChild(select);
  const sides=document.createElement('div');sides.className='nmb-branch-sides';
  ['left','right'].forEach(slot=>{
    const side=document.createElement('div');side.className='nmb-branch-side nmb-branch-side--'+slot;
    const cord=document.createElement('span');cord.className='nmb-branch-cord';side.appendChild(cord);
    const children=document.createElement('div');children.className='nmb-branch-children';
    node[slot].forEach(child=>children.appendChild(makeNodeElement(child,tokens,depth+1)));
    const add=document.createElement('button');add.type='button';add.className='nmb-branch-add';add.textContent='+';add.title='Add empty box to '+slot+' branch';add.setAttribute('aria-label','Add empty box to '+slot+' branch');add.onclick=e=>{e.stopPropagation();nativeAdd(rootSideForNodeId(node.id)||'left',{branchId:node.id,slot})};children.appendChild(add);
    side.appendChild(children);sides.appendChild(side);
  });
  wrap.appendChild(sides);
  if(String(node.id)===String(selectedBranchId))wrap.appendChild(branchToolbar(node));
  return wrap;
}
function makeNodeElement(node,tokens,depth=0){
  if(node.kind==='branch')return makeBranchElement(node,tokens,depth);
  const info=tokens.get(String(node.id));if(!info){const ghost=document.createElement('span');return ghost}
  const tile=info.tile;
  if(blankIds.has(String(node.id))){tile.classList.add('is-blank-box');if(info.strong)info.strong.textContent='';tile.setAttribute('aria-label','Empty number box');tile.title='Select to enter a number'}
  else tile.classList.remove('is-blank-box');
  tile.dataset.nmbDepth=String(depth);
  if(!tile.dataset.nmbEditBound){tile.dataset.nmbEditBound='1';tile.addEventListener('click',()=>{if(tile.disabled)return;editingId=String(tile.dataset.baToken);selectedBranchId=null;const label=blankIds.has(editingId)?'':String(info.raw||'').replace(/[^0-9.\-]/g,'');editBuffer=label==='?'?'':label;queueMicrotask(()=>adaptStage(document.getElementById('gd-stage')))},true)}
  return tile;
}
function labelMap(tokens){const labels=new Map();tokens.forEach(info=>labels.set(info.id,blankIds.has(info.id)?'□':info.raw));return labels}
function renderTrees(work,tokens){
  const signature=treeSignature();if(work.dataset.nmbTreeSignature===signature)return;
  work.dataset.nmbTreeSignature=signature;
  ['left','right'].forEach(side=>{
    const box=work.querySelector('.gd-eq-side--'+side+' .gd-eq-weights');if(!box)return;
    box.textContent='';roots[side].forEach(node=>box.appendChild(makeNodeElement(node,tokens,0)));
    if(!roots[side].length){const empty=document.createElement('span');empty.className='gd-eq-empty';empty.textContent='Add a box here';box.appendChild(empty)}
  });
}
function branchToolbar(node){
  const bar=document.createElement('div');bar.className='nmb-branch-toolbar';
  const addButton=(text,slot,title)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.title=title;b.onclick=e=>{e.stopPropagation();nativeAdd(rootSideForNodeId(node.id)||'left',{branchId:node.id,slot})};return b};
  bar.appendChild(addButton('+ L','left','Add empty box to left branch'));bar.appendChild(addButton('+ R','right','Add empty box to right branch'));
  const unbranch=document.createElement('button');unbranch.type='button';unbranch.textContent='Unbranch';unbranch.title='Remove branch bar but keep its boxes';unbranch.onclick=e=>{e.stopPropagation();const loc=findNode(node.id);if(!loc)return;loc.list.splice(loc.index,1,...node.left,...node.right);selectedBranchId=null;adaptStage(document.getElementById('gd-stage'))};bar.appendChild(unbranch);
  const del=document.createElement('button');del.type='button';del.className='is-danger';del.textContent='×';del.title='Delete this branch and all its boxes';del.setAttribute('aria-label','Delete branch and all boxes');del.onclick=e=>{e.stopPropagation();deleteTokenSequence(descendantIds(node));selectedBranchId=null};bar.appendChild(del);
  return bar;
}
function deleteTokenSequence(ids){
  const queue=[...ids];
  function next(){
    const id=queue.shift();if(!id)return;
    const tile=document.querySelector('[data-ba-token="'+CSS.escape(String(id))+'"]');if(!tile){next();return}
    tile.click();setTimeout(()=>{const del=document.getElementById('ba-delete');if(del)del.click();setTimeout(next,0)},0);
  }
  next();
}
function branchSelected(id){
  const loc=findNode(id);if(!loc||loc.node.kind!=='tile')return;
  const side=sideForToken(id)||'left';
  const branch=branchNode([loc.node],[]);loc.list.splice(loc.index,1,branch);selectedBranchId=branch.id;editingId=null;
  nativeAdd(side,{branchId:branch.id,slot:'right'});
}
function duplicateSelected(id){
  const loc=findNode(id),dup=document.getElementById('ba-duplicate');if(!loc||!dup)return;
  pendingAdd={side:sideForToken(id)||'left',blank:false,placement:loc.parent?{branchId:loc.parent.id,slot:loc.slot}:null};
  dup.click();
}
function deleteSelected(){const del=document.getElementById('ba-delete');if(del)del.click()}

function applyBuffer(id,buffer){
  editingId=String(id);editBuffer=buffer;
  if(buffer===''||buffer==='-'){blankIds.add(String(id));setEngineValue(id,0);return}
  const value=Number(buffer);if(!Number.isFinite(value))return;blankIds.delete(String(id));setEngineValue(id,Math.max(0,value));
}
function keypad(work,tokens){
  if(!editingId||!tokens.has(String(editingId)))return;
  const tile=work.querySelector('[data-ba-token="'+CSS.escape(String(editingId))+'"]');if(!tile||tile.disabled)return;
  const pad=document.createElement('div');pad.className='nmb-keypad';pad.dataset.nmbKeypad=editingId;
  pad.innerHTML='<div class="nmb-keypad-head"><strong>'+(blankIds.has(String(editingId))?'Empty box':'Edit number')+'</strong><button type="button" data-nmb-close aria-label="Close keypad">×</button></div><div class="nmb-keypad-display">'+(editBuffer||'□')+'</div><div class="nmb-keypad-grid">'+['7','8','9','4','5','6','1','2','3','0','.','⌫'].map(k=>'<button type="button" data-nmb-key="'+k+'">'+k+'</button>').join('')+'</div><div class="nmb-keypad-actions"><button type="button" data-nmb-blank>Blank</button><button type="button" data-nmb-branch>Branch</button><button type="button" data-nmb-duplicate>Duplicate</button><button type="button" class="is-danger" data-nmb-delete>Delete</button><button type="button" class="is-primary" data-nmb-done>Done</button></div>';
  work.appendChild(pad);
  const wr=work.getBoundingClientRect(),tr=tile.getBoundingClientRect(),pw=230,ph=310;
  let left=tr.right-wr.left+10,top=tr.top-wr.top-20;if(left+pw>wr.width)left=Math.max(8,tr.left-wr.left-pw-10);if(top+ph>wr.height)top=Math.max(8,wr.height-ph-8);pad.style.left=left+'px';pad.style.top=top+'px';
  pad.querySelector('[data-nmb-close]').onclick=()=>{editingId=null;adaptStage(document.getElementById('gd-stage'))};
  pad.querySelectorAll('[data-nmb-key]').forEach(button=>button.onclick=()=>{const key=button.dataset.nmbKey;if(key==='⌫')editBuffer=editBuffer.slice(0,-1);else if(key==='.'&&!editBuffer.includes('.'))editBuffer=(editBuffer||'0')+'.';else if(key!=='.')editBuffer=(editBuffer+key).replace(/^0(?=\d)/,'');applyBuffer(editingId,editBuffer)});
  pad.querySelector('[data-nmb-blank]').onclick=()=>{editBuffer='';applyBuffer(editingId,'')};
  pad.querySelector('[data-nmb-branch]').onclick=()=>branchSelected(editingId);
  pad.querySelector('[data-nmb-duplicate]').onclick=()=>duplicateSelected(editingId);
  pad.querySelector('[data-nmb-delete]').onclick=()=>{editingId=null;deleteSelected()};
  pad.querySelector('[data-nmb-done]').onclick=()=>{editingId=null;adaptStage(document.getElementById('gd-stage'))};
}
function equationOverride(work,tokens){
  if(work.querySelector('.gd-challenge-banner'))return;
  const labels=labelMap(tokens),leftLabels=flattenLabels(roots.left,labels),rightLabels=flattenLabels(roots.right,labels),lt=treeValue(roots.left,labels),rt=treeValue(roots.right,labels),rel=Math.abs(lt-rt)<1e-9?'=':lt>rt?'>':'<';
  const eq=work.querySelector('[data-ba-equation]');if(eq)eq.textContent=(leftLabels.length?leftLabels.join(' + '):'0')+' '+rel+' '+(rightLabels.length?rightLabels.join(' + '):'0');
}
function wrapStageAdd(work){
  work.querySelectorAll('[data-ba-stage-add]').forEach(button=>{
    if(button.dataset.nmbWrapped)return;button.dataset.nmbWrapped='1';button._nmbNativeAdd=button.onclick;
    const side=button.dataset.baStageAdd==='right'?'right':'left';button.textContent='+';button.setAttribute('aria-label','Add empty number box to '+side+' side');button.title='Add empty number box';
    button.onclick=e=>{pendingAdd={side,blank:true,placement:null};editingId=null;if(typeof button._nmbNativeAdd==='function')button._nmbNativeAdd.call(button,e)};
  });
}
function adaptStage(stage){
  if(!stage||adapting)return;const work=stage.querySelector('.gd-eq-balance-workbench');if(!work){disconnect();return}
  adapting=true;
  try{
    work.classList.add('gd-number-mobile-workbench');animateMobile(work);
    const summary=work.querySelector('.gd-eq-summary span');if(summary&&/equation balance/i.test(summary.textContent||''))summary.textContent='Number mobile';
    const selected=work.querySelector('.gd-eq-selected__head span');if(selected&&/selected weight/i.test(selected.textContent||''))selected.textContent='Selected number';
    const help=work.querySelector('.gd-eq-drag-hint');if(help)help.textContent='Select a box to type a number, make it blank, branch it, duplicate it or delete it. Drag a number box across the mobile to move it.';
    wrapStageAdd(work);
    const tokens=currentTokenInfo(work);if(!reconcile(work,tokens))return;
    renderTrees(work,tokens);equationOverride(work,tokens);
    work.querySelectorAll('[data-ba-token]').forEach(tile=>{const id=String(tile.dataset.baToken),value=blankIds.has(id)?'empty box':(tile.querySelector('strong')?.textContent?.trim()||'number');tile.setAttribute('aria-label',blankIds.has(id)?'Empty number box':'Number '+value);tile.setAttribute('title',tile.disabled?'Fixed number tile':'Select to edit or drag this number box')});
    work.querySelectorAll('.nmb-keypad').forEach(el=>el.remove());keypad(work,tokens);
  }finally{adapting=false}
}
function adaptControls(controls){
  if(!controls||!document.querySelector('.gd-eq-balance-workbench'))return;
  exactText(controls,'Add a weight','Add a number box');exactText(controls,'Show pan totals','Show side totals');exactText(controls,'Selected weight value','Selected number value');
  controls.querySelectorAll('.gd-help').forEach(el=>{const text=String(el.textContent||'');if(/Drag weights between pans/i.test(text))el.textContent='Select any number box to edit it directly, or drag it between the two sides.';else if(/vector weights, beam position/i.test(text))el.textContent='Mobile-only export contains the current number boxes, balance position and visible mathematical readouts without editing controls.'});
  controls.querySelectorAll('button').forEach(button=>{if(button.textContent.trim()==='Balanced example')button.textContent='Balanced mobile example'});
}
function adaptToolHeader(){const title=document.getElementById('gd-tool-title'),desc=document.getElementById('gd-tool-desc');if(title)title.textContent='Number mobile balance';if(desc)desc.textContent='Build, branch and balance hanging number boxes on a maths mobile.'}
function adaptCatalogueCard(){const card=document.querySelector('[data-tool="balance"]');if(!card)return;const title=card.querySelector('h2'),desc=card.querySelector('p');if(title)title.textContent='Number mobile balance';if(desc)desc.textContent='Build, branch and balance hanging number boxes on a maths mobile.'}
function observe(root,fn){if(!root)return;let queued=false;const run=()=>{queued=false;fn(root)};const obs=new MutationObserver(()=>{if(queued||adapting)return;queued=true;queueMicrotask(run)});obs.observe(root,{childList:true,subtree:true,characterData:true});observers.push(obs);run()}
function keyboardHandler(e){
  if(!editingId||e.ctrlKey||e.metaKey||e.altKey)return;
  const tag=String(e.target?.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea'||tag==='select')return;
  if(/^\d$/.test(e.key)){e.preventDefault();editBuffer=(editBuffer+e.key).replace(/^0(?=\d)/,'');applyBuffer(editingId,editBuffer)}
  else if(e.key==='.'&&!editBuffer.includes('.')){e.preventDefault();editBuffer=(editBuffer||'0')+'.';applyBuffer(editingId,editBuffer)}
  else if(e.key==='Backspace'){e.preventDefault();editBuffer=editBuffer.slice(0,-1);applyBuffer(editingId,editBuffer)}
  else if(e.key==='Delete'){e.preventDefault();editingId=null;deleteSelected()}
  else if(e.key==='Enter'||e.key==='Escape'){e.preventDefault();editingId=null;adaptStage(document.getElementById('gd-stage'))}
}
G.balanceTool=function numberMobileBalanceTool(){
  disconnect();lastVisual={angle:0,left:0,right:0};blankIds=new Set();roots={left:[],right:[]};nextBranch=1;selectedBranchId=null;editingId=null;editBuffer='';pendingAdd=null;
  originalBalanceTool();adaptToolHeader();
  document.addEventListener('keydown',keyboardHandler);cleanups.push(()=>document.removeEventListener('keydown',keyboardHandler));
  observe(document.getElementById('gd-stage'),adaptStage);observe(document.getElementById('gd-controls'),adaptControls);
};
G.numberMobileBalanceVersion='2.1';
document.addEventListener('DOMContentLoaded',()=>queueMicrotask(adaptCatalogueCard),{once:true});
})(window.TT99Goodies);
