/* 99 Club Studio · Operation Codebreaker help patch v1.53 */
(function(){
'use strict';
const body=document.getElementById('tt99-game-guide-dialog-body');if(!body)return;
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const DATA={
  goal:'Fill the missing operation signs so every equation is true, then use the solved signs to build the code.',
  rules:[
    'Easy normally uses one missing sign; Standard can use one or two; Challenge can include up to three missing signs in an equation.',
    'Use multiplication and division before addition and subtraction unless brackets tell you to calculate something first.',
    'Every generated equation has one unique combination of allowed operation signs.',
    'Copy the solved signs into the code in the numbered order shown.'
  ],
  example:[
    'For 2 + 3 × 4, multiplication comes first: 3 × 4 = 12, then 2 + 12 = 14.',
    'Brackets change the order: (2 + 3) × 4 = 20 because 2 + 3 is worked first.',
    'A row such as 18 □ 6 □ 2 = 5 may need both boxes considered together rather than solved independently.',
    'Once the row is solved, copy each operation into its numbered code position.'
  ],
  strategy:['Decide which part of the expression must be calculated first before trying signs.','For two or three blanks, test the whole expression after each candidate combination rather than treating each box as a separate question.'],
  tip:'Use inverse facts and estimation to rule out impossible signs before cycling through every combination.',
  watch:'Do not simply work left to right when × or ÷ appears. Follow the normal order of operations and any brackets.'
};
function list(items,ordered=false){const tag=ordered?'ol':'ul';return `<${tag}>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</${tag}>`;}
function patch(){
  const dialog=document.getElementById('tt99-game-guide-dialog');if(dialog?.dataset.activeGuide!=='operationgrid')return;
  const sheet=body.querySelector('[data-guide-sheet="operationgrid"]');if(!sheet||sheet.dataset.v153)return;sheet.dataset.v153='1';
  const goal=sheet.querySelector('.tt99-game-guide-goal p');if(goal)goal.textContent=DATA.goal;
  const sections=[...sheet.querySelectorAll('section')];
  for(const section of sections){const h=section.querySelector('h4')?.textContent?.trim().toLowerCase();if(h==='rules')section.innerHTML='<h4>Rules</h4>'+list(DATA.rules);else if(h==='worked example')section.innerHTML='<h4>Worked example</h4>'+list(DATA.example,true);else if(h==='strategy')section.innerHTML='<h4>Strategy</h4>'+list(DATA.strategy);else if(h==='tip')section.innerHTML=`<h4>Tip</h4><p>${esc(DATA.tip)}</p>`;else if(h==='watch out')section.innerHTML=`<h4>Watch out</h4><p>${esc(DATA.watch)}</p>`;}
}
new MutationObserver(patch).observe(body,{childList:true,subtree:true});patch();
})();
