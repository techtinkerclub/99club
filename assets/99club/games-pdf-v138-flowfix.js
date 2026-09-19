/* v1.38 follow-up PDF refinement: clean flowchart Function Machines + clean Number Towers edges. */
(function(global){
'use strict';
const PDF=global.TT99GamesPDF,P=global.TT99SimplePDF;if(!PDF||!P)return;
const previous=PDF.buildDocument,PW=P.PAGE_W,PH=P.PAGE_H,M=34;
const INK=[36,67,74],MUT=[99,119,123],TEAL=[101,151,145],TEALD=[76,128,122],LINE=[210,222,223],WHITE=[255,255,255],SOFT=[248,250,250],CREAM=[255,253,241],BLUE=[241,244,255],BLUEB=[126,145,202],TAG=[242,245,245],TAGB=[104,128,132],HIT=[229,245,241];
function n(v){return Number(v).toFixed(2).replace(/\.00$/,'');}
function rgb(c){return c.map(v=>Math.max(0,Math.min(255,v))/255).map(n).join(' ');}
function esc(s){return P.asciiish(String(s??'')).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ');}
function rect(c,x,y,w,h,fill=WHITE,stroke=LINE,width=.7){c.push(`${rgb(fill)} rg ${rgb(stroke)} RG ${n(width)} w ${n(x)} ${n(PH-y-h)} ${n(w)} ${n(h)} re B`);}
function text(c,x,y,t,size=8,opt={}){const s=esc(t),font=opt.bold?'F2':'F1',col=opt.color||INK,w=P.estimateTextWidth(s,size,!!opt.bold);let tx=x;if(opt.align==='center')tx-=w/2;if(opt.align==='right')tx-=w;c.push(`BT /${font} ${n(size)} Tf ${rgb(col)} rg 1 0 0 1 ${n(tx)} ${n(PH-y)} Tm (${s}) Tj ET`);}
function line(c,x1,y1,x2,y2,col=LINE,width=.7){c.push(`${rgb(col)} RG ${n(width)} w ${n(x1)} ${n(PH-y1)} m ${n(x2)} ${n(PH-y2)} l S`);}
function polygon(c,pts,fill=WHITE,stroke=LINE,width=.7){let s=`${rgb(fill)} rg ${rgb(stroke)} RG ${n(width)} w ${n(pts[0][0])} ${n(PH-pts[0][1])} m `;for(let i=1;i<pts.length;i++)s+=`${n(pts[i][0])} ${n(PH-pts[i][1])} l `;s+='h B';c.push(s);}
function roundRect(c,x,y,w,h,r,fill=WHITE,stroke=LINE,width=.7){r=Math.max(0,Math.min(r,w/2,h/2));const k=.5522847498,yt=PH-y,yb=PH-y-h,xr=x+w;let s=`${rgb(fill)} rg ${rgb(stroke)} RG ${n(width)} w `;s+=`${n(x+r)} ${n(yt)} m ${n(xr-r)} ${n(yt)} l `;s+=`${n(xr-r+k*r)} ${n(yt)} ${n(xr)} ${n(yt-r+k*r)} ${n(xr)} ${n(yt-r)} c `;s+=`${n(xr)} ${n(yb+r)} l ${n(xr)} ${n(yb+r-k*r)} ${n(xr-r+k*r)} ${n(yb)} ${n(xr-r)} ${n(yb)} c `;s+=`${n(x+r)} ${n(yb)} l ${n(x+r-k*r)} ${n(yb)} ${n(x)} ${n(yb+r-k*r)} ${n(x)} ${n(yb+r)} c `;s+=`${n(x)} ${n(yt-r)} l ${n(x)} ${n(yt-r+k*r)} ${n(x+r-k*r)} ${n(yt)} ${n(x+r)} ${n(yt)} c h B`;c.push(s);}
function arrow(c,x1,y,x2,col=TEALD,width=1.25){const head=7,half=4;line(c,x1,y,x2-head,y,col,width);polygon(c,[[x2-head,y-half],[x2,y],[x2-head,y+half]],col,col,.1);}
function wrap(value,maxWidth,size,bold=false){const words=esc(value).split(/\s+/).filter(Boolean),rows=[];let row='';for(const word of words){const next=row?`${row} ${word}`:word;if(!row||P.estimateTextWidth(next,size,bold)<=maxWidth)row=next;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}function frame(c,x,y,w,h,index,a,instruction){rect(c,x,y,w,h,WHITE,LINE,.8);text(c,x+12,y+18,`ACTIVITY ${index}`,8.4,{bold:true,color:MUT});text(c,x+12,y+37,a.title||'Activity',14,{bold:true});text(c,x+w-12,y+19,String(a.difficulty||''),8.2,{color:MUT,align:'right'});const rows=wrap(instruction,w-24,6.8).slice(0,2);rows.forEach((row,i)=>text(c,x+12,y+53+i*9,row,6.8,{color:MUT}));return y+68+Math.max(0,rows.length-1)*9;}

function drawMachine(c,a,answers,x,y,w,h,index){
  const top=frame(c,x,y,w,h,index,a,'Apply the machine stages in order from Input to Output. If an input is missing, undo the stages in reverse order using inverse operations.');
  const ops=a.operations||[],cy=top+28,portW=72,portH=34,stageW=Math.min(72,(w-2*portW-95)/Math.max(1,ops.length)),stageH=34,link=24,total=2*portW+ops.length*stageW+(ops.length+1)*link,start=x+w/2-total/2;
  let xx=start;
  roundRect(c,xx,cy,portW,portH,17,CREAM,[91,143,137],1);text(c,xx+portW/2,cy+22.5,'Input',9.3,{bold:true,align:'center'});xx+=portW;
  for(let i=0;i<ops.length;i++){
    arrow(c,xx+2,cy+portH/2,xx+link-2,TEALD,1);xx+=link;
    roundRect(c,xx,cy,stageW,stageH,7,BLUE,BLUEB,1);text(c,xx+stageW/2,cy+22.5,`${ops[i].op} ${ops[i].value}`,10.2,{bold:true,align:'center'});xx+=stageW;
  }
  arrow(c,xx+2,cy+portH/2,xx+link-2,TEALD,1);xx+=link;
  roundRect(c,xx,cy,portW,portH,17,CREAM,[91,143,137],1);text(c,xx+portW/2,cy+22.5,'Output',9.3,{bold:true,align:'center'});

  const ty=cy+56,tableW=Math.min(300,w*.62),tx=x+w/2-tableW/2,rowH=Math.min(31,(h-(ty-y)-12)/(a.rows.length+1));
  rect(c,tx,ty,tableW,rowH,SOFT,[180,197,199],.55);text(c,tx+tableW*.25,ty+19,'Input',7.6,{bold:true,align:'center'});text(c,tx+tableW*.75,ty+19,'Output',7.6,{bold:true,align:'center'});
  for(let i=0;i<a.rows.length;i++){const r=a.rows[i],yy=ty+rowH*(i+1),inFill=answers&&r.hide==='input',outFill=answers&&r.hide==='output';rect(c,tx,yy,tableW/2,rowH,inFill?HIT:WHITE,[207,217,218],.4);rect(c,tx+tableW/2,yy,tableW/2,rowH,outFill?HIT:WHITE,[207,217,218],.4);text(c,tx+tableW*.25,yy+19,answers||r.hide!=='input'?String(r.input):'____',8,{bold:inFill,color:inFill?TEALD:INK,align:'center'});text(c,tx+tableW*.75,yy+19,answers||r.hide!=='output'?String(r.output):'____',8,{bold:outFill,color:outFill?TEALD:INK,align:'center'});}line(c,tx+tableW/2,ty,tx+tableW/2,ty+rowH*(a.rows.length+1),[180,197,199],.55);
}

function tag(c,side,cx,cy,value){if(!value)return;const v=String(value);if(side==='top'){polygon(c,[[cx-10,cy-23],[cx+10,cy-23],[cx+10,cy-8],[cx,cy],[cx-10,cy-8]],TAG,TAGB,.75);text(c,cx,cy-10,v,7.2,{bold:true,align:'center'});}else if(side==='bottom'){polygon(c,[[cx,cy],[cx+10,cy+8],[cx+10,cy+23],[cx-10,cy+23],[cx-10,cy+8]],TAG,TAGB,.75);text(c,cx,cy+17,v,7.2,{bold:true,align:'center'});}else if(side==='left'){polygon(c,[[cx-23,cy-10],[cx-8,cy-10],[cx,cy],[cx-8,cy+10],[cx-23,cy+10]],TAG,TAGB,.75);text(c,cx-14,cy+3,v,7.2,{bold:true,align:'center'});}else{polygon(c,[[cx,cy],[cx+8,cy-10],[cx+23,cy-10],[cx+23,cy+10],[cx+8,cy+10]],TAG,TAGB,.75);text(c,cx+14,cy+3,v,7.2,{bold:true,align:'center'});}}
function drawTowers(c,a,answers,x,y,w,h,index){
  const size=a.size||0;if(!size)return;const top=frame(c,x,y,w,h,index,a,`Fill with 1-${size}, using each height once per row and column. Each edge clue is how many towers are visible from that side; taller towers hide shorter ones behind them.`),availH=h-(top-y)-18,outer=Math.min(w*.68,availH),pad=31,cell=(outer-2*pad)/size,gw=cell*size,gx=x+w/2-gw/2,gy=top+pad+Math.max(0,(availH-outer)/2),clues=a.clues||{},sol=a.solutionGrid||[];
  rect(c,x+5,top-3,w-10,h-(top-y)-4,WHITE,WHITE,.1);
  for(let r=0;r<size;r++)for(let col=0;col<size;col++){rect(c,gx+col*cell,gy+r*cell,cell,cell,WHITE,[118,143,147],.55);if(answers)text(c,gx+col*cell+cell/2,gy+r*cell+cell*.64,String(sol[r][col]),Math.min(12,cell*.34),{bold:true,color:TEALD,align:'center'});}
  line(c,gx,gy,gx+gw,gy,[71,103,108],1.25);line(c,gx,gy+gw,gx+gw,gy+gw,[71,103,108],1.25);line(c,gx,gy,gx,gy+gw,[71,103,108],1.25);line(c,gx+gw,gy,gx+gw,gy+gw,[71,103,108],1.25);
  for(let i=0;i<size;i++){const ccx=gx+i*cell+cell/2,rcy=gy+i*cell+cell/2;if(clues.top?.[i])tag(c,'top',ccx,gy-5,clues.top[i]);if(clues.bottom?.[i])tag(c,'bottom',ccx,gy+gw+5,clues.bottom[i]);if(clues.left?.[i])tag(c,'left',gx-5,rcy,clues.left[i]);if(clues.right?.[i])tag(c,'right',gx+gw+5,rcy,clues.right[i]);}
}
function overlaySheet(doc,pageIndex,sheet,answers){const entry=doc.pages[pageIndex];if(!entry)return;const acts=sheet.activities||[],count=Math.max(1,acts.length),bodyTop=110,bodyBottom=PH-42,gap=12,ah=(bodyBottom-bodyTop-gap*(count-1))/count,w=PW-2*M;acts.forEach((a,i)=>{if(!['functionmachine','numbertowers'].includes(a.engineId))return;const yy=bodyTop+i*(ah+gap);rect(entry.cmds,M,yy,w,ah,WHITE,WHITE,.1);if(a.engineId==='functionmachine')drawMachine(entry.cmds,a,answers,M,yy,w,ah,i+1);else drawTowers(entry.cmds,a,answers,M,yy,w,ah,i+1);});}
PDF.buildDocument=function(opts={}){const doc=previous(opts),pack=opts.pack||{},settings=opts.settings||{},kind=['student','answers','both'].includes(opts.kind)?opts.kind:'student';let page=0;if((kind==='student'||kind==='both')&&settings.workedExamples==='front'&&pack.workedExamples?.length)page+=Math.ceil(pack.workedExamples.length/2);if(kind==='student'||kind==='both')for(const sheet of pack.sheets||[])overlaySheet(doc,page++,sheet,false);if(kind==='answers'||kind==='both')for(const sheet of pack.sheets||[])overlaySheet(doc,page++,sheet,true);return doc;};
})(typeof window!=='undefined'?window:globalThis);
