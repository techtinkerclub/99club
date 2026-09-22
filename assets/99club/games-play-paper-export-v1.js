/* 99 Club Studio · exact online puzzle paper export v1.0.0
 * Rebuilds the current seeded puzzle in a hidden clean board, so exports never
 * contain the player's working, timer, streak, keypad or other play controls.
 */
(function(global){
'use strict';
const Play=global.TT99GamesPlay,PDF=global.TT99SimplePDF;
if(!Play||!Play.adapters||global.TT99PlayPaperExportV1)return;

const PAD_UI=[
  '.tt99-context-pad-launcher','.tt99-context-pad-handle','.tt99-wave184-keypad',
  '.tt99-wave186-keypad','.tt99-v196-keypad','.tt99-number-keypad',
  '.tt99-structure-keypad','.tt99-alpha-pad','.tt99-towers-keypad',
  '.tt99-crossnumber-keypad','.tt99-letter-keypad','.tt99-extra-op-pad'
].join(',');
const TRANSIENT='.is-selected,.is-related,.is-same,.is-current,.is-hint,.is-wrong,.is-keypad-active,.tt99-entry-host-active';
let dialog=null,activeKind='puzzle',signature='',context=null,renderToken=0,raf=0;
const cache={puzzle:null,answer:null};

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
function safeName(v){return String(v||'puzzle').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'puzzle';}
function nextFrame(){return new Promise(function(resolve){requestAnimationFrame(function(){requestAnimationFrame(resolve);});});}
function setMessage(msg,tone){
  const el=dialog&&dialog.querySelector('.tt99-paper-export-message');if(!el)return;
  el.textContent=msg||'';el.dataset.tone=tone||'';
}
function setPlayStatus(msg,tone){
  const el=document.getElementById('tt99-play-status');if(!el)return;
  el.textContent=msg||'';if(tone)el.dataset.tone=tone;else delete el.dataset.tone;
}
function challengeContext(){
  const q=new URLSearchParams(global.location.search),id=q.get('game'),seed=q.get('seed'),adapter=Play.adapters.get(id);
  if(!adapter||!seed||typeof adapter.createPuzzle!=='function')return null;
  const raw=adapter.fromQuery?adapter.fromQuery(q):{},config=adapter.normalizeConfig?adapter.normalizeConfig(raw):raw;
  const puzzle=adapter.createPuzzle(config,seed);
  const instruction=typeof adapter.instruction==='function'?adapter.instruction(puzzle,config):(adapter.instruction||puzzle.instruction||'');
  const meta=adapter.meta?adapter.meta(puzzle,config):'';
  return {id:id,seed:seed,adapter:adapter,config:config,puzzle:puzzle,title:adapter.title||adapter.shortTitle||puzzle.title||'Maths puzzle',meta:meta,instruction:instruction};
}
function contextSignature(){return global.location.pathname+'?'+new URLSearchParams(global.location.search).toString();}
function refreshContext(){
  const sig=contextSignature();
  if(sig===signature&&context)return context;
  signature=sig;context=challengeContext();cache.puzzle=null;cache.answer=null;
  return context;
}
function freezeStructureInputs(node){
  node.querySelectorAll('.tt99-structure-entry').forEach(function(el){
    const frozen=document.createElement('span');frozen.className='tt99-capture-value';frozen.textContent=el.value||'';el.replaceWith(frozen);
  });
}
function sanitiseBoard(node){
  document.activeElement&&document.activeElement.blur&&document.activeElement.blur();
  node.querySelectorAll(TRANSIENT).forEach(function(el){el.classList.remove('is-selected','is-related','is-same','is-current','is-hint','is-wrong','is-keypad-active','tt99-entry-host-active');});
  node.querySelectorAll(PAD_UI+',.tt99-cycle-note,.tt99-hashi-note,.tt99-hashi-hitlayer,.tt99-play-board-tip').forEach(function(el){el.remove();});
  node.classList.remove('tt99-has-context-pad','tt99-context-pad-reserve');node.style.removeProperty('--tt99-context-pad-space');
  node.querySelectorAll('button,input,select,textarea,a').forEach(function(el){el.setAttribute('tabindex','-1');el.setAttribute('aria-hidden','true');if('disabled' in el)el.disabled=true;});
  freezeStructureInputs(node);
}
async function boardCanvas(kind){
  const ctx=refreshContext();if(!ctx)throw new Error('The current puzzle could not be reconstructed.');
  if(typeof global.html2canvas!=='function')throw new Error('Image export is not available in this browser right now.');
  const stage=document.createElement('div');stage.className='tt99-paper-export-stage';
  const host=document.createElement('div');host.className='tt99-paper-export-board-source';stage.appendChild(host);document.body.appendChild(stage);
  let view=null;
  try{
    view=ctx.adapter.mount(host,ctx.puzzle,{onChange:function(){},onStatus:function(){},isPaused:function(){return false;}});
    if(kind==='answer'){
      if(!view||typeof view.revealAnswer!=='function'||view.revealAnswer()===false)throw new Error('An answer image is not available for this puzzle.');
    }
    await nextFrame();sanitiseBoard(host);await nextFrame();
    const rect=host.getBoundingClientRect();if(rect.width<10||rect.height<10)throw new Error('The puzzle preview could not be measured.');
    return await global.html2canvas(host,{backgroundColor:'#ffffff',scale:2,logging:false,useCORS:true,allowTaint:false,imageTimeout:2500,removeContainer:true});
  }finally{
    try{view&&view.destroy&&view.destroy();}catch(_){}
    stage.remove();
  }
}
function wrapText(ctx,text,maxWidth){
  const words=String(text||'').trim().split(/\s+/).filter(Boolean),lines=[];let line='';
  for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width<=maxWidth||!line)line=next;else{lines.push(line);line=word;}}
  if(line)lines.push(line);return lines;
}
function roundRect(ctx,x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
}
async function paperCanvas(kind){
  const ctx=refreshContext(),board=await boardCanvas(kind),W=1200,pad=72,headerH=270,maxBoardW=W-pad*2,maxBoardH=1050;
  const scale=Math.min(1,maxBoardW/board.width,maxBoardH/board.height),bw=Math.max(1,Math.round(board.width*scale)),bh=Math.max(1,Math.round(board.height*scale));
  const H=Math.max(920,headerH+bh+120),canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const g=canvas.getContext('2d');g.fillStyle='#ffffff';g.fillRect(0,0,W,H);g.fillStyle='#0f8179';g.fillRect(0,0,W,12);
  g.fillStyle='#17484c';g.font='800 30px system-ui,-apple-system,sans-serif';g.fillText('99 CLUB STUDIO',pad,62);
  g.fillStyle='#75878b';g.font='600 19px system-ui,-apple-system,sans-serif';g.fillText('Maths Games & Puzzles',pad,91);
  if(kind==='answer'){g.fillStyle='#e9f5f2';roundRect(g,W-222,36,150,48,24);g.fill();g.fillStyle='#14776f';g.font='800 19px system-ui,-apple-system,sans-serif';g.textAlign='center';g.fillText('ANSWER',W-147,67);g.textAlign='left';}
  g.fillStyle='#173f44';g.font='850 46px system-ui,-apple-system,sans-serif';g.fillText(ctx.title,pad,155);
  if(ctx.meta){g.fillStyle='#6d8084';g.font='650 21px system-ui,-apple-system,sans-serif';g.fillText(ctx.meta,pad,191);}
  g.fillStyle='#405f64';g.font='600 20px system-ui,-apple-system,sans-serif';
  const lines=wrapText(g,ctx.instruction,W-pad*2).slice(0,3);lines.forEach(function(line,i){g.fillText(line,pad,225+i*27);});
  const boardY=headerH,boardX=(W-bw)/2;
  g.fillStyle='#fbfdfd';roundRect(g,boardX-22,boardY-22,bw+44,bh+44,24);g.fill();
  g.strokeStyle='#d5e2e2';g.lineWidth=2;roundRect(g,boardX-22,boardY-22,bw+44,bh+44,24);g.stroke();
  g.drawImage(board,boardX,boardY,bw,bh);
  g.fillStyle='#829195';g.font='600 17px system-ui,-apple-system,sans-serif';g.textAlign='center';g.fillText('99studio.uk · exact puzzle from Online Play',W/2,H-38);g.textAlign='left';
  return canvas;
}
function canvasBlob(canvas){return new Promise(function(resolve,reject){canvas.toBlob(function(blob){blob?resolve(blob):reject(new Error('The image could not be created.'));},'image/png');});}
function ensureDialog(){
  if(dialog)return dialog;
  dialog=document.createElement('div');dialog.className='tt99-paper-export-dialog';dialog.hidden=true;
  dialog.innerHTML='<div class="tt99-paper-export-panel" role="dialog" aria-modal="true" aria-labelledby="tt99-paper-export-title">'+
    '<div class="tt99-paper-export-head"><div><small>Exact puzzle export</small><h2 id="tt99-paper-export-title">Print / save this puzzle</h2></div><button type="button" class="tt99-paper-export-close" aria-label="Close">×</button></div>'+
    '<p class="tt99-paper-export-intro">This rebuilds the exact same puzzle from its seed and settings, reset to a clean paper version.</p>'+
    '<div class="tt99-paper-export-tabs"><button type="button" data-paper-kind="puzzle" class="is-active">Puzzle</button><button type="button" data-paper-kind="answer">Answer</button></div>'+
    '<div class="tt99-paper-export-body"><div class="tt99-paper-export-preview"><span>Building clean puzzle…</span></div>'+
    '<aside class="tt99-paper-export-actions"><button type="button" class="primary" data-paper-pdf>Download PDF</button><button type="button" data-paper-png>Save PNG</button><button type="button" data-paper-copy>Copy image</button>'+
    '<label class="tt99-paper-export-answer-option"><input type="checkbox" data-paper-answer-pdf> Include answer page in PDF</label>'+
    '<p class="tt99-paper-export-note">PNG and Copy image are useful for dropping the puzzle into Word, Google Docs, PowerPoint or Canva.</p><p class="tt99-paper-export-message" role="status" aria-live="polite"></p></aside></div></div>';
  document.body.appendChild(dialog);
  dialog.querySelector('.tt99-paper-export-close').addEventListener('click',closeDialog);
  dialog.addEventListener('click',function(e){if(e.target===dialog)closeDialog();});
  dialog.querySelectorAll('[data-paper-kind]').forEach(function(btn){btn.addEventListener('click',function(){activeKind=btn.dataset.paperKind;renderPreview();});});
  dialog.querySelector('[data-paper-png]').addEventListener('click',downloadPng);
  dialog.querySelector('[data-paper-copy]').addEventListener('click',copyImage);
  dialog.querySelector('[data-paper-pdf]').addEventListener('click',downloadPdf);
  return dialog;
}
function closeDialog(){if(dialog)dialog.hidden=true;document.documentElement.classList.remove('tt99-paper-export-open');}
async function ensureRendered(kind){
  refreshContext();if(cache[kind])return cache[kind];
  const canvas=await paperCanvas(kind),blob=await canvasBlob(canvas);cache[kind]={canvas:canvas,blob:blob};return cache[kind];
}
async function renderPreview(){
  const d=ensureDialog(),token=++renderToken;d.querySelectorAll('[data-paper-kind]').forEach(function(b){b.classList.toggle('is-active',b.dataset.paperKind===activeKind);});
  const preview=d.querySelector('.tt99-paper-export-preview');preview.innerHTML='<span>Building '+(activeKind==='answer'?'answer':'clean puzzle')+'…</span>';setMessage('');
  try{
    const item=await ensureRendered(activeKind);if(token!==renderToken)return;
    const url=URL.createObjectURL(item.blob),img=document.createElement('img');img.alt=activeKind==='answer'?'Printable puzzle answer':'Printable clean puzzle';img.onload=function(){URL.revokeObjectURL(url);};img.src=url;preview.replaceChildren(img);
  }catch(err){if(token!==renderToken)return;preview.innerHTML='<span>Could not build the preview.</span>';setMessage(err.message||'Export failed.','warn');}
}
function openDialog(){
  const ctx=refreshContext();if(!ctx){setPlayStatus('This puzzle could not be prepared for printing.','warn');return;}
  const d=ensureDialog();activeKind='puzzle';d.hidden=false;document.documentElement.classList.add('tt99-paper-export-open');renderPreview();
}
function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1500);
}
async function downloadPng(){
  try{const item=await ensureRendered(activeKind),ctx=refreshContext();downloadBlob(item.blob,'99studio-'+safeName(ctx.title)+'-'+activeKind+'.png');setMessage('PNG ready.','success');}
  catch(err){setMessage(err.message||'PNG export failed.','warn');}
}
async function copyImage(){
  try{
    const item=await ensureRendered(activeKind);
    if(!navigator.clipboard||!navigator.clipboard.write||typeof global.ClipboardItem!=='function')throw new Error('Image copy is not supported by this browser.');
    await navigator.clipboard.write([new ClipboardItem({'image/png':item.blob})]);setMessage('Puzzle image copied. Paste it into your document.','success');
  }catch(err){
    setMessage((err&&err.message?err.message:'Could not copy the image.')+' You can use Save PNG instead.','warn');
  }
}
function addPdfCanvas(doc,canvas,name){
  const data=canvas.toDataURL('image/jpeg',0.95);doc.setJpeg(data,canvas.width,canvas.height,name);
  const page=doc.addPage({orientation:'portrait'}),margin=28,aw=PDF.PAGE_W-margin*2,ah=PDF.PAGE_H-margin*2,scale=Math.min(aw/canvas.width,ah/canvas.height),w=canvas.width*scale,h=canvas.height*scale;
  page.image((PDF.PAGE_W-w)/2,(PDF.PAGE_H-h)/2,w,h,name);
}
async function downloadPdf(){
  try{
    if(!PDF||!PDF.PDFDocument)throw new Error('PDF export is not available.');
    const ctx=refreshContext(),puzzle=await ensureRendered('puzzle'),includeAnswer=!!dialog.querySelector('[data-paper-answer-pdf]').checked,doc=new PDF.PDFDocument();
    addPdfCanvas(doc,puzzle.canvas,'PuzzlePage');
    if(includeAnswer){const answer=await ensureRendered('answer');addPdfCanvas(doc,answer.canvas,'AnswerPage');}
    doc.save('99studio-'+safeName(ctx.title)+(includeAnswer?'-puzzle-and-answer':'-puzzle')+'.pdf');setMessage(includeAnswer?'Puzzle + answer PDF ready.':'Puzzle PDF ready.','success');
  }catch(err){setMessage(err.message||'PDF export failed.','warn');}
}
function injectButtons(){
  const setup=document.querySelector('.tt99-play-setup-actions');
  if(setup&&!setup.querySelector('[data-paper-export]')){
    const b=document.createElement('button');b.type='button';b.className='tt99-secondary';b.dataset.paperExport='1';b.textContent='Print / save';setup.appendChild(b);
  }
  const complete=document.querySelector('#tt99-play-complete:not([hidden]) .tt99-play-complete-actions');
  if(complete&&!complete.querySelector('[data-paper-export]')){
    const b=document.createElement('button');b.type='button';b.className='tt99-secondary';b.dataset.paperExport='1';b.textContent='Print / save';
    const after=complete.querySelector('[data-play-another]');after?after.after(b):complete.appendChild(b);
  }
}
function schedule(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;injectButtons();});}
document.addEventListener('click',function(e){const b=e.target.closest&&e.target.closest('[data-paper-export]');if(!b)return;e.preventDefault();openDialog();},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&dialog&&!dialog.hidden){e.preventDefault();closeDialog();}},true);
const root=document.getElementById('tt99-play-root');if(root&&global.MutationObserver)new MutationObserver(schedule).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
global.TT99PlayPaperExportV1={version:'1.0.0',open:openDialog,refresh:refreshContext};
})(typeof globalThis!=='undefined'?globalThis:this);
