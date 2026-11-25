(function(G){
'use strict';
if(!G)return;
const adapters=new Map(),copy=v=>JSON.parse(JSON.stringify(v));
// Match the A4 printable area used by printSvg: 182 mm wide × 265 mm high.
const PAGE_W=960,PAGE_H=Math.round(PAGE_W*265/182);
// These diagrams contain labels pupils must actually read, not decorative
// detail. Prefer a larger diagram and an extra page to unreadable print.
const DENSE_DIAGRAMS=new Set(['sequences','abacus','place-value','number-line','hundred-square','multiplication-grid','array-builder','money','coordinates','measurement','geoboard']);
function register(tool,adapter){adapters.set(tool,adapter)}
function supports(tool){return adapters.has(tool)}
function canGenerate(tool){return supports(tool)&&typeof adapters.get(tool).generate==='function'}
function types(tool,model){return adapterFor(tool).types?.(model)||[]}
function adapterFor(tool){const a=adapters.get(tool);if(!a)throw Error('Publishing is not yet supported for this widget.');return a}
function record(tool,kind,data,recipe=null){return {tool,kind,data:copy(data),recipe:recipe?copy(recipe):null}}
function signature(item){return item.kind==='challenge'&&!item.data.authored?item.tool+':'+adapterFor(item.tool).signature(item.data):null}
function frozenSvg(raw){
 if(typeof raw!=='string'||!raw.trim())throw Error('The current diagram is not ready.');
 const svg=new DOMParser().parseFromString(raw,'image/svg+xml').documentElement;
 if(svg.localName!=='svg'||svg.querySelector('parsererror,script,foreignObject'))throw Error('The current diagram is not a printable vector image.');
 dimensions(svg);return svg;
}
function captureLiveDiagram(diagram,challenge,responseLines){
 const svg=diagram(!!challenge);
 const raw=new XMLSerializer().serializeToString(svg);
 if(!challenge)return {illustration:raw};
 if(challenge.mode!=='custom')return null;
 return {authored:{title:challenge.title,prompt:G.challengeKit.plainText(challenge.promptHtml||challenge.prompt||''),answer:challenge.answer,pupilSvg:raw,responseLines}};
}
function authoredRecord(tool,capture){
 const {prompt,title,answer,pupilSvg,responseLines}=capture;
 if(!String(prompt||'').trim())throw Error('Write a question before adding this custom challenge.');
 if(!String(answer??'').trim())throw Error('Add the correct answer or marking guidance before publishing this custom challenge.');
 frozenSvg(pupilSvg);
 return record(tool,'challenge',{type:'custom',authored:true,title:String(title||'Custom challenge'),prompt:String(prompt),answer:String(answer),pupilSvg,responseLines:Math.max(1,Math.min(4,Number(responseLines)||1))});
}
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
  addCurrent(tool,snapshot,staticSvg,authored){
    if(authored)return append([authoredRecord(tool,authored)]);
    if(staticSvg&&typeof staticSvg==='object'&&staticSvg.illustration){frozenSvg(staticSvg.illustration);return append([record(tool,'diagram',{frozenSvg:staticSvg.illustration})])}
    return append(adapterFor(tool).capture(copy(snapshot),staticSvg));
  },
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
        const preferred=queue.shift(),candidates=[preferred,...selected.filter(id=>id!==preferred)];
        let generated=null,lastError=null;
        for(const type of candidates){
          const recipe=a.recipe(copy(block.settings),type);
          try{generated=uniqueQuestion(block.tool,recipe,items.concat(records),rng);break}
          catch(e){if(!String(e.message).startsWith('No different question'))throw Error(a.label+': '+e.message);lastError=e}
        }
        if(!generated)throw Error(a.label+': '+lastError.message);
        records.push(generated);
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
function renderItem(item,teacher=false){
 if(item.data.frozenSvg)return frozenSvg(item.data.frozenSvg);
 if(item.data.authored)return G.exportTools.composeWorksheetCardSvg(frozenSvg(item.data.pupilSvg),{title:item.data.title,prompt:item.data.prompt,responseLabel:'Answer / working',responseLines:item.data.responseLines,responseMode:item.data.responseLines>1?'lines':'box',paperStyle:'plain',answer:item.data.answer,showAnswer:teacher});
 return adapterFor(item.tool).render(item,teacher);
}
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
 const W=PAGE_W,H=PAGE_H,pad=28,top=92,bottom=H-40,gap=14,layouts=[];let entries=[],y=top;
 for(const [index,item] of items.entries()){
   const svg=G.exportTools.withDocumentCardLayout(()=>renderItem(item,false),{denseDiagram:DENSE_DIAGRAMS.has(item.tool)}),v=dimensions(svg),width=W-2*pad-32,scale=Math.min(width/v.w,(bottom-top-gap)/v.h),h=v.h*scale;
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
     const nested=svgElement('svg',{x:pad+32,y,width:v.w*scale,height:h,viewBox:[v.x,v.y,v.w,v.h].join(' '),'data-pub-item':index+1});
     const source=isolateSvgIds(svg.cloneNode(true),'pub-'+(page+1)+'-'+(index+1)+'-');source.querySelectorAll('[data-gd-paper-brand]').forEach(n=>n.remove());
     [...source.childNodes].forEach(n=>nested.appendChild(n.cloneNode(true)));out.appendChild(nested);
   }
   return out;
 });
}
// Answer summaries come from frozen mathematical records, not rendered pupil text.
function answerSummary(item){
 if(item.kind!=='challenge')return null;
 if(item.data.authored)return item.data.answer;
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
function wrapAnnex(text,width,size,weight=400){
 return G.exportTools.wrapPaperText(text,width,size,weight);
}
// Marking guidance describes the actual constraints, not just a generic
// "other answers possible" message.
function answerNote(item){
 const adapter=adapterFor(item.tool),d=item.data,c=d.challenge||d.state?.challenge;
 if(item.kind!=='challenge')return '';
 if(d.authored)return 'Teacher-authored answer / marking guidance. The diagram is the question reference, not a generated worked solution.';
 const specific=adapter.answerNote?.(item);if(specific)return specific;
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
   if(c?.type==='multiplication-fact')return 'Require rows × columns in that order, as requested, with the correct total. Accept the product written on either side of the equality.';
   if(c?.type==='commutative-fact')return 'Require the reversed factor order and the unchanged product.';
 }
 if(item.tool==='fraction-wall'){
   if(c?.type==='identify-strip')return 'Require the actual number of shaded parts over the actual number of equal parts shown. A simplified equivalent alone does not give both requested counts.';
   if(c?.type==='compare-strips')return 'The comparison symbol must describe A compared with B, in that order.';
   if(c?.type==='denominator-misconception')return 'Accept equivalent reasoning comparing unit fractions of equal-sized wholes: more equal parts make each part smaller.';
   if(c?.type==='simplify-strip')return 'Answer must be in lowest terms.';
   if(c?.type==='equivalent-strip')return 'The equivalent fraction must have the denominator specified in the question.';
   if(c?.type==='mixed-improper')return 'Accept an equivalent mixed number; require lowest terms only if requested.';
 }
 if(item.tool==='number-line'){
   if(c?.type==='marks-vs-spaces')return 'There are '+Math.round((d.state.max-d.state.min)/d.state.step)+' equal intervals. Accept equivalent explanations that count spaces rather than marks.';
   if(['error-scale'].includes(c?.type))return 'Accept equivalent explanations that correctly distinguish the interval value or spaces from marks.';
   if(['fraction-jump','fraction-sequence','mixed-number'].includes(c?.type))return 'Accept an equivalent fraction or mixed number, subject to the form requested in the question.';
   if(c?.type==='equivalent-fractions')return 'Use the denominator of the requested fraction line.';
   if(c?.type==='missing-labels')return 'All missing numbers must be correct in their respective boxes, read from left to right.';
   if(c?.type==='order-markers')return 'Require every requested marker in the order specified by the question.';
   if(c?.type==='fdp-equivalence')return 'Require the requested fraction, decimal or percentage form; equivalent notation within that form is acceptable.';
   if(c?.type==='missing-jump')return 'The signed jump must have the correct magnitude and direction.';
 }
 if(item.tool==='clock'){
   if(['set-five','set-minute'].includes(c?.type))return 'Both hands must be correct; the hour hand should sit proportionally between hour marks. The analogue face alone cannot distinguish am from pm.';
   if(['read-five','read-minute','roman-read'].includes(c?.type))return 'Accept equivalent time notation. AM/PM cannot be determined from the analogue face alone.';
   if(c?.type==='two-duration-reason')return 'Accept equivalent explanations supported by the actual elapsed time.';
   if(c?.type==='elapsed-forward')return 'Both hands must show the final time. If a written time is given, check the stated starting time and elapsed minutes for the correct am/pm or 24-hour value.';
   if(c?.type==='time-language')return 'Accept equivalent past/to wording that identifies the correct hour and minute, including quarter or half where appropriate.';
   if(c?.type==='twelve-to-twentyfour')return 'Require correct 24-hour notation, including the correct hour for am or pm.';
   if(c?.type==='twentyfour-to-twelve')return 'Require correct 12-hour notation and am or pm, including noon and midnight.';
   if(['two-elapsed','two-midnight'].includes(c?.type))return 'The total must be correct in minutes as requested; equivalent working is acceptable.';
   if(c?.type==='two-order')return 'Require the correct labelled clock; equivalent wording identifying it is acceptable.';
   if(c?.type==='hour-hand-misconception')return 'Accept equivalent reasoning that the hour hand moves continuously as minutes pass.';
 }
 if(item.tool==='maths-canvas'&&d.targetRule)return 'Accept any expression that reaches the target, uses each supplied number once and follows the permitted operations and bracket rules.';
 if(item.tool==='maths-canvas')return d.solutionExplanation?'Accept equivalent working. '+d.solutionExplanation:'Accept equivalent numerical notation or the requested operator or comparison symbol.';
 if(item.tool==='sequences')return 'Use the stated rule family. '+(d.solutionExplanation||'Each missing term or rule value must match the displayed sequence.');
 if(item.tool==='place-value'&&c?.type==='zero-placeholder')return 'Accept equivalent reasoning that zero preserves the positions of the other digits.';
 if(item.tool==='measurement')return 'Require the requested measurement unit; accept equivalent numerical notation in that unit.';
 if(item.tool==='money')return 'Accept equivalent money notation with the correct value; require the specified denomination or number of pieces where requested.';
 return '';
}
function answerGraphic(item){
 if(item.data.authored)return frozenSvg(item.data.pupilSvg);
 const a=adapterFor(item.tool);
 if(a.answerGraphic)return a.answerGraphic(item);
 if(!['abacus','place-value','fraction-wall','array-builder','number-line','clock','sequences'].includes(item.tool))return null;
 return G.exportTools.withAnswerDiagram(()=>renderItem(item,true));
}
function answerPages(items,title){
 const W=PAGE_W,H=PAGE_H,pad=28,top=98,bottom=H-48,step=27,gap=18,layouts=[];
 let entries=[],y=top;
 const flush=()=>{if(entries.length)layouts.push(entries);entries=[];y=top};
 for(const [index,item] of items.entries()){
   const value=answerSummary(item);if(value===null)continue;
   if(value===undefined||!String(value).trim())throw Error('Answer not available for question '+(index+1)+'.');
   const graphic=answerGraphic(item),v=graphic?dimensions(graphic):null,note=answerNote(item);
   // Compact models sit beside marking text; wide labelled charts remain full-width.
   const dense=DENSE_DIAGRAMS.has(item.tool);
   // Small clock faces can sit beside the text. Label-rich boards get a
   // full-width answer graphic, with enough height to maintain legibility.
   const beside=!!v&&!dense&&item.tool==='clock'&&v.w<=310;
   const widthLimit=beside?270:item.tool==='fraction-wall'?760:W-2*pad-48;
   const scale=v?Math.min(widthLimit/v.w,(beside?285:dense?760:340)/v.h):0,gh=v?v.h*scale:0,gw=v?v.w*scale:0;
   const textWidth=beside?W-2*pad-48-gw-20:W-2*pad-48;
   const lines=wrapAnnex(value,textWidth,20,600),notes=note?wrapAnnex(note,textWidth,18,400):[];
   const textH=lines.length*step,notesH=notes.length?notes.length*23+8:0;
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
     e.notes.forEach((line,i)=>text(pad+48,e.y+e.textH+16+i*23,18,line,{fill:'#52666d','data-pub-answer-note':e.index+1}));
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
const BUILDER_GROUPS=[
 ['Number & calculation',['maths-canvas','sequences','abacus','place-value','number-line','hundred-square','balance']],
 ['Multiplication & division',['multiplication-grid','array-builder','times-table','factors']],
 ['Fractions & proportions',['fraction-wall','bar-model','fdp']],
 ['Geometry & measurement',['geoboard','coordinates','measurement','clock','money']],
 ['Other classroom tools',['randomiser']]
];
function defaults(tool){
 if(tool==='maths-canvas')return {difficulty:'medium',curriculumProfile:'custom',numberSettings:G.numberChallenges.settings({},'medium'),workingLines:0};
 if(tool==='sequences')return {settings:{family:'all',difficulty:'medium'}};
 if(tool==='abacus')return {kind:'western',rows:5,colourScheme:'classic',showRowLabels:true};
 if(tool==='measurement')return {precision:'tenth',maxCm:30,responseLines:1};
 if(tool==='multiplication-grid')return {size:12,responseLines:1};
 if(tool==='hundred-square')return {startValue:1,responseLines:1};
 if(tool==='bar-model')return {responseLines:1};
 if(tool==='factors'||tool==='fdp'||tool==='times-table')return {responseLines:1};
 if(tool==='balance')return {difficulty:'easy',responseLines:1};
 if(tool==='geoboard')return {gridSize:7,responseLines:1};
 if(tool==='coordinates')return {scope:'mixed',responseLines:1};
 if(tool==='money')return {responseLines:1};
 if(tool==='number-line')return {preset:'negative',responseLines:1};
 if(tool==='array-builder')return {min:2,max:10,responseLines:1};
 if(tool==='fraction-wall')return {responseLines:1};
 if(tool==='clock')return {clockCount:2,clockLayout:'horizontal',responseLines:1};
 if(tool==='place-value')return {rangeStart:3,rangeEnd:9,activityBudget:5,additionDifficulty:'mixed',responseLines:3};
 return {};
}
function openQuickGenerate(draft,tool,snapshot){
 if(!canGenerate(tool))throw Error('This widget supports current illustrations only.');
 const available=types(tool,snapshot),room=80-draft.list().length;
 if(!available.length)throw Error('No question types are available with these settings.');
 if(room<1)throw Error('This draft already contains 80 items.');
 const esc=G.esc,dlg=document.createElement('dialog');
 dlg.className='gd-publishing-editor gd-publishing-generate';
 dlg.setAttribute('aria-label','Generate worksheet questions');
 const count=Math.min(5,room),current=snapshot.challenge?.type||snapshot.task?.type||snapshot.session?.generator?.spec?.type||snapshot.session?.engine?.challenge?.type;
 dlg.innerHTML='<form class="gd-pub-quick"><header class="gd-pub-head"><div><small>Worksheet · '+esc(adapterFor(tool).label)+'</small><strong>Generate questions</strong></div><button type="button" class="gd-btn gd-pub-icon" data-pub-quick-cancel aria-label="Close">×</button></header>'+
 '<div class="gd-pub-quick-body"><div class="gd-pub-quick-count"><label class="gd-pub-field"><span>Number of questions</span><select name="count">'+Array.from({length:Math.min(20,room)},(_,i)=>'<option'+(i+1===count?' selected':'')+'>'+(i+1)+'</option>').join('')+'</select></label><p>Uses the widget’s current generation settings.</p></div>'+
 '<div class="gd-pub-quick-types"><div class="gd-pub-section-head"><h3>Question types</h3><small data-pub-quick-selected></small></div><div class="gd-pub-quick-actions"><button class="gd-btn" type="button" data-pub-quick-all>All</button><button class="gd-btn" type="button" data-pub-quick-none>None</button>'+
 (available.some(t=>t.id===current)?'<button class="gd-btn" type="button" data-pub-quick-current>Current type</button>':'')+'</div>'+
 '<div class="gd-pub-check-grid">'+available.map(t=>'<label><input type="checkbox" data-pub-quick-type value="'+esc(t.id)+'" checked><span>'+esc(t.label)+'</span></label>').join('')+'</div></div><p class="gd-pub-quick-error" role="status" hidden></p></div>'+
 '<footer class="gd-pub-footer"><button class="gd-btn" type="button" data-pub-quick-cancel>Cancel</button><button class="gd-btn gd-btn--primary" type="submit" data-pub-quick-add>Add questions</button></footer></form>';
 document.body.appendChild(dlg);
 const boxes=[...dlg.querySelectorAll('[data-pub-quick-type]')],number=dlg.querySelector('[name=count]'),submit=dlg.querySelector('[data-pub-quick-add]'),error=dlg.querySelector('.gd-pub-quick-error');
 const selected=()=>boxes.filter(x=>x.checked).map(x=>x.value);
 const sync=()=>{const n=selected().length;dlg.querySelector('[data-pub-quick-selected]').textContent=n+' of '+boxes.length+' selected';submit.disabled=!n;submit.textContent='Add '+number.value+' question'+(number.value==='1'?'':'s');error.hidden=true};
 dlg.querySelectorAll('[data-pub-quick-cancel]').forEach(btn=>btn.onclick=()=>dlg.close());
 for(const [key,test] of [['all',()=>true],['none',()=>false],['current',x=>x.value===current]]){
   const btn=dlg.querySelector('[data-pub-quick-'+key+']');if(btn)btn.onclick=()=>{boxes.forEach(x=>x.checked=test(x));sync()};
 }
 dlg.onchange=sync;
 dlg.querySelector('form').onsubmit=e=>{e.preventDefault();try{draft.generateBlocks([{tool,settings:snapshot,count:+number.value,types:selected()}]);dlg.close();openEditor(draft)}catch(err){error.textContent=err.message;error.hidden=false}};
 dlg.addEventListener('close',()=>dlg.remove(),{once:true});
 sync();dlg.showModal();
}
function openEditor(draft,{mode='review'}={}){
 let dlg=document.getElementById('gd-publishing-editor');
 if(!dlg){dlg=document.createElement('dialog');dlg.id='gd-publishing-editor';dlg.className='gd-publishing-editor';document.body.appendChild(dlg)}
 let title=dlg.dataset.title||'Maths practice',teacher=false,status='',view=mode,blocks=dlg._pubBlocks||[],nextBlock=Math.max(0,...blocks.map(b=>b.id))+1,mix=!!dlg._pubMix,catalogQuery=dlg._pubCatalogQuery||'',focusSource=null,previewZoom=dlg._pubPreviewZoom||'fit',jumpPage=null,previewPage=1;
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
   if(t==='abacus')return '<div class="gd-pub-fields">'+select('Instrument','kind',[['western','Western abacus'],['soroban','Soroban'],['suanpan','Suanpan'],['reckoning','Reckoning table'],['rods','Counting rods'],['napier','Napier’s bones'],['slide','Slide rule'],['pascaline','Pascaline']],m.kind)+select('Places','rows',[3,4,5,6],m.rows)+select('Colours','colourScheme',['classic','place','sea','berry','forest'],m.colourScheme)+'</div>';
   if(t==='measurement')return '<div class="gd-pub-fields">'+select('Precision','precision',[['tenth','Millimetres (0.1 cm)'],['whole','Whole centimetres']],m.precision)+select('Maximum length','maxCm',[[10,'10 cm'],[20,'20 cm'],[30,'30 cm']],m.maxCm)+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Labelled ruler extracts are diagrams, not physical-size rulers. Placement tasks use the scale itself for the answer.</p>';
   if(t==='multiplication-grid')return '<div class="gd-pub-fields">'+select('Grid size','size',Array.from({length:11},(_,i)=>[i+5,(i+5)+' × '+(i+5)]),m.size)+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Find-the-fact questions use the whole grid; other challenges use the relevant table rows.</p>';
   if(t==='hundred-square')return '<div class="gd-pub-fields">'+select('Number range','startValue',[0,1,101,201,901].map(n=>[n,n+' to '+(n+99)]),m.startValue)+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Missing-number and neighbour tasks use complete row extracts; marking and pattern tasks use the whole square.</p>';
   if(t==='bar-model')return '<div class="gd-pub-fields">'+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Build tasks reserve a blank drawing area; reasoning questions include space to explain.</p>';
   if(t==='coordinates')return '<div class="gd-pub-fields">'+select('Grid','scope',[['mixed','Mixed / suitable grid'],['first','First quadrant only'],['four','Four quadrants']],m.scope)+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Plotting tasks use the grid itself as the answer area. Reflection and quadrant questions require four quadrants.</p>';
   if(t==='money')return '<div class="gd-pub-fields">'+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Construction questions retain drawing space. Teacher solutions include a valid combination of UK classroom coins and notes.</p>';
   if(t==='number-line')return '<div class="gd-pub-fields">'+select('Number line scale','preset',[['0-20','0 to 20 · ones'],['0-100','0 to 100 · tens'],['0-1000','0 to 1,000 · hundreds'],['negative','−10 to 10 · ones'],['decimal','0 to 1 · tenths']],m.preset)+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Fraction, zoom and proportional questions use their own compatible scales. Crossing zero requires the negative-number preset.</p>';
   if(t==='array-builder')return '<div class="gd-pub-fields">'+select('Smallest factor','min',Array.from({length:10},(_,i)=>i+2),m.min)+select('Largest factor','max',Array.from({length:12-m.min},(_,i)=>m.min+1+i),m.max)+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div>';
   if(t==='geoboard')return '<div class="gd-pub-fields">'+select('Pin grid','gridSize',[5,7,9,11,13].map(n=>[n,n+' × '+n+' pins']),m.gridSize)+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Larger grids support larger shapes. Construction tasks use the grid as their working space.</p>';
   if(t==='balance')return '<div class="gd-pub-fields">'+select('Difficulty','difficulty',levels,m.difficulty)+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Medium includes one hanging balance; hard includes two. Same-to-both remains a direct equality task.</p>';
   if(t==='factors'||t==='fdp'||t==='times-table')return '<div class="gd-pub-fields">'+select('Answer space','responseLines',[[1,'Answer box'],[2,'2 lines'],[3,'3 lines'],[4,'4 lines']],m.responseLines)+'</div><p class="gd-help">Reasoning tasks include explanation space; graphical solutions appear in the teacher annex.</p>';
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
   const settings=blockSettings(block),invalid=!selected.length;
   return '<section class="gd-pub-source'+(invalid?' is-invalid':'')+'" data-pub-block="'+block.id+'"><header><button type="button" class="gd-pub-source-toggle" data-pub-toggle-block aria-expanded="'+!block.collapsed+'"><span class="gd-pub-source-chevron">'+(block.collapsed?'›':'⌄')+'</span><span><small>Set '+(i+1)+'</small><strong>'+esc(adapterFor(block.tool).label)+'</strong><small class="gd-pub-source-meta">'+(invalid?'Choose question types':selected.length+' of '+available.length+' types')+'</small></span></button><label class="gd-pub-count"><span>Questions</span><select data-pub-count aria-label="Number of questions in set '+(i+1)+'">'+Array.from({length:20},(_,j)=>option(j+1,j+1,block.count)).join('')+'</select></label><button type="button" class="gd-btn gd-pub-icon" data-pub-delete-block="'+block.id+'" aria-label="Remove set '+(i+1)+'" title="Remove set">×</button></header>'+
     '<div class="gd-pub-source-content"'+(block.collapsed?' hidden':'')+'>'+(settings?'<div class="gd-pub-source-settings">'+settings+'</div>':'')+
     '<details class="gd-pub-details"'+(block.open?' open':'')+' data-pub-type-details><summary>Question types <small>'+selected.length+' / '+available.length+'</small></summary><div class="gd-pub-check-row"><button type="button" class="gd-btn" data-pub-all-types>All</button><button type="button" class="gd-btn" data-pub-no-types>None</button></div><div class="gd-pub-check-grid">'+available.map(t=>'<label><input type="checkbox" data-pub-type value="'+esc(t.id)+'"'+(selected.includes(t.id)?' checked':'')+'><span>'+esc(t.label)+'</span></label>').join('')+'</div></details></div></section>';
 }
 function catalogHtml(){
   const lookup=new Map(BUILDER_CATALOG),query=catalogQuery.trim().toLowerCase(),out=[];
   for(const [group,ids] of BUILDER_GROUPS){
     const matches=ids.filter(id=>!query||(lookup.get(id)+' '+group+' '+id+' '+(supports(id)?adapterFor(id).label:'')).toLowerCase().includes(query));
     if(!matches.length)continue;
     out.push('<section class="gd-pub-catalog-group"><h4>'+esc(group)+'</h4>'+matches.map(id=>{
       const count=blocks.filter(b=>b.tool===id).length,enabled=canGenerate(id);
       return '<button type="button" class="gd-pub-catalog-item'+(count?' is-selected':'')+'" data-pub-add-source="'+id+'"'+(!enabled?' disabled':'')+'><span>'+esc(lookup.get(id))+'</span><small>'+(enabled?(count?count+' set'+(count===1?'':'s')+' · ＋':'＋'):supports(id)?'Current item only':'Pending')+'</small></button>';
     }).join('')+'</section>');
   }
   return out.join('')||'<p class="gd-pub-catalog-empty">No matching widgets.</p>';
 }
 function renderBuilder(){
   const n=blocks.reduce((sum,x)=>sum+x.count,0),existing=draft.list().length,invalid=blocks.some(b=>!(b.types===null?types(b.tool,b.settings).length:b.types.length)),over=n+existing>80;
   return '<div class="gd-pub-builder"><aside class="gd-pub-catalog"><div class="gd-pub-catalog-head"><h3>Add widgets</h3><p>Add the same widget again for a different set.</p><input type="search" data-pub-search placeholder="Find a widget…" aria-label="Find a widget" value="'+esc(catalogQuery)+'"></div><div class="gd-pub-catalog-results">'+catalogHtml()+'</div></aside><main class="gd-pub-sources"><div class="gd-pub-section-head gd-pub-config-head"><div><h3>Question sets</h3><small>'+blocks.length+' set'+(blocks.length===1?'':'s')+' · '+n+' new questions</small></div>'+(blocks.length?'<button type="button" class="gd-btn" data-pub-collapse-all>Collapse all</button>':'')+'</div>'+(blocks.length?blocks.map(blockHtml).join(''):'<div class="gd-pub-empty"><strong>Choose a widget to start</strong><p>Configure each set independently, then add the questions to your document.</p></div>')+'</main></div><footer class="gd-pub-footer gd-pub-builder-footer"><div class="gd-pub-draft-total"><strong>'+ (n+existing)+' / 80 items</strong><small>'+existing+' in draft · '+n+' new'+(over?' · reduce quantity':invalid?' · choose question types':'')+'</small></div><label><input type="checkbox" data-pub-mix'+(mix?' checked':'')+'> Mix questions after generation</label><button type="button" class="gd-btn gd-btn--primary" data-pub-generate'+(!n||over||invalid?' disabled':'')+'>Add '+n+' question'+(n===1?'':'s')+'</button></footer>';
 }
 function renderReview(){
   const items=draft.list(),disabled=items.length?'':' disabled',questions=items.filter(i=>i.kind==='challenge').length,illustrations=items.length-questions;
   const info=questions+' question'+(questions===1?'':'s')+(illustrations?' · '+illustrations+' illustration'+(illustrations===1?'':'s'):'');
   return '<div class="gd-pub-review-controls"><div class="gd-pub-toolbar gd-pub-review-title"><label class="gd-pub-title"><span>Document title</span><input type="text" data-pub-title maxlength="80" value="'+esc(title)+'"></label><div class="gd-pub-review-count"><strong>'+items.length+' / 80 items</strong><small>'+info+'</small></div><button type="button" class="gd-btn gd-btn--primary" data-pub-print'+disabled+'>Print / PDF</button></div>'+
   '<div class="gd-pub-toolbar gd-pub-review-tools"><div class="gd-pub-segment" aria-label="Preview and print version"><button type="button" class="gd-btn" data-pub-pupil aria-pressed="'+!teacher+'"'+disabled+'>Pupil</button><button type="button" class="gd-btn" data-pub-teacher aria-pressed="'+teacher+'"'+disabled+'>With answers</button></div><div class="gd-pub-order"><button type="button" class="gd-btn" data-pub-group'+disabled+' title="Group questions by widget">Group by widget</button><button type="button" class="gd-btn" data-pub-shuffle'+disabled+' title="Randomise document order">Mix</button></div><span class="gd-pub-spacer"></span><div class="gd-pub-segment" aria-label="Preview size"><button type="button" class="gd-btn" data-pub-zoom="fit" aria-pressed="'+(previewZoom==='fit')+'"'+disabled+'>Fit</button><button type="button" class="gd-btn" data-pub-zoom="large" aria-pressed="'+(previewZoom==='large')+'"'+disabled+'>Large</button></div></div></div>'+
   (items.length?'<div class="gd-pub-pagination"><button type="button" class="gd-btn gd-pub-icon" data-pub-prev aria-label="Previous page">‹</button><label><span>Page</span><select data-pub-page aria-label="Go to page"></select></label><span data-pub-page-total></span><button type="button" class="gd-btn gd-pub-icon" data-pub-next aria-label="Next page">›</button><span class="gd-pub-spacer"></span><button type="button" class="gd-btn" data-pub-jump-answers hidden>Go to answers</button><small data-pub-print-caption></small></div><div class="gd-pub-body gd-pub-body--inline"><div class="gd-pub-preview'+(previewZoom==='large'?' is-large':'')+'" tabindex="0" aria-label="Document preview"></div></div>':'<div class="gd-pub-empty"><strong>Start a worksheet</strong><p>Generate questions here, or add a diagram or challenge from a widget’s Export menu.</p><div><button type="button" class="gd-btn gd-btn--primary" data-pub-builder>Build automatically</button><button type="button" class="gd-btn" data-pub-close>Back to whiteboard</button></div></div>');
 }
 const actionIcons={up:'<path d="m6 14 6-6 6 6"/>',down:'<path d="m6 10 6 6 6-6"/>',replace:'<path d="M20 7v5h-5M4 17v-5h5M6 8a7 7 0 0 1 12-2l2 6M18 16a7 7 0 0 1-12 2l-2-6"/>',remove:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v6m4-6v6"/>'};
 function itemActions(item,i,count){
   const node=document.createElement('div');node.className='gd-pub-inline-actions';
   const button=(key,label,disabled=false)=>'<button type="button" class="gd-btn gd-pub-inline-icon" data-pub-'+key+'="'+item.id+'" title="'+esc(label)+'" aria-label="'+esc(label+' — question '+(i+1))+'"'+(disabled?' disabled':'')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+actionIcons[key]+'</svg></button>';
   const buttons=button('up','Move up',i===0)+button('down','Move down',i===count-1)+(item.recipe?button('replace','Replace with another question'):'')+button('remove','Remove');
   node.innerHTML='<div class="gd-pub-inline-desktop">'+buttons+'</div><details class="gd-pub-inline-mobile"><summary title="Question actions" aria-label="Actions for question '+(i+1)+'">⋯</summary><div>'+buttons+'</div></details>';
   return node;
 }
 function syncPageControls(){
   const preview=dlg.querySelector('.gd-pub-preview'),select=dlg.querySelector('[data-pub-page]');
   if(!preview||!select)return;
   const frames=[...preview.querySelectorAll('.gd-pub-sheet')],total=frames.length;
   if(!total)return;
   previewPage=Math.max(1,Math.min(previewPage,total));
   select.value=String(previewPage);
   dlg.querySelector('[data-pub-prev]').disabled=previewPage<=1;
   dlg.querySelector('[data-pub-next]').disabled=previewPage>=total;
   dlg.querySelector('[data-pub-page-total]').textContent='of '+total;
 }
 function goToPage(n){
   const preview=dlg.querySelector('.gd-pub-preview');if(!preview)return;
   const frames=[...preview.querySelectorAll('.gd-pub-sheet')];if(!frames.length)return;
   previewPage=Math.max(1,Math.min(Number(n)||1,frames.length));
   const frame=frames[previewPage-1],pr=preview.getBoundingClientRect(),fr=frame.getBoundingClientRect();
   preview.scrollTop+=fr.top-pr.top-12;syncPageControls();
 }
 function paintPreview(){
   const preview=dlg.querySelector('.gd-pub-preview');if(!preview)return;
   const items=draft.list(),sheets=pages(items,{title,teacher}),oldScroll=preview.scrollTop;
   const pupilCount=sheets.filter(s=>s.getAttribute('data-worksheet-answer')==='pupil').length,annexCount=sheets.length-pupilCount;
   preview.replaceChildren(...sheets.map((sheet,i)=>{
     const frame=document.createElement('div'),annex=sheet.getAttribute('data-worksheet-answer')==='annex';
     frame.className='gd-pub-sheet'+(annex?' is-annex':'');frame.dataset.pubSheet=String(i+1);
     frame.setAttribute('aria-label',annex?'Answer annex '+(i-pupilCount+1):'Worksheet page '+(i+1));
     const paper=G.exportTools.preparePaperSvg(sheet);frame.appendChild(paper);
     if(!annex){
       const rail=document.createElement('div');rail.className='gd-pub-action-rail';frame.appendChild(rail);
       for(const number of paper.querySelectorAll('[data-pub-number]')){
         const i=Number(number.getAttribute('data-pub-number'))-1;if(!items[i])continue;
         const action=itemActions(items[i],i,items.length);action.style.top=(100*(Number(number.getAttribute('y'))-dimensions(paper).y)/dimensions(paper).h)+'%';rail.appendChild(action);
       }
     }
     return frame;
   }));
   const select=dlg.querySelector('[data-pub-page]'),jump=dlg.querySelector('[data-pub-jump-answers]');
   select.replaceChildren(...sheets.map((sheet,i)=>{const opt=document.createElement('option');opt.value=String(i+1);opt.textContent=i<pupilCount?'Page '+(i+1):'Answers '+(i-pupilCount+1);return opt}));
   jump.hidden=!annexCount;jump.dataset.pubJumpAnswers=String(pupilCount+1);
   dlg.querySelector('[data-pub-print-caption]').textContent=pupilCount+' pupil page'+(pupilCount===1?'':'s')+(annexCount?' · '+annexCount+' answer page'+(annexCount===1?'':'s'):'');
   preview.onscroll=()=>{const pr=preview.getBoundingClientRect();const frames=[...preview.querySelectorAll('.gd-pub-sheet')];const active=frames.findIndex(frame=>frame.getBoundingClientRect().bottom>pr.top+Math.min(60,pr.height/4));if(active>=0){previewPage=active+1;syncPageControls()}};
   preview.scrollTop=oldScroll;syncPageControls();
 }

 function render(){
   const scroll=dlg.querySelector('.gd-pub-sources')?.scrollTop||0,catalogScroll=dlg.querySelector('.gd-pub-catalog')?.scrollTop||0,previewScroll=dlg.querySelector('.gd-pub-preview')?.scrollTop||0,listScroll=dlg.querySelector('.gd-pub-list')?.scrollTop||0;
   dlg._pubBlocks=blocks;dlg._pubMix=mix;dlg._pubCatalogQuery=catalogQuery;dlg._pubPreviewZoom=previewZoom;
   dlg.classList.toggle('is-builder',view==='builder');
   dlg.innerHTML='<header class="gd-pub-head"><div><small>99 Club Studio</small><strong>Worksheet publisher</strong></div><button type="button" class="gd-btn gd-pub-icon" data-pub-close aria-label="Close">×</button></header><nav class="gd-pub-nav"><button type="button" class="gd-btn" data-pub-builder aria-pressed="'+(view==='builder')+'">Automatic builder</button><button type="button" class="gd-btn" data-pub-back aria-pressed="'+(view==='review')+'">Review document <small>'+draft.list().length+'</small></button><span class="gd-pub-spacer"></span><button type="button" class="gd-btn" data-pub-close>Back to whiteboard</button></nav><p role="status" class="gd-pub-status"'+(!status?' hidden':'')+'>'+esc(status)+'</p>'+(view==='builder'?renderBuilder():renderReview());
   const source=dlg.querySelector('.gd-pub-sources');if(source)source.scrollTop=scroll;
   if(view==='review')try{paintPreview()}catch(e){const p=dlg.querySelector('.gd-pub-preview');if(p)p.textContent=e.message}
   for(const [selector,value] of [['.gd-pub-catalog',catalogScroll],['.gd-pub-preview',previewScroll],['.gd-pub-list',listScroll]]){const el=dlg.querySelector(selector);if(el)el.scrollTop=value}
   if(view==='review'&&jumpPage!==null){goToPage(jumpPage);jumpPage=null}
   if(focusSource!==null){const el=dlg.querySelector('[data-pub-block="'+focusSource+'"]');if(el&&source){source.scrollTop=Math.max(0,el.offsetTop-source.offsetTop-12);el.querySelector('[data-pub-toggle-block]')?.focus({preventScroll:true})}focusSource=null}
 }
 function getBlock(el){return blocks.find(b=>String(b.id)===el.closest('[data-pub-block]')?.dataset.pubBlock)}
 dlg.onclick=e=>{const btn=e.target.closest('button');if(!btn||btn.disabled)return;const d=btn.dataset;
   try{
     status='';
     if('pubClose'in d){dlg.close();return}
     if('pubBuilder'in d)view='builder';else if('pubBack'in d)view='review';
     else if('pubAddSource'in d){if(!canGenerate(d.pubAddSource))throw Error('Add this illustration from its widget export menu.');blocks.forEach(b=>b.collapsed=true);const id=nextBlock++;blocks.push({id,tool:d.pubAddSource,count:5,settings:defaults(d.pubAddSource),types:null,open:false,collapsed:false});focusSource=id}
     else if('pubToggleBlock'in d){const b=getBlock(btn);b.collapsed=!b.collapsed}
     else if('pubCollapseAll'in d)blocks.forEach(b=>b.collapsed=true);
     else if('pubDeleteBlock'in d)blocks=blocks.filter(b=>b.id!==+d.pubDeleteBlock);
     else if('pubAllTypes'in d||'pubNoTypes'in d){const b=getBlock(btn);b.types='pubAllTypes'in d?null:[];b.open=true}
     else if('pubGenerate'in d){draft.generateBlocks(blocks);if(mix)draft.shuffle();blocks=[];view='review';teacher=false}
     else if('pubPrev'in d){goToPage(previewPage-1);return}
     else if('pubNext'in d){goToPage(previewPage+1);return}
     else if('pubJumpAnswers'in d){goToPage(+d.pubJumpAnswers);return}
     else if('pubZoom'in d){previewZoom=d.pubZoom;jumpPage=previewPage}
     else if('pubPrint'in d){G.exportTools.printSvg(pages(draft.list(),{title,teacher}),{title:title+(teacher?' — with answers':''),landscape:false,maxHeightMm:265});return}
     else if('pubGroup'in d)draft.group();else if('pubShuffle'in d)draft.shuffle();else if('pubPupil'in d){teacher=false;jumpPage=1}else if('pubTeacher'in d){teacher=true;jumpPage=1}else if('pubReplace'in d)draft.replace(+d.pubReplace);else if('pubRemove'in d)draft.remove(+d.pubRemove);else if('pubUp'in d)draft.move(+d.pubUp,-1);else if('pubDown'in d)draft.move(+d.pubDown,1);
   }catch(err){status=err.message}
   render();
 };
 dlg.oninput=e=>{if(e.target.hasAttribute('data-pub-search')){catalogQuery=e.target.value;dlg._pubCatalogQuery=catalogQuery;dlg.querySelector('.gd-pub-catalog-results').innerHTML=catalogHtml()}};
 dlg.onchange=e=>{
   const el=e.target,b=getBlock(el);
   if(el.hasAttribute('data-pub-page')){goToPage(+el.value);return}
   if(el.hasAttribute('data-pub-title')){title=el.value.trim()||'Maths practice';dlg.dataset.title=title;paintPreview();return}
   if(el.hasAttribute('data-pub-mix')){mix=el.checked;dlg._pubMix=mix;return}
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
G.publishing={captureLiveDiagram,register,supports,canGenerate,types,record,signature,createDocument,renderItem,pages,answerPages,answerSummary,answerNote,answerGraphic,openEditor,openQuickGenerate,isolateSvgIds,catalogue:()=>BUILDER_CATALOG.map(([id,label])=>({id,label,canGenerate:canGenerate(id)})),defaultSettings:tool=>copy(defaults(tool))};
})(window.TT99Goodies);
