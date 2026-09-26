(function(G){
'use strict';
if(!G)return;
const {q,qa,clamp,num,money,field,btn,setPanels}=G;
function numberLine(){let s={min:-10,max:20,step:1,marker:5};function draw(){s.min=num(q('#nl-min').value,s.min);s.max=num(q('#nl-max').value,s.max);if(s.max<=s.min)s.max=s.min+1;s.step=Math.max(.1,num(q('#nl-step').value,s.step));s.marker=clamp(num(q('#nl-marker').value,s.marker),s.min,s.max);q('#nl-marker').min=s.min;q('#nl-marker').max=s.max;q('#nl-marker').step=s.step;const range=s.max-s.min,n=Math.floor(range/s.step);const maxTicks=50,skip=Math.max(1,Math.ceil(n/maxTicks));let html='<div class="gd-vis"><div class="gd-numberline"><div class="gd-numberline__line"></div>';for(let i=0;i<=n;i+=skip){const v=s.min+i*s.step,p=(v-s.min)/range*100;html+=`<span class="gd-numberline__tick" style="left:${p}%"></span><span class="gd-numberline__label" style="left:${p}%">${Number(v.toFixed(4))}</span>`}const p=(s.marker-s.min)/range*100;html+=`<span class="gd-numberline__marker" style="left:${p}%">${Number(s.marker.toFixed(2))}</span></div><div class="gd-readout">Marker: ${Number(s.marker.toFixed(2))}</div></div>`;q('#gd-stage').innerHTML=html}
setPanels(`${field('Minimum','<input class="gd-input" id="nl-min" type="number" value="-10">')}${field('Maximum','<input class="gd-input" id="nl-max" type="number" value="20">')}${field('Step','<input class="gd-input" id="nl-step" type="number" min="0.1" step="0.1" value="1">')}${field('Move marker','<input class="gd-input" id="nl-marker" type="range" value="5">')}<div class="gd-row">${btn('− step','nl-down')}${btn('+ step','nl-up')}</div><p class="gd-help">Change the range for negatives, decimals or larger-number work.</p>`,'');['nl-min','nl-max','nl-step','nl-marker'].forEach(id=>q('#'+id).addEventListener('input',draw));q('#nl-down').onclick=()=>{q('#nl-marker').value=clamp(num(q('#nl-marker').value)-s.step,s.min,s.max);draw()};q('#nl-up').onclick=()=>{q('#nl-marker').value=clamp(num(q('#nl-marker').value)+s.step,s.min,s.max);draw()};draw()}

function placeValue(){
  const I=G.interaction,CK=G.challengeKit;
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
  function controlsHtml(){
    return '<div class="gd-row pv-mode-tabs" role="tablist" aria-label="Place Value workflow">'+
      '<button class="gd-btn'+(controlTab==='setup'?' gd-btn--primary':'')+'" type="button" data-pv-workflow="setup">Setup</button>'+
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-pv-workflow="challenge">Challenge'+(challenge?' •':'')+'</button></div>'+
      (controlTab==='challenge'?challengeControlsHtml():setupControlsHtml());
  }
  function renderControls(){
    setPanels(controlsHtml(),'');
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
      controlTab=button.dataset.pvWorkflow==='challenge'?'challenge':'setup';renderControls();
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
  let focus={n:1,d:2};

  function gcd(a,b){a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b){const t=b;b=a%b;a=t}return a||1}
  function simplify(n,d){const g=gcd(n,d);return{n:n/g,d:d/g}}
  function readFraction(prefix,defaultN,defaultD){
    const d=clamp(Math.round(num(q('#fw-'+prefix+'d')?.value,defaultD)),1,12);
    const n=clamp(Math.round(num(q('#fw-'+prefix+'n')?.value,defaultN)),0,12);
    return{n,d};
  }
  function fractionText(f){
    const s=simplify(f.n,f.d);
    return s.n===f.n&&s.d===f.d?f.n+'/'+f.d:f.n+'/'+f.d+' = '+s.n+'/'+s.d;
  }
  function equivalentNumerator(d){
    const raw=focus.n*d/focus.d;
    return Math.abs(raw-Math.round(raw))<1e-10?Math.round(raw):null;
  }
  function wallRows(){
    const rows=[];
    for(let d=1;d<=12;d++){
      const eqN=equivalentNumerator(d);
      const rowFocus=d===focus.d;
      rows.push('<div class="gd-fr-row'+(rowFocus?' is-focus-row':'')+'" data-fw-row="'+d+'" aria-label="Fraction wall denominator '+d+'">'+
        '<span class="gd-fr-row-label">'+(d===1?'whole':'1/'+d)+'</span>'+
        '<div class="gd-fr-row-pieces">'+
          Array.from({length:d},(_,i)=>{
            const equivalent=eqN!=null&&i<eqN;
            const cls='gd-fr-cell'+(equivalent?(rowFocus?' is-on':' is-equivalent'):'')+(rowFocus&&i===focus.n-1?' is-end':'');
            return '<button type="button" class="'+cls+'" data-fw-wall="'+d+':'+i+'" aria-label="'+(i+1)+'/'+d+'"></button>';
          }).join('')+
        '</div>'+
      '</div>');
    }
    return rows.join('');
  }
  function directBar(f,key){
    const groups=Math.max(1,Math.ceil(f.n/f.d));
    return '<div class="gd-fr-direct" data-fw-direct="'+key+'">'+Array.from({length:groups},(_,g)=>{
      return '<div class="gd-fr-bar">'+Array.from({length:f.d},(_,i)=>{
        const absolute=g*f.d+i+1,fill=absolute<=f.n;
        return '<button type="button" class="gd-fr-piece'+(fill?' is-fill':'')+'" data-fw-set="'+key+':'+absolute+'" aria-label="Set '+key.toUpperCase()+' numerator to '+absolute+'"></button>';
      }).join('')+'</div>';
    }).join('')+'</div>';
  }
  function syncFraction(key,f){
    const n=q('#fw-'+key+'n'),d=q('#fw-'+key+'d');
    if(n)n.value=f.n;
    if(d)d.value=f.d;
  }
  function useFocus(key){
    syncFraction(key,focus);
    draw();
  }
  function draw(){
    const a=readFraction('a',1,2),b=readFraction('b',1,3);
    syncFraction('a',a);syncFraction('b',b);
    const av=a.n/a.d,bv=b.n/b.d,sign=Math.abs(av-bv)<1e-10?'=':(av>bv?'>':'<');
    const simpleFocus=simplify(focus.n,focus.d);
    const focusText=simpleFocus.n===focus.n&&simpleFocus.d===focus.d
      ? focus.n+'/'+focus.d
      : focus.n+'/'+focus.d+' = '+simpleFocus.n+'/'+simpleFocus.d;
    q('#gd-stage').innerHTML='<div class="gd-vis gd-fractions-workspace">'+
      '<section class="gd-fr-wall-card">'+
        '<div class="gd-fr-wall-heading"><div><strong>Fraction wall</strong><span>Tap an endpoint. Equivalent amounts highlight automatically.</span></div>'+
          '<div class="gd-fr-focus"><span>Selected</span><strong>'+focusText+'</strong><button type="button" data-fw-use="a">Use as A</button><button type="button" data-fw-use="b">Use as B</button></div>'+
        '</div>'+
        '<div class="gd-fraction-wall">'+wallRows()+'</div>'+
      '</section>'+
      '<section class="gd-fr-compare gd-fr-compare-direct">'+
        '<div class="gd-fr-compare-card"><div class="gd-fr-card-head"><strong>A</strong><span>'+fractionText(a)+'</span></div>'+directBar(a,'a')+'<p>Tap a segment to change the numerator.</p></div>'+
        '<div class="gd-fr-compare-card"><div class="gd-fr-card-head"><strong>B</strong><span>'+fractionText(b)+'</span></div>'+directBar(b,'b')+'<p>Tap a segment to change the numerator.</p></div>'+
      '</section>'+
      '<div class="gd-equation gd-fr-equation"><span>'+a.n+'/'+a.d+'</span><strong>'+sign+'</strong><span>'+b.n+'/'+b.d+'</span></div>'+
    '</div>';

    qa('[data-fw-wall]',q('#gd-stage')).forEach(cell=>cell.onclick=()=>{
      const [d,i]=cell.dataset.fwWall.split(':').map(Number);
      focus={n:i+1,d};
      draw();
    });
    qa('[data-fw-use]',q('#gd-stage')).forEach(button=>button.onclick=()=>useFocus(button.dataset.fwUse));
    qa('[data-fw-set]',q('#gd-stage')).forEach(piece=>piece.onclick=()=>{
      const [key,raw]=piece.dataset.fwSet.split(':');
      const n=clamp(Math.round(num(raw,0)),0,12);
      const input=q('#fw-'+key+'n');
      if(input)input.value=n;
      draw();
    });
  }

  setPanels(
    '<p class="gd-section-title">Compare two fractions</p>'+
    '<div class="gd-row">'+
      field('A numerator','<input class="gd-input gd-small" id="fw-an" type="number" min="0" max="12" value="1">')+
      field('A denominator','<input class="gd-input gd-small" id="fw-ad" type="number" min="1" max="12" value="2">')+
    '</div>'+
    '<div class="gd-row">'+
      field('B numerator','<input class="gd-input gd-small" id="fw-bn" type="number" min="0" max="12" value="1">')+
      field('B denominator','<input class="gd-input gd-small" id="fw-bd" type="number" min="1" max="12" value="3">')+
    '</div>'+
    '<p class="gd-help">The boxes are the quickest way to set an exact comparison, including improper fractions. On the board, tap the wall to explore equivalence or tap comparison segments to change a numerator directly.</p>',
    ''
  );
  ['fw-an','fw-ad','fw-bn','fw-bd'].forEach(id=>q('#'+id).oninput=draw);
  draw();
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
