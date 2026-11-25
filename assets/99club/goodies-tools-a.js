(function(G){
'use strict';
if(!G)return;
const {q,qa,esc,clamp,num,money,field,btn,setPanels}=G;
function numberLine(){let s={min:-10,max:20,step:1,marker:5};function draw(){s.min=num(q('#nl-min').value,s.min);s.max=num(q('#nl-max').value,s.max);if(s.max<=s.min)s.max=s.min+1;s.step=Math.max(.1,num(q('#nl-step').value,s.step));s.marker=clamp(num(q('#nl-marker').value,s.marker),s.min,s.max);q('#nl-marker').min=s.min;q('#nl-marker').max=s.max;q('#nl-marker').step=s.step;const range=s.max-s.min,n=Math.floor(range/s.step);const maxTicks=50,skip=Math.max(1,Math.ceil(n/maxTicks));let html='<div class="gd-vis"><div class="gd-numberline"><div class="gd-numberline__line"></div>';for(let i=0;i<=n;i+=skip){const v=s.min+i*s.step,p=(v-s.min)/range*100;html+=`<span class="gd-numberline__tick" style="left:${p}%"></span><span class="gd-numberline__label" style="left:${p}%">${Number(v.toFixed(4))}</span>`}const p=(s.marker-s.min)/range*100;html+=`<span class="gd-numberline__marker" style="left:${p}%">${Number(s.marker.toFixed(2))}</span></div><div class="gd-readout">Marker: ${Number(s.marker.toFixed(2))}</div></div>`;q('#gd-stage').innerHTML=html}
setPanels(`${field('Minimum','<input class="gd-input" id="nl-min" type="number" value="-10">')}${field('Maximum','<input class="gd-input" id="nl-max" type="number" value="20">')}${field('Step','<input class="gd-input" id="nl-step" type="number" min="0.1" step="0.1" value="1">')}${field('Move marker','<input class="gd-input" id="nl-marker" type="range" value="5">')}<div class="gd-row">${btn('− step','nl-down')}${btn('+ step','nl-up')}</div><p class="gd-help">Change the range for negatives, decimals or larger-number work.</p>`,'');['nl-min','nl-max','nl-step','nl-marker'].forEach(id=>q('#'+id).addEventListener('input',draw));q('#nl-down').onclick=()=>{q('#nl-marker').value=clamp(num(q('#nl-marker').value)-s.step,s.min,s.max);draw()};q('#nl-up').onclick=()=>{q('#nl-marker').value=clamp(num(q('#nl-marker').value)+s.step,s.min,s.max);draw()};draw()}

  const PLACE_CATALOG=[
    {power:7,label:'10,000,000',name:'ten millions',value:10000000,color:'#cbd9ef'},
    {power:6,label:'1,000,000',name:'millions',value:1000000,color:'#ceddf2'},
    {power:5,label:'100,000',name:'hundred thousands',value:100000,color:'#c9dbf2'},
    {power:4,label:'10,000',name:'ten thousands',value:10000,color:'#c9dbf2'},
    {power:3,label:'1,000',name:'thousands',value:1000,color:'#d7cef0'},
    {power:2,label:'100',name:'hundreds',value:100,color:'#f0cfda'},
    {power:1,label:'10',name:'tens',value:10,color:'#f2d9bf'},
    {power:0,label:'1',name:'ones',value:1,color:'#f3df86'},
    {power:-1,label:'0.1',name:'tenths',value:.1,color:'#cce6dc'},
    {power:-2,label:'0.01',name:'hundredths',value:.01,color:'#cde2ee'},
    {power:-3,label:'0.001',name:'thousandths',value:.001,color:'#c9ddec'}
  ];
  const PLACE_RANGES=[
    {id:'millions',label:'10,000,000 → 10',start:0,end:6},
    {id:'whole',label:'1,000,000 → 1',start:1,end:7},
    {id:'thousands',label:'1,000 → 1',start:4,end:7},
    {id:'standard',label:'10,000 → 0.01',start:3,end:9},
    {id:'decimals',label:'1,000 → 0.001',start:4,end:10}
  ];
  const PV_CATEGORIES=[
    {id:'read',label:'Read & place value'},
    {id:'build',label:'Build & regroup'},
    {id:'reason',label:'Reasoning'}
  ];
  const PV_TEMPLATES=[
    {id:'read-number',category:'read',title:'Read the number',desc:'Work out the number represented by the counters.'},
    {id:'digit-value',category:'read',title:'Value of a digit',desc:'Use the board to identify a digit\'s place value.'},
    {id:'build-number',category:'build',title:'Build the number',desc:'Make a target number with place-value counters.'},
    {id:'non-standard',category:'build',title:'Non-standard representation',desc:'Interpret a value before regrouping it.'},
    {id:'zero-placeholder',category:'reason',title:'Zero placeholder',desc:'Diagnose a common place-value misconception.'}
  ];

const PV_ACTIVITIES={build:'Build the target',exact:'Exact counters',regroup:'Regroup',same:'Same value, different way',read:'Read the number (activity)',hidden:'Hidden place',digit:'Digit value (activity)',add:'Addition'};
function pvSettings(model={}){
 const d=model.diagram||model, preset=PLACE_RANGES.find(r=>r.id===d.placeRange)||PLACE_RANGES.find(r=>r.id==='standard');
 const a=Number.isInteger(d.rangeStart)?Math.max(0,Math.min(PLACE_CATALOG.length-2,d.rangeStart)):preset.start,b=Number.isInteger(d.rangeEnd)?Math.max(a+1,Math.min(a+6,PLACE_CATALOG.length-1,d.rangeEnd)):Math.min(a+6,preset.end);
 return {rangeStart:a,rangeEnd:b,activityBudget:Math.max(3,Math.min(9,Math.round(Number(model.activityBudget)||5))),additionDifficulty:['mixed','no-regroup','regroup'].includes(model.additionDifficulty)?model.additionDifficulty:'mixed',responseLines:Math.max(1,Math.min(4,Math.round(Number(model.responseLines)||1)))};
}
function pvModel(settings,rng=Math.random){
 const cfg=pvSettings(settings),places=PLACE_CATALOG.slice(cfg.rangeStart,cfg.rangeEnd+1),additionDifficulty=cfg.additionDifficulty;
 const fractionDigits=()=>Math.max(0,-places.at(-1).power),valueStep=()=>places.at(-1).value,valueScale=()=>10**fractionDigits(),rangeMax=()=>places[0].value*10-valueStep();
 const clean=v=>Math.round((Number(v)||0)*valueScale())/valueScale(),normaliseValue=v=>clean(Math.round((Number(v)||0)/valueStep())*valueStep()),format=v=>clean(v).toLocaleString('en-GB',{maximumFractionDigits:fractionDigits()});
 let cs=Array(places.length).fill(0),challenge;
 const counts=()=>cs.slice(),buildFromNumber=v=>{cs=digitsForValue(Math.max(0,Math.min(rangeMax(),v)));return v};
 function makeNonStandardActivity(v){buildFromNumber(v);const candidates=cs.map((n,i)=>n>0&&i<cs.length-1?i:-1).filter(i=>i>=0);if(!candidates.length)return false;const i=candidates[Math.floor(rng()*candidates.length)];cs[i]--;cs[i+1]+=10;return true}
 function challengeObject(type,prompt,answer,extra={}){return{mode:'standard',type,category:PV_TEMPLATES.find(t=>t.id===type)?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),answerMode:'bound',answerSource:'',revealed:false,...extra}}
   function randomBoardValue({decimal=true,min=valueStep(),max=rangeMax()}={}){
    const step=decimal||rangeMax()<1?valueStep():Math.max(1,valueStep());
    const last=Math.max(1,Math.floor(Math.min(rangeMax(),Math.max(max,20*step))/step+1e-8));
    let first=Math.max(1,Math.ceil(min/step-1e-8));
    if(first>=last)first=Math.max(1,Math.floor(last/4));
    const pick=first+Math.floor(rng()*(last-first+1));
    return normaliseValue(pick*step);
  }

   function digitsForValue(value){
    const scale=valueScale(),units=Math.round(normaliseValue(value)*scale);
    return places.map(place=>{
      const unitValue=Math.max(1,Math.round(place.value*scale));
      return Math.floor(units/unitValue)%10;
    });
  }
  function valueFromDigits(digits){
    return normaliseValue((digits||[]).reduce((sum,digit,index)=>sum+(Number(digit)||0)*(places[index]?.value||0),0));
  }
  function additionNeedsRegroup(a,b){
    const ad=digitsForValue(a),bd=digitsForValue(b);
    return ad.some((digit,index)=>digit+(bd[index]||0)>=10);
  }
  function randomAdditionProblem(){
    const wholeIndexes=places.map((place,index)=>({place,index})).filter(x=>x.place.value>=1).map(x=>x.index);
    const eligible=(wholeIndexes.length?wholeIndexes:places.map((_,index)=>index)).slice(-4);
    for(let attempt=0;attempt<160;attempt++){
      const ad=Array(places.length).fill(0),bd=Array(places.length).fill(0);
      for(const i of eligible){
        ad[i]=Math.floor(rng()*8);
        bd[i]=Math.floor(rng()*7);
        if(additionDifficulty==='no-regroup'&&ad[i]+bd[i]>9)bd[i]=Math.max(0,9-ad[i]);
      }
      if(!ad.some(Boolean))ad[places.length-1]=2+Math.floor(rng()*5);
      if(!bd.some(Boolean))bd[places.length-1]=1+Math.floor(rng()*5);
      const a=valueFromDigits(ad),b=valueFromDigits(bd),sum=normaliseValue(a+b),regroup=additionNeedsRegroup(a,b);
      if(a<=0||b<=0||sum>rangeMax())continue;
      if(additionDifficulty==='regroup'&&!regroup)continue;
      if(additionDifficulty==='no-regroup'&&regroup)continue;
      return{a,b,sum};
    }
    const step=valueStep(),a=normaliseValue((additionDifficulty==='regroup'?6:2)*step),b=normaliseValue((additionDifficulty==='regroup'?7:3)*step);
    return{a,b,sum:normaliseValue(a+b)};
  }

 function standard(type){
    if(type==='read-number'){
      const value=randomBoardValue({decimal:true,min:12,max:9999});
      buildFromNumber(value);
      challenge=challengeObject(type,'What number is represented by the place-value counters?',format(value),{hiddenSummary:['total','expanded']});
    }else if(type==='build-number'){
      const target=randomBoardValue({decimal:true,min:10,max:9999});
      cs=Array(places.length).fill(0);
      challenge=challengeObject(type,'Build '+format(target)+' using the place-value counters. Use the live total to check your work.',format(target));
    }else if(type==='digit-value'){
      const placeIndex=1+Math.floor(rng()*(places.length-1)),digit=2+Math.floor(rng()*7);
      const digits=Array(places.length).fill(0);
      digits[placeIndex]=digit;
      const supportIndex=placeIndex===0?1:0;
      digits[supportIndex]=digits[supportIndex]===digit?1:1+Math.floor(rng()*4);
      const value=clean(digits.reduce((sum,d,i)=>sum+d*places[i].value,0));
      buildFromNumber(value);
      challenge=challengeObject(type,'What is the value of the digit '+digit+' in the '+places[placeIndex].name+' column?',format(digit*places[placeIndex].value),{hiddenSummary:['total','expanded']});
    }else if(type==='non-standard'){
      let value=randomBoardValue({decimal:false,min:Math.max(120,10*valueStep()),max:8999});
      for(let attempt=0;attempt<24;attempt++){if(makeNonStandardActivity(value))break;value=randomBoardValue({decimal:true,min:10*valueStep(),max:Math.max(20*valueStep(),8999)})}
      if(!cs.some(v=>v>9)){value=places[places.length-2].value;makeNonStandardActivity(value)}
      challenge=challengeObject(type,'This is a non-standard representation. What number does it represent? Regroup it to check.',format(value),{hiddenSummary:['total','expanded']});
    }else{
      const digits=Array(places.length).fill(0).map(()=>1+Math.floor(rng()*8));
      const zeroIndex=1+Math.floor(rng()*Math.max(1,places.length-2));
      digits[zeroIndex]=0;
      const value=normaliseValue(digits.reduce((sum,d,i)=>sum+d*places[i].value,0));
      buildFromNumber(value);
      challenge=challengeObject(type,'Write the number represented. Explain what the empty '+places[zeroIndex].name+' column tells you.','The number is '+format(value)+'. The zero means there are no counters in the '+places[zeroIndex].name+' column.',{hiddenSummary:['total','expanded']});
    }

    challenge.paperStartCounts=counts();return {type,settings:cfg,challenge};
 }
 function activity(mode){
   const budget=cfg.activityBudget,n=places.length,zero=()=>Array(n).fill(0),pick=a=>a[Math.min(a.length-1,Math.floor(rng()*a.length))];
   let target=randomBoardValue({decimal:fractionDigits()>0,min:10*valueStep(),max:Math.min(rangeMax(),places[0].value*3)}),start=digitsForValue(target),answer=null,index=-1,digit=0,additionA=0,additionB=0;
   if(mode==='add'){const problem=randomAdditionProblem();additionA=problem.a;additionB=problem.b;target=problem.sum;start=digitsForValue(additionA)}
   else if(mode==='exact'){const d=zero();for(let i=0;i<budget;i++)d[Math.floor(rng()*n)]++;target=valueFromDigits(d);start=zero()}
   else if(mode==='build'){start=zero()}
   else if(mode==='regroup'||mode==='same'){
     if(!start.slice(0,-1).some(Boolean)){target=places[n-2].value;start=digitsForValue(target)}
     if(mode==='regroup'){const i=pick(start.map((v,i)=>v&&i<n-1?i:-1).filter(i=>i>=0));start[i]--;start[i+1]+=10}
   }else{
     let pool=start.map((v,i)=>v?i:-1).filter(i=>i>=0);
     if(mode==='digit'){const candidates=pool.filter(i=>places[i].value!==1);if(candidates.length)pool=candidates}
     index=pick(pool);digit=start[index];answer=mode==='read'?target:mode==='hidden'?digit:clean(digit*places[index].value);
   }
   return {type:'activity-'+mode,settings:cfg,activity:{activityMode:mode,activityTarget:target,activityBudget:budget,activityAnswer:answer,activityHiddenIndex:index,activityDigit:digit,activityStartCounts:start.slice(),paperActivityStart:start.slice(),additionA,additionB,additionDifficulty:cfg.additionDifficulty}};
 }
 return {places,format,digitsForValue,standard,activity};
}
function pvPaper(data,teacher=false){
 const {places,format,digitsForValue}=pvModel(data.settings),X=G.exportTools,responseLines=data.settings.responseLines;
 const challenge=data.challenge||null,activity=data.activity||{}, {activityMode,activityTarget,activityBudget,activityAnswer,activityHiddenIndex,activityDigit,activityStartCounts=[],paperActivityStart,additionA,additionB,powerMessage=''}=activity;
 const counts=()=>data.counts||challenge?.paperStartCounts||paperActivityStart||Array(places.length).fill(0);
 const representationNoun=()=>'place-value counters';
   function pvSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }

   function paperAlternative(cs){
    const next=cs.slice(),index=next.findIndex((n,i)=>n>0&&i<next.length-1);
    if(index<0)return null;
    next[index]--;next[index+1]+=10;return next;
  }
  function paperChart(cs,{label='',blank=false,hidden=-1,highlight=-1}={}){
    const W=1000,pad=16,colW=(W-pad*2)/places.length,top=label?40:8,head=60;
    const perRow=places.length>5?3:4,maxCount=Math.max(1,...cs.map((n,i)=>i===hidden?0:n));
    const pitch=Math.min(34,colW/(perRow+.55)),radius=pitch*.36;
    const body=blank?Math.max(190,Math.ceil(19/perRow)*pitch+22):Math.max(108,Math.ceil(maxCount/perRow)*pitch+22),H=top+head+body+10;
    const svg=pvSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':label||'Place value counters'});
    const add=(tag,attrs,txt)=>svg.appendChild(pvSvgEl(tag,attrs,txt));
    add('rect',{width:W,height:H,fill:'#fff'});
    if(label)add('text',{x:pad,y:26,'font-family':'Arial,sans-serif','font-size':20,'font-weight':700,fill:'#52666d'},label);
    places.forEach((place,i)=>{
      const x=pad+i*colW,decimal=i>0&&place.value<1&&places[i-1].value>=1;
      add('rect',{x,y:top,width:colW,height:head,fill:i===highlight?'#fff6cf':'#f3f7f7'});
      if(i>0)add('line',{x1:x,y1:top,x2:x,y2:top+head+body,stroke:decimal?'#627b82':'#c5d2d5','stroke-width':decimal?3:1.4});
      add('text',{x:x+colW/2,y:top+24,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':Math.min(21,colW/6),'font-weight':800,fill:'#2d454d'},place.label);
      add('text',{x:x+colW/2,y:top+44,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':Math.min(13,colW/10),fill:'#61767c'},place.name);
      if(i===hidden){add('text',{x:x+colW/2,y:top+head+body/2+8,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':30,'font-weight':700,fill:'#64777d'},'?');return}
      if(blank)return;
      for(let j=0;j<(cs[i]||0);j++){
        const cx=x+colW/2+(j%perRow-(perRow-1)/2)*pitch,cy=top+head+11+pitch/2+Math.floor(j/perRow)*pitch;
        add('circle',{cx,cy,r:radius,fill:place.color,stroke:'#6d8288','stroke-width':1.4,'data-pv-paper-counter':'1','data-place':i});
        add('circle',{cx,cy,r:radius*.34,fill:'#fff','fill-opacity':.62});
      }
    });
    add('line',{x1:pad,y1:top+head,x2:W-pad,y2:top+head,stroke:'#aebdc1','stroke-width':1.5});
    add('rect',{x:pad,y:top,width:W-pad*2,height:head+body,rx:5,fill:'none',stroke:'#8fa5aa','stroke-width':2});
    return svg;
  }
  function stackPaperCharts(charts){
    if(charts.length===1)return charts[0];
    const heights=charts.map(chart=>Number(chart.getAttribute('viewBox').split(' ')[3])),gap=14,H=heights.reduce((a,b)=>a+b,0)+gap*(charts.length-1);
    const svg=pvSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 1000 '+H,role:'img','aria-label':'Starting and final place value charts'});
    let y=0;charts.forEach((chart,i)=>{const group=pvSvgEl('g',{transform:'translate(0 '+y+')'});[...chart.childNodes].forEach(node=>group.appendChild(node.cloneNode(true)));svg.appendChild(group);y+=heights[i]+gap});return svg;
  }

   function activityDescriptor(){
    if(activityMode==='build')return{title:'Build the target',prompt:'Build '+format(activityTarget)+' with the '+representationNoun()+'.'};
    if(activityMode==='exact')return{title:'Exact counters',prompt:'Make '+format(activityTarget)+' using exactly '+activityBudget+' counters.'};
    if(activityMode==='regroup')return{title:'Regroup',prompt:'Regroup this non-standard representation into standard place-value digits without changing its value.'};
    if(activityMode==='same')return{title:'Same value, different way',prompt:'Show '+format(activityTarget)+' in a different way. Keep the value exactly the same.'};
    if(activityMode==='read')return{title:'Read the number',prompt:'What number is represented by the '+representationNoun()+'?'};
    if(activityMode==='hidden')return{title:'Hidden place',prompt:'This representation shows '+format(activityTarget)+'. How many '+(places[activityHiddenIndex]?.name||'place-value')+' units are hidden?'};
    if(activityMode==='digit')return{title:'Digit value',prompt:'What is the value of the digit '+activityDigit+' in the '+(places[activityHiddenIndex]?.name||'selected')+' column?'};
    if(activityMode==='add')return{title:'Addition',prompt:'Start with '+format(additionA)+'. Add '+format(additionB)+'.'};
    return{title:'Place value',prompt:''};
  }

   function activityPaper(teacher){
    const descriptor=activityDescriptor(),mode=activityMode,zeros=Array(places.length).fill(0),target=digitsForValue(activityTarget);
    const initial=mode==='add'?digitsForValue(additionA):mode==='same'&&activityStartCounts.length===places.length?activityStartCounts.slice():paperActivityStart?.length===places.length?paperActivityStart.slice():mode==='regroup'?(paperAlternative(target)||target):target;
    let charts=[],prompt=descriptor.prompt.replace(/linked counter chart and place-value frame|place-value bead frame/g,'place-value counters'),responseMode='none',responseLabel='Answer',answer='';
    if(['read','hidden','digit'].includes(mode)){
      charts=[paperChart(initial,{hidden:mode==='hidden'&&!teacher?activityHiddenIndex:-1,highlight:mode==='digit'?activityHiddenIndex:-1})];responseMode='box';answer=format(activityAnswer);
    }else if(['build','exact','regroup','same','add'].includes(mode)){
      let solution=target.slice();
      if(mode==='same')solution=paperAlternative(initial)||target.slice();
      if(mode==='exact'){
        while(solution.reduce((a,b)=>a+b,0)<activityBudget){const next=paperAlternative(solution);if(!next||next.reduce((a,b)=>a+b,0)>activityBudget)break;solution=next}
      }
      if(['regroup','same','add'].includes(mode))charts.push(paperChart(initial,{label:'Starting representation'}));
      prompt+=' '+(teacher?'':'Draw counters in the final chart. ')+(mode==='same'?'Exchange one counter for ten in the next column, or use another valid exchange.':mode==='regroup'?'Use no more than nine counters in each column.':mode==='add'?'Exchange ten counters for one in the next place when needed.':'');
      charts.push(paperChart(teacher?solution:zeros,{label:teacher?(mode==='same'?'One possible solution':'Completed chart'):'Your representation',blank:!teacher}));
      if(mode==='add'){responseMode='box';responseLabel='Final number';answer=format(activityTarget)}
      if(mode==='same')answer='Other representations are correct if the total stays '+format(activityTarget)+' and the counters differ from the starting chart.';
      if(mode==='exact')answer='Use exactly '+activityBudget+' counters.';
    }else{
      charts=[paperChart(counts())];prompt=powerMessage||'Explain what happens to the digits when the number is multiplied or divided by a power of ten.';responseMode='lines';responseLabel='Explain your thinking';
    }
    return X.composeWorksheetCardSvg(stackPaperCharts(charts),{title:descriptor.title+(teacher?' · Teacher key':''),prompt,responseLabel,responseMode,responseLines:2,paperStyle:'plain',answer,showAnswer:teacher,diagramMaxHeight:charts.length>1?850:500});
  }

 if(activityMode)return activityPaper(teacher);
 if(challenge){
      const meta=PV_TEMPLATES.find(t=>t.id===challenge.type),type=challenge.type;
      let prompt=challenge.prompt||'',mode=type==='build-number'?'none':challenge.category==='reason'?'lines':'box',charts=[];
      const initial=challenge.paperStartCounts?.length===places.length?challenge.paperStartCounts.slice():counts();
      if(type==='build-number'){
        const target=Number(String(challenge.answer).replace(/,/g,''));
        prompt='Draw counters to show '+format(target)+'.';
        charts=[paperChart(teacher?digitsForValue(target):Array(places.length).fill(0),{blank:!teacher})];
      }else if(type==='non-standard'){
        prompt='What number does the starting chart represent? Regroup it in the final chart, using no more than nine counters per column.';
        const target=Number(String(challenge.answer).replace(/,/g,''));
        charts=[paperChart(initial,{label:'Starting representation'}),paperChart(teacher?digitsForValue(target):Array(places.length).fill(0),{label:teacher?'Regrouped chart':'Your regrouped chart',blank:!teacher})];
      }else charts=[paperChart(initial)];
      return X.composeWorksheetCardSvg(stackPaperCharts(charts),{title:(challenge.title||meta?.title||'Place Value challenge')+(teacher?' · Teacher key':''),prompt,responseLabel:challenge.category==='reason'?'Explain your thinking':'Answer',responseLines:challenge.category==='reason'?Math.max(2,Math.min(4,responseLines)):1,responseMode:mode,paperStyle:'plain',answer:type==='build-number'?'':challenge.answer||'',showAnswer:teacher,diagramMaxHeight:charts.length>1?850:500});
 }
 return paperChart(counts());
}
function pvGenerate(type,settings,rng=Math.random){
 const model=pvModel(settings,rng);return type.startsWith('activity-')?model.activity(type.slice(9)):model.standard(type);
}
const pvTypes=()=>[...PV_TEMPLATES.map(t=>({id:t.id,label:t.title})),...Object.entries(PV_ACTIVITIES).map(([id,label])=>({id:'activity-'+id,label}))];
G.placeValuePaperModel={settings:pvSettings,generate:pvGenerate,render:pvPaper,types:pvTypes};
if(G.publishing)G.publishing.register('place-value',{
 label:'Place value',types:pvTypes,title:item=>item.kind==='challenge'?pvTypes().find(t=>t.id===item.data.type)?.label||'Place value task':'Place value illustration',
 signature:d=>JSON.stringify([d.settings.rangeStart,d.settings.rangeEnd,d.type,d.challenge?.prompt,d.challenge?.paperStartCounts,d.activity?.activityTarget,d.activity?.paperActivityStart,d.activity?.activityHiddenIndex,d.activity?.additionA,d.activity?.additionB]),
 recipe:(model,type)=>({type,settings:pvSettings(model)}),
 generate(recipe,rng){const ids=pvTypes().map(t=>t.id),type=recipe.type==='all'?ids[Math.floor(rng()*ids.length)]:recipe.type;if(!ids.includes(type))throw Error('Unsupported place value question.');return pvGenerate(type,recipe.settings,rng)},
 capture(model,staticSvg){
   const settings=pvSettings(model);
   if(model.challenge?.mode==='custom')throw Error('Custom place value tasks are not yet supported in the document editor. Use the individual paper export.');
   if(model.challenge){
     if(!model.challenge.paperStartCounts?.length)throw Error('Regenerate this older challenge before adding it to a document.');
     const data={type:model.challenge.type,settings,challenge:{...model.challenge,revealed:false}};
     return [G.publishing.record('place-value','challenge',data,{type:data.type,settings})];
   }
   if(model.activityActive&&model.activityMode!=='powers'){
     const type='activity-'+model.activityMode,keys=['activityMode','activityTarget','activityBudget','activityAnswer','activityHiddenIndex','activityDigit','activityStartCounts','paperActivityStart','additionA','additionB','additionDifficulty'];
     const activity=Object.fromEntries(keys.map(k=>[k,model[k]])),data={type,settings,activity};
     return [G.publishing.record('place-value','challenge',data,{type,settings})];
   }
   if(staticSvg)return [G.publishing.record('place-value','diagram',{settings,svg:staticSvg})];
   const counts=Array(settings.rangeEnd-settings.rangeStart+1).fill(0);for(const t of model.diagram?.tokens||[])if(Number.isInteger(t.place)&&counts[t.place]!=null)counts[t.place]++;
   return [G.publishing.record('place-value','diagram',{settings,counts})];
 },
 render(item,teacher){if(item.data.svg)return new DOMParser().parseFromString(item.data.svg,'image/svg+xml').documentElement;return pvPaper(item.data,teacher)}
});

function placeValue(){
  const I=G.interaction,CK=G.challengeKit,X=G.exportTools;
  if(!I){q('#gd-stage').innerHTML='<p class="gd-empty">The interactive place-value board could not start.</p>';return;}
  let placeRange='standard',rangeStart=3,rangeEnd=9;
  let places=PLACE_CATALOG.slice(rangeStart,rangeEnd+1);
  const CHALLENGE_CATEGORIES=PV_CATEGORIES,CHALLENGE_TEMPLATES=PV_TEMPLATES;
  let tokens=[],next=1,controller=null,resizeObserver=null,resizeFrame=0,lastStageWidth=0,notice='';
  let controlTab='setup',challengeTab='standard',challengeCategory='read',challengeType='read-number',challenge=null,beforeChallenge=null;
  let representationMode='counters';
  let activityMode='powers',activityTarget=null,activityBudget=5,activityStatus='',powerMessage='',activityActive=false,activityContext='teach';
  let activityBefore=null;
  let activityInput='',activityAnswer=null,activityHiddenIndex=-1,activityDigit=0,activityStartCounts=[],activityPrompt='';
  let additionA=247,additionB=185,additionStep=0,additionDifficulty='mixed';
  let exportMode='diagram',responseLines=1,exportStatus='',paperActivityStart=null,representationOptionsOpen=false;

  function rangeFor(id=placeRange){return PLACE_RANGES.find(r=>r.id===id)||PLACE_RANGES.find(r=>r.id==='standard')}
  function applyPlaceWindow(start,end,id='custom'){
    let a=clamp(Math.round(num(start,3)),0,PLACE_CATALOG.length-2),b=clamp(Math.round(num(end,9)),a+1,PLACE_CATALOG.length-1);
    if(b-a>6)b=a+6;
    rangeStart=a;rangeEnd=b;placeRange=id;places=PLACE_CATALOG.slice(rangeStart,rangeEnd+1);
  }
  function setPlaceRange(id){
    const range=rangeFor(id);applyPlaceWindow(range.start,range.end??range.start+6,range.id);
  }
  function setCustomPlaceRange(start,end){
    applyPlaceWindow(start,end,'custom');
  }
  function fractionDigits(){return Math.max(0,-Math.min(...places.map(p=>p.power)))}
  function valueStep(){return places[places.length-1]?.value||1}
  function valueScale(){return 10**fractionDigits()}
  function rangeMax(){return Math.max(0,places[0].value*10-valueStep())}
  function clean(v){const scale=valueScale();return Math.round((Number(v)||0)*scale)/scale}
  function normaliseValue(v){const step=valueStep();return clean(Math.round((Number(v)||0)/step)*step)}
  function format(v){return clean(v).toLocaleString('en-GB',{minimumFractionDigits:0,maximumFractionDigits:fractionDigits()})}
  function counts(){const out=Array(places.length).fill(0);tokens.forEach(t=>{if(out[t.place]!=null)out[t.place]++});return out}
  function total(){return clean(tokens.reduce((sum,t)=>sum+(places[t.place]?.value||0),0))}
  function nonStandard(){return counts().some(n=>n>9)}
  function stateSnapshot(){return{tokens:JSON.parse(JSON.stringify(tokens)),next,placeRange,rangeStart,rangeEnd,representationMode}}
  function restoreState(value){
    if(Number.isInteger(value?.rangeStart)&&Number.isInteger(value?.rangeEnd))applyPlaceWindow(value.rangeStart,value.rangeEnd,value.placeRange||'custom');
    else setPlaceRange(value?.placeRange||'standard');
    tokens=Array.isArray(value?.tokens)?value.tokens.map(t=>({...t,place:clamp(Math.round(num(t.place,Math.min(4,places.length-1))),0,places.length-1)})):[];
    next=Math.max(1,Math.round(num(value?.next,1)));
    representationMode=['counters','abacus','both'].includes(value?.representationMode)?value.representationMode:representationMode;
    notice='';
  }
  function buildFromNumber(raw){
    const value=clamp(normaliseValue(num(raw,0)),0,rangeMax()),scale=valueScale(),units=Math.round(value*scale);
    tokens=[];next=1;
    places.forEach((placeMeta,place)=>{
      const unitValue=Math.max(1,Math.round(placeMeta.value*scale)),digit=Math.floor(units/unitValue)%10;
      for(let n=0;n<digit;n++)tokens.push({id:next++,place,x:0,y:0,locked:false});
    });
    layoutTokens();
    return value;
  }
  function challengeObject(type,prompt,answer,extra={}){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);
    const raw={mode:'standard',type,category:meta?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),answerMode:'bound',answerSource:'',revealed:false,...extra};
    return CK?CK.normalise(raw):raw;
  }
  function customAnswerSources(){
    const sources=[
      {id:'total',label:'Number represented'},
      {id:'expanded',label:'Board representation'}
    ];
    places.forEach((place,index)=>{
      sources.push({id:'count:'+index,label:'Number of '+place.name+' counters'});
      sources.push({id:'value:'+index,label:'Value in the '+place.name+' column'});
    });
    return sources;
  }
  function resolveAnswerSource(source){
    if(source==='total')return format(total());
    if(source==='expanded')return expandedText();
    const m=String(source||'').match(/^(count|value):(\d+)$/);
    if(!m)return '';
    const index=clamp(Math.round(num(m[2],0)),0,places.length-1),count=counts()[index]||0;
    return m[1]==='count'?String(count):format(clean(count*places[index].value));
  }
  function activityAnswerMode(){return activityActive&&['read','hidden','digit'].includes(activityMode)}
  function activityReadOnly(){return activityAnswerMode()}
  function activityTokenHidden(item){return activityActive&&activityMode==='hidden'&&Number(item?.place)===activityHiddenIndex}
  function hiddenSummaryText(){return activityAnswerMode()?'Hidden for task':'Hidden for challenge'}
  function summaryHidden(kind){
    if(activityAnswerMode())return true;
    if(!challenge||challenge.revealed)return false;
    if(Array.isArray(challenge.hiddenSummary)&&challenge.hiddenSummary.includes(kind))return true;
    return challenge.answerMode==='bound'&&challenge.answerSource===kind;
  }
  function columnCountHidden(index){
    if(activityAnswerMode())return true;
    if(!challenge||challenge.revealed)return false;
    const source=challenge.answerMode==='bound'?challenge.answerSource:'';
    return source==='count:'+index||source==='value:'+index;
  }
  function updateChallengeAnswer(){
    if(!challenge||challenge.answerMode!=='bound'||!challenge.answerSource)return;
    const nextAnswer=resolveAnswerSource(challenge.answerSource);
    if(nextAnswer!=='')challenge.answer=nextAnswer;
    const live=q('#pv-custom-live-answer');if(live)live.textContent=challenge.answer||'—';
    if(challenge.revealed){
      const shown=q('.gd-challenge-actions em',q('#gd-stage'));
      if(shown)shown.textContent='Answer: '+challenge.answer;
    }
  }
  function randomBoardValue({decimal=true,min=valueStep(),max=rangeMax()}={}){
    const step=decimal?valueStep():Math.max(1,valueStep()),high=Math.max(0,Math.min(rangeMax(),normaliseValue(max))),low=Math.min(high,Math.max(0,normaliseValue(min)));
    if(high<=low||Math.ceil(low/step)>Math.floor(high/step))return high;
    const first=Math.ceil(low/step),last=Math.floor(high/step),pick=first+Math.floor(Math.random()*Math.max(1,last-first+1));
    return normaliseValue(pick*step);
  }
  function restoreBeforeChallenge(){
    if(beforeChallenge){restoreState(beforeChallenge);beforeChallenge=null}
  }
  function clearChallenge(){
    restoreBeforeChallenge();
    challenge=null;challengeTab='standard';controlTab='challenge';
    renderControls();controller?.refresh();
  }
  function enterCustomChallenge(){
    activityActive=false;activityContext='challenge';
    if(CK){
      challenge=CK.makeCustom(challenge||{
        type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''
      });
    }else if(!challenge){
      challenge={mode:'custom',type:'custom',title:'Challenge',prompt:'Write your challenge here.',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:'',revealed:false};
    }
    challengeTab='custom';controlTab='challenge';renderControls();controller?.refresh();
  }
  function generateChallenge(type){
    const template=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!template)return;
    if(!beforeChallenge)beforeChallenge=stateSnapshot();else restoreState(beforeChallenge);
    notice='';
    const data=pvGenerate(type,{rangeStart,rangeEnd,activityBudget,additionDifficulty,responseLines});
    challenge=CK?CK.normalise(data.challenge):data.challenge;
    challenge.paperStartCounts=data.challenge.paperStartCounts.slice();
    tokens=[];next=1;
    challenge.paperStartCounts.forEach((count,place)=>{for(let i=0;i<count;i++)tokens.push({id:next++,place,x:0,y:0,locked:false})});layoutTokens();
    activityActive=false;challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';
    exportMode='challenge';responseLines=template.category==='reason'?3:1;exportStatus='';
    renderControls();controller?.select(null);controller?.refresh();
  }
  function setCustomAnswerSource(source){
    if(!challenge||challenge.mode!=='custom')return;
    if(source==='manual'){
      challenge.answerMode='manual';challenge.answerSource='';
    }else{
      challenge.answerMode='bound';challenge.answerSource=source;
      challenge.answer=resolveAnswerSource(source);
    }
    challenge.revealed=false;renderControls();controller?.refresh();
  }
  function standardDigits(){return counts().map(n=>Math.max(0,Math.min(9,Math.round(n||0))))}
  function powerFactor(steps){return Math.pow(10,Math.abs(steps))}
  function canPowerShift(steps){
    const current=total(),raw=current*Math.pow(10,steps),normal=normaliseValue(raw);
    return raw>=0&&raw<=rangeMax()&&Math.abs(raw-normal)<(valueStep()/1000+1e-9);
  }
  function applyPowerShift(steps){
    if(!canPowerShift(steps))return;
    const before=total(),after=normaliseValue(before*Math.pow(10,steps));
    controller.mutate(()=>{buildFromNumber(after);notice=''});
    controller.select(null);
    const factor=powerFactor(steps),direction=steps>0?'left':'right',verb=steps>0?'multiply':'divide';
    powerMessage=format(before)+' '+(steps>0?'×':'÷')+' '+factor+' = '+format(after)+'. Digits moved '+Math.abs(steps)+' place'+(Math.abs(steps)===1?'':'s')+' '+direction+'; the decimal point stayed fixed.';
    controller.refresh();renderControls();
  }
  function exactCounterTarget(budget){
    const countsByPlace=Array(places.length).fill(0),limit=clamp(Math.round(num(budget,5)),2,9);
    for(let n=0;n<limit;n++){
      let index=Math.floor(Math.random()*places.length),guard=0;
      while(countsByPlace[index]>=9&&guard++<30)index=Math.floor(Math.random()*places.length);
      countsByPlace[index]++;
    }
    return normaliseValue(countsByPlace.reduce((sum,count,index)=>sum+count*places[index].value,0));
  }
  function activityRandomTarget(){
    return randomBoardValue({decimal:fractionDigits()>0,min:Math.max(valueStep(),10*valueStep()),max:Math.min(rangeMax(),places[0].value*3)});
  }
  function splittableActivityTarget(){
    let target=activityRandomTarget(),candidate=-1;
    for(let attempt=0;attempt<24;attempt++){
      buildFromNumber(target);
      const cs=counts(),options=[];
      for(let i=0;i<places.length-1;i++)if(cs[i]>0)options.push(i);
      if(options.length){candidate=options[Math.floor(Math.random()*options.length)];break}
      target=activityRandomTarget();
    }
    if(candidate<0){target=places[places.length-2].value;buildFromNumber(target);candidate=places.length-2}
    return{target,candidate};
  }
  function makeNonStandardActivity(target){
    buildFromNumber(target);
    const cs=counts(),options=[];
    for(let i=0;i<places.length-1;i++)if(cs[i]>0&&tokens.length+9<=90)options.push(i);
    const source=options[Math.floor(Math.random()*options.length)]??-1;
    if(source<0)return false;
    const item=tokens.find(t=>t.place===source);
    if(!item)return false;
    tokens=tokens.filter(t=>t!==item);
    for(let n=0;n<10;n++)tokens.push({id:next++,place:source+1,x:0,y:0,locked:false});
    layoutTokens();return true;
  }
  function digitsForValue(value){
    const scale=valueScale(),units=Math.round(normaliseValue(value)*scale);
    return places.map(place=>{
      const unitValue=Math.max(1,Math.round(place.value*scale));
      return Math.floor(units/unitValue)%10;
    });
  }
  function valueFromDigits(digits){
    return normaliseValue((digits||[]).reduce((sum,digit,index)=>sum+(Number(digit)||0)*(places[index]?.value||0),0));
  }
  function additionNeedsRegroup(a,b){
    const ad=digitsForValue(a),bd=digitsForValue(b);
    return ad.some((digit,index)=>digit+(bd[index]||0)>=10);
  }
  function randomAdditionProblem(){
    const wholeIndexes=places.map((place,index)=>({place,index})).filter(x=>x.place.value>=1).map(x=>x.index);
    const eligible=(wholeIndexes.length?wholeIndexes:places.map((_,index)=>index)).slice(-4);
    for(let attempt=0;attempt<160;attempt++){
      const ad=Array(places.length).fill(0),bd=Array(places.length).fill(0);
      for(const i of eligible){
        ad[i]=Math.floor(Math.random()*8);
        bd[i]=Math.floor(Math.random()*7);
        if(additionDifficulty==='no-regroup'&&ad[i]+bd[i]>9)bd[i]=Math.max(0,9-ad[i]);
      }
      if(!ad.some(Boolean))ad[places.length-1]=2+Math.floor(Math.random()*5);
      if(!bd.some(Boolean))bd[places.length-1]=1+Math.floor(Math.random()*5);
      const a=valueFromDigits(ad),b=valueFromDigits(bd),sum=normaliseValue(a+b),regroup=additionNeedsRegroup(a,b);
      if(a<=0||b<=0||sum>rangeMax())continue;
      if(additionDifficulty==='regroup'&&!regroup)continue;
      if(additionDifficulty==='no-regroup'&&regroup)continue;
      return{a,b,sum};
    }
    const step=valueStep(),a=normaliseValue((additionDifficulty==='regroup'?6:2)*step),b=normaliseValue((additionDifficulty==='regroup'?7:3)*step);
    return{a,b,sum:normaliseValue(a+b)};
  }
  function additionPlaces(){
    const digits=digitsForValue(additionB),order=[];
    for(let i=places.length-1;i>=0;i--)if(digits[i]>0)order.push(i);
    return order;
  }
  function additionProgressText(){
    const order=additionPlaces();
    if(additionStep>=order.length)return 'All of '+format(additionB)+' has been added. Check the total.';
    const index=order[additionStep],digit=digitsForValue(additionB)[index]||0;
    return 'Next: add '+digit+' '+places[index].name+'.';
  }
  function startAdditionProblem(a=null,b=null){
    const problem=a==null||b==null?randomAdditionProblem():{a:normaliseValue(a),b:normaliseValue(b)};
    const safeA=clamp(problem.a,0,rangeMax()),safeB=clamp(problem.b,0,Math.max(0,rangeMax()-safeA));
    additionA=safeA;additionB=safeB;activityTarget=normaliseValue(safeA+safeB);additionStep=0;activityStatus='';
    paperActivityStart=digitsForValue(additionA);
    controller?.mutate(()=>{buildFromNumber(additionA);notice='Start at '+format(additionA)+'. '+additionProgressText()});controller?.select(null);
  }
  function applyAdditionStep(){
    if(activityMode!=='add'||activityContext!=='teach')return;
    const order=additionPlaces();
    if(additionStep>=order.length){activityStatus='All parts added — check the result.';controller?.refresh();return}
    const index=order[additionStep],digit=digitsForValue(additionB)[index]||0,before=counts()[index]||0;
    controller?.mutate(()=>{
      const newValue=normaliseValue(total()+digit*places[index].value);
      buildFromNumber(newValue);
      const exchanged=before+digit>=10&&index>0;
      const explanation='Added '+digit+' '+places[index].name+'.'+(exchanged?' Exchanged 10 '+places[index].name+' for 1 '+singularPlaceName(places[index-1])+'.':'');
      additionStep++;
      notice=explanation;
      activityStatus=explanation+' '+additionProgressText();
    });
    controller?.select(null);
  }
  function resetAddition(){
    additionStep=0;activityStatus='';
    controller?.mutate(()=>{buildFromNumber(additionA);notice='Back to '+format(additionA)+'. '+additionProgressText()});controller?.select(null);
  }
  function setAbacusDigit(index,digit){
    if(activityReadOnly())return;
    index=clamp(Math.round(num(index,0)),0,places.length-1);digit=clamp(Math.round(num(digit,0)),0,9);
    const cs=counts(),current=cs[index]||0;
    const nextValue=normaliseValue(total()+(digit-current)*places[index].value);
    if(nextValue<0||nextValue>rangeMax())return;
    controller?.mutate(()=>{
      tokens=tokens.filter(t=>t.place!==index);
      for(let n=0;n<digit;n++)tokens.push({id:next++,place:index,x:0,y:0,locked:false});
      notice='';layoutTokens();
    });
    controller?.select(null);
  }
  function nudgeAbacusDigit(index,delta){
    if(activityReadOnly())return;
    index=clamp(Math.round(num(index,0)),0,places.length-1);
    const current=counts()[index]||0;
    if(delta<0){if(current>0)setAbacusDigit(index,current-1);return}
    if(current<9){setAbacusDigit(index,current+1);return}
    if(index<=0||total()+places[index].value>rangeMax()){notice='That would go beyond the visible place-value range.';controller?.refresh();return}
    controller?.mutate(()=>{
      const nextValue=normaliseValue(total()+places[index].value);
      buildFromNumber(nextValue);
      notice='Exchanged 10 '+places[index].name+' for 1 '+singularPlaceName(places[index-1])+'.';
    });
    controller?.select(null);
  }

  function representationNoun(){
    return representationMode==='abacus'?'place-value bead frame':representationMode==='both'?'linked counter chart and place-value frame':'place-value counters';
  }
  function activityDescriptor(){
    if(activityMode==='build')return{title:'Build the target',prompt:'Build '+format(activityTarget)+' with the '+representationNoun()+'.'};
    if(activityMode==='exact')return{title:'Exact counters',prompt:'Make '+format(activityTarget)+' using exactly '+activityBudget+' counters.'};
    if(activityMode==='regroup')return{title:'Regroup',prompt:'Regroup this non-standard representation into standard place-value digits without changing its value.'};
    if(activityMode==='same')return{title:'Same value, different way',prompt:'Show '+format(activityTarget)+' in a different way. Keep the value exactly the same.'};
    if(activityMode==='read')return{title:'Read the number',prompt:'What number is represented by the '+representationNoun()+'?'};
    if(activityMode==='hidden')return{title:'Hidden place',prompt:'This representation shows '+format(activityTarget)+'. How many '+(places[activityHiddenIndex]?.name||'place-value')+' units are hidden?'};
    if(activityMode==='digit')return{title:'Digit value',prompt:'What is the value of the digit '+activityDigit+' in the '+(places[activityHiddenIndex]?.name||'selected')+' column?'};
    if(activityMode==='add')return{title:'Addition',prompt:'Start with '+format(additionA)+'. Add '+format(additionB)+'.'};
    return{title:'Place value',prompt:''};
  }
  function startActivity(mode=activityMode,context=activityContext){
    const modes=['powers','build','exact','regroup','same','read','hidden','digit','add'];
    if(context==='challenge'&&!activityBefore)activityBefore=stateSnapshot();
    activityMode=modes.includes(mode)?mode:'powers';activityContext=context==='challenge'?'challenge':'teach';activityActive=true;activityStatus='';powerMessage='';activityInput='';activityAnswer=null;activityHiddenIndex=-1;activityDigit=0;activityStartCounts=[];activityPrompt='';
    if(['exact','regroup','same'].includes(activityMode)&&representationMode!=='counters')representationMode='counters';
    if(activityMode==='powers'){
      const value=total();controller?.mutate(()=>{buildFromNumber(value);notice=''});controller?.select(null);
    }else{
      const data=pvGenerate('activity-'+activityMode,{rangeStart,rangeEnd,activityBudget,additionDifficulty,responseLines}),a=data.activity;
      activityTarget=a.activityTarget;activityBudget=a.activityBudget;activityAnswer=a.activityAnswer;activityHiddenIndex=a.activityHiddenIndex;activityDigit=a.activityDigit;activityStartCounts=a.activityStartCounts.slice();
      if(activityMode==='add'){additionA=a.additionA;additionB=a.additionB;additionStep=0}
      controller?.mutate(()=>{tokens=[];next=1;a.paperActivityStart.forEach((count,place)=>{for(let j=0;j<count;j++)tokens.push({id:next++,place,x:0,y:0,locked:false})});layoutTokens();notice=activityMode==='regroup'?'Regroup the counters without changing the represented value.':activityMode==='same'?'Change the representation while keeping the total unchanged.':activityMode==='add'?'Start at '+format(additionA)+'. '+additionProgressText():''});
      controller?.select(null);
    }
    paperActivityStart=counts().slice();
    activityPrompt=activityDescriptor().prompt;
    controller?.refresh();renderControls();
  }
  function randomActivityChallengeMode(){
    const modes=['build','exact','regroup','same','read','hidden','digit','add'];
    return modes[Math.floor(Math.random()*modes.length)];
  }
  function startRandomActivityChallenge(surface='activity'){
    if(challenge){restoreBeforeChallenge();challenge=null}
    const mode=randomActivityChallengeMode();
    if(mode==='exact')activityBudget=3+Math.floor(Math.random()*7);
    activityContext='challenge';
    controlTab=surface==='challenge'?'challenge':'activity';
    startActivity(mode,'challenge');
  }
  function exitActivityChallenge(){
    if(activityBefore){restoreState(activityBefore);activityBefore=null;controller?.select(null)}
    activityActive=false;activityStatus='';activityInput='';activityContext='teach';controlTab='setup';renderControls();controller?.refresh();
  }
  function checkActivity(){
    if(activityMode==='powers'||(activityAnswerMode()&&activityStatus.startsWith('Correct')))return;
    const target=clean(activityTarget),value=total(),same=Math.abs(value-target)<(valueStep()/2+1e-9);
    if(activityMode==='add'){
      activityStatus=same?'Correct ✓ — '+format(additionA)+' + '+format(additionB)+' = '+format(target)+'.':'Not yet — the place-value board currently shows '+format(value)+'.';
    }else if(activityMode==='exact'){
      const rightCount=tokens.length===activityBudget;
      activityStatus=same&&rightCount?'Correct ✓':same?'Right value — now use exactly '+activityBudget+' counters.':rightCount?'You used '+activityBudget+' counters, but the value is not '+format(target)+' yet.':'Keep going — match both the target and the counter limit.';
    }else if(activityMode==='regroup'){
      activityStatus=same&&!nonStandard()?'Correct ✓ — same value, standard form.':!same?'The value has changed. Keep it at '+format(target)+'.':'Keep regrouping until every column has 0–9 counters.';
    }else if(activityMode==='same'){
      const cs=counts(),changed=cs.some((count,index)=>count!==activityStartCounts[index]);
      activityStatus=same&&changed?'Correct ✓ — same value, different representation.':!same?'The representation changed the value. Bring it back to '+format(target)+'.':'The value is right, but the representation is still the same. Try splitting or exchanging.';
    }else if(activityAnswerMode()){
      const raw=String(activityInput||'').replace(/,/g,'').trim(),entered=raw===''?NaN:Number(raw);
      const tolerance=activityMode==='hidden'?1e-9:valueStep()/2+1e-9;
      if(!Number.isFinite(entered))activityStatus='Enter an answer first.';
      else activityStatus=Math.abs(entered-Number(activityAnswer))<=tolerance?'Correct ✓':'Not yet — have another look at the place-value columns.';
    }else activityStatus=same?'Correct ✓':'Not yet — your board shows '+format(value)+'.';
    controller?.refresh();
  }
  function activityControlsHtml(){
    const modeButtons=[
      ['powers','×/÷ 10'],
      ['build','Build'],
      ['exact','Exact'],
      ['regroup','Regroup'],
      ['same','Same value'],
      ['read','Read'],
      ['hidden','Hidden place'],
      ['digit','Digit value'],
      ['add','Addition']
    ].map(([id,label])=>'<button class="gd-btn'+(activityMode===id?' gd-btn--primary':'')+'" type="button" data-pv-activity-mode="'+id+'">'+label+'</button>').join('');
    let extras='';
    if(activityMode==='powers')extras='<p class="gd-help">Show how digits move through place-value columns while the decimal point stays fixed.</p>';
    else if(activityMode==='add')extras=
      '<div class="gd-row gd-pv-addition-inputs">'+
        field('Start','<input class="gd-input" id="pv-add-a" type="number" min="0" max="'+rangeMax()+'" step="'+valueStep()+'" value="'+additionA+'">')+
        field('Add','<input class="gd-input" id="pv-add-b" type="number" min="0" max="'+rangeMax()+'" step="'+valueStep()+'" value="'+additionB+'">')+
      '</div>'+
      field('Problems','<select class="gd-select" id="pv-add-difficulty">'+
        '<option value="mixed"'+(additionDifficulty==='mixed'?' selected':'')+'>Mixed</option>'+
        '<option value="no-regroup"'+(additionDifficulty==='no-regroup'?' selected':'')+'>No regrouping</option>'+
        '<option value="regroup"'+(additionDifficulty==='regroup'?' selected':'')+'>Needs regrouping</option>'+
      '</select>')+
      '<div class="gd-row"><button class="gd-btn gd-btn--primary" id="pv-add-set" type="button">Set addition</button><button class="gd-btn" id="pv-activity-new" type="button">New problem</button></div>'+
      '<p class="gd-help">Use counters to add by place value and exchange groups of ten. In Teach mode, Next place demonstrates each part and carries automatically.</p>';
    else if(activityMode==='exact')extras=field('Counters to use','<select class="gd-select" id="pv-activity-budget">'+[3,4,5,6,7,8,9].map(n=>'<option value="'+n+'"'+(activityBudget===n?' selected':'')+'>'+n+'</option>').join('')+'</select>')+
      '<button class="gd-btn" id="pv-activity-new" type="button">New task</button><p class="gd-help">Build the target using exactly the chosen number of counters.</p>';
    else extras='<button class="gd-btn" id="pv-activity-new" type="button">New task</button>';
    return '<div class="gd-row pv-activity-tabs" role="tablist" aria-label="Place Value teaching and games">'+modeButtons+'</div>'+extras;
  }
  function activityBannerHtml(){
    if(!activityActive)return '';
    if(activityMode==='powers'){
      const ds=standardDigits();
      const cells=places.map((place,index)=>{
        const decimalStart=place.value<1&&(index===0||places[index-1].value>=1);
        return '<div class="gd-pv-digit-cell'+(decimalStart?' is-decimal-start':'')+'"><small>'+place.label+'</small><strong>'+ds[index]+'</strong></div>';
      }).join('');
      const buttons=[-3,-2,-1,1,2,3].map(steps=>{
        const label=(steps<0?'÷':'×')+powerFactor(steps);
        return '<button type="button" data-pv-power="'+steps+'"'+(canPowerShift(steps)?'':' disabled')+'>'+label+'</button>';
      }).join('');
      return '<section class="gd-pv-activity gd-pv-activity--powers" aria-label="Powers of ten demonstration">'+
        '<div class="gd-pv-activity-head"><div><span>TEACH · POWERS OF TEN</span><strong>'+format(total())+'</strong></div><em>'+esc(powerMessage||'Choose an operation. The digits move; the decimal point does not.')+'</em></div>'+
        '<div class="gd-pv-digit-row" style="--pv-cols:'+places.length+'">'+cells+'</div><div class="gd-pv-activity-actions">'+buttons+'</div></section>';
    }
    const descriptor=activityDescriptor();
    const answer=activityAnswerMode()?'<div class="gd-pv-activity-response"><label>Answer <input type="text" inputmode="decimal" autocomplete="off" data-pv-activity-answer value="'+esc(activityInput)+'"'+(activityStatus.startsWith('Correct')?' disabled':'')+'></label></div>':'';
    const activityLabel=activityContext==='challenge'?'CHALLENGE':'PLAY';
    const additionGuide=activityMode==='add'&&activityContext==='teach'
      ?'<div class="gd-pv-addition-guide"><span>'+esc(additionProgressText())+'</span><div><button type="button" data-pv-add-next'+(additionStep>=additionPlaces().length?' disabled':'')+'>Next place</button><button type="button" data-pv-add-reset>Reset</button></div></div>'
      :'';
    return '<section class="gd-pv-activity gd-pv-activity--game'+(activityContext==='challenge'?' gd-native-challenge':'')+'" data-pv-activity-kind="'+activityMode+'" aria-label="'+esc(descriptor.title)+'">'+
      '<div class="gd-pv-activity-head"><div><span>'+activityLabel+'</span><strong>'+esc(descriptor.prompt)+'</strong></div><em>'+esc(activityStatus||'')+'</em></div>'+
      answer+additionGuide+'<div class="gd-pv-activity-actions"><button type="button" data-pv-activity-check'+(activityAnswerMode()&&activityStatus.startsWith('Correct')?' disabled':'')+'>Check</button><button type="button" data-pv-activity-another>Another</button>'+(activityContext==='challenge'?'<button type="button" data-pv-activity-exit>Exit challenge</button>':'')+'</div></section>';
  }

  function challengeControlsHtml(){
    if(!CK)return '<p class="gd-help">Challenge tools are unavailable.</p>';
    const tabs=CK.tabsHtml?CK.tabsHtml('pv',challengeTab):'';
    if(challengeTab==='custom'){
      const custom=challenge&&challenge.mode==='custom'?challenge:CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual'});
      return tabs+CK.editorHtml(custom,'pv',{answerSources:customAnswerSources(),generatedAnswerLabel:'Keep the generated answer'})+
        '<div class="gd-row">'+(challenge&&challenge.answer?'<button class="gd-btn" id="pv-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
        (challenge?'<button class="gd-btn" id="pv-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
        '<p class="gd-help">Custom challenges sit on top of the current board. Choose a live board value as the answer when you want it to stay linked while counters move.</p>';
    }
    const tasks=[
      ['build','Build target'],
      ['exact','Exact counters'],
      ['regroup','Regroup'],
      ['same','Same value'],
      ['read','Read number'],
      ['hidden','Hidden place'],
      ['digit','Digit value'],
      ['add','Addition']
    ].map(([id,label])=>'<button class="gd-btn'+(activityActive&&activityContext==='challenge'&&activityMode===id?' gd-btn--primary':'')+'" type="button" data-pv-challenge-mode="'+id+'">'+label+'</button>').join('');
    return tabs+CK.nativeRandomHtml('pv',[{label:'Build & regroup',ids:['build','exact','regroup','same']},{label:'Read & identify',ids:['read','hidden','digit']},{label:'Calculation',ids:['add']}])+
      '<div class="pv-challenge-task-grid" role="group" aria-label="Place Value challenge types">'+tasks+'</div>'+

      '<p class="gd-help">Choose a challenge type, or let 99 Club choose one at random. Check and Another appear directly on the board.</p>';
  }
  function setupControlsHtml(){
    const presetOptions='<option value="custom"'+(placeRange==='custom'?' selected':'')+'>Custom range</option>'+PLACE_RANGES.map(r=>'<option value="'+r.id+'"'+(r.id===placeRange?' selected':'')+'>'+r.label+'</option>').join('');
    const highestOptions=PLACE_CATALOG.slice(0,-1).map((p,i)=>'<option value="'+i+'"'+(i===rangeStart?' selected':'')+'>'+p.label+' · '+p.name+'</option>').join('');
    const lowestOptions=PLACE_CATALOG.map((p,i)=>'<option value="'+i+'"'+(i===rangeEnd?' selected':'')+(i<=rangeStart?' disabled':'')+'>'+p.label+' · '+p.name+'</option>').join('');
    const decimalAvailable=fractionDigits()>0;
    return field('Quick range','<select class="gd-select" id="pv-range">'+presetOptions+'</select>')+
      '<div class="gd-row gd-pv-range-pair">'+
        field('Highest','<select class="gd-select" id="pv-range-high">'+highestOptions+'</select>')+
        field('Lowest','<select class="gd-select" id="pv-range-low">'+lowestOptions+'</select>')+
      '</div>'+
      field('Quick setup number','<div class="gd-row"><input class="gd-input" id="pv-value" type="number" min="0" max="'+rangeMax()+'" step="'+valueStep()+'" value="'+total()+'"><button class="gd-btn" id="pv-build" type="button">Build</button></div>')+
      '<div class="gd-row">'+btn('Build random whole','pv-random')+(decimalAvailable?btn('Build random decimal','pv-dec'):'')+'</div>'+
      '<div class="gd-row">'+btn('Regroup counters','pv-regroup')+btn('Clear board','pv-clear')+'</div>'+
      '<p class="gd-help">Choose exactly the places you need — for example 1,000 to 1 for whole-number work. Up to seven adjacent places are shown at once.</p>';
  }
  function exportControlsHtml(){
    const canCard=!!challenge,buildTask=challenge?.type==='build-number',reasonTask=challenge?.category==='reason';
    if(!canCard&&exportMode==='challenge')exportMode='diagram';
    const responseControl=canCard&&exportMode==='challenge'&&reasonTask
      ?'<label class="gd-field"><span>Writing lines</span><select class="gd-select" id="pv-response-lines">'+
        [2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' lines</option>').join('')+
        '</select></label>'
      :'';
    const challengeHelp=buildTask
      ?'The blank chart is the pupil response area.'
      :reasonTask
        ?'Pupil copy has writing lines. Teacher key is separate.'
        :'Pupil copy has an answer box. Teacher key is separate.';
    return '<div class="nl-panel-title"><div><strong>Paper export</strong><span>Clean worksheet content only.</span></div></div>'+
      (canCard?'<div class="nl-export-mode pv-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-pv-export-mode="challenge">Worksheet</button>'+
        '<button type="button" class="'+(exportMode==='diagram'?'is-active':'')+'" data-pv-export-mode="diagram">Chart</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?responseControl+'<p class="gd-help">'+challengeHelp+'</p>'
        :'<p class="gd-help">Chart-only export contains the place-value chart and counters on a white paper background.</p>')+
      '<div class="nl-export-grid pv-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="pv-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'question':'chart')+'</button>'+
        '<button class="gd-btn" id="pv-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="pv-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="pv-print" type="button">Print / PDF</button>'+
      '</div>'+((challenge||activityActive&&activityMode!=='powers')?'<div class="gd-row"><button class="gd-btn" id="pv-key-copy" type="button">Copy answer key</button><button class="gd-btn" id="pv-key-print" type="button">Print answer key</button></div>':'')+'<p class="gd-help" id="pv-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }
  function pvSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function boardExportSvg({pupil=false}={}){
    const cs=counts(),width=1000,pad=18,boardX=pad,boardY=12,boardW=width-pad*2,colW=boardW/places.length;
    const exportCounts=cs.map((count,index)=>activityActive&&activityMode==='hidden'&&index===activityHiddenIndex?0:count);
    const maxCount=Math.max(1,...exportCounts),perRow=colW>=190?3:2,rows=Math.max(1,Math.ceil(maxCount/perRow));
    const headerH=92,counterStep=52,bodyH=Math.max(250,54+rows*counterStep),boardH=headerH+bodyH,height=boardY+boardH+12;
    const pupilColumnHidden=index=>!!(challenge&&challenge.answerMode==='bound'&&(challenge.answerSource==='count:'+index||challenge.answerSource==='value:'+index));
    const svg=pvSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Place value chart','data-pv-export':'board'});
    svg.appendChild(pvSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    const defs=pvSvgEl('defs'),clip=pvSvgEl('clipPath',{id:'pv-board-clip'});
    clip.appendChild(pvSvgEl('rect',{x:boardX,y:boardY,width:boardW,height:boardH,rx:8,ry:8}));
    defs.appendChild(clip);svg.appendChild(defs);
    svg.appendChild(pvSvgEl('rect',{x:boardX,y:boardY,width:boardW,height:boardH,rx:8,ry:8,fill:'#ffffff','data-pv-export-board':'1'}));
    places.forEach((place,index)=>{
      const x=boardX+index*colW,isDecimal=place.value<1&&(index===0||places[index-1].value>=1);
      const targetDigit=activityActive&&activityMode==='digit'&&index===activityHiddenIndex;
      svg.appendChild(pvSvgEl('rect',{x,y:boardY,width:colW,height:headerH,fill:targetDigit?'#fff6cf':(index%2?'#fafcfc':'#f3f7f7'),'clip-path':'url(#pv-board-clip)','data-pv-export-header':'1',...(targetDigit?{'data-pv-export-target':'1'}:{})}));
      if(index>0)svg.appendChild(pvSvgEl('line',{x1:x,y1:boardY,x2:x,y2:boardY+boardH,stroke:isDecimal?'#627b82':'#c5d2d5','stroke-width':isDecimal?4:1.7}));
      svg.appendChild(pvSvgEl('line',{x1:x,y1:boardY+headerH,x2:x+colW,y2:boardY+headerH,stroke:'#aebdc1','stroke-width':1.7}));
      svg.appendChild(pvSvgEl('text',{x:x+colW/2,y:boardY+36,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':22,'font-weight':850,fill:'#2d454d'},place.label));
      svg.appendChild(pvSvgEl('text',{x:x+colW/2,y:boardY+64,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':13,'font-weight':600,fill:'#61767c'},place.name));
      const visibleCount=(activityActive&&activityMode==='hidden'&&index===activityHiddenIndex)||(pupil&&pupilColumnHidden(index))?0:cs[index];
      for(let n=0;n<visibleCount;n++){
        const row=Math.floor(n/perRow),slot=n%perRow,slotGap=Math.min(52,colW/(perRow+0.7));
        const cx=x+colW/2+(slot-(perRow-1)/2)*slotGap,cy=boardY+headerH+40+row*counterStep;
        const radius=Math.min(19,colW/(perRow*3.3));
        svg.appendChild(pvSvgEl('circle',{cx,cy,r:radius,fill:place.color,stroke:'#6d8288','stroke-width':1.7}));
        svg.appendChild(pvSvgEl('circle',{cx,cy,r:Math.max(5,radius*.34),fill:'#ffffff','fill-opacity':.62}));
      }
    });
    svg.appendChild(pvSvgEl('rect',{x:boardX,y:boardY,width:boardW,height:boardH,rx:8,ry:8,fill:'none',stroke:'#8fa5aa','stroke-width':2.2,'data-pv-export-outline':'1'}));
    return svg;
  }
  function abacusExportSvg({pupil=false}={}){
    const cs=counts(),width=1000,pad=18,boardX=pad,boardY=12,boardW=width-pad*2,colW=boardW/places.length;
    const headerH=72,bodyH=280,footerH=34,boardH=headerH+bodyH+footerH,height=boardY+boardH+12;
    const svg=pvSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Place value bead frame','data-pv-export':'abacus'});
    svg.appendChild(pvSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(pvSvgEl('rect',{x:boardX,y:boardY,width:boardW,height:boardH,rx:9,fill:'#ead9bd',stroke:'#65777b','stroke-width':3,'data-pv-export-abacus':'1'}));
    places.forEach((place,index)=>{
      const x=boardX+index*colW,cx=x+colW/2,isDecimal=place.value<1&&(index===0||places[index-1].value>=1);
      const target=activityActive&&activityMode==='digit'&&index===activityHiddenIndex;
      const hidden=activityActive&&activityMode==='hidden'&&index===activityHiddenIndex;
      if(index>0)svg.appendChild(pvSvgEl('line',{x1:x,y1:boardY,x2:x,y2:boardY+boardH,stroke:isDecimal?'#536c72':'#b5a58d','stroke-width':isDecimal?4:1.5}));
      svg.appendChild(pvSvgEl('rect',{x,y:boardY,width:colW,height:headerH,fill:target?'#fff1b8':'rgba(255,255,255,.62)'}));
      svg.appendChild(pvSvgEl('text',{x:cx,y:boardY+29,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':20,'font-weight':850,fill:'#2d454d'},place.label));
      svg.appendChild(pvSvgEl('text',{x:cx,y:boardY+52,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':12,'font-weight':600,fill:'#61767c'},place.name));
      svg.appendChild(pvSvgEl('line',{x1:cx,y1:boardY+headerH+8,x2:cx,y2:boardY+headerH+bodyH-8,stroke:'#6f5d48','stroke-width':5,'stroke-linecap':'round'}));
      if(hidden){
        svg.appendChild(pvSvgEl('circle',{cx,cy:boardY+headerH+bodyH/2,r:25,fill:'#ffffff',stroke:'#b6c1c2','stroke-width':1.5}));
        svg.appendChild(pvSvgEl('text',{x:cx,y:boardY+headerH+bodyH/2+8,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':27,'font-weight':850,fill:'#6f7d80'},'?'));
      }else{
        const count=clamp(cs[index]||0,0,9),gap=(bodyH-28)/8;
        for(let value=9;value>=1;value--){
          const row=9-value,cy=boardY+headerH+14+row*gap,active=value<=count;
          const bw=Math.min(54,colW*.58),bh=16;
          svg.appendChild(pvSvgEl('rect',{x:cx-bw/2,y:cy-bh/2,width:bw,height:bh,rx:8,fill:active?place.color:'#edf1f1',stroke:active?'#788b8e':'#c5cecf','stroke-width':1.2}));
        }
      }
      if(!pupil&&!activityAnswerMode()){
        svg.appendChild(pvSvgEl('text',{x:cx,y:boardY+headerH+bodyH+23,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':14,'font-weight':800,fill:'#42575e'},String(cs[index]||0)));
      }
    });
    return svg;
  }
  function combinedRepresentationExportSvg({pupil=false}={}){
    const counter=boardExportSvg({pupil}),abacus=abacusExportSvg({pupil});
    const counterH=Number((counter.getAttribute('viewBox')||'0 0 1000 450').split(/\s+/)[3])||450;
    const abacusH=Number((abacus.getAttribute('viewBox')||'0 0 1000 410').split(/\s+/)[3])||410;
    const gap=16,height=counterH+abacusH+gap;
    const svg=pvSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 1000 '+height,role:'img','aria-label':'Linked place value chart and bead frame','data-pv-export':'both'});
    svg.appendChild(pvSvgEl('rect',{x:0,y:0,width:1000,height,fill:'#ffffff'}));
    const g1=pvSvgEl('g');[...counter.childNodes].forEach(node=>g1.appendChild(node.cloneNode(true)));svg.appendChild(g1);
    const g2=pvSvgEl('g',{transform:'translate(0 '+(counterH+gap)+')'});[...abacus.childNodes].forEach(node=>g2.appendChild(node.cloneNode(true)));svg.appendChild(g2);
    return svg;
  }
  function worksheetBoardSvg({pupil=false}={}){
    if(representationMode==='abacus')return abacusExportSvg({pupil});
    if(representationMode==='both')return combinedRepresentationExportSvg({pupil});
    return boardExportSvg({pupil});
  }

  function challengeResponseMode(){
    if(!challenge)return'none';
    if(challenge.type==='build-number')return'none';
    if(challenge.category==='reason')return'lines';
    return'box';
  }
  // Paper tasks are based on their original data, not on the mutable live chart.
  function paperAlternative(cs){
    const next=cs.slice(),index=next.findIndex((n,i)=>n>0&&i<next.length-1);
    if(index<0)return null;
    next[index]--;next[index+1]+=10;return next;
  }
  function paperChart(cs,{label='',blank=false,hidden=-1,highlight=-1}={}){
    const W=1000,pad=16,colW=(W-pad*2)/places.length,top=label?40:8,head=60;
    const perRow=places.length>5?3:4,maxCount=Math.max(1,...cs.map((n,i)=>i===hidden?0:n));
    const pitch=Math.min(34,colW/(perRow+.55)),radius=pitch*.36;
    const body=blank?Math.max(190,Math.ceil(19/perRow)*pitch+22):Math.max(108,Math.ceil(maxCount/perRow)*pitch+22),H=top+head+body+10;
    const svg=pvSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':label||'Place value counters'});
    const add=(tag,attrs,txt)=>svg.appendChild(pvSvgEl(tag,attrs,txt));
    add('rect',{width:W,height:H,fill:'#fff'});
    if(label)add('text',{x:pad,y:26,'font-family':'Arial,sans-serif','font-size':20,'font-weight':700,fill:'#52666d'},label);
    places.forEach((place,i)=>{
      const x=pad+i*colW,decimal=i>0&&place.value<1&&places[i-1].value>=1;
      add('rect',{x,y:top,width:colW,height:head,fill:i===highlight?'#fff6cf':'#f3f7f7'});
      if(i>0)add('line',{x1:x,y1:top,x2:x,y2:top+head+body,stroke:decimal?'#627b82':'#c5d2d5','stroke-width':decimal?3:1.4});
      add('text',{x:x+colW/2,y:top+24,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':Math.min(21,colW/6),'font-weight':800,fill:'#2d454d'},place.label);
      add('text',{x:x+colW/2,y:top+44,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':Math.min(13,colW/10),fill:'#61767c'},place.name);
      if(i===hidden){add('text',{x:x+colW/2,y:top+head+body/2+8,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':30,'font-weight':700,fill:'#64777d'},'?');return}
      if(blank)return;
      for(let j=0;j<(cs[i]||0);j++){
        const cx=x+colW/2+(j%perRow-(perRow-1)/2)*pitch,cy=top+head+11+pitch/2+Math.floor(j/perRow)*pitch;
        add('circle',{cx,cy,r:radius,fill:place.color,stroke:'#6d8288','stroke-width':1.4,'data-pv-paper-counter':'1','data-place':i});
        add('circle',{cx,cy,r:radius*.34,fill:'#fff','fill-opacity':.62});
      }
    });
    add('line',{x1:pad,y1:top+head,x2:W-pad,y2:top+head,stroke:'#aebdc1','stroke-width':1.5});
    add('rect',{x:pad,y:top,width:W-pad*2,height:head+body,rx:5,fill:'none',stroke:'#8fa5aa','stroke-width':2});
    return svg;
  }
  function stackPaperCharts(charts){
    if(charts.length===1)return charts[0];
    const heights=charts.map(chart=>Number(chart.getAttribute('viewBox').split(' ')[3])),gap=14,H=heights.reduce((a,b)=>a+b,0)+gap*(charts.length-1);
    const svg=pvSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 1000 '+H,role:'img','aria-label':'Starting and final place value charts'});
    let y=0;charts.forEach((chart,i)=>{const group=pvSvgEl('g',{transform:'translate(0 '+y+')'});[...chart.childNodes].forEach(node=>group.appendChild(node.cloneNode(true)));svg.appendChild(group);y+=heights[i]+gap});return svg;
  }
  function activityPaper(teacher){
    const descriptor=activityDescriptor(),mode=activityMode,zeros=Array(places.length).fill(0),target=digitsForValue(activityTarget);
    const initial=mode==='add'?digitsForValue(additionA):mode==='same'&&activityStartCounts.length===places.length?activityStartCounts.slice():paperActivityStart?.length===places.length?paperActivityStart.slice():mode==='regroup'?(paperAlternative(target)||target):target;
    let charts=[],prompt=descriptor.prompt.replace(/linked counter chart and place-value frame|place-value bead frame/g,'place-value counters'),responseMode='none',responseLabel='Answer',answer='';
    if(['read','hidden','digit'].includes(mode)){
      charts=[paperChart(initial,{hidden:mode==='hidden'&&!teacher?activityHiddenIndex:-1,highlight:mode==='digit'?activityHiddenIndex:-1})];responseMode='box';answer=format(activityAnswer);
    }else if(['build','exact','regroup','same','add'].includes(mode)){
      let solution=target.slice();
      if(mode==='same')solution=paperAlternative(initial)||target.slice();
      if(mode==='exact'){
        while(solution.reduce((a,b)=>a+b,0)<activityBudget){const next=paperAlternative(solution);if(!next||next.reduce((a,b)=>a+b,0)>activityBudget)break;solution=next}
      }
      if(['regroup','same','add'].includes(mode))charts.push(paperChart(initial,{label:'Starting representation'}));
      prompt+=' '+(teacher?'':'Draw counters in the final chart. ')+(mode==='same'?'Exchange one counter for ten in the next column, or use another valid exchange.':mode==='regroup'?'Use no more than nine counters in each column.':mode==='add'?'Exchange ten counters for one in the next place when needed.':'');
      charts.push(paperChart(teacher?solution:zeros,{label:teacher?(mode==='same'?'One possible solution':'Completed chart'):'Your representation',blank:!teacher}));
      if(mode==='add'){responseMode='box';responseLabel='Final number';answer=format(activityTarget)}
      if(mode==='same')answer='Other representations are correct if the total stays '+format(activityTarget)+' and the counters differ from the starting chart.';
      if(mode==='exact')answer='Use exactly '+activityBudget+' counters.';
    }else{
      charts=[paperChart(counts())];prompt=powerMessage||'Explain what happens to the digits when the number is multiplied or divided by a power of ten.';responseMode='lines';responseLabel='Explain your thinking';
    }
    return X.composeWorksheetCardSvg(stackPaperCharts(charts),{title:descriptor.title+(teacher?' · Teacher key':''),prompt,responseLabel,responseMode,responseLines:2,paperStyle:'plain',answer,showAnswer:teacher,diagramMaxHeight:charts.length>1?850:500});
  }
  function exportTargetSvg(teacher=false){
    const settings=pvSettings({rangeStart,rangeEnd,activityBudget,additionDifficulty,responseLines});
    if(challenge&&challenge.mode!=='custom'&&(exportMode==='challenge'||teacher))return pvPaper({settings,type:challenge.type,challenge:{...challenge,paperStartCounts:challenge.paperStartCounts?.length===places.length?challenge.paperStartCounts:counts()}},teacher);
    if(activityActive&&activityMode!=='powers'&&!challenge)return pvPaper({settings,type:'activity-'+activityMode,activity:{activityMode,activityTarget,activityBudget,activityAnswer,activityHiddenIndex,activityDigit,activityStartCounts,paperActivityStart,additionA,additionB}},teacher);
    if(exportMode==='challenge'&&challenge&&X?.composeWorksheetCardSvg||teacher&&challenge&&X?.composeWorksheetCardSvg){
      const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type),type=challenge.mode==='custom'?'custom':challenge.type;
      let prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'',mode=challengeResponseMode(),charts=[];
      const initial=challenge.paperStartCounts?.length===places.length?challenge.paperStartCounts.slice():counts();
      if(type==='build-number'){
        const target=Number(String(challenge.answer).replace(/,/g,''));
        prompt='Draw counters to show '+format(target)+'.';
        charts=[paperChart(teacher?digitsForValue(target):Array(places.length).fill(0),{blank:!teacher})];
      }else if(type==='non-standard'){
        prompt='What number does the starting chart represent? Regroup it in the final chart, using no more than nine counters per column.';
        const target=Number(String(challenge.answer).replace(/,/g,''));
        charts=[paperChart(initial,{label:'Starting representation'}),paperChart(teacher?digitsForValue(target):Array(places.length).fill(0),{label:teacher?'Regrouped chart':'Your regrouped chart',blank:!teacher})];
      }else charts=[type==='custom'?worksheetBoardSvg({pupil:!teacher}):paperChart(initial)];
      return X.composeWorksheetCardSvg(stackPaperCharts(charts),{title:(challenge.title||meta?.title||'Place Value challenge')+(teacher?' · Teacher key':''),prompt,responseLabel:challenge.category==='reason'?'Explain your thinking':'Answer',responseLines:challenge.category==='reason'?Math.max(2,Math.min(4,responseLines)):1,responseMode:mode,paperStyle:'plain',answer:type==='build-number'?'':challenge.answer||'',showAnswer:teacher,diagramMaxHeight:charts.length>1?850:500});
    }
    if(activityActive&&X?.composeWorksheetCardSvg)return activityPaper(teacher);
    return worksheetBoardSvg({pupil:false});
  }
  function exportName(teacher=false){
    const meta=challenge&&CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    if(exportMode==='challenge'&&challenge||teacher&&challenge)return (challenge.title||meta?.title||'place-value-challenge')+(teacher?'-teacher':'-pupil');
    if(activityActive)return 'place-value-'+activityMode+(teacher?'-teacher':'-pupil');
    return 'place-value-board-'+String(total()).replace(/[^0-9.-]+/g,'-');
  }
  function exportMessage(text){exportStatus=text;const el=q('#pv-export-status');if(el)el.textContent=text}
  async function exportAction(kind){
    try{
      if(!X)throw new Error('Export tools are not available.');
      const teacher=kind==='key-copy'||kind==='key-print';if(teacher&&!challenge&&!activityActive)return;
      const target=exportTargetSvg(teacher),isCard=(exportMode==='challenge'&&!!challenge)||activityActive||teacher,name=exportName(teacher),transparent=false;
      const worksheetKind=teacher?'Teacher worksheet':'Pupil worksheet';
      if(kind==='copy'||kind==='key-copy'){await X.copyPng(target,{transparent});exportMessage(isCard?worksheetKind+' copied.':'Chart copied on a white paper background.')}
      if(kind==='png'){await X.downloadPng(target,name,2,{transparent});exportMessage(isCard?worksheetKind+' PNG downloaded.':'Chart PNG downloaded.')}
      if(kind==='svg'){X.downloadSvg(target,name);exportMessage(isCard?worksheetKind+' SVG downloaded.':'SVG downloaded.')}
      if(kind==='print'||kind==='key-print'){X.printSvg(target,{title:'',landscape:!isCard,maxHeightMm:isCard?245:150});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'That export did not work.')}
  }
  function representationControlsHtml(){
    return '<details class="pv-representation-options"'+(representationOptionsOpen?' open':'')+'><summary>Display options · '+(representationMode==='counters'?'Counters':representationMode==='abacus'?'Bead frame':'Linked views')+'</summary><div class="pv-representation-tabs" role="tablist" aria-label="Place Value representation">'+
      ['counters','abacus','both'].map(mode=>'<button type="button" class="'+(representationMode===mode?'is-active':'')+'" data-pv-representation="'+mode+'">'+(mode==='counters'?'Counters':mode==='abacus'?'Place-value frame':'Both')+'</button>').join('')+
      '</div><p class="gd-help">Counters are the main place-value model. Use the dedicated Abacus for bead-based arithmetic; linked views remain available for comparison.</p></details>';
  }
  function controlsHtml(){
    return '<button type="button" data-pv-random-challenge hidden aria-hidden="true" tabindex="-1">Challenge</button>'+
      
      '<div class="gd-row pv-mode-tabs" role="tablist" aria-label="Place Value workflow">'+
      '<button class="gd-btn'+(controlTab==='setup'?' gd-btn--primary':'')+'" type="button" data-pv-workflow="setup">Setup</button>'+
      '<button class="gd-btn'+(controlTab==='activity'?' gd-btn--primary':'')+'" type="button" data-pv-workflow="activity">Teach / play</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-pv-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-pv-workflow="export">Export</button></div>'+
      (controlTab==='activity'?activityControlsHtml():controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():setupControlsHtml()+representationControlsHtml());
  }
  function renderControls(){
    const panel=q('#gd-controls');
    if(panel)panel.innerHTML=controlsHtml();
    bindControls();
  }

  function boardWidth(){
    return Math.max(315,q('#pv-canvas')?.clientWidth||((q('#gd-stage')?.clientWidth||720)-4));
  }
  function layoutTokens(width=boardWidth()){
    const compact=width<560,tokenSize=compact?30:36,header=compact?82:96,rowGap=compact?35:42,colWidth=width/places.length;
    const used=Array(places.length).fill(0);
    tokens.forEach(t=>{
      t.place=clamp(Math.round(num(t.place,4)),0,places.length-1);
      const slot=used[t.place]++;
      t.x=Math.max(2,t.place*colWidth+(colWidth-tokenSize)/2);
      t.y=header+12+slot*rowGap;
    });
    return Math.max(compact?400:470,header+34+Math.max(1,...used)*rowGap);
  }
  function expandedText(){
    const cs=counts();
    return cs.map((count,i)=>{
      if(!count)return'';
      return count===1?places[i].label:(count+' × '+places[i].label);
    }).filter(Boolean).join(' + ')||'0';
  }
  function stageNotice(){
    if(notice)return notice;
    if(activityMode==='add'&&activityActive)return activityContext==='teach'?additionProgressText():'Use the place-value frame or counters to add '+format(additionB)+' to '+format(additionA)+'.';
    if(representationMode==='abacus')return 'Tap a bead or use + / − on a place-value rod. Adding a tenth bead exchanges automatically into the next place.';
    if(representationMode==='both')return 'The counter chart and place-value frame are linked: change either representation and the number updates in both.';
    return nonStandard()?'This is a non-standard representation. Regroup to show the same value using standard digits.':'Drag a counter into another column to change its place value.';
  }
  function tokenMarkup(t,selectedId){
    const p=places[t.place],selected=String(t.id)===String(selectedId),activityHidden=activityTokenHidden(t);
    return '<button type="button" class="gd-pv-counter'+(selected?' is-selected':'')+(t.locked?' is-locked':'')+(activityHidden?' is-activity-hidden':'')+'" data-gd-object="'+t.id+'" data-pv-place="'+t.place+'" aria-selected="'+(selected?'true':'false')+'"'+(activityHidden?' aria-hidden="true" tabindex="-1"':'')+' aria-label="One '+p.name+' counter'+(t.locked?', locked':'')+'" style="left:'+t.x+'px;top:'+t.y+'px;--pv-counter:'+p.color+'"><span aria-hidden="true"></span>'+(t.locked?'<b class="gd-pv-lock" aria-hidden="true">⌑</b>':'')+'</button>';
  }
  function railMarkup(selected,meta){
    let object='';
    if(selected&&!activityReadOnly()){
      const source=clamp(Math.round(num(selected.place,0)),0,places.length-1);
      const canExchange=source>0&&tokens.filter(t=>t.place===source&&!t.locked).length>=10;
      const canSplit=!selected.locked&&source<places.length-1&&tokens.length+9<=90;
      object=
        I.toolButton('exchange-up','combine','Exchange 10 '+places[source].name+' for 1 '+(source>0?singularPlaceName(places[source-1]):'larger place'),'',
          !canExchange)+
        I.toolButton('split-down','split','Split 1 '+singularPlaceName(places[source])+' into 10 '+(source<places.length-1?places[source+1].name:'smaller places'),'',
          !canSplit)+
        I.toolButton('duplicate','duplicate','Duplicate counter','',false)+
        I.toolButton('lock',selected.locked?'unlock':'lock',selected.locked?'Unlock counter':'Lock counter',selected.locked?'is-active':'',false)+
        I.toolButton('delete','delete','Delete counter','is-danger',selected.locked);
    }
    const divider=object?'<span class="gd-object-separator"></span>':'';
    return '<div class="gd-object-ui"><div class="gd-object-rail'+(selected?' is-engaged':'')+'" aria-label="Place-value board tools">'+object+divider+
      I.toolButton('undo','undo','Undo','',!meta?.canUndo)+
      I.toolButton('redo','redo','Redo','',!meta?.canRedo)+
      '</div></div>';
  }
  function columnMarkup(place,index,cs){
    const readOnly=activityReadOnly(),countText=columnCountHidden(index)?'?':cs[index],canRemove=!readOnly&&tokens.some(t=>t.place===index&&!t.locked);
    const decimalStart=place.value<1&&(index===0||places[index-1].value>=1);
    const targetDigit=activityActive&&activityMode==='digit'&&index===activityHiddenIndex;
    return '<div class="gd-pv-column'+(decimalStart?' is-decimal-start':'')+(targetDigit?' is-activity-target':'')+'" data-gd-canvas-bg data-pv-column="'+index+'">'+
      '<div class="gd-pv-head"><strong>'+place.label+'</strong><small>'+place.name+'</small><div class="gd-pv-column-actions" role="group" aria-label="'+place.name+' counters">'+
        '<button type="button" data-pv-remove="'+index+'" aria-label="Remove one '+place.name+' counter"'+(canRemove?'':' disabled')+'>−</button>'+
        '<span data-pv-count="'+index+'" aria-label="'+countText+' '+place.name+' counters">'+countText+'</span>'+
        '<button type="button" data-pv-add="'+index+'" aria-label="Add one '+place.name+' counter"'+(readOnly?' disabled':'')+'>+</button>'+
      '</div></div>'+
      '</div>';
  }
  function abacusRodMarkup(place,index,cs){
    const hidden=activityActive&&activityMode==='hidden'&&index===activityHiddenIndex;
    const target=activityActive&&activityMode==='digit'&&index===activityHiddenIndex;
    const readOnly=activityReadOnly(),count=clamp(cs[index]||0,0,9),countText=columnCountHidden(index)?'?':count;
    const beads=[];
    for(let value=9;value>=1;value--){
      const active=!hidden&&value<=count;
      beads.push('<button type="button" class="gd-pv-abacus-bead'+(active?' is-active':'')+'" data-pv-abacus-nudge="'+index+':'+(active?-1:1)+'" aria-label="'+(active?'Remove one ':'Add one ')+place.name+' bead"'+(readOnly||hidden?' disabled':'')+' style="--pv-bead:'+place.color+'"><span></span></button>');
    }
    const decimalStart=place.value<1&&(index===0||places[index-1].value>=1);
    return '<div class="gd-pv-abacus-rod'+(decimalStart?' is-decimal-start':'')+(target?' is-activity-target':'')+(hidden?' is-hidden-place':'')+'" data-pv-abacus-rod="'+index+'">'+
      '<div class="gd-pv-abacus-label"><strong>'+place.label+'</strong><small>'+place.name+'</small></div>'+
      '<div class="gd-pv-abacus-track" aria-label="'+place.name+' place-value rod">'+
        '<span class="gd-pv-abacus-stick" aria-hidden="true"></span>'+
        '<div class="gd-pv-abacus-beads">'+beads.join('')+'</div>'+
        (hidden?'<b class="gd-pv-abacus-hidden">?</b>':'')+
      '</div>'+
      '<div class="gd-pv-abacus-controls">'+
        '<button type="button" data-pv-abacus-nudge="'+index+':-1" aria-label="Remove one '+place.name+' bead"'+(readOnly||hidden||count<=0?' disabled':'')+'>−</button>'+
        '<span data-pv-abacus-count="'+index+'">'+(hidden?'?':countText)+'</span>'+
        '<button type="button" data-pv-abacus-nudge="'+index+':1" aria-label="Add one '+place.name+' bead"'+(readOnly||hidden||(count>=9&&(index===0||total()+place.value>rangeMax()))?' disabled':'')+'>+</button>'+
      '</div>'+
    '</div>';
  }
  function abacusMarkup(cs){
    return '<div class="gd-pv-abacus" id="pv-abacus" style="--pv-cols:'+places.length+'" aria-label="Place value abacus">'+
      '<div class="gd-pv-abacus-frame">'+places.map((place,index)=>abacusRodMarkup(place,index,cs)).join('')+'</div>'+
    '</div>';
  }
  function counterBoardMarkup(height,cs,selectedId,selected,meta){
    return '<div class="gd-pv-board-wrap" data-pv-representation-view="counters">'+
      '<div class="gd-pv-canvas" id="pv-canvas" data-gd-canvas-bg style="min-height:'+height+'px;--pv-cols:'+places.length+'">'+
        '<div class="gd-pv-columns">'+places.map((p,i)=>columnMarkup(p,i,cs)).join('')+'</div>'+
        tokens.map(t=>tokenMarkup(t,selectedId)).join('')+
      '</div>'+
      railMarkup(selected,meta)+
    '</div>';
  }

  function render(selectedId,meta){
    const height=layoutTokens(),cs=counts(),selected=tokens.find(t=>String(t.id)===String(selectedId))||null;
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Place Value challenge',actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'}]:[]}):'';
    const activity=activityBannerHtml();
    const directExports='<div hidden aria-hidden="true">'+['copy','png','svg','print',...((activityActive&&activityMode!=='powers'||challenge)?['key-copy','key-print']:[])].map(kind=>'<button type="button" data-gd-direct-export="'+kind+'">'+kind+'</button>').join('')+'</div>';
    const counterView=representationMode!=='abacus'?counterBoardMarkup(height,cs,selectedId,selected,meta):'';
    const abacusView=representationMode!=='counters'?abacusMarkup(cs):'';
    q('#gd-stage').innerHTML=banner+activity+directExports+'<div class="gd-vis gd-pv-workspace is-'+representationMode+'">'+
      counterView+abacusView+
      '<div class="gd-pv-summary">'+
        '<div><span>Number represented</span><strong id="pv-total"'+(summaryHidden('total')?' class="gd-pv-answer-hidden"':'')+'>'+(summaryHidden('total')?'?':format(total()))+'</strong></div>'+
        '<div><span>Board representation</span><strong id="pv-expanded"'+(summaryHidden('expanded')?' class="gd-pv-answer-hidden"':'')+'>'+(summaryHidden('expanded')?hiddenSummaryText():expandedText())+'</strong></div>'+
      '</div>'+
      '<p class="gd-object-hint" id="pv-hint">'+stageNotice()+'</p>'+
    '</div>';
  }
  function updateLiveSummary(){
    updateChallengeAnswer();
    const totalEl=q('#pv-total'),expandedEl=q('#pv-expanded'),hint=q('#pv-hint'),input=q('#pv-value');
    if(totalEl)totalEl.textContent=summaryHidden('total')?'?':format(total());
    if(expandedEl)expandedEl.textContent=summaryHidden('expanded')?hiddenSummaryText():expandedText();
    if(hint)hint.textContent=stageNotice();
    if(input&&document.activeElement!==input)input.value=clean(total()).toFixed(total()%1?2:0);
    const cs=counts();
    qa('[data-pv-count]',q('#gd-stage')).forEach(el=>{const index=+el.dataset.pvCount;el.textContent=columnCountHidden(index)?'?':(cs[index]||0)});
  }
  function placeFromX(x,width=boardWidth()){
    const centre=(Number(x)||0)+18;
    return clamp(Math.floor(centre/(width/places.length)),0,places.length-1);
  }
  function addCounter(place){
    if(activityReadOnly())return;
    if(tokens.length>=90){notice='This board is full. Delete or regroup some counters first.';controller.refresh();return;}
    let id=null;
    controller.mutate(()=>{
      id=next++;
      tokens.push({id,place:clamp(place,0,places.length-1),x:0,y:0,locked:false});
      notice='';
      layoutTokens();
    });
    controller.select(id);
  }
  function removeCounter(place){
    if(activityReadOnly())return;
    const index=clamp(Math.round(Number(place)||0),0,places.length-1);
    const candidates=tokens.filter(t=>t.place===index&&!t.locked);
    const item=candidates[candidates.length-1];
    if(!item)return;
    const removingSelected=String(controller.getSelectedId?.())===String(item.id);
    controller.mutate(()=>{
      tokens=tokens.filter(t=>t!==item);
      notice='';
      layoutTokens();
    });
    if(removingSelected)controller.select(null);
  }
  function duplicateCounter(item){
    if(tokens.length>=90){notice='This board is full. Delete or regroup some counters first.';return null;}
    const copy={...item,id:next++,locked:false,x:0,y:0};
    tokens.push(copy);notice='';layoutTokens();return copy;
  }
  function singularPlaceName(place){return String(place?.name||'place').replace(/s$/,'')}
  function exchangeUp(item){
    const source=clamp(Math.round(num(item?.place,-1)),0,places.length-1);
    if(source<=0)return null;
    const available=tokens.filter(t=>t.place===source&&!t.locked);
    if(available.length<10)return null;
    const removeIds=new Set(available.slice(0,10).map(t=>t.id));
    tokens=tokens.filter(t=>!removeIds.has(t.id));
    const created={id:next++,place:source-1,x:0,y:0,locked:false};
    tokens.push(created);
    notice='Exchanged 10 '+places[source].name+' for 1 '+singularPlaceName(places[source-1])+'.';
    layoutTokens();
    return created;
  }
  function splitDown(item){
    const source=clamp(Math.round(num(item?.place,-1)),0,places.length-1);
    if(!item||item.locked||source>=places.length-1||tokens.length+9>90)return null;
    tokens=tokens.filter(t=>t!==item);
    const created=[];
    for(let n=0;n<10;n++){const nextItem={id:next++,place:source+1,x:0,y:0,locked:false};tokens.push(nextItem);created.push(nextItem)}
    notice='Split 1 '+singularPlaceName(places[source])+' into 10 '+places[source+1].name+'.';
    layoutTokens();
    return created[0]||null;
  }
  function bindStage(){
    qa('[data-pv-add]',q('#gd-stage')).forEach(button=>button.onclick=e=>{
      e.stopPropagation();addCounter(+button.dataset.pvAdd);
    });
    qa('[data-pv-remove]',q('#gd-stage')).forEach(button=>button.onclick=e=>{
      e.stopPropagation();removeCounter(+button.dataset.pvRemove);
    });
    qa('[data-pv-abacus-set]',q('#gd-stage')).forEach(button=>button.onclick=e=>{
      e.stopPropagation();
      const [index,value]=String(button.dataset.pvAbacusSet||'').split(':').map(Number);
      setAbacusDigit(index,value);
    });
    qa('[data-pv-abacus-nudge]',q('#gd-stage')).forEach(button=>button.onclick=e=>{
      e.stopPropagation();
      const [index,delta]=String(button.dataset.pvAbacusNudge||'').split(':').map(Number);
      nudgeAbacusDigit(index,delta);
    });
    const addNext=q('[data-pv-add-next]',q('#gd-stage'));
    if(addNext)addNext.onclick=e=>{e.stopPropagation();applyAdditionStep()};
    const addReset=q('[data-pv-add-reset]',q('#gd-stage'));
    if(addReset)addReset.onclick=e=>{e.stopPropagation();resetAddition()};
    const reveal=q('[data-board-action="reveal"]',q('#gd-stage'));
    if(reveal)reveal.onclick=e=>{e.stopPropagation();if(!challenge)return;challenge.revealed=!challenge.revealed;renderControls();controller?.refresh()};
    const another=q('[data-challenge-action="another"]',q('#gd-stage'));
    if(another)another.onclick=e=>{e.stopPropagation();if(challenge?.mode==='standard')generateChallenge(challenge.type)};
    qa('[data-pv-power]',q('#gd-stage')).forEach(button=>button.onclick=e=>{
      e.stopPropagation();applyPowerShift(Math.round(num(button.dataset.pvPower,0)));
    });
    qa('[data-gd-direct-export]',q('#gd-stage')).forEach(button=>button.onclick=e=>{
      e.stopPropagation();exportAction(button.dataset.gdDirectExport);
    });
    const activityAnswerInput=q('[data-pv-activity-answer]',q('#gd-stage'));
    if(activityAnswerInput){
      activityAnswerInput.oninput=e=>{activityInput=e.target.value;activityStatus='';const status=q('.gd-pv-activity-head em',q('#gd-stage'));if(status)status.textContent=''};
      activityAnswerInput.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();checkActivity()}};
    }
    const activityCheck=q('[data-pv-activity-check]',q('#gd-stage'));
    if(activityCheck)activityCheck.onclick=e=>{e.stopPropagation();checkActivity()};
    const activityAnother=q('[data-pv-activity-another]',q('#gd-stage'));
    if(activityAnother)activityAnother.onclick=e=>{e.stopPropagation();startActivity(activityMode,activityContext)};
    const activityExit=q('[data-pv-activity-exit]',q('#gd-stage'));
    if(activityExit)activityExit.onclick=e=>{e.stopPropagation();exitActivityChallenge()};
    updateLiveSummary();
  }
  function syncControls(){
    const input=q('#pv-value'),regroup=q('#pv-regroup'),range=q('#pv-range'),high=q('#pv-range-high'),low=q('#pv-range-low');
    if(input){
      input.max=String(rangeMax());input.step=String(valueStep());
      if(document.activeElement!==input)input.value=String(total());
    }
    if(range&&document.activeElement!==range)range.value=PLACE_RANGES.some(r=>r.id===placeRange)?placeRange:'custom';
    if(high&&document.activeElement!==high)high.value=String(rangeStart);
    if(low&&document.activeElement!==low)low.value=String(rangeEnd);
    if(regroup)regroup.disabled=!nonStandard()||total()>rangeMax();
  }
  function bindControls(){
    const displayOptions=q('.pv-representation-options');if(displayOptions)displayOptions.ontoggle=()=>{representationOptionsOpen=displayOptions.open};
    qa('[data-pv-representation]').forEach(button=>button.onclick=()=>{
      const mode=button.dataset.pvRepresentation;
      if(!['counters','abacus','both'].includes(mode))return;
      controller?.mutate(()=>{
        representationMode=mode;
        if(mode!=='counters'&&nonStandard()&&total()<=rangeMax()){
          const value=total();buildFromNumber(value);
          notice='The abacus uses standard digits, so the same value was regrouped first.';
        }
      });
      controller?.select(null);renderControls();
    });
    const randomActivityChallenge=q('[data-pv-random-challenge]');
    if(randomActivityChallenge)randomActivityChallenge.onclick=()=>startRandomActivityChallenge('activity');
    qa('[data-pv-workflow]').forEach(button=>button.onclick=()=>{
      const nextTab=button.dataset.pvWorkflow;
      if(nextTab==='activity'){
        if(challenge){restoreBeforeChallenge();challenge=null}
        const teachMode=activityContext==='challenge'?'powers':activityMode;
        controlTab='activity';startActivity(teachMode,'teach');return;
      }
      if(nextTab==='setup'&&activityBefore){exitActivityChallenge();return}
      if(nextTab==='setup')activityActive=false;
      if(nextTab==='challenge'&&activityContext!=='challenge')activityActive=false;
      controlTab=nextTab==='challenge'?'challenge':nextTab==='export'?'export':'setup';
      renderControls();controller?.refresh();
    });
    qa('[data-pv-activity-mode]').forEach(button=>button.onclick=()=>{
      controlTab='activity';startActivity(button.dataset.pvActivityMode,'teach');
    });
    qa('[data-pv-challenge-mode]').forEach(button=>button.onclick=()=>{
      if(challenge){restoreBeforeChallenge();challenge=null}
      const mode=button.dataset.pvChallengeMode;
      if(mode==='exact')activityBudget=3+Math.floor(Math.random()*7);
      controlTab='challenge';startActivity(mode,'challenge');
    });
    const randomChallenge=q('#pv-challenge-random');if(randomChallenge)randomChallenge.onclick=()=>startRandomActivityChallenge('challenge');
    const activityBudgetSelect=q('#pv-activity-budget');if(activityBudgetSelect)activityBudgetSelect.onchange=()=>{
      activityBudget=clamp(Math.round(num(activityBudgetSelect.value,5)),3,9);
      startActivity('exact',activityContext);
    };
    const additionDifficultySelect=q('#pv-add-difficulty');if(additionDifficultySelect)additionDifficultySelect.onchange=()=>{
      additionDifficulty=['mixed','no-regroup','regroup'].includes(additionDifficultySelect.value)?additionDifficultySelect.value:'mixed';
    };
    const additionSet=q('#pv-add-set');if(additionSet)additionSet.onclick=()=>{
      const a=normaliseValue(num(q('#pv-add-a')?.value,additionA)),b=normaliseValue(num(q('#pv-add-b')?.value,additionB));
      if(a<0||b<0||a+b>rangeMax()){activityStatus='Choose two numbers whose sum fits the visible place range.';controller?.refresh();return}
      startAdditionProblem(a,b);renderControls();
    };
    const activityNew=q('#pv-activity-new');if(activityNew)activityNew.onclick=()=>startActivity(activityMode,activityContext);
    const applyRangeChange=(start,end,id='custom')=>{
      const previous=total();
      controller.mutate(()=>{
        if(id!=='custom')setPlaceRange(id);else setCustomPlaceRange(start,end);
        const rebuilt=buildFromNumber(previous);
        notice=Math.abs(rebuilt-previous)<(valueStep()/2+1e-9)?'Visible place range changed without changing the represented number.':'Visible place range changed; the previous value was outside this range and has been adjusted.';
      });
      controller.select(null);renderControls();
    };
    const range=q('#pv-range');if(range)range.onchange=()=>{
      if(range.value==='custom'){placeRange='custom';renderControls();return}
      const preset=rangeFor(range.value);applyRangeChange(preset.start,preset.end??preset.start+6,preset.id);
    };
    const rangeHigh=q('#pv-range-high');if(rangeHigh)rangeHigh.onchange=()=>{
      let start=clamp(Math.round(num(rangeHigh.value,rangeStart)),0,PLACE_CATALOG.length-2),end=rangeEnd;
      if(end<=start)end=start+1;
      if(end-start>6)end=start+6;
      applyRangeChange(start,end,'custom');
    };
    const rangeLow=q('#pv-range-low');if(rangeLow)rangeLow.onchange=()=>{
      let end=clamp(Math.round(num(rangeLow.value,rangeEnd)),1,PLACE_CATALOG.length-1),start=rangeStart;
      if(end<=start)start=Math.max(0,end-1);
      if(end-start>6)start=end-6;
      applyRangeChange(start,end,'custom');
    };
    const build=q('#pv-build');
    const quickValue=q('#pv-value');
    const applyQuickValue=()=>{
      if(!quickValue)return;
      const raw=quickValue.value;
      controller.mutate(()=>{buildFromNumber(raw);notice='Board rebuilt from the entered number.'});
      controller.select(null);
    };
    if(build)build.onclick=applyQuickValue;
    if(quickValue)quickValue.onkeydown=e=>{
      if(e.key==='Enter'){e.preventDefault();applyQuickValue()}
    };
    const random=q('#pv-random');if(random)random.onclick=()=>{
      const value=randomBoardValue({decimal:false,min:valueStep(),max:rangeMax()});
      q('#pv-value').value=value;
      controller.mutate(()=>{buildFromNumber(value);notice='Random whole-number value built for this place range.'});
      controller.select(null);
    };
    const decimal=q('#pv-dec');if(decimal)decimal.onclick=()=>{
      const value=randomBoardValue({decimal:true,min:valueStep(),max:rangeMax()});
      q('#pv-value').value=value;
      controller.mutate(()=>{buildFromNumber(value);notice='Random decimal built for this place range.'});
      controller.select(null);
    };
    const regroup=q('#pv-regroup');if(regroup)regroup.onclick=()=>{
      const value=total();
      if(value>rangeMax()){notice='This value is above the current visible range, so it cannot be regrouped here.';controller.refresh();return;}
      controller.mutate(()=>{buildFromNumber(value);notice='Regrouped into standard place-value digits without changing the total.'});
      controller.select(null);
    };
    const clear=q('#pv-clear');if(clear)clear.onclick=()=>{
      if(!tokens.length)return;
      if(!window.confirm('Clear all counters from the place-value board?'))return;
      controller.mutate(()=>{tokens=[];notice='Board cleared.'});
      controller.select(null);
    };

    qa('[data-pv-challenge-tab]').forEach(button=>button.onclick=()=>{
      if(button.dataset.pvChallengeTab==='custom')enterCustomChallenge();
      else{challengeTab='standard';renderControls()}
    });
    qa('[data-pv-challenge-cat]').forEach(button=>button.onclick=()=>{
      challengeCategory=button.dataset.pvChallengeCat;renderControls();
    });
    qa('[data-pv-challenge-type]').forEach(button=>button.onclick=()=>{
      challengeType=button.dataset.pvChallengeType;renderControls();
    });
    const generate=q('#pv-generate');if(generate)generate.onclick=()=>generateChallenge(challengeType);
    const edit=q('#pv-edit-challenge');if(edit)edit.onclick=enterCustomChallenge;
    const end=q('#pv-clear-challenge');if(end)end.onclick=clearChallenge;
    const toggleChallengeAnswer=()=>{
      if(!challenge)return;challenge.revealed=!challenge.revealed;renderControls();controller?.refresh();
    };
    const panelReveal=q('#pv-reveal');if(panelReveal)panelReveal.onclick=toggleChallengeAnswer;
    const exportReveal=q('#pv-export-reveal');if(exportReveal)exportReveal.onclick=toggleChallengeAnswer;

    qa('[data-gd-rich-action]').forEach(button=>button.onclick=()=>{
      const editor=q('#pv-custom-prompt');if(editor&&CK)CK.applyFormat(editor,button.dataset.gdRichAction);
    });
    const title=q('#pv-custom-title');if(title)title.oninput=()=>{
      if(!challenge)return;challenge.title=title.value.slice(0,100);controller?.refresh();
    };
    const prompt=q('#pv-custom-prompt');if(prompt)prompt.oninput=()=>{
      if(!challenge||!CK)return;challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml).slice(0,600);controller?.refresh();
    };
    const source=q('#pv-custom-answer-source');if(source)source.onchange=()=>setCustomAnswerSource(source.value);
    const answer=q('#pv-custom-answer');if(answer)answer.oninput=()=>{
      if(!challenge)return;challenge.answer=answer.value.slice(0,400);
      if(challenge.revealed){const shown=q('.gd-challenge-actions em',q('#gd-stage'));if(shown)shown.textContent='Answer: '+challenge.answer}
    };

    qa('[data-pv-export-mode]').forEach(button=>button.onclick=()=>{
      exportMode=button.dataset.pvExportMode==='challenge'&&challenge?'challenge':'diagram';exportStatus='';renderControls();
    });
    const response=q('#pv-response-lines');if(response)response.onchange=()=>{
      responseLines=clamp(Math.round(num(response.value,1)),1,4);renderControls();
    };
    const copyImage=q('#pv-copy-image');if(copyImage)copyImage.onclick=()=>exportAction('copy');
    const png=q('#pv-png');if(png)png.onclick=()=>exportAction('png');
    const svgDownload=q('#pv-svg-download');if(svgDownload)svgDownload.onclick=()=>exportAction('svg');
    const print=q('#pv-print');if(print)print.onclick=()=>exportAction('print');
    const keyCopy=q('#pv-key-copy');if(keyCopy)keyCopy.onclick=()=>exportAction('key-copy');const keyPrint=q('#pv-key-print');if(keyPrint)keyPrint.onclick=()=>exportAction('key-print');
    syncControls();
  }

  renderControls();

  buildFromNumber(1234.5);
  controller=I.mount({
    getItems:()=>tokens,
    getState:stateSnapshot,
    setState:restoreState,
    getCanvas:()=>q('#pv-canvas')||q('#pv-abacus'),
    getActionRoot:()=>q('#gd-stage'),
    render,
    isLocked:item=>!!item.locked||activityReadOnly(),
    snap:1,
    nudgeStep:1,
    duplicate:duplicateCounter,
    remove:item=>{tokens=tokens.filter(t=>t!==item);notice='';layoutTokens()},
    toggleLock:item=>{item.locked=!item.locked;notice=''},
    constrain:(item,x,y,element,canvas)=>({
      x:clamp(x,0,Math.max(0,canvas.clientWidth-(element?.offsetWidth||36))),
      y:clamp(y,boardWidth()<560?82:96,Math.max(boardWidth()<560?82:96,canvas.clientHeight-(element?.offsetHeight||36)))
    }),
    onMove:item=>{
      const newPlace=placeFromX(item.x);
      if(newPlace!==item.place){
        item.place=newPlace;
        notice='';
        const el=q('[data-gd-object="'+item.id+'"]',q('#pv-canvas'));
        if(el)el.style.setProperty('--pv-counter',places[newPlace].color);
        updateLiveSummary();
      }
    },
    onDragEnd:item=>{item.place=placeFromX(item.x);notice='';layoutTokens()},
    nudge:(item,dx)=>{
      if(!dx)return false;
      const nextPlace=clamp(item.place+(dx<0?-1:1),0,places.length-1);
      if(nextPlace===item.place)return false;
      item.place=nextPlace;notice='';layoutTokens();return true;
    },
    onAction:(action,api)=>{
      const selected=api.selected();
      if(action==='exchange-up'){
        let created=null;api.mutate(()=>{created=exchangeUp(selected)});
        if(created)api.select(created.id);
      }else if(action==='split-down'){
        let created=null;api.mutate(()=>{created=splitDown(selected)});
        if(created)api.select(created.id);
      }
    },
    afterRender:()=>{bindStage();syncControls()},
    onDestroy:()=>{
      if(resizeObserver)resizeObserver.disconnect();
      if(resizeFrame)cancelAnimationFrame(resizeFrame);
    }
  });
  bindControls();
  controller.refresh();

  if(typeof ResizeObserver!=='undefined'){
    resizeObserver=new ResizeObserver(entries=>{
      const width=entries[0]?.contentRect?.width||0;
      if(Math.abs(width-lastStageWidth)<2)return;
      lastStageWidth=width;
      cancelAnimationFrame(resizeFrame);
      resizeFrame=requestAnimationFrame(()=>controller?.refresh());
    });
    resizeObserver.observe(q('#gd-stage'));
  }
  G.publishingCurrent=()=>new XMLSerializer().serializeToString(worksheetBoardSvg({pupil:false}));
  G.lessonState?.register('place-value',()=>({diagram:stateSnapshot(),challenge,beforeChallenge,pupil:CK?.capturePupil?.(challenge),controlTab,challengeTab,challengeCategory,challengeType,exportMode,responseLines,activityMode,activityTarget,activityBudget,activityStatus,powerMessage,activityActive,activityContext,activityBefore,activityInput,activityAnswer,activityHiddenIndex,activityDigit,activityStartCounts,activityPrompt,paperActivityStart,additionA,additionB,additionStep,additionDifficulty}),saved=>{
    restoreState(saved.diagram);challenge=saved.challenge?CK.normalise(saved.challenge):null;beforeChallenge=saved.beforeChallenge||null;
    if(Object.prototype.hasOwnProperty.call(saved,'controlTab'))controlTab=saved.controlTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeTab'))challengeTab=saved.challengeTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeCategory'))challengeCategory=saved.challengeCategory;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeType'))challengeType=saved.challengeType;
    if(Object.prototype.hasOwnProperty.call(saved,'exportMode'))exportMode=saved.exportMode;
    if(Object.prototype.hasOwnProperty.call(saved,'responseLines'))responseLines=saved.responseLines;
    if(Object.prototype.hasOwnProperty.call(saved,'activityMode'))activityMode=saved.activityMode;
    if(Object.prototype.hasOwnProperty.call(saved,'activityTarget'))activityTarget=saved.activityTarget;
    if(Object.prototype.hasOwnProperty.call(saved,'activityBudget'))activityBudget=saved.activityBudget;
    if(Object.prototype.hasOwnProperty.call(saved,'activityStatus'))activityStatus=saved.activityStatus;
    if(Object.prototype.hasOwnProperty.call(saved,'powerMessage'))powerMessage=saved.powerMessage;
    if(Object.prototype.hasOwnProperty.call(saved,'activityActive'))activityActive=saved.activityActive;
    if(Object.prototype.hasOwnProperty.call(saved,'activityContext'))activityContext=saved.activityContext;
    activityBefore=saved.activityBefore||null;paperActivityStart=Array.isArray(saved.paperActivityStart)&&saved.paperActivityStart.length===places.length?saved.paperActivityStart.slice():null;
    if(Object.prototype.hasOwnProperty.call(saved,'activityInput'))activityInput=saved.activityInput;
    if(Object.prototype.hasOwnProperty.call(saved,'activityAnswer'))activityAnswer=saved.activityAnswer;
    if(Object.prototype.hasOwnProperty.call(saved,'activityHiddenIndex'))activityHiddenIndex=saved.activityHiddenIndex;
    if(Object.prototype.hasOwnProperty.call(saved,'activityDigit'))activityDigit=saved.activityDigit;
    if(Object.prototype.hasOwnProperty.call(saved,'activityStartCounts'))activityStartCounts=saved.activityStartCounts;
    if(Object.prototype.hasOwnProperty.call(saved,'activityPrompt'))activityPrompt=saved.activityPrompt;
    if(Object.prototype.hasOwnProperty.call(saved,'additionA'))additionA=saved.additionA;
    if(Object.prototype.hasOwnProperty.call(saved,'additionB'))additionB=saved.additionB;
    if(Object.prototype.hasOwnProperty.call(saved,'additionStep'))additionStep=saved.additionStep;
    if(Object.prototype.hasOwnProperty.call(saved,'additionDifficulty'))additionDifficulty=saved.additionDifficulty;
    CK?.restorePupil?.(challenge,saved.pupil);renderControls();controller.refresh();
  });

}

  const FW_TEMPLATES=[
    {id:'identify-strip',category:'read',title:'Read the fraction strip',desc:'Identify the fraction represented by a strip.'},
    {id:'equivalent-strip',category:'read',title:'Find an equivalent fraction',desc:'Use aligned strips to complete an equivalence.'},
    {id:'compare-strips',category:'compare',title:'Compare two fractions',desc:'Choose <, > or = from visual fraction strips.'},
    {id:'simplify-strip',category:'convert',title:'Simplify a fraction',desc:'Use the strip structure to write the simplest form.'},
    {id:'mixed-improper',category:'convert',title:'Improper to mixed',desc:'Read an improper strip and write it as a mixed number.'},
    {id:'denominator-misconception',category:'reason',title:'Larger denominator?',desc:'Diagnose the common unit-fraction denominator misconception.'}
  ];

function fwSettings(model={}){return {responseLines:Math.max(1,Math.min(4,Math.round(Number(model.responseLines)||1)))}}
function fwTypes(){return FW_TEMPLATES.map(t=>({id:t.id,label:t.title}))}
function fwGenerate(type,settings={},rng=Math.random){
 const template=FW_TEMPLATES.find(t=>t.id===type);if(!template)throw Error('Unknown fraction challenge.');
 let focus={n:1,d:2},compareA={n:1,d:2},compareB={n:1,d:3},mode='wall',strips=[],nextStrip=1,challenge;
 function randomProper(d){return {n:1+Math.floor(rng()*Math.max(1,d-1)),d}}
 function gcd(a,b){while(b){const t=b;b=a%b;a=t}return a||1}
 function simplify(n,d){const g=gcd(n,d);return {n:n/g,d:d/g}}
 function rawFractionText(f){return f.n+'/'+f.d}
 function equivalent(a,b){return a.n*b.d===b.n*a.d}
 function fractionValue(f){return f.n/f.d}
 function challengeObject(type,prompt,answer,extra={}){return {mode:'standard',type,category:template.category,title:'',prompt,promptHtml:prompt,answer:String(answer),answerMode:'bound',answerSource:'',revealed:false,hiddenStripLabels:[],hiddenStripHints:[],hiddenFocusLabel:false,hiddenCompareSign:false,...extra}}
    const dens=[2,3,4,5,6,7,8,9,10,11,12];
    if(type==='identify-strip'){
      const d=dens[Math.floor(rng()*dens.length)],f=randomProper(d);
      mode='workbench';strips=[{id:1,...f,x:24,y:24,locked:false,color:'#cbe7e2'}];nextStrip=2;
      challenge=challengeObject(type,'Write the number of shaded parts over the total number of equal parts.',rawFractionText(f),{answerSource:'strip:1:fraction',hiddenStripLabels:[1],hiddenStripHints:[1]});
    }else if(type==='equivalent-strip'){
      const d=[2,3,4,5,6][Math.floor(rng()*5)],f=randomProper(d),factor=2+Math.floor(rng()*(Math.floor(12/d)-1)),target={n:f.n*factor,d:f.d*factor};
      mode='workbench';strips=[
        {id:1,...f,x:24,y:24,locked:false,color:'#cbe7e2'},
        {id:2,...target,x:24,y:130,locked:false,color:'#cfe0f6'}
      ];nextStrip=3;
      challenge=challengeObject(type,'The two strips represent the same amount. What fraction with denominator '+target.d+' is equivalent to '+rawFractionText(f)+'?',rawFractionText(target),{answerSource:'strip:2:fraction',hiddenStripLabels:[2],hiddenStripHints:[2]});
    }else if(type==='compare-strips'){
      const a=randomProper(dens[Math.floor(rng()*dens.length)]);
      const equivalents=dens.filter(d=>d!==a.d&&Number.isInteger(a.n*d/a.d));
      const d2=equivalents[Math.floor(rng()*equivalents.length)];
      const b=rng()<.25?(d2?{n:a.n*d2/a.d,d:d2}:{...a}):randomProper(dens[Math.floor(rng()*dens.length)]);
      compareA=a;compareB=b;focus={...a};mode='wall';
      const sign=equivalent(a,b)?'=':fractionValue(a)>fractionValue(b)?'>':'<';
      challenge=challengeObject(type,'Which symbol belongs between A and B: <, > or =?',sign,{answerSource:'compare-sign',hiddenCompareSign:true});
    }else if(type==='simplify-strip'){
      const pool=[];for(let d=4;d<=12;d++)for(let n=1;n<d;n++)if(gcd(n,d)>1)pool.push({n,d});
      const f=pool[Math.floor(rng()*pool.length)],base=simplify(f.n,f.d);
      mode='workbench';strips=[{id:1,...f,x:24,y:24,locked:false,color:'#f6dfad'}];nextStrip=2;
      challenge=challengeObject(type,'Simplify the fraction shown to its lowest terms.',rawFractionText(base),{answerSource:'strip:1:simplified',hiddenStripHints:[1]});
    }else if(type==='mixed-improper'){
      const d=dens[Math.floor(rng()*dens.length)],whole=1+Math.floor(rng()*2),rem=1+Math.floor(rng()*(d-1)),f={n:whole*d+rem,d};
      mode='workbench';strips=[{id:1,...f,x:24,y:24,locked:false,color:'#e7d8f3'}];nextStrip=2;
      challenge=challengeObject(type,'Write the improper fraction shown as a mixed number.',whole+' '+rawFractionText(simplify(rem,d)),{answerSource:'strip:1:mixed',hiddenStripHints:[1]});
    }else{
      const small=2+Math.floor(rng()*10),large=small+1+Math.floor(rng()*(12-small)),a={n:1,d:small},b={n:1,d:large},valid=rng()<.5;
      mode='workbench';strips=[
        {id:1,...a,x:24,y:24,locked:false,color:'#cbe7e2'},
        {id:2,...b,x:24,y:130,locked:false,color:'#cfe0f6'}
      ];nextStrip=3;
      challenge=challengeObject(type,'A pupil says 1/'+(valid?small:large)+' is greater than 1/'+(valid?large:small)+'. Are they correct?',(valid?'Yes. ':'No. ')+'For unit fractions, more equal parts make each part smaller, so 1/'+small+' > 1/'+large+'.',{hiddenStripHints:[1,2]});
    }

 return {type,settings:fwSettings(settings),diagram:{focus,compareA,compareB,mode,strips,nextStrip},challenge};
}
function fwPaper(data,teacher=false){
 const d=data.diagram||{},challenge=data.challenge||null;
 const {focus={n:1,d:2},compareA={n:1,d:2},compareB={n:1,d:3},mode='wall',strips=[]}=d;
 function equivalentNumerator(d){const n=focus.n*d/focus.d;return Number.isInteger(n)?n:null}
 function challengeActiveHidden(key,id){return false}
  function gcd(a,b){a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b){const t=b;b=a%b;a=t}return a||1}
  function simplify(n,d){const g=gcd(n,d);return{n:n/g,d:d/g}}
  function normalFraction(f,defaultN=1,defaultD=2){
    const d=clamp(Math.round(num(f?.d,defaultD)),1,12);
    const n=clamp(Math.round(num(f?.n,defaultN)),0,d*3);
    return{n,d};
  }
  function fractionText(f){
    const value=normalFraction(f),s=simplify(value.n,value.d);
    return s.n===value.n&&s.d===value.d?value.n+'/'+value.d:value.n+'/'+value.d+' = '+s.n+'/'+s.d;
  }
  function fractionValue(f){const v=normalFraction(f);return v.n/v.d}
  function rawFractionText(f){const v=normalFraction(f);return v.n+'/'+v.d}
  function equivalent(a,b){return Math.abs(fractionValue(a)-fractionValue(b))<1e-10}
  function fwSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function exportHidden(key,id=null,pupil=false){
    if(!challenge)return false;
    if(!pupil)return challengeActiveHidden(key,id);
    if(key==='focus')return !!challenge.hiddenFocusLabel;
    if(key==='compare')return !!challenge.hiddenCompareSign;
    const list=key==='strip-label'?challenge.hiddenStripLabels:challenge.hiddenStripHints;
    return Array.isArray(list)&&list.map(String).includes(String(id));
  }
  function addSvgFractionBar(svg,f,x,y,width,label){
    const value=normalFraction(f),groups=Math.max(1,Math.ceil(value.n/value.d)),rowH=22,rowGap=7;
    if(label)svg.appendChild(fwSvgEl('text',{x,y:y-8,'font-family':'Arial,sans-serif','font-size':13,'font-weight':800,fill:'#40565d'},label));
    for(let g=0;g<groups;g++){
      const yy=y+g*(rowH+rowGap),segW=width/value.d;
      for(let i=0;i<value.d;i++){
        const absolute=g*value.d+i+1,fill=absolute<=value.n;
        svg.appendChild(fwSvgEl('rect',{x:x+i*segW,y:yy,width:segW,height:rowH,fill:fill?'#bfe1dc':'#ffffff',stroke:'#71878c','stroke-width':1}));
      }
    }
    return groups*(rowH+rowGap)-rowGap;
  }
  function wallExportSvg({pupil=false}={}){
    if(pupil&&challenge?.type==='compare-strips'){
      const width=1000,height=225,svg=fwSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Compare fraction strips'});
      svg.appendChild(fwSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
      addSvgFractionBar(svg,compareA,50,65,900,'A · '+rawFractionText(compareA));
      addSvgFractionBar(svg,compareB,50,150,900,'B · '+rawFractionText(compareB));return svg;
    }
    const width=1000,pad=38,rowX=118,rowW=844,rowH=24,rowGap=6,startY=62,wallBottom=startY+12*(rowH+rowGap);
    const compareY=wallBottom+48,height=compareY+154;
    const svg=fwSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Fraction wall and comparison','data-fw-export':'wall'});
    svg.appendChild(fwSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(fwSvgEl('text',{x:pad,y:34,'font-family':'Arial,sans-serif','font-size':20,'font-weight':800,fill:'#24343b'},'Fraction wall'));
    const simpleFocus=simplify(focus.n,focus.d),focusRaw=rawFractionText(focus),focusShown=simpleFocus.n===focus.n&&simpleFocus.d===focus.d?focusRaw:focusRaw+' = '+simpleFocus.n+'/'+simpleFocus.d;
    svg.appendChild(fwSvgEl('text',{x:width-pad,y:34,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':15,'font-weight':700,fill:'#52666d'},'Selected: '+(exportHidden('focus',null,pupil)?'?':focusShown)));
    for(let d=1;d<=12;d++){
      const y=startY+(d-1)*(rowH+rowGap),eqN=equivalentNumerator(d),rowFocus=d===focus.d,segW=rowW/d;
      svg.appendChild(fwSvgEl('text',{x:rowX-14,y:y+17,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':12,'font-weight':700,fill:'#60757b'},d===1?'whole':'1/'+d));
      for(let i=0;i<d;i++){
        const on=eqN!=null&&i<eqN;
        svg.appendChild(fwSvgEl('rect',{x:rowX+i*segW,y,width:segW,height:rowH,fill:on?(rowFocus?'#4faaa0':'#cae7e3'):'#ffffff',stroke:rowFocus?'#397f77':'#9aadb1','stroke-width':rowFocus?1.7:1}));
      }
    }
    svg.appendChild(fwSvgEl('line',{x1:pad,y1:wallBottom+20,x2:width-pad,y2:wallBottom+20,stroke:'#d9e3e5','stroke-width':1.5}));
    const cardW=390,leftX=pad,rightX=width-pad-cardW;
    svg.appendChild(fwSvgEl('text',{x:leftX,y:compareY-12,'font-family':'Arial,sans-serif','font-size':15,'font-weight':800,fill:'#334a52'},'A  '+rawFractionText(compareA)));
    svg.appendChild(fwSvgEl('text',{x:rightX,y:compareY-12,'font-family':'Arial,sans-serif','font-size':15,'font-weight':800,fill:'#334a52'},'B  '+rawFractionText(compareB)));
    addSvgFractionBar(svg,compareA,leftX,compareY,cardW,'');
    addSvgFractionBar(svg,compareB,rightX,compareY,cardW,'');
    const av=fractionValue(compareA),bv=fractionValue(compareB),sign=Math.abs(av-bv)<1e-10?'=':(av>bv?'>':'<');
    svg.appendChild(fwSvgEl('text',{x:width/2,y:height-31,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':26,'font-weight':800,fill:'#2f5f5a'},rawFractionText(compareA)+'  '+(exportHidden('compare',null,pupil)?'?':sign)+'  '+rawFractionText(compareB)));
    svg.appendChild(fwSvgEl('text',{x:width-pad,y:height-10,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function stripsExportSvg({pupil=false}={}){
    const width=1000,pad=42,cardW=520,canvasW=720;
    const ordered=[...strips].sort((a,b)=>(Number(a.y)||0)-(Number(b.y)||0)||Number(a.id)-Number(b.id));
    const items=ordered.map(strip=>{
      const groups=Math.max(1,Math.ceil(strip.n/strip.d)),h=62+groups*38+28;
      return{strip,groups,h};
    });
    const height=Math.max(250,pad*2+items.reduce((sum,item)=>sum+item.h+18,0)-18);
    const svg=fwSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Fraction strip workbench','data-fw-export':'strips'});
    svg.appendChild(fwSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    let y=pad;
    items.forEach(({strip,groups,h})=>{
      const maxX=Math.max(0,width-pad*2-cardW),x=pad+clamp((Number(strip.x)||0)/Math.max(1,canvasW-cardW),0,1)*maxX;
      const hideLabel=exportHidden('strip-label',strip.id,pupil),hideHint=exportHidden('strip-hint',strip.id,pupil);
      const simple=simplify(strip.n,strip.d),canSimplify=simple.n!==strip.n||simple.d!==strip.d;
      svg.appendChild(fwSvgEl('rect',{x,y,width:cardW,height:h,rx:14,fill:'#f8fbfb',stroke:'#b9c9cc','stroke-width':1.5,'data-fw-export-strip':strip.id}));
      if(!hideLabel)svg.appendChild(fwSvgEl('text',{x:x+18,y:y+28,'font-family':'Arial,sans-serif','font-size':18,'font-weight':800,fill:'#2e4a51'},rawFractionText(strip)));
      if(!pupil&&!hideLabel&&!hideHint&&canSimplify)svg.appendChild(fwSvgEl('text',{x:x+84,y:y+28,'font-family':'Arial,sans-serif','font-size':12,'font-weight':700,fill:'#697d82'},'= '+simple.n+'/'+simple.d));
      const barX=x+18,barW=cardW-36,rowH=25,rowGap=8,barY=y+45;
      for(let g=0;g<groups;g++){
        const yy=barY+g*(rowH+rowGap),segW=barW/strip.d;
        for(let i=0;i<strip.d;i++){
          const absolute=g*strip.d+i+1,fill=absolute<=strip.n;
          svg.appendChild(fwSvgEl('rect',{x:barX+i*segW,y:yy,width:segW,height:rowH,fill:fill?(strip.color||'#cbe7e2'):'#ffffff',stroke:'#70878c','stroke-width':1}));
        }
      }
      const hint=hideHint?'Work it out from the strip.':canSimplify?'Can simplify to '+simple.n+'/'+simple.d:'Value '+Number(fractionValue(strip).toFixed(4));
      if(!pupil&&!hideHint)svg.appendChild(fwSvgEl('text',{x:x+18,y:y+h-12,'font-family':'Arial,sans-serif','font-size':11,fill:'#73858a'},hint));
      y+=h+18;
    });
    if(!items.length)svg.appendChild(fwSvgEl('text',{x:width/2,y:height/2,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':18,fill:'#718388'},'No fraction strips on the workbench.'));
    svg.appendChild(fwSvgEl('text',{x:width-pad,y:height-10,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function fractionExportSvg(options={}){
    return mode==='workbench'?stripsExportSvg(options):wallExportSvg(options);
  }

 if(!challenge)return fractionExportSvg();
 // Same-width strips, no card chrome or extra hints, and no answer metadata.
 const comparison=challenge.type==='compare-strips',models=comparison?[{...compareA,id:1},{...compareB,id:2}]:strips;
 const W=900,pad=42,rowW=W-pad*2,groups=f=>Math.max(1,Math.ceil(f.n/f.d));
 const H=24+models.reduce((sum,f)=>sum+32+groups(f)*30+14,0);
 const svg=fwSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+Math.max(80,H),role:'img','aria-label':'Fraction strips'});
 svg.appendChild(fwSvgEl('rect',{width:W,height:Math.max(80,H),fill:'#fff'}));
 let y=14;
 models.forEach((f,i)=>{
   const hidden=exportHidden('strip-label',f.id,true),label=comparison?(i===0?'A · ':'B · ')+rawFractionText(f):hidden?'':rawFractionText(f);
   if(label)svg.appendChild(fwSvgEl('text',{x:pad,y:y+17,'font-family':'Arial,sans-serif','font-size':19,'font-weight':750,fill:'#334a52'},label));
   y+=label?30:8;
   for(let g=0;g<groups(f);g++){
     for(let j=0;j<f.d;j++)svg.appendChild(fwSvgEl('rect',{x:pad+j*rowW/f.d,y,width:rowW/f.d,height:27,fill:g*f.d+j<f.n?(f.color||'#bfe1dc'):'#fff',stroke:'#71878c','stroke-width':1.3}));
     y+=30;
   }
   y+=14;
 });
 return G.exportTools.composeWorksheetCardSvg(svg,{title:FW_TEMPLATES.find(t=>t.id===challenge.type)?.title||'Fractions challenge',prompt:challenge.prompt,responseLabel:challenge.category==='reason'?'Answer and explain':'Answer',responseMode:challenge.category==='reason'||data.settings?.responseLines>1?'lines':'box',responseLines:Math.max(data.settings?.responseLines||1,challenge.category==='reason'?3:1),paperStyle:'plain',answer:challenge.answer,showAnswer:teacher,diagramMaxHeight:500});
}
function fwData(model){if(model.challenge?.mode==='custom')throw Error('Use individual export for custom fraction tasks.');return {type:model.challenge?.type,settings:fwSettings(model),diagram:model.diagram,challenge:model.challenge?{...model.challenge,revealed:false}:null}}
G.fractionPaperModel={generate:fwGenerate,render:fwPaper,types:fwTypes};
if(G.publishing)G.publishing.register('fraction-wall',{
 label:'Fraction wall',types:fwTypes,title:item=>item.kind==='diagram'?'Fraction illustration':FW_TEMPLATES.find(t=>t.id===item.data.type)?.title||'Fraction challenge',
 signature:d=>JSON.stringify([d.type,d.challenge.prompt,d.diagram.mode==='wall'?[d.diagram.compareA,d.diagram.compareB]:d.diagram.strips.map(s=>[s.n,s.d])]),
 recipe:(model,type)=>({type,settings:fwSettings(model)}),
 generate(recipe,rng){const ids=fwTypes().map(t=>t.id);return fwGenerate(recipe.type==='all'?ids[Math.floor(rng()*ids.length)]:recipe.type,recipe.settings,rng)},
 capture(model){const data=fwData(model);return [G.publishing.record('fraction-wall',data.challenge?'challenge':'diagram',data,data.challenge?{type:data.type,settings:data.settings}:null)]},
 render(item,teacher){return fwPaper(item.data,teacher)}
});

function fractionWall(){
  const I=G.interaction,CK=G.challengeKit,X=G.exportTools;
  let focus={n:1,d:2},compareA={n:1,d:2},compareB={n:1,d:3},mode='wall';
  let strips=[
    {id:1,n:1,d:2,x:28,y:30,locked:false,color:'#cbe7e2'},
    {id:2,n:1,d:3,x:28,y:150,locked:false,color:'#cfe0f6'}
  ],nextStrip=3,controller=null;
  const CHALLENGE_CATEGORIES=[
    {id:'read',label:'Read & equivalence'},
    {id:'compare',label:'Compare'},
    {id:'convert',label:'Convert & simplify'},
    {id:'reason',label:'Reasoning'}
  ];
  const CHALLENGE_TEMPLATES=FW_TEMPLATES;
  let controlTab='explore',challengeTab='standard',challengeCategory='read',challengeType='identify-strip',challenge=null,beforeChallenge=null;
  let exportMode='diagram',responseLines=1,exportStatus='';

  function gcd(a,b){a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b){const t=b;b=a%b;a=t}return a||1}
  function simplify(n,d){const g=gcd(n,d);return{n:n/g,d:d/g}}
  function normalFraction(f,defaultN=1,defaultD=2){
    const d=clamp(Math.round(num(f?.d,defaultD)),1,12);
    const n=clamp(Math.round(num(f?.n,defaultN)),0,d*3);
    return{n,d};
  }
  function fractionText(f){
    const value=normalFraction(f),s=simplify(value.n,value.d);
    return s.n===value.n&&s.d===value.d?value.n+'/'+value.d:value.n+'/'+value.d+' = '+s.n+'/'+s.d;
  }
  function fractionValue(f){const v=normalFraction(f);return v.n/v.d}
  function rawFractionText(f){const v=normalFraction(f);return v.n+'/'+v.d}
  function equivalent(a,b){return Math.abs(fractionValue(a)-fractionValue(b))<1e-10}
  function challengeObject(type,prompt,answer,extra={}){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);
    const raw={mode:'standard',type,category:meta?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),answerMode:'bound',answerSource:'',revealed:false,hiddenStripLabels:[],hiddenStripHints:[],hiddenFocusLabel:false,hiddenCompareSign:false,...extra};
    return CK?CK.normalise(raw):raw;
  }
  function teachingSnapshot(){
    return{focus:{...focus},compareA:{...compareA},compareB:{...compareB},mode,strips:JSON.parse(JSON.stringify(strips)),nextStrip};
  }
  function restoreTeachingSnapshot(value){
    if(!value)return;
    focus=normalFraction(value.focus,1,2);compareA=normalFraction(value.compareA,1,2);compareB=normalFraction(value.compareB,1,3);
    mode=value.mode==='workbench'?'workbench':'wall';
    strips=Array.isArray(value.strips)?value.strips.map(s=>({...s,...normalFraction(s),x:num(s.x,28),y:num(s.y,30),locked:!!s.locked,color:s.color||'#cbe7e2'})):[];
    nextStrip=Math.max(1,Math.round(num(value.nextStrip,1)));
  }
  function fractionQuestionFixed(){return challenge?.mode==='standard'}
  function challengeActiveHidden(key,id=null){
    if(!challenge||challenge.revealed)return false;
    if(key==='focus')return !!challenge.hiddenFocusLabel;
    if(key==='compare')return !!challenge.hiddenCompareSign;
    const list=key==='strip-label'?challenge.hiddenStripLabels:challenge.hiddenStripHints;
    return Array.isArray(list)&&list.map(String).includes(String(id));
  }
  function customAnswerSources(){
    const sources=[
      {id:'focus',label:'Selected wall fraction'},
      {id:'compare-sign',label:'A/B comparison symbol'}
    ];
    strips.forEach((strip,index)=>{
      sources.push({id:'strip:'+strip.id+':fraction',label:'Strip '+(index+1)+' fraction'});
      sources.push({id:'strip:'+strip.id+':simplified',label:'Strip '+(index+1)+' simplified fraction'});
      sources.push({id:'strip:'+strip.id+':mixed',label:'Strip '+(index+1)+' mixed number'});
    });
    return sources;
  }
  function resolveCustomAnswerSource(source){
    if(source==='focus')return rawFractionText(focus);
    if(source==='compare-sign'){
      const av=fractionValue(compareA),bv=fractionValue(compareB);return Math.abs(av-bv)<1e-10?'=':(av>bv?'>':'<');
    }
    const m=String(source||'').match(/^strip:(\d+):(fraction|simplified|mixed)$/);if(!m)return'';
    const strip=selectedStrip(m[1]);if(!strip)return'';
    if(m[2]==='fraction')return rawFractionText(strip);
    if(m[2]==='mixed'){
      const whole=Math.floor(strip.n/strip.d),rem=strip.n%strip.d;
      if(!rem)return String(whole);
      const part=simplify(rem,strip.d),tail=part.n+'/'+part.d;
      return whole?whole+' '+tail:tail;
    }
    const s=simplify(strip.n,strip.d);return s.n+'/'+s.d;
  }
  function clearBoundHiding(){
    if(!challenge)return;
    challenge.hiddenFocusLabel=false;challenge.hiddenCompareSign=false;challenge.hiddenStripLabels=[];challenge.hiddenStripHints=[];
  }
  function applyBoundHiding(source){
    clearBoundHiding();if(!challenge)return;
    if(source==='focus')challenge.hiddenFocusLabel=true;
    else if(source==='compare-sign')challenge.hiddenCompareSign=true;
    else{
      const m=String(source||'').match(/^strip:(\d+):(fraction|simplified|mixed)$/);
      if(m&&m[2]==='fraction')challenge.hiddenStripLabels=[m[1]];
      if(m&&(m[2]==='simplified'||m[2]==='mixed'))challenge.hiddenStripHints=[m[1]];
    }
  }
  function updateChallengeAnswer(){
    if(!challenge||challenge.answerMode!=='bound'||!challenge.answerSource)return;
    const answer=resolveCustomAnswerSource(challenge.answerSource);if(answer!=='')challenge.answer=answer;
    const live=q('#fw-custom-live-answer');if(live)live.textContent=challenge.answer||'—';
  }
  function readCompare(key){
    const fallback=key==='a'?compareA:compareB;
    const d=clamp(Math.round(num(q('#fw-'+key+'d')?.value,fallback.d)),1,12);
    const n=clamp(Math.round(num(q('#fw-'+key+'n')?.value,fallback.n)),0,Math.min(36,d*3));
    const value={n,d};if(key==='a')compareA=value;else compareB=value;return value;
  }
  function equivalentNumerator(d){
    const raw=focus.n*d/focus.d;
    return Math.abs(raw-Math.round(raw))<1e-10?Math.round(raw):null;
  }
  function wallRows(){
    const rows=[];
    for(let d=1;d<=12;d++){
      const eqN=equivalentNumerator(d),rowFocus=d===focus.d;
      rows.push('<div class="gd-fr-row'+(rowFocus?' is-focus-row':'')+'" data-fw-row="'+d+'" aria-label="Fraction wall denominator '+d+'">'+
        '<span class="gd-fr-row-label">'+(d===1?'whole':'1/'+d)+'</span>'+
        '<div class="gd-fr-row-pieces">'+
          Array.from({length:d},(_,i)=>{
            const equivalentCell=eqN!=null&&i<eqN;
            const cls='gd-fr-cell'+(equivalentCell?(rowFocus?' is-on':' is-equivalent'):'')+(rowFocus&&i===focus.n-1?' is-end':'');
            return '<button type="button" class="'+cls+'" data-fw-wall="'+d+':'+i+'" aria-label="'+(i+1)+'/'+d+'"></button>';
          }).join('')+
        '</div></div>');
    }
    return rows.join('');
  }
  function directBar(f,key){
    const value=normalFraction(f),groups=Math.max(1,Math.ceil(value.n/value.d));
    return '<div class="gd-fr-direct" data-fw-direct="'+key+'">'+Array.from({length:groups},(_,g)=>
      '<div class="gd-fr-bar">'+Array.from({length:value.d},(_,i)=>{
        const absolute=g*value.d+i+1,fill=absolute<=value.n;
        return '<button type="button" class="gd-fr-piece'+(fill?' is-fill':'')+'" data-fw-set="'+key+':'+absolute+'" aria-label="Set '+key.toUpperCase()+' numerator to '+absolute+'"></button>';
      }).join('')+'</div>'
    ).join('')+'</div>';
  }
  function modeTabs(){
    return '<div class="gd-row gd-fr-mode-tabs" role="tablist" aria-label="Fractions workspace">'+
      '<button class="gd-btn'+(mode==='wall'?' gd-btn--primary':'')+'" type="button" data-fw-mode="wall">Fraction wall</button>'+
      '<button class="gd-btn'+(mode==='workbench'?' gd-btn--primary':'')+'" type="button" data-fw-mode="workbench">Strip workbench</button></div>';
  }
  function wallControlsHtml(){
    return modeTabs()+
      '<p class="gd-section-title">Compare two fractions</p>'+
      '<div class="gd-row">'+
        field('A numerator','<input class="gd-input gd-small" id="fw-an" type="number" min="0" max="36" value="'+compareA.n+'">')+
        field('A denominator','<input class="gd-input gd-small" id="fw-ad" type="number" min="1" max="12" value="'+compareA.d+'">')+
      '</div><div class="gd-row">'+
        field('B numerator','<input class="gd-input gd-small" id="fw-bn" type="number" min="0" max="36" value="'+compareB.n+'">')+
        field('B denominator','<input class="gd-input gd-small" id="fw-bd" type="number" min="1" max="12" value="'+compareB.d+'">')+
      '</div>'+
      '<p class="gd-help">Tap the wall to explore equivalence. The comparison bars still support exact proper or improper fractions.</p>';
  }
  function workbenchControlsHtml(){
    return modeTabs()+
      '<p class="gd-section-title">Add a fraction strip</p>'+
      '<div class="gd-row">'+
        field('Numerator','<input class="gd-input gd-small" id="fw-add-n" type="number" min="0" max="36" value="'+focus.n+'">')+
        field('Denominator','<input class="gd-input gd-small" id="fw-add-d" type="number" min="1" max="12" value="'+focus.d+'">')+
      '</div>'+
      '<div class="gd-row"><button class="gd-btn gd-btn--primary" id="fw-add-strip" type="button">Add strip</button><button class="gd-btn" id="fw-add-focus" type="button">Add selected wall fraction</button></div>'+
      '<div class="gd-row"><button class="gd-btn" id="fw-align" type="button">Align strips</button><button class="gd-btn" id="fw-clear-strips" type="button">Clear workbench</button></div>'+
      '<p class="gd-help">Drag strips directly. Select one for duplicate, split into twice as many equal pieces, simplify, lock or delete. Equivalent strips highlight automatically.</p>';
  }
  function workflowTabs(){
    return '<div class="gd-row gd-fr-workflow-tabs" role="tablist" aria-label="Fractions workflow">'+
      '<button class="gd-btn'+(controlTab==='explore'?' gd-btn--primary':'')+'" type="button" data-fw-workflow="explore">Explore</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-fw-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-fw-workflow="export">Export / reuse</button></div>';
  }
  function challengeControlsHtml(){
    if(!CK)return '<p class="gd-help">Challenge tools are unavailable.</p>';
    const tabs=CK.tabsHtml?CK.tabsHtml('fw',challengeTab):'';
    if(challengeTab==='custom'){
      const custom=challenge&&challenge.mode==='custom'?challenge:CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual'});
      return tabs+CK.editorHtml(custom,'fw',{answerSources:customAnswerSources(),generatedAnswerLabel:'Keep the generated answer'})+
        '<div class="gd-row">'+(challenge&&challenge.answer?'<button class="gd-btn" id="fw-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
        (challenge?'<button class="gd-btn" id="fw-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
        '<p class="gd-help">Custom challenges stay attached to the current fraction representation. Live answers update if the bound wall value or strip changes.</p>';
    }
    const picker=CK.pickerHtml(CHALLENGE_TEMPLATES,CHALLENGE_CATEGORIES,challengeCategory,challengeType,'fw');
    const repeat=!!(challenge&&challenge.mode==='standard'&&challenge.type===challengeType);
    return tabs+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="fw-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
      (challenge&&challenge.mode!=='custom'?'<button class="gd-btn" id="fw-edit-challenge" type="button">Edit challenge</button>':'')+
      (challenge&&challenge.answer?'<button class="gd-btn" id="fw-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
      (challenge?'<button class="gd-btn" id="fw-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>';
  }
  function enterCustomChallenge(){
    if(CK)challenge=CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''});
    challengeTab='custom';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();renderRepresentation();
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
    challenge.revealed=false;renderControls();renderRepresentation();
  }
  function clearChallenge(){
    if(beforeChallenge){restoreTeachingSnapshot(beforeChallenge);beforeChallenge=null}
    challenge=null;challengeTab='standard';controlTab='explore';renderControls();renderRepresentation();
  }
  function generateChallenge(type){
    const template=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!template)return;
    if(!beforeChallenge)beforeChallenge=teachingSnapshot();else restoreTeachingSnapshot(beforeChallenge);
    const data=fwGenerate(type,{responseLines});
    restoreTeachingSnapshot(data.diagram);challenge=CK?CK.normalise(data.challenge):data.challenge;
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';
    exportMode='challenge';responseLines=template.category==='reason'?3:1;exportStatus='';
    alignStrips();renderControls();renderRepresentation();
  }

  function exportControlsHtml(){
    const canCard=!!challenge;
    if(!canCard&&exportMode==='challenge')exportMode='diagram';
    return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export the fraction model as a clean vector diagram or a pupil-ready challenge card.</span></div></div>'+
      (canCard?'<div class="nl-export-mode fw-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-fw-export-mode="challenge">Challenge card</button>'+
        '<button type="button" class="'+(exportMode==='diagram'?'is-active':'')+'" data-fw-export-mode="diagram">Diagram only</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="fw-response-lines">'+
          [1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+
          '</select></label><p class="gd-help">The pupil card contains the question, the fraction model and blank answer space. Revealed answers are re-hidden automatically.</p>'
        :'<p class="gd-help">Diagram-only export contains the current fraction wall or strip model without editing controls.</p>')+
      '<div class="nl-export-grid fw-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="fw-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'challenge':'image')+'</button>'+
        '<button class="gd-btn" id="fw-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="fw-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="fw-print" type="button">Print / PDF</button>'+
      '</div>'+(challenge?.mode==='standard'&&exportMode==='challenge'?'<div class="nl-export-grid fw-export-grid"><button class="gd-btn" id="fw-copy-key" type="button">Copy teacher key</button><button class="gd-btn" id="fw-print-key" type="button">Print teacher key</button></div>':'')+'<p class="gd-help" id="fw-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }
  function fwSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function exportHidden(key,id=null,pupil=false){
    if(!challenge)return false;
    if(!pupil)return challengeActiveHidden(key,id);
    if(key==='focus')return !!challenge.hiddenFocusLabel;
    if(key==='compare')return !!challenge.hiddenCompareSign;
    const list=key==='strip-label'?challenge.hiddenStripLabels:challenge.hiddenStripHints;
    return Array.isArray(list)&&list.map(String).includes(String(id));
  }
  function addSvgFractionBar(svg,f,x,y,width,label){
    const value=normalFraction(f),groups=Math.max(1,Math.ceil(value.n/value.d)),rowH=22,rowGap=7;
    if(label)svg.appendChild(fwSvgEl('text',{x,y:y-8,'font-family':'Arial,sans-serif','font-size':13,'font-weight':800,fill:'#40565d'},label));
    for(let g=0;g<groups;g++){
      const yy=y+g*(rowH+rowGap),segW=width/value.d;
      for(let i=0;i<value.d;i++){
        const absolute=g*value.d+i+1,fill=absolute<=value.n;
        svg.appendChild(fwSvgEl('rect',{x:x+i*segW,y:yy,width:segW,height:rowH,fill:fill?'#bfe1dc':'#ffffff',stroke:'#71878c','stroke-width':1}));
      }
    }
    return groups*(rowH+rowGap)-rowGap;
  }
  function wallExportSvg({pupil=false}={}){
    if(pupil&&challenge?.type==='compare-strips'){
      const width=1000,height=225,svg=fwSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Compare fraction strips'});
      svg.appendChild(fwSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
      addSvgFractionBar(svg,compareA,50,65,900,'A · '+rawFractionText(compareA));
      addSvgFractionBar(svg,compareB,50,150,900,'B · '+rawFractionText(compareB));return svg;
    }
    const width=1000,pad=38,rowX=118,rowW=844,rowH=24,rowGap=6,startY=62,wallBottom=startY+12*(rowH+rowGap);
    const compareY=wallBottom+48,height=compareY+154;
    const svg=fwSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Fraction wall and comparison','data-fw-export':'wall'});
    svg.appendChild(fwSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(fwSvgEl('text',{x:pad,y:34,'font-family':'Arial,sans-serif','font-size':20,'font-weight':800,fill:'#24343b'},'Fraction wall'));
    const simpleFocus=simplify(focus.n,focus.d),focusRaw=rawFractionText(focus),focusShown=simpleFocus.n===focus.n&&simpleFocus.d===focus.d?focusRaw:focusRaw+' = '+simpleFocus.n+'/'+simpleFocus.d;
    svg.appendChild(fwSvgEl('text',{x:width-pad,y:34,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':15,'font-weight':700,fill:'#52666d'},'Selected: '+(exportHidden('focus',null,pupil)?'?':focusShown)));
    for(let d=1;d<=12;d++){
      const y=startY+(d-1)*(rowH+rowGap),eqN=equivalentNumerator(d),rowFocus=d===focus.d,segW=rowW/d;
      svg.appendChild(fwSvgEl('text',{x:rowX-14,y:y+17,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':12,'font-weight':700,fill:'#60757b'},d===1?'whole':'1/'+d));
      for(let i=0;i<d;i++){
        const on=eqN!=null&&i<eqN;
        svg.appendChild(fwSvgEl('rect',{x:rowX+i*segW,y,width:segW,height:rowH,fill:on?(rowFocus?'#4faaa0':'#cae7e3'):'#ffffff',stroke:rowFocus?'#397f77':'#9aadb1','stroke-width':rowFocus?1.7:1}));
      }
    }
    svg.appendChild(fwSvgEl('line',{x1:pad,y1:wallBottom+20,x2:width-pad,y2:wallBottom+20,stroke:'#d9e3e5','stroke-width':1.5}));
    const cardW=390,leftX=pad,rightX=width-pad-cardW;
    svg.appendChild(fwSvgEl('text',{x:leftX,y:compareY-12,'font-family':'Arial,sans-serif','font-size':15,'font-weight':800,fill:'#334a52'},'A  '+rawFractionText(compareA)));
    svg.appendChild(fwSvgEl('text',{x:rightX,y:compareY-12,'font-family':'Arial,sans-serif','font-size':15,'font-weight':800,fill:'#334a52'},'B  '+rawFractionText(compareB)));
    addSvgFractionBar(svg,compareA,leftX,compareY,cardW,'');
    addSvgFractionBar(svg,compareB,rightX,compareY,cardW,'');
    const av=fractionValue(compareA),bv=fractionValue(compareB),sign=Math.abs(av-bv)<1e-10?'=':(av>bv?'>':'<');
    svg.appendChild(fwSvgEl('text',{x:width/2,y:height-31,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':26,'font-weight':800,fill:'#2f5f5a'},rawFractionText(compareA)+'  '+(exportHidden('compare',null,pupil)?'?':sign)+'  '+rawFractionText(compareB)));
    svg.appendChild(fwSvgEl('text',{x:width-pad,y:height-10,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function stripsExportSvg({pupil=false}={}){
    const width=1000,pad=42,cardW=520,canvasW=Math.max(320,q('#fw-strip-canvas')?.clientWidth||720);
    const ordered=[...strips].sort((a,b)=>(Number(a.y)||0)-(Number(b.y)||0)||Number(a.id)-Number(b.id));
    const items=ordered.map(strip=>{
      const groups=Math.max(1,Math.ceil(strip.n/strip.d)),h=62+groups*38+28;
      return{strip,groups,h};
    });
    const height=Math.max(250,pad*2+items.reduce((sum,item)=>sum+item.h+18,0)-18);
    const svg=fwSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Fraction strip workbench','data-fw-export':'strips'});
    svg.appendChild(fwSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    let y=pad;
    items.forEach(({strip,groups,h})=>{
      const maxX=Math.max(0,width-pad*2-cardW),x=pad+clamp((Number(strip.x)||0)/Math.max(1,canvasW-cardW),0,1)*maxX;
      const hideLabel=exportHidden('strip-label',strip.id,pupil),hideHint=exportHidden('strip-hint',strip.id,pupil);
      const simple=simplify(strip.n,strip.d),canSimplify=simple.n!==strip.n||simple.d!==strip.d;
      svg.appendChild(fwSvgEl('rect',{x,y,width:cardW,height:h,rx:14,fill:'#f8fbfb',stroke:'#b9c9cc','stroke-width':1.5,'data-fw-export-strip':strip.id}));
      if(!hideLabel)svg.appendChild(fwSvgEl('text',{x:x+18,y:y+28,'font-family':'Arial,sans-serif','font-size':18,'font-weight':800,fill:'#2e4a51'},rawFractionText(strip)));
      if(!pupil&&!hideLabel&&!hideHint&&canSimplify)svg.appendChild(fwSvgEl('text',{x:x+84,y:y+28,'font-family':'Arial,sans-serif','font-size':12,'font-weight':700,fill:'#697d82'},'= '+simple.n+'/'+simple.d));
      const barX=x+18,barW=cardW-36,rowH=25,rowGap=8,barY=y+45;
      for(let g=0;g<groups;g++){
        const yy=barY+g*(rowH+rowGap),segW=barW/strip.d;
        for(let i=0;i<strip.d;i++){
          const absolute=g*strip.d+i+1,fill=absolute<=strip.n;
          svg.appendChild(fwSvgEl('rect',{x:barX+i*segW,y:yy,width:segW,height:rowH,fill:fill?(strip.color||'#cbe7e2'):'#ffffff',stroke:'#70878c','stroke-width':1}));
        }
      }
      const hint=hideHint?'Work it out from the strip.':canSimplify?'Can simplify to '+simple.n+'/'+simple.d:'Value '+Number(fractionValue(strip).toFixed(4));
      if(!pupil&&!hideHint)svg.appendChild(fwSvgEl('text',{x:x+18,y:y+h-12,'font-family':'Arial,sans-serif','font-size':11,fill:'#73858a'},hint));
      y+=h+18;
    });
    if(!items.length)svg.appendChild(fwSvgEl('text',{x:width/2,y:height/2,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':18,fill:'#718388'},'No fraction strips on the workbench.'));
    svg.appendChild(fwSvgEl('text',{x:width-pad,y:height-10,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function fractionExportSvg(options={}){
    return mode==='workbench'?stripsExportSvg(options):wallExportSvg(options);
  }
  function exportTargetSvg(teacher=false){
    if(challenge?.mode==='standard'&&exportMode==='challenge')return fwPaper(fwData({diagram:teachingSnapshot(),challenge,responseLines}),teacher);
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return fractionExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(fractionExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Fractions challenge',
      prompt,
      responseLabel:challenge.category==='reason'?'Explain your thinking':'Answer',
      responseLines,
      brand:'99 Club Studio'
    });
  }
  function exportName(){
    const meta=challenge&&CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    if(exportMode==='challenge'&&challenge)return challenge.title||meta?.title||'fractions-challenge';
    return mode==='workbench'?'fraction-strips':'fraction-wall';
  }
  function exportMessage(text){exportStatus=text;const el=q('#fw-export-status');if(el)el.textContent=text}
  async function exportAction(kind,teacher=false){
    try{
      if(!X)throw new Error('Export tools are not available.');
      const target=exportTargetSvg(teacher),isCard=exportMode==='challenge'&&!!challenge,name=exportName()+(teacher?'-teacher-key':'');
      if(kind==='copy'){await X.copyPng(target);exportMessage(isCard?'Challenge copied — paste it into your worksheet, slide or document.':'Fraction image copied — paste it into your slide or document.')}
      if(kind==='png'){await X.downloadPng(target,name,2);exportMessage(isCard?'Challenge PNG downloaded.':'Fraction PNG downloaded.')}
      if(kind==='svg'){X.downloadSvg(target,name);exportMessage(isCard?'Challenge SVG downloaded.':'Fraction SVG downloaded.')}
      if(kind==='print'){X.printSvg(target,{title:'',landscape:true});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'That export did not work.')}
  }
  function controlsHtml(){
    const body=controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():(mode==='workbench'?workbenchControlsHtml():wallControlsHtml());
    return workflowTabs()+body;
  }
  function renderControls(){const panel=q('#gd-controls');if(panel)panel.innerHTML=controlsHtml();bindControls()}

  function drawWall(){
    const a=fractionQuestionFixed()?compareA:readCompare('a'),b=fractionQuestionFixed()?compareB:readCompare('b'),av=a.n/a.d,bv=b.n/b.d,sign=Math.abs(av-bv)<1e-10?'=':(av>bv?'>':'<');
    const simpleFocus=simplify(focus.n,focus.d);
    const rawFocusText=simpleFocus.n===focus.n&&simpleFocus.d===focus.d?focus.n+'/'+focus.d:focus.n+'/'+focus.d+' = '+simpleFocus.n+'/'+simpleFocus.d;
    const focusText=challengeActiveHidden('focus')?'?':rawFocusText,displaySign=challengeActiveHidden('compare')?'?':sign;
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Fractions challenge',pupil:({ 'identify-strip':CK.pupilSpec('fraction-form'), 'equivalent-strip':CK.pupilSpec('fraction-form'), 'compare-strips':CK.pupilSpec('choice',{choices:['<','>','=']}), 'simplify-strip':CK.pupilSpec('fraction-form'), 'mixed-improper':CK.pupilSpec('mixed'), 'denominator-misconception':CK.pupilSpec('choice',{choices:['Yes','No'],expected:challenge.answer.startsWith('Yes')?'Yes':'No',explain:true}) }[challenge.type]),actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'},{action:'end',label:'Back to setup'}]:[{action:'end',label:'End challenge'}]}):'';
    if(fractionQuestionFixed()&&challenge.type==='compare-strips'){
      q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-fractions-workspace"><section class="gd-fr-compare gd-fr-compare-direct gd-fr-focused-compare">'+
        '<div class="gd-fr-compare-card"><div class="gd-fr-card-head"><strong>A</strong><span>'+rawFractionText(a)+'</span></div>'+directBar(a,'a')+'</div>'+
        '<div class="gd-fr-compare-card"><div class="gd-fr-card-head"><strong>B</strong><span>'+rawFractionText(b)+'</span></div>'+directBar(b,'b')+'</div></section></div>';
      qa('[data-fw-set]',q('#gd-stage')).forEach(el=>{el.disabled=true;el.setAttribute('aria-label',el.classList.contains('is-fill')?'Shaded part':'Unshaded part')});
      bindChallengeStageActions();return;
    }
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-fractions-workspace">'+
      '<section class="gd-fr-wall-card">'+
        '<div class="gd-fr-wall-heading"><div><strong>Fraction wall</strong><span>Tap an endpoint. Equivalent amounts highlight automatically.</span></div>'+
          '<div class="gd-fr-focus"><span>Selected</span><strong>'+focusText+'</strong><button type="button" data-fw-use="a">Use as A</button><button type="button" data-fw-use="b">Use as B</button><button type="button" data-fw-to-workbench>Add strip</button></div>'+
        '</div><div class="gd-fraction-wall">'+wallRows()+'</div>'+
      '</section>'+
      '<section class="gd-fr-compare gd-fr-compare-direct">'+
        '<div class="gd-fr-compare-card"><div class="gd-fr-card-head"><strong>A</strong><span>'+fractionText(a)+'</span></div>'+directBar(a,'a')+'<p>Tap a segment to change the numerator.</p></div>'+
        '<div class="gd-fr-compare-card"><div class="gd-fr-card-head"><strong>B</strong><span>'+fractionText(b)+'</span></div>'+directBar(b,'b')+'<p>Tap a segment to change the numerator.</p></div>'+
      '</section>'+
      '<div class="gd-equation gd-fr-equation"><span>'+a.n+'/'+a.d+'</span><strong>'+displaySign+'</strong><span>'+b.n+'/'+b.d+'</span></div></div>';

    if(fractionQuestionFixed()){
      qa('[data-fw-wall],[data-fw-set],[data-fw-use],[data-fw-to-workbench]',q('#gd-stage')).forEach(el=>{el.disabled=true});
      qa('.gd-fr-wall-heading > div > span,.gd-fr-compare-card > p',q('#gd-stage')).forEach(el=>el.hidden=true);
      bindChallengeStageActions();return;
    }
    qa('[data-fw-wall]',q('#gd-stage')).forEach(cell=>cell.onclick=()=>{
      const [d,i]=cell.dataset.fwWall.split(':').map(Number);focus={n:i+1,d};updateChallengeAnswer();renderControls();drawWall();
    });
    qa('[data-fw-use]',q('#gd-stage')).forEach(button=>button.onclick=()=>{
      const value=normalFraction(focus);if(button.dataset.fwUse==='a')compareA=value;else compareB=value;updateChallengeAnswer();renderControls();drawWall();
    });
    qa('[data-fw-set]',q('#gd-stage')).forEach(piece=>piece.onclick=()=>{
      const [key,raw]=piece.dataset.fwSet.split(':'),current=key==='a'?compareA:compareB;
      const value={n:clamp(Math.round(num(raw,0)),0,current.d*3),d:current.d};
      if(key==='a')compareA=value;else compareB=value;updateChallengeAnswer();renderControls();drawWall();
    });
    const toWorkbench=q('[data-fw-to-workbench]',q('#gd-stage'));
    if(toWorkbench)toWorkbench.onclick=()=>{
      addStrip(focus);
      switchMode('workbench');
    };
    bindChallengeStageActions();
  }

  function stateSnapshot(){return{strips:JSON.parse(JSON.stringify(strips)),nextStrip}}
  function restoreState(value){
    strips=Array.isArray(value?.strips)?value.strips.map(s=>({...s,...normalFraction(s),x:num(s.x,28),y:num(s.y,30),locked:!!s.locked,color:s.color||'#cbe7e2'})):[];
    nextStrip=Math.max(1,Math.round(num(value?.nextStrip,1)));
  }
  function selectedStrip(id){return strips.find(s=>String(s.id)===String(id))||null}
  function stripBars(strip){
    const groups=Math.max(1,Math.ceil(strip.n/strip.d));
    return Array.from({length:groups},(_,g)=>'<div class="gd-fr-strip-whole">'+Array.from({length:strip.d},(_,i)=>{
      const absolute=g*strip.d+i+1,fill=absolute<=strip.n;
      return '<button type="button" class="gd-fr-strip-segment'+(fill?' is-fill':'')+'" data-fr-strip-piece="'+strip.id+':'+absolute+'" aria-label="Set numerator to '+absolute+'"></button>';
    }).join('')+'</div>').join('');
  }
  function stripMarkup(strip,selectedId){
    const selected=String(strip.id)===String(selectedId),selectedObj=selectedStrip(selectedId),same=selectedObj&&String(selectedObj.id)!==String(strip.id)&&equivalent(strip,selectedObj);
    const simple=simplify(strip.n,strip.d),canSimplify=simple.n!==strip.n||simple.d!==strip.d;
    const hideLabel=challengeActiveHidden('strip-label',strip.id),hideHint=challengeActiveHidden('strip-hint',strip.id);
    const fixed=fractionQuestionFixed(),label=hideLabel?'':strip.n+'/'+strip.d,secondary=fixed||hideLabel||hideHint?'':fractionText(strip);
    const hint=hideHint?'Work it out':(canSimplify?'Can simplify to '+simple.n+'/'+simple.d:'Value '+Number(fractionValue(strip).toFixed(4)));
    return '<div class="gd-fr-strip-object'+(selected?' is-selected':'')+(same?' is-equivalent':'')+(strip.locked?' is-locked':'')+'" data-gd-object="'+strip.id+'" role="button" tabindex="0" aria-selected="'+(selected?'true':'false')+'" aria-label="Fraction strip'+(hideLabel?' with hidden value':' '+strip.n+'/'+strip.d)+(strip.locked?', locked':'')+'" style="left:'+strip.x+'px;top:'+strip.y+'px;--fr-strip:'+strip.color+'">'+
      (fixed&&hideLabel?'':'<div class="gd-fr-strip-head"><strong>'+label+'</strong>'+(secondary?'<span>'+secondary+'</span>':'')+(same?'<em>same value</em>':'')+(strip.locked?'<b aria-hidden="true">⌑</b>':'')+'</div>')+
      '<div class="gd-fr-strip-bars">'+stripBars(strip)+'</div>'+
      (fixed||hideHint?'':'<small>'+hint+'</small>')+
    '</div>';
  }
  function workbenchRail(selected,meta){
    if(fractionQuestionFixed())return '';
    const object=selected?
      I.toolButton('duplicate','duplicate','Duplicate strip','',false)+
      I.toolButton('split','grid','Split every piece in two','',selected.locked||selected.d*2>12)+
      I.toolButton('simplify','clear','Simplify fraction','',selected.locked||gcd(selected.n,selected.d)===1)+
      I.toolButton('lock',selected.locked?'unlock':'lock',selected.locked?'Unlock strip':'Lock strip',selected.locked?'is-active':'',false)+
      I.toolButton('delete','delete','Delete strip','is-danger',selected.locked):'';
    const add=challenge?.mode==='standard'?'':I.toolButton('add','plus','Add '+rawFractionText(focus)+' strip','',false);
    return '<div class="gd-object-ui"><div class="gd-object-rail'+(selected?' is-engaged':'')+'" aria-label="Fraction strip tools">'+
      add+(add?'<span class="gd-object-separator"></span>':'')+
      object+(object?'<span class="gd-object-separator"></span>':'')+
      I.toolButton('undo','undo','Undo','',!meta?.canUndo)+I.toolButton('redo','redo','Redo','',!meta?.canRedo)+
      I.toolButton('align','grid','Align strips','',strips.length<2)+'</div></div>';
  }
  function stripHeight(strip){return 58+Math.max(1,Math.ceil(strip.n/strip.d))*32}
  function workbenchHeight(){return Math.max(fractionQuestionFixed()?150:500,40+strips.reduce((max,strip)=>Math.max(max,(Number(strip.y)||0)+stripHeight(strip)),0))}
  function drawWorkbench(selectedId,meta){
    const selected=selectedStrip(selectedId);
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Fractions challenge',pupil:({ 'identify-strip':CK.pupilSpec('fraction-form'), 'equivalent-strip':CK.pupilSpec('fraction-form'), 'compare-strips':CK.pupilSpec('choice',{choices:['<','>','=']}), 'simplify-strip':CK.pupilSpec('fraction-form'), 'mixed-improper':CK.pupilSpec('mixed'), 'denominator-misconception':CK.pupilSpec('choice',{choices:['Yes','No'],expected:challenge.answer.startsWith('Yes')?'Yes':'No',explain:true}) }[challenge.type]),actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'},{action:'end',label:'Back to setup'}]:[{action:'end',label:'End challenge'}]}):'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-fr-workbench"><div class="gd-fr-strip-canvas-wrap"><div class="gd-fr-strip-canvas" id="fw-strip-canvas" data-gd-canvas-bg style="min-height:'+workbenchHeight()+'px" tabindex="0" aria-label="Fraction strip workbench. Drag strips to compare them.">'+
      strips.map(s=>stripMarkup(s,selectedId)).join('')+
      '</div>'+workbenchRail(selected,meta)+'</div>'+
      '<div class="gd-object-hint">'+(selected?(selected.locked?'Strip locked · unlock it to change or move it.':'Drag to compare · split keeps the same value with twice as many equal pieces.'):(challenge?.mode==='standard'?'Use the shaded parts of the supplied strips to work out your answer.':'Use + to add the selected wall fraction, then drag or align strips to compare their lengths.'))+'</div></div>';
    if(fractionQuestionFixed())qa('[data-fr-strip-piece]',q('#gd-stage')).forEach(piece=>{piece.disabled=true;piece.setAttribute('aria-label',piece.classList.contains('is-fill')?'Shaded part':'Unshaded part')});
    else bindStripSegments();
    bindChallengeStageActions();
  }
  function constrainStrip(item,x,y,element,canvas){
    const el=element||canvas.querySelector('[data-gd-object="'+item.id+'"]'),w=el?.offsetWidth||290,h=el?.offsetHeight||90;
    return{x:clamp(x,0,Math.max(0,canvas.clientWidth-w)),y:clamp(y,0,Math.max(0,canvas.clientHeight-h))};
  }
  function duplicateStrip(item){
    const canvas=q('#fw-strip-canvas'),copy={...item,id:nextStrip++,locked:false};
    const w=canvas?.clientWidth||720,h=canvas?.clientHeight||500;
    copy.x=clamp((Number(item.x)||0)+42,0,Math.max(0,w-300));copy.y=clamp((Number(item.y)||0)+42,0,Math.max(0,h-100));
    strips.push(copy);return copy;
  }
  function addStrip(raw){
    const value=normalFraction(raw),id=nextStrip++,i=strips.length;
    const bottom=strips.reduce((max,strip)=>Math.max(max,(Number(strip.y)||0)+stripHeight(strip)),6);
    strips.push({id,n:value.n,d:value.d,x:24,y:bottom+18,locked:false,color:['#cbe7e2','#cfe0f6','#f6dfad','#e7d8f3','#d5ead2'][i%5]});
    return id;
  }
  function alignStrips(){
    let y=24;
    strips.forEach(strip=>{strip.x=24;strip.y=y;y+=stripHeight(strip)+18});
  }
  function bindStripSegments(){
    qa('[data-fr-strip-piece]',q('#gd-stage')).forEach(piece=>piece.onclick=e=>{
      e.stopPropagation();
      const [idRaw,nRaw]=piece.dataset.frStripPiece.split(':'),strip=selectedStrip(idRaw);if(!strip||strip.locked)return;
      controller.mutate(()=>{strip.n=clamp(Math.round(num(nRaw,strip.n)),0,strip.d*3);updateChallengeAnswer()});
      controller.select(strip.id);
    });
  }
  function mountWorkbench(){
    if(!I){q('#gd-stage').innerHTML='<p class="gd-empty">The fraction strip workbench could not start.</p>';return}
    controller=I.mount({
      getItems:()=>strips,
      getState:stateSnapshot,
      setState:restoreState,
      getCanvas:()=>q('#fw-strip-canvas'),
      getActionRoot:()=>q('#gd-stage'),
      render:drawWorkbench,
      snap:10,
      nudgeStep:10,
      constrain:constrainStrip,
      duplicate:duplicateStrip,
      remove:item=>{strips=strips.filter(s=>s!==item)},
      toggleLock:item=>{item.locked=!item.locked},
      onAction:(action,api)=>{
        const selected=api.selected();
        if(action==='add'&&challenge?.mode!=='standard'){
          let id=null;api.mutate(()=>{id=addStrip(focus);updateChallengeAnswer()});api.select(id);renderControls();
        }
        else if(action==='split'&&selected&&!selected.locked&&selected.d*2<=12)api.mutate(()=>{selected.n*=2;selected.d*=2;updateChallengeAnswer()});
        else if(action==='simplify'&&selected&&!selected.locked)api.mutate(()=>{const s=simplify(selected.n,selected.d);selected.n=s.n;selected.d=s.d;updateChallengeAnswer()});
        else if(action==='align')api.mutate(alignStrips);
      }
    });
    controller.refresh();
  }
  function bindChallengeStageActions(){
    const endChallenge=q('[data-challenge-action="end"]',q('#gd-stage'));if(endChallenge)endChallenge.onclick=e=>{e.stopPropagation();clearChallenge()};
    const stage=q('#gd-stage');if(!stage||!challenge)return;
    const reveal=q('[data-board-action="reveal"]',stage);
    if(reveal)reveal.onclick=e=>{e.stopPropagation();challenge.revealed=!challenge.revealed;renderControls();renderRepresentation()};
    const another=q('[data-challenge-action="another"]',stage);
    if(another)another.onclick=e=>{e.stopPropagation();if(challenge?.mode==='standard')generateChallenge(challenge.type)};
  }
  function renderRepresentation(){
    updateChallengeAnswer();
    if(mode==='wall'){
      I?.clear?.();controller=null;drawWall();
    }else if(fractionQuestionFixed()){I?.clear?.();controller=null;drawWorkbench(null,{})}
    else mountWorkbench();
  }
  function switchMode(next){
    if(fractionQuestionFixed())return;
    mode=next==='workbench'?'workbench':'wall';
    renderControls();renderRepresentation();
  }
  function bindControls(){
    const controls=q('#gd-controls');if(!controls)return;

    qa('[data-fw-workflow]',controls).forEach(button=>button.onclick=()=>{
      const next=button.dataset.fwWorkflow;
      controlTab=next==='challenge'?'challenge':next==='export'?'export':'explore';renderControls();
    });

    if(controlTab==='export'){
      qa('[data-fw-export-mode]',controls).forEach(button=>button.onclick=()=>{
        exportMode=button.dataset.fwExportMode==='challenge'&&challenge?'challenge':'diagram';exportStatus='';renderControls();
      });
      const response=q('#fw-response-lines',controls);if(response)response.onchange=()=>{
        responseLines=clamp(Math.round(num(response.value,1)),1,4);renderControls();
      };
      const copyImage=q('#fw-copy-image',controls);if(copyImage)copyImage.onclick=()=>exportAction('copy');
      const png=q('#fw-png',controls);if(png)png.onclick=()=>exportAction('png');
      const svgDownload=q('#fw-svg-download',controls);if(svgDownload)svgDownload.onclick=()=>exportAction('svg');
      const print=q('#fw-print',controls);if(print)print.onclick=()=>exportAction('print');
      const kc=q('#fw-copy-key',controls),kp=q('#fw-print-key',controls);if(kc)kc.onclick=()=>exportAction('copy',true);if(kp)kp.onclick=()=>exportAction('print',true);
      return;
    }

    if(controlTab==='challenge'){
      qa('[data-fw-challenge-tab]',controls).forEach(button=>button.onclick=()=>{
        if(button.dataset.fwChallengeTab==='custom')enterCustomChallenge();
        else{challengeTab='standard';renderControls()}
      });
      qa('[data-fw-challenge-cat]',controls).forEach(button=>button.onclick=()=>{
        challengeCategory=button.dataset.fwChallengeCat;
        const first=CHALLENGE_TEMPLATES.find(t=>t.category===challengeCategory);
        if(first)challengeType=first.id;
        renderControls();
      });
      qa('[data-fw-challenge-type]',controls).forEach(button=>button.onclick=()=>{
        challengeType=button.dataset.fwChallengeType;renderControls();
      });
      qa('[data-gd-rich-action]',controls).forEach(button=>button.onclick=e=>{
        e.preventDefault();
        const editor=q('#fw-custom-prompt',controls);
        if(editor&&CK&&challenge){
          CK.applyFormat(editor,button.dataset.gdRichAction);
          challenge.promptHtml=CK.sanitiseRichHtml(editor.innerHTML);
          challenge.prompt=CK.plainText(challenge.promptHtml).slice(0,600);
          renderRepresentation();
        }
      });
      const generate=q('#fw-generate',controls);if(generate)generate.onclick=()=>generateChallenge(challengeType);
      const edit=q('#fw-edit-challenge',controls);if(edit)edit.onclick=enterCustomChallenge;
      const end=q('#fw-clear-challenge',controls);if(end)end.onclick=clearChallenge;
      const reveal=q('#fw-reveal',controls);if(reveal)reveal.onclick=()=>{if(!challenge)return;challenge.revealed=!challenge.revealed;renderControls();renderRepresentation()};

      const title=q('#fw-custom-title',controls);if(title)title.oninput=()=>{
        if(!challenge)return;challenge.title=title.value.slice(0,100);renderRepresentation();
      };
      const prompt=q('#fw-custom-prompt',controls);if(prompt)prompt.oninput=()=>{
        if(!challenge||!CK)return;challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml).slice(0,600);renderRepresentation();
      };
      const source=q('#fw-custom-answer-source',controls);if(source)source.onchange=()=>setCustomAnswerSource(source.value);
      const answer=q('#fw-custom-answer',controls);if(answer)answer.oninput=()=>{
        if(!challenge)return;challenge.answer=answer.value.slice(0,400);challenge.answerMode='manual';challenge.answerSource='';
        if(challenge.revealed)renderRepresentation();
      };
      return;
    }

    if(fractionQuestionFixed()){qa('button,input,select',controls).filter(el=>!el.matches('[data-fw-workflow]')).forEach(el=>el.disabled=true);return}
    qa('[data-fw-mode]',controls).forEach(button=>button.onclick=()=>switchMode(button.dataset.fwMode));
    if(mode==='wall'){
      ['fw-an','fw-ad','fw-bn','fw-bd'].forEach(id=>{const el=q('#'+id,controls);if(el)el.oninput=()=>{readCompare(id[3]);updateChallengeAnswer();drawWall()}});
      return;
    }
    const add=q('#fw-add-strip',controls);if(add)add.onclick=()=>{
      const raw={n:num(q('#fw-add-n',controls)?.value,focus.n),d:num(q('#fw-add-d',controls)?.value,focus.d)};
      let id=null;controller.mutate(()=>{id=addStrip(raw)});controller.select(id);
    };
    const addFocus=q('#fw-add-focus',controls);if(addFocus)addFocus.onclick=()=>{let id=null;controller.mutate(()=>{id=addStrip(focus)});controller.select(id)};
    const align=q('#fw-align',controls);if(align)align.onclick=()=>controller.mutate(alignStrips);
    const clear=q('#fw-clear-strips',controls);if(clear)clear.onclick=()=>{
      if(!strips.length)return;if(!window.confirm('Clear all fraction strips from the workbench?'))return;
      controller.mutate(()=>{strips=[];updateChallengeAnswer()});
    };
  }

  setPanels(controlsHtml(),'');
  bindControls();
  drawWall();
  G.lessonState?.register('fraction-wall',()=>({diagram:teachingSnapshot(),challenge,beforeChallenge,pupil:CK?.capturePupil?.(challenge),controlTab,challengeTab,challengeCategory,challengeType,exportMode,responseLines}),saved=>{
    restoreTeachingSnapshot(saved.diagram);challenge=saved.challenge?CK.normalise(saved.challenge):null;beforeChallenge=saved.beforeChallenge||null;
    if(Object.prototype.hasOwnProperty.call(saved,'controlTab'))controlTab=saved.controlTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeTab'))challengeTab=saved.challengeTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeCategory'))challengeCategory=saved.challengeCategory;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeType'))challengeType=saved.challengeType;
    if(Object.prototype.hasOwnProperty.call(saved,'exportMode'))exportMode=saved.exportMode;
    if(Object.prototype.hasOwnProperty.call(saved,'responseLines'))responseLines=saved.responseLines;
    CK?.restorePupil?.(challenge,saved.pupil);renderControls();renderRepresentation();
  });

}

function barModel(){
  const CK=G.challengeKit,X=G.exportTools;
  let parts=[
    {id:1,value:30,unknown:false},
    {id:2,value:20,unknown:false},
    {id:3,value:30,unknown:true}
  ];
  let nextId=4,total=80,selectedId=3,drag=null;
  const undoStack=[],redoStack=[];
  const CHALLENGE_CATEGORIES=[
    {id:'read',label:'Read & solve'},
    {id:'compare',label:'Compare'},
    {id:'groups',label:'Equal groups'},
    {id:'build',label:'Build'},
    {id:'reason',label:'Reasoning'}
  ];
  const CHALLENGE_TEMPLATES=[
    {id:'missing-part',category:'read',title:'Find the missing part',desc:'Use the whole and known parts to find one missing part.'},
    {id:'find-whole',category:'read',title:'Find the whole',desc:'Add the shown parts to find the whole.'},
    {id:'write-equation',category:'read',title:'Write the equation',desc:'Write an equation that matches the shown model.'},
    {id:'compare-difference',category:'compare',title:'Find the difference',desc:'Compare two aligned bars and find how much more one represents.'},
    {id:'equal-groups-total',category:'groups',title:'Equal groups — whole',desc:'Use equal parts to find the whole.'},
    {id:'equal-groups-part',category:'groups',title:'Equal groups — one part',desc:'Use the whole and number of equal parts to find one part.'},
    {id:'build-model',category:'build',title:'Build the model',desc:'Edit the bar to match a given part–whole relationship.'},
    {id:'spot-error',category:'reason',title:'Spot the error',desc:'Decide whether a shown part–whole model is mathematically consistent.'}
  ];
  let controlTab='explore',challengeTab='standard',challengeCategory='read',challengeType='missing-part',challenge=null,beforeChallenge=null;
  let exportMode='diagram',responseLines=1,exportStatus='';

  function cloneParts(value=parts){return value.map(p=>({...p}))}
  function snapshot(){return{parts:cloneParts(),nextId,total,selectedId}}
  function restore(state){
    parts=cloneParts(Array.isArray(state?.parts)?state.parts:[]);
    nextId=Math.max(Number(state?.nextId)||1,parts.reduce((m,p)=>Math.max(m,Number(p.id)||0),0)+1);
    total=state?.total==null?null:Math.max(0,Number(state.total)||0);
    selectedId=parts.some(p=>String(p.id)===String(state?.selectedId))?state.selectedId:(parts[0]?.id??null);
    syncControlInputs();
  }
  function remember(){
    undoStack.push(snapshot());
    if(undoStack.length>50)undoStack.shift();
    redoStack.length=0;
  }
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
  function selectedPart(){return parts.find(p=>String(p.id)===String(selectedId))||null}
  function knownSum(){return parts.filter(p=>!p.unknown).reduce((s,p)=>s+Math.max(0,Number(p.value)||0),0)}
  function unknownParts(){return parts.filter(p=>p.unknown)}
  function inferredUnknown(){
    const u=unknownParts();
    if(total==null||u.length!==1)return null;
    return Math.max(0,total-knownSum());
  }
  function solvedPartValue(part){
    if(!part)return null;
    if(!part.unknown)return Math.max(0,Number(part.value)||0);
    const inferred=inferredUnknown();
    return inferred==null?null:inferred;
  }
  function effectiveValue(part){
    const solved=solvedPartValue(part);
    if(solved!=null)return solved;
    const known=parts.filter(p=>!p.unknown).map(p=>Math.max(0,Number(p.value)||0));
    return known.length?Math.max(1,known.reduce((a,b)=>a+b,0)/known.length):10;
  }
  function visualTotal(){return Math.max(1,parts.reduce((s,p)=>s+effectiveValue(p),0))}
  function challengeHidden(key){
    return !!(challenge&&!challenge.revealed&&challenge[key]);
  }
  function hiddenPart(index){
    return !!(challenge&&!challenge.revealed&&Array.isArray(challenge.hiddenPartIndexes)&&challenge.hiddenPartIndexes.includes(index));
  }
  function totalText(raw=false){
    if(!raw&&challengeHidden('hiddenTotal'))return'?';
    if(total!=null)return String(Math.round(total*100)/100);
    if(unknownParts().length)return'?';
    return String(Math.round(knownSum()*100)/100);
  }
  function partText(part,index,raw=false){
    if(!raw&&hiddenPart(index))return'?';
    if(part.unknown)return'?';
    return String(Math.round((Number(part.value)||0)*100)/100);
  }
  function solvedPartText(part){
    const value=solvedPartValue(part);
    return value==null?'?':String(Math.round(value*100)/100);
  }
  function solvedEquation(){
    return parts.map(solvedPartText).join(' + ')+' = '+(total!=null?Math.round(total*100)/100:knownSum());
  }
  function equationText(){
    if(challengeHidden('hiddenEquation'))return'?';
    return parts.map((p,i)=>partText(p,i)).join(' + ')+' = '+totalText();
  }
  function rawStatusText(){
    const unknowns=unknownParts(),inferred=inferredUnknown();
    if(unknowns.length===1&&inferred!=null)return'Unknown part = '+(Math.round(inferred*100)/100);
    if(unknowns.length>1)return unknowns.length+' unknown parts · one total cannot determine them uniquely';
    if(total==null)return'Total = '+knownSum();
    const diff=total-knownSum();
    if(Math.abs(diff)<1e-9)return'Parts match the total ✓';
    return diff>0?(Math.round(diff*100)/100)+' still unallocated':(Math.round(Math.abs(diff)*100)/100)+' over the total';
  }
  function buildOnTarget(){
    if(!challenge||challenge.type!=='build-model'||!Array.isArray(challenge.targetParts))return false;
    if(Number(total)!==Number(challenge.targetTotal)||parts.length!==challenge.targetParts.length)return false;
    return challenge.targetParts.every((target,index)=>{
      const p=parts[index];if(!p)return false;
      if(target.unknown!==!!p.unknown)return false;
      return target.unknown||Math.abs(Number(p.value)-Number(target.value))<1e-9;
    });
  }
  function statusText(){
    if(challengeHidden('hiddenStatus'))return'?';
    if(challenge?.comparison)return'Difference = '+(Math.round(challenge.comparison.difference*100)/100);
    if(challenge?.type==='build-model')return 'Build the model, then check';
    return rawStatusText();
  }
  function challengeFrozen(){return !!(challenge&&challenge.mode==='standard'&&challenge.freezeModel)}
  function syncControlInputs(){
    const input=q('#bm-total');
    if(input)input.value=total==null?'':String(total);
  }
  function addPart(){
    if(parts.length>=8)return;
    const value=10,id=nextId++;
    parts.push({id,value,unknown:false});selectedId=id;
  }
  function duplicatePart(part){
    if(!part||parts.length>=8)return;
    const copy={...part,id:nextId++};parts.splice(parts.indexOf(part)+1,0,copy);selectedId=copy.id;
  }
  function deletePart(part){
    if(!part||parts.length<=1)return;
    const index=parts.indexOf(part);if(index<0)return;
    parts.splice(index,1);
    selectedId=parts[Math.min(index,parts.length-1)]?.id??null;
  }
  function changeValue(part,delta){
    if(!part||part.unknown)return;
    part.value=Math.max(0,Math.round(((Number(part.value)||0)+delta)*100)/100);
  }
  function setValue(part,value){
    if(!part)return;
    part.unknown=false;
    part.value=Math.max(0,Math.round((Number(value)||0)*100)/100);
  }
  function toggleUnknown(part,on){
    if(!part)return;
    part.unknown=!!on;
    if(!part.unknown&&!Number.isFinite(Number(part.value)))part.value=10;
  }
  function labelFor(index){return String.fromCharCode(65+index)}
  function handleEnabled(index){
    if(challengeFrozen())return false;
    const a=parts[index],b=parts[index+1];
    return !!(a&&b&&!a.unknown&&!b.unknown&&(Number(a.value)||0)>0&&(Number(b.value)||0)>0);
  }
  function adjustBoundary(index,delta){
    if(!handleEnabled(index))return false;
    const left=parts[index],right=parts[index+1],sum=Number(left.value)+Number(right.value);
    if(sum<=0)return false;
    const nextLeft=clamp(Math.round((Number(left.value)+delta)*100)/100,.01,Math.max(.01,sum-.01));
    left.value=nextLeft;right.value=Math.round((sum-nextLeft)*100)/100;
    return true;
  }
  function resolveAnswerSource(source){
    if(source==='total')return total==null?'':String(Math.round(total*100)/100);
    if(source==='equation')return solvedEquation();
    if(source==='parts-count')return String(parts.length);
    if(source==='unknown'){
      const inferred=inferredUnknown();return inferred==null?'':String(Math.round(inferred*100)/100);
    }
    if(source==='difference'&&challenge?.comparison)return String(Math.round(challenge.comparison.difference*100)/100);
    if(source.startsWith('part:')){
      const index=Number(source.split(':')[1]),part=parts[index],value=solvedPartValue(part);
      return value==null?'':String(Math.round(value*100)/100);
    }
    return'';
  }
  function customAnswerSources(){
    const sources=[
      {id:'total',label:'Whole / total'},
      {id:'equation',label:'Solved equation'},
      {id:'parts-count',label:'Number of parts'}
    ];
    if(inferredUnknown()!=null)sources.push({id:'unknown',label:'Resolved unknown part'});
    parts.forEach((part,index)=>sources.push({id:'part:'+index,label:'Part '+labelFor(index)+' value'}));
    if(challenge?.comparison)sources.push({id:'difference',label:'Comparison difference'});
    return sources;
  }
  function clearBoundHiding(){
    if(!challenge)return;
    challenge.hiddenTotal=false;challenge.hiddenEquation=false;challenge.hiddenStatus=false;challenge.hiddenPartIndexes=[];
  }
  function applyBoundHiding(source){
    clearBoundHiding();if(!challenge)return;
    if(source==='total')challenge.hiddenTotal=true;
    else if(source==='equation')challenge.hiddenEquation=true;
    else if(source==='unknown'){
      const index=parts.findIndex(p=>p.unknown);if(index>=0)challenge.hiddenPartIndexes=[index];
      challenge.hiddenStatus=true;
    }else if(source.startsWith('part:')){
      const index=Number(source.split(':')[1]);if(Number.isInteger(index))challenge.hiddenPartIndexes=[index];
    }else if(source==='difference')challenge.hiddenStatus=true;
  }
  function updateChallengeAnswer(){
    if(!challenge||challenge.answerMode!=='bound'||!challenge.answerSource)return;
    const answer=resolveAnswerSource(challenge.answerSource);if(answer!=='')challenge.answer=answer;
    const live=q('#bm-custom-live-answer');if(live)live.textContent=challenge.answer||'—';
    if(challenge.revealed){
      const shown=q('.gd-challenge-actions em',q('#gd-stage'));if(shown)shown.textContent='Answer: '+challenge.answer;
    }
  }
  function challengeObject(type,prompt,answer,extra={}){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);
    const raw={mode:'standard',type,category:meta?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),answerMode:'bound',answerSource:'',revealed:false,freezeModel:true,hiddenTotal:false,hiddenEquation:false,hiddenStatus:false,hiddenPartIndexes:[],comparison:null,targetParts:null,targetTotal:null,...extra};
    return CK?CK.normalise(raw):raw;
  }
  function randomInt(min,max){return min+Math.floor(Math.random()*(max-min+1))}
  function setParts(values){
    parts=values.map((entry,index)=>{
      const unknown=entry==null||entry==='?';
      return{id:index+1,value:unknown?10:Number(entry),unknown};
    });
    nextId=parts.length+1;selectedId=parts.find(p=>p.unknown)?.id||parts[0]?.id||null;
  }
  function restoreBeforeChallenge(){if(beforeChallenge){restore(beforeChallenge);beforeChallenge=null}}
  function clearChallenge(){
    restoreBeforeChallenge();challenge=null;challengeTab='standard';controlTab='challenge';exportMode='diagram';exportStatus='';undoStack.length=0;redoStack.length=0;renderControls();draw();
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
  function generateChallenge(type){
    const template=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!template)return;
    if(!beforeChallenge)beforeChallenge=snapshot();else restore(beforeChallenge);
    undoStack.length=0;redoStack.length=0;
    if(type==='missing-part'){
      const a=randomInt(12,45),b=randomInt(8,30),c=randomInt(6,25);
      total=a+b+c;setParts([a,null,c]);
      challenge=challengeObject(type,'Find the missing part in this part–whole model.',b,{hiddenStatus:true,hiddenPartIndexes:[1]});
    }else if(type==='find-whole'){
      const values=[randomInt(8,30),randomInt(8,30),randomInt(5,25)];
      total=values.reduce((a,b)=>a+b,0);setParts(values);
      challenge=challengeObject(type,'What is the whole represented by these parts?',total,{hiddenTotal:true,hiddenStatus:true});
    }else if(type==='write-equation'){
      const values=[randomInt(5,25),randomInt(5,25),randomInt(5,25)];
      total=values.reduce((a,b)=>a+b,0);setParts(values);
      challenge=challengeObject(type,'Write an addition equation that matches this bar model.',values.join(' + ')+' = '+total,{hiddenEquation:true});
    }else if(type==='compare-difference'){
      const smaller=randomInt(20,60),difference=randomInt(5,30),larger=smaller+difference;
      setParts([larger]);total=larger;
      challenge=challengeObject(type,'The top bar represents '+larger+' and the lower bar represents '+smaller+'. What is the difference?',difference,{hiddenStatus:true,comparison:{larger,smaller,difference,topLabel:'A',bottomLabel:'B'}});
    }else if(type==='equal-groups-total'){
      const groups=randomInt(3,7),each=randomInt(3,12);
      total=groups*each;setParts(Array.from({length:groups},()=>each));
      challenge=challengeObject(type,'There are '+groups+' equal parts of '+each+'. What is the whole?',total,{hiddenTotal:true,hiddenStatus:true});
    }else if(type==='equal-groups-part'){
      const groups=randomInt(3,7),each=randomInt(3,12);
      total=groups*each;setParts(Array.from({length:groups},()=>null));
      challenge=challengeObject(type,'The whole is '+total+' and it is split into '+groups+' equal parts. What is one part worth?',each,{hiddenStatus:true});
    }else if(type==='build-model'){
      const a=randomInt(10,35),b=randomInt(8,25),c=randomInt(5,20),whole=a+b+c;
      total=whole;setParts([10,10,10]);
      challenge=challengeObject(type,'Build a bar model for '+a+' + ? + '+c+' = '+whole+'.',String(b),{freezeModel:false,targetParts:[{value:a,unknown:false},{value:10,unknown:true},{value:c,unknown:false}],targetTotal:whole});
    }else{
      const values=[randomInt(8,25),randomInt(8,25),randomInt(5,20)],sum=values.reduce((a,b)=>a+b,0),valid=Math.random()<.5,shown=valid?sum:sum+(Math.random()<.5?-1:1)*randomInt(3,12);
      total=shown;setParts(values);
      challenge=challengeObject(type,'A pupil says this part–whole model is correct. Are they right? Explain your answer.',valid?'Yes. The parts total '+sum+'.':'No. The parts total '+sum+', not '+shown+'.',{hiddenStatus:true});
    }
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();draw();
  }

  function segmentMarkup(part,index){
    const value=effectiveValue(part),pct=value/visualTotal()*100,selected=String(part.id)===String(selectedId),frozen=challengeFrozen();
    return '<button type="button" class="gd-bar-segment'+(part.unknown?' is-unknown':'')+(selected&&!frozen?' is-selected':'')+(index===parts.length-1?' is-last':'')+(frozen?' is-frozen':'')+'" data-bm-part="'+part.id+'" style="--bm-pct:'+pct+'%" aria-label="Part '+labelFor(index)+': '+(partText(part,index)==='?'?'unknown':partText(part,index))+(frozen?' fixed for this challenge':'')+'"'+(frozen?' disabled':'')+'>'+
      '<span class="gd-bar-segment__label">'+labelFor(index)+'</span><strong>'+partText(part,index)+'</strong>'+
    '</button>';
  }
  function handleMarkup(index,cumulative){
    const enabled=handleEnabled(index);
    return '<button type="button" class="gd-bar-boundary" data-bm-boundary="'+index+'" style="left:'+cumulative+'%" aria-label="Resize parts '+labelFor(index)+' and '+labelFor(index+1)+'"'+(enabled?' role="slider" aria-valuemin="1" aria-valuemax="99" aria-valuenow="'+Math.round(effectiveValue(parts[index])/Math.max(.01,effectiveValue(parts[index])+effectiveValue(parts[index+1]))*100)+'"':' disabled')+'><span></span></button>';
  }
  function selectedEditor(){
    if(challengeFrozen()||challenge?.comparison)return'';
    const part=selectedPart();if(!part)return'';
    const index=parts.indexOf(part),canDelete=parts.length>1;
    return '<div class="gd-bar-selected" data-bm-selected="'+part.id+'">'+
      '<div class="gd-bar-selected__head"><div><span>Selected part</span><strong>'+labelFor(index)+'</strong></div><div class="gd-row">'+
        '<button class="gd-btn" id="bm-duplicate" type="button"'+(parts.length>=8?' disabled':'')+'>Duplicate</button>'+
        '<button class="gd-btn gd-btn--danger" id="bm-delete" type="button"'+(canDelete?'':' disabled')+'>Delete</button>'+
      '</div></div>'+
      '<label class="gd-bar-unknown-toggle"><input type="checkbox" id="bm-unknown"'+(part.unknown?' checked':'')+'> <span>Unknown part (?)</span></label>'+
      '<div class="gd-bar-value-editor">'+
        '<button class="gd-btn" id="bm-minus" type="button" aria-label="Decrease selected part"'+(part.unknown?' disabled':'')+'>−</button>'+
        '<input class="gd-input" id="bm-value" type="number" min="0" step="1" value="'+(part.unknown?'':partText(part,index,true))+'"'+(part.unknown?' disabled placeholder="?"':'')+' aria-label="Selected part value">'+
        '<button class="gd-btn" id="bm-plus" type="button" aria-label="Increase selected part"'+(part.unknown?' disabled':'')+'>+</button>'+
      '</div>'+
      (part.unknown&&inferredUnknown()!=null&&(!challenge||challenge.revealed)?'<p class="gd-help">With one unknown and a fixed total, this part currently resolves to <strong>'+Math.round(inferredUnknown()*100)/100+'</strong>.</p>':'')+
    '</div>';
  }
  function comparisonMarkup(){
    const c=challenge?.comparison;if(!c)return'';
    const max=Math.max(c.larger,c.smaller,1),top=c.larger/max*100,bottom=c.smaller/max*100,diff=c.difference/max*100;
    return '<div class="gd-bar-comparison" data-bm-comparison>'+
      '<div class="gd-bar-compare-row"><span>'+c.topLabel+'</span><div class="gd-bar-compare-track"><strong style="width:'+top+'%">'+c.larger+'</strong></div></div>'+
      '<div class="gd-bar-compare-row"><span>'+c.bottomLabel+'</span><div class="gd-bar-compare-track"><strong style="width:'+bottom+'%">'+c.smaller+'</strong><em style="left:'+bottom+'%;width:'+diff+'%">?</em></div></div>'+
      '<div class="gd-bar-compare-note">Difference between the aligned bar ends</div>'+
    '</div>';
  }
  function bindChallengeStageActions(){
    const endChallenge=q('[data-challenge-action="end"]',q('#gd-stage'));if(endChallenge)endChallenge.onclick=e=>{e.stopPropagation();clearChallenge()};
    const stage=q('#gd-stage');if(!stage||!challenge)return;
    const reveal=q('[data-board-action="reveal"]',stage);
    if(reveal)reveal.onclick=e=>{e.stopPropagation();challenge.revealed=!challenge.revealed;renderControls();draw()};
    const another=q('[data-challenge-action="another"]',stage);
    if(another)another.onclick=e=>{e.stopPropagation();if(challenge?.mode==='standard')generateChallenge(challenge.type)};
  }
  function draw(){
    updateChallengeAnswer();
    let cumulative=0,handles='';
    parts.slice(0,-1).forEach((part,index)=>{cumulative+=effectiveValue(part)/visualTotal()*100;handles+=handleMarkup(index,cumulative)});
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Bar Model challenge',pupil:(challenge.type==='build-model'?CK.pupilSpec('model',{check:()=>parts.length===3&&total===challenge.targetTotal&&parts.every((p,i)=>p.unknown===challenge.targetParts[i].unknown&&(p.unknown||Number(p.value)===challenge.targetParts[i].value))}):challenge.type==='spot-error'?CK.pupilSpec('choice',{choices:['Yes','No'],expected:challenge.answer.startsWith('Yes')?'Yes':'No',explain:true}):CK.pupilSpec(challenge.type==='write-equation'?'addition-equation':'number')),actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'},{action:'end',label:'Back to setup'}]:[{action:'end',label:'End challenge'}]}):'';
    const model=challenge?.comparison?comparisonMarkup():
      '<div class="gd-bar-model">'+
        '<div class="gd-bar-total-bracket"><span></span><strong>Total '+totalText()+'</strong></div>'+
        '<div class="gd-bar-track" id="bm-track">'+parts.map(segmentMarkup).join('')+handles+'</div>'+
      '</div>';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-bar-workbench">'+
      '<div class="gd-bar-summary"><div><span>'+(challenge?.comparison?'Comparison model':'Part–whole model')+'</span><strong>'+(challenge?.comparison?'Compare the aligned bars':equationText())+'</strong></div><div class="gd-object-toolbar">'+(!challengeFrozen()&&!challenge?.comparison?'<button type="button" class="gd-btn" id="bm-add-stage"'+(parts.length>=8?' disabled':'')+'>+ Part</button>':'')+'<button type="button" class="gd-btn" id="bm-undo"'+(undoStack.length&&!challengeFrozen()?'':' disabled')+'>Undo</button><button type="button" class="gd-btn" id="bm-redo"'+(redoStack.length&&!challengeFrozen()?'':' disabled')+'>Redo</button></div></div>'+
      model+selectedEditor()+
      '<div class="gd-bar-readouts"><div class="gd-readout"><span>Equation</span><strong data-bm-equation>'+(challenge?.comparison?'—':equationText())+'</strong></div><div class="gd-readout"><span>Relationship</span><strong data-bm-status>'+statusText()+'</strong></div></div>'+
      ''+
    '</div>';
    bindStage();bindChallengeStageActions();
  }
  function boundaryDragMove(e){
    if(!drag||drag.pointerId!==e.pointerId)return;
    const dx=e.clientX-drag.startX,delta=Math.round(dx/drag.rectWidth*drag.visual),state=drag.before;
    parts=cloneParts(state.parts);nextId=state.nextId;total=state.total;selectedId=state.selectedId;
    if(adjustBoundary(drag.index,delta)){drag.changed=delta!==0;draw()}
  }
  function boundaryDragEnd(e){
    if(!drag||drag.pointerId!==e.pointerId)return;
    const before=drag.before,changed=drag.changed;drag=null;
    document.removeEventListener('pointermove',boundaryDragMove);
    document.removeEventListener('pointerup',boundaryDragEnd);
    document.removeEventListener('pointercancel',boundaryDragEnd);
    if(changed){undoStack.push(before);if(undoStack.length>50)undoStack.shift();redoStack.length=0}
    draw();renderControls();
  }
  function bindStage(){
    qa('[data-bm-part]',q('#gd-stage')).forEach(button=>{
      button.onclick=()=>{if(challengeFrozen())return;selectedId=Number(button.dataset.bmPart);draw()};
      button.onkeydown=e=>{
        if(challengeFrozen())return;
        const part=parts.find(p=>String(p.id)===button.dataset.bmPart);if(!part)return;
        if(e.key==='ArrowLeft'||e.key==='ArrowDown'){e.preventDefault();mutate(()=>changeValue(part,-1))}
        else if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();mutate(()=>changeValue(part,1))}
        else if((e.key==='Delete'||e.key==='Backspace')&&parts.length>1){e.preventDefault();mutate(()=>deletePart(part))}
      };
    });
    const addStage=q('#bm-add-stage');if(addStage)addStage.onclick=()=>{if(parts.length<8&&!challengeFrozen())mutate(addPart)};
    const undoBtn=q('#bm-undo');if(undoBtn)undoBtn.onclick=undo;
    const redoBtn=q('#bm-redo');if(redoBtn)redoBtn.onclick=redo;
    const duplicate=q('#bm-duplicate');if(duplicate)duplicate.onclick=()=>mutate(()=>duplicatePart(selectedPart()));
    const del=q('#bm-delete');if(del)del.onclick=()=>mutate(()=>deletePart(selectedPart()));
    const unknown=q('#bm-unknown');if(unknown)unknown.onchange=()=>mutate(()=>toggleUnknown(selectedPart(),unknown.checked));
    const value=q('#bm-value');if(value)value.onchange=()=>mutate(()=>setValue(selectedPart(),value.value));
    const minus=q('#bm-minus');if(minus)minus.onclick=()=>mutate(()=>changeValue(selectedPart(),-1));
    const plus=q('#bm-plus');if(plus)plus.onclick=()=>mutate(()=>changeValue(selectedPart(),1));
    qa('[data-bm-boundary]',q('#gd-stage')).forEach(handle=>{
      const index=Number(handle.dataset.bmBoundary);
      handle.onkeydown=e=>{
        if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
        e.preventDefault();mutate(()=>adjustBoundary(index,e.key==='ArrowLeft'?-1:1));
      };
      handle.onpointerdown=e=>{
        if((e.button!=null&&e.button!==0)||!handleEnabled(index))return;
        e.preventDefault();
        const track=q('#bm-track'),rect=track.getBoundingClientRect();
        drag={index,pointerId:e.pointerId,startX:e.clientX,rectWidth:Math.max(1,rect.width),visual:visualTotal(),before:snapshot(),changed:false};
        document.addEventListener('pointermove',boundaryDragMove);
        document.addEventListener('pointerup',boundaryDragEnd,{once:true});
        document.addEventListener('pointercancel',boundaryDragEnd,{once:true});
      };
    });
  }

  function workflowTabs(){
    return '<div class="gd-row gd-bm-workflow-tabs" role="tablist" aria-label="Bar Model workflow">'+
      '<button class="gd-btn'+(controlTab==='explore'?' gd-btn--primary':'')+'" type="button" data-bm-workflow="explore">Explore</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-bm-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+ 
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-bm-workflow="export">Export / reuse</button></div>';
  }
  function modelControlsHtml(){
    if(challenge?.comparison)return'<p class="gd-help">This comparison model is fixed for the current challenge.</p>';
    return field('Whole / total','<input class="gd-input" id="bm-total" type="number" min="0" step="1" value="'+(total==null?'':total)+'" placeholder="Auto">','Leave blank to let the known parts define the total.')+
      '<div class="gd-row"><button class="gd-btn gd-btn--primary" id="bm-add" type="button"'+(parts.length>=8?' disabled':'')+'>Add part</button>'+(!challenge?btn('Example problem','bm-example'):'')+'</div>';
  }
  function exploreControlsHtml(){
    return modelControlsHtml()+'<p class="gd-help">Work directly on the model: use + Part on the stage, then select a part to edit, duplicate, delete or mark it unknown. Drag dividers between two known parts to repartition their combined value while keeping that pair total unchanged.</p>';
  }
  function challengeControlsHtml(){
    if(!CK)return'<p class="gd-help">Challenge tools are unavailable.</p>';
    const tabs=CK.tabsHtml?CK.tabsHtml('bm',challengeTab):'';
    if(challengeTab==='custom'){
      const custom=challenge&&challenge.mode==='custom'?challenge:CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual'});
      return tabs+CK.editorHtml(custom,'bm',{answerSources:customAnswerSources(),generatedAnswerLabel:'Keep the generated answer'})+
        modelControlsHtml()+
        '<div class="gd-row">'+(challenge&&challenge.answer?'<button class="gd-btn" id="bm-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
        (challenge?'<button class="gd-btn" id="bm-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
        '<p class="gd-help">Custom challenges stay attached to the live model. Link the answer to a part, the whole, the solved equation or the number of parts.</p>';
    }
    const picker=CK.pickerHtml(CHALLENGE_TEMPLATES,CHALLENGE_CATEGORIES,challengeCategory,challengeType,'bm');
    const repeat=!!(challenge&&challenge.mode==='standard'&&challenge.type===challengeType);
    return tabs+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="bm-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
      (challenge&&challenge.mode!=='custom'?'<button class="gd-btn" id="bm-edit-challenge" type="button">Edit challenge</button>':'')+
      (challenge&&challenge.answer?'<button class="gd-btn" id="bm-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
      (challenge?'<button class="gd-btn" id="bm-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
      (challenge&&!challengeFrozen()&&!challenge.comparison?modelControlsHtml():'');
  }
  function bmSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function exportHidden(key,pupil=false){
    if(!challenge)return false;
    return pupil?!!challenge[key]:challengeHidden(key);
  }
  function exportHiddenPart(index,pupil=false){
    if(!challenge||!Array.isArray(challenge.hiddenPartIndexes))return false;
    return pupil?challenge.hiddenPartIndexes.includes(index):hiddenPart(index);
  }
  function exportState(pupil=false){
    if(pupil&&challenge?.mode==='standard'&&challenge.type==='build-model'&&Array.isArray(challenge.targetParts)){
      const targetParts=challenge.targetParts.map((part,index)=>({id:index+1,value:Number(part.value)||0,unknown:!!part.unknown}));
      return{parts:targetParts,total:Number(challenge.targetTotal),buildScaffold:true};
    }
    return{parts:cloneParts(),total,buildScaffold:false};
  }
  function exportSolvedValue(list,whole,index){
    const part=list[index];if(!part)return 0;
    if(!part.unknown)return Math.max(0,Number(part.value)||0);
    const unknowns=list.filter(p=>p.unknown);
    if(whole!=null&&unknowns.length===1){
      const known=list.filter(p=>!p.unknown).reduce((sum,p)=>sum+Math.max(0,Number(p.value)||0),0);
      return Math.max(0,Number(whole)-known);
    }
    const known=list.filter(p=>!p.unknown).map(p=>Math.max(0,Number(p.value)||0));
    return known.length?Math.max(1,known.reduce((a,b)=>a+b,0)/known.length):10;
  }
  function exportPartText(part,index,pupil=false){
    if(exportHiddenPart(index,pupil)||part.unknown)return'?';
    return String(Math.round((Number(part.value)||0)*100)/100);
  }
  function exportTotalText(state,pupil=false){
    if(exportHidden('hiddenTotal',pupil))return'?';
    if(state.total!=null)return String(Math.round(Number(state.total)*100)/100);
    if(state.parts.some(p=>p.unknown))return'?';
    return String(Math.round(state.parts.reduce((sum,p)=>sum+Number(p.value||0),0)*100)/100);
  }
  function exportEquationText(state,pupil=false){
    if(exportHidden('hiddenEquation',pupil))return'?';
    return state.parts.map((part,index)=>exportPartText(part,index,pupil)).join(' + ')+' = '+exportTotalText(state,pupil);
  }
  function exportStatusText(state,pupil=false){
    if(exportHidden('hiddenStatus',pupil))return'?';
    if(state.buildScaffold)return'Build the model';
    if(challenge?.comparison)return'Difference = '+(pupil?'?':Math.round(challenge.comparison.difference*100)/100);
    return pupil&&challenge?.mode==='standard'&&challenge.type==='build-model'?'Build the model':statusText();
  }
  function appendBarParts(svg,state,{x,y,width,height,pupil=false,prefix=''}={}){
    const solved=state.parts.map((_,index)=>exportSolvedValue(state.parts,state.total,index));
    const denominator=Math.max(1,solved.reduce((a,b)=>a+b,0));
    let cursor=x;
    state.parts.forEach((part,index)=>{
      const w=index===state.parts.length-1?(x+width-cursor):Math.max(28,width*(solved[index]/denominator));
      const last=index===state.parts.length-1;
      svg.appendChild(bmSvgEl('rect',{
        x:cursor,y,width:w,height,rx:last&&state.parts.length===1?11:0,
        fill:part.unknown||exportHiddenPart(index,pupil)?'#fff6df':'#edf7f5',
        stroke:'#698f8a','stroke-width':2,
        'data-bm-export-part':String(index),
        'data-bm-export-part-kind':part.unknown?'unknown':'known'
      }));
      svg.appendChild(bmSvgEl('text',{x:cursor+w/2,y:y+height*.32,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':13,'font-weight':850,fill:'#6c7f84'},labelFor(index)));
      svg.appendChild(bmSvgEl('text',{x:cursor+w/2,y:y+height*.64,'text-anchor':'middle','dominant-baseline':'middle','font-family':'Arial,sans-serif','font-size':21,'font-weight':900,fill:'#304b52','data-bm-export-part-value':String(index)},exportPartText(part,index,pupil)));
      cursor+=w;
    });
  }
  function appendTotalBracket(svg,text,{x,y,width}={}){
    svg.appendChild(bmSvgEl('path',{d:'M '+x+' '+(y+16)+' V '+y+' H '+(x+width)+' V '+(y+16),fill:'none',stroke:'#536c72','stroke-width':2}));
    svg.appendChild(bmSvgEl('rect',{x:x+width/2-62,y:y-14,width:124,height:28,rx:8,fill:'#fff'}));
    svg.appendChild(bmSvgEl('text',{x:x+width/2,y:y+5,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':13,'font-weight':850,fill:'#465e64','data-bm-export-total':'1'},'Total '+text));
  }
  function appendComparison(svg,pupil=false){
    const c=challenge?.comparison;if(!c)return;
    const x=110,width=780,rowH=78,max=Math.max(c.larger,c.smaller,1),topW=width*c.larger/max,bottomW=width*c.smaller/max,diffW=Math.max(28,width*c.difference/max);
    svg.appendChild(bmSvgEl('text',{x:74,y:190,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':16,'font-weight':900,fill:'#52666d'},c.topLabel||'A'));
    svg.appendChild(bmSvgEl('rect',{x,y:150,width:topW,height:rowH,rx:10,fill:'#edf7f5',stroke:'#698f8a','stroke-width':2}));
    svg.appendChild(bmSvgEl('text',{x:x+topW/2,y:190,'text-anchor':'middle','dominant-baseline':'middle','font-family':'Arial,sans-serif','font-size':22,'font-weight':900,fill:'#304b52'},String(c.larger)));
    svg.appendChild(bmSvgEl('text',{x:74,y:300,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':16,'font-weight':900,fill:'#52666d'},c.bottomLabel||'B'));
    svg.appendChild(bmSvgEl('rect',{x,y:260,width:bottomW,height:rowH,rx:10,fill:'#edf7f5',stroke:'#698f8a','stroke-width':2}));
    svg.appendChild(bmSvgEl('text',{x:x+bottomW/2,y:300,'text-anchor':'middle','dominant-baseline':'middle','font-family':'Arial,sans-serif','font-size':22,'font-weight':900,fill:'#304b52'},String(c.smaller)));
    svg.appendChild(bmSvgEl('rect',{x:x+bottomW,y:267,width:diffW,height:rowH-14,rx:9,fill:'#fff7df',stroke:'#d4a441','stroke-width':2,'stroke-dasharray':'6 5','data-bm-export-comparison':'difference'}));
    const diffText=pupil?'?':String(Math.round(c.difference*100)/100);
    svg.appendChild(bmSvgEl('text',{x:x+bottomW+diffW/2,y:300,'text-anchor':'middle','dominant-baseline':'middle','font-family':'Arial,sans-serif','font-size':21,'font-weight':900,fill:'#765817','data-bm-export-difference':'1'},diffText));
  }
  function barModelExportSvg({pupil=false}={}){
    const width=1000,height=610,state=exportState(pupil);
    const svg=bmSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Bar model','data-bm-export':'bar-model'});
    svg.appendChild(bmSvgEl('rect',{x:0,y:0,width,height,fill:'#fff'}));
    svg.appendChild(bmSvgEl('text',{x:64,y:48,'font-family':'Arial,sans-serif','font-size':27,'font-weight':900,fill:'#24343b'},challenge?.comparison?'Comparison bar model':'Bar model'));
    if(challenge?.comparison){
      appendComparison(svg,pupil);
    }else{
      const x=80,y=178,w=840,h=112;
      appendTotalBracket(svg,exportTotalText(state,pupil),{x,y:y-48,width:w});
      appendBarParts(svg,state,{x,y,width:w,height:h,pupil});
    }
    const equation=challenge?.comparison?'—':exportEquationText(state,pupil);
    const relation=exportStatusText(state,pupil);
    const cardY=390,cardW=402;
    svg.appendChild(bmSvgEl('rect',{x:80,y:cardY,width:cardW,height:92,rx:12,fill:'#f5f8f8',stroke:'#d4dfe1','stroke-width':1.5}));
    svg.appendChild(bmSvgEl('text',{x:96,y:cardY+28,'font-family':'Arial,sans-serif','font-size':11,'font-weight':850,fill:'#708287'},'EQUATION'));
    svg.appendChild(bmSvgEl('text',{x:96,y:cardY+62,'font-family':'Arial,sans-serif','font-size':18,'font-weight':900,fill:'#304b52','data-bm-export-equation':'1'},equation));
    svg.appendChild(bmSvgEl('rect',{x:518,y:cardY,width:cardW,height:92,rx:12,fill:'#f5f8f8',stroke:'#d4dfe1','stroke-width':1.5}));
    svg.appendChild(bmSvgEl('text',{x:534,y:cardY+28,'font-family':'Arial,sans-serif','font-size':11,'font-weight':850,fill:'#708287'},'RELATIONSHIP'));
    svg.appendChild(bmSvgEl('text',{x:534,y:cardY+62,'font-family':'Arial,sans-serif','font-size':17,'font-weight':900,fill:'#304b52','data-bm-export-status':'1'},relation));
    if(state.buildScaffold)svg.appendChild(bmSvgEl('g',{'data-bm-export-build-scaffold':'1','aria-hidden':'true'}));
    svg.appendChild(bmSvgEl('text',{x:936,y:590,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return barModelExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(barModelExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Bar Model challenge',
      prompt:challenge.type==='build-model'?prompt.replace(/^Build a bar model/,'Draw a bar model'):prompt,
      responseLabel:challenge.category==='reason'?'Explain your thinking':challenge.type==='build-model'?'Working / answer':'Answer',
      responseLines
    });
  }
  function exportFilename(){
    if(exportMode==='challenge'&&challenge)return'bar-model-'+(challenge.type||'challenge');
    return'bar-model';
  }
  function exportMessage(message){exportStatus=message;const el=q('#bm-export-status');if(el)el.textContent=message}
  async function runExport(kind){
    if(!X){exportMessage('Export tools are unavailable.');return}
    const targetSvg=exportTargetSvg(),name=exportFilename();
    try{
      if(kind==='copy'){await X.copyPng(targetSvg);exportMessage('Image copied.')}
      else if(kind==='png'){await X.downloadPng(targetSvg,name);exportMessage('PNG downloaded.')}
      else if(kind==='svg'){X.downloadSvg(targetSvg,name);exportMessage('SVG downloaded.')}
      else if(kind==='print'){X.printSvg(targetSvg,{title:'',landscape:exportMode!=='challenge'});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'Could not export this bar model.')}
  }
  function exportControlsHtml(){
    const canCard=!!challenge;
    if(!canCard&&exportMode==='challenge')exportMode='diagram';
    return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export a clean vector bar model or a pupil-ready challenge card.</span></div></div>'+
      (canCard?'<div class="nl-export-mode bm-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-bm-export-mode="challenge">Challenge card</button>'+
        '<button type="button" class="'+(exportMode==='diagram'?'is-active':'')+'" data-bm-export-mode="diagram">Bar model</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="bm-response-lines">'+[1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+'</select></label><p class="gd-help">Pupil challenge export re-hides answers even after Reveal. Build challenges export the target scaffold, not the teacher\'s trial solution.</p>'
        :'<p class="gd-help">Bar-model export contains the current vector model and visible mathematical readouts without editing controls.</p>')+
      '<div class="nl-export-grid bm-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="bm-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'challenge':'image')+'</button>'+
        '<button class="gd-btn" id="bm-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="bm-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="bm-print" type="button">Print / PDF</button>'+
      '</div><p class="gd-help" id="bm-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }

  function controlsHtml(){return workflowTabs()+(controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():exploreControlsHtml())}
  function renderControls(){q('#gd-controls').innerHTML=controlsHtml();bindControls()}
  function bindModelControls(){
    const totalInput=q('#bm-total');if(totalInput)totalInput.onchange=()=>{
      if(challengeFrozen())return;
      const raw=totalInput.value.trim(),before=snapshot();
      total=raw===''?null:Math.max(0,num(raw,0));
      undoStack.push(before);if(undoStack.length>50)undoStack.shift();redoStack.length=0;draw();renderControls();
    };
    const add=q('#bm-add');if(add)add.onclick=()=>mutate(addPart);
    const example=q('#bm-example');if(example)example.onclick=()=>{
      const examples=[
        {parts:[24,null,16],total:55},{parts:[35,35,null],total:100},{parts:[null,18],total:47},{parts:[12,12,12,null],total:60}
      ],ex=examples[Math.floor(Math.random()*examples.length)];
      mutate(()=>{setParts(ex.parts);total=ex.total});
    };
  }
  function bindControls(){
    qa('[data-bm-workflow]',q('#gd-controls')).forEach(button=>button.onclick=()=>{controlTab=button.dataset.bmWorkflow;renderControls()});
    bindModelControls();
    if(controlTab==='export'){
      qa('[data-bm-export-mode]',q('#gd-controls')).forEach(button=>button.onclick=()=>{exportMode=button.dataset.bmExportMode;exportStatus='';renderControls()});
      const lines=q('#bm-response-lines');if(lines)lines.onchange=()=>{responseLines=clamp(Math.round(num(lines.value,1)),1,4)};
      [['bm-copy-image','copy'],['bm-png','png'],['bm-svg-download','svg'],['bm-print','print']].forEach(([id,kind])=>{const button=q('#'+id);if(button)button.onclick=()=>runExport(kind)});
      return;
    }
    if(controlTab!=='challenge')return;
    qa('[data-bm-challenge-tab]',q('#gd-controls')).forEach(button=>button.onclick=()=>{
      if(button.dataset.bmChallengeTab==='custom')enterCustomChallenge();
      else{challengeTab='standard';renderControls()}
    });
    qa('[data-bm-challenge-cat]',q('#gd-controls')).forEach(button=>button.onclick=()=>{
      challengeCategory=button.dataset.bmChallengeCat;
      const first=CHALLENGE_TEMPLATES.find(t=>t.category===challengeCategory);if(first)challengeType=first.id;
      renderControls();
    });
    qa('[data-bm-challenge-type]',q('#gd-controls')).forEach(button=>button.onclick=()=>{challengeType=button.dataset.bmChallengeType;renderControls()});
    const generate=q('#bm-generate');if(generate)generate.onclick=()=>generateChallenge(challengeType);
    const edit=q('#bm-edit-challenge');if(edit)edit.onclick=enterCustomChallenge;
    const reveal=q('#bm-reveal');if(reveal)reveal.onclick=()=>{if(challenge){challenge.revealed=!challenge.revealed;renderControls();draw()}};
    const clear=q('#bm-clear-challenge');if(clear)clear.onclick=clearChallenge;
    if(challengeTab==='custom'&&challenge){
      const title=q('#bm-custom-title');if(title)title.oninput=()=>{challenge.title=title.value.slice(0,100);draw()};
      const prompt=q('#bm-custom-prompt');if(prompt)prompt.oninput=()=>{challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);draw()};
      const source=q('#bm-custom-answer-source');if(source)source.onchange=()=>setCustomAnswerSource(source.value);
      const answer=q('#bm-custom-answer');if(answer)answer.oninput=()=>{challenge.answer=answer.value.slice(0,400);challenge.answerMode='manual';challenge.answerSource='';draw()};
      qa('[data-gd-rich-action]',q('#gd-controls')).forEach(button=>button.onclick=()=>{CK.applyFormat(prompt,button.dataset.gdRichAction);challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);draw()});
    }
  }

  setPanels(controlsHtml(),'');
  bindControls();
  draw();
  G.lessonState?.register('bar-model',()=>({diagram:snapshot(),challenge,beforeChallenge,pupil:CK?.capturePupil?.(challenge),controlTab,challengeTab,challengeCategory,challengeType,exportMode,responseLines}),saved=>{
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

function hundredSquare(){
  const CK=G.challengeKit,X=G.exportTools;
  let startValue=1,selectedIndex=0,interactionMode='select',ruleMode='multiples',ruleNumber=5,paint=null,rulePanelOpen=false;
  let marked=new Set(),hidden=new Set();
  const undoStack=[],redoStack=[];
  const CHALLENGE_CATEGORIES=[
    {id:'read',label:'Read & locate'},
    {id:'patterns',label:'Patterns'},
    {id:'reason',label:'Reasoning'}
  ];
  const CHALLENGE_TEMPLATES=[
    {id:'missing-number',category:'read',title:'Find the hidden number',desc:'Use the surrounding hundred-square pattern to identify a hidden cell.'},
    {id:'one-more',category:'read',title:'One more',desc:'Find the number that is one more than the selected number.'},
    {id:'one-less',category:'read',title:'One less',desc:'Find the number that is one less than the selected number.'},
    {id:'ten-more',category:'read',title:'Ten more',desc:'Find the number that is ten more than the selected number.'},
    {id:'ten-less',category:'read',title:'Ten less',desc:'Find the number that is ten less than the selected number.'},
    {id:'continue-pattern',category:'patterns',title:'Continue the pattern',desc:'Use marked numbers to continue a step pattern.'},
    {id:'mark-rule',category:'patterns',title:'Mark every match',desc:'Mark every number that matches a given rule.'},
    {id:'spot-wrong-mark',category:'reason',title:'Spot the wrong mark',desc:'Find the one marked number that does not fit the rule.'}
  ];
  let controlTab='explore',challengeTab='standard',challengeCategory='read',challengeType='missing-number',challenge=null,beforeChallenge=null;
  let exportMode='grid',responseLines=1,exportStatus='';

  function snapshot(){
    return{startValue,selectedIndex,interactionMode,ruleMode,ruleNumber,marked:[...marked],hidden:[...hidden]};
  }
  function restore(state){
    startValue=Math.round(Number(state?.startValue)||0);
    selectedIndex=clamp(Math.round(Number(state?.selectedIndex)||0),0,99);rulePanelOpen=false;
    interactionMode=state?.interactionMode||'select';
    ruleMode=state?.ruleMode||'none';
    ruleNumber=Math.max(1,Math.round(Number(state?.ruleNumber)||1));
    marked=new Set(Array.isArray(state?.marked)?state.marked:[]);
    hidden=new Set(Array.isArray(state?.hidden)?state.hidden:[]);
  }
  function remember(){
    undoStack.push(snapshot());
    if(undoStack.length>60)undoStack.shift();
    redoStack.length=0;
  }
  function challengeFrozen(){return !!(challenge&&challenge.mode==='standard'&&(challenge.freezeGrid||challenge.revealed))}
  function challengeMarkOnly(){return !!(challenge&&challenge.mode==='standard'&&challenge.markOnly)}
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
  function valueAt(index){return startValue+index}
  function currentValue(){return valueAt(selectedIndex)}
  function inGrid(value){return value>=startValue&&value<=startValue+99}
  function isPrime(n){
    if(n<2||!Number.isInteger(n))return false;
    for(let i=2;i*i<=n;i++)if(n%i===0)return false;
    return true;
  }
  function matchesRule(n,mode=ruleMode,k=ruleNumber){
    if(mode==='multiples')return k!==0&&n%k===0;
    if(mode==='factors')return n!==0&&k%n===0;
    if(mode==='prime')return isPrime(n);
    if(mode==='odd')return Math.abs(n%2)===1;
    if(mode==='even')return n%2===0;
    return false;
  }
  function ruleMatches(n){return matchesRule(n)}
  function valuesForRule(mode,k){
    return Array.from({length:100},(_,i)=>valueAt(i)).filter(n=>matchesRule(n,mode,k));
  }
  function relatedValues(){
    const n=currentValue(),vals=[n-1,n+1,n-10,n+10];
    return new Set(vals.filter(inGrid));
  }
  function setStart(value){
    startValue=clamp(Math.round(Number(value)||0),-9999,999999);
    marked.clear();hidden.clear();selectedIndex=0;
  }
  function toggleMark(value,on=null){
    const next=on==null?!marked.has(value):!!on;
    if(next)marked.add(value);else marked.delete(value);
  }
  function toggleHidden(value,on=null){
    if(challengeMarkOnly())return;
    const next=on==null?!hidden.has(value):!!on;
    if(next)hidden.add(value);else hidden.delete(value);
  }
  function boundHiddenValue(){
    if(!challenge||challenge.mode!=='custom'||challenge.revealed||challenge.answerMode!=='bound')return null;
    const n=currentValue();
    if(challenge.answerSource==='selected-value')return n;
    if(challenge.answerSource==='one-less')return n-1;
    if(challenge.answerSource==='one-more')return n+1;
    if(challenge.answerSource==='ten-less')return n-10;
    if(challenge.answerSource==='ten-more')return n+10;
    return null;
  }
  function valueHidden(value){
    const teacherHidden=hidden.has(value)&&!(challenge?.mode==='standard'&&challenge.revealed);
    return teacherHidden||boundHiddenValue()===value;
  }
  function moveSelection(delta){
    if(challengeFrozen())return;
    selectedIndex=clamp(selectedIndex+delta,0,99);draw();renderControls();
    setTimeout(()=>q('[data-hs-index="'+selectedIndex+'"]')?.focus(),0);
  }
  function relationItem(label,value){
    const present=inGrid(value);
    return '<div class="gd-hs-relation-item'+(present?'':' is-outside')+'"><span>'+label+'</span><strong>'+value+'</strong><small>'+(present?'on grid':'outside grid')+'</small></div>';
  }
  function selectedPanel(){
    if(challenge&&!challenge.revealed&&challenge.hideSelectedPanel)return'';
    const n=currentValue(),isMarked=marked.has(n),isHidden=valueHidden(n),markOnly=challengeMarkOnly();
    return '<div class="gd-hs-selected" data-hs-selected="'+n+'">'+
      '<div class="gd-hs-selected__head"><div><span>Selected number</span><strong>'+(isHidden?'?':n)+'</strong></div><div class="gd-row">'+
        '<button class="gd-btn'+(isMarked?' gd-btn--primary':'')+'" id="hs-mark-selected" type="button">'+(isMarked?'Unmark':'Mark')+'</button>'+
        (markOnly?'':'<button class="gd-btn" id="hs-hide-selected" type="button">'+(isHidden?'Reveal':'Hide number')+'</button>')+
      '</div></div>'+
      (isHidden?'<p class="gd-help gd-hs-hidden-note">This number is hidden. Reveal it to inspect its ±1 and ±10 relationships.</p>':
      '<div class="gd-hs-relations">'+
        relationItem('one less',n-1)+relationItem('one more',n+1)+relationItem('ten less',n-10)+relationItem('ten more',n+10)+
      '</div>')+
    '</div>';
  }
  function challengeProgress(){
    if(!challenge||challenge.type!=='mark-rule'||!Array.isArray(challenge.targetValues))return'';
    return 'Mark the numbers that match the rule, then press Check.';
  }
  function cellHtml(index,related){
    const n=valueAt(index),isHidden=valueHidden(n),frozen=challengeFrozen(),classes=[
      'gd-square-cell','gd-hs-cell',
      ruleMatches(n)?'is-rule':'',
      marked.has(n)?'is-marked':'',
      index===selectedIndex?'is-current':'',
      related.has(n)&&index!==selectedIndex&&!challenge?'is-related':'',
      isHidden?'is-hidden-number':'',
      !frozen&&interactionMode!=='select'?'is-paintable':'',
      frozen?'is-frozen':''
    ].filter(Boolean).join(' ');
    return '<button type="button" class="'+classes+'" data-hs-index="'+index+'" data-hs-value="'+n+'" aria-label="'+(isHidden?'Hidden number':'Number '+n)+'" aria-pressed="'+(marked.has(n)?'true':'false')+'"'+(frozen?' disabled':'')+'><span>'+(isHidden?'?':n)+'</span></button>';
  }
  function toggleMarkingReveal(){
    if(!challenge)return;
    challenge.revealed=!challenge.revealed;
    if(challengeMarkOnly()){if(challenge.revealed){challenge.marksBeforeReveal=[...marked];marked=new Set(challenge.targetValues)}else{marked=new Set(challenge.marksBeforeReveal||[]);delete challenge.marksBeforeReveal}}
    renderControls();draw();
  }
  function bindChallengeStageActions(){
    const endChallenge=q('[data-challenge-action="end"]',q('#gd-stage'));if(endChallenge)endChallenge.onclick=e=>{e.stopPropagation();clearChallenge()};
    const stage=q('#gd-stage');if(!stage||!challenge)return;
    const reveal=q('[data-board-action="reveal"]',stage);
    if(reveal)reveal.onclick=e=>{e.stopPropagation();toggleMarkingReveal()};
    const another=q('[data-challenge-action="another"]',stage);
    if(another)another.onclick=e=>{e.stopPropagation();if(challenge?.mode==='standard')generateChallenge(challenge.type)};
  }
  function rangeSummary(){
    return challenge&&!challenge.revealed&&challenge.hiddenRangeSummary?'?':startValue+'–'+(startValue+99);
  }
  function ruleShortLabel(){
    if(ruleMode==='multiples')return'×'+ruleNumber;
    if(ruleMode==='factors')return'Factors of '+ruleNumber;
    if(ruleMode==='prime')return'Prime';
    if(ruleMode==='odd')return'Odd';
    if(ruleMode==='even')return'Even';
    return'No rule';
  }
  function rulePopoverHtml(){
    if(challenge||!rulePanelOpen)return'';
    const mode=(id,label)=>'<button type="button" data-hs-rule-mode="'+id+'"'+(ruleMode===id?' class="is-active"':'')+'>'+label+'</button>';
    return '<div class="gd-hs-rule-popover" role="group" aria-label="Hundred square rule">'+
      '<div class="gd-hs-rule-modes">'+mode('multiples','Multiples')+mode('factors','Factors')+mode('prime','Prime')+mode('odd','Odd')+mode('even','Even')+mode('none','None')+'</div>'+
      ((ruleMode==='multiples'||ruleMode==='factors')?'<div class="gd-hs-rule-number"><button type="button" data-hs-rule-step="-1" aria-label="Decrease rule number">−</button><strong>'+ruleNumber+'</strong><button type="button" data-hs-rule-step="1" aria-label="Increase rule number">+</button></div>':'')+
    '</div>';
  }
  function draw(){
    updateChallengeAnswer();
    const related=relatedValues(),banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Hundred Square challenge',pupil:(challenge.type==='mark-rule'?CK.pupilSpec('model',{check:()=>marked.size===challenge.targetValues.length&&challenge.targetValues.every(v=>marked.has(v))}):CK.pupilSpec('number')),actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'},{action:'end',label:'Back to setup'}]:[{action:'end',label:'End challenge'}]}):'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-hs-workbench">'+
      '<div class="gd-hs-summary"><div><span>Hundred square</span><strong>'+rangeSummary()+'</strong></div>'+
        '<div class="gd-hs-summary-actions">'+(!challenge?'<button class="gd-hs-rule-chip'+(rulePanelOpen?' is-active':'')+'" type="button" data-hs-rule-toggle aria-expanded="'+(rulePanelOpen?'true':'false')+'">Rule: '+ruleShortLabel()+'</button>':'')+
        '<div class="gd-object-toolbar"><button class="gd-btn" id="hs-undo" type="button"'+(undoStack.length&&!challengeFrozen()?'':' disabled')+'>Undo</button><button class="gd-btn" id="hs-redo" type="button"'+(redoStack.length&&!challengeFrozen()?'':' disabled')+'>Redo</button></div></div></div>'+
      rulePopoverHtml()+
      '<div class="gd-square-grid gd-hs-grid" data-hs-grid-start="'+startValue+'">'+Array.from({length:100},(_,i)=>cellHtml(i,related)).join('')+'</div>'+
      selectedPanel()+
      (challenge?.type==='mark-rule'?'<div class="gd-answer-live" data-hs-target-status>'+challengeProgress()+'</div>':'')+
      '<div class="gd-hs-key"><span><i class="is-rule"></i> rule</span><span><i class="is-marked"></i> your mark</span><span><i class="is-related"></i> ±1 / ±10 relation</span><span><i class="is-hidden-number">?</i> hidden</span></div>'+
    '</div>';
    bindStage();bindChallengeStageActions();
  }
  function paintAtPoint(x,y){
    if(!paint||challengeFrozen())return;
    const el=document.elementFromPoint(x,y)?.closest?.('[data-hs-index]');
    if(!el)return;
    const value=Number(el.dataset.hsValue),index=Number(el.dataset.hsIndex);
    if(!Number.isFinite(value)||paint.visited.has(value))return;
    paint.visited.add(value);selectedIndex=index;
    if(interactionMode==='mark'||challengeMarkOnly())toggleMark(value,paint.on);
    else if(interactionMode==='hide')toggleHidden(value,paint.on);
    draw();
  }
  function paintMove(e){
    if(!paint||paint.pointerId!==e.pointerId)return;
    e.preventDefault();paintAtPoint(e.clientX,e.clientY);
  }
  function paintEnd(e){
    if(!paint||paint.pointerId!==e.pointerId)return;
    paint=null;
    document.removeEventListener('pointermove',paintMove);
    document.removeEventListener('pointerup',paintEnd);
    document.removeEventListener('pointercancel',paintEnd);
    renderControls();
  }
  function bindStage(){
    const ruleToggle=q('[data-hs-rule-toggle]',q('#gd-stage'));if(ruleToggle)ruleToggle.onclick=e=>{e.stopPropagation();rulePanelOpen=!rulePanelOpen;draw()};
    qa('[data-hs-rule-mode]',q('#gd-stage')).forEach(button=>button.onclick=e=>{e.stopPropagation();ruleMode=button.dataset.hsRuleMode||'none';rulePanelOpen=true;draw();renderControls()});
    qa('[data-hs-rule-step]',q('#gd-stage')).forEach(button=>button.onclick=e=>{e.stopPropagation();ruleNumber=Math.max(1,ruleNumber+Number(button.dataset.hsRuleStep||0));rulePanelOpen=true;draw();renderControls()});
    qa('[data-hs-index]',q('#gd-stage')).forEach(cell=>{
      cell.onclick=()=>{
        if(challengeFrozen()||interactionMode!=='select')return;
        selectedIndex=Number(cell.dataset.hsIndex);draw();renderControls();
      };
      cell.onkeydown=e=>{
        if(challengeFrozen())return;
        if(e.key==='ArrowLeft'){e.preventDefault();moveSelection(-1)}
        else if(e.key==='ArrowRight'){e.preventDefault();moveSelection(1)}
        else if(e.key==='ArrowUp'){e.preventDefault();moveSelection(-10)}
        else if(e.key==='ArrowDown'){e.preventDefault();moveSelection(10)}
        else if(e.key===' '||e.key==='Enter'){e.preventDefault();mutate(()=>toggleMark(currentValue()))}
        else if(e.key.toLowerCase()==='h'&&!challengeMarkOnly()){e.preventDefault();mutate(()=>toggleHidden(currentValue()))}
      };
      cell.onpointerdown=e=>{
        if(challengeFrozen()||interactionMode==='select'||(e.button!=null&&e.button!==0))return;
        e.preventDefault();
        const value=Number(cell.dataset.hsValue);
        remember();
        paint={pointerId:e.pointerId,on:(interactionMode==='mark'||challengeMarkOnly())?!marked.has(value):!hidden.has(value),visited:new Set()};
        document.addEventListener('pointermove',paintMove);
        document.addEventListener('pointerup',paintEnd,{once:true});
        document.addEventListener('pointercancel',paintEnd,{once:true});
        paintAtPoint(e.clientX,e.clientY);
      };
    });
    const undoBtn=q('#hs-undo');if(undoBtn)undoBtn.onclick=undo;
    const redoBtn=q('#hs-redo');if(redoBtn)redoBtn.onclick=redo;
    const markBtn=q('#hs-mark-selected');if(markBtn)markBtn.onclick=()=>mutate(()=>toggleMark(currentValue()));
    const hideBtn=q('#hs-hide-selected');if(hideBtn)hideBtn.onclick=()=>mutate(()=>toggleHidden(currentValue()));
  }

  function workflowTabs(){
    return '<div class="gd-row gd-hs-workflow-tabs" role="tablist" aria-label="Hundred Square workflow">'+
      '<button class="gd-btn'+(controlTab==='explore'?' gd-btn--primary':'')+'" type="button" data-hs-workflow="explore">Explore</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-hs-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+ 
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-hs-workflow="export">Export / reuse</button></div>';
  }
  function rangePatternControlsHtml(){
    return '<div class="gd-field"><span>Grid range</span><div class="gd-row"><button class="gd-btn'+(startValue===1?' gd-btn--primary':'')+'" type="button" data-hs-preset="1">1–100</button><button class="gd-btn'+(startValue===0?' gd-btn--primary':'')+'" type="button" data-hs-preset="0">0–99</button></div></div>'+
      field('Custom start','<div class="gd-row"><input class="gd-input gd-small" id="hs-start" type="number" step="1" value="'+startValue+'"><button class="gd-btn" id="hs-apply-start" type="button">Apply</button></div>','Build any consecutive 10 × 10 number grid, for example 101–200.')+
      field('Pattern highlight','<select class="gd-select" id="hs-mode"><option value="multiples"'+(ruleMode==='multiples'?' selected':'')+'>Multiples of…</option><option value="factors"'+(ruleMode==='factors'?' selected':'')+'>Factors of…</option><option value="prime"'+(ruleMode==='prime'?' selected':'')+'>Prime numbers</option><option value="odd"'+(ruleMode==='odd'?' selected':'')+'>Odd numbers</option><option value="even"'+(ruleMode==='even'?' selected':'')+'>Even numbers</option><option value="none"'+(ruleMode==='none'?' selected':'')+'>Nothing</option></select>')+
      field('Pattern number','<input class="gd-input" id="hs-k" type="number" min="1" step="1" value="'+ruleNumber+'">','Used for multiples and factors.');
  }
  function interactionControlsHtml({markOnly=false}={}){
    if(markOnly){
      return '<div class="gd-field"><span>Mark answers</span><div class="gd-row">'+
        '<button class="gd-btn'+(interactionMode==='select'?' gd-btn--primary':'')+'" type="button" data-hs-interaction="select">Select</button>'+
        '<button class="gd-btn'+(interactionMode==='mark'?' gd-btn--primary':'')+'" type="button" data-hs-interaction="mark">Paint marks</button>'+
      '</div></div><div class="gd-row"><button class="gd-btn" id="hs-clear-marks" type="button">Clear marks</button></div>';
    }
    return '<div class="gd-field"><span>Touch / mouse action</span><div class="gd-row">'+
      '<button class="gd-btn'+(interactionMode==='select'?' gd-btn--primary':'')+'" type="button" data-hs-interaction="select">Select</button>'+
      '<button class="gd-btn'+(interactionMode==='mark'?' gd-btn--primary':'')+'" type="button" data-hs-interaction="mark">Paint marks</button>'+
      '<button class="gd-btn'+(interactionMode==='hide'?' gd-btn--primary':'')+'" type="button" data-hs-interaction="hide">Hide / reveal</button>'+
    '</div></div>'+
    '<div class="gd-row"><button class="gd-btn" id="hs-clear-marks" type="button">Clear marks</button><button class="gd-btn" id="hs-reveal-all" type="button">Reveal all</button></div>';
  }
  function exploreControlsHtml(){
    return rangePatternControlsHtml()+interactionControlsHtml()+
      '<p class="gd-help">Select a number to see ±1 and ±10 relationships. In paint modes, drag across cells to mark or hide several numbers quickly. Arrow keys move the selection; Space marks it; H hides/reveals it.</p>';
  }
  function challengeControlsHtml(){
    if(!CK)return'<p class="gd-help">Challenge tools are unavailable.</p>';
    const tabs=CK.tabsHtml?CK.tabsHtml('hs',challengeTab):'';
    if(challengeTab==='custom'){
      const custom=challenge&&challenge.mode==='custom'?challenge:CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual'});
      return tabs+CK.editorHtml(custom,'hs',{answerSources:customAnswerSources(),generatedAnswerLabel:'Keep the generated answer'})+
        rangePatternControlsHtml()+interactionControlsHtml()+
        '<div class="gd-row">'+(challenge&&challenge.answer?'<button class="gd-btn" id="hs-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
        (challenge?'<button class="gd-btn" id="hs-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
        '<p class="gd-help">Custom answers can follow the selected number, ±1/±10 relationships, or the number of marked/hidden cells.</p>';
    }
    const picker=CK.pickerHtml(CHALLENGE_TEMPLATES,CHALLENGE_CATEGORIES,challengeCategory,challengeType,'hs');
    const repeat=!!(challenge&&challenge.mode==='standard'&&challenge.type===challengeType);
    return tabs+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="hs-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
      (challenge&&challenge.mode!=='custom'?'<button class="gd-btn" id="hs-edit-challenge" type="button">Edit challenge</button>':'')+
      (challenge&&challenge.answer?'<button class="gd-btn" id="hs-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
      (challenge?'<button class="gd-btn" id="hs-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
      (challengeMarkOnly()?interactionControlsHtml({markOnly:true}):'');
  }
  function hsSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function exportState(pupil=false){
    const fromInitial=!!(pupil&&challenge?.mode==='standard'&&challenge.initialState);
    const raw=fromInitial?challenge.initialState:snapshot();
    return{
      startValue:Math.round(Number(raw?.startValue)||0),
      selectedIndex:clamp(Math.round(Number(raw?.selectedIndex)||0),0,99),
      ruleMode:raw?.ruleMode||'none',
      ruleNumber:Math.max(1,Math.round(Number(raw?.ruleNumber)||1)),
      marked:new Set(Array.isArray(raw?.marked)?raw.marked:[]),
      hidden:new Set(Array.isArray(raw?.hidden)?raw.hidden:[]),
      fromInitial
    };
  }
  function exportBoundHiddenValue(state,pupil=false){
    if(!challenge||challenge.mode!=='custom'||challenge.answerMode!=='bound'||(!pupil&&challenge.revealed))return null;
    const n=state.startValue+state.selectedIndex;
    if(challenge.answerSource==='selected-value')return n;
    if(challenge.answerSource==='one-less')return n-1;
    if(challenge.answerSource==='one-more')return n+1;
    if(challenge.answerSource==='ten-less')return n-10;
    if(challenge.answerSource==='ten-more')return n+10;
    return null;
  }
  function exportValueHidden(state,value,pupil=false){
    let teacherHidden=state.hidden.has(value);
    if(!pupil&&challenge?.mode==='standard'&&challenge.revealed)teacherHidden=false;
    return teacherHidden||exportBoundHiddenValue(state,pupil)===value;
  }
  function exportRelatedValues(state){
    if(challenge?.hideSelectedPanel)return new Set();
    const n=state.startValue+state.selectedIndex;
    return new Set([n-1,n+1,n-10,n+10].filter(v=>v>=state.startValue&&v<=state.startValue+99));
  }
  function hundredSquareExportSvg({pupil=false}={}){
    const state=exportState(pupil),width=900,height=880,cell=64,gridX=130,gridY=100,related=exportRelatedValues(state);
    const svg=hsSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Hundred square','data-hs-export':'hundred-square'});
    svg.appendChild(hsSvgEl('rect',{x:0,y:0,width,height,fill:'#fff'}));
    svg.appendChild(hsSvgEl('text',{x:70,y:52,'font-family':'Arial,sans-serif','font-size':28,'font-weight':900,fill:'#24343b'},'Hundred square'));
    svg.appendChild(hsSvgEl('text',{x:830,y:52,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':17,'font-weight':850,fill:'#52666d','data-hs-export-range':'1'},state.startValue+'–'+(state.startValue+99)));
    for(let index=0;index<100;index++){
      const row=Math.floor(index/10),col=index%10,value=state.startValue+index,x=gridX+col*cell,y=gridY+row*cell;
      const hiddenValue=exportValueHidden(state,value,pupil),rule=matchesRule(value,state.ruleMode,state.ruleNumber),isMarked=state.marked.has(value),selected=index===state.selectedIndex,isRelated=related.has(value)&&!selected;
      const fill=hiddenValue?'#f4f6f7':rule?'#fff2c8':isRelated?'#edf5f8':'#fff';
      const stroke=selected?'#137d75':rule?'#d6b257':'#c9d4d7',strokeWidth=selected?4:1.4;
      const group=hsSvgEl('g',{'data-hs-export-cell':String(index)});
      if(hiddenValue)group.setAttribute('data-hs-export-hidden','1');
      if(rule)group.setAttribute('data-hs-export-rule','1');
      if(isMarked)group.setAttribute('data-hs-export-marked','1');
      if(selected)group.setAttribute('data-hs-export-selected','1');
      group.appendChild(hsSvgEl('rect',{x,y,width:cell-3,height:cell-3,rx:7,fill,stroke,'stroke-width':strokeWidth}));
      if(isMarked)group.appendChild(hsSvgEl('circle',{cx:x+(cell-3)/2,cy:y+(cell-3)/2,r:20,fill:'none',stroke:'#137d75','stroke-width':3}));
      group.appendChild(hsSvgEl('text',{x:x+(cell-3)/2,y:y+(cell-3)/2+1,'text-anchor':'middle','dominant-baseline':'middle','font-family':'Arial,sans-serif','font-size':16,'font-weight':850,fill:hiddenValue?'#6c7d82':'#304b52','data-hs-export-cell-text':String(index)},hiddenValue?'?':value));
      svg.appendChild(group);
    }
    svg.appendChild(hsSvgEl('text',{x:450,y:775,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':12,fill:'#6e8085'},'Yellow = rule highlight   ·   Teal ring = manual mark   ·   ? = hidden number'));
    if(state.fromInitial)svg.appendChild(hsSvgEl('g',{'data-hs-export-initial-state':'1','aria-hidden':'true'}));
    svg.appendChild(hsSvgEl('text',{x:830,y:846,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return hundredSquareExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(hundredSquareExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Hundred Square challenge',
      prompt,
      responseLabel:challenge.category==='reason'?'Explain your thinking':challenge.type==='mark-rule'?'Check / notes':'Answer',
      responseLines
    });
  }
  function exportFilename(){
    if(exportMode==='challenge'&&challenge)return'hundred-square-'+(challenge.type||'challenge');
    return'hundred-square-'+startValue+'-'+(startValue+99);
  }
  function exportMessage(message){exportStatus=message;const el=q('#hs-export-status');if(el)el.textContent=message}
  async function runExport(kind){
    if(!X){exportMessage('Export tools are unavailable.');return}
    const targetSvg=exportTargetSvg(),name=exportFilename();
    try{
      if(kind==='copy'){await X.copyPng(targetSvg);exportMessage('Image copied.')}
      else if(kind==='png'){await X.downloadPng(targetSvg,name);exportMessage('PNG downloaded.')}
      else if(kind==='svg'){X.downloadSvg(targetSvg,name);exportMessage('SVG downloaded.')}
      else if(kind==='print'){X.printSvg(targetSvg,{title:'',landscape:exportMode!=='challenge'});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'Could not export this hundred square.')}
  }
  function exportControlsHtml(){
    const canCard=!!challenge;
    if(!canCard&&exportMode==='challenge')exportMode='grid';
    return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export a clean vector grid or a pupil-ready challenge card.</span></div></div>'+
      (canCard?'<div class="nl-export-mode hs-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-hs-export-mode="challenge">Challenge card</button>'+
        '<button type="button" class="'+(exportMode==='grid'?'is-active':'')+'" data-hs-export-mode="grid">Grid only</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="hs-response-lines">'+[1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+'</select></label><p class="gd-help">Pupil export re-hides hidden or bound answers. Interactive Standard challenges export the original starting grid, not the teacher\'s completed marks.</p>'
        :'<p class="gd-help">Grid-only export preserves the current range, highlights, marks, hidden numbers and selected cell without editing controls.</p>')+
      '<div class="nl-export-grid hs-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="hs-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'challenge':'image')+'</button>'+
        '<button class="gd-btn" id="hs-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="hs-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="hs-print" type="button">Print / PDF</button>'+
      '</div><p class="gd-help" id="hs-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }

  function controlsHtml(){return workflowTabs()+(controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():exploreControlsHtml())}
  function renderControls(){q('#gd-controls').innerHTML=controlsHtml();bindControls()}

  function challengeObject(type,prompt,answer,extra={}){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);
    const raw={mode:'standard',type,category:meta?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),answerMode:'manual',answerSource:'',revealed:false,freezeGrid:true,markOnly:false,hideSelectedPanel:false,hiddenRangeSummary:false,targetValues:null,...extra};
    return CK?CK.normalise(raw):raw;
  }
  function randomInt(min,max){return min+Math.floor(Math.random()*(max-min+1))}
  function resetChallengeGrid(){
    startValue=1;selectedIndex=0;interactionMode='select';ruleMode='none';ruleNumber=5;marked.clear();hidden.clear();
  }
  function relationshipChallenge(type,delta,label){
    const min=delta<0?1-delta:1,max=delta>0?100-delta:100,anchor=randomInt(Math.max(11,min),Math.min(89,max)),target=anchor+delta;
    selectedIndex=anchor-startValue;
    return challengeObject(type,'What is '+label+' than '+anchor+'?',target,{hideSelectedPanel:true});
  }
  function generateChallenge(type){
    const template=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!template)return;
    if(!beforeChallenge)beforeChallenge=snapshot();else restore(beforeChallenge);
    undoStack.length=0;redoStack.length=0;resetChallengeGrid();
    if(type==='missing-number'){
      const target=randomInt(12,89);hidden.add(target);selectedIndex=target-1;
      challenge=challengeObject(type,'What number is hidden on the hundred square?',target,{hideSelectedPanel:true});
    }else if(type==='one-more')challenge=relationshipChallenge(type,1,'one more');
    else if(type==='one-less')challenge=relationshipChallenge(type,-1,'one less');
    else if(type==='ten-more')challenge=relationshipChallenge(type,10,'ten more');
    else if(type==='ten-less')challenge=relationshipChallenge(type,-10,'ten less');
    else if(type==='continue-pattern'){
      const steps=[2,5,10],step=steps[Math.floor(Math.random()*steps.length)],first=randomInt(5,20),seq=[first,first+step,first+2*step],answer=first+3*step;
      marked=new Set(seq);selectedIndex=first-1;
      challenge=challengeObject(type,'The marked numbers follow a +'+step+' pattern. What comes next?',answer,{hideSelectedPanel:true});
    }else if(type==='mark-rule'){
      const modes=['multiples','prime','even','odd'],mode=modes[Math.floor(Math.random()*modes.length)],k=mode==='multiples'?[10,5,4,3][Math.floor(Math.random()*4)]:5;
      const target=valuesForRule(mode,k),label=mode==='multiples'?'multiples of '+k:mode==='prime'?'prime numbers':mode+' numbers';
      interactionMode='mark';
      challenge=challengeObject(type,'Mark all '+label+' on the hundred square.','All matching numbers marked',{freezeGrid:false,markOnly:true,targetValues:target,ruleLabel:label});
    }else{
      const k=[3,4,5,6,8,9,10][randomInt(0,6)],all=valuesForRule('multiples',k),pool=Array.from({length:100},(_,i)=>i+1).filter(n=>n%k!==0),wrong=pool[randomInt(0,pool.length-1)];
      const target=all.slice().sort(()=>Math.random()-.5).slice(0,Math.min(8,all.length));
      marked=new Set([...target,wrong]);selectedIndex=target[0]-1;
      challenge=challengeObject(type,'One marked number is not a multiple of '+k+'. Which number is wrong?',wrong,{hideSelectedPanel:true,ruleLabel:'multiples of '+k});
    }
    challenge.initialState=snapshot();
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();draw();
  }
  function restoreBeforeChallenge(){if(beforeChallenge){restore(beforeChallenge);beforeChallenge=null}}
  function clearChallenge(){
    restoreBeforeChallenge();challenge=null;challengeTab='standard';controlTab='challenge';exportMode='grid';exportStatus='';undoStack.length=0;redoStack.length=0;renderControls();draw();
  }
  function clearBoundHiding(){
    if(!challenge)return;
    challenge.hideSelectedPanel=false;challenge.hiddenRangeSummary=false;
  }
  function applyBoundHiding(source){
    clearBoundHiding();if(!challenge)return;
    if(['selected-value','one-less','one-more','ten-less','ten-more'].includes(source))challenge.hideSelectedPanel=true;
    if(source==='grid-range')challenge.hiddenRangeSummary=true;
  }
  function resolveAnswerSource(source){
    const n=currentValue();
    if(source==='selected-value')return String(n);
    if(source==='one-less')return String(n-1);
    if(source==='one-more')return String(n+1);
    if(source==='ten-less')return String(n-10);
    if(source==='ten-more')return String(n+10);
    if(source==='grid-range')return startValue+'–'+(startValue+99);
    if(source==='marked-count')return String(marked.size);
    if(source==='hidden-count')return String(hidden.size);
    return'';
  }
  function customAnswerSources(){
    return[
      {id:'selected-value',label:'Selected number'},
      {id:'one-less',label:'One less than selected'},
      {id:'one-more',label:'One more than selected'},
      {id:'ten-less',label:'Ten less than selected'},
      {id:'ten-more',label:'Ten more than selected'},
      {id:'marked-count',label:'Number of marked cells'},
      {id:'hidden-count',label:'Number of hidden cells'}
    ];
  }
  function updateChallengeAnswer(){
    if(!challenge||challenge.answerMode!=='bound'||!challenge.answerSource)return;
    const answer=resolveAnswerSource(challenge.answerSource);if(answer!=='')challenge.answer=answer;
    const live=q('#hs-custom-live-answer');if(live)live.textContent=challenge.answer||'—';
    if(challenge.revealed){
      const shown=q('.gd-challenge-actions em',q('#gd-stage'));if(shown)shown.textContent='Answer: '+challenge.answer;
    }
  }
  function enterCustomChallenge(){
    if(!beforeChallenge)beforeChallenge=snapshot();
    const wasCustom=challenge?.mode==='custom';
    if(CK)challenge=CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''});
    if(!wasCustom)clearBoundHiding();
    challenge.freezeGrid=false;challenge.markOnly=false;challenge.revealed=false;
    challengeTab='custom';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();draw();
  }
  function setCustomAnswerSource(source){
    if(!challenge||challenge.mode!=='custom')return;
    if(source==='manual'){challenge.answerMode='manual';challenge.answerSource='';clearBoundHiding()}
    else if(source==='generated'){challenge.answerMode='bound';challenge.answerSource='';clearBoundHiding()}
    else{challenge.answerMode='bound';challenge.answerSource=source;challenge.answer=resolveAnswerSource(source);applyBoundHiding(source)}
    challenge.revealed=false;renderControls();draw();
  }

  function bindExploreControls(){
    qa('[data-hs-preset]',q('#gd-controls')).forEach(button=>button.onclick=()=>mutate(()=>setStart(Number(button.dataset.hsPreset))));
    const apply=q('#hs-apply-start');if(apply)apply.onclick=()=>mutate(()=>setStart(num(q('#hs-start')?.value,startValue)));
    const mode=q('#hs-mode');if(mode)mode.onchange=()=>{ruleMode=mode.value;rulePanelOpen=false;draw();renderControls()};
    const k=q('#hs-k');if(k)k.onchange=()=>{ruleNumber=Math.max(1,Math.round(num(k.value,ruleNumber)));rulePanelOpen=false;draw();renderControls()};
    qa('[data-hs-interaction]',q('#gd-controls')).forEach(button=>button.onclick=()=>{interactionMode=button.dataset.hsInteraction;draw();renderControls()});
    const clear=q('#hs-clear-marks');if(clear)clear.onclick=()=>{if(!marked.size)return;mutate(()=>marked.clear())};
    const reveal=q('#hs-reveal-all');if(reveal)reveal.onclick=()=>{if(!hidden.size)return;mutate(()=>hidden.clear())};
  }
  function bindControls(){
    qa('[data-hs-workflow]',q('#gd-controls')).forEach(button=>button.onclick=()=>{controlTab=button.dataset.hsWorkflow;renderControls()});
    bindExploreControls();
    if(controlTab==='export'){
      qa('[data-hs-export-mode]',q('#gd-controls')).forEach(button=>button.onclick=()=>{exportMode=button.dataset.hsExportMode;exportStatus='';renderControls()});
      const lines=q('#hs-response-lines');if(lines)lines.onchange=()=>{responseLines=clamp(Math.round(num(lines.value,1)),1,4)};
      [['hs-copy-image','copy'],['hs-png','png'],['hs-svg-download','svg'],['hs-print','print']].forEach(([id,kind])=>{const button=q('#'+id);if(button)button.onclick=()=>runExport(kind)});
      return;
    }
    if(controlTab!=='challenge')return;
    qa('[data-hs-challenge-tab]',q('#gd-controls')).forEach(button=>button.onclick=()=>{
      if(button.dataset.hsChallengeTab==='custom')enterCustomChallenge();
      else{challengeTab='standard';renderControls()}
    });
    qa('[data-hs-challenge-cat]',q('#gd-controls')).forEach(button=>button.onclick=()=>{
      challengeCategory=button.dataset.hsChallengeCat;
      const first=CHALLENGE_TEMPLATES.find(t=>t.category===challengeCategory);if(first)challengeType=first.id;
      renderControls();
    });
    qa('[data-hs-challenge-type]',q('#gd-controls')).forEach(button=>button.onclick=()=>{challengeType=button.dataset.hsChallengeType;renderControls()});
    const generate=q('#hs-generate');if(generate)generate.onclick=()=>generateChallenge(challengeType);
    const edit=q('#hs-edit-challenge');if(edit)edit.onclick=enterCustomChallenge;
    const reveal=q('#hs-reveal');if(reveal)reveal.onclick=toggleMarkingReveal;
    const clearChallengeBtn=q('#hs-clear-challenge');if(clearChallengeBtn)clearChallengeBtn.onclick=clearChallenge;
    if(challengeTab==='custom'&&challenge){
      const title=q('#hs-custom-title');if(title)title.oninput=()=>{challenge.title=title.value.slice(0,100);draw()};
      const prompt=q('#hs-custom-prompt');if(prompt)prompt.oninput=()=>{challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);draw()};
      const source=q('#hs-custom-answer-source');if(source)source.onchange=()=>setCustomAnswerSource(source.value);
      const answer=q('#hs-custom-answer');if(answer)answer.oninput=()=>{challenge.answer=answer.value.slice(0,400);challenge.answerMode='manual';challenge.answerSource='';draw()};
      qa('[data-gd-rich-action]',q('#gd-controls')).forEach(button=>button.onclick=()=>{CK.applyFormat(prompt,button.dataset.gdRichAction);challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);draw()});
    }
  }

  setPanels(controlsHtml(),'');
  bindControls();
  draw();
  G.lessonState?.register('hundred-square',()=>({diagram:snapshot(),challenge,beforeChallenge,pupil:CK?.capturePupil?.(challenge),controlTab,challengeTab,challengeCategory,challengeType,exportMode,responseLines}),saved=>{
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

function multiplicationGrid(){
  const CK=G.challengeKit,X=G.exportTools;
  let size=12,focus=6,selectedRow=6,selectedCol=4,interactionMode='select',pairCommutative=true,paint=null;
  let hidden=new Set();
  const undoStack=[],redoStack=[];
  const CHALLENGE_CATEGORIES=[
    {id:'read',label:'Read & locate'},
    {id:'connections',label:'Fact families'},
    {id:'reason',label:'Reasoning'}
  ];
  const CHALLENGE_TEMPLATES=[
    {id:'missing-product',category:'read',title:'Find the product',desc:'Use the grid to find a hidden multiplication product.'},
    {id:'select-fact',category:'read',title:'Find the fact',desc:'Select the cell for a requested multiplication fact.'},
    {id:'missing-factor',category:'connections',title:'Find the missing factor',desc:'Use a row or column to complete a multiplication fact.'},
    {id:'commutative-fact',category:'connections',title:'Commutative partner',desc:'Write the reversed multiplication fact.'},
    {id:'related-division',category:'connections',title:'Related division',desc:'Use a multiplication fact to complete a related division fact.'},
    {id:'spot-error',category:'reason',title:'Spot the incorrect product',desc:'Find one incorrect product in a times-table row.'}
  ];
  let controlTab='explore',challengeTab='standard',challengeCategory='read',challengeType='missing-product',challenge=null,beforeChallenge=null;
  let exportMode='grid',responseLines=1,exportStatus='';

  function key(r,c){return r+'-'+c}
  function parseKey(k){const [r,c]=String(k).split('-').map(Number);return{r,c}}
  function snapshot(){return{size,focus,selectedRow,selectedCol,interactionMode,pairCommutative,hidden:[...hidden]}}
  function restore(state){
    size=clamp(Math.round(Number(state?.size)||12),5,15);
    focus=clamp(Math.round(Number(state?.focus)||1),1,size);
    selectedRow=clamp(Math.round(Number(state?.selectedRow)||1),1,size);
    selectedCol=clamp(Math.round(Number(state?.selectedCol)||1),1,size);
    interactionMode=state?.interactionMode||'select';
    pairCommutative=state?.pairCommutative!==false;
    hidden=new Set((Array.isArray(state?.hidden)?state.hidden:[]).filter(k=>{
      const {r,c}=parseKey(k);return r>=1&&r<=size&&c>=1&&c<=size;
    }));
  }
  function remember(){
    undoStack.push(snapshot());
    if(undoStack.length>60)undoStack.shift();
    redoStack.length=0;
  }
  function challengeFrozen(){return !!(challenge&&challenge.mode==='standard'&&(challenge.freezeGrid||challenge.revealed))}
  function challengeSelectOnly(){return !!(challenge&&challenge.mode==='standard'&&challenge.selectOnly)}
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
  function product(r=selectedRow,c=selectedCol){return r*c}
  function boundHiddenKey(){
    if(!challenge||challenge.mode!=='custom'||challenge.revealed||challenge.answerMode!=='bound')return null;
    return challenge.answerSource==='selected-product'?key(selectedRow,selectedCol):null;
  }
  function productHidden(r,c){
    const standardReveal=!!(challenge?.mode==='standard'&&challenge.revealed);
    return (hidden.has(key(r,c))&&!standardReveal)||boundHiddenKey()===key(r,c);
  }
  function selectedHidden(){return productHidden(selectedRow,selectedCol)}
  function setHidden(r,c,on){
    const setOne=(rr,cc)=>{const k=key(rr,cc);if(on)hidden.add(k);else hidden.delete(k)};
    setOne(r,c);
    if(pairCommutative&&r!==c&&r<=size&&c<=size)setOne(c,r);
  }
  function toggleHidden(r,c,on=null){
    if(challengeSelectOnly())return;
    const next=on==null?!hidden.has(key(r,c)):!!on;
    setHidden(r,c,next);
  }
  function setSize(value){
    size=clamp(Math.round(Number(value)||12),5,15);
    focus=clamp(focus,1,size);selectedRow=clamp(selectedRow,1,size);selectedCol=clamp(selectedCol,1,size);
    hidden=new Set([...hidden].filter(k=>{const {r,c}=parseKey(k);return r<=size&&c<=size}));
  }
  function setSelection(r,c){
    if(challengeFrozen())return;
    selectedRow=clamp(r,1,size);selectedCol=clamp(c,1,size);draw();renderControls();
    setTimeout(()=>q('[data-mg-cell="'+key(selectedRow,selectedCol)+'"]')?.focus(),0);
  }
  function challengeDisplayOverride(r,c){
    if(!challenge||challenge.type!=='spot-error'||challenge.revealed)return null;
    return challenge.wrongCellKey===key(r,c)?Number(challenge.wrongDisplay):null;
  }
  function factsHtml(){
    if(challenge&&!challenge.revealed&&challenge.hideFactsPanel)return'';
    const hiddenAnswer=selectedHidden(),a=selectedRow,b=selectedCol,p=product();
    const productText=hiddenAnswer?'?':p;
    const commutative=hiddenAnswer?b+' × '+a+' = ?':b+' × '+a+' = '+p;
    const divA=hiddenAnswer?'? ÷ '+a+' = '+b:p+' ÷ '+a+' = '+b;
    const divB=hiddenAnswer?'? ÷ '+b+' = '+a:p+' ÷ '+b+' = '+a;
    return '<div class="gd-mg-selected" data-mg-selected="'+key(a,b)+'">'+
      '<div class="gd-mg-selected__head"><div><span>Selected fact</span><strong>'+a+' × '+b+' = '+productText+'</strong></div>'+
        (!challengeFrozen()&&!challengeSelectOnly()?'<div class="gd-row"><button class="gd-btn" id="mg-toggle-selected" type="button">'+(hiddenAnswer?'Reveal product':'Hide product')+'</button></div>':'')+'</div>'+
      '<div class="gd-mg-facts">'+
        '<div><span>Commutative fact</span><strong>'+commutative+'</strong></div>'+
        '<div><span>Related division</span><strong>'+divA+'</strong></div>'+
        '<div><span>Related division</span><strong>'+divB+'</strong></div>'+
      '</div>'+
      (hiddenAnswer?'<p class="gd-help">The commutative partner is hidden too while “hide pairs together” is on, so the grid does not give the product away.</p>':'')+
    '</div>';
  }
  function challengeProgress(){
    if(!challenge||challenge.type!=='select-fact')return'';
    return 'Select the matching product cell, then press Check.';
  }
  function headerButton(n,scope){
    const frozen=challengeFrozen();
    return '<button type="button" class="gd-mg-header-btn'+(focus===n?' is-focus':'')+(frozen?' is-frozen':'')+'" data-mg-focus="'+n+'" aria-label="Focus '+n+' times table from '+scope+' header"'+(frozen?' disabled':'')+'>'+n+'</button>';
  }
  function cellButton(r,c){
    const k=key(r,c),isHidden=productHidden(r,c),selected=r===selectedRow&&c===selectedCol,mirror=r===selectedCol&&c===selectedRow&&!selected,rowcol=r===focus||c===focus,frozen=challengeFrozen();
    const override=challengeDisplayOverride(r,c),shown=override==null?r*c:override;
    const classes=['gd-mg-cell',rowcol?'is-focus':'',selected?'is-current':'',mirror?'is-commutative':'',isHidden?'is-hidden-product':'',!frozen&&interactionMode==='hide'?'is-paintable':'',frozen?'is-frozen':''].filter(Boolean).join(' ');
    return '<button type="button" class="'+classes+'" data-mg-cell="'+k+'" data-mg-row="'+r+'" data-mg-col="'+c+'" aria-label="'+(isHidden?'Hidden product for '+r+' times '+c:r+' times '+c+' equals '+shown)+'"'+(override!=null?' data-mg-display-override="'+override+'"':'')+(frozen?' disabled':'')+'><span>'+(isHidden?'?':shown)+'</span></button>';
  }
  function toggleModelReveal(){
    if(!challenge)return;
    challenge.revealed=!challenge.revealed;
    if(challenge.mode==='standard'&&challenge.type==='select-fact'){
      if(challenge.revealed){challenge.modelBeforeReveal=snapshot();selectedRow=challenge.targetRow;selectedCol=challenge.targetCol}
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
    let table='<table class="gd-times-grid gd-mg-grid"><thead><tr><th aria-hidden="true">×</th>';
    for(let c=1;c<=size;c++)table+='<th scope="col">'+headerButton(c,'column')+'</th>';
    table+='</tr></thead><tbody>';
    for(let r=1;r<=size;r++){
      table+='<tr><th scope="row">'+headerButton(r,'row')+'</th>';
      for(let c=1;c<=size;c++)table+='<td>'+cellButton(r,c)+'</td>';
      table+='</tr>';
    }
    table+='</tbody></table>';
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Multiplication Grid challenge',pupil:(challenge.type==='select-fact'?CK.pupilSpec('model',{check:()=>selectedRow===Number(challenge.targetRow)&&selectedCol===Number(challenge.targetCol)}):CK.pupilSpec(['commutative-fact','spot-error'].includes(challenge.type)?'equation':'number')),actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'},{action:'end',label:'Back to setup'}]:[{action:'end',label:'End challenge'}]}):'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-mg-workbench">'+
      '<div class="gd-mg-summary"><div><span>Multiplication grid</span><strong>'+size+' × '+size+' · focus '+focus+' times table</strong></div>'+
        '<div class="gd-object-toolbar"><button class="gd-btn" id="mg-undo" type="button"'+(undoStack.length&&!challengeFrozen()?'':' disabled')+'>Undo</button><button class="gd-btn" id="mg-redo" type="button"'+(redoStack.length&&!challengeFrozen()?'':' disabled')+'>Redo</button></div></div>'+
      '<div class="gd-mg-scroll">'+table+'</div>'+
      factsHtml()+
      (challenge?.type==='select-fact'?'<div class="gd-answer-live" data-mg-target-status>'+challengeProgress()+'</div>':'')+
      '<div class="gd-mg-key"><span><i class="is-focus"></i> focused table</span><span><i class="is-current"></i> selected fact</span><span><i class="is-commutative"></i> commutative partner</span><span><i class="is-hidden-product">?</i> hidden product</span></div>'+
    '</div>';
    bindStage();bindChallengeStageActions();
  }
  function paintAtPoint(x,y){
    if(!paint||challengeFrozen()||challengeSelectOnly())return;
    const el=document.elementFromPoint(x,y)?.closest?.('[data-mg-cell]');
    if(!el)return;
    const k=el.dataset.mgCell;
    if(paint.visited.has(k))return;
    paint.visited.add(k);
    const r=Number(el.dataset.mgRow),c=Number(el.dataset.mgCol);
    selectedRow=r;selectedCol=c;setHidden(r,c,paint.on);draw();
  }
  function paintMove(e){
    if(!paint||paint.pointerId!==e.pointerId)return;
    e.preventDefault();paintAtPoint(e.clientX,e.clientY);
  }
  function paintEnd(e){
    if(!paint||paint.pointerId!==e.pointerId)return;
    paint=null;
    document.removeEventListener('pointermove',paintMove);
    document.removeEventListener('pointerup',paintEnd);
    document.removeEventListener('pointercancel',paintEnd);
    renderControls();
  }
  function bindStage(){
    qa('[data-mg-focus]',q('#gd-stage')).forEach(button=>button.onclick=()=>{
      if(challengeFrozen())return;
      focus=clamp(Number(button.dataset.mgFocus),1,size);draw();renderControls();
    });
    qa('[data-mg-cell]',q('#gd-stage')).forEach(cell=>{
      cell.onclick=()=>{
        if(challengeFrozen()||interactionMode!=='select')return;
        selectedRow=Number(cell.dataset.mgRow);selectedCol=Number(cell.dataset.mgCol);draw();renderControls();
      };
      cell.onkeydown=e=>{
        if(challengeFrozen())return;
        const r=Number(cell.dataset.mgRow),c=Number(cell.dataset.mgCol);
        if(e.key==='ArrowLeft'){e.preventDefault();setSelection(r,c-1)}
        else if(e.key==='ArrowRight'){e.preventDefault();setSelection(r,c+1)}
        else if(e.key==='ArrowUp'){e.preventDefault();setSelection(r-1,c)}
        else if(e.key==='ArrowDown'){e.preventDefault();setSelection(r+1,c)}
        else if(!challengeSelectOnly()&&(e.key.toLowerCase()==='h'||e.key===' '||e.key==='Enter')){e.preventDefault();mutate(()=>toggleHidden(r,c))}
      };
      cell.onpointerdown=e=>{
        if(challengeFrozen()||challengeSelectOnly()||interactionMode!=='hide'||(e.button!=null&&e.button!==0))return;
        e.preventDefault();
        const r=Number(cell.dataset.mgRow),c=Number(cell.dataset.mgCol);
        remember();
        paint={pointerId:e.pointerId,on:!hidden.has(key(r,c)),visited:new Set()};
        document.addEventListener('pointermove',paintMove);
        document.addEventListener('pointerup',paintEnd,{once:true});
        document.addEventListener('pointercancel',paintEnd,{once:true});
        paintAtPoint(e.clientX,e.clientY);
      };
    });
    const undoBtn=q('#mg-undo');if(undoBtn)undoBtn.onclick=undo;
    const redoBtn=q('#mg-redo');if(redoBtn)redoBtn.onclick=redo;
    const toggle=q('#mg-toggle-selected');if(toggle)toggle.onclick=()=>mutate(()=>toggleHidden(selectedRow,selectedCol));
  }

  function randomHide(){
    hidden.clear();
    const candidates=[];
    for(let r=1;r<=size;r++)for(let c=r;c<=size;c++)candidates.push([r,c]);
    for(let i=candidates.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];
    }
    let products=0;
    for(const [r,c] of candidates){
      if(products>=12)break;
      if(hidden.has(key(r,c)))continue;
      setHidden(r,c,true);products+=r===c||!pairCommutative?1:2;
    }
  }
  function workflowTabs(){
    return '<div class="gd-row gd-mg-workflow-tabs" role="tablist" aria-label="Multiplication Grid workflow">'+
      '<button class="gd-btn'+(controlTab==='explore'?' gd-btn--primary':'')+'" type="button" data-mg-workflow="explore">Explore</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-mg-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+ 
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-mg-workflow="export">Export / reuse</button></div>';
  }
  function modelControlsHtml(){
    return field('Grid size','<input class="gd-input" id="mg-size" type="number" min="5" max="15" value="'+size+'">','Show tables from 1×1 up to '+size+'×'+size+'.')+
      field('Focus times table','<input class="gd-input" id="mg-focus" type="number" min="1" max="'+size+'" value="'+focus+'">','You can also click any row or column header directly.')+
      '<div class="gd-field"><span>Touch / mouse action</span><div class="gd-row">'+
        '<button class="gd-btn'+(interactionMode==='select'?' gd-btn--primary':'')+'" type="button" data-mg-interaction="select">Select fact</button>'+
        '<button class="gd-btn'+(interactionMode==='hide'?' gd-btn--primary':'')+'" type="button" data-mg-interaction="hide">Paint hide / reveal</button>'+
      '</div></div>'+
      '<label class="gd-mg-pair-toggle"><input type="checkbox" id="mg-pair"'+(pairCommutative?' checked':'')+'> <span>Hide commutative pairs together</span></label>'+
      '<div class="gd-row"><button class="gd-btn" id="mg-hide" type="button">Hide about 12 products</button><button class="gd-btn" id="mg-show" type="button">Show all</button></div>';
  }
  function exploreControlsHtml(){
    return modelControlsHtml()+'<p class="gd-help">Select a product to see its commutative and inverse division facts. Arrow keys move around the grid; Space, Enter or H hide/reveal the selected product.</p>';
  }
  function challengeObject(type,prompt,answer,extra={}){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);
    const raw={mode:'standard',type,category:meta?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),answerMode:'manual',answerSource:'',revealed:false,freezeGrid:true,selectOnly:false,hideFactsPanel:false,targetRow:null,targetCol:null,wrongCellKey:'',wrongDisplay:null,...extra};
    return CK?CK.normalise(raw):raw;
  }
  function randomInt(min,max){return min+Math.floor(Math.random()*(max-min+1))}
  function resetChallengeGrid(){
    size=12;focus=6;selectedRow=1;selectedCol=1;interactionMode='select';pairCommutative=true;hidden.clear();
  }
  function generateChallenge(type){
    const template=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!template)return;
    if(!beforeChallenge)beforeChallenge=snapshot();else restore(beforeChallenge);
    undoStack.length=0;redoStack.length=0;resetChallengeGrid();
    const a=randomInt(2,12);let b=randomInt(2,12);if(type==='commutative-fact'&&a===b)b=a===12?11:a+1;const p=a*b;
    if(type==='missing-product'){
      selectedRow=a;selectedCol=b;focus=a;setHidden(a,b,true);
      challenge=challengeObject(type,'What is '+a+' × '+b+'?',p,{hideFactsPanel:true});
    }else if(type==='select-fact'){
      focus=a;
      challenge=challengeObject(type,'Select the cell for '+a+' × '+b+'.',p,{freezeGrid:false,selectOnly:true,targetRow:a,targetCol:b,hideFactsPanel:false});
    }else if(type==='missing-factor'){
      focus=a;selectedRow=a;selectedCol=1;
      challenge=challengeObject(type,a+' × ? = '+p+'. What is the missing factor?',b,{hideFactsPanel:true});
    }else if(type==='commutative-fact'){
      focus=a;selectedRow=a;selectedCol=b;
      challenge=challengeObject(type,'Write the commutative fact for '+a+' × '+b+' = '+p+'.',b+' × '+a+' = '+p,{hideFactsPanel:true});
    }else if(type==='related-division'){
      focus=a;selectedRow=a;selectedCol=b;
      challenge=challengeObject(type,'Use '+a+' × '+b+' = '+p+' to complete '+p+' ÷ '+a+' = ?.',b,{hideFactsPanel:true});
    }else{
      focus=a;selectedRow=1;selectedCol=1;
      const wrongDisplay=p+(Math.random()<.5?-1:1)*randomInt(1,3);
      challenge=challengeObject(type,'One entry in the '+a+' times-table row is wrong. Write the corrected multiplication equation.',a+' × '+b+' = '+p,{hideFactsPanel:true,wrongCellKey:key(a,b),wrongDisplay});
    }
    challenge.initialState=snapshot();
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();draw();
  }
  function restoreBeforeChallenge(){if(beforeChallenge){restore(beforeChallenge);beforeChallenge=null}}
  function clearChallenge(){
    restoreBeforeChallenge();challenge=null;challengeTab='standard';controlTab='challenge';exportMode='grid';exportStatus='';undoStack.length=0;redoStack.length=0;renderControls();draw();
  }
  function clearBoundHiding(){if(challenge)challenge.hideFactsPanel=false}
  function applyBoundHiding(source){
    clearBoundHiding();if(!challenge)return;
    if(['selected-product','selected-fact','commutative-fact','division-row','division-col'].includes(source))challenge.hideFactsPanel=true;
  }
  function resolveAnswerSource(source){
    const a=selectedRow,b=selectedCol,p=product();
    if(source==='selected-product')return String(p);
    if(source==='selected-fact')return a+' × '+b+' = '+p;
    if(source==='commutative-fact')return b+' × '+a+' = '+p;
    if(source==='division-row')return p+' ÷ '+a+' = '+b;
    if(source==='division-col')return p+' ÷ '+b+' = '+a;
    if(source==='hidden-count')return String(hidden.size);
    return'';
  }
  function customAnswerSources(){
    return[
      {id:'selected-product',label:'Selected product'},
      {id:'selected-fact',label:'Selected multiplication fact'},
      {id:'commutative-fact',label:'Commutative fact'},
      {id:'division-row',label:'Related division by row factor'},
      {id:'division-col',label:'Related division by column factor'},
      {id:'hidden-count',label:'Number of hidden products'}
    ];
  }
  function updateChallengeAnswer(){
    if(!challenge||challenge.answerMode!=='bound'||!challenge.answerSource)return;
    const answer=resolveAnswerSource(challenge.answerSource);if(answer!=='')challenge.answer=answer;
    const live=q('#mg-custom-live-answer');if(live)live.textContent=challenge.answer||'—';
    if(challenge.revealed){
      const shown=q('.gd-challenge-actions em',q('#gd-stage'));if(shown)shown.textContent='Answer: '+challenge.answer;
    }
  }
  function enterCustomChallenge(){
    if(!beforeChallenge)beforeChallenge=snapshot();
    const wasCustom=challenge?.mode==='custom';
    if(CK)challenge=CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''});
    if(!wasCustom)clearBoundHiding();
    challenge.freezeGrid=false;challenge.selectOnly=false;challenge.revealed=false;
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
    const tabs=CK.tabsHtml?CK.tabsHtml('mg',challengeTab):'';
    if(challengeTab==='custom'){
      const custom=challenge&&challenge.mode==='custom'?challenge:CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual'});
      return tabs+CK.editorHtml(custom,'mg',{answerSources:customAnswerSources(),generatedAnswerLabel:'Keep the generated answer'})+
        modelControlsHtml()+
        '<div class="gd-row">'+(challenge&&challenge.answer?'<button class="gd-btn" id="mg-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
        (challenge?'<button class="gd-btn" id="mg-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
        '<p class="gd-help">Custom answers can follow the selected product, fact-family statements, or the number of hidden products.</p>';
    }
    const picker=CK.pickerHtml(CHALLENGE_TEMPLATES,CHALLENGE_CATEGORIES,challengeCategory,challengeType,'mg');
    const repeat=!!(challenge&&challenge.mode==='standard'&&challenge.type===challengeType);
    return tabs+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="mg-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
      (challenge&&challenge.mode!=='custom'?'<button class="gd-btn" id="mg-edit-challenge" type="button">Edit challenge</button>':'')+
      (challenge&&challenge.answer?'<button class="gd-btn" id="mg-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
      (challenge?'<button class="gd-btn" id="mg-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>';
  }
  function mgSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function exportState(pupil=false){
    const fromInitial=!!(pupil&&challenge?.mode==='standard'&&challenge.initialState);
    const raw=fromInitial?challenge.initialState:snapshot();
    const exportSize=clamp(Math.round(Number(raw?.size)||12),5,15);
    return{
      size:exportSize,
      focus:clamp(Math.round(Number(raw?.focus)||1),1,exportSize),
      selectedRow:clamp(Math.round(Number(raw?.selectedRow)||1),1,exportSize),
      selectedCol:clamp(Math.round(Number(raw?.selectedCol)||1),1,exportSize),
      pairCommutative:raw?.pairCommutative!==false,
      hidden:new Set(Array.isArray(raw?.hidden)?raw.hidden:[]),
      fromInitial
    };
  }
  function exportBoundHiddenKey(state,pupil=false){
    if(!challenge||challenge.mode!=='custom'||challenge.answerMode!=='bound'||(!pupil&&challenge.revealed))return null;
    return challenge.answerSource==='selected-product'?key(state.selectedRow,state.selectedCol):null;
  }
  function exportProductHidden(state,r,c,pupil=false){
    let isHidden=state.hidden.has(key(r,c));
    if(!pupil&&challenge?.mode==='standard'&&challenge.revealed)isHidden=false;
    return isHidden||exportBoundHiddenKey(state,pupil)===key(r,c);
  }
  function exportDisplayValue(state,r,c,pupil=false){
    if(exportProductHidden(state,r,c,pupil))return'?';
    if(challenge?.type==='spot-error'&&challenge.wrongCellKey===key(r,c)&&(pupil||!challenge.revealed))return String(challenge.wrongDisplay);
    return String(r*c);
  }
  function multiplicationGridExportSvg({pupil=false}={}){
    const state=exportState(pupil),width=1000,height=900,cell=Math.min(48,690/(state.size+1)),gridW=(state.size+1)*cell,gridX=(width-gridW)/2,gridY=105;
    const svg=mgSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Multiplication grid','data-mg-export':'multiplication-grid'});
    svg.appendChild(mgSvgEl('rect',{x:0,y:0,width,height,fill:'#fff'}));
    svg.appendChild(mgSvgEl('text',{x:65,y:50,'font-family':'Arial,sans-serif','font-size':28,'font-weight':900,fill:'#24343b'},'Multiplication grid'));
    svg.appendChild(mgSvgEl('text',{x:935,y:50,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':16,'font-weight':850,fill:'#52666d'},state.size+' × '+state.size+' · focus '+state.focus+' times table'));
    for(let r=0;r<=state.size;r++){
      for(let c=0;c<=state.size;c++){
        const x=gridX+c*cell,y=gridY+r*cell;
        if(r===0&&c===0){
          svg.appendChild(mgSvgEl('rect',{x,y,width:cell-2,height:cell-2,rx:6,fill:'#e8f4f1',stroke:'#cbd6d8','stroke-width':1.2}));
          svg.appendChild(mgSvgEl('text',{x:x+(cell-2)/2,y:y+(cell-2)/2+1,'text-anchor':'middle','dominant-baseline':'middle','font-family':'Arial,sans-serif','font-size':15,'font-weight':900,fill:'#315752'},'×'));
          continue;
        }
        if(r===0||c===0){
          const n=r===0?c:r,focused=n===state.focus;
          svg.appendChild(mgSvgEl('rect',{x,y,width:cell-2,height:cell-2,rx:6,fill:focused?'#d5efe9':'#e8f4f1',stroke:focused?'#62a59b':'#cbd6d8','stroke-width':focused?2:1.2}));
          svg.appendChild(mgSvgEl('text',{x:x+(cell-2)/2,y:y+(cell-2)/2+1,'text-anchor':'middle','dominant-baseline':'middle','font-family':'Arial,sans-serif','font-size':14,'font-weight':900,fill:'#315752'},n));
          continue;
        }
        const k=key(r,c),selected=r===state.selectedRow&&c===state.selectedCol,mirror=r===state.selectedCol&&c===state.selectedRow&&!selected,focused=r===state.focus||c===state.focus,hiddenValue=exportProductHidden(state,r,c,pupil),display=exportDisplayValue(state,r,c,pupil);
        const g=mgSvgEl('g',{'data-mg-export-cell':k});
        if(hiddenValue)g.setAttribute('data-mg-export-hidden','1');
        if(selected)g.setAttribute('data-mg-export-selected','1');
        if(mirror)g.setAttribute('data-mg-export-commutative','1');
        if(challenge?.type==='spot-error'&&challenge.wrongCellKey===k&&(pupil||!challenge.revealed))g.setAttribute('data-mg-export-override','1');
        g.appendChild(mgSvgEl('rect',{x,y,width:cell-2,height:cell-2,rx:6,fill:hiddenValue?'#f3f6f7':focused?'#fff3ce':'#fff',stroke:selected?'#137d75':focused?'#d7b65f':'#cbd6d8','stroke-width':selected?3:1.2}));
        if(mirror)g.appendChild(mgSvgEl('rect',{x:x+4,y:y+4,width:cell-10,height:cell-10,rx:4,fill:'none',stroke:'#7f9fb2','stroke-width':2.5}));
        g.appendChild(mgSvgEl('text',{x:x+(cell-2)/2,y:y+(cell-2)/2+1,'text-anchor':'middle','dominant-baseline':'middle','font-family':'Arial,sans-serif','font-size':Math.max(11,cell*.31),'font-weight':850,fill:hiddenValue?'#687b80':'#304b52','data-mg-export-cell-text':k},display));
        svg.appendChild(g);
      }
    }
    const footerY=Math.min(835,gridY+(state.size+1)*cell+52);
    svg.appendChild(mgSvgEl('text',{x:500,y:footerY,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':12,fill:'#6e8085'},'Yellow = focused table   ·   teal outline = selected fact   ·   blue inset = commutative partner   ·   ? = hidden product'));
    if(state.fromInitial)svg.appendChild(mgSvgEl('g',{'data-mg-export-initial-state':'1','aria-hidden':'true'}));
    svg.appendChild(mgSvgEl('text',{x:935,y:875,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return multiplicationGridExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(multiplicationGridExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Multiplication Grid challenge',
      prompt:challenge.type==='select-fact'?'Circle the cell for '+challenge.targetRow+' × '+challenge.targetCol+'.':prompt,
      responseLabel:challenge.category==='reason'?'Explain your thinking':challenge.type==='select-fact'?'Selected fact / answer':'Answer',
      responseLines
    });
  }
  function exportFilename(){
    if(exportMode==='challenge'&&challenge)return'multiplication-grid-'+(challenge.type||'challenge');
    return'multiplication-grid-'+size+'x'+size;
  }
  function exportMessage(message){exportStatus=message;const el=q('#mg-export-status');if(el)el.textContent=message}
  async function runExport(kind){
    if(!X){exportMessage('Export tools are unavailable.');return}
    const targetSvg=exportTargetSvg(),name=exportFilename();
    try{
      if(kind==='copy'){await X.copyPng(targetSvg);exportMessage('Image copied.')}
      else if(kind==='png'){await X.downloadPng(targetSvg,name);exportMessage('PNG downloaded.')}
      else if(kind==='svg'){X.downloadSvg(targetSvg,name);exportMessage('SVG downloaded.')}
      else if(kind==='print'){X.printSvg(targetSvg,{title:'',landscape:exportMode!=='challenge'});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'Could not export this multiplication grid.')}
  }
  function exportControlsHtml(){
    const canCard=!!challenge;
    if(!canCard&&exportMode==='challenge')exportMode='grid';
    return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export a clean vector grid or a pupil-ready challenge card.</span></div></div>'+
      (canCard?'<div class="nl-export-mode mg-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-mg-export-mode="challenge">Challenge card</button>'+
        '<button type="button" class="'+(exportMode==='grid'?'is-active':'')+'" data-mg-export-mode="grid">Grid only</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="mg-response-lines">'+[1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+'</select></label><p class="gd-help">Pupil export re-hides hidden or bound answers. Interactive Standard challenges export the original starting grid, not the teacher\'s tested selection.</p>'
        :'<p class="gd-help">Grid-only export preserves the current size, focused table, selected fact and hidden products without editing controls.</p>')+
      '<div class="nl-export-grid mg-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="mg-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'challenge':'image')+'</button>'+
        '<button class="gd-btn" id="mg-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="mg-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="mg-print" type="button">Print / PDF</button>'+
      '</div><p class="gd-help" id="mg-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }

  function controlsHtml(){return workflowTabs()+(controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():exploreControlsHtml())}
  function renderControls(){q('#gd-controls').innerHTML=controlsHtml();bindControls()}
  function bindModelControls(){
    const sizeInput=q('#mg-size');if(sizeInput)sizeInput.onchange=()=>mutate(()=>setSize(sizeInput.value));
    const focusInput=q('#mg-focus');if(focusInput)focusInput.onchange=()=>{focus=clamp(Math.round(num(focusInput.value,focus)),1,size);draw();renderControls()};
    qa('[data-mg-interaction]',q('#gd-controls')).forEach(button=>button.onclick=()=>{interactionMode=button.dataset.mgInteraction;draw();renderControls()});
    const pair=q('#mg-pair');if(pair)pair.onchange=()=>{pairCommutative=pair.checked;renderControls()};
    const hide=q('#mg-hide');if(hide)hide.onclick=()=>mutate(randomHide);
    const show=q('#mg-show');if(show)show.onclick=()=>{if(!hidden.size)return;mutate(()=>hidden.clear())};
  }
  function bindControls(){
    qa('[data-mg-workflow]',q('#gd-controls')).forEach(button=>button.onclick=()=>{controlTab=button.dataset.mgWorkflow;renderControls()});
    bindModelControls();
    if(controlTab==='export'){
      qa('[data-mg-export-mode]',q('#gd-controls')).forEach(button=>button.onclick=()=>{exportMode=button.dataset.mgExportMode;exportStatus='';renderControls()});
      const lines=q('#mg-response-lines');if(lines)lines.onchange=()=>{responseLines=clamp(Math.round(num(lines.value,1)),1,4)};
      [['mg-copy-image','copy'],['mg-png','png'],['mg-svg-download','svg'],['mg-print','print']].forEach(([id,kind])=>{const button=q('#'+id);if(button)button.onclick=()=>runExport(kind)});
      return;
    }
    if(controlTab!=='challenge')return;
    qa('[data-mg-challenge-tab]',q('#gd-controls')).forEach(button=>button.onclick=()=>{
      if(button.dataset.mgChallengeTab==='custom')enterCustomChallenge();
      else{challengeTab='standard';renderControls()}
    });
    qa('[data-mg-challenge-cat]',q('#gd-controls')).forEach(button=>button.onclick=()=>{
      challengeCategory=button.dataset.mgChallengeCat;
      const first=CHALLENGE_TEMPLATES.find(t=>t.category===challengeCategory);if(first)challengeType=first.id;
      renderControls();
    });
    qa('[data-mg-challenge-type]',q('#gd-controls')).forEach(button=>button.onclick=()=>{challengeType=button.dataset.mgChallengeType;renderControls()});
    const generate=q('#mg-generate');if(generate)generate.onclick=()=>generateChallenge(challengeType);
    const edit=q('#mg-edit-challenge');if(edit)edit.onclick=enterCustomChallenge;
    const reveal=q('#mg-reveal');if(reveal)reveal.onclick=toggleModelReveal;
    const clearChallengeBtn=q('#mg-clear-challenge');if(clearChallengeBtn)clearChallengeBtn.onclick=clearChallenge;
    if(challengeTab==='custom'&&challenge){
      const title=q('#mg-custom-title');if(title)title.oninput=()=>{challenge.title=title.value.slice(0,100);draw()};
      const prompt=q('#mg-custom-prompt');if(prompt)prompt.oninput=()=>{challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);draw()};
      const source=q('#mg-custom-answer-source');if(source)source.onchange=()=>setCustomAnswerSource(source.value);
      const answer=q('#mg-custom-answer');if(answer)answer.oninput=()=>{challenge.answer=answer.value.slice(0,400);challenge.answerMode='manual';challenge.answerSource='';draw()};
      qa('[data-gd-rich-action]',q('#gd-controls')).forEach(button=>button.onclick=()=>{CK.applyFormat(prompt,button.dataset.gdRichAction);challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);draw()});
    }
  }

  setPanels(controlsHtml(),'');
  bindControls();
  draw();
  G.lessonState?.register('multiplication-grid',()=>({diagram:snapshot(),challenge,beforeChallenge,pupil:CK?.capturePupil?.(challenge),controlTab,challengeTab,challengeCategory,challengeType,exportMode,responseLines}),saved=>{
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

  const ARRAY_TEMPLATES=[
    {id:'count-total',category:'read',title:'How many altogether?',desc:'Use the rows and columns to find the total.'},
    {id:'multiplication-fact',category:'read',title:'Write the multiplication',desc:'Write the multiplication sentence represented by the array.'},
    {id:'missing-factor',category:'read',title:'Missing factor',desc:'Use the array to find a hidden row or column count.'},
    {id:'related-division',category:'build',title:'Related division fact',desc:'Use the array to complete an inverse division fact.'},
    {id:'build-array',category:'build',title:'Build the array',desc:'Resize the board to make a requested rows-by-columns array.'},
    {id:'commutative-fact',category:'reason',title:'Commutative fact',desc:'Write the swapped multiplication fact represented by the same total.'},
    {id:'partial-products',category:'reason',title:'Use the partition',desc:'Read a split array as partial products.'}
  ];

function arraySettings(model={}){
 const src=model.generationSettings||model,minimum=Math.max(2,Math.min(11,Math.round(Number(src.min)||2))),maximum=Math.max(minimum+1,Math.min(12,Math.round(Number(src.max)||10)));
 return {min:minimum,max:maximum,responseLines:Math.max(1,Math.min(4,Math.round(Number(model.responseLines)||1)))};
}
function arrayTypes(){return ARRAY_TEMPLATES.map(t=>({id:t.id,label:t.title}))}
function arrayGenerate(type,settings={},rng=Math.random){
 const template=ARRAY_TEMPLATES.find(t=>t.id===type);if(!template)throw Error('Unknown array question.');
 const cfg=arraySettings(settings);let rows=2,cols=2,rowSplit=0,colSplit=0,challenge;
 function randomDimension(){return cfg.min+Math.floor(rng()*(cfg.max-cfg.min+1))}
 function setDimensions(r,c){rows=r;cols=c}
 function normaliseSplits(){if(rowSplit>=rows)rowSplit=0;if(colSplit>=cols)colSplit=0}
 function challengeObject(type,prompt,answer,extra={}){return {mode:'standard',type,category:template.category,title:'',prompt,promptHtml:prompt,answer:String(answer),answerMode:'manual',answerSource:'',revealed:false,freezeBoard:true,hiddenEquation:false,hiddenTotal:false,hiddenRepeated:false,hiddenInverse:false,hiddenPartial:false,hiddenDimensions:[],targetRows:null,targetCols:null,...extra}}
  function total(){return rows*cols}
  function multiplicationFact(){return rows+' × '+cols+' = '+total()}
  function repeatedAddition(){return Array.from({length:rows},()=>cols).join(' + ')+' = '+total()}
  function inverseFacts(){return total()+' ÷ '+rows+' = '+cols+' · '+total()+' ÷ '+cols+' = '+rows}
  function partitionParts(){
    const parts=[];
    const rowBands=rowSplit?[rowSplit,rows-rowSplit]:[rows];
    const colBands=colSplit?[colSplit,cols-colSplit]:[cols];
    rowBands.forEach(r=>colBands.forEach(c=>parts.push({r,c,value:r*c})));
    return parts;
  }
  function partitionMath(){
    const parts=partitionParts();
    if(parts.length===1)return'';
    return parts.map(p=>p.r+' × '+p.c).join(' + ')+' = '+parts.map(p=>p.value).join(' + ')+' = '+total();
  }
    rowSplit=0;colSplit=0;
    const r=randomDimension();let c=randomDimension();if(type==='commutative-fact'&&c===r)c=r===cfg.max?cfg.min:r+1;
    setDimensions(r,c);
    if(type==='count-total'){
      challenge=challengeObject(type,'How many objects are in the array altogether?',String(total()),{hiddenTotal:true,hiddenRepeated:true,hiddenInverse:true});
    }else if(type==='multiplication-fact'){
      challenge=challengeObject(type,'Write the multiplication equation as rows × columns, including the total.',multiplicationFact(),{hiddenEquation:true,hiddenRepeated:true,hiddenInverse:true});
    }else if(type==='missing-factor'){
      const hideRows=rng()<.5,known=hideRows?cols:rows;
      challenge=challengeObject(
        type,
        'There are '+total()+' objects arranged in '+known+' '+(hideRows?'columns':'rows')+'. How many '+(hideRows?'rows':'columns')+' are there?',
        String(hideRows?rows:cols),
        {hiddenDimensions:[hideRows?'rows':'cols'],hiddenRepeated:true,hiddenInverse:true}
      );
    }else if(type==='related-division'){
      const divisorRows=rng()<.5,divisor=divisorRows?rows:cols,answer=divisorRows?cols:rows;
      challenge=challengeObject(
        type,
        'Complete the related division fact: '+total()+' ÷ '+divisor+' = ?',
        String(answer),
        {hiddenDimensions:[divisorRows?'cols':'rows'],hiddenRepeated:true,hiddenInverse:true}
      );
    }else if(type==='build-array'){
      const targetRows=r,targetCols=c,startRows=targetRows===2?3:2,startCols=targetCols===2?3:2;
      setDimensions(startRows,startCols);
      challenge=challengeObject(
        type,
        'Build an array with '+targetRows+' rows and '+targetCols+' columns.',
        targetRows+' × '+targetCols+' = '+(targetRows*targetCols),
        {freezeBoard:false,targetRows,targetCols,hiddenEquation:false,hiddenRepeated:false,hiddenInverse:false}
      );
    }else if(type==='commutative-fact'){
      challenge=challengeObject(
        type,
        'The array shows '+multiplicationFact()+'. Write the commutative multiplication fact.',
        cols+' × '+rows+' = '+total(),
        {hiddenRepeated:true,hiddenInverse:true}
      );
    }else{
      if(cols>=4&&rng()<.65)colSplit=1+Math.floor(rng()*(cols-1));
      else rowSplit=1+Math.floor(rng()*(rows-1));
      normaliseSplits();
      challenge=challengeObject(
        type,
        'Use the partition lines. Write each partial product and the total.',
        partitionMath(),
        {hiddenEquation:true,hiddenRepeated:true,hiddenInverse:true,hiddenPartial:true}
      );
    }

 return {type,settings:cfg,diagram:{rows,cols,rowSplit,colSplit},challenge};
}
function arrayPaper(data,teacher=false){
 const c=data.challenge,task=!!c,build=c?.type==='build-array',blank=build&&!teacher;
 const d=build?{rows:c.targetRows,cols:c.targetCols,rowSplit:0,colSplit:0}:data.diagram;
 const rows=blank?12:d.rows,cols=blank?12:d.cols,rowSplit=d.rowSplit||0,colSplit=d.colSplit||0;
 const cell=30,W=680,x=(W-cols*cell)/2,y=40,H=y+rows*cell+(task?30:155+(rowSplit||colSplit?38:0));
 function el(name,attrs={},value){const n=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(value!==undefined)n.textContent=String(value);return n}
 const svg=el('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':blank?'Blank grid for drawing':'Array diagram'});
 const add=(name,attrs,value)=>svg.appendChild(el(name,attrs,value));
 const text=(xx,yy,value,size=16,anchor='middle')=>add('text',{x:xx,y:yy,'text-anchor':anchor,'font-family':'Arial,sans-serif','font-size':size,'font-weight':700,fill:'#334a52'},value);
 add('rect',{width:W,height:H,fill:'#fff'});
 add('rect',{x,y,width:cols*cell,height:rows*cell,fill:'#fff',stroke:'#91a6a9','stroke-width':1.5});
 for(let j=1;j<cols;j++)add('line',{x1:x+j*cell,y1:y,x2:x+j*cell,y2:y+rows*cell,stroke:'#cbd9db'});
 for(let i=1;i<rows;i++)add('line',{x1:x,y1:y+i*cell,x2:x+cols*cell,y2:y+i*cell,stroke:'#cbd9db'});
 if(!blank){
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++)add('circle',{cx:x+(j+.5)*cell,cy:y+(i+.5)*cell,r:7,fill:'#147d75','data-array-dot':'1'});
  if(rowSplit)add('line',{x1:x,y1:y+rowSplit*cell,x2:x+cols*cell,y2:y+rowSplit*cell,stroke:'#b77d16','stroke-width':3});
  if(colSplit)add('line',{x1:x+colSplit*cell,y1:y,x2:x+colSplit*cell,y2:y+rows*cell,stroke:'#b77d16','stroke-width':3});
  text(W/2,26,(c?.hiddenDimensions?.includes('cols')&&!teacher?'?':cols)+' columns');
  // Horizontal label on the left avoids clipping and rotated text.
  text(x-12,y+rows*cell/2-3,c?.hiddenDimensions?.includes('rows')&&!teacher?'?':rows,16,'end');
  text(x-12,y+rows*cell/2+15,'rows',12,'end');
 }
 if(!task){
  const base=y+rows*cell+30; text(W/2,base,rows+' × '+cols+' = '+rows*cols,20);
  text(W/2,base+30,Array.from({length:rows},()=>cols).join(' + ')+' = '+rows*cols,14);
  text(W/2,base+58,rows*cols+' ÷ '+rows+' = '+cols+'     ·     '+rows*cols+' ÷ '+cols+' = '+rows,14);
  if(rowSplit||colSplit){const rr=rowSplit?[rowSplit,rows-rowSplit]:[rows],cc=colSplit?[colSplit,cols-colSplit]:[cols];text(W/2,base+86,rr.flatMap(r=>cc.map(k=>r+' × '+k)).join(' + ')+' = '+rows*cols,14)}
  return svg;
 }
 const prompt=build?'Draw or shade an array with '+c.targetRows+' rows and '+c.targetCols+' columns.':c.prompt;
 const lines=Math.max(data.settings?.responseLines||1,c.type==='partial-products'?2:1);
 return G.exportTools.composeWorksheetCardSvg(svg,{title:ARRAY_TEMPLATES.find(t=>t.id===c.type)?.title||'Array challenge',prompt,responseLabel:c.type==='partial-products'?'Partial products and total':'Answer',responseMode:build?'none':lines>1?'lines':'box',responseLines:lines,paperStyle:'plain',answer:c.answer,showAnswer:teacher,diagramMaxHeight:build?550:450});
}
function arrayData(model){if(model.challenge?.mode==='custom')throw Error('Use individual export for custom array tasks.');return {type:model.challenge?.type,settings:arraySettings({...model,generationSettings:model.challenge?.generationSettings||model.generationSettings}),diagram:model.diagram,challenge:model.challenge?{...model.challenge,revealed:false}:null}}
G.arrayPaperModel={generate:arrayGenerate,render:arrayPaper,types:arrayTypes,settings:arraySettings};
if(G.publishing)G.publishing.register('array-builder',{
 label:'Array builder',types:arrayTypes,title:item=>item.kind==='diagram'?'Array illustration':ARRAY_TEMPLATES.find(t=>t.id===item.data.type)?.title||'Array challenge',
 signature:d=>JSON.stringify([d.type,d.challenge.prompt,d.type==='build-array'?[d.challenge.targetRows,d.challenge.targetCols]:d.diagram]),
 recipe:(model,type)=>({type,settings:arraySettings(model)}),
 generate(recipe,rng){const ids=arrayTypes().map(t=>t.id);return arrayGenerate(recipe.type==='all'?ids[Math.floor(rng()*ids.length)]:recipe.type,recipe.settings,rng)},
 capture(model){const data=arrayData(model);return [G.publishing.record('array-builder',data.challenge?'challenge':'diagram',data,data.challenge?{type:data.type,settings:data.settings}:null)]},
 render(item,teacher){return arrayPaper(item.data,teacher)}
});

function arrayBuilder(){
  const CK=G.challengeKit,X=G.exportTools;
  let rows=4,cols=6,rowSplit=0,colSplit=0,drag=null;
  let undoStack=[],redoStack=[];
  const MAX=12;
  const CHALLENGE_CATEGORIES=[
    {id:'read',label:'Read the array'},
    {id:'build',label:'Build & relate'},
    {id:'reason',label:'Reasoning'}
  ];
  const CHALLENGE_TEMPLATES=ARRAY_TEMPLATES;
  let controlTab='explore',challengeTab='standard',challengeCategory='read',challengeType='count-total',challenge=null,beforeChallenge=null;
  let exportMode='diagram',responseLines=1,exportStatus='',generationSettings={min:2,max:10};

  function clampDim(value){return clamp(Math.round(num(value,1)),1,MAX)}
  function normaliseSplits(){
    if(rowSplit>=rows)rowSplit=0;
    if(colSplit>=cols)colSplit=0;
  }
  function total(){return rows*cols}
  function multiplicationFact(){return rows+' × '+cols+' = '+total()}
  function repeatedAddition(){return Array.from({length:rows},()=>cols).join(' + ')+' = '+total()}
  function inverseFacts(){return total()+' ÷ '+rows+' = '+cols+' · '+total()+' ÷ '+cols+' = '+rows}
  function snapshot(){return{rows,cols,rowSplit,colSplit}}
  function restoreSnapshot(value){
    if(!value)return;
    rows=clampDim(value.rows);cols=clampDim(value.cols);
    rowSplit=clamp(Math.round(num(value.rowSplit,0)),0,Math.max(0,rows-1));
    colSplit=clamp(Math.round(num(value.colSplit,0)),0,Math.max(0,cols-1));
    normaliseSplits();drag=null;
  }
  function snapshotsEqual(a,b){
    return !!a&&!!b&&a.rows===b.rows&&a.cols===b.cols&&a.rowSplit===b.rowSplit&&a.colSplit===b.colSplit;
  }
  function clearHistory(){undoStack=[];redoStack=[]}
  function rememberSnapshot(before){
    const prior=before||snapshot(),after=snapshot();
    if(snapshotsEqual(prior,after))return false;
    undoStack.push(prior);
    if(undoStack.length>80)undoStack.shift();
    redoStack=[];
    return true;
  }
  function historyDisabled(){return challengeFrozen()}
  function undoArray(){
    if(historyDisabled()||!undoStack.length)return;
    redoStack.push(snapshot());
    restoreSnapshot(undoStack.pop());
    renderControls();draw();
  }
  function redoArray(){
    if(historyDisabled()||!redoStack.length)return;
    undoStack.push(snapshot());
    restoreSnapshot(redoStack.pop());
    renderControls();draw();
  }
  function mutateBoard(fn){
    if(historyDisabled())return;
    const before=snapshot();
    fn();normaliseSplits();
    const changed=rememberSnapshot(before);
    renderControls();draw();
    return changed;
  }
  function setDimensions(nextRows,nextCols){
    rows=clampDim(nextRows);cols=clampDim(nextCols);normaliseSplits();
  }
  function partitionParts(){
    const parts=[];
    const rowBands=rowSplit?[rowSplit,rows-rowSplit]:[rows];
    const colBands=colSplit?[colSplit,cols-colSplit]:[cols];
    rowBands.forEach(r=>colBands.forEach(c=>parts.push({r,c,value:r*c})));
    return parts;
  }
  function partitionMath(){
    const parts=partitionParts();
    if(parts.length===1)return'';
    return parts.map(p=>p.r+' × '+p.c).join(' + ')+' = '+parts.map(p=>p.value).join(' + ')+' = '+total();
  }
  function challengeObject(type,prompt,answer,extra={}){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);
    const raw={
      mode:'standard',type,category:meta?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),
      answerMode:'manual',answerSource:'',revealed:false,freezeBoard:true,
      hiddenEquation:false,hiddenTotal:false,hiddenRepeated:false,hiddenInverse:false,hiddenPartial:false,hiddenDimensions:[],
      targetRows:null,targetCols:null,...extra
    };
    return CK?CK.normalise(raw):raw;
  }
  function hiddenFlag(key){
    return !!(challenge&&!challenge.revealed&&challenge[key]);
  }
  function hiddenDimension(kind){
    return !!(challenge&&!challenge.revealed&&Array.isArray(challenge.hiddenDimensions)&&challenge.hiddenDimensions.includes(kind));
  }
  function challengeFrozen(){
    return !!(challenge&&challenge.mode==='standard'&&(challenge.freezeBoard||challenge.revealed));
  }
  function resolveAnswerSource(source){
    if(source==='rows')return String(rows);
    if(source==='cols')return String(cols);
    if(source==='total')return String(total());
    if(source==='multiplication')return multiplicationFact();
    if(source==='repeated')return repeatedAddition();
    if(source==='division')return inverseFacts();
    if(source==='partial')return partitionMath()||'No partition';
    return'';
  }
  function customAnswerSources(){
    const sources=[
      {id:'rows',label:'Number of rows'},
      {id:'cols',label:'Number of columns'},
      {id:'total',label:'Total objects'},
      {id:'multiplication',label:'Multiplication fact'},
      {id:'repeated',label:'Repeated addition'},
      {id:'division',label:'Related division facts'}
    ];
    if(rowSplit||colSplit)sources.push({id:'partial',label:'Partial-product calculation'});
    return sources;
  }
  function clearBoundHiding(){
    if(!challenge)return;
    challenge.hiddenEquation=false;challenge.hiddenTotal=false;challenge.hiddenRepeated=false;challenge.hiddenInverse=false;challenge.hiddenPartial=false;challenge.hiddenDimensions=[];
  }
  function applyBoundHiding(source){
    clearBoundHiding();if(!challenge)return;
    if(source==='rows'){
      challenge.hiddenDimensions=['rows'];challenge.hiddenEquation=false;challenge.hiddenRepeated=true;challenge.hiddenInverse=true;challenge.hiddenPartial=true;
    }else if(source==='cols'){
      challenge.hiddenDimensions=['cols'];challenge.hiddenEquation=false;challenge.hiddenRepeated=true;challenge.hiddenInverse=true;challenge.hiddenPartial=true;
    }else{
      challenge.hiddenEquation=true;challenge.hiddenRepeated=true;challenge.hiddenInverse=true;challenge.hiddenPartial=true;
      if(source==='total')challenge.hiddenTotal=true;
    }
  }
  function updateChallengeAnswer(){
    if(!challenge||challenge.answerMode!=='bound'||!challenge.answerSource)return;
    const answer=resolveAnswerSource(challenge.answerSource);if(answer!=='')challenge.answer=answer;
    const live=q('#ab-custom-live-answer');if(live)live.textContent=challenge.answer||'—';
    if(challenge.revealed){
      const shown=q('.gd-challenge-actions em',q('#gd-stage'));
      if(shown)shown.textContent='Answer: '+challenge.answer;
    }
  }
  function buildOnTarget(){
    return !!(challenge&&challenge.mode==='standard'&&challenge.type==='build-array'&&rows===Number(challenge.targetRows)&&cols===Number(challenge.targetCols));
  }
  function splitOptions(kind){
    const n=kind==='row'?rows:cols,current=kind==='row'?rowSplit:colSplit;
    let h='<option value="0">No split</option>';
    for(let i=1;i<n;i++)h+='<option value="'+i+'"'+(current===i?' selected':'')+'>After '+i+'</option>';
    return h;
  }
  function workflowTabs(){
    return '<div class="gd-row gd-ab-workflow-tabs" role="tablist" aria-label="Arrays workflow">'+
      '<button class="gd-btn'+(controlTab==='explore'?' gd-btn--primary':'')+'" type="button" data-ab-workflow="explore">Explore</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-ab-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-ab-workflow="export">Export / reuse</button></div>';
  }
  function exploreControlsHtml(){
    return '<div class="gd-row"><button class="gd-btn" id="ab-undo" type="button"'+(historyDisabled()||!undoStack.length?' disabled':'')+'>Undo</button><button class="gd-btn" id="ab-redo" type="button"'+(historyDisabled()||!redoStack.length?' disabled':'')+'>Redo</button></div>'+
      field('Rows','<div class="gd-row"><button class="gd-btn" id="ab-row-down" type="button" aria-label="Remove one row">−</button><input class="gd-input gd-array-count" id="ab-r" type="number" min="1" max="'+MAX+'" value="'+rows+'"><button class="gd-btn" id="ab-row-up" type="button" aria-label="Add one row">+</button></div>')+
      field('Columns','<div class="gd-row"><button class="gd-btn" id="ab-col-down" type="button" aria-label="Remove one column">−</button><input class="gd-input gd-array-count" id="ab-c" type="number" min="1" max="'+MAX+'" value="'+cols+'"><button class="gd-btn" id="ab-col-up" type="button" aria-label="Add one column">+</button></div>')+
      '<div class="gd-row"><button class="gd-btn gd-btn--primary" id="ab-swap" type="button">Rotate / swap factors</button><button class="gd-btn" id="ab-random" type="button">Random array</button></div>'+
      field('Partition rows','<select class="gd-select" id="ab-row-split">'+splitOptions('row')+'</select>','Optional split for partial products.')+
      field('Partition columns','<select class="gd-select" id="ab-col-split">'+splitOptions('col')+'</select>','Use one or both splits to decompose the array.')+
      '<div class="gd-row"><button class="gd-btn" id="ab-clear-splits" type="button"'+(!rowSplit&&!colSplit?' disabled':'')+'>Clear partitions</button></div>'+
      '<p class="gd-help">Work directly on the array too: drag the right edge to change columns and the bottom edge to change rows. Arrow keys work when a resize handle is focused.</p>';
  }
  function challengeControlsHtml(){
    if(!CK)return '<p class="gd-help">Challenge tools are unavailable.</p>';
    const tabs=CK.tabsHtml?CK.tabsHtml('ab',challengeTab):'';
    if(challengeTab==='custom'){
      const custom=challenge&&challenge.mode==='custom'?challenge:CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual'});
      return tabs+CK.editorHtml(custom,'ab',{answerSources:customAnswerSources(),generatedAnswerLabel:'Keep the generated answer'})+
        '<div class="gd-row">'+(challenge&&challenge.answer?'<button class="gd-btn" id="ab-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
        (challenge?'<button class="gd-btn" id="ab-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
        '<p class="gd-help">Custom challenges stay attached to the live array. Bind an answer to rows, columns, total, related facts or a partition calculation when useful.</p>';
    }
    const picker=CK.pickerHtml(CHALLENGE_TEMPLATES,CHALLENGE_CATEGORIES,challengeCategory,challengeType,'ab');
    const repeat=!!(challenge&&challenge.mode==='standard'&&challenge.type===challengeType);
    const options=(from,to,current)=>Array.from({length:to-from+1},(_,i)=>'<option value="'+(from+i)+'"'+(from+i===current?' selected':'')+'>'+(from+i)+'</option>').join('');
    const range='<div class="gd-row">'+field('Smallest factor','<select id="ab-gen-min" class="gd-select">'+options(2,11,generationSettings.min)+'</select>')+field('Largest factor','<select id="ab-gen-max" class="gd-select">'+options(generationSettings.min+1,12,generationSettings.max)+'</select>')+'</div>';
    return tabs+range+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="ab-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
      (challenge&&challenge.mode!=='custom'?'<button class="gd-btn" id="ab-edit-challenge" type="button">Edit challenge</button>':'')+
      (challenge&&challenge.answer?'<button class="gd-btn" id="ab-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
      (challenge?'<button class="gd-btn" id="ab-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>';
  }
  function exportControlsHtml(){
    const canCard=!!challenge;
    if(!canCard&&exportMode==='challenge')exportMode='diagram';
    return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export a clean vector array or a pupil-ready challenge card.</span></div></div>'+
      (canCard?'<div class="nl-export-mode ab-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-ab-export-mode="challenge">Challenge card</button>'+
        '<button type="button" class="'+(exportMode==='diagram'?'is-active':'')+'" data-ab-export-mode="diagram">Array only</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="ab-response-lines">'+
          [1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+
          '</select></label><p class="gd-help">The pupil card keeps hidden factors and calculations hidden even if you revealed them on screen.</p>'
        :'<p class="gd-help">Array-only export contains the current visual model, partitions and visible maths without editing controls.</p>')+
      '<div class="nl-export-grid ab-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="ab-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'challenge':'image')+'</button>'+
        '<button class="gd-btn" id="ab-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="ab-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="ab-print" type="button">Print / PDF</button>'+
      '</div>'+(challenge?.mode==='standard'&&exportMode==='challenge'?'<div class="nl-export-grid ab-export-grid"><button class="gd-btn" id="ab-copy-key" type="button">Copy teacher key</button><button class="gd-btn" id="ab-print-key" type="button">Print teacher key</button></div>':'')+'<p class="gd-help" id="ab-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }
  function abSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function exportHiddenFlag(key,pupil=false){
    if(!challenge)return false;
    return pupil?!!challenge[key]:hiddenFlag(key);
  }
  function exportHiddenDimension(kind,pupil=false){
    if(!challenge)return false;
    if(!Array.isArray(challenge.hiddenDimensions))return false;
    return pupil?challenge.hiddenDimensions.includes(kind):hiddenDimension(kind);
  }
  function exportDimension(kind,pupil=false){
    return exportHiddenDimension(kind,pupil)?'?':String(kind==='rows'?rows:cols);
  }
  function exportEquationText(pupil=false){
    if(exportHiddenFlag('hiddenEquation',pupil))return'?';
    const r=exportDimension('rows',pupil),c=exportDimension('cols',pupil),t=exportHiddenFlag('hiddenTotal',pupil)?'?':String(total());
    return r+' × '+c+' = '+t;
  }
  function arrayExportSvg({pupil=false}={}){
    const buildBlank=!!(pupil&&challenge?.mode==='standard'&&challenge.type==='build-array');
    const width=900,cell=34,gridRows=buildBlank?MAX:rows,gridCols=buildBlank?MAX:cols;
    const boardW=gridCols*cell,boardH=gridRows*cell,boardX=(width-boardW)/2,boardY=76;
    const mathsY=boardY+boardH+62,partial=partitionMath(),showPartial=!!partial&&!buildBlank;
    const focusedExport=pupil&&challenge?.mode==='standard';
    const mathsRows=buildBlank||focusedExport?0:(showPartial?4:3),height=buildBlank||focusedExport?boardY+boardH+100:mathsY+mathsRows*48+50;
    const svg=abSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Array model','data-ab-export':'array'});
    svg.appendChild(abSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(abSvgEl('rect',{x:boardX-14,y:boardY-14,width:boardW+28,height:boardH+28,rx:16,fill:'#f8fbfb',stroke:'#9db2b5','stroke-width':2,'data-ab-export-board':'1','data-ab-export-build-grid':buildBlank?'12x12':''}));

    for(let c=1;c<gridCols;c++){
      const x=boardX+c*cell;
      svg.appendChild(abSvgEl('line',{x1:x,y1:boardY,x2:x,y2:boardY+boardH,stroke:'#dbe4e5','stroke-width':1,'data-ab-export-grid-line':'col'}));
    }
    for(let r=1;r<gridRows;r++){
      const y=boardY+r*cell;
      svg.appendChild(abSvgEl('line',{x1:boardX,y1:y,x2:boardX+boardW,y2:y,stroke:'#dbe4e5','stroke-width':1,'data-ab-export-grid-line':'row'}));
    }
    if(!buildBlank){
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
        const x=boardX+c*cell,y=boardY+r*cell;
        svg.appendChild(abSvgEl('circle',{cx:x+cell/2,cy:y+cell/2,r:7.5,fill:'#147d75','data-ab-export-dot':'1'}));
      }
    }

    if(!buildBlank&&rowSplit){
      const y=boardY+rowSplit*cell;
      svg.appendChild(abSvgEl('line',{x1:boardX,y1:y,x2:boardX+boardW,y2:y,stroke:'#d59b27','stroke-width':5,'data-ab-export-row-split':'1'}));
    }
    if(!buildBlank&&colSplit){
      const x=boardX+colSplit*cell;
      svg.appendChild(abSvgEl('line',{x1:x,y1:boardY,x2:x,y2:boardY+boardH,stroke:'#d59b27','stroke-width':5,'data-ab-export-col-split':'1'}));
    }

    if(buildBlank){
      svg.setAttribute('data-ab-export-build-grid','12x12');
      svg.appendChild(abSvgEl('text',{x:width/2,y:boardY-34,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':18,'font-weight':850,fill:'#425b62'},'Draw or shade your array'));
    }else{
      const rLabel=exportDimension('rows',pupil),cLabel=exportDimension('cols',pupil);
      svg.appendChild(abSvgEl('text',{x:width/2,y:38,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':18,'font-weight':850,fill:'#425b62','data-ab-export-cols':'1'},cLabel+' columns'));
      svg.appendChild(abSvgEl('text',{x:boardX-34,y:boardY+boardH/2,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':18,'font-weight':850,fill:'#425b62',transform:'rotate(-90 '+(boardX-34)+' '+(boardY+boardH/2)+')','data-ab-export-rows':'1'},rLabel+' rows'));

      const lines=[
        ['Multiplication',exportEquationText(pupil)],
        ['Repeated addition',exportHiddenFlag('hiddenRepeated',pupil)?'?':repeatedAddition()],
        ['Related division facts',exportHiddenFlag('hiddenInverse',pupil)?'?':inverseFacts()]
      ];
      if(showPartial)lines.push(['Partial products',exportHiddenFlag('hiddenPartial',pupil)?'?':partial]);
      if(!focusedExport)lines.forEach((item,index)=>{
        const y=mathsY+index*48;
        svg.appendChild(abSvgEl('rect',{x:96,y:y-27,width:width-192,height:38,rx:10,fill:index===3?'#fff9ea':'#f6f9f9',stroke:'#d9e2e4','stroke-width':1}));
        svg.appendChild(abSvgEl('text',{x:112,y:y-4,'font-family':'Arial,sans-serif','font-size':11,'font-weight':750,fill:'#718288'},item[0]));
        svg.appendChild(abSvgEl('text',{x:width-112,y:y-4,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':15,'font-weight':850,fill:'#304b52','data-ab-export-math':index},item[1]));
      });
    }
    svg.appendChild(abSvgEl('text',{x:width-42,y:height-16,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(teacher=false){
    if(challenge?.mode==='standard'&&exportMode==='challenge')return arrayPaper(arrayData({diagram:snapshot(),challenge,responseLines}),teacher);
    if(!challenge)return arrayPaper(arrayData({diagram:snapshot(),responseLines}));
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return arrayExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(arrayExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Array challenge',
      prompt:challenge.type==='build-array'?'Draw or shade an array with '+challenge.targetRows+' rows and '+challenge.targetCols+' columns.':prompt,
      responseLabel:challenge.type==='build-array'?'Working / answer':challenge.category==='reason'?'Explain your thinking':'Answer',
      responseLines,
      brand:'99 Club Studio'
    });
  }
  function exportName(){
    const meta=challenge&&CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return exportMode==='challenge'&&challenge?(challenge.title||meta?.title||'array-challenge'):'array-'+rows+'x'+cols;
  }
  function exportMessage(text){exportStatus=text;const el=q('#ab-export-status');if(el)el.textContent=text}
  async function exportAction(kind,teacher=false){
    try{
      if(!X)throw new Error('Export tools are not available.');
      const target=exportTargetSvg(teacher),isCard=exportMode==='challenge'&&!!challenge,name=exportName()+(teacher?'-teacher-key':'');
      if(kind==='copy'){await X.copyPng(target);exportMessage(isCard?'Challenge copied — paste it into your worksheet, slide or document.':'Array image copied — paste it into your slide or document.')}
      if(kind==='png'){await X.downloadPng(target,name,2);exportMessage(isCard?'Challenge PNG downloaded.':'Array PNG downloaded.')}
      if(kind==='svg'){X.downloadSvg(target,name);exportMessage(isCard?'Challenge SVG downloaded.':'Array SVG downloaded.')}
      if(kind==='print'){X.printSvg(target,{title:'',landscape:!isCard});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'That export did not work.')}
  }
  function controlsHtml(){return workflowTabs()+(controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():exploreControlsHtml())}
  function renderControls(){
    const panel=q('#gd-controls');if(panel)panel.innerHTML=controlsHtml();bindControls();
  }
  function restoreBeforeChallenge(){
    if(beforeChallenge){restoreSnapshot(beforeChallenge);beforeChallenge=null}
  }
  function clearChallenge(){
    restoreBeforeChallenge();clearHistory();
    challenge=null;challengeTab='standard';controlTab='challenge';renderControls();draw();
  }
  function enterCustomChallenge(){
    const wasCustom=challenge?.mode==='custom';
    if(CK)challenge=CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''});
    if(!challenge.hiddenDimensions)challenge.hiddenDimensions=[];
    if(!wasCustom)clearBoundHiding();
    challenge.freezeBoard=false;challenge.revealed=false;clearHistory();
    challengeTab='custom';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();draw();
  }
  function setCustomAnswerSource(source){
    if(!challenge||challenge.mode!=='custom')return;
    if(source==='manual'){
      challenge.answerMode='manual';challenge.answerSource='';clearBoundHiding();
    }else if(source==='generated'){
      challenge.answerMode='bound';challenge.answerSource='';clearBoundHiding();
    }else{
      challenge.answerMode='bound';challenge.answerSource=source;challenge.answer=resolveAnswerSource(source);applyBoundHiding(source);
    }
    challenge.revealed=false;renderControls();draw();
  }
  function randomDimension(min=2,max=10){return min+Math.floor(Math.random()*(max-min+1))}
  function generateChallenge(type){
    const template=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!template)return;
    if(!beforeChallenge)beforeChallenge=snapshot();else restoreSnapshot(beforeChallenge);
    const data=arrayGenerate(type,{generationSettings,responseLines});
    data.challenge.generationSettings={...generationSettings};
    restoreSnapshot(data.diagram);challenge=CK?CK.normalise(data.challenge):data.challenge;
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';
    exportMode='challenge';responseLines=template.category==='reason'?3:type==='build-array'?2:1;exportStatus='';clearHistory();
    renderControls();draw();
  }
  function mutateDimensions(nextRows,nextCols){
    if(challengeFrozen())return;
    mutateBoard(()=>setDimensions(nextRows,nextCols));
  }
  function bindControls(){
    const controls=q('#gd-controls');if(!controls)return;
    qa('[data-ab-workflow]',controls).forEach(button=>button.onclick=()=>{
      const next=button.dataset.abWorkflow;
      controlTab=next==='challenge'?'challenge':next==='export'?'export':'explore';renderControls();
    });
    if(controlTab==='export'){
      qa('[data-ab-export-mode]',controls).forEach(button=>button.onclick=()=>{
        exportMode=button.dataset.abExportMode==='challenge'&&challenge?'challenge':'diagram';exportStatus='';renderControls();
      });
      const response=q('#ab-response-lines',controls);if(response)response.onchange=()=>{
        responseLines=clamp(Math.round(num(response.value,1)),1,4);renderControls();
      };
      const copyImage=q('#ab-copy-image',controls);if(copyImage)copyImage.onclick=()=>exportAction('copy');
      const png=q('#ab-png',controls);if(png)png.onclick=()=>exportAction('png');
      const svgDownload=q('#ab-svg-download',controls);if(svgDownload)svgDownload.onclick=()=>exportAction('svg');
      const print=q('#ab-print',controls);if(print)print.onclick=()=>exportAction('print');
      const kc=q('#ab-copy-key',controls),kp=q('#ab-print-key',controls);if(kc)kc.onclick=()=>exportAction('copy',true);if(kp)kp.onclick=()=>exportAction('print',true);
      return;
    }
    if(controlTab==='explore'){
      const undo=q('#ab-undo',controls);if(undo)undo.onclick=undoArray;
      const redo=q('#ab-redo',controls);if(redo)redo.onclick=redoArray;
      const r=q('#ab-r',controls),c=q('#ab-c',controls);
      if(r)r.oninput=()=>mutateDimensions(r.value,cols);
      if(c)c.oninput=()=>mutateDimensions(rows,c.value);
      const rowDown=q('#ab-row-down',controls);if(rowDown)rowDown.onclick=()=>mutateDimensions(rows-1,cols);
      const rowUp=q('#ab-row-up',controls);if(rowUp)rowUp.onclick=()=>mutateDimensions(rows+1,cols);
      const colDown=q('#ab-col-down',controls);if(colDown)colDown.onclick=()=>mutateDimensions(rows,cols-1);
      const colUp=q('#ab-col-up',controls);if(colUp)colUp.onclick=()=>mutateDimensions(rows,cols+1);
      const swap=q('#ab-swap',controls);if(swap)swap.onclick=()=>mutateBoard(()=>{
        const oldRows=rows,oldRowSplit=rowSplit;
        rows=cols;cols=oldRows;rowSplit=colSplit;colSplit=oldRowSplit;
      });
      const random=q('#ab-random',controls);if(random)random.onclick=()=>mutateBoard(()=>{
        rows=1+Math.floor(Math.random()*MAX);cols=1+Math.floor(Math.random()*MAX);rowSplit=0;colSplit=0;
      });
      const rs=q('#ab-row-split',controls);if(rs)rs.onchange=()=>mutateBoard(()=>{rowSplit=clamp(Math.round(num(rs.value,0)),0,Math.max(0,rows-1))});
      const cs=q('#ab-col-split',controls);if(cs)cs.onchange=()=>mutateBoard(()=>{colSplit=clamp(Math.round(num(cs.value,0)),0,Math.max(0,cols-1))});
      const clear=q('#ab-clear-splits',controls);if(clear)clear.onclick=()=>mutateBoard(()=>{rowSplit=0;colSplit=0});
      return;
    }
    qa('[data-ab-challenge-tab]',controls).forEach(button=>button.onclick=()=>{
      if(button.dataset.abChallengeTab==='custom')enterCustomChallenge();else{challengeTab='standard';renderControls()}
    });
    qa('[data-ab-challenge-cat]',controls).forEach(button=>button.onclick=()=>{
      challengeCategory=button.dataset.abChallengeCat;
      const first=CHALLENGE_TEMPLATES.find(t=>t.category===challengeCategory);if(first)challengeType=first.id;
      renderControls();
    });
    qa('[data-ab-challenge-type]',controls).forEach(button=>button.onclick=()=>{challengeType=button.dataset.abChallengeType;renderControls()});
    const min=q('#ab-gen-min',controls),max=q('#ab-gen-max',controls);
      if(min)min.onchange=()=>{generationSettings={min:+min.value,max:Math.max(+min.value+1,generationSettings.max)};renderControls()};
      if(max)max.onchange=()=>{generationSettings={...generationSettings,max:+max.value};renderControls()};
      const generate=q('#ab-generate',controls);if(generate)generate.onclick=()=>generateChallenge(challengeType);
    const edit=q('#ab-edit-challenge',controls);if(edit)edit.onclick=enterCustomChallenge;
    const end=q('#ab-clear-challenge',controls);if(end)end.onclick=clearChallenge;
    const reveal=q('#ab-reveal',controls);if(reveal)reveal.onclick=toggleModelReveal;
    qa('[data-gd-rich-action]',controls).forEach(button=>button.onclick=e=>{
      e.preventDefault();const editor=q('#ab-custom-prompt',controls);
      if(editor&&CK&&challenge){
        CK.applyFormat(editor,button.dataset.gdRichAction);
        challenge.promptHtml=CK.sanitiseRichHtml(editor.innerHTML);
        challenge.prompt=CK.plainText(challenge.promptHtml).slice(0,600);draw();
      }
    });
    const title=q('#ab-custom-title',controls);if(title)title.oninput=()=>{if(!challenge)return;challenge.title=title.value.slice(0,100);draw()};
    const prompt=q('#ab-custom-prompt',controls);if(prompt)prompt.oninput=()=>{
      if(!challenge||!CK)return;challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml).slice(0,600);draw();
    };
    const source=q('#ab-custom-answer-source',controls);if(source)source.onchange=()=>setCustomAnswerSource(source.value);
    const answer=q('#ab-custom-answer',controls);if(answer)answer.oninput=()=>{
      if(!challenge)return;challenge.answer=answer.value.slice(0,400);challenge.answerMode='manual';challenge.answerSource='';clearBoundHiding();
      if(challenge.revealed)draw();
    };
  }
  function startResize(kind,e){
    if(challengeFrozen()||(e.button!=null&&e.button!==0))return;
    e.preventDefault();
    const board=q('#ab-board');if(!board)return;
    const rect=board.getBoundingClientRect();
    drag={kind,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,startRows:rows,startCols:cols,cellW:rect.width/cols,cellH:rect.height/rows,before:snapshot(),remembered:false};
    document.addEventListener('pointermove',resizeMove);
    document.addEventListener('pointerup',resizeEnd,{once:true});
    document.addEventListener('pointercancel',resizeEnd,{once:true});
  }
  function resizeMove(e){
    if(!drag||e.pointerId!==drag.pointerId)return;
    e.preventDefault();
    let nextRows=drag.startRows,nextCols=drag.startCols;
    if(drag.kind==='cols')nextCols=clampDim(drag.startCols+Math.round((e.clientX-drag.startX)/Math.max(1,drag.cellW)));
    if(drag.kind==='rows')nextRows=clampDim(drag.startRows+Math.round((e.clientY-drag.startY)/Math.max(1,drag.cellH)));
    if(nextRows===rows&&nextCols===cols)return;
    setDimensions(nextRows,nextCols);
    if(!drag.remembered){rememberSnapshot(drag.before);drag.remembered=true}
    draw();
  }
  function resizeEnd(e){
    if(drag&&e.pointerId!=null&&e.pointerId!==drag.pointerId)return;
    const wasDragging=!!drag;drag=null;
    if(wasDragging)renderControls();
    document.removeEventListener('pointermove',resizeMove);
    document.removeEventListener('pointerup',resizeEnd);
    document.removeEventListener('pointercancel',resizeEnd);
  }
  function bindStage(){
    const frozen=challengeFrozen(),colHandle=q('[data-ab-resize="cols"]'),rowHandle=q('[data-ab-resize="rows"]');
    qa('[data-array-step]',q('#gd-stage')).forEach(button=>button.onclick=()=>{const [axis,delta]=button.dataset.arrayStep.split(':');mutateDimensions(rows+(axis==='rows'?Number(delta):0),cols+(axis==='cols'?Number(delta):0))});
    const undo=q('[data-ab-undo-stage]',q('#gd-stage'));if(undo)undo.onclick=e=>{e.stopPropagation();undoArray()};
    const redo=q('[data-ab-redo-stage]',q('#gd-stage'));if(redo)redo.onclick=e=>{e.stopPropagation();redoArray()};
    if(colHandle&&!frozen){
      colHandle.onpointerdown=e=>startResize('cols',e);
      colHandle.onkeydown=e=>{
        if(e.key==='ArrowLeft'){e.preventDefault();mutateDimensions(rows,cols-1)}
        else if(e.key==='ArrowRight'){e.preventDefault();mutateDimensions(rows,cols+1)}
      };
    }
    if(rowHandle&&!frozen){
      rowHandle.onpointerdown=e=>startResize('rows',e);
      rowHandle.onkeydown=e=>{
        if(e.key==='ArrowUp'){e.preventDefault();mutateDimensions(rows-1,cols)}
        else if(e.key==='ArrowDown'){e.preventDefault();mutateDimensions(rows+1,cols)}
      };
    }
  }
  function toggleModelReveal(){
    if(!challenge)return;
    challenge.revealed=!challenge.revealed;
    if(challenge.mode==='standard'&&challenge.type==='build-array'){
      if(challenge.revealed){challenge.modelBeforeReveal=snapshot();setDimensions(challenge.targetRows,challenge.targetCols)}
      else if(challenge.modelBeforeReveal){restoreSnapshot(challenge.modelBeforeReveal);delete challenge.modelBeforeReveal}
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
  function displayDimension(kind){
    return hiddenDimension(kind)?'?':String(kind==='rows'?rows:cols);
  }
  function equationText(){
    if(hiddenFlag('hiddenEquation'))return'?';
    const r=displayDimension('rows'),c=displayDimension('cols'),t=hiddenFlag('hiddenTotal')?'?':String(total());
    return r+' × '+c+' = '+t;
  }
  function draw(){
    normaliseSplits();updateChallengeAnswer();
    let cells='';
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const splitTop=rowSplit&&r===rowSplit,splitLeft=colSplit&&c===colSplit;
      cells+='<span class="gd-array-cell'+(splitTop?' is-row-split':'')+(splitLeft?' is-col-split':'')+'" data-ab-cell="'+r+'-'+c+'"><span class="gd-dot"></span></span>';
    }
    const focused=challenge?.mode==='standard'&&!challenge.revealed;
    const partial=partitionMath();
    const showMath=!focused;
    const mathsRows=[['Repeated addition','data-ab-repeated',hiddenFlag('hiddenRepeated'),repeatedAddition()],['Related division facts','data-ab-inverse',hiddenFlag('hiddenInverse'),inverseFacts()],...(partial?[['Partial products','data-ab-partial',hiddenFlag('hiddenPartial'),partial]]:[])].filter(row=>!row[2]);
    const rowDisplay=displayDimension('rows'),colDisplay=displayDimension('cols'),frozen=challengeFrozen();
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Array challenge',pupil:(challenge.type==='build-array'?CK.pupilSpec('model',{check:()=>rows===challenge.targetRows&&cols===challenge.targetCols}):challenge.type==='partial-products'?CK.pupilSpec('partials',{products:partitionParts().map(p=>p.value),total:total()}):CK.pupilSpec(challenge.type==='multiplication-fact'?'multiplication-equation':challenge.type==='commutative-fact'?'equation':'number')),actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'},{action:'end',label:'Back to setup'}]:[{action:'end',label:'End challenge'}]}):'';
    const targetStatus='';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-array-workbench'+(focused?' is-focused-challenge':'')+(frozen?' is-fixed-array':'')+'">'+
      (focused?'': '<div class="gd-array-summary"><strong data-ab-equation>'+equationText()+'</strong><span>'+rowDisplay+' row'+(rowDisplay==='1'?'':'s')+' of '+colDisplay+'</span></div>')+
      '<div class="gd-context-actions gd-array-history" aria-label="Array history"><button class="gd-btn" type="button" data-ab-undo-stage'+(historyDisabled()||!undoStack.length?' disabled':'')+'>Undo</button><button class="gd-btn" type="button" data-ab-redo-stage'+(historyDisabled()||!redoStack.length?' disabled':'')+'>Redo</button></div>'+
      (!frozen?'<div class="gd-array-touch-steps" role="group" aria-label="Change array size">'+['rows','cols'].map(axis=>'<div><button type="button" class="gd-btn" data-array-step="'+axis+':-1" aria-label="Fewer '+(axis==='rows'?'rows':'columns')+'"'+((axis==='rows'?rows:cols)<=1?' disabled':'')+'>−</button><span>'+(axis==='rows'?rows+' rows':cols+' columns')+'</span><button type="button" class="gd-btn" data-array-step="'+axis+':1" aria-label="More '+(axis==='rows'?'rows':'columns')+'"'+((axis==='rows'?rows:cols)>=MAX?' disabled':'')+'>+</button></div>').join('')+'</div>':'')+
      '<div class="gd-array-shell">'+
        '<div class="gd-array-board" id="ab-board" data-ab-rows="'+rows+'" data-ab-cols="'+cols+'" data-ab-row-split="'+rowSplit+'" data-ab-col-split="'+colSplit+'" data-ab-frozen="'+(frozen?'true':'false')+'" data-ab-target-rows="'+(challenge?.type==='build-array'?challenge.targetRows:'')+'" data-ab-target-cols="'+(challenge?.type==='build-array'?challenge.targetCols:'')+'" style="grid-template-columns:repeat('+cols+',var(--ab-cell));grid-template-rows:repeat('+rows+',var(--ab-cell))">'+cells+'</div>'+
        '<button class="gd-array-resize gd-array-resize--cols'+(frozen?' is-frozen':'')+'" type="button" data-ab-resize="cols"'+(frozen?' disabled':'')+' aria-label="'+(hiddenDimension('cols')?'Columns hidden for this challenge.':'Columns: '+cols+(frozen?'. Fixed for this challenge.':'. Drag left or right, or use arrow keys.'))+'"'+(hiddenDimension('cols')?'':' role="slider" aria-valuemin="1" aria-valuemax="'+MAX+'" aria-valuenow="'+cols+'"')+'><span>'+colDisplay+'</span><small>columns'+(frozen?'':' ↔')+'</small></button>'+
        '<button class="gd-array-resize gd-array-resize--rows'+(frozen?' is-frozen':'')+'" type="button" data-ab-resize="rows"'+(frozen?' disabled':'')+' aria-label="'+(hiddenDimension('rows')?'Rows hidden for this challenge.':'Rows: '+rows+(frozen?'. Fixed for this challenge.':'. Drag up or down, or use arrow keys.'))+'"'+(hiddenDimension('rows')?'':' role="slider" aria-valuemin="1" aria-valuemax="'+MAX+'" aria-valuenow="'+rows+'"')+'><span>'+rowDisplay+'</span><small>rows'+(frozen?'':' ↕')+'</small></button>'+
      '</div>'+
      (showMath&&mathsRows.length?'<div class="gd-array-maths">'+mathsRows.map(([label,attr,hidden,value])=>'<div class="gd-readout'+(attr==='data-ab-partial'?' gd-array-partial':'')+'"><span>'+label+'</span><strong '+attr+'>'+value+'</strong></div>').join('')+'</div>':'')+targetStatus+
    '</div>';
    bindStage();bindChallengeStageActions();
  }
  setPanels(controlsHtml(),'');
  bindControls();
  draw();
  G.lessonState?.register('array-builder',()=>({diagram:snapshot(),challenge,beforeChallenge,generationSettings:{...generationSettings},pupil:CK?.capturePupil?.(challenge),controlTab,challengeTab,challengeCategory,challengeType,exportMode,responseLines}),saved=>{
    restoreSnapshot(saved.diagram);const cfg=arraySettings(saved);generationSettings={min:cfg.min,max:cfg.max};challenge=saved.challenge?CK.normalise(saved.challenge):null;beforeChallenge=saved.beforeChallenge||null;
    if(Object.prototype.hasOwnProperty.call(saved,'controlTab'))controlTab=saved.controlTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeTab'))challengeTab=saved.challengeTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeCategory'))challengeCategory=saved.challengeCategory;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeType'))challengeType=saved.challengeType;
    if(Object.prototype.hasOwnProperty.call(saved,'exportMode'))exportMode=saved.exportMode;
    if(Object.prototype.hasOwnProperty.call(saved,'responseLines'))responseLines=saved.responseLines;
    CK?.restorePupil?.(challenge,saved.pupil);renderControls();draw();
  });

}

  const CLOCK_TEMPLATES=[
    {id:'read-five',category:'read',title:'Read to 5 minutes',desc:'Read an analogue time shown to a 5-minute interval.'},
    {id:'read-minute',category:'read',title:'Read to 1 minute',desc:'Read an analogue time to the nearest minute.'},
    {id:'roman-read',category:'read',title:'Roman numeral clock',desc:'Read a time from a clock labelled I–XII.'},
    {id:'set-five',category:'set',title:'Set a 5-minute time',desc:'Move the hands to a requested 5-minute time.'},
    {id:'set-minute',category:'set',title:'Set an exact minute',desc:'Move the hands to an exact minute time.'},
    {id:'elapsed-forward',category:'set',title:'Move time forward',desc:'Advance the analogue clock by a stated duration.'},
    {id:'twelve-to-twentyfour',category:'convert',title:'12-hour to 24-hour',desc:'Convert a shown am/pm time to 24-hour notation.'},
    {id:'twentyfour-to-twelve',category:'convert',title:'24-hour to 12-hour',desc:'Convert a 24-hour time to 12-hour am/pm notation.'},
    {id:'time-language',category:'reason',title:'Say the time',desc:'Write an analogue time using past/to language.'},
    {id:'hour-hand-misconception',category:'reason',title:'Where should the hour hand be?',desc:'Diagnose the common idea that the hour hand stays on the hour number.'},
    {id:'two-elapsed',category:'two-clocks',title:'Elapsed time',desc:'Calculate minutes between a start and a finish.'},
    {id:'two-order',category:'two-clocks',title:'Which is earlier?',desc:'Compare two analogue times with AM/PM evidence.'},
    {id:'two-duration-reason',category:'two-clocks',title:'Check a duration',desc:'Decide whether a stated duration is correct.'},
    {id:'two-midnight',category:'two-clocks',title:'Across midnight',desc:'Calculate elapsed time across two labelled days.'}
  ];

const CLOCK_ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
function clockPublicationSettings(model={}){
 const d=model.diagram||model;
 const count=Number(model.clockCount)||1+(Array.isArray(d.extraClocks)?d.extraClocks.length:0);
 return {clockCount:Math.max(1,Math.min(4,Math.round(count))),clockLayout:(model.clockLayout||d.clockLayout)==='vertical'?'vertical':'horizontal',responseLines:Math.max(1,Math.min(4,Math.round(Number(model.responseLines)||1)))};
}
function clockPublicationTypes(model){const m=clockPublicationSettings(model);return CLOCK_TEMPLATES.filter(t=>t.category!=='two-clocks'||m.clockCount>=2).map(t=>({id:t.id,label:t.title}))}
function clockGenerate(type,settings={},rng=Math.random){
 const template=CLOCK_TEMPLATES.find(t=>t.id===type);if(!template)throw Error('Unknown clock challenge.');
 const cfg=clockPublicationSettings(settings);
 if(template.category==='two-clocks'&&cfg.clockCount<2)throw Error('Add a second clock to enable comparison tasks.');
 let hour=10,minute=10,second=0,snap=5,numerals='arabic',challenge=null;
 const extraClocks=Array.from({length:cfg.clockCount-1},()=>({hour:10,minute:10,second:0})),previousLayout=cfg.clockLayout;
 function mod(v,n){return ((v%n)+n)%n}
 function normaliseClockTime(h,m){const t=mod(h*60+m,1440);return {hour:Math.floor(t/60),minute:t%60}}
 function durationText(total){const h=Math.floor(total/60),m=total%60;return !h?m+' min':!m?h+' h':h+' h '+m+' min'}
 function challengeObject(type,prompt,answer,extra={}){return {mode:'standard',type,category:template.category,title:'',prompt,promptHtml:prompt,answer:String(answer),answerMode:'manual',answerSource:'',revealed:false,freezeHands:true,hiddenReadouts:['24','12'],targetHour:null,targetMinute:null,startHour:null,startMinute:null,...extra}}
  function h12(){return hour%12||12}
  function pad(value){return String(value).padStart(2,'0')}
  function format24(h,m){return pad(h)+':'+pad(m)}
  function time24(){return format24(hour,minute)}
  function format12(h,m){return(h%12||12)+':'+pad(m)+' '+(h<12?'am':'pm')}
      function time12(){return format12(hour,minute)}
  function nextH12(){return(hour+1)%12||12}
  function spokenTime(){
    if(minute===0)return h12()+" o'clock";
    if(minute===15)return'quarter past '+h12();
    if(minute===30)return'half past '+h12();
    if(minute===45)return'quarter to '+nextH12();
    if(minute<30)return minute+' minute'+(minute===1?'':'s')+' past '+h12();
    const left=60-minute;
    return left+' minute'+(left===1?'':'s')+' to '+nextH12();
  }
  function randomHour(){return Math.floor(rng()*24)}
  function randomMinute(step=5){return Math.floor(rng()*(60/step))*step}
  function differentStart(targetHour,targetMinute,step){
    const delta=[15,20,25,30,35,40,45,50,55,60][Math.floor(rng()*10)];
    const startTotal=mod(targetHour*60+targetMinute-delta,24*60);
    return{hour:Math.floor(startTotal/60),minute:Math.floor(startTotal%60/step)*step};
  }
    numerals='arabic';snap=5;second=0;
    if(template.category==='two-clocks'){
      
      const pick=arr=>arr[Math.floor(rng()*arr.length)];
      let start=pick([8,9,10,11,13,14,15,16,17])*60+randomMinute(5);
      let elapsed=pick([15,20,25,35,40,45,50,55,65,75,85,90,105,120,135,150]);
      if(type==='two-midnight'){start=23*60+pick([15,20,25,30,35,40,45,50,55]);elapsed=pick([60,65,75,90,105,120,135])}
      const finish=start+elapsed,asState=(t,label)=>({...normaliseClockTime(0,t),second:0,label});
      let evidence=[asState(start,type==='two-midnight'?'Start · Day 1':'Start'),asState(finish,type==='two-midnight'?'Finish · Day 2':'Finish')];
      let prompt='How many minutes elapse from Start to Finish?',answer=String(elapsed);
      let explanation=format24(evidence[0].hour,evidence[0].minute)+' → '+format24(evidence[1].hour,evidence[1].minute)+' = '+durationText(elapsed)+' ('+elapsed+' minutes).';
      if(type==='two-midnight'){prompt='The journey starts on Day 1 and finishes on Day 2. How many minutes does it take?';explanation=(1440-start)+' minutes to midnight + '+(finish-1440)+' minutes after midnight = '+elapsed+' minutes.'}
      if(type==='two-order'){
        if(rng()<.5)evidence.reverse();
        evidence=evidence.map((v,i)=>({...v,label:'Clock '+(i===0?'A':'B')}));
        const earlier=evidence[0].hour*60+evidence[0].minute<evidence[1].hour*60+evidence[1].minute?0:1;
        prompt='Which clock shows the earlier time on the same day?';answer=evidence[earlier].label;
        explanation=format12(evidence[earlier].hour,evidence[earlier].minute)+' is earlier than '+format12(evidence[1-earlier].hour,evidence[1-earlier].minute)+'.';
      }else if(type==='two-duration-reason'){
        const claim=rng()<.5?elapsed:elapsed+pick([-10,-5,5,10,15]);
        prompt='A pupil says that '+claim+' minutes elapse from Start to Finish. Are they correct?';
        answer=claim===elapsed?'Yes':'No';explanation='The actual elapsed time is '+durationText(elapsed)+' ('+elapsed+' minutes).';
      }
      hour=evidence[0].hour;minute=evidence[0].minute;extraClocks[0]={hour:evidence[1].hour,minute:evidence[1].minute,second:0};
      challenge=challengeObject(type,prompt,answer,{clockEvidence:evidence,clockLayout:previousLayout||'horizontal',solutionExplanation:explanation});
    }else if(type==='read-five'){
      hour=randomHour();minute=randomMinute(5);
      challenge=challengeObject(type,'What time is shown on the analogue clock? (No AM or PM needed.)',time12());
    }else if(type==='read-minute'){
      hour=randomHour();minute=randomMinute(1);snap=1;
      challenge=challengeObject(type,'Read the analogue clock to the nearest minute. (No AM or PM needed.)',time12());
    }else if(type==='roman-read'){
      hour=randomHour();minute=randomMinute(5);numerals='roman';
      challenge=challengeObject(type,'What time is shown on the Roman-numeral clock? (No AM or PM needed.)',time12());
    }else if(type==='set-five'||type==='set-minute'){
      const step=type==='set-minute'?1:5,targetHour=randomHour(),targetMinute=randomMinute(step),start=differentStart(targetHour,targetMinute,step);
      hour=start.hour;minute=start.minute;snap=step;
      const targetText=format12(targetHour,targetMinute);
      challenge=challengeObject(type,'Move the hands to '+targetText+'.',targetText,{
        freezeHands:false,targetHour,targetMinute,hiddenReadouts:['24','12']
      });
    }else if(type==='elapsed-forward'){
      hour=randomHour();minute=randomMinute(5);snap=5;
      const startHour=hour,startMinute=minute,start24=time24(),durations=[15,20,25,30,35,40,45,50,60,75,90],duration=durations[Math.floor(rng()*durations.length)];
      const targetTotal=mod(hour*60+minute+duration,24*60),targetHour=Math.floor(targetTotal/60),targetMinute=targetTotal%60;
      challenge=challengeObject(type,'The clock starts at '+start24+'. Move it forward by '+duration+' minutes.',pad(targetHour)+':'+pad(targetMinute),{
        freezeHands:false,targetHour,targetMinute,startHour,startMinute,hiddenReadouts:['24','12']
      });
    }else if(type==='twelve-to-twentyfour'){
      hour=randomHour();minute=randomMinute(5);
      challenge=challengeObject(type,'Write '+time12()+' in 24-hour notation.',time24(),{hiddenReadouts:['24']});
    }else if(type==='twentyfour-to-twelve'){
      hour=randomHour();minute=randomMinute(5);
      challenge=challengeObject(type,'Write '+time24()+' in 12-hour am/pm notation.',time12(),{hiddenReadouts:['12']});
    }else if(type==='time-language'){
      hour=randomHour();minute=[0,5,10,15,20,25,30,35,40,45,50,55][Math.floor(rng()*12)];
      challenge=challengeObject(type,'Write the time using past / to language.',spokenTime());
    }else{
      hour=1+Math.floor(rng()*12);minute=30;const valid=rng()<.5;
      challenge=challengeObject(type,'A pupil says that at half past '+h12()+' the hour hand should point '+(valid?'halfway between '+h12()+' and '+nextH12():'exactly at '+h12())+'. Are they correct?',(valid?'Yes. ':'No. ')+'At half past '+h12()+', the hour hand is halfway between '+h12()+' and '+nextH12()+'.');
    }

 return {type,settings:cfg,diagram:{hour,minute,second,snap,numerals,extraClocks},challenge};
}
function clockPaper(data,teacher=false){
 const d=data.diagram||{},c=data.challenge,task=!!c,comparison=Array.isArray(c?.clockEvidence),drawTask=c?.type==='set-five'||c?.type==='set-minute',elapsed=c?.type==='elapsed-forward';
 const states=comparison?c.clockEvidence:task?[elapsed?{hour:c.startHour,minute:c.startMinute,second:0}:drawTask&&teacher?{hour:c.targetHour,minute:c.targetMinute,second:0}:d]:[d,...(d.extraClocks||[])];
 const count=states.length,cols=count===1?1:(comparison?c.clockLayout:d.clockLayout)==='vertical'?1:(d.clockLayout==='horizontal'&&!comparison?count:2),rows=Math.ceil(count/cols),cell=310,W=cols*cell,H=rows*(task?304:354);
 function el(name,attrs={},text){const n=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=String(text);return n}
 const svg=el('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':task?'Clock task diagram':'Clock illustration'});
 const add=(name,attrs,text)=>svg.appendChild(el(name,attrs,text));
 const pad=v=>String(v).padStart(2,'0'),time24=(h,m)=>pad(h)+':'+pad(m),time12=(h,m)=>(h%12||12)+':'+pad(m)+' '+(h<12?'am':'pm');
 function text(x,y,value,size=15,weight=700){add('text',{x,y,'font-family':'Arial,sans-serif','text-anchor':'middle','font-size':size,'font-weight':weight,fill:'#334a52'},value)}
 add('rect',{width:W,height:H,fill:'#fff'});
 states.forEach((v,i)=>{
   const x=i%cols*cell+cell/2,y=Math.floor(i/cols)*(task?304:354),cx=x,cy=y+147,r=120,blank=drawTask&&!teacher;
   const label=comparison?v.label:!task&&count>1?(d.clockNames?.[i]||'Clock '+String.fromCharCode(65+i)):'';
   if(label)text(cx,y+15,label,14);
   add('circle',{cx,cy,r,fill:'#fff',stroke:'#43555c','stroke-width':3});
   for(let j=0;j<60;j++){const a=(j*6-90)*Math.PI/180,inner=r-(j%5?9:17),outer=r-4;add('line',{x1:cx+inner*Math.cos(a),y1:cy+inner*Math.sin(a),x2:cx+outer*Math.cos(a),y2:cy+outer*Math.sin(a),stroke:'#43555c','stroke-width':j%5?1:2.2})}
   for(let j=1;j<=12;j++){const a=(j*30-90)*Math.PI/180;add('text',{x:cx+(r-33)*Math.cos(a),y:cy+(r-33)*Math.sin(a),'text-anchor':'middle','dominant-baseline':'middle','font-family':'Arial,sans-serif','font-size':16,'font-weight':750,fill:'#334a52'},d.numerals==='roman'?CLOCK_ROMAN[j-1]:j)}
   if(!blank){const hands=[[(v.hour%12+v.minute/60)*30,61,7,'#24343b'],[v.minute*6,86,5,'#147d75']];if(!task&&d.showSeconds)hands.push([(v.second||0)*6,93,2,'#b45b41']);for(const [angle,len,width,stroke] of hands){const a=(angle-90)*Math.PI/180;add('line',{x1:cx,y1:cy,x2:cx+len*Math.cos(a),y2:cy+len*Math.sin(a),stroke,'stroke-width':width,'stroke-linecap':'round'})}}
   add('circle',{cx,cy,r:4,fill:blank?'#fff':'#43555c',stroke:'#43555c'});
   if(comparison)text(cx,y+288,v.hour<12?'AM':'PM',18);
   else if(!task&&d.showDigital!==false){const sec=d.showSeconds?':'+pad(v.second||0):'';text(cx,y+288,time24(v.hour,v.minute)+sec,20);text(cx,y+311,(v.hour%12||12)+':'+pad(v.minute)+sec+' '+(v.hour<12?'am':'pm'),16)}
   if(!task&&i>0){const minutes=((v.hour*60+v.minute-d.hour*60-d.minute)%1440+1440)%1440;text(cx,y+335,'Forward from first: '+Math.floor(minutes/60)+' h '+minutes%60+' min',12)}
 });
 if(!task)return svg;
 const meta=CLOCK_TEMPLATES.find(t=>t.id===c.type);
 const readFace=['read-five','read-minute','roman-read'].includes(c.type);
 const prompt=drawTask?'Draw the clock hands to show '+c.answer+'.':elapsed?c.prompt.replace('Move it forward by','What time will it show after').replace(/ minutes\.$/,' minutes?'):c.prompt;
 const answer=(readFace?c.answer.replace(/ (am|pm)$/i,''):c.answer)+(c.solutionExplanation?' — '+c.solutionExplanation:'');
 return G.exportTools.composeWorksheetCardSvg(svg,{title:meta?.title||'Clock challenge',prompt,responseMode:drawTask?'none':c.category==='reason'||c.type==='two-duration-reason'||data.settings?.responseLines>1?'lines':'box',responseLabel:drawTask?'Correct hands':c.category==='reason'||c.type==='two-duration-reason'?'Answer and explain':'Answer',responseLines:Math.max(1,data.settings?.responseLines||1,c.category==='reason'||c.type==='two-duration-reason'?3:1),paperStyle:'plain',answer,showAnswer:teacher,diagramMaxHeight:comparison&&cols===1?800:420});
}
function clockPublicationData(model){
 const settings=clockPublicationSettings(model),diagram=JSON.parse(JSON.stringify(model.diagram||model)),c=model.challenge;
 if(c?.mode==='custom')throw Error('Use individual export for custom clock tasks.');
 if(!c)return {settings,diagram};
 return {type:c.type,settings,diagram,challenge:{...c,revealed:false}};
}
function clockSignature(d){
 const c=d.challenge,v=d.diagram,face=['read-five','read-minute','roman-read','time-language'].includes(c.type);
 return JSON.stringify([c.type,c.prompt,face?[v.hour%12,v.minute]:c.clockEvidence||[c.startHour,c.startMinute,c.targetHour,c.targetMinute],face?null:c.answer]);
}
G.clockPaperModel={generate:clockGenerate,render:clockPaper,types:clockPublicationTypes,settings:clockPublicationSettings};
if(G.publishing)G.publishing.register('clock',{
 label:'Clock & time',types:clockPublicationTypes,title:item=>item.kind==='diagram'?'Clock illustration':CLOCK_TEMPLATES.find(t=>t.id===item.data.type)?.title||'Clock challenge',
 signature:clockSignature,recipe:(model,type)=>({type,settings:clockPublicationSettings(model)}),
 generate(recipe,rng){const ids=clockPublicationTypes(recipe.settings).map(t=>t.id),type=recipe.type==='all'?ids[Math.floor(rng()*ids.length)]:recipe.type;return clockGenerate(type,recipe.settings,rng)},
 capture(model){const data=clockPublicationData(model);if(!data.challenge)return [G.publishing.record('clock','diagram',data)];return [G.publishing.record('clock','challenge',data,{type:data.type,settings:data.settings})]},
 render(item,teacher){return clockPaper(item.data,teacher)}
});

function clockTool(){
  const CK=G.challengeKit,X=G.exportTools;
  const clockParams=new URLSearchParams(location.search),boardObjectId=clockParams.get('boardObject');
  const MAX_CLOCKS=4;
  function clockLetter(index){
    let value=Math.max(0,Math.round(num(index,0))),out='';
    do{out=String.fromCharCode(65+(value%26))+out;value=Math.floor(value/26)-1}while(value>=0);
    return out;
  }
  const initialClockSlot=Math.max(0,Math.round(num(clockParams.get('clockStart'),0)));
  let hour=10,minute=10,second=0,snap=5,numerals='arabic',showDigital=true,showSeconds=false,drag=null,extraClocks=[],activeClock=0;
  let clockLayout='auto';
  let clockSlots=[initialClockSlot],clockNames=['Clock '+clockLetter(initialClockSlot),'','',''];
  const roman=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
  const CHALLENGE_CATEGORIES=[
    {id:'read',label:'Read the clock'},
    {id:'set',label:'Set & elapsed time'},
    {id:'convert',label:'12 / 24 hour'},
    {id:'reason',label:'Reasoning'},
    {id:'two-clocks',label:'Compare two clocks'}
  ];
  const CHALLENGE_TEMPLATES=CLOCK_TEMPLATES;
  let controlTab='explore',challengeTab='standard',challengeCategory='read',challengeType='read-five',challenge=null,beforeChallenge=null;
  let exportMode='diagram',responseLines=1,exportStatus='';

  function mod(value,n){return((value%n)+n)%n}
  function boardClockApi(){
    try{return window.parent!==window?window.parent.TT99Goodies?.compositionBoard:null}catch(_){return null}
  }
  function clockSlot(index){
    const value=Math.round(Number(clockSlots[index]));
    return Number.isInteger(value)&&value>=0?value:index;
  }
  function allocateClockSlot(){
    const api=boardClockApi();
    if(api&&boardObjectId&&typeof api.allocateClockSlot==='function'){
      const value=Math.round(Number(api.allocateClockSlot(boardObjectId)));
      if(Number.isInteger(value)&&value>=0)return value;
    }
    return Math.max(-1,...clockSlots.map(x=>Math.round(Number(x))).filter(x=>Number.isInteger(x)&&x>=0))+1;
  }
  function releaseClockSlot(slot){
    const api=boardClockApi();
    if(api&&boardObjectId&&typeof api.releaseClockSlot==='function')api.releaseClockSlot(boardObjectId,slot);
  }
  function normaliseClockTime(nextHour,nextMinute,fallbackHour=hour,fallbackMinute=minute){
    let total=Math.round(num(nextHour,fallbackHour))*60+Math.round(num(nextMinute,fallbackMinute));
    total=mod(total,24*60);
    return{hour:Math.floor(total/60),minute:total%60};
  }
  function setTime(nextHour,nextMinute){
    const next=normaliseClockTime(nextHour,nextMinute);
    hour=next.hour;minute=next.minute;
  }
  function clockState(index=0){
    if(index===0)return{hour,minute,second};
    const item=extraClocks[index-1]||{hour,minute,second};
    return{hour:item.hour,minute:item.minute,second:clamp(Math.round(num(item.second,0)),0,59)};
  }
  function clockStates(){return[{hour,minute,second},...extraClocks.map(c=>({hour:c.hour,minute:c.minute,second:clamp(Math.round(num(c.second,0)),0,59)}))]}
  function setClockTime(index,nextHour,nextMinute){
    const current=clockState(index),next=normaliseClockTime(nextHour,nextMinute,current.hour,current.minute);
    if(index===0){hour=next.hour;minute=next.minute}
    else if(extraClocks[index-1])extraClocks[index-1]={...extraClocks[index-1],...next};
  }
  function setClockSecond(index,value){
    const next=clamp(Math.round(num(value,0)),0,59);
    if(index===0)second=next;
    else if(extraClocks[index-1])extraClocks[index-1]={...extraClocks[index-1],second:next};
  }
  function clockLabel(index){
    const fallback='Clock '+clockLetter(clockSlot(index)),value=String(clockNames[index]||'').trim();
    return value||fallback;
  }
  function forwardDifferenceMinutes(from,to){
    return mod((to.hour*60+to.minute)-(from.hour*60+from.minute),24*60);
  }
  function durationText(total){
    const h=Math.floor(total/60),m=total%60;
    if(!h)return m+' min';
    if(!m)return h+' h';
    return h+' h '+m+' min';
  }
  function h12(){return hour%12||12}
  function pad(value){return String(value).padStart(2,'0')}
  function format24(h,m){return pad(h)+':'+pad(m)}
  function time24(){return format24(hour,minute)}
  function format12(h,m){return(h%12||12)+':'+pad(m)+' '+(h<12?'am':'pm')}
  function format24Digital(h,m,sec=0){return format24(h,m)+(showSeconds?':'+pad(sec):'')}
  function format12Digital(h,m,sec=0){return(h%12||12)+':'+pad(m)+(showSeconds?':'+pad(sec):'')+' '+(h<12?'am':'pm')}
  function time12(){return format12(hour,minute)}
  function nextH12(){return(hour+1)%12||12}
  function spokenTime(){
    if(minute===0)return h12()+" o'clock";
    if(minute===15)return'quarter past '+h12();
    if(minute===30)return'half past '+h12();
    if(minute===45)return'quarter to '+nextH12();
    if(minute<30)return minute+' minute'+(minute===1?'':'s')+' past '+h12();
    const left=60-minute;
    return left+' minute'+(left===1?'':'s')+' to '+nextH12();
  }
  function hourAngle(){return((hour%12)+minute/60)*30}
  function minuteAngle(){return minute*6}
  function handPoint(angle,len){
    const a=(angle-90)*Math.PI/180;
    return{x:150+len*Math.cos(a),y:150+len*Math.sin(a)};
  }
  function faceNumber(n){return numerals==='roman'?roman[n-1]:String(n)}
  function snapshot(){return{hour,minute,second,snap,numerals,showDigital,showSeconds,clockLayout,clockSlots:clockSlots.slice(),clockNames:clockNames.slice(),extraClocks:extraClocks.map(c=>({hour:c.hour,minute:c.minute,second:clamp(Math.round(num(c.second,0)),0,59)})),activeClock}}
  function restoreSnapshot(value){
    if(!value)return;
    hour=clamp(Math.round(num(value.hour,10)),0,23);
    minute=clamp(Math.round(num(value.minute,10)),0,59);
    second=clamp(Math.round(num(value.second,0)),0,59);
    snap=Number(value.snap)===1?1:5;
    numerals=value.numerals==='roman'?'roman':'arabic';
    showDigital=value.showDigital!==false;
    showSeconds=!!value.showSeconds;
    clockLayout=['horizontal','vertical','grid'].includes(value.clockLayout)?value.clockLayout:'auto';
    extraClocks=Array.isArray(value.extraClocks)?value.extraClocks.slice(0,MAX_CLOCKS-1).map(c=>({...normaliseClockTime(c?.hour,c?.minute,10,10),second:clamp(Math.round(num(c?.second,0)),0,59)})):[];
    const count=1+extraClocks.length,storedSlots=Array.isArray(value.clockSlots)?value.clockSlots:[];
    clockSlots=Array.from({length:count},(_,i)=>{
      const slot=Math.round(Number(storedSlots[i]));return Number.isInteger(slot)&&slot>=0?slot:initialClockSlot+i;
    });
    clockNames=Array.from({length:MAX_CLOCKS},(_,i)=>String(Array.isArray(value.clockNames)?value.clockNames[i]||'':'').trim()||(i<count?'Clock '+clockLetter(clockSlot(i)):''));
    activeClock=clamp(Math.round(num(value.activeClock,0)),0,extraClocks.length);
    drag=null;
  }
  function tickMarkup(){
    let out='';
    for(let i=0;i<60;i++){
      const a=(i*6-90)*Math.PI/180,major=i%5===0;
      const r1=major?119:125,r2=132;
      out+='<line class="gd-clock-tick'+(major?' is-hour':'')+'" x1="'+(150+r1*Math.cos(a))+'" y1="'+(150+r1*Math.sin(a))+'" x2="'+(150+r2*Math.cos(a))+'" y2="'+(150+r2*Math.sin(a))+'"></line>';
    }
    return out;
  }
  function numeralMarkup(){
    return Array.from({length:12},(_,i)=>{
      const n=i+1,a=(n*30-90)*Math.PI/180,x=150+102*Math.cos(a),y=150+102*Math.sin(a);
      return '<text class="gd-clock-num" x="'+x+'" y="'+y+'">'+faceNumber(n)+'</text>';
    }).join('');
  }
  function hiddenReadout(kind){
    return !!(challenge&&!challenge.revealed&&Array.isArray(challenge.hiddenReadouts)&&challenge.hiddenReadouts.includes(kind));
  }
  function anyTimeHidden(){
    return !!(challenge&&!challenge.revealed&&Array.isArray(challenge.hiddenReadouts)&&challenge.hiddenReadouts.length);
  }
  function twoClockTask(){return challenge?.mode==='standard'&&challenge.category==='two-clocks'&&Array.isArray(challenge.clockEvidence)}
  function availableClockTemplates(){return CHALLENGE_TEMPLATES.filter(t=>t.category!=='two-clocks'||extraClocks.length>0)}
  function visibleClockCount(){return twoClockTask()?2:challenge?1:1+extraClocks.length}
  function resolvedClockLayout(count=visibleClockCount()){
    const preference=twoClockTask()?(challenge.clockLayout||'horizontal'):clockLayout;
    if(count<2)return 'vertical';
    if(preference==='vertical')return 'vertical';
    if(preference==='horizontal'||count===2)return 'horizontal';
    return 'grid';
  }
  function setClockLayout(next){
    if(!['horizontal','vertical','grid','auto'].includes(next))return;
    if(twoClockTask())challenge.clockLayout=next==='vertical'?'vertical':'horizontal';else clockLayout=next;
    draw();
    const select=q('#cl-layout');if(select)select.value=clockLayout;
  }
  function cycleClockLayout(){
    const count=visibleClockCount();if(count<2)return;
    const modes=count>2?['horizontal','vertical','grid']:['horizontal','vertical'];
    setClockLayout(modes[(modes.indexOf(resolvedClockLayout(count))+1)%modes.length]);
  }
  function layoutButton(){
    const count=visibleClockCount();if(count<2)return '';
    const current=resolvedClockLayout(count),glyph={horizontal:'↔',vertical:'↕',grid:'▦'}[current];
    return '<div class="gd-clock-layout-toolbar"><button type="button" class="gd-btn gd-clock-layout-cycle" data-cl-layout-cycle aria-label="Clock layout: '+current+'. Tap to change layout" title="Clock layout: '+current+'. Tap to change layout">'+glyph+'</button></div>';
  }
  function visibleClockLabel(index){return twoClockTask()?challenge.clockEvidence[index].label:clockLabel(index)}
  function periodLabel(state){return state.hour<12?'AM':'PM'}
  function handsFrozen(){return !!(challenge&&challenge.mode==='standard'&&(challenge.freezeHands||challenge.revealed))}
  function challengeObject(type,prompt,answer,extra={}){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);
    const raw={
      mode:'standard',type,category:meta?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),
      answerMode:'manual',answerSource:'',revealed:false,freezeHands:true,hiddenReadouts:['24','12'],
      targetHour:null,targetMinute:null,startHour:null,startMinute:null,...extra
    };
    return CK?CK.normalise(raw):raw;
  }
  function resolveAnswerSource(source){
    if(source==='time24')return time24();
    if(source==='time12')return time12();
    if(source==='spoken')return spokenTime();
    if(source==='hour24')return String(hour);
    if(source==='hour12')return String(h12());
    if(source==='minute')return String(minute);
    if(source==='period')return hour<12?'am':'pm';
    return'';
  }
  function customAnswerSources(){
    return[
      {id:'time24',label:'Current time — 24-hour'},
      {id:'time12',label:'Current time — 12-hour'},
      {id:'spoken',label:'Current time — past / to language'},
      {id:'hour24',label:'Hour — 24-hour value'},
      {id:'hour12',label:'Hour — 12-hour value'},
      {id:'minute',label:'Minute value'},
      {id:'period',label:'am / pm'}
    ];
  }
  function clearBoundHiding(){if(challenge)challenge.hiddenReadouts=[]}
  function applyBoundHiding(){if(challenge)challenge.hiddenReadouts=['24','12']}
  function updateChallengeAnswer(){
    if(!challenge||challenge.answerMode!=='bound'||!challenge.answerSource)return;
    const answer=resolveAnswerSource(challenge.answerSource);if(answer!=='')challenge.answer=answer;
    const live=q('#cl-custom-live-answer');if(live)live.textContent=challenge.answer||'—';
    if(challenge.revealed){
      const shown=q('.gd-challenge-actions em',q('#gd-stage'));
      if(shown)shown.textContent='Answer: '+challenge.answer;
    }
  }
  function onTarget(){
    return !!(challenge&&!challenge.freezeHands&&Number.isFinite(Number(challenge.targetHour))&&Number.isFinite(Number(challenge.targetMinute))&&hour===Number(challenge.targetHour)&&minute===Number(challenge.targetMinute));
  }
  function controlsHtml(){
    return workflowTabs()+(controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():exploreControlsHtml());
  }
  function workflowTabs(){
    return '<div class="gd-row gd-cl-workflow-tabs" role="tablist" aria-label="Clock workflow">'+
      '<button class="gd-btn'+(controlTab==='explore'?' gd-btn--primary':'')+'" type="button" data-cl-workflow="explore">Explore</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-cl-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-cl-workflow="export">Export / reuse</button></div>';
  }

  function exportControlsHtml(){
    const canCard=!!challenge;
    if(!canCard&&exportMode==='challenge')exportMode='diagram';
    return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export a clean vector clock or a pupil-ready challenge card.</span></div></div>'+
      (canCard?'<div class="nl-export-mode cl-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-cl-export-mode="challenge">Challenge card</button>'+
        '<button type="button" class="'+(exportMode==='diagram'?'is-active':'')+'" data-cl-export-mode="diagram">Clock only</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="cl-response-lines">'+
          [1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+
          '</select></label><p class="gd-help">The pupil card keeps hidden time representations hidden even if you revealed them on screen.</p>'
        :'<p class="gd-help">Clock-only export contains the current face, hands and visible readouts without editing controls.</p>')+
      '<div class="nl-export-grid cl-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="cl-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'challenge':'image')+'</button>'+
        '<button class="gd-btn" id="cl-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="cl-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="cl-print" type="button">Print / PDF</button>'+
      '</div>'+(challenge?.mode==='standard'&&exportMode==='challenge'?'<div class="nl-export-grid cl-export-grid"><button class="gd-btn" id="cl-copy-key" type="button">Copy teacher key</button><button class="gd-btn" id="cl-print-key" type="button">Print teacher key</button></div>':'')+'<p class="gd-help" id="cl-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }
  function clSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function exportReadoutHidden(kind,pupil=false){
    if(!challenge)return false;
    if(pupil)return Array.isArray(challenge.hiddenReadouts)&&challenge.hiddenReadouts.includes(kind);
    return hiddenReadout(kind);
  }
  function exportClockState(pupil=false){
    let h=hour,m=minute,blankHands=false,source='current';
    if(pupil&&challenge?.mode==='standard'&&(challenge.type==='set-five'||challenge.type==='set-minute')){
      blankHands=true;source='set-blank';
    }else if(pupil&&challenge?.mode==='standard'&&challenge.type==='elapsed-forward'&&Number.isFinite(Number(challenge.startHour))&&Number.isFinite(Number(challenge.startMinute))){
      h=Number(challenge.startHour);m=Number(challenge.startMinute);source='elapsed-start';
    }
    return{hour:h,minute:m,blankHands,source};
  }
  function clockExportSvg({pupil=false}={}){
    if(twoClockTask())return multiClockExportSvg({pupil});
    if(!pupil&&!challenge&&extraClocks.length)return multiClockExportSvg();
    const state=exportClockState(pupil),focused=pupil&&challenge?.mode==='standard',width=760,height=focused?(state.blankHands?530:495):690,cx=380,cy=255,r=205;
    const svg=clSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Analogue clock','data-cl-export':'clock'});
    svg.appendChild(clSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(clSvgEl('circle',{cx,cy,r,fill:'#ffffff',stroke:'#43555c','stroke-width':5,'data-cl-export-face':'1','data-cl-export-state':state.source,'data-cl-export-hour':state.hour,'data-cl-export-minute':state.minute}));
    for(let i=0;i<60;i++){
      const a=(i*6-90)*Math.PI/180,major=i%5===0,inner=r-(major?25:16),outer=r-8;
      svg.appendChild(clSvgEl('line',{
        x1:cx+inner*Math.cos(a),y1:cy+inner*Math.sin(a),
        x2:cx+outer*Math.cos(a),y2:cy+outer*Math.sin(a),
        stroke:major?'#40545b':'#71868b','stroke-width':major?3:1.5,'data-cl-export-tick':i
      }));
    }
    for(let i=0;i<12;i++){
      const n=i+1,a=(n*30-90)*Math.PI/180,x=cx+(r-54)*Math.cos(a),y=cy+(r-54)*Math.sin(a);
      svg.appendChild(clSvgEl('text',{
        x,y,'text-anchor':'middle','dominant-baseline':'middle','font-family':'Arial,sans-serif','font-size':22,'font-weight':850,fill:'#334a52','data-cl-export-numeral':n
      },numerals==='roman'?roman[i]:String(n)));
    }
    if(!state.blankHands){
      const ha=((state.hour%12)+state.minute/60)*30,ma=state.minute*6;
      const hourA=(ha-90)*Math.PI/180,minuteA=(ma-90)*Math.PI/180;
      svg.appendChild(clSvgEl('line',{
        x1:cx,y1:cy,x2:cx+105*Math.cos(hourA),y2:cy+105*Math.sin(hourA),
        stroke:'#24343b','stroke-width':10,'stroke-linecap':'round','data-cl-export-hand':'hour'
      }));
      svg.appendChild(clSvgEl('line',{
        x1:cx,y1:cy,x2:cx+150*Math.cos(minuteA),y2:cy+150*Math.sin(minuteA),
        stroke:'#147d75','stroke-width':7,'stroke-linecap':'round','data-cl-export-hand':'minute'
      }));
      svg.appendChild(clSvgEl('circle',{cx,cy,r:9,fill:'#f2b84b',stroke:'#8b681f','stroke-width':2}));
    }else{
      svg.appendChild(clSvgEl('circle',{cx,cy,r:7,fill:'#ffffff',stroke:'#8b9a9e','stroke-width':2,'data-cl-export-draw-centre':'1'}));
    }

    const readY=520,cardW=260,gap=30,start=(width-(cardW*2+gap))/2;
    const values=[
      ['24-hour',exportReadoutHidden('24',pupil)?'?':format24(state.hour,state.minute),'24'],
      ['12-hour',exportReadoutHidden('12',pupil)?'?':format12(state.hour,state.minute),'12']
    ];
    if(!focused)values.forEach((item,index)=>{
      const x=start+index*(cardW+gap);
      svg.appendChild(clSvgEl('rect',{x,y:readY,width:cardW,height:78,rx:13,fill:'#f6f9f9',stroke:'#d9e2e4','stroke-width':1}));
      svg.appendChild(clSvgEl('text',{x:x+16,y:readY+25,'font-family':'Arial,sans-serif','font-size':12,'font-weight':750,fill:'#718288'},item[0]));
      svg.appendChild(clSvgEl('text',{x:x+cardW-16,y:readY+55,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':22,'font-weight':900,fill:'#304b52','data-cl-export-readout':item[2]},item[1]));
    });
    if(state.blankHands){
      svg.appendChild(clSvgEl('text',{x:width/2,y:focused?500:625,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':14,'font-weight':750,fill:'#718288','data-cl-export-set-blank':'1'},'Draw the hands on the clock face'));
    }
    svg.appendChild(clSvgEl('text',{x:width-42,y:height-18,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function multiClockExportSvg({pupil=false}={}){
    const task=twoClockTask(),states=task?challenge.clockEvidence:clockStates(),layout=resolvedClockLayout(states.length),cols=layout==='vertical'?1:layout==='horizontal'?states.length:2,cardW=500,cardH=task?350:400,gapX=40,gapY=20,rows=Math.ceil(states.length/cols),width=60+cols*cardW+(cols-1)*gapX;
    const diffCount=task?0:Math.max(0,states.length-1),diffCols=Math.min(3,cols),diffH=diffCount?90+Math.ceil(diffCount/diffCols)*58:30,height=40+rows*(cardH+gapY)+diffH;
    const svg=clSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Clock comparison','data-cl-export':'clock-comparison'});
    svg.appendChild(clSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    states.forEach((state,index)=>{
      const col=index%cols,row=Math.floor(index/cols),x0=30+col*(cardW+gapX),y0=25+row*(cardH+gapY),cx=x0+cardW/2,cy=y0+165,r=128;
      svg.appendChild(clSvgEl('rect',{x:x0,y:y0,width:cardW,height:cardH,rx:18,fill:'#fbfcfc',stroke:'#d9e2e4','stroke-width':2,'data-cl-export-clock-index':index}));
      svg.appendChild(clSvgEl('text',{x:x0+18,y:y0+28,'font-family':'Arial,sans-serif','font-size':16,'font-weight':850,fill:'#334a52'},visibleClockLabel(index)));
      svg.appendChild(clSvgEl('circle',{cx,cy,r,fill:'#ffffff',stroke:'#43555c','stroke-width':4}));
      for(let i=0;i<60;i++){
        const a=(i*6-90)*Math.PI/180,major=i%5===0,inner=r-(major?18:12),outer=r-6;
        svg.appendChild(clSvgEl('line',{x1:cx+inner*Math.cos(a),y1:cy+inner*Math.sin(a),x2:cx+outer*Math.cos(a),y2:cy+outer*Math.sin(a),stroke:major?'#40545b':'#71868b','stroke-width':major?2.4:1.2}));
      }
      for(let i=0;i<12;i++){
        const n=i+1,a=(n*30-90)*Math.PI/180,x=cx+(r-35)*Math.cos(a),y=cy+(r-35)*Math.sin(a);
        svg.appendChild(clSvgEl('text',{x,y,'text-anchor':'middle','dominant-baseline':'middle','font-family':'Arial,sans-serif','font-size':15,'font-weight':800,fill:'#334a52'},numerals==='roman'?roman[i]:String(n)));
      }
      const ha=(((state.hour%12)+state.minute/60)*30-90)*Math.PI/180,ma=(state.minute*6-90)*Math.PI/180;
      svg.appendChild(clSvgEl('line',{x1:cx,y1:cy,x2:cx+70*Math.cos(ha),y2:cy+70*Math.sin(ha),stroke:'#24343b','stroke-width':8,'stroke-linecap':'round'}));
      svg.appendChild(clSvgEl('line',{x1:cx,y1:cy,x2:cx+96*Math.cos(ma),y2:cy+96*Math.sin(ma),stroke:'#147d75','stroke-width':6,'stroke-linecap':'round'}));
      svg.appendChild(clSvgEl('circle',{cx,cy,r:7,fill:'#f2b84b',stroke:'#8b681f','stroke-width':1.5}));
      if(task){svg.appendChild(clSvgEl('text',{x:cx,y:y0+320,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':20,'font-weight':850,fill:'#334a52'},periodLabel(state)));return}
      svg.appendChild(clSvgEl('text',{x:x0+28,y:y0+360,'font-family':'Arial,sans-serif','font-size':13,'font-weight':750,fill:'#718288'},'24-hour'));
      svg.appendChild(clSvgEl('text',{x:x0+150,y:y0+360,'font-family':'Arial,sans-serif','font-size':18,'font-weight':900,fill:'#304b52'},format24(state.hour,state.minute)));
      svg.appendChild(clSvgEl('text',{x:x0+270,y:y0+360,'font-family':'Arial,sans-serif','font-size':13,'font-weight':750,fill:'#718288'},'12-hour'));
      svg.appendChild(clSvgEl('text',{x:x0+375,y:y0+360,'font-family':'Arial,sans-serif','font-size':18,'font-weight':900,fill:'#304b52'},format12(state.hour,state.minute)));
    });
    if(diffCount){
      const y=40+rows*(cardH+gapY)+22;
      svg.appendChild(clSvgEl('text',{x:30,y,'font-family':'Arial,sans-serif','font-size':15,'font-weight':850,fill:'#334a52'},'Forward elapsed time from '+clockLabel(0)));
      states.slice(1).forEach((state,i)=>{
        const index=i+1,col=i%diffCols,row=Math.floor(i/diffCols),x=30+col*((width-60)/diffCols),yy=y+38+row*52;
        svg.appendChild(clSvgEl('text',{x,y:yy,'font-family':'Arial,sans-serif','font-size':13,'font-weight':750,fill:'#718288'},clockLabel(0)+' → '+clockLabel(index)));
        svg.appendChild(clSvgEl('text',{x:x+82,y:yy,'font-family':'Arial,sans-serif','font-size':17,'font-weight':900,fill:'#304b52','data-cl-export-difference-to':index},durationText(forwardDifferenceMinutes(states[0],state))));
      });
    }
    svg.appendChild(clSvgEl('text',{x:width-28,y:height-14,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(teacher=false){
    if(challenge?.mode==='standard'&&exportMode==='challenge')return clockPaper(clockPublicationData({diagram:snapshot(),challenge,responseLines}),teacher);
    if(!challenge)return clockPaper(clockPublicationData({diagram:snapshot(),responseLines}));
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return clockExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    const drawTask=challenge.type==='set-five'||challenge.type==='set-minute';
    return X.composeChallengeCardSvg(clockExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Clock challenge',
      prompt:drawTask?'Draw the clock hands to show '+challenge.answer+'.':challenge.type==='elapsed-forward'?prompt.replace('Move it forward by','What time will it show after').replace(/ minutes\.$/,' minutes?'):prompt,
      responseLabel:drawTask?'Draw the hands / answer':challenge.category==='reason'?'Explain your thinking':'Answer',
      responseLines,
      brand:'99 Club Studio'
    });
  }
  function exportName(){
    const meta=challenge&&CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return exportMode==='challenge'&&challenge?(challenge.title||meta?.title||'clock-challenge'):(extraClocks.length?'clock-comparison':'clock-'+format24(hour,minute).replace(':','-'));
  }
  function exportMessage(text){exportStatus=text;const el=q('#cl-export-status');if(el)el.textContent=text}
  async function exportAction(kind,teacher=false){
    try{
      if(!X)throw new Error('Export tools are not available.');
      const target=exportTargetSvg(teacher),isCard=exportMode==='challenge'&&!!challenge,name=exportName()+(teacher?'-teacher-key':'');
      if(kind==='copy'){await X.copyPng(target);exportMessage(isCard?'Challenge copied — paste it into your worksheet, slide or document.':'Clock image copied — paste it into your slide or document.')}
      if(kind==='png'){await X.downloadPng(target,name,2);exportMessage(isCard?'Challenge PNG downloaded.':'Clock PNG downloaded.')}
      if(kind==='svg'){X.downloadSvg(target,name);exportMessage(isCard?'Challenge SVG downloaded.':'Clock SVG downloaded.')}
      if(kind==='print'){X.printSvg(target,{title:'',landscape:false});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'That export did not work.')}
  }
  function exploreControlsHtml(){
    const selected=clockState(activeClock);
    const selector=clockStates().map((_,index)=>
      '<button class="gd-btn'+(activeClock===index?' gd-btn--primary':'')+'" type="button" data-cl-select-clock="'+index+'">'+esc(clockLabel(index))+'</button>'
    ).join('');
    return '<div class="gd-field"><span>Clocks</span><div class="gd-row gd-clock-selector">'+selector+'</div></div>'+
      '<div class="gd-row"><button class="gd-btn" id="cl-add-clock" type="button"'+(extraClocks.length>=MAX_CLOCKS-1?' disabled':'')+'>Add clock</button>'+
      '<button class="gd-btn" id="cl-remove-clock" type="button"'+(activeClock===0?' disabled':'')+'>Remove selected</button></div>'+
      (extraClocks.length?field('Clock layout','<select class="gd-select" id="cl-layout">'+[['auto','Automatic'],['horizontal','Horizontal'],['vertical','Vertical'],['grid','Grid (2 columns)']].filter(v=>v[0]!=='grid'||extraClocks.length>1||clockLayout==='grid').map(([v,label])=>'<option value="'+v+'"'+(clockLayout===v?' selected':'')+'>'+label+'</option>').join('')+'</select>'):'')+
      field('Clock label','<input class="gd-input" id="cl-label" maxlength="30" value="'+esc(clockLabel(activeClock))+'" placeholder="e.g. Start">','Use labels such as Start, End, Before or After when comparing clocks.')+
      field('Selected clock hour (24-hour)','<input class="gd-input gd-small" id="cl-h" type="number" min="0" max="23" value="'+selected.hour+'">')+
      field('Minutes','<input class="gd-input gd-small" id="cl-m" type="number" min="0" max="59" value="'+selected.minute+'">')+
      field('Seconds','<input class="gd-input gd-small" id="cl-s" type="number" min="0" max="59" value="'+selected.second+'">')+
      '<div class="gd-row gd-clock-display-options"><label class="nl-check"><input id="cl-show-digital" type="checkbox"'+(showDigital?' checked':'')+'> Show digital time</label><label class="nl-check"><input id="cl-show-seconds" type="checkbox"'+(showSeconds?' checked':'')+'> Show seconds hand</label></div>'+
      field('Hand snapping','<select class="gd-select" id="cl-snap"><option value="5"'+(snap===5?' selected':'')+'>5 minutes</option><option value="1"'+(snap===1?' selected':'')+'>1 minute</option></select>','Controls direct minute-hand dragging and keyboard steps on every clock.')+
      field('Clock face','<select class="gd-select" id="cl-numerals"><option value="arabic"'+(numerals==='arabic'?' selected':'')+'>1–12</option><option value="roman"'+(numerals==='roman'?' selected':'')+'>Roman numerals I–XII</option></select>')+
      '<div class="gd-row"><button class="gd-btn gd-btn--primary" id="cl-toggle-period" type="button">Toggle am / pm</button><button class="gd-btn" id="cl-random" type="button">Random 5-minute time</button><button class="gd-btn" id="cl-now" type="button">Now</button></div>'+
      '<p class="gd-help">Add up to four clocks. Drag the hands on any clock, or select it here for precise editing. With two or more clocks, the stage shows the forward elapsed time from Clock A to each other clock, including across midnight.</p>';
  }
  function challengeControlsHtml(){
    if(!CK)return'<p class="gd-help">Challenge tools are unavailable.</p>';
    const tabs=CK.tabsHtml?CK.tabsHtml('cl',challengeTab):'';
    if(challengeTab==='custom'){
      const custom=challenge&&challenge.mode==='custom'?challenge:CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual'});
      return tabs+CK.editorHtml(custom,'cl',{answerSources:customAnswerSources(),generatedAnswerLabel:'Keep the generated answer'})+
        '<div class="gd-row">'+(challenge&&challenge.answer?'<button class="gd-btn" id="cl-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
        (challenge?'<button class="gd-btn" id="cl-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
        '<p class="gd-help">Custom challenges stay linked to the live clock. Bound time answers hide both digital readouts so one representation cannot give away another.</p>';
    }
    const templates=availableClockTemplates(),categories=CHALLENGE_CATEGORIES.filter(c=>templates.some(t=>t.category===c.id));
    if(!templates.some(t=>t.id===challengeType)){challengeType=templates[0].id;challengeCategory=templates[0].category}
    const picker=CK.pickerHtml(templates,categories,challengeCategory,challengeType,'cl');
    const repeat=!!(challenge&&challenge.mode==='standard'&&challenge.type===challengeType);
    return tabs+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="cl-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
      (challenge&&challenge.mode!=='custom'?'<button class="gd-btn" id="cl-edit-challenge" type="button">Edit challenge</button>':'')+
      (challenge&&challenge.answer?'<button class="gd-btn" id="cl-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
      (challenge?'<button class="gd-btn" id="cl-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>';
  }
  function renderControls(){
    const panel=q('#gd-controls');if(panel)panel.innerHTML=controlsHtml();bindControls();
  }
  function refreshControls(){
    const selected=clockState(activeClock),h=q('#cl-h'),m=q('#cl-m'),sec=q('#cl-s'),label=q('#cl-label');
    if(h)h.value=selected.hour;if(m)m.value=selected.minute;if(sec)sec.value=selected.second;
    if(label&&document.activeElement!==label)label.value=clockLabel(activeClock);
  }
  function restoreBeforeChallenge(){
    if(beforeChallenge){restoreSnapshot(beforeChallenge);beforeChallenge=null}
  }
  function clearChallenge(){
    restoreBeforeChallenge();challenge=null;challengeTab='standard';controlTab='explore';exportMode='diagram';renderControls();draw();
  }
  function enterCustomChallenge(){
    const wasCustom=challenge?.mode==='custom';
    if(CK)challenge=CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''});
    if(!wasCustom)clearBoundHiding();
    challenge.freezeHands=false;challenge.revealed=false;challenge.targetHour=null;challenge.targetMinute=null;challenge.startHour=null;challenge.startMinute=null;
    challengeTab='custom';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();draw();
  }
  function setCustomAnswerSource(source){
    if(!challenge||challenge.mode!=='custom')return;
    if(source==='manual'){
      challenge.answerMode='manual';challenge.answerSource='';clearBoundHiding();
    }else if(source==='generated'){
      challenge.answerMode='bound';challenge.answerSource='';clearBoundHiding();
    }else{
      challenge.answerMode='bound';challenge.answerSource=source;challenge.answer=resolveAnswerSource(source);applyBoundHiding();
    }
    challenge.revealed=false;renderControls();draw();
  }
  function generateChallenge(type){
    const template=availableClockTemplates().find(t=>t.id===type);if(!template)return;
    const previousLayout=twoClockTask()?challenge.clockLayout:null;
    if(!beforeChallenge)beforeChallenge=snapshot();else restoreSnapshot(beforeChallenge);
    const data=clockGenerate(type,{clockCount:1+extraClocks.length,clockLayout:previousLayout||'horizontal'});
    const generated=data.diagram;
    activeClock=0;hour=generated.hour;minute=generated.minute;second=generated.second;snap=generated.snap;numerals=generated.numerals;
    if(data.challenge.category==='two-clocks'){showSeconds=false;extraClocks[0]=generated.extraClocks[0]}
    challenge=CK?CK.normalise(data.challenge):data.challenge;
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';
    exportMode='challenge';responseLines=template.category==='reason'?3:(type==='set-five'||type==='set-minute'?2:1);exportStatus='';
    renderControls();draw();
  }
  function handPoint(angle,len){
    const a=(angle-90)*Math.PI/180;
    return{x:150+len*Math.cos(a),y:150+len*Math.sin(a)};
  }
  function faceNumber(n){return numerals==='roman'?roman[n-1]:String(n)}
  function refreshClock(){
    updateChallengeAnswer();CK?.refreshModelPupil?.(challenge);
    const cards=qa('.gd-clock-card[data-cl-clock-index]',q('#gd-stage'));
    cards.forEach(card=>{
      const index=Math.round(num(card.dataset.clClockIndex,0)),state=clockState(index);
      const hourAngle=((state.hour%12)+state.minute/60)*30,minuteAngle=state.minute*6,secondAngle=state.second*6;
      const hourPt=handPoint(hourAngle,72),minutePt=handPoint(minuteAngle,102),secondPt=handPoint(secondAngle,112);
      const hourLine=q('[data-cl-line="hour"]',card),minuteLine=q('[data-cl-line="minute"]',card),secondLine=q('[data-cl-line="second"]',card);
      const hourHit=q('[data-cl-hand="hour"]',card),minuteHit=q('[data-cl-hand="minute"]',card);
      [hourLine,hourHit].forEach(el=>{if(el){el.setAttribute('x2',hourPt.x);el.setAttribute('y2',hourPt.y)}});
      [minuteLine,minuteHit].forEach(el=>{if(el){el.setAttribute('x2',minutePt.x);el.setAttribute('y2',minutePt.y)}});
      if(secondLine){secondLine.setAttribute('x2',secondPt.x);secondLine.setAttribute('y2',secondPt.y)}
      const frozen=(index===0||twoClockTask())&&handsFrozen(),hidden=(index===0||twoClockTask())&&anyTimeHidden();
      if(hourHit){
        if(hidden){hourHit.removeAttribute('aria-valuenow');hourHit.removeAttribute('aria-valuetext');hourHit.setAttribute('aria-label',frozen?'Hour hand fixed for this challenge':'Hour hand for challenge')}
        else{hourHit.setAttribute('aria-valuenow',state.hour);hourHit.setAttribute('aria-label',clockLabel(index)+' hour hand');hourHit.setAttribute('aria-valuetext','Hour hand, '+format12(state.hour,state.minute))}
      }
      if(minuteHit){
        if(hidden){minuteHit.removeAttribute('aria-valuenow');minuteHit.removeAttribute('aria-valuetext');minuteHit.setAttribute('aria-label',frozen?'Minute hand fixed for this challenge':'Minute hand for challenge')}
        else{minuteHit.setAttribute('aria-valuenow',state.minute);minuteHit.setAttribute('aria-label',clockLabel(index)+' minute hand');minuteHit.setAttribute('aria-valuetext','Minute hand, '+state.minute+' minutes, '+format12(state.hour,state.minute))}
      }
      const svg=q('svg',card);
      if(svg){
        svg.setAttribute('aria-label',hidden?'Analogue clock for challenge':clockLabel(index)+' showing '+format12(state.hour,state.minute));
        svg.dataset.clHour=String(state.hour);svg.dataset.clMinute=String(state.minute);
      }
      const d24=q('[data-cl-readout-kind="24"]',card),d12=q('[data-cl-readout-kind="12"]',card),digital=q('[data-cl-digital]',card);
      if(d24)d24.textContent=hiddenReadout('24')&&index===0?'?':format24Digital(state.hour,state.minute,state.second);
      if(d12)d12.textContent=hiddenReadout('12')&&index===0?'?':format12Digital(state.hour,state.minute,state.second);
      if(digital)digital.textContent=hiddenReadout('12')&&index===0?'?':format12Digital(state.hour,state.minute,state.second);
    });
    qa('[data-cl-difference-to]',q('#gd-stage')).forEach(el=>{
      const index=Math.round(num(el.dataset.clDifferenceTo,1)),state=clockState(index);
      el.textContent=durationText(forwardDifferenceMinutes(clockState(0),state));
    });
    qa('[data-cl-period-stage]',q('#gd-stage')).forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.clPeriodStage)===(hour>=12?12:0))));
    refreshControls();
  }
  function angleFromPointer(clientX,clientY,svg){
    if(!svg)return 0;
    const rect=svg.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    const deg=Math.atan2(clientY-cy,clientX-cx)*180/Math.PI+90;
    return mod(deg,360);
  }
  function snappedMinute(angle){
    const raw=angle/6;
    return mod(Math.round(raw/snap)*snap,60);
  }
  function setHandFromPointer(kind,clientX,clientY,carryHour,index,svg){
    if((index===0||twoClockTask())&&handsFrozen())return;
    const state=clockState(index),angle=angleFromPointer(clientX,clientY,svg);
    if(kind==='minute'){
      const next=snappedMinute(angle),previous=state.minute;
      if(carryHour){
        if(previous>=45&&next<=15)setClockTime(index,state.hour+1,next);
        else if(previous<=15&&next>=45)setClockTime(index,state.hour-1,next);
        else setClockTime(index,state.hour,next);
      }else setClockTime(index,state.hour,next);
    }else{
      const faceHour=mod(Math.round(angle/30-state.minute/60),12);
      const period=state.hour>=12?12:0;
      setClockTime(index,period+faceHour,state.minute);
    }
    refreshClock();
  }
  function startDrag(kind,index,e){
    if(((index===0||twoClockTask())&&handsFrozen())||(e.button!=null&&e.button!==0))return;
    e.preventDefault();
    drag={kind,index,pointerId:e.pointerId,svg:e.currentTarget.closest('svg')};
    setHandFromPointer(kind,e.clientX,e.clientY,false,index,drag.svg);
    document.addEventListener('pointermove',dragMove);
    document.addEventListener('pointerup',dragEnd,{once:true});
    document.addEventListener('pointercancel',dragEnd,{once:true});
  }
  function dragMove(e){
    if(!drag||e.pointerId!==drag.pointerId)return;
    e.preventDefault();setHandFromPointer(drag.kind,e.clientX,e.clientY,true,drag.index,drag.svg);
  }
  function dragEnd(e){
    if(drag&&e.pointerId!=null&&e.pointerId!==drag.pointerId)return;
    drag=null;
    document.removeEventListener('pointermove',dragMove);
    document.removeEventListener('pointerup',dragEnd);
    document.removeEventListener('pointercancel',dragEnd);
  }
  function adjustHand(kind,delta,index=0){
    if((index===0||twoClockTask())&&handsFrozen())return;
    const state=clockState(index);
    if(kind==='minute')setClockTime(index,state.hour,state.minute+delta*snap);
    else setClockTime(index,state.hour+delta,state.minute);
    refreshClock();
  }
  function bindStage(){
    const layout=q('[data-cl-layout-cycle]',q('#gd-stage'));if(layout)layout.onclick=cycleClockLayout;
    qa('[data-cl-period-stage]',q('#gd-stage')).forEach(button=>button.onclick=()=>{if(handsFrozen())return;setClockTime(0,hour%12+Number(button.dataset.clPeriodStage),minute);refreshClock()});
    qa('.gd-clock-hand-hit',q('#gd-stage')).forEach(hit=>{
      const index=Math.round(num(hit.dataset.clClockIndex,0)),kind=hit.dataset.clHand;
      if((index===0||twoClockTask())&&handsFrozen())return;
      hit.onpointerdown=e=>startDrag(kind,index,e);
      hit.onkeydown=e=>{
        if(e.key==='ArrowLeft'||e.key==='ArrowDown'){e.preventDefault();adjustHand(kind,-1,index)}
        else if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();adjustHand(kind,1,index)}
      };
    });
    qa('[data-cl-select-stage]',q('#gd-stage')).forEach(button=>button.onclick=()=>{
      if(challenge)return;
      activeClock=clamp(Math.round(num(button.dataset.clSelectStage,0)),0,extraClocks.length);
      renderControls();draw();
    });
  }
  function toggleClockReveal(){if(!challenge)return;challenge.revealed=!challenge.revealed;if(challenge.mode==='standard'&&challenge.freezeHands===false){if(challenge.revealed){challenge.modelBeforeReveal=snapshot();hour=challenge.targetHour;minute=challenge.targetMinute;second=0}else if(challenge.modelBeforeReveal){restoreSnapshot(challenge.modelBeforeReveal);delete challenge.modelBeforeReveal}}renderControls();draw()}
  function bindChallengeStageActions(){
    const endChallenge=q('[data-challenge-action="end"]',q('#gd-stage'));if(endChallenge)endChallenge.onclick=e=>{e.stopPropagation();clearChallenge()};
    const stage=q('#gd-stage');if(!stage||!challenge)return;
    const reveal=q('[data-board-action="reveal"]',stage);
    if(reveal)reveal.onclick=e=>{e.stopPropagation();toggleClockReveal()};
    const another=q('[data-challenge-action="another"]',stage);
    if(another)another.onclick=e=>{e.stopPropagation();if(challenge?.mode==='standard')generateChallenge(challenge.type)};
  }
  function bindControls(){
    const controls=q('#gd-controls');if(!controls)return;
    qa('[data-cl-workflow]',controls).forEach(button=>button.onclick=()=>{
      const next=button.dataset.clWorkflow;
      controlTab=next==='challenge'?'challenge':next==='export'?'export':'explore';renderControls();
    });
    if(controlTab==='export'){
      qa('[data-cl-export-mode]',controls).forEach(button=>button.onclick=()=>{
        exportMode=button.dataset.clExportMode==='challenge'&&challenge?'challenge':'diagram';exportStatus='';renderControls();
      });
      const response=q('#cl-response-lines',controls);if(response)response.onchange=()=>{
        responseLines=clamp(Math.round(num(response.value,1)),1,4);renderControls();
      };
      const copyImage=q('#cl-copy-image',controls);if(copyImage)copyImage.onclick=()=>exportAction('copy');
      const png=q('#cl-png',controls);if(png)png.onclick=()=>exportAction('png');
      const svgDownload=q('#cl-svg-download',controls);if(svgDownload)svgDownload.onclick=()=>exportAction('svg');
      const print=q('#cl-print',controls);if(print)print.onclick=()=>exportAction('print');
      const keyCopy=q('#cl-copy-key',controls),keyPrint=q('#cl-print-key',controls);if(keyCopy)keyCopy.onclick=()=>exportAction('copy',true);if(keyPrint)keyPrint.onclick=()=>exportAction('print',true);
      return;
    }
    if(controlTab==='explore'){
      if(challenge?.mode==='standard'){qa('button,input,select',controls).filter(el=>!el.matches('[data-cl-workflow]')).forEach(el=>el.disabled=true);return}
      qa('[data-cl-select-clock]',controls).forEach(button=>button.onclick=()=>{
        activeClock=clamp(Math.round(num(button.dataset.clSelectClock,0)),0,extraClocks.length);
        renderControls();draw();
      });
      const add=q('#cl-add-clock',controls);if(add)add.onclick=()=>{
        if(extraClocks.length>=MAX_CLOCKS-1)return;
        const base=clockState(activeClock),next=normaliseClockTime(base.hour+1,base.minute,base.hour,base.minute),slot=allocateClockSlot();
        extraClocks.push({...next,second:base.second});clockSlots.push(slot);activeClock=extraClocks.length;clockNames[activeClock]='Clock '+clockLetter(slot);renderControls();draw();
      };
      const remove=q('#cl-remove-clock',controls);if(remove)remove.onclick=()=>{
        if(activeClock===0)return;
        releaseClockSlot(clockSlot(activeClock));
        extraClocks.splice(activeClock-1,1);clockSlots.splice(activeClock,1);clockNames.splice(activeClock,1);while(clockNames.length<MAX_CLOCKS)clockNames.push('');
        activeClock=Math.min(activeClock-1,extraClocks.length);renderControls();draw();
      };
      const layout=q('#cl-layout',controls);if(layout)layout.onchange=()=>setClockLayout(layout.value);
      const h=q('#cl-h',controls),m=q('#cl-m',controls),sec=q('#cl-s',controls),label=q('#cl-label',controls);
      if(h)h.oninput=()=>{const current=clockState(activeClock);setClockTime(activeClock,clamp(num(h.value,current.hour),0,23),current.minute);refreshClock()};
      if(m)m.oninput=()=>{const current=clockState(activeClock);setClockTime(activeClock,current.hour,clamp(num(m.value,current.minute),0,59));refreshClock()};
      if(sec)sec.oninput=()=>{setClockSecond(activeClock,sec.value);refreshClock()};
      if(label)label.onchange=()=>{clockNames[activeClock]=String(label.value||'').trim().slice(0,30)||('Clock '+clockLetter(clockSlot(activeClock)));renderControls();draw()};
      const digital=q('#cl-show-digital',controls);if(digital)digital.onchange=()=>{showDigital=!!digital.checked;draw()};
      const secondsToggle=q('#cl-show-seconds',controls);if(secondsToggle)secondsToggle.onchange=()=>{showSeconds=!!secondsToggle.checked;draw()};
      const snapSelect=q('#cl-snap',controls);if(snapSelect)snapSelect.onchange=()=>{snap=Number(snapSelect.value)===1?1:5};
      const numeralSelect=q('#cl-numerals',controls);if(numeralSelect)numeralSelect.onchange=()=>{numerals=numeralSelect.value==='roman'?'roman':'arabic';draw()};
      const toggle=q('#cl-toggle-period',controls);if(toggle)toggle.onclick=()=>{const current=clockState(activeClock);setClockTime(activeClock,current.hour+(current.hour<12?12:-12),current.minute);refreshClock()};
      const random=q('#cl-random',controls);if(random)random.onclick=()=>{setClockTime(activeClock,randomHour(),randomMinute(5));refreshClock()};
      const now=q('#cl-now',controls);if(now)now.onclick=()=>{const d=new Date();setClockTime(activeClock,d.getHours(),d.getMinutes());refreshClock()};
      return;
    }
    qa('[data-cl-challenge-tab]',controls).forEach(button=>button.onclick=()=>{
      if(button.dataset.clChallengeTab==='custom')enterCustomChallenge();else{challengeTab='standard';renderControls()}
    });
    qa('[data-cl-challenge-cat]',controls).forEach(button=>button.onclick=()=>{
      challengeCategory=button.dataset.clChallengeCat;
      const first=availableClockTemplates().find(t=>t.category===challengeCategory);if(first)challengeType=first.id;
      renderControls();
    });
    qa('[data-cl-challenge-type]',controls).forEach(button=>button.onclick=()=>{challengeType=button.dataset.clChallengeType;renderControls()});
    const generate=q('#cl-generate',controls);if(generate)generate.onclick=()=>generateChallenge(challengeType);
    const edit=q('#cl-edit-challenge',controls);if(edit)edit.onclick=enterCustomChallenge;
    const end=q('#cl-clear-challenge',controls);if(end)end.onclick=clearChallenge;
    const reveal=q('#cl-reveal',controls);if(reveal)reveal.onclick=toggleClockReveal;
    qa('[data-gd-rich-action]',controls).forEach(button=>button.onclick=e=>{
      e.preventDefault();const editor=q('#cl-custom-prompt',controls);
      if(editor&&CK&&challenge){
        CK.applyFormat(editor,button.dataset.gdRichAction);
        challenge.promptHtml=CK.sanitiseRichHtml(editor.innerHTML);
        challenge.prompt=CK.plainText(challenge.promptHtml).slice(0,600);draw();
      }
    });
    const title=q('#cl-custom-title',controls);if(title)title.oninput=()=>{if(!challenge)return;challenge.title=title.value.slice(0,100);draw()};
    const prompt=q('#cl-custom-prompt',controls);if(prompt)prompt.oninput=()=>{
      if(!challenge||!CK)return;challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml).slice(0,600);draw();
    };
    const source=q('#cl-custom-answer-source',controls);if(source)source.onchange=()=>setCustomAnswerSource(source.value);
    const answer=q('#cl-custom-answer',controls);if(answer)answer.oninput=()=>{
      if(!challenge)return;challenge.answer=answer.value.slice(0,400);challenge.answerMode='manual';challenge.answerSource='';clearBoundHiding();
      if(challenge.revealed)draw();
    };
  }
  function clockCardMarkup(index,state,frozen,hidden){
    const label=visibleClockLabel(index),hp=handPoint(((state.hour%12)+state.minute/60)*30,72),mp=handPoint(state.minute*6,102),sp=handPoint(state.second*6,112);
    const primary=index===0,selected=!challenge&&activeClock===index;
    const faceId=primary?'cl-face':'cl-face-'+index,hourId=primary?'cl-hour-hand':'cl-hour-hand-'+index,minuteId=primary?'cl-minute-hand':'cl-minute-hand-'+index;
    const hourHitId=primary?'cl-hour-hit':'cl-hour-hit-'+index,minuteHitId=primary?'cl-minute-hit':'cl-minute-hit-'+index;
    return '<section class="gd-clock-card'+(selected?' is-selected':'')+'" data-cl-clock-index="'+index+'">'+
      '<div class="gd-clock-card-head">'+(challenge?'<strong>'+esc(label)+'</strong>':'<button type="button" class="gd-clock-select" data-cl-select-stage="'+index+'">'+esc(label)+(selected?' • selected':'')+'</button>')+'</div>'+
      '<div class="gd-clock"><svg id="'+faceId+'" viewBox="0 0 300 300" role="img" aria-label="'+esc(hidden?'Analogue clock for challenge':label+' showing '+format12(state.hour,state.minute))+'" data-cl-clock-index="'+index+'" data-cl-hour="'+state.hour+'" data-cl-minute="'+state.minute+'" data-cl-frozen="'+(frozen?'true':'false')+'" data-cl-target-hour="'+(primary&&Number.isFinite(Number(challenge?.targetHour))?challenge.targetHour:'')+'" data-cl-target-minute="'+(primary&&Number.isFinite(Number(challenge?.targetMinute))?challenge.targetMinute:'')+'">'+
        '<circle class="gd-clock-face" cx="150" cy="150" r="135"></circle>'+tickMarkup()+numeralMarkup()+
        '<line class="gd-clock-hour" id="'+hourId+'" data-cl-line="hour" x1="150" y1="150" x2="'+hp.x+'" y2="'+hp.y+'"></line>'+
        '<line class="gd-clock-minute" id="'+minuteId+'" data-cl-line="minute" x1="150" y1="150" x2="'+mp.x+'" y2="'+mp.y+'"></line>'+
        (showSeconds?'<line class="gd-clock-second" data-cl-line="second" x1="150" y1="150" x2="'+sp.x+'" y2="'+sp.y+'"></line>':'')+
        '<line class="gd-clock-hand-hit gd-clock-hand-hit--hour'+(frozen?' is-frozen':'')+'" id="'+hourHitId+'" data-cl-clock-index="'+index+'" data-cl-hand="hour" tabindex="'+(frozen?'-1':'0')+'"'+(hidden?' aria-label="'+(frozen?'Hour hand fixed for this challenge':'Hour hand for challenge')+'"':' role="slider" aria-label="'+esc(label+' hour hand')+'" aria-valuemin="0" aria-valuemax="23" aria-valuenow="'+state.hour+'"')+' x1="150" y1="150" x2="'+hp.x+'" y2="'+hp.y+'"></line>'+
        '<line class="gd-clock-hand-hit gd-clock-hand-hit--minute'+(frozen?' is-frozen':'')+'" id="'+minuteHitId+'" data-cl-clock-index="'+index+'" data-cl-hand="minute" tabindex="'+(frozen?'-1':'0')+'"'+(hidden?' aria-label="'+(frozen?'Minute hand fixed for this challenge':'Minute hand for challenge')+'"':' role="slider" aria-label="'+esc(label+' minute hand')+'" aria-valuemin="0" aria-valuemax="59" aria-valuenow="'+state.minute+'"')+' x1="150" y1="150" x2="'+mp.x+'" y2="'+mp.y+'"></line>'+
        '<circle class="gd-clock-centre" cx="150" cy="150" r="7"></circle>'+
      '</svg></div>'+
      (primary&&challenge?.mode==='standard'&&!frozen?'<div class="gd-row gd-cl-period-choice" role="group" aria-label="Choose morning or afternoon">'+[0,12].map(p=>'<button type="button" class="gd-btn" data-cl-period-stage="'+p+'" aria-pressed="'+(p===(state.hour>=12?12:0))+'">'+(p===0?'AM':'PM')+'</button>').join('')+'</div>':'')+
      (twoClockTask()?'<div class="gd-clock-period" style="text-align:center;font-weight:800;padding:4px">'+periodLabel(state)+'</div>':'')+
      (!showDigital||twoClockTask()||primary&&challenge?.mode==='standard'&&!challenge.revealed?'':'<div class="gd-clock-readouts">'+
        (primary&&hiddenReadout('24')?'':'<div class="gd-readout"><span>24-hour</span><strong data-cl-readout-kind="24"'+(primary?' data-cl-readout="24"':'')+'>'+format24Digital(state.hour,state.minute,state.second)+'</strong></div>')+
        (primary&&hiddenReadout('12')?'':'<div class="gd-readout"><span>12-hour</span><strong data-cl-readout-kind="12"'+(primary?' data-cl-readout="12"':'')+'>'+format12Digital(state.hour,state.minute,state.second)+'</strong></div>')+
      '</div>')+
    '</section>';
  }
  function differenceMarkup(){
    if(challenge||!extraClocks.length)return'';
    const base=clockState(0);
    return '<div class="gd-clock-differences" data-cl-difference-count="'+extraClocks.length+'" aria-label="Time differences from '+esc(clockLabel(0))+'">'+clockStates().slice(1).map((state,i)=>{
      const index=i+1;
      return '<div class="gd-readout"><span>'+esc(clockLabel(0))+' → '+esc(clockLabel(index))+'</span><strong data-cl-difference-to="'+index+'">'+durationText(forwardDifferenceMinutes(base,state))+'</strong></div>';
    }).join('')+'</div>';
  }
  function draw(){
    const states=twoClockTask()?clockStates().slice(0,2):challenge?[clockState(0)]:clockStates(),frozen=handsFrozen(),hidden=anyTimeHidden();
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Clock challenge',pupil:(twoClockTask()?(challenge.type==='two-order'?CK.pupilSpec('choice',{choices:['Clock A','Clock B']}):challenge.type==='two-duration-reason'?CK.pupilSpec('choice',{choices:['Yes','No'],explain:true}):CK.pupilSpec('unit',{unit:'minutes',hint:'Number'})):challenge.freezeHands===false?CK.pupilSpec('model',{check:onTarget}):challenge.type==='hour-hand-misconception'?CK.pupilSpec('choice',{choices:['Yes','No'],expected:challenge.answer.startsWith('Yes')?'Yes':'No',explain:true}):challenge.type==='time-language'?CK.pupilSpec('spoken',{hint:'e.g. quarter past 3'}):CK.pupilSpec(challenge.type==='twelve-to-twentyfour'?'clock-24':challenge.type==='twentyfour-to-twelve'?'clock-12':'clock-face')),actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'},{action:'end',label:'Back to setup'}]:[{action:'end',label:'End challenge'}]}):'';
    const targetStatus='';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-clock-workbench">'+
      layoutButton()+'<div class="gd-clock-grid" data-cl-layout="'+resolvedClockLayout(states.length)+'" style="--cl-count:'+states.length+'">'+states.map((state,index)=>clockCardMarkup(index,state,(index===0||twoClockTask())&&frozen,(index===0||twoClockTask())&&hidden)).join('')+'</div>'+
      differenceMarkup()+targetStatus+
    '</div>';
    bindStage();bindChallengeStageActions();refreshClock();
  }

  setPanels(controlsHtml(),'');
  bindControls();
  draw();
  G.lessonState?.register('clock',()=>({diagram:snapshot(),challenge,beforeChallenge,pupil:CK?.capturePupil?.(challenge),controlTab,challengeTab,challengeCategory,challengeType,exportMode,responseLines}),saved=>{
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

function moneyTool(){
  const I=G.interaction,CK=G.challengeKit,X=G.exportTools;
  if(!I){q('#gd-stage').innerHTML='<p class="gd-empty">The interactive money workbench could not start.</p>';return;}
  const DENOMS=[
    {value:1,label:'1p',kind:'coin',shape:'round',size:56,tone:'copper'},
    {value:2,label:'2p',kind:'coin',shape:'round',size:71,tone:'copper'},
    {value:5,label:'5p',kind:'coin',shape:'round',size:50,tone:'silver'},
    {value:10,label:'10p',kind:'coin',shape:'round',size:67,tone:'silver'},
    {value:20,label:'20p',kind:'coin',shape:'hept',size:59,tone:'silver'},
    {value:50,label:'50p',kind:'coin',shape:'hept',size:75,tone:'silver'},
    {value:100,label:'£1',kind:'coin',shape:'dodec',size:64,tone:'bimetal'},
    {value:200,label:'£2',kind:'coin',shape:'round',size:78,tone:'bimetal'},
    {value:500,label:'£5',kind:'note',shape:'note',width:112,height:52,tone:'blue'},
    {value:1000,label:'£10',kind:'note',shape:'note',width:122,height:55,tone:'orange'},
    {value:2000,label:'£20',kind:'note',shape:'note',width:132,height:58,tone:'purple'},
    {value:5000,label:'£50',kind:'note',shape:'note',width:142,height:61,tone:'red'}
  ];
  const CHALLENGE_CATEGORIES=[
    {id:'read',label:'Count & compare'},
    {id:'make',label:'Make an amount'},
    {id:'change',label:'Change & difference'},
    {id:'exchange',label:'Exchange money'}
  ];
  const CHALLENGE_TEMPLATES=[
    {id:'count-total',category:'read',title:'How much is shown?',desc:'Add the shown coins and notes to find the total.'},
    {id:'compare-amount',category:'read',title:'Compare the amount',desc:'Decide whether the shown money is less than, equal to or greater than a target.'},
    {id:'missing-to-target',category:'read',title:'How much more?',desc:'Find the difference between the shown amount and a target.'},
    {id:'make-target',category:'make',title:'Make the target',desc:'Build an exact amount in any valid way.'},
    {id:'exact-pieces',category:'make',title:'Use exactly N pieces',desc:'Make a target using an exact number of coins or notes.'},
    {id:'fewest-pieces',category:'make',title:'Fewest pieces',desc:'Make the target with the smallest possible number of pieces.'},
    {id:'find-change',category:'change',title:'Find the change',desc:'Build the correct change from a larger payment.'},
    {id:'split-change',category:'exchange',title:'How many smaller coins?',desc:'Calculate the number of equal-value coins needed.'},
    {id:'combine-change',category:'exchange',title:'Which single coin or note?',desc:'Find the denomination equal in value to the money shown.'},
    {id:'exchange-fewest',category:'exchange',title:'Minimum number of pieces',desc:'Calculate the fewest coins or notes worth the same total.'}
  ];
  let items=[],nextId=1,target=375,targetActive=false,controller=null,addOpen=false,coinSerial=0,contextMode='',contextItemId=null;
  const exchangeSelection=new Set();
  const coinPrefix='mo-'+Math.random().toString(36).slice(2,10);
  let controlTab='explore',challengeTab='standard',challengeCategory='read',challengeType='count-total',challenge=null,beforeChallenge=null;
  let exportMode='board',responseLines=1,exportStatus='';

  function metaFor(value){return DENOMS.find(d=>d.value===Number(value))||DENOMS[0]}
  function coinPath(shape){
    if(shape==='hept'){
      const vertices=Array.from({length:7},(_,i)=>{const angle=(-90+i*360/7)*Math.PI/180;return{x:50+47*Math.cos(angle),y:50+47*Math.sin(angle)}});
      const blend=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
      const xy=p=>p.x.toFixed(2)+' '+p.y.toFixed(2);
      return vertices.map((v,i)=>{const before=blend(v,vertices[(i+6)%7],.15),after=blend(v,vertices[(i+1)%7],.15);return(i?'L':'M')+xy(before)+' Q'+xy(v)+' '+xy(after)}).join(' ')+' Z';
    }
    if(shape==='dodec')return 'M37 3H63L86 16L98 38V62L86 84L63 97H37L14 84L2 62V38L14 16Z';
    return '';
  }
  function coinArt(d){
    const id=coinPrefix+'-'+(++coinSerial),shape=d.shape,metal=d.tone;
    const outer=shape==='round'?'<circle cx="50" cy="50" r="46"/>':'<path d="'+coinPath(shape)+'"/>';
    const edgeFill=metal==='bimetal'?'url(#'+id+'-gold) #d7b64e':metal==='copper'?'url(#'+id+'-copper) #cf8867':'url(#'+id+'-silver) #bbc6c8';
    const inner=metal==='bimetal'?'<circle cx="50" cy="50" r="31" fill="url(#'+id+'-silver) #bbc6c8" stroke="rgba(63,78,82,.32)" stroke-width="1.3"/>':'';
    const labelSize=d.label.length>=3?21:25;
    return '<svg class="gd-money-coin-art gd-money-coin-art--'+shape+' gd-money-coin-art--'+metal+'" viewBox="0 0 100 100" aria-hidden="true" focusable="false">'+
      '<defs>'+
        '<radialGradient id="'+id+'-silver" cx="32%" cy="25%" r="78%"><stop offset="0" stop-color="#ffffff"/><stop offset=".42" stop-color="#e4e9e9"/><stop offset=".76" stop-color="#bbc6c8"/><stop offset="1" stop-color="#8e9da0"/></radialGradient>'+
        '<radialGradient id="'+id+'-copper" cx="32%" cy="25%" r="78%"><stop offset="0" stop-color="#f3c3a6"/><stop offset=".42" stop-color="#cf8867"/><stop offset=".78" stop-color="#a55f45"/><stop offset="1" stop-color="#7b4332"/></radialGradient>'+
        '<radialGradient id="'+id+'-gold" cx="30%" cy="24%" r="80%"><stop offset="0" stop-color="#f8e8a0"/><stop offset=".42" stop-color="#d7b64e"/><stop offset=".8" stop-color="#aa812a"/><stop offset="1" stop-color="#7e5d1f"/></radialGradient>'+
      '</defs>'+
      '<g fill="'+edgeFill+'" stroke="rgba(54,70,74,.42)" stroke-width="1.7">'+outer+'</g>'+inner+
      '<circle cx="50" cy="50" r="'+(metal==='bimetal'?24:35)+'" fill="none" stroke="rgba(255,255,255,.42)" stroke-width="1"/>'+
      '<path d="M31 58 Q50 37 69 58 M35 64 Q50 48 65 64" fill="none" stroke="rgba(48,66,70,.20)" stroke-width="2.2" stroke-linecap="round"/>'+
      '<circle cx="50" cy="28" r="2.4" fill="rgba(48,66,70,.24)"/>'+
      '<text x="50" y="54" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="'+labelSize+'" font-weight="900" fill="#263d43">'+d.label+'</text>'+
      '<text x="50" y="76" text-anchor="middle" font-family="Arial,sans-serif" font-size="6.4" font-weight="800" letter-spacing=".8" fill="rgba(38,61,67,.66)">UK</text>'+
    '</svg>';
  }
  function total(){return items.reduce((sum,item)=>sum+Number(item.value||0),0)}
  function exchangeTask(){return challenge?.mode==='standard'&&challenge.category==='exchange'}
  function freeMoneyEdit(){return !challengeFrozen()&&!exchangeTask()}
  function splitOptions(item){
    if(!item||item.locked)return [];
    const smaller=DENOMS.filter(d=>d.value<item.value),options=[];
    for(const d of smaller){
      const n=item.value/d.value;
      if(Number.isInteger(n)&&n>=2&&n<=20)options.push(Array(n).fill(d.value));
    }
    let left=item.value,mixed=[];
    for(const d of smaller.slice().reverse())while(left>=d.value&&mixed.length<21){mixed.push(d.value);left-=d.value}
    if(!left&&mixed.length>=2&&mixed.length<=20&&!options.some(v=>v.join()===mixed.join()))options.push(mixed);
    return options.sort((a,b)=>a.length-b.length);
  }
  function combineOptions(item){
    if(!item||item.locked)return [];
    const available=items.filter(x=>x!==item&&!x.locked).sort((a,b)=>(a.value===item.value?0:1)-(b.value===item.value?0:1)||b.value-a.value);
    const limit=DENOMS.at(-1).value-item.value,reachable=new Map([[0,[]]]);
    for(const piece of available){
      for(const [sum,group] of [...reachable]){
        const next=sum+piece.value;if(next>limit||group.length>=19)continue;
        const existing=reachable.get(next);
        if(!existing||existing.length>group.length+1)reachable.set(next,[...group,piece]);
      }
    }
    return DENOMS.filter(d=>d.value>item.value&&reachable.has(d.value-item.value)).map(d=>({value:d.value,group:[item,...reachable.get(d.value-item.value)]}));
  }
  function piecesText(values){
    const counts=new Map();values.forEach(v=>counts.set(v,(counts.get(v)||0)+1));
    return [...counts].sort((a,b)=>b[0]-a[0]).map(([v,n])=>(n>1?n+' × ':'')+metaFor(v).label).join(' + ');
  }
  function replaceMoney(group,values){
    if(!group.length||group.some(x=>x.locked||!items.includes(x))||values.some(v=>!DENOMS.some(d=>d.value===v)))return false;
    if(group.reduce((n,x)=>n+x.value,0)!==values.reduce((n,v)=>n+v,0))return false;
    const ids=new Set(group.map(x=>x.id));items=items.filter(x=>!ids.has(x.id));
    values.forEach(v=>{const added=addMoney(v),m=canvasMetrics(items.length);const d=metaFor(v),w=d.kind==='note'?d.width:d.size,h=d.kind==='note'?d.height:d.size;
      const free=(p)=>items.every(other=>{if(other===added)return true;const o=metaFor(other.value),ow=o.kind==='note'?o.width:o.size,oh=o.kind==='note'?o.height:o.size;return p.x+w+8<=other.x||other.x+ow+8<=p.x||p.y+h+8<=other.y||other.y+oh+8<=p.y});
      let placed=false;for(let i=0;i<Math.max(items.length*3+12,32);i++){const p=slot(i);if(p.x+w<=m.width&&free(p)){added.x=p.x;added.y=p.y;placed=true;break}}
      if(!placed){added.x=18;added.y=m.height+12}
    });return true;
  }
  function exchangeCheck(){
    if(total()!==target)return false;
    if(challenge.type==='split-change')return items.length===challenge.solutionValues.length&&items.every(x=>x.value===challenge.solutionValues[0]);
    if(challenge.type==='combine-change')return items.length===1&&items[0].value===target;
    if(challenge.type==='exchange-fewest')return items.length===minimumPieces(target);
    return true;
  }
  function canvasMetrics(count=items.length){
    const stageWidth=q('#gd-stage')?.clientWidth||760;
    const width=Math.max(280,stageWidth-38);
    const cols=Math.max(2,Math.floor((width-28)/128));
    const rows=Math.max(1,Math.ceil(Math.max(1,count)/cols));
    const occupiedHeight=items.reduce((max,item)=>{const d=metaFor(item.value);return Math.max(max,(Number(item.y)||0)+(d.kind==='note'?d.height:d.size)+20)},0);
    return{width,cols,height:Math.max(challenge?.mode==='standard'&&challengeFrozen()?160:390,44+rows*108,occupiedHeight)};
  }
  function slot(index){
    const m=canvasMetrics(Math.max(items.length,index+1));
    const col=index%m.cols,row=Math.floor(index/m.cols);
    return{x:18+col*((m.width-36)/m.cols),y:24+row*108};
  }
  function seed(){
    items=[];nextId=1;
    [200,100,50,20,5].forEach((value,index)=>{
      const p=slot(index);
      items.push({id:nextId++,value,x:p.x,y:p.y,locked:false});
    });
  }
  function snapshot(){return{items:items.map(x=>({...x})),nextId,target,targetActive}}
  function restore(state){
    items=Array.isArray(state?.items)?state.items.map(x=>({...x})):[];
    nextId=Math.max(Number(state?.nextId)||1,items.reduce((m,x)=>Math.max(m,Number(x.id)||0),0)+1);
    target=Math.max(1,Math.round(Number(state?.target)||375));
    targetActive=state?.targetActive===true;
    const targetInput=q('#mo-target');if(targetInput)targetInput.value=(target/100).toFixed(2);
  }
  function setValues(values){
    items=[];nextId=1;
    values.forEach((value,index)=>{const p=slot(index);items.push({id:nextId++,value:Number(value),x:p.x,y:p.y,locked:false})});
  }
  function addMoney(value){
    const p=slot(items.length),item={id:nextId++,value:Number(value),x:p.x,y:p.y,locked:false};
    items.push(item);return item;
  }
  function duplicateMoney(item){
    const copy={...item,id:nextId++,locked:false,x:Number(item.x||0)+24,y:Number(item.y||0)+24};
    items.push(copy);return copy;
  }
  function tidyMoney(){
    const m=canvasMetrics(items.length);
    items.forEach((item,index)=>{
      const col=index%m.cols,row=Math.floor(index/m.cols);
      item.x=18+col*((m.width-36)/m.cols);
      item.y=24+row*108;
    });
  }
  function randomInt(min,max){return min+Math.floor(Math.random()*(max-min+1))}
  function randomStep(min,max,step=5){return Math.max(step,Math.round(randomInt(min,max)/step)*step)}
  function amountValues(amount){
    let left=Math.max(0,Math.round(amount)),values=[];
    const descending=DENOMS.map(d=>d.value).filter(v=>v<=left).sort((a,b)=>b-a);
    for(const value of descending)while(left>=value){values.push(value);left-=value}
    return values;
  }
  function minimumPieces(amount){return amountValues(amount).length}
  // Older saved exact-piece questions did not contain their generated example.
  function exactPieceValues(amount,count){
    if(!Number.isInteger(amount)||amount<1||amount>10000||!Number.isInteger(count)||count<1||count>12)return [];
    const values=DENOMS.map(d=>d.value).filter(v=>v<=amount).sort((a,b)=>b-a),memo=new Set();
    function find(left,n,start){
      if(n===0)return left===0?[]:null;
      if(left<n||start>=values.length||left>n*values[start])return null;
      const key=left+':'+n+':'+start;if(memo.has(key))return null;
      for(let i=start;i<values.length;i++){const v=values[i];if(v>left)continue;const tail=find(left-v,n-1,i);if(tail)return [v,...tail]}
      memo.add(key);return null;
    }
    return find(amount,count,0)||[];
  }
  function randomShownValues(){
    const pool=[5,10,20,50,100,200,500],count=randomInt(4,7),values=[];
    for(let i=0;i<count;i++)values.push(pool[randomInt(0,pool.length-1)]);
    return values;
  }
  function challengeObject(type,prompt,answer,extra={}){
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===type);
    const raw={mode:'standard',type,category:meta?.category||'',title:'',prompt,promptHtml:prompt,answer:String(answer??''),answerMode:'bound',answerSource:'',revealed:false,freezeMoney:true,hiddenTotal:false,hiddenTarget:false,hiddenStatus:false,targetPieces:null,minPieces:null,...extra};
    return CK?CK.normalise(raw):raw;
  }
  function challengeFrozen(){return !!(challenge&&challenge.mode==='standard'&&(challenge.freezeMoney||challenge.revealed))}
  function hidden(key){return !!(challenge&&!challenge.revealed&&challenge[key])}
  function statusText(){
    const value=total(),delta=target-value;
    if(delta===0)return'Exactly right ✓';
    return delta>0?money(delta)+' more needed':money(Math.abs(delta))+' too much';
  }
  function challengeProgress(){
    if(!challenge||challenge.mode!=='standard')return statusText();
    if(!challenge.revealed)return 'Build your amount, then press Check.';
    if(challenge.type==='make-target'||challenge.type==='find-change')return total()===target?'On target ✓':'Keep building';
    if(challenge.type==='exact-pieces'){
      const count=items.length,amountRight=total()===target,piecesRight=count===Number(challenge.targetPieces);
      if(amountRight&&piecesRight)return'On target ✓ · '+count+' pieces';
      return count+' / '+challenge.targetPieces+' pieces'+(amountRight?' · amount matched':'');
    }
    if(challenge.type==='fewest-pieces'){
      if(total()!==target)return'Keep building';
      if(items.length===Number(challenge.minPieces))return'On target ✓ · minimum pieces';
      return'Amount right · can you use fewer pieces?';
    }
    return statusText();
  }
  function resolveAnswerSource(source){
    if(source==='total')return money(total());
    if(source==='target')return money(target);
    if(source==='difference')return money(Math.abs(target-total()));
    if(source==='pieces')return String(items.length);
    return'';
  }
  function customAnswerSources(){
    return[
      {id:'total',label:'Current money total'},
      {id:'target',label:'Target amount'},
      {id:'difference',label:'Difference to target'},
      {id:'pieces',label:'Number of money pieces'}
    ];
  }
  function clearBoundHiding(){
    if(!challenge)return;
    challenge.hiddenTotal=false;challenge.hiddenTarget=false;challenge.hiddenStatus=false;
  }
  function applyBoundHiding(source){
    clearBoundHiding();if(!challenge)return;
    if(source==='total')challenge.hiddenTotal=true;
    else if(source==='target')challenge.hiddenTarget=true;
    else if(source==='difference')challenge.hiddenStatus=true;
  }
  function updateChallengeAnswer(){
    if(!challenge||challenge.answerMode!=='bound'||!challenge.answerSource)return;
    const answer=resolveAnswerSource(challenge.answerSource);if(answer!=='')challenge.answer=answer;
    const live=q('#mo-custom-live-answer');if(live)live.textContent=challenge.answer||'—';
    if(challenge.revealed){
      const shown=q('.gd-challenge-actions em',q('#gd-stage'));
      if(shown)shown.textContent='Answer: '+challenge.answer;
    }
  }
  function moneyObject(item){
    const d=metaFor(item.value),frozen=challengeFrozen();
    const style=d.kind==='note'
      ?'left:'+item.x+'px;top:'+item.y+'px;--mo-w:'+d.width+'px;--mo-h:'+d.height+'px'
      :'left:'+item.x+'px;top:'+item.y+'px;--mo-size:'+d.size+'px';
    const cls='gd-money-object gd-money-object--'+d.kind+' gd-money-object--'+d.shape+' gd-money-object--'+d.tone+(item.locked?' is-locked':'')+(frozen?' is-frozen':'');
    const face=d.kind==='coin'
      ?'<span class="gd-money-object__face gd-money-object__face--stylised">'+coinArt(d)+'</span>'
      :'<span class="gd-money-object__face"><strong>'+d.label+'</strong><small>CLASSROOM NOTE</small></span>';
    return '<button type="button" class="'+cls+'" data-gd-object="'+item.id+'" data-mo-value="'+d.value+'" style="'+style+'" aria-label="'+d.label+' stylised UK classroom '+(d.kind==='note'?'note':'coin')+(frozen?' fixed for this challenge':'')+'"'+(frozen?' disabled tabindex="-1"':'')+'>'+face+'</button>';
  }
  function toolbarHtml(history,selected){
    const frozen=challengeFrozen();
    return '<div class="gd-money-boardbar">'+
      '<div class="gd-object-toolbar gd-money-history">'+
        I.toolButton('add-money','plus','Add money',addOpen?'is-active':'',!freeMoneyEdit())+
        I.toolButton('undo','undo','Undo','',!history.canUndo||frozen)+
        I.toolButton('redo','redo','Redo','',!history.canRedo||frozen)+
      '</div>'+
      '</div>';
  }
  function moneyStagePaletteHtml(proxy=false){
    if(!freeMoneyEdit()||(!proxy&&!addOpen))return'';
    const picks=DENOMS.map(d=>{
      const visual=d.kind==='coin'
        ?'<span class="gd-money-pick__coin gd-money-pick__coin--'+d.shape+' gd-money-pick__coin--'+d.tone+'">'+coinArt(d)+'</span>'
        :'<span class="gd-money-pick__note gd-money-pick__note--'+d.tone+'">'+d.label+'</span>';
      return '<button type="button" class="gd-money-stage-pick gd-money-stage-pick--'+d.kind+'" data-gd-action="add-money-piece" data-mo-value="'+d.value+'" aria-label="Add '+d.label+'">'+visual+'<span>'+d.label+'</span></button>';
    }).join('');
    return '<div class="gd-money-stage-palette"'+(proxy?' id="mo-board-palette" hidden':'')+' role="group" aria-label="Add money">'+(proxy?'':'<button type="button" class="gd-money-palette-close" data-gd-action="close-money" aria-label="Close add money">×</button>')+picks+'</div>';
  }
  function positionMoneyContext(item){
    const panel=q('#mo-context'),canvas=q('#mo-canvas');if(!panel||!canvas||!item)return;
    const d=metaFor(item.value),w=d.kind==='note'?d.width:d.size,h=d.kind==='note'?d.height:d.size;
    if(contextMode==='combine'){panel.style.left='';panel.style.top='';return}
    const pw=panel.offsetWidth||180,ph=panel.offsetHeight||40;
    const x=clamp(item.x+w/2-pw/2,4,Math.max(4,canvas.clientWidth-pw-4));
    const below=item.y+h+12,above=item.y-ph-12;
    const y=below+ph<=canvas.clientHeight-4?below:above>=4?above:clamp(below,4,Math.max(4,canvas.clientHeight-ph-4));
    panel.style.left=x+'px';panel.style.top=y+'px';
  }
  function updateSelectionTools(item){
    const panel=q('#mo-context');if(!panel)return;
    if(contextMode!=='combine'){const canvas=q('#mo-canvas');canvas?.classList.remove('is-exchange-mode');if(canvas&&panel.parentElement!==canvas)canvas.appendChild(panel)}
    if(!item||challengeFrozen()){panel.hidden=true;contextMode='';contextItemId=null;exchangeSelection.clear();const canvas=q('#mo-canvas');canvas?.classList.remove('is-exchange-mode');if(canvas&&panel.parentElement!==canvas)canvas.appendChild(panel);qa('.gd-money-object.is-exchange-selected',canvas).forEach(el=>el.classList.remove('is-exchange-selected'));return}
    if(contextItemId!==item.id){contextMode='';contextItemId=item.id;exchangeSelection.clear()}
    if(contextMode==='combine'){renderExchangeSelection(item);return}
    panel.classList.remove('is-exchange-selection');
    qa('.gd-money-object.is-exchange-selected',q('#mo-canvas')).forEach(el=>el.classList.remove('is-exchange-selected'));
    const splits=splitOptions(item),canCombine=items.some(x=>x!==item&&!x.locked);
    const actions=(freeMoneyEdit()?I.toolButton('mo-copy','duplicate','Duplicate '+metaFor(item.value).label,'',false)+I.toolButton('mo-delete','delete','Delete '+metaFor(item.value).label,'gd-object-tool--danger',item.locked)+I.toolButton('mo-lock',item.locked?'unlock':'lock',item.locked?'Unlock':'Lock','',false):'')+
      (!item.locked&&splits.length?'<button type="button" class="gd-money-exchange-action'+(contextMode==='split'?' is-active':'')+'" data-gd-action="mo-split" aria-label="Split into change">'+I.icon('split')+'<span>Split</span></button>':'')+
      (!item.locked&&canCombine?'<button type="button" class="gd-money-exchange-action'+(contextMode==='combine'?' is-active':'')+'" data-gd-action="mo-combine" aria-label="Exchange for a larger denomination">'+I.icon('combine')+'<span>Exchange</span></button>':'');
    if(!actions){panel.hidden=true;return}
    const options=contextMode==='split'?splits.map((v,i)=>({label:piecesText(v),i})):[];
    panel.innerHTML='<div class="gd-money-context-actions">'+actions+'</div>'+
      (options.length?'<div class="gd-money-exchange-options"><strong>'+(contextMode==='split'?'Split '+metaFor(item.value).label+' into':'Exchange selected piece with others')+'</strong>'+options.map(o=>'<button type="button" data-mo-option="'+o.i+'">'+esc(o.label)+'</button>').join('')+'</div>':'');
    panel.hidden=false;
    panel.onpointerdown=e=>e.stopPropagation();
    panel.onclick=e=>{
      const button=e.target.closest('button');if(!button||button.disabled)return;
      e.preventDefault();e.stopPropagation();
      const action=button.dataset.gdAction,selected=controller.selected();if(!selected||selected.id!==item.id||challengeFrozen())return;
      if(action==='mo-copy'&&freeMoneyEdit())controller.duplicateSelected();
      else if(action==='mo-delete'&&freeMoneyEdit())controller.removeSelected();
      else if(action==='mo-lock'&&freeMoneyEdit())controller.toggleLockSelected();
      else if(action==='mo-split'||action==='mo-combine'){const mode=action==='mo-split'?'split':'combine';contextMode=contextMode===mode?'':mode;exchangeSelection.clear();if(contextMode==='combine')exchangeSelection.add(selected.id);updateSelectionTools(selected)}
      else if(button.hasAttribute('data-mo-option')){
        const i=Number(button.dataset.moOption),option=splitOptions(selected)[i];if(contextMode!=='split'||!option)return;
        contextMode='';controller.mutate(()=>replaceMoney([selected],option));controller.select(null);
      }
    };
    positionMoneyContext(item);
  }
  function selectedExchange(){
    const group=items.filter(x=>exchangeSelection.has(x.id)&&!x.locked);
    const sum=group.reduce((n,x)=>n+x.value,0);
    return {group,sum,denom:group.length>=2?DENOMS.find(d=>d.value===sum):null};
  }
  function renderExchangeSelection(anchor){
    const panel=q('#mo-context'),canvas=q('#mo-canvas');if(!panel||!canvas)return;
    const {group,sum,denom}=selectedExchange();
    panel.classList.add('is-exchange-selection');panel.hidden=false;
    if(panel.parentElement===canvas)canvas.before(panel);
    canvas.classList.add('is-exchange-mode');
    qa('.gd-money-object',canvas).forEach(el=>{
      const active=group.some(x=>String(x.id)===el.dataset.gdObject);
      el.classList.toggle('is-exchange-selected',active);el.setAttribute('aria-pressed',String(active));
    });
    panel.innerHTML='<div class="gd-money-exchange-head"><strong>Tap coins or notes to select</strong><button type="button" data-mo-cancel-exchange aria-label="Cancel exchange">×</button></div>'+
      '<div class="gd-money-exchange-summary"><span>'+group.length+' selected · '+money(sum)+'</span><button type="button" data-mo-confirm-exchange'+(denom?'':' disabled')+'>'+(denom?'Exchange for '+denom.label:'Exchange')+'</button></div>'+
      (group.length>=2&&!denom?'<small>No single UK denomination matches this total.</small>':'');
    panel.onpointerdown=e=>e.stopPropagation();
    panel.onclick=e=>{
      const button=e.target.closest('button');if(!button||button.disabled)return;
      e.preventDefault();e.stopPropagation();
      if(button.hasAttribute('data-mo-cancel-exchange')){contextMode='';exchangeSelection.clear();canvas.classList.remove('is-exchange-mode');controller.select(null);return}
      if(button.hasAttribute('data-mo-confirm-exchange')){
        const current=selectedExchange();if(!current.denom||challengeFrozen())return;
        contextMode='';exchangeSelection.clear();
        controller.mutate(()=>replaceMoney(current.group,[current.denom.value]));controller.select(null);
      }
    };
    positionMoneyContext(anchor);
  }
  function bindExchangeSelection(){
    const canvas=q('#mo-canvas');if(!canvas)return;
    function toggle(el){
      if(contextMode!=='combine'||challengeFrozen()||!el)return false;
      const piece=items.find(x=>String(x.id)===el.dataset.gdObject);if(!piece||piece.locked)return true;
      if(exchangeSelection.has(piece.id))exchangeSelection.delete(piece.id);else exchangeSelection.add(piece.id);
      renderExchangeSelection(controller.selected());return true;
    }
    canvas.addEventListener('pointerdown',e=>{
      if(contextMode!=='combine')return;
      const el=e.target.closest('.gd-money-object');
      if(el){e.preventDefault();e.stopImmediatePropagation();toggle(el)}
      else if(e.target===canvas||e.target.hasAttribute('data-gd-canvas-bg')){e.preventDefault();e.stopImmediatePropagation()}
    },true);
    canvas.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&toggle(e.target.closest('.gd-money-object'))){e.preventDefault();e.stopImmediatePropagation()}},true);
  }
  function toggleMoneyReveal(){if(!challenge)return;contextMode='';exchangeSelection.clear();challenge.revealed=!challenge.revealed;if(exchangeTask()&&challenge.paperFirst){if(challenge.revealed){challenge.modelBeforeReveal=snapshot();setValues(challenge.solutionValues)}else if(challenge.modelBeforeReveal){restore(challenge.modelBeforeReveal);delete challenge.modelBeforeReveal}renderControls();controller.refresh();return}if(challenge.mode==='standard'&&challenge.freezeMoney===false){if(challenge.revealed){challenge.modelBeforeReveal=snapshot();setValues(exchangeTask()?challenge.solutionValues:challenge.type==='exact-pieces'?(challenge.solutionValues||exactPieceValues(target,challenge.targetPieces)):amountValues(target))}else if(challenge.modelBeforeReveal){restore(challenge.modelBeforeReveal);delete challenge.modelBeforeReveal}}renderControls();controller.refresh()}
  function bindChallengeStageActions(){
    const endChallenge=q('[data-challenge-action="end"]',q('#gd-stage'));if(endChallenge)endChallenge.onclick=e=>{e.stopPropagation();clearChallenge()};
    const stage=q('#gd-stage');if(!stage||!challenge)return;
    const reveal=q('[data-board-action="reveal"]',stage);
    if(reveal)reveal.onclick=e=>{e.stopPropagation();toggleMoneyReveal()};
    const another=q('[data-challenge-action="another"]',stage);
    if(another)another.onclick=e=>{e.stopPropagation();if(challenge?.mode==='standard')generateChallenge(challenge.type)};
  }
  function renderMoney(selectedId,history={}){
    updateChallengeAnswer();
    const selected=items.find(x=>String(x.id)===String(selectedId))||null,m=canvasMetrics(items.length);
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Money challenge',pupil:(exchangeTask()&&challenge.paperFirst?CK.pupilSpec(challenge.type==='combine-change'?'money':'number',{hint:challenge.type==='combine-change'?'Amount':'Number of pieces'}):challenge.freezeMoney===false?CK.pupilSpec('model',{check:()=>exchangeTask()?exchangeCheck():total()===target&&(challenge.type!=='exact-pieces'||items.length===challenge.targetPieces)&&(challenge.type!=='fewest-pieces'||items.length===challenge.minPieces)}):challenge.type==='compare-amount'?CK.pupilSpec('choice',{choices:['Less than','Equal to','Greater than'],expected:total()<target?'Less than':total()>target?'Greater than':'Equal to'}):CK.pupilSpec('money')),actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'},{action:'end',label:'Back to setup'}]:[{action:'end',label:'End challenge'}]}):'';
    const embedded=document.documentElement.classList.contains('gd-embed-page');
    q('#gd-stage').innerHTML=banner+'<div class="gd-money-workbench'+(challengeFrozen()&&challenge?.mode==='standard'?' gd-money-workbench--fixed':'')+'">'+
      (challengeFrozen()&&challenge?.mode==='standard'?'':toolbarHtml(history,selected)+(embedded?moneyStagePaletteHtml(true):moneyStagePaletteHtml()))+
      '<div class="gd-money-canvas" id="mo-canvas" data-gd-canvas-bg style="min-height:'+m.height+'px;--mo-fixed-height:'+m.height+'px" aria-label="Money workbench">'+
        (items.length?items.map(moneyObject).join(''):'<div class="gd-money-empty" data-gd-canvas-bg>Choose a denomination to start building an amount.</div>')+
      '<div id="mo-context" class="gd-money-context" role="group" aria-label="Selected money actions" hidden></div></div>'+
      (!challenge?'<div class="gd-money-summary'+(targetActive?'':' gd-money-summary--total')+'">'+
        '<div><span>Total</span><strong data-mo-total>'+money(total())+'</strong></div>'+
        (targetActive?'<div><span>Target</span><strong data-mo-target-readout>'+money(target)+'</strong></div>'+
        '<div class="'+(total()===target?'is-match':'')+'"><span>Check</span><strong data-mo-status>'+statusText()+'</strong></div>':'')+
      '</div>':'')+
    '</div>';
    bindExchangeSelection();bindChallengeStageActions();
  }
  function workflowTabs(){
    return '<div class="gd-row gd-money-workflow-tabs" role="tablist" aria-label="Money workflow">'+
      '<button class="gd-btn'+(controlTab==='explore'?' gd-btn--primary':'')+'" type="button" data-mo-workflow="explore">Explore</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-mo-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+ 
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-mo-workflow="export">Export / reuse</button></div>';
  }
  function moneyPaletteHtml(){
    const picks=DENOMS.map(d=>{
      const visual=d.kind==='coin'
        ?'<span class="gd-money-pick__coin gd-money-pick__coin--'+d.shape+' gd-money-pick__coin--'+d.tone+'">'+coinArt(d)+'</span>'
        :'<span class="gd-money-pick__note gd-money-pick__note--'+d.tone+'">'+d.label+'</span>';
      return '<button type="button" class="gd-money-pick gd-money-pick--'+d.kind+'" data-mo-add="'+d.value+'" aria-label="Add '+d.label+'">'+visual+'<span>'+d.label+'</span></button>';
    }).join('');
    return '<div class="gd-field"><span>Add money</span><div class="gd-money-palette">'+picks+'</div>'+
      '<p class="gd-money-credit">Stylised UK classroom representations. Coin silhouettes and relative sizes are approximate; notes are not replicas.</p></div>'+
      '<div class="gd-row">'+btn('Tidy money','mo-tidy')+btn('Clear all','mo-clear')+'</div>';
  }
  function exploreControlsHtml(){
    return field('Target amount','<div class="gd-money-target-input"><span>£</span><input class="gd-input" id="mo-target" type="number" min="0.01" max="100" step="0.01" value="'+(target/100).toFixed(2)+'"></div>','Set any amount up to £100.')+
      moneyPaletteHtml()+'<div class="gd-row">'+btn('New random target','mo-random')+btn('Clear target','mo-clear-target')+'</div>'+
      '<p class="gd-help">Add coins or notes, then drag them around the workbench. Select one to duplicate, lock or delete it. Arrow keys nudge the selected item; Ctrl/Cmd+Z undoes changes.</p>';
  }
  function challengeControlsHtml(){
    if(!CK)return '<p class="gd-help">Challenge tools are unavailable.</p>';
    const tabs=CK.tabsHtml?CK.tabsHtml('mo',challengeTab):'';
    if(challengeTab==='custom'){
      const custom=challenge&&challenge.mode==='custom'?challenge:CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual'});
      return tabs+CK.editorHtml(custom,'mo',{answerSources:customAnswerSources(),generatedAnswerLabel:'Keep the generated answer'})+
        moneyPaletteHtml()+
        '<div class="gd-row">'+(challenge&&challenge.answer?'<button class="gd-btn" id="mo-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
        (challenge?'<button class="gd-btn" id="mo-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
        '<p class="gd-help">Custom challenges stay attached to the live money board. Link the answer to the total, target, difference or number of pieces when useful.</p>';
    }
    const picker=CK.pickerHtml(CHALLENGE_TEMPLATES,CHALLENGE_CATEGORIES,challengeCategory,challengeType,'mo');
    const repeat=!!(challenge&&challenge.mode==='standard'&&challenge.type===challengeType);
    const manipulate=challenge&&freeMoneyEdit()?moneyPaletteHtml():'';
    return tabs+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="mo-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
      (challenge&&challenge.mode!=='custom'?'<button class="gd-btn" id="mo-edit-challenge" type="button">Edit challenge</button>':'')+
      (challenge&&challenge.answer?'<button class="gd-btn" id="mo-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
      (challenge?'<button class="gd-btn" id="mo-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+manipulate;
  }
  function moSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function polygonPoints(sides,cx,cy,r,rotation=-90){
    return Array.from({length:sides},(_,i)=>{
      const a=(rotation+i*360/sides)*Math.PI/180;
      return (cx+r*Math.cos(a)).toFixed(1)+','+(cy+r*Math.sin(a)).toFixed(1);
    }).join(' ');
  }
  function exportHidden(key,pupil=false){
    if(!challenge)return false;
    return pupil?!!challenge[key]:hidden(key);
  }
  function exportPieces(pupil=false){
    if(pupil&&exchangeTask())return challenge.initialItems||items;
    if(pupil&&challenge&&challenge.mode==='standard'&&!challenge.freezeMoney)return[];
    return items;
  }
  function appendExportPiece(svg,item,layout,index){
    const d=metaFor(item.value),cw=layout.canvasW,ch=layout.canvasH;
    const baseW=d.kind==='note'?d.width:d.size,baseH=d.kind==='note'?d.height:d.size;
    const w=d.kind==='note'?baseW*1.28:baseW*1.12,h=d.kind==='note'?baseH*1.28:baseH*1.12;
    const sourceMaxX=Math.max(1,cw-baseW),sourceMaxY=Math.max(1,ch-baseH);
    const x=layout.x+clamp(Number(item.x||0)/sourceMaxX,0,1)*Math.max(0,layout.w-w);
    const y=layout.y+clamp(Number(item.y||0)/sourceMaxY,0,1)*Math.max(0,layout.h-h);
    const g=moSvgEl('g',{'data-mo-export-piece':String(item.value),'data-mo-export-index':index,transform:'translate('+x.toFixed(1)+' '+y.toFixed(1)+')'});
    if(d.kind==='note'){
      const fills={blue:'#dcecf1',orange:'#f2e0c8',purple:'#eadff0',red:'#f0dddd'};
      g.appendChild(moSvgEl('rect',{x:0,y:0,width:w,height:h,rx:8,fill:fills[d.tone]||'#e7eeee',stroke:'#657e84','stroke-width':2}));
      g.appendChild(moSvgEl('rect',{x:7,y:7,width:w-14,height:h-14,rx:5,fill:'none',stroke:'#ffffff','stroke-opacity':.65,'stroke-width':1.5}));
      g.appendChild(moSvgEl('text',{x:12,y:h*.5,'font-family':'Arial,sans-serif','font-size':20,'font-weight':900,fill:'#29434a','dominant-baseline':'middle'},d.label));
      g.appendChild(moSvgEl('text',{x:w-10,y:h-9,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':7,'font-weight':800,fill:'#60747a'},'UK PLAY NOTE'));
    }else{
      const size=Math.min(w,h),cx=size/2,cy=size/2,r=size/2-2;
      const fills={copper:'#c98768',silver:'#d7ddde',gold:'#dfc46b'};
      const stroke=d.tone==='copper'?'#8f5b45':d.tone==='bimetal'?'#8b6f2c':'#778b90';
      let outer=null;
      if(d.shape==='hept'){
        outer=moSvgEl('path',{d:coinPath('hept'),transform:'translate(2 2) scale('+((size-4)/100).toFixed(4)+')',fill:d.tone==='bimetal'?'#d6b452':(fills[d.tone]||'#d7ddde'),stroke,'stroke-width':2,'vector-effect':'non-scaling-stroke','data-mo-export-coin-shape':'hept'});
      }else if(d.shape==='dodec'){
        outer=moSvgEl('polygon',{points:polygonPoints(12,cx,cy,r,-75),fill:d.tone==='bimetal'?'#d6b452':(fills[d.tone]||'#d7ddde'),stroke,'stroke-width':2,'data-mo-export-coin-shape':'dodec'});
      }else{
        outer=moSvgEl('circle',{cx,cy,r,fill:d.tone==='bimetal'?'#d6b452':(fills[d.tone]||'#d7ddde'),stroke,'stroke-width':2,'data-mo-export-coin-shape':'round'});
      }
      g.appendChild(outer);
      if(d.tone==='bimetal')g.appendChild(moSvgEl('circle',{cx,cy,r:r*.58,fill:'#e2e7e8',stroke:'#87979a','stroke-width':1.4}));
      g.appendChild(moSvgEl('text',{x:cx,y:cy+1,'text-anchor':'middle','dominant-baseline':'middle','font-family':'Arial,sans-serif','font-size':Math.max(11,size*.25),'font-weight':900,fill:'#30474d'},d.label));
    }
    svg.appendChild(g);
  }
  function moneyExportSvg({pupil=false}={}){
    const focused=pupil&&challenge?.mode==='standard',width=1000,height=focused?485:620,board={x:64,y:92,w:872,h:360};
    const liveCanvas=q('#mo-canvas'),canvasW=Math.max(280,liveCanvas?.clientWidth||760),canvasH=Math.max(320,liveCanvas?.clientHeight||390);
    const svg=moSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'UK money model','data-mo-export':'money'});
    svg.appendChild(moSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(moSvgEl('text',{x:64,y:48,'font-family':'Arial,sans-serif','font-size':27,'font-weight':900,fill:'#24343b'},'UK money'));
    if(!pupil)svg.appendChild(moSvgEl('text',{x:936,y:48,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':13,'font-weight':700,fill:'#708287'},exportPieces(pupil).length+' piece'+(exportPieces(pupil).length===1?'':'s')));
    svg.appendChild(moSvgEl('rect',{x:board.x,y:board.y,width:board.w,height:board.h,rx:18,fill:'#f7faf9',stroke:'#afc1c4','stroke-width':2,'data-mo-export-board':'1'}));
    for(let gx=board.x+20;gx<board.x+board.w;gx+=40)for(let gy=board.y+20;gy<board.y+board.h;gy+=40)svg.appendChild(moSvgEl('circle',{cx:gx,cy:gy,r:1.2,fill:'#cbd7d8'}));
    exportPieces(pupil).forEach((item,index)=>appendExportPiece(svg,item,{...board,canvasW,canvasH},index));

    const construction=!!(pupil&&challenge&&challenge.mode==='standard'&&!challenge.freezeMoney);
    const totalText=construction?'—':exportHidden('hiddenTotal',pupil)?'?':money(total());
    const targetText=exportHidden('hiddenTarget',pupil)?'?':money(target);
    let statusTextExport=exportHidden('hiddenStatus',pupil)?'?':(construction?'Build the target':challengeProgress());
    const summaries=[['Total',totalText,'total'],['Target',targetText,'target'],['Check',statusTextExport,'status']];
    const gap=14,cardW=(board.w-gap*2)/3,cardY=478;
    if(!pupil&&!challenge)summaries.filter(row=>targetActive||row[2]==='total').forEach((row,index)=>{
      const x=board.x+index*(cardW+gap);
      svg.appendChild(moSvgEl('rect',{x,y:cardY,width:cardW,height:82,rx:12,fill:index===2&&statusTextExport.includes('✓')?'#e8f6ef':'#f5f8f8',stroke:'#d4dfe1','stroke-width':1.5}));
      svg.appendChild(moSvgEl('text',{x:x+14,y:cardY+24,'font-family':'Arial,sans-serif','font-size':11,'font-weight':850,fill:'#708287'},row[0].toUpperCase()));
      svg.appendChild(moSvgEl('text',{x:x+14,y:cardY+56,'font-family':'Arial,sans-serif','font-size':18,'font-weight':900,fill:'#304b52','data-mo-export-summary':row[2]},row[1]));
    });
    svg.appendChild(moSvgEl('text',{x:936,y:height-18,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return moneyExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    const construction=challenge.mode==='standard'&&!challenge.freezeMoney;
    return X.composeChallengeCardSvg(moneyExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Money challenge',
      prompt:prompt+(construction?' Draw the coins or notes, or list their denominations.':''),
      responseLabel:construction?'Working / answer':'Answer',
      responseLines:construction?Math.max(2,responseLines):responseLines
    });
  }
  function exportFilename(){
    if(exportMode==='challenge'&&challenge)return 'money-'+(challenge.type||'challenge');
    return 'uk-money-'+Math.max(0,total())+'p';
  }
  function exportMessage(message){exportStatus=message;const el=q('#mo-export-status');if(el)el.textContent=message}
  async function runExport(kind){
    if(!X){exportMessage('Export tools are unavailable.');return}
    const targetSvg=exportTargetSvg(),name=exportFilename();
    try{
      if(kind==='copy'){await X.copyPng(targetSvg);exportMessage('Image copied.')}
      else if(kind==='png'){await X.downloadPng(targetSvg,name);exportMessage('PNG downloaded.')}
      else if(kind==='svg'){X.downloadSvg(targetSvg,name);exportMessage('SVG downloaded.')}
      else if(kind==='print'){X.printSvg(targetSvg,{title:'',landscape:exportMode!=='challenge'});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'Could not export this money model.')}
  }
  function exportControlsHtml(){
    const canCard=!!challenge;
    if(!canCard&&exportMode==='challenge')exportMode='board';
    return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export a clean vector money model or a pupil-ready challenge card.</span></div></div>'+
      (canCard?'<div class="nl-export-mode mo-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-mo-export-mode="challenge">Challenge card</button>'+
        '<button type="button" class="'+(exportMode==='board'?'is-active':'')+'" data-mo-export-mode="board">Money board</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="mo-response-lines">'+
          [1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+
          '</select></label><p class="gd-help">Challenge-card export always re-hides pupil answers. Construction challenges export without the teacher\'s trial money.</p>'
        :'<p class="gd-help">Money-board export keeps the current vector coins/notes, arrangement and visible summary without editing controls.</p>')+
      '<div class="nl-export-grid mo-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="mo-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'challenge':'image')+'</button>'+
        '<button class="gd-btn" id="mo-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="mo-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="mo-print" type="button">Print / PDF</button>'+
      '</div><p class="gd-help" id="mo-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }

  function controlsHtml(){return workflowTabs()+(controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():exploreControlsHtml())}
  function renderControls(){const panel=q('#gd-controls');if(panel)panel.innerHTML=controlsHtml();bindControls()}
  function restoreBeforeChallenge(){if(beforeChallenge){restore(beforeChallenge);beforeChallenge=null}}
  function clearChallenge(){
    restoreBeforeChallenge();controller?.resetHistory?.();contextMode='';contextItemId=null;addOpen=false;challenge=null;challengeTab='standard';controlTab='explore';exportMode='board';exportStatus='';renderControls();controller.refresh();
  }
  function enterCustomChallenge(){
    if(!beforeChallenge)beforeChallenge=snapshot();
    controller?.resetHistory?.();contextMode='';contextItemId=null;
    const wasCustom=challenge?.mode==='custom';
    if(CK)challenge=CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''});
    if(!wasCustom)clearBoundHiding();
    challenge.freezeMoney=false;challenge.revealed=false;
    challengeTab='custom';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();controller.refresh();
  }
  function setCustomAnswerSource(source){
    if(!challenge||challenge.mode!=='custom')return;
    if(source==='manual'){challenge.answerMode='manual';challenge.answerSource='';clearBoundHiding()}
    else if(source==='generated'){challenge.answerMode='bound';challenge.answerSource='';clearBoundHiding()}
    else{challenge.answerMode='bound';challenge.answerSource=source;challenge.answer=resolveAnswerSource(source);applyBoundHiding(source)}
    challenge.revealed=false;renderControls();controller.refresh();
  }
  // Saved procedural exchange questions must not survive a challenge-policy upgrade.
  function migrateLegacyExchange(){
    if(challenge?.mode!=='standard'||!['split-change','combine-change','exchange-fewest'].includes(challenge.type)||challenge.paperFirst===true)return false;
    const type=challenge.type,old=challenge;
    const initial=Array.isArray(old.initialItems)?old.initialItems.map(x=>Number(x.value)):[];
    const solution=Array.isArray(old.solutionValues)?old.solutionValues.map(Number):[];
    const valid=values=>values.length>0&&values.every(v=>DENOMS.some(d=>d.value===v));
    const sum=values=>values.reduce((a,b)=>a+b,0);
    if(!valid(initial)||!valid(solution)||sum(initial)!==sum(solution)||
      (type==='split-change'&&(initial.length!==1||solution.length<2||!solution.every(v=>v===solution[0])||metaFor(solution[0]).kind!=='coin'))||
      (type==='combine-change'&&(initial.length<2||solution.length!==1))){
      generateChallenge(type);return true;
    }
    target=sum(initial);setValues(initial);
    const answerValues=type==='exchange-fewest'?amountValues(target):solution;
    const prompt=type==='split-change'?'How many '+metaFor(solution[0]).label+' coins are worth the same as the money shown?':type==='combine-change'?'Which single coin or note is worth the same as all the money shown?':'What is the fewest number of coins or notes that have the same total value as the money shown?';
    const answer=type==='split-change'?String(solution.length):type==='combine-change'?money(target):String(answerValues.length);
    challenge=challengeObject(type,prompt,answer,{paperFirst:true,freezeMoney:true,solutionValues:answerValues,initialItems:items.map(x=>({...x})),solutionExplanation:piecesText(initial)+' = '+piecesText(answerValues)});
    controller?.resetHistory?.();contextMode='';contextItemId=null;exchangeSelection.clear();addOpen=false;challengeType=type;challengeCategory='exchange';challengeTab='standard';exportMode='challenge';
    return true;
  }
  function generateChallenge(type){
    const template=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!template)return;
    if(!beforeChallenge)beforeChallenge=snapshot();else restore(beforeChallenge);
    controller?.resetHistory?.();contextMode='';contextItemId=null;addOpen=false;
    let values=[],shown=0;
    if(type==='count-total'){
      values=randomShownValues();setValues(values);target=total();
      challenge=challengeObject(type,'How much money is shown altogether?',money(total()),{hiddenTotal:true,hiddenTarget:true,hiddenStatus:true});
    }else if(type==='compare-amount'){
      values=randomShownValues();setValues(values);shown=total();
      const delta=[-200,-100,-50,0,50,100,200][randomInt(0,6)];target=Math.max(1,shown+delta);
      const relation=shown<target?'less than':shown>target?'greater than':'equal to';
      challenge=challengeObject(type,'Is the money shown less than, equal to or greater than '+money(target)+'?',relation+' '+money(target),{hiddenTotal:true,hiddenStatus:true});
    }else if(type==='missing-to-target'){
      const gap=[10,20,50,100,200][randomInt(0,4)];target=randomStep(Math.max(100,gap+50),1000,10);
      shown=Math.max(0,target-gap);setValues(amountValues(shown));
      challenge=challengeObject(type,'The money shown needs to reach '+money(target)+'. How much more is needed?',money(gap),{hiddenStatus:true,hiddenTotal:true});
    }else if(type==='make-target'){
      target=randomStep(35,1500,5);items=[];nextId=1;
      challenge=challengeObject(type,'Show coins or notes worth exactly '+money(target)+'.',money(target),{freezeMoney:false,hiddenStatus:false});
    }else if(type==='exact-pieces'){
      const pieces=randomInt(3,5),pool=[5,10,20,50,100,200],chosen=[];
      for(let i=0;i<pieces;i++)chosen.push(pool[randomInt(0,pool.length-1)]);
      target=chosen.reduce((a,b)=>a+b,0);items=[];nextId=1;
      challenge=challengeObject(type,'Show '+money(target)+' using exactly '+pieces+' coins or notes.',money(target)+' using '+pieces+' pieces',{freezeMoney:false,targetPieces:pieces,solutionValues:chosen.slice()});
    }else if(type==='fewest-pieces'){
      do{target=randomStep(55,1500,5)}while(minimumPieces(target)<2||minimumPieces(target)>6);
      items=[];nextId=1;
      challenge=challengeObject(type,'Show '+money(target)+' using the fewest possible coins or notes.',minimumPieces(target)+' pieces',{freezeMoney:false,minPieces:minimumPieces(target)});
    }else if(type==='split-change'||type==='combine-change'||type==='exchange-fewest'){
      const pairs=[[10,1],[10,2],[20,5],[50,10],[100,20],[200,50],[500,100],[1000,200],[20,2],[50,5],[100,10],[200,20]];
      const [large,small]=pairs[randomInt(0,pairs.length-1)],n=large/small;
      target=large;
      let initial=type==='split-change'?[large]:Array(n).fill(small),solution=type==='split-change'?Array(n).fill(small):[large];
      if(type==='combine-change'&&Math.random()<.5){
        const mixed=splitOptions({value:large}).find(v=>new Set(v).size>1);
        if(mixed)initial=mixed;
      }
      if(type==='exchange-fewest'){
        const pools=[[20,20,10,10,10,10,10,10],[50,20,20,10,5,5],[100,50,20,20,10,10,5],[200,100,100,50,20,20,10,5],[50,50,20,10,10,5],[100,20,20,20,10,5,5]];
        initial=pools[randomInt(0,pools.length-1)].slice();target=initial.reduce((a,b)=>a+b,0);solution=amountValues(target);
      }
      setValues(initial);
      const prompt=type==='split-change'?'How many '+metaFor(small).label+' coins are worth the same as the money shown?':type==='combine-change'?'Which single coin or note is worth the same as all the money shown?':'What is the fewest number of coins or notes that have the same total value as the money shown?';
      const answer=type==='split-change'?String(n):type==='combine-change'?money(target):String(solution.length);
      challenge=challengeObject(type,prompt,answer,{paperFirst:true,freezeMoney:true,solutionValues:solution,initialItems:items.map(x=>({...x})),solutionExplanation:type==='split-change'?metaFor(large).label+' = '+piecesText(solution):piecesText(initial)+' = '+piecesText(solution)});

    }else{
      const tender=[500,1000,2000][randomInt(0,2)];
      const price=randomStep(Math.max(50,Math.round(tender*.25)),tender-25,5);
      target=tender-price;items=[];nextId=1;
      challenge=challengeObject(type,'An item costs '+money(price)+'. You pay with '+money(tender)+'. Show the coins or notes you could receive as change.',money(target),{freezeMoney:false,hiddenTarget:true,hiddenStatus:true,price,tender});
    }
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';exportMode='challenge';exportStatus='';renderControls();controller.refresh();
  }
  function bindMoneyButtons(){
    qa('[data-mo-add]',q('#gd-controls')).forEach(button=>button.onclick=()=>{
      if(!freeMoneyEdit())return;
      let id=null;controller.mutate(()=>{id=addMoney(button.dataset.moAdd)});controller.select(id?.id);
    });
    const tidy=q('#mo-tidy');if(tidy)tidy.onclick=()=>{if(!challengeFrozen())controller.mutate(tidyMoney)};
    const clear=q('#mo-clear');if(clear)clear.onclick=()=>{if(!items.length||!freeMoneyEdit())return;controller.mutate(()=>{items=[]})};
  }
  function bindControls(){
    qa('[data-mo-workflow]',q('#gd-controls')).forEach(button=>button.onclick=()=>{controlTab=button.dataset.moWorkflow;renderControls()});
    bindMoneyButtons();
    if(controlTab==='export'){
      qa('[data-mo-export-mode]',q('#gd-controls')).forEach(button=>button.onclick=()=>{exportMode=button.dataset.moExportMode;exportStatus='';renderControls()});
      const lines=q('#mo-response-lines');if(lines)lines.onchange=()=>{responseLines=clamp(Math.round(num(lines.value,1)),1,4)};
      const actions=[['mo-copy-image','copy'],['mo-png','png'],['mo-svg-download','svg'],['mo-print','print']];
      actions.forEach(([id,kind])=>{const button=q('#'+id);if(button)button.onclick=()=>runExport(kind)});
      return;
    }
    if(controlTab==='explore'){
      const targetInput=q('#mo-target');if(targetInput)targetInput.oninput=()=>{
        if(challenge)return;
        target=Math.max(1,Math.round(Math.max(.01,num(targetInput.value,target/100))*100));targetActive=true;controller.refresh();
      };
      const clearTarget=q('#mo-clear-target');if(clearTarget)clearTarget.onclick=()=>{if(!challenge)controller.mutate(()=>{targetActive=false})};
      const random=q('#mo-random');if(random)random.onclick=()=>{
        if(challenge)return;
        controller.mutate(()=>{target=Math.floor(Math.random()*2000)+1;targetActive=true;items=[]});
        const input=q('#mo-target');if(input)input.value=(target/100).toFixed(2);
      };
      return;
    }
    qa('[data-mo-challenge-tab]',q('#gd-controls')).forEach(button=>button.onclick=()=>{
      if(button.dataset.moChallengeTab==='custom')enterCustomChallenge();
      else{challengeTab='standard';renderControls()}
    });
    qa('[data-mo-challenge-cat]',q('#gd-controls')).forEach(button=>button.onclick=()=>{
      challengeCategory=button.dataset.moChallengeCat;
      const first=CHALLENGE_TEMPLATES.find(t=>t.category===challengeCategory);if(first)challengeType=first.id;
      renderControls();
    });
    qa('[data-mo-challenge-type]',q('#gd-controls')).forEach(button=>button.onclick=()=>{challengeType=button.dataset.moChallengeType;renderControls()});
    const generate=q('#mo-generate');if(generate)generate.onclick=()=>generateChallenge(challengeType);
    const edit=q('#mo-edit-challenge');if(edit)edit.onclick=enterCustomChallenge;
    const reveal=q('#mo-reveal');if(reveal)reveal.onclick=toggleMoneyReveal;
    const clearChallengeBtn=q('#mo-clear-challenge');if(clearChallengeBtn)clearChallengeBtn.onclick=clearChallenge;
    if(challengeTab==='custom'&&challenge){
      const title=q('#mo-custom-title');if(title)title.oninput=()=>{challenge.title=title.value.slice(0,100);controller.refresh()};
      const prompt=q('#mo-custom-prompt');if(prompt)prompt.oninput=()=>{challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);controller.refresh()};
      const source=q('#mo-custom-answer-source');if(source)source.onchange=()=>setCustomAnswerSource(source.value);
      const answer=q('#mo-custom-answer');if(answer)answer.oninput=()=>{challenge.answer=answer.value.slice(0,400);challenge.answerMode='manual';challenge.answerSource='';controller.refresh()};
      qa('[data-gd-rich-action]',q('#gd-controls')).forEach(button=>button.onclick=()=>{CK.applyFormat(prompt,button.dataset.gdRichAction);challenge.promptHtml=CK.sanitiseRichHtml(prompt.innerHTML);challenge.prompt=CK.plainText(challenge.promptHtml);controller.refresh()});
    }
  }

  seed();
  setPanels(controlsHtml(),'');
  controller=I.mount({
    getItems:()=>items,
    getCanvas:()=>q('#mo-canvas'),
    getActionRoot:()=>q('#gd-stage'),
    getState:snapshot,
    setState:restore,
    render:renderMoney,
    duplicate:duplicateMoney,
    remove:item=>{const index=items.indexOf(item);if(index>=0)items.splice(index,1)},
    toggleLock:item=>{item.locked=!item.locked},
    isLocked:item=>!!item.locked||challengeFrozen(),
    canAction:action=>['undo','redo'].includes(action)?!challengeFrozen():freeMoneyEdit(),
    snap:4,
    nudgeStep:4,
    onAction:(action,api,button)=>{
      if(action==='add-money'){if(!freeMoneyEdit())return;addOpen=!addOpen;api.refresh()}
      else if(action==='add-money-piece'&&freeMoneyEdit()){
        let id=null;api.mutate(()=>{id=addMoney(button?.dataset?.moValue)});api.select(id?.id);
      }else if(action==='close-money'){addOpen=false;api.refresh()}
    },
    onMove:item=>positionMoneyContext(item),
    onSelectionChange:item=>{updateSelectionTools(item)}
  });
  bindControls();
  controller.refresh();
  G.lessonState?.register('money',()=>({diagram:snapshot(),challenge,beforeChallenge,pupil:CK?.capturePupil?.(challenge),controlTab,challengeTab,challengeCategory,challengeType,exportMode,responseLines}),saved=>{
    restore(saved.diagram);challenge=saved.challenge?CK.normalise(saved.challenge):null;beforeChallenge=saved.beforeChallenge||null;
    if(Object.prototype.hasOwnProperty.call(saved,'controlTab'))controlTab=saved.controlTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeTab'))challengeTab=saved.challengeTab;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeCategory'))challengeCategory=saved.challengeCategory;
    if(Object.prototype.hasOwnProperty.call(saved,'challengeType'))challengeType=saved.challengeType;
    if(Object.prototype.hasOwnProperty.call(saved,'exportMode'))exportMode=saved.exportMode;
    if(Object.prototype.hasOwnProperty.call(saved,'responseLines'))responseLines=saved.responseLines;
    const migrated=migrateLegacyExchange();
    if(!migrated)CK?.restorePupil?.(challenge,saved.pupil);renderControls();controller.refresh();
  });

}

Object.assign(G,{numberLine,placeValue,fractionWall,barModel,hundredSquare,multiplicationGrid,arrayBuilder,clockTool,moneyTool});
})(window.TT99Goodies);
