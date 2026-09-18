/* 99 Club Studio v1.30.6 direct-PDF visual scale / centre-clearance regression. */
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const PDF=require(path.join(ROOT,'games-pdf.js'));
function assert(ok,msg){if(!ok)throw new Error(msg);}
const pdf=fs.readFileSync(path.join(ROOT,'games-pdf.js'),'utf8');
const page=fs.readFileSync(path.resolve(ROOT,'../../_pages/99-club-games.md'),'utf8');

// Factor Pair Webs deliberately use more of the available PDF slot than the
// browser preview: print has ample whitespace and needs larger writing targets.
assert(/size=Math\.max\(120,Math\.min\(slotW\*\.96,slotH\*1\.25,170\)\)/.test(pdf),'factor-web PDF scale-up missing');
assert(/pairRX=82\*sc,pairRY=72\*sc,centreR=30\*sc,pairW=72\*sc,pairH=29\*sc/.test(pdf),'factor-web enlarged geometry missing');
assert(/fitDiagramText\(page,cx,cy-4\.1\*sc,'FACTOR PAIRS',centreR\*1\.62/.test(pdf),'factor centre label is not fitted to its circle');
assert(/fitDiagramText\(page,cx,cy\+9\.5\*sc,formatNumber\(centre\),centreR\*1\.35/.test(pdf),'factor centre value fit guard missing');

// Rule wheels get a larger centre circle and both centre lines are fitted to
// the usable diameter rather than assuming a fixed font will always fit.
assert(/size=Math\.max\(84,Math\.min\(slotW\*\.94,slotH\*1\.08,a\.items\.length===6\?170:152\)\)/.test(pdf),'rule-wheel PDF scale-up missing');
assert(/innerR=42\*s,outerR=63\*s,innerNode=9\.5\*s,outerNode=10\.5\*s,centreR=29\*s/.test(pdf),'rule-wheel centre clearance geometry missing');
assert(/fitDiagramText\(page,cx,cy-5\.0\*s,'RULE',centreR\*1\.50/.test(pdf),'RULE label fit guard missing');
assert(/fitDiagramText\(page,cx,cy\+8\.7\*s,clean\(it\.rule\),centreR\*1\.48/.test(pdf),'rule expression fit guard missing');
assert(/games-pdf\.js\?v=(?:1[4-9]|[2-9]\d)/.test(page),'PDF cache bust not advanced to v14');

// Exercise both scaled layouts through the actual direct-PDF writer.
const factor={engineId:'numberwheels',style:'factor',title:'Factor Pair Webs',difficulty:'Standard',instruction:'Complete the factor pairs.',items:[
 {centre:84,displayCentre:84,pairs:[[1,84],[2,42],[3,28],[4,21],[6,14],[7,12]],displayPairs:[[1,84],[null,null],[null,null],[null,null],[null,null],[null,null]]},
 {centre:54,displayCentre:54,pairs:[[1,54],[2,27],[3,18],[6,9]],displayPairs:[[null,null],[null,null],[null,null],[null,null]]},
 {centre:72,displayCentre:72,pairs:[[1,72],[2,36],[3,24],[4,18],[6,12],[8,9]],displayPairs:Array(6).fill(null).map(()=>[null,null])},
 {centre:90,displayCentre:90,pairs:[[1,90],[2,45],[3,30],[5,18],[6,15],[9,10]],displayPairs:Array(6).fill(null).map(()=>[null,null])}
]};
const wheel={engineId:'numberwheels',style:'wheel',title:'Rule Wheels',difficulty:'Standard',instruction:'Complete the wheels.',items:[
 {rule:'x 11',inputs:[2,3,5,10,11,15],outputs:[22,33,55,110,121,165],displayInputs:[2,null,5,10,null,15],displayOutputs:[22,33,null,110,121,null]},
 {rule:'+ 15',inputs:[15,3,14,2,20,30],outputs:[30,18,29,17,35,45],displayInputs:[15,null,14,2,null,30],displayOutputs:[30,18,null,17,35,null]},
 {rule:'- 12',inputs:[30,44,60,75,100,120],outputs:[18,32,48,63,88,108],displayInputs:[30,null,60,75,null,120],displayOutputs:[18,32,null,63,88,null]},
 {rule:'x 12',inputs:[1,2,4,6,8,10],outputs:[12,24,48,72,96,120],displayInputs:[1,null,4,6,null,10],displayOutputs:[12,24,null,72,96,null]}
]};
const pack={seed:'v1306-test',sheets:[{index:1,activities:[factor,wheel]}]};
const settings={minYear:4,maxYear:6,topics:['calculation'],workedExamples:'none',personalisation:{packTitle:'v1.30.6 regression'}};
const doc=PDF.buildDocument({pack,settings,kind:'student',topics:{calculation:{label:'Calculation'}},seed:pack.seed});
const bytes=doc.outputBytes();
assert(bytes.length>8000,'scaled-layout PDF unexpectedly small');
assert(Buffer.from(bytes).subarray(0,5).toString()==='%PDF-','scaled-layout export is not a PDF');
console.log('Number Patterns direct-PDF scale v1.30.6 regression passed.');
