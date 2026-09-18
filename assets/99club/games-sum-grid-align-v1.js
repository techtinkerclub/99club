/* 99 Club Studio · exact Corner/Linked Sum circle alignment v1.0.1
 * Positions each circle from the rendered cell boundaries rather than percentage
 * estimates. This avoids Safari/sub-pixel drift on narrow screens.
 */
(function(){
'use strict';
const watched=new WeakSet();
function positionBoard(board){
  const online=board.classList.contains('tt99-sumgrid-intersection-board');
  const cells=[...board.querySelectorAll(online?'.tt99-numbergrid-cell':'.tt99-sumgrid-cell')];
  const host=online?board:board.parentElement;
  const clues=[...host.querySelectorAll(online?'.tt99-play-sumgrid-clue':'.tt99-sumgrid-clue')];
  if(cells.length<9||clues.length<4)return;
  const c0=cells[0],c1=cells[1],c3=cells[3];
  const x1=c0.offsetLeft+c0.offsetWidth;
  const x2=c1.offsetLeft+c1.offsetWidth;
  const y1=c0.offsetTop+c0.offsetHeight;
  const y2=c3.offsetTop+c3.offsetHeight;
  [[x1,y1],[x2,y1],[x1,y2],[x2,y2]].forEach(([x,y],i)=>{
    clues[i].style.left=`${x}px`;
    clues[i].style.top=`${y}px`;
  });
}
function watch(board){
  if(watched.has(board))return;
  watched.add(board);
  const place=()=>requestAnimationFrame(()=>positionBoard(board));
  place();
  if('ResizeObserver'in window){const ro=new ResizeObserver(place);ro.observe(board);}
  else window.addEventListener('resize',place,{passive:true});
}
function scan(root=document){
  root.querySelectorAll?.('.tt99-sumgrid-intersection-board,.tt99-sumgrid-board').forEach(watch);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>scan(),{once:true});else scan();
new MutationObserver(records=>{for(const rec of records)for(const node of rec.addedNodes)if(node.nodeType===1){if(node.matches?.('.tt99-sumgrid-intersection-board,.tt99-sumgrid-board'))watch(node);scan(node);}}).observe(document.documentElement,{childList:true,subtree:true});
})();
