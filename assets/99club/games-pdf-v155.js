/* 99 Club Studio · Games PDF finishing layer v1.55
 * - replaces the legacy Operation Codebreaker sign-copy strip with the v1.55
 *   operator->digit key + signed alphabet cipher;
 * - stamps Page X of Y on every final PDF page.
 * Loaded after all existing Games PDF overlays.
 */
(function(global){
'use strict';
const PDF=global.TT99GamesPDF,P=global.TT99SimplePDF;if(!PDF||!P||PDF.__v155)return;
const baseBuild=PDF.buildDocument.bind(PDF),PAGE_W=P.PAGE_W,PAGE_H=P.PAGE_H,M=34;
const C={ink:[36,67,74],muted:[96,116,121],teal:[15,118,109],line:[194,215,214],pale:[244,250,248],white:[255,255,255]};
const MARK=/\s*\[\[TT99OC155:[^\]]+\]\]/g;
function n(v){return Number(v).toFixed(2).replace(/\.00$/,'');}
function rgb(c){return c.map(v=>Math.max(0,Math.min(255,v))/255).map(n).join(' ');}
function esc(s){return P.asciiish(String(s??'')).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ');}
function cmds(entry){return Array.isArray(entry)?entry:entry.cmds;}
function dims(entry){return {w:Array.isArray(entry)?PAGE_W:(entry.width||PAGE_W),h:Array.isArray(entry)?PAGE_H:(entry.height||PAGE_H)};}
function text(entry,x,topY,value,size=7,opt={}){const {w:pw,h:ph}=dims(entry),v=esc(value),width=P.estimateTextWidth(v,size,!!opt.bold);let tx=x;if(opt.align==='center')tx-=width/2;if(opt.align==='right')tx-=width;cmds(entry).push(`BT /${opt.bold?'F2':'F1'} ${n(size)} Tf ${rgb(opt.color||C.ink)} rg 1 0 0 1 ${n(tx)} ${n(ph-topY)} Tm (${v}) Tj ET`);return width;}
function rect(entry,x,topY,w,h,opt={}){const ph=dims(entry).h,y=ph-topY-h,out=[];if(opt.fill)out.push(`${rgb(opt.fill)} rg`);if(opt.stroke)out.push(`${rgb(opt.stroke)} RG`);out.push(`${n(opt.width||.7)} w`,`${n(x)} ${n(y)} ${n(w)} ${n(h)} re`,opt.fill&&opt.stroke?'B':opt.fill?'f':'S');cmds(entry).push(out.join(' '));}
function fit(entry,x,topY,value,maxW,size,opt={}){let fs=size;while(fs>4.5&&P.estimateTextWidth(P.asciiish(String(value)),fs,!!opt.bold)>maxW)fs-=.25;text(entry,x,topY,value,fs,opt);return fs;}
function centerText(entry,cx,topY,value,size,opt={}){return text(entry,cx,topY,value,size,{...opt,align:'center'});}
function opLabel(op){return op==='-'?'-':op;}
function cleanInstructions(pack){const saved=[];for(const sheet of pack?.sheets||[])for(const a of sheet.activities||[])if(a?.engineId==='operationgrid'&&typeof a.instruction==='string'){saved.push([a,a.instruction]);a.instruction=a.instruction.replace(MARK,'').trim();}return ()=>saved.forEach(([a,s])=>a.instruction=s);}
function overlayCodebreaker(entry,a,answers,x,y,w,h,count){const p=a?.printCipher;if(!p)return;const compact=count>=3,boxH=compact?51:78,top=y+h-boxH-7;
  // Cover the old UNLOCK CODE strip and use the free lower part of the frame.
  rect(entry,x+8,top-2,w-16,boxH+4,{fill:C.white});
  const pairs=Object.entries(p.operatorDigits||{}),keyText=pairs.map(([op,d])=>`${opLabel(op)} = ${d}`).join('    ');
  text(entry,x+14,top+9,'OPERATOR KEY',5.5,{bold:true,color:C.muted});fit(entry,x+82,top+9,keyText,w-104,7.1,{bold:true,color:C.teal});
  const code=p.code||[],codeY=top+(compact?22:25);text(entry,x+14,codeY+9,'NUMBER CODE',5.5,{bold:true,color:C.muted});let cx=x+91;const bw=compact?15:18,bgap=3;for(let i=0;i<code.length&&cx+bw<x+w-12;i++,cx+=bw+bgap){rect(entry,cx,codeY,bw,17,{fill:answers?C.pale:C.white,stroke:C.line,width:.65});centerText(entry,cx+bw/2,codeY+11,answers?String(code[i]):String(i+1),answers?7:5,{bold:true,color:answers?C.teal:C.muted});}
  const cipher=String(p.cipher||''),moves=p.moves||[],cy=top+(compact?42:49);text(entry,x+14,cy+8,'SECRET WORD',5.5,{bold:true,color:C.muted});let sx=x+87;for(let i=0;i<cipher.length&&sx+25<x+w-12;i++,sx+=28){centerText(entry,sx+11,cy+1,cipher[i],8,{bold:true,color:C.ink});const mv=moves[i]||{};centerText(entry,sx+11,cy+11,`${Number(mv.direction)>0?'+':'-'}${mv.digit}`,5.2,{bold:true,color:C.teal});}
  if(!compact){text(entry,x+14,top+70,'+ forwards, - backwards; wrap Z to A and A to Z.',5.2,{color:C.muted});fit(entry,x+w-14,top+70,answers?`Decoded: ${p.word}`:'Decoded: __________________',175,6.2,{bold:true,color:answers?C.teal:C.ink,align:'right'});}
}
function overlaySheet(entry,sheet,answers){const acts=sheet?.activities||[],count=Math.max(1,acts.length),bodyTop=110,bodyBottom=PAGE_H-42,gap=12,ah=(bodyBottom-bodyTop-gap*(count-1))/count,w=PAGE_W-2*M;acts.forEach((a,i)=>{if(a?.engineId==='operationgrid'&&a.printCipher)overlayCodebreaker(entry,a,answers,M,bodyTop+i*(ah+gap),w,ah,count);});}
function stampPages(doc){const total=doc?.pages?.length||0;for(let i=0;i<total;i++){const entry=doc.pages[i],{w,h}=dims(entry),label=`Page ${i+1} of ${total}`;text(entry,w/2,h-13,label,6,{color:[125,143,147],align:'center'});}}
PDF.buildDocument=function(opts={}){const pack=opts.pack||{},restore=cleanInstructions(pack);let doc;try{doc=baseBuild(opts);}finally{restore();}if(!doc?.pages)return doc;const kind=['student','answers','both'].includes(opts.kind)?opts.kind:'student',worked=(kind==='student'||kind==='both')&&opts.settings?.workedExamples==='front'?Math.ceil((pack.workedExamples?.length||0)/2):0,sheets=pack.sheets||[];let at=worked;if(kind==='student'||kind==='both'){for(const sheet of sheets)overlaySheet(doc.pages[at++],sheet,false);}if(kind==='answers'||kind==='both'){if(kind==='answers')at=0;for(const sheet of sheets)overlaySheet(doc.pages[at++],sheet,true);}stampPages(doc);return doc;};
PDF.__v155=true;PDF.versionV155='1.55';
})(typeof globalThis!=='undefined'?globalThis:this);
