/* Angles & geometry: common mathematical model, teaching diagrams, assessment and publishing. */
(function(root){
'use strict';
const ID='angles',D=Math.PI/180,mod=a=>(a%360+360)%360,round=v=>Math.round(v*1000)/1000;
const LEVELS=[['easy','Gentle'],['medium','Standard'],['hard','Stretch']];
const MODES=[['angle','Angle explorer & protractor'],['turn','Turns & direction'],['lines','Line relationships'],['facts','Angle facts'],['polygon','Triangles & polygons'],['circle','Circles'],['construct','Shape construction'],['free-explore','Free exploration — move points'],['loci','Dynamic geometry — loci & traces']];
const YEARS=[['custom','All / custom'],['1','Year 1'],['2','Year 2'],['3','Year 3'],['4','Year 4'],['5','Year 5'],['6','Year 6']];
const FAMILIES=[
 ['turn','Describe a turn','turn',1],['direction','Clockwise or anticlockwise','turn',2],['right-turns','Count right-angle turns','turn',3],
 ['right-count','Count right angles in a shape','polygon',3],['right','Compare with a right angle','angle',3],['classify','Name the angle type','angle',4],['compare','Compare two angles','angle',4],['order','Order three angles','angle',4],
 ['estimate','Estimate an angle','angle',5],['measure','Measure an angle independently','angle',5],['draw','Construct a given angle','angle',5],['reflex','Measure a reflex angle','angle',5],['draw-reflex','Construct a reflex angle','angle',5],['estimate-reflex','Estimate a reflex angle','angle',5],['compare-reflex','Compare reflex and other angles','angle',5],
 ['line-orientation','Horizontal or vertical','lines',3],['line-pair','Parallel or perpendicular','lines',3],
 ['straight','Missing angle on a straight line','facts',5],['point','Missing angle around a point','facts',5],['opposite','Vertically opposite angles','facts',6],
 ['rectangle','Angles in rectangles','polygon',5],['rectangle-length','Missing length in a rectangle','polygon',5],['isosceles-angle','Missing base angle in an isosceles triangle','polygon',6],['diagonal-equal','Equal diagonals in quadrilaterals','polygon',5],['diagonal-bisect','Diagonals that bisect each other','polygon',6],['diagonal-perpendicular','Perpendicular diagonals','polygon',6],['side-count','Count sides of a polygon','polygon',2],['parallel-count','Count pairs of parallel sides','polygon',3],['shape-family','Recognise inclusive shape families','polygon',5],['circle-part','Name a circle part','circle',6],['circle-diameter','Find diameter from radius','circle',6],['circle-radius','Find radius from diameter','circle',6],['triangle-type','Classify a triangle','polygon',4],['quad-type','Classify a quadrilateral','polygon',4],['regularity','Regular or irregular polygon','polygon',5],
 ['triangle','Missing angle in a triangle','polygon',6],['quadrilateral','Missing angle in a quadrilateral','polygon',6],['regular','Interior angle of a regular polygon','polygon',6],
 ['shape-build','Construct a triangle from dimensions and an angle','construct',6],['build-sss','Construct a triangle from three sides','construct',6],['build-equilateral','Construct an equilateral triangle','construct',5],['build-right','Construct a right-angled triangle','construct',5],['build-rectangle','Construct a rectangle','construct',5],['build-square','Construct a square','construct',4],
 ['exterior','Exterior angle of a regular polygon','polygon',7],['circle-circumference','Find circumference using π','circle',7],['circle-area','Find circle area using π','circle',7],['parallel','Corresponding and alternate angles','facts',7],['co-interior','Co-interior angles','facts',7],['similar-side','Missing length in similar triangles','polygon',7],['pythagoras','Find a hypotenuse','polygon',7],['polygon-sum','Interior angle sum of a polygon','polygon',7]
];
const rand=(rng,a,b)=>a+Math.floor(rng()*(b-a+1)),pick=(rng,a)=>a[rand(rng,0,a.length-1)];
function settings(s={}){return {level:LEVELS.some(x=>x[0]===s.level)?s.level:'medium',mode:MODES.some(x=>x[0]===s.mode)?s.mode:'angle',year:YEARS.some(x=>x[0]===String(s.year))?String(s.year):'custom',enrichment:s.enrichment===true||s.enrichment===1||s.enrichment==='1'||s.enrichment==='true'}}
function types(s={}){return FAMILIES.filter(t=>t[3]!==7||settings(s).enrichment||s.type===t[0]).map(([id,label,mode,year])=>({id,label,mode,year}))}
function challengeGroups(s={}){
 const catalogue=types(s),defs=[
  ['turn','Turns',t=>t.mode==='turn'],
  ['angle','Angles',t=>t.mode==='angle'],
  ['lines','Lines',t=>t.mode==='lines'],
  ['facts','Angle relationships',t=>t.mode==='facts'],
  ['properties','Shape properties',t=>t.mode==='polygon'&&['right-count','diagonal-equal','diagonal-bisect','diagonal-perpendicular','side-count','parallel-count','shape-family','triangle-type','quad-type','regularity'].includes(t.id)],
  ['polygon','Shape calculations',t=>t.mode==='polygon'&&!['right-count','diagonal-equal','diagonal-bisect','diagonal-perpendicular','side-count','parallel-count','shape-family','triangle-type','quad-type','regularity'].includes(t.id)],
  ['circle','Circles',t=>t.mode==='circle'],
  ['construct','Construction',t=>t.mode==='construct'],
  ['ks3','KS3 enrichment',t=>t.year===7]
 ];
 return defs.map(([id,label,test])=>({id,label,ids:catalogue.filter(t=>(id==='ks3'||t.year!==7)&&test(t)).map(t=>t.id)})).filter(g=>g.ids.length);
}

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
 if(['measure','draw','reflex','draw-reflex'].includes(type)){const a=['reflex','draw-reflex'].includes(type)?angle(195,345):angle(15,165);return task({angle:a},['draw','draw-reflex'].includes(type)?'Construct an angle of '+a+'° from the given baseline.':type==='reflex'?'Use a protractor to measure the marked reflex angle in degrees.':'Use a protractor to measure the marked angle in degrees.',a,type==='reflex'?'The full turn is 360°. The smaller angle is '+(360-a)+'°, so the reflex angle is '+a+'°.':'Align the centre and zero line with the vertex and baseline. The marked opening is '+a+'°.') }
 if(type==='line-orientation'){const a=pick(rng,[0,90]);return task({angle:a,rotation:0},'Is the marked line horizontal or vertical?',a===0?'Horizontal':'Vertical','Horizontal lines run left to right; vertical lines run up and down.',['Horizontal','Vertical'])}
 if(type==='line-pair'){const relation=pick(rng,['Parallel','Perpendicular','Neither']);return task({relation,angle:relation==='Parallel'?0:relation==='Perpendicular'?90:angle(15,75)},'Describe the relationship between the two lines.',relation,'Parallel lines never meet; perpendicular lines meet at 90°.',['Parallel','Perpendicular','Neither'])}
 if(type==='straight'){const a=angle(20,160);return task({angles:[a,180-a],rotation:rotation},'Find the missing angle x.',180-a,'Angles on a straight line total 180°. 180° − '+a+'° = '+(180-a)+'°.')}
 if(type==='point'){const a=angle(40,110),b=angle(40,110),c=360-a-b;return task({angles:[a,b,c],rotation:rotation},'Find the missing angle x around the point.',c,'Angles around a point total 360°. Subtract '+a+'° and '+b+'° from 360°.')}
 if(type==='opposite'){const a=angle(30,150);return task({angles:[a,180-a,a,180-a]},'Find the angle x vertically opposite the labelled angle.',a,'Vertically opposite angles are equal.')}
 if(type==='right-count'){const shape=pick(rng,['Rectangle','Right-angled triangle','Triangle with no right angle','Parallelogram with no right angles']);return task({shape},'How many right angles does the shape have?',shape==='Rectangle'?4:shape==='Right-angled triangle'?1:0,'Look for square corners, including when the shape has been rotated.');}
 if(type==='rectangle-length'){const w=rand(rng,6,15),h=rand(rng,2,5),side=pick(rng,[2,3]);return task({width:w,height:h,missingSide:side},'Find the missing side length x in centimetres.',side===2?w:h,'Opposite sides of a rectangle have equal lengths.')}
 if(type==='isosceles-angle'){const a=pick(rng,[30,40,50,70,80,100,110,120]),b=(180-a)/2;return task({angles:[b,b,a]},'The two marked sides are equal. Find the missing base angle x.',b,'The base angles of an isosceles triangle are equal. Subtract '+a+'° from 180° and divide by 2.')}
 if(type==='diagonal-bisect'||type==='diagonal-perpendicular'){
   const shape=pick(rng,['Square','Rectangle (not square)','Rhombus (not square)','Parallelogram (not rectangle or rhombus)','Trapezium']);
   const bisect=type==='diagonal-bisect',yes=bisect?shape!=='Trapezium':shape==='Square'||shape.startsWith('Rhombus');
   return task({shape},'For a '+shape.toLowerCase()+', '+(bisect?'do the diagonals always bisect each other?':'are the diagonals always perpendicular?'),yes?'Yes':'No',bisect?'The diagonals of a parallelogram, including rectangles, rhombuses and squares, bisect each other.':'Squares and rhombuses have perpendicular diagonals. The other listed shape families do not guarantee this.',['Yes','No']);
 }
 if(type==='side-count'){const n=rand(rng,3,10);return task({n,regular:rng()<.5},'How many sides does this polygon have?',n,'Count each straight side once.')}
 if(type==='parallel-count'){const shape=pick(rng,['Square','Rectangle','Rhombus (not square)','Parallelogram (not rectangle)','Trapezium']);return task({shape},'How many pairs of parallel sides does this shape have?',shape==='Trapezium'?1:2,'Parallel sides remain the same distance apart.')}
 if(type==='shape-family'){const [shape,claim,yes]=pick(rng,[['Square','rectangle',true],['Square','rhombus',true],['Rectangle','square',false],['Rhombus (not square)','square',false],['Rectangle','parallelogram',true],['Rhombus (not square)','parallelogram',true],['Parallelogram (not rectangle)','rectangle',false]]);return task({shape,claim},'Is every '+(shape==='Rhombus (not square)'?'rhombus':shape.startsWith('Parallelogram')?'parallelogram':shape.toLowerCase())+' a '+claim+'?',yes?'Yes':'No','A family includes all shapes that meet its defining properties. A square is both a rectangle and a rhombus.',['Yes','No'])}
 if(type==='co-interior'){const a=angle(35,145);return task({angle:a,relation:'co-interior',rotation:0},'The lines are parallel. Find the marked co-interior angle x.',180-a,'Co-interior angles on the same side of a transversal sum to 180°.')}
 if(type==='similar-side'){const base=rand(rng,3,7),height=rand(rng,2,5),factor=pick(rng,[2,3,4]);return task({baseLength:base,length:height,factor},'The two triangles are similar. Find the missing side x in centimetres.',height*factor,'The scale factor is '+factor+'. Corresponding lengths are multiplied by the same factor.')}
 if(type==='pythagoras'){const [u,v,h]=pick(rng,[[3,4,5],[5,12,13],[6,8,10],[8,15,17],[9,12,15]]);return task({baseLength:u,length:v,hypotenuse:h},'Find the hypotenuse x in centimetres.',h,'Pythagoras: x² = '+u+'² + '+v+'² = '+h*h+'. Therefore x = '+h+' cm.')}
 if(type==='diagonal-equal'){const shape=pick(rng,['Square','Rectangle','Rhombus (not square)','Parallelogram (not rectangle)']);return task({shape},'For this type of '+(shape.startsWith('Parallelogram')?'parallelogram':'quadrilateral')+', are the two diagonals always equal in length?',shape==='Square'||shape==='Rectangle'?'Yes':'No','A rectangle (including a square) always has equal diagonals. A non-square rhombus or non-rectangular parallelogram does not.',['Yes','No'])}
 if(type==='circle-part'){const part=pick(rng,['Radius','Diameter','Circumference','Centre']);return task({part,radius:5},'Name the highlighted part of the circle.',part,'The radius runs from the centre to the boundary, the diameter crosses the centre between two boundary points, and the circumference is the boundary.',['Radius','Diameter','Circumference','Centre'])}
 if(type==='circle-diameter'||type==='circle-radius'){const r=rand(rng,2,15);return task({radius:r},type==='circle-diameter'?'Find the diameter in centimetres.':'Find the radius in centimetres.',type==='circle-diameter'?2*r:r,'Diameter = 2 × radius. Radius = diameter ÷ 2.')}
 if(type==='circle-circumference'||type==='circle-area'){const r=rand(rng,2,10),v=type==='circle-area'?r*r:2*r;return task({radius:r},'Find the '+(type==='circle-area'?'area (cm²)':'circumference (cm)')+' of the circle. Use 3.14 for π.',String(Math.round(v*314)/100),type==='circle-area'?'Area = πr². Multiply 3.14 by '+r+' × '+r+'.':'Circumference = 2πr. Multiply 3.14 by 2 × '+r+'.')}
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

 const REGION_COLOURS=['#4c9b85','#5385c5','#d7a13c','#a080c5','#d77968'];
 function pointName(i){return String.fromCharCode(65+i%26)+(i>=26?Math.floor(i/26):'')}
 function polygonArea(points){return Math.abs(points.reduce((sum,p,i)=>sum+labCross(p,points[(i+1)%points.length]),0))/2}
 function validRegion(points,ids){
   if(!Array.isArray(ids)||ids.length<3||new Set(ids).size!==ids.length||ids.some(i=>!points[i]))return false;
   const p=ids.map(i=>points[i]),n=p.length,eps=1e-6;
   if(polygonArea(p)<eps||p.some((a,i)=>p.slice(i+1).some(b=>labDist(a,b)<eps)))return false;
   const orient=(a,b,c)=>labCross(labSub(b,a),labSub(c,a)),on=(a,b,c)=>Math.abs(orient(a,b,c))<eps&&labDot(labSub(c,a),labSub(c,b))<=eps;
   const intersects=(a,b,c,d)=>{const u=orient(a,b,c),v=orient(a,b,d),w=orient(c,d,a),z=orient(c,d,b);return (u*v<0&&w*z<0)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b)};
   for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){if(j===i+1||i===0&&j===n-1)continue;if(intersects(p[i],p[(i+1)%n],p[j],p[(j+1)%n]))return false}
   return true;
 }

 // Place measurements in the line's local coordinate system, rather than
 // shifting the baseline vertically (which crosses steep lines).
 function labelBox(p,angle,label,size){
   const rad=angle*D,u=[Math.cos(rad),Math.sin(rad)],v=[-u[1],u[0]];
   return {p,u,v,hw:Math.max(size*.6,String(label).length*size*.31)+3,hh:size*.63+3};
 }
 function labelIntersectsLine(box,a,b){
   const local=p=>{const q=labSub(p,box.p);return [labDot(q,box.u),labDot(q,box.v)]},p=local(a),q=local(b),d=labSub(q,p);
   let lo=0,hi=1;
   for(let i=0;i<2;i++){const bound=i?box.hh:box.hw;if(Math.abs(d[i])<1e-9){if(Math.abs(p[i])>bound)return false;continue}let t=(-bound-p[i])/d[i],z=(bound-p[i])/d[i];if(t>z)[t,z]=[z,t];lo=Math.max(lo,t);hi=Math.min(hi,z);if(lo>hi)return false}
   return true;
 }
 function labelCorners(b){return [-1,1].flatMap(i=>[-1,1].map(j=>labAt(labAt(b.p,b.u,i*b.hw),b.v,j*b.hh)))}
 function boxesOverlap(a,b){return [a.u,a.v,b.u,b.v].every(axis=>Math.abs(labDot(labSub(a.p,b.p),axis))<=Math.abs(labDot(a.u,axis))*a.hw+Math.abs(labDot(a.v,axis))*a.hh+Math.abs(labDot(b.u,axis))*b.hw+Math.abs(labDot(b.v,axis))*b.hh)}
 function dimensionPlacement(a,b,label,{size=14,offset=18,outside=null,lines=[],occupied=[],bounds=null}={}){
   if(labDist(a,b)<.001)return null;
   let angle=Math.atan2(b[1]-a[1],b[0]-a[0])/D;if(angle>90)angle-=180;if(angle<=-90)angle+=180;
   const u=[Math.cos(angle*D),Math.sin(angle*D)],n=[-u[1],u[0]],m=labAt(a,labSub(b,a),.5);
   const preferred=outside?Math.sign(labDot(labSub(outside,m),n))||1:-1;
   const base=Math.max(offset,size*.63+7);
   for(const side of [preferred,-preferred])for(const extra of [0,12,25,42,64,90])for(const fraction of [.5,.35,.65,.2,.8]){
     const p=labAt(labAt(a,labSub(b,a),fraction),n,side*(base+extra)),box=labelBox(p,angle,label,size);
     if(bounds&&labelCorners(box).some(q=>q[0]<bounds[0]||q[1]<bounds[1]||q[0]>bounds[2]||q[1]>bounds[3]))continue;
     if([[a,b],...lines].some(([x,y])=>labelIntersectsLine(box,x,y))||occupied.some(o=>boxesOverlap(box,o)))continue;
     return {p,angle,box};
   }
   return null;
 }
 function angleLabelPlacement(o,r,start,sweep,label,size=18,minimum=r+22){
   const dir=start+sweep/2;
   const arms=[polar(...o,3000,start),polar(...o,3000,start+sweep)];
   for(let font=size;font>=10;font-=2){
     for(let radius=Math.max(minimum,r+font*.8+6);radius<=Math.max(minimum+100,230);radius+=4){
       const p=polar(...o,radius,dir),box=labelBox(p,0,label,font);
       if(arms.some(a=>labelIntersectsLine(box,o,a)))continue;
       // Entire label must sit beyond the angle arc, not merely its centre.
       const u=labSub(p,o),norm=Math.hypot(...u),radial=u.map(x=>x/norm),extent=Math.abs(radial[0])*box.hw+Math.abs(radial[1])*box.hh;
       if(radius-extent<r+4)continue;
       return {p,size:font,box};
     }
   }
   // Degenerate or exceptionally narrow sectors: put the annotation
   // alongside the sector instead of laying text across its arms.
   for(const delta of [15,-15,30,-30,45,-45,90,-90])for(const radius of [Math.max(minimum,r+36),Math.max(minimum,r+58),Math.max(minimum,r+80)]){
     const p=polar(...o,radius,dir+delta),box=labelBox(p,0,label,12);
     if(!arms.some(a=>labelIntersectsLine(box,o,a)))return {p,size:12,box};
   }
   const p=polar(...o,r+55,dir+90);return {p,size:10,box:labelBox(p,0,label,10)};
 }

 // Point names belong in the unmarked sector, including reflex angles.
 function angleVertexPlacement(o,start,sweep,label='A',size=13){
   const span=Math.max(0,Math.min(360,sweep)),gap=360-span,mid=start+span+gap/2;
   const arms=[polar(...o,243,start),polar(...o,243,start+span)];
   for(let radius=19;radius<=220;radius+=3){
     const p=polar(...o,radius,mid),box=labelBox(p,0,label,size);
     if(gap>0&&labelCorners(box).every(q=>mod(labAngle(o,q)-start-span)<gap)&&!arms.some(a=>labelIntersectsLine(box,o,a)))return {p,box,external:false};
   }
   // Full turns have no unmarked sector. Very narrow reflex complements
   // cannot fit a legible label either: keep the name outside the arc and
   // link it to its vertex, rather than writing over the angle marking.
   const dir=gap===0?start+180:mid;
   const p=polar(...o,Math.min(220,gap>0?145:77),dir);
   for(const delta of [0,15,-15,30,-30,60,-60,90,-90]){
     const q=polar(...o,Math.hypot(p[0]-o[0],p[1]-o[1]),dir+delta),box=labelBox(q,0,label,size);
     if(!arms.some(a=>labelIntersectsLine(box,o,a)))return {p:q,box,external:true};
   }
   return {p,box:labelBox(p,0,label,size),external:true};
 }
 function vertexLabel(p,prev,next,offset=22){
   const unit=v=>{const n=Math.hypot(...v)||1;return v.map(a=>a/n)};
   if(!prev&&!next)return [p[0]+offset,p[1]-offset*.6];
   const u=prev?unit(labSub(prev,p)):[0,0],v=next?unit(labSub(next,p)):[0,0],out=[-u[0]-v[0],-u[1]-v[1]];
   const dir=Math.hypot(...out)<.01?[0,-1]:unit(out);return labAt(p,dir,offset)
 }
 function polygonRegionKey(d){return [d.shapeView||'regular',d.n||5,d.regular!==false,d.showDiagonals===true].join(':')}

 const WORKSPACE_FORMATS={A4:[210,297],A5:[148,210],A3:[297,420]};
 function workspaceSize(format='custom',orientation='landscape',width=250,height=160){
   const paper=WORKSPACE_FORMATS[format],mm=paper?(orientation==='portrait'?paper:paper.slice().reverse()):[width,height];
   return {format:paper?format:'custom',orientation:orientation==='portrait'?'portrait':'landscape',w:Math.round(Math.max(50,Math.min(650,Number(mm[0])||250))*4),h:Math.round(Math.max(50,Math.min(650,Number(mm[1])||160))*4)};
 }
 function workspaceState(st){
   const w=st.workspace||{},width=Number(w.w),height=Number(w.h);
   return {...workspaceSize(w.format,w.orientation,Number.isFinite(width)?width/4:250,Number.isFinite(height)?height/4:160),gridMm:[0,5,10,20].includes(w.gridMm)?w.gridMm:10};
 }
 function workspaceFits(st,w,h){
   const inside=p=>p&&p[0]>=0&&p[1]>=0&&p[0]<=w&&p[1]<=h;
   return st.points.every(inside)&&st.circles.every(c=>{const p=st.points[c.i];return inside([p[0]-c.r,p[1]-c.r])&&inside([p[0]+c.r,p[1]+c.r])})&&Object.values(st.traces||{}).every(trail=>trail.every(p=>p===null||inside(p)));
 }

 function labNames(s){if(!Array.isArray(s.names)||s.names.length!==s.points.length){s.names=s.points.map((_,i)=>pointName(i));s.nextName=s.points.length}if(!Number.isInteger(s.nextName))s.nextName=s.points.length;if(!Array.isArray(s.regions))s.regions=[];return s}
 // Prefer the exterior of a closed simple boundary, including concave polygons.
 function labOutside(s,i,j){
   const a=s.points[i],b=s.points[j],m=labAt(a,labSub(b,a),.5),v=labSub(b,a),len=Math.hypot(...v);if(len<.001)return null;
   const edges=[...s.segments,...(s.given!==false?[[0,1]]:[])],adj=k=>edges.filter(e=>e.includes(k)).map(e=>e[0]===k?e[1]:e[0]);
   let ids=[i,j],prev=i,cur=j;while(ids.length<=s.points.length){const neighbours=adj(cur);if(neighbours.length!==2)return null;const next=neighbours.find(k=>k!==prev);if(next===i){if(ids.length<3||adj(i).length!==2||!validRegion(s.points,ids))return null;let area=0;for(let k=0;k<ids.length;k++)area+=labCross(s.points[ids[k]],s.points[ids[(k+1)%ids.length]]);return labAt(m,[v[1]/len,-v[0]/len],Math.sign(area)*40)}if(next===undefined||ids.includes(next))return null;ids.push(next);prev=cur;cur=next}return null;
 }
 function labFaces(s){
   // Vector arrangement of finite straight edges and circular arcs.
   const E=1e-7,T=Math.PI*2,edges=s.segments.filter(e=>labVisible(s,'segments',e)).map(([i,j])=>({a:s.points[i],b:s.points[j],cuts:[0,1],key:'L:'+labStyleKey(s,i,j)})).filter(e=>labDist(e.a,e.b)>E);
   if(s.given!==false&&s.points.length>=2)edges.push({a:s.points[0],b:s.points[1],cuts:[0,1],key:'given'});
   const cs=s.circles.filter(c=>c.r>E&&labVisible(s,'circles',c)).map(c=>({o:s.points[c.i],r:c.r,cuts:[0,Math.PI],key:'C:'+s.names[c.i]+':'+c.r}));
   const ca=(c,p)=>(Math.atan2(p[1]-c.o[1],p[0]-c.o[0])+T)%T,cp=(c,t)=>[c.o[0]+c.r*Math.cos(t),c.o[1]+c.r*Math.sin(t)];
   for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){const e=edges[i],f=edges[j],v=labSub(e.b,e.a),w=labSub(f.b,f.a),q=labSub(f.a,e.a),den=labCross(v,w);if(Math.abs(den)>E){const t=labCross(q,w)/den,u=labCross(q,v)/den;if(t>=-E&&t<=1+E&&u>=-E&&u<=1+E){e.cuts.push(Math.max(0,Math.min(1,t)));f.cuts.push(Math.max(0,Math.min(1,u)))}}else if(Math.abs(labCross(q,v))<E){for(const p of [f.a,f.b]){const t=labDot(labSub(p,e.a),v)/labDot(v,v);if(t>E&&t<1-E)e.cuts.push(t)}for(const p of [e.a,e.b]){const t=labDot(labSub(p,f.a),w)/labDot(w,w);if(t>E&&t<1-E)f.cuts.push(t)}}}
   for(const e of edges)for(const c of cs){const v=labSub(e.b,e.a),q=labSub(e.a,c.o),aa=labDot(v,v),bb=2*labDot(q,v),cc=labDot(q,q)-c.r*c.r,disc=bb*bb-4*aa*cc;if(disc< -E)continue;for(const t of [(-bb-Math.sqrt(Math.max(0,disc)))/(2*aa),(-bb+Math.sqrt(Math.max(0,disc)))/(2*aa)])if(t>=-E&&t<=1+E){const u=Math.max(0,Math.min(1,t));e.cuts.push(u);c.cuts.push(ca(c,labAt(e.a,v,u)))}}
   for(let i=0;i<cs.length;i++)for(let j=i+1;j<cs.length;j++){const c=cs[i],d=cs[j],v=labSub(d.o,c.o),l=Math.hypot(...v);if(l<E||l>c.r+d.r+E||l<Math.abs(c.r-d.r)-E)continue;const x=(c.r*c.r-d.r*d.r+l*l)/(2*l),h=Math.sqrt(Math.max(0,c.r*c.r-x*x)),m=labAt(c.o,v,x/l);for(const sign of [-1,1]){const p=labAt(m,[-v[1],v[0]],sign*h/l);c.cuts.push(ca(c,p));d.cuts.push(ca(d,p))}}
   const nodes=[],adj=[],half=[];function node(p){let i=nodes.findIndex(q=>labDist(q,p)<1e-4);if(i<0){i=nodes.length;nodes.push(p);adj.push([])}return i}
   const cuts=ts=>[...new Set(ts.map(t=>Math.round(t*1e9)/1e9))].sort((a,b)=>a-b);
   function edge(a,b,key,arc=null){const i=node(a),j=node(b);if(i===j)return;const reverse=arc?{...arc,t:arc.t+arc.dt,dt:-arc.dt}:null;for(const [u,v,c] of [[i,j,arc],[j,i,reverse]]){const dir=c?c.t+Math.sign(c.dt)*Math.PI/2:Math.atan2(nodes[v][1]-nodes[u][1],nodes[v][0]-nodes[u][0]);if(!c&&adj[u].some(k=>half[k].v===v&&!half[k].arc))return;const k=half.length;half.push({u,v,arc:c,dir:Math.atan2(Math.sin(dir),Math.cos(dir)),key});adj[u].push(k)}}
   for(const e of edges){const ts=cuts(e.cuts),v=labSub(e.b,e.a);for(let i=1;i<ts.length;i++)edge(labAt(e.a,v,ts[i-1]),labAt(e.a,v,ts[i]),e.key)}
   for(const c of cs){const ts=cuts(c.cuts);for(let i=0;i<ts.length;i++){const t=ts[i],dt=(ts[i+1]??ts[0]+T)-t;if(dt>E)edge(cp(c,t),cp(c,t+dt),c.key,{...c,t,dt})}}
   adj.forEach(a=>a.sort((i,j)=>half[i].dir-half[j].dir));const seen=new Set(),faces=[];
   for(let i=0;i<half.length;i++){if(seen.has(i))continue;let k=i,walk=[];while(!seen.has(k)&&walk.length<=half.length){seen.add(k);walk.push(half[k]);const e=half[k],a=adj[e.v],rev=k^1;k=a[(a.indexOf(rev)+a.length-1)%a.length]}if(k!==i||walk.length<2)continue;
     const points=[],commands=[],keys=[];let area=0;for(const e of walk){const a=nodes[e.u],b=nodes[e.v];points.push(a);keys.push(e.key);if(e.arc){const c=e.arc,n=Math.max(2,Math.ceil(Math.abs(c.dt)/(.025)));for(let j=1;j<n;j++)points.push(cp(c,c.t+c.dt*j/n));commands.push('A '+c.r+' '+c.r+' 0 '+(Math.abs(c.dt)>Math.PI?1:0)+' '+(c.dt>0?1:0)+' '+b.join(' '));area+=(labCross(c.o,labSub(b,a))+c.r*c.r*c.dt)/2}else{commands.push('L '+b.join(' '));area+=labCross(a,b)/2}}
     if(area>1e-4)faces.push({points,area,path:'M '+nodes[walk[0].u].join(' ')+' '+commands.join(' ')+' Z',key:[...new Set(keys)].sort().join('|')});
   }
   // Disconnected nested loops are holes, not overlapping filled regions.
   for(const f of faces){const children=faces.filter(g=>g!==f&&g.area<f.area-E&&g.points.every(p=>labContains(f.points,p)));const direct=children.filter(g=>!children.some(h=>h!==g&&h.area>g.area&&g.points.every(p=>labContains(h.points,p))));f.holes=direct;f.path+=direct.map(g=>' '+g.path).join('');f.key+=direct.map(g=>'!'+g.key).sort().join('')}
   return faces;
 }
 function labContains(points,p){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside}
 function labInFace(f,p){return labContains(f.points,p)&&!(f.holes||[]).some(h=>labContains(h.points,p))}
 function labFaceAt(s,p){return labFaces(s).filter(f=>labInFace(f,p)).sort((a,b)=>a.area-b.area)[0]||null}
 function labRegionShapes(s){const faces=s.regions.some(r=>r.seed)?labFaces(s):[];return s.regions.flatMap(r=>{if(r.seed){const matching=faces.filter(f=>f.key===r.faceKey),f=matching.find(f=>labInFace(f,r.seed))||(matching.length===1?matching[0]:null)||faces.filter(f=>labInFace(f,r.seed)).sort((a,b)=>a.area-b.area)[0];return f?[{path:f.path,colour:r.colour}]:[]}if(r.circle){const c=s.circles.find(c=>s.names[c.i]===r.circle.name&&Math.abs(c.r-r.circle.radius)<1e-5);return c&&labVisible(s,'circles',c)?[{circle:{p:s.points[c.i],r:c.r},colour:r.colour}]:[]}return r.ids&&validRegion(s.points,r.ids)?[{points:r.ids.map(i=>s.points[i]),colour:r.colour}]:[]})}
 function labNotation(s,emit){for(const e of s.segments){const key=labStyleKey(s,...e),mark=s.notation?.[key];if(!mark||!labVisible(s,'segments',e))continue;const a=s.points[e[0]],b=s.points[e[1]],v=labSub(b,a),l=Math.hypot(...v);if(l<8)continue;const u=v.map(x=>x/l),n=[-u[1],u[0]],m=labAt(a,v,.5),count=mark.endsWith('2')?2:1;for(let j=0;j<count;j++){const p=labAt(m,u,(j-(count-1)/2)*9);if(mark.startsWith('equal'))emit('M '+labAt(p,n,-7).join(' ')+' L '+labAt(p,n,7).join(' '),mark);else if(mark.startsWith('parallel')){const tip=labAt(p,u,5),back=labAt(p,u,-5);emit('M '+labAt(back,n,-5).join(' ')+' L '+tip.join(' ')+' L '+labAt(back,n,5).join(' '),mark)}else if(mark==='symmetry')emit('M '+a.join(' ')+' L '+b.join(' '),mark)}}for(const m of s.angleNotation||[]){const ids=m.names.map(n=>s.names.indexOf(n));if(ids.some(i=>i<0))continue;const [a,o,b]=ids.map(i=>s.points[i]),start=labAngle(o,a),end=labAngle(o,b),sweep=mod(end-start),from=sweep>180?end:start,angle=Math.min(sweep,360-sweep);if(angle<.01||angle>179.99)continue;const count=m.kind==='angle2'?2:1;for(let j=0;j<count;j++){const r=23+j*9,p=polar(...o,r,from),q=polar(...o,r,from+angle);if(m.kind==='right'){if(Math.abs(angle-90)>1)continue;emit('M '+p.join(' ')+' L '+[p[0]+q[0]-o[0],p[1]+q[1]-o[1]].join(' ')+' L '+q.join(' '),m.kind)}else emit('M '+p.join(' ')+' A '+r+' '+r+' 0 0 0 '+q.join(' '),m.kind)}}}
 function labStyleKey(s,i,j){return [s.names[i],s.names[j]].sort().join(':')}
 function labConstruction(s,kind,obj){return kind==='segments'?s.segmentStyles?.[labStyleKey(s,...obj)]===true:obj.construction!==false}
 function labVisible(s,kind,obj){return s.showConstruction!==false||!labConstruction(s,kind,obj)}
 function labRayAngle(s,r){const j=s.names?.indexOf(r.relativeTo);return j>=0&&j!==r.i?mod(labAngle(s.points[r.i],s.points[j])+r.relativeAngle):r.angle}
 function labMarks(s,i){return s.rays.filter(r=>r.i===i&&r.mark&&s.names.includes(r.mark.base)&&r.mark.base!==s.names[i]).map(r=>{const j=s.names.indexOf(r.mark.base),base=labAngle(s.points[i],s.points[j]),a=labRayAngle(s,r),sweep=mod(r.mark.hand*(a-base));return {r,j,start:r.mark.hand===1?base:a,sweep}}).filter(m=>m.sweep>.01&&m.sweep<359.99)}
 function labAngleGraphics(s,emit){for(let i=0;i<s.points.length;i++){const o=s.points[i];labMarks(s,i).forEach((m,k)=>{const radius=30+k*24,value=Math.round(m.sweep)+'°',p=polar(...o,radius,m.start),q=polar(...o,radius,m.start+m.sweep),right=Math.abs(m.sweep-90)<.01;const d=right?'M '+p.join(' ')+' L '+[p[0]+q[0]-o[0],p[1]+q[1]-o[1]].join(' ')+' L '+q.join(' '):'M '+p.join(' ')+' A '+radius+' '+radius+' 0 '+(m.sweep>180?1:0)+' 0 '+q.join(' ');const label=angleLabelPlacement(o,radius,m.start,m.sweep,value,12,radius+15);emit(d,label.p,value,i,k)})}}
 function labLabel(s,i){const p=s.points[i],marks=labMarks(s,i);if(marks.length){const arms=marks.flatMap(m=>[m.start,mod(m.start+m.sweep)]),valid=a=>marks.every(m=>mod(a-m.start)>m.sweep+5&&mod(a-m.start)<355);let best=null;for(let a=0;a<360;a+=5){if(!valid(a))continue;const score=Math.min(...arms.map(b=>Math.min(mod(a-b),mod(b-a))));if(!best||score>best.score)best={a,score}}if(best)return polar(...p,25,best.a);const m=marks[0];return angleVertexPlacement(p,m.start,m.sweep,s.names[i],13).p}const neighbours=s.segments.filter(e=>e.includes(i)).map(e=>s.points[e[0]===i?e[1]:e[0]]);if(s.given!==false&&i<2)neighbours.push(s.points[1-i]);return vertexLabel(p,neighbours[0],neighbours[1],20)}

 function labEmpty(free=false){return {given:!free,points:free?[]:[LAB_A.slice(),LAB_B.slice()],segments:[],rays:[],circles:[],regions:[]}}
 function labLines(s,exclude=-1){return [...(s.given!==false&&s.points.length>=2?[{a:s.points[0],b:s.points[1],ray:false}]:[]),...s.segments.filter(l=>!l.includes(exclude)).map(([i,j])=>({a:s.points[i],b:s.points[j],ray:false})),...s.rays.filter(r=>r.i!==exclude).map(r=>({a:s.points[r.i],b:labAt(s.points[r.i],[Math.cos(labRayAngle(s,r)*D),-Math.sin(labRayAngle(s,r)*D)],1),ray:true}))].map(l=>({...l,v:labSub(l.b,l.a)}))}
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


 function shapeGeometry(d){
   const shape=d.shapeView,w=300,h=shape==='square'?300:Math.max(90,Math.min(280,d.shapeHeight||180)),theta=shape==='rectangle'||shape==='square'?90:Math.max(25,Math.min(85,d.shapeAngle||65)),base=shape==='scalene'?Math.max(30,Math.min(48,d.shapeBaseAngle||40)):Math.max(20,Math.min(75,d.shapeBaseAngle||50));
   if(shape==='trapezium')return [[0,0],[300,0],[240,-h],[65,-h]];
   if(shape==='kite')return [[0,-h],[150,0],[0,320],[-150,0]];
   if(shape==='right-triangle')return [[0,0],[300,0],[0,-h]];
   if(shape==='equilateral')return trianglePoints(60,60,0,0,300);
   if(shape==='isosceles')return trianglePoints(base,base,0,0,300);
   if(shape==='scalene')return trianglePoints(base,65,0,0,300);
   return [[0,0],[w,0],polar(w,0,shape==='rhombus'?w:h,theta),polar(0,0,shape==='rhombus'?w:h,theta)];
 }


 function locusInitial(kind='circle'){
   return {kind:kind==='bisector'?'bisector':'circle',p:kind==='bisector'?[400,100]:[540,220],traceNames:[],traces:{},showLocus:false};
 }
 function locusProject(kind,p,previous=[540,220]){
   if(kind==='bisector')return [400,Math.max(45,Math.min(395,p[1]))];
   let v=labSub(p,[400,220]),n=Math.hypot(...v);
   if(n<1e-7){v=labSub(previous,[400,220]);n=Math.hypot(...v)}
   return n<1e-7?[540,220]:labAt([400,220],v,140/n);
 }
 function locusPoints(state){
   const p=locusProject(state.kind,state.p||[540,220]);
   const a=state.kind==='bisector'?[250,220]:[400,220];
   return {P:p,M:labAt(a,labSub(p,a),.5)};
 }
 function traceParts(points){const parts=[];let part=[];for(const p of points||[]){if(p===null){if(part.length>1)parts.push(part);part=[]}else part.push(p)}if(part.length>1)parts.push(part);return parts}
 function traceAdd(state,name,p,old){
   if(!state.traceNames?.includes(name)||labDist(p,old)<.35)return;
   state.traces=state.traces||{};const path=state.traces[name]||(state.traces[name]=[]);
   if(!path.length||path.at(-1)===null)path.push(old.slice());
   if(path.length<6000)path.push(p.slice());
 }
 function traceToggle(state,name){
   state.traceNames=state.traceNames||[];state.traces=state.traces||{};
   if(state.traceNames.includes(name)){state.traceNames=state.traceNames.filter(n=>n!==name);const path=state.traces[name];if(path?.length&&path.at(-1)!==null)path.push(null)}
   else state.traceNames.push(name)
 }

const model={labNotation,labFaces,labFaceAt,labRegionShapes,labMarks,labRayAngle,labLabel,labConstruction,labVisible,labStyleKey,labOutside,workspaceSize,workspaceState,workspaceFits,locusInitial,locusProject,locusPoints,traceParts,traceAdd,traceToggle,shapeGeometry,angleVertexPlacement,labelCorners,dimensionPlacement,labelIntersectsLine,angleLabelPlacement,validRegion,polygonArea,vertexLabel,labEmpty,labSnap,labCheck,labSolution,labTypes,MODES,LEVELS,YEARS,FAMILIES,settings,types,challengeGroups,generate,polar,classify,polyInterior,polyExterior,trianglePoints};
if(typeof module==='object'&&module.exports){module.exports=model;return}
const G=root.TT99Goodies;if(!G)return;G.angles=model;
const {q,qa,esc,field,btn,setPanels}=G,CK=G.challengeKit;
function diagram(d,teacher=false,options={}){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),W=800,H=440,ink='#263e43',teal='#277b70',orange='#b56d2c',shapeFill=!options.paper&&d.type==='diagram'&&d.showFill===true?'#e9f4f0':'none';
 const add=(tag,attrs,t,parent=svg)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(options.paper&&k==='stroke-width'&&Number(v)>0?Math.max(.8,Number(v)*.52):options.paper&&k==='font-size'&&Number(v)>0?Math.max(29,Number(v)):v)));if(t!=null)e.textContent=t;parent.appendChild(e);return e};
 Object.entries({viewBox:'0 0 '+W+' '+H,xmlns:ns,role:'img','aria-label':'Geometry diagram'}).forEach(([k,v])=>svg.setAttribute(k,v));
 const text=(x,y,v,size=21,extra={})=>add('text',{x,y,fill:ink,'font-family':'Arial,sans-serif','font-size':size,'text-anchor':'middle',...extra},v);
 const dimensions=[];
 const dimension=(a,b,value,{size=16,offset=20,outside=null,lines=[],bounds=null}={})=>{const q=dimensionPlacement(a,b,value,{size,offset,outside,lines,bounds,occupied:dimensions});if(!q)return;dimensions.push(q.box);text(q.p[0],q.p[1],value,size,{'dominant-baseline':'central',transform:'rotate('+q.angle+' '+q.p.join(' ')+')','data-ag-dimension':'1'})};
 const line=(a,b,stroke=ink,width=5,extra={})=>add('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke,'stroke-width':width,'stroke-linecap':'round',...extra});
 const path=(p,extra={})=>add('path',{d:p,fill:'none',stroke:teal,'stroke-width':3,...extra});
 const circle=(p,r,fill=teal)=>add('circle',{cx:p[0],cy:p[1],r,fill});
 const arc=(x,y,r,start,a,extra={})=>{if(a>=360){add('circle',{cx:x,cy:y,r,fill:'none',stroke:teal,'stroke-width':3,...extra});return}if(a<=0)return;const p=polar(x,y,r,start),e=polar(x,y,r,start+a);path('M '+p.join(' ')+' A '+r+' '+r+' 0 '+(a>180?1:0)+' 0 '+e.join(' '),extra)};
 // Angle labels sit on their own bisector; neighbouring sectors must not
 // form a single continuous arc. Keep right-angle squares conventional.
 const labelArc=(x,y,r,start,a,label,{labelSize=18,labelRadius=r+22}={})=>{
   const meta={'data-ag-angle-mark':'1','data-ag-radius':r,'data-ag-start':start,'data-ag-sweep':a,'stroke-width':2.5};
   if(Math.abs(a-90)<.01){const p=polar(x,y,r*.75,start),v=polar(x,y,r*.75,start+90),u=[p[0]+v[0]-x,p[1]+v[1]-y];path('M '+p.join(' ')+' L '+u.join(' ')+' L '+v.join(' '),meta)}
   else arc(x,y,r,start,a,meta);
   if(label!=null){const q=angleLabelPlacement([x,y],r,start,a,label,labelSize,labelRadius);text(q.p[0],q.p[1],label,q.size,{'dominant-baseline':'central','font-weight':'500','data-ag-angle-label':'1'})}
 };
 const ray=(x,y,r,a,color=ink)=>line([x,y],polar(x,y,r,a),color);
 const arrow=(x,y,r,a,color=ink)=>{const p=polar(x,y,r,a),l=polar(p[0],p[1],16,a+150),rr=polar(p[0],p[1],16,a-150);line([x,y],p,color,5);line(p,l,color,5);line(p,rr,color,5)};
 const background=add('rect',{width:W,height:H,fill:'#fff'});
 // Crop to the mathematical content, not a fixed landscape canvas. Keep the same coordinates for pointer mapping and paper export.
 function frame(x,y,w,h){svg.setAttribute('viewBox',[x,y,w,h].join(' '));Object.entries({x,y,width:w,height:h}).forEach(([k,v])=>background.setAttribute(k,v));return svg}
 const type=d.type,explore=type==='diagram',a=d.angle??60,rot=d.rotation??0,mode=d.mode||'angle';
 function protractor(x,y,r,start,full=false){G.instruments.protractor(svg,{x,y,radius:r,start,full});}
 function single(x,y,r,a,start,label,scale=false,blank=false,full=false){if(scale)protractor(x,y,r,start,full);ray(x,y,r+5,start);if(!blank){ray(x,y,r+5,start+a,teal);labelArc(x,y,Math.min(r*.27,48),start,a,label)}circle([x,y],4,ink)}
 if(mode==='turn'){
   const x=400,y=225,r=136,sign=d.clockwise?-1:1,start=explore?90+rot:90,end=start+sign*a;add('circle',{cx:x,cy:y,r:r+28,fill:options.paper?'none':'#f8fbfa',stroke:'#d4e2de','stroke-width':2});for(let i=0;i<4;i++)line(polar(x,y,r+18,start+i*90),polar(x,y,r+28,start+i*90),'#a3b8b3',3);
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
   const full=options.full??(shown>180||['reflex','draw-reflex'].includes(type)),scale=options.scale??d.scale??(teacher&&['measure','reflex'].includes(type));
   const r=238,start=rot,x=400,y=220;
   // A rotated semicircle occupies a different bounding rectangle. Include the full arc, rays, degree labels and touch handle, with generous edge clearance.
   const sweep=full?360:180,extent=Array.from({length:sweep+1},(_,i)=>polar(x,y,r+9,start+i));extent.push([x,y]);
   const pad=26,minX=Math.min(...extent.map(p=>p[0]))-pad,maxX=Math.max(...extent.map(p=>p[0]))+pad,minY=Math.min(...extent.map(p=>p[1]))-pad,maxY=Math.max(...extent.map(p=>p[1]))+pad;
   const targetH=pupilDraw&&!options.interactive&&!options.paper?42:0;if(options.measureWorkspace)frame(110,-70,580,580);else frame(minX,minY,maxX-minX,maxY-minY+targetH);
   single(x,y,r,shown,start,teacher||explore?shown+'°':null,scale,blank||options.interactive,full);
   if(pupilDraw&&!options.interactive&&!options.paper)text((minX+maxX)/2,maxY+26,'Target: '+a+'°',25);
   if(options.interactive){
     // The initial handle is at zero, independent of the answer. Show only
     // the pupil's actual ray and its unlabelled arc during construction.
     if(shown>0)labelArc(x,y,48,start,shown,teacher||explore?shown+'°':null);
     const p=polar(x,y,r+9,start+shown);
     line([x,y],p,'#be762b',shown===0?3:5,{'data-ag-moving-arm':'1'});
     add('circle',{cx:p[0],cy:p[1],r:10,fill:'#d58c42',stroke:'#fff','stroke-width':2,'data-ag-angle-handle':'1'});
     add('circle',{cx:x,cy:y,r:r+25,fill:'transparent','data-ag-angle-target':'1',style:'cursor:grab;touch-action:none'});
   }
   const named=[[polar(x,y,r+5,start),'B',start],[polar(x,y,r+5,start+shown),'C',start+shown]];
   const vertex=options.interactive&&!full?{p:polar(x,y,24,start+225),box:labelBox(polar(x,y,24,start+225),0,'A',13),external:false}:angleVertexPlacement([x,y],start,shown);
   if(vertex.external){const v=labSub(vertex.p,[x,y]),len=Math.hypot(...v);line(labAt([x,y],v,6/len),labAt([x,y],v,1-13/len),'#829793',1,{'stroke-dasharray':'3 4','data-ag-point-leader':'A'})}
   text(vertex.p[0],vertex.p[1],'A',13,{'dominant-baseline':'central','data-ag-point-label':'A','paint-order':'stroke',stroke:'#fff','stroke-width':3});
   if(!options.measureWorkspace&&!full){const corners=labelCorners(vertex.box),lx=Math.min(minX,...corners.map(q=>q[0]-3)),ly=Math.min(minY,...corners.map(q=>q[1]-3)),rx=Math.max(maxX,...corners.map(q=>q[0]+3)),by=Math.max(maxY+targetH,...corners.map(q=>q[1]+3));frame(lx,ly,rx-lx,by-ly)}
   for(const [p,name,dir] of named.slice(0,blank||shown===0?1:2)){const q=options.interactive&&name==='C'?polar(x,y,r+9+21,dir):polar(...p,13,dir);text(q[0],q[1],name,13,{'data-ag-point-label':name,'paint-order':'stroke',stroke:'#fff','stroke-width':3})}
   return svg
 }
 if(mode==='facts'){
   if(type==='parallel'||type==='co-interior'){const y1=140,y2=300,dx=80/Math.tan(a*D),p=[400+dx,y1],u=[400-dx,y2];line([65,y1],[735,y1]);line([65,y2],[735,y2]);line(polar(...p,65/Math.sin(a*D),a),polar(...u,65/Math.sin(a*D),a+180),teal);const co=type==='co-interior',alt=d.relation==='alternate';labelArc(...u,42,0,a,a+'°');labelArc(...p,44,co?a+180:alt?180:0,co?180-a:a,teacher?(co?180-a:a)+'°':'x');return svg}
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
     labelArc(x,y,radius,at,v,label,{labelSize:18,labelRadius});at+=v
   }
   if(type==='straight'||explore&&values.reduce((s,v)=>s+v,0)===180)ray(x,y,r,at);circle([x,y],4,ink);return frame(195,20,410,400)
 }
 function polygon(points,pointNames=null){
   const outline=add('polygon',{'data-ag-inspect-polygon':'1',points:points.map(p=>p.join(',')).join(' '),fill:shapeFill,stroke:ink,'stroke-width':3,'stroke-linejoin':'round'});
   const names=pointNames||points.map((_,i)=>pointName(i)),regionPoints=points.slice(),key=polygonRegionKey(d);
   if(explore&&d.showDiagonals&&points.length===4){const u=labSub(points[2],points[0]),v=labSub(points[3],points[1]),den=labCross(u,v);if(Math.abs(den)>1e-6){regionPoints.push(labAt(points[0],u,labCross(labSub(points[1],points[0]),v)/den));names.push('O')}}
   if(explore){
     outline.setAttribute('data-ag-region-points',JSON.stringify(regionPoints));outline.setAttribute('data-ag-region-names',JSON.stringify(names));
     for(const region of (d.regionsByShape?.[key]||[])){if(validRegion(regionPoints,region.ids))add('polygon',{points:region.ids.map(i=>regionPoints[i].join(',')).join(' '),fill:REGION_COLOURS[region.colour]||REGION_COLOURS[0],'fill-opacity':.28,stroke:'none','data-ag-region':'1'})}
   }
   points.forEach((p,i)=>{const pos=vertexLabel(p,points[(i+points.length-1)%points.length],points[(i+1)%points.length],22);circle(p,3,ink);text(pos[0],pos[1]+5,names[i],16,{'data-ag-point-label':names[i],'paint-order':'stroke',stroke:'#fff','stroke-width':3})});
   if(regionPoints.length>points.length){const p=regionPoints.at(-1);circle(p,3,ink);text(p[0]+13,p[1]-10,'O',16,{'data-ag-point-label':'O','paint-order':'stroke',stroke:'#fff','stroke-width':3})}
 }
 function corner(points,i,label){const p=points[i],prev=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length],dir=v=>mod(Math.atan2(p[1]-v[1],v[0]-p[0])/D);let start=dir(prev),v=mod(dir(next)-start);if(v>180){start=dir(next);v=360-v}labelArc(...p,Math.min(38,Math.hypot(next[0]-p[0],next[1]-p[1])*.22,Math.hypot(prev[0]-p[0],prev[1]-p[1])*.22),start,v,label)}
 function fit(points){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),s=Math.min(540/Math.max(1,maxX-minX),300/Math.max(1,maxY-minY));return points.map(([x,y])=>[400+(x-(minX+maxX)/2)*s,210+(y-(minY+maxY)/2)*s])}
 function polygonFrame(points,pad=76){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs)-pad,y=Math.min(...ys)-pad;return frame(x,y,Math.max(...xs)-x+pad,Math.max(...ys)-y+pad)}
 if((mode==='construct'||mode==='free-explore')&&(d.labDrawing||teacher&&labTypes.includes(d.type))){
   const st=labNames(JSON.parse(JSON.stringify(d.labDrawing||labSolution(d)))),free=st.given===false,ws=workspaceState(st),ww=free?ws.w:800,hh=free?ws.h:400,step=free?ws.gridMm*4:40;if(step){for(let gx=free?step:20;gx<ww;gx+=step)line([gx,free?0:22],[gx,free?hh:hh-18],'#e0e9e6',1,{'data-ag-grid':'1'});for(let gy=free?step:22;gy<hh;gy+=step)line([free?0:20,gy],[free?ww:ww-20,gy],'#e0e9e6',1,{'data-ag-grid':'1'})}
   if(free)for(const trail of Object.values(st.traces||{}))for(const points of traceParts(trail)){add('polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',stroke:orange,'stroke-width':1.8,'stroke-dasharray':'4 3','data-ag-trace':'1'})}
   for(const region of labRegionShapes(st)){const attrs={fill:REGION_COLOURS[region.colour]||REGION_COLOURS[0],'fill-opacity':.28,stroke:'none','data-ag-region':'1'};if(region.circle)add('circle',{...attrs,cx:region.circle.p[0],cy:region.circle.p[1],r:region.circle.r});else if(region.path)add('path',{...attrs,d:region.path,'fill-rule':'evenodd'});else add('polygon',{...attrs,points:region.points.map(p=>p.join(',')).join(' ')})}
   for(const c of st.circles)if(labVisible(st,'circles',c))add('circle',{cx:st.points[c.i][0],cy:st.points[c.i][1],r:c.r,fill:'none',stroke:labConstruction(st,'circles',c)?orange:teal,'stroke-width':labConstruction(st,'circles',c)?1.8:3,'stroke-dasharray':labConstruction(st,'circles',c)?'5 4':''});
   for(const r of st.rays)if(labVisible(st,'rays',r))line(st.points[r.i],polar(...st.points[r.i],1200,labRayAngle(st,r)),teal,labConstruction(st,'rays',r)?1.8:3,{'stroke-dasharray':labConstruction(st,'rays',r)?'7 5':''});
   const dimLines=labLines(st).map(l=>[l.a,l.ray?labAt(l.a,l.v,1200):l.b]);
   if(!free){line(st.points[0],st.points[1],ink,4);dimension(st.points[0],st.points[1],'6 cm',{outside:[460,360],lines:dimLines,bounds:[0,0,ww,hh]})}
   for(const [i,j] of st.segments){const edge=[i,j];if(!labVisible(st,'segments',edge))continue;const a=st.points[i],b=st.points[j],construction=labConstruction(st,'segments',edge);line(a,b,construction?orange:teal,construction?1.8:3,{'stroke-dasharray':construction?'5 4':''});if(!construction&&(!free||st.showMeasurements===true)){const others=st.points.filter(p=>p!==a&&p!==b),mid=labAt(a,labSub(b,a),.5),c=others.length?others.reduce((v,p)=>labAt(v,p,1/others.length),[0,0]):null;dimension(a,b,round(labDist(a,b)/40)+' cm',{size:14,outside:labOutside(st,i,j)||(c?labAt(mid,labSub(mid,c),1):null),lines:dimLines,bounds:[0,0,ww,hh]})}}
   labNotation(st,(d,k)=>path(d,{stroke:teal,'stroke-width':1.8,'stroke-dasharray':k==='symmetry'?'8 4 2 4':'','data-ag-notation':k}));
   labAngleGraphics(st,(d,p,v)=>{path(d,{stroke:teal,'stroke-width':1.8,'data-ag-angle-mark':'1'});text(p[0],p[1],v,12,{'data-ag-angle-value':'1','paint-order':'stroke',stroke:'#fff','stroke-width':3})});
    st.points.forEach((p,i)=>{circle(p,3,ink);const pos=labLabel(st,i);text(pos[0],pos[1]+4,st.names[i],16,{'data-ag-point-label':st.names[i],'paint-order':'stroke',stroke:'#fff','stroke-width':3})});
   if(!free&&d.type==='shape-build'||!free&&d.type==='build-right')labelArc(...st.points[0],38,0,d.angle,d.angle+'°');
   if(!free&&['build-rectangle','build-square'].includes(d.type)){for(let i=0;i<4;i++){const p=st.points[i],u=st.points[(i+1)%4],v=st.points[(i+3)%4],a=polar(...p,16,labAngle(p,u)),b=polar(...p,16,labAngle(p,v));path('M '+a.join(' ')+' L '+[a[0]+b[0]-p[0],a[1]+b[1]-p[1]].join(' ')+' L '+b.join(' '),{stroke:teal,'stroke-width':2})}}
   const out=frame(0,0,ww,hh);if(free){out.setAttribute('data-ag-workspace-mm',ww/4+' '+hh/4);out.setAttribute('width',ww/4+'mm');out.setAttribute('height',hh/4+'mm')}return out;
 }
 if(mode==='construct'&&labTypes.includes(d.type)&&!teacher){
   add('rect',{x:24,y:24,width:752,height:370,fill:'#fff',stroke:'#dce8e4','stroke-width':1.5,'stroke-dasharray':'5 5'});return frame(0,0,800,420);
 }
 if(mode==='construct'){
   const show=teacher||explore||options.attempt!=null,aa=teacher||explore?a:options.attempt??0,l=teacher||explore?d.length:options.length??0;
   const x=340,y=302,unit=40,B=[x+6*unit,y],C=polar(x,y,l*unit,aa);
   for(let gx=20;gx<=780;gx+=unit)line([gx,22],[gx,342],'#e0e9e6',1);for(let gy=22;gy<=342;gy+=unit)line([20,gy],[780,gy],'#e0e9e6',1);
   line([x,y],B,ink,4);text(x-18,y+20,'A',26);text(B[0]+16,B[1]+20,'B',26);dimension([x,y],B,'6 cm',{outside:[x,y+100],size:16});
   if(show&&l>0&&aa>0){line([x,y],C,teal,4);line(C,B,ink,4);text(C[0],C[1]-14,'C',26);labelArc(x,y,43,0,aa,aa+'°');const mid=labAt([x,y],labSub(C,[x,y]),.5);dimension([x,y],C,l+' cm',{outside:labAt(mid,labSub(mid,B),1),lines:[[[x,y],B],[C,B]],size:16})}
   text(400,402,'Scale: each grid square represents 1 cm',25);return svg
 }

 if(mode==='loci'){
   const st=d.locusState||locusInitial(),points=locusPoints(st),P=points.P,M=points.M,A=st.kind==='bisector'?[250,220]:[400,220],B=[550,220];
   const showM=st.showMidpoint||st.traceNames?.includes('M')||st.traces?.M?.length;
   if(st.showLocus){if(st.kind==='circle')add('circle',{cx:400,cy:220,r:140,fill:'none',stroke:'#83a99f','stroke-width':1.6,'stroke-dasharray':'6 5','data-ag-locus-guide':'1'});else line([400,28],[400,412],'#83a99f',1.6,{'stroke-dasharray':'6 5','data-ag-locus-guide':'1'})}
   for(const [name,trail] of Object.entries(st.traces||{}))for(const pts of traceParts(trail))add('polyline',{points:pts.map(p=>p.join(',')).join(' '),fill:'none',stroke:name==='M'?'#5385c5':orange,'stroke-width':2.4,'stroke-linejoin':'round','stroke-linecap':'round','data-ag-locus-trace':name});
   line(A,P,teal,2.5);if(st.kind==='bisector'){line(B,P,teal,2.5);line(A,B,ink,1.5,{'stroke-dasharray':'5 4'})}
   const namePoint=(p,name,movable=false)=>{if(st.traceNames?.includes(name)&&!options.paper)add('circle',{cx:p[0],cy:p[1],r:11,fill:'none',stroke:name==='M'?'#5385c5':orange,'stroke-width':2});add('circle',{cx:p[0],cy:p[1],r:movable?6:4,fill:movable?teal:ink,'data-ag-locus-point':name});const q=vertexLabel(p,name==='P'?A:null,name==='P'&&st.kind==='bisector'?B:null,18);text(q[0],q[1]+4,name,16,{'paint-order':'stroke',stroke:'#fff','stroke-width':3})};
   namePoint(A,st.kind==='circle'?'O':'A');if(st.kind==='bisector')namePoint(B,'B');namePoint(P,'P',true);if(showM)namePoint(M,'M');
   const val=(labDist(A,P)/40).toFixed(2);
   text(400,435,st.kind==='circle'?'OP = '+val+' cm (constant)':'AP = BP = '+val+' cm',17);
   text(400,462,st.kind==='circle'?'P stays a fixed distance from O.':'P stays equidistant from A and B.',16);
   if(showM)text(400,484,'M is the midpoint of '+(st.kind==='circle'?'OP':'AP')+'.',15);
   return frame(65,10,670,490)
 }
 if(mode==='circle'){
   const r=d.radius||5,x=400,y=180,R=explore?65+6*r:145,p=[x,y],left=[x-R,y],right=[x+R,y],top=[x,y-R];
   const highlight=d.part||'Radius',isPart=type==='circle-part',rad=explore||teacher&&!isPart||type!=='circle-radius'&&!isPart||isPart&&highlight==='Radius',dia=explore||teacher&&!isPart&&['circle-radius','circle-diameter'].includes(type)||type==='circle-radius'||isPart&&highlight==='Diameter';
   add('circle',{cx:x,cy:y,r:R,fill:shapeFill,stroke:isPart&&highlight==='Circumference'?orange:ink,'stroke-width':isPart&&highlight==='Circumference'?5:3,'data-ag-circle-outline':'1'});
   if(dia){line(left,right,isPart?orange:teal,isPart?4:2.5,explore?{'stroke-dasharray':'7 5'}:{});if(!isPart)text(x-R*.45,y+21,'D',17,{'font-style':'italic','data-ag-circle-symbol':'D'})}
   if(rad){const end=polar(x,y,R,55);line(p,end,isPart?orange:teal,isPart?4:2.5);if(!isPart){const mid=polar(x,y,R*.58,55),offset=polar(...mid,15,-35);text(offset[0],offset[1]+4,'r',17,{'font-style':'italic','data-ag-circle-symbol':'r'})}}
   add('circle',{cx:x,cy:y,r:isPart&&highlight==='Centre'?7:3.5,fill:isPart&&highlight==='Centre'?orange:ink});
   if(!isPart){text(x-11,y+14,'O',13,{'data-ag-point-label':'O'});if(dia){for(const [p,name,dx] of [[left,'A',-12],[right,'B',12]]){circle(p,2.8,ink);text(p[0]+dx,p[1]+4,name,13,{'data-ag-point-label':name})}}if(rad){const end=polar(x,y,R,55),pos=polar(x,y,R+15,55);circle(end,2.8,ink);text(pos[0],pos[1]+3,dia?'C':'A',13,{'data-ag-point-label':dia?'C':'A'})}}
   let baseline=365;
   if(isPart){if(teacher)text(x,baseline,highlight,19);return frame(200,12,400,teacher?380:338)}
   const given=explore||teacher?'r = '+r+' cm     ·     D = '+2*r+' cm':type==='circle-radius'?'D = '+2*r+' cm':'r = '+r+' cm';
   text(x,baseline,given,18,{'data-ag-circle-values':'1'});
   if(explore||teacher&&['circle-radius','circle-diameter'].includes(type)){baseline+=25;text(x,baseline,'D = 2r  (Diameter = 2 × radius)',17,{'data-ag-circle-rule':'1'})}
   if(explore&&d.circleEnrichment){
     baseline+=30;text(x,baseline,'Circumference: C = πD = 2πr',17,{'data-ag-circle-formula':'circumference'});
     baseline+=23;text(x,baseline,'C = 2 × π × '+r+' ≈ '+(2*Math.PI*r).toFixed(2)+' cm',16,{'data-ag-circle-working':'circumference'});
     baseline+=30;text(x,baseline,'Area: A = πr²',17,{'data-ag-circle-formula':'area'});
     baseline+=23;text(x,baseline,'A = π × '+r+'² ≈ '+(Math.PI*r*r).toFixed(2)+' cm²',16,{'data-ag-circle-working':'area'});
   }
   if(teacher&&['circle-area','circle-circumference'].includes(type)){
     const area=type==='circle-area';baseline+=26;text(x,baseline,area?'A = πr²':'C = 2πr',17,{'data-ag-circle-formula':area?'area':'circumference'});
     baseline+=23;text(x,baseline,(area?'A = 3.14 × '+r+'²':'C = 2 × 3.14 × '+r)+' = '+d.answer+(area?' cm²':' cm'),16,{'data-ag-circle-working':area?'area':'circumference'});
   }
   return frame(190,12,420,baseline+12);
 }
 if(mode==='polygon'&&['rectangle-length','diagonal-equal','diagonal-bisect','diagonal-perpendicular','parallel-count','shape-family','isosceles-angle'].includes(type)){
   let pts;
   if(type==='isosceles-angle'){
     pts=fit(trianglePoints(d.angles[0],d.angles[1]));polygon(pts);
     for(const i of [0,1]){const p=pts[i],q=pts[2],mid=[(p[0]+q[0])/2,(p[1]+q[1])/2],a=Math.atan2(q[1]-p[1],q[0]-p[0]);line([mid[0]-9*Math.sin(a),mid[1]+9*Math.cos(a)],[mid[0]+9*Math.sin(a),mid[1]-9*Math.cos(a)],teal,3)}
     pts.forEach((p,i)=>corner(pts,i,i===0&&!teacher?'x':i===1&&!teacher?null:d.angles[i]+'°'));return polygonFrame(pts)
   }
   if(type==='rectangle-length')pts=fit([[0,0],[d.width,0],[d.width,d.height],[0,d.height]]);
   else if(d.shape==='Square')pts=fit([[0,0],[200,0],[200,200],[0,200]]);
   else if(d.shape.startsWith('Rectangle'))pts=fit([[0,0],[320,0],[320,190],[0,190]]);
   else if(d.shape.startsWith('Rhombus'))pts=fit([[0,0],[200,0],polar(200,0,200,65),polar(0,0,200,65)]);
   else if(d.shape==='Trapezium')pts=fit([[0,0],[320,0],[240,-180],[70,-180]]);
   else pts=fit([[0,0],[320,0],polar(320,0,180,65),polar(0,0,180,65)]);
   polygon(pts);
   if(type==='rectangle-length'){pts.forEach((p,i)=>{corner(pts,i,null);const q=pts[(i+1)%4],m=labAt(p,labSub(q,p),.5);dimension(p,q,i===d.missingSide&&!teacher?'x':(i%2?d.height:d.width)+' cm',{outside:labAt(m,labSub(m,[400,210]),1),lines:pts.map((p,i)=>[p,pts[(i+1)%4]]),size:16,offset:25})})}
   else if(type.startsWith('diagonal-')){line(pts[0],pts[2],teal,3,{'stroke-dasharray':'7 4'});line(pts[1],pts[3],orange,3,{'stroke-dasharray':'7 4'});const u=labSub(pts[2],pts[0]),v=labSub(pts[3],pts[1]),o=labAt(pts[0],u,labCross(labSub(pts[1],pts[0]),v)/labCross(u,v));add('circle',{cx:o[0],cy:o[1],r:3,fill:ink,'data-ag-inspect-point':'O'});text(o[0]+13,o[1]-10,'O',15,{'data-ag-point-label':'O'});if(teacher){const yes=d.answer==='Yes';text(400,410,yes?({'diagonal-equal':'Equal diagonals','diagonal-bisect':'Diagonals bisect each other','diagonal-perpendicular':'Perpendicular diagonals'}[type]):({'diagonal-equal':'Diagonals are not always equal','diagonal-bisect':'Diagonals do not always bisect each other','diagonal-perpendicular':'Diagonals are not always perpendicular'}[type]),18);return frame(70,0,660,440)}}
   return polygonFrame(pts,80)
 }

 if(mode==='polygon'&&['similar-side','pythagoras'].includes(type)){
   if(type==='similar-side'){
     const ratio=d.length/d.baseLength,k=d.factor,scale=Math.min(100,260/k,230/(ratio*k)),small=[[135,310],[135+scale,310],[135,310-scale*ratio]],large=[[430,310],[430+scale*k,310],[430,310-scale*k*ratio]];
     for(const [pts,factor,names] of [[small,1,['A','B','C']],[large,k,['D','E','F']]]){
       polygon(pts,names);corner(pts,0,null);const edges=pts.map((p,i)=>[p,pts[(i+1)%3]]);
       dimension(pts[0],pts[1],d.baseLength*factor+' cm',{outside:[pts[0][0],360],size:15,lines:edges});
       dimension(pts[0],pts[2],factor===1?d.length+' cm':teacher?d.answer+' cm':'x',{outside:[pts[0][0]-70,200],size:15,lines:edges});
     }
     return frame(40,35,730,355)
   }
   const pts=fit([[0,0],[d.baseLength,0],[0,-d.length]]),edges=pts.map((p,i)=>[p,pts[(i+1)%3]]);
   polygon(pts);corner(pts,0,null);
   for(const [i,j,label] of [[0,1,d.baseLength+' cm'],[0,2,d.length+' cm'],[1,2,teacher?d.answer+' cm':'x']]){const a=pts[i],b=pts[j],m=labAt(a,labSub(b,a),.5),c=pts[3-i-j];dimension(a,b,label,{outside:labAt(m,labSub(m,c),1),size:16,lines:edges})}
   return polygonFrame(pts,95)
 }
 if(mode==='polygon'&&explore&&d.shapeView&&d.shapeView!=='regular'){
   const shape=d.shapeView;let pts=shapeGeometry(d);
   const ar=rot*D;pts=fit(pts.map(([x,y])=>[x*Math.cos(ar)-y*Math.sin(ar),x*Math.sin(ar)+y*Math.cos(ar)]));polygon(pts);
   if(d.showCorners!==false)pts.forEach((p,i)=>{const u=pts[(i+1)%pts.length],v=pts[(i+pts.length-1)%pts.length],a=labAngle(p,u),b=labAngle(p,v),ang=Math.min(mod(a-b),mod(b-a));corner(pts,i,Math.round(ang)+'°')});
   if(d.showDiagonals&&pts.length===4){line(pts[0],pts[2],teal,3,{'stroke-dasharray':'6 5'});line(pts[1],pts[3],orange,3,{'stroke-dasharray':'6 5'});const eq=Math.abs(labDist(pts[0],pts[2])-labDist(pts[1],pts[3]))<.1;const bisect=['square','rectangle','rhombus','parallelogram'].includes(shape),u=labSub(pts[2],pts[0]),v=labSub(pts[3],pts[1]),perp=Math.abs(labDot(u,v))/(Math.hypot(...u)*Math.hypot(...v))<.001;const p=labAt(pts[0],u,labCross(labSub(pts[1],pts[0]),v)/labCross(u,v));if(perp){const a=polar(...p,13,labAngle(p,pts[0])),b=polar(...p,13,labAngle(p,pts[1]));path('M '+a.join(' ')+' L '+[a[0]+b[0]-p[0],a[1]+b[1]-p[1]].join(' ')+' L '+b.join(' '),{stroke:teal,'stroke-width':1.6})}text(400,378,(eq?'Equal':'Unequal')+' diagonals'+(bisect?' · bisect each other':'')+(perp?' · perpendicular':''),16)}
   if(d.showSides!==false){const lengths=pts.map((p,i)=>labDist(p,pts[(i+1)%pts.length]));const groups=[];lengths.forEach(l=>{if(!groups.some(v=>Math.abs(v-l)<.05))groups.push(l)});lengths.forEach((l,i)=>{if(lengths.filter(v=>Math.abs(v-l)<.05).length<2)return;const p=pts[i],q=pts[(i+1)%pts.length],a=Math.atan2(q[1]-p[1],q[0]-p[0]),m=[(p[0]+q[0])/2,(p[1]+q[1])/2],count=1+groups.findIndex(v=>Math.abs(v-l)<.05);for(let k=0;k<count;k++){const t=(k-(count-1)/2)*8,x=m[0]+t*Math.cos(a),y=m[1]+t*Math.sin(a);line([x-8*Math.sin(a),y+8*Math.cos(a)],[x+8*Math.sin(a),y-8*Math.cos(a)],teal,3)}})}
   if(d.showParallel&&pts.length===4){const pairs=shape==='kite'?[]:shape==='trapezium'?[0]:[0,1];for(const i of pairs)for(const j of [i,i+2]){const p=pts[j],q=pts[(j+1)%4],a=labAngle(p,q),m=[(p[0]+q[0])/2,(p[1]+q[1])/2];for(let k=0;k<=i;k++){const c=polar(...m,(k+1)*17,a);line(polar(...c,8,a+145),c,orange,2);line(polar(...c,8,a-145),c,orange,2)}}}
   const notes={square:'Four equal sides · four right angles',rectangle:'Opposite sides equal · four right angles',rhombus:'Four equal sides · opposite angles equal',parallelogram:'Opposite sides and angles equal',trapezium:'One pair of parallel sides',kite:'Two pairs of adjacent equal sides','right-triangle':'One right angle · other angles sum to 90°',equilateral:'Three equal sides · three 60° angles',isosceles:'Two equal sides · equal base angles',scalene:'No equal sides · no equal angles'};
   if(d.showHeight&&pts.length===3){const a=pts[0],b=pts[1],c=pts[2],v=labSub(b,a),p=labAt(a,v,labDot(labSub(c,a),v)/labDot(v,v));line(c,p,orange,2,{'stroke-dasharray':'5 4'});if(labDist(c,p)>1)dimension(c,p,'h',{size:15,lines:pts.map((p,i)=>[p,pts[(i+1)%3]])});text(400,378,'Area = ½ × base × perpendicular height',17)}
   text(400,410,notes[shape]||'',18);return frame(75,0,650,440)
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
   if(type==='triangle'||type==='triangle-type'){const v=d.angles,points=fit(trianglePoints(v[0],v[1]));polygon(points);if(type==='triangle'||teacher)points.forEach((p,i)=>corner(points,i,type==='triangle'&&i===2&&!teacher?'x':v[i]+'°'));return polygonFrame(points)}
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
function paper(item,teacher){const d=geometry(item.data);if(item.kind==='diagram')return diagram(d,true,{scale:d.scale,paper:true});let prompt=d.prompt;if(['measure','reflex'].includes(d.type))prompt+=' Use your own protractor.';if(inspectTypes.includes(d.type))prompt+=' You may use a ruler or protractor to investigate the diagram.';if(labTypes.includes(d.type))prompt+=' On paper, draw AB = 6 cm first using your ruler. Use your geometry set in the working space.';if(d.choices)prompt+=' Choices: '+d.choices.join(' / ')+'.';return G.exportTools.composeWorksheetCardSvg(diagram(d,teacher,{paper:true,scale:teacher&&['measure','reflex','draw','draw-reflex'].includes(d.type)}),{title:'Angles & geometry',prompt,responseMode:(['draw','draw-reflex'].includes(d.type)||labTypes.includes(d.type))?'none':d.choices?'lines':'box',responseLines:1,responseLabel:'Answer',paperStyle:'plain',printDiagramScale:labTypes.includes(d.type)?null:['draw','draw-reflex','measure','reflex'].includes(d.type)?1.55:1.05,diagramMaxHeight:labTypes.includes(d.type)?420:380,answer:d.answer,showAnswer:teacher})}
if(G.publishing)G.publishing.register(ID,{label:'Angles & geometry',types:s=>types(s),title:item=>FAMILIES.find(t=>t[0]===item.data.type)?.[1]||'Angle illustration',recipe:(s,type)=>({...settings(s),type}),generate,signature:d=>JSON.stringify([d.type,d.angle,d.angles,d.rotation,d.clockwise,d.n,d.regular,d.shape,d.relation,d.length,d.rightLength,d.radius,d.part,d.width,d.height,d.missingSide,d.claim,d.baseLength,d.factor,d.hypotenuse]),capture:s=>[G.publishing.record(ID,s.task?'challenge':'diagram',s.task?{...geometry(s.task),revealed:false}:s.demo)],render:paper,answerSummary:item=>item.data.answer,answerGraphic:item=>diagram(geometry(item.data),true,{paper:true,scale:['measure','draw','draw-reflex','reflex'].includes(item.data.type)}),answerNote:item=>item.data.note||''});

 function mountLab(box,initial,onChange,{free=false,motion=false}={}){
  let st=labNames(initial||labEmpty(free)),ws=workspaceState(st),ww=free?ws.w:800,hh=free?ws.h:400,corner=0,hand=1,selection=null,tool=(free&&st.allowMovement||motion)?'move':'segment',first=null,aligned=null,reference=null,hover=null,history=[],snap=true,measure=free&&st.showMeasurements===true,grid=free?ws.gridMm>0:true,moving=null,sheetPan=null,panMode=false,aperture=null,keepOpening=false,guideOpen=false,guideStep=0,regionPick=[],regionColour=0,regionStatus='',shadeMode='region',notationMode='',notationPick=[];
  motion=free&&(st.allowMovement??motion);if(free)st.allowMovement=motion;
  const clone=x=>JSON.parse(JSON.stringify(x)),save=()=>history.push(clone(st)),N='http://www.w3.org/2000/svg';
  const toolbar=document.createElement('div');toolbar.className='gd-ag-lab-toolbar';toolbar.setAttribute('aria-label','Construction tools');
  const instruments=document.createElement('div');instruments.className='gd-ag-lab-tools';instruments.setAttribute('role','group');instruments.setAttribute('aria-label','Drawing instruments');
  const helpers=document.createElement('div');helpers.className='gd-ag-lab-helpers';
  const actions=document.createElement('div');actions.className='gd-ag-lab-actions';actions.setAttribute('role','group');actions.setAttribute('aria-label','Drawing actions');
  const options=document.createElement('div');options.className='gd-ag-lab-options';options.setAttribute('role','group');options.setAttribute('aria-label','Drawing assistance');
  helpers.append(actions,options);toolbar.append(instruments,helpers);helpers.style.justifyContent='space-between';helpers.style.columnGap='8px';
  const svg=document.createElementNS(N,'svg');svg.setAttribute('viewBox','0 0 '+ww+' '+hh);svg.classList.add('gd-ag-lab-canvas');svg.style.cssText='width:100%;max-height:'+(free?'820':'620')+'px;display:block;touch-action:none;user-select:none;background:white;border:1px solid #cbded8;border-radius:8px';
  const hint=document.createElement('p');hint.className='gd-help';hint.dataset.agPaperConstruction='1';hint.style.cssText='text-align:center;min-height:24px;margin:5px 0';
  const guide=document.createElement('section');guide.className='gd-ag-lab-guide';guide.hidden=true;
  const viewport=free?document.createElement('div'):null;if(viewport){viewport.className='gd-ag-sheet-viewport';viewport.style.cssText='max-width:100%;max-height:680px;overflow:auto;overscroll-behavior:contain;border:1px solid #cbded8;border-radius:8px;background:#e4eae8;padding:8px;box-sizing:border-box';viewport.append(svg)}box.replaceChildren(toolbar,viewport||svg,hint,guide);
  const screenUnit=free?Math.max(.25,(viewport.clientWidth||box.clientWidth||800)/1000):1;
  function sizeCanvas(){svg.setAttribute('viewBox','0 0 '+ww+' '+hh);if(free){svg.style.width=ww*screenUnit+'px';svg.style.height=hh*screenUnit+'px';svg.style.maxWidth='none';svg.style.maxHeight='none';svg.style.boxSizing='content-box';svg.style.border='0';svg.style.borderRadius='0';svg.style.margin='0';svg.style.boxShadow='0 0 0 1px #aebfba, 2px 3px 7px #243d3920'}}sizeCanvas();
  const icons={
    select:'<path d="M4 3l15 10-7 1-3 7Z"/>',
    move:'<path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
    trace:'<path d="M3 19C5 6 12 20 16 8S21 5 21 5" stroke-dasharray="2 3"/><circle cx="21" cy="5" r="2" fill="currentColor"/>',
    point:'<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><path d="M12 3v4m0 10v4M3 12h4m10 0h4"/>',
    segment:'<rect x="2.5" y="7.5" width="19" height="9" rx="1.5"/><path d="M6 8v4m4-4v2.5m4-2.5v4m4-4v2.5"/>',
    ray:'<path d="M5 19L20 4M13 4h7v7"/><circle cx="4" cy="20" r="1.6" fill="currentColor" stroke="none"/>',
    protractor:'<path d="M2 17a10 10 0 0 1 20 0Z M12 7v4M5 10l2.5 3M19 10l-2.5 3M3 14l3 1M21 14l-3 1"/><circle cx="12" cy="17" r="1.2" fill="currentColor" stroke="none"/>',
    square45:'<path d="M3 3v18h18Z M7 12v5h5Z M3 17h4v4"/>',
    square30:'<path d="M2 20h20L2 8Z M6 14v3h5Z M2 16h4v4"/>',
    compass:'<circle cx="12" cy="5" r="2.5"/><path d="M11 7L5 21M13 7l6 14M7.5 15h9M12 2V1"/>',
    shade:'<path d="M3 19L13 3L21 19Z" fill="currentColor" fill-opacity=".22"/><circle cx="3" cy="19" r="1.5"/><circle cx="13" cy="3" r="1.5"/><circle cx="21" cy="19" r="1.5"/>',
    pan:'<path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
    expand:'<path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6"/>',
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
  const controls=[['point','Point','Place a point'],['segment','Ruler','Draw a straight line with the ruler'],['ray','Ray','Draw a ray'],['protractor','Protractor','Measure and draw an angle'],['square45','45°','45° set square'],['square30','30°–60°','30°–60° set square'],['compass','Compass','Draw a compass circle'],['erase','Erase','Erase a drawn object']];if(free)controls.push(['select','Select','Select a line, ray or circle to change its style'],['shade','Shade','Select and shade a polygonal region']);if(free){controls.unshift(['move','Move','Move vertices freely without preserving shape properties']);controls.push(['trace','Trace','Select a point to trace its movement'])}
  function button(id,label,description,fn,parent=actions){const b=document.createElement('button');b.type='button';b.className='gd-btn gd-ag-lab-button';b.dataset.agTool=id;b.title=description;b.setAttribute('aria-label',description);const t=document.createElement('span');t.textContent=label;b.append(icon(id),t);b.onclick=fn;parent.append(b);return b}
  const buttons=controls.map(([id,label,desc])=>[id,button(id,label,desc,()=>{tool=id;selection=null;panMode=false;first=null;aligned=null;hand=1;hover=null;guideStep=0;regionPick=[];regionStatus='';notationMode='';notationPick=[];paint()},instruments)]);
  const cornerButton=button('corner','Corner','Change set square corner',()=>{corner=(corner+1)%3;paint()});
  button('flip','Mirror','Mirror across the reference edge',()=>{if(aligned!==null){hand=-hand;paint()}}).dataset.agFlip='1';
  const rotateButton=button('reset','Rotate 180°','Reverse reference edge about anchored vertex',()=>{if(aligned!==null){aligned=mod(aligned+180);paint()}});
  const openingButton=button('compass','Keep opening','Retain the compass opening for transfer to another centre',()=>{if(aperture===null)return;keepOpening=!keepOpening;first=null;aligned=null;hover=null;paint()});openingButton.dataset.agTool='compass-opening';
  const undoButton=button('undo','Undo','Undo last drawing action',()=>{if(history.length){st=labNames(history.pop());if(free)st.allowMovement=motion;selection=null;if(free)st.workspace={...ws};first=null;aligned=null;regionPick=[];changed()}});
  button('reset','Reset','Reset construction',()=>{save();st=labNames(labEmpty(free));if(free)st.allowMovement=motion;selection=null;if(free)st.workspace={...ws};first=null;aligned=null;regionPick=[];aperture=null;keepOpening=false;changed()});
  const expandButton=free?button('expand','Workspace','Choose paper dimensions and grid size',()=>{sheetPanel.hidden=!sheetPanel.hidden;expandButton.setAttribute('aria-expanded',String(!sheetPanel.hidden))}):null;
  if(free)button('trace','Clear traces','Remove recorded paths without changing the drawing',()=>{save();st.traces={};changed()}).dataset.agTool='clear-traces';
  const panButton=free?button('pan','Pan sheet','Move around the sheet without drawing',()=>{panMode=!panMode;first=null;aligned=null;hover=null;paint()}):null;
  const guideButton=button('help',free?'Help / demo':'Tool help','Show instrument instructions',()=>{guideOpen=!guideOpen;guideStep=0;paint()});
  for(const [id,label,get,set] of [['snap','Snap',()=>snap,v=>snap=v],...(free?[['measure','Measurements',()=>measure,v=>{measure=v;st.showMeasurements=v;onChange(clone(st))}]]:[]),...(free?[]:[['grid','Grid',()=>grid,v=>grid=v]])]){
   const l=document.createElement('label');l.className='gd-ag-lab-option';const input=document.createElement('input');input.type='checkbox';input.dataset.agOption=id;input.checked=get();input.onchange=()=>{set(input.checked);paint()};const t=document.createElement('span');t.textContent=label;l.append(input,icon(id),t);options.append(l);
  }
  const movementLabel=document.createElement('label');movementLabel.className='gd-ag-lab-option';const movementInput=document.createElement('input');movementInput.type='checkbox';movementInput.dataset.agOption='movement';movementInput.onchange=()=>{motion=movementInput.checked;st.allowMovement=motion;if(!motion&&['move','trace'].includes(tool))tool='segment';if(motion)tool='move';first=null;aligned=null;hover=null;moving=null;changed()};const movementText=document.createElement('span');movementText.textContent='Allow points to move';movementLabel.append(movementInput,icon('move'),movementText);if(free)options.append(movementLabel);
  const styleBar=document.createElement('div');styleBar.className='gd-ag-lab-helpers';toolbar.append(styleBar);
  const styleText=document.createElement('span');styleText.style.font='600 12px Arial,sans-serif';styleBar.append(styleText);
  const styleButtons=[false,true].map(value=>{const b=document.createElement('button');b.type='button';b.className='gd-btn';b.textContent=value?'Construction':'Normal';b.dataset.agStyle=String(value);b.onclick=()=>{if(!selection)return;const {kind,index}=selection,obj=st[kind][index];if(!obj)return;save();if(kind==='segments'){st.segmentStyles||={};st.segmentStyles[labStyleKey(st,...obj)]=value}else obj.construction=value;changed()};styleBar.append(b);return b});
  const notationBar=document.createElement('div');notationBar.className='gd-ag-lab-helpers';toolbar.append(notationBar);const notationSelect=document.createElement('select');notationSelect.className='gd-select';notationSelect.setAttribute('aria-label','Geometric notation');notationSelect.dataset.agNotation='1';for(const [v,l] of [['','Line notation…'],['equal1','Equal length · one tick'],['equal2','Equal length · two ticks'],['parallel1','Parallel · one arrow'],['parallel2','Parallel · two arrows'],['symmetry','Symmetry axis']]){const o=document.createElement('option');o.value=v;o.textContent=l;notationSelect.append(o)}notationSelect.onchange=()=>{if(selection?.kind!=='segments')return;save();st.notation||={};const k=labStyleKey(st,...st.segments[selection.index]);if(notationSelect.value)st.notation[k]=notationSelect.value;else delete st.notation[k];changed()};notationBar.append(notationSelect);const angleSelect=document.createElement('select');angleSelect.className='gd-select';angleSelect.setAttribute('aria-label','Angle notation');angleSelect.dataset.agAngleNotation='1';for(const [v,l] of [['','Angle notation…'],['angle1','Equal angle · one arc'],['angle2','Equal angle · two arcs'],['right','Right angle'],['remove','Remove angle mark']]){const o=document.createElement('option');o.value=v;o.textContent=l;angleSelect.append(o)}angleSelect.onchange=()=>{notationMode=angleSelect.value;notationPick=[];selection=null;paint()};notationBar.append(angleSelect);
  const visibility=document.createElement('label');visibility.className='gd-ag-lab-option';const visibleInput=document.createElement('input');visibleInput.type='checkbox';visibleInput.checked=st.showConstruction!==false;visibleInput.dataset.agOption='construction';visibleInput.onchange=()=>{save();st.showConstruction=visibleInput.checked;selection=null;changed()};const visibilityText=document.createElement('span');visibilityText.textContent='Construction lines';visibility.append(visibleInput,visibilityText);if(free)options.append(visibility);
  const regionBar=document.createElement('div');regionBar.className='gd-ag-lab-helpers';regionBar.hidden=true;toolbar.append(regionBar);
  const shadeModeButton=document.createElement('button');shadeModeButton.type='button';shadeModeButton.className='gd-btn';shadeModeButton.dataset.agShadeMode='1';shadeModeButton.onclick=()=>{shadeMode=shadeMode==='region'?'vertices':'region';regionPick=[];regionStatus='';paint()};regionBar.append(shadeModeButton);
  const colourButtons=REGION_COLOURS.map((c,i)=>{const b=document.createElement('button');b.type='button';b.className='gd-btn';b.style.cssText='width:34px;min-height:36px;background:'+c+';border:2px solid white';b.setAttribute('aria-label',['Green','Blue','Gold','Purple','Coral'][i]+' region');b.onclick=()=>{regionColour=i;paint()};regionBar.append(b);return b});
  const regionAction=(label,fn)=>{const b=document.createElement('button');b.type='button';b.className='gd-btn';b.textContent=label;b.onclick=fn;regionBar.append(b);return b};
  const applyRegion=regionAction('Shade selected',()=>{if(!validRegion(st.points,regionPick))return;save();st.regions.push({ids:regionPick.slice(),colour:regionColour});regionPick=[];regionStatus='';changed()});
  const clearRegion=regionAction('Clear selection',()=>{regionPick=[];regionStatus='';paint()});
  const removeRegion=regionAction('Remove last region',()=>{if(!st.regions.length)return;save();st.regions.pop();changed()});
  const sheetPanel=document.createElement('div');sheetPanel.hidden=true;sheetPanel.className='gd-ag-sheet-settings';
  let formatInput,orientationInput,widthInput,heightInput,gridInput,sheetStatus,customFields;
  function resizeWorkspace(next){
    if(!free)return false;
    if((next.w<ww||next.h<hh)&&!workspaceFits(st,next.w,next.h)){sheetStatus.textContent='Existing drawing does not fit this sheet. Choose a larger size or undo/erase marks first.';return false}
    ws={...next};ww=ws.w;hh=ws.h;grid=ws.gridMm>0;st.workspace={...ws};sizeCanvas();syncSheet();changed();return true
  }
  function syncSheet(){
    if(!free)return;formatInput.value=ws.format;orientationInput.value=ws.orientation;widthInput.value=ww/4;heightInput.value=hh/4;gridInput.value=ws.gridMm;
    customFields.hidden=ws.format!=='custom';customFields.style.display=ws.format==='custom'?'flex':'none';orientationInput.disabled=ws.format==='custom';sheetStatus.textContent=(ww/4)+' × '+(hh/4)+' mm · '+(grid?ws.gridMm+' mm grid':'Plain paper');expandButton.querySelector('span').textContent='Workspace · '+(ws.format==='custom'?'Custom':ws.format)
  }
  if(free){
    sheetPanel.style.cssText='padding:4px 6px;border-top:1px solid #dce8e4';toolbar.append(sheetPanel);expandButton.setAttribute('aria-expanded','false');
    const row=document.createElement('div');row.className='gd-ag-lab-helpers';row.style.cssText='display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;padding:0;border:0';sheetPanel.append(row);
    const field=(parent,label,values,id)=>{const l=document.createElement('label');l.style.cssText='display:flex;align-items:center;gap:5px;font-size:12px';l.append(label);const input=document.createElement(values?'select':'input');input.className='gd-select';input.style.cssText='min-height:32px;height:32px;padding:3px 7px;font-size:12px';input.dataset.agWorkspace=id;
      if(values)for(const [value,name] of values){const o=document.createElement('option');o.value=value;o.textContent=name;input.append(o)}else{input.type='number';input.min='50';input.max='650';input.step='.5';input.style.width='90px'}l.append(input);parent.append(l);return input};
    formatInput=field(row,'Paper',[['A4','A4'],['A5','A5'],['A3','A3'],['custom','Custom']],'format');
    orientationInput=field(row,'Orientation',[['landscape','Landscape'],['portrait','Portrait']],'orientation');
    gridInput=field(row,'Grid',[['0','Plain'],['5','5 mm'],['10','10 mm'],['20','20 mm']],'grid');
    customFields=document.createElement('div');customFields.className='gd-ag-lab-helpers';customFields.style.cssText='align-items:center;justify-content:center;gap:6px;padding:0;border:0';row.append(customFields);
    widthInput=field(customFields,'Width (mm)',null,'width');heightInput=field(customFields,'Height (mm)',null,'height');
    formatInput.onchange=()=>{customFields.hidden=formatInput.value!=='custom';customFields.style.display=formatInput.value==='custom'?'flex':'none';orientationInput.disabled=formatInput.value==='custom'};
    const apply=document.createElement('button');apply.type='button';apply.className='gd-btn gd-btn--primary';apply.textContent='Apply';apply.style.cssText='min-height:32px;padding:4px 10px;font-size:13px';apply.dataset.agWorkspace='apply';row.append(apply);
    sheetStatus=document.createElement('p');sheetStatus.className='gd-help';sheetStatus.setAttribute('role','status');sheetStatus.style.cssText='margin:3px 0 0;font-size:11px;text-align:center';sheetPanel.append(sheetStatus);
    apply.onclick=()=>{const width=Number(widthInput.value),height=Number(heightInput.value);if(formatInput.value==='custom'&&(!Number.isFinite(width)||!Number.isFinite(height)||width<50||height<50||width>650||height>650)){sheetStatus.textContent='Enter dimensions between 50 and 650 mm.';return}const next={...workspaceSize(formatInput.value,orientationInput.value,width,height),gridMm:Number(gridInput.value)};resizeWorkspace(next)};
    svg.dataset.agFreeWorkspace='1';viewport.addEventListener('tt99-viewport-resize',e=>{const available=Math.max(120,e.detail.h-toolbar.offsetHeight-hint.offsetHeight-45);viewport.style.maxHeight=available+'px'});st.workspace={...ws};syncSheet()
  }
  const angleTool=()=>['protractor','square45','square30'].includes(tool);
  const nearest=(p,skip=-1)=>{const a=st.points.map((q,i)=>({i,d:labDist(q,p)})).filter(x=>x.i!==skip).sort((a,b)=>a.d-b.d)[0];return a&&a.d<=tolerance()?a.i:-1};
  function tolerance(){const m=svg.getScreenCTM();return m?Math.min(42,20/Math.hypot(m.a,m.b)):20}
  const magnetic=(p,exclude=-1)=>labSnap(st,p,tolerance(),snap,exclude);
  function point(p){const hit=magnetic(p);const i=st.points.findIndex(q=>labDist(q,hit.p)<.001);if(i>=0)return i;st.points.push(hit.p.slice());st.names.push(pointName(st.nextName++));return st.points.length-1}
  function changed(){st.showMeasurements=measure;onChange(clone(st));paint()}
  function el(tag,attrs,txt){const x=document.createElementNS(N,tag);for(const [k,v] of Object.entries(attrs))x.setAttribute(k,v);if(txt!=null)x.textContent=txt;svg.append(x);return x}
  function line(a,b,color='#284d46',w=2.5,dash=''){el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:color,'stroke-width':w,'stroke-linecap':'round','stroke-dasharray':dash})}
  function text(p,t,color='#325a50',size=15){el('text',{x:p[0],y:p[1],fill:color,'font-size':size,'font-family':'Arial,sans-serif','text-anchor':'middle','paint-order':'stroke',stroke:'white','stroke-width':3},t)}
  function circle(p,r,stroke,fill='none',dash=''){el('circle',{cx:p[0],cy:p[1],r,stroke,fill,'stroke-width':2,'stroke-dasharray':dash})}
  let dimBoxes=[],dimLines=[],unplaced=[];
  function dim(a,b,value,color='#325a50',outside=null,preview=false){const q=dimensionPlacement(a,b,value,{size:13,offset:17,outside,lines:dimLines,occupied:dimBoxes,bounds:[5,5,ww-5,hh-5]});if(!q){if(!preview){const i=st.points.indexOf(a),j=st.points.indexOf(b);unplaced.push((i>=0&&j>=0?st.names[i]+st.names[j]+': ':'')+value)};return}dimBoxes.push(q.box);el('text',{x:q.p[0],y:q.p[1],fill:color,'font-size':13,'font-family':'Arial,sans-serif','text-anchor':'middle','dominant-baseline':'central',transform:'rotate('+q.angle+' '+q.p.join(' ')+')','data-ag-dimension':'1'},value)}
  function segment(a,b,color='#285c52',outside=null){line(a,b,color,3);if(measure)dim(a,b,(labDist(a,b)/LAB_UNIT).toFixed(1)+' cm',color,outside)}
  // Instrument is anchored to the chosen vertex and aligned to a direction
  // selected by the pupil. The triangle edges, not target angles, determine rays.
  function instrument(o,base){
   if(tool==='protractor'){
    G.instruments.protractor(svg,{x:o[0],y:o[1],radius:170,start:base,direction:hand});
   }else{
    const angles=tool==='square45'?[90,45,45]:[90,30,60],opening=angles[corner],other=angles[(corner+1)%3],r=140*Math.sin(other*D)/Math.sin(angles[(corner+2)%3]*D),v=polar(...o,140,base),w=polar(...o,r,base+hand*opening);
    el('polygon',{points:[o,v,w].map(p=>p.join(',')).join(' '),fill:'#c5e3da','fill-opacity':.65,stroke:'#458778','stroke-width':2});
    if(opening===90){const a=polar(...o,13,base),b=polar(...o,13,base+hand*90);line(a,[a[0]+b[0]-o[0],a[1]+b[1]-o[1]],'#458778',1.5);line(b,[a[0]+b[0]-o[0],a[1]+b[1]-o[1]],'#458778',1.5);}
    // Alternate corner placement: use the acute vertex as well as the right-angle vertex.
    text(polar(...o,30,base+hand*opening/2),opening+'°','#326e61',12);const vb=labAngle(v,o),vw=labAngle(v,w);text(polar(...v,25,vw+mod(vb-vw)/2),other+'°','#326e61',12);const wo=labAngle(w,o),wv=labAngle(w,v);text(polar(...w,25,wo+mod(wv-wo)/2),angles[(corner+2)%3]+'°','#326e61',12);
   }
  }
  function selectedAngle(o,p){
   const a=labAngle(o,p),base=aligned??0,relative=mod(hand*(a-base));
   if(tool==='protractor')return mod(base+hand*Math.round(relative<=180?relative:relative<270?180:0));
   const choices=[0,(tool==='square45'?[90,45,45]:[90,30,60])[corner]];
   // Actual set-square orientation is adjusted below to show the chosen edge.
   const diff=(x,y)=>Math.min(mod(x-y),mod(y-x));return mod(base+hand*choices.reduce((x,y)=>diff(y,relative)<diff(x,relative)?y:x));
  }
  const helpSteps={
   select:['Select Select.','Tap a line, ray or circle.','Choose Normal or Construction to change its style without moving it.'],
   move:['Select Move.','Drag a vertex; connected marks follow it, but equal sides or right angles may be lost.','Compare the altered shape with the original. Use Undo to restore it.'],
   trace:['Select Trace.','Tap an existing point to switch its trace on or off.','Select Move and drag that point to record its path. Clear traces removes paths without altering geometry.'],
   point:['Select Point.','Touch near an endpoint or crossing. The magnetic highlight shows the exact snap position.','Place the point. You can now join other lines to it.'],
   segment:['Select Ruler.','Tap the starting point.','Touch the ending point, slide to refine the length, and release. A straight segment joins the two points.'],
   ray:['Select Ray.','Tap the starting point.','Touch in the direction you want the ray to extend, then release. A dashed construction ray appears.'],
   protractor:['Select Protractor.','Tap the vertex, then tap along the reference line to align the zero edge.','Read the graduations from that edge. Touch the required direction and release to draw the ray.'],
   square45:['Select the 45° set square.','Choose a corner, tap a vertex and align the reference edge. Use Mirror if the instrument faces the wrong way.','Draw along the other edge of the triangle. The tool has two 45° corners and one 90° corner.'],
   square30:['Select the 30°–60° set square.','Choose the appropriate corner, tap a vertex and align the reference edge. Use Mirror if needed.','Draw along the other edge. This instrument has 30°, 60° and 90° corners.'],
   compass:['Select Compass. Tap the centre.','Slide to set the radius using its readout, or snap to an existing point. Release to draw a circle.','Choose Keep opening to transfer the same radius to a new centre. Mark intersections with Point. Use Undo or Erase to correct existing marks.'],
   shade:['Select Shade.','Tap at least three existing vertices in perimeter order.','Choose a colour and apply shading. Use Undo or Remove last region to correct it.'],
   erase:['Select Erase.','Tap the object you want to remove. A point and its attached objects are removed together.','Undo restores the previous construction. Given challenge baselines are protected.']
  };
  function guideGraphic(step){
   // This sample is isolated from pupil work, and is available only in free mode.
   const sample=labEmpty();const A=sample.points[0],B=sample.points[1],C=polar(...A,180,40);
   if(tool==='segment'||tool==='erase'||tool==='point'){
    if(step>=1)sample.points.push(C);
    if((tool==='segment'&&step===2)||tool==='erase'&&step===1)sample.segments.push([0,2]);
    if(tool==='erase'&&step===2)sample.points.pop();
   }else if(tool==='compass'){if(step>=1)sample.circles.push({i:0,r:180});if(step===2){sample.rays.push({i:0,angle:40});sample.points.push(C)}}
   else if(tool==='ray'){if(step>=1)sample.points.push(C);if(step===2)sample.rays.push({i:0,angle:40})}
   else if(step===2)sample.rays.push({i:0,angle:tool==='square45'?45:tool==='square30'?30:40});
   const picture=diagram({type:'diagram',mode:'construct',labDrawing:sample},true);picture.setAttribute('aria-label','Worked example of '+tool);
   picture.style.cssText='width:100%;max-height:230px;display:block';
   if(step>=1&&tool==='segment'){G.instruments.ruler(picture,{x:A[0],y:A[1],width:240,length:6,height:44,tickHeight:23,angle:40,labelSize:11});}
   if(step>=1&&['protractor','square45','square30'].includes(tool)){
    const add=(tag,attrs,content)=>{const e=document.createElementNS(N,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(content!=null)e.textContent=content;picture.append(e);return e};
    if(tool==='protractor'){G.instruments.protractor(picture,{x:A[0],y:A[1],radius:170,start:0});}
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
   regionBar.hidden=tool!=='shade';regionBar.style.display=tool==='shade'?'flex':'none';shadeModeButton.textContent=shadeMode==='region'?'By enclosed region':'By vertices';applyRegion.hidden=clearRegion.hidden=shadeMode!=='vertices';applyRegion.disabled=!validRegion(st.points,regionPick);removeRegion.disabled=!st.regions.length;colourButtons.forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===regionColour));b.style.outline=i===regionColour?'2px solid #263e43':'none'});
   if(panButton){panButton.setAttribute('aria-pressed',String(panMode));panButton.classList.toggle('gd-btn--primary',panMode);svg.style.cursor=panMode?'grab':''}
   openingButton.hidden=tool!=='compass';openingButton.disabled=aperture===null;openingButton.setAttribute('aria-pressed',String(keepOpening));openingButton.querySelector('span').textContent=keepOpening?'Change opening':'Keep opening';
   notationBar.hidden=!(free&&tool==='select');notationBar.style.display=notationBar.hidden?'none':'flex';notationSelect.hidden=selection?.kind!=='segments';notationSelect.value=selection?.kind==='segments'?(st.notation?.[labStyleKey(st,...st.segments[selection.index])]||''):'';angleSelect.value=notationMode;
   const selected=selection&&st[selection.kind]?.[selection.index];styleBar.hidden=!(tool==='select'&&selected);styleBar.style.display=styleBar.hidden?'none':'flex';visibleInput.checked=st.showConstruction!==false;if(selected){styleText.textContent=({segments:'Line',rays:'Ray',circles:'Circle'})[selection.kind]+' style';styleButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(labConstruction(st,selection.kind,selected)===Boolean(i))))}
   paintGuide();cornerButton.hidden=!tool.startsWith('square');const flip=toolbar.querySelector('[data-ag-flip]');flip.hidden=!angleTool()||aligned===null;rotateButton.hidden=flip.hidden;
   movementInput.checked=motion;const clearTrace=toolbar.querySelector('[data-ag-tool="clear-traces"]');if(clearTrace)clearTrace.hidden=!motion;buttons.forEach(([id,b])=>{if(['move','trace'].includes(id))b.hidden=!motion;b.classList.toggle('gd-btn--primary',!panMode&&id===tool);b.setAttribute('aria-pressed',String(!panMode&&id===tool))});undoButton.disabled=history.length===0;
   svg.replaceChildren();dimLines=labLines(st).map(l=>[l.a,l.ray?labAt(l.a,l.v,1200):l.b]);dimBoxes=st.points.map((p,i)=>labelBox(labLabel(st,i),0,st.names[i],13));unplaced=[];el('rect',{width:ww,height:hh,fill:'#fff'});
   if(grid){const step=free?ws.gridMm*4:40;for(let x=free?step:20;x<ww;x+=step)el('line',{x1:x,y1:free?0:22,x2:x,y2:free?hh:hh-18,stroke:'#e1ebe6','stroke-width':1,'data-ag-grid':'1'});for(let y=free?step:22;y<hh;y+=step)el('line',{x1:free?0:20,y1:y,x2:free?ww:ww-20,y2:y,stroke:'#e1ebe6','stroke-width':1,'data-ag-grid':'1'})}
   if(free)for(const trail of Object.values(st.traces||{}))for(const points of traceParts(trail)){el('polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#b56d2c','stroke-width':2,'stroke-dasharray':'4 3','data-ag-trace':'1'})}
   for(const region of labRegionShapes(st)){const attrs={fill:REGION_COLOURS[region.colour]||REGION_COLOURS[0],'fill-opacity':.32,stroke:'none','data-ag-region':'1'};if(region.circle)el('circle',{...attrs,cx:region.circle.p[0],cy:region.circle.p[1],r:region.circle.r});else if(region.path)el('path',{...attrs,d:region.path,'fill-rule':'evenodd'});else el('polygon',{...attrs,points:region.points.map(p=>p.join(',')).join(' ')})}
   if(tool==='shade'&&regionPick.length>=2)el('polygon',{points:regionPick.map(i=>st.points[i].join(',')).join(' '),fill:validRegion(st.points,regionPick)?REGION_COLOURS[regionColour]:'none','fill-opacity':.15,stroke:REGION_COLOURS[regionColour],'stroke-width':2,'stroke-dasharray':'5 4'});
   for(const [k,c] of st.circles.entries())if(labVisible(st,'circles',c)){const cons=labConstruction(st,'circles',c);circle(st.points[c.i],c.r,selection?.kind==='circles'&&selection.index===k?'#b45309':cons?'#a97830':'#285c52','none',cons?'5 4':'')}
   for(const [k,r] of st.rays.entries())if(labVisible(st,'rays',r)){const cons=labConstruction(st,'rays',r);line(st.points[r.i],polar(...st.points[r.i],1200,labRayAngle(st,r)),selection?.kind==='rays'&&selection.index===k?'#b45309':'#63978a',cons?1.8:3,cons?'7 5':'')}
   if(st.given!==false&&st.points.length>=2){line(st.points[0],st.points[1],'#283f3a',4);dim(st.points[0],st.points[1],'6 cm','#325a50',[460,360])}
   for(const [k,edge] of st.segments.entries()){if(!labVisible(st,'segments',edge))continue;const [i,j]=edge,cons=labConstruction(st,'segments',edge),color=selection?.kind==='segments'&&selection.index===k?'#b45309':cons?'#a97830':'#285c52';if(cons)line(st.points[i],st.points[j],color,1.8,'5 4');else segment(st.points[i],st.points[j],color,labOutside(st,i,j))}
   labNotation(st,(d,k)=>el('path',{d,fill:'none',stroke:'#287f6c','stroke-width':1.8,'stroke-dasharray':k==='symmetry'?'8 4 2 4':'','data-ag-notation':k}));
   labAngleGraphics(st,(d,p,v)=>{el('path',{d,fill:'none',stroke:'#287f6c','stroke-width':1.8,'data-ag-angle-mark':'1'});el('text',{x:p[0],y:p[1],fill:'#325a50','font-size':12,'text-anchor':'middle','dominant-baseline':'central','paint-order':'stroke',stroke:'#fff','stroke-width':3,'data-ag-angle-value':'1'},v)});
    if(angleTool()&&first!==null&&aligned!==null)instrument(st.points[first],aligned);
   if(hover){const hit=magnetic(hover),p=hit.p;
    if(tool==='compass'&&keepOpening&&aperture!==null&&first===null){circle(p,aperture,'#b77b32');circle(p,4,'#b77b32','#fff')}
    if(first!==null){const a=st.points[first];
     if(angleTool()&&aligned!==null){const v=selectedAngle(a,p);line(a,polar(...a,190,v),'#b77b32',3);{const sweep=mod(hand*(v-aligned)),value=Math.round(sweep)+'°';const q=angleLabelPlacement(a,38,aligned,hand*sweep,value,13,65);text(q.p,value,'#996221',q.size)}}
     else if(tool==='compass'){const r=labDist(a,p);if(r>1){circle(a,r,'#b77b32');line(a,p,'#b77b32',1.5);dim(a,p,'r = '+(r/LAB_UNIT).toFixed(1)+' cm','#996221',null,true)}}
     else if(tool==='segment'){const len=labDist(a,p);if(len>1){const cm=30;G.instruments.ruler(svg,{x:a[0],y:a[1],width:cm*40,length:cm,height:44,tickHeight:23,angle:labAngle(a,p),labelSize:11});line(a,p,'#b77b32',2,'5 4');if(measure)dim(a,p,(len/40).toFixed(1)+' cm','#996221',polar(...a,70,labAngle(a,p)+90),true)}}else if(tool==='ray'||angleTool())line(a,p,'#b77b32',2,'5 4');
    }
    if(hit.kind){circle(p,12,'#2e9982','#d5eee5');circle(p,3,'#2e9982','#2e9982');text([p[0],p[1]-18],hit.kind,'#287b69',12)}
   }
   st.points.forEach((p,i)=>{if(motion&&st.traceNames?.includes(st.names[i]))circle(p,10,'#b56d2c','none');if(regionPick.includes(i))circle(p,11,REGION_COLOURS[regionColour],'none');circle(p,i===first?6:4,'white',st.given!==false&&i<2?'#28413d':'#287f6c');const pos=labLabel(st,i);el('text',{x:pos[0],y:pos[1],fill:'#325a50','font-size':13,'text-anchor':'middle','dominant-baseline':'central','paint-order':'stroke',stroke:'#fff','stroke-width':3,'data-ag-point-label':st.names[i]},st.names[i])});
   hint.textContent=panMode?'Drag to move around the sheet. Select an instrument to resume drawing.':tool==='move'?'Drag a vertex freely. Its connected geometry will follow.':tool==='trace'?'Tap a point to toggle tracing, then select Move.':tool==='select'?(notationMode?'Tap three points in order: arm, vertex, arm. '+notationPick.map(i=>st.names[i]).join(' → '):'Select a line for style or notation, or choose angle notation.'):tool==='shade'?(regionStatus||(shadeMode==='region'?'Tap inside a closed contour to shade or unshade.':'Tap vertices in perimeter order. ')+regionPick.map(i=>st.names[i]).join(' → ')+(regionPick.length>=3&&!validRegion(st.points,regionPick)?' · Invalid or crossing region.':'')):angleTool()?(first===null?'Tap a vertex to place the instrument.':aligned===null?'Tap along the reference edge to align the instrument.':'Choose a direction on the instrument to draw a ray.'):tool==='compass'?(keepOpening?'Radius: '+(aperture/LAB_UNIT).toFixed(1)+' cm · Tap a new centre to transfer the opening.':first===null?'Tap the centre of the circle.':hover?'Radius: '+(labDist(st.points[first],magnetic(hover).p)/LAB_UNIT).toFixed(1)+' cm · Release to draw.':'Touch and slide to set the radius.'):tool==='point'?'Tap a point or a highlighted intersection.':tool==='erase'?'Tap a drawn point, line or circle to erase.':first===null?'Tap the starting point.':'Touch, slide to refine, then release to place.';
   if(unplaced.length)hint.textContent+=' · Measurements in crowded areas: '+unplaced.join(', ');
   hint.textContent+=motion?' · Free exploration: no geometric constraints are applied.':' · Drawn marks are fixed. Use Undo or Erase to correct them.';
  }
  function coords(e){const m=svg.getScreenCTM();if(!m)return null;return new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse())}
  let placing=null;
  svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;if(panMode&&viewport){e.preventDefault();sheetPan={id:e.pointerId,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};try{svg.setPointerCapture(e.pointerId)}catch(_){}return}const z=coords(e);if(!z)return;const p=[z.x,z.y];e.preventDefault();hover=p;
   if(first!==null&&!['erase','point','move','trace'].includes(tool)){placing=e.pointerId;try{svg.setPointerCapture(e.pointerId)}catch(_){}paint();return}
   place(p,e);
  });
  function place(p,e){
   if(tool==='select'){if(notationMode){const i=nearest(p);if(i<0||notationPick.includes(i))return;notationPick.push(i);if(notationPick.length===3){const names=notationPick.map(i=>st.names[i]);save();st.angleNotation||=[];st.angleNotation=st.angleNotation.filter(m=>!(m.names[1]===names[1]&&m.names.includes(names[0])&&m.names.includes(names[2])));if(notationMode!=='remove')st.angleNotation.push({names,kind:notationMode});notationPick=[];changed()}else paint();return}const dist=(a,b,ray=false)=>{const v=labSub(b,a),t=labDot(labSub(p,a),v)/(labDot(v,v)||1);return labDist(p,labAt(a,v,Math.max(0,ray?t:Math.min(1,t))))};const hits=[];for(const [kind,items] of [['segments',st.segments],['rays',st.rays],['circles',st.circles]])items.forEach((obj,index)=>{if(!labVisible(st,kind,obj))return;const d=kind==='segments'?dist(st.points[obj[0]],st.points[obj[1]]):kind==='rays'?dist(st.points[obj.i],polar(...st.points[obj.i],1,labRayAngle(st,obj)),true):Math.abs(labDist(p,st.points[obj.i])-obj.r);if(d<=tolerance())hits.push({kind,index,d})});selection=hits.sort((a,b)=>a.d-b.d)[0]||null;paint();return}
   if(motion&&tool==='trace'){const i=nearest(p);if(i>=0){save();const name=st.names[i];traceToggle(st,name);changed()}return}
   if(motion&&tool==='move'){const i=nearest(p);if(i>=0){save();moving={i,id:e.pointerId};try{svg.setPointerCapture(e.pointerId)}catch(_){}}return}
   if(tool==='shade'){if(shadeMode==='region'){const face=labFaceAt(st,p);if(face){const old=st.regions.findIndex(r=>r.seed&&labInFace(face,r.seed));save();if(old>=0)st.regions.splice(old,1);else st.regions.push({seed:p.slice(),faceKey:face.key,colour:regionColour});regionStatus='';changed();return}const c=st.circles.filter(c=>labVisible(st,'circles',c)&&labDist(st.points[c.i],p)<c.r).sort((a,b)=>a.r-b.r)[0];if(c){const key={name:st.names[c.i],radius:c.r},old=st.regions.findIndex(r=>r.circle?.name===key.name&&r.circle?.radius===key.radius);save();if(old>=0)st.regions.splice(old,1);else st.regions.push({circle:key,colour:regionColour});regionStatus='';changed();return}regionStatus='No closed region here. Draw a closed boundary or use vertices.';paint();return}const i=nearest(p);if(i>=0){regionPick=regionPick.includes(i)?regionPick.filter(j=>j!==i):[...regionPick,i];regionStatus='';paint()}return}
   if(tool==='erase'){const i=nearest(p);if(i>=(st.given===false?0:2)){save();const removed=st.names[i];if(st.traces)delete st.traces[removed];if(st.traceNames)st.traceNames=st.traceNames.filter(n=>n!==removed);st.points.splice(i,1);st.names.splice(i,1);st.regions=st.regions.filter(r=>!r.ids?.includes(i)&&r.circle?.name!==removed).map(r=>r.ids?({...r,ids:r.ids.map(j=>j>i?j-1:j)}):r);regionPick=[];st.segments=st.segments.filter(l=>!l.includes(i)).map(l=>l.map(j=>j>i?j-1:j));for(const k of ['rays','circles'])st[k]=st[k].filter(r=>r.i!==i).map(r=>({...r,i:r.i>i?r.i-1:r.i}));changed();return}
    const distanceTo=(a,b,ray=false)=>{const v=labSub(b,a),t=labDot(labSub(p,a),v)/(labDot(v,v)||1);return labDist(p,labAt(a,v,Math.max(0,ray?t:Math.min(1,t))))};
    let k=st.segments.findIndex(([i,j])=>distanceTo(st.points[i],st.points[j])<tolerance());if(k>=0){save();st.segments.splice(k,1)}else{k=st.rays.findIndex(r=>distanceTo(st.points[r.i],polar(...st.points[r.i],1,labRayAngle(st,r)),true)<tolerance());if(k>=0){save();st.rays.splice(k,1)}else{k=st.circles.findIndex(c=>Math.abs(labDist(p,st.points[c.i])-c.r)<tolerance());if(k>=0){save();st.circles.splice(k,1)}}}changed();return;
   }
   if(tool==='point'){save();point(p);changed();return}
   if(tool==='compass'&&keepOpening&&aperture!==null){save();const i=point(p);if(!st.circles.some(c=>c.i===i&&Math.abs(c.r-aperture)<1e-7))st.circles.push({i,r:aperture});hover=null;changed();return}
   if(first===null){save();first=point(p);changed();return}
   const o=st.points[first];if(labDist(o,p)<8)return;
   if(angleTool()&&aligned===null){const target=magnetic(p).p;reference=target.slice();aligned=labAngle(o,target);paint();return}
   save();
   if(tool==='segment'){const j=point(p);if(j!==first&&!st.segments.some(l=>l.includes(first)&&l.includes(j)))st.segments.push([first,j])}
   else if(tool==='compass'){const r=labDist(o,magnetic(p).p);if(r>0){aperture=r;st.circles.push({i:first,r})}}
   else if(tool==='ray'||angleTool()){const a=angleTool()?selectedAngle(o,p):Math.round(labAngle(o,magnetic(p).p));if(angleTool()){const distance=reference?labDist(o,reference):120;const target=polar(...o,Math.max(8,distance),aligned),j=point(target);if(j!==first){const base=labAngle(o,st.points[j]),relative=mod(a-base),given=st.given!==false&&[first,j].sort().join(':')==='0:1';if(!given&&!st.segments.some(l=>l.includes(first)&&l.includes(j))){st.segments.push([first,j]);st.segmentStyles||={};st.segmentStyles[labStyleKey(st,first,j)]=true}st.rays.push({i:first,angle:a,relativeTo:st.names[j],relativeAngle:relative,mark:{base:st.names[j],hand}})}else st.rays.push({i:first,angle:a})}else st.rays.push({i:first,angle:a})}
   first=null;aligned=null;hover=null;changed();
  }
  svg.addEventListener('pointermove',e=>{if(panMode&&viewport){if(sheetPan?.id===e.pointerId){viewport.scrollLeft=sheetPan.left+sheetPan.x-e.clientX;viewport.scrollTop=sheetPan.top+sheetPan.y-e.clientY}return}const z=coords(e);if(!z)return;hover=[z.x,z.y];if(motion&&moving?.id===e.pointerId){const p=[Math.max(5,Math.min(ww-5,z.x)),Math.max(5,Math.min(hh-5,z.y))],i=moving.i,name=st.names[i],old=st.points[i];traceAdd(st,name,p,old);st.points[i]=p;changed()}else paint()});
  svg.addEventListener('pointerup',e=>{if(sheetPan?.id===e.pointerId){sheetPan=null;return}if(placing===e.pointerId){placing=null;const z=coords(e);if(z)place([z.x,z.y],e)}moving=null;paint()});
  const cancel=()=>{placing=null;moving=null;sheetPan=null;hover=null;paint()};svg.addEventListener('pointercancel',cancel);svg.addEventListener('lostpointercapture',cancel);
  paint();
 }


 // Optional investigation tools: measurements come from the rendered
 // polygon coordinates, never from its answer or named shape family.
 const inspectTypes=['right-count','triangle-type','quad-type','regularity','diagonal-equal','diagonal-bisect','diagonal-perpendicular','parallel-count','shape-family','side-count'];
 function mountInvestigation(box,svg){
  const outline=svg.querySelector('[data-ag-inspect-polygon]');if(!outline)return;
  const points=outline.getAttribute('points').trim().split(/\s+/).map(v=>v.split(',').map(Number));
  if(points.length<3)return;
  for(const p of svg.querySelectorAll('[data-ag-inspect-point]')){const pos=[Number(p.getAttribute('cx')),Number(p.getAttribute('cy'))];if(pos.every(Number.isFinite)&&!points.some(q=>labDist(q,pos)<.001))points.push(pos)}
  const N='http://www.w3.org/2000/svg',bar=document.createElement('div');bar.className='gd-ag-inspect-tools';
  const message=document.createElement('span');message.className='gd-ag-inspect-message';message.setAttribute('role','status');
  const layer=document.createElementNS(N,'g');layer.setAttribute('data-ag-inspection','1');layer.setAttribute('pointer-events','none');svg.append(layer);
  let tool='',selected=[],hover=-1;
  const icons={ruler:'<rect x="3" y="8" width="18" height="8" rx="1"/><path d="M7 8v4m4-4v2m4-2v4m4-4v2"/>',angle:'<path d="M2 17a10 10 0 0 1 20 0Z M12 7v4M5 10l3 3M19 10l-3 3"/>',clear:'<path d="M6 6l12 12M18 6L6 18"/>'};
  function button(id,label){const b=document.createElement('button');b.type='button';b.className='gd-btn gd-ag-inspect-btn';b.dataset.agInspect=id;b.setAttribute('aria-pressed','false');b.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[id]+'</svg><span>'+label+'</span>';b.onclick=()=>{tool=id==='clear'||tool===id?'':id;selected=[];hover=-1;paint()};bar.append(b);return b}
  const rb=button('ruler','Ruler'),ab=button('angle','Protractor');button('clear','Clear');bar.append(message);box.insertBefore(bar,svg);
  function el(tag,attrs,content){const e=document.createElementNS(N,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(content!=null)e.textContent=content;layer.append(e);return e}
  function line(a,b,stroke='#14796b',w=2,extra={}){return el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke,'stroke-width':w,...extra})}
  function mark(p,r,fill){el('circle',{cx:p[0],cy:p[1],r,fill,stroke:'#177d6f','stroke-width':2})}
  function paint(){
   layer.replaceChildren();for(const [id,b] of [['ruler',rb],['angle',ab]]){b.classList.toggle('gd-btn--primary',tool===id);b.setAttribute('aria-pressed',String(tool===id))}
   svg.style.touchAction=tool?'none':'auto';message.textContent=tool==='ruler'?'Tap two labelled points to compare lengths (diagram units).':tool==='angle'?'Tap the vertex or intersection, then one point on each arm.':'Optional: investigate the shape before answering.';
   if(!tool)return;
   points.forEach((p,i)=>mark(p,i===hover?10:5,selected.includes(i)?'#e3af53':i===hover?'#d0eee4':'white'));
   if(tool==='ruler'&&selected.length===2){
    const [a,b]=selected.map(i=>points[i]),len=labDist(a,b),v=labSub(b,a).map(x=>x/len),normal=[-v[1],v[0]],center=points.reduce((r,p)=>[r[0]+p[0]/points.length,r[1]+p[1]/points.length],[0,0]);if(labDot(labSub(center,a),normal)<0){normal[0]*=-1;normal[1]*=-1}
    const angle=labAngle(a,b),side=labDot(normal,[-v[1],v[0]])>=0?1:-1,cm=20;G.instruments.ruler(layer,{x:a[0],y:a[1],width:cm*40,length:cm,height:44,tickHeight:23,angle,side,labelSize:11,unitLabel:false});
    line(a,b,'#177d6f',3);message.textContent='Length: '+(len/40).toFixed(2)+' diagram units. Tap two more points to compare.';
   }else if(tool==='angle'&&selected.length>=2){
    const o=points[selected[0]],a=points[selected[1]],base=labAngle(o,a),b=selected.length===3?points[selected[2]]:null,delta=b?mod(labAngle(o,b)-base):0,sign=b&&delta>180?-1:1,deg=Math.min(delta,360-delta),radius=155;
    G.instruments.protractor(layer,{x:o[0],y:o[1],radius,start:base,direction:sign});
    line(o,polar(...o,radius,base),'#397b70',2);if(b){line(o,polar(...o,radius,base+sign*deg),'#b77b32',3);message.textContent='Measured angle: '+Math.round(deg)+'°. Tap a new corner to measure another.'}else message.textContent='Tap a point on the second arm.';
   }else if(selected.length===1)message.textContent=tool==='ruler'?'Tap the other endpoint.':'Tap a point on the first arm.';
  }
  function hit(e){const m=svg.getScreenCTM();if(!m)return -1;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse()),tol=Math.min(65,28/Math.hypot(m.a,m.b));let best=-1,dist=tol;points.forEach((q,i)=>{const d=labDist(q,[p.x,p.y]);if(d<dist){best=i;dist=d}});return best}
  svg.addEventListener('pointermove',e=>{if(!tool)return;const i=hit(e);if(i!==hover){hover=i;paint()}});
  svg.addEventListener('pointerdown',e=>{if(!tool||e.button!==0)return;const i=hit(e);if(i<0)return;e.preventDefault();if(selected.length===(tool==='ruler'?2:3))selected=[];if(!selected.includes(i))selected.push(i);hover=i;paint()});
  paint();
 }


 // Independent measurement: the pupil places and aligns the same instrument
 // used in the explorer. No computed answer or target angle is displayed.
 function mountAngleMeasurement(box,svg,d){
  const N='http://www.w3.org/2000/svg',vertex=[400,220],rays=[mod(d.rotation||0),mod((d.rotation||0)+d.angle)],radius=208;
  let active=false,centre=null,start=0,aligned=false,full=false,direction=1,drag=null,preview=null;
  const bar=document.createElement('div');bar.className='gd-ag-inspect-tools';
  const message=document.createElement('span');message.className='gd-ag-inspect-message';message.setAttribute('role','status');
  const layer=document.createElementNS(N,'g');layer.setAttribute('data-ag-measure-overlay','1');layer.setAttribute('pointer-events','none');svg.append(layer);
  function button(id,label,fn){const b=document.createElement('button');b.type='button';b.className='gd-btn gd-ag-inspect-btn';b.dataset.agMeasure=id;const glyphs={show:'<path d="M2 17a10 10 0 0 1 20 0Z M12 7v4M5 10l3 3M19 10l-3 3"/>',format:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v3M12 18v3"/>',flip:'<path d="M3 18l7-12v12ZM21 18L14 6v12ZM12 3v2m0 4v2m0 4v2m0 4v1"/>',left:'<path d="M8 5L3 10l5 5M3 10h11a6 6 0 0 1 0 12"/>',right:'<path d="m16 5 5 5-5 5m5-5H10a6 6 0 0 0 0 12"/>',reset:'<path d="M3 11a9 9 0 1 1 2.5 7M3 4v7h7"/>'};b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+glyphs[id]+'</svg><span></span>';b.querySelector('span').textContent=label;b.onclick=fn;bar.append(b);return b}
  const show=button('show','Protractor',()=>{active=!active;if(!active){centre=null;aligned=false;preview=null}paint()});
  const format=button('format','360° protractor',()=>{full=!full;paint()});
  const flip=button('flip','Flip',()=>{direction*=-1;paint()});
  const left=button('left','−1°',()=>{start=mod(start-1);aligned=true;paint()});
  const right=button('right','+1°',()=>{start=mod(start+1);aligned=true;paint()});
  const reset=button('reset','Reset',()=>{centre=null;aligned=false;start=0;direction=1;preview=null;paint()});
  bar.append(message);box.insertBefore(bar,svg);
  function el(tag,attrs){const n=document.createElementNS(N,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));layer.append(n);return n}
  function point(e){const m=svg.getScreenCTM();if(!m)return null;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());return [p.x,p.y]}
  function tol(){const m=svg.getScreenCTM();return m?Math.min(60,26/Math.hypot(m.a,m.b)):25}
  function snapCentre(p){return labDist(vertex,p)<=tol()?vertex.slice():p}
  function orientation(p){const a=labAngle(centre,p),delta=(u,v)=>Math.min(mod(u-v),mod(v-u));const nearest=rays.reduce((u,v)=>delta(u,a)<=delta(v,a)?u:v);return labDist(centre,vertex)<.01&&delta(nearest,a)<=5?nearest:mod(Math.round(a))}
  function paint(){
   layer.replaceChildren();show.setAttribute('aria-pressed',String(active));show.classList.toggle('gd-btn--primary',active);
   for(const b of [format,flip,left,right,reset])b.hidden=!active;
   for(const b of [flip,left,right])b.disabled=!centre;
   format.querySelector('span').textContent=full?'180° protractor':'360° protractor';flip.hidden=!active||full;
   svg.style.touchAction=active?'none':'auto';
   message.textContent=!active?'Select the protractor when you are ready to measure.':!centre?'Tap the angle vertex to position the centre.':!aligned?'Tap or slide along an arm to align the zero line.':'Read the correct scale. Drag a graduation to realign, or drag the centre to reposition.';
   if(!active)return;
   if(!centre&&preview&&labDist(preview,vertex)<=tol())el('circle',{cx:vertex[0],cy:vertex[1],r:12,fill:'#c5e3da',stroke:'#287c70','stroke-width':2});
   if(!centre)return;
   G.instruments.protractor(layer,{x:centre[0],y:centre[1],radius,start,direction,full});
   const zero=polar(...centre,radius,start);
   el('line',{x1:centre[0],y1:centre[1],x2:zero[0],y2:zero[1],stroke:'#b77b32','stroke-width':2.5});
   el('circle',{cx:centre[0],cy:centre[1],r:7,fill:'#fff',stroke:'#287c70','stroke-width':2});
   el('circle',{cx:zero[0],cy:zero[1],r:8,fill:'#e4b56a',stroke:'#fff','stroke-width':2});
  }
  svg.addEventListener('pointerdown',e=>{
   if(!active||e.button!==0)return;const p=point(e);if(!p)return;e.preventDefault();
   if(!centre){centre=snapCentre(p);aligned=false;preview=null;paint();return}
   drag={id:e.pointerId,kind:labDist(p,centre)<=tol()?'centre':'rotate'};
   if(drag.kind==='rotate'&&labDist(p,centre)>10){start=orientation(p);aligned=true}
   try{svg.setPointerCapture(e.pointerId)}catch(_){}paint();
  });
  svg.addEventListener('pointermove',e=>{
   if(!active)return;const p=point(e);if(!p)return;
   if(!centre){preview=p;paint();return}
   if(!drag||drag.id!==e.pointerId)return;e.preventDefault();
   if(drag.kind==='centre')centre=snapCentre(p);else if(labDist(p,centre)>10){start=orientation(p);aligned=true}paint();
  });
  const finish=e=>{if(drag?.id===e.pointerId)drag=null};svg.addEventListener('pointerup',finish);svg.addEventListener('pointercancel',finish);svg.addEventListener('lostpointercapture',finish);
  paint();
 }


 function mountPolygonRegions(box,svg,d,onChange){
   const outline=svg.querySelector('[data-ag-region-points]');if(!outline)return;
   const points=JSON.parse(outline.getAttribute('data-ag-region-points')),names=JSON.parse(outline.getAttribute('data-ag-region-names')),key=polygonRegionKey(d),N='http://www.w3.org/2000/svg';
   let active=false,selected=[],colour=0,regions=(d.regionsByShape?.[key]||[]).slice();
   const bar=document.createElement('div');bar.className='gd-ag-inspect-tools';
   const toggle=document.createElement('button');toggle.type='button';toggle.className='gd-btn';toggle.textContent='Shade regions';toggle.dataset.agPolygonShade='1';bar.append(toggle);
   const actions=document.createElement('div');actions.className='gd-ag-lab-helpers';bar.append(actions);
   const status=document.createElement('span');status.className='gd-ag-inspect-message';status.setAttribute('role','status');bar.append(status);box.insertBefore(bar,svg);
   const layer=document.createElementNS(N,'g');layer.setAttribute('pointer-events','none');svg.append(layer);
   const colours=REGION_COLOURS.map((c,i)=>{const b=document.createElement('button');b.type='button';b.className='gd-btn';b.style.cssText='width:32px;min-height:34px;background:'+c+';border:2px solid white';b.setAttribute('aria-label',['Green','Blue','Gold','Purple','Coral'][i]+' region');b.onclick=()=>{colour=i;paint()};actions.append(b);return b});
   function action(label,fn){const b=document.createElement('button');b.type='button';b.className='gd-btn';b.textContent=label;b.onclick=fn;actions.append(b);return b}
   const apply=action('Shade selected',()=>{if(!validRegion(points,selected))return;regions.push({ids:selected.slice(),colour});selected=[];commit()});
   const undo=action('Remove last',()=>{regions.pop();commit()});
   action('Clear regions',()=>{regions=[];selected=[];commit()});
   function el(tag,attrs){const node=document.createElementNS(N,tag);Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,String(v)));layer.append(node);return node}
   function commit(){
     d.regionsByShape={...(d.regionsByShape||{}),[key]:regions.slice()};onChange(d.regionsByShape);
     svg.querySelectorAll('[data-ag-region]').forEach(e=>e.remove());let previous=outline;
     for(const region of regions){if(!validRegion(points,region.ids))continue;const node=el('polygon',{points:region.ids.map(i=>points[i].join(',')).join(' '),fill:REGION_COLOURS[region.colour],'fill-opacity':.28,stroke:'none','data-ag-region':'1'});previous.after(node);previous=node}
     paint()
   }
   function paint(){
     layer.replaceChildren();toggle.setAttribute('aria-pressed',String(active));toggle.classList.toggle('gd-btn--primary',active);actions.style.display=active?'flex':'none';status.textContent=!active?'':selected.length>=3&&!validRegion(points,selected)?'Invalid region. Choose vertices in perimeter order.':'Tap vertices in perimeter order: '+selected.map(i=>names[i]).join(' → ');
     colours.forEach((b,i)=>{b.style.outline=i===colour?'2px solid #263e43':'none';b.setAttribute('aria-pressed',String(i===colour))});apply.disabled=!validRegion(points,selected);undo.disabled=!regions.length;svg.style.touchAction=active?'none':'auto';
     if(!active)return;
     if(selected.length>=2)el('polygon',{points:selected.map(i=>points[i].join(',')).join(' '),fill:'none',stroke:REGION_COLOURS[colour],'stroke-width':2,'stroke-dasharray':'5 4'});
     points.forEach((p,i)=>{el('circle',{cx:p[0],cy:p[1],r:selected.includes(i)?10:6,fill:selected.includes(i)?REGION_COLOURS[colour]:'white','fill-opacity':.8,stroke:REGION_COLOURS[colour],'stroke-width':2})})
   }
   toggle.onclick=()=>{active=!active;selected=[];paint()};
   svg.addEventListener('pointerdown',e=>{if(!active||e.button!==0)return;const m=svg.getScreenCTM();if(!m)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());let nearest=-1,dist=Math.min(45,25/Math.hypot(m.a,m.b));points.forEach((q,i)=>{const l=labDist(q,[p.x,p.y]);if(l<dist){nearest=i;dist=l}});if(nearest<0)return;e.preventDefault();selected=selected.includes(nearest)?selected.filter(i=>i!==nearest):[...selected,nearest];paint()});
   paint();
 }


 function mountLoci(box,initial,onChange){
   let st=JSON.parse(JSON.stringify(initial||locusInitial())),drag=null,selecting=false;
   const bar=document.createElement('div');bar.className='gd-ag-inspect-tools';
   const choice=document.createElement('select');choice.className='gd-select';choice.setAttribute('aria-label','Locus relationship');choice.dataset.agLocusPreset='1';
   for(const [value,label] of [['circle','Fixed distance from a point'],['bisector','Equal distance from two points']]){const o=document.createElement('option');o.value=value;o.textContent=label;choice.append(o)}choice.value=st.kind;bar.append(choice);
   const button=(id,label,fn)=>{const b=document.createElement('button');b.type='button';b.className='gd-btn';b.dataset.agLocusAction=id;b.textContent=label;b.onclick=fn;bar.append(b);return b};
   const trace=button('trace','Select trace point',()=>{selecting=!selecting;paint()});
   const mid=button('midpoint','Show midpoint M',()=>{st.showMidpoint=!st.showMidpoint;changed()});
   const guide=button('guide','Reveal locus',()=>{st.showLocus=!st.showLocus;changed()});
   button('clear','Clear traces',()=>{st.traces={};changed()});
   button('reset','Reset',()=>{st=locusInitial(st.kind);selecting=false;changed()});
   const hint=document.createElement('span');hint.className='gd-ag-inspect-message';hint.setAttribute('role','status');bar.append(hint);
   const surface=document.createElement('div');surface.style.cssText='touch-action:none;width:100%';box.replaceChildren(bar,surface);
   choice.onchange=()=>{st=locusInitial(choice.value);selecting=false;changed()};
   function changed(){onChange(JSON.parse(JSON.stringify(st)));paint()}
   function paint(){
     trace.setAttribute('aria-pressed',String(selecting));trace.classList.toggle('gd-btn--primary',selecting);
     mid.textContent=st.showMidpoint?'Hide midpoint M':'Show midpoint M';guide.textContent=st.showLocus?'Hide locus guide':'Reveal locus';
     hint.textContent=selecting?'Tap P or M to toggle its trace.':('Drag P to investigate. Tracing: '+(st.traceNames?.join(', ')||'off')+'.');
     const svg=diagram({type:'diagram',mode:'loci',locusState:st});svg.style.cssText='width:100%;height:auto;max-height:600px;display:block';surface.replaceChildren(svg)
   }
   function locate(e){const svg=surface.querySelector('svg'),m=svg?.getScreenCTM();if(!m)return null;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());return {p:[p.x,p.y],tol:Math.min(45,28/Math.hypot(m.a,m.b))}}
   surface.addEventListener('pointerdown',e=>{if(e.button!==0)return;const hit=locate(e);if(!hit)return;const pts=locusPoints(st);
     if(selecting){const name=['P',...(st.showMidpoint||st.traceNames?.includes('M')||st.traces?.M?.length?['M']:[])].find(n=>labDist(hit.p,pts[n])<=hit.tol);if(name){traceToggle(st,name);changed()}return}
     if(labDist(hit.p,pts.P)>hit.tol)return;e.preventDefault();drag=e.pointerId;try{surface.setPointerCapture(e.pointerId)}catch(_){}
   });
   surface.addEventListener('pointermove',e=>{if(drag!==e.pointerId)return;const hit=locate(e);if(!hit)return;e.preventDefault();const old=locusPoints(st);st.p=locusProject(st.kind,hit.p,old.P);const next=locusPoints(st);for(const n of ['P','M'])traceAdd(st,n,next[n],old[n]);changed()});
   const finish=e=>{if(drag===e.pointerId)drag=null};for(const t of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(t,finish);
   paint();
 }

G.anglesTool=function(){
 let cfg=settings(),demo={type:'diagram',mode:'angle',angle:60,rotation:0,scale:true,clockwise:false,n:5,regular:true,length:5,baseLength:6},task=null,workflow='build',attempt=null,attemptLength=null,scope='',status='',draft=null,lab=null,freeLab=null,motionLab=null,locusState=null;
 const snapshot=()=>({...cfg,demo:demoData(),task,workflow,attempt,attemptLength,scope,lab,freeLab,motionLab,locusState,pupil:CK.capturePupil(task)});
 const select=(id,opts,current)=>'<select class="gd-select" id="'+id+'">'+opts.map(([v,l])=>'<option value="'+esc(v)+'"'+(String(v)===String(current)?' selected':'')+'>'+esc(l)+'</option>').join('')+'</select>';
 const report=s=>{status=s;const el=q('#ag-status');if(el)el.textContent=s};
 function launch(type){try{const native=CK.nativeScope('ag');if(native)scope=native;const actual=type==='all'?pick(Math.random,types(cfg)).id:type;task=CK.normalise({...generate({...cfg,type:actual}),mode:'standard',answerMode:'manual',revealed:false});task.geometryMode=FAMILIES.find(t=>t[0]===actual)[2];attempt=null;attemptLength=null;lab=null;scope=CK.nativeScope('ag')||scope;workflow='challenge';render()}catch(e){report(e.message)}}
 // CK reserves mode for standard/custom; restore the geometry display mode for drawing/export.
 function geometryTask(t){return t?{...t,mode:t.geometryMode||FAMILIES.find(f=>f[0]===t.type)?.[2]||t.mode}:null}
 function exportRecord(){return {tool:ID,kind:task?'challenge':'diagram',data:task?{...geometryTask(task),revealed:false}:demoData()}}
 async function exportAction(kind){try{const teacher=kind.startsWith('key-');if(teacher&&!task)return;const X=G.exportTools,out=paper(exportRecord(),teacher);if(kind==='copy'||kind==='key-copy')await X.copyPng(out);else if(kind==='png')await X.downloadPng(out,'angles-and-geometry',2);else if(kind==='svg')X.downloadSvg(out,'angles-and-geometry');else X.printSvg(out,{title:teacher?'Angles — teacher key':'Angles & geometry',landscape:true});report('Export ready.')}catch(e){report(e.message)}}
 function publish(batch){const P=G.publishing;try{if(!P)throw Error('Publishing unavailable');draft=draft||P.createDocument();if(batch)P.openQuickGenerate(draft,ID,snapshot());else{draft.addCurrent(ID,snapshot());P.openEditor(draft)}}catch(e){report(e.message)}}
 function controls(){const host=q('#gd-controls'),openSections=new Set([...host.querySelectorAll('details[data-ag-section][open]')].map(e=>e.dataset.agSection)),tabs='<div class="gd-row" role="tablist" aria-label="Angles workflow">'+[['build','Explore'],['challenge','Challenge'],['export','Export']].map(([v,l])=>'<button type="button" class="gd-btn'+(workflow===v?' gd-btn--primary':'')+'" data-ag-workflow="'+v+'">'+l+'</button>').join('')+'</div>';
  const common=field('Curriculum suggestions',select('ag-year',YEARS,cfg.year))+field('Difficulty',select('ag-level',LEVELS,cfg.level))+'<label class="gd-field"><span><input type="checkbox" id="ag-enrich"'+(cfg.enrichment?' checked':'')+'> Include KS3 enrichment</span></label>';
  const avail=types(cfg),groups=challengeGroups(cfg);
  const challenge='<div class="gd-ag-challenge-catalogue" data-gd-native-prefix="ag" data-gd-native-groups="'+esc(JSON.stringify(groups))+'"><button type="button" class="gd-btn gd-btn--primary" data-gd-native-random="all">Random challenge</button><p class="gd-help">Choose any question, or generate randomly from a category.</p>'+groups.map((g,index)=>'<details class="gd-ag-challenge-section" data-ag-section="'+g.id+'"><summary>'+esc(g.label)+' <span>'+g.ids.length+'</span></summary><div class="gd-ag-challenge-options"><button type="button" class="gd-btn" data-gd-native-random="'+index+'">Random · '+esc(g.label)+'</button><div class="gd-ag-challenge-types">'+g.ids.map(id=>{const t=avail.find(x=>x.id===id);return '<button type="button" class="gd-btn" data-ag-challenge-mode="'+t.id+'">'+esc(t.label)+'</button>'}).join('')+'</div></div></details>').join('')+'</div><details class="gd-ag-challenge-section" data-ag-section="settings"><summary>Generation settings</summary><div class="gd-ag-challenge-options">'+common+'<p class="gd-help">Year suggestions are advisory; KS3 is optional.</p></div></details>';
  const angleField=(max=360,min=0)=>field(demo.mode==='turn'?'Turn amount':'Angle opening',select('ag-value',Array.from({length:max-min+1},(_,i)=>[i+min,(i+min)+'°']),Math.max(min,Math.min(max,demo.angle))));
  const rotationField=field(demo.mode==='turn'?'Starting direction':'Orientation',select('ag-rotation',Array.from({length:24},(_,i)=>[i*15,i*15+'°']),demo.rotation));
  const check=(id,label,on)=>'<label class="gd-field"><span><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'> '+label+'</span></label>';
  const modeFields={
    angle:angleField()+rotationField+check('ag-scale','Show protractor',demo.scale),
    turn:angleField()+rotationField+field('Turn direction',select('ag-direction',[['cw','Clockwise'],['ccw','Anticlockwise']],demo.clockwise?'cw':'ccw')),
    polygon:check('ag-fill','Shade whole shape (demonstration)',demo.showFill===true)+field('Shape',select('ag-shape-view',[['regular','General polygons'],['equilateral','Equilateral triangle'],['isosceles','Isosceles triangle'],['scalene','Scalene triangle'],['right-triangle','Right-angled triangle'],['kite','Kite'],['square','Square'],['rectangle','Rectangle'],['rhombus','Rhombus'],['parallelogram','Parallelogram'],['trapezium','Trapezium']],demo.shapeView||'regular'))+rotationField+(!demo.shapeView||demo.shapeView==='regular'?field('Sides',select('ag-sides',Array.from({length:10},(_,i)=>[i+3,i+3]),demo.n))+check('ag-regular','Regular polygon',demo.regular)+check('ag-triangulate','Show triangulation',demo.triangulate!==false):check('ag-sides-mark','Mark equal sides',demo.showSides!==false)+(['square','rectangle','rhombus','parallelogram','trapezium','kite'].includes(demo.shapeView)?check('ag-diagonals','Show diagonals',demo.showDiagonals===true)+check('ag-parallel','Mark parallel sides',demo.showParallel===true):''))+check('ag-corners','Show interior angles',demo.showCorners!==false)+(['equilateral','isosceles','scalene','right-triangle'].includes(demo.shapeView)?check('ag-height','Show perpendicular height',demo.showHeight===true):''),
    circle:check('ag-fill','Shade whole circle (demonstration)',demo.showFill===true)+field('Radius (cm)',select('ag-radius',Array.from({length:15},(_,i)=>[i+1,(i+1)+' cm']),demo.radius||5))+check('ag-circle-extension','Show KS3 formulae and working',demo.circleEnrichment===true),
    'free-explore':'<p class="gd-help">Draw freely and move vertices to test what happens when a shape loses its properties. Trace any chosen point.</p>',
    loci:'<p class="gd-help">Move a constrained point and record the path it follows.</p>',
    construct:'<p class="gd-help">Draw with instruments. Enable Allow points to move in the workspace to explore and trace the same drawing.</p>' ,
    facts:angleField(170,10)+rotationField+field('Angle relationship',select('ag-fact',[['straight','Straight line'],['point','Around a point'],['opposite','Vertically opposite']],demo.fact||'straight')),
    lines:field('Line relationship',select('ag-relation',[['Parallel','Parallel'],['Perpendicular','Perpendicular'],['Neither','Neither']],demo.relation||'Neither'))+rotationField+(!demo.relation||demo.relation==='Neither'?angleField(80,10):'')
  };
  const modeGroups=[['Teaching diagrams',['angle','turn','lines','facts','polygon','circle']],['Geometry workspaces',['construct','loci']]];
  const modeLabels={'construct':'Geometry Construction Lab','free-explore':'Free exploration — movable points','loci':'Dynamic geometry — loci & traces'};
  const groupedModes='<select class="gd-select" id="ag-mode" aria-label="Geometry activity">'+modeGroups.map(([group,ids])=>'<optgroup label="'+esc(group)+'">'+ids.map(id=>'<option value="'+esc(id)+'"'+(demo.mode===id?' selected':'')+'>'+esc(modeLabels[id]||MODES.find(m=>m[0]===id)[1])+'</option>').join('')+'</optgroup>').join('')+'</select>';
  const exploration=field('Geometry activity',groupedModes)+modeFields[demo.mode];
  const exports='<p class="gd-help">'+(task?'Pupil copies always hide the answer. Use a separate teacher key.':'Export the current teaching diagram.')+'</p><div class="gd-row">'+btn('Copy image','ag-copy')+btn('PNG','ag-png')+btn('SVG','ag-svg')+btn('Print / PDF','ag-print')+'</div>'+(task?'<div class="gd-row">'+btn('Copy answer key','ag-key-copy')+btn('Print answer key','ag-key-print')+'</div>':'')+'<div class="gd-row">'+btn('Add current item','ag-add')+btn('Generate questions…','ag-batch')+'</div>'+btn('Review worksheet','ag-review');
  host.innerHTML=tabs+(workflow==='challenge'?challenge:workflow==='export'?exports:exploration)+'<p class="gd-help" id="ag-status" role="status">'+esc(status)+'</p>';
  host.querySelectorAll('details[data-ag-section]').forEach(el=>el.open=openSections.has(el.dataset.agSection));
  qa('[data-ag-workflow]',host).forEach(b=>b.onclick=()=>{workflow=b.dataset.agWorkflow;if(workflow==='build'){task=null;attempt=null;scope=''}render()});
  qa('[data-ag-challenge-mode]',host).forEach(b=>b.onclick=()=>{scope='';launch(b.dataset.agChallengeMode)});
  const bind=(id,fn)=>{const el=q('#'+id,host);if(el)el.onchange=e=>{fn(e.target);render()}};
  bind('ag-year',e=>cfg.year=e.value);bind('ag-level',e=>cfg.level=e.value);bind('ag-enrich',e=>cfg.enrichment=e.checked);bind('ag-mode',e=>{demo.mode=e.value;cfg.mode=e.value;if(e.value==='construct')demo.freeLab=true});bind('ag-value',e=>demo.angle=+e.value);bind('ag-rotation',e=>demo.rotation=+e.value);bind('ag-scale',e=>demo.scale=e.checked);bind('ag-direction',e=>demo.clockwise=e.value==='cw');bind('ag-sides',e=>demo.n=+e.value);bind('ag-regular',e=>demo.regular=e.checked);bind('ag-triangulate',e=>demo.triangulate=e.checked);bind('ag-corners',e=>demo.showCorners=e.checked);bind('ag-height',e=>demo.showHeight=e.checked);bind('ag-shape-view',e=>demo.shapeView=e.value);bind('ag-sides-mark',e=>demo.showSides=e.checked);bind('ag-diagonals',e=>demo.showDiagonals=e.checked);bind('ag-parallel',e=>demo.showParallel=e.checked);bind('ag-radius',e=>demo.radius=+e.value);bind('ag-fill',e=>demo.showFill=e.checked);bind('ag-circle-extension',e=>demo.circleEnrichment=e.checked);bind('ag-length',e=>demo.length=+e.value);bind('ag-free-lab',e=>demo.freeLab=e.checked);bind('ag-fact',e=>demo.fact=e.value);bind('ag-relation',e=>demo.relation=e.value);
  for(const kind of ['copy','png','svg','print',...(task?['key-copy','key-print']:[])]){let el=q('#ag-'+kind,host);if(!el){el=document.createElement('button');el.hidden=true;el.type='button';host.appendChild(el)}el.setAttribute('data-gd-direct-export',kind);el.onclick=()=>exportAction(kind)}
  const ad=q('#ag-add',host);if(ad)ad.onclick=()=>publish(false);const ba=q('#ag-batch',host);if(ba)ba.onclick=()=>publish(true);const re=q('#ag-review',host);if(re)re.onclick=()=>{const P=G.publishing;if(P){draft=draft||P.createDocument();P.openEditor(draft)}};
 }
 function demoData(){if(demo.mode==='facts'){const f=demo.fact||'straight',a=Math.max(10,Math.min(170,demo.angle));return {...demo,type:f,angles:f==='straight'?[a,180-a]:f==='point'?[a,90,270-a]:[a,180-a,a,180-a]}}if(demo.mode==='lines')return {...demo,angle:demo.relation==='Parallel'?0:demo.relation==='Perpendicular'?90:Math.max(10,Math.min(80,demo.angle)),relation:demo.relation||'Neither'};if(demo.mode==='loci')return {...demo,locusState:locusState||locusInitial()};if(demo.mode==='free-explore')return {...demo,labDrawing:motionLab||labEmpty(true)};if(demo.mode==='construct')return {...demo,angle:Math.max(10,Math.min(170,demo.angle)),labDrawing:freeLab||labEmpty(true)};return demo}
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
    const measuring=!!task&&['measure','reflex'].includes(task.type)&&!task.revealed;
    const svg=diagram(d,teacher,{attempt,length:attemptLength,scale:task?(task.revealed&&['measure','reflex'].includes(task.type)||['draw','draw-reflex'].includes(task.type)):demo.scale,measureWorkspace:measuring,interactive,...(drag?{full:drag.max===360}:{})});
    svg.style.cssText='width:100%;height:auto;max-height:560px;display:block;margin:auto';
    box.replaceChildren(svg);if(measuring)mountAngleMeasurement(box,svg,d);else if(task&&!task.revealed&&inspectTypes.includes(task.type))mountInvestigation(box,svg);else if(!task&&demo.mode==='polygon')mountPolygonRegions(box,svg,d,v=>demo.regionsByShape=v);
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
  if(build&&!task.revealed){box.style.maxWidth='1200px';mountLab(box,lab,v=>{lab=v;CK.refreshModelPupil(task)})}else if(!task&&demo.mode==='loci'){box.style.maxWidth='none';mountLoci(box,locusState,v=>{locusState=v})}else if(!task&&demo.mode==='free-explore'){box.style.maxWidth='none';mountLab(box,motionLab,v=>{motionLab=v},{free:true,motion:true})}else if(!task&&demo.mode==='construct'){box.style.maxWidth='none';mountLab(box,freeLab,v=>{freeLab=v},{free:true})}else drawSvg();
  if(draw&&!task.revealed){const row=document.createElement('div');row.className='gd-row';row.style.cssText='justify-content:center;flex-wrap:wrap;padding:8px;gap:8px';row.innerHTML='<span>Angle</span><button class="gd-btn" data-ag-adjust="-10">−10°</button><button class="gd-btn" data-ag-adjust="-1">−1°</button><strong id="ag-attempt">'+(draw?(attempt===null?'Move the arm':'Arm positioned'):(attempt===null?'—':attempt+'°'))+'</strong><button class="gd-btn" data-ag-adjust="1">+1°</button><button class="gd-btn" data-ag-adjust="10">+10°</button>'+(build?'<label>AC (cm) '+select('ag-attempt-length',[['','Choose'],...Array.from({length:7},(_,i)=>[i+1,i+1])],attemptLength??'')+'</label>':'');host.appendChild(row);qa('[data-ag-adjust]',row).forEach(b=>b.onclick=()=>setAngle((attempt??0)+Number(b.dataset.agAdjust)));const l=q('#ag-attempt-length',row);if(l)l.onchange=()=>{attemptLength=l.value===''?null:+l.value;drawSvg();CK.refreshModelPupil(task)}}
  if(task){q('[data-challenge-action="another"]',host).onclick=()=>{const current=task.type;if(scope==='all')launch('all');else if(scope.startsWith('category:')){const group=scope.slice(9),ids=challengeGroups(cfg).find(g=>g.id===group)?.ids||[];launch(ids.length?pick(Math.random,ids):current)}else launch(current)};q('[data-challenge-action="end"]',host).onclick=()=>{task=null;attempt=null;scope='';workflow='build';render()};const reveal=q('[data-board-action="reveal"]',host);if(reveal)reveal.onclick=()=>{task.revealed=!task.revealed;stage()}}
  else {
    const row=document.createElement('div');row.className='gd-row';row.style.cssText='justify-content:center;flex-wrap:wrap;gap:8px';
    const action=(id,label)=>'<button type="button" class="gd-btn" data-ag-action="'+id+'">'+label+'</button>';
    const angleButtons=(label)=>'<button type="button" class="gd-btn" data-ag-action="minus" data-ag-demo="-5">−5°</button>'+'<strong data-ag-demo-value>'+esc(label)+'</strong>'+'<button type="button" class="gd-btn" data-ag-action="plus" data-ag-demo="5">+5°</button>';
    const m=demo.mode;
    if(m==='angle')row.innerHTML=angleButtons(demo.angle+'° · '+classify(demo.angle));
    else if(m==='turn')row.innerHTML=action('minus-turn','−¼ turn')+'<strong>'+demo.angle+'° · '+(demo.clockwise?'Clockwise':'Anticlockwise')+'</strong>'+action('plus-turn','+¼ turn')+action('direction','Reverse direction')+action('reset-turn','Reset');
    else if(m==='polygon'&&demo.shapeView&&demo.shapeView!=='regular')row.innerHTML=action('next-shape','Next shape')+action('toggle-side-marks',demo.showSides===false?'Show equal sides':'Hide equal sides')+action('toggle-corners',demo.showCorners===false?'Show angles':'Hide angles')+(['square','rectangle','rhombus','parallelogram','trapezium','kite'].includes(demo.shapeView)?action('diagonal',demo.showDiagonals?'Hide diagonals':'Show diagonals')+action('parallel-marks',demo.showParallel?'Hide parallel marks':'Show parallel marks'):'')+(['rectangle','parallelogram','trapezium','right-triangle','kite'].includes(demo.shapeView)?action('shape-shorter','− height')+action('shape-taller','+ height'):'')+(['rhombus','parallelogram','isosceles','scalene'].includes(demo.shapeView)?action('shape-angle-down','− opening')+action('shape-angle-up','+ opening'):'')+(['equilateral','isosceles','scalene','right-triangle'].includes(demo.shapeView)?action('shape-height',demo.showHeight?'Hide height':'Show height'):'');
    else if(m==='circle')row.innerHTML=action('radius-down','−1 cm')+'<strong>Radius: '+(demo.radius||5)+' cm</strong>'+action('radius-up','+1 cm')+action('circle-extension',demo.circleEnrichment?'Hide KS3 working':'Show KS3 working');
    else if(m==='polygon')row.innerHTML=action('minus-side','− side')+'<strong>'+demo.n+' sides · '+(demo.regular?'Regular':'Irregular')+'</strong>'+action('plus-side','+ side')+action('regular',demo.regular?'Make irregular':'Make regular')+action('triangulate',demo.triangulate===false?'Show triangles':'Hide triangles');
    else if(m==='facts')row.innerHTML=angleButtons(d.angle+'°')+action('fact','Change relationship');
    else if(m==='lines')row.innerHTML=action('relation','Change relationship')+'<strong>'+esc(d.relation)+'</strong>'+(d.relation==='Neither'?angleButtons(d.angle+'°'):'')+action('rotate','Rotate 15°');
    
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
      else if(id==='shape-shorter'||id==='shape-taller')demo.shapeHeight=clamp((demo.shapeHeight||180)+(id==='shape-taller'?15:-15),90,280);
      else if(id==='shape-angle-down'||id==='shape-angle-up'){const k=id==='shape-angle-up'?5:-5;if(['isosceles','scalene'].includes(demo.shapeView))demo.shapeBaseAngle=clamp((demo.shapeBaseAngle||(demo.shapeView==='scalene'?40:50))+k,demo.shapeView==='scalene'?30:20,demo.shapeView==='scalene'?48:75);else demo.shapeAngle=clamp((demo.shapeAngle||65)+k,25,85)}
      else if(id==='shape-height')demo.showHeight=!demo.showHeight;
      else if(id==='next-shape')demo.shapeView=cycle(demo.shapeView,['equilateral','isosceles','scalene','right-triangle','square','rectangle','rhombus','parallelogram','trapezium','kite']);
      else if(id==='toggle-side-marks')demo.showSides=demo.showSides===false;
      else if(id==='toggle-corners')demo.showCorners=demo.showCorners===false;
      else if(id==='diagonal')demo.showDiagonals=!demo.showDiagonals;
      else if(id==='parallel-marks')demo.showParallel=!demo.showParallel;
      else if(id==='radius-down'||id==='radius-up')demo.radius=clamp((demo.radius||5)+(id==='radius-up'?1:-1),1,15);
      else if(id==='circle-extension')demo.circleEnrichment=!demo.circleEnrichment;
      else if(id==='minus-length'||id==='plus-length')demo.length=clamp(demo.length+(id==='plus-length'?1:-1),1,7);
      render();
    });
  }
 }
 function render(){controls();stage()}
 setPanels('','');render();G.lessonState.register(ID,()=>({...snapshot(),demo:demoData()}),s=>{cfg=settings(s);demo={...demo,...s.demo,type:'diagram'};workflow=['build','challenge','export'].includes(s.workflow)?s.workflow:'build';task=s.task?CK.normalise(s.task):null;attempt=Number.isFinite(s.attempt)?s.attempt:null;attemptLength=Number.isFinite(s.attemptLength)?s.attemptLength:null;scope=String(s.scope||'');lab=s.lab||null;freeLab=s.freeLab||null;motionLab=s.motionLab||null;if(demo.mode==='free-explore'){demo.mode='construct';freeLab=motionLab||s.demo?.labDrawing||freeLab||labEmpty(true);freeLab.allowMovement=true}else if(!freeLab&&demo.mode==='construct')freeLab=s.demo?.labDrawing||null;demo.freeLab=true;locusState=s.locusState||s.demo?.locusState||null;CK.restorePupil(task,s.pupil);render()});
};
})(typeof globalThis!=='undefined'?globalThis:this);
