/* 99 Club Studio v1.30.1 Number Patterns & Structures review fixes. */
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const G=require(path.join(ROOT,'games-engine.js')),A=G.ARITH;
function assert(ok,msg){if(!ok)throw new Error(msg);}
function cross(a,b,c){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
function segmentsCross(p1,p2,q1,q2){return cross(p1,p2,q1)*cross(p1,p2,q2)<0&&cross(q1,q2,p1)*cross(q1,q2,p2)<0;}

// Arithmagon interior connections stay sparse and non-crossing.
for(const shape of ['square','pentagon','hexagon'])for(let i=0;i<100;i++){
  const a=G.generateActivity('arithmagon',{minYear:4,maxYear:6,topics:['calculation'],engineSettings:{arithmagon:{difficulty:'challenge',shape,operation:'multiply',connections:'diagonals',missing:'balanced'}}},`v1301-arith-${shape}-${i}`);
  assert(A.validate(a).ok,`${shape}: invariant failed`);
  const ds=a.links.filter(l=>l.diagonal);
  assert(ds.length>0&&ds.length<=2,`${shape}: unexpected diagonal count ${ds.length}`);
  if(shape==='square')assert(ds.length===1,'square must use only one diagonal');
  for(let x=0;x<ds.length;x++)for(let y=x+1;y<ds.length;y++){
    const u=ds[x],v=ds[y];
    if([u.a,u.b].some(k=>k===v.a||k===v.b))continue;
    assert(!segmentsCross(a.coords[u.a],a.coords[u.b],a.coords[v.a],a.coords[v.b]),`${shape}: crossing diagonals`);
  }
}

// Bow-tie now consists only of straight three-node magic lines and avoids excessive repeated givens.
for(let i=0;i<180;i++){
  const a=G.generateActivity('magicshape',{minYear:4,maxYear:6,topics:['calculation'],engineSettings:{magicshape:{difficulty:'challenge',shape:'bowtie',puzzleType:'missing',clueLevel:'balanced'}}},`v1301-bowtie-${i}`);
  assert(A.validate(a).ok,'bow-tie invariant failed');
  for(const [i0,i1,i2] of a.lines){const p=a.coords[i0],q=a.coords[i1],r=a.coords[i2];assert(Math.abs(cross(p,q,r))<1e-9,'bow-tie contains a bent marked line');}
  assert(new Set(a.solutionValues).size>=5,'bow-tie repeats too many values');
}

// Factor webs explain the spoke convention and Standard gives one visual starter pair.
for(let i=0;i<80;i++){
  const a=G.generateActivity('numberwheels',{minYear:4,maxYear:4,topics:['calculation'],engineSettings:{numberwheels:{difficulty:'standard',style:'factor',itemCount:'4'}}},`v1301-factor-${i}`);
  assert(A.validate(a).ok,'factor web invariant failed');
  assert(/Each spoke is one factor pair/.test(a.instruction),'factor-web instruction does not explain spokes');
  assert(a.items.some(it=>it.mode==='find_pairs'&&it.displayPairs.some(p=>p[0]!=null&&p[1]!=null)),'Standard factor web has no starter pair');
}

// Static renderer guards for the reviewed visual defects.
const app=fs.readFileSync(path.join(ROOT,'games-app.js'),'utf8'),pdf=fs.readFileSync(path.join(ROOT,'games-pdf.js'),'utf8'),css=fs.readFileSync(path.join(ROOT,'games.css'),'utf8');
assert(/opPoint=\(link,p,q,mx,my\)/.test(app),'browser arithmagon operation positioning helper missing');
assert(/<text class=\"op\" x=\"\$\{opx\}/.test(app),'browser no longer renders operation labels on every connection');
assert(/arithmagonOpPoint\(link/.test(pdf),'PDF arithmagon operation positioning helper missing');
assert(/factor-pair-capsule/.test(app)&&/factor-divider/.test(app),'factor web does not render grouped factor-pair capsules');
assert(/\['top',80,28,'PRODUCT'\]/.test(app)&&/\['bottom',80,132,'SUM'\]/.test(app),'diamond labels/nodes were not pulled inside the SVG frame');
assert(/drawCircleNode\(page,nx,ny,value,nodeR/.test(pdf),'PDF diamonds are not using circular nodes');
assert(/v1\.30\.1 — Number Patterns & Structures review fixes/.test(css),'review-fix CSS marker missing');

console.log('Number Patterns & Structures v1.30.1 review regression passed.');
