/* 99 Club Studio v1.32.3 crossgrid / nonogram usability regression. */
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
function assert(ok,msg){if(!ok)throw new Error(msg);}

const A=require(path.join(ROOT,'games-arithmetic.js'));
require(path.join(ROOT,'games-crossgrid-v1321.js'));
assert(global.TT99ArithmeticGames===A,'Crossgrid patch did not attach to arithmetic module');

const crossDef=A.DEFINITIONS.equationcrossgrid;
const gridField=crossDef.settingsSchema.find(x=>x.id==='gridSize');
const missingTypeField=crossDef.settingsSchema.find(x=>x.id==='missingType');
assert(gridField,'Crossgrid grid-size setting missing');
assert(missingTypeField,'Crossgrid missing-cell type setting missing');
assert(JSON.stringify(gridField.options.map(x=>x.value))===JSON.stringify(['auto','5','7','9']),'Crossgrid must expose true odd active sizes 5×5, 7×7 and 9×9');
assert(missingTypeField.options.some(x=>x.value==='numbers')&&missingTypeField.options.some(x=>x.value==='numbers_operators'),'Crossgrid missing-cell modes incomplete');

function makeCrossSettings(difficulty,gridSize,missingType){
  return {minYear:6,maxYear:6,topics:['calculation'],engineSettings:{equationcrossgrid:{difficulty,gridSize,operationFamily:'mixed',missingLevel:'fewer_clues',missingType}}};
}
for(const [difficulty,size] of [['easy',5],['standard',7],['challenge',9]]){
  let puzzle=null;
  for(let i=0;i<100&&!puzzle;i++){
    const a=A.generate('equationcrossgrid',makeCrossSettings(difficulty,String(size),'numbers'),`v1323-size-${size}:${i}`);
    if(!a?.error)puzzle=a;
  }
  assert(puzzle,`Could not generate a full ${size}×${size} active crossgrid`);
  assert(puzzle.size===size,`Requested ${size}×${size} but engine returned ${puzzle.size}×${puzzle.size}`);
  assert(puzzle.solutionGrid.length===size&&puzzle.solutionGrid.every(row=>row.length===size),`${size}×${size} crossgrid matrix shape mismatch`);
  const used=[];
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(puzzle.solutionGrid[r][c]!=='#')used.push([r,c]);
  const rows=used.map(p=>p[0]),cols=used.map(p=>p[1]);
  assert(Math.min(...rows)===0&&Math.max(...rows)===size-1,`${size}×${size} crossgrid has a permanently black top/bottom border`);
  assert(Math.min(...cols)===0&&Math.max(...cols)===size-1,`${size}×${size} crossgrid has a permanently black left/right border`);
  assert(!(puzzle.hiddenKeys||[]).some(k=>{const [r,c]=k.split(':').map(Number);return ['+','-','×','÷'].includes(puzzle.solutionGrid[r][c]);}),'Numbers-only mode hid an operation sign');
  assert(A.validate(puzzle).ok,`${size}×${size} crossgrid failed arithmetic validation`);
}

let operatorPuzzle=null;
for(let i=0;i<120&&!operatorPuzzle;i++){
  const a=A.generate('equationcrossgrid',makeCrossSettings('challenge','9','numbers_operators'),`v1323-crossgrid:${i}`);
  if(a?.hiddenOperatorKeys?.length)operatorPuzzle=a;
}
assert(operatorPuzzle,'Could not generate a 9×9 crossgrid with a hidden operator');
assert(operatorPuzzle.size===9,'Challenge Crossgrid did not return a true 9×9 active grid');
assert(operatorPuzzle.instruction.includes('small ? in a corner'),'Crossgrid instruction does not explain the corner question mark');
for(const k of operatorPuzzle.hiddenOperatorKeys){
  assert((operatorPuzzle.hiddenKeys||[]).includes(k),`Hidden operator ${k} is not hidden`);
  const [r,c]=k.split(':').map(Number);
  assert(['+','-','×','÷'].includes(operatorPuzzle.solutionGrid[r][c]),`Hidden operator metadata points at ${operatorPuzzle.solutionGrid[r][c]}`);
}
const ex=A.workedExample('equationcrossgrid');
assert(ex.rules.some(x=>/small \?/i.test(x)),'Worked example does not explain the small question mark');

require(path.join(ROOT,'simple-pdf.js'));
require(path.join(ROOT,'games-pdf.js'));
require(path.join(ROOT,'games-layout-v1321.js'));
const PDF=global.TT99GamesPDF;
assert(PDF?.__layoutV1321,'PDF layout patch did not attach');

const n=10,nonogram={
  engineId:'nonogram',title:'Number Picture',difficulty:'standard',size:n,
  instruction:'Use the clues to decide which squares to shade. Each number is a consecutive block; separate blocks with at least one empty square.',
  rowClues:[[1,1,1,1],[2,1,1,2],[2,2],[3,3],[1,1],[1,1,1,1],[4,4],[1,1,1,1],[2,4,2],[1,1]],
  colClues:[[2,1,4],[3,1,1],[1,2],[2,1,2],[1,4],[1],[1,4],[2,2],[3,1,1],[2,1,4]],
  solutionGrid:Array.from({length:n},()=>Array(n).fill(0))
};
const settings={minYear:4,maxYear:6,topics:['number_place_value'],workedExamples:'none',personalisation:{packTitle:'QA'}};
const doc=PDF.buildDocument({pack:{seed:'QA',sheets:[{index:1,activities:[nonogram]}]},settings,topics:{number_place_value:{label:'Number & place value'}},kind:'student',seed:'QA'});
const commands=doc.pages[0].cmds.join('\n');
assert(commands.includes('(1)'),'Redrawn nonogram row-clue digits missing from direct PDF commands');
assert(!commands.includes('(1 1 1 1)'),'Nonogram row clues should be emitted in fixed individual slots, not as one unaligned text string');
assert(commands.includes('1.45 w'),'Redrawn nonogram outer frame missing from direct PDF commands');
const layout=global.TT99GamesLayoutV1321;
const g=layout.nonogramGeometry(nonogram,34,110,527.28,689.89);
assert(g.gx-g.rowW>=34,`Nonogram left clue area escapes frame: ${g.gx-g.rowW}`);
assert(g.gx+n*g.cell<=595.28-34+.01,'Nonogram grid escapes right activity edge');
assert(g.gy-g.topClueH>=g.overlayTop-.01,'Nonogram top clues overlap instruction area');
assert(g.rowGap>=14,'Nonogram row clues do not keep a deliberate gap from the grid');
const lastOfFour=layout.rowClueX(g,4,3),single=layout.rowClueX(g,1,0);
assert(Math.abs(lastOfFour-single)<.001,'Nonogram row-clue groups are not right-aligned to a common final clue column');
assert(g.gx-lastOfFour>=g.rowGap+g.rowSlotW*.49,'Nonogram last row clue sits too close to the grid');
for(let k=1;k<4;k++)assert(layout.rowClueX(g,4,k)-layout.rowClueX(g,4,k-1)>=g.rowSlotW-.001,'Nonogram row-clue slots are collapsing together');

const crossDoc=PDF.buildDocument({pack:{seed:'QA2',sheets:[{index:1,activities:[operatorPuzzle]}]},settings,topics:{calculation:{label:'Calculation'}},kind:'student',seed:'QA2'});
assert(crossDoc.pages[0].cmds.join('\n').includes('(?)'),'Direct PDF does not draw the small corner question mark for a hidden operator');

const page=fs.readFileSync(path.resolve(ROOT,'../../_pages/99-club-games.md'),'utf8');
assert(page.includes('games-crossgrid-v1321.js?v=2'),'Games page does not load current crossgrid patch');
assert(page.includes('games-layout-v1321.css?v=1')&&page.includes('games-layout-v1321.js?v=2'),'Games page does not load current layout assets');
const css=fs.readFileSync(path.join(ROOT,'games-layout-v1321.css'),'utf8');
assert(css.includes('.pixel.ng-frame-top')&&css.includes('.pixel.ng-frame-left'),'Browser nonogram outer-frame rules missing');

console.log(`Games v1.32.3 layout regression: PASS · true 5×5 / 7×7 / 9×9 Crossgrids, numbers-only and operator-missing modes, aligned Nonogram clues.`);
