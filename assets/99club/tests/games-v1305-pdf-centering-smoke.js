/* 99 Club Studio v1.30.5 direct-PDF diagram typography/centering regression. */
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
function assert(ok,msg){if(!ok)throw new Error(msg);}
const pdf=fs.readFileSync(path.join(ROOT,'games-pdf.js'),'utf8');
const page=fs.readFileSync(path.resolve(ROOT,'../../_pages/99-club-games.md'),'utf8');

// The generic simple-PDF width estimator is deliberately approximate. Diagram
// centring must use Helvetica AFM metrics, especially because every digit has
// the same 556-unit advance (including "1").
assert(/function diagramGlyphWidth\(ch,bold\)/.test(pdf),'diagram AFM width helper missing');
assert(/if\(ch>='0'&&ch<='9'\)return 556/.test(pdf),'tabular digit width guard missing');
assert(/function diagramText\(page,cx,baseline,text,size,opts=\{\}\)/.test(pdf),'exact diagram centring helper missing');
assert(/function fitDiagramText\(/.test(pdf),'exact fitted diagram centring helper missing');
assert(/diagramText\(page,cx,cy\+fs\*\.36/.test(pdf),'circle-node exact centring not in use');

// Rule wheels need a little more breathing room in the direct PDF than v1.30.4.
assert(/innerR=\d+(?:\.\d+)?\*s,outerR=\d+(?:\.\d+)?\*s,innerNode=\d+(?:\.\d+)?\*s,outerNode=\d+(?:\.\d+)?\*s,centreR=\d+(?:\.\d+)?\*s/.test(pdf),'rule-wheel PDF geometry missing');
assert(/fitDiagramText\(page,cx,cy\+[0-9.]+\*s,clean\(it\.rule\)/.test(pdf),'rule text is not fitted with exact centring');

// Factor-web centre and capsule values all use exact centred PDF text.
assert(/(?:diagramText|fitDiagramText)\(page,cx,cy-[0-9.]+\*sc,'FACTOR PAIRS'/.test(pdf),'factor centre label exact centring missing');
assert(/(?:diagramText|fitDiagramText)\(page,cx,cy\+[0-9.]+\*sc,formatNumber\(centre\)/.test(pdf),'factor centre value exact centring missing');
assert(/diagramText\(page,leftX,py\+fs\*\.36/.test(pdf)&&/diagramText\(page,rightX,py\+fs\*\.36/.test(pdf),'factor capsule value centring missing');

// Diamond labels must use the same exact-centre helper rather than the generic
// width estimator that caused PRODUCT to drift sideways.
assert(/diagramText\(page,cx,cy-ry-nodeR-4\*sc,'PRODUCT'/.test(pdf),'PRODUCT exact centring missing');
assert(/diagramText\(page,cx,cy\+ry\+nodeR\+7\*sc,'SUM'/.test(pdf),'SUM exact centring missing');

assert(/games-pdf\.js\?v=(?:1[3-9]|[2-9]\d)/.test(page),'PDF cache bust is older than the v1.30.5 centring baseline');
console.log('Number Patterns direct-PDF centring v1.30.5 regression passed.');
