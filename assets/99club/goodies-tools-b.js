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
  const CK=G.challengeKit;
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
      '<button class="gd-btn'+(controlTab==='challenge'?' gd-btn--primary':'')+'" type="button" data-me-workflow="challenge">Challenge'+(challenge?' •':'')+'</button></div>';
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
  function controlsHtml(){return workflowTabs()+(controlTab==='challenge'?challengeControlsHtml():exploreControlsHtml())}
  function renderControls(){const panel=q('#gd-controls');if(panel)panel.innerHTML=controlsHtml();bindControls()}
  function enterCustomChallenge(){
    if(CK)challenge=CK.makeCustom(challenge||{type:'custom',title:'Challenge',promptHtml:'Write your challenge here.',answer:'',answerMode:'manual',answerSource:''});
    challenge.hiddenReadout=challenge.answerMode==='bound'&&!!challenge.answerSource;
    challenge.freezeMarker=false;challenge.secondaryCm=null;
    challengeTab='custom';controlTab='challenge';renderControls();draw();
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
    challengeType=type;challengeCategory=template.category;challengeTab='standard';controlTab='challenge';renderControls();draw();
  }
  function rulerValueFromClientX(clientX,ruler){
    const rect=ruler.getBoundingClientRect(),ratio=clamp((clientX-rect.left)/Math.max(1,rect.width),0,1);
    return Math.round(ratio*300)/10;
  }
  function setFromPointer(clientX,ruler){
    if(markerFrozen())return;
    setCm(rulerValueFromClientX(clientX,ruler));draw();
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
      if(e.key==='ArrowLeft'){e.preventDefault();setCm(cm-.1);draw()}
      else if(e.key==='ArrowRight'){e.preventDefault();setCm(cm+.1);draw()}
      else if(e.key==='Home'){e.preventDefault();setCm(0);draw()}
      else if(e.key==='End'){e.preventDefault();setCm(30);draw()}
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
      controlTab=button.dataset.meWorkflow==='challenge'?'challenge':'explore';renderControls();
    });
    if(controlTab==='explore'){
      const slider=q('#me-cm',controls);if(slider)slider.oninput=()=>{setCm(slider.value);draw()};
      const random=q('#me-random',controls);if(random)random.onclick=()=>{setCm(Math.floor(Math.random()*301)/10);draw()};
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
      ?(Math.abs(cm-Number(challenge.targetCm))<.05?'<div class="gd-answer-live">On target ✓</div>':'')
      :'';
    q('#gd-stage').innerHTML=banner+'<div class="gd-vis gd-measurement-direct">'+
      '<div class="gd-ruler'+(markerFrozen()?' is-frozen':' is-interactive')+'" id="me-ruler" aria-label="30 centimetre ruler">'+ticks+
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

function balanceTool(){function val(id){try{return Function('"use strict";return ('+q(id).value.replace(/[^0-9+\-*/(). ]/g,'')+')')()}catch(_){return NaN}}function draw(){const l=val('#ba-left'),r=val('#ba-right'),diff=Number.isFinite(l)&&Number.isFinite(r)?l-r:0,tilt=clamp(diff,-10,10)*1.7;const sign=!Number.isFinite(l)||!Number.isFinite(r)?'?':l===r?'=':l>r?'>':'<';q('#gd-stage').innerHTML=`<div class="gd-vis"><div class="gd-balance" style="--tilt:${tilt}deg"><div class="gd-balance-beam"></div><div class="gd-balance-post"></div><div class="gd-balance-base"></div><div class="gd-pan left">${Number.isFinite(l)?l:'?'}</div><div class="gd-pan right">${Number.isFinite(r)?r:'?'}</div></div><div class="gd-equation">${esc(q('#ba-left').value)} ${sign} ${esc(q('#ba-right').value)}</div></div>`}
setPanels(`${field('Left expression','<input class="gd-input" id="ba-left" value="8 + 4">')}${field('Right expression','<input class="gd-input" id="ba-right" value="3 * 4">','Use * for multiplication, e.g. 3*4.')}${btn('Balanced example','ba-example')}<p class="gd-help">The beam tips toward the numerically larger side. Expressions are evaluated locally in your browser.</p>`,'');['ba-left','ba-right'].forEach(id=>q('#'+id).oninput=draw);q('#ba-example').onclick=()=>{const e=[['7+5','3*4'],['18-6','24/2'],['5*6','20+10'],['9+9','36/2']][Math.floor(Math.random()*4)];q('#ba-left').value=e[0];q('#ba-right').value=e[1];draw()};draw()}

function timesTableVisual(){function draw(){const a=clamp(num(q('#tv-a').value,4),1,12),b=clamp(num(q('#tv-b').value,6),1,12),total=a*b;const groups=Array.from({length:a},()=>`<div class="gd-group">${Array.from({length:b},()=>'<span class="gd-mini-dot"></span>').join('')}</div>`).join(''),jumps=Array.from({length:a},(_,i)=>`<span class="gd-jump">${i*b} → ${(i+1)*b}</span>`).join('');q('#gd-stage').innerHTML=`<div class="gd-vis gd-fact-card"><div class="gd-fact-main">${a} × ${b} = ${total}</div><div class="gd-groups">${groups}</div><div class="gd-readout" style="text-align:center">${Array.from({length:a},()=>b).join(' + ')} = ${total}</div><div class="gd-jumps">${jumps}</div><div class="gd-readout" style="text-align:center">Related facts: ${b} × ${a} = ${total} · ${total} ÷ ${a} = ${b} · ${total} ÷ ${b} = ${a}</div></div>`}
setPanels(`${field('Number of groups','<input class="gd-input" id="tv-a" type="range" min="1" max="12" value="4">')}${field('In each group','<input class="gd-input" id="tv-b" type="range" min="1" max="12" value="6">')}${btn('Random fact','tv-random')}`,'');['tv-a','tv-b'].forEach(id=>q('#'+id).oninput=draw);q('#tv-random').onclick=()=>{q('#tv-a').value=1+Math.floor(Math.random()*12);q('#tv-b').value=1+Math.floor(Math.random()*12);draw()};draw()}

function factorExplorer(){function primeFactors(n){let x=n,out=[];for(let p=2;p*p<=x;p++)while(x%p===0){out.push(p);x/=p}if(x>1)out.push(x);return out}function draw(){const n=clamp(Math.round(num(q('#fe-n').value,36)),2,500),pairs=[];for(let i=1;i*i<=n;i++)if(n%i===0)pairs.push([i,n/i]);const multiples=Array.from({length:12},(_,i)=>n*(i+1));q('#gd-stage').innerHTML=`<div class="gd-vis"><h3>Factor pairs of ${n}</h3><div class="gd-factor-pairs">${pairs.map(p=>`<span class="gd-factor-pair">${p[0]} × ${p[1]}</span>`).join('')}</div><h3 style="margin-top:24px">First 12 multiples</h3><div class="gd-multiples">${multiples.map(x=>`<span class="gd-multiple">${x}</span>`).join('')}</div><div class="gd-readout" style="margin-top:18px;text-align:center">Prime factorisation: ${primeFactors(n).join(' × ')}</div></div>`}
setPanels(`${field('Number','<input class="gd-input" id="fe-n" type="number" min="2" max="500" value="36">')}${btn('Random number','fe-random')}`,'');q('#fe-n').oninput=draw;q('#fe-random').onclick=()=>{q('#fe-n').value=2+Math.floor(Math.random()*143);draw()};draw()}

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
