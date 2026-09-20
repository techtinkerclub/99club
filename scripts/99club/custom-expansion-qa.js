#!/usr/bin/env node
'use strict';
const path=require('path');
const ROOT=path.resolve(__dirname,'../..');
global.window=global;
const G=require(path.join(ROOT,'assets/99club/generator.js'));
require(path.join(ROOT,'assets/99club/custom-written-methods.js'));
require(path.join(ROOT,'assets/99club/custom-reasoning.js'));

const W=global.TT99CustomWrittenMethods,R=global.TT99CustomReasoning;
const failures=[],passes=[];
const fail=(area,msg)=>failures.push({area,msg});
const pass=(area,msg)=>passes.push({area,msg});
const num=s=>Number(String(s).replace(/,/g,''));
const isPrime=n=>{n=Number(n);if(n<2||!Number.isInteger(n))return false;for(let d=2;d*d<=n;d++)if(n%d===0)return false;return true;};

if(!W||!R)fail('load','Expansion modules did not load');
else{
  for(const [kind,pool] of Object.entries(W.POOLS||{})){
    if(pool.length<20)fail(kind,`Pool too small: ${pool.length}`);
    for(const item of pool){const v=W.validateQuestion(item);if(!v.ok)fail(kind,`${item.key}: ${v.error}`);}
    pass(kind,`${pool.length} written-method questions validated`);
  }
  const rv=R.validate();if(!rv.ok)rv.errors.forEach(e=>fail('reasoning',e));else pass('reasoning','Pool/key baseline validation passed');

  for(const item of R.POOLS.rounding_bounds||[]){
    const m=item.prompt.match(/rounds to ([\d,]+) to the nearest ([\d,]+).*?(smallest|largest)/i);
    if(!m){fail('rounding_bounds',`Unparseable prompt: ${item.prompt}`);continue;}
    const target=num(m[1]),step=num(m[2]),expected=m[3].toLowerCase()==='smallest'?target-step/2:target+step/2-1;
    if(num(item.answer)!==expected)fail('rounding_bounds',`${item.key}: expected ${expected}, got ${item.answer}`);
  }
  pass('rounding_bounds','Bounds independently recalculated');

  for(const item of R.POOLS.derived_calculations||[]){
    const m=item.prompt.match(/Given that (\d+) × (\d+) = (\d+), work out (\d+) × (\d+)/);
    if(!m){fail('derived_calculations',item.key);continue;}
    if(Number(m[1])*Number(m[2])!==Number(m[3]))fail('derived_calculations',`${item.key}: bad given fact`);
    if(num(item.answer)!==Number(m[4])*Number(m[5]))fail('derived_calculations',`${item.key}: bad derived answer`);
  }
  pass('derived_calculations','Known facts and derived products recalculated');

  for(const item of R.POOLS.insert_brackets||[]){
    const expr=String(item.answer).replace(/×/g,'*').replace(/−/g,'-');
    let got;try{got=Function(`"use strict";return (${expr})`)();}catch(e){fail('insert_brackets',`${item.key}: invalid answer expression`);continue;}
    const target=Number((item.prompt.match(/=\s*(-?\d+)\s*$/)||[])[1]);
    if(got!==target)fail('insert_brackets',`${item.key}: brackets produce ${got}, target ${target}`);
  }
  pass('insert_brackets','Bracket solutions evaluated');

  for(const item of R.POOLS.mean_cards||[]){
    const v=item.visual,known=(v.values||[]).filter(x=>x!=null).reduce((a,b)=>a+Number(b),0),expected=Number(v.mean)*5-known;
    if(num(item.answer)!==expected)fail('mean_cards',`${item.key}: expected ${expected}`);
  }
  pass('mean_cards','Mean-card totals recalculated');

  for(const item of R.POOLS.venn_counts||[]){
    const v=item.visual||{},aOnly=Number(v.aOnly),bOnly=Number(v.bOnly),both=Number(v.both),neither=Number(v.neither),total=Number(v.total),mode=Number(v.mode);
    if(![aOnly,bOnly,both,neither,total].every(Number.isFinite)||aOnly+bOnly+both+neither!==total){fail('venn_counts',`${item.key}: invalid set model`);continue;}
    const expected=mode===0?neither:mode===1?aOnly+bOnly:aOnly+bOnly+both;
    if(num(item.answer)!==expected)fail('venn_counts',`${item.key}: expected ${expected}, got ${item.answer}`);
  }
  pass('venn_counts','Venn regions and requested totals independently checked');

  for(const item of R.POOLS.prime_sum||[]){
    const vals=String(item.answer).split('+').map(s=>Number(s.trim())),target=Number((item.prompt.match(/total of (\d+)/)||[])[1]);
    if(vals.length!==3||new Set(vals).size!==3||vals.some(n=>!isPrime(n))||vals.reduce((a,b)=>a+b,0)!==target)fail('prime_sum',item.key);
  }
  pass('prime_sum','Prime triples verified');

  for(const item of R.POOLS.constrained_factor_pairs||[]){
    const product=num((item.prompt.match(/make ([\d,]+)/)||[])[1]),vals=String(item.answer).match(/\d+/g)?.map(Number)||[];
    if(vals.length!==2||vals[0]*vals[1]!==product||vals.some(n=>String(n).includes('0')))fail('constrained_factor_pairs',item.key);
  }
  pass('constrained_factor_pairs','Factor constraints verified');

  function duration(s){s=String(s);let m=s.match(/^(\d+(?:\.\d+)?) seconds$/);if(m)return Number(m[1]);m=s.match(/^(\d+(?:\.\d+)?) minutes$/);if(m)return Number(m[1])*60;if(s==='one quarter of an hour')return 900;if(s==='one half of an hour')return 1800;if(s==='three quarters of an hour')return 2700;return NaN;}
  for(const item of R.POOLS.mixed_unit_order||[]){
    const vals=item.visual.items.map(duration);if(vals.some(v=>!Number.isFinite(v))){fail('mixed_unit_order',`${item.key}: bad duration`);continue;}
    const order=vals.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v).map(x=>String.fromCharCode(65+x.i)).join(', ');
    if(item.answer!==order)fail('mixed_unit_order',`${item.key}: expected ${order}`);
  }
  pass('mixed_unit_order','Mixed units normalised to seconds');

  for(const item of R.POOLS.recursive_sequences||[]){
    const m=item.prompt.match(/multiply by (\d+), then add (\d+)/),mult=Number(m?.[1]),add=Number(m?.[2]),vals=item.visual.values;
    if(vals.length===5&&vals[4]==null){const expected=vals[3]*mult+add;if(num(item.answer)!==expected)fail('recursive_sequences',item.key);}
    else if(vals.length===2&&vals[0]==null){const expected=(vals[1]-add)/mult;if(num(item.answer)!==expected)fail('recursive_sequences',item.key);}
  }
  pass('recursive_sequences','Forward/backward sequence rules verified');

  for(const item of R.POOLS.letter_sum_grid||[]){
    const m=String(item.answer).match(/a=(\d+), b=(\d+), c=(\d+), d=(\d+)/);if(!m){fail('letter_sum_grid',item.key);continue;}
    const vals={a:+m[1],b:+m[2],c:+m[3],d:+m[4]};
    for(const row of item.visual.rows){const total=row.letters.reduce((s,k)=>s+vals[k],0);if(total!==row.sum)fail('letter_sum_grid',`${item.key}: row mismatch`);}
  }
  pass('letter_sum_grid','All row equations independently checked');

  for(const item of R.POOLS.similar_shapes||[]){
    const v=item.visual,idx=v.small.findIndex(x=>x==null);if(idx<0||Number(v.large[idx])/Number(v.scale)!==num(item.answer))fail('similar_shapes',item.key);
  }
  pass('similar_shapes','Scale-factor answers checked');

  for(const item of R.POOLS.same_volume_cuboids||[]){
    const v=item.visual,aVol=v.a.reduce((p,n)=>p*n,1),bVol=Number(v.b[0])*Number(v.b[1])*num(item.answer);
    if(aVol!==bVol||aVol!==v.volume)fail('same_volume_cuboids',`${item.key}: ${aVol} != ${bVol}`);
  }
  pass('same_volume_cuboids','Equal-volume models checked');

  for(const item of R.POOLS.recipe_scaling||[]){
    const v=item.visual,target=Number((item.prompt.match(/for (\d+) people/)||[])[1]),scale=target/Number(v.serves);
    if(!Number.isInteger(scale)||!v.items.every(x=>String(item.answer).includes(`${x.name} ${x.amount*scale}${x.unit}`)))fail('recipe_scaling',item.key);
  }
  pass('recipe_scaling','Recipe scale factors checked');

  for(const item of R.POOLS.relational_money||[]){
    const m=item.prompt.match(/(\d+)p more.*?(\d+)p less.*?£(\d+\.\d{2})/),am=String(item.answer).match(/^(\d+)p$/),andy=Number(am?.[1]),expected=3*andy+Number(m?.[1]||0)-Number(m?.[2]||0);
    if(!m||!am||!Number.isFinite(andy)||Math.round(Number(m?.[3]||0)*100)!==expected)fail('relational_money',item.key);
  }
  pass('relational_money','Linked money totals checked');

  for(const item of R.POOLS.ratio_coins||[]){
    const m=item.prompt.match(/every (\d+) (\d+)p coins.*?(\d+) (\d+)p coins.*?£(\d+\.\d{2}) in (\d+)p coins/);if(!m){fail('ratio_coins',item.key);continue;}
    const a=+m[1],coinA=+m[2],b=+m[3],coinB=+m[4],given=Math.round(+m[5]*100);if(coinB!==+m[6]||given%coinB!==0){fail('ratio_coins',item.key);continue;}
    const groups=(given/coinB)/b,expected=(groups*a*coinA+given)/100;if(item.answer!==`£${expected.toFixed(2)}`)fail('ratio_coins',item.key);
  }
  pass('ratio_coins','Coin ratios and money totals checked');

  const families=[...Object.keys(W.FAMILIES),...Object.keys(R.FAMILIES)];
  for(const family of families){
    const base=G.clone(G.OPEN_WORKSHEET_PRESET);base.mode='family_mix';base.questionCount=12;base.families=[family];base.familyWeights={[family]:1};base.progressionEnabled=false;
    let questions=[];try{questions=G.generateQuestions(base,`QA:${family}`);}catch(e){fail('generation',`${family}: ${e.stack||e.message}`);continue;}
    if(questions.length!==12)fail('generation',`${family}: generated ${questions.length}/12`);
    if(questions.some(q=>q.kind!==family))fail('generation',`${family}: wrong family returned`);
  }
  pass('generation',`${families.length} new families generated through the public generator API`);

  const stub={text(){},line(){},rect(){},polygon(){},image(){}};
  for(const pool of Object.values(W.POOLS))for(const item of pool.slice(0,3))try{W.renderWritten(stub,0,0,420,180,item.visual,false);W.renderWritten(stub,0,0,420,180,item.visual,true);}catch(e){fail('render-written',`${item.key}: ${e.message}`);}
  for(const pool of Object.values(R.POOLS))for(const item of pool.filter(q=>q.visual).slice(0,3))try{R.renderReasoning(stub,0,0,420,180,item.visual,false);R.renderReasoning(stub,0,0,420,180,item.visual,true);}catch(e){fail('render-reasoning',`${item.key}: ${e.message}`);}
  pass('render','New visual renderers completed stub-canvas smoke tests');
}
const report={generatedAt:new Date().toISOString(),passes,failures};
require('fs').writeFileSync(path.join(ROOT,'99club-custom-expansion-qa-report.json'),JSON.stringify(report,null,2));
if(failures.length){console.error(JSON.stringify(report,null,2));process.exit(1);}
console.log(`Custom expansion QA passed: ${passes.length} checks, ${Object.keys(W.POOLS).length+Object.keys(R.POOLS).length} families.`);
