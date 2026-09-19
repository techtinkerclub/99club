/* 99 Club Studio · printable Operation Codebreaker browser renderer v1.58 */
(function(global){
'use strict';
const root=document.getElementById('tt99-games-root');if(!root)return;
const MARK=/\s*\[\[TT99OC158:([^\]]+)\]\]/;
function decode(s){try{return JSON.parse(decodeURIComponent(escape(atob(s))));}catch(_){try{return JSON.parse(s);}catch(__){return null;}}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function opLabel(op){return op==='-'?'−':op;}
function preserve(section,host){[...section.children].forEach(n=>{if(n.matches('.tt99-preview-replace,.tt99-game-activity-head,.tt99-game-instruction'))return;n.remove();});section.appendChild(host);}
function enhance(section){
 if(section.dataset.opPrint158==='1')return;
 const instruction=section.querySelector('.tt99-game-instruction');if(!instruction)return;const raw=instruction.textContent||'',m=raw.match(MARK);if(!m)return;const p=decode(m[1]);if(!p)return;
 const answers=!!section.closest('.tt99-game-paper.is-answer'),locks=[...section.querySelectorAll('.tt99-operation-lock')];if(!locks.length)return;
 instruction.textContent='Make every equation true; allowed signs may be reused. Follow brackets and normal operation order. Use the operator key to turn solved signs into code digits, then crack the secret word.';
 const host=document.createElement('div');host.className='tt99-opprint158';let pos=0;
 const cards=locks.map((lock,i)=>{const eq=lock.querySelector('.tt99-lock-equation')?.cloneNode(true);if(!eq)return'';eq.querySelectorAll('.tt99-op-slot').forEach(slot=>{pos++;const op=slot.textContent.trim();slot.className='tt99-op158-slot'+(answers?' is-answer':'');slot.innerHTML=`<small>#${pos}</small>${answers?`<b>${esc(opLabel(op))}</b>`:''}`;});return `<div class="tt99-op158-equation"><span>Equation ${i+1}</span>${eq.outerHTML}</div>`;}).join('');
 const pairs=Object.entries(p.operatorDigits||{}),code=p.code||[],moves=p.moves||[],cipher=String(p.cipher||'');
 host.innerHTML=`<div class="tt99-op158-key"><strong>Operator key</strong>${pairs.map(([op,d])=>`<span><b>${esc(opLabel(op))}</b> = ${esc(d)}</span>`).join('')}</div><div class="tt99-op158-equations">${cards}</div><div class="tt99-op158-code"><strong>Number code</strong>${code.map((d,i)=>`<i class="${answers?'is-answer':''}"><small>#${i+1}</small><b>${answers?esc(d):''}</b></i>`).join('')}</div><div class="tt99-op158-cipher"><strong>Secret word</strong>${cipher.split('').map((ch,i)=>{const mv=moves[i]||{};return `<span><b>${esc(ch)}</b><small>${Number(mv.direction)>0?'+':'−'}#${esc(mv.codeIndex||i+1)}</small></span>`;}).join('')}<em>+ move forwards, − move backwards. Wrap Z to A and A to Z.</em><label>Decoded: <b>${answers?esc(p.word):'________________'}</b></label></div>`;
 preserve(section,host);section.dataset.v136='1';section.dataset.opPrint158='1';
}
let raf=0;function scan(){raf=0;root.querySelectorAll('.tt99-operationgrid').forEach(enhance);}function schedule(){if(!raf)raf=requestAnimationFrame(scan);}
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
global.TT99OperationGridPrintUIV158={version:'1.58',refresh:schedule,scan};
})(typeof globalThis!=='undefined'?globalThis:this);
