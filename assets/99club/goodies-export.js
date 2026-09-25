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
function serialiseSvg(svg){
  const clone=svg.cloneNode(true);
  clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');
  return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(clone);
}
function downloadSvg(svg,filename){
  const text=serialiseSvg(svg);
  triggerDownload(new Blob([text],{type:'image/svg+xml;charset=utf-8'}),safeFilename(filename)+'.svg');
}
function svgToPngBlob(svg,scale=2){
  return new Promise((resolve,reject)=>{
    const viewBox=svg.viewBox&&svg.viewBox.baseVal;
    const width=Math.max(1,Math.round((viewBox?.width||svg.clientWidth||1000)*scale));
    const height=Math.max(1,Math.round((viewBox?.height||svg.clientHeight||420)*scale));
    const source=serialiseSvg(svg);
    const url=URL.createObjectURL(new Blob([source],{type:'image/svg+xml;charset=utf-8'}));
    const img=new Image();
    img.onload=()=>{
      try{
        const canvas=document.createElement('canvas');
        canvas.width=width;canvas.height=height;
        const ctx=canvas.getContext('2d');
        ctx.fillStyle='#ffffff';
        ctx.fillRect(0,0,width,height);
        ctx.drawImage(img,0,0,width,height);
        URL.revokeObjectURL(url);
        canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not create PNG.')),'image/png');
      }catch(err){URL.revokeObjectURL(url);reject(err)}
    };
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not render SVG.'))};
    img.src=url;
  });
}
async function downloadPng(svg,filename,scale=2){
  const blob=await svgToPngBlob(svg,scale);
  triggerDownload(blob,safeFilename(filename)+'.png');
}
async function copyPng(svg){
  const blob=await svgToPngBlob(svg,2);
  if(!navigator.clipboard||typeof ClipboardItem==='undefined'||!navigator.clipboard.write){
    throw new Error('Image copying is not available in this browser.');
  }
  await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
}
function printSvg(svg,{title='99 Club Studio illustration',prompt='',answer='',showAnswer=false,landscape=true}={}){
  const win=window.open('','_blank');
  if(!win)throw new Error('Allow pop-ups to print or save as PDF.');
  try{win.opener=null}catch(_){}
  const svgText=serialiseSvg(svg).replace(/^<\?xml[^>]*>\s*/,'');
  const answerHtml=showAnswer&&answer?'<div class="answer"><strong>Answer:</strong> '+String(answer).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</div>':'';
  const promptHtml=prompt?'<div class="prompt">'+String(prompt).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</div>':'';
  win.document.open();
  win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+safeFilename(title)+'</title><style>'+
    '@page{size:A4 '+(landscape?'landscape':'portrait')+';margin:14mm}'+
    '*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#24343b;margin:0}h1{font-size:20pt;margin:0 0 8mm}.prompt{font-size:16pt;font-weight:700;margin:0 0 8mm;padding:4mm 5mm;background:#f3f7f7;border-radius:4mm}.sheet{display:flex;align-items:center;justify-content:center;width:100%}.sheet svg{width:100%;height:auto;max-height:150mm}.answer{margin-top:8mm;font-size:14pt;padding:4mm 5mm;border:1px solid #cbd7d9;border-radius:4mm}.brand{margin-top:8mm;font-size:8pt;color:#77878c;text-align:right}@media print{button{display:none!important}}</style></head><body>'+
    (title?'<h1>'+String(title).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</h1>':'')+
    promptHtml+'<div class="sheet">'+svgText+'</div>'+answerHtml+'<div class="brand">Created with 99 Club Studio</div>'+
    '<script>window.addEventListener("load",()=>setTimeout(()=>window.print(),120));<\/script></body></html>');
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
function svgEl(name,attrs={},text=''){
  const el=document.createElementNS('http://www.w3.org/2000/svg',name);
  Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
  if(text)el.textContent=String(text);
  return el;
}
function composeChallengeCardSvg(diagram,{title='Challenge',prompt='',responseLabel='Answer',responseLines=1,brand='99 Club Studio'}={}){
  if(!diagram)throw new Error('A diagram is required.');
  const source=diagram.cloneNode(true);
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

  const out=svgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:`0 0 ${width} ${height}`,role:'img','aria-label':title||'Challenge'});
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
  out.appendChild(svgEl('text',{x:width-pad,y:height-20,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':12,fill:'#87969a'},brand));
  return out;
}
function copyText(text){
  if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);
  return Promise.reject(new Error('Clipboard access is not available in this browser.'));
}
G.exportTools={safeFilename,downloadSvg,downloadPng,copyPng,printSvg,copyText,serialiseSvg,composeChallengeCardSvg};
})(window.TT99Goodies);
