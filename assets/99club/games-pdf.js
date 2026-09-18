/* 99 Club Studio · Maths Games & Puzzles PDF exporter
 * v1.6.1 — print readability pass for instructions, clues and question text.
 */
(function(global){
  'use strict';
  let P=global.TT99SimplePDF||null;
  if(!P && typeof require==='function'){
    try{P=require('./simple-pdf.js');}catch(e){}
  }
  if(!P)return;

  const INK=[36,67,74], MUTED=[96,116,121], TEAL=[15,138,131], LINE=[207,220,222], PALE=[244,249,248], DARK=[61,86,91], HIT=[218,242,237], WHITE=[255,255,255];
  const PAGE_GEO=global.TT99GamesPageGeometry||{};
  const M=Number(PAGE_GEO.margin)||34, PAGE_W=Number(PAGE_GEO.pageWidth)||P.PAGE_W, PAGE_H=Number(PAGE_GEO.pageHeight)||P.PAGE_H;

  function clean(s){return P.asciiish(String(s??''));}
  function cap(s){s=String(s||'');return s.charAt(0).toUpperCase()+s.slice(1);}
  function yearLabel(settings){return settings.minYear===settings.maxYear?`Year ${settings.minYear}`:`Years ${settings.minYear}-${settings.maxYear}`;}
  function topicLabel(settings,topics){return (settings.topics||[]).map(id=>topics?.[id]?.label||id).join(' · ');}
  function safeName(s){return String(s||'games').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'games';}
  function formatNumber(value){const n=Number(value);if(!Number.isFinite(n))return clean(value);const r=Math.round(n*1000)/1000;return Number.isInteger(r)?String(r):String(r).replace(/0+$/,'').replace(/\.$/,'');}
  function enumeration(term){const words=String(term||'').trim().split(/\s+/).filter(Boolean).map(word=>word.split('-').map(part=>(part.match(/[A-Za-z]/g)||[]).length).filter(Boolean).join('-')).filter(Boolean);return words.length?`(${words.join(', ')})`:'';}
  function needsEnumeration(term){return /[\s-]/.test(String(term||'').trim());}

  function wrap(text,maxWidth,size,bold=false){
    const words=clean(text).split(/\s+/).filter(Boolean),out=[];let line='';
    for(const word of words){
      const test=line?`${line} ${word}`:word;
      if(P.estimateTextWidth(test,size,bold)<=maxWidth || !line)line=test;
      else{out.push(line);line=word;}
    }
    if(line)out.push(line);return out;
  }
  function readableProseSize(text,size,opts={}){
    const original=Number(size)||0,value=clean(text);
    if(opts.compact||original>=8.7||!/[A-Za-z]/.test(value))return original;
    const words=value.trim().split(/\s+/).filter(Boolean);
    if(words.length<2&&value.length<9)return original;
    if(original<5.5)return 7.6;
    if(original<6.5)return 8.0;
    if(original<7.5)return 8.4;
    return 8.6;
  }
  function drawWrapped(page,x,y,text,maxWidth,size,opts={}){
    size=readableProseSize(text,size,opts);
    const lines=wrap(text,maxWidth,size,!!opts.bold),lh=opts.lineHeight||size*1.22,max=opts.maxLines||999;
    lines.slice(0,max).forEach((line,i)=>page.text(x,y+i*lh,line,size,opts));
    return Math.min(lines.length,max)*lh;
  }
  function fitText(page,x,y,text,maxWidth,size,opts={}){
    const original=Number(size)||0;size=readableProseSize(text,size,opts);
    const floor=size>original?6.8:4.5;let s=size;while(s>floor&&P.estimateTextWidth(clean(text),s,!!opts.bold)>maxWidth)s-=.25;
    page.text(x,y,text,s,opts);return s;
  }
  function box(page,x,y,w,h,fill=WHITE,stroke=LINE,width=.8){page.rect(x,y,w,h,{fill,stroke,width});}

  // Small vector helpers used by Games PDF renderers.  The browser preview uses
  // circles/rounded slots heavily; drawing equivalent geometry here keeps the
  // exported worksheet recognisably the same instead of falling back to boxes.
  function pdfN(v){return Number(v).toFixed(2).replace(/\.00$/,'');}
  function pdfRgb(c){return c.map(v=>Math.max(0,Math.min(255,v))/255).map(pdfN).join(' ');}
  function rawPath(page,parts,opts={}){
    const out=[];if(opts.fill)out.push(`${pdfRgb(opts.fill)} rg`);if(opts.stroke)out.push(`${pdfRgb(opts.stroke)} RG`);out.push(`${pdfN(opts.width||.7)} w`,...parts);out.push(opts.fill&&opts.stroke?'B':opts.fill?'f':'S');page.c.push(out.join(' '));
  }
  function drawCircle(page,cx,cy,r,opts={}){
    if(!page?.c)return page.rect(cx-r,cy-r,r*2,r*2,{fill:opts.fill,stroke:opts.stroke,width:opts.width});
    const k=r*.5522847498,Y=page.height-cy;
    rawPath(page,[`${pdfN(cx+r)} ${pdfN(Y)} m`,`${pdfN(cx+r)} ${pdfN(Y+k)} ${pdfN(cx+k)} ${pdfN(Y+r)} ${pdfN(cx)} ${pdfN(Y+r)} c`,`${pdfN(cx-k)} ${pdfN(Y+r)} ${pdfN(cx-r)} ${pdfN(Y+k)} ${pdfN(cx-r)} ${pdfN(Y)} c`,`${pdfN(cx-r)} ${pdfN(Y-k)} ${pdfN(cx-k)} ${pdfN(Y-r)} ${pdfN(cx)} ${pdfN(Y-r)} c`,`${pdfN(cx+k)} ${pdfN(Y-r)} ${pdfN(cx+r)} ${pdfN(Y-k)} ${pdfN(cx+r)} ${pdfN(Y)} c`,'h'],opts);
  }
  function drawRoundRect(page,x,topY,w,h,r,opts={}){
    if(!page?.c)return page.rect(x,topY,w,h,{fill:opts.fill,stroke:opts.stroke,width:opts.width});
    r=Math.max(0,Math.min(r,w/2,h/2));const k=r*.5522847498,y0=page.height-topY-h,y1=y0+h,x0=x,x1=x+w;
    rawPath(page,[`${pdfN(x0+r)} ${pdfN(y0)} m`,`${pdfN(x1-r)} ${pdfN(y0)} l`,`${pdfN(x1-r+k)} ${pdfN(y0)} ${pdfN(x1)} ${pdfN(y0+r-k)} ${pdfN(x1)} ${pdfN(y0+r)} c`,`${pdfN(x1)} ${pdfN(y1-r)} l`,`${pdfN(x1)} ${pdfN(y1-r+k)} ${pdfN(x1-r+k)} ${pdfN(y1)} ${pdfN(x1-r)} ${pdfN(y1)} c`,`${pdfN(x0+r)} ${pdfN(y1)} l`,`${pdfN(x0+r-k)} ${pdfN(y1)} ${pdfN(x0)} ${pdfN(y1-r+k)} ${pdfN(x0)} ${pdfN(y1-r)} c`,`${pdfN(x0)} ${pdfN(y0+r)} l`,`${pdfN(x0)} ${pdfN(y0+r-k)} ${pdfN(x0+r-k)} ${pdfN(y0)} ${pdfN(x0+r)} ${pdfN(y0)} c`,'h'],opts);
  }
  function drawDashedLine(page,x1,y1,x2,y2,opts={}){
    if(!page?.c)return page.line(x1,y1,x2,y2,opts);const yy1=page.height-y1,yy2=page.height-y2,dash=opts.dash||[4,3];page.c.push(`${opts.color?pdfRgb(opts.color)+' RG ':''}${pdfN(opts.width||.7)} w [${dash.map(pdfN).join(' ')}] 0 d ${pdfN(x1)} ${pdfN(yy1)} m ${pdfN(x2)} ${pdfN(yy2)} l S [] 0 d`);
  }
  // The tiny PDF writer intentionally uses a rough text-width estimator for
  // general layout.  That is fine for paragraphs but not for diagram centres:
  // Helvetica's digits are all 556 units wide, while the rough estimator treats
  // '1' as unusually narrow.  Use standard Helvetica AFM widths for diagram
  // labels/numbers so circles and axis labels are genuinely centred.
  const HELV_BOLD_UPPER={A:722,B:722,C:722,D:722,E:667,F:611,G:778,H:722,I:278,J:556,K:722,L:611,M:833,N:722,O:778,P:667,Q:778,R:722,S:667,T:611,U:722,V:722,W:1000,X:722,Y:722,Z:667};
  const HELV_UPPER={A:667,B:667,C:722,D:722,E:667,F:611,G:778,H:722,I:278,J:500,K:667,L:556,M:833,N:722,O:778,P:667,Q:778,R:722,S:667,T:611,U:722,V:667,W:944,X:667,Y:667,Z:611};
  const HELV_BOLD_LOWER={a:556,b:611,c:556,d:611,e:556,f:333,g:611,h:611,i:278,j:278,k:556,l:278,m:889,n:611,o:611,p:611,q:611,r:389,s:556,t:333,u:611,v:556,w:778,x:556,y:556,z:500};
  const HELV_LOWER={a:556,b:556,c:500,d:556,e:556,f:278,g:556,h:556,i:222,j:222,k:500,l:222,m:833,n:556,o:556,p:556,q:556,r:333,s:500,t:278,u:556,v:500,w:722,x:500,y:500,z:500};
  function diagramGlyphWidth(ch,bold){
    if(ch>='0'&&ch<='9')return 556;
    if(ch===' ')return 278;
    if(ch==='+'||ch==='-'||ch==='='||ch==='×')return 584;
    if(ch==='.'||ch===','||ch===':'||ch===';')return 278;
    if(ch==='/'||ch==='\\')return 278;
    if(ch==='('||ch===')')return 333;
    const upper=(bold?HELV_BOLD_UPPER:HELV_UPPER)[ch];if(upper)return upper;
    const lower=(bold?HELV_BOLD_LOWER:HELV_LOWER)[ch];if(lower)return lower;
    return bold?556:500;
  }
  function diagramTextWidth(text,size,bold=true){return [...clean(text)].reduce((sum,ch)=>sum+diagramGlyphWidth(ch,bold),0)*size/1000;}
  function diagramText(page,cx,baseline,text,size,opts={}){
    const value=clean(text),bold=!!opts.bold,w=diagramTextWidth(value,size,bold),o={...opts};delete o.align;page.text(cx-w/2,baseline,value,size,o);return w;
  }
  function fitDiagramText(page,cx,baseline,text,maxWidth,size,opts={}){
    let fs=size;while(fs>4.2&&diagramTextWidth(text,fs,!!opts.bold)>maxWidth)fs-=.25;diagramText(page,cx,baseline,text,fs,opts);return fs;
  }
  function drawCircleNode(page,cx,cy,text,r,opts={}){
    drawCircle(page,cx,cy,r,{fill:opts.fill||WHITE,stroke:opts.stroke||[92,119,124],width:opts.width||.8});
    if(text!==null&&text!==undefined&&text!==''){const fs=opts.fontSize||Math.max(6,Math.min(12,r*.62));diagramText(page,cx,cy+fs*.36,clean(text),fs,{bold:opts.bold!==false,color:opts.color||INK});}
  }

  function displayDate(value){if(!value)return '';const m=String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return clean(value);const months=['January','February','March','April','May','June','July','August','September','October','November','December'];return `${Number(m[3])} ${months[Number(m[2])-1]} ${m[1]}`;}
  function uniqueMeta(parts){const seen=new Set();return (parts||[]).filter(Boolean).filter(value=>{const key=String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g,'');if(!key||seen.has(key))return false;seen.add(key);return true;});}
  function drawPageHeader(page,pageKind,settings,topics,right){
    const p=settings?.personalisation||{},hasLogo=!!p.logoDataUrl;let left=M;
    if(hasLogo){const box=38,ratio=(Number(p.logoWidth)||1)/(Number(p.logoHeight)||1);let w=box,h=box;if(ratio>1)h=box/ratio;else w=box*ratio;page.image(M,21+(box-h)/2,w,h,'gamesLogo');left=M+box+9;}
    const school=clean(p.schoolName||'99 CLUB STUDIO · MATHS GAMES & PUZZLES'),title=clean(p.packTitle||'Maths Games & Puzzles');
    fitText(page,left,31,school,PAGE_W-left-M-185,8.4,{bold:true,color:INK});
    fitText(page,left,56,title,PAGE_W-left-M-185,18,{bold:true,color:INK});
    const meta=uniqueMeta([pageKind,p.classLabel,yearLabel(settings),topicLabel(settings,topics),displayDate(p.worksheetDate)]).join(' · ');
    if(meta)fitText(page,left,77,meta,PAGE_W-left-M,7.7,{color:MUTED});
    if(right)fitText(page,PAGE_W-M,58,clean(right),170,8,{bold:true,color:MUTED,align:'right'});
    page.line(M,94,PAGE_W-M,94,{color:LINE,width:1});
  }
  function drawFooter(page,left){
    page.line(M,PAGE_H-28,PAGE_W-M,PAGE_H-28,{color:[232,237,238],width:.6});
    page.text(M,PAGE_H-15,clean(left||'Generated locally'),5.8,{color:[130,145,149]});
    page.text(PAGE_W-M,PAGE_H-15,'99studio.uk/games/',5.8,{color:[130,145,149],align:'right'});
  }

  function activityFrame(page,x,y,w,h,index,a){
    box(page,x,y,w,h,WHITE,LINE,.8);
    page.text(x+12,y+18,`ACTIVITY ${index}`,8.4,{bold:true,color:MUTED});
    page.text(x+12,y+37,clean(a.title||'Activity'),14,{bold:true,color:INK});
    page.text(x+w-12,y+19,cap(a.difficulty||''),8.4,{color:MUTED,align:'right'});
    return y+50;
  }

  function drawWordSearch(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);
    const instruction=a.mode==='definitions'?'Work out each maths word from its definition, then find it in the grid.':'Read each maths word and its meaning, then find the word in the grid.';
    drawWrapped(page,x+12,top,instruction,w-24,7,{color:MUTED,maxLines:1});
    drawWrapped(page,x+12,top+12,a.directionTipPdf||a.directionLabel||'',w-24,6.2,{bold:true,color:TEAL,maxLines:1});
    const bodyY=top+28, bodyH=h-(bodyY-y)-12, leftW=Math.min(w*.54,bodyH), gap=14, rightX=x+12+leftW+gap, rightW=w-24-leftW-gap;
    const gridX=x+12, gridY=bodyY, size=a.size||a.grid?.length||12, cell=Math.min(leftW/size,bodyH/size), gridW=cell*size;
    const answerCells=new Set((a.placements||[]).flatMap(p=>(p.cells||[]).map(([cx,cy])=>`${cx}:${cy}`)));
    for(let gy=0;gy<size;gy++)for(let gx=0;gx<size;gx++){
      const hit=answers&&answerCells.has(`${gx}:${gy}`),cx=gridX+gx*cell,cy=gridY+gy*cell;
      page.rect(cx,cy,cell,cell,{fill:hit?HIT:WHITE,stroke:[190,206,208],width:.35});
      page.text(cx+cell/2,cy+cell*.68,clean(a.grid?.[gy]?.[gx]||''),Math.max(4.4,Math.min(8,cell*.48)),{bold:true,color:INK,align:'center'});
    }
    const entries=a.placements||[],maxPer=h<220?2:3,labels=entries.map((p,i)=>a.mode==='definitions'?`${i+1}. ${p.definition}${needsEnumeration(p.term)?` ${enumeration(p.term)}`:''}`:`${i+1}. ${p.term} — ${p.definition}`),availTextH=Math.max(40,y+h-17-(bodyY+2));
    let fs=h<220?7.2:h<360?8.0:8.6;
    const needed=size=>labels.reduce((sum,label)=>sum+Math.min(maxPer,wrap(label,rightW,size,false).length)*(size*1.18)+1.5,0);
    while(fs>6.8&&needed(fs)>availTextH)fs-=.2;
    const lh=fs*1.18;let cy=bodyY+2;
    for(let i=0;i<entries.length;i++){
      const lines=wrap(labels[i],rightW,fs,false).slice(0,maxPer);
      for(const line of lines){if(cy+lh>y+h-15)break;page.text(rightX,cy,line,fs,{color:DARK});cy+=lh;}
      cy+=1.5;if(cy>y+h-15)break;
    }
    if(answers&&cy<y+h-18){drawWrapped(page,rightX,cy+2,`Hidden words: ${entries.map(p=>p.term).join(', ')}`,rightW,fs,{bold:true,color:TEAL,maxLines:3});}
  }

  function drawPyramid(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);
    drawWrapped(page,x+12,top,`${a.instruction||'Each brick is the sum of the two bricks directly below it.'} Fill every empty brick.`,w-24,7,{color:MUTED,maxLines:2});
    const rows=a.rows||[],n=rows.length,maxCols=rows[n-1]?.length||n,bodyTop=top+28,availH=h-(bodyTop-y)-18,cellW=Math.min(58,(w-40)/maxCols),cellH=Math.min(34,availH/Math.max(1,n)),missing=new Set(a.missingSet||[]);
    let cy=bodyTop+Math.max(0,(availH-cellH*n)/2);
    rows.forEach((row,r)=>{const rowW=row.length*cellW,startX=x+w/2-rowW/2;row.forEach((v,c)=>{const key=`${r}:${c}`,wasBlank=missing.has(key),blank=wasBlank&&!answers,answerFill=answers&&wasBlank;page.rect(startX+c*cellW,cy,cellW-2,cellH-2,{fill:answerFill?HIT:blank?PALE:WHITE,stroke:[107,137,140],width:.8});if(!blank)page.text(startX+c*cellW+(cellW-2)/2,cy+cellH*.62,String(v),Math.min(10,cellH*.38),{bold:answerFill,color:answerFill?TEAL:INK,align:'center'});});cy+=cellH;});
  }

  function crosswordStarts(a){const map=new Map();for(const e of a.entries||[]){const k=`${e.x}:${e.y}`;if(!map.has(k))map.set(k,e.number);}return map;}
  function drawCrossword(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);
    drawWrapped(page,x+12,top,'Use the definitions to complete the crossword. Ignore spaces and punctuation in answers.',w-24,7,{color:MUTED,maxLines:2});
    const bodyY=top+28,bodyH=h-(bodyY-y)-12,gap=16,leftMax=w*.51,cols=a.width||a.grid?.[0]?.length||1,rows=a.height||a.grid?.length||1,gridAvailH=Math.max(24,bodyH-8);
    const cell=Math.min((leftMax-4)/cols,gridAvailH/rows,30),gridW=cell*cols,gridH=cell*rows,gridX=x+12+(leftMax-gridW)/2,gridY=bodyY+4+(gridAvailH-gridH)/2,rightX=x+12+leftMax+gap,rightW=w-24-leftMax-gap,starts=crosswordStarts(a);
    // Freeform classroom criss-cross: draw only answer cells. Empty locations
    // remain plain white paper, avoiding heavy newspaper-style black blocks.
    for(let gy=0;gy<rows;gy++)for(let gx=0;gx<cols;gx++){
      const ch=a.grid?.[gy]?.[gx]||'';if(!ch)continue;
      const cx=gridX+gx*cell,cy=gridY+gy*cell;
      page.rect(cx,cy,cell,cell,{fill:WHITE,stroke:[83,103,109],width:.62});
      const num=starts.get(`${gx}:${gy}`);if(num)page.text(cx+1.7,cy+4.8,String(num),Math.max(3.4,Math.min(5.2,cell*.24)),{bold:true,color:MUTED});
      if(answers)page.text(cx+cell/2,cy+cell*.69,ch,Math.max(5.5,Math.min(10,cell*.48)),{bold:true,color:INK,align:'center'});
    }
    const across=(a.entries||[]).filter(e=>e.dir==='across'),down=(a.entries||[]).filter(e=>e.dir==='down'),maxY=y+h-14,bankText=a.wordBank&&!answers?`Word bank: ${(a.entries||[]).map(e=>e.term).sort().join(', ')}`:'';
    const neededHeight=fs=>{const lh=fs*1.18;let total=0;for(const items of [across,down]){if(!items.length)continue;total+=10;for(const e of items)total+=wrap(`${e.number}. ${e.clue} ${e.enumeration||enumeration(e.term)}`,rightW,fs,false).length*lh+1;total+=3;}if(bankText)total+=wrap(bankText,rightW,fs,true).length*lh+2;return total;};
    let fs=h<220?7.2:h<360?8.0:8.8;while(fs>6.8&&bodyY+3+neededHeight(fs)>maxY)fs-=.2;const lh=fs*1.18;let cy=bodyY+3;
    const group=(label,items)=>{if(!items.length)return;page.text(rightX,cy,label,Math.max(5.6,fs+1),{bold:true,color:[46,87,86]});cy+=10;for(const e of items){const lines=wrap(`${e.number}. ${e.clue} ${e.enumeration||enumeration(e.term)}`,rightW,fs,false);for(const line of lines){page.text(rightX,cy,line,fs,{color:DARK});cy+=lh;}cy+=1;}cy+=3;};
    group('Across',across);group('Down',down);
    if(bankText)drawWrapped(page,rightX,cy,bankText,rightW,fs,{bold:true,color:TEAL,maxLines:99,lineHeight:lh});
  }

  function drawMagicGrid(page,grid,x,y,maxW,maxH,opts={}){
    const n=grid?.length||3,cell=Math.min(maxW/n,maxH/n,opts.maxCell||48),gw=cell*n,gh=cell*n,sx=x+(maxW-gw)/2,sy=y+(maxH-gh)/2,highlight=opts.highlight||'',answerKeys=new Set(opts.answerKeys||[]);
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const v=grid?.[r]?.[c],key=`${r}:${c}`,isHighlight=highlight===key,isAnswer=answerKeys.has(key);
      page.rect(sx+c*cell,sy+r*cell,cell,cell,{fill:isAnswer?HIT:isHighlight?[232,247,243]:WHITE,stroke:[91,113,118],width:.75});
      if(v!==null&&v!==undefined&&v!=='')page.text(sx+c*cell+cell/2,sy+r*cell+cell*.64,formatNumber(v),Math.max(7,Math.min(13,cell*.34)),{bold:isAnswer||isHighlight,color:isAnswer||isHighlight?TEAL:INK,align:'center'});
      else if(opts.questionMarks)page.text(sx+c*cell+cell/2,sy+r*cell+cell*.64,'?',Math.max(7,Math.min(12,cell*.32)),{bold:true,color:MUTED,align:'center'});
    }
    return {x:sx,y:sy,w:gw,h:gh,cell};
  }

  function drawMagic(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a),typeLabel={missing:'Fill missing values',check:'Is it a magic square?',repair:'Spot & fix error',transform:'Transform square'}[a.puzzleType]||'Magic Square';
    drawWrapped(page,x+12,top,a.instruction||'Complete the magic square.',w-24,7,{color:MUTED,maxLines:2});
    const bodyY=top+28,bodyH=h-(bodyY-y)-14;
    if(a.puzzleType==='transform'){
      const gap=22,blockW=(w-36-gap)/2,gridH=bodyH-36,target=answers?a.solutionGrid:a.displayGrid;
      page.text(x+12,bodyY,'Starting square',6.6,{bold:true,color:DARK});
      drawMagicGrid(page,a.sourceGrid,x+12,bodyY+10,blockW,gridH,{maxCell:38});
      page.text(x+12+blockW+gap/2,bodyY+bodyH*.46,clean(a.transform?.label||'Transform'),6.3,{bold:true,color:TEAL,align:'center'});
      page.text(x+12+blockW+gap,bodyY,'New square',6.6,{bold:true,color:DARK});
      const right=drawMagicGrid(page,target,x+12+blockW+gap,bodyY+10,blockW,gridH,{maxCell:38,answerKeys:answers?(a.missingSet||[]):[]});
      page.text(x+12+blockW+gap+blockW/2,right.y+right.h+13,answers?`New magic total: ${formatNumber(a.magicSum)}`:'New magic total: __________',6.2,{bold:true,color:answers?TEAL:MUTED,align:'center'});
      return;
    }
    const grid=a.puzzleType==='check'?a.displayGrid:(answers?a.solutionGrid:a.displayGrid),gridMax=Math.min(w*.58,bodyH),answerKeys=answers?(a.puzzleType==='repair'?[a.wrongCell]:(a.missingSet||[])):[],left=drawMagicGrid(page,grid,x+12,bodyY,gridMax,bodyH,{maxCell:h<230?34:50,highlight:answers&&a.puzzleType==='repair'?a.wrongCell:'',answerKeys}),sideX=x+24+gridMax,sideW=w-(sideX-x)-14;let sy=bodyY+10;
    page.text(sideX,sy,clean(typeLabel),7.5,{bold:true,color:DARK});sy+=16;
    if(a.puzzleType==='check'){
      if(answers)drawWrapped(page,sideX,sy,a.checkEvidence||'',sideW,7.0,{bold:true,color:TEAL,maxLines:4});
      else{page.text(sideX,sy,'Magic square?   Yes / No',7.2,{bold:true,color:INK});sy+=19;page.text(sideX,sy,'Evidence: ____________________',6.6,{color:MUTED});}
    }else if(a.puzzleType==='repair')drawWrapped(page,sideX,sy,answers?a.answerText:'Find the incorrect value and replace it.',sideW,7.0,{bold:true,color:answers?TEAL:INK,maxLines:4});
    else drawWrapped(page,sideX,sy,`Magic total: ${formatNumber(a.magicSum)}`,sideW,7.3,{bold:true,color:INK,maxLines:2});
  }

  function drawSudokuGrid(page,display,solution,answers,style,boxRows,boxCols,x,y,maxW,maxH,opts={}){
    const n=display?.length||4,cell=Math.min(maxW/n,maxH/n,opts.maxCell||52),gw=cell*n,gh=cell*n,sx=x+(maxW-gw)/2,sy=y+(maxH-gh)/2,boxR=boxRows||(n===9?3:2),boxC=boxCols||(n===9?3:n===6?3:2);
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const given=!!display[r][c],answerFill=answers&&!given,v=answers?(solution?.[r]?.[c]||display[r][c]):display[r][c];
      page.rect(sx+c*cell,sy+r*cell,cell,cell,{fill:answerFill?HIT:WHITE,stroke:[142,161,164],width:.5});
      if(v)page.text(sx+c*cell+cell/2,sy+r*cell+cell*.65,String(v),Math.max(7,Math.min(13,cell*.36)),{bold:answerFill,color:answerFill?TEAL:INK,align:'center'});
    }
    page.rect(sx,sy,gw,gh,{stroke:[73,99,105],width:1.4});
    if(style==='sudoku'){
      for(let c=boxC;c<n;c+=boxC)page.line(sx+c*cell,sy,sx+c*cell,sy+gh,{color:[73,99,105],width:1.4});
      for(let r=boxR;r<n;r+=boxR)page.line(sx,sy+r*cell,sx+gw,sy+r*cell,{color:[73,99,105],width:1.4});
    }
    return {x:sx,y:sy,w:gw,h:gh,cell};
  }

  function drawSudoku(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);
    drawWrapped(page,x+12,top,a.instruction||'Complete the grid.',w-24,7,{color:MUTED,maxLines:3});
    const bodyY=top+32,bodyH=h-(bodyY-y)-14;
    drawSudokuGrid(page,a.displayGrid,a.solutionGrid,answers,a.style,a.boxRows,a.boxCols,x+20,bodyY,w-40,bodyH,{maxCell:h<230?34:52});
  }

  function drawNodeBox(page,cx,cy,text,w=28,h=18,opts={}){
    const isBlank=text===null||text===undefined||text==='';
    page.rect(cx-w/2,cy-h/2,w,h,{fill:opts.fill||WHITE,stroke:opts.stroke||[92,119,124],width:opts.width||.7});
    if(!isBlank)page.text(cx,cy+3,clean(text),Math.min(8,h*.42),{bold:opts.bold!==false,color:opts.color||INK,align:'center'});
  }

  function arithmagonOpPoint(link,p,q,mx,my,cx,cy,nodeR){
    let vx,vy;if(link.diagonal){const dx=q[0]-p[0],dy=q[1]-p[1],len=Math.hypot(dx,dy)||1;vx=-dy/len;vy=dx/len;const tcx=cx-mx,tcy=cy-my;if(Math.hypot(tcx,tcy)<1){if(vy>0||(Math.abs(vy)<.01&&vx<0)){vx=-vx;vy=-vy;}}else if(vx*tcx+vy*tcy>0){vx=-vx;vy=-vy;}}
    else{vx=mx-cx;vy=my-cy;const len=Math.hypot(vx,vy)||1;vx/=len;vy/=len;}
    const off=nodeR+(link.diagonal?8:7);return [mx+vx*off,my+vy*off];
  }
  function drawArithmagon(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});
    const coords=a.coords||[],links=a.links||[],corners=answers?a.corners:a.displayCorners,shownLinks=answers?links.map(l=>l.value):(a.displayLinks||links.map(l=>l.value)),leftW=w*.72,bodyY=top+31,bodyH=h-(bodyY-y)-14,availW=leftW-28,size=Math.max(120,Math.min(availW,bodyH)),bx=x+14+(availW-size)/2,by=bodyY+(bodyH-size)/2,scaleX=v=>bx+(v/100)*size,scaleY=v=>by+(v/100)*size,centre=coords.length?coords.reduce((p,c)=>[p[0]+c[0],p[1]+c[1]],[0,0]).map(v=>v/coords.length):[50,50],ccx=scaleX(centre[0]),ccy=scaleY(centre[1]),cornerR=Math.max(12,Math.min(22,size*.087)),edgeR=Math.max(10,Math.min(19,size*.076));
    links.forEach((link,i)=>{const p=coords[link.a],q=coords[link.b],px=scaleX(p[0]),py=scaleY(p[1]),qx=scaleX(q[0]),qy=scaleY(q[1]);if(link.diagonal)drawDashedLine(page,px,py,qx,qy,{color:[138,160,164],width:1.15,dash:[5,4]});else page.line(px,py,qx,qy,{color:[88,115,120],width:1.45});});
    links.forEach((link,i)=>{const p=coords[link.a],q=coords[link.b],px=scaleX(p[0]),py=scaleY(p[1]),qx=scaleX(q[0]),qy=scaleY(q[1]),mx=(px+qx)/2,my=(py+qy)/2,wasBlank=(a.displayLinks||[])[i]==null,answerFill=answers&&wasBlank;drawCircleNode(page,mx,my,shownLinks[i],edgeR,{fill:answerFill?HIT:[238,248,246],stroke:[105,159,151],color:answerFill?TEAL:INK,bold:true,width:1.15,fontSize:Math.max(7,Math.min(11.5,edgeR*.62))});const [ox,oy]=arithmagonOpPoint(link,[px,py],[qx,qy],mx,my,ccx,ccy,edgeR);diagramText(page,ox,oy+3,link.operation==='add'?'+':'x',Math.max(7,Math.min(10.5,edgeR*.58)),{bold:true,color:[104,129,134]});});
    coords.forEach((p,i)=>{const wasBlank=(a.displayCorners||[])[i]==null,answerFill=answers&&wasBlank;drawCircleNode(page,scaleX(p[0]),scaleY(p[1]),corners[i],cornerR,{fill:answerFill?HIT:WHITE,stroke:[78,107,112],color:answerFill?TEAL:INK,bold:true,width:1.35,fontSize:Math.max(8,Math.min(13,cornerR*.62))});});
    const sx=x+leftW+5,sw=w-leftW-18;page.text(sx,bodyY+12,'Rule',8,{bold:true,color:DARK});const rule=a.operationMode==='mixed_within'?'Use the + or x shown on each connection.':a.operation==='add'?'Each result = corner + corner.':'Each result = corner x corner.';drawWrapped(page,sx,bodyY+29,rule,sw,6.8,{color:TEAL,bold:true,maxLines:4});if(a.connections==='diagonals')drawWrapped(page,sx,bodyY+72,'Dashed diagonals are connections too.',sw,5.9,{color:MUTED,maxLines:3});
  }

  function drawMagicShape(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});
    const leftW=w*.72,bodyY=top+31,bodyH=h-(bodyY-y)-14,availW=leftW-28,outer=Math.max(115,Math.min(availW,bodyH)),nodeR=Math.max(9,Math.min(16,outer*.054)),pad=nodeR+3,drawSize=Math.max(70,outer-2*pad),bx=x+14+(availW-outer)/2+pad,by=bodyY+(bodyH-outer)/2+pad,vals=answers&&a.puzzleType!=='check'?a.solutionValues:a.displayValues,hidden=new Set(a.hiddenIndices||[]);
    for(const line of a.lines||[])for(let k=0;k<line.length-1;k++){const p=a.coords[line[k]],q=a.coords[line[k+1]];page.line(bx+p[0]*drawSize,by+p[1]*drawSize,bx+q[0]*drawSize,by+q[1]*drawSize,{color:[88,115,120],width:1.35});}
    a.coords.forEach((p,i)=>{const answerFill=answers&&(hidden.has(i)||(a.puzzleType==='repair'&&a.brokenIndex===i)),bad=answers&&a.puzzleType==='check'&&a.brokenIndex===i;drawCircleNode(page,bx+p[0]*drawSize,by+p[1]*drawSize,vals[i],nodeR,{fill:answerFill?HIT:bad?[255,244,239]:WHITE,stroke:bad?[185,115,97]:[78,107,112],color:answerFill?TEAL:bad?[150,86,74]:INK,bold:true,width:1.15,fontSize:Math.max(7,Math.min(11,nodeR*.66))});});
    const sx=x+leftW+5,sw=w-leftW-18;page.text(sx,bodyY+14,a.puzzleType==='check'?'Check':a.puzzleType==='repair'?'Repair':'Magic total',8,{bold:true,color:DARK});
    if(a.puzzleType==='check')drawWrapped(page,sx,bodyY+31,answers?(a.isMagic?'Yes - it is magic.':`No. Line totals: ${(a.lineSums||[]).join(', ')}`):'Magic?  Yes / No',sw,6.6,{color:answers?TEAL:INK,bold:true,maxLines:5});
    else if(a.puzzleType==='repair')drawWrapped(page,sx,bodyY+31,answers?`Correct value: ${formatNumber(a.correctValue)}`:'Find and replace the wrong value.',sw,6.6,{color:answers?TEAL:INK,bold:true,maxLines:4});
    else{page.text(sx,bodyY+34,formatNumber(a.target),11,{bold:true,color:TEAL});drawWrapped(page,sx,bodyY+55,answers?'Filled answers are highlighted.':'Every marked line must match.',sw,5.9,{color:MUTED,maxLines:3});}
  }
  function drawMaze(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.4,{color:MUTED,maxLines:2});
    const bodyY=top+31,bodyH=h-(bodyY-y)-10,size=a.size||5,gridAvailW=w*.48,cell=Math.min((gridAvailW-8)/size,(bodyH-4)/size,42),gridW=cell*size,gx=x+14+(gridAvailW-gridW)/2,gy=bodyY+Math.max(0,(bodyH-gridW)/2),route=new Map((a.path||[]).map((p,i)=>[`${p[0]}:${p[1]}`,i]));
    for(let r=0;r<size;r++)for(let c=0;c<size;c++){
      const cellData=a.grid?.[r]?.[c],key=`${c}:${r}`,onRoute=route.has(key),fill=answers&&onRoute?HIT:WHITE,stroke=cellData?.kind==='start'||cellData?.kind==='finish'?[68,126,120]:[158,178,181];
      page.rect(gx+c*cell,gy+r*cell,cell,cell,{fill,stroke,width:cellData?.kind==='start'||cellData?.kind==='finish'?1:.55});
      if(!cellData)continue;
      const label=cellData.kind==='start'?'START':cellData.kind==='finish'?'FINISH':formatNumber(cellData.value),fs=cellData.kind==='start'||cellData.kind==='finish'?Math.max(3.5,Math.min(5.3,cell*.16)):Math.max(4.8,Math.min(7.2,cell*.25));
      fitText(page,gx+c*cell+cell/2,gy+r*cell+cell*.62,label,cell-5,fs,{bold:true,color:cellData.kind==='start'||cellData.kind==='finish'?TEAL:INK,align:'center'});
      if(answers&&cellData.kind==='answer'&&cellData.step)page.text(gx+c*cell+2.4,gy+r*cell+6,String(cellData.step),3.8,{bold:true,color:TEAL});
    }
    const qx=x+gridAvailW+22,qw=w-gridAvailW-35;page.text(qx,bodyY+8,'Questions',8.5,{bold:true,color:DARK});
    const noteH=10,usableQH=Math.max(32,bodyH-24-noteH),qh=usableQH/Math.max(1,a.steps.length),qfs=Math.max(7.0,Math.min(8.5,qh*.42));let cy=bodyY+18;
    for(let i=0;i<a.steps.length;i++){
      const st=a.steps[i],baseline=cy+Math.min(qh*.66,qfs+1.1);page.text(qx,baseline,`${i+1}.`,Math.max(3.4,qfs-.15),{bold:true,color:TEAL});
      fitText(page,qx+12,baseline,clean(st.question),qw-(answers?43:14),qfs,{bold:true,color:DARK});
      if(answers)fitText(page,qx+qw-2,baseline,formatNumber(st.answer),28,qfs,{bold:true,color:TEAL,align:'right'});
      cy+=qh;
    }
    page.text(qx,bodyY+bodyH-2,answers?'Highlighted cells = route':'Only up / down / left / right',Math.max(6.8,Math.min(7.6,qfs)),{color:MUTED});
  }

  function crossStarts(a){const m=new Map();for(const e of a.entries||[]){const k=`${e.x}:${e.y}`;if(!m.has(k))m.set(k,e.number);}return m;}

function drawPropertyMaze(page,a,answers,x,y,w,h,index){
  const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.4,{color:MUTED,maxLines:2});
  const bodyY=top+31,bodyH=h-(bodyY-y)-10,size=a.size||5,gridAvailW=w*.58,cell=Math.min((gridAvailW-8)/size,(bodyH-4)/size,42),gridW=cell*size,gx=x+14+(gridAvailW-gridW)/2,gy=bodyY+Math.max(0,(bodyH-gridW)/2),route=new Set(a.solutionKeys||[]),start=`${a.start?.[0]}:${a.start?.[1]}`,finish=`${a.finish?.[0]}:${a.finish?.[1]}`;
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    const key=`${r}:${c}`,isStart=key===start,isFinish=key===finish,onRoute=route.has(key),fill=answers&&onRoute?HIT:WHITE,stroke=isStart||isFinish?[68,126,120]:[158,178,181];
    page.rect(gx+c*cell,gy+r*cell,cell,cell,{fill,stroke,width:isStart||isFinish?1:.55});
    fitDiagramText(page,gx+c*cell+cell/2,gy+r*cell+cell*.64,formatNumber(a.grid?.[r]?.[c]),cell-5,Math.max(5,Math.min(8.2,cell*.27)),{bold:true,color:isStart||isFinish?TEAL:INK});
    if(isStart||isFinish)page.text(gx+c*cell+(isFinish?cell-2.3:2.3),gy+r*cell+6,isStart?'START':'FINISH',Math.max(3.2,Math.min(4.5,cell*.13)),{bold:true,color:TEAL,align:isFinish?'right':'left'});
  }
  const qx=x+gridAvailW+22,qw=w-gridAvailW-35,rule=clean(a.rule?.shortLabel||a.rule?.label||'Number property');page.text(qx,bodyY+10,'Rule',9,{bold:true,color:DARK});
  box(page,qx,bodyY+18,qw,52,PALE,LINE,.7);drawWrapped(page,qx+8,bodyY+33,'Move only through',qw-16,7,{bold:true,color:MUTED,maxLines:1});drawWrapped(page,qx+8,bodyY+49,rule,qw-16,8.4,{bold:true,color:TEAL,maxLines:2});
  const dead=a.deadEndCount||0,note=answers?'Highlighted cells show the unique START to FINISH route.':dead?`${dead} matching ${dead===1?'number is':'numbers are'} a dead end. Not every matching square is on the final route.`:'All matching squares belong to the route in this version.';
  drawWrapped(page,qx,bodyY+88,note,qw,7,{color:answers?TEAL:MUTED,bold:!!answers,maxLines:5});
  if(answers&&dead)drawWrapped(page,qx,bodyY+129,`${dead} matching ${dead===1?'dead end is':'dead ends are'} deliberately outside the answer route.`,qw,6.8,{color:MUTED,maxLines:4});
}

  function drawCrossnumber(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.6,{color:MUTED,maxLines:2});
    const bodyY=top+28,bodyH=h-(bodyY-y)-12,leftMax=w*.48,gap=12,cols=a.width||1,rows=a.height||1,cell=Math.min((leftMax-2)/cols,bodyH/rows,28),gw=cell*cols,gh=cell*rows,gx=x+12+(leftMax-gw)/2,gy=bodyY+(bodyH-gh)/2,starts=crossStarts(a);
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const ch=a.grid?.[r]?.[c];if(!ch)continue;const cx=gx+c*cell,cy=gy+r*cell;page.rect(cx,cy,cell,cell,{fill:answers?HIT:WHITE,stroke:[83,103,109],width:.6});const n=starts.get(`${c}:${r}`);if(n)page.text(cx+1.4,cy+4.2,String(n),Math.max(3.1,Math.min(3.7,cell*.16)),{bold:true,color:MUTED});if(answers)diagramText(page,cx+cell/2,cy+cell*.67,ch,Math.max(5.2,Math.min(8.8,cell*.44)),{bold:true,color:TEAL});}
    const rx=x+12+leftMax+gap,rw=w-24-leftMax-gap,groups=[['Across',a.entries.filter(e=>e.dir==='across')],['Down',a.entries.filter(e=>e.dir==='down')]],cgap=8,cw=(rw-cgap)/2;
    groups.forEach(([label,list],gi)=>{const xx=rx+gi*(cw+cgap);page.text(xx,bodyY+7,label,8.4,{bold:true,color:[46,87,86]});const usable=bodyH-16,rowH=Math.max(12,usable/Math.max(1,list.length)),fs=Math.max(6.6,Math.min(8.4,rowH*.43));let cy=bodyY+18;for(const e of list){drawWrapped(page,xx,cy,`${e.number}. ${e.clue}`,cw,fs,{color:DARK,lineHeight:fs*1.08,maxLines:2,compact:true});cy+=rowH;if(cy>bodyY+bodyH-4)break;}});
  }
  function drawNumberSearch(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.7,{color:MUTED,maxLines:1});drawWrapped(page,x+12,top+11,a.directionTip||'',w-24,5.6,{bold:true,color:[46,112,108],maxLines:1});
    const bodyY=top+27,bodyH=h-(bodyY-y)-12,leftW=Math.min(w*.51,bodyH),gap=15,size=a.size||10,cell=Math.min((leftW-4)/size,bodyH/size,25),gw=cell*size,gx=x+12+(leftW-gw)/2,gy=bodyY+Math.max(0,(bodyH-gw)/2),hit=new Set((a.placements||[]).flatMap(q=>(q.cells||[]).map(([cx,cy])=>`${cx}:${cy}`)));
    for(let r=0;r<size;r++)for(let c=0;c<size;c++){const cx=gx+c*cell,cy=gy+r*cell,isHit=answers&&hit.has(`${c}:${r}`);page.rect(cx,cy,cell,cell,{fill:isHit?HIT:WHITE,stroke:[157,176,179],width:.45});diagramText(page,cx+cell/2,cy+cell*.66,clean(a.grid?.[r]?.[c]||''),Math.max(5.2,Math.min(8.2,cell*.42)),{bold:true,color:isHit?TEAL:INK});}
    const rx=x+12+leftW+gap,rw=w-24-leftW-gap,list=a.placements||[],rowH=Math.max(12,Math.min(20,bodyH/Math.max(1,list.length))),fs=Math.max(6.8,Math.min(8.2,rowH*.48));let cy=bodyY+5;for(let i=0;i<list.length;i++){const q=list[i],baseline=cy+Math.min(rowH*.58,fs+1);page.text(rx,baseline,`${i+1}.`,Math.max(4.1,fs-.15),{bold:true,color:TEAL});fitText(page,rx+12,baseline,clean(q.question),rw-(answers?47:34),fs,{color:DARK});fitText(page,rx+rw-1,baseline,answers?`= ${formatNumber(q.answer)}`:'= ____',answers?43:30,fs,{bold:answers,color:answers?TEAL:MUTED,align:'right'});cy+=rowH;}
  }

  function drawEquationCrossgrid(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.8,{color:MUTED,maxLines:2});
    const solution=a.solutionGrid||[],shown=answers?solution:(a.displayGrid||solution),hidden=new Set(a.hiddenKeys||[]),n=a.size||solution.length||5,bodyY=top+28,bodyH=h-(bodyY-y)-14,gridSize=Math.min(w-74,bodyH,n>=10?320:300),cell=gridSize/n,gx=x+w/2-gridSize/2,gy=bodyY+Math.max(0,(bodyH-gridSize)/2),BLOCK=[45,61,66];
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){const sol=solution?.[r]?.[c],v=shown?.[r]?.[c],key=`${r}:${c}`,cx=gx+c*cell,cy=gy+r*cell,block=sol==='#',answerFill=answers&&hidden.has(key);page.rect(cx,cy,cell,cell,{fill:block?BLOCK:answerFill?HIT:WHITE,stroke:block?BLOCK:[112,137,142],width:block?.25:.58});if(block||v==null)continue;const text=v==='-'?'−':String(v),isOp=['+','-','×','÷','='].includes(sol),fs=isOp?Math.max(4.6,Math.min(12,cell*.34)):Math.max(4.8,Math.min(11.5,cell*.31));fitDiagramText(page,cx+cell/2,cy+cell*.64,clean(text),cell-4,fs,{bold:true,color:answerFill?TEAL:INK});}
    page.rect(gx,gy,gridSize,gridSize,{fill:null,stroke:[70,94,99],width:1});
  }
  function drawNumberTrail(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.8,{color:MUTED,maxLines:2});const vals=answers?a.values:a.displayValues,cols=a.values.length<=12?4:5,rows=Math.ceil(vals.length/cols),bodyY=top+30,cellW=(w-32)/cols,cellH=Math.min(38,(h-(bodyY-y)-12)/rows);vals.forEach((v,i)=>{const r=Math.floor(i/cols),cc=i%cols,c=r%2===0?cc:cols-1-cc,cx=x+16+c*cellW,cy=bodyY+r*cellH,answerFill=answers&&a.displayValues?.[i]==null;page.rect(cx,cy,cellW-4,cellH-4,{fill:answerFill?HIT:WHITE,stroke:[151,177,180],width:.6});page.text(cx+3,cy+7,String(i+1),4,{bold:true,color:MUTED});if(v!=null)page.text(cx+(cellW-4)/2,cy+cellH*.62,formatNumber(v),7.5,{bold:answerFill,color:answerFill?TEAL:INK,align:'center'});});}

  function drawTarget(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.6,{color:MUTED,maxLines:2});
    const bodyY=top+30,bodyH=h-(bodyY-y)-12,gap=7,count=Math.max(1,a.challenges.length),cardH=Math.min(54,(bodyH-gap*(count-1))/count),cardW=w-30;
    a.challenges.forEach((c,i)=>{const cy=bodyY+i*(cardH+gap),cx=x+15;drawRoundRect(page,cx,cy,cardW,cardH,8,{fill:[251,253,252],stroke:[211,225,226],width:.7});drawCircle(page,cx+16,cy+cardH/2,9,{fill:[231,246,242],stroke:[104,160,151],width:.7});diagramText(page,cx+16,cy+cardH/2+2.6,String(i+1),6.5,{bold:true,color:TEAL});
      let xx=cx+33,tile=Math.min(26,Math.max(20,(cardW*.40)/(c.numbers.length||1)-4));for(const n of c.numbers){drawRoundRect(page,xx,cy+(cardH-tile)/2,tile,tile,5,{fill:WHITE,stroke:[151,177,180],width:.7});diagramText(page,xx+tile/2,cy+cardH/2+2.5,String(n),7,{bold:true,color:INK});xx+=tile+5;}
      const tx=cx+cardW*.56;drawRoundRect(page,tx,cy+7,cardW*.17,cardH-14,6,{fill:[239,248,246],stroke:[118,169,162],width:.8});fitDiagramText(page,tx+cardW*.085,cy+cardH/2+2.4,`TARGET ${c.target}`,cardW*.15,7.2,{bold:true,color:[37,94,91]});
      const sx=cx+cardW*.76,sw=cardW*.21;page.text(sx,cy+12,answers?'Solution':'Working',5.2,{bold:true,color:MUTED});if(answers)drawWrapped(page,sx,cy+24,clean(c.solution),sw,5.9,{bold:true,color:TEAL,maxLines:2});else page.line(sx,cy+cardH-12,sx+sw,cy+cardH-12,{color:[157,176,179],width:.65});
    });
  }
  function drawBrokenCalc(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.6,{color:MUTED,maxLines:2});
    const keySize=30,keyGap=6,total=a.keys.length*keySize+Math.max(0,a.keys.length-1)*keyGap,start=x+w/2-total/2,ky=top+34;
    a.keys.forEach((k,i)=>{const xx=start+i*(keySize+keyGap);drawRoundRect(page,xx,ky,keySize,keySize,6,{fill:[247,250,249],stroke:[111,142,147],width:.8});diagramText(page,xx+keySize/2,ky+keySize*.63,clean(k),8.2,{bold:true,color:INK});});
    const bodyY=ky+42,bodyH=h-(bodyY-y)-12,gap=8,count=Math.max(1,a.targets.length),cardH=Math.min(48,(bodyH-gap*(count-1))/count),cardW=w-48;
    a.targets.forEach((t,i)=>{const cy=bodyY+i*(cardH+gap),cx=x+24;drawRoundRect(page,cx,cy,cardW,cardH,7,{fill:WHITE,stroke:[211,224,226],width:.7});drawCircle(page,cx+17,cy+cardH/2,9,{fill:[232,246,243],stroke:[104,160,151],width:.7});diagramText(page,cx+17,cy+cardH/2+2.5,String(i+1),6.3,{bold:true,color:TEAL});page.text(cx+34,cy+14,'TARGET',5.2,{bold:true,color:MUTED});fitDiagramText(page,cx+74,cy+cardH/2+3,formatNumber(t.target),60,11,{bold:true,color:DARK});const sx=cx+cardW*.48,sw=cardW*.48;page.text(sx,cy+13,answers?'Key presses':'Your key presses',5.2,{bold:true,color:MUTED});if(answers)drawWrapped(page,sx,cy+26,clean(t.solution),sw,6.3,{bold:true,color:TEAL,maxLines:2});else page.line(sx,cy+cardH-12,sx+sw,cy+cardH-12,{color:[157,176,179],width:.65});});
  }
  function drawSymbols(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a),symbols=a.symbols||a.names||[],values=a.values||[],letters=a.letters||[],code=a.code||[],clues=a.clues||(a.equations||[]).map(e=>e.text),letterFor=s=>{const i=symbols.indexOf(s);return i>=0?letters[i]||'':'';};
    function shape(page,cx,cy,s,r=5){const i=symbols.indexOf(s),stroke=[47,105,103],fill=[232,246,243];if(i===1)return drawCircle(page,cx,cy,r,{fill,stroke,width:.8});if(i===3)return page.rect(cx-r,cy-r,r*2,r*2,{fill,stroke,width:.8});const pts=i===2?[[cx,cy-r],[cx+r,cy+r],[cx-r,cy+r]]:i===5?Array.from({length:6},(_,k)=>{const a=-Math.PI/2+k*Math.PI/3;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];}):i===4?Array.from({length:10},(_,k)=>{const a=-Math.PI/2+k*Math.PI/5,rr=k%2?r*.45:r;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr];}):i===6?[[cx,cy-r],[cx+r*.42,cy-r*.42],[cx+r,cy],[cx+r*.42,cy+r*.42],[cx,cy+r],[cx-r*.42,cy+r*.42],[cx-r,cy],[cx-r*.42,cy-r*.42]]:[[cx,cy-r],[cx+r,cy],[cx,cy+r],[cx-r,cy]];if(!page?.c)return drawCircle(page,cx,cy,r,{fill,stroke,width:.8});const Y=v=>page.height-v,parts=[`${pdfN(pts[0][0])} ${pdfN(Y(pts[0][1]))} m`,...pts.slice(1).map(p=>`${pdfN(p[0])} ${pdfN(Y(p[1]))} l`),'h'];rawPath(page,parts,{fill,stroke,width:.8});}
    function equation(page,text,cx,baseline,maxW){const tokens=String(text).split(/\s+/),parts=tokens.map(t=>symbols.includes(t)?{t,w:14,s:true}:{t,w:diagramTextWidth(clean(t),7.3,true)+5,s:false}),total=parts.reduce((q,p)=>q+p.w,0),scale=Math.min(1,maxW/Math.max(1,total));let xx=cx-total*scale/2;for(const p of parts){const ww=p.w*scale;if(p.s)shape(page,xx+ww/2,baseline-2,p.t,4.6*scale);else diagramText(page,xx+ww/2,baseline,clean(p.t),7.3*scale,{bold:true,color:INK});xx+=ww;}}
    drawWrapped(page,x+12,top,a.instruction,w-24,6.7,{color:MUTED,maxLines:2});let cy=top+25;
    page.text(x+w/2,cy,'SECRET WORD',5.4,{bold:true,color:MUTED,align:'center'});cy+=7;const gap=3,n=Math.max(1,code.length),cell=Math.min(27,(w-54-gap*(n-1))/n),total=n*cell+(n-1)*gap,sx=x+w/2-total/2;for(let i=0;i<n;i++){const xx=sx+i*(cell+gap);drawRoundRect(page,xx,cy,cell,cell,4,{fill:WHITE,stroke:[116,161,156],width:.8});shape(page,xx+cell/2,cy+cell/2,code[i],Math.min(5.3,cell*.23));}cy+=cell+6;
    page.text(x+w/2,cy,'WRITE THE WORD',4.8,{bold:true,color:MUTED,align:'center'});cy+=5;const answerCell=Math.min(21,(w-82-gap*(n-1))/n),answerTotal=n*answerCell+(n-1)*gap,answerX=x+w/2-answerTotal/2;for(let i=0;i<n;i++){const xx=answerX+i*(answerCell+gap);drawRoundRect(page,xx,cy,answerCell,answerCell,3,{fill:answers?HIT:WHITE,stroke:[151,181,178],width:.7});if(answers)diagramText(page,xx+answerCell/2,cy+answerCell*.66,letterFor(code[i]),Math.min(8.5,answerCell*.43),{bold:true,color:TEAL});}cy+=answerCell+6;
    page.text(x+w/2,cy,'LETTER CODE',4.7,{bold:true,color:MUTED,align:'center'});cy+=5;const alpha1='A=1  B=2  C=3  D=4  E=5  F=6  G=7  H=8  I=9  J=10  K=11  L=12  M=13',alpha2='N=14  O=15  P=16  Q=17  R=18  S=19  T=20  U=21  V=22  W=23  X=24  Y=25  Z=26';fitDiagramText(page,x+w/2,cy,alpha1,w-36,4.6,{bold:true,color:MUTED});cy+=6;fitDiagramText(page,x+w/2,cy,alpha2,w-36,4.6,{bold:true,color:MUTED});cy+=8;
    if(answers&&a.definition){const used=drawWrapped(page,x+20,cy,`${a.word}: ${a.definition}`,w-40,5.9,{color:DARK,maxLines:2,lineHeight:7});cy+=used+5;}
    const cols=clues.length>=5?3:2,rows=Math.ceil(clues.length/cols),cg=5,cw=(w-24-cg*(cols-1))/cols,ch=Math.max(20,Math.min(27,(h-(cy-y)-52)/Math.max(1,rows)));clues.forEach((q,i)=>{const r=Math.floor(i/cols),c=i%cols,xx=x+12+c*(cw+cg),yy=cy+r*(ch+4);drawRoundRect(page,xx,yy,cw,ch,5,{fill:WHITE,stroke:[211,225,224],width:.6});page.text(xx+5,yy+7,`CLUE ${i+1}`,4.4,{bold:true,color:MUTED});equation(page,q,xx+cw/2,yy+ch*.70,cw-8);});cy+=rows*(ch+4)+3;
    const lc=Math.max(1,symbols.length),lw=(w-24)/lc;symbols.forEach((s,i)=>{const cx=x+12+lw*i+lw/2;shape(page,cx-lw*.20,cy+9,s,4.6);const label=answers?`= ${values[i]} -> ${letters[i]}`:'= ____';fitDiagramText(page,cx+lw*.10,cy+12,label,lw*.62,6.3,{bold:true,color:answers?TEAL:DARK});});
  }

  function drawDomino(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.4,{color:MUTED,maxLines:2});const list=answers?a.ordered:a.dominoes,cols=2,rows=Math.ceil(list.length/cols),bodyY=top+30,cw=(w-34)/2,ch=Math.min(42,(h-(bodyY-y)-10)/rows);list.forEach((d,i)=>{const r=Math.floor(i/2),c=i%2,cx=x+14+c*(cw+6),cy=bodyY+r*ch;page.rect(cx,cy,cw,ch-5,{fill:WHITE,stroke:[96,125,130],width:.7});page.line(cx+cw*.38,cy,cx+cw*.38,cy+ch-5,{color:[153,174,177],width:.5});fitText(page,cx+cw*.19,cy+ch*.58,clean(d.left),cw*.34,6.2,{bold:true,color:INK,align:'center'});drawWrapped(page,cx+cw*.42,cy+6,clean(d.right),cw*.54,5.7,{bold:true,color:DARK,maxLines:2});if(answers)page.text(cx+3,cy+6,String(i+1),4,{bold:true,color:TEAL});});}

  function drawOperationGrid(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.7,{color:MUTED,maxLines:2});
    const showOp=op=>op==='-'?'−':op,cols=2,rows=Math.ceil(a.rows.length/cols),bodyY=top+31,codeH=42,bodyH=h-(bodyY-y)-codeH-12,gapX=8,gapY=7,cardW=(w-32-gapX)/2,cardH=Math.min(46,(bodyH-gapY*(rows-1))/Math.max(1,rows));let codeIndex=0;
    a.rows.forEach((r,i)=>{const rr=Math.floor(i/cols),cc=i%cols,cx=x+16+cc*(cardW+gapX),cy=bodyY+rr*(cardH+gapY);drawRoundRect(page,cx,cy,cardW,cardH,7,{fill:[251,253,252],stroke:[207,222,223],width:.7});drawCircle(page,cx+15,cy+cardH/2,8,{fill:[231,246,242],stroke:[102,157,150],width:.65});diagramText(page,cx+15,cy+cardH/2+2.2,String(i+1),5.8,{bold:true,color:TEAL});
      const parts=String(r.text||'').split('□'),fs=Math.max(6.2,Math.min(8.5,cardH*.20)),slotW=18,slotH=20,partWidths=parts.map(part=>diagramTextWidth(clean(part),fs,true)),total=partWidths.reduce((s,v)=>s+v,0)+(parts.length-1)*slotW,startX=cx+32+(cardW-38-total)/2,baseline=cy+cardH/2+fs*.34;let xx=startX;
      parts.forEach((part,j)=>{page.text(xx,baseline,clean(part),fs,{bold:true,color:INK});xx+=partWidths[j];if(j<parts.length-1){const op=r.ops?.[j]||'';drawRoundRect(page,xx,cy+cardH/2-slotH/2,slotW,slotH,4,{fill:answers?HIT:WHITE,stroke:[77,139,132],width:1});if(answers)diagramText(page,xx+slotW/2,cy+cardH/2+3,showOp(op),9,{bold:true,color:TEAL});xx+=slotW;codeIndex++;}});
    });
    const code=a.code||a.rows.flatMap(r=>r.ops||[]),stripW=Math.min(w-70,code.length*25+110),stripX=x+w/2-stripW/2,stripY=y+h-codeH+4;drawRoundRect(page,stripX,stripY,stripW,31,7,{fill:[243,250,248],stroke:[126,164,159],width:.7});page.text(stripX+10,stripY+12,'UNLOCK CODE',5.2,{bold:true,color:DARK});let xx=stripX+78;code.forEach((op,i)=>{drawRoundRect(page,xx,stripY+5,21,21,4,{fill:answers?HIT:WHITE,stroke:[112,151,146],width:.75});diagramText(page,xx+10.5,stripY+18,answers?showOp(op):String(i+1),answers?8.5:5.2,{bold:true,color:answers?TEAL:MUTED});xx+=25;});
  }
  function drawNumberWheels(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.8,{color:MUTED,maxLines:2});const bodyY=top+31,bodyH=h-(bodyY-y)-10;
    if(a.style==='wheel'){
      const cols=a.items.length===6?3:a.items.length<=3?Math.min(3,a.items.length):2,rows=Math.ceil(a.items.length/cols),gap=a.items.length===6?7:10,slotW=(w-30-(cols-1)*gap)/cols,slotH=(bodyH-(rows-1)*gap)/rows;
      a.items.forEach((it,i)=>{const r=Math.floor(i/cols),c=i%cols,cx=x+15+c*(slotW+gap)+slotW/2,cy=bodyY+r*(slotH+gap)+slotH/2,size=Math.max(84,Math.min(slotW*.94,slotH*1.08,a.items.length===6?170:152)),s=size/160,n=it.inputs.length,innerR=42*s,outerR=63*s,innerNode=9.5*s,outerNode=10.5*s,centreR=29*s;for(let j=0;j<n;j++){const ang=-Math.PI/2+j*2*Math.PI/n,ix=cx+Math.cos(ang)*innerR,iy=cy+Math.sin(ang)*innerR,ox=cx+Math.cos(ang)*outerR,oy=cy+Math.sin(ang)*outerR,inBlank=it.displayInputs?.[j]==null,outBlank=it.displayOutputs?.[j]==null,input=answers?it.inputs[j]:it.displayInputs?.[j],out=answers?it.outputs[j]:it.displayOutputs?.[j];page.line(ix,iy,ox,oy,{color:[177,194,196],width:.85});drawCircleNode(page,ix,iy,input,innerNode,{fill:answers&&inBlank?HIT:WHITE,stroke:[140,165,168],color:answers&&inBlank?TEAL:INK,width:.8,fontSize:Math.max(5.5,8*s)});drawCircleNode(page,ox,oy,out,outerNode,{fill:answers&&outBlank?HIT:(out==null?WHITE:[242,250,248]),stroke:[104,158,151],color:answers&&outBlank?TEAL:INK,width:.9,fontSize:Math.max(5.5,8*s)});}drawCircle(page,cx,cy,centreR,{fill:[229,245,241],stroke:[76,132,126],width:1.15});fitDiagramText(page,cx,cy-5.0*s,'RULE',centreR*1.50,Math.max(4.0,5.2*s),{bold:true,color:MUTED});fitDiagramText(page,cx,cy+8.7*s,clean(it.rule),centreR*1.48,Math.max(5.5,8.2*s),{bold:true,color:TEAL});});
    }else if(a.style==='factor'){
      const cols=a.items.length>=5?3:a.items.length<=3?Math.min(3,a.items.length):2,rows=Math.ceil(a.items.length/cols),slotW=(w-30-(cols-1)*10)/cols,slotH=(bodyH-(rows-1)*10)/rows;
      a.items.forEach((it,i)=>{
        const r=Math.floor(i/cols),c=i%cols,cx=x+15+c*(slotW+10)+slotW/2,cy=bodyY+r*(slotH+10)+slotH/2,size=Math.max(120,Math.min(slotW*.96,slotH*1.25,170)),sc=size/220,pairs=it.pairs||[],shown=it.displayPairs||pairs.map(()=>[null,null]),n=Math.max(3,pairs.length),pairRX=82*sc,pairRY=72*sc,centreR=30*sc,pairW=72*sc,pairH=29*sc,fieldW=26*sc,opW=16*sc;
        for(let j=0;j<n;j++){
          const ang=-Math.PI/2+j*2*Math.PI/n,px=cx+Math.cos(ang)*pairRX,py=cy+Math.sin(ang)*pairRY,dx=px-cx,dy=py-cy,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,source=answers&&pairs[j]?pairs[j]:(shown[j]||[null,null]),left=source?.[0],right=source?.[1],leftFill=answers&&shown[j]?.[0]==null,rightFill=answers&&shown[j]?.[1]==null,halfW=pairW/2,halfH=pairH/2,tx=Math.abs(ux)>1e-9?halfW/Math.abs(ux):Infinity,ty=Math.abs(uy)>1e-9?halfH/Math.abs(uy):Infinity,t=Math.min(tx,ty)+1.3*sc,startX=cx+ux*(centreR+2*sc),startY=cy+uy*(centreR+2*sc),endX=px-ux*t,endY=py-uy*t,capsuleX=px-halfW,capsuleY=py-halfH;
          page.line(startX,startY,endX,endY,{color:[187,202,204],width:.8});
          drawRoundRect(page,capsuleX,capsuleY,pairW,pairH,Math.min(9*sc,pairH*.35),{fill:WHITE,stroke:[120,148,152],width:.9});
          if(leftFill)drawRoundRect(page,capsuleX+1*sc,capsuleY+1*sc,fieldW,pairH-2*sc,Math.min(8*sc,pairH*.32),{fill:HIT,stroke:HIT,width:0});
          if(rightFill)drawRoundRect(page,capsuleX+pairW-fieldW-1*sc,capsuleY+1*sc,fieldW,pairH-2*sc,Math.min(8*sc,pairH*.32),{fill:HIT,stroke:HIT,width:0});
          page.line(px-opW/2,capsuleY+4*sc,px-opW/2,capsuleY+pairH-4*sc,{color:[213,224,225],width:.55});
          page.line(px+opW/2,capsuleY+4*sc,px+opW/2,capsuleY+pairH-4*sc,{color:[213,224,225],width:.55});
          const fs=Math.max(5.8,8.0*sc),leftX=capsuleX+fieldW/2+1*sc,rightX=capsuleX+pairW-fieldW/2-1*sc;
          if(left!=null)diagramText(page,leftX,py+fs*.36,formatNumber(left),fs,{bold:true,color:leftFill?TEAL:INK});
          diagramText(page,px,py+fs*.34,'x',Math.max(5.4,7.6*sc),{bold:true,color:MUTED});
          if(right!=null)diagramText(page,rightX,py+fs*.36,formatNumber(right),fs,{bold:true,color:rightFill?TEAL:INK});
        }
        const centre=answers?it.centre:it.displayCentre,centreFill=answers&&it.displayCentre==null,labelFs=Math.max(3.8,4.8*sc),valueFs=Math.max(7.2,10.2*sc);drawCircle(page,cx,cy,centreR,{fill:centreFill?HIT:[229,245,241],stroke:[76,132,126],width:1.15});fitDiagramText(page,cx,cy-4.1*sc,'FACTOR PAIRS',centreR*1.62,labelFs,{bold:true,color:MUTED});if(centre!=null)fitDiagramText(page,cx,cy+9.5*sc,formatNumber(centre),centreR*1.35,valueFs,{bold:true,color:centreFill?TEAL:INK});
      });
    }else{
      const cols=a.items.length<=4?2:3,rows=Math.ceil(a.items.length/cols),slotW=(w-34-(cols-1)*9)/cols,slotH=(bodyH-(rows-1)*10)/rows;
      a.items.forEach((it,i)=>{const r=Math.floor(i/cols),c=i%cols,cx=x+17+c*(slotW+9)+slotW/2,cy=bodyY+r*(slotH+10)+slotH/2,size=Math.max(76,Math.min(slotW*.80,slotH*.92,142)),sc=size/160,rx=52*sc,ry=52*sc,nodeR=16*sc,hidden=new Set(it.hidden||[]);page.line(cx,cy-ry,cx+rx,cy,{color:[122,146,151],width:1.1});page.line(cx+rx,cy,cx,cy+ry,{color:[122,146,151],width:1.1});page.line(cx,cy+ry,cx-rx,cy,{color:[122,146,151],width:1.1});page.line(cx-rx,cy,cx,cy-ry,{color:[122,146,151],width:1.1});for(const [key,nx,ny] of [['top',cx,cy-ry],['left',cx-rx,cy],['right',cx+rx,cy],['bottom',cx,cy+ry]]){const answerFill=answers&&hidden.has(key),value=answers?it[key]:(hidden.has(key)?null:it[key]);drawCircleNode(page,nx,ny,value,nodeR,{fill:answerFill?HIT:WHITE,stroke:[101,132,136],color:answerFill?TEAL:INK,bold:true,width:1,fontSize:Math.max(5.8,9*sc)});}const labFs=Math.max(3.3,5*sc);diagramText(page,cx,cy-ry-nodeR-4*sc,'PRODUCT',labFs,{bold:true,color:MUTED});diagramText(page,cx,cy+ry+nodeR+7*sc,'SUM',labFs,{bold:true,color:MUTED});});
    }
  }

  function drawFunctionMachine(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7.2,{color:MUTED,maxLines:2});const rule=a.operations.map(o=>`${o.op} ${o.value}`).join(' -> ');page.text(x+w/2,top+36,clean(`INPUT -> ${rule} -> OUTPUT`),9.6,{bold:true,color:TEAL,align:'center'});const tableW=Math.min(300,w*.70),tx=x+w/2-tableW/2,ty=top+53,rowH=Math.min(32,(h-(ty-y)-12)/(a.rows.length+1));page.rect(tx,ty,tableW,rowH,{fill:[240,247,246],stroke:[167,188,190],width:.6});page.text(tx+tableW*.25,ty+rowH*.65,'Input',8.8,{bold:true,color:DARK,align:'center'});page.text(tx+tableW*.75,ty+rowH*.65,'Output',8.8,{bold:true,color:DARK,align:'center'});page.line(tx+tableW/2,ty,tx+tableW/2,ty+rowH*(a.rows.length+1),{color:[167,188,190],width:.6});for(let i=0;i<a.rows.length;i++){const r=a.rows[i],cy=ty+rowH*(i+1),inFill=answers&&r.hide==='input',outFill=answers&&r.hide==='output';page.rect(tx,cy,tableW/2,rowH,{fill:inFill?HIT:WHITE,stroke:[195,210,212],width:.45});page.rect(tx+tableW/2,cy,tableW/2,rowH,{fill:outFill?HIT:WHITE,stroke:[195,210,212],width:.45});page.text(tx+tableW*.25,cy+rowH*.65,answers||r.hide!=='input'?formatNumber(r.input):'____',8.8,{bold:inFill,color:inFill?TEAL:INK,align:'center'});page.text(tx+tableW*.75,cy+rowH*.65,answers||r.hide!=='output'?formatNumber(r.output):'____',8.8,{bold:outFill,color:outFill?TEAL:INK,align:'center'});}}

  function drawBalance(page,a,answers,x,y,w,h,index){
    const paper=a.paper||{},rows=paper.rows||a.rows||[],f=paper.finalChallenge||a.finalChallenge||{},labels='ABCDEFGHIJKLMNOPQRSTUVWXYZ',label=i=>rows[i]?.weightLabel||labels[i]||String(i+1),top=activityFrame(page,x,y,w,h,index,{...a,title:'Balance Lab'});
    drawWrapped(page,x+12,top,'Find the value of each weight so both sides of every equation are equal.',w-24,6.2,{color:MUTED,maxLines:1});
    function token(tx,ty,tw,th,lab,value,filled){drawRoundRect(page,tx,ty,tw,th,5,{fill:filled?HIT:WHITE,stroke:[22,139,130],width:.85});drawCircle(page,tx+11,ty+th/2,7.2,{fill:[22,139,130],stroke:[22,139,130],width:.5});diagramText(page,tx+11,ty+th/2+2.1,lab,5.4,{bold:true,color:WHITE});if(filled)diagramText(page,tx+tw-14,ty+th/2+2.4,formatNumber(value),6.4,{bold:true,color:[15,111,104]});else page.line(tx+23,ty+th/2+2,tx+tw-7,ty+th/2+2,{color:[110,134,137],width:.55});}
    const cols=2,gapX=7,gapY=6,bodyY=top+25,cardW=(w-30-gapX)/2,cardH=Math.max(37,Math.min(44,(h-178)/2));
    rows.slice(0,4).forEach((r,i)=>{const rr=Math.floor(i/2),cc=i%2,cx=x+15+cc*(cardW+gapX),cy=bodyY+rr*(cardH+gapY),shown=r.display,needle='□',pos=shown.indexOf(needle),before=pos>=0?shown.slice(0,pos):shown,after=pos>=0?shown.slice(pos+needle.length):'',fs=7.2,preW=diagramTextWidth(before,fs,true),postW=diagramTextWidth(after,fs,true),tw=44,eqGap=5,totalW=preW+postW+tw+eqGap*2,start=cx+cardW/2-totalW/2,baseline=cy+cardH*.62;drawRoundRect(page,cx,cy,cardW,cardH,6,{fill:WHITE,stroke:[207,224,223],width:.65});page.text(cx+7,cy+10,`WEIGHT ${label(i)}`,4.8,{bold:true,color:MUTED});if(before)page.text(start,baseline,clean(before),fs,{bold:true,color:INK});const tx=start+preW+eqGap;token(tx,baseline-13,tw,22,label(i),r.answer,answers);if(after)page.text(tx+tw+eqGap,baseline,clean(after),fs,{bold:true,color:INK});});
    const resultY=bodyY+2*(cardH+gapY)+1,resultH=29;drawRoundRect(page,x+15,resultY,w-30,resultH,6,{fill:[240,248,246],stroke:[205,222,220],width:.6});page.text(x+25,resultY+18,'YOUR WEIGHTS',4.8,{bold:true,color:MUTED});const resultStart=x+100,resultGap=7,resultW=(w-130-resultGap*3)/4;rows.slice(0,4).forEach((r,i)=>token(resultStart+i*(resultW+resultGap),resultY+4,resultW,21,label(i),r.answer,answers));
    const fy=resultY+resultH+7,fh=y+h-fy-9;drawRoundRect(page,x+15,fy,w-30,fh,7,{fill:[245,250,249],stroke:[166,194,191],width:.75});page.text(x+25,fy+13,answers?'FINAL BALANCE - EXAMPLE SOLUTION':'FINAL BALANCE',5.2,{bold:true,color:[15,111,104]});drawWrapped(page,x+25,fy+25,'Use A, B, C and D exactly once. Put two weights on each side, then make the totals match.',w-50,5.0,{color:DARK,maxLines:1,compact:true});
    const centre=x+w/2,beamY=fy+43,beamHalf=Math.min(78,w*.195),panW=Math.min(145,(w-92)/2),panY=fy+54,panH=Math.max(36,fh-62);page.line(centre-beamHalf,beamY,centre+beamHalf,beamY,{color:[100,132,135],width:2.8});rawPath(page,[`${pdfN(centre)} ${pdfN(page.height-(beamY+1))} m`,`${pdfN(centre-14)} ${pdfN(page.height-(fy+fh-7))} l`,`${pdfN(centre+14)} ${pdfN(page.height-(fy+fh-7))} l`,'h'],{fill:[100,132,135],stroke:[100,132,135],width:.5});drawCircle(page,centre,beamY,3.7,{fill:WHITE,stroke:[100,132,135],width:.8});
    function drawPan(px,side){
      const items=rows.map((r,i)=>({r,i})).filter(z=>f.solutionSides?.[z.i]===side),pcx=px+panW/2,anchor=side==='L'?centre-beamHalf:centre+beamHalf,totalBandH=14,totalLineY=panY+panH-totalBandH,slotGap=7,slotW=(panW-31-slotGap)/2,slotH=Math.min(20,Math.max(16,totalLineY-panY-17)),slotY=panY+13,slotStart=px+12;
      page.line(anchor,beamY,pcx,panY,{color:[129,157,160],width:.7});drawRoundRect(page,px,panY,panW,panH,8,{fill:WHITE,stroke:[144,178,174],width:.8});page.text(px+8,panY+10,side==='L'?'LEFT':'RIGHT',4.3,{bold:true,color:MUTED});
      for(let j=0;j<2;j++){const sx=slotStart+j*(slotW+slotGap);if(answers&&items[j])token(sx,slotY,slotW,slotH,label(items[j].i),items[j].r.answer,true);else drawRoundRect(page,sx,slotY,slotW,slotH,5,{fill:WHITE,stroke:[159,188,184],width:.65});}
      page.line(px+7,totalLineY,px+panW-7,totalLineY,{color:[207,220,222],width:.6});page.text(px+9,totalLineY+10,'TOTAL',4.4,{bold:true,color:MUTED});if(answers)page.text(px+panW-10,totalLineY+10,formatNumber(f.target),5.2,{bold:true,color:[15,111,104],align:'right'});else page.line(px+46,totalLineY+8,px+panW-10,totalLineY+8,{color:[110,134,137],width:.55});
    }
    drawPan(x+22,'L');drawPan(x+w-22-panW,'R');drawRoundRect(page,centre-18,panY+10,36,22,10,{fill:WHITE,stroke:[144,178,174],width:.7});diagramText(page,centre,panY+25,'=',8.5,{bold:true,color:[15,111,104]});
  }


  function drawKakuro(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});const n=a.size,bodyTop=top+27,availH=h-(bodyTop-y)-14,cell=Math.min((w-72)/n,availH/n,n>=9?38:43),gw=cell*n,sx=x+w/2-gw/2,sy=bodyTop+Math.max(0,(availH-gw)/2),given=new Map((a.givens||[]).map(g=>[`${g.r}:${g.c}`,g.v])),BLOCK=[52,76,82],CLUE=[247,250,250];
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){const cx=sx+c*cell,cy=sy+r*cell,key=`${r}:${c}`;if(a.mask[r][c]){const answerFill=answers&&!given.has(key);page.rect(cx,cy,cell,cell,{fill:answerFill?HIT:WHITE,stroke:[112,135,139],width:.55});const v=answers?a.solutionGrid[r][c]:given.get(key);if(v)diagramText(page,cx+cell/2,cy+cell*.66,String(v),Math.min(10,cell*.34),{bold:answerFill,color:answerFill?TEAL:INK});}else{const clue=a.clueCells?.[key]||{},has=clue.across||clue.down;page.rect(cx,cy,cell,cell,{fill:BLOCK,stroke:BLOCK,width:.45});if(has){page.line(cx,cy,cx+cell,cy+cell,{color:[232,240,241],width:.55});const fs=Math.max(3.6,Math.min(6.2,cell*.16));if(clue.across)page.text(cx+cell-2.5,cy+fs+2,String(clue.across),fs,{bold:true,color:WHITE,align:'right'});if(clue.down)page.text(cx+2.5,cy+cell-3,String(clue.down),fs,{bold:true,color:WHITE});}}}
  }
  function drawInequalityGlyph(page,cx,cy,sign,size=8){
    const h=size/2,w=size*.55,color=[47,89,96],lw=.9;
    if(sign==='<'){page.line(cx+w,cy-h,cx-w,cy,{color,width:lw});page.line(cx-w,cy,cx+w,cy+h,{color,width:lw});}
    else if(sign==='>'){page.line(cx-w,cy-h,cx+w,cy,{color,width:lw});page.line(cx+w,cy,cx-w,cy+h,{color,width:lw});}
    else if(sign==='^'){page.line(cx-w,cy+h,cx,cy-h,{color,width:lw});page.line(cx,cy-h,cx+w,cy+h,{color,width:lw});}
    else if(sign==='v'){page.line(cx-w,cy-h,cx,cy+h,{color,width:lw});page.line(cx,cy+h,cx+w,cy-h,{color,width:lw});}
  }

  function drawFutoshiki(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});const n=a.size,bodyTop=top+27,availH=h-(bodyTop-y)-14,gap=Math.min(15,Math.max(9,(Math.min(w-80,availH)-n*34)/(n-1))),cell=Math.min(40,(w-80-gap*(n-1))/n,(availH-gap*(n-1))/n),gw=n*cell+(n-1)*gap,sx=x+w/2-gw/2,sy=bodyTop+Math.max(0,(availH-gw)/2);for(let r=0;r<n;r++)for(let c=0;c<n;c++){const cx=sx+c*(cell+gap),cy=sy+r*(cell+gap),given=!!a.displayGrid[r][c],answerFill=answers&&!given,v=answers?a.solutionGrid[r][c]:a.displayGrid[r][c];page.rect(cx,cy,cell,cell,{fill:answerFill?HIT:WHITE,stroke:[115,139,143],width:.7});if(v)page.text(cx+cell/2,cy+cell*.67,String(v),Math.min(10,cell*.34),{bold:answerFill,color:answerFill?TEAL:INK,align:'center'});if(c<n-1){const sign=a.hSigns[r]?.[c];if(sign)drawInequalityGlyph(page,cx+cell+gap/2,cy+cell/2,sign,Math.min(9,gap*.72));}if(r<n-1){const sign=a.vSigns[r]?.[c];if(sign)drawInequalityGlyph(page,cx+cell/2,cy+cell+gap/2,sign,Math.min(9,gap*.72));}}
  }

  function drawArithmeticCages(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});const n=a.size,bodyTop=top+27,availH=h-(bodyTop-y)-14,cell=Math.min((w-90)/n,availH/n,46),gw=cell*n,sx=x+w/2-gw/2,sy=bodyTop+Math.max(0,(availH-gw)/2),cageAt=new Map();(a.cages||[]).forEach((cg,i)=>cg.cells.forEach(([r,c])=>cageAt.set(`${r}:${c}`,i)));const first=new Map();(a.cages||[]).forEach((cg,i)=>{const sorted=cg.cells.slice().sort((u,v)=>u[0]-v[0]||u[1]-v[1]);first.set(i,sorted[0].join(':'));});for(let r=0;r<n;r++)for(let c=0;c<n;c++){const cx=sx+c*cell,cy=sy+r*cell,ci=cageAt.get(`${r}:${c}`),cg=a.cages[ci];page.rect(cx,cy,cell,cell,{fill:answers?HIT:WHITE,stroke:[170,186,189],width:.55});if(first.get(ci)===`${r}:${c}`){const lab=`${formatNumber(cg.target)}${cg.op==='='?'':cg.op}`;page.text(cx+2.5,cy+7,clean(lab),Math.max(4.3,cell*.14),{bold:true,color:DARK});}if(answers)page.text(cx+cell/2,cy+cell*.67,String(a.solutionGrid[r][c]),Math.min(10,cell*.33),{bold:true,color:TEAL,align:'center'});const topB=r===0||cageAt.get(`${r-1}:${c}`)!==ci,leftB=c===0||cageAt.get(`${r}:${c-1}`)!==ci,rightB=c===n-1||cageAt.get(`${r}:${c+1}`)!==ci,bottomB=r===n-1||cageAt.get(`${r+1}:${c}`)!==ci;if(topB)page.line(cx,cy,cx+cell,cy,{color:[68,91,96],width:1.35});if(leftB)page.line(cx,cy,cx,cy+cell,{color:[68,91,96],width:1.35});if(rightB)page.line(cx+cell,cy,cx+cell,cy+cell,{color:[68,91,96],width:1.35});if(bottomB)page.line(cx,cy+cell,cx+cell,cy+cell,{color:[68,91,96],width:1.35});}
  }

  function drawNonogram(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});const n=a.size,bodyTop=top+28,availH=h-(bodyTop-y)-14,maxR=Math.max(...a.rowClues.map(c=>c.length)),maxC=Math.max(...a.colClues.map(c=>c.length)),cell=Math.min((w-100)/(n+maxR),availH/(n+maxC),30),gx=x+w/2-(n*cell)/2+maxR*cell*.15,gy=bodyTop+maxC*cell+Math.max(0,(availH-(n+maxC)*cell)/2);for(let r=0;r<n;r++){const clues=a.rowClues[r].filter(v=>v!==0),txt=clues.join(' '),fs=Math.max(5.2,Math.min(7.2,cell*.42));fitText(page,gx-6,gy+r*cell+cell*.68,txt,maxR*cell-8,fs,{bold:true,color:DARK,align:'right'});}for(let c=0;c<n;c++){const clues=a.colClues[c].filter(v=>v!==0),fs=Math.max(5.2,Math.min(7.2,cell*.40));clues.slice().reverse().forEach((v,k)=>page.text(gx+c*cell+cell/2,gy-(k+.34)*cell,String(v),fs,{bold:true,color:DARK,align:'center'}));}for(let r=0;r<n;r++)for(let c=0;c<n;c++){const fill=answers&&a.solutionGrid[r][c],cx=gx+c*cell,cy=gy+r*cell;page.rect(cx,cy,cell,cell,{fill:fill?[62,81,86]:WHITE,stroke:[135,155,159],width:.62});if(c>0&&c%5===0)page.line(cx,gy,cx,gy+n*cell,{color:[76,103,109],width:1.25});if(r>0&&r%5===0)page.line(gx,cy,gx+n*cell,cy,{color:[76,103,109],width:1.25});}page.rect(gx,gy,n*cell,n*cell,{fill:null,stroke:[76,103,109],width:1.05});
  }

  function drawNumberPath(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});const n=a.size,bodyTop=top+27,availH=h-(bodyTop-y)-14,cell=Math.min((w-90)/n,availH/n,48),gw=cell*n,sx=x+w/2-gw/2,sy=bodyTop+Math.max(0,(availH-gw)/2);for(let r=0;r<n;r++)for(let c=0;c<n;c++){const cx=sx+c*cell,cy=sy+r*cell,given=!!a.displayGrid[r][c],answerFill=answers&&!given,v=answers?a.solutionGrid[r][c]:a.displayGrid[r][c];page.rect(cx,cy,cell,cell,{fill:answerFill?HIT:WHITE,stroke:[148,168,171],width:.55});if(v)page.text(cx+cell/2,cy+cell*.66,String(v),Math.min(10,cell*.32),{bold:answerFill,color:answerFill?TEAL:(v===1||v===n*n?TEAL:INK),align:'center'});}
  }

  function drawSumplete(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);
    drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});
    const n=a.size,bodyTop=top+31,availH=h-(bodyTop-y)-14,cell=Math.min((w-88)/(n+1),availH/(n+1),45),gw=cell*(n+1),sx=x+w/2-gw/2,sy=bodyTop+Math.max(0,(availH-gw)/2);
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const cx=sx+c*cell,cy=sy+r*cell,keep=!!a.solutionMask?.[r]?.[c],fill=answers&&keep?HIT:WHITE;
      page.rect(cx,cy,cell,cell,{fill,stroke:[148,168,171],width:.6});
      const v=formatNumber(a.valueGrid?.[r]?.[c]);
      diagramText(page,cx+cell/2,cy+cell*.64,v,Math.max(6,Math.min(10,cell*.28)),{bold:answers&&keep,color:answers&&!keep?[145,155,158]:answers&&keep?TEAL:INK});
      if(answers&&!keep){page.line(cx+cell*.18,cy+cell*.20,cx+cell*.82,cy+cell*.80,{color:[158,102,94],width:1});page.line(cx+cell*.82,cy+cell*.20,cx+cell*.18,cy+cell*.80,{color:[158,102,94],width:1});}
    }
    for(let r=0;r<n;r++){
      const cx=sx+n*cell,cy=sy+r*cell;page.rect(cx,cy,cell,cell,{fill:PALE,stroke:[111,150,146],width:.75});fitDiagramText(page,cx+cell/2,cy+cell*.64,formatNumber(a.rowTargets?.[r]),cell-5,Math.max(6,Math.min(10,cell*.27)),{bold:true,color:TEAL});
    }
    for(let c=0;c<n;c++){
      const cx=sx+c*cell,cy=sy+n*cell;page.rect(cx,cy,cell,cell,{fill:PALE,stroke:[111,150,146],width:.75});fitDiagramText(page,cx+cell/2,cy+cell*.64,formatNumber(a.colTargets?.[c]),cell-5,Math.max(6,Math.min(10,cell*.27)),{bold:true,color:TEAL});
    }
    const cx=sx+n*cell,cy=sy+n*cell;page.rect(cx,cy,cell,cell,{fill:[232,243,241],stroke:[111,150,146],width:.75});diagramText(page,cx+cell/2,cy+cell*.61,'SUM',Math.max(4.5,Math.min(6.8,cell*.18)),{bold:true,color:DARK});
  }


  function drawColourLogic(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a),bodyY=top+24;
    drawWrapped(page,x+12,top,a.instruction,w-24,6.6,{color:MUTED,maxLines:1});
    const keyY=y+h-28,key=(a.colors||[]).map(c=>`${c.id}=${c.name}`).join('   ');fitText(page,x+w/2,keyY,key,w-34,5.6,{bold:true,color:MUTED,align:'center',compact:true});
    if(a.variant==='row'){
      const n=a.solution.length,cell=Math.min(48,(w-80)/n),gx=x+w/2-n*cell/2,gy=bodyY+8;for(let i=0;i<n;i++){drawRoundRect(page,gx+i*cell,gy,cell-5,cell-5,6,{fill:WHITE,stroke:[126,157,158],width:.8});page.text(gx+i*cell+(cell-5)/2,gy+12,String(i+1),4.8,{bold:true,color:MUTED,align:'center'});if(answers)diagramText(page,gx+i*cell+(cell-5)/2,gy+(cell-5)*.66,a.solution[i],9,{bold:true,color:TEAL});}
      let cy=gy+cell+4;for(let i=0;i<a.clues.length;i++){cy+=drawWrapped(page,x+24,cy,`${i+1}. ${a.clues[i].text}`,w-48,5.8,{color:DARK,maxLines:1,compact:true})+2;}
    }else{
      const n=a.size,cell=Math.min(42,(w*.42)/n,(h-92)/n),gw=n*cell,gx=x+18,gy=bodyY+5;for(let r=0;r<n;r++)for(let c=0;c<n;c++){page.rect(gx+c*cell,gy+r*cell,cell,cell,{fill:WHITE,stroke:[126,157,158],width:.7});if(answers)diagramText(page,gx+c*cell+cell/2,gy+r*cell+cell*.65,a.solutionGrid[r][c],8.5,{bold:true,color:TEAL});}let cy=gy,rx=gx+gw+17,rw=x+w-18-rx;for(let i=0;i<a.clues.length;i++){cy+=drawWrapped(page,rx,cy,`${i+1}. ${a.clues[i].text}`,rw,5.6,{color:DARK,maxLines:2,compact:true})+2;}
    }
  }

  function drawMobileShape(page,id,cx,cy,s){const stroke=[88,111,116];if(id==='circle')return drawCircle(page,cx,cy,s*.46,{fill:[92,135,174],stroke,width:.55});if(id==='square')return page.rect(cx-s*.43,cy-s*.43,s*.86,s*.86,{fill:[219,139,54],stroke,width:.55});if(id==='triangle')return rawPath(page,[`${pdfN(cx)} ${pdfN(page.height-(cy-s*.5))} m`,`${pdfN(cx+s*.5)} ${pdfN(page.height-(cy+s*.43))} l`,`${pdfN(cx-s*.5)} ${pdfN(page.height-(cy+s*.43))} l`,'h'],{fill:[77,153,112],stroke,width:.55});if(id==='diamond')return rawPath(page,[`${pdfN(cx)} ${pdfN(page.height-(cy-s*.52))} m`,`${pdfN(cx+s*.48)} ${pdfN(page.height-cy)} l`,`${pdfN(cx)} ${pdfN(page.height-(cy+s*.52))} l`,`${pdfN(cx-s*.48)} ${pdfN(page.height-cy)} l`,'h'],{fill:[205,91,81],stroke,width:.55});return rawPath(page,[`${pdfN(cx)} ${pdfN(page.height-(cy-s*.52))} m`,`${pdfN(cx+s*.15)} ${pdfN(page.height-(cy-s*.16))} l`,`${pdfN(cx+s*.5)} ${pdfN(page.height-(cy-s*.15))} l`,`${pdfN(cx+s*.23)} ${pdfN(page.height-(cy+s*.07))} l`,`${pdfN(cx+s*.32)} ${pdfN(page.height-(cy+s*.43))} l`,`${pdfN(cx)} ${pdfN(page.height-(cy+s*.22))} l`,`${pdfN(cx-s*.32)} ${pdfN(page.height-(cy+s*.43))} l`,`${pdfN(cx-s*.23)} ${pdfN(page.height-(cy+s*.07))} l`,`${pdfN(cx-s*.5)} ${pdfN(page.height-(cy-s*.15))} l`,`${pdfN(cx-s*.15)} ${pdfN(page.height-(cy-s*.16))} l`,'h'],{fill:[137,93,181],stroke,width:.55});}
  function mobileLeavesPdf(n){return n.type==='group'?1:mobileLeavesPdf(n.left)+mobileLeavesPdf(n.right);}
  function mobileDepthPdf(n){return n.type==='group'?1:1+Math.max(mobileDepthPdf(n.left),mobileDepthPdf(n.right));}
  function drawMobileBalance(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.5,{color:MUTED,maxLines:1});const bodyY=top+23,diagramW=w*.67,dx=x+9,dy=bodyY+3,depth=mobileDepthPdf(a.tree),scaleY=Math.min(45,(h-92)/Math.max(2,depth)),shapeS=Math.min(13,scaleY*.32);
    function rec(n,x0,x1,yy){const cx=(x0+x1)/2;if(n.type==='group'){page.line(cx,yy-6,cx,yy+8+n.count*scaleY*.42,{color:[105,132,135],width:.7});for(let i=0;i<n.count;i++)drawMobileShape(page,n.shape,cx,yy+12+i*scaleY*.42,shapeS);return;}const ll=mobileLeavesPdf(n.left),rr=mobileLeavesPdf(n.right),split=x0+(x1-x0)*ll/(ll+rr),lc=(x0+split)/2,rc=(split+x1)/2;page.line(lc,yy,rc,yy,{color:[84,111,116],width:2.2});drawCircle(page,cx,yy,2.2,{fill:WHITE,stroke:[84,111,116],width:.6});page.line(lc,yy,lc,yy+18,{color:[105,132,135],width:.7});page.line(rc,yy,rc,yy+18,{color:[105,132,135],width:.7});rec(n.left,x0,split,yy+scaleY);rec(n.right,split,x1,yy+scaleY);}const x0=dx+12,x1=dx+diagramW-12;if(a.topTotal!=null){drawCircle(page,(x0+x1)/2,dy+11,11,{fill:WHITE,stroke:[84,111,116],width:.8});diagramText(page,(x0+x1)/2,dy+15,String(a.topTotal),7.4,{bold:true,color:INK});page.line((x0+x1)/2,dy+22,(x0+x1)/2,dy+29,{color:[105,132,135],width:.7});}else page.line((x0+x1)/2,dy+8,(x0+x1)/2,dy+29,{color:[105,132,135],width:.7});rec(a.tree,x0,x1,dy+30);
    const sx=x+diagramW+18,sw=w-diagramW-27;page.text(sx,bodyY+8,'SHAPE VALUES',5.2,{bold:true,color:MUTED});let sy=bodyY+18;for(const id of a.shapeIds){const m=a.shapeMeta[id]||{label:id},given=a.givens?.[id]!=null;drawMobileShape(page,id,sx+10,sy+7,9);fitText(page,sx+24,sy+10,m.label,sw-24,5.5,{bold:true,color:DARK,compact:true});const shown=given||answers?formatNumber(a.values[id]):'________';page.text(sx+sw,sy+10,shown,5.8,{bold:answers&&!given,color:answers&&!given?TEAL:INK,align:'right'});sy+=26;}
  }

  function drawNumberLogicActivity(page,a,answers,x,y,w,h,index){if(a.engineId==='kakuro')return drawKakuro(page,a,answers,x,y,w,h,index);if(a.engineId==='futoshiki')return drawFutoshiki(page,a,answers,x,y,w,h,index);if(a.engineId==='arithmeticcages')return drawArithmeticCages(page,a,answers,x,y,w,h,index);if(a.engineId==='nonogram')return drawNonogram(page,a,answers,x,y,w,h,index);if(a.engineId==='numberpath')return drawNumberPath(page,a,answers,x,y,w,h,index);if(a.engineId==='sumplete')return drawSumplete(page,a,answers,x,y,w,h,index);if(a.engineId==='colourlogic')return drawColourLogic(page,a,answers,x,y,w,h,index);}

  function drawArithmeticActivity(page,a,answers,x,y,w,h,index){if(a.engineId==='arithmagon')return drawArithmagon(page,a,answers,x,y,w,h,index);if(a.engineId==='magicshape')return drawMagicShape(page,a,answers,x,y,w,h,index);if(a.engineId==='maze')return drawMaze(page,a,answers,x,y,w,h,index);if(a.engineId==='propertymaze')return drawPropertyMaze(page,a,answers,x,y,w,h,index);if(a.engineId==='crossnumber')return drawCrossnumber(page,a,answers,x,y,w,h,index);if(a.engineId==='numbersearch')return drawNumberSearch(page,a,answers,x,y,w,h,index);if(a.engineId==='equationcrossgrid')return drawEquationCrossgrid(page,a,answers,x,y,w,h,index);if(a.engineId==='numbertrail')return drawNumberTrail(page,a,answers,x,y,w,h,index);if(a.engineId==='target')return drawTarget(page,a,answers,x,y,w,h,index);if(a.engineId==='brokencalc')return drawBrokenCalc(page,a,answers,x,y,w,h,index);if(a.engineId==='symbols')return drawSymbols(page,a,answers,x,y,w,h,index);if(a.engineId==='domino')return drawDomino(page,a,answers,x,y,w,h,index);if(a.engineId==='operationgrid')return drawOperationGrid(page,a,answers,x,y,w,h,index);if(a.engineId==='numberwheels')return drawNumberWheels(page,a,answers,x,y,w,h,index);if(a.engineId==='functionmachine')return drawFunctionMachine(page,a,answers,x,y,w,h,index);if(a.engineId==='balance')return drawBalance(page,a,answers,x,y,w,h,index);if(a.engineId==='mobilebalance')return drawMobileBalance(page,a,answers,x,y,w,h,index);}

  function drawActivity(page,a,answers,x,y,w,h,index){
    if(a?.error){const top=activityFrame(page,x,y,w,h,index,a||{});drawWrapped(page,x+12,top,clean(a.error),w-24,8,{color:[140,70,60]});return;}
    if(a.engineId==='pyramid')return drawPyramid(page,a,answers,x,y,w,h,index);
    if(a.engineId==='crossword')return drawCrossword(page,a,answers,x,y,w,h,index);
    if(a.engineId==='magic')return drawMagic(page,a,answers,x,y,w,h,index);
    if(a.engineId==='sudoku')return drawSudoku(page,a,answers,x,y,w,h,index);
    if(['arithmagon','magicshape','maze','propertymaze','crossnumber','numbersearch','equationcrossgrid','numbertrail','target','brokencalc','symbols','domino','operationgrid','numberwheels','functionmachine','balance','mobilebalance'].includes(a.engineId))return drawArithmeticActivity(page,a,answers,x,y,w,h,index);
    if(['kakuro','futoshiki','arithmeticcages','nonogram','numberpath','sumplete','colourlogic'].includes(a.engineId))return drawNumberLogicActivity(page,a,answers,x,y,w,h,index);
    return drawWordSearch(page,a,answers,x,y,w,h,index);
  }

  function addSheetPage(doc,sheet,answers,settings,topics,seed){
    const page=doc.addPage({orientation:'portrait'});
    drawPageHeader(page,`${answers?'Teacher answers':'Pupil sheet'} ${sheet.index}`,settings,topics,answers?'Answer key':'Name: ____________________');
    const acts=sheet.activities||[],count=Math.max(1,acts.length),bodyTop=Number(PAGE_GEO.bodyTop)||110,bodyBottom=PAGE_H-(Number(PAGE_GEO.bodyBottom)||42),gap=Number(PAGE_GEO.activityGap)||12,ah=(bodyBottom-bodyTop-gap*(count-1))/count,w=PAGE_W-2*M;
    acts.forEach((a,i)=>drawActivity(page,a,answers,M,bodyTop+i*(ah+gap),w,ah,i+1));
    drawFooter(page,`Generated locally · ${seed}`);
  }

  function drawWorkedExample(page,ex,x,y,w,h){
    box(page,x,y,w,h,[251,253,252],[201,220,218],.8);
    const title=clean(ex.title||'Worked example').replace(/ worked example$/i,'');page.text(x+12,y+21,title,13,{bold:true,color:INK});let cy=y+42;
    if(ex.goal){cy+=drawWrapped(page,x+12,cy,`Goal: ${ex.goal}`,w-24,8.4,{bold:true,color:DARK,maxLines:2})+9;}
    if(ex.kind==='crossword'){
      cy+=drawWrapped(page,x+12,cy,`Clue: ${ex.clue} ${ex.enumeration||enumeration(ex.term)}`,w-24,8.0,{color:DARK,maxLines:2})+8;
      const chars=String(ex.answer||'').split(''),cell=Math.min(22,(w-28)/Math.max(1,chars.length)),sx=x+w/2-chars.length*cell/2;chars.forEach((ch,i)=>{page.rect(sx+i*cell,cy,cell-1,cell-1,{fill:WHITE,stroke:[110,140,140],width:.7});page.text(sx+i*cell+(cell-1)/2,cy+cell*.65,ch,8,{bold:true,color:INK,align:'center'});});cy+=cell+8;
    }else if(ex.kind==='pyramid'){
      const rows=ex.rows||[],maxCols=rows.at(-1)?.length||3,cellW=Math.min(38,(w-40)/maxCols),cellH=23;rows.forEach((row,r)=>{const sw=row.length*cellW,sx=x+w/2-sw/2;row.forEach((n,i)=>{const miss=ex.exampleMissing===`${r}:${i}`;page.rect(sx+i*cellW,cy,cellW-2,cellH-2,{fill:miss?PALE:WHITE,stroke:[110,140,140],width:.7});page.text(sx+i*cellW+(cellW-2)/2,cy+15,miss?'?':String(n),8,{bold:true,color:INK,align:'center'});});cy+=cellH;});cy+=6;
    }else if(ex.kind==='magic'){
      page.text(x+12,cy,`Magic total: ${formatNumber(ex.magicSum)}`,8.2,{bold:true,color:TEAL});cy+=8;const g=drawMagicGrid(page,ex.displayGrid,x+w/2-82,cy,164,98,{maxCell:32,questionMarks:true});cy+=g.h+7;
    }else if(ex.kind==='sudoku'){
      const g=drawSudokuGrid(page,ex.displayGrid,ex.solutionGrid,false,ex.style,ex.boxRows,ex.boxCols,x+w/2-78,cy,156,102,{maxCell:25});cy+=g.h+7;
    }else if(ex.kind==='kakuro'){
      const cell=28,sx=x+w/2-cell*1.5;page.rect(sx,cy,cell,cell,{fill:[246,249,249],stroke:[110,137,142],width:.7});page.text(sx+cell/2,cy+17,'4',8,{bold:true,color:DARK,align:'center'});for(let i=0;i<2;i++){page.rect(sx+(i+1)*cell,cy,cell,cell,{fill:WHITE,stroke:[110,137,142],width:.7});page.text(sx+(i+1)*cell+cell/2,cy+18,String(i===0?1:3),10,{bold:true,color:INK,align:'center'});}cy+=cell+5;cy+=drawWrapped(page,x+12,cy,'A two-cell run totalling 4 uses two different digits: 1 and 3.',w-24,7.2,{color:MUTED,maxLines:2})+6;
    }else if(ex.kind==='futoshiki'){
      const cell=25,gap=15,total=4*cell+3*gap,sx=x+w/2-total/2;for(let i=0;i<4;i++){const cx=sx+i*(cell+gap);page.rect(cx,cy,cell,cell,{fill:WHITE,stroke:[110,137,142],width:.7});page.text(cx+cell/2,cy+17,String(i+1),9,{bold:true,color:INK,align:'center'});if(i<3)drawInequalityGlyph(page,cx+cell+gap/2,cy+cell/2,'<',8);}cy+=cell+10;cy+=drawWrapped(page,x+12,cy,'The point faces the smaller number; rows and columns still use each number once.',w-24,7.2,{color:MUTED,maxLines:2})+6;
    }else if(ex.kind==='arithmeticcages'){
      const cell=32,sx=x+w/2-cell;page.rect(sx,cy,cell*2,cell,{fill:WHITE,stroke:[68,91,96],width:1.5});page.line(sx+cell,cy,sx+cell,cy+cell,{color:[190,203,205],width:.5});page.text(sx+3,cy+8,'6x',5.8,{bold:true,color:DARK});page.text(sx+cell/2,cy+21,'2',9,{bold:true,color:INK,align:'center'});page.text(sx+cell*1.5,cy+21,'3',9,{bold:true,color:INK,align:'center'});cy+=cell+5;cy+=drawWrapped(page,x+12,cy,'This cage makes 6 because 2 x 3 = 6.',w-24,7.2,{color:MUTED,maxLines:2})+6;
    }else if(ex.kind==='nonogram'){
      const cell=22,sx=x+w/2-(5*cell+34)/2;page.text(sx+27,cy+15,'2 1',7.5,{bold:true,color:DARK,align:'right'});for(let i=0;i<5;i++)page.rect(sx+34+i*cell,cy,cell,cell,{fill:[0,1,3].includes(i)?[62,81,86]:WHITE,stroke:[120,145,149],width:.65});cy+=cell+5;cy+=drawWrapped(page,x+12,cy,'Clue 2 1 means two shaded cells, at least one gap, then one shaded cell.',w-24,7.2,{color:MUTED,maxLines:2})+6;
    }else if(ex.kind==='numberpath'){
      const vals=[1,2,3,6,5,4,7,8,9],cell=22,sx=x+w/2-cell*1.5;for(let r=0;r<3;r++)for(let c=0;c<3;c++){const v=vals[r*3+c];page.rect(sx+c*cell,cy+r*cell,cell,cell,{fill:WHITE,stroke:[120,145,149],width:.65});page.text(sx+c*cell+cell/2,cy+r*cell+15,String(v),7.5,{bold:true,color:(v===1||v===9)?TEAL:INK,align:'center'});}cy+=cell*3+5;cy+=drawWrapped(page,x+12,cy,'The sequence winds through edge-touching cells: 1, 2, 3, 4 ... 9.',w-24,7.2,{color:MUTED,maxLines:2})+6;
    }else if(['arithmagon','magicshape','maze','propertymaze','crossnumber','numbersearch','equationcrossgrid','numbertrail','target','brokencalc','symbols','domino','operationgrid','numberwheels','functionmachine','balance'].includes(ex.kind)){
      box(page,x+12,cy,w-24,26,[243,250,248],[211,231,227],.6);page.text(x+20,cy+11,clean(ex.title||'Worked example').replace(/ worked example$/i,''),7.7,{bold:true,color:[40,93,89]});page.text(x+20,cy+22,'Follow the worked steps below, then try the generated activity.',6.8,{color:MUTED});cy+=36;
    }else if(ex.kind==='wordsearch'){
      const intro=ex.mode==='definitions'?`Definition: ${ex.definition||''}${needsEnumeration(ex.term)?` ${ex.enumeration||enumeration(ex.term)}`:''}`:`${ex.term||''} - ${ex.definition||''}`;cy+=drawWrapped(page,x+12,cy,intro,w-24,8.0,{color:DARK,maxLines:2})+8;
      const size=ex.size||5,cell=Math.min(20,(w-50)/size,92/size),sx=x+w/2-size*cell/2;for(let gy=0;gy<size;gy++)for(let gx=0;gx<size;gx++){const hit=gy===ex.row&&gx>=ex.start&&gx<ex.start+String(ex.answer||'').length;page.rect(sx+gx*cell,cy+gy*cell,cell,cell,{fill:hit?HIT:WHITE,stroke:[190,206,208],width:.4});page.text(sx+gx*cell+cell/2,cy+gy*cell+cell*.68,ex.grid?.[gy]?.[gx]||'',Math.max(3.8,cell*.42),{bold:true,color:INK,align:'center'});}cy+=size*cell+6;
    }else{
      box(page,x+12,cy,w-24,34,[243,250,248],[211,231,227],.6);
      page.text(x+20,cy+14,clean(ex.title||'Worked example').replace(/ worked example$/i,''),7.8,{bold:true,color:[40,93,89]});
      page.text(x+20,cy+27,'Use the rules and worked steps below.',7.0,{color:MUTED});
      cy+=42;
    }
    if(ex.rules?.length){page.text(x+12,cy,'Rules',8.2,{bold:true,color:[46,87,86]});cy+=12;for(const rule of ex.rules){cy+=drawWrapped(page,x+17,cy,`- ${rule}`,w-30,7.4,{color:DARK,maxLines:2})+3;if(cy>y+h-100)break;}cy+=3;}
    if(ex.steps?.length&&cy<y+h-70){page.text(x+12,cy,'Worked steps',8.2,{bold:true,color:[46,87,86]});cy+=12;for(let i=0;i<ex.steps.length;i++){cy+=drawWrapped(page,x+17,cy,`${i+1}. ${ex.steps[i]}`,w-30,7.4,{color:DARK,maxLines:2})+3;if(cy>y+h-60)break;}cy+=3;}
    if(ex.tip&&cy<y+h-35){cy+=drawWrapped(page,x+12,cy,`Tip: ${ex.tip}`,w-24,7.2,{bold:true,color:TEAL,maxLines:2})+3;}
    if(ex.commonMistake&&cy<y+h-18)drawWrapped(page,x+12,cy,`Watch out: ${ex.commonMistake}`,w-24,7.0,{bold:true,color:[130,84,60],maxLines:2});
  }

  function addWorkedPages(doc,examples,settings,topics){
    if(!examples?.length)return;const perPage=2,totalPages=Math.ceil(examples.length/perPage);
    for(let start=0,pageNo=0;start<examples.length;start+=perPage,pageNo++){
      const chunk=examples.slice(start,start+perPage),page=doc.addPage({orientation:'portrait'});drawPageHeader(page,totalPages>1?`Worked examples ${pageNo+1}`:'Worked examples',settings,topics,'Read these before you begin');
      const gap=14,bodyTop=112,bodyBottom=PAGE_H-42,w=PAGE_W-2*M,h=(bodyBottom-bodyTop-gap*(chunk.length-1))/chunk.length;chunk.forEach((ex,i)=>drawWorkedExample(page,ex,M,bodyTop+i*(h+gap),w,h));drawFooter(page,'Worked examples use separate practice data');
    }
  }

  function buildDocument(opts={}){
    const pack=opts.pack||{},settings=opts.settings||{},kind=['student','answers','both'].includes(opts.kind)?opts.kind:'student',topics=opts.topics||{},seed=opts.seed||pack.seed||'GAMES';
    const doc=new P.PDFDocument(),personal=settings.personalisation||{};
    if(personal.logoDataUrl)doc.setJpeg(personal.logoDataUrl,personal.logoWidth||1,personal.logoHeight||1,'gamesLogo');
    if(kind==='student'||kind==='both'){
      if(settings.workedExamples==='front'&&pack.workedExamples?.length)addWorkedPages(doc,pack.workedExamples,settings,topics);
      for(const sheet of pack.sheets||[])addSheetPage(doc,sheet,false,settings,topics,seed);
    }
    if(kind==='answers'||kind==='both')for(const sheet of pack.sheets||[])addSheetPage(doc,sheet,true,settings,topics,seed);
    return doc;
  }
  function filename(settings,kind){
    const k=kind==='answers'?'answer-key':kind==='both'?'pupil-and-answers':'pupil-sheets',yr=settings.minYear===settings.maxYear?`y${settings.minYear}`:`y${settings.minYear}-${settings.maxYear}`;
    const title=safeName(settings.personalisation?.packTitle||'maths-games-puzzles');return `99-club-${title}-${yr}-${safeName(k)}.pdf`;
  }

  const api={buildDocument,filename,wrap};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.TT99GamesPDF=api;
}(typeof window!=='undefined'?window:globalThis));
