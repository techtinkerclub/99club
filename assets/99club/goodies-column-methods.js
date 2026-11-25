/* Column-method classroom diagrams and document adapters.
   The pure writtenMethods engine is the sole source of calculation steps. */
(function(G){
'use strict';
if(!G||!G.writtenMethods)return;
const M=G.writtenMethods,{q,qa,esc,field,btn,setPanels}=G;
const LABEL={addition:'Column addition',subtraction:'Column subtraction',multiplication:'Written multiplication','short-multiplication':'Short multiplication','long-multiplication':'Long multiplication',division:'Written division','short-division':'Short division','long-division':'Long division'};
const IDS={addition:'column-addition',subtraction:'column-subtraction',multiplication:'written-multiplication',division:'written-division'};
const EXCHANGES=[['any','Mixed'],['with','With exchanges'],['without','Without exchanges'],['across-zero','Across zero']];
const digits=n=>String(n).split('').reverse().map(Number);
function multiplicationDiagram(model,{step=0,grid=true,labels=true,work=false}={}){
 const {a,b,method,steps}=model,A=digits(a),B=digits(b),long=method==='long-multiplication',cols=A.length+B.length,cell=90,W=Math.max(480,(cols+1)*cell+52),H=long?510:330,left=W-30-cols*cell;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 const attrs=(n,a)=>{Object.entries(a).forEach(([k,v])=>n.setAttribute(k,String(v)));return n};
 attrs(svg,{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':LABEL[method]+' working'});
 function add(tag,a,text){const n=attrs(document.createElementNS('http://www.w3.org/2000/svg',tag),a);if(text!==undefined)n.textContent=String(text);svg.appendChild(n);return n}
 const text=(x,y,v,size=46,extra={})=>add('text',{x,y,'font-family':'Arial,sans-serif','font-size':size,'font-weight':600,'text-anchor':'middle',fill:'#24343b',...extra},v);
 const x=i=>left+(cols-i-.5)*cell, line=(y,strong=false)=>add('line',{x1:left-5,x2:W-28,y1:y,y2:y,stroke:strong?'#24343b':'#d8e3e1','stroke-width':strong?3:1});
 const seen=steps.slice(0,Math.max(0,Math.min(steps.length,step))),current=seen.at(-1);
 add('rect',{width:W,height:H,fill:'#fff'});
 const active=current?.column??current?.sumStep?.column;
 if(!work&&active!==undefined)add('rect',{x:x(active)-cell/2+2,y:40,width:cell-4,height:H-62,rx:7,fill:'#e7f4f0'});
 if(labels)for(let i=0;i<cols;i++)text(x(i),30,['O','T','H','Th','TTh','HTh','M'][i],22,{fill:'#526970'});
 if(grid){for(let i=0;i<=cols;i++)add('line',{x1:left+i*cell,x2:left+i*cell,y1:40,y2:H-18,stroke:'#d8e3e1','stroke-width':1});for(const y of long?[40,110,180,250,315,380,440,492]:[40,110,180,250,312])line(y)}
 A.forEach((v,i)=>text(x(i),158,v,46,{'data-wm-operand':'a'}));B.forEach((v,i)=>text(x(i),225,v,46,{'data-wm-operand':'b'}));text(left-34,225,'×',40);line(246,true);
 const partials=[],carryRows=[];
 for(const s of seen){
   if(s.partial)partials[s.row]=s.partial;
   if(s.carries)carryRows[s.row]=s.carries;
 }
 for(let j=0;j<partials.length;j++){
   const row=partials[j]||[];row.forEach((v,i)=>{if(v!=null)text(x(i),294+j*65,v,46,{fill:'#23675d',[long?'data-wm-partial':'data-wm-result']:j,'data-wm-column':i})});
 }
 // Show carries for the active multiplication row only; preserve final
 // partial products for the later addition rather than mixing carry systems.
 const cr=current?.type==='sum-products'?null:carryRows[current?.row??0];
 if(cr)cr.forEach((v,i)=>{if(v&&i+(current?.row??0)<cols)text(x(i+(current?.row??0)),90,v,30,{fill:'#915638','data-wm-carry':i})});
 if(long){
   text(left-34,360,'+',34);line(378,true);
   const sum=current?.type==='sum-products'?current.sumStep:null;
   if(sum?.carries)sum.carries.forEach((v,i)=>{if(v)text(x(i),405,v,28,{fill:'#915638','data-wm-sum-carry':i})});
   line(421);
   if(sum?.result)sum.result.forEach((v,i)=>{if(v!=null)text(x(i),466,v,46,{fill:'#23675d','data-wm-result':i})});
 }
 return svg;
}
function divisionDiagram(model,{step=0,grid=true,labels=true,work=false}={}){
 const {a,b,method,steps}=model,long=method==='long-division',A=String(a).split(''),cols=A.length,cell=82,left=170,W=Math.max(580,left+cols*cell+150),H=long?240+cols*132:340;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 const attrs=(n,a)=>{Object.entries(a).forEach(([k,v])=>n.setAttribute(k,String(v)));return n};
 attrs(svg,{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':LABEL[method]+' working'});
 function add(tag,a,text){const n=attrs(document.createElementNS('http://www.w3.org/2000/svg',tag),a);if(text!==undefined)n.textContent=String(text);svg.appendChild(n);return n}
 const text=(x,y,v,size=43,extra={})=>add('text',{x,y,'font-family':'Arial,sans-serif','font-size':size,'font-weight':600,'text-anchor':'middle',fill:'#24343b',...extra},v);
 const x=i=>left+(i+.5)*cell,right=left+cols*cell;
 const line=(x1,y1,x2,y2,strong=false)=>add('line',{x1,y1,x2,y2,stroke:strong?'#24343b':'#d8e3e1','stroke-width':strong?3:1});
 const seen=steps.slice(0,Math.max(0,Math.min(steps.length,step))),current=seen.at(-1),complete=seen.length===steps.length;
 add('rect',{width:W,height:H,fill:'#fff'});
 if(!work&&current)add('rect',{x:x(current.index)-cell/2+2,y:42,width:cell-4,height:H-76,rx:6,fill:'#e7f4f0'});
 if(labels)for(let i=0;i<cols;i++)text(x(i),30,['O','T','H','Th'][cols-1-i],21,{fill:'#526970'});
 if(grid){for(let i=0;i<=cols;i++)line(left+i*cell,42,left+i*cell,H-64);for(let y=42;y<=H-64;y+=66)line(left,y,right,y)}
 text(left-45,169,b,43,{'data-wm-divisor':'1'});
 add('path',{d:'M '+(left-8)+' 188 L '+(left-8)+' 110 L '+(right+5)+' 110',fill:'none',stroke:'#24343b','stroke-width':3,'stroke-linejoin':'round'});
 A.forEach((n,i)=>text(x(i),169,n,43,{'data-wm-dividend':i}));
 // Initial quotient zeros may be omitted; interior zeros must stay visible.
 const first=seen.findIndex(s=>s.digit!==0);
 for(const s of seen){
   if((first>=0&&s.index>=first)||(complete&&s.index===cols-1))text(x(s.index),92,s.digit,43,{fill:'#23675d','data-wm-quotient':s.index});
 }
 if(!long){
   for(const s of seen)if(s.incoming)text(x(s.index)-25,134,s.incoming,25,{fill:'#915638','data-wm-remainder-carry':s.index});
 }else{
   // Start written subtraction at the first usable partial dividend.
   // Every following row is aligned with the next dividend digit.
   let row=0;
   for(const s of seen){
     if(s.index<(first<0?cols-1:first))continue;
     const y=220+row*132;
     const number=(n,yy,attr)=>String(n).split('').reverse().forEach((v,i)=>text(x(s.index-i),yy,v,36,{[attr]:s.index}));
     number(s.dividend,y,'data-wm-partial-dividend');
     number(s.product,y+48,'data-wm-div-product');
     text(left-38,y+48,'−',30);
     line(Math.max(left,x(s.index-String(s.dividend).length+1)-cell/2),y+58,x(s.index)+cell/2,y+58,true);
     number(s.remainder,y+96,'data-wm-div-remainder');
     row++;
   }
 }
 text(W-70,92,'r',28,{fill:'#526970'});
 add('rect',{x:W-48,y:48,width:42,height:57,rx:4,fill:'none',stroke:'#a8bdb9','stroke-width':1.5});
 if(complete)text(W-27,89,model.remainder,30,{fill:'#23675d','data-wm-final-remainder':'1'});
 if(work)text(W/2,H-19,long?'Show each subtraction and bring down the next digit.':'Write the quotient and carried remainders.',20,{fill:'#526970'});
 return svg;
}
function diagram(model,{step=0,grid=true,labels=true,work=false}={}){
 if(model.method.endsWith('division'))return divisionDiagram(model,{step,grid,labels,work});
 if(model.method.endsWith('multiplication'))return multiplicationDiagram(model,{step,grid,labels,work});
 const {a,b,method,steps,width}=model,shown=Math.max(0,Math.min(steps.length,step)),current=steps[shown-1],A=digits(a),B=digits(b);
 // Reserve a possible extra place before showing any result; the blank grid
 // must not reveal whether the addition actually produces a carry.
 const cols=width+(method==='addition'?1:0),cell=90,W=Math.max(480,(cols+1)*cell+52),H=work?410:330,left=W-30-cols*cell;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 const attrs=(n,a)=>{Object.entries(a).forEach(([k,v])=>n.setAttribute(k,String(v)));return n};
 attrs(svg,{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':LABEL[method]+' working'});
 function add(tag,a,text){const n=attrs(document.createElementNS('http://www.w3.org/2000/svg',tag),a);if(text!==undefined)n.textContent=String(text);svg.appendChild(n);return n}
 const text=(x,y,v,size=46,extra={})=>add('text',{x,y,'font-family':'Arial,sans-serif','font-size':size,'font-weight':600,'text-anchor':'middle',fill:'#24343b',...extra},v);
 const x=i=>left+(cols-i-.5)*cell;
 add('rect',{width:W,height:H,fill:'#fff'});
 const active=current?.column??current?.to;
 if(!work&&active!==undefined)add('rect',{x:x(active)-cell/2+2,y:42,width:cell-4,height:258,rx:7,fill:'#e7f4f0'});
 const placeShort=['O','T','H','Th','TTh','HTh','M','TM'];
 if(labels)for(let i=0;i<cols;i++)text(x(i),30,placeShort[i],20,{fill:'#526970','data-wm-place':i});
 if(grid)for(let i=0;i<=cols;i++)add('line',{x1:left+i*cell,x2:left+i*cell,y1:40,y2:work?365:300,stroke:'#d8e3e1','stroke-width':1});
 if(grid)for(const y of [40,110,180,250,work?365:300])add('line',{x1:left,x2:W-30,y1:y,y2:y,stroke:'#d8e3e1','stroke-width':1});
 text(left-34,225,method==='addition'?'+':'−',40);
 for(let i=0;i<A.length;i++){
   text(x(i),158,A[i],46,{'data-wm-operand':'a','data-wm-column':i});
   if(method==='subtraction'&&current?.top&&current.top[i]!==A[i]){
     add('line',{x1:x(i)-20,x2:x(i)+20,y1:144,y2:144,stroke:'#915638','stroke-width':3});
     text(x(i),91,current.top[i],32,{fill:'#915638','data-wm-exchange':i});
   }
 }
 for(let i=0;i<B.length;i++)text(x(i),225,B[i],46,{'data-wm-operand':'b','data-wm-column':i});
 add('line',{x1:left-5,x2:W-28,y1:246,y2:246,stroke:'#24343b','stroke-width':3});
 if(method==='addition'&&current?.carries)current.carries.forEach((v,i)=>{if(v)text(x(i),91,v,32,{fill:'#915638','data-wm-carry':i})});
 if(current?.result)current.result.forEach((v,i)=>{if(v!==undefined&&v!==null)text(x(i),290,v,46,{fill:'#23675d','data-wm-result':i})});
 if(work)text(W/2,395,'Show exchanges above the digits.',21,{fill:'#526970'});
 return svg;
}
function paper(model,teacher){return G.exportTools.composeWorksheetCardSvg(diagram(model,{step:teacher?model.steps.length:0,work:!teacher}),{title:LABEL[model.method],prompt:'Calculate '+model.a+' '+(model.method==='addition'?'+':model.method==='subtraction'?'−':model.method.endsWith('division')?'÷':'×')+' '+model.b+' using the '+((model.method.endsWith('multiplication')||model.method.endsWith('division'))?LABEL[model.method].toLowerCase():'column method')+'. Show your working.',responseMode:'none',paperStyle:'plain',answer:model.answerText,showAnswer:teacher,diagramMaxHeight:600})}
function generationTypes(method,settings={}){if(['multiplication','division'].includes(method))return M.available(settings).filter(v=>v.endsWith(method)).map(id=>({id,label:LABEL[id]}));return EXCHANGES.filter(([id])=>id!=='across-zero'||method==='subtraction').map(([id,label])=>({id,label}))}
function generate(method,settings,type,rng=Math.random){if(['multiplication','division'].includes(method)){const ids=generationTypes(method,settings).map(t=>t.id),choice=type==='all'?ids[Math.floor(rng()*ids.length)]:type;return {...M.generate(choice,settings,rng),type:choice}}return {...M.generate(method,{...settings,exchange:type==='all'?'any':type},rng),type:type==='all'?'any':type}}
for(const method of Object.keys(IDS)){
 const id=IDS[method];
 if(G.publishing)G.publishing.register(id,{
  label:LABEL[method],types:model=>generationTypes(method,model.settings||model),title:item=>LABEL[method],
  signature:d=>d.method+':'+d.a+':'+d.b,
  recipe:(model,type)=>({type,settings:M.settings(model.settings||model)}),
  generate(recipe,rng){return generate(method,recipe.settings,recipe.type,rng)},
  capture(saved){const m=M.calculate(['multiplication','division'].includes(method)?saved.method:method,saved.a,saved.b);if(saved.task)return [G.publishing.record(id,'challenge',{...m,type:saved.task.type},{type:saved.task.type,settings:M.settings(saved.settings)})];return [G.publishing.record(id,'diagram',{...m,shown:saved.shown,grid:saved.grid,labels:saved.labels})]},
  render(item,teacher){return item.kind==='challenge'?paper(item.data,teacher):diagram(item.data,{step:item.data.shown,grid:item.data.grid,labels:item.data.labels})},
  answerSummary:item=>item.data.method.endsWith('division')?item.data.answer+' remainder '+item.data.remainder:String(item.data.answer),
  answerGraphic:item=>diagram(item.data,{step:item.data.steps.length}),
  answerNote:item=>method==='division'?'Require the correct quotient and remainder (zero for exact division). Check the place-value alignment and each regrouping or subtraction; the remainder must be smaller than the divisor. Accept equivalent valid written working.':method==='multiplication'?(item.data.method==='long-multiplication'?'Check both partial products, including the tens-place shift, and their sum. Accept equivalent valid written methods.':'Check each digit product, carries and final product. Accept equivalent valid working.'):method==='addition'?'Check place-value alignment, correct exchanges and the final sum. Equivalent valid written working is acceptable.':'Check place-value alignment, exchanges (including through zero if needed) and the final difference. Equivalent valid written working is acceptable.'
 });
}
G.columnMethods={diagram,paper};
G.columnMethodTool=function(method){
 const id=IDS[method],CK=G.challengeKit,X=G.exportTools;
 const multiply=method==='multiplication',divide=method==='division',multi=multiply||divide;
 let model=divide?M.calculate('long-division',875,24):multiply?M.calculate('long-multiplication',247,36):M.calculate(method,method==='addition'?368:1002,method==='addition'?457:586),shown=0,grid=true,labels=true,workflow='build',settings=M.settings({year:divide?6:multiply?5:4}),task=null,status='',setup=null;
 const option=(v,label,current)=>'<option value="'+esc(v)+'"'+(String(v)===String(current)?' selected':'')+'>'+esc(label)+'</option>';
 const select=(name,values,current)=>'<select class="gd-select" data-wm-setting="'+name+'">'+values.map(([v,l])=>option(v,l,current)).join('')+'</select>';
 const remainderOptions=[['any','Mixed'],['exact','Exact division'],['with','With remainders']];
 function controls(){
  const tabs='<div class="gd-row gd-wm-tabs" role="tablist" aria-label="Written calculation workflow">'+[['build','Explore'],['challenge','Challenge'],['export','Export']].map(([v,l])=>'<button type="button" class="gd-btn'+(workflow===v?' gd-btn--primary':'')+'" data-wm-workflow="'+v+'">'+l+'</button>').join('')+'</div>';
  if(workflow==='export')return tabs+'<div class="gd-row">'+btn('Copy image','wm-copy')+btn('PNG','wm-png')+btn('SVG','wm-svg')+btn('Print / PDF','wm-print')+'</div>'+(task?'<div class="gd-row">'+btn('Print answer key','wm-key-print')+'</div>':'')+'<p class="gd-help" id="wm-status">'+esc(status)+'</p>';
  if(workflow==='challenge')return tabs+field('Year group',select('year',[[3,'Year 3'],[4,'Year 4'],[5,'Year 5'],[6,'Year 6']],settings.year))+(divide?field('Remainders',select('remainders',remainderOptions,settings.remainders)):'')+CK.nativeRandomHtml('wm',[{id:'practice',label:'Practice',ids:generationTypes(method,settings).map(t=>t.id)}])+generationTypes(method,settings).map(t=>'<button type="button" class="gd-btn" data-wm-challenge-mode="'+t.id+'">'+esc(t.label)+'</button>').join('')+'<p class="gd-help">Choose a question type. Pupils can enter their answer using the on-screen keypad.</p>';
  return tabs+(multi?field('Method',select('method',divide?[['short-division','Short division'],['long-division','Long division']]:[['short-multiplication','Short multiplication'],['long-multiplication','Long multiplication']],model.method)):'')+field(divide?'Dividend':'First number','<input class="gd-input" type="number" min="0" max="9999999" inputmode="numeric" id="wm-a" value="'+model.a+'">')+field(divide?'Divisor':'Second number','<input class="gd-input" type="number" min="0" max="9999999" inputmode="numeric" id="wm-b" value="'+model.b+'">')+'<div class="gd-row">'+btn('Apply numbers','wm-apply')+btn('New example','wm-new')+'</div>'+field('Year group',select('year',[[3,'Year 3'],[4,'Year 4'],[5,'Year 5'],[6,'Year 6']],settings.year))+ (divide?field('Remainders',select('remainders',remainderOptions,settings.remainders)):multiply?'':field('Exchanges',select('exchange',EXCHANGES.filter(([v])=>v!=='across-zero'||method==='subtraction'),settings.exchange)))+'<label class="gd-wm-toggle"><input type="checkbox" data-wm-display="grid"'+(grid?' checked':'')+'> Place-value grid</label><label class="gd-wm-toggle"><input type="checkbox" data-wm-display="labels"'+(labels?' checked':'')+'> Column headings</label><p class="gd-help" id="wm-status" role="status">'+esc(status)+'</p>';
 }
 function launch(type){
  if(!task)setup={a:model.a,b:model.b,method:model.method,shown};
  const before=model.a+':'+model.b;for(let i=0;i<12;i++){model=generate(method,settings,type);if(model.a+':'+model.b!==before)break}
  task=CK.normalise({mode:'standard',type:model.type,title:LABEL[model.method],prompt:'Calculate using '+(multi?LABEL[model.method].toLowerCase():'the column method')+(divide?' Give the quotient and remainder (0 if exact).':'')+'.',answer:divide?model.answer+' r '+model.remainder:String(model.answer),answerMode:'manual',revealed:false});shown=0;workflow='challenge';renderControls();renderStage();
 }
 function exit(){if(setup){model=M.calculate(multi?setup.method:method,setup.a,setup.b);shown=setup.shown}task=null;setup=null;workflow='build';renderControls();renderStage()}
 function renderStage(){
  const stage=q('#gd-stage');
  if(task){
   stage.innerHTML=CK.bannerHtml(task,{pupil:divide?CK.pupilSpec('quotient-remainder',{quotient:model.answer,remainder:model.remainder}):CK.pupilSpec('number'),actions:[{action:'another',label:'Another'},{action:'end',label:'Exit challenge'}]})+'<div class="gd-wm-diagram"></div>';
   q('.gd-wm-diagram',stage).appendChild(diagram(model,{step:task.revealed?model.steps.length:0,grid,labels}));
   q('[data-challenge-action="another"]',stage).onclick=()=>launch(generationTypes(method,settings).some(t=>t.id===task.type)?task.type:'all');
   q('[data-challenge-action="end"]',stage).onclick=exit;
   const reveal=q('[data-board-action="reveal"]',stage);if(reveal)reveal.onclick=()=>{task.revealed=!task.revealed;renderStage()};
   return;
  }
  const max=model.steps.length,explanation=shown?model.steps[shown-1].explanation:(divide?'Start at the highest place. Divide, then regroup any remainder into the next place.':'Align the digits by place value. Start in the ones column.');
  stage.innerHTML='<div class="gd-wm-stage"><div class="gd-wm-diagram"></div><div class="gd-wm-explanation" aria-live="polite">'+esc(explanation)+'</div><div class="gd-wm-actions"><button class="gd-btn" data-wm-step="reset"'+(shown===0?' disabled':'')+'>Reset</button><button class="gd-btn" data-wm-step="previous"'+(shown===0?' disabled':'')+'>← Back</button><span class="gd-wm-progress">'+shown+' / '+max+'</span><button class="gd-btn gd-btn--primary" data-wm-step="next"'+(shown===max?' disabled':'')+'>Next →</button><button class="gd-btn" data-wm-step="all"'+(shown===max?' disabled':'')+'>Show all</button></div></div>';
  q('.gd-wm-diagram',stage).appendChild(diagram(model,{step:shown,grid,labels}));
  qa('[data-wm-step]',stage).forEach(el=>el.onclick=()=>{shown=el.dataset.wmStep==='reset'?0:el.dataset.wmStep==='previous'?Math.max(0,shown-1):el.dataset.wmStep==='next'?Math.min(max,shown+1):max;renderStage()});
 }
 function message(s){status=s;const el=q('#wm-status');if(el)el.textContent=s}
 async function exportAction(kind){try{const teacher=kind.startsWith('key-');if(teacher&&!task)return;const svg=task?paper(model,teacher):diagram(model,{step:shown,grid,labels});if(kind==='copy')await X.copyPng(svg);else if(kind==='png')await X.downloadPng(svg,id,2);else if(kind==='svg')X.downloadSvg(svg,id);else X.printSvg(svg,{title:'',landscape:false});message('Export ready.')}catch(e){message(e.message||'Export failed.')}}
 function renderControls(){
  const root=q('#gd-controls');root.innerHTML=controls();
  qa('[data-wm-workflow]',root).forEach(el=>el.onclick=()=>{workflow=el.dataset.wmWorkflow;if(workflow==='build'&&task){exit();return}renderControls()});
  qa('[data-wm-setting]',root).forEach(el=>el.onchange=()=>{if(el.dataset.wmSetting==='method'){const target=el.value;model=M.calculate(target,Math.min(model.a,9999),target.startsWith('short-')?Math.max(divide?1:0,Math.min(9,model.b)):Math.max(10,Math.min(99,model.b)));shown=0;renderStage()}else settings=M.settings({...settings,[el.dataset.wmSetting]:el.value});renderControls()});
  qa('[data-wm-display]',root).forEach(el=>el.onchange=()=>{if(el.dataset.wmDisplay==='grid')grid=el.checked;else labels=el.checked;renderStage()});
  qa('[data-wm-challenge-mode]',root).forEach(el=>el.onclick=()=>launch(el.dataset.wmChallengeMode));
  const apply=q('#wm-apply',root);if(apply)apply.onclick=()=>{try{const a=q('#wm-a').value,b=q('#wm-b').value;if(a===''||b==='')throw Error('Enter both numbers.');model=M.calculate(model.method,Number(a),Number(b));shown=0;status='';renderControls();renderStage()}catch(e){message(e.message)}};
  const next=q('#wm-new',root);if(next)next.onclick=()=>{try{model=multi?generate(method,settings,generationTypes(method,settings).some(t=>t.id===model.method)?model.method:'all'):M.generate(method,settings);shown=0;status='';renderControls();renderStage()}catch(e){message(e.message)}};
  for(const kind of ['copy','png','svg','print',...(task?['key-print']:[])]){let el=q('#wm-'+kind,root);if(!el){el=document.createElement('button');el.type='button';el.hidden=true;root.appendChild(el)}el.setAttribute('data-gd-direct-export',kind);el.onclick=()=>exportAction(kind)}
 }
 setPanels('','');renderControls();renderStage();
 G.lessonState.register(id,()=>({a:model.a,b:model.b,method:model.method,shown,grid,labels,workflow,settings,task,setup,pupil:CK.capturePupil(task)}),saved=>{model=M.calculate(multi?saved.method:method,saved.a,saved.b);shown=Math.max(0,Math.min(model.steps.length,Number(saved.shown)||0));grid=saved.grid!==false;labels=saved.labels!==false;workflow=['build','challenge','export'].includes(saved.workflow)?saved.workflow:'build';settings=M.settings(saved.settings);task=saved.task?CK.normalise({...saved.task,answer:divide?model.answer+' r '+model.remainder:String(model.answer)}):null;setup=saved.setup||null;CK.restorePupil(task,saved.pupil);renderControls();renderStage()});
};
})(window.TT99Goodies);
