(function(global){
'use strict';
const G=global.TT99Generator;if(!G)return;
const VERSION='0.1.0';
const FAMILIES={
number_card_constraints:{label:'number-card constraints',strand:'Number & place value',years:[1,2,3,4,5,6]},
missing_symbols:{label:'missing operation / comparison symbols',strand:'Calculation',years:[1,2,3,4,5,6]},
container_reasoning:{label:'packets, boxes & whole-container problems',strand:'Calculation',years:[2,3,4,5,6]},
calendar_reasoning_visual:{label:'calendar reasoning',strand:'Measurement',years:[1,2,3,4]},
clock_reasoning_visual:{label:'analogue clock reasoning',strand:'Measurement',years:[1,2,3,4]},
balance_scales:{label:'balance-scale mass problems',strand:'Measurement',years:[2,3,4,5]},
number_line_visuals:{label:'number-line reasoning',strand:'Number & place value',years:[1,2,3,4,5,6]},
fraction_diagrams:{label:'fraction diagrams',strand:'Fractions',years:[1,2,3,4,5,6]},
data_diagrams:{label:'pictograms & block charts',strand:'Statistics',years:[2,3,4,5]},
cube_net_reasoning:{label:'cube-net opposite faces',strand:'Geometry',years:[4,5,6]}
};
const IDS=Object.keys(FAMILIES),isKind=k=>IDS.includes(String(k||'')),hasKind=r=>Array.isArray(r?.families)&&r.families.some(isKind),clone=o=>JSON.parse(JSON.stringify(o));
for(const [id,m] of Object.entries(FAMILIES)){
if(!G.FAMILY_META[id])G.FAMILY_META[id]={label:m.label,strand:m.strand,years:m.years.slice(),visual:true};
G.FAMILY_LABELS[id]=m.label;
if(Array.isArray(G.FAMILY_ORDER)&&!G.FAMILY_ORDER.includes(id))G.FAMILY_ORDER.push(id);
if(Array.isArray(G.FAMILY_COMPACT_ORDER)&&!G.FAMILY_COMPACT_ORDER.includes(id))G.FAMILY_COMPACT_ORDER.push(id);
}
const q=(kind,subtype,i,prompt,answer,extra={})=>{const {key:keyExtra='',...rest}=extra;return {kind,prompt,answer:String(answer),key:`${kind}:${subtype}:${i}:${keyExtra}`,group:subtype,footprint:rest.footprint||(rest.visual?'L':'M'),marking:rest.marking||{mode:'exact',answer:String(answer)},...rest};};
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function numberCardPool(){
const out=[];let i=0;
for(let j=0;j<24;j++){
const digits=[];for(const n of [1+((j*3)%9),1+((j*5+2)%9),1+((j*7+4)%9),1+((j+6)%9)])if(!digits.includes(n)&&digits.length<3)digits.push(n);
while(digits.length<3){const n=1+((j+digits.length*2)%9);if(!digits.includes(n))digits.push(n);}
const asc=digits.slice().sort((a,b)=>a-b),desc=asc.slice().reverse(),mode=j%2,ans=Number((mode?desc:asc).join(''));
out.push(q('number_card_constraints',mode?'largest_number':'smallest_number',i++,`Use all three cards once to make the ${mode?'largest':'smallest'} possible 3-digit number.`,ans,{key:digits.join('-'),visual:{type:'foundation',subtype:'number_cards',cards:digits,target:mode?'largest':'smallest'}}));
}
for(let j=0;j<30;j++){
const cards=[3+(j%8),8+((j*3)%12),18+((j*5)%18),28+((j*7)%22)],threshold=10+((j*4)%25),valid=cards.filter(n=>n>threshold);
if(!valid.length||valid.length===cards.length)continue;
out.push(q('number_card_constraints','inequality_pick',i++,`Choose every card that makes □ > ${threshold} true.`,valid.join(', '),{key:`${cards.join('-')}:${threshold}`,visual:{type:'foundation',subtype:'number_cards',cards,threshold,target:'greater'}}));
}
for(let j=0;j<40;j++){
const cards=[5+(j%12),15+((j*3)%20),25+((j*5)%25),35+((j*7)%30)],x=j%4,y=(j+2)%4,target=cards[x]+cards[y],solutions=[];
for(let a=0;a<cards.length;a++)for(let b=a+1;b<cards.length;b++)if(cards[a]+cards[b]===target)solutions.push([cards[a],cards[b]]);
if(solutions.length!==1)continue;
out.push(q('number_card_constraints','pair_sum',i++,`Choose two cards that add to make ${target}.`,solutions[0].join(' + '),{key:`${cards.join('-')}:${target}`,visual:{type:'foundation',subtype:'number_cards',cards,targetSum:target,target:'sum'}}));
}
return out;
}
function missingSymbolPool(){
const ops=['+','−','×','÷'],calc=(a,op,b)=>op==='+'?a+b:op==='−'?a-b:op==='×'?a*b:(b&&a%b===0?a/b:NaN),out=[];let i=0;
for(let j=0;j<100&&out.length<52;j++){
const a=4+(j%17),b=2+((j*5)%11),op=ops[j%ops.length],target=calc(a,op,b);if(!Number.isFinite(target)||target<0)continue;
if(ops.filter(o=>calc(a,o,b)===target).length!==1)continue;
out.push(q('missing_symbols','operation',i++,`Choose the operation symbol that makes the calculation correct.`,op,{key:`${a}:${b}:${target}`,visual:{type:'foundation',subtype:'missing_symbol',left:a,right:b,target,choices:ops,relation:'operation'}}));
}
for(let j=0;j<40;j++){
const a=5+((j*7)%55),b=5+((j*11)%55);if(a===b)continue;const op=a<b?'<':'>';
out.push(q('missing_symbols','comparison',i++,`Choose <, > or = to make the statement correct.`,op,{key:`${a}:${b}`,visual:{type:'foundation',subtype:'missing_symbol',left:a,right:b,choices:['<','>','='],relation:'comparison'}}));
}
return out;
}
function containerPool(){
const out=[];let i=0;
for(let j=0;j<40;j++){const per=3+(j%9),needed=10+((j*7)%70),packs=Math.ceil(needed/per);
out.push(q('container_reasoning','whole_packs',i++,`Items are sold in packs of ${per}. You need ${needed} items. What is the smallest number of packs you must buy?`,packs,{key:`${per}:${needed}`,visual:{type:'foundation',subtype:'containers',per,needed,packs,mode:'whole_packs'}}));}
for(let j=0;j<36;j++){const per=4+(j%8),groups=3+(j%9),total=per*groups;
out.push(q('container_reasoning','number_of_groups',i++,`There are ${total} items. Put ${per} items in each box. How many full boxes can be made?`,groups,{key:`${per}:${total}`,visual:{type:'foundation',subtype:'containers',per,needed:total,packs:groups,mode:'groups'}}));}
return out;
}
function calendarPool(){
const out=[];let i=0,months=[['April',30],['June',30],['September',30],['November',30],['January',31],['March',31],['May',31],['July',31]];
for(const [month,days] of months)for(let start=0;start<7;start+=2)for(const date of [5,9,14,16,22,27]){
if(date>days)continue;const day=DAYS[(start+date-1)%7];
out.push(q('calendar_reasoning_visual','date_to_day',i++,`Look at the calendar. What day of the week is ${date} ${month}?`,day,{key:`${month}:${days}:${start}:${date}`,visual:{type:'foundation',subtype:'calendar',month,days,start,date,mode:'date_to_day'}}));
}
for(let j=0;j<32;j++){const start=j%7,from=3+((j*3)%18),offset=1+(j%9),to=from+offset;if(to>28)continue;const ans=DAYS[(start+to-1)%7];
out.push(q('calendar_reasoning_visual','days_after',i++,`The calendar shows the month. What day of the week is ${offset} day${offset===1?'':'s'} after the ${from}th?`,ans,{key:`${start}:${from}:${offset}`,visual:{type:'foundation',subtype:'calendar',month:'Month',days:30,start,date:from,targetDate:to,mode:'days_after'}}));}
return out;
}
function timeWord(h,m){return m===0?`${h} o'clock`:m===15?`quarter past ${h}`:m===30?`half past ${h}`:m===45?`quarter to ${h===12?1:h+1}`:m<30?`${m} minutes past ${h}`:`${60-m} minutes to ${h===12?1:h+1}`;}
function clockPool(){
const out=[];let i=0;
for(let h=1;h<=12;h++)for(const m of [0,5,10,15,20,25,30,35,40,45,50,55])out.push(q('clock_reasoning_visual','read_clock',i++,`What time does the clock show?`,timeWord(h,m),{key:`${h}:${m}`,visual:{type:'foundation',subtype:'clock',hour:h,minute:m,mode:'read'}}));
for(let h=1;h<=12;h+=2)for(const m of [0,15,30,45])for(const add of [15,20,30,45]){
const total=(h%12)*60+m+add,nh=Math.floor(total/60)%12||12,nm=total%60;
out.push(q('clock_reasoning_visual','minutes_later',i++,`The clock shows the start time. What time will it be ${add} minutes later?`,timeWord(nh,nm),{key:`${h}:${m}:+${add}`,visual:{type:'foundation',subtype:'clock',hour:h,minute:m,mode:'elapsed',delta:add}}));
}
return out;
}
function balancePool(){
const out=[];let i=0;
for(let blocks=2;blocks<=6;blocks++)for(let mass=20;mass<=120;mass+=20){const total=blocks*mass;
out.push(q('balance_scales','equal_blocks',i++,`The scale is balanced. Each block has the same mass. What is the mass of one block?`,`${mass} g`,{key:`${blocks}:${mass}`,visual:{type:'foundation',subtype:'balance',leftBlocks:blocks,rightMass:total,blockMass:mass}}));}
return out;
}
function numberLinePool(){
const out=[];let i=0;
for(let j=0;j<48;j++){const step=[1,2,5,10,20,25,50,100][j%8],start=(j%9)*step,ticks=6,missing=1+(j%(ticks-1)),vals=Array.from({length:ticks},(_,k)=>start+k*step),ans=vals[missing];
out.push(q('number_line_visuals','missing_tick',i++,`Write the missing number on the number line.`,ans,{key:`${start}:${step}:${missing}`,visual:{type:'foundation',subtype:'number_line',values:vals,missing,mode:'missing'}}));}
for(let j=0;j<36;j++){const a=10+((j*7)%80),gap=2*(5+(j%20)),b=a+gap,mid=a+gap/2;
out.push(q('number_line_visuals','halfway',i++,`What number is halfway between ${a} and ${b}?`,mid,{key:`${a}:${b}`,visual:{type:'foundation',subtype:'number_line',values:[a,mid,b],missing:1,mode:'halfway'}}));}
return out;
}
function fractionPool(){
const out=[];let i=0,forms=[[1,2],[1,3],[2,3],[1,4],[2,4],[3,4],[1,5],[2,5],[3,5],[4,5],[3,8],[5,8],[7,8]];
for(const [n,d] of forms)for(let v=0;v<3;v++){
out.push(q('fraction_diagrams','identify_shaded',i++,`What fraction of the diagram is shaded?`,`${n}/${d}`,{key:`${n}:${d}:${v}:id`,visual:{type:'foundation',subtype:'fraction_grid',n,d,variant:v,mode:'identify'}}));
out.push(q('fraction_diagrams','shade_fraction',i++,`Shade ${n}/${d} of the diagram.`,`${n}/${d} shaded`,{key:`${n}:${d}:${v}:shade`,visual:{type:'foundation',subtype:'fraction_grid',n,d,variant:v,mode:'shade'},marking:{mode:'rubric',answer:`${n}/${d} shaded`,rule:`Exactly ${n} of ${d} equal parts shaded.`}}));
}
return out;
}
function dataPool(){
const out=[];let i=0,names=['Red','Blue','Green','Yellow'];
for(let j=0;j<36;j++){const vals=[2+(j%7),3+((j*3)%7),1+((j*5)%8),4+((j*7)%6)],missing=j%4,ans=vals[missing];
out.push(q('data_diagrams','block_chart_missing',i++,`The block chart has one missing bar. How many blocks should the missing bar have?`,ans,{key:`${vals.join('-')}:${missing}:bar`,visual:{type:'foundation',subtype:'block_chart',labels:names,values:vals,missing,mode:'missing_bar'}}));}
for(let j=0;j<36;j++){const keyValue=[1,2,5][j%3],counts=[2+(j%5),3+((j*2)%5),1+((j*4)%6)],ask=j%3,ans=counts[ask]*keyValue;
out.push(q('data_diagrams','pictogram_read',i++,`Each symbol represents ${keyValue}. How many are shown for ${names[ask]}?`,ans,{key:`${keyValue}:${counts.join('-')}:${ask}`,visual:{type:'foundation',subtype:'pictogram',labels:names.slice(0,3),counts,keyValue,ask}}));}
return out;
}
const NETS=[
[[0,1],[1,1],[2,1],[3,1],[1,0],[1,2]],
[[0,1],[1,1],[2,1],[3,1],[2,0],[1,2]],
[[1,0],[1,1],[1,2],[1,3],[0,1],[2,2]],
[[0,0],[0,1],[1,1],[2,1],[2,2],[3,2]]
];
const V=(x,y,z)=>[x,y,z],neg=a=>a.map(n=>-n),eq=(a,b)=>a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2];
function foldNet(cells){
const map=new Map(cells.map((p,i)=>[p.join(','),i])),ori=Array(cells.length),queue=[0];ori[0]={u:V(1,0,0),v:V(0,1,0),n:V(0,0,1)};
while(queue.length){const i=queue.shift(),[x,y]=cells[i],o=ori[i],dirs=[[1,0,'E'],[-1,0,'W'],[0,1,'S'],[0,-1,'N']];
for(const [dx,dy,d] of dirs){const j=map.get(`${x+dx},${y+dy}`);if(j==null||ori[j])continue;let no;
if(d==='E')no={u:neg(o.n),v:o.v.slice(),n:o.u.slice()};
else if(d==='W')no={u:o.n.slice(),v:o.v.slice(),n:neg(o.u)};
else if(d==='S')no={u:o.u.slice(),v:neg(o.n),n:o.v.slice()};
else no={u:o.u.slice(),v:o.n.slice(),n:neg(o.v)};
ori[j]=no;queue.push(j);}}
return ori;
}
function cubeNetPool(){
const out=[];let i=0;
for(let ni=0;ni<NETS.length;ni++){const cells=NETS[ni],ori=foldNet(cells);if(ori.some(x=>!x))continue;
for(let marked=0;marked<cells.length;marked++){const opp=ori.findIndex((o,j)=>j!==marked&&eq(o.n,neg(ori[marked].n)));if(opp<0)continue;const labels=['A','B','C','D','E','F'];
out.push(q('cube_net_reasoning','opposite_face',i++,`A cross is drawn on one face of the cube net. Which labelled face will be opposite it when the net is folded?`,labels[opp],{key:`${ni}:${marked}`,visual:{type:'foundation',subtype:'cube_net',cells,labels,marked,opposite:opp}}));}}
return out;
}
const POOLS={number_card_constraints:numberCardPool(),missing_symbols:missingSymbolPool(),container_reasoning:containerPool(),calendar_reasoning_visual:calendarPool(),clock_reasoning_visual:clockPool(),balance_scales:balancePool(),number_line_visuals:numberLinePool(),fraction_diagrams:fractionPool(),data_diagrams:dataPool(),cube_net_reasoning:cubeNetPool()};

function circlePts(cx,cy,r,n=48){return Array.from({length:n},(_,i)=>{const a=2*Math.PI*i/n;return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)};});}
function renderFoundation(C,x,y,w,h,v,answers){
const ink=[31,41,55],muted=[95,105,120],teal=[15,118,110],line=[190,202,207],pale=[244,249,248],fill=[224,242,239];
if(v.subtype==='number_cards'){
const cards=v.cards||[],gap=10,cw=Math.min(58,(w-gap*(cards.length-1))/cards.length),left=x+(w-(cw*cards.length+gap*(cards.length-1)))/2,yy=y+h*.38-24;
cards.forEach((n,j)=>{C.rect(left+j*(cw+gap),yy,cw,48,{fill:pale,stroke:line,width:.8});C.text(left+j*(cw+gap)+cw/2,yy+30,String(n),13,{bold:true,align:'center',color:ink});});
if(v.targetSum!=null)C.text(x+w/2,yy+69,`Target total: ${v.targetSum}`,7,{bold:true,align:'center',color:teal});else if(v.threshold!=null)C.text(x+w/2,yy+69,`Choose cards greater than ${v.threshold}`,7,{bold:true,align:'center',color:teal});
}else if(v.subtype==='missing_symbol'){
const cy=y+h*.5,size=15;C.text(x+w*.27,cy,String(v.left),size,{bold:true,align:'center',color:ink});C.rect(x+w*.39,cy-18,w*.13,28,{fill:pale,stroke:teal,width:.8});C.text(x+w*.61,cy,String(v.right),size,{bold:true,align:'center',color:ink});
if(v.relation==='operation'){C.text(x+w*.73,cy,'=',size,{bold:true,align:'center',color:muted});C.text(x+w*.86,cy,String(v.target),size,{bold:true,align:'center',color:ink});}
C.text(x+w/2,y+h*.78,(v.choices||[]).join('   '),8,{bold:true,align:'center',color:muted});
if(answers){let ans;if(v.relation==='comparison')ans=v.left<v.right?'<':v.left>v.right?'>':'=';else ans=(v.choices||[]).find(o=>o==='+'?v.left+v.right===v.target:o==='−'?v.left-v.right===v.target:o==='×'?v.left*v.right===v.target:(v.right&&v.left%v.right===0&&v.left/v.right===v.target));C.text(x+w*.455,cy,String(ans),12,{bold:true,align:'center',color:teal});}
}else if(v.subtype==='containers'){
const count=Math.min(v.packs||5,8),gap=7,bw=Math.min(44,(w-gap*(count-1))/count),left=x+(w-(bw*count+gap*(count-1)))/2,yy=y+h*.38-20;
for(let j=0;j<count;j++){C.rect(left+j*(bw+gap),yy,bw,40,{fill:pale,stroke:line,width:.65});C.text(left+j*(bw+gap)+bw/2,yy+25,`${v.per}`,8,{bold:true,align:'center',color:ink});}
C.text(x+w/2,yy+62,v.mode==='whole_packs'?`${v.per} per pack · need ${v.needed}`:`${v.per} per box · ${v.needed} items`,7,{align:'center',color:muted});
}else if(v.subtype==='calendar'){
const cols=7,rows=6,cw=w*.88/cols,ch=Math.min(22,h*.68/(rows+1)),left=x+w*.06,top=y+8;C.text(x+w/2,top,`${v.month}`,8,{bold:true,align:'center',color:teal});const gridTop=top+12;
DAYS.forEach((d,j)=>C.text(left+(j+.5)*cw,gridTop+9,d.slice(0,2),5.8,{bold:true,align:'center',color:muted}));
for(let d=1;d<=v.days;d++){const pos=v.start+d-1,row=Math.floor(pos/7),col=pos%7,xx=left+col*cw,yy=gridTop+(row+1)*ch,hi=d===v.date||d===v.targetDate;C.rect(xx,yy,cw,ch,{fill:hi?fill:null,stroke:line,width:.35});C.text(xx+cw/2,yy+ch*.66,String(d),6.2,{bold:hi,align:'center',color:hi?teal:ink});}
}else if(v.subtype==='clock'){
const cx=x+w/2,cy=y+h*.52,r=Math.min(w*.22,h*.36);C.polygon(circlePts(cx,cy,r),{stroke:ink,width:.9});for(let k=0;k<12;k++){const a=k/12*2*Math.PI-Math.PI/2,tx=cx+Math.cos(a)*r*.82,ty=cy+Math.sin(a)*r*.82;C.text(tx,ty+2,String(k===0?12:k),5.8,{align:'center',color:muted});}
const ma=v.minute/60*2*Math.PI-Math.PI/2,ha=((v.hour%12+v.minute/60)/12)*2*Math.PI-Math.PI/2;C.line(cx,cy,cx+Math.cos(ha)*r*.48,cy+Math.sin(ha)*r*.48,{color:ink,width:1.8});C.line(cx,cy,cx+Math.cos(ma)*r*.72,cy+Math.sin(ma)*r*.72,{color:teal,width:1.2});C.polygon(circlePts(cx,cy,2.2,14),{fill:ink,stroke:ink,width:.3});if(v.delta)C.text(cx,cy+r+16,`+${v.delta} min`,7,{bold:true,align:'center',color:teal});
}else if(v.subtype==='balance'){
const cy=y+h*.55,cx=x+w/2,beamW=w*.72;C.line(cx-beamW/2,cy,cx+beamW/2,cy,{color:ink,width:1.5});C.polygon([{x:cx-13,y:cy+35},{x:cx+13,y:cy+35},{x:cx,y:cy+3}],{fill:[235,239,242],stroke:ink,width:.7});const trayY=cy-18;
for(let j=0;j<v.leftBlocks;j++){const bx=cx-beamW*.32+(j-(v.leftBlocks-1)/2)*24;C.rect(bx-10,trayY-18,20,18,{fill:fill,stroke:line,width:.65});}
C.text(cx+beamW*.32,trayY-5,`${v.rightMass} g`,10,{bold:true,align:'center',color:ink});C.text(cx,cy+52,'balanced',6.5,{align:'center',color:muted});
}else if(v.subtype==='number_line'){
const vals=v.values||[],left=x+w*.10,right=x+w*.90,cy=y+h*.52;C.line(left,cy,right,cy,{color:ink,width:.9});vals.forEach((n,j)=>{const xx=left+(right-left)*j/(vals.length-1);C.line(xx,cy-7,xx,cy+7,{color:ink,width:.8});const hidden=j===v.missing;C.text(xx,cy+23,hidden?'□':String(n),7,{bold:hidden,align:'center',color:hidden?teal:ink});});
}else if(v.subtype==='fraction_grid'){
const d=v.d,n=v.n,cols=d<=5?d:4,rows=Math.ceil(d/cols),gw=w*.62,gh=Math.min(h*.52,90),cw=gw/cols,ch=gh/rows,left=x+(w-gw)/2,top=y+(h-gh)/2,shade=v.mode==='identify'||answers?n:0;
for(let k=0;k<d;k++){const row=Math.floor(k/cols),col=k%cols;C.rect(left+col*cw,top+row*ch,cw,ch,{fill:k<shade?fill:null,stroke:ink,width:.65});}C.text(x+w/2,top+gh+17,`${d} equal parts`,6.5,{align:'center',color:muted});
}else if(v.subtype==='block_chart'){
const vals=v.values||[],max=Math.max(...vals,1),left=x+w*.16,base=y+h*.78,chartH=h*.58,bw=w*.13,gap=w*.055;C.line(left-8,base,left+vals.length*(bw+gap),base,{color:ink,width:.7});
vals.forEach((n,j)=>{const shown=j===v.missing&&!answers?0:n,bh=chartH*shown/max,xx=left+j*(bw+gap);C.rect(xx,base-bh,bw,bh,{fill:fill,stroke:teal,width:.55});C.text(xx+bw/2,base+14,v.labels[j],5.8,{align:'center',color:ink});if(j===v.missing)C.text(xx+bw/2,base-chartH-6,answers?String(n):'?',7,{bold:true,align:'center',color:teal});});
}else if(v.subtype==='pictogram'){
const left=x+w*.18,top=y+10,rowH=Math.min(30,h*.22),symbolR=5.5;v.labels.forEach((lab,ri)=>{const yy=top+ri*rowH;C.text(left-8,yy+8,lab,6.3,{align:'right',color:ink});for(let j=0;j<v.counts[ri];j++)C.polygon(circlePts(left+10+j*18,yy+5,symbolR,18),{fill:fill,stroke:teal,width:.45});});C.text(x+w/2,y+h-10,`● = ${v.keyValue}`,6.5,{bold:true,align:'center',color:muted});
}else if(v.subtype==='cube_net'){
const cells=v.cells||[],xs=cells.map(p=>p[0]),ys=cells.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),s=Math.min(38,w*.75/(maxX-minX+1),h*.72/(maxY-minY+1)),left=x+w/2-(maxX-minX+1)*s/2,top=y+h/2-(maxY-minY+1)*s/2;
cells.forEach((p,j)=>{const xx=left+(p[0]-minX)*s,yy=top+(p[1]-minY)*s,isOpp=answers&&j===v.opposite;C.rect(xx,yy,s,s,{fill:isOpp?fill:null,stroke:ink,width:.75});C.text(xx+s/2,yy+s*.68,v.labels[j],7,{bold:true,align:'center',color:isOpp?teal:ink});if(j===v.marked)C.text(xx+s/2,yy+s*.40,'×',12,{bold:true,align:'center',color:teal});});
}
}
global.TT99VisualRenderers=global.TT99VisualRenderers||{};global.TT99VisualRenderers.foundation=renderFoundation;
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
G.replaceQuestion=function(questions,index,inputRules,seed){const cur=questions?.[index];if(!cur||!isKind(cur.kind))return previous.replaceQuestion(questions,index,inputRules,seed);let p=(POOLS[cur.kind]||[]).filter(q=>q.key!==cur.key&&q.group===cur.group),used=new Set(questions.filter((_,i)=>i!==index).map(q=>q.key));let c=p.filter(q=>!used.has(q.key));if(!c.length)c=p;const rng=rngFor(String(seed||'')+':foundation-replace'),choice=shuffle(c,rng)[0];if(!choice)return questions.slice();const out=questions.slice();out[index]={...clone(choice),number:index+1};return out;};
function validate(){
const errors=[];
for(const [kind,p] of Object.entries(POOLS)){if(p.length<12)errors.push(`${kind}:pool-too-small:${p.length}`);const keys=new Set();for(const item of p){if(keys.has(item.key))errors.push(`${kind}:duplicate-key:${item.key}`);keys.add(item.key);if(item.answer==null||item.answer==='')errors.push(`${kind}:blank-answer`);}}
for(let ni=0;ni<NETS.length;ni++){const o=foldNet(NETS[ni]),normals=o.map(x=>x&&x.n.join(','));if(o.some(x=>!x)||new Set(normals).size!==6)errors.push(`cube_net_reasoning:invalid-net-${ni}`);}
return {ok:!errors.length,errors,counts:Object.fromEntries(Object.entries(POOLS).map(([k,p])=>[k,p.length]))};
}
global.TT99CustomVisualReasoning={VERSION,FAMILIES,POOLS,NETS,foldNet,validate,renderFoundation};
}(typeof window!=='undefined'?window:globalThis));
