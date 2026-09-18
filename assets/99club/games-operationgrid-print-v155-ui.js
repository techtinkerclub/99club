/* 99 Club Studio · printable Operation Codebreaker browser renderer v1.55 */
(function(global){
'use strict';
const root=document.getElementById('tt99-games-root');if(!root)return;
const MARK=/\s*\[\[TT99OC155:([^\]]+)\]\]/;
function decode(s){try{const json=decodeURIComponent(escape(atob(s)));return JSON.parse(json);}catch(_){try{return JSON.parse(s);}catch(__){return null;}}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function opLabel(op){return op==='-'?'−':op;}
function enhanceActivity(section){
  if(section.dataset.opPrint155==='1')return;
  const instruction=section.querySelector('.tt99-game-instruction');if(!instruction)return;
  const text=instruction.textContent||'',m=text.match(MARK);if(!m)return;const p=decode(m[1]);if(!p)return;
  instruction.textContent=text.replace(MARK,'').trim();
  const old=section.querySelector('.tt99-operation-code');if(!old)return;
  const answers=!!section.closest('.tt99-game-paper.is-answer'),pairs=Object.entries(p.operatorDigits||{}),moves=Array.isArray(p.moves)?p.moves:[],cipher=String(p.cipher||''),alphabet=String(p.alphabet||'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  const host=document.createElement('div');host.className='tt99-operationgrid-v155';
  host.innerHTML=`<div class="tt99-opprint-key"><span class="tt99-opprint-label">Operator key</span>${pairs.map(([op,d])=>`<span><b>${esc(opLabel(op))}</b> = ${esc(d)}</span>`).join('')}</div><div class="tt99-opprint-code"><span class="tt99-opprint-label">Number code</span>${(p.code||[]).map((d,i)=>`<i class="${answers?'answer-fill':''}" title="Code position ${i+1}">${answers?esc(d):i+1}</i>`).join('')}</div><div class="tt99-opprint-cipher"><span class="tt99-opprint-label">Secret word</span>${cipher.split('').map((ch,i)=>{const mv=moves[i]||{};return `<span><b>${esc(ch)}</b><small>${Number(mv.direction)>0?'+':'−'} ${esc(mv.digit)}</small></span>`;}).join('')}</div><p class="tt99-opprint-rule"><strong>Decode:</strong> + move forwards, − move backwards. Pass Z → continue at A; pass A → continue at Z.</p><div class="tt99-opprint-alphabet" aria-label="Alphabet reference">${alphabet.split('').map(ch=>`<span>${esc(ch)}</span>`).join('')}</div><div class="tt99-opprint-answer"><span>Decoded word</span><b>${answers?esc(p.word):'________________'}</b></div>`;
  old.replaceWith(host);section.dataset.opPrint155='1';
}
let raf=0;function scan(){raf=0;root.querySelectorAll('.tt99-operationgrid').forEach(enhanceActivity);}function schedule(){if(!raf)raf=requestAnimationFrame(scan);}
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
global.TT99OperationGridPrintUIV155={version:'1.55',refresh:schedule,scan};
})(typeof globalThis!=='undefined'?globalThis:this);
