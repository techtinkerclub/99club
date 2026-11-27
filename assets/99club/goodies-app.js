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
  ...(G.statisticsTableTool?[['statistics-table','Data & graphs','▤','random','Explore tables, tally charts, pictograms, bar charts, line graphs and pie charts.','Collect, represent and interpret data using six linked representations.',G.statisticsTableTool]]:[]),
  ['randomiser','Dice, spinner & randomiser','⚄','random','Generate dice, spinner choices, cards and random numbers.','Mental starters, probability language, turn-taking, sampling and quick classroom games.',randomiser],
  ['balance','Equation balance','⚖','operations','See equality as a balance between two expressions.','Missing-number problems, inverse operations and the meaning of the equals sign.',balanceTool],
  ['times-table','Times-table visualiser','⋅','operations','See one multiplication fact as groups, addition and jumps.','Connecting representations instead of memorising a fact in isolation.',timesTableVisual],
  ['factors','Factors & multiples','÷','number','Find factor pairs, multiples and prime factors.','Factors, multiples, primes, common factors and divisibility.',factorExplorer],
  ['fdp','Fraction–decimal–percentage','%','fractions','See the same quantity as a fraction, decimal and percentage.','Making equivalence visible with fraction bars and a hundred square.',fdpExplorer],
  ['geoboard','Shape & geoboard','◇','geometry','Plot vertices on a dot grid to make and inspect polygons.','Coordinates, perimeter, area, polygons and geometric reasoning.',geoboard],
  ['angles','Angles & geometry','∠','geometry','Explore turns, measure and construct angles, and reason about angles in shapes.','Angle classification, protractors, turns, line relationships, missing angles and shape construction.',()=>G.anglesTool()],
  ['function-machine','Function machines & algebra','ƒ','operations','Explore input, output, rules and inverse operations.','Arithmetic relationships, missing numbers, formulae, linear sequences and pairs of values.',()=>G.functionMachineTool()],
  ['sequences','Sequences & rules','1…','number','Change a sequence rule and reveal terms step by step.','Teacher-led exploration of constant and changing differences, multiplication patterns and alternating rules.',sequencesTool],
  ['written-methods','Written Methods','▤','operations','Explore all six formal written methods, including decimals.','Addition, subtraction, short and long multiplication and division with shared working grids.',()=>G.columnMethodTool('all')],
  ['column-addition','Column addition','+','operations','Model column addition with place-value exchanges and step-by-step working.','Written addition, carrying and place-value reasoning.',()=>G.columnMethodTool('addition')],
  ['written-division','Written division','÷','operations','Model short and long division with quotient digits, regrouping and remainders.','Formal written division, place-value reasoning and remainders.',()=>G.columnMethodTool('division')],
  ['written-multiplication','Written multiplication','×','operations','Teach short and long multiplication with carries and partial products.','Written multiplication, place-value shifts and addition of partial products.',()=>G.columnMethodTool('multiplication')],
  ['column-subtraction','Column subtraction','−','operations','Model column subtraction, including exchanges across zero.','Written subtraction and regrouping across place-value columns.',()=>G.columnMethodTool('subtraction')],
  ['maths-canvas','Arithmetic Hub','3+?','canvas','Arrange, combine and split draggable number and mathematical symbol tiles.','Build equations, order numbers, model number composition and create custom pupil tasks.',mathsCanvas],
].map(([id,title,icon,cat,desc,use,build])=>({id,title,icon,cat,desc,use,build,legacy:['column-addition','column-subtraction','written-multiplication','written-division'].includes(id)}));
const params=new URLSearchParams(location.search),embedded=params.get('embed')==='1';
G.toolCatalogue=tools.map(({id,title,icon,cat,desc,use,legacy})=>({id,title,icon,cat,desc,use,legacy}));
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
// Shared primary-mode contract. Use the existing teaching control, not a second
// state model. Each multi-mode tool declares a source and concise teaching hints.
// New manipulatives must declare their primary mode here or explicitly be single-purpose.
const MODE_CONTRACTS={
 'place-value':{buttons:'[data-pv-representation]',attr:'data-pv-representation',hints:{counters:'Each counter represents one unit of its place-value column.',abacus:'Each bead counts one unit of its place value.',both:'Compare the counters and place-value frame.'}},
 abacus:{select:'#ab-kind,[data-ab-stage-kind]',prefer:'[data-ab-stage-kind]',stageDuplicate:'.gd-ab-device-switcher',groups:{western:'Abacuses',suanpan:'Abacuses',soroban:'Abacuses',reckoning:'Historical calculators',rods:'Historical calculators',napier:'Historical calculators',slide:'Historical calculators',pascaline:'Historical calculators'},hints:{western:'Move beads to count in powers of ten.',suanpan:'Move beads towards the beam to represent values.',soroban:'Move beads towards the middle bar.',reckoning:'Use counters on marked place-value lines.',rods:'Arrange counting rods to represent digits.',napier:'Use the rods to break multiplication into partial products.',slide:'Align the logarithmic scales to multiply or divide.',pascaline:'Turn a dial to add or subtract at a place value.'}},
 'fraction-wall':{buttons:'[data-fw-mode]',attr:'data-fw-mode',hints:{wall:'Compare strips with the same whole to find equivalent fractions.',workbench:'Arrange fraction strips to compare or combine their lengths.'}},
 'hundred-square':{select:'#hs-mode',hints:{multiples:'Look for patterns in the highlighted multiples.',factors:'Highlighted numbers divide the chosen number exactly.',prime:'A prime has exactly two positive factors.',odd:'Odd numbers cannot be grouped into pairs with none left.',even:'Even numbers can be grouped into pairs.',none:'Explore counting and number patterns on the square.'}},
 clock:{select:'#cl-numerals',hints:{arabic:'Read the hour and minute hands together.',roman:'Match Roman numerals to positions on the clock face.'}},
 coordinates:{check:'#co-four',choices:[['first','First quadrant'],['four','Four quadrants']],hints:{first:'Read the horizontal coordinate first, then the vertical coordinate.',four:'Use positive and negative coordinates on both axes.'}},
 measurement:{select:'#me-scale',hints:{metric:'Align the object with the scale and read the centimetres or millimetres.',imperial:'Read the inch marks and their subdivisions.'}},
 'statistics-table':{select:'#st-view',groups:{table:'Organise data',tally:'Organise data',block:'Represent data',bar:'Represent data',pictogram:'Represent data',line:'Represent data',pie:'Represent data',timetable:'Other'},hints:{table:'Frequency tells us how often something occurs.',tally:'Group tally marks in fives to count efficiently.',block:'Each block represents one observation.',bar:'The height of each bar represents its frequency.',pictogram:'Use the key to find the value represented by each symbol.',line:'Follow the line to see how values change.',pie:'Each sector represents a proportion of the whole.',timetable:'Read across a row and down a column to locate a time.'}},
 randomiser:{select:'#ra-mode',hints:{dice:'Roll the dice and compare the possible outcomes.',spinner:'Spin to explore the outcomes and their chances.',number:'Generate a number within the chosen range.',card:'Draw a card from the deck.'}},
 factors:{check:'#fe-compare',choices:[['one','Explore one number'],['two','Compare two numbers']],hints:{one:'Find factor pairs that multiply to this number.',two:'Compare the factors and multiples of two numbers.'}},
 sequences:{select:'[data-seq-setting="mode"]',hints:{constant:'Add the same difference to find the next term.',increasing:'Look for a pattern in the differences.',geometric:'Multiply each term by the same number.',alternating:'Look for two differences that alternate.'}},
 'written-methods':{select:'[data-wm-setting="method"]',hints:{addition:'Align place values and add each column.',subtraction:'Exchange between adjacent places when needed.','short-multiplication':'Multiply each place in turn.','long-multiplication':'Calculate and add partial products.','short-division':'Divide each place and regroup the remainder.','long-division':'Divide, multiply, subtract and bring down.'}},
 'written-multiplication':{select:'[data-wm-setting="method"]',hints:{'short-multiplication':'Multiply each place in turn and carry when necessary.','long-multiplication':'Calculate partial products, then add them together.'}},
 'written-division':{select:'[data-wm-setting="method"]',hints:{'short-division':'Divide each place in turn, carrying the remainder.','long-division':'Divide, multiply, subtract and bring down the next digit.'}},
 'function-machine':{select:'#fm-stages',labels:{'1':'One-stage machine','2':'Two-stage machine'},hints:{'1':'Follow the operation to calculate the output.','2':'Follow the operations in order to calculate the output.'}},
 angles:{select:'#ag-mode',hints:{angle:'Align the protractor centre with the vertex and its zero line with an arm.',turn:'A full turn is 360 degrees; a quarter turn is 90 degrees.',lines:'Compare the directions of the lines and whether they meet.',facts:'Use known angle relationships to find unknown angles.',polygon:'Investigate the angles and properties of shapes.',construct:'Use the given measurements and angles to construct the shape.'}}
};
const SINGLE_PURPOSE={
 'number-line':'Scale and line types are properties of individual teaching lines, not workspace modes.',
 'bar-model':'One modelling workspace; comparison is a challenge family.',
 'multiplication-grid':'One grid; size and highlighting are settings.',
 'array-builder':'One array; dimensions and partitions are settings.',
 money:'One money workbench; coins and notes are objects.',
 balance:'One equation balance; number and challenge types are settings.',
 'times-table':'Linked representations appear together.',
 fdp:'Linked fraction, decimal and percentage representations appear together.',
 geoboard:'One pin-grid workspace; grid size is a setting.',
 'column-addition':'One written method.',
 'column-subtraction':'One written method.',
 'maths-canvas':'One arithmetic workspace; challenge families belong in the challenge launcher.'
};
let lastMode=null,modeHintVisible=true;
function activeChallenge(){const stage=q('#gd-stage');if(!stage)return false;return !!stage.querySelector('.gd-challenge-banner,.gd-native-challenge,.gd-ab-task,.nl-challenge-banner,.gd-history-challenge,.gd-pv-activity--game')||(()=>{try{const m=G.lessonState.capture(currentToolId).model;return !!(m.challenge||m.task||m.historyChallenge||m.state?.challenge)}catch(_){return false}})()}
function modeNodes(spec){const base=q('#gd-controls'),stage=q('#gd-stage');if(!spec||!base||!stage)return [];if(spec.prefer){const target=stage.querySelector(spec.prefer);if(target)return [target]}if(spec.buttons)return [...base.querySelectorAll(spec.buttons)];const node=base.querySelector(spec.select||spec.check);return node?[node]:[]}
function modeRead(){
 const spec=MODE_CONTRACTS[currentToolId];if(!spec)return null;
 if(currentToolId==='angles'&&G.geometryTopics){
   const topics=G.geometryTopics.read();
   if(topics){const base=topics.value.startsWith('centre:')?'polygon':topics.value.split(':')[0];const data={tool:currentToolId,...topics,hint:spec.hints?.[base]||''};lastMode=data;return {...data,locked:activeChallenge(),hintVisible:modeHintVisible}}
 }
 const nodes=modeNodes(spec),n=nodes[0];let data=null;
 if(n){let options,value;if(spec.buttons){options=nodes.map(b=>({value:b.getAttribute(spec.attr),label:b.textContent.trim(),disabled:b.disabled}));value=nodes.find(b=>b.classList.contains('gd-btn--primary')||b.classList.contains('is-active')||b.getAttribute('aria-selected')==='true'||b.getAttribute('aria-pressed')==='true')?.getAttribute(spec.attr)}
 else if(spec.check){options=spec.choices.map(([value,label])=>({value,label,disabled:n.disabled}));value=options[n.checked?1:0].value}
 else{options=[...n.options].map(o=>({value:o.value,label:spec.labels?.[o.value]||o.textContent.trim(),disabled:o.disabled,group:spec.groups?.[o.value]||''}));value=n.value}
 if(value!=null&&options.some(o=>o.value===value))data={tool:currentToolId,value,options,hint:spec.hints?.[value]||''};
 }
 if(data)lastMode=data;else if(lastMode?.tool===currentToolId)data=lastMode;
 return data?{...data,locked:activeChallenge(),hintVisible:modeHintVisible}:null;
}
function modeSet(value){
 const spec=MODE_CONTRACTS[currentToolId],data=modeRead();if(!spec||!data||data.locked||!data.options.some(o=>o.value===value&&!o.disabled))return false;
 if(data.value===value)return true;
 if(currentToolId==='angles'&&G.geometryTopics){const changed=G.geometryTopics.set(value);syncModeHint();return changed&&modeRead()?.value===value}
 let nodes=modeNodes(spec);
 if(!nodes.length){const teaching=[...q('#gd-controls').querySelectorAll('button')].find(b=>[...b.attributes].some(a=>/^data-[a-z]+-workflow$/.test(a.name)&&['build','explore','setup','model'].includes(a.value)));if(!teaching)return false;teaching.click();nodes=modeNodes(spec)}
 const n=nodes[0];if(!n)return false;
 if(spec.buttons){const b=nodes.find(b=>b.getAttribute(spec.attr)===value);if(!b||b.disabled)return false;b.click()}
 else if(spec.check){const next=spec.choices[1][0]===value;if(n.checked!==next)n.click()}
 else{if(![...n.options].some(o=>o.value===value&&!o.disabled)||n.disabled)return false;n.value=value;n.dispatchEvent(new Event('change',{bubbles:true}))}
 syncModeHint();return modeRead()?.value===value;
}
function syncModeHint(){
 const stage=q('#gd-stage'),data=modeRead(),existing=stage?.querySelector(':scope > .gd-mode-hint');if(!stage)return;
 // Hide teaching hints in challenges to avoid giving away an answer.
 const show=data&&!data.locked&&data.hintVisible&&data.hint&&!stage.querySelector('.gd-object-hint,.gd-wm-explanation');
 if(!show){existing?.remove();return}
 const el=existing||document.createElement('p');el.className='gd-mode-hint';if(el.textContent!==data.hint)el.textContent=data.hint;if(!existing)stage.appendChild(el);
}
G.modeControl={read:modeRead,set:modeSet,hint(show){modeHintVisible=!!show;syncModeHint()},contracts:()=>Object.keys(MODE_CONTRACTS),audit:()=>tools.filter(t=>!t.legacy).map(t=>({id:t.id,multi:!!MODE_CONTRACTS[t.id],reason:SINGLE_PURPOSE[t.id]||''})),sourceSelectors:id=>{const s=MODE_CONTRACTS[id];return s?[s.select,s.check,s.buttons,s.prefer].filter(Boolean).join(','):''}};
const modeObserver=new MutationObserver(()=>syncModeHint());
modeObserver.observe(q('#gd-stage'),{childList:true,subtree:true});modeObserver.observe(q('#gd-controls'),{childList:true,subtree:true});

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
function renderCards(){const term=search.value.trim().toLowerCase();const filtered=tools.filter(t=>!t.legacy&&(category==='all'||t.cat===category)&&(!term||`${t.title} ${t.desc} ${t.use}`.toLowerCase().includes(term)));grid.innerHTML=filtered.map(t=>`<button class="gd-tool-card" type="button" data-tool="${t.id}"><div class="gd-tool-card__top"><span class="gd-icon">${t.icon}</span><h2>${t.title}</h2></div><p>${t.desc}</p><span class="gd-tag">${CATS[t.cat]}</span></button>`).join('')||'<p class="gd-empty">No manipulatives match that search.</p>';qa('[data-tool]',grid).forEach(b=>b.addEventListener('click',()=>openTool(b.dataset.tool)))}
function openTool(id){const t=tools.find(x=>x.id===id);if(!t)return;if(genericWhiteboardActive())leaveGenericWhiteboard();G.interaction?.clear();G.lessonState?.clear();currentToolId=id;lastMode=null;modeHintVisible=true;shell.classList.add('is-tool-open');q('#gd-tool-cat').textContent=CATS[t.cat];q('#gd-tool-title').textContent=t.title;q('#gd-tool-desc').textContent=t.desc;q('#gd-use').innerHTML=`<strong>Classroom use:</strong> ${t.use}`;const present=q('#gd-present');if(present)present.hidden=id==='number-line';t.build();syncModeHint();history.replaceState(null,'','#'+id);if(embedded&&window.parent!==window)window.parent.postMessage({type:'tt99-board-ready',tool:id},location.origin);window.scrollTo({top:root.getBoundingClientRect().top+scrollY-20,behavior:'smooth'})}
function closeTool(){if(genericWhiteboardActive())exitWhiteboard();G.interaction?.clear();G.lessonState?.clear();currentToolId='';lastMode=null;shell.classList.remove('is-tool-open');history.replaceState(null,'',location.pathname+location.search);q('#gd-controls').innerHTML='';q('#gd-stage').innerHTML=''}
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
