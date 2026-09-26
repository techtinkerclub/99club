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
  const I=G.interaction,CK=G.challengeKit;
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
    });
    return sources;
  }
  function resolveCustomAnswerSource(source){
    if(source==='focus')return rawFractionText(focus);
    if(source==='compare-sign'){
      const av=fractionValue(compareA),bv=fractionValue(compareB);return Math.abs(av-bv)<1e-10?'=':(av>bv?'>':'<');
    }
    const m=String(source||'').match(/^strip:(\d+):(fraction|simplified)$/);if(!m)return'';
    const strip=selectedStrip(m[1]);if(!strip)return'';
    if(m[2]==='fraction')return rawFractionText(strip);
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
      const m=String(source||'').match(/^strip:(\d+):(fraction|simplified)$/);
      if(m&&m[2]==='fraction')challenge.hiddenStripLabels=[m[1]];
      if(m&&m[2]==='simplified')challenge.hiddenStripHints=[m[1]];
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
  function controlsHtml(){return mode==='workbench'?workbenchControlsHtml():wallControlsHtml()}
  function renderControls(){const panel=q('#gd-controls');if(panel)panel.innerHTML=controlsHtml();bindControls()}

  function drawWall(){
    const a=readCompare('a'),b=readCompare('b'),av=a.n/a.d,bv=b.n/b.d,sign=Math.abs(av-bv)<1e-10?'=':(av>bv?'>':'<');
    const simpleFocus=simplify(focus.n,focus.d);
    const focusText=simpleFocus.n===focus.n&&simpleFocus.d===focus.d?focus.n+'/'+focus.d:focus.n+'/'+focus.d+' = '+simpleFocus.n+'/'+simpleFocus.d;
    q('#gd-stage').innerHTML='<div class="gd-vis gd-fractions-workspace">'+
      '<section class="gd-fr-wall-card">'+
        '<div class="gd-fr-wall-heading"><div><strong>Fraction wall</strong><span>Tap an endpoint. Equivalent amounts highlight automatically.</span></div>'+
          '<div class="gd-fr-focus"><span>Selected</span><strong>'+focusText+'</strong><button type="button" data-fw-use="a">Use as A</button><button type="button" data-fw-use="b">Use as B</button><button type="button" data-fw-to-workbench>Add strip</button></div>'+
        '</div><div class="gd-fraction-wall">'+wallRows()+'</div>'+
      '</section>'+
      '<section class="gd-fr-compare gd-fr-compare-direct">'+
        '<div class="gd-fr-compare-card"><div class="gd-fr-card-head"><strong>A</strong><span>'+fractionText(a)+'</span></div>'+directBar(a,'a')+'<p>Tap a segment to change the numerator.</p></div>'+
        '<div class="gd-fr-compare-card"><div class="gd-fr-card-head"><strong>B</strong><span>'+fractionText(b)+'</span></div>'+directBar(b,'b')+'<p>Tap a segment to change the numerator.</p></div>'+
      '</section>'+
      '<div class="gd-equation gd-fr-equation"><span>'+a.n+'/'+a.d+'</span><strong>'+sign+'</strong><span>'+b.n+'/'+b.d+'</span></div></div>';

    qa('[data-fw-wall]',q('#gd-stage')).forEach(cell=>cell.onclick=()=>{
      const [d,i]=cell.dataset.fwWall.split(':').map(Number);focus={n:i+1,d};renderControls();drawWall();
    });
    qa('[data-fw-use]',q('#gd-stage')).forEach(button=>button.onclick=()=>{
      const value=normalFraction(focus);if(button.dataset.fwUse==='a')compareA=value;else compareB=value;renderControls();drawWall();
    });
    qa('[data-fw-set]',q('#gd-stage')).forEach(piece=>piece.onclick=()=>{
      const [key,raw]=piece.dataset.fwSet.split(':'),current=key==='a'?compareA:compareB;
      const value={n:clamp(Math.round(num(raw,0)),0,current.d*3),d:current.d};
      if(key==='a')compareA=value;else compareB=value;renderControls();drawWall();
    });
    const toWorkbench=q('[data-fw-to-workbench]',q('#gd-stage'));
    if(toWorkbench)toWorkbench.onclick=()=>{
      addStrip(focus);
      switchMode('workbench');
    };
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
    return '<div class="gd-fr-strip-object'+(selected?' is-selected':'')+(same?' is-equivalent':'')+(strip.locked?' is-locked':'')+'" data-gd-object="'+strip.id+'" role="button" tabindex="0" aria-selected="'+(selected?'true':'false')+'" aria-label="Fraction strip '+strip.n+'/'+strip.d+(strip.locked?', locked':'')+'" style="left:'+strip.x+'px;top:'+strip.y+'px;--fr-strip:'+strip.color+'">'+
      '<div class="gd-fr-strip-head"><strong>'+strip.n+'/'+strip.d+'</strong><span>'+fractionText(strip)+'</span>'+(same?'<em>same value</em>':'')+(strip.locked?'<b aria-hidden="true">⌑</b>':'')+'</div>'+
      '<div class="gd-fr-strip-bars">'+stripBars(strip)+'</div>'+
      (canSimplify?'<small>Can simplify to '+simple.n+'/'+simple.d+'</small>':'<small>Value '+Number(fractionValue(strip).toFixed(4))+'</small>')+
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
    q('#gd-stage').innerHTML='<div class="gd-vis gd-fr-workbench"><div class="gd-fr-strip-canvas-wrap"><div class="gd-fr-strip-canvas" id="fw-strip-canvas" data-gd-canvas-bg style="min-height:'+workbenchHeight()+'px" tabindex="0" aria-label="Fraction strip workbench. Drag strips to compare them.">'+
      strips.map(s=>stripMarkup(s,selectedId)).join('')+
      '</div>'+workbenchRail(selected,meta)+'</div>'+
      '<div class="gd-object-hint">'+(selected?(selected.locked?'Strip locked · unlock it to change or move it.':'Drag to compare · split keeps the same value with twice as many equal pieces.'):'Select a strip, drag it, or align all strips to compare their lengths.')+'</div></div>';
    bindStripSegments();
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
      controller.mutate(()=>{strip.n=clamp(Math.round(num(nRaw,strip.n)),0,strip.d*3)});
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
        if(action==='split'&&selected&&!selected.locked&&selected.d*2<=12)api.mutate(()=>{selected.n*=2;selected.d*=2});
        else if(action==='simplify'&&selected&&!selected.locked)api.mutate(()=>{const s=simplify(selected.n,selected.d);selected.n=s.n;selected.d=s.d});
        else if(action==='align')api.mutate(alignStrips);
      }
    });
    controller.refresh();
  }
  function switchMode(next){
    mode=next==='workbench'?'workbench':'wall';
    if(mode==='wall'){I?.clear?.();controller=null;renderControls();drawWall()}
    else{renderControls();mountWorkbench()}
  }
  function bindControls(){
    qa('[data-fw-mode]',q('#gd-controls')).forEach(button=>button.onclick=()=>switchMode(button.dataset.fwMode));
    if(mode==='wall'){
      ['fw-an','fw-ad','fw-bn','fw-bd'].forEach(id=>{const el=q('#'+id);if(el)el.oninput=()=>{readCompare(id[3]);drawWall()}});
      return;
    }
    const add=q('#fw-add-strip');if(add)add.onclick=()=>{
      const raw={n:num(q('#fw-add-n')?.value,focus.n),d:num(q('#fw-add-d')?.value,focus.d)};
      let id=null;controller.mutate(()=>{id=addStrip(raw)});controller.select(id);
    };
    const addFocus=q('#fw-add-focus');if(addFocus)addFocus.onclick=()=>{let id=null;controller.mutate(()=>{id=addStrip(focus)});controller.select(id)};
    const align=q('#fw-align');if(align)align.onclick=()=>controller.mutate(alignStrips);
    const clear=q('#fw-clear-strips');if(clear)clear.onclick=()=>{
      if(!strips.length)return;if(!window.confirm('Clear all fraction strips from the workbench?'))return;
      controller.mutate(()=>{strips=[]});
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

function arrayBuilder(){function draw(){const r=clamp(num(q('#ab-r').value,4),1,12),c=clamp(num(q('#ab-c').value,6),1,12);q('#gd-stage').innerHTML=`<div class="gd-vis"><div class="gd-array" style="grid-template-columns:repeat(${c},20px)">${Array.from({length:r*c},()=>'<span class="gd-dot"></span>').join('')}</div><div class="gd-equation">${r} × ${c} = ${r*c}</div><div class="gd-readout" style="margin-top:12px;text-align:center">${Array.from({length:r},()=>c).join(' + ')} = ${r*c} &nbsp; · &nbsp; ${r*c} ÷ ${r} = ${c}</div></div>`}
setPanels(`${field('Rows','<input class="gd-input" id="ab-r" type="range" min="1" max="12" value="4">')}${field('Columns','<input class="gd-input" id="ab-c" type="range" min="1" max="12" value="6">')}<div class="gd-row">${btn('Random array','ab-random')}</div>`,'');['ab-r','ab-c'].forEach(id=>q('#'+id).oninput=draw);q('#ab-random').onclick=()=>{q('#ab-r').value=1+Math.floor(Math.random()*12);q('#ab-c').value=1+Math.floor(Math.random()*12);draw()};draw()}

function clockTool(){function draw(){const h=clamp(num(q('#cl-h').value,10),0,23),m=clamp(num(q('#cl-m').value,10),0,59),h12=h%12||12,ha=(h%12+m/60)*30,ma=m*6;const nums=Array.from({length:12},(_,i)=>{const n=i+1,a=(n*30-90)*Math.PI/180,x=150+112*Math.cos(a),y=150+112*Math.sin(a);return `<text class="gd-clock-num" x="${x}" y="${y}">${n}</text>`}).join('');const hand=(angle,len,cls)=>{const a=(angle-90)*Math.PI/180;return `<line class="${cls}" x1="150" y1="150" x2="${150+len*Math.cos(a)}" y2="${150+len*Math.sin(a)}"></line>`};q('#gd-stage').innerHTML=`<div class="gd-vis"><div class="gd-clock"><svg viewBox="0 0 300 300" role="img" aria-label="Analogue clock showing ${h12}:${String(m).padStart(2,'0')}"><circle class="gd-clock-face" cx="150" cy="150" r="135"></circle>${nums}${hand(ha,72,'gd-clock-hour')}${hand(ma,102,'gd-clock-minute')}<circle class="gd-clock-centre" cx="150" cy="150" r="7"></circle></svg></div><div class="gd-digital">${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} <small>(${h12}:${String(m).padStart(2,'0')} ${h<12?'am':'pm'})</small></div></div>`}
setPanels(`${field('Hour','<input class="gd-input" id="cl-h" type="range" min="0" max="23" value="10">')}${field('Minutes','<input class="gd-input" id="cl-m" type="range" min="0" max="59" step="1" value="10">')}<div class="gd-row">${btn('Random 5-minute time','cl-random')}${btn('Now','cl-now')}</div>`,'');['cl-h','cl-m'].forEach(id=>q('#'+id).oninput=draw);q('#cl-random').onclick=()=>{q('#cl-h').value=Math.floor(Math.random()*24);q('#cl-m').value=Math.floor(Math.random()*12)*5;draw()};q('#cl-now').onclick=()=>{const d=new Date();q('#cl-h').value=d.getHours();q('#cl-m').value=d.getMinutes();draw()};draw()}

function moneyTool(){const denoms=[1,2,5,10,20,50,100,200,500,1000,2000,5000];let tray=[];function draw(){const total=tray.reduce((a,b)=>a+b,0),target=Math.max(1,num(q('#mo-target')?.value,375));q('#gd-stage').innerHTML=`<div class="gd-vis"><div class="gd-money-palette">${denoms.map(d=>`<button type="button" class="${d<500?'gd-coin':'gd-note-money'}" data-money="${d}">${money(d)}</button>`).join('')}</div><div class="gd-money-total">${money(total)}</div><div class="gd-money-tray">${tray.map((d,i)=>`<button type="button" class="gd-btn" data-remove="${i}" title="Remove">${money(d)} ×</button>`).join('')||'<span class="gd-help">Choose coins or notes above.</span>'}</div><div class="gd-readout" style="margin-top:12px;text-align:center">Target ${money(target)} · ${total===target?'Exactly right ✓':total<target?money(target-total)+' more needed':money(total-target)+' too much'}</div></div>`;qa('[data-money]',q('#gd-stage')).forEach(x=>x.onclick=()=>{tray.push(+x.dataset.money);draw()});qa('[data-remove]',q('#gd-stage')).forEach(x=>x.onclick=()=>{tray.splice(+x.dataset.remove,1);draw()})}
setPanels(`${field('Target amount (pence)','<input class="gd-input" id="mo-target" type="number" min="1" max="10000" value="375">','375 = £3.75')}${btn('New random target','mo-random')}${btn('Clear tray','mo-clear')}<p class="gd-help">Click a coin or note to add it; click an item in the tray to remove it.</p>`,'');q('#mo-target').oninput=draw;q('#mo-random').onclick=()=>{q('#mo-target').value=(Math.floor(Math.random()*2000)+1);tray=[];draw()};q('#mo-clear').onclick=()=>{tray=[];draw()};draw()}

Object.assign(G,{numberLine,placeValue,fractionWall,barModel,hundredSquare,multiplicationGrid,arrayBuilder,clockTool,moneyTool});
})(window.TT99Goodies);
