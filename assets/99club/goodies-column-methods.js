/* Column-method classroom diagrams and document adapters.
   The pure writtenMethods engine is the sole source of calculation steps. */
(function(G){
'use strict';
if(!G||!G.writtenMethods)return;
const M=G.writtenMethods,{q,qa,esc,field,btn,setPanels}=G;
const LABEL={all:'Written Methods',addition:'Column addition',subtraction:'Column subtraction',multiplication:'Written multiplication','short-multiplication':'Short multiplication','long-multiplication':'Long multiplication',division:'Written division','short-division':'Short division','long-division':'Long division'};
const IDS={all:'written-methods',addition:'column-addition',subtraction:'column-subtraction',multiplication:'written-multiplication',division:'written-division'};
const EXCHANGES=[['any','Mixed'],['with','With exchanges'],['without','Without exchanges'],['across-zero','Across zero']];
const digits=n=>String(n).split('').reverse().map(Number);
const operandDigits=(m,k)=>m['operand'+k]||digits(m[k.toLowerCase()]);
const precision=m=>Number(m.precision)||0;
const decimalDivision=m=>m.method.endsWith('division')&&['decimal','rounded'].includes(m.resultMode);
const shortPlace=i=>i<0?['t','h','th'][-i-1]||'10⁻'+(-i):['O','T','H','Th','TTh','HTh','M','TM','HM'][i]||'10^'+i;
const operandText=(m,k)=>m[k+'Text']??String(m[k]);
const divisionFirst=m=>{const a=m.inputDigits||String(m.a).split('').map(Number),last=(m.wholePlaces||a.length)-1;let prefix=0;for(let i=0;i<=last;i++){prefix=prefix*10+a[i];if(prefix>=m.b||i===last)return i}return last};
const answerLabel=m=>decimalDivision(m)?m.answerText:m.method.endsWith('division')?m.answer+' r '+m.remainder:m.answerText;
// Shared square grid geometry, used by every renderer and every input overlay.
// Coordinates are in SVG user units, independent of display or print scale.
function layout(model){
 const {a,b,method,width}=model,A=operandDigits(model,'A'),B=operandDigits(model,'B'),division=method.endsWith('division'),mult=method.endsWith('multiplication'),long=method.startsWith('long-'),cell=82,top=42;
 const cols=division?(model.inputDigits?.length||A.length):mult?A.length+B.length:width+(method==='addition'?1:0);
 const left=division?164:82,right=left+cols*cell;
 const rows=division?(long?2+2*(cols-divisionFirst(model))+1:3):mult&&long?7:4;
 const bottom=top+rows*cell,W=right+(division&&!decimalDivision(model)?126:24),H=bottom+(model.resultMode==='rounded'?76:34);
 const x=i=>division?left+(i+.5)*cell:right-(i+.5)*cell,y=row=>top+(row+.5)*cell;
 return {cols,cell,top,left,right,bottom,rows,W,H,x,y,baseline:(row,size=46)=>y(row)+size*.34};
}
function gridLines(add,L){
 for(let i=0;i<=L.cols;i++)add('line',{x1:L.left+i*L.cell,x2:L.left+i*L.cell,y1:L.top,y2:L.bottom,stroke:'#d8e3e1','stroke-width':1,'data-wm-grid':'vertical'});
 for(let i=0;i<=L.rows;i++)add('line',{x1:L.left,x2:L.right,y1:L.top+i*L.cell,y2:L.top+i*L.cell,stroke:'#d8e3e1','stroke-width':1,'data-wm-grid':'horizontal'});
}
function multiplicationDiagram(model,{step=0,grid=true,labels=true,work=false}={}){
 const {a,b,method,steps}=model,A=operandDigits(model,'A'),B=operandDigits(model,'B'),long=method==='long-multiplication',L=layout(model),{cols,cell,W,H,left,right,x,y,baseline}=L;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 const attrs=(n,a)=>{Object.entries(a).forEach(([k,v])=>n.setAttribute(k,String(v)));return n};
 attrs(svg,{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':LABEL[method]+' working'});
 function add(tag,a,text){const n=attrs(document.createElementNS('http://www.w3.org/2000/svg',tag),a);if(text!==undefined)n.textContent=String(text);svg.appendChild(n);return n}
 const text=(x,y,v,size=46,extra={})=>add('text',{x,y,'font-family':'Arial,sans-serif','font-size':size,'font-weight':600,'text-anchor':'middle',fill:'#24343b',...extra},v);
 const line=(yy,strong=false)=>add('line',{x1:left-5,x2:right+4,y1:yy,y2:yy,stroke:strong?'#24343b':'#d8e3e1','stroke-width':strong?3:1});
 const seen=steps.slice(0,Math.max(0,Math.min(steps.length,step))),current=seen.at(-1);
 add('rect',{width:W,height:H,fill:'#fff'});
 const active=current?.column??current?.sumStep?.column;
 if(!work&&active!==undefined)add('rect',{x:x(active)-cell/2+2,y:40,width:cell-4,height:H-62,rx:7,fill:'#e7f4f0'});
 if(labels)for(let i=0;i<cols;i++)text(x(i),30,shortPlace(i-precision(model)),22,{fill:'#526970'});
 if(grid)gridLines(add,L);
 A.forEach((v,i)=>text(x(i),baseline(1),v,46,{'data-wm-operand':'a'}));B.forEach((v,i)=>text(x(i),baseline(2),v,46,{'data-wm-operand':'b'}));text(left-40,baseline(2,40),'×',40);line(L.top+3*cell,true);
 const p=precision(model),dot=p?x(p)+cell/2:null;
 if(p)text(dot,baseline(1),'.',40,{'data-wm-decimal':'operand'});
 const partials=[],carryRows=[];
 for(const s of seen){
   if(s.partial)partials[s.row]=s.partial;
   if(s.carries)carryRows[s.row]=s.carries;
 }
 for(let j=0;j<partials.length;j++){
   const row=partials[j]||[];row.forEach((v,i)=>{if(v!=null)text(x(i),baseline(3+j),v,46,{fill:'#23675d',[long?'data-wm-partial':'data-wm-result']:j,'data-wm-column':i})});
 }
 // Show carries for the active multiplication row only; preserve final
 // partial products for the later addition rather than mixing carry systems.
 const cr=current?.type==='sum-products'?null:carryRows[current?.row??0];
 if(cr)cr.forEach((v,i)=>{if(v&&i+(current?.row??0)<cols)text(x(i+(current?.row??0)),baseline(0,30),v,30,{fill:'#915638','data-wm-carry':i})});
 if(long){
   text(left-40,baseline(4,34),'+',34);line(L.top+5*cell,true);
   const sum=current?.type==='sum-products'?current.sumStep:null;
   if(sum?.carries)sum.carries.forEach((v,i)=>{if(v)text(x(i),baseline(5,28),v,28,{fill:'#915638','data-wm-sum-carry':i})});

   if(sum?.result)(seen.length===steps.length&&p?model.result:sum.result).forEach((v,i)=>{if(v!=null)text(x(i),baseline(6),v,46,{fill:'#23675d','data-wm-result':i})});
 }
 if(p){if(!long&&seen.length===steps.length&&model.result.length>(partials[0]?.length||0))for(let i=partials[0]?.length||0;i<model.result.length;i++)text(x(i),baseline(3),model.result[i],46,{fill:'#23675d','data-wm-result':i});text(dot,baseline(long?6:3),'.',40,{'data-wm-decimal':'answer'});}
 return svg;
}
function divisionDiagram(model,{step=0,grid=true,labels=true,work=false}={}){
 const {a,b,method,steps}=model,long=method==='long-division',A=model.inputDigits||String(a).split(''),L=layout(model),{cols,cell,left,right,W,H,x,y,baseline}=L;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 const attrs=(n,a)=>{Object.entries(a).forEach(([k,v])=>n.setAttribute(k,String(v)));return n};
 attrs(svg,{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':LABEL[method]+' working'});
 function add(tag,a,text){const n=attrs(document.createElementNS('http://www.w3.org/2000/svg',tag),a);if(text!==undefined)n.textContent=String(text);svg.appendChild(n);return n}
 const text=(x,y,v,size=43,extra={})=>add('text',{x,y,'font-family':'Arial,sans-serif','font-size':size,'font-weight':600,'text-anchor':'middle',fill:'#24343b',...extra},v);

 const line=(x1,y1,x2,y2,strong=false)=>add('line',{x1,y1,x2,y2,stroke:strong?'#24343b':'#d8e3e1','stroke-width':strong?3:1});
 const seen=steps.slice(0,Math.max(0,Math.min(steps.length,step))),current=seen.at(-1),complete=seen.length===steps.length;
 add('rect',{width:W,height:H,fill:'#fff'});
 if(!work&&current)add('rect',{x:x(current.index)-cell/2+2,y:42,width:cell-4,height:H-76,rx:6,fill:'#e7f4f0'});
 if(labels)for(let i=0;i<cols;i++)text(x(i),30,shortPlace((model.wholePlaces||cols)-1-i),21,{fill:'#526970'});
 if(grid)gridLines(add,L);
 text(left-55,baseline(1,43),b,43,{'data-wm-divisor':'1'});
 add('path',{d:'M '+(left-8)+' '+(L.top+2*cell)+' L '+(left-8)+' '+(L.top+cell)+' L '+(right+5)+' '+(L.top+cell),fill:'none',stroke:'#24343b','stroke-width':3,'stroke-linejoin':'round'});
 A.forEach((n,i)=>text(x(i),baseline(1,43),n,43,{'data-wm-dividend':i}));
 // Initial quotient zeros may be omitted; interior zeros must stay visible.
 const first=divisionFirst(model);if(decimalDivision(model)){const dot=x(model.wholePlaces-1)+cell/2;text(dot,baseline(1,43),'.',40,{'data-wm-decimal':'operand'});text(dot,baseline(0,43),'.',40,{'data-wm-decimal':'answer'})}
 for(const s of seen){
   if(s.index>=first)text(x(s.index),baseline(0,43),s.digit,43,{fill:'#23675d','data-wm-quotient':s.index});
 }
 if(!long){
   for(const s of seen)if(s.incoming)text(x(s.index)-25,L.top+cell+21,s.incoming,25,{fill:'#915638','data-wm-remainder-carry':s.index});
 }else{
   // Start written subtraction at the first usable partial dividend.
   // Every following row is aligned with the next dividend digit.
   let row=0;
   for(const s of seen){
     if(s.index<first)continue;
     const yy=baseline(2+row*2,36);
     const number=(n,yy,attr)=>String(n).split('').reverse().forEach((v,i)=>text(x(s.index-i),yy,v,36,{[attr]:s.index,'data-wm-column':s.index-i}));
     if(row)number(s.dividend,yy-cell,'data-wm-partial-dividend');
     number(s.product,yy,'data-wm-div-product');
     text(left-38,yy,'−',30);
     line(Math.max(left,x(s.index-String(s.dividend).length+1)-cell/2),L.top+(3+row*2)*cell,x(s.index)+cell/2,L.top+(3+row*2)*cell,true);
     if(s===current)number(s.remainder,yy+cell,'data-wm-div-remainder');
     row++;
   }
 }
 if(!decimalDivision(model)){text(W-85,baseline(0,28),'r',28,{fill:'#526970'});add('rect',{x:W-65,y:L.top+12,width:54,height:58,rx:4,fill:'none',stroke:'#a8bdb9','stroke-width':1.5});if(complete)text(W-38,baseline(0,30),model.remainder,30,{fill:'#23675d','data-wm-final-remainder':'1'})}else if(complete&&model.resultMode==='rounded')text(W/2,H-39,'Rounded to '+model.resultPrecision+' d.p.: '+model.answerText,27,{fill:'#23675d','data-wm-rounded-answer':'1'});
 
 return svg;
}
function diagram(model,{step=0,grid=true,labels=true,work=false}={}){
 if(model.method.endsWith('division'))return divisionDiagram(model,{step,grid,labels,work});
 if(model.method.endsWith('multiplication'))return multiplicationDiagram(model,{step,grid,labels,work});
 const {a,b,method,steps,width}=model,shown=Math.max(0,Math.min(steps.length,step)),current=steps[shown-1],A=operandDigits(model,'A'),B=operandDigits(model,'B');
 // Reserve a possible extra place before showing any result; the blank grid
 // must not reveal whether the addition actually produces a carry.
 const L=layout(model),{cols,cell,W,H,left,right,x,y,baseline}=L;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 const attrs=(n,a)=>{Object.entries(a).forEach(([k,v])=>n.setAttribute(k,String(v)));return n};
 attrs(svg,{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':LABEL[method]+' working'});
 function add(tag,a,text){const n=attrs(document.createElementNS('http://www.w3.org/2000/svg',tag),a);if(text!==undefined)n.textContent=String(text);svg.appendChild(n);return n}
 const text=(x,y,v,size=46,extra={})=>add('text',{x,y,'font-family':'Arial,sans-serif','font-size':size,'font-weight':600,'text-anchor':'middle',fill:'#24343b',...extra},v);

 add('rect',{width:W,height:H,fill:'#fff'});
 const active=current?.column??current?.to;
 if(!work&&active!==undefined)add('rect',{x:x(active)-cell/2+2,y:42,width:cell-4,height:L.bottom-L.top,rx:7,fill:'#e7f4f0'});
 const p=precision(model),dot=p?x(p)+cell/2:null;
 if(labels)for(let i=0;i<cols;i++)text(x(i),30,shortPlace(i-p),20,{fill:'#526970','data-wm-place':i});
 if(grid)gridLines(add,L);
 text(left-40,baseline(2,40),method==='addition'?'+':'−',40);
 for(let i=0;i<A.length;i++){
   text(x(i),baseline(1),A[i],46,{'data-wm-operand':'a','data-wm-column':i});
   if(method==='subtraction'&&current?.top&&(current.top[i]??0)!==A[i]){
     add('line',{x1:x(i)-20,x2:x(i)+20,y1:y(1),y2:y(1),stroke:'#915638','stroke-width':3});
     text(x(i),baseline(0,32),current.top[i]??0,32,{fill:'#915638','data-wm-exchange':i});
   }
 }
 for(let i=0;i<B.length;i++)text(x(i),baseline(2),B[i],46,{'data-wm-operand':'b','data-wm-column':i});
 add('line',{x1:left-5,x2:right+4,y1:L.top+3*cell,y2:L.top+3*cell,stroke:'#24343b','stroke-width':3});
 if(method==='addition'&&current?.carries)current.carries.forEach((v,i)=>{if(v)text(x(i),baseline(0,32),v,32,{fill:'#915638','data-wm-carry':i})});
 if(current?.result)(shown===steps.length&&p?model.result:current.result).forEach((v,i)=>{if(v!==undefined&&v!==null)text(x(i),baseline(3),v,46,{fill:'#23675d','data-wm-result':i})});
 if(p)for(const row of [1,2,3])text(dot,baseline(row),'.',40,{'data-wm-decimal':row===3?'answer':'operand'});
 
 return svg;
}
function printDiagram(model,options){const svg=diagram(model,options);svg.querySelectorAll('text[font-size]').forEach(n=>{if(Number(n.getAttribute('font-size'))<28)n.setAttribute('font-size','28')});return svg}
function paper(model,teacher){return G.exportTools.composeWorksheetCardSvg(printDiagram(model,{step:teacher?model.steps.length:0,work:!teacher}),{title:LABEL[model.method],prompt:'Calculate '+operandText(model,'a')+' '+(model.method==='addition'?'+':model.method==='subtraction'?'−':model.method.endsWith('division')?'÷':'×')+' '+operandText(model,'b')+' using the '+((model.method.endsWith('multiplication')||model.method.endsWith('division'))?LABEL[model.method].toLowerCase():'column method')+'. Show your working.'+(model.resultMode==='rounded'?' Round to '+model.resultPrecision+' decimal places.':decimalDivision(model)?' Give an exact decimal answer.':''),responseMode:'none',paperStyle:'plain',answer:model.answerText,showAnswer:teacher,diagramMaxHeight:600,printDiagramScale:0.65})}
function generationTypes(method,settings={}){if(method==='all')return M.METHODS.filter(id=>settings.exchange!=='across-zero'||id!=='addition').map(id=>({id,label:LABEL[id]}));if(['multiplication','division'].includes(method))return M.available(settings).filter(v=>v.endsWith(method)).map(id=>({id,label:LABEL[id]}));return EXCHANGES.filter(([id])=>id!=='across-zero'||method==='subtraction').map(([id,label])=>({id,label}))}
function generate(method,settings,type,rng=Math.random){if(method==='all'){const candidates=generationTypes(method,settings).map(t=>t.id),chosen=type==='all'?candidates[Math.floor(rng()*candidates.length)]:type;return {...M.generate(chosen,{...settings,exchange:chosen==='addition'&&settings.exchange==='across-zero'?'any':settings.exchange},rng),type:chosen}}if(['multiplication','division'].includes(method)){const ids=generationTypes(method,settings).map(t=>t.id),choice=type==='all'?ids[Math.floor(rng()*ids.length)]:type;return {...M.generate(choice,settings,rng),type:choice}}return {...M.generate(method,{...settings,exchange:type==='all'?'any':type},rng),type:type==='all'?'any':type}}
for(const method of Object.keys(IDS)){
 const id=IDS[method];
 if(G.publishing)G.publishing.register(id,{
  label:LABEL[method],types:model=>generationTypes(method,model.settings||model),title:item=>LABEL[item.data.method],
  signature:d=>[d.method,d.aText??d.a,d.bText??d.b,d.resultMode||'remainder',d.resultPrecision||0].join(':'),
  recipe:(model,type)=>({type,settings:M.settings(model.settings||model)}),
  generate(recipe,rng){return generate(method,recipe.settings,recipe.type,rng)},
  capture(saved){const m=M.calculate(['all','multiplication','division'].includes(method)?saved.method:method,saved.aText??saved.a,saved.bText??saved.b,{...saved.settings,...saved.calculationOptions});if(saved.task)return [G.publishing.record(id,'challenge',{...m,type:saved.task.type},{type:saved.task.type,settings:M.settings(saved.settings)})];return [G.publishing.record(id,'diagram',{...m,shown:saved.shown,grid:saved.grid,labels:saved.labels})]},
  render(item,teacher){return item.kind==='challenge'?paper(item.data,teacher):diagram(item.data,{step:item.data.shown,grid:item.data.grid,labels:item.data.labels})},
  answerSummary:item=>decimalDivision(item.data)?item.data.answerText:item.data.method.endsWith('division')?item.data.answer+' remainder '+item.data.remainder:item.data.answerText,
  answerGraphic:item=>printDiagram(item.data,{step:item.data.steps.length}),
  answerNote:item=>decimalDivision(item.data)?'Check decimal point alignment and continuation of the division. '+(item.data.resultMode==='rounded'?'Round to '+item.data.resultPrecision+' decimal places. ':'The result must be exact. ')+'Accept equivalent valid written working.':item.data.method.endsWith('division')?'Require the correct quotient and remainder (zero for exact division). Check the place-value alignment and each regrouping or subtraction; the remainder must be smaller than the divisor. Accept equivalent valid written working.':item.data.method.endsWith('multiplication')?(item.data.method==='long-multiplication'?'Check both partial products, including the tens-place shift, and their sum. Accept equivalent valid written methods.':'Check each digit product, carries and final product. Accept equivalent valid working.'):item.data.method==='addition'?'Check place-value alignment, correct exchanges and the final sum. Equivalent valid written working is acceptable.':'Check place-value alignment, exchanges (including through zero if needed) and the final difference. Equivalent valid written working is acceptable.'
 });
}

/* A practice plan uses the same diagram coordinates as the teacher key.
   Slot positions depend only on operands and the chosen method. Expected
   values stay in JS; pupil SVG and HTML contain no solution attributes. */
function practiceCells(model){
 const {a,b,method,width,steps}=model,slots=[],A=operandDigits(model,'A'),B=operandDigits(model,'B');
 const add=(id,x,y,w,h,label,expected,optional=false)=>slots.push({id,x,y,w,h,label,expected,optional});
 const short=method==='short-division',longDiv=method==='long-division';
 if(short||longDiv){
   const L=layout(model),{cols,cell,left,W,x,y}=L;
   const first=divisionFirst(model);
   for(const s of steps)add('q'+s.index,x(s.index),y(0),64,60,'Quotient digit '+(s.index+1),s.digit,s.index<first);
   if(short){
     for(const s of steps.slice(1))add('carry'+s.index,x(s.index)-25,L.top+cell+13,36,26,'Carried remainder '+(s.index+1),s.incoming,s.incoming===0);
   }else{
     for(let i=first;i<cols;i++){
       const s=steps[i],row=i-first,yy=y(2+row*2),available=Math.min(i+1,String(b).length+1);
       if(row){
         const ds=digits(s.dividend);
         for(let j=0;j<available;j++)add('dividend'+i+'-'+j,x(i-j),yy-cell,65,60,'Partial dividend, row '+(row+1)+', digit '+(j+1),ds[j]??0,j>=ds.length);
       }
       const ds=digits(s.product);
       for(let j=0;j<available;j++)add('product'+i+'-'+j,x(i-j),yy,65,60,'Subtraction row '+(row+1)+', digit '+(j+1),ds[j]??0,j>=ds.length);
     }
     const last=steps.at(-1),ds=digits(last.remainder),row=cols-1-first,yy=y(3+row*2);
     for(let j=0;j<Math.min(cols,String(b).length);j++)add('last-remainder'+j,x(cols-1-j),yy,65,60,'Final remainder digit '+(j+1),ds[j]??0,j>=ds.length);
   }
   if(!decimalDivision(model))add('remainder',W-38,y(0),50,60,'Remainder',model.remainder);
   return slots;
 }
 const mult=method.endsWith('multiplication'),long=method==='long-multiplication',L=layout(model),{cols,cell,x,y}=L;
 const expected=model.result||digits(model.answer);
 for(let i=0;i<cols;i++)add('result'+i,x(i),y(long?6:3),72,64,'Result '+M.place(i-precision(model)),expected[i]??0,i>=expected.length);
 if(method==='addition'){
   for(let i=1;i<cols;i++){const n=model.carries[i]||0;add('carry'+i,x(i),y(0),58,54,'Carry into '+M.place(i-precision(model)),n,!n)}
 }else if(method==='subtraction'){
   for(let i=0;i<A.length;i++){const n=model.exchanged[i]??0;add('exchange'+i,x(i),y(0),58,54,'Regrouped '+M.place(i-precision(model)),n,n===A[i])}
 }else if(mult){
   if(long){
     for(let r=0;r<2;r++){
       const ds=digits(model.partialProducts[r]);
       for(let i=0;i<cols;i++)add('partial'+r+'-'+i,x(i),y(3+r),72,64,'Partial product '+(r+1)+', '+M.place(i-precision(model)),ds[i]??0,i>=ds.length);
     }
     const s=steps.filter(s=>s.type==='sum-products').at(-1)?.sumStep;
     for(let i=1;i<cols;i++){const n=s?.carries?.[i]||0;add('sum-carry'+i,x(i),y(5),58,54,'Addition carry into '+M.place(i-precision(model)),n,!n)}
   }else{
     const s=steps.filter(s=>s.carries).at(-1);
     for(let i=1;i<cols;i++){const n=s?.carries?.[i]||0;add('carry'+i,x(i),y(0),58,54,'Carry into '+M.place(i-precision(model)),n,!n)}
   }
 }
 return slots;
}
function practiceReady(model,entries){return practiceCells(model).every(s=>s.optional||String(entries[s.id]??'').trim()!=='')}
function practiceCorrect(model,entries){return practiceCells(model).every(s=>{const v=String(entries[s.id]??'').trim();return !v?s.optional:/^\d+$/.test(v)&&Number(v)===s.expected})}
function mountPractice(host,model,entries,onEdit,grid,labels){
 const svg=diagram(model,{grid,labels}),[, ,W,H]=svg.getAttribute('viewBox').split(' ').map(Number);
 const wrap=document.createElement('div');wrap.className='gd-wm-practice';wrap.style.maxWidth='100%';
 wrap.appendChild(svg);host.appendChild(wrap);
 for(const slot of practiceCells(model)){
   const el=document.createElement('input');el.className='gd-wm-cell';el.type='text';el.inputMode='none';el.autocomplete='off';el.maxLength=2;
   el.dataset.gdKeypad='number';el.dataset.wmCell=slot.id;el.setAttribute('aria-label',slot.label);el.value=String(entries[slot.id]??'');
   Object.assign(el.style,{left:((slot.x-slot.w/2)/W*100)+'%',top:((slot.y-slot.h/2)/H*100)+'%',width:(slot.w/W*100)+'%',height:(slot.h/H*100)+'%'});
   el.addEventListener('input',()=>{el.value=el.value.replace(/[^0-9]/g,'').slice(0,2);entries[slot.id]=el.value;onEdit()});wrap.appendChild(el);
 }
}

G.columnMethods={layout,diagram,paper,practiceCells,practiceReady,practiceCorrect};
G.columnMethodTool=function(method){
 const id=IDS[method],CK=G.challengeKit,X=G.exportTools;
 const unified=method==='all',multiply=method==='multiplication',divide=method==='division',multi=unified||multiply||divide;
 let model=divide?M.calculate('long-division',875,24):multiply?M.calculate('long-multiplication',247,36):M.calculate(unified?'addition':method,method==='subtraction'?1002:368,method==='subtraction'?586:457),shown=0,grid=true,labels=true,workflow='build',settings=M.settings({year:divide?6:multiply?5:4}),task=null,status='',setup=null,practiceMode='working',entries={};
 const isDivide=()=>model.method.endsWith('division'),isMultiply=()=>model.method.endsWith('multiplication');
 const calcOptions=m=>({resultMode:m.resultMode||'remainder',resultPrecision:m.resultPrecision||settings.resultPrecision,twoDigitShort:!!m.twoDigitShort||m.method==='short-division'&&m.b>9});
 const modelSnapshot=()=>({a:model.a,b:model.b,aText:model.aText,bText:model.bText,method:model.method,calculationOptions:calcOptions(model)});
 const modes=unified?M.METHODS:divide?['short-division','long-division']:multiply?['short-multiplication','long-multiplication']:[method];
 const option=(v,label,current)=>'<option value="'+esc(v)+'"'+(String(v)===String(current)?' selected':'')+'>'+esc(label)+'</option>';
 const select=(name,values,current)=>'<select class="gd-select" data-wm-setting="'+name+'">'+values.map(([v,l])=>option(v,l,current)).join('')+'</select>';
 const remainderOptions=[['any','Mixed'],['exact','Exact division'],['with','With remainders']];
 const numberSettings=()=>field('Number type',select('numberType',[['whole','Whole numbers'],['decimal','Decimals'],['mixed','Mixed precision']],settings.numberType))+(settings.numberType!=='whole'?field('Operand decimal places',select('decimalPlaces',[[1,'1'],[2,'2'],[3,'3']],settings.decimalPlaces)):'')+field('First operand digits',select('operandDigits',[[0,'Year suggestion'],...Array.from({length:isDivide()||isMultiply()?4:7},(_,i)=>[i+1,i+1])],settings.operandDigits))+(!isDivide()&&!isMultiply()?field('Second operand digits',select('secondDigits',[[0,'Year suggestion'],...Array.from({length:7},(_,i)=>[i+1,i+1])],settings.secondDigits)): '')+(isDivide()?field('Result form',select('resultMode',[['remainder','Whole quotient / remainder'],['decimal','Exact decimal'],['rounded','Rounded decimal']],settings.resultMode))+(settings.resultMode==='remainder'&&settings.numberType==='whole'?field('Remainders',select('remainders',remainderOptions,settings.remainders)):field('Result decimal places',select('resultPrecision',[[1,'1'],[2,'2'],[3,'3']],settings.resultPrecision)))+(model.method==='short-division'?field('Divisor',select('twoDigitShort',[[0,'One digit'],[1,'One or two digits']],Number(settings.twoDigitShort))):''):isMultiply()?'':field('Exchanges',select('exchange',EXCHANGES.filter(([v])=>v!=='across-zero'||model.method==='subtraction'),settings.exchange)));
 const families=()=>generationTypes(method,settings);
 function controls(){
  const tabs='<div class="gd-row gd-wm-tabs" role="tablist" aria-label="Written calculation workflow">'+[['build','Explore'],['challenge','Challenge'],['export','Export']].map(([v,l])=>'<button type="button" class="gd-btn'+(workflow===v?' gd-btn--primary':'')+'" data-wm-workflow="'+v+'">'+l+'</button>').join('')+'</div>';
  if(workflow==='export')return tabs+'<div class="gd-row">'+btn('Copy image','wm-copy')+btn('PNG','wm-png')+btn('SVG','wm-svg')+btn('Print / PDF','wm-print')+'</div>'+(task?'<div class="gd-row">'+btn('Copy answer key','wm-key-copy')+btn('Print answer key','wm-key-print')+'</div>':'')+'<p class="gd-help" id="wm-status">'+esc(status)+'</p>';
  if(workflow==='challenge')return tabs+field('Year suggestions',select('year',[[3,'Year 3'],[4,'Year 4'],[5,'Year 5'],[6,'Year 6']],settings.year))+field('Practice',select('practiceMode',[['working','Complete working'],['answer','Final answer only']],practiceMode))+(unified?field('Generation settings for',select('method',modes.map(v=>[v,LABEL[v]]),model.method)):'')+numberSettings()+CK.nativeRandomHtml('wm',unified?[{id:'column',label:'Addition & subtraction',ids:['addition','subtraction']},{id:'multiply',label:'Multiplication',ids:['short-multiplication','long-multiplication']},{id:'divide',label:'Division',ids:['short-division','long-division']}]:[{id:'practice',label:'Practice',ids:families().map(t=>t.id)}])+families().map(t=>'<button type="button" class="gd-btn" data-wm-challenge-mode="'+t.id+'">'+esc(t.label)+'</button>').join('')+'<p class="gd-help">Use the on-screen keypad. Rounded division uses final-answer practice.</p><p class="gd-help" id="wm-status" role="status">'+esc(status)+'</p>';
  return tabs+(multi?field('Method',select('method',modes.map(v=>[v,LABEL[v]]),model.method)):'')+field(isDivide()?'Dividend':'First number','<input class="gd-input" type="text" inputmode="none" data-gd-keypad="number" id="wm-a" value="'+esc(operandText(model,'a'))+'">')+field(isDivide()?'Divisor':'Second number','<input class="gd-input" type="text" inputmode="none" data-gd-keypad="number" id="wm-b" value="'+esc(operandText(model,'b'))+'">')+'<div class="gd-row">'+btn('Apply numbers','wm-apply')+btn('New example','wm-new')+'</div>'+field('Year suggestions',select('year',[[3,'Year 3'],[4,'Year 4'],[5,'Year 5'],[6,'Year 6']],settings.year))+numberSettings()+'<label class="gd-wm-toggle"><input type="checkbox" data-wm-display="grid"'+(grid?' checked':'')+'> Place-value grid</label><label class="gd-wm-toggle"><input type="checkbox" data-wm-display="labels"'+(labels?' checked':'')+'> Column headings</label><p class="gd-help" id="wm-status" role="status">'+esc(status)+'</p>';
 }
 function launch(type){
  if(!task)setup={...modelSnapshot(),shown};
  const before=model.a+':'+model.b;try{for(let i=0;i<12;i++){model=generate(method,settings,type);if(model.a+':'+model.b!==before)break}}catch(e){message(e.message);return}
  entries={};task=CK.normalise({mode:'standard',type:model.type,title:LABEL[model.method],prompt:'Calculate using '+(multi?LABEL[model.method].toLowerCase():'the column method')+(isDivide()?(decimalDivision(model)?model.resultMode==='rounded'?' and round to '+model.resultPrecision+' decimal places':' and give the exact decimal answer':' and give the quotient and remainder (0 if exact)'):'')+'.',answer:answerLabel(model),answerMode:'manual',revealed:false});shown=0;workflow='challenge';renderControls();renderStage();
 }
 function exit(){if(setup){model=M.calculate(multi?setup.method:method,setup.aText??setup.a,setup.bText??setup.b,setup.calculationOptions||{});shown=setup.shown}task=null;entries={};setup=null;workflow='build';renderControls();renderStage()}
 function renderStage(){
  const stage=q('#gd-stage');
  if(task){
   const working=practiceMode==='working'&&model.resultMode!=='rounded';
   const pupil=working?CK.pupilSpec('model',{hint:'Fill the working cells. Leave unused exchanges and leading places blank, then check.',ready:()=>practiceReady(model,entries),check:()=>practiceCorrect(model,entries)}):isDivide()&&!decimalDivision(model)?CK.pupilSpec('quotient-remainder',{quotient:model.answer,remainder:model.remainder}):CK.pupilSpec('number');
   stage.innerHTML=CK.bannerHtml(task,{pupil,actions:[{action:'another',label:'Another'},{action:'end',label:'Exit challenge'}]})+'<div class="gd-wm-diagram"></div>';
   const host=q('.gd-wm-diagram',stage);
   if(working&&!task.revealed)mountPractice(host,model,entries,()=>CK.refreshModelPupil(task),grid,labels);
   else host.appendChild(diagram(model,{step:task.revealed?model.steps.length:0,grid,labels}));
   q('[data-challenge-action="another"]',stage).onclick=()=>launch(generationTypes(method,settings).some(t=>t.id===task.type)?task.type:'all');
   q('[data-challenge-action="end"]',stage).onclick=exit;
   const reveal=q('[data-board-action="reveal"]',stage);if(reveal)reveal.onclick=()=>{task.revealed=!task.revealed;renderStage()};
   return;
  }
  const max=model.steps.length,explanation=shown?model.steps[shown-1].explanation:(isDivide()?'Start at the highest place. Divide, then regroup any remainder into the next place.':'Align the digits by place value. Start in the ones column.');
  stage.innerHTML='<div class="gd-wm-stage"><div class="gd-wm-diagram"></div><div class="gd-wm-explanation" aria-live="polite">'+esc(explanation)+'</div><div class="gd-wm-actions"><button class="gd-btn" data-wm-step="reset"'+(shown===0?' disabled':'')+'>Reset</button><button class="gd-btn" data-wm-step="previous"'+(shown===0?' disabled':'')+'>← Back</button><span class="gd-wm-progress">'+shown+' / '+max+'</span><button class="gd-btn gd-btn--primary" data-wm-step="next"'+(shown===max?' disabled':'')+'>Next →</button><button class="gd-btn" data-wm-step="all"'+(shown===max?' disabled':'')+'>Show all</button></div></div>';
  q('.gd-wm-diagram',stage).appendChild(diagram(model,{step:shown,grid,labels}));
  qa('[data-wm-step]',stage).forEach(el=>el.onclick=()=>{shown=el.dataset.wmStep==='reset'?0:el.dataset.wmStep==='previous'?Math.max(0,shown-1):el.dataset.wmStep==='next'?Math.min(max,shown+1):max;renderStage()});
 }
 function message(s){status=s;const el=q('#wm-status');if(el)el.textContent=s}
 async function exportAction(kind){try{const teacher=kind.startsWith('key-');if(teacher&&!task)return;const svg=task?paper(model,teacher):diagram(model,{step:shown,grid,labels});if(kind==='copy'||kind==='key-copy')await X.copyPng(svg);else if(kind==='png')await X.downloadPng(svg,id,2);else if(kind==='svg')X.downloadSvg(svg,id);else X.printSvg(svg,{title:'',landscape:false});message('Export ready.')}catch(e){message(e.message||'Export failed.')}}
 function renderControls(){
  const root=q('#gd-controls');root.innerHTML=controls();
  qa('[data-wm-workflow]',root).forEach(el=>el.onclick=()=>{workflow=el.dataset.wmWorkflow;if(workflow==='build'&&task){exit();return}renderControls()});
  qa('[data-wm-setting]',root).forEach(el=>el.onchange=()=>{if(el.dataset.wmSetting==='practiceMode'){practiceMode=el.value;if(task){const saved={...task,revealed:false};task=CK.normalise(saved);renderStage()}}else if(el.dataset.wmSetting==='method'){const target=el.value;if(!modes.includes(target))return;const ex=target==='addition'?[368,457]:target==='subtraction'?[1002,586]:target==='short-multiplication'?[247,6]:target==='long-multiplication'?[247,36]:target==='short-division'?[875,5]:[875,24];if(task){message('Exit the current challenge before changing method.');renderControls();return}model=M.calculate(target,...ex);shown=0;renderStage()}else settings=M.settings({...settings,[el.dataset.wmSetting]:el.value});renderControls()});
  qa('[data-wm-display]',root).forEach(el=>el.onchange=()=>{if(el.dataset.wmDisplay==='grid')grid=el.checked;else labels=el.checked;renderStage()});
  qa('[data-wm-challenge-mode]',root).forEach(el=>el.onclick=()=>launch(el.dataset.wmChallengeMode));
  const apply=q('#wm-apply',root);if(apply)apply.onclick=()=>{try{const a=q('#wm-a').value,b=q('#wm-b').value;if(a===''||b==='')throw Error('Enter both numbers.');model=M.calculate(model.method,a,b,{...settings,resultMode:isDivide()&&a.includes('.')&&settings.resultMode==='remainder'?'decimal':settings.resultMode});shown=0;status='';renderControls();renderStage()}catch(e){message(e.message)}};
  const next=q('#wm-new',root);if(next)next.onclick=()=>{try{model=multi?generate(method,settings,model.method):M.generate(method,settings);shown=0;status='';renderControls();renderStage()}catch(e){message(e.message)}};
  for(const kind of ['copy','png','svg','print',...(task?['key-print','key-copy']:[])]){let el=q('#wm-'+kind,root);if(!el){el=document.createElement('button');el.type='button';el.hidden=true;root.appendChild(el)}el.setAttribute('data-gd-direct-export',kind);el.onclick=()=>exportAction(kind)}
 }
 setPanels('','');renderControls();renderStage();
 G.lessonState.register(id,()=>({...modelSnapshot(),shown,grid,labels,workflow,settings,task,setup,practiceMode,entries:{...entries},pupil:CK.capturePupil(task)}),saved=>{model=M.calculate(multi?saved.method:method,saved.aText??saved.a,saved.bText??saved.b,{...saved.settings,...saved.calculationOptions});shown=Math.max(0,Math.min(model.steps.length,Number(saved.shown)||0));grid=saved.grid!==false;labels=saved.labels!==false;workflow=['build','challenge','export'].includes(saved.workflow)?saved.workflow:'build';settings=M.settings(saved.settings);task=saved.task?CK.normalise({...saved.task,answer:answerLabel(model)}):null;setup=saved.setup||null;practiceMode=saved.practiceMode==='answer'?'answer':'working';entries=Object.fromEntries(Object.entries(saved.entries||{}).filter(([id,v])=>practiceCells(model).some(s=>s.id===id)&&/^\d{0,2}$/.test(String(v))));CK.restorePupil(task,saved.pupil);renderControls();renderStage()});
};
})(window.TT99Goodies);
