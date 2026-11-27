(function(global){
'use strict';
const root=document.getElementById('tt99-goodies-root');
if(!root)return;
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
  if(i%10===0){const aLabel=!full&&(i===0||i===180)?a+direction*(i===0?5:-5):a;text(polar(r*.84,aLabel),i,19*k,'#344b52',aLabel,'outer',i);if(!full)text(polar(r*.71,aLabel),180-i,17*k,'#80551d',aLabel,'inner',i)}
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
   const d=i*step,a=at(d,0),available=rim(d),tick=Math.min(i%10===0?12:i%5===0?8:4,Math.max(0,available-1)),b=at(d,tick);
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
const instruments={rulerGraduations,ruler:rulerInstrument,protractor:protractorInstrument,setSquare:setSquareInstrument,adaptMarkings:adaptInstrumentMarkings};

global.TT99Goodies={instruments,root,CATS,q,qa,esc,clamp,num,gcd,money,field,btn,setPanels,lessonState};
})(window);
