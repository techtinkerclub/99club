(function(G){
'use strict';
if(!G)return;
const {q,qa,esc,clamp,num,field,btn}=G;

function abacusTool(){
  const X=G.exportTools;
  let rows=5,counts=Array(5).fill(0),kind='western',showTotal=true,showRowCounts=false,showRowLabels=true;
  let workflow='setup',playMode='free',task=null,taskContext='play',status='',answerInput='',revealed=false,exportStatus='';
  let drag=null;

  const MODES=[
    ['free','Free play'],
    ['show','Show number'],
    ['add','Addition'],
    ['subtract','Subtraction'],
    ['make10','Make 10'],
    ['bond','Number bonds'],
    ['double','Doubles'],
    ['near','Near doubles'],
    ['missing','Missing number'],
    ['skip','Skip counting']
  ];
  const CHALLENGE_MODES=MODES.filter(([id])=>id!=='free');

  // The right-hand column is ones. Each column is a decimal digit (0–9).
  function capacity(){return Math.pow(10,rows)-1}
  function total(){return counts.reduce((sum,digit,i)=>sum+digit*Math.pow(10,rows-i-1),0)}
  function normal(v){return clamp(Math.round(num(v,0)),0,capacity())}
  function setRows(next){
    const previous=total();
    rows=[3,4,5,6].includes(Number(next))?Number(next):5;
    counts=Array(rows).fill(0);
    setTotal(previous,false);
  }
  function setTotal(value,render=true){
    counts=Array.from(String(normal(value)).padStart(rows,'0'),digit=>Number(digit));
    if(render)renderStage();
  }
  function placeLabel(i){return ['Ones','Tens','Hundreds','Thousands','Ten thousands','Hundred thousands'][rows-i-1]}
  function placeShort(i){return ['1s','10s','100s','1k','10k','100k'][rows-i-1]}
  function abBeadY(i,part,j){
    const d=counts[i]||0;
    if(kind==='western')return j<d?6+j*8.4:92-(8-j)*8.4;
    if(part==='upper')return d>=5?36:12;
    return j<d%5?44+j*8.5:67+j*8.5;
  }
  function abBeadActive(i,part,j){
    const d=counts[i]||0;
    return kind==='western'?j<d:part==='upper'?d>=5:j<d%5;
  }
  function randomInt(min,max){return Math.floor(Math.random()*(max-min+1))+min}
  function beadX(index,count){return index<count?4+index*4.5:55+index*4.5}
  function taskSolved(){
    if(!task)return false;
    const valueOk=total()===task.target;
    const answerOk=!task.requiresAnswer||String(answerInput).trim()!==''&&Number(answerInput)===Number(task.answer);
    return valueOk&&answerOk;
  }
  function taskTitle(mode=playMode){
    return ({
      show:'Show a number',add:'Addition',subtract:'Subtraction',make10:'Make 10',bond:'Number bonds',
      double:'Doubles',near:'Near doubles',missing:'Missing number',skip:'Skip counting'
    })[mode]||'Abacus';
  }
  function generatedTask(mode){
    const cap=Math.min(capacity(),rows===3?999:9999);
    if(mode==='show'){
      const target=randomInt(1,cap);
      return{mode,start:0,target,prompt:'Show '+target+' on the abacus.',requiresAnswer:false};
    }
    if(mode==='add'){
      let a=randomInt(1,Math.max(1,cap-1)),b=randomInt(1,Math.max(1,cap-a));
      if(cap>=12&&Math.random()<.65){
        const low=Math.max(1,10-(a%10));
        if(low<=cap-a)b=randomInt(low,Math.max(low,cap-a));
      }
      return{mode,start:a,target:a+b,a,b,prompt:'Start at '+a+'. Add '+b+'.',requiresAnswer:false};
    }
    if(mode==='subtract'){
      const a=randomInt(2,cap),b=randomInt(1,a);
      return{mode,start:a,target:a-b,a,b,prompt:'Start at '+a+'. Subtract '+b+'.',requiresAnswer:false};
    }
    if(mode==='make10'){
      const a=randomInt(1,9),answer=10-a;
      return{mode,start:a,target:10,a,answer,requiresAnswer:true,prompt:'Start at '+a+'. How many more make 10?'};
    }
    if(mode==='bond'){
      const bondTotal=cap>=20&&Math.random()<.5?20:10;
      const a=randomInt(1,bondTotal-1),answer=bondTotal-a;
      return{mode,start:a,target:bondTotal,a,answer,requiresAnswer:true,prompt:'Complete the number bond: '+a+' + ? = '+bondTotal+'.'};
    }
    if(mode==='double'){
      const a=randomInt(1,Math.max(1,Math.floor(cap/2)));
      return{mode,start:a,target:a*2,a,prompt:'Double '+a+'. Start at '+a+' and add another '+a+'.',requiresAnswer:false};
    }
    if(mode==='near'){
      let a=randomInt(2,Math.max(2,Math.floor(cap/2))),b=a+(Math.random()<.5?-1:1);
      b=Math.max(1,b);
      while(a+b>cap&&a>2){a--;b=Math.max(1,a-1)}
      return{mode,start:a,target:a+b,a,b,prompt:'Use a near double to work out '+a+' + '+b+'.',requiresAnswer:false};
    }
    if(mode==='missing'){
      const target=randomInt(5,cap),a=randomInt(0,target-1),answer=target-a;
      return{mode,start:a,target,a,answer,requiresAnswer:true,finalTarget:target,prompt:a+' + ? = '+target+'. Find the missing number, then show '+target+'.'};
    }
    if(mode==='skip'){
      const possible=[2,5,10].filter(s=>s<=cap),step=possible[randomInt(0,possible.length-1)];
      const maxStart=Math.max(0,cap-step),start=Math.floor(randomInt(0,maxStart)/step)*step,target=start+step;
      return{mode,start,target,step,answer:target,requiresAnswer:true,prompt:'Count in '+step+'s. What comes after '+start+'? Show it on the abacus.'};
    }
    return null;
  }
  function newTask(mode=playMode,context=workflow==='challenge'?'challenge':'play',custom=null){
    playMode=mode;taskContext=context==='challenge'?'challenge':'play';status='';answerInput='';revealed=false;
    if(mode==='free'){task=null;taskContext='play';renderAll();return}
    task=custom||generatedTask(mode);
    if(task.mode==='missing')task.target=task.finalTarget;
    setTotal(task.start,false);
    workflow=taskContext==='challenge'?'challenge':'play';
    renderAll();
  }
  function randomChallenge(surface='panel'){
    const [mode]=CHALLENGE_MODES[randomInt(0,CHALLENGE_MODES.length-1)];
    newTask(mode,'challenge');
    if(surface==='frame'){
      workflow='play';
      renderAll();
    }
  }
  function checkTask(){
    if(!task)return;
    if(taskSolved())status='Correct ✓';
    else if(total()!==task.target)status='Not yet — the abacus shows '+total()+'.';
    else status='The beads are right. Enter the missing number too.';
    syncStage();
  }
  function revealTask(){
    if(!task)return;
    revealed=true;setTotal(task.target,false);
    if(task.requiresAnswer)answerInput=String(task.answer);
    status='Answer shown';
    renderStage();
  }
  function setRowCount(i,value){
    if(!Number.isInteger(i)||i<0||i>=rows)return;
    counts[i]=clamp(Math.round(num(value,0)),0,9);
    status='';revealed=false;syncStage();
  }
  function clickBead(i,part,j){
    const digit=counts[i]||0;
    if(kind==='western')return setRowCount(i,j<digit?j:j+1);
    if(part==='upper')return setRowCount(i,digit>=5?digit-5:digit+5);
    const low=digit%5;
    setRowCount(i,(digit>=5?5:0)+(j<low?j:j+1));
  }
  function frameControls(){
    return '<div class="gd-row gd-ab-stage-actions"><button class="gd-btn" type="button" data-ab-stage="clear">Clear beads</button></div>';
  }
  function taskBanner(){
    if(!task)return '';
    const context=taskContext==='challenge'?'CHALLENGE':'PLAY';
    const answer=task.requiresAnswer?'<label class="gd-ab-answer">Answer <input type="number" inputmode="numeric" data-ab-answer value="'+esc(answerInput)+'"></label>':'';
    const reveal=taskContext==='challenge'?'<button type="button" data-ab-reveal>Reveal</button>':'';
    const skipNext=task.mode==='skip'&&workflow==='play'?'<button type="button" data-ab-skip-next>Next '+task.step+'</button>':'';
    return '<section class="gd-ab-task" data-ab-task="'+task.mode+'">'+
      '<div class="gd-ab-task-head"><div><span>'+context+' · '+esc(taskTitle(task.mode).toUpperCase())+'</span><strong>'+esc(task.prompt)+'</strong></div><em data-ab-status>'+esc(status)+'</em></div>'+
      answer+
      '<div class="gd-ab-task-actions"><button type="button" data-ab-check>Check</button>'+skipNext+reveal+'<button type="button" data-ab-another>Another</button></div>'+
    '</section>';
  }
  function beadMarkup(i,part,j){
    const active=abBeadActive(i,part,j);
    const label=(part==='upper'?'Five bead ':part==='lower'?'One bead ':'Bead ')+(j+1);
    return '<button type="button" class="gd-ab-bead'+(active?' is-active':'')+'" data-ab-bead="'+i+':'+part+':'+j+'" style="--ab-'+(kind==='western'?'x':'y')+':'+abBeadY(i,part,j)+'" aria-pressed="'+active+'" aria-label="'+esc(placeLabel(i)+' · '+label+(active?' active':' inactive'))+'"><span aria-hidden="true"></span></button>';
  }
  function columnMarkup(i){
    const digit=counts[i]||0;
    const beads=kind==='western'
      ?Array.from({length:9},(_,j)=>beadMarkup(i,'unit',j)).join('')
      :beadMarkup(i,'upper',0)+Array.from({length:4},(_,j)=>beadMarkup(i,'lower',j)).join('');
    return '<div class="gd-ab-col" data-ab-col="'+i+'">'+
      '<div class="gd-ab-col-label'+(showRowLabels?'':' is-hidden')+'"><span>'+esc(placeLabel(i))+'</span><abbr title="'+esc(placeLabel(i))+'">'+esc(placeShort(i))+'</abbr></div>'+
      '<div class="gd-ab-rod" aria-label="'+esc(placeLabel(i)+', digit '+digit)+'">'+
      '<span class="gd-ab-rail" aria-hidden="true"></span>'+
      (kind==='soroban'?'<span class="gd-ab-divider" aria-hidden="true"></span>':'')+
      beads+'</div>'+
      '<div class="gd-ab-digit"'+(showRowCounts?'':' hidden')+' data-ab-col-count="'+i+'">'+digit+'</div>'+
    '</div>';
  }
  function renderStage(){
    const hideTotal=!!task&&taskContext==='challenge'&&!revealed&&status!=='Correct ✓';
    q('#gd-stage').innerHTML=taskBanner()+
      '<div hidden aria-hidden="true">'+['copy','png','svg','print'].map(type=>'<button type="button" data-gd-direct-export="'+type+'">'+type+'</button>').join('')+'</div>'+
      '<div class="gd-ab-workspace">'+
        '<div class="gd-ab-frame gd-ab-frame--'+kind+'" data-ab-frame>'+
          '<div class="gd-ab-type-label">'+(kind==='western'?'WESTERN · BASE TEN':'JAPANESE · SOROBAN')+'</div>'+
          '<div class="gd-ab-columns" style="--ab-cols:'+rows+'">'+Array.from({length:rows},(_,i)=>columnMarkup(i)).join('')+'</div>'+
        '</div>'+
        frameControls()+
        '<div class="gd-ab-summary"'+(showTotal?'':' hidden')+'><span>Number shown</span><strong data-ab-total>'+(hideTotal?'?':total().toLocaleString('en-GB'))+'</strong></div>'+
        '<p class="gd-object-hint" data-ab-hint>'+(task?'Move the beads, then check your answer.':kind==='soroban'?'Move beads towards the middle bar to count them.':'Move beads left to count them. Each horizontal row has a place value.')+'</p>'+
      '</div>';
    bindStage();
  }
  function syncStage(){
    qa('[data-ab-col]').forEach(colEl=>{
      const i=Number(colEl.dataset.abCol),digit=counts[i]||0;
      qa('[data-ab-bead]',colEl).forEach(bead=>{
        const [,part,jText]=String(bead.dataset.abBead).split(':'),j=Number(jText),active=abBeadActive(i,part,j);
        bead.classList.toggle('is-active',active);
        bead.setAttribute('aria-pressed',String(active));
        bead.style.setProperty(kind==='western'?'--ab-x':'--ab-y',String(abBeadY(i,part,j)));
      });
      const count=q('[data-ab-col-count="'+i+'"]',colEl);if(count)count.textContent=String(digit);
      const rod=q('.gd-ab-rod',colEl);if(rod)rod.setAttribute('aria-label',placeLabel(i)+', digit '+digit);
    });
    const hideTotal=!!task&&taskContext==='challenge'&&!revealed&&status!=='Correct ✓';
    const totalEl=q('[data-ab-total]');if(totalEl)totalEl.textContent=hideTotal?'?':total().toLocaleString('en-GB');
    const statusEl=q('[data-ab-status]');if(statusEl)statusEl.textContent=status;
    const input=q('[data-ab-answer]');if(input&&document.activeElement!==input)input.value=answerInput;
    const reveal=q('[data-ab-reveal]');if(reveal)reveal.hidden=!!revealed||status==='Correct ✓';
    const check=q('[data-ab-check]');if(check)check.disabled=status==='Correct ✓';
  }
  function setupControls(){
    return field('Abacus type','<select class="gd-select" id="ab-kind"><option value="western"'+(kind==='western'?' selected':'')+'>Western (9 beads per rod)</option><option value="soroban"'+(kind==='soroban'?' selected':'')+'>Japanese soroban (5 beads per rod)</option></select>')+
      field('Place-value columns','<select class="gd-select" id="ab-rows">'+[3,4,5,6].map(n=>'<option value="'+n+'"'+(rows===n?' selected':'')+'>'+n+' columns</option>').join('')+'</select>')+
      field('Set number','<div class="gd-row"><input class="gd-input" id="ab-set-number" type="number" min="0" max="'+capacity()+'" value="'+total()+'"><button class="gd-btn gd-btn--primary" id="ab-set" type="button">Set</button></div>')+
      '<div class="gd-row">'+btn('Random','ab-random')+btn('Clear','ab-clear')+'</div>'+
      '<label class="gd-row gd-ab-check"><input id="ab-show-total" type="checkbox"'+(showTotal?' checked':'')+'> Show number</label>'+
      '<label class="gd-row gd-ab-check"><input id="ab-row-counts" type="checkbox"'+(showRowCounts?' checked':'')+'> Show column digits</label>'+
      '<label class="gd-row gd-ab-check"><input id="ab-row-labels" type="checkbox"'+(showRowLabels?' checked':'')+'> Show place values</label>'+
      '<p class="gd-help">'+(kind==='western'?'Nine beads per horizontal place-value row. Slide them left to count.':'Soroban: upper bead is 5; four lower beads are 1 each. Beads count when moved towards the middle bar.')+'</p>';
  }
  function modeButtons(attr){
    return '<div class="gd-ab-mode-grid">'+MODES.map(([id,label])=>'<button class="gd-btn'+(playMode===id?' gd-btn--primary':'')+'" type="button" '+attr+'="'+id+'">'+label+'</button>').join('')+'</div>';
  }
  function playControls(){
    let extra='';
    if(playMode==='show')extra=field('Target number','<div class="gd-row"><input class="gd-input" id="ab-custom-target" type="number" min="0" max="'+capacity()+'" value="'+(task?.mode==='show'?task.target:Math.min(12,capacity()))+'"><button class="gd-btn" id="ab-custom-show" type="button">Set task</button></div>');
    if(playMode==='add')extra='<div class="gd-row gd-ab-pair">'+field('Start','<input class="gd-input" id="ab-a" type="number" min="0" max="'+capacity()+'" value="'+(task?.a??7)+'">')+field('Add','<input class="gd-input" id="ab-b" type="number" min="0" max="'+capacity()+'" value="'+(task?.b??5)+'">')+'</div><button class="gd-btn" id="ab-custom-add" type="button">Set addition</button>';
    if(playMode==='subtract')extra='<div class="gd-row gd-ab-pair">'+field('Start','<input class="gd-input" id="ab-a" type="number" min="0" max="'+capacity()+'" value="'+(task?.a??12)+'">')+field('Subtract','<input class="gd-input" id="ab-b" type="number" min="0" max="'+capacity()+'" value="'+(task?.b??5)+'">')+'</div><button class="gd-btn" id="ab-custom-subtract" type="button">Set subtraction</button>';
    return modeButtons('data-ab-play-mode')+extra+(playMode==='free'?'<p class="gd-help">Free play keeps the frame completely open for teacher or pupil modelling.</p>':'<div class="gd-row"><button class="gd-btn" id="ab-new-task" type="button">New task</button></div>');
  }
  function challengeControls(){
    return '<div class="gd-ab-mode-grid">'+CHALLENGE_MODES.map(([id,label])=>'<button class="gd-btn'+(task?.mode===id?' gd-btn--primary':'')+'" type="button" data-ab-challenge-mode="'+id+'">'+label+'</button>').join('')+'</div>'+
      '<button class="gd-btn gd-btn--primary" id="ab-random-challenge" type="button">Random challenge</button>'+
      '<p class="gd-help">Challenges hide the total until the pupil checks or reveals the answer.</p>';
  }
  function exportControls(){
    return '<div class="nl-panel-title"><div><strong>Paper export</strong><span>Clean abacus or current challenge.</span></div></div>'+
      '<div class="nl-export-grid"><button class="gd-btn gd-btn--primary" id="ab-copy" type="button">Copy image</button><button class="gd-btn" id="ab-png" type="button">PNG</button><button class="gd-btn" id="ab-svg" type="button">SVG</button><button class="gd-btn" id="ab-print" type="button">Print / PDF</button></div>'+
      '<p class="gd-help" id="ab-export-status" role="status">'+esc(exportStatus)+'</p>';
  }
  function controlsHtml(){
    return '<button type="button" data-ab-random-challenge hidden aria-hidden="true" tabindex="-1">Challenge</button>'+
      '<div class="gd-row gd-ab-workflow" role="tablist" aria-label="Abacus workflow">'+
        [['setup','Setup'],['play','Teach / play'],['challenge','Challenge'],['export','Export']].map(([id,label])=>'<button class="gd-btn'+(workflow===id?' gd-btn--primary':'')+'" type="button" data-ab-workflow="'+id+'">'+label+'</button>').join('')+
      '</div>'+
      (workflow==='setup'?setupControls():workflow==='play'?playControls():workflow==='challenge'?challengeControls():exportControls());
  }
  function renderControls(){q('#gd-controls').innerHTML=controlsHtml();bindControls()}
  function renderAll(){renderControls();renderStage()}

  function bindStage(){
    qa('[data-ab-bead]').forEach(bead=>{
      bead.onclick=e=>{
        e.stopPropagation();
        if(bead.dataset.abDragged==='1'){bead.dataset.abDragged='';return}
        const [i,part,j]=String(bead.dataset.abBead).split(':');
        clickBead(Number(i),part,Number(j));
      };
      bead.onpointerdown=e=>{
        if(e.button!==0)return;
        const [i,part,j]=String(bead.dataset.abBead).split(':'),col=Number(i);
        drag={col,part,index:Number(j),startY:e.clientY,startX:e.clientX,initial:counts[col]||0,moved:false};
        try{bead.setPointerCapture(e.pointerId)}catch(_){}
      };
      bead.onpointermove=e=>{
        if(!drag)return;
        const delta=kind==='western'?e.clientX-drag.startX:e.clientY-drag.startY;
        if(Math.abs(delta)<10)return;
        drag.moved=true;
        const d=drag;
        if(kind==='western')setRowCount(d.col,d.initial-Math.round(delta/23));
        else if(d.part==='upper')setRowCount(d.col,d.initial%5+(delta>0?5:0));
        else setRowCount(d.col,(d.initial>=5?5:0)+clamp(d.initial%5-Math.round(delta/23),0,4));
      };
      bead.onpointerup=()=>{
        if(!drag)return;
        const moved=drag.moved;drag=null;
        if(moved)bead.dataset.abDragged='1';
      };
      bead.onpointercancel=()=>{drag=null};
    });
    qa('[data-ab-stage]').forEach(button=>button.onclick=e=>{
      e.stopPropagation();
      if(button.dataset.abStage==='clear')setTotal(0);
    });
    const answer=q('[data-ab-answer]');if(answer){
      answer.oninput=e=>{answerInput=e.target.value;status='';const st=q('[data-ab-status]');if(st)st.textContent=''};
      answer.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();checkTask()}};
    }
    const check=q('[data-ab-check]');if(check)check.onclick=checkTask;
    const another=q('[data-ab-another]');if(another)another.onclick=()=>newTask(task?.mode||playMode,taskContext);
    const reveal=q('[data-ab-reveal]');if(reveal)reveal.onclick=()=>{if(!taskSolved())revealTask()};
    const skip=q('[data-ab-skip-next]');if(skip)skip.onclick=()=>{
      if(!task||task.mode!=='skip')return;
      setTotal(task.target,false);
      const nextStart=task.target,nextTarget=Math.min(capacity(),nextStart+task.step);
      status=nextTarget===nextStart?'Reached the end of this frame.':'Next: '+nextStart+' → '+nextTarget;
      task.start=nextStart;task.target=nextTarget;task.answer=nextTarget;
      task.prompt='Keep counting in '+task.step+'s. What comes after '+nextStart+'?';
      renderStage();
    };
    qa('[data-gd-direct-export]').forEach(button=>button.onclick=e=>{e.stopPropagation();exportAction(button.dataset.gdDirectExport)});
  }
  function bindControls(){
    qa('[data-ab-workflow]').forEach(button=>button.onclick=()=>{
      const next=button.dataset.abWorkflow,previous=workflow;
      workflow=next;
      status='';revealed=false;
      if(next==='challenge'){task=null;taskContext='challenge';answerInput=''}
      else if(next==='play'&&previous==='challenge'){task=null;taskContext='play';answerInput='';playMode='free'}
      else if(next==='setup'){taskContext='play'}
      renderAll();
    });
    const kindEl=q('#ab-kind');if(kindEl)kindEl.onchange=()=>{kind=kindEl.value==='soroban'?'soroban':'western';task=null;renderAll()};
    const rowsEl=q('#ab-rows');if(rowsEl)rowsEl.onchange=()=>{setRows(rowsEl.value);task=null;renderAll()};
    const set=q('#ab-set');if(set)set.onclick=()=>{setTotal(q('#ab-set-number')?.value);task=null;renderControls()};
    const random=q('#ab-random');if(random)random.onclick=()=>{setTotal(randomInt(0,capacity()));task=null;renderControls()};
    const clear=q('#ab-clear');if(clear)clear.onclick=()=>{setTotal(0);task=null;renderControls()};
    const totalToggle=q('#ab-show-total');if(totalToggle)totalToggle.onchange=()=>{showTotal=totalToggle.checked;renderStage()};
    const rowCounts=q('#ab-row-counts');if(rowCounts)rowCounts.onchange=()=>{showRowCounts=rowCounts.checked;renderStage()};
    const rowLabels=q('#ab-row-labels');if(rowLabels)rowLabels.onchange=()=>{showRowLabels=rowLabels.checked;renderStage()};
    qa('[data-ab-play-mode]').forEach(button=>button.onclick=()=>{workflow='play';newTask(button.dataset.abPlayMode,'play')});
    qa('[data-ab-challenge-mode]').forEach(button=>button.onclick=()=>newTask(button.dataset.abChallengeMode,'challenge'));
    const randomChallengeButton=q('#ab-random-challenge');if(randomChallengeButton)randomChallengeButton.onclick=randomChallenge;
    const hiddenRandom=q('[data-ab-random-challenge]');if(hiddenRandom)hiddenRandom.onclick=()=>randomChallenge('frame');
    const fresh=q('#ab-new-task');if(fresh)fresh.onclick=()=>newTask(playMode,'play');
    const customShow=q('#ab-custom-show');if(customShow)customShow.onclick=()=>{
      const target=normal(q('#ab-custom-target')?.value);
      newTask('show','play',{mode:'show',start:0,target,prompt:'Show '+target+' on the abacus.',requiresAnswer:false});
    };
    const customAdd=q('#ab-custom-add');if(customAdd)customAdd.onclick=()=>{
      const a=normal(q('#ab-a')?.value),b=Math.max(0,Math.round(num(q('#ab-b')?.value,0)));
      if(a+b>capacity()){status='That addition is too large for this frame.';renderStage();return}
      newTask('add','play',{mode:'add',start:a,target:a+b,a,b,prompt:'Start at '+a+'. Add '+b+'.',requiresAnswer:false});
    };
    const customSub=q('#ab-custom-subtract');if(customSub)customSub.onclick=()=>{
      const a=normal(q('#ab-a')?.value),b=clamp(Math.round(num(q('#ab-b')?.value,0)),0,a);
      newTask('subtract','play',{mode:'subtract',start:a,target:a-b,a,b,prompt:'Start at '+a+'. Subtract '+b+'.',requiresAnswer:false});
    };
    const copy=q('#ab-copy');if(copy)copy.onclick=()=>exportAction('copy');
    const png=q('#ab-png');if(png)png.onclick=()=>exportAction('png');
    const svg=q('#ab-svg');if(svg)svg.onclick=()=>exportAction('svg');
    const print=q('#ab-print');if(print)print.onclick=()=>exportAction('print');
  }

  function svgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function frameSvg({blank=false}={}){
    const width=900,height=540,left=80,right=820,top=118,rodH=324;
    const svg=svgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':kind==='western'?'Western base-ten abacus':'Japanese soroban'});
    svg.appendChild(svgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(svgEl('rect',{x:40,y:36,width:820,height:457,rx:18,fill:'#d9b389',stroke:'#986b41','stroke-width':14,'data-ab-export-frame':'1'}));
    svg.appendChild(svgEl('rect',{x:62,y:60,width:776,height:414,rx:8,fill:'#f7f0e6'}));
    if(kind==='western'){
      for(let row=0;row<rows;row++){
        const y=112+(row+.5)*348/rows;
        svg.appendChild(svgEl('line',{x1:152,y1:y,x2:752,y2:y,stroke:'#977c5e','stroke-width':5,'stroke-linecap':'round'}));
        if(showRowLabels)svg.appendChild(svgEl('text',{x:130,y:y+6,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':18,'font-weight':700,fill:'#60482e'},placeShort(row)));
        const digit=blank?0:counts[row]||0;
        for(let j=0;j<9;j++){
          const active=j<digit;
          const bx=152+600*(active?6+j*8.4:92-(8-j)*8.4)/100;
          svg.appendChild(svgEl('ellipse',{cx:bx,cy:y,rx:17,ry:14,fill:active?'#4b9a8d':'#dc9b52',stroke:active?'#32786e':'#a56d37','stroke-width':2}));
          svg.appendChild(svgEl('ellipse',{cx:bx-5,cy:y-4,rx:5,ry:3,fill:'#ffffff','fill-opacity':.43}));
        }
        if(showRowCounts&&!blank)svg.appendChild(svgEl('text',{x:772,y:y+6,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':20,'font-weight':700,fill:'#295c56'},String(digit)));
      }
    }else{
      svg.appendChild(svgEl('rect',{x:62,y:top+rodH*.40-5,width:776,height:10,rx:3,fill:'#90633a'}));
      for(let col=0;col<rows;col++){
        const x=left+(right-left)*(col+.5)/rows;
        svg.appendChild(svgEl('line',{x1:x,y1:top-10,x2:x,y2:top+rodH+10,stroke:'#977c5e','stroke-width':5,'stroke-linecap':'round'}));
        if(showRowLabels)svg.appendChild(svgEl('text',{x,y:94,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':rows>=5?16:19,'font-weight':700,fill:'#60482e'},placeShort(col)));
        const digit=blank?0:counts[col]||0;
        for(let j=0;j<5;j++){
          const part=j===0?'upper':'lower',k=part==='lower'?j-1:j;
          const active=part==='upper'?digit>=5:k<(digit%5);
          const y=part==='upper'?(active?36:12):(active?44+k*8.5:67+k*8.5);
          const cy=top+rodH*y/100;
          svg.appendChild(svgEl('ellipse',{cx:x,cy,rx:rows>=6?22:27,ry:13,fill:active?'#4b9a8d':'#dc9b52',stroke:active?'#32786e':'#a56d37','stroke-width':2}));
          svg.appendChild(svgEl('ellipse',{cx:x-7,cy:cy-4,rx:8,ry:3,fill:'#ffffff','fill-opacity':.43}));
        }
        if(showRowCounts&&!blank)svg.appendChild(svgEl('text',{x,y:462,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':20,'font-weight':700,fill:'#295c56'},String(digit)));
      }
    }
    if(showTotal&&!blank&&!task)svg.appendChild(svgEl('text',{x:width/2,y:527,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':19,'font-weight':700,fill:'#2a5953'},'Number shown: '+total().toLocaleString('en-GB')));
    return svg;
  }
  function exportSvg(){
    const diagram=frameSvg({blank:!!task&&task.mode==='show'});
    if(task&&X?.composeWorksheetCardSvg){
      return X.composeWorksheetCardSvg(diagram,{
        title:taskTitle(task.mode),
        prompt:task.prompt,
        responseLabel:'Answer',
        responseLines:1,
        responseMode:task.mode==='show'?'none':'box',
        paperStyle:'plain',
        answer:task.requiresAnswer?String(task.answer):String(task.target),
        showAnswer:revealed,
        brand:'99 Club Studio'
      });
    }
    return diagram;
  }
  async function exportAction(kind){
    if(!X)return;
    const svg=exportSvg(),filename=task?'abacus-'+task.mode:'abacus-frame';
    try{
      if(kind==='copy'){await X.copyPng(svg);exportStatus='Image copied.'}
      else if(kind==='png'){await X.downloadPng(svg,filename,2);exportStatus='PNG downloaded.'}
      else if(kind==='svg'){X.downloadSvg(svg,filename);exportStatus='SVG downloaded.'}
      else if(kind==='print'){X.printSvg(svg,{title:task?'Abacus worksheet':'Abacus'});exportStatus='Print view opened.'}
    }catch(err){exportStatus=err?.message||'Export failed.'}
    const out=q('#ab-export-status');if(out)out.textContent=exportStatus;
  }

  renderAll();
}

G.abacusTool=abacusTool;
})(window.TT99Goodies);
