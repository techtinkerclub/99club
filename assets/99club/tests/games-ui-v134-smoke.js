/* 99 Club Studio · v1.34 Games UI batch regression. */
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
function assert(ok,msg){if(!ok)throw new Error(msg);}

const page=fs.readFileSync(path.resolve(ROOT,'../../_pages/99-club-games.md'),'utf8');
const ui=fs.readFileSync(path.join(ROOT,'games-ui-v134.js'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'games-ui-v134.css'),'utf8');
const randomUi=fs.readFileSync(path.join(ROOT,'games-random-ui.js'),'utf8');
const app=fs.readFileSync(path.join(ROOT,'games-app.js'),'utf8');

assert(page.includes('games-ui-v134.css?v=1'),'v1.34 UI stylesheet is not loaded');
assert(page.includes('games-ui-v134.js?v=1'),'v1.34 UI behaviour patch is not loaded');
assert(page.includes('games-random-ui.js?v=3'),'redesigned pack builder is not cache-busted');

// #3 / #4 / #6 / #7 structural UI requirements.
assert(ui.includes(".tt99-games-topic-grid")&&ui.includes('small >')===false,'topic cleanup patch looks malformed');
assert(ui.includes(".tt99-game-topic span > small"),'topic vocabulary-count removal is missing');
assert(ui.includes('moveActiveConfiguration')&&ui.includes("card.insertAdjacentElement('afterend',panel)"),'game setup is not moved inline beneath the active game');
assert(ui.includes('moveVocabularyManager')&&ui.includes('tt99-vocab-manager-v134'),'vocabulary manager is not contextualised under Vocabulary & language');
assert(ui.includes('Arithmetic Domino Chain has been removed'),'internal-note removal guard is missing');
assert(css.includes('.tt99-engine-panel.tt99-engine-panel-inline')&&css.includes('grid-column:1/-1'),'inline engine settings styling missing');
assert(css.includes('.tt99-vocab-inline-v134'),'inline vocabulary styling missing');
assert(css.includes('.tt99-topics-v134 .tt99-game-topic small{display:none!important}'),'global topic counts are not suppressed');

// #2 Build-the-pack redesign.
assert(randomUi.includes('tt99-pack-builder-v134'),'compact pack-builder container missing');
assert(randomUi.includes('Number of activities'),'activity-count terminology missing');
assert(randomUi.includes('Calculated'),'derived Standard percentage is not explained');
assert(randomUi.includes('Use my selected games')&&randomUi.includes('Random compatible games &amp; puzzles'),'pack modes missing');
assert(css.includes('.tt99-pack-options-v134.is-manual'),'manual-mode reflow missing');
assert(css.includes('.tt99-random-pack-weights-v134'),'compact mixed difficulty layout missing');

// #1 header overflow strategy: broad topic selections must become a compact summary.
assert(ui.includes("return 'All maths topics'"),'all-topics header summary missing');
assert(ui.includes('selected maths topics'),'multi-topic header summary missing');
assert(ui.includes('__tt99_topic_summary__'),'PDF header topic summarisation bridge missing');
assert(css.includes('.tt99-game-paper-identity p')&&css.includes('overflow-wrap:anywhere'),'preview header wrapping guard missing');

// #5 preview containment/parity safeguards.
assert(css.includes('overflow:hidden!important')&&css.includes('contain:layout paint'),'activity-frame containment guard missing');
assert(css.includes('.tt99-game-activities.count-3 svg'),'dense 3-up SVG guard missing');
assert(css.includes('.tt99-propertymaze-grid')&&css.includes('.tt99-equation-crossgrid'),'large-grid preview bounds missing');
assert(ui.includes('auditPreviewOverflow')&&ui.includes('scrollWidth>activity.clientWidth'),'preview overflow diagnostics missing');

// Preserve the existing generators and engine registry; this batch must be presentation-only.
const G=require(path.join(ROOT,'games-arithmetic.js'));
require(path.join(ROOT,'games-crossgrid-v1321.js'));
require(path.join(ROOT,'games-property-maze.js'));
require(path.join(ROOT,'games-number-logic.js'));
require(path.join(ROOT,'games-number-path-v2.js'));
require(path.join(ROOT,'games-sumplete.js'));
const Engine=require(path.join(ROOT,'games-engine.js'));
require(path.join(ROOT,'games-pack-mode.js'));
const settings=Engine.normalizeSettings({minYear:4,maxYear:6,topics:['number_place_value','calculation'],activityCount:8,packMode:'manual',selectedEngines:['propertymaze','equationcrossgrid'],engineSettings:{propertymaze:{difficulty:'standard',gridSize:'6',propertyMode:'multiple'},equationcrossgrid:{difficulty:'standard',gridSize:'5',missingMode:'numbers'}}});
const pack=Engine.generatePack(settings,'v134-ui-regression',[]);
assert(pack.sheets?.length===4,'pack-mode generation regressed');
assert(pack.sheets.flatMap(s=>s.activities||[]).length===8,'activity count regressed');
for(const a of pack.sheets.flatMap(s=>s.activities||[]))assert(!a.error,`generation regression in ${a.engineId}: ${a.error}`);

// Marker used to ensure the final branch state receives a push-triggered QA run.
assert(app.includes('function renderGamesCard()'),'base Games UI structure missing');
console.log('Games v1.34 UI batch regression: PASS · pack UI, contextual vocabulary, inline settings, topic cleanup, PDF metadata strategy and preview containment.');
