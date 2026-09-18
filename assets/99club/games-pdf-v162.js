/* 99 Club Studio · Operation Codebreaker readability finishing layer v1.62
 * Loaded after v1.60. Redraws equations and the cipher row only, leaving the
 * stable generator and aligned number-code / answer grid untouched.
 */
(function(global){
'use strict';
const PDF=global.TT99GamesPDF,P=global.TT99SimplePDF;if(!PDF||!P||PDF.__v162)return;
const baseBuild=PDF.buildDocument.bind(PDF),PW=P.PAGE_W,PH=P.PAGE_H,M=34;
const C={ink:[36,67,74],muted:[96,116,121],teal:[15,126,116],line:[199,218,218],white:[255,255,255],paper:[252,253,253]};
function n(v){return Number(v).toFixed(2).replace(/\.00$/,'');}
function rgb(c){return c.map(v=>Math.max(0,Math.min(255,v))/255).map(n).join(' ');}
function cmds(e){return Array.isArray(e)?e:e.cmds;}
function dims(e){return {w:Array.isArray(e)?PW:(e.width||PW),h:Array.isArray(e)?PH:(e.height||PH)};}
function esc(s){return P.asciiish(String(s??'')).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ');}
function text(e,x,y,v,size=7,o={}){const ph=dims(e).h,s=esc(v),tw=P.estimateTextWidth(s,size,!!o.bold);let tx=x;if(o.align==='center')tx-=tw/2;if(o.align==='right')tx-=tw;cmds(e).push(`BT /${o.bold?'F2':'F1'} ${n(size)} Tf ${rgb(o.color||C.ink)} rg 1 0 0 1 ${n(tx)} ${n(ph-y)} Tm (${s}) Tj ET`);return tw;}
function rect(e,x,y,w,h,o={}){const ph=dims(e).h,py=ph-y-h,a=[];if(o.fill)a.push(`${rgb(o.fill)} rg`);if(o.stroke)a.push(`${rgb(o.stroke)} RG`);a.push(`${n(o.width||.7)} w`,`${n(x)} ${n(py)} ${n(w)} ${n(h)} re`,o.fill&&o.stroke?'B':o.fill?'f':'S');cmds(e).push(a.join(' '));}
function center(e,x,y,v,size,o={}){return text(e,x,y,v,size,{...o,align:'center'});}
function opLabel(op){return op==='-'?'-':op;}
function drawEquation(e,row,answers,x,y,w,h,startIndex){
  rect(e,x,y,w,h,{fill:C.paper,stroke:C.line,width:.7});
  text(e,x+9,y+12,'EQUATION',4.8,{bold:true,color:C.muted});
  const parts=String(row.text||'').split('□'),slots=Math.max(0,parts.length-1),compact=h<42;
  let fs=compact?7.2:8.5,slotW=compact?19:22,slotH=compact?21:24,gap=compact?4:5.5;
  let widths=[];const max=w-24;
  function measure(){widths=parts.map(p=>P.estimateTextWidth(P.asciiish(p),fs,true));return widths.reduce((s,v)=>s+v,0)+slots*(slotW+gap*2);}
  let total=measure();while(total>max&&fs>6.2){fs-=.25;gap=Math.max(3,gap-.15);total=measure();}
  const start=x+(w-total)/2,base=y+h*.66,boxY=y+h/2-slotH/2;let xx=start,idx=startIndex;
  parts.forEach((part,j)=>{
    text(e,xx,base,part,fs,{bold:true});xx+=widths[j];
    if(j<slots){xx+=gap;rect(e,xx,boxY,slotW,slotH,{fill:answers?[226,244,239]:C.white,stroke:[77,139,132],width:1});text(e,xx+2,boxY+5,`#${idx}`,3.8,{bold:true,color:C.muted});if(answers)center(e,xx+slotW/2,boxY+slotH*.69,opLabel(row.ops?.[j]||''),8.7,{bold:true,color:C.teal});xx+=slotW+gap;idx++;}
  });
  return idx;
}
function redrawCipherRow(e,a,answers,x,y,w,h){
  const p=a?.printCipher;if(!p||p.version!==158)return;
  const code=Array.isArray(p.code)?p.code:[],cipher=String(p.cipher||''),word=String(p.word||''),moves=Array.isArray(p.moves)?p.moves:[],count=Math.min(code.length,cipher.length);if(!count)return;
  const footerH=h<390?82:96,fy=y+h-footerH+2,boxH=footerH-10,gap=count>=10?2:3,gridAvail=w-132,cellW=Math.max(16,Math.min(count>=10?20:24,(gridAvail-gap*(count-1))/count)),gridW=count*cellW+(count-1)*gap,gridStart=x+102+Math.max(0,(gridAvail-gridW)/2),pad=Math.max(2,(boxH-68)/2),codeY=fy+pad,cipherY=codeY+21,answerY=cipherY+21;
  // Cover only the cipher row from v1.60, keeping number-code and answer rows.
  rect(e,gridStart,cipherY,gridW,18,{fill:C.white,stroke:C.white,width:.1});
  text(e,x+20,cipherY+12,'SECRET WORD',5.1,{bold:true,color:C.muted});
  for(let i=0;i<count;i++){
    const cx=gridStart+i*(cellW+gap);rect(e,cx,cipherY,cellW,18,{fill:C.white,stroke:C.line,width:.65});
    center(e,cx+cellW/2,cipherY+7.7,cipher[i],7.5,{bold:true,color:C.ink});
    center(e,cx+cellW/2,cipherY+15.8,Number(moves[i]?.direction)>0?'+':'-',5.8,{bold:true,color:C.teal});
  }
  // Repaint answer row top edge in case adjacent strokes were covered.
  for(let i=0;i<count;i++){const cx=gridStart+i*(cellW+gap);rect(e,cx,answerY,cellW,17,{fill:answers?[226,244,239]:C.white,stroke:[112,151,148],width:.8});if(answers)center(e,cx+cellW/2,answerY+12,word[i]||'',6.8,{bold:true,color:C.teal});}
}
function overlaySheet(entry,sheet,answers){
  const acts=sheet?.activities||[],count=Math.max(1,acts.length),top=110,bottom=PH-42,gap=12,ah=(bottom-top-gap*(count-1))/count,w=PW-2*M;
  acts.forEach((a,i)=>{
    if(a?.engineId!=='operationgrid'||a.printCipher?.version!==158)return;
    const x=M,y=top+i*(ah+gap),h=ah,p=a.printCipher,keyY=y+78,footerH=h<390?82:96,eqTop=keyY+34,eqBottom=y+h-footerH-8,rows=a.rows||[],cols=2,rn=Math.ceil(rows.length/cols),gx=8,gy=6,cw=(w-32-gx)/2,ch=Math.max(34,Math.min(57,(eqBottom-eqTop-gy*(rn-1))/Math.max(1,rn)));let pos=1;
    rows.forEach((r,j)=>{const rr=Math.floor(j/cols),cc=j%cols,cx=x+12+cc*(cw+gx),cy=eqTop+rr*(ch+gy);pos=drawEquation(entry,r,answers,cx,cy,cw,ch,pos);});
    redrawCipherRow(entry,a,answers,x,y,w,h);
  });
}
PDF.buildDocument=function(opts={}){const doc=baseBuild(opts);if(!doc?.pages)return doc;const pack=opts.pack||{},kind=['student','answers','both'].includes(opts.kind)?opts.kind:'student',worked=(kind==='student'||kind==='both')&&opts.settings?.workedExamples==='front'?Math.ceil((pack.workedExamples?.length||0)/2):0,sheets=pack.sheets||[];let at=worked;if(kind==='student'||kind==='both')for(const sh of sheets)overlaySheet(doc.pages[at++],sh,false);if(kind==='answers'||kind==='both'){if(kind==='answers')at=0;for(const sh of sheets)overlaySheet(doc.pages[at++],sh,true);}return doc;};
PDF.__v162=true;PDF.versionV162='1.62';
})(typeof globalThis!=='undefined'?globalThis:this);
