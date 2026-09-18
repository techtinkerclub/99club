/* 99 Club Studio · Online Equation Crossgrid active-grid alignment v1.87
 * Reuses games-crossgrid-v1321.js, the same mature usability patch already used
 * by the printable generator. Online Play therefore uses true 5x5 / 7x7 / 9x9
 * active grids instead of displaying unused black border rows/columns from the
 * internal 8x8 / 10x10 construction canvas.
 */
(function(global){
'use strict';
const Play=global.TT99GamesPlay,A=global.TT99ArithmeticGames;
const adapter=Play?.adapters?.get?.('equationcrossgrid');
if(!adapter||!A||adapter.__v187ActiveGrid)return;

const DIFFS=['easy','standard','challenge'];
const SIZES=['auto','5','7','9'];
const OPS=['auto','additive','multiplicative','mixed'];
const MISSING=['auto','more_clues','balanced','fewer_clues'];
const cap=s=>String(s||'').replace(/^./,x=>x.toUpperCase());
function migrateSize(v){v=String(v??'auto');if(v==='8')return '7';if(v==='10')return '9';return SIZES.includes(v)?v:'auto';}
function normalise(c={}){return {difficulty:DIFFS.includes(c.difficulty)?c.difficulty:'standard',gridSize:migrateSize(c.gridSize),operationFamily:OPS.includes(c.operationFamily)?c.operationFamily:'auto',missingLevel:MISSING.includes(c.missingLevel)?c.missingLevel:'auto'};}
function selectHtml(c,id,label,vals,labels={}){return `<label><span>${label}</span><select data-play-opt="${id}">${vals.map(v=>`<option value="${v}" ${String(c[id])===String(v)?'selected':''}>${labels[v]||cap(v)}</option>`).join('')}</select></label>`;}

adapter.normalizeConfig=normalise;
adapter.fromQuery=function(q){const o={};if(q.has('d'))o.difficulty=q.get('d');if(q.has('n'))o.gridSize=migrateSize(q.get('n'));if(q.has('op'))o.operationFamily=q.get('op');if(q.has('m'))o.missingLevel=q.get('m');return normalise(o);};
adapter.toQuery=function(c){c=normalise(c);return {d:c.difficulty,n:c.gridSize,op:c.operationFamily,m:c.missingLevel};};
adapter.renderOptions=function(root,c,onChange){c=normalise(c);root.innerHTML=selectHtml(c,'difficulty','Difficulty',DIFFS)+selectHtml(c,'gridSize','Active grid size',SIZES,{auto:'Auto for difficulty','5':'5 × 5','7':'7 × 7','9':'9 × 9'})+selectHtml(c,'operationFamily','Operations',OPS,{auto:'Auto',additive:'Addition + subtraction',multiplicative:'Multiplication + division',mixed:'All four operations'})+selectHtml(c,'missingLevel','Missing cells',MISSING,{auto:'Auto',more_clues:'More clues',balanced:'Balanced',fewer_clues:'Fewer clues'});root.querySelectorAll('[data-play-opt]').forEach(el=>el.addEventListener('change',()=>onChange(normalise({...c,[el.dataset.playOpt]:el.value}))));};
adapter.createPuzzle=function(c,seed){c=normalise(c);const minYear=c.operationFamily==='mixed'||c.operationFamily==='multiplicative'?3:2,maxYear=c.difficulty==='challenge'?6:5,settings={minYear,maxYear,topics:['calculation','algebra'],engineSettings:{equationcrossgrid:c}};for(let i=0;i<8;i++){const p=A.generate('equationcrossgrid',settings,`${seed}:online:${i}`);if(p&&!p.error&&p.engineId==='equationcrossgrid'&&A.validate(p)?.ok)return p;}throw new Error('equationcrossgrid generation failed');};
adapter.recordKey=function(c){c=normalise(c);return `${c.difficulty}:${c.gridSize}:${c.operationFamily}:${c.missingLevel}`;};
adapter.__v187ActiveGrid=true;
})(typeof globalThis!=='undefined'?globalThis:this);
