(function(G){
'use strict';
if(!G)return;
const adapters=new Map(),copy=v=>JSON.parse(JSON.stringify(v));
function register(tool,adapter){adapters.set(tool,adapter)}
function supports(tool){return adapters.has(tool)}
function types(tool,model){return adapterFor(tool).types?.(model)||[]}
function adapterFor(tool){const a=adapters.get(tool);if(!a)throw Error('Publishing is not yet supported for this widget.');return a}
function record(tool,kind,data,recipe=null){return {tool,kind,data:copy(data),recipe:recipe?copy(recipe):null}}
function signature(item){return item.kind==='challenge'?item.tool+':'+adapterFor(item.tool).signature(item.data):null}
function uniqueQuestion(tool,recipe,existing,rng=Math.random){
 const a=adapterFor(tool),seen=new Set(existing.map(signature).filter(Boolean));
 for(let i=0;i<100;i++){const q=a.generate(recipe,rng),item=record(tool,'challenge',q,{...recipe,type:q.type});if(!seen.has(signature(item)))return item}
 throw Error('No different question is available with these settings. Try a wider range or fewer questions.');
}
function createDocument(){
 let items=[],next=1;
 function append(records){if(items.length+records.length>80)throw Error('This draft supports up to 80 items.');const added=records.map(r=>({...copy(r),id:next++}));items=items.concat(added);return added.map(copy)}
 return {
  list:()=>copy(items),
  addCurrent(tool,snapshot,staticSvg){return append(adapterFor(tool).capture(copy(snapshot),staticSvg))},
  generate(tool,snapshot,count,type='all',rng=Math.random){
    const a=adapterFor(tool),recipe=a.recipe(copy(snapshot),type),n=Math.max(1,Math.min(20,Math.round(Number(count)||1))),records=[];
    for(let i=0;i<n;i++)records.push(uniqueQuestion(tool,recipe,items.concat(records),rng));
    return append(records);
  },
  replace(id,rng=Math.random){const i=items.findIndex(x=>x.id===id);if(i<0||!items[i].recipe)throw Error('Only generated challenges can be replaced.');
    const old=items[i],item=uniqueQuestion(old.tool,old.recipe,items,rng);items[i]={...item,id:old.id};return copy(items[i])},
  remove(id){items=items.filter(x=>x.id!==id)},
  move(id,delta){const i=items.findIndex(x=>x.id===id),j=i+delta;if(i<0||j<0||j>=items.length)return;[items[i],items[j]]=[items[j],items[i]]},
  group(){const order=[...new Set(items.map(x=>x.tool))];items.sort((a,b)=>order.indexOf(a.tool)-order.indexOf(b.tool))},
  shuffle(rng=Math.random){for(let i=items.length-1;i>0;i--){const j=Math.min(i,Math.floor(rng()*(i+1)));[items[i],items[j]]=[items[j],items[i]]}},
  clear(){items=[]}
 };
}
function svgElement(name,attrs={},text){const node=document.createElementNS('http://www.w3.org/2000/svg',name);Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,String(v)));if(text!==undefined)node.textContent=String(text);return node}
function renderItem(item,teacher=false){return adapterFor(item.tool).render(item,teacher)}
function dimensions(svg){const [x,y,w,h]=svg.getAttribute('viewBox').trim().split(/[ ,]+/).map(Number);if(![x,y,w,h].every(Number.isFinite)||w<=0||h<=0)throw Error('Invalid publication diagram.');return {x,y,w,h}}
function pages(items,{title='Maths practice',teacher=false}={}){
 const W=960,H=1250,pad=28,top=93,bottom=H-32,gap=12,layouts=[];let entries=[],y=top;
 for(const [index,item] of items.entries()){
   const svg=renderItem(item,teacher),v=dimensions(svg),width=W-2*pad-32,scale=Math.min(width/v.w,(bottom-top-gap)/v.h),h=v.h*scale;
   if(entries.length&&y+h>bottom){layouts.push(entries);entries=[];y=top}
   entries.push({svg,v,scale,h,y,index});y+=h+gap;
 }
 if(entries.length)layouts.push(entries);
 return layouts.map((entries,page)=>{
   const out=svgElement('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':teacher?'Teacher key':'Worksheet','data-gd-paper-ready':'sheet','data-gd-paper-label':'99 Club Studio','data-worksheet-answer':teacher?'teacher':'pupil'});
   const add=(name,attrs,text)=>out.appendChild(svgElement(name,attrs,text));
   add('rect',{width:W,height:H,fill:'#fff'});
   const heading=title+(teacher?' · Teacher key':'');
   add('text',{x:pad,y:38,'font-family':'Arial,sans-serif','font-size':Math.min(26,850/Math.max(1,heading.length*.62)),'font-weight':700,fill:'#24343b'},heading);
   add('text',{x:pad,y:64,'font-family':'Arial,sans-serif','font-size':14,fill:'#52666d'},teacher?'Matches the pupil document in order.':'Name: __________________________');
   add('text',{x:W-pad,y:64,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':14,fill:'#52666d'},'Page '+(page+1)+' / '+layouts.length);
   for(const {svg,v,scale,h,y,index} of entries){
     add('text',{x:pad,y:y+24,'font-family':'Arial,sans-serif','font-size':18,'font-weight':700,fill:'#24343b','data-pub-number':index+1},(index+1)+'.');
     const nested=svgElement('svg',{x:pad+32,y,width:v.w*scale,height:h,viewBox:[v.x,v.y,v.w,v.h].join(' ')});
     const source=svg.cloneNode(true);source.querySelectorAll('[data-gd-paper-brand]').forEach(n=>n.remove());
     [...source.childNodes].forEach(n=>nested.appendChild(n.cloneNode(true)));out.appendChild(nested);
   }
   return out;
 });
}
function openEditor(draft){
 let dlg=document.getElementById('gd-publishing-editor');
 if(!dlg){dlg=document.createElement('dialog');dlg.id='gd-publishing-editor';dlg.className='gd-publishing-editor';document.body.appendChild(dlg)}
 let title=dlg.dataset.title||'Maths practice',teacher=false,status='';
 function render(){
   const items=draft.list(),esc=G.esc;
   dlg.innerHTML='<div class="gd-pub-head"><strong>Worksheet document · pilot</strong><button type="button" class="gd-btn" data-pub-close>Close</button></div><div class="gd-pub-toolbar"><label>Title <input type="text" class="gd-input" data-pub-title maxlength="80" value="'+esc(title)+'"></label><button class="gd-btn" data-pub-group>Group by widget</button><button class="gd-btn" data-pub-shuffle>Mix questions</button><button class="gd-btn" data-pub-pupil'+(!teacher?' aria-pressed="true"':'')+'>Pupil</button><button class="gd-btn" data-pub-teacher'+(teacher?' aria-pressed="true"':'')+'>Teacher key</button><button class="gd-btn gd-btn--primary" data-pub-print'+(!items.length?' disabled':'')+'>Print / PDF</button></div><p class="gd-help">Add more content from the whiteboard frame Export menu. Replace one challenge without changing the others. Draft stays in this open whiteboard session.</p><p role="status" class="gd-pub-status">'+esc(status)+'</p><div class="gd-pub-body"><div class="gd-pub-list">'+items.map((item,i)=>'<div class="gd-pub-item"><strong>'+(i+1)+'. '+esc(adapterFor(item.tool).label)+' · '+esc(adapterFor(item.tool).title(item))+'</strong><div><button class="gd-btn" data-pub-up="'+item.id+'"'+(i===0?' disabled':'')+'>↑</button><button class="gd-btn" data-pub-down="'+item.id+'"'+(i===items.length-1?' disabled':'')+'>↓</button>'+(item.recipe?'<button class="gd-btn" data-pub-replace="'+item.id+'">Replace</button>':'')+'<button class="gd-btn" data-pub-remove="'+item.id+'">Remove</button></div></div>').join('')+'</div><div class="gd-pub-preview"></div></div>';
   const preview=dlg.querySelector('.gd-pub-preview');
   if(!items.length)preview.textContent='Your document is empty.';
   else for(const page of pages(items,{title,teacher}))preview.appendChild(G.exportTools.preparePaperSvg(page));
 }
 dlg.onclick=e=>{const btn=e.target.closest('button');if(!btn)return;const d=btn.dataset;
   try{
     if('pubClose'in d){dlg.close();return}
     if('pubPrint'in d){G.exportTools.printSvg(pages(draft.list(),{title,teacher}),{title:'',landscape:false,maxHeightMm:242});return}
     if('pubGroup'in d)draft.group();else if('pubShuffle'in d)draft.shuffle();else if('pubPupil'in d)teacher=false;else if('pubTeacher'in d)teacher=true;else if('pubReplace'in d)draft.replace(+d.pubReplace);else if('pubRemove'in d)draft.remove(+d.pubRemove);else if('pubUp'in d)draft.move(+d.pubUp,-1);else if('pubDown'in d)draft.move(+d.pubDown,1);
     status='';
   }catch(err){status=err.message}
   render();
 };
 dlg.oninput=e=>{if(e.target.hasAttribute('data-pub-title')){title=e.target.value.trim()||'Maths practice';dlg.dataset.title=title;const preview=dlg.querySelector('.gd-pub-preview');if(draft.list().length)preview.replaceChildren(...pages(draft.list(),{title,teacher}).map(G.exportTools.preparePaperSvg))}};
 render();if(!dlg.open)dlg.showModal();
}
G.publishing={register,supports,types,record,signature,createDocument,renderItem,pages,openEditor};
})(window.TT99Goodies);
