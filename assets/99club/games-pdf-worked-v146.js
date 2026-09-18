/* 99 Club Studio · worked-example PDF safety + modern puzzle visuals v1.47
 * Repairs newer worked-example kinds that the original exporter does not know
 * how to draw, and provides a safe text fallback for future puzzle families.
 */
(function(global){
'use strict';
const PDF=global.TT99GamesPDF,P=global.TT99SimplePDF;if(!PDF||!P||PDF.__workedV146)return;
const previous=PDF.buildDocument,PW=P.PAGE_W,PH=P.PAGE_H,M=34;
const INK=[38,66,72],MUT=[99,119,123],TEAL=[22,132,122],LINE=[198,215,216],PALE=[247,250,250],HIT=[232,247,243],WHITE=[255,255,255],WATCH=[130,84,60],GEM=[25,139,128];
const BASE_KINDS=new Set(['wordsearch','crossword','pyramid','magic','sudoku','kakuro','futoshiki','arithmeticcages','nonogram','numberpath','arithmagon','magicshape','maze','propertymaze','crossnumber','numbersearch','equationcrossgrid','numbertrail','target','brokencalc','symbols','domino','operationgrid','numberwheels','functionmachine','balance','shikaku']);
const MODERN_KINDS=new Set(['sumplete','numbertowers','takuzu','killersudoku','hashi','mathsmines','alphametics','balance','cornersum','linkedsum','colourlogic','mobilebalance','diagonalpath','squaresearch','insertops','perimeterregions','operationgrid','symbols','numberwheels']);
function n(v){return Number(v).toFixed(2).replace(/\.00$/,'');}
function rgb(c){return c.map(v=>Math.max(0,Math.min(255,v))/255).map(n).join(' ');}
function esc(s){return P.asciiish(String(s??'')).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}
function text(c,x,y,t,size=8,opt={}){const s=esc(t),font=opt.bold?'F2':'F1',col=opt.color||INK,w=P.estimateTextWidth(s,size,!!opt.bold);let tx=x;if(opt.align==='center')tx-=w/2;if(opt.align==='right')tx-=w;c.push(`BT /${font} ${n(size)} Tf ${rgb(col)} rg 1 0 0 1 ${n(tx)} ${n(PH-y)} Tm (${s}) Tj ET`);}
function rect(c,x,y,w,h,fill=WHITE,stroke=LINE,width=.7){c.push(`${rgb(fill)} rg ${rgb(stroke)} RG ${n(width)} w ${n(x)} ${n(PH-y-h)} ${n(w)} ${n(h)} re B`);}
function line(c,x1,y1,x2,y2,col=LINE,width=.7,dash=''){c.push(`${rgb(col)} RG ${n(width)} w ${dash?`[${dash}] 0 d`:'[] 0 d'} ${n(x1)} ${n(PH-y1)} m ${n(x2)} ${n(PH-y2)} l S`);}
function circle(c,cx,cy,r,fill=WHITE,stroke=INK,width=1){const k=r*.55228475;c.push(`${rgb(fill)} rg ${rgb(stroke)} RG ${n(width)} w ${n(cx+r)} ${n(PH-cy)} m ${n(cx+r)} ${n(PH-cy+k)} ${n(cx+k)} ${n(PH-cy+r)} ${n(cx)} ${n(PH-cy+r)} c ${n(cx-k)} ${n(PH-cy+r)} ${n(cx-r)} ${n(PH-cy+k)} ${n(cx-r)} ${n(PH-cy)} c ${n(cx-r)} ${n(PH-cy-k)} ${n(cx-k)} ${n(PH-cy-r)} ${n(cx)} ${n(PH-cy-r)} c ${n(cx+k)} ${n(PH-cy-r)} ${n(cx+r)} ${n(PH-cy-k)} ${n(cx+r)} ${n(PH-cy)} c B`);}
function wrap(value,maxWidth,size,bold=false){const words=esc(value).split(/\s+/).filter(Boolean),rows=[];let row='';for(const word of words){const next=row?`${row} ${word}`:word;if(!row||P.estimateTextWidth(next,size,bold)<=maxWidth)row=next;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}
function wrapped(c,x,y,value,maxWidth,size,opt={}){const rows=wrap(value,maxWidth,size,!!opt.bold).slice(0,opt.maxLines||99),lh=opt.lineHeight||size*1.22;rows.forEach((r,i)=>text(c,x,y+i*lh,r,size,opt));return rows.length*lh;}
function kindOf(ex){return String(ex?.kind||ex?.engineId||'').toLowerCase();}
function titleOf(ex){return esc(ex?.title||'Worked example').replace(/ worked example$/i,'');}
function cross(c,x,y,s,col=[164,101,91]){line(c,x+3,y+3,x+s-3,y+s-3,col,1.25);line(c,x+s-3,y+3,x+3,y+s-3,col,1.25);}
function gem(c,cx,cy,r=6){const pts=[];for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4,rr=i%2===0?r:r*.62;pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);}let cmd=`${rgb(GEM)} rg ${rgb(GEM)} RG .6 w ${n(pts[0][0])} ${n(PH-pts[0][1])} m `;for(let i=1;i<pts.length;i++)cmd+=`${n(pts[i][0])} ${n(PH-pts[i][1])} l `;cmd+='h B';c.push(cmd);}
function miniSumplete(c,x,y,w){const cell=28,sx=x+w/2-(cell*4)/2,vals=[2,5,7],target=9;vals.forEach((v,i)=>{rect(c,sx+i*cell,y,cell,cell,WHITE,[153,176,178],.65);text(c,sx+i*cell+cell/2,y+18,String(v),9,{bold:true,align:'center'});if(i===1)cross(c,sx+i*cell,y,cell);});rect(c,sx+3*cell,y,cell,cell,PALE,[95,154,147],.85);text(c,sx+3.5*cell,y+18,String(target),9,{bold:true,color:TEAL,align:'center'});return {h:28,caption:'Keep 2 and 7: 2 + 7 = 9, so cross out 5.'};}
function miniTowers(c,x,y,w){const cell=29,sx=x+w/2-cell*2,vals=[1,2,3,4];text(c,sx-18,y+19,'4',9,{bold:true,color:TEAL,align:'center'});text(c,sx+cell*4+18,y+19,'1',9,{bold:true,color:TEAL,align:'center'});vals.forEach((v,i)=>{rect(c,sx+i*cell,y,cell,cell,WHITE,[144,169,172],.65);text(c,sx+i*cell+cell/2,y+19,String(v),9,{bold:true,align:'center'});});return {h:29,caption:'From the left all four towers are visible; from the right only the 4 is visible.'};}
function miniTakuzu(c,x,y,w){const cell=30,sx=x+w/2-cell*2,vals=['0','0','1','1'];vals.forEach((v,i)=>{rect(c,sx+i*cell,y,cell,cell,i===2?HIT:WHITE,[144,169,172],.65);text(c,sx+i*cell+cell/2,y+20,v,10,{bold:true,color:i===2?TEAL:INK,align:'center'});});return {h:30,caption:'00 cannot become 000, so the next cell is forced to 1.'};}
function miniKiller(c,x,y,w){const cell=27,sx=x+w/2-cell*2,sy=y;for(let r=0;r<2;r++)for(let col=0;col<4;col++)rect(c,sx+col*cell,sy+r*cell,cell,cell,WHITE,[169,190,192],.55);line(c,sx,sy,sx+2*cell,sy,TEAL,1.4,'2 1');line(c,sx,sy,sx,sy+cell,TEAL,1.4,'2 1');line(c,sx+2*cell,sy,sx+2*cell,sy+cell,TEAL,1.4,'2 1');line(c,sx,sy+cell,sx+2*cell,sy+cell,TEAL,1.4,'2 1');text(c,sx+3,sy+8,'3',5.8,{bold:true,color:TEAL});text(c,sx+cell/2,sy+19,'1',9,{bold:true,align:'center'});text(c,sx+1.5*cell,sy+19,'2',9,{bold:true,align:'center'});return {h:54,caption:'A two-cell cage totalling 3 must use 1 and 2; Sudoku rules decide their positions.'};}
function miniHashi(c,x,y,w){const cy=y+22,c1=x+w/2-72,c2=x+w/2,c3=x+w/2+72;line(c,c1+12,cy,c2-12,cy,TEAL,1.6);line(c,c2+12,cy-3,c3-12,cy-3,TEAL,1.5);line(c,c2+12,cy+3,c3-12,cy+3,TEAL,1.5);[[c1,1],[c2,3],[c3,2]].forEach(([cx,v])=>{circle(c,cx,cy,12,WHITE,INK,1);text(c,cx,cy+3,String(v),8,{bold:true,align:'center'});});return {h:44,caption:'The middle island gets 1 bridge on the left and a double bridge on the right: 3 in total.'};}
function miniMines(c,x,y,w){const cell=25,sx=x+w/2-cell*1.5;for(let r=0;r<3;r++)for(let col=0;col<3;col++){const fill=(r===1&&col===1)?PALE:WHITE;rect(c,sx+col*cell,y+r*cell,cell,cell,fill,[166,187,189],.55);}text(c,sx+1.5*cell,y+cell+17,'2',9,{bold:true,color:TEAL,align:'center'});gem(c,sx+cell*.5,y+cell*.5,5);gem(c,sx+cell*2.5,y+cell*2.5,5);return {h:75,caption:'The centre clue 2 is satisfied by exactly two neighbouring gems, including diagonals.'};}
function miniAlpha(c,x,y,w){const bw=Math.min(245,w-60),bx=x+w/2-bw/2;rect(c,bx,y,bw,54,PALE,[184,207,205],.75);text(c,bx+18,y+18,'TWO + TWO = FOUR',10,{bold:true});text(c,bx+18,y+38,'734 + 734 = 1468',10,{bold:true,color:TEAL});return {h:54,caption:'The same letter keeps the same digit, and the column addition must be correct.'};}
function miniBalanceLab(c,x,y,w){
  const bw=Math.min(300,w-40),bx=x+w/2-bw/2;
  rect(c,bx,y,bw,28,PALE,[184,207,205],.75);
  text(c,bx+10,y+18,'A: 7 + 5 = 12     B: 15 - 8 = 7',8,{bold:true});
  line(c,bx+58,y+48,bx+bw/2-8,y+48,INK,1.3);line(c,bx+bw/2+8,y+48,bx+bw-58,y+48,INK,1.3);
  text(c,bx+bw*.25,y+65,'5 + 7 = 12',8,{bold:true,align:'center'});
  text(c,bx+bw*.75,y+65,'4 + 8 = 12',8,{bold:true,align:'center'});
  return {h:70,caption:'Solve the equation weights first, then use every collected weight once so the two final pan totals match.'};
}
function miniCornerSum(c,x,y,w){
  const cell=28,sx=x+w/2-cell,vals=[[3,5],[4,8]];
  for(let r=0;r<2;r++)for(let col=0;col<2;col++){rect(c,sx+col*cell,y+r*cell,cell,cell,WHITE,[145,171,174],.65);text(c,sx+col*cell+cell/2,y+r*cell+18,String(vals[r][col]),9,{bold:true,align:'center'});}
  circle(c,sx+cell,y+cell,11,PALE,TEAL,1.2);text(c,sx+cell,y+cell+3,'20',7,{bold:true,color:TEAL,align:'center'});
  return {h:58,caption:'The circle totals the four surrounding cells: 3 + 5 + 4 + 8 = 20.'};
}
function miniLinkedSum(c,x,y,w){
  const bw=Math.min(280,w-50),bx=x+w/2-bw/2;
  rect(c,bx,y,bw,48,PALE,[184,207,205],.75);
  text(c,bx+14,y+18,'Group A: 4 + 6 + ? = 15',9,{bold:true});
  text(c,bx+14,y+37,'15 - 4 - 6 = 5',9,{bold:true,color:TEAL});
  return {h:48,caption:'Use the A/B/C totals together with the overlapping four-cell circle totals; the same cell must satisfy both.'};
}
function miniColourLogic(c,x,y,w){
  const labels=['Green','Red','Blue','Yellow'],fills=[[226,243,234],[247,230,230],[231,238,250],[250,242,207]],bw=58,gap=5,total=labels.length*bw+(labels.length-1)*gap,sx=x+w/2-total/2;
  labels.forEach((lab,i)=>{rect(c,sx+i*(bw+gap),y,bw,30,fills[i],[166,190,192],.7);text(c,sx+i*(bw+gap)+bw/2,y+19,lab,7,{bold:true,align:'center'});});
  return {h:30,caption:'Green is at an end; Red is immediately left of Blue; Yellow is right of Blue; Red is not at an end. This order satisfies every clue.'};
}
function miniMobileBalance(c,x,y,w){
  const cx=x+w/2,barY=y+20,half=92;
  line(c,cx,y,cx,barY,INK,1.2);line(c,cx-half,barY,cx+half,barY,INK,1.6);
  line(c,cx-half+28,barY,cx-half+28,barY+24,MUT,.9);line(c,cx+half-28,barY,cx+half-28,barY+24,MUT,.9);
  text(c,cx-half+28,barY+39,'6 + 6',9,{bold:true,align:'center'});text(c,cx+half-28,barY+39,'12',9,{bold:true,align:'center'});
  return {h:62,caption:'Two circles worth 6 each balance one triangle worth 12. A solved lower branch can then be treated as one combined weight higher up.'};
}
function miniDiagonalPath(c,x,y,w){
  const cell=30,sx=x+w/2-cell*1.5;
  for(let r=0;r<3;r++)for(let col=0;col<3;col++){const mid=r===1&&col===1;rect(c,sx+col*cell,y+r*cell,cell,cell,mid?HIT:WHITE,[154,181,184],.6);}
  [[0,0,'7'],[1,1,'8'],[2,2,'9']].forEach(([r,col,v])=>text(c,sx+col*cell+cell/2,y+r*cell+20,v,9,{bold:true,color:v==='8'?TEAL:INK,align:'center'}));
  return {h:90,caption:'With 7 and 9 in opposite corners of this 3 x 3 example, the centre is the only cell touching both, so it must be 8.'};
}
function miniSquareSearch(c,x,y,w){
  const cell=31,sx=x+w/2-cell,vals=[[3,5],[8,4]];
  for(let r=0;r<2;r++)for(let col=0;col<2;col++){rect(c,sx+col*cell,y+r*cell,cell,cell,HIT,[72,142,135],1.1);text(c,sx+col*cell+cell/2,y+r*cell+20,String(vals[r][col]),9,{bold:true,align:'center'});}
  text(c,x+w/2,y+76,'Target 20',8,{bold:true,color:TEAL,align:'center'});
  return {h:80,caption:'3 + 5 + 8 + 4 = 20, so this complete 2 x 2 block is a target square. Generated answer squares do not share cells.'};
}
function miniInsertOps(c,x,y,w){
  const bw=Math.min(260,w-50),bx=x+w/2-bw/2;rect(c,bx,y,bw,40,PALE,[184,207,205],.75);
  text(c,bx+bw/2,y+25,'7 + 2 x 5 = 17',12,{bold:true,color:TEAL,align:'center'});
  return {h:40,caption:'Multiply first: 2 x 5 = 10, then 7 + 10 = 17.'};
}
function miniPerimeterRegions(c,x,y,w){
  const cell=34,sx=x+w/2-cell,sy=y+4;
  rect(c,sx,sy,cell*2,cell,HIT,TEAL,1.8);line(c,sx+cell,sy,sx+cell,sy+cell,[190,208,208],.55);
  text(c,x+w/2,sy+cell+18,'perimeter = 6',8,{bold:true,color:TEAL,align:'center'});
  return {h:58,caption:'Two side-touching cells form one domino region. The shared edge is inside the region, so only six unit edges lie around the outside.'};
}
function miniOperationCodebreaker(c,x,y,w){
  const bw=Math.min(290,w-40),bx=x+w/2-bw/2;
  rect(c,bx,y,bw,24,PALE,[184,207,205],.75);
  text(c,bx+12,y+16,'8 + 4 = 12',8.5,{bold:true});
  text(c,bx+bw-12,y+16,'operator key: + = 3',7.5,{bold:true,color:TEAL,align:'right'});
  rect(c,bx,y+31,bw,24,WHITE,[184,207,205],.75);
  text(c,bx+12,y+47,'cipher K   +#1',8.2,{bold:true});
  text(c,bx+bw-12,y+47,'move 3 forwards = N',7.5,{bold:true,color:TEAL,align:'right'});
  return {h:55,caption:'Solve the sign, convert it with the operator key, then use that numbered digit and the shown direction to shift the cipher letter.'};
}
function miniSymbolDecoder(c,x,y,w){
  const bw=Math.min(270,w-50),bx=x+w/2-bw/2;
  rect(c,bx,y,bw,42,PALE,[184,207,205],.75);
  text(c,bx+12,y+17,'2 x diamond = 36',8,{bold:true});
  text(c,bx+bw/2,y+17,'diamond = 18',8,{bold:true,color:TEAL,align:'center'});
  text(c,bx+bw-12,y+17,'18 = R',8,{bold:true,color:TEAL,align:'right'});
  text(c,bx+bw/2,y+34,'1=A, 2=B, ... 26=Z',7,{color:MUT,align:'center'});
  return {h:42,caption:'Solve the symbol value first, then convert that number to its alphabet letter before decoding the word.'};
}
function miniNumberConnections(c,x,y,w){
  const bw=Math.min(300,w-36),bx=x+w/2-bw/2;
  rect(c,bx,y,bw,61,PALE,[184,207,205],.75);
  text(c,bx+10,y+16,'RULE WHEEL',5.5,{bold:true,color:MUT});
  text(c,bx+86,y+16,'4 x 6 = 24',7.5,{bold:true,color:TEAL});
  text(c,bx+10,y+35,'FACTOR WEB',5.5,{bold:true,color:MUT});
  text(c,bx+86,y+35,'3 x 4 = 12',7.5,{bold:true,color:TEAL});
  text(c,bx+10,y+54,'DIAMOND',5.5,{bold:true,color:MUT});
  text(c,bx+86,y+54,'3 x 4 = 12   and   3 + 4 = 7',7.2,{bold:true,color:TEAL});
  return {h:61,caption:'First identify the diagram style: a Rule Wheel, Factor Pair Web or Sum & Product Diamond. Each style has its own number relationship.'};
}

function miniGeneric(c,x,y,w,ex){const bw=Math.min(300,w-50),bx=x+w/2-bw/2;rect(c,bx,y,bw,42,PALE,[190,215,211],.7);text(c,bx+bw/2,y+16,titleOf(ex),8,{bold:true,color:TEAL,align:'center'});text(c,bx+bw/2,y+31,'Follow the rules and worked steps below.',6.8,{color:MUT,align:'center'});return {h:42,caption:'This reference example uses separate practice data.'};}
function mini(c,kind,x,y,w,ex){if(kind==='sumplete')return miniSumplete(c,x,y,w);if(kind==='numbertowers')return miniTowers(c,x,y,w);if(kind==='takuzu')return miniTakuzu(c,x,y,w);if(kind==='killersudoku')return miniKiller(c,x,y,w);if(kind==='hashi')return miniHashi(c,x,y,w);if(kind==='mathsmines')return miniMines(c,x,y,w);if(kind==='alphametics')return miniAlpha(c,x,y,w);if(kind==='balance')return miniBalanceLab(c,x,y,w);if(kind==='cornersum')return miniCornerSum(c,x,y,w);if(kind==='linkedsum')return miniLinkedSum(c,x,y,w);if(kind==='colourlogic')return miniColourLogic(c,x,y,w);if(kind==='mobilebalance')return miniMobileBalance(c,x,y,w);if(kind==='diagonalpath')return miniDiagonalPath(c,x,y,w);if(kind==='squaresearch')return miniSquareSearch(c,x,y,w);if(kind==='insertops')return miniInsertOps(c,x,y,w);if(kind==='perimeterregions')return miniPerimeterRegions(c,x,y,w);if(kind==='operationgrid')return miniOperationCodebreaker(c,x,y,w);if(kind==='symbols')return miniSymbolDecoder(c,x,y,w);if(kind==='numberwheels')return miniNumberConnections(c,x,y,w);return miniGeneric(c,x,y,w,ex);}
function drawWorked(c,ex,x,y,w,h){
  rect(c,x,y,w,h,[251,253,252],[201,220,218],.8);text(c,x+12,y+21,titleOf(ex),13,{bold:true});let cy=y+42;
  if(ex?.goal)cy+=wrapped(c,x+12,cy,`Goal: ${ex.goal}`,w-24,8.0,{bold:true,color:INK,maxLines:2})+5;
  const k=kindOf(ex),visual=mini(c,k,x,cy,w,ex);cy+=visual.h+5;cy+=wrapped(c,x+12,cy,visual.caption,w-24,6.7,{color:MUT,maxLines:2})+5;
  if(Array.isArray(ex?.rules)&&ex.rules.length&&cy<y+h-120){text(c,x+12,cy,'Rules',8,{bold:true,color:[46,87,86]});cy+=10;for(const rule of ex.rules){cy+=wrapped(c,x+17,cy,`- ${rule}`,w-30,6.5,{color:INK,maxLines:2})+1.5;if(cy>y+h-104)break;}cy+=2;}
  if(Array.isArray(ex?.steps)&&ex.steps.length&&cy<y+h-66){text(c,x+12,cy,'Worked steps',8,{bold:true,color:[46,87,86]});cy+=10;for(let i=0;i<ex.steps.length;i++){cy+=wrapped(c,x+17,cy,`${i+1}. ${ex.steps[i]}`,w-30,6.5,{color:INK,maxLines:2})+1.5;if(cy>y+h-50)break;}cy+=2;}
  if(ex?.tip&&cy<y+h-28)cy+=wrapped(c,x+12,cy,`Tip: ${ex.tip}`,w-24,6.5,{bold:true,color:TEAL,maxLines:2})+2;
  if(ex?.commonMistake&&cy<y+h-8)wrapped(c,x+12,cy,`Watch out: ${ex.commonMistake}`,w-24,6.3,{bold:true,color:WATCH,maxLines:2});
}
function needsOverlay(ex){const k=kindOf(ex);return !!k&&(MODERN_KINDS.has(k)||(!BASE_KINDS.has(k)&&k!=='shikaku'));}
function overlayWorkedPages(doc,examples){const gap=14,bodyTop=112,bodyBottom=PH-42,w=PW-2*M;for(let start=0,pageIndex=0;start<examples.length;start+=2,pageIndex++){const chunk=examples.slice(start,start+2),h=(bodyBottom-bodyTop-gap*(chunk.length-1))/chunk.length,entry=doc.pages[pageIndex];if(!entry)continue;chunk.forEach((ex,i)=>{if(!needsOverlay(ex))return;const yy=bodyTop+i*(h+gap);rect(entry.cmds,M,yy,w,h,WHITE,WHITE,.1);drawWorked(entry.cmds,ex,M,yy,w,h);});}}
PDF.buildDocument=function(opts={}){const doc=previous(opts),pack=opts.pack||{},settings=opts.settings||{},kind=['student','answers','both'].includes(opts.kind)?opts.kind:'student';if((kind==='student'||kind==='both')&&settings.workedExamples==='front'&&pack.workedExamples?.length)overlayWorkedPages(doc,pack.workedExamples);return doc;};
PDF.__workedV146=true;
})(typeof window!=='undefined'?window:globalThis);
