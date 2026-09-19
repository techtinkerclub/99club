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
if(!printInstructions.includes('two-cell − or ÷, either order is allowed'))fail('instruction-audit','Arithmetic Cages subtraction/division order rule missing');
if(!printInstructions.includes('Cages have no extra no-repeat rule'))fail('instruction-audit','Arithmetic Cages repeat-scope rule missing');
if(!printInstructions.includes('Allowed signs may be reused'))fail('instruction-audit','Insert Operations sign-reuse rule missing');
if(!printInstructions.includes('top circle is the total weight of the whole mobile'))fail('instruction-audit','Mobile Balance top-total explanation missing');
if(!onlineInstructions.includes('.tt99-play-numbersearch .tt99-play-board-tip'))fail('instruction-audit','Number Search live direction rule is not mirrored above the board');
if(!onlineInstructions.includes('Target answers do not overlap'))fail('instruction-audit','Number Search no-overlap rule missing online');
if(!onlineInstructions.includes('duplicate tiles are separate'))fail('instruction-audit','Target Number duplicate-tile rule missing online');
ok('instruction-audit','All 41 public games have reviewed print and online first-sight instructions');
const pdfTakuzu=read('assets/99club/games-pdf-takuzu-v139.js');
const pdfTowers=read('assets/99club/games-pdf-v138-flowfix.js');
const pdfCode=read('assets/99club/games-pdf-v158.js');
const pdfSums=read('assets/99club/games-pdf-sum-grids-v147.js');
const pdfNew=read('assets/99club/games-pdf-new-puzzles-v197.js');
const pdfHashi=read('assets/99club/games-pdf-v1401.js');
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
  '.tt99-play-wordsearch .tt99-play-board-tip',
  '.tt99-play-numbersearch .tt99-play-board-tip',
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
if(!onlineInstructions.includes('Tap an operator box to cycle through the allowed signs'))fail('instruction-audit','Operation Codebreaker top instruction lost its interaction rule');
if(!onlineInstructions.includes('Tap a box to cycle colours'))fail('instruction-audit','Colour Logic top instruction lost its interaction rule');
ok('instruction-audit','Static online rule duplication is removed while dynamic board guidance is preserved');
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

/* ---------- parent-practice sharing ---------- */
const parentAssets=['assets/99club/school-usage-config.js','assets/99club/school-usage.js','assets/99club/parent-practice.js','assets/99club/parent-practice-page.js','assets/99club/app.js'];
for(const rel of parentAssets){
  if(!exists(rel)){fail('parent-practice',`Missing ${rel}`);continue;}
  try{new Function(read(rel));}catch(e){fail('parent-practice',`Syntax error in ${rel}`,e.message);}
}
try{
  const ClubG=load('assets/99club/generator.js');
  delete global.TT99SchoolUsage;delete global.TT99ParentPractice;
  const SchoolUsage=load('assets/99club/school-usage.js');
  const ParentPractice=load('assets/99club/parent-practice.js');
  const base=ClubG.normalizeRules(ClubG.CLASSIC_PRESETS['33']);
  const stripParentMeta=value=>{const out=JSON.parse(JSON.stringify(value));for(const key of ['id','name','tagline','sourceSchemeId','sourceClubId','worksheetTitle'])delete out[key];return out;};
  const schoolKey=SchoolUsage.makeSchoolKey('Example Primary School');
  if(!SchoolUsage.validSchoolKey(schoolKey))fail('school-usage','Stable school-level key was not created');
  if(schoolKey!==SchoolUsage.makeSchoolKey('  Example   Primary School  '))fail('school-usage','Equivalent school names do not produce the same school key');
  const standard={schemeId:'classic',clubId:'33',rules:base,orientation:'portrait',schoolUsageKey:schoolKey};
  const compact=ParentPractice.compactPayload(standard);
  if(!compact.r||!stable(compact.r,stripParentMeta(base)))fail('parent-practice','Parent link does not freeze the complete school-selected functional rules snapshot');
  for(const forbidden of ['id','name','tagline','sourceSchemeId','sourceClubId','worksheetTitle'])if(Object.prototype.hasOwnProperty.call(compact.r||{},forbidden))fail('parent-practice',`Parent-link rules leaked display metadata field ${forbidden}`);
  if(compact.u!==schoolKey)fail('school-usage','Opaque school key was not included in the practice payload');
  if(JSON.stringify(compact).includes('Example Primary School'))fail('school-usage','School name leaked into the parent practice token payload');
  const token=ParentPractice.encode(standard),decoded=ParentPractice.decode(token);
  if(token.length>ParentPractice.MAX_TOKEN_LENGTH)fail('parent-practice','Built-in parent practice token exceeds codec size limit',String(token.length));
  if(!stable(decoded.rules,stripParentMeta(base)))fail('parent-practice','Built-in club functional rules do not survive parent-link round trip');
  if(decoded.orientation!=='portrait'||decoded.clubId!=='33')fail('parent-practice','Parent-link identity/layout round trip failed');
  if(decoded.schoolUsageKey!==schoolKey)fail('school-usage','Opaque school key does not survive practice-link round trip');
  const edited=ClubG.normalizeRules({...base,factorMax:9});
  const editedToken=ParentPractice.encode({schemeId:'classic',clubId:'33',rules:edited,orientation:'landscape'});
  const editedDecoded=ParentPractice.decode(editedToken);
  if(Number(editedDecoded.rules.factorMax)!==9||editedDecoded.orientation!=='landscape')fail('parent-practice','Edited school rules do not survive parent-link round trip');
  const leakText=JSON.stringify(ParentPractice.compactPayload({schemeId:'classic',clubId:'33',rules:edited,orientation:'portrait',schoolUsageKey:schoolKey,school:{schoolName:'Example'},teacherNote:'secret',pupilName:'child'}));
  for(const forbidden of ['schoolName','teacherNote','pupilName','logoDataUrl','seed','score','progress'])if(leakText.includes(forbidden))fail('parent-practice',`Parent-link payload leaked forbidden field ${forbidden}`);
  const link=ParentPractice.buildLink(standard,'https://99studio.uk');
  if(!link.startsWith('https://99studio.uk/practice/#p=TT99P1.'))fail('parent-practice','Parent practice link does not use the dedicated fragment route',link.slice(0,90));
  if(link.includes('?'))fail('parent-practice','Parent practice rules should be carried in the URL fragment, not the query string');
  const card=ParentPractice.websiteCardHtml(link,'33 Club','https://99studio.uk/assets/99club/images/33club.png','33 questions · 5 min · Printable worksheet + answers');
  if(!/^<a /.test(card)||/script|iframe/i.test(card)||!card.includes('noopener'))fail('parent-practice','School website card is not a plain safe hyperlink');
  if(!card.includes('33club.png')||!card.includes('33 Club')||!card.includes('Printable worksheet + answers'))fail('parent-practice','School website card is missing its badge/title/summary');
  if(!card.includes('width:100%')||!card.includes('border-radius:14px'))fail('parent-practice','School website card lost its compact card styling');
  const usage=SchoolUsage.practicePayload('practice_download',decoded);
  if(!usage||usage.school_key!==schoolKey||usage.club_id!=='33'||usage.question_count!==33)fail('school-usage','Aggregate practice usage payload is incomplete');
  for(const forbidden of ['school_name','pupil','parent','seed','url','referrer','score'])if(JSON.stringify(usage).includes(forbidden))fail('school-usage',`Practice usage payload leaked forbidden field ${forbidden}`);
  if(SchoolUsage.enabled())fail('school-usage','School telemetry must remain disabled until the final analytics design is approved');
  const schoolUsageConfig=read('assets/99club/school-usage-config.js');
  if(!/enabled:\s*false/.test(schoolUsageConfig)||!/endpoint:\s*''/.test(schoolUsageConfig))fail('school-usage','Dormant school telemetry config is not safely disabled');
  ok('parent-practice','School-selected rule links round-trip with an opaque school key and no school name');
  ok('school-usage','Aggregate school usage schema is wired but network collection remains disabled');
}catch(e){fail('parent-practice','Codec smoke test threw',e.stack||e.message);}

const parentPage=read('_pages/99-club-practice.md');
const parentLayout=read('_layouts/practice.html');
if(!/layout:\s*practice/.test(parentPage)||! /permalink:\s*\/practice\//.test(parentPage))fail('parent-practice','Dedicated parent practice route is not using the standalone practice layout');
if(/<!doctype html>/i.test(parentPage))fail('parent-practice','Practice page must not contain a markdown-rendered doctype');
if(!/^<!doctype html>/i.test(parentLayout.trim()))fail('parent-practice','Standalone practice layout is missing the real document doctype');
if(/analytics|gtag|googletagmanager/i.test(parentLayout))fail('parent-practice','Parent practice layout loads Google Analytics code');
for(const required of ['generator.js','simple-pdf.js','pdf-layout.js','school-usage-config.js','school-usage.js','parent-practice.js','parent-practice-page.js'])if(!parentLayout.includes(required))fail('parent-practice',`Parent practice layout missing ${required}`);
const parentUi=read('assets/99club/parent-practice-page.js');
if(/localStorage|sessionStorage/.test(parentUi))fail('parent-practice','Parent practice page stores browser profile/progress state');
if(!parentUi.includes("kind:'both'")||!parentUi.includes("answerContext:{label:'Answer copy'"))fail('parent-practice','Parent page does not create the promised combined worksheet + answers PDF');
if(!parentUi.includes('G.newSeed'))fail('parent-practice','Parent downloads are not regenerated with fresh questions');
for(const label of ['Bronze Club','Silver Club','Gold Club','Platinum Club','Diamond Club'])if(!parentUi.includes(label))fail('parent-practice',`Parent view is missing proper post-99 label ${label}`);
const rootApp=read('assets/99club/app.js'),rootPage=read('index.md');
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
if(!schoolInfo.includes('normal HTTPS link')||!schoolInfo.includes('plugin')||!schoolInfo.includes('iframe'))fail('parent-practice','Information-for-schools page does not explain the no-integration security model');
if(!schoolInfo.includes('ready-made website card HTML')||!schoolInfo.includes("website's own card or button"))fail('parent-practice','Information-for-schools page does not explain the website-card/plain-link choices');
for(const phrase of ['Option 3: use a downloadable PNG card image','The PNG itself does not contain the clickable link','Save the school\'s club configuration','Download the complete website pack','practice-links.csv','99-club-school-configuration.json','Copy all links','Important when the school changes the rules','Bronze, Silver, Gold, Platinum or Diamond'])if(!schoolInfo.includes(phrase))fail('parent-practice',`School website guide missing: ${phrase}`);
ok('parent-practice','Teacher share UI, stripped parent route, combined PDF and school information contract checked');

/* ---------- output ---------- */
const report={generatedAt:new Date().toISOString(),samplesPerDifficulty:SAMPLES,generated,engineCount:G?.ENGINES?Object.keys(G.ENGINES).length:0,onlineAdapterCount:adapterIds.length,guideCount:guideIds.length,failures,warnings,notes};
const out=path.join(ROOT,'99club-qa-report.json');fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(`\n99 Club QA: ${failures.length} failure(s), ${warnings.length} warning(s). Report: ${path.relative(ROOT,out)}`);
if(failures.length)process.exit(1);
