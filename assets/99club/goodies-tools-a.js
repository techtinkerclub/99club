(function(G){
'use strict';
if(!G)return;
const {q,qa,clamp,num,money,field,btn,setPanels}=G;
function numberLine(){let s={min:-10,max:20,step:1,marker:5};function draw(){s.min=num(q('#nl-min').value,s.min);s.max=num(q('#nl-max').value,s.max);if(s.max<=s.min)s.max=s.min+1;s.step=Math.max(.1,num(q('#nl-step').value,s.step));s.marker=clamp(num(q('#nl-marker').value,s.marker),s.min,s.max);q('#nl-marker').min=s.min;q('#nl-marker').max=s.max;q('#nl-marker').step=s.step;const range=s.max-s.min,n=Math.floor(range/s.step);const maxTicks=50,skip=Math.max(1,Math.ceil(n/maxTicks));let html='<div class="gd-vis"><div class="gd-numberline"><div class="gd-numberline__line"></div>';for(let i=0;i<=n;i+=skip){const v=s.min+i*s.step,p=(v-s.min)/range*100;html+=`<span class="gd-numberline__tick" style="left:${p}%"></span><span class="gd-numberline__label" style="left:${p}%">${Number(v.toFixed(4))}</span>`}const p=(s.marker-s.min)/range*100;html+=`<span class="gd-numberline__marker" style="left:${p}%">${Number(s.marker.toFixed(2))}</span></div><div class="gd-readout">Marker: ${Number(s.marker.toFixed(2))}</div></div>`;q('#gd-stage').innerHTML=html}
setPanels(`${field('Minimum','<input class="gd-input" id="nl-min" type="number" value="-10">')}${field('Maximum','<input class="gd-input" id="nl-max" type="number" value="20">')}${field('Step','<input class="gd-input" id="nl-step" type="number" min="0.1" step="0.1" value="1">')}${field('Move marker','<input class="gd-input" id="nl-marker" type="range" value="5">')}<div class="gd-row">${btn('− step','nl-down')}${btn('+ step','nl-up')}</div><p class="gd-help">Change the range for negatives, decimals or larger-number work.</p>`,'');['nl-min','nl-max','nl-step','nl-marker'].forEach(id=>q('#'+id).addEventListener('input',draw));q('#nl-down').onclick=()=>{q('#nl-marker').value=clamp(num(q('#nl-marker').value)-s.step,s.min,s.max);draw()};q('#nl-up').onclick=()=>{q('#nl-marker').value=clamp(num(q('#nl-marker').value)+s.step,s.min,s.max);draw()};draw()}

function placeValue(){
  const I=G.interaction,CK=G.challengeKit,X=G.exportTools;
  if(!I){q('#gd-stage').innerHTML='<p class="gd-empty">The interactive place-value board could not start.</p>';return;}
  const places=[
    {label:'10,000',name:'ten thousands',value:10000,color:'#c9dbf2'},
    {label:'1,000',name:'thousands',value:1000,color:'#d7cef0'},
    {label:'100',name:'hundreds',value:100,color:'#f0cfda'},
    {label:'10',name:'tens',value:10,color:'#f2d9bf'},
    {label:'1',name:'ones',value:1,color:'#f3df86'},
    {label:'0.1',name:'tenths',value:.1,color:'#cce6dc'},
    {label:'0.01',name:'hundredths',value:.01,color:'#cde2ee'}
  ];
  const CHALLENGE_CATEGORIES=[
    {id:'read',label:'Read & place value'},
    {id:'build',label:'Build & regroup'},
    {id:'reason',label:'Reasoning'}
  ];
  const CHALLENGE_TEMPLATES=[
    {id:'read-number',category:'read',title:'Read the number',desc:'Work out the number represented by the counters.'},
    {id:'digit-value',category:'read',title:'Value of a digit',desc:'Use the board to identify a digit\'s place value.'},
    {id:'build-number',category:'build',title:'Build the number',desc:'Make a target number with place-value counters.'},
    {id:'non-standard',category:'build',title:'Non-standard representation',desc:'Interpret a value before regrouping it.'},
    {id:'zero-placeholder',category:'reason',title:'Zero placeholder',desc:'Diagnose a common place-value misconception.'}
  ];
  let tokens=[],next=1,controller=null,resizeObserver=null,resizeFrame=0,lastStageWidth=0,notice='';
  let controlTab='setup',challengeTab='standard',challengeCategory='read',challengeType='read-number',challenge=null,beforeChallenge=null;
  let exportMode='diagram',responseLines=1,exportStatus='';

  function clean(v){return Math.round((Number(v)||0)*100)/100}
  function format(v){return clean(v).toLocaleString('en-GB',{minimumFractionDigits:0,maximumFractionDigits:2})}
  function counts(){const out=Array(places.length).fill(0);tokens.forEach(t=>{if(out[t.place]!=null)out[t.place]++});return out}
  function total(){return clean(tokens.reduce((sum,t)=>sum+(places[t.place]?.value||0),0))}
  function nonStandard(){return counts().some(n=>n>9)}
  function stateSnapshot(){return{tokens:JSON.parse(JSON.stringify(tokens)),next}}
  function restoreState(value){
    tokens=Array.isArray(value?.tokens)?value.tokens.map(t=>({...t,place:clamp(Math.round(num(t.place,4)),0,places.length-1)})):[];
    next=Math.max(1,Math.round(num(value?.next,1)));
    notice='';
  }
  function buildFromNumber(raw){
    const value=clamp(clean(num(raw,0)),0,99999.99);
    const fixed=value.toFixed(2).split('.');
    const digits=(fixed[0].padStart(5,'0')+fixed[1]).split('').map(Number);
    tokens=[];next=1;
    digits.forEach((digit,place)=>{
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
  function summaryHidden(kind){
    if(!challenge||challenge.revealed)return false;
    if(Array.isArray(challenge.hiddenSummary)&&challenge.hiddenSummary.includes(kind))return true;
    return challenge.answerMode==='bound'&&challenge.answerSource===kind;
  }
  function columnCountHidden(index){
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
  function randomBoardValue({decimal=true,min=1,max=9999}={}){
    const whole=min+Math.floor(Math.random()*Math.max(1,max-min+1));
    if(!decimal||Math.random()<.45)return whole;
    return clean(whole+(1+Math.floor(Math.random()*99))/100);
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
    if(type==='read-number'){
      const value=randomBoardValue({decimal:true,min:12,max:9999});
      buildFromNumber(value);
      challenge=challengeObject(type,'What number is represented by the place-value counters?',format(value),{hiddenSummary:['total','expanded']});
    }else if(type==='build-number'){
      const target=randomBoardValue({decimal:true,min:10,max:9999});
      tokens=[];next=1;layoutTokens();
      challenge=challengeObject(type,'Build '+format(target)+' using the place-value counters. Use the live total to check your work.',format(target));
    }else if(type==='digit-value'){
      const placeIndex=1+Math.floor(Math.random()*(places.length-1)),digit=2+Math.floor(Math.random()*7);
      const digits=Array(places.length).fill(0);
      digits[placeIndex]=digit;
      const supportIndex=placeIndex===4?3:4;
      digits[supportIndex]=digits[supportIndex]===digit?1:1+Math.floor(Math.random()*4);
      const value=clean(digits.reduce((sum,d,i)=>sum+d*places[i].value,0));
      buildFromNumber(value);
      challenge=challengeObject(type,'What is the value of the digit '+digit+' in the '+places[placeIndex].name+' column?',format(digit*places[placeIndex].value),{hiddenSummary:['total','expanded']});
    }else if(type==='non-standard'){
      const value=randomBoardValue({decimal:false,min:120,max:8999});
      buildFromNumber(value);
      const cs=counts(),candidates=[];
      for(let i=0;i<places.length-1;i++)if(cs[i]>0)candidates.push(i);
      const exchange=candidates[Math.floor(Math.random()*candidates.length)]??3;
      const tokenIndex=tokens.findIndex(t=>t.place===exchange);
      if(tokenIndex>=0)tokens.splice(tokenIndex,1);
      for(let n=0;n<10;n++)tokens.push({id:next++,place:exchange+1,x:0,y:0,locked:false});
      layoutTokens();
      challenge=challengeObject(type,'This is a non-standard representation. What number does it represent? Regroup it to check.',format(value),{hiddenSummary:['total','expanded']});
    }else{
      const examples=[
        {value:4052,claim:'452',place:'hundreds'},
        {value:7008,claim:'78',place:'hundreds and tens'},
        {value:5060,claim:'560',place:'hundreds'},
        {value:9015,claim:'915',place:'hundreds'}
      ],pick=examples[Math.floor(Math.random()*examples.length)];
      buildFromNumber(pick.value);
      challenge=challengeObject(type,'A pupil says this board represents '+pick.claim+' because there are no counters in the '+pick.place+' place. Are they correct?','No. It represents '+format(pick.value)+'. Zero is acting as a placeholder.',{hiddenSummary:['total','expanded']});
    }
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';
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
    const picker=CK.pickerHtml(CHALLENGE_TEMPLATES,CHALLENGE_CATEGORIES,challengeCategory,challengeType,'pv');
    const repeat=!!(challenge&&challenge.mode==='standard'&&challenge.type===challengeType);
    return tabs+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="pv-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
      (challenge&&challenge.mode!=='custom'?'<button class="gd-btn" id="pv-edit-challenge" type="button">Edit challenge</button>':'')+
      (challenge&&challenge.answer?'<button class="gd-btn" id="pv-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
      (challenge?'<button class="gd-btn" id="pv-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>';
  }
  function setupControlsHtml(){
    return field('Quick setup number','<div class="gd-row"><input class="gd-input" id="pv-value" type="number" min="0" max="99999.99" step="0.01" value="'+clean(total()).toFixed(total()%1?2:0)+'"><button class="gd-btn" id="pv-build" type="button">Build</button></div>','Use this to prepare a board quickly; after that, work directly with the counters.')+
      '<div class="gd-row">'+btn('Random whole number','pv-random')+btn('Random decimal','pv-dec')+'</div>'+
      btn('Regroup counters','pv-regroup')+btn('Clear board','pv-clear')+
      '<p class="gd-help">Tap + at the top of a column to add one counter. Drag counters between columns; the represented number updates with their place value. Select a counter for duplicate, lock and delete. Left/right arrow keys move a selected counter one place.</p>';
  }
  function exportControlsHtml(){
    const canCard=!!challenge;
    if(!canCard&&exportMode==='challenge')exportMode='diagram';
    return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export a clean vector board or a pupil-ready challenge card.</span></div></div>'+
      (canCard?'<div class="nl-export-mode pv-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-pv-export-mode="challenge">Challenge card</button>'+
        '<button type="button" class="'+(exportMode==='diagram'?'is-active':'')+'" data-pv-export-mode="diagram">Board only</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="pv-response-lines">'+
          [1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+
          '</select></label><p class="gd-help">The pupil card contains the question, the place-value board and blank answer space. Reveal answer is never copied into the pupil version.</p>'
        :'<p class="gd-help">Board-only export contains the mathematical board, counters and visible readouts without the editing controls.</p>')+
      '<div class="nl-export-grid pv-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="pv-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'challenge':'image')+'</button>'+
        '<button class="gd-btn" id="pv-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="pv-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="pv-print" type="button">Print / PDF</button>'+
      '</div><p class="gd-help" id="pv-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }
  function pvSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function boardExportSvg({pupil=false}={}){
    const cs=counts(),width=1000,pad=34,boardX=pad,boardY=26,boardW=width-pad*2,colW=boardW/places.length;
    const maxCount=Math.max(1,...cs),perRow=3,rows=Math.max(1,Math.ceil(maxCount/perRow)),headerH=80,counterStep=38;
    const pupilSummaryHidden=kind=>!!(challenge&&(Array.isArray(challenge.hiddenSummary)&&challenge.hiddenSummary.includes(kind)||challenge.answerMode==='bound'&&challenge.answerSource===kind));
    const pupilColumnHidden=index=>!!(challenge&&challenge.answerMode==='bound'&&(challenge.answerSource==='count:'+index||challenge.answerSource==='value:'+index));
    const boardH=headerH+30+rows*counterStep,hideTotal=pupil?pupilSummaryHidden('total'):summaryHidden('total'),hideExpanded=pupil?pupilSummaryHidden('expanded'):summaryHidden('expanded');
    const omitSummary=pupil&&challenge?.type==='build-number';
    const summaryH=omitSummary?0:94,height=boardY+boardH+summaryH+42;
    const svg=pvSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Place value board','data-pv-export':'board'});
    svg.appendChild(pvSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(pvSvgEl('rect',{x:boardX,y:boardY,width:boardW,height:boardH,rx:16,fill:'#ffffff',stroke:'#aebfc2','stroke-width':2,'data-pv-export-board':'1'}));

    places.forEach((place,index)=>{
      const x=boardX+index*colW,isDecimal=index===5;
      svg.appendChild(pvSvgEl('rect',{x,y:boardY,width:colW,height:headerH,fill:index%2?'#f8fafb':'#f3f7f7'}));
      if(index>0)svg.appendChild(pvSvgEl('line',{x1:x,y1:boardY,x2:x,y2:boardY+boardH,stroke:isDecimal?'#657b82':'#d7e0e2','stroke-width':isDecimal?4:1.5}));
      svg.appendChild(pvSvgEl('text',{x:x+colW/2,y:boardY+28,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':15,'font-weight':800,fill:'#2f474f'},place.label));
      svg.appendChild(pvSvgEl('text',{x:x+colW/2,y:boardY+49,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':10,fill:'#697b80'},place.name));
      const countLabel=(pupil?pupilColumnHidden(index):columnCountHidden(index))?'?':cs[index];
      svg.appendChild(pvSvgEl('rect',{x:x+colW/2-18,y:boardY+57,width:36,height:18,rx:9,fill:'#edf3f4'}));
      svg.appendChild(pvSvgEl('text',{x:x+colW/2,y:boardY+70,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':11,'font-weight':800,fill:'#52666d'},countLabel));

      for(let n=0;n<cs[index];n++){
        const row=Math.floor(n/perRow),slot=n%perRow,cx=x+colW/2+(slot-1)*32,cy=boardY+headerH+35+row*counterStep;
        svg.appendChild(pvSvgEl('circle',{cx,cy,r:14,fill:place.color,stroke:'#708388','stroke-width':1.5}));
        svg.appendChild(pvSvgEl('circle',{cx,cy,r:5,fill:'#ffffff','fill-opacity':.58}));
      }
    });

    if(!omitSummary){
      const sy=boardY+boardH+22,half=(boardW-14)/2;
      svg.appendChild(pvSvgEl('rect',{x:boardX,y:sy,width:half,height:68,rx:12,fill:'#f6f9f9',stroke:'#d7e1e3'}));
      svg.appendChild(pvSvgEl('rect',{x:boardX+half+14,y:sy,width:half,height:68,rx:12,fill:'#f6f9f9',stroke:'#d7e1e3'}));
      svg.appendChild(pvSvgEl('text',{x:boardX+16,y:sy+22,'font-family':'Arial,sans-serif','font-size':11,'font-weight':700,fill:'#6d7e83'},'Number represented'));
      svg.appendChild(pvSvgEl('text',{x:boardX+16,y:sy+50,'font-family':'Arial,sans-serif','font-size':22,'font-weight':800,fill:'#2e5e5a'},hideTotal?'?':format(total())));
      svg.appendChild(pvSvgEl('text',{x:boardX+half+30,y:sy+22,'font-family':'Arial,sans-serif','font-size':11,'font-weight':700,fill:'#6d7e83'},'Board representation'));
      let expanded=hideExpanded?'Hidden for challenge':expandedText();
      if(expanded.length>64)expanded=expanded.slice(0,61)+'…';
      svg.appendChild(pvSvgEl('text',{x:boardX+half+30,y:sy+49,'font-family':'Arial,sans-serif','font-size':14,'font-weight':700,fill:'#334a52'},expanded));
    }
    svg.appendChild(pvSvgEl('text',{x:width-pad,y:height-12,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return boardExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(boardExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Place Value challenge',
      prompt,
      responseLabel:challenge.category==='reason'?'Explain your thinking':'Answer',
      responseLines,
      brand:'99 Club Studio'
    });
  }
  function exportName(){
    const meta=challenge&&CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return exportMode==='challenge'&&challenge?(challenge.title||meta?.title||'place-value-challenge'):'place-value-board-'+String(total()).replace(/[^0-9.-]+/g,'-');
  }
  function exportMessage(text){exportStatus=text;const el=q('#pv-export-status');if(el)el.textContent=text}
  async function exportAction(kind){
    try{
      if(!X)throw new Error('Export tools are not available.');
      const target=exportTargetSvg(),isCard=exportMode==='challenge'&&!!challenge,name=exportName();
      if(kind==='copy'){await X.copyPng(target);exportMessage(isCard?'Challenge copied — paste it into your worksheet, slide or document.':'Board image copied — paste it into your slide or document.')}
      if(kind==='png'){await X.downloadPng(target,name,2);exportMessage(isCard?'Challenge PNG downloaded.':'Board PNG downloaded.')}
      if(kind==='svg'){X.downloadSvg(target,name);exportMessage(isCard?'Challenge SVG downloaded.':'Board SVG downloaded.')}
      if(kind==='print'){X.printSvg(target,{title:'',landscape:true});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'That export did not work.')}
  }
  function controlsHtml(){
    return '<div class="gd-row pv-mode-tabs" role="tablist" aria-label="Place Value workflow">'+
      '<button class="gd-btn'+(controlTab==='setup'?' gd-btn--primary':'')+'" type="button" data-pv-workflow="setup">Setup</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-pv-workflow="challenge">Challenge'+(challenge?' •':'')+'</button>'+
      '<button class="gd-btn'+(controlTab==='export'?' gd-btn--primary':'')+'" type="button" data-pv-workflow="export">Export / reuse</button></div>'+
      (controlTab==='challenge'?challengeControlsHtml():controlTab==='export'?exportControlsHtml():setupControlsHtml());
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
    const compact=width<560,tokenSize=compact?30:36,header=compact?68:78,rowGap=compact?35:42,colWidth=width/places.length;
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
    return nonStandard()?'This is a non-standard representation. Regroup to show the same value using standard digits.':'Drag a counter into another column to change its place value.';
  }
  function tokenMarkup(t,selectedId){
    const p=places[t.place],selected=String(t.id)===String(selectedId);
    return '<button type="button" class="gd-pv-counter'+(selected?' is-selected':'')+(t.locked?' is-locked':'')+'" data-gd-object="'+t.id+'" data-pv-place="'+t.place+'" aria-selected="'+(selected?'true':'false')+'" aria-label="One '+p.name+' counter'+(t.locked?', locked':'')+'" style="left:'+t.x+'px;top:'+t.y+'px;--pv-counter:'+p.color+'"><span aria-hidden="true"></span>'+(t.locked?'<b class="gd-pv-lock" aria-hidden="true">⌑</b>':'')+'</button>';
  }
  function railMarkup(selected,meta){
    const object=selected?
      I.toolButton('duplicate','duplicate','Duplicate counter','',false)+
      I.toolButton('lock',selected.locked?'unlock':'lock',selected.locked?'Unlock counter':'Lock counter',selected.locked?'is-active':'',false)+
      I.toolButton('delete','delete','Delete counter','is-danger',selected.locked):'';
    const divider=object?'<span class="gd-object-separator"></span>':'';
    return '<div class="gd-object-ui"><div class="gd-object-rail'+(selected?' is-engaged':'')+'" aria-label="Place-value board tools">'+object+divider+
      I.toolButton('undo','undo','Undo','',!meta?.canUndo)+
      I.toolButton('redo','redo','Redo','',!meta?.canRedo)+
      '</div></div>';
  }
  function columnMarkup(place,index,cs){
    const countText=columnCountHidden(index)?'?':cs[index];
    return '<div class="gd-pv-column'+(index===5?' is-decimal-start':'')+'" data-gd-canvas-bg data-pv-column="'+index+'">'+
      '<div class="gd-pv-head"><strong>'+place.label+'</strong><small>'+place.name+'</small><span data-pv-count="'+index+'">'+countText+'</span><button type="button" data-pv-add="'+index+'" aria-label="Add one '+place.name+' counter">+</button></div>'+
      '</div>';
  }
  function render(selectedId,meta){
    const height=layoutTokens(),cs=counts(),selected=tokens.find(t=>String(t.id)===String(selectedId))||null;
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Place Value challenge',actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'}]:[]}):'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-pv-workspace">'+
      '<div class="gd-pv-board-wrap">'+
        '<div class="gd-pv-canvas" id="pv-canvas" data-gd-canvas-bg style="min-height:'+height+'px">'+
          '<div class="gd-pv-columns">'+places.map((p,i)=>columnMarkup(p,i,cs)).join('')+'</div>'+
          tokens.map(t=>tokenMarkup(t,selectedId)).join('')+
        '</div>'+
        railMarkup(selected,meta)+
      '</div>'+
      '<div class="gd-pv-summary">'+
        '<div><span>Number represented</span><strong id="pv-total"'+(summaryHidden('total')?' class="gd-pv-answer-hidden"':'')+'>'+(summaryHidden('total')?'?':format(total()))+'</strong></div>'+
        '<div><span>Board representation</span><strong id="pv-expanded"'+(summaryHidden('expanded')?' class="gd-pv-answer-hidden"':'')+'>'+(summaryHidden('expanded')?'Hidden for challenge':expandedText())+'</strong></div>'+
      '</div>'+
      '<p class="gd-object-hint" id="pv-hint">'+stageNotice()+'</p>'+
    '</div>';
  }
  function updateLiveSummary(){
    updateChallengeAnswer();
    const totalEl=q('#pv-total'),expandedEl=q('#pv-expanded'),hint=q('#pv-hint'),input=q('#pv-value');
    if(totalEl)totalEl.textContent=summaryHidden('total')?'?':format(total());
    if(expandedEl)expandedEl.textContent=summaryHidden('expanded')?'Hidden for challenge':expandedText();
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
  function duplicateCounter(item){
    if(tokens.length>=90){notice='This board is full. Delete or regroup some counters first.';return null;}
    const copy={...item,id:next++,locked:false,x:0,y:0};
    tokens.push(copy);notice='';layoutTokens();return copy;
  }
  function bindStage(){
    qa('[data-pv-add]',q('#gd-stage')).forEach(button=>button.onclick=e=>{
      e.stopPropagation();addCounter(+button.dataset.pvAdd);
    });
    const reveal=q('[data-board-action="reveal"]',q('#gd-stage'));
    if(reveal)reveal.onclick=e=>{e.stopPropagation();if(!challenge)return;challenge.revealed=!challenge.revealed;renderControls();controller?.refresh()};
    const another=q('[data-challenge-action="another"]',q('#gd-stage'));
    if(another)another.onclick=e=>{e.stopPropagation();if(challenge?.mode==='standard')generateChallenge(challenge.type)};
    updateLiveSummary();
  }
  function syncControls(){
    const input=q('#pv-value'),regroup=q('#pv-regroup');
    if(input&&document.activeElement!==input)input.value=clean(total()).toFixed(total()%1?2:0);
    if(regroup)regroup.disabled=!nonStandard()||total()>99999.99;
  }
  function bindControls(){
    qa('[data-pv-workflow]').forEach(button=>button.onclick=()=>{
      const nextTab=button.dataset.pvWorkflow;
      controlTab=nextTab==='challenge'?'challenge':nextTab==='export'?'export':'setup';
      renderControls();
    });
    const build=q('#pv-build');if(build)build.onclick=()=>{
      const raw=q('#pv-value').value;
      controller.mutate(()=>{buildFromNumber(raw);notice='Board rebuilt from the entered number.'});
      controller.select(null);
    };
    const random=q('#pv-random');if(random)random.onclick=()=>{
      const value=Math.floor(Math.random()*99999)+1;
      q('#pv-value').value=value;
      controller.mutate(()=>{buildFromNumber(value);notice='Random whole number built.'});
      controller.select(null);
    };
    const decimal=q('#pv-dec');if(decimal)decimal.onclick=()=>{
      const value=(Math.floor(Math.random()*9999999)/100).toFixed(2);
      q('#pv-value').value=value;
      controller.mutate(()=>{buildFromNumber(value);notice='Random decimal built.'});
      controller.select(null);
    };
    const regroup=q('#pv-regroup');if(regroup)regroup.onclick=()=>{
      const value=total();
      if(value>99999.99){notice='This value is above the current board range, so it cannot be regrouped here.';controller.refresh();return;}
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
    const panelReveal=q('#pv-reveal');if(panelReveal)panelReveal.onclick=()=>{
      if(!challenge)return;challenge.revealed=!challenge.revealed;renderControls();controller?.refresh();
    };

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
    syncControls();
  }

  renderControls();

  buildFromNumber(1234.5);
  controller=I.mount({
    getItems:()=>tokens,
    getState:stateSnapshot,
    setState:restoreState,
    getCanvas:()=>q('#pv-canvas'),
    getActionRoot:()=>q('#gd-stage'),
    render,
    snap:1,
    nudgeStep:1,
    duplicate:duplicateCounter,
    remove:item=>{tokens=tokens.filter(t=>t!==item);notice='';layoutTokens()},
    toggleLock:item=>{item.locked=!item.locked;notice=''},
    constrain:(item,x,y,element,canvas)=>({
      x:clamp(x,0,Math.max(0,canvas.clientWidth-(element?.offsetWidth||36))),
      y:clamp(y,70,Math.max(70,canvas.clientHeight-(element?.offsetHeight||36)))
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
}

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
  const CHALLENGE_TEMPLATES=[
    {id:'identify-strip',category:'read',title:'Read the fraction strip',desc:'Identify the fraction represented by a strip.'},
    {id:'equivalent-strip',category:'read',title:'Find an equivalent fraction',desc:'Use aligned strips to complete an equivalence.'},
    {id:'compare-strips',category:'compare',title:'Compare two fractions',desc:'Choose <, > or = from visual fraction strips.'},
    {id:'simplify-strip',category:'convert',title:'Simplify a fraction',desc:'Use the strip structure to write the simplest form.'},
    {id:'mixed-improper',category:'convert',title:'Improper to mixed',desc:'Read an improper strip and write it as a mixed number.'},
    {id:'denominator-misconception',category:'reason',title:'Larger denominator?',desc:'Diagnose the common unit-fraction denominator misconception.'}
  ];
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
    challenge=null;challengeTab='standard';controlTab='challenge';renderControls();renderRepresentation();
  }
  function randomProper(d){return{n:1+Math.floor(Math.random()*Math.max(1,d-1)),d}}
  function generateChallenge(type){
    const template=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!template)return;
    if(!beforeChallenge)beforeChallenge=teachingSnapshot();else restoreTeachingSnapshot(beforeChallenge);
    const dens=[2,3,4,5,6,8];
    if(type==='identify-strip'){
      const d=dens[Math.floor(Math.random()*dens.length)],f=randomProper(d);
      mode='workbench';strips=[{id:1,...f,x:24,y:24,locked:false,color:'#cbe7e2'}];nextStrip=2;
      challenge=challengeObject(type,'What fraction is represented by the strip?',rawFractionText(f),{answerSource:'strip:1:fraction',hiddenStripLabels:[1],hiddenStripHints:[1]});
    }else if(type==='equivalent-strip'){
      const d=[2,3,4,5,6][Math.floor(Math.random()*5)],f=randomProper(d),target={n:f.n*2,d:f.d*2};
      mode='workbench';strips=[
        {id:1,...f,x:24,y:24,locked:false,color:'#cbe7e2'},
        {id:2,...target,x:24,y:130,locked:false,color:'#cfe0f6'}
      ];nextStrip=3;
      challenge=challengeObject(type,'The two strips represent the same amount. What fraction with denominator '+target.d+' is equivalent to '+rawFractionText(f)+'?',rawFractionText(target),{answerSource:'strip:2:fraction',hiddenStripLabels:[2],hiddenStripHints:[2]});
    }else if(type==='compare-strips'){
      let a,b,guard=0;
      do{a=randomProper(dens[Math.floor(Math.random()*dens.length)]);b=randomProper(dens[Math.floor(Math.random()*dens.length)]);guard++}while(equivalent(a,b)&&guard<30);
      compareA=a;compareB=b;focus={...a};mode='wall';
      const av=fractionValue(a),bv=fractionValue(b),sign=av>bv?'>':'<';
      challenge=challengeObject(type,'Which symbol belongs between A and B: <, > or =?',sign,{answerSource:'compare-sign',hiddenCompareSign:true});
    }else if(type==='simplify-strip'){
      const base=[{n:1,d:2},{n:2,d:3},{n:3,d:4},{n:2,d:5}][Math.floor(Math.random()*4)],factor=2;
      const f={n:base.n*factor,d:base.d*factor};
      mode='workbench';strips=[{id:1,...f,x:24,y:24,locked:false,color:'#f6dfad'}];nextStrip=2;
      challenge=challengeObject(type,'Simplify the fraction shown to its lowest terms.',rawFractionText(base),{answerSource:'strip:1:simplified',hiddenStripHints:[1]});
    }else if(type==='mixed-improper'){
      const d=[2,3,4,5][Math.floor(Math.random()*4)],whole=1+Math.floor(Math.random()*2),rem=1+Math.floor(Math.random()*(d-1)),f={n:whole*d+rem,d};
      mode='workbench';strips=[{id:1,...f,x:24,y:24,locked:false,color:'#e7d8f3'}];nextStrip=2;
      challenge=challengeObject(type,'Write the improper fraction shown as a mixed number.',whole+' '+rem+'/'+d,{answerSource:'strip:1:mixed',hiddenStripHints:[1]});
    }else{
      const small=[3,4,5,6][Math.floor(Math.random()*4)],large=Math.min(12,small*2),a={n:1,d:small},b={n:1,d:large};
      mode='workbench';strips=[
        {id:1,...a,x:24,y:24,locked:false,color:'#cbe7e2'},
        {id:2,...b,x:24,y:130,locked:false,color:'#cfe0f6'}
      ];nextStrip=3;
      challenge=challengeObject(type,'A pupil says 1/'+large+' is greater than 1/'+small+' because '+large+' is the larger denominator. Are they correct?','No. For unit fractions, more equal parts make each part smaller, so 1/'+small+' > 1/'+large+'.',{hiddenStripHints:[1,2]});
    }
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
      '</div><p class="gd-help" id="fw-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
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
      svg.appendChild(fwSvgEl('text',{x:x+18,y:y+28,'font-family':'Arial,sans-serif','font-size':18,'font-weight':800,fill:'#2e4a51'},hideLabel?'?':rawFractionText(strip)));
      if(!hideLabel&&!hideHint&&canSimplify)svg.appendChild(fwSvgEl('text',{x:x+84,y:y+28,'font-family':'Arial,sans-serif','font-size':12,'font-weight':700,fill:'#697d82'},'= '+simple.n+'/'+simple.d));
      const barX=x+18,barW=cardW-36,rowH=25,rowGap=8,barY=y+45;
      for(let g=0;g<groups;g++){
        const yy=barY+g*(rowH+rowGap),segW=barW/strip.d;
        for(let i=0;i<strip.d;i++){
          const absolute=g*strip.d+i+1,fill=absolute<=strip.n;
          svg.appendChild(fwSvgEl('rect',{x:barX+i*segW,y:yy,width:segW,height:rowH,fill:fill?(strip.color||'#cbe7e2'):'#ffffff',stroke:'#70878c','stroke-width':1}));
        }
      }
      const hint=hideHint?'Work it out from the strip.':canSimplify?'Can simplify to '+simple.n+'/'+simple.d:'Value '+Number(fractionValue(strip).toFixed(4));
      svg.appendChild(fwSvgEl('text',{x:x+18,y:y+h-12,'font-family':'Arial,sans-serif','font-size':11,fill:'#73858a'},hint));
      y+=h+18;
    });
    if(!items.length)svg.appendChild(fwSvgEl('text',{x:width/2,y:height/2,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':18,fill:'#718388'},'No fraction strips on the workbench.'));
    svg.appendChild(fwSvgEl('text',{x:width-pad,y:height-10,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function fractionExportSvg(options={}){
    return mode==='workbench'?stripsExportSvg(options):wallExportSvg(options);
  }
  function exportTargetSvg(){
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
  async function exportAction(kind){
    try{
      if(!X)throw new Error('Export tools are not available.');
      const target=exportTargetSvg(),isCard=exportMode==='challenge'&&!!challenge,name=exportName();
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
    const a=readCompare('a'),b=readCompare('b'),av=a.n/a.d,bv=b.n/b.d,sign=Math.abs(av-bv)<1e-10?'=':(av>bv?'>':'<');
    const simpleFocus=simplify(focus.n,focus.d);
    const rawFocusText=simpleFocus.n===focus.n&&simpleFocus.d===focus.d?focus.n+'/'+focus.d:focus.n+'/'+focus.d+' = '+simpleFocus.n+'/'+simpleFocus.d;
    const focusText=challengeActiveHidden('focus')?'?':rawFocusText,displaySign=challengeActiveHidden('compare')?'?':sign;
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Fractions challenge',actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'}]:[]}):'';
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
    const label=hideLabel?'?':strip.n+'/'+strip.d,secondary=hideLabel||hideHint?'':fractionText(strip);
    const hint=hideHint?'Work it out':(canSimplify?'Can simplify to '+simple.n+'/'+simple.d:'Value '+Number(fractionValue(strip).toFixed(4)));
    return '<div class="gd-fr-strip-object'+(selected?' is-selected':'')+(same?' is-equivalent':'')+(strip.locked?' is-locked':'')+'" data-gd-object="'+strip.id+'" role="button" tabindex="0" aria-selected="'+(selected?'true':'false')+'" aria-label="Fraction strip'+(hideLabel?' with hidden value':' '+strip.n+'/'+strip.d)+(strip.locked?', locked':'')+'" style="left:'+strip.x+'px;top:'+strip.y+'px;--fr-strip:'+strip.color+'">'+
      '<div class="gd-fr-strip-head"><strong>'+label+'</strong><span>'+secondary+'</span>'+(same?'<em>same value</em>':'')+(strip.locked?'<b aria-hidden="true">⌑</b>':'')+'</div>'+
      '<div class="gd-fr-strip-bars">'+stripBars(strip)+'</div>'+
      '<small>'+hint+'</small>'+
    '</div>';
  }
  function workbenchRail(selected,meta){
    const object=selected?
      I.toolButton('duplicate','duplicate','Duplicate strip','',false)+
      I.toolButton('split','grid','Split every piece in two','',selected.locked||selected.d*2>12)+
      I.toolButton('simplify','clear','Simplify fraction','',selected.locked||gcd(selected.n,selected.d)===1)+
      I.toolButton('lock',selected.locked?'unlock':'lock',selected.locked?'Unlock strip':'Lock strip',selected.locked?'is-active':'',false)+
      I.toolButton('delete','delete','Delete strip','is-danger',selected.locked):'';
    return '<div class="gd-object-ui"><div class="gd-object-rail'+(selected?' is-engaged':'')+'" aria-label="Fraction strip tools">'+
      object+(object?'<span class="gd-object-separator"></span>':'')+
      I.toolButton('undo','undo','Undo','',!meta?.canUndo)+I.toolButton('redo','redo','Redo','',!meta?.canRedo)+
      I.toolButton('align','grid','Align strips','',strips.length<2)+'</div></div>';
  }
  function stripHeight(strip){return 58+Math.max(1,Math.ceil(strip.n/strip.d))*32}
  function workbenchHeight(){return Math.max(500,40+strips.reduce((max,strip)=>Math.max(max,(Number(strip.y)||0)+stripHeight(strip)),0))}
  function drawWorkbench(selectedId,meta){
    const selected=selectedStrip(selectedId);
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Fractions challenge',actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'}]:[]}):'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-fr-workbench"><div class="gd-fr-strip-canvas-wrap"><div class="gd-fr-strip-canvas" id="fw-strip-canvas" data-gd-canvas-bg style="min-height:'+workbenchHeight()+'px" tabindex="0" aria-label="Fraction strip workbench. Drag strips to compare them.">'+
      strips.map(s=>stripMarkup(s,selectedId)).join('')+
      '</div>'+workbenchRail(selected,meta)+'</div>'+
      '<div class="gd-object-hint">'+(selected?(selected.locked?'Strip locked · unlock it to change or move it.':'Drag to compare · split keeps the same value with twice as many equal pieces.'):'Select a strip, drag it, or align all strips to compare their lengths.')+'</div></div>';
    bindStripSegments();
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
        if(action==='split'&&selected&&!selected.locked&&selected.d*2<=12)api.mutate(()=>{selected.n*=2;selected.d*=2;updateChallengeAnswer()});
        else if(action==='simplify'&&selected&&!selected.locked)api.mutate(()=>{const s=simplify(selected.n,selected.d);selected.n=s.n;selected.d=s.d;updateChallengeAnswer()});
        else if(action==='align')api.mutate(alignStrips);
      }
    });
    controller.refresh();
  }
  function bindChallengeStageActions(){
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
    }else mountWorkbench();
  }
  function switchMode(next){
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
}

function barModel(){function parse(){return q('#bm-parts').value.split(',').map(x=>x.trim()).filter(Boolean).map(x=>x==='?'?'?':Math.max(0,num(x,0))).slice(0,8)}function draw(){const parts=parse(),known=parts.filter(x=>x!=='?'),sum=known.reduce((a,b)=>a+b,0),unknowns=parts.filter(x=>x==='?').length,totalRaw=q('#bm-total').value.trim(),total=totalRaw?num(totalRaw,0):null,unknownValue=total!=null&&unknowns===1?Math.max(0,total-sum):null;const numeric=parts.map(x=>x==='?'?(unknownValue||Math.max(1,sum/(known.length||1))):x),den=Math.max(1,numeric.reduce((a,b)=>a+b,0));q('#gd-stage').innerHTML=`<div class="gd-vis"><div class="gd-bars"><div class="gd-bar-wrap">${parts.map((p,i)=>`<div class="gd-bar-part${p==='?'?' is-unknown':''}" style="flex:${Math.max(.1,numeric[i]/den*10)}">${p==='?'?(unknownValue!=null?unknownValue:'?'):p}</div>`).join('')}</div><div class="gd-bar-total">Total: ${total!=null?total:(unknowns?'?':sum)}</div></div><div class="gd-equation">${parts.join(' + ')} = ${total!=null?total:(unknowns?'?':sum)}</div></div>`}
setPanels(`${field('Parts','<input class="gd-input" id="bm-parts" value="30, 20, ?">','Comma-separated values. Use ? for one unknown part.')}${field('Total (optional)','<input class="gd-input" id="bm-total" type="number" min="0" value="80">','If one part is ?, the total calculates it.')}${btn('Example problem','bm-example')}<p class="gd-help">Useful for modelling the structure of a word problem before calculating.</p>`,'');q('#bm-parts').oninput=draw;q('#bm-total').oninput=draw;q('#bm-example').onclick=()=>{const examples=[['24, ?, 16','55'],['35, 35, ?','100'],['? , 18','47'],['12, 12, 12, ?','60']];const e=examples[Math.floor(Math.random()*examples.length)];q('#bm-parts').value=e[0];q('#bm-total').value=e[1];draw()};draw()}

function hundredSquare(){let clicked=new Set();function isPrime(n){if(n<2)return false;for(let i=2;i*i<=n;i++)if(n%i===0)return false;return true}function draw(){const mode=q('#hs-mode').value,k=Math.max(1,num(q('#hs-k').value,5));q('#gd-stage').innerHTML=`<div class="gd-vis"><div class="gd-square-grid">${Array.from({length:100},(_,i)=>{const n=i+1;let on=mode==='multiples'?n%k===0:mode==='factors'?k%n===0:mode==='prime'?isPrime(n):mode==='odd'?n%2===1:mode==='even'?n%2===0:false;return `<button type="button" class="gd-square-cell${on?' is-highlight':''}${clicked.has(n)?' is-selected':''}" data-n="${n}">${n}</button>`}).join('')}</div></div>`;qa('[data-n]',q('#gd-stage')).forEach(x=>x.onclick=()=>{const n=+x.dataset.n;clicked.has(n)?clicked.delete(n):clicked.add(n);draw()})}
setPanels(`${field('Highlight','<select class="gd-select" id="hs-mode"><option value="multiples">Multiples of…</option><option value="factors">Factors of…</option><option value="prime">Prime numbers</option><option value="odd">Odd numbers</option><option value="even">Even numbers</option><option value="none">Nothing</option></select>')}${field('Number','<input class="gd-input" id="hs-k" type="number" min="1" max="100" value="5">')}${btn('Clear my marked squares','hs-clear')}<p class="gd-help">Pupils can also click individual squares to mark their own pattern.</p>`,'');q('#hs-mode').onchange=draw;q('#hs-k').oninput=draw;q('#hs-clear').onclick=()=>{clicked.clear();draw()};draw()}

function multiplicationGrid(){let hidden=new Set();function draw(){const size=clamp(num(q('#mg-size').value,12),5,15),focus=clamp(num(q('#mg-focus').value,6),1,size);let h='<table class="gd-times-grid"><tr><th>×</th>'+Array.from({length:size},(_,i)=>`<th>${i+1}</th>`).join('')+'</tr>';for(let r=1;r<=size;r++){h+=`<tr><th>${r}</th>`;for(let c=1;c<=size;c++){const k=r+'-'+c;h+=`<td class="${r===focus||c===focus?'is-highlight ':''}${hidden.has(k)?'is-hidden':''}" data-cell="${k}">${r*c}</td>`}h+='</tr>'}h+='</table>';q('#gd-stage').innerHTML='<div class="gd-vis">'+h+'</div>';qa('[data-cell]',q('#gd-stage')).forEach(x=>x.onclick=()=>{const k=x.dataset.cell;hidden.has(k)?hidden.delete(k):hidden.add(k);draw()})}
setPanels(`${field('Grid size','<input class="gd-input" id="mg-size" type="number" min="5" max="15" value="12">')}${field('Highlight table','<input class="gd-input" id="mg-focus" type="number" min="1" max="15" value="6">')}<div class="gd-row">${btn('Hide 12 random products','mg-hide')}${btn('Show all','mg-show')}</div><p class="gd-help">Click any product to hide/reveal it and turn the grid into a quick retrieval activity.</p>`,'');q('#mg-size').oninput=draw;q('#mg-focus').oninput=draw;q('#mg-hide').onclick=()=>{hidden.clear();const size=clamp(num(q('#mg-size').value,12),5,15);while(hidden.size<Math.min(12,size*size))hidden.add((1+Math.floor(Math.random()*size))+'-'+(1+Math.floor(Math.random()*size)));draw()};q('#mg-show').onclick=()=>{hidden.clear();draw()};draw()}

function arrayBuilder(){
  const CK=G.challengeKit,X=G.exportTools;
  let rows=4,cols=6,rowSplit=0,colSplit=0,drag=null;
  const MAX=12;
  const CHALLENGE_CATEGORIES=[
    {id:'read',label:'Read the array'},
    {id:'build',label:'Build & relate'},
    {id:'reason',label:'Reasoning'}
  ];
  const CHALLENGE_TEMPLATES=[
    {id:'count-total',category:'read',title:'How many altogether?',desc:'Use the rows and columns to find the total.'},
    {id:'multiplication-fact',category:'read',title:'Write the multiplication',desc:'Write the multiplication sentence represented by the array.'},
    {id:'missing-factor',category:'read',title:'Missing factor',desc:'Use the array to find a hidden row or column count.'},
    {id:'related-division',category:'build',title:'Related division fact',desc:'Use the array to complete an inverse division fact.'},
    {id:'build-array',category:'build',title:'Build the array',desc:'Resize the board to make a requested rows-by-columns array.'},
    {id:'commutative-fact',category:'reason',title:'Commutative fact',desc:'Write the swapped multiplication fact represented by the same total.'},
    {id:'partial-products',category:'reason',title:'Use the partition',desc:'Read a split array as partial products.'}
  ];
  let controlTab='explore',challengeTab='standard',challengeCategory='read',challengeType='count-total',challenge=null,beforeChallenge=null;
  let exportMode='diagram',responseLines=1,exportStatus='';

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
    return !!(challenge&&challenge.mode==='standard'&&challenge.freezeBoard);
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
    return field('Rows','<div class="gd-row"><button class="gd-btn" id="ab-row-down" type="button" aria-label="Remove one row">−</button><input class="gd-input gd-array-count" id="ab-r" type="number" min="1" max="'+MAX+'" value="'+rows+'"><button class="gd-btn" id="ab-row-up" type="button" aria-label="Add one row">+</button></div>')+
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
    return tabs+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="ab-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
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
      '</div><p class="gd-help" id="ab-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
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
    const mathsRows=buildBlank?0:(showPartial?4:3),height=buildBlank?boardY+boardH+100:mathsY+mathsRows*48+50;
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
      lines.forEach((item,index)=>{
        const y=mathsY+index*48;
        svg.appendChild(abSvgEl('rect',{x:96,y:y-27,width:width-192,height:38,rx:10,fill:index===3?'#fff9ea':'#f6f9f9',stroke:'#d9e2e4','stroke-width':1}));
        svg.appendChild(abSvgEl('text',{x:112,y:y-4,'font-family':'Arial,sans-serif','font-size':11,'font-weight':750,fill:'#718288'},item[0]));
        svg.appendChild(abSvgEl('text',{x:width-112,y:y-4,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':15,'font-weight':850,fill:'#304b52','data-ab-export-math':index},item[1]));
      });
    }
    svg.appendChild(abSvgEl('text',{x:width-42,y:height-16,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return arrayExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(arrayExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Array challenge',
      prompt,
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
  async function exportAction(kind){
    try{
      if(!X)throw new Error('Export tools are not available.');
      const target=exportTargetSvg(),isCard=exportMode==='challenge'&&!!challenge,name=exportName();
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
    restoreBeforeChallenge();
    challenge=null;challengeTab='standard';controlTab='challenge';renderControls();draw();
  }
  function enterCustomChallenge(){
    const wasCustom=challenge?.mode==='custom';
    if(CK)challenge=CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''});
    if(!challenge.hiddenDimensions)challenge.hiddenDimensions=[];
    if(!wasCustom)clearBoundHiding();
    challenge.freezeBoard=false;challenge.revealed=false;
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
    rowSplit=0;colSplit=0;
    const r=randomDimension(),c=randomDimension();
    setDimensions(r,c);
    if(type==='count-total'){
      challenge=challengeObject(type,'How many objects are in the array altogether?',String(total()),{hiddenTotal:true,hiddenRepeated:true,hiddenInverse:true});
    }else if(type==='multiplication-fact'){
      challenge=challengeObject(type,'Write the multiplication sentence represented by this array.',multiplicationFact(),{hiddenEquation:true,hiddenRepeated:true,hiddenInverse:true});
    }else if(type==='missing-factor'){
      const hideRows=Math.random()<.5,known=hideRows?cols:rows;
      challenge=challengeObject(
        type,
        'There are '+total()+' objects arranged in '+known+' '+(hideRows?'columns':'rows')+'. How many '+(hideRows?'rows':'columns')+' are there?',
        String(hideRows?rows:cols),
        {hiddenDimensions:[hideRows?'rows':'cols'],hiddenRepeated:true,hiddenInverse:true}
      );
    }else if(type==='related-division'){
      const divisorRows=Math.random()<.5,divisor=divisorRows?rows:cols,answer=divisorRows?cols:rows;
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
      if(cols>=4&&Math.random()<.65)colSplit=1+Math.floor(Math.random()*(cols-1));
      else rowSplit=1+Math.floor(Math.random()*(rows-1));
      normaliseSplits();
      challenge=challengeObject(
        type,
        'Use the partition lines to write the partial-product calculation for this array.',
        partitionMath(),
        {hiddenEquation:true,hiddenRepeated:true,hiddenInverse:true,hiddenPartial:true}
      );
    }
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';
    exportMode='challenge';responseLines=template.category==='reason'?3:type==='build-array'?2:1;exportStatus='';
    renderControls();draw();
  }
  function mutateDimensions(nextRows,nextCols){
    if(challengeFrozen())return;
    setDimensions(nextRows,nextCols);renderControls();draw();
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
      return;
    }
    if(controlTab==='explore'){
      const r=q('#ab-r',controls),c=q('#ab-c',controls);
      if(r)r.oninput=()=>mutateDimensions(r.value,cols);
      if(c)c.oninput=()=>mutateDimensions(rows,c.value);
      const rowDown=q('#ab-row-down',controls);if(rowDown)rowDown.onclick=()=>mutateDimensions(rows-1,cols);
      const rowUp=q('#ab-row-up',controls);if(rowUp)rowUp.onclick=()=>mutateDimensions(rows+1,cols);
      const colDown=q('#ab-col-down',controls);if(colDown)colDown.onclick=()=>mutateDimensions(rows,cols-1);
      const colUp=q('#ab-col-up',controls);if(colUp)colUp.onclick=()=>mutateDimensions(rows,cols+1);
      const swap=q('#ab-swap',controls);if(swap)swap.onclick=()=>{
        const oldRows=rows,oldRowSplit=rowSplit;
        rows=cols;cols=oldRows;rowSplit=colSplit;colSplit=oldRowSplit;normaliseSplits();renderControls();draw();
      };
      const random=q('#ab-random',controls);if(random)random.onclick=()=>{
        rows=1+Math.floor(Math.random()*MAX);cols=1+Math.floor(Math.random()*MAX);rowSplit=0;colSplit=0;renderControls();draw();
      };
      const rs=q('#ab-row-split',controls);if(rs)rs.onchange=()=>{rowSplit=clamp(Math.round(num(rs.value,0)),0,Math.max(0,rows-1));draw();renderControls()};
      const cs=q('#ab-col-split',controls);if(cs)cs.onchange=()=>{colSplit=clamp(Math.round(num(cs.value,0)),0,Math.max(0,cols-1));draw();renderControls()};
      const clear=q('#ab-clear-splits',controls);if(clear)clear.onclick=()=>{rowSplit=0;colSplit=0;draw();renderControls()};
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
    const generate=q('#ab-generate',controls);if(generate)generate.onclick=()=>generateChallenge(challengeType);
    const edit=q('#ab-edit-challenge',controls);if(edit)edit.onclick=enterCustomChallenge;
    const end=q('#ab-clear-challenge',controls);if(end)end.onclick=clearChallenge;
    const reveal=q('#ab-reveal',controls);if(reveal)reveal.onclick=()=>{if(!challenge)return;challenge.revealed=!challenge.revealed;renderControls();draw()};
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
    drag={kind,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,startRows:rows,startCols:cols,cellW:rect.width/cols,cellH:rect.height/rows};
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
    setDimensions(nextRows,nextCols);draw();renderControls();
  }
  function resizeEnd(e){
    if(drag&&e.pointerId!=null&&e.pointerId!==drag.pointerId)return;
    drag=null;
    document.removeEventListener('pointermove',resizeMove);
    document.removeEventListener('pointerup',resizeEnd);
    document.removeEventListener('pointercancel',resizeEnd);
  }
  function bindStage(){
    const frozen=challengeFrozen(),colHandle=q('[data-ab-resize="cols"]'),rowHandle=q('[data-ab-resize="rows"]');
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
  function bindChallengeStageActions(){
    const stage=q('#gd-stage');if(!stage||!challenge)return;
    const reveal=q('[data-board-action="reveal"]',stage);
    if(reveal)reveal.onclick=e=>{e.stopPropagation();challenge.revealed=!challenge.revealed;renderControls();draw()};
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
    const repeated=hiddenFlag('hiddenRepeated')?'?':repeatedAddition();
    const inverse=hiddenFlag('hiddenInverse')?'?':inverseFacts();
    const partial=partitionMath(),partialText=hiddenFlag('hiddenPartial')?'?':partial;
    const rowDisplay=displayDimension('rows'),colDisplay=displayDimension('cols'),frozen=challengeFrozen();
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Array challenge',actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'}]:[]}):'';
    const targetStatus=challenge?.mode==='standard'&&challenge.type==='build-array'
      ?'<div class="gd-answer-live" data-ab-target-status>'+(buildOnTarget()?'On target ✓':'')+'</div>'
      :'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-array-workbench">'+
      '<div class="gd-array-summary"><strong data-ab-equation>'+equationText()+'</strong><span>'+rowDisplay+' row'+(rowDisplay==='1'?'':'s')+' of '+colDisplay+'</span></div>'+
      '<div class="gd-array-shell">'+
        '<div class="gd-array-board" id="ab-board" data-ab-rows="'+rows+'" data-ab-cols="'+cols+'" data-ab-row-split="'+rowSplit+'" data-ab-col-split="'+colSplit+'" data-ab-frozen="'+(frozen?'true':'false')+'" data-ab-target-rows="'+(challenge?.type==='build-array'?challenge.targetRows:'')+'" data-ab-target-cols="'+(challenge?.type==='build-array'?challenge.targetCols:'')+'" style="grid-template-columns:repeat('+cols+',var(--ab-cell));grid-template-rows:repeat('+rows+',var(--ab-cell))">'+cells+'</div>'+
        '<button class="gd-array-resize gd-array-resize--cols'+(frozen?' is-frozen':'')+'" type="button" data-ab-resize="cols"'+(frozen?' disabled':'')+' aria-label="'+(hiddenDimension('cols')?'Columns hidden for this challenge.':'Columns: '+cols+(frozen?'. Fixed for this challenge.':'. Drag left or right, or use arrow keys.'))+'"'+(hiddenDimension('cols')?'':' role="slider" aria-valuemin="1" aria-valuemax="'+MAX+'" aria-valuenow="'+cols+'"')+'><span>'+colDisplay+'</span><small>columns ↔</small></button>'+
        '<button class="gd-array-resize gd-array-resize--rows'+(frozen?' is-frozen':'')+'" type="button" data-ab-resize="rows"'+(frozen?' disabled':'')+' aria-label="'+(hiddenDimension('rows')?'Rows hidden for this challenge.':'Rows: '+rows+(frozen?'. Fixed for this challenge.':'. Drag up or down, or use arrow keys.'))+'"'+(hiddenDimension('rows')?'':' role="slider" aria-valuemin="1" aria-valuemax="'+MAX+'" aria-valuenow="'+rows+'"')+'><span>'+rowDisplay+'</span><small>rows ↕</small></button>'+
      '</div>'+
      '<div class="gd-array-maths">'+
        '<div class="gd-readout"><span>Repeated addition</span><strong data-ab-repeated>'+repeated+'</strong></div>'+
        '<div class="gd-readout"><span>Related division facts</span><strong data-ab-inverse>'+inverse+'</strong></div>'+
        (partial?'<div class="gd-readout gd-array-partial" data-ab-partial><span>Partial products</span><strong>'+partialText+'</strong></div>':'')+
      '</div>'+targetStatus+
    '</div>';
    bindStage();bindChallengeStageActions();
  }
  setPanels(controlsHtml(),'');
  bindControls();
  draw();
}

function clockTool(){
  const CK=G.challengeKit,X=G.exportTools;
  let hour=10,minute=10,snap=5,numerals='arabic',drag=null;
  const roman=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
  const CHALLENGE_CATEGORIES=[
    {id:'read',label:'Read the clock'},
    {id:'set',label:'Set & elapsed time'},
    {id:'convert',label:'12 / 24 hour'},
    {id:'reason',label:'Reasoning'}
  ];
  const CHALLENGE_TEMPLATES=[
    {id:'read-five',category:'read',title:'Read to 5 minutes',desc:'Read an analogue time shown to a 5-minute interval.'},
    {id:'read-minute',category:'read',title:'Read to 1 minute',desc:'Read an analogue time to the nearest minute.'},
    {id:'roman-read',category:'read',title:'Roman numeral clock',desc:'Read a time from a clock labelled I–XII.'},
    {id:'set-five',category:'set',title:'Set a 5-minute time',desc:'Move the hands to a requested 5-minute time.'},
    {id:'set-minute',category:'set',title:'Set an exact minute',desc:'Move the hands to an exact minute time.'},
    {id:'elapsed-forward',category:'set',title:'Move time forward',desc:'Advance the analogue clock by a stated duration.'},
    {id:'twelve-to-twentyfour',category:'convert',title:'12-hour to 24-hour',desc:'Convert a shown am/pm time to 24-hour notation.'},
    {id:'twentyfour-to-twelve',category:'convert',title:'24-hour to 12-hour',desc:'Convert a 24-hour time to 12-hour am/pm notation.'},
    {id:'time-language',category:'reason',title:'Say the time',desc:'Write an analogue time using past/to language.'},
    {id:'hour-hand-misconception',category:'reason',title:'Where should the hour hand be?',desc:'Diagnose the common idea that the hour hand stays on the hour number.'}
  ];
  let controlTab='explore',challengeTab='standard',challengeCategory='read',challengeType='read-five',challenge=null,beforeChallenge=null;
  let exportMode='diagram',responseLines=1,exportStatus='';

  function mod(value,n){return((value%n)+n)%n}
  function setTime(nextHour,nextMinute){
    let total=Math.round(num(nextHour,hour))*60+Math.round(num(nextMinute,minute));
    total=mod(total,24*60);
    hour=Math.floor(total/60);minute=total%60;
  }
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
  function hourAngle(){return((hour%12)+minute/60)*30}
  function minuteAngle(){return minute*6}
  function handPoint(angle,len){
    const a=(angle-90)*Math.PI/180;
    return{x:150+len*Math.cos(a),y:150+len*Math.sin(a)};
  }
  function faceNumber(n){return numerals==='roman'?roman[n-1]:String(n)}
  function snapshot(){return{hour,minute,snap,numerals}}
  function restoreSnapshot(value){
    if(!value)return;
    hour=clamp(Math.round(num(value.hour,10)),0,23);
    minute=clamp(Math.round(num(value.minute,10)),0,59);
    snap=Number(value.snap)===1?1:5;
    numerals=value.numerals==='roman'?'roman':'arabic';
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
  function handsFrozen(){return !!(challenge&&challenge.mode==='standard'&&challenge.freezeHands)}
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
      '</div><p class="gd-help" id="cl-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
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
    const state=exportClockState(pupil),width=760,height=690,cx=380,cy=255,r=205;
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
    values.forEach((item,index)=>{
      const x=start+index*(cardW+gap);
      svg.appendChild(clSvgEl('rect',{x,y:readY,width:cardW,height:78,rx:13,fill:'#f6f9f9',stroke:'#d9e2e4','stroke-width':1}));
      svg.appendChild(clSvgEl('text',{x:x+16,y:readY+25,'font-family':'Arial,sans-serif','font-size':12,'font-weight':750,fill:'#718288'},item[0]));
      svg.appendChild(clSvgEl('text',{x:x+cardW-16,y:readY+55,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':22,'font-weight':900,fill:'#304b52','data-cl-export-readout':item[2]},item[1]));
    });
    if(state.blankHands){
      svg.appendChild(clSvgEl('text',{x:width/2,y:625,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':14,'font-weight':750,fill:'#718288','data-cl-export-set-blank':'1'},'Draw the hands on the clock face'));
    }
    svg.appendChild(clSvgEl('text',{x:width-42,y:height-18,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return clockExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    const drawTask=challenge.type==='set-five'||challenge.type==='set-minute';
    return X.composeChallengeCardSvg(clockExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Clock challenge',
      prompt,
      responseLabel:drawTask?'Draw the hands / answer':challenge.category==='reason'?'Explain your thinking':'Answer',
      responseLines,
      brand:'99 Club Studio'
    });
  }
  function exportName(){
    const meta=challenge&&CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return exportMode==='challenge'&&challenge?(challenge.title||meta?.title||'clock-challenge'):'clock-'+format24(hour,minute).replace(':','-');
  }
  function exportMessage(text){exportStatus=text;const el=q('#cl-export-status');if(el)el.textContent=text}
  async function exportAction(kind){
    try{
      if(!X)throw new Error('Export tools are not available.');
      const target=exportTargetSvg(),isCard=exportMode==='challenge'&&!!challenge,name=exportName();
      if(kind==='copy'){await X.copyPng(target);exportMessage(isCard?'Challenge copied — paste it into your worksheet, slide or document.':'Clock image copied — paste it into your slide or document.')}
      if(kind==='png'){await X.downloadPng(target,name,2);exportMessage(isCard?'Challenge PNG downloaded.':'Clock PNG downloaded.')}
      if(kind==='svg'){X.downloadSvg(target,name);exportMessage(isCard?'Challenge SVG downloaded.':'Clock SVG downloaded.')}
      if(kind==='print'){X.printSvg(target,{title:'',landscape:false});exportMessage('Print view opened. Choose “Save as PDF” in the print dialog.')}
    }catch(err){exportMessage(err?.message||'That export did not work.')}
  }
  function exploreControlsHtml(){
    return field('Hour (24-hour)','<input class="gd-input gd-small" id="cl-h" type="number" min="0" max="23" value="'+hour+'">')+
      field('Minutes','<input class="gd-input gd-small" id="cl-m" type="number" min="0" max="59" value="'+minute+'">')+
      field('Hand snapping','<select class="gd-select" id="cl-snap"><option value="5"'+(snap===5?' selected':'')+'>5 minutes</option><option value="1"'+(snap===1?' selected':'')+'>1 minute</option></select>','Controls direct minute-hand dragging and keyboard steps.')+
      field('Clock face','<select class="gd-select" id="cl-numerals"><option value="arabic"'+(numerals==='arabic'?' selected':'')+'>1–12</option><option value="roman"'+(numerals==='roman'?' selected':'')+'>Roman numerals I–XII</option></select>')+
      '<div class="gd-row"><button class="gd-btn gd-btn--primary" id="cl-toggle-period" type="button">Toggle am / pm</button><button class="gd-btn" id="cl-random" type="button">Random 5-minute time</button><button class="gd-btn" id="cl-now" type="button">Now</button></div>'+
      '<p class="gd-help">Drag either clock hand directly. The minute hand carries the hour forward or back when it crosses 12. Focus a hand and use ← / → for precise adjustment.</p>';
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
    const picker=CK.pickerHtml(CHALLENGE_TEMPLATES,CHALLENGE_CATEGORIES,challengeCategory,challengeType,'cl');
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
    const h=q('#cl-h'),m=q('#cl-m');if(h)h.value=hour;if(m)m.value=minute;
  }
  function restoreBeforeChallenge(){
    if(beforeChallenge){restoreSnapshot(beforeChallenge);beforeChallenge=null}
  }
  function clearChallenge(){
    restoreBeforeChallenge();challenge=null;challengeTab='standard';controlTab='challenge';renderControls();draw();
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
  function randomHour(){return Math.floor(Math.random()*24)}
  function randomMinute(step=5){return Math.floor(Math.random()*(60/step))*step}
  function differentStart(targetHour,targetMinute,step){
    const delta=[15,20,25,30,35,40,45,50,55,60][Math.floor(Math.random()*10)];
    const startTotal=mod(targetHour*60+targetMinute-delta,24*60);
    return{hour:Math.floor(startTotal/60),minute:Math.floor(startTotal%60/step)*step};
  }
  function generateChallenge(type){
    const template=CHALLENGE_TEMPLATES.find(t=>t.id===type);if(!template)return;
    if(!beforeChallenge)beforeChallenge=snapshot();else restoreSnapshot(beforeChallenge);
    numerals='arabic';snap=5;
    if(type==='read-five'){
      hour=randomHour();minute=randomMinute(5);
      challenge=challengeObject(type,'What time is shown on the analogue clock?',time12());
    }else if(type==='read-minute'){
      hour=randomHour();minute=randomMinute(1);snap=1;
      challenge=challengeObject(type,'Read the analogue clock to the nearest minute.',time12());
    }else if(type==='roman-read'){
      hour=randomHour();minute=randomMinute(5);numerals='roman';
      challenge=challengeObject(type,'What time is shown on the Roman-numeral clock?',time12());
    }else if(type==='set-five'||type==='set-minute'){
      const step=type==='set-minute'?1:5,targetHour=randomHour(),targetMinute=randomMinute(step),start=differentStart(targetHour,targetMinute,step);
      hour=start.hour;minute=start.minute;snap=step;
      const targetText=format12(targetHour,targetMinute);
      challenge=challengeObject(type,'Move the hands to '+targetText+'.',targetText,{
        freezeHands:false,targetHour,targetMinute,hiddenReadouts:['24','12']
      });
    }else if(type==='elapsed-forward'){
      hour=randomHour();minute=randomMinute(5);snap=5;
      const startHour=hour,startMinute=minute,start24=time24(),durations=[15,20,25,30,35,40,45,50,60,75,90],duration=durations[Math.floor(Math.random()*durations.length)];
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
      hour=randomHour();minute=[0,5,10,15,20,25,30,35,40,45,50,55][Math.floor(Math.random()*12)];
      challenge=challengeObject(type,'Write the time using past / to language.',spokenTime());
    }else{
      hour=1+Math.floor(Math.random()*10);minute=30;
      challenge=challengeObject(type,'A pupil says that at half past '+h12()+' the hour hand should point exactly at '+h12()+'. Are they correct?','No. At half past '+h12()+', the hour hand is halfway between '+h12()+' and '+nextH12()+'.');
    }
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
    updateChallengeAnswer();
    const hourPt=handPoint(hourAngle(),72),minutePt=handPoint(minuteAngle(),102);
    const hourLine=q('#cl-hour-hand'),minuteLine=q('#cl-minute-hand'),hourHit=q('#cl-hour-hit'),minuteHit=q('#cl-minute-hit');
    [hourLine,hourHit].forEach(el=>{if(el){el.setAttribute('x2',hourPt.x);el.setAttribute('y2',hourPt.y)}});
    [minuteLine,minuteHit].forEach(el=>{if(el){el.setAttribute('x2',minutePt.x);el.setAttribute('y2',minutePt.y)}});
    const frozen=handsFrozen(),hidden=anyTimeHidden();
    if(hourHit){
      if(hidden){hourHit.removeAttribute('aria-valuenow');hourHit.removeAttribute('aria-valuetext');hourHit.setAttribute('aria-label',frozen?'Hour hand fixed for this challenge':'Hour hand for challenge')}
      else{hourHit.setAttribute('aria-valuenow',hour);hourHit.setAttribute('aria-label','Hour hand');hourHit.setAttribute('aria-valuetext','Hour hand, '+time12())}
    }
    if(minuteHit){
      if(hidden){minuteHit.removeAttribute('aria-valuenow');minuteHit.removeAttribute('aria-valuetext');minuteHit.setAttribute('aria-label',frozen?'Minute hand fixed for this challenge':'Minute hand for challenge')}
      else{minuteHit.setAttribute('aria-valuenow',minute);minuteHit.setAttribute('aria-label','Minute hand');minuteHit.setAttribute('aria-valuetext','Minute hand, '+minute+' minutes, '+time12())}
    }
    const svg=q('#cl-face');
    if(svg){
      svg.setAttribute('aria-label',hidden?'Analogue clock for challenge':'Analogue clock showing '+time12());
      svg.dataset.clHour=String(hour);svg.dataset.clMinute=String(minute);
    }
    const d24=q('[data-cl-readout="24"]'),d12=q('[data-cl-readout="12"]');
    if(d24)d24.textContent=hiddenReadout('24')?'?':time24();
    if(d12)d12.textContent=hiddenReadout('12')?'?':time12();
    const status=q('[data-cl-target-status]');
    if(status)status.textContent=onTarget()?'On target ✓':'';
    refreshControls();
  }
  function angleFromPointer(clientX,clientY){
    const svg=q('#cl-face');if(!svg)return 0;
    const rect=svg.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    const deg=Math.atan2(clientY-cy,clientX-cx)*180/Math.PI+90;
    return mod(deg,360);
  }
  function snappedMinute(angle){
    const raw=angle/6;
    return mod(Math.round(raw/snap)*snap,60);
  }
  function setHandFromPointer(kind,clientX,clientY,carryHour){
    if(handsFrozen())return;
    const angle=angleFromPointer(clientX,clientY);
    if(kind==='minute'){
      const next=snappedMinute(angle),previous=minute;
      if(carryHour){
        if(previous>=45&&next<=15)setTime(hour+1,next);
        else if(previous<=15&&next>=45)setTime(hour-1,next);
        else minute=next;
      }else minute=next;
    }else{
      const faceHour=mod(Math.round(angle/30-minute/60),12);
      const period=hour>=12?12:0;
      hour=period+faceHour;
    }
    refreshClock();
  }
  function startDrag(kind,e){
    if(handsFrozen()||(e.button!=null&&e.button!==0))return;
    e.preventDefault();
    drag={kind,pointerId:e.pointerId};
    setHandFromPointer(kind,e.clientX,e.clientY,false);
    document.addEventListener('pointermove',dragMove);
    document.addEventListener('pointerup',dragEnd,{once:true});
    document.addEventListener('pointercancel',dragEnd,{once:true});
  }
  function dragMove(e){
    if(!drag||e.pointerId!==drag.pointerId)return;
    e.preventDefault();setHandFromPointer(drag.kind,e.clientX,e.clientY,true);
  }
  function dragEnd(e){
    if(drag&&e.pointerId!=null&&e.pointerId!==drag.pointerId)return;
    drag=null;
    document.removeEventListener('pointermove',dragMove);
    document.removeEventListener('pointerup',dragEnd);
    document.removeEventListener('pointercancel',dragEnd);
  }
  function adjustHand(kind,delta){
    if(handsFrozen())return;
    if(kind==='minute')setTime(hour,minute+delta*snap);
    else setTime(hour+delta,minute);
    refreshClock();
  }
  function bindStage(){
    const frozen=handsFrozen(),hourHit=q('#cl-hour-hit'),minuteHit=q('#cl-minute-hit');
    if(hourHit&&!frozen){
      hourHit.onpointerdown=e=>startDrag('hour',e);
      hourHit.onkeydown=e=>{
        if(e.key==='ArrowLeft'||e.key==='ArrowDown'){e.preventDefault();adjustHand('hour',-1)}
        else if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();adjustHand('hour',1)}
      };
    }
    if(minuteHit&&!frozen){
      minuteHit.onpointerdown=e=>startDrag('minute',e);
      minuteHit.onkeydown=e=>{
        if(e.key==='ArrowLeft'||e.key==='ArrowDown'){e.preventDefault();adjustHand('minute',-1)}
        else if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();adjustHand('minute',1)}
      };
    }
  }
  function bindChallengeStageActions(){
    const stage=q('#gd-stage');if(!stage||!challenge)return;
    const reveal=q('[data-board-action="reveal"]',stage);
    if(reveal)reveal.onclick=e=>{e.stopPropagation();challenge.revealed=!challenge.revealed;renderControls();draw()};
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
      return;
    }
    if(controlTab==='explore'){
      const h=q('#cl-h',controls),m=q('#cl-m',controls);
      if(h)h.oninput=()=>{if(handsFrozen()){refreshControls();return}setTime(clamp(num(h.value,hour),0,23),minute);refreshClock()};
      if(m)m.oninput=()=>{if(handsFrozen()){refreshControls();return}setTime(hour,clamp(num(m.value,minute),0,59));refreshClock()};
      const snapSelect=q('#cl-snap',controls);if(snapSelect)snapSelect.onchange=()=>{snap=Number(snapSelect.value)===1?1:5};
      const numeralSelect=q('#cl-numerals',controls);if(numeralSelect)numeralSelect.onchange=()=>{numerals=numeralSelect.value==='roman'?'roman':'arabic';draw()};
      const toggle=q('#cl-toggle-period',controls);if(toggle)toggle.onclick=()=>{if(handsFrozen())return;setTime(hour+(hour<12?12:-12),minute);refreshClock()};
      const random=q('#cl-random',controls);if(random)random.onclick=()=>{if(handsFrozen())return;hour=randomHour();minute=randomMinute(5);refreshClock()};
      const now=q('#cl-now',controls);if(now)now.onclick=()=>{if(handsFrozen())return;const d=new Date();hour=d.getHours();minute=d.getMinutes();refreshClock()};
      return;
    }
    qa('[data-cl-challenge-tab]',controls).forEach(button=>button.onclick=()=>{
      if(button.dataset.clChallengeTab==='custom')enterCustomChallenge();else{challengeTab='standard';renderControls()}
    });
    qa('[data-cl-challenge-cat]',controls).forEach(button=>button.onclick=()=>{
      challengeCategory=button.dataset.clChallengeCat;
      const first=CHALLENGE_TEMPLATES.find(t=>t.category===challengeCategory);if(first)challengeType=first.id;
      renderControls();
    });
    qa('[data-cl-challenge-type]',controls).forEach(button=>button.onclick=()=>{challengeType=button.dataset.clChallengeType;renderControls()});
    const generate=q('#cl-generate',controls);if(generate)generate.onclick=()=>generateChallenge(challengeType);
    const edit=q('#cl-edit-challenge',controls);if(edit)edit.onclick=enterCustomChallenge;
    const end=q('#cl-clear-challenge',controls);if(end)end.onclick=clearChallenge;
    const reveal=q('#cl-reveal',controls);if(reveal)reveal.onclick=()=>{if(!challenge)return;challenge.revealed=!challenge.revealed;renderControls();draw()};
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
  function draw(){
    const hp=handPoint(hourAngle(),72),mp=handPoint(minuteAngle(),102),frozen=handsFrozen(),hidden=anyTimeHidden();
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Clock challenge',actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'}]:[]}):'';
    const targetStatus=challenge&&!challenge.freezeHands&&Number.isFinite(Number(challenge.targetHour))
      ?'<div class="gd-answer-live" data-cl-target-status>'+(onTarget()?'On target ✓':'')+'</div>':'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-clock-workbench">'+
      '<div class="gd-clock"><svg id="cl-face" viewBox="0 0 300 300" role="img" aria-label="'+(hidden?'Analogue clock for challenge':'Analogue clock showing '+time12())+'" data-cl-hour="'+hour+'" data-cl-minute="'+minute+'" data-cl-frozen="'+(frozen?'true':'false')+'" data-cl-target-hour="'+(Number.isFinite(Number(challenge?.targetHour))?challenge.targetHour:'')+'" data-cl-target-minute="'+(Number.isFinite(Number(challenge?.targetMinute))?challenge.targetMinute:'')+'">'+
        '<circle class="gd-clock-face" cx="150" cy="150" r="135"></circle>'+tickMarkup()+numeralMarkup()+
        '<line class="gd-clock-hour" id="cl-hour-hand" x1="150" y1="150" x2="'+hp.x+'" y2="'+hp.y+'"></line>'+
        '<line class="gd-clock-minute" id="cl-minute-hand" x1="150" y1="150" x2="'+mp.x+'" y2="'+mp.y+'"></line>'+
        '<line class="gd-clock-hand-hit gd-clock-hand-hit--hour'+(frozen?' is-frozen':'')+'" id="cl-hour-hit" data-cl-hand="hour" tabindex="'+(frozen?'-1':'0')+'"'+(hidden?' aria-label="'+(frozen?'Hour hand fixed for this challenge':'Hour hand for challenge')+'"':' role="slider" aria-label="Hour hand" aria-valuemin="0" aria-valuemax="23" aria-valuenow="'+hour+'"')+' x1="150" y1="150" x2="'+hp.x+'" y2="'+hp.y+'"></line>'+
        '<line class="gd-clock-hand-hit gd-clock-hand-hit--minute'+(frozen?' is-frozen':'')+'" id="cl-minute-hit" data-cl-hand="minute" tabindex="'+(frozen?'-1':'0')+'"'+(hidden?' aria-label="'+(frozen?'Minute hand fixed for this challenge':'Minute hand for challenge')+'"':' role="slider" aria-label="Minute hand" aria-valuemin="0" aria-valuemax="59" aria-valuenow="'+minute+'"')+' x1="150" y1="150" x2="'+mp.x+'" y2="'+mp.y+'"></line>'+
        '<circle class="gd-clock-centre" cx="150" cy="150" r="7"></circle>'+
      '</svg></div>'+
      '<div class="gd-clock-readouts">'+
        '<div class="gd-readout"><span>24-hour</span><strong data-cl-readout="24">'+(hiddenReadout('24')?'?':time24())+'</strong></div>'+
        '<div class="gd-readout"><span>12-hour</span><strong data-cl-readout="12">'+(hiddenReadout('12')?'?':time12())+'</strong></div>'+
      '</div>'+targetStatus+
    '</div>';
    bindStage();bindChallengeStageActions();refreshClock();
  }

  setPanels(controlsHtml(),'');
  bindControls();
  draw();
}

function moneyTool(){const denoms=[1,2,5,10,20,50,100,200,500,1000,2000,5000];let tray=[];function draw(){const total=tray.reduce((a,b)=>a+b,0),target=Math.max(1,num(q('#mo-target')?.value,375));q('#gd-stage').innerHTML=`<div class="gd-vis"><div class="gd-money-palette">${denoms.map(d=>`<button type="button" class="${d<500?'gd-coin':'gd-note-money'}" data-money="${d}">${money(d)}</button>`).join('')}</div><div class="gd-money-total">${money(total)}</div><div class="gd-money-tray">${tray.map((d,i)=>`<button type="button" class="gd-btn" data-remove="${i}" title="Remove">${money(d)} ×</button>`).join('')||'<span class="gd-help">Choose coins or notes above.</span>'}</div><div class="gd-readout" style="margin-top:12px;text-align:center">Target ${money(target)} · ${total===target?'Exactly right ✓':total<target?money(target-total)+' more needed':money(total-target)+' too much'}</div></div>`;qa('[data-money]',q('#gd-stage')).forEach(x=>x.onclick=()=>{tray.push(+x.dataset.money);draw()});qa('[data-remove]',q('#gd-stage')).forEach(x=>x.onclick=()=>{tray.splice(+x.dataset.remove,1);draw()})}
setPanels(`${field('Target amount (pence)','<input class="gd-input" id="mo-target" type="number" min="1" max="10000" value="375">','375 = £3.75')}${btn('New random target','mo-random')}${btn('Clear tray','mo-clear')}<p class="gd-help">Click a coin or note to add it; click an item in the tray to remove it.</p>`,'');q('#mo-target').oninput=draw;q('#mo-random').onclick=()=>{q('#mo-target').value=(Math.floor(Math.random()*2000)+1);tray=[];draw()};q('#mo-clear').onclick=()=>{tray=[];draw()};draw()}

Object.assign(G,{numberLine,placeValue,fractionWall,barModel,hundredSquare,multiplicationGrid,arrayBuilder,clockTool,moneyTool});
})(window.TT99Goodies);
