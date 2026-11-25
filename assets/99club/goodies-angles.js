/* Angles & geometry: common mathematical model, teaching diagrams, assessment and publishing. */
(function(root){
'use strict';
const ID='angles',D=Math.PI/180,mod=a=>(a%360+360)%360,round=v=>Math.round(v*1000)/1000;
const LEVELS=[['easy','Gentle'],['medium','Standard'],['hard','Stretch']];
const MODES=[['angle','Angle explorer & protractor'],['turn','Turns & direction'],['lines','Line relationships'],['facts','Angle facts'],['polygon','Triangles & polygons'],['construct','Shape construction']];
const YEARS=[['custom','All / custom'],['1','Year 1'],['2','Year 2'],['3','Year 3'],['4','Year 4'],['5','Year 5'],['6','Year 6']];
const FAMILIES=[
 ['turn','Describe a turn','turn',1],['direction','Clockwise or anticlockwise','turn',2],['right-turns','Count right-angle turns','turn',3],
 ['right','Compare with a right angle','angle',3],['classify','Name the angle type','angle',4],['compare','Compare two angles','angle',4],['order','Order three angles','angle',4],
 ['estimate','Estimate an angle','angle',5],['measure','Measure using a protractor','angle',5],['draw','Construct a given angle','angle',5],['reflex','Measure a reflex angle','angle',5],
 ['line-orientation','Horizontal or vertical','lines',3],['line-pair','Parallel or perpendicular','lines',3],
 ['straight','Missing angle on a straight line','facts',5],['point','Missing angle around a point','facts',5],['opposite','Vertically opposite angles','facts',6],
 ['rectangle','Angles in rectangles','polygon',5],['triangle-type','Classify a triangle','polygon',4],['quad-type','Classify a quadrilateral','polygon',4],['regularity','Regular or irregular polygon','polygon',5],
 ['triangle','Missing angle in a triangle','polygon',6],['quadrilateral','Missing angle in a quadrilateral','polygon',6],['regular','Interior angle of a regular polygon','polygon',6],
 ['shape-build','Construct a triangle from dimensions and an angle','construct',6],
 ['exterior','Exterior angle of a regular polygon','polygon',7],['parallel','Corresponding and alternate angles','facts',7],['polygon-sum','Interior angle sum of a polygon','polygon',7]
];
const rand=(rng,a,b)=>a+Math.floor(rng()*(b-a+1)),pick=(rng,a)=>a[rand(rng,0,a.length-1)];
function settings(s={}){return {level:LEVELS.some(x=>x[0]===s.level)?s.level:'medium',mode:MODES.some(x=>x[0]===s.mode)?s.mode:'angle',year:YEARS.some(x=>x[0]===String(s.year))?String(s.year):'custom',enrichment:!!s.enrichment}}
function types(s={}){return FAMILIES.filter(t=>t[3]!==7||s.enrichment||s.type===t[0]).map(([id,label,mode,year])=>({id,label,mode,year}))}
const polar=(x,y,r,a)=>[round(x+r*Math.cos(a*D)),round(y-r*Math.sin(a*D))];
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
 if(type==='classify'){const a=pick(rng,[angle(),90,180,angle(195,345)]);return task({angle:a},'Name the marked angle.',classify(a),'Acute < 90°; right = 90°; obtuse between 90° and 180°; straight = 180°; reflex between 180° and 360°.',['Acute','Right','Obtuse','Straight','Reflex'])}
 if(type==='compare'||type==='order'){const n=type==='compare'?2:3,as=[];while(as.length<n){const a=angle();if(!as.includes(a)&&as.every(b=>Math.abs(a-b)>=10))as.push(a)}const labels=['A','B','C'],order=as.map((a,i)=>({a,l:labels[i]})).sort((x,y)=>x.a-y.a).map(v=>v.l);const choices=type==='compare'?labels.slice(0,2):['A B C','A C B','B A C','B C A','C A B','C B A'];return task({angles:as},type==='compare'?'Which marked angle is larger?':'Order the marked angles from smallest to largest.',type==='compare'?order.at(-1):order.join(' '),'Actual openings: '+as.map((a,i)=>labels[i]+' = '+a+'°').join(', ')+'. Compare opening size rather than arm length.',choices)}
 if(type==='estimate'){const a=angle(15,165),nearest=Math.round(a/30)*30,choices=[0,30,60,90,120,150,180].filter(v=>Math.abs(v-nearest)<=60);return task({angle:a},'Which estimate is closest to the marked angle?',nearest+'°','The angle is '+a+'°. The nearest multiple of 30° is '+nearest+'°.',choices.map(v=>v+'°'))}
 if(['measure','draw','reflex'].includes(type)){const a=type==='reflex'?angle(195,345):type==='draw'?angle(15,165):angle(15,165);return task({angle:a},type==='draw'?'Construct an angle of '+a+'° from the given baseline.':type==='reflex'?'Measure the marked reflex angle in degrees.':'Read the correct protractor scale. What is the marked angle in degrees?',a,type==='reflex'?'The full turn is 360°. The smaller angle is '+(360-a)+'°, so the reflex angle is '+a+'°.':'Align the centre and zero line with the vertex and baseline. The marked opening is '+a+'°.') }
 if(type==='line-orientation'){const a=pick(rng,[0,90]);return task({angle:a,rotation:0},'Is the marked line horizontal or vertical?',a===0?'Horizontal':'Vertical','Horizontal lines run left to right; vertical lines run up and down.',['Horizontal','Vertical'])}
 if(type==='line-pair'){const relation=pick(rng,['Parallel','Perpendicular','Neither']);return task({relation,angle:relation==='Parallel'?0:relation==='Perpendicular'?90:angle(15,75)},'Describe the relationship between the two lines.',relation,'Parallel lines never meet; perpendicular lines meet at 90°.',['Parallel','Perpendicular','Neither'])}
 if(type==='straight'){const a=angle(20,160);return task({angles:[a,180-a],rotation:rotation},'Find the missing angle x.',180-a,'Angles on a straight line total 180°. 180° − '+a+'° = '+(180-a)+'°.')}
 if(type==='point'){const a=angle(40,110),b=angle(40,110),c=360-a-b;return task({angles:[a,b,c],rotation:rotation},'Find the missing angle x around the point.',c,'Angles around a point total 360°. Subtract '+a+'° and '+b+'° from 360°.')}
 if(type==='opposite'){const a=angle(30,150);return task({angles:[a,180-a,a,180-a]},'Find the angle x vertically opposite the labelled angle.',a,'Vertically opposite angles are equal.')}
 if(type==='rectangle')return task({angles:[90,90,90,90]},'Find the missing corner angle x in this rectangle.',90,'All four angles in a rectangle are right angles.');
 if(type==='triangle-type'){const name=pick(rng,['Equilateral','Isosceles (not equilateral)','Scalene']);const a=name==='Equilateral'?60:name==='Isosceles (not equilateral)'?pick(rng,[40,50,70]):pick(rng,[35,45,55]),b=name==='Scalene'?a+10:a;return task({angles:[a,b,180-a-b],shape:name},'Classify this triangle by its side lengths.',name,'Equal angles face equal sides. A triangle with three equal sides is equilateral; exactly two equal sides is isosceles (not equilateral); no equal sides is scalene.',['Equilateral','Isosceles (not equilateral)','Scalene'])}
 if(type==='quad-type'){const name=pick(rng,['Square','Rectangle (not square)','Rhombus (not square)','Parallelogram (not rectangle or rhombus)','Trapezium']);return task({shape:name},'Choose the most specific description of this quadrilateral.',name,'Use equal-side markings, right angles and parallel sides. Other inclusive family names may also be true. The question asks for the listed most specific description.',['Square','Rectangle (not square)','Rhombus (not square)','Parallelogram (not rectangle or rhombus)','Trapezium'])}
 if(type==='regularity'){const n=pick(rng,[4,5,6,8]),regular=rng()<.5;return task({n,regular},'Is the polygon regular or irregular?',regular?'Regular':'Irregular','A regular polygon has all sides equal and all interior angles equal.',['Regular','Irregular'])}
 if(type==='triangle'){const a=angle(30,70),b=angle(35,75),c=180-a-b;return task({angles:[a,b,c]},'Calculate the missing interior angle x.',c,'Angles in a triangle total 180°. Subtract the two given angles.')}
 if(type==='quadrilateral'){const a=angle(55,125),b=180-a;return task({angles:[a,b,a,b]},'Find the missing interior angle x in the parallelogram.',b,'The four interior angles total 360°. Subtract the three given angles.')}
 if(['regular','exterior','polygon-sum'].includes(type)){const n=pick(rng,[3,4,5,6,8,9,10,12]);return task({n,regular:true},type==='regular'?'Find one interior angle of this regular '+n+'-sided polygon.':type==='exterior'?'Find the exterior turning angle of this regular '+n+'-sided polygon.':'Find the sum of all interior angles of this '+n+'-sided polygon.',type==='regular'?polyInterior(n):type==='exterior'?polyExterior(n):180*(n-2),type==='regular'?'Divide the interior angle sum '+180*(n-2)+'° by '+n+'.':type==='exterior'?'One complete turn is 360°. Divide by '+n+'.':'Divide the polygon into '+(n-2)+' triangles, each with angle sum 180°.')}
 if(type==='parallel'){const a=angle(35,145),relation=pick(rng,['corresponding','alternate']);return task({angle:a,relation,rotation:0},'The lines are parallel. Find the marked '+relation+' angle x.',a,'Corresponding and alternate angles between parallel lines are equal.')}
 if(type==='shape-build'){const a=angle(30,120),l=rand(rng,3,7);return task({angle:a,length:l,baseLength:6},'Construct triangle ABC with AB = 6 cm, AC = '+l+' cm and angle BAC = '+a+'°. Set both the side length and angle.',a+'°; '+l+' cm','Accept the triangle with AB = 6 cm, AC = '+l+' cm and included angle '+a+'°. Rotation or reflection is also valid on paper.')}
 throw Error('Unknown family');
}
const model={MODES,LEVELS,YEARS,FAMILIES,settings,types,generate,polar,classify,polyInterior,polyExterior,trianglePoints};
if(typeof module==='object'&&module.exports){module.exports=model;return}
const G=root.TT99Goodies;if(!G)return;G.angles=model;
const {q,qa,esc,field,btn,setPanels}=G,CK=G.challengeKit;
function diagram(d,teacher=false,options={}){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),W=800,H=440,ink='#263e43',teal='#277b70',orange='#b56d2c';
 const add=(tag,attrs,t,parent=svg)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(t!=null)e.textContent=t;parent.appendChild(e);return e};
 Object.entries({viewBox:'0 0 '+W+' '+H,xmlns:ns,role:'img','aria-label':'Geometry diagram'}).forEach(([k,v])=>svg.setAttribute(k,v));
 const text=(x,y,v,size=27,extra={})=>add('text',{x,y,fill:ink,'font-family':'Arial,sans-serif','font-size':size,'text-anchor':'middle',...extra},v);
 const line=(a,b,stroke=ink,width=4,extra={})=>add('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke,'stroke-width':width,'stroke-linecap':'round',...extra});
 const path=(p,extra={})=>add('path',{d:p,fill:'none',stroke:teal,'stroke-width':3,...extra});
 const circle=(p,r,fill=teal)=>add('circle',{cx:p[0],cy:p[1],r,fill});
 const arc=(x,y,r,start,a,extra={})=>{if(a>=360){add('circle',{cx:x,cy:y,r,fill:'none',stroke:teal,'stroke-width':3,...extra});return}if(a<=0)return;const p=polar(x,y,r,start),e=polar(x,y,r,start+a);path('M '+p.join(' ')+' A '+r+' '+r+' 0 '+(a>180?1:0)+' 0 '+e.join(' '),extra)};
 const labelArc=(x,y,r,start,a,label)=>{if(a===90){const p=polar(x,y,r*.75,start),v=polar(x,y,r*.75,start+90),u=[p[0]+v[0]-x,p[1]+v[1]-y];path('M '+p.join(' ')+' L '+u.join(' ')+' L '+v.join(' '))}else arc(x,y,r,start,a);if(label!=null){const p=polar(x,y,r+30,start+a/2);text(p[0],p[1]+8,label,27)}};
 const ray=(x,y,r,a,color=ink)=>line([x,y],polar(x,y,r,a),color);
 const arrow=(x,y,r,a,color=ink)=>{const p=polar(x,y,r,a),l=polar(p[0],p[1],16,a+150),rr=polar(p[0],p[1],16,a-150);line([x,y],p,color,5);line(p,l,color,5);line(p,rr,color,5)};
 add('rect',{width:W,height:H,fill:'#fff'});
 const type=d.type,explore=type==='diagram',a=d.angle??60,rot=d.rotation??0,mode=d.mode||'angle';
 function protractor(x,y,r,start,full=false){
   // Baseline always has zero at its ray. Inner scale runs in the opposite direction.
   const range=full?360:180,pts=Array.from({length:range/5+1},(_,i)=>polar(x,y,r,start+i*5));
   const shape='M '+x+' '+y+' L '+pts.map(p=>p.join(' ')).join(' L ')+' Z';
   path(shape,{fill:'#dceee9','fill-opacity':.48,stroke:'#82a69e','stroke-width':1.5});
   for(let i=0;i<=range;i++){if(full&&i===360)break;const p=polar(x,y,r,start+i),p2=polar(x,y,r-(i%10===0?14:i%5===0?9:4),start+i);line(p,p2,'#668d86',i%10===0?1.5:.7);if(i%10===0){const t=polar(x,y,r-27,start+i);text(t[0],t[1]+4,String(i),full?14:16,{fill:'#285f57'});if(!full){const u=polar(x,y,r-48,start+i);text(u[0],u[1]+4,String(180-i),14,{fill:'#99672c'})}}}
   line(polar(x,y,r,start),polar(x,y,r,start+180),'#668d86',1.5);circle([x,y],4,'#668d86');
 }
 function single(x,y,r,a,start,label,scale=false,blank=false,full=false){if(scale)protractor(x,y,r,start,full);ray(x,y,r+5,start);if(!blank){ray(x,y,r+5,start+a,teal);labelArc(x,y,Math.min(r*.27,48),start,a,label)}circle([x,y],4,ink)}
 if(mode==='turn'){
   const x=400,y=225,r=136,sign=d.clockwise?-1:1,start=90,end=start+sign*a;add('circle',{cx:x,cy:y,r:r+28,fill:'#f8fbfa',stroke:'#d4e2de','stroke-width':2});for(let i=0;i<4;i++)line(polar(x,y,r+18,90+i*90),polar(x,y,r+28,90+i*90),'#a3b8b3',3);
   arrow(x,y,r,start,'#99a9ab');arrow(x,y,r,end,teal);const rr=92;if(a===360)add('circle',{cx:x,cy:y,r:rr,fill:'none',stroke:orange,'stroke-width':4});else if(d.clockwise)arc(x,y,rr,end,a,{stroke:orange,'stroke-width':4});else arc(x,y,rr,start,a,{stroke:orange,'stroke-width':4});const tip=polar(x,y,rr,end),tangent=end+(d.clockwise?-90:90);line(tip,polar(tip[0],tip[1],14,tangent+155),orange,4);line(tip,polar(tip[0],tip[1],14,tangent-155),orange,4);text(400,420,teacher||explore?(d.clockwise?'Clockwise':'Anticlockwise')+' · '+a+'°':'Start: grey arrow   •   Finish: green arrow',27);return svg
 }
 if(mode==='lines'){
   if(type==='line-orientation'){const x=400,y=220;line(polar(x,y,155,a),polar(x,y,155,a+180),teal,6);return svg}
   const r=d.relation||(a===0?'Parallel':a===90?'Perpendicular':'Neither'),x=400,y=220;const start=rot;
   if(r==='Parallel'){for(const off of [-65,65]){const c=polar(x,y,off,start+90);line(polar(...c,180,start),polar(...c,180,start+180),teal,5)}}
   else{line(polar(x,y,180,start),polar(x,y,180,start+180));line(polar(x,y,155,start+a),polar(x,y,155,start+a+180),teal);if(r==='Perpendicular'&&(teacher||explore))labelArc(x,y,35,start,90,'90°')}
   return svg
 }
 if(type==='compare'||type==='order'){const n=d.angles.length;d.angles.forEach((v,i)=>{const x=(i+.5)*W/n,y=210,r=n===3?83:130;single(x,y,r,v,(rot+i*55)%360,teacher?v+'°':null);text(x,395,['A','B','C'][i],34)});return svg}
 if(mode==='angle'){
   const draw=type==='draw',blank=draw&&!teacher&&options.attempt==null,shown=draw&&!teacher&&options.attempt!=null?options.attempt:a;
   const full=shown>180||type==='reflex',scale=options.scale??d.scale??['measure','reflex'].includes(type);
   const r=full?158:154,start=rot,x=400,y=220;single(x,y,r,shown,start,teacher||explore?shown+'°':null,scale,blank,full);
   if(draw&&!teacher)text(400,408,'Target: '+a+'°',30);
   if(options.interactive){const p=polar(x,y,r+5,start+shown);circle(p,13,'#d58c42');const hit=add('circle',{cx:x,cy:y,r:185,fill:'transparent','data-ag-angle-target':'1',style:'cursor:crosshair;touch-action:none'});}
   return svg
 }
 if(mode==='facts'){
   if(type==='parallel'){const x1=300,x2=535,y1=130,y2=310,dx=(y2-y1)/Math.tan(a*D);const p=[x1,y1],u=[x1+dx,y2];line([95,y1],[705,y1]);line([95,y2],[705,y2]);line([p[0]-dx*.45,y1-81],[u[0]+dx*.45,y2+81],teal);const v=mod(360-a);const firstStart=0;labelArc(...p,44,firstStart,180-a,(180-a)+'°');const alt=d.relation==='alternate';labelArc(...u,44,alt?180:0,alt?180-a:180-a,teacher?(180-a)+'°':'x');return svg}
   const values=d.angles||[a,180-a],x=400,y=220,r=165;let at=rot;const count=type==='opposite'?4:values.length;
   for(let i=0;i<count;i++){ray(x,y,r,at);const v=values[i],missing=type==='opposite'?i===2:i===count-1;labelArc(x,y,70,at,v,missing&&!teacher&&!explore?'x':type==='opposite'&&i%2===1&&!teacher?null:v+'°');at+=v}
   if(type==='straight'||explore&&values.reduce((s,v)=>s+v,0)===180)ray(x,y,r,at);circle([x,y],4,ink);return svg
 }
 function polygon(points){add('polygon',{points:points.map(p=>p.join(',')).join(' '),fill:'#e9f4f0',stroke:ink,'stroke-width':4,'stroke-linejoin':'round'});}
 function corner(points,i,label){const p=points[i],prev=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length],dir=v=>mod(Math.atan2(p[1]-v[1],v[0]-p[0])/D);let start=dir(prev),v=mod(dir(next)-start);if(v>180){start=dir(next);v=360-v}labelArc(...p,Math.min(38,Math.hypot(next[0]-p[0],next[1]-p[1])*.22,Math.hypot(prev[0]-p[0],prev[1]-p[1])*.22),start,v,label)}
 function fit(points){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),s=Math.min(540/Math.max(1,maxX-minX),270/Math.max(1,maxY-minY));return points.map(([x,y])=>[400+(x-(minX+maxX)/2)*s,210+(y-(minY+maxY)/2)*s])}
 if(mode==='construct'){
   const show=teacher||explore||options.attempt!=null,aa=teacher||explore?a:options.attempt??0,l=teacher||explore?d.length:options.length??0;
   const x=245,y=302,unit=40,B=[x+6*unit,y],C=polar(x,y,l*unit,aa);
   for(let gx=80;gx<=720;gx+=unit)line([gx,70],[gx,350],'#e0e9e6',1);for(let gy=102;gy<=342;gy+=unit)line([80,gy],[720,gy],'#e0e9e6',1);
   line([x,y],B,ink,4);text(x-18,y+20,'A',26);text(B[0]+16,B[1]+20,'B',26);text((x+B[0])/2,y+33,'6 cm',27);
   if(show&&l>0&&aa>0){line([x,y],C,teal,4);line(C,B,ink,4);text(C[0],C[1]-14,'C',26);labelArc(x,y,43,0,aa,aa+'°');const mid=[(x+C[0])/2,(y+C[1])/2];text(mid[0]-22,mid[1]-12,l+' cm',24)}
   text(400,402,'Scale: each grid square represents 1 cm',25);return svg
 }
 if(mode==='polygon'){
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
     return svg
   }
   if(type==='triangle'||type==='triangle-type'){const v=d.angles,points=fit(trianglePoints(v[0],v[1]));polygon(points);points.forEach((p,i)=>corner(points,i,type==='triangle'&&i===2&&!teacher?'x':v[i]+'°'));return svg}
   const n=d.n||5,regular=d.regular!==false,pts=Array.from({length:n},(_,i)=>polar(400,218,!regular&&i===1?114:155,90+i*360/n));polygon(pts);
   if(type==='polygon-sum'||explore){for(let i=2;i<n-1;i++)line(pts[0],pts[i],'#89aaa1',2,{'stroke-dasharray':'5 5'});if(teacher||explore)text(400,410,(n-2)+' triangles · sum '+180*(n-2)+'°',27)}
   if(type==='regular')corner(pts,0,teacher?polyInterior(n)+'°':'x');
   if(type==='exterior'){const p=pts[0],prev=pts.at(-1),next=pts[1],start=mod(Math.atan2(prev[1]-p[1],p[0]-prev[0])/D),end=mod(Math.atan2(p[1]-next[1],next[0]-p[0])/D);ray(...p,68,start);labelArc(...p,34,start,mod(end-start)>180?360-mod(end-start):mod(end-start),teacher?polyExterior(n)+'°':'x')}
   if(type==='regularity'&&teacher)text(400,410,regular?'Regular: equal sides and angles':'Irregular: sides or angles differ',27);
   return svg
 }
 return svg
}
function paper(item,teacher){const d=item.data;if(item.kind==='diagram')return diagram(d,true,{scale:d.scale});let prompt=d.prompt;if(d.choices)prompt+=' Choices: '+d.choices.join(' / ')+'.';return G.exportTools.composeWorksheetCardSvg(diagram(d,teacher,{scale:teacher&&['draw','measure','reflex'].includes(d.type)}),{title:'Angles & geometry',prompt,responseMode:['draw','shape-build'].includes(d.type)?'none':d.choices?'lines':'box',responseLines:1,responseLabel:'Answer',paperStyle:'plain',answer:d.answer,showAnswer:teacher})}
if(G.publishing)G.publishing.register(ID,{label:'Angles & geometry',types:s=>types(s),title:item=>FAMILIES.find(t=>t[0]===item.data.type)?.[1]||'Angle illustration',recipe:(s,type)=>({...settings(s),type}),generate,signature:d=>JSON.stringify([d.type,d.angle,d.angles,d.rotation,d.clockwise,d.n,d.regular,d.shape,d.relation,d.length]),capture:s=>[G.publishing.record(ID,s.task?'challenge':'diagram',s.task?{...s.task,revealed:false}:s.demo)],render:paper,answerSummary:item=>item.data.answer,answerGraphic:item=>diagram(item.data,true,{scale:['measure','draw','reflex'].includes(item.data.type)}),answerNote:item=>item.data.note||''});
G.anglesTool=function(){
 let cfg=settings(),demo={type:'diagram',mode:'angle',angle:60,rotation:0,scale:true,clockwise:false,n:5,regular:true,length:5,baseLength:6},task=null,workflow='build',attempt=null,attemptLength=null,scope='',status='',draft=null;
 const snapshot=()=>({...cfg,demo,task,workflow,attempt,attemptLength,scope,pupil:CK.capturePupil(task)});
 const select=(id,opts,current)=>'<select class="gd-select" id="'+id+'">'+opts.map(([v,l])=>'<option value="'+esc(v)+'"'+(String(v)===String(current)?' selected':'')+'>'+esc(l)+'</option>').join('')+'</select>';
 const report=s=>{status=s;const el=q('#ag-status');if(el)el.textContent=s};
 function launch(type){try{const actual=type==='all'?pick(Math.random,types(cfg)).id:type;task=CK.normalise({...generate({...cfg,type:actual}),mode:'standard',answerMode:'manual',revealed:false});task.geometryMode=FAMILIES.find(t=>t[0]===actual)[2];attempt=null;attemptLength=null;scope=CK.nativeScope('ag')||scope;workflow='challenge';render()}catch(e){report(e.message)}}
 // CK reserves mode for standard/custom; restore the geometry display mode for drawing/export.
 function geometryTask(t){return t?{...t,mode:t.geometryMode||FAMILIES.find(f=>f[0]===t.type)?.[2]||t.mode}:null}
 function exportRecord(){return {tool:ID,kind:task?'challenge':'diagram',data:task?{...geometryTask(task),revealed:false}:demo}}
 async function exportAction(kind){try{const teacher=kind.startsWith('key-');if(teacher&&!task)return;const X=G.exportTools,out=paper(exportRecord(),teacher);if(kind==='copy'||kind==='key-copy')await X.copyPng(out);else if(kind==='png')await X.downloadPng(out,'angles-and-geometry',2);else if(kind==='svg')X.downloadSvg(out,'angles-and-geometry');else X.printSvg(out,{title:teacher?'Angles — teacher key':'Angles & geometry',landscape:true});report('Export ready.')}catch(e){report(e.message)}}
 function publish(batch){const P=G.publishing;try{if(!P)throw Error('Publishing unavailable');draft=draft||P.createDocument();if(batch)P.openQuickGenerate(draft,ID,snapshot());else{draft.addCurrent(ID,snapshot());P.openEditor(draft)}}catch(e){report(e.message)}}
 function controls(){const host=q('#gd-controls'),tabs='<div class="gd-row" role="tablist" aria-label="Angles workflow">'+[['build','Explore'],['challenge','Challenge'],['export','Export']].map(([v,l])=>'<button type="button" class="gd-btn'+(workflow===v?' gd-btn--primary':'')+'" data-ag-workflow="'+v+'">'+l+'</button>').join('')+'</div>';
  const common=field('Curriculum suggestions',select('ag-year',YEARS,cfg.year))+field('Difficulty',select('ag-level',LEVELS,cfg.level))+'<label class="gd-field"><span><input type="checkbox" id="ag-enrich"'+(cfg.enrichment?' checked':'')+'> Include KS3 enrichment</span></label>';
  const avail=types(cfg),groups=MODES.map(([id,label])=>({id,label,ids:avail.filter(t=>t.mode===id).map(t=>t.id)})).filter(g=>g.ids.length);
  const challenge=common+'<p class="gd-help">Year suggestions are advisory. Choose a topic or generate across all types.</p>'+CK.nativeRandomHtml('ag',groups)+avail.map(t=>'<button type="button" class="gd-btn" data-ag-challenge-mode="'+t.id+'">'+esc(t.label)+'</button>').join('');
  const exploration=field('Explore',select('ag-mode',MODES,demo.mode))+field('Angle opening',select('ag-value',Array.from({length:73},(_,i)=>[i*5,i*5+'°']),demo.angle))+field('Baseline orientation',select('ag-rotation',Array.from({length:24},(_,i)=>[i*15,i*15+'°']),demo.rotation))+(demo.mode==='angle'?'<label class="gd-field"><span><input type="checkbox" id="ag-scale"'+(demo.scale?' checked':'')+'> Show protractor</span></label>':demo.mode==='turn'?field('Turn direction',select('ag-direction',[['cw','Clockwise'],['ccw','Anticlockwise']],demo.clockwise?'cw':'ccw')):demo.mode==='polygon'?field('Sides',select('ag-sides',Array.from({length:10},(_,i)=>[i+3,i+3]),demo.n))+'<label class="gd-field"><span><input type="checkbox" id="ag-regular"'+(demo.regular?' checked':'')+'> Regular polygon</span></label>':demo.mode==='construct'?field('AC length (cm)',select('ag-length',Array.from({length:7},(_,i)=>[i+1,i+1]),demo.length)):demo.mode==='facts'?field('Angle relationship',select('ag-fact',[['straight','Straight line'],['point','Around a point'],['opposite','Vertically opposite']],demo.fact||'straight')):demo.mode==='lines'?field('Line relationship',select('ag-relation',[['Parallel','Parallel'],['Perpendicular','Perpendicular'],['Neither','Neither']],demo.relation||'Neither')):'')+'<p class="gd-help">Manipulate the diagram or set the angle exactly. The size of the opening is independent of arm length.</p>';
  const exports='<p class="gd-help">'+(task?'Pupil copies always hide the answer. Use a separate teacher key.':'Export the current teaching diagram.')+'</p><div class="gd-row">'+btn('Copy image','ag-copy')+btn('PNG','ag-png')+btn('SVG','ag-svg')+btn('Print / PDF','ag-print')+'</div>'+(task?'<div class="gd-row">'+btn('Copy answer key','ag-key-copy')+btn('Print answer key','ag-key-print')+'</div>':'')+'<div class="gd-row">'+btn('Add current item','ag-add')+btn('Generate questions…','ag-batch')+'</div>'+btn('Review worksheet','ag-review');
  host.innerHTML=tabs+(workflow==='challenge'?challenge:workflow==='export'?exports:exploration)+'<p class="gd-help" id="ag-status" role="status">'+esc(status)+'</p>';
  qa('[data-ag-workflow]',host).forEach(b=>b.onclick=()=>{workflow=b.dataset.agWorkflow;if(workflow==='build'){task=null;attempt=null;scope=''}render()});
  qa('[data-ag-challenge-mode]',host).forEach(b=>b.onclick=()=>{scope='';launch(b.dataset.agChallengeMode)});
  const bind=(id,fn)=>{const el=q('#'+id,host);if(el)el.onchange=e=>{fn(e.target);render()}};
  bind('ag-year',e=>cfg.year=e.value);bind('ag-level',e=>cfg.level=e.value);bind('ag-enrich',e=>cfg.enrichment=e.checked);bind('ag-mode',e=>{demo.mode=e.value;cfg.mode=e.value});bind('ag-value',e=>demo.angle=+e.value);bind('ag-rotation',e=>demo.rotation=+e.value);bind('ag-scale',e=>demo.scale=e.checked);bind('ag-direction',e=>demo.clockwise=e.value==='cw');bind('ag-sides',e=>demo.n=+e.value);bind('ag-regular',e=>demo.regular=e.checked);bind('ag-length',e=>demo.length=+e.value);bind('ag-fact',e=>demo.fact=e.value);bind('ag-relation',e=>demo.relation=e.value);
  for(const kind of ['copy','png','svg','print',...(task?['key-copy','key-print']:[])]){let el=q('#ag-'+kind,host);if(!el){el=document.createElement('button');el.hidden=true;el.type='button';host.appendChild(el)}el.setAttribute('data-gd-direct-export',kind);el.onclick=()=>exportAction(kind)}
  const ad=q('#ag-add',host);if(ad)ad.onclick=()=>publish(false);const ba=q('#ag-batch',host);if(ba)ba.onclick=()=>publish(true);const re=q('#ag-review',host);if(re)re.onclick=()=>{const P=G.publishing;if(P){draft=draft||P.createDocument();P.openEditor(draft)}};
 }
 function demoData(){if(demo.mode==='facts'){const f=demo.fact||'straight',a=Math.max(10,Math.min(170,demo.angle));return {...demo,type:f,angles:f==='straight'?[a,180-a]:f==='point'?[a,90,270-a]:[a,180-a,a,180-a]}}if(demo.mode==='lines')return {...demo,angle:demo.relation==='Parallel'?0:demo.relation==='Perpendicular'?90:Math.max(10,Math.min(80,demo.angle))};return demo}
 function stage(){const host=q('#gd-stage'),draw=task?.type==='draw',build=task?.type==='shape-build',construct=draw||build,d=task?geometryTask(task):demoData(),teacher=!task||task.revealed;
  const pupil=construct?CK.pupilSpec('model',{hint:draw?'Set the angle, then check.':'Set the angle and side length, then check.',ready:()=>attempt!==null&&(!build||attemptLength!==null),check:()=>Math.abs(attempt-task.angle)<=1&&(!build||attemptLength===task.length)}):task?.choices?CK.pupilSpec('choice',{choices:task.choices,expected:task.answer}):CK.pupilSpec('number');
  host.innerHTML=(task?CK.bannerHtml(task,{pupil,actions:[{action:'another',label:'Another'},{action:'end',label:'Exit challenge'}]}):'')+'<div class="gd-ag-visual" style="max-width:850px;margin:auto"></div>';
  const box=q('.gd-ag-visual',host);
  function drawSvg(){const interactive=!task&&demo.mode==='angle'||draw&&!task.revealed,svg=diagram(d,teacher,{attempt,length:attemptLength,scale:task?['measure','reflex','draw'].includes(task.type):demo.scale,interactive});svg.style.cssText='width:100%;height:auto;display:block';box.replaceChildren(svg);
    const target=q('[data-ag-angle-target]',svg);if(target){const move=e=>{const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse()),raw=mod(Math.atan2(220-p.y,p.x-400)/D-(d.rotation||0)),v=Math.round(raw);if(draw)setAngle(Math.min(180,v));else{demo.angle=v;d.angle=v;const label=q('#ag-value');if(label&&[...label.options].some(o=>+o.value===v))label.value=String(v);drawSvg();}};target.addEventListener('pointerdown',e=>{e.preventDefault();move(e)})}
  }
  function setAngle(v){attempt=Math.max(0,Math.min(180,v));drawSvg();const el=q('#ag-attempt',host);if(el)el.textContent=attempt+'°';CK.refreshModelPupil(task)}
  drawSvg();
  if(construct&&!task.revealed){const row=document.createElement('div');row.className='gd-row';row.style.cssText='justify-content:center;flex-wrap:wrap;padding:8px;gap:8px';row.innerHTML='<span>Angle</span><button class="gd-btn" data-ag-adjust="-10">−10°</button><button class="gd-btn" data-ag-adjust="-1">−1°</button><strong id="ag-attempt">'+(attempt===null?'—':attempt+'°')+'</strong><button class="gd-btn" data-ag-adjust="1">+1°</button><button class="gd-btn" data-ag-adjust="10">+10°</button>'+(build?'<label>AC (cm) '+select('ag-attempt-length',[['','Choose'],...Array.from({length:7},(_,i)=>[i+1,i+1])],attemptLength??'')+'</label>':'');host.appendChild(row);qa('[data-ag-adjust]',row).forEach(b=>b.onclick=()=>setAngle((attempt??0)+Number(b.dataset.agAdjust)));const l=q('#ag-attempt-length',row);if(l)l.onchange=()=>{attemptLength=l.value===''?null:+l.value;drawSvg();CK.refreshModelPupil(task)}}
  if(task){q('[data-challenge-action="another"]',host).onclick=()=>{const current=task.type;if(scope==='all')launch('all');else if(scope.startsWith('category:')){const group=scope.slice(9),a=types(cfg).filter(t=>t.mode===group);launch(a.length?pick(Math.random,a).id:current)}else launch(current)};q('[data-challenge-action="end"]',host).onclick=()=>{task=null;attempt=null;scope='';workflow='build';render()};const reveal=q('[data-board-action="reveal"]',host);if(reveal)reveal.onclick=()=>{task.revealed=!task.revealed;stage()}}
  else {const row=document.createElement('div');row.className='gd-row';row.style.justifyContent='center';row.innerHTML='<button class="gd-btn" data-ag-demo="-5">−5°</button><strong>'+demo.angle+'° · '+classify(demo.angle)+'</strong><button class="gd-btn" data-ag-demo="5">+5°</button>';host.appendChild(row);qa('[data-ag-demo]',row).forEach(b=>b.onclick=()=>{demo.angle=Math.max(0,Math.min(360,demo.angle+Number(b.dataset.agDemo)));render()})}
 }
 function render(){controls();stage()}
 setPanels('','');render();G.lessonState.register(ID,()=>({...snapshot(),demo:demoData()}),s=>{cfg=settings(s);demo={...demo,...s.demo,type:'diagram'};workflow=['build','challenge','export'].includes(s.workflow)?s.workflow:'build';task=s.task?CK.normalise(s.task):null;attempt=Number.isFinite(s.attempt)?s.attempt:null;attemptLength=Number.isFinite(s.attemptLength)?s.attemptLength:null;scope=String(s.scope||'');CK.restorePupil(task,s.pupil);render()});
};
})(typeof globalThis!=='undefined'?globalThis:this);
