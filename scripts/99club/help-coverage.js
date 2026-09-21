#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const reportPath=path.join(ROOT,'99club-browser-qa-report.json');
if(!fs.existsSync(reportPath)){console.error('Browser QA report is missing.');process.exit(1);}
const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
const runtime=[...new Set((report.games||[]).map(x=>x.id).filter(Boolean))].sort();
const help=fs.readFileSync(path.join(ROOT,'assets/99club/games-help-guides.js'),'utf8');
const guides=[...help.matchAll(/\{id:'([^']+)'[^\n]*title:'([^']*)'/g)].filter(m=>m[2]&&!m[1].includes('placeholder')).map(m=>m[1]);
const guideSet=new Set(guides),runtimeSet=new Set(runtime);
const visualStart=help.indexOf('const V={'),visualEnd=help.indexOf('};\n    return V[id]',visualStart);
const visualBlock=visualStart>=0&&visualEnd>visualStart?help.slice(visualStart,visualEnd):'';
const visualIds=[...visualBlock.matchAll(/^\s{6}([a-z0-9_]+):/gm)].map(m=>m[1]);
const missingVisuals=guides.filter(id=>!visualIds.includes(id));
if(missingVisuals.length){console.error('Visible guides missing worked-example visuals: '+missingVisuals.join(', '));process.exitCode=1;}
const guideLines=help.split('\n').filter(line=>/^\s*\{id:'[^']+',title:'[^']+'/.test(line)&&!line.includes('hidden:true'));
for(const line of guideLines){
  const id=(line.match(/\{id:'([^']+)'/)||[])[1]||'unknown';
  for(const field of [',goal:',',rules:',',example:',',strategy:',',tip:',',watch:']){
    if(!line.includes(field)){console.error(`Guide ${id} is missing required field ${field.slice(1,-1)}`);process.exitCode=1;}
  }
}

const missing=runtime.filter(id=>!guideSet.has(id));
const orphan=guides.filter(id=>!runtimeSet.has(id));

// Static guide-quality contracts for examples that are easy to regress visually or mathematically.
const requiredGuideSnippets=[
  ['crossword','RHOMBUS has 7 letters'],
  ['operationgrid','then decode the secret maths word'],
  ['numberwheels','Factor Pair Web'],
  ['symbols','18 is the 18th letter of the alphabet'],
  ['balance','final scale must use every collected weight once'],
  ['takuzu',"takuzu:miniGrid([['0','0','1','1'],['0','1','0','1'],['1','0','1','0'],['1','1','0','0']]"],
  ['killersudoku','<b>7+</b>'],
  ['cornersum',"miniGrid([['3','5'],['4','8']])+'<b>20</b>"],
  ['linkedsum','A: 4 + 6 + □'],
  ['colourlogic','Green is at an end; Red is immediately left of Blue.'],
  ['mobilebalance','balanced: 12 = 12'],
  ['diagonalpath','8 is the only cell touching both 7 and 9.'],
  ['squaresearch','Correct target squares never share a cell.'],
  ['perimeterregions','the shared edge is inside the region']
];
for(const [id,snippet] of requiredGuideSnippets){
  if(!help.includes(snippet)){console.error(`Guide audit contract failed for ${id}: missing "${snippet}"`);process.exitCode=1;}
}
const css=fs.readFileSync(path.join(ROOT,'assets/99club/games-help-guides.css'),'utf8');
for(const cls of ['tt99-guide-mini-perimeter .region','tt99-guide-mini-mobile .beam','tt99-guide-mini-colour .c4']){
  if(!css.includes(cls)){console.error('Guide visual contract missing CSS: '+cls);process.exitCode=1;}
}

const page=fs.readFileSync(path.join(ROOT,'_pages/99-club-games-help.md'),'utf8');
const stated=Number((page.match(/covers all <strong>(\d+) current one-player games<\/strong>/)||[])[1]||0);
if(missing.length)console.error('Missing one-page guides for runtime games: '+missing.join(', '));
if(orphan.length)console.warn('Guides without an online runtime adapter: '+orphan.join(', '));
if(stated!==runtime.length)console.error(`Help page says ${stated} games but runtime registered ${runtime.length}.`);
console.log(`Help coverage: ${guides.length} visible guides, ${runtime.length} runtime games.`);
if(missing.length||stated!==runtime.length||process.exitCode)process.exit(1);
