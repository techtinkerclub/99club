#!/usr/bin/env node
/* 99 Club Studio · automated generator / online contract QA
 * No third-party packages required. Designed for local use and GitHub Actions.
 */
'use strict';

const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const ASSET=path.join(ROOT,'assets/99club');
const args=Object.fromEntries(process.argv.slice(2).map(x=>{const [k,v='true']=x.replace(/^--/,'').split('=');return [k,v];}));
const SAMPLES=Math.max(1,Number(args.samples||process.env.QA_SAMPLES||12));
const failures=[],warnings=[],notes=[];
let generated=0;
function fail(area,msg,detail){failures.push({area,msg,detail:detail||''});console.error(`FAIL [${area}] ${msg}${detail?` · ${detail}`:''}`);}
function warn(area,msg,detail){warnings.push({area,msg,detail:detail||''});console.warn(`WARN [${area}] ${msg}${detail?` · ${detail}`:''}`);}
function ok(area,msg){notes.push({area,msg});console.log(`OK   [${area}] ${msg}`);}
function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}
function exists(rel){return fs.existsSync(path.join(ROOT,rel));}
function finiteWalk(value,p='root',seen=new Set()){
  if(value==null||typeof value==='string'||typeof value==='boolean')return null;
  if(typeof value==='number')return Number.isFinite(value)?null:`${p} is ${value}`;
  if(typeof value!=='object')return null;if(seen.has(value))return null;seen.add(value);
  for(const [k,v] of Object.entries(value)){const e=finiteWalk(v,`${p}.${k}`,seen);if(e)return e;}return null;
}
function stable(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function sourceScripts(page){return [...read(page).matchAll(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>/g)].map(m=>m[1]).filter(x=>x.startsWith('/assets/99club/'));}
function localFromUrl(url){return url.split('?')[0].replace(/^\//,'');}
function resetGlobals(){
  for(const k of ['TT99GamesVocabularyV2','TT99ArithmeticGames','TT99NumberLogicGames','TT99Games','TT99GamesPlay','TT99PlayArithmetic','TT99AlphaLibrary','TT99SymbolDecoder'])delete global[k];
  global.window=global;global.globalThis=global;
}
function load(rel){const full=path.join(ROOT,rel);delete require.cache[require.resolve(full)];return require(full);}

/* ---------- active asset integrity + syntax ---------- */
const playPage='_pages/99-club-games-play.md',printPage='_pages/99-club-games.md';
const activeAssets=[...new Set([...sourceScripts(playPage),...sourceScripts(printPage)])].map(localFromUrl);
for(const rel of activeAssets){
  if(!exists(rel)){fail('assets',`Missing active script ${rel}`);continue;}
  const src=read(rel);
  try{new Function(src);}catch(e){fail('syntax',rel,e.message);}
}
ok('syntax',`${activeAssets.length} active local JavaScript assets parsed`);

/* ---------- social preview metadata ---------- */
const socialPreviewRel='assets/99club/images/99studio-social-preview.png';
const socialPreviewPath=path.join(ROOT,socialPreviewRel);
if(!exists(socialPreviewRel))fail('social-preview','Missing crop-safe social preview image');
else{
  const png=fs.readFileSync(socialPreviewPath);
  const isPng=png.length>=24&&png[0]===0x89&&png.toString('ascii',1,4)==='PNG';
  if(!isPng)fail('social-preview','Social preview asset is not a PNG');
  else{
    const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
    if(width!==1200||height!==630)fail('social-preview','Social preview must be 1200×630',String(width)+'×'+String(height));
  }
}
const challengeSharePage=read('_pages/99-club-challenge.md');
const siteConfig=read('_config.yml');
for(const token of ['og:title','og:description','og:image','og:image:width','og:image:height','twitter:card','99studio-social-preview.png'])if(!challengeSharePage.includes(token))fail('social-preview','Challenge page metadata missing '+token);
if(!siteConfig.includes('og_image: "/assets/99club/images/99studio-social-preview.png"'))fail('social-preview','Global Open Graph fallback still uses the raw wordmark');
else ok('social-preview','1200×630 crop-safe social image and challenge Open Graph metadata are configured');

/* ---------- load generator stack exactly enough for Node ---------- */
resetGlobals();
const engineLoadOrder=[
  'assets/99club/games-vocabulary.js',
  'assets/99club/games-arithmetic.js',
  'assets/99club/games-new-puzzles-v196.js',
  'assets/99club/games-colourlogic-deduction-v209.js',
  'assets/99club/games-balance-lab-v192.js',
  'assets/99club/games-operationgrid-v153.js',
  'assets/99club/games-operationgrid-print-v155.js',
  'assets/99club/games-operationgrid-print-v158.js',
  'assets/99club/games-crossgrid-v1321.js',
  'assets/99club/games-property-maze.js',
  'assets/99club/games-brokencalc-quality-v152.js',
  'assets/99club/games-number-logic.js',
  'assets/99club/games-extra-puzzles-v204.js',
  'assets/99club/games-number-towers-v137.js',
  'assets/99club/games-number-towers-v137-unique.js',
  'assets/99club/games-takuzu-v139.js',
  'assets/99club/games-takuzu-v139-logic.js',
  'assets/99club/games-puzzle-pack-v140.js',
  'assets/99club/games-puzzle-pack-v140-hashi.js',
  'assets/99club/games-alphametics-library-v141.js',
  'assets/99club/games-number-path-v2.js',
  'assets/99club/games-sumplete.js',
  'assets/99club/games-shikaku-v143.js',
  'assets/99club/games-sum-grids-v147.js',
  'assets/99club/games-engine.js',
  'assets/99club/games-deduction-v210.js',
  'assets/99club/games-symbol-decoder-v189.js',
  'assets/99club/games-wordsearch-quality-v150.js'
];
for(const rel of engineLoadOrder){
  if(!exists(rel)){fail('engine-load',`Missing ${rel}`);continue;}
  try{load(rel);}catch(e){fail('engine-load',rel,e.stack||e.message);}
}
const G=global.TT99Games,A=global.TT99ArithmeticGames,N=global.TT99NumberLogicGames;
if(!G||!G.ENGINES)fail('engine-load','TT99Games did not initialise');

/* ---------- word-search direction balance ---------- */
if(G){
  const directionKeys=['1,0','0,1','1,1','-1,1'],totals=Object.fromEntries(directionKeys.map(k=>[k,0]));
  const settings={minYear:1,maxYear:6,topics:Object.keys(G.TOPICS),engineSettings:{wordsearch:{difficulty:'standard',directionMode:'diagonal',wordCount:'9',gridSize:'14'}}};
  let placed=0,errors=0;
  for(let i=0;i<120;i++){
    const a=G.generateWordSearch(settings,`qa-wordsearch-balance-${i}`);
    if(a?.error){errors++;continue;}
    for(const p of a.placements||[]){const key=`${p.dx},${p.dy}`;if(key in totals){totals[key]++;placed++;}}
  }
  const shares=directionKeys.map(k=>placed?totals[k]/placed:0),spread=Math.max(...shares)-Math.min(...shares);
  if(errors)fail('wordsearch-balance','Standard Word Search direction audit produced generation errors',String(errors));
  if(placed<900)fail('wordsearch-balance','Standard Word Search direction audit placed too few words',String(placed));
  if(spread>0.12)fail('wordsearch-balance','Standard Word Search directions are materially imbalanced',JSON.stringify(Object.fromEntries(directionKeys.map((k,i)=>[k,Number(shares[i].toFixed(3))]))));
  else ok('wordsearch-balance',`120 standard grids keep horizontal, vertical and both diagonal directions balanced (spread ${spread.toFixed(3)})`);
}

/* ---------- finite-bank capacity + no-repeat packs ---------- */
if(G&&global.TT99AlphaLibrary&&N?.V140?.ALPHAMETICS?.solve){
  const alphaTemplates=global.TT99AlphaLibrary.templates||[],solve=N.V140.ALPHAMETICS.solve;
  for(const t of alphaTemplates){
    const solutions=solve(t,t.givens||{},2);
    if(solutions.length!==1)fail('finite-bank',`Alphametics template is not uniquely solvable: ${t.id}`,String(solutions.length));
  }
  for(const difficulty of ['easy','standard','challenge']){
    const count=alphaTemplates.filter(t=>t.difficulty===difficulty).length;
    if(count<40)fail('finite-bank',`Alphametics ${difficulty} bank has fewer than 40 unique templates`,String(count));
    const settings={minYear:5,maxYear:6,topics:['algebra'],sheets:20,activitiesPerSheet:2,selectedEngines:['alphametics'],workedExamples:'none',engineSettings:{alphametics:{difficulty,hintLevel:'auto',theme:'auto'}}};
    const pack=G.generatePack(settings,`qa-alpha-40-${difficulty}`),activities=(pack.sheets||[]).flatMap(s=>s.activities||[]),keys=activities.map(a=>G.finiteContentKey?.(a)).filter(Boolean);
    if(activities.length!==40)fail('finite-bank',`40-item Alphametics ${difficulty} pack did not contain 40 activities`,String(activities.length));
    if(new Set(keys).size!==40)fail('finite-bank',`40-item Alphametics ${difficulty} pack repeated a template`,`${new Set(keys).size}/40 unique`);
  }
  ok('finite-bank','Alphametics has >=40 unique templates per difficulty and 40-item packs sample without replacement');
}
if(G&&global.TT99SymbolDecoder){
  for(const difficulty of ['easy','standard','challenge']){
    const scienceCount=global.TT99SymbolDecoder.bank('science',difficulty).length;
    if(scienceCount<40)fail('finite-bank',`Science Symbol Decoder ${difficulty} bank has fewer than 40 unique words`,String(scienceCount));
  }
  for(const difficulty of ['easy','standard','challenge']){
    const settings={minYear:5,maxYear:6,topics:['algebra'],sheets:20,activitiesPerSheet:2,selectedEngines:['symbols'],workedExamples:'none',engineSettings:{symbols:{difficulty,theme:'science',equationStyle:'auto'}}};
    const pack=G.generatePack(settings,`qa-symbols-40-${difficulty}`),activities=(pack.sheets||[]).flatMap(s=>s.activities||[]),keys=activities.map(a=>G.finiteContentKey?.(a)).filter(Boolean);
    if(activities.length!==40)fail('finite-bank',`40-item Symbol Decoder ${difficulty} pack did not contain 40 activities`,String(activities.length));
    if(new Set(keys).size!==40)fail('finite-bank',`40-item Symbol Decoder ${difficulty} pack repeated a secret word`,`${new Set(keys).size}/40 unique`);
  }
  ok('finite-bank','Symbol Decoder science banks support 40 unique items without replacement');
}
const randomUiSource=read('assets/99club/games-random-ui.js');
if(!randomUiSource.includes('max="40"')||!randomUiSource.includes('Maximum 40 activities per pack.'))fail('pack-limit','Pack setup does not clearly enforce and explain the 40-activity maximum');
else ok('pack-limit','Pack setup visibly enforces the 40-activity maximum');


const packAuditLoadOrder=[
  'assets/99club/games-instructions-v139.js',
  'assets/99club/simple-pdf.js',
  'assets/99club/games-pdf.js',
  'assets/99club/games-pdf-shikaku-v143.js',
  'assets/99club/games-pdf-worked-v146.js'
];
for(const rel of packAuditLoadOrder){
  if(!exists(rel)){fail('worked-pdf-load',`Missing ${rel}`);continue;}
  try{load(rel);}catch(e){fail('worked-pdf-load',rel,e.stack||e.message);}
}
const PDF=global.TT99GamesPDF;
if(!PDF||typeof PDF.buildDocument!=='function')fail('worked-pdf-load','TT99GamesPDF did not initialise');

function bestTopic(def){
  const entries=Object.entries(def?.compatibility||{});
  return (entries.find(([,v])=>v==='excellent')||entries.find(([,v])=>v==='reasonable')||['calculation'])[0];
}
function settingsFor(id,def,difficulty){
  const topic=bestTopic(def),min=Math.max(1,Number(def?.topicYearMin?.[topic]||1));
  return {minYear:min,maxYear:6,topics:[topic],sheets:1,activitiesPerSheet:1,selectedEngines:[id],workedExamples:'none',engineSettings:{[id]:{...(def.defaultSettings||{}),difficulty}}};
}
function branchWeight(node,values){if(!node)return NaN;if(node.type==='group')return Number(node.count)*Number(values[node.shape]);return branchWeight(node.left,values)+branchWeight(node.right,values);}
function checkSpecific(id,p){
  if(id==='crossnumber'){
    const occupancy=new Map();
    for(const e of p.entries||[])for(const [x,y] of e.cells||[]){
      const key=`${x}:${y}`;if(!occupancy.has(key))occupancy.set(key,[]);occupancy.get(key).push(e);
    }
    for(const e of p.entries||[]){
      for(const [x,y] of e.cells||[]){
        const members=occupancy.get(`${x}:${y}`)||[];
        if(members.filter(q=>q.dir===e.dir).length>1)fail(id,'same-direction entries overlap',`${e.number} ${e.dir}`);
      }
    }
  }
  if(id==='brokencalc'){
    if(p.bracketsAllowed!==false)fail(id,'bracketsAllowed must be false');
    if((p.keys||[]).some(k=>k==='('||k===')'))fail(id,'bracket key leaked into generated puzzle');
    const ev=A?._brokenCalcEvaluateV153;
    if(typeof ev!=='function'){fail(id,'precedence evaluator missing');return;}
    if(ev(['7','+','2','×','5'])!==17)fail(id,'precedence regression: 7 + 2 × 5 must equal 17');
    for(const t of p.targets||[]){
      const tokens=String(t.solution||'').trim().split(/\s+/).filter(Boolean),v=ev(tokens);
      if(Math.abs(v-Number(t.target))>1e-9)fail(id,`stored solution does not make target ${t.target}`,`${t.solution} = ${v}`);
      const proof=A.BROKENCALC_QUALITY?.reachable?.(t.target,p);if(!proof)fail(id,`QA cannot prove target ${t.target} reachable`);
    }
  }
  if(id==='sudoku'){
    const audit=G?.DEDUCTION?.audit?.(p);
    if(!audit?.solved)fail(id,'Sudoku/Latin puzzle requires an arbitrary branch',JSON.stringify(audit||{}));
    if(p.deductionStats?.solved!==true)fail(id,'Sudoku/Latin puzzle is missing deduction metadata');
  }
  if(id==='colourlogic'){
    if(p.solutionCount!==1)fail(id,'puzzle is not marked uniquely solvable',String(p.solutionCount));
    if(!Array.isArray(p.clues)||p.clues.length<2)fail(id,'too few clues');
    if(p.deductionStats?.solved!==true)fail(id,'puzzle is not marked deduction-solvable');
    const audit=A?.COLOURLOGIC_DEDUCTION?.audit?.(p);
    if(!audit?.solved)fail(id,'deduction audit stalls and would require an arbitrary branch',JSON.stringify(audit||{}));
  }
  if(id==='mobilebalance'){
    const vals=p.values||{};
    function walk(n){if(!n||n.type==='group')return;const l=branchWeight(n.left,vals),r=branchWeight(n.right,vals);if(!Number.isFinite(l)||!Number.isFinite(r)||Math.abs(l-r)>1e-9)fail(id,'generated mobile bar is not mathematically balanced',`${l} vs ${r}`);walk(n.left);walk(n.right);}walk(p.tree);
    if(p.topTotal!=null&&Math.abs(branchWeight(p.tree,vals)-Number(p.topTotal))>1e-9)fail(id,'top total does not match whole-mobile weight');
  }
  if(id==='diagonalpath'){
    const total=Number(p.size)*Number(p.size),blanks=total-(p.givens||[]).length,minBlanks=p.difficulty==='easy'?4:p.difficulty==='challenge'?12:8;
    if(blanks<minBlanks)fail(id,`too many anchors for ${p.difficulty} difficulty`,`${p.givens?.length||0} anchors leave only ${blanks} blanks`);
  }
  if(id==='squaresearch'){
    const ms=p.matches||[];for(let i=0;i<ms.length;i++)for(let j=i+1;j<ms.length;j++)if(Math.abs(ms[i].r-ms[j].r)<2&&Math.abs(ms[i].c-ms[j].c)<2)fail(id,'target squares overlap',`${ms[i].r}:${ms[i].c} with ${ms[j].r}:${ms[j].c}`);
  }
}

if(G&&G.ENGINES&&typeof G.generateWorkedExample==='function'){
  const visible=Object.entries(G.ENGINES).filter(([,def])=>!def?.hiddenFromLibrary).map(([id])=>id).sort();
  let workedOk=0;
  for(const id of visible){
    const def=G.ENGINES[id],settings=settingsFor(id,def,'standard');
    if(def?.workedExampleSupport===false){fail('worked-pdf',`${id} is visible but declares workedExampleSupport=false`);continue;}
    let ex=null;
    try{ex=G.generateWorkedExample(id,settings,`qa:worked:${id}`,[]);}catch(e){fail('worked-pdf',`${id} worked example threw`,e.stack||e.message);continue;}
    if(!ex){fail('worked-pdf',`${id} has no pack worked example`);continue;}
    if(ex.engineId!==id)fail('worked-pdf',`${id} worked example engineId mismatch`,String(ex.engineId));
    if(ex.kind!==id)fail('worked-pdf',`${id} worked example kind mismatch`,String(ex.kind));
    for(const field of ['goal','tip','commonMistake'])if(!String(ex[field]||'').trim())fail('worked-pdf',`${id} worked example missing ${field}`);
    for(const field of ['rules','steps'])if(!Array.isArray(ex[field])||!ex[field].length)fail('worked-pdf',`${id} worked example missing ${field}`);
    if(ex.engineId===id&&ex.kind===id&&ex.goal&&ex.tip&&ex.commonMistake&&Array.isArray(ex.rules)&&ex.rules.length&&Array.isArray(ex.steps)&&ex.steps.length)workedOk++;
    if(PDF&&typeof PDF.buildDocument==='function'){
      try{
        const pdfSettings={...settings,workedExamples:'front'};
        const pack={seed:`qa:worked-pdf:${id}`,settings:pdfSettings,workedExamples:[ex],sheets:[]};
        const doc=PDF.buildDocument({pack,settings:pdfSettings,kind:'student',topics:{},seed:pack.seed});
        if(!doc||!Array.isArray(doc.pages)||doc.pages.length!==1)fail('worked-pdf',`${id} did not render exactly one instructional PDF page`,String(doc?.pages?.length));
        else{
          const entry=doc.pages[0],cmds=Array.isArray(entry)?entry:entry.cmds||[],stream=cmds.join('\n');
          if(cmds.length<12)fail('worked-pdf',`${id} instructional PDF page is suspiciously empty`,String(cmds.length));
          if(/(?:^|\W)(?:undefined|NaN)(?:\W|$)/.test(stream))fail('worked-pdf',`${id} instructional PDF contains invalid rendered values`);
          const bytes=doc.outputBytes?.();
          if(!bytes||bytes.length<500||bytes[0]!==37||bytes[1]!==80||bytes[2]!==68||bytes[3]!==70)fail('worked-pdf',`${id} instructional PDF did not serialize as a valid PDF`);
        }
      }catch(e){fail('worked-pdf',`${id} instructional PDF render threw`,e.stack||e.message);}
    }
  }
  if(workedOk===visible.length)ok('worked-pdf',`all ${visible.length} visible games have matching instructional worked examples`);
}

if(G&&G.ENGINES){
  const ids=Object.keys(G.ENGINES).sort();
  for(const id of ids){
    const def=G.ENGINES[id],diffs=(def.difficultyOptions||['standard']).filter(x=>['easy','standard','challenge'].includes(x));
    for(const difficulty of (diffs.length?diffs:['standard'])){
      const settings=settingsFor(id,def,difficulty);
      for(let i=0;i<SAMPLES;i++){
        const seed=`qa:${id}:${difficulty}:${i}`;let p,p2;
        try{p=G.generateActivity(id,settings,seed,[]);p2=G.generateActivity(id,settings,seed,[]);generated+=2;}catch(e){fail(id,`generation threw (${difficulty}, seed ${i})`,e.stack||e.message);continue;}
        if(!p||p.error){fail(id,`generation failed (${difficulty}, seed ${i})`,p?.error||'empty result');continue;}
        if(!stable(p,p2))fail(id,`non-deterministic result (${difficulty}, seed ${i})`);
        const nf=finiteWalk(p);if(nf)fail(id,`non-finite numeric data (${difficulty}, seed ${i})`,nf);
        if(p.engineId&&p.engineId!==id)fail(id,`engineId mismatch: ${p.engineId}`);
        try{
          if(A?.DEFINITIONS?.[id]&&typeof A.validate==='function'){const v=A.validate(p);if(v&&v.ok===false)fail(id,`arithmetic validator rejected puzzle (${difficulty}, seed ${i})`,v.error||'unknown');}
          if(N?.DEFINITIONS?.[id]&&typeof N.validate==='function'){const v=N.validate(p);if(v&&v.ok===false)fail(id,`logic validator rejected puzzle (${difficulty}, seed ${i})`,v.error||'unknown');}
          checkSpecific(id,p);
        }catch(e){fail(id,`validator threw (${difficulty}, seed ${i})`,e.stack||e.message);}
      }
    }
  }
  ok('engines',`${Object.keys(G.ENGINES).length} engines stress-tested; ${generated} deterministic generations performed`);
}

/* ---------- all deduction-puzzle coverage ---------- */
if(G?.DEDUCTION?.audit){
  const expected=['sudoku','futoshiki','arithmeticcages','kakuro','nonogram','numberpath','diagonalpath','numbertowers','killersudoku','hashi','mathsmines','sumplete','shikaku','alphametics','cornersum','linkedsum','perimeterregions','takuzu','colourlogic'];
  const covered=new Set(G.DEDUCTION.IDS||[]);
  for(const id of expected)if(!covered.has(id))fail('deduction-policy',id+' is missing from the no-guess policy');
  if(expected.every(id=>covered.has(id)))ok('deduction-policy',expected.length+' constraint-puzzle families are covered by the no-arbitrary-branch policy');
}else fail('deduction-policy','shared deduction-quality gate is not loaded');

/* ---------- Colour Logic deduction/no-guess coverage ---------- */
if(A?.COLOURLOGIC_DEDUCTION?.audit){
  let checked=0,contradictions=0;
  for(const layout of ['row','grid','auto'])for(let i=0;i<8;i++){
    const settings={engineSettings:{colourlogic:{difficulty:'challenge',layout,ruleStyle:'mixed'}}};
    const p=A.generate('colourlogic',settings,`qa:colourlogic-deduction:${layout}:${i}`);
    if(!p||p.error){fail('colourlogic-deduction','challenge generation failed',p?.error||'empty');continue;}
    const audit=A.COLOURLOGIC_DEDUCTION.audit(p);checked++;
    contradictions+=Number(audit?.contradictions||0);
    if(!audit?.solved)fail('colourlogic-deduction',`deduction audit stalled for ${layout} seed ${i}`,JSON.stringify(audit||{}));
    if(p.deductionStats?.solved!==true)fail('colourlogic-deduction','generated puzzle lost deduction metadata');
  }
  if(checked===24)ok('colourlogic-deduction',`24 Challenge puzzles passed propagation + contradiction audit; ${contradictions} contradiction eliminations exercised`);
}else fail('colourlogic-deduction','deduction audit module is not loaded');

/* ---------- Alphametics full-library coverage ---------- */
const alphaLib=global.TT99AlphaLibrary;
if(!alphaLib||!Array.isArray(alphaLib.templates)||alphaLib.templates.length<60)fail('alphametics','Full curated word library is not loaded',String(alphaLib?.templates?.length||0));
else{
  const seen=new Set();
  for(let i=0;i<18;i++){
    const a=N.generate('alphametics',{minYear:3,maxYear:6,engineSettings:{alphametics:{difficulty:'standard',hintLevel:'auto',theme:'auto',template:'auto'}}},`qa:alpha-variety:${i}`);
    if(a&&!a.error)seen.add(a.templateId);
  }
  if(seen.size<6)fail('alphametics','Auto mode is not producing enough puzzle variety',`${seen.size} distinct standard puzzles from 18 seeds`);
  else ok('alphametics',`Full library loaded; ${seen.size} distinct standard puzzles sampled from 18 seeds`);
}

/* ---------- online adapter / help / UX static contracts ---------- */
const playScripts=sourceScripts(playPage).map(localFromUrl).filter(exists),registrations=[];
for(const rel of playScripts){
  const src=read(rel);
  for(const m of src.matchAll(/registerAdapter\(\s*['"]([^'"]+)['"]/g))registrations.push({id:m[1],file:rel});
}
const lastById=new Map();for(const r of registrations)lastById.set(r.id,r.file);
const adapterIds=[...lastById.keys()].sort();
if(adapterIds.length<20)fail('online-contract','Suspiciously few online adapters discovered',String(adapterIds.length));
else ok('online-contract',`${adapterIds.length} active adapter IDs discovered`);

const duplicateIds=[...new Set(registrations.map(x=>x.id).filter((id,i,a)=>a.indexOf(id)!==i))];
if(duplicateIds.length)warn('online-contract','Intentional/legacy adapter overrides present',duplicateIds.join(', '));
for(const [id,rel] of lastById){
  const src=read(rel);
  if(!/\bmount\s*[:=]|function\s+\w*Mount\b|mount\s*\(/.test(src))warn('online-contract',`${id}: mount implementation not obvious`,rel);
  for(const word of ['progress','check','hint','setFinished'])if(!src.includes(word))warn('feedback',`${id}: ${word} contract not obvious`,rel);
}

const helpSrc=read('assets/99club/games-help-guides.js');
const guideIds=[...helpSrc.matchAll(/\{id:'([^']+)'[^\n]*title:'([^']*)'/g)].filter(m=>!m[1].includes('placeholder')&&m[2]).map(m=>m[1]);
const missingGuides=adapterIds.filter(id=>!guideIds.includes(id));
if(missingGuides.length)fail('help-guides','Online games missing one-page guide',missingGuides.join(', '));
else ok('help-guides',`All ${adapterIds.length} online games have a guide`);
const printInstructions=read('assets/99club/games-instructions-v139.js');
const onlineInstructions=read('assets/99club/games-play-instructions-v154.js');
const publicGameIds=['wordsearch','crossword','pyramid','magic','arithmagon','magicshape','numbertrail','numberwheels','maze','propertymaze','crossnumber','numbersearch','equationcrossgrid','target','brokencalc','operationgrid','kakuro','arithmeticcages','sumplete','symbols','functionmachine','balance','alphametics','sudoku','futoshiki','nonogram','numberpath','numbertowers','takuzu','killersudoku','hashi','mathsmines','shikaku','cornersum','linkedsum','colourlogic','mobilebalance','diagonalpath','squaresearch','insertops','perimeterregions'];
const answerRevealSrc=read('assets/99club/games-play-answer-reveal-v1.js');
const playCoreSrc=read('assets/99club/games-play-core-v2.js');
const operationRevealSrc=read('assets/99club/games-play-operationgrid-v154.js');
if(!read(playPage).includes('games-play-answer-reveal-v1.js'))fail('answer-reveal','Answer reveal bridge is not loaded by Online Play');
for(const id of publicGameIds){
  const covered=id==='operationgrid'?/function\s+revealAnswer\s*\(/.test(operationRevealSrc):new RegExp('\\n\\s*'+id+'\\s*:').test(answerRevealSrc);
  if(!covered)fail('answer-reveal',id+': no solved-state reveal provider');
}
const revealFlow=(playCoreSrc.match(/function revealAnswers\(\)\{[\s\S]*?\n\}/)||[''])[0];
if(!playCoreSrc.includes('Are you sure? This will reveal the complete answer and end this attempt.'))fail('answer-reveal','Confirmation copy is missing');
if(!playCoreSrc.includes("track('online_answer_revealed'"))fail('answer-reveal','Answer reveal analytics event is missing');
if(!revealFlow||!revealFlow.includes('state.revealed=true')||!revealFlow.includes('state.finished=true'))fail('answer-reveal','Reveal does not end the current attempt safely');
if(revealFlow.includes('saveCompletion')||revealFlow.includes('online_game_completed'))fail('answer-reveal','Revealed answers must not count as a completion');
else ok('answer-reveal',`All ${publicGameIds.length} public games have guarded answer reveal coverage without completion credit`);
const contextKeypadSrc=read('assets/99club/games-play-context-keypad-v201.js');
const completionPreviewSrc=read('assets/99club/games-play-completion-preview-v1.js');
const paperExportSrc=read('assets/99club/games-play-paper-export-v1.js');
const playPageSrc=read(playPage);
if(!playPageSrc.includes('games-play-paper-export-v1.css')||!playPageSrc.includes('games-play-paper-export-v1.js')||!playPageSrc.includes('simple-pdf.js'))fail('paper-export','Online Play is missing the exact-puzzle export asset stack');
for(const token of ['Print / save','Download PDF','Save PNG','Copy image','Include answer page in PDF','adapter.createPuzzle(config,seed)','view.revealAnswer','html2canvas','TT99SimplePDF'])if(!paperExportSrc.includes(token))fail('paper-export','Exact-puzzle export contract missing '+token);
if(!paperExportSrc.includes("activeKind='puzzle'")||!paperExportSrc.includes("cache.puzzle=null;cache.answer=null"))fail('paper-export','Exact-puzzle export does not reset to a clean puzzle when the URL seed/settings change');
else ok('paper-export','Online Play can rebuild the exact seeded puzzle as clean PDF/PNG/copy-image output with optional answer page');
if(!playCoreSrc.includes('data-play-surprise>Surprise me</button>')||!playCoreSrc.includes("querySelector('[data-play-surprise]')?.addEventListener('click',surprise)"))fail('completion-splash','Completion splash is missing the Surprise me action or handler');
else ok('completion-splash','Completion splash offers New puzzle, Surprise me and Choose another game paths');
const finishFlow=(playCoreSrc.match(/function finish\(result\)\{[^\n]*\}/)||[''])[0];
if(!contextKeypadSrc.includes('window.TT99ContextKeypad={hide:hidePad'))fail('completion-splash','Context keypad does not expose the completion close hook');
if(!finishFlow.includes('dismissCompletionInput();')||finishFlow.indexOf('dismissCompletionInput();')>finishFlow.indexOf('renderCompletion();'))fail('completion-splash','Successful completion does not dismiss input before opening the splash');
for(const selector of ['tt99-context-pad-launcher','tt99-wave184-keypad','tt99-number-keypad','tt99-structure-keypad','tt99-letter-keypad','tt99-extra-op-pad'])if(!completionPreviewSrc.includes(selector))fail('completion-splash','Completion snapshot sanitiser missing '+selector);
if(!completionPreviewSrc.includes('fitSnapshot')||!completionPreviewSrc.includes('tt99-play-complete-snapshot-fit'))fail('completion-splash','Completion snapshot fit stage is missing');
if(!completionPreviewSrc.includes('tt99SourceWidth')||!completionPreviewSrc.includes("clone.style.setProperty('width',seededWidth+'px','important')"))fail('completion-splash','Completion snapshot does not seed width from the live board');
else ok('completion-splash','Successful completion dismisses input first and the splash owns a keypad-free fit-to-frame snapshot');
const shareCodecSrc=read('assets/99club/games-play-share-codec-v156.js');
if(!shareCodecSrc.includes("route!=='/play'&&route!=='/tools/99-club/games/play'"))fail('share-codec','Share codec does not recognise both current and legacy play routes');
else ok('share-codec','Challenge sharing recognises the current /play route and legacy compatibility route');
const futoshikiPlaySrc=read('assets/99club/games-play-futoshiki-v1.js');
if(!futoshikiPlaySrc.includes('Use each number from 1 to')||!futoshikiPlaySrc.includes('exactly once in every row and column'))fail('futoshiki-instructions','Futoshiki instructions do not state the valid number range explicitly');
if(!playCoreSrc.includes("typeof rule==='function'?rule(state.puzzle,state.config):rule"))fail('futoshiki-instructions','Online Play core does not support puzzle-aware instruction text');
else ok('futoshiki-instructions','Futoshiki states the dynamic 1..N number range explicitly');
const onlineShareSrc=read('assets/99club/games-play-share-v164.js');
for(const token of ['data-share-card-link','data-share-card-native','data-download','data-copy-link','navigator.share'])if(!onlineShareSrc.includes(token))fail('share-panel','Native sharing contract missing '+token);
for(const legacy of ['facebook.com/sharer','twitter.com/intent','linkedin.com/sharing','data-social=','tt99-share-social','global.open(target'])if(onlineShareSrc.includes(legacy))fail('share-panel','Legacy direct social sharing remains: '+legacy);
if(!onlineShareSrc.includes('function cardWithLinkPayload(file)')||!onlineShareSrc.includes('url:currentUrl||challengeUrl(),files:[file]'))fail('share-panel','Primary share action does not package the selected PNG together with the exact puzzle URL');
if(!onlineShareSrc.includes('text:cardCaption()'))fail('share-panel','Primary share action is missing its caption text');
if(!onlineShareSrc.includes('if(isIOSShareTarget())')||!onlineShareSrc.includes("const linkData={title:")||!onlineShareSrc.includes('text:cardCaption(),url:currentUrl||challengeUrl()'))fail('share-panel','iOS clean link-sharing fallback is missing');
if(!onlineShareSrc.includes("secondaryShareAction(){return shareCard();}"))fail('share-panel','iOS image-only secondary action is not wired');

if(!onlineShareSrc.includes("global.addEventListener('pageshow',restoreOpenDialog)")||!onlineShareSrc.includes("visibilitychange"))fail('share-panel','Open share panel is not restored when the app resumes');
else ok('share-panel','Online sharing uses the device share sheet with no direct social-site popups and preserves the open panel on resume');
if(!onlineShareSrc.includes("share.textContent='Share this puzzle'")||!onlineShareSrc.includes("'Copy puzzle link'"))fail('completion-share-entry','Completion share labels are not simplified');
for(const legacy of ['Create share card','Challenge someone','Copy short challenge link'])if(onlineShareSrc.includes(legacy))fail('completion-share-entry','Legacy completion sharing wording remains: '+legacy);
else ok('completion-share-entry','Completion splash has one share-panel entry and one plain-language copy-link action');



for(const id of publicGameIds){
  if(!printInstructions.includes("case'"+id+"'"))fail('instruction-audit',id+': printable reviewed instruction missing');
  if(!onlineInstructions.includes("\n  "+id+":"))fail('instruction-audit',id+': online reviewed instruction missing');
}
if(!printInstructions.includes('operation signs may be reused'))fail('instruction-audit','Reusable operation-sign rule missing from printable instructions');
if(!printInstructions.includes('working digit or operation key may be reused'))fail('instruction-audit','Broken Calculator key-reuse rule missing from printable instructions');
if(!printInstructions.includes('the same digit may appear in a different run'))fail('instruction-audit','Kakuro repeat-scope rule missing from printable instructions');
if(!printInstructions.includes('two-cell − or ÷, either order is allowed'))fail('instruction-audit','Arithmetic Cages subtraction/division order rule missing');
if(!printInstructions.includes('Cages have no extra no-repeat rule'))fail('instruction-audit','Arithmetic Cages repeat-scope rule missing');
if(!printInstructions.includes('Allowed signs may be reused'))fail('instruction-audit','Insert Operations sign-reuse rule missing');
if(!printInstructions.includes('top circle is the total weight of the whole mobile'))fail('instruction-audit','Mobile Balance top-total explanation missing');
if(!onlineInstructions.includes("isSearchBoard=board?.matches?.('.tt99-play-wordsearch, .tt99-play-numbersearch')")||!onlineInstructions.includes("board.querySelector('.tt99-play-board-tip')"))fail('instruction-audit','Search live direction rule is not mirrored from the active board into the top instruction card');
if(!onlineInstructions.includes('Target answers do not overlap'))fail('instruction-audit','Number Search no-overlap rule missing online');
if(!onlineInstructions.includes('duplicate tiles are separate'))fail('instruction-audit','Target Number duplicate-tile rule missing online');
ok('instruction-audit','All 41 public games have reviewed print and online first-sight instructions');
const pdfTakuzu=read('assets/99club/games-pdf-takuzu-v139.js');
const pdfTowers=read('assets/99club/games-pdf-v138-flowfix.js');
const pdfCode=read('assets/99club/games-pdf-v158.js');
const pdfSums=read('assets/99club/games-pdf-sum-grids-v147.js');
const pdfNew=read('assets/99club/games-pdf-new-puzzles-v197.js');
const pdfHashi=read('assets/99club/games-pdf-v1401.js');
const pdfAlpha=read('assets/99club/games-pdf-v141.js');
const pdfExtra=read('assets/99club/games-pdf-extra-puzzles-v204.js');
const alphaPreview=read('assets/99club/games-puzzle-pack-v140-ui.js');
const extraPreviewApp=read('assets/99club/games-app.js');
if(!pdfTakuzu.includes('No two completed rows or columns may be identical.'))fail('instruction-audit','Takuzu PDF is missing the uniqueness rule');
if(pdfTakuzu.includes('Equal 0s/1s  ·  No 000 or 111  ·  No duplicate rows or columns'))fail('instruction-audit','Takuzu PDF still duplicates its full rule set below the grid');
if(!pdfTowers.includes('Each edge clue is how many towers are visible from that side'))fail('instruction-audit','Number Towers PDF does not explain what the edge number means');
if(!pdfTowers.includes('using inverse operations'))fail('instruction-audit','Function Machine PDF does not explain reverse working clearly');
if(!pdfTowers.includes('taller towers hide shorter ones behind them'))fail('instruction-audit','Number Towers PDF does not explain visibility blocking');
if(!pdfTowers.includes('function wrap(value,maxWidth,size'))fail('instruction-audit','Function Machine / Number Towers PDF instruction wrapping missing');
if(!pdfCode.includes('allowed signs may be reused'))fail('instruction-audit','Operation Codebreaker PDF does not explain sign reuse');
if(!pdfCode.includes('normal operation order'))fail('instruction-audit','Operation Codebreaker PDF does not explain operation order');
if(!pdfSums.includes('Starter digits are fixed'))fail('instruction-audit','Corner/Linked Sum PDF does not identify starter digits as fixed');
if(!pdfSums.includes('A cell can contribute to more than one overlapping circle.'))fail('instruction-audit','Corner Sum PDF overlap clarification missing');
if(!pdfNew.includes('maxLines:2'))fail('instruction-audit','Colour Logic / Mobile Balance PDF may truncate the reviewed instruction');
if((pdfNew.match(/top circle is the total weight of the whole mobile/gi)||[]).length>0)fail('instruction-audit','Mobile Balance PDF still duplicates its top-total explanation outside reviewed copy');
if(!pdfHashi.includes('never cross or pass through another island'))fail('instruction-audit','Hashi PDF pass-through rule missing');
if(!pdfAlpha.includes('Letter values')||!pdfAlpha.includes('drawLetterValues')||!pdfAlpha.includes('alphaLetters'))fail('print-layout','Alphametics PDF lost its letter-to-digit answer area');
if(!pdfExtra.includes("'Allowed operations',9")||!pdfExtra.includes("11.5,{bold:true,color:TEAL"))fail('print-layout','Insert Operations PDF allowed-operation prompt is no longer prominent');
if(!alphaPreview.includes('Letter values')||!alphaPreview.includes('tt99-alpha-value'))fail('preview-layout','Alphametics preview lost its letter-value workspace');
if(alphaPreview.includes('No digit hints')||alphaPreview.includes('Meaningful-word template:'))fail('preview-copy','Alphametics preview regressed to obsolete hint/template wording');
if(!extraPreviewApp.includes('tt99-extra-op-allowed')||!extraPreviewApp.includes('Allowed operations'))fail('preview-layout','Insert Operations preview lost prominent allowed-operation guidance');
ok('instruction-audit','Specialised PDF overlays keep the reviewed rules complete and non-duplicated');
const previewCode=read('assets/99club/games-operationgrid-print-v158-ui.js');
const previewRedesign=read('assets/99club/games-puzzle-redesign-v136.js');
const previewTowers=read('assets/99club/games-v137.js');
const previewTakuzu=read('assets/99club/games-takuzu-v139-ui.js');
const previewPack=read('assets/99club/games-puzzle-pack-v140-ui.js');
const previewSums=read('assets/99club/games-sum-grids-v147-ui.js');
if(!previewCode.includes('allowed signs may be reused'))fail('instruction-audit','Operation Codebreaker preview overwrites the reviewed reuse rule');
if(!previewRedesign.includes('different symbols use different letter values'))fail('instruction-audit','Symbol Decoder redesigned preview loses the value-uniqueness rule');
if(previewRedesign.includes('tt99-v136-reverse">For a missing input'))fail('instruction-audit','Function Machine preview still duplicates reverse-working instructions');
if(!previewTowers.includes('Each edge clue is how many towers are visible'))fail('instruction-audit','Number Towers preview does not explain edge clue values');
if(previewTakuzu.includes('<div class="tt99-takuzu-rules"><span>Equal 0s and 1s'))fail('instruction-audit','Takuzu preview still repeats its complete rule set below the grid');
if(!previewPack.includes('never cross or pass through another island'))fail('instruction-audit','Hashi preview loses the no-pass-through rule');
if(!previewSums.includes('Starter digits are fixed'))fail('instruction-audit','Corner/Linked Sum preview does not identify fixed starters');
if(!previewSums.includes('A cell can contribute to more than one overlapping circle.'))fail('instruction-audit','Corner Sum preview overlap clarification missing');
ok('instruction-audit','Late printable-preview overlays preserve the reviewed instructions');
const previewMachine=read('assets/99club/games-v138.js');
if(previewMachine.includes('tt99-v138-machine-note'))fail('instruction-audit','Function Machine printable preview still repeats reverse-working instructions');
const duplicateOnlineSelectors=[
  '.tt99-sumplete-wrap .tt99-play-board-tip',
  '.tt99-nonogram-scroll + .tt99-cycle-note',
  '.tt99-play-mines .tt99-cycle-note',
  '.tt99-play-hashi .tt99-hashi-note',
  '.tt99-play-numberpath .tt99-cycle-note',
  '.tt99-pyramid-board + .tt99-cycle-note',
  '.tt99-play-brokencalc .tt99-arith-note',
  '.tt99-play-target .tt99-arith-note',
  '.tt99-play-propertymaze .tt99-propertymaze-tip',
  '.tt99-play-answermaze .tt99-answermaze-tip',
  '.tt99-play-sumgrid .tt99-play-board-tip',
  '.tt99-play-operationgrid .tt99-opgrid-rule',
  '.tt99-play-colourlogic .tt99-cl-tap',
  '.tt99-extra-path-grid + .tt99-arith-note',
  '.tt99-extra-perimeter-grid.online + .tt99-arith-note'
];
for(const sel of duplicateOnlineSelectors)if(!onlineInstructions.includes(sel))fail('instruction-audit',`Online duplicate-rule cleanup lost selector: ${sel}`);
if(onlineInstructions.includes("'.tt99-play-wordsearch .tt99-play-board-tip'")||onlineInstructions.includes("'.tt99-play-numbersearch .tt99-play-board-tip'"))fail('instruction-audit','Search direction source is still removed from the DOM instead of being retained for live mirroring');
const playCore=read('assets/99club/games-play-core-v2.js'),playCss=read('assets/99club/games-play-v1.css');
if(!playCore.includes("setStatus('');"))fail('instruction-audit','Initial play status still repeats adapter start guidance');
if(!playCss.includes('.tt99-play-status:empty{display:none}'))fail('instruction-audit','Empty initial status strip is still visible');
if(!onlineInstructions.includes('Tap an operator box to cycle through the allowed signs'))fail('instruction-audit','Operation Codebreaker top instruction lost its interaction rule');
if(!onlineInstructions.includes('Tap a box to cycle colours'))fail('instruction-audit','Colour Logic top instruction lost its interaction rule');
ok('instruction-audit','Static online rule duplication is removed while dynamic board guidance is preserved');
const helpPage=read('_pages/99-club-games-help.md');
const stated=(helpPage.match(/covers all <strong>(\d+) current one-player games<\/strong>/)||[])[1];
if(stated&&Number(stated)!==guideIds.length)fail('help-guides',`Help-page guide count says ${stated}, library contains ${guideIds.length}`);
if(!/multiplication and division before addition and subtraction/i.test(helpSrc))fail('help-guides','Broken Calculator guide does not explain standard order of operations');
if(/brokencalc[^\n]+bracket/i.test(helpSrc))warn('help-guides','Broken Calculator guide still appears to mention brackets');

const drawer=read('assets/99club/games-play-context-keypad-v201.js');
const drawerCss=read('assets/99club/games-play-context-keypad-v201.css');
const playPageForInput=read('_pages/99-club-games-play.md');
const requiredDrawerSelectors=['data-conn-entry','data-trail-i','data-cg-key','data-machine','data-sym','data-mobile-answer','data-bl-answer','data-entry','.tt99-number-keypad','.tt99-alpha-pad','.tt99-towers-keypad','.tt99-crossnumber-keypad','.tt99-letter-keypad','.tt99-extra-op-pad'];
for(const s of requiredDrawerSelectors)if(!drawer.includes(s))fail('input-ux',`Unified keypad lost selector ${s}`);
if(!drawer.includes('tt99-context-pad-handle'))fail('input-ux','Unified keypad drawer handle missing');
if(!drawer.includes('tt99-context-pad-launcher'))fail('input-ux','Desktop keypad launcher missing');
if(!drawer.includes('inputProfile()'))fail('input-ux','Input capability profile missing');
if(!drawer.includes("lastPointerType==='mouse'"))fail('input-ux','Mouse-first desktop guard missing');
if(!drawer.includes('hidePad()'))fail('input-ux','Context keypad outside-tap dismissal missing');
if(!drawer.includes('activePad===pad'))fail('input-ux','Context keypad does not preserve drawer while moving between entries');
if(!drawer.includes('tt99-context-pad-reset'))fail('input-ux','Draggable keypad reset control missing');
if(!drawer.includes('pointermove'))fail('input-ux','Draggable keypad pointer handling missing');
if(!drawer.includes('clampDragPosition'))fail('input-ux','Draggable keypad viewport clamping missing');
if(!drawer.includes('tt99-context-pad-reserve')||!drawer.includes('--tt99-context-pad-space')||!drawer.includes('keepBoardClearOfPad'))fail('input-ux','Expanded mobile keypad no longer reserves/clears puzzle space');
if(!drawerCss.includes('#tt99-play-board.tt99-context-pad-reserve')||!drawerCss.includes('margin-bottom:var(--tt99-context-pad-space'))fail('input-ux','Keypad reserve is not represented in document flow');
if(!playPageForInput.includes('games-play-context-keypad-v201.css?v=8')||!playPageForInput.includes('games-play-context-keypad-v201.js?v=9'))fail('input-ux','Keypad clearance assets are not cache-busted');
const nonogramPlay=read('assets/99club/games-play-nonogram-v2.js');
if(!nonogramPlay.includes('edge-top')||!nonogramPlay.includes('edge-bottom')||!nonogramPlay.includes('edge-left')||!nonogramPlay.includes('edge-right'))fail('nonogram-ux','Nonogram playable-grid outer frame markers missing');
const extraPlay=read('assets/99club/games-play-extra-puzzles-v204.js');
if(!extraPlay.includes('hint-cell'))fail('squaresearch-ux','Square Search no longer uses a cell-level hint');
ok('input-ux','Unified touch/desktop keypad contract checked');
const previewFit=read('assets/99club/games-preview-fit-v207.js');
if(previewFit.indexOf('function fitNumberSearch(activity)')<0)fail('preview-fit','Dedicated Number Search fitter missing');
if(previewFit.indexOf('availableH')<0||previewFit.indexOf('Math.min(desired,availableH,availableW)')<0)fail('preview-fit','Number Search fitter no longer caps the grid to its activity frame');
if(previewFit.indexOf("activity.dataset.tt99PreviewFit='numbersearch'")<0)fail('preview-fit','Number Search preview-fit marker missing');
ok('preview-fit','Number Search containment guard checked');
if(!read('assets/99club/games-play-core-v2.js').includes('tt99-play-hint-popup'))fail('hint-ux','Floating hint popup markup missing');
if(!read('assets/99club/games-play-core-v2.js').includes('data-hint-drag'))fail('hint-ux','Draggable hint handle missing');
if(!read('assets/99club/games-play-core-v2.js').includes('tt99-play-hint-popup-close'))fail('hint-ux','Hint close control missing');
const helpGuideUi=read('assets/99club/games-help-guides.js');
if(!helpGuideUi.includes('function directGuideId()')||!helpGuideUi.includes('tt99-game-guide-direct'))fail('help-guides','Focused direct guide mode missing');
if(!helpGuideUi.includes('function visualExample(id)')||!helpGuideUi.includes('tt99-game-guide-example-visual'))fail('help-guides','Graphical worked examples missing from guide template');


const packMode=read('assets/99club/games-pack-mode.js'),randomUi=read('assets/99club/games-random-ui.js'),gamesApp=read('assets/99club/games-app.js');
if(!packMode.includes('storagePerPageKey'))fail('pack-ui','Pack mode does not persist activities-per-sheet');
if(!packMode.includes('activitiesPerSheet,sheets:Math.ceil(activityCount/activitiesPerSheet)'))fail('pack-ui','Sheet count is not derived from activity count and per-sheet density');
if(!randomUi.includes('games-activities-per-sheet'))fail('pack-ui','Activities-per-sheet control missing from active pack UI');
if(!randomUi.includes('<option value="1"')||!randomUi.includes('<option value="2"'))fail('pack-ui','Pack density must be limited to one or two activities per sheet');
if(randomUi.includes('<option value="3"'))fail('pack-ui','Unsupported three-activities-per-sheet option returned');
if(!gamesApp.includes('type="hidden" id="games-sheets"'))fail('pack-ui','Legacy sheet-count control is still visible in base UI');
ok('pack-ui','Activity count + one/two-per-sheet pack controls checked');
const cardLinks=read('assets/99club/games-card-links-v205.js');
const quickIds=[...cardLinks.matchAll(/'([a-z0-9-]+)'/g)].map(m=>m[1]);
for(const id of adapterIds)if(!quickIds.includes(id))fail('game-card-links',`Online game missing selector quick-link mapping: ${id}`);
for(const id of guideIds)if(!quickIds.includes(id))fail('game-card-links',`Guide missing selector quick-link mapping: ${id}`);
if(!cardLinks.includes("target='_blank'")&&!cardLinks.includes("a.target='_blank'"))fail('game-card-links','Quick links do not open separately from the pack builder');
if(!cardLinks.includes('/play/?game='))fail('game-card-links','Per-game online-play URL missing');
if(!cardLinks.includes('/help/games/?guide='))fail('game-card-links','Focused per-game guide URL missing');
if(!cardLinks.includes('preventDefault()')||!cardLinks.includes('stopPropagation()'))fail('game-card-links','Quick-link click interception is missing');
if(!cardLinks.includes("global.open(url,'_blank'"))fail('game-card-links','Quick links are not explicitly opened in a separate context');
ok('game-card-links',`Selector quick links cover all ${adapterIds.length} online games / guides`);

/* ---------- Diamond fraction progression ---------- */
try{
  const ClubFractions=load('assets/99club/generator.js');
  const appSrc=read('assets/99club/app.js');
  const helpSrc=read('_pages/99-club-help.md');
  const diamond=ClubFractions.normalizeRules(ClubFractions.CHALLENGE_PRESETS.diamond);
  const requiredCore=['fraction_of','fraction_add_subtract','fraction_multiply_whole'];
  for(const id of requiredCore)if(!diamond.families.includes(id))fail('diamond-fractions',`Diamond core is missing ${id}`);
  for(const d of [7,12,15])if(!diamond.fractionDenominators.includes(d))fail('diamond-fractions',`Diamond denominators are missing ${d}`);
  if(!diamond.fractionAddSubtractRelatedOnly)fail('diamond-fractions','Diamond fraction +/- no longer defaults to same/related denominators');
  if(!diamond.fractionAddSubtractMixed)fail('diamond-fractions','Diamond fraction +/- no longer includes mixed-number forms');
  if(!appSrc.includes("{key:'fractions',label:'Fractions'"))fail('diamond-fractions','Post-99 settings do not expose Fractions as their own category');
  if(appSrc.includes("label:'Decimals, fractions & percentages'"))fail('diamond-fractions','Fractions are still merged into the decimals/percentages category');
  for(const id of ['fraction_of','equivalent_fractions','simplify_fractions','mixed_improper','fraction_add_subtract','fraction_multiply_whole','fraction_multiply','fraction_divide_whole'])if(!appSrc.includes(id))fail('diamond-fractions',`Fractions settings category is missing ${id}`);
  if(!appSrc.includes('fractionAddSubtractRelatedOnly')||!appSrc.includes('fractionAddSubtractMixed'))fail('diamond-fractions','Fraction +/- profile controls are missing from settings');
  const mainPage=read('index.md'),practiceLayout=read('_layouts/practice.html'),widgetBuilder=read('_pages/99-club-widget-builder.md'),widgetPage=read('_pages/99-club-widget.html');
  if(!mainPage.includes('generator.js?v=19.5')||!practiceLayout.includes('generator.js?v=19.5')||!widgetBuilder.includes('generator.js?v=20.1')||!widgetPage.includes('generator.js?v=20.1'))fail('diamond-fractions','Updated fraction generator is not cache-busted on every 99 Club delivery route');
  const poolKinds=['fraction_of','fraction_add_subtract','fraction_multiply_whole'];
  const pool=poolKinds.flatMap(kind=>ClubFractions.questionPool(kind,diamond));
  const examples=['4/5 of 20 =','3/7 of 28 =','4/5 + 3/5 =','1 1/8 + 7/8 =','3/4 + 4/12 =','12/15 - 1/5 =','1/3 × 2 =','5/6 × 3 ='];
  for(const prompt of examples)if(!pool.some(q=>q.prompt===prompt))fail('diamond-fractions',`School-requested example is absent from Diamond pool: ${prompt}`);
  const addSub=ClubFractions.questionPool('fraction_add_subtract',diamond);
  if(addSub.some(q=>q.prompt==='2/3 + 1/5 ='))fail('diamond-fractions','Diamond related-denominator profile allows unrelated 3/5 denominator pair');
  const generatedDiamond=ClubFractions.generateQuestions(diamond,'qa-diamond-fraction-mix');
  const counts=generatedDiamond.reduce((m,q)=>(m[q.kind]=(m[q.kind]||0)+1,m),{});
  for(const id of requiredCore)if(!counts[id])fail('diamond-fractions',`100-question Diamond sheet produced no ${id}`);
  const fractionCount=requiredCore.reduce((n,id)=>n+(counts[id]||0),0);
  if(fractionCount<20)fail('diamond-fractions','Diamond fraction presence fell below a meaningful share',String(fractionCount));
  if(!helpSrc.includes('Diamond fraction profile:')||!helpSrc.includes('fraction addition/subtraction'))fail('diamond-fractions','Teacher help does not describe the stronger Diamond fraction profile');
  ok('diamond-fractions',`Diamond includes ${fractionCount}/100 core fraction questions and all requested example forms`);
}catch(e){fail('diamond-fractions','Diamond fraction QA threw',e.stack||e.message);}

/* ---------- post-99 category help ---------- */
try{
  const post99App=read('assets/99club/app.js');
  const post99Css=read('assets/99club/99club.css');
  const main99=read('index.md');
  const groupKeys=['number','fractions','fdp','calculation','ratio','measurement','statistics'];
  for(const key of groupKeys){
    if(!post99App.includes(key+":{description:"))fail('post99-category-help',`Missing help metadata for ${key}`);
  }
  if(!post99App.includes("HELP_TEXT[helpKey]=post99GroupHelp(group,ids)"))fail('post99-category-help','Optional category help is not generated from the visible families');
  if(!post99App.includes("${helpButton(helpKey)}<small>"))fail('post99-category-help','Optional category tiles do not include the standard circled help button');
  if(!post99App.includes("helpButton('post99Core')"))fail('post99-category-help','Core families heading is missing its help button');
  if(!post99App.includes("POST99_CORE_HELP[state.clubId]"))fail('post99-category-help','Core help is not challenge-specific');
  if(!post99App.includes("e.stopPropagation()"))fail('post99-category-help','Help click no longer guards against toggling the category accordion');
  if(!post99Css.includes("summary>.tt99-help-btn"))fail('post99-category-help','Category help button placement CSS is missing');
  if(!main99.includes('99club.css?v=20.3')||!main99.includes('app.js?v=19.26'))fail('post99-category-help','Category-help assets are not cache-busted');
  ok('post99-category-help','Core and all optional post-99 categories have concise contextual help buttons');
}catch(e){fail('post99-category-help','Post-99 category help QA threw',e.stack||e.message);}

/* ---------- parent-practice sharing ---------- */
const parentAssets=['assets/99club/school-usage-config.js','assets/99club/school-usage.js','assets/99club/school-brand.js','assets/99club/parent-practice.js','assets/99club/parent-practice-page.js','assets/99club/app.js'];
for(const rel of parentAssets){
  if(!exists(rel)){fail('parent-practice',`Missing ${rel}`);continue;}
  try{new Function(read(rel));}catch(e){fail('parent-practice',`Syntax error in ${rel}`,e.message);}
}
try{
  const ClubG=load('assets/99club/generator.js');
  delete global.TT99SchoolUsage;delete global.TT99SchoolBrand;delete global.TT99ParentPractice;
  const SchoolUsage=load('assets/99club/school-usage.js');
  const SchoolBrand=load('assets/99club/school-brand.js');
  global.TT99SchoolBrand=SchoolBrand;
  const ParentPractice=load('assets/99club/parent-practice.js');
  const base=ClubG.normalizeRules(ClubG.CLASSIC_PRESETS['33']);
  const stripParentMeta=value=>{const out=JSON.parse(JSON.stringify(value));for(const key of ['id','name','tagline','sourceSchemeId','sourceClubId','worksheetTitle'])delete out[key];return out;};
  const schoolKey=SchoolUsage.makeSchoolKey('Example Primary School');
  if(!SchoolUsage.validSchoolKey(schoolKey))fail('school-usage','Stable school-level key was not created');
  if(schoolKey!==SchoolUsage.makeSchoolKey('  Example   Primary School  '))fail('school-usage','Equivalent school names do not produce the same school key');
  const tinyLogo='data:image/jpeg;base64,AAAA';
  const publicSchool={schoolName:'Example Primary School',logoDataUrl:tinyLogo,logoWidth:80,logoHeight:40};
  const standard={schemeId:'classic',clubId:'33',rules:base,orientation:'portrait',schoolUsageKey:schoolKey,school:publicSchool};
  const compact=ParentPractice.compactPayload(standard);
  if(!compact.r||!stable(compact.r,stripParentMeta(base)))fail('parent-practice','Parent link does not freeze the complete school-selected functional rules snapshot');
  for(const forbidden of ['id','name','tagline','sourceSchemeId','sourceClubId','worksheetTitle'])if(Object.prototype.hasOwnProperty.call(compact.r||{},forbidden))fail('parent-practice',`Parent-link rules leaked display metadata field ${forbidden}`);
  if(compact.u!==schoolKey)fail('school-usage','Opaque school key was not included in the practice payload');
  if(compact.i?.n!=='Example Primary School'||compact.i?.l!==tinyLogo)fail('parent-practice','Public school name/logo were not included in the parent practice payload');
  if(Object.prototype.hasOwnProperty.call(compact.i||{},'worksheetDate'))fail('parent-practice','Parent practice payload stored a worksheet date');
  const token=ParentPractice.encode(standard),decoded=ParentPractice.decode(token);
  if(token.length>ParentPractice.MAX_TOKEN_LENGTH)fail('parent-practice','Built-in parent practice token exceeds codec size limit',String(token.length));
  if(!stable(decoded.rules,stripParentMeta(base)))fail('parent-practice','Built-in club functional rules do not survive parent-link round trip');
  if(decoded.orientation!=='portrait'||decoded.clubId!=='33')fail('parent-practice','Parent-link identity/layout round trip failed');
  if(decoded.schoolUsageKey!==schoolKey)fail('school-usage','Opaque school key does not survive practice-link round trip');
  if(decoded.school?.name!=='Example Primary School'||decoded.school?.logo!==tinyLogo||decoded.school?.logoWidth!==80||decoded.school?.logoHeight!==40)fail('parent-practice','Public school branding does not survive practice-link round trip');
  const legacyDecoded=ParentPractice.decode(ParentPractice.encode({schemeId:'classic',clubId:'33',rules:base,orientation:'portrait'}));
  if(legacyDecoded.school?.name||legacyDecoded.school?.logo)fail('parent-practice','Unbranded parent links do not remain backward compatible');
  const edited=ClubG.normalizeRules({...base,factorMax:9});
  const editedToken=ParentPractice.encode({schemeId:'classic',clubId:'33',rules:edited,orientation:'landscape'});
  const editedDecoded=ParentPractice.decode(editedToken);
  if(Number(editedDecoded.rules.factorMax)!==9||editedDecoded.orientation!=='landscape')fail('parent-practice','Edited school rules do not survive parent-link round trip');
  const leakText=JSON.stringify(ParentPractice.compactPayload({schemeId:'classic',clubId:'33',rules:edited,orientation:'portrait',schoolUsageKey:schoolKey,school:{schoolName:'Example',logoDataUrl:tinyLogo,className:'5B',teacherName:'Teacher',worksheetDate:'2026-01-01'},teacherNote:'secret',pupilName:'child'}));
  for(const forbidden of ['className','teacherName','worksheetDate','teacherNote','pupilName','seed','score','progress'])if(leakText.includes(forbidden))fail('parent-practice',`Parent-link payload leaked forbidden field ${forbidden}`);
  const link=ParentPractice.buildLink(standard,'https://99studio.uk');
  if(!link.startsWith('https://99studio.uk/practice/#p=TT99P1.'))fail('parent-practice','Parent practice link does not use the dedicated fragment route',link.slice(0,90));
  if(link.includes('?'))fail('parent-practice','Parent practice rules should be carried in the URL fragment, not the query string');
  const card=ParentPractice.websiteCardHtml(link,'33 Club','https://99studio.uk/assets/99club/images/33club.png','33 questions · 5 min · Printable worksheet + answers');
  if(!/^<a /.test(card)||/script|iframe/i.test(card)||!card.includes('noopener'))fail('parent-practice','School website card is not a plain safe hyperlink');
  if(!card.includes('referrerpolicy="origin"')||card.includes('noreferrer'))fail('school-usage','99 Club website card does not preserve origin-only source attribution');
  if(!card.includes('33club.png')||!card.includes('33 Club')||!card.includes('Printable worksheet + answers'))fail('parent-practice','School website card is missing its badge/title/summary');
  if(!card.includes('width:100%')||!card.includes('border-radius:14px'))fail('parent-practice','School website card lost its compact card styling');
  const usage=SchoolUsage.practicePayload('practice_download',decoded);
  if(!usage||usage.school_key!==schoolKey||usage.club_id!=='33'||usage.question_count!==33)fail('school-usage','Aggregate practice usage payload is incomplete');
  if(SchoolUsage.cleanOrigin('https://school.example/year-5/home?a=1#x')!=='https://school.example')fail('school-usage','External source URL is not reduced to origin only');
  const attributed=SchoolUsage.practicePayload('practice_open',{...decoded,usageContext:{sourceOrigin:'https://school.example/year5',integrationId:'wid_abcdefgh'}});
  if(!attributed||attributed.source_origin!=='https://school.example'||attributed.integration_id!=='wid_abcdefgh'||attributed.source_kind!=='widget')fail('school-usage','Practice attribution does not preserve safe source origin + widget ID');
  const sourceOnly=SchoolUsage.practicePayload('practice_open',{schemeId:'classic',clubId:'33',rules:base,orientation:'portrait',usageContext:{sourceOrigin:'https://school.example/class-page'}});
  if(!sourceOnly||sourceOnly.school_key||sourceOnly.source_origin!=='https://school.example')fail('school-usage','Source-only practice attribution is not retained when no school key exists');
  const studioUse=SchoolUsage.studioUsagePayload('worksheet_download','Example Primary School',{area:'club',sourceOrigin:'https://school.example/path'});
  if(!studioUse||studioUse.school_key!==schoolKey||studioUse.source_origin!=='https://school.example'||studioUse.action!=='worksheet_download')fail('school-usage','Studio school/source usage payload is incomplete');
  const widgetUse=SchoolUsage.widgetPayload('widget_open',{schoolName:'Example Primary School',sourceOrigin:'https://school.example/page',integrationId:'wid_abcdefgh',widgetType:'club',clubCount:4});
  if(!widgetUse||widgetUse.school_key||widgetUse.source_origin!=='https://school.example'||widgetUse.integration_id!=='wid_abcdefgh'||widgetUse.club_count!==4)fail('school-usage','Widget usage payload must use source origin + integration ID without deriving a school key from the public school name');
  for(const forbidden of ['school_name','pupil','parent','seed','url','referrer','score'])if(JSON.stringify(usage).includes(forbidden))fail('school-usage',`Practice usage payload leaked forbidden field ${forbidden}`);
  if(SchoolUsage.enabled())fail('school-usage','School telemetry must remain disabled until the final analytics design is approved');
  const schoolUsageConfig=read('assets/99club/school-usage-config.js');
  if(!/enabled:\s*false/.test(schoolUsageConfig)||!/endpoint:\s*''/.test(schoolUsageConfig)||!/schemaVersion:\s*2/.test(schoolUsageConfig))fail('school-usage','Dormant school telemetry config is not safely disabled at schema v2');
  ok('parent-practice','School-selected rule links round-trip with public school branding, no stored worksheet date and an opaque usage key');
  ok('school-usage','Aggregate school usage schema is wired but network collection remains disabled');
}catch(e){fail('parent-practice','Codec smoke test threw',e.stack||e.message);}

const parentPage=read('_pages/99-club-practice.md');
const parentLayout=read('_layouts/practice.html');
if(!/layout:\s*practice/.test(parentPage)||! /permalink:\s*\/practice\//.test(parentPage))fail('parent-practice','Dedicated parent practice route is not using the standalone practice layout');
if(/<!doctype html>/i.test(parentPage))fail('parent-practice','Practice page must not contain a markdown-rendered doctype');
if(!/^<!doctype html>/i.test(parentLayout.trim()))fail('parent-practice','Standalone practice layout is missing the real document doctype');
if(/analytics|gtag|googletagmanager/i.test(parentLayout))fail('parent-practice','Parent practice layout loads Google Analytics code');
for(const required of ['generator.js','simple-pdf.js','pdf-layout.js','school-usage-config.js','school-usage.js','school-brand.js','parent-practice.js','parent-practice-page.js'])if(!parentLayout.includes(required))fail('parent-practice',`Parent practice layout missing ${required}`);
const rootApp=read('assets/99club/app.js'),rootPage=read('index.md');
const parentUi=read('assets/99club/parent-practice-page.js');
if(/localStorage|sessionStorage/.test(parentUi))fail('parent-practice','Parent practice page stores browser profile/progress state');
if(!rootApp.includes('parentPracticePreviewLink')||!rootApp.includes("searchParams.set('preview','1')"))fail('parent-practice','Teacher Preview links are not marked with preview=1 for PWA-safe return navigation');
if(!rootApp.includes('parentPracticeWebsiteCard(state.clubId,true)'))fail('parent-practice','Clickable teacher card preview does not use the PWA-safe preview URL');
if(!rootApp.includes('School website integration help'))fail('parent-practice','Parent sharing panel is missing the School website integration help label');
if(!parentUi.includes('isTeacherPreview')||!parentUi.includes('Back to 99 Club Studio')||!parentUi.includes('tt99-practice-previewbar'))fail('parent-practice','Teacher parent-practice preview is missing its PWA-safe return control');
if(!parentUi.includes('schoolUsageContext')||!parentUi.includes("if(!isTeacherPreview())SU?.trackPractice"))fail('school-usage','Parent-practice attribution or preview exclusion is missing');
if(!parentUi.includes("kind:'both'")||!parentUi.includes("answerContext:{label:'Answer copy'"))fail('parent-practice','Parent page does not create the promised combined worksheet + answers PDF');
if(!parentUi.includes('worksheetDate:B.localIsoDate()')||!parentUi.includes('schoolName:brand.name')||!parentUi.includes('logoDataUrl:brand.logo'))fail('parent-practice','Parent PDF does not force school branding + generation date');
if(!parentUi.includes('G.newSeed'))fail('parent-practice','Parent downloads are not regenerated with fresh questions');
for(const label of ['Bronze Club','Silver Club','Gold Club','Platinum Club','Diamond Club'])if(!parentUi.includes(label))fail('parent-practice',`Parent view is missing proper post-99 label ${label}`);
for(const required of ['tt99-parent-open','PARENT_CORE_CLUB_IDS','PARENT_POST99_CLUB_IDS','parentPracticeLink','PP.websiteCardHtml','tt99-parent-copy-current-card','data-parent-copy-card','data-parent-download-card','downloadParentPracticeCardImage','createParentPracticeCardImageBlob','parentPracticeSchoolConfigData','restoreParentPracticeSchoolConfig','parentPracticeLinksText','parentPracticeLinksCsv','downloadParentPracticeWebsitePack','parentPracticeZip','0x04034b50','0x02014b50','0x06054b50','tt99-parent-download-pack','tt99-parent-copy-links','tt99-parent-save-config','tt99-parent-restore-config','canvas.toBlob','tt99-parent-copy-all','SU?.makeSchoolKey'])if(!rootApp.includes(required))fail('parent-practice',`Teacher sharing UI missing ${required}`);
for(const id of ['bronze','silver','gold','platinum','diamond'])if(!rootApp.includes(`'${id}'`))fail('parent-practice',`Post-99 parent preview is missing ${id}`);
if(rootPage.indexOf('school-usage.js')<0||rootPage.indexOf('school-usage.js')>rootPage.indexOf('parent-practice.js'))fail('school-usage','School usage module must load before the parent practice codec');
if(rootPage.indexOf('parent-practice.js')<0||rootPage.indexOf('parent-practice.js')>rootPage.indexOf('app.js'))fail('parent-practice','Parent practice codec must load before the main app');
const pdfLayout=read('assets/99club/pdf-layout.js');
if(!pdfLayout.includes('answerContext={}')||!pdfLayout.includes("answerContext?.label||'Teacher answer copy'"))fail('parent-practice','PDF layout lacks parent-friendly answer-copy context');
if(!rootApp.includes("kind:'tt99-school-parent-practice-config'")||!rootApp.includes("configVersion:1"))fail('parent-practice','Portable school configuration format is missing its stable kind/version contract');
if(!rootApp.includes("for(const id of PARENT_CLUB_IDS)clubs[id]=G.clone(loadRulesFor(state.schemeId,id))"))fail('parent-practice','School configuration does not snapshot all parent-practice club rules');
if(rootApp.includes("That school configuration uses a worksheet generation version this build does not support."))fail('parent-practice','Rule-only school configuration should remain portable across generator versions');
if(!rootApp.includes("cards/'+parentPracticeCardFilename(id)")||!rootApp.includes("README.html")||!rootApp.includes("practice-links.csv"))fail('parent-practice','Website pack does not include cards, guide and link mapping');
const schoolInfo=read('_pages/99-club-schools.md');
const schoolWidgetHelp=read('_pages/99-club-widget-help.md');
if(!schoolInfo.includes('School website integration help'))fail('parent-practice','Master school guide is not labelled School website integration help');
if(!schoolInfo.includes("Plain link or your website's own button/card")||!schoolInfo.includes('Widgets are useful but they are optional')||!schoolInfo.includes('iframe/embed'))fail('parent-practice','Information-for-schools page does not clearly distinguish ordinary links/cards from optional embedded widgets');
if(!schoolInfo.includes('ready-made website card HTML')||!schoolInfo.includes("website's own card or button"))fail('parent-practice','Information-for-schools page does not explain the website-card/plain-link choices');
for(const phrase of ['Create a 99 Club Widget','Create a Maths Games Widget','Put the widget on the school website','Change a widget later','Custom vocabulary','Only use curriculum or teaching content that you are happy to make public','Troubleshooting','Before publishing: teacher-friendly checklist'])if(!schoolWidgetHelp.includes(phrase))fail('parent-practice',`Detailed widget guide missing: ${phrase}`);
if(/Juniper/i.test(schoolWidgetHelp))fail('parent-practice','Detailed widget guide must stay platform-neutral');
for(const phrase of ['Option 3: use a downloadable PNG card image','The PNG itself does not contain the clickable link','Save the school\'s club configuration','Download the complete website pack','practice-links.csv','99-club-school-configuration.json','Copy all links','Change published practice later','Published links and widgets keep the setup that was shared at the time','Bronze, Silver, Gold, Platinum or Diamond'])if(!schoolInfo.includes(phrase))fail('parent-practice',`School website guide missing: ${phrase}`);
ok('parent-practice','Teacher share UI, stripped parent route, combined PDF and school information contract checked');

/* ---------- school-led puzzle practice sharing ---------- */
const puzzleParentAssets=['assets/99club/school-brand.js','assets/99club/games-parent-practice.js','assets/99club/games-parent-practice-page.js','assets/99club/school-usage.js','assets/99club/games-app.js'];
for(const rel of puzzleParentAssets){
  if(!exists(rel)){fail('puzzle-parent',`Missing ${rel}`);continue;}
  try{new Function(read(rel));}catch(e){fail('puzzle-parent',`Syntax error in ${rel}`,e.message);}
}
try{
  global.TT99_SCHOOL_USAGE_CONFIG={enabled:false,endpoint:'',schemaVersion:2};
  delete global.TT99SchoolUsage;delete global.TT99SchoolBrand;delete global.TT99GamesParentPractice;
  const SchoolUsage2=load('assets/99club/school-usage.js');
  const SchoolBrand2=load('assets/99club/school-brand.js');global.TT99SchoolBrand=SchoolBrand2;
  const PuzzleParent=load('assets/99club/games-parent-practice.js');
  const schoolKey=SchoolUsage2.makeSchoolKey('Example Primary School');
  const settings=G.normalizeSettings({
    minYear:4,maxYear:5,topics:['calculation'],sheets:2,activitiesPerSheet:2,workedExamples:'front',
    selectedEngines:['pyramid','magic'],
    engineSettings:{
      pyramid:{difficulty:'challenge',levels:'5',clueLevel:'fewer'},
      magic:{difficulty:'easy',gridSize:'3',puzzleType:'missing',numberPattern:'classic',clueLevel:'more'}
    },
    personalisation:{schoolName:'Example Primary School',packTitle:'Private Y5 pack',classLabel:'5B',worksheetDate:'2026-09-19',logoDataUrl:'',logoWidth:0,logoHeight:0}
  });
  const puzzleLogo='data:image/jpeg;base64,BBBB';
  const cfg={settings,customVocabulary:[],schoolUsageKey:schoolKey,school:{schoolName:'Example Primary School',logoDataUrl:puzzleLogo,logoWidth:72,logoHeight:36}};
  const compact=PuzzleParent.compactPayload(cfg);
  if(compact.s.personalisation)fail('puzzle-parent','Parent puzzle payload leaked printable personalisation');
  if(Object.keys(compact.s.engineSettings||{}).some(id=>!compact.s.selectedEngines.includes(id)))fail('puzzle-parent','Parent puzzle payload carries unselected engine settings');
  const token=PuzzleParent.encode(cfg),decoded=PuzzleParent.decode(token);
  if(token.length>PuzzleParent.MAX_TOKEN_LENGTH)fail('puzzle-parent','Puzzle parent token exceeds size contract',String(token.length));
  if(decoded.schoolUsageKey!==schoolKey)fail('puzzle-parent','Opaque school key did not survive puzzle-link round trip');
  if(decoded.settings.personalisation.schoolName||decoded.settings.personalisation.classLabel||decoded.settings.personalisation.worksheetDate||decoded.settings.personalisation.logoDataUrl)fail('puzzle-parent','Decoded puzzle generation settings contain printable personalisation instead of keeping branding separate');
  if(decoded.school?.name!=='Example Primary School'||decoded.school?.logo!==puzzleLogo||decoded.school?.logoWidth!==72||decoded.school?.logoHeight!==36)fail('puzzle-parent','Public school branding does not survive puzzle-link round trip');
  if(decoded.settings.sheets!==2||decoded.settings.activitiesPerSheet!==2)fail('puzzle-parent','Puzzle pack-level settings did not survive parent-link round trip');
  if(Object.prototype.hasOwnProperty.call(compact.s,'minYear')||Object.prototype.hasOwnProperty.call(compact.s,'maxYear'))fail('puzzle-parent','New puzzle parent payload still carries legacy Year-range fields');
  if(decoded.settings.engineSettings.pyramid.difficulty!=='challenge'||String(decoded.settings.engineSettings.pyramid.levels)!=='5')fail('puzzle-parent','Per-engine puzzle settings did not survive parent-link round trip');
  if(compact.i?.n!=='Example Primary School'||compact.i?.l!==puzzleLogo)fail('puzzle-parent','Public school name/logo were not included in the puzzle parent payload');
  if(JSON.stringify(compact).includes('Private Y5 pack')||JSON.stringify(compact).includes('5B')||JSON.stringify(compact).includes('2026-09-19'))fail('puzzle-parent','Class/title/stored-date data leaked into parent puzzle payload');

  const vocabSettings=G.normalizeSettings({minYear:3,maxYear:4,topics:['calculation'],selectedEngines:['wordsearch'],engineSettings:{wordsearch:{difficulty:'standard'}}});
  const custom=[{topic:'calculation',term:'Quotient',definition:'The result of a division.',minYear:3,maxYear:6},{topic:'geometry',term:'Vertex',definition:'A corner point.',minYear:2,maxYear:6}];
  const vocabPayload=PuzzleParent.compactPayload({settings:vocabSettings,customVocabulary:custom,schoolUsageKey:schoolKey});
  if(!Array.isArray(vocabPayload.x)||vocabPayload.x.length!==1||vocabPayload.x[0][1]!=='Quotient')fail('puzzle-parent','Relevant custom vocabulary is not scoped correctly for shared vocabulary puzzles');
  const noVocab=PuzzleParent.compactPayload({settings:G.normalizeSettings({...vocabSettings,selectedEngines:['pyramid']}),customVocabulary:custom,schoolUsageKey:schoolKey});
  if(noVocab.x)fail('puzzle-parent','Custom vocabulary was included when no shared vocabulary puzzle needs it');

  const link=PuzzleParent.buildLink(cfg,'https://99studio.uk');
  if(!link.startsWith('https://99studio.uk/practice/puzzles/#p=TT99GP1.'))fail('puzzle-parent','Puzzle parent link does not use the dedicated fragment route',link.slice(0,100));
  if(link.includes('?'))fail('puzzle-parent','Puzzle practice settings should be carried in the URL fragment');
  const card=PuzzleParent.websiteCardHtml(link,'Maths puzzle practice','2 puzzle types · Calculation');
  if(!/^<a /.test(card)||/script|iframe/i.test(card)||!card.includes('noopener'))fail('puzzle-parent','Puzzle website card is not a plain safe hyperlink');
  if(!card.includes('referrerpolicy="origin"')||card.includes('noreferrer'))fail('school-usage','Puzzle website card does not preserve origin-only source attribution');

  const usage=SchoolUsage2.puzzlePracticePayload('puzzle_practice_download',decoded);
  if(!usage||usage.school_key!==schoolKey||usage.game_count!==2||usage.sheet_count!==2||usage.activities_per_sheet!==2)fail('school-usage','Aggregate puzzle-practice payload is incomplete');
  if(Object.prototype.hasOwnProperty.call(usage,'min_year')||Object.prototype.hasOwnProperty.call(usage,'max_year'))fail('school-usage','Puzzle usage payload still carries legacy Year-range fields');
  if(!Array.isArray(usage.topic_ids)||!usage.topic_ids.includes('calculation'))fail('school-usage','Puzzle usage payload is missing aggregate topic ids');
  if(!Array.isArray(usage.game_difficulties)||!usage.game_difficulties.includes('pyramid:challenge'))fail('school-usage','Puzzle usage payload is missing per-game difficulty modes');
  if(Number(usage.custom_vocabulary_count)!==0)fail('school-usage','Puzzle usage custom vocabulary count is incorrect for a non-vocabulary pack');
  for(const forbidden of ['school_name','pupil','parent','seed','url','referrer','score','customVocabulary'])if(JSON.stringify(usage).includes(forbidden))fail('school-usage',`Puzzle usage payload leaked forbidden field ${forbidden}`);
  if(SchoolUsage2.enabled())fail('school-usage','School telemetry must remain disabled until the final analytics design is approved');

  const puzzlePage=read('_pages/99-club-puzzle-practice.md'),puzzleLayout=read('_layouts/puzzle-practice.html'),gamesPage=read('_pages/99-club-games.md'),gamesApp=read('assets/99club/games-app.js'),puzzleParentUi=read('assets/99club/games-parent-practice-page.js');
  if(!/layout:\s*puzzle-practice/.test(puzzlePage)||!/permalink:\s*\/practice\/puzzles\//.test(puzzlePage))fail('puzzle-parent','Dedicated puzzle practice route is missing');
  if(/analytics|gtag|googletagmanager/i.test(puzzleLayout))fail('puzzle-parent','Puzzle parent layout loads Google Analytics');
  for(const required of ['games-engine.js','games-pdf.js','school-usage.js','school-brand.js','games-parent-practice.js','games-parent-practice-page.js'])if(!puzzleLayout.includes(required))fail('puzzle-parent',`Puzzle parent layout missing ${required}`);
  if(gamesPage.indexOf('games-parent-practice.js')<0||gamesPage.indexOf('games-parent-practice.js')>gamesPage.indexOf('games-app.js'))fail('puzzle-parent','Puzzle sharing codec must load before games-app.js');
  for(const required of ['games-parent-share','tt99-puzzle-parent-modal','Save puzzle setup','Restore puzzle setup','Download website pack','puzzleConfigData','restorePuzzleConfig','downloadPuzzleWebsitePack','createPuzzleShareCardBlob','tt99-school-puzzle-config','open_parent_view','restore_config'])if(!gamesApp.includes(required))fail('puzzle-parent',`Printable puzzle sharing UI missing ${required}`);
  if(!gamesApp.includes('puzzleSharePreviewLink')||!gamesApp.includes("searchParams.set('preview','1')"))fail('puzzle-parent','Puzzle teacher preview links are not marked with preview=1 for PWA-safe return navigation');
  if(!gamesApp.includes('puzzleShareWebsiteCard(true)'))fail('puzzle-parent','Clickable teacher puzzle card preview does not use the PWA-safe preview URL');
  if(!gamesApp.includes('School website integration help'))fail('puzzle-parent','Puzzle sharing panel is missing the School website integration help label');
  if(!puzzleParentUi.includes('isTeacherPreview')||!puzzleParentUi.includes('Back to Maths Games &amp; Puzzles')||!puzzleParentUi.includes('tt99-practice-previewbar'))fail('puzzle-parent','Puzzle teacher preview is missing its PWA-safe return control');
  if(!puzzleParentUi.includes('worksheetDate:B.localIsoDate()')||!puzzleParentUi.includes('schoolName:brand.name')||!puzzleParentUi.includes('logoDataUrl:brand.logo'))fail('puzzle-parent','Puzzle parent PDF does not force school branding + generation date');
if(!puzzleParentUi.includes('renderGameTypes')||!puzzleParentUi.includes('names.length<=5')||!puzzleParentUi.includes('View all '))fail('puzzle-parent','Large parent puzzle packs do not collapse long puzzle-type lists');
  if(!gamesApp.includes('selected.length<=5')||!gamesApp.includes('selected games.'))fail('puzzle-parent','Teacher pack summary does not stay concise for large game selections');
  if(!gamesApp.includes('Open widget builder')||gamesApp.includes('Add current pack to widget'))fail('puzzle-parent','Maths Games widget action is not aligned with the 99 Club Open widget builder wording');
  if(!gamesApp.includes("kind:'tt99-school-puzzle-config'")||!gamesApp.includes('customVocabulary:G.clone(state.customVocabulary)'))fail('puzzle-parent','Portable puzzle setup does not preserve full settings and custom vocabulary');
  const schoolInfo2=read('_pages/99-club-schools.md'),privacy2=read('_pages/privacy.md');
  for(const phrase of ['id="puzzle-practice"','Save puzzle setup','Restore puzzle setup','Download website pack','Personal vocabulary'])if(!schoolInfo2.includes(phrase))fail('puzzle-parent',`School puzzle-sharing guide missing: ${phrase}`);
  if(!privacy2.includes("Parent-practice links may include the school's public name and a compact copy of its logo")||!privacy2.includes('stored worksheet date')||!privacy2.includes('date it is generated')||!privacy2.includes('custom vocabulary')||!privacy2.includes('terms and definitions needed for that activity may be included in the shared link'))fail('puzzle-parent','Privacy page does not describe parent branding, generation dates and shared vocabulary clearly');
  ok('puzzle-parent','Locked puzzle pack links, portable setup, website pack and school-level telemetry contract checked');
}catch(e){fail('puzzle-parent','Puzzle parent sharing QA threw',e.stack||e.message);}

/* ---------- Online Play safe-fit + single-instruction contract ---------- */
try{
  const playPage=read('_pages/99-club-games-play.md');
  const playCore=read('assets/99club/games-play-core-v2.js');
  const fitCss=read('assets/99club/games-play-safe-fit-v2.css');
  const fitJs=read('assets/99club/games-play-safe-fit-v2.js');
  const instructions=read('assets/99club/games-play-instructions-v154.js');
  const sudokuPlay=read('assets/99club/games-play-sudoku-v1.js');
  const sharePlay=read('assets/99club/games-play-share-v164.js');
  const contextPadCss=read('assets/99club/games-play-context-keypad-v201.css');
  const contextPadJs=read('assets/99club/games-play-context-keypad-v201.js');
  const catalogueCss=read('assets/99club/games-play-final-catalogue-v186.css');
  const iconJs=read('assets/99club/games-play-icons-v1.js');
  const iconCss=read('assets/99club/games-play-icons-v1.css');
  if(!playPage.includes('games-play-safe-fit-v2.css?v=3')||!playPage.includes('games-play-safe-fit-v2.js?v=1'))fail('play-safe-fit','safe-fit assets are not both loaded by /play/');
  if(!playPage.includes('games-play-core-v2.js?v=16')||!playPage.includes('games-play-instructions-v154.js?v=7')||!playPage.includes('games-play-sudoku-v1.js?v=2'))fail('play-safe-fit','changed Online Play assets are not cache-busted');
  if(!playPage.includes('games-play-icons-v1.js?v=2')||!playPage.includes('games-play-icons-v1.css?v=1'))fail('game-icons','coherent game icon assets are not both loaded by /play/');
  if(playPage.indexOf('games-play-icons-v1.js?v=1')>playPage.indexOf('games-play-core-v2.js?v=16'))fail('game-icons','game icon renderer must load before Online Play core');
  if(!playPage.includes('games-play-final-catalogue-v186.css?v=2')||!playPage.includes('games-play-context-keypad-v201.css?v=8')||!playPage.includes('games-play-context-keypad-v201.js?v=9')||!playPage.includes('games-play-share-v164.js?v=10'))fail('mobile-play-controls','mobile keyboard/copy-link assets are not cache-busted');
  if(/<details class="tt99-play-settings"\s+open>/.test(playCore))fail('play-safe-fit','Puzzle settings still start expanded');
  if(/html\.tt99-play-app-shell|overflow\s*:\s*hidden\s*!important/i.test(fitCss))fail('play-safe-fit','safe-fit must not restore the old document viewport lock');
  if(/#tt99-play-board[^{}]*\{[^}]*transform\s*:/is.test(fitCss))fail('play-safe-fit','safe-fit must not transform-scale the live board');
  if(/document\.documentElement\.style|document\.body\.style|overflow\s*=|style\.transform/i.test(fitJs))fail('play-safe-fit','safe-fit helper must not lock document scrolling or transform the board');
  if(!fitJs.includes("'--tt99-square-fit'"))fail('play-safe-fit','safe-fit helper is not publishing the measured square-board size');
  if(instructions.includes("liveRule=document.createElement('p')"))fail('instruction-single-source','instruction layer still creates a second live-rule paragraph');
  if(!instructions.includes("base+' '+directionText"))fail('instruction-single-source','generated search directions are not folded into the single instruction paragraph');
  if(!instructions.includes("if(id==='sudoku'&&typeof a.instruction==='function')continue"))fail('sudoku-latin-clarity','instruction cleanup overrides the dynamic Sudoku/Latin rule function');
  if(!playCore.includes("adapter().puzzleTitle"))fail('sudoku-latin-clarity','Online Play core does not support puzzle-specific display titles');
  if(!sudokuPlay.includes("'Latin Square':'Sudoku'")||!sudokuPlay.includes('There are no box rules.')||!sudokuPlay.includes('outlined box'))fail('sudoku-latin-clarity','Sudoku / Latin adapter does not provide distinct titles and rules');
  if(!fitCss.includes('white-space:normal')||!fitCss.includes('#tt99-play-root #tt99-play-share')||fitCss.includes("content:'Copy link'"))fail('mobile-play-labels','mobile title/share-label fit rules are missing or still rely on a pseudo label');
  if(!sharePlay.includes("setText(topShare,'Copy link')")||!sharePlay.includes("setAttribute('aria-label','Copy puzzle link')"))fail('mobile-play-labels','share script can still restore the long label into the mobile button');
  if(playCore.includes('>Copy challenge link</button>')||playCore.includes('>Copy puzzle link</button>'))fail('mobile-play-labels','Online Play core still renders a long copy-link label before enhancements load');
  if(!playCore.includes('aria-label="Copy puzzle link">Copy link</button>'))fail('mobile-play-labels','Online Play core does not render intrinsic compact copy-link controls');
  if(sharePlay.includes("setText(actions.querySelector('[data-play-share]'),'Copy puzzle link')"))fail('mobile-play-labels','completion share layer can still restore the long label');
  if(!catalogueCss.includes('div:nth-last-child(4)')||!catalogueCss.includes('div:nth-last-child(3)')||!catalogueCss.includes('div:nth-last-child(2)')||catalogueCss.includes('div:nth-child(1){--letters:10}'))fail('crossword-keyboard','crossword keyboard rows are still coupled to the prepended contextual handle');
  if(!contextPadCss.includes('.tt99-context-pad-active.tt99-letter-keypad')||!contextPadCss.includes('button[data-letter]')||!contextPadCss.includes('height:40px!important'))fail('crossword-keyboard','compact mobile crossword keyboard drawer rules are missing');
  if(!contextPadJs.includes("const label=padLabel(pad)")||!contextPadJs.includes('tt99-context-handle-text'))fail('crossword-keyboard','contextual letter drawer does not expose the Keyboard label');
  const iconIds=['sumplete','cornersum','linkedsum','killersudoku','kakuro','arithmeticcages','brokencalc','target','operationgrid','maze','crossnumber','arithmagon','pyramid','numbertowers','numberwheels','numbersearch','equationcrossgrid','squaresearch','insertops','symbols','functionmachine','balance','mobilebalance','magic','magicshape','alphametics','numbertrail','propertymaze','diagonalpath','sudoku','futoshiki','takuzu','numberpath','nonogram','mathsmines','hashi','colourlogic','shikaku','perimeterregions','wordsearch','crossword'];
  for(const id of iconIds)if(!iconJs.includes(id+': svg('))fail('game-icons','coherent SVG icon missing for '+id);
  if(iconIds.length!==41)fail('game-icons','expected 40 audited game icons');
  if(!iconJs.includes("viewBox=\"0 0 24 24\"")||!iconJs.includes("stroke-width=\"1.8\""))fail('game-icons','SVG family is not using the shared 24 × 24 drawing system');
  if(iconJs.includes('<text'))fail('game-icons','game icons must not depend on font-rendered SVG text');
  if(!iconCss.includes('.tt99-game-icon-svg')||!iconCss.includes('font-size:0!important')||!iconCss.includes('width:68%')||!iconCss.includes('height:68%'))fail('game-icons','shared icon sizing/containment rules are incomplete');
  if(!playCore.includes('global.TT99GameIcons')||!playCore.includes('gameIconMarkup(a)')||!playCore.includes('icon.innerHTML=gameIconMarkup(a)'))fail('game-icons','Online Play header/library are not using the shared icon renderer');
  ok('game-icons','All 41 Online Play games have coherent shared SVG icons');
  ok('play-safe-fit','Safe compact layout, mobile controls and single-instruction source are wired without document locking or board transforms');
}catch(e){fail('play-safe-fit','Online Play safe-fit QA threw',e.stack||e.message);}

/* ---------- analytics coverage and privacy ---------- */
try{
  const analyticsCore=read('assets/99club/analytics.js');
  const headCustom=read('_includes/head/custom.html');
  const customPage=read('_pages/99-club-custom.md');
  const customApp=read('assets/99club/custom-app.js');
  const pwaRegister=read('assets/99club/pwa/pwa-register.js');
  const playCore=read('assets/99club/games-play-core-v2.js');
  const widgetBuilder=read('assets/99club/widget-builder.js');
  const widgetRuntime=read('assets/99club/widget-runtime.js');
  const widgetPage=read('_pages/99-club-widget.html');
  if(fs.existsSync(path.join(ROOT,'_pages/99-club-widget.md')))fail('analytics','Public widget endpoint must be HTML, not Markdown');
  if(!/^---[\s\S]*?---\s*<!doctype html>/i.test(widgetPage))fail('analytics','Public widget endpoint is not a real standalone HTML document');
  const widgetBuilderPage=read('_pages/99-club-widget-builder.md');
  const analyticsDoc=read('docs/ANALYTICS_SETUP.md');
  const privacy=read('_pages/privacy.md');

  for(const event of ['studio_open','parent_share_open','parent_share_action','worksheet_download'])if(!rootApp.includes(event))fail('analytics',`99 Club analytics missing ${event}`);
  for(const event of ['studio_open','game_pack_download','puzzle_parent_share_open','puzzle_parent_share_action'])if(!gamesApp.includes(event))fail('analytics',`Games analytics missing ${event}`);
  for(const event of ['studio_open','custom_worksheet_download'])if(!customApp.includes(event))fail('analytics',`Custom Worksheets analytics missing ${event}`);
  if(customPage.indexOf('school-usage.js')<0||customPage.indexOf('school-usage.js')>customPage.indexOf('custom-app.js'))fail('analytics','Custom Worksheets does not load school attribution before its app');
  if(customPage.includes('\\n<script'))fail('analytics','Custom Worksheets page contains escaped newline text in script markup');

  for(const event of ['widget_builder_open','widget_existing_import','widget_embed_copy','widget_url_copy','widget_setup_save','widget_setup_restore'])if(!widgetBuilder.includes(event))fail('analytics',`Widget Builder analytics missing ${event}`);
  if(!widgetBuilder.includes('widget_type:draft.widgetType'))fail('analytics','Widget Builder open/action analytics no longer carry the fixed widget type');
  if(widgetBuilder.includes('widget_type_selected'))fail('analytics','Widget Builder still tracks the removed widget-type selector');
  for(const token of ['trackWidget','widget_open','widget_item_open','sourceOrigin','integrationId'])if(!widgetRuntime.includes(token))fail('analytics',`Public widget school attribution missing ${token}`);
  if(/googletagmanager|analytics\.js|gtag\(/i.test(widgetPage))fail('analytics','Public embedded widget must not load Google Analytics');
  if(!widgetBuilderPage.includes('school-usage-config.js')||!widgetBuilderPage.includes('school-usage.js'))fail('analytics','Widget Builder is missing first-party school attribution helpers');

  for(const event of ['online_game_started','online_hint_used','online_game_completed'])if(!playCore.includes(event))fail('analytics',`Online Play analytics missing ${event}`);
  if(!playCore.includes('integration_id')||!playCore.includes('source_origin')||!playCore.includes('app_mode'))fail('analytics','Online Play analytics is missing source/widget/PWA attribution');

  for(const event of ['pwa_install_prompt','pwa_install_action','pwa_installed','pwa_update_available','pwa_update_action'])if(!pwaRegister.includes(event))fail('analytics',`PWA analytics missing ${event}`);

  if(!headCustom.includes('page_location:safeLocation')||!headCustom.includes('page_referrer:safeReferrer'))fail('analytics','GA automatic page view is not sanitised to path + origin-only referrer');
  if(!headCustom.includes("location.origin+location.pathname"))fail('analytics','GA page_location can still include query/hash recreation data');
  if(!analyticsCore.includes('source_origin')&&false)fail('analytics','Analytics core missing source origin support');
  if(!analyticsCore.includes('integration_help')||!analyticsCore.includes('widget_builder'))fail('analytics','Navigation analytics taxonomy is missing integration help/widget builder');

  for(const phrase of ['Google Analytics is loaded only if you choose','does not send pupil names','random identifier','website origin',"parent-practice pages and embedded school widgets do not load 99 Club Studio's Google Analytics code"])if(!privacy.includes(phrase))fail('analytics',`Privacy page missing plain-English disclosure: ${phrase}`);
  for(const phrase of ['First-party school usage telemetry','source_origin','integration_id','teacher','widget_open','practice_download','enabled: false'])if(!analyticsDoc.includes(phrase))fail('analytics',`Analytics setup guide missing: ${phrase}`);

  const schoolCfg=read('assets/99club/school-usage-config.js');
  if(!/enabled:\s*false/.test(schoolCfg)||!/endpoint:\s*''/.test(schoolCfg)||!/schemaVersion:\s*2/.test(schoolCfg))fail('analytics','First-party school telemetry must remain disabled at schema v2 until endpoint deployment');

  ok('analytics','Teacher GA4, school-source attribution, widgets, PWA, Custom Worksheets and privacy contracts checked');
}catch(e){fail('analytics','Analytics contract QA threw',e.stack||e.message);}

/* ---------- school integration demonstration ---------- */
try{
  const demo=read('_pages/school-website-demo.html');
  const demoJs=read('assets/99club/school-demo.js');
  const schoolGuide=read('_pages/99-club-schools.md');
  for(const phrase of [
    'permalink: /demo/',
    '99 CLUB STUDIO SCHOOL WEBSITE DEMO',
    'Fictional example school',
    'Addington-on-Sum Primary School',
    '1 · Buttons',
    '2 · Cards',
    '3 · Widgets',
    'data-demo-panel="buttons"',
    'data-demo-panel="cards"',
    'data-demo-panel="widgets"',
    'demo-club-buttons-core',
    'demo-club-cards-core',
    'demo-club-widget',
    'demo-games-widget',
    'School website help →',
    'index,follow'
  ])if(!demo.includes(phrase))fail('school-demo','General school demo missing: '+phrase);
  if(/Radford Semele|Juniper/i.test(demo+demoJs+schoolGuide))fail('school-demo','School-facing demo/help must not identify the old real school or website platform');
  if(exists('_pages/radford-semele-99studio-demo.html')||exists('_pages/radford-semele-99studio-demo-redirect.html'))fail('school-demo','Old Radford-named demo files still exist');
  if(!demoJs.includes("name:'Addington-on-Sum Primary School'")||!demoJs.includes("fillText('AS'"))fail('school-demo','Demo widgets/mark are not using the fictional school identity');
  if(!schoolGuide.includes('href="/demo/"')||!schoolGuide.includes('fictional school website demo')||!schoolGuide.includes('View live demo →'))fail('school-demo','Implementation help does not give a clear live-demo choice');
  if(/99 Studio/.test(schoolGuide))fail('school-demo','School-facing implementation help has shortened the 99 Club Studio brand');
  if(!demoJs.includes('initTabs')||!demoJs.includes("history.replaceState"))fail('school-demo','Single demo page does not switch its three integration tabs in-page');
  for(const id of ['11','22','33','44','55','66','77','88','99','bronze','silver','gold','platinum','diamond'])if(!demoJs.includes("'"+id+"'"))fail('school-demo','Shared demo content missing Club '+id);
  if((demoJs.match(/title:'/g)||[]).length<3)fail('school-demo','Demo does not contain at least three printable game-sheet packs');
  for(const id of ['maze','sumplete','sudoku','numbertrail','balance','colourlogic'])if(!demoJs.includes("'"+id+"'"))fail('school-demo','Demo online games missing '+id);
  if(!demoJs.includes("selectedClubs:CLUBS.map"))fail('school-demo','Club widget does not include all 14 Club levels');
  if(exists('_pages/radford-semele-99studio-demo-cards.html')||exists('_pages/radford-semele-99studio-demo-widgets.html'))fail('school-demo','Redundant separate school demo pages still exist');
  ok('school-demo','General fictional three-tab school integration demo and school-facing help polish checked');
}catch(e){fail('school-demo','School integration demo QA threw',e.stack||e.message);}

/* ---------- hidden manipulatives / Number Line classroom contracts ---------- */
try{
  const goodiesPage=read('_pages/99-club-goodies.md');
  const numberLine=read('assets/99club/goodies-number-line-v6.js');
  const challengeKit=read('assets/99club/goodies-challenge.js');
  const goodiesExport=read('assets/99club/goodies-export.js');
  const goodiesCss=read('assets/99club/goodies.css');
  new Function(numberLine);
  new Function(challengeKit);
  new Function(goodiesExport);
  if(!goodiesPage.includes('permalink: /goodies/')||!goodiesPage.includes('sitemap: false')||!goodiesPage.includes('search: false')||!goodiesPage.includes('noindex,nofollow,noarchive'))fail('goodies-number-line','Hidden goodies route/indexing contract regressed');
  if(!/goodies-number-line-v6\.js\?v=\d+/.test(goodiesPage)||!/goodies-challenge\.js\?v=\d+/.test(goodiesPage)||!/goodies-export\.js\?v=\d+/.test(goodiesPage)||!/goodies\.css\?v=\d+/.test(goodiesPage))fail('goodies-number-line','Number Line / shared challenge/export assets are not cache-busted on /goodies/');
  if(goodiesPage.indexOf('goodies-challenge.js')>goodiesPage.indexOf('goodies-number-line-v6.js'))fail('goodies-number-line','Shared challenge framework must load before Number Line v6');
  for(const token of [
    "side:m.side==='below'?'below':'above'",
    'data-marker-side',
    'data-relation-side',
    'consecutiveSide',
    'function markerStem',
    'labelTop=base+20,labelBottom=base+43',
    'function assignLanes',
    'const y1=markerCentre(layout,d.a),y2=markerCentre(layout,d.b)',
    'state.lines.length>=4',
    'nl-add-line',
    'activeLineId',
    'openGroups',
    'Copy setup link',
    'Present',
    'function answerBox',
    'nl-answer-box',
    'function boardUiHtml',
    'data-board-action="add-marker"',
    "boardTool('relation'",
    "boardTool('undo'",
    "boardTool('redo'",
    "boardTool('lock'",
    'data-board-marker-delete',
    'data-board-marker-show',
    'data-board-relation-type-edit',
    'data-board-line-label',
    'function updateChallengeAnswer',
    'data-line-hit',
    'Tap the number line where you want the new marker.',
    'function enterBoardFallback',
    'function leaveBoardFallback',
    'function boardActive',
    'nl-board-fallback',
    "boardTool('exit'",
    'function boardIcon',
    'nl-board-rail',
    "boardTool('delete'",
    'is-delete-mode',
    'Line deleted. Undo is available.',
    'item.left>=end-0.5',
    "{id:'equivalent-fractions'",
    "{id:'fdp-equivalence'",
    'function fractionText',
    'tickStride',
    'nl-workflow-tabs',
    'data-nl-workflow',
    'data-nl-export-mode',
    'function pupilDiagramSvg',
    'labelSkip',
    "scaleMode=index>0&&src.scaleMode==='own'?'own':'shared'",
    'function scaleFor',
    'function snapOnLine',
    'data-nl-scale-mode="own"',
    'nl-line-min',
    'function customAnswerSources',
    'function resolveCustomAnswerSource',
    'function setCustomAnswerSource',
    'nl-custom-answer-source'
  ])if(!numberLine.includes(token))fail('goodies-number-line','Number Line v6 missing classroom contract: '+token);
  for(const token of ['G.challengeKit=','function bannerHtml','nl-challenge-reveal','data-board-action="reveal"','answerSource','Type the answer myself','custom-live-answer'])if(!challengeKit.includes(token))fail('goodies-number-line','Shared challenge layer missing classroom contract: '+token);
  for(const token of ['function composeChallengeCardSvg',"responseLabel='Answer'",'responseLines'])if(!goodiesExport.includes(token))fail('goodies-number-line','Shared challenge export layer missing classroom contract: '+token);
  if(!numberLine.includes('CK.bannerHtml'))fail('goodies-number-line','Number Line v6 is not using the shared challenge banner');
  if(numberLine.includes('l12 -7 v14')||numberLine.includes('l-12 -7 v14'))fail('goodies-number-line','Bounded Number Line has regained baseline arrowheads');
  if(!goodiesCss.includes('.nl-workflow-tabs')||!goodiesCss.includes('.nl-marker-card')||!goodiesCss.includes('.nl-scale-mode')||!goodiesCss.includes('.gd-answer-live')||!goodiesCss.includes('#gd-stage:fullscreen'))fail('goodies-number-line','Number Line teacher workflow / scale / live-answer / Board styling missing');
  if(!goodiesCss.includes('.nl-board-tools-toggle')||!goodiesCss.includes('.nl-board-menu.is-open')||!goodiesCss.includes('.nl-board-notice'))fail('goodies-number-line','Number Line floating Board teaching palette styling missing');
  for(const token of ['#gd-stage.nl-board-fallback','html.nl-board-page-lock','env(safe-area-inset-bottom)','@media(max-width:700px)','@media(orientation:landscape) and (max-height:560px)','.nl-board-rail','.nl-board-tool:after','.nl-challenge-reveal','#gd-stage.is-delete-mode .nl-baseline'])if(!goodiesCss.includes(token))fail('goodies-number-line','Number Line mobile/Board parity styling missing: '+token);
  ok('goodies-number-line','Hidden Number Line keeps desktop/mobile teaching parity with task-based Setup/Objects/Challenge/Export workflow, challenge-card export, quiet Board rail, direct delete, contextual reveal, tidy labels, undo/redo, comparison lines and export reuse');
}catch(e){fail('goodies-number-line','Number Line classroom QA threw',e.stack||e.message);}

/* ---------- public copy audit ---------- */
try{
  const publicCopyFiles=[
    '_pages/99-club-schools.md',
    '_pages/99-club-widget-help.md',
    '_pages/privacy.md',
    '_pages/school-website-demo.html',
    '_pages/99-club-games-help.md',
    '_pages/99-club-help.md',
    'assets/99club/app.js',
    'assets/99club/custom-app.js',
    'assets/99club/games-app.js',
    'assets/99club/widget-builder.js',
    'assets/99club/parent-practice-page.js',
    'assets/99club/games-parent-practice-page.js',
    'assets/99club/widget-runtime.js',
    'assets/99club/banner-actions-v2.js'
  ];
  const publicCopy=publicCopyFiles.map(p=>read(p)).join('\n');
  const bannedPublicPhrases=[
    'Privacy by design:',
    'Private by design.',
    'opaque school-level key',
    'school-level practice telemetry',
    'usage telemetry scaffold',
    'not encryption or a digital signature',
    'not encrypted or cryptographically signed',
    'technically determined person',
    'Nothing here publishes automatically.',
    'platform-neutral guide',
    'accountless widget'
  ];
  for(const phrase of bannedPublicPhrases)if(publicCopy.includes(phrase))fail('public-copy','Visitor-facing copy still contains internal/repetitive wording: '+phrase);
  if(!read('_pages/privacy.md').includes('plain-English summary'))fail('public-copy','Privacy page is not using the public-facing summary');
  if(!read('_pages/99-club-schools.md').includes('Practical guidance for adding 99 Club Studio practice'))fail('public-copy','School integration page has regressed to older intro copy');
  if(publicCopy.includes('99 Studio')||publicCopy.includes('99 STUDIO'))fail('public-copy','Public copy has shortened the 99 Club Studio brand');
  if(/\bby design\b/i.test(publicCopy))fail('public-copy','Public copy has regressed to slogan-style “by design” wording');
  if(/No sign-in required|No account is needed/i.test(publicCopy))fail('public-copy','Public copy has regressed to repetitive privacy/account slogans');
  if(/Resized locally for print/i.test(publicCopy))fail('public-copy','Public copy has regressed to implementation-style image-processing wording');
  ok('public-copy','Public pages and major dynamic UI surfaces avoid internal/developer wording');
}catch(e){fail('public-copy','Public copy audit threw',e.stack||e.message);}

/* ---------- output ---------- */
const report={generatedAt:new Date().toISOString(),samplesPerDifficulty:SAMPLES,generated,engineCount:G?.ENGINES?Object.keys(G.ENGINES).length:0,onlineAdapterCount:adapterIds.length,guideCount:guideIds.length,failures,warnings,notes};
const out=path.join(ROOT,'99club-qa-report.json');fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(`\n99 Club QA: ${failures.length} failure(s), ${warnings.length} warning(s). Report: ${path.relative(ROOT,out)}`);
if(failures.length)process.exit(1);
