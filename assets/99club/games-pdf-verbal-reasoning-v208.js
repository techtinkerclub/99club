/* 99 Club Studio · PDF overlay for Verbal Reasoning v2.08 */
(function(global){
'use strict';
var PDF=global.TT99GamesPDF,P=global.TT99SimplePDF;if(!PDF||!P)return;
var original=PDF.buildDocument,PW=P.PAGE_W,PH=P.PAGE_H,M=34,INK=[36,67,74],MUT=[96,116,121],TEAL=[15,138,131],LINE=[174,194,197],WHITE=[255,255,255],PALE=[239,248,246];
function n(v){return Number(v).toFixed(2).replace(/\.00$/,'');}
function rgb(c){return c.map(function(v){return Math.max(0,Math.min(255,v))/255;}).map(n).join(' ');}
function esc(s){return P.asciiish(String(s==null?'':s)).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ');}
function text(c,x,y,t,size,opt){opt=opt||{};var font=opt.bold?'F2':'F1',col=opt.color||INK,s=esc(t),ww=P.estimateTextWidth(s,size,!!opt.bold),tx=x;if(opt.align==='center')tx-=ww/2;if(opt.align==='right')tx-=ww;c.push('BT /'+font+' '+n(size)+' Tf '+rgb(col)+' rg 1 0 0 1 '+n(tx)+' '+n(PH-y)+' Tm ('+s+') Tj ET');}
function rect(c,x,y,w,h,opt){opt=opt||{};var py=PH-y-h,fill=opt.fill||WHITE,stroke=opt.stroke||LINE,width=opt.width==null?.8:opt.width;c.push(rgb(fill)+' rg '+rgb(stroke)+' RG '+n(width)+' w '+n(x)+' '+n(py)+' '+n(w)+' '+n(h)+' re B');}
function line(c,x1,y1,x2,y2,opt){opt=opt||{};c.push(rgb(opt.color||LINE)+' RG '+n(opt.width||.8)+' w '+n(x1)+' '+n(PH-y1)+' m '+n(x2)+' '+n(PH-y2)+' l S');}
function wrap(t,max,size,bold){var words=esc(t).split(/\s+/).filter(Boolean),out=[],row='';for(var i=0;i<words.length;i++){var next=row?row+' '+words[i]:words[i];if(P.estimateTextWidth(next,size,!!bold)<=max||!row)row=next;else{out.push(row);row=words[i];}}if(row)out.push(row);return out;}
function wrapped(c,x,y,t,max,size,opt){opt=opt||{};var rows=wrap(t,max,size,!!opt.bold).slice(0,opt.maxLines||8),lh=opt.lineHeight||size*1.32;rows.forEach(function(row,i){text(c,x,y+i*lh,row,size,opt);});return rows.length*lh;}
function frame(c,a,x,y,w,h,index){rect(c,x,y,w,h,{fill:WHITE,stroke:[203,218,220],width:.9});var q=a.question||{};text(c,x+12,y+18,'Activity '+index,6.8,{bold:true,color:MUT});text(c,x+12,y+35,q.typeLabel||'Verbal Reasoning',11.5,{bold:true});text(c,x+w-12,y+20,'Type '+String(q.typeNumber||'')+' · '+String(a.difficulty||q.difficulty||'standard'),6.6,{color:MUT,align:'right'});return y+53;}
function draw(c,a,answers,x,y,w,h,index){
 var q=a.question||{},top=frame(c,a,x,y,w,h,index),used=wrapped(c,x+14,top,q.prompt||a.instruction||'',w-28,8.2,{color:INK,maxLines:9,lineHeight:11.2}),cy=top+used+8;
 if(Array.isArray(q.choices)&&q.choices.length){
   var cols=q.choices.length>2?2:1,gap=8,cw=(w-28-gap*(cols-1))/cols,rowH=31;
   q.choices.forEach(function(choice,i){var col=i%cols,row=Math.floor(i/cols),xx=x+14+col*(cw+gap),yy=cy+row*(rowH+6);rect(c,xx,yy,cw,rowH,{fill:WHITE,stroke:LINE,width:.55});text(c,xx+9,yy+19,String.fromCharCode(65+i)+'.',7.6,{bold:true,color:TEAL});wrapped(c,xx+27,yy+10,choice,cw-34,7.2,{color:INK,maxLines:2,lineHeight:8.6});});
   cy+=Math.ceil(q.choices.length/cols)*(rowH+6)+4;
 }
 if(answers){
   var answer=String(q.answerText||q.answer||'');rect(c,x+14,Math.min(cy+2,y+h-70),w-28,52,{fill:PALE,stroke:[167,205,200],width:.6});
   text(c,x+24,Math.min(cy+22,y+h-50),'Answer: '+answer,8,{bold:true,color:TEAL});
   if(q.explanation)wrapped(c,x+24,Math.min(cy+37,y+h-35),q.explanation,w-48,6.6,{color:MUT,maxLines:2,lineHeight:8});
 }else{
   var ly=Math.min(Math.max(cy+22,y+h-58),y+h-40);text(c,x+16,ly,'Answer:',7,{bold:true,color:MUT});line(c,x+62,ly+3,x+w-18,ly+3,{color:[115,139,143],width:.75});
 }
}
function overlay(doc,pageIndex,sheet,answers){var entry=doc.pages&&doc.pages[pageIndex],c=entry&&(entry.cmds||entry.c);if(!c)return;var acts=sheet.activities||[],count=Math.max(1,acts.length),bodyTop=110,bodyBottom=PH-42,gap=12,ah=(bodyBottom-bodyTop-gap*(count-1))/count,w=PW-2*M;acts.forEach(function(a,i){if(a.engineId==='verbalreasoning')draw(c,a,answers,M,bodyTop+i*(ah+gap),w,ah,i+1);});}
PDF.buildDocument=function(opts){opts=opts||{};var doc=original(opts),pack=opts.pack||{},settings=opts.settings||{},kind=['student','answers','both'].indexOf(opts.kind)>=0?opts.kind:'student',page=0;if((kind==='student'||kind==='both')&&settings.workedExamples==='front'&&pack.workedExamples&&pack.workedExamples.length)page+=Math.ceil(pack.workedExamples.length/2);if(kind==='student'||kind==='both')(pack.sheets||[]).forEach(function(sheet){overlay(doc,page++,sheet,false);});if(kind==='answers'||kind==='both')(pack.sheets||[]).forEach(function(sheet){overlay(doc,page++,sheet,true);});return doc;};
})(typeof window!=='undefined'?window:globalThis);
