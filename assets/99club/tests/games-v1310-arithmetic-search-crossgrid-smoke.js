/* 99 Club Studio v1.31.0 arithmetic search/crossgrid regression. */
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),REPO=path.resolve(ROOT,'../..');
const G=require(path.join(ROOT,'games-engine.js')),A=G.ARITH,GPDF=require(path.join(ROOT,'games-pdf.js'));
function assert(ok,msg){if(!ok)throw new Error(msg);}

for(const id of ['numbersearch','equationcrossgrid'])assert(A.DEFINITIONS[id],`${id}: definition missing`);
assert(A.DEFINITIONS.crossnumber.defaultSettings.clueStyle==='auto','crossnumber clueStyle default missing');

for(const style of ['arithmetic','equations','mixed']){
  for(let i=0;i<80;i++){
    const a=G.generateActivity('crossnumber',{minYear:6,maxYear:6,topics:['calculation','algebra'],engineSettings:{crossnumber:{difficulty:'standard',clueStyle:style,clueCount:'8',gridSize:'13'}}},`v1310-cross-${style}-${i}`);
    assert(!a.error,`crossnumber ${style}: ${a.error}`);assert(A.validate(a).ok,`crossnumber ${style}: invalid`);
    if(style==='equations')assert(a.entries.every(e=>e.clueKind==='equation'),'equation crossnumber leaked arithmetic clue');
    if(style==='arithmetic')assert(a.entries.every(e=>e.clueKind==='arithmetic'||e.topic==='algebra'),'arithmetic crossnumber unexpected clue kind');
  }
}
let mixedKinds=new Set();for(let i=0;i<30;i++){const a=G.generateActivity('crossnumber',{minYear:6,maxYear:6,topics:['calculation'],engineSettings:{crossnumber:{difficulty:'standard',clueStyle:'mixed',clueCount:'10',gridSize:'15'}}},`v1310-mixed-${i}`);for(const e of a.entries)mixedKinds.add(e.clueKind);}assert(mixedKinds.has('equation')&&mixedKinds.has('arithmetic'),'mixed crossnumber did not exercise both clue families');

const allowed={straight:new Set(['1,0','0,1']),diagonal:new Set(['1,0','0,1','1,1','-1,1']),all:new Set(['1,0','-1,0','0,1','0,-1','1,1','-1,1','1,-1','-1,-1'])};
for(const mode of Object.keys(allowed))for(let i=0;i<120;i++){
  const a=G.generateActivity('numbersearch',{minYear:4,maxYear:6,topics:['calculation'],engineSettings:{numbersearch:{difficulty:mode==='all'?'challenge':'standard',directionMode:mode,questionCount:'10',gridSize:'13'}}},`v1310-ns-${mode}-${i}`);
  assert(!a.error,`numbersearch ${mode}: ${a.error}`);assert(a.placements.length===10,`numbersearch ${mode}: lost placements`);assert(A.validate(a).ok,`numbersearch ${mode}: validation failed`);
  for(const q of a.placements){assert(q.cells.length===String(q.answer).length,'numbersearch answer length mismatch');if(q.cells.length>1){const dx=q.cells[1][0]-q.cells[0][0],dy=q.cells[1][1]-q.cells[0][1];assert(allowed[mode].has(`${dx},${dy}`),`numbersearch ${mode}: illegal direction ${dx},${dy}`);}}
}

for(const family of ['additive','multiplicative'])for(const difficulty of ['easy','standard','challenge'])for(let i=0;i<180;i++){
  const a=G.generateActivity('equationcrossgrid',{minYear:4,maxYear:6,topics:['calculation'],engineSettings:{equationcrossgrid:{difficulty,gridSize:'5',operationFamily:family,missingLevel:'auto'}}},`v1310-cg-${family}-${difficulty}-${i}`);
  const valid=A.validate(a);assert(valid.ok,`crossgrid ${family}/${difficulty}: ${valid.error}`);assert(a.solutionGrid.length===5&&a.solutionGrid.every(r=>r.length===5),'crossgrid wrong dimensions');assert(a.hiddenKeys.length>=3,'crossgrid too few blanks');for(const key of a.hiddenKeys){const [r,c]=key.split(':').map(Number);assert(a.displayGrid[r][c]===null,`crossgrid hidden key ${key} still visible`);}
  if(difficulty==='easy')assert(a.hiddenKeys.every(k=>{const [r,c]=k.split(':').map(Number);return typeof a.solutionGrid[r][c]==='number';}),'easy crossgrid should hide numbers only');
}

const settings={minYear:6,maxYear:6,topics:['calculation','algebra'],personalisation:{packTitle:'Arithmetic Search QA'},workedExamples:'none'};
const activities=[
  G.generateActivity('numbersearch',{...settings,engineSettings:{numbersearch:{difficulty:'standard',directionMode:'diagonal',questionCount:'10',gridSize:'11'}}},'v1310-pdf-ns'),
  G.generateActivity('equationcrossgrid',{...settings,engineSettings:{equationcrossgrid:{difficulty:'challenge',operationFamily:'auto',missingLevel:'fewer_clues'}}},'v1310-pdf-cg')
];
const doc=GPDF.buildDocument({pack:{seed:'v1310-pdf',sheets:[{index:1,activities}]},settings,topics:G.TOPICS,kind:'both'});const bytes=doc.outputBytes();assert(bytes.length>5000,'v1.31 PDF output unexpectedly small');assert(Buffer.from(bytes).subarray(0,8).toString('latin1').startsWith('%PDF-1.'),'v1.31 PDF header invalid');

const app=fs.readFileSync(path.join(ROOT,'games-app.js'),'utf8'),pdf=fs.readFileSync(path.join(ROOT,'games-pdf.js'),'utf8'),css=fs.readFileSync(path.join(ROOT,'games.css'),'utf8'),page=fs.readFileSync(path.join(REPO,'_pages','99-club-games.md'),'utf8');
assert(app.includes("'numbersearch','equationcrossgrid'"),'Arithmetic category does not expose the two new engines');assert(app.includes('renderNumberSearch')&&app.includes('renderEquationCrossgrid'),'browser renderers missing');assert(pdf.includes('drawNumberSearch')&&pdf.includes('drawEquationCrossgrid'),'PDF renderers missing');assert(css.includes('.tt99-numbersearch-grid')&&css.includes('.tt99-equation-crossgrid'),'new engine CSS missing');assert(/games-arithmetic\.js\?v=(?:[5-9]|[1-9]\d+)/.test(page)&&/games\.css\?v=(?:19|[2-9]\d)/.test(page)&&/games-pdf\.js\?v=(?:1[6-9]|[2-9]\d)/.test(page)&&/games-app\.js\?v=(?:1[8-9]|[2-9]\d)/.test(page),'v1.31-or-later cache-busts missing');
console.log('v1.31 arithmetic search/crossgrid smoke passed.');
