/* 99 Club Studio · v1.38 Number Towers directional clue tabs for PDF */
(function(global){
'use strict';
const PDF=global.TT99GamesPDF,P=global.TT99SimplePDF;if(!PDF||!P)return;
const previous=PDF.buildDocument,PW=P.PAGE_W,PH=P.PAGE_H,M=34,INK=[38,63,68],BORDER=[100,123,127],FILL=[240,243,243],WHITE=[255,255,255];
function n(v){return Number(v).toFixed(2).replace(/\.00$/,'');}
function rgb(c){return c.map(v=>Math.max(0,Math.min(255,v))/255).map(n).join(' ');}
function esc(s){return P.asciiish(String(s??'')).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ');}
function rect(c,x,y,w,h,fill=WHITE){c.push(`${rgb(fill)} rg ${rgb(fill)} RG .1 w ${n(x)} ${n(PH-y-h)} ${n(w)} ${n(h)} re B`);}
function text(c,x,y,t,size=8,opt={}){const s=esc(t),font=opt.bold?'F2':'F1',col=opt.color||INK,w=P.estimateTextWidth(s,size,!!opt.bold);let tx=x;if(opt.align==='center')tx-=w/2;c.push(`BT /${font} ${n(size)} Tf ${rgb(col)} rg 1 0 0 1 ${n(tx)} ${n(PH-y)} Tm (${s}) Tj ET`);}
function polygon(c,pts,fill=FILL,stroke=BORDER,width=.75){let cmd=`${rgb(fill)} rg ${rgb(stroke)} RG ${n(width)} w ${n(pts[0][0])} ${n(PH-pts[0][1])} m `;for(let i=1;i<pts.length;i++)cmd+=`${n(pts[i][0])} ${n(PH-pts[i][1])} l `;cmd+='h B';c.push(cmd);}
function tag(c,side,cx,cy,value){
  if(!value)return;
  if(side==='top'){
    const x=cx-10,y=cy-12;polygon(c,[[x,y],[x+20,y],[x+20,y+17],[x+10,y+25],[x,y+17]]);text(c,cx,y+14,String(value),7.3,{bold:true,align:'center'});
  }else if(side==='bottom'){
    const x=cx-10,y=cy-12;polygon(c,[[x,y+8],[x+10,y],[x+20,y+8],[x+20,y+25],[x,y+25]]);text(c,cx,y+20,String(value),7.3,{bold:true,align:'center'});
  }else if(side==='left'){
    const x=cx-12,y=cy-10;polygon(c,[[x,y],[x+17,y],[x+25,y+10],[x+17,y+20],[x,y+20]]);text(c,x+9,y+13.3,String(value),7.3,{bold:true,align:'center'});
  }else{
    const x=cx-12,y=cy-10;polygon(c,[[x+8,y],[x+25,y],[x+25,y+20],[x+8,y+20],[x,y+10]]);text(c,x+16,y+13.3,String(value),7.3,{bold:true,align:'center'});
  }
}
function drawDirections(c,a,x,y,w,h){
  const size=Number(a.size)||0;if(!size)return;
  const top=y+68,availH=h-(top-y)-16,gridOuter=Math.min(w*.68,availH),clue=24,cell=(gridOuter-2*clue)/size,gw=cell*size,gx=x+w/2-gw/2,gy=top+clue+Math.max(0,(availH-gridOuter)/2),clues=a.clues||{};
  for(let i=0;i<size;i++){
    const ccx=gx+i*cell+cell/2,rcy=gy+i*cell+cell/2;
    if(clues.top?.[i]){rect(c,ccx-15,gy-24,30,23);tag(c,'top',ccx,gy-17,clues.top[i]);}
    if(clues.bottom?.[i]){rect(c,ccx-15,gy+size*cell+1,30,25);tag(c,'bottom',ccx,gy+size*cell+13,clues.bottom[i]);}
    if(clues.left?.[i]){rect(c,gx-28,rcy-13,28,26);tag(c,'left',gx-17,rcy,clues.left[i]);}
    if(clues.right?.[i]){rect(c,gx+size*cell,rcy-13,28,26);tag(c,'right',gx+size*cell+17,rcy,clues.right[i]);}
  }
}
function overlaySheet(doc,pageIndex,sheet){const entry=doc.pages[pageIndex];if(!entry)return;const acts=sheet.activities||[],count=Math.max(1,acts.length),bodyTop=110,bodyBottom=PH-42,gap=12,ah=(bodyBottom-bodyTop-gap*(count-1))/count,w=PW-2*M;acts.forEach((a,i)=>{if(a.engineId!=='numbertowers')return;drawDirections(entry.cmds,a,M,bodyTop+i*(ah+gap),w,ah);});}
PDF.buildDocument=function(opts={}){const doc=previous(opts),pack=opts.pack||{},settings=opts.settings||{},kind=['student','answers','both'].includes(opts.kind)?opts.kind:'student';let page=0;if((kind==='student'||kind==='both')&&settings.workedExamples==='front'&&pack.workedExamples?.length)page+=Math.ceil(pack.workedExamples.length/2);if(kind==='student'||kind==='both')for(const sheet of pack.sheets||[])overlaySheet(doc,page++,sheet);if(kind==='answers'||kind==='both')for(const sheet of pack.sheets||[])overlaySheet(doc,page++,sheet);return doc;};
})(typeof window!=='undefined'?window:globalThis);
