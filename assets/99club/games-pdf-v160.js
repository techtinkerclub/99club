/* 99 Club Studio · Operation Codebreaker aligned decode grid v1.60
 * Finishing layer loaded after v1.58. Redraws only the Codebreaker footer so
 * number code, cipher letter and pupil answer share the same vertical columns,
 * with a compact alphabet helper beneath.
 */
(function(global){
'use strict';
const PDF=global.TT99GamesPDF,P=global.TT99SimplePDF;if(!PDF||!P||PDF.__v160)return;
const baseBuild=PDF.buildDocument.bind(PDF),PW=P.PAGE_W,PH=P.PAGE_H,M=34;
const C={ink:[36,67,74],muted:[96,116,121],teal:[15,126,116],line:[199,218,218],pale:[244,250,248],hit:[226,244,239],white:[255,255,255]};
function n(v){return Number(v).toFixed(2).replace(/\.00$/,'');}
function rgb(c){return c.map(v=>Math.max(0,Math.min(255,v))/255).map(n).join(' ');}
function cmds(e){return Array.isArray(e)?e:e.cmds;}
function dims(e){return {w:Array.isArray(e)?PW:(e.width||PW),h:Array.isArray(e)?PH:(e.height||PH)};}
function esc(s){return P.asciiish(String(s??'')).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ');}
function text(e,x,y,v,size=7,o={}){const ph=dims(e).h,s=esc(v),tw=P.estimateTextWidth(s,size,!!o.bold);let tx=x;if(o.align==='center')tx-=tw/2;if(o.align==='right')tx-=tw;cmds(e).push(`BT /${o.bold?'F2':'F1'} ${n(size)} Tf ${rgb(o.color||C.ink)} rg 1 0 0 1 ${n(tx)} ${n(ph-y)} Tm (${s}) Tj ET`);return tw;}
function rect(e,x,y,w,h,o={}){const ph=dims(e).h,py=ph-y-h,a=[];if(o.fill)a.push(`${rgb(o.fill)} rg`);if(o.stroke)a.push(`${rgb(o.stroke)} RG`);a.push(`${n(o.width||.7)} w`,`${n(x)} ${n(py)} ${n(w)} ${n(h)} re`,o.fill&&o.stroke?'B':o.fill?'f':'S');cmds(e).push(a.join(' '));}
function fit(e,x,y,v,max,size,o={}){let fs=size;while(fs>3.6&&P.estimateTextWidth(P.asciiish(String(v)),fs,!!o.bold)>max)fs-=.15;text(e,x,y,v,fs,o);return fs;}
function center(e,x,y,v,size,o={}){return text(e,x,y,v,size,{...o,align:'center'});}
function redrawFooter(e,a,answers,x,y,w,h){
 const p=a?.printCipher;if(!p||p.version!==158)return;
 const code=Array.isArray(p.code)?p.code:[],cipher=String(p.cipher||''),word=String(p.word||''),moves=Array.isArray(p.moves)?p.moves:[];
 const count=Math.min(code.length,cipher.length);if(!count)return;
 const footerH=h<390?82:96,fy=y+h-footerH+2,boxH=footerH-10;
 rect(e,x+12,fy,w-24,boxH,{fill:[250,253,252],stroke:C.line,width:.7});
 const gap=count>=10?2:3,gridAvail=w-132,cellW=Math.max(16,Math.min(count>=10?20:24,(gridAvail-gap*(count-1))/count)),gridW=count*cellW+(count-1)*gap,gridStart=x+102+Math.max(0,(gridAvail-gridW)/2),pad=Math.max(2,(boxH-68)/2);
 const codeY=fy+pad,cipherY=codeY+21,answerY=cipherY+21,alphaY=fy+boxH-4;
 const labelX=x+20;
 text(e,labelX,codeY+12,'NUMBER CODE',5.1,{bold:true,color:C.muted});
 text(e,labelX,cipherY+12,'SECRET WORD',5.1,{bold:true,color:C.muted});
 text(e,labelX,answerY+12,'YOUR ANSWER',5.1,{bold:true,color:C.muted});
 for(let i=0;i<count;i++){
   const cx=gridStart+i*(cellW+gap);
   rect(e,cx,codeY,cellW,18,{fill:answers?C.hit:C.white,stroke:C.line,width:.65});
   text(e,cx+2,codeY+6,`#${i+1}`,3.4,{bold:true,color:C.muted});
   if(answers)center(e,cx+cellW/2,codeY+14,String(code[i]),6.6,{bold:true,color:C.teal});
   rect(e,cx,cipherY,cellW,18,{fill:C.white,stroke:C.line,width:.65});
   center(e,cx+cellW/2,cipherY+9,cipher[i],6.8,{bold:true,color:C.ink});
   center(e,cx+cellW/2,cipherY+16,Number(moves[i]?.direction)>0?'+':'-',4.1,{bold:true,color:C.teal});
   rect(e,cx,answerY,cellW,17,{fill:answers?C.hit:C.white,stroke:[112,151,148],width:.8});
   if(answers)center(e,cx+cellW/2,answerY+12,word[i]||'',6.8,{bold:true,color:C.teal});
 }
 text(e,labelX,alphaY,'ALPHABET',4.1,{bold:true,color:C.muted});
 fit(e,x+70,alphaY,'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z',w-250,4.1,{bold:true,color:[74,101,105]});
 text(e,x+w-18,alphaY,'Use digit above: + forwards  - backwards  wrap A/Z',4.0,{color:C.muted,align:'right'});
}
function overlaySheet(entry,sheet,answers){const acts=sheet?.activities||[],count=Math.max(1,acts.length),top=110,bottom=PH-42,gap=12,ah=(bottom-top-gap*(count-1))/count,w=PW-2*M;acts.forEach((a,i)=>{if(a?.engineId==='operationgrid'&&a.printCipher?.version===158)redrawFooter(entry,a,answers,M,top+i*(ah+gap),w,ah);});}
PDF.buildDocument=function(opts={}){const doc=baseBuild(opts);if(!doc?.pages)return doc;const pack=opts.pack||{},kind=['student','answers','both'].includes(opts.kind)?opts.kind:'student',worked=(kind==='student'||kind==='both')&&opts.settings?.workedExamples==='front'?Math.ceil((pack.workedExamples?.length||0)/2):0,sheets=pack.sheets||[];let at=worked;if(kind==='student'||kind==='both')for(const sh of sheets)overlaySheet(doc.pages[at++],sh,false);if(kind==='answers'||kind==='both'){if(kind==='answers')at=0;for(const sh of sheets)overlaySheet(doc.pages[at++],sh,true);}return doc;};
PDF.__v160=true;PDF.versionV160='1.60';
})(typeof globalThis!=='undefined'?globalThis:this);
