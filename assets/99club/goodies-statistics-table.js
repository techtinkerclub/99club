/* Tables and tally charts: shared immutable data, editable teaching setup. */
(function(G){
'use strict';
if(!G||!G.statistics)return;
const M=G.statistics,{q,qa,esc,field,btn,setPanels}=G;
const ID='statistics-table', TYPES=[['read','Read a value'],['total','Find the total'],['difference','Compare two values'],['range','Largest minus smallest'],['mean','Find the mean']];
const examples=['Apples','Pears','Bananas','Oranges'];
const initial=()=>M.dataset(examples.map((label,i)=>({label,value:[7,4,12,9][i]})),{title:'Favourite fruit',unit:'votes'});
function randomData(max=20,count=4,mean=false,rng=Math.random){
 const rows=['Red','Blue','Green','Yellow','Purple','Orange'].slice(0,count).map(label=>({label,value:Math.floor(rng()*(max+1))}));
 if(mean){const total=rows.reduce((s,r)=>s+r.value,0),rem=total%count; if(rem){const last=rows.find(r=>r.value>=rem);if(last)last.value-=rem;else {const r=rows.find(r=>r.value+count-rem<=max);if(r)r.value+=count-rem;else rows.forEach(r=>r.value=0)}}}
 return M.dataset(rows,{title:'Favourite colours',unit:'votes'});
}
function svgTable(data,view='table'){
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
  text(32,y+44,r.label,26);
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
G.statisticsTable={svgTable,randomData};
G.statisticsTableTool=function(){
 const CK=G.challengeKit;let data=initial(),view='table',workflow='build',task=null,setup=null,max=20,count=4,status='';
 const types=()=>TYPES.filter(([id])=>id!=='mean'||max>=6);
 function message(s){status=s;const el=q('#st-status');if(el)el.textContent=s}
 function change(i,delta){const rows=data.rows.map((r,j)=>({...r,value:j===i?Math.max(0,Math.min(40,r.value+delta)):r.value}));data=M.dataset(rows,data);render()}
 function launch(type){
  if(!task)setup=data;
  const chosen=type==='all'?types()[Math.floor(Math.random()*types().length)][0]:type;
  data=randomData(max,count,chosen==='mean');const a=Math.floor(Math.random()*data.rows.length),b=(a+1+Math.floor(Math.random()*(data.rows.length-1)))%data.rows.length;
  const question=M.question(data,chosen,a,b);
  task=CK.normalise({mode:'standard',type:chosen,title:view==='tally'?'Tally chart':'Frequency table',prompt:question.prompt,answer:String(question.answer),answerMode:'manual',revealed:false});workflow='challenge';render();
 }
 function exit(){if(setup)data=setup;setup=null;task=null;workflow='build';render()}
 function controls(){
  const tabs='<div class="gd-row" role="tablist" aria-label="Data workflow">'+[['build','Explore'],['challenge','Challenge']].map(([v,l])=>'<button class="gd-btn'+(workflow===v?' gd-btn--primary':'')+'" type="button" data-st-workflow="'+v+'">'+l+'</button>').join('')+'</div>';
  const select=(id,options,current)=>'<select class="gd-select" id="'+id+'">'+options.map(([v,l])=>'<option value="'+v+'"'+(String(v)===String(current)?' selected':'')+'>'+l+'</option>').join('')+'</select>';
  const representation=field('Representation',select('st-view',[['table','Frequency table'],['tally','Tally chart']],view));
  const settings=field('Maximum frequency',select('st-max',[[10,'10'],[20,'20'],[30,'30'],[40,'40']],max))+field('Categories',select('st-count',[[3,'3'],[4,'4'],[5,'5'],[6,'6']],count));
  if(workflow==='challenge')return tabs+representation+settings+CK.nativeRandomHtml('st',[{id:'data',label:'Data questions',ids:types().map(t=>t[0])}])+types().map(([id,l])=>'<button class="gd-btn" type="button" data-st-challenge-mode="'+id+'">'+l+'</button>').join('');
  return tabs+representation+settings+field('Chart title','<input class="gd-input" id="st-title" maxlength="40" value="'+esc(data.title)+'">')+data.rows.map((r,i)=>'<div class="gd-row"><input class="gd-input" style="min-width:0;flex:1" maxlength="18" aria-label="Category '+(i+1)+'" data-st-label="'+i+'" value="'+esc(r.label)+'"><button type="button" class="gd-btn" data-st-change="'+i+',-1" aria-label="Decrease '+esc(r.label)+'">−</button><span>'+r.value+'</span><button type="button" class="gd-btn" data-st-change="'+i+',1" aria-label="Increase '+esc(r.label)+'">+</button></div>').join('')+'<div class="gd-row">'+btn('Apply labels','st-apply')+btn('Random data','st-new')+'</div><p class="gd-help" id="st-status" role="status">'+esc(status)+'</p>';
 }
 function renderStage(){
  const stage=q('#gd-stage');
  stage.innerHTML=(task?CK.bannerHtml(task,{pupil:CK.pupilSpec('number'),actions:[{action:'another',label:'Another'},{action:'end',label:'Exit challenge'}]}):'')+'<div class="gd-st-diagram" style="width:100%;max-width:850px;margin:auto"></div>';
  const svg=svgTable(data,view);svg.style.width='100%';svg.style.height='auto';q('.gd-st-diagram',stage).appendChild(svg);
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
  q('#st-view',host).onchange=e=>{view=e.target.value;renderStage()};
  q('#st-max',host).onchange=e=>{max=Number(e.target.value)};
  q('#st-count',host).onchange=e=>{count=Number(e.target.value)};
  qa('[data-st-challenge-mode]',host).forEach(el=>el.onclick=()=>launch(el.dataset.stChallengeMode));
  qa('[data-st-change]',host).forEach(el=>el.onclick=()=>{try{applyLabels();change(...el.dataset.stChange.split(',').map(Number))}catch(e){message(e.message)}});
  const apply=q('#st-apply',host);if(apply)apply.onclick=()=>{try{applyLabels();status='';render()}catch(e){message(e.message)}};
  const fresh=q('#st-new',host);if(fresh)fresh.onclick=()=>{data=randomData(max,count);status='';render()};
 }
 function render(){renderControls();renderStage()}
 setPanels('','');render();
 G.lessonState.register(ID,()=>({data,view,workflow,task,setup,max,count,pupil:CK.capturePupil(task)}),saved=>{
  data=M.dataset(saved.data.rows,saved.data);view=saved.view==='tally'?'tally':'table';workflow=saved.workflow==='challenge'?'challenge':'build';max=[10,20,30,40].includes(saved.max)?saved.max:20;count=[3,4,5,6].includes(saved.count)?saved.count:4;
  setup=saved.setup?M.dataset(saved.setup.rows,saved.setup):null;task=saved.task?CK.normalise(saved.task):null;CK.restorePupil(task,saved.pupil);render();
 });
};
})(window.TT99Goodies);
