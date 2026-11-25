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
const VIEWS=[['table','Frequency table'],['tally','Tally chart'],['pictogram','Pictogram'],['block','Block diagram'],['bar','Bar chart'],['line','Line graph'],['pie','Pie chart'],['timetable','Timetable']];
const EXTRA={bar:[['read-scale','Read the axis interval']],line:[['read-scale','Read the axis interval'],['change','Find the change between consecutive days']],pie:[['angle','Find a sector angle'],['percent','Find a sector percentage']],pictogram:[['symbols','Count full symbols']]};
const PROFILES=[['custom','All / custom'],['2','Year 2 suggestions'],['3','Year 3 suggestions'],['4','Year 4 suggestions'],['5','Year 5 suggestions'],['6','Year 6 suggestions']];
const profile=v=>PROFILES.some(p=>p[0]===String(v))?String(v):'custom';
const viewsFor=()=>VIEWS;
const RECOMMENDED={'2':['table','tally','pictogram','block'],'3':['table','pictogram','bar'],'4':['bar','line'],'5':['table','line','timetable'],'6':['line','pie','table']};
const guidance=year=>profile(year)==='custom'?'Choose any representation or question type.': 'Suggested focus: '+(RECOMMENDED[year]||[]).map(viewName).join(', ')+(year==='5'?'.':year==='6'?', including mean as an average.':'.')+' All representations remain available.';
const DIFFICULTIES=[['custom','Custom'],['easy','Gentle'],['medium','Standard'],['hard','Stretch']];
const difficultySettings=level=>({easy:{max:10,count:3,key:1},medium:{max:20,count:4,key:2},hard:{max:40,count:6,key:5}}[level]||{});
const questionTypes=(view,year='custom')=>{year=profile(year);const all=view==='pie'?[...EXTRA.pie,['pie-fraction','Fraction of the total'],['pie-build','Construct a pie chart']]:view==='timetable'?[['time-read','Read a departure time'],['time-elapsed','Journey duration'],['time-complete','Complete the timetable']]:[...TYPES,...(EXTRA[view]||[]),['rank','Order categories by value'],['mean-missing','Find a missing measurement from the mean'],['combined','Two-step sum and comparison'],['complete','Complete the missing entry']];return all;};
const viewName=view=>VIEWS.find(v=>v[0]===view)?.[1]||'Frequency table';
const validView=view=>VIEWS.some(v=>v[0]===view)?view:'table';
const COLOURS=['#39887e','#537eaa','#c68a48','#9275ac','#c66c75','#718b48'];
const clock=v=>String(Math.floor((540+v)/60)).padStart(2,'0')+':'+String((540+v)%60).padStart(2,'0');
function timetable(count,rng=Math.random){let elapsed=0;return M.dataset(['School','Library','Market','Museum','Park','Station'].slice(0,count).map((label,i)=>({label,value:i===0?0:(elapsed+=5*(1+Math.floor(rng()*4)))})),{title:'Town bus timetable',unit:'minutes',ordered:true});}
function svgChart(data,view,key=2,missing=-1,axisOverride=null){
 if(view==='table'||view==='tally')return svgTable(data,view,missing);
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),W=760,H=['pictogram','timetable'].includes(view)?120+data.rows.length*60:480;
 Object.entries({viewBox:'0 0 '+W+' '+H,xmlns:ns,role:'img','aria-label':data.title+' — '+viewName(view)}).forEach(([k,v])=>svg.setAttribute(k,v));
 function add(tag,attrs,value){const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));if(value!==undefined)n.textContent=value;svg.appendChild(n);return n}
 const text=(x,y,v,size=24,extra={})=>add('text',{x,y,fill:'#24343b','font-family':'Arial,sans-serif','font-size':size,...extra},v);
 add('rect',{width:W,height:H,fill:'#fff'});text(24,36,data.title||'Data',28,{'font-weight':700});
 if(view==='timetable'){
  add('rect',{x:18,y:52,width:724,height:48,rx:5,fill:'#e7f2ee'});text(30,84,'Stop',24,{'font-weight':700});text(445,84,'Bus A',24,{'text-anchor':'middle','font-weight':700});text(620,84,'Bus B',24,{'text-anchor':'middle','font-weight':700});
  data.rows.forEach((row,i)=>{const y=100+i*60;add('rect',{x:18,y,width:724,height:60,fill:i%2?'#f5f8f7':'#fff',stroke:'#d8e3e1'});text(30,y+39,row.label,26);text(445,y+39,clock(row.value),26,{'text-anchor':'middle'});if(i!==missing)text(620,y+39,clock(row.value+30),26,{'text-anchor':'middle'});else add('rect',{x:565,y:y+10,width:110,height:40,rx:4,fill:'none',stroke:'#8da6a3','stroke-dasharray':'6 5'});});return svg;
 }
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
  const construction=axisOverride?.construction,angles=axisOverride?.angles||[],sectors=M.pie(data);let cumulative=0;
  if(construction){add('circle',{cx,cy,r,fill:'#f7faf9',stroke:'#829d99','stroke-width':2});add('line',{x1:cx,x2:cx,y1:cy,y2:cy-r,stroke:'#829d99','stroke-width':2});add('circle',{cx,cy,r:3,fill:'#24343b'});}
  sectors.forEach((real,i)=>{const angle=construction?Math.max(0,Math.min(360-cumulative,Number(angles[i])||0)):real.angle,s=construction?{...real,angle,start:cumulative,end:cumulative+angle}:real;cumulative+=angle;const col=COLOURS[i%COLOURS.length];if(s.angle>=359.999999)add('circle',{cx,cy,r,fill:col,stroke:'#fff','stroke-width':2});else if(s.angle>0){const a=point(s.start),b=point(s.end);add('path',{d:'M '+cx+' '+cy+' L '+a.join(' ')+' A '+r+' '+r+' 0 '+(s.angle>180?1:0)+' 1 '+b.join(' ')+' Z',fill:col,stroke:'#fff','stroke-width':2})}
   add('rect',{x:460,y:100+i*52,width:23,height:23,rx:3,fill:col});const label=s.label+' ('+s.value+')';text(495,119+i*52,label,Math.min(24,245/Math.max(1,label.length*.6)));
  });text(460,440,'Total: '+total+' '+(data.unit||'items'),23);return svg;
 }
 const left=84,right=730,top=80,bottom=380,axis=axisOverride||(view==='block'?{step:1,max:Math.max(1,M.summary(data).max)}:M.axis(data)),n=data.rows.length,slot=(right-left)/n;
 const py=v=>bottom-v/axis.max*(bottom-top),px=i=>left+(i+.5)*slot;
 for(let v=0;v<=axis.max;v+=axis.step){const y=py(v);add('line',{x1:left,x2:right,y1:y,y2:y,stroke:'#d6e3e1','stroke-width':1.5});text(left-12,y+7,String(v),22,{'text-anchor':'end'})}
 add('path',{d:'M '+left+' '+top+' V '+bottom+' H '+right,fill:'none',stroke:'#24343b','stroke-width':2});
 text(left,65,data.unit||'Value',22);
 data.rows.forEach((r,i)=>{const x=px(i),y=py(r.value);
  if(view==='block'&&i!==missing){const size=(bottom-top)/axis.max;for(let j=0;j<r.value;j++)add('rect',{x:x-Math.min(size,slot*.6)/2,y:py(j+1),width:Math.min(size,slot*.6),height:size,fill:COLOURS[i%COLOURS.length],stroke:'#fff','stroke-width':1});}
  if(view==='bar'&&i!==missing)add('rect',{x:x-slot*.29,y,width:slot*.58,height:bottom-y,rx:2,fill:COLOURS[i%COLOURS.length],stroke:'#365c5b','stroke-width':1});
  text(x,bottom+25,r.label,22,{'text-anchor':'end',transform:'rotate(-35 '+x+' '+(bottom+25)+')'});
 });
 if(view==='line'){data.rows.forEach((r,i)=>{if(i===missing)return;if(i>0&&i-1!==missing)add('line',{x1:px(i-1),y1:py(data.rows[i-1].value),x2:px(i),y2:py(r.value),stroke:'#287b72','stroke-width':4});add('circle',{cx:px(i),cy:py(r.value),r:6,fill:'#fff',stroke:'#287b72','stroke-width':3})})}
 return svg;
}
function recipe(model={},type='all'){
 const year=profile(model.year),view=validView(model.view);
 return {type,year,view,difficulty:DIFFICULTIES.some(d=>d[0]===model.difficulty)?model.difficulty:'custom',key:[1,2,5,10].includes(+model.key)?+model.key:2,max:[10,20,30,40].includes(+model.max)?+model.max:20,count:[3,4,5,6].includes(+model.count)?+model.count:4};
}
function generate(r,rng=Math.random){
 const available=questionTypes(r.view,r.year),type=r.type==='all'?available[Math.floor(rng()*available.length)][0]:r.type;
 if(!available.some(t=>t[0]===type))throw Error('Choose a question compatible with this graph.');
 let data=randomData(r.max,r.count,['mean','mean-missing'].includes(type),rng);
 if(r.view==='timetable')data=timetable(r.count,rng);
 if(r.view==='line'){const continuous=rng()<.65||['mean','mean-missing'].includes(type);data=M.dataset(data.rows.map((row,i)=>({...row,label:continuous?String(9+i)+':00':['Mon','Tue','Wed','Thu','Fri','Sat'][i]})),{title:continuous?'Temperature during the day':'Daily visitors',unit:continuous?'°C':'visitors',ordered:true});}
 if(['mean','mean-missing'].includes(type)&&r.view!=='line')data=M.dataset(data.rows.map((row,i)=>({...row,label:'Day '+(i+1)})),{title:'Rainfall over several days',unit:'mm',ordered:true});
 if(r.view==='pie'){const total=type==='percent'?20:12;const values=Array(r.count).fill(1);for(let i=r.count;i<total;i++)values[Math.floor(rng()*r.count)]++;data=M.dataset(data.rows.map((row,i)=>({...row,value:values[i]})),data);}
 if(r.view==='block'){data=randomData(Math.min(10,r.max),r.count,['mean','mean-missing'].includes(type),rng);if(['mean','mean-missing'].includes(type))data=M.dataset(data.rows.map((row,i)=>({...row,label:'Day '+(i+1)})),{title:'Rainfall over several days',unit:'mm',ordered:true});}
 if(r.view==='pictogram'){let values=data.rows.map(row=>Math.floor(row.value/r.key));if(['mean','mean-missing'].includes(type)){const remainder=values.reduce((a,b)=>a+b,0)%r.count;for(let i=0,left=remainder;i<values.length&&left;i++){const take=Math.min(left,values[i]);values[i]-=take;left-=take}}data=M.dataset(data.rows.map((row,i)=>({...row,value:values[i]*r.key})),data);}
 const a=Math.floor(rng()*data.rows.length),b=(a+1+Math.floor(rng()*(data.rows.length-1)))%data.rows.length;
 let question;
 if(type==='pie-build'){question={type,prompt:'Construct the complete pie chart using the frequencies. Begin at the top and work clockwise in legend order.',answer:M.pie(data).map(s=>Math.round(s.angle)).join(', ')};}
 else if(type==='pie-fraction'){question={type,prompt:'What fraction of the total is represented by '+data.rows[a].label+'? Give a fraction.',answer:data.rows[a].value+'/'+M.summary(data).total};}
 else if(type==='time-read'){question={type,prompt:'At what time does Bus B depart from '+data.rows[a].label+'? Use 24-hour time.',answer:clock(data.rows[a].value+30)};}
 else if(type==='time-elapsed'){const lo=Math.min(a,b),hi=Math.max(a,b);question={type,prompt:'How many minutes does Bus A take from '+data.rows[lo].label+' to '+data.rows[hi].label+'?',answer:data.rows[hi].value-data.rows[lo].value};}
 else if(type==='time-complete'){question={type,missing:a,prompt:'Bus B runs 30 minutes after Bus A. Complete the missing departure time in 24-hour format.',answer:clock(data.rows[a].value+30)};}
 else if(type==='rank'){question={type,prompt:'What is the rank of '+data.rows[a].label+' from largest to smallest? Equal values share a rank.',answer:1+data.rows.filter(row=>row.value>data.rows[a].value).length};}
 else if(type==='mean-missing'){question={type,missing:a,prompt:'The mean of all '+data.rows.length+' measurements is '+M.summary(data).mean+' '+data.unit+'. Find the missing measurement.',answer:data.rows[a].value};}
 else if(type==='angle'||type==='percent'){const row=data.rows[a],total=M.summary(data).total;question={type,prompt:(type==='angle'?'What is the angle in degrees of the sector for ':'What percentage of the total is represented by ')+row.label+'?',answer:row.value*(type==='angle'?360:100)/total};}
 else if(type==='read-scale')question={type,prompt:'How many '+data.unit+' does one labelled vertical axis interval represent?',answer:M.axis(data).step};
 else if(type==='symbols')question={type,prompt:'How many full symbols represent '+data.rows[a].label+'?',answer:data.rows[a].value/r.key};
 else if(type==='change'){const i=Math.floor(rng()*(data.rows.length-1)),x=data.rows[i],y=data.rows[i+1];question={type,prompt:'By how much did the value change from '+x.label+' to '+y.label+'? Give your answer in '+data.unit+'.',answer:Math.abs(y.value-x.value)};}
 else if(type==='combined'){const c=(b+1)%data.rows.length===a?(b+2)%data.rows.length:(b+1)%data.rows.length;const x=data.rows[a],y=data.rows[b],z=data.rows[c];question={type,prompt:'Add the values for '+x.label+' and '+y.label+'. What is the difference between this sum and the value for '+z.label+'?',answer:Math.abs(x.value+y.value-z.value)};}
 else if(type==='complete'){const row=data.rows[a];question={type,missing:a,prompt:'Complete the missing '+(r.view==='block'?'column of blocks':r.view==='bar'?'bar':r.view==='line'?'point and connecting lines':r.view==='pictogram'?'symbols':r.view==='tally'?'tally marks':'frequency')+' for '+row.label+'. Its frequency is '+row.value+'.',answer:row.value};}
 else question=M.question(data,type,a,b);
 return {...question,data,view:r.view,key:r.key};
}
function paper(item,teacher){
 const d=item.data,svg=svgChart(d.data,d.view,d.key,!teacher&&['complete','mean-missing','time-complete'].includes(d.type)?d.missing:-1,!teacher&&d.type==='pie-build'?{construction:true,angles:[]}:null);
 if(item.kind==='diagram')return svg;
 return G.exportTools.composeWorksheetCardSvg(svg,{title:viewName(d.view),prompt:d.prompt,responseLabel:'Answer',responseMode:['complete','pie-build'].includes(d.type)?'none':'box',responseLines:1,paperStyle:'plain',answer:String(d.answer),showAnswer:teacher});
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
 answerNote:item=>item.data.type==='pie-build'?'Clockwise angles in legend order: '+item.data.answer+' degrees. All sectors must total 360 degrees. Accept accurate proportional construction.':item.data.type==='pie-fraction'?'Divide the category frequency by the total; accept all equivalent fractions.':item.data.type==='time-read'?'Read the departure in the Bus B column.':item.data.type==='time-elapsed'?'Subtract the earlier departure from the later departure in minutes.':item.data.type==='time-complete'?'Add 30 minutes to the Bus A departure, carrying across the hour if needed.':item.data.type==='rank'?'Count categories with a strictly greater value and add one. Ties share the same rank.':item.data.type==='mean-missing'?'Multiply the mean by the number of measurements, then subtract the sum of the visible measurements.':item.data.type==='combined'?'Add the first two named values, then find the absolute difference between that sum and the third value.':item.data.type==='complete'?'Complete the missing entry to represent the stated frequency. Check its position, height, or symbol count against the completed diagram.':item.data.type==='angle'?'Divide the category frequency by the total and multiply by 360 degrees.':item.data.type==='percent'?'Divide the category frequency by the total and multiply by 100.':item.data.type==='read-scale'?'Subtract consecutive labelled axis values.':item.data.type==='symbols'?'Count the full symbols in the named row.':item.data.type==='change'?'Subtract the smaller of the two consecutive daily values from the larger.':item.data.type==='mean'?'Add the observations and divide by the number of observations.':item.data.type==='total'?'Add all frequencies.':item.data.type==='range'?'Subtract the smallest frequency from the largest.':item.data.type==='difference'?'Subtract the smaller named frequency from the larger.':'Read the value for the named category. Accept equivalent numerical working.'
});
G.statisticsTable={svgTable,svgChart,randomData,recipe,generate,profiles:PROFILES,viewsFor,questionTypes,guidance,difficulties:DIFFICULTIES,difficultySettings};
G.statisticsTableTool=function(){
 const CK=G.challengeKit;let data=initial(),view='table',workflow='build',task=null,setup=null,max=20,count=4,key=2,year='custom',difficulty='custom',status='',attempt=null,chartSetup=null,timetableSetup=null;
 const types=()=>questionTypes(view,year);
 function message(s){status=s;const el=q('#st-status');if(el)el.textContent=s}
 function change(i,delta){const isTime=view==='timetable',lo=isTime&&i>0?data.rows[i-1].value+5:0,hi=isTime&&i<data.rows.length-1?data.rows[i+1].value-5:isTime?180:40;const rows=data.rows.map((r,j)=>({...r,value:j===i?Math.max(lo,Math.min(hi,r.value+delta*(isTime?5:1))):r.value}));data=M.dataset(rows,data);render()}
 function launch(type){
  if(!task)setup=data;
  attempt=null;
  const allowed=types();const chosenType=type==='all'?allowed[Math.floor(Math.random()*allowed.length)][0]:type;const question=generate(recipe({view,max,count,key,year,difficulty},chosenType));data=question.data;const chosen=question.type;
  task=CK.normalise({mode:'standard',type:chosen,title:viewName(view),prompt:question.prompt,answer:String(question.answer),answerMode:'manual',revealed:false});if(chosen==='complete')task.missing=question.missing;workflow='challenge';render();
 }
 function exit(){if(setup)data=setup;setup=null;task=null;attempt=null;workflow='build';render()}
 function controls(){
  const tabs='<div class="gd-row" role="tablist" aria-label="Data workflow">'+[['build','Explore'],['challenge','Challenge']].map(([v,l])=>'<button class="gd-btn'+(workflow===v?' gd-btn--primary':'')+'" type="button" data-st-workflow="'+v+'">'+l+'</button>').join('')+'</div>';
  const select=(id,options,current)=>'<select class="gd-select" id="'+id+'">'+options.map(([v,l])=>'<option value="'+v+'"'+(String(v)===String(current)?' selected':'')+'>'+l+'</option>').join('')+'</select>';
  const representation=field('Curriculum suggestions',''+select('st-year',PROFILES,year))+field('Representation',select('st-view',viewsFor(year),view))+'<p class="gd-help">'+esc(guidance(year))+'</p>';
  const settings=field('Difficulty',select('st-difficulty',DIFFICULTIES,difficulty))+(view==='pictogram'?field('Symbol value',select('st-key',[[1,'1'],[2,'2'],[5,'5'],[10,'10']],key)):'')+field('Maximum frequency',select('st-max',[[10,'10'],[20,'20'],[30,'30'],[40,'40']],max))+field('Categories',select('st-count',[[3,'3'],[4,'4'],[5,'5'],[6,'6']],count));
  if(workflow==='challenge')return tabs+representation+settings+CK.nativeRandomHtml('st',[{id:'data',label:'Data questions',ids:types().map(t=>t[0])}])+types().map(([id,l])=>'<button class="gd-btn" type="button" data-st-challenge-mode="'+id+'">'+l+'</button>').join('');
  return tabs+representation+settings+field('Chart title','<input class="gd-input" id="st-title" maxlength="40" value="'+esc(data.title)+'">')+data.rows.map((r,i)=>'<div class="gd-row"><input class="gd-input" style="min-width:0;flex:1" maxlength="18" aria-label="Category '+(i+1)+'" data-st-label="'+i+'" value="'+esc(r.label)+'"><button type="button" class="gd-btn" data-st-change="'+i+',-1" aria-label="Decrease '+esc(r.label)+'">−</button><span>'+(view==='timetable'?clock(r.value):r.value)+'</span><button type="button" class="gd-btn" data-st-change="'+i+',1" aria-label="Increase '+esc(r.label)+'">+</button></div>').join('')+'<div class="gd-row">'+btn('Apply labels','st-apply')+btn('Random data','st-new')+'</div><p class="gd-help" id="st-status" role="status">'+esc(status)+'</p>';
 }
 function renderStage(){
  const stage=q('#gd-stage');
  const pieBuild=task?.type==='pie-build',constructing=task?.type==='complete',target=constructing?data.rows[task.missing]:null;
  const pieExpected=pieBuild?M.pie(data).map(s=>Math.round(s.angle)):[];
  const pupil=pieBuild?CK.pupilSpec('model',{hint:'Set every sector angle, then check the pie chart.',ready:()=>Array.isArray(attempt)&&attempt.length===pieExpected.length&&attempt.every(Number.isInteger),check:()=>Array.isArray(attempt)&&attempt.every((v,i)=>v===pieExpected[i])}):constructing?CK.pupilSpec('model',{hint:'Complete the diagram, then check your work.',ready:()=>attempt!==null,check:()=>attempt===target.value}):CK.pupilSpec(['time-read','time-complete'].includes(task?.type)?'clock-24':task?.type==='pie-fraction'?'fraction':'number');
  stage.innerHTML=(task?CK.bannerHtml(task,{pupil,actions:[{action:'another',label:'Another'},{action:'end',label:'Exit challenge'}]}):'')+'<div class="gd-st-diagram" style="width:100%;max-width:850px;margin:auto"></div>';
  const host=q('.gd-st-diagram',stage);
  const axis=constructing&&['bar','line','block'].includes(view)?(view==='block'?{step:1,max:Math.max(1,M.summary(data).max)}:M.axis(data)):null;
  function draw(){
   const editing=constructing&&!task.revealed,preview=editing&&attempt!==null?M.dataset(data.rows.map((r,i)=>i===task.missing?{...r,value:attempt}:r),data):data;
   const hidden=editing&&attempt===null||(!task?.revealed&&['mean-missing','time-complete'].includes(task?.type));
   const svg=svgChart(preview,view,key,hidden?task.missing:-1,pieBuild&&!task.revealed?{construction:true,angles:Array.isArray(attempt)?attempt:[]}:axis);
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
  if(pieBuild&&!task.revealed){
   const editor=document.createElement('div');editor.className='gd-st-construction';editor.style.cssText='display:flex;flex-wrap:wrap;justify-content:center;gap:8px;padding:8px';
   if(!Array.isArray(attempt))attempt=Array(data.rows.length).fill(null);
   data.rows.forEach((row,i)=>{const label=document.createElement('label');label.style.cssText='display:grid;gap:4px;min-width:110px';label.textContent=row.label;const select=document.createElement('select');select.className='gd-select';select.setAttribute('data-st-sector',i);select.setAttribute('aria-label',row.label+' sector angle');select.innerHTML='<option value="">Choose angle</option>'+Array.from({length:73},(_,n)=>'<option value="'+n*5+'">'+n*5+'°</option>').join('');select.value=attempt[i]===null?'':String(attempt[i]);select.onchange=()=>{attempt[i]=select.value===''?null:Number(select.value);draw();total.textContent='Allocated: '+attempt.reduce((sum,v)=>sum+(v||0),0)+'° / 360°';CK.refreshModelPupil(task)};label.appendChild(select);editor.appendChild(label)});
   const total=document.createElement('strong');total.style.cssText='flex-basis:100%;text-align:center';total.textContent='Allocated: '+attempt.reduce((sum,v)=>sum+(v||0),0)+'° / 360°';editor.appendChild(total);host.insertAdjacentElement('afterend',editor);
  }
  if(constructing&&!task.revealed){
   const step=view==='pictogram'?key:1,editor=document.createElement('div');editor.className='gd-row gd-st-construction';editor.style.cssText='justify-content:center;align-items:center;gap:12px;flex-wrap:wrap;padding:8px';
   editor.innerHTML='<span>'+esc(view==='pictogram'?'Full symbols':view==='tally'?'Tally marks':view==='block'?'Blocks':view==='bar'?'Bar height':view==='line'?'Point value':'Frequency')+'</span><button type="button" class="gd-btn" data-st-edit="minus" aria-label="Decrease">−</button><strong data-st-attempt style="min-width:2.5em;text-align:center;font-size:1.4rem">'+(attempt===null?'—':String(view==='pictogram'?attempt/key:attempt))+'</strong><button type="button" class="gd-btn" data-st-edit="plus" aria-label="Increase">+</button><button type="button" class="gd-btn" data-st-edit="zero">Set zero</button>';
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
  q('#st-year',host).onchange=e=>{if(task){if(setup)data=setup;task=null;setup=null;attempt=null}year=profile(e.target.value);render()};
  q('#st-difficulty',host).onchange=e=>{difficulty=e.target.value;const s=difficultySettings(difficulty);max=s.max??max;count=s.count??count;key=s.key??key;if(task){if(setup)data=setup;task=null;setup=null;attempt=null}render()};
  q('#st-view',host).onchange=e=>{const next=validView(e.target.value);if(task){if(setup)data=setup;task=null;setup=null;}attempt=null;if(next==='timetable'&&view!=='timetable'){chartSetup=data;data=timetableSetup||timetable(count)}else if(view==='timetable'&&next!=='timetable'){timetableSetup=data;data=chartSetup||initial()}view=next;render()};
  const keyInput=q('#st-key',host);if(keyInput)keyInput.onchange=e=>{if(task){if(setup)data=setup;task=null;setup=null;attempt=null;}key=Number(e.target.value);difficulty='custom';render()};
  q('#st-max',host).onchange=e=>{max=Number(e.target.value);difficulty='custom';renderControls()};
  q('#st-count',host).onchange=e=>{count=Number(e.target.value);difficulty='custom';renderControls()};
  qa('[data-st-challenge-mode]',host).forEach(el=>el.onclick=()=>launch(el.dataset.stChallengeMode));
  qa('[data-st-change]',host).forEach(el=>el.onclick=()=>{try{applyLabels();change(...el.dataset.stChange.split(',').map(Number))}catch(e){message(e.message)}});
  const apply=q('#st-apply',host);if(apply)apply.onclick=()=>{try{applyLabels();status='';render()}catch(e){message(e.message)}};
  const fresh=q('#st-new',host);if(fresh)fresh.onclick=()=>{data=view==='timetable'?timetable(count):randomData(max,count);status='';render()};
 }
 function render(){renderControls();renderStage()}
 setPanels('','');render();
 G.lessonState.register(ID,()=>({data,view,workflow,task,setup,max,count,key,year,difficulty,attempt,chartSetup,timetableSetup,pupil:CK.capturePupil(task)}),saved=>{
  data=M.dataset(saved.data.rows,saved.data);chartSetup=saved.chartSetup?M.dataset(saved.chartSetup.rows,saved.chartSetup):null;timetableSetup=saved.timetableSetup?M.dataset(saved.timetableSetup.rows,saved.timetableSetup):null;view=validView(saved.view);year=profile(saved.year);difficulty=DIFFICULTIES.some(d=>d[0]===saved.difficulty)?saved.difficulty:'custom';workflow=saved.workflow==='challenge'?'challenge':'build';max=[10,20,30,40].includes(saved.max)?saved.max:20;count=[3,4,5,6].includes(saved.count)?saved.count:4;
  key=[1,2,5,10].includes(saved.key)?saved.key:2;setup=saved.setup?M.dataset(saved.setup.rows,saved.setup):null;task=saved.task?CK.normalise(saved.task):null;if(task&&saved.task.type==='complete')task.missing=saved.task.missing;attempt=task?.type==='pie-build'&&Array.isArray(saved.attempt)&&saved.attempt.length===data.rows.length&&saved.attempt.every(v=>v===null||Number.isInteger(v)&&v>=0&&v<=360)?saved.attempt.slice():task?.type==='complete'&&Number.isInteger(saved.attempt)&&saved.attempt>=0&&saved.attempt<=40?saved.attempt:null;CK.restorePupil(task,saved.pupil);render();
 });
};
})(window.TT99Goodies);
