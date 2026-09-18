/* 99 Club Studio - print/PDF layout.
 * Pure layout layer on top of simple-pdf.js; browser and Node friendly.
 * Portrait remains the default; landscape is a separate A4 layout using the same questions/seed.
 */
(function(global){
  'use strict';
  const G = global.TT99Generator || (typeof require !== 'undefined' ? require('./generator.js') : null);
  const P = global.TT99SimplePDF || (typeof require !== 'undefined' ? require('./simple-pdf.js') : null);
  if (!G || !P) throw new Error('99 Club PDF dependencies are missing');

  function normalizeOrientation(value){ return value === 'landscape' ? 'landscape' : 'portrait'; }

  function buildDocument(options){
    const { rules, sheets, school={}, kind='student', qrByVariant=[], badge={}, teacherNote='' } = options;
    const orientation = normalizeOrientation(options.orientation);
    const doc = new P.PDFDocument();
    if (school.logoDataUrl) doc.setJpeg(school.logoDataUrl, school.logoWidth, school.logoHeight, 'logo');
    if (badge.imageDataUrl) doc.setJpeg(badge.imageDataUrl, badge.width, badge.height, 'badge');
    if (kind === 'student' || kind === 'both') sheets.forEach((sheet,i)=>drawPage(doc,rules,sheet,i,school,false,orientation,null,!!badge.imageDataUrl,teacherNote));
    if (kind === 'answers' || kind === 'both') sheets.forEach((sheet,i)=>drawPage(doc,rules,sheet,i,school,true,orientation,qrByVariant[i]||null,!!badge.imageDataUrl,teacherNote));
    return doc;
  }

  function drawPage(doc,rules,sheet,variantIndex,school,answers,orientation='portrait',qrMatrix=null,hasBadge=false,teacherNote=''){
    orientation = normalizeOrientation(orientation);
    const landscape = orientation === 'landscape';
    const page=doc.addPage({orientation}), r=G.normalizeRules(rules), s=school || {};
    const W=landscape ? P.LANDSCAPE_W : P.PAGE_W;
    const ink=[31,41,55], muted=[95,105,120], teal=[15,118,110], pale=[241,247,246], line=[202,211,215];
    const margin=landscape?34:36, right=W-margin;

    const logoBox=landscape?36:43;
    const logoTop=landscape?17:20;
    let identityX=margin;
    if(s.logoDataUrl){
      const ratio=(s.logoWidth||1)/(s.logoHeight||1); let w=logoBox,h=logoBox;
      if(ratio>1)h=logoBox/ratio; else w=logoBox*ratio;
      page.image(margin,logoTop+(logoBox-h)/2,w,h,'logo');
      identityX=margin+logoBox+9;
    }
    const badgeBox=landscape?49:59;
    const badgeX=right-badgeBox-(landscape?4:5);
    const badgeTop=landscape?10:12;
    if(hasBadge) page.image(badgeX,badgeTop,badgeBox,badgeBox,'badge');

    const identityMax=(landscape?270:192)-(identityX-margin);
    const titleRight=hasBadge ? badgeX-15 : right;
    const titleLeft=Math.max(identityX+identityMax+10, margin+(landscape?220:176));
    const titleCenter=(titleLeft+titleRight)/2;

    if(s.schoolName){
      const schoolFit=fitText(s.schoolName,landscape?11.0:10.8,8.4,identityMax,true);
      page.text(identityX,landscape?30:34,schoolFit.text,schoolFit.size,{bold:true,color:ink});
    }
    const metadata=headerMetadata(s);
    if(metadata){
      const metaFit=fitText(metadata,landscape?8.1:7.9,6.7,Math.max(110,identityMax+118),false);
      page.text(identityX,landscape?45:50,metaFit.text,metaFit.size,{color:muted});
    }

    const openWorksheet=r.progressionEnabled===false;
    const worksheetHeading=openWorksheet?String(r.worksheetTitle||'Maths Practice').toUpperCase():'MENTAL MATHS CHALLENGE';
    const titleWidth=Math.max(120,titleRight-titleLeft-8);
    if(answers){
      page.text(titleCenter,landscape?29:33,'ANSWER KEY',landscape?16.8:17.8,{bold:true,align:'center',color:ink});
      const subFit=fitText(worksheetHeading,landscape?7.4:7.5,5.8,titleWidth,true);
      page.text(titleCenter,landscape?43:49,subFit.text,subFit.size,{bold:true,align:'center',color:teal});
    }else{
      const titleFit=fitText(worksheetHeading,landscape?12.1:12.6,7.6,titleWidth,true);
      page.text(titleCenter,landscape?35:39,titleFit.text,titleFit.size,{bold:true,align:'center',color:teal});
    }

    const headerLineY=landscape?62:70;
    page.line(margin,headerLineY,right,headerLineY,{color:line,width:0.7});

    const nameY=landscape?81:91;
    const instTop=landscape?93:105, instH=landscape?28:31;
    if(!answers){
      const nameLineY=nameY+2;
      page.text(margin,nameY,'Name',landscape?10:10.2,{bold:true,color:ink});
      page.line(margin+(landscape?35:34),nameLineY,landscape?360:282,nameLineY,{color:muted,width:0.65});
      const scoreX=landscape?535:345;
      page.text(scoreX,nameY,'Score',landscape?10:10.2,{bold:true,color:ink});
      page.line(scoreX+(landscape?39:38),nameLineY,scoreX+(landscape?105:101),nameLineY,{color:muted,width:0.65});
      page.text(scoreX+(landscape?111:107),nameY,`/ ${r.questionCount}`,landscape?10:10.2,{color:muted});
      page.rect(margin,instTop,right-margin,instH,{fill:pale,stroke:[222,232,230],width:0.6});
      wrapText(page,G.instructionText(r),margin+10,instTop+(landscape?17:18),right-margin-20,landscape?8.8:9.1,landscape?9.5:10.2,{color:ink});
    }else{
      const panelTop=landscape?70:78;
      if(qrMatrix){
        const panelH=landscape?66:67;
        page.rect(margin,panelTop,right-margin,panelH,{fill:pale,stroke:[222,232,230],width:0.6});
        const qrSize=landscape?58:60;
        const qrX=right-qrSize-7, qrTop=panelTop+(panelH-qrSize)/2;
        page.text(margin+10,panelTop+(landscape?17:18),'Teacher answer copy',landscape?10.2:10.4,{bold:true,color:ink});
        page.text(margin+10,panelTop+(landscape?33:35),'Scan the QR to recreate this exact sheet in 99 Club Studio.',landscape?8.1:8.3,{color:ink});
        page.text(margin+10,panelTop+(landscape?49:52),`Sheet ${sheet.code}`,landscape?7.5:7.7,{color:muted});
        drawQr(page,qrX,qrTop,qrSize,qrMatrix);
      }else{
        const panelH=landscape?35:38;
        page.rect(margin,panelTop,right-margin,panelH,{fill:pale,stroke:[222,232,230],width:0.6});
        page.text(margin+10,panelTop+(landscape?15:16),'Teacher answer copy',landscape?9.7:9.9,{bold:true,color:ink});
        page.text(margin+10,panelTop+(landscape?28:30),`Sheet ${sheet.code} · Recreation QR unavailable — use the Full recreation code if needed.`,landscape?7.2:7.4,{color:muted});
      }
    }

    const cols=getColumns(r.questionCount,orientation,openWorksheet), rows=Math.ceil(r.questionCount/cols);
    const colGap=18, contentW=right-margin, colW=(contentW-colGap*(cols-1))/cols;
    const top=answers?(qrMatrix?(landscape?147:160):(landscape?116:127)):(landscape?134:151), footerLine=landscape?564:811;
    const noteText=answers?cleanTeacherNote(teacherNote):'';
    const noteBlockH=noteText?(landscape?34:38):0;
    const bottom=footerLine-12-noteBlockH, available=bottom-top;
    const rowH=available/rows;
    const fonts=getQuestionFonts(r.questionCount,orientation);
    const answerLineW=landscape?(r.questionCount>=77?38:44):(r.questionCount>=77?42:48);
    for(let c=0;c<cols;c++){
      const x=margin+c*(colW+colGap);
      if(c>0)page.line(x-colGap/2,top-2,x-colGap/2,bottom,{color:[232,235,237],width:0.5});
      const start=c*rows,end=Math.min((c+1)*rows,sheet.questions.length);
      for(let idx=start;idx<end;idx++){
        const q=sheet.questions[idx], rr=idx-start;
        const y=top+rr*rowH+Math.min(14.5,Math.max(10,rowH*.64));
        page.text(x,y,`${q.number}.`,fonts.number,{bold:true,color:muted});
        const promptX=x+(landscape?24:23);
        const promptMaxW=Math.max(28,colW-(promptX-x)-answerLineW-7);
        const promptInfo=drawQuestionPrompt(page,promptX,y,q.prompt,fonts.question,ink,promptMaxW,rowH);
        const answerY=promptInfo && Number.isFinite(promptInfo.answerY) ? promptInfo.answerY : y;
        if(answers) page.text(x+colW-6,answerY,String(q.answer),fonts.answer,{bold:true,align:'right',color:teal});
        else page.line(x+colW-answerLineW,answerY+2,x+colW-5,answerY+2,{color:[120,128,136],width:0.6});
        if(typeof page.replaceButton==='function') page.replaceButton(x,top+rr*rowH,colW,rowH,idx,q.number);
      }
    }

    if(noteText){
      const noteTop=footerLine-noteBlockH+3, boxH=noteBlockH-7;
      page.rect(margin,noteTop,right-margin,boxH,{fill:[248,250,250],stroke:[225,231,232],width:0.5});
      page.text(margin+8,noteTop+(landscape?10:10.5),'Teacher note',landscape?7.0:7.1,{bold:true,color:ink});
      wrapText(page,noteText,margin+8,noteTop+(landscape?21:22),right-margin-16,landscape?6.7:6.8,landscape?7.4:7.6,{color:muted});
    }

    page.line(margin,footerLine,right,footerLine,{color:line,width:0.55});
    const footerY=footerLine+(landscape?14:15);
    page.text(margin,footerY,`Sheet ${sheet.code}`,landscape?7.2:7.3,{color:muted});
    page.text(right,footerY,'Generated by 99 Club Studio',landscape?7.2:7.3,{align:'right',color:muted});
  }

  function cleanTeacherNote(value){return String(value==null?'':value).replace(/\s+/g,' ').trim().slice(0,240);}

  function drawQr(page,x,topY,size,matrix){
    if(!Array.isArray(matrix)||!matrix.length)return;
    const n=matrix.length, quiet=4, total=n+quiet*2, module=size/total;
    page.rect(x,topY,size,size,{fill:[255,255,255]});
    for(let row=0;row<n;row++){
      let start=-1;
      for(let col=0;col<=n;col++){
        const dark=col<n && !!matrix[row][col];
        if(dark && start<0)start=col;
        if(!dark && start>=0){
          page.rect(x+(quiet+start)*module,topY+(quiet+row)*module,(col-start)*module,module,{fill:[0,0,0]});
          start=-1;
        }
      }
    }
  }

  function drawQuestionPrompt(page,x,y,prompt,size,color,maxWidth=Infinity,rowH=Infinity){
    const raw=String(prompt == null ? '' : prompt);
    const widthAt=(text,fontSize)=>P.estimateTextWidth(text,fontSize,false);
    const estimated=raw.charAt(0)==='√'
      ? size*.56 + widthAt(raw.slice(1),size)
      : widthAt(raw,size);

    // Existing compact 99 Club prompts normally fit on one line. Keep that
    // behaviour exactly, but allow the new curriculum worksheet families to
    // wrap when a genuinely textual prompt would otherwise be clipped.
    if(!Number.isFinite(maxWidth) || estimated<=maxWidth){
      if(raw.charAt(0)==='√' && typeof page.symbol==='function'){
        const radicalWidth=page.symbol(x,y,214,size,{color});
        page.text(x+radicalWidth+Math.max(1.1,size*.06),y,raw.slice(1),size,{color});
      }else page.text(x,y,raw,size,{color});
      return {answerY:y,lines:1};
    }

    const oneLineSize=size*(maxWidth/estimated);
    if(oneLineSize>=8.6 || raw.charAt(0)==='√'){
      const drawSize=Math.max(5.8,oneLineSize);
      if(raw.charAt(0)==='√' && typeof page.symbol==='function'){
        const radicalWidth=page.symbol(x,y,214,drawSize,{color});
        page.text(x+radicalWidth+Math.max(1.1,drawSize*.06),y,raw.slice(1),drawSize,{color});
      }else page.text(x,y,raw,drawSize,{color});
      return {answerY:y,lines:1};
    }

    const wrapSize=Math.min(size,8.4);
    const words=raw.trim().split(/\s+/);
    let best=null;
    if(words.length>1){
      for(let i=1;i<words.length;i++){
        const a=words.slice(0,i).join(' '),b=words.slice(i).join(' ');
        const wa=widthAt(a,wrapSize),wb=widthAt(b,wrapSize),worst=Math.max(wa,wb);
        if(worst<=maxWidth && (!best || worst<best.worst))best={a,b,worst};
      }
    }
    const lineGap=wrapSize*1.02;
    if(best && (!Number.isFinite(rowH) || rowH>=lineGap*2.15)){
      const firstY=y-lineGap*.36,secondY=y+lineGap*.66;
      page.text(x,firstY,best.a,wrapSize,{color});
      page.text(x,secondY,best.b,wrapSize,{color});
      return {answerY:secondY,lines:2};
    }

    // Last-resort fit for dense sheets. This is preferable to silently
    // cropping the end of a question.
    const drawSize=Math.max(5.2,oneLineSize);
    page.text(x,y,raw,drawSize,{color});
    return {answerY:y,lines:1};
  }

  function getColumns(count,orientation,openWorksheet=false){
    if(normalizeOrientation(orientation)==='landscape'){
      if(openWorksheet){
        if(count<=20)return 2;
        if(count<=42)return 3;
        return 4;
      }
      if(count<=22)return 2;
      if(count<=33)return 3;
      return 4;
    }
    if(openWorksheet){
      if(count<=12)return 1;
      if(count<=30)return 2;
      return 3;
    }
    if(count<=11)return 1;
    if(count<=22)return 2;
    return 3;
  }

  function getQuestionFonts(count,orientation){
    const landscape=normalizeOrientation(orientation)==='landscape';
    if(landscape){
      if(count<=11)return {question:15.5,number:10.0,answer:14.0};
      if(count<=22)return {question:14.1,number:9.6,answer:12.9};
      if(count<=33)return {question:13.5,number:9.4,answer:12.6};
      if(count<=44)return {question:13.0,number:9.2,answer:12.2};
      if(count<=55)return {question:12.6,number:9.0,answer:11.9};
      if(count<=66)return {question:12.2,number:8.8,answer:11.6};
      if(count<=77)return {question:11.8,number:8.6,answer:11.3};
      return {question:11.5,number:8.5,answer:11.0};
    }
    if(count<=11)return {question:14.8,number:9.9,answer:13.5};
    if(count<=22)return {question:13.2,number:9.5,answer:12.4};
    if(count<=33)return {question:12.8,number:9.3,answer:12.1};
    if(count<=44)return {question:12.4,number:9.1,answer:11.8};
    if(count<=55)return {question:12.0,number:8.9,answer:11.5};
    if(count<=66)return {question:11.7,number:8.7,answer:11.2};
    if(count<=77)return {question:11.4,number:8.5,answer:11.0};
    return {question:11.1,number:8.4,answer:10.8};
  }

  function displayYear(value){
    const v=String(value||'').trim(); if(!v)return '';
    return /^year\b/i.test(v)?v:`Year ${v}`;
  }
  function displayClass(value){
    const v=String(value||'').trim(); if(!v)return '';
    return /^class\b/i.test(v)?v:`Class ${v}`;
  }
  function headerMetadata(s){ return [displayYear(s.yearGroup),displayClass(s.className),String(s.teacherName||'').trim(),formatDate(s.worksheetDate)].filter(Boolean).join(' · '); }

  function fitText(text,startSize,minSize,maxWidth,bold){
    const raw=String(text||'');
    let size=startSize;
    while(size>minSize && P.estimateTextWidth(raw,size,bold)>maxWidth) size-=.2;
    if(P.estimateTextWidth(raw,size,bold)<=maxWidth)return {text:raw,size};
    let out=raw;
    while(out.length>3 && P.estimateTextWidth(out+'...',size,bold)>maxWidth)out=out.slice(0,-1);
    return {text:out.replace(/\s+$/,'')+'...',size};
  }

  function wrapText(page,text,x,y,maxWidth,size,lineHeight,opts){
    const words=String(text).split(/\s+/); let line='', yy=y;
    for(const word of words){
      const test=line?line+' '+word:word;
      if(P.estimateTextWidth(test,size,opts && opts.bold)<=maxWidth) line=test;
      else { if(line) page.text(x,yy,line,size,opts); yy+=lineHeight; line=word; }
    }
    if(line)page.text(x,yy,line,size,opts);
  }

  function formatDate(iso){
    if(!iso)return '';
    const parts=String(iso).split('-').map(Number); if(parts.length!==3 || !parts.every(Number.isFinite)) return String(iso);
    const [y,m,d]=parts;
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d} ${months[m-1] || m} ${y}`;
  }

  function svgEsc(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function cssRgb(c){return `rgb(${c.map(v=>Math.max(0,Math.min(255,Number(v)||0))).join(',')})`;}

  class SVGPreviewDocument{
    constructor(imageSources={}){this.imageSources=imageSources;this.pages=[];}
    addPage(options={}){
      const orientation=normalizeOrientation(options.orientation);
      const width=orientation==='landscape'?P.LANDSCAPE_W:P.PAGE_W;
      const height=orientation==='landscape'?P.LANDSCAPE_H:P.PAGE_H;
      const page=new SVGPreviewPage(width,height,this.imageSources);
      this.pages.push(page);return page;
    }
  }
  class SVGPreviewPage{
    constructor(width,height,imageSources={}){this.width=width;this.height=height;this.images=imageSources;this.elements=[];this.replaceLayers=[];}
    text(x,topY,text,size=10,opts={}){
      const bold=!!opts.bold,width=P.estimateTextWidth(text,size,bold);let tx=x;
      if(opts.align==='center')tx-=width/2;if(opts.align==='right')tx-=width;
      const fill=opts.color?cssRgb(opts.color):'#000';
      this.elements.push(`<text x="${tx.toFixed(2)}" y="${Number(topY).toFixed(2)}" font-family="Helvetica,Arial,sans-serif" font-size="${Number(size).toFixed(2)}" font-weight="${bold?700:400}" fill="${fill}">${svgEsc(text)}</text>`);
      return width;
    }
    symbol(x,topY,code,size=10,opts={}){
      const width=size*(Number(code)===214?.549:.6),fill=opts.color?cssRgb(opts.color):'#000';let tx=x;
      if(opts.align==='center')tx-=width/2;if(opts.align==='right')tx-=width;
      const glyph=Number(code)===214?'√':'?';
      this.elements.push(`<text x="${tx.toFixed(2)}" y="${Number(topY).toFixed(2)}" font-family="Symbol,Helvetica,Arial,sans-serif" font-size="${Number(size).toFixed(2)}" fill="${fill}">${glyph}</text>`);return width;
    }
    line(x1,y1,x2,y2,opts={}){this.elements.push(`<line x1="${Number(x1).toFixed(2)}" y1="${Number(y1).toFixed(2)}" x2="${Number(x2).toFixed(2)}" y2="${Number(y2).toFixed(2)}" stroke="${opts.color?cssRgb(opts.color):'#000'}" stroke-width="${Number(opts.width||.7).toFixed(2)}"/>`);}
    rect(x,topY,w,h,opts={}){
      const fill=opts.fill?cssRgb(opts.fill):'none',stroke=opts.stroke?cssRgb(opts.stroke):'none';
      this.elements.push(`<rect x="${Number(x).toFixed(2)}" y="${Number(topY).toFixed(2)}" width="${Number(w).toFixed(2)}" height="${Number(h).toFixed(2)}" fill="${fill}" stroke="${stroke}" stroke-width="${Number(opts.width||.7).toFixed(2)}"/>`);
    }
    image(x,topY,w,h,name='Im1'){
      const href=this.images[name];if(!href)return;
      this.elements.push(`<image x="${Number(x).toFixed(2)}" y="${Number(topY).toFixed(2)}" width="${Number(w).toFixed(2)}" height="${Number(h).toFixed(2)}" href="${svgEsc(href)}" preserveAspectRatio="xMidYMid meet"/>`);
    }
    replaceButton(x,topY,w,h,index,number){
      const cy=topY+h*.5,cx=x-6,r=5.7;
      this.replaceLayers.push(`<g class="tt99-svg-row-review" tabindex="0"><rect class="tt99-svg-row-hit" x="${Number(x).toFixed(2)}" y="${Number(topY).toFixed(2)}" width="${Number(w).toFixed(2)}" height="${Number(h).toFixed(2)}" fill="transparent"/><g class="tt99-svg-replace" data-replace="${Number(index)}" role="button" tabindex="0" aria-label="Replace question ${Number(number)} with another question of the same type"><circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r}"/><text x="${cx.toFixed(2)}" y="${(cy+3.2).toFixed(2)}" text-anchor="middle">↻</text></g></g>`);
    }
    svg(classNames=''){
      return `<svg class="tt99-paper tt99-paper-svg ${svgEsc(classNames)}" viewBox="0 0 ${this.width} ${this.height}" width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Worksheet print preview"><rect width="100%" height="100%" fill="#fff"/>${this.elements.join('')}${this.replaceLayers.join('')}</svg>`;
    }
  }

  function renderPreviewSvg(options={}){
    const {rules,sheet,school={},answers=false,orientation='portrait',qrMatrix=null,badgeUrl='',teacherNote=''}=options;
    if(!sheet)return '';
    const images={};if(school.logoDataUrl)images.logo=school.logoDataUrl;if(badgeUrl)images.badge=badgeUrl;
    const doc=new SVGPreviewDocument(images);
    drawPage(doc,rules,sheet,0,school,!!answers,orientation,qrMatrix,!!badgeUrl,teacherNote);
    return doc.pages[0].svg(`${normalizeOrientation(orientation)==='landscape'?'is-landscape':'is-portrait'}`);
  }

  function filename(rules,kind,orientation='portrait'){
    const r=G.normalizeRules(rules);
    const sourceName=r.progressionEnabled===false?(r.worksheetTitle||r.name||'Maths Practice'):(r.name || `${r.questionCount}-Club`);
    const club=sourceName.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'');
    const suffix=kind==='student'?'worksheets':kind==='answers'?'answer-key':'worksheets-and-answers';
    const layout=normalizeOrientation(orientation)==='landscape'?'-landscape':'';
    return `${club}-${suffix}${layout}.pdf`;
  }

  const api={buildDocument,drawPage,renderPreviewSvg,filename,formatDate,getColumns,getQuestionFonts,normalizeOrientation,displayYear,displayClass};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  global.TT99PDFLayout=api;
}(typeof window!=='undefined'?window:globalThis));
