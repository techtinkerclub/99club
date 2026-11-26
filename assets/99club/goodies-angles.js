/* Angles & geometry: common mathematical model, teaching diagrams, assessment and publishing. */
(function(root){
'use strict';
const ID='angles',D=Math.PI/180,mod=a=>(a%360+360)%360,round=v=>Math.round(v*1000)/1000;
const LEVELS=[['easy','Gentle'],['medium','Standard'],['hard','Stretch']];
const MODES=[['angle','Angle explorer & protractor'],['turn','Turns & direction'],['lines','Line relationships'],['facts','Angle facts'],['polygon','Triangles & polygons'],['construct','Shape construction']];
const YEARS=[['custom','All / custom'],['1','Year 1'],['2','Year 2'],['3','Year 3'],['4','Year 4'],['5','Year 5'],['6','Year 6']];
const FAMILIES=[
 ['turn','Describe a turn','turn',1],['direction','Clockwise or anticlockwise','turn',2],['right-turns','Count right-angle turns','turn',3],
 ['right-count','Count right angles in a shape','polygon',3],['right','Compare with a right angle','angle',3],['classify','Name the angle type','angle',4],['compare','Compare two angles','angle',4],['order','Order three angles','angle',4],
 ['estimate','Estimate an angle','angle',5],['measure','Measure using a protractor','angle',5],['draw','Construct a given angle','angle',5],['reflex','Measure a reflex angle','angle',5],['draw-reflex','Construct a reflex angle','angle',5],['estimate-reflex','Estimate a reflex angle','angle',5],['compare-reflex','Compare reflex and other angles','angle',5],
 ['line-orientation','Horizontal or vertical','lines',3],['line-pair','Parallel or perpendicular','lines',3],
 ['straight','Missing angle on a straight line','facts',5],['point','Missing angle around a point','facts',5],['opposite','Vertically opposite angles','facts',6],
 ['rectangle','Angles in rectangles','polygon',5],['triangle-type','Classify a triangle','polygon',4],['quad-type','Classify a quadrilateral','polygon',4],['regularity','Regular or irregular polygon','polygon',5],
 ['triangle','Missing angle in a triangle','polygon',6],['quadrilateral','Missing angle in a quadrilateral','polygon',6],['regular','Interior angle of a regular polygon','polygon',6],
 ['shape-build','Construct a triangle from dimensions and an angle','construct',6],['build-sss','Construct a triangle from three sides','construct',6],['build-equilateral','Construct an equilateral triangle','construct',5],['build-right','Construct a right-angled triangle','construct',5],['build-rectangle','Construct a rectangle','construct',5],['build-square','Construct a square','construct',4],
 ['exterior','Exterior angle of a regular polygon','polygon',7],['parallel','Corresponding and alternate angles','facts',7],['polygon-sum','Interior angle sum of a polygon','polygon',7]
];
const rand=(rng,a,b)=>a+Math.floor(rng()*(b-a+1)),pick=(rng,a)=>a[rand(rng,0,a.length-1)];
function settings(s={}){return {level:LEVELS.some(x=>x[0]===s.level)?s.level:'medium',mode:MODES.some(x=>x[0]===s.mode)?s.mode:'angle',year:YEARS.some(x=>x[0]===String(s.year))?String(s.year):'custom',enrichment:s.enrichment===true||s.enrichment===1||s.enrichment==='1'||s.enrichment==='true'}}
function types(s={}){return FAMILIES.filter(t=>t[3]!==7||settings(s).enrichment||s.type===t[0]).map(([id,label,mode,year])=>({id,label,mode,year}))}
const polar=(x,y,r,a)=>[round(x+r*Math.cos(a*D)),round(y-r*Math.sin(a*D))];
// Snap the movable ray to whole-degree graduations, relative to the fixed ray.
// Outside a semicircle choose the nearer endpoint, not an arbitrary 180°.
function snapAngle(raw,max=180,previous=0){
 const v=mod(raw),n=Math.round(v);
 if(max===180){if(v<=180)return Math.min(180,n);return v<270?180:0}
 if(n===360||n===0)return previous>180?360:0;
 return n;
}
function classify(a){return a===0?'Zero':a<90?'Acute':a===90?'Right':a<180?'Obtuse':a===180?'Straight':a<360?'Reflex':'Full turn'}
function trianglePoints(a,b,x=140,y=315,length=400){const c=180-a-b,other=length*Math.sin(b*D)/Math.sin(c*D);return [[x,y],[x+length,y],polar(x,y,other,a)]}
const polyInterior=n=>180*(n-2)/n,polyExterior=n=>360/n;
function generate(s={},rng=Math.random){
 const cfg=settings(s),available=types({...cfg,type:s.type}),type=s.type==='all'?pick(rng,available).id:s.type;
 if(!available.some(t=>t.id===type))throw Error('Choose an available angle challenge.');
 const mode=FAMILIES.find(t=>t[0]===type)[2],inc=cfg.level==='easy'?15:cfg.level==='hard'?1:5;
 const angle=(min=15,max=165)=>rand(rng,Math.ceil(min/inc),Math.floor(max/inc))*inc;
 const rotation=cfg.level==='easy'?pick(rng,[0,90,180,270]):rand(rng,0,11)*30;
 const base={type,mode,cfg,rotation,angle:angle(),length:5,baseLength:6};
 const task=(extra,prompt,answer,note,choices)=>({...base,...extra,prompt,answer:String(answer),note,...(choices?{choices}:{} )});
 if(['turn','direction','right-turns'].includes(type)){const a=pick(rng,type==='direction'?[90,270]:[90,180,270,360]),clockwise=rng()<.5,turns={90:'Quarter turn',180:'Half turn',270:'Three-quarter turn',360:'Full turn'};return task({angle:a,clockwise,rotation:90},type==='turn'?'How much has the arrow turned?':type==='direction'?'Follow the curved arrow. Which direction is the turn?':'How many right-angle turns are shown?',type==='turn'?turns[a]:type==='direction'?(clockwise?'Clockwise':'Anticlockwise'):a/90,'A quarter turn is one right angle. '+turns[a]+' = '+a+' degrees.',type==='turn'?Object.values(turns):type==='direction'?['Clockwise','Anticlockwise']:null)}
 if(type==='right'){const a=pick(rng,[angle(15,75),90,angle(105,165)]);return task({angle:a},'Is this angle smaller than, equal to, or larger than a right angle?',a<90?'Smaller':a===90?'Equal':'Larger','Compare the opening with a square corner, not the length of its arms.',['Smaller','Equal','Larger'])}
 if(type==='classify'){const a=pick(rng,[angle(15,75),90,angle(105,165),180,angle(195,345)]);return task({angle:a},'Name the marked angle.',classify(a),'Acute < 90°; right = 90°; obtuse between 90° and 180°; straight = 180°; reflex between 180° and 360°.',['Acute','Right','Obtuse','Straight','Reflex'])}
 if(['compare','order','compare-reflex'].includes(type)){const n=type==='order'?3:2,as=type==='compare-reflex'?[angle(195,345)]:[];while(as.length<n){const a=type==='compare-reflex'?angle(15,345):angle();if(!as.includes(a)&&as.every(b=>Math.abs(a-b)>=10))as.push(a)}const labels=['A','B','C'],order=as.map((a,i)=>({a,l:labels[i]})).sort((x,y)=>x.a-y.a).map(v=>v.l);const choices=type!=='order'?labels.slice(0,2):['A B C','A C B','B A C','B C A','C A B','C B A'];return task({angles:as},type!=='order'?'Which marked angle is larger?':'Order the marked angles from smallest to largest.',type!=='order'?order.at(-1):order.join(' '),'Actual openings: '+as.map((a,i)=>labels[i]+' = '+a+'°').join(', ')+'. Compare opening size rather than arm length.',choices)}
 if(type==='estimate'||type==='estimate-reflex'){let a=type==='estimate-reflex'?angle(195,345):angle(15,165);if(a%30===15)a+=1;const nearest=Math.round(a/30)*30,choices=Array.from({length:13},(_,i)=>i*30).filter(v=>Math.abs(v-nearest)<=60);return task({angle:a},'Which estimate is closest to the marked angle?',nearest+'°','The angle is '+a+'°. The nearest multiple of 30° is '+nearest+'°.',choices.map(v=>v+'°'))}
 if(['measure','draw','reflex','draw-reflex'].includes(type)){const a=['reflex','draw-reflex'].includes(type)?angle(195,345):angle(15,165);return task({angle:a},['draw','draw-reflex'].includes(type)?'Construct an angle of '+a+'° from the given baseline.':type==='reflex'?'Measure the marked reflex angle in degrees.':'Read the correct protractor scale. What is the marked angle in degrees?',a,type==='reflex'?'The full turn is 360°. The smaller angle is '+(360-a)+'°, so the reflex angle is '+a+'°.':'Align the centre and zero line with the vertex and baseline. The marked opening is '+a+'°.') }
 if(type==='line-orientation'){const a=pick(rng,[0,90]);return task({angle:a,rotation:0},'Is the marked line horizontal or vertical?',a===0?'Horizontal':'Vertical','Horizontal lines run left to right; vertical lines run up and down.',['Horizontal','Vertical'])}
 if(type==='line-pair'){const relation=pick(rng,['Parallel','Perpendicular','Neither']);return task({relation,angle:relation==='Parallel'?0:relation==='Perpendicular'?90:angle(15,75)},'Describe the relationship between the two lines.',relation,'Parallel lines never meet; perpendicular lines meet at 90°.',['Parallel','Perpendicular','Neither'])}
 if(type==='straight'){const a=angle(20,160);return task({angles:[a,180-a],rotation:rotation},'Find the missing angle x.',180-a,'Angles on a straight line total 180°. 180° − '+a+'° = '+(180-a)+'°.')}
 if(type==='point'){const a=angle(40,110),b=angle(40,110),c=360-a-b;return task({angles:[a,b,c],rotation:rotation},'Find the missing angle x around the point.',c,'Angles around a point total 360°. Subtract '+a+'° and '+b+'° from 360°.')}
 if(type==='opposite'){const a=angle(30,150);return task({angles:[a,180-a,a,180-a]},'Find the angle x vertically opposite the labelled angle.',a,'Vertically opposite angles are equal.')}
 if(type==='right-count'){const shape=pick(rng,['Rectangle','Right-angled triangle','Triangle with no right angle','Parallelogram with no right angles']);return task({shape},'How many right angles does the shape have?',shape==='Rectangle'?4:shape==='Right-angled triangle'?1:0,'Look for square corners, including when the shape has been rotated.');}
 if(type==='rectangle')return task({angles:[90,90,90,90]},'Find the missing corner angle x in this rectangle.',90,'All four angles in a rectangle are right angles.');
 if(type==='triangle-type'){const name=pick(rng,['Equilateral','Isosceles (not equilateral)','Scalene']);const a=name==='Equilateral'?60:name==='Isosceles (not equilateral)'?pick(rng,[40,50,70]):pick(rng,[35,45,55]),b=name==='Scalene'?a+10:a;return task({angles:[a,b,180-a-b],shape:name},'Classify this triangle by its side lengths.',name,'Equal angles face equal sides. A triangle with three equal sides is equilateral; exactly two equal sides is isosceles (not equilateral); no equal sides is scalene.',['Equilateral','Isosceles (not equilateral)','Scalene'])}
 if(type==='quad-type'){const name=pick(rng,['Square','Rectangle (not square)','Rhombus (not square)','Parallelogram (not rectangle or rhombus)','Trapezium']);return task({shape:name},'Choose the most specific description of this quadrilateral.',name,'Use equal-side markings, right angles and parallel sides. Other inclusive family names may also be true. The question asks for the listed most specific description.',['Square','Rectangle (not square)','Rhombus (not square)','Parallelogram (not rectangle or rhombus)','Trapezium'])}
 if(type==='regularity'){const n=pick(rng,[4,5,6,8]),regular=rng()<.5;return task({n,regular},'Is the polygon regular or irregular?',regular?'Regular':'Irregular','A regular polygon has all sides equal and all interior angles equal.',['Regular','Irregular'])}
 if(type==='triangle'){const a=angle(30,70),b=angle(35,75),c=180-a-b;return task({angles:[a,b,c]},'Calculate the missing interior angle x.',c,'Angles in a triangle total 180°. Subtract the two given angles.')}
 if(type==='quadrilateral'){const a=angle(55,125),b=180-a;return task({angles:[a,b,a,b]},'Find the missing interior angle x in the parallelogram.',b,'The four interior angles total 360°. Subtract the three given angles.')}
 if(['regular','exterior','polygon-sum'].includes(type)){const n=pick(rng,[3,4,5,6,8,9,10,12]);return task({n,regular:true},type==='regular'?'Find one interior angle of this regular '+n+'-sided polygon.':type==='exterior'?'Find the exterior turning angle of this regular '+n+'-sided polygon.':'Find the sum of all interior angles of this '+n+'-sided polygon.',type==='regular'?polyInterior(n):type==='exterior'?polyExterior(n):180*(n-2),type==='regular'?'Divide the interior angle sum '+180*(n-2)+'° by '+n+'.':type==='exterior'?'One complete turn is 360°. Divide by '+n+'.':'Divide the polygon into '+(n-2)+' triangles, each with angle sum 180°.')}
 if(type==='parallel'){const a=angle(35,145),relation=pick(rng,['corresponding','alternate']);return task({angle:a,relation,rotation:0},'The lines are parallel. Find the marked '+relation+' angle x.',a,'Corresponding and alternate angles between parallel lines are equal.')}
 if(type==='build-sss'||type==='build-equilateral'){
   const l=type==='build-equilateral'?6:rand(rng,4,7),r=type==='build-equilateral'?6:rand(rng,4,7);
   return task({length:l,rightLength:r,angle:Math.acos((36+l*l-r*r)/(12*l))/D},'Construct triangle ABC with AB = 6 cm, AC = '+l+' cm and BC = '+r+' cm. Draw the remaining sides.', 'AB = 6 cm; AC = '+l+' cm; BC = '+r+' cm','Use the compass to draw arcs of radius '+l+' cm from A and '+r+' cm from B. Their intersection is C. Join C to A and B. Reflection across AB is also valid.');
 }
 if(type==='build-right'){
   const l=rand(rng,3,6);return task({angle:90,length:l},'Construct triangle ABC with AB = 6 cm, AC = '+l+' cm and a right angle at A. Join B to C.','AB = 6 cm; AC = '+l+' cm; angle BAC = 90°','Align the set square or protractor with AB, draw a perpendicular at A, measure '+l+' cm to C and join B to C. Reflection is valid.');
 }
 if(type==='build-rectangle'||type==='build-square'){
   const l=type==='build-square'?6:rand(rng,3,5);
   return task({angle:90,length:l},'Construct '+(type==='build-square'?'a square':'a rectangle')+' ABCD with AB = 6 cm and BC = '+l+' cm. Draw all four sides.','AB = CD = 6 cm; BC = DA = '+l+' cm; four right angles','Draw perpendiculars at A and B on the same side of AB. Measure '+l+' cm along each to locate D and C. Join C and D. Reflection is valid.');
 }
 if(type==='shape-build'){const a=angle(30,120),l=rand(rng,3,7);return task({angle:a,length:l,baseLength:6},'Use geometry instruments to construct triangle ABC with AB = 6 cm, AC = '+l+' cm and angle BAC = '+a+'°. Draw both remaining sides.',a+'°; '+l+' cm','Accept the triangle with AB = 6 cm, AC = '+l+' cm and included angle '+a+'°. Rotation or reflection is also valid on paper.')}
 throw Error('Unknown family');
}

 // Construction Lab geometry uses SVG units: 40 units = 1 cm. No target
 // values enter snapping or instrument alignment.
 const LAB_UNIT=40,LAB_A=[340,302],LAB_B=[580,302];
 const labDist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const labAngle=(a,b)=>mod(Math.atan2(a[1]-b[1],b[0]-a[0])/D);
 const labCross=(a,b)=>a[0]*b[1]-a[1]*b[0],labSub=(a,b)=>[a[0]-b[0],a[1]-b[1]],labDot=(a,b)=>a[0]*b[0]+a[1]*b[1];
 const labAt=(a,v,t)=>[a[0]+v[0]*t,a[1]+v[1]*t];
 function labEmpty(free=false){return {given:!free,points:free?[]:[LAB_A.slice(),LAB_B.slice()],segments:[],rays:[],circles:[]}}
 function labLines(s,exclude=-1){return [...(s.given!==false&&s.points.length>=2?[{a:s.points[0],b:s.points[1],ray:false}]:[]),...s.segments.filter(l=>!l.includes(exclude)).map(([i,j])=>({a:s.points[i],b:s.points[j],ray:false})),...s.rays.filter(r=>r.i!==exclude).map(r=>({a:s.points[r.i],b:labAt(s.points[r.i],[Math.cos(r.angle*D),-Math.sin(r.angle*D)],1),ray:true}))].map(l=>({...l,v:labSub(l.b,l.a)}))}
 function labWithin(l,t){return t>=-1e-7&&(l.ray||t<=1+1e-7)}
 function labSnap(s,p,tol=16,enabled=true,exclude=-1){
  if(!enabled)return {p,kind:''};
  let points=s.points.map((p,i)=>({p,kind:'Vertex',i})).filter(x=>x.i!==exclude);
  const lines=labLines(s,exclude),circles=s.circles.filter(c=>c.i!==exclude).map(c=>({o:s.points[c.i],r:c.r})),intersections=[];
  const add=q=>{if(q.every(Number.isFinite))intersections.push({p:q,kind:'Intersection'})};
  for(let i=0;i<lines.length;i++)for(let j=i+1;j<lines.length;j++){
   const l=lines[i],m=lines[j],v=labSub(m.a,l.a),den=labCross(l.v,m.v);
   if(Math.abs(den)<1e-7)continue;
   const t=labCross(v,m.v)/den,u=labCross(v,l.v)/den;
   if(labWithin(l,t)&&labWithin(m,u))add(labAt(l.a,l.v,t));
  }
  for(const l of lines)for(const c of circles){
   const v=labSub(l.a,c.o),aa=labDot(l.v,l.v),bb=2*labDot(v,l.v),cc=labDot(v,v)-c.r*c.r,disc=bb*bb-4*aa*cc;
   if(aa<1e-8||disc< -1e-7)continue;
   for(const t of [(-bb+Math.sqrt(Math.max(0,disc)))/(2*aa),(-bb-Math.sqrt(Math.max(0,disc)))/(2*aa)])if(labWithin(l,t))add(labAt(l.a,l.v,t));
  }
  for(let i=0;i<circles.length;i++)for(let j=i+1;j<circles.length;j++){
   const a=circles[i],b=circles[j],dist=labDist(a.o,b.o);
   if(dist<1e-7||dist>a.r+b.r+1e-7||dist<Math.abs(a.r-b.r)-1e-7)continue;
   const x=(a.r*a.r-b.r*b.r+dist*dist)/(2*dist),h=Math.sqrt(Math.max(0,a.r*a.r-x*x)),u=labSub(b.o,a.o).map(v=>v/dist),q=labAt(a.o,u,x),v=[-u[1],u[0]];
   add(labAt(q,v,h));add(labAt(q,v,-h));
  }
  const closest=(list)=>list.map(c=>({...c,d:labDist(c.p,p)})).filter(c=>c.d<=tol).sort((a,b)=>a.d-b.d)[0];
  const precise=closest(points)||closest(intersections);if(precise)return precise;
  const guides=[];
  for(const l of lines){const den=labDot(l.v,l.v);if(den<1e-8)continue;const t=labDot(labSub(p,l.a),l.v)/den;if(labWithin(l,t))guides.push({p:labAt(l.a,l.v,t),kind:'On line'})}
  for(const c of circles){const len=labDist(p,c.o);if(len>1e-7)guides.push({p:labAt(c.o,labSub(p,c.o),c.r/len),kind:'On circle'})}
  return closest(guides)||{p,kind:''};
 }
 const labTypes=['shape-build','build-sss','build-equilateral','build-right','build-rectangle','build-square'];
 function labCheck(s,target){
  const linked=(i,j)=>s.segments.some(l=>l.includes(i)&&l.includes(j)),near=(a,b,t=.15)=>Math.abs(a-b)<=t,len=(a,b)=>labDist(a,b)/LAB_UNIT;
  if(s.points.length<3)return {ready:false,correct:false};
  const A=s.points[0],B=s.points[1];
  if(target.type==='build-rectangle'||target.type==='build-square'){
    let ready=false,correct=false;
    for(let c=2;c<s.points.length;c++)for(let d=2;d<s.points.length;d++){
     if(c===d||!linked(1,c)||!linked(c,d)||!linked(d,0))continue;ready=true;
     const C=s.points[c],E=s.points[d],h=target.length*LAB_UNIT,sign=Math.sign(C[1]-B[1]);
     if(sign&&labDist(C,[B[0],B[1]+sign*h])<=6&&labDist(E,[A[0],A[1]+sign*h])<=6&&near(len(C,E),6)&&near(len(B,C),target.length)&&near(len(A,E),target.length))correct=true;
    }
    return {ready,correct};
  }
  const candidates=s.points.slice(2).map((p,k)=>{const i=k+2,angle=labAngle(A,p);return {i,length:len(A,p),rightLength:len(B,p),angle:Math.min(angle,360-angle),joined:linked(0,i)&&linked(1,i)}});
  return {ready:candidates.some(c=>c.joined),correct:candidates.some(c=>c.joined&&near(c.length,target.length)&&(['build-sss','build-equilateral'].includes(target.type)?near(c.rightLength,target.rightLength):near(c.angle,target.angle,2)))};
 }
 function labSolution(d){
  const st=labEmpty(),A=st.points[0],B=st.points[1];
  if(d.type==='build-rectangle'||d.type==='build-square'){st.points.push([B[0],B[1]-40*d.length],[A[0],A[1]-40*d.length]);st.segments.push([1,2],[2,3],[3,0]);return st}
  st.points.push(polar(...A,40*d.length,d.angle));st.segments.push([0,2],[1,2]);
  if(d.type==='build-sss'||d.type==='build-equilateral')st.circles.push({i:0,r:40*d.length},{i:1,r:40*d.rightLength});
  return st;
 }

const model={labEmpty,labSnap,labCheck,labSolution,labTypes,MODES,LEVELS,YEARS,FAMILIES,settings,types,generate,polar,classify,polyInterior,polyExterior,trianglePoints};
if(typeof module==='object'&&module.exports){module.exports=model;return}
const G=root.TT99Goodies;if(!G)return;G.angles=model;
const {q,qa,esc,field,btn,setPanels}=G,CK=G.challengeKit;
function diagram(d,teacher=false,options={}){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),W=800,H=440,ink='#263e43',teal='#277b70',orange='#b56d2c';
 const add=(tag,attrs,t,parent=svg)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(t!=null)e.textContent=t;parent.appendChild(e);return e};
 Object.entries({viewBox:'0 0 '+W+' '+H,xmlns:ns,role:'img','aria-label':'Geometry diagram'}).forEach(([k,v])=>svg.setAttribute(k,v));
 const text=(x,y,v,size=30,extra={})=>add('text',{x,y,fill:ink,'font-family':'Arial,sans-serif','font-size':size,'text-anchor':'middle',...extra},v);
 const line=(a,b,stroke=ink,width=5,extra={})=>add('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke,'stroke-width':width,'stroke-linecap':'round',...extra});
 const path=(p,extra={})=>add('path',{d:p,fill:'none',stroke:teal,'stroke-width':3,...extra});
 const circle=(p,r,fill=teal)=>add('circle',{cx:p[0],cy:p[1],r,fill});
 const arc=(x,y,r,start,a,extra={})=>{if(a>=360){add('circle',{cx:x,cy:y,r,fill:'none',stroke:teal,'stroke-width':3,...extra});return}if(a<=0)return;const p=polar(x,y,r,start),e=polar(x,y,r,start+a);path('M '+p.join(' ')+' A '+r+' '+r+' 0 '+(a>180?1:0)+' 0 '+e.join(' '),extra)};
 // Angle labels sit on their own bisector; neighbouring sectors must not
 // form a single continuous arc. Keep right-angle squares conventional.
 const labelArc=(x,y,r,start,a,label,{labelSize=24,labelRadius=r+25}={})=>{
   const meta={'data-ag-angle-mark':'1','data-ag-radius':r,'data-ag-start':start,'data-ag-sweep':a,'stroke-width':2.5};
   if(Math.abs(a-90)<.01){const p=polar(x,y,r*.75,start),v=polar(x,y,r*.75,start+90),u=[p[0]+v[0]-x,p[1]+v[1]-y];path('M '+p.join(' ')+' L '+u.join(' ')+' L '+v.join(' '),meta)}
   else arc(x,y,r,start,a,meta);
   if(label!=null){const p=polar(x,y,labelRadius,start+a/2);text(p[0],p[1]+labelSize*.32,label,labelSize,{'font-weight':'500','data-ag-angle-label':'1'})}
 };
 const ray=(x,y,r,a,color=ink)=>line([x,y],polar(x,y,r,a),color);
 const arrow=(x,y,r,a,color=ink)=>{const p=polar(x,y,r,a),l=polar(p[0],p[1],16,a+150),rr=polar(p[0],p[1],16,a-150);line([x,y],p,color,5);line(p,l,color,5);line(p,rr,color,5)};
 const background=add('rect',{width:W,height:H,fill:'#fff'});
 // Crop to the mathematical content, not a fixed landscape canvas. Keep the same coordinates for pointer mapping and paper export.
 function frame(x,y,w,h){svg.setAttribute('viewBox',[x,y,w,h].join(' '));Object.entries({x,y,width:w,height:h}).forEach(([k,v])=>background.setAttribute(k,v));return svg}
 const type=d.type,explore=type==='diagram',a=d.angle??60,rot=d.rotation??0,mode=d.mode||'angle';
 function protractor(x,y,r,start,full=false){
   // Baseline always has zero at its ray. Inner scale runs in the opposite direction.
   const range=full?360:180,pts=Array.from({length:range/5+1},(_,i)=>polar(x,y,r,start+i*5));
   const shape='M '+x+' '+y+' L '+pts.map(p=>p.join(' ')).join(' L ')+' Z';
   path(shape,{fill:'#dceee9','fill-opacity':.48,stroke:'#82a69e','stroke-width':1.5});
   for(let i=0;i<=range;i++){if(full&&i===360)break;const p=polar(x,y,r,start+i),p2=polar(x,y,r-(i%10===0?19:i%5===0?12:6),start+i);line(p,p2,'#668d86',i%10===0?2.1:1.05);if(i%10===0){const edge=i===0||i===180,offset=!full&&edge?polar(0,0,15,start-90):[0,0];const t=polar(x,y,r-35,start+i);text(t[0]+offset[0],t[1]+offset[1]+6,String(i),19,{fill:'#285f57','font-weight':'600'});if(!full){const u=polar(x,y,r-(edge?75:62),start+i);text(u[0]+offset[0],u[1]+offset[1]+5,String(180-i),17,{fill:'#80551d','font-weight':'600'})}}}
   line(polar(x,y,r,start),polar(x,y,r,start+180),'#668d86',1.5);circle([x,y],4,'#668d86');
 }
 function single(x,y,r,a,start,label,scale=false,blank=false,full=false){if(scale)protractor(x,y,r,start,full);ray(x,y,r+5,start);if(!blank){ray(x,y,r+5,start+a,teal);labelArc(x,y,Math.min(r*.27,48),start,a,label)}circle([x,y],4,ink)}
 if(mode==='turn'){
   const x=400,y=225,r=136,sign=d.clockwise?-1:1,start=explore?90+rot:90,end=start+sign*a;add('circle',{cx:x,cy:y,r:r+28,fill:'#f8fbfa',stroke:'#d4e2de','stroke-width':2});for(let i=0;i<4;i++)line(polar(x,y,r+18,start+i*90),polar(x,y,r+28,start+i*90),'#a3b8b3',3);
   arrow(x,y,r,start,'#99a9ab');arrow(x,y,r,end,teal);const rr=92;if(a===360)add('circle',{cx:x,cy:y,r:rr,fill:'none',stroke:orange,'stroke-width':4});else if(d.clockwise)arc(x,y,rr,end,a,{stroke:orange,'stroke-width':4});else arc(x,y,rr,start,a,{stroke:orange,'stroke-width':4});const tip=polar(x,y,rr,end),tangent=end+(d.clockwise?-90:90);if(a>0){line(tip,polar(tip[0],tip[1],14,tangent+155),orange,4);line(tip,polar(tip[0],tip[1],14,tangent-155),orange,4);}text(400,420,teacher||explore?(a===0?'No turn':(d.clockwise?'Clockwise':'Anticlockwise')+' · '+a+'°'+({90:' · Quarter turn',180:' · Half turn',270:' · Three-quarter turn',360:' · Full turn'}[a]||'')):'Start: grey arrow   •   Finish: green arrow',24);return frame(110,43,580,397)
 }
 if(mode==='lines'){
   if(type==='line-orientation'){const x=400,y=220;line(polar(x,y,155,a),polar(x,y,155,a+180),teal,6);return frame(208,28,384,384)}
   const r=d.relation||(a===0?'Parallel':a===90?'Perpendicular':'Neither'),x=400,y=220;const start=rot;
   if(r==='Parallel'){for(const off of [-65,65]){const c=polar(x,y,off,start+90);line(polar(...c,180,start),polar(...c,180,start+180),teal,5)}}
   else{line(polar(x,y,180,start),polar(x,y,180,start+180));line(polar(x,y,155,start+a),polar(x,y,155,start+a+180),teal);if(r==='Perpendicular'&&(teacher||explore))labelArc(x,y,35,start,90,'90°')}
   return frame(180,20,440,400)
 }
 if(['compare','order','compare-reflex'].includes(type)){const n=d.angles.length;d.angles.forEach((v,i)=>{const x=(i+.5)*W/n,y=200,r=n===3?105:162;single(x,y,r,v,(rot+i*55)%360,teacher?v+'°':null);text(x,395,['A','B','C'][i],34)});return svg}
 if(mode==='angle'){
   const draw=['draw','draw-reflex'].includes(type),pupilDraw=draw&&!teacher,blank=pupilDraw&&options.attempt==null&&!options.interactive,shown=pupilDraw?(options.attempt??0):a;
   const full=options.full??(shown>180||['reflex','draw-reflex'].includes(type)),scale=options.scale??d.scale??['measure','reflex'].includes(type);
   const r=238,start=rot,x=400,y=220;
   // A rotated semicircle occupies a different bounding rectangle. Include the full arc, rays, degree labels and touch handle, with generous edge clearance.
   const sweep=full?360:180,extent=Array.from({length:sweep+1},(_,i)=>polar(x,y,r+9,start+i));extent.push([x,y]);
   const pad=26,minX=Math.min(...extent.map(p=>p[0]))-pad,maxX=Math.max(...extent.map(p=>p[0]))+pad,minY=Math.min(...extent.map(p=>p[1]))-pad,maxY=Math.max(...extent.map(p=>p[1]))+pad;
   const targetH=pupilDraw&&!options.interactive?42:0;frame(minX,minY,maxX-minX,maxY-minY+targetH);
   single(x,y,r,shown,start,teacher||explore?shown+'°':null,scale,blank||options.interactive,full);
   if(pupilDraw&&!options.interactive)text((minX+maxX)/2,maxY+26,'Target: '+a+'°',25);
   if(options.interactive){
     // The initial handle is at zero, independent of the answer. Show only
     // the pupil's actual ray and its unlabelled arc during construction.
     if(shown>0)labelArc(x,y,48,start,shown,teacher||explore?shown+'°':null);
     const p=polar(x,y,r+9,start+shown);
     line([x,y],p,'#be762b',shown===0?3:5,{'data-ag-moving-arm':'1'});
     add('circle',{cx:p[0],cy:p[1],r:10,fill:'#d58c42',stroke:'#fff','stroke-width':2,'data-ag-angle-handle':'1'});
     add('circle',{cx:x,cy:y,r:r+25,fill:'transparent','data-ag-angle-target':'1',style:'cursor:grab;touch-action:none'});
   }
   return svg
 }
 if(mode==='facts'){
   if(type==='parallel'){const y1=130,y2=310,dx=90/Math.tan(a*D),p=[400+dx,y1],u=[400-dx,y2];line([95,y1],[705,y1]);line([95,y2],[705,y2]);line(polar(...p,90/Math.sin(a*D),a),polar(...u,90/Math.sin(a*D),a+180),teal);const alt=d.relation==='alternate';labelArc(...p,44,alt?180:0,a,a+'°');labelArc(...u,44,0,a,teacher?a+'°':'x');return svg}
   const values=d.angles||[a,180-a],x=400,y=220,r=165;let at=rot;const count=type==='opposite'?4:values.length;
   // Give adjacent sectors different radii, including the last/first
   // pair around a point. Opposite sectors retain matching radii.
   for(let i=0;i<count;i++){
     ray(x,y,r,at);const v=values[i],missing=type==='opposite'?i===2:i===count-1;
     const label=missing&&!teacher&&!explore?'x':type==='opposite'&&i%2===1&&!teacher?null:v+'°';
     const radius=count===3?[49,70,91][i]:i%2===0?70:49;
     // Narrow sectors need additional space for multi-digit labels.
     const halfWidth=(String(label??'').length*24*.56)/2;
     const halfHeight=12,angle=Math.min(v,360-v)*D/2;
     const clearance=(halfWidth+halfHeight*.5+5)/Math.max(.2,Math.sin(angle));
     const labelRadius=Math.min(145,Math.max(radius+24,clearance));
     labelArc(x,y,radius,at,v,label,{labelSize:24,labelRadius});at+=v
   }
   if(type==='straight'||explore&&values.reduce((s,v)=>s+v,0)===180)ray(x,y,r,at);circle([x,y],4,ink);return frame(195,20,410,400)
 }
 function polygon(points){add('polygon',{points:points.map(p=>p.join(',')).join(' '),fill:'#e9f4f0',stroke:ink,'stroke-width':4,'stroke-linejoin':'round'});}
 function corner(points,i,label){const p=points[i],prev=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length],dir=v=>mod(Math.atan2(p[1]-v[1],v[0]-p[0])/D);let start=dir(prev),v=mod(dir(next)-start);if(v>180){start=dir(next);v=360-v}labelArc(...p,Math.min(38,Math.hypot(next[0]-p[0],next[1]-p[1])*.22,Math.hypot(prev[0]-p[0],prev[1]-p[1])*.22),start,v,label)}
 function fit(points){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),s=Math.min(540/Math.max(1,maxX-minX),300/Math.max(1,maxY-minY));return points.map(([x,y])=>[400+(x-(minX+maxX)/2)*s,210+(y-(minY+maxY)/2)*s])}
 function polygonFrame(points,pad=76){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs)-pad,y=Math.min(...ys)-pad;return frame(x,y,Math.max(...xs)-x+pad,Math.max(...ys)-y+pad)}
 if(mode==='construct'&&(d.labDrawing||teacher&&labTypes.includes(d.type))){
   const st=d.labDrawing||labSolution(d),free=st.given===false,ww=free?1000:800,hh=free?640:400;for(let gx=20;gx<=ww-20;gx+=40)line([gx,22],[gx,hh-18],'#e0e9e6',1);for(let gy=22;gy<=hh-18;gy+=40)line([20,gy],[ww-20,gy],'#e0e9e6',1);
   for(const c of st.circles)add('circle',{cx:st.points[c.i][0],cy:st.points[c.i][1],r:c.r,fill:'none',stroke:orange,'stroke-width':1.8,'stroke-dasharray':'5 4'});
   for(const r of st.rays)line(st.points[r.i],polar(...st.points[r.i],1200,r.angle),teal,1.8,{'stroke-dasharray':'7 5'});
   if(!free){line(st.points[0],st.points[1],ink,4);text(460,330,'6 cm',20)}
   for(const [i,j] of st.segments){const a=st.points[i],b=st.points[j];line(a,b,teal,3);if(!free)text((a[0]+b[0])/2,(a[1]+b[1])/2-12,round(labDist(a,b)/40)+' cm',18,{'paint-order':'stroke',stroke:'#fff','stroke-width':4})}
   st.points.forEach((p,i)=>{circle(p,4);text(p[0]+(!free&&i===0?-14:!free&&i===1?14:0),p[1]+(!free&&i<2?17:-13),String.fromCharCode(65+i),20)});
   if(!free&&d.type==='shape-build'||!free&&d.type==='build-right')labelArc(...st.points[0],38,0,d.angle,d.angle+'°');
   if(!free&&['build-rectangle','build-square'].includes(d.type)){for(let i=0;i<4;i++){const p=st.points[i],u=st.points[(i+1)%4],v=st.points[(i+3)%4],a=polar(...p,16,labAngle(p,u)),b=polar(...p,16,labAngle(p,v));path('M '+a.join(' ')+' L '+[a[0]+b[0]-p[0],a[1]+b[1]-p[1]].join(' ')+' L '+b.join(' '),{stroke:teal,'stroke-width':2})}}
   return frame(0,0,ww,hh);
 }
 if(mode==='construct'&&labTypes.includes(d.type)&&!teacher){
   add('rect',{x:24,y:24,width:752,height:370,fill:'#fff',stroke:'#dce8e4','stroke-width':1.5,'stroke-dasharray':'5 5'});return frame(0,0,800,420);
 }
 if(mode==='construct'){
   const show=teacher||explore||options.attempt!=null,aa=teacher||explore?a:options.attempt??0,l=teacher||explore?d.length:options.length??0;
   const x=340,y=302,unit=40,B=[x+6*unit,y],C=polar(x,y,l*unit,aa);
   for(let gx=20;gx<=780;gx+=unit)line([gx,22],[gx,342],'#e0e9e6',1);for(let gy=22;gy<=342;gy+=unit)line([20,gy],[780,gy],'#e0e9e6',1);
   line([x,y],B,ink,4);text(x-18,y+20,'A',26);text(B[0]+16,B[1]+20,'B',26);text((x+B[0])/2,y+33,'6 cm',27);
   if(show&&l>0&&aa>0){line([x,y],C,teal,4);line(C,B,ink,4);text(C[0],C[1]-14,'C',26);labelArc(x,y,43,0,aa,aa+'°');const mid=[(x+C[0])/2,(y+C[1])/2];text(mid[0]-22,mid[1]-12,l+' cm',24)}
   text(400,402,'Scale: each grid square represents 1 cm',25);return svg
 }
 if(mode==='polygon'){
   if(type==='right-count'){const raw=d.shape==='Rectangle'?[[0,0],[260,0],[260,150],[0,150]]:d.shape==='Right-angled triangle'?[[0,0],[220,0],[0,150]]:d.shape==='Triangle with no right angle'?[[0,0],[240,0],[100,160]]:[[0,0],[220,0],[290,140],[70,140]],rad=(rot+25)*D,pts=fit(raw.map(([x,y])=>[x*Math.cos(rad)-y*Math.sin(rad),x*Math.sin(rad)+y*Math.cos(rad)]));polygon(pts);if(teacher&&d.shape==='Rectangle')pts.forEach((_,i)=>corner(pts,i,'90°'));if(teacher&&d.shape==='Right-angled triangle')corner(pts,0,'90°');return polygonFrame(pts)}
   if(type==='rectangle'||type==='quad-type'||type==='quadrilateral'){let points,shape=d.shape;const a=d.angles?.[0]??65;
     if(type==='rectangle'||shape==='Rectangle (not square)')points=[[205,105],[595,105],[595,325],[205,325]];
     else if(shape==='Square')points=[[265,85],[535,85],[535,355],[265,355]];
     else if(shape==='Rhombus (not square)')points=fit([[0,0],[200,0],polar(200,0,200,65),polar(0,0,200,65)]);
     else if(shape==='Trapezium')points=[[250,100],[540,100],[650,325],[150,325]];
     else points=fit([[0,0],[320,0],polar(320,0,180,a),polar(0,0,180,a)]);
     polygon(points);
     if(type==='rectangle'){points.forEach((p,i)=>corner(points,i,i===2&&!teacher?'x':i===2?'90°':null))}
     else if(type==='quadrilateral'){points.forEach((p,i)=>corner(points,i,i===3&&!teacher?'x':d.angles[i]+'°'))}
     else {const lengths=points.map((p,i)=>Math.hypot(points[(i+1)%4][0]-p[0],points[(i+1)%4][1]-p[1]));points.forEach((p,i)=>{const n=points[(i+1)%4],l=lengths[i],equal=lengths.filter(v=>Math.abs(v-l)<.05).length;if(equal>1){const x=(p[0]+n[0])/2,y=(p[1]+n[1])/2,ang=Math.atan2(n[1]-p[1],n[0]-p[0]);const marks=Math.abs(l-Math.max(...lengths))<.05?1:2;for(let k=0;k<marks;k++){const dx=(k-(marks-1)/2)*8*Math.cos(ang),dy=(k-(marks-1)/2)*8*Math.sin(ang);line([x+dx-8*Math.sin(ang),y+dy+8*Math.cos(ang)],[x+dx+8*Math.sin(ang),y+dy-8*Math.cos(ang)],teal,3)}}});if(shape==='Square'||shape==='Rectangle (not square)')points.forEach((p,i)=>corner(points,i,null))}
     return polygonFrame(points)
   }
   if(type==='triangle'||type==='triangle-type'){const v=d.angles,points=fit(trianglePoints(v[0],v[1]));polygon(points);points.forEach((p,i)=>corner(points,i,type==='triangle'&&i===2&&!teacher?'x':v[i]+'°'));return polygonFrame(points)}
   const n=d.n||5,regular=d.regular!==false,pts=Array.from({length:n},(_,i)=>polar(400,218,!regular&&i===1?155*(1-(1-Math.cos(360/n*D))*.65):155,90+rot+i*360/n));polygon(pts);
   if(type==='polygon-sum'||explore&&d.triangulate!==false){for(let i=2;i<n-1;i++)line(pts[0],pts[i],'#89aaa1',2,{'stroke-dasharray':'5 5'});if(teacher||explore)text(400,410,(n-2)+' × 180° = '+180*(n-2)+'°',24)}
   if(explore&&d.showCorners!==false&&regular)corner(pts,0,round(polyInterior(n))+'°');
   if(type==='regular')corner(pts,0,teacher?polyInterior(n)+'°':'x');
   if(type==='exterior'){const p=pts[0],prev=pts.at(-1),next=pts[1],start=mod(Math.atan2(prev[1]-p[1],p[0]-prev[0])/D),end=mod(Math.atan2(p[1]-next[1],next[0]-p[0])/D),delta=mod(end-start);ray(...p,68,end);labelArc(...p,34,delta<=180?start:end,Math.min(delta,360-delta),teacher?polyExterior(n)+'°':'x')}
   if(type==='regularity'&&teacher)text(400,410,regular?'Regular: equal sides and angles':'Irregular: sides or angles differ',27);
   return type==='regularity'&&teacher||type==='polygon-sum'||explore?frame(125,22,550,418):polygonFrame(pts,90)
 }
 return svg
}
function geometry(t){return {...t,mode:t.geometryMode||FAMILIES.find(f=>f[0]===t.type)?.[2]||t.mode}}
function paper(item,teacher){const d=geometry(item.data);if(item.kind==='diagram')return diagram(d,true,{scale:d.scale});let prompt=d.prompt;if(labTypes.includes(d.type))prompt+=' On paper, draw AB = 6 cm first using your ruler. Use your geometry set in the working space.';if(d.choices)prompt+=' Choices: '+d.choices.join(' / ')+'.';return G.exportTools.composeWorksheetCardSvg(diagram(d,teacher,{scale:['measure','reflex'].includes(d.type)||teacher&&['draw','draw-reflex'].includes(d.type)}),{title:'Angles & geometry',prompt,responseMode:(['draw','draw-reflex'].includes(d.type)||labTypes.includes(d.type))?'none':d.choices?'lines':'box',responseLines:1,responseLabel:'Answer',paperStyle:'plain',answer:d.answer,showAnswer:teacher})}
if(G.publishing)G.publishing.register(ID,{label:'Angles & geometry',types:s=>types(s),title:item=>FAMILIES.find(t=>t[0]===item.data.type)?.[1]||'Angle illustration',recipe:(s,type)=>({...settings(s),type}),generate,signature:d=>JSON.stringify([d.type,d.angle,d.angles,d.rotation,d.clockwise,d.n,d.regular,d.shape,d.relation,d.length,d.rightLength]),capture:s=>[G.publishing.record(ID,s.task?'challenge':'diagram',s.task?{...geometry(s.task),revealed:false}:s.demo)],render:paper,answerSummary:item=>item.data.answer,answerGraphic:item=>diagram(geometry(item.data),true,{scale:['measure','draw','draw-reflex','reflex'].includes(item.data.type)}),answerNote:item=>item.data.note||''});

 function mountLab(box,initial,onChange,{free=false}={}){
  const ww=free?1000:800,hh=free?640:400;let st=initial||labEmpty(free),corner=0,tool='segment',first=null,aligned=null,hover=null,history=[],snap=true,measure=true,grid=true,drag=null,guideOpen=false,guideStep=0;
  const clone=x=>JSON.parse(JSON.stringify(x)),save=()=>history.push(clone(st)),N='http://www.w3.org/2000/svg';
  const toolbar=document.createElement('div');toolbar.className='gd-ag-lab-toolbar';toolbar.setAttribute('aria-label','Construction tools');
  const instruments=document.createElement('div');instruments.className='gd-ag-lab-tools';instruments.setAttribute('role','group');instruments.setAttribute('aria-label','Drawing instruments');
  const helpers=document.createElement('div');helpers.className='gd-ag-lab-helpers';
  const actions=document.createElement('div');actions.className='gd-ag-lab-actions';actions.setAttribute('role','group');actions.setAttribute('aria-label','Drawing actions');
  const options=document.createElement('div');options.className='gd-ag-lab-options';options.setAttribute('role','group');options.setAttribute('aria-label','Drawing assistance');
  helpers.append(actions,options);toolbar.append(instruments,helpers);
  const svg=document.createElementNS(N,'svg');svg.setAttribute('viewBox','0 0 '+ww+' '+hh);svg.classList.add('gd-ag-lab-canvas');svg.style.cssText='width:100%;max-height:'+(free?'820':'620')+'px;display:block;touch-action:none;user-select:none;background:white;border:1px solid #cbded8;border-radius:8px';
  const hint=document.createElement('p');hint.className='gd-help';hint.style.cssText='text-align:center;min-height:24px;margin:5px 0';
  const guide=document.createElement('section');guide.className='gd-ag-lab-guide';guide.hidden=true;box.replaceChildren(toolbar,svg,hint,guide);
  const icons={
    move:'<path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
    point:'<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><path d="M12 3v4m0 10v4M3 12h4m10 0h4"/>',
    segment:'<rect x="2.5" y="7.5" width="19" height="9" rx="1.5"/><path d="M6 8v4m4-4v2.5m4-2.5v4m4-4v2.5"/>',
    ray:'<path d="M5 19L20 4M13 4h7v7"/><circle cx="4" cy="20" r="1.6" fill="currentColor" stroke="none"/>',
    protractor:'<path d="M2 17a10 10 0 0 1 20 0Z M12 7v4M5 10l2.5 3M19 10l-2.5 3M3 14l3 1M21 14l-3 1"/><circle cx="12" cy="17" r="1.2" fill="currentColor" stroke="none"/>',
    square45:'<path d="M3 3v18h18Z M7 12v5h5Z M3 17h4v4"/>',
    square30:'<path d="M2 20h20L2 8Z M6 14v3h5Z M2 16h4v4"/>',
    compass:'<circle cx="12" cy="5" r="2.5"/><path d="M11 7L5 21M13 7l6 14M7.5 15h9M12 2V1"/>',
    erase:'<path d="M3 14l10-10a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-8 8H9L3 14ZM8 9l9 9M13 20h9"/>',
    corner:'<path d="M4 4v16h16Z M4 15h5v5"/><path d="M12 2a8 8 0 0 1 9 8m-4-3 4 3 2-4"/>',
    flip:'<path d="M3 18l7-12v12ZM21 18L14 6v12ZM12 3v2m0 4v2m0 4v2m0 4v1"/>',
    undo:'<path d="M8 5L3 10l5 5M3 10h11a6 6 0 0 1 0 12h-3"/>',
    reset:'<path d="M3 11a9 9 0 1 1 2.5 7M3 4v7h7"/>',
    snap:'<path d="M5 3v10a7 7 0 0 0 14 0V3h-5v10a2 2 0 0 1-4 0V3ZM5 8h5m4 0h5"/>',
    measure:'<path d="M3 18h18M3 15v6m18-6v6M4 8h16M4 8l4-4M4 8l4 4m12-4-4-4m4 4-4 4"/>',
    grid:'<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18m6-18v18M3 9h18M3 15h18"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 1 1 4 3c-1 .5-1 1-1 2m0 3v.2"/>'
  };
  function icon(id){const x=document.createElementNS(N,'svg');x.setAttribute('viewBox','0 0 24 24');x.setAttribute('fill','none');x.setAttribute('stroke','currentColor');x.setAttribute('stroke-width','1.65');x.setAttribute('stroke-linecap','round');x.setAttribute('stroke-linejoin','round');x.setAttribute('aria-hidden','true');x.setAttribute('focusable','false');x.innerHTML=icons[id];return x}
  const controls=[['move','Move','Move points'],['point','Point','Place a point'],['segment','Ruler','Draw a straight line with the ruler'],['ray','Ray','Draw a ray'],['protractor','Protractor','Measure and draw an angle'],['square45','45°','45° set square'],['square30','30°–60°','30°–60° set square'],['compass','Compass','Draw a compass circle'],['erase','Erase','Erase a drawn object']];
  function button(id,label,description,fn,parent=actions){const b=document.createElement('button');b.type='button';b.className='gd-btn gd-ag-lab-button';b.dataset.agTool=id;b.title=description;b.setAttribute('aria-label',description);const t=document.createElement('span');t.textContent=label;b.append(icon(id),t);b.onclick=fn;parent.append(b);return b}
  const buttons=controls.map(([id,label,desc])=>[id,button(id,label,desc,()=>{tool=id;first=null;aligned=null;hover=null;guideStep=0;paint()},instruments)]);
  const cornerButton=button('corner','Corner','Change set square corner',()=>{corner=(corner+1)%3;paint()});
  button('flip','Flip','Flip instrument',()=>{if(aligned!==null){aligned=mod(aligned+180);paint()}}).dataset.agFlip='1';
  const undoButton=button('undo','Undo','Undo last drawing action',()=>{if(history.length){st=history.pop();first=null;aligned=null;changed()}});
  button('reset','Reset','Reset construction',()=>{save();st=labEmpty(free);first=null;aligned=null;changed()});
  const guideButton=button('help',free?'Help / demo':'Tool help','Show instrument instructions',()=>{guideOpen=!guideOpen;guideStep=0;paint()});
  for(const [id,label,get,set] of [['snap','Snap',()=>snap,v=>snap=v],['measure','Measurements',()=>measure,v=>measure=v],['grid','Grid',()=>grid,v=>grid=v]]){
   const l=document.createElement('label');l.className='gd-ag-lab-option';const input=document.createElement('input');input.type='checkbox';input.checked=get();input.onchange=()=>{set(input.checked);paint()};const t=document.createElement('span');t.textContent=label;l.append(input,icon(id),t);options.append(l);
  }
  const angleTool=()=>['protractor','square45','square30'].includes(tool);
  const nearest=(p,skip=-1)=>{const a=st.points.map((q,i)=>({i,d:labDist(q,p)})).filter(x=>x.i!==skip).sort((a,b)=>a.d-b.d)[0];return a&&a.d<=tolerance()?a.i:-1};
  function tolerance(){const m=svg.getScreenCTM();return m?Math.min(42,20/Math.hypot(m.a,m.b)):20}
  const magnetic=(p,exclude=-1)=>labSnap(st,p,tolerance(),snap,exclude);
  function point(p){const hit=magnetic(p);const i=st.points.findIndex(q=>labDist(q,hit.p)<.001);if(i>=0)return i;st.points.push(hit.p.slice());return st.points.length-1}
  function changed(){onChange(clone(st));paint()}
  function el(tag,attrs,txt){const x=document.createElementNS(N,tag);for(const [k,v] of Object.entries(attrs))x.setAttribute(k,v);if(txt!=null)x.textContent=txt;svg.append(x);return x}
  function line(a,b,color='#284d46',w=2.5,dash=''){el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:color,'stroke-width':w,'stroke-linecap':'round','stroke-dasharray':dash})}
  function text(p,t,color='#325a50',size=15){el('text',{x:p[0],y:p[1],fill:color,'font-size':size,'font-family':'Arial,sans-serif','text-anchor':'middle','paint-order':'stroke',stroke:'white','stroke-width':3},t)}
  function circle(p,r,stroke,fill='none',dash=''){el('circle',{cx:p[0],cy:p[1],r,stroke,fill,'stroke-width':2,'stroke-dasharray':dash})}
  function segment(a,b,color='#285c52'){line(a,b,color,3);if(measure)text([(a[0]+b[0])/2,(a[1]+b[1])/2-10],(labDist(a,b)/LAB_UNIT).toFixed(1)+' cm',color)}
  // Instrument is anchored to the chosen vertex and aligned to a direction
  // selected by the pupil. The triangle edges, not target angles, determine rays.
  function instrument(o,base){
   if(tool==='protractor'){
    const r=125,pts=Array.from({length:181},(_,i)=>polar(...o,r,base+i));
    el('polygon',{points:[o,...pts].map(p=>p.join(',')).join(' '),fill:'#c5e3da','fill-opacity':.55,stroke:'#76a99b','stroke-width':1.5});
    for(let i=0;i<=180;i++){line(polar(...o,r,base+i),polar(...o,r-(i%10===0?12:i%5===0?8:4),base+i),'#73988f',i%10===0?1.4:.65);if(i%10===0){const p=polar(...o,r-24,base+i);text([p[0],p[1]+4],i,'#285d51',12)}}
   }else{
    const angles=tool==='square45'?[90,45,45]:[90,30,60],opening=angles[corner],other=angles[(corner+1)%3],r=140*Math.sin(other*D)/Math.sin(angles[(corner+2)%3]*D),v=polar(...o,140,base),w=polar(...o,r,base+opening);
    el('polygon',{points:[o,v,w].map(p=>p.join(',')).join(' '),fill:'#c5e3da','fill-opacity':.65,stroke:'#458778','stroke-width':2});
    if(opening===90){const a=polar(...o,13,base),b=polar(...o,13,base+90);line(a,[a[0]+b[0]-o[0],a[1]+b[1]-o[1]],'#458778',1.5);line(b,[a[0]+b[0]-o[0],a[1]+b[1]-o[1]],'#458778',1.5);}
    // Alternate corner placement: use the acute vertex as well as the right-angle vertex.
    text(polar(...o,30,base+opening/2),opening+'°','#326e61',12);const vb=labAngle(v,o),vw=labAngle(v,w);text(polar(...v,25,vw+mod(vb-vw)/2),other+'°','#326e61',12);const wo=labAngle(w,o),wv=labAngle(w,v);text(polar(...w,25,wo+mod(wv-wo)/2),angles[(corner+2)%3]+'°','#326e61',12);
   }
  }
  function selectedAngle(o,p){
   const a=labAngle(o,p),base=aligned??0,relative=mod(a-base);
   if(tool==='protractor')return mod(base+Math.round(relative<=180?relative:relative<270?180:0));
   const choices=[0,(tool==='square45'?[90,45,45]:[90,30,60])[corner]];
   // Actual set-square orientation is adjusted below to show the chosen edge.
   const diff=(x,y)=>Math.min(mod(x-y),mod(y-x));return mod(base+choices.reduce((x,y)=>diff(y,relative)<diff(x,relative)?y:x));
  }
  const helpSteps={
   move:['Select Move.','Press and drag a point to its new position. Connected lines move with it.','Release to keep the new position. Use Undo if needed.'],
   point:['Select Point.','Touch near an endpoint or crossing. The magnetic highlight shows the exact snap position.','Place the point. You can now join other lines to it.'],
   segment:['Select Ruler.','Tap the starting point.','Touch the ending point, slide to refine the length, and release. A straight segment joins the two points.'],
   ray:['Select Ray.','Tap the starting point.','Touch in the direction you want the ray to extend, then release. A dashed construction ray appears.'],
   protractor:['Select Protractor.','Tap the vertex, then tap along the reference line to align the zero edge.','Read the graduations from that edge. Touch the required direction and release to draw the ray.'],
   square45:['Select the 45° set square.','Choose a corner, tap a vertex and align the reference edge. Use Flip if the instrument faces the wrong way.','Draw along the other edge of the triangle. The tool has two 45° corners and one 90° corner.'],
   square30:['Select the 30°–60° set square.','Choose the appropriate corner, tap a vertex and align the reference edge. Use Flip if needed.','Draw along the other edge. This instrument has 30°, 60° and 90° corners.'],
   compass:['Select Compass.','Tap the centre. Touch and slide to set the radius using the length reading.','Release to draw a construction circle. Use Point to mark its intersection with another line or circle.'],
   erase:['Select Erase.','Tap the object you want to remove. A point and its attached objects are removed together.','Undo restores the previous construction. Given challenge baselines are protected.']
  };
  function guideGraphic(step){
   // This sample is isolated from pupil work, and is available only in free mode.
   const sample=labEmpty();const A=sample.points[0],B=sample.points[1],C=polar(...A,180,40);
   if(tool==='segment'||tool==='move'||tool==='erase'||tool==='point'){
    if(step>=1)sample.points.push(tool==='move'&&step===2?polar(...A,180,65):C);
    if((tool==='segment'&&step===2)||tool==='move'&&step>=1||tool==='erase'&&step===1)sample.segments.push([0,2]);
    if(tool==='erase'&&step===2)sample.points.pop();
   }else if(tool==='compass'){if(step>=1)sample.circles.push({i:0,r:180});if(step===2){sample.rays.push({i:0,angle:40});sample.points.push(C)}}
   else if(tool==='ray'){if(step>=1)sample.points.push(C);if(step===2)sample.rays.push({i:0,angle:40})}
   else if(step===2)sample.rays.push({i:0,angle:tool==='square45'?45:tool==='square30'?30:40});
   const picture=diagram({type:'diagram',mode:'construct',labDrawing:sample},true);picture.setAttribute('aria-label','Worked example of '+tool);
   picture.style.cssText='width:100%;max-height:230px;display:block';
   if(step>=1&&['protractor','square45','square30'].includes(tool)){
    const add=(tag,attrs,content)=>{const e=document.createElementNS(N,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(content!=null)e.textContent=content;picture.append(e);return e};
    if(tool==='protractor'){const r=125,pts=Array.from({length:181},(_,i)=>polar(...A,r,i));add('polygon',{points:[A,...pts].map(p=>p.join(',')).join(' '),fill:'#c5e3da','fill-opacity':.55,stroke:'#76a99b'});for(let i=0;i<=180;i+=5){const p=polar(...A,r,i),q=polar(...A,r-(i%10===0?12:5),i);add('line',{x1:p[0],y1:p[1],x2:q[0],y2:q[1],stroke:'#477c70'});if(i%20===0){const t=polar(...A,r-22,i);add('text',{x:t[0],y:t[1]+4,'font-size':12,'text-anchor':'middle',fill:'#285d51'},i)}}}
    else{const a=tool==='square45'?45:30,v=polar(...A,150,0),w=polar(...A,150/Math.cos(a*D),a);add('polygon',{points:[A,v,w].map(p=>p.join(',')).join(' '),fill:'#c5e3da','fill-opacity':.6,stroke:'#458778','stroke-width':2});const p=polar(...A,42,a/2);add('text',{x:p[0],y:p[1]+4,'font-size':15,fill:'#285d51'},a+'°')}
    if(step===2){const p=polar(...A,200,tool==='square45'?45:tool==='square30'?30:40);add('line',{x1:A[0],y1:A[1],x2:p[0],y2:p[1],stroke:'#b77b32','stroke-width':3})}
   }
   return picture;
  }
  let guideKey='';
  function paintGuide(){
   guideButton.setAttribute('aria-expanded',String(guideOpen));guide.hidden=!guideOpen;
   const key=[guideOpen,tool,guideStep,free].join(':');if(key===guideKey)return;guideKey=key;
   if(!guideOpen){guide.replaceChildren();return}
   const steps=helpSteps[tool],header=document.createElement('strong');header.textContent=controls.find(c=>c[0]===tool)?.[2]||'Using the tool';
   const body=document.createElement('div');body.className='gd-ag-guide-body';
   const list=document.createElement('ol');steps.forEach((t,i)=>{const li=document.createElement('li');li.textContent=t;if(free&&i===guideStep)li.className='is-current';list.append(li)});body.append(list);
   if(free){const demo=document.createElement('div');demo.className='gd-ag-guide-example';demo.append(guideGraphic(guideStep));const nav=document.createElement('div');nav.className='gd-row';const prev=document.createElement('button'),next=document.createElement('button'),read=document.createElement('span');for(const b of [prev,next]){b.className='gd-btn';b.type='button'}prev.textContent='Previous';prev.disabled=guideStep===0;prev.onclick=()=>{guideStep--;paintGuide()};next.textContent=guideStep===2?'Replay':'Next step';next.onclick=()=>{guideStep=(guideStep+1)%3;paintGuide()};read.textContent='Step '+(guideStep+1)+' / 3';nav.append(prev,read,next);demo.append(nav);body.append(demo)}
   guide.replaceChildren(header,body);
  }
  function paint(){
   paintGuide();cornerButton.hidden=!tool.startsWith('square');const flip=toolbar.querySelector('[data-ag-flip]');flip.hidden=!angleTool()||aligned===null;
   buttons.forEach(([id,b])=>{b.classList.toggle('gd-btn--primary',id===tool);b.setAttribute('aria-pressed',String(id===tool))});undoButton.disabled=history.length===0;
   svg.replaceChildren();el('rect',{width:ww,height:hh,fill:'#fff'});
   if(grid){for(let x=20;x<ww;x+=40)line([x,22],[x,hh-18],'#e1ebe6',1);for(let y=22;y<=hh-18;y+=40)line([20,y],[ww-20,y],'#e1ebe6',1)}
   for(const c of st.circles)circle(st.points[c.i],c.r,'#a97830','none','5 4');
   for(const r of st.rays)line(st.points[r.i],polar(...st.points[r.i],1200,r.angle),'#63978a',1.8,'7 5');
   if(st.given!==false&&st.points.length>=2){line(st.points[0],st.points[1],'#283f3a',4);text([460,330],'6 cm')}
   for(const [i,j] of st.segments)segment(st.points[i],st.points[j]);
   if(angleTool()&&first!==null&&aligned!==null)instrument(st.points[first],aligned);
   if(hover){const hit=magnetic(hover,drag??-1),p=hit.p;
    if(first!==null){const a=st.points[first];
     if(angleTool()&&aligned!==null){const v=selectedAngle(a,p);line(a,polar(...a,190,v),'#b77b32',3);if(measure)text(polar(...a,75,aligned+mod(v-aligned)/2),Math.round(mod(v-aligned))+'°','#996221')}
     else if(tool==='compass'){const r=Math.round(labDist(a,p)/4)*4;circle(a,r,'#b77b32');line(a,p,'#b77b32',1.5);if(measure)text([(a[0]+p[0])/2,(a[1]+p[1])/2-10],(r/LAB_UNIT).toFixed(1)+' cm','#996221')}
     else if(tool==='segment'||tool==='ray'||angleTool())line(a,p,'#b77b32',2,'5 4');
    }
    if(hit.kind){circle(p,12,'#2e9982','#d5eee5');circle(p,3,'#2e9982','#2e9982');text([p[0],p[1]-18],hit.kind,'#287b69',12)}
   }
   st.points.forEach((p,i)=>{circle(p,i===first?7:5,'white',st.given!==false&&i<2?'#28413d':'#287f6c');text([p[0]+(i===0?-14:i===1?14:0),p[1]+(i<2?17:-13)],String.fromCharCode(65+i))});
   hint.textContent=angleTool()?(first===null?'Tap a vertex to place the instrument.':aligned===null?'Tap along the reference edge to align the instrument.':'Choose a direction on the instrument to draw a ray.'):tool==='move'?'Drag a movable point.':tool==='point'?'Tap a point or a highlighted intersection.':tool==='erase'?'Tap a drawn point, line or circle to erase.':first===null?'Tap the starting point.':'Touch, slide to refine, then release to place.';
  }
  function coords(e){const m=svg.getScreenCTM();if(!m)return null;return new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse())}
  let placing=null;
  svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;const z=coords(e);if(!z)return;const p=[z.x,z.y];e.preventDefault();hover=p;
   if(first!==null&&tool!=='move'&&tool!=='erase'&&tool!=='point'){placing=e.pointerId;try{svg.setPointerCapture(e.pointerId)}catch(_){}paint();return}
   place(p,e);
  });
  function place(p,e){
   if(tool==='move'){const i=nearest(p);if(i>=(st.given===false?0:2)){save();drag=i;try{svg.setPointerCapture(e.pointerId)}catch(_){}}return}
   if(tool==='erase'){const i=nearest(p);if(i>=(st.given===false?0:2)){save();st.points.splice(i,1);st.segments=st.segments.filter(l=>!l.includes(i)).map(l=>l.map(j=>j>i?j-1:j));for(const k of ['rays','circles'])st[k]=st[k].filter(r=>r.i!==i).map(r=>({...r,i:r.i>i?r.i-1:r.i}));changed();return}
    const distanceTo=(a,b,ray=false)=>{const v=labSub(b,a),t=labDot(labSub(p,a),v)/(labDot(v,v)||1);return labDist(p,labAt(a,v,Math.max(0,ray?t:Math.min(1,t))))};
    let k=st.segments.findIndex(([i,j])=>distanceTo(st.points[i],st.points[j])<tolerance());if(k>=0){save();st.segments.splice(k,1)}else{k=st.rays.findIndex(r=>distanceTo(st.points[r.i],polar(...st.points[r.i],1,r.angle),true)<tolerance());if(k>=0){save();st.rays.splice(k,1)}else{k=st.circles.findIndex(c=>Math.abs(labDist(p,st.points[c.i])-c.r)<tolerance());if(k>=0){save();st.circles.splice(k,1)}}}changed();return;
   }
   if(tool==='point'){save();point(p);changed();return}
   if(first===null){save();first=point(p);changed();return}
   const o=st.points[first];if(labDist(o,p)<8)return;
   if(angleTool()&&aligned===null){const target=magnetic(p).p;aligned=labAngle(o,target);paint();return}
   save();
   if(tool==='segment'){const j=point(p);if(j!==first&&!st.segments.some(l=>l.includes(first)&&l.includes(j)))st.segments.push([first,j])}
   else if(tool==='compass'){const r=Math.round(labDist(o,magnetic(p).p)/4)*4;if(r>0)st.circles.push({i:first,r})}
   else if(tool==='ray'||angleTool()){const a=angleTool()?selectedAngle(o,p):Math.round(labAngle(o,magnetic(p).p));st.rays.push({i:first,angle:a})}
   first=null;aligned=null;hover=null;changed();
  }
  svg.addEventListener('pointermove',e=>{const z=coords(e);if(!z)return;hover=[z.x,z.y];if(drag!==null){const p=[Math.max(5,Math.min(ww-5,z.x)),Math.max(5,Math.min(hh-5,z.y))];st.points[drag]=magnetic(p,drag).p.slice();changed()}else paint()});
  svg.addEventListener('pointerup',e=>{if(placing===e.pointerId){placing=null;const z=coords(e);if(z)place([z.x,z.y],e)}drag=null;paint()});
  const cancel=()=>{placing=null;drag=null;paint()};svg.addEventListener('pointercancel',cancel);svg.addEventListener('lostpointercapture',cancel);
  paint();
 }

G.anglesTool=function(){
 let cfg=settings(),demo={type:'diagram',mode:'angle',angle:60,rotation:0,scale:true,clockwise:false,n:5,regular:true,length:5,baseLength:6},task=null,workflow='build',attempt=null,attemptLength=null,scope='',status='',draft=null,lab=null,freeLab=null;
 const snapshot=()=>({...cfg,demo:demoData(),task,workflow,attempt,attemptLength,scope,lab,freeLab,pupil:CK.capturePupil(task)});
 const select=(id,opts,current)=>'<select class="gd-select" id="'+id+'">'+opts.map(([v,l])=>'<option value="'+esc(v)+'"'+(String(v)===String(current)?' selected':'')+'>'+esc(l)+'</option>').join('')+'</select>';
 const report=s=>{status=s;const el=q('#ag-status');if(el)el.textContent=s};
 function launch(type){try{const native=CK.nativeScope('ag');if(native)scope=native;const actual=type==='all'?pick(Math.random,types(cfg)).id:type;task=CK.normalise({...generate({...cfg,type:actual}),mode:'standard',answerMode:'manual',revealed:false});task.geometryMode=FAMILIES.find(t=>t[0]===actual)[2];attempt=null;attemptLength=null;lab=null;scope=CK.nativeScope('ag')||scope;workflow='challenge';render()}catch(e){report(e.message)}}
 // CK reserves mode for standard/custom; restore the geometry display mode for drawing/export.
 function geometryTask(t){return t?{...t,mode:t.geometryMode||FAMILIES.find(f=>f[0]===t.type)?.[2]||t.mode}:null}
 function exportRecord(){return {tool:ID,kind:task?'challenge':'diagram',data:task?{...geometryTask(task),revealed:false}:demoData()}}
 async function exportAction(kind){try{const teacher=kind.startsWith('key-');if(teacher&&!task)return;const X=G.exportTools,out=paper(exportRecord(),teacher);if(kind==='copy'||kind==='key-copy')await X.copyPng(out);else if(kind==='png')await X.downloadPng(out,'angles-and-geometry',2);else if(kind==='svg')X.downloadSvg(out,'angles-and-geometry');else X.printSvg(out,{title:teacher?'Angles — teacher key':'Angles & geometry',landscape:true});report('Export ready.')}catch(e){report(e.message)}}
 function publish(batch){const P=G.publishing;try{if(!P)throw Error('Publishing unavailable');draft=draft||P.createDocument();if(batch)P.openQuickGenerate(draft,ID,snapshot());else{draft.addCurrent(ID,snapshot());P.openEditor(draft)}}catch(e){report(e.message)}}
 function controls(){const host=q('#gd-controls'),tabs='<div class="gd-row" role="tablist" aria-label="Angles workflow">'+[['build','Explore'],['challenge','Challenge'],['export','Export']].map(([v,l])=>'<button type="button" class="gd-btn'+(workflow===v?' gd-btn--primary':'')+'" data-ag-workflow="'+v+'">'+l+'</button>').join('')+'</div>';
  const common=field('Curriculum suggestions',select('ag-year',YEARS,cfg.year))+field('Difficulty',select('ag-level',LEVELS,cfg.level))+'<label class="gd-field"><span><input type="checkbox" id="ag-enrich"'+(cfg.enrichment?' checked':'')+'> Include KS3 enrichment</span></label>';
  const avail=types(cfg),groups=MODES.map(([id,label])=>({id,label,ids:avail.filter(t=>t.mode===id).map(t=>t.id)})).filter(g=>g.ids.length);
  const challenge=common+'<p class="gd-help">Year suggestions are advisory. Choose a topic or generate across all types.</p>'+CK.nativeRandomHtml('ag',groups)+avail.map(t=>'<button type="button" class="gd-btn" data-ag-challenge-mode="'+t.id+'">'+esc(t.label)+'</button>').join('');
  const angleField=(max=360,min=0)=>field(demo.mode==='turn'?'Turn amount':'Angle opening',select('ag-value',Array.from({length:max-min+1},(_,i)=>[i+min,(i+min)+'°']),Math.max(min,Math.min(max,demo.angle))));
  const rotationField=field(demo.mode==='turn'?'Starting direction':'Orientation',select('ag-rotation',Array.from({length:24},(_,i)=>[i*15,i*15+'°']),demo.rotation));
  const check=(id,label,on)=>'<label class="gd-field"><span><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'> '+label+'</span></label>';
  const modeFields={
    angle:angleField()+rotationField+check('ag-scale','Show protractor',demo.scale),
    turn:angleField()+rotationField+field('Turn direction',select('ag-direction',[['cw','Clockwise'],['ccw','Anticlockwise']],demo.clockwise?'cw':'ccw')),
    polygon:field('Sides',select('ag-sides',Array.from({length:10},(_,i)=>[i+3,i+3]),demo.n))+rotationField+check('ag-regular','Regular polygon',demo.regular)+check('ag-triangulate','Show triangulation',demo.triangulate!==false)+check('ag-corners','Show one interior angle (regular polygons)',demo.showCorners!==false),
    construct:check('ag-free-lab','Free construction workspace',demo.freeLab===true)+(!demo.freeLab?angleField(170,10)+field('AC length (cm)',select('ag-length',Array.from({length:7},(_,i)=>[i+1,i+1]),demo.length)):'') ,
    facts:angleField(170,10)+rotationField+field('Angle relationship',select('ag-fact',[['straight','Straight line'],['point','Around a point'],['opposite','Vertically opposite']],demo.fact||'straight')),
    lines:field('Line relationship',select('ag-relation',[['Parallel','Parallel'],['Perpendicular','Perpendicular'],['Neither','Neither']],demo.relation||'Neither'))+rotationField+(!demo.relation||demo.relation==='Neither'?angleField(80,10):'')
  };
  const exploration=field('Explore',select('ag-mode',MODES,demo.mode))+modeFields[demo.mode]+'<p class="gd-help">Use the controls for the selected diagram.</p>';
  const exports='<p class="gd-help">'+(task?'Pupil copies always hide the answer. Use a separate teacher key.':'Export the current teaching diagram.')+'</p><div class="gd-row">'+btn('Copy image','ag-copy')+btn('PNG','ag-png')+btn('SVG','ag-svg')+btn('Print / PDF','ag-print')+'</div>'+(task?'<div class="gd-row">'+btn('Copy answer key','ag-key-copy')+btn('Print answer key','ag-key-print')+'</div>':'')+'<div class="gd-row">'+btn('Add current item','ag-add')+btn('Generate questions…','ag-batch')+'</div>'+btn('Review worksheet','ag-review');
  host.innerHTML=tabs+(workflow==='challenge'?challenge:workflow==='export'?exports:exploration)+'<p class="gd-help" id="ag-status" role="status">'+esc(status)+'</p>';
  qa('[data-ag-workflow]',host).forEach(b=>b.onclick=()=>{workflow=b.dataset.agWorkflow;if(workflow==='build'){task=null;attempt=null;scope=''}render()});
  qa('[data-ag-challenge-mode]',host).forEach(b=>b.onclick=()=>{scope='';launch(b.dataset.agChallengeMode)});
  const bind=(id,fn)=>{const el=q('#'+id,host);if(el)el.onchange=e=>{fn(e.target);render()}};
  bind('ag-year',e=>cfg.year=e.value);bind('ag-level',e=>cfg.level=e.value);bind('ag-enrich',e=>cfg.enrichment=e.checked);bind('ag-mode',e=>{demo.mode=e.value;cfg.mode=e.value;if(e.value==='construct'&&demo.freeLab==null)demo.freeLab=true});bind('ag-value',e=>demo.angle=+e.value);bind('ag-rotation',e=>demo.rotation=+e.value);bind('ag-scale',e=>demo.scale=e.checked);bind('ag-direction',e=>demo.clockwise=e.value==='cw');bind('ag-sides',e=>demo.n=+e.value);bind('ag-regular',e=>demo.regular=e.checked);bind('ag-triangulate',e=>demo.triangulate=e.checked);bind('ag-corners',e=>demo.showCorners=e.checked);bind('ag-length',e=>demo.length=+e.value);bind('ag-free-lab',e=>demo.freeLab=e.checked);bind('ag-fact',e=>demo.fact=e.value);bind('ag-relation',e=>demo.relation=e.value);
  for(const kind of ['copy','png','svg','print',...(task?['key-copy','key-print']:[])]){let el=q('#ag-'+kind,host);if(!el){el=document.createElement('button');el.hidden=true;el.type='button';host.appendChild(el)}el.setAttribute('data-gd-direct-export',kind);el.onclick=()=>exportAction(kind)}
  const ad=q('#ag-add',host);if(ad)ad.onclick=()=>publish(false);const ba=q('#ag-batch',host);if(ba)ba.onclick=()=>publish(true);const re=q('#ag-review',host);if(re)re.onclick=()=>{const P=G.publishing;if(P){draft=draft||P.createDocument();P.openEditor(draft)}};
 }
 function demoData(){if(demo.mode==='facts'){const f=demo.fact||'straight',a=Math.max(10,Math.min(170,demo.angle));return {...demo,type:f,angles:f==='straight'?[a,180-a]:f==='point'?[a,90,270-a]:[a,180-a,a,180-a]}}if(demo.mode==='lines')return {...demo,angle:demo.relation==='Parallel'?0:demo.relation==='Perpendicular'?90:Math.max(10,Math.min(80,demo.angle)),relation:demo.relation||'Neither'};if(demo.mode==='construct')return {...demo,angle:Math.max(10,Math.min(170,demo.angle)),labDrawing:demo.freeLab?freeLab||labEmpty(true):null};return demo}
 function stage(){const host=q('#gd-stage'),draw=['draw','draw-reflex'].includes(task?.type),build=labTypes.includes(task?.type),construct=draw||build,d=task?geometryTask(task):demoData(),teacher=!task||task.revealed;
  const pupil=construct?CK.pupilSpec('model',{hint:draw?'Drag the orange arm to the correct graduation, then check.':'Use the geometry tools to complete the shape, then check.',ready:()=>build?labCheck(lab||labEmpty(),task).ready:attempt!==null,check:()=>build?labCheck(lab||labEmpty(),task).correct:Math.abs(attempt-task.angle)<=1}):task?.choices?CK.pupilSpec('choice',{choices:task.choices,expected:task.answer}):CK.pupilSpec('number');
  host.innerHTML=(task?CK.bannerHtml(task,{pupil,actions:[{action:'another',label:'Another'},{action:'end',label:'Exit challenge'}]}):'')+'<div class="gd-ag-visual" style="width:100%;max-width:920px;margin:0 auto"></div>';
  const box=q('.gd-ag-visual',host);
  // Capture on the persistent wrapper: the SVG may be replaced on every
  // snapped degree, but pointer capture and the coordinate transform survive.
  let drag=null;
  function drawSvg(){
    const interactive=(!task&&demo.mode==='angle')||(draw&&!task.revealed);
    box.style.touchAction=interactive?'none':'auto';
    const svg=diagram(d,teacher,{attempt,length:attemptLength,scale:task?['measure','reflex','draw','draw-reflex'].includes(task.type):demo.scale,interactive,...(drag?{full:drag.max===360}:{})});
    svg.style.cssText='width:100%;height:auto;max-height:560px;display:block;margin:auto';
    box.replaceChildren(svg);
  }
  function updateDemo(v){
    demo.angle=v;d.angle=v;const label=q('#ag-value');
    if(label)label.value=String(v);
    const readout=q('[data-ag-demo-value]',host);if(readout)readout.textContent=v+'° · '+classify(v);
    drawSvg();
  }
  function movePointer(e){
    if(!drag||e.pointerId!==drag.id)return;
    const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(drag.inverse);
    if(Math.hypot(p.x-400,p.y-220)<16)return;
    const raw=Math.atan2(220-p.y,p.x-400)/D-(d.rotation||0),previous=draw?(attempt??0):demo.angle;
    const v=snapAngle(raw,drag.max,previous);
    if(draw){if(attempt!==v)setAngle(v)}else if(demo.angle!==v)updateDemo(v);
  }
  box.addEventListener('pointerdown',e=>{
    if(e.button!==0||!e.target.closest('[data-ag-angle-target]'))return;
    const svg=q('svg',box),matrix=svg?.getScreenCTM();if(!matrix)return;
    const max=draw?(task.type==='draw-reflex'?360:180):(demo.angle>180?360:180);
    drag={id:e.pointerId,inverse:matrix.inverse(),max};
    e.preventDefault();try{box.setPointerCapture(e.pointerId)}catch(_){}
    movePointer(e);
  });
  box.addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.id){e.preventDefault();movePointer(e)}});
  function endDrag(e){if(!drag||e.pointerId!==drag.id)return;drag=null;try{if(box.hasPointerCapture(e.pointerId))box.releasePointerCapture(e.pointerId)}catch(_){}}
  box.addEventListener('pointerup',endDrag);box.addEventListener('pointercancel',endDrag);box.addEventListener('lostpointercapture',endDrag);
  function setAngle(v){attempt=Math.max(0,Math.min(task?.type==='draw-reflex'?360:180,Math.round(v)));drawSvg();const el=q('#ag-attempt',host);if(el)el.textContent=draw?'Arm positioned':attempt+'°';CK.refreshModelPupil(task)}
  if(build&&!task.revealed){box.style.maxWidth='1200px';mountLab(box,lab,v=>{lab=v;CK.refreshModelPupil(task)})}else if(!task&&demo.mode==='construct'&&demo.freeLab){box.style.maxWidth='none';mountLab(box,freeLab,v=>{freeLab=v},{free:true})}else drawSvg();
  if(draw&&!task.revealed){const row=document.createElement('div');row.className='gd-row';row.style.cssText='justify-content:center;flex-wrap:wrap;padding:8px;gap:8px';row.innerHTML='<span>Angle</span><button class="gd-btn" data-ag-adjust="-10">−10°</button><button class="gd-btn" data-ag-adjust="-1">−1°</button><strong id="ag-attempt">'+(draw?(attempt===null?'Move the arm':'Arm positioned'):(attempt===null?'—':attempt+'°'))+'</strong><button class="gd-btn" data-ag-adjust="1">+1°</button><button class="gd-btn" data-ag-adjust="10">+10°</button>'+(build?'<label>AC (cm) '+select('ag-attempt-length',[['','Choose'],...Array.from({length:7},(_,i)=>[i+1,i+1])],attemptLength??'')+'</label>':'');host.appendChild(row);qa('[data-ag-adjust]',row).forEach(b=>b.onclick=()=>setAngle((attempt??0)+Number(b.dataset.agAdjust)));const l=q('#ag-attempt-length',row);if(l)l.onchange=()=>{attemptLength=l.value===''?null:+l.value;drawSvg();CK.refreshModelPupil(task)}}
  if(task){q('[data-challenge-action="another"]',host).onclick=()=>{const current=task.type;if(scope==='all')launch('all');else if(scope.startsWith('category:')){const group=scope.slice(9),a=types(cfg).filter(t=>t.mode===group);launch(a.length?pick(Math.random,a).id:current)}else launch(current)};q('[data-challenge-action="end"]',host).onclick=()=>{task=null;attempt=null;scope='';workflow='build';render()};const reveal=q('[data-board-action="reveal"]',host);if(reveal)reveal.onclick=()=>{task.revealed=!task.revealed;stage()}}
  else {
    const row=document.createElement('div');row.className='gd-row';row.style.cssText='justify-content:center;flex-wrap:wrap;gap:8px';
    const action=(id,label)=>'<button type="button" class="gd-btn" data-ag-action="'+id+'">'+label+'</button>';
    const angleButtons=(label)=>'<button type="button" class="gd-btn" data-ag-action="minus" data-ag-demo="-5">−5°</button>'+'<strong data-ag-demo-value>'+esc(label)+'</strong>'+'<button type="button" class="gd-btn" data-ag-action="plus" data-ag-demo="5">+5°</button>';
    const m=demo.mode;
    if(m==='angle')row.innerHTML=angleButtons(demo.angle+'° · '+classify(demo.angle));
    else if(m==='turn')row.innerHTML=action('minus-turn','−¼ turn')+'<strong>'+demo.angle+'° · '+(demo.clockwise?'Clockwise':'Anticlockwise')+'</strong>'+action('plus-turn','+¼ turn')+action('direction','Reverse direction')+action('reset-turn','Reset');
    else if(m==='polygon')row.innerHTML=action('minus-side','− side')+'<strong>'+demo.n+' sides · '+(demo.regular?'Regular':'Irregular')+'</strong>'+action('plus-side','+ side')+action('regular',demo.regular?'Make irregular':'Make regular')+action('triangulate',demo.triangulate===false?'Show triangles':'Hide triangles');
    else if(m==='facts')row.innerHTML=angleButtons(d.angle+'°')+action('fact','Change relationship');
    else if(m==='lines')row.innerHTML=action('relation','Change relationship')+'<strong>'+esc(d.relation)+'</strong>'+(d.relation==='Neither'?angleButtons(d.angle+'°'):'')+action('rotate','Rotate 15°');
    else if(m==='construct'&&!demo.freeLab)row.innerHTML=angleButtons(d.angle+'°')+action('minus-length','−1 cm')+'<strong>AC: '+demo.length+' cm</strong>'+action('plus-length','+1 cm');
    host.appendChild(row);
    const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
    const cycle=(v,arr)=>arr[(arr.indexOf(v)+1)%arr.length];
    qa('[data-ag-action]',row).forEach(b=>b.onclick=()=>{const id=b.dataset.agAction;
      if(id==='minus'||id==='plus'){const min=m==='angle'?0:10,max=m==='angle'?360:m==='lines'?80:170;demo.angle=clamp(d.angle+(id==='plus'?5:-5),min,max)}
      else if(id==='minus-turn'||id==='plus-turn')demo.angle=clamp(demo.angle+(id==='plus-turn'?90:-90),0,360);
      else if(id==='direction')demo.clockwise=!demo.clockwise;
      else if(id==='reset-turn')demo.angle=0;
      else if(id==='minus-side'||id==='plus-side')demo.n=clamp(demo.n+(id==='plus-side'?1:-1),3,12);
      else if(id==='regular')demo.regular=!demo.regular;
      else if(id==='triangulate')demo.triangulate=demo.triangulate===false;
      else if(id==='fact')demo.fact=cycle(demo.fact||'straight',['straight','point','opposite']);
      else if(id==='relation')demo.relation=cycle(d.relation,['Parallel','Perpendicular','Neither']);
      else if(id==='rotate')demo.rotation=mod(demo.rotation+15);
      else if(id==='minus-length'||id==='plus-length')demo.length=clamp(demo.length+(id==='plus-length'?1:-1),1,7);
      render();
    });
  }
 }
 function render(){controls();stage()}
 setPanels('','');render();G.lessonState.register(ID,()=>({...snapshot(),demo:demoData()}),s=>{cfg=settings(s);demo={...demo,...s.demo,type:'diagram'};workflow=['build','challenge','export'].includes(s.workflow)?s.workflow:'build';task=s.task?CK.normalise(s.task):null;attempt=Number.isFinite(s.attempt)?s.attempt:null;attemptLength=Number.isFinite(s.attemptLength)?s.attemptLength:null;scope=String(s.scope||'');lab=s.lab||null;freeLab=s.freeLab||null;CK.restorePupil(task,s.pupil);render()});
};
})(typeof globalThis!=='undefined'?globalThis:this);
