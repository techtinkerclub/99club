(function(G){
'use strict';
if(!G)return;
const {q,qa,esc,field,btn,setPanels}=G;
const MODES={constant:'Constant difference',increasing:'Changing difference',geometric:'Multiply by a constant',alternating:'Alternating differences'};
function integer(value,min,max,fallback){const n=Number(value);return value==null||value===''||!Number.isFinite(n)?fallback:Math.max(min,Math.min(max,Math.round(n)))}
function normalise(raw={}){
 const mode=Object.hasOwn(MODES,raw.mode)?raw.mode:'constant',length=integer(raw.length,3,8,6);
 return {mode,length,start:integer(raw.start,-20,50,1),step:integer(raw.step,-20,20,3),change:integer(raw.change,-10,10,1),factor:integer(raw.factor,2,4,2),second:integer(raw.second,-20,20,-1),shown:integer(raw.shown,1,length,length),rule:raw.rule!==false,links:raw.links!==false};
}
function model(raw){
 const s=normalise(raw),terms=[s.start],steps=[];
 for(let i=1;i<s.length;i++){
   const d=s.mode==='increasing'?s.step+(i-1)*s.change:s.mode==='alternating'&&i%2===0?s.second:s.step;
   const next=s.mode==='geometric'?terms[i-1]*s.factor:terms[i-1]+d;
   steps.push(s.mode==='geometric'?'× '+s.factor:(d<0?'− ':'+ ')+Math.abs(d));terms.push(next);
 }
 const signed=n=>(n<0?'− ':'+ ')+Math.abs(n);
 const rule=s.mode==='constant'?'Add '+(s.step<0?'('+s.step+')':s.step)+' each time':s.mode==='increasing'?'Start with '+signed(s.step)+'; change the difference by '+signed(s.change)+' each step':s.mode==='geometric'?'Multiply by '+s.factor+' each time':'Alternate '+signed(s.step)+' and '+signed(s.second);
 return {s,terms,steps,rule};
}
const TYPES={next:'Find the next term',missing:'Find the missing term',rule:'Identify the rule'};
const GROUPS=[{id:'terms',label:'Terms',ids:['next','missing']},{id:'rules',label:'Rules',ids:['rule']}];
function challengeSettings(raw={}){
 return {family:Object.hasOwn(MODES,raw.family)?raw.family:'all',difficulty:['easy','medium','hard'].includes(raw.difficulty)?raw.difficulty:'medium'};
}
function generateChallenge(type,raw={},rng=Math.random){
 const settings=challengeSettings(raw),pick=a=>a[Math.min(a.length-1,Math.floor(rng()*a.length))],int=(a,b)=>a+Math.min(b-a,Math.floor(rng()*(b-a+1)));
 type=Object.hasOwn(TYPES,type)?type:'next';
 const family=settings.family==='all'?pick(settings.difficulty==='easy'?['constant','geometric']:Object.keys(MODES)):settings.family;
 const easy=settings.difficulty==='easy',hard=settings.difficulty==='hard',length=hard?8:6;
 let start=int(hard?-10:1,hard?25:10),step=int(1,easy?5:10),change=int(1,hard?5:3),factor=int(2,hard?4:3),second=int(1,easy?5:10);
 if(family==='constant'&&!easy&&rng()<.4){step=-step;if(!hard)start=10+Math.abs(step)*(length-1)}
 if(family==='alternating'){if(second===step)second=step===10?9:step+1;if(hard&&rng()<.4)second=-second;}
 if(family==='geometric')start=int(1,easy?3:hard?8:5);
 const sequence=normalise({mode:family,length,start,step,change,factor,second,shown:length,rule:false,links:false}),m=model(sequence);
 const hole=type==='next'?length-1:type==='missing'?int(2,length-3):-1;
 const familyHint={constant:'The difference is constant.',increasing:'The differences change by the same amount each time.',geometric:'Multiply by the same whole number each time.',alternating:'Two different steps repeat in alternation.'}[family];
 const ruleQuestion={constant:'What number is added each time? Use a negative number for subtraction.',increasing:'By how much does each successive difference increase?',geometric:'What number is each term multiplied by?',alternating:'What is the second step of the repeating pair? Use a negative number for subtraction.'}[family];
 const answer=type==='rule'?({constant:sequence.step,increasing:sequence.change,geometric:sequence.factor,alternating:sequence.second}[family]):m.terms[hole];
 return {mode:'standard',type,title:TYPES[type],category:type==='rule'?'rules':'terms',prompt:familyHint+' '+(type==='rule'?ruleQuestion:type==='next'?'What is the next term?':'Fill in the missing term.'),answer:String(answer),answerMode:'manual',revealed:false,sequence,hole,generationSettings:settings,solutionExplanation:m.rule};
}
function diagram(raw,{task=null,teacher=false}={}){
 const {s,terms,steps,rule}=model(raw),W=960,pad=24,cols=s.length>6?4:s.length,rows=Math.ceil(s.length/cols),slot=(W-2*pad)/cols,H=78+rows*128;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 function add(tag,attrs,text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=String(text);svg.appendChild(n);return n}
 for(const [k,v] of Object.entries({xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':'Number sequence demonstration'}))svg.setAttribute(k,v);
 add('rect',{width:W,height:H,fill:'#fff'});
 add('text',{x:pad,y:30,'font-family':'Arial,sans-serif','font-size':22,'font-weight':700,fill:'#24343b'},'Number sequence');
 if(task?teacher:s.rule)add('text',{x:pad,y:58,'font-family':'Arial,sans-serif','font-size':17,fill:'#526970'},rule);
 const boxW=Math.min(130,slot*.71),font=Math.min(34,(boxW-12)/Math.max(1,...terms.map(n=>String(n).length))/.69);
 const point=i=>({x:pad+slot*(i%cols+.5),y:94+Math.floor(i/cols)*128});
 for(let i=0;i<s.length;i++){
   const {x,y}=point(i),shown=task?teacher||i!==task.hole:i<s.shown;
   add('text',{x,y:y-9,'font-family':'Arial,sans-serif','font-size':17,'text-anchor':'middle',fill:'#52666d'},'Term '+(i+1));
   add('rect',{x:x-boxW/2,y,width:boxW,height:62,rx:7,fill:shown?'#edf7f4':'#fff',stroke:shown?'#9ec7bf':'#9fafb3','stroke-width':1.7,...(!shown?{'stroke-dasharray':'5 4'}:{})});
   if(shown)add('text',{x,y:y+41,'font-family':'Arial,sans-serif','font-size':font,'font-weight':700,'text-anchor':'middle',fill:'#28534f','data-seq-term':i},terms[i]);
   if(i&&(task?teacher:s.links&&i<s.shown)){
     const prev=point(i-1);
     if(i%cols!==0){
       const left=prev.x+boxW/2+4,right=x-boxW/2-4,mid=(prev.x+x)/2;
       add('path',{d:'M '+left+' '+(y+30)+' L '+right+' '+(y+30)+' l -6 -5 m 6 5 l -6 5',fill:'none',stroke:'#6a8989','stroke-width':1.6});
       add('text',{x:mid,y:y+83,'font-family':'Arial,sans-serif','font-size':16,'font-weight':650,'text-anchor':'middle',fill:'#526970','data-seq-step':i},steps[i-1]);
     }else add('text',{x,y:y+86,'font-family':'Arial,sans-serif','font-size':16,'text-anchor':'middle',fill:'#526970','data-seq-step':i},'From term '+i+': '+steps[i-1]);
   }
 }
 return svg;
}
G.sequenceModel={normalise,model,diagram,challengeSettings,generateChallenge};
function sequencePaper(task,teacher){return G.exportTools.composeWorksheetCardSvg(diagram(task.sequence,{task,teacher}),{title:task.title,prompt:task.prompt,responseLabel:'Answer',responseMode:task.hole>=0?'none':'box',answer:task.answer,showAnswer:teacher,paperStyle:'plain'})}
if(G.publishing)G.publishing.register('sequences',{
 label:'Sequences & rules',types:()=>Object.entries(TYPES).map(([id,label])=>({id,label})),title:item=>item.kind==='challenge'?TYPES[item.data.type]:'Number sequence',
 signature:q=>JSON.stringify([model(q.sequence).terms,q.hole,q.type,q.prompt]),
 recipe:(model,type)=>({type,settings:challengeSettings(model.settings)}),
 generate(recipe,rng){const ids=Object.keys(TYPES),type=recipe.type==='all'?ids[Math.min(ids.length-1,Math.floor(rng()*ids.length))]:recipe.type;return generateChallenge(type,recipe.settings,rng)},
 capture(model){return model.task?[G.publishing.record('sequences','challenge',{...model.task,revealed:false},{type:model.task.type,settings:{family:model.task.sequence.mode,difficulty:challengeSettings(model.task.generationSettings||model.settings).difficulty}})]:[G.publishing.record('sequences','diagram',normalise(model))]},
 render(item,teacher){return item.kind==='diagram'?diagram(item.data):sequencePaper(item.data,teacher)}
});
G.sequencesTool=function(){
 let state=normalise(),status='',workflow='build',task=null,settings=challengeSettings(),scope='';
 const X=G.exportTools,CK=G.challengeKit;
 const opts=(values,current)=>values.map(v=>'<option value="'+esc(v)+'"'+(String(v)===String(current)?' selected':'')+'>'+esc(v)+'</option>').join('');
 const select=(name,values,current)=>'<select class="gd-select" data-seq-setting="'+name+'">'+opts(values,current)+'</select>';
 const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
 function controls(){
   const tabs='<div class="gd-row gd-seq-tabs" role="tablist" aria-label="Sequence workflow">'+[['build','Explore'],['challenge','Challenge'],['export','Export']].map(([id,label])=>'<button type="button" class="gd-btn'+(workflow===id?' gd-btn--primary':'')+'" data-seq-workflow="'+id+'">'+label+'</button>').join('')+'</div>';
   const exports='<div class="gd-row">'+btn('Copy image','seq-copy')+btn('PNG','seq-png')+btn('SVG','seq-svg')+btn('Print / PDF','seq-print')+'</div>'+(task?'<div class="gd-row">'+btn('Copy answer key','seq-key-copy')+btn('Print answer key','seq-key-print')+'</div>':'')+'<p class="gd-help" id="seq-status" role="status">'+esc(status)+'</p>';
   if(workflow==='export')return tabs+'<div class="gd-seq-settings"><p class="gd-help">'+(task?'Pupil export always hides the answer. Teacher keys are separate.':'Exports reproduce the visible diagram; hidden terms remain blank.')+'</p>'+exports+'</div>';
   if(workflow==='challenge')return tabs+'<div class="gd-seq-settings">'+field('Rule family','<select class="gd-select" data-seq-challenge-setting="family">'+[['all','All families'],...Object.entries(MODES)].map(([id,title])=>'<option value="'+id+'"'+(settings.family===id?' selected':'')+'>'+title+'</option>').join('')+'</select>')+field('Difficulty','<select class="gd-select" data-seq-challenge-setting="difficulty">'+opts(['easy','medium','hard'],settings.difficulty)+'</select>')+CK.nativeRandomHtml('seq',GROUPS)+Object.entries(TYPES).map(([id,label])=>'<button type="button" class="gd-btn" data-seq-challenge-mode="'+id+'">'+label+'</button>').join('')+'</div>';
   const mode=state.mode;
   return tabs+'<div class="gd-seq-settings">'+field('Rule type','<select class="gd-select" data-seq-setting="mode">'+Object.entries(MODES).map(([id,title])=>'<option value="'+id+'"'+(mode===id?' selected':'')+'>'+title+'</option>').join('')+'</select>')+
   '<div class="gd-seq-pair">'+field('First term',select('start',range(-20,50),state.start))+field('Terms',select('length',range(3,8),state.length))+'</div>'+
   (mode==='geometric'?field('Multiply by',select('factor',[2,3,4],state.factor)):
   field(mode==='constant'?'Difference':'First difference',select('step',range(-20,20),state.step))+
   (mode==='increasing'?field('Change in difference',select('change',range(-10,10),state.change)):mode==='alternating'?field('Second difference',select('second',range(-20,20),state.second)):''))+
   '<label class="gd-seq-toggle"><input type="checkbox" data-seq-setting="rule"'+(state.rule?' checked':'')+'> Show rule</label><label class="gd-seq-toggle"><input type="checkbox" data-seq-setting="links"'+(state.links?' checked':'')+'> Show links between visible terms</label>'+
   '</div>';
 }
 function launch(type,keepScope=false){
   if(!keepScope)scope=CK.nativeScope('seq');
   const old=task&&JSON.stringify([task.type,task.sequence,task.hole]);let next;
   for(let i=0;i<12;i++){next=generateChallenge(type,settings);if(JSON.stringify([next.type,next.sequence,next.hole])!==old)break;}
   task=CK.normalise(next);workflow='challenge';renderControls();renderStage();
 }
 function exit(){task=null;scope='';workflow='build';renderControls();renderStage()}
 function renderStage(){
   const stage=q('#gd-stage');
   if(task){
     stage.innerHTML=CK.bannerHtml(task,{pupil:CK.pupilSpec('number',{hint:'Number'}),actions:[{action:'another',label:'Another'},{action:'end',label:'Exit challenge'}]})+'<div class="gd-seq-diagram"></div>';
     q('.gd-seq-diagram',stage).appendChild(diagram(task.sequence,{task,teacher:task.revealed}));
     q('[data-challenge-action="another"]',stage).onclick=()=>{const ids=scope==='all'?Object.keys(TYPES):scope.startsWith('category:')?GROUPS.find(g=>g.id===scope.slice(9))?.ids||[task.type]:[task.type];launch(ids[Math.floor(Math.random()*ids.length)],true)};
     q('[data-challenge-action="end"]',stage).onclick=exit;
     const reveal=q('[data-board-action="reveal"]',stage);if(reveal)reveal.onclick=()=>{task.revealed=!task.revealed;renderStage()};
     return;
   }
   stage.innerHTML='<div class="gd-seq-stage"><div class="gd-seq-actions"><button class="gd-btn" data-seq-action="first"'+(state.shown===1?' disabled':'')+'>First term only</button><button class="gd-btn" data-seq-action="hide"'+(state.shown===1?' disabled':'')+'>− Term</button><button class="gd-btn gd-btn--primary" data-seq-action="next"'+(state.shown===state.length?' disabled':'')+'>+ Term</button><button class="gd-btn" data-seq-action="all"'+(state.shown===state.length?' disabled':'')+'>Show all</button><span class="gd-seq-progress">'+state.shown+' / '+state.length+' terms</span></div><div class="gd-seq-diagram"></div></div>';
   q('.gd-seq-diagram',stage).appendChild(diagram(state));
   qa('[data-seq-action]',stage).forEach(el=>el.onclick=()=>{const action=el.dataset.seqAction;state.shown=action==='first'?1:action==='hide'?Math.max(1,state.shown-1):action==='next'?Math.min(state.length,state.shown+1):state.length;renderStage()});
 }
 async function exportAction(kind){
   try{if(!X)throw Error('Export is not available.');const teacher=kind.startsWith('key-');
   if(teacher&&!task)return;
   const svg=task?X.composeWorksheetCardSvg(diagram(task.sequence,{task,teacher}),{title:task.title+(teacher?' · Teacher key':''),prompt:task.prompt,responseLabel:'Answer',responseMode:task.hole>=0?'none':'box',answer:task.answer,showAnswer:teacher,paperStyle:'plain'}):diagram(state);
   if(kind==='copy'||kind==='key-copy')await X.copyPng(svg);else if(kind==='png')await X.downloadPng(svg,'number-sequence',2);else if(kind==='svg')X.downloadSvg(svg,'number-sequence');else X.printSvg(svg,{title:'',landscape:true});
   status=kind==='print'?'Print view opened.':'Export ready.';
   }catch(e){status=e?.message||'Export failed.'}
   const el=q('#seq-status');if(el)el.textContent=status;
 }
 function renderControls(){
   const root=q('#gd-controls');root.innerHTML=controls();
   qa('[data-seq-workflow]',root).forEach(el=>el.onclick=()=>{workflow=el.dataset.seqWorkflow;if(workflow==='build'){exit();return}renderControls()});
   qa('[data-seq-challenge-setting]',root).forEach(el=>el.onchange=()=>{settings=challengeSettings({...settings,[el.dataset.seqChallengeSetting]:el.value});renderControls()});
   qa('[data-seq-challenge-mode]',root).forEach(el=>el.onclick=()=>launch(el.dataset.seqChallengeMode));
   qa('[data-seq-setting]',root).forEach(el=>el.onchange=()=>{const name=el.dataset.seqSetting,all=state.shown===state.length;state=normalise({...state,[name]:el.type==='checkbox'?el.checked:el.value});if(name==='length'&&all)state.shown=state.length;renderControls();renderStage()});
   const kinds=['copy','png','svg','print',...(task?['key-copy','key-print']:[])];
   for(const kind of kinds){let el=q('#seq-'+kind,root);if(!el){el=document.createElement('button');el.type='button';el.hidden=true;root.appendChild(el)}el.setAttribute('data-gd-direct-export',kind);el.onclick=()=>exportAction(kind)}
 }
 setPanels('','');renderControls();renderStage();
 G.lessonState.register('sequences',()=>({...state,workflow,settings,task,scope,pupil:CK.capturePupil(task)}),saved=>{state=normalise(saved);workflow=['build','challenge','export'].includes(saved.workflow)?saved.workflow:'build';settings=challengeSettings(saved.settings);task=saved.task&&Object.hasOwn(TYPES,saved.task.type)&&saved.task.sequence?CK.normalise(saved.task):null;scope=String(saved.scope||'');CK.restorePupil(task,saved.pupil);renderControls();renderStage()});
};
})(window.TT99Goodies);
