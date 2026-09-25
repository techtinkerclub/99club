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
const toolsA=read('assets/99club/goodies-tools-a.js');
const toolsB=read('assets/99club/goodies-tools-b.js');
const app=read('assets/99club/goodies-app.js');
const css=read('assets/99club/goodies.css');
const numberLine=read('assets/99club/goodies-number-line-v6.js');

syntax('goodies-interaction.js',interaction);
syntax('goodies-tools-a.js',toolsA);
syntax('goodies-tools-b.js',toolsB);
syntax('goodies-app.js',app);

requireOrder(page,'goodies-interaction.js','goodies-tools-b.js','Goodies interaction layer');
requireText(page,'goodies-number-line-v6.js','Number Line v6 remains the active Number Line');
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

requireText(numberLine,"boardTool('delete','delete'","Number Line direct delete remains intact");
requireText(numberLine,'nl-board-rail','Number Line quiet side rail remains intact');
requireText(numberLine,'nl-challenge-reveal','Number Line contextual challenge reveal remains intact');

console.log('Goodies interaction regression checks passed.');
