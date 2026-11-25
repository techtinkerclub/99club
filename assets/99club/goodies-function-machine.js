/* Function machines: immutable arithmetic rules; shared screen, paper and marking model. */
(function(root){
'use strict';
const ID='function-machine',OPS=['+','−','×','÷'],INV={'+':'−','−':'+','×':'÷','÷':'×'};
const TYPES=[['output','Find the output'],['input','Find the input'],['constant','Find the missing number in the rule'],['operation','Find the missing operation'],['table','Complete the input/output table'],['rule','Discover the rule'],['reverse','Use the inverse rule'],['formula','Use a simple formula'],['sequence','Generate a term from its position'],['pairs','Find a pair of values'],['pairs-all','Find all possible pairs'],['order','Compare order of operations']];
const LEVELS=[['easy','Gentle'],['medium','Standard'],['hard','Stretch']];
const rand=(rng,min,max)=>min+Math.floor(rng()*(max-min+1));
const pick=(rng,a)=>a[rand(rng,0,a.length-1)];
function step(op,k){if(!OPS.includes(op)||!Number.isSafeInteger(k)||k<1||k>100)throw Error('Choose an operation and a positive whole-number constant (1–100).');return {op,k}}
function apply(n,s){return s.op==='+'?n+s.k:s.op==='−'?n-s.k:s.op==='×'?n*s.k:n/s.k}
function trace(n,steps){return [n,...steps.map(s=>n=apply(n,s))]}
function inverse(steps){return steps.slice().reverse().map(s=>step(INV[s.op],s.k))}
const ruleText=steps=>steps.map(s=>s.op+' '+s.k).join(' then ');
function expression(steps,variable='n'){let expr=variable,additive=false;for(const s of steps){if((s.op==='×'||s.op==='÷')&&additive)expr='('+expr+')';expr+=s.op==='×'?' × '+s.k:s.op==='÷'?' ÷ '+s.k:' '+s.op+' '+s.k;additive=s.op==='+'||s.op==='−';}return expr}
function settings(m={}){const level=LEVELS.some(l=>l[0]===m.level)?m.level:'medium';return {level,stages:[1,2].includes(+m.stages)?+m.stages:level==='easy'?1:2,operations:Array.isArray(m.operations)&&m.operations.some(o=>OPS.includes(o))?OPS.filter(o=>m.operations.includes(o)):OPS.slice(),signed:!!m.signed}}
function validTrace(a,signed){return a.every(v=>Number.isSafeInteger(v)&&Math.abs(v)<=999&&(signed||v>=0))}
function samples(steps,cfg){const out=[];for(let x=cfg.signed?-60:0;x<=100;x++){const t=trace(x,steps);if(validTrace(t,cfg.signed))out.push(t)}return out}
function generate(recipe,rng=Math.random){
 const cfg=settings(recipe),type=recipe.type==='all'?pick(rng,TYPES)[0]:recipe.type;
 if(!TYPES.some(t=>t[0]===type))throw Error('Unknown machine challenge');
 const max=cfg.level==='easy'?5:cfg.level==='hard'?12:9;
 if(type==='pairs'||type==='pairs-all'){const a=rand(rng,2,type==='pairs-all'?5:max),b=rand(rng,2,type==='pairs-all'?5:max),total=a+b,all=Array.from({length:total-1},(_,i)=>[i+1,total-i-1]);return {type,steps:[],input:a,output:b,total,all,prompt:type==='pairs-all'?'List every ordered pair of positive whole numbers a and b for a + b = '+total+'. (Order matters.)':'Find any whole-number pair a and b, both at least 1, so that a + b = '+total+'.',answer:type==='pairs-all'?all.map(p=>'('+p.join(', ')+')').join('; '):'a = '+a+', b = '+b,note:type==='pairs-all'?'There are '+all.length+' ordered pairs: '+all.map(p=>'('+p.join(', ')+')').join('; ')+'.':'Any a from 1 to '+(total-1)+' is valid; b = '+total+' − a. Example: '+a+' + '+b+' = '+total+'.',cfg}}
 for(let attempt=0;attempt<400;attempt++){
  let steps=Array.from({length:cfg.stages},()=>step(pick(rng,cfg.operations),rand(rng,2,max)));
  if(['rule','sequence','formula','order'].includes(type)){
   // Formula/sequence/black-box inference use an explicitly constrained affine family.
   if(type==='order')steps=[step('+',rand(rng,1,max)),step('×',rand(rng,2,max))];
   else {const mul=cfg.operations.includes('×'),add=cfg.operations.includes('+');steps=mul&&add&&cfg.stages===2?[step('×',rand(rng,2,max)),step('+',rand(rng,1,max))]:[step(pick(rng,cfg.operations.filter(o=>o!=='÷').length?cfg.operations.filter(o=>o!=='÷'):['+']),rand(rng,2,max))];}
  }
  const pool=samples(steps,cfg).filter(t=>t[0]>0||cfg.signed);if(pool.length<4)continue;
  const t=pick(rng,pool),input=t[0],output=t.at(-1),slot=rand(rng,0,steps.length-1);
  const model={type,steps,input,output,slot,cfg};
  if(type==='output'||type==='input'||type==='reverse')return {...model,prompt:type==='output'?'Follow the machine. What is the output?':type==='input'?'Work backwards through the machine. What was the input?':'Undo the operations in reverse order. What was the input?',answer:String(type==='output'?output:input),note:'Forward: '+t.join(' → ')+'. Reverse: '+ruleText(inverse(steps))+'.'};
  if(type==='constant'){
   const choices=[];for(let k=1;k<=100;k++){const s=steps.map((v,i)=>i===slot?step(v.op,k):v);if(trace(input,s).at(-1)===output)choices.push(k)}
   if(choices.length!==1||choices[0]!==steps[slot].k)continue;
   return {...model,prompt:'Find the missing constant in the machine.',answer:String(steps[slot].k),note:'The missing step is '+ruleText([steps[slot]])+'. Forward check: '+t.join(' → ')+'.'};
  }
  if(type==='operation'){
   const choices=OPS.filter(op=>trace(input,steps.map((v,i)=>i===slot?step(op,v.k):v)).at(-1)===output);
   if(choices.length!==1)continue;
   return {...model,choices:OPS.slice(),prompt:'Choose the missing operation.',answer:steps[slot].op,note:'Only '+steps[slot].op+' produces the stated output with these numbers.'};
  }
  if(type==='table'||type==='rule'){
   const start=rand(rng,0,pool.length-4),rows=pool.slice(start,start+4).map(t=>[t[0],t.at(-1)]),missing=rand(rng,0,3);
   if(type==='table')return {...model,rows,missing,prompt:'Complete the missing output in the table.',answer:String(rows[missing][1]),note:'Apply '+ruleText(steps)+' to each input.'};
   const candidates=[steps,...Array.from({length:12},()=>steps.map((s,i)=>i===0?step(s.op,s.k+rand(rng,1,3)):s))];
   const choices=[...new Map(candidates.map(s=>[ruleText(s),s])).values()].filter(s=>s===steps||rows.some(([x,y])=>trace(x,s).at(-1)!==y)).slice(0,4).map(ruleText);
   if(choices.length<2)continue;
   for(let i=choices.length-1;i>0;i--){const j=rand(rng,0,i);[choices[i],choices[j]]=[choices[j],choices[i]]}
   return {...model,rows,choices,prompt:'Which of these rules fits every input/output pair?',answer:ruleText(steps),note:'Check the rule against all four pairs. The listed alternatives do not fit.'};
  }
  if(type==='formula'||type==='sequence'){
   const n=rand(rng,4,12),v=trace(n,steps);if(!validTrace(v,false))continue;
   return {...model,input:n,output:v.at(-1),prompt:type==='formula'?'Use the formula y = '+expression(steps,'x')+' when x = '+n+'. Find y.':'The term at position n is '+expression(steps)+'. Find term '+n+'.',answer:String(v.at(-1)),note:'Substitute '+n+' into the expression, then follow the operations.'};
  }
  if(type==='order'){const n=rand(rng,2,12),a=trace(n,steps).at(-1),b=trace(n,steps.slice().reverse()).at(-1);return {...model,input:n,output:a,prompt:'Use the same input in both machines. What is the difference between the outputs?',answer:String(Math.abs(a-b)),note:'First machine: '+a+'. Reversed order: '+b+'. Subtract the smaller from the larger.'}}
 }
 throw Error('No valid whole-number task for these settings. Try another operation or a simpler rule.');
}
const model={OPS,TYPES,LEVELS,step,apply,trace,inverse,ruleText,expression,settings,generate};
if(typeof module==='object'&&module.exports){module.exports=model;return}
const G=root.TT99Goodies;if(!G)return;G.functionMachines=model;
const {q,qa,esc,field,btn,setPanels}=G,CK=G.challengeKit;
function svg(d,teacher=false,demonstration=null){
 const ns='http://www.w3.org/2000/svg',el=document.createElementNS(ns,'svg'),W=800,table=Array.isArray(d.rows),H=table?490:d.type==='order'?390:280;
 function add(tag,attrs,t){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(t!=null)e.textContent=t;el.appendChild(e);return e}
 for(const [k,v] of Object.entries({viewBox:'0 0 '+W+' '+H,xmlns:ns,role:'img','aria-label':'Input, rule and output diagram'}))el.setAttribute(k,v);
 const text=(x,y,t,size=28,anchor='middle',fill='#263d43')=>add('text',{x,y,fill,'font-family':'Arial,sans-serif','font-size':size,'text-anchor':anchor},t);
 const rect=(x,y,w,h,fill,stroke='#91aaa6')=>add('rect',{x,y,width:w,height:h,rx:10,fill,stroke,'stroke-width':2});
 const arrow=(x,y,x2)=>{add('path',{d:'M '+x+' '+y+' H '+x2+' m -10 -8 l 10 8 -10 8',stroke:'#52736e','stroke-width':3,fill:'none','stroke-linejoin':'round'})};
 add('rect',{width:W,height:H,fill:'#fff'});
 if(['pairs','pairs-all'].includes(d.type)){text(400,75,'a + b = '+d.total,48);rect(160,115,160,90,'#e8f2ef');rect(480,115,160,90,'#e8f2ef');text(240,172,teacher&&d.type==='pairs'?d.input:'a = ?',35);text(400,172,'+',40);text(560,172,teacher&&d.type==='pairs'?d.output:'b = ?',35);return el}
 const row=(steps,input,output,y,second=false)=>{
  const vals=trace(input,steps),unknown=d.type==='rule'&&!teacher;
  const hiddenInput=!teacher&&['input','reverse'].includes(d.type),hiddenOutput=!teacher&&['output','formula','sequence','order','table','rule'].includes(d.type);
  const n=steps.length,slot=140,mid=400-(n*slot)/2;
  rect(22,y+20,135,90,'#e5eef8');text(89,y+10,'Input',23);text(89,y+76,hiddenInput?'?':input,36);
  arrow(161,y+65,mid-9);rect(mid-4,y,n*slot+8,130,'#e1f0e9','#719b8f');
  steps.forEach((s,i)=>{const x=mid+i*slot+8,hide=!teacher&&i===d.slot;
    rect(x,y+29,slot-16,72,'#fff');text(x+(slot-16)/2,y+75,unknown?'?':(hide&&d.type==='operation'?'?':s.op)+' '+(hide&&d.type==='constant'?'?':s.k),32);
    if(demonstration!=null&&i<demonstration)text(x+(slot-16)/2,y+123,Number.isInteger(vals[i+1])?String(vals[i+1]):String(Number(vals[i+1].toFixed(4)))+'…',19);
  });
  arrow(mid+n*slot+8,y+65,638);rect(643,y+20,135,90,'#faeed9','#c2a36a');text(710,y+10,'Output',23);text(710,y+76,hiddenOutput||demonstration!=null&&demonstration<n?'?':Number.isInteger(output)?output:Number(output.toFixed(4))+'…',36);
  if(second)text(400,y-10,'Same operations, reversed order',20);
 };
 row(d.steps,d.input,d.output,55);
 if(d.type==='order')row(d.steps.slice().reverse(),d.input,trace(d.input,d.steps.slice().reverse()).at(-1),235,true);
 if(table){text(400,213,'Input / output pairs',23);const x=120,dy=52;d.rows.forEach(([a,b],i)=>{rect(x,230+i*dy,560,dy-3,i%2?'#f4f8f7':'#fff');text(260,265+i*dy,a,29);text(540,265+i*dy,!teacher&&d.type==='table'&&i===d.missing?'?':b,29)});}
 if(d.type==='rule'&&!teacher)text(400,H-15,'Choose from the rules in the question.',20);
 return el;
}
function paper(item,teacher){const d=item.data;if(item.kind==='diagram')return svg(d,true);let prompt=d.prompt;if(d.choices)prompt+=' Choices: '+d.choices.join(' / ')+'.';return G.exportTools.composeWorksheetCardSvg(svg(d,teacher),{title:'Function machine',prompt,responseMode:['rule','pairs','pairs-all'].includes(d.type)?'lines':'box',responseLines:d.type==='pairs-all'?4:d.type==='pairs'?2:1,responseLabel:['pairs','pairs-all'].includes(d.type)?'a and b':'Answer',paperStyle:'plain',answer:['pairs','pairs-all'].includes(d.type)?d.note:d.answer,showAnswer:teacher})}
if(G.publishing)G.publishing.register(ID,{label:'Function machines & algebra',types:()=>TYPES.map(([id,label])=>({id,label})),title:item=>TYPES.find(t=>t[0]===item.data.type)?.[1]||'Function machine',recipe:(m,type)=>({...settings(m),type}),generate,signature:d=>JSON.stringify([d.type,d.steps,d.input,d.output,d.total,d.rows,d.missing,d.slot]),capture:s=>[G.publishing.record(ID,s.task?'challenge':'diagram',s.task||{type:'diagram',steps:s.steps,input:s.input,output:trace(s.input,s.steps).at(-1)})],render:paper,answerSummary:item=>['pairs','pairs-all'].includes(item.data.type)?item.data.note:item.data.answer,answerGraphic:item=>svg(item.data,true),answerNote:item=>item.data.note||''});
G.functionMachineTool=function(){
 let cfg=settings(),steps=[step('×',3),step('+',2)],input=4,workflow='build',task=null,progress=0,pair=null,showTable=false;
 const select=(id,opts,current)=>'<select id="'+id+'" class="gd-select">'+opts.map(([v,label])=>'<option value="'+esc(v)+'"'+(String(v)===String(current)?' selected':'')+'>'+esc(label)+'</option>').join('')+'</select>';
 function launch(type){try{task=CK.normalise({...generate({...cfg,type}),mode:'standard',answerMode:'manual',revealed:false});workflow='challenge';progress=0;pair=null;render()}catch(e){const msg=q('#fm-status');if(msg)msg.textContent=e.message}}
 function exit(){task=null;pair=null;workflow='build';progress=0;render()}
 function controls(){const host=q('#gd-controls');host.innerHTML='<div class="gd-row" role="tablist" aria-label="Machine workflow">'+[['build','Explore'],['challenge','Challenge'],['export','Export']].map(([v,l])=>'<button class="gd-btn'+(v===workflow?' gd-btn--primary':'')+'" data-fm-workflow="'+v+'">'+l+'</button>').join('')+'</div><p class="gd-help">Explore operations and inverses before introducing letters. Year 6 links rules to formulae and sequences. All levels remain available.</p>'+field('Difficulty',select('fm-level',LEVELS,cfg.level))+field('Machine stages',select('fm-stages',[[1,'One'],[2,'Two']],cfg.stages))+
  (workflow==='challenge'?'<p class="gd-help">Choose a challenge, or mix all families. Formula, pair and comparison tasks have their own mathematical constraints.</p>'+CK.nativeRandomHtml('fm',[{id:'machine',label:'Machine questions',ids:TYPES.map(t=>t[0])}])+TYPES.map(([id,label])=>'<button class="gd-btn" data-fm-challenge-mode="'+id+'">'+esc(label)+'</button>').join(''):'<p class="gd-help">Set the rule, then step through the machine or reverse it.</p>'+field('Input','<div class="gd-row"><button class="gd-btn" data-fm-input="-1">−</button><strong>'+input+'</strong><button class="gd-btn" data-fm-input="1">+</button></div>')+steps.map((s,i)=>field('Step '+(i+1),select('fm-op-'+i,OPS.map(o=>[o,o]),s.op)+select('fm-k-'+i,Array.from({length:20},(_,j)=>[j+1,j+1]),s.k))).join('')+'<div class="gd-row">'+btn('Reverse machine','fm-reverse')+btn('Reset','fm-reset')+'</div>')+'<p class="gd-help" id="fm-status" role="status"></p>';
  qa('[data-fm-workflow]',host).forEach(b=>b.onclick=()=>{if(b.dataset.fmWorkflow==='build')exit();else if(b.dataset.fmWorkflow==='export'){G.publishing?.openEditor?.();}else{workflow='challenge';controls()}});
  q('#fm-level',host).onchange=e=>{cfg=settings({...cfg,level:e.target.value,stages:undefined});if(!task){steps=steps.slice(0,cfg.stages);while(steps.length<cfg.stages)steps.push(step('+',2))}render()};
  q('#fm-stages',host).onchange=e=>{cfg=settings({...cfg,stages:+e.target.value});if(!task){steps=steps.slice(0,cfg.stages);while(steps.length<cfg.stages)steps.push(step('+',2))}render()};
  qa('[data-fm-challenge-mode]',host).forEach(b=>b.onclick=()=>launch(b.dataset.fmChallengeMode));
  qa('[data-fm-input]',host).forEach(b=>b.onclick=()=>{input=Math.max(-100,Math.min(100,input+Number(b.dataset.fmInput)));progress=0;render()});
  steps.forEach((s,i)=>{const op=q('#fm-op-'+i,host),k=q('#fm-k-'+i,host);if(op)op.onchange=()=>{steps[i]=step(op.value,s.k);progress=0;render()};if(k)k.onchange=()=>{steps[i]=step(s.op,+k.value);progress=0;render()}});
  const reverse=q('#fm-reverse',host);if(reverse)reverse.onclick=()=>{const result=trace(input,steps).at(-1);if(!Number.isSafeInteger(result)||Math.abs(result)>100){q('#fm-status').textContent='Choose a whole-number output between −100 and 100 before reversing.';return}input=result;steps=inverse(steps);progress=0;render()};
  const reset=q('#fm-reset',host);if(reset)reset.onclick=()=>{input=4;steps=[step('×',3),step('+',2)];cfg=settings();progress=0;render()};
 }
 function stage(){const host=q('#gd-stage'),d=task||{type:'diagram',steps,input,output:trace(input,steps).at(-1)};
  // The shared model response handles open-ended valid pairs without guessing one solution.
  const pupil=task?.type==='pairs-all'?CK.pupilSpec('model',{hint:'Select every valid pair, then check.',ready:()=>Array.isArray(pair)&&pair.length>0,check:()=>Array.isArray(pair)&&pair.length===task.all.length&&task.all.every(p=>pair.includes(p.join(',')))}):task?.type==='pairs'?CK.pupilSpec('model',{hint:'Choose a value for a and a value for b.',ready:()=>Array.isArray(pair)&&pair.every(Number.isInteger),check:()=>pair.every(v=>v>=1)&&pair[0]+pair[1]===task.total}):task?.choices?CK.pupilSpec('choice',{choices:task.choices,expected:task.answer}):CK.pupilSpec('number');
  host.innerHTML=(task?CK.bannerHtml(task,{pupil,actions:[{action:'another',label:'Another'},{action:'end',label:'Exit challenge'}]}):'')+'<div class="gd-fm-visual" style="max-width:880px;margin:auto"></div>';
  const diagram=svg(d,task?task.revealed:true,task?null:progress);diagram.style.cssText='width:100%;height:auto;display:block';q('.gd-fm-visual',host).appendChild(diagram);
  if(task?.type==='pairs'&&!task.revealed){const ed=document.createElement('div');ed.className='gd-row';ed.style.justifyContent='center';if(!Array.isArray(pair))pair=[null,null];ed.innerHTML=['a','b'].map((l,i)=>'<label>'+l+' '+select('fm-pair-'+i,[['','Choose'],...Array.from({length:task.total-1},(_,j)=>[j+1,j+1])],pair[i]??'')+'</label>').join('');host.appendChild(ed);[0,1].forEach(i=>q('#fm-pair-'+i,ed).onchange=e=>{pair[i]=e.target.value===''?null:Number(e.target.value);CK.refreshModelPupil(task)})}
  if(task?.type==='pairs-all'&&!task.revealed){const ed=document.createElement('div');ed.className='gd-row';ed.style.cssText='justify-content:center;flex-wrap:wrap;gap:8px';if(!Array.isArray(pair))pair=[];const candidates=[...task.all,[0,task.total],[task.total,0],[1,task.total]];candidates.forEach(p=>{const b=document.createElement('button'),key=p.join(',');b.className='gd-btn'+(pair.includes(key)?' gd-btn--primary':'');b.textContent='('+p.join(', ')+')';b.setAttribute('aria-pressed',String(pair.includes(key)));b.onclick=()=>{pair=pair.includes(key)?pair.filter(v=>v!==key):[...pair,key];b.classList.toggle('gd-btn--primary',pair.includes(key));b.setAttribute('aria-pressed',String(pair.includes(key)));CK.refreshModelPupil(task)};ed.appendChild(b)});host.appendChild(ed);}
  if(!task){const bar=document.createElement('div');bar.className='gd-row';bar.style.justifyContent='center';bar.innerHTML='<button class="gd-btn" id="fm-back-step">Previous</button><button class="gd-btn gd-btn--primary" id="fm-next-step">Next step</button><button class="gd-btn" id="fm-show-all">Show all</button><button class="gd-btn" id="fm-table">'+(showTable?'Hide table':'Input/output table')+'</button><span>Step '+progress+' of '+steps.length+'</span>';host.appendChild(bar);q('#fm-back-step',bar).disabled=progress===0;q('#fm-next-step',bar).disabled=progress>=steps.length;q('#fm-back-step',bar).onclick=()=>{progress=Math.max(0,progress-1);stage()};q('#fm-next-step',bar).onclick=()=>{progress=Math.min(steps.length,progress+1);stage()};q('#fm-show-all',bar).onclick=()=>{progress=steps.length;stage()};q('#fm-table',bar).onclick=()=>{showTable=!showTable;stage()};if(showTable){const t=document.createElement('table');t.style.cssText='margin:12px auto;border-collapse:collapse;text-align:center;font-size:1.2rem';const values=Array.from({length:5},(_,i)=>input+i);const fmt=n=>Number.isInteger(n)?String(n):Number(n.toFixed(4))+' (approx.)';t.innerHTML='<caption>Rule: '+esc(expression(steps,'x'))+'</caption>'+[['Input',...values],['Output',...values.map(v=>fmt(trace(v,steps).at(-1)))]] .map(r=>'<tr>'+r.map(v=>'<td style="padding:8px 14px;border:1px solid #b7cdc8">'+esc(String(v))+'</td>').join('')+'</tr>').join('');host.appendChild(t)}}
  if(task){q('[data-challenge-action="another"]',host).onclick=()=>launch(task.type);q('[data-challenge-action="end"]',host).onclick=exit;const reveal=q('[data-board-action="reveal"]',host);if(reveal)reveal.onclick=()=>{task.revealed=!task.revealed;stage()}}
 }
 function render(){controls();stage()}
 setPanels('','');render();G.lessonState.register(ID,()=>({cfg,steps,input,workflow,task,progress,pair,showTable,pupil:CK.capturePupil(task),...cfg}),s=>{cfg=settings(s.cfg||s);steps=(s.steps||[]).map(v=>step(v.op,v.k));if(!steps.length||steps.length>2)steps=[step('+',2)];input=Number.isSafeInteger(s.input)?s.input:4;workflow=s.workflow==='challenge'?'challenge':'build';task=s.task?CK.normalise(s.task):null;progress=Math.max(0,Math.min(steps.length,+s.progress||0));pair=Array.isArray(s.pair)?s.pair.slice(0,s.task?.type==='pairs-all'?20:2):null;showTable=!!s.showTable;CK.restorePupil(task,s.pupil);render()});
};
})(typeof globalThis!=='undefined'?globalThis:this);
