/* Configurable paper-first arithmetic generator. Exact fixed-point arithmetic, no eval. */
(function(G){
'use strict';
if(!G)return;
const OPS=['+','−','×','÷'],REL=['<','=','>'];
const groups=[
 {id:'arithmetic',label:'Arithmetic',ids:['missing-result','missing-number','missing-operation','number-bond']},
 {id:'equivalence',label:'Equality & comparison',ids:['equal-expressions','compare-values','true-false']},
 {id:'reasoning',label:'Reasoning',ids:['order-of-operations','inverse-operation']}
];
const titles={'missing-result':'Calculate the result','missing-number':'Find the missing number','missing-operation':'Find the operator','number-bond':'Number bonds','equal-expressions':'Balance the equation','compare-values':'Compare expressions','true-false':'True or false','order-of-operations':'Order of operations','inverse-operation':'Use the inverse'};
const presets={
 easy:{min:0,max:20,ops:['+','−'],relations:REL,left:2,right:1,precision:0},
 medium:{min:0,max:100,ops:OPS,relations:REL,left:2,right:0,precision:0},
 hard:{min:-20,max:1000,ops:OPS,relations:REL,left:0,right:0,precision:0}
};
function settings(raw={},level='medium'){
 const base=presets[level]||presets.medium;
 const valid=(v,options,def)=>options.includes(Number(v))?Number(v):def;
 const select=(v,allowed,def)=>Array.isArray(v)?allowed.filter(x=>v.includes(x)):def.slice();
 const max=valid(raw.max,[10,20,50,100,200,500,1000,10000],base.max),min=valid(raw.min,[-100,-20,-10,0,1,2,5,10,20,50,100,200,500,1000].filter(v=>v<max),Math.min(base.min,max-1));
 return {min,max,
 ops:select(raw.ops,OPS,base.ops),relations:select(raw.relations,REL,base.relations),left:valid(raw.left,[0,1,2,3,4],base.left),right:valid(raw.right,[0,1,2,3,4],base.right),precision:valid(raw.precision,[0,1,2],base.precision)};
}
function available(raw,level='medium'){
 const s=settings(raw,level),has=n=>s.ops.includes(n),left=n=>s.left===0?n>=2&&n<=4:s.left===n,right=n=>s.right===0?n>=1&&n<=2:s.right===n;
 const expression=(s.left!==1||s.right!==1),canExpressions=!expression||s.ops.length>0;
 const valid={
 'missing-result':s.ops.length>0&&[2,3,4].some(left)&&right(1),
 'missing-number':canExpressions&&expression,
 'missing-operation':canExpressions&&expression&&s.ops.length>=2,
 'number-bond':has('+')&&left(2)&&right(1),
 'equal-expressions':canExpressions&&expression&&right(2)||canExpressions&&expression&&(s.right===3||s.right===4),
 'compare-values':canExpressions&&s.relations.length>0,
 'true-false':canExpressions,
 'order-of-operations':left(3)&&right(1)&&(has('+')||has('−'))&&(has('×')||has('÷')),
 'inverse-operation':left(2)&&right(1)&&has('×')&&has('÷')
 };
 return groups.map(g=>({...g,ids:g.ids.filter(id=>valid[id])})).filter(g=>g.ids.length);
}
function generate(type,level='medium',rng=Math.random,raw={}){
 const s=settings(raw,level),scale=10**s.precision,lo=s.min*scale,hi=s.max*scale;
 if(!available(s,level).some(g=>g.ids.includes(type)))throw Error('This question type is not available with the selected settings.');
 const int=(a,b)=>a+Math.min(b-a,Math.floor(rng()*(b-a+1))),pick=a=>a[int(0,a.length-1)];
 const inRange=v=>Number.isSafeInteger(v)&&v>=lo&&v<=hi,fmt=v=>String(v/scale).replace(/^-/, '−');
 const calc=(a,o,b)=>{let v=o==='+'?a+b:o==='−'?a-b:o==='×'?a*b/scale:b!==0?a*scale/b:NaN;return Number.isSafeInteger(v)?v:NaN};
 const evaluate=(e)=>{let v=e.n[0];for(let i=0;i<e.o.length;i++)v=calc(v,e.o[i],e.n[i+1]);return v};
 function samples(){const a=[lo,hi,0,scale,2*scale,3*scale,5*scale,10*scale,-scale,1,-1];for(let i=0;i<32;i++)a.push(i%2?int(lo,hi):int(Math.ceil(lo/scale),Math.floor(hi/scale))*scale);return [...new Set(a.filter(inRange))].sort(()=>rng()-.5)}
 let searchBudget=0;
 function build(target,count,depth=0){
   if(--searchBudget<0||!inRange(target))return null;
   if(count===1)return {n:[target],o:[]};
   const candidates=[];for(const b of samples())for(const o of s.ops){let prev=o==='+'?target-b:o==='−'?target+b:o==='×'?(b?target*scale/b:NaN):target*b/scale;
     if(o==='÷'&&b===0||!inRange(prev)||calc(prev,o,b)!==target)continue;
     candidates.push({prev,b,o})}
   // Prefer meaningful calculations, but allow identities when constraints are narrow.
   const score=c=>(c.b===0||c.b===scale&&(c.o==='×'||c.o==='÷')?1:0);
   candidates.sort((a,b)=>score(a)-score(b));
   for(const c of candidates.slice(0,24)){const e=build(c.prev,count-1,depth+1);if(e)return{n:[...e.n,c.b],o:[...e.o,c.o]}}
   return null;
 }
 const count=(v,side)=>v||int(side==='left'?2:1,side==='left'?4:2);
 const relation=(a,b)=>a<b?'<':a>b?'>':'=';
 function tokens(e,hole=null){
   let out=[hole?.n===0?'?':fmt(e.n[0])];
   for(let i=0;i<e.o.length;i++){if(i>0)out=['(',...out,')'];out.push(hole?.o===i?'?':e.o[i],hole?.n===i+1?'?':fmt(e.n[i+1]));}
   return out;
 }
 function uniqueOperand(e,index){
   // Inverse of each step exists uniquely; avoid multiplying by zero or zero numerator
   // when the unknown is a divisor. Known divisions are exact and nonzero.
   let v=e.n[0];for(let i=0;i<e.o.length;i++){const b=e.n[i+1],o=e.o[i];if(i+1>=index&&o==='×'&&((i+1===index&&v===0)||(i+1>index&&b===0)))return false;if(i+1===index&&o==='÷'&&v===0)return false;v=calc(v,o,b)}return true;
 }
 function equation(a,b,hA,hB,sign='='){return [...tokens(a,hA),sign,...tokens(b,hB)]}
 function result(tiles,prompt,answer,kind='number',choices,solutionExplanation){
   return {mode:'standard',type,category:groups.find(g=>g.ids.includes(type)).id,title:'',prompt,answer:String(answer),answerMode:'manual',revealed:false,tiles,kind,choices,solutionExplanation:solutionExplanation||tiles.map(v=>v==='?'?String(answer):v).join(' '),level,settings:s};
 }
 const targetSample=()=>rng()<.6?int(Math.ceil(lo/scale),Math.floor(hi/scale))*scale:int(lo,hi);
 for(let attempt=0;attempt<150;attempt++){
   searchBudget=140;
   let L=count(s.left,'left'),R=count(s.right,'right'),target=targetSample(),a,b;
   if(type==='missing-result'||type==='number-bond'||type==='order-of-operations'||type==='inverse-operation')R=1;
   if(type==='equal-expressions'&&s.right===0)R=2;
   if(type==='number-bond'){
     const x=targetSample(),y=target-x;if(!inRange(x)||!inRange(y))continue;
     return result([fmt(x),'+','?','=',fmt(target)],'Complete the number bond.',fmt(y));
   }
   if(type==='inverse-operation'){
     const x=pick(samples().filter(v=>v>0)),y=pick(samples().filter(v=>v>0)),z=calc(x,'×',y);
     if(!inRange(z)||!inRange(x)||!inRange(y))continue;
     return result([fmt(x),'×',fmt(y),'=',fmt(z),' ; ',fmt(z),'÷','?','=',fmt(x)],'Use the multiplication fact to find the missing number in the division fact.',fmt(y));
   }
   if(type==='order-of-operations'){
     const x=targetSample(),y=pick(samples()),z=pick(samples().filter(v=>v!==0)),o=pick(s.ops.filter(v=>v==='+'||v==='−')),p=pick(s.ops.filter(v=>v==='×'||v==='÷'));
     const product=calc(y,p,z),v=calc(x,o,product);if(!inRange(v)||!Number.isSafeInteger(product))continue;
     return result([fmt(x),o,fmt(y),p,fmt(z),'=','?'],'Calculate the result using the correct order of operations.',fmt(v),'number',undefined,fmt(y)+' '+p+' '+fmt(z)+' = '+fmt(product)+'; '+fmt(x)+' '+o+' '+fmt(product)+' = '+fmt(v));
   }
   if(type==='compare-values'||type==='true-false'){
     const desired=type==='compare-values'?pick(s.relations):pick(['=','<','>']);
     let other=desired==='='?target:target+(desired==='<'?1:-1)*int(1,Math.max(1,Math.floor((hi-lo)/3)));
     if(!inRange(other))continue;
     a=build(target,L);b=build(other,R);if(!a||!b)continue;
     if(type==='compare-values')return result(equation(a,b,null,null,'?'),'Choose the comparison symbol that makes the statement true.',desired,'choice',s.relations.slice(),fmt(target)+' '+desired+' '+fmt(other));
     return result(equation(a,b),'Is this equation true or false?',desired==='='?'True':'False','choice',['True','False'],fmt(target)+' '+relation(target,other)+' '+fmt(other));
   }
   a=build(target,L);b=build(target,R);if(!a||!b)continue;
   if(type==='missing-result')return result(equation(a,b,null,{n:0}),'Calculate the missing result.',fmt(target));
   if(type==='missing-operation'){
     const sides=[a,b].filter(e=>e.o.length);if(!sides.length)continue;const e=pick(sides),index=int(0,e.o.length-1),good=e.o[index];
     const alternatives=s.ops.filter(o=>{let v=e.n[0]/scale;for(let j=0;j<e.o.length;j++){const p=j===index?o:e.o[j],b=e.n[j+1]/scale;v=p==='+'?v+b:p==='−'?v-b:p==='×'?v*b:b?v/b:NaN}return Number.isFinite(v)&&Math.abs(v-target/scale)<1e-9});
     if(alternatives.length!==1)continue;
     return result(equation(a,b,e===a?{o:index}:null,e===b?{o:index}:null),'Which operation makes the equation true?',good,'choice',s.ops.slice());
   }
   if(type==='missing-number'||type==='equal-expressions'){
     const e=type==='equal-expressions'?b:pick([a,b].filter(e=>e.n.length>1)),i=int(0,e.n.length-1);
     if(!uniqueOperand(e,i))continue;
     return result(equation(a,b,e===a?{n:i}:null,e===b?{n:i}:null),type==='equal-expressions'?'Make both sides of the equation equal.':'Find the missing number.',fmt(e.n[i]));
   }
 }
 throw Error('No suitable question found. Try a wider number range, fewer terms, or more operations.');
}
G.numberChallenges={groups,titles,generate,settings,presets,available,OPS,REL};
})(window.TT99Goodies);
;
(function(G){
'use strict';
if(!G)return;
const {q,qa,esc,clamp,num,gcd,field,btn,setPanels}=G;
function coordinateTool(){
  const CK=G.challengeKit,X=G.exportTools;
  let points=[],selected=-1,drag=null,view=null,fourQuadrants=false;
  const undoStack=[],redoStack=[];
  const W=600,pad=42;
  const CHALLENGE_CATEGORIES=[
    {id:'read',label:'Read & plot'},
    {id:'transform',label:'Transform'},
    {id:'reason',label:'Reasoning'}
  ];
  const CHALLENGE_TEMPLATES=[
    {id:'read-coordinate',category:'read',title:'Read the coordinate',desc:'Read an unlabelled point from the grid.'},
    {id:'plot-coordinate',category:'read',title:'Plot the point',desc:'Place a point at the given coordinate.'},
    {id:'missing-coordinate',category:'read',title:'Missing coordinate',desc:'Find the missing x- or y-coordinate.'},
    {id:'reflect-axis',category:'transform',title:'Reflect in an axis',desc:'Find the coordinate after reflection in the x- or y-axis.'},
    {id:'translate-point',category:'transform',title:'Translate a point',desc:'Apply a horizontal and vertical displacement.'},
    {id:'identify-quadrant',category:'reason',title:'Which quadrant?',desc:'Identify the quadrant containing an unlabelled point.'}
  ];
  let controlTab='explore',challengeTab='standard',challengeCategory='read',challengeType='read-coordinate',challenge=null,beforeChallenge=null;
  let exportMode='diagram',responseLines=1,exportStatus='';

  function copyPoints(value=points){return value.map(p=>({x:p.x,y:p.y}))}
  function remember(snapshot=copyPoints()){
    undoStack.push(copyPoints(snapshot));
    if(undoStack.length>40)undoStack.shift();
    redoStack.length=0;
  }
  function undo(){
    if(challengeFrozen()||!undoStack.length)return;
    redoStack.push(copyPoints());
    points=copyPoints(undoStack.pop());
    selected=-1;
    draw();
  }
  function redo(){
    if(challengeFrozen()||!redoStack.length)return;
    undoStack.push(copyPoints());
    points=copyPoints(redoStack.pop());
    selected=-1;
    draw();
  }
  function config(){
    const four=!!fourQuadrants,min=four?-10:0,max=10;
    return{four,min,max,range:max-min,step:(W-2*pad)/(max-min)};
  }
  function visible(p,c=view||config()){
    return p&&p.x>=c.min&&p.x<=c.max&&p.y>=c.min&&p.y<=c.max;
  }
  function occupied(x,y,except=-1){
    return points.findIndex((p,i)=>i!==except&&p.x===x&&p.y===y);
  }
  function pointPx(p,c=view||config()){
    return{x:pad+(p.x-c.min)*c.step,y:pad+(c.max-p.y)*c.step};
  }
  function nearestCoord(e,svg,c=view||config()){
    const r=svg.getBoundingClientRect();
    const vx=(e.clientX-r.left)/Math.max(1,r.width)*W;
    const vy=(e.clientY-r.top)/Math.max(1,r.height)*W;
    return{
      x:clamp(Math.round(c.min+(vx-pad)/c.step),c.min,c.max),
      y:clamp(Math.round(c.max-(vy-pad)/c.step),c.min,c.max)
    };
  }
  function pointName(index){return String.fromCharCode(65+(index%26))}
  function rawCoordinate(p){return'('+p.x+', '+p.y+')'}
  function hiddenPoint(index){
    return !!(challenge&&!challenge.revealed&&Array.isArray(challenge.hiddenPointLabels)&&challenge.hiddenPointLabels.map(Number).includes(index));
  }
  function pointLabel(index,p){
    if(challenge?.mode==='standard'&&challenge.type==='plot-coordinate')return pointName(index);
    if(!hiddenPoint(index))return rawCoordinate(p);
    const overrides=challenge&&challenge.pointLabelOverrides&&typeof challenge.pointLabelOverrides==='object'?challenge.pointLabelOverrides:{};
    return overrides[index]!=null?String(overrides[index]):pointName(index);
  }
  function pointAria(index,p){
    const label=pointLabel(index,p);
    return hiddenPoint(index)?'Point '+label+'.':'Point '+label+'.';
  }
  function pointsText(){
    const list=points.map((p,i)=>pointLabel(i,p)).join(' · ')||'none';
    const hidden=points.filter(p=>!visible(p)).length;
    return'Points: '+list+(hidden?' · '+hidden+' outside this grid '+(hidden===1?'is':'are')+' hidden':'');
  }
  function quadrantName(p){
    if(!p)return'';
    if(p.x===0&&p.y===0)return'origin';
    if(p.x===0)return'y-axis';
    if(p.y===0)return'x-axis';
    if(p.x>0&&p.y>0)return'Quadrant I';
    if(p.x<0&&p.y>0)return'Quadrant II';
    if(p.x<0&&p.y<0)return'Quadrant III';
    return'Quadrant IV';
  }
  function teachingSnapshot(){return{points:copyPoints(),selected,fourQuadrants}}
  function restoreTeachingSnapshot(value){
    if(!value)return;
    points=copyPoints(Array.isArray(value.points)?value.points:[]);
    selected=Number.isInteger(value.selected)&&value.selected>=0&&value.selected<points.length?value.selected:-1;
    fourQuadrants=!!value.fourQuadrants;
    undoStack.length=0;redoStack.length=0;
  }
  function challengeFrozen(){return !!(challenge&&challenge.mode==='standard'&&(challenge.freezePoints||challenge.revealed))}
  function toggleCoordinateReveal(){
    if(!challenge)return;
    if(challenge.mode==='standard'&&challenge.type==='plot-coordinate'){
      if(!challenge.revealed){
        const target=String(challenge.targetCoordinate||'').match(/^\((-?\d+),\s*(-?\d+)\)$/);
        if(target){
          challenge.preRevealPoints=copyPoints();
          challenge.preRevealSelected=selected;
          points=[{x:Number(target[1]),y:Number(target[2])}];
          selected=-1;
        }
      }else if(Array.isArray(challenge.preRevealPoints)){
        points=copyPoints(challenge.preRevealPoints);
        selected=Number.isInteger(challenge.preRevealSelected)?challenge.preRevealSelected:-1;
        delete challenge.preRevealPoints;
        delete challenge.preRevealSelected;
      }
    }
    challenge.revealed=!challenge.revealed;renderControls();draw();
  }
  function pointLabelLayout(x,y,minX,minY,maxX){
    const left=x>maxX-72;
    return {x:x+(left?-12:12),y:y<minY+20?y+22:y-12,anchor:left?'end':'start'};
  }
  function resolveCustomAnswerSource(source){
    const m=String(source||'').match(/^point:(\d+):(coords|x|y|quadrant)$/);
    if(!m)return'';
    const index=Number(m[1]),p=points[index];if(!p)return'';
    if(m[2]==='coords')return rawCoordinate(p);
    if(m[2]==='x')return String(p.x);
    if(m[2]==='y')return String(p.y);
    return quadrantName(p);
  }
  function customAnswerSources(){
    const sources=[];
    points.forEach((p,index)=>{
      const name=pointName(index);
      sources.push({id:'point:'+index+':coords',label:name+' coordinate'});
      sources.push({id:'point:'+index+':x',label:name+' x-coordinate'});
      sources.push({id:'point:'+index+':y',label:name+' y-coordinate'});
      if(fourQuadrants)sources.push({id:'point:'+index+':quadrant',label:name+' quadrant / axis'});
    });
    return sources;
  }
  function clearBoundHiding(){
    if(!challenge)return;
    challenge.hiddenPointLabels=[];challenge.pointLabelOverrides={};
  }
  function applyBoundHiding(source){
    clearBoundHiding();if(!challenge)return;
    const m=String(source||'').match(/^point:(\d+):(coords|x|y|quadrant)$/);if(!m)return;
    const index=Number(m[1]),p=points[index];if(!p)return;
    challenge.hiddenPointLabels=[index];
    if(m[2]==='x')challenge.pointLabelOverrides={[index]:'(?, '+p.y+')'};
    else if(m[2]==='y')challenge.pointLabelOverrides={[index]:'('+p.x+', ?)'};
    else challenge.pointLabelOverrides={[index]:pointName(index)};
  }
  function updateChallengeAnswer(){
    if(!challenge||challenge.answerMode!=='bound'||!challenge.answerSource)return;
    challenge.answer=resolveCustomAnswerSource(challenge.answerSource);
    const live=q('#co-custom-live-answer');if(live)live.textContent=challenge.answer||'—';
    if(challenge.revealed){
      const shown=q('.gd-challenge-actions em',q('#gd-stage'));
      if(shown)shown.textContent='Answer: '+challenge.answer;
    }
  }
  function challengeObject(type,prompt,answer,extra={}){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);
    const raw={mode:'standard',type,category:meta?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),answerMode:'manual',answerSource:'',revealed:false,hiddenPointLabels:[],pointLabelOverrides:{},freezePoints:false,...extra};
    return CK?CK.normalise(raw):raw;
  }
  function workflowTabs(){
    return '<div class="gd-row gd-co-workflow-tabs" role="tablist" aria-label="Coordinates workflow">'+
      '<button class="gd-btn'+(controlTab==='explore'?' gd-btn--primary':'')+'" type="button" data-co-workflow="explore">Explore</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-co-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-co-workflow="export">Export / reuse</button></div>';
  }
  function exploreControlsHtml(){
    return field('Grid','<label class="gd-row"><input id="co-four" type="checkbox"'+(fourQuadrants?' checked':'')+'> Four quadrants (−10 to 10)</label>')+
      '<div class="gd-row">'+btn('Undo','co-undo')+btn('Redo','co-redo')+btn('Clear points','co-clear')+'</div>'+
      '<p class="gd-help">Tap an intersection to plot a point, then drag the point to move it. Switching grid mode does not delete your work; points outside the current grid are kept and reappear when they fit again.</p>';
  }
  function challengeControlsHtml(){
 const options=(id,label,values,value)=>field(label,'<select class="gd-select" id="'+id+'" data-mc-setting="'+id.replace('mc-','')+'">'+values.map(([v,t])=>'<option value="'+v+'"'+(Number(value)===Number(v)?' selected':'')+'>'+esc(t)+'</option>').join('')+'</select>');
 const groups=N.available(numberSettings,difficulty);
 const toggles=(key,values,label)=>'<fieldset class="gd-number-options"><legend>'+label+'</legend><div class="gd-number-toggle-row">'+values.map(v=>'<label><input type="checkbox" data-mc-toggle="'+key+'" value="'+esc(v)+'"'+(numberSettings[key].includes(v)?' checked':'')+'><span>'+esc(v)+'</span></label>').join('')+'</div></fieldset>';
 const termOptions=(side)=>[[0,side==='left'?'Vary (2–4)':'Vary (1–2)'],[1,'1 number'],[2,'2 numbers'],[3,'3 numbers'],[4,'4 numbers']];
 return '<div class="gd-number-settings"><div class="gd-section-title">Question settings</div>'+
 field('Preset','<select class="gd-select" id="mc-difficulty">'+[['easy','Easy'],['medium','Medium'],['hard','Hard'],['custom','Custom']].map(([v,t])=>'<option value="'+v+'"'+(difficulty===v?' selected':'')+'>'+t+'</option>').join('')+'</select>')+
 toggles('ops',N.OPS,'Allowed operations')+toggles('relations',N.REL,'Allowed comparison symbols')+
 '<div class="gd-number-settings-pair">'+options('mc-min','Smallest number',[-100,-20,-10,0,1,2,5,10,20,50,100,200,500,1000].filter(v=>v<numberSettings.max).map(v=>[v,String(v)]),numberSettings.min)+options('mc-max','Largest number',[10,20,50,100,200,500,1000,10000].filter(v=>v>numberSettings.min).map(v=>[v,String(v)]),numberSettings.max)+'</div>'+
 options('mc-precision','Number type',[[0,'Whole numbers'],[1,'Up to 1 decimal place'],[2,'Up to 2 decimal places']],numberSettings.precision)+
 '<div class="gd-number-settings-pair">'+options('mc-left','Numbers on left',termOptions('left'),numberSettings.left)+options('mc-right','Numbers on right',termOptions('right'),numberSettings.right)+'</div>'+
 '<p class="gd-help">All displayed numbers and missing values stay in the selected range. Division is exact at the selected precision. Parentheses make grouping explicit. Comparison settings apply to comparison questions. Only compatible question types are listed.</p></div>'+
 (generationError?'<p class="gd-number-error" role="status">'+esc(generationError)+'</p>':'')+
 (groups.length?CK.nativeRandomHtml('mc',groups)+groups.map(g=>'<div class="gd-section-title">'+esc(g.label)+'</div><div class="gd-row">'+g.ids.map(id=>'<button type="button" class="gd-btn" data-mc-challenge-mode="'+id+'">'+esc(N.titles[id])+'</button>').join('')+'</div>').join(''):'<p class="gd-help">No compatible questions. Enable an operation, allow a comparison, or change the number of terms.</p>')+(challenge?btn('Exit challenge','mc-exit-challenge'):'');
}
function controlsHtml(){return workflowTabs()+(controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():exploreControlsHtml())}
  function renderControls(){const panel=q('#gd-controls');if(panel)panel.innerHTML=controlsHtml();bindControls()}
  function enterCustomChallenge(){
    if(CK)challenge=CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''});
    challengeTab='custom';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();draw();
  }
  function setCustomAnswerSource(source){
    if(!challenge||challenge.mode!=='custom')return;
    if(source==='manual'){
      challenge.answerMode='manual';challenge.answerSource='';clearBoundHiding();
    }else if(source==='generated'){
      challenge.answerMode='bound';challenge.answerSource='';
    }else{
      challenge.answerMode='bound';challenge.answerSource=source;challenge.answer=resolveCustomAnswerSource(source);applyBoundHiding(source);
    }
    challenge.revealed=false;renderControls();draw();
  }
  function clearChallenge(){
    if(beforeChallenge){restoreTeachingSnapshot(beforeChallenge);beforeChallenge=null}
    challenge=null;challengeTab='standard';controlTab='challenge';renderControls();draw();
  }
  function setGeneratedPoints(next,four=false){
    points=copyPoints(next);selected=-1;drag=null;fourQuadrants=!!four;undoStack.length=0;redoStack.length=0;
  }
  function nonZeroSigned(){
    const n=1+Math.floor(Math.random()*8);
    return Math.random()<.5?-n:n;
  }
  function generateChallenge(type){
    const template=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!template)return;
    if(!beforeChallenge)beforeChallenge=teachingSnapshot();else restoreTeachingSnapshot(beforeChallenge);
    const point={x:1+Math.floor(Math.random()*9),y:1+Math.floor(Math.random()*9)};
    if(type==='read-coordinate'){
      setGeneratedPoints([point],false);
      challenge=challengeObject(type,'What are the coordinates of point A?',rawCoordinate(point),{hiddenPointLabels:[0],pointLabelOverrides:{0:'A'},freezePoints:true});
    }else if(type==='plot-coordinate'){
      setGeneratedPoints([],false);
      challenge=challengeObject(type,'Plot point A at '+rawCoordinate(point)+'.','Point A should be at '+rawCoordinate(point)+'.',{freezePoints:false,targetCoordinate:rawCoordinate(point)});
    }else if(type==='missing-coordinate'){
      setGeneratedPoints([point],false);
      const hideX=Math.random()<.5,shown=hideX?'(?, '+point.y+')':'('+point.x+', ?)';
      challenge=challengeObject(type,'What number is missing from the coordinate shown?',hideX?point.x:point.y,{hiddenPointLabels:[0],pointLabelOverrides:{0:shown},freezePoints:true});
    }else if(type==='identify-quadrant'){
      const p={x:nonZeroSigned(),y:nonZeroSigned()};
      setGeneratedPoints([p],true);
      challenge=challengeObject(type,'Which quadrant contains point A?',quadrantName(p),{hiddenPointLabels:[0],pointLabelOverrides:{0:'A'},freezePoints:true});
    }else if(type==='reflect-axis'){
      const p={x:nonZeroSigned(),y:nonZeroSigned()},axis=Math.random()<.5?'x':'y';
      setGeneratedPoints([p],true);
      const target=axis==='x'?{x:p.x,y:-p.y}:{x:-p.x,y:p.y};
      challenge=challengeObject(type,'Point A is at '+rawCoordinate(p)+'. What are its coordinates after reflection in the '+axis+'-axis?',rawCoordinate(target),{freezePoints:true});
    }else{
      let dx=0,dy=0,target=null,guard=0;
      do{
        dx=[-3,-2,-1,1,2,3][Math.floor(Math.random()*6)];
        dy=[-3,-2,-1,1,2,3][Math.floor(Math.random()*6)];
        target={x:point.x+dx,y:point.y+dy};guard++;
      }while((target.x<0||target.x>10||target.y<0||target.y>10)&&guard<50);
      if(target.x<0||target.x>10||target.y<0||target.y>10){dx=1;dy=1;target={x:point.x+1,y:point.y+1}}
      setGeneratedPoints([point],false);
      const h=dx>0?dx+' right':Math.abs(dx)+' left',v=dy>0?dy+' up':Math.abs(dy)+' down';
      challenge=challengeObject(type,'Point A is at '+rawCoordinate(point)+'. Translate it '+h+' and '+v+'. What are the new coordinates?',rawCoordinate(target),{freezePoints:true});
    }
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';
    exportMode='challenge';responseLines=template.category==='reason'?2:1;exportStatus='';renderControls();draw();
  }
  function updateGeometry(){
    updateChallengeAnswer();
    qa('[data-co-point]',q('#gd-stage')).forEach(el=>{
      const i=+el.dataset.coPoint,p=points[i];if(!p||!visible(p))return;
      const v=pointPx(p);
      el.setAttribute('cx',v.x);el.setAttribute('cy',v.y);
      el.dataset.coPos=p.x+','+p.y;
      el.classList.toggle('is-selected',i===selected);
      el.setAttribute('aria-label',pointAria(i,p)+(challengeFrozen()?' Fixed for this challenge.':' Drag to move.'));
    });
    qa('[data-co-label]',q('#gd-stage')).forEach(el=>{
      const i=+el.dataset.coLabel,p=points[i];if(!p||!visible(p))return;
      const v=pointPx(p),layout=pointLabelLayout(v.x,v.y,pad,pad,W-pad);
      el.setAttribute('x',layout.x);el.setAttribute('y',layout.y);el.setAttribute('text-anchor',layout.anchor);
      el.textContent=pointLabel(i,p);
    });
    const readout=q('#co-readout');if(readout)readout.textContent=pointsText();
    const context=q('#co-context-text');
    if(context)context.textContent=challengeFrozen()
      ?'The given point'+(points.length===1?' is':'s are')+' fixed for this challenge.'
      :selected>=0&&points[selected]&&visible(points[selected])
        ?'Selected '+pointLabel(selected,points[selected])
        :'Tap the grid to plot a point. Drag an existing point to move it.';
    const del=q('[data-co-delete]');
    if(del)del.hidden=challengeFrozen()||!(selected>=0&&points[selected]&&visible(points[selected]));
    syncControls();
  }
  function movePoint(index,x,y,withHistory=true){
    const c=view||config(),p=points[index];
    if(challengeFrozen()||!p||x<c.min||x>c.max||y<c.min||y>c.max||occupied(x,y,index)>=0)return false;
    if(p.x===x&&p.y===y)return false;
    if(withHistory)remember();
    points[index]={x,y};
    selected=index;
    return true;
  }
  function deletePoint(index){
    if(challengeFrozen()||index<0||index>=points.length)return;
    remember();
    points.splice(index,1);
    selected=-1;
    draw();
  }
  function syncControls(){
    const u=q('#co-undo'),r=q('#co-redo'),clear=q('#co-clear');
    const stageUndo=q('[data-co-undo-stage]',q('#gd-stage')),stageRedo=q('[data-co-redo-stage]',q('#gd-stage'));
    const frozen=challengeFrozen();
    if(u)u.disabled=!undoStack.length||frozen;
    if(r)r.disabled=!redoStack.length||frozen;
    if(stageUndo)stageUndo.disabled=!undoStack.length||frozen;
    if(stageRedo)stageRedo.disabled=!redoStack.length||frozen;
    if(clear)clear.disabled=!points.length||frozen;
  }
  function addOrSelect(x,y){
    if(challengeFrozen())return;
    const existing=occupied(x,y);
    if(existing>=0){selected=existing;draw();return;}
    if(challenge&&challenge.mode==='standard'&&challenge.type==='plot-coordinate'&&points.length){
      remember();points[0]={x,y};selected=0;draw();return;
    }
    remember();
    points.push({x,y});
    selected=points.length-1;
    draw();
  }
  function bindStage(){
    const svg=q('#co-svg');
    svg.onclick=e=>{
      if(e.target.closest&&e.target.closest('[data-co-point]'))return;
      const p=nearestCoord(e,svg);
      addOrSelect(p.x,p.y);
    };
    qa('[data-co-point]',q('#gd-stage')).forEach(point=>{
      point.onpointerdown=e=>{
        if(challengeFrozen()||(e.button!=null&&e.button!==0))return;
        e.stopPropagation();
        const index=+point.dataset.coPoint;
        selected=index;
        drag={index,pointerId:e.pointerId,start:copyPoints(),moved:false};
        try{point.setPointerCapture(e.pointerId)}catch(_){}
        updateGeometry();
      };
      point.onpointermove=e=>{
        if(!drag||drag.pointerId!==e.pointerId||drag.index!==+point.dataset.coPoint)return;
        const target=nearestCoord(e,svg),p=points[drag.index];
        if(!p||(p.x===target.x&&p.y===target.y)||occupied(target.x,target.y,drag.index)>=0)return;
        if(!drag.moved){
          remember(drag.start);
          drag.moved=true;
        }
        points[drag.index]={x:target.x,y:target.y};
        selected=drag.index;
        updateGeometry();
      };
      const finish=e=>{
        if(!drag||drag.pointerId!==e.pointerId||drag.index!==+point.dataset.coPoint)return;
        const moved=drag.moved;
        drag=null;
        if(moved)draw();else{selected=+point.dataset.coPoint;draw();}
      };
      point.onpointerup=finish;
      point.onpointercancel=finish;
      point.onkeydown=e=>{
        if(challengeFrozen())return;
        const index=+point.dataset.coPoint,p=points[index];if(!p)return;
        if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deletePoint(index);return;}
        let x=p.x,y=p.y;
        if(e.key==='ArrowLeft')x--;else if(e.key==='ArrowRight')x++;
        else if(e.key==='ArrowUp')y++;else if(e.key==='ArrowDown')y--;else return;
        e.preventDefault();
        const c=view||config();
        x=clamp(x,c.min,c.max);y=clamp(y,c.min,c.max);
        if(movePoint(index,x,y,true))draw();
      };
    });
    const stageUndo=q('[data-co-undo-stage]'),stageRedo=q('[data-co-redo-stage]');
    if(stageUndo)stageUndo.onclick=e=>{e.stopPropagation();undo()};
    if(stageRedo)stageRedo.onclick=e=>{e.stopPropagation();redo()};
    const del=q('[data-co-delete]');
    if(del)del.onclick=e=>{e.stopPropagation();deletePoint(selected)};
  }
  function bindChallengeStageActions(){
    const endChallenge=q('[data-challenge-action="end"]',q('#gd-stage'));if(endChallenge)endChallenge.onclick=e=>{e.stopPropagation();clearChallenge()};
    const stage=q('#gd-stage');if(!stage||!challenge)return;
    const reveal=q('[data-board-action="reveal"]',stage);
    if(reveal)reveal.onclick=e=>{e.stopPropagation();toggleCoordinateReveal()};
    const another=q('[data-challenge-action="another"]',stage);
    if(another)another.onclick=e=>{e.stopPropagation();if(challenge?.mode==='standard')generateChallenge(challenge.type)};
  }
  function bindControls(){
    const controls=q('#gd-controls');if(!controls)return;
    qa('[data-co-workflow]',controls).forEach(button=>button.onclick=()=>{
      const next=button.dataset.coWorkflow;
      controlTab=next==='challenge'?'challenge':next==='export'?'export':'explore';renderControls();
    });
    if(controlTab==='export'){
      qa('[data-co-export-mode]',controls).forEach(button=>button.onclick=()=>{
        exportMode=button.dataset.coExportMode==='challenge'&&challenge?'challenge':'diagram';exportStatus='';renderControls();
      });
      const response=q('#co-response-lines',controls);if(response)response.onchange=()=>{
        responseLines=clamp(Math.round(num(response.value,1)),1,4);renderControls();
      };
      const copyImage=q('#co-copy-image',controls);if(copyImage)copyImage.onclick=()=>exportAction('copy');
      const png=q('#co-png',controls);if(png)png.onclick=()=>exportAction('png');
      const svgDownload=q('#co-svg-download',controls);if(svgDownload)svgDownload.onclick=()=>exportAction('svg');
      const print=q('#co-print',controls);if(print)print.onclick=()=>exportAction('print');
      return;
    }
    const u=q('#co-undo',controls);if(u)u.onclick=undo;
    const r=q('#co-redo',controls);if(r)r.onclick=redo;
    const clear=q('#co-clear',controls);if(clear)clear.onclick=()=>{if(challengeFrozen()||!points.length)return;remember();points=[];selected=-1;draw()};
    if(controlTab==='explore'){
      const four=q('#co-four',controls);if(four){four.disabled=challenge?.mode==='standard';four.onchange=()=>{if(challenge?.mode==='standard')return;fourQuadrants=!!four.checked;selected=-1;draw()}};
      return;
    }
    qa('[data-co-challenge-tab]',controls).forEach(button=>button.onclick=()=>{
      if(button.dataset.coChallengeTab==='custom')enterCustomChallenge();else{challengeTab='standard';renderControls()}
    });
    qa('[data-co-challenge-cat]',controls).forEach(button=>button.onclick=()=>{
      challengeCategory=button.dataset.coChallengeCat;
      const first=CHALLENGE_TEMPLATES.find(t=>t.category===challengeCategory);if(first)challengeType=first.id;
      renderControls();
    });
    qa('[data-co-challenge-type]',controls).forEach(button=>button.onclick=()=>{challengeType=button.dataset.coChallengeType;renderControls()});
    const generate=q('#co-generate',controls);if(generate)generate.onclick=()=>generateChallenge(challengeType);
    const edit=q('#co-edit-challenge',controls);if(edit)edit.onclick=enterCustomChallenge;
    const end=q('#co-clear-challenge',controls);if(end)end.onclick=clearChallenge;
    const reveal=q('#co-reveal',controls);if(reveal)reveal.onclick=toggleCoordinateReveal;
    qa('[data-gd-rich-action]',controls).forEach(button=>button.onclick=e=>{
      e.preventDefault();const editor=q('#co-custom-prompt',controls);
      if(editor&&CK&&challenge){
        CK.applyFormat(editor,button.dataset.gdRichAction);
        challenge.promptHtml=CK.sanitiseRichHtml(editor.innerHTML);
        challenge.prompt=CK.plainText(challenge.promptHtml).slice(0,600);
        draw();
      }
    });
    const title=q('#co-custom-title',controls);if(title)title.oninput=()=>{if(!challenge)return;challenge.title=title.value.slice(0,100);draw()};
    const prompt=q('#co-custom-prompt',controls);if(prompt)prompt.oninput=()=>{
      if(!challenge||!CK)return;challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml).slice(0,600);draw();
    };
    const source=q('#co-custom-answer-source',controls);if(source)source.onchange=()=>setCustomAnswerSource(source.value);
    const answer=q('#co-custom-answer',controls);if(answer)answer.oninput=()=>{
      if(!challenge)return;challenge.answer=answer.value.slice(0,400);challenge.answerMode='manual';challenge.answerSource='';
      if(challenge.revealed)draw();
    };
  }
  function draw(){
    updateChallengeAnswer();
    view=config();
    if(selected>=0&&!visible(points[selected]))selected=-1;
    let lines='',labels='';
    for(let v=view.min;v<=view.max;v++){
      const x=pad+(v-view.min)*view.step,y=pad+(view.max-v)*view.step;
      lines+='<line class="gd-gridline" x1="'+x+'" y1="'+pad+'" x2="'+x+'" y2="'+(W-pad)+'"></line>'+
        '<line class="gd-gridline" x1="'+pad+'" y1="'+y+'" x2="'+(W-pad)+'" y2="'+y+'"></line>';
      const labelEvery=view.four?2:1;
      if(v%labelEvery===0){
        labels+='<text x="'+x+'" y="'+(W-pad+22)+'" text-anchor="middle" class="gd-co-axis-label">'+v+'</text>'+
          '<text x="'+(pad-12)+'" y="'+(y+4)+'" text-anchor="end" class="gd-co-axis-label">'+v+'</text>';
      }
    }
    const zeroX=pad+(0-view.min)*view.step,zeroY=pad+(view.max-0)*view.step;
    const plotted=points.map((p,i)=>{
      if(!visible(p))return'';
      const v=pointPx(p),display=pointLabel(i,p),layout=pointLabelLayout(v.x,v.y,pad,pad,W-pad);
      return '<circle class="gd-point gd-co-point'+(i===selected?' is-selected':'')+'" data-co-point="'+i+'" data-co-pos="'+p.x+','+p.y+'" tabindex="0" role="button" aria-label="'+esc(pointAria(i,p)+(challengeFrozen()?' Fixed for this challenge.':' Drag to move.'))+'" cx="'+v.x+'" cy="'+v.y+'" r="9"></circle>'+
        '<text class="gd-co-point-label" data-co-label="'+i+'" x="'+layout.x+'" y="'+layout.y+'" text-anchor="'+layout.anchor+'" pointer-events="none">'+esc(display)+'</text>';
    }).join('');
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Coordinates challenge',pupil:(challenge.type==='plot-coordinate'?CK.pupilSpec('model',{check:()=>points.length===1&&rawCoordinate(points[0])===challenge.targetCoordinate}):challenge.type==='identify-quadrant'?CK.pupilSpec('choice',{choices:['Quadrant I','Quadrant II','Quadrant III','Quadrant IV']}):CK.pupilSpec(challenge.type==='missing-coordinate'?'number':'coordinate')),actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'},{action:'end',label:'Back to setup'}]:[{action:'end',label:'End challenge'}]}):'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-coord gd-coordinate-direct">'+
      '<svg id="co-svg" data-co-min="'+view.min+'" data-co-max="'+view.max+'" viewBox="0 0 '+W+' '+W+'" aria-label="Interactive coordinate grid">'+
        lines+
        '<line class="gd-axis" x1="'+zeroX+'" y1="'+pad+'" x2="'+zeroX+'" y2="'+(W-pad)+'"></line>'+
        '<line class="gd-axis" x1="'+pad+'" y1="'+zeroY+'" x2="'+(W-pad)+'" y2="'+zeroY+'"></line>'+
        labels+plotted+
      '</svg>'+
      (challenge?.mode==='standard'&&challengeFrozen()?'':'<div class="gd-co-context"><span id="co-context-text">'+(challengeFrozen()?'The given point'+(points.length===1?' is':'s are')+' fixed for this challenge.':selected>=0&&points[selected]?'Selected '+esc(pointLabel(selected,points[selected])):'Tap the grid to plot a point. Drag an existing point to move it.')+'</span><div class="gd-context-actions">'+
        '<button type="button" class="gd-context-history" data-co-undo-stage'+(!undoStack.length||challengeFrozen()?' disabled':'')+'>Undo</button>'+
        '<button type="button" class="gd-context-history" data-co-redo-stage'+(!redoStack.length||challengeFrozen()?' disabled':'')+'>Redo</button>'+
        '<button type="button" class="gd-context-delete" data-co-delete'+(challengeFrozen()||!(selected>=0&&points[selected])?' hidden':'')+'>Delete point</button>'+
      '</div></div>')+
      (challenge?.mode==='standard'?'':'<div class="gd-readout" id="co-readout">'+esc(pointsText())+'</div>')+
    '</div>';
    bindStage();
    bindChallengeStageActions();
    syncControls();
  }

  setPanels(controlsHtml(),'');
  bindControls();
  draw();
  G.lessonState?.register('coordinates',()=>({diagram:teachingSnapshot(),challenge,beforeChallenge,pupil:CK?.capturePupil?.(challenge),controlTab,challengeTab,challengeCategory,challengeType,exportMode,responseLines}),saved=>{
    restoreTeachingSnapshot(saved.diagram);challenge=saved.challenge?CK.normalise(saved.challenge):null;beforeChallenge=saved.beforeChallenge||null;
    if(Object.prototype.hasOwnProperty.call(saved,'controlTab'))controlTab=saved.controlTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeTab'))challengeTab=saved.challengeTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeCategory'))challengeCategory=saved.challengeCategory;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeType'))challengeType=saved.challengeType;
    if(Object.prototype.hasOwnProperty.call(saved,'exportMode'))exportMode=saved.exportMode;
    if(Object.prototype.hasOwnProperty.call(saved,'responseLines'))responseLines=saved.responseLines;
    CK?.restorePupil?.(challenge,saved.pupil);renderControls();draw();
  });

}

function measurementTool(){
  const CK=G.challengeKit,X=G.exportTools;
  let cm=12.3,dragPointer=null,primaryScale='metric',secondRuler=null,activeRuler=0,syncRulers=false;
  const INCH_CM=2.54,IMPERIAL_MAX_CM=12*INCH_CM;
  const CHALLENGE_CATEGORIES=[
    {id:'read',label:'Read & place'},
    {id:'convert',label:'Convert units'},
    {id:'reason',label:'Reasoning'}
  ];
  const CHALLENGE_TEMPLATES=[
    {id:'read-mark',category:'read',title:'Read the ruler',desc:'Read the orange marker to the nearest millimetre.'},
    {id:'place-mark',category:'read',title:'Place the mark',desc:'Move the marker to a requested length.'},
    {id:'distance-between',category:'read',title:'Distance between marks',desc:'Find the distance between two ruler marks.'},
    {id:'cm-to-mm',category:'convert',title:'Centimetres to millimetres',desc:'Convert a decimal centimetre length to millimetres.'},
    {id:'mm-to-cm',category:'convert',title:'Millimetres to centimetres',desc:'Convert millimetres to centimetres.'},
    {id:'cm-to-m',category:'convert',title:'Centimetres to metres',desc:'Convert centimetres to metres.'},
    {id:'unit-misconception',category:'reason',title:'Spot the conversion error',desc:'Explain a plausible ×10 / ×100 unit-conversion error.'}
  ];
  let controlTab='explore',challengeTab='standard',challengeCategory='read',challengeType='read-mark',challenge=null,beforeChallenge=null;
  let exportMode='diagram',responseLines=1,exportStatus='';

  function roundCm(value){return Math.round(clamp(Number(value)||0,0,30)*10)/10}
  function maxCm(scale){return scale==='imperial'?IMPERIAL_MAX_CM:30}
  function snapCm(value,scale='metric'){
    const maximum=maxCm(scale),raw=clamp(Number(value)||0,0,maximum);
    return scale==='imperial'?Math.round(raw/(INCH_CM/16))*(INCH_CM/16):Math.round(raw*10)/10;
  }
  function rulerState(index=0){return index===0?{cm,scale:primaryScale}:(secondRuler||{cm,scale:primaryScale})}
  function setRulerCm(index,value){
    const state=rulerState(index),linkedMax=syncRulers&&secondRuler?Math.min(maxCm(primaryScale),maxCm(secondRuler.scale)):maxCm(state.scale);
    const next=snapCm(clamp(Number(value)||0,0,linkedMax),state.scale);
    if(index===0)cm=next;else if(secondRuler)secondRuler={...secondRuler,cm:next};
    if(syncRulers&&secondRuler){
      const shared=clamp(next,0,Math.min(maxCm(primaryScale),maxCm(secondRuler.scale)));
      if(index===0)secondRuler={...secondRuler,cm:shared};
      else cm=shared;
    }
  }
  function setRulerScale(index,scale){
    const nextScale=scale==='imperial'?'imperial':'metric',state=rulerState(index),preserve=state.cm;
    if(index===0){primaryScale=nextScale;cm=syncRulers&&secondRuler?clamp(preserve,0,Math.min(maxCm(nextScale),maxCm(secondRuler.scale))):snapCm(preserve,nextScale)}
    else if(secondRuler){
      const nextCm=syncRulers?clamp(preserve,0,Math.min(maxCm(primaryScale),maxCm(nextScale))):snapCm(preserve,nextScale);
      secondRuler={...secondRuler,cm:nextCm,scale:nextScale};
      if(syncRulers)cm=nextCm;
    }
  }
  function setCm(value){cm=roundCm(value)}
  function mmValue(value=cm){return Math.round((Number(value)||0)*10)}
  function metresValue(value=cm){return Math.round(((Number(value)||0)/100)*10000)/10000}
  function cmText(value=cm){return Number((Math.round((Number(value)||0)*10)/10).toFixed(1)).toString()}
  function mText(value=cm){return Number(((Number(value)||0)/100).toFixed(3)).toString()}
  function decimalInches(value=cm){return Number(((Number(value)||0)/INCH_CM).toFixed(3)).toString()}
  function gcd(a,b){while(b){const t=b;b=a%b;a=t}return a||1}
  function inchText(value=cm){
    const total16=Math.round((Number(value)||0)/INCH_CM*16),whole=Math.floor(total16/16),fraction=total16%16;
    if(!fraction)return String(whole);
    const g=gcd(fraction,16),frac=(fraction/g)+'/'+(16/g);
    return whole?whole+' '+frac:frac;
  }
  function imperialAria(value=cm){return inchText(value)+' inches'}
  function readoutValues(state){
    if(state.scale==='imperial'){
      return[
        ['inches',inchText(state.cm)+' in'],
        ['decimal inches',decimalInches(state.cm)+' in'],
        ['centimetres',Number((state.cm).toFixed(2)).toString()+' cm']
      ];
    }
    return[
      ['millimetres',mmValue(state.cm)+' mm'],
      ['centimetres',cmText(state.cm)+' cm'],
      ['metres',mText(state.cm)+' m']
    ];
  }
  function snapshot(){return{cm,primaryScale,secondRuler:secondRuler?{cm:secondRuler.cm,scale:secondRuler.scale}:null,activeRuler,syncRulers}}
  function restoreSnapshot(value){
    if(!value)return;
    primaryScale=value.primaryScale==='imperial'?'imperial':'metric';
    cm=snapCm(value.cm,primaryScale);
    secondRuler=value.secondRuler?{cm:snapCm(value.secondRuler.cm,value.secondRuler.scale==='imperial'?'imperial':'metric'),scale:value.secondRuler.scale==='imperial'?'imperial':'metric'}:null;
    activeRuler=secondRuler&&Number(value.activeRuler)===1?1:0;
    syncRulers=!!value.syncRulers&&!!secondRuler;
    if(syncRulers&&secondRuler){const shared=clamp(cm,0,Math.min(maxCm(primaryScale),maxCm(secondRuler.scale)));cm=shared;secondRuler.cm=shared}
    dragPointer=null;
  }
  function readoutHidden(){return !!(challenge&&!challenge.revealed&&challenge.hiddenReadout)}
  function markerFrozen(){return !!(challenge&&challenge.mode==='standard'&&(challenge.freezeMarker||challenge.revealed))}
  function liveAnswer(source){
    if(source==='cm')return cmText()+' cm';
    if(source==='mm')return mmValue()+' mm';
    if(source==='m')return mText()+' m';
    if(source==='in')return inchText()+' in';
    if(source==='in-decimal')return decimalInches()+' in';
    return'';
  }
  function customAnswerSources(){
    return[
      {id:'cm',label:'Current marker in centimetres'},
      {id:'mm',label:'Current marker in millimetres'},
      {id:'m',label:'Current marker in metres'},
      {id:'in',label:'Current marker in inches — fraction'},
      {id:'in-decimal',label:'Current marker in inches — decimal'}
    ];
  }
  function updateChallengeAnswer(){
    if(!challenge||challenge.answerMode!=='bound'||!challenge.answerSource)return;
    challenge.answer=liveAnswer(challenge.answerSource);
    const live=q('#me-custom-live-answer');if(live)live.textContent=challenge.answer||'—';
    if(challenge.revealed){
      const shown=q('.gd-challenge-actions em',q('#gd-stage'));
      if(shown)shown.textContent='Answer: '+challenge.answer;
    }
  }
  function challengeObject(type,prompt,answer,extra={}){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);
    const raw={mode:'standard',type,category:meta?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),answerMode:'manual',answerSource:'',revealed:false,hiddenReadout:true,freezeMarker:true,secondaryCm:null,...extra};
    return CK?CK.normalise(raw):raw;
  }
  function workflowTabs(){
    return '<div class="gd-row gd-me-workflow-tabs" role="tablist" aria-label="Measurement workflow">'+
      '<button class="gd-btn'+(controlTab==='explore'?' gd-btn--primary':'')+'" type="button" data-me-workflow="explore">Explore</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-me-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-me-workflow="export">Export / reuse</button></div>';
  }
  function exploreControlsHtml(){
    const state=rulerState(activeRuler),imperial=state.scale==='imperial',display=imperial?decimalInches(state.cm):cmText(state.cm);
    const selector='<button class="gd-btn'+(activeRuler===0?' gd-btn--primary':'')+'" type="button" data-me-select-ruler="0">Ruler A</button>'+
      (secondRuler?'<button class="gd-btn'+(activeRuler===1?' gd-btn--primary':'')+'" type="button" data-me-select-ruler="1">Ruler B</button>':'');
    return '<div class="gd-field"><span>Rulers</span><div class="gd-row">'+selector+'</div></div>'+
      '<div class="gd-row"><button class="gd-btn" id="me-add-ruler" type="button"'+(secondRuler?' disabled':'')+'>Add ruler</button>'+
      '<button class="gd-btn" id="me-remove-ruler" type="button"'+(activeRuler===0?' disabled':'')+'>Remove selected</button></div>'+
      (secondRuler?'<label class="nl-check gd-ruler-sync-toggle"><input id="me-sync-rulers" type="checkbox"'+(syncRulers?' checked':'')+'> Sync rulers to the same physical length</label>':'')+
      field('Scale','<select class="gd-select" id="me-scale"><option value="metric"'+(!imperial?' selected':'')+'>Metric — 30 cm / 1 mm</option><option value="imperial"'+(imperial?' selected':'')+'>Imperial — 12 in / 1⁄16 in</option></select>')+
      field(imperial?'Measurement (inches)':'Measurement (cm)','<input class="gd-input" id="me-cm" type="range" min="0" max="'+(imperial?'12':'30')+'" step="'+(imperial?'0.0625':'0.1')+'" value="'+display+'">')+
      '<div class="gd-row">'+btn('Random mark','me-random')+'</div>'+
      '<p class="gd-help">Use one or two rulers. Give them different scales, then sync them when you want both markers to represent the same physical length. Metric snaps to 1 mm; imperial snaps to 1⁄16 inch when moved directly.</p>';
  }
  function challengeControlsHtml(){
    if(!CK)return '<p class="gd-help">Challenge tools are unavailable.</p>';
    const tabs=CK.tabsHtml?CK.tabsHtml('me',challengeTab):'';
    if(challengeTab==='custom'){
      const custom=challenge&&challenge.mode==='custom'?challenge:CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual'});
      return tabs+CK.editorHtml(custom,'me',{answerSources:customAnswerSources(),generatedAnswerLabel:'Keep the generated answer'})+
        '<div class="gd-row">'+(challenge&&challenge.answer?'<button class="gd-btn" id="me-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
        (challenge?'<button class="gd-btn" id="me-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
        '<p class="gd-help">Custom challenges stay attached to the live ruler. Bind the answer to the marker in cm, mm or m when you want it to update as the marker moves.</p>';
    }
    const picker=CK.pickerHtml(CHALLENGE_TEMPLATES,CHALLENGE_CATEGORIES,challengeCategory,challengeType,'me');
    const repeat=!!(challenge&&challenge.mode==='standard'&&challenge.type===challengeType);
    return tabs+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="me-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
      (challenge&&challenge.mode!=='custom'?'<button class="gd-btn" id="me-edit-challenge" type="button">Edit challenge</button>':'')+
      (challenge&&challenge.answer?'<button class="gd-btn" id="me-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
      (challenge?'<button class="gd-btn" id="me-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>';
  }
  function exportControlsHtml(){
    const canCard=!!challenge;
    if(!canCard&&exportMode==='challenge')exportMode='diagram';
    return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export the ruler as a clean vector diagram or a pupil-ready challenge card.</span></div></div>'+
      (canCard?'<div class="nl-export-mode me-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-me-export-mode="challenge">Challenge card</button>'+
        '<button type="button" class="'+(exportMode==='diagram'?'is-active':'')+'" data-me-export-mode="diagram">Ruler only</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="me-response-lines">'+
          [1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+
          '</select></label><p class="gd-help">The pupil card contains the question, ruler and blank answer space. Revealed conversions are hidden again automatically.</p>'
        :'<p class="gd-help">Ruler-only export contains the current scale, markers and visible unit readouts without editing controls.</p>')+
      '<div class="nl-export-grid me-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="me-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'challenge':'image')+'</button>'+
        '<button class="gd-btn" id="me-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="me-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="me-print" type="button">Print / PDF</button>'+
      '</div><p class="gd-help" id="me-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }
  function meSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function exportReadoutHidden(pupil=false){
    if(!challenge)return false;
    return pupil?!!challenge.hiddenReadout:readoutHidden();
  }
  function showMainExportMarker(pupil=false){
    return !(pupil&&challenge?.mode==='standard'&&challenge.type==='place-mark');
  }
  function rulerExportSvg({pupil=false}={}){
    if(!pupil&&!challenge&&(primaryScale==='imperial'||secondRuler))return exploreRulersExportSvg();
    const focused=pupil&&challenge?.mode==='standard',width=1100,height=focused?252:340,left=50,right=50,rulerY=72,rulerH=145,rulerW=width-left-right,baseY=rulerY+rulerH;
    const svg=meSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'30 centimetre ruler','data-me-export':'ruler'});
    svg.appendChild(meSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(meSvgEl('rect',{x:left,y:rulerY,width:rulerW,height:rulerH,rx:8,fill:'#fbfcfc',stroke:'#9fb2b7','stroke-width':2,'data-me-export-ruler':'1'}));
    for(let i=0;i<=300;i++){
      const x=left+i/300*rulerW,h=i%10===0?64:i%5===0?42:27;
      svg.appendChild(meSvgEl('line',{x1:x,y1:baseY-h,x2:x,y2:baseY,stroke:'#344b52','stroke-width':i%10===0?1.8:1}));
      if(i%10===0)svg.appendChild(meSvgEl('text',{x,y:rulerY+27,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':11,'font-weight':700,fill:'#566a70'},i/10));
    }
    const secondary=challenge?.secondaryCm!=null&&Number.isFinite(Number(challenge.secondaryCm))?roundCm(challenge.secondaryCm):null;
    function addMarker(value,colour,label,kind){
      const x=left+roundCm(value)/30*rulerW;
      svg.appendChild(meSvgEl('line',{x1:x,y1:rulerY-8,x2:x,y2:baseY+2,stroke:colour,'stroke-width':4,'data-me-export-marker':kind}));
      svg.appendChild(meSvgEl('path',{d:'M '+(x-8)+' '+(rulerY-8)+' L '+(x+8)+' '+(rulerY-8)+' L '+x+' '+(rulerY+5)+' Z',fill:colour}));
      if(label)svg.appendChild(meSvgEl('text',{x,y:rulerY-22,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':14,'font-weight':900,fill:'#334a52'},label));
    }
    if(secondary!=null)addMarker(secondary,'#3186b3','A','secondary');
    if(showMainExportMarker(pupil))addMarker(cm,'#d98f24',secondary!=null?'B':'','main');
    const hidden=exportReadoutHidden(pupil),readY=274;
    const readouts=[
      ['millimetres',hidden?'?':mmValue()+' mm'],
      ['centimetres',hidden?'?':cmText()+' cm'],
      ['metres',hidden?'?':mText()+' m']
    ];
    const cardW=285,gap=28,start=(width-(cardW*3+gap*2))/2;
    if(!focused)readouts.forEach((item,index)=>{
      const x=start+index*(cardW+gap);
      svg.appendChild(meSvgEl('rect',{x,y:readY-29,width:cardW,height:50,rx:11,fill:'#f5f8f8',stroke:'#d8e2e4','stroke-width':1}));
      svg.appendChild(meSvgEl('text',{x:x+14,y:readY-8,'font-family':'Arial,sans-serif','font-size':10,'font-weight':700,fill:'#74868b'},item[0]));
      svg.appendChild(meSvgEl('text',{x:x+cardW-14,y:readY+6,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':17,'font-weight':900,fill:'#334a52'},item[1]));
    });
    svg.appendChild(meSvgEl('text',{x:width-50,y:height-16,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exploreRulersExportSvg(){
    const states=[rulerState(0),...(secondRuler?[rulerState(1)]:[])],width=1100,cardH=265,gap=24,height=32+states.length*(cardH+gap)+20;
    const svg=meSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Ruler comparison','data-me-export':'ruler-comparison'});
    svg.appendChild(meSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    states.forEach((state,index)=>{
      const x0=45,y0=26+index*(cardH+gap),rulerY=y0+48,rulerH=118,rulerW=width-90,baseY=rulerY+rulerH,imperial=state.scale==='imperial';
      svg.appendChild(meSvgEl('text',{x:x0,y:y0+20,'font-family':'Arial,sans-serif','font-size':16,'font-weight':850,fill:'#334a52','data-me-export-ruler-label':index},'Ruler '+(index===0?'A':'B')+' — '+(imperial?'Imperial':'Metric')));
      svg.appendChild(meSvgEl('rect',{x:x0,y:rulerY,width:rulerW,height:rulerH,rx:8,fill:'#fbfcfc',stroke:'#9fb2b7','stroke-width':2,'data-me-export-ruler':index}));
      const divisions=imperial?192:300;
      for(let i=0;i<=divisions;i++){
        const x=x0+i/divisions*rulerW;
        let h,major;
        if(imperial){major=i%16===0;h=major?56:i%8===0?45:i%4===0?36:i%2===0?28:20}
        else{major=i%10===0;h=major?56:i%5===0?39:24}
        svg.appendChild(meSvgEl('line',{x1:x,y1:baseY-h,x2:x,y2:baseY,stroke:'#344b52','stroke-width':major?1.8:1}));
        if(major)svg.appendChild(meSvgEl('text',{x,y:rulerY+24,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':11,'font-weight':700,fill:'#566a70'},imperial?i/16:i/10));
      }
      const markerX=x0+state.cm/maxCm(state.scale)*rulerW;
      svg.appendChild(meSvgEl('line',{x1:markerX,y1:rulerY-8,x2:markerX,y2:baseY+2,stroke:'#d98f24','stroke-width':4,'data-me-export-marker':index===0?'main':'second-ruler'}));
      svg.appendChild(meSvgEl('path',{d:'M '+(markerX-8)+' '+(rulerY-8)+' L '+(markerX+8)+' '+(rulerY-8)+' L '+markerX+' '+(rulerY+5)+' Z',fill:'#d98f24'}));
      const values=readoutValues(state);
      values.forEach((item,j)=>{
        const x=x0+j*335;
        svg.appendChild(meSvgEl('text',{x,y:y0+220,'font-family':'Arial,sans-serif','font-size':10,'font-weight':700,fill:'#74868b'},item[0]));
        svg.appendChild(meSvgEl('text',{x,y:y0+242,'font-family':'Arial,sans-serif','font-size':16,'font-weight':900,fill:'#334a52','data-me-export-readout':index+'-'+j},item[1]));
      });
    });
    svg.appendChild(meSvgEl('text',{x:width-45,y:height-10,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return rulerExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(rulerExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Measurement challenge',
      prompt:challenge.type==='place-mark'?'Draw a mark at '+cmText(challenge.targetCm)+' cm on the ruler.':prompt,
      responseLabel:challenge.type==='place-mark'?'Working / answer':challenge.category==='reason'?'Explain your thinking':'Answer',
      responseLines,
      brand:'99 Club Studio'
    });
  }
  function exportName(){
    const meta=challenge&&CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return exportMode==='challenge'&&challenge?(challenge.title||meta?.title||'measurement-challenge'):(primaryScale==='imperial'||secondRuler?'measurement-rulers':'measurement-ruler');
  }
  function exportMessage(text){exportStatus=text;const el=q('#me-export-status');if(el)el.textContent=text}
  async function exportAction(kind){
    try{
      if(!X)throw new Error('Export tools are not available.');
      const target=exportTargetSvg(),isCard=exportMode==='challenge'&&!!challenge,name=exportName();
      if(kind==='copy'){await X.copyPng(target);exportMessage(isCard?'Challenge copied — paste it into your worksheet, slide or document.':'Ruler image copied — paste it into your slide or document.')}
      if(kind==='png'){await X.downloadPng(target,name,2);exportMessage(isCard?'Challenge PNG downloaded.':'Ruler PNG downloaded.')}
      if(kind==='svg'){X.downloadSvg(target,name);exportMessage(isCard?'Challenge SVG downloaded.':'Ruler SVG downloaded.')}
      if(kind==='print'){X.printSvg(target,{title:'',landscape:true});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'That export did not work.')}
  }
  function controlsHtml(){return workflowTabs()+(controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():exploreControlsHtml())}
  function renderControls(){const panel=q('#gd-controls');if(panel)panel.innerHTML=controlsHtml();bindControls()}
  function enterCustomChallenge(){
    const wasCustom=challenge?.mode==='custom';
    if(!wasCustom&&!beforeChallenge)beforeChallenge=snapshot();
    if(!wasCustom){primaryScale='metric';activeRuler=0;cm=roundCm(cm)}
    if(CK)challenge=CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''});
    challenge.hiddenReadout=challenge.answerMode==='bound'&&!!challenge.answerSource;
    challenge.freezeMarker=false;challenge.secondaryCm=null;
    challengeTab='custom';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();draw();
  }
  function setCustomAnswerSource(source){
    if(!challenge||challenge.mode!=='custom')return;
    if(source==='manual'){
      challenge.answerMode='manual';challenge.answerSource='';challenge.hiddenReadout=false;
    }else if(source==='generated'){
      challenge.answerMode='bound';challenge.answerSource='';challenge.hiddenReadout=false;
    }else{
      challenge.answerMode='bound';challenge.answerSource=source;challenge.answer=liveAnswer(source);challenge.hiddenReadout=true;
    }
    challenge.revealed=false;renderControls();draw();
  }
  function clearChallenge(){
    if(beforeChallenge){restoreSnapshot(beforeChallenge);beforeChallenge=null}
    challenge=null;challengeTab='standard';controlTab='challenge';renderControls();draw();
  }
  function randomTenth(min=1,max=299){return Math.max(0,Math.min(300,min+Math.floor(Math.random()*(max-min+1))))/10}
  function generateChallenge(type){
    const template=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!template)return;
    if(!beforeChallenge)beforeChallenge=snapshot();else restoreSnapshot(beforeChallenge);
    primaryScale='metric';activeRuler=0;cm=roundCm(cm);
    if(type==='read-mark'){
      setCm(randomTenth());
      challenge=challengeObject(type,'What length does the orange marker show?',cmText()+' cm');
    }else if(type==='place-mark'){
      const target=randomTenth(5,295),starts=[0,3,7,12,18,24,30].map(x=>x+Math.floor(Math.random()*5)/10).filter(x=>Math.abs(x-target)>.2);
      setCm(starts[Math.floor(Math.random()*starts.length)]||0);
      challenge=challengeObject(type,'Move the orange marker to '+cmText(target)+' cm.',cmText(target)+' cm',{freezeMarker:false,hiddenReadout:true,targetCm:target});
    }else if(type==='distance-between'){
      let a=randomTenth(5,220),b=randomTenth(Math.round(a*10)+15,295);
      if(b<=a){a=5;b=12.5}
      setCm(b);
      challenge=challengeObject(type,'How far apart are marks A and B?',cmText(b-a)+' cm',{secondaryCm:a});
    }else if(type==='cm-to-mm'){
      setCm(randomTenth());
      challenge=challengeObject(type,cmText()+' cm is how many millimetres?',mmValue()+' mm');
    }else if(type==='mm-to-cm'){
      setCm(randomTenth());
      challenge=challengeObject(type,mmValue()+' mm is how many centimetres?',cmText()+' cm');
    }else if(type==='cm-to-m'){
      setCm(randomTenth(10,300));
      challenge=challengeObject(type,cmText()+' cm is how many metres?',mText()+' m');
    }else{
      setCm([2.4,3.5,7.2,12.3,18.6,24.8][Math.floor(Math.random()*6)]);
      const valid=Math.random()<.5,shown=valid?mmValue():Math.random()<.5?mmValue()*10:mmValue()/10;
      challenge=challengeObject(type,'A pupil says '+cmText()+' cm = '+shown+' mm. Are they correct?',(valid?'Yes. ':'No. ')+cmText()+' cm = '+mmValue()+' mm because 1 cm = 10 mm.',{hiddenReadout:true});
    }
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';
    exportMode='challenge';responseLines=template.category==='reason'?3:1;exportStatus='';renderControls();draw();
  }
  function rulerValueFromClientX(clientX,ruler,index=0){
    const rect=ruler.getBoundingClientRect(),ratio=clamp((clientX-rect.left)/Math.max(1,rect.width),0,1),state=rulerState(index);
    return snapCm(ratio*maxCm(state.scale),state.scale);
  }
  function selectedSliderValue(){
    const state=rulerState(activeRuler);
    return state.scale==='imperial'?decimalInches(state.cm):cmText(state.cm);
  }
  function refreshLiveMeasurement(){
    CK?.refreshModelPupil?.(challenge);
    updateChallengeAnswer();
    qa('.gd-ruler-card[data-me-ruler-index]',q('#gd-stage')).forEach(card=>{
      const index=Math.round(num(card.dataset.meRulerIndex,0)),state=rulerState(index),maximum=maxCm(state.scale),imperial=state.scale==='imperial';
      const marker=q('.gd-ruler-marker.is-interactive',card);
      if(marker){
        marker.style.left=(state.cm/maximum*100)+'%';
        marker.setAttribute('aria-valuenow',imperial?decimalInches(state.cm):cmText(state.cm));
        marker.setAttribute('aria-valuemax',imperial?'12':'30');
        marker.setAttribute('aria-valuetext',imperial?imperialAria(state.cm):cmText(state.cm)+' centimetres');
      }
      const values=readoutValues(state),hidden=index===0&&readoutHidden();
      qa('[data-me-readout-value]',card).forEach((el,i)=>{if(values[i])el.textContent=hidden?'?':values[i][1]});
    });

    const slider=q('#me-cm',q('#gd-controls'));if(slider)slider.value=selectedSliderValue();
  }
  function setFromPointer(clientX,ruler,index){
    if(index===0&&markerFrozen())return;
    setRulerCm(index,rulerValueFromClientX(clientX,ruler,index));refreshLiveMeasurement();
  }
  function bindRulers(){
    qa('.gd-ruler[data-me-ruler-index]',q('#gd-stage')).forEach(ruler=>{
      const index=Math.round(num(ruler.dataset.meRulerIndex,0)),marker=q('.gd-ruler-marker.is-interactive',ruler);
      if(!marker)return;
      ruler.onpointerdown=e=>{
        if((index===0&&markerFrozen())||(e.button!=null&&e.button!==0))return;
        e.preventDefault();dragPointer={pointerId:e.pointerId,index};
        try{ruler.setPointerCapture(e.pointerId)}catch(_){}
        setFromPointer(e.clientX,ruler,index);
      };
      ruler.onpointermove=e=>{
        if(!dragPointer||dragPointer.pointerId!==e.pointerId||dragPointer.index!==index)return;
        e.preventDefault();setFromPointer(e.clientX,ruler,index);
      };
      const finish=e=>{if(dragPointer&&dragPointer.pointerId===e.pointerId&&dragPointer.index===index)dragPointer=null};
      ruler.onpointerup=finish;ruler.onpointercancel=finish;
      marker.onkeydown=e=>{
        if(index===0&&markerFrozen())return;
        const state=rulerState(index),step=state.scale==='imperial'?INCH_CM/16:.1;
        if(e.key==='ArrowLeft'){e.preventDefault();setRulerCm(index,state.cm-step);refreshLiveMeasurement()}
        else if(e.key==='ArrowRight'){e.preventDefault();setRulerCm(index,state.cm+step);refreshLiveMeasurement()}
        else if(e.key==='Home'){e.preventDefault();setRulerCm(index,0);refreshLiveMeasurement()}
        else if(e.key==='End'){e.preventDefault();setRulerCm(index,maxCm(state.scale));refreshLiveMeasurement()}
      };
    });
    qa('[data-me-select-stage]',q('#gd-stage')).forEach(button=>button.onclick=()=>{
      if(challenge)return;
      activeRuler=Number(button.dataset.meSelectStage)===1&&secondRuler?1:0;renderControls();draw();
    });
  }
  function toggleRulerReveal(){if(!challenge)return;challenge.revealed=!challenge.revealed;if(challenge.mode==='standard'&&challenge.type==='place-mark'){if(challenge.revealed){challenge.modelBeforeReveal=snapshot();setCm(challenge.targetCm)}else if(challenge.modelBeforeReveal){restoreSnapshot(challenge.modelBeforeReveal);delete challenge.modelBeforeReveal}}renderControls();draw()}
  function bindChallengeStageActions(){
    const endChallenge=q('[data-challenge-action="end"]',q('#gd-stage'));if(endChallenge)endChallenge.onclick=e=>{e.stopPropagation();clearChallenge()};
    const stage=q('#gd-stage');if(!stage||!challenge)return;
    const reveal=q('[data-board-action="reveal"]',stage);
    if(reveal)reveal.onclick=e=>{e.stopPropagation();toggleRulerReveal()};
    const another=q('[data-challenge-action="another"]',stage);
    if(another)another.onclick=e=>{e.stopPropagation();if(challenge?.mode==='standard')generateChallenge(challenge.type)};
  }
  function bindControls(){
    const controls=q('#gd-controls');if(!controls)return;
    qa('[data-me-workflow]',controls).forEach(button=>button.onclick=()=>{
      const next=button.dataset.meWorkflow;
      controlTab=next==='challenge'?'challenge':next==='export'?'export':'explore';renderControls();
    });
    if(controlTab==='export'){
      qa('[data-me-export-mode]',controls).forEach(button=>button.onclick=()=>{
        exportMode=button.dataset.meExportMode==='challenge'&&challenge?'challenge':'diagram';exportStatus='';renderControls();
      });
      const response=q('#me-response-lines',controls);if(response)response.onchange=()=>{
        responseLines=clamp(Math.round(num(response.value,1)),1,4);renderControls();
      };
      const copyImage=q('#me-copy-image',controls);if(copyImage)copyImage.onclick=()=>exportAction('copy');
      const png=q('#me-png',controls);if(png)png.onclick=()=>exportAction('png');
      const svgDownload=q('#me-svg-download',controls);if(svgDownload)svgDownload.onclick=()=>exportAction('svg');
      const print=q('#me-print',controls);if(print)print.onclick=()=>exportAction('print');
      return;
    }
    if(controlTab==='explore'){
      qa('[data-me-select-ruler]',controls).forEach(button=>button.onclick=()=>{
        activeRuler=Number(button.dataset.meSelectRuler)===1&&secondRuler?1:0;renderControls();draw();
      });
      const add=q('#me-add-ruler',controls);if(add)add.onclick=()=>{
        if(secondRuler)return;
        const source=rulerState(0),scale=source.scale==='metric'?'imperial':'metric';secondRuler={cm:clamp(source.cm,0,maxCm(scale)),scale};syncRulers=false;activeRuler=1;renderControls();draw();
      };
      const remove=q('#me-remove-ruler',controls);if(remove)remove.onclick=()=>{
        if(activeRuler!==1)return;secondRuler=null;syncRulers=false;activeRuler=0;renderControls();draw();
      };
      const sync=q('#me-sync-rulers',controls);if(sync)sync.onchange=()=>{
        syncRulers=!!sync.checked;
        if(syncRulers&&secondRuler){const state=rulerState(activeRuler),shared=clamp(state.cm,0,Math.min(maxCm(primaryScale),maxCm(secondRuler.scale)));cm=shared;secondRuler={...secondRuler,cm:shared}}
        renderControls();draw();
      };
      const scale=q('#me-scale',controls);if(scale)scale.onchange=()=>{setRulerScale(activeRuler,scale.value);renderControls();draw()};
      const slider=q('#me-cm',controls);if(slider)slider.oninput=()=>{
        const state=rulerState(activeRuler),value=state.scale==='imperial'?Number(slider.value)*INCH_CM:Number(slider.value);
        setRulerCm(activeRuler,value);refreshLiveMeasurement();
      };
      const random=q('#me-random',controls);if(random)random.onclick=()=>{
        const state=rulerState(activeRuler),steps=state.scale==='imperial'?192:300,step=maxCm(state.scale)/steps;
        setRulerCm(activeRuler,Math.floor(Math.random()*(steps+1))*step);refreshLiveMeasurement();
      };
      return;
    }
    qa('[data-me-challenge-tab]',controls).forEach(button=>button.onclick=()=>{
      if(button.dataset.meChallengeTab==='custom')enterCustomChallenge();else{challengeTab='standard';renderControls()}
    });
    qa('[data-me-challenge-cat]',controls).forEach(button=>button.onclick=()=>{
      challengeCategory=button.dataset.meChallengeCat;
      const first=CHALLENGE_TEMPLATES.find(t=>t.category===challengeCategory);if(first)challengeType=first.id;
      renderControls();
    });
    qa('[data-me-challenge-type]',controls).forEach(button=>button.onclick=()=>{challengeType=button.dataset.meChallengeType;renderControls()});
    const generate=q('#me-generate',controls);if(generate)generate.onclick=()=>generateChallenge(challengeType);
    const edit=q('#me-edit-challenge',controls);if(edit)edit.onclick=enterCustomChallenge;
    const end=q('#me-clear-challenge',controls);if(end)end.onclick=clearChallenge;
    const reveal=q('#me-reveal',controls);if(reveal)reveal.onclick=toggleRulerReveal;
    qa('[data-gd-rich-action]',controls).forEach(button=>button.onclick=e=>{
      e.preventDefault();const editor=q('#me-custom-prompt',controls);
      if(editor&&CK&&challenge){
        CK.applyFormat(editor,button.dataset.gdRichAction);
        challenge.promptHtml=CK.sanitiseRichHtml(editor.innerHTML);
        challenge.prompt=CK.plainText(challenge.promptHtml).slice(0,600);draw();
      }
    });
    const title=q('#me-custom-title',controls);if(title)title.oninput=()=>{if(!challenge)return;challenge.title=title.value.slice(0,100);draw()};
    const prompt=q('#me-custom-prompt',controls);if(prompt)prompt.oninput=()=>{
      if(!challenge||!CK)return;challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml).slice(0,600);draw();
    };
    const source=q('#me-custom-answer-source',controls);if(source)source.onchange=()=>setCustomAnswerSource(source.value);
    const answer=q('#me-custom-answer',controls);if(answer)answer.oninput=()=>{
      if(!challenge)return;challenge.answer=answer.value.slice(0,400);challenge.answerMode='manual';challenge.answerSource='';challenge.hiddenReadout=false;
      if(challenge.revealed)draw();
    };
  }
  function ticksForScale(scale){
    let ticks='';
    if(scale==='imperial'){
      for(let i=0;i<=192;i++){
        const p=i/192*100,h=i%16===0?55:i%8===0?45:i%4===0?35:i%2===0?28:21;
        ticks+='<span class="gd-ruler-tick" style="left:'+p+'%;height:'+h+'px"></span>';
        if(i%16===0)ticks+='<span class="gd-ruler-num" style="left:'+p+'%">'+(i/16)+'</span>';
      }
      return ticks;
    }
    for(let i=0;i<=300;i++){
      const p=i/300*100,h=i%10===0?55:i%5===0?35:22;
      ticks+='<span class="gd-ruler-tick" style="left:'+p+'%;height:'+h+'px"></span>';
      if(i%10===0)ticks+='<span class="gd-ruler-num" style="left:'+p+'%">'+(i/10)+'</span>';
    }
    return ticks;
  }
  function rulerCardMarkup(index,state){
    const primary=index===0,imperial=state.scale==='imperial',maximum=maxCm(state.scale),hidden=primary&&readoutHidden(),frozen=primary&&markerFrozen();
    const secondary=primary&&challenge?.secondaryCm!=null&&Number.isFinite(Number(challenge.secondaryCm))?roundCm(challenge.secondaryCm):null;
    const secondaryMarker=secondary!=null
      ?'<span class="gd-ruler-marker gd-ruler-marker--secondary" style="left:'+(secondary/30*100)+'%"><span class="gd-ruler-marker-label">A</span></span>'
      :'';
    const mainLabel=secondary!=null?'B':'',values=readoutValues(state),rulerId=primary?'me-ruler':'me-ruler-1',markerId=primary?'me-marker':'me-marker-1';
    return '<section class="gd-ruler-card'+(!challenge&&activeRuler===index?' is-selected':'')+'" data-me-ruler-index="'+index+'">'+
      '<div class="gd-ruler-card-head">'+(challenge?'<strong>Ruler A</strong>':'<button type="button" class="gd-ruler-select" data-me-select-stage="'+index+'">Ruler '+(index===0?'A':'B')+' — '+(imperial?'Imperial':'Metric')+(activeRuler===index?' • selected':'')+'</button>')+'</div>'+
      '<div class="gd-ruler'+(frozen?' is-frozen':' is-interactive')+'" id="'+rulerId+'" data-me-ruler-index="'+index+'" data-me-scale="'+state.scale+'" data-me-target-cm="'+(primary&&challenge?.mode==='standard'&&challenge.type==='place-mark'?challenge.targetCm:'')+'" aria-label="'+(imperial?'12 inch':'30 centimetre')+' ruler">'+ticksForScale(state.scale)+
        secondaryMarker+
        '<span class="gd-ruler-marker is-interactive'+(frozen?' is-frozen':'')+'" id="'+markerId+'" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="'+(imperial?'12':'30')+'" aria-valuenow="'+(imperial?decimalInches(state.cm):cmText(state.cm))+'" aria-valuetext="'+(imperial?imperialAria(state.cm):cmText(state.cm)+' centimetres')+'" style="left:'+(state.cm/maximum*100)+'%">'+
          (mainLabel?'<span class="gd-ruler-marker-label">'+mainLabel+'</span>':'')+
        '</span>'+
      '</div>'+
      (primary&&challenge?.mode==='standard'&&!challenge.revealed?'':'<div class="gd-fdp-readout">'+values.map(item=>'<div class="gd-fdp-value"><span>'+item[0]+'</span><strong data-me-readout-value>'+(hidden?'?':item[1])+'</strong></div>').join('')+'</div>')+
    '</section>';
  }
  function draw(){
    updateChallengeAnswer();
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Measurement challenge',pupil:(challenge.type==='place-mark'?CK.pupilSpec('model',{check:()=>Math.abs(cm-challenge.targetCm)<1e-8}):challenge.type==='unit-misconception'?CK.pupilSpec('choice',{choices:['Yes','No'],expected:challenge.answer.startsWith('Yes')?'Yes':'No',explain:true}):CK.pupilSpec('unit',{unit:challenge.type==='cm-to-mm'?'mm':challenge.type==='cm-to-m'?'m':'cm'})),actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'},{action:'end',label:'Back to setup'}]:[{action:'end',label:'End challenge'}]}):'';
    const targetStatus='';
    const states=challenge?[rulerState(0)]:[rulerState(0),...(secondRuler?[rulerState(1)]:[])];
    const syncReadout=!challenge&&secondRuler&&syncRulers
      ?'<div class="gd-ruler-sync-readout"><span>Linked length</span><strong>'+cmText(cm)+' cm ↔ '+inchText(cm)+' in</strong></div>':'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-measurement-direct">'+
      '<div class="gd-ruler-stack">'+states.map((state,index)=>rulerCardMarkup(index,state)).join('')+'</div>'+
      syncReadout+targetStatus+
    '</div>';
    bindRulers();bindChallengeStageActions();
    const slider=q('#me-cm',q('#gd-controls'));if(slider)slider.value=selectedSliderValue();
  }

  setPanels(controlsHtml(),'');
  bindControls();
  draw();
  G.lessonState?.register('measurement',()=>({diagram:snapshot(),challenge,beforeChallenge,pupil:CK?.capturePupil?.(challenge),controlTab,challengeTab,challengeCategory,challengeType,exportMode,responseLines}),saved=>{
    restoreSnapshot(saved.diagram);challenge=saved.challenge?CK.normalise(saved.challenge):null;beforeChallenge=saved.beforeChallenge||null;
    if(Object.prototype.hasOwnProperty.call(saved,'controlTab'))controlTab=saved.controlTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeTab'))challengeTab=saved.challengeTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeCategory'))challengeCategory=saved.challengeCategory;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeType'))challengeType=saved.challengeType;
    if(Object.prototype.hasOwnProperty.call(saved,'exportMode'))exportMode=saved.exportMode;
    if(Object.prototype.hasOwnProperty.call(saved,'responseLines'))responseLines=saved.responseLines;
    CK?.restorePupil?.(challenge,saved.pupil);renderControls();draw();
  });

}

function randomiser(){
  const X=G.exportTools;
  let result='',diceValues=[],spinnerRotation=0,spinnerKind='colours',customSpinnerText='1\n2\n3\n4',busy=false,finishTimer=null;
  const COLOUR_SPINNER=[
    {label:'Red',colour:'#df4f4f',ink:'#ffffff'},
    {label:'Blue',colour:'#3976d3',ink:'#ffffff'},
    {label:'Green',colour:'#399b64',ink:'#ffffff'},
    {label:'Yellow',colour:'#f4cc45',ink:'#273e44'}
  ];
  const CUSTOM_WHEEL_COLOURS=['#b9ded8','#f2cf78','#a9c8ec','#efb0a7','#c9b7e8','#b9ddb3','#efc18e','#e7b5cf'];
  const OPPOSITE={1:6,6:1,2:5,5:2,3:4,4:3};
  function motionMs(){return window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches?40:1250}
  function customChoices(){return String(customSpinnerText||'').split(/\n|,/).map(x=>x.trim()).filter(Boolean).slice(0,16)}
  function wheelSegments(){
    if(spinnerKind==='colours')return COLOUR_SPINNER.map(x=>({...x}));
    return customChoices().map((label,i)=>({label,colour:CUSTOM_WHEEL_COLOURS[i%CUSTOM_WHEEL_COLOURS.length],ink:'#30484f'}));
  }
  function pipFace(value){
    const maps={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]},on=new Set(maps[value]||[]);
    return '<span class="gd-die-pips" aria-hidden="true">'+Array.from({length:9},(_,i)=>'<i'+(on.has(i+1)?' class="is-on"':'')+'></i>').join('')+'</span>';
  }
  function cubeFace(pos,value){return '<span class="gd-die-face gd-die-face--'+pos+'" data-ra-face-value="'+value+'">'+pipFace(value)+'</span>'}
  function d6Faces(value){
    const front=clamp(Math.round(Number(value)||1),1,6),back=OPPOSITE[front];
    const remaining=[1,2,3,4,5,6].filter(v=>v!==front&&v!==back);
    const top=remaining[0],bottom=OPPOSITE[top],right=remaining.find(v=>v!==bottom),left=OPPOSITE[right];
    return{front,back,right,left,top,bottom};
  }
  function dieHtml(value,sides,index,rolling){
    if(sides===6){
      const faces=d6Faces(value),turns=720+index*90;
      return '<div class="gd-die-space" aria-label="Die '+(index+1)+': '+value+'"><div class="gd-die-cube'+(rolling?' is-rolling':'')+'" data-ra-die="'+index+'" data-ra-final-value="'+value+'" style="--ra-start-x:'+(turns+140)+'deg;--ra-start-y:'+(turns+230)+'deg">'+
        cubeFace('front',faces.front)+cubeFace('back',faces.back)+cubeFace('right',faces.right)+cubeFace('left',faces.left)+cubeFace('top',faces.top)+cubeFace('bottom',faces.bottom)+'</div></div>';
    }
    return '<div class="gd-poly-die gd-poly-die--d'+sides+(rolling?' is-rolling':'')+'" style="--ra-delay:'+(index*45)+'ms" aria-label="D'+sides+' die '+(index+1)+': '+value+'"><strong>'+value+'</strong><small>d'+sides+'</small></div>';
  }
  function stageAction(mode,working=false){
    const label=working?(mode==='spinner'?'Spinning…':mode==='dice'?'Rolling…':actionLabel(mode)):actionLabel(mode);
    return '<button class="gd-btn gd-btn--primary gd-random-stage-action" type="button" data-ra-stage-go'+(working?' disabled':'')+'>'+label+'</button>';
  }
  function diceStage(rolling=false){
    const count=clamp(num(q('#ra-count')?.value,2),1,8),sides=clamp(num(q('#ra-sides')?.value,6),2,100),hasResult=diceValues.length===count,vals=hasResult?diceValues:Array.from({length:count},()=>1),total=vals.reduce((a,b)=>a+b,0);
    const resultText=hasResult?vals.join(' + ')+(vals.length>1?' = '+total:''):'Press Roll';
    return '<div class="gd-vis gd-randomiser-stage"><div class="gd-dice-table"><div class="gd-dice-set '+(count>4?'is-many':'')+'">'+vals.map((v,i)=>dieHtml(v,sides,i,rolling)).join('')+'</div>'+
      '<div class="gd-random-result" aria-live="polite"><span>'+(rolling?'Rolling…':'Result')+'</span><strong data-ra-result>'+(rolling?'—':esc(resultText))+'</strong></div></div>'+stageAction('dice',rolling)+'</div>';
  }
  function wheelMarkup(segments,rotation,label,working=false){
    const list=segments.length?segments:[{label:spinnerKind==='colours'?'Red':'Add choices',colour:'#c9ded9',ink:'#30484f'}],n=Math.max(1,list.length),step=360/n;
    const stops=list.map((item,i)=>item.colour+' '+(i*step)+'deg '+((i+1)*step)+'deg').join(',');
    const settled=((rotation%360)+360)%360;
    const labels=working?'':list.map((item,i)=>{
      const angle=((i+.5)*step+settled)%360,rad=angle*Math.PI/180,x=50+Math.sin(rad)*31,y=50-Math.cos(rad)*31;
      return '<span class="gd-spinner-label" data-ra-segment-label="'+esc(item.label)+'" style="left:'+x.toFixed(2)+'%;top:'+y.toFixed(2)+'%;--ra-label-colour:'+item.ink+'"><span>'+esc(item.label)+'</span></span>';
    }).join('');
    const chosen=list.find(x=>x.label===label),swatch=spinnerKind==='colours'&&chosen?'<i class="gd-spinner-result-swatch" style="--ra-result-colour:'+chosen.colour+'" aria-hidden="true"></i>':'';
    return '<div class="gd-vis gd-randomiser-stage"><div class="gd-spinner-layout"><div class="gd-spinner-shell"><div class="gd-spinner-pointer" aria-hidden="true"></div>'+
      '<div class="gd-spinner-wheel gd-spinner-wheel--'+spinnerKind+'" id="ra-wheel" data-ra-spinner-kind="'+spinnerKind+'" style="--ra-wheel:'+stops+';transform:rotate('+rotation+'deg)"><span class="gd-spinner-hub" aria-hidden="true"></span></div><div class="gd-spinner-label-layer" aria-hidden="'+(working?'true':'false')+'">'+labels+'</div></div>'+
      '<div class="gd-spinner-choice"><span>Selected</span><div class="gd-spinner-result-line">'+swatch+'<strong data-ra-result aria-live="polite">'+esc(label||'Press Spin')+'</strong></div><small>'+n+' choice'+(n===1?'':'s')+'</small></div></div>'+stageAction('spinner',working)+'</div>';
  }
  function cardStage(){const value=result||'—',red=/[♥♦]/.test(value);return '<div class="gd-vis gd-randomiser-stage"><div class="gd-playing-card'+(red?' is-red':'')+'" aria-live="polite"><span>'+esc(value)+'</span><strong>'+esc(value)+'</strong><span>'+esc(value)+'</span></div>'+stageAction('card')+'</div>'}
  function numberStage(){return '<div class="gd-vis gd-randomiser-stage"><div class="gd-random-number"><span>Random number</span><strong aria-live="polite">'+esc(result||'—')+'</strong></div>'+stageAction('number')+'</div>'}
  function show(mode=q('#ra-mode').value,rolling=false){
    const stage=q('#gd-stage');if(!stage)return;
    if(mode==='dice')stage.innerHTML=diceStage(rolling);
    else if(mode==='spinner')stage.innerHTML=wheelMarkup(wheelSegments(),spinnerRotation,rolling?'Spinning…':(result||'Press Spin'),rolling);
    else if(mode==='card')stage.innerHTML=cardStage();
    else stage.innerHTML=numberStage();
    const stageGo=q('[data-ra-stage-go]',stage);if(stageGo&&!stageGo.disabled)stageGo.onclick=generate;
  }
  function actionLabel(mode){return mode==='dice'?'Roll dice':mode==='spinner'?'Spin wheel':mode==='number'?'Pick number':'Draw card'}
  function spinnerControls(){
    const kind=field('Spinner mode','<select class="gd-select" id="ra-spinner-kind"><option value="colours"'+(spinnerKind==='colours'?' selected':'')+'>Colours</option><option value="custom"'+(spinnerKind==='custom'?' selected':'')+'>Custom words / numbers</option></select>');
    if(spinnerKind==='colours')return kind+'<p class="gd-help">Colour mode uses four matching segments: red, blue, green and yellow. The result repeats the same colour and name.</p>';
    return kind+field('Wheel choices','<textarea class="gd-textarea" id="ra-choices" rows="6" maxlength="320">'+esc(customSpinnerText)+'</textarea>','One choice per line or separated by commas. Up to 16 choices.')+
      '<p class="gd-help">Custom choices use colourful non-semantic segments: colour helps separate choices but does not name the answer.</p>';
  }
  function draw(){
    const mode=q('#ra-mode').value;busy=false;clearTimeout(finishTimer);finishTimer=null;let controls='';
    if(mode==='dice')controls=field('Number of dice','<input class="gd-input" id="ra-count" type="number" min="1" max="8" value="2">')+
      field('Sides','<select class="gd-select" id="ra-sides"><option value="6">6 · standard dice</option><option value="4">4</option><option value="8">8</option><option value="10">10</option><option value="12">12</option><option value="20">20</option></select>')+
      '<p class="gd-help">Six-sided dice are full 3D cubes with six pip faces. They tumble, then settle with the rolled face clearly visible.</p>';
    if(mode==='spinner')controls=spinnerControls();
    if(mode==='number')controls=field('Minimum','<input class="gd-input" id="ra-min" type="number" value="1">')+field('Maximum','<input class="gd-input" id="ra-max" type="number" value="100">');
    if(mode==='card')controls='<p class="gd-help">Draw from a standard 52-card deck.</p>';
    q('#ra-extra').innerHTML=controls;
    const go=q('#ra-go');if(go){go.textContent=actionLabel(mode);go.disabled=false}
    if(mode==='dice'){
      q('#ra-count').oninput=()=>{diceValues=[];result='';show('dice')};
      q('#ra-sides').onchange=()=>{diceValues=[];result='';show('dice')};
    }
    if(mode==='spinner'){
      const kind=q('#ra-spinner-kind');if(kind)kind.onchange=()=>{spinnerKind=kind.value==='custom'?'custom':'colours';result='';spinnerRotation=0;draw()};
      const choices=q('#ra-choices');if(choices)choices.oninput=()=>{customSpinnerText=choices.value;result='';spinnerRotation=0;show('spinner')};
    }
    show(mode);
  }
  function finish(label,mode){
    busy=false;result=label;
    const go=q('#ra-go');if(go){go.disabled=false;go.textContent=actionLabel(mode)}
    if(mode==='dice'||mode==='spinner'){show(mode,false);return}
    const stage=q('#gd-stage'),out=q('[data-ra-result]',stage);if(out)out.textContent=label;
    qa('.is-rolling',stage).forEach(el=>el.classList.remove('is-rolling'));
    const stageGo=q('[data-ra-stage-go]',stage);if(stageGo){stageGo.disabled=false;stageGo.textContent=actionLabel(mode);stageGo.onclick=generate}
  }
  function rollDice(){
    const count=clamp(num(q('#ra-count').value,2),1,8),sides=clamp(num(q('#ra-sides').value,6),2,100);
    diceValues=Array.from({length:count},()=>1+Math.floor(Math.random()*sides));
    const total=diceValues.reduce((a,b)=>a+b,0),label=diceValues.join(' + ')+(count>1?' = '+total:'');
    show('dice',true);
    finishTimer=setTimeout(()=>finish(label,'dice'),motionMs());
  }
  function spinWheel(){
    const segments=wheelSegments();if(!segments.length){busy=false;const go=q('#ra-go');if(go){go.disabled=false;go.textContent=actionLabel('spinner')}result='Add choices';show('spinner');return}
    const selected=Math.floor(Math.random()*segments.length),step=360/segments.length,desired=(90-(selected+.5)*step+360)%360,current=((spinnerRotation%360)+360)%360,delta=(desired-current+360)%360,start=spinnerRotation;
    spinnerRotation=start+(4+Math.floor(Math.random()*3))*360+delta;
    const label=segments[selected].label;
    q('#gd-stage').innerHTML=wheelMarkup(segments,start,'Spinning…',true);
    requestAnimationFrame(()=>{const wheel=q('#ra-wheel');if(wheel){wheel.classList.add('is-spinning');wheel.style.transform='rotate('+spinnerRotation+'deg)'}});
    finishTimer=setTimeout(()=>finish(label,'spinner'),motionMs());
  }
  function pickNumber(){let a=num(q('#ra-min').value,1),b=num(q('#ra-max').value,100);if(a>b)[a,b]=[b,a];result=String(Math.floor(a+Math.random()*(b-a+1)));show('number')}
  function drawCard(){const ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],suits=['♠','♥','♦','♣'];result=ranks[Math.floor(Math.random()*ranks.length)]+suits[Math.floor(Math.random()*suits.length)];show('card')}
  function generate(){
    if(busy)return;
    const mode=q('#ra-mode').value;busy=true;
    const go=q('#ra-go');if(go){go.disabled=true;go.textContent=mode==='spinner'?'Spinning…':mode==='dice'?'Rolling…':actionLabel(mode)}
    if(mode==='dice'){rollDice();return}
    if(mode==='spinner'){spinWheel();return}
    busy=false;if(go)go.disabled=false;
    if(mode==='number')pickNumber();else drawCard();
  }
  function raSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function paperSvg(){
    const mode=q('#ra-mode')?.value||'dice',width=760,height=320;
    const svg=raSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Randomiser result'});
    const title=mode==='dice'?'Dice result':mode==='spinner'?'Spinner result':mode==='number'?'Random number':'Playing card';
    svg.appendChild(raSvgEl('text',{x:32,y:38,'font-family':'Arial,sans-serif','font-size':20,'font-weight':850,fill:'#334a52'},title));
    if(mode==='dice'){
      const count=clamp(num(q('#ra-count')?.value,2),1,8),vals=diceValues.length===count?diceValues:Array.from({length:count},()=>null);
      const gap=14,size=Math.min(86,(width-64-gap*(count-1))/count),totalW=count*size+(count-1)*gap,start=(width-totalW)/2,y=90;
      vals.forEach((value,i)=>{
        const x=start+i*(size+gap);
        svg.appendChild(raSvgEl('rect',{x,y,width:size,height:size,rx:14,fill:'#ffffff',stroke:'#758a90','stroke-width':2}));
        svg.appendChild(raSvgEl('text',{x:x+size/2,y:y+size/2+10,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':30,'font-weight':850,fill:'#30484f'},value==null?'?':String(value)));
      });
      if(diceValues.length===count){
        const total=diceValues.reduce((a,b)=>a+b,0);
        svg.appendChild(raSvgEl('text',{x:width/2,y:245,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':22,'font-weight':800,fill:'#176c65'},diceValues.join(' + ')+(count>1?' = '+total:'')));
      }
    }else if(mode==='spinner'){
      const segments=wheelSegments(),cx=235,cy=168,r=100,n=Math.max(1,segments.length),step=Math.PI*2/n;
      svg.appendChild(raSvgEl('circle',{cx,cy,r,fill:'#ffffff',stroke:'#74898f','stroke-width':2}));
      segments.forEach((segment,i)=>{
        const angle=-Math.PI/2+(i+.5)*step,x2=cx+Math.cos(-Math.PI/2+i*step)*r,y2=cy+Math.sin(-Math.PI/2+i*step)*r;
        svg.appendChild(raSvgEl('line',{x1:cx,y1:cy,x2,y2,stroke:'#9caeb2','stroke-width':1.5}));
        const tx=cx+Math.cos(angle)*66,ty=cy+Math.sin(angle)*66;
        svg.appendChild(raSvgEl('text',{x:tx,y:ty+4,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':12,'font-weight':750,fill:'#40565d'},segment.label.slice(0,14)));
      });
      svg.appendChild(raSvgEl('text',{x:430,y:135,'font-family':'Arial,sans-serif','font-size':14,'font-weight':700,fill:'#73858a'},'Selected'));
      svg.appendChild(raSvgEl('text',{x:430,y:175,'font-family':'Arial,sans-serif','font-size':30,'font-weight':850,fill:'#176c65'},result||'—'));
    }else if(mode==='card'){
      svg.appendChild(raSvgEl('rect',{x:290,y:70,width:180,height:210,rx:18,fill:'#ffffff',stroke:'#758a90','stroke-width':2}));
      svg.appendChild(raSvgEl('text',{x:380,y:192,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':48,'font-weight':850,fill:/[♥♦]/.test(result)?'#b24c4c':'#30484f'},result||'—'));
    }else{
      svg.appendChild(raSvgEl('rect',{x:180,y:95,width:400,height:130,rx:22,fill:'#f5f9f8',stroke:'#b8cdca','stroke-width':2}));
      svg.appendChild(raSvgEl('text',{x:380,y:178,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':52,'font-weight':850,fill:'#176c65'},result||'—'));
    }
    svg.appendChild(raSvgEl('text',{x:width-28,y:height-14,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':9,fill:'#96a4a8'},'99 Club Studio'));
    return svg;
  }
  async function exportAction(kind){
    if(!X)return;
    const mode=q('#ra-mode')?.value||'random',svg=paperSvg(),name='randomiser-'+mode;
    if(kind==='copy')await X.copyPng(svg,{transparent:true});
    if(kind==='png')await X.downloadPng(svg,name,2,{transparent:true});
    if(kind==='svg')X.downloadSvg(svg,name);
    if(kind==='print')X.printSvg(svg,{title:'',landscape:true});
  }

  setPanels(field('Tool','<select class="gd-select" id="ra-mode"><option value="dice">Dice</option><option value="spinner">Spinner wheel</option><option value="number">Random number</option><option value="card">Playing card</option></select>')+'<div id="ra-extra"></div>'+btn('Roll dice','ra-go',true)+
    '<div hidden><button id="ra-paper-export" type="button">Export</button><button id="ra-copy" type="button">Copy</button><button id="ra-png" type="button">PNG</button><button id="ra-svg" type="button">SVG</button><button id="ra-print" type="button">Print</button></div>','');
  q('#ra-mode').onchange=()=>{result='';diceValues=[];spinnerRotation=0;draw()};
  q('#ra-go').onclick=generate;
  q('#ra-paper-export').onclick=()=>{};
  q('#ra-copy').onclick=()=>exportAction('copy');
  q('#ra-png').onclick=()=>exportAction('png');
  q('#ra-svg').onclick=()=>exportAction('svg');
  q('#ra-print').onclick=()=>exportAction('print');
  draw();
  G.lessonState?.register('randomiser',()=>{
    if(busy)throw new Error('Finish rolling or spinning before saving.');
    return {mode:q('#ra-mode').value,count:q('#ra-count')?.value,sides:q('#ra-sides')?.value,min:q('#ra-min')?.value,max:q('#ra-max')?.value,result,diceValues,spinnerRotation,spinnerKind,customSpinnerText};
  },saved=>{
    q('#ra-mode').value=['dice','spinner','number','card'].includes(saved.mode)?saved.mode:'dice';
    spinnerKind=saved.spinnerKind==='custom'?'custom':'colours';customSpinnerText=String(saved.customSpinnerText||'').slice(0,320);
    result=String(saved.result||'');diceValues=Array.isArray(saved.diceValues)?saved.diceValues.slice(0,8):[];spinnerRotation=Number(saved.spinnerRotation)||0;draw();
    for(const key of ['count','sides','min','max']){const el=q('#ra-'+key);if(el&&saved[key]!=null)el.value=saved[key]}show(q('#ra-mode').value);
  });
}

function balanceTool(){
  const CK=G.challengeKit,X=G.exportTools;
  let left=[
    {id:1,value:8,hidden:false},
    {id:2,value:4,hidden:false}
  ];
  let right=[{id:3,value:12,hidden:false}];
  let nextId=4,selectedId=1,showTotals=true,drag=null;
  const undoStack=[],redoStack=[];
  const CHALLENGE_CATEGORIES=[
    {id:'read',label:'Read & compare'},
    {id:'build',label:'Balance it'},
    {id:'reason',label:'Reasoning'}
  ];
  const CHALLENGE_TEMPLATES=[
    {id:'missing-weight',category:'read',title:'Find the missing weight',desc:'Use equality to work out a hidden value.'},
    {id:'choose-relation',category:'read',title:'Choose <, > or =',desc:'Compare the two pan totals and choose the correct relation.'},
    {id:'find-difference',category:'read',title:'Find the difference',desc:'Work out how much heavier one side is.'},
    {id:'make-balance',category:'build',title:'Make it balance',desc:'Edit or add weights until both sides are equal.'},
    {id:'same-to-both',category:'build',title:'Do the same to both sides',desc:'Add the same amount to both sides and observe what happens.'},
    {id:'spot-false-equality',category:'reason',title:'Spot the false equality',desc:'Decide whether a claimed equality is actually true.'}
  ];
  let controlTab='explore',challengeTab='standard',challengeCategory='read',challengeType='missing-weight',challenge=null,beforeChallenge=null;
  let exportMode='diagram',responseLines=1,exportStatus='';

  function cloneSide(side){return side.map(item=>({...item}))}
  function snapshot(){return{left:cloneSide(left),right:cloneSide(right),nextId,selectedId,showTotals}}
  function restore(state){
    left=cloneSide(state?.left||[]);
    right=cloneSide(state?.right||[]);
    nextId=Math.max(Number(state?.nextId)||1,[...left,...right].reduce((m,x)=>Math.max(m,Number(x.id)||0),0)+1);
    selectedId=[...left,...right].some(x=>String(x.id)===String(state?.selectedId))?state.selectedId:([...left,...right][0]?.id??null);
    showTotals=state?.showTotals!==false;
  }
  function remember(){
    undoStack.push(snapshot());
    if(undoStack.length>60)undoStack.shift();
    redoStack.length=0;
  }
  function challengeFrozen(){return !!(challenge&&challenge.mode==='standard'&&challenge.freezeBoard)}
  function mutate(fn){
    if(challengeFrozen())return;
    remember();fn();draw();renderControls();
  }
  function undo(){
    if(!undoStack.length||challengeFrozen())return;
    redoStack.push(snapshot());restore(undoStack.pop());draw();renderControls();
  }
  function redo(){
    if(!redoStack.length||challengeFrozen())return;
    undoStack.push(snapshot());restore(redoStack.pop());draw();renderControls();
  }
  function total(side){return side.reduce((sum,item)=>sum+Math.max(0,Number(item.value)||0),0)}
  function leftTotal(){return total(left)}
  function rightTotal(){return total(right)}
  function difference(){return leftTotal()-rightTotal()}
  function absDifference(){return Math.abs(difference())}
  function relation(){
    const diff=difference();
    if(Math.abs(diff)<1e-9)return'=';
    return diff>0?'>':'<';
  }
  function selected(){return [...left,...right].find(item=>String(item.id)===String(selectedId))||null}
  function sideName(id){return left.some(x=>String(x.id)===String(id))?'left':right.some(x=>String(x.id)===String(id))?'right':null}
  function sideFor(name){return name==='left'?left:right}
  function hiddenFlag(key){return !!(challenge&&!challenge.revealed&&challenge[key])}
  function displayValue(item){
    const selectedBound=!!(challenge&&!challenge.revealed&&challenge.hiddenSelectedValue&&String(item.id)===String(selectedId));
    return item.hidden&&!challenge?.revealed||selectedBound?'?':String(Math.round((Number(item.value)||0)*100)/100);
  }
  function expression(side){return side.length?side.map(displayValue).join(' + '):'0'}
  function visibleRelation(){return hiddenFlag('hiddenRelation')?'?':relation()}
  function visibleEquation(){
    if(hiddenFlag('hiddenEquation'))return'?';
    return expression(left)+' '+visibleRelation()+' '+expression(right);
  }
  function visibleLeftTotal(){return showTotals&&!hiddenFlag('hiddenLeftTotal')?String(leftTotal()):''}
  function visibleRightTotal(){return showTotals&&!hiddenFlag('hiddenRightTotal')?String(rightTotal()):''}
  function relationReadout(){
    if(hiddenFlag('hiddenVerdict'))return'?';
    if(challenge?.type==='find-difference'&&!challenge.revealed)return'Difference = ?';
    if(challenge?.type==='same-to-both'&&!challenge.revealed)return challengeProgress();
    return leftTotal()+' '+relation()+' '+rightTotal()+(relation()==='='?' · balanced ✓':'');
  }
  function addToken(sideNameValue,value,hidden=false){
    const side=sideFor(sideNameValue),item={id:nextId++,value:Math.max(0,Number(value)||0),hidden:!!hidden};
    side.push(item);selectedId=item.id;return item;
  }
  function setSides(leftValues,rightValues,{hiddenLeft=[],hiddenRight=[]}={}){
    left=leftValues.map((value,index)=>({id:nextId++,value:Number(value),hidden:hiddenLeft.includes(index)}));
    right=rightValues.map((value,index)=>({id:nextId++,value:Number(value),hidden:hiddenRight.includes(index)}));
    selectedId=left[0]?.id||right[0]?.id||null;
  }
  function deleteToken(item){
    if(!item)return;
    const name=sideName(item.id),side=sideFor(name),index=side.indexOf(item);
    if(index>=0)side.splice(index,1);
    selectedId=[...left,...right][0]?.id??null;
  }
  function duplicateToken(item){
    if(!item)return;
    const name=sideName(item.id),side=sideFor(name),index=side.indexOf(item),copy={...item,id:nextId++};
    side.splice(index+1,0,copy);selectedId=copy.id;
  }
  function moveToken(item,target){
    if(!item||!target)return;
    const current=sideName(item.id);if(!current||current===target)return;
    const from=sideFor(current),to=sideFor(target),index=from.indexOf(item);
    if(index>=0)from.splice(index,1);
    to.push(item);selectedId=item.id;
  }
  function setTokenValue(item,value){
    if(!item)return;
    item.value=Math.max(0,Math.round((Number(value)||0)*100)/100);
  }
  function tiltData(){
    const l=leftTotal(),r=rightTotal(),diff=l-r,scale=Math.max(1,l,r);
    const deg=clamp(diff/scale*9,-6,6);
    const arm=300,lift=Math.sin(deg*Math.PI/180)*arm;
    return{deg,leftLift:lift,rightLift:-lift};
  }
  function randomInt(min,max){return min+Math.floor(Math.random()*(max-min+1))}
  function firstHiddenValue(){
    const item=[...left,...right].find(x=>x.hidden);
    return item?String(Math.round(Number(item.value)*100)/100):'';
  }
  function solvedEquation(){
    const side=s=>s.length?s.map(item=>String(Math.round(Number(item.value)*100)/100)).join(' + '):'0';
    return side(left)+' '+relation()+' '+side(right);
  }
  function challengeObject(type,prompt,answer,extra={}){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);
    const raw={mode:'standard',type,category:meta?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),answerMode:'manual',answerSource:'',revealed:false,freezeBoard:true,hiddenRelation:false,hiddenVerdict:false,hiddenEquation:false,hiddenLeftTotal:false,hiddenRightTotal:false,hiddenSelectedValue:false,targetLeft:null,targetRight:null,targetDelta:null,baselineLeft:null,baselineRight:null,...extra};
    return CK?CK.normalise(raw):raw;
  }
  function challengeProgress(){
    if(!challenge||challenge.mode!=='standard')return relationReadout();
    if(challenge.type==='make-balance')return relation()==='='?'Balanced ✓':'Keep adjusting the balance';
    if(challenge.type==='same-to-both'){
      const leftAdded=leftTotal()-Number(challenge.baselineLeft||0),rightAdded=rightTotal()-Number(challenge.baselineRight||0),delta=Number(challenge.targetDelta||0);
      if(Math.abs(leftAdded-delta)<1e-9&&Math.abs(rightAdded-delta)<1e-9&&relation()==='=')return'Added '+delta+' to both sides ✓';
      return'Add '+delta+' to each side';
    }
    return relationReadout();
  }
  function resolveAnswerSource(source){
    if(source==='left-total')return String(leftTotal());
    if(source==='right-total')return String(rightTotal());
    if(source==='difference')return String(absDifference());
    if(source==='relation')return relation();
    if(source==='equation')return solvedEquation();
    if(source==='hidden-weight')return firstHiddenValue();
    if(source==='selected-value')return selected()?String(selected().value):'';
    return'';
  }
  function customAnswerSources(){
    const sources=[
      {id:'left-total',label:'Left total'},
      {id:'right-total',label:'Right total'},
      {id:'difference',label:'Difference between sides'},
      {id:'relation',label:'Relation (<, > or =)'},
      {id:'equation',label:'Complete equation'},
      {id:'selected-value',label:'Selected weight value'}
    ];
    if(firstHiddenValue()!=='')sources.push({id:'hidden-weight',label:'Hidden weight value'});
    return sources;
  }
  function clearBoundHiding(){
    if(!challenge)return;
    challenge.hiddenRelation=false;challenge.hiddenVerdict=false;challenge.hiddenEquation=false;challenge.hiddenLeftTotal=false;challenge.hiddenRightTotal=false;challenge.hiddenSelectedValue=false;
  }
  function applyBoundHiding(source){
    clearBoundHiding();if(!challenge)return;
    if(source==='left-total')challenge.hiddenLeftTotal=true;
    else if(source==='right-total')challenge.hiddenRightTotal=true;
    else if(source==='difference')challenge.hiddenVerdict=true;
    else if(source==='relation')challenge.hiddenRelation=true;
    else if(source==='equation')challenge.hiddenEquation=true;
    else if(source==='selected-value')challenge.hiddenSelectedValue=true;
    else if(source==='hidden-weight'){
      const item=[...left,...right].find(x=>x.hidden);if(item)item.hidden=true;
    }
  }
  function updateChallengeAnswer(){
    if(!challenge||challenge.answerMode!=='bound'||!challenge.answerSource)return;
    const answer=resolveAnswerSource(challenge.answerSource);if(answer!=='')challenge.answer=answer;
    const live=q('#ba-custom-live-answer');if(live)live.textContent=challenge.answer||'—';
    if(challenge.revealed){
      const shown=q('.gd-challenge-actions em',q('#gd-stage'));if(shown)shown.textContent='Answer: '+challenge.answer;
    }
  }
  function restoreBeforeChallenge(){if(beforeChallenge){restore(beforeChallenge);beforeChallenge=null;G.numberMobileTopology?.restoreSetup()}}
  function clearChallenge(){
    restoreBeforeChallenge();challenge=null;challengeTab='standard';controlTab='challenge';exportMode='diagram';exportStatus='';undoStack.length=0;redoStack.length=0;renderControls();draw();
  }
  function enterCustomChallenge(){
    if(!beforeChallenge){beforeChallenge=snapshot();G.numberMobileTopology?.captureSetup()}
    const wasCustom=challenge?.mode==='custom';
    if(CK)challenge=CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''});
    if(!wasCustom)clearBoundHiding();
    challenge.freezeBoard=false;challenge.revealed=false;
    challengeTab='custom';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();draw();
  }
  function setCustomAnswerSource(source){
    if(!challenge||challenge.mode!=='custom')return;
    if(source==='manual'){challenge.answerMode='manual';challenge.answerSource='';clearBoundHiding()}
    else if(source==='generated'){challenge.answerMode='bound';challenge.answerSource='';clearBoundHiding()}
    else{challenge.answerMode='bound';challenge.answerSource=source;challenge.answer=resolveAnswerSource(source);applyBoundHiding(source)}
    challenge.revealed=false;renderControls();draw();
  }
  function generateChallenge(type){
    const template=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!template)return;
    if(!beforeChallenge){beforeChallenge=snapshot();G.numberMobileTopology?.captureSetup()}else restore(beforeChallenge);
    G.numberMobileTopology?.resetChallengeTree();
    undoStack.length=0;redoStack.length=0;showTotals=true;
    if(type==='missing-weight'){
      const a=randomInt(4,12),b=randomInt(3,10),whole=a+b;
      setSides([a,b],[whole],{hiddenLeft:[1]});
      challenge=challengeObject(type,'The balance is equal. What value is hidden by the question mark?',b,{hiddenVerdict:true});
    }else if(type==='choose-relation'){
      const l=randomInt(8,18),delta=randomInt(2,8),direction=randomInt(-1,1),r=l+direction*delta;
      setSides([l],[r]);
      challenge=challengeObject(type,'Which symbol makes this comparison correct: <, > or = ?',relation(),{hiddenRelation:true,hiddenVerdict:true});
    }else if(type==='find-difference'){
      const smaller=randomInt(8,20),gap=randomInt(3,10),larger=smaller+gap;
      const leftHeavy=Math.random()<.5;setSides(leftHeavy?[larger]:[smaller],leftHeavy?[smaller]:[larger]);
      challenge=challengeObject(type,'What is the difference between the two sides?',gap,{hiddenVerdict:true});
    }else if(type==='make-balance'){
      const a=randomInt(5,12),b=randomInt(2,7),gap=randomInt(2,6);
      setSides([a,b],[a+b-gap]);
      challenge=challengeObject(type,'How much must be added to the lighter main side to balance the main bar?',String(gap),{hiddenRelation:true,hiddenVerdict:true});
    }else if(type==='same-to-both'){
      const base=randomInt(5,12),delta=randomInt(2,6);
      setSides([base],[base]);
      challenge=challengeObject(type,'Add '+delta+' to both sides. What happens to the equality?','It stays balanced.',{freezeBoard:false,baselineLeft:base,baselineRight:base,targetDelta:delta,hiddenVerdict:false});
    }else{
      const a=randomInt(4,10),b=randomInt(3,8),wrong=a+b+randomInt(2,6);
      setSides([a,b],[wrong]);
      challenge=challengeObject(type,'A pupil says these two sides are equal. Are they correct? Explain.','No. '+(a+b)+' is not equal to '+wrong+'.',{hiddenRelation:true,hiddenVerdict:true});
    }
    challenge.initialState=snapshot();
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();draw();
  }

  function tokenHtml(item){
    const sel=String(item.id)===String(selectedId),frozen=challengeFrozen();
    return '<button type="button" class="gd-eq-weight'+(sel&&!frozen?' is-selected':'')+(item.hidden&&!challenge?.revealed?' is-hidden-value':'')+(frozen?' is-frozen':'')+'" data-ba-token="'+item.id+'" aria-label="'+(item.hidden&&!challenge?.revealed?'Hidden weight':displayValue(item)+' weight')+(frozen?' fixed for this challenge':'')+'"'+(frozen?' disabled':'')+'>'+
      '<strong>'+displayValue(item)+'</strong><span>'+(!item.hidden&&Number(item.value)===1?'unit':'')+'</span>'+
    '</button>';
  }
  function selectedEditor(){
    if(challengeFrozen())return'';
    const item=selected();if(!item)return'';
    const side=sideName(item.id),other=side==='left'?'right':'left';
    return '<div class="gd-eq-selected" data-ba-selected="'+item.id+'">'+
      '<div class="gd-eq-selected__head"><div><span>Selected weight</span><strong>'+displayValue(item)+'</strong><em>on '+side+'</em></div>'+
        '<div class="gd-row"><button class="gd-btn" id="ba-move" type="button">Move '+other+'</button><button class="gd-btn" id="ba-duplicate" type="button">Duplicate</button><button class="gd-btn gd-btn--danger" id="ba-delete" type="button">Delete</button></div></div>'+
      '<label class="gd-eq-hidden-toggle"><input type="checkbox" id="ba-hidden"'+(item.hidden?' checked':'')+'> <span>Hide this value (?)</span></label>'+
      '<div class="gd-eq-value-editor"><button class="gd-btn" id="ba-minus" type="button" aria-label="Decrease selected weight">−</button>'+
        '<input class="gd-input" id="ba-value" type="number" min="0" step="1" value="'+item.value+'" aria-label="Selected weight value">'+
        '<button class="gd-btn" id="ba-plus" type="button" aria-label="Increase selected weight">+</button></div>'+
    '</div>';
  }
  function stagePanAdd(side){
    if(challengeFrozen())return'';
    const label=side==='left'?'left':'right';
    return '<button type="button" class="gd-eq-pan-add" data-ba-stage-add="'+label+'" aria-label="Add 1 to '+label+' pan" title="Add 1 to '+label+' pan">+1</button>';
  }
  function sameToBothStageAction(){
    if(challengeFrozen()||challenge?.mode!=='standard'||challenge.type!=='same-to-both')return'';
    const delta=Math.max(0,Number(challenge.targetDelta)||0);
    return '<button type="button" class="gd-btn gd-btn--primary gd-eq-both-stage" data-ba-add-both-stage="'+delta+'">Add '+delta+' to both sides</button>';
  }
  function bindChallengeStageActions(){
    const stage=q('#gd-stage');if(!stage||!challenge)return;
    const reveal=q('[data-board-action="reveal"]',stage);
    if(reveal)reveal.onclick=e=>{e.stopPropagation();challenge.revealed=!challenge.revealed;renderControls();draw()};
    const another=q('[data-challenge-action="another"]',stage);
    if(another)another.onclick=e=>{e.stopPropagation();if(challenge?.mode==='standard')generateChallenge(challenge.type)};
  }
  function draw(){
    updateChallengeAnswer();
    const td=tiltData(),balanced=relation()==='=',banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Equation Balance challenge',actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'}]:[]}):'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-eq-balance-workbench">'+
      '<div class="gd-eq-summary"><div><span>Equation balance</span><strong data-ba-equation>'+visibleEquation()+'</strong></div>'+
        '<div class="gd-object-toolbar"><button class="gd-btn" id="ba-undo" type="button"'+(undoStack.length&&!challengeFrozen()?'':' disabled')+'>Undo</button><button class="gd-btn" id="ba-redo" type="button"'+(redoStack.length&&!challengeFrozen()?'':' disabled')+'>Redo</button></div></div>'+
      '<div class="gd-eq-balance" style="--ba-tilt:'+td.deg+'deg;--ba-left-lift:'+td.leftLift+'px;--ba-right-lift:'+td.rightLift+'px">'+
        '<div class="gd-eq-beam"></div><div class="gd-eq-pivot"></div><div class="gd-eq-base"></div>'+
        '<div class="gd-eq-side gd-eq-side--left" data-ba-drop="left"><div class="gd-eq-cord"></div><div class="gd-eq-pan"><div class="gd-eq-pan-label">Left</div>'+stagePanAdd('left')+'<div class="gd-eq-weights">'+(left.length?left.map(tokenHtml).join(''):'<span class="gd-eq-empty">Add a weight here</span>')+'</div><strong class="gd-eq-total" data-ba-left-total>'+visibleLeftTotal()+'</strong></div></div>'+
        '<div class="gd-eq-side gd-eq-side--right" data-ba-drop="right"><div class="gd-eq-cord"></div><div class="gd-eq-pan"><div class="gd-eq-pan-label">Right</div>'+stagePanAdd('right')+'<div class="gd-eq-weights">'+(right.length?right.map(tokenHtml).join(''):'<span class="gd-eq-empty">Add a weight here</span>')+'</div><strong class="gd-eq-total" data-ba-right-total>'+visibleRightTotal()+'</strong></div></div>'+
      '</div>'+
      '<div class="gd-eq-verdict'+(balanced?' is-balanced':'')+'"><span>Relationship</span><strong data-ba-relation>'+relationReadout()+'</strong></div>'+
      (challenge&&!challengeFrozen()&&challenge.mode==='standard'?'<div class="gd-answer-live" data-ba-target-status>'+challengeProgress()+'</div>':'')+
      sameToBothStageAction()+
      selectedEditor()+
      (!challengeFrozen()?'<p class="gd-help gd-eq-drag-hint">Use +1 on either pan to build directly. Select a weight for precise edits, or drag it across the balance to move it.</p>':'')+
    '</div>';
    bindStage();bindChallengeStageActions();
  }
  function dragMove(e){
    if(!drag||drag.pointerId!==e.pointerId)return;
    const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
    drag.moved=drag.moved||Math.abs(dx)>4||Math.abs(dy)>4;
    drag.el.style.transform='translate('+dx+'px,'+dy+'px)';
    drag.el.style.zIndex='20';
  }
  function dragEnd(e){
    if(!drag||drag.pointerId!==e.pointerId)return;
    const state=drag;drag=null;
    document.removeEventListener('pointermove',dragMove);
    document.removeEventListener('pointerup',dragEnd);
    document.removeEventListener('pointercancel',dragEnd);
    state.el.style.transform='';state.el.style.zIndex='';
    if(challengeFrozen()){draw();return}
    const item=[...left,...right].find(x=>String(x.id)===String(state.id));
    if(!item){draw();return}
    const stage=q('#gd-stage'),rect=stage.getBoundingClientRect(),target=e.clientX<rect.left+rect.width/2?'left':'right';
    if(state.moved&&target!==sideName(item.id)){
      remember();moveToken(item,target);draw();renderControls();
    }else{selectedId=item.id;draw()}
  }
  function bindStage(){
    qa('[data-ba-token]',q('#gd-stage')).forEach(button=>{
      button.onclick=()=>{if(challengeFrozen())return;selectedId=Number(button.dataset.baToken);draw()};
      button.onkeydown=e=>{
        if(challengeFrozen())return;
        const item=[...left,...right].find(x=>String(x.id)===button.dataset.baToken);if(!item)return;
        if(e.key==='ArrowUp'||e.key==='ArrowRight'){e.preventDefault();mutate(()=>setTokenValue(item,Number(item.value)+1))}
        else if(e.key==='ArrowDown'||e.key==='ArrowLeft'){e.preventDefault();mutate(()=>setTokenValue(item,Math.max(0,Number(item.value)-1)))}
        else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();mutate(()=>deleteToken(item))}
      };
      button.onpointerdown=e=>{
        if(challengeFrozen()||(e.button!=null&&e.button!==0))return;
        e.preventDefault();selectedId=Number(button.dataset.baToken);
        drag={id:button.dataset.baToken,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,el:button,moved:false};
        document.addEventListener('pointermove',dragMove);
        document.addEventListener('pointerup',dragEnd,{once:true});
        document.addEventListener('pointercancel',dragEnd,{once:true});
      };
    });
    qa('[data-ba-stage-add]',q('#gd-stage')).forEach(button=>button.onclick=()=>{
      if(challengeFrozen())return;
      const side=button.dataset.baStageAdd==='right'?'right':'left';
      mutate(()=>addToken(side,1));
    });
    const addBothStage=q('[data-ba-add-both-stage]',q('#gd-stage'));if(addBothStage)addBothStage.onclick=()=>{
      if(challengeFrozen())return;
      const value=Math.max(0,Number(addBothStage.dataset.baAddBothStage)||0);
      mutate(()=>{addToken('left',value);addToken('right',value)});
    };
    const undoBtn=q('#ba-undo');if(undoBtn)undoBtn.onclick=undo;
    const redoBtn=q('#ba-redo');if(redoBtn)redoBtn.onclick=redo;
    const move=q('#ba-move');if(move)move.onclick=()=>mutate(()=>moveToken(selected(),sideName(selected()?.id)==='left'?'right':'left'));
    const duplicate=q('#ba-duplicate');if(duplicate)duplicate.onclick=()=>mutate(()=>duplicateToken(selected()));
    const del=q('#ba-delete');if(del)del.onclick=()=>mutate(()=>deleteToken(selected()));
    const hidden=q('#ba-hidden');if(hidden)hidden.onchange=()=>mutate(()=>{const item=selected();if(item)item.hidden=hidden.checked});
    const value=q('#ba-value');if(value)value.onchange=()=>mutate(()=>setTokenValue(selected(),value.value));
    const minus=q('#ba-minus');if(minus)minus.onclick=()=>mutate(()=>setTokenValue(selected(),Math.max(0,Number(selected()?.value||0)-1)));
    const plus=q('#ba-plus');if(plus)plus.onclick=()=>mutate(()=>setTokenValue(selected(),Number(selected()?.value||0)+1));
  }

  function workflowTabs(){
    return '<div class="gd-row gd-ba-workflow-tabs" role="tablist" aria-label="Equation Balance workflow">'+
      '<button class="gd-btn'+(controlTab==='explore'?' gd-btn--primary':'')+'" type="button" data-ba-workflow="explore">Explore</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-ba-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+ 
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-ba-workflow="export">Export / reuse</button></div>';
  }
  function modelControlsHtml({showExample=false}={}){
    return '<div class="gd-field"><span>Add a weight</span><div class="gd-eq-palette">'+[1,2,5,10,20].map(v=>'<button class="gd-btn" type="button" data-ba-add="'+v+'">+'+v+'</button>').join('')+'</div></div>'+
      field('Custom value','<div class="gd-row"><input class="gd-input gd-small" id="ba-custom" type="number" min="0" step="1" value="3"><button class="gd-btn" id="ba-add-left" type="button">Add left</button><button class="gd-btn" id="ba-add-right" type="button">Add right</button></div>')+
      field('Do the same to both sides','<div class="gd-row"><input class="gd-input gd-small" id="ba-both-value" type="number" min="0" step="1" value="'+(challenge?.type==='same-to-both'?challenge.targetDelta||1:1)+'"><button class="gd-btn gd-btn--primary" id="ba-add-both" type="button">Add to both</button></div>','Adding the same amount to both sides preserves equality when the balance starts equal.')+
      '<label class="gd-eq-show-totals"><input type="checkbox" id="ba-show-totals"'+(showTotals?' checked':'')+'> <span>Show pan totals</span></label>'+
      '<div class="gd-row">'+(showExample?'<button class="gd-btn" id="ba-example" type="button">Balanced example</button>':'')+'<button class="gd-btn" id="ba-clear" type="button">Clear all</button></div>';
  }
  function exploreControlsHtml(){
    return modelControlsHtml({showExample:true})+'<p class="gd-help">Hide an individual weight to make a missing-number model. Drag weights between pans to explore what changes the balance.</p>';
  }
  function challengeControlsHtml(){
    if(!CK)return'<p class="gd-help">Challenge tools are unavailable.</p>';
    const tabs=CK.tabsHtml?CK.tabsHtml('ba',challengeTab):'';
    if(challengeTab==='custom'){
      const custom=challenge&&challenge.mode==='custom'?challenge:CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual'});
      return tabs+CK.editorHtml(custom,'ba',{answerSources:customAnswerSources(),generatedAnswerLabel:'Keep the generated answer'})+
        modelControlsHtml()+
        '<div class="gd-row">'+(challenge&&challenge.answer?'<button class="gd-btn" id="ba-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
        (challenge?'<button class="gd-btn" id="ba-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
        '<p class="gd-help">Custom challenges can bind their answer to either pan total, the difference, relation, complete equation or a hidden weight.</p>';
    }
    const picker=CK.pickerHtml(CHALLENGE_TEMPLATES,CHALLENGE_CATEGORIES,challengeCategory,challengeType,'ba');
    const repeat=!!(challenge&&challenge.mode==='standard'&&challenge.type===challengeType);
    return tabs+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="ba-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
      (challenge&&challenge.mode!=='custom'?'<button class="gd-btn" id="ba-edit-challenge" type="button">Edit challenge</button>':'')+
      (challenge&&challenge.answer?'<button class="gd-btn" id="ba-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
      (challenge?'<button class="gd-btn" id="ba-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
      (challenge&&!challengeFrozen()?modelControlsHtml():'');
  }
  function baSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function exportHidden(key,pupil=false){
    if(!challenge)return false;
    return pupil?!!challenge[key]:hiddenFlag(key);
  }
  function exportState(pupil=false){
    if(pupil&&challenge?.mode==='standard'&&challenge.initialState){
      const state=challenge.initialState;
      return{left:cloneSide(state.left||[]),right:cloneSide(state.right||[]),showTotals:state.showTotals!==false,fromInitial:true};
    }
    return{left:cloneSide(left),right:cloneSide(right),showTotals,fromInitial:false};
  }
  function exportTotal(side){return side.reduce((sum,item)=>sum+Math.max(0,Number(item.value)||0),0)}
  function exportRelation(state){
    const diff=exportTotal(state.left)-exportTotal(state.right);
    return Math.abs(diff)<1e-9?'=':diff>0?'>':'<';
  }
  function exportValue(item,pupil=false){
    const selectedBound=!!(challenge&&challenge.hiddenSelectedValue&&String(item.id)===String(selectedId)&&(pupil||!challenge.revealed));
    if(item.hidden&&(pupil||!challenge?.revealed)||selectedBound)return'?';
    return String(Math.round((Number(item.value)||0)*100)/100);
  }
  function exportExpression(side,pupil=false){
    return side.length?side.map(item=>exportValue(item,pupil)).join(' + '):'0';
  }
  function exportEquation(state,pupil=false){
    if(exportHidden('hiddenEquation',pupil))return'?';
    const rel=exportHidden('hiddenRelation',pupil)?'?':exportRelation(state);
    return exportExpression(state.left,pupil)+' '+rel+' '+exportExpression(state.right,pupil);
  }
  function exportRelationText(state,pupil=false){
    if(exportHidden('hiddenVerdict',pupil))return'?';
    if(pupil&&challenge?.type==='find-difference')return'Difference = ?';
    const lt=exportTotal(state.left),rt=exportTotal(state.right),rel=exportRelation(state);
    return lt+' '+rel+' '+rt+(rel==='='?' · balanced':'');
  }
  function appendExportWeight(svg,item,{x,y,side,index,pupil=false}={}){
    const label=exportValue(item,pupil),hidden=label==='?',w=58,h=48;
    svg.appendChild(baSvgEl('rect',{x,y,width:w,height:h,rx:9,fill:hidden?'#fff4d7':'#eaf6f3',stroke:hidden?'#c8a85d':'#7fa9a3','stroke-width':2,'data-ba-export-weight':String(index),'data-ba-export-side':side}));
    svg.appendChild(baSvgEl('text',{x:x+w/2,y:y+h/2+1,'text-anchor':'middle','dominant-baseline':'middle','font-family':'Arial,sans-serif','font-size':18,'font-weight':900,fill:hidden?'#765817':'#244e49','data-ba-export-weight-value':String(index)},label));
  }
  function appendExportPan(svg,state,side,{cx,top,pupil=false}={}){
    const items=side==='left'?state.left:state.right,panW=310,panH=132,x=cx-panW/2,y=top+56;
    svg.appendChild(baSvgEl('line',{x1:cx,y1:top,x2:cx,y2:y,stroke:'#71868c','stroke-width':2}));
    svg.appendChild(baSvgEl('line',{x1:x+54,y1:y-22,x2:x+54,y2:y+2,stroke:'#71868c','stroke-width':2}));
    svg.appendChild(baSvgEl('line',{x1:x+panW-54,y1:y-22,x2:x+panW-54,y2:y+2,stroke:'#71868c','stroke-width':2}));
    svg.appendChild(baSvgEl('rect',{x,y,width:panW,height:panH,rx:30,fill:'#f8fbfb',stroke:'#8ca0a5','stroke-width':3,'data-ba-export-pan':side}));
    svg.appendChild(baSvgEl('text',{x:x+12,y:y+18,'font-family':'Arial,sans-serif','font-size':10,'font-weight':900,fill:'#718288'},side.toUpperCase()));
    items.forEach((item,index)=>{
      const col=index%4,row=Math.floor(index/4),wx=x+25+col*68,wy=y+31+row*55;
      appendExportWeight(svg,item,{x:wx,y:wy,side,index,pupil});
    });
    let totalText='';
    if(state.showTotals){
      const hidden=side==='left'?exportHidden('hiddenLeftTotal',pupil):exportHidden('hiddenRightTotal',pupil);
      if(!hidden)totalText=String(exportTotal(items));
    }
    svg.appendChild(baSvgEl('text',{x:cx,y:y+panH-10,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':13,'font-weight':850,fill:'#50666c','data-ba-export-total':side},totalText));
  }
  function equationBalanceExportSvg({pupil=false}={}){
    const width=1000,height=630,state=exportState(pupil),diff=exportTotal(state.left)-exportTotal(state.right),lift=clamp(diff,-20,20)*1.5;
    const leftBeamY=156+lift,rightBeamY=156-lift;
    const svg=baSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Equation balance','data-ba-export':'equation-balance'});
    svg.appendChild(baSvgEl('rect',{x:0,y:0,width,height,fill:'#fff'}));
    svg.appendChild(baSvgEl('text',{x:64,y:48,'font-family':'Arial,sans-serif','font-size':27,'font-weight':900,fill:'#24343b'},'Equation balance'));
    svg.appendChild(baSvgEl('line',{x1:190,y1:leftBeamY,x2:810,y2:rightBeamY,stroke:'#43555c','stroke-width':10,'stroke-linecap':'round'}));
    svg.appendChild(baSvgEl('path',{d:'M 500 160 L 462 352 L 538 352 Z',fill:'#697b81'}));
    svg.appendChild(baSvgEl('rect',{x:372,y:350,width:256,height:14,rx:7,fill:'#697b81'}));
    appendExportPan(svg,state,'left',{cx:250,top:leftBeamY,pupil});
    appendExportPan(svg,state,'right',{cx:750,top:rightBeamY,pupil});
    svg.appendChild(baSvgEl('rect',{x:78,y:465,width:408,height:92,rx:12,fill:'#f5f8f8',stroke:'#d4dfe1','stroke-width':1.5}));
    svg.appendChild(baSvgEl('text',{x:94,y:493,'font-family':'Arial,sans-serif','font-size':11,'font-weight':850,fill:'#708287'},'EQUATION'));
    svg.appendChild(baSvgEl('text',{x:94,y:529,'font-family':'Arial,sans-serif','font-size':18,'font-weight':900,fill:'#304b52','data-ba-export-equation':'1'},exportEquation(state,pupil)));
    svg.appendChild(baSvgEl('rect',{x:514,y:465,width:408,height:92,rx:12,fill:'#f5f8f8',stroke:'#d4dfe1','stroke-width':1.5}));
    svg.appendChild(baSvgEl('text',{x:530,y:493,'font-family':'Arial,sans-serif','font-size':11,'font-weight':850,fill:'#708287'},'RELATIONSHIP'));
    svg.appendChild(baSvgEl('text',{x:530,y:529,'font-family':'Arial,sans-serif','font-size':17,'font-weight':900,fill:'#304b52','data-ba-export-relation':'1'},exportRelationText(state,pupil)));
    if(state.fromInitial)svg.appendChild(baSvgEl('g',{'data-ba-export-initial-state':'1','aria-hidden':'true'}));
    svg.appendChild(baSvgEl('text',{x:936,y:610,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return equationBalanceExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(equationBalanceExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Equation Balance challenge',
      prompt,
      responseLabel:challenge.category==='reason'?'Explain your thinking':challenge.type==='make-balance'||challenge.type==='same-to-both'?'Working / answer':'Answer',
      responseLines
    });
  }
  function exportFilename(){
    if(exportMode==='challenge'&&challenge)return'equation-balance-'+(challenge.type||'challenge');
    return'equation-balance';
  }
  function exportMessage(message){exportStatus=message;const el=q('#ba-export-status');if(el)el.textContent=message}
  async function runExport(kind){
    if(!X){exportMessage('Export tools are unavailable.');return}
    const targetSvg=exportTargetSvg(),name=exportFilename();
    try{
      if(kind==='copy'){await X.copyPng(targetSvg);exportMessage('Image copied.')}
      else if(kind==='png'){await X.downloadPng(targetSvg,name);exportMessage('PNG downloaded.')}
      else if(kind==='svg'){X.downloadSvg(targetSvg,name);exportMessage('SVG downloaded.')}
      else if(kind==='print'){X.printSvg(targetSvg,{title:'',landscape:exportMode!=='challenge'});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'Could not export this equation balance.')}
  }
  function exportControlsHtml(){
    const canCard=!!challenge;
    if(!canCard&&exportMode==='challenge')exportMode='diagram';
    return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export a clean vector balance or a pupil-ready challenge card.</span></div></div>'+
      (canCard?'<div class="nl-export-mode ba-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-ba-export-mode="challenge">Challenge card</button>'+
        '<button type="button" class="'+(exportMode==='diagram'?'is-active':'')+'" data-ba-export-mode="diagram">Balance only</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="ba-response-lines">'+[1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+'</select></label><p class="gd-help">Pupil export always re-hides challenge answers. Interactive challenges export their original starting balance, not the teacher\'s completed solution.</p>'
        :'<p class="gd-help">Balance-only export contains the current vector weights, beam position and visible mathematical readouts without editing controls.</p>')+
      '<div class="nl-export-grid ba-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="ba-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'challenge':'image')+'</button>'+
        '<button class="gd-btn" id="ba-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="ba-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="ba-print" type="button">Print / PDF</button>'+
      '</div><p class="gd-help" id="ba-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }

  function controlsHtml(){return workflowTabs()+(controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():exploreControlsHtml())}
  function renderControls(){q('#gd-controls').innerHTML=controlsHtml();bindControls()}
  function bindModelControls(){
    qa('[data-ba-add]',q('#gd-controls')).forEach(button=>button.onclick=()=>mutate(()=>addToken('left',Number(button.dataset.baAdd))));
    const custom=()=>Math.max(0,num(q('#ba-custom')?.value,0));
    const leftAdd=q('#ba-add-left');if(leftAdd)leftAdd.onclick=()=>mutate(()=>addToken('left',custom()));
    const rightAdd=q('#ba-add-right');if(rightAdd)rightAdd.onclick=()=>mutate(()=>addToken('right',custom()));
    const both=q('#ba-add-both');if(both)both.onclick=()=>{
      const value=Math.max(0,num(q('#ba-both-value')?.value,0));
      mutate(()=>{addToken('left',value);addToken('right',value)});
    };
    const totals=q('#ba-show-totals');if(totals)totals.onchange=()=>{showTotals=totals.checked;draw()};
    const clear=q('#ba-clear');if(clear)clear.onclick=()=>mutate(()=>{left=[];right=[];selectedId=null});
    const example=q('#ba-example');if(example)example.onclick=()=>{
      const examples=[{left:[7,5],right:[3,4,5]},{left:[18,6],right:[12,12]},{left:[9,9],right:[6,6,6]},{left:[15,5],right:[10,10]}],ex=examples[Math.floor(Math.random()*examples.length)];
      mutate(()=>{
        left=ex.left.map(value=>({id:nextId++,value,hidden:false}));
        right=ex.right.map(value=>({id:nextId++,value,hidden:false}));
        selectedId=left[0]?.id||right[0]?.id||null;
      });
    };
  }
  function bindControls(){
    qa('[data-ba-workflow]',q('#gd-controls')).forEach(button=>button.onclick=()=>{controlTab=button.dataset.baWorkflow;renderControls()});
    bindModelControls();
    if(controlTab==='export'){
      qa('[data-ba-export-mode]',q('#gd-controls')).forEach(button=>button.onclick=()=>{exportMode=button.dataset.baExportMode;exportStatus='';renderControls()});
      const lines=q('#ba-response-lines');if(lines)lines.onchange=()=>{responseLines=clamp(Math.round(num(lines.value,1)),1,4)};
      [['ba-copy-image','copy'],['ba-png','png'],['ba-svg-download','svg'],['ba-print','print']].forEach(([id,kind])=>{const button=q('#'+id);if(button)button.onclick=()=>runExport(kind)});
      return;
    }
    if(controlTab!=='challenge')return;
    qa('[data-ba-challenge-tab]',q('#gd-controls')).forEach(button=>button.onclick=()=>{
      if(button.dataset.baChallengeTab==='custom')enterCustomChallenge();
      else{challengeTab='standard';renderControls()}
    });
    qa('[data-ba-challenge-cat]',q('#gd-controls')).forEach(button=>button.onclick=()=>{
      challengeCategory=button.dataset.baChallengeCat;
      const first=CHALLENGE_TEMPLATES.find(t=>t.category===challengeCategory);if(first)challengeType=first.id;
      renderControls();
    });
    qa('[data-ba-challenge-type]',q('#gd-controls')).forEach(button=>button.onclick=()=>{challengeType=button.dataset.baChallengeType;renderControls()});
    const generate=q('#ba-generate');if(generate)generate.onclick=()=>generateChallenge(challengeType);
    const edit=q('#ba-edit-challenge');if(edit)edit.onclick=enterCustomChallenge;
    const reveal=q('#ba-reveal');if(reveal)reveal.onclick=()=>{if(challenge){challenge.revealed=!challenge.revealed;renderControls();draw()}};
    const clearChallengeBtn=q('#ba-clear-challenge');if(clearChallengeBtn)clearChallengeBtn.onclick=clearChallenge;
    if(challengeTab==='custom'&&challenge){
      const title=q('#ba-custom-title');if(title)title.oninput=()=>{challenge.title=title.value.slice(0,100);draw()};
      const prompt=q('#ba-custom-prompt');if(prompt)prompt.oninput=()=>{challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);draw()};
      const source=q('#ba-custom-answer-source');if(source)source.onchange=()=>setCustomAnswerSource(source.value);
      const answer=q('#ba-custom-answer');if(answer)answer.oninput=()=>{challenge.answer=answer.value.slice(0,400);challenge.answerMode='manual';challenge.answerSource='';draw()};
      qa('[data-gd-rich-action]',q('#gd-controls')).forEach(button=>button.onclick=()=>{CK.applyFormat(prompt,button.dataset.gdRichAction);challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);draw()});
    }
  }

  setPanels(controlsHtml(),'');
  bindControls();
  draw();
  // The recursive mobile adapter owns the topology; this bridge owns the
  // underlying numeric model. Neither serialises transient DOM state.
  G.numberMobileEngineState={
    challengeIdentity(){return challenge},
    capture(){return snapshot()},
    captureChallenge(){return challenge?{challenge,beforeChallenge,challengeCategory,challengeType,challengeTab,exportMode,responseLines}:null},
    restore(saved,session=null){
      restore(saved);challenge=session?.challenge?CK.normalise(session.challenge):null;
      beforeChallenge=challenge?session.beforeChallenge:null;
      controlTab=challenge?'challenge':'explore';challengeTab=challenge?.mode==='custom'?'custom':'standard';
      if(challenge){challengeCategory=session.challengeCategory||'read';challengeType=session.challengeType||'missing-weight'}
      exportMode=challenge?'challenge':'diagram';responseLines=clamp(Math.round(num(session?.responseLines,1)),1,4);
      undoStack.length=0;redoStack.length=0;drag=null;renderControls();draw()
    }
  };
}

function timesTableVisual(){
  const CK=G.challengeKit,X=G.exportTools;
  let groupsCount=4,itemsPerGroup=6,selectedGroup=0;
  let showRepeated=true,showJumps=true,showFactFamily=true;
  const undoStack=[],redoStack=[];
  const CHALLENGE_CATEGORIES=[
    {id:'read',label:'Read the model'},
    {id:'connections',label:'Connect the facts'},
    {id:'build',label:'Build'},
    {id:'reason',label:'Reasoning'}
  ];
  const CHALLENGE_TEMPLATES=[
    {id:'find-total',category:'read',title:'Find the total',desc:'Count equal groups and find how many items there are altogether.'},
    {id:'write-repeated',category:'connections',title:'Write repeated addition',desc:'Write the repeated-addition statement shown by the equal groups.'},
    {id:'commutative-fact',category:'connections',title:'Commutative fact',desc:'Write the multiplication fact with the factors reversed.'},
    {id:'related-division',category:'connections',title:'Related division',desc:'Complete a division fact from the equal-groups model.'},
    {id:'build-fact',category:'build',title:'Build the fact',desc:'Change the model until it shows the requested equal-groups fact.'},
    {id:'spot-error',category:'reason',title:'Spot the incorrect equation',desc:'Use the equal groups to decide whether the shown equation is correct.'}
  ];
  let controlTab='explore',challengeTab='standard',challengeCategory='read',challengeType='find-total',challenge=null,beforeChallenge=null;
  let exportMode='diagram',responseLines=1,exportStatus='';

  function snapshot(){return{groupsCount,itemsPerGroup,selectedGroup,showRepeated,showJumps,showFactFamily}}
  function restore(state){
    groupsCount=clamp(Math.round(Number(state?.groupsCount)||4),1,12);
    itemsPerGroup=clamp(Math.round(Number(state?.itemsPerGroup)||6),1,12);
    selectedGroup=clamp(Math.round(Number(state?.selectedGroup)||0),0,groupsCount-1);
    showRepeated=state?.showRepeated!==false;
    showJumps=state?.showJumps!==false;
    showFactFamily=state?.showFactFamily!==false;
  }
  function remember(){
    undoStack.push(snapshot());
    if(undoStack.length>60)undoStack.shift();
    redoStack.length=0;
  }
  function challengeFrozen(){return !!(challenge&&challenge.mode==='standard'&&(challenge.freezeModel||challenge.revealed))}
  function mutate(fn){
    if(challengeFrozen())return;
    remember();fn();draw();renderControls();
  }
  function undo(){
    if(!undoStack.length||challengeFrozen())return;
    redoStack.push(snapshot());restore(undoStack.pop());draw();renderControls();
  }
  function redo(){
    if(!redoStack.length||challengeFrozen())return;
    undoStack.push(snapshot());restore(redoStack.pop());draw();renderControls();
  }
  function total(){return groupsCount*itemsPerGroup}
  function setGroups(value){
    groupsCount=clamp(Math.round(Number(value)||1),1,12);
    selectedGroup=clamp(selectedGroup,0,groupsCount-1);
  }
  function setItems(value){itemsPerGroup=clamp(Math.round(Number(value)||1),1,12)}
  function addGroup(){
    if(groupsCount>=12)return;
    groupsCount+=1;selectedGroup=groupsCount-1;
  }
  function duplicateSelected(){
    if(groupsCount>=12)return;
    groupsCount+=1;selectedGroup=clamp(selectedGroup+1,0,groupsCount-1);
  }
  function deleteSelected(){
    if(groupsCount<=1)return;
    groupsCount-=1;selectedGroup=clamp(selectedGroup,0,groupsCount-1);
  }
  function swapFactors(){
    const oldGroups=groupsCount;
    groupsCount=itemsPerGroup;
    itemsPerGroup=oldGroups;
    selectedGroup=clamp(selectedGroup,0,groupsCount-1);
  }
  function repeatedText(){
    return Array.from({length:groupsCount},()=>itemsPerGroup).join(' + ')+' = '+total();
  }
  function commutativeText(){return itemsPerGroup+' × '+groupsCount+' = '+total()}
  function divisionAText(){return total()+' ÷ '+groupsCount+' = '+itemsPerGroup}
  function divisionBText(){return total()+' ÷ '+itemsPerGroup+' = '+groupsCount}
  function hiddenFlag(key){return !!(challenge&&!challenge.revealed&&challenge[key])}
  function equationText(){
    if(challenge?.mode==='standard'&&challenge.type==='spot-error'&&!challenge.revealed)return groupsCount+' × '+itemsPerGroup+' = '+challenge.wrongTotal;
    if(hiddenFlag('hiddenEquation'))return groupsCount+' × '+itemsPerGroup+' = ?';
    return groupsCount+' × '+itemsPerGroup+' = '+total();
  }
  function repeatedDisplay(){return hiddenFlag('hiddenRepeated')?'?':repeatedText()}
  function commutativeDisplay(){return hiddenFlag('hiddenFactFamily')?'?':commutativeText()}
  function divisionADisplay(){return hiddenFlag('hiddenFactFamily')?'?':divisionAText()}
  function divisionBDisplay(){return hiddenFlag('hiddenFactFamily')?'?':divisionBText()}
  function groupHtml(index){
    const selected=index===selectedGroup,frozen=challengeFrozen();
    return '<button type="button" class="gd-tv-group'+(selected&&!frozen?' is-selected':'')+(frozen?' is-frozen':'')+'" data-tv-group="'+index+'" aria-label="Group '+(index+1)+' with '+itemsPerGroup+' items"'+(frozen?' disabled':'')+'>'+
      '<span>Group '+(index+1)+'</span><div class="gd-tv-dots">'+Array.from({length:itemsPerGroup},()=>'<i></i>').join('')+'</div>'+
      '<strong>'+itemsPerGroup+'</strong>'+
    '</button>';
  }
  function jumpHtml(index){
    const from=index*itemsPerGroup,to=(index+1)*itemsPerGroup;
    return '<div class="gd-tv-jump" data-tv-jump="'+index+'"><span>'+from+'</span><b>+'+itemsPerGroup+'</b><span>'+to+'</span></div>';
  }
  function selectedPanel(){
    if(hiddenFlag('hiddenSelectedPanel')||(challenge?.mode==='standard'&&challengeFrozen()))return'';
    const frozen=challengeFrozen();
    return '<div class="gd-tv-selected" data-tv-selected="'+selectedGroup+'">'+
      '<div><span>Selected group</span><strong>Group '+(selectedGroup+1)+' · '+itemsPerGroup+' items</strong></div>'+
      (!frozen?'<div class="gd-row"><button class="gd-btn" id="tv-duplicate" type="button"'+(groupsCount>=12?' disabled':'')+'>Duplicate group</button>'+
      '<button class="gd-btn gd-btn--danger" id="tv-delete" type="button"'+(groupsCount<=1?' disabled':'')+'>Delete group</button></div>':'')+
    '</div>';
  }
  function challengeProgress(){
    if(!challenge||challenge.type!=='build-fact')return'';
    return 'Build the groups, then press Check.';
  }
  function toggleModelReveal(){
    if(!challenge)return;
    challenge.revealed=!challenge.revealed;
    if(challenge.mode==='standard'&&challenge.type==='build-fact'){
      if(challenge.revealed){challenge.modelBeforeReveal=snapshot();setGroups(challenge.targetGroups);setItems(challenge.targetItems)}
      else if(challenge.modelBeforeReveal){restore(challenge.modelBeforeReveal);delete challenge.modelBeforeReveal}
    }
    renderControls();draw();
  }
  function bindChallengeStageActions(){
    const endChallenge=q('[data-challenge-action="end"]',q('#gd-stage'));if(endChallenge)endChallenge.onclick=e=>{e.stopPropagation();clearChallenge()};
    const stage=q('#gd-stage');if(!stage||!challenge)return;
    const reveal=q('[data-board-action="reveal"]',stage);
    if(reveal)reveal.onclick=e=>{e.stopPropagation();toggleModelReveal()};
    const another=q('[data-challenge-action="another"]',stage);
    if(another)another.onclick=e=>{e.stopPropagation();if(challenge?.mode==='standard')generateChallenge(challenge.type)};
  }
  function draw(){
    updateChallengeAnswer();
    const t=total(),frozen=challengeFrozen(),banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Times-table challenge',pupil:(challenge.type==='build-fact'?CK.pupilSpec('model',{check:()=>groupsCount===challenge.targetGroups&&itemsPerGroup===challenge.targetItems}):challenge.type==='spot-error'?CK.pupilSpec('choice',{choices:['Yes','No'],expected:challenge.answer.startsWith('Yes')?'Yes':'No',explain:true}):CK.pupilSpec(challenge.type==='write-repeated'?'addition-equation':challenge.type==='commutative-fact'?'equation':'number')),actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'},{action:'end',label:'Back to setup'}]:[{action:'end',label:'End challenge'}]}):'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-tv-workbench">'+
      (challenge&&frozen?'':'<div class="gd-tv-summary">'+(!challenge?'<div><span>Equal groups</span><strong data-tv-equation>'+equationText()+'</strong></div>':'')+
        '<div class="gd-object-toolbar"><button class="gd-btn" id="tv-undo" type="button"'+(undoStack.length&&!frozen?'':' disabled')+'>Undo</button><button class="gd-btn" id="tv-redo" type="button"'+(redoStack.length&&!frozen?'':' disabled')+'>Redo</button></div></div>')+
      (!frozen?'<div class="gd-tv-direct">'+
        '<div class="gd-tv-stepper"><span>Groups</span><div><button class="gd-btn" id="tv-groups-minus" type="button"'+(groupsCount<=1?' disabled':'')+'>−</button><strong data-tv-groups>'+groupsCount+'</strong><button class="gd-btn" id="tv-groups-plus" type="button"'+(groupsCount>=12?' disabled':'')+'>+</button></div></div>'+
        '<button class="gd-btn gd-tv-swap" id="tv-swap" type="button">Swap factors ↔</button>'+
        '<div class="gd-tv-stepper"><span>In each group</span><div><button class="gd-btn" id="tv-items-minus" type="button"'+(itemsPerGroup<=1?' disabled':'')+'>−</button><strong data-tv-items>'+itemsPerGroup+'</strong><button class="gd-btn" id="tv-items-plus" type="button"'+(itemsPerGroup>=12?' disabled':'')+'>+</button></div></div>'+
      '</div>':'')+
      '<div class="gd-tv-groups" data-tv-group-count="'+groupsCount+'">'+Array.from({length:groupsCount},(_,i)=>groupHtml(i)).join('')+
        (!frozen&&groupsCount<12?'<button class="gd-tv-add-group" id="tv-add-group" type="button"><strong>+</strong><span>Add group</span></button>':'')+'</div>'+
      selectedPanel()+
      (showRepeated&&!challenge?'<div class="gd-tv-readout"><span>Repeated addition</span><strong data-tv-repeated>'+repeatedDisplay()+'</strong></div>':'')+
      (showJumps&&!challenge&&!hiddenFlag('hiddenJumps')?'<div class="gd-tv-jump-section"><span>Equal jumps</span><div class="gd-tv-jumps">'+Array.from({length:groupsCount},(_,i)=>jumpHtml(i)).join('')+'</div></div>':'')+
      (showFactFamily&&!challenge?'<div class="gd-tv-fact-family"><span>Fact family</span><div>'+
        '<strong data-tv-commutative>'+commutativeDisplay()+'</strong>'+
        '<strong data-tv-division-a>'+divisionADisplay()+'</strong>'+
        '<strong data-tv-division-b>'+divisionBDisplay()+'</strong>'+
      '</div></div>':'')+
      ''+
    '</div>';
    bindStage();bindChallengeStageActions();
  }
  function bindStage(){
    qa('[data-tv-group]',q('#gd-stage')).forEach(group=>{
      group.onclick=()=>{if(challengeFrozen())return;selectedGroup=Number(group.dataset.tvGroup);draw()};
      group.onkeydown=e=>{
        if(challengeFrozen())return;
        const index=Number(group.dataset.tvGroup);
        if(e.key==='ArrowLeft'){e.preventDefault();selectedGroup=clamp(index-1,0,groupsCount-1);draw();setTimeout(()=>q('[data-tv-group="'+selectedGroup+'"]')?.focus(),0)}
        else if(e.key==='ArrowRight'){e.preventDefault();selectedGroup=clamp(index+1,0,groupsCount-1);draw();setTimeout(()=>q('[data-tv-group="'+selectedGroup+'"]')?.focus(),0)}
        else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();mutate(deleteSelected)}
        else if(e.key.toLowerCase()==='d'){e.preventDefault();mutate(duplicateSelected)}
      };
    });
    const undoBtn=q('#tv-undo');if(undoBtn)undoBtn.onclick=undo;
    const redoBtn=q('#tv-redo');if(redoBtn)redoBtn.onclick=redo;
    const gm=q('#tv-groups-minus');if(gm)gm.onclick=()=>mutate(()=>setGroups(groupsCount-1));
    const gp=q('#tv-groups-plus');if(gp)gp.onclick=()=>mutate(()=>setGroups(groupsCount+1));
    const im=q('#tv-items-minus');if(im)im.onclick=()=>mutate(()=>setItems(itemsPerGroup-1));
    const ip=q('#tv-items-plus');if(ip)ip.onclick=()=>mutate(()=>setItems(itemsPerGroup+1));
    const swap=q('#tv-swap');if(swap)swap.onclick=()=>mutate(swapFactors);
    const add=q('#tv-add-group');if(add)add.onclick=()=>mutate(addGroup);
    const duplicate=q('#tv-duplicate');if(duplicate)duplicate.onclick=()=>mutate(duplicateSelected);
    const del=q('#tv-delete');if(del)del.onclick=()=>mutate(deleteSelected);
  }

  function workflowTabs(){
    return '<div class="gd-row gd-tv-workflow-tabs" role="tablist" aria-label="Times-table Visualiser workflow">'+
      '<button class="gd-btn'+(controlTab==='explore'?' gd-btn--primary':'')+'" type="button" data-tv-workflow="explore">Explore</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-tv-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+ 
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-tv-workflow="export">Export / reuse</button></div>';
  }
  function modelControlsHtml(){
    return field('Quick setup','<div class="gd-row"><label class="gd-tv-quick"><span>Groups</span><input class="gd-input gd-small" id="tv-a" type="number" min="1" max="12" value="'+groupsCount+'"></label><span>×</span><label class="gd-tv-quick"><span>In each</span><input class="gd-input gd-small" id="tv-b" type="number" min="1" max="12" value="'+itemsPerGroup+'"></label></div>')+
      '<div class="gd-field"><span>Show connections</span>'+
        '<label class="gd-tv-check"><input type="checkbox" id="tv-show-repeated"'+(showRepeated?' checked':'')+'> <span>Repeated addition</span></label>'+
        '<label class="gd-tv-check"><input type="checkbox" id="tv-show-jumps"'+(showJumps?' checked':'')+'> <span>Equal jumps</span></label>'+
        '<label class="gd-tv-check"><input type="checkbox" id="tv-show-family"'+(showFactFamily?' checked':'')+'> <span>Fact family</span></label>'+
      '</div>';
  }
  function exploreControlsHtml(){
    return modelControlsHtml()+
      '<div class="gd-row"><button class="gd-btn" id="tv-random" type="button">Random fact</button><button class="gd-btn" id="tv-reset" type="button">Reset 4 × 6</button></div>'+
      '<p class="gd-help">Use the controls on the model itself to add or remove equal groups, change every group together, or swap the factors. Select a group and press Delete to remove it or D to duplicate it.</p>';
  }
  function challengeObject(type,prompt,answer,extra={}){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);
    const raw={mode:'standard',type,category:meta?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),answerMode:'manual',answerSource:'',revealed:false,freezeModel:true,hiddenEquation:false,hiddenRepeated:false,hiddenFactFamily:false,hiddenJumps:false,hiddenSelectedPanel:false,targetGroups:null,targetItems:null,wrongTotal:null,...extra};
    return CK?CK.normalise(raw):raw;
  }
  function randomInt(min,max){return min+Math.floor(Math.random()*(max-min+1))}
  function resetChallengeModel(){
    groupsCount=3;itemsPerGroup=4;selectedGroup=0;showRepeated=true;showJumps=true;showFactFamily=true;
  }
  function generateChallenge(type){
    const template=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!template)return;
    if(!beforeChallenge)beforeChallenge=snapshot();else restore(beforeChallenge);
    undoStack.length=0;redoStack.length=0;resetChallengeModel();
    const a=randomInt(3,8);let b=randomInt(4,9);if(type==='commutative-fact'&&a===b)b=a+1;const t=a*b;
    groupsCount=a;itemsPerGroup=b;selectedGroup=0;
    if(type==='find-total'){
      challenge=challengeObject(type,'How many items are there altogether in '+a+' equal groups of '+b+'?',t,{hiddenEquation:true,hiddenRepeated:true,hiddenFactFamily:true,hiddenJumps:true,hiddenSelectedPanel:true});
    }else if(type==='write-repeated'){
      challenge=challengeObject(type,'Write the repeated-addition statement shown by '+a+' groups of '+b+'.',Array.from({length:a},()=>b).join(' + ')+' = '+t,{hiddenRepeated:true,hiddenFactFamily:true,hiddenSelectedPanel:true});
    }else if(type==='commutative-fact'){
      challenge=challengeObject(type,'Write the commutative fact for '+a+' × '+b+' = '+t+'.',b+' × '+a+' = '+t,{hiddenFactFamily:true,hiddenSelectedPanel:true});
    }else if(type==='related-division'){
      challenge=challengeObject(type,'Use '+a+' × '+b+' = '+t+' to complete '+t+' ÷ '+a+' = ?.',b,{hiddenFactFamily:true,hiddenSelectedPanel:true});
    }else if(type==='build-fact'){
      const targetGroups=a,targetItems=b;
      groupsCount=2;itemsPerGroup=2;selectedGroup=0;
      challenge=challengeObject(type,'Build '+targetGroups+' equal groups with '+targetItems+' items in each group.',targetGroups+' × '+targetItems+' = '+(targetGroups*targetItems),{freezeModel:false,targetGroups,targetItems,hiddenFactFamily:false});
    }else{
      const valid=Math.random()<.5,shown=valid?t:t+(Math.random()<.5?-1:1)*randomInt(1,3);
      challenge=challengeObject(type,'The equation says '+a+' × '+b+' = '+shown+'. Use the equal groups to decide whether it is correct.',valid?'Yes. '+a+' × '+b+' = '+t+'.':'No. '+a+' × '+b+' = '+t+', not '+shown+'.',{wrongTotal:shown,hiddenRepeated:true,hiddenFactFamily:true,hiddenJumps:true,hiddenSelectedPanel:true});
    }
    challenge.initialState=snapshot();
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';exportMode='challenge';responseLines=template.category==='reason'?3:1;exportStatus='';renderControls();draw();
  }
  function restoreBeforeChallenge(){if(beforeChallenge){restore(beforeChallenge);beforeChallenge=null}}
  function clearChallenge(){
    restoreBeforeChallenge();challenge=null;challengeTab='standard';controlTab='explore';undoStack.length=0;redoStack.length=0;renderControls();draw();
  }
  function clearBoundHiding(){
    if(!challenge)return;
    challenge.hiddenEquation=false;challenge.hiddenRepeated=false;challenge.hiddenFactFamily=false;challenge.hiddenJumps=false;challenge.hiddenSelectedPanel=false;
  }
  function applyBoundHiding(source){
    clearBoundHiding();if(!challenge)return;
    if(source==='total'){
      challenge.hiddenEquation=true;challenge.hiddenRepeated=true;challenge.hiddenFactFamily=true;challenge.hiddenJumps=true;
    }else if(source==='equation')challenge.hiddenEquation=true;
    if(source==='repeated')challenge.hiddenRepeated=true;
    if(['commutative','division-a','division-b'].includes(source))challenge.hiddenFactFamily=true;
  }
  function resolveAnswerSource(source){
    if(source==='total')return String(total());
    if(source==='equation')return groupsCount+' × '+itemsPerGroup+' = '+total();
    if(source==='repeated')return repeatedText();
    if(source==='commutative')return commutativeText();
    if(source==='division-a')return divisionAText();
    if(source==='division-b')return divisionBText();
    return'';
  }
  function customAnswerSources(){
    return[
      {id:'total',label:'Total items'},
      {id:'equation',label:'Multiplication equation'},
      {id:'repeated',label:'Repeated addition'},
      {id:'commutative',label:'Commutative fact'},
      {id:'division-a',label:'Division by number of groups'},
      {id:'division-b',label:'Division by items per group'}
    ];
  }
  function updateChallengeAnswer(){
    if(!challenge||challenge.answerMode!=='bound'||!challenge.answerSource)return;
    const answer=resolveAnswerSource(challenge.answerSource);if(answer!=='')challenge.answer=answer;
    const live=q('#tv-custom-live-answer');if(live)live.textContent=challenge.answer||'—';
    if(challenge.revealed){
      const shown=q('.gd-challenge-actions em',q('#gd-stage'));if(shown)shown.textContent='Answer: '+challenge.answer;
    }
  }
  function enterCustomChallenge(){
    if(!beforeChallenge)beforeChallenge=snapshot();
    const wasCustom=challenge?.mode==='custom';
    if(CK)challenge=CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''});
    if(!wasCustom)clearBoundHiding();
    challenge.freezeModel=false;challenge.revealed=false;
    challengeTab='custom';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();draw();
  }
  function setCustomAnswerSource(source){
    if(!challenge||challenge.mode!=='custom')return;
    if(source==='manual'){challenge.answerMode='manual';challenge.answerSource='';clearBoundHiding()}
    else if(source==='generated'){challenge.answerMode='bound';challenge.answerSource='';clearBoundHiding()}
    else{challenge.answerMode='bound';challenge.answerSource=source;challenge.answer=resolveAnswerSource(source);applyBoundHiding(source)}
    challenge.revealed=false;renderControls();draw();
  }
  function challengeControlsHtml(){
    if(!CK)return'<p class="gd-help">Challenge tools are unavailable.</p>';
    const tabs=CK.tabsHtml?CK.tabsHtml('tv',challengeTab):'';
    if(challengeTab==='custom'){
      const custom=challenge&&challenge.mode==='custom'?challenge:CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual'});
      return tabs+CK.editorHtml(custom,'tv',{answerSources:customAnswerSources(),generatedAnswerLabel:'Keep the generated answer'})+
        modelControlsHtml()+
        '<div class="gd-row">'+(challenge&&challenge.answer?'<button class="gd-btn" id="tv-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
        (challenge?'<button class="gd-btn" id="tv-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
        '<p class="gd-help">Custom answers can follow the total, equation, repeated addition or one of the linked fact-family statements.</p>';
    }
    const picker=CK.pickerHtml(CHALLENGE_TEMPLATES,CHALLENGE_CATEGORIES,challengeCategory,challengeType,'tv');
    const repeat=!!(challenge&&challenge.mode==='standard'&&challenge.type===challengeType);
    return tabs+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="tv-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
      (challenge&&challenge.mode!=='custom'?'<button class="gd-btn" id="tv-edit-challenge" type="button">Edit challenge</button>':'')+
      (challenge&&challenge.answer?'<button class="gd-btn" id="tv-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
      (challenge?'<button class="gd-btn" id="tv-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
      (!challengeFrozen()&&challenge?.type==='build-fact'?modelControlsHtml():'');
  }
  function exportControlsHtml(){
    const canCard=!!challenge;
    if(!canCard&&exportMode==='challenge')exportMode='diagram';
    return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export the equal-groups model as a clean vector diagram or a pupil-ready challenge card.</span></div></div>'+
      (canCard?'<div class="nl-export-mode tv-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-tv-export-mode="challenge">Challenge card</button>'+
        '<button type="button" class="'+(exportMode==='diagram'?'is-active':'')+'" data-tv-export-mode="diagram">Model only</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="tv-response-lines">'+
          [1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+
          '</select></label><p class="gd-help">The pupil card restores the original challenge state and hides any answer-bearing representation again, even after Reveal answer or teacher testing.</p>'
        :'<p class="gd-help">Model-only export contains the current equal groups and the visible mathematical representations without editing controls.</p>')+
      '<div class="nl-export-grid tv-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="tv-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'challenge':'image')+'</button>'+
        '<button class="gd-btn" id="tv-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="tv-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="tv-print" type="button">Print / PDF</button>'+
      '</div><p class="gd-help" id="tv-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }
  function tvSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function exportState(pupil=false){
    if(pupil&&challenge?.mode==='standard'&&challenge.initialState)return{...challenge.initialState};
    return snapshot();
  }
  function exportHidden(key,pupil=false){
    if(!challenge)return false;
    return pupil?!!challenge[key]:hiddenFlag(key);
  }
  function stateTotal(state){return Number(state.groupsCount)*Number(state.itemsPerGroup)}
  function stateRepeated(state){return Array.from({length:Number(state.groupsCount)},()=>Number(state.itemsPerGroup)).join(' + ')+' = '+stateTotal(state)}
  function stateEquation(state,pupil=false){
    if(challenge?.mode==='standard'&&challenge.type==='spot-error'&&(pupil||!challenge.revealed))return state.groupsCount+' × '+state.itemsPerGroup+' = '+challenge.wrongTotal;
    if(exportHidden('hiddenEquation',pupil))return state.groupsCount+' × '+state.itemsPerGroup+' = ?';
    return state.groupsCount+' × '+state.itemsPerGroup+' = '+stateTotal(state);
  }
  function timesTableExportSvg({pupil=false}={}){
    if(pupil&&challenge?.type==='build-fact'){
      const svg=tvSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 900 500',role:'img','aria-label':'Space to draw equal groups'});
      svg.appendChild(tvSvgEl('rect',{x:0,y:0,width:900,height:500,fill:'#fff'}));svg.appendChild(tvSvgEl('rect',{x:30,y:30,width:840,height:440,rx:12,fill:'#fff',stroke:'#aabcc0','stroke-width':2}));return svg;
    }
    const state=exportState(pupil),groups=Number(state.groupsCount),items=Number(state.itemsPerGroup),width=900;
    const cols=Math.min(groups,4),rows=Math.ceil(groups/cols),cardW=170,cardH=128,gap=18;
    const groupsW=cols*cardW+(cols-1)*gap,groupsX=(width-groupsW)/2,groupsY=pupil?60:115;
    const showRep=!pupil&&state.showRepeated!==false,showFamily=!pupil&&state.showFactFamily!==false;
    const repHidden=exportHidden('hiddenRepeated',pupil),familyHidden=exportHidden('hiddenFactFamily',pupil),jumpsHidden=exportHidden('hiddenJumps',pupil);
    let yAfter=groupsY+rows*cardH+(rows-1)*gap+42;
    let extra=0;
    if(showRep)extra+=66;
    if(!pupil&&state.showJumps!==false&&!jumpsHidden)extra+=70;
    if(showFamily)extra+=96;
    const height=Math.max(500,yAfter+extra+70);
    const svg=tvSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Equal groups multiplication model','data-tv-export':'model'});
    svg.appendChild(tvSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(tvSvgEl('rect',{x:34,y:30,width:width-68,height:height-62,rx:20,fill:'#fbfcfc',stroke:'#c5d3d6','stroke-width':2,'data-tv-export-model':'1'}));
    if(!pupil)svg.appendChild(tvSvgEl('text',{x:width/2,y:78,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':30,'font-weight':800,fill:'#304b52','data-tv-export-equation':'1'},stateEquation(state,pupil)));
    for(let g=0;g<groups;g++){
      const col=g%cols,row=Math.floor(g/cols),x=groupsX+col*(cardW+gap),y=groupsY+row*(cardH+gap);
      svg.appendChild(tvSvgEl('rect',{x,y,width:cardW,height:cardH,rx:16,fill:'#f7fbfa',stroke:'#8bb9b2','stroke-width':2,'data-tv-export-group':g}));
      svg.appendChild(tvSvgEl('text',{x:x+cardW/2,y:y+24,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':13,'font-weight':800,fill:'#65787e'},'Group '+(g+1)));
      const dotCols=Math.min(items,6),dotGap=18,dotRows=Math.ceil(items/dotCols),dotStartX=x+cardW/2-((dotCols-1)*dotGap)/2,dotStartY=y+48;
      for(let i=0;i<items;i++){
        const dc=i%dotCols,dr=Math.floor(i/dotCols);
        svg.appendChild(tvSvgEl('circle',{cx:dotStartX+dc*dotGap,cy:dotStartY+dr*dotGap,r:6,fill:'#2f7d75'}));
      }
      svg.appendChild(tvSvgEl('text',{x:x+cardW/2,y:y+cardH-14,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':14,'font-weight':800,fill:'#425b62'},items+' in each'));
    }
    let y=yAfter;
    if(showRep){
      svg.appendChild(tvSvgEl('text',{x:70,y,'font-family':'Arial,sans-serif','font-size':13,'font-weight':800,fill:'#718288'},'REPEATED ADDITION'));
      svg.appendChild(tvSvgEl('text',{x:70,y:y+27,'font-family':'Arial,sans-serif','font-size':19,'font-weight':800,fill:'#304b52','data-tv-export-repeated':'1'},repHidden?'?':stateRepeated(state)));
      y+=66;
    }
    if(!pupil&&state.showJumps!==false&&!jumpsHidden){
      svg.appendChild(tvSvgEl('text',{x:70,y,'font-family':'Arial,sans-serif','font-size':13,'font-weight':800,fill:'#718288'},'EQUAL JUMPS'));
      const jumps=Array.from({length:groups},(_,i)=>(i*items)+' → '+((i+1)*items)).join('   ');
      svg.appendChild(tvSvgEl('text',{x:70,y:y+27,'font-family':'Arial,sans-serif','font-size':16,'font-weight':700,fill:'#425b62','data-tv-export-jumps':'1'},jumps));
      y+=70;
    }
    if(showFamily){
      const t=stateTotal(state),family=familyHidden?['?','?','?']:[items+' × '+groups+' = '+t,t+' ÷ '+groups+' = '+items,t+' ÷ '+items+' = '+groups];
      svg.appendChild(tvSvgEl('text',{x:70,y,'font-family':'Arial,sans-serif','font-size':13,'font-weight':800,fill:'#718288'},'FACT FAMILY'));
      family.forEach((line,i)=>svg.appendChild(tvSvgEl('text',{x:70+i*260,y:y+29,'font-family':'Arial,sans-serif','font-size':17,'font-weight':800,fill:'#304b52','data-tv-export-family':i},line)));
      y+=96;
    }
    svg.appendChild(tvSvgEl('text',{x:width-52,y:height-20,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return timesTableExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(timesTableExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Times-table challenge',
      prompt:challenge.type==='build-fact'?'Draw '+challenge.targetGroups+' equal groups with '+challenge.targetItems+' items in each group.':prompt,
      responseLabel:challenge.type==='build-fact'?'Draw your groups / working':challenge.category==='reason'?'Explain your thinking':'Answer',
      responseLines:challenge.type==='build-fact'?Math.max(3,responseLines):responseLines,
      brand:'99 Club Studio'
    });
  }
  function exportName(){
    const meta=challenge&&CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return exportMode==='challenge'&&challenge?(challenge.title||meta?.title||'times-table-challenge'):'times-table-equal-groups';
  }
  function exportMessage(text){exportStatus=text;const el=q('#tv-export-status');if(el)el.textContent=text}
  async function exportAction(kind){
    try{
      if(!X)throw new Error('Export tools are not available.');
      const target=exportTargetSvg(),isCard=exportMode==='challenge'&&!!challenge,name=exportName();
      if(kind==='copy'){await X.copyPng(target);exportMessage(isCard?'Challenge copied — paste it into your worksheet, slide or document.':'Equal-groups model copied — paste it into your slide or document.')}
      if(kind==='png'){await X.downloadPng(target,name,2);exportMessage(isCard?'Challenge PNG downloaded.':'Equal-groups PNG downloaded.')}
      if(kind==='svg'){X.downloadSvg(target,name);exportMessage(isCard?'Challenge SVG downloaded.':'Equal-groups SVG downloaded.')}
      if(kind==='print'){X.printSvg(target,{title:'',landscape:false});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'That export did not work.')}
  }
  function controlsHtml(){return workflowTabs()+(controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():exploreControlsHtml())}
  function renderControls(){q('#gd-controls').innerHTML=controlsHtml();bindControls()}
  function bindModelControls(){
    const a=q('#tv-a');if(a)a.onchange=()=>mutate(()=>setGroups(a.value));
    const b=q('#tv-b');if(b)b.onchange=()=>mutate(()=>setItems(b.value));
    const repeated=q('#tv-show-repeated');if(repeated)repeated.onchange=()=>{showRepeated=repeated.checked;draw()};
    const jumps=q('#tv-show-jumps');if(jumps)jumps.onchange=()=>{showJumps=jumps.checked;draw()};
    const family=q('#tv-show-family');if(family)family.onchange=()=>{showFactFamily=family.checked;draw()};
  }
  function bindControls(){
    const controls=q('#gd-controls');if(!controls)return;
    qa('[data-tv-workflow]',controls).forEach(button=>button.onclick=()=>{controlTab=button.dataset.tvWorkflow;renderControls()});
    if(controlTab==='export'){
      qa('[data-tv-export-mode]',controls).forEach(button=>button.onclick=()=>{exportMode=button.dataset.tvExportMode==='challenge'&&challenge?'challenge':'diagram';exportStatus='';renderControls()});
      const response=q('#tv-response-lines',controls);if(response)response.onchange=()=>{responseLines=clamp(Math.round(num(response.value,1)),1,4);renderControls()};
      const copyImage=q('#tv-copy-image',controls);if(copyImage)copyImage.onclick=()=>exportAction('copy');
      const png=q('#tv-png',controls);if(png)png.onclick=()=>exportAction('png');
      const svgDownload=q('#tv-svg-download',controls);if(svgDownload)svgDownload.onclick=()=>exportAction('svg');
      const print=q('#tv-print',controls);if(print)print.onclick=()=>exportAction('print');
      return;
    }
    bindModelControls();
    if(controlTab==='explore'){
      const random=q('#tv-random');if(random)random.onclick=()=>mutate(()=>{groupsCount=1+Math.floor(Math.random()*12);itemsPerGroup=1+Math.floor(Math.random()*12);selectedGroup=0});
      const reset=q('#tv-reset');if(reset)reset.onclick=()=>mutate(()=>{groupsCount=4;itemsPerGroup=6;selectedGroup=0});
      return;
    }
    if(controlTab!=='challenge')return;
    qa('[data-tv-challenge-tab]',q('#gd-controls')).forEach(button=>button.onclick=()=>{
      if(button.dataset.tvChallengeTab==='custom')enterCustomChallenge();
      else{challengeTab='standard';renderControls()}
    });
    qa('[data-tv-challenge-cat]',q('#gd-controls')).forEach(button=>button.onclick=()=>{
      challengeCategory=button.dataset.tvChallengeCat;
      const first=CHALLENGE_TEMPLATES.find(t=>t.category===challengeCategory);if(first)challengeType=first.id;
      renderControls();
    });
    qa('[data-tv-challenge-type]',q('#gd-controls')).forEach(button=>button.onclick=()=>{challengeType=button.dataset.tvChallengeType;renderControls()});
    const generate=q('#tv-generate');if(generate)generate.onclick=()=>generateChallenge(challengeType);
    const edit=q('#tv-edit-challenge');if(edit)edit.onclick=enterCustomChallenge;
    const reveal=q('#tv-reveal');if(reveal)reveal.onclick=toggleModelReveal;
    const clear=q('#tv-clear-challenge');if(clear)clear.onclick=clearChallenge;
    if(challengeTab==='custom'&&challenge){
      const title=q('#tv-custom-title');if(title)title.oninput=()=>{challenge.title=title.value.slice(0,100);draw()};
      const prompt=q('#tv-custom-prompt');if(prompt)prompt.oninput=()=>{challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);draw()};
      const source=q('#tv-custom-answer-source');if(source)source.onchange=()=>setCustomAnswerSource(source.value);
      const answer=q('#tv-custom-answer');if(answer)answer.oninput=()=>{challenge.answer=answer.value.slice(0,400);challenge.answerMode='manual';challenge.answerSource='';draw()};
      qa('[data-gd-rich-action]',q('#gd-controls')).forEach(button=>button.onclick=()=>{CK.applyFormat(prompt,button.dataset.gdRichAction);challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);draw()});
    }
  }

  setPanels(controlsHtml(),'');
  bindControls();
  draw();
  G.lessonState?.register('times-table',()=>({diagram:snapshot(),challenge,beforeChallenge,pupil:CK?.capturePupil?.(challenge),controlTab,challengeTab,challengeCategory,challengeType,exportMode,responseLines}),saved=>{
    restore(saved.diagram);challenge=saved.challenge?CK.normalise(saved.challenge):null;beforeChallenge=saved.beforeChallenge||null;
    if(Object.prototype.hasOwnProperty.call(saved,'controlTab'))controlTab=saved.controlTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeTab'))challengeTab=saved.challengeTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeCategory'))challengeCategory=saved.challengeCategory;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeType'))challengeType=saved.challengeType;
    if(Object.prototype.hasOwnProperty.call(saved,'exportMode'))exportMode=saved.exportMode;
    if(Object.prototype.hasOwnProperty.call(saved,'responseLines'))responseLines=saved.responseLines;
    CK?.restorePupil?.(challenge,saved.pupil);renderControls();draw();
  });

}

function factorExplorer(){
  const CK=G.challengeKit,X=G.exportTools;
  let a=36,b=24,compare=false,selectedSide='a',selectedPair=0;
  const undoStack=[],redoStack=[];
  const DIVISORS=[2,3,4,5,6,8,9,10];
  const CHALLENGE_CATEGORIES=[
    {id:'read',label:'Factors & primes'},
    {id:'compare',label:'Compare numbers'},
    {id:'reason',label:'Reasoning'}
  ];
  const CHALLENGE_TEMPLATES=[
    {id:'prime-or-composite',category:'read',title:'Prime or composite?',desc:'Classify a number from its factors.'},
    {id:'missing-factor',category:'read',title:'Missing factor',desc:'Complete a factor pair for the shown number.'},
    {id:'divisible-by',category:'read',title:'Divisibility check',desc:'Decide whether a number is divisible by a given divisor.'},
    {id:'common-factors',category:'compare',title:'Common factors',desc:'Find the factors shared by two numbers.'},
    {id:'hcf',category:'compare',title:'Highest common factor',desc:'Find the HCF of two numbers.'},
    {id:'lcm',category:'compare',title:'Lowest common multiple',desc:'Find the LCM of two numbers.'},
    {id:'explain-prime',category:'reason',title:'Explain why it is prime',desc:'Use the factor evidence to justify a prime classification.'}
  ];
  let controlTab='explore',challengeTab='standard',challengeCategory='read',challengeType='prime-or-composite',challenge=null,beforeChallenge=null;
  let exportMode='diagram',responseLines=1,exportStatus='';

  function norm(value,fallback=2){return clamp(Math.round(Number(value)||fallback),2,500)}
  function factors(n){const out=[];for(let i=1;i<=Math.sqrt(n);i++)if(n%i===0){out.push(i);if(i!==n/i)out.push(n/i)}return out.sort((x,y)=>x-y)}
  function factorPairs(n){const out=[];for(let i=1;i*i<=n;i++)if(n%i===0)out.push([i,n/i]);return out}
  function primeFactors(n){let x=n,out=[];for(let p=2;p*p<=x;p++)while(x%p===0){out.push(p);x/=p}if(x>1)out.push(x);return out}
  function isPrime(n){return factors(n).length===2}
  function gcd2(x,y){while(y){const t=x%y;x=y;y=t}return Math.abs(x)}
  function lcm2(x,y){return Math.abs(x*y)/gcd2(x,y)}
  function snapshot(){return{a,b,compare,selectedSide,selectedPair}}
  function restore(s){
    a=norm(s?.a,36);b=norm(s?.b,24);compare=!!s?.compare;
    selectedSide=s?.selectedSide==='b'?'b':'a';
    selectedPair=Math.max(0,Math.round(Number(s?.selectedPair)||0));
    if(!compare&&selectedSide==='b')selectedSide='a';
  }
  function remember(){undoStack.push(snapshot());if(undoStack.length>60)undoStack.shift();redoStack.length=0}
  function challengeFrozen(){return !!(challenge&&challenge.mode==='standard')}
  function mutate(fn){if(challengeFrozen())return;remember();fn();clampPair();draw();renderControls()}
  function undo(){if(!undoStack.length||challengeFrozen())return;redoStack.push(snapshot());restore(undoStack.pop());clampPair();draw();renderControls()}
  function redo(){if(!redoStack.length||challengeFrozen())return;undoStack.push(snapshot());restore(redoStack.pop());clampPair();draw();renderControls()}
  function currentNumber(){return selectedSide==='b'&&compare?b:a}
  function currentPairs(){return factorPairs(currentNumber())}
  function clampPair(){selectedPair=clamp(selectedPair,0,Math.max(0,currentPairs().length-1))}
  function setA(v){a=norm(v,a);if(selectedSide==='a')selectedPair=0}
  function setB(v){b=norm(v,b);if(selectedSide==='b')selectedPair=0}
  function setCompare(on){compare=!!on;if(!compare&&selectedSide==='b'){selectedSide='a';selectedPair=0}}
  function pairLabel(pair){return pair[0]+' × '+pair[1]}
  function factorisationText(n){return primeFactors(n).join(' × ')}
  function multiples(n){return Array.from({length:12},(_,i)=>n*(i+1))}
  function commonFactors(){if(!compare)return[];const fb=new Set(factors(b));return factors(a).filter(x=>fb.has(x))}
  function divisibilityHtml(n,prefix){
    return '<div class="gd-fe-divisibility" data-fe-divisibility="'+prefix+'">'+DIVISORS.map(d=>{
      const r=n%d,yes=r===0;
      const hidden=!!(challenge&&!challenge.revealed&&challenge.hiddenDivisor===d&&challenge.hiddenDivisorSide===prefix);
      return '<div class="gd-fe-divisor'+(yes?' is-divisible':'')+'" data-fe-divisor="'+prefix+'-'+d+'"><span>÷ '+d+'</span><strong>'+(hidden?'?':(yes?'Yes':'r '+r))+'</strong></div>';
    }).join('')+'</div>';
  }
  function pairButtons(n,side){
    const common=new Set(commonFactors());
    return factorPairs(n).map((pair,i)=>{
      const active=selectedSide===side&&selectedPair===i;
      const shared=compare&&(common.has(pair[0])||common.has(pair[1]));
      const hidden=!!(challenge&&!challenge.revealed&&((challenge.hiddenPairSide===side&&challenge.hiddenPairIndex===i)||challenge.hiddenAllPairsSide===side));
      return '<button type="button" class="gd-factor-pair gd-fe-pair'+(active?' is-selected':'')+(shared?' is-common':'')+'" data-fe-pair="'+side+'-'+i+'" data-fe-side="'+side+'" data-fe-index="'+i+'"'+(challengeFrozen()?' disabled':'')+'>'+(hidden?(pair[0]+' × ?'):pairLabel(pair))+'</button>';
    }).join('');
  }
  function multipleChips(n,side){
    const other=side==='a'?b:a;
    return multiples(n).map((x,i)=>{
      const common=compare&&x%other===0;
      return '<span class="gd-multiple gd-fe-multiple'+(common?' is-common':'')+'" data-fe-multiple="'+side+'-'+i+'" title="'+(common?'Common multiple':'Multiple '+(i+1))+'">'+x+'</span>';
    }).join('');
  }
  function numberCard(n,side,label){
    const fs=factors(n),hideClass=!!(challenge&&!challenge.revealed&&challenge.hiddenClassificationSide===side);
    return '<section class="gd-fe-number-card" data-fe-card="'+side+'">'+
      '<div class="gd-fe-card-head"><div><span>'+label+'</span><strong>'+n+'</strong><em>'+(hideClass?'?':(isPrime(n)?'Prime number':'Composite · '+fs.length+' factors'))+'</em></div>'+
        (challengeFrozen()?'':'<div class="gd-object-toolbar"><button class="gd-btn" type="button" data-fe-step="'+side+'--">−1</button><button class="gd-btn" type="button" data-fe-step="'+side+'-+">+1</button></div>')+'</div>'+
      '<div><span class="gd-fe-label">Factor pairs</span><div class="gd-factor-pairs">'+pairButtons(n,side)+'</div></div>'+
      '<div><span class="gd-fe-label">First 12 multiples</span><div class="gd-multiples">'+multipleChips(n,side)+'</div></div>'+
      '<div><span class="gd-fe-label">Prime factorisation</span><div class="gd-readout gd-fe-prime" data-fe-prime="'+side+'">'+((challenge&&!challenge.revealed&&challenge.hiddenPrimeSide===side)?'?':factorisationText(n))+'</div></div>'+
      '<div><span class="gd-fe-label">Divisibility checks</span>'+divisibilityHtml(n,side)+'</div>'+
    '</section>';
  }
  function arrayDiagram(){
    const n=currentNumber(),pairs=currentPairs(),pair=pairs[selectedPair]||pairs[0]||[1,n];
    const rows=pair[0],cols=pair[1],W=520,H=250,pad=52,gridW=W-2*pad,gridH=H-2*pad;
    let lines='';
    const vCount=Math.min(cols,24),hCount=Math.min(rows,16);
    for(let i=1;i<vCount;i++){const x=pad+gridW*i/vCount;lines+='<line x1="'+x+'" y1="'+pad+'" x2="'+x+'" y2="'+(pad+gridH)+'"></line>'}
    for(let i=1;i<hCount;i++){const y=pad+gridH*i/hCount;lines+='<line x1="'+pad+'" y1="'+y+'" x2="'+(pad+gridW)+'" y2="'+y+'"></line>'}
    const hideSelected=!!(challenge&&!challenge.revealed&&challenge.hiddenPairSide===selectedSide&&challenge.hiddenPairIndex===selectedPair);
    const pairText=hideSelected?rows+' × ? = '+n:rows+' × '+cols+' = '+n;
    const aria=hideSelected?rows+' rows by an unknown number of columns equals '+n:rows+' rows by '+cols+' columns equals '+n;
    return '<div class="gd-fe-array-panel"><div class="gd-fe-array-head"><span>Selected factor rectangle</span><strong data-fe-selected-pair>'+pairText+'</strong></div>'+
      '<svg class="gd-fe-array" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+aria+'">'+
        '<rect x="'+pad+'" y="'+pad+'" width="'+gridW+'" height="'+gridH+'"></rect><g>'+lines+'</g>'+
        '<text x="'+(W/2)+'" y="28" text-anchor="middle">'+(hideSelected?'? columns':cols+' columns')+'</text><text x="18" y="'+(H/2)+'" text-anchor="middle" transform="rotate(-90 18 '+(H/2)+')">'+rows+' rows</text>'+
      '</svg><p class="gd-help">'+(cols>24||rows>16?'Large arrays are simplified visually, but the factor pair is exact.':'Each grid division represents one row or column.')+'</p></div>';
  }
  function compareSummary(){
    if(!compare)return'';
    const cf=commonFactors(),h=gcd2(a,b),l=lcm2(a,b),hide=challenge&&!challenge.revealed;
    return '<div class="gd-fe-common" data-fe-common-summary><div><span>Common factors</span><strong>'+(hide&&challenge.hiddenCommonFactors?'?':cf.join(', '))+'</strong></div><div><span>Highest common factor</span><strong data-fe-hcf>'+(hide&&challenge.hiddenHcf?'?':h)+'</strong></div><div><span>Lowest common multiple</span><strong data-fe-lcm>'+(hide&&challenge.hiddenLcm?'?':l)+'</strong></div></div>';
  }
  // A challenge shows evidence, not the teaching dashboard or precomputed answers.
  function questionEvidence(){
    const type=challenge.type;
    if(type==='missing-factor')return arrayDiagram();
    if(type==='divisible-by')return '<div class="gd-fe-question-number">'+a+' ÷ '+challenge.hiddenDivisor+' = ?</div>';
    const useMultiples=type==='lcm';
    return '<div class="gd-fe-question-evidence">'+(compare?[a,b]:[a]).map(n=>'<section><strong class="gd-fe-question-number">'+n+'</strong><span class="gd-fe-label">'+(useMultiples?'First 12 multiples':'Factor pairs')+'</span><div class="gd-fe-question-values">'+(useMultiples?multiples(n).map(v=>'<span>'+v+'</span>'):factorPairs(n).map(pair=>'<span>'+pairLabel(pair)+'</span>')).join('')+'</div></section>').join('')+'</div>';
  }
  function questionEvidenceSvg(){
    const type=challenge.type,useMultiples=type==='lcm',numbers=compare?[a,b]:[a],width=920,height=type==='missing-factor'?320:type==='divisible-by'?160:270;
    const svg=feSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Factor question evidence'});
    svg.appendChild(feSvgEl('rect',{x:0,y:0,width,height,fill:'#fff'}));
    const text=(x,y,value,size=22)=>svg.appendChild(feSvgEl('text',{x,y,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':size,'font-weight':700,fill:'#304b52'},value));
    if(type==='missing-factor'){
      const [rows,cols]=currentPairs()[selectedPair];text(460,36,rows+' × ? = '+a,26);
      const w=cols*24,h=rows*24,x=(width-w)/2,y=70;
      svg.appendChild(feSvgEl('rect',{x,y,width:w,height:h,fill:'#e8f4f1',stroke:'#77918e','stroke-width':2}));
      for(let i=1;i<cols;i++)svg.appendChild(feSvgEl('line',{x1:x+i*24,y1:y,x2:x+i*24,y2:y+h,stroke:'#9ab9b4'}));
      for(let i=1;i<rows;i++)svg.appendChild(feSvgEl('line',{x1:x,y1:y+i*24,x2:x+w,y2:y+i*24,stroke:'#9ab9b4'}));
    }else if(type==='divisible-by')text(460,86,a+' ÷ '+challenge.hiddenDivisor+' = ?',30);
    else numbers.forEach((n,i)=>{
      const colW=width/numbers.length,center=colW*(i+.5);text(center,38,n,30);text(center,72,useMultiples?'First 12 multiples':'Factor pairs',16);
      const values=useMultiples?multiples(n).map(String):factorPairs(n).map(pairLabel);
      values.forEach((v,j)=>text(i*colW+(j%3+.5)*colW/3,112+Math.floor(j/3)*38,v,20));
    });
    return svg;
  }
  function bindChallengeStageActions(){
    const endChallenge=q('[data-challenge-action="end"]',q('#gd-stage'));if(endChallenge)endChallenge.onclick=e=>{e.stopPropagation();clearChallenge()};
    const stage=q('#gd-stage');if(!stage||!challenge)return;
    const reveal=q('[data-board-action="reveal"]',stage);if(reveal)reveal.onclick=e=>{e.stopPropagation();challenge.revealed=!challenge.revealed;renderControls();draw()};
    const another=q('[data-challenge-action="another"]',stage);if(another)another.onclick=e=>{e.stopPropagation();if(challenge?.mode==='standard')generateChallenge(challenge.type)};
  }
  function draw(){
    updateChallengeAnswer();
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Factors & multiples challenge',pupil:(challenge.type==='prime-or-composite'?CK.pupilSpec('choice',{choices:['Prime','Composite']}):challenge.type==='divisible-by'?CK.pupilSpec('choice',{choices:['Yes','No'],expected:/^yes/i.test(challenge.answer)?'Yes':'No',explain:true}):challenge.type==='explain-prime'?CK.pupilSpec('discuss'):CK.pupilSpec(challenge.type==='common-factors'?'set':'number')),actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'},{action:'end',label:'Back to setup'}]:[{action:'end',label:'End challenge'}]}):'';
    if(challenge?.mode==='standard'&&!challenge.revealed){q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-fe-workbench is-focused-challenge">'+questionEvidence()+'</div>';bindChallengeStageActions();return}
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-fe-workbench">'+
      '<div class="gd-fe-summary"><div><span>Factors & multiples</span><strong>'+(compare?a+' and '+b:a)+'</strong></div><div class="gd-object-toolbar"><button class="gd-btn" id="fe-undo" type="button"'+(undoStack.length?'':' disabled')+'>Undo</button><button class="gd-btn" id="fe-redo" type="button"'+(redoStack.length?'':' disabled')+'>Redo</button></div></div>'+
      compareSummary()+
      '<div class="gd-fe-cards">'+numberCard(a,'a','Number A')+(compare?numberCard(b,'b','Number B'):'')+'</div>'+
      arrayDiagram()+
    '</div>';
    bindStage();bindChallengeStageActions();
  }
  function bindStage(){
    qa('[data-fe-step]',q('#gd-stage')).forEach(button=>button.onclick=()=>{
      const code=button.dataset.feStep,side=code[0],delta=code.endsWith('--')?-1:1;
      mutate(()=>{selectedSide=side;if(side==='a')setA(a+delta);else setB(b+delta)});
    });
    qa('[data-fe-pair]',q('#gd-stage')).forEach(button=>button.onclick=()=>{
      if(challengeFrozen())return;selectedSide=button.dataset.feSide;selectedPair=Number(button.dataset.feIndex)||0;draw();renderControls();
    });
    const u=q('#fe-undo');if(u)u.onclick=undo;
    const r=q('#fe-redo');if(r)r.onclick=redo;
  }
  function workflowTabs(){
    return '<div class="gd-row gd-fe-workflow-tabs" role="tablist" aria-label="Factor Explorer workflow">'+
      '<button class="gd-btn'+(controlTab==='explore'?' gd-btn--primary':'')+'" type="button" data-fe-workflow="explore">Explore</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-fe-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-fe-workflow="export">Export / reuse</button></div>';
  }
  function modelControlsHtml(){
    return field('Number A','<input class="gd-input" id="fe-a" type="number" min="2" max="500" value="'+a+'">','Use the model to inspect factor pairs, multiples, prime factors and divisibility.')+
      '<label class="gd-tv-check"><input type="checkbox" id="fe-compare"'+(compare?' checked':'')+'> <span>Compare with a second number</span></label>'+
      (compare?field('Number B','<input class="gd-input" id="fe-b" type="number" min="2" max="500" value="'+b+'">','Common factors and the lowest common multiple are highlighted automatically.'):'');
  }
  function exploreControlsHtml(){
    return modelControlsHtml()+
      '<div class="gd-row"><button class="gd-btn" id="fe-random" type="button">Random number'+(compare?'s':'')+'</button><button class="gd-btn" id="fe-reset" type="button">Reset</button></div>'+
      '<p class="gd-help">Click any factor pair to inspect it as a rectangle. In compare mode, shared factors and common multiples are highlighted, with HCF and LCM shown above.</p>';
  }
  function challengeObject(type,prompt,answer,extra={}){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);
    const raw={mode:'standard',type,category:meta?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),answerMode:'manual',answerSource:'',revealed:false,hiddenClassificationSide:'',hiddenPairSide:'',hiddenPairIndex:null,hiddenAllPairsSide:'',hiddenDivisor:null,hiddenDivisorSide:'',hiddenPrimeSide:'',hiddenCommonFactors:false,hiddenHcf:false,hiddenLcm:false,...extra};
    return CK?CK.normalise(raw):raw;
  }
  function resolveAnswerSource(source){
    if(source==='classification-a')return isPrime(a)?'Prime':'Composite';
    if(source==='factors-a')return factors(a).join(', ');
    if(source==='prime-a')return factorisationText(a);
    if(source==='common-factors'&&compare)return commonFactors().join(', ');
    if(source==='hcf'&&compare)return String(gcd2(a,b));
    if(source==='lcm'&&compare)return String(lcm2(a,b));
    return'';
  }
  function customAnswerSources(){
    const out=[
      {id:'classification-a',label:'Number A: prime or composite'},
      {id:'factors-a',label:'Number A: all factors'},
      {id:'prime-a',label:'Number A: prime factorisation'}
    ];
    if(compare)out.push({id:'common-factors',label:'Common factors'},{id:'hcf',label:'Highest common factor'},{id:'lcm',label:'Lowest common multiple'});
    return out;
  }
  function clearBoundHiding(){
    if(!challenge)return;
    challenge.hiddenClassificationSide='';challenge.hiddenPrimeSide='';challenge.hiddenAllPairsSide='';challenge.hiddenCommonFactors=false;challenge.hiddenHcf=false;challenge.hiddenLcm=false;
  }
  function applyBoundHiding(source){
    clearBoundHiding();if(!challenge)return;
    if(source==='classification-a')challenge.hiddenClassificationSide='a';
    if(source==='factors-a')challenge.hiddenAllPairsSide='a';
    if(source==='prime-a')challenge.hiddenPrimeSide='a';
    if(source==='common-factors')challenge.hiddenCommonFactors=true;
    if(source==='hcf')challenge.hiddenHcf=true;
    if(source==='lcm')challenge.hiddenLcm=true;
  }
  function updateChallengeAnswer(){
    if(!challenge||challenge.answerMode!=='bound'||!challenge.answerSource)return;
    const answer=resolveAnswerSource(challenge.answerSource);if(answer!=='')challenge.answer=answer;
    const live=q('#fe-custom-live-answer');if(live)live.textContent=challenge.answer||'—';
    if(challenge.revealed){const shown=q('.gd-challenge-actions em',q('#gd-stage'));if(shown)shown.textContent='Answer: '+challenge.answer}
  }
  function generateChallenge(type){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!meta)return;
    if(!beforeChallenge)beforeChallenge=snapshot();else restore(beforeChallenge);
    undoStack.length=0;redoStack.length=0;selectedSide='a';selectedPair=0;
    let variantKey='';
    const pick=list=>{const v=CK.pickVariant(list,challenge?.type===type?challenge.variantKey:'');variantKey=JSON.stringify(v);return v};
    if(type==='prime-or-composite'){
      a=pick([29,21,37,49,23,51,41,57,31,27]);compare=false;
      challenge=challengeObject(type,'Is '+a+' prime or composite? Use the factor evidence to decide.',isPrime(a)?'Prime':'Composite',{hiddenClassificationSide:'a',hiddenPrimeSide:'a'});
    }else if(type==='missing-factor'){
      const item=pick([[36,4],[24,3],[42,6],[48,4],[56,7],[63,7],[72,8],[45,5]]);
      a=item[0];compare=false;selectedPair=factorPairs(a).findIndex(p=>p[0]===item[1]);
      challenge=challengeObject(type,'Complete the selected factor pair: '+item[1]+' × ? = '+a+'.',String(a/item[1]),{hiddenPairSide:'a',hiddenPairIndex:selectedPair});
    }else if(type==='divisible-by'){
      const item=pick([[42,6],[45,6],[36,4],[35,4],[54,9],[56,9],[75,5],[72,5]]);
      a=item[0];compare=false;const divisor=item[1],yes=a%divisor===0;
      challenge=challengeObject(type,'Is '+a+' divisible by '+divisor+'? Explain using the evidence shown.',yes?'Yes. '+a+' ÷ '+divisor+' = '+a/divisor+'.':'No. '+a+' is not a multiple of '+divisor+'.',{hiddenDivisor:divisor,hiddenDivisorSide:'a'});
    }else if(type==='common-factors'||type==='hcf'){
      [a,b]=pick([[36,24],[18,30],[48,60],[42,28],[32,40],[45,60]]);compare=true;
      const list=commonFactors();
      challenge=type==='common-factors'?challengeObject(type,'What are the common factors of '+a+' and '+b+'?',list.join(', '),{hiddenCommonFactors:true}):challengeObject(type,'What is the highest common factor of '+a+' and '+b+'?',String(gcd2(a,b)),{hiddenHcf:true});
    }else if(type==='lcm'){
      [a,b]=pick([[12,18],[4,6],[8,12],[6,15],[9,12],[10,15],[14,21]]);compare=true;
      challenge=challengeObject(type,'What is the lowest common multiple of '+a+' and '+b+'?',String(lcm2(a,b)),{hiddenLcm:true});
    }else{
      a=pick([31,17,19,23,29,37,41,43]);compare=false;
      challenge=challengeObject(type,'Explain why '+a+' is prime using the factor information shown.',a+' has exactly two factors: 1 and '+a+'.',{hiddenClassificationSide:'a',hiddenPrimeSide:'a'});
    }
    challenge.variantKey=variantKey;
    challengeType=type;challengeCategory=meta.category;challengeTab='standard';controlTab='challenge';exportMode='challenge';responseLines=meta.category==='reason'?3:1;exportStatus='';renderControls();draw();
  }
  function enterCustomChallenge(){
    if(!beforeChallenge)beforeChallenge=snapshot();
    if(CK)challenge=CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''});
    challenge.mode='custom';challenge.revealed=false;challengeTab='custom';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();draw();
  }
  function clearChallenge(){
    if(beforeChallenge){restore(beforeChallenge);beforeChallenge=null}
    challenge=null;challengeTab='standard';controlTab='challenge';undoStack.length=0;redoStack.length=0;renderControls();draw();
  }
  function setCustomAnswerSource(source){
    if(!challenge||challenge.mode!=='custom')return;
    if(source==='manual'){challenge.answerMode='manual';challenge.answerSource='';clearBoundHiding()}
    else if(source==='generated'){challenge.answerMode='bound';challenge.answerSource='';clearBoundHiding()}
    else{challenge.answerMode='bound';challenge.answerSource=source;challenge.answer=resolveAnswerSource(source);applyBoundHiding(source)}
    challenge.revealed=false;renderControls();draw();
  }
  function challengeControlsHtml(){
    if(!CK)return'<p class="gd-help">Challenge tools are unavailable.</p>';
    const tabs=CK.tabsHtml?CK.tabsHtml('fe',challengeTab):'';
    if(challengeTab==='custom'){
      const custom=challenge&&challenge.mode==='custom'?challenge:CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual'});
      return tabs+CK.editorHtml(custom,'fe',{answerSources:customAnswerSources(),generatedAnswerLabel:'Keep the generated answer'})+
        modelControlsHtml()+
        '<div class="gd-row">'+(challenge&&challenge.answer?'<button class="gd-btn" id="fe-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
        (challenge?'<button class="gd-btn" id="fe-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
        '<p class="gd-help">Custom answers can follow the current classification, factor list, prime factorisation, common factors, HCF or LCM.</p>';
    }
    const picker=CK.pickerHtml(CHALLENGE_TEMPLATES,CHALLENGE_CATEGORIES,challengeCategory,challengeType,'fe');
    const repeat=!!(challenge&&challenge.mode==='standard'&&challenge.type===challengeType);
    return tabs+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="fe-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
      (challenge&&challenge.mode!=='custom'?'<button class="gd-btn" id="fe-edit-challenge" type="button">Edit challenge</button>':'')+
      (challenge&&challenge.answer?'<button class="gd-btn" id="fe-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
      (challenge?'<button class="gd-btn" id="fe-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>';
  }
  function exportControlsHtml(){
    const canCard=!!challenge;
    if(!canCard&&exportMode==='challenge')exportMode='diagram';
    return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export a clean factors-and-multiples diagram or a pupil-ready challenge card.</span></div></div>'+
      (canCard?'<div class="nl-export-mode fe-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-fe-export-mode="challenge">Challenge card</button>'+
        '<button type="button" class="'+(exportMode==='diagram'?'is-active':'')+'" data-fe-export-mode="diagram">Diagram only</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="fe-response-lines">'+
          [1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+
          '</select></label><p class="gd-help">The pupil card preserves hidden factors, classifications, divisibility evidence, common factors, HCF and LCM even after Reveal answer.</p>'
        :'<p class="gd-help">Diagram-only export contains the current number evidence, factor pairs, multiples and factor rectangle without editing controls.</p>')+
      '<div class="nl-export-grid fe-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="fe-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'challenge':'image')+'</button>'+
        '<button class="gd-btn" id="fe-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="fe-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="fe-print" type="button">Print / PDF</button>'+
      '</div><p class="gd-help" id="fe-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }
  function feSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function exportHidden(key,pupil=false,side=''){
    if(!challenge)return false;
    if(key==='classification')return pupil?challenge.hiddenClassificationSide===side:challenge&&!challenge.revealed&&challenge.hiddenClassificationSide===side;
    if(key==='prime')return pupil?challenge.hiddenPrimeSide===side:challenge&&!challenge.revealed&&challenge.hiddenPrimeSide===side;
    if(key==='all-pairs')return pupil?challenge.hiddenAllPairsSide===side:challenge&&!challenge.revealed&&challenge.hiddenAllPairsSide===side;
    return pupil?!!challenge[key]:challenge&&!challenge.revealed&&!!challenge[key];
  }
  function factorExplorerExportSvg({pupil=false}={}){
    if(pupil&&challenge?.mode==='standard')return questionEvidenceSvg();
    const width=920,cardGap=18,cardCount=compare?2:1,cardW=cardCount===2?410:650,cardX0=(width-(cardCount*cardW+(cardCount-1)*cardGap))/2;
    const height=compare?790:720;
    const svg=feSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Factors and multiples model','data-fe-export':'diagram'});
    svg.appendChild(feSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(feSvgEl('text',{x:width/2,y:42,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':26,'font-weight':800,fill:'#304b52'},compare?'Factors & multiples: '+a+' and '+b:'Factors & multiples: '+a));
    const sides=compare?[['a',a,'Number A'],['b',b,'Number B']]:[['a',a,'Number A']];
    sides.forEach(([side,n,label],idx)=>{
      const x=cardX0+idx*(cardW+cardGap),y=68;
      svg.appendChild(feSvgEl('rect',{x,y,width:cardW,height:410,rx:18,fill:'#fbfdfd',stroke:'#cbd8da','stroke-width':2,'data-fe-export-card':side}));
      svg.appendChild(feSvgEl('text',{x:x+22,y:y+30,'font-family':'Arial,sans-serif','font-size':12,'font-weight':800,fill:'#718288'},label.toUpperCase()));
      svg.appendChild(feSvgEl('text',{x:x+22,y:y+62,'font-family':'Arial,sans-serif','font-size':28,'font-weight':800,fill:'#275e58'},n));
      const classText=exportHidden('classification',pupil,side)?'?':(isPrime(n)?'Prime number':'Composite · '+factors(n).length+' factors');
      svg.appendChild(feSvgEl('text',{x:x+22,y:y+86,'font-family':'Arial,sans-serif','font-size':13,'font-weight':700,fill:'#60757b'},classText));
      svg.appendChild(feSvgEl('text',{x:x+22,y:y+116,'font-family':'Arial,sans-serif','font-size':11,'font-weight':800,fill:'#718288'},'FACTOR PAIRS'));
      const pairs=factorPairs(n),hideAll=exportHidden('all-pairs',pupil,side);
      pairs.forEach((pair,i)=>{
        const col=i%3,row=Math.floor(i/3),px=x+22+col*((cardW-44)/3),py=y+144+row*34;
        const oneHidden=pupil?challenge?.hiddenPairSide===side&&challenge?.hiddenPairIndex===i:challenge&&!challenge.revealed&&challenge.hiddenPairSide===side&&challenge.hiddenPairIndex===i;
        svg.appendChild(feSvgEl('text',{x:px,y:py,'font-family':'Arial,sans-serif','font-size':15,'font-weight':800,fill:'#304b52','data-fe-export-pair':side+'-'+i},hideAll||oneHidden?pair[0]+' × ?':pairLabel(pair)));
      });
      const pairsRows=Math.max(1,Math.ceil(pairs.length/3)),mY=y+154+pairsRows*34;
      svg.appendChild(feSvgEl('text',{x:x+22,y:mY,'font-family':'Arial,sans-serif','font-size':11,'font-weight':800,fill:'#718288'},'FIRST 12 MULTIPLES'));
      const mult=multiples(n);
      svg.appendChild(feSvgEl('text',{x:x+22,y:mY+25,'font-family':'Arial,sans-serif','font-size':13,'font-weight':700,fill:'#425b62'},mult.join(' · ')));
      svg.appendChild(feSvgEl('text',{x:x+22,y:mY+58,'font-family':'Arial,sans-serif','font-size':11,'font-weight':800,fill:'#718288'},'PRIME FACTORISATION'));
      svg.appendChild(feSvgEl('text',{x:x+22,y:mY+82,'font-family':'Arial,sans-serif','font-size':15,'font-weight':800,fill:'#304b52','data-fe-export-prime':side},exportHidden('prime',pupil,side)?'?':factorisationText(n)));
      svg.appendChild(feSvgEl('text',{x:x+22,y:mY+115,'font-family':'Arial,sans-serif','font-size':11,'font-weight':800,fill:'#718288'},'DIVISIBILITY'));
      DIVISORS.forEach((d,i)=>{
        const dx=x+22+(i%4)*((cardW-44)/4),dy=mY+139+Math.floor(i/4)*27;
        const hide=pupil?challenge?.hiddenDivisor===d&&challenge?.hiddenDivisorSide===side:challenge&&!challenge.revealed&&challenge.hiddenDivisor===d&&challenge.hiddenDivisorSide===side;
        svg.appendChild(feSvgEl('text',{x:dx,y:dy,'font-family':'Arial,sans-serif','font-size':12,'font-weight':700,fill:'#4f666c','data-fe-export-divisor':side+'-'+d},'÷ '+d+': '+(hide?'?':(n%d===0?'Yes':'r '+(n%d)))));
      });
    });
    let lowerY=compare?505:500;
    if(compare){
      const cf=commonFactors(),h=gcd2(a,b),l=lcm2(a,b);
      svg.appendChild(feSvgEl('rect',{x:70,y:lowerY,width:780,height:96,rx:16,fill:'#fff8e8',stroke:'#ead9aa','stroke-width':2,'data-fe-export-common':'1'}));
      svg.appendChild(feSvgEl('text',{x:92,y:lowerY+28,'font-family':'Arial,sans-serif','font-size':12,'font-weight':800,fill:'#78683a'},'COMMON FACTORS'));
      svg.appendChild(feSvgEl('text',{x:92,y:lowerY+55,'font-family':'Arial,sans-serif','font-size':16,'font-weight':800,fill:'#554b30'},exportHidden('hiddenCommonFactors',pupil)?'?':cf.join(', ')));
      svg.appendChild(feSvgEl('text',{x:430,y:lowerY+28,'font-family':'Arial,sans-serif','font-size':12,'font-weight':800,fill:'#78683a'},'HCF'));
      svg.appendChild(feSvgEl('text',{x:430,y:lowerY+55,'font-family':'Arial,sans-serif','font-size':18,'font-weight':800,fill:'#554b30','data-fe-export-hcf':'1'},exportHidden('hiddenHcf',pupil)?'?':h));
      svg.appendChild(feSvgEl('text',{x:635,y:lowerY+28,'font-family':'Arial,sans-serif','font-size':12,'font-weight':800,fill:'#78683a'},'LCM'));
      svg.appendChild(feSvgEl('text',{x:635,y:lowerY+55,'font-family':'Arial,sans-serif','font-size':18,'font-weight':800,fill:'#554b30','data-fe-export-lcm':'1'},exportHidden('hiddenLcm',pupil)?'?':l));
      lowerY+=122;
    }
    const n=currentNumber(),pairs=currentPairs(),pair=pairs[selectedPair]||pairs[0]||[1,n],rows=pair[0],cols=pair[1];
    const ax=190,ay=lowerY+20,aw=540,ah=110;
    const hideSelectedExport=!!(challenge&&(pupil||!challenge.revealed)&&challenge.hiddenPairSide===selectedSide&&challenge.hiddenPairIndex===selectedPair);
    svg.appendChild(feSvgEl('text',{x:width/2,y:lowerY+2,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':13,'font-weight':800,fill:'#718288','data-fe-export-array-label':'1'},'SELECTED FACTOR RECTANGLE · '+rows+' × '+(hideSelectedExport?'?':cols)+' = '+n));
    svg.appendChild(feSvgEl('rect',{x:ax,y:ay,width:aw,height:ah,fill:'#f4faf8',stroke:'#2f7d75','stroke-width':3,'data-fe-export-array':'1'}));
    for(let i=1;i<Math.min(cols,24);i++){const x=ax+aw*i/Math.min(cols,24);svg.appendChild(feSvgEl('line',{x1:x,y1:ay,x2:x,y2:ay+ah,stroke:'#b8d2ce','stroke-width':1}))}
    for(let i=1;i<Math.min(rows,12);i++){const y=ay+ah*i/Math.min(rows,12);svg.appendChild(feSvgEl('line',{x1:ax,y1:y,x2:ax+aw,y2:y,stroke:'#b8d2ce','stroke-width':1}))}
    svg.appendChild(feSvgEl('text',{x:width-46,y:height-18,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return factorExplorerExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(factorExplorerExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Factors & multiples challenge',
      prompt,
      responseLabel:challenge.category==='reason'?'Explain your thinking':'Answer',
      responseLines,
      brand:'99 Club Studio'
    });
  }
  function exportName(){
    const meta=challenge&&CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return exportMode==='challenge'&&challenge?(challenge.title||meta?.title||'factors-multiples-challenge'):(compare?'factors-multiples-comparison':'factors-multiples');
  }
  function exportMessage(text){exportStatus=text;const el=q('#fe-export-status');if(el)el.textContent=text}
  async function exportAction(kind){
    try{
      if(!X)throw new Error('Export tools are not available.');
      const target=exportTargetSvg(),isCard=exportMode==='challenge'&&!!challenge,name=exportName();
      if(kind==='copy'){await X.copyPng(target);exportMessage(isCard?'Challenge copied — paste it into your worksheet, slide or document.':'Factors diagram copied — paste it into your slide or document.')}
      if(kind==='png'){await X.downloadPng(target,name,2);exportMessage(isCard?'Challenge PNG downloaded.':'Factors PNG downloaded.')}
      if(kind==='svg'){X.downloadSvg(target,name);exportMessage(isCard?'Challenge SVG downloaded.':'Factors SVG downloaded.')}
      if(kind==='print'){X.printSvg(target,{title:'',landscape:false});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'That export did not work.')}
  }
  function controlsHtml(){return workflowTabs()+(controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():exploreControlsHtml())}
  function renderControls(){q('#gd-controls').innerHTML=controlsHtml();bindControls()}
  function bindControls(){
    const controls=q('#gd-controls');if(!controls)return;
    qa('[data-fe-workflow]',controls).forEach(button=>button.onclick=()=>{controlTab=button.dataset.feWorkflow;renderControls()});
    if(controlTab==='export'){
      qa('[data-fe-export-mode]',controls).forEach(button=>button.onclick=()=>{exportMode=button.dataset.feExportMode==='challenge'&&challenge?'challenge':'diagram';exportStatus='';renderControls()});
      const response=q('#fe-response-lines',controls);if(response)response.onchange=()=>{responseLines=clamp(Math.round(num(response.value,1)),1,4);renderControls()};
      const copyImage=q('#fe-copy-image',controls);if(copyImage)copyImage.onclick=()=>exportAction('copy');
      const png=q('#fe-png',controls);if(png)png.onclick=()=>exportAction('png');
      const svg=q('#fe-svg-download',controls);if(svg)svg.onclick=()=>exportAction('svg');
      const print=q('#fe-print',controls);if(print)print.onclick=()=>exportAction('print');
      return;
    }
    if(controlTab==='explore'){
      const ai=q('#fe-a');if(ai)ai.onchange=()=>mutate(()=>setA(ai.value));
      const cmp=q('#fe-compare');if(cmp)cmp.onchange=()=>mutate(()=>setCompare(cmp.checked));
      const bi=q('#fe-b');if(bi)bi.onchange=()=>mutate(()=>setB(bi.value));
      const random=q('#fe-random');if(random)random.onclick=()=>mutate(()=>{a=2+Math.floor(Math.random()*143);if(compare)b=2+Math.floor(Math.random()*143);selectedSide='a';selectedPair=0});
      const reset=q('#fe-reset');if(reset)reset.onclick=()=>mutate(()=>{a=36;b=24;compare=false;selectedSide='a';selectedPair=0});
      return;
    }
    if(controlTab!=='challenge')return;
    if(challengeTab==='custom'&&challenge){
      const ai=q('#fe-a');if(ai)ai.onchange=()=>mutate(()=>setA(ai.value));
      const cmp=q('#fe-compare');if(cmp)cmp.onchange=()=>mutate(()=>setCompare(cmp.checked));
      const bi=q('#fe-b');if(bi)bi.onchange=()=>mutate(()=>setB(bi.value));
    }
    qa('[data-fe-challenge-tab]',controls).forEach(button=>button.onclick=()=>{if(button.dataset.feChallengeTab==='custom')enterCustomChallenge();else{challengeTab='standard';renderControls()}});
    qa('[data-fe-challenge-cat]',controls).forEach(button=>button.onclick=()=>{challengeCategory=button.dataset.feChallengeCat;const first=CHALLENGE_TEMPLATES.find(t=>t.category===challengeCategory);if(first)challengeType=first.id;renderControls()});
    qa('[data-fe-challenge-type]',controls).forEach(button=>button.onclick=()=>{challengeType=button.dataset.feChallengeType;renderControls()});
    const gen=q('#fe-generate');if(gen)gen.onclick=()=>generateChallenge(challengeType);
    const edit=q('#fe-edit-challenge');if(edit)edit.onclick=enterCustomChallenge;
    const reveal=q('#fe-reveal');if(reveal)reveal.onclick=()=>{if(challenge){challenge.revealed=!challenge.revealed;renderControls();draw()}};
    const clear=q('#fe-clear-challenge');if(clear)clear.onclick=clearChallenge;
    if(challengeTab==='custom'&&challenge){
      const title=q('#fe-custom-title');if(title)title.oninput=()=>{challenge.title=title.value.slice(0,100);draw()};
      const prompt=q('#fe-custom-prompt');if(prompt)prompt.oninput=()=>{challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);draw()};
      const source=q('#fe-custom-answer-source');if(source)source.onchange=()=>setCustomAnswerSource(source.value);
      const answer=q('#fe-custom-answer');if(answer)answer.oninput=()=>{challenge.answer=answer.value.slice(0,400);challenge.answerMode='manual';challenge.answerSource='';draw()};
      qa('[data-gd-rich-action]',controls).forEach(button=>button.onclick=()=>{CK.applyFormat(prompt,button.dataset.gdRichAction);challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);draw()});
    }
  }

  setPanels(controlsHtml(),'');
  bindControls();
  draw();
  G.lessonState?.register('factors',()=>({diagram:snapshot(),challenge,beforeChallenge,pupil:CK?.capturePupil?.(challenge),controlTab,challengeTab,challengeCategory,challengeType,exportMode,responseLines}),saved=>{
    restore(saved.diagram);challenge=saved.challenge?CK.normalise(saved.challenge):null;beforeChallenge=saved.beforeChallenge||null;
    if(Object.prototype.hasOwnProperty.call(saved,'controlTab'))controlTab=saved.controlTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeTab'))challengeTab=saved.challengeTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeCategory'))challengeCategory=saved.challengeCategory;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeType'))challengeType=saved.challengeType;
    if(Object.prototype.hasOwnProperty.call(saved,'exportMode'))exportMode=saved.exportMode;
    if(Object.prototype.hasOwnProperty.call(saved,'responseLines'))responseLines=saved.responseLines;
    CK?.restorePupil?.(challenge,saved.pupil);renderControls();draw();
  });

}

function fdpExplorer(){
  const CK=G.challengeKit,X=G.exportTools;
  let numerator=3,denominator=8,equivScale=1;
  const undoStack=[],redoStack=[];
  const BENCHMARKS=[
    {label:'0',n:0,d:1},{label:'¼',n:1,d:4},{label:'½',n:1,d:2},{label:'¾',n:3,d:4},{label:'1',n:1,d:1}
  ];
  const CHALLENGE_CATEGORIES=[
    {id:'convert',label:'Convert'},
    {id:'equivalent',label:'Equivalent fractions'},
    {id:'build',label:'Build'},
    {id:'reason',label:'Reasoning'}
  ];
  const CHALLENGE_TEMPLATES=[
    {id:'to-decimal',category:'convert',title:'Fraction to decimal',desc:'Convert the shown fraction to a decimal.'},
    {id:'to-percentage',category:'convert',title:'Fraction to percentage',desc:'Convert the shown fraction to a percentage.'},
    {id:'equivalent-fraction',category:'equivalent',title:'Complete an equivalent fraction',desc:'Find the missing numerator or denominator.'},
    {id:'simplify-fraction',category:'equivalent',title:'Simplify the fraction',desc:'Write the shown fraction in its simplest form.'},
    {id:'build-percentage',category:'build',title:'Build a percentage',desc:'Adjust the fraction until it represents the requested percentage.'},
    {id:'spot-percent-error',category:'reason',title:'Spot the percentage error',desc:'Decide whether a displayed percentage matches the fraction.'}
  ];
  let controlTab='explore',challengeTab='standard',challengeCategory='convert',challengeType='to-decimal',challenge=null,beforeChallenge=null;
  let exportMode='diagram',responseLines=1,exportStatus='';

  function normalise(){
    denominator=clamp(Math.round(Number(denominator)||1),1,20);
    numerator=clamp(Math.round(Number(numerator)||0),0,denominator);
    equivScale=clamp(Math.round(Number(equivScale)||1),1,6);
  }
  function snapshot(){return{numerator,denominator,equivScale}}
  function restore(s){
    numerator=Math.round(Number(s?.numerator)||0);
    denominator=Math.round(Number(s?.denominator)||1);
    equivScale=Math.round(Number(s?.equivScale)||1);
    normalise();
  }
  function remember(){undoStack.push(snapshot());if(undoStack.length>60)undoStack.shift();redoStack.length=0}
  function challengeFrozen(){return !!(challenge&&challenge.mode==='standard'&&(challenge.freezeModel||challenge.revealed))}
  function mutate(fn){if(challengeFrozen())return;remember();fn();normalise();draw();renderControls()}
  function undo(){if(!undoStack.length||challengeFrozen())return;redoStack.push(snapshot());restore(undoStack.pop());draw();renderControls()}
  function redo(){if(!redoStack.length||challengeFrozen())return;undoStack.push(snapshot());restore(redoStack.pop());draw();renderControls()}
  function simplified(){
    if(numerator===0)return{n:0,d:1};
    const g=gcd(numerator,denominator);
    return{n:numerator/g,d:denominator/g};
  }
  function value(){return numerator/denominator}
  function decimalText(){
    const v=value(),fixed=v.toFixed(4);
    return String(Number(fixed));
  }
  function percentValue(){return value()*100}
  function percentText(){
    const p=percentValue();
    return Number.isInteger(p)?String(p):String(Number(p.toFixed(2)));
  }
  function hundredFill(){return Math.round(percentValue())}
  function hundredExact(){return Math.abs(hundredFill()-percentValue())<1e-9}
  function equivalentFamily(){
    const s=simplified(),out=[];
    for(let k=1;k<=6;k++)out.push({n:s.n*k,d:s.d*k,k});
    return out;
  }
  function setBenchmark(n,d){numerator=n;denominator=d;equivScale=1}
  function setDenominator(next){
    const oldValue=value();
    denominator=clamp(Math.round(Number(next)||1),1,20);
    numerator=clamp(Math.round(oldValue*denominator),0,denominator);
    equivScale=1;
  }
  function setNumerator(next){numerator=clamp(Math.round(Number(next)||0),0,denominator);equivScale=1}
  function setEquivalentScale(k){
    equivScale=clamp(Math.round(Number(k)||1),1,6);
    const s=simplified();
    const nd=s.d*equivScale;
    if(nd<=20){numerator=s.n*equivScale;denominator=nd}
    else equivScale=1;
  }
  function barPieces(){
    return Array.from({length:denominator},(_,i)=>{
      const fill=i<numerator;
      return '<button type="button" class="gd-fdp-piece'+(fill?' is-fill':'')+'" data-fd-piece="'+i+'" aria-label="Set numerator to '+(i+1)+' out of '+denominator+'" aria-pressed="'+(fill?'true':'false')+'"'+(challengeFrozen()?' disabled':'')+'><span>'+(i+1)+'</span></button>';
    }).join('');
  }
  function hundredCells(){
    const fills=hundredFill();
    return Array.from({length:100},(_,i)=>'<span class="'+(i<fills?'is-fill':'')+'" data-fd-cell="'+(i+1)+'"></span>').join('');
  }
  function benchmarkHtml(){
    return '<div class="gd-fdp-benchmarks" aria-label="Benchmark fractions">'+BENCHMARKS.map(b=>
      '<button type="button" class="gd-btn" data-fd-benchmark="'+b.n+'/'+b.d+'">'+b.label+'</button>'
    ).join('')+'</div>';
  }
  function equivalentHtml(){
    const current=numerator+'/'+denominator,hide=!!(challenge&&!challenge.revealed&&challenge.hiddenEquivalentFamily);
    return '<div class="gd-fdp-equivalents">'+equivalentFamily().map(item=>{
      const txt=item.n+'/'+item.d,selected=txt===current;
      return '<button type="button" class="gd-fdp-equivalent'+(selected?' is-current':'')+'" data-fd-equiv="'+item.k+'"'+(item.d>20||challengeFrozen()?' disabled':'')+'>'+(hide?'?/?':txt)+'</button>';
    }).join('')+'</div>';
  }
  function togglePercentageReveal(){
    if(!challenge)return;challenge.revealed=!challenge.revealed;
    if(challenge.type==='build-percentage'&&challenge.mode==='standard'){
      if(challenge.revealed){challenge.modelBeforeReveal=snapshot();const match=Array.from({length:20},(_,i)=>i+1).find(d=>Math.abs(challenge.targetPercent*d/100-Math.round(challenge.targetPercent*d/100))<1e-9);if(match)setBenchmark(Math.round(challenge.targetPercent*match/100),match)}
      else if(challenge.modelBeforeReveal){restore(challenge.modelBeforeReveal);delete challenge.modelBeforeReveal}
    }renderControls();draw();
  }
  function bindChallengeStageActions(){
    const endChallenge=q('[data-challenge-action="end"]',q('#gd-stage'));if(endChallenge)endChallenge.onclick=e=>{e.stopPropagation();clearChallenge()};
    const stage=q('#gd-stage');if(!stage||!challenge)return;
    const reveal=q('[data-board-action="reveal"]',stage);if(reveal)reveal.onclick=e=>{e.stopPropagation();togglePercentageReveal()};
    const another=q('[data-challenge-action="another"]',stage);if(another)another.onclick=e=>{e.stopPropagation();if(challenge?.mode==='standard')generateChallenge(challenge.type)};
  }
  function challengeProgress(){
    if(!challenge||challenge.type!=='build-percentage')return'';
    return 'Adjust the fraction, then press Check.';
  }
  function draw(){
    updateChallengeAnswer();
    const s=simplified(),same=s.n===numerator&&s.d===denominator;
    const rounded=hundredFill(),exact=hundredExact(),hidden=challenge&&!challenge.revealed;
    const fractionDisplay=hidden&&challenge.hiddenFraction?'?/?':s.n+'/'+s.d;
    const decimalDisplay=hidden&&challenge.hiddenDecimal?'?':decimalText();
    const percentDisplay=challenge?.mode==='standard'&&challenge.type==='spot-percent-error'&&hidden?challenge.wrongPercent+'%':(hidden&&challenge.hiddenPercent?'?':percentText()+'%');
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Fraction–decimal–percentage challenge',pupil:(challenge.type==='build-percentage'?CK.pupilSpec('model',{check:()=>Math.abs(percentValue()-challenge.targetPercent)<1e-8}):challenge.type==='spot-percent-error'?CK.pupilSpec('choice',{choices:['Yes','No'],expected:challenge.answer.startsWith('Yes')?'Yes':'No',explain:true}):challenge.type==='to-percentage'?CK.pupilSpec('unit',{unit:'%'}):CK.pupilSpec(challenge.type==='simplify-fraction'?'fraction-form':'number')),actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'},{action:'end',label:'Back to setup'}]:[{action:'end',label:'End challenge'}]}):'';
    const focused=challenge?.mode==='standard'&&!challenge.revealed,build=focused&&challenge.type==='build-percentage';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-fdp-main'+(focused?' is-focused-challenge':'')+'">'+
      (focused?'':'<div class="gd-fdp-summary"><div><span>Fraction value</span><strong data-fd-source>'+(hidden&&challenge.hiddenSource?'?/?':numerator+'/'+denominator)+'</strong></div>'+
        '<div class="gd-object-toolbar"><button class="gd-btn" id="fd-undo" type="button"'+(undoStack.length&&!challengeFrozen()?'':' disabled')+'>Undo</button><button class="gd-btn" id="fd-redo" type="button"'+(redoStack.length&&!challengeFrozen()?'':' disabled')+'>Redo</button></div></div>')+
      (!challengeFrozen()?'<div class="gd-fdp-direct">'+
        '<div class="gd-fdp-stepper"><span>Numerator</span><div><button class="gd-btn" id="fd-n-minus" type="button"'+(numerator<=0?' disabled':'')+'>−</button><strong data-fd-numerator>'+numerator+'</strong><button class="gd-btn" id="fd-n-plus" type="button"'+(numerator>=denominator?' disabled':'')+'>+</button></div></div>'+
        '<div class="gd-fdp-stepper"><span>Denominator</span><div><button class="gd-btn" id="fd-d-minus" type="button"'+(denominator<=1?' disabled':'')+'>−</button><strong data-fd-denominator>'+denominator+'</strong><button class="gd-btn" id="fd-d-plus" type="button"'+(denominator>=20?' disabled':'')+'>+</button></div></div>'+
      '</div>':'')+
      '<div class="gd-fdp-section"><div class="gd-fdp-section-head"><div><span>Fraction bar</span><strong>'+numerator+' of '+denominator+' equal parts</strong></div><small>'+(challengeFrozen()?'Use the model to reason about the value.':'Tap a part to set the numerator.')+'</small></div>'+
        '<div class="gd-fdp-bar" style="--fd-denominator:'+denominator+'">'+barPieces()+'</div></div>'+
      (focused?(build?'':challenge.type==='spot-percent-error'?'<div class="gd-fdp-question-value">'+percentDisplay+'</div>':''):'<div class="gd-fdp-readout">'+
        '<div class="gd-fdp-value"><span>fraction</span><strong data-fd-fraction>'+fractionDisplay+'</strong><small>'+(hidden&&challenge.hiddenFraction?'simplified form hidden':(same?'already simplified':'simplified from '+numerator+'/'+denominator))+'</small></div>'+
        '<div class="gd-fdp-value"><span>decimal</span><strong data-fd-decimal>'+decimalDisplay+'</strong><small>same value</small></div>'+
        '<div class="gd-fdp-value"><span>percentage</span><strong data-fd-percent>'+percentDisplay+'</strong><small>same value</small></div>'+
      '</div>'+
      '<div class="gd-fdp-section"><div class="gd-fdp-section-head"><div><span>Equivalent fractions</span><strong>Same amount, different-sized parts</strong></div></div>'+equivalentHtml()+'</div>')+
      (focused||hidden&&challenge.hiddenHundred?'':'<div class="gd-fdp-section"><div class="gd-fdp-section-head"><div><span>Hundred square</span><strong data-fd-hundred-label>'+rounded+' of 100 cells</strong></div><small>'+(exact?'Exact match':'Rounded from '+percentText()+'% to the nearest whole cell')+'</small></div>'+
        '<div class="gd-hundred" data-fd-hundred-exact="'+(exact?'true':'false')+'">'+hundredCells()+'</div></div>')+
      
    '</div>';
    bindStage();bindChallengeStageActions();
  }
  function bindStage(){
    qa('[data-fd-piece]',q('#gd-stage')).forEach(button=>button.onclick=()=>{if(!challengeFrozen())mutate(()=>setNumerator(Number(button.dataset.fdPiece)+1))});
    const nm=q('#fd-n-minus');if(nm)nm.onclick=()=>mutate(()=>setNumerator(numerator-1));
    const np=q('#fd-n-plus');if(np)np.onclick=()=>mutate(()=>setNumerator(numerator+1));
    const dm=q('#fd-d-minus');if(dm)dm.onclick=()=>mutate(()=>setDenominator(denominator-1));
    const dp=q('#fd-d-plus');if(dp)dp.onclick=()=>mutate(()=>setDenominator(denominator+1));
    qa('[data-fd-equiv]',q('#gd-stage')).forEach(button=>button.onclick=()=>{if(!button.disabled)mutate(()=>setEquivalentScale(Number(button.dataset.fdEquiv)))});
    const u=q('#fd-undo');if(u)u.onclick=undo;
    const r=q('#fd-redo');if(r)r.onclick=redo;
  }
  function workflowTabs(){
    return '<div class="gd-row gd-fdp-workflow-tabs" role="tablist" aria-label="FDP Explorer workflow">'+
      '<button class="gd-btn'+(controlTab==='explore'?' gd-btn--primary':'')+'" type="button" data-fd-workflow="explore">Explore</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-fd-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-fd-workflow="export">Export / reuse</button></div>';
  }
  function modelControlsHtml(){
    return field('Quick fraction','<div class="gd-row"><label class="gd-tv-quick"><span>Numerator</span><input class="gd-input gd-small" id="fd-n" type="number" min="0" max="'+denominator+'" value="'+numerator+'"></label><span>/</span><label class="gd-tv-quick"><span>Denominator</span><input class="gd-input gd-small" id="fd-d" type="number" min="1" max="20" value="'+denominator+'"></label></div>')+
      field('Benchmarks',benchmarkHtml(),'Jump to useful reference values without losing the link between fraction, decimal and percentage.');
  }
  function exploreControlsHtml(){
    return modelControlsHtml()+
      '<div class="gd-row"><button class="gd-btn" id="fd-random" type="button">Random fraction</button><button class="gd-btn" id="fd-reset" type="button">Reset 3/8</button></div>'+
      '<p class="gd-help">Change the fraction directly on the bar or with the steppers. Changing the denominator preserves the value as closely as that denominator allows; equivalent-fraction buttons preserve it exactly.</p>';
  }
  function challengeObject(type,prompt,answer,extra={}){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);
    const raw={mode:'standard',type,category:meta?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),answerMode:'manual',answerSource:'',revealed:false,freezeModel:true,hiddenSource:false,hiddenFraction:false,hiddenDecimal:false,hiddenPercent:false,hiddenHundred:false,hiddenEquivalentFamily:false,targetPercent:null,wrongPercent:null,...extra};
    return CK?CK.normalise(raw):raw;
  }
  function resolveAnswerSource(source){
    const s=simplified();
    if(source==='fraction')return s.n+'/'+s.d;
    if(source==='source-fraction')return numerator+'/'+denominator;
    if(source==='decimal')return decimalText();
    if(source==='percentage')return percentText()+'%';
    return'';
  }
  function customAnswerSources(){
    return[
      {id:'fraction',label:'Simplified fraction'},
      {id:'source-fraction',label:'Displayed fraction'},
      {id:'decimal',label:'Decimal'},
      {id:'percentage',label:'Percentage'}
    ];
  }
  function clearBoundHiding(){
    if(!challenge)return;
    challenge.hiddenSource=false;challenge.hiddenFraction=false;challenge.hiddenDecimal=false;challenge.hiddenPercent=false;challenge.hiddenHundred=false;challenge.hiddenEquivalentFamily=false;
  }
  function applyBoundHiding(source){
    clearBoundHiding();if(!challenge)return;
    if(source==='fraction'){challenge.hiddenFraction=true;challenge.hiddenEquivalentFamily=true;const s=simplified();if(s.n===numerator&&s.d===denominator)challenge.hiddenSource=true}
    if(source==='source-fraction')challenge.hiddenSource=true
    if(source==='decimal'){challenge.hiddenDecimal=true;challenge.hiddenPercent=true;challenge.hiddenHundred=true}
    if(source==='percentage'){challenge.hiddenPercent=true;challenge.hiddenDecimal=true;challenge.hiddenHundred=true}
  }
  function updateChallengeAnswer(){
    if(!challenge||challenge.answerMode!=='bound'||!challenge.answerSource)return;
    const answer=resolveAnswerSource(challenge.answerSource);if(answer!=='')challenge.answer=answer;
    const live=q('#fd-custom-live-answer');if(live)live.textContent=challenge.answer||'—';
    if(challenge.revealed){const shown=q('.gd-challenge-actions em',q('#gd-stage'));if(shown)shown.textContent='Answer: '+challenge.answer}
  }
  function generateChallenge(type){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!meta)return;
    if(!beforeChallenge)beforeChallenge=snapshot();else restore(beforeChallenge);
    undoStack.length=0;redoStack.length=0;equivScale=1;
    let variantKey='';
    const pick=list=>{const v=CK.pickVariant(list,challenge?.type===type?challenge.variantKey:'');variantKey=JSON.stringify(v);return v};
    if(type==='to-decimal'){
      [numerator,denominator]=pick([[3,8],[1,4],[3,5],[7,10],[5,8],[9,20],[1,8],[3,4]]);
      challenge=challengeObject(type,'Write '+numerator+'/'+denominator+' as a decimal.',decimalText(),{hiddenDecimal:true,hiddenPercent:true,hiddenHundred:true});
    }else if(type==='to-percentage'){
      [numerator,denominator]=pick([[3,5],[1,4],[7,10],[3,8],[4,5],[9,20],[5,8]]);
      challenge=challengeObject(type,'Write '+numerator+'/'+denominator+' as a percentage.',percentText()+'%',{hiddenDecimal:true,hiddenPercent:true,hiddenHundred:true});
    }else if(type==='equivalent-fraction'){
      const [n,d,k]=pick([[3,4,2],[2,3,3],[1,5,4],[3,5,2],[2,7,2],[5,6,3]]);
      numerator=n;denominator=d;
      challenge=challengeObject(type,'Complete the equivalent fraction: '+n+'/'+d+' = '+n*k+'/?.',String(d*k),{hiddenEquivalentFamily:true});
    }else if(type==='simplify-fraction'){
      [numerator,denominator]=pick([[6,8],[4,6],[8,12],[10,15],[6,10],[9,12],[12,16],[15,20]]);
      const f=simplified();challenge=challengeObject(type,'Write '+numerator+'/'+denominator+' in its simplest form.',f.n+'/'+f.d,{hiddenFraction:true,hiddenEquivalentFamily:true});
    }else if(type==='build-percentage'){
      const [n,d]=pick([[3,4],[1,4],[2,5],[4,5],[3,5],[1,5],[7,10],[3,8]]);
      const targetPercent=n/d*100;numerator=1;denominator=2;
      challenge=challengeObject(type,'Change the model until it represents '+targetPercent+'%.',n+'/'+d+' = '+targetPercent+'%',{freezeModel:false,targetPercent,targetNumerator:n,targetDenominator:d});
    }else{
      const [n,d,wrong]=pick([[2,5,45],[1,4,20],[3,4,70],[3,5,65],[1,5,25],[7,10,75]]);
      numerator=n;denominator=d;const valid=Math.random()<.5,shown=valid?percentValue():wrong;
      challenge=challengeObject(type,'The percentage shown is '+shown+'%. Is that correct? Explain.',valid?'Yes. '+n+'/'+d+' = '+percentText()+'%.':'No. '+n+'/'+d+' = '+percentText()+'%, not '+shown+'%.',{wrongPercent:shown,hiddenDecimal:true,hiddenHundred:true});
    }
    challenge.variantKey=variantKey;
    challenge.initialState=snapshot();
    challengeType=type;challengeCategory=meta.category;challengeTab='standard';controlTab='challenge';exportMode='challenge';responseLines=meta.category==='reason'?3:1;exportStatus='';renderControls();draw();
  }
  function enterCustomChallenge(){
    if(!beforeChallenge)beforeChallenge=snapshot();
    if(CK)challenge=CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''});
    challenge.mode='custom';challenge.freezeModel=false;challenge.revealed=false;challengeTab='custom';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();draw();
  }
  function setCustomAnswerSource(source){
    if(!challenge||challenge.mode!=='custom')return;
    if(source==='manual'){challenge.answerMode='manual';challenge.answerSource='';clearBoundHiding()}
    else if(source==='generated'){challenge.answerMode='bound';challenge.answerSource='';clearBoundHiding()}
    else{challenge.answerMode='bound';challenge.answerSource=source;challenge.answer=resolveAnswerSource(source);applyBoundHiding(source)}
    challenge.revealed=false;renderControls();draw();
  }
  function clearChallenge(){
    if(beforeChallenge){restore(beforeChallenge);beforeChallenge=null}
    challenge=null;challengeTab='standard';controlTab='challenge';undoStack.length=0;redoStack.length=0;renderControls();draw();
  }
  function challengeControlsHtml(){
    if(!CK)return'<p class="gd-help">Challenge tools are unavailable.</p>';
    const tabs=CK.tabsHtml?CK.tabsHtml('fd',challengeTab):'';
    if(challengeTab==='custom'){
      const custom=challenge&&challenge.mode==='custom'?challenge:CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual'});
      return tabs+CK.editorHtml(custom,'fd',{answerSources:customAnswerSources(),generatedAnswerLabel:'Keep the generated answer'})+
        modelControlsHtml()+
        '<div class="gd-row">'+(challenge&&challenge.answer?'<button class="gd-btn" id="fd-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
        (challenge?'<button class="gd-btn" id="fd-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
        '<p class="gd-help">Custom answers can follow the simplified fraction, displayed fraction, decimal or percentage as the model changes.</p>';
    }
    const picker=CK.pickerHtml(CHALLENGE_TEMPLATES,CHALLENGE_CATEGORIES,challengeCategory,challengeType,'fd');
    const repeat=!!(challenge&&challenge.mode==='standard'&&challenge.type===challengeType);
    return tabs+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="fd-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
      (challenge&&challenge.mode!=='custom'?'<button class="gd-btn" id="fd-edit-challenge" type="button">Edit challenge</button>':'')+
      (challenge&&challenge.answer?'<button class="gd-btn" id="fd-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
      (challenge?'<button class="gd-btn" id="fd-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
      (!challengeFrozen()&&challenge?.type==='build-percentage'?modelControlsHtml():'');
  }
  function exportControlsHtml(){
    const canCard=!!challenge;
    if(!canCard&&exportMode==='challenge')exportMode='diagram';
    return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export the linked fraction, decimal and percentage model or a pupil-ready challenge card.</span></div></div>'+
      (canCard?'<div class="nl-export-mode fd-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-fd-export-mode="challenge">Challenge card</button>'+
        '<button type="button" class="'+(exportMode==='diagram'?'is-active':'')+'" data-fd-export-mode="diagram">Diagram only</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="fd-response-lines">'+
          [1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+
          '</select></label><p class="gd-help">Pupil cards restore the original challenge state and keep hidden representations hidden even after Reveal answer or teacher testing.</p>'
        :'<p class="gd-help">Diagram-only export contains the current fraction bar, equivalent values and hundred-square representation without editing controls.</p>')+
      '<div class="nl-export-grid fd-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="fd-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'challenge':'image')+'</button>'+
        '<button class="gd-btn" id="fd-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="fd-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="fd-print" type="button">Print / PDF</button>'+
      '</div><p class="gd-help" id="fd-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }
  function fdSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function exportState(pupil=false){
    return pupil&&challenge?.mode==='standard'&&challenge.initialState?{...challenge.initialState}:snapshot();
  }
  function exportHidden(key,pupil=false){
    if(!challenge)return false;
    return pupil?!!challenge[key]:challenge&&!challenge.revealed&&!!challenge[key];
  }
  function stateSimplified(state){
    if(state.numerator===0)return{n:0,d:1};
    const g=gcd(state.numerator,state.denominator);
    return{n:state.numerator/g,d:state.denominator/g};
  }
  function stateValue(state){return state.numerator/state.denominator}
  function stateDecimal(state){return String(Number(stateValue(state).toFixed(4)))}
  function statePercent(state){
    const p=stateValue(state)*100;
    return Number.isInteger(p)?String(p):String(Number(p.toFixed(2)));
  }
  function stateHundredFill(state){return Math.round(stateValue(state)*100)}
  function fdpExportSvg({pupil=false}={}){
    if(pupil&&challenge?.type==='build-percentage'){
      const divisions=Array.from({length:20},(_,i)=>i+1).find(d=>Math.abs(challenge.targetPercent*d/100-Math.round(challenge.targetPercent*d/100))<1e-8)||20;
      const svg=fdSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 920 210',role:'img','aria-label':'Blank fraction bar to shade'});
      svg.appendChild(fdSvgEl('rect',{x:0,y:0,width:920,height:210,fill:'#ffffff'}));
      for(let i=0;i<divisions;i++)svg.appendChild(fdSvgEl('rect',{x:70+i*780/divisions,y:65,width:780/divisions,height:85,fill:'#ffffff',stroke:'#526b70','stroke-width':2}));
      return svg;
    }
    const state=exportState(pupil),s=stateSimplified(state),v=stateValue(state),pct=statePercent(state),fill=stateHundredFill(state);
    const focused=pupil&&challenge?.mode==='standard';
    const width=920,height=focused?(challenge.type==='spot-percent-error'?280:235):760,pad=70,barY=115,barH=82,barW=width-2*pad;
    const svg=fdSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Fraction decimal percentage model','data-fd-export':'diagram'});
    svg.appendChild(fdSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(fdSvgEl('text',{x:width/2,y:48,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':26,'font-weight':800,fill:'#304b52'},'Fraction · Decimal · Percentage'));
    const sourceHidden=exportHidden('hiddenSource',pupil);
    svg.appendChild(fdSvgEl('text',{x:width/2,y:82,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':20,'font-weight':800,fill:'#2f625d','data-fd-export-source':'1'},sourceHidden?'?/?':state.numerator+'/'+state.denominator));
    const pieceW=barW/state.denominator;
    for(let i=0;i<state.denominator;i++){
      svg.appendChild(fdSvgEl('rect',{x:pad+i*pieceW,y:barY,width:pieceW,height:barH,fill:i<state.numerator?'#f6cf79':'#ffffff',stroke:'#6d858a','stroke-width':1,'data-fd-export-piece':i}));
    }
    svg.appendChild(fdSvgEl('rect',{x:pad,y:barY,width:barW,height:barH,fill:'none',stroke:'#536c72','stroke-width':3}));
    if(focused){if(challenge.type==='spot-percent-error')svg.appendChild(fdSvgEl('text',{x:width/2,y:246,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':24,'font-weight':800,fill:'#304b52'},challenge.wrongPercent+'%'));return svg}
    const boxes=[
      {x:80,label:'FRACTION',value:exportHidden('hiddenFraction',pupil)?'?/?':s.n+'/'+s.d,key:'fraction'},
      {x:335,label:'DECIMAL',value:exportHidden('hiddenDecimal',pupil)?'?':stateDecimal(state),key:'decimal'},
      {x:590,label:'PERCENTAGE',value:(challenge?.mode==='standard'&&challenge.type==='spot-percent-error'&&(pupil||!challenge.revealed))?challenge.wrongPercent+'%':(exportHidden('hiddenPercent',pupil)?'?':pct+'%'),key:'percent'}
    ];
    boxes.forEach(box=>{
      svg.appendChild(fdSvgEl('rect',{x:box.x,y:235,width:250,height:105,rx:16,fill:'#f5f8f8',stroke:'#d3dfe1','stroke-width':2}));
      svg.appendChild(fdSvgEl('text',{x:box.x+125,y:267,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':12,'font-weight':800,fill:'#718288'},box.label));
      const valueAttrs={x:box.x+125,y:310,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':25,'font-weight':800,fill:'#304b52'};
      valueAttrs['data-fd-export-'+box.key]='1';
      svg.appendChild(fdSvgEl('text',valueAttrs,box.value));
    });
    svg.appendChild(fdSvgEl('text',{x:80,y:385,'font-family':'Arial,sans-serif','font-size':12,'font-weight':800,fill:'#718288'},'EQUIVALENT FRACTIONS'));
    const hideEq=exportHidden('hiddenEquivalentFamily',pupil);
    const eq=[];
    for(let k=1;k<=6;k++)if(s.d*k<=20)eq.push(hideEq?'?/?':(s.n*k)+'/'+(s.d*k));
    svg.appendChild(fdSvgEl('text',{x:80,y:417,'font-family':'Arial,sans-serif','font-size':17,'font-weight':800,fill:'#405b64','data-fd-export-equivalents':'1'},eq.join('   ')));
    const hideHundred=exportHidden('hiddenHundred',pupil);
    if(!hideHundred){
      const gridX=210,gridY=465,cell=25;
      svg.appendChild(fdSvgEl('text',{x:width/2,y:450,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':12,'font-weight':800,fill:'#718288'},'HUNDRED SQUARE · '+fill+' OF 100 CELLS'));
      for(let i=0;i<100;i++){
        const col=i%10,row=Math.floor(i/10);
        svg.appendChild(fdSvgEl('rect',{x:gridX+col*cell,y:gridY+row*cell,width:cell-2,height:cell-2,fill:i<fill?'#2f7d75':'#ffffff',stroke:'#d4dee0','stroke-width':1,'data-fd-export-cell':i+1}));
      }
    }else{
      svg.appendChild(fdSvgEl('text',{x:width/2,y:520,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':16,'font-weight':800,fill:'#89989b','data-fd-export-hundred-hidden':'1'},'Hundred-square representation hidden'));
    }
    svg.appendChild(fdSvgEl('text',{x:width-46,y:height-18,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return fdpExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(fdpExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Fraction–decimal–percentage challenge',
      prompt:challenge.type==='build-percentage'?'Shade '+challenge.targetPercent+'% of the bar.':prompt,
      responseLabel:challenge.category==='reason'?'Explain your thinking':'Answer',
      responseLines,
      brand:'99 Club Studio'
    });
  }
  function exportName(){
    const meta=challenge&&CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return exportMode==='challenge'&&challenge?(challenge.title||meta?.title||'fdp-challenge'):'fraction-decimal-percentage';
  }
  function exportMessage(text){exportStatus=text;const el=q('#fd-export-status');if(el)el.textContent=text}
  async function exportAction(kind){
    try{
      if(!X)throw new Error('Export tools are not available.');
      const target=exportTargetSvg(),isCard=exportMode==='challenge'&&!!challenge,name=exportName();
      if(kind==='copy'){await X.copyPng(target);exportMessage(isCard?'Challenge copied — paste it into your worksheet, slide or document.':'FDP model copied — paste it into your slide or document.')}
      if(kind==='png'){await X.downloadPng(target,name,2);exportMessage(isCard?'Challenge PNG downloaded.':'FDP PNG downloaded.')}
      if(kind==='svg'){X.downloadSvg(target,name);exportMessage(isCard?'Challenge SVG downloaded.':'FDP SVG downloaded.')}
      if(kind==='print'){X.printSvg(target,{title:'',landscape:false});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'That export did not work.')}
  }
  function controlsHtml(){return workflowTabs()+(controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():exploreControlsHtml())}
  function renderControls(){q('#gd-controls').innerHTML=controlsHtml();bindControls()}
  function bindControls(){
    const controls=q('#gd-controls');if(!controls)return;
    qa('[data-fd-workflow]',controls).forEach(button=>button.onclick=()=>{controlTab=button.dataset.fdWorkflow;renderControls()});
    if(controlTab==='export'){
      qa('[data-fd-export-mode]',controls).forEach(button=>button.onclick=()=>{exportMode=button.dataset.fdExportMode==='challenge'&&challenge?'challenge':'diagram';exportStatus='';renderControls()});
      const response=q('#fd-response-lines',controls);if(response)response.onchange=()=>{responseLines=clamp(Math.round(num(response.value,1)),1,4);renderControls()};
      const copy=q('#fd-copy-image',controls);if(copy)copy.onclick=()=>exportAction('copy');
      const png=q('#fd-png',controls);if(png)png.onclick=()=>exportAction('png');
      const svg=q('#fd-svg-download',controls);if(svg)svg.onclick=()=>exportAction('svg');
      const print=q('#fd-print',controls);if(print)print.onclick=()=>exportAction('print');
      return;
    }
    function bindModel(){
      const n=q('#fd-n');if(n)n.onchange=()=>mutate(()=>{const requested=clamp(Math.round(Number(n.value)||0),0,20);if(requested>denominator)denominator=requested;numerator=requested;equivScale=1});
      const d=q('#fd-d');if(d)d.onchange=()=>mutate(()=>{denominator=clamp(Math.round(Number(d.value)||1),1,20);numerator=clamp(numerator,0,denominator);equivScale=1});
      qa('[data-fd-benchmark]',controls).forEach(button=>button.onclick=()=>{const [bn,bd]=button.dataset.fdBenchmark.split('/').map(Number);mutate(()=>setBenchmark(bn,bd))});
    }
    if(controlTab==='explore'){
      bindModel();
      const random=q('#fd-random');if(random)random.onclick=()=>mutate(()=>{denominator=2+Math.floor(Math.random()*11);numerator=Math.floor(Math.random()*(denominator+1));equivScale=1});
      const reset=q('#fd-reset');if(reset)reset.onclick=()=>mutate(()=>{numerator=3;denominator=8;equivScale=1});
      return;
    }
    if(controlTab!=='challenge')return;
    if(challengeTab==='custom'&&challenge)bindModel();
    if(challenge?.type==='build-percentage'&&!challengeFrozen())bindModel();
    qa('[data-fd-challenge-tab]',controls).forEach(button=>button.onclick=()=>{if(button.dataset.fdChallengeTab==='custom')enterCustomChallenge();else{challengeTab='standard';renderControls()}});
    qa('[data-fd-challenge-cat]',controls).forEach(button=>button.onclick=()=>{challengeCategory=button.dataset.fdChallengeCat;const first=CHALLENGE_TEMPLATES.find(t=>t.category===challengeCategory);if(first)challengeType=first.id;renderControls()});
    qa('[data-fd-challenge-type]',controls).forEach(button=>button.onclick=()=>{challengeType=button.dataset.fdChallengeType;renderControls()});
    const gen=q('#fd-generate');if(gen)gen.onclick=()=>generateChallenge(challengeType);
    const edit=q('#fd-edit-challenge');if(edit)edit.onclick=enterCustomChallenge;
    const reveal=q('#fd-reveal');if(reveal)reveal.onclick=togglePercentageReveal;
    const clear=q('#fd-clear-challenge');if(clear)clear.onclick=clearChallenge;
    if(challengeTab==='custom'&&challenge){
      const title=q('#fd-custom-title');if(title)title.oninput=()=>{challenge.title=title.value.slice(0,100);draw()};
      const prompt=q('#fd-custom-prompt');if(prompt)prompt.oninput=()=>{challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);draw()};
      const source=q('#fd-custom-answer-source');if(source)source.onchange=()=>setCustomAnswerSource(source.value);
      const answer=q('#fd-custom-answer');if(answer)answer.oninput=()=>{challenge.answer=answer.value.slice(0,400);challenge.answerMode='manual';challenge.answerSource='';draw()};
      qa('[data-gd-rich-action]',controls).forEach(button=>button.onclick=()=>{CK.applyFormat(prompt,button.dataset.gdRichAction);challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);draw()});
    }
  }

  setPanels(controlsHtml(),'');
  bindControls();
  draw();
  G.lessonState?.register('fdp',()=>({diagram:snapshot(),challenge,beforeChallenge,pupil:CK?.capturePupil?.(challenge),controlTab,challengeTab,challengeCategory,challengeType,exportMode,responseLines}),saved=>{
    restore(saved.diagram);challenge=saved.challenge?CK.normalise(saved.challenge):null;beforeChallenge=saved.beforeChallenge||null;
    if(Object.prototype.hasOwnProperty.call(saved,'controlTab'))controlTab=saved.controlTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeTab'))challengeTab=saved.challengeTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeCategory'))challengeCategory=saved.challengeCategory;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeType'))challengeType=saved.challengeType;
    if(Object.prototype.hasOwnProperty.call(saved,'exportMode'))exportMode=saved.exportMode;
    if(Object.prototype.hasOwnProperty.call(saved,'responseLines'))responseLines=saved.responseLines;
    CK?.restorePupil?.(challenge,saved.pupil);renderControls();draw();
  });

}

function geoboard(){
  const CK=G.challengeKit,X=G.exportTools;
  let pts=[],selected=-1,drag=null;
  const undoStack=[],redoStack=[];
  const N=7,W=560,pad=55,step=(W-2*pad)/(N-1);
  const CHALLENGE_CATEGORIES=[
    {id:'measure',label:'Measure'},
    {id:'construct',label:'Build'},
    {id:'reason',label:'Reasoning'}
  ];
  const CHALLENGE_TEMPLATES=[
    {id:'find-length',category:'measure',title:'Find the length',desc:'Measure the distance between two pegs.'},
    {id:'find-perimeter',category:'measure',title:'Find the perimeter',desc:'Work out the perimeter of the shown shape.'},
    {id:'find-area',category:'measure',title:'Find the area',desc:'Work out the area enclosed by the shown shape.'},
    {id:'perimeter-area',category:'measure',title:'Perimeter and area',desc:'Find both measurements from one shape.'},
    {id:'build-area',category:'construct',title:'Build a target area',desc:'Create any polygon with the requested area.'},
    {id:'area-perimeter-units',category:'reason',title:'Same number, same measure?',desc:'Reason about area and perimeter when their numerical values match.'}
  ];
  let controlTab='explore',challengeTab='standard',challengeCategory='measure',challengeType='find-length',challenge=null,beforeChallenge=null;
  let exportMode='diagram',responseLines=1,exportStatus='';

  function shapeFrozen(){return !!(challenge?.mode==='standard'&&(challenge.type!=='build-area'||challenge.revealed))}
  function copyPts(value=pts){return value.map(p=>({x:p.x,y:p.y}))}
  function remember(snapshot=copyPts()){
    undoStack.push(copyPts(snapshot));
    if(undoStack.length>40)undoStack.shift();
    redoStack.length=0;
  }
  function undo(){
    if(shapeFrozen()||!undoStack.length)return;
    redoStack.push(copyPts());
    pts=copyPts(undoStack.pop());
    selected=-1;
    draw();
  }
  function redo(){
    if(shapeFrozen()||!redoStack.length)return;
    undoStack.push(copyPts());
    pts=copyPts(redoStack.pop());
    selected=-1;
    draw();
  }
  function area(){
    if(pts.length<3)return 0;
    let a=0;
    for(let i=0;i<pts.length;i++){
      const p=pts[i],n=pts[(i+1)%pts.length];
      a+=p.x*n.y-n.x*p.y;
    }
    return Math.abs(a)/2;
  }
  function segmentLength(){
    return pts.length===2?Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y):0;
  }
  function perimeter(){
    if(pts.length<3)return 0;
    let p=0;
    for(let i=0;i<pts.length;i++){
      const a=pts[i],b=pts[(i+1)%pts.length];
      p+=Math.hypot(a.x-b.x,a.y-b.y);
    }
    return p;
  }
  function cleanMetric(v){const n=Math.round((Number(v)||0)*100)/100;return Math.abs(n-Math.round(n))<1e-9?String(Math.round(n)):n.toFixed(2)}
  function teachingSnapshot(){return{pts:copyPts(),selected}}
  function restoreTeachingSnapshot(value){
    if(!value)return;
    pts=copyPts(Array.isArray(value.pts)?value.pts:[]);
    selected=Number.isInteger(value.selected)&&value.selected>=0&&value.selected<pts.length?value.selected:-1;
    undoStack.length=0;redoStack.length=0;
  }
  function metricHidden(kind){
    return !!(challenge&&!challenge.revealed&&Array.isArray(challenge.hiddenMetrics)&&challenge.hiddenMetrics.includes(kind));
  }
  function resolveAnswerSource(source){
    if(source==='vertices')return String(pts.length);
    if(source==='length'&&pts.length===2)return cleanMetric(segmentLength())+' units';
    if(source==='perimeter'&&pts.length>=3)return cleanMetric(perimeter())+' units';
    if(source==='area'&&pts.length>=3)return cleanMetric(area())+' square units';
    if(source==='perimeter-area'&&pts.length>=3)return 'Perimeter '+cleanMetric(perimeter())+' units; area '+cleanMetric(area())+' square units';
    return'';
  }
  function customAnswerSources(){
    return[
      {id:'length',label:'Current segment length'},
      {id:'perimeter',label:'Current shape perimeter'},
      {id:'area',label:'Current shape area'},
      {id:'perimeter-area',label:'Current perimeter and area'},
      {id:'vertices',label:'Number of vertices'}
    ];
  }
  function clearBoundHiding(){if(challenge)challenge.hiddenMetrics=[]}
  function applyBoundHiding(source){
    clearBoundHiding();if(!challenge)return;
    if(source==='perimeter-area')challenge.hiddenMetrics=['perimeter','area'];
    else if(['length','perimeter','area','vertices'].includes(source))challenge.hiddenMetrics=[source];
  }
  function updateChallengeAnswer(){
    if(!challenge||challenge.answerMode!=='bound'||!challenge.answerSource)return;
    const answer=resolveAnswerSource(challenge.answerSource);if(answer)challenge.answer=answer;
    const live=q('#ge-custom-live-answer');if(live)live.textContent=challenge.answer||'—';
    if(challenge.revealed){
      const shown=q('.gd-challenge-actions em',q('#gd-stage'));
      if(shown)shown.textContent='Answer: '+challenge.answer;
    }
  }
  function challengeObject(type,prompt,answer,extra={}){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);
    const raw={mode:'standard',type,category:meta?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),answerMode:'bound',answerSource:'',revealed:false,hiddenMetrics:[],...extra};
    return CK?CK.normalise(raw):raw;
  }
  function workflowTabs(){
    return '<div class="gd-row gd-ge-workflow-tabs" role="tablist" aria-label="Geoboard workflow">'+
      '<button class="gd-btn'+(controlTab==='explore'?' gd-btn--primary':'')+'" type="button" data-ge-workflow="explore">Explore</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-ge-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-ge-workflow="export">Export / reuse</button></div>';
  }
  function exploreControlsHtml(){
    return '<div class="gd-row">'+btn('Undo','ge-undo')+btn('Redo','ge-redo')+btn('Clear shape','ge-clear')+'</div>'+
      '<p class="gd-help">Tap pegs in order to make a shape. Then drag any vertex to another peg instead of rebuilding the polygon. With two vertices the tool shows segment length; with three or more it shows perimeter and area.</p>';
  }
  function challengeControlsHtml(){
    if(!CK)return '<p class="gd-help">Challenge tools are unavailable.</p>';
    const tabs=CK.tabsHtml?CK.tabsHtml('ge',challengeTab):'';
    if(challengeTab==='custom'){
      const custom=challenge&&challenge.mode==='custom'?challenge:CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual'});
      return tabs+CK.editorHtml(custom,'ge',{answerSources:customAnswerSources(),generatedAnswerLabel:'Keep the generated answer'})+
        '<div class="gd-row">'+(challenge&&challenge.answer?'<button class="gd-btn" id="ge-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
        (challenge?'<button class="gd-btn" id="ge-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
        '<div class="gd-row">'+btn('Undo','ge-undo')+btn('Redo','ge-redo')+'</div>'+
        '<p class="gd-help">Custom challenges stay attached to the live geoboard. Bind an answer to length, perimeter, area or vertex count when you want it to update as the shape changes.</p>';
    }
    const picker=CK.pickerHtml(CHALLENGE_TEMPLATES,CHALLENGE_CATEGORIES,challengeCategory,challengeType,'ge');
    const repeat=!!(challenge&&challenge.mode==='standard'&&challenge.type===challengeType);
    return tabs+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="ge-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
      (challenge&&challenge.mode!=='custom'?'<button class="gd-btn" id="ge-edit-challenge" type="button">Edit challenge</button>':'')+
      (challenge&&challenge.answer?'<button class="gd-btn" id="ge-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
      (challenge?'<button class="gd-btn" id="ge-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
      '<div class="gd-row">'+btn('Undo','ge-undo')+btn('Redo','ge-redo')+'</div>';
  }
  function exportControlsHtml(){
    const canCard=!!challenge;
    if(!canCard&&exportMode==='challenge')exportMode='diagram';
    return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export a clean vector geoboard or a pupil-ready challenge card.</span></div></div>'+
      (canCard?'<div class="nl-export-mode ge-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-ge-export-mode="challenge">Challenge card</button>'+
        '<button type="button" class="'+(exportMode==='diagram'?'is-active':'')+'" data-ge-export-mode="diagram">Board only</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="ge-response-lines">'+
          [1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+
          '</select></label><p class="gd-help">The pupil card contains the question, geoboard and blank answer space. Revealed measurements are automatically hidden again.</p>'
        :'<p class="gd-help">Board-only export contains the peg grid, current shape, vertex labels and visible measurements without editing controls.</p>')+
      '<div class="nl-export-grid ge-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="ge-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'challenge':'image')+'</button>'+
        '<button class="gd-btn" id="ge-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="ge-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="ge-print" type="button">Print / PDF</button>'+
      '</div><p class="gd-help" id="ge-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }
  function geSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function exportMetricHidden(kind,pupil=false){
    if(!challenge)return false;
    if(!pupil)return metricHidden(kind);
    return Array.isArray(challenge.hiddenMetrics)&&challenge.hiddenMetrics.includes(kind);
  }
  function geoboardExportSvg({pupil=false}={}){
    if(pupil&&challenge?.mode==='standard'&&challenge.type==='build-area'&&pts.length){const previous=pts;pts=[];try{return geoboardExportSvg({pupil:true})}finally{pts=previous}}
    const width=760,height=760,gridPad=82,gridW=596,gridStep=gridW/(N-1),readY=690;
    const svg=geSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Geoboard','data-ge-export':'board'});
    svg.appendChild(geSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(geSvgEl('rect',{x:40,y:38,width:680,height:650,rx:18,fill:'#f8fbfb',stroke:'#c5d3d6','stroke-width':2,'data-ge-export-board':'1'}));
    function px(p){return{x:gridPad+p.x*gridStep,y:gridPad+(N-1-p.y)*gridStep}}
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const v=px({x,y});
      svg.appendChild(geSvgEl('circle',{cx:v.x,cy:v.y,r:5.5,fill:'#82979b'}));
    }
    if(pts.length){
      const coords=pts.map(p=>{const v=px(p);return v.x+','+v.y});
      if(pts.length>2)coords.push(coords[0]);
      svg.appendChild(geSvgEl('polyline',{points:coords.join(' '),fill:pts.length>2?'#cbe7e2':'none','fill-opacity':pts.length>2?.32:0,stroke:'#2f6f68','stroke-width':4,'stroke-linejoin':'round','stroke-linecap':'round','data-ge-export-shape':'1'}));
    }
    pts.forEach((p,i)=>{
      const v=px(p),label=String.fromCharCode(65+i);
      svg.appendChild(geSvgEl('circle',{cx:v.x,cy:v.y,r:10,fill:'#ffffff',stroke:'#2f6f68','stroke-width':4}));
      svg.appendChild(geSvgEl('text',{x:v.x+15,y:v.y-13,'font-family':'Arial,sans-serif','font-size':16,'font-weight':800,fill:'#344d54'},label));
    });
    const parts=[];
    const vertexText=exportMetricHidden('vertices',pupil)?'?':String(pts.length);
    parts.push('Vertices: '+vertexText);
    if(pts.length===2){
      parts.push('Length ≈ '+(exportMetricHidden('length',pupil)?'?':segmentLength().toFixed(2)+' units'));
    }else if(pts.length>=3){
      parts.push('Perimeter ≈ '+(exportMetricHidden('perimeter',pupil)?'?':perimeter().toFixed(2)+' units'));
      parts.push('Area = '+(exportMetricHidden('area',pupil)?'?':area().toFixed(2)+' square units'));
    }
    if(!pupil)svg.appendChild(geSvgEl('text',{x:width/2,y:readY,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':17,'font-weight':700,fill:'#425b62'},parts.join('   ·   ')));
    svg.appendChild(geSvgEl('text',{x:width-48,y:height-20,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return geoboardExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(geoboardExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Geoboard challenge',
      prompt:challenge.type==='build-area'?'Draw a polygon with an area of '+challenge.targetArea+' square units on the peg grid.':prompt,
      responseLabel:challenge.type==='build-area'?'Working / answer':challenge.category==='reason'?'Explain your thinking':'Answer',
      responseLines,
      brand:'99 Club Studio'
    });
  }
  function exportName(){
    const meta=challenge&&CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return exportMode==='challenge'&&challenge?(challenge.title||meta?.title||'geoboard-challenge'):'geoboard-shape';
  }
  function exportMessage(text){exportStatus=text;const el=q('#ge-export-status');if(el)el.textContent=text}
  async function exportAction(kind){
    try{
      if(!X)throw new Error('Export tools are not available.');
      const target=exportTargetSvg(),isCard=exportMode==='challenge'&&!!challenge,name=exportName();
      if(kind==='copy'){await X.copyPng(target);exportMessage(isCard?'Challenge copied — paste it into your worksheet, slide or document.':'Geoboard image copied — paste it into your slide or document.')}
      if(kind==='png'){await X.downloadPng(target,name,2);exportMessage(isCard?'Challenge PNG downloaded.':'Geoboard PNG downloaded.')}
      if(kind==='svg'){X.downloadSvg(target,name);exportMessage(isCard?'Challenge SVG downloaded.':'Geoboard SVG downloaded.')}
      if(kind==='print'){X.printSvg(target,{title:'',landscape:false});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'That export did not work.')}
  }
  function controlsHtml(){return workflowTabs()+(controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():exploreControlsHtml())}
  function renderControls(){const panel=q('#gd-controls');if(panel)panel.innerHTML=controlsHtml();bindControls()}
  function enterCustomChallenge(){
    if(CK)challenge=CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''});
    challengeTab='custom';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();draw();
  }
  function setCustomAnswerSource(source){
    if(!challenge||challenge.mode!=='custom')return;
    if(source==='manual'){
      challenge.answerMode='manual';challenge.answerSource='';clearBoundHiding();
    }else if(source==='generated'){
      challenge.answerMode='bound';challenge.answerSource='';
    }else{
      challenge.answerMode='bound';challenge.answerSource=source;challenge.answer=resolveAnswerSource(source);applyBoundHiding(source);
    }
    challenge.revealed=false;renderControls();draw();
  }
  function clearChallenge(){
    if(beforeChallenge){restoreTeachingSnapshot(beforeChallenge);beforeChallenge=null}
    challenge=null;challengeTab='standard';controlTab='explore';renderControls();draw();
  }
  function setGeneratedShape(next){
    pts=copyPts(next);selected=-1;drag=null;undoStack.length=0;redoStack.length=0;
  }
  function randomRect(w,h){
    const x=Math.floor(Math.random()*(N-w)),y=Math.floor(Math.random()*(N-h));
    return[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
  }
  function generateChallenge(type){
    const template=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!template)return;
    if(!beforeChallenge)beforeChallenge=teachingSnapshot();else restoreTeachingSnapshot(beforeChallenge);
    const pick=a=>a[Math.floor(Math.random()*a.length)];
    if(type==='find-length'){
      const length=2+Math.floor(Math.random()*5),vertical=Math.random()<.5;
      const x=Math.floor(Math.random()*(vertical?N:N-length)),y=Math.floor(Math.random()*(vertical?N-length:N));
      setGeneratedShape([{x,y},{x:x+(vertical?0:length),y:y+(vertical?length:0)}]);
      challenge=challengeObject(type,'What is the length of segment AB?',resolveAnswerSource('length'),{answerSource:'length',hiddenMetrics:['length']});
    }else if(type==='find-perimeter'){
      if(Math.random()<.35){
        setGeneratedShape([{x:1,y:1},{x:5,y:1},{x:1,y:4}]);
      }else{
        const [w,h]=pick([[2,3],[3,4],[4,2],[5,1]]);setGeneratedShape(randomRect(w,h));
      }
      challenge=challengeObject(type,'What is the perimeter of this shape?',resolveAnswerSource('perimeter'),{answerSource:'perimeter',hiddenMetrics:['perimeter']});
    }else if(type==='find-area'){
      if(Math.random()<.45){
        const [w,h]=pick([[4,3],[4,2],[6,2],[3,2],[5,3],[3,3]]),x=Math.floor(Math.random()*(N-w)),y=Math.floor(Math.random()*(N-h));
        setGeneratedShape([{x,y},{x:x+w,y},{x,y:y+h}]);
      }else{
        const [w,h]=pick([[2,3],[3,4],[4,2],[5,2]]);setGeneratedShape(randomRect(w,h));
      }
      challenge=challengeObject(type,'What is the area enclosed by this shape?',resolveAnswerSource('area'),{answerSource:'area',hiddenMetrics:['area']});
    }else if(type==='perimeter-area'){
      const [w,h]=pick([[2,3],[3,4],[4,2],[5,2]]);setGeneratedShape(randomRect(w,h));
      challenge=challengeObject(type,'Find both the perimeter and the area of this shape.',resolveAnswerSource('perimeter-area'),{answerSource:'perimeter-area',hiddenMetrics:['perimeter','area']});
    }else if(type==='build-area'){
      const option=pick([{area:4,w:2,h:2},{area:6,w:3,h:2},{area:8,w:4,h:2},{area:9,w:3,h:3},{area:10,w:5,h:2},{area:12,w:4,h:3}]);
      setGeneratedShape([]);
      challenge=challengeObject(type,'Show a polygon with an area of '+option.area+' square units.','For example, a '+option.w+' × '+option.h+' rectangle.',{answerMode:'manual',targetArea:option.area,solutionSize:[option.w,option.h],hiddenMetrics:['area']});
    }else{
      setGeneratedShape([{x:1,y:1},{x:5,y:1},{x:5,y:5},{x:1,y:5}]);
      challenge=challengeObject(type,'This square has perimeter 16 units and area 16 square units. A pupil says the two measurements are the same because both numbers are 16. Are they correct?','No. Perimeter measures distance around the shape in units; area measures the surface inside it in square units.',{answerMode:'manual'});
    }
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';
    exportMode='challenge';responseLines=template.category==='reason'?3:1;exportStatus='';renderControls();draw();
  }
  function toggleGeoboardReveal(){
    if(!challenge)return;
    if(challenge.mode==='standard'&&challenge.type==='build-area'){
      if(!challenge.revealed){
        const dimensions=challenge.solutionSize||[2,3,4,5,6].map(w=>[w,challenge.targetArea/w]).find(([w,h])=>Number.isInteger(h)&&h>=1&&h<N);
        if(dimensions){const [w,h]=dimensions;challenge.preRevealShape=teachingSnapshot();const x=w<N-1?1:0,y=h<N-1?1:0;pts=[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];selected=-1;drag=null}
      }else if(challenge.preRevealShape){pts=copyPts(challenge.preRevealShape.pts);selected=challenge.preRevealShape.selected;delete challenge.preRevealShape}
    }
    challenge.revealed=!challenge.revealed;renderControls();draw();
  }
  function bindChallengeStageActions(){
    const endChallenge=q('[data-challenge-action="end"]',q('#gd-stage'));if(endChallenge)endChallenge.onclick=e=>{e.stopPropagation();clearChallenge()};
    const stage=q('#gd-stage');if(!stage||!challenge)return;
    const reveal=q('[data-board-action="reveal"]',stage);
    if(reveal)reveal.onclick=e=>{e.stopPropagation();toggleGeoboardReveal()};
    const another=q('[data-challenge-action="another"]',stage);
    if(another)another.onclick=e=>{e.stopPropagation();if(challenge?.mode==='standard')generateChallenge(challenge.type)};
  }
  function bindControls(){
    const controls=q('#gd-controls');if(!controls)return;
    qa('[data-ge-workflow]',controls).forEach(button=>button.onclick=()=>{
      const next=button.dataset.geWorkflow;
      controlTab=next==='challenge'?'challenge':next==='export'?'export':'explore';renderControls();
    });
    if(controlTab==='export'){
      qa('[data-ge-export-mode]',controls).forEach(button=>button.onclick=()=>{
        exportMode=button.dataset.geExportMode==='challenge'&&challenge?'challenge':'diagram';exportStatus='';renderControls();
      });
      const response=q('#ge-response-lines',controls);if(response)response.onchange=()=>{
        responseLines=clamp(Math.round(num(response.value,1)),1,4);renderControls();
      };
      const copyImage=q('#ge-copy-image',controls);if(copyImage)copyImage.onclick=()=>exportAction('copy');
      const png=q('#ge-png',controls);if(png)png.onclick=()=>exportAction('png');
      const svgDownload=q('#ge-svg-download',controls);if(svgDownload)svgDownload.onclick=()=>exportAction('svg');
      const print=q('#ge-print',controls);if(print)print.onclick=()=>exportAction('print');
      return;
    }
    const u=q('#ge-undo',controls);if(u)u.onclick=undo;
    const r=q('#ge-redo',controls);if(r)r.onclick=redo;
    const clear=q('#ge-clear',controls);if(clear)clear.onclick=()=>{if(shapeFrozen()||!pts.length)return;remember();pts=[];selected=-1;draw()};
    if(controlTab!=='challenge')return;
    qa('[data-ge-challenge-tab]',controls).forEach(button=>button.onclick=()=>{
      if(button.dataset.geChallengeTab==='custom')enterCustomChallenge();else{challengeTab='standard';renderControls()}
    });
    qa('[data-ge-challenge-cat]',controls).forEach(button=>button.onclick=()=>{
      challengeCategory=button.dataset.geChallengeCat;
      const first=CHALLENGE_TEMPLATES.find(t=>t.category===challengeCategory);if(first)challengeType=first.id;
      renderControls();
    });
    qa('[data-ge-challenge-type]',controls).forEach(button=>button.onclick=()=>{challengeType=button.dataset.geChallengeType;renderControls()});
    const generate=q('#ge-generate',controls);if(generate)generate.onclick=()=>generateChallenge(challengeType);
    const edit=q('#ge-edit-challenge',controls);if(edit)edit.onclick=enterCustomChallenge;
    const end=q('#ge-clear-challenge',controls);if(end)end.onclick=clearChallenge;
    const reveal=q('#ge-reveal',controls);if(reveal)reveal.onclick=toggleGeoboardReveal;
    qa('[data-gd-rich-action]',controls).forEach(button=>button.onclick=e=>{
      e.preventDefault();const editor=q('#ge-custom-prompt',controls);
      if(editor&&CK&&challenge){
        CK.applyFormat(editor,button.dataset.gdRichAction);
        challenge.promptHtml=CK.sanitiseRichHtml(editor.innerHTML);
        challenge.prompt=CK.plainText(challenge.promptHtml).slice(0,600);
        draw();
      }
    });
    const title=q('#ge-custom-title',controls);if(title)title.oninput=()=>{if(!challenge)return;challenge.title=title.value.slice(0,100);draw()};
    const prompt=q('#ge-custom-prompt',controls);if(prompt)prompt.oninput=()=>{
      if(!challenge||!CK)return;challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml).slice(0,600);draw();
    };
    const source=q('#ge-custom-answer-source',controls);if(source)source.onchange=()=>setCustomAnswerSource(source.value);
    const answer=q('#ge-custom-answer',controls);if(answer)answer.oninput=()=>{
      if(!challenge)return;challenge.answer=answer.value.slice(0,400);challenge.answerMode='manual';challenge.answerSource='';
      if(challenge.revealed)draw();
    };
  }
  function pointPx(p){
    return{x:pad+p.x*step,y:pad+(N-1-p.y)*step};
  }
  function polyPoints(){
    if(!pts.length)return'';
    const list=pts.map(p=>{const v=pointPx(p);return v.x+','+v.y;});
    if(pts.length>2)list.push(list[0]);
    return list.join(' ');
  }
  function metricText(){
    const vertexText=metricHidden('vertices')?'?':pts.length;
    if(pts.length<2)return'Vertices: '+vertexText+' · Add at least two vertices to measure a length.';
    if(pts.length===2)return'Vertices: '+vertexText+' · Length ≈ '+(metricHidden('length')?'?':segmentLength().toFixed(2)+' units');
    if(CK?.simplePolygon&&!CK.simplePolygon(pts))return 'Vertices: '+vertexText+' · Make a non-crossing polygon to measure area and perimeter.';
    return'Vertices: '+vertexText+' · Perimeter ≈ '+(metricHidden('perimeter')?'?':perimeter().toFixed(2)+' units')+' · Area = '+(metricHidden('area')?'?':area().toFixed(2)+' square units');
  }
  function occupied(x,y,except=-1){
    return pts.findIndex((p,i)=>i!==except&&p.x===x&&p.y===y);
  }
  function nearestPeg(e,svg){
    const r=svg.getBoundingClientRect();
    const vx=(e.clientX-r.left)/Math.max(1,r.width)*W;
    const vy=(e.clientY-r.top)/Math.max(1,r.height)*W;
    return{
      x:clamp(Math.round((vx-pad)/step),0,N-1),
      y:clamp((N-1)-Math.round((vy-pad)/step),0,N-1)
    };
  }
  function updateGeometry(){
    updateChallengeAnswer();
    const poly=q('[data-ge-poly]',q('#gd-stage'));
    if(poly){poly.setAttribute('points',polyPoints());poly.style.fill=pts.length<3?'none':''}
    qa('[data-ge-vertex]',q('#gd-stage')).forEach(el=>{
      const i=+el.dataset.geVertex,p=pts[i];if(!p)return;
      const v=pointPx(p);
      el.setAttribute('cx',v.x);el.setAttribute('cy',v.y);
      el.dataset.gePos=p.x+','+p.y;
      el.classList.toggle('is-selected',i===selected);
      el.setAttribute('aria-label','Vertex '+String.fromCharCode(65+i)+' at '+p.x+', '+p.y+'. Drag to move.');
    });
    qa('[data-ge-label]',q('#gd-stage')).forEach(el=>{
      const i=+el.dataset.geLabel,p=pts[i];if(!p)return;
      const v=pointPx(p);
      el.setAttribute('x',v.x+11);el.setAttribute('y',v.y-11);
    });
    const readout=q('#ge-readout');if(readout)readout.textContent=metricText();
    const context=q('#ge-context-text');
    if(context)context.textContent=selected>=0&&pts[selected]
      ? 'Selected '+String.fromCharCode(65+selected)+' · ('+pts[selected].x+', '+pts[selected].y+')'
      : 'Tap a vertex to select it, or drag it straight to another peg.';
    const del=q('[data-ge-delete]');
    if(del)del.hidden=!(selected>=0&&pts[selected]);
    syncControls();
  }
  function moveVertex(index,x,y,withHistory=true){
    if(shapeFrozen()||!pts[index]||occupied(x,y,index)>=0)return false;
    if(pts[index].x===x&&pts[index].y===y)return false;
    if(withHistory)remember();
    pts[index]={x,y};
    selected=index;
    return true;
  }
  function deleteVertex(index){
    if(shapeFrozen()||index<0||index>=pts.length)return;
    remember();
    pts.splice(index,1);
    selected=-1;
    draw();
  }
  function syncControls(){
    const u=q('#ge-undo'),r=q('#ge-redo'),clear=q('#ge-clear');
    const stageUndo=q('[data-ge-undo-stage]',q('#gd-stage')),stageRedo=q('[data-ge-redo-stage]',q('#gd-stage'));
    const frozen=shapeFrozen();
    if(u)u.disabled=frozen||!undoStack.length;
    if(r)r.disabled=frozen||!redoStack.length;
    if(stageUndo)stageUndo.disabled=frozen||!undoStack.length;
    if(stageRedo)stageRedo.disabled=frozen||!redoStack.length;
    if(clear)clear.disabled=frozen||!pts.length;
  }
  function bindStage(){
    const svg=q('#ge-svg');
    if(shapeFrozen())return;
    qa('[data-gp]',q('#gd-stage')).forEach(peg=>peg.onclick=()=>{
      const [x,y]=peg.dataset.gp.split(',').map(Number);
      const existing=occupied(x,y);
      if(existing>=0){selected=existing;draw();return;}
      remember();
      pts.push({x,y});
      selected=pts.length-1;
      draw();
    });
    qa('[data-ge-vertex]',q('#gd-stage')).forEach(vertex=>{
      vertex.onpointerdown=e=>{
        if(e.button!=null&&e.button!==0)return;
        e.stopPropagation();
        const index=+vertex.dataset.geVertex;
        selected=index;
        drag={index,pointerId:e.pointerId,start:copyPts(),moved:false};
        try{vertex.setPointerCapture(e.pointerId)}catch(_){}
        updateGeometry();
      };
      vertex.onpointermove=e=>{
        if(!drag||drag.pointerId!==e.pointerId||drag.index!==+vertex.dataset.geVertex)return;
        const target=nearestPeg(e,svg),p=pts[drag.index];
        if(!p||(p.x===target.x&&p.y===target.y)||occupied(target.x,target.y,drag.index)>=0)return;
        if(!drag.moved){
          remember(drag.start);
          drag.moved=true;
        }
        pts[drag.index]={x:target.x,y:target.y};
        selected=drag.index;
        updateGeometry();
      };
      const finish=e=>{
        if(!drag||drag.pointerId!==e.pointerId||drag.index!==+vertex.dataset.geVertex)return;
        const moved=drag.moved;
        drag=null;
        if(moved)draw();else{selected=+vertex.dataset.geVertex;draw();}
      };
      vertex.onpointerup=finish;
      vertex.onpointercancel=finish;
      vertex.onkeydown=e=>{
        const index=+vertex.dataset.geVertex,p=pts[index];if(!p)return;
        if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteVertex(index);return;}
        let x=p.x,y=p.y;
        if(e.key==='ArrowLeft')x--;else if(e.key==='ArrowRight')x++;
        else if(e.key==='ArrowUp')y++;else if(e.key==='ArrowDown')y--;else return;
        e.preventDefault();
        x=clamp(x,0,N-1);y=clamp(y,0,N-1);
        if(moveVertex(index,x,y,true))draw();
      };
    });
    const stageUndo=q('[data-ge-undo-stage]'),stageRedo=q('[data-ge-redo-stage]');
    if(stageUndo)stageUndo.onclick=e=>{e.stopPropagation();undo()};
    if(stageRedo)stageRedo.onclick=e=>{e.stopPropagation();redo()};
    const del=q('[data-ge-delete]');
    if(del)del.onclick=e=>{e.stopPropagation();deleteVertex(selected)};
  }
  function draw(){
    updateChallengeAnswer();
    let grid='';
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const v=pointPx({x,y});
      grid+='<circle class="gd-ge-peg" cx="'+v.x+'" cy="'+v.y+'" r="5" pointer-events="none"></circle>';
    }
    const hitGrid=Array.from({length:N*N},(_,i)=>{const x=i%N,y=Math.floor(i/N),v=pointPx({x,y});return '<circle class="gd-ge-peg-hit" cx="'+v.x+'" cy="'+v.y+'" r="16" fill="transparent" data-gp="'+x+','+y+'"></circle>'}).join('');
    const poly='<polyline class="gd-poly" data-ge-poly'+(pts.length<3?' style="fill:none"':'')+' points="'+polyPoints()+'"></polyline>';
    const vertices=pts.map((p,i)=>{
      const v=pointPx(p),label=String.fromCharCode(65+i);
      return '<circle class="gd-point gd-ge-vertex'+(i===selected?' is-selected':'')+'" data-ge-vertex="'+i+'" data-ge-pos="'+p.x+','+p.y+'" tabindex="'+(shapeFrozen()?'-1':'0')+'" role="'+(shapeFrozen()?'img':'button')+'" aria-label="Vertex '+label+' at '+p.x+', '+p.y+(shapeFrozen()?'. Fixed for this challenge.':'. Drag to move.')+'" cx="'+v.x+'" cy="'+v.y+'" r="10"></circle>'+
        '<text class="gd-ge-label" pointer-events="none" data-ge-label="'+i+'" x="'+(v.x+11)+'" y="'+(v.y-11)+'">'+label+'</text>';
    }).join('');
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Geoboard challenge',pupil:(challenge.type==='build-area'?CK.pupilSpec('model',{check:()=>CK.simplePolygon(pts)&&Math.abs(area()-challenge.targetArea)<1e-8}):challenge.type==='area-perimeter-units'?CK.pupilSpec('choice',{choices:['Yes','No'],expected:'No',explain:true}):challenge.type==='perimeter-area'?CK.pupilSpec('metrics'):CK.pupilSpec('unit',{unit:challenge.type==='find-area'?'square units':'units'})),actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'},{action:'end',label:'Back to setup'}]:[{action:'end',label:'End challenge'}]}):'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-geo gd-geoboard-direct">'+
      '<svg id="ge-svg" viewBox="0 0 '+W+' '+W+'" role="img" aria-label="Interactive geoboard">'+grid+poly+hitGrid+vertices+'</svg>'+
      (shapeFrozen()?'':'<div class="gd-ge-context"><span id="ge-context-text">'+(selected>=0&&pts[selected]?'Selected '+String.fromCharCode(65+selected)+' · ('+pts[selected].x+', '+pts[selected].y+')':(shapeFrozen()?'The given shape is fixed for this challenge.':'Tap a peg to add a vertex. Drag an existing vertex to reshape the polygon.'))+'</span><div class="gd-context-actions">'+
        '<button type="button" class="gd-context-history" data-ge-undo-stage'+(!undoStack.length?' disabled':'')+'>Undo</button>'+
        '<button type="button" class="gd-context-history" data-ge-redo-stage'+(!redoStack.length?' disabled':'')+'>Redo</button>'+
        '<button type="button" class="gd-context-delete" data-ge-delete'+(selected>=0&&pts[selected]?'':' hidden')+'>Delete vertex</button>'+
      '</div></div>')+
      (!challenge?'<div class="gd-readout" id="ge-readout">'+metricText()+'</div>':'')+
    '</div>';
    bindStage();
    bindChallengeStageActions();
    syncControls();
  }

  setPanels(controlsHtml(),'');
  bindControls();
  draw();
  G.lessonState?.register('geoboard',()=>({diagram:teachingSnapshot(),challenge,beforeChallenge,pupil:CK?.capturePupil?.(challenge),controlTab,challengeTab,challengeCategory,challengeType,exportMode,responseLines}),saved=>{
    restoreTeachingSnapshot(saved.diagram);challenge=saved.challenge?CK.normalise(saved.challenge):null;beforeChallenge=saved.beforeChallenge||null;
    if(Object.prototype.hasOwnProperty.call(saved,'controlTab'))controlTab=saved.controlTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeTab'))challengeTab=saved.challengeTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeCategory'))challengeCategory=saved.challengeCategory;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeType'))challengeType=saved.challengeType;
    if(Object.prototype.hasOwnProperty.call(saved,'exportMode'))exportMode=saved.exportMode;
    if(Object.prototype.hasOwnProperty.call(saved,'responseLines'))responseLines=saved.responseLines;
    CK?.restorePupil?.(challenge,saved.pupil);renderControls();draw();
  });

}

function mathsCanvas(){
const I=G.interaction,CK=G.challengeKit,X=G.exportTools,N=G.numberChallenges;
if(!I){q('#gd-stage').innerHTML='<p class="gd-empty">The interactive canvas could not start.</p>';return;}
let tiles=[],next=1,grid=true,colourOpen=false,addOpen=false,combineOpen=false,splitOpen=false,controller=null;
let workflow='build',taskTitle='Number tiles task',taskPrompt='',exportMode='canvas',responseLines=2,exportStatus='';
let challenge=null,difficulty='medium',numberSettings=N.settings({},difficulty),generationError='';
const colours=['#cbe7e2','#f6cf79','#cfe0f6','#efcfd9','#dbcff2','#d5ead2','#f3d7c4','#ffffff'];
function textColour(hex){const h=String(hex||'').replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))return '#24343b';const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return (r*299+g*587+b*114)/1000>155?'#24343b':'#ffffff'}
function stateSnapshot(){return{tiles:JSON.parse(JSON.stringify(tiles)),next,grid}}
function restoreState(value){tiles=Array.isArray(value?.tiles)?JSON.parse(JSON.stringify(value.tiles)):[];next=Math.max(1,num(value?.next,1),...tiles.map(t=>Number(t.id)+1||1));grid=value?.grid!==false;colourOpen=false;combineOpen=false;splitOpen=false}
function selectedTile(id){return tiles.find(t=>String(t.id)===String(id))||null}
function numericTile(item){if(!item||item.symbol)return null;const raw=String(item.text??'').trim();if(!/^-?\d+(?:\.\d+)?$/.test(raw))return null;const value=Number(raw);return Number.isFinite(value)?value:null}
function niceNumber(value){const n=Math.round(Number(value)*1000)/1000;return String(n)}

function tileMarkup(t,selectedId){const selected=String(t.id)===String(selectedId),locked=!!t.locked;return '<div class="gd-tile gd-object-tile'+(t.symbol?' symbol':'')+(selected?' is-selected':'')+(locked?' is-locked':'')+'" data-gd-object="'+t.id+'" role="button" tabindex="0" aria-selected="'+(selected?'true':'false')+'" aria-label="'+esc(t.text)+(locked?' locked':'')+'" style="left:'+t.x+'px;top:'+t.y+'px;--gd-tile-fill:'+t.color+';--gd-tile-ink:'+textColour(t.color)+'">'+esc(t.text)+(locked?'<span class="gd-tile-lock" aria-hidden="true">⌑</span>':'')+'</div>'}
function railMarkup(selected,meta){
const undo=I.toolButton('undo','undo','Undo','',!meta?.canUndo);
const redo=I.toolButton('redo','redo','Redo','',!meta?.canRedo);
const gridButton=I.toolButton('grid','grid',grid?'Turn grid off':'Turn grid on',grid?'is-active':'',false);
const addButton=I.toolButton('add','plus','Add tile',addOpen?'is-active':'',false);
let object='';
if(selected){
const numeric=numericTile(selected)!=null;
object=I.toolButton('duplicate','duplicate','Duplicate tile','',false)+
(numeric?I.toolButton('combine','combine','Combine (+) with another number tile',combineOpen?'is-active':'',selected.locked):'')+
(numeric?I.toolButton('split','split','Split into equal-value tiles',splitOpen?'is-active':'',selected.locked):'')+
I.toolButton('colour','colour','Change tile colour',colourOpen?'is-active':'',selected.locked)+
I.toolButton('lock',selected.locked?'unlock':'lock',selected.locked?'Unlock tile':'Lock tile',selected.locked?'is-active':'',false)+
I.toolButton('delete','delete','Delete tile','is-danger',selected.locked);
}
const swatches=selected&&colourOpen&&!selected.locked?'<div class="gd-object-colours" role="group" aria-label="Tile colour">'+colours.map(col=>'<button type="button" data-gd-colour="'+col+'" aria-label="Use '+col+'" style="--swatch:'+col+'"></button>').join('')+'</div>':'';
const embedded=document.documentElement.classList.contains('gd-embed-page');
const palette=(addOpen||embedded)?'<div class="gd-mc-stage-palette"'+(embedded?' id="mc-board-palette" hidden':'')+' role="group" aria-label="Add a maths tile">'+(!embedded?'<button type="button" class="gd-mc-palette-close" data-gd-action="close-tiles" aria-label="Close tile palette">×</button>':'')+
  ['1','2','3','4','5','10','100'].map(x=>'<button type="button" data-gd-action="add-tile" data-mc-value="'+x+'">'+x+'</button>').join('')+
  ['+','−','×','÷','=','<','>','?'].map(x=>'<button type="button" class="is-symbol" data-gd-action="add-tile" data-mc-value="'+x+'" data-mc-symbol="true">'+x+'</button>').join('')+
  '</div>':'';
let transform='';
if(selected&&combineOpen){
  const others=tiles.filter(t=>t!==selected&&numericTile(t)!=null&&!t.locked);
  transform='<div class="gd-mc-transform-palette" role="group" aria-label="Combine number tiles"><strong>Combine '+esc(selected.text)+' + …</strong>'+(others.length?others.map(t=>'<button type="button" data-gd-action="combine-with" data-mc-other="'+t.id+'">'+esc(t.text)+'</button>').join(''):'<small>Add another number tile first.</small>')+'</div>';
}else if(selected&&splitOpen){
  const value=numericTile(selected),parts=[2,3,4,5].filter(p=>Number.isInteger(value/p));
  transform='<div class="gd-mc-transform-palette" role="group" aria-label="Split number tile"><strong>Split '+esc(selected.text)+' into</strong>'+(parts.length?parts.map(p=>'<button type="button" data-gd-action="split-into" data-mc-parts="'+p+'">'+p+' equal tiles</button>').join(''):'<small>No exact split into 2–5 equal whole-number tiles.</small>')+'</div>';
}
return '<div class="gd-object-ui"><div class="gd-object-rail'+(selected?' is-engaged':'')+'" aria-label="Canvas tools">'+addButton+'<span class="gd-object-separator"></span>'+object+(object?'<span class="gd-object-separator"></span>':'')+undo+redo+gridButton+'</div>'+swatches+palette+transform+'</div>'
}
function taskPreview(){
if(workflow!=='task')return'';
const title=String(taskTitle||'').trim(),prompt=String(taskPrompt||'').trim();
if(!title&&!prompt)return'';
return '<div class="gd-mc-task-preview">'+(title?'<strong>'+esc(title)+'</strong>':'')+(prompt?'<span>'+esc(prompt)+'</span>':'')+'</div>';
}
function generateNumberChallenge(type){
 if(!N)return;
 try{challenge=CK.normalise(N.generate(type,difficulty,Math.random,numberSettings));generationError='';workflow='challenge';exportMode='challenge'}catch(e){generationError=e.message||'Unable to generate a question with these settings.'}
 renderControls();controller?.refresh();
}
function exitNumberChallenge(){challenge=null;generationError='';workflow='build';exportMode='canvas';renderControls();controller?.refresh()}
function challengeMarkup(){
 const spec=CK.pupilSpec(challenge.kind,challenge.choices?{choices:challenge.choices}:{hint:'Number'});
 const banner=CK.bannerHtml(challenge,{pupil:spec,actions:[{action:'another',label:'Another'},{action:'end',label:'Exit challenge'}]});
 const rows=[[]];for(const tile of challenge.tiles){if(tile===' ; ')rows.push([]);else rows.at(-1).push(tile)}
 return (generationError?'<p class="gd-number-error" role="status">'+esc(generationError)+'</p>':'')+banner+'<div class="gd-number-task-rows gd-number-equations">'+rows.map(row=>{const units=row.reduce((n,v)=>n+(v==='?'?2.4:/^[+−×÷=<>]$/.test(v)?1.35:/^[()]$/.test(v)?.65:Math.max(1.35,String(v).length*.66+.45)),0);return '<div class="gd-number-equation" style="--eq-units:'+units+'">'+row.map(v=>'<span class="gd-number-equation-token'+(v==='?'?' is-unknown'+(challenge.revealed?' is-revealed':''):/^[+−×÷=<>]$/.test(v)?' is-operator':/^[()]$/.test(v)?' is-bracket':'')+'">'+esc(v==='?'&&challenge.revealed?challenge.answer:v)+'</span>').join('')+'</div>'}).join('')+'</div>';
}
function draw(selectedId,meta){
 if(challenge){q('#gd-stage').innerHTML=challengeMarkup();return}
const selected=selectedTile(selectedId);
q('#gd-stage').innerHTML=(generationError?'<p class="gd-number-error" role="status">'+esc(generationError)+'</p>':'')+taskPreview()+'<div class="gd-vis gd-object-workspace"><div class="gd-object-canvas-wrap"><div class="gd-canvas gd-object-canvas'+(grid?' has-grid':'')+'" id="mc-canvas" data-gd-canvas-bg tabindex="0" aria-label="Maths canvas. Tap a tile to select it and drag to move it.">'+tiles.map(t=>tileMarkup(t,selectedId)).join('')+'</div>'+railMarkup(selected,meta)+'</div><div class="gd-object-hint">'+(selected?(selected.locked?'Tile locked · use the lock icon to move or edit it again.':'Drag to move · the side tools duplicate, colour, lock or delete it.'):'Use + to add a common tile, then drag tiles directly around the board. Custom tile text stays in Tools.')+'</div></div>'
}
function constrainTile(item,x,y,element,canvas){const el=element||canvas.querySelector('[data-gd-object="'+item.id+'"]');const w=el?.offsetWidth||52,h=el?.offsetHeight||52;return{x:clamp(x,0,Math.max(0,canvas.clientWidth-w)),y:clamp(y,0,Math.max(0,canvas.clientHeight-h))}}
function duplicateTile(item){const canvas=q('#mc-canvas'),copy={...item,id:next++,locked:false};const w=canvas?.clientWidth||700,h=canvas?.clientHeight||420;copy.x=clamp((Number(item.x)||0)+40,0,Math.max(0,w-70));copy.y=clamp((Number(item.y)||0)+40,0,Math.max(0,h-60));tiles.push(copy);return copy}
function add(text,symbol=false){let id=null;colourOpen=false;combineOpen=false;splitOpen=false;controller.mutate(()=>{id=next++;const canvas=q('#mc-canvas'),width=canvas?.clientWidth||700,cols=Math.max(1,Math.floor(Math.max(80,width-40)/80)),i=tiles.length,x=20+(i%cols)*80,y=20+Math.floor(i/cols)*80;tiles.push({id,text,x,y,symbol,locked:false,color:symbol?'#f6cf79':'#cbe7e2'})});controller.select(id)}
function combineTiles(source,other){
if(!source||!other||source===other||source.locked||other.locked)return;
const a=numericTile(source),b=numericTile(other);if(a==null||b==null)return;
const keep=source.id;controller.mutate(()=>{source.text=niceNumber(a+b);source.symbol=false;source.x=Math.min(Number(source.x)||0,Number(other.x)||0);source.y=Math.min(Number(source.y)||0,Number(other.y)||0);tiles=tiles.filter(t=>t!==other);combineOpen=false;splitOpen=false;colourOpen=false;addOpen=false});controller.select(keep)
}
function splitTile(item,parts){
const value=numericTile(item),count=clamp(Math.round(num(parts,2)),2,5);if(value==null||item.locked||!Number.isInteger(value/count))return;
const piece=value/count,keep=item.id,canvas=q('#mc-canvas'),width=canvas?.clientWidth||700,height=canvas?.clientHeight||420;
controller.mutate(()=>{
  item.text=niceNumber(piece);combineOpen=false;splitOpen=false;colourOpen=false;addOpen=false;
  for(let i=1;i<count;i++)tiles.push({...item,id:next++,locked:false,x:clamp((Number(item.x)||0)+i*62,0,Math.max(0,width-60)),y:clamp((Number(item.y)||0)+(i%2)*62,0,Math.max(0,height-60))});
});controller.select(keep)
}
function workflowTabs(){
return '<div class="gd-row gd-mc-workflow-tabs" role="tablist" aria-label="Number and symbol tiles workflow">'+
'<button class="gd-btn'+(workflow==='build'?' gd-btn--primary':'')+'" type="button" data-mc-workflow="build">Build</button>'+
'<button class="gd-btn'+(workflow==='task'?' gd-btn--primary':'')+'" type="button" data-mc-workflow="task">Task</button>'+(N?'<button class="gd-btn'+(workflow==='challenge'?' gd-btn--primary':'')+'" type="button" data-mc-workflow="challenge">Challenge</button>':'')+
'<button class="gd-btn'+(workflow==='export'?' gd-btn--primary':'')+'" type="button" data-mc-workflow="export">Export / reuse</button></div>';
}
function buildControlsHtml(){
return '<p class="gd-section-title">Add tiles</p><div class="gd-canvas-tools">'+['1','2','3','4','5','10','100'].map(x=>'<button class="gd-btn gd-palette-tile" type="button" data-mc-add="'+x+'">'+x+'</button>').join('')+'</div>'+
'<div class="gd-canvas-tools">'+['+','−','×','÷','=','<','>','?'].map(x=>'<button class="gd-btn gd-palette-tile is-symbol" type="button" data-mc-sym="'+x+'">'+x+'</button>').join('')+'</div>'+
field('Custom tile','<div class="gd-row"><input class="gd-input" id="mc-custom" placeholder="e.g. 24"><button class="gd-btn" type="button" id="mc-add">Add</button></div>')+
btn('Clear canvas','mc-clear')+
'<p class="gd-help">Tap to add a tile, then work directly on the board. Select a tile for duplicate, colour, lock and delete. On a keyboard: arrows nudge, Delete removes, Ctrl/Cmd+D duplicates, Ctrl/Cmd+Z undoes.</p>';
}
function taskControlsHtml(){
return '<div class="nl-panel-title"><div><strong>Create a pupil task</strong><span>Use the current canvas arrangement as the starting model.</span></div></div>'+
field('Task title','<input class="gd-input" id="mc-task-title" maxlength="100" value="'+esc(taskTitle)+'" placeholder="e.g. Make the equation true">')+
field('Pupil instructions','<textarea class="gd-textarea gd-mc-task-prompt" id="mc-task-prompt" rows="5" maxlength="500" placeholder="What should pupils do with this starting layout?">'+esc(taskPrompt)+'</textarea>')+
'<p class="gd-help">The canvas stays live while you write the task, so you can arrange, lock and colour the exact starting layout pupils should receive.</p>';
}
function mcSvgEl(name,attrs={},text=''){
const el=document.createElementNS('http://www.w3.org/2000/svg',name);
Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
if(text!==''&&text!=null)el.textContent=String(text);
return el;
}
function numberChallengeSvg(){
 const rows=[[]];for(const tile of challenge.tiles){if(tile===' ; ')rows.push([]);else rows.at(-1).push(tile)}
 const W=960,H=rows.length*114+54,svg=mcSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':'Unanswered arithmetic question'});
 svg.appendChild(mcSvgEl('rect',{width:W,height:H,fill:'#fff'}));
 rows.forEach((row,r)=>{
   const weights=row.map(v=>v==='?'?2.2:/^[+−×÷=<>]$/.test(v)?1.25:/^[()]$/.test(v)?.6:Math.max(1.1,String(v).length*.65+.25));
   const font=Math.min(56,880/weights.reduce((a,b)=>a+b,0)),widths=weights.map(v=>v*font),total=widths.reduce((a,b)=>a+b,0);
   let x=(W-total)/2;const y=85+r*114;
   row.forEach((v,i)=>{const w=widths[i];if(v==='?'){svg.appendChild(mcSvgEl('rect',{x:x+font*.12,y:y-font*.85,width:w-font*.24,height:font*1.12,rx:7,fill:'#fff',stroke:'#466c70','stroke-width':2,'stroke-dasharray':'5 3'}))}else svg.appendChild(mcSvgEl('text',{x:x+w/2,y,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':font,'font-weight':700,fill:'#24343b'},v));x+=w})
 });return svg;
}
function canvasExportSvg(){
const W=960,H=560,pad=34,canvas=q('#mc-canvas'),sourceW=Math.max(1,canvas?.clientWidth||760),sourceH=Math.max(1,canvas?.clientHeight||420);
const innerW=W-pad*2,innerH=H-pad*2,scale=Math.min(innerW/sourceW,innerH/sourceH),offsetX=pad+(innerW-sourceW*scale)/2,offsetY=pad+(innerH-sourceH*scale)/2;
const svg=mcSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':'Maths canvas model','data-mc-export':'canvas'});
svg.appendChild(mcSvgEl('rect',{x:0,y:0,width:W,height:H,fill:'#ffffff'}));
svg.appendChild(mcSvgEl('rect',{x:pad,y:pad,width:innerW,height:innerH,rx:18,fill:'#fbfdfd',stroke:'#b9c9cc','stroke-width':2,'stroke-dasharray':'8 7'}));
if(grid){
  const step=Math.max(18,20*scale);
  for(let x=pad+step;x<pad+innerW;x+=step)svg.appendChild(mcSvgEl('line',{x1:x,y1:pad,x2:x,y2:pad+innerH,stroke:'#e7eeee','stroke-width':1}));
  for(let y=pad+step;y<pad+innerH;y+=step)svg.appendChild(mcSvgEl('line',{x1:pad,y1:y,x2:pad+innerW,y2:y,stroke:'#e7eeee','stroke-width':1}));
}
tiles.forEach(t=>{
  const node=canvas?.querySelector('[data-gd-object="'+t.id+'"]');
  const rawW=Math.max(52,node?.offsetWidth||Math.min(150,52+String(t.text||'').length*11)),rawH=Math.max(52,node?.offsetHeight||52);
  const tw=rawW*scale,th=rawH*scale,x=offsetX+(Number(t.x)||0)*scale,y=offsetY+(Number(t.y)||0)*scale;
  const stroke=t.symbol?'#bd9140':'#81aaa4';
  svg.appendChild(mcSvgEl('rect',{x,y,width:tw,height:th,rx:Math.min(12*scale,12),fill:t.color||'#ffffff',stroke,'stroke-width':2,'data-mc-export-tile':t.id}));
  svg.appendChild(mcSvgEl('text',{x:x+tw/2,y:y+th/2+7*scale,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':Math.max(8,20*scale),'font-weight':800,fill:textColour(t.color||'#ffffff')},t.text));
});
svg.appendChild(mcSvgEl('text',{x:W-36,y:H-14,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
return svg;
}
function exportTargetSvg(){
if(challenge&&X?.composeChallengeCardSvg)return X.composeChallengeCardSvg(numberChallengeSvg(),{title:N.titles[challenge.type],prompt:challenge.prompt,responseLabel:'Answer / working',responseLines:2,brand:'99 Club Studio'});
if(exportMode!=='task'||!X?.composeChallengeCardSvg)return canvasExportSvg();
return X.composeChallengeCardSvg(canvasExportSvg(),{
title:String(taskTitle||'Number tiles task').trim()||'Number tiles task',
prompt:String(taskPrompt||'').trim(),
responseLabel:'Working / answer',
responseLines,
brand:'99 Club Studio'
});
}
function exportMessage(text){exportStatus=text;const el=q('#mc-export-status');if(el)el.textContent=text}
async function exportAction(kind){
try{
if(!X)throw new Error('Export tools are not available.');
const target=exportTargetSvg(),name=exportMode==='task'?'maths-canvas-task':'maths-canvas';
if(kind==='copy'){await X.copyPng(target);exportMessage(exportMode==='task'?'Task card copied — paste it into your worksheet, slide or document.':'Canvas copied — paste it into your slide or document.')}
if(kind==='png'){await X.downloadPng(target,name,2);exportMessage(exportMode==='task'?'Task PNG downloaded.':'Canvas PNG downloaded.')}
if(kind==='svg'){X.downloadSvg(target,name);exportMessage(exportMode==='task'?'Task SVG downloaded.':'Canvas SVG downloaded.')}
if(kind==='print'){X.printSvg(target,{title:'',landscape:false});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
}catch(err){exportMessage(err?.message||'That export did not work.')}
}
function exportControlsHtml(){
if(challenge)return '<div class="nl-panel-title"><div><strong>Export challenge</strong><span>The original unanswered question, ready for paper.</span></div></div><div class="nl-export-grid"><button class="gd-btn gd-btn--primary" id="mc-copy-image" type="button">Copy challenge</button><button class="gd-btn" id="mc-png" type="button">PNG</button><button class="gd-btn" id="mc-svg-download" type="button">SVG</button><button class="gd-btn" id="mc-print" type="button">Print / PDF</button></div><p class="gd-help" id="mc-export-status" role="status">'+esc(exportStatus)+'</p>';
return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export the clean canvas or turn it into a pupil-ready task card.</span></div></div>'+
'<div class="nl-export-mode" role="tablist" aria-label="Number and symbol tiles export content">'+
'<button type="button" class="'+(exportMode==='canvas'?'is-active':'')+'" data-mc-export-mode="canvas">Canvas only</button>'+
'<button type="button" class="'+(exportMode==='task'?'is-active':'')+'" data-mc-export-mode="task">Task card</button></div>'+
(exportMode==='task'
?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="mc-response-lines">'+[1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+'</select></label><p class="gd-help">The card uses your current canvas arrangement, task title and pupil instructions.</p>'
:'<p class="gd-help">Canvas-only export keeps the tile arrangement and colours without editor controls.</p>')+
'<div class="nl-export-grid"><button class="gd-btn gd-btn--primary" id="mc-copy-image" type="button">Copy '+(exportMode==='task'?'task':'image')+'</button>'+
'<button class="gd-btn" id="mc-png" type="button">PNG</button><button class="gd-btn" id="mc-svg-download" type="button">SVG</button><button class="gd-btn" id="mc-print" type="button">Print / PDF</button></div>'+
'<p class="gd-help" id="mc-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
}
function challengeControlsHtml(){
 return field('Difficulty','<select class="gd-select" id="mc-difficulty">'+['easy','medium','hard'].map(v=>'<option value="'+v+'"'+(difficulty===v?' selected':'')+'>'+v[0].toUpperCase()+v.slice(1)+'</option>').join('')+'</select>')+
 CK.nativeRandomHtml('mc',N.groups)+N.groups.map(g=>'<div class="gd-section-title">'+esc(g.label)+'</div><div class="gd-row">'+g.ids.map(id=>'<button type="button" class="gd-btn" data-mc-challenge-mode="'+id+'">'+esc(N.titles[id])+'</button>').join('')+'</div>').join('')+(challenge?btn('Exit challenge','mc-exit-challenge'):'');
}
function controlsHtml(){return workflowTabs()+(workflow==='challenge'&&N?challengeControlsHtml():workflow==='task'?taskControlsHtml():workflow==='export'?exportControlsHtml():buildControlsHtml())}
function renderControls(){q('#gd-controls').innerHTML=controlsHtml();bindControls()}
function bindControls(){
const controls=q('#gd-controls');if(!controls)return;
qa('[data-mc-workflow]',controls).forEach(button=>button.onclick=()=>{workflow=button.dataset.mcWorkflow;exportStatus='';if(workflow==='build'||workflow==='task'){challenge=null;exportMode='canvas'}renderControls();controller?.refresh()});
if(workflow==='challenge'&&N){
 const level=q('#mc-difficulty',controls);if(level)level.onchange=()=>{difficulty=level.value;if(difficulty!=='custom')numberSettings=N.settings({},difficulty);generationError='';renderControls()};
 const change=()=>{difficulty='custom';numberSettings=N.settings(numberSettings,difficulty);generationError='';renderControls()};
 qa('[data-mc-setting]',controls).forEach(el=>el.onchange=()=>{numberSettings[el.dataset.mcSetting]=Number(el.value);change()});
 qa('[data-mc-toggle]',controls).forEach(el=>el.onchange=()=>{const key=el.dataset.mcToggle,values=new Set(numberSettings[key]);if(el.checked)values.add(el.value);else values.delete(el.value);numberSettings[key]=[...values];change()});
 qa('[data-mc-challenge-mode]',controls).forEach(b=>b.onclick=()=>generateNumberChallenge(b.dataset.mcChallengeMode));const exit=q('#mc-exit-challenge',controls);if(exit)exit.onclick=exitNumberChallenge;return}
if(workflow==='build'){
qa('[data-mc-add]',controls).forEach(x=>x.onclick=()=>add(x.dataset.mcAdd,false));
qa('[data-mc-sym]',controls).forEach(x=>x.onclick=()=>add(x.dataset.mcSym,true));
const addButton=q('#mc-add');if(addButton)addButton.onclick=()=>{const input=q('#mc-custom'),v=input.value.trim();if(v){add(v,false);input.value=''}};
const clear=q('#mc-clear');if(clear)clear.onclick=()=>{if(!tiles.length)return;if(!window.confirm('Clear all tiles from this canvas?'))return;controller.mutate(()=>{tiles=[];colourOpen=false;addOpen=false})};
return;
}
if(workflow==='task'){
const title=q('#mc-task-title');if(title)title.oninput=()=>{taskTitle=title.value.slice(0,100);controller?.refresh()};
const prompt=q('#mc-task-prompt');if(prompt)prompt.oninput=()=>{taskPrompt=prompt.value.slice(0,500);controller?.refresh()};
return;
}
qa('[data-mc-export-mode]',controls).forEach(button=>button.onclick=()=>{exportMode=button.dataset.mcExportMode==='task'?'task':'canvas';exportStatus='';renderControls()});
const response=q('#mc-response-lines');if(response)response.onchange=()=>{responseLines=clamp(Math.round(num(response.value,2)),1,4);renderControls()};
const copy=q('#mc-copy-image');if(copy)copy.onclick=()=>exportAction('copy');
const png=q('#mc-png');if(png)png.onclick=()=>exportAction('png');
const svg=q('#mc-svg-download');if(svg)svg.onclick=()=>exportAction('svg');
const print=q('#mc-print');if(print)print.onclick=()=>exportAction('print');
}
setPanels(controlsHtml(),'');
controller=I.mount({
getItems:()=>tiles,
getState:stateSnapshot,
setState:restoreState,
getCanvas:()=>q('#mc-canvas'),
getActionRoot:()=>q('#gd-stage'),
render:draw,
canAction:()=>!challenge,
afterRender:()=>{if(!challenge)return;const stage=q('#gd-stage');const another=q('[data-challenge-action="another"]',stage),exit=q('[data-challenge-action="end"]',stage),reveal=q('[data-board-action="reveal"]',stage);if(another)another.onclick=()=>{const pool=N.available(numberSettings,difficulty).flatMap(g=>g.ids);generateNumberChallenge(pool.includes(challenge.type)?challenge.type:pool[0]||challenge.type)};if(exit)exit.onclick=exitNumberChallenge;if(reveal)reveal.onclick=()=>{challenge.revealed=!challenge.revealed;controller.refresh()}},
snap:()=>grid?20:1,
nudgeStep:()=>grid?20:1,
constrain:constrainTile,
duplicate:duplicateTile,
remove:item=>{tiles=tiles.filter(t=>t!==item);colourOpen=false;combineOpen=false;splitOpen=false},
setColour:(item,colour)=>{item.color=colour;colourOpen=false},
toggleLock:item=>{item.locked=!item.locked;colourOpen=false;combineOpen=false;splitOpen=false},
onAction:(action,api,button)=>{
if(action==='add'){addOpen=!addOpen;colourOpen=false;combineOpen=false;splitOpen=false;api.refresh()}
else if(action==='add-tile'){add(button?.dataset?.mcValue||'',button?.dataset?.mcSymbol==='true')}
else if(action==='close-tiles'){addOpen=false;api.refresh()}
else if(action==='combine'){combineOpen=!combineOpen;splitOpen=false;colourOpen=false;addOpen=false;api.refresh()}
else if(action==='split'){splitOpen=!splitOpen;combineOpen=false;colourOpen=false;addOpen=false;api.refresh()}
else if(action==='combine-with'){combineTiles(api.selected(),selectedTile(button?.dataset?.mcOther))}
else if(action==='split-into'){splitTile(api.selected(),button?.dataset?.mcParts)}
else if(action==='colour'){colourOpen=!colourOpen;addOpen=false;combineOpen=false;splitOpen=false;api.refresh()}
else if(action==='grid'){api.mutate(()=>{grid=!grid;colourOpen=false;addOpen=false;combineOpen=false;splitOpen=false})}
},
onSelectionChange:item=>{
  if(!item){colourOpen=false;combineOpen=false;splitOpen=false;return}
  // Adding or selecting a tile must not dismiss the reusable tile palette.
}
});
bindControls();
controller.refresh();
G.lessonState?.register('maths-canvas',()=>({diagram:stateSnapshot(),workflow,taskTitle,taskPrompt,exportMode,responseLines,difficulty,numberSettings,challenge,pupil:CK?.capturePupil?.(challenge)}),saved=>{
 restoreState(saved.diagram);difficulty=['easy','medium','hard','custom'].includes(saved.difficulty)?saved.difficulty:'medium';numberSettings=N.settings(saved.numberSettings||{},difficulty);generationError='';challenge=saved.challenge&&N?.titles[saved.challenge.type]?CK.normalise(saved.challenge):null;CK?.restorePupil?.(challenge,saved.pupil);workflow=saved.workflow==='challenge'&&!N?'build':saved.workflow;taskTitle=String(saved.taskTitle||'');taskPrompt=String(saved.taskPrompt||'');exportMode=saved.exportMode;responseLines=saved.responseLines;
 q('#gd-controls').innerHTML=controlsHtml();bindControls();controller.refresh();
});
}

Object.assign(G,{coordinateTool,measurementTool,randomiser,balanceTool,timesTableVisual,factorExplorer,fdpExplorer,geoboard,mathsCanvas});
})(window.TT99Goodies);
