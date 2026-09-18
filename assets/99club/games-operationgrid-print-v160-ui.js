/* 99 Club Studio · printable Operation Codebreaker aligned decode grid v1.60 */
(function(global){
'use strict';
const root=document.getElementById('tt99-games-root');if(!root)return;
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function enhance(section){
 if(section.dataset.opPrint160==='1')return;
 const host=section.querySelector('.tt99-opprint158');if(!host)return;
 const oldCode=host.querySelector('.tt99-op158-code'),oldCipher=host.querySelector('.tt99-op158-cipher');if(!oldCode||!oldCipher)return;
 const codeBoxes=[...oldCode.querySelectorAll('i')],cipherBoxes=[...oldCipher.querySelectorAll(':scope > span')];
 const count=Math.min(codeBoxes.length,cipherBoxes.length);if(!count)return;
 const answers=!!section.closest('.tt99-game-paper.is-answer');
 const decoded=oldCipher.querySelector('label b')?.textContent?.trim()||'';
 const grid=document.createElement('div');grid.className='tt99-op160-decode';grid.style.setProperty('--op-count',String(count));
 const row=(label,cells,cls)=>`<div class="tt99-op160-label">${label}</div>${cells.map((v,i)=>`<div class="tt99-op160-cell ${cls(i)}">${v}</div>`).join('')}`;
 const codeCells=codeBoxes.slice(0,count).map((box,i)=>{const digit=box.querySelector('b')?.textContent?.trim()||'';return `<small>#${i+1}</small><b>${answers?esc(digit):''}</b>`;});
 const cipherCells=cipherBoxes.slice(0,count).map(box=>{const ch=box.querySelector('b')?.textContent?.trim()||'',move=box.querySelector('small')?.textContent?.trim()||'';const dir=move.startsWith('−')||move.startsWith('-')?'−':'+';return `<b>${esc(ch)}</b><small>${dir}</small>`;});
 const answerCells=Array.from({length:count},(_,i)=>`<b>${answers&&decoded&&!/^_+$/.test(decoded)?esc(decoded[i]||''):''}</b>`);
 grid.innerHTML=row('Number code',codeCells,()=>`tt99-op160-codecell${answers?' is-answer':''}`)+row('Secret word',cipherCells,()=> 'tt99-op160-ciphercell')+row('Your answer',answerCells,()=>`tt99-op160-answercell${answers?' is-answer':''}`)+`<div class="tt99-op160-alpha"><strong>Alphabet</strong><span>A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</span></div><div class="tt99-op160-note">Use the digit above each letter. + move forwards, − move backwards. Wrap Z to A and A to Z.</div>`;
 host.appendChild(grid);section.dataset.opPrint160='1';
}
let raf=0;function scan(){raf=0;root.querySelectorAll('.tt99-operationgrid').forEach(enhance);}function schedule(){if(!raf)raf=requestAnimationFrame(scan);}
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
global.TT99OperationGridPrintUIV160={version:'1.60',refresh:schedule,scan};
})(typeof globalThis!=='undefined'?globalThis:this);
