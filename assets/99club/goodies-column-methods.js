/* Column-method classroom diagrams and document adapters.
   The pure writtenMethods engine is the sole source of calculation steps. */
(function(G){
'use strict';
if(!G||!G.writtenMethods)return;
const M=G.writtenMethods,{q,qa,esc,field,btn,setPanels}=G;
const LABEL={addition:'Column addition',subtraction:'Column subtraction'};
const IDS={addition:'column-addition',subtraction:'column-subtraction'};
const EXCHANGES=[['any','Mixed'],['with','With exchanges'],['without','Without exchanges'],['across-zero','Across zero']];
const digits=n=>String(n).split('').reverse().map(Number);
function diagram(model,{step=0,grid=true,labels=true,work=false}={}){
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
 if(work)text(left,395,'Use the space above the digits for exchanges.',19,{'text-anchor':'start',fill:'#526970'});
 return svg;
}
function paper(model,teacher){return G.exportTools.composeWorksheetCardSvg(diagram(model,{step:teacher?model.steps.length:0,work:!teacher}),{title:LABEL[model.method],prompt:'Calculate '+model.a+' '+(model.method==='addition'?'+':'−')+' '+model.b+' using the column method. Show your working.',responseMode:'none',paperStyle:'plain',answer:String(model.answer),showAnswer:teacher,diagramMaxHeight:600})}
function generationTypes(method){return EXCHANGES.filter(([id])=>id!=='across-zero'||method==='subtraction').map(([id,label])=>({id,label}))}
function generate(method,settings,type,rng){return {...M.generate(method,{...settings,exchange:type==='all'?'any':type},rng),type:type==='all'?'any':type}}
for(const method of Object.keys(IDS)){
 const id=IDS[method];
 if(G.publishing)G.publishing.register(id,{
  label:LABEL[method],types:()=>generationTypes(method),title:item=>LABEL[method],
  signature:d=>d.method+':'+d.a+':'+d.b,
  recipe:(model,type)=>({type,settings:M.settings(model.settings||model)}),
  generate(recipe,rng){return generate(method,recipe.settings,recipe.type,rng)},
  capture(saved){const m=M.calculate(method,saved.a,saved.b);if(saved.task)return [G.publishing.record(id,'challenge',{...m,type:saved.task.type},{type:saved.task.type,settings:M.settings(saved.settings)})];return [G.publishing.record(id,'diagram',{...m,shown:saved.shown,grid:saved.grid,labels:saved.labels})]},
  render(item,teacher){return item.kind==='challenge'?paper(item.data,teacher):diagram(item.data,{step:item.data.shown,grid:item.data.grid,labels:item.data.labels})},
  answerSummary:item=>String(item.data.answer),
  answerGraphic:item=>diagram(item.data,{step:item.data.steps.length}),
  answerNote:item=>method==='addition'?'Check place-value alignment, correct exchanges and the final sum. Equivalent valid written working is acceptable.':'Check place-value alignment, exchanges (including through zero if needed) and the final difference. Equivalent valid written working is acceptable.'
 });
}
G.columnMethods={diagram,paper};
G.columnMethodTool=function(method){
 const id=IDS[method],CK=G.challengeKit,X=G.exportTools;
 let model=M.calculate(method,method==='addition'?368:1002,method==='addition'?457:586),shown=0,grid=true,labels=true,workflow='build',settings=M.settings({year:4}),task=null,status='',setup=null;
 const option=(v,label,current)=>'<option value="'+esc(v)+'"'+(String(v)===String(current)?' selected':'')+'>'+esc(label)+'</option>';
 const select=(name,values,current)=>'<select class="gd-select" data-wm-setting="'+name+'">'+values.map(([v,l])=>option(v,l,current)).join('')+'</select>';
 function controls(){
  const tabs='<div class="gd-row gd-wm-tabs" role="tablist" aria-label="Written calculation workflow">'+[['build','Explore'],['challenge','Challenge'],['export','Export']].map(([v,l])=>'<button type="button" class="gd-btn'+(workflow===v?' gd-btn--primary':'')+'" data-wm-workflow="'+v+'">'+l+'</button>').join('')+'</div>';
  if(workflow==='export')return tabs+'<div class="gd-row">'+btn('Copy image','wm-copy')+btn('PNG','wm-png')+btn('SVG','wm-svg')+btn('Print / PDF','wm-print')+'</div>'+(task?'<div class="gd-row">'+btn('Print answer key','wm-key-print')+'</div>':'')+'<p class="gd-help" id="wm-status">'+esc(status)+'</p>';
  if(workflow==='challenge')return tabs+field('Year group',select('year',[[3,'Year 3'],[4,'Year 4'],[5,'Year 5'],[6,'Year 6']],settings.year))+CK.nativeRandomHtml('wm',[{id:'practice',label:'Practice',ids:generationTypes(method).map(t=>t.id)}])+generationTypes(method).map(t=>'<button type="button" class="gd-btn" data-wm-challenge-mode="'+t.id+'">'+esc(t.label)+'</button>').join('')+'<p class="gd-help">Choose a question type. Pupils can enter their answer using the on-screen keypad.</p>';
  return tabs+field('First number','<input class="gd-input" type="number" min="0" max="9999999" inputmode="numeric" id="wm-a" value="'+model.a+'">')+field('Second number','<input class="gd-input" type="number" min="0" max="9999999" inputmode="numeric" id="wm-b" value="'+model.b+'">')+'<div class="gd-row">'+btn('Apply numbers','wm-apply')+btn('New example','wm-new')+'</div>'+field('Year group',select('year',[[3,'Year 3'],[4,'Year 4'],[5,'Year 5'],[6,'Year 6']],settings.year))+field('Exchanges',select('exchange',EXCHANGES.filter(([v])=>v!=='across-zero'||method==='subtraction'),settings.exchange))+'<label class="gd-wm-toggle"><input type="checkbox" data-wm-display="grid"'+(grid?' checked':'')+'> Place-value grid</label><label class="gd-wm-toggle"><input type="checkbox" data-wm-display="labels"'+(labels?' checked':'')+'> Column headings</label><p class="gd-help" id="wm-status" role="status">'+esc(status)+'</p>';
 }
 function launch(type){
  if(!task)setup={a:model.a,b:model.b,shown};
  const before=model.a+':'+model.b;for(let i=0;i<12;i++){model=generate(method,settings,type);if(model.a+':'+model.b!==before)break}
  task=CK.normalise({mode:'standard',type,title:LABEL[method],prompt:'Calculate using the column method.',answer:String(model.answer),answerMode:'manual',revealed:false});shown=0;workflow='challenge';renderControls();renderStage();
 }
 function exit(){if(setup){model=M.calculate(method,setup.a,setup.b);shown=setup.shown}task=null;setup=null;workflow='build';renderControls();renderStage()}
 function renderStage(){
  const stage=q('#gd-stage');
  if(task){
   stage.innerHTML=CK.bannerHtml(task,{pupil:CK.pupilSpec('number'),actions:[{action:'another',label:'Another'},{action:'end',label:'Exit challenge'}]})+'<div class="gd-wm-diagram"></div>';
   q('.gd-wm-diagram',stage).appendChild(diagram(model,{step:task.revealed?model.steps.length:0,grid,labels}));
   q('[data-challenge-action="another"]',stage).onclick=()=>launch(task.type);
   q('[data-challenge-action="end"]',stage).onclick=exit;
   const reveal=q('[data-board-action="reveal"]',stage);if(reveal)reveal.onclick=()=>{task.revealed=!task.revealed;renderStage()};
   return;
  }
  const max=model.steps.length,explanation=shown?model.steps[shown-1].explanation:'Align the digits by place value. Start in the ones column.';
  stage.innerHTML='<div class="gd-wm-stage"><div class="gd-wm-diagram"></div><div class="gd-wm-explanation" aria-live="polite">'+esc(explanation)+'</div><div class="gd-wm-actions"><button class="gd-btn" data-wm-step="reset"'+(shown===0?' disabled':'')+'>Reset</button><button class="gd-btn" data-wm-step="previous"'+(shown===0?' disabled':'')+'>← Back</button><span class="gd-wm-progress">'+shown+' / '+max+'</span><button class="gd-btn gd-btn--primary" data-wm-step="next"'+(shown===max?' disabled':'')+'>Next →</button><button class="gd-btn" data-wm-step="all"'+(shown===max?' disabled':'')+'>Show all</button></div></div>';
  q('.gd-wm-diagram',stage).appendChild(diagram(model,{step:shown,grid,labels}));
  qa('[data-wm-step]',stage).forEach(el=>el.onclick=()=>{shown=el.dataset.wmStep==='reset'?0:el.dataset.wmStep==='previous'?Math.max(0,shown-1):el.dataset.wmStep==='next'?Math.min(max,shown+1):max;renderStage()});
 }
 function message(s){status=s;const el=q('#wm-status');if(el)el.textContent=s}
 async function exportAction(kind){try{const teacher=kind.startsWith('key-');if(teacher&&!task)return;const svg=task?paper(model,teacher):diagram(model,{step:shown,grid,labels});if(kind==='copy')await X.copyPng(svg);else if(kind==='png')await X.downloadPng(svg,id,2);else if(kind==='svg')X.downloadSvg(svg,id);else X.printSvg(svg,{title:'',landscape:false});message('Export ready.')}catch(e){message(e.message||'Export failed.')}}
 function renderControls(){
  const root=q('#gd-controls');root.innerHTML=controls();
  qa('[data-wm-workflow]',root).forEach(el=>el.onclick=()=>{workflow=el.dataset.wmWorkflow;if(workflow==='build'&&task){exit();return}renderControls()});
  qa('[data-wm-setting]',root).forEach(el=>el.onchange=()=>{settings=M.settings({...settings,[el.dataset.wmSetting]:el.value});renderControls()});
  qa('[data-wm-display]',root).forEach(el=>el.onchange=()=>{if(el.dataset.wmDisplay==='grid')grid=el.checked;else labels=el.checked;renderStage()});
  qa('[data-wm-challenge-mode]',root).forEach(el=>el.onclick=()=>launch(el.dataset.wmChallengeMode));
  const apply=q('#wm-apply',root);if(apply)apply.onclick=()=>{try{const a=q('#wm-a').value,b=q('#wm-b').value;if(a===''||b==='')throw Error('Enter both numbers.');model=M.calculate(method,Number(a),Number(b));shown=0;status='';renderControls();renderStage()}catch(e){message(e.message)}};
  const next=q('#wm-new',root);if(next)next.onclick=()=>{try{model=M.generate(method,settings);shown=0;status='';renderControls();renderStage()}catch(e){message(e.message)}};
  for(const kind of ['copy','png','svg','print',...(task?['key-print']:[])]){let el=q('#wm-'+kind,root);if(!el){el=document.createElement('button');el.type='button';el.hidden=true;root.appendChild(el)}el.setAttribute('data-gd-direct-export',kind);el.onclick=()=>exportAction(kind)}
 }
 setPanels('','');renderControls();renderStage();
 G.lessonState.register(id,()=>({a:model.a,b:model.b,shown,grid,labels,workflow,settings,task,setup,pupil:CK.capturePupil(task)}),saved=>{model=M.calculate(method,saved.a,saved.b);shown=Math.max(0,Math.min(model.steps.length,Number(saved.shown)||0));grid=saved.grid!==false;labels=saved.labels!==false;workflow=['build','challenge','export'].includes(saved.workflow)?saved.workflow:'build';settings=M.settings(saved.settings);task=saved.task?CK.normalise({...saved.task,answer:String(model.answer)}):null;setup=saved.setup||null;CK.restorePupil(task,saved.pupil);renderControls();renderStage()});
};
})(window.TT99Goodies);
