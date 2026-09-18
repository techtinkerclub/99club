const assert=require('assert');
require('../games-arithmetic.js');
require('../games-balance-lab-v192.js');
const A=global.TT99ArithmeticGames;

function evalExpr(text){
  const m=String(text).trim().replace(/−/g,'-').replace(/×/g,'*').replace(/÷/g,'/').match(/^(-?\d+)\s*([+\-*\/])\s*(-?\d+)$/);
  assert(m,`not a simple expression: ${text}`);
  const a=Number(m[1]),b=Number(m[3]);
  return m[2]==='+'?a+b:m[2]==='-'?a-b:m[2]==='*'?a*b:a/b;
}
function check(diff,seed){
  const settings={minYear:4,maxYear:6,topics:['calculation','algebra'],engineSettings:{balance:{difficulty:diff,rowCount:'auto',style:'auto'}}};
  const p=A.generate('balance',settings,seed);
  assert.equal(p.engineId,'balance');assert.equal(p.title,'Balance Lab');assert.equal(p.balanceLabVersion,'1.92');
  assert(p.rows.length>=4);assert.equal(p.finalChallenge.weights.length,p.rows.length);
  p.rows.forEach((r,i)=>{
    assert(r.display.includes('□')&&r.display.includes('='),r.display);
    const [l0,r0]=r.display.split('=').map(s=>s.trim());
    assert(/[+−×÷]/.test(l0),`left side has no operation: ${r.display}`);
    assert(/[+−×÷]/.test(r0),`right side has no operation: ${r.display}`);
    const solved=r.display.replace('□',String(r.answer));
    const [l,rh]=solved.split('=').map(s=>s.trim());
    assert.equal(evalExpr(l),r.balancedValue,solved);assert.equal(evalExpr(rh),r.balancedValue,solved);
    assert.equal(p.finalChallenge.weights[i],r.balancedValue);
  });
  let left=0,right=0;
  p.finalChallenge.weights.forEach((v,i)=>{if(p.finalChallenge.solutionSides[i]==='L')left+=v;else if(p.finalChallenge.solutionSides[i]==='R')right+=v;else assert.fail('missing final side');});
  assert.equal(left,right);assert.equal(left,p.finalChallenge.target);
  return p;
}
for(const d of ['easy','standard','challenge'])for(let i=0;i<20;i++)check(d,`v192-${d}-${i}`);
let rich=false;for(let i=0;i<50&&!rich;i++){const p=check('challenge',`rich-${i}`);rich=p.rows.some(r=>/[×÷]/.test(r.display));}
assert(rich,'challenge generator never produced multiplication/division in sample');
console.log('Balance Lab v1.92 smoke passed: operations on both sides + valid final partition.');
