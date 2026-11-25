/* Tables and tally charts: shared immutable data, editable teaching setup. */
(function(G){
'use strict';
if(!G||!G.statistics)return;
const M=G.statistics,{q,qa,esc,field,btn,setPanels}=G;
const ID='statistics-table', TYPES=[['read','Read a value'],['total','Find the total'],['difference','Compare two values'],['range','Largest minus smallest'],['mean','Find the mean']];
const examples=['Apples','Pears','Bananas','Oranges'];
const CONTEXTS=[{title:'Favourite fruit',unit:'votes',labels:['Apples','Pears','Bananas','Oranges','Grapes','Plums']},{title:'Travel to school',unit:'pupils',labels:['Walk','Car','Bus','Cycle','Scooter','Train']},{title:'Library loans',unit:'books',labels:['Adventure','Mystery','History','Science','Poetry','Comics']},{title:'School fair stalls',unit:'visitors',labels:['Games','Crafts','Cakes','Books','Plants','Toys']},{title:'Favourite colours',unit:'votes',labels:['Red','Blue','Green','Yellow','Purple','Orange']}];
const initial=()=>M.dataset(examples.map((label,i)=>({label,value:[7,4,12,9][i]})),{title:'Favourite fruit',unit:'votes'});
function randomData(max=20,count=4,mean=false,rng=Math.random){
 const context=CONTEXTS[Math.floor(rng()*CONTEXTS.length)],rows=context.labels.slice(0,count).map(label=>({label,value:Math.floor(rng()*(max+1))}));
 if(mean){const total=rows.reduce((s,r)=>s+r.value,0),rem=total%count; if(rem){const last=rows.find(r=>r.value>=rem);if(last)last.value-=rem;else {const r=rows.find(r=>r.value+count-rem<=max);if(r)r.value+=count-rem;else rows.forEach(r=>r.value=0)}}}
 return M.dataset(rows,context);
}
function svgTable(data,view='table',missing=-1){
 const tally=view==='tally',W=720,H=94+data.rows.length*72,ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 function add(tag,attrs,value){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(value!==undefined)n.textContent=value;svg.appendChild(n);return n}
 Object.entries({viewBox:'0 0 '+W+' '+H,xmlns:ns,role:'img','aria-label':data.title+' '+(tally?'tally chart':'frequency table')}).forEach(([k,v])=>svg.setAttribute(k,v));
 const text=(x,y,v,size=26,extra={})=>add('text',{x,y,fill:'#24343b','font-family':'Arial,sans-serif','font-size':size,...extra},v);
 add('rect',{width:W,height:H,fill:'#fff'});text(24,34,data.title||'Data',30,{'font-weight':700});
 add('rect',{x:18,y:48,width:684,height:44,rx:5,fill:'#e7f2ee'});
 text(32,78,'Category',22,{'font-weight':700});text(tally?340:610,78,tally?'Tally':'Frequency',22,{'font-weight':700,'text-anchor':'middle'});
 data.rows.forEach((r,i)=>{
  const y=92+i*72;
  add('rect',{x:18,y,width:684,height:72,fill:i%2?'#f6f9f8':'#fff',stroke:'#d8e3e1'});
  text(32,y+44,r.label,Math.min(26,205/Math.max(1,r.label.length*.6)));
  if(i===missing){add('rect',{x:tally?252:560,y:y+12,width:tally?410:100,height:48,rx:4,fill:'none',stroke:'#8da6a3','stroke-dasharray':'6 5'});return}
  if(!tally){text(610,y+44,String(r.value),32,{'text-anchor':'middle','font-weight':600});return}
  const t=M.tally(r.value),groups=t.groups+(t.remainder?1:0),spacing=Math.min(65,420/Math.max(1,groups)),dx=Math.min(9,spacing/6);
  for(let g=0;g<groups;g++){
    const full=g<t.groups,n=full?4:t.remainder,x=250+g*spacing;
    for(let j=0;j<n;j++)add('line',{x1:x+j*dx,x2:x+j*dx,y1:y+20,y2:y+52,stroke:'#23675d','stroke-width':3,'stroke-linecap':'round'});
    if(full)add('line',{x1:x-4,x2:x+3*dx+4,y1:y+49,y2:y+23,stroke:'#23675d','stroke-width':3,'stroke-linecap':'round'});
  }
  if(r.value===0)text(250,y+44,'—',25);
 });
 return svg;
}
const VIEWS=[['table','Frequency table'],['tally','Tally chart'],['pictogram','Pictogram'],['bar','Bar chart'],['line','Line graph'],['pie','Pie chart']];
const EXTRA={bar:[['read-scale','Read the axis interval']],line:[['read-scale','Read the axis interval'],['change','Find the change between consecutive days']],pie:[['angle','Find a sector angle'],['percent','Find a sector percentage']],pictogram:[['symbols','Count full symbols']]};
const PROFILES=[['custom','All / custom'],['2','Year 2'],['3','Year 3'],['4','Year 4'],['5','Year 5'],['6','Year 6']];
const profile=v=>PROFILES.some(p=>p[0]===String(v))?String(v):'custom';
function viewsFor(year){year=profile(year);return VIEWS.filter(([v])=>year==='custom'||year==='6'||(v!=='pie'&&(v!=='line'||+year>=4)&&(v!=='bar'||+year>=3)));}
const questionTypes=(view,year='custom')=>{year=profile(year);const all=view==='pie'?EXTRA.pie:[...TYPES,...(EXTRA[view]||[]),['combined','Two-step sum and comparison'],['complete','Complete the missing entry']];return all.filter(([id])=>year==='custom'||(+year>=6||!['mean','angle','percent','range'].includes(id))&&(+year>=3||!['combined','read-scale'].includes(id)));};
const viewName=view=>VIEWS.find(v=>v[0]===view)?.[1]||'Frequency table';
const validView=view=>VIEWS.some(v=>v[0]===view)?view:'table';
const COLOURS=['#39887e','#537eaa','#c68a48','#9275ac','#c66c75','#718b48'];
function svgChart(data,view,key=2,missing=-1,axisOverride=null){
 if(view==='table'||view==='tally')return svgTable(data,view,missing);
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),W=760,H=view==='pictogram'?120+data.rows.length*60:480;
 Object.entries({viewBox:'0 0 '+W+' '+H,xmlns:ns,role:'img','aria-label':data.title+' — '+viewName(view)}).forEach(([k,v])=>svg.setAttribute(k,v));
 function add(tag,attrs,value){const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));if(value!==undefined)n.textContent=value;svg.appendChild(n);return n}
 const text=(x,y,v,size=24,extra={})=>add('text',{x,y,fill:'#24343b','font-family':'Arial,sans-serif','font-size':size,...extra},v);
 add('rect',{width:W,height:H,fill:'#fff'});text(24,36,data.title||'Data',28,{'font-weight':700});
 if(view==='pictogram'){
  text(24,72,'Key: one full symbol = '+key+' '+(data.unit||'items'),24);
  const rows=M.pictogram(data,key),max=Math.max(1,...rows.map(r=>r.whole+(r.remainder?1:0))),pitch=Math.min(36,465/max),size=Math.min(27,pitch-3);
  rows.forEach((r,i)=>{const y=90+i*60;add('rect',{x:18,y,width:724,height:60,fill:i%2?'#f5f8f7':'#fff',stroke:'#d8e3e1'});text(30,y+38,r.label,Math.min(24,215/Math.max(1,r.label.length*.6)));
   if(i===missing){add('rect',{x:260,y:y+9,width:450,height:42,rx:4,fill:'none',stroke:'#8da6a3','stroke-dasharray':'6 5'});return}
   for(let j=0;j<r.whole+(r.remainder?1:0);j++){const fraction=j<r.whole?1:r.remainder/key,x=260+j*pitch;add('rect',{x,y:y+16,width:size,height:size,rx:2,fill:'#fff',stroke:'#39887e','stroke-width':1.5});add('rect',{x,y:y+16,width:size*fraction,height:size,fill:'#39887e'});}
  });return svg;
 }
 if(view==='pie'){
  const cx=245,cy=252,r=175,total=M.summary(data).total;
  if(!total){text(cx,cy,'No data to display',24,{'text-anchor':'middle'});return svg}
  const point=a=>[cx+r*Math.sin(a*Math.PI/180),cy-r*Math.cos(a*Math.PI/180)];
  M.pie(data).forEach((s,i)=>{const col=COLOURS[i%COLOURS.length];if(s.angle>=359.999999)add('circle',{cx,cy,r,fill:col,stroke:'#fff','stroke-width':2});else if(s.angle>0){const a=point(s.start),b=point(s.end);add('path',{d:'M '+cx+' '+cy+' L '+a.join(' ')+' A '+r+' '+r+' 0 '+(s.angle>180?1:0)+' 1 '+b.join(' ')+' Z',fill:col,stroke:'#fff','stroke-width':2})}
   add('rect',{x:460,y:100+i*52,width:23,height:23,rx:3,fill:col});const label=s.label+' ('+s.value+')';text(495,119+i*52,label,Math.min(24,245/Math.max(1,label.length*.6)));
  });text(460,440,'Total: '+total+' '+(data.unit||'items'),23);return svg;
 }
 const left=84,right=730,top=80,bottom=380,axis=axisOverride||M.axis(data),n=data.rows.length,slot=(right-left)/n;
 const py=v=>bottom-v/axis.max*(bottom-top),px=i=>left+(i+.5)*slot;
 for(let v=0;v<=axis.max;v+=axis.step){const y=py(v);add('line',{x1:left,x2:right,y1:y,y2:y,stroke:'#d6e3e1','stroke-width':1.5});text(left-12,y+7,String(v),22,{'text-anchor':'end'})}
 add('path',{d:'M '+left+' '+top+' V '+bottom+' H '+right,fill:'none',stroke:'#24343b','stroke-width':2});
 text(left,65,data.unit||'Value',22);
 data.rows.forEach((r,i)=>{const x=px(i),y=py(r.value);
  if(view==='bar'&&i!==missing)add('rect',{x:x-slot*.29,y,width:slot*.58,height:bottom-y,rx:2,fill:COLOURS[i%COLOURS.length],stroke:'#365c5b','stroke-width':1});
  text(x,bottom+25,r.label,22,{'text-anchor':'end',transform:'rotate(-35 '+x+' '+(bottom+25)+')'});
 });
 if(view==='line'){data.rows.forEach((r,i)=>{if(i===missing)return;if(i>0&&i-1!==missing)add('line',{x1:px(i-1),y1:py(data.rows[i-1].value),x2:px(i),y2:py(r.value),stroke:'#287b72','stroke-width':4});add('circle',{cx:px(i),cy:py(r.value),r:6,fill:'#fff',stroke:'#287b72','stroke-width':3})})}
 return svg;
}
function recipe(model={},type='all'){
 const year=profile(model.year),view=viewsFor(year).some(v=>v[0]===model.view)?model.view:'table';
 return {type,year,view,key:year==='2'?1:[1,2,5,10].includes(+model.key)?+model.key:2,max:year==='2'?10:[10,20,30,40].includes(+model.max)?+model.max:20,count:year==='2'?Math.min(4,+model.count||4):[3,4,5,6].includes(+model.count)?+model.count:4};
}
function generate(r,rng=Math.random){
 const available=questionTypes(r.view,r.year),type=r.type==='all'?available[Math.floor(rng()*available.length)][0]:r.type;
 if(!available.some(t=>t[0]===type))throw Error('Choose a question compatible with this graph.');
 let data=randomData(r.max,r.count,type==='mean',rng);
 if(r.view==='line')data=M.dataset(data.rows.map((row,i)=>({...row,label:['Mon','Tue','Wed','Thu','Fri','Sat'][i]})),{title:'Daily visitors',unit:'visitors',ordered:true});
 if(r.view==='pie'){const total=type==='percent'?20:12;const values=Array(r.count).fill(1);for(let i=r.count;i<total;i++)values[Math.floor(rng()*r.count)]++;data=M.dataset(data.rows.map((row,i)=>({...row,value:values[i]})),data);}
 if(r.view==='pictogram'){let values=data.rows.map(row=>Math.floor(row.value/r.key));if(type==='mean'){const remainder=values.reduce((a,b)=>a+b,0)%r.count;for(let i=0,left=remainder;i<values.length&&left;i++){const take=Math.min(left,values[i]);values[i]-=take;left-=take}}data=M.dataset(data.rows.map((row,i)=>({...row,value:values[i]*r.key})),data);}
 const a=Math.floor(rng()*data.rows.length),b=(a+1+Math.floor(rng()*(data.rows.length-1)))%data.rows.length;
 let question;
 if(type==='angle'||type==='percent'){const row=data.rows[a],total=M.summary(data).total;question={type,prompt:(type==='angle'?'What is the angle in degrees of the sector for ':'What percentage of the total is represented by ')+row.label+'?',answer:row.value*(type==='angle'?360:100)/total};}
 else if(type==='read-scale')question={type,prompt:'How many '+data.unit+' does one labelled vertical axis interval represent?',answer:M.axis(data).step};
 else if(type==='symbols')question={type,prompt:'How many full symbols represent '+data.rows[a].label+'?',answer:data.rows[a].value/r.key};
 else if(type==='change'){const i=Math.floor(rng()*(data.rows.length-1)),x=data.rows[i],y=data.rows[i+1];question={type,prompt:'By how many visitors did the number change from '+x.label+' to '+y.label+'?',answer:Math.abs(y.value-x.value)};}
 else if(type==='combined'){const c=(b+1)%data.rows.length===a?(b+2)%data.rows.length:(b+1)%data.rows.length;const x=data.rows[a],y=data.rows[b],z=data.rows[c];question={type,prompt:'Add the values for '+x.label+' and '+y.label+'. What is the difference between this sum and the value for '+z.label+'?',answer:Math.abs(x.value+y.value-z.value)};}
 else if(type==='complete'){const row=data.rows[a];question={type,missing:a,prompt:'Complete the missing '+(r.view==='bar'?'bar':r.view==='line'?'point and connecting lines':r.view==='pictogram'?'symbols':r.view==='tally'?'tally marks':'frequency')+' for '+row.label+'. Its frequency is '+row.value+'.',answer:row.value};}
 else question=M.question(data,type,a,b);
 return {...question,data,view:r.view,key:r.key};
}
function paper(item,teacher){
 const d=item.data,svg=svgChart(d.data,d.view,d.key,!teacher&&d.type==='complete'?d.missing:-1);
 if(item.kind==='diagram')return svg;
 return G.exportTools.composeWorksheetCardSvg(svg,{title:viewName(d.view),prompt:d.prompt,responseLabel:'Answer',responseMode:d.type==='complete'?'none':'box',responseLines:1,paperStyle:'plain',answer:String(d.answer),showAnswer:teacher});
}
if(G.publishing)G.publishing.register(ID,{
 label:'Data & graphs',
 types:model=>questionTypes(recipe(model||{}).view,model?.year).map(([id,label])=>({id,label})),
 title:item=>viewName(item.data.view),
 signature:d=>JSON.stringify([d.view,d.type,d.prompt,d.data.rows]),
 recipe,generate,
 capture(saved){
  const data=M.dataset(saved.data.rows,saved.data),view=validView(saved.view);
  if(saved.task)return [G.publishing.record(ID,'challenge',{data,view,key:saved.key,type:saved.task.type,prompt:saved.task.prompt,answer:saved.task.answer,missing:saved.task.missing})];
  return [G.publishing.record(ID,'diagram',{data,view,key:saved.key})];
 },
 render:paper,
 answerSummary:item=>String(item.data.answer),
 answerGraphic:item=>svgChart(item.data.data,item.data.view,item.data.key),
 answerNote:item=>item.data.type==='combined'?'Add the first two named values, then find the absolute difference between that sum and the third value.':item.data.type==='complete'?'Complete the missing entry to represent the stated frequency. Check its position, height, or symbol count against the completed diagram.':item.data.type==='angle'?'Divide the category frequency by the total and multiply by 360 degrees.':item.data.type==='percent'?'Divide the category frequency by the total and multiply by 100.':item.data.type==='read-scale'?'Subtract consecutive labelled axis values.':item.data.type==='symbols'?'Count the full symbols in the named row.':item.data.type==='change'?'Subtract the smaller of the two consecutive daily values from the larger.':item.data.type==='mean'?'Add all frequencies and divide by the number of categories.':item.data.type==='total'?'Add all frequencies.':item.data.type==='range'?'Subtract the smallest frequency from the largest.':item.data.type==='difference'?'Subtract the smaller named frequency from the larger.':'Read the frequency for the named category. Accept equivalent numerical working.'
});
G.statisticsTable={svgTable,svgChart,randomData,recipe,generate,profiles:PROFILES,viewsFor,questionTypes};
G.statisticsTableTool=function(){
 const CK=G.challengeKit;let data=initial(),view='table',workflow='build',task=null,setup=null,max=20,count=4,key=2,year='custom',status='',attempt=null;
 const types=()=>questionTypes(view,year);
 function message(s){status=s;const el=q('#st-status');if(el)el.textContent=s}
 function change(i,delta){const rows=data.rows.map((r,j)=>({...r,value:j===i?Math.max(0,Math.min(40,r.value+delta)):r.value}));data=M.dataset(rows,data);render()}
 function launch(type){
  if(!task)setup=data;
  attempt=null;
  const allowed=types();const chosenType=type==='all'?allowed[Math.floor(Math.random()*allowed.length)][0]:type;const question=generate(recipe({view,max,count,key,year},chosenType));data=question.data;const chosen=question.type;
  task=CK.normalise({mode:'standard',type:chosen,title:viewName(view),prompt:question.prompt,answer:String(question.answer),answerMode:'manual',revealed:false});if(chosen==='complete')task.missing=question.missing;workflow='challenge';render();
 }
 function exit(){if(setup)data=setup;setup=null;task=null;attempt=null;workflow='build';render()}
 function controls(){
  const tabs='<div class="gd-row" role="tablist" aria-label="Data workflow">'+[['build','Explore'],['challenge','Challenge']].map(([v,l])=>'<button class="gd-btn'+(workflow===v?' gd-btn--primary':'')+'" type="button" data-st-workflow="'+v+'">'+l+'</button>').join('')+'</div>';
  const select=(id,options,current)=>'<select class="gd-select" id="'+id+'">'+options.map(([v,l])=>'<option value="'+v+'"'+(String(v)===String(current)?' selected':'')+'>'+l+'</option>').join('')+'</select>';
  const representation=field('Curriculum',''+select('st-year',PROFILES,year))+field('Representation',select('st-view',viewsFor(year),view));
  const settings=(view==='pictogram'?field('Symbol value',select('st-key',[[1,'1'],[2,'2'],[5,'5'],[10,'10']],key)):'')+field('Maximum frequency',select('st-max',[[10,'10'],[20,'20'],[30,'30'],[40,'40']],max))+field('Categories',select('st-count',[[3,'3'],[4,'4'],[5,'5'],[6,'6']],count));
  if(workflow==='challenge')return tabs+representation+settings+CK.nativeRandomHtml('st',[{id:'data',label:'Data questions',ids:types().map(t=>t[0])}])+types().map(([id,l])=>'<button class="gd-btn" type="button" data-st-challenge-mode="'+id+'">'+l+'</button>').join('');
  return tabs+representation+settings+field('Chart title','<input class="gd-input" id="st-title" maxlength="40" value="'+esc(data.title)+'">')+data.rows.map((r,i)=>'<div class="gd-row"><input class="gd-input" style="min-width:0;flex:1" maxlength="18" aria-label="Category '+(i+1)+'" data-st-label="'+i+'" value="'+esc(r.label)+'"><button type="button" class="gd-btn" data-st-change="'+i+',-1" aria-label="Decrease '+esc(r.label)+'">−</button><span>'+r.value+'</span><button type="button" class="gd-btn" data-st-change="'+i+',1" aria-label="Increase '+esc(r.label)+'">+</button></div>').join('')+'<div class="gd-row">'+btn('Apply labels','st-apply')+btn('Random data','st-new')+'</div><p class="gd-help" id="st-status" role="status">'+esc(status)+'</p>';
 }
 function renderStage(){
  const stage=q('#gd-stage');
  const constructing=task?.type==='complete',target=constructing?data.rows[task.missing]:null;
  const pupil=constructing?CK.pupilSpec('model',{hint:'Complete the diagram, then check your work.',ready:()=>attempt!==null,check:()=>attempt===target.value}):CK.pupilSpec('number');
  stage.innerHTML=(task?CK.bannerHtml(task,{pupil,actions:[{action:'another',label:'Another'},{action:'end',label:'Exit challenge'}]}):'')+'<div class="gd-st-diagram" style="width:100%;max-width:850px;margin:auto"></div>';
  const host=q('.gd-st-diagram',stage);
  const axis=constructing&&['bar','line'].includes(view)?M.axis(data):null;
  function draw(){
   const editing=constructing&&!task.revealed,preview=editing&&attempt!==null?M.dataset(data.rows.map((r,i)=>i===task.missing?{...r,value:attempt}:r),data):data;
   const svg=svgChart(preview,view,key,editing&&attempt===null?task.missing:-1,axis);
   svg.style.width='100%';svg.style.height='auto';svg.style.display='block';host.replaceChildren(svg);
   if(editing&&axis){
    const ns='http://www.w3.org/2000/svg',slot=646/data.rows.length,x=84+(task.missing+.5)*slot,hit=document.createElementNS(ns,'rect');
    Object.entries({x:x-slot*.42,y:80,width:slot*.84,height:300,fill:'#39887e','fill-opacity':'.045',stroke:'#39887e','stroke-dasharray':'5 5','data-st-plot-target':'1','aria-label':'Set missing graph value'}).forEach(([k,v])=>hit.setAttribute(k,v));
    hit.style.cursor='crosshair';hit.style.touchAction='none';
    hit.addEventListener('pointerdown',e=>{e.preventDefault();const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());setAttempt(Math.round((380-p.y)/300*axis.max))});svg.appendChild(hit);
   }
  }
  function setAttempt(v){const limit=axis?axis.max:40;attempt=Math.max(0,Math.min(limit,v));draw();const output=q('[data-st-attempt]',stage);if(output)output.textContent=attempt===null?'—':String(view==='pictogram'?attempt/key:attempt);CK.refreshModelPupil(task)}
  draw();
  if(constructing&&!task.revealed){
   const step=view==='pictogram'?key:1,editor=document.createElement('div');editor.className='gd-row gd-st-construction';editor.style.cssText='justify-content:center;align-items:center;gap:12px;flex-wrap:wrap;padding:8px';
   editor.innerHTML='<span>'+esc(view==='pictogram'?'Full symbols':view==='tally'?'Tally marks':view==='bar'?'Bar height':view==='line'?'Point value':'Frequency')+'</span><button type="button" class="gd-btn" data-st-edit="minus" aria-label="Decrease">−</button><strong data-st-attempt style="min-width:2.5em;text-align:center;font-size:1.4rem">'+(attempt===null?'—':String(view==='pictogram'?attempt/key:attempt))+'</strong><button type="button" class="gd-btn" data-st-edit="plus" aria-label="Increase">+</button><button type="button" class="gd-btn" data-st-edit="zero">Set zero</button>';
   host.insertAdjacentElement('afterend',editor);
   qa('[data-st-edit]',editor).forEach(b=>b.onclick=()=>setAttempt(b.dataset.stEdit==='zero'?0:(attempt??0)+(b.dataset.stEdit==='plus'?step:-step)));
  }
  if(task){
   q('[data-challenge-action="another"]',stage).onclick=()=>launch(task.type);
   q('[data-challenge-action="end"]',stage).onclick=exit;
   const reveal=q('[data-board-action="reveal"]',stage);if(reveal)reveal.onclick=()=>{task.revealed=!task.revealed;renderStage()};
  }
 }
 function applyLabels(){const rows=data.rows.map((r,i)=>({...r,label:q('[data-st-label="'+i+'"]').value.trim().slice(0,18)}));data=M.dataset(rows,{...data,title:q('#st-title').value.trim().slice(0,40)});}
 function renderControls(){
  const host=q('#gd-controls');host.innerHTML=controls();
  qa('[data-st-workflow]',host).forEach(el=>el.onclick=()=>{workflow=el.dataset.stWorkflow;if(workflow==='build'&&task)exit();else renderControls()});
  q('#st-year',host).onchange=e=>{if(task){if(setup)data=setup;task=null;setup=null;attempt=null}year=profile(e.target.value);const settings=recipe({view,max,count,key,year});({view,max,count,key}=settings);render()};
  q('#st-view',host).onchange=e=>{const next=validView(e.target.value);if(task){if(setup)data=setup;task=null;setup=null;}attempt=null;view=next;render()};
  const keyInput=q('#st-key',host);if(keyInput)keyInput.onchange=e=>{if(task){if(setup)data=setup;task=null;setup=null;attempt=null;}key=Number(e.target.value);render()};
  q('#st-max',host).onchange=e=>{max=Number(e.target.value)};
  q('#st-count',host).onchange=e=>{count=Number(e.target.value)};
  qa('[data-st-challenge-mode]',host).forEach(el=>el.onclick=()=>launch(el.dataset.stChallengeMode));
  qa('[data-st-change]',host).forEach(el=>el.onclick=()=>{try{applyLabels();change(...el.dataset.stChange.split(',').map(Number))}catch(e){message(e.message)}});
  const apply=q('#st-apply',host);if(apply)apply.onclick=()=>{try{applyLabels();status='';render()}catch(e){message(e.message)}};
  const fresh=q('#st-new',host);if(fresh)fresh.onclick=()=>{data=randomData(max,count);status='';render()};
 }
 function render(){renderControls();renderStage()}
 setPanels('','');render();
 G.lessonState.register(ID,()=>({data,view,workflow,task,setup,max,count,key,year,attempt,pupil:CK.capturePupil(task)}),saved=>{
  data=M.dataset(saved.data.rows,saved.data);view=validView(saved.view);year=profile(saved.year);workflow=saved.workflow==='challenge'?'challenge':'build';max=[10,20,30,40].includes(saved.max)?saved.max:20;count=[3,4,5,6].includes(saved.count)?saved.count:4;
  key=[1,2,5,10].includes(saved.key)?saved.key:2;setup=saved.setup?M.dataset(saved.setup.rows,saved.setup):null;task=saved.task?CK.normalise(saved.task):null;if(task&&saved.task.type==='complete')task.missing=saved.task.missing;attempt=task?.type==='complete'&&Number.isInteger(saved.attempt)&&saved.attempt>=0&&saved.attempt<=40?saved.attempt:null;CK.restorePupil(task,saved.pupil);render();
 });
};
})(window.TT99Goodies);
