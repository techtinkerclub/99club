/* 99 Club Studio · v1.38 Number Towers directional clue tabs */
(function(global){
'use strict';
const root=document.getElementById('tt99-games-root');if(!root)return;let scheduled=false;
function enhanceTowers(){
  root.querySelectorAll('.tt99-numbertowers-grid').forEach(grid=>{
    if(grid.dataset.v138Directions==='1')return;
    const n=Number((grid.style.getPropertyValue('--tower-n')||'').trim())||Math.round(Math.sqrt(grid.querySelectorAll('.tower-cell').length));
    if(!n)return;const width=n+2,children=[...grid.children];
    children.forEach((el,i)=>{
      if(!el.classList.contains('tower-clue')||!String(el.textContent||'').trim())return;
      const r=Math.floor(i/width),c=i%width;let side='';
      if(r===0&&c>0&&c<width-1)side='top';
      else if(r===width-1&&c>0&&c<width-1)side='bottom';
      else if(c===0&&r>0&&r<width-1)side='left';
      else if(c===width-1&&r>0&&r<width-1)side='right';
      if(!side)return;const value=String(el.textContent||'').trim();
      el.classList.add('tt99-v138-viewclue',`tt99-v138-${side}`);el.innerHTML=`<span>${value}</span>`;
    });
    grid.dataset.v138Directions='1';
  });
}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhanceTowers();});}
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});schedule();
})(typeof globalThis!=='undefined'?globalThis:this);
