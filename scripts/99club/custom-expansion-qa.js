#!/usr/bin/env node
'use strict';
const path=require('path');
const ROOT=path.resolve(__dirname,'../..');
global.window=global;
const G=require(path.join(ROOT,'assets/99club/generator.js'));
require(path.join(ROOT,'assets/99club/custom-written-methods.js'));
require(path.join(ROOT,'assets/99club/custom-reasoning.js'));
require(path.join(ROOT,'assets/99club/custom-structured-problems.js'));
require(path.join(ROOT,'assets/99club/custom-visual-reasoning.js'));
require(path.join(ROOT,'assets/99club/custom-applied-visuals.js'));
require(path.join(ROOT,'assets/99club/custom-extra-visuals.js'));

const W=global.TT99CustomWrittenMethods,R=global.TT99CustomReasoning,S=global.TT99CustomStructured,F=global.TT99CustomVisualReasoning,A=global.TT99CustomAppliedVisuals,E=global.TT99CustomExtraVisuals;
const failures=[],passes=[];
const fail=(area,msg)=>failures.push({area,msg});
const pass=(area,msg)=>passes.push({area,msg});
const num=s=>Number(String(s).replace(/,/g,''));
const isPrime=n=>{n=Number(n);if(n<2||!Number.isInteger(n))return false;for(let d=2;d*d<=n;d++)if(n%d===0)return false;return true;};

if(!W||!R||!S||!F||!A||!E)fail('load','Expansion modules did not load');
else{
  for(const [kind,pool] of Object.entries(W.POOLS||{})){
    if(pool.length<20)fail(kind,`Pool too small: ${pool.length}`);
    for(const item of pool){const v=W.validateQuestion(item);if(!v.ok)fail(kind,`${item.key}: ${v.error}`);}
    pass(kind,`${pool.length} written-method questions validated`);
  }
  const rv=R.validate();if(!rv.ok)rv.errors.forEach(e=>fail('reasoning',e));else pass('reasoning','Pool/key baseline validation passed');
  const sv=S.validate();if(!sv.ok)sv.errors.forEach(e=>fail('structured',e));else pass('structured','Structured pool/key baseline validation passed');
  const fv=F.validate();if(!fv.ok)fv.errors.forEach(e=>fail('visual-reasoning',e));else pass('visual-reasoning','Visual-reasoning pool/key/net baseline validation passed');
  const av=A.validate();if(!av.ok)av.errors.forEach(e=>fail('applied-visuals',e));else pass('applied-visuals','Applied-visual pool/key baseline validation passed');
  const ev=E.validate();if(!ev.ok)ev.errors.forEach(e=>fail('extra-visuals',e));else pass('extra-visuals','Extra-visual pool/key/topology baseline validation passed');

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

  function pence(value){const m=String(value).match(/£(\d+)\.(\d{2})/);return m?Number(m[1])*100+Number(m[2]):NaN;}
  function qaGcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t;}return a||1;}
  function qaPrime(n){if(!Number.isInteger(n)||n<2)return false;for(let d=2;d*d<=n;d++)if(n%d===0)return false;return true;}

  for(const item of S.POOLS.percentage_reasoning||[]){
    if(item.group==='reverse_percentage'){
      const m=item.prompt.match(/([\d.]+) is what percentage of ([\d.]+)/);if(!m){fail('percentage_reasoning',item.key);continue;}
      const expected=Number(m[1])/Number(m[2])*100;if(String(item.answer)!==`${expected}%`)fail('percentage_reasoning',`${item.key}: expected ${expected}%`);
    }else if(item.group==='percentage_count_validity'){
      const m=item.prompt.match(/has (\d+) staff.*?exactly (\d+)%/);if(!m){fail('percentage_reasoning',item.key);continue;}
      const exact=Number(m[1])*Number(m[2])/100;if(Number.isInteger(exact)||item.answer!=='No')fail('percentage_reasoning',`${item.key}: expected impossible whole-person claim`);
    }else if(item.group==='repeated_percentage'){
      const v=item.visual||{},expected=Number(v.start)*Math.pow(Number(v.p)/100,Number(v.steps));if(num(item.answer)!==expected)fail('percentage_reasoning',`${item.key}: expected ${expected}`);
    }
  }
  pass('percentage_reasoning','Reverse, discrete-count and repeated-percentage modes recalculated');

  for(const item of S.POOLS.ratio_proportion_reasoning||[]){
    const v=item.visual||{};
    if(item.group==='success_ratio'){
      const m=item.prompt.match(/every (\d+) bulbs planted, (\d+) grow.*?(\d+) bulbs grew/);if(!m){fail('ratio_proportion_reasoning',item.key);continue;}
      const expected=Number(m[3])/Number(m[2])*Number(m[1]);if(num(item.answer)!==expected)fail('ratio_proportion_reasoning',`${item.key}: expected ${expected}`);
    }else if(item.group==='mass_equivalence'){
      const expected=Number(v.smallCount)*Number(v.smallMass)/Number(v.largeCount);if(String(item.answer)!==`${expected} kg`)fail('ratio_proportion_reasoning',`${item.key}: expected ${expected} kg`);
    }else if(item.group==='minimum_staff'){
      const needed=Math.ceil(Number(v.students)/Number(v.per)),expected=Number(v.shown)>=needed?'Yes':'No';if(Number(v.needed)!==needed||item.answer!==expected)fail('ratio_proportion_reasoning',`${item.key}: staff ratio mismatch`);
    }else if(item.group==='map_scale'){
      const expected=v.reverse?`${Number(v.scale)*Number(v.mapCm)} km`:`${Number(v.mapCm)} cm`;if(item.answer!==expected)fail('ratio_proportion_reasoning',`${item.key}: expected ${expected}`);
    }
  }
  pass('ratio_proportion_reasoning','Success ratios, mass equivalence, staffing and map scales checked');

  for(const item of S.POOLS.money_multi_step||[]){
    if(item.group==='reverse_remaining_fraction'){
      const m=item.prompt.match(/spent £(\d+\.\d{2}).*?£(\d+\.\d{2}).*?(\d+)\/(\d+) of the original money was left/);if(!m){fail('money_multi_step',item.key);continue;}
      const spent=Math.round(Number(m[1])*100)+Math.round(Number(m[2])*100),n=+m[3],d=+m[4],expected=spent*d/(d-n);if(pence(item.answer)!==expected)fail('money_multi_step',`${item.key}: expected ${expected}p`);
    }else if(item.group==='family_ticket_discount'){
      const m=item.prompt.match(/cost £(\d+\.\d{2}).*?buys (\d+) adult and (\d+) child.*?(\d+)% discount/);if(!m){fail('money_multi_step',item.key);continue;}
      const adult=Math.round(Number(m[1])*100),adults=+m[2],children=+m[3],discount=+m[4],expected=(adults*adult+children*adult/2)*(100-discount)/100;if(pence(item.answer)!==expected)fail('money_multi_step',`${item.key}: ticket total mismatch`);
    }else if(item.group==='capacity_revenue'){
      const m=item.prompt.match(/has (\d+) rows of (\d+) seats\. (\d+) seats are empty\. Each ticket costs £(\d+\.\d{2})/);if(!m){fail('money_multi_step',item.key);continue;}
      const expected=(+m[1]*+m[2]-+m[3])*Math.round(Number(m[4])*100);if(pence(item.answer)!==expected)fail('money_multi_step',`${item.key}: revenue mismatch`);
    }else if(item.group==='unit_price_mass'){
      const m=item.prompt.match(/costs (\d+)p.*?cost of (\d+)\/(\d+) of (\d+) g/);if(!m){fail('money_multi_step',item.key);continue;}
      const expected=+m[1]*(+m[2]/+m[3]*+m[4]);if(pence(item.answer)!==expected)fail('money_multi_step',`${item.key}: unit-price mismatch`);
    }
  }
  pass('money_multi_step','All structured money modes recalculated');

  for(const item of S.POOLS.mean_reasoning||[]){
    if(item.group==='removed_item'){
      const m=item.prompt.match(/(\d+) items have a mean of ([\d.]+).*?remaining (\d+) items is ([\d.]+)/);if(!m){fail('mean_reasoning',item.key);continue;}
      const total=Number(m[1])*Number(m[2]),remaining=Number(m[3])*Number(m[4]),expected=total-remaining;if(num(item.answer)!==expected)fail('mean_reasoning',`${item.key}: expected removed value ${expected}`);
    }else if(item.group==='mean_range_choice'){
      const m=item.prompt.match(/mean (\d+) and range (\d+)/),mean=Number(m?.[1]),range=Number(m?.[2]),valid=(item.choices||[]).filter(s=>{const vals=String(s).split(',').map(Number);return vals.length===5&&vals.reduce((a,b)=>a+b,0)/5===mean&&Math.max(...vals)-Math.min(...vals)===range;});
      if(valid.length!==1||!String(item.answer).includes(valid[0]))fail('mean_reasoning',`${item.key}: expected exactly one valid choice, got ${valid.length}`);
    }
  }
  pass('mean_reasoning','Removed-item and mean/range-choice modes checked');

  for(const item of S.POOLS.inverse_formula_reasoning||[]){
    if(item.group==='linear_cost'){
      const m=item.prompt.match(/cost = (\d+) × number of pages \+ (\d+).*?total cost is (\d+)p/);if(!m){fail('inverse_formula_reasoning',item.key);continue;}
      const expected=(+m[3]-+m[2])/(+m[1]);if(num(item.answer)!==expected)fail('inverse_formula_reasoning',`${item.key}: expected ${expected}`);
    }else if(item.group==='inverse_rule'){
      const m=item.prompt.match(/multiplies a number by (\d+) and then adds (\d+).*?output is (\d+)/);if(!m){fail('inverse_formula_reasoning',item.key);continue;}
      const expected=(+m[3]-+m[2])/(+m[1]);if(num(item.answer)!==expected)fail('inverse_formula_reasoning',`${item.key}: expected ${expected}`);
    }
  }
  pass('inverse_formula_reasoning','Inverse linear rules independently solved');

  for(const item of S.POOLS.number_property_constraints||[]){
    if(item.group!=='square_prime_cube_code')continue;
    const m=item.prompt.match(/square number from (\d+) to (\d+).*?prime from (\d+) to (\d+).*?cube from (\d+) to (\d+)/);if(!m){fail('number_property_constraints',item.key);continue;}
    const sq=[];for(let n=1;n*n<=+m[2];n++)if(n*n>=+m[1])sq.push(n*n);
    const ps=[];for(let n=+m[3];n<=+m[4];n++)if(qaPrime(n))ps.push(n);
    const cubes=[];for(let n=1;n*n*n<=+m[6];n++)if(n*n*n>=+m[5])cubes.push(n*n*n);
    const codes=[];for(const a of sq)for(const b of ps)for(const d of cubes){const s=`${a}${b}${d}`;if(s.length===6&&new Set(s).size===6)codes.push(s);}
    const expected=[...new Set(codes)].sort().join(', ');if(item.answer!==expected)fail('number_property_constraints',`${item.key}: code enumeration mismatch`);
  }
  pass('number_property_constraints','Square/prime/cube code sets independently enumerated');

  for(const item of S.POOLS.fraction_reasoning||[]){
    if(item.group==='reverse_fraction_of_whole'){
      const m=item.prompt.match(/([\d.]+) is (\d+)\/(\d+) of a quantity/);if(!m){fail('fraction_reasoning',item.key);continue;}
      const expected=Number(m[1])*Number(m[3])/Number(m[2]);if(num(item.answer)!==expected)fail('fraction_reasoning',`${item.key}: expected ${expected}`);
    }else if(item.group==='fraction_share_remainder'){
      const m=item.prompt.match(/Alex gets (\d+)\/(\d+), Bea gets (\d+)\/(\d+).*?Alex receives £(\d+\.\d{2})/);if(!m){fail('fraction_reasoning',item.key);continue;}
      const aP=Math.round(Number(m[5])*100),total=aP*Number(m[2])/Number(m[1]),b=total*Number(m[3])/Number(m[4]),cara=total-aP-b,expected=cara-b;if(pence(item.answer)!==expected)fail('fraction_reasoning',`${item.key}: share difference mismatch`);
    }
  }
  pass('fraction_reasoning','Reverse-fraction and remainder-share problems checked');

  for(const item of S.POOLS.shape_nets||[]){
    const allowed=new Set(['cube','cuboid','triangular prism','cylinder','square-based pyramid']),v=item.visual||{};
    if(item.group!=='identify_net'||v.subtype!=='shape_net'||!allowed.has(item.answer)||v.shape!==item.answer||!Number.isInteger(v.variant)||v.variant<0||v.variant>3)fail('shape_nets',`${item.key}: invalid curated net model`);
  }
  pass('shape_nets','Curated net models and answers cross-checked');

  const sixthPowers=[64,729,4096,15625,46656];
  for(const item of S.POOLS.number_property_constraints||[]){
    if(item.group!=='square_and_cube')continue;
    const bound=num((item.prompt.match(/below ([\d,]+)/)||[])[1]),ans=num(item.answer),candidates=sixthPowers.filter(n=>n<bound);
    const expected=candidates[candidates.length-1];
    if(ans!==expected)fail('number_property_constraints',`${item.key}: expected greatest sixth power ${expected} below ${bound}, got ${item.answer}`);
  }
  pass('number_property_constraints','Square-and-cube bounds independently checked');

  for(const item of S.POOLS.event_cycles||[]){
    const m=item.prompt.match(/every (\d+) (seconds|minutes).*?every (\d+) \2/);if(!m){fail('event_cycles',item.key);continue;}
    const a=+m[1],b=+m[3],g=((x,y)=>{while(y){const t=y;y=x%y;x=t;}return x;})(a,b),expected=Math.abs(a*b)/g;
    if(num(item.answer)!==expected)fail('event_cycles',`${item.key}: expected ${expected}`);
  }
  pass('event_cycles','Repeating-event LCM answers checked');

  for(const item of S.POOLS.measure_diagrams||[]){
    const v=item.visual||{};
    if(v.subtype==='equal_strips'){
      const expected=(Number(v.total)-Number(v.fixed||0))/Number(v.n);
      if(String(item.answer)!==`${expected} cm`)fail('measure_diagrams',`${item.key}: expected ${expected} cm`);
    }else if(v.subtype==='square_perimeter'){
      const expected=Number(v.perimeter)/4;
      if(String(item.answer)!==`${expected} cm`)fail('measure_diagrams',`${item.key}: expected ${expected} cm`);
    }
  }
  pass('measure_diagrams','Diagram measures independently checked');

  for(const item of F.POOLS.container_reasoning||[]){
    const v=item.visual||{};
    if(item.group==='whole_packs'){
      const expected=Math.ceil(Number(v.needed)/Number(v.per));
      if(num(item.answer)!==expected)fail('container_reasoning',`${item.key}: expected ${expected}`);
    }else if(item.group==='number_of_groups'){
      const expected=Number(v.needed)/Number(v.per);
      if(num(item.answer)!==expected)fail('container_reasoning',`${item.key}: expected ${expected}`);
    }
  }
  pass('container_reasoning','Pack ceilings and equal groups independently recalculated');

  const dayNames=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  for(const item of F.POOLS.calendar_reasoning_visual||[]){
    const v=item.visual||{};
    const d=item.group==='days_after'?Number(v.targetDate):Number(v.date),expected=dayNames[(Number(v.start)+d-1)%7];
    if(item.answer!==expected)fail('calendar_reasoning_visual',`${item.key}: expected ${expected}`);
  }
  pass('calendar_reasoning_visual','Calendar weekday answers independently recalculated');

  for(const item of F.POOLS.balance_scales||[]){
    const v=item.visual||{},expected=Number(v.rightMass)/Number(v.leftBlocks);
    if(item.answer!==`${expected} g`)fail('balance_scales',`${item.key}: expected ${expected} g`);
  }
  pass('balance_scales','Balance masses independently recalculated');

  for(const item of F.POOLS.number_line_visuals||[]){
    const v=item.visual||{},expected=Number(v.values?.[v.missing]);
    if(num(item.answer)!==expected)fail('number_line_visuals',`${item.key}: expected ${expected}`);
  }
  pass('number_line_visuals','Number-line missing values independently checked');

  for(const item of F.POOLS.fraction_diagrams||[]){
    const v=item.visual||{};
    if(!(Number(v.n)>0&&Number(v.d)>0&&Number(v.n)<=Number(v.d)))fail('fraction_diagrams',`${item.key}: invalid fraction model`);
    if(item.group==='identify_shaded'&&item.answer!==`${v.n}/${v.d}`)fail('fraction_diagrams',`${item.key}: shaded fraction mismatch`);
    if(item.group==='identify_not_shaded'&&item.answer!==`${v.d-v.n}/${v.d}`)fail('fraction_diagrams',`${item.key}: unshaded fraction mismatch`);
  }
  pass('fraction_diagrams','Fraction models and identify answers checked');

  for(const item of F.POOLS.data_diagrams||[]){
    const v=item.visual||{};
    if(item.group==='block_chart_missing'){
      const expected=Number(v.values?.[v.missing]);if(num(item.answer)!==expected)fail('data_diagrams',`${item.key}: block-chart mismatch`);
    }else if(item.group==='pictogram_read'){
      const expected=Number(v.counts?.[v.ask])*Number(v.keyValue);if(num(item.answer)!==expected)fail('data_diagrams',`${item.key}: pictogram mismatch`);
    }
  }
  pass('data_diagrams','Block-chart and pictogram answers recalculated');

  const neg=a=>a.map(n=>-n),same=(a,b)=>a&&b&&a.length===b.length&&a.every((n,i)=>n===b[i]);
  for(const item of F.POOLS.cube_net_reasoning||[]){
    const v=item.visual||{},ori=F.foldNet(v.cells||[]),marked=Number(v.marked),opp=ori.findIndex((o,j)=>j!==marked&&same(o.n,neg(ori[marked]?.n||[]))),expected=v.labels?.[opp];
    if(!expected||item.answer!==expected||Number(v.opposite)!==opp)fail('cube_net_reasoning',`${item.key}: opposite-face mismatch`);
  }
  pass('cube_net_reasoning','Cube nets independently folded and opposite faces checked');

  for(const item of A.POOLS.measure_scales||[]){
    const v=item.visual||{};
    if(item.group==='jug_read'&&item.answer!==`${v.level} ml`)fail('measure_scales',`${item.key}: jug read mismatch`);
    if(item.group==='jug_add_to'&&item.answer!==`${Number(v.target)-Number(v.level)} ml`)fail('measure_scales',`${item.key}: jug add mismatch`);
    if(item.group==='ruler_read'&&item.answer!==`${v.value} cm`)fail('measure_scales',`${item.key}: ruler mismatch`);
    if(item.group==='joined_lengths'){const expected=(v.values||[]).reduce((a,b)=>a+Number(b),0),shown=Number(String(item.answer).replace(' cm',''));if(Math.abs(shown-expected)>1e-9)fail('measure_scales',`${item.key}: joined-length mismatch`);}
  }
  pass('measure_scales','Jug, ruler and joined-length answers independently checked');

  for(const item of A.POOLS.missing_digit_calculations||[]){
    const v=item.visual||{},digit=Number(item.answer);
    if(!Number.isInteger(digit)||digit<0||digit>9){fail('missing_digit_calculations',`${item.key}: invalid answer digit`);continue;}
    if(item.group==='addition_digit'){
      const a=Number(String(v.aMasked).replace('□',String(digit)));if(a+Number(v.b)!==Number(v.result))fail('missing_digit_calculations',`${item.key}: addition mismatch`);
    }else if(item.group==='subtraction_digit'){
      const b=Number(String(v.bMasked).replace('□',String(digit)));if(Number(v.aMasked)-b!==Number(v.result))fail('missing_digit_calculations',`${item.key}: subtraction mismatch`);
    }
  }
  pass('missing_digit_calculations','Missing digits independently substituted');

  for(const item of A.POOLS.table_reasoning||[]){
    const v=item.visual||{},hs=v.highlight||[];
    if(hs.length!==2)continue;
    const expected=item.group==='difference'?Math.abs(Number(v.values[hs[0]])-Number(v.values[hs[1]])):Number(v.values[hs[0]])+Number(v.values[hs[1]]);
    if(num(item.answer)!==expected)fail('table_reasoning',`${item.key}: expected ${expected}`);
  }
  pass('table_reasoning','Table differences and totals independently recalculated');

  for(const item of A.POOLS.coin_reasoning||[]){
    const v=item.visual||{};
    if(item.group==='coin_total'){
      const p=(v.values||[]).reduce((s,n,k)=>s+Number(n)*Number(v.counts?.[k]||0),0),expected=p>=100?`£${(p/100).toFixed(2)}`:`${p}p`;
      if(item.answer!==expected)fail('coin_reasoning',`${item.key}: expected ${expected}`);
    }else if(item.group==='change'){
      const paid=Number(v.values?.[0]),expected=paid-Number(v.price);if(item.answer!==`${expected}p`)fail('coin_reasoning',`${item.key}: change mismatch`);
    }
  }
  pass('coin_reasoning','Coin totals and change independently recalculated');

  for(const item of E.POOLS.temperature_visuals||[]){
    const v=item.visual||{};
    if(item.group==='read_temperature'&&item.answer!==`${v.value}°C`)fail('temperature_visuals',`${item.key}: read mismatch`);
    if(item.group==='mark_temperature'&&item.answer!==`${v.value}°C marked`)fail('temperature_visuals',`${item.key}: mark mismatch`);
    if(item.group==='temperature_change'){
      const expected=Number(v.value)+Number(v.delta);
      if(Number(v.final)!==expected||item.answer!==`${expected}°C`)fail('temperature_visuals',`${item.key}: change mismatch`);
    }
  }
  pass('temperature_visuals','Thermometer values and changes independently recalculated');

  for(const item of E.POOLS.symmetry_visuals||[]){
    const v=item.visual||{},rows=v.rows||[];
    if(rows.length<3||rows.some(n=>!Number.isInteger(Number(n))||Number(n)<0||Number(n)>3))fail('symmetry_visuals',`${item.key}: invalid half-pattern`);
    if(item.group==='draw_symmetry_line'&&item.answer!=='vertical line through the centre')fail('symmetry_visuals',`${item.key}: line answer mismatch`);
  }
  pass('symmetry_visuals','Generated symmetry half-patterns and axis answers checked');

  for(const item of E.POOLS.tally_charts||[]){
    const v=item.visual||{};
    if(item.group==='read_tally'){
      if(num(item.answer)!==Number(v.counts?.[v.ask]))fail('tally_charts',`${item.key}: read mismatch`);
    }else if(item.group==='tally_difference'){
      const h=v.highlight||[],expected=Math.abs(Number(v.counts?.[h[0]])-Number(v.counts?.[h[1]]));
      if(num(item.answer)!==expected)fail('tally_charts',`${item.key}: difference mismatch`);
    }else if(item.group==='complete_tally'){
      if(item.answer!==`${v.counts?.[v.ask]} tally marks`)fail('tally_charts',`${item.key}: completion mismatch`);
    }
  }
  pass('tally_charts','Tally-chart read, difference and completion modes checked');

  const hexDirs=[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
  function independentHexPerimeter(cells){const set=new Set((cells||[]).map(p=>p.join(',')));let edges=0;for(const [q0,r0] of cells||[])for(const [dq,dr] of hexDirs)if(!set.has(`${q0+dq},${r0+dr}`))edges++;return edges;}
  for(const item of E.POOLS.tile_area_perimeter_visual||[]){
    const v=item.visual||{},p=independentHexPerimeter(v.cells||[]);
    if(Number(v.perimeter)!==p)fail('tile_area_perimeter_visual',`${item.key}: topology perimeter mismatch`);
    if(item.group==='hex_perimeter'&&item.answer!==`${p*Number(v.edge)} cm`)fail('tile_area_perimeter_visual',`${item.key}: perimeter answer mismatch`);
    if(item.group==='hex_area_tiles'&&item.answer!==`${(v.cells||[]).length} square units`)fail('tile_area_perimeter_visual',`${item.key}: area answer mismatch`);
  }
  pass('tile_area_perimeter_visual','Hex-tile area and exposed-edge perimeter independently checked');

  const families=[...Object.keys(W.FAMILIES),...Object.keys(R.FAMILIES),...Object.keys(S.FAMILIES),...Object.keys(F.FAMILIES),...Object.keys(A.FAMILIES),...Object.keys(E.FAMILIES)];
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
  for(const pool of Object.values(S.POOLS))for(const item of pool.filter(q=>q.visual).slice(0,3))try{S.renderStructured(stub,0,0,420,180,item.visual,false);S.renderStructured(stub,0,0,420,180,item.visual,true);}catch(e){fail('render-structured',`${item.key}: ${e.message}`);}
  for(const pool of Object.values(F.POOLS))for(const item of pool.filter(q=>q.visual).slice(0,3))try{F.renderFoundation(stub,0,0,420,180,item.visual,false);F.renderFoundation(stub,0,0,420,180,item.visual,true);}catch(e){fail('render-foundation',`${item.key}: ${e.message}`);}
  for(const pool of Object.values(A.POOLS))for(const item of pool.filter(q=>q.visual).slice(0,3))try{A.renderApplied(stub,0,0,420,180,item.visual,false);A.renderApplied(stub,0,0,420,180,item.visual,true);}catch(e){fail('render-applied',`${item.key}: ${e.message}`);}
  for(const pool of Object.values(E.POOLS))for(const item of pool.filter(q=>q.visual).slice(0,3))try{E.renderExtra(stub,0,0,420,180,item.visual,false);E.renderExtra(stub,0,0,420,180,item.visual,true);}catch(e){fail('render-extra',`${item.key}: ${e.message}`);}
  pass('render','New visual renderers completed stub-canvas smoke tests');
}

/* Curriculum registry contract: hidden Custom area only.
 * Keep this read-only: it validates metadata and loader order without executing
 * the Custom app or altering any question-generation path.
 */
try{
  require(path.join(ROOT,'assets/99club/custom-curriculum-registry.js'));
  const C=global.TT99CurriculumRegistry;
  if(!C||!Array.isArray(C.objectives))fail('curriculum-registry','Registry did not load');
  else{
    const registryErrors=typeof C.validate==='function'?C.validate():['Registry validate() missing'];
    registryErrors.forEach(e=>fail('curriculum-registry',e));
    const ids=C.objectives.map(x=>x.id);
    if(new Set(ids).size!==ids.length)fail('curriculum-registry','Objective IDs are not unique');
    for(const year of [1,2,3,4,5,6])if(!C.objectives.some(x=>Number(x.year)===year))fail('curriculum-registry',`Year ${year} has no objectives`);
    const expectedDomains=['Number & place value','Addition & subtraction','Multiplication & division','Number properties','Fractions','Decimals & percentages','Ratio & proportion','Measurement','Geometry','Statistics','Algebra'];
    for(const domain of expectedDomains)if(!C.objectives.some(x=>x.domain===domain))fail('curriculum-registry',`Missing domain: ${domain}`);
    if(C.objectives.length<250)fail('curriculum-registry',`Registry unexpectedly small: ${C.objectives.length} objectives`);

    const familyFiles=[
      'assets/99club/generator.js',
      'assets/99club/custom-written-methods.js',
      'assets/99club/custom-reasoning.js',
      'assets/99club/custom-structured-problems.js',
      'assets/99club/custom-visual-reasoning.js',
      'assets/99club/custom-applied-visuals.js',
      'assets/99club/custom-extra-visuals.js',
      'assets/99club/custom-graphs.js',
      'assets/99club/custom-coordinates.js',
      'assets/99club/custom-piecharts.js',
      'assets/99club/custom-angles.js'
    ];
    const familyIds=new Set();
    for(const rel of familyFiles){
      const src=require('fs').readFileSync(path.join(ROOT,rel),'utf8');
      for(const match of src.matchAll(/([A-Za-z0-9_]+)\s*:\s*\{\s*label\s*:/g))familyIds.add(match[1]);
    }
    const providerIds=[...new Set(C.objectives.flatMap(x=>Array.isArray(x.providers)?x.providers:[]))];
    const missingProviders=providerIds.filter(id=>!familyIds.has(id));
    if(missingProviders.length)fail('curriculum-registry',`Unknown provider IDs: ${missingProviders.join(', ')}`);

    const appSource=require('fs').readFileSync(path.join(ROOT,'assets/99club/custom-app.js'),'utf8');
    try{new Function(appSource);pass('curriculum-registry','Custom app syntax compiled');}
    catch(e){fail('curriculum-registry',`Custom app syntax error: ${e.message}`);}

    const pageSource=require('fs').readFileSync(path.join(ROOT,'_pages/99-club-custom.md'),'utf8');
    const registryPos=pageSource.indexOf('/assets/99club/custom-curriculum-registry.js');
    const appPos=pageSource.indexOf('/assets/99club/custom-app.js');
    if(registryPos<0)fail('curriculum-registry','Hidden Custom page does not load the registry');
    if(appPos<0)fail('curriculum-registry','Hidden Custom page does not load custom-app.js');
    if(registryPos>=0&&appPos>=0&&registryPos>appPos)fail('curriculum-registry','Registry must load before custom-app.js');

    const s=typeof C.summary==='function'?C.summary():null;
    if(!s)fail('curriculum-registry','Registry summary() missing');
    else pass('curriculum-registry',`${s.total} curriculum leaves validated: ${s.live} live, ${s.partial} partial, ${s.planned} planned; ${providerIds.length} provider IDs resolved`);
  }
}catch(e){
  fail('curriculum-registry',e.stack||e.message);
}

const report={generatedAt:new Date().toISOString(),passes,failures};
require('fs').writeFileSync(path.join(ROOT,'99club-custom-expansion-qa-report.json'),JSON.stringify(report,null,2));
if(failures.length){console.error(JSON.stringify(report,null,2));process.exit(1);}
console.log(`Custom expansion QA passed: ${passes.length} checks, ${Object.keys(W.POOLS).length+Object.keys(R.POOLS).length+Object.keys(S.POOLS).length+Object.keys(F.POOLS).length+Object.keys(A.POOLS).length+Object.keys(E.POOLS).length} families.`);
