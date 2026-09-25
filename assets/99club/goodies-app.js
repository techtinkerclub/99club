const tools=[
  ['number-line','Number line','↔','number','Explore integers, decimals and jumps on a configurable line.','Mental arithmetic, rounding, negative numbers, fractions/decimals and explaining calculation strategies.',numberLine],
  ['place-value','Place value board','123','number','Build numbers by place value and see their expanded form.','Reading, composing and decomposing whole numbers and decimals; useful on an interactive whiteboard.',placeValue],
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
  ['maths-canvas','Maths canvas','✎','canvas','Arrange draggable number and symbol tiles on a clean board.','Teacher modelling, number sentences, ordering, quick examples and pupil explanations.',mathsCanvas]
].map(([id,title,icon,cat,desc,use,build])=>({id,title,icon,cat,desc,use,build}));

root.innerHTML=`<div class="gd-shell">
  <header class="gd-hero"><div><span class="gd-eyebrow">99 Club Studio · experimental toolbox</span><h1>Primary maths manipulatives</h1><p>Interactive, no-login classroom tools for modelling maths on a board or exploring it directly with pupils. This area is deliberately hidden while the tools are developed.</p></div><div class="gd-lab-badge">/goodies/ lab</div></header>
  <div class="gd-note"><strong>Development area.</strong> Nothing here is linked from the public Studio navigation, indexed by search engines or included in the sitemap.</div>
  <section class="gd-catalogue">
    <div class="gd-toolbar"><input class="gd-search" id="gd-search" type="search" placeholder="Find a manipulative…" aria-label="Find a manipulative"><button class="gd-chip is-active" data-cat="all">All</button>${Object.entries(CATS).map(([id,label])=>`<button class="gd-chip" data-cat="${id}">${label}</button>`).join('')}</div>
    <div class="gd-grid" id="gd-grid"></div>
  </section>
  <section class="gd-tool-view" aria-live="polite">
    <div class="gd-tool-head"><div><span class="gd-eyebrow" id="gd-tool-cat"></span><h2 id="gd-tool-title"></h2><p id="gd-tool-desc"></p></div><button class="gd-back" id="gd-back" type="button">← All manipulatives</button></div>
    <div class="gd-workspace"><aside class="gd-panel gd-controls" id="gd-controls"></aside><main class="gd-panel gd-stage" id="gd-stage"></main></div>
    <div class="gd-use" id="gd-use"></div>
  </section>
</div>`;

const shell=root.querySelector('.gd-shell'),grid=q('#gd-grid'),search=q('#gd-search');
let category='all';
function renderCards(){const term=search.value.trim().toLowerCase();const filtered=tools.filter(t=>(category==='all'||t.cat===category)&&(!term||`${t.title} ${t.desc} ${t.use}`.toLowerCase().includes(term)));grid.innerHTML=filtered.map(t=>`<button class="gd-tool-card" type="button" data-tool="${t.id}"><div class="gd-tool-card__top"><span class="gd-icon">${t.icon}</span><h2>${t.title}</h2></div><p>${t.desc}</p><span class="gd-tag">${CATS[t.cat]}</span></button>`).join('')||'<p class="gd-empty">No manipulatives match that search.</p>';qa('[data-tool]',grid).forEach(b=>b.addEventListener('click',()=>openTool(b.dataset.tool)))}
function openTool(id){const t=tools.find(x=>x.id===id);if(!t)return;shell.classList.add('is-tool-open');q('#gd-tool-cat').textContent=CATS[t.cat];q('#gd-tool-title').textContent=t.title;q('#gd-tool-desc').textContent=t.desc;q('#gd-use').innerHTML=`<strong>Classroom use:</strong> ${t.use}`;t.build();history.replaceState(null,'','#'+id);window.scrollTo({top:root.getBoundingClientRect().top+scrollY-20,behavior:'smooth'})}
function closeTool(){shell.classList.remove('is-tool-open');history.replaceState(null,'',location.pathname+location.search);q('#gd-controls').innerHTML='';q('#gd-stage').innerHTML=''}
q('#gd-back').addEventListener('click',closeTool);search.addEventListener('input',renderCards);qa('[data-cat]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.cat;qa('[data-cat]').forEach(x=>x.classList.toggle('is-active',x===b));renderCards()}));
renderCards();
const hash=location.hash.slice(1);if(tools.some(t=>t.id===hash))openTool(hash);
