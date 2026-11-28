'use strict';
const fs=require('fs');
const pageSource=fs.readFileSync('_pages/whiteboard.md','utf8');
const styleTags=pageSource.split('\n').filter(l=>l.startsWith('<link rel="stylesheet" href="/assets/99club/goodies')).join('\n').replace(/\?v=[^"]+/g,'');
const scriptTags=pageSource.split('\n').filter(l=>l.startsWith('<script src="/assets/99club/goodies')).map(l=>l.replace(' defer','')).join('\n').replace(/\?v=[^"]+/g,'');
const file='99club-goodies-publication-qa.html',report='99club-goodies-publication-qa-report.json';
if(process.argv[2]==='prepare'){
 const browser=function(){
  function assert(v,m){if(!v)throw Error(m)}
  function run(){
   const G=window.TT99Goodies,P=G.publishing,X=G.exportTools,host=document.getElementById('publication-samples');
   const results=[],warnings=[],issues=[],clipping=[];
   let seed=42137;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const catalog=P.catalogue();
   assert(catalog.length===24&&catalog.every(x=>P.supports(x.id)),'All 24 widgets must have publishing adapters');
   const vb=svg=>svg.getAttribute('viewBox').split(/\s+/).map(Number);
   function checkPage(svg,tool,kind){
     const [x,y,w,h]=vb(svg);
     assert(Math.abs(h/w-265/182)<.002,'Page printable area ratio');
     // A nested SVG's getBBox is in its own user coordinate system, not
     // the parent sheet coordinates. Compare its allocated viewport to
     // the sheet; independently transform actual text bounds to the sheet.
     const outside=b=>b.x<x-1||b.y<y-1||b.x+b.width>x+w+1||b.y+b.height>y+h+1;
     for(const node of svg.querySelectorAll(':scope > svg')){
       const b={x:node.x.baseVal.value,y:node.y.baseVal.value,width:node.width.baseVal.value,height:node.height.baseVal.value};
       if(outside(b))issues.push(tool+' '+kind+' item viewport outside page: '+JSON.stringify(b));
     }
     for(const node of svg.querySelectorAll(':scope > text')){
       if(outside(node.getBBox()))issues.push(tool+' '+kind+' page text outside page: '+node.textContent.slice(0,80));
     }
     for(const text of svg.querySelectorAll('text')){
       const mat=text.getScreenCTM(),root=svg.getScreenCTM();
       if(!mat||!root)continue;
       const b=text.getBBox(),m=root.inverse().multiply(mat);
       const corners=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));
       const left=Math.min(...corners.map(p=>p.x)),right=Math.max(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y)),bottom=Math.max(...corners.map(p=>p.y));
       if(text.ownerSVGElement!==svg&&outside({x:left,y:top,width:right-left,height:bottom-top}))clipping.push({tool,kind,text:text.textContent.slice(0,100)});
       const scale=Math.hypot(mat.a,mat.b)/Math.hypot(root.a,root.b);
       const size=parseFloat(getComputedStyle(text).fontSize)*scale*182/w*72/25.4;
       if(text.textContent.trim()&&size<7&&!text.hasAttribute('data-gd-paper-brand'))warnings.push({tool,kind,pointSize:Math.round(size*10)/10,text:text.textContent.slice(0,70)});
     }
   }
   for(const entry of catalog){
     const tool=entry.id;
     if(!entry.canGenerate){results.push({tool,status:'current illustration only'});continue}
     const settings=P.defaultSettings(tool),families=P.types(tool,settings),items=[];
     assert(families.length,'No compatible default question types: '+tool);
     for(const family of families){
       try{
         const draft=P.createDocument();
         draft.generate(tool,settings,1,family.id,rng);
         const item=draft.list()[0];item.id=items.length+1;items.push(item);
         assert(item.kind==='challenge'&&P.answerSummary(item)!=null&&String(P.answerSummary(item)).trim(),'Missing answer: '+family.id);
       }catch(err){issues.push(tool+'/'+family.id+': '+err.message)}
     }
     if(!items.length)continue;
     try{
       const sheets=P.pages(items,{title:entry.label+' — publication audit',teacher:true});
       const section=document.createElement('section');section.className='audit-widget';
       const h=document.createElement('h2');h.textContent=entry.label+' · '+items.length+' challenge families';section.appendChild(h);host.appendChild(section);
       const numbers=[],answers=[];
       for(const sheet of sheets){
         const kind=sheet.getAttribute('data-worksheet-answer'),prepared=X.preparePaperSvg(sheet);
         const frame=document.createElement('div');frame.className='audit-sheet';frame.appendChild(prepared);section.appendChild(frame);
         checkPage(prepared,tool,kind);
         numbers.push(...[...prepared.querySelectorAll('[data-pub-number]')].map(n=>Number(n.getAttribute('data-pub-number'))));
         answers.push(...[...prepared.querySelectorAll('[data-pub-answer-number]')].map(n=>Number(n.getAttribute('data-pub-answer-number'))));
       }
       const expected=items.map((_,i)=>i+1);
       assert(JSON.stringify(numbers)===JSON.stringify(expected),'Missing or repeated pupil question numbers');
       assert(JSON.stringify(answers)===JSON.stringify(expected),'Missing or repeated teacher answers');
       results.push({tool,families:families.map(f=>f.id),generated:items.length,pupilPages:sheets.filter(s=>s.getAttribute('data-worksheet-answer')==='pupil').length,annexPages:sheets.filter(s=>s.getAttribute('data-worksheet-answer')==='annex').length,graphics:sheets.reduce((n,s)=>n+s.querySelectorAll('[data-pub-answer-graphic]').length,0)});
     }catch(err){issues.push(tool+': '+err.message)}
   }

   // G7: the default catalogue excludes opt-in enrichment. Audit every
   // geometry family through the actual publishing adapter, not a duplicate
   // renderer. Keep detailed evidence in the report and preserve the existing
   // page-size and typography gates for the extra printed samples.
   const geometryFamilies=P.types('angles',{...P.defaultSettings('angles'),enrichment:true});
   const geometryDefault=P.types('angles',P.defaultSettings('angles'));
   const geometryEvidence=[],enrichmentItems=[];
   const geometryIds=new Set(geometryFamilies.map(f=>f.id));
   assert(geometryIds.size===G.angles.FAMILIES.length&&G.angles.FAMILIES.every(f=>geometryIds.has(f[0])),'Publication audit includes every registered geometry family');
   const geometryFinite=(svg,id,kind)=>{assert(svg&&svg.tagName.toLowerCase()==='svg',id+' '+kind+' missing SVG');const [x,y,w,h]=vb(svg);assert([x,y,w,h].every(Number.isFinite)&&w>0&&h>0,id+' '+kind+' invalid viewport');assert(!/\b(?:NaN|Infinity|undefined)\b/.test(svg.outerHTML),id+' '+kind+' invalid SVG content');return svg};
   for(const family of geometryFamilies){
     const id=family.id,settings={...P.defaultSettings('angles'),mode:family.mode,level:'medium',enrichment:true};
     try{
       const batch=P.createDocument(),mixed=P.createDocument(),capture=P.createDocument();
       batch.generate('angles',settings,2,id,rng);
       const batchItems=batch.list();assert(batchItems.length===2&&batchItems.every(i=>i.data.type===id&&i.recipe.type===id),'Batch does not preserve family');
       const batchCards=batchItems.map(i=>geometryFinite(P.renderItem(i,false),id,'batch pupil'));assert(!batchCards[0].isEqualNode(batchCards[1]),'Batch repeats identical pupil card despite distinct data signature');
       const otherTool='sequences',otherSettings=P.defaultSettings(otherTool),otherType=P.types(otherTool,otherSettings)[0].id;
       mixed.generateBlocks([{tool:'angles',settings,types:[id],count:1},{tool:otherTool,settings:otherSettings,types:[otherType],count:1}],rng);
       const original=mixed.list(),item=original[0],other=JSON.stringify(original[1]),frozen=JSON.stringify(item);
       assert(item.data.type===id&&item.kind==='challenge'&&original[1].tool===otherTool,'Mixed source recipe changes family');
       const pupil=geometryFinite(P.renderItem(item,false),id,'pupil'),teacher=geometryFinite(P.renderItem(item,true),id,'teacher'),graphic=geometryFinite(P.answerGraphic(item),id,'annex');
       assert(pupil.getAttribute('data-worksheet-answer')==='pupil'&&teacher.getAttribute('data-worksheet-answer')==='teacher','Explicit pupil/teacher card modes');
       assert(P.answerSummary(item)===item.data.answer&&P.answerNote(item).includes(item.data.note),'Marking record matches generated question');
       assert(!pupil.querySelector('[data-ag-construction-key="1"],[data-ag-linked-answer],[data-ag-solution-circle="1"]'),'Teacher-specific solution geometry leaks into pupil card');
       if(G.angles.labTypes.includes(id))assert(graphic.getAttribute('data-ag-construction-key')==='1','Assessed construction requires a solved graphical annex');
       capture.addCurrent('angles',{task:{...item.data,revealed:true}});
       const captured=capture.list()[0];
       assert(captured.data.revealed===false&&captured.data.answer===item.data.answer,'Current capture retains original givens but clears reveal');
       assert(P.renderItem(captured,false).isEqualNode(pupil),'Previously revealed current task changes pupil paper');
       assert(JSON.stringify(item)===frozen,'Rendering or capture mutated the frozen item');
       const replaced=mixed.replace(item.id,rng);
       assert(replaced.id===item.id&&replaced.data.type===id&&JSON.stringify(replaced.recipe)===JSON.stringify(item.recipe)&&JSON.stringify(mixed.list()[1])===other,'Replacement must isolate the selected recipe');
       assert(!P.renderItem(replaced,false).isEqualNode(pupil),'Replacement repeats identical pupil card despite distinct data signature');
       if(!geometryDefault.some(f=>f.id===id))enrichmentItems.push(item);
       geometryEvidence.push({id,stage:family.year,mode:family.mode,batch:true,current:true,mixed:true,replacement:true,pupil:true,teacher:true,annex:true});
     }catch(err){issues.push('angles/'+id+': '+err.message);geometryEvidence.push({id,error:err.message})}
   }
   for(let start=0;start<enrichmentItems.length;start+=12){
     const items=enrichmentItems.slice(start,start+12),title='Geometry enrichment — publication audit '+(start+1);
     try{
       const pupils=P.pages(items,{title}),both=P.pages(items,{title,teacher:true}),section=document.createElement('section');section.className='audit-widget';
       assert(pupils.length>0&&pupils.every((p,i)=>p.isEqualNode(both[i])),'Adding answer annex changes pupil sheets');
       const heading=document.createElement('h2');heading.textContent=title;section.appendChild(heading);host.appendChild(section);
       const questions=[],answers=[];
       for(const sheet of both){
         const prepared=X.preparePaperSvg(sheet),frame=document.createElement('div');frame.className='audit-sheet';frame.appendChild(prepared);section.appendChild(frame);
         checkPage(prepared,'angles-enrichment',sheet.getAttribute('data-worksheet-answer'));
         questions.push(...[...prepared.querySelectorAll('[data-pub-number]')].map(n=>Number(n.getAttribute('data-pub-number'))));
         answers.push(...[...prepared.querySelectorAll('[data-pub-answer-number]')].map(n=>Number(n.getAttribute('data-pub-answer-number'))));
       }
       const expected=items.map((_,i)=>i+1);
       assert(JSON.stringify(questions)===JSON.stringify(expected)&&JSON.stringify(answers)===JSON.stringify(expected),'Enrichment page and annex numbering mismatch');
       for(const item of items)geometryEvidence.find(e=>e.id===item.data.type).paginated=true;
     }catch(err){issues.push(title+': '+err.message)}
   }
   results.push({tool:'angles-all-families',families:geometryEvidence.map(e=>e.id),audited:geometryEvidence.length,enrichment:enrichmentItems.length,evidence:geometryEvidence});
   // Audit every statistics representation rather than only its default table.
   for(const view of ['tally','pictogram','block','bar','line','pie','timetable']){
     const settings={...P.defaultSettings('statistics-table'),view};
     const draft=P.createDocument();
     for(const family of P.types('statistics-table',settings))draft.generate('statistics-table',settings,1,family.id,rng);
     const items=draft.list();assert(items.length===P.types('statistics-table',settings).length,'Every statistics family is generated: '+view);
     assert(items.every(item=>{const a=String(P.answerSummary(item));return item.data.type==='pie-build'?a.split(', ').map(Number).reduce((s,v)=>s+v,0)===360:item.data.type==='pie-fraction'?/^\d+\/\d+$/.test(a):['time-read','time-complete'].includes(item.data.type)?/^\d{2}:\d{2}$/.test(a):Number.isFinite(Number(a));}),'All statistics answers have valid formats: '+view);
     for(const sheet of P.pages(items,{teacher:true})){
       const prepared=X.preparePaperSvg(sheet),frame=document.createElement('div');frame.className='audit-sheet';frame.appendChild(prepared);host.appendChild(frame);
       checkPage(prepared,'statistics-'+view,sheet.getAttribute('data-worksheet-answer'));
     }
   }
   for(const [year,view] of [['2','pictogram'],['3','bar'],['4','line'],['5','line'],['6','pie']]){
     const S=G.statisticsTable,settings={year,view,max:20,count:4,key:2};
     for(const family of S.questionTypes(view,year))for(let i=0;i<30;i++){
       const item=S.generate(S.recipe(settings,family[0]),rng);
       assert(family[0]==='pie-build'?item.answer.split(', ').map(Number).reduce((s,v)=>s+v,0)===360:family[0]==='pie-fraction'?/^\d+\/\d+$/.test(item.answer):Number.isInteger(item.answer),'Valid primary statistics answer: '+year+'/'+view+'/'+family[0]);
       if(year==='2')assert(item.key===2&&item.data.rows.every(r=>r.value<=20),'Year selection preserves teacher chosen scale and range');
     }
   }
   for(const year of ['2','3','4','5','6']){const S=G.statisticsTable;assert(S.viewsFor(year).length===8,'Year suggestions never hide representations');assert(S.recipe({year,view:'pie',max:40,count:6,key:5}).view==='pie','Teacher may choose any representation regardless of year');assert(S.questionTypes('table',year).some(([id])=>id==='mean'),'Teacher may choose advanced content regardless of year');}
   // Dense cards should use available page height, while standalone output remains unchanged.
   const geo=P.createDocument();geo.generate('geoboard',{gridSize:13},1,'build-area',rng);
   const geoItem=geo.list()[0],denseCard=X.withDocumentCardLayout(()=>P.renderItem(geoItem,false),{denseDiagram:true}),compactCard=X.withDocumentCardLayout(()=>P.renderItem(geoItem,false));
   assert(vb(denseCard)[3]>vb(compactCard)[3],'Dense worksheet policy allocates more vertical drawing space');
   const geoAnnex=P.pages([geoItem],{teacher:true}).find(page=>page.getAttribute('data-worksheet-answer')==='annex');
   assert(Number(geoAnnex.querySelector('[data-pub-answer-graphic]').getAttribute('height'))>340,'Dense Geoboard answer is no longer compressed to the former annex cap');
   const abacusResult=results.find(r=>r.tool==='abacus');
   assert(abacusResult.annexPages<=5,'Nine bead-abacus answers fit on at most five annex pages while maintaining legibility');
   assert(warnings.length===0,'Default and geometry enrichment samples must retain the zero sub-7pt text baseline: '+JSON.stringify(warnings.slice(0,12)));
   assert(clipping.length===0,'No rendered text outside the page: '+JSON.stringify(clipping.slice(0,5)));
   for(const kind of ['reckoning','rods','napier','slide','pascaline']){
     const settings={kind},families=P.types('abacus',settings);
     for(const family of families){
       const draft=P.createDocument();draft.generate('abacus',settings,2,family.id,rng);
       const items=draft.list();
       assert(items.every(item=>item.data.historical&&P.answerSummary(item)&&P.answerNote(item)),'Historical instrument marking: '+kind);
       const pages=P.pages(items,{teacher:true});
       assert(pages.some(page=>page.querySelector('[data-pub-answer-graphic]')),'Historical instrument graphic: '+kind);
       for(const page of pages){const prepared=X.preparePaperSvg(page);const frame=document.createElement('div');frame.className='audit-sheet';frame.appendChild(prepared);host.appendChild(frame);checkPage(prepared,'abacus-'+kind,page.getAttribute('data-worksheet-answer'))}
     }
   }
   assert(warnings.length===0,'Historical samples also retain readable text');
   assert(clipping.length===0,'Historical samples have no page clipping');
   // Written Methods: square cells and mathematical decimal alignment on
   // the same SVG used in demonstrations, working challenges and publication.
   const WM=G.writtenMethods,WC=G.columnMethods;
   const decimalExamples=[
     ['addition','24.75','8.6',{},'33.35'],
     ['subtraction','42.05','7.86',{},'34.19'],
     ['short-multiplication','12.75','6',{},'76.50'],
     ['long-multiplication','4.25','12',{},'51.00'],
     ['short-division','98','4',{resultMode:'decimal',resultPrecision:1},'24.5'],
     ['long-division','150','16',{resultMode:'decimal',resultPrecision:3},'9.375'],
     ['short-division','42.75','5',{resultMode:'decimal',resultPrecision:2},'8.55'],
     ['long-division','100','12',{resultMode:'rounded',resultPrecision:2},'8.33'],
     ['long-division','1999','200',{resultMode:'rounded',resultPrecision:2},null],
     ['short-division','875','24',{twoDigitShort:true},'36 r 11']
   ];
   for(const [method,a,b,options,answer] of decimalExamples){
     if(answer===null){let rejected=false;try{WM.calculate(method,a,b,options)}catch(_){rejected=true}assert(rejected,'Invalid divisor rejected');continue}
     const m=WM.calculate(method,a,b,options),L=WC.layout(m);
     assert(m.answerText===answer,'Exact decimal example '+method+' '+a+' '+b);
     for(const opts of [{step:0,grid:true},{step:0,grid:true,work:true},{step:m.steps.length,grid:true}]){
       const svg=WC.diagram(m,opts),xs=[...svg.querySelectorAll('[data-wm-grid="vertical"]')].map(n=>+n.getAttribute('x1')),ys=[...svg.querySelectorAll('[data-wm-grid="horizontal"]')].map(n=>+n.getAttribute('y1'));
       assert(xs.every((v,i)=>!i||v-xs[i-1]===L.cell)&&ys.every((v,i)=>!i||v-ys[i-1]===L.cell),'Square working cells '+method);
       assert(!svg.textContent.includes('undefined')&&!svg.textContent.includes('NaN'),'All working labels valid '+method);
       if(!opts.step)assert(!svg.querySelector('[data-wm-result],[data-wm-quotient],[data-wm-rounded-answer]'),'Blank pupil grid does not reveal result');
       if(m.precision)assert(svg.querySelector('[data-wm-decimal="operand"]'),'Decimal point shown on operand');
     }
     for(const slot of WC.practiceCells(m))assert(slot.x-slot.w/2>=0&&slot.x+slot.w/2<=L.W&&slot.y-slot.h/2>=0&&slot.y+slot.h/2<=L.H&&Number.isFinite(slot.expected),'Working cell stays inside grid viewport');
   }
   let wmCases=0;
   for(const method of WM.METHODS)for(const numberType of ['whole','decimal','mixed'])for(const resultMode of method.endsWith('division')?['remainder','decimal','rounded']:['remainder'])for(let i=0;i<100;i++){
     const m=WM.generate(method,{year:6,numberType,decimalPlaces:2,resultPrecision:3,resultMode,operandDigits:3},rng);
     const actual=method==='addition'?m.a+m.b:method==='subtraction'?m.a-m.b:method.endsWith('multiplication')?m.a*m.b:m.a/m.b;
     if(method.endsWith('division')&&!m.resultMode)assert(m.answer*m.b+m.remainder===m.a&&m.remainder<m.b,'Integer division invariant');
     else if(m.resultMode==='rounded')assert(Math.abs(m.answer-actual)<=.5*10**(-m.resultPrecision)+1e-8,'Rounded quotient invariant');
     else assert(Math.abs(m.answer-actual)<1e-7,'Decimal calculation invariant');
     wmCases++;
   }
   assert(wmCases===3000,'Seeded written-method generator coverage');
   const writtenDraft=P.createDocument();
   writtenDraft.generateBlocks([
     {tool:'written-methods',settings:{year:4,numberType:'whole',operandDigits:3,exchange:'with'},types:['addition'],count:3},
     {tool:'written-methods',settings:{year:5,numberType:'decimal',decimalPlaces:2,operandDigits:2},types:['addition'],count:3},
     {tool:'written-methods',settings:{year:6,numberType:'whole',resultMode:'decimal',resultPrecision:3,operandDigits:3},types:['long-division'],count:3}
   ],rng);
   const wi=writtenDraft.list();
   assert(wi.length===9&&wi.slice(0,3).every(i=>i.data.method==='addition'&&!i.data.precision)&&wi.slice(3,6).every(i=>i.data.method==='addition'&&i.data.precision===2)&&wi.slice(6).every(i=>i.data.method==='long-division'&&i.data.resultMode==='decimal'),'Independent repeated Written Methods blocks retain their settings');
   const replaced=writtenDraft.replace(wi[3].id,rng);
   assert(replaced.data.precision===2&&replaced.data.method==='addition','Regeneration preserves original written-method recipe');
   for(const page of P.pages(writtenDraft.list(),{teacher:true})){
     const prepared=X.preparePaperSvg(page),frame=document.createElement('div');frame.className='audit-sheet';frame.appendChild(prepared);host.appendChild(frame);checkPage(prepared,'written-methods-mixed',page.getAttribute('data-worksheet-answer'));
   }
   assert(warnings.length===0&&clipping.length===0,'Mixed written-method worksheet and worked annex remain readable without clipping: '+JSON.stringify({warnings:warnings.slice(0,5),clipping:clipping.slice(0,5)}));
   for(const [method,a,b] of [['addition',999,1],['subtraction',1000,1]]){
     const m=G.writtenMethods.calculate(method,a,b),blank=G.columnMethods.diagram(m,{step:0,work:true}),solved=G.columnMethods.diagram(m,{step:m.steps.length});
     assert(!blank.querySelector('[data-wm-result],[data-wm-exchange],[data-wm-carry]'),'Pupil grid has no worked answer or exchange annotations');
     assert(solved.querySelectorAll('[data-wm-result]').length===m.result.length,'Teacher graphic contains all result digits');
     assert(solved.querySelector(method==='addition'?'[data-wm-carry]':'[data-wm-exchange]'),'Teacher diagram includes exchanges');
   }
   {
     const m=G.writtenMethods.calculate('long-multiplication',247,36),blank=G.columnMethods.diagram(m,{step:0,work:true}),solved=G.columnMethods.diagram(m,{step:m.steps.length});
     assert(!blank.querySelector('[data-wm-result],[data-wm-partial],[data-wm-carry]'),'Multiplication pupil grid has no leaked working');
     assert(solved.querySelectorAll('[data-wm-partial]').length===String(1482).length+String(7410).length,'Long multiplication shows both partial products');
     assert(solved.querySelectorAll('[data-wm-result]').length===String(8892).length,'Long multiplication shows completed sum');
   }
   for(const [method,a,b] of [['short-division',1005,5],['long-division',875,24],['long-division',9801,98]]){
     const m=G.writtenMethods.calculate(method,a,b),blank=G.columnMethods.diagram(m,{step:0,work:true}),solved=G.columnMethods.diagram(m,{step:m.steps.length});
     assert(!blank.querySelector('[data-wm-quotient],[data-wm-div-product],[data-wm-final-remainder]'),'Division pupil grid hides quotient and working');
     assert([...solved.querySelectorAll('[data-wm-quotient]')].map(n=>n.textContent).join('')===String(m.answer),'Quotient digits are correctly aligned with leading zeros omitted');
     assert(solved.querySelector('[data-wm-final-remainder]').textContent===String(m.remainder),'Teacher key includes the exact remainder');
     const spec=G.challengeKit.pupilSpec('quotient-remainder',{quotient:m.answer,remainder:m.remainder});
     assert(G.challengeKit.pupilAnswerCorrect(spec,[String(m.answer),String(m.remainder)],m.answerText),'Both division answers accepted');
     assert(!G.challengeKit.pupilAnswerCorrect(spec,[String(m.answer),String(m.remainder+1)],m.answerText),'Correct quotient alone is insufficient');
   }
   for(const [method,a,b] of [['addition',999,1],['subtraction',1000,1],['short-multiplication',247,6],['long-multiplication',247,36],['short-division',1005,5],['long-division',875,24]]){
     const m=G.writtenMethods.calculate(method,a,b),W=G.columnMethods,slots=W.practiceCells(m),values=Object.fromEntries(slots.filter(s=>!s.optional).map(s=>[s.id,String(s.expected)]));
     assert(!W.practiceReady(m,{})&&!W.practiceCorrect(m,{}),'Empty working cannot pass: '+method);
     assert(W.practiceReady(m,values)&&W.practiceCorrect(m,values),'Correct working including blank unused cells: '+method);
     const first=slots.find(s=>!s.optional);assert(!W.practiceCorrect(m,{...values,[first.id]:String(first.expected+1)}),'Wrong working cell fails: '+method);
     assert(new Set(slots.map(s=>s.id)).size===slots.length,'Distinct working cells: '+method);
   }
   const markingCases=[['fraction-wall','identify-strip','actual number of shaded parts'],['fraction-wall','denominator-misconception','equal-sized wholes'],['array-builder','multiplication-fact','rows × columns'],['clock','elapsed-forward','Both hands'],['clock','twentyfour-to-twelve','am or pm'],['number-line','missing-labels','respective boxes'],['fdp','equivalent-fraction','preserve the value'],['sequences','rule','stated rule family'],['measurement','distance-between','larger minus smaller']];
   for(const [tool,type,expected] of markingCases){const draft=P.createDocument();draft.generate(tool,P.defaultSettings(tool),1,type,rng);const item=draft.list()[0];assert(P.answerNote(item).includes(expected),'Explicit marking criteria: '+tool+'/'+type)}
   const sample='A very long marking explanation. '+('Accept all equivalent mathematical explanations using the required units and exact values. '.repeat(15))+'End of marking explanation.';
   const wrapped=X.wrapPaperText(sample,430,20,600);
   assert(wrapped.join(' ')===sample.replace(/\s+/g,' ').trim(),'Measured wrapping preserves complete text');
   const report={widgets:results,issues,clipping,smallText:warnings.slice(0,250),smallTextCount:warnings.length,smallTextByWidget:Object.fromEntries(catalog.map(({id})=>[id,warnings.filter(w=>w.tool===id).length])),smallTextByPageKind:Object.fromEntries(catalog.map(({id})=>[id,{pupil:warnings.filter(w=>w.tool===id&&w.kind==='pupil').length,annex:warnings.filter(w=>w.tool===id&&w.kind==='annex').length}])),worstTextByWidget:Object.fromEntries(catalog.map(({id})=>[id,warnings.filter(w=>w.tool===id).sort((a,b)=>a.pointSize-b.pointSize).slice(0,4)]))};
   document.getElementById('publication-report').textContent=JSON.stringify(report);
   document.getElementById('publication-status').textContent=issues.length?'FAIL':'PASS';
   document.getElementById('publication-summary').textContent=results.length+' widgets · '+results.reduce((n,r)=>n+(r.generated||0),0)+' challenge families · '+issues.length+' structural issues · '+warnings.length+' small text observations';
  }
  window.addEventListener('load',()=>{try{run()}catch(err){document.getElementById('publication-status').textContent='FAIL';document.getElementById('publication-report').textContent=JSON.stringify({issues:[err.message]})}});
 };
 fs.writeFileSync(file,'<!doctype html><html><head><meta charset="utf-8"><title>99 Club worksheet publication audit</title>'+styleTags+'<style>body{font:16px Arial,sans-serif;background:#edf1f1;margin:0;padding:24px}#tt99-goodies-root{display:none}.audit-widget{margin:24px auto;max-width:980px}.audit-sheet{width:min(100%,850px);margin:20px auto;background:white;box-shadow:0 2px 10px #0002}.audit-sheet>svg{display:block;width:100%;height:auto}#publication-report{white-space:pre-wrap;font-size:12px;overflow-wrap:anywhere} @media print{body{padding:0;background:white}.audit-sheet{break-after:page;box-shadow:none;width:100%;margin:0}.audit-widget>h2,#publication-report,#publication-summary,#publication-status,body>h1{display:none}}</style></head><body><h1>99 Club Studio — worksheet publication audit</h1><p id="publication-status">PENDING</p><p id="publication-summary"></p><div id="tt99-goodies-root"></div><div id="publication-samples"></div><pre id="publication-report"></pre>'+scriptTags+'<script>('+browser.toString()+')();</script></body></html>');
}else if(process.argv[2]==='check'){
 const html=fs.readFileSync(process.argv[3],'utf8');
 const status=html.match(/<p id="publication-status">([^<]*)<\/p>/)?.[1];
 const raw=html.match(/<pre id="publication-report">([\s\S]*?)<\/pre>/)?.[1]||'{}';
 const result=JSON.parse(raw.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'));
 fs.writeFileSync(report,JSON.stringify(result,null,2));
 console.log('Publication audit:',status, result.widgets?.length||0,'widgets;',result.smallTextCount||0,'small text observations');
 console.log(JSON.stringify({widgets:result.widgets||[],smallTextByWidget:result.smallTextByWidget,smallTextByPageKind:result.smallTextByPageKind,worstTextByWidget:result.worstTextByWidget,clipping:result.clipping},null,2));
 if(status!=='PASS'){console.error(JSON.stringify(result.issues||['Browser audit did not complete'],null,2));process.exitCode=1}
}else throw Error('Use prepare or check');
