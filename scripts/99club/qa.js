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
  for(const k of ['TT99GamesVocabularyV2','TT99ArithmeticGames','TT99NumberLogicGames','TT99Games','TT99GamesPlay','TT99PlayArithmetic','TT99AlphaLibrary'])delete global[k];
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

/* ---------- load generator stack exactly enough for Node ---------- */
resetGlobals();
const engineLoadOrder=[
  'assets/99club/games-vocabulary.js',
  'assets/99club/games-arithmetic.js',
  'assets/99club/games-new-puzzles-v196.js',
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
  'assets/99club/games-symbol-decoder-v189.js',
  'assets/99club/games-wordsearch-quality-v150.js'
];
for(const rel of engineLoadOrder){
  if(!exists(rel)){fail('engine-load',`Missing ${rel}`);continue;}
  try{load(rel);}catch(e){fail('engine-load',rel,e.stack||e.message);}
}
const G=global.TT99Games,A=global.TT99ArithmeticGames,N=global.TT99NumberLogicGames;
if(!G||!G.ENGINES)fail('engine-load','TT99Games did not initialise');

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
  if(id==='colourlogic'){
    if(p.solutionCount!==1)fail(id,'puzzle is not marked uniquely solvable',String(p.solutionCount));
    if(!Array.isArray(p.clues)||p.clues.length<2)fail(id,'too few clues');
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
for(const id of publicGameIds){
  if(!printInstructions.includes("case'"+id+"'"))fail('instruction-audit',id+': printable reviewed instruction missing');
  if(!onlineInstructions.includes("\n  "+id+":"))fail('instruction-audit',id+': online reviewed instruction missing');
}
if(!printInstructions.includes('operation signs may be reused'))fail('instruction-audit','Reusable operation-sign rule missing from printable instructions');
if(!printInstructions.includes('working digit or operation key may be reused'))fail('instruction-audit','Broken Calculator key-reuse rule missing from printable instructions');
if(!printInstructions.includes('the same digit may appear in a different run'))fail('instruction-audit','Kakuro repeat-scope rule missing from printable instructions');
if(!printInstructions.includes('two-cell − or ÷ cage, either order is allowed'))fail('instruction-audit','Arithmetic Cages subtraction/division order rule missing');
if(!printInstructions.includes('Allowed signs may be reused'))fail('instruction-audit','Insert Operations sign-reuse rule missing');
if(!printInstructions.includes('top circle is the total weight of the whole mobile'))fail('instruction-audit','Mobile Balance top-total explanation missing');
if(!onlineInstructions.includes('.tt99-play-numbersearch .tt99-play-board-tip'))fail('instruction-audit','Number Search live direction rule is not mirrored above the board');
if(!onlineInstructions.includes('Target answers do not overlap'))fail('instruction-audit','Number Search no-overlap rule missing online');
if(!onlineInstructions.includes('duplicate tiles are separate'))fail('instruction-audit','Target Number duplicate-tile rule missing online');
ok('instruction-audit','All 41 public games have reviewed print and online first-sight instructions');
const helpPage=read('_pages/99-club-games-help.md');
const stated=(helpPage.match(/covers all <strong>(\d+) current one-player games<\/strong>/)||[])[1];
if(stated&&Number(stated)!==guideIds.length)fail('help-guides',`Help-page guide count says ${stated}, library contains ${guideIds.length}`);
if(!/multiplication and division before addition and subtraction/i.test(helpSrc))fail('help-guides','Broken Calculator guide does not explain standard order of operations');
if(/brokencalc[^\n]+bracket/i.test(helpSrc))warn('help-guides','Broken Calculator guide still appears to mention brackets');

const drawer=read('assets/99club/games-play-context-keypad-v201.js');
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

/* ---------- output ---------- */
const report={generatedAt:new Date().toISOString(),samplesPerDifficulty:SAMPLES,generated,engineCount:G?.ENGINES?Object.keys(G.ENGINES).length:0,onlineAdapterCount:adapterIds.length,guideCount:guideIds.length,failures,warnings,notes};
const out=path.join(ROOT,'99club-qa-report.json');fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(`\n99 Club QA: ${failures.length} failure(s), ${warnings.length} warning(s). Report: ${path.relative(ROOT,out)}`);
if(failures.length)process.exit(1);
