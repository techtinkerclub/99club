'use strict';

const fs=require('fs');

function read(path){return fs.readFileSync(path,'utf8')}
function requireText(text,needle,label){
  if(!text.includes(needle))throw new Error(label+' missing: '+needle);
}
function requireOrder(text,a,b,label){
  const ai=text.indexOf(a),bi=text.indexOf(b);
  if(ai<0||bi<0||ai>=bi)throw new Error(label+' must load '+a+' before '+b);
}
function requireMatch(text,pattern,label){
  if(!pattern.test(text))throw new Error(label+' missing: '+pattern);
}
function syntax(path,text){
  try{new Function(text)}
  catch(err){throw new Error(path+' syntax error: '+err.message)}
}

const page=read('_pages/99-club-goodies.md');
const interaction=read('assets/99club/goodies-interaction.js');
const challenge=read('assets/99club/goodies-challenge.js');
const exporter=read('assets/99club/goodies-export.js');
const toolsA=read('assets/99club/goodies-tools-a.js');
const toolsB=read('assets/99club/goodies-tools-b.js');
const app=read('assets/99club/goodies-app.js');
const css=read('assets/99club/goodies.css');
const numberLine=read('assets/99club/goodies-number-line-v6.js');

syntax('goodies-interaction.js',interaction);
syntax('goodies-challenge.js',challenge);
syntax('goodies-export.js',exporter);
syntax('goodies-number-line-v6.js',numberLine);
syntax('goodies-tools-a.js',toolsA);
syntax('goodies-tools-b.js',toolsB);
syntax('goodies-app.js',app);

requireOrder(page,'goodies-interaction.js','goodies-challenge.js','Goodies challenge layer follows interaction layer');
requireOrder(page,'goodies-challenge.js','goodies-number-line-v6.js','Goodies challenge layer loads before Number Line');
requireOrder(page,'goodies-export.js','goodies-number-line-v6.js','Goodies export layer loads before Number Line');
requireOrder(page,'goodies-interaction.js','goodies-tools-b.js','Goodies interaction layer');
requireText(page,'goodies-number-line-v6.js','Number Line v6 remains the active Number Line');
requireMatch(page,/goodies-challenge\.js\?v=\d+/,'Goodies challenge cache-bust');
requireMatch(page,/goodies-number-line-v6\.js\?v=\d+/,'Goodies Number Line cache-bust');
requireMatch(page,/goodies-export\.js\?v=\d+/,'Goodies export cache-bust');
requireMatch(page,/goodies-interaction\.js\?v=\d+/,'Goodies interaction cache-bust');
requireMatch(page,/goodies-tools-a\.js\?v=\d+/,'Goodies tools A cache-bust');
requireMatch(page,/goodies-tools-b\.js\?v=\d+/,'Goodies tools B cache-bust');
requireMatch(page,/goodies\.css\?v=\d+/,'Goodies CSS cache-bust');
requireText(page,'sitemap: false','Goodies stays out of sitemap');
requireText(page,'robots: "noindex,nofollow,noarchive"','Goodies stays noindex');

requireText(interaction,'function mount(options)','shared controller');
requireText(interaction,"document.addEventListener('keydown',keydown)",'keyboard parity');
requireText(interaction,'el.onpointerdown','pointer/touch interaction');
requireText(interaction,"action==='delete'",'direct delete');
requireText(interaction,"action==='duplicate'",'duplicate action');
requireText(interaction,"action==='lock'",'lock action');
requireText(interaction,"e.key==='ArrowLeft'",'keyboard nudge');
requireText(interaction,"nudgeStep",'snap-aware keyboard nudge');
requireText(interaction,"e.key==='Delete'",'keyboard delete');
requireText(interaction,"e.key.toLowerCase()==='z'",'undo shortcut');
requireText(interaction,'onDragEnd','tool drag-end hook');
requireText(interaction,'if(o.nudge)','tool-specific keyboard nudge hook');

requireText(toolsB,'G.interaction','Maths Canvas uses shared interaction layer');
requireText(toolsB,'I.mount({','Maths Canvas mounts shared controller');
requireText(toolsB,'data-gd-object','Maths Canvas selectable objects');
requireText(toolsB,"I.toolButton('grid','grid'",'Maths Canvas grid action');
requireText(toolsB,'the side tools duplicate, colour, lock or delete it.','Maths Canvas direct interaction hint');

requireText(toolsB,'function coordinateTool()','Coordinate tool');
requireText(toolsB,'data-co-point','direct coordinate points');
requireText(toolsB,'nearestCoord','coordinate drag-to-grid mapping');
requireText(toolsB,'function movePoint','coordinate point movement');
requireText(toolsB,'Delete point','contextual coordinate deletion');
requireText(toolsB,"btn('Undo','co-undo')",'coordinate general undo');
requireText(toolsB,"btn('Redo','co-redo')",'coordinate redo');
requireText(toolsB,'outside this grid','non-destructive quadrant switching');
requireText(css,'.gd-co-point.is-selected','selected coordinate point styling');
requireText(css,'.gd-co-context','contextual coordinate action styling');

requireText(toolsB,'function geoboard()','Geoboard tool');
requireText(toolsB,'data-ge-vertex','direct Geoboard vertices');
requireText(toolsB,'nearestPeg','Geoboard drag-to-peg mapping');
requireText(toolsB,'function moveVertex','Geoboard vertex movement');
requireText(toolsB,'Delete vertex','contextual Geoboard deletion');
requireText(toolsB,"btn('Undo','ge-undo')",'Geoboard general undo');
requireText(toolsB,"btn('Redo','ge-redo')",'Geoboard redo');
requireText(toolsB,'Length ≈','two-point Geoboard length');
requireText(css,'.gd-ge-vertex.is-selected','selected Geoboard vertex styling');
requireText(css,'.gd-ge-context','contextual Geoboard action styling');

requireText(toolsA,'function placeValue()','Place Value tool');
requireText(toolsA,'data-pv-column','semantic Place Value columns');
requireText(toolsA,'data-pv-place','semantic counter place state');
requireText(toolsA,'function buildFromNumber','Place Value quick setup');
requireText(toolsA,'function placeFromX','drag-to-place mapping');
requireText(toolsA,'Regroup counters','Place Value regroup action');
requireText(toolsA,'onDragEnd:item','Place Value drag completion');
requireText(toolsA,'nudge:(item,dx)','Place Value keyboard place movement');
requireText(css,'.gd-pv-counter','Place Value counter styling');
requireText(css,'.gd-pv-column.is-decimal-start','Place Value decimal boundary styling');

requireText(toolsA,'function fractionWall()','Fraction Wall tool');
requireText(toolsA,'function equivalentNumerator','automatic fraction equivalence');
requireText(toolsA,'data-fw-wall','direct Fraction Wall selection');
requireText(toolsA,'data-fw-use','contextual Use as A/B actions');
requireText(toolsA,'data-fw-set','direct comparison numerator editing');
requireText(toolsA,'function directBar','improper-fraction comparison bars');
requireText(css,'.gd-fr-cell.is-equivalent','equivalent fraction highlighting');
requireText(css,'.gd-fr-focus','contextual fraction actions');
requireText(css,'.gd-fr-compare-direct','direct fraction comparison styling');

requireText(app,'G.interaction?.clear()','tool switching clears shared interaction listeners');
requireText(css,'.gd-object-rail','shared contextual rail styling');
requireText(css,'@media(hover:none),(pointer:coarse)','touch-specific interaction styling');
requireText(css,'.gd-object-canvas.has-grid','grid snapping visual');

requireText(challenge,'G.challengeKit=','shared challenge framework');
requireText(challenge,'function editorHtml','shared custom challenge editor');
requireText(challenge,'data-gd-rich-action="bold"','shared bold formatting');
requireText(challenge,'size-large','shared text-size formatting');
requireText(challenge,'function pickerHtml','shared standard challenge picker');
requireText(challenge,'data-challenge-action','shared contextual challenge action hook');
requireText(css,'.gd-challenge-action','shared classroom challenge action styling');
requireText(challenge,'answerSource','shared custom challenge answer-source state');
requireText(challenge,'custom-live-answer','shared live answer readout template');
requireText(challenge,'Type the answer myself','shared manual/live answer choice');
requireText(css,'.gd-answer-live','shared live answer styling');

requireText(numberLine,"boardTool('delete','delete'","Number Line direct delete remains intact");
requireText(numberLine,'nl-board-rail','Number Line quiet side rail remains intact');
requireText(challenge,'nl-challenge-reveal','Shared contextual challenge reveal remains intact');
requireText(numberLine,'CK.bannerHtml','Number Line uses the shared contextual challenge banner');
requireText(numberLine,"{id:'interval-value'","Number Line interval challenge");
requireText(numberLine,"{id:'estimate-position'","Number Line position challenge");
requireText(numberLine,"{id:'missing-jump'","Number Line reverse jump challenge");
requireText(numberLine,"{id:'across-zero'","Number Line across-zero challenge");
requireText(numberLine,"{id:'rounding'","Number Line rounding challenge");
requireText(numberLine,"{id:'error-scale'","Number Line reasoning challenge");
requireText(numberLine,"{id:'order-markers'","Number Line ordering challenge");
requireText(numberLine,"{id:'missing-start'","Number Line reverse-start challenge");
requireText(numberLine,"{id:'repeated-jumps'","Number Line repeated-jumps challenge");
requireText(numberLine,"{id:'mixed-number'","Number Line mixed-number challenge");
requireText(numberLine,"{id:'equivalent-fractions'","Number Line aligned equivalent-fractions challenge");
requireText(numberLine,"{id:'fdp-equivalence'","Number Line fraction-decimal-percent challenge");
requireText(numberLine,"{id:'marks-vs-spaces'","Number Line interval misconception challenge");
requireText(numberLine,'function fractionText','Number Line fraction display formatter');
requireText(numberLine,'tickStride','Number Line per-line tick density');
requireText(numberLine,"valueFormat:'percent'","Number Line percent representation");
requireText(numberLine,'syncGroup','Number Line aligned marker dependency state');
requireText(numberLine,'snapStep','Number Line linked representation snap constraint');
requireText(numberLine,'function setMarkerValue','Number Line linked marker update helper');
requireText(numberLine,'enterCustomChallenge','Number Line custom challenge mode');
requireText(numberLine,'CK.editorHtml','Number Line uses shared custom editor');
requireText(numberLine,"label:'Another like this'",'Number Line contextual repeat-challenge action');
requireText(numberLine,"repeatStandard?'Another like this':'Generate challenge'",'Number Line repeat label in challenge controls');
requireText(numberLine,'function customAnswerSources','Number Line exposes diagram answer choices');
requireText(numberLine,'function resolveCustomAnswerSource','Number Line resolves live diagram answers');
requireText(numberLine,'function setCustomAnswerSource','Number Line binds custom answers to diagram objects');
requireText(numberLine,'nl-custom-answer-source','Number Line handles live-answer selection');
requireText(numberLine,'nl-workflow-tabs','Number Line task-based workflow tabs');
requireText(numberLine,"['setup','Setup']",'Number Line setup workflow');
requireText(numberLine,"['objects','Objects']",'Number Line objects workflow');
requireText(numberLine,"['challenge','Challenge']",'Number Line challenge workflow');
requireText(numberLine,"['export','Export']",'Number Line export workflow');
requireText(numberLine,'responseLines','Number Line exported answer-space control');
requireText(numberLine,'labelSkip','Number Line dense-label collision guard');
requireText(numberLine,"const allowedScaleModes=['shared','own','zoom','linked']","Number Line teaching-line scale modes");
requireText(numberLine,'function scaleFor','Number Line per-line scale resolver');
requireText(numberLine,'function scaleModeLabel','Number Line teaching-line mode labels');
requireText(numberLine,'function defaultZoomRange','Number Line zoom interval defaults');
requireText(numberLine,'function setLineScaleMode','Number Line teaching-line mode switch');
requireText(numberLine,'function teachingConnections','Number Line zoom/double visual connections');
requireText(numberLine,'zoomFollowMarkers','Number Line live zoom-follow state');
requireText(numberLine,'function syncZoomFollowers','Number Line live zoom synchronization');
requireText(numberLine,'positionGroup','Number Line proportional marker-pair state');
requireText(numberLine,'function addLinkedPair','Number Line corresponding-pair creation');
requireText(numberLine,'function setPairAppearance','Number Line paired marker appearance synchronization');
requireText(numberLine,'function resyncPositionGroups','Number Line paired marker scale resynchronization');
requireText(numberLine,'The main number line is the reference line and cannot be deleted.','Number Line reference-line deletion guard');
requireText(numberLine,'nl-add-correspondence','Number Line corresponding-pair action');
requireText(numberLine,'data-position-group','Number Line proportional marker-pair SVG identity');
requireText(numberLine,'nl-linked-pair-guide','Number Line paired correspondence guide');
requireText(numberLine,'nl-fit-zoom-markers','Number Line fast zoom-to-markers action');
requireText(numberLine,'function snapOnLine','Number Line per-line snapping');
requireText(numberLine,'data-nl-scale-mode="own"','Number Line own-scale control');
requireText(numberLine,'nl-line-min','Number Line own-scale minimum control');
requireText(css,'.nl-scale-mode','Number Line scale-mode styling');
requireText(css,'.nl-scale-mode--four','Number Line four teaching-line choices');
requireText(css,'.nl-add-line-row','Number Line compact teaching-line creation');
requireText(css,'.nl-linked-marker-tag','Number Line paired marker styling');
requireText(css,'.nl-zoom-follow','Number Line live zoom control styling');
requireText(exporter,'function composeChallengeCardSvg','shared challenge card export composer');
requireText(exporter,"responseLabel='Answer'",'shared exported response box');

console.log('Goodies interaction regression checks passed.');
