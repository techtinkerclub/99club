'use strict';
const assert=require('assert');
const path=require('path');

require(path.join(__dirname,'..','games-vocabulary.js'));
require(path.join(__dirname,'..','games-arithmetic.js'));
require(path.join(__dirname,'..','games-engine.js'));

const adapters=new Map();
global.TT99GamesPlay={
  adapters,
  gameList:[],
  registerAdapter(id,a){assert.strictEqual(id,a.id);adapters.set(id,a);this.gameList.push(a);}
};
require(path.join(__dirname,'..','games-play-final-catalogue-v186.js'));

for(const id of ['symbols','functionmachine','balance','crossword']){
  assert(adapters.has(id),`${id} adapter was not registered`);
  const a=adapters.get(id);
  assert.strictEqual(typeof a.createPuzzle,'function',`${id} missing generator bridge`);
  assert.strictEqual(typeof a.mount,'function',`${id} missing mount`);
  assert.strictEqual(typeof a.renderOptions,'function',`${id} missing options`);
  const c=a.normalizeConfig({difficulty:'challenge'});
  const q=a.toQuery(c);
  const back=a.normalizeConfig(a.fromQuery(new URLSearchParams(q)));
  assert.strictEqual(back.difficulty,'challenge',`${id} query roundtrip lost difficulty`);
}

const A=global.TT99ArithmeticGames;
function validArithmetic(id,config,seed){
  const a=adapters.get(id),p=a.createPuzzle(config,seed);
  assert.strictEqual(p.engineId,id,`${id} wrong engine`);
  const v=A.validate(p);assert(v.ok,`${id} invalid: ${v.error||'unknown'}`);
  return p;
}

for(const difficulty of ['easy','standard','challenge']){
  const s=validArithmetic('symbols',{difficulty,symbolCount:difficulty==='challenge'?'3':'2',equationStyle:difficulty==='challenge'?'coefficients':'additive'},`v186:symbols:${difficulty}`);
  assert(s.names.length>=2&&s.values.length===s.names.length,'symbol values missing');
  assert(s.equations.length>=2,'symbol equations missing');

  const f=validArithmetic('functionmachine',{difficulty,stages:difficulty==='easy'?'1':difficulty==='challenge'?'3':'2',rowCount:'6',direction:difficulty==='standard'?'reverse':'auto'},`v186:machine:${difficulty}`);
  assert.strictEqual(f.rows.length,6,'function machine row count');
  assert(f.operations.length>=1&&f.operations.length<=3,'function machine stages');
  assert(f.rows.every(r=>r.hide==='input'||r.hide==='output'),'function machine missing-side marker');

  const b=validArithmetic('balance',{difficulty,rowCount:difficulty==='challenge'?'8':'6',style:difficulty==='challenge'?'expression':'number'},`v186:balance:${difficulty}`);
  assert(b.rows.length>=6,'balance rows missing');
  assert(b.rows.every(r=>String(r.display).includes('□')&&Number.isFinite(Number(r.answer))),'balance row malformed');
}

const cw=adapters.get('crossword');
for(const difficulty of ['easy','standard','challenge']){
  const p=cw.createPuzzle({difficulty,area:difficulty==='challenge'?'geometry':'all',wordCount:difficulty==='easy'?'6':difficulty==='challenge'?'10':'8',gridSize:difficulty==='challenge'?'17':'auto',wordBank:difficulty==='easy'?'show':'hide'},`v186:crossword:${difficulty}`);
  assert.strictEqual(p.engineId,'crossword');
  assert(p.entries.length>=4,'crossword too few entries');
  assert(p.width>0&&p.height>0&&p.grid.length===p.height,'crossword dimensions malformed');
  const numbers=new Set();
  for(const e of p.entries){
    assert(Number.isInteger(e.number)&&e.number>0,'crossword clue number missing');
    numbers.add(e.number);
    assert(['across','down'].includes(e.dir),'crossword direction invalid');
    assert.strictEqual(e.cells.length,String(e.answer).length,'crossword answer/cell mismatch');
    e.cells.forEach(([x,y],i)=>assert.strictEqual(p.grid[y][x],String(e.answer)[i],`crossword grid mismatch ${e.number}${e.dir}`));
  }
  assert(numbers.size>=2,'crossword numbering collapsed');
}

const js=require('fs').readFileSync(path.join(__dirname,'..','games-play-final-catalogue-v186.js'),'utf8');
assert(!/96vw/.test(js),'legacy viewport sizing found');
const css=require('fs').readFileSync(path.join(__dirname,'..','games-play-final-catalogue-v186.css'),'utf8');
assert(/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/.test(css),'numeric keypad is not four columns');
assert(/aspect-ratio:var\(--cw\)\/var\(--ch\)/.test(css),'crossword aspect ratio missing');

console.log('v1.86 final catalogue smoke tests passed');
