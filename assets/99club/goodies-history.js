(function(G){
'use strict';
if(!G)return;
const {q,qa,esc,clamp,num,setPanels}=G;

const HELP={
  western:{
    title:'Western abacus',
    intro:'A bead frame for counting and arithmetic. Each row has ten beads. In this version the rows represent ones, tens, hundreds and thousands.',
    steps:[
      'Move beads from the right side to the left to count them.',
      'Read each row as a digit: 4 beads in the hundreds row means 400.',
      'For addition, move across more beads. If a row reaches 10, reset that row and move 1 bead on the row above.',
      'For subtraction, move beads back to the right. If there are not enough, exchange 1 bead from the row above for 10 on this row.'
    ],
    example:'Example: 247 + 36. Show 247. Add 3 tens to make 277, then add 6 ones: 7 + 6 = 13, so leave 3 ones and carry 1 ten. The abacus shows 283.'
  },
  soroban:{
    title:'Japanese soroban',
    intro:'Each vertical rod is one place-value column. A lower bead touching the beam is worth 1; the upper bead touching the beam is worth 5.',
    steps:[
      'Only beads touching the central beam count.',
      'Four lower beads can make 0–4. Add the upper bead for 5–9.',
      'Columns are read from left to right as thousands, hundreds, tens and ones.',
      'When a column passes 9, clear it and carry 1 to the column on the left.'
    ],
    example:'Example: show 347. In hundreds, use 3 lower beads. In tens, use 4 lower beads. In ones, use the 5-bead plus 2 lower beads. To add 6, 7 + 6 = 13, so the ones become 3 and 1 ten is carried.'
  },
  board:{
    title:'Reckoning board',
    intro:'A reckoning board uses loose counters on place-value lines or spaces. It is the physical ancestor of many place-value teaching boards.',
    steps:[
      'Place counters in the I, X, C and M columns for ones, tens, hundreds and thousands.',
      'Each counter is worth the value of its column.',
      'Ten counters in one column can be exchanged for one counter in the next column to the left.',
      'For subtraction, reverse the process: exchange one higher counter for ten lower counters when needed.'
    ],
    example:'Example: 126 is 1 counter in C, 2 in X and 6 in I. Add 85 by adding 8 tens and 5 ones. Exchange 10 ones for 1 ten, then 10 tens for 1 hundred. The result is 211.'
  },
  rods:{
    title:'Chinese counting rods',
    intro:'Counting rods represented decimal place value using arrangements of small rods. Alternating vertical and horizontal forms helped neighbouring digits remain distinct.',
    steps:[
      'Each column is a decimal place: thousands, hundreds, tens and ones.',
      'Choose a digit from 0–9 in each column; the rods show the traditional alternating orientation.',
      'Read the columns together as one number.',
      'For arithmetic, add or remove values column by column, regrouping ten in one place as one in the next.'
    ],
    example:'Example: build 372. The hundreds column shows 3, tens shows 7 and ones shows 2. Add 48: ones become 10, so write 0 and carry 1 ten; tens become 12, so write 2 and carry 1 hundred. Result: 420.'
  },
  napier:{
    title:"Napier's Bones",
    intro:"John Napier's calculating rods turn multiplication into reading and adding along diagonals.",
    steps:[
      'Choose the rods matching the digits of the number you want to multiply.',
      'Choose the multiplier row from 1 to 9.',
      'Read the two-digit product in each rod cell.',
      'Add along the diagonals from right to left, carrying when a diagonal total is 10 or more.'
    ],
    example:'Example: 467 × 3. The row gives 12 | 18 | 21. Read diagonally: 1, then 2+8=10, then 1+2 plus the carry, giving 1401. The calculator strip below verifies the result.'
  },
  slide:{
    title:'Slide rule',
    intro:'A slide rule multiplies and divides by adding and subtracting distances on logarithmic scales.',
    steps:[
      'For multiplication a × b, put 1 on the C scale above a on the D scale.',
      'Find b on the C scale.',
      'Read the answer directly below it on the D scale.',
      'The scales show significant digits, so you use estimation to decide whether the answer is 2.4, 24, 240, and so on.'
    ],
    example:'Example: 2 × 3. Align C=1 above D=2. Find C=3; directly below it D reads 6. For 20 × 3, the same position gives significant digits 6, and estimation tells us the answer is 60.'
  }
};

function helpButton(kind){
  return '<button class="gd-history-help-btn" type="button" data-history-help="'+kind+'" aria-label="How to use this device">? <span>How to use</span></button>';
}
function helpPanel(kind){
  const h=HELP[kind];
  return '<div class="gd-history-help" data-history-help-panel="'+kind+'" hidden><div class="gd-history-help__card"><button class="gd-history-help__close" type="button" aria-label="Close instructions">×</button><h3>'+esc(h.title)+'</h3><p>'+esc(h.intro)+'</p><ol>'+h.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol><div class="gd-history-example"><strong>Worked example</strong><p>'+esc(h.example)+'</p></div></div></div>';
}
function bindHelp(kind){
  const open=q('[data-history-help="'+kind+'"]'),panel=q('[data-history-help-panel="'+kind+'"]');
  if(!open||!panel)return;
  const close=()=>{panel.hidden=true;open.focus()};
  open.onclick=()=>{panel.hidden=false;panel.querySelector('.gd-history-help__close')?.focus()};
  panel.querySelector('.gd-history-help__close').onclick=close;
  panel.addEventListener('click',e=>{if(e.target===panel)close()});
}
function historyControls(title,body,history){
  return '<div class="gd-history-controls"><div class="gd-history-kicker">History of Maths</div><h3>'+esc(title)+'</h3>'+body+(history?'<div class="gd-history-note"><strong>History:</strong> '+history+'</div>':'')+'</div>';
}
function stageWrap(kind,inner){
  return '<div class="gd-history-stage">'+helpButton(kind)+inner+helpPanel(kind)+'</div>';
}

function westernAbacus(){
  const rows=[
    {name:'Thousands',value:1000},{name:'Hundreds',value:100},{name:'Tens',value:10},{name:'Ones',value:1}
  ];
  let counts=[0,0,0,0];
  function value(){return counts.reduce((s,n,i)=>s+n*rows[i].value,0)}
  function draw(){
    const device='<div class="gd-western-abacus" role="group" aria-label="Western abacus">'+
      '<div class="gd-abacus-brand">COUNTING FRAME</div>'+
      rows.map((r,i)=>'<div class="gd-western-row"><span class="gd-western-label">'+r.name+'</span><div class="gd-western-rail" data-wa-row="'+i+'">'+
        Array.from({length:10},(_,j)=>'<button type="button" class="gd-western-bead '+(j<counts[i]?'is-counted':'')+'" data-wa-row="'+i+'" data-wa-bead="'+j+'" aria-label="'+r.name+' bead '+(j+1)+'"></button>').join('')+
      '</div><b>'+counts[i]+'</b></div>').join('')+
      '<div class="gd-history-readout">Value <strong>'+value().toLocaleString('en-GB')+'</strong></div></div>';
    q('#gd-stage').innerHTML=stageWrap('western',device);
    qa('[data-wa-bead]',q('#gd-stage')).forEach(b=>b.onclick=()=>{const i=+b.dataset.waRow,j=+b.dataset.waBead;counts[i]=j<counts[i]&&j===counts[i]-1?j:j+1;draw();bind()});
    bindHelp('western');
  }
  function bind(){
    const clear=q('#wa-clear');if(clear)clear.onclick=()=>{counts=[0,0,0,0];draw();bind()};
    const random=q('#wa-random');if(random)random.onclick=()=>{counts=counts.map(()=>Math.floor(Math.random()*10));draw();bind()};
  }
  setPanels(historyControls('Western abacus','<div class="gd-row"><button class="gd-btn gd-btn--primary" id="wa-random" type="button">Random number</button><button class="gd-btn" id="wa-clear" type="button">Clear</button></div><p class="gd-help">Tap a bead to move that bead and all beads before it to the counting side.</p>','Bead frames have existed in many forms for centuries. This version is a classroom-style Western counting frame.'),'');
  draw();bind();
}

function soroban(){
  const places=[1000,100,10,1],labels=['1000','100','10','1']; let digits=[0,0,0,0];
  function draw(){
    const rods=places.map((p,i)=>{
      const d=digits[i],heaven=d>=5,earth=d%5;
      return '<div class="gd-soroban-rod" data-so-col="'+i+'"><span class="gd-so-place">'+labels[i]+'</span>'+
        '<button class="gd-so-heaven '+(heaven?'is-active':'')+'" data-so-heaven="'+i+'" type="button" aria-label="Toggle five bead"></button>'+
        '<span class="gd-so-beam"></span>'+
        '<div class="gd-so-earth">'+Array.from({length:4},(_,j)=>'<button type="button" class="gd-so-earth-bead '+(j<earth?'is-active':'')+'" data-so-earth="'+i+'" data-so-index="'+j+'" aria-label="Lower bead '+(j+1)+'"></button>').join('')+'</div></div>';
    }).join('');
    const value=digits.reduce((s,d,i)=>s+d*places[i],0);
    q('#gd-stage').innerHTML=stageWrap('soroban','<div class="gd-soroban"><div class="gd-soroban-frame">'+rods+'<div class="gd-soroban-divider"></div></div><div class="gd-history-readout">Value <strong>'+value.toLocaleString('en-GB')+'</strong></div></div>');
    qa('[data-so-heaven]',q('#gd-stage')).forEach(b=>b.onclick=()=>{const i=+b.dataset.soHeaven;digits[i]=digits[i]>=5?digits[i]-5:digits[i]+5;draw();bind()});
    qa('[data-so-earth]',q('#gd-stage')).forEach(b=>b.onclick=()=>{const i=+b.dataset.soEarth,j=+b.dataset.soIndex,cur=digits[i]%5;digits[i]=(digits[i]>=5?5:0)+(j<cur&&j===cur-1?j:j+1);draw();bind()});
    bindHelp('soroban');
  }
  function bind(){
    q('#so-clear').onclick=()=>{digits=[0,0,0,0];draw();bind()};
    q('#so-example').onclick=()=>{digits=[0,3,4,7];draw();bind()};
  }
  setPanels(historyControls('Japanese soroban','<div class="gd-row"><button class="gd-btn gd-btn--primary" id="so-example" type="button">Show 347</button><button class="gd-btn" id="so-clear" type="button">Clear</button></div><p class="gd-help">Tap beads to move them towards or away from the central reckoning beam.</p>','The soroban developed in Japan from earlier East Asian abacus forms and is still used for arithmetic practice.'),'');
  draw();bind();
}

function reckoningBoard(){
  const cols=[{l:'M',n:'Thousands',v:1000},{l:'C',n:'Hundreds',v:100},{l:'X',n:'Tens',v:10},{l:'I',n:'Ones',v:1}];
  let counts=[0,0,0,0];
  function total(){return counts.reduce((s,n,i)=>s+n*cols[i].v,0)}
  function draw(){
    const board='<div class="gd-reckoning"><div class="gd-reckoning-title">RECKONING TABLE</div><div class="gd-reckoning-grid">'+cols.map((c,i)=>
      '<div class="gd-reckoning-col" data-rb-col="'+i+'"><div class="gd-reckoning-heading"><b>'+c.l+'</b><span>'+c.n+'</span></div><div class="gd-reckoning-space">'+Array.from({length:counts[i]},(_,j)=>'<button type="button" class="gd-reckoning-counter" data-rb-remove="'+i+'" data-rb-index="'+j+'" aria-label="Remove '+c.n+' counter"></button>').join('')+'<button type="button" class="gd-reckoning-add" data-rb-add="'+i+'">+ counter</button></div></div>'
    ).join('')+'</div><div class="gd-history-readout">Value <strong>'+total().toLocaleString('en-GB')+'</strong></div></div>';
    q('#gd-stage').innerHTML=stageWrap('board',board);
    qa('[data-rb-add]',q('#gd-stage')).forEach(b=>b.onclick=()=>{counts[+b.dataset.rbAdd]++;draw();bind()});
    qa('[data-rb-remove]',q('#gd-stage')).forEach(b=>b.onclick=()=>{counts[+b.dataset.rbRemove]=Math.max(0,counts[+b.dataset.rbRemove]-1);draw();bind()});
    bindHelp('board');
  }
  function regroup(){
    for(let i=3;i>0;i--){const carry=Math.floor(counts[i]/10);counts[i]%=10;counts[i-1]+=carry}
    draw();bind();
  }
  function bind(){
    q('#rb-regroup').onclick=regroup;
    q('#rb-clear').onclick=()=>{counts=[0,0,0,0];draw();bind()};
    q('#rb-example').onclick=()=>{counts=[0,1,2,6];draw();bind()};
  }
  setPanels(historyControls('Reckoning board','<div class="gd-row"><button class="gd-btn gd-btn--primary" id="rb-example" type="button">Show 126</button><button class="gd-btn" id="rb-regroup" type="button">Regroup 10 → 1</button><button class="gd-btn" id="rb-clear" type="button">Clear</button></div><p class="gd-help">Add loose counters to the marked columns. Tap a counter to remove it.</p>','Loose counters on ruled boards or tables were used for calculation in Europe long before written arithmetic became commonplace.'),'');
  draw();bind();
}

function rodDigitSvg(d,vertical){
  d=clamp(Math.round(d),0,9); if(!d)return '<span class="gd-rod-zero">○</span>';
  const five=d>=5,ones=d%5, parts=[];
  const line=(x1,y1,x2,y2)=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" />';
  if(vertical){
    if(five)parts.push(line(8,6,46,6));
    for(let i=0;i<(five?ones+1:ones);i++){const x=12+i*8;parts.push(line(x,five?14:7,x,49))}
  }else{
    if(five)parts.push(line(6,8,6,46));
    for(let i=0;i<(five?ones+1:ones);i++){const y=12+i*8;parts.push(line(five?14:7,y,49,y))}
  }
  return '<svg viewBox="0 0 56 56" aria-hidden="true">'+parts.join('')+'</svg>';
}
function countingRods(){
  let digits=[0,3,7,2];
  const labels=['Thousands','Hundreds','Tens','Ones'];
  function value(){return +digits.join('')}
  function draw(){
    const cells=digits.map((d,i)=>'<div class="gd-rods-cell"><span>'+labels[i]+'</span><div class="gd-rods-mat">'+rodDigitSvg(d,i%2===0)+'</div><div class="gd-rods-stepper"><button type="button" data-cr-dec="'+i+'">−</button><b>'+d+'</b><button type="button" data-cr-inc="'+i+'">+</button></div></div>').join('');
    q('#gd-stage').innerHTML=stageWrap('rods','<div class="gd-counting-rods"><div class="gd-rods-grid">'+cells+'</div><div class="gd-history-readout">Number <strong>'+value().toLocaleString('en-GB')+'</strong></div></div>');
    qa('[data-cr-dec]',q('#gd-stage')).forEach(b=>b.onclick=()=>{const i=+b.dataset.crDec;digits[i]=(digits[i]+9)%10;draw();bind()});
    qa('[data-cr-inc]',q('#gd-stage')).forEach(b=>b.onclick=()=>{const i=+b.dataset.crInc;digits[i]=(digits[i]+1)%10;draw();bind()});
    bindHelp('rods');
  }
  function bind(){
    q('#cr-clear').onclick=()=>{digits=[0,0,0,0];draw();bind()};
    q('#cr-example').onclick=()=>{digits=[0,3,7,2];draw();bind()};
  }
  setPanels(historyControls('Chinese counting rods','<div class="gd-row"><button class="gd-btn gd-btn--primary" id="cr-example" type="button">Show 372</button><button class="gd-btn" id="cr-clear" type="button">Clear</button></div><p class="gd-help">Use + and − under each place to arrange the rods. Adjacent places alternate orientation.</p>','Counting rods were used in China for place-value computation. Written rod numerals alternated orientation by place to keep neighbouring digits clear.'),'');
  draw();bind();
}

function napierBones(){
  let number='467',mult=3;
  function digitCell(d,row){
    const p=d*row,t=Math.floor(p/10),o=p%10;
    return '<div class="gd-napier-cell"><span>'+t+'</span><i></i><b>'+o+'</b></div>';
  }
  function bone(d){
    return '<div class="gd-napier-bone"><div class="gd-napier-head">'+d+'</div>'+Array.from({length:9},(_,i)=>digitCell(+d,i+1)).join('')+'</div>';
  }
  function draw(){
    const product=(+number||0)*mult;
    q('#gd-stage').innerHTML=stageWrap('napier','<div class="gd-napier"><div class="gd-napier-row-index">'+Array.from({length:10},(_,i)=>'<span>'+(i||'×')+'</span>').join('')+'</div><div class="gd-napier-bones">'+number.split('').map(bone).join('')+'</div><div class="gd-napier-highlight">Use row <strong>'+mult+'</strong></div><div class="gd-history-readout">'+esc(number)+' × '+mult+' = <strong>'+product.toLocaleString('en-GB')+'</strong></div></div>');
    bindHelp('napier');
  }
  function bind(){
    const input=q('#nb-number'),sel=q('#nb-mult');
    input.oninput=()=>{number=(input.value.replace(/\D/g,'').slice(0,5)||'0');input.value=number;draw();bind()};
    sel.onchange=()=>{mult=+sel.value;draw();bind()};
  }
  setPanels(historyControls("Napier's Bones",'<label class="gd-field"><span>Number</span><input class="gd-input" id="nb-number" inputmode="numeric" maxlength="5" value="'+number+'"></label><label class="gd-field"><span>Multiply by</span><select class="gd-select" id="nb-mult">'+Array.from({length:9},(_,i)=>'<option value="'+(i+1)+'"'+(i+1===mult?' selected':'')+'>'+(i+1)+'</option>').join('')+'</select></label><p class="gd-help">Choose the rods by typing a number, then inspect the selected multiplication row and add its diagonals.</p>','John Napier described these numbered calculating rods in the early seventeenth century.'),'');
  draw();bind();
}

function slideRule(){
  let a=2,b=3;
  function pos(v){return Math.log10(v)*100}
  function ticks(cls,offset=0){
    let out=''; for(let n=10;n<=100;n++){const v=n/10,p=pos(v);if(v>10)break; const major=n%10===0||n%5===0; out+='<span class="'+cls+(major?' is-major':'')+'" style="left:'+p+'%"><i></i>'+(major?'<b>'+v.toFixed(v%1?1:0)+'</b>':'')+'</span>'} return out;
  }
  function draw(){
    const shift=pos(a),cursor=(shift+pos(b))%100,result=a*b;
    const cTransform='translateX('+shift+'%)';
    q('#gd-stage').innerHTML=stageWrap('slide','<div class="gd-slide-rule"><div class="gd-slide-body"><div class="gd-slide-scale gd-slide-d"><span class="gd-slide-label">D</span>'+ticks('gd-slide-tick')+'</div><div class="gd-slide-scale gd-slide-c" style="transform:'+cTransform+'"><span class="gd-slide-label">C</span>'+ticks('gd-slide-tick')+'</div><div class="gd-slide-cursor" style="left:'+cursor+'%"></div></div><div class="gd-history-readout">'+a+' × '+b+' = <strong>'+result.toLocaleString('en-GB',{maximumFractionDigits:3})+'</strong><small> Cursor shows the significant digits; estimate the power of ten.</small></div></div>');
    bindHelp('slide');
  }
  function bind(){
    const A=q('#sr-a'),B=q('#sr-b'),av=q('#sr-a-val'),bv=q('#sr-b-val');
    A.oninput=()=>{a=+A.value;av.textContent=a;draw();bind()};
    B.oninput=()=>{b=+B.value;bv.textContent=b;draw();bind()};
  }
  setPanels(historyControls('Slide rule','<label class="gd-field"><span>First factor: <b id="sr-a-val">'+a+'</b></span><input id="sr-a" type="range" min="1" max="9.9" step="0.1" value="'+a+'"></label><label class="gd-field"><span>Second factor: <b id="sr-b-val">'+b+'</b></span><input id="sr-b" type="range" min="1" max="9.9" step="0.1" value="'+b+'"></label><p class="gd-help">Move the factors and watch the C scale slide. The transparent cursor marks the product position.</p>','Slide rules became important calculating instruments after logarithms were introduced in the seventeenth century, and remained widely used until electronic calculators.'),'');
  draw();bind();
}

Object.assign(G,{westernAbacus,sorobanHistory,reckoningBoard,countingRods,napierBones,slideRule});
function sorobanHistory(){soroban()}
})(window.TT99Goodies);
