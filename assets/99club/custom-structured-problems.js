/* 99 Club Studio - Custom Worksheets structured KS2 problems
 * Deterministic multi-step/reasoning templates mined from recurring primary maths structures.
 * Questions are constructed from valid models; no free-form story generation is used.
 */
(function(global){
'use strict';
const G=global.TT99Generator;if(!G)return;
const VERSION='0.1.0';
const FAMILIES={
  percentage_reasoning:{label:'percentage reasoning',strand:'Decimals & percentages',years:[5,6]},
  ratio_proportion_reasoning:{label:'ratio & proportion reasoning',strand:'Ratio & proportion',years:[5,6]},
  money_multi_step:{label:'multi-step money problems',strand:'Measurement',years:[4,5,6]},
  mean_reasoning:{label:'mean reasoning',strand:'Statistics',years:[6]},
  inverse_formula_reasoning:{label:'inverse formula problems',strand:'Algebra',years:[6]},
  number_property_constraints:{label:'number-property constraint puzzles',strand:'Number properties',years:[5,6]},
  fraction_reasoning:{label:'fraction reasoning',strand:'Fractions',years:[5,6]},
  event_cycles:{label:'repeating-event / LCM problems',strand:'Number properties',years:[5,6]},
  shape_nets:{label:'identify 3D shapes from nets',strand:'Geometry',years:[3,4,5,6]},
  measure_diagrams:{label:'missing measures from diagrams',strand:'Measurement',years:[4,5,6]}
};
const IDS=Object.keys(FAMILIES),isKind=k=>IDS.includes(String(k||'')),hasKind=r=>Array.isArray(r?.families)&&r.families.some(isKind),clone=o=>JSON.parse(JSON.stringify(o));
for(const [id,m] of Object.entries(FAMILIES)){
  if(!G.FAMILY_META[id])G.FAMILY_META[id]={label:m.label,strand:m.strand,years:m.years.slice(),visual:['ratio_proportion_reasoning','number_property_constraints','shape_nets','measure_diagrams'].includes(id)};
  G.FAMILY_LABELS[id]=m.label;
  if(Array.isArray(G.FAMILY_ORDER)&&!G.FAMILY_ORDER.includes(id))G.FAMILY_ORDER.push(id);
  if(Array.isArray(G.FAMILY_COMPACT_ORDER)&&!G.FAMILY_COMPACT_ORDER.includes(id))G.FAMILY_COMPACT_ORDER.push(id);
}
const q=(kind,subtype,i,prompt,answer,extra={})=>{const {key:keyExtra='',...rest}=extra;return {kind,prompt,answer:String(answer),key:`${kind}:${subtype}:${i}:${keyExtra}`,group:subtype,footprint:rest.footprint||(rest.visual?'L':'M'),marking:rest.marking||{mode:'exact',answer:String(answer)},...rest};};
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t;}return a||1;};
const lcm=(a,b)=>Math.abs(a*b)/gcd(a,b);
const money=p=>`£${(p/100).toFixed(2)}`;

function percentagePool(){
  const out=[];let i=0;
  const perc=[10,20,25,30,40,50,60,75];
  for(let j=0;j<16;j++){const p=perc[j%perc.length],whole=40+20*(j+1),part=whole*p/100;if(Number.isInteger(part))out.push(q('percentage_reasoning','reverse_percentage',i++,`${part} is what percentage of ${whole}?`,`${p}%`,{key:`${part}:${whole}`}));}
  for(let total=24;total<=96&&out.length<32;total+=4){for(const p of [15,25,35,43,55,65,75]){const exact=total*p/100;if(!Number.isInteger(exact)){out.push(q('percentage_reasoning','percentage_count_validity',i++,`A school has ${total} staff. Someone says exactly ${p}% of them chose one option. Can that be exactly true?`,'No',{key:`${total}:${p}`,response:{kind:'explanation',size:'S',label:'Explain using the number of people'},marking:{mode:'rubric',answer:`${p}% of ${total} is ${exact}, which is not a whole number of people.`,rule:'No, with a correct whole-person explanation.'}}));if(out.length>=32)break;}}}
  const factors=[[50,2],[75,2],[80,2],[90,2],[80,3],[50,3]];
  for(let j=0;j<18;j++){const [p,steps]=factors[j%factors.length],den=100/gcd(p,100),start=(5+j)*den**steps,answer=start*(p/100)**steps;
    out.push(q('percentage_reasoning','repeated_percentage',i++,`A quantity starts at ${start}. It becomes ${p}% of its previous value each time. What is its value after ${steps} changes?`,String(answer),{key:`${start}:${p}:${steps}`,visual:{type:'structured',subtype:'decay_sequence',start,p,steps,answer}}));}
  return out;
}
function ratioPool(){
  const out=[];let i=0;
  for(let j=0;j<14;j++){const planted=4+(j%6),grew=2+(j%4),g=gcd(planted,grew),a=planted/g,b=grew/g,groups=5+(j%9),actualGrew=b*groups;
    out.push(q('ratio_proportion_reasoning','success_ratio',i++,`For every ${a} bulbs planted, ${b} grow. Altogether ${actualGrew} bulbs grew. How many bulbs were planted?`,a*groups,{key:`${a}:${b}:${groups}`}));}
  for(let j=0;j<14;j++){const smallCount=4+(j%6),largeCount=3+(j%4),unit=[0.25,0.5,0.75,1][j%4],smallMass=largeCount*unit,largeMass=smallCount*unit;
    out.push(q('ratio_proportion_reasoning','mass_equivalence',i++,`${smallCount} small blocks have the same mass as ${largeCount} large blocks. One small block has a mass of ${smallMass} kg. Find the mass of one large block.`,`${largeMass} kg`,{key:`${smallCount}:${largeCount}:${unit}`,visual:{type:'structured',subtype:'mass_blocks',smallCount,largeCount,smallMass}}));}
  for(let j=0;j<12;j++){const per=12+2*(j%7),students=per*(3+(j%4))+(j%per),needed=Math.ceil(students/per),shown=Math.max(1,needed-(j%3===0?1:0)),answer=shown>=needed?'Yes':'No';
    out.push(q('ratio_proportion_reasoning','minimum_staff',i++,`There must be at least 1 adult for every ${per} pupils. A trip has ${students} pupils and ${shown} adults. Are there enough adults?`,answer,{key:`${per}:${students}:${shown}`,visual:{type:'structured',subtype:'staff_ratio',per,students,shown,needed},response:{kind:'working',size:'S',label:'Show the minimum number needed'}}));}
  for(const scale of [20,25,40,50])for(const mapCm of [3,5,7,9])for(const reverse of [false,true]){const actual=scale*mapCm;
    const prompt=reverse?`On a map, 1 cm represents ${scale} km. Two places are ${mapCm} cm apart on the map. How far apart are they in real life?`:`On a map, 1 cm represents ${scale} km. Two places are ${actual} km apart. How far apart should they be on the map?`;
    const answer=reverse?`${actual} km`:`${mapCm} cm`;
    out.push(q('ratio_proportion_reasoning','map_scale',i++,prompt,answer,{key:`${scale}:${mapCm}:${reverse?'r':'m'}`,visual:{type:'structured',subtype:'map_scale',scale,mapCm,actual,reverse}}));}
  return out;
}
function moneyPool(){
  const out=[];let i=0;
  const fracs=[[4,5],[3,4],[2,3],[3,5]];
  for(let j=0;j<16;j++){const [n,d]=fracs[j%fracs.length],spentUnit=25*(4+(j%9)),spent=spentUnit*(d-n),initial=spent*d/(d-n),first=25*(2+(j%5)),second=spent-first;if(second<=0)continue;
    out.push(q('money_multi_step','reverse_remaining_fraction',i++,`Alex had some money. Alex spent ${money(first)} and then ${money(second)}. After that, ${n}/${d} of the original money was left. How much money did Alex have at the start?`,money(initial),{key:`${n}:${d}:${first}:${second}`,response:{kind:'working',size:'M',label:'Show how the remaining fraction helps'}}));}
  for(let j=0;j<14;j++){const adult=100*(8+(j%9)),adults=2+(j%3),children=2+2*(j%3),child=adult/2,discount=[10,20,25][j%3],before=adults*adult+children*child,after=before*(100-discount)/100;if(!Number.isInteger(after))continue;
    out.push(q('money_multi_step','family_ticket_discount',i++,`Adult tickets cost ${money(adult)}. Child tickets are half the adult price. A group buys ${adults} adult and ${children} child tickets, then uses a ${discount}% discount. How much do they pay?`,money(after),{key:`${adult}:${adults}:${children}:${discount}`,response:{kind:'working',size:'M',label:'Show the ticket total and discount'}}));}
  for(let j=0;j<14;j++){const rows=20+(j%16),seats=24+2*(j%10),empty=10+5*(j%8),price=500+50*(j%12),sold=rows*seats-empty,revenue=sold*price;
    out.push(q('money_multi_step','capacity_revenue',i++,`A hall has ${rows} rows of ${seats} seats. ${empty} seats are empty. Each ticket costs ${money(price)}. How much money was taken?`,money(revenue),{key:`${rows}:${seats}:${empty}:${price}`,response:{kind:'working',size:'M',label:'Show seats sold and total takings'}}));}
  for(let j=0;j<12;j++){const pencePerGram=2+(j%8),grams=100*(2+(j%6)),num=[1,2,3][j%3],den=[2,5,4][j%3],mass=grams*num/den,cost=pencePerGram*mass;if(!Number.isInteger(cost))continue;
    out.push(q('money_multi_step','unit_price_mass',i++,`One gram of a material costs ${pencePerGram}p. What is the cost of ${num}/${den} of ${grams} g?`,money(cost),{key:`${pencePerGram}:${num}:${den}:${grams}`}));}
  return out;
}
function meanPool(){
  const out=[];let i=0;
  for(let n=4;n<=6;n++)for(let j=0;j<12;j++){const remainingMean=10+2*(j%9),removed=2+(j%7),sumRemaining=remainingMean*(n-1),sumAll=sumRemaining+removed;if(sumAll%n!==0||removed>=remainingMean)continue;const originalMean=sumAll/n;
    out.push(q('mean_reasoning','removed_item',i++,`${n} items have a mean of ${originalMean}. The smallest item is removed. The mean of the remaining ${n-1} items is ${remainingMean}. What was the value of the removed item?`,removed,{key:`${n}:${originalMean}:${remainingMean}`,response:{kind:'working',size:'M',label:'Use the totals before and after'}}));}
  for(let j=0;j<24;j++){const mean=8+(j%10),range=6+2*(j%6),low=2+(j%5),high=low+range,mid1=mean-1,mid2=mean+1,vals=[low,mid1,mean,mid2,high],adjust=mean*5-vals.reduce((a,b)=>a+b,0);vals[1]+=adjust;
    if(vals.slice().sort((a,b)=>a-b).join(',')!==vals.join(',')||vals.reduce((a,b)=>a+b,0)!==mean*5)continue;
    const choices=[vals,[low,mid1,mean,mid2,high+1],[low,mid1-1,mean,mid2,high],[low+1,mid1,mean,mid2,high]].map(x=>x.join(', '));
    out.push(q('mean_reasoning','mean_range_choice',i++,`Which set of five numbers has mean ${mean} and range ${range}?`,`A. ${choices[0]}`,{key:`${mean}:${range}:${vals.join('-')}`,choices,correctChoice:0,marking:{mode:'multiple-choice',answer:choices[0]},response:{kind:'short',size:'S',label:`Mean ${mean}; range ${range}`}}));}
  return out;
}
function formulaPool(){
  const out=[];let i=0;
  for(let j=0;j<36;j++){const rate=[3,4,5,6,8][j%5],fixed=20+5*(j%9),x=20+5*(j%16),total=rate*x+fixed;
    out.push(q('inverse_formula_reasoning','linear_cost',i++,`A cost in pence is calculated by: cost = ${rate} × number of pages + ${fixed}. The total cost is ${total}p. How many pages are there?`,x,{key:`${rate}:${fixed}:${x}`,response:{kind:'working',size:'S',label:'Work backwards through the rule'}}));}
  for(let j=0;j<24;j++){const mult=2+(j%7),add=3+(j%11),x=4+(j%15),result=mult*x+add;
    out.push(q('inverse_formula_reasoning','inverse_rule',i++,`A machine multiplies a number by ${mult} and then adds ${add}. The output is ${result}. What number went in?`,x,{key:`${mult}:${add}:${x}`,response:{kind:'working',size:'S',label:'Reverse the two operations'}}));}
  return out;
}
function twoDigitSquares(lo,hi){const out=[];for(let n=4;n<=9;n++){const v=n*n;if(v>=lo&&v<=hi)out.push(v);}return out;}
function twoDigitPrimes(lo,hi){const out=[];for(let n=Math.max(11,lo);n<=Math.min(99,hi);n++){let ok=true;for(let d=2;d*d<=n;d++)if(n%d===0){ok=false;break;}if(ok)out.push(n);}return out;}
function twoDigitCubes(lo,hi){return [27,64].filter(v=>v>=lo&&v<=hi);}
function uniqueDigitsCode(parts){const s=parts.join('');return s.length===6&&new Set(s).size===6;}
function numberConstraintPool(){
  const out=[],seen=new Set(),sqRanges=[[10,30],[20,50],[30,70],[40,90]],prRanges=[[10,30],[30,50],[50,80],[70,99]],cuRanges=[[20,50],[20,70],[50,90]];
  for(const sr of sqRanges)for(const pr of prRanges)for(const cr of cuRanges){
    const sols=[];for(const s of twoDigitSquares(...sr))for(const p of twoDigitPrimes(...pr))for(const c of twoDigitCubes(...cr))if(uniqueDigitsCode([s,p,c]))sols.push(`${s}${p}${c}`);
    const uniq=[...new Set(sols)].sort();if(!uniq.length||uniq.length>6)continue;const key=`${sr.join('-')}:${pr.join('-')}:${cr.join('-')}`;if(seen.has(key))continue;seen.add(key);
    out.push(q('number_property_constraints','square_prime_cube_code',out.length,`A six-digit code is made from three different 2-digit numbers. The first is a square number from ${sr[0]} to ${sr[1]}, the second is a prime from ${pr[0]} to ${pr[1]}, and the third is a cube from ${cr[0]} to ${cr[1]}. All six digits are different. List all possible codes.`,uniq.join(', '),{key,visual:{type:'structured',subtype:'code_boxes',labels:['square','prime','cube'],solutionCount:uniq.length},response:{kind:'working',size:'M',label:'List every code'}}));}
  const sixthPowers=[64,729,4096,15625,46656,117649];
  for(let idx=0;idx<sixthPowers.length-1;idx++)for(let variant=0;variant<4;variant++){
    const n=sixthPowers[idx],next=sixthPowers[idx+1],room=Math.max(2,next-n-1),bound=n+1+Math.floor(room*(variant+1)/5);
    out.push(q('number_property_constraints','square_and_cube',out.length,`What is the greatest positive whole number below ${bound.toLocaleString()} that is both a square number and a cube number, other than 1?`,n,{key:`${n}:${bound}`}));
  }
  return out;
}
function fractionPool(){
  const out=[];let i=0;
  const fracs=[[2,3],[3,4],[3,5],[4,5],[3,10],[7,10]];
  for(let j=0;j<24;j++){const [n,d]=fracs[j%fracs.length],whole=d*(10+(j%11)),part=whole*n/d;
    out.push(q('fraction_reasoning','reverse_fraction_of_whole',i++,`${part} is ${n}/${d} of a quantity. What is the whole quantity?`,whole,{key:`${n}:${d}:${whole}`,response:{kind:'working',size:'S',label:'Find one part, then the whole'}}));}
  const shares=[[[1,5],[1,4]],[[1,4],[1,3]],[[2,5],[1,4]],[[1,6],[1,3]]];
  for(let j=0;j<24;j++){const [[an,ad],[bn,bd]]=shares[j%shares.length],den=lcm(ad,bd),total=den*(10+(j%9)),a=total*an/ad,b=total*bn/bd,c=total-a-b;if(c<0)continue;
    out.push(q('fraction_reasoning','fraction_share_remainder',i++,`Three people share some money. Alex gets ${an}/${ad}, Bea gets ${bn}/${bd}, and Cara gets the rest. Alex receives ${money(a)}. How much more does Cara receive than Bea?`,money(c-b),{key:`${an}:${ad}:${bn}:${bd}:${total}`,response:{kind:'working',size:'M',label:'Find the whole amount and each share'}}));}
  return out;
}
function eventPool(){
  const out=[];const pairs=[[12,18],[24,28],[15,20],[16,24],[18,30],[20,35],[14,21],[25,30],[27,36],[32,40]];
  for(const [a,b] of pairs)for(const unit of ['minutes','seconds']){const next=lcm(a,b);
    out.push(q('event_cycles','two_repeating_events',out.length,`One event happens every ${a} ${unit} and another every ${b} ${unit}. They happen together now. After how many ${unit} will they next happen together?`,next,{key:`${a}:${b}:${unit}`,response:{kind:'working',size:'S',label:'Find a common multiple'}}));}
  return out;
}
function netPool(){
  const shapes=['cube','cuboid','triangular prism','cylinder','square-based pyramid'],out=[];
  for(let variant=0;variant<4;variant++)for(const shape of shapes){
    out.push(q('shape_nets','identify_net',out.length,'Which 3D shape can be made from this net?',shape,{key:`${shape}:${variant}`,visual:{type:'structured',subtype:'shape_net',shape,variant},response:{kind:'short',size:'S',label:'Name the 3D shape'}}));
  }return out;
}
function measurePool(){
  const out=[];let i=0;
  for(let j=0;j<30;j++){const n=2+(j%4),strip=4+(j%13),fixed=j%2?3+(j%9):0,total=n*strip+fixed;
    const prompt=fixed?`The diagram has ${n} identical strips and one fixed section of ${fixed} cm. The total length is ${total} cm. Find the width of one identical strip.`:`The diagram shows ${n} identical rectangles in a row with total length ${total} cm. Find the length of one rectangle.`;
    out.push(q('measure_diagrams','equal_strips',i++,prompt,`${strip} cm`,{key:`${n}:${strip}:${fixed}`,visual:{type:'structured',subtype:'equal_strips',n,strip,fixed,total}}));}
  for(let j=0;j<18;j++){const perimeter=20+4*j,side=perimeter/4;if(!Number.isInteger(side))continue;
    out.push(q('measure_diagrams','square_from_perimeter',i++,`A square has perimeter ${perimeter} cm. Find the length of one side.`,`${side} cm`,{key:String(perimeter),visual:{type:'structured',subtype:'square_perimeter',perimeter}}));}
  return out;
}
const POOLS={
  percentage_reasoning:percentagePool(),ratio_proportion_reasoning:ratioPool(),money_multi_step:moneyPool(),mean_reasoning:meanPool(),inverse_formula_reasoning:formulaPool(),
  number_property_constraints:numberConstraintPool(),fraction_reasoning:fractionPool(),event_cycles:eventPool(),shape_nets:netPool(),measure_diagrams:measurePool()
};
function pool(k){return clone(POOLS[k]||[]);}

function circlePoints(cx,cy,r,n=36){return Array.from({length:n},(_,i)=>{const a=2*Math.PI*i/n;return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)};});}
function renderStructured(C,x,y,w,h,v,answers){
  const ink=[31,41,55],muted=[95,105,120],teal=[15,118,110],line=[190,202,207],pale=[244,249,248];
  if(v.subtype==='decay_sequence'){
    const vals=[v.start];for(let i=0;i<v.steps;i++)vals.push(vals[vals.length-1]*v.p/100);const gap=8,bw=Math.min(70,(w-gap*(vals.length-1))/vals.length),left=x+(w-(bw*vals.length+gap*(vals.length-1)))/2,yy=y+h*.45-18;
    vals.forEach((n,j)=>{C.rect(left+j*(bw+gap),yy,bw,36,{fill:pale,stroke:line,width:.55});C.text(left+j*(bw+gap)+bw/2,yy+22,j===vals.length-1&&!answers?'?':String(n),9,{bold:true,align:'center',color:j===vals.length-1?teal:ink});if(j<vals.length-1)C.text(left+j*(bw+gap)+bw+gap/2,yy+22,`${v.p}%`,5.9,{align:'center',color:muted});});
  }else if(v.subtype==='mass_blocks'){
    const rows=[['small',v.smallCount],['large',v.largeCount]],top=y+12;rows.forEach((row,ri)=>{const yy=top+ri*h*.34,CN=row[1],bw=Math.min(28,(w*.65)/CN),left=x+w*.18;for(let j=0;j<CN;j++)C.rect(left+j*(bw+3),yy,bw,bw*.7,{fill:ri?pale:[232,246,244],stroke:line,width:.5});C.text(x+w*.08,yy+bw*.45,row[0],6.5,{bold:true,color:muted});});C.text(x+w*.5,y+h*.82,`${v.smallCount} small = ${v.largeCount} large`,7,{bold:true,align:'center',color:teal});
  }else if(v.subtype==='staff_ratio'){
    const left=x+w*.18,top=y+h*.22,tw=w*.64,row=h*.2;[['Pupils',v.students],['Adults shown',v.shown],['Minimum needed',answers?v.needed:'?']].forEach((r,i)=>{C.rect(left,top+i*row,tw,row,{fill:i%2?pale:null,stroke:line,width:.5});C.text(left+8,top+i*row+row*.65,r[0],7,{color:ink});C.text(left+tw-10,top+i*row+row*.65,String(r[1]),8,{bold:true,align:'right',color:i===2?teal:ink});});
  }else if(v.subtype==='map_scale'){
    const yy=y+h*.5,Cx=x+w*.18,Cw=w*.64;C.line(Cx,yy,Cx+Cw,yy,{color:ink,width:1.3});for(let j=0;j<=4;j++){const xx=Cx+Cw*j/4;C.line(xx,yy-5,xx,yy+5,{color:ink,width:.8});}C.text(Cx,yy+19,'0',6.5,{align:'center',color:muted});C.text(Cx+Cw,yy+19,`4 cm = ${4*v.scale} km`,6.5,{align:'right',color:muted});C.text(x+w/2,y+18,`Scale: 1 cm = ${v.scale} km`,7.2,{bold:true,align:'center',color:teal});
  }else if(v.subtype==='code_boxes'){
    const labels=v.labels||[],gap=12,bw=(w-gap*2)/3,yy=y+h*.38,bh=Math.min(48,h*.35);labels.forEach((lab,j)=>{const xx=x+j*(bw+gap);C.rect(xx,yy,bw,bh,{fill:pale,stroke:line,width:.7});C.text(xx+bw/2,yy+bh*.58,'__ __',11,{bold:true,align:'center',color:ink});C.text(xx+bw/2,yy+bh+14,lab,6.5,{bold:true,align:'center',color:muted});});C.text(x+w/2,y+15,`${v.solutionCount} possible code${v.solutionCount===1?'':'s'}`,6.5,{align:'center',color:teal});
  }else if(v.subtype==='shape_net'){
    const cx=x+w/2,cy=y+h*.52,s=Math.min(36,w*.085,h*.16),rot=(v.variant||0)%4,shape=v.shape;
    const square=(gx,gy)=>C.rect(cx+(gx-1.5)*s,cy+(gy-1.5)*s,s,s,{fill:pale,stroke:ink,width:.7});
    if(shape==='cube'){
      const nets=[
        [[0,1],[1,1],[2,1],[3,1],[1,0],[1,2]],
        [[0,1],[1,1],[2,1],[3,1],[2,0],[1,2]],
        [[1,0],[1,1],[1,2],[1,3],[0,1],[2,2]],
        [[0,0],[0,1],[1,1],[2,1],[2,2],[3,2]]
      ];(nets[rot]||nets[0]).forEach(([a,b])=>square(a,b));
    }else if(shape==='cuboid'){
      const W=s*1.18,H=s*.72,D=s*.48,faces=[
        {x:cx-W*1.5,y:cy-H/2,w:W,h:H},{x:cx-W*.5,y:cy-H/2,w:W,h:H},{x:cx+W*.5,y:cy-H/2,w:W,h:H},{x:cx+W*1.5,y:cy-H/2,w:W,h:H},
        {x:cx-W*.5,y:cy-H/2-D,w:W,h:D},{x:cx-W*.5,y:cy+H/2,w:W,h:D}
      ];
      if(rot%2){faces[4].x+=W;faces[5].x+=W;}
      faces.forEach(f=>C.rect(f.x,f.y,f.w,f.h,{fill:pale,stroke:ink,width:.7}));
    }else if(shape==='cylinder'){
      if(rot%2===0){C.rect(cx-s*1.4,cy-s*.7,s*2.8,s*1.4,{fill:pale,stroke:ink,width:.7});C.polygon(circlePoints(cx,cy-s*1.45,s*.68),{stroke:ink,width:.7});C.polygon(circlePoints(cx,cy+s*1.45,s*.68),{stroke:ink,width:.7});}
      else{C.rect(cx-s*.7,cy-s*1.4,s*1.4,s*2.8,{fill:pale,stroke:ink,width:.7});C.polygon(circlePoints(cx-s*1.45,cy,s*.68),{stroke:ink,width:.7});C.polygon(circlePoints(cx+s*1.45,cy,s*.68),{stroke:ink,width:.7});}
    }else if(shape==='triangular prism'){
      const left=cx-s*1.5,top=cy-s*.55;for(let j=0;j<3;j++)C.rect(left+j*s,top,s,s*1.1,{fill:pale,stroke:ink,width:.7});
      const attach=rot%3,ax=left+(attach+.5)*s;C.polygon([{x:ax-s*.5,y:top},{x:ax+s*.5,y:top},{x:ax,y:top-s*.82}],{stroke:ink,width:.7});
      C.polygon([{x:ax-s*.5,y:top+s*1.1},{x:ax+s*.5,y:top+s*1.1},{x:ax,y:top+s*1.92}],{stroke:ink,width:.7});
    }else{
      C.rect(cx-s*.55,cy-s*.55,s*1.1,s*1.1,{fill:pale,stroke:ink,width:.7});
      C.polygon([{x:cx-s*.55,y:cy-s*.55},{x:cx,y:cy-s*1.55},{x:cx+s*.55,y:cy-s*.55}],{stroke:ink,width:.7});
      C.polygon([{x:cx-s*.55,y:cy+s*.55},{x:cx,y:cy+s*1.55},{x:cx+s*.55,y:cy+s*.55}],{stroke:ink,width:.7});
      C.polygon([{x:cx-s*.55,y:cy-s*.55},{x:cx-s*1.55,y:cy},{x:cx-s*.55,y:cy+s*.55}],{stroke:ink,width:.7});
      C.polygon([{x:cx+s*.55,y:cy-s*.55},{x:cx+s*1.55,y:cy},{x:cx+s*.55,y:cy+s*.55}],{stroke:ink,width:.7});
    }
  }else if(v.subtype==='equal_strips'){
    const n=v.n,totalPieces=n+(v.fixed?1:0),left=x+w*.10,top=y+h*.38,bw=w*.8/totalPieces,bh=Math.min(50,h*.32);
    if(v.fixed){C.rect(left,top,bw,bh,{fill:[235,239,246],stroke:ink,width:.7});C.text(left+bw/2,top+bh*.58,`${v.fixed} cm`,6.5,{bold:true,align:'center',color:ink});}
    for(let j=0;j<n;j++){const xx=left+(j+(v.fixed?1:0))*bw;C.rect(xx,top,bw,bh,{fill:pale,stroke:ink,width:.7});C.text(xx+bw/2,top+bh*.58,'x',8,{bold:true,align:'center',color:teal});}
    C.line(left,top-13,left+w*.8,top-13,{color:muted,width:.6});C.text(left+w*.4,top-18,`${v.total} cm total`,6.5,{bold:true,align:'center',color:muted});
  }else if(v.subtype==='square_perimeter'){
    const s=Math.min(w*.28,h*.48),left=x+(w-s)/2,top=y+(h-s)/2;C.rect(left,top,s,s,{fill:pale,stroke:ink,width:.9});C.text(left+s/2,top+s+16,`Perimeter = ${v.perimeter} cm`,7,{bold:true,align:'center',color:teal});C.text(left+s/2,top+s*.55,'?',10,{bold:true,align:'center',color:ink});
  }
}
global.TT99VisualRenderers=global.TT99VisualRenderers||{};global.TT99VisualRenderers.structured=renderStructured;

const previous={generateQuestions:G.generateQuestions.bind(G),questionPool:G.questionPool.bind(G),questionByKey:G.questionByKey.bind(G),questionPoolIndex:G.questionPoolIndex.bind(G),questionByPoolIndex:G.questionByPoolIndex.bind(G),replaceQuestion:G.replaceQuestion.bind(G)};
function hashString(str){let h=2166136261>>>0;for(let i=0;i<String(str).length;i++){h^=String(str).charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function rngFor(seed){if(typeof G.rngFromSeed==='function')return G.rngFromSeed(seed);let a=hashString(seed)||1234567;return()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296;};}
function shuffle(a,r){const o=a.slice();for(let i=o.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[o[i],o[j]]=[o[j],o[i]];}return o;}
function weightedCounts(rules,rng){const bag=[];for(const f of rules.families){for(let i=0;i<Math.max(1,Number(rules.familyWeights?.[f])||1);i++)bag.push(f);}const cycle=shuffle(bag,rng),counts=Object.fromEntries(rules.families.map(f=>[f,0]));for(let i=0;i<rules.questionCount;i++)counts[cycle[i%cycle.length]]++;return counts;}
function pick(p,n,r){if(!p.length)return[];const s=shuffle(p,r),out=[];for(let i=0;i<n;i++)out.push(clone(s[i%s.length]));return out;}
G.questionPool=function(kind,rules){if(isKind(kind))return clone(POOLS[kind]||[]);return previous.questionPool(kind,rules);};
G.questionByKey=function(kind,rules,key){if(!isKind(kind))return previous.questionByKey(kind,rules,key);const x=(POOLS[kind]||[]).find(q=>q.key===key);return x?clone(x):null;};
G.questionPoolIndex=function(kind,rules,key){if(!isKind(kind))return previous.questionPoolIndex(kind,rules,key);return (POOLS[kind]||[]).findIndex(q=>q.key===key);};
G.questionByPoolIndex=function(kind,rules,index){if(!isKind(kind))return previous.questionByPoolIndex(kind,rules,index);const p=POOLS[kind]||[],n=Number(index);return Number.isInteger(n)&&n>=0&&n<p.length?clone(p[n]):null;};
G.generateQuestions=function(inputRules,seed){const rules=G.normalizeRules(inputRules);if(rules.mode!=='family_mix'||!hasKind(rules))return previous.generateQuestions(inputRules,seed);const rng=rngFor(seed||'CUSTOM'),counts=weightedCounts(rules,rng);let out=[];for(const f of rules.families){const n=counts[f]||0;if(n)out=out.concat(pick(G.questionPool(f,rules),n,rng));}return shuffle(out,rng).map((it,i)=>({...it,number:i+1}));};
G.replaceQuestion=function(questions,index,inputRules,seed){const cur=questions?.[index];if(!cur||!isKind(cur.kind))return previous.replaceQuestion(questions,index,inputRules,seed);let p=(POOLS[cur.kind]||[]).filter(q=>q.key!==cur.key&&q.group===cur.group),used=new Set(questions.filter((_,i)=>i!==index).map(q=>q.key));let c=p.filter(q=>!used.has(q.key));if(!c.length)c=p;const rng=rngFor(String(seed||'')+':structured-replace'),choice=shuffle(c,rng)[0];if(!choice)return questions.slice();const out=questions.slice();out[index]={...clone(choice),number:index+1};return out;};
function validate(){const errors=[];for(const [kind,p] of Object.entries(POOLS)){if(p.length<12)errors.push(`${kind}:pool-too-small:${p.length}`);const keys=new Set();for(const item of p){if(keys.has(item.key))errors.push(`${kind}:duplicate-key`);keys.add(item.key);if(item.answer==null||item.answer==='')errors.push(`${kind}:blank-answer`);}}return{ok:!errors.length,errors,counts:Object.fromEntries(Object.entries(POOLS).map(([k,p])=>[k,p.length]))};}
global.TT99CustomStructured={VERSION,FAMILIES,POOLS,validate,renderStructured};
}(typeof window!=='undefined'?window:globalThis));
