/* 99 Club Studio v1.30.0 Number Patterns & Structures regression. */
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const G=require(path.join(ROOT,'games-engine.js')),A=G.ARITH;
function assert(ok,msg){if(!ok)throw new Error(msg);}

assert(G.VERSION==='1.9.0','wrong core Games version');
assert(A&&A.VERSION==='1.2.0','wrong arithmetic module version');

// Number Pyramids: explicit 3-7 levels, tall pyramids stay numerically friendly,
// and the visible clues still determine the whole bottom row uniquely.
for(let levels=3;levels<=7;levels++)for(let i=0;i<80;i++){
  const a=G.generateNumberPyramid({minYear:5,maxYear:6,topics:['calculation'],engineSettings:{pyramid:{difficulty:'challenge',levels:String(levels),clueLevel:'balanced'}}},`v130-pyramid-${levels}-${i}`);
  assert(a.rows.length===levels,`pyramid ${levels}: wrong level count`);
  const bottom=a.rows.at(-1);if(levels===6)assert(Math.max(...bottom)<=12,'6-level pyramid base too large');if(levels===7)assert(Math.max(...bottom)<=8,'7-level pyramid base too large');
  const coeff=G._pyramidCoefficientRows(levels),missing=new Set(a.missingSet||[]),visible=[];
  for(let r=0;r<coeff.length;r++)for(let c=0;c<coeff[r].length;c++)if(!missing.has(`${r}:${c}`))visible.push(coeff[r][c]);
  assert(G._matrixRank(visible)===levels,`pyramid ${levels}: visible clues are not uniquely determining`);
  if(levels===7)assert((a.missingSet||[]).length<=10,'7-level pyramid hides too many cells');
}
const autoExpect=[
  [1,'easy',3],[3,'easy',4],[3,'standard',4],[4,'standard',5],[3,'challenge',5],[4,'challenge',6],[5,'challenge',7],[6,'challenge',7]
];
for(const [year,difficulty,expected] of autoExpect){const a=G.generateNumberPyramid({minYear:year,maxYear:year,topics:['calculation'],engineSettings:{pyramid:{difficulty,levels:'auto',clueLevel:'balanced'}}},`v130-pyramid-auto-${year}-${difficulty}`);assert(a.rows.length===expected,`pyramid auto Y${year}/${difficulty}: expected ${expected}, got ${a.rows.length}`);}

// Arithmagons: larger polygons, mixed-within operations, diagonals and genuine blank nodes.
for(const shape of ['triangle','square','pentagon','hexagon'])for(let i=0;i<80;i++){
  const a=G.generateActivity('arithmagon',{minYear:4,maxYear:6,topics:['calculation'],engineSettings:{arithmagon:{difficulty:'challenge',shape,operation:'mixed_within',connections:shape==='triangle'?'sides':'diagonals',missing:'fewer_clues'}}},`v130-arith-${shape}-${i}`);
  assert(A.validate(a).ok,`arithmagon ${shape}: invalid`);
  assert(a.links.some(x=>x.operation==='add')&&a.links.some(x=>x.operation==='multiply'),`arithmagon ${shape}: mixed-within missing one operation`);
  if(shape!=='triangle')assert(a.links.some(x=>x.diagonal),`arithmagon ${shape}: diagonal missing`);
  assert(a.displayCorners.some(v=>v===null)||a.displayLinks.some(v=>v===null),`arithmagon ${shape}: no writable blank`);
}
// Auto operation is an exact across-pack mix, not a probability gamble.
const pack=G.generatePack({minYear:4,maxYear:4,topics:['calculation'],sheets:10,activitiesPerSheet:2,selectedEngines:['arithmagon'],engineSettings:{arithmagon:{difficulty:'standard',shape:'triangle',operation:'auto',connections:'sides',missing:'balanced'}}},'v130-arith-pack');
const modes=pack.sheets.flatMap(s=>s.activities).map(a=>a.operationMode),adds=modes.filter(x=>x==='add').length,mults=modes.filter(x=>x==='multiply').length;
assert(adds===10&&mults===10,`arithmagon auto pack should be 10 add / 10 multiply, got ${adds}/${mults}`);
const y1=G.generatePack({minYear:1,maxYear:1,topics:['calculation'],sheets:5,activitiesPerSheet:2,selectedEngines:['arithmagon'],engineSettings:{arithmagon:{difficulty:'standard',operation:'auto'}}},'v130-arith-y1');
assert(y1.sheets.flatMap(s=>s.activities).every(a=>a.operationMode==='add'),'Y1 auto arithmagons must remain addition-only');

// Magic Number Shapes: the new bow-tie family is truly magic; repair identifies one wrong value.
for(let i=0;i<160;i++){
  const a=G.generateActivity('magicshape',{minYear:4,maxYear:6,topics:['calculation'],engineSettings:{magicshape:{difficulty:'challenge',shape:'bowtie',puzzleType:i%2?'repair':'missing',clueLevel:'fewer'}}},`v130-bowtie-${i}`);
  assert(A.validate(a).ok,'bow-tie magic shape failed invariant');
  if(a.puzzleType==='repair'){assert(a.brokenIndex!==null&&a.displayValues[a.brokenIndex]!==a.solutionValues[a.brokenIndex],'repair must show one wrong value');}
}

// Number Trails deliberately remain stable.
for(let i=0;i<100;i++){const a=G.generateActivity('numbertrail',{minYear:3,maxYear:5,topics:['number_place_value'],engineSettings:{numbertrail:{difficulty:'standard',length:'20',ruleMode:'auto',clueLevel:'balanced'}}},`v130-trail-${i}`);assert(A.validate(a).ok,'number trail regression');}

// Number Connections: new naming and stronger subtype contracts.
assert(G.ENGINES.numberwheels.title==='Number Connections','Number Connections rename missing');
for(const style of ['wheel','factor','diamond'])for(let i=0;i<120;i++){
  const a=G.generateActivity('numberwheels',{minYear:4,maxYear:6,topics:['calculation'],engineSettings:{numberwheels:{difficulty:'challenge',style,itemCount:'4'}}},`v130-connections-${style}-${i}`);
  assert(A.validate(a).ok,`Number Connections ${style}: invariant failed`);
  assert(a.title===(style==='wheel'?'Rule Wheels':style==='factor'?'Factor Pair Webs':'Sum & Product Diamonds'),`Number Connections ${style}: subtype title wrong`);
  for(const item of a.items){
    if(style==='wheel')assert(item.displayInputs.some(v=>v===null)&&item.displayOutputs.some(v=>v===null),'Challenge rule wheel should include inverse and forward blanks');
    if(style==='factor'&&item.mode==='find_centre')assert(item.displayCentre===null&&item.displayPairs.some(p=>p[0]!=null),'Find-centre factor web needs shown evidence');
    if(style==='diamond')assert(item.hidden.includes('left')&&item.hidden.includes('right')&&item.orderIrrelevant,'Challenge diamond should deduce the side pair from sum/product');
  }
}

// Renderers: writable diagram nodes must be blank, and answer-fill differentiation must exist
// in both browser/print styling and the direct-PDF path.
const app=fs.readFileSync(path.join(ROOT,'games-app.js'),'utf8'),pdf=fs.readFileSync(path.join(ROOT,'games-pdf.js'),'utf8'),css=fs.readFileSync(path.join(ROOT,'games.css'),'utf8');
assert(!/displayLinks\[i\]==null\?'\?'/.test(app),'Arithmagon browser blanks still show question marks');
assert(!/displayOutputs\[j\]\?\?'\?'/.test(pdf),'Rule-wheel PDF blanks still show question marks');
assert(/function drawNodeBox[\s\S]*?text===null[\s\S]*?if\(!isBlank\)/.test(pdf),'PDF node boxes are not truly blank when writable');
assert(/answer-fill/.test(app)&&/answer-fill/.test(css),'browser answer-fill convention missing');
assert(/answerFill\?HIT/.test(pdf)&&/answerFill\?TEAL/.test(pdf),'PDF answer-fill convention missing');

console.log('Number Patterns & Structures v1.30.0 regression passed.');
