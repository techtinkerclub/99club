require('../simple-pdf.js');
require('../games-vocabulary.js');
require('../games-arithmetic.js');
require('../games-balance-lab-v192.js');
require('../games-number-logic.js');
require('../games-engine.js');
require('../games-puzzle-redesign-v135-logic.js');
require('../games-pdf.js');
require('../games-pdf-v136.js');
const fs=require('fs');
const G=global.TT99Games,PDF=global.TT99GamesPDF;
function value(expr){
  const js=String(expr).replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
  if(!/^[0-9+\-*/ ().]+$/.test(js))throw new Error(`unsafe expression ${expr}`);
  return Function(`return (${js})`)();
}
function validateActivity(a){
  const paper=a.paper;if(!paper)throw new Error('missing paper payload');
  if(paper.rows.length!==4)throw new Error('paper Balance Lab must contain exactly four weights');
  const final=paper.finalChallenge;if(!final||final.solutionSides.length!==4)throw new Error('missing final paper balance');
  paper.rows.forEach((r,i)=>{
    if((r.display.match(/□/g)||[]).length!==1)throw new Error('paper row must contain one weight slot');
    const sides=r.solution.split(' = ');if(sides.length!==2)throw new Error('bad equation');
    if(!/[+×÷−]/.test(sides[0])||!/[+×÷−]/.test(sides[1]))throw new Error(`operations missing on both sides: ${r.solution}`);
    const l=value(sides[0]),rr=value(sides[1]);if(Math.abs(l-rr)>1e-9)throw new Error(`unbalanced paper equation: ${r.solution}`);
    if(Number(r.answer)!==Number(final.weights[i]))throw new Error('paper result does not match final weight');
  });
  const left=paper.rows.reduce((s,r,i)=>s+(final.solutionSides[i]==='L'?Number(r.answer):0),0);
  const right=paper.rows.reduce((s,r,i)=>s+(final.solutionSides[i]==='R'?Number(r.answer):0),0);
  if(left!==right||left!==Number(final.target))throw new Error(`final scale invalid ${left} vs ${right} target ${final.target}`);
  if(final.solutionSides.filter(x=>x==='L').length!==2||final.solutionSides.filter(x=>x==='R').length!==2)throw new Error('final scale must use two weights per pan');
}
for(const difficulty of ['easy','standard','challenge']){
  for(let seed=0;seed<40;seed++){
    const settings=G.normalizeSettings({minYear:4,maxYear:6,topics:['calculation','algebra'],sheets:1,activitiesPerSheet:2,selectedEngines:['balance'],includeAnswers:true,engineSettings:{balance:{difficulty,rowCount:'auto',style:'auto'}}});
    const pack=G.generatePack(settings,`paper-v194-${difficulty}-${seed}`);
    if(pack.sheets[0].activities.length!==2)throw new Error('expected two activities per sheet');
    pack.sheets[0].activities.forEach(validateActivity);
    if(seed===0){
      const doc=PDF.buildDocument({pack,settings:pack.settings,kind:'both',topics:G.TOPICS||{},seed:pack.seed});
      const commands=doc.pages.flatMap(p=>p.cmds||[]).join('\n');
      for(const marker of ['WEIGHT A','YOUR WEIGHTS','FINAL BALANCE','LEFT','RIGHT','TOTAL'])if(!commands.includes(marker))throw new Error(`missing PDF marker ${marker}`);
      if(commands.includes('REPAIR TILES'))throw new Error('legacy Repair Tiles overlay returned');
      const bytes=doc.outputBytes();if(bytes.length<7000)throw new Error('PDF unexpectedly small');
      fs.writeFileSync(`/tmp/balance-lab-v194-${difficulty}.pdf`,Buffer.from(bytes));
    }
  }
}
console.log('Balance Lab paper v1.94 validation passed');
