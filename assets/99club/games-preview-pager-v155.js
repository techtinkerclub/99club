/* 99 Club Studio · paged worksheet preview v1.56
 * Replaces the old truncated vertical preview with a virtualised one-page reader.
 * The complete page markup is retained in memory, while only one pupil/worked
 * page and one answer page are mounted in the DOM during normal browsing.
 */
(function(global){
'use strict';
const root=document.getElementById('tt99-games-root');if(!root)return;
const PAGE_RE=/<article class="tt99-game-paper([^\"]*)">[\s\S]*?<\/article>/g;
let store={pupil:[],answers:[]};
function virtualizeHTML(input){
  const pages={pupil:[],answers:[]},seen={pupil:0,answers:0};let html=String(input??'');
  html=html.replace(PAGE_RE,(m,classes)=>{const kind=String(classes||'').includes('is-answer')?'answers':'pupil';pages[kind].push(m);seen[kind]++;return seen[kind]===1?m:'';});
  return {html,pages};
}

// v1.42 installed a configurable instance-level innerHTML setter that physically
// discarded later preview pages. Replace only that interception with a virtualising
// setter; the generation cache and fast puzzle engines in v1.42/v1.49 remain active.
const proto=typeof Element!=='undefined'?Element.prototype:Object.getPrototypeOf(root),nativeDesc=Object.getOwnPropertyDescriptor(proto,'innerHTML');
if(root.__tt99PreviewLimiter&&Object.prototype.hasOwnProperty.call(root,'innerHTML')){try{delete root.innerHTML;}catch(_){}}
if(nativeDesc?.get&&nativeDesc?.set){
  Object.defineProperty(root,'innerHTML',{configurable:true,get(){return nativeDesc.get.call(this);},set(value){const out=virtualizeHTML(value);store=out.pages;nativeDesc.set.call(this,out.html);}});
}
root.__tt99PagedPreviewV155=true;

let pupilIndex=0,answerIndex=0,lastPupilStack=null,lastAnswerStack=null,raf=0,printing=false;
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function sources(kind){return store[kind]||[];}
function schedule(){if(printing||raf)return;raf=requestAnimationFrame(()=>{raf=0;enhance();});}
function createPage(html){const t=document.createElement('template');t.innerHTML=String(html||'').trim();return t.content.firstElementChild;}
function pageNumber(page,i,total){let footer=page?.querySelector(':scope > footer');if(!footer)return;let n=footer.querySelector('.tt99-paper-page-number');if(!n){n=document.createElement('span');n.className='tt99-paper-page-number';footer.appendChild(n);}n.textContent=`Page ${i+1} of ${total}`;}
function updateNav(stack,kind,index,total){const nav=stack.querySelector(':scope > .tt99-preview-pager');if(!nav)return;const prev=nav.querySelector('[data-preview-prev]'),next=nav.querySelector('[data-preview-next]'),input=nav.querySelector('input'),count=nav.querySelector('[data-preview-total]');if(prev)prev.disabled=index===0;if(next)next.disabled=index===total-1;if(input){input.max=String(total);input.value=String(index+1);}if(count)count.textContent=String(total);}
function showPage(stack,kind){
  const all=sources(kind),fallback=[...stack.querySelectorAll(':scope > article.tt99-game-paper')],total=all.length||fallback.length;if(!total)return;
  let index=kind==='answers'?answerIndex:pupilIndex;index=clamp(index,0,total-1);if(kind==='answers')answerIndex=index;else pupilIndex=index;
  let page;
  if(all.length){page=createPage(all[index]);if(!page)return;stack.querySelectorAll(':scope > article.tt99-game-paper').forEach(el=>el.remove());stack.appendChild(page);}else page=fallback[index]||fallback[0];
  page?.setAttribute('aria-hidden','false');pageNumber(page,index,total);updateNav(stack,kind,index,total);
}
function buildPager(stack,kind){
  const total=sources(kind).length||stack.querySelectorAll(':scope > article.tt99-game-paper').length;if(!total)return;
  let nav=stack.querySelector(':scope > .tt99-preview-pager');
  if(!nav){
    nav=document.createElement('div');nav.className='tt99-preview-pager';nav.setAttribute('role','navigation');nav.setAttribute('aria-label',`${kind==='answers'?'Answer':'Pupil'} preview pages`);
    nav.innerHTML='<button type="button" data-preview-prev aria-label="Previous page">‹</button><div class="tt99-preview-page-readout"><span>Page</span><input type="number" min="1" step="1" inputmode="numeric" aria-label="Preview page number"><span>of</span><strong data-preview-total></strong></div><button type="button" data-preview-next aria-label="Next page">›</button>';
    stack.insertBefore(nav,stack.firstChild);
    const go=delta=>{const totalNow=sources(kind).length||stack.querySelectorAll(':scope > article.tt99-game-paper').length;let next=(kind==='answers'?answerIndex:pupilIndex)+delta;next=clamp(next,0,totalNow-1);if(kind==='answers')answerIndex=next;else pupilIndex=next;showPage(stack,kind);};
    nav.querySelector('[data-preview-prev]').addEventListener('click',()=>go(-1));nav.querySelector('[data-preview-next]').addEventListener('click',()=>go(1));
    const input=nav.querySelector('input'),jump=()=>{const totalNow=sources(kind).length||1,next=clamp((Number(input.value)||1)-1,0,totalNow-1);if(kind==='answers')answerIndex=next;else pupilIndex=next;showPage(stack,kind);};input.addEventListener('change',jump);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();jump();input.blur();}});
  }
  showPage(stack,kind);
}
function enhance(){
  const pupil=root.querySelector('.tt99-games-pupil-pages'),answers=root.querySelector('.tt99-games-answer-pages');
  // Re-renders replace the preview stack element even when the user is only
  // regenerating one activity. Keep the current virtual page and let showPage()
  // clamp it if the regenerated pack now contains fewer pages.
  if(pupil){if(pupil!==lastPupilStack)lastPupilStack=pupil;buildPager(pupil,'pupil');}
  if(answers){if(answers!==lastAnswerStack)lastAnswerStack=answers;buildPager(answers,'answers');}
}
function inflate(stack,kind){const all=sources(kind);if(!stack||!all.length)return;stack.querySelectorAll(':scope > article.tt99-game-paper').forEach(el=>el.remove());all.forEach((html,i)=>{const page=createPage(html);if(page){pageNumber(page,i,all.length);stack.appendChild(page);}});}
function beforePrint(){printing=true;inflate(root.querySelector('.tt99-games-pupil-pages'),'pupil');inflate(root.querySelector('.tt99-games-answer-pages'),'answers');global.TT99OperationGridPrintUIV155?.scan?.();}
function afterPrint(){printing=false;const pupil=root.querySelector('.tt99-games-pupil-pages'),answers=root.querySelector('.tt99-games-answer-pages');if(pupil)showPage(pupil,'pupil');if(answers)showPage(answers,'answers');}
new MutationObserver(schedule).observe(root,{childList:true});global.addEventListener?.('beforeprint',beforePrint);global.addEventListener?.('afterprint',afterPrint);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
global.TT99GamesPreviewPagerV155={version:'1.56',refresh:schedule,virtualizeHTML,get counts(){return {pupil:sources('pupil').length,answers:sources('answers').length};}};
})(typeof globalThis!=='undefined'?globalThis:this);
