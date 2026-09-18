const assert=require('assert');
require('../games-arithmetic.js');
require('../games-new-puzzles-v196.js');
const A=global.TT99ArithmeticGames;

function perms(items){const out=[];function rec(p,left){if(!left.length){out.push(p);return;}for(let i=0;i<left.length;i++)rec(p.concat(left[i]),left.slice(0,i).concat(left.slice(i+1)));}rec([],items);return out;}
function allBinary(n){const total=1<<(n*n),out=[];for(let m=0;m<total;m++){const s=[];for(let i=0;i<n*n;i++)s.push((m>>i)&1?'B':'R');out.push(s);}return out;}

for(const difficulty of ['easy','standard','challenge']){
  for(const layout of ['row','grid']){
    const reps=layout==='grid'&&difficulty==='challenge'?3:8;
    for(let i=0;i<reps;i++){
      const settings={minYear:3,maxYear:6,topics:['geometry','algebra','calculation'],engineSettings:{colourlogic:{difficulty,layout,ruleStyle:'mixed'}}};
      const p=A.generate('colourlogic',settings,`cl-${difficulty}-${layout}-${i}`);
      assert.equal(p.engineId,'colourlogic');assert(A.validate(p).ok);assert.equal(p.solutionCount,1);assert(p.clues.length>=3);
      if(layout==='row'){
        const states=perms(p.solution),matches=states.filter(s=>p.clues.every(c=>A._colourRowClueTestV196(c,s)));
        assert.equal(matches.length,1,`row not unique ${difficulty} ${i}`);assert.deepStrictEqual(matches[0],p.solution);
      }else{
        const n=p.size,states=allBinary(n),matches=states.filter(s=>p.clues.every(c=>A._gridClueTestV196(c,s,n)));
        assert.equal(matches.length,1,`grid not unique ${difficulty} ${i}`);assert.deepStrictEqual(matches[0],p.solutionGrid.flat());
      }
    }
  }
}

function collectBars(n,out=[]){if(n.type==='bar'){out.push(n);collectBars(n.left,out);collectBars(n.right,out);}return out;}
for(const difficulty of ['easy','standard','challenge']){
  for(let i=0;i<15;i++){
    const settings={minYear:3,maxYear:6,topics:['calculation','algebra'],engineSettings:{mobilebalance:{difficulty,layout:'auto',givenMode:'auto'}}};
    const p=A.generate('mobilebalance',settings,`mb-${difficulty}-${i}`);
    assert.equal(p.engineId,'mobilebalance');assert(A.validate(p).ok);
    for(const v of Object.values(p.values)){assert(Number.isInteger(v)&&v>0);}
    const bars=collectBars(p.tree);assert.equal(bars.length,p.barCount);
    if(difficulty==='challenge')assert(p.barCount>=3,'challenge must have multiple nested balances');
    for(const b of bars)assert.equal(A._mobileBranchWeightV196(b.left,p.values),A._mobileBranchWeightV196(b.right,p.values));
  }
}

require('../games-vocabulary.js');
require('../games-number-logic.js');
require('../games-engine.js');
const G=global.TT99Games;
assert(G.ENGINES.colourlogic,'Colour Logic missing from catalogue');
assert(G.ENGINES.mobilebalance,'Mobile Balance missing from catalogue');

require('../simple-pdf.js');
require('../games-pdf.js');
const PDF=global.TT99GamesPDF;
const settings=G.normalizeSettings({minYear:4,maxYear:6,topics:['calculation','algebra','geometry'],sheets:1,activitiesPerSheet:2,selectedEngines:['colourlogic','mobilebalance'],includeAnswers:true,engineSettings:{colourlogic:{difficulty:'standard',layout:'row',ruleStyle:'mixed'},mobilebalance:{difficulty:'challenge',layout:'multiple',givenMode:'auto'}}});
const colour=A.generate('colourlogic',settings,'pdf-colour');
const mobile=A.generate('mobilebalance',settings,'pdf-mobile');
const pack={version:'test',seed:'v196-pdf',settings,workedExamples:[],sheets:[{index:1,activities:[colour,mobile]}]};
const doc=PDF.buildDocument({pack,settings,kind:'both',topics:G.TOPICS,seed:pack.seed});
assert.equal(doc.pages.length,2);
const commands=doc.pages.flatMap(p=>p.cmds||[]).join('\n');
for(const marker of ['Colour Logic','Mobile Balance','SHAPE VALUES'])assert(commands.includes(marker),`PDF missing ${marker}`);
const bytes=doc.outputBytes();assert(bytes.length>5000);require('fs').writeFileSync('/tmp/new-puzzles-v196.pdf',Buffer.from(bytes));
console.log('Colour Logic + Mobile Balance v1.96 smoke tests passed');
