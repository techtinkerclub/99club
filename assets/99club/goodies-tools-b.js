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
    if(!undoStack.length)return;
    redoStack.push(copyPoints());
    points=copyPoints(undoStack.pop());
    selected=-1;
    draw();
  }
  function redo(){
    if(!redoStack.length)return;
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
  function challengeFrozen(){return !!(challenge&&challenge.mode==='standard'&&challenge.freezePoints)}
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
    if(!CK)return '<p class="gd-help">Challenge tools are unavailable.</p>';
    const tabs=CK.tabsHtml?CK.tabsHtml('co',challengeTab):'';
    if(challengeTab==='custom'){
      const custom=challenge&&challenge.mode==='custom'?challenge:CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual'});
      return tabs+CK.editorHtml(custom,'co',{answerSources:customAnswerSources(),generatedAnswerLabel:'Keep the generated answer'})+
        '<div class="gd-row">'+(challenge&&challenge.answer?'<button class="gd-btn" id="co-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
        (challenge?'<button class="gd-btn" id="co-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
        '<div class="gd-row">'+btn('Undo','co-undo')+btn('Redo','co-redo')+'</div>'+
        '<p class="gd-help">Custom challenges stay attached to the live coordinate grid. Build the diagram first, then bind the answer to a point coordinate or one component of it if useful.</p>';
    }
    const picker=CK.pickerHtml(CHALLENGE_TEMPLATES,CHALLENGE_CATEGORIES,challengeCategory,challengeType,'co');
    const repeat=!!(challenge&&challenge.mode==='standard'&&challenge.type===challengeType);
    return tabs+picker+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="co-generate" type="button">'+(repeat?'Another like this':'Generate challenge')+'</button>'+
      (challenge&&challenge.mode!=='custom'?'<button class="gd-btn" id="co-edit-challenge" type="button">Edit challenge</button>':'')+
      (challenge&&challenge.answer?'<button class="gd-btn" id="co-reveal" type="button">'+(challenge.revealed?'Hide answer':'Reveal answer')+'</button>':'')+
      (challenge?'<button class="gd-btn" id="co-clear-challenge" type="button">'+(beforeChallenge?'Back to my setup':'End challenge')+'</button>':'')+'</div>'+
      '<div class="gd-row">'+btn('Undo','co-undo')+btn('Redo','co-redo')+'</div>';
  }
  function exportControlsHtml(){
    const canCard=!!challenge;
    if(!canCard&&exportMode==='challenge')exportMode='diagram';
    return '<div class="nl-panel-title"><div><strong>Use it elsewhere</strong><span>Export a clean vector coordinate grid or a pupil-ready challenge card.</span></div></div>'+
      (canCard?'<div class="nl-export-mode co-export-mode" role="tablist" aria-label="Export content">'+
        '<button type="button" class="'+(exportMode==='challenge'?'is-active':'')+'" data-co-export-mode="challenge">Challenge card</button>'+
        '<button type="button" class="'+(exportMode==='diagram'?'is-active':'')+'" data-co-export-mode="diagram">Grid only</button></div>':'')+
      (canCard&&exportMode==='challenge'
        ?'<label class="gd-field"><span>Answer space</span><select class="gd-select" id="co-response-lines">'+
          [1,2,3,4].map(n=>'<option value="'+n+'"'+(responseLines===n?' selected':'')+'>'+n+' line'+(n===1?'':'s')+'</option>').join('')+
          '</select></label><p class="gd-help">The pupil card contains the question, coordinate grid and blank answer space. Hidden coordinates stay hidden even after Reveal answer.</p>'
        :'<p class="gd-help">Grid-only export contains the current axes, plotted points, labels and visible readout without editing controls.</p>')+
      '<div class="nl-export-grid co-export-grid">'+
        '<button class="gd-btn gd-btn--primary" id="co-copy-image" type="button">Copy '+(canCard&&exportMode==='challenge'?'challenge':'image')+'</button>'+
        '<button class="gd-btn" id="co-png" type="button">PNG</button>'+
        '<button class="gd-btn" id="co-svg-download" type="button">SVG</button>'+
        '<button class="gd-btn" id="co-print" type="button">Print / PDF</button>'+
      '</div><p class="gd-help" id="co-export-status" role="status" aria-live="polite">'+exportStatus+'</p>';
  }
  function coSvgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function exportPointHidden(index,pupil=false){
    if(!challenge)return false;
    if(!pupil)return hiddenPoint(index);
    return Array.isArray(challenge.hiddenPointLabels)&&challenge.hiddenPointLabels.map(Number).includes(index);
  }
  function exportPointLabel(index,p,pupil=false){
    if(!exportPointHidden(index,pupil))return rawCoordinate(p);
    const overrides=challenge&&challenge.pointLabelOverrides&&typeof challenge.pointLabelOverrides==='object'?challenge.pointLabelOverrides:{};
    return overrides[index]!=null?String(overrides[index]):pointName(index);
  }
  function exportPointSet(pupil=false){
    if(pupil&&challenge?.mode==='standard'&&challenge.type==='plot-coordinate')return [];
    return points;
  }
  function coordinateExportSvg({pupil=false}={}){
    const c=config(),width=800,height=830,gridX=92,gridY=70,gridSize=620,gridStep=gridSize/c.range,labelEvery=c.four?2:1;
    const exportPts=exportPointSet(pupil);
    const svg=coSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Coordinate grid','data-co-export':'grid'});
    svg.appendChild(coSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(coSvgEl('rect',{x:48,y:34,width:704,height:720,rx:18,fill:'#fbfcfc',stroke:'#c5d3d6','stroke-width':2,'data-co-export-board':'1'}));
    for(let v=c.min;v<=c.max;v++){
      const x=gridX+(v-c.min)*gridStep,y=gridY+(c.max-v)*gridStep;
      svg.appendChild(coSvgEl('line',{x1:x,y1:gridY,x2:x,y2:gridY+gridSize,stroke:'#d9e2e4','stroke-width':1}));
      svg.appendChild(coSvgEl('line',{x1:gridX,y1:y,x2:gridX+gridSize,y2:y,stroke:'#d9e2e4','stroke-width':1}));
      if(v%labelEvery===0){
        svg.appendChild(coSvgEl('text',{x,y:gridY+gridSize+24,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':11,fill:'#65787e'},v));
        svg.appendChild(coSvgEl('text',{x:gridX-14,y:y+4,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':11,fill:'#65787e'},v));
      }
    }
    const zeroX=gridX+(0-c.min)*gridStep,zeroY=gridY+(c.max-0)*gridStep;
    svg.appendChild(coSvgEl('line',{x1:zeroX,y1:gridY,x2:zeroX,y2:gridY+gridSize,stroke:'#526970','stroke-width':2.5}));
    svg.appendChild(coSvgEl('line',{x1:gridX,y1:zeroY,x2:gridX+gridSize,y2:zeroY,stroke:'#526970','stroke-width':2.5}));
    exportPts.forEach((p,index)=>{
      if(!visible(p,c))return;
      const x=gridX+(p.x-c.min)*gridStep,y=gridY+(c.max-p.y)*gridStep,label=exportPointLabel(index,p,pupil);
      svg.appendChild(coSvgEl('circle',{cx:x,cy:y,r:9,fill:'#ffffff',stroke:'#2f6f68','stroke-width':4,'data-co-export-point':index}));
      svg.appendChild(coSvgEl('text',{x:x+13,y:y-12,'font-family':'Arial,sans-serif','font-size':14,'font-weight':800,fill:'#334a52'},label));
    });
    const labels=exportPts.map((p,index)=>exportPointLabel(index,p,pupil)).join(' · ')||'none';
    const outside=exportPts.filter(p=>!visible(p,c)).length;
    const readout='Points: '+labels+(outside?' · '+outside+' outside this grid '+(outside===1?'is':'are')+' hidden':'');
    svg.appendChild(coSvgEl('text',{x:width/2,y:785,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':16,'font-weight':700,fill:'#425b62'},readout));
    svg.appendChild(coSvgEl('text',{x:width-52,y:height-18,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return coordinateExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(coordinateExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Coordinates challenge',
      prompt,
      responseLabel:challenge.category==='reason'?'Explain your thinking':'Answer',
      responseLines,
      brand:'99 Club Studio'
    });
  }
  function exportName(){
    const meta=challenge&&CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return exportMode==='challenge'&&challenge?(challenge.title||meta?.title||'coordinates-challenge'):(fourQuadrants?'coordinate-grid-four-quadrants':'coordinate-grid');
  }
  function exportMessage(text){exportStatus=text;const el=q('#co-export-status');if(el)el.textContent=text}
  async function exportAction(kind){
    try{
      if(!X)throw new Error('Export tools are not available.');
      const target=exportTargetSvg(),isCard=exportMode==='challenge'&&!!challenge,name=exportName();
      if(kind==='copy'){await X.copyPng(target);exportMessage(isCard?'Challenge copied — paste it into your worksheet, slide or document.':'Coordinate grid copied — paste it into your slide or document.')}
      if(kind==='png'){await X.downloadPng(target,name,2);exportMessage(isCard?'Challenge PNG downloaded.':'Coordinate-grid PNG downloaded.')}
      if(kind==='svg'){X.downloadSvg(target,name);exportMessage(isCard?'Challenge SVG downloaded.':'Coordinate-grid SVG downloaded.')}
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
      challenge=challengeObject(type,'Plot point A at '+rawCoordinate(point)+'.','Point A should be at '+rawCoordinate(point)+'.',{freezePoints:false});
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
      const v=pointPx(p);
      el.setAttribute('x',v.x+10);el.setAttribute('y',v.y-10);
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
    if(u)u.disabled=!undoStack.length;
    if(r)r.disabled=!redoStack.length;
    if(clear)clear.disabled=!points.length;
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
    const del=q('[data-co-delete]');
    if(del)del.onclick=()=>deletePoint(selected);
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
    const clear=q('#co-clear',controls);if(clear)clear.onclick=()=>{if(!points.length)return;remember();points=[];selected=-1;draw()};
    if(controlTab==='explore'){
      const four=q('#co-four',controls);if(four)four.onchange=()=>{fourQuadrants=!!four.checked;selected=-1;draw()};
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
    const reveal=q('#co-reveal',controls);if(reveal)reveal.onclick=()=>{if(!challenge)return;challenge.revealed=!challenge.revealed;renderControls();draw()};
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
      const v=pointPx(p),display=pointLabel(i,p);
      return '<circle class="gd-point gd-co-point'+(i===selected?' is-selected':'')+'" data-co-point="'+i+'" data-co-pos="'+p.x+','+p.y+'" tabindex="0" role="button" aria-label="'+esc(pointAria(i,p)+(challengeFrozen()?' Fixed for this challenge.':' Drag to move.'))+'" cx="'+v.x+'" cy="'+v.y+'" r="9"></circle>'+
        '<text class="gd-co-point-label" data-co-label="'+i+'" x="'+(v.x+10)+'" y="'+(v.y-10)+'">'+esc(display)+'</text>';
    }).join('');
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Coordinates challenge',actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'}]:[]}):'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-coord gd-coordinate-direct">'+
      '<svg id="co-svg" data-co-min="'+view.min+'" data-co-max="'+view.max+'" viewBox="0 0 '+W+' '+W+'" aria-label="Interactive coordinate grid">'+
        lines+
        '<line class="gd-axis" x1="'+zeroX+'" y1="'+pad+'" x2="'+zeroX+'" y2="'+(W-pad)+'"></line>'+
        '<line class="gd-axis" x1="'+pad+'" y1="'+zeroY+'" x2="'+(W-pad)+'" y2="'+zeroY+'"></line>'+
        labels+plotted+
      '</svg>'+
      '<div class="gd-co-context"><span id="co-context-text">'+(challengeFrozen()?'The given point'+(points.length===1?' is':'s are')+' fixed for this challenge.':selected>=0&&points[selected]?'Selected '+esc(pointLabel(selected,points[selected])):'Tap the grid to plot a point. Drag an existing point to move it.')+'</span><button type="button" data-co-delete'+(challengeFrozen()||!(selected>=0&&points[selected])?' hidden':'')+'>Delete point</button></div>'+
      '<div class="gd-readout" id="co-readout">'+esc(pointsText())+'</div>'+
    '</div>';
    bindStage();
    bindChallengeStageActions();
    syncControls();
  }

  setPanels(controlsHtml(),'');
  bindControls();
  draw();
}

function measurementTool(){
  const CK=G.challengeKit,X=G.exportTools;
  let cm=12.3,dragPointer=null;
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
  function setCm(value){cm=roundCm(value)}
  function mmValue(){return Math.round(cm*10)}
  function metresValue(){return Math.round((cm/100)*10000)/10000}
  function cmText(value=cm){return Number(roundCm(value).toFixed(1)).toString()}
  function mText(value=cm){return Number((roundCm(value)/100).toFixed(3)).toString()}
  function snapshot(){return{cm}}
  function restoreSnapshot(value){if(value)setCm(value.cm)}
  function readoutHidden(){return !!(challenge&&!challenge.revealed&&challenge.hiddenReadout)}
  function markerFrozen(){return !!(challenge&&challenge.mode==='standard'&&challenge.freezeMarker)}
  function liveAnswer(source){
    if(source==='cm')return cmText()+' cm';
    if(source==='mm')return mmValue()+' mm';
    if(source==='m')return mText()+' m';
    return'';
  }
  function customAnswerSources(){
    return[
      {id:'cm',label:'Current marker in centimetres'},
      {id:'mm',label:'Current marker in millimetres'},
      {id:'m',label:'Current marker in metres'}
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
    return field('Measurement (cm)','<input class="gd-input" id="me-cm" type="range" min="0" max="30" step="0.1" value="'+cm.toFixed(1)+'">')+
      '<div class="gd-row">'+btn('Random mark','me-random')+'</div>'+
      '<p class="gd-help">Drag or tap directly on the 30 cm ruler. The marker snaps to the nearest millimetre. Arrow keys move a focused marker by 1 mm.</p>';
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
    const width=1100,height=340,left=50,right=50,rulerY=72,rulerH=145,rulerW=width-left-right,baseY=rulerY+rulerH;
    const svg=meSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'30 centimetre ruler','data-me-export':'ruler'});
    svg.appendChild(meSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(meSvgEl('rect',{x:left,y:rulerY,width:rulerW,height:rulerH,rx:8,fill:'#fbfcfc',stroke:'#9fb2b7','stroke-width':2,'data-me-export-ruler':'1'}));
    for(let i=0;i<=300;i++){
      const x=left+i/300*rulerW,h=i%10===0?64:i%5===0?42:27;
      svg.appendChild(meSvgEl('line',{x1:x,y1:baseY-h,x2:x,y2:baseY,stroke:'#344b52','stroke-width':i%10===0?1.8:1}));
      if(i%10===0)svg.appendChild(meSvgEl('text',{x,y:rulerY+27,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':11,'font-weight':700,fill:'#566a70'},i/10));
    }
    const secondary=challenge&&Number.isFinite(Number(challenge.secondaryCm))?roundCm(challenge.secondaryCm):null;
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
    readouts.forEach((item,index)=>{
      const x=start+index*(cardW+gap);
      svg.appendChild(meSvgEl('rect',{x,y:readY-29,width:cardW,height:50,rx:11,fill:'#f5f8f8',stroke:'#d8e2e4','stroke-width':1}));
      svg.appendChild(meSvgEl('text',{x:x+14,y:readY-8,'font-family':'Arial,sans-serif','font-size':10,'font-weight':700,fill:'#74868b'},item[0]));
      svg.appendChild(meSvgEl('text',{x:x+cardW-14,y:readY+6,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':17,'font-weight':900,fill:'#334a52'},item[1]));
    });
    svg.appendChild(meSvgEl('text',{x:width-50,y:height-16,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return rulerExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(rulerExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Measurement challenge',
      prompt,
      responseLabel:challenge.category==='reason'?'Explain your thinking':'Answer',
      responseLines,
      brand:'99 Club Studio'
    });
  }
  function exportName(){
    const meta=challenge&&CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return exportMode==='challenge'&&challenge?(challenge.title||meta?.title||'measurement-challenge'):'measurement-ruler';
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
      const wrong=mmValue()*10;
      challenge=challengeObject(type,'A pupil says '+cmText()+' cm = '+wrong+' mm. Are they correct?','No. '+cmText()+' cm = '+mmValue()+' mm because 1 cm = 10 mm.',{hiddenReadout:true});
    }
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';
    exportMode='challenge';responseLines=template.category==='reason'?3:1;exportStatus='';renderControls();draw();
  }
  function rulerValueFromClientX(clientX,ruler){
    const rect=ruler.getBoundingClientRect(),ratio=clamp((clientX-rect.left)/Math.max(1,rect.width),0,1);
    return Math.round(ratio*300)/10;
  }
  function refreshLiveMeasurement(){
    updateChallengeAnswer();
    const marker=q('#me-marker');
    if(marker){
      marker.style.left=(cm/30*100)+'%';
      marker.setAttribute('aria-valuenow',cm.toFixed(1));
      marker.setAttribute('aria-valuetext',cmText()+' centimetres');
    }
    const values=qa('.gd-fdp-value strong',q('#gd-stage'));
    if(values.length>=3&&!readoutHidden()){
      values[0].textContent=mmValue()+' mm';
      values[1].textContent=cmText()+' cm';
      values[2].textContent=mText()+' m';
    }
    const target=q('#me-target-status');
    if(target&&challenge?.mode==='standard'&&challenge.type==='place-mark'){
      target.textContent=Math.abs(cm-Number(challenge.targetCm))<.05?'On target ✓':'';
    }
    const slider=q('#me-cm',q('#gd-controls'));if(slider)slider.value=cm.toFixed(1);
  }
  function setFromPointer(clientX,ruler){
    if(markerFrozen())return;
    setCm(rulerValueFromClientX(clientX,ruler));refreshLiveMeasurement();
  }
  function bindRuler(){
    const ruler=q('#me-ruler'),marker=q('#me-marker');if(!ruler||!marker)return;
    ruler.onpointerdown=e=>{
      if(markerFrozen()||(e.button!=null&&e.button!==0))return;
      e.preventDefault();dragPointer=e.pointerId;
      try{ruler.setPointerCapture(e.pointerId)}catch(_){}
      setFromPointer(e.clientX,ruler);
    };
    ruler.onpointermove=e=>{
      if(dragPointer!==e.pointerId)return;
      e.preventDefault();setFromPointer(e.clientX,ruler);
    };
    const finish=e=>{if(dragPointer===e.pointerId)dragPointer=null};
    ruler.onpointerup=finish;ruler.onpointercancel=finish;
    marker.onkeydown=e=>{
      if(markerFrozen())return;
      if(e.key==='ArrowLeft'){e.preventDefault();setCm(cm-.1);refreshLiveMeasurement()}
      else if(e.key==='ArrowRight'){e.preventDefault();setCm(cm+.1);refreshLiveMeasurement()}
      else if(e.key==='Home'){e.preventDefault();setCm(0);refreshLiveMeasurement()}
      else if(e.key==='End'){e.preventDefault();setCm(30);refreshLiveMeasurement()}
    };
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
      const slider=q('#me-cm',controls);if(slider)slider.oninput=()=>{setCm(slider.value);refreshLiveMeasurement()};
      const random=q('#me-random',controls);if(random)random.onclick=()=>{setCm(Math.floor(Math.random()*301)/10);refreshLiveMeasurement()};
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
    const reveal=q('#me-reveal',controls);if(reveal)reveal.onclick=()=>{if(!challenge)return;challenge.revealed=!challenge.revealed;renderControls();draw()};
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
  function draw(){
    updateChallengeAnswer();
    let ticks='';
    for(let i=0;i<=300;i++){
      const p=i/300*100,h=i%10===0?55:i%5===0?35:22;
      ticks+='<span class="gd-ruler-tick" style="left:'+p+'%;height:'+h+'px"></span>';
      if(i%10===0)ticks+='<span class="gd-ruler-num" style="left:'+p+'%">'+(i/10)+'</span>';
    }
    const hidden=readoutHidden(),secondary=challenge&&Number.isFinite(Number(challenge.secondaryCm))?roundCm(challenge.secondaryCm):null;
    const secondaryMarker=secondary!=null
      ?'<span class="gd-ruler-marker gd-ruler-marker--secondary" style="left:'+(secondary/30*100)+'%"><span class="gd-ruler-marker-label">A</span></span>'
      :'';
    const mainLabel=secondary!=null?'B':'';
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Measurement challenge',actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'}]:[]}):'';
    const targetStatus=challenge?.mode==='standard'&&challenge.type==='place-mark'
      ?'<div class="gd-answer-live" id="me-target-status">'+(Math.abs(cm-Number(challenge.targetCm))<.05?'On target ✓':'')+'</div>'
      :'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-measurement-direct">'+
      '<div class="gd-ruler'+(markerFrozen()?' is-frozen':' is-interactive')+'" id="me-ruler" data-me-target-cm="'+(challenge?.mode==='standard'&&challenge.type==='place-mark'?challenge.targetCm:'')+'" aria-label="30 centimetre ruler">'+ticks+
        secondaryMarker+
        '<span class="gd-ruler-marker is-interactive'+(markerFrozen()?' is-frozen':'')+'" id="me-marker" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="30" aria-valuenow="'+cm.toFixed(1)+'" aria-valuetext="'+cmText()+' centimetres" style="left:'+(cm/30*100)+'%">'+
          (mainLabel?'<span class="gd-ruler-marker-label">'+mainLabel+'</span>':'')+
        '</span>'+
      '</div>'+
      '<div class="gd-fdp-readout">'+
        '<div class="gd-fdp-value"><span>millimetres</span><strong>'+(hidden?'?':mmValue()+' mm')+'</strong></div>'+
        '<div class="gd-fdp-value"><span>centimetres</span><strong>'+(hidden?'?':cmText()+' cm')+'</strong></div>'+
        '<div class="gd-fdp-value"><span>metres</span><strong>'+(hidden?'?':mText()+' m')+'</strong></div>'+
      '</div>'+targetStatus+
    '</div>';
    bindRuler();bindChallengeStageActions();
    const slider=q('#me-cm',q('#gd-controls'));if(slider)slider.value=cm.toFixed(1);
  }

  setPanels(controlsHtml(),'');
  bindControls();
  draw();
}

function randomiser(){let result='';function draw(){const mode=q('#ra-mode').value;let controls='';if(mode==='dice')controls=field('Number of dice','<input class="gd-input" id="ra-count" type="number" min="1" max="8" value="2">')+field('Sides','<select class="gd-select" id="ra-sides"><option>6</option><option>4</option><option>8</option><option>10</option><option>12</option><option>20</option></select>');if(mode==='spinner')controls=field('Choices','<textarea class="gd-textarea" id="ra-choices" rows="5">Red\nBlue\nGreen\nYellow</textarea>');if(mode==='number')controls=field('Minimum','<input class="gd-input" id="ra-min" type="number" value="1">')+field('Maximum','<input class="gd-input" id="ra-max" type="number" value="100">');if(mode==='card')controls='<p class="gd-help">Draw from a standard 52-card deck.</p>';q('#ra-extra').innerHTML=controls;show(mode)}function show(mode=q('#ra-mode').value){if(mode==='spinner'){q('#gd-stage').innerHTML=`<div class="gd-vis"><div class="gd-spinner">?</div><div class="gd-spinner-result">${esc(result||'Press Spin')}</div></div>`}else q('#gd-stage').innerHTML=`<div class="gd-vis"><div class="gd-random-big">${esc(result||'—')}</div></div>`}function roll(){const mode=q('#ra-mode').value;if(mode==='dice'){const c=clamp(num(q('#ra-count').value,2),1,8),sides=clamp(num(q('#ra-sides').value,6),2,100),vals=Array.from({length:c},()=>1+Math.floor(Math.random()*sides));result=vals.join(' + ')+' = '+vals.reduce((a,b)=>a+b,0)}else if(mode==='number'){let a=num(q('#ra-min').value,1),b=num(q('#ra-max').value,100);if(a>b)[a,b]=[b,a];result=String(Math.floor(a+Math.random()*(b-a+1)))}else if(mode==='spinner'){const a=q('#ra-choices').value.split(/\n|,/).map(x=>x.trim()).filter(Boolean);result=a.length?a[Math.floor(Math.random()*a.length)]:'Add choices'}else{const ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],suits=['♠','♥','♦','♣'];result=ranks[Math.floor(Math.random()*ranks.length)]+suits[Math.floor(Math.random()*suits.length)]}show(mode)}
setPanels(`${field('Tool','<select class="gd-select" id="ra-mode"><option value="dice">Dice</option><option value="spinner">Spinner</option><option value="number">Random number</option><option value="card">Playing card</option></select>')}<div id="ra-extra"></div>${btn('Generate','ra-go',true)}`,'');q('#ra-mode').onchange=()=>{result='';draw()};q('#ra-go').onclick=roll;draw()}

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
    const diff=difference(),scaled=clamp(diff,-20,20),deg=scaled*0.65,lift=scaled*1.35;
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
  function restoreBeforeChallenge(){if(beforeChallenge){restore(beforeChallenge);beforeChallenge=null}}
  function clearChallenge(){
    restoreBeforeChallenge();challenge=null;challengeTab='standard';controlTab='challenge';exportMode='diagram';exportStatus='';undoStack.length=0;redoStack.length=0;renderControls();draw();
  }
  function enterCustomChallenge(){
    if(!beforeChallenge)beforeChallenge=snapshot();
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
    if(!beforeChallenge)beforeChallenge=snapshot();else restore(beforeChallenge);
    undoStack.length=0;redoStack.length=0;showTotals=true;
    if(type==='missing-weight'){
      const a=randomInt(4,12),b=randomInt(3,10),whole=a+b;
      setSides([a,b],[whole],{hiddenLeft:[1]});
      challenge=challengeObject(type,'The balance is equal. What value is hidden by the question mark?',b,{hiddenVerdict:true});
    }else if(type==='choose-relation'){
      const l=randomInt(8,18),r=l+randomInt(2,8);
      setSides([l],[r]);
      challenge=challengeObject(type,'Which symbol makes this comparison correct: <, > or = ?',relation(),{hiddenRelation:true,hiddenVerdict:true});
    }else if(type==='find-difference'){
      const smaller=randomInt(8,20),gap=randomInt(3,10),larger=smaller+gap;
      setSides([larger],[smaller]);
      challenge=challengeObject(type,'How much heavier is the left side than the right side?',gap,{hiddenVerdict:true});
    }else if(type==='make-balance'){
      const a=randomInt(5,12),b=randomInt(2,7),gap=randomInt(2,6);
      setSides([a,b],[a+b-gap]);
      challenge=challengeObject(type,'Make both sides equal. You may add, edit or move weights.',String(gap),{freezeBoard:false,answer:'Balanced'});
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
        '<div class="gd-eq-side gd-eq-side--left" data-ba-drop="left"><div class="gd-eq-cord"></div><div class="gd-eq-pan"><div class="gd-eq-pan-label">Left</div><div class="gd-eq-weights">'+(left.length?left.map(tokenHtml).join(''):'<span class="gd-eq-empty">Drop weights here</span>')+'</div><strong class="gd-eq-total" data-ba-left-total>'+visibleLeftTotal()+'</strong></div></div>'+
        '<div class="gd-eq-side gd-eq-side--right" data-ba-drop="right"><div class="gd-eq-cord"></div><div class="gd-eq-pan"><div class="gd-eq-pan-label">Right</div><div class="gd-eq-weights">'+(right.length?right.map(tokenHtml).join(''):'<span class="gd-eq-empty">Drop weights here</span>')+'</div><strong class="gd-eq-total" data-ba-right-total>'+visibleRightTotal()+'</strong></div></div>'+
      '</div>'+
      '<div class="gd-eq-verdict'+(balanced?' is-balanced':'')+'"><span>Relationship</span><strong data-ba-relation>'+relationReadout()+'</strong></div>'+
      (challenge&&!challengeFrozen()&&challenge.mode==='standard'?'<div class="gd-answer-live" data-ba-target-status>'+challengeProgress()+'</div>':'')+
      selectedEditor()+
      (!challengeFrozen()?'<p class="gd-help gd-eq-drag-hint">Drag a weight across the balance to move it to the other side, or select it for precise edits.</p>':'')+
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
  function challengeFrozen(){return !!(challenge&&challenge.mode==='standard'&&challenge.freezeModel)}
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
    if(hiddenFlag('hiddenSelectedPanel'))return'';
    const frozen=challengeFrozen();
    return '<div class="gd-tv-selected" data-tv-selected="'+selectedGroup+'">'+
      '<div><span>Selected group</span><strong>Group '+(selectedGroup+1)+' · '+itemsPerGroup+' items</strong></div>'+
      (!frozen?'<div class="gd-row"><button class="gd-btn" id="tv-duplicate" type="button"'+(groupsCount>=12?' disabled':'')+'>Duplicate group</button>'+
      '<button class="gd-btn gd-btn--danger" id="tv-delete" type="button"'+(groupsCount<=1?' disabled':'')+'>Delete group</button></div>':'')+
    '</div>';
  }
  function challengeProgress(){
    if(!challenge||challenge.type!=='build-fact')return'';
    return groupsCount===Number(challenge.targetGroups)&&itemsPerGroup===Number(challenge.targetItems)
      ?'On target · '+groupsCount+' × '+itemsPerGroup+' = '+total()+' ✓'
      :'Build '+challenge.targetGroups+' groups of '+challenge.targetItems;
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
    const t=total(),frozen=challengeFrozen(),banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Times-table challenge',actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'}]:[]}):'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-tv-workbench">'+
      '<div class="gd-tv-summary"><div><span>Equal groups</span><strong data-tv-equation>'+equationText()+'</strong></div>'+
        '<div class="gd-object-toolbar"><button class="gd-btn" id="tv-undo" type="button"'+(undoStack.length&&!frozen?'':' disabled')+'>Undo</button><button class="gd-btn" id="tv-redo" type="button"'+(redoStack.length&&!frozen?'':' disabled')+'>Redo</button></div></div>'+
      (!frozen?'<div class="gd-tv-direct">'+
        '<div class="gd-tv-stepper"><span>Groups</span><div><button class="gd-btn" id="tv-groups-minus" type="button"'+(groupsCount<=1?' disabled':'')+'>−</button><strong data-tv-groups>'+groupsCount+'</strong><button class="gd-btn" id="tv-groups-plus" type="button"'+(groupsCount>=12?' disabled':'')+'>+</button></div></div>'+
        '<button class="gd-btn gd-tv-swap" id="tv-swap" type="button">Swap factors ↔</button>'+
        '<div class="gd-tv-stepper"><span>In each group</span><div><button class="gd-btn" id="tv-items-minus" type="button"'+(itemsPerGroup<=1?' disabled':'')+'>−</button><strong data-tv-items>'+itemsPerGroup+'</strong><button class="gd-btn" id="tv-items-plus" type="button"'+(itemsPerGroup>=12?' disabled':'')+'>+</button></div></div>'+
      '</div>':'')+
      '<div class="gd-tv-groups" data-tv-group-count="'+groupsCount+'">'+Array.from({length:groupsCount},(_,i)=>groupHtml(i)).join('')+
        (!frozen&&groupsCount<12?'<button class="gd-tv-add-group" id="tv-add-group" type="button"><strong>+</strong><span>Add group</span></button>':'')+'</div>'+
      selectedPanel()+
      (showRepeated?'<div class="gd-tv-readout"><span>Repeated addition</span><strong data-tv-repeated>'+repeatedDisplay()+'</strong></div>':'')+
      (showJumps&&!hiddenFlag('hiddenJumps')?'<div class="gd-tv-jump-section"><span>Equal jumps</span><div class="gd-tv-jumps">'+Array.from({length:groupsCount},(_,i)=>jumpHtml(i)).join('')+'</div></div>':'')+
      (showFactFamily?'<div class="gd-tv-fact-family"><span>Fact family</span><div>'+
        '<strong data-tv-commutative>'+commutativeDisplay()+'</strong>'+
        '<strong data-tv-division-a>'+divisionADisplay()+'</strong>'+
        '<strong data-tv-division-b>'+divisionBDisplay()+'</strong>'+
      '</div></div>':'')+
      (challenge?.type==='build-fact'?'<div class="gd-answer-live" data-tv-target-status>'+challengeProgress()+'</div>':'')+
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
    const a=randomInt(3,8),b=randomInt(4,9),t=a*b;
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
      const wrong=t+1;
      challenge=challengeObject(type,'The equation says '+a+' × '+b+' = '+wrong+'. Use the equal groups to decide whether it is correct.','No. '+a+' × '+b+' = '+t+', not '+wrong+'.',{wrongTotal:wrong,hiddenRepeated:true,hiddenFactFamily:true,hiddenJumps:true,hiddenSelectedPanel:true});
    }
    challenge.initialState=snapshot();
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';exportMode='challenge';responseLines=template.category==='reason'?3:1;exportStatus='';renderControls();draw();
  }
  function restoreBeforeChallenge(){if(beforeChallenge){restore(beforeChallenge);beforeChallenge=null}}
  function clearChallenge(){
    restoreBeforeChallenge();challenge=null;challengeTab='standard';controlTab='challenge';undoStack.length=0;redoStack.length=0;renderControls();draw();
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
    const state=exportState(pupil),groups=Number(state.groupsCount),items=Number(state.itemsPerGroup),width=900;
    const cols=Math.min(groups,4),rows=Math.ceil(groups/cols),cardW=170,cardH=128,gap=18;
    const groupsW=cols*cardW+(cols-1)*gap,groupsX=(width-groupsW)/2,groupsY=115;
    const showRep=state.showRepeated!==false,showFamily=state.showFactFamily!==false;
    const repHidden=exportHidden('hiddenRepeated',pupil),familyHidden=exportHidden('hiddenFactFamily',pupil),jumpsHidden=exportHidden('hiddenJumps',pupil);
    let yAfter=groupsY+rows*cardH+(rows-1)*gap+42;
    let extra=0;
    if(showRep)extra+=66;
    if(state.showJumps!==false&&!jumpsHidden)extra+=70;
    if(showFamily)extra+=96;
    const height=Math.max(500,yAfter+extra+70);
    const svg=tvSvgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Equal groups multiplication model','data-tv-export':'model'});
    svg.appendChild(tvSvgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
    svg.appendChild(tvSvgEl('rect',{x:34,y:30,width:width-68,height:height-62,rx:20,fill:'#fbfcfc',stroke:'#c5d3d6','stroke-width':2,'data-tv-export-model':'1'}));
    svg.appendChild(tvSvgEl('text',{x:width/2,y:78,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':30,'font-weight':800,fill:'#304b52','data-tv-export-equation':'1'},stateEquation(state,pupil)));
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
    if(state.showJumps!==false&&!jumpsHidden){
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
      prompt,
      responseLabel:challenge.category==='reason'?'Explain your thinking':'Answer',
      responseLines,
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
    const reveal=q('#tv-reveal');if(reveal)reveal.onclick=()=>{if(challenge){challenge.revealed=!challenge.revealed;renderControls();draw()}};
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
  function bindChallengeStageActions(){
    const stage=q('#gd-stage');if(!stage||!challenge)return;
    const reveal=q('[data-board-action="reveal"]',stage);if(reveal)reveal.onclick=e=>{e.stopPropagation();challenge.revealed=!challenge.revealed;renderControls();draw()};
    const another=q('[data-challenge-action="another"]',stage);if(another)another.onclick=e=>{e.stopPropagation();if(challenge?.mode==='standard')generateChallenge(challenge.type)};
  }
  function draw(){
    updateChallengeAnswer();
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Factors & multiples challenge',actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'}]:[]}):'';
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
    if(type==='prime-or-composite'){
      a=29;compare=false;challenge=challengeObject(type,'Is 29 prime or composite? Use the factor evidence to decide.','Prime',{hiddenClassificationSide:'a',hiddenPrimeSide:'a'});
    }else if(type==='missing-factor'){
      a=36;compare=false;selectedPair=3;challenge=challengeObject(type,'Complete the selected factor pair: 4 × ? = 36.','9',{hiddenPairSide:'a',hiddenPairIndex:3});
    }else if(type==='divisible-by'){
      a=42;compare=false;challenge=challengeObject(type,'Is 42 divisible by 6? Explain using the evidence shown.','Yes. 42 ÷ 6 = 7.',{hiddenDivisor:6,hiddenDivisorSide:'a'});
    }else if(type==='common-factors'){
      a=36;b=24;compare=true;challenge=challengeObject(type,'What are the common factors of 36 and 24?','1, 2, 3, 4, 6, 12',{hiddenCommonFactors:true});
    }else if(type==='hcf'){
      a=36;b=24;compare=true;challenge=challengeObject(type,'What is the highest common factor of 36 and 24?','12',{hiddenHcf:true});
    }else if(type==='lcm'){
      a=12;b=18;compare=true;challenge=challengeObject(type,'What is the lowest common multiple of 12 and 18?','36',{hiddenLcm:true});
    }else{
      a=31;compare=false;challenge=challengeObject(type,'Explain why 31 is prime using the factor information shown.','31 has exactly two factors: 1 and 31.',{hiddenClassificationSide:'a',hiddenPrimeSide:'a'});
    }
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
    svg.appendChild(feSvgEl('text',{x:width/2,y:lowerY+2,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':13,'font-weight':800,fill:'#718288'},'SELECTED FACTOR RECTANGLE · '+rows+' × '+cols+' = '+n));
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
}

function fdpExplorer(){function draw(){let d=clamp(Math.round(num(q('#fd-d').value,8)),1,20),n=clamp(Math.round(num(q('#fd-n').value,3)),0,d);q('#fd-n').max=d;if(n>+q('#fd-n').value)q('#fd-n').value=n;const g=gcd(n,d),sn=n/g,sd=d/g,v=n/d,pct=v*100;const bar=`<div class="gd-fdp-bar">${Array.from({length:d},(_,i)=>`<span class="gd-fdp-piece${i<n?' is-fill':''}"></span>`).join('')}</div>`;const fills=Math.round(v*100);q('#gd-stage').innerHTML=`<div class="gd-vis gd-fdp-main">${bar}<div class="gd-fdp-readout"><div class="gd-fdp-value"><span>fraction</span><strong>${sn}/${sd}</strong><small>${n}/${d}</small></div><div class="gd-fdp-value"><span>decimal</span><strong>${Number(v.toFixed(4))}</strong></div><div class="gd-fdp-value"><span>percentage</span><strong>${Number(pct.toFixed(2))}%</strong></div></div><div class="gd-hundred">${Array.from({length:100},(_,i)=>`<span class="${i<fills?'is-fill':''}"></span>`).join('')}</div></div>`}
setPanels(`${field('Numerator','<input class="gd-input" id="fd-n" type="range" min="0" max="8" value="3">')}${field('Denominator','<input class="gd-input" id="fd-d" type="range" min="1" max="20" value="8">')}<p class="gd-help">The hundred square rounds to the nearest whole percent when the fraction does not map exactly to 100 cells.</p>`,'');q('#fd-n').oninput=draw;q('#fd-d').oninput=draw;draw()}

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

  function copyPts(value=pts){return value.map(p=>({x:p.x,y:p.y}))}
  function remember(snapshot=copyPts()){
    undoStack.push(copyPts(snapshot));
    if(undoStack.length>40)undoStack.shift();
    redoStack.length=0;
  }
  function undo(){
    if(!undoStack.length)return;
    redoStack.push(copyPts());
    pts=copyPts(undoStack.pop());
    selected=-1;
    draw();
  }
  function redo(){
    if(!redoStack.length)return;
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
    svg.appendChild(geSvgEl('text',{x:width/2,y:readY,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':17,'font-weight':700,fill:'#425b62'},parts.join('   ·   ')));
    svg.appendChild(geSvgEl('text',{x:width-48,y:height-20,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#87969a'},'99 Club Studio'));
    return svg;
  }
  function exportTargetSvg(){
    if(exportMode!=='challenge'||!challenge||!X?.composeChallengeCardSvg)return geoboardExportSvg({pupil:false});
    const prompt=CK?CK.plainText(challenge.promptHtml||challenge.prompt||''):challenge.prompt||'';
    const meta=CHALLENGE_TEMPLATES.find(t=>t.id===challenge.type);
    return X.composeChallengeCardSvg(geoboardExportSvg({pupil:true}),{
      title:challenge.title||meta?.title||'Geoboard challenge',
      prompt,
      responseLabel:challenge.category==='reason'?'Explain your thinking':'Answer',
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
    challenge=null;challengeTab='standard';controlTab='challenge';renderControls();draw();
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
      const pair=pick([[{x:0,y:0},{x:3,y:4}],[{x:1,y:1},{x:5,y:1}],[{x:2,y:0},{x:2,y:6}],[{x:0,y:5},{x:6,y:5}]]);
      setGeneratedShape(pair);
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
        const [w,h]=pick([[4,3],[4,2],[6,2],[3,2]]),x=0,y=0;
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
      challenge=challengeObject(type,'Build any polygon with an area of '+option.area+' square units. Use the live area readout to check your shape.','For example, a '+option.w+' × '+option.h+' rectangle.',{answerMode:'manual'});
    }else{
      setGeneratedShape([{x:1,y:1},{x:5,y:1},{x:5,y:5},{x:1,y:5}]);
      challenge=challengeObject(type,'This square has perimeter 16 units and area 16 square units. A pupil says the two measurements are the same because both numbers are 16. Are they correct?','No. Perimeter measures distance around the shape in units; area measures the surface inside it in square units.',{answerMode:'manual'});
    }
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';
    exportMode='challenge';responseLines=template.category==='reason'?3:1;exportStatus='';renderControls();draw();
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
    const clear=q('#ge-clear',controls);if(clear)clear.onclick=()=>{if(!pts.length)return;remember();pts=[];selected=-1;draw()};
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
    const reveal=q('#ge-reveal',controls);if(reveal)reveal.onclick=()=>{if(!challenge)return;challenge.revealed=!challenge.revealed;renderControls();draw()};
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
    if(poly)poly.setAttribute('points',polyPoints());
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
    if(!pts[index]||occupied(x,y,index)>=0)return false;
    if(pts[index].x===x&&pts[index].y===y)return false;
    if(withHistory)remember();
    pts[index]={x,y};
    selected=index;
    return true;
  }
  function deleteVertex(index){
    if(index<0||index>=pts.length)return;
    remember();
    pts.splice(index,1);
    selected=-1;
    draw();
  }
  function syncControls(){
    const u=q('#ge-undo'),r=q('#ge-redo'),clear=q('#ge-clear');
    if(u)u.disabled=!undoStack.length;
    if(r)r.disabled=!redoStack.length;
    if(clear)clear.disabled=!pts.length;
  }
  function bindStage(){
    const svg=q('#ge-svg');
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
    const del=q('[data-ge-delete]');
    if(del)del.onclick=()=>deleteVertex(selected);
  }
  function draw(){
    updateChallengeAnswer();
    let grid='';
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const v=pointPx({x,y});
      grid+='<circle class="gd-ge-peg" cx="'+v.x+'" cy="'+v.y+'" r="5" data-gp="'+x+','+y+'"></circle>';
    }
    const poly=pts.length?'<polyline class="gd-poly" data-ge-poly points="'+polyPoints()+'"></polyline>':'<polyline class="gd-poly" data-ge-poly points=""></polyline>';
    const vertices=pts.map((p,i)=>{
      const v=pointPx(p),label=String.fromCharCode(65+i);
      return '<circle class="gd-point gd-ge-vertex'+(i===selected?' is-selected':'')+'" data-ge-vertex="'+i+'" data-ge-pos="'+p.x+','+p.y+'" tabindex="0" role="button" aria-label="Vertex '+label+' at '+p.x+', '+p.y+'. Drag to move." cx="'+v.x+'" cy="'+v.y+'" r="10"></circle>'+
        '<text class="gd-ge-label" data-ge-label="'+i+'" x="'+(v.x+11)+'" y="'+(v.y-11)+'">'+label+'</text>';
    }).join('');
    const banner=challenge&&CK?CK.bannerHtml(challenge,{label:'Geoboard challenge',actions:challenge.mode==='standard'?[{action:'another',label:'Another like this'}]:[]}):'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-geo gd-geoboard-direct">'+
      '<svg id="ge-svg" viewBox="0 0 '+W+' '+W+'" role="img" aria-label="Interactive geoboard">'+grid+poly+vertices+'</svg>'+
      '<div class="gd-ge-context"><span id="ge-context-text">'+(selected>=0&&pts[selected]?'Selected '+String.fromCharCode(65+selected)+' · ('+pts[selected].x+', '+pts[selected].y+')':'Tap a peg to add a vertex. Drag an existing vertex to reshape the polygon.')+'</span><button type="button" data-ge-delete'+(selected>=0&&pts[selected]?'':' hidden')+'>Delete vertex</button></div>'+
      '<div class="gd-readout" id="ge-readout">'+metricText()+'</div>'+
    '</div>';
    bindStage();
    bindChallengeStageActions();
    syncControls();
  }

  setPanels(controlsHtml(),'');
  bindControls();
  draw();
}

function mathsCanvas(){
const I=G.interaction;
if(!I){q('#gd-stage').innerHTML='<p class="gd-empty">The interactive canvas could not start.</p>';return;}
let tiles=[],next=1,grid=true,colourOpen=false,controller=null;
const colours=['#cbe7e2','#f6cf79','#cfe0f6','#efcfd9','#dbcff2','#d5ead2','#f3d7c4','#ffffff'];
function textColour(hex){const h=String(hex||'').replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))return '#24343b';const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return (r*299+g*587+b*114)/1000>155?'#24343b':'#ffffff'}
function stateSnapshot(){return{tiles:JSON.parse(JSON.stringify(tiles)),next,grid}}
function restoreState(value){tiles=Array.isArray(value?.tiles)?value.tiles:[];next=Math.max(1,num(value?.next,1));grid=value?.grid!==false;colourOpen=false}
function selectedTile(id){return tiles.find(t=>String(t.id)===String(id))||null}
function tileMarkup(t,selectedId){const selected=String(t.id)===String(selectedId),locked=!!t.locked;return '<div class="gd-tile gd-object-tile'+(t.symbol?' symbol':'')+(selected?' is-selected':'')+(locked?' is-locked':'')+'" data-gd-object="'+t.id+'" role="button" tabindex="0" aria-selected="'+(selected?'true':'false')+'" aria-label="'+esc(t.text)+(locked?' locked':'')+'" style="left:'+t.x+'px;top:'+t.y+'px;--gd-tile-fill:'+t.color+';--gd-tile-ink:'+textColour(t.color)+'">'+esc(t.text)+(locked?'<span class="gd-tile-lock" aria-hidden="true">⌑</span>':'')+'</div>'}
function railMarkup(selected,meta){
const undo=I.toolButton('undo','undo','Undo','',!meta?.canUndo);
const redo=I.toolButton('redo','redo','Redo','',!meta?.canRedo);
const gridButton=I.toolButton('grid','grid',grid?'Turn grid off':'Turn grid on',grid?'is-active':'',false);
let object='';
if(selected){
object=I.toolButton('duplicate','duplicate','Duplicate tile','',false)+
I.toolButton('colour','colour','Change tile colour',colourOpen?'is-active':'',selected.locked)+
I.toolButton('lock',selected.locked?'unlock':'lock',selected.locked?'Unlock tile':'Lock tile',selected.locked?'is-active':'',false)+
I.toolButton('delete','delete','Delete tile','is-danger',selected.locked);
}
const swatches=selected&&colourOpen&&!selected.locked?'<div class="gd-object-colours" role="group" aria-label="Tile colour">'+colours.map(col=>'<button type="button" data-gd-colour="'+col+'" aria-label="Use '+col+'" style="--swatch:'+col+'"></button>').join('')+'</div>':'';
return '<div class="gd-object-ui"><div class="gd-object-rail'+(selected?' is-engaged':'')+'" aria-label="Canvas tools">'+object+(object?'<span class="gd-object-separator"></span>':'')+undo+redo+gridButton+'</div>'+swatches+'</div>'
}
function draw(selectedId,meta){
const selected=selectedTile(selectedId);
q('#gd-stage').innerHTML='<div class="gd-vis gd-object-workspace"><div class="gd-object-canvas-wrap"><div class="gd-canvas gd-object-canvas'+(grid?' has-grid':'')+'" id="mc-canvas" data-gd-canvas-bg tabindex="0" aria-label="Maths canvas. Tap a tile to select it and drag to move it.">'+tiles.map(t=>tileMarkup(t,selectedId)).join('')+'</div>'+railMarkup(selected,meta)+'</div><div class="gd-object-hint">'+(selected?(selected.locked?'Tile locked · use the lock icon to move or edit it again.':'Drag to move · the side tools duplicate, colour, lock or delete it.'):'Tap a tile to select it. Drag tiles directly around the board.')+'</div></div>'
}
function constrainTile(item,x,y,element,canvas){const el=element||canvas.querySelector('[data-gd-object="'+item.id+'"]');const w=el?.offsetWidth||52,h=el?.offsetHeight||52;return{x:clamp(x,0,Math.max(0,canvas.clientWidth-w)),y:clamp(y,0,Math.max(0,canvas.clientHeight-h))}}
function duplicateTile(item){const canvas=q('#mc-canvas'),copy={...item,id:next++,locked:false};const w=canvas?.clientWidth||700,h=canvas?.clientHeight||420;copy.x=clamp((Number(item.x)||0)+40,0,Math.max(0,w-70));copy.y=clamp((Number(item.y)||0)+40,0,Math.max(0,h-60));tiles.push(copy);return copy}
function add(text,symbol=false){let id=null;controller.mutate(()=>{id=next++;const canvas=q('#mc-canvas'),width=canvas?.clientWidth||700,cols=Math.max(1,Math.floor(Math.max(80,width-40)/80)),i=tiles.length,x=20+(i%cols)*80,y=20+Math.floor(i/cols)*80;tiles.push({id,text,x,y,symbol,locked:false,color:symbol?'#f6cf79':'#cbe7e2'})});controller.select(id)}
function bindPalette(){
qa('[data-mc-add]',q('#gd-controls')).forEach(x=>x.onclick=()=>add(x.dataset.mcAdd,false));
qa('[data-mc-sym]',q('#gd-controls')).forEach(x=>x.onclick=()=>add(x.dataset.mcSym,true));
q('#mc-add').onclick=()=>{const v=q('#mc-custom').value.trim();if(v){add(v,false);q('#mc-custom').value=''}};
q('#mc-clear').onclick=()=>{if(!tiles.length)return;if(!window.confirm('Clear all tiles from this canvas?'))return;controller.mutate(()=>{tiles=[];colourOpen=false})};
}
setPanels('<p class="gd-section-title">Add tiles</p><div class="gd-canvas-tools">'+['1','2','3','4','5','10','100'].map(x=>'<button class="gd-btn gd-palette-tile" type="button" data-mc-add="'+x+'">'+x+'</button>').join('')+'</div><div class="gd-canvas-tools">'+['+','−','×','÷','=','<','>','?'].map(x=>'<button class="gd-btn gd-palette-tile is-symbol" type="button" data-mc-sym="'+x+'">'+x+'</button>').join('')+'</div>'+field('Custom tile','<div class="gd-row"><input class="gd-input" id="mc-custom" placeholder="e.g. 24"><button class="gd-btn" type="button" id="mc-add">Add</button></div>')+btn('Clear canvas','mc-clear')+'<p class="gd-help">Tap to add a tile, then work directly on the board. Select a tile for duplicate, colour, lock and delete. On a keyboard: arrows nudge, Delete removes, Ctrl/Cmd+D duplicates, Ctrl/Cmd+Z undoes.</p>','');
controller=I.mount({
getItems:()=>tiles,
getState:stateSnapshot,
setState:restoreState,
getCanvas:()=>q('#mc-canvas'),
getActionRoot:()=>q('#gd-stage'),
render:draw,
snap:()=>grid?20:1,
nudgeStep:()=>grid?20:1,
constrain:constrainTile,
duplicate:duplicateTile,
remove:item=>{tiles=tiles.filter(t=>t!==item);colourOpen=false},
setColour:(item,colour)=>{item.color=colour;colourOpen=false},
toggleLock:item=>{item.locked=!item.locked;colourOpen=false},
onAction:(action,api)=>{
if(action==='colour'){colourOpen=!colourOpen;api.refresh()}
else if(action==='grid'){api.mutate(()=>{grid=!grid;colourOpen=false})}
},
onSelectionChange:item=>{if(!item)colourOpen=false}
});
bindPalette();
controller.refresh();
}

Object.assign(G,{coordinateTool,measurementTool,randomiser,balanceTool,timesTableVisual,factorExplorer,fdpExplorer,geoboard,mathsCanvas});
})(window.TT99Goodies);
