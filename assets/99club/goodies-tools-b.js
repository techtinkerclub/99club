(function(G){
'use strict';
if(!G)return;
const {q,qa,esc,clamp,num,gcd,field,btn,setPanels}=G;
function coordinateTool(){
  let points=[],selected=-1,drag=null,view=null;
  const undoStack=[],redoStack=[];
  const W=600,pad=42;

  function copyPoints(value=points){return value.map(p=>({x:p.x,y:p.y}))}
  function remember(snapshot=copyPoints()){
    undoStack.push(copyPoints(snapshot));
    if(undoStack.length>40)undoStack.shift();
    redoStack.length=0;
  }
  function undo(){
    if(!undoStack.length)return;
    redoStack.push(copyPoints());
    points=copyPoints(undoStack.pop());
    selected=-1;
    draw();
  }
  function redo(){
    if(!redoStack.length)return;
    undoStack.push(copyPoints());
    points=copyPoints(redoStack.pop());
    selected=-1;
    draw();
  }
  function config(){
    const four=!!q('#co-four')?.checked,min=four?-10:0,max=10;
    return{four,min,max,range:max-min,step:(W-2*pad)/(max-min)};
  }
  function visible(p,c=view||config()){
    return p&&p.x>=c.min&&p.x<=c.max&&p.y>=c.min&&p.y<=c.max;
  }
  function occupied(x,y,except=-1){
    return points.findIndex((p,i)=>i!==except&&p.x===x&&p.y===y);
  }
  function pointPx(p,c=view||config()){
    return{x:pad+(p.x-c.min)*c.step,y:pad+(c.max-p.y)*c.step};
  }
  function nearestCoord(e,svg,c=view||config()){
    const r=svg.getBoundingClientRect();
    const vx=(e.clientX-r.left)/Math.max(1,r.width)*W;
    const vy=(e.clientY-r.top)/Math.max(1,r.height)*W;
    return{
      x:clamp(Math.round(c.min+(vx-pad)/c.step),c.min,c.max),
      y:clamp(Math.round(c.max-(vy-pad)/c.step),c.min,c.max)
    };
  }
  function pointsText(){
    const list=points.map(p=>'('+p.x+', '+p.y+')').join(' · ')||'none';
    const hidden=points.filter(p=>!visible(p)).length;
    return'Points: '+list+(hidden?' · '+hidden+' outside this grid '+(hidden===1?'is':'are')+' hidden':'');
  }
  function updateGeometry(){
    qa('[data-co-point]',q('#gd-stage')).forEach(el=>{
      const i=+el.dataset.coPoint,p=points[i];if(!p||!visible(p))return;
      const v=pointPx(p);
      el.setAttribute('cx',v.x);el.setAttribute('cy',v.y);
      el.dataset.coPos=p.x+','+p.y;
      el.classList.toggle('is-selected',i===selected);
      el.setAttribute('aria-label','Point '+p.x+', '+p.y+'. Drag to move.');
    });
    qa('[data-co-label]',q('#gd-stage')).forEach(el=>{
      const i=+el.dataset.coLabel,p=points[i];if(!p||!visible(p))return;
      const v=pointPx(p);
      el.setAttribute('x',v.x+10);el.setAttribute('y',v.y-10);
      el.textContent='('+p.x+', '+p.y+')';
    });
    const readout=q('#co-readout');if(readout)readout.textContent=pointsText();
    const context=q('#co-context-text');
    if(context)context.textContent=selected>=0&&points[selected]&&visible(points[selected])
      ? 'Selected ('+points[selected].x+', '+points[selected].y+')'
      : 'Tap the grid to plot a point. Drag an existing point to move it.';
    const del=q('[data-co-delete]');
    if(del)del.hidden=!(selected>=0&&points[selected]&&visible(points[selected]));
    syncControls();
  }
  function movePoint(index,x,y,withHistory=true){
    const c=view||config(),p=points[index];
    if(!p||x<c.min||x>c.max||y<c.min||y>c.max||occupied(x,y,index)>=0)return false;
    if(p.x===x&&p.y===y)return false;
    if(withHistory)remember();
    points[index]={x,y};
    selected=index;
    return true;
  }
  function deletePoint(index){
    if(index<0||index>=points.length)return;
    remember();
    points.splice(index,1);
    selected=-1;
    draw();
  }
  function syncControls(){
    const u=q('#co-undo'),r=q('#co-redo'),clear=q('#co-clear');
    if(u)u.disabled=!undoStack.length;
    if(r)r.disabled=!redoStack.length;
    if(clear)clear.disabled=!points.length;
  }
  function addOrSelect(x,y){
    const existing=occupied(x,y);
    if(existing>=0){selected=existing;draw();return;}
    remember();
    points.push({x,y});
    selected=points.length-1;
    draw();
  }
  function bindStage(){
    const svg=q('#co-svg');
    svg.onclick=e=>{
      if(e.target.closest&&e.target.closest('[data-co-point]'))return;
      const p=nearestCoord(e,svg);
      addOrSelect(p.x,p.y);
    };
    qa('[data-co-point]',q('#gd-stage')).forEach(point=>{
      point.onpointerdown=e=>{
        if(e.button!=null&&e.button!==0)return;
        e.stopPropagation();
        const index=+point.dataset.coPoint;
        selected=index;
        drag={index,pointerId:e.pointerId,start:copyPoints(),moved:false};
        try{point.setPointerCapture(e.pointerId)}catch(_){}
        updateGeometry();
      };
      point.onpointermove=e=>{
        if(!drag||drag.pointerId!==e.pointerId||drag.index!==+point.dataset.coPoint)return;
        const target=nearestCoord(e,svg),p=points[drag.index];
        if(!p||(p.x===target.x&&p.y===target.y)||occupied(target.x,target.y,drag.index)>=0)return;
        if(!drag.moved){
          remember(drag.start);
          drag.moved=true;
        }
        points[drag.index]={x:target.x,y:target.y};
        selected=drag.index;
        updateGeometry();
      };
      const finish=e=>{
        if(!drag||drag.pointerId!==e.pointerId||drag.index!==+point.dataset.coPoint)return;
        const moved=drag.moved;
        drag=null;
        if(moved)draw();else{selected=+point.dataset.coPoint;draw();}
      };
      point.onpointerup=finish;
      point.onpointercancel=finish;
      point.onkeydown=e=>{
        const index=+point.dataset.coPoint,p=points[index];if(!p)return;
        if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deletePoint(index);return;}
        let x=p.x,y=p.y;
        if(e.key==='ArrowLeft')x--;else if(e.key==='ArrowRight')x++;
        else if(e.key==='ArrowUp')y++;else if(e.key==='ArrowDown')y--;else return;
        e.preventDefault();
        const c=view||config();
        x=clamp(x,c.min,c.max);y=clamp(y,c.min,c.max);
        if(movePoint(index,x,y,true))draw();
      };
    });
    const del=q('[data-co-delete]');
    if(del)del.onclick=()=>deletePoint(selected);
  }
  function draw(){
    view=config();
    if(selected>=0&&!visible(points[selected]))selected=-1;
    let lines='',labels='';
    for(let v=view.min;v<=view.max;v++){
      const x=pad+(v-view.min)*view.step,y=pad+(view.max-v)*view.step;
      lines+='<line class="gd-gridline" x1="'+x+'" y1="'+pad+'" x2="'+x+'" y2="'+(W-pad)+'"></line>'+
        '<line class="gd-gridline" x1="'+pad+'" y1="'+y+'" x2="'+(W-pad)+'" y2="'+y+'"></line>';
      const labelEvery=view.four?2:1;
      if(v%labelEvery===0){
        labels+='<text x="'+x+'" y="'+(W-pad+22)+'" text-anchor="middle" class="gd-co-axis-label">'+v+'</text>'+
          '<text x="'+(pad-12)+'" y="'+(y+4)+'" text-anchor="end" class="gd-co-axis-label">'+v+'</text>';
      }
    }
    const zeroX=pad+(0-view.min)*view.step,zeroY=pad+(view.max-0)*view.step;
    const plotted=points.map((p,i)=>{
      if(!visible(p))return'';
      const v=pointPx(p);
      return '<circle class="gd-point gd-co-point'+(i===selected?' is-selected':'')+'" data-co-point="'+i+'" data-co-pos="'+p.x+','+p.y+'" tabindex="0" role="button" aria-label="Point '+p.x+', '+p.y+'. Drag to move." cx="'+v.x+'" cy="'+v.y+'" r="9"></circle>'+
        '<text class="gd-co-point-label" data-co-label="'+i+'" x="'+(v.x+10)+'" y="'+(v.y-10)+'">('+p.x+', '+p.y+')</text>';
    }).join('');
    q('#gd-stage').innerHTML='<div class="gd-vis gd-coord gd-coordinate-direct">'+
      '<svg id="co-svg" data-co-min="'+view.min+'" data-co-max="'+view.max+'" viewBox="0 0 '+W+' '+W+'" aria-label="Interactive coordinate grid">'+
        lines+
        '<line class="gd-axis" x1="'+zeroX+'" y1="'+pad+'" x2="'+zeroX+'" y2="'+(W-pad)+'"></line>'+
        '<line class="gd-axis" x1="'+pad+'" y1="'+zeroY+'" x2="'+(W-pad)+'" y2="'+zeroY+'"></line>'+
        labels+plotted+
      '</svg>'+
      '<div class="gd-co-context"><span id="co-context-text">'+(selected>=0&&points[selected]?'Selected ('+points[selected].x+', '+points[selected].y+')':'Tap the grid to plot a point. Drag an existing point to move it.')+'</span><button type="button" data-co-delete'+(selected>=0&&points[selected]?'':' hidden')+'>Delete point</button></div>'+
      '<div class="gd-readout" id="co-readout">'+pointsText()+'</div>'+
    '</div>';
    bindStage();
    syncControls();
  }

  setPanels(
    field('Grid','<label class="gd-row"><input id="co-four" type="checkbox"> Four quadrants (−10 to 10)</label>')+
    '<div class="gd-row">'+btn('Undo','co-undo')+btn('Redo','co-redo')+btn('Clear points','co-clear')+'</div>'+
    '<p class="gd-help">Tap an intersection to plot a point, then drag the point to move it. Switching grid mode no longer deletes your work; points outside the current grid are kept and reappear when they fit again.</p>',
    ''
  );
  q('#co-four').onchange=()=>{selected=-1;draw()};
  q('#co-undo').onclick=undo;
  q('#co-redo').onclick=redo;
  q('#co-clear').onclick=()=>{if(!points.length)return;remember();points=[];selected=-1;draw()};
  draw();
}

function measurementTool(){function draw(){const cm=clamp(num(q('#me-cm').value,12.3),0,30),mm=Math.round(cm*10),m=cm/100;let ticks='';for(let i=0;i<=300;i++){const p=i/300*100,h=i%10===0?55:i%5===0?35:22;ticks+=`<span class="gd-ruler-tick" style="left:${p}%;height:${h}px"></span>`;if(i%10===0)ticks+=`<span class="gd-ruler-num" style="left:${p}%">${i/10}</span>`}q('#gd-stage').innerHTML=`<div class="gd-vis"><div class="gd-ruler">${ticks}<span class="gd-ruler-marker" style="left:${cm/30*100}%"></span></div><div class="gd-fdp-readout"><div class="gd-fdp-value"><span>millimetres</span><strong>${mm} mm</strong></div><div class="gd-fdp-value"><span>centimetres</span><strong>${Number(cm.toFixed(1))} cm</strong></div><div class="gd-fdp-value"><span>metres</span><strong>${Number(m.toFixed(3))} m</strong></div></div></div>`}
setPanels(`${field('Measurement (cm)','<input class="gd-input" id="me-cm" type="range" min="0" max="30" step="0.1" value="12.3">')}${btn('Random mark','me-random')}<p class="gd-help">The ruler is 30 cm with millimetre ticks. The orange marker shows the selected length.</p>`,'');q('#me-cm').oninput=draw;q('#me-random').onclick=()=>{q('#me-cm').value=(Math.floor(Math.random()*301)/10).toFixed(1);draw()};draw()}

function randomiser(){let result='';function draw(){const mode=q('#ra-mode').value;let controls='';if(mode==='dice')controls=field('Number of dice','<input class="gd-input" id="ra-count" type="number" min="1" max="8" value="2">')+field('Sides','<select class="gd-select" id="ra-sides"><option>6</option><option>4</option><option>8</option><option>10</option><option>12</option><option>20</option></select>');if(mode==='spinner')controls=field('Choices','<textarea class="gd-textarea" id="ra-choices" rows="5">Red\nBlue\nGreen\nYellow</textarea>');if(mode==='number')controls=field('Minimum','<input class="gd-input" id="ra-min" type="number" value="1">')+field('Maximum','<input class="gd-input" id="ra-max" type="number" value="100">');if(mode==='card')controls='<p class="gd-help">Draw from a standard 52-card deck.</p>';q('#ra-extra').innerHTML=controls;show(mode)}function show(mode=q('#ra-mode').value){if(mode==='spinner'){q('#gd-stage').innerHTML=`<div class="gd-vis"><div class="gd-spinner">?</div><div class="gd-spinner-result">${esc(result||'Press Spin')}</div></div>`}else q('#gd-stage').innerHTML=`<div class="gd-vis"><div class="gd-random-big">${esc(result||'—')}</div></div>`}function roll(){const mode=q('#ra-mode').value;if(mode==='dice'){const c=clamp(num(q('#ra-count').value,2),1,8),sides=clamp(num(q('#ra-sides').value,6),2,100),vals=Array.from({length:c},()=>1+Math.floor(Math.random()*sides));result=vals.join(' + ')+' = '+vals.reduce((a,b)=>a+b,0)}else if(mode==='number'){let a=num(q('#ra-min').value,1),b=num(q('#ra-max').value,100);if(a>b)[a,b]=[b,a];result=String(Math.floor(a+Math.random()*(b-a+1)))}else if(mode==='spinner'){const a=q('#ra-choices').value.split(/\n|,/).map(x=>x.trim()).filter(Boolean);result=a.length?a[Math.floor(Math.random()*a.length)]:'Add choices'}else{const ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],suits=['♠','♥','♦','♣'];result=ranks[Math.floor(Math.random()*ranks.length)]+suits[Math.floor(Math.random()*suits.length)]}show(mode)}
setPanels(`${field('Tool','<select class="gd-select" id="ra-mode"><option value="dice">Dice</option><option value="spinner">Spinner</option><option value="number">Random number</option><option value="card">Playing card</option></select>')}<div id="ra-extra"></div>${btn('Generate','ra-go',true)}`,'');q('#ra-mode').onchange=()=>{result='';draw()};q('#ra-go').onclick=roll;draw()}

function balanceTool(){function val(id){try{return Function('"use strict";return ('+q(id).value.replace(/[^0-9+\-*/(). ]/g,'')+')')()}catch(_){return NaN}}function draw(){const l=val('#ba-left'),r=val('#ba-right'),diff=Number.isFinite(l)&&Number.isFinite(r)?l-r:0,tilt=clamp(diff,-10,10)*1.7;const sign=!Number.isFinite(l)||!Number.isFinite(r)?'?':l===r?'=':l>r?'>':'<';q('#gd-stage').innerHTML=`<div class="gd-vis"><div class="gd-balance" style="--tilt:${tilt}deg"><div class="gd-balance-beam"></div><div class="gd-balance-post"></div><div class="gd-balance-base"></div><div class="gd-pan left">${Number.isFinite(l)?l:'?'}</div><div class="gd-pan right">${Number.isFinite(r)?r:'?'}</div></div><div class="gd-equation">${esc(q('#ba-left').value)} ${sign} ${esc(q('#ba-right').value)}</div></div>`}
setPanels(`${field('Left expression','<input class="gd-input" id="ba-left" value="8 + 4">')}${field('Right expression','<input class="gd-input" id="ba-right" value="3 * 4">','Use * for multiplication, e.g. 3*4.')}${btn('Balanced example','ba-example')}<p class="gd-help">The beam tips toward the numerically larger side. Expressions are evaluated locally in your browser.</p>`,'');['ba-left','ba-right'].forEach(id=>q('#'+id).oninput=draw);q('#ba-example').onclick=()=>{const e=[['7+5','3*4'],['18-6','24/2'],['5*6','20+10'],['9+9','36/2']][Math.floor(Math.random()*4)];q('#ba-left').value=e[0];q('#ba-right').value=e[1];draw()};draw()}

function timesTableVisual(){function draw(){const a=clamp(num(q('#tv-a').value,4),1,12),b=clamp(num(q('#tv-b').value,6),1,12),total=a*b;const groups=Array.from({length:a},()=>`<div class="gd-group">${Array.from({length:b},()=>'<span class="gd-mini-dot"></span>').join('')}</div>`).join(''),jumps=Array.from({length:a},(_,i)=>`<span class="gd-jump">${i*b} → ${(i+1)*b}</span>`).join('');q('#gd-stage').innerHTML=`<div class="gd-vis gd-fact-card"><div class="gd-fact-main">${a} × ${b} = ${total}</div><div class="gd-groups">${groups}</div><div class="gd-readout" style="text-align:center">${Array.from({length:a},()=>b).join(' + ')} = ${total}</div><div class="gd-jumps">${jumps}</div><div class="gd-readout" style="text-align:center">Related facts: ${b} × ${a} = ${total} · ${total} ÷ ${a} = ${b} · ${total} ÷ ${b} = ${a}</div></div>`}
setPanels(`${field('Number of groups','<input class="gd-input" id="tv-a" type="range" min="1" max="12" value="4">')}${field('In each group','<input class="gd-input" id="tv-b" type="range" min="1" max="12" value="6">')}${btn('Random fact','tv-random')}`,'');['tv-a','tv-b'].forEach(id=>q('#'+id).oninput=draw);q('#tv-random').onclick=()=>{q('#tv-a').value=1+Math.floor(Math.random()*12);q('#tv-b').value=1+Math.floor(Math.random()*12);draw()};draw()}

function factorExplorer(){function primeFactors(n){let x=n,out=[];for(let p=2;p*p<=x;p++)while(x%p===0){out.push(p);x/=p}if(x>1)out.push(x);return out}function draw(){const n=clamp(Math.round(num(q('#fe-n').value,36)),2,500),pairs=[];for(let i=1;i*i<=n;i++)if(n%i===0)pairs.push([i,n/i]);const multiples=Array.from({length:12},(_,i)=>n*(i+1));q('#gd-stage').innerHTML=`<div class="gd-vis"><h3>Factor pairs of ${n}</h3><div class="gd-factor-pairs">${pairs.map(p=>`<span class="gd-factor-pair">${p[0]} × ${p[1]}</span>`).join('')}</div><h3 style="margin-top:24px">First 12 multiples</h3><div class="gd-multiples">${multiples.map(x=>`<span class="gd-multiple">${x}</span>`).join('')}</div><div class="gd-readout" style="margin-top:18px;text-align:center">Prime factorisation: ${primeFactors(n).join(' × ')}</div></div>`}
setPanels(`${field('Number','<input class="gd-input" id="fe-n" type="number" min="2" max="500" value="36">')}${btn('Random number','fe-random')}`,'');q('#fe-n').oninput=draw;q('#fe-random').onclick=()=>{q('#fe-n').value=2+Math.floor(Math.random()*143);draw()};draw()}

function fdpExplorer(){function draw(){let d=clamp(Math.round(num(q('#fd-d').value,8)),1,20),n=clamp(Math.round(num(q('#fd-n').value,3)),0,d);q('#fd-n').max=d;if(n>+q('#fd-n').value)q('#fd-n').value=n;const g=gcd(n,d),sn=n/g,sd=d/g,v=n/d,pct=v*100;const bar=`<div class="gd-fdp-bar">${Array.from({length:d},(_,i)=>`<span class="gd-fdp-piece${i<n?' is-fill':''}"></span>`).join('')}</div>`;const fills=Math.round(v*100);q('#gd-stage').innerHTML=`<div class="gd-vis gd-fdp-main">${bar}<div class="gd-fdp-readout"><div class="gd-fdp-value"><span>fraction</span><strong>${sn}/${sd}</strong><small>${n}/${d}</small></div><div class="gd-fdp-value"><span>decimal</span><strong>${Number(v.toFixed(4))}</strong></div><div class="gd-fdp-value"><span>percentage</span><strong>${Number(pct.toFixed(2))}%</strong></div></div><div class="gd-hundred">${Array.from({length:100},(_,i)=>`<span class="${i<fills?'is-fill':''}"></span>`).join('')}</div></div>`}
setPanels(`${field('Numerator','<input class="gd-input" id="fd-n" type="range" min="0" max="8" value="3">')}${field('Denominator','<input class="gd-input" id="fd-d" type="range" min="1" max="20" value="8">')}<p class="gd-help">The hundred square rounds to the nearest whole percent when the fraction does not map exactly to 100 cells.</p>`,'');q('#fd-n').oninput=draw;q('#fd-d').oninput=draw;draw()}

function geoboard(){
  let pts=[],selected=-1,drag=null;
  const undoStack=[],redoStack=[];
  const N=7,W=560,pad=55,step=(W-2*pad)/(N-1);

  function copyPts(value=pts){return value.map(p=>({x:p.x,y:p.y}))}
  function remember(snapshot=copyPts()){
    undoStack.push(copyPts(snapshot));
    if(undoStack.length>40)undoStack.shift();
    redoStack.length=0;
  }
  function undo(){
    if(!undoStack.length)return;
    redoStack.push(copyPts());
    pts=copyPts(undoStack.pop());
    selected=-1;
    draw();
  }
  function redo(){
    if(!redoStack.length)return;
    undoStack.push(copyPts());
    pts=copyPts(redoStack.pop());
    selected=-1;
    draw();
  }
  function area(){
    if(pts.length<3)return 0;
    let a=0;
    for(let i=0;i<pts.length;i++){
      const p=pts[i],n=pts[(i+1)%pts.length];
      a+=p.x*n.y-n.x*p.y;
    }
    return Math.abs(a)/2;
  }
  function segmentLength(){
    return pts.length===2?Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y):0;
  }
  function perimeter(){
    if(pts.length<3)return 0;
    let p=0;
    for(let i=0;i<pts.length;i++){
      const a=pts[i],b=pts[(i+1)%pts.length];
      p+=Math.hypot(a.x-b.x,a.y-b.y);
    }
    return p;
  }
  function pointPx(p){
    return{x:pad+p.x*step,y:pad+(N-1-p.y)*step};
  }
  function polyPoints(){
    if(!pts.length)return'';
    const list=pts.map(p=>{const v=pointPx(p);return v.x+','+v.y;});
    if(pts.length>2)list.push(list[0]);
    return list.join(' ');
  }
  function metricText(){
    if(pts.length<2)return'Vertices: '+pts.length+' · Add at least two vertices to measure a length.';
    if(pts.length===2)return'Vertices: 2 · Length ≈ '+segmentLength().toFixed(2)+' units';
    return'Vertices: '+pts.length+' · Perimeter ≈ '+perimeter().toFixed(2)+' units · Area = '+area().toFixed(2)+' square units';
  }
  function occupied(x,y,except=-1){
    return pts.findIndex((p,i)=>i!==except&&p.x===x&&p.y===y);
  }
  function nearestPeg(e,svg){
    const r=svg.getBoundingClientRect();
    const vx=(e.clientX-r.left)/Math.max(1,r.width)*W;
    const vy=(e.clientY-r.top)/Math.max(1,r.height)*W;
    return{
      x:clamp(Math.round((vx-pad)/step),0,N-1),
      y:clamp((N-1)-Math.round((vy-pad)/step),0,N-1)
    };
  }
  function updateGeometry(){
    const poly=q('[data-ge-poly]',q('#gd-stage'));
    if(poly)poly.setAttribute('points',polyPoints());
    qa('[data-ge-vertex]',q('#gd-stage')).forEach(el=>{
      const i=+el.dataset.geVertex,p=pts[i];if(!p)return;
      const v=pointPx(p);
      el.setAttribute('cx',v.x);el.setAttribute('cy',v.y);
      el.dataset.gePos=p.x+','+p.y;
      el.classList.toggle('is-selected',i===selected);
      el.setAttribute('aria-label','Vertex '+String.fromCharCode(65+i)+' at '+p.x+', '+p.y+'. Drag to move.');
    });
    qa('[data-ge-label]',q('#gd-stage')).forEach(el=>{
      const i=+el.dataset.geLabel,p=pts[i];if(!p)return;
      const v=pointPx(p);
      el.setAttribute('x',v.x+11);el.setAttribute('y',v.y-11);
    });
    const readout=q('#ge-readout');if(readout)readout.textContent=metricText();
    const context=q('#ge-context-text');
    if(context)context.textContent=selected>=0&&pts[selected]
      ? 'Selected '+String.fromCharCode(65+selected)+' · ('+pts[selected].x+', '+pts[selected].y+')'
      : 'Tap a vertex to select it, or drag it straight to another peg.';
    const del=q('[data-ge-delete]');
    if(del)del.hidden=!(selected>=0&&pts[selected]);
    syncControls();
  }
  function moveVertex(index,x,y,withHistory=true){
    if(!pts[index]||occupied(x,y,index)>=0)return false;
    if(pts[index].x===x&&pts[index].y===y)return false;
    if(withHistory)remember();
    pts[index]={x,y};
    selected=index;
    return true;
  }
  function deleteVertex(index){
    if(index<0||index>=pts.length)return;
    remember();
    pts.splice(index,1);
    selected=-1;
    draw();
  }
  function syncControls(){
    const u=q('#ge-undo'),r=q('#ge-redo'),clear=q('#ge-clear');
    if(u)u.disabled=!undoStack.length;
    if(r)r.disabled=!redoStack.length;
    if(clear)clear.disabled=!pts.length;
  }
  function bindStage(){
    const svg=q('#ge-svg');
    qa('[data-gp]',q('#gd-stage')).forEach(peg=>peg.onclick=()=>{
      const [x,y]=peg.dataset.gp.split(',').map(Number);
      const existing=occupied(x,y);
      if(existing>=0){selected=existing;draw();return;}
      remember();
      pts.push({x,y});
      selected=pts.length-1;
      draw();
    });
    qa('[data-ge-vertex]',q('#gd-stage')).forEach(vertex=>{
      vertex.onpointerdown=e=>{
        if(e.button!=null&&e.button!==0)return;
        e.stopPropagation();
        const index=+vertex.dataset.geVertex;
        selected=index;
        drag={index,pointerId:e.pointerId,start:copyPts(),moved:false};
        try{vertex.setPointerCapture(e.pointerId)}catch(_){}
        updateGeometry();
      };
      vertex.onpointermove=e=>{
        if(!drag||drag.pointerId!==e.pointerId||drag.index!==+vertex.dataset.geVertex)return;
        const target=nearestPeg(e,svg),p=pts[drag.index];
        if(!p||(p.x===target.x&&p.y===target.y)||occupied(target.x,target.y,drag.index)>=0)return;
        if(!drag.moved){
          remember(drag.start);
          drag.moved=true;
        }
        pts[drag.index]={x:target.x,y:target.y};
        selected=drag.index;
        updateGeometry();
      };
      const finish=e=>{
        if(!drag||drag.pointerId!==e.pointerId||drag.index!==+vertex.dataset.geVertex)return;
        const moved=drag.moved;
        drag=null;
        if(moved)draw();else{selected=+vertex.dataset.geVertex;draw();}
      };
      vertex.onpointerup=finish;
      vertex.onpointercancel=finish;
      vertex.onkeydown=e=>{
        const index=+vertex.dataset.geVertex,p=pts[index];if(!p)return;
        if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteVertex(index);return;}
        let x=p.x,y=p.y;
        if(e.key==='ArrowLeft')x--;else if(e.key==='ArrowRight')x++;
        else if(e.key==='ArrowUp')y++;else if(e.key==='ArrowDown')y--;else return;
        e.preventDefault();
        x=clamp(x,0,N-1);y=clamp(y,0,N-1);
        if(moveVertex(index,x,y,true))draw();
      };
    });
    const del=q('[data-ge-delete]');
    if(del)del.onclick=()=>deleteVertex(selected);
  }
  function draw(){
    let grid='';
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const v=pointPx({x,y});
      grid+='<circle class="gd-ge-peg" cx="'+v.x+'" cy="'+v.y+'" r="5" data-gp="'+x+','+y+'"></circle>';
    }
    const poly=pts.length?'<polyline class="gd-poly" data-ge-poly points="'+polyPoints()+'"></polyline>':'<polyline class="gd-poly" data-ge-poly points=""></polyline>';
    const vertices=pts.map((p,i)=>{
      const v=pointPx(p),label=String.fromCharCode(65+i);
      return '<circle class="gd-point gd-ge-vertex'+(i===selected?' is-selected':'')+'" data-ge-vertex="'+i+'" data-ge-pos="'+p.x+','+p.y+'" tabindex="0" role="button" aria-label="Vertex '+label+' at '+p.x+', '+p.y+'. Drag to move." cx="'+v.x+'" cy="'+v.y+'" r="10"></circle>'+
        '<text class="gd-ge-label" data-ge-label="'+i+'" x="'+(v.x+11)+'" y="'+(v.y-11)+'">'+label+'</text>';
    }).join('');
    q('#gd-stage').innerHTML='<div class="gd-vis gd-geo gd-geoboard-direct">'+
      '<svg id="ge-svg" viewBox="0 0 '+W+' '+W+'" role="img" aria-label="Interactive geoboard">'+grid+poly+vertices+'</svg>'+
      '<div class="gd-ge-context"><span id="ge-context-text">'+(selected>=0&&pts[selected]?'Selected '+String.fromCharCode(65+selected)+' · ('+pts[selected].x+', '+pts[selected].y+')':'Tap a peg to add a vertex. Drag an existing vertex to reshape the polygon.')+'</span><button type="button" data-ge-delete'+(selected>=0&&pts[selected]?'':' hidden')+'>Delete vertex</button></div>'+
      '<div class="gd-readout" id="ge-readout">'+metricText()+'</div>'+
    '</div>';
    bindStage();
    syncControls();
  }

  setPanels(
    '<div class="gd-row">'+btn('Undo','ge-undo')+btn('Redo','ge-redo')+btn('Clear shape','ge-clear')+'</div>'+
    '<p class="gd-help">Tap pegs in order to make a shape. Then drag any vertex to another peg instead of rebuilding the polygon. With two vertices the tool shows segment length; with three or more it shows perimeter and area.</p>',
    ''
  );
  q('#ge-undo').onclick=undo;
  q('#ge-redo').onclick=redo;
  q('#ge-clear').onclick=()=>{if(!pts.length)return;remember();pts=[];selected=-1;draw()};
  draw();
}

function mathsCanvas(){
const I=G.interaction;
if(!I){q('#gd-stage').innerHTML='<p class="gd-empty">The interactive canvas could not start.</p>';return;}
let tiles=[],next=1,grid=true,colourOpen=false,controller=null;
const colours=['#cbe7e2','#f6cf79','#cfe0f6','#efcfd9','#dbcff2','#d5ead2','#f3d7c4','#ffffff'];
function textColour(hex){const h=String(hex||'').replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))return '#24343b';const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return (r*299+g*587+b*114)/1000>155?'#24343b':'#ffffff'}
function stateSnapshot(){return{tiles:JSON.parse(JSON.stringify(tiles)),next,grid}}
function restoreState(value){tiles=Array.isArray(value?.tiles)?value.tiles:[];next=Math.max(1,num(value?.next,1));grid=value?.grid!==false;colourOpen=false}
function selectedTile(id){return tiles.find(t=>String(t.id)===String(id))||null}
function tileMarkup(t,selectedId){const selected=String(t.id)===String(selectedId),locked=!!t.locked;return '<div class="gd-tile gd-object-tile'+(t.symbol?' symbol':'')+(selected?' is-selected':'')+(locked?' is-locked':'')+'" data-gd-object="'+t.id+'" role="button" tabindex="0" aria-selected="'+(selected?'true':'false')+'" aria-label="'+esc(t.text)+(locked?' locked':'')+'" style="left:'+t.x+'px;top:'+t.y+'px;--gd-tile-fill:'+t.color+';--gd-tile-ink:'+textColour(t.color)+'">'+esc(t.text)+(locked?'<span class="gd-tile-lock" aria-hidden="true">⌑</span>':'')+'</div>'}
function railMarkup(selected,meta){
const undo=I.toolButton('undo','undo','Undo','',!meta?.canUndo);
const redo=I.toolButton('redo','redo','Redo','',!meta?.canRedo);
const gridButton=I.toolButton('grid','grid',grid?'Turn grid off':'Turn grid on',grid?'is-active':'',false);
let object='';
if(selected){
object=I.toolButton('duplicate','duplicate','Duplicate tile','',false)+
I.toolButton('colour','colour','Change tile colour',colourOpen?'is-active':'',selected.locked)+
I.toolButton('lock',selected.locked?'unlock':'lock',selected.locked?'Unlock tile':'Lock tile',selected.locked?'is-active':'',false)+
I.toolButton('delete','delete','Delete tile','is-danger',selected.locked);
}
const swatches=selected&&colourOpen&&!selected.locked?'<div class="gd-object-colours" role="group" aria-label="Tile colour">'+colours.map(col=>'<button type="button" data-gd-colour="'+col+'" aria-label="Use '+col+'" style="--swatch:'+col+'"></button>').join('')+'</div>':'';
return '<div class="gd-object-ui"><div class="gd-object-rail'+(selected?' is-engaged':'')+'" aria-label="Canvas tools">'+object+(object?'<span class="gd-object-separator"></span>':'')+undo+redo+gridButton+'</div>'+swatches+'</div>'
}
function draw(selectedId,meta){
const selected=selectedTile(selectedId);
q('#gd-stage').innerHTML='<div class="gd-vis gd-object-workspace"><div class="gd-object-canvas-wrap"><div class="gd-canvas gd-object-canvas'+(grid?' has-grid':'')+'" id="mc-canvas" data-gd-canvas-bg tabindex="0" aria-label="Maths canvas. Tap a tile to select it and drag to move it.">'+tiles.map(t=>tileMarkup(t,selectedId)).join('')+'</div>'+railMarkup(selected,meta)+'</div><div class="gd-object-hint">'+(selected?(selected.locked?'Tile locked · use the lock icon to move or edit it again.':'Drag to move · the side tools duplicate, colour, lock or delete it.'):'Tap a tile to select it. Drag tiles directly around the board.')+'</div></div>'
}
function constrainTile(item,x,y,element,canvas){const el=element||canvas.querySelector('[data-gd-object="'+item.id+'"]');const w=el?.offsetWidth||52,h=el?.offsetHeight||52;return{x:clamp(x,0,Math.max(0,canvas.clientWidth-w)),y:clamp(y,0,Math.max(0,canvas.clientHeight-h))}}
function duplicateTile(item){const canvas=q('#mc-canvas'),copy={...item,id:next++,locked:false};const w=canvas?.clientWidth||700,h=canvas?.clientHeight||420;copy.x=clamp((Number(item.x)||0)+40,0,Math.max(0,w-70));copy.y=clamp((Number(item.y)||0)+40,0,Math.max(0,h-60));tiles.push(copy);return copy}
function add(text,symbol=false){let id=null;controller.mutate(()=>{id=next++;const canvas=q('#mc-canvas'),width=canvas?.clientWidth||700,cols=Math.max(1,Math.floor(Math.max(80,width-40)/80)),i=tiles.length,x=20+(i%cols)*80,y=20+Math.floor(i/cols)*80;tiles.push({id,text,x,y,symbol,locked:false,color:symbol?'#f6cf79':'#cbe7e2'})});controller.select(id)}
function bindPalette(){
qa('[data-mc-add]',q('#gd-controls')).forEach(x=>x.onclick=()=>add(x.dataset.mcAdd,false));
qa('[data-mc-sym]',q('#gd-controls')).forEach(x=>x.onclick=()=>add(x.dataset.mcSym,true));
q('#mc-add').onclick=()=>{const v=q('#mc-custom').value.trim();if(v){add(v,false);q('#mc-custom').value=''}};
q('#mc-clear').onclick=()=>{if(!tiles.length)return;if(!window.confirm('Clear all tiles from this canvas?'))return;controller.mutate(()=>{tiles=[];colourOpen=false})};
}
setPanels('<p class="gd-section-title">Add tiles</p><div class="gd-canvas-tools">'+['1','2','3','4','5','10','100'].map(x=>'<button class="gd-btn gd-palette-tile" type="button" data-mc-add="'+x+'">'+x+'</button>').join('')+'</div><div class="gd-canvas-tools">'+['+','−','×','÷','=','<','>','?'].map(x=>'<button class="gd-btn gd-palette-tile is-symbol" type="button" data-mc-sym="'+x+'">'+x+'</button>').join('')+'</div>'+field('Custom tile','<div class="gd-row"><input class="gd-input" id="mc-custom" placeholder="e.g. 24"><button class="gd-btn" type="button" id="mc-add">Add</button></div>')+btn('Clear canvas','mc-clear')+'<p class="gd-help">Tap to add a tile, then work directly on the board. Select a tile for duplicate, colour, lock and delete. On a keyboard: arrows nudge, Delete removes, Ctrl/Cmd+D duplicates, Ctrl/Cmd+Z undoes.</p>','');
controller=I.mount({
getItems:()=>tiles,
getState:stateSnapshot,
setState:restoreState,
getCanvas:()=>q('#mc-canvas'),
getActionRoot:()=>q('#gd-stage'),
render:draw,
snap:()=>grid?20:1,
nudgeStep:()=>grid?20:1,
constrain:constrainTile,
duplicate:duplicateTile,
remove:item=>{tiles=tiles.filter(t=>t!==item);colourOpen=false},
setColour:(item,colour)=>{item.color=colour;colourOpen=false},
toggleLock:item=>{item.locked=!item.locked;colourOpen=false},
onAction:(action,api)=>{
if(action==='colour'){colourOpen=!colourOpen;api.refresh()}
else if(action==='grid'){api.mutate(()=>{grid=!grid;colourOpen=false})}
},
onSelectionChange:item=>{if(!item)colourOpen=false}
});
bindPalette();
controller.refresh();
}

Object.assign(G,{coordinateTool,measurementTool,randomiser,balanceTool,timesTableVisual,factorExplorer,fdpExplorer,geoboard,mathsCanvas});
})(window.TT99Goodies);
