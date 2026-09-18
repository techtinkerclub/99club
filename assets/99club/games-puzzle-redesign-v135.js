/* 99 Club Studio · v1.35 puzzle presentation prototypes
 * Redesigns four browser-preview activities without changing their maths engines:
 * Operation Codebreaker, Symbol Equations, Function Machines and Balance the Equation.
 */
(function(){
  'use strict';
  const root=document.getElementById('tt99-games-root');
  if(!root)return;

  let scheduled=false;
  const OPS=['+','−','×','÷'];
  const GLYPHS={A:'◆',B:'●',C:'★'};

  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function normalizeOp(op){return String(op||'').replace(/-/g,'−').replace(/\*/g,'×').replace(/\//g,'÷');}
  function evalOp(a,op,b){op=normalizeOp(op);if(op==='+')return a+b;if(op==='−')return a-b;if(op==='×')return a*b;if(op==='÷')return b===0?NaN:a/b;return NaN;}
  function near(a,b){return Number.isFinite(a)&&Math.abs(a-b)<1e-9;}
  function hash(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function shuffledDigits(seed){let h=hash(seed),out=[1,2,3,4,5,6,7,8,9];for(let i=out.length-1;i>0;i--){h=(Math.imul(h^h>>>15,2246822519)+3266489917)>>>0;const j=h%(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
  function isAnswer(activity){return !!activity.closest('.tt99-game-paper.is-answer');}
  function difficultyOf(activity){return (activity.querySelector('.tt99-game-activity-head>small')?.textContent||'standard').trim().toLowerCase().split('·')[0].trim();}
  function preserveHeaderAndReplace(activity,html){
    [...activity.children].forEach(node=>{
      if(node.matches('.tt99-preview-replace,.tt99-game-activity-head,.tt99-game-instruction'))return;
      node.remove();
    });
    activity.insertAdjacentHTML('beforeend',html);
  }

  /* ----------------------------------------------------------------------
     Operation Codebreaker
     ---------------------------------------------------------------------- */
  function solveLock(lock){
    const equation=lock.querySelector('.tt99-lock-equation');
    if(!equation)return [];
    const answerOps=[...equation.querySelectorAll('.tt99-op-slot')].map(x=>normalizeOp(x.textContent.trim())).filter(Boolean);
    if(answerOps.length)return answerOps;
    const raw=equation.textContent.replace(/,/g,'');
    const nums=(raw.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
    if(nums.length===3){
      const [a,b,result]=nums;
      const hits=OPS.filter(op=>near(evalOp(a,op,b),result));
      return hits.length===1?[hits[0]]:hits.slice(0,1);
    }
    if(nums.length>=4){
      const [a,b,c,result]=nums;
      const hits=[];
      for(const op1 of OPS)for(const op2 of OPS){const first=evalOp(a,op1,b),value=evalOp(first,op2,c);if(near(value,result))hits.push([op1,op2]);}
      return hits.length===1?hits[0]:(hits[0]||[]);
    }
    return [];
  }
  function codePool(diff,solved){
    const set=new Set(['+','−']);
    solved.flat().forEach(op=>set.add(normalizeOp(op)));
    if(diff==='standard'||diff==='challenge')set.add('×');
    if(diff==='challenge'||set.has('÷'))set.add('÷');
    return OPS.filter(op=>set.has(op));
  }
  function mapping(seed,pool){const digits=shuffledDigits(seed);return Object.fromEntries(pool.map((op,i)=>[op,digits[i]]));}
  function choiceHTML(map,pool){return pool.map(op=>`<span class="tt99-v135-code-choice"><span>${esc(op)}</span><b>${map[op]}</b></span>`).join('');}
  function redesignOperation(activity){
    if(activity.dataset.v135Operation)return;
    activity.dataset.v135Operation='1';activity.classList.add('tt99-v135-redesigned');
    const answer=isAnswer(activity),diff=difficultyOf(activity),oldLocks=[...activity.querySelectorAll('.tt99-operation-lock')];
    if(!oldLocks.length)return;
    const solved=oldLocks.map(solveLock),pool=codePool(diff,solved),allText=oldLocks.map(x=>x.querySelector('.tt99-lock-equation')?.textContent||'').join('|'),sharedMap=mapping(`shared:${allText}`,pool),codeDigits=[];
    let slotNo=0;
    const cards=oldLocks.map((lock,rowIndex)=>{
      const eq=lock.querySelector('.tt99-lock-equation'),ops=solved[rowIndex]||[],rowMap=diff==='easy'?sharedMap:mapping(`${allText}:${rowIndex}`,pool),children=[...(eq?.children||[])];let opIndex=0,equation='';
      if(children.length){
        for(const child of children){
          if(child.classList.contains('tt99-op-slot')){const op=ops[opIndex++]||'';equation+=`<span class="tt99-v135-op-blank ${answer?'is-answer':''}">${answer?esc(op):''}</span>`;if(op&&rowMap[op]!=null)codeDigits.push(rowMap[op]);slotNo++;}
          else equation+=`<span>${esc(child.textContent)}</span>`;
        }
      }else equation=esc(eq?.textContent||'');
      const choices=diff==='easy'?'':`<div class="tt99-v135-lock-choices">${choiceHTML(rowMap,pool)}</div>`;
      return `<div class="tt99-v135-lock-card"><span class="tt99-v135-lock-id">${rowIndex+1}</span><div class="tt99-v135-lock-content"><div class="tt99-v135-lock-equation">${equation}</div>${choices}</div></div>`;
    }).join('');
    const shared=diff==='easy'?`<div class="tt99-v135-code-key"><strong>Code key</strong><div class="tt99-v135-code-key-list">${choiceHTML(sharedMap,pool)}</div></div>`:'';
    const boxes=codeDigits.map((digit,i)=>`<span class="tt99-v135-code-pos"><small>${i+1}</small><span class="tt99-v135-code-box ${answer?'is-answer':''}">${answer?digit:''}</span></span>`).join('');
    const html=`<div class="tt99-v135-puzzle-body">${shared}<div class="tt99-v135-lock-grid">${cards}</div><div class="tt99-v135-final-code"><strong>Unlock code</strong><div class="tt99-v135-code-boxes">${boxes}</div></div></div>`;
    const instruction=activity.querySelector('.tt99-game-instruction');if(instruction)instruction.textContent=diff==='easy'?'Work out each missing operation, use the code key to turn it into a digit, then crack the final code.':'Work out each missing operation. Each lock has its own operation-to-digit key; use the correct digit to build the final code.';
    preserveHeaderAndReplace(activity,html);
  }

  /* ----------------------------------------------------------------------
     Symbol Equations
     ---------------------------------------------------------------------- */
  function solveSymbolValues(lines){
    const values={};
    for(let pass=0;pass<8;pass++){
      let changed=false;
      for(const original of lines){
        const line=original.replace(/\s+/g,' ').trim();let m;
        if((m=line.match(/^([ABC]) \+ \1 = (-?\d+(?:\.\d+)?)$/))){const v=Number(m[2])/2;if(values[m[1]]==null){values[m[1]]=v;changed=true;}continue;}
        if((m=line.match(/^(\d+)\s*([ABC]) = (-?\d+(?:\.\d+)?)$/))){const v=Number(m[3])/Number(m[1]);if(values[m[2]]==null){values[m[2]]=v;changed=true;}continue;}
        if((m=line.match(/^([ABC]) \+ ([ABC]) = (-?\d+(?:\.\d+)?)$/))){const a=m[1],b=m[2],t=Number(m[3]);if(values[a]!=null&&values[b]==null){values[b]=t-values[a];changed=true;}else if(values[b]!=null&&values[a]==null){values[a]=t-values[b];changed=true;}continue;}
        if((m=line.match(/^([ABC]) \+ (\d+)\s*([ABC]) = (-?\d+(?:\.\d+)?)$/))){const a=m[1],k=Number(m[2]),b=m[3],t=Number(m[4]);if(values[a]!=null&&values[b]==null){values[b]=(t-values[a])/k;changed=true;}else if(values[b]!=null&&values[a]==null){values[a]=t-k*values[b];changed=true;}continue;}
      }
      if(!changed)break;
    }
    return values;
  }
  function symbolHTML(letter){return `<span class="tt99-v135-symbol" role="img" aria-label="symbol ${letter}">${GLYPHS[letter]||esc(letter)}</span>`;}
  function symbolise(text){
    let out=esc(text).replace(/([0-9])([ABC])/g,'$1 × $2');
    out=out.replace(/[ABC]/g,m=>symbolHTML(m));
    return out;
  }
  function targetFor(diff,names,values){
    const a=names[0],b=names[1],c=names[2];
    if(diff==='challenge'&&c&&values[a]!=null&&values[b]!=null&&values[c]!=null)return {html:`${symbolHTML(a)} + ${symbolHTML(b)} × ${symbolHTML(c)}`,answer:values[a]+values[b]*values[c],hint:'Multiply before you add.'};
    if(diff==='challenge'&&values[a]!=null&&values[b]!=null)return {html:`${symbolHTML(a)} × ${symbolHTML(b)} − ${symbolHTML(a)}`,answer:values[a]*values[b]-values[a],hint:'Work through the operations carefully.'};
    if(c&&values[a]!=null&&values[b]!=null&&values[c]!=null)return {html:`${symbolHTML(a)} + ${symbolHTML(b)} + ${symbolHTML(c)}`,answer:values[a]+values[b]+values[c],hint:'Use all three decoded values.'};
    if(diff==='standard'&&values[a]!=null&&values[b]!=null)return {html:`${symbolHTML(a)} + ${symbolHTML(b)} + ${symbolHTML(a)}`,answer:values[a]+values[b]+values[a],hint:'A symbol keeps the same value every time.'};
    return {html:`${symbolHTML(a)} + ${symbolHTML(b)}`,answer:(values[a]??0)+(values[b]??0),hint:'Decode both symbols first.'};
  }
  function redesignSymbols(activity){
    if(activity.dataset.v135Symbols)return;
    activity.dataset.v135Symbols='1';activity.classList.add('tt99-v135-redesigned');
    const answer=isAnswer(activity),diff=difficultyOf(activity),old=[...activity.querySelectorAll('.tt99-equation-list>div')];if(!old.length)return;
    const lines=old.map(x=>x.textContent.trim()),names=[...new Set((lines.join(' ').match(/[ABC]/g)||[]))],values=solveSymbolValues(lines),target=targetFor(diff,names,values);
    const clues=lines.map((line,i)=>`<div class="tt99-v135-symbol-clue"><span>Clue ${i+1}</span><div class="tt99-v135-symbol-equation">${symbolise(line)}</div></div>`).join('');
    const valueRow=names.map(n=>`<span class="tt99-v135-symbol-value">${symbolHTML(n)} = <b>${answer&&values[n]!=null?esc(values[n]):'___'}</b></span>`).join('');
    const html=`<div class="tt99-v135-puzzle-body"><div class="tt99-v135-symbol-board"><div class="tt99-v135-symbol-clues">${clues}</div><div class="tt99-v135-symbol-mystery"><small>Mystery value</small><div class="tt99-v135-symbol-target">${target.html}</div><span class="tt99-v135-mystery-answer ${answer?'is-answer':''}">${answer?esc(target.answer):'?'}</span><span class="tt99-v135-subtle">${esc(target.hint)}</span></div></div><div class="tt99-v135-symbol-values">${valueRow}</div></div>`;
    const instruction=activity.querySelector('.tt99-game-instruction');if(instruction)instruction.textContent='Use the clues to decode each symbol. Then use the values you found to solve the mystery expression.';
    preserveHeaderAndReplace(activity,html);
  }

  /* ----------------------------------------------------------------------
     Function Machines
     ---------------------------------------------------------------------- */
  function redesignMachine(activity){
    if(activity.dataset.v135Machine)return;
    activity.dataset.v135Machine='1';activity.classList.add('tt99-v135-redesigned');
    const rule=activity.querySelector('.tt99-machine-rule');if(!rule)return;
    const ops=[...rule.querySelectorAll('b')].map(x=>normalizeOp(x.textContent.trim()));if(!ops.length)return;
    const stages=ops.map((op,i)=>`<span class="tt99-v135-machine-arrow">→</span><div class="tt99-v135-machine-stage"><small>Step ${i+1}</small><b>${esc(op)}</b></div>`).join('');
    const machine=`<div class="tt99-v135-machine"><div class="tt99-v135-machine-terminal"><small>NUMBER</small><b>Input</b></div>${stages}<span class="tt99-v135-machine-arrow">→</span><div class="tt99-v135-machine-terminal"><small>RESULT</small><b>Output</b></div></div><p class="tt99-v135-machine-reverse">Missing an input? Start at the output and undo the machine steps in reverse order.</p>`;
    rule.insertAdjacentHTML('afterend',machine);
  }

  /* ----------------------------------------------------------------------
     Balance the Equation
     ---------------------------------------------------------------------- */
  function expressionHTML(text){
    const safe=esc(text).replace(/□|\?/g,'__TT99BLANK__');
    return safe.replace(/__TT99BLANK__/g,'<span class="tt99-v135-balance-blank">?</span>');
  }
  function redesignBalance(activity){
    if(activity.dataset.v135Balance)return;
    activity.dataset.v135Balance='1';activity.classList.add('tt99-v135-redesigned');
    const answer=isAnswer(activity),rows=[...activity.querySelectorAll('.tt99-equation-list.big>div')];if(!rows.length)return;
    const cards=rows.map((row,i)=>{const text=row.textContent.trim(),parts=text.split('=');if(parts.length<2)return `<div>${esc(text)}</div>`;return `<div class="tt99-v135-balance-card ${answer?'is-answer':''}"><div class="tt99-v135-pan"><span>${expressionHTML(parts[0].trim())}</span></div><div class="tt99-v135-balance-centre"><b>=</b></div><div class="tt99-v135-pan"><span>${expressionHTML(parts.slice(1).join('=').trim())}</span></div></div>`;}).join('');
    const html=`<div class="tt99-v135-puzzle-body"><div class="tt99-v135-balance-list">${cards}</div></div>`;
    const instruction=activity.querySelector('.tt99-game-instruction');if(instruction)instruction.textContent='Keep every scale balanced. Work out the missing value so the left and right pans have exactly the same total.';
    preserveHeaderAndReplace(activity,html);
  }

  function enhance(){
    root.querySelectorAll('.tt99-operationgrid').forEach(redesignOperation);
    root.querySelectorAll('.tt99-symbols').forEach(redesignSymbols);
    root.querySelectorAll('.tt99-functionmachine').forEach(redesignMachine);
    root.querySelectorAll('.tt99-balance').forEach(redesignBalance);
  }
  function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}
  const observer=new MutationObserver(schedule);observer.observe(root,{childList:true,subtree:true});
  schedule();
})();
