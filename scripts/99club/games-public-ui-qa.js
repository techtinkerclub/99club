#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const failures=[];
function check(ok,msg){if(ok)console.log('OK   '+msg);else{console.error('FAIL '+msg);failures.push(msg);}}
function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}
function syntax(rel){const src=read(rel);try{new Function(src);check(true,rel+' syntax compiles');}catch(e){check(false,rel+' syntax error: '+e.message);}return src;}

const app=syntax('assets/99club/games-app.js');
const focus=syntax('assets/99club/games-focus-topics-v145-ui.js');
const ui=syntax('assets/99club/games-ui-v134.js');
const selector=syntax('assets/99club/games-selector-ux-v162.js');
const random=syntax('assets/99club/games-random-ui.js');
const towers=syntax('assets/99club/games-v137.js');
const takuzu=syntax('assets/99club/games-takuzu-v139-ui.js');
const shikaku=syntax('assets/99club/games-shikaku-v143-ui.js');
const engine=syntax('assets/99club/games-engine.js');
const parentPage=syntax('assets/99club/games-parent-practice-page.js');
const builder=syntax('assets/99club/widget-builder.js');
const runtime=syntax('assets/99club/widget-runtime.js');

check(!/From year|To year|Outside the selected year range|yearRangeLabel\(/i.test(app),'Games setup has no teacher-facing Year range control or label');
check(!/Auto for year(?:\/difficulty|\/topic)?/i.test(app),'Games option labels do not describe automatic settings by Year');
check(app.includes('teachingFocusLabel()')&&app.includes('data-category-selected=')&&app.includes('data-category-compatible='),'Games app exposes topic-led metadata and authoritative category counts');
check(focus.includes("oldGrid.insertAdjacentElement('afterend',el)")&&!focus.includes("querySelector('#games-min-year')"),'Teaching-focus UI no longer depends on hidden Year controls');
check(ui.includes('function restoreCategorySummaries()')&&ui.includes('category.dataset.categorySelected'),'active Games UI restores collapsed category summaries from authoritative counts');
check(selector.includes('if(!inputs.length)return;'),'legacy selector layer cannot overwrite collapsed categories as 0/0');
check(!/selected years|year\/topic combination/i.test(random),'Random Pack wording is teaching-focus based');
check(!/Years? 3[–-]6|games-min-year|games-max-year/i.test(towers),'Number Towers UI has no Year recommendation/gate');
check(!/Years? 3[–-]6|games-min-year|games-max-year/i.test(takuzu),'Takuzu UI has no Year recommendation/gate');
check(!/topic\/year range|year\/topic/i.test(shikaku),'Shikaku UI has no Year-range wording');
check(!/year\/topic selection|year\/topic range/i.test(engine),'Games engine errors refer to teaching focus rather than Year ranges');
check(engine.includes("x.source==='mine'||"),'teacher-added vocabulary is not filtered by the hidden legacy Year scale');
check(!/age range|function yearLabel\(|Years? ['"+]/i.test(parentPage),'parent puzzle page has no Year/age-range claim');
check(!/data-widget-type|Combined Maths Widget|Combined widget/i.test(builder)&&builder.includes('BUILDER_MODE'),'widget builder is locked to separate Club/Games modes');
check(builder.includes('data-pack-title')&&runtime.includes("p.title||'Maths puzzle pack'"),'Games widget uses teacher-editable puzzle-pack display names');
check(!/p\.minYear|p\.maxYear|Year ['"+]/.test(runtime),'widget runtime does not derive puzzle labels from Year ranges');

const schoolGuide=read('_pages/99-club-schools.md');
const widgetGuide=read('_pages/99-club-widget-help.md');
check(!/Set up the year range|same selected years|Combined widget is available/i.test(schoolGuide),'school integration guide reflects topic-led Games and separate builders');
check(!/Choose the year range|same selected years|expected year\/topics\/games|Widget type.*99 Club/i.test(widgetGuide),'widget guide reflects topic-led Games and dedicated builders');

if(failures.length){console.error('\n'+failures.length+' Games public-UI contract failure(s).');process.exit(1);}
console.log('\nGames public-UI contracts passed.');
