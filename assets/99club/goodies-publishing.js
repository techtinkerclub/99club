(function(G){
'use strict';
if(!G)return;
const adapters=new Map(),copy=v=>JSON.parse(JSON.stringify(v));
function register(tool,adapter){adapters.set(tool,adapter)}
function supports(tool){return adapters.has(tool)}
function canGenerate(tool){return supports(tool)&&typeof adapters.get(tool).generate==='function'}
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
    if(!canGenerate(tool))throw Error('This widget supports current illustrations only.');
    const a=adapterFor(tool),recipe=a.recipe(copy(snapshot),type),n=Math.max(1,Math.min(20,Math.round(Number(count)||1))),records=[];
    for(let i=0;i<n;i++)records.push(uniqueQuestion(tool,recipe,items.concat(records),rng));
    return append(records);
  },
  generateBlocks(blocks,rng=Math.random){
    const records=[];
    for(const block of blocks){
      if(!canGenerate(block.tool))throw Error('This widget supports current illustrations only.');
      const a=adapterFor(block.tool),n=Math.round(Number(block.count)),allowed=types(block.tool,block.settings).map(t=>t.id),selected=block.types===null?allowed:block.types;
      if(!Number.isInteger(n)||n<1||n>20)throw Error('Choose 1–20 questions per source.');
      if(!selected?.length||selected.some(id=>!allowed.includes(id)))throw Error('Choose compatible question types for '+a.label+'.');
      if(items.length+records.length+n>80)throw Error('A document can contain up to 80 items.');
      const queue=[];
      for(let i=0;i<n;i++){
        if(!queue.length){queue.push(...selected);for(let j=queue.length-1;j>0;j--){const k=Math.floor(rng()*(j+1));[queue[j],queue[k]]=[queue[k],queue[j]]}}
        const recipe=a.recipe(copy(block.settings),queue.shift());
        try{records.push(uniqueQuestion(block.tool,recipe,items.concat(records),rng))}catch(e){throw Error(a.label+': '+e.message)}
      }
    }
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
// SVG references resolve within the print document, not reliably within each
// nested SVG. Isolate each item's IDs before combining diagrams on a page.
function isolateSvgIds(svg,prefix){
 const nodes=[svg,...svg.querySelectorAll('*')],ids=new Map();
 for(const n of nodes){const old=n.getAttribute('id');if(old&&!ids.has(old))ids.set(old,prefix+old)}
 for(const n of nodes){
  const id=n.getAttribute('id');if(id&&ids.has(id))n.setAttribute('id',ids.get(id));
  for(const attr of n.getAttributeNames()){
    if(attr==='id')continue;
    const value=n.getAttribute(attr);let next=value.replace(/url\(\s*(['"]?)#([^\s)'"]+)\1\s*\)/g,(match,quote,key)=>ids.has(key)?'url(#'+ids.get(key)+')':match);
    if((attr==='href'||attr==='xlink:href')&&next.startsWith('#')&&ids.has(next.slice(1)))next='#'+ids.get(next.slice(1));
    if(attr==='aria-labelledby'||attr==='aria-describedby')next=next.split(/\s+/).map(key=>ids.get(key)||key).join(' ');
    if(next!==value)n.setAttribute(attr,next);
  }
 }
 return svg;
}
function pupilPages(items,title){
 const W=960,H=1250,pad=28,top=85,bottom=H-32,gap=8,layouts=[];let entries=[],y=top;
 for(const [index,item] of items.entries()){
   const svg=G.exportTools.withDocumentCardLayout(()=>renderItem(item,false)),v=dimensions(svg),width=W-2*pad-32,scale=Math.min(width/v.w,(bottom-top-gap)/v.h),h=v.h*scale;
   if(entries.length&&y+h>bottom){layouts.push(entries);entries=[];y=top}
   entries.push({svg,v,scale,h,y,index});y+=h+gap;
 }
 if(entries.length)layouts.push(entries);
 return layouts.map((entries,page)=>{
   const out=svgElement('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':'Worksheet','data-gd-paper-ready':'sheet','data-gd-paper-label':'99 Club Studio','data-worksheet-answer':'pupil'});
   const add=(name,attrs,text)=>out.appendChild(svgElement(name,attrs,text));
   add('rect',{width:W,height:H,fill:'#fff'});
   const heading=title;
   add('text',{x:pad,y:38,'font-family':'Arial,sans-serif','font-size':Math.min(26,850/Math.max(1,heading.length*.62)),'font-weight':700,fill:'#24343b'},heading);
   add('text',{x:pad,y:64,'font-family':'Arial,sans-serif','font-size':14,fill:'#52666d'},'Name: __________________________');
   add('text',{x:W-pad,y:64,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':14,fill:'#52666d'},'Page '+(page+1)+' / '+layouts.length);
   for(const {svg,v,scale,h,y,index} of entries){
     const baseline=Number(svg.getAttribute('data-worksheet-prompt-baseline')),promptSize=Number(svg.getAttribute('data-worksheet-prompt-size')),hasPrompt=baseline>0&&promptSize>0;
     const numberY=hasPrompt?y+(baseline-v.y)*scale:y+Math.min(24,h/2);
     add('text',{x:pad,y:numberY,'font-family':'Arial,sans-serif','font-size':hasPrompt?promptSize*scale:18,'font-weight':700,fill:'#24343b','data-pub-number':index+1},(index+1)+'.');
     const nested=svgElement('svg',{x:pad+32,y,width:v.w*scale,height:h,viewBox:[v.x,v.y,v.w,v.h].join(' ')});
     const source=isolateSvgIds(svg.cloneNode(true),'pub-'+(page+1)+'-'+(index+1)+'-');source.querySelectorAll('[data-gd-paper-brand]').forEach(n=>n.remove());
     [...source.childNodes].forEach(n=>nested.appendChild(n.cloneNode(true)));out.appendChild(nested);
   }
   return out;
 });
}
// Answer summaries come from frozen mathematical records, not rendered pupil text.
function answerSummary(item){
 if(item.kind!=='challenge')return null;
 const a=adapterFor(item.tool),d=item.data,c=d.challenge;
 if(a.answerSummary)return a.answerSummary(item);
 if(item.tool==='abacus'){
   const t=d.task,missing=['make10','bond','missing'].includes(t.mode);
   return missing?'Missing number: '+t.answer+'; final abacus total: '+t.target:'Final abacus total: '+t.target;
 }
 if(item.tool==='place-value'){
   const v=d.activity;
   if(v){
     const mode=v.activityMode;
     if(['read','hidden','digit'].includes(mode))return String(v.activityAnswer);
     const names=['10,000,000','1,000,000','100,000','10,000','1,000','100','10','1','0.1','0.01','0.001'].slice(d.settings.rangeStart,d.settings.rangeEnd+1);
     const powers=names.map(x=>Number(x.replace(/,/g,''))),scale=10**Math.max(0,d.settings.rangeEnd-7),units=Math.round(v.activityTarget*scale);
     const digits=powers.map(p=>Math.floor(units/Math.round(p*scale))%10);
     const exchange=counts=>{const i=counts.findIndex((n,j)=>n>0&&j<counts.length-1);if(i<0)return false;counts[i]--;counts[i+1]+=10;return true};
     if(mode==='same'){const start=v.activityStartCounts?.slice()||digits.slice();if(exchange(start))digits.splice(0,digits.length,...start);}
     if(mode==='exact')while(digits.reduce((x,y)=>x+y,0)<v.activityBudget){if(!exchange(digits))break}
     const chart=digits.map((n,i)=>n?n+' × '+names[i]:null).filter(Boolean).join(' + ')||'No counters';
     return (mode==='same'?'One possible different representation: ':mode==='exact'?'Example using '+v.activityBudget+' counters: ':'Completed chart: ')+chart+' = '+v.activityTarget+(mode==='same'?'. Accept other valid exchanges.':'');
   }
   return c?.answer;
 }
 if(item.tool==='clock'){
   if(['read-five','read-minute','roman-read'].includes(c.type))return c.answer.replace(/ (am|pm)$/i,'');
   return c.answer+(c.solutionExplanation?' — '+c.solutionExplanation:'');
 }
 if(item.tool==='array-builder'&&c.type==='build-array')return c.targetRows+' rows × '+c.targetCols+' columns = '+(c.targetRows*c.targetCols);
 if(item.tool==='maths-canvas'&&d.targetRule)return 'One possible solution: '+d.answer+'. Accept other valid expressions.';
 return c?.answer??d.answer;
}
function wrapAnnex(text,max=68){
 const out=[];let line='';
 for(const word of String(text).trim().split(/\s+/)){
   // Hard-break exceptional unspaced strings; never silently truncate an answer.
   const chunks=word.length>max?word.match(new RegExp('.{1,'+max+'}','gu')):[word];
   for(const chunk of chunks){if(line&&line.length+chunk.length+1>max){out.push(line);line=''}line+=(line?' ':'')+chunk}
 }
 if(line)out.push(line);return out;
}
// Marking guidance describes the actual constraints, not just a generic
// "other answers possible" message.
function answerNote(item){
 const adapter=adapterFor(item.tool),d=item.data,c=d.challenge||d.state?.challenge;
 if(adapter.answerNote)return adapter.answerNote(item);
 if(item.tool==='abacus'){
   const k=d.settings.kind;
   return k==='suanpan'?'Standard bead arrangement shown. Accept another arrangement only if the engaged beads give the correct value and the question does not require a standard arrangement.':'Use the completed bead arrangement shown; exchange into the next place when needed.';
 }
 if(item.tool==='place-value'){
   const v=d.activity,mode=v?.activityMode;
   if(mode==='same')return 'Accept any different counter arrangement with the same total, including a valid exchange in either direction.';
   if(mode==='exact')return 'Accept any arrangement with the target value AND exactly '+v.activityBudget+' counters.';
   if(mode==='build'||c?.type==='build-number')return 'Accept any valid representation of the target value, unless standard place-value digits are explicitly required.';
   if(mode==='regroup'||mode==='add'||c?.type==='non-standard')return 'Final chart must use no more than nine counters in each place and represent the correct total.';
 }
 if(item.tool==='array-builder'){
   if(c?.type==='build-array')return 'Accept drawn dots, shaded cells or another clearly shown array with the specified rows and columns.';
   if(c?.type==='partial-products')return 'Accept the partial products in any order, provided they match the shown partitions and sum to the correct total.';
 }
 if(item.tool==='fraction-wall'){
   if(c?.type==='simplify-strip')return 'Answer must be in lowest terms.';
   if(c?.type==='equivalent-strip')return 'The equivalent fraction must have the denominator specified in the question.';
   if(c?.type==='mixed-improper')return 'Accept an equivalent mixed number; require lowest terms only if requested.';
 }
 if(item.tool==='number-line'){
   if(c?.type==='marks-vs-spaces')return 'There are '+Math.round((d.state.max-d.state.min)/d.state.step)+' equal intervals. Accept equivalent explanations that count spaces rather than marks.';
   if(['error-scale'].includes(c?.type))return 'Accept equivalent explanations that correctly distinguish the interval value or spaces from marks.';
   if(['fraction-jump','fraction-sequence','mixed-number'].includes(c?.type))return 'Accept an equivalent fraction or mixed number, subject to the form requested in the question.';
   if(c?.type==='equivalent-fractions')return 'Use the denominator of the requested fraction line.';
 }
 if(item.tool==='clock'){
   if(['set-five','set-minute'].includes(c?.type))return 'Both hands must be correct; the hour hand should sit proportionally between hour marks. The analogue face alone cannot distinguish am from pm.';
   if(['read-five','read-minute','roman-read'].includes(c?.type))return 'Accept equivalent time notation. AM/PM cannot be determined from the analogue face alone.';
   if(c?.type==='two-duration-reason')return 'Accept equivalent explanations supported by the actual elapsed time.';
 }
 if(item.tool==='maths-canvas'&&d.targetRule)return 'Accept any expression that reaches the target, uses each supplied number once and follows the permitted operations and bracket rules.';
 return '';
}
function answerGraphic(item){
 const a=adapterFor(item.tool);
 if(a.answerGraphic)return a.answerGraphic(item);
 if(!['abacus','place-value','fraction-wall','array-builder','number-line','clock','sequences'].includes(item.tool))return null;
 return G.exportTools.withAnswerDiagram(()=>renderItem(item,true));
}
function answerPages(items,title){
 const W=960,H=1250,pad=28,top=98,bottom=H-48,step=26,gap=14,layouts=[];
 let entries=[],y=top;
 const flush=()=>{if(entries.length)layouts.push(entries);entries=[];y=top};
 for(const [index,item] of items.entries()){
   const value=answerSummary(item);if(value===null)continue;
   if(value===undefined||!String(value).trim())throw Error('Answer not available for question '+(index+1)+'.');
   const graphic=answerGraphic(item),v=graphic?dimensions(graphic):null,note=answerNote(item);
   // Compact models sit beside marking text; wide labelled charts remain full-width.
   const beside=!!v&&(item.tool==='abacus'||item.tool==='array-builder'||item.tool==='clock'&&v.w<=310);
   const widthLimit=beside?(item.tool==='clock'?270:425):item.tool==='fraction-wall'?760:850;
   const scale=v?Math.min(widthLimit/v.w,(beside?285:340)/v.h):0,gh=v?v.h*scale:0,gw=v?v.w*scale:0;
   const lines=wrapAnnex(value,beside?36:68),notes=note?wrapAnnex(note,beside?42:82):[];
   const textH=lines.length*step,notesH=notes.length?notes.length*22+6:0;
   const h=(beside?Math.max(textH+notesH,gh):textH+notesH+(graphic?gh+8:0))+gap;
   if(entries.length&&y+h>bottom)flush();
   if(h>bottom-top)throw Error('Answer for question '+(index+1)+' is too large for the annex.');
   entries.push({index,y,lines,notes,graphic,v,gw,gh,textH,notesH,beside});y+=h;
 }
 flush();
 return layouts.map((entries,page)=>{
   const svg=svgElement('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':'Answer annex','data-gd-paper-ready':'sheet','data-gd-paper-label':'99 Club Studio','data-worksheet-answer':'annex'});
   const add=(n,attrs,value)=>svg.appendChild(svgElement(n,attrs,value));
   add('rect',{width:W,height:H,fill:'#fff'});
   const text=(x,y,size,value,extra={})=>add('text',{x,y,'font-family':'Arial,sans-serif','font-size':size,fill:'#24343b',...extra},value);
   text(pad,38,26,'Answer key',{'font-weight':700});
   text(pad,64,Math.min(15,650/Math.max(1,(title.length+16)*.65)),title+' · Teacher annex');
   text(W-pad,64,14,'Annex '+(page+1)+' / '+layouts.length,{'text-anchor':'end'});
   for(const e of entries){
     text(pad,e.y+18,20,(e.index+1)+'.',{'font-weight':700,'data-pub-answer-number':e.index+1});
     e.lines.forEach((line,i)=>text(pad+48,e.y+18+i*step,20,line,{'font-weight':600}));
     e.notes.forEach((line,i)=>text(pad+48,e.y+e.textH+15+i*22,17,line,{fill:'#52666d','data-pub-answer-note':e.index+1}));
     if(e.graphic){
       const nested=svgElement('svg',{x:e.beside?W-pad-e.gw:pad+48,y:e.beside?e.y:e.y+e.textH+e.notesH+4,width:e.gw,height:e.gh,viewBox:[e.v.x,e.v.y,e.v.w,e.v.h].join(' '),'data-pub-answer-graphic':e.index+1});
       const source=isolateSvgIds(e.graphic.cloneNode(true),'annex-'+(page+1)+'-'+(e.index+1)+'-');
       source.querySelectorAll('[data-gd-paper-brand]').forEach(n=>n.remove());
       [...source.childNodes].forEach(n=>nested.appendChild(n.cloneNode(true)));svg.appendChild(nested);
     }
   }
   return svg;
 });
}
function pages(items,{title='Maths practice',teacher=false}={}){
 const pupil=pupilPages(items,title);
 return teacher?pupil.concat(answerPages(items,title)):pupil;
}

// Automatic and live capture share the same document and immutable recipes.
const BUILDER_CATALOG=[
 ['maths-canvas','Arithmetic'],['sequences','Sequences & rules'],['abacus','Abacus'],['place-value','Place value'],
 ['number-line','Number line'],['fraction-wall','Fraction wall'],['bar-model','Bar model'],['hundred-square','Hundred square'],['multiplication-grid','Multiplication grid'],['array-builder','Array builder'],['clock','Clock & time'],['money','UK money'],['coordinates','Coordinate grid'],['measurement','Ruler & measures'],['randomiser','Dice, spinner & randomiser'],['balance','Equation balance'],['times-table','Times-table visualiser'],['factors','Factors & multiples'],['fdp','Fraction–decimal–percentage'],['geoboard','Shape & geoboard']
];
function defaults(tool){
 if(tool==='maths-canvas')return {difficulty:'medium',curriculumProfile:'custom',numberSettings:G.numberChallenges.settings({},'medium'),workingLines:0};
 if(tool==='sequences')return {settings:{family:'all',difficulty:'medium'}};
 if(tool==='abacus')return {kind:'western',rows:5,colourScheme:'classic',showRowLabels:true};
 if(tool==='measurement')return {precision:'tenth',maxCm:30,responseLines:1};
 if(tool==='multiplication-grid')return {size:12,responseLines:1};
 if(tool==='hundred-square')return {startValue:1,responseLines:1};
 if(tool==='bar-model')return {responseLines:1};
 if(tool==='coordinates')return {scope:'mixed',responseLines:1};
 if(tool==='money')return {responseLines:1};
 if(tool==='number-line')return {preset:'negative',responseLines:1};
 if(tool==='array-builder')return {min:2,max:10,responseLines:1};
 if(tool==='fraction-wall')return {responseLines:1};
 if(tool==='clock')return {clockCount:2,clockLayout:'horizontal',responseLines:1};
 if(tool==='place-value')return {rangeStart:3,rangeEnd:9,activityBudget:5,additionDifficulty:'mixed',responseLines:3};
 return {};
}
function openEditor(draft,{mode='review'}={}){
 let dlg=document.getElementById('gd-publishing-editor');
 if(!dlg){dlg=document.createElement('dialog');dlg.id='gd-publishing-editor';dlg.className='gd-publishing-editor';document.body.appendChild(dlg)}
 let title=dlg.dataset.title||'Maths practice',teacher=false,status='',view=mode,blocks=dlg._pubBlocks||[],nextBlock=Math.max(0,...blocks.map(b=>b.id))+1,mix=false;
 const esc=G.esc;
 const option=(value,label,current)=>'<option value="'+esc(value)+'"'+(String(value)===String(current)?' selected':'')+'>'+esc(label)+'</option>';
 const select=(label,key,values,current)=>'<label class="gd-pub-field"><span>'+esc(label)+'</span><select data-pub-setting="'+esc(key)+'">'+values.map(v=>Array.isArray(v)?option(v[0],v[1],current):option(v,v,current)).join('')+'</select></label>';
 const levels=['easy','medium','hard'];
 function checks(label,key,values,selected){return '<div class="gd-pub-check-row"><span>'+esc(label)+'</span>'+values.map(v=>'<label><input type="checkbox" data-pub-array="'+key+'" value="'+esc(v)+'"'+(selected.includes(v)?' checked':'')+'>'+esc(v)+'</label>').join('')+'</div>'}
 function blockSettings(block){
   const m=block.settings,t=block.tool;
   if(t==='maths-canvas'){
     const n=m.numberSettings,N=G.numberChallenges;
     return '<div class="gd-pub-fields">'+select('Curriculum','curriculumProfile',N.curriculumProfiles.map(x=>[x.id,x.label]),m.curriculumProfile)+select('Difficulty','difficulty',levels,m.difficulty)+select('Minimum','numberSettings.min',[-100,-20,-10,0,1,2,5,10,20,50,100,200,500,1000].filter(x=>x<n.max),n.min)+select('Maximum','numberSettings.max',[10,20,50,100,200,500,1000,10000].filter(x=>x>n.min),n.max)+select('Precision','numberSettings.precision',[[0,'Whole numbers'],[1,'1 decimal place'],[2,'2 decimal places']],n.precision)+select('Working space','workingLines',[[0,'None'],[2,'2 lines'],[4,'4 lines']],m.workingLines)+select('Left terms','numberSettings.left',[[0,'Automatic'],1,2,3,4],n.left)+select('Right terms','numberSettings.right',[[0,'Automatic'],1,2,3,4],n.right)+select('Max denominator','numberSettings.denominator',[4,6,8,10,12,20],n.denominator)+'</div>'+checks('Operations','ops',N.OPS,n.ops)+checks('Comparisons','relations',['=','<','>'],n.relations)+checks('Extensions','extras',['Brackets','Powers','Remainders'],n.extras)+
     '<details class="gd-pub-details"'+(block.topicsOpen?' open':'')+' data-pub-topics><summary>Optional arithmetic topics ('+n.topics.length+')</summary><div class="gd-pub-check-grid">'+N.topics.map(o=>'<label><input type="checkbox" data-pub-array="topics" value="'+esc(o.id)+'"'+(n.topics.includes(o.id)?' checked':'')+'>'+esc(o.label)+'</label>').join('')+'</div></details>';
   }
   if(t==='sequences')return '<div class="gd-pub-fields">'+select('Rule family','settings.family',[['all','All families'],['constant','Constant difference'],['increasing','Changing difference'],['geometric','Multiplication'],['alternating','Alternating']],m.settings.family)+select('Difficulty','settings.difficulty',levels,m.settings.difficulty)+'</div>';
   if(t==='abacus')return '<div class="gd-pub-fields">'+select('Instrument','kind',[['western','Western abacus'],['soroban','Soroban'],['suanpan','Suanpan']],m.kind)+select('Places','rows',[3,4,5,6],m.rows)+select('Colours','colourScheme',['classic','place','sea','berry','forest'],m.colourScheme)+'</div>';
   if(t==='measurement')return '<div class="gd-pub-fields">'+select('Precision','precision',[['tenth','Millimetres (0.1 cm)'],['whole','Whole centimetres']],m.precision)+select('Maximum length','maxCm',[[10,'10 cm'],[20,'20 cm'],[30,'30 cm']],m.maxCm)+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Labelled ruler extracts are diagrams, not physical-size rulers. Placement tasks use the scale itself for the answer.</p>';
   if(t==='multiplication-grid')return '<div class="gd-pub-fields">'+select('Grid size','size',Array.from({length:11},(_,i)=>[i+5,(i+5)+' × '+(i+5)]),m.size)+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Find-the-fact questions use the whole grid; other challenges use the relevant table rows.</p>';
   if(t==='hundred-square')return '<div class="gd-pub-fields">'+select('Number range','startValue',[0,1,101,201,901].map(n=>[n,n+' to '+(n+99)]),m.startValue)+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Missing-number and neighbour tasks use complete row extracts; marking and pattern tasks use the whole square.</p>';
   if(t==='bar-model')return '<div class="gd-pub-fields">'+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Build tasks reserve a blank drawing area; reasoning questions include space to explain.</p>';
   if(t==='coordinates')return '<div class="gd-pub-fields">'+select('Grid','scope',[['mixed','Mixed / suitable grid'],['first','First quadrant only'],['four','Four quadrants']],m.scope)+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Plotting tasks use the grid itself as the answer area. Reflection and quadrant questions require four quadrants.</p>';
   if(t==='money')return '<div class="gd-pub-fields">'+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Construction questions retain drawing space. Teacher solutions include a valid combination of UK classroom coins and notes.</p>';
   if(t==='number-line')return '<div class="gd-pub-fields">'+select('Number line scale','preset',[['0-20','0 to 20 · ones'],['0-100','0 to 100 · tens'],['0-1000','0 to 1,000 · hundreds'],['negative','−10 to 10 · ones'],['decimal','0 to 1 · tenths']],m.preset)+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Fraction, zoom and proportional questions use their own compatible scales. Crossing zero requires the negative-number preset.</p>';
   if(t==='array-builder')return '<div class="gd-pub-fields">'+select('Smallest factor','min',Array.from({length:10},(_,i)=>i+2),m.min)+select('Largest factor','max',Array.from({length:12-m.min},(_,i)=>m.min+1+i),m.max)+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div>';
   if(t==='fraction-wall')return '<div class="gd-pub-fields">'+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div>';
   if(t==='clock')return '<div class="gd-pub-fields">'+select('Clock faces','clockCount',[[1,'One clock'],[2,'Two clocks (comparison enabled)']],m.clockCount)+select('Comparison layout','clockLayout',[['horizontal','Side by side'],['vertical','Stacked']],m.clockLayout)+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div>';
   if(t==='place-value'){
     const labels=['10,000,000','1,000,000','100,000','10,000','1,000','100','10','1','0.1','0.01','0.001'];
     return '<div class="gd-pub-fields">'+select('Highest place','rangeStart',labels.slice(0,10).map((v,i)=>[i,v]),m.rangeStart)+select('Lowest place','rangeEnd',labels.map((v,i)=>[i,v]).filter(v=>v[0]>m.rangeStart&&v[0]<=m.rangeStart+6),m.rangeEnd)+select('Exact counter budget','activityBudget',[3,4,5,6,7,8,9],m.activityBudget)+select('Addition','additionDifficulty',[['mixed','Mixed'],['regroup','Needs regrouping'],['no-regroup','No regrouping']],m.additionDifficulty)+'</div>';
   }
   return '';
 }
 function blockHtml(block,i){
   const available=types(block.tool,block.settings),selected=block.types===null?available.map(t=>t.id):block.types;
   return '<section class="gd-pub-source" data-pub-block="'+block.id+'"><header><div><small>Source '+(i+1)+'</small><strong>'+esc(adapterFor(block.tool).label)+'</strong></div><label class="gd-pub-count">Questions <select data-pub-count>'+Array.from({length:20},(_,j)=>option(j+1,j+1,block.count)).join('')+'</select></label><button type="button" class="gd-btn gd-pub-icon" data-pub-delete-block="'+block.id+'" aria-label="Remove source">×</button></header>'+blockSettings(block)+'<details class="gd-pub-details"'+(block.open?' open':'')+' data-pub-type-details><summary>Challenge types · '+selected.length+' of '+available.length+'</summary><div class="gd-pub-check-row"><button type="button" class="gd-btn" data-pub-all-types>All</button><button type="button" class="gd-btn" data-pub-no-types>None</button></div><div class="gd-pub-check-grid">'+available.map(t=>'<label><input type="checkbox" data-pub-type value="'+esc(t.id)+'"'+(selected.includes(t.id)?' checked':'')+'>'+esc(t.label)+'</label>').join('')+'</div></details></section>';
 }
 function renderBuilder(){
   const n=blocks.reduce((sum,x)=>sum+x.count,0);
   return '<div class="gd-pub-builder"><aside class="gd-pub-catalog"><h3>Widgets</h3><p>Choose a widget. Add it again for different settings.</p>'+BUILDER_CATALOG.map(([id,label])=>'<button type="button" class="gd-pub-catalog-item" data-pub-add-source="'+id+'"'+(!canGenerate(id)?' disabled':'')+'><span>'+esc(label)+'</span><small>'+(canGenerate(id)?'+ Add':supports(id)?'Current item only':'Pending')+'</small></button>').join('')+'</aside><main class="gd-pub-sources"><div class="gd-pub-section-head"><h3>Configure worksheet</h3><span>'+n+' questions</span></div>'+(blocks.length?blocks.map(blockHtml).join(''):'<div class="gd-pub-empty"><strong>Choose a widget to start</strong><p>Set quantities and question types independently for each source.</p></div>')+'</main></div><footer class="gd-pub-footer"><label><input type="checkbox" data-pub-mix'+(mix?' checked':'')+'> Mix questions after generation</label><span class="gd-pub-spacer"></span><button type="button" class="gd-btn gd-btn--primary" data-pub-generate'+(!n||n+draft.list().length>80?' disabled':'')+'>Add '+n+' questions to draft</button></footer>';
 }
 function renderReview(){
   const items=draft.list(),disabled=items.length?'':' disabled';
   return '<div class="gd-pub-toolbar"><label class="gd-pub-title"><span>Document title</span><input type="text" data-pub-title maxlength="80" value="'+esc(title)+'"></label><div class="gd-pub-segment" aria-label="Preview version"><button type="button" class="gd-btn" data-pub-pupil aria-pressed="'+!teacher+'"'+disabled+'>Pupil</button><button type="button" class="gd-btn" data-pub-teacher aria-pressed="'+teacher+'"'+disabled+'>With answers</button></div><button type="button" class="gd-btn" data-pub-group'+disabled+'>Group</button><button type="button" class="gd-btn" data-pub-shuffle'+disabled+'>Mix</button><button type="button" class="gd-btn gd-btn--primary" data-pub-print'+disabled+'>Print / PDF</button></div>'+
   (items.length?'<div class="gd-pub-body gd-pub-body--inline"><div class="gd-pub-preview"></div></div>':'<div class="gd-pub-empty"><strong>Start a worksheet</strong><p>Generate questions here, or add a diagram or challenge from a widget’s Export menu.</p><div><button type="button" class="gd-btn gd-btn--primary" data-pub-builder>Build automatically</button><button type="button" class="gd-btn" data-pub-close>Back to whiteboard</button></div></div>');
 }
 const actionIcons={up:'<path d="m6 14 6-6 6 6"/>',down:'<path d="m6 10 6 6 6-6"/>',replace:'<path d="M20 7v5h-5M4 17v-5h5M6 8a7 7 0 0 1 12-2l2 6M18 16a7 7 0 0 1-12 2l-2-6"/>',remove:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v6m4-6v6"/>'};
 function itemActions(item,i,count){
   const node=document.createElement('div');node.className='gd-pub-inline-actions';
   const button=(key,label,disabled=false)=>'<button type="button" class="gd-btn gd-pub-inline-icon" data-pub-'+key+'="'+item.id+'" title="'+esc(label)+'" aria-label="'+esc(label+' — question '+(i+1))+'"'+(disabled?' disabled':'')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+actionIcons[key]+'</svg></button>';
   const buttons=button('up','Move up',i===0)+button('down','Move down',i===count-1)+(item.recipe?button('replace','Replace with another question'):'')+button('remove','Remove');
   node.innerHTML='<div class="gd-pub-inline-desktop">'+buttons+'</div><details class="gd-pub-inline-mobile"><summary title="Question actions" aria-label="Actions for question '+(i+1)+'">⋯</summary><div>'+buttons+'</div></details>';
   return node;
 }
 function paintPreview(){
   const preview=dlg.querySelector('.gd-pub-preview');if(!preview)return;
   const items=draft.list(),sheets=pages(items,{title,teacher});
   preview.replaceChildren(...sheets.map(sheet=>{
     const frame=document.createElement('div');frame.className='gd-pub-sheet';
     const paper=G.exportTools.preparePaperSvg(sheet);frame.appendChild(paper);
     const rail=document.createElement('div');rail.className='gd-pub-action-rail';frame.appendChild(rail);
     for(const number of paper.querySelectorAll('[data-pub-number]')){
       const i=Number(number.getAttribute('data-pub-number'))-1;if(!items[i])continue;
       const action=itemActions(items[i],i,items.length);action.style.top=(100*Number(number.getAttribute('y'))/dimensions(paper).h)+'%';rail.appendChild(action);
     }
     return frame;
   }));
 }

 function render(){
   const scroll=dlg.querySelector('.gd-pub-sources')?.scrollTop||0,catalogScroll=dlg.querySelector('.gd-pub-catalog')?.scrollTop||0,previewScroll=dlg.querySelector('.gd-pub-preview')?.scrollTop||0,listScroll=dlg.querySelector('.gd-pub-list')?.scrollTop||0;
   dlg._pubBlocks=blocks;
   dlg.classList.toggle('is-builder',view==='builder');
   dlg.innerHTML='<header class="gd-pub-head"><div><small>99 Club Studio</small><strong>Worksheet publisher</strong></div><button type="button" class="gd-btn gd-pub-icon" data-pub-close aria-label="Close">×</button></header><nav class="gd-pub-nav"><button type="button" class="gd-btn" data-pub-builder aria-pressed="'+(view==='builder')+'">Automatic builder</button><button type="button" class="gd-btn" data-pub-back aria-pressed="'+(view==='review')+'">Review document <small>'+draft.list().length+'</small></button><span class="gd-pub-spacer"></span><button type="button" class="gd-btn" data-pub-close>Back to whiteboard</button></nav><p role="status" class="gd-pub-status"'+(!status?' hidden':'')+'>'+esc(status)+'</p>'+(view==='builder'?renderBuilder():renderReview());
   const source=dlg.querySelector('.gd-pub-sources');if(source)source.scrollTop=scroll;
   if(view==='review')try{paintPreview()}catch(e){const p=dlg.querySelector('.gd-pub-preview');if(p)p.textContent=e.message}
   for(const [selector,value] of [['.gd-pub-catalog',catalogScroll],['.gd-pub-preview',previewScroll],['.gd-pub-list',listScroll]]){const el=dlg.querySelector(selector);if(el)el.scrollTop=value}
 }
 function getBlock(el){return blocks.find(b=>String(b.id)===el.closest('[data-pub-block]')?.dataset.pubBlock)}
 dlg.onclick=e=>{const btn=e.target.closest('button');if(!btn||btn.disabled)return;const d=btn.dataset;
   try{
     status='';
     if('pubClose'in d){dlg.close();return}
     if('pubBuilder'in d)view='builder';else if('pubBack'in d)view='review';
     else if('pubAddSource'in d){if(!canGenerate(d.pubAddSource))throw Error('Add this illustration from its widget export menu.');blocks.push({id:nextBlock++,tool:d.pubAddSource,count:5,settings:defaults(d.pubAddSource),types:null,open:false})}
     else if('pubDeleteBlock'in d)blocks=blocks.filter(b=>b.id!==+d.pubDeleteBlock);
     else if('pubAllTypes'in d||'pubNoTypes'in d){const b=getBlock(btn);b.types='pubAllTypes'in d?null:[];b.open=true}
     else if('pubGenerate'in d){draft.generateBlocks(blocks);if(mix)draft.shuffle();blocks=[];view='review';teacher=false}
     else if('pubPrint'in d){G.exportTools.printSvg(pages(draft.list(),{title,teacher}),{title:title+(teacher?' — with answers':''),landscape:false,maxHeightMm:265});return}
     else if('pubGroup'in d)draft.group();else if('pubShuffle'in d)draft.shuffle();else if('pubPupil'in d)teacher=false;else if('pubTeacher'in d)teacher=true;else if('pubReplace'in d)draft.replace(+d.pubReplace);else if('pubRemove'in d)draft.remove(+d.pubRemove);else if('pubUp'in d)draft.move(+d.pubUp,-1);else if('pubDown'in d)draft.move(+d.pubDown,1);
   }catch(err){status=err.message}
   render();
 };
 dlg.onchange=e=>{
   const el=e.target,b=getBlock(el);
   if(el.hasAttribute('data-pub-title')){title=el.value.trim()||'Maths practice';dlg.dataset.title=title;paintPreview();return}
   if(el.hasAttribute('data-pub-mix')){mix=el.checked;return}
   if(!b)return;
   const section=el.closest('[data-pub-block]');b.open=!!section.querySelector('[data-pub-type-details]')?.open;b.topicsOpen=!!section.querySelector('[data-pub-topics]')?.open;
   if(el.hasAttribute('data-pub-count'))b.count=+el.value;
   else if(el.hasAttribute('data-pub-type')){b.types=[...section.querySelectorAll('[data-pub-type]:checked')].map(n=>n.value);b.open=true}
   else if(el.hasAttribute('data-pub-array')){const key=el.dataset.pubArray;b.settings.numberSettings[key]=[...section.querySelectorAll('[data-pub-array="'+key+'"]:checked')].map(n=>n.value)}
   else if(el.hasAttribute('data-pub-setting')){
     const key=el.dataset.pubSetting,parts=key.split('.'),obj=parts.length===2?b.settings[parts[0]]:b.settings,k=parts.at(-1);
     obj[k]=typeof obj[k]==='number'?+el.value:el.value;
     if(b.tool==='maths-canvas'&&(key==='curriculumProfile'||key==='difficulty'))b.settings.numberSettings=G.numberChallenges.curriculumSettings(b.settings.curriculumProfile,b.settings.difficulty);
     if(b.tool==='array-builder'&&key==='min')b.settings.max=Math.max(b.settings.min+1,b.settings.max);
     if(b.tool==='place-value'&&key==='rangeStart')b.settings.rangeEnd=Math.max(b.settings.rangeStart+1,Math.min(b.settings.rangeStart+6,b.settings.rangeEnd));
   }
   if(b.types!==null){const ids=types(b.tool,b.settings).map(t=>t.id);b.types=b.types.filter(id=>ids.includes(id))}
   status='';render();
 };
 dlg.ontoggle=null;dlg.addEventListener('toggle',function rememberDetails(e){const el=e.target;if(el.tagName!=='DETAILS')return;const b=getBlock(el);if(!b)return;if(el.hasAttribute('data-pub-type-details'))b.open=el.open;if(el.hasAttribute('data-pub-topics'))b.topicsOpen=el.open;},{capture:true,signal:(()=>{dlg._pubToggleController?.abort();dlg._pubToggleController=new AbortController();return dlg._pubToggleController.signal})()});
 render();if(!dlg.open)dlg.showModal();
}
G.publishing={register,supports,canGenerate,types,record,signature,createDocument,renderItem,pages,answerPages,answerSummary,answerNote,answerGraphic,openEditor,isolateSvgIds};
})(window.TT99Goodies);
