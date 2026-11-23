(function(G){
'use strict';
if(!G)return;
const {q,qa,esc,clamp,num,field,btn}=G;

function abacusTool(){
  const X=G.exportTools;
  let rows=5,counts=Array(5).fill(0),showTotal=true,showRowCounts=false,showRowLabels=false,fiveSplit=true;
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

  function capacity(){return rows*10}
  function total(){return counts.reduce((a,b)=>a+b,0)}
  function normal(v){return clamp(Math.round(num(v,0)),0,capacity())}
  function setRows(next){
    const previous=total(),resolved=[1,2,5,10].includes(Number(next))?Number(next):5;
    rows=resolved;
    counts=Array(rows).fill(0);
    setTotal(Math.min(previous,capacity()),false);
  }
  function setTotal(value,render=true){
    let left=normal(value);
    counts=Array(rows).fill(0).map(()=>{const n=Math.min(10,left);left-=n;return n});
    if(render)renderStage();
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
    const cap=capacity();
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
  function setRowCount(row,value){
    if(!Number.isInteger(row)||row<0||row>=rows)return;
    counts[row]=clamp(Math.round(num(value,0)),0,10);
    status='';revealed=false;
    syncStage();
  }
  function clickBead(row,index){
    const count=counts[row]||0;
    setRowCount(row,index<count?index:index+1);
  }
  function frameControls(){
    return '<div class="gd-row gd-ab-stage-actions">'+
      '<button class="gd-btn" type="button" data-ab-stage="-1">−1</button>'+
      '<button class="gd-btn" type="button" data-ab-stage="1">+1</button>'+
      '<button class="gd-btn" type="button" data-ab-stage="clear">Clear</button>'+
    '</div>';
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
  function beadMarkup(row,index,count){
    const active=index<count,groupB=index>=5;
    return '<button type="button" class="gd-ab-bead'+(active?' is-active':'')+(groupB?' is-five-b':'')+'" data-ab-bead="'+row+':'+index+'" aria-label="'+(active?'Move bead back to the right':'Move bead to the left')+'" aria-pressed="'+(active?'true':'false')+'" style="--ab-x:'+beadX(index,count)+'"><span aria-hidden="true"></span></button>';
  }
  function rowMarkup(row){
    const count=counts[row]||0;
    return '<div class="gd-ab-row" data-ab-row="'+row+'">'+
      (showRowLabels?'<span class="gd-ab-row-label">Row '+(row+1)+'</span>':'')+
      '<div class="gd-ab-rod" aria-label="Abacus row '+(row+1)+', '+count+' beads moved">'+
        '<span class="gd-ab-rail" aria-hidden="true"></span>'+
        Array.from({length:10},(_,i)=>beadMarkup(row,i,count)).join('')+
      '</div>'+
      (showRowCounts?'<strong class="gd-ab-row-count" data-ab-row-count="'+row+'">'+count+'</strong>':'')+
    '</div>';
  }
  function renderStage(){
    const hideTotal=!!task&&taskContext==='challenge'&&!revealed&&status!=='Correct ✓';
    q('#gd-stage').innerHTML=taskBanner()+
      '<div hidden aria-hidden="true">'+['copy','png','svg','print'].map(kind=>'<button type="button" data-gd-direct-export="'+kind+'">'+kind+'</button>').join('')+'</div>'+
      '<div class="gd-ab-workspace">'+
        '<div class="gd-ab-frame '+(fiveSplit?'has-five-split':'')+'" data-ab-frame style="--ab-rows:'+rows+'">'+
          '<div class="gd-ab-side-guide" aria-hidden="true"><span>COUNTED</span><span>READY</span></div>'+
          '<div class="gd-ab-frame-inner">'+Array.from({length:rows},(_,r)=>rowMarkup(r)).join('')+'</div>'+
        '</div>'+
        frameControls()+
        '<div class="gd-ab-summary"'+(showTotal?'':' hidden')+'><span>Beads moved</span><strong data-ab-total>'+(hideTotal?'?':total())+'</strong></div>'+
        '<p class="gd-object-hint" data-ab-hint>'+(task?'Move the beads, then check your answer.':'Move beads from right to left. Tap a bead to move that bead and the group before it.')+'</p>'+
      '</div>';
    bindStage();
  }
  function syncStage(){
    qa('[data-ab-row]').forEach(rowEl=>{
      const row=Number(rowEl.dataset.abRow),count=counts[row]||0;
      qa('[data-ab-bead]',rowEl).forEach(bead=>{
        const index=Number(String(bead.dataset.abBead).split(':')[1]),active=index<count;
        bead.classList.toggle('is-active',active);
        bead.setAttribute('aria-pressed',active?'true':'false');
        bead.style.setProperty('--ab-x',String(beadX(index,count)));
      });
      const countEl=q('[data-ab-row-count="'+row+'"]',rowEl);if(countEl)countEl.textContent=String(count);
      const rod=q('.gd-ab-rod',rowEl);if(rod)rod.setAttribute('aria-label','Abacus row '+(row+1)+', '+count+' beads moved');
    });
    const hideTotal=!!task&&taskContext==='challenge'&&!revealed&&status!=='Correct ✓';
    const totalEl=q('[data-ab-total]');if(totalEl)totalEl.textContent=hideTotal?'?':String(total());
    const statusEl=q('[data-ab-status]');if(statusEl)statusEl.textContent=status;
    const input=q('[data-ab-answer]');if(input&&document.activeElement!==input)input.value=answerInput;
  }
  function setupControls(){
    return field('Rows','<select class="gd-select" id="ab-rows">'+[1,2,5,10].map(n=>'<option value="'+n+'"'+(rows===n?' selected':'')+'>'+n+' row'+(n===1?'':'s')+'</option>').join('')+'</select>')+
      field('Set number','<div class="gd-row"><input class="gd-input" id="ab-set-number" type="number" min="0" max="'+capacity()+'" value="'+total()+'"><button class="gd-btn gd-btn--primary" id="ab-set" type="button">Set</button></div>')+
      '<div class="gd-row">'+btn('Random','ab-random')+btn('Clear','ab-clear')+'</div>'+
      '<label class="gd-row gd-ab-check"><input id="ab-five-split" type="checkbox"'+(fiveSplit?' checked':'')+'> Colour groups of 5</label>'+
      '<label class="gd-row gd-ab-check"><input id="ab-show-total" type="checkbox"'+(showTotal?' checked':'')+'> Show total</label>'+
      '<label class="gd-row gd-ab-check"><input id="ab-row-counts" type="checkbox"'+(showRowCounts?' checked':'')+'> Show row counts</label>'+
      '<label class="gd-row gd-ab-check"><input id="ab-row-labels" type="checkbox"'+(showRowLabels?' checked':'')+'> Show row labels</label>'+
      '<p class="gd-help">Each row has 10 sliding beads. Move beads to the left to count them.</p>';
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
        const [row,index]=String(bead.dataset.abBead).split(':').map(Number);
        clickBead(row,index);
      };
      bead.onpointerdown=e=>{
        if(e.button!==0)return;
        const [row,index]=String(bead.dataset.abBead).split(':').map(Number);
        drag={row,index,startX:e.clientX,initial:counts[row]||0,moved:false};
        try{bead.setPointerCapture(e.pointerId)}catch(_){}
      };
      bead.onpointermove=e=>{
        if(!drag)return;
        const dx=e.clientX-drag.startX;
        if(Math.abs(dx)<12)return;
        drag.moved=true;
        const approx=clamp(drag.initial-Math.round(dx/30),0,10);
        counts[drag.row]=approx;status='';revealed=false;syncStage();
      };
      bead.onpointerup=e=>{
        if(!drag)return;
        const d=drag;drag=null;
        if(d.moved)bead.dataset.abDragged='1';
      };
      bead.onpointercancel=()=>{drag=null};
    });
    qa('[data-ab-stage]').forEach(button=>button.onclick=e=>{
      e.stopPropagation();
      const action=button.dataset.abStage;
      if(action==='clear'){setTotal(0);return}
      setTotal(total()+Number(action||0));
    });
    const answer=q('[data-ab-answer]');if(answer){
      answer.oninput=e=>{answerInput=e.target.value;status='';const s=q('[data-ab-status]');if(s)s.textContent=''};
      answer.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();checkTask()}};
    }
    const check=q('[data-ab-check]');if(check)check.onclick=checkTask;
    const another=q('[data-ab-another]');if(another)another.onclick=()=>newTask(task?.mode||playMode,taskContext);
    const reveal=q('[data-ab-reveal]');if(reveal)reveal.onclick=revealTask;
    const skip=q('[data-ab-skip-next]');if(skip)skip.onclick=()=>{
      if(!task||task.mode!=='skip')return;
      setTotal(task.target,false);
      const nextStart=task.target,nextTarget=Math.min(capacity(),nextStart+task.step);
      status=nextTarget===nextStart?'Reached the end of this frame.':'Next: '+nextStart+' → '+nextTarget;
      task.start=nextStart;task.target=nextTarget;task.answer=nextTarget;task.prompt='Keep counting in '+task.step+'s. What comes after '+nextStart+'?';
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
    const rowsEl=q('#ab-rows');if(rowsEl)rowsEl.onchange=()=>{setRows(rowsEl.value);task=null;renderAll()};
    const set=q('#ab-set');if(set)set.onclick=()=>{setTotal(q('#ab-set-number')?.value);task=null;renderControls()};
    const random=q('#ab-random');if(random)random.onclick=()=>{setTotal(randomInt(0,capacity()));task=null;renderControls()};
    const clear=q('#ab-clear');if(clear)clear.onclick=()=>{setTotal(0);task=null;renderControls()};
    const five=q('#ab-five-split');if(five)five.onchange=()=>{fiveSplit=five.checked;renderStage()};
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
    const width=1000,pad=54,rowH=72,top=42,bottom=42,height=top+rows*rowH+bottom;
    const svg=svgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Counting frame abacus','data-ab-export':'frame'});
    svg.appendChild(svgEl('rect',{x:0,y:0,width,height,fill:'#fff'}));
    svg.appendChild(svgEl('rect',{x:pad,y:18,width:width-pad*2,height:height-36,rx:24,fill:'#c9965c',stroke:'#75502e','stroke-width':7,'data-ab-export-frame':'1'}));
    svg.appendChild(svgEl('rect',{x:pad+18,y:34,width:width-pad*2-36,height:height-68,rx:14,fill:'#f6ead7'}));
    for(let r=0;r<rows;r++){
      const y=top+r*rowH+rowH/2,left=pad+42,right=width-pad-42;
      svg.appendChild(svgEl('line',{x1:left,y1:y,x2:right,y2:y,stroke:'#80654b','stroke-width':6,'stroke-linecap':'round'}));
      const count=blank?0:(counts[r]||0);
      for(let i=0;i<10;i++){
        const active=i<count;
        const x=left+(right-left)*(beadX(i,count)/100);
        const fill=fiveSplit&&i>=5?'#e2a33a':'#4f9a93';
        svg.appendChild(svgEl('ellipse',{cx:x,cy:y,rx:22,ry:17,fill:active?fill:'#d9e2e1',stroke:active?'#496765':'#a8b5b4','stroke-width':2}));
        svg.appendChild(svgEl('ellipse',{cx:x-5,cy:y-5,rx:6,ry:3,fill:'#fff','fill-opacity':.48}));
      }
      if(showRowCounts&&!blank)svg.appendChild(svgEl('text',{x:width-pad-12,y:y+6,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':16,'font-weight':800,fill:'#43575c'},String(count)));
      if(showRowLabels)svg.appendChild(svgEl('text',{x:pad+12,y:y+6,'font-family':'Arial,sans-serif','font-size':14,'font-weight':750,fill:'#6b543d'},'Row '+(r+1)));
    }
    if(showTotal&&!blank&&!task)svg.appendChild(svgEl('text',{x:width/2,y:height-8,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':17,'font-weight':800,fill:'#38565a'},'Beads moved: '+total()));
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
