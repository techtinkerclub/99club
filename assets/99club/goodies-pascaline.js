(function(G){
'use strict';
if(!G)return;
const {q,qa,esc,setPanels}=G;
function pascalineTool(){
  const places=[1000,100,10,1],labels=['Thousands','Hundreds','Tens','Ones'];
  let digits=[0,0,0,0],helpOpen=false;
  function value(){return digits.reduce((s,d,i)=>s+d*places[i],0)}
  function addOne(index){
    for(let i=index;i>=0;i--){
      digits[i]++;
      if(digits[i]<10)break;
      digits[i]=0;
    }
    draw();bind();
  }
  function subOne(index){
    for(let i=index;i>=0;i--){
      digits[i]--;
      if(digits[i]>=0)break;
      digits[i]=9;
    }
    draw();bind();
  }
  function wheel(i){
    const d=digits[i],prev=(d+9)%10,next=(d+1)%10;
    return '<div class="gd-pascaline-wheel-wrap"><span>'+labels[i]+'</span><div class="gd-pascaline-wheel" aria-label="'+labels[i]+' wheel showing '+d+'"><small>'+prev+'</small><strong>'+d+'</strong><small>'+next+'</small></div><div class="gd-pascaline-wheel-buttons"><button type="button" data-pa-sub="'+i+'" aria-label="Turn '+labels[i]+' wheel backwards">−</button><button type="button" data-pa-add="'+i+'" aria-label="Turn '+labels[i]+' wheel forwards">+</button></div></div>';
  }
  function draw(){
    const help='<div class="gd-history-help" id="pa-help"'+(helpOpen?'':' hidden')+'><div class="gd-history-help__card"><button class="gd-history-help__close" id="pa-help-close" type="button" aria-label="Close instructions">×</button><h3>Pascaline</h3><p>A mechanical calculator uses linked numbered wheels. Turning a wheel through 9 back to 0 carries one step into the wheel on its left.</p><ol><li>Each wheel is one decimal place.</li><li>Turn a wheel forward with + to add its place value.</li><li>When a wheel moves from 9 to 0, the next wheel automatically advances by 1.</li><li>Turn backwards with − to practise subtraction and borrowing.</li></ol><div class="gd-history-example"><strong>Worked example</strong><p>To calculate 28 + 15, first show 28. Turn the tens wheel once to add 10, giving 38. Then turn the ones wheel five times. When 9 rolls to 0 the tens wheel carries automatically, finishing at 43.</p></div></div></div>';
    q('#gd-stage').innerHTML='<div class="gd-history-stage"><button class="gd-history-help-btn" id="pa-help-open" type="button">? <span>How to use</span></button><div class="gd-pascaline"><div class="gd-pascaline-plate"><div class="gd-pascaline-name">PASCALINE</div><div class="gd-pascaline-wheels">'+digits.map((_,i)=>wheel(i)).join('')+'</div><div class="gd-pascaline-gears">'+Array.from({length:7},(_,i)=>'<i style="--i:'+i+'">✺</i>').join('')+'</div></div><div class="gd-history-readout">Value <strong>'+value().toLocaleString('en-GB')+'</strong></div></div>'+help+'</div>';
  }
  function bind(){
    qa('[data-pa-add]',q('#gd-stage')).forEach(b=>b.onclick=()=>addOne(+b.dataset.paAdd));
    qa('[data-pa-sub]',q('#gd-stage')).forEach(b=>b.onclick=()=>subOne(+b.dataset.paSub));
    const open=q('#pa-help-open');if(open)open.onclick=()=>{helpOpen=true;draw();bind()};
    const close=q('#pa-help-close');if(close)close.onclick=()=>{helpOpen=false;draw();bind()};
    const clear=q('#pa-clear');if(clear)clear.onclick=()=>{digits=[0,0,0,0];draw();bind()};
    const ex=q('#pa-example');if(ex)ex.onclick=()=>{digits=[0,0,2,8];draw();bind()};
  }
  setPanels('<div class="gd-history-controls"><div class="gd-history-kicker">History of Maths</div><h3>Pascaline</h3><div class="gd-row"><button class="gd-btn gd-btn--primary" id="pa-example" type="button">Show 28</button><button class="gd-btn" id="pa-clear" type="button">Reset wheels</button></div><p class="gd-help">Turn the numbered wheels with + and −. Carry and borrowing happen automatically between adjacent decimal wheels.</p><div class="gd-history-note"><strong>History:</strong> Blaise Pascal designed mechanical calculating machines in the seventeenth century using linked decimal wheels.</div></div>','');
  draw();bind();
}
G.pascalineTool=pascalineTool;
})(window.TT99Goodies);