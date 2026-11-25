(function(G){
'use strict';
if(!G)return;
const {root,CATS,q,qa,numberLine,placeValue,abacusTool,fractionWall,barModel,hundredSquare,multiplicationGrid,arrayBuilder,clockTool,moneyTool,coordinateTool,measurementTool,randomiser,balanceTool,timesTableVisual,factorExplorer,fdpExplorer,geoboard,mathsCanvas,sequencesTool}=G;
const tools=[
  ['number-line','Number line','↔','number','Explore integers, decimals and jumps on a configurable line.','Mental arithmetic, rounding, negative numbers, fractions/decimals and explaining calculation strategies.',numberLine],
  ['place-value','Place value board','123','number','Build numbers with counters and a linked place-value bead frame.','Reading, composing and decomposing whole numbers and decimals; useful on an interactive whiteboard.',placeValue],
  ['abacus','Abacus & historical calculators','●','number','Explore Western, Chinese and Japanese abacuses alongside historical calculating devices.','Place value, arithmetic and the history of calculation using physical-style interactive devices.',abacusTool],
  ['fraction-wall','Fraction wall','½','fractions','Compare and explore equivalent fractions visually.','Equivalent fractions, comparison, ordering and links between common denominators.',fractionWall],
  ['bar-model','Bar model builder','▰','operations','Create part–whole models with known and unknown values.','Word problems, additive reasoning, multiplication/division and explaining unknown quantities.',barModel],
  ['hundred-square','Hundred square','▦','number','Highlight patterns, multiples, factors, primes and parity.','Counting patterns, times tables, prime numbers, place value and mental calculation.',hundredSquare],
  ['multiplication-grid','Multiplication grid','×','operations','Explore products on a 1–12 multiplication square.','Times-table facts, commutativity, related facts and finding patterns.',multiplicationGrid],
  ['array-builder','Array builder','⠿','operations','Build rows and columns to represent multiplication.','Multiplication, division, factor pairs and the link between repeated addition and arrays.',arrayBuilder],
  ['clock','Clock & time','◷','measure','Move an analogue clock and connect it to digital time.','Telling time, 12/24-hour notation, quarter/half hours and time intervals.',clockTool],
  ['money','UK money','£','measure','Make amounts with UK coins and notes.','Coin recognition, totals, equivalence, budgeting and calculating change.',moneyTool],
  ['coordinates','Coordinate grid','⌖','geometry','Plot points on a one- or four-quadrant grid.','Coordinates, translations, plotting vertices and describing position.',coordinateTool],
  ['measurement','Ruler & measures','📏','measure','Read a ruler and convert common metric lengths.','Reading scales accurately and linking millimetres, centimetres and metres.',measurementTool],
  ['randomiser','Dice, spinner & randomiser','⚄','random','Generate dice, spinner choices, cards and random numbers.','Mental starters, probability language, turn-taking, sampling and quick classroom games.',randomiser],
  ['balance','Equation balance','⚖','operations','See equality as a balance between two expressions.','Missing-number problems, inverse operations and the meaning of the equals sign.',balanceTool],
  ['times-table','Times-table visualiser','⋅','operations','See one multiplication fact as groups, addition and jumps.','Connecting representations instead of memorising a fact in isolation.',timesTableVisual],
  ['factors','Factors & multiples','÷','number','Find factor pairs, multiples and prime factors.','Factors, multiples, primes, common factors and divisibility.',factorExplorer],
  ['fdp','Fraction–decimal–percentage','%','fractions','See the same quantity as a fraction, decimal and percentage.','Making equivalence visible with fraction bars and a hundred square.',fdpExplorer],
  ['geoboard','Shape & geoboard','◇','geometry','Plot vertices on a dot grid to make and inspect polygons.','Coordinates, perimeter, area, polygons and geometric reasoning.',geoboard],
  ['sequences','Sequences & rules','1…','number','Change a sequence rule and reveal terms step by step.','Teacher-led exploration of constant and changing differences, multiplication patterns and alternating rules.',sequencesTool],
  ['column-addition','Column addition','+','operations','Model column addition with place-value exchanges and step-by-step working.','Written addition, carrying and place-value reasoning.',()=>G.columnMethodTool('addition')],
  ['written-multiplication','Written multiplication','×','operations','Teach short and long multiplication with carries and partial products.','Written multiplication, place-value shifts and addition of partial products.',()=>G.columnMethodTool('multiplication')],
  ['column-subtraction','Column subtraction','−','operations','Model column subtraction, including exchanges across zero.','Written subtraction and regrouping across place-value columns.',()=>G.columnMethodTool('subtraction')],
  ['maths-canvas','Number & symbol tiles','3+?','canvas','Arrange, combine and split draggable number and mathematical symbol tiles.','Build equations, order numbers, model number composition and create custom pupil tasks.',mathsCanvas],
].map(([id,title,icon,cat,desc,use,build])=>({id,title,icon,cat,desc,use,build}));
const params=new URLSearchParams(location.search),embedded=params.get('embed')==='1';
G.toolCatalogue=tools.map(({id,title,icon,cat,desc,use})=>({id,title,icon,cat,desc,use}));
if(embedded){document.documentElement.classList.add('gd-embed-page');document.body.classList.add('gd-embed-page')}

root.innerHTML=`<div class="gd-shell">
  <header class="gd-hero"><div><span class="gd-eyebrow">99 Club Studio · experimental toolbox</span><h1>Primary maths manipulatives</h1><p>Interactive, no-login classroom tools for modelling maths on a board or exploring it directly with pupils. This area is deliberately hidden while the tools are developed.</p></div><div class="gd-lab-badge">/goodies/ lab</div></header>
  <div class="gd-note"><strong>Development area.</strong> Nothing here is linked from the public Studio navigation, indexed by search engines or included in the sitemap.</div>
  <section class="gd-catalogue">
    <div class="gd-toolbar"><button class="gd-chip gd-board-launch" id="gd-board-launch" type="button" aria-label="Open mixed maths whiteboard">Whiteboard</button><input class="gd-search" id="gd-search" type="search" placeholder="Find a manipulative…" aria-label="Find a manipulative"><button class="gd-chip is-active" data-cat="all">All</button>${Object.entries(CATS).map(([id,label])=>`<button class="gd-chip" data-cat="${id}">${label}</button>`).join('')}</div>
    <div class="gd-grid" id="gd-grid"></div>
  </section>
  <section class="gd-tool-view" aria-live="polite">
    <div class="gd-tool-head"><div><span class="gd-eyebrow" id="gd-tool-cat"></span><h2 id="gd-tool-title"></h2><p id="gd-tool-desc"></p></div><div class="gd-tool-actions"><button class="gd-btn gd-present" id="gd-present" type="button">Present</button><button class="gd-back" id="gd-back" type="button">← All manipulatives</button></div></div>
    <div class="gd-workspace" id="gd-workspace" data-whiteboard-supported="true"><aside class="gd-panel gd-controls" id="gd-controls"></aside><main class="gd-panel gd-stage" id="gd-stage"></main><div class="gd-whiteboard-ui" aria-hidden="true"><button class="gd-whiteboard-button gd-whiteboard-tools" id="gd-whiteboard-tools" type="button" aria-controls="gd-controls" aria-expanded="false">Tools</button><button class="gd-whiteboard-button gd-whiteboard-exit" id="gd-whiteboard-exit" type="button" aria-label="Exit whiteboard mode">Exit</button></div></div>
    <div class="gd-use" id="gd-use"></div>
  </section>
</div>`;

const shell=root.querySelector('.gd-shell'),grid=q('#gd-grid'),search=q('#gd-search'),workspace=q('#gd-workspace');
let category='all',currentToolId='',whiteboardFallback=false,whiteboardToolsOpen=false;
function genericWhiteboardActive(){return document.fullscreenElement===workspace||whiteboardFallback}
function bespokeNumberLineActive(){
  if(currentToolId!=='number-line')return false;
  const stage=q('#gd-stage');
  return document.fullscreenElement===stage||!!stage?.classList.contains('nl-board-fallback');
}
function whiteboardActive(){return genericWhiteboardActive()||bespokeNumberLineActive()}
function setWhiteboardUi(active){
  workspace.classList.toggle('gd-whiteboard-active',!!active);
  workspace.classList.toggle('gd-whiteboard-tools-open',!!active&&whiteboardToolsOpen);
  const ui=q('.gd-whiteboard-ui',workspace);if(ui)ui.setAttribute('aria-hidden',active?'false':'true');
  const toolsButton=q('#gd-whiteboard-tools');if(toolsButton)toolsButton.setAttribute('aria-expanded',active&&whiteboardToolsOpen?'true':'false');
  const controls=q('#gd-controls');if(controls)controls.setAttribute('aria-hidden',active&&!whiteboardToolsOpen?'true':'false');
  document.documentElement.classList.toggle('gd-whiteboard-page-lock',!!active);
  document.body.classList.toggle('gd-whiteboard-page-lock',!!active);
}
function enterWhiteboardFallback(){
  whiteboardFallback=true;whiteboardToolsOpen=false;workspace.classList.add('gd-whiteboard-fallback');setWhiteboardUi(true);
}
function leaveGenericWhiteboard(){
  whiteboardFallback=false;whiteboardToolsOpen=false;workspace.classList.remove('gd-whiteboard-fallback');setWhiteboardUi(false);
}
function enterGenericWhiteboard(){
  whiteboardToolsOpen=false;setWhiteboardUi(true);
  if(workspace.requestFullscreen){
    workspace.requestFullscreen().then(()=>setWhiteboardUi(true)).catch(()=>enterWhiteboardFallback());
  }else enterWhiteboardFallback();
}
function exitWhiteboard(){
  if(bespokeNumberLineActive()){
    const stage=q('#gd-stage');
    if(document.fullscreenElement===stage&&document.exitFullscreen){document.exitFullscreen();return}
    const exit=q('[data-board-action="exit"]',stage);if(exit){exit.click();return}
  }
  if(document.fullscreenElement===workspace&&document.exitFullscreen)document.exitFullscreen().catch(()=>leaveGenericWhiteboard());
  else leaveGenericWhiteboard();
}
function enterWhiteboard(){
  if(currentToolId==='number-line'){
    const bespoke=q('#nl-fullscreen');
    if(bespoke){bespoke.click();return}
  }
  enterGenericWhiteboard();
}
function renderCards(){const term=search.value.trim().toLowerCase();const filtered=tools.filter(t=>(category==='all'||t.cat===category)&&(!term||`${t.title} ${t.desc} ${t.use}`.toLowerCase().includes(term)));grid.innerHTML=filtered.map(t=>`<button class="gd-tool-card" type="button" data-tool="${t.id}"><div class="gd-tool-card__top"><span class="gd-icon">${t.icon}</span><h2>${t.title}</h2></div><p>${t.desc}</p><span class="gd-tag">${CATS[t.cat]}</span></button>`).join('')||'<p class="gd-empty">No manipulatives match that search.</p>';qa('[data-tool]',grid).forEach(b=>b.addEventListener('click',()=>openTool(b.dataset.tool)))}
function openTool(id){const t=tools.find(x=>x.id===id);if(!t)return;if(genericWhiteboardActive())leaveGenericWhiteboard();G.interaction?.clear();G.lessonState?.clear();currentToolId=id;shell.classList.add('is-tool-open');q('#gd-tool-cat').textContent=CATS[t.cat];q('#gd-tool-title').textContent=t.title;q('#gd-tool-desc').textContent=t.desc;q('#gd-use').innerHTML=`<strong>Classroom use:</strong> ${t.use}`;const present=q('#gd-present');if(present)present.hidden=id==='number-line';t.build();history.replaceState(null,'','#'+id);if(embedded&&window.parent!==window)window.parent.postMessage({type:'tt99-board-ready',tool:id},location.origin);window.scrollTo({top:root.getBoundingClientRect().top+scrollY-20,behavior:'smooth'})}
function closeTool(){if(genericWhiteboardActive())exitWhiteboard();G.interaction?.clear();G.lessonState?.clear();currentToolId='';shell.classList.remove('is-tool-open');history.replaceState(null,'',location.pathname+location.search);q('#gd-controls').innerHTML='';q('#gd-stage').innerHTML=''}
q('#gd-present').addEventListener('click',enterWhiteboard);
q('#gd-whiteboard-tools').addEventListener('click',()=>{if(!genericWhiteboardActive())return;whiteboardToolsOpen=!whiteboardToolsOpen;setWhiteboardUi(true)});
q('#gd-whiteboard-exit').addEventListener('click',exitWhiteboard);
document.addEventListener('fullscreenchange',()=>{
  if(document.fullscreenElement===workspace){whiteboardFallback=false;workspace.classList.remove('gd-whiteboard-fallback');setWhiteboardUi(true)}
  else if(workspace.classList.contains('gd-whiteboard-active')&&!whiteboardFallback)leaveGenericWhiteboard();
});
G.whiteboard={enter:enterWhiteboard,exit:exitWhiteboard,isActive:whiteboardActive,tools:()=>tools.map(t=>t.id)};
const boardLaunch=q('#gd-board-launch');if(boardLaunch)boardLaunch.addEventListener('click',()=>{location.href=location.pathname+'?board=1'});
if(embedded){
  function simplifyEmbeddedControls(){
    const controls=q('#gd-controls');if(!controls)return;
    const blocked=/^(challenge|export|present|task)(\b|\s|$)/i;
    const tablists=[...controls.querySelectorAll('[role="tablist"]')];
    tablists.forEach(tab=>{
      const buttons=[...tab.querySelectorAll('button')];
      if(!buttons.some(button=>blocked.test((button.textContent||'').trim())))return;
      const allowed=buttons.filter(button=>!blocked.test((button.textContent||'').trim()));
      buttons.forEach(button=>button.classList.toggle('gd-embed-workflow-hidden',blocked.test((button.textContent||'').trim())));
      // Embedded controls are visually hidden and mirrored into the parent.
      // Never change a widget's active workflow here: it invalidates challenge
      // configuration and can cancel a requested export during a render.
      tab.classList.toggle('gd-embed-workflow-hidden',allowed.length===0);
      tab.classList.toggle('gd-embed-workflow-compact',allowed.length>0);
    });
    [...controls.querySelectorAll('button')].forEach(button=>{
      const label=(button.textContent||'').trim();
      if(button.id==='nl-fullscreen'||/^(present|export)(\b|\s|$)/i.test(label))button.classList.add('gd-embed-workflow-hidden');
    });
  }
  const embeddedControls=q('#gd-controls');
  if(embeddedControls)new MutationObserver(()=>queueMicrotask(simplifyEmbeddedControls)).observe(embeddedControls,{childList:true,subtree:true});
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||!event.data||typeof event.data!=='object')return;
    if(event.data.type==='tt99-board-settings'){
      const open=!!event.data.open;
      shell.classList.toggle('gd-embed-controls-open',open);
      if(open)queueMicrotask(simplifyEmbeddedControls);
    }
  });
}
q('#gd-back').addEventListener('click',closeTool);search.addEventListener('input',renderCards);qa('[data-cat]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.cat;qa('[data-cat]').forEach(x=>x.classList.toggle('is-active',x===b));renderCards()}));
renderCards();
const hash=location.hash.slice(1);if(tools.some(t=>t.id===hash))openTool(hash);

})(window.TT99Goodies);
