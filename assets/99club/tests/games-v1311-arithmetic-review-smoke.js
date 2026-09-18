/* 99 Club Studio v1.31.1 Arithmetic & Calculation category review regression. */
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),REPO=path.resolve(ROOT,'../..');
const G=require(path.join(ROOT,'games-engine.js')),A=G.ARITH,L=G.NUMLOGIC,PDF=require(path.join(ROOT,'games-pdf.js'));
function assert(ok,msg){if(!ok)throw new Error(msg);}

// Correct-Answer Maze: the review adds a genuine 10x10 option.
for(let i=0;i<20;i++){
  const a=G.generateActivity('maze',{minYear:5,maxYear:6,topics:['calculation'],engineSettings:{maze:{difficulty:'challenge',gridSize:'10',length:'12'}}},`1311-maze-${i}`);
  assert(!a.error&&a.size===10,'10x10 maze generation failed');
  assert(A.validate(a).ok,'10x10 maze validation failed');
}

// Crossnumber: denser/larger clue ranges, while retaining a valid crossing grid.
for(let i=0;i<30;i++){
  const a=G.generateActivity('crossnumber',{minYear:6,maxYear:6,topics:['calculation','algebra'],engineSettings:{crossnumber:{difficulty:'challenge',clueStyle:'mixed',clueCount:'20',gridSize:'17'}}},`1311-cross-${i}`);
  assert(!a.error,`20-clue crossnumber failed: ${a.error}`);
  assert(a.entries.length>=16,'crossnumber lost too many requested clues');
  assert(A.validate(a).ok,'crossnumber validation failed');
}

// Independent Number Search uniqueness scan. This does not trust the generator's own validate().
const dirs={straight:[[1,0],[0,1]],diagonal:[[1,0],[0,1],[1,1],[-1,1]],all:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]};
function occurrences(grid,word,mode){
  const out=[],n=grid.length;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)for(const [dx,dy] of dirs[mode]){
    const cells=[];let ok=true;
    for(let i=0;i<word.length;i++){const xx=x+dx*i,yy=y+dy*i;if(xx<0||yy<0||xx>=n||yy>=n||String(grid[yy][xx])!==word[i]){ok=false;break;}cells.push([xx,yy]);}
    if(ok)out.push(cells);
  }
  return out;
}
for(const mode of ['straight','diagonal','all'])for(let i=0;i<150;i++){
  const a=G.generateActivity('numbersearch',{minYear:4,maxYear:6,topics:['calculation'],engineSettings:{numbersearch:{difficulty:mode==='all'?'challenge':'standard',directionMode:mode,questionCount:'12',gridSize:'13'}}},`1311-ns-${mode}-${i}`);
  assert(!a.error,'numbersearch generation failed');
  const answers=a.placements.map(p=>String(p.answer));
  assert(new Set(answers).size===answers.length,'numbersearch contains duplicate target answers');
  for(const p of a.placements){
    const hits=occurrences(a.grid,String(p.answer),mode);
    assert(hits.length===1,`numbersearch answer ${p.answer} has ${hits.length} solutions`);
  }
}

// Arithmetic Equation Crossgrid: 5/8/10 grids + true all-four mixed mode.
for(const n of [5,8,10])for(let i=0;i<40;i++){
  const a=G.generateActivity('equationcrossgrid',{minYear:6,maxYear:6,topics:['calculation'],engineSettings:{equationcrossgrid:{difficulty:n===5?'standard':'challenge',gridSize:String(n),operationFamily:n===10?'mixed':'auto',missingLevel:'fewer_clues'}}},`1311-cg-${n}-${i}`);
  assert(!a.error,`crossgrid ${n} failed: ${a.error}`);
  assert(a.size===n&&a.solutionGrid.length===n&&a.solutionGrid.every(r=>r.length===n),`crossgrid ${n} dimensions wrong`);
  assert(a.solutionGrid.flat().includes('#'),`crossgrid ${n} has no blocked cells`);
  assert(A.validate(a).ok,`crossgrid ${n} validation failed`);
  if(n===10)for(const op of ['+','-','×','÷'])assert(a.operationsUsed.includes(op),`mixed 10x10 crossgrid missing ${op}`);
}

// Target Number: operations are now part of the main instruction.
for(let i=0;i<20;i++){
  const a=G.generateActivity('target',{minYear:6,maxYear:6,topics:['calculation'],engineSettings:{target:{difficulty:'challenge',operations:'mixed'}}},`1311-target-${i}`);
  assert(/Allowed operations:/.test(a.instruction)&&a.instruction.includes('×')&&a.instruction.includes('÷'),'target instruction does not prominently state operations');
}

// Operation Codebreaker retains mathematically unique locks and a final code.
for(let i=0;i<80;i++){
  const a=G.generateActivity('operationgrid',{minYear:5,maxYear:6,topics:['calculation'],engineSettings:{operationgrid:{difficulty:'challenge',operations:'four',rowCount:'8'}}},`1311-code-${i}`);
  assert(a.title==='Operation Codebreaker','codebreaker title missing');
  assert(A.validate(a).ok,'codebreaker row validation failed');
  assert(a.code.length===a.rows.reduce((s,r)=>s+r.ops.length,0),'codebreaker final code length mismatch');
}

// Kakuro 9x9 is available and remains uniquely solvable.
for(let i=0;i<2;i++){
  const a=G.generateActivity('kakuro',{minYear:6,maxYear:6,topics:['calculation'],engineSettings:{kakuro:{difficulty:'challenge',gridSize:'9',givenLevel:'balanced'}}},`1311-kakuro9-${i}`);
  assert(!a.error&&a.size===9,`9x9 Kakuro failed: ${a.error}`);
  assert(L.validate(a).ok,'9x9 Kakuro is not valid/unique');
}

// Source-level visual invariants for the review fixes.
const app=fs.readFileSync(path.join(ROOT,'games-app.js'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'games.css'),'utf8');
const pdf=fs.readFileSync(path.join(ROOT,'games-pdf.js'),'utf8');
const page=fs.readFileSync(path.join(REPO,'_pages','99-club-games.md'),'utf8');
assert(app.includes('viewBox="-8 -8 116 116"'),'Magic Shape star safe viewBox missing');
assert(pdf.includes('pad=nodeR+3,drawSize=Math.max'),'Magic Shape PDF safe bound padding missing');
assert(app.includes('tt99-operation-locks')&&css.includes('.tt99-op-slot'),'Operation Codebreaker visual slots missing');
assert(!/drawOperationGrid[\s\S]{0,900}text=text\.replace\('□'/.test(pdf),'PDF Codebreaker still falls back to text/question marks');
assert(css.includes('.tt99-kakuro-grid .block{background:#344c52!important;border-color:#344c52!important}'),'Kakuro blocked-cell contrast missing');
assert(pdf.includes('BLOCK=[52,76,82]'),'Kakuro PDF blocked cells are not dark');
assert(css.includes('border:.7px solid #a9b9bc!important'),'Arithmetic Cage internal grid contrast missing');
assert(pdf.includes('stroke:[170,186,189],width:.55'),'Arithmetic Cage PDF internal grid contrast missing');
assert(app.includes('items-${a.items.length}')&&css.includes('.tt99-wheel-items.visual.items-6'),'six-item Number Connections layout hook missing');
assert(/a\.items\.length===6\?3/.test(pdf),'six-wheel PDF 3x2 layout missing');
assert(css.includes('repeat(var(--crossgrid-size,5),1fr)'),'variable-size Crossgrid CSS missing');
assert(/games\.css\?v=(?:19|[2-9]\d)/.test(page)&&/games-arithmetic\.js\?v=(?:[5-9]|[1-9]\d)/.test(page)&&/games-number-logic\.js\?v=(?:[3-9]|[1-9]\d)/.test(page)&&/games-pdf\.js\?v=(?:1[6-9]|[2-9]\d)/.test(page)&&/games-app\.js\?v=(?:1[8-9]|[2-9]\d)/.test(page),'v1.31.1-or-later cache versions missing');

// Representative direct-PDF generation across the reviewed activities.
const settings={minYear:6,maxYear:6,topics:['calculation','algebra'],workedExamples:'none',personalisation:{packTitle:'Arithmetic review QA'}};
const activities=[
  G.generateActivity('maze',{...settings,engineSettings:{maze:{difficulty:'challenge',gridSize:'10',length:'12'}}},'1311-pdf-maze'),
  G.generateActivity('crossnumber',{...settings,engineSettings:{crossnumber:{difficulty:'challenge',clueStyle:'mixed',clueCount:'20',gridSize:'17'}}},'1311-pdf-cross'),
  G.generateActivity('target',{...settings,engineSettings:{target:{difficulty:'challenge',operations:'mixed'}}},'1311-pdf-target'),
  G.generateActivity('brokencalc',{...settings,engineSettings:{brokencalc:{difficulty:'challenge',targets:'4'}}},'1311-pdf-broken'),
  G.generateActivity('operationgrid',{...settings,engineSettings:{operationgrid:{difficulty:'challenge',operations:'four',rowCount:'8'}}},'1311-pdf-code'),
  G.generateActivity('equationcrossgrid',{...settings,engineSettings:{equationcrossgrid:{difficulty:'challenge',gridSize:'10',operationFamily:'mixed',missingLevel:'balanced'}}},'1311-pdf-crossgrid'),
  G.generateActivity('kakuro',{...settings,engineSettings:{kakuro:{difficulty:'challenge',gridSize:'9',givenLevel:'balanced'}}},'1311-pdf-kakuro'),
  G.generateActivity('arithmeticcages',{...settings,engineSettings:{arithmeticcages:{difficulty:'challenge',gridSize:'6',operations:'mixed'}}},'1311-pdf-cages'),
  G.generateActivity('numberwheels',{...settings,engineSettings:{numberwheels:{difficulty:'challenge',style:'wheel',itemCount:'6'}}},'1311-pdf-wheels'),
  G.generateActivity('magicshape',{...settings,engineSettings:{magicshape:{difficulty:'challenge',shape:'star',puzzleType:'missing',clueLevel:'fewer'}}},'1311-pdf-star')
];
const sheets=[];for(let i=0;i<activities.length;i+=2)sheets.push({index:sheets.length+1,activities:activities.slice(i,i+2)});
for(const kind of ['student','answers']){
  const doc=PDF.buildDocument({pack:{seed:'1311-pdf',sheets},settings,topics:G.TOPICS,kind});
  const bytes=doc.outputBytes();assert(bytes.length>15000,`${kind} arithmetic-review PDF unexpectedly small`);
  assert(Buffer.from(bytes).subarray(0,5).toString()==='%PDF-',`${kind} arithmetic-review export invalid`);
}
console.log('v1.31.1 Arithmetic & Calculation category review regression passed.');
