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
function syntax(path,text){
  try{new Function(text)}
  catch(err){throw new Error(path+' syntax error: '+err.message)}
}

const page=read('_pages/99-club-goodies.md');
const interaction=read('assets/99club/goodies-interaction.js');
const toolsB=read('assets/99club/goodies-tools-b.js');
const app=read('assets/99club/goodies-app.js');
const css=read('assets/99club/goodies.css');
const numberLine=read('assets/99club/goodies-number-line-v6.js');

syntax('goodies-interaction.js',interaction);
syntax('goodies-tools-b.js',toolsB);
syntax('goodies-app.js',app);

requireOrder(page,'goodies-interaction.js','goodies-tools-b.js','Goodies interaction layer');
requireText(page,'goodies-number-line-v6.js','Number Line v6 remains the active Number Line');
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

requireText(toolsB,'G.interaction','Maths Canvas uses shared interaction layer');
requireText(toolsB,'I.mount({','Maths Canvas mounts shared controller');
requireText(toolsB,'data-gd-object','Maths Canvas selectable objects');
requireText(toolsB,"I.toolButton('grid','grid'",'Maths Canvas grid action');
requireText(toolsB,'the side tools duplicate, colour, lock or delete it.','Maths Canvas direct interaction hint');

requireText(app,'G.interaction?.clear()','tool switching clears shared interaction listeners');
requireText(css,'.gd-object-rail','shared contextual rail styling');
requireText(css,'@media(hover:none),(pointer:coarse)','touch-specific interaction styling');
requireText(css,'.gd-object-canvas.has-grid','grid snapping visual');

requireText(numberLine,"boardTool('delete','delete'","Number Line direct delete remains intact");
requireText(numberLine,'nl-board-rail','Number Line quiet side rail remains intact');
requireText(numberLine,'nl-challenge-reveal','Number Line contextual challenge reveal remains intact');

console.log('Goodies interaction regression checks passed.');
