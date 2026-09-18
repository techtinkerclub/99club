/* 99 Club Studio · Colour Logic + Mobile Balance PDF correction overlay v1.97
 * Redraws only these two v1.96 puzzle families on top of the base PDF output.
 */
(function(global){
'use strict';
const PDF=global.TT99GamesPDF,P=global.TT99SimplePDF;if(!PDF||!P)return;
const original=PDF.buildDocument,PW=P.PAGE_W,PH=P.PAGE_H,M=34;
const INK=[36,67,74],MUT=[96,116,121],TEAL=[15,138,131],LINE=[207,220,222],WHITE=[255,255,255],DARK=[61,86,91];
function n(v){return Number(v).toFixed(2).replace(/\.00$/,'');}
function rgb(c){return c.map(v=>Math.max(0,Math.min(255,v))/255).map(n).join(' ');}
function esc(s){return P.asciiish(String(s??'')).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ');}
function rect(c,x,y,w,h,fill=WHITE,stroke=LINE,width=.8){const py=PH-y-h;c.push(`${rgb(fill)} rg ${rgb(stroke)} RG ${n(width)} w ${n(x)} ${n(py)} ${n(w)} ${n(h)} re B`);}
function line(c,x1,y1,x2,y2,col=LINE,width=.8){c.push(`${rgb(col)} RG ${n(width)} w ${n(x1)} ${n(PH-y1)} m ${n(x2)} ${n(PH-y2)} l S`);}
function text(c,x,y,t,size=8,opt={}){const font=opt.bold?'F2':'F1',col=opt.color||INK,s=esc(t),w=P.estimateTextWidth(s,size,!!opt.bold);let tx=x;if(opt.align==='center')tx-=w/2;if(opt.align==='right')tx-=w;c.push(`BT /${font} ${n(size)} Tf ${rgb(col)} rg 1 0 0 1 ${n(tx)} ${n(PH-y)} Tm (${s}) Tj ET`);}
function fit(c,x,y,t,max,size,opt={}){let s=size;while(s>5.6&&P.estimateTextWidth(esc(t),s,!!opt.bold)>max)s-=.25;text(c,x,y,t,s,opt);return s;}
function wrap(t,max,size,bold=false){const words=esc(t).split(/\s+/).filter(Boolean),out=[];let row='';for(const word of words){const next=row?`${row} ${word}`:word;if(P.estimateTextWidth(next,size,bold)<=max||!row)row=next;else{out.push(row);row=word;}}if(row)out.push(row);return out;}
function wrapped(c,x,y,t,max,size,opt={}){const rows=wrap(t,max,size,!!opt.bold).slice(0,opt.maxLines||99),lh=opt.lineHeight||size*1.28;rows.forEach((r,i)=>text(c,x,y+i*lh,r,size,opt));return rows.length*lh;}
function circle(c,cx,cy,r,opt={}){const k=.5522848,Y=PH-cy,fill=opt.fill||WHITE,stroke=opt.stroke||[92,119,124],width=opt.width||.8;c.push(`${rgb(fill)} rg ${rgb(stroke)} RG ${n(width)} w ${n(cx+r)} ${n(Y)} m ${n(cx+r)} ${n(Y+k*r)} ${n(cx+k*r)} ${n(Y+r)} ${n(cx)} ${n(Y+r)} c ${n(cx-k*r)} ${n(Y+r)} ${n(cx-r)} ${n(Y+k*r)} ${n(cx-r)} ${n(Y)} c ${n(cx-r)} ${n(Y-k*r)} ${n(cx-k*r)} ${n(Y-r)} ${n(cx)} ${n(Y-r)} c ${n(cx+k*r)} ${n(Y-r)} ${n(cx+r)} ${n(Y-k*r)} ${n(cx+r)} ${n(Y)} c h B`);}
function roundRect(c,x,y,w,h,r,opt={}){r=Math.max(0,Math.min(r,w/2,h/2));const k=r*.5522848,y0=PH-y-h,y1=y0+h,x0=x,x1=x+w,fill=opt.fill||WHITE,stroke=opt.stroke||LINE,width=opt.width||.8;c.push(`${rgb(fill)} rg ${rgb(stroke)} RG ${n(width)} w ${n(x0+r)} ${n(y0)} m ${n(x1-r)} ${n(y0)} l ${n(x1-r+k)} ${n(y0)} ${n(x1)} ${n(y0+r-k)} ${n(x1)} ${n(y0+r)} c ${n(x1)} ${n(y1-r)} l ${n(x1)} ${n(y1-r+k)} ${n(x1-r+k)} ${n(y1)} ${n(x1-r)} ${n(y1)} c ${n(x0+r)} ${n(y1)} l ${n(x0+r-k)} ${n(y1)} ${n(x0)} ${n(y1-r+k)} ${n(x0)} ${n(y1-r)} c ${n(x0)} ${n(y0+r)} l ${n(x0)} ${n(y0+r-k)} ${n(x0+r-k)} ${n(y0)} ${n(x0+r)} ${n(y0)} c h B`);}
function diagramText(c,cx,y,t,size,opt={}){const s=esc(t),w=P.estimateTextWidth(s,size,!!opt.bold);text(c,cx-w/2,y,s,size,opt);}
function frame(c,x,y,w,h,index,a){rect(c,x,y,w,h,WHITE,LINE,.8);text(c,x+12,y+18,`ACTIVITY ${index}`,8.4,{bold:true,color:MUT});text(c,x+12,y+37,a.title||'Activity',14,{bold:true,color:INK});text(c,x+w-12,y+19,String(a.difficulty||''),8.4,{color:MUT,align:'right'});return y+50;}

function drawColour(c,a,answers,x,y,w,h,index){
  const top=frame(c,x,y,w,h,index,a);
  wrapped(c,x+12,top,a.instruction||'Fill the boxes so every rule is true.',w-24,8.2,{color:MUT,maxLines:1});
  const bodyY=top+28,key=(a.colors||[]).map(v=>`${v.id}=${v.name}`).join('   ');
  fit(c,x+w/2,y+h-18,key,w-42,6.9,{bold:true,color:MUT,align:'center'});
  if(a.variant==='row'){
    const count=a.solution.length,gap=7,cell=Math.min(56,(w-96)/count),rowW=count*cell,gx=x+w/2-rowW/2,gy=bodyY+8;
    for(let i=0;i<count;i++){
      roundRect(c,gx+i*cell,gy,cell-gap,cell-gap,7,{fill:WHITE,stroke:[126,157,158],width:.9});
      text(c,gx+i*cell+(cell-gap)/2,gy+13,String(i+1),6,{bold:true,color:MUT,align:'center'});
      if(answers)diagramText(c,gx+i*cell+(cell-gap)/2,gy+(cell-gap)*.67,a.solution[i],10.5,{bold:true,color:TEAL});
    }
    let cy=gy+cell+12;
    for(let i=0;i<a.clues.length;i++)cy+=wrapped(c,x+28,cy,`${i+1}. ${a.clues[i].text}`,w-56,7.5,{color:DARK,maxLines:2,lineHeight:9.3})+4;
  }else{
    const size=a.size,maxGridW=w*.50,maxGridH=Math.max(118,h-(bodyY-y)-48),cell=Math.min(58,maxGridW/size,maxGridH/size),gw=size*cell,gx=x+22,gy=bodyY+7;
    for(let r=0;r<size;r++)for(let col=0;col<size;col++){
      rect(c,gx+col*cell,gy+r*cell,cell,cell,WHITE,[126,157,158],.9);
      if(answers)diagramText(c,gx+col*cell+cell/2,gy+r*cell+cell*.64,a.solutionGrid[r][col],10.2,{bold:true,color:TEAL});
    }
    const rx=gx+gw+24,rw=x+w-22-rx;let cy=gy+2;
    for(let i=0;i<a.clues.length;i++)cy+=wrapped(c,rx,cy,`${i+1}. ${a.clues[i].text}`,rw,7.4,{color:DARK,maxLines:2,lineHeight:9.1})+5;
  }
}

function shape(c,id,cx,cy,s){const stroke=[88,111,116];if(id==='circle'){circle(c,cx,cy,s*.46,{fill:[92,135,174],stroke,width:.6});return;}if(id==='square'){rect(c,cx-s*.43,cy-s*.43,s*.86,s*.86,[219,139,54],stroke,.6);return;}function poly(points,fill){let p=`${rgb(fill)} rg ${rgb(stroke)} RG .6 w ${n(points[0][0])} ${n(PH-points[0][1])} m `;for(let i=1;i<points.length;i++)p+=`${n(points[i][0])} ${n(PH-points[i][1])} l `;p+='h B';c.push(p);}if(id==='triangle'){poly([[cx,cy-s*.5],[cx+s*.5,cy+s*.43],[cx-s*.5,cy+s*.43]],[77,153,112]);return;}if(id==='diamond'){poly([[cx,cy-s*.52],[cx+s*.48,cy],[cx,cy+s*.52],[cx-s*.48,cy]],[205,91,81]);return;}const pts=[];for(let i=0;i<10;i++){const rr=i%2===0?s*.52:s*.23,a=-Math.PI/2+i*Math.PI/5;pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);}poly(pts,[137,93,181]);}
function leaves(node){return node.type==='group'?1:leaves(node.left)+leaves(node.right);}
function depth(node){return node.type==='group'?1:1+Math.max(depth(node.left),depth(node.right));}
function format(v){const q=Number(v);return Number.isFinite(q)?String(Math.round(q*1000)/1000):String(v??'');}

function drawMobile(c,a,answers,x,y,w,h,index){
  const top=frame(c,x,y,w,h,index,a);
  wrapped(c,x+12,top,a.instruction||'Every horizontal bar is balanced. Work out the value of each shape.',w-24,8.2,{color:MUT,maxLines:1});
  const hasTotal=a.topTotal!=null,noteH=hasTotal?14:0;
  if(hasTotal)wrapped(c,x+12,top+14,'The number in the top circle is the total weight of the whole mobile.',w-24,7.0,{color:MUT,maxLines:1});
  const bodyY=top+26+noteH,diagramW=w*.70,dx=x+8,dy=bodyY+3,d=depth(a.tree),available=Math.max(150,y+h-dy-18),levelGap=Math.min(60,Math.max(42,(available-72)/Math.max(1,d-1))),shapeGap=Math.min(21,Math.max(16,levelGap*.38)),shapeSize=Math.min(16,Math.max(13,levelGap*.31));
  function rec(node,x0,x1,yy){
    const cx=(x0+x1)/2;
    if(node.type==='group'){
      const first=yy+17,last=first+Math.max(0,node.count-1)*shapeGap,bottom=last+shapeSize*.62;
      line(c,cx,yy,cx,bottom,[105,132,135],1.15);
      for(let i=0;i<node.count;i++)shape(c,node.shape,cx,first+i*shapeGap,shapeSize);
      return;
    }
    const ll=leaves(node.left),rr=leaves(node.right),split=x0+(x1-x0)*ll/(ll+rr),lc=(x0+split)/2,rc=(split+x1)/2,childY=yy+levelGap;
    line(c,lc,yy,rc,yy,[84,111,116],2.8);
    circle(c,cx,yy,2.7,{fill:WHITE,stroke:[84,111,116],width:.85});
    line(c,lc,yy,lc,childY,[105,132,135],1.15);rec(node.left,x0,split,childY);
    line(c,rc,yy,rc,childY,[105,132,135],1.15);rec(node.right,split,x1,childY);
  }
  const x0=dx+13,x1=dx+diagramW-13,cx=(x0+x1)/2,rootY=dy+(hasTotal?40:24);
  if(hasTotal){circle(c,cx,dy+14,13,{fill:WHITE,stroke:[84,111,116],width:1});diagramText(c,cx,dy+18,String(a.topTotal),8.6,{bold:true,color:INK});line(c,cx,dy+27,cx,rootY,[105,132,135],1.15);}else line(c,cx,dy+5,cx,rootY,[105,132,135],1.15);
  rec(a.tree,x0,x1,rootY);
  const sx=x+diagramW+18,sw=w-diagramW-29; text(c,sx,bodyY+10,'SHAPE VALUES',6.8,{bold:true,color:MUT});let sy=bodyY+24;
  for(const id of a.shapeIds){const meta=a.shapeMeta[id]||{label:id},given=a.givens?.[id]!=null;shape(c,id,sx+11,sy+8,11.5);fit(c,sx+28,sy+11,meta.label,Math.max(28,sw-60),7.1,{bold:true,color:DARK});const shown=given||answers?format(a.values[id]):'________';text(c,sx+sw,sy+11,shown,7.3,{bold:answers&&!given,color:answers&&!given?TEAL:INK,align:'right'});sy+=30;}
}

function overlaySheet(doc,pageIndex,sheet,answers){const entry=doc.pages[pageIndex];if(!entry)return;const acts=sheet.activities||[],count=Math.max(1,acts.length),bodyTop=110,bodyBottom=PH-42,gap=12,ah=(bodyBottom-bodyTop-gap*(count-1))/count,w=PW-2*M;acts.forEach((a,i)=>{const y=bodyTop+i*(ah+gap);if(a.engineId==='colourlogic')drawColour(entry.cmds,a,answers,M,y,w,ah,i+1);else if(a.engineId==='mobilebalance')drawMobile(entry.cmds,a,answers,M,y,w,ah,i+1);});}
PDF.buildDocument=function(opts={}){const doc=original(opts),pack=opts.pack||{},settings=opts.settings||{},kind=['student','answers','both'].includes(opts.kind)?opts.kind:'student';let page=0;if((kind==='student'||kind==='both')&&settings.workedExamples==='front'&&pack.workedExamples?.length)page+=Math.ceil(pack.workedExamples.length/2);if(kind==='student'||kind==='both'){for(const sheet of pack.sheets||[])overlaySheet(doc,page++,sheet,false);}if(kind==='answers'||kind==='both'){for(const sheet of pack.sheets||[])overlaySheet(doc,page++,sheet,true);}return doc;};
})(typeof window!=='undefined'?window:globalThis);
