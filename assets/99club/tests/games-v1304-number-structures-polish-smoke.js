/* 99 Club Studio v1.30.4 consolidated Number Patterns visual polish. */
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
function assert(ok,msg){if(!ok)throw new Error(msg);}
const app=fs.readFileSync(path.join(ROOT,'games-app.js'),'utf8');
const pdf=fs.readFileSync(path.join(ROOT,'games-pdf.js'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'games.css'),'utf8');

// Factor Pair Web: one grouped pair capsule per spoke, deliberately separated
// from the centre circle, with the spoke clipped to both boundaries.
assert(/viewBox="0 0 220 220"/.test(app),'factor web expanded viewBox missing');
assert(/centreR=25,pairRX=76,pairRY=62,pairW=66,pairH=27/.test(app),'factor web spacing geometry changed');
assert(/startX=cx\+ux\*\(centreR\+2\)/.test(app),'factor web spoke does not start outside centre circle');
assert(/endX=px-ux\*t/.test(app),'factor web spoke does not stop at capsule boundary');
assert(/factor-pair-capsule/.test(app)&&/factor-divider/.test(app),'factor pair capsule structure missing');
assert(/class="centre-label"/.test(app)&&/dominant-baseline="middle">FACTOR PAIRS/.test(app),'factor centre label alignment guard missing');
assert(/class="centre-value"/.test(app),'factor centre value alignment guard missing');

// Sum & Product Diamonds: labels remain truly centred over/under their nodes.
assert(/product-label/.test(app)&&/text-anchor="middle"/.test(app),'diamond explicit label centring missing');
assert(/letter-spacing:0!important/.test(css),'diamond optical-centering CSS guard missing');

// Arithmagons: signs are present on diagonals and perimeter signs are moved
// away from the interior using the centre-aware operation placement helper.
assert(/opPoint=\(link,p,q,mx,my\)/.test(app),'arithmagon operation helper missing');
assert(/link\.diagonal\?12:12\.5/.test(app),'arithmagon operation offsets missing');
assert(/arithmagonOpPoint\(link/.test(pdf),'PDF arithmagon operation placement helper missing');

// PDF parity guards for all visual structures touched in this review round.
assert(/function drawCircle\(/.test(pdf)&&/function drawRoundRect\(/.test(pdf)&&/function drawDashedLine\(/.test(pdf),'PDF vector parity helpers missing');
assert(/pairRX=\d+\*sc,pairRY=\d+\*sc,centreR=\d+\*sc,pairW=\d+\*sc,pairH=\d+\*sc/.test(pdf),'PDF factor-web grouped geometry missing');
assert(/startX=cx\+ux\*\(centreR\+2\*sc\)/.test(pdf)&&/endX=px-ux\*t/.test(pdf),'PDF factor-web spoke clipping missing');
assert(/drawCircleNode\(page,nx,ny,value,nodeR/.test(pdf),'PDF diamond circular nodes missing');

console.log('Number Patterns & Structures v1.30.4 polish regression passed.');
