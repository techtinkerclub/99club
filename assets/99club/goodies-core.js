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
 const g=instrumentEl(parent,'g',{'data-geometry-instrument':'ruler',transform:'translate('+x+' '+y+') rotate('+(-angle)+')'});
 // The zero graduation and drawing edge coincide, with the instrument
 // extending to either side of the edge without mirroring its numerals.
 const marks=rulerGraduations(scale,length,start),n=marks.length-1;
 if(!ticksOnly)instrumentEl(g,'rect',{x:0,y:side>0?0:-height,width,height,rx:3,fill:'#dceee9','fill-opacity':.72,stroke:'#82a69e','stroke-width':1.5});
 for(const t of marks){
  const xx=t.i/n*width;
  instrumentEl(g,'line',{class:'gd-ruler-tick','data-me-division':t.i,x1:xx,x2:xx,y1:0,y2:side*tickHeight*t.height,stroke:'#344b52','stroke-width':1,'stroke-linecap':'butt',...(nonScaling?{'vector-effect':'non-scaling-stroke'}:{})});
  if(labels&&t.major)instrumentEl(g,'text',{x:xx,y:side*(tickHeight+labelSize*.85)+(side<0?labelSize*.35:0),'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':labelSize,'font-weight':600,fill:'#285f57'},Number(t.value.toFixed(3)));
 }
 if(!ticksOnly&&unitLabel)instrumentEl(g,'text',{x:width/2,y:side*(height-4)+(side<0?labelSize:0),'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':Math.max(9,labelSize*.78),fill:'#285f57'},scale==='imperial'?'in':'cm');
 return g;
}
function protractorInstrument(parent,{x=0,y=0,radius:r=247,start=0,direction=1,full=false}={}){
 const g=instrumentEl(parent,'g',{'data-geometry-instrument':'protractor','data-instrument-direction':direction}),range=full?360:180,k=r/247;
 const polar=(radius,angle)=>[x+radius*Math.cos(angle*Math.PI/180),y-radius*Math.sin(angle*Math.PI/180)];
 const pts=Array.from({length:range/5+1},(_,i)=>polar(r,start+direction*i*5));
 instrumentEl(g,'path',{d:'M '+x+' '+y+' L '+pts.map(p=>p.join(' ')).join(' L ')+' Z',fill:'#dceee9','fill-opacity':.48,stroke:'#82a69e','stroke-width':1.5});
 function line(a,b,w){instrumentEl(g,'line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#668d86','stroke-width':w,'stroke-linecap':'round'})}
 function text(p,v,size,fill,offset){instrumentEl(g,'text',{x:p[0]+offset[0],y:p[1]+offset[1]+size*.32,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':size,'font-weight':600,fill},v)}
 for(let i=0;i<=range;i++){
  if(full&&i===360)break;const a=start+direction*i;
  line(polar(r,a),polar(r-(i%10===0?19:i%5===0?12:6)*k,a),i%10===0?2.1:1.05);
  if(i%10===0){const edge=!full&&(i===0||i===180),offset=edge?[15*k*Math.cos((start-direction*90)*Math.PI/180),-15*k*Math.sin((start-direction*90)*Math.PI/180)]:[0,0];text(polar(r-35*k,a),i,Math.max(10,19*k),'#285f57',offset);if(!full)text(polar(r-(edge?75:62)*k,a),180-i,Math.max(r>=200?17:9,17*k),'#80551d',offset)}
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
  for(let i=0;i<=Math.floor((length+1e-7)/step);i++){
   const a=at(i*step,0),b=at(i*step,i%10===0?12:i%5===0?8:4);
   instrumentEl(g,'line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#344b52','stroke-width':.85,'data-me-square-edge':edge,'data-me-square-mm':i});
   if(i>0&&i%10===0&&i*step<length-8){const p=at(i*step,18);instrumentEl(g,'text',{x:p[0],y:p[1],'dominant-baseline':'central','text-anchor':'middle','font-family':'Arial,sans-serif','font-size':10,fill:'#285f57'},i/10)}
  }
 }
 return g;
}
const instruments={rulerGraduations,ruler:rulerInstrument,protractor:protractorInstrument,setSquare:setSquareInstrument};

global.TT99Goodies={instruments,root,CATS,q,qa,esc,clamp,num,gcd,money,field,btn,setPanels,lessonState};
})(window);
