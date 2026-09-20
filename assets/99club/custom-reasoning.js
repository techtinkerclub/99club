/* 99 Club Studio - Custom Worksheets constrained reasoning engines
 * Small deterministic generators derived from recurring KS2 question structures.
 * Every problem is constructed from a known-valid mathematical model.
 */
(function(global){
'use strict';
const G=global.TT99Generator;if(!G)return;
const VERSION='0.1.0';
const FAMILIES={
  rounding_bounds:{label:'rounding bounds',strand:'Number & place value',years:[4,5,6]},
  derived_calculations:{label:'derive from a known calculation',strand:'Calculation',years:[4,5,6]},
  insert_brackets:{label:'insert brackets to make a calculation true',strand:'Calculation',years:[6]},
  mean_cards:{label:'missing value from a mean',strand:'Statistics',years:[6]},
  venn_counts:{label:'two-set Venn counting',strand:'Statistics',years:[5,6]},
  prime_sum:{label:'prime-number sum challenges',strand:'Number properties',years:[5,6]},
  constrained_factor_pairs:{label:'factor pairs with conditions',strand:'Number properties',years:[5,6]},
  mixed_unit_order:{label:'order mixed time units',strand:'Measurement',years:[5,6]},
  recursive_sequences:{label:'recursive sequences forwards & backwards',strand:'Algebra',years:[6]},
  letter_sum_grid:{label:'letter-value sum grids',strand:'Algebra',years:[6]},
  similar_shapes:{label:'similar shapes — missing length',strand:'Geometry',years:[6]},
  same_volume_cuboids:{label:'equal-volume cuboids — missing dimension',strand:'Measurement',years:[6]},
  recipe_scaling:{label:'scale recipes and quantities',strand:'Ratio & proportion',years:[6]},
  relational_money:{label:'linked money amounts',strand:'Algebra',years:[5,6]},
  ratio_coins:{label:'coin-ratio problems',strand:'Ratio & proportion',years:[6]}
};
const IDS=Object.keys(FAMILIES),isKind=k=>IDS.includes(String(k||'')),hasKind=r=>Array.isArray(r?.families)&&r.families.some(isKind),clone=o=>JSON.parse(JSON.stringify(o));
for(const [id,m] of Object.entries(FAMILIES)){
  if(!G.FAMILY_META[id])G.FAMILY_META[id]={label:m.label,strand:m.strand,years:m.years.slice(),visual:['mean_cards','venn_counts','mixed_unit_order','recursive_sequences','letter_sum_grid','similar_shapes','same_volume_cuboids','recipe_scaling'].includes(id)};
  G.FAMILY_LABELS[id]=m.label;
  if(Array.isArray(G.FAMILY_ORDER)&&!G.FAMILY_ORDER.includes(id))G.FAMILY_ORDER.push(id);
  if(Array.isArray(G.FAMILY_COMPACT_ORDER)&&!G.FAMILY_COMPACT_ORDER.includes(id))G.FAMILY_COMPACT_ORDER.push(id);
}
const q=(kind,i,prompt,answer,extra={})=>({kind,prompt,answer:String(answer),key:`${kind}:${i}:${extra.key||''}`,group:extra.group||kind,footprint:extra.footprint|| (extra.visual?'L':'M'),marking:extra.marking||{mode:'exact',answer:String(answer)},...extra});
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t;}return a||1;};
const primes=n=>{if(n<2)return false;for(let d=2;d*d<=n;d++)if(n%d===0)return false;return true;};

function roundingPool(){
  const out=[];let i=0;for(const step of [10,100,1000])for(let j=0;j<12;j++){const target=step*(6+j*3),low=target-step/2,high=target+step/2-1;
    out.push(q('rounding_bounds',i++,`A whole number rounds to ${target.toLocaleString()} to the nearest ${step.toLocaleString()}. What is the smallest possible number?`,low,{key:`${step}:low:${target}`}));
    out.push(q('rounding_bounds',i++,`A whole number rounds to ${target.toLocaleString()} to the nearest ${step.toLocaleString()}. What is the largest possible number?`,high,{key:`${step}:high:${target}`}));
  }return out;
}
function derivedPool(){
  const out=[];for(let i=0;i<36;i++){const a=12+(i%17),b=21+((i*7)%39),p=a*b,mode=i%4;let ask,ans;
    if(mode===0){ask=`${a*10} × ${b}`;ans=p*10;}
    if(mode===1){ask=`${a} × ${b*10}`;ans=p*10;}
    if(mode===2){ask=`${a*2} × ${b}`;ans=p*2;}
    else if(mode===3){ask=`${a} × ${b*2}`;ans=p*2;}
    out.push(q('derived_calculations',i,`Given that ${a} × ${b} = ${p}, work out ${ask} without starting again from scratch.`,ans,{key:`${a}:${b}:${mode}`,response:{kind:'working',size:'S',label:'Show how the known fact helps'}}));
  }return out;
}
function applyOp(a,op,b){return op==='*'?a*b:op==='+'?a+b:a-b;}
function evalFlat(nums,ops){
  nums=nums.slice();ops=ops.slice();
  for(let i=0;i<ops.length;){if(ops[i]==='*'){nums.splice(i,2,nums[i]*nums[i+1]);ops.splice(i,1);}else i++;}
  let v=nums[0];for(let i=0;i<ops.length;i++)v=applyOp(v,ops[i],nums[i+1]);return v;
}
function evalSpan(nums,ops,s,e){
  const inner=evalFlat(nums.slice(s,e+1),ops.slice(s,e)),n=nums.slice(0,s).concat([inner],nums.slice(e+1)),o=ops.slice(0,s).concat(ops.slice(e));
  return evalFlat(n,o);
}
function bracketExpr(nums,ops,s,e){
  const sym=o=>o==='*'?'×':o==='-'?'−':o,parts=[];
  for(let i=0;i<nums.length;i++){if(i===s)parts.push('(');parts.push(String(nums[i]));if(i===e)parts.push(')');if(i<ops.length)parts.push(sym(ops[i]));}
  return parts.join(' ');
}
function bracketPool(){
  const out=[],spans=[[0,1],[1,2],[2,3],[0,2],[1,3]];
  for(let i=0;i<180&&out.length<40;i++){
    const nums=[2+i%8,3+(i*2)%9,2+(i*3)%7,1+(i*5)%6],mode=i%3,ops=mode===0?['*','+','-']:['+','*','-'],wanted=mode===0?[1,2]:mode===1?[0,1]:[2,3],target=evalSpan(nums,ops,wanted[0],wanted[1]),matches=spans.filter(([s,e])=>evalSpan(nums,ops,s,e)===target);
    if(matches.length!==1||matches[0][0]!==wanted[0]||matches[0][1]!==wanted[1]||evalFlat(nums,ops)===target)continue;
    const raw=bracketExpr(nums,ops,-1,-1).replace(/[()]/g,'').trim(),answer=bracketExpr(nums,ops,wanted[0],wanted[1]);
    out.push(q('insert_brackets',out.length,`Insert one pair of brackets to make this true:  ${raw} = ${target}`,answer,{key:`${raw}:${target}`,response:{kind:'short',size:'S',label:'Rewrite the calculation with brackets'}}));
  }return out;
}
function meanPool(){
  const out=[];for(let i=0;i<36;i++){const mean=8+(i%15),missing=4+((i*7)%25),vals=[5+((i*3)%18),8+((i*5)%19),10+((i*7)%17),12+((i*11)%16)],needed=mean*5-vals.reduce((a,b)=>a+b,0);
    const m=needed>0&&needed<60?needed:missing,total=mean*5,diff=m-needed;if(diff){vals[3]=Math.max(1,vals[3]-diff);}
    const finalMissing=total-vals.reduce((a,b)=>a+b,0);if(finalMissing<=0||finalMissing>80)continue;
    out.push(q('mean_cards',i,`The mean of the five number cards is ${mean}. Work out the missing number.`,finalMissing,{visual:{type:'reasoning',subtype:'number_cards',values:[...vals,null],mean},key:`${mean}:${vals.join(',')}`}));
  }return out;
}
function vennPool(){
  const out=[];for(let i=0;i<36;i++){const both=3+(i%9),aOnly=8+((i*3)%18),bOnly=7+((i*5)%16),neither=4+((i*7)%14),total=aOnly+bOnly+both+neither,A=aOnly+both,B=bOnly+both,mode=i%3;let prompt,ans;
    if(mode===0){prompt=`There are ${total} children. ${A} are in Club A, ${B} are in Club B and ${both} are in both clubs. How many are in neither club?`;ans=neither;}
    else if(mode===1){prompt=`Club A has ${A} children and Club B has ${B}. ${both} are in both. How many children are in exactly one of the two clubs?`;ans=aOnly+bOnly;}
    else{prompt=`There are ${total} children. ${A} are in Club A, ${B} are in Club B and ${both} are in both. How many are in at least one club?`;ans=aOnly+bOnly+both;}
    out.push(q('venn_counts',i,prompt,ans,{visual:{type:'reasoning',subtype:'venn',labels:['Club A','Club B'],aOnly,bOnly,both,neither,total,mode},key:`${aOnly}:${bOnly}:${both}:${neither}:${mode}`}));
  }return out;
}
function primePool(){
  const ps=[];for(let n=2;n<=89;n++)if(primes(n))ps.push(n);const bySum=new Map();
  for(let a=0;a<ps.length;a++)for(let b=a+1;b<ps.length;b++)for(let c=b+1;c<ps.length;c++){const s=ps[a]+ps[b]+ps[c];if(s>95)break;const arr=bySum.get(s)||[];arr.push([ps[a],ps[b],ps[c]]);bySum.set(s,arr);}
  const uniques=[...bySum.entries()].filter(([,v])=>v.length===1).slice(0,40);
  return uniques.map(([sum,v],i)=>q('prime_sum',i,`Find three different prime numbers with a total of ${sum}.`,v[0].join(' + '),{key:String(sum),response:{kind:'working',size:'S',label:'Prime numbers'}}));
}
function factorPairPool(){
  const out=[];for(let product=120;product<=5000&&out.length<42;product+=4){const pairs=[];for(let a=2;a*a<=product;a++)if(product%a===0){const b=product/a;if(!String(a).includes('0')&&!String(b).includes('0'))pairs.push([a,b]);}
    if(pairs.length===1){const [a,b]=pairs[0];out.push(q('constrained_factor_pairs',out.length,`Two whole numbers greater than 1 multiply to make ${product.toLocaleString()}. Neither number contains the digit 0. What are the two numbers?`,`${a} and ${b}`,{key:String(product),response:{kind:'working',size:'S',label:'Show your factor search'}}));}
  }return out;
}
function formatDuration(sec,mode){
  if(mode===0)return `${sec} seconds`;if(mode===1)return `${sec/60} minutes`;
  const mins=sec/60;if(mins===15)return 'one quarter of an hour';if(mins===30)return 'one half of an hour';if(mins===45)return 'three quarters of an hour';return `${mins} minutes`;
}
function mixedUnitPool(){
  const sets=[[600,900,1200,1500],[720,900,1800,2700],[300,1200,1800,2400],[900,1500,2700,3600],[480,900,1800,2700],[660,1320,1980,2640]];
  const out=[],seen=new Set();
  for(let si=0;si<sets.length&&out.length<40;si++)for(let offset=0;offset<3&&out.length<40;offset++)for(let shift=0;shift<3&&out.length<40;shift++){
    const secs=sets[si].map((v,j)=>v+offset*60*(j+1));if(new Set(secs).size!==secs.length)continue;
    const modes=[0,1,2,1].map((m,j)=>(m+j+shift)%3),labels=secs.map((s,j)=>formatDuration(s,modes[j])),key=labels.join('|');if(seen.has(key))continue;seen.add(key);
    const order=secs.map((s,j)=>({s,j})).sort((a,b)=>a.s-b.s).map(x=>String.fromCharCode(65+x.j)).join(', ');
    out.push(q('mixed_unit_order',out.length,'Order the four times from shortest to longest.',order,{visual:{type:'reasoning',subtype:'unit_order',items:labels,seconds:secs},key,response:{kind:'short',size:'S',label:'Write the letters in order'}}));
  }return out;
}
function recursivePool(){
  const out=[];for(let i=0;i<36;i++){const mult=2+(i%3),add=1+((i*2)%7),start=2+(i%8),seq=[start];for(let j=1;j<5;j++)seq.push(seq[j-1]*mult+add);const mode=i%2;
    if(mode===0)out.push(q('recursive_sequences',i,`The rule is “multiply by ${mult}, then add ${add}”. Find the next term.`,seq[4],{visual:{type:'reasoning',subtype:'sequence',values:[...seq.slice(0,4),null]},key:`${mult}:${add}:${start}:next`}));
    else out.push(q('recursive_sequences',i,`The rule is “multiply by ${mult}, then add ${add}”. The shown value is in the sequence. Find the number immediately before it.`,seq[3],{visual:{type:'reasoning',subtype:'sequence',values:[null,seq[4]],arrow:true},key:`${mult}:${add}:${start}:prev`}));
  }return out;
}
function letterGridPool(){
  const out=[];for(let i=0;i<30;i++){const a=2+(i%8),b=3+((i*3)%9),c=1+((i*5)%10),d=4+((i*7)%11),rows=[{letters:['a','a','a','a'],sum:4*a},{letters:['a','a','b','b'],sum:2*a+2*b},{letters:['b','c','c','c'],sum:b+3*c},{letters:['a','b','c','d'],sum:a+b+c+d}];
    out.push(q('letter_sum_grid',i,'The letters stand for whole numbers. Use the row totals to find a, b, c and d.',`a=${a}, b=${b}, c=${c}, d=${d}`,{visual:{type:'reasoning',subtype:'letter_grid',rows},key:`${a}:${b}:${c}:${d}`,footprint:'XL'}));
  }return out;
}
function similarPool(){
  const triples=[[3,4,5],[5,12,13],[6,8,10],[8,15,17],[9,12,15],[12,16,20]],out=[];
  for(const small0 of triples)for(const k of [2,3,4])for(const hide of [0,1,2]){
    const small=small0.slice(),large=small.map(n=>n*k),answer=small[hide],shownSmall=small.slice();shownSmall[hide]=null;
    out.push(q('similar_shapes',out.length,'The two right-angled triangles are similar. Work out the missing length.',answer,{visual:{type:'reasoning',subtype:'similar_triangles',small:shownSmall,large,scale:k,hiddenIndex:hide},key:`${small.join(':')}:${k}:${hide}`,footprint:'L'}));
  }return out;
}
function cuboidPool(){
  const out=[];for(let i=0;i<36;i++){const b1=3+(i%6),b2=4+((i*2)%7),h=4+2*(i%5),A=[b1*2,b2,h/2],volume=b1*b2*h;
    out.push(q('same_volume_cuboids',i,'Cuboid A and Cuboid B have the same volume. Find the missing height of cuboid B.',h,{visual:{type:'reasoning',subtype:'cuboids',a:A,b:[b1,b2,null],volume},key:`${A.join('x')}:${b1}:${b2}:${h}`,footprint:'L'}));
  }return out;
}
function recipePool(){
  const names=['flour','milk','rice','pasta','cheese','tomatoes','stock','yoghurt'],out=[],seen=new Set();
  for(const serves of [4,5,6])for(const scale of [2,3])for(let start=0;start<names.length&&out.length<48;start++)for(let variant=0;variant<2&&out.length<48;variant++){
    const target=serves*scale,items=[];for(let j=0;j<4;j++){const amount=(j+2)*(20+5*((start+j+variant*2)%7));items.push({name:names[(start+j)%names.length],amount,unit:j===1?'ml':'g'});}
    const key=`${serves}:${target}:${items.map(x=>`${x.name}-${x.amount}-${x.unit}`).join('|')}`;if(seen.has(key))continue;seen.add(key);
    const answer=items.map(x=>`${x.name} ${x.amount*scale}${x.unit}`).join(', ');
    out.push(q('recipe_scaling',out.length,`This recipe serves ${serves}. How much of each ingredient is needed for ${target} people?`,answer,{visual:{type:'reasoning',subtype:'recipe',serves,target,scale,items},key,footprint:'L'}));
  }return out;
}
function relationalMoneyPool(){
  const out=[];for(let i=0;i<36;i++){const base=35+((i*7)%70),more=3+(i%12),less=2+((i*5)%10),total=3*base+more-less;
    out.push(q('relational_money',i,`Kelly has ${more}p more than Andy. Georgia has ${less}p less than Andy. Together they have £${(total/100).toFixed(2)}. How much money does Andy have?`,`${base}p`,{key:`${base}:${more}:${less}`,response:{kind:'working',size:'S',label:'Show your equation or reasoning'}}));
  }return out;
}
function ratioCoinsPool(){
  const out=[];for(let i=0;i<36;i++){const rA=2+(i%5),rB=2+((i*2)%4),coinA=[50,20,10][i%3],coinB=[20,10,5][i%3],groups=5+(i%12),countB=rB*groups,given=countB*coinB,total=rA*groups*coinA+given;
    out.push(q('ratio_coins',i,`For every ${rA} ${coinA}p coins, Sam has ${rB} ${coinB}p coins. Sam has £${(given/100).toFixed(2)} in ${coinB}p coins. How much money does Sam have altogether?`,`£${(total/100).toFixed(2)}`,{key:`${rA}:${rB}:${coinA}:${coinB}:${groups}`,response:{kind:'working',size:'S',label:'Show your ratio calculation'}}));
  }return out;
}
const POOLS={
  rounding_bounds:roundingPool(),derived_calculations:derivedPool(),insert_brackets:bracketPool(),mean_cards:meanPool(),venn_counts:vennPool(),prime_sum:primePool(),
  constrained_factor_pairs:factorPairPool(),mixed_unit_order:mixedUnitPool(),recursive_sequences:recursivePool(),letter_sum_grid:letterGridPool(),similar_shapes:similarPool(),
  same_volume_cuboids:cuboidPool(),recipe_scaling:recipePool(),relational_money:relationalMoneyPool(),ratio_coins:ratioCoinsPool()
};
function pool(k){return clone(POOLS[k]||[]);}

function circlePoints(cx,cy,rx,ry,n=40){return Array.from({length:n},(_,i)=>{const a=2*Math.PI*i/n;return{x:cx+rx*Math.cos(a),y:cy+ry*Math.sin(a)};});}
function renderReasoning(C,x,y,w,h,v,answers){
  const ink=[31,41,55],muted=[95,105,120],teal=[15,118,110],line=[190,202,207],pale=[244,249,248];
  if(v.subtype==='number_cards'){
    const vals=v.values||[],gap=8,cw=(w-gap*(vals.length-1))/vals.length,cy=y+h*.48,ch=Math.min(42,h*.45);
    vals.forEach((n,j)=>{const xx=x+j*(cw+gap);C.rect(xx,cy-ch/2,cw,ch,{fill:[250,252,252],stroke:line,width:.7});C.text(xx+cw/2,cy+4,n==null?'?':String(n),13,{bold:true,align:'center',color:n==null?teal:ink});});
    C.text(x+w/2,y+14,`Mean = ${v.mean}`,7.4,{bold:true,align:'center',color:muted});
  }else if(v.subtype==='venn'){
    const cy=y+h*.52,rx=w*.21,ry=Math.min(h*.28,55),c1=x+w*.42,c2=x+w*.58;C.polygon(circlePoints(c1,cy,rx,ry),{stroke:ink,width:.9});C.polygon(circlePoints(c2,cy,rx,ry),{stroke:ink,width:.9});
    C.text(c1-rx*.45,y+15,v.labels?.[0]||'A',7.3,{bold:true,align:'center',color:ink});C.text(c2+rx*.45,y+15,v.labels?.[1]||'B',7.3,{bold:true,align:'center',color:ink});
    if(v.both!=null)C.text((c1+c2)/2,cy+3,String(v.both),10,{bold:true,align:'center',color:teal});
  }else if(v.subtype==='unit_order'){
    const items=v.items||[],gap=8,bw=(w-gap)/2,bh=Math.min(38,(h-10)/2);items.forEach((it,j)=>{const row=Math.floor(j/2),col=j%2,xx=x+col*(bw+gap),yy=y+row*(bh+8);C.rect(xx,yy,bw,bh,{fill:pale,stroke:line,width:.55});C.text(xx+10,yy+14,String.fromCharCode(65+j)+'.',7.5,{bold:true,color:teal});C.text(xx+27,yy+14,it,7.3,{color:ink});});
  }else if(v.subtype==='sequence'){
    const vals=v.values||[],gap=7,bw=Math.min(64,(w-gap*(vals.length-1))/Math.max(1,vals.length)),start=x+(w-(bw*vals.length+gap*(vals.length-1)))/2,yy=y+h*.46-18;
    vals.forEach((n,j)=>{const xx=start+j*(bw+gap);C.rect(xx,yy,bw,36,{fill:pale,stroke:line,width:.6});C.text(xx+bw/2,yy+23,n==null?'?':String(n),10,{bold:true,align:'center',color:n==null?teal:ink});if(j<vals.length-1)C.text(xx+bw+gap/2,yy+23,'→',8,{align:'center',color:muted});});
  }else if(v.subtype==='letter_grid'){
    const rows=v.rows||[],cell=Math.min(28,w/7,h/5),left=x+w*.2,top=y+8;rows.forEach((r,ri)=>{r.letters.forEach((ch,ci)=>{C.rect(left+ci*cell,top+ri*cell,cell,cell,{fill:[250,252,252],stroke:line,width:.5});C.text(left+(ci+.5)*cell,top+(ri+.67)*cell,ch,9,{bold:true,align:'center',color:ink});});C.text(left+4.4*cell,top+(ri+.67)*cell,'=',8,{bold:true,color:muted});C.text(left+5.1*cell,top+(ri+.67)*cell,String(r.sum),9,{bold:true,color:teal});});
  }else if(v.subtype==='similar_triangles'){
    const baseY=y+h*.78,smallX=x+w*.10,largeX=x+w*.55,sv=v.small||[],lv=v.large||[],ratio=Math.max(.45,Math.min(1.8,Number(lv[1]||8)/Number(lv[0]||6))),smallW=w*.24,smallH=Math.min(h*.48,smallW*ratio),largeW=w*.32,largeH=Math.min(h*.62,largeW*ratio);
    C.polygon([{x:smallX,y:baseY},{x:smallX+smallW,y:baseY},{x:smallX,y:baseY-smallH}],{stroke:ink,width:.9});C.polygon([{x:largeX,y:baseY},{x:largeX+largeW,y:baseY},{x:largeX,y:baseY-largeH}],{stroke:ink,width:.9});
    const lab=(val)=>val==null?'?':String(val),col=(val)=>val==null?teal:ink;
    C.text(smallX+smallW/2,baseY+13,lab(sv[0]),7,{bold:true,align:'center',color:col(sv[0])});C.text(smallX-8,baseY-smallH/2,lab(sv[1]),7,{bold:true,align:'center',color:col(sv[1])});C.text(smallX+smallW*.58,baseY-smallH*.55,lab(sv[2]),7,{bold:true,align:'center',color:col(sv[2])});
    C.text(largeX+largeW/2,baseY+13,lab(lv[0]),7,{bold:true,align:'center',color:ink});C.text(largeX-8,baseY-largeH/2,lab(lv[1]),7,{bold:true,align:'center',color:ink});C.text(largeX+largeW*.58,baseY-largeH*.55,lab(lv[2]),7,{bold:true,align:'center',color:ink});C.text(x+w/2,y+12,'Similar right-angled triangles',7.2,{bold:true,align:'center',color:muted});
  }else if(v.subtype==='cuboids'){
    const draw=(xx,yy,ww,hh,dd,vals,label)=>{const dx=dd,dy=-dd*.55;C.rect(xx,yy-hh,ww,hh,{stroke:ink,width:.8});C.polygon([{x:xx,y:yy-hh},{x:xx+dx,y:yy-hh+dy},{x:xx+ww+dx,y:yy-hh+dy},{x:xx+ww,y:yy-hh}],{stroke:ink,width:.8});C.polygon([{x:xx+ww,y:yy},{x:xx+ww+dx,y:yy+dy},{x:xx+ww+dx,y:yy-hh+dy},{x:xx+ww,y:yy-hh}],{stroke:ink,width:.8});C.text(xx+ww/2,yy+13,`${vals[0]} cm`,6.5,{align:'center',color:ink});C.text(xx-9,yy-hh/2,`${vals[2]==null?'?':vals[2]} cm`,6.5,{align:'center',color:vals[2]==null?teal:ink});C.text(xx+ww+dx/2+5,yy+dy/2+8,`${vals[1]} cm`,6.5,{align:'center',color:ink});C.text(xx+ww/2,yy-hh-20,label,7,{bold:true,align:'center',color:muted});};
    draw(x+w*.10,y+h*.76,w*.25,h*.28,18,v.a||[],'Cuboid A');draw(x+w*.58,y+h*.76,w*.25,h*.28,18,v.b||[],'Cuboid B');
  }else if(v.subtype==='recipe'){
    const items=v.items||[],rowH=Math.min(22,h/(items.length+2)),left=x+w*.12,top=y+8,tw=w*.76;C.text(left,top+9,`Recipe serves ${v.serves}`,8,{bold:true,color:teal});items.forEach((it,j)=>{const yy=top+(j+1)*rowH;C.rect(left,yy,tw,rowH,{fill:j%2?[250,252,252]:null,stroke:line,width:.35});C.text(left+7,yy+rowH*.67,it.name,7,{color:ink});C.text(left+tw-7,yy+rowH*.67,`${it.amount}${it.unit}`,7,{bold:true,align:'right',color:ink});});
  }
}
global.TT99VisualRenderers=global.TT99VisualRenderers||{};global.TT99VisualRenderers.reasoning=renderReasoning;

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
G.replaceQuestion=function(questions,index,inputRules,seed){const cur=questions?.[index];if(!cur||!isKind(cur.kind))return previous.replaceQuestion(questions,index,inputRules,seed);const p=(POOLS[cur.kind]||[]).filter(q=>q.key!==cur.key),used=new Set(questions.filter((_,i)=>i!==index).map(q=>q.key)),c=p.filter(q=>!used.has(q.key)),rng=rngFor(String(seed||'')+':reasoning-replace'),choice=shuffle(c.length?c:p,rng)[0];if(!choice)return questions.slice();const out=questions.slice();out[index]={...clone(choice),number:index+1};return out;};

function validate(){
  const errors=[];
  for(const [kind,p] of Object.entries(POOLS)){if(!p.length)errors.push(`${kind}:empty`);const keys=new Set();for(const item of p){if(keys.has(item.key))errors.push(`${kind}:duplicate-key`);keys.add(item.key);if(item.answer==null||item.answer==='')errors.push(`${kind}:blank-answer`);}}
  return {ok:errors.length===0,errors,counts:Object.fromEntries(Object.entries(POOLS).map(([k,p])=>[k,p.length]))};
}
global.TT99CustomReasoning={VERSION,FAMILIES,POOLS,validate,renderReasoning};
}(typeof window!=='undefined'?window:globalThis));
