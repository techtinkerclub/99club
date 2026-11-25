(function(G){
'use strict';
if(!G)return;

function safeFilename(name){
  return String(name||'99studio-illustration')
    .trim().toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,80)||'99studio-illustration';
}
function triggerDownload(blob,filename){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
const PAPER_BRAND='99 Club Studio';
function svgBounds(svg){
  const raw=String(svg.getAttribute('viewBox')||'').trim().split(/[\s,]+/).map(Number);
  if(raw.length===4&&raw.every(Number.isFinite)&&raw[2]>0&&raw[3]>0)return {x:raw[0],y:raw[1],w:raw[2],h:raw[3]};
  const vb=svg.viewBox?.baseVal;
  return {x:0,y:0,w:Math.max(1,vb?.width||parseFloat(svg.getAttribute('width'))||svg.clientWidth||1000),h:Math.max(1,vb?.height||parseFloat(svg.getAttribute('height'))||svg.clientHeight||420)};
}
function stripPaperBrand(svg){
  for(const node of [...svg.querySelectorAll('text,[data-gd-paper-brand]')]){
    const text=String(node.textContent||'').trim();
    const legacy=text===PAPER_BRAND&&['#87969a','#96a4a8','#a0abad'].includes(String(node.getAttribute('fill')||'').toLowerCase());
    if(node.hasAttribute('data-gd-paper-brand')||legacy)node.remove();
  }
  return svg;
}
function addPaperBrand(svg,brand=PAPER_BRAND){
  if(!brand)return svg;
  const {x,y,w,h}=svgBounds(svg),font=w*.0105;
  svg.appendChild(svgEl('text',{x:x+w-w*.045,y:y+h-w*.014,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':font,fill:'#87969a','data-gd-paper-brand':'1'},brand));
  return svg;
}
function preparePaperSvg(svg){
  if(!svg)throw new Error('A diagram is required.');
  const clone=stripPaperBrand(svg.cloneNode(true));
  const branded=clone.hasAttribute('data-gd-paper-ready');
  const brand=branded?(clone.getAttribute('data-gd-paper-label')??PAPER_BRAND):PAPER_BRAND;
  const {x,y,w,h}=svgBounds(clone);
  if(!branded){
    const height=h+w*.035;
    clone.setAttribute('viewBox',[x,y,w,height].join(' '));
    if(clone.hasAttribute('width'))clone.setAttribute('width',String(w));
    if(clone.hasAttribute('height'))clone.setAttribute('height',String(height));
    clone.setAttribute('data-gd-paper-ready','diagram');
    clone.setAttribute('data-gd-paper-label',brand);
  }
  const finalBounds=svgBounds(clone);
  clone.setAttribute('width',String(finalBounds.w));
  clone.setAttribute('height',String(finalBounds.h));
  return addPaperBrand(clone,brand);
}
function serialiseSvg(svg){
  const clone=preparePaperSvg(svg);
  clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');
  return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(clone);
}
function downloadSvg(svg,filename){
  const text=serialiseSvg(svg);
  triggerDownload(new Blob([text],{type:'image/svg+xml;charset=utf-8'}),safeFilename(filename)+'.svg');
}
function svgToPngBlob(svg,scale=2,{transparent=false}={}){
  return new Promise((resolve,reject)=>{
    const prepared=preparePaperSvg(svg),bounds=svgBounds(prepared);
    const width=Math.max(1,Math.round(bounds.w*scale));
    const height=Math.max(1,Math.round(bounds.h*scale));
    const source=serialiseSvg(prepared);
    const url=URL.createObjectURL(new Blob([source],{type:'image/svg+xml;charset=utf-8'}));
    const img=new Image();
    img.onload=()=>{
      try{
        const canvas=document.createElement('canvas');
        canvas.width=width;canvas.height=height;
        const ctx=canvas.getContext('2d');
        if(!transparent){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height)}
        ctx.drawImage(img,0,0,width,height);
        URL.revokeObjectURL(url);
        canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not create PNG.')),'image/png');
      }catch(err){URL.revokeObjectURL(url);reject(err)}
    };
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not render SVG.'))};
    img.src=url;
  });
}
async function downloadPng(svg,filename,scale=2,options={}){
  const blob=await svgToPngBlob(svg,scale,options);
  triggerDownload(blob,safeFilename(filename)+'.png');
}
async function copyPng(svg,options={}){
  const blob=await svgToPngBlob(svg,2,options);
  if(!navigator.clipboard||typeof ClipboardItem==='undefined'||!navigator.clipboard.write){
    throw new Error('Image copying is not available in this browser.');
  }
  await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
}
function printSvg(svg,{title='99 Club Studio illustration',prompt='',answer='',showAnswer=false,landscape=true,maxHeightMm=150}={}){
  const sources=Array.isArray(svg)?svg:[svg];
  if(!sources.length)throw new Error('There are no pages to print.');
  const prepared=sources.map(preparePaperSvg),first=prepared[0];
  const displayTitle=['card','sheet'].includes(first.getAttribute('data-gd-paper-ready'))?'':title;
  const pageW=landscape?269:182,pageH=landscape?182:269;
  const safe=v=>String(v).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const answerHtml=showAnswer&&answer?'<div class="answer"><strong>Answer:</strong> '+safe(answer)+'</div>':'';
  const promptHtml=prompt?'<div class="prompt">'+safe(prompt)+'</div>':'';
  const pages=prepared.map((item,i)=>{
    const bounds=svgBounds(item),reserve=(i===0&&displayTitle?20:0)+(i===0&&prompt?26:0)+(i===prepared.length-1&&showAnswer&&answer?26:0)+4;
    const heightLimit=Math.max(45,Math.min(pageH-reserve,Number(maxHeightMm)||150)),printWidth=Math.min(pageW,heightLimit*bounds.w/bounds.h);
    const svgText=serialiseSvg(item).replace(/^<\?xml[^>]*>\s*/,'');
    return '<section class="print-page">'+(i===0&&displayTitle?'<h1>'+safe(displayTitle)+'</h1>':'')+(i===0?promptHtml:'')+'<div class="sheet" style="--print-width:'+printWidth+'mm;--print-height:'+heightLimit+'mm">'+svgText+'</div>'+(i===prepared.length-1?answerHtml:'')+'</section>';
  });
  const win=window.open('','_blank');
  if(!win)throw new Error('Allow pop-ups to print or save as PDF.');
  try{win.opener=null}catch(_){}
  win.document.open();
  win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+safeFilename(title)+'</title><style>'+
    '@page{size:A4 '+(landscape?'landscape':'portrait')+';margin:14mm}'+
    '*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#24343b;margin:0}h1{font-size:20pt;margin:0 0 8mm}.prompt{font-size:16pt;font-weight:700;margin:0 0 8mm;padding:4mm 5mm;background:#f3f7f7;border-radius:4mm}.sheet{display:flex;align-items:center;justify-content:center;width:100%;break-inside:avoid}.sheet>svg{display:block;width:var(--print-width);max-width:100%;height:auto;max-height:var(--print-height)}.answer{margin-top:8mm;font-size:14pt;padding:4mm 5mm;border:1px solid #cbd7d9;border-radius:4mm}.print-page{break-inside:avoid;page-break-inside:avoid}.print-page+.print-page{break-before:page;page-break-before:always}@media print{button{display:none!important}}</style></head><body>'+
    pages.join('')+'<script>window.addEventListener("load",()=>setTimeout(()=>window.print(),120));<\/script></body></html>');
  win.document.close();
}
function wrapSvgText(text,maxChars=72,maxLines=6){
  const raw=String(text||'').replace(/\s+/g,' ').trim();
  if(!raw)return [];
  const words=raw.split(' '),lines=[];let line='';
  words.forEach(word=>{
    const next=line?line+' '+word:word;
    if(next.length<=maxChars||!line)line=next;
    else{lines.push(line);line=word}
  });
  if(line)lines.push(line);
  if(lines.length>maxLines){
    const kept=lines.slice(0,maxLines);
    kept[maxLines-1]=kept[maxLines-1].replace(/[.\s]+$/,'')+'…';
    return kept;
  }
  return lines;
}
// Actual font metrics rather than a character-count approximation. No ellipsis:
// a printed question or marking rule must never silently lose content.
let paperMeasureContext=null;
function wrapPaperText(value,width,size,weight=400){
 const raw=String(value??'').replace(/\s+/g,' ').trim();if(!raw)return [];
 paperMeasureContext=paperMeasureContext||document.createElement('canvas').getContext('2d');
 const ctx=paperMeasureContext;
 if(ctx)ctx.font=weight+' '+size+'px Arial, sans-serif';
 const measure=s=>ctx?ctx.measureText(s).width:s.length*size*.62;
 const lines=[];let line='';
 const push=()=>{if(line)lines.push(line);line=''};
 for(const word of raw.split(' ')){
   if(measure(word)>width){
     push();let part='';
     for(const char of word){if(part&&measure(part+char)>width){lines.push(part);part=''}part+=char}
     line=part;continue;
   }
   const next=line?line+' '+word:word;
   if(line&&measure(next)>width){push();line=word}else line=next;
 }
 push();return lines;
}
function svgEl(name,attrs={},text=''){
  const el=document.createElementNS('http://www.w3.org/2000/svg',name);
  Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
  if(text)el.textContent=String(text);
  return el;
}
function composeChallengeCardSvg(diagram,{title='Challenge',prompt='',responseLabel='Answer',responseLines=1,brand='99 Club Studio'}={}){
  if(!diagram)throw new Error('A diagram is required.');
  const source=stripPaperBrand(diagram.cloneNode(true));
  source.removeAttribute('id');
  const vb=diagram.viewBox&&diagram.viewBox.baseVal;
  const sourceW=Math.max(1,vb?.width||1000),sourceH=Math.max(1,vb?.height||420);
  const width=1100,pad=56,contentW=width-pad*2;
  const titleLines=wrapSvgText(title,56,2),promptLines=wrapSvgText(prompt,82,6);
  const titleH=titleLines.length?titleLines.length*36+8:0;
  const promptH=promptLines.length?promptLines.length*31+18:0;
  const diagramW=contentW,diagramH=Math.max(230,Math.min(590,sourceH*(diagramW/sourceW)));
  const answerRows=Math.max(1,Math.min(5,Math.round(Number(responseLines)||1)));
  const answerH=52+answerRows*38;
  const headH=titleH+promptH;
  const diagramY=pad+headH+18;
  const answerY=diagramY+diagramH+26;
  const height=answerY+answerH+56;

  const out=svgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:`0 0 ${width} ${height}`,role:'img','aria-label':title||'Challenge','data-gd-paper-ready':'card','data-gd-paper-label':brand});
  out.appendChild(svgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));

  let y=pad+30;
  titleLines.forEach((line,i)=>{
    out.appendChild(svgEl('text',{x:pad,y:y+i*36,'font-family':'Arial,sans-serif','font-size':30,'font-weight':800,fill:'#24343b'},line));
  });
  y=pad+titleH+26;
  promptLines.forEach((line,i)=>{
    out.appendChild(svgEl('text',{x:pad,y:y+i*31,'font-family':'Arial,sans-serif','font-size':24,'font-weight':650,fill:'#334a52'},line));
  });

  const nested=svgEl('svg',{x:pad,y:diagramY,width:diagramW,height:diagramH,viewBox:`0 0 ${sourceW} ${sourceH}`,preserveAspectRatio:'xMidYMid meet'});
  [...source.childNodes].forEach(node=>nested.appendChild(node.cloneNode(true)));
  out.appendChild(nested);

  out.appendChild(svgEl('text',{x:pad,y:answerY+24,'font-family':'Arial,sans-serif','font-size':18,'font-weight':800,fill:'#52666d'},responseLabel));
  out.appendChild(svgEl('rect',{x:pad,y:answerY+36,width:contentW,height:answerH-50,rx:12,fill:'#ffffff',stroke:'#9fb0b5','stroke-width':2}));
  for(let i=1;i<answerRows;i++){
    const lineY=answerY+36+i*((answerH-50)/answerRows);
    out.appendChild(svgEl('line',{x1:pad+18,y1:lineY,x2:width-pad-18,y2:lineY,stroke:'#dfe6e8','stroke-width':1.5}));
  }
  return addPaperBrand(out,brand);
}
// Document composition is synchronous; scoped layout leaves standalone exports unchanged.
let documentCardLayout=false,answerDiagramLayout=false,documentDenseDiagram=false;
function withAnswerDiagram(render){const previous=answerDiagramLayout;answerDiagramLayout=true;try{return render()}finally{answerDiagramLayout=previous}}
function isAnswerDiagramLayout(){return answerDiagramLayout}
function isDocumentCardLayout(){return documentCardLayout}
function withDocumentCardLayout(render,{denseDiagram=false}={}){
 const previous=documentCardLayout,previousDense=documentDenseDiagram;documentCardLayout=true;documentDenseDiagram=!!denseDiagram;
 try{return render()}finally{documentCardLayout=previous;documentDenseDiagram=previousDense}
}
function composeWorksheetCardSvg(diagram,{title='Challenge',prompt='',responseLabel='Answer',responseLines=1,responseMode='auto',paperStyle='card',brand='99 Club Studio',answer='',showAnswer=false,diagramMaxHeight=null,compactEquation=false,printDiagramScale=null}={}){
  if(!diagram)throw new Error('A diagram is required.');
  const source=stripPaperBrand(diagram.cloneNode(true));
  source.removeAttribute('id');
  const vb=diagram.viewBox&&diagram.viewBox.baseVal;
  const sourceW=Math.max(1,vb?.width||1000),sourceH=Math.max(1,vb?.height||420);
  if(answerDiagramLayout)return source;
  const plain=paperStyle==='plain',compact=plain&&documentCardLayout,shortEquation=compact&&compactEquation;
  const width=1120,pad=documentCardLayout&&plain?12:plain?38:48,contentW=width-pad*2;
  const promptSize=compact?28:plain?24:26,promptStep=compact?35:plain?31:34;
  const promptLines=wrapPaperText(prompt,contentW-4,promptSize,700),embedded=documentCardLayout&&plain&&promptLines.length>0;
  const titleLines=embedded?[]:wrapSvgText(title,plain?88:72,1);
  const titleH=titleLines.length?(plain?24:34):0,promptH=promptLines.length?promptLines.length*promptStep+(compact?5:8):0;
  const naturalDiagramH=sourceH*(contentW/sourceW);
  const configuredLimit=diagramMaxHeight==null?(plain?500:525):Math.max(260,Math.min(1000,Number(diagramMaxHeight)||500));
  const diagramLimit=documentCardLayout&&documentDenseDiagram?Math.max(configuredLimit,1200):configuredLimit;
  const fixedScale=Number.isFinite(printDiagramScale)&&printDiagramScale>0?Math.min(printDiagramScale,contentW/sourceW):null;
  const diagramH=fixedScale?sourceH*fixedScale:shortEquation?naturalDiagramH:Math.max(plain?260:300,Math.min(diagramLimit,naturalDiagramH));
  const diagramY=pad+titleH+promptH+(compact?3:plain?12:18);
  const resolvedMode=responseMode==='auto'?(responseLines>1?'lines':'box'):responseMode;
  const answerRows=Math.max(1,Math.min(4,Math.round(Number(responseLines)||1))),writingPitch=compact?44:32,boxHeight=compact?50:42;
  const answerLines=showAnswer&&answer?wrapPaperText(answer,contentW-4,20,750):[];
  const responseVisible=showAnswer?!!answer:resolvedMode!=='none';
  const responseFont=compact?20:15,labelStep=compact?24:20;
  const labelLines=wrapPaperText(responseLabel||'Answer',contentW-4,responseFont,850),labelH=Math.max(1,labelLines.length)*labelStep;
  const responseH=!responseVisible?0:showAnswer?labelH+22+answerLines.length*27:(resolvedMode==='lines'?labelH+12+answerRows*writingPitch:labelH+boxHeight+18);
  const answerY=diagramY+diagramH+(responseVisible?(compact?5:20):0);
  const height=Math.max(plain?diagramY+diagramH+(compact?12:30):560,answerY+responseH+(compact?12:plain?26:42));

  const out=svgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:`0 0 ${width} ${height}`,role:'img','aria-label':title||'Worksheet item','data-worksheet-card':'1','data-worksheet-answer':showAnswer?'teacher':'pupil','data-paper-style':plain?'plain':'card','data-gd-paper-ready':'card','data-gd-paper-label':brand});
  if(plain){
    out.appendChild(svgEl('rect',{x:0,y:0,width,height,fill:'#ffffff'}));
  }else{
    out.appendChild(svgEl('rect',{x:1,y:1,width:width-2,height:height-2,rx:14,fill:'#ffffff',stroke:'#bccacd','stroke-width':2}));
  }

  let y=pad+(plain?17:27);
  titleLines.forEach(line=>out.appendChild(svgEl('text',{
    x:pad,y,
    'font-family':'Arial,sans-serif','font-size':plain?15:22,'font-weight':800,fill:plain?'#66777c':'#66787e'
  },line)));
  y=pad+titleH+(compact?27:plain?22:28);
  if(promptLines.length){out.setAttribute('data-worksheet-prompt-baseline',String(y));out.setAttribute('data-worksheet-prompt-size',String(promptSize));}
  promptLines.forEach((line,i)=>out.appendChild(svgEl('text',{
    x:pad,y:y+i*promptStep,
    'font-family':'Arial,sans-serif','font-size':promptSize,'font-weight':700,fill:'#263f47'
  },line)));

  const nested=svgEl('svg',{x:fixedScale?pad+(contentW-sourceW*fixedScale)/2:pad,y:diagramY,width:fixedScale?sourceW*fixedScale:contentW,height:diagramH,viewBox:`0 0 ${sourceW} ${sourceH}`,preserveAspectRatio:'xMidYMid meet'});
  [...source.childNodes].forEach(node=>nested.appendChild(node.cloneNode(true)));
  out.appendChild(nested);

  if(responseVisible){
    if(showAnswer){
      out.appendChild(svgEl('line',{x1:pad,y1:answerY,x2:width-pad,y2:answerY,stroke:'#c8d4d6','stroke-width':1.4}));
      labelLines.forEach((line,i)=>out.appendChild(svgEl('text',{x:pad,y:answerY+20+i*20,'font-family':'Arial,sans-serif','font-size':16,'font-weight':850,fill:'#526a70'},line)));
      answerLines.forEach((line,i)=>out.appendChild(svgEl('text',{x:pad,y:answerY+labelH+26+i*27,'font-family':'Arial,sans-serif','font-size':20,'font-weight':750,fill:'#284b50'},line)));
    }else if(resolvedMode==='lines'){
      labelLines.forEach((line,i)=>out.appendChild(svgEl('text',{x:pad,y:answerY+responseFont+i*labelStep,'font-family':'Arial,sans-serif','font-size':responseFont,'font-weight':850,fill:'#64777d'},line)));
      for(let i=0;i<answerRows;i++){
        const lineY=answerY+labelH+17+i*writingPitch;
        out.appendChild(svgEl('line',{x1:pad,y1:lineY,x2:width-pad,y2:lineY,stroke:'#aebdc1','stroke-width':1.5}));
      }
    }else if(resolvedMode==='box'){
      labelLines.forEach((line,i)=>out.appendChild(svgEl('text',{x:pad,y:answerY+responseFont+i*labelStep,'font-family':'Arial,sans-serif','font-size':responseFont,'font-weight':850,fill:'#64777d'},line)));
      out.appendChild(svgEl('rect',{x:pad,y:answerY+labelH+7,width:250,height:boxHeight,rx:4,fill:'#ffffff',stroke:'#9fafb3','stroke-width':1.8}));
    }
  }

  return addPaperBrand(out,brand);
}

function copyText(text){
  if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);
  return Promise.reject(new Error('Clipboard access is not available in this browser.'));
}
G.exportTools={wrapPaperText,preparePaperSvg,safeFilename,downloadSvg,downloadPng,copyPng,printSvg,copyText,serialiseSvg,composeChallengeCardSvg,composeWorksheetCardSvg,withDocumentCardLayout,isDocumentCardLayout,withAnswerDiagram,isAnswerDiagramLayout};
})(window.TT99Goodies);
