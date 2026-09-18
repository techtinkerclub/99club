/* 99 Club Studio v1.30.2 Number Patterns PDF parity + Arithmagon notation regression. */
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const G=require(path.join(ROOT,'games-engine.js'));
const PDF=require(path.join(ROOT,'games-pdf.js'));
function assert(ok,msg){if(!ok)throw new Error(msg);}
const app=fs.readFileSync(path.join(ROOT,'games-app.js'),'utf8'),pdfSrc=fs.readFileSync(path.join(ROOT,'games-pdf.js'),'utf8');

// Arithmagons: every connection keeps its operation sign; the browser places
// perimeter signs outside the polygon and diagonal signs beside the chord.
assert(/opPoint=\(link,p,q,mx,my\)/.test(app),'browser operation placement helper missing');
assert(/link\.diagonal\?12:12\.5/.test(app),'browser diagonal/perimeter operation offsets missing');
assert(/<text class=\"op\" x=\"\$\{opx\}/.test(app),'browser operation text missing');
assert(/arithmagonOpPoint\(link/.test(pdfSrc),'PDF operation placement helper missing');
assert(/link\.operation==='add'\?'\+':'x'/.test(pdfSrc),'PDF operation sign missing');

// PDF visual parity: the new visual family must use the same visual primitives
// as the preview rather than rectangular stand-ins or stretched geometry.
assert(/function drawCircle\(/.test(pdfSrc),'PDF circle primitive missing');
assert(/function drawRoundRect\(/.test(pdfSrc),'PDF rounded-slot primitive missing');
assert(/function drawDashedLine\(/.test(pdfSrc),'PDF dashed diagonal primitive missing');
assert(/size=Math\.max\(120,Math\.min\(availW,bodyH\)\)/.test(pdfSrc),'Arithmagon PDF no longer preserves a square drawing area');
assert(/drawCircleNode\(page,scaleX\(p\[0\]\),scaleY\(p\[1\]\),corners\[i\]/.test(pdfSrc),'Arithmagon PDF corner circles missing');
assert(/nodeR=Math\.max\(9,Math\.min\(16,outer\*\.054\)\)/.test(pdfSrc)&&/pad=nodeR\+3,drawSize=Math\.max/.test(pdfSrc),'Magic Shape PDF safe proportional-node geometry missing');
assert(/pairRX=\d+\*sc,pairRY=\d+\*sc/.test(pdfSrc)&&/drawRoundRect\(page,capsuleX,capsuleY,pairW,pairH/.test(pdfSrc),'Factor Pair PDF capsule geometry missing');
assert(/drawCircleNode\(page,nx,ny,value,nodeR/.test(pdfSrc),'Diamond PDF circular nodes missing');

// Generate representative activities and ensure the PDF exporter can consume
// them in both pupil and answer modes after the drawing changes.
const base={minYear:4,maxYear:6,topics:['calculation','number-properties'],workedExamples:'off',personalisation:{schoolName:'QA',packTitle:'PDF parity'},engineSettings:{}};
function activity(id,opts,seed){const s=JSON.parse(JSON.stringify(base));s.engineSettings[id]=opts;return G.generateActivity(id,s,seed);}
const activities=[
 activity('arithmagon',{difficulty:'challenge',shape:'pentagon',operation:'mixed_within',connections:'diagonals',missing:'balanced'},'1302-a'),
 activity('magicshape',{difficulty:'standard',shape:'bowtie',puzzleType:'missing',clueLevel:'balanced'},'1302-b'),
 activity('numberwheels',{difficulty:'standard',style:'factor',itemCount:'4'},'1302-c'),
 activity('numberwheels',{difficulty:'standard',style:'diamond',itemCount:'4'},'1302-d'),
 activity('numberwheels',{difficulty:'standard',style:'wheel',itemCount:'4'},'1302-e'),
 activity('pyramid',{difficulty:'challenge',height:'7',operation:'add',missing:'balanced'},'1302-f'),
 activity('numbertrail',{difficulty:'standard',length:'20',rule:'auto',missing:'balanced'},'1302-g'),
 activity('magic',{difficulty:'standard',size:'3',puzzleType:'missing'},'1302-h')
];
const sheets=[];for(let i=0;i<activities.length;i+=2)sheets.push({index:sheets.length+1,activities:activities.slice(i,i+2)});
const pack={seed:'v1302',sheets};
for(const kind of ['student','answers']){const doc=PDF.buildDocument({pack,settings:base,kind,topics:G.TOPICS,seed:pack.seed}),bytes=doc.outputBytes();assert(bytes.length>2000,`${kind} PDF unexpectedly small`);assert(Buffer.from(bytes).subarray(0,5).toString()==='%PDF-',`${kind} export is not a PDF`);}
console.log('Number Patterns & Structures v1.30.2 PDF parity regression passed.');
