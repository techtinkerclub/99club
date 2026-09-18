#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),SITE=path.join(ROOT,'..','..');
function assert(v,m){if(!v)throw new Error(m);}
const css=fs.readFileSync(path.join(ROOT,'games-play-square-grid-fix-v172.css'),'utf8');
const page=fs.readFileSync(path.join(SITE,'_pages','99-club-games-play.md'),'utf8');
for(const selector of ['.tt99-numbergrid{','.tt99-mines-grid{','.tt99-numberpath-grid{','.tt99-wordsearch-grid{','.tt99-play-shikaku-grid,']){
  assert(css.includes(selector),`missing square-grid hardening for ${selector}`);
}
assert((css.match(/grid-template-rows:repeat\(/g)||[]).length>=5,'square-grid stylesheet must define explicit equal row tracks');
assert((css.match(/minmax\(0,1fr\)/g)||[]).length>=10,'square-grid stylesheet must use zero-minimum fractional tracks');
assert(css.includes('.tt99-numberpath-cell{')&&css.includes('box-sizing:border-box'),'Number Path cell sizing guard missing');
assert(page.includes('/assets/99club/games-play-square-grid-fix-v172.css?v=1'),'online-play page does not load square-grid hardening stylesheet');
console.log('PASS v1.72: online square-grid families have explicit equal row/column tracks and shrink-safe cells.');
