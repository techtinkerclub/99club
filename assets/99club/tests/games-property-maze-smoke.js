/* 99 Club Studio · Number Property Maze regression. */
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
function assert(ok,msg){if(!ok)throw new Error(msg);}

const A=require(path.join(ROOT,'games-arithmetic.js'));
require(path.join(ROOT,'games-property-maze.js'));
assert(A.PROPERTY_MAZE?.VERSION==='1.0.0','Property Maze patch did not attach');
assert(A.DEFINITIONS.propertymaze?.title==='Number Property Maze','Property Maze definition missing');

const modes=['prime','factor','multiple','divisible','square','common_factor','common_multiple'];
for(const mode of modes){
  for(const difficulty of ['easy','standard','challenge']){
    if((mode==='common_factor'||mode==='common_multiple')&&difficulty==='easy')continue;
    const gridSize=difficulty==='easy'?'5':difficulty==='challenge'?'7':'6';
    for(let i=0;i<5;i++){
      const settings={minYear:4,maxYear:6,topics:['number_place_value','calculation'],engineSettings:{propertymaze:{difficulty,gridSize,propertyMode:mode}}};
      const seed=`property-${mode}-${difficulty}-${i}`;
      const a=A.generate('propertymaze',settings,seed);
      assert(!a.error,`${mode}/${difficulty} generation failed: ${a.error}`);
      assert(a.size===Number(gridSize),`${mode}/${difficulty} size mismatch`);
      const v=A.validate(a);assert(v.ok,`${mode}/${difficulty} validation failed: ${v.error}`);
      assert(a.solutionPath.length>=7,`${mode}/${difficulty} route is too short`);
      assert(a.solutionKeys.length===a.solutionPath.length,`${mode}/${difficulty} answer-key mismatch`);
      assert(A.PROPERTY_MAZE.matchesRule(a.grid[a.start[0]][a.start[1]],a.rule),`${mode}/${difficulty} START does not match rule`);
      assert(A.PROPERTY_MAZE.matchesRule(a.grid[a.finish[0]][a.finish[1]],a.rule),`${mode}/${difficulty} FINISH does not match rule`);
      if(difficulty!=='easy')assert(a.deadEndCount>=1,`${mode}/${difficulty} should contain at least one matching dead end`);
      const again=A.generate('propertymaze',settings,seed);
      assert(JSON.stringify(a)===JSON.stringify(again),`${mode}/${difficulty} is not deterministic`);
    }
  }
}

// Auto progression and curriculum-sensitive modes.
for(const [difficulty,size] of [['easy',5],['standard',6],['challenge',7]]){
  const settings={minYear:5,maxYear:6,topics:['number_place_value'],engineSettings:{propertymaze:{difficulty,gridSize:'auto',propertyMode:'auto'}}};
  const a=A.generate('propertymaze',settings,`auto-${difficulty}`);
  assert(!a.error,`Auto ${difficulty} failed`);assert(a.size===size,`Auto ${difficulty} expected ${size}×${size}`);assert(A.validate(a).ok,`Auto ${difficulty} validation failed`);
}

// Ensure the main Games engine sees the late-added arithmetic engine when loaded in page order.
const G=require(path.join(ROOT,'games-engine.js'));
assert(G.ENGINES.propertymaze,'Main engine registry does not expose Property Maze');
const gSettings=G.normalizeSettings({minYear:5,maxYear:6,topics:['number_place_value'],sheets:1,activitiesPerSheet:1,selectedEngines:['propertymaze'],engineSettings:{propertymaze:{difficulty:'standard',gridSize:'6',propertyMode:'prime'}}});
const generated=G.generateActivity('propertymaze',gSettings,'engine-integration');
assert(generated.engineId==='propertymaze'&&!generated.error,'Main engine cannot generate Property Maze');
assert(A.validate(generated).ok,'Main-engine Property Maze failed validation');

// Preview integration: renderer classes and stylesheet selectors must remain in lock-step.
const app=fs.readFileSync(path.join(ROOT,'games-app.js'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'games-property-maze.css'),'utf8');
assert(app.includes("engines:['maze','propertymaze'"),'Property Maze missing from the Arithmetic category');
assert(app.includes('function renderPropertyMaze(')&&app.includes("a.engineId==='propertymaze'"),'Property Maze browser renderer missing');
for(const cls of ['tt99-propertymaze-layout','tt99-propertymaze-grid','tt99-propertymaze-cell','tt99-propertymaze-side']){
  assert(app.includes(cls),`Property Maze renderer no longer emits ${cls}`);
  assert(css.includes(`.${cls}`),`Property Maze stylesheet does not style ${cls}`);
}
assert(/\.tt99-propertymaze-grid\s*\{[^}]*display:grid/.test(css),'Property Maze grid is not explicitly rendered as CSS grid');
assert(css.includes('repeat(var(--propertymaze-size),1fr)'),'Property Maze grid does not honour the generated maze size');
assert(/\.tt99-propertymaze-cell\s*\{[^}]*display:grid/.test(css),'Property Maze cells do not have explicit cell layout');

// PDF integration remains independent of browser preview styling.
require(path.join(ROOT,'simple-pdf.js'));
require(path.join(ROOT,'games-pdf.js'));
const PDF=global.TT99GamesPDF;
const doc=PDF.buildDocument({pack:{seed:'PM-QA',sheets:[{index:1,activities:[generated]}]},settings:gSettings,topics:G.TOPICS,kind:'both',seed:'PM-QA'});
assert(doc.pages.length===2,'Property Maze pupil+answer PDF should contain two pages');
const commands=doc.pages.map(p=>p.cmds.join('\n')).join('\n');
assert(commands.includes('(Rule)')&&commands.includes('(START)')&&commands.includes('(FINISH)'),'Property Maze PDF renderer is incomplete');
fs.writeFileSync('/tmp/property-maze-qa.pdf',Buffer.from(doc.outputBytes()));

const page=fs.readFileSync(path.resolve(ROOT,'../../_pages/99-club-games.md'),'utf8');
assert(page.includes('games-property-maze.js?v=1'),'Games page does not load Property Maze engine');
assert(page.includes('games-property-maze.css?v=2'),'Games page does not load the repaired Property Maze styles');
console.log('Games v1.33.1 Number Property Maze regression: PASS · generation, unique routes, preview class/CSS contract and PDF integration.');
