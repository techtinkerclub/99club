(function(global){
'use strict';
const root=typeof document==='undefined'?null:document.getElementById('tt99-goodies-root');
const CATS={number:'Number',fractions:'Fractions',operations:'Operations',measure:'Measure',geometry:'Geometry',random:'Classroom',canvas:'Canvas'};
function q(s,ctx=root){return ctx.querySelector(s)}function qa(s,ctx=root){return [...ctx.querySelectorAll(s)]}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}function num(v,d=0){const n=Number(v);return Number.isFinite(n)?n:d}
function gcd(a,b){a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b){[a,b]=[b,a%b]}return a||1}
function money(p){return p>=100?'£'+(p/100).toFixed(p%100?2:0):(p+'p')}
function field(label,input,help=''){return `<label class="gd-field"><span>${label}</span>${input}${help?`<small class="gd-help">${help}</small>`:''}</label>`}
function btn(text,id,primary=false){return `<button class="gd-btn${primary?' gd-btn--primary':''}" id="${id}" type="button">${text}</button>`}
function setPanels(controls,stage){q('#gd-controls').innerHTML=controls;q('#gd-stage').innerHTML=stage}

let lessonAdapter=null;
const jsonCopy=value=>JSON.parse(JSON.stringify(value));
const lessonState={
 register(tool,read,write){lessonAdapter={tool,read,write}},
 clear(){lessonAdapter=null},
 supports(tool){return lessonAdapter?.tool===tool},
 capture(tool){if(!this.supports(tool))throw new Error('Saving this tool is not supported yet.');return jsonCopy({version:1,tool,model:lessonAdapter.read()})},
 restore(tool,snapshot){if(!this.supports(tool)||snapshot?.version!==1||snapshot.tool!==tool||!snapshot.model||typeof snapshot.model!=='object')throw new Error('Incompatible saved widget.');lessonAdapter.write(jsonCopy(snapshot.model));return true}
};

// Shared geometry instruments. A ruler's minor divisions are millimetres
// (or sixteenths of an inch); an instrument is never stretched to a target.
const instrumentNS='http://www.w3.org/2000/svg';
function instrumentEl(parent,tag,attrs,content){
 const e=document.createElementNS(instrumentNS,tag);
 Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));
 if(content!=null)e.textContent=String(content);parent.appendChild(e);return e;
}
function rulerGraduations(scale='metric',length=scale==='imperial'?12:30,start=0){
 const imperial=scale==='imperial',majorStep=imperial?16:10,count=Math.round(length*majorStep);
 return Array.from({length:count+1},(_,i)=>{
  const n=Math.round(start*majorStep)+i,major=n%majorStep===0;
  return {i,value:start+i/majorStep,major,height:major?1:imperial?(n%8===0?40/52:n%4===0?31/52:n%2===0?23/52:15/52):n%5===0?33/52:17/52};
 });
}
function rulerInstrument(parent,{x=0,y=0,width=1000,height=56,scale='metric',length=scale==='imperial'?12:30,start=0,angle=0,side=1,ticksOnly=false,labelSize=12,tickHeight=height*.55,labels=true,unitLabel=true,nonScaling=true}={}){
 const g=instrumentEl(parent,'g',{'data-geometry-instrument':'ruler','data-me-major-step':scale==='imperial'?16:10,transform:'translate('+x+' '+y+') rotate('+(-angle)+')'});
 // The zero graduation and drawing edge coincide, with the instrument
 // extending to either side of the edge without mirroring its numerals.
 const marks=rulerGraduations(scale,length,start),n=marks.length-1,inkSize=Math.min(labelSize,height*.27),majorHeight=Math.min(tickHeight,height*.49);
 if(!ticksOnly)instrumentEl(g,'rect',{x:0,y:side>0?0:-height,width,height,rx:3,fill:'#dceee9','fill-opacity':.72,stroke:'#82a69e','stroke-width':1.5});
 for(const t of marks){
  const xx=t.i/n*width;
  instrumentEl(g,'line',{class:'gd-ruler-tick','data-me-division':t.i,'data-me-ruler-index':Math.round(start*(scale==='imperial'?16:10))+t.i,x1:xx,x2:xx,y1:0,y2:side*majorHeight*t.height,stroke:'#344b52','stroke-width':1,'stroke-linecap':'butt',...(nonScaling?{'vector-effect':'non-scaling-stroke'}:{})});
  if(labels&&t.major){const value=String(Number(t.value.toFixed(3))),half=inkSize*.32*value.length+2,pos=ticksOnly?xx:Math.max(half,Math.min(width-half,xx));instrumentEl(g,'text',{x:pos,y:side*(majorHeight+inkSize*.72),'dominant-baseline':'central','text-anchor':'middle','font-family':'Arial,sans-serif','font-size':inkSize,'font-weight':400,fill:'#344b52','data-me-ruler-label':t.i,'data-me-ruler-index':Math.round(start*(scale==='imperial'?16:10))+t.i},value)}
 }
 if(!ticksOnly&&unitLabel&&width>=inkSize*5)instrumentEl(g,'text',{x:width/2,y:side*(height-inkSize*.3),'dominant-baseline':'central','text-anchor':'middle','font-family':'Arial,sans-serif','font-size':inkSize*.66,fill:'#52676b'},scale==='imperial'?'in':'cm');
 return g;
}
function protractorInstrument(parent,{x=0,y=0,radius:r=247,start=0,direction=1,full=false}={}){
 const g=instrumentEl(parent,'g',{'data-geometry-instrument':'protractor','data-me-protractor-radius':r,'data-instrument-direction':direction}),range=full?360:180,k=r/247;
 const polar=(radius,angle)=>[x+radius*Math.cos(angle*Math.PI/180),y-radius*Math.sin(angle*Math.PI/180)];
 const a=polar(r,start),b=polar(r,start+direction*180),sweep=direction>0?0:1,outline='M '+a.join(' ')+' A '+r+' '+r+' 0 0 '+sweep+' '+b.join(' ')+(full?' A '+r+' '+r+' 0 0 '+sweep+' '+a.join(' '):' L '+x+' '+y)+' Z';
 instrumentEl(g,'path',{d:outline,fill:'#dceee9','fill-opacity':.48,stroke:'#82a69e','stroke-width':1.5});
 function line(a,b,w,degree){instrumentEl(g,'line',{...(degree===undefined?{}:{'data-me-protractor-degree':degree}),x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#668d86','stroke-width':w,'stroke-linecap':'round'})}
 function text(p,v,size,fill,angle,ring,degree){const rotation=!full&&(v===0||v===180)?-start:((90-angle+90)%180+180)%180-90;instrumentEl(g,'text',{x:p[0],y:p[1],'dominant-baseline':'central','text-anchor':'middle','font-family':'Arial,sans-serif','font-size':size,'font-weight':400,fill,transform:'rotate('+rotation+' '+p.join(' ')+')','data-me-protractor-label':ring,'data-me-protractor-label-degree':degree},v)}
 for(let i=0;i<=range;i++){
  if(full&&i===360)break;const a=start+direction*i;
  line(polar(r,a),polar(r-(i%10===0?19:i%5===0?12:6)*k,a),i%10===0?2.1:1.05,i);
  if(i%10===0){const aLabel=!full&&(i===0||i===180)?a+direction*(i===0?5:-5):a;text(polar(r*.84,aLabel),i,Math.max(r>=200?17:9,19*k),'#344b52',aLabel,'outer',i);if(!full)text(polar(r*.71,aLabel),180-i,Math.max(r>=200?17:9,17*k),'#80551d',aLabel,'inner',i)}
 }
 line(polar(r,start),polar(r,start+180),1.5);instrumentEl(g,'circle',{cx:x,cy:y,r:4,fill:'#668d86'});
 return g;
}
// Physical set square: a transparent triangular body with an open centre,
 // calibrated graduations on both legs. Vertices are supplied in drawing units.
function setSquareInstrument(parent,{points,angles,unitsPerCm=40,kind='square45'}={}){
 const g=instrumentEl(parent,'g',{'data-geometry-instrument':kind});
 const centre=points.reduce((a,p)=>[a[0]+p[0]/3,a[1]+p[1]/3],[0,0]),inner=points.map(p=>[centre[0]+(p[0]-centre[0])*.48,centre[1]+(p[1]-centre[1])*.48]);
 const ring=p=>'M '+p.map(q=>q.join(' ')).join(' L ')+' Z';
 instrumentEl(g,'path',{d:ring(points)+' '+ring(inner),'fill-rule':'evenodd',fill:'#dceee9','fill-opacity':.68,stroke:'#82a69e','stroke-width':1.4,'data-me-square-body':'1'});
 const right=angles.indexOf(90),origin=points[right],ends=points.filter((_,i)=>i!==right);
 for(const [edge,end] of ends.entries()){
  const v=[end[0]-origin[0],end[1]-origin[1]],length=Math.hypot(...v),u=v.map(x=>x/length),normal=[-u[1],u[0]],dot=(centre[0]-origin[0])*normal[0]+(centre[1]-origin[1])*normal[1];if(dot<0){normal[0]*=-1;normal[1]*=-1}
  const step=unitsPerCm/10,at=(d,h)=>[origin[0]+u[0]*d+normal[0]*h,origin[1]+u[1]*d+normal[1]*h];
  // Intersect an inward normal with the outer and inner triangular outlines.
  // This limits ink to the actual solid rim, even near acute corners.
  const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],depth=(poly,d)=>{const p=at(d,0),hits=[];for(let j=0;j<poly.length;j++){const a=poly[j],b=poly[(j+1)%poly.length],v=[b[0]-a[0],b[1]-a[1]],q=[a[0]-p[0],a[1]-p[1]],den=cross(normal,v);if(Math.abs(den)<1e-9)continue;const h=cross(q,v)/den,t=cross(q,normal)/den;if(h>=-1e-7&&t>=-1e-7&&t<=1+1e-7)hits.push(Math.max(0,h))}return hits};
  const rim=d=>Math.min(Math.max(0,...depth(points,d)),...depth(inner,d).filter(h=>h>1e-7));
  const rotation=((Math.atan2(u[1],u[0])*180/Math.PI+90)%180+180)%180-90;
  for(let i=0;i<=Math.floor((length+1e-7)/step);i++){
   const d=i*step,a=at(d,0),available=rim(d),tick=i===0?0:Math.min(i%10===0?12:i%5===0?8:4,Math.max(0,available-1)),b=at(d,tick);
   instrumentEl(g,'line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#344b52','stroke-width':.85,'data-me-square-edge':edge,'data-me-square-mm':i});
   if(i>0&&i%10===0){const value=String(i/10),font=10,half=font*.32*value.length+2,band=Math.min(rim(d-half),rim(d),rim(d+half));if(d-half>0&&d+half<length&&band>=tick+font+3){const p=at(d,tick+font*.65+1);instrumentEl(g,'text',{x:p[0],y:p[1],transform:'rotate('+rotation+' '+p.join(' ')+')','dominant-baseline':'central','text-anchor':'middle','font-family':'Arial,sans-serif','font-size':font,'font-weight':400,fill:'#344b52','data-me-square-label':edge,'data-me-square-label-mm':i},value)}}
  }
 }
 return g;
}
// Visual detail is adaptive, but tick coordinates, instrument size and measurement
// values are never modified. Only live canvas rendering opts into this function.
function markingInterval(spacing,choices,minimum){return choices.find(n=>n*spacing>=minimum)||choices.at(-1)}
function adaptInstrumentMarkings(svg,pixelsPerUnit){
 const m=svg.getScreenCTM?.(),scale=pixelsPerUnit??(m?Math.hypot(m.a,m.b):1);if(!Number.isFinite(scale)||scale<=0)return;
 const show=(n,visible)=>{if(visible)n.removeAttribute('display');else n.setAttribute('display','none')};
 for(const g of svg.querySelectorAll('[data-geometry-instrument]')){
  const kind=g.getAttribute('data-geometry-instrument');
  if(kind==='ruler'){
   const ticks=[...g.querySelectorAll('[data-me-division]')],major=Number(g.getAttribute('data-me-major-step'))||10,step=ticks.length>1?Math.abs(Number(ticks[1].getAttribute('x1'))-Number(ticks[0].getAttribute('x1')))*scale:0;
   const minor=markingInterval(step,major===16?[1,2,4,8,16]:[1,5,10],1.5),labelStep=markingInterval(step*major,[1,2,5,10],18)*major;
   ticks.forEach(n=>show(n,Number(n.getAttribute('data-me-ruler-index'))%minor===0));
   g.querySelectorAll('[data-me-ruler-label]').forEach(n=>show(n,Number(n.getAttribute('data-me-ruler-index'))%labelStep===0));
  }else if(kind==='protractor'){
   const radius=Number(g.getAttribute('data-me-protractor-radius')),spacing=radius*Math.PI/180*scale,minor=markingInterval(spacing,[1,5,10,30],1.5),labelStep=markingInterval(spacing*.71,[10,20,30,60,90],22);
   g.querySelectorAll('[data-me-protractor-degree]').forEach(n=>show(n,Number(n.getAttribute('data-me-protractor-degree'))%minor===0));
   g.querySelectorAll('[data-me-protractor-label-degree]').forEach(n=>{const a=Number(n.getAttribute('data-me-protractor-label-degree'));show(n,a===0||a===180||a%labelStep===0)});
  }else if(kind==='square45'||kind==='square30'){
   const ticks=[...g.querySelectorAll('[data-me-square-edge="0"]')],xy=n=>[Number(n.getAttribute('x1')),Number(n.getAttribute('y1'))],a=ticks[0]&&xy(ticks[0]),b=ticks[1]&&xy(ticks[1]),step=a&&b?Math.hypot(b[0]-a[0],b[1]-a[1])*scale:0,minor=markingInterval(step,[1,5,10],1.5),labelStep=markingInterval(step*10,[1,2,5,10],18)*10;
   g.querySelectorAll('[data-me-square-mm]').forEach(n=>show(n,Number(n.getAttribute('data-me-square-mm'))%minor===0));
   g.querySelectorAll('[data-me-square-label-mm]').forEach(n=>show(n,Number(n.getAttribute('data-me-square-label-mm'))%labelStep===0));
  }
 }
}
// Shared screen-space measurement helpers. The host supplies actual world
// geometry; these functions never change the model or infer a target answer.
function instrumentScreenScale(svg){const m=svg.getScreenCTM?.();return Math.max(.001,Math.hypot(m?.a||1,m?.b||0))}
function instrumentWorldPoint(svg,event){const m=svg.getScreenCTM?.();if(!m)return null;const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(m.inverse());return [p.x,p.y]}
function instrumentNearestPoint(points,p,tolerance){let nearest=null,d=tolerance;for(const q of points){const n=Math.hypot(q[0]-p[0],q[1]-p[1]);if(n<d){nearest=q;d=n}}return nearest}
function instrumentCentreCue(svg,p,name,angle=null,{parent=svg,span=8}={}){
 const arm=span/2/instrumentScreenScale(svg),along=angle===null?arm:arm*.45;
 const g=instrumentEl(parent,'g',{'data-ag-point-centre':name,'data-me-point-centre':name,'data-ag-centre-direction':angle===null?'neutral':String(angle),transform:'translate('+p[0]+' '+p[1]+') rotate('+(-(angle??0))+')','pointer-events':'none','aria-hidden':'true'});
 for(const [stroke,width] of [['#fff',3],['#28413d',1.15]])instrumentEl(g,'path',{d:'M '+(-along)+' 0 H '+along+' M 0 '+(-arm)+' V '+arm,fill:'none',stroke,'stroke-width':width,'vector-effect':'non-scaling-stroke','stroke-linecap':'round'});
 return g;
}
// A gesture captures the original pose. Rotation and resize never alter its origin.
// Hosts provide alignment/reading policies; the engine knows no challenge answer.
const instrumentMod=a=>((a%360)+360)%360, instrumentAngle=(a,b)=>instrumentMod(Math.atan2(a[1]-b[1],b[0]-a[0])*180/Math.PI);
function instrumentBegin(t,p,handle,id){return {id,t,p:p.slice(),x:t.x,y:t.y,angle:t.angle,size:t.size,handle,startAngle:instrumentAngle([t.x,t.y],p),moved:false,candidate:null}}
function instrumentMove(d,p,scale,{spec,step=4,align,read}={}){
 if(!d.moved&&Math.hypot(p[0]-d.p[0],p[1]-d.p[1])*scale<4)return false;
 d.moved=true;const t=d.t;
 if(d.handle==='rotate')t.angle=instrumentMod(Math.round((d.angle+instrumentAngle([d.x,d.y],p)-d.startAngle)*10)/10);
 else if(d.handle==='measure'){
  // Use the original gesture centre for hit testing to avoid snap feedback.
  t.x=d.x;t.y=d.y;
  const raw=instrumentMod(t.hand*(instrumentAngle([d.x,d.y],p)-t.angle)),a=raw<=180?raw:raw<270?180:0,result=read?.(t,a,scale);
  d.rawReading=Math.round(a*10)/10;d.candidate=result?.kind?result:null;
  t.reading=d.candidate?.reading??d.rawReading;t.x=d.candidate?.x??d.x;t.y=d.candidate?.y??d.y;return true;
 }else if(d.handle==='resize'){
  const axis=(d.angle+(t.kind==='protractor'?90*t.hand:0))*Math.PI/180,delta=(p[0]-d.p[0])*Math.cos(axis)-(p[1]-d.p[1])*Math.sin(axis);
  t.size=clamp(Math.round((d.size+delta)/step)*step,spec.min,spec.max);
 }else{t.x=d.x+p[0]-d.p[0];t.y=d.y+p[1]-d.p[1]}
 d.candidate=t.snap?align?.(t,d.handle||'move',scale)||null:null;return true;
}
function instrumentFinish(d,commit){if(!commit&&d.handle==='measure'&&d.moved){d.t.x=d.x;d.t.y=d.y;d.t.reading=d.rawReading}if(commit&&d.candidate)for(const key of ['x','y','angle','reading'])if(d.candidate[key]!==undefined)d.t[key]=d.candidate[key];return d.t}
// Shared movable utensil controller. All geometry and snapping rules are host supplied.
const D=Math.PI/180,mod=instrumentMod,labAngle=instrumentAngle,labDist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),labSub=(a,b)=>[a[0]-b[0],a[1]-b[1]],labDot=(a,b)=>a[0]*b[0]+a[1]*b[1],labAt=(a,v,t)=>[a[0]+v[0]*t,a[1]+v[1]*t],polar=(x,y,r,a)=>[Math.round((x+r*Math.cos(a*D))*1000)/1000,Math.round((y-r*Math.sin(a*D))*1000)/1000];
const INSTRUMENT_ICONS={
    duplicate:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    select:'<path d="M4 3l15 10-7 1-3 7Z"/>',
    move:'<path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
    trace:'<path d="M3 19C5 6 12 20 16 8S21 5 21 5" stroke-dasharray="2 3"/><circle cx="21" cy="5" r="2" fill="currentColor"/>',
    point:'<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><path d="M12 3v4m0 10v4M3 12h4m10 0h4"/>',
    segment:'<rect x="2.5" y="7.5" width="19" height="9" rx="1.5"/><path d="M6 8v4m4-4v2.5m4-2.5v4m4-4v2.5"/>',
    ray:'<path d="M5 19L20 4M13 4h7v7"/><circle cx="4" cy="20" r="1.6" fill="currentColor" stroke="none"/>',
    line:'<path d="M4 20L20 4M4 13v7h7M13 4h7v7"/>',
    protractor:'<path d="M2 17a10 10 0 0 1 20 0Z M12 7v4M5 10l2.5 3M19 10l-2.5 3M3 14l3 1M21 14l-3 1"/><circle cx="12" cy="17" r="1.2" fill="currentColor" stroke="none"/>',
    square45:'<path d="M3 3v18h18Z M7 12v5h5Z M3 17h4v4"/>',
    square30:'<path d="M2 20h20L2 8Z M6 14v3h5Z M2 16h4v4"/>',
    compass:'<circle cx="12" cy="5" r="2.5"/><path d="M11 7L5 21M13 7l6 14M7.5 15h9M12 2V1"/>',
    shade:'<path d="M3 19L13 3L21 19Z" fill="currentColor" fill-opacity=".22"/><circle cx="3" cy="19" r="1.5"/><circle cx="13" cy="3" r="1.5"/><circle cx="21" cy="19" r="1.5"/>',
    'zoom-out':'<circle cx="10" cy="10" r="6"/><path d="M7 10h6m2 5 5 5"/>','zoom-in':'<circle cx="10" cy="10" r="6"/><path d="M7 10h6m-3-3v6m5 2 5 5"/>',fit:'<path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6"/>',
    pan:'<path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
    expand:'<path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6"/>',
    erase:'<path d="M3 14l10-10a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-8 8H9L3 14ZM8 9l9 9M13 20h9"/>',
    corner:'<path d="M4 4v16h16Z M4 15h5v5"/><path d="M12 2a8 8 0 0 1 9 8m-4-3 4 3 2-4"/>',
    flip:'<path d="M3 18l7-12v12ZM21 18L14 6v12ZM12 3v2m0 4v2m0 4v2m0 4v1"/>',
    undo:'<path d="M8 5L3 10l5 5M3 10h11a6 6 0 0 1 0 12h-3"/>',
    reset:'<path d="M3 11a9 9 0 1 1 2.5 7M3 4v7h7"/>',
    snap:'<path d="M5 3v10a7 7 0 0 0 14 0V3h-5v10a2 2 0 0 1-4 0V3ZM5 8h5m4 0h5"/>',
    measure:'<path d="M3 18h18M3 15v6m18-6v6M4 8h16M4 8l4-4M4 8l4 4m12-4-4-4m4 4-4 4"/>',
    annotate:'<path d="M4 20V4h16M4 20l8-8M14 17h8m-4-4v8"/>',
    grid:'<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18m6-18v18M3 9h18M3 15h18"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 1 1 4 3c-1 .5-1 1-1 2m0 3v.2"/>'
  };
 Object.assign(INSTRUMENT_ICONS,{ruler:INSTRUMENT_ICONS.segment,angle:INSTRUMENT_ICONS.protractor,show:INSTRUMENT_ICONS.protractor,clear:'<path d="M6 6l12 12M18 6L6 18"/>',format:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v3M12 18v3"/>',left:INSTRUMENT_ICONS.undo,right:'<path d="m16 5 5 5-5 5m5-5H10a6 6 0 0 0 0 12"/>'});
 function icon(id){const x=document.createElementNS('http://www.w3.org/2000/svg','svg');for(const [k,v] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':1.65,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false'}))x.setAttribute(k,v);x.innerHTML=INSTRUMENT_ICONS[id]||'';return x}
 function instrumentButton(parent,id,label,description,fn,group='agTool'){const b=document.createElement('button');b.type='button';b.className='gd-btn gd-ag-lab-button';b.dataset[group]=id;b.title=description;b.setAttribute('aria-label',description);const t=document.createElement('span');t.textContent=label;b.append(icon(id),t);b.onclick=fn;parent.append(b);return b}

 function localInstrumentActions(svg,anchor,label,actions,group){
   const N='http://www.w3.org/2000/svg',m=svg.getScreenCTM();if(!m)return;
   const scale=Math.hypot(m.a,m.b)||1,v=svg.viewBox.baseVal,unit=1/scale,buttonSize=46,extra=(actions.some(a=>a[0]==='annotate')?96:0)+(actions.some(a=>a[0].startsWith('datum-'))?32:0),needed=Math.max(84,label.length*7)+actions.length*(buttonSize+4)+16+extra,rows=v.width*scale<needed?2:1,w=Math.min(v.width-8*unit,needed*unit),h=(rows===1?54:108)*unit;
   const x=Math.max(v.x+4*unit,Math.min(v.x+v.width-w-4*unit,anchor[0]-w/2)),y=Math.max(v.y+4*unit,Math.min(v.y+v.height-h-4*unit,anchor[1]+34*unit));
   const fo=document.createElementNS(N,'foreignObject');for(const [k,val] of Object.entries({x,y,width:w,height:h,'data-ag-local-instrument':'1'}))fo.setAttribute(k,val);
   const bar=document.createElement('div');bar.className='gd-ag-local-instrument';bar.style.width=w*scale+'px';bar.style.height=(h*scale)+'px';bar.style.flexWrap=rows===2?'wrap':'nowrap';bar.style.transformOrigin='top left';
   // foreignObject content is in SVG units: compensate for zoom.
   bar.style.transform='scale('+unit+')';const name=document.createElement('span');name.textContent=label;bar.append(name);
   for(const [id,desc,glyph,fn,pressed] of actions){const b=document.createElement('button');b.type='button';b.dataset[group]=id;b.title=desc;b.setAttribute('aria-label',desc);if(pressed!==undefined)b.setAttribute('aria-pressed',String(pressed));if(id.startsWith('datum-')){b.textContent=id==='datum-x'?'+x':'+y';b.style.cssText='font-size:14px;font-weight:600;min-width:46px'}else b.append(icon(glyph));if(id==='annotate'){b.style.cssText='width:auto;min-width:132px;max-width:100%;gap:5px;padding:0 9px;flex-shrink:0';const caption=document.createElement('span');caption.textContent='Add to drawing';caption.style.cssText='white-space:nowrap;font-size:12px';b.append(caption)}b.onclick=e=>{e.stopPropagation();fn()};bar.append(b)}
   for(const type of ['pointerdown','pointermove','pointerup','click','wheel'])fo.addEventListener(type,e=>e.stopPropagation());fo.append(bar);svg.append(fo);return fo
 }

 function measuringUtensils(parent,getSvg,onPaint,{unitsPerCm=40,align=null,read=null,kinds=['ruler','protractor','square45','square30'],initialOpen=false,showReadout=true,annotation=null}={}){
   const N='http://www.w3.org/2000/svg',specs={ruler:{label:'Ruler',size:400,min:2*unitsPerCm,max:100*unitsPerCm},protractor:{label:'Protractor',size:170,min:3*unitsPerCm,max:30*unitsPerCm},square45:{label:'45° set square',size:200,min:2*unitsPerCm,max:50*unitsPerCm},square30:{label:'30°–60° set square',size:200,min:2*unitsPerCm,max:50*unitsPerCm}};
   let items=[],selected=null,next=1,drag=null,opened=initialOpen,visible=true;
   const bar=document.createElement('div');bar.className='gd-ag-utensils gd-ag-lab-helpers';bar.hidden=true;bar.setAttribute('role','group');bar.setAttribute('aria-label','Measuring utensils');parent.append(bar);
   const additions=document.createElement('div');additions.className='gd-ag-lab-actions';bar.append(additions);
   const actions=document.createElement('div');actions.className='gd-ag-lab-actions';bar.append(actions);
   const node=(p,tag,attrs,value)=>{const e=document.createElementNS(N,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(value!==undefined)e.textContent=value;p.append(e);return e};
   function add(kind){const svg=getSvg(),v=svg.viewBox.baseVal,k=items.length%5;visible=true;opened=true;const p={id:String(next++),kind,x:v.x+v.width*.32+k*18,y:v.y+v.height*.52+k*18,angle:0,size:specs[kind].size*unitsPerCm/40,snap:true,reading:45,hand:1};items.push(p);selected=p.id;onPaint()}
   for(const [kind,spec] of Object.entries(specs).filter(([kind])=>kinds.includes(kind)))instrumentButton(additions,kind,spec.label,'Add '+spec.label,()=>add(kind),'agUtensilAdd');
   const hide=instrumentButton(actions,'select','Hide utensils','Hide or show measuring utensils',()=>{visible=!visible;selected=null;onPaint()},'agUtensilAction');hide.dataset.agUtensilAction='visibility';
   function removeSelected(){items=items.filter(t=>t.id!==selected);selected=null;onPaint()}
   function rotateSelected(){const t=items.find(t=>t.id===selected);if(t){t.angle=mod(t.angle+15);onPaint()}}
   const label=document.createElement('span');label.className='gd-ag-inspect-message';bar.append(label);
   function paint(svg){
     bar.hidden=!opened;hide.hidden=!items.length;hide.querySelector('span').textContent=visible?'Hide utensils':'Show utensils';hide.setAttribute('aria-pressed',String(!visible));const chosen=items.find(t=>t.id===selected);label.textContent='Add a utensil. Select it on the board for its controls.';
     if(!visible)return;
     const layer=node(svg,'g',{'data-ag-utensil-layer':'1'});
     for(const t of [...items.filter(t=>t.id!==selected),...items.filter(t=>t.id===selected)]){
       const g=node(layer,'g',{'data-ag-utensil':t.id,'data-ag-utensil-kind':t.kind,'data-ag-utensil-angle':t.angle,'data-ag-utensil-size':t.size,'data-ag-utensil-selected':String(t.id===selected),transform:'translate('+t.x+' '+t.y+') rotate('+(-t.angle)+')',cursor:'move'});
       if(t.kind==='ruler')instruments.ruler(g,{width:t.size,length:t.size/unitsPerCm,height:44,tickHeight:23,labelSize:11,nonScaling:false});
       else if(t.kind==='protractor')instruments.protractor(g,{radius:t.size,direction:t.hand});
       else instruments.setSquare(g,{points:[[0,0],[t.size,0],[0,-(t.kind==='square45'?t.size:t.size*Math.sqrt(3))]],angles:t.kind==='square45'?[90,45,45]:[90,60,30],kind:t.kind,unitsPerCm:unitsPerCm});
       if(t.id===selected){
         const scale=Math.hypot(svg.getScreenCTM()?.a||1,svg.getScreenCTM()?.b||0),r=Math.max(6,Math.min(400,18/scale)),arm=t.size+3*r,resize=t.kind==='protractor'?[0,-t.size*t.hand]:[t.size,0];
         node(g,'line',{x1:t.size,y1:0,x2:arm,y2:0,stroke:'#b45309','stroke-width':1.5,'stroke-dasharray':'4 4','pointer-events':'none'});
         node(g,'circle',{cx:0,cy:0,r:r*.45,fill:'#b45309','pointer-events':'none'});
         node(g,'circle',{cx:arm,cy:0,r,fill:'#fff',stroke:'#b45309','stroke-width':2,'data-ag-utensil-handle':'rotate',cursor:'grab','aria-label':'Rotate utensil'});
         node(g,'path',{d:'M '+(arm-r*.55)+' 0 a '+(r*.55)+' '+(r*.55)+' 0 1 1 '+(r*.55)+' '+(r*.55),fill:'none',stroke:'#b45309','stroke-width':1.5,'pointer-events':'none'});
         node(g,'rect',{x:resize[0]-r,y:resize[1]-r,width:2*r,height:2*r,rx:r*.22,fill:'#fff',stroke:'#16796e','stroke-width':2,'data-ag-utensil-handle':'resize',cursor:'grab','aria-label':'Resize utensil'});
         if(t.kind==='protractor'&&showReadout){const a=t.reading*t.hand*D,q=[Math.cos(a)*t.size,-Math.sin(a)*t.size],h=q.map(v=>v*.68),rr=Math.min(r,t.size*.12);node(g,'line',{x1:0,y1:0,x2:q[0],y2:q[1],stroke:'#16796e','stroke-width':1.8,'vector-effect':'non-scaling-stroke','pointer-events':'none','data-ag-protractor-arm':'1'});node(g,'circle',{cx:h[0],cy:h[1],r:rr,fill:'#fff',stroke:'#16796e','stroke-width':2,'data-ag-utensil-handle':'measure','aria-label':'Drag measuring arm',cursor:'grab'});const mid=t.hand*t.reading*.5*D,dist=t.size*.34;node(g,'text',{x:Math.cos(mid)*dist,y:-Math.sin(mid)*dist,'text-anchor':'middle','dominant-baseline':'central','font-size':Math.max(10,t.size*.095),fill:'#165e55','paint-order':'stroke',stroke:'#fff','stroke-width':3,'pointer-events':'none','data-ag-protractor-reading':'1'},t.reading.toFixed(1)+'°')}
         const [rx,ry]=resize;node(g,'path',{d:t.kind==='protractor'?'M '+rx+' '+(ry-r*.65)+' v '+(r*1.3)+' m '+(-r*.28)+' '+(-r*.28)+' l '+(r*.28)+' '+(r*.28)+' '+(r*.28)+' '+(-r*.28):'M '+(rx-r*.65)+' '+ry+' h '+(r*1.3)+' m '+(-r*.28)+' '+(-r*.28)+' l '+(r*.28)+' '+(r*.28)+' '+(-r*.28)+' '+(r*.28),stroke:'#16796e','stroke-width':1.8,fill:'none','pointer-events':'none'});
       }
     }
     if(drag?.candidate){const c=drag.candidate,t=drag.t,q=[c.x??t.x,c.y??t.y],u=1/(Math.hypot(svg.getScreenCTM()?.a||1,svg.getScreenCTM()?.b||0));node(layer,'circle',{cx:q[0],cy:q[1],r:8*u,fill:'none',stroke:'#16796e','stroke-width':2*u,'pointer-events':'none','data-ag-utensil-snap-preview':c.kind});if(c.angle!==undefined||c.reading!==undefined){const end=polar(...q,t.size,c.angle??t.angle+t.hand*c.reading);node(layer,'line',{x1:q[0],y1:q[1],x2:end[0],y2:end[1],stroke:'#16796e','stroke-width':2*u,'stroke-dasharray':(4*u)+' '+(3*u),'pointer-events':'none'})}}
     if(chosen&&!drag){const target=annotation?.target(chosen,instruments.screenScale(svg))||null;
       if(annotation&&['ruler','protractor'].includes(chosen.kind)){label.textContent=target?'Aligned: '+target.names.join('')+'. Select Add to drawing beside the instrument to keep the measurement.':chosen.kind==='protractor'?'Drag the centre to a vertex, rotate the orange handle to align zero, then drag the green measuring arm onto the other line. Add to drawing appears when both arms match.':'Align the ruler with a single named segment. Add to drawing appears when the segment is identified.'}
       if(target){const scale=instruments.screenScale(svg);for(const p of target.points)node(layer,'circle',{cx:p[0],cy:p[1],r:8/scale,fill:'none',stroke:'#b45309','stroke-width':1.5/scale,'pointer-events':'none','data-ag-measurement-reference':'1'})}
       const angle=chosen.angle,anchor=polar(chosen.x,chosen.y,chosen.kind==='ruler'?chosen.size*.5:0,angle),size=Number((chosen.size/unitsPerCm).toFixed(1));localInstrumentActions(svg,anchor,chosen.kind==='ruler'?size+' cm':chosen.kind==='protractor'?(showReadout?chosen.reading.toFixed(1)+'°':'Protractor'):size+' cm base',[...(target?[['annotate',target.label,'annotate',()=>{const current=annotation.target(chosen,instruments.screenScale(svg));if(current)annotation.apply(current)}]]:[]),...(chosen.kind==='protractor'?[['flip','Flip measuring side','flip',()=>{chosen.hand*=-1;onPaint()}]]:[]),['snap',chosen.snap?'Turn magnetic alignment off':'Turn magnetic alignment on','snap',()=>{chosen.snap=!chosen.snap;onPaint()},chosen.snap],['rotate','Rotate 15°','reset',rotateSelected],['duplicate','Duplicate','duplicate',()=>{const copy={...chosen,id:String(next++),x:chosen.x+24,y:chosen.y+24};items.push(copy);selected=copy.id;onPaint()}],['remove','Remove','erase',removeSelected]],'agUtensilAction')}
   }
   function locate(e){return instruments.worldPoint(getSvg(),e)}
   function down(e){if(e.target.closest?.('[data-ag-local-instrument]'))return;if(e.button!==0||!visible)return;const target=e.target.closest?.('[data-ag-utensil]');if(!target){if(selected){selected=null;onPaint()}return}const t=items.find(t=>t.id===target.dataset.agUtensil),p=locate(e);if(!t||!p)return;e.preventDefault();e.stopImmediatePropagation();selected=t.id;opened=true;drag=instruments.beginGesture(t,p,e.target.closest('[data-ag-utensil-handle]')?.getAttribute('data-ag-utensil-handle'),e.pointerId);try{getSvg().setPointerCapture(e.pointerId)}catch(_){}onPaint()}
   function move(e){if(drag?.id!==e.pointerId)return;const p=locate(e);if(!p)return;e.preventDefault();e.stopImmediatePropagation();const changed=instruments.moveGesture(drag,p,instruments.screenScale(getSvg()),{spec:specs[drag.t.kind],step:unitsPerCm/10,align,read});if(changed)onPaint()}
   function finish(e){if(drag?.id!==e.pointerId)return;if(e.type==='pointerup'&&drag.handle==='measure'&&drag.moved){const p=locate(e);if(p)instruments.moveGesture(drag,p,instruments.screenScale(getSvg()),{spec:specs[drag.t.kind],step:unitsPerCm/10,align,read})}instruments.finishGesture(drag,e.type==='pointerup');drag=null;e.stopImmediatePropagation();onPaint()}
   const svg=getSvg();svg.addEventListener('pointerdown',down,true);svg.addEventListener('pointermove',move,true);for(const type of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(type,finish,true);
   function nearMeasuringEdge(p){
     if(!visible)return null;
     const m=getSvg().getScreenCTM(),tol=Math.min(8,4/Math.max(.001,Math.hypot(m?.a||1,m?.b||0))),matches=[];
     for(const t of items){
       const a=[t.x,t.y],b=polar(...a,t.size,t.angle);
       const near=(u,v)=>{const d=labSub(v,u),k=Math.max(0,Math.min(1,labDot(labSub(p,u),d)/(labDot(d,d)||1))),distance=labDist(p,labAt(u,d,k));if(distance<=tol)matches.push({angle:labAngle(u,v),distance,selected:t.id===selected})};
       if(t.kind==='protractor')near(polar(...a,t.size,t.angle+180),b);
       else if(t.kind.startsWith('square')){const c=polar(...a,t.size*(t.kind==='square30'?Math.sqrt(3):1),t.angle+90);near(a,b);near(a,c);near(b,c)}
       else near(a,b);
     }
     matches.sort((a,b)=>Number(b.selected)-Number(a.selected)||a.distance-b.distance);
     return matches[0]||null;
   }
   return {bar,paint,nearMeasuringEdge,add,clear:()=>{items=[];selected=null;drag=null;onPaint()},toggle:()=>{opened=!opened;if(!opened)selected=null;onPaint()},isOpen:()=>opened};
 }

// Shared magnetic alignment accepts only visible points and straight edges.
// No widget-specific model, challenge target or answer is consulted.
 function instrumentAlignment({points,lines},t,mode,scale){
   const p=[t.x,t.y],tol=12/Math.max(.001,scale),diff=(a,b)=>Math.min(mod(a-b),mod(b-a));
   const nearest=lines.flatMap(l=>{const v=labSub(l.b,l.a),d=labDot(v,v);if(d<1e-8)return [];const u=labDot(labSub(p,l.a),v)/d,q=labAt(l.a,v,l.infinite?u:Math.max(0,l.ray?u:Math.min(1,u)));return [{q,d:labDist(p,q),angle:labAngle(l.a,l.b)}]}).sort((a,b)=>a.d-b.d);
   if(mode==='move'){
     // Match finite measuring edges, not merely the utensil's origin.
     // Candidate geometry is computed from the unsnapped pose on every move.
     const edges=t.kind==='protractor'?[[0,t.size||170]]:t.kind==='ruler'?[[0,t.size||400]]:t.kind.startsWith('square')?[[0,t.size||200],[90,(t.size||200)*(t.kind==='square30'?Math.sqrt(3):1)]]:[];
     const vector=(a,d)=>[Math.cos(a*D)*d,-Math.sin(a*D)*d],matches=[];
     const vertex=points.map(q=>({q,d:labDist(p,q)})).sort((a,b)=>a.d-b.d)[0];
     for(const [offset,len] of edges){
       const direction=t.angle+offset;
       // For a protractor its centre is the only translation anchor.
       const fractions=t.kind==='protractor'?[0]:[0,.5,1];
       for(const l of lines){
         const v=labSub(l.b,l.a),ll=labDot(v,v);if(ll<1e-8)continue;
         for(const reverse of [0,180]){
           const angle=mod(labAngle(l.a,l.b)+reverse-offset),da=diff(angle,t.angle);if(da>5)continue;
           for(const fraction of fractions){
             const a=vector(direction,len*fraction),sample=[p[0]+a[0],p[1]+a[1]],u=labDot(labSub(sample,l.a),v)/ll;
             if(!l.infinite&&(u<0||(!l.ray&&u>1)))continue;
             const q=labAt(l.a,v,u),distance=labDist(sample,q);if(distance>tol)continue;
             const b=vector(angle+offset,len*fraction),origin=[q[0]-b[0],q[1]-b[1]];
             // Do not shift the origin far away just to align a distant tip.
             const shift=labDist(origin,p);if(shift>tol)continue;
             matches.push({x:origin[0],y:origin[1],angle,kind:'Aligned edge',score:shift+da*.8});
             if(vertex?.d<=tol){const vtx=vertex.q,k=labDot(labSub(vtx,l.a),v)/ll,project=labAt(l.a,v,k);if((l.infinite||k>=-1e-7&&(l.ray||k<=1+1e-7))&&labDist(vtx,project)<1e-6)matches.push({x:vtx[0],y:vtx[1],angle,kind:'Aligned vertex',score:vertex.d+da*.8-2*tol})}
           }
         }
       }
       // A ruler or set-square tip can also snap to a point without rotating.
       if(t.kind!=='protractor'){const a=vector(direction,len),tip=[p[0]+a[0],p[1]+a[1]],end=points.map(q=>({q,d:labDist(q,tip)})).sort((a,b)=>a.d-b.d)[0];if(end?.d<=tol)matches.push({x:end.q[0]-a[0],y:end.q[1]-a[1],kind:'Endpoint',score:end.d+tol})}
     }
     if(vertex?.d<=tol){const aligned=matches.filter(m=>m.kind==='Aligned vertex').sort((a,b)=>a.score-b.score)[0];return aligned?{x:aligned.x,y:aligned.y,angle:aligned.angle,kind:aligned.kind}:{x:vertex.q[0],y:vertex.q[1],kind:'Point'}}
     const match=matches.sort((a,b)=>a.score-b.score)[0];if(match){const {score,...result}=match;return result}
     const hit=nearest[0]?.d<=tol?nearest[0]:null;
     return hit?{x:hit.q[0],y:hit.q[1],kind:'Edge'}:null;
   }
   if(mode==='rotate'){
     const offsets=t.kind.startsWith('square')?[0,90]:[0],choices=[];
     for(const l of nearest.filter(l=>l.d<=tol*2))for(const offset of offsets)for(const reverse of [0,180])choices.push({angle:mod(l.angle+offset+reverse),kind:'Edge'});
     choices.push({angle:mod(Math.round(t.angle/15)*15),kind:'Angle'});
     choices.sort((a,b)=>(a.kind==='Edge'?0:1)-(b.kind==='Edge'?0:1)||diff(a.angle,t.angle)-diff(b.angle,t.angle));
     return choices.find(c=>diff(c.angle,t.angle)<=3)||null;
   }
   return null;
 }
 // A reading is relative to the zero edge, not the global canvas axes.
 // Preserve exact snapped geometry internally; round only the displayed result.
 function instrumentReading({lines},t,raw,scale){
   const hand=t.hand===-1?-1:1,origin=[t.x,t.y],relative=a=>mod(hand*(a-t.angle)),wanted=Math.max(0,Math.min(180,raw)),tol=12/Math.max(.001,scale),candidates=[];
   const fallback={reading:Math.round(wanted*10)/10,kind:''};if(!t.snap)return fallback;
   const base=[Math.cos(t.angle*D),-Math.sin(t.angle*D)],cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
   for(const {a,b,ray,infinite} of lines){
     const v=labSub(b,a),len=Math.hypot(...v);if(len<1e-8)continue;
     const u=v.map(n=>n/len),delta=labSub(a,origin),den=cross(base,u);
     // Exact intersection with the baseline: only allow a small translation
     // along that baseline, never claim a parallel-offset arm is aligned.
     let q=origin;
     if(Math.abs(cross(delta,u))>1e-8){
       if(Math.abs(den)<1e-8)continue;
       const shift=cross(delta,u)/den;if(Math.abs(shift)>tol)continue;
       q=labAt(origin,base,shift);
     }
     const k=labDot(labSub(q,a),u);
     if(!infinite&&(k< -1e-7||(!ray&&k>len+1e-7)))continue;
     const directions=[...(ray||k<len-1e-7?[labAngle(a,b)]:[]),...(infinite||k>1e-7?[labAngle(b,a)]:[])];
     for(const dir of directions){let reading=relative(dir);if(reading>360-1e-7)reading=0;if(reading>180+1e-7)continue;reading=Math.min(180,reading);const error=Math.abs(reading-wanted);if(error<=3)candidates.push({reading,x:q[0],y:q[1],kind:'Edge',error,shift:labDist(q,origin)})}
   }
   candidates.sort((a,b)=>a.error-b.error||a.shift-b.shift);if(!candidates.length)return fallback;
   const {error,shift,...result}=candidates[0];return result;
 }

const instruments={rulerGraduations,ruler:rulerInstrument,protractor:protractorInstrument,setSquare:setSquareInstrument,adaptMarkings:adaptInstrumentMarkings,screenScale:instrumentScreenScale,worldPoint:instrumentWorldPoint,nearestPoint:instrumentNearestPoint,centreCue:instrumentCentreCue,beginGesture:instrumentBegin,moveGesture:instrumentMove,finishGesture:instrumentFinish,movable:measuringUtensils,icon,button:instrumentButton,localActions:localInstrumentActions,align:instrumentAlignment,readAngle:instrumentReading};

if(typeof module==='object'&&module.exports){module.exports=instruments;return}
if(!root)return;
global.TT99Goodies={instruments,root,CATS,q,qa,esc,clamp,num,gcd,money,field,btn,setPanels,lessonState};
})(typeof window==='undefined'?globalThis:window);
